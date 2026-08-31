// **version:** 1.0.0
// **location:** level-5 phase 2 (experimental, one-off)
// © Oskey SAS. All rights reserved.
//
// ONE-OFF feasibility test, NOT wired into the real pipeline. Real question:
// governance/roadmap/firebase-oskey-dev/08-module-level-consolidation-
// feasibility.md -- does the per-capability fan-out (one LLM call per
// submodule + one reduce call, 2026-08-01) still solve a real problem, given
// the compact-table encoding fix that landed the same day and was never
// re-checked against the original overflow number? Builds ONE real prompt
// covering an ENTIRE module's facts (not split per capability) against
// contracts/EXPERIMENTAL-module-level-synthesis.md, makes ONE real call, and
// reports real token usage for direct comparison against today's N+1 calls.

import "dotenv/config";
import fs from "fs";
import path from "path";
import { readRequiredFile, resolveContractsRootAbs, loadDocs, runDocumentCalls, DocumentCallSpec } from "../_shared/synthesis-orchestrator";
import { LlmProviderConfig, CACHE_BREAKPOINT_MARKER } from "../_shared/llm-adapter";
import { flattenRbacRoles } from "../_shared/rbac-flatten";
import { filterCallEdgesForModule, formatCallEdges, filterUnresolvedCallEdgesForModule, formatUnresolvedCallEdges } from "../_shared/call-edges";
import { filterRbacRequirementsForModule, formatRbacCatalog } from "../_shared/rbac-catalog";
import { computeOwnershipHints, formatOwnershipHints } from "../_shared/ownership-hints";
import {
  factsToCompactTableShortIds,
  restoreFactIdCitations,
  findUnrestoredShortIdCitations,
  renderCitationsAsFootnotes,
  formatEvidenceAppendix,
  resolveFootnotesForValidation,
  addBlankLinesBetweenTopLevelBullets,
} from "../../phase-01-ast-extraction/_shared/run-utils";
import { validateCitations, formatCitationValidation } from "../_shared/citation-validator";
import { buildPublicInterfacesSection, buildApiContractsSection, buildExternalHooksSection } from "../_shared/capability-synthesis";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "EXPERIMENTAL-module-level-test";

interface ParsedCapability {
  name: string;
  sections: Map<string, string>;
}

/** Splits text on "### <name>" level-3 headers -- the LLM's own per-
 * capability / module-wide subsection convention in this contract (named
 * headers, not the numbered "### N. Title" convention splitNumberedSections
 * handles -- a different parser is needed here, not a reuse). */
function splitByNamedHeader(text: string): Map<string, string> {
  const matches = Array.from(text.matchAll(/^### (.+)$/gm));
  const result = new Map<string, string>();
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    // Trailing "---" the model sometimes adds as its own visual separator
    // before the next "## CAPABILITY:" block isn't part of this section's
    // real content -- strip it so it doesn't leak into the assembled
    // document as a stray artifact. Found 2026-08-30 during a real read-
    // through of the assembled apps document.
    result.set(name, text.slice(start, end).trim().replace(/\n+---\s*$/, "").trim());
  }
  return result;
}

/** Splits the whole response on "## MODULE-WIDE" / "## CAPABILITY: <name>"
 * level-2 headers, then each block's own level-3 subsections. */
function parseModuleLevelResponse(text: string): { moduleWide: Map<string, string>; capabilities: ParsedCapability[] } {
  const blocks = text.split(/\n(?=## )/);
  const moduleWide = new Map<string, string>();
  const capabilities: ParsedCapability[] = [];
  for (const block of blocks) {
    const headerMatch = block.match(/^## (.+)\n/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim();
    const body = block.slice(headerMatch[0].length);
    if (header === "MODULE-WIDE") {
      for (const [name, subBody] of splitByNamedHeader(body)) moduleWide.set(name, subBody);
    } else if (header.startsWith("CAPABILITY:")) {
      capabilities.push({ name: header.slice("CAPABILITY:".length).trim(), sections: splitByNamedHeader(body) });
    }
  }
  return { moduleWide, capabilities };
}

const MAX_SAMPLE_TOUCHPOINTS = 3;

/** Formats the intra-module coupling graph compactly instead of dumping its
 * raw JSON -- real finding 2026-08-30 (read-through of the assembled `apps`
 * document): the raw dump is already 13x bigger for `organization`
 * (43,549 chars) than `apps` (3,305 chars) and scales combinatorially with
 * submodule count and touchpoint density, exactly the "same problem the two
 * graph artifacts had before" pattern call-edges.ts's own header comment
 * already documented and fixed for cross-module edges -- this applies the
 * identical group-and-cap treatment to the intra-module graph, which never
 * got it. */
function formatIntraModuleCoupling(raw: string): string {
  const data = JSON.parse(raw);
  const lines: string[] = [];
  const submoduleNames = Object.keys(data.submodules ?? {}).sort();
  for (const name of submoduleNames) {
    const entry = data.submodules[name];
    const outbound = entry.outbound ?? [];
    const inbound = entry.inbound ?? [];
    if (outbound.length === 0 && inbound.length === 0) continue;
    lines.push(`**${name}**`);
    for (const o of outbound) {
      const touchpoints = o.touchpoints ?? [];
      const sample = touchpoints.slice(0, MAX_SAMPLE_TOUCHPOINTS).map((t: any) => `${t.file}:${t.line}`).join(", ");
      const suffix = touchpoints.length > MAX_SAMPLE_TOUCHPOINTS ? ` (${touchpoints.length} touchpoints, e.g. ${sample})` : ` (${sample})`;
      lines.push(`  -> ${o.targetSubmodule}${suffix}`);
    }
    for (const i of inbound) {
      const touchpoints = i.touchpoints ?? [];
      const sample = touchpoints.slice(0, MAX_SAMPLE_TOUCHPOINTS).map((t: any) => `${t.file}:${t.line}`).join(", ");
      const suffix = touchpoints.length > MAX_SAMPLE_TOUCHPOINTS ? ` (${touchpoints.length} touchpoints, e.g. ${sample})` : ` (${sample})`;
      lines.push(`  <- ${i.sourceSubmodule}${suffix}`);
    }
  }
  return lines.length > 0 ? lines.join("\n") : "(no intra-module coupling evidenced)";
}

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const MODULE_NAME = process.env.MODULE_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;
  if (!REPO_NAME || !MODULE_NAME || !LLM_CONFIG_KEY) throw new Error("REPO_NAME, MODULE_NAME, LLM_CONFIG_KEY all required.");

  const runCtxPath = path.join(projectRoot, "output", REPO_NAME, "run-context.json");
  const runContext = JSON.parse(readRequiredFile(runCtxPath, "run-context.json"));
  const runId: string = runContext.runId;
  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);

  const llmProvidersConfig = JSON.parse(readRequiredFile(path.join(projectRoot, "config", "llm-providers.json"), "llm-providers.json"));
  const llmConfig: LlmProviderConfig = llmProvidersConfig.providers?.[LLM_CONFIG_KEY];
  if (!llmConfig) throw new Error(`LLM_CONFIG_KEY '${LLM_CONFIG_KEY}' not found.`);

  const repoConfig = JSON.parse(readRequiredFile(path.join(projectRoot, "config", "repos.json"), "repos.json"));
  const targetRepoCfg = repoConfig.repositories.find((r: any) => r.name === REPO_NAME);
  const capCfg = targetRepoCfg.phase2.capabilityBasedProfile;

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, capCfg);
  const groundingDocs = loadDocs(contractsRootAbs, capCfg.architecturalGroundingPaths, "architectural grounding doc");
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) doc.content = flattenRbacRoles(doc.content);
  }

  // The one new contract this test is actually about -- not registered in
  // config/repos.json, loaded directly since this script never runs for real.
  const experimentalContractPath = path.join(
    projectRoot,
    "pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/EXPERIMENTAL-module-level-synthesis.md"
  );
  const experimentalContract = readRequiredFile(experimentalContractPath, "experimental module-level contract");

  // --- Load and COMBINE every capability's facts for this module (the whole point of this test) ---
  const packsDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME, "capability-packs");
  const packNames = fs.readdirSync(packsDir).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, "")).sort();
  let allFacts: any[] = [];
  for (const packName of packNames) {
    const pack = JSON.parse(readRequiredFile(path.join(packsDir, `${packName}.json`), `capability pack '${packName}'`));
    allFacts = allFacts.concat(pack.facts);
  }
  const { table: compactFacts, idMap } = factsToCompactTableShortIds(allFacts);

  const resolvedGraph = JSON.parse(readRequiredFile(path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json"), "resolved graph"));
  const callEdgesForModule = filterCallEdgesForModule(resolvedGraph, MODULE_NAME);
  const rbacRowsForModule = filterRbacRequirementsForModule(resolvedGraph, MODULE_NAME);
  const unresolvedCallEdgesForModule = filterUnresolvedCallEdgesForModule(resolvedGraph, MODULE_NAME);

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, "evidence graph (ownership hints only)"));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  const crossModuleDepsRaw = readRequiredFile(path.join(moduleDir, "cross-module-dependencies.json"), "cross-module deps");
  const intraModuleCouplingRaw = readRequiredFile(path.join(moduleDir, "intra-module-coupling.json"), "intra-module coupling");

  // Stable (contract + grounding docs -- identical across every module in a
  // run, the only part actually worth caching per governance/roadmap/
  // firebase-oskey-dev/09-fact-table-redundancy-reduction.md's own finding)
  // vs. variable (everything module-specific: graphs, facts, metadata).
  // Split with CACHE_BREAKPOINT_MARKER, same convention capability-
  // synthesis.ts and 01c already use -- callGemini decides what to do with
  // it; this script doesn't need its own caching logic.
  const stableSections: string[] = [];
  stableSections.push(`## Supporting Contract\n\n${experimentalContract}`);
  stableSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);

  const variableSections: string[] = [];
  variableSections.push(`## Cross-Module Dependency Graph (deterministic)\n\n\`\`\`json\n${crossModuleDepsRaw}\n\`\`\``);
  variableSections.push(`## Intra-Module Coupling Graph (deterministic)\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``);
  variableSections.push(`## Resolved Cross-Module Call Edges (deterministic)\n\n${formatCallEdges(callEdgesForModule)}`);
  variableSections.push(`## Data Ownership Hints (deterministic signal)\n\n${formatOwnershipHints(ownershipHints)}`);
  variableSections.push(`## RBAC Requirements Catalog (deterministic, module-filtered)\n\n${formatRbacCatalog(rbacRowsForModule)}`);
  variableSections.push(`## Unresolved Call Edges (deterministic, module-filtered)\n\n${formatUnresolvedCallEdges(unresolvedCallEdgesForModule)}`);
  variableSections.push(`## ALL Capability Facts for Module '${MODULE_NAME}' (${allFacts.length} facts total, ${packNames.length} capabilities: ${packNames.join(", ")})\n\n${compactFacts}`);
  variableSections.push(`## Generation Metadata\n\n- runId: ${runId}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}`);

  const relPath = `${MODULE_NAME}-module-level-synthesis.md`;
  variableSections.push(
    `## Output Format reminder\n\nProduce exactly one file wrapped as:\n\n===FILE: ${relPath}===\n<content per the contract's Output Format section>\n===END FILE===`
  );

  const prompt = stableSections.join("\n\n---\n\n") + CACHE_BREAKPOINT_MARKER + variableSections.join("\n\n---\n\n");
  console.log(`Prompt built: ${prompt.length} chars, ${allFacts.length} facts across ${packNames.length} capabilities.`);

  // Loud-failure safety check (governance/roadmap/firebase-oskey-dev/10-
  // module-level-production-cutover-plan.md Part A Step 2): batching a
  // module too large for one call is explicitly deferred, not solved --
  // this is the one thing standing between "deferred" and "silently
  // needed and nobody notices." CHARS_PER_TOKEN=3.6 is a deliberately
  // conservative (slightly overestimates tokens, erring toward caution)
  // real ratio measured this session (the largest real tested prompt,
  // organization's 1,441,458 chars, reported 382,602 real tokens --
  // ratio ~3.77; 3.6 is intentionally a bit lower/stricter than that).
  // MAX_SAFE_ESTIMATED_TOKENS=700,000 gives real headroom above the
  // largest module actually tested (organization, ~383K real tokens) for
  // organic repo growth, while staying well clear of context-window risk
  // no confirmed real ceiling exists for this model as of this writing
  // (checked Google's docs and the Vertex AI models.get() API directly --
  // neither exposed a usable number) -- this is a deliberate, named
  // safety margin, not a guess at the model's true limit.
  const CHARS_PER_TOKEN = 3.6;
  const MAX_SAFE_ESTIMATED_TOKENS = 700_000;
  const estimatedTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN);
  if (estimatedTokens > MAX_SAFE_ESTIMATED_TOKENS) {
    throw new Error(
      `[MODULE_TOO_LARGE_FOR_SINGLE_CALL] Module '${MODULE_NAME}' has an estimated ${estimatedTokens.toLocaleString()} prompt tokens (${prompt.length.toLocaleString()} chars / ${CHARS_PER_TOKEN} chars-per-token), exceeding the ${MAX_SAFE_ESTIMATED_TOKENS.toLocaleString()}-token safety threshold. ` +
        `This module needs the deferred capability-batching design (governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-plan.md Part A Step 2) before it can be synthesized in one call -- do not silently proceed, do not fall back to truncating the fact table.`
    );
  }

  const outputDir = path.join(repoOutputDir, "EXPERIMENTAL-module-level", MODULE_NAME);
  const spec: DocumentCallSpec = { relPath, prompt, kind: "module-level-experimental" };
  const notifications = { schemaVersion: "1.0.0", runId, repoName: REPO_NAME, updatedAt: new Date().toISOString(), highestSeverity: "info" as const, entries: [] };
  const written = await runDocumentCalls([spec], llmConfig, outputDir, notifications as any, SOURCE_SCRIPT, `module '${MODULE_NAME}' (module-level experimental)`, LLM_CONFIG_KEY);

  // Restore short IDs (F1, F2, ...) back to real fact IDs before this
  // becomes the persisted document -- the short-ID scheme must never leak
  // past this one round-trip. Overwrites the raw response on disk with the
  // restored version, same file, so nothing downstream (including a human
  // reading it) ever sees a short reference.
  const rawResponse = written.get(relPath)!;
  const restored = restoreFactIdCitations(rawResponse, idMap);
  const outPath = path.join(outputDir, relPath);
  fs.writeFileSync(outPath, restored, "utf8");
  console.log(`Wrote (short IDs restored to real fact IDs): ${outPath}`);

  const rawShortIdCount = (rawResponse.match(/`{2}\s*`F\d+`\s*`{2}/g) || []).length;
  const stillShortAfterRestore = (restored.match(/`{2}\s*`F\d+`\s*`{2}/g) || []).length;
  console.log(`Short-ID citations found in raw response: ${rawShortIdCount}; still short after restore (should be 0): ${stillShortAfterRestore}`);

  const unrestored = findUnrestoredShortIdCitations(restored);
  if (unrestored.length > 0) {
    console.warn(`[SHORT_ID_RESTORATION_INCOMPLETE] ${unrestored.length} malformed/unrestored short-ID citation(s) survived into the final text -- these are silent, unverifiable claims: ${JSON.stringify(unrestored)}`);
  }

  // --- Assemble the FINAL document into the same 0-14 structure today's
  // real production output uses, per governance/roadmap/firebase-oskey-dev/
  // 10-module-level-production-cutover-plan.md Part A Step 1 -- Sections 3,
  // 4, and 11 (External Hooks) are deterministically assembled per
  // capability from that capability's own facts subset (Section 5 stays
  // LLM-authored, confirmed not a clean deterministic win). Section 10 is
  // rendered directly from the already-computed call-edges graph, same data
  // the prompt itself used. ---
  const factsByCapability = new Map<string, any[]>();
  for (const f of allFacts) {
    const key = f.submodule ?? "_module_root";
    const arr = factsByCapability.get(key) ?? [];
    arr.push(f);
    factsByCapability.set(key, arr);
  }
  const parsed = parseModuleLevelResponse(restored);
  const capByName = new Map(parsed.capabilities.map(c => [c.name, c]));

  const assembleAcross = (sectionName: string, builder?: (facts: any[]) => string): string =>
    packNames
      .map(pn => {
        const facts = factsByCapability.get(pn) ?? [];
        const body = builder ? builder(facts) : capByName.get(pn)?.sections.get(sectionName) ?? "*(not produced for this capability)*";
        return `#### ${pn}\n\n${body}`;
      })
      .join("\n\n");

  const finalParts: string[] = [];
  finalParts.push(`### 0. Generation Metadata\n\n- runId: ${runId}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}`);
  finalParts.push(`### 1. Executive Summary\n\n${parsed.moduleWide.get("Executive Summary") ?? "*(not produced)*"}`);
  finalParts.push(`### 2. Architectural Position\n\n${parsed.moduleWide.get("Architectural Position") ?? "*(not produced)*"}`);
  finalParts.push(`### 3. Primary Responsibilities\n\n${assembleAcross("Primary Responsibilities")}`);
  finalParts.push(`### 4. Public Interfaces\n\n${assembleAcross("", facts => buildPublicInterfacesSection(facts))}`);
  finalParts.push(`### 5. Internal Structure (deterministic, from the Intra-Module Coupling Graph)\n\n${formatIntraModuleCoupling(intraModuleCouplingRaw)}`);
  finalParts.push(
    `### 6. Firestore & Data Ownership\n\n**Ownership conclusion:**\n\n${parsed.moduleWide.get("Ownership Conclusion") ?? "*(not produced)*"}\n\n**Per-capability evidence:**\n\n${assembleAcross("Data Ownership")}`
  );
  finalParts.push(`### 7-8. API Endpoints & Firestore Triggers\n\n${assembleAcross("", facts => buildApiContractsSection(facts))}`);
  finalParts.push(
    `### 9. Permissions & Security\n\n**Cross-cutting risk callouts:**\n\n${parsed.moduleWide.get("Cross-Cutting Permissions & Security Risks") ?? "*(not produced)*"}\n\n**Per-capability evidence:**\n\n${assembleAcross("Notable Permissions Observations")}`
  );
  finalParts.push(`### 10. Cross-Module Relationships (deterministic)\n\n${formatCallEdges(callEdgesForModule)}`);
  finalParts.push(`### 11. External Hooks\n\n${assembleAcross("", facts => buildExternalHooksSection(facts))}`);
  finalParts.push(`### 12. Architectural Observations\n\n${parsed.moduleWide.get("Architectural Observations") ?? "*(not produced)*"}`);
  finalParts.push(
    `### 13. Risks & Open Questions\n\n**Cross-cutting risks:**\n\n${parsed.moduleWide.get("Cross-Cutting Risks & Open Questions") ?? "*(not produced)*"}\n\n**Per-capability open questions:**\n\n${assembleAcross("Open Questions")}`
  );
  // Footnote every citation in the body (Sections 0-13) instead of leaving
  // the real fact-ID/file-line text inline -- real, user-driven finding
  // 2026-08-30: dense inline citations made the assembled document
  // dramatically harder to read than an old (2026-08-01) reference document
  // that used no citations at all. This keeps every claim exactly as
  // checkable (renderCitationsAsFootnotes/resolveFootnotesForValidation
  // round-trip losslessly for validation) while making the prose read like
  // that old document -- a short "(FactId:#001)" marker, with the real
  // content in a genuine Section 14 appendix instead of the promissory
  // "see inline citations above" note every document (old and new) wrote
  // instead of an actual list.
  // Section 0 (Generation Metadata) is a compact key-value block, not
  // narrative bullets -- excluded from blank-line spacing (real finding
  // 2026-08-30: applying it there just spaced out runId/repoName/etc. for
  // no reading benefit) by only spacing finalParts[1:] onward.
  const bodyWithInlineCitations = finalParts.join("\n\n");
  const { body: bodyWithFootnotesRaw, appendix } = renderCitationsAsFootnotes(bodyWithInlineCitations);
  const section0Marker = "### 1. Executive Summary";
  const section0End = bodyWithFootnotesRaw.indexOf(section0Marker);
  const bodyWithFootnotes =
    section0End === -1
      ? addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw)
      : bodyWithFootnotesRaw.slice(0, section0End) + addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw.slice(section0End));
  const section14 = `### 14. Evidence References\n\n${formatEvidenceAppendix(appendix)}`;
  const finalDocument = `${bodyWithFootnotes}\n\n${section14}`;
  // Suffixed "-FOOTNOTED" deliberately, not overwriting the existing
  // "-FINAL-ASSEMBLED.md" -- so a before/after comparison stays possible
  // rather than clobbering the version already being reviewed.
  const finalOutPath = path.join(outputDir, `${MODULE_NAME}-FINAL-ASSEMBLED-FOOTNOTED.md`);
  fs.writeFileSync(finalOutPath, finalDocument, "utf8");
  console.log(`Wrote FINAL assembled document (0-14 structure, footnoted citations): ${finalOutPath}`);
  console.log(`Evidence appendix: ${appendix.length} unique citations (deduplicated from the pre-footnote document).`);

  const missingModuleWide = ["Executive Summary", "Architectural Position", "Ownership Conclusion", "Cross-Cutting Permissions & Security Risks", "Architectural Observations", "Cross-Cutting Risks & Open Questions"].filter(
    k => !parsed.moduleWide.has(k)
  );
  const missingCapabilities = packNames.filter(pn => !capByName.has(pn));
  console.log(`Parsed ${parsed.capabilities.length} of ${packNames.length} expected capabilities. Missing module-wide sections: ${missingModuleWide.join(", ") || "(none)"}. Missing capabilities: ${missingCapabilities.join(", ") || "(none)"}.`);

  // Validate against a reconstructed, real-citation-inline version -- never
  // persisted, exists only so validateCitations (which looks for real fact
  // IDs/file-lines in the text) can check a footnoted document exactly like
  // it always has, rather than needing its own footnote-aware rewrite.
  const evidenceGraphPath2 = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraph = JSON.parse(readRequiredFile(evidenceGraphPath2, "evidence graph (citation validation)"));
  const resolvedForValidation = resolveFootnotesForValidation(bodyWithFootnotes, appendix);
  const validation = validateCitations(resolvedForValidation, evidenceGraph.facts);
  console.log("Citation validation (footnotes resolved back to real citations for checking):", formatCitationValidation(validation));

  const completedEntry = (notifications.entries as any[]).find(e => e.code === "SYNTHESIS_LLM_CALL_COMPLETED");
  console.log("Real usage:", JSON.stringify(completedEntry?.details?.usage));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

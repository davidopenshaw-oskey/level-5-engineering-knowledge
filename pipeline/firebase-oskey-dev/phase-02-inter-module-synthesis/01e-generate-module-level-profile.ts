// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Production module-level synthesis: ONE LLM call synthesizes an entire
// module's capabilities together (module-wide cross-cutting sections +
// every capability's own judgment sections), replacing the per-capability
// fan-out + reduce chain (01a/01c/01d) as the default for any module under
// the loud-failure size threshold below. Promoted from a real feasibility
// test after confirming the fan-out (built 2026-08-01 to fix a real
// context-window overflow) was solving a problem the same-day compact-
// table-encoding fix had already independently solved -- see
// governance/roadmap/firebase-oskey-dev/09-fact-table-redundancy-
// reduction.md and 10-module-level-production-cutover-plan.md for the full
// real, verified findings this script's design is built on.
//
// 01a/01c/01d and contracts/00-capability-synthesis.md/01-module-synthesis-
// reduce.md are NOT retired -- kept as the deliberate fallback for a module
// that ever exceeds MAX_SAFE_ESTIMATED_TOKENS below (batching a module
// across multiple calls is explicitly deferred, not solved here).

import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
  factsToCompactTableShortIds,
  formatEvidenceAppendix,
  resolveFootnotesForValidation,
  addBlankLinesBetweenTopLevelBullets,
} from "../phase-01-ast-extraction/_shared/run-utils";
import { callLlm, LlmProviderConfig, CACHE_BREAKPOINT_MARKER } from "./_shared/llm-adapter";
import { readRequiredFile, resolveContractsRootAbs, loadDocs } from "./_shared/synthesis-orchestrator";
import { flattenRbacRoles } from "./_shared/rbac-flatten";
import { filterCallEdgesForModule, formatCallEdges, filterUnresolvedCallEdgesForModule, formatUnresolvedCallEdges } from "./_shared/call-edges";
import { filterRbacRequirementsForModule, formatRbacCatalog } from "./_shared/rbac-catalog";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { writeProvenanceSidecar } from "./_shared/provenance-sidecar";
import { buildPublicInterfacesSection, buildApiContractsSection, buildExternalHooksSection } from "./_shared/capability-synthesis";
import { renderStructuredModuleProfile, validateStructuredResponse, StructuredModuleResponse } from "./_shared/structured-output-render";
import { MODULE_LEVEL_RESPONSE_SCHEMA } from "./_shared/structured-output-schema";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01e-generate-module-level-profile";

interface ModuleLevelProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  moduleLevelSynthesisContractPaths: string[];
}

const MAX_SAMPLE_TOUCHPOINTS = 3;

/** Formats the intra-module coupling graph compactly instead of dumping raw
 * JSON -- real finding 2026-08-30: the raw dump was already 13x bigger for
 * `organization` (43,549 chars) than `apps` (3,305 chars), scaling
 * combinatorially with submodule count -- the same problem call-edges.ts's
 * own header comment already documented and fixed for cross-module edges,
 * applied here for the intra-module graph, which never got it. */
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

// Matches 01c's own threshold (real measured healthy-vs-degenerate samples).
// Only applied to executiveSummary/architecturalPosition -- the schema's
// finding ARRAYS (crossCuttingPermissionsRisks etc.) are legitimately empty
// when nothing stands out (the contract explicitly tells the model not to
// pad them), unlike the old free-text contract where even a "nothing found"
// section always had real prose -- so array length alone is not a
// completeness signal here the way non-empty-vs-empty text was before.
const MIN_JUDGMENT_SECTION_CHARS = 200;

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const MODULE_NAME = process.env.MODULE_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;
  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  if (!MODULE_NAME) throw new Error("[Fail-Closed] MODULE_NAME environment variable is required and was not set.");
  if (!LLM_CONFIG_KEY) throw new Error("[Fail-Closed] LLM_CONFIG_KEY environment variable is required and was not set.");

  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Run the Phase 1 pipeline first.`);
  }
  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications: RunNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const llmProvidersConfigPath = path.join(projectRoot, "config", "llm-providers.json");
  const llmProvidersConfig = JSON.parse(readRequiredFile(llmProvidersConfigPath, "config/llm-providers.json"));
  const llmConfig: LlmProviderConfig = llmProvidersConfig.providers?.[LLM_CONFIG_KEY];
  if (!llmConfig) {
    const available = Object.keys(llmProvidersConfig.providers || {}).join(", ");
    throw new Error(`[Fail-Closed] LLM_CONFIG_KEY '${LLM_CONFIG_KEY}' not found in config/llm-providers.json. Available: ${available}`);
  }

  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(readRequiredFile(repoConfigPath, "config/repos.json"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  if (!targetRepoCfg) throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  if (!targetRepoCfg.phase2?.moduleLevelProfile) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' has no phase2.moduleLevelProfile configured in config/repos.json.`);
  }
  const cfg: ModuleLevelProfileConfig = targetRepoCfg.phase2.moduleLevelProfile;

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();
  if (!moduleNames.includes(MODULE_NAME)) {
    throw new Error(`[Fail-Closed] Module '${MODULE_NAME}' not found in this run's facts/modules.json. Available (${moduleNames.length}): ${moduleNames.join(", ")}`);
  }

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, cfg);
  const groundingDocs = loadDocs(contractsRootAbs, cfg.architecturalGroundingPaths, "architectural grounding doc");
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) doc.content = flattenRbacRoles(doc.content);
  }
  const contractDocs = loadDocs(contractsRootAbs, cfg.moduleLevelSynthesisContractPaths, "module-level synthesis contract doc");
  const contractText = contractDocs.map(d => `### ${d.relPath}\n\n${d.content}`).join("\n\n");

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  if (!fs.existsSync(packsDir)) {
    throw new Error(`[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'.`);
  }
  const packNames = fs
    .readdirSync(packsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
    .sort();
  if (packNames.length === 0) {
    throw new Error(`[Fail-Closed] Capability-packs directory for module '${MODULE_NAME}' is empty at '${packsDir}'.`);
  }

  let allFacts: any[] = [];
  for (const packName of packNames) {
    const pack = JSON.parse(readRequiredFile(path.join(packsDir, `${packName}.json`), `capability pack '${packName}'`));
    allFacts = allFacts.concat(pack.facts);
  }
  const { table: compactFacts, idMap } = factsToCompactTableShortIds(allFacts);

  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  const callEdgesForModule = filterCallEdgesForModule(resolvedGraph, MODULE_NAME);
  const rbacRowsForModule = filterRbacRequirementsForModule(resolvedGraph, MODULE_NAME);
  const unresolvedCallEdgesForModule = filterUnresolvedCallEdgesForModule(resolvedGraph, MODULE_NAME);

  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}'`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  const crossModuleDepsRaw = readRequiredFile(path.join(moduleDir, "cross-module-dependencies.json"), `cross-module dependency graph for module '${MODULE_NAME}'`);
  const intraModuleCouplingRaw = readRequiredFile(path.join(moduleDir, "intra-module-coupling.json"), `intra-module coupling graph for module '${MODULE_NAME}'`);

  // Real citations legitimately sourced from crossModuleDepsRaw's inbound
  // touchpoints reference files belonging to OTHER modules (found 2026-08-30
  // porting this architecture to Angular) -- writeProvenanceSidecar's
  // internal validateCitations call only knows this module's own facts, so
  // those citations were flagged CITATION_FILE_NOT_FOUND despite being 100%
  // real. Flattened once here and passed to every writeProvenanceSidecar
  // call below.
  const crossModuleFileLines: Array<{ file: string; line: number }> = (() => {
    const parsed = JSON.parse(crossModuleDepsRaw);
    const out: Array<{ file: string; line: number }> = [];
    for (const entry of [...(parsed.outbound ?? []), ...(parsed.inbound ?? [])]) {
      for (const t of entry.touchpoints ?? []) {
        if (t.file && typeof t.line === "number") out.push({ file: t.file, line: t.line });
      }
    }
    return out;
  })();

  // Stable (contract + grounding docs -- identical across every module in a
  // run, the only part actually worth caching per governance/roadmap/
  // firebase-oskey-dev/09-fact-table-redundancy-reduction.md's own finding)
  // vs. variable (everything module-specific). Split with
  // CACHE_BREAKPOINT_MARKER, same convention capability-synthesis.ts/01c use.
  const stableSections: string[] = [];
  stableSections.push(`## Supporting Contract\n\n${contractText}`);
  stableSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  const variableSections: string[] = [];
  variableSections.push(moduleListSection);
  variableSections.push(`## Cross-Module Dependency Graph (deterministic, derived from AST import resolution, NOT LLM inference)\n\n\`\`\`json\n${crossModuleDepsRaw}\n\`\`\``);
  variableSections.push(`## Intra-Module Coupling Graph (deterministic, derived from AST import resolution, NOT LLM inference)\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``);
  variableSections.push(`## Resolved Cross-Module Call Edges (deterministic, method-level)\n\n${formatCallEdges(callEdgesForModule)}`);
  variableSections.push(`## Data Ownership Hints (deterministic signal, not a label)\n\n${formatOwnershipHints(ownershipHints)}`);
  variableSections.push(`## RBAC Requirements Catalog (deterministic, module-filtered)\n\n${formatRbacCatalog(rbacRowsForModule)}`);
  variableSections.push(`## Unresolved Call Edges (deterministic, module-filtered)\n\n${formatUnresolvedCallEdges(unresolvedCallEdgesForModule)}`);
  variableSections.push(
    `## ALL Capability Facts for Module '${MODULE_NAME}' (${allFacts.length} facts total, ${packNames.length} capabilities: ${packNames.join(", ")})\n\n${compactFacts}`
  );
  variableSections.push(
    `## Generation Metadata (use these exact values verbatim)\n\n` +
      `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}`
  );

  // Schema text is embedded directly in the prompt (not just referenced)
  // deliberately -- governance/roadmap/firebase-oskey-dev/11-structured-
  // output-citation-pilot.md's pilot found a confound the first time this
  // wasn't done consistently across arms (one arm got the full schema as
  // prompt text, the other a one-line note, conflating "does enforcement
  // matter" with "does prompt detail matter"). `responseSchema` below is
  // what actually enforces the shape (grammar-constrained decoding); this
  // text also tells the model what's expected, same as every other call.
  const relPath = `${MODULE_NAME}-module-level-response.json`;
  variableSections.push(
    `## Output Format (mandatory)\n\nReturn ONLY a single JSON object matching this exact shape (no markdown code fence, no conversational text before or after):\n\n${JSON.stringify(MODULE_LEVEL_RESPONSE_SCHEMA, null, 2)}`
  );

  const prompt = stableSections.join("\n\n---\n\n") + CACHE_BREAKPOINT_MARKER + variableSections.join("\n\n---\n\n");

  // Loud-failure safety check (governance/roadmap/firebase-oskey-dev/10-
  // module-level-production-cutover-plan.md Part A Step 2): batching a
  // module too large for one call is explicitly deferred, not solved.
  // CHARS_PER_TOKEN=3.6 is deliberately conservative (slightly overestimates
  // tokens) relative to the real measured ratio for the largest prompt
  // actually tested (organization, ~3.77 chars/token). No confirmed real
  // context-window ceiling exists for this model as of this writing (Vertex
  // AI's models.get() API doesn't expose one) -- 700,000 is a deliberate,
  // named safety margin above the largest module actually tested
  // (organization, ~383K real tokens), not a guess at the true limit.
  const CHARS_PER_TOKEN = 3.6;
  const MAX_SAFE_ESTIMATED_TOKENS = 700_000;
  const estimatedTokens = Math.ceil(prompt.length / CHARS_PER_TOKEN);
  if (estimatedTokens > MAX_SAFE_ESTIMATED_TOKENS) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "fatal",
      "MODULE_TOO_LARGE_FOR_SINGLE_CALL",
      `Module '${MODULE_NAME}' has an estimated ${estimatedTokens.toLocaleString()} prompt tokens, exceeding the ${MAX_SAFE_ESTIMATED_TOKENS.toLocaleString()}-token safety threshold -- needs the deferred capability-batching design, not a single call.`,
      { module: MODULE_NAME, estimatedTokens, threshold: MAX_SAFE_ESTIMATED_TOKENS, file: `module-${MODULE_NAME}-${LLM_CONFIG_KEY}` },
      true
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(
      `[MODULE_TOO_LARGE_FOR_SINGLE_CALL] Module '${MODULE_NAME}' has an estimated ${estimatedTokens.toLocaleString()} prompt tokens (${prompt.length.toLocaleString()} chars / ${CHARS_PER_TOKEN} chars-per-token), exceeding the ${MAX_SAFE_ESTIMATED_TOKENS.toLocaleString()}-token safety threshold. ` +
        `This module needs the deferred capability-batching design (governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-plan.md Part A Step 2) before it can be synthesized in one call -- do not silently proceed, do not fall back to truncating the fact table.`
    );
  }

  // COMPARISON_MODE (opt-in, same convention as 01a/01c): read/write under
  // output/runs/<repo>/<runId>/llm-comparison/<LLM_CONFIG_KEY>/<module>/
  // instead of the canonical knowledge-corpus/ location, so a comparison
  // run can never overwrite the canonical output for the same runId.
  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";
  const comparisonModuleDir = path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, MODULE_NAME);
  const outputDocsDir = COMPARISON_MODE ? comparisonModuleDir : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  // Defined early (not just where first used) because every notification's
  // own `details.file` needs it -- found 2026-08-31, Angular's variance
  // test: MODULE_LEVEL_SECTION_MISSING used bare `relPath` instead, so its
  // notification ID (sourceScript+code+module+file) collided across every
  // LLM_CONFIG_KEY comparing the same module, and addNotification's
  // upsert-by-ID silently let one comparison run's warning overwrite
  // another's -- confirmed real: a run misattributed to the wrong config key
  // in that exact scenario, only caught by reading the actual output file
  // instead of trusting the notification log.
  const outputLabel = COMPARISON_MODE ? `llm-comparison/${LLM_CONFIG_KEY}/${MODULE_NAME}` : `knowledge-corpus/${REPO_NAME}/${runId}`;

  // Direct callLlm rather than runDocumentCalls -- the latter's
  // splitMarkedFiles parses the free-text "===FILE:...===" convention,
  // which doesn't apply here: a schema-enforced response IS the file
  // content, with no wrapper. responseSchema is a per-call override (see
  // its own doc comment on LlmProviderConfig), never stored in
  // config/llm-providers.json.
  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "SYNTHESIS_LLM_CALL_STARTED",
    `Calling LLM provider '${llmConfig.provider}' (model '${llmConfig.model}') for module '${MODULE_NAME}' (module-level, structured output).`,
    { contextLabel: `module '${MODULE_NAME}' (module-level)`, kind: "module-level", provider: llmConfig.provider, model: llmConfig.model, file: relPath, llmConfigKey: LLM_CONFIG_KEY }
  );
  const llmConfigForCall: LlmProviderConfig = { ...llmConfig, responseSchema: MODULE_LEVEL_RESPONSE_SCHEMA };
  const result = await callLlm(prompt, llmConfigForCall);
  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "SYNTHESIS_LLM_CALL_COMPLETED",
    `LLM call completed for module '${MODULE_NAME}' (module-level, structured output).`,
    { contextLabel: `module '${MODULE_NAME}' (module-level)`, kind: "module-level", usage: result.usage, servedModel: result.servedModel, file: relPath, llmConfigKey: LLM_CONFIG_KEY }
  );

  // Real, complete structured JSON response persisted as its own file --
  // "part of the governance/audit chain" (explicit design goal, not just a
  // debug artifact), same as the Stage 2 pilot's own convention. Grammar-
  // constrained decoding (responseSchema set above) is expected to make
  // this JSON.parse reliable without defensive fence-stripping, but a
  // stray ```json fence is stripped defensively anyway -- cheap insurance
  // matching this pipeline's demonstrated pattern of real, recurring
  // small formatting-liberty bugs from LLM responses.
  fs.mkdirSync(outputDocsDir, { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, relPath), result.text, "utf8");
  const jsonText = result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let parsedJson: StructuredModuleResponse;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (parseErr: any) {
    throw new Error(
      `[LLM_RESPONSE_PARSE_FAILED] Module '${MODULE_NAME}''s structured response was not valid JSON: ${parseErr.message}. Raw response preserved at ${path.join(outputDocsDir, relPath)}.`
    );
  }

  // Real bug found 2026-08-30 under the old free-text contract (module
  // 'tasks'): on a single-capability module, the model wrote its one
  // capability under the MODULE's own name instead of the real submodule
  // identifier (`_module_root`) -- an understandable mistake when there's
  // only one capability to talk about, but it breaks exact-name lookup.
  // Nothing in the JSON schema prevents the same mistake (the schema only
  // constrains shape, not the `name` field's actual value), so this
  // deterministic fallback still applies: if there's exactly one real
  // capability AND the response produced exactly one capability object,
  // rename it to the real name regardless of what the model called it --
  // there's no ambiguity to resolve when there's only one of each.
  if (packNames.length === 1 && parsedJson.capabilities.length === 1 && parsedJson.capabilities[0].name !== packNames[0]) {
    const modelWrote = parsedJson.capabilities[0].name;
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "SINGLE_CAPABILITY_NAME_REMAPPED",
      `Module '${MODULE_NAME}' has exactly one capability ('${packNames[0]}') and the model's response had exactly one capability object, named '${modelWrote}' instead -- remapped deterministically rather than treated as missing.`,
      { module: MODULE_NAME, expected: packNames[0], modelWrote, file: outputLabel }
    );
    parsedJson.capabilities[0].name = packNames[0];
  }

  // Array-membership validation, not free-text extraction -- evidenceIds
  // are already clean structured data, so there is no equivalent of the
  // old regex-based extractCitations step. Computed once, reused below for
  // both the completeness notification (missingCapabilityNames) and the
  // citation-integrity notification (fabricatedEvidenceIds).
  const structuredValidation = validateStructuredResponse(parsedJson, idMap, packNames);

  // Checking only presence would miss a real failure this repo has already
  // hit once under the old contract (Angular's variance test, 2026-08-31):
  // a required section present but empty. The schema's `required` array
  // guarantees these two string fields exist, but not that they're
  // non-trivial -- MIN_JUDGMENT_SECTION_CHARS catches a technically-valid
  // but empty/near-empty response. This script doesn't retry yet (see
  // 01c's own retry loop for the equivalent failure under fan-out) -- for
  // now, detect and warn loudly rather than retry, so a human decides
  // whether to re-run.
  const missingModuleWideText = [
    parsedJson.moduleWide.executiveSummary?.trim().length >= MIN_JUDGMENT_SECTION_CHARS ? null : "Executive Summary",
    parsedJson.moduleWide.architecturalPosition?.trim().length >= MIN_JUDGMENT_SECTION_CHARS ? null : "Architectural Position",
  ].filter((x): x is string => x !== null);
  if (missingModuleWideText.length > 0 || structuredValidation.missingCapabilityNames.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      "MODULE_LEVEL_SECTION_MISSING",
      `Module-level call for '${MODULE_NAME}' did not produce all expected content -- missing/near-empty (<${MIN_JUDGMENT_SECTION_CHARS} chars) module-wide text field(s): ${missingModuleWideText.join(", ") || "(none)"}; missing capabilities: ${structuredValidation.missingCapabilityNames.join(", ") || "(none)"}.`,
      { module: MODULE_NAME, file: `${outputLabel}/${relPath}`, missingModuleWideText, missingCapabilities: structuredValidation.missingCapabilityNames },
      true
    );
  }

  // --- Assemble the FINAL Module Engineering Profile into the same 0-14
  // structure production output has always used. Sections 4, 7-8, and 11
  // are deterministically assembled per capability from that capability's
  // own facts subset (Section 5 stays LLM-authored via Data Ownership --
  // confirmed via the real fact schema that Firestore path construction
  // needs genuine judgment, not a lookup). Section 10 is rendered directly
  // from the already-computed call-edges graph. Sections 1, 2, 3, 6, 9, 12,
  // 13 come from renderStructuredModuleProfile, already footnoted -- there
  // is no separate renderCitationsAsFootnotes text-scanning step for this
  // path, since evidenceIds were never inline text to begin with. ---
  const factsByCapability = new Map<string, any[]>();
  for (const f of allFacts) {
    const key = f.submodule ?? "_module_root";
    const arr = factsByCapability.get(key) ?? [];
    arr.push(f);
    factsByCapability.set(key, arr);
  }
  const assembleAcross = (builder: (facts: any[]) => string): string =>
    packNames.map(pn => `#### ${pn}\n\n${builder(factsByCapability.get(pn) ?? [])}`).join("\n\n");

  const { sections: llmSections, appendix } = renderStructuredModuleProfile(parsedJson, idMap);

  const finalParts: string[] = [];
  finalParts.push(`### 0. Generation Metadata\n\n- runId: ${runId}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}`);
  finalParts.push(`### 1. Executive Summary\n\n${llmSections["1"]}`);
  finalParts.push(`### 2. Architectural Position\n\n${llmSections["2"]}`);
  finalParts.push(`### 3. Primary Responsibilities\n\n${llmSections["3"]}`);
  finalParts.push(`### 4. Public Interfaces\n\n${assembleAcross(facts => buildPublicInterfacesSection(facts))}`);
  finalParts.push(`### 5. Internal Structure (deterministic, from the Intra-Module Coupling Graph)\n\n${formatIntraModuleCoupling(intraModuleCouplingRaw)}`);
  finalParts.push(`### 6. Firestore & Data Ownership\n\n${llmSections["6"]}`);
  finalParts.push(`### 7-8. API Endpoints & Firestore Triggers\n\n${assembleAcross(facts => buildApiContractsSection(facts))}`);
  finalParts.push(`### 9. Permissions & Security\n\n${llmSections["9"]}`);
  finalParts.push(`### 10. Cross-Module Relationships (deterministic)\n\n${formatCallEdges(callEdgesForModule)}`);
  finalParts.push(`### 11. External Hooks\n\n${assembleAcross(facts => buildExternalHooksSection(facts))}`);
  finalParts.push(`### 12. Architectural Observations\n\n${llmSections["12"]}`);
  finalParts.push(`### 13. Risks & Open Questions\n\n${llmSections["13"]}`);

  // Section 0 is a compact key-value block, not narrative bullets --
  // excluded from blank-line spacing, same convention as before.
  const bodyRaw = finalParts.join("\n\n");
  const section1Marker = "### 1. Executive Summary";
  const section0End = bodyRaw.indexOf(section1Marker);
  const profileBody =
    section0End === -1 ? addBlankLinesBetweenTopLevelBullets(bodyRaw) : bodyRaw.slice(0, section0End) + addBlankLinesBetweenTopLevelBullets(bodyRaw.slice(section0End));
  const section14 = `### 14. Evidence References\n\n${formatEvidenceAppendix(appendix)}`;
  const finalProfile = `${profileBody}\n\n${section14}`;

  // --- Deterministic assembly of the API Reference -- zero LLM calls,
  // same as 01c's equivalent output. ---
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefBody =
    `### 0. Generation Metadata\n\n` +
    `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n` +
    `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}\n` +
    `- note: this document required no LLM call -- assembled entirely from deterministic facts already on disk.\n\n` +
    `### 1. API Contracts\n\n${assembleAcross(facts => buildApiContractsSection(facts))}`;

  fs.mkdirSync(path.join(outputDocsDir, path.dirname(profileRelPath)), { recursive: true });
  fs.mkdirSync(path.join(outputDocsDir, path.dirname(apiRefRelPath)), { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, profileRelPath), finalProfile, "utf8");
  fs.writeFileSync(path.join(outputDocsDir, apiRefRelPath), apiRefBody, "utf8");
  console.log(`Module Engineering Profile written to: ${path.join(outputDocsDir, profileRelPath)}`);
  console.log(`API Reference written to: ${path.join(outputDocsDir, apiRefRelPath)} (0 LLM calls)`);

  // Provenance sidecars validate against the RESOLVED (real-citation-
  // inline) reconstruction, never persisted on its own -- otherwise
  // writeProvenanceSidecar's internal validateCitations call would see only
  // "(FactId:#N)" markers in the actual footnoted file and report zero
  // citations, which would be a real, misleading regression in the
  // provenance record, not just cosmetic. This is a second, independent
  // check on top of structuredValidation above (regex-based, against the
  // reconstructed text) rather than a replacement for it.
  const resolvedForValidation = resolveFootnotesForValidation(profileBody, appendix);
  writeProvenanceSidecar(
    path.join(outputDocsDir, profileRelPath),
    resolvedForValidation,
    evidenceGraphForHints.facts,
    {
      runId,
      repoName: REPO_NAME,
      module: MODULE_NAME,
      sourceCapabilities: packNames,
      deterministicArtifacts: [
        "cross-module-dependencies.json",
        "intra-module-coupling.json",
        "resolved-engineering-graph.json (call edges + ownership hints + module-filtered rbacRequirements + module-filtered unresolvedCallEdges)",
      ],
      llmConfigKey: LLM_CONFIG_KEY,
      citationRendering: "footnoted (FactId:#N markers, real content in Section 14 appendix) -- validated against a resolved-inline reconstruction, never persisted",
    },
    "llm",
    crossModuleFileLines
  );
  writeProvenanceSidecar(
    path.join(outputDocsDir, apiRefRelPath),
    apiRefBody,
    evidenceGraphForHints.facts,
    { runId, repoName: REPO_NAME, module: MODULE_NAME, sourceCapabilities: packNames, note: "Assembled entirely from deterministic facts -- no LLM call for this document." },
    "deterministic",
    crossModuleFileLines
  );

  // structuredValidation was already computed above (right after parsing)
  // -- array-membership check against idMap, not text extraction. Includes
  // unknownCapabilityNames here too: a capability name that doesn't match
  // any real pack is the structured-response equivalent of the old
  // free-text path's "wrote a name we don't recognize" risk.
  if (structuredValidation.fabricatedEvidenceIds.length > 0 || structuredValidation.unknownCapabilityNames.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      "CITATION_FILE_NOT_FOUND",
      `[${outputLabel}] ${profileRelPath}: ${structuredValidation.fabricatedEvidenceIds.length} evidenceId(s) not found in module '${MODULE_NAME}''s real fact table -- likely fabricated; ${structuredValidation.unknownCapabilityNames.length} capability name(s) not matching any real pack.`,
      { module: MODULE_NAME, relPath: profileRelPath, file: `${outputLabel}/${profileRelPath}`, fabricatedEvidenceIds: structuredValidation.fabricatedEvidenceIds, unknownCapabilityNames: structuredValidation.unknownCapabilityNames },
      true
    );
  } else if (structuredValidation.totalEvidenceIds > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "CITATION_VALIDATION_PASSED",
      `[${outputLabel}] ${profileRelPath}: ${structuredValidation.totalEvidenceIds} evidenceId(s) checked, all resolved against real facts, 0 fabricated.`,
      { module: MODULE_NAME, relPath: profileRelPath, file: `${outputLabel}/${profileRelPath}` }
    );
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "MODULE_LEVEL_PROFILE_COMPLETED",
    `Module engineering profile + API reference completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model} -- 1 LLM call total (0 for API Reference), ${packNames.length} capabilities synthesized together.`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, file: outputLabel, capabilityCount: packNames.length, appendixCitationCount: appendix.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

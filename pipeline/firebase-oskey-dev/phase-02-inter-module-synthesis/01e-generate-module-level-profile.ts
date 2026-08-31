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
  expandShortIdRangeCitations,
  expandBundledShortIdCitations,
  restoreFactIdCitations,
  findUnrestoredShortIdCitations,
  renderCitationsAsFootnotes,
  formatEvidenceAppendix,
  resolveFootnotesForValidation,
  addBlankLinesBetweenTopLevelBullets,
} from "../phase-01-ast-extraction/_shared/run-utils";
import { LlmProviderConfig, CACHE_BREAKPOINT_MARKER } from "./_shared/llm-adapter";
import { readRequiredFile, resolveContractsRootAbs, loadDocs, runDocumentCalls, DocumentCallSpec } from "./_shared/synthesis-orchestrator";
import { flattenRbacRoles } from "./_shared/rbac-flatten";
import { filterCallEdgesForModule, formatCallEdges, filterUnresolvedCallEdgesForModule, formatUnresolvedCallEdges } from "./_shared/call-edges";
import { filterRbacRequirementsForModule, formatRbacCatalog } from "./_shared/rbac-catalog";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "./_shared/citation-validator";
import { writeProvenanceSidecar } from "./_shared/provenance-sidecar";
import { buildPublicInterfacesSection, buildApiContractsSection, buildExternalHooksSection } from "./_shared/capability-synthesis";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01e-generate-module-level-profile";

interface ModuleLevelProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  moduleLevelSynthesisContractPaths: string[];
}

interface ParsedCapability {
  name: string;
  sections: Map<string, string>;
}

/** Splits text on "### <name>" level-3 headers -- this contract's named
 * per-capability/module-wide subsection convention (not the numbered
 * "### N. Title" convention splitNumberedSections handles). */
function splitByNamedHeader(text: string): Map<string, string> {
  const matches = Array.from(text.matchAll(/^### (.+)$/gm));
  const result = new Map<string, string>();
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    // Trailing "---" the model sometimes adds as its own visual separator
    // before the next "## CAPABILITY:" block isn't real content -- strip it.
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
      // Strips an optional backtick wrapper the model sometimes adds around
      // the capability name at higher temperature (found 2026-08-31,
      // node-iot's temp=0.4 run: `` ## CAPABILITY: `_module_root` `` instead
      // of the plain form the contract specifies) -- an exact-string match
      // against real pack names would otherwise report every capability
      // missing even though its content is present and correct. Same class
      // of temp-dependent formatting liberty as the short-ID-range fix
      // above, just a different field.
      const name = header.slice("CAPABILITY:".length).trim().replace(/^`(.+)`$/, "$1");
      capabilities.push({ name, sections: splitByNamedHeader(body) });
    }
  }
  return { moduleWide, capabilities };
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

const REQUIRED_MODULE_WIDE_SECTIONS = [
  "Executive Summary",
  "Architectural Position",
  "Ownership Conclusion",
  "Cross-Cutting Permissions & Security Risks",
  "Architectural Observations",
  "Cross-Cutting Risks & Open Questions",
];

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
  // porting this architecture to Angular) -- validateCitations only knows
  // this module's own facts, so those citations were flagged
  // CITATION_FILE_NOT_FOUND despite being 100% real. Flattened once here and
  // passed to every validateCitations/writeProvenanceSidecar call below.
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

  const relPath = `${MODULE_NAME}-module-level-synthesis.md`;
  variableSections.push(
    `## Output Format reminder\n\nProduce exactly one file wrapped as:\n\n===FILE: ${relPath}===\n<content per the contract's Output Format section>\n===END FILE===`
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

  const spec: DocumentCallSpec = { relPath, prompt, kind: "module-level" };
  const written = await runDocumentCalls([spec], llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (module-level)`, LLM_CONFIG_KEY);

  // Expand malformed range citations (`` `F150-F157` `` etc. -- real,
  // recurring pattern on large modules, confirmed 2026-08-30) into one real
  // citation per fact BEFORE restoring short IDs, so every one of them
  // resolves normally instead of surviving as a silent, unverifiable range.
  // Then restore short IDs (F1, F2, ...) back to real fact IDs -- must never
  // leak past this one round-trip. Overwrites the raw response file with
  // the restored version.
  const rawResponse = written.get(relPath)!;
  const rangeExpanded = expandShortIdRangeCitations(rawResponse);
  const bundleExpanded = expandBundledShortIdCitations(rangeExpanded);
  const restored = restoreFactIdCitations(bundleExpanded, idMap);
  fs.writeFileSync(path.join(outputDocsDir, relPath), restored, "utf8");

  const unrestored = findUnrestoredShortIdCitations(restored);
  if (unrestored.length > 0) {
    // The true pre-fix raw response was otherwise never preserved (the same
    // path gets overwritten in place with the restored version above) --
    // without this, a real occurrence can't be forensically inspected after
    // the fact, only re-described from the (already-transformed) restored
    // text. Written only when something is actually still wrong, not on
    // every call.
    const rawDumpPath = path.join(outputDocsDir, `${relPath}.raw-before-restore.txt`);
    fs.writeFileSync(rawDumpPath, rawResponse, "utf8");
    console.warn(`Raw pre-restoration response preserved for inspection: ${rawDumpPath}`);
  }
  if (unrestored.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      "SHORT_ID_RESTORATION_INCOMPLETE",
      `${unrestored.length} malformed/unrestored short-ID citation(s) survived into module '${MODULE_NAME}''s final text -- these are silent, unverifiable claims.`,
      { module: MODULE_NAME, file: `${outputLabel}/${relPath}`, unrestored },
      true
    );
  }

  // --- Assemble the FINAL Module Engineering Profile into the same 0-14
  // structure today's production output uses. Sections 3, 4, 7-8, and 11
  // are deterministically assembled per capability from that capability's
  // own facts subset (Section 5 stays LLM-authored -- confirmed via the
  // real fact schema that Firestore path construction needs genuine
  // judgment, not a lookup). Section 10 is rendered directly from the
  // already-computed call-edges graph. ---
  const factsByCapability = new Map<string, any[]>();
  for (const f of allFacts) {
    const key = f.submodule ?? "_module_root";
    const arr = factsByCapability.get(key) ?? [];
    arr.push(f);
    factsByCapability.set(key, arr);
  }
  const parsed = parseModuleLevelResponse(restored);
  const capByName = new Map(parsed.capabilities.map(c => [c.name, c]));

  // Real bug found 2026-08-30 (module 'tasks'): on a single-capability
  // module, the model wrote "## CAPABILITY: tasks" (the MODULE's own name)
  // instead of "## CAPABILITY: _module_root" (the real submodule
  // identifier) -- an understandable mistake when there's only one
  // capability to talk about, but it breaks exact-name lookup. This isn't
  // guessable to prevent reliably in the contract text alone (a model
  // renaming its one subject to something more natural-sounding is a real,
  // recurring risk on every single-capability module in this repo: `tasks`,
  // `call`, `unit_management`, `access_control_device`). Deterministic
  // fallback: if there's exactly one real capability AND the response
  // produced exactly one capability block, remap it to the real name
  // regardless of what the model called it -- there's no ambiguity to
  // resolve when there's only one of each.
  if (packNames.length === 1 && parsed.capabilities.length === 1 && !capByName.has(packNames[0])) {
    const only = parsed.capabilities[0];
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "SINGLE_CAPABILITY_NAME_REMAPPED",
      `Module '${MODULE_NAME}' has exactly one capability ('${packNames[0]}') and the model's response had exactly one capability block, named '${only.name}' instead -- remapped deterministically rather than treated as missing.`,
      { module: MODULE_NAME, expected: packNames[0], modelWrote: only.name, file: outputLabel }
    );
    capByName.set(packNames[0], only);
  }

  // MIN_JUDGMENT_SECTION_CHARS matches 01c's own threshold (real measured
  // healthy-vs-degenerate samples). Checking key presence alone missed a
  // real failure caught 2026-08-31 during Angular's variance test: the
  // model wrote a "Cross-Cutting Risks & Open Questions" header with an
  // empty body -- `.has(k)` returned true, this notification never fired,
  // and the gap was only found by a human/agent reading the assembled
  // document directly. 01c has a detect-and-retry loop for exactly this
  // failure mode (found on the old architecture, same underlying cause);
  // this script doesn't retry yet (a full one-shot regeneration costs far
  // more than 01c's reduce-only retry) -- for now, detect and warn loudly
  // rather than retry, so a human decides whether to re-run.
  const MIN_JUDGMENT_SECTION_CHARS = 200;
  const missingModuleWide = REQUIRED_MODULE_WIDE_SECTIONS.filter(
    k => !parsed.moduleWide.has(k) || (parsed.moduleWide.get(k) ?? "").trim().length < MIN_JUDGMENT_SECTION_CHARS
  );
  const missingCapabilities = packNames.filter(pn => !capByName.has(pn));
  if (missingModuleWide.length > 0 || missingCapabilities.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      "MODULE_LEVEL_SECTION_MISSING",
      `Module-level call for '${MODULE_NAME}' did not produce all expected content -- missing/near-empty (<${MIN_JUDGMENT_SECTION_CHARS} chars) module-wide section(s): ${missingModuleWide.join(", ") || "(none)"}; missing capabilities: ${missingCapabilities.join(", ") || "(none)"}.`,
      { module: MODULE_NAME, file: `${outputLabel}/${relPath}`, missingModuleWide, missingCapabilities },
      true
    );
  }

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
  finalParts.push(`### 1. Executive Summary\n\n${parsed.moduleWide.get("Executive Summary") ?? "*(not produced by the model)*"}`);
  finalParts.push(`### 2. Architectural Position\n\n${parsed.moduleWide.get("Architectural Position") ?? "*(not produced by the model)*"}`);
  finalParts.push(`### 3. Primary Responsibilities\n\n${assembleAcross("Primary Responsibilities")}`);
  finalParts.push(`### 4. Public Interfaces\n\n${assembleAcross("", facts => buildPublicInterfacesSection(facts))}`);
  finalParts.push(`### 5. Internal Structure (deterministic, from the Intra-Module Coupling Graph)\n\n${formatIntraModuleCoupling(intraModuleCouplingRaw)}`);
  finalParts.push(
    `### 6. Firestore & Data Ownership\n\n**Ownership conclusion:**\n\n${parsed.moduleWide.get("Ownership Conclusion") ?? "*(not produced by the model)*"}\n\n**Per-capability evidence:**\n\n${assembleAcross("Data Ownership")}`
  );
  finalParts.push(`### 7-8. API Endpoints & Firestore Triggers\n\n${assembleAcross("", facts => buildApiContractsSection(facts))}`);
  finalParts.push(
    `### 9. Permissions & Security\n\n**Cross-cutting risk callouts:**\n\n${parsed.moduleWide.get("Cross-Cutting Permissions & Security Risks") ?? "*(not produced by the model)*"}\n\n**Per-capability evidence:**\n\n${assembleAcross("Notable Permissions Observations")}`
  );
  finalParts.push(`### 10. Cross-Module Relationships (deterministic)\n\n${formatCallEdges(callEdgesForModule)}`);
  finalParts.push(`### 11. External Hooks\n\n${assembleAcross("", facts => buildExternalHooksSection(facts))}`);
  finalParts.push(`### 12. Architectural Observations\n\n${parsed.moduleWide.get("Architectural Observations") ?? "*(not produced by the model)*"}`);
  finalParts.push(
    `### 13. Risks & Open Questions\n\n**Cross-cutting risks:**\n\n${parsed.moduleWide.get("Cross-Cutting Risks & Open Questions") ?? "*(not produced by the model)*"}\n\n**Per-capability open questions:**\n\n${assembleAcross("Open Questions")}`
  );

  // Footnote every citation instead of leaving verbose fact-ID/file-line
  // text inline -- real, user-driven readability fix 2026-08-30 (see
  // governance/roadmap/firebase-oskey-dev/10-module-level-production-
  // cutover-plan.md): a document this dense with inline citations read far
  // worse than this pipeline's own historical best example. Section 0 is
  // a compact key-value block, not narrative bullets -- excluded from
  // blank-line spacing.
  const bodyWithInlineCitations = finalParts.join("\n\n");
  const { body: bodyWithFootnotesRaw, appendix } = renderCitationsAsFootnotes(bodyWithInlineCitations);
  const section1Marker = "### 1. Executive Summary";
  const section0End = bodyWithFootnotesRaw.indexOf(section1Marker);
  const profileBody =
    section0End === -1
      ? addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw)
      : bodyWithFootnotesRaw.slice(0, section0End) + addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw.slice(section0End));
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
    `### 1. API Contracts\n\n${assembleAcross("", facts => buildApiContractsSection(facts))}`;

  fs.mkdirSync(path.join(outputDocsDir, path.dirname(profileRelPath)), { recursive: true });
  fs.mkdirSync(path.join(outputDocsDir, path.dirname(apiRefRelPath)), { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, profileRelPath), finalProfile, "utf8");
  fs.writeFileSync(path.join(outputDocsDir, apiRefRelPath), apiRefBody, "utf8");
  console.log(`Module Engineering Profile written to: ${path.join(outputDocsDir, profileRelPath)}`);
  console.log(`API Reference written to: ${path.join(outputDocsDir, apiRefRelPath)} (0 LLM calls)`);

  // Provenance sidecars validate against the RESOLVED (real-citation-
  // inline) reconstruction, never persisted on its own -- otherwise
  // validateCitations would see only "(FactId:#N)" markers in the actual
  // footnoted file and report zero citations, which would be a real,
  // misleading regression in the provenance record, not just cosmetic.
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

  const validation = validateCitations(resolvedForValidation, evidenceGraphForHints.facts, crossModuleFileLines);
  if (validation.fileNotFound.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      "CITATION_FILE_NOT_FOUND",
      `[${outputLabel}] ${profileRelPath}: ${validation.fileNotFound.length} citation(s) reference a file not found anywhere in module '${MODULE_NAME}''s evidence -- likely fabricated.`,
      { module: MODULE_NAME, relPath: profileRelPath, file: `${outputLabel}/${profileRelPath}`, details: formatCitationValidation(validation) },
      true
    );
  } else if (validation.totalCitations > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "CITATION_VALIDATION_PASSED",
      `[${outputLabel}] ${profileRelPath}: ${validation.totalCitations} citation(s) checked, ${validation.verified} verified, ${validation.lineUnverified.length} line-unverified, 0 file-not-found.`,
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

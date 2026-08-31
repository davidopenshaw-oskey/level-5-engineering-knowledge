// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Production module-level synthesis: ONE LLM call synthesizes this repo's
// one module's capabilities together (module-wide cross-cutting sections +
// every capability's own judgment sections), replacing the per-capability
// fan-out + reduce chain (01a/01c/01d) as the default going forward. Ported
// from firebase-oskey-dev's 01e-generate-module-level-profile.ts, but NOT a
// byte-for-byte copy -- real feasibility numbers were computed for this
// repo's own module first (governance/roadmap/node-iot-api-oskey-io/
// 01-phase2-contract-design.md's module-level architecture section, ~166K-
// 200K estimated tokens, comfortably under the 700K threshold), and the
// section list/assembly below matches this repo's own real 16-section
// (0-15) final layout, not Firebase's 15-section (0-14) one -- see
// contracts/03-module-level-synthesis.md's own header note for the content
// differences (Route Definitions & Request Contracts and Pub/Sub Behavior
// have no Firebase equivalent at all; Public Interfaces has no "service"
// tier; there is no cross-cutting Permissions/RBAC section anywhere).
//
// 01a/01c/01d and contracts/00-capability-synthesis.md/01-module-synthesis-
// reduce.md are NOT retired -- kept as the deliberate fallback for a module
// that ever exceeds MAX_SAFE_ESTIMATED_TOKENS below (batching a module
// across multiple calls is explicitly deferred, not solved here, matching
// Firebase's own posture). This repo's current single module is nowhere
// near that threshold, but the check is kept as future-proofing regardless
// -- matching the proven pattern, not a shortcut, in case a large module is
// ever added.

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
import { filterUnresolvedCallEdgesForModule, formatUnresolvedCallEdges } from "./_shared/call-edges";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "./_shared/citation-validator";
import { writeProvenanceSidecar } from "./_shared/provenance-sidecar";
import { buildPublicInterfacesSection } from "./_shared/capability-synthesis";
import { resolveRouteSchemas, formatResolvedRouteSchemas } from "./_shared/route-schema-resolver";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01e-generate-module-level-profile";

interface ModuleLevelProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  moduleLevelSynthesisContractPaths: string[];
  // See 01a-generate-capability-syntheses.ts's identical field for the full
  // rationale -- load-bearing here too: this repo's _unreferenced pack
  // (dead code, Decision 3, Phase 1 design doc) must never be synthesized.
  // Unlike Firebase's own 01e, which has no such filter (Firebase never
  // needed one) -- do not port that gap, this repo's own scripts have
  // always respected this field.
  excludeCapabilityPacks?: string[];
}

interface ParsedCapability {
  name: string;
  sections: Map<string, string>;
}

/** Splits text on "### <name>" level-3 headers -- this contract's named
 * per-capability/module-wide subsection convention (not the numbered
 * "### N. Title" convention _shared/document-sections.ts's
 * splitNumberedSections handles -- that parses the OLD two-stage contracts'
 * output, a genuinely different format from this one). */
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
      // Strip an optional single-backtick wrapper around the capability
      // name -- real, found 2026-08-31 during this repo's own temp=0.4
      // variance test run: at higher temperature (never seen at 0.0/0.2),
      // the model wrote "## CAPABILITY: `_module_root`" instead of the
      // expected plain "## CAPABILITY: _module_root". Without this, the
      // backtick-wrapped name never matches any real packName, and EVERY
      // capability in that response gets reported as missing even though
      // the actual content is present and well-formed under a
      // backtick-decorated key. MODULE_LEVEL_SECTION_MISSING did correctly
      // fire and surface this loudly (detection worked as designed) -- this
      // fix makes the parser itself tolerant of the variant instead of
      // relying on a human to notice the warning and re-run.
      const rawName = header.slice("CAPABILITY:".length).trim();
      const name = rawName.replace(/^`(.+)`$/, "$1");
      capabilities.push({ name, sections: splitByNamedHeader(body) });
    }
  }
  return { moduleWide, capabilities };
}

const MAX_SAMPLE_TOUCHPOINTS = 3;

/** Formats the intra-module coupling graph compactly instead of dumping raw
 * JSON -- ported from Firebase's identical fix (real finding there: the raw
 * dump scaled combinatorially with submodule count). Renders Section 9
 * (Internal Structure) directly -- this section is deterministic for this
 * repo, not LLM-written at all; see contracts/03-module-level-synthesis.md's
 * "What you do NOT write". */
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

// This repo's module-wide sections -- five, not Firebase's six: no
// "Cross-Cutting Permissions & Security Risks" (no judgment slot exists,
// this repo has zero RBAC facts anywhere, verified in Phase 1), and
// "Internal Structure" is deterministic here too (see
// formatIntraModuleCoupling above), not requested from the LLM at all.
const REQUIRED_MODULE_WIDE_SECTIONS = ["Executive Summary", "Architectural Position", "Ownership Conclusion", "Architectural Observations", "Cross-Cutting Risks & Open Questions"];

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
  const contractDocs = loadDocs(contractsRootAbs, cfg.moduleLevelSynthesisContractPaths, "module-level synthesis contract doc");
  const contractText = contractDocs.map(d => `### ${d.relPath}\n\n${d.content}`).join("\n\n");

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  if (!fs.existsSync(packsDir)) {
    throw new Error(`[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'.`);
  }
  const allPackNames = fs
    .readdirSync(packsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
    .sort();
  const excludeSet = new Set(cfg.excludeCapabilityPacks || []);
  const packNames = allPackNames.filter(p => !excludeSet.has(p));
  const excludedPackNames = allPackNames.filter(p => excludeSet.has(p));
  if (excludedPackNames.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "CAPABILITY_PACKS_EXCLUDED",
      `Excluded ${excludedPackNames.length} capability pack(s) from module-level synthesis per config.phase2.moduleLevelProfile.excludeCapabilityPacks: ${excludedPackNames.join(", ")}.`,
      { excludedPackNames }
    );
  }
  if (packNames.length === 0) {
    throw new Error(`[Fail-Closed] Capability-packs directory for module '${MODULE_NAME}' is empty at '${packsDir}' (after excluding: ${excludedPackNames.join(", ") || "none"}).`);
  }

  let allFacts: any[] = [];
  for (const packName of packNames) {
    const pack = JSON.parse(readRequiredFile(path.join(packsDir, `${packName}.json`), `capability pack '${packName}'`));
    allFacts = allFacts.concat(pack.facts);
  }
  const { table: compactFacts, idMap } = factsToCompactTableShortIds(allFacts);

  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  // No filterCallEdgesForModule/formatCallEdges and no RBAC catalog input --
  // see this file's top-of-file comment and contracts/03-module-level-
  // synthesis.md's "What you're given": confirmedCallEdges is guaranteed
  // empty (one module, always) and Section 10 (Cross-Module Relationships)
  // is rendered as fixed text below, not asked of the LLM; RBAC
  // requirements are guaranteed empty repo-wide (zero RBAC facts, verified
  // in Phase 1) and there is no cross-cutting Permissions section to feed.
  const unresolvedCallEdgesForModule = filterUnresolvedCallEdgesForModule(resolvedGraph, MODULE_NAME);

  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}'`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  const intraModuleCouplingRaw = readRequiredFile(path.join(moduleDir, "intra-module-coupling.json"), `intra-module coupling graph for module '${MODULE_NAME}'`);

  // Resolved Route Request Schemas, module-wide (see route-schema-resolver.ts's
  // own header comment for why this join can't be scoped to one capability's
  // facts here either -- the shared pubSubMessageSchema case is exactly the
  // same cross-pack join Decision 2 already solved for the two-stage path).
  const resolvedRouteSchemas = formatResolvedRouteSchemas(resolveRouteSchemas(allFacts, allFacts));

  // Stable (contract + grounding docs) vs. variable (everything
  // module-specific), same CACHE_BREAKPOINT_MARKER convention as
  // capability-synthesis.ts/01c/01a use.
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
  variableSections.push(`## Intra-Module Coupling Graph (deterministic, derived from AST import resolution, NOT LLM inference -- for your own orientation only; Internal Structure is rendered directly from this by the calling script, not written by you)\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``);
  variableSections.push(`## Data Ownership Hints (deterministic signal, not a label -- for Ownership Conclusion)\n\n${formatOwnershipHints(ownershipHints)}`);
  variableSections.push(`## Unresolved Call Edges (deterministic, module-filtered -- for Architectural Observations, if a real pattern emerges)\n\n${formatUnresolvedCallEdges(unresolvedCallEdgesForModule)}`);
  variableSections.push(`## Resolved Route Request Schemas (deterministic join, module-wide -- use this directly for each capability's Route Definitions & Request Contracts)\n\n${resolvedRouteSchemas}`);
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

  // Loud-failure safety check, ported verbatim from Firebase's 01e -- kept
  // even though real feasibility numbers for this repo's one module
  // (governance/roadmap/node-iot-api-oskey-io/01-phase2-contract-design.md's
  // module-level architecture section, ~166K-200K estimated tokens) show it
  // won't trigger today. Future-proofing, not a shortcut: if a large module
  // is ever added to this repo, this is the same loud, explicit failure
  // Firebase's own production path already relies on, not a silent
  // truncation or a surprise 400 from the provider.
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
        `This module needs the deferred capability-batching design before it can be synthesized in one call -- fall back to 01a/01c (contracts/00-capability-synthesis.md/01-module-synthesis-reduce.md) for this module instead. Do not silently proceed, do not fall back to truncating the fact table.`
    );
  }

  // COMPARISON_MODE (opt-in, same convention as 01a/01c): read/write under
  // output/runs/<repo>/<runId>/llm-comparison/<LLM_CONFIG_KEY>/<module>/
  // instead of the canonical knowledge-corpus/ location.
  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";
  const comparisonModuleDir = path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, MODULE_NAME);
  const outputDocsDir = COMPARISON_MODE ? comparisonModuleDir : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  // Defined early (not just where first used) because every notification's
  // own `details.file` needs it -- ported from Firebase's identical fix,
  // found 2026-08-31 during Angular's variance test: MODULE_LEVEL_SECTION_
  // MISSING used bare `relPath` instead, so its notification ID
  // (sourceScript+code+module+file) collided across every LLM_CONFIG_KEY
  // comparing the same module, and addNotification's upsert-by-ID silently
  // let one comparison run's warning overwrite another's -- confirmed real
  // on Firebase's side: a run misattributed to the wrong config key in that
  // exact scenario, only caught by reading the actual output file instead
  // of trusting the notification log. Same fix applied here even though
  // this repo's own comparison runs (the module-level variance check,
  // governance/roadmap/node-iot-api-oskey-io/01-phase2-contract-design.md)
  // didn't happen to hit this specific collision -- the underlying gap was
  // identical code, not a case-by-case coincidence.
  const outputLabel = COMPARISON_MODE ? `llm-comparison/${LLM_CONFIG_KEY}/${MODULE_NAME}` : `knowledge-corpus/${REPO_NAME}/${runId}`;

  const spec: DocumentCallSpec = { relPath, prompt, kind: "module-level" };
  const written = await runDocumentCalls([spec], llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (module-level)`, LLM_CONFIG_KEY);

  // Expand malformed range citations, then restore short IDs to real fact
  // IDs -- must never leak past this one round-trip. Overwrites the raw
  // response file with the restored version. Same ordering/rationale as
  // Firebase's identical logic.
  const rawResponse = written.get(relPath)!;
  const rangeExpanded = expandShortIdRangeCitations(rawResponse);
  const bundleExpanded = expandBundledShortIdCitations(rangeExpanded);
  const restored = restoreFactIdCitations(bundleExpanded, idMap);
  fs.writeFileSync(path.join(outputDocsDir, relPath), restored, "utf8");

  const unrestored = findUnrestoredShortIdCitations(restored);
  if (unrestored.length > 0) {
    const rawDumpPath = path.join(outputDocsDir, `${relPath}.raw-before-restore.txt`);
    fs.writeFileSync(rawDumpPath, rawResponse, "utf8");
    console.warn(`Raw pre-restoration response preserved for inspection: ${rawDumpPath}`);
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

  // --- Assemble the FINAL Module Engineering Profile into this repo's own
  // real 0-15 structure (contracts/01-module-synthesis-reduce.md's "Final
  // document section list"), not Firebase's 0-14 one. Sections 4, 9, 10,
  // and 15 are deterministic; everything else is either an LLM module-wide
  // section or assembled per-capability from the parsed response. ---
  const factsByCapability = new Map<string, any[]>();
  for (const f of allFacts) {
    const key = f.submodule ?? "_module_root";
    const arr = factsByCapability.get(key) ?? [];
    arr.push(f);
    factsByCapability.set(key, arr);
  }
  const parsed = parseModuleLevelResponse(restored);
  const capByName = new Map(parsed.capabilities.map(c => [c.name, c]));

  // Same real, documented risk Firebase found on single-capability modules
  // (a model renaming its one subject to something more natural-sounding)
  // -- this repo's module always has multiple real capabilities (packNames
  // here is never 1 after excluding _unreferenced), so this narrow
  // condition won't fire in practice, but is kept verbatim rather than
  // silently dropped: it's cheap, harmless when it doesn't apply, and this
  // repo's own `_module_root` name is exactly the kind of unusual,
  // non-domain name a model might rename in its own capability header even
  // among several real capabilities -- a renamed block that this fallback
  // doesn't happen to catch still surfaces via the missingCapabilities
  // check below, not silently.
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
  // real failure Firebase found 2026-08-31 during Angular's variance test:
  // the model wrote a header with an empty body -- `.has(k)` returned true,
  // this notification never fired, and the gap was only found by reading
  // the assembled document directly. This script doesn't retry yet (a full
  // one-shot regeneration costs far more than 01c's reduce-only retry) --
  // for now, detect and warn loudly rather than retry, so a human decides
  // whether to re-run. Ported here even though this repo's own variance
  // check runs (governance/roadmap/node-iot-api-oskey-io/
  // 01-phase2-contract-design.md) didn't happen to hit this exact failure --
  // the underlying gap (key-existence check only) was identical code.
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

  // Section 10 (Cross-Module Relationships) fixed text, same guard as
  // 01c-generate-assembly-first-profile.ts's identical assertion.
  if (moduleNames.length !== 1) {
    throw new Error(
      `[Fail-Closed] '${REPO_NAME}' now has ${moduleNames.length} modules, not the single module this repo's module-level contract assumes. ` +
        `Section 10 (Cross-Module Relationships) below was written assuming exactly one module -- that assumption no longer holds and this script needs a real Cross-Module Dependency Graph input and an LLM-written Section 10 before it can be trusted again.`
    );
  }

  const finalParts: string[] = [];
  finalParts.push(`### 0. Generation Metadata\n\n- runId: ${runId}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}`);
  finalParts.push(`### 1. Executive Summary\n\n${parsed.moduleWide.get("Executive Summary") ?? "*(not produced by the model)*"}`);
  finalParts.push(`### 2. Architectural Position\n\n${parsed.moduleWide.get("Architectural Position") ?? "*(not produced by the model)*"}`);
  finalParts.push(`### 3. Primary Responsibilities\n\n${assembleAcross("Primary Responsibilities")}`);
  finalParts.push(`### 4. Public Interfaces (Route Handlers & Controllers)\n\n${assembleAcross("", facts => buildPublicInterfacesSection(facts))}`);
  finalParts.push(`### 5. Route Definitions & Request Contracts\n\n${assembleAcross("Route Definitions & Request Contracts")}`);
  finalParts.push(`### 6. Pub/Sub Behavior\n\n${assembleAcross("Pub/Sub Behavior")}`);
  finalParts.push(
    `### 7. Data Ownership\n\n**Ownership conclusion:**\n\n${parsed.moduleWide.get("Ownership Conclusion") ?? "*(not produced by the model)*"}\n\n**Per-capability evidence:**\n\n${assembleAcross("Data Ownership")}`
  );
  finalParts.push(`### 8. Outbound Coupling\n\n${assembleAcross("Outbound Coupling")}`);
  finalParts.push(`### 9. Internal Structure\n\n${formatIntraModuleCoupling(intraModuleCouplingRaw)}`);
  finalParts.push(
    `### 10. Cross-Module Relationships\n\n*(deterministic -- this repository consists of exactly one module, \`${MODULE_NAME}\`; no cross-module relationships exist.)*`
  );
  finalParts.push(
    `### 11. Permissions & Security\n\n*(this repo has zero RBAC/authorization facts anywhere, verified in Phase 1 -- no cross-cutting judgment layer exists to add on top of the per-capability evidence below, since there is nothing to compare.)*\n\n**Per-capability evidence:**\n\n${assembleAcross("Permissions & Security")}`
  );
  finalParts.push(`### 12. External Hooks\n\n${assembleAcross("External Hooks")}`);
  finalParts.push(`### 13. Architectural Observations\n\n${parsed.moduleWide.get("Architectural Observations") ?? "*(not produced by the model)*"}`);
  finalParts.push(
    `### 14. Risks & Open Questions\n\n**Cross-cutting risks:**\n\n${parsed.moduleWide.get("Cross-Cutting Risks & Open Questions") ?? "*(not produced by the model)*"}\n\n**Per-capability open questions:**\n\n${assembleAcross("Open Questions")}`
  );

  // Footnote every citation instead of leaving verbose fact-ID/file-line
  // text inline -- ported from Firebase's identical readability fix.
  // Section 0 is a compact key-value block, not narrative bullets --
  // excluded from blank-line spacing, same as Firebase's version.
  const bodyWithInlineCitations = finalParts.join("\n\n");
  const { body: bodyWithFootnotesRaw, appendix } = renderCitationsAsFootnotes(bodyWithInlineCitations);
  const section1Marker = "### 1. Executive Summary";
  const section0End = bodyWithFootnotesRaw.indexOf(section1Marker);
  const profileBody =
    section0End === -1
      ? addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw)
      : bodyWithFootnotesRaw.slice(0, section0End) + addBlankLinesBetweenTopLevelBullets(bodyWithFootnotesRaw.slice(section0End));
  const section15 = `### 15. Evidence References\n\n${formatEvidenceAppendix(appendix)}`;
  const finalProfile = `${profileBody}\n\n${section15}`;

  // --- Deterministic assembly of the API Reference -- zero LLM calls, same
  // as 01c's equivalent output. Covers both of this repo's real external
  // surfaces (route definitions + Pub/Sub), same as 01c's own extension of
  // Firebase's single "API Contracts" section -- these ARE per-capability
  // LLM-authored sections here (unlike Firebase's deterministic
  // buildApiContractsSection, which has no node-iot equivalent -- this
  // repo's request-contract facts need the same genuine judgment layer
  // route_definition/joi_schema_field data always has, Decision 2), so this
  // reference reuses the already-assembled Section 5/6 content rather than
  // re-deriving it. ---
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefBody =
    `### 0. Generation Metadata\n\n` +
    `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n` +
    `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}\n` +
    `- note: assembled entirely from Sections 5 and 6 of the module-level synthesis call already made above -- no additional LLM call for this document.\n\n` +
    `### 1. Route Definitions & Request Contracts\n\n${assembleAcross("Route Definitions & Request Contracts")}\n\n` +
    `### 2. Pub/Sub Behavior\n\n${assembleAcross("Pub/Sub Behavior")}`;

  fs.mkdirSync(path.join(outputDocsDir, path.dirname(profileRelPath)), { recursive: true });
  fs.mkdirSync(path.join(outputDocsDir, path.dirname(apiRefRelPath)), { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, profileRelPath), finalProfile, "utf8");
  fs.writeFileSync(path.join(outputDocsDir, apiRefRelPath), apiRefBody, "utf8");
  console.log(`Module Engineering Profile written to: ${path.join(outputDocsDir, profileRelPath)}`);
  console.log(`API Reference written to: ${path.join(outputDocsDir, apiRefRelPath)} (0 additional LLM calls)`);

  // Provenance sidecars validate against the RESOLVED (real-citation-inline)
  // reconstruction, never persisted on its own -- otherwise validateCitations
  // would see only "(FactId:#N)" markers and report zero citations.
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
      deterministicArtifacts: ["intra-module-coupling.json", "resolved-engineering-graph.json (ownership hints + module-filtered unresolvedCallEdges)"],
      llmConfigKey: LLM_CONFIG_KEY,
      citationRendering: "footnoted (FactId:#N markers, real content in Section 15 appendix) -- validated against a resolved-inline reconstruction, never persisted",
    },
    "llm"
  );
  writeProvenanceSidecar(
    path.join(outputDocsDir, apiRefRelPath),
    apiRefBody,
    evidenceGraphForHints.facts,
    { runId, repoName: REPO_NAME, module: MODULE_NAME, sourceCapabilities: packNames, note: "Assembled entirely from the module-level synthesis call's Sections 5/6 -- no additional LLM call for this document." },
    "deterministic"
  );

  const validation = validateCitations(resolvedForValidation, evidenceGraphForHints.facts);
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
    `Module engineering profile + API reference completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model} -- 1 LLM call total (0 additional for API Reference), ${packNames.length} capabilities synthesized together.`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, file: outputLabel, capabilityCount: packNames.length, appendixCitationCount: appendix.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

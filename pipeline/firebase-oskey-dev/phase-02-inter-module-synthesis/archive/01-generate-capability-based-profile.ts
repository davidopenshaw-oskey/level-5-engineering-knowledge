// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 01): Capability-Based Module Profile Runner.
//
// Stage A (the per-capability loop below) is still valid and still used --
// but as of 2026-08-11 (governance/roadmap/04-complete-repo-run-and-repo-
// reports-plan.md Stage 1) it has its own standalone runner,
// 01a-generate-capability-syntheses.ts, which shares the exact same
// prompt-construction logic (_shared/capability-synthesis.ts) without also
// paying for this script's Stage B below. Stage B here is RETIRED for new
// work -- 01c-generate-assembly-first-profile.ts is the standard reduce/
// assembly step now, validated by governance/roadmap/03-token-economics-
// remediation-plan.md Stage 3 to produce the same document shape at lower
// cost. Use 01a + 01c for new modules; this script's Stage B is kept only
// as a historical/comparison baseline.
//
// Alternative to 00-generate-module-profile.ts (also retired) for modules
// whose full evidence graph doesn't fit in a single prompt (the `building`
// overflow that motivated this whole design -- see governance/adrs/
// adr-003.md and governance/roadmap/00-capability-based-module-synthesis.md).
// Instead of one call over the whole evidence graph, this runs:
//
//   capability packs (already partitioned by 05-partition-capability-packs.ts)
//     -> one capability-synthesis call per pack (contracts/00-capability-synthesis.md)
//     -> one reduce call over all capability outputs (contracts/01-module-synthesis-reduce.md)
//     -> same final profile + API reference, written to the same knowledge-corpus location
//
// Capability calls run SEQUENTIALLY, not fanned out in parallel -- deliberate
// for this first working version (simpler to debug, easier to reason about
// partial-failure/retry later); see Stage 6 of the plan doc for the decision.
// The final reduce step's two calls (profile, API reference) run in
// parallel, same as 00-generate-module-profile.ts, for the same reason
// (isolate a truncated-output failure per document).

import "dotenv/config";

import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
  factsToCompactTable,
} from "../../phase-01-ast-extraction/_shared/run-utils";
import { LlmProviderConfig, CACHE_BREAKPOINT_MARKER } from "../_shared/llm-adapter";
import {
  readRequiredFile,
  resolveContractsRootAbs,
  loadDocs,
  runDocumentCalls,
  DocumentCallSpec,
} from "../_shared/synthesis-orchestrator";
import { flattenRbacRoles } from "../_shared/rbac-flatten";
import { resolveApiSchemas, formatResolvedApiSchemas } from "../_shared/api-schema-resolver";
import { filterCallEdgesForModule, formatCallEdges } from "../_shared/call-edges";
import { computeOwnershipHints, formatOwnershipHints } from "../_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "../_shared/citation-validator";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01-run-capability-based-profile";

interface CapabilityBasedProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  capabilitySynthesisContractPaths: string[];
  moduleSynthesisContractPaths: string[];
}

interface CapabilityPackPayload {
  schemaVersion: string;
  runId: string;
  repoName: string;
  module: string;
  submodule: string;
  generatedAt: string;
  summary: { factCount: number };
  facts: any[];
}

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const MODULE_NAME = process.env.MODULE_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;

  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  if (!MODULE_NAME) throw new Error("[Fail-Closed] MODULE_NAME environment variable is required and was not set.");
  if (!LLM_CONFIG_KEY) throw new Error("[Fail-Closed] LLM_CONFIG_KEY environment variable is required and was not set.");

  // --- Resolve run context (namespaced per repo) ---
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

  // --- Resolve LLM provider config (never hardcoded) ---
  const llmProvidersConfigPath = path.join(projectRoot, "config", "llm-providers.json");
  const llmProvidersConfig = JSON.parse(readRequiredFile(llmProvidersConfigPath, "config/llm-providers.json"));
  const llmConfig: LlmProviderConfig = llmProvidersConfig.providers?.[LLM_CONFIG_KEY];
  if (!llmConfig) {
    const available = Object.keys(llmProvidersConfig.providers || {}).join(", ");
    throw new Error(`[Fail-Closed] LLM_CONFIG_KEY '${LLM_CONFIG_KEY}' not found in config/llm-providers.json. Available: ${available}`);
  }

  // --- Resolve per-repo capability-based-profile contract config ---
  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(readRequiredFile(repoConfigPath, "config/repos.json"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  if (!targetRepoCfg) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }
  if (!targetRepoCfg.phase2?.capabilityBasedProfile) {
    throw new Error(
      `[Fail-Closed] Repository '${REPO_NAME}' has no phase2.capabilityBasedProfile configured in config/repos.json. ` +
        `Every repo must explicitly set contractsRoot/contractsRootBase/architecturalGroundingPaths/` +
        `capabilitySynthesisContractPaths/moduleSynthesisContractPaths -- there is no default.`
    );
  }
  const capCfg: CapabilityBasedProfileConfig = targetRepoCfg.phase2.capabilityBasedProfile;

  // --- Dynamic module resolution: NEVER hardcode module names/count ---
  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();

  if (!moduleNames.includes(MODULE_NAME)) {
    throw new Error(
      `[Fail-Closed] Module '${MODULE_NAME}' not found in this run's facts/modules.json. Available modules (${moduleNames.length}): ${moduleNames.join(", ")}`
    );
  }

  // --- Enumerate this module's capability packs (already partitioned by 05-partition-capability-packs.ts) ---
  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  if (!fs.existsSync(packsDir)) {
    throw new Error(
      `[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'. Run 05-partition-capability-packs.ts first.`
    );
  }
  const packNames = fs
    .readdirSync(packsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
    .sort();
  if (packNames.length === 0) {
    throw new Error(`[Fail-Closed] Capability-packs directory for module '${MODULE_NAME}' is empty at '${packsDir}'.`);
  }

  // --- Load contract + grounding docs (shared across every call this script makes) ---
  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, capCfg);
  const groundingDocs = loadDocs(contractsRootAbs, capCfg.architecturalGroundingPaths, "architectural grounding doc");

  // Flatten rbac-roles.json to its leaf permission strings + English
  // descriptions only -- see _shared/rbac-flatten.ts and governance/roadmap/
  // 02-structural-narrative-synthesis-tiers.md Stage 3. Applied once here,
  // before groundingDocs is used by either the per-capability calls or the
  // reduce call, so both benefit.
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) {
      doc.content = flattenRbacRoles(doc.content);
    }
  }

  const capabilitySynthesisDocs = loadDocs(contractsRootAbs, capCfg.capabilitySynthesisContractPaths, "capability-synthesis contract doc");
  const moduleSynthesisDocs = loadDocs(contractsRootAbs, capCfg.moduleSynthesisContractPaths, "module-synthesis (reduce) contract doc");

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  // --- Stage A: one capability-synthesis call per pack, sequentially ---
  const capabilitySynthesesDir = path.join(moduleDir, "capability-syntheses");
  const capabilityOutputs: Array<{ packName: string; content: string }> = [];

  for (const packName of packNames) {
    const packPath = path.join(packsDir, `${packName}.json`);
    const packRaw = readRequiredFile(packPath, `capability pack '${packName}' for module '${MODULE_NAME}'`);
    const pack: CapabilityPackPayload = JSON.parse(packRaw);

    if (pack.runId !== runId || pack.repoName !== REPO_NAME || pack.module !== MODULE_NAME || pack.submodule !== packName) {
      throw new Error(`[Fail-Closed] Identity mismatch in capability pack '${packName}' for module '${MODULE_NAME}'.`);
    }

    const compactFacts = factsToCompactTable(pack.facts);
    // Deterministic join of this pack's own api_contract requestType/
    // responseType against its own model_property facts -- see
    // _shared/api-schema-resolver.ts and governance/roadmap/02-structural-
    // narrative-synthesis-tiers.md Stage 3. Scoped to this pack only, same
    // as every other capability-level input.
    const resolvedApiSchemas = formatResolvedApiSchemas(resolveApiSchemas(pack.facts));
    const capRelPath = `${packName}.md`;

    // Stable prefix (identical across all N capability calls for this
    // module, this run) split from variable per-capability content -- see
    // CACHE_BREAKPOINT_MARKER's comment in llm-adapter.ts. This is the
    // confirmed dominant cost driver per governance/roadmap/03-token-
    // economics-remediation-plan.md's real Stage 3 measurement: these N
    // sequential calls all resend this identical block uncached today.
    const stableSections: string[] = [];
    stableSections.push(`You are performing capability-level synthesis for one capability inside one module. Follow the supporting contract documents below exactly.`);
    stableSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
    for (const doc of capabilitySynthesisDocs) {
      stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);
    }
    stableSections.push(`## Architectural Grounding Documents`);
    for (const doc of groundingDocs) {
      stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);
    }
    stableSections.push(moduleListSection);

    const variableSections: string[] = [];
    variableSections.push(
      `## Generation Metadata (use these exact values verbatim)\n\n` +
        `- runId: ${runId}\n` +
        `- generatedAt: ${pack.generatedAt}\n` +
        `- repoName: ${REPO_NAME}\n` +
        `- targetModule: ${MODULE_NAME}\n` +
        `- capability: ${packName}\n` +
        `- llmConfigKey: ${LLM_CONFIG_KEY}\n` +
        `- llmProvider: ${llmConfig.provider}\n` +
        `- llmModel: ${llmConfig.model}`
    );
    variableSections.push(`## Capability Evidence Pack (${packName}, ${pack.summary.factCount} facts, compact table encoding)\n\n${compactFacts}`);
    variableSections.push(
      `## Resolved API Request/Response Schemas (deterministic join, not narrative -- use this directly)\n\n${resolvedApiSchemas}`
    );
    variableSections.push(
      `## Output Format (mandatory)\n\n` +
        `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
        `===FILE: ${capRelPath}===\n` +
        `<full content of the capability synthesis per the output schema>\n` +
        `===END FILE===\n\n` +
        `Do not include any conversational preamble, explanation, or text outside this marked block.`
    );

    const capabilityPrompt = stableSections.join("\n\n---\n\n") + CACHE_BREAKPOINT_MARKER + variableSections.join("\n\n---\n\n");

    const spec: DocumentCallSpec = { relPath: capRelPath, prompt: capabilityPrompt, kind: `capability:${packName}` };
    const written = await runDocumentCalls(
      [spec],
      llmConfig,
      capabilitySynthesesDir,
      notifications,
      SOURCE_SCRIPT,
      `module '${MODULE_NAME}' capability '${packName}'`,
      LLM_CONFIG_KEY
    );
    capabilityOutputs.push({ packName, content: written.get(capRelPath)! });
  }

  // --- Stage B: reduce call over all capability outputs ---
  const outputDocsDir = path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

  // Deterministic cross-module dependency graph (06-build-cross-module-
  // dependency-graph.ts) -- given ONLY to the reduce step, not each
  // capability call. It's module-scoped (not submodule-scoped), so it
  // doesn't map onto individual capability packs, and resending it to every
  // one of N capability calls would just be repeated cost for no benefit --
  // the reduce step is the one place doing whole-module-level synthesis
  // anyway. See governance/roadmap/01-cross-module-dependency-graph.md.
  const crossModuleDepsPath = path.join(moduleDir, "cross-module-dependencies.json");
  const crossModuleDepsRaw = readRequiredFile(crossModuleDepsPath, `cross-module dependency graph for module '${MODULE_NAME}'`);

  // Deterministic intra-module (cross-submodule) coupling graph
  // (07-build-intra-module-coupling-graph.ts) -- same reasoning as the
  // cross-module graph above, one level down. Replaces the reduce step's
  // previous narrative reconciliation of capability outputs' own import
  // lists (see the "Internal Structure" cross-referencing table pattern in
  // earlier building profiles) with a deterministic artifact.
  const intraModuleCouplingPath = path.join(moduleDir, "intra-module-coupling.json");
  const intraModuleCouplingRaw = readRequiredFile(intraModuleCouplingPath, `intra-module coupling graph for module '${MODULE_NAME}'`);

  // Repo-wide resolved cross-module CALL edges (04-build-resolved-graph.ts)
  // -- never previously fed to P2. See _shared/call-edges.ts and
  // governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3.
  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  const callEdgesForModule = filterCallEdgesForModule(resolvedGraph, MODULE_NAME);

  // Data ownership hint (see _shared/ownership-hints.ts) needs className ->
  // defining-submodule, which lives in the module's own evidence graph --
  // read here ONLY to compute this one deterministic aggregation, not
  // exposed to the LLM as raw evidence (the reduce step still never sees
  // raw facts directly; it only sees the small, formatted hint below).
  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}' (ownership hints only)`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  const reduceSections: string[] = [];
  reduceSections.push(`## Supporting Contracts (persona, rules, output schema, task definition, reduce-specific reconciliation duties)`);
  for (const doc of moduleSynthesisDocs) {
    reduceSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }
  reduceSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) {
    reduceSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }
  reduceSections.push(
    `## Cross-Module Dependency Graph (${MODULE_NAME}/cross-module-dependencies.json -- deterministic, derived from AST import ` +
      `resolution, NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed** -- report inbound and outbound relationships from this graph as Confirmed, not Inferred. ` +
      `No capability output above can see inbound coupling on its own (each only sees its own outbound imports) -- this graph is ` +
      `the authoritative source for which OTHER modules depend on this one.\n\n\`\`\`json\n${crossModuleDepsRaw}\n\`\`\``
  );
  reduceSections.push(
    `## Intra-Module Coupling Graph (${MODULE_NAME}/intra-module-coupling.json -- deterministic, derived from AST import resolution, ` +
      `NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed** -- report which submodules depend on which sibling submodules from this graph directly, ` +
      `do not reconcile it yourself from the capability outputs' own Outbound Coupling sections above. Use this for Section 5 ` +
      `(Internal Structure)'s intra-module coupling discussion.\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``
  );
  reduceSections.push(
    `## Resolved Cross-Module Call Edges (deterministic, method-level -- from the compiler's own symbol resolution, NOT LLM inference)\n\n` +
      `More specific than the Cross-Module Dependency Graph above: not just "depends on module X" but the exact class/method called. ` +
      `Use this for Section 10 (Cross-Module Relationships) and Section 12 (Architectural Observations) where the specific method ` +
      `matters. Report entries as **Confirmed** or per their own listed confidence.\n\n${formatCallEdges(callEdgesForModule)}`
  );
  reduceSections.push(
    `## Data Ownership Hints (deterministic SIGNAL, not a label -- for Section 6 Firestore & Data Ownership)\n\n` +
      `A class called into by multiple other submodules/modules is likely the true owner of whatever data it manages -- but this is ` +
      `a hint for your judgment, not an automated verdict. Do not present it as Confirmed ownership on its own; combine it with what ` +
      `the capability outputs above already evidenced about that class's Firestore paths.\n\n${formatOwnershipHints(ownershipHints)}`
  );
  reduceSections.push(moduleListSection);
  reduceSections.push(
    `## Generation Metadata (use these exact values verbatim -- do not copy them from within any capability output below, use these)\n\n` +
      `- runId: ${runId}\n` +
      `- generatedAt: ${new Date().toISOString()}\n` +
      `- repoName: ${REPO_NAME}\n` +
      `- targetModule: ${MODULE_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n` +
      `- llmProvider: ${llmConfig.provider}\n` +
      `- llmModel: ${llmConfig.model}`
  );
  reduceSections.push(
    `## Capability Outputs for '${MODULE_NAME}' (${capabilityOutputs.length} capabilities, from the prior capability-synthesis step -- not raw evidence)\n\n` +
      capabilityOutputs.map(c => `### Capability: ${c.packName}\n\n${c.content}`).join("\n\n---\n\n")
  );

  const reduceContext = reduceSections.join("\n\n---\n\n");

  const profilePrompt = [
    `You are producing the final Module Engineering Profile by reducing multiple capability-level syntheses into one module-wide document. Follow the supporting contract documents below exactly.`,
    reduceContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${profileRelPath}===\n` +
      `<full content of the Module Engineering Profile per the output schema>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not produce the API Reference document in this response -- it is requested separately.`,
  ].join("\n\n---\n\n");

  const apiRefPrompt = [
    `You are producing the final API Reference (a companion to a Module Engineering Profile) by reducing multiple capability-level syntheses into one module-wide document. Follow the supporting contract documents below exactly.`,
    reduceContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${apiRefRelPath}===\n` +
      `<full content of the API Reference per the output schema>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not produce the Module Engineering Profile document in this response -- it is requested separately.`,
  ].join("\n\n---\n\n");

  const reduceSpecs: DocumentCallSpec[] = [
    { relPath: profileRelPath, prompt: profilePrompt, kind: "profile" },
    { relPath: apiRefRelPath, prompt: apiRefPrompt, kind: "api-reference" },
  ];

  const written = await runDocumentCalls(reduceSpecs, llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (reduce)`, LLM_CONFIG_KEY);

  // Generate-then-verify citation check (Stage 3, adr-004.md) -- checked
  // against the full module evidence graph (already loaded for ownership
  // hints above), since the reduce output's citations can reference any
  // capability's facts, not just one pack's.
  for (const [relPath, content] of written.entries()) {
    const validation = validateCitations(content, evidenceGraphForHints.facts);
    if (validation.fileNotFound.length > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "warning",
        "CITATION_FILE_NOT_FOUND",
        `${relPath}: ${validation.fileNotFound.length} citation(s) reference a file not found anywhere in module '${MODULE_NAME}''s evidence -- likely fabricated.`,
        { module: MODULE_NAME, relPath, file: relPath, details: formatCitationValidation(validation) },
        true
      );
    } else if (validation.totalCitations > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "info",
        "CITATION_VALIDATION_PASSED",
        `${relPath}: ${validation.totalCitations} citation(s) checked, ${validation.verified} verified, ${validation.lineUnverified.length} line-unverified (weak signal), 0 file-not-found.`,
        { module: MODULE_NAME, relPath, file: relPath }
      );
    }
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "CAPABILITY_BASED_PROFILE_COMPLETED",
    `Capability-based Module Engineering Profile generation completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model} (${packNames.length} capabilities).`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, capabilityCount: packNames.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

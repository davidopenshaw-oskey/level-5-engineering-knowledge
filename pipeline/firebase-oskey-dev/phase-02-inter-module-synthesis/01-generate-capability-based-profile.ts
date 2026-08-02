// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 01): Capability-Based Module Profile Runner.
// Alternative to 00-generate-module-profile.ts for modules whose full
// evidence graph doesn't fit in a single prompt (the `building` overflow
// that motivated this whole design -- see governance/adrs/adr-003.md and
// governance/roadmap/00-capability-based-module-synthesis.md). Instead of
// one call over the whole evidence graph, this runs:
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
} from "../phase-01-ast-extraction/_shared/run-utils";
import { LlmProviderConfig } from "./_shared/llm-adapter";
import {
  readRequiredFile,
  resolveContractsRootAbs,
  loadDocs,
  runDocumentCalls,
  DocumentCallSpec,
} from "./_shared/synthesis-orchestrator";

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
    const capRelPath = `${packName}.md`;

    const capSections: string[] = [];
    capSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
    for (const doc of capabilitySynthesisDocs) {
      capSections.push(`### ${doc.relPath}\n\n${doc.content}`);
    }
    capSections.push(`## Architectural Grounding Documents`);
    for (const doc of groundingDocs) {
      capSections.push(`### ${doc.relPath}\n\n${doc.content}`);
    }
    capSections.push(moduleListSection);
    capSections.push(
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
    capSections.push(`## Capability Evidence Pack (${packName}, ${pack.summary.factCount} facts, compact table encoding)\n\n${compactFacts}`);

    const capabilityPrompt = [
      `You are performing capability-level synthesis for one capability inside one module. Follow the supporting contract documents below exactly.`,
      capSections.join("\n\n---\n\n"),
      `## Output Format (mandatory)\n\n` +
        `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
        `===FILE: ${capRelPath}===\n` +
        `<full content of the capability synthesis per the output schema>\n` +
        `===END FILE===\n\n` +
        `Do not include any conversational preamble, explanation, or text outside this marked block.`,
    ].join("\n\n---\n\n");

    const spec: DocumentCallSpec = { relPath: capRelPath, prompt: capabilityPrompt, kind: `capability:${packName}` };
    const written = await runDocumentCalls(
      [spec],
      llmConfig,
      capabilitySynthesesDir,
      notifications,
      SOURCE_SCRIPT,
      `module '${MODULE_NAME}' capability '${packName}'`
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

  await runDocumentCalls(reduceSpecs, llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (reduce)`);

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

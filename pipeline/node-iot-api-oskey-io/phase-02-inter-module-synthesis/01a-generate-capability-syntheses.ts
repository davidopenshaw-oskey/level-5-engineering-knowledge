// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 01a): Capability Synthesis Runner -- Stage A only.
// Runs one capability-synthesis call per pack (contracts/00-capability-
// synthesis.md) for every capability pack belonging to a module, sequentially,
// and stops there -- no reduce call. Exists so that 01c-generate-assembly-
// first-profile.ts (now the standard reduce/assembly step, per governance/
// roadmap/04-complete-repo-run-and-repo-reports-plan.md Stage 1) can be run
// against a module WITHOUT first paying for 01-generate-capability-based-
// profile.ts's now-superseded Stage B reduce call.
//
// Applies uniformly to every module regardless of size: 05-partition-
// capability-packs.ts groups any facts without a real submodule into a
// catch-all `_module_root` pack, so even a small, flat module still produces
// at least one capability pack (confirmed governance/roadmap/
// 04-gaps-and-issues-before-full-repo-run.md item 4's investigation) -- there
// is no module-size threshold below which this script doesn't apply.
// 00-generate-module-profile.ts's separate single-call path is retired for
// all future modules; see that script's own header comment.

import "dotenv/config";

import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "../phase-01-ast-extraction/_shared/run-utils";
import { LlmProviderConfig } from "./_shared/llm-adapter";
import { readRequiredFile, resolveContractsRootAbs, loadDocs, runDocumentCalls, DocumentCallSpec } from "./_shared/synthesis-orchestrator";
import { flattenRbacRoles } from "./_shared/rbac-flatten";
import { buildCapabilityPrompt, CapabilityPackPayload, CapabilitySynthesisContext } from "./_shared/capability-synthesis";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01a-generate-capability-syntheses";

interface CapabilityBasedProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  capabilitySynthesisContractPaths: string[];
  moduleSynthesisContractPaths: string[];
  // Optional, repo-specific: capability-pack names to skip entirely (never
  // sent to the LLM). Added for node-iot-api-oskey-io's "_unreferenced" pack
  // (verified-dead files -- see governance/roadmap/node-iot-api-oskey-io/
  // 01-phase2-contract-design.md, Decision 3): "this file is unreferenced"
  // is already a fully deterministic Phase 1 fact, so spending a real LLM
  // call to have it narrate that finding adds cost without adding
  // information. Absent/undefined -- the default for every other repo's
  // config today -- excludes nothing, fully backward compatible.
  excludeCapabilityPacks?: string[];
}

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
  if (!targetRepoCfg.phase2?.capabilityBasedProfile) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' has no phase2.capabilityBasedProfile configured in config/repos.json.`);
  }
  const capCfg: CapabilityBasedProfileConfig = targetRepoCfg.phase2.capabilityBasedProfile;

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();
  if (!moduleNames.includes(MODULE_NAME)) {
    throw new Error(`[Fail-Closed] Module '${MODULE_NAME}' not found in this run's facts/modules.json. Available (${moduleNames.length}): ${moduleNames.join(", ")}`);
  }

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  if (!fs.existsSync(packsDir)) {
    throw new Error(`[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'. Run 05-partition-capability-packs.ts first.`);
  }
  const allPackNames = fs
    .readdirSync(packsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
    .sort();
  if (allPackNames.length === 0) {
    throw new Error(`[Fail-Closed] Capability-packs directory for module '${MODULE_NAME}' is empty at '${packsDir}'.`);
  }

  const excludeSet = new Set(capCfg.excludeCapabilityPacks || []);
  const packNames = allPackNames.filter(p => !excludeSet.has(p));
  const excludedPackNames = allPackNames.filter(p => excludeSet.has(p));
  if (excludedPackNames.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "CAPABILITY_PACKS_EXCLUDED",
      `Excluded ${excludedPackNames.length} capability pack(s) from LLM synthesis per config.phase2.capabilityBasedProfile.excludeCapabilityPacks: ${excludedPackNames.join(", ")}.`,
      { excludedPackNames }
    );
  }
  if (packNames.length === 0) {
    throw new Error(`[Fail-Closed] All capability packs for module '${MODULE_NAME}' were excluded by excludeCapabilityPacks -- nothing left to synthesize.`);
  }

  // Loaded once per module, whole-module facts (every capability combined) --
  // required by resolveRouteSchemas (route-schema-resolver.ts), which cannot
  // be scoped to one capability pack's own facts. See that file's header
  // comment: this module's schema files are sometimes shared across
  // multiple capabilities' routes, with the schema's own fields landing in
  // a DIFFERENT pack than the route that references them.
  const moduleFactsPath = path.join(moduleDir, `${MODULE_NAME}-facts.json`);
  const moduleFacts: any[] = JSON.parse(readRequiredFile(moduleFactsPath, `module facts for '${MODULE_NAME}'`));

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, capCfg);
  const groundingDocs = loadDocs(contractsRootAbs, capCfg.architecturalGroundingPaths, "architectural grounding doc");
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) doc.content = flattenRbacRoles(doc.content);
  }
  const capabilitySynthesisDocs = loadDocs(contractsRootAbs, capCfg.capabilitySynthesisContractPaths, "capability-synthesis contract doc");

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  const ctx: CapabilitySynthesisContext = {
    runId,
    repoName: REPO_NAME,
    moduleName: MODULE_NAME,
    llmConfigKey: LLM_CONFIG_KEY,
    llmConfig,
    moduleListSection,
    capabilitySynthesisDocs,
    groundingDocs,
    moduleFacts,
  };

  // COMPARISON_MODE (opt-in, per governance/roadmap/04-complete-repo-run-
  // and-repo-reports-plan.md Stage 6): writes to output/runs/<repo>/<runId>/
  // llm-comparison/<LLM_CONFIG_KEY>/<module>/capability-syntheses/, matching
  // 01b-rerun-reduce-only.ts's existing convention. Without it, this would
  // silently overwrite the canonical capability-syntheses/ used by whichever
  // provider ran first -- e.g. a gold-standard Claude run -- since that
  // directory has no provider namespacing by default.
  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";
  const capabilitySynthesesDir = COMPARISON_MODE
    ? path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, MODULE_NAME, "capability-syntheses")
    : path.join(moduleDir, "capability-syntheses");

  for (const packName of packNames) {
    const packPath = path.join(packsDir, `${packName}.json`);
    const packRaw = readRequiredFile(packPath, `capability pack '${packName}' for module '${MODULE_NAME}'`);
    const pack: CapabilityPackPayload = JSON.parse(packRaw);
    if (pack.runId !== runId || pack.repoName !== REPO_NAME || pack.module !== MODULE_NAME || pack.submodule !== packName) {
      throw new Error(`[Fail-Closed] Identity mismatch in capability pack '${packName}' for module '${MODULE_NAME}'.`);
    }

    const { prompt, capRelPath } = buildCapabilityPrompt(packName, pack, ctx);
    const spec: DocumentCallSpec = { relPath: capRelPath, prompt, kind: `capability:${packName}` };
    await runDocumentCalls([spec], llmConfig, capabilitySynthesesDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' capability '${packName}'`, LLM_CONFIG_KEY);
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "CAPABILITY_SYNTHESES_COMPLETED",
    `Generated ${packNames.length} capability synthesis document(s) for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model}. No reduce call made -- run 01c-generate-assembly-first-profile.ts next.`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, file: "capability-syntheses", capabilityCount: packNames.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Generated ${packNames.length} capability synthesis document(s) for module '${MODULE_NAME}' in ${capabilitySynthesesDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

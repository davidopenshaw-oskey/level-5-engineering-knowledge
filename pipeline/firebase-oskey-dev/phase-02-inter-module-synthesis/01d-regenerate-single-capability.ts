// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Dev/test utility for governance/roadmap/03-token-economics-remediation-
// plan.md Stage 3: regenerates ONE named capability's synthesis output,
// under the current (2026-08-11) capability-synthesis contract, without
// re-running the other capabilities or any reduce step. Exists specifically
// to validate cheaply -- one real LLM call -- whether the new contract's
// section restructuring (Public Interfaces split from API Contracts &
// Triggers; External Hooks added) actually gets followed in practice, before
// spending on regenerating all of a module's capabilities for the full
// assembly-first experiment (01c-generate-assembly-first-profile.ts).
//
// Writes to the same real capability-syntheses/<capability>.md location
// 01-generate-capability-based-profile.ts would -- not a throwaway location
// -- since a successful regeneration here is the first of however many
// capabilities eventually need regenerating under the new contract anyway.
// Reuses the exact same prompt-construction logic as that script's Stage A
// loop, scoped to one capability via CAPABILITY_NAME.

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
import { writeProvenanceSidecar } from "./_shared/provenance-sidecar";
import { buildCapabilityPrompt, buildPublicInterfacesSection, CapabilityPackPayload, CapabilitySynthesisContext } from "./_shared/capability-synthesis";
import { replaceNumberedSection } from "./_shared/document-sections";

const CAP_SECTION_PUBLIC_INTERFACES = 3;

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01d-regenerate-single-capability";

interface CapabilityBasedProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  capabilitySynthesisContractPaths: string[];
  moduleSynthesisContractPaths: string[];
}

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const MODULE_NAME = process.env.MODULE_NAME;
  const CAPABILITY_NAME = process.env.CAPABILITY_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;

  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  if (!MODULE_NAME) throw new Error("[Fail-Closed] MODULE_NAME environment variable is required and was not set.");
  if (!CAPABILITY_NAME) throw new Error("[Fail-Closed] CAPABILITY_NAME environment variable is required and was not set.");
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
    throw new Error(`[Fail-Closed] Module '${MODULE_NAME}' not found. Available: ${moduleNames.join(", ")}`);
  }

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  // COMPARISON_MODE (matches 01a-generate-capability-syntheses.ts's own convention) --
  // added 2026-08-29 after this script's previous unconditional canonical-path write
  // silently overwrote a capability-synthesis file that belonged to the canonical
  // gemini-default (temp 0.2) baseline while regenerating just one capability under a
  // different LLM_CONFIG_KEY for a comparison run. Without this, a single-capability
  // regen under any non-canonical config always corrupts the canonical baseline it's
  // meant to be compared against, rather than writing alongside it.
  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";
  const capabilitySynthesesDir = COMPARISON_MODE
    ? path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, MODULE_NAME, "capability-syntheses")
    : path.join(moduleDir, "capability-syntheses");
  const packPath = path.join(packsDir, `${CAPABILITY_NAME}.json`);
  if (!fs.existsSync(packPath)) {
    const available = fs.existsSync(packsDir) ? fs.readdirSync(packsDir).map(f => f.replace(/\.json$/, "")).join(", ") : "(packsDir missing)";
    throw new Error(`[Fail-Closed] Capability pack '${CAPABILITY_NAME}' not found for module '${MODULE_NAME}'. Available: ${available}`);
  }

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, capCfg);
  const groundingDocs = loadDocs(contractsRootAbs, capCfg.architecturalGroundingPaths, "architectural grounding doc");
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) doc.content = flattenRbacRoles(doc.content);
  }
  // CAPABILITY_CONTRACT_PATHS_OVERRIDE -- see 01a-generate-capability-syntheses.ts's
  // identical comment. Added for the V1-A/V1-B A/B/AB factorial experiment.
  const capabilityContractPathsOverride = process.env.CAPABILITY_CONTRACT_PATHS_OVERRIDE?.split(",").map(p => p.trim()).filter(Boolean);
  const capabilitySynthesisDocs = loadDocs(contractsRootAbs, capabilityContractPathsOverride ?? capCfg.capabilitySynthesisContractPaths, "capability-synthesis contract doc");

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  const packRaw = readRequiredFile(packPath, `capability pack '${CAPABILITY_NAME}' for module '${MODULE_NAME}'`);
  const pack: CapabilityPackPayload = JSON.parse(packRaw);
  if (pack.runId !== runId || pack.repoName !== REPO_NAME || pack.module !== MODULE_NAME || pack.submodule !== CAPABILITY_NAME) {
    throw new Error(`[Fail-Closed] Identity mismatch in capability pack '${CAPABILITY_NAME}' for module '${MODULE_NAME}'.`);
  }

  const ctx: CapabilitySynthesisContext = {
    runId,
    repoName: REPO_NAME,
    moduleName: MODULE_NAME,
    llmConfigKey: LLM_CONFIG_KEY,
    llmConfig,
    moduleListSection,
    capabilitySynthesisDocs,
    groundingDocs,
  };
  const { prompt: capabilityPrompt, capRelPath } = buildCapabilityPrompt(CAPABILITY_NAME, pack, ctx);

  const spec: DocumentCallSpec = { relPath: capRelPath, prompt: capabilityPrompt, kind: `capability:${CAPABILITY_NAME}` };
  const written = await runDocumentCalls([spec], llmConfig, capabilitySynthesesDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' capability '${CAPABILITY_NAME}' (single-capability regen)`, LLM_CONFIG_KEY);

  const rawContent = written.get(capRelPath)!;
  const deterministicPublicInterfaces = buildPublicInterfacesSection(pack.facts);
  const patchedContent = replaceNumberedSection(rawContent, CAP_SECTION_PUBLIC_INTERFACES, deterministicPublicInterfaces);
  fs.writeFileSync(path.join(capabilitySynthesesDir, capRelPath), patchedContent, "utf8");

  writeProvenanceSidecar(
    path.join(capabilitySynthesesDir, capRelPath),
    patchedContent,
    pack.facts,
    { runId, repoName: REPO_NAME, module: MODULE_NAME, capability: CAPABILITY_NAME, packFactCount: pack.summary.factCount, packGeneratedAt: pack.generatedAt, llmConfigKey: LLM_CONFIG_KEY },
    "llm"
  );

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "SINGLE_CAPABILITY_REGEN_COMPLETED",
    `Regenerated capability '${CAPABILITY_NAME}' for module '${MODULE_NAME}' under the current contract using ${llmConfig.provider}/${llmConfig.model}.`,
    { module: MODULE_NAME, capability: CAPABILITY_NAME, file: capRelPath }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Regenerated: ${path.join(capabilitySynthesesDir, capRelPath)}`);
  console.log(written.get(capRelPath));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

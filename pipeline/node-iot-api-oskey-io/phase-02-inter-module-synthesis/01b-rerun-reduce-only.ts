// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// One-off comparison tool: re-runs ONLY Stage B (the reduce step) of
// 01-generate-capability-based-profile.ts against a different LLM_CONFIG_KEY,
// reading the 11 already-written capability-synthesis files back off disk
// instead of re-running Stage A's capability calls. Built specifically for
// the cross-provider cost/consumption comparison exercise on `building`
// (2026-08-02) -- see governance/roadmap/02-structural-narrative-synthesis-
// tiers.md. Stage A (capability calls) already ran once against Anthropic
// and cost real money; there is no reason to pay for it again per provider
// just to compare the reduce step.
//
// Writes to output/runs/<repo>/<runId>/llm-comparison/<LLM_CONFIG_KEY>/ --
// NOT the shared knowledge-corpus path -- so this never collides with the
// Anthropic-generated building-engineering-profile.md, per the known,
// already-logged gap in governance/roadmap/tasks.md item 8 (no provider/
// model in the knowledge-corpus path). This is the "separate output/ side-
// channel per llmConfigKey" candidate mentioned there, applied ad hoc for
// this one comparison run -- the general design decision is still deferred.

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
import { filterCallEdgesForModule, formatCallEdges } from "./_shared/call-edges";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "./_shared/citation-validator";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01b-rerun-reduce-only";

interface CapabilityBasedProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  capabilitySynthesisContractPaths: string[];
  moduleSynthesisContractPaths: string[];
  // See 01a-generate-capability-syntheses.ts's identical field for the full
  // rationale. Load-bearing here too: without it, this script would try to
  // read a capability-synthesis .md for an excluded pack that 01a never
  // generated.
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
  if (!targetRepoCfg) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }
  if (!targetRepoCfg.phase2?.capabilityBasedProfile) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' has no phase2.capabilityBasedProfile configured in config/repos.json.`);
  }
  const capCfg: CapabilityBasedProfileConfig = targetRepoCfg.phase2.capabilityBasedProfile;

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();
  if (!moduleNames.includes(MODULE_NAME)) {
    throw new Error(
      `[Fail-Closed] Module '${MODULE_NAME}' not found in this run's facts/modules.json. Available modules (${moduleNames.length}): ${moduleNames.join(", ")}`
    );
  }

  const moduleDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME);
  const packsDir = path.join(moduleDir, "capability-packs");
  const capabilitySynthesesDir = path.join(moduleDir, "capability-syntheses");
  if (!fs.existsSync(packsDir)) {
    throw new Error(`[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'.`);
  }
  const allPackNames = fs
    .readdirSync(packsDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""))
    .sort();
  const excludeSet = new Set(capCfg.excludeCapabilityPacks || []);
  const packNames = allPackNames.filter(p => !excludeSet.has(p));
  const excludedPackNames = allPackNames.filter(p => excludeSet.has(p));
  if (excludedPackNames.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "CAPABILITY_PACKS_EXCLUDED",
      `Excluded ${excludedPackNames.length} capability pack(s) (no synthesis output expected for them) per config.phase2.capabilityBasedProfile.excludeCapabilityPacks: ${excludedPackNames.join(", ")}.`,
      { excludedPackNames }
    );
  }
  if (packNames.length === 0) {
    throw new Error(`[Fail-Closed] Capability-packs directory for module '${MODULE_NAME}' is empty at '${packsDir}'.`);
  }

  // --- Read the 11 already-written capability-synthesis outputs off disk
  // (produced by a prior run of 01-generate-capability-based-profile.ts,
  // any provider) instead of re-running Stage A. Fail closed if any are
  // missing -- this script is only valid when Stage A already succeeded.
  const capabilityOutputs: Array<{ packName: string; content: string }> = packNames.map(packName => {
    const capPath = path.join(capabilitySynthesesDir, `${packName}.md`);
    const content = readRequiredFile(
      capPath,
      `pre-existing capability-synthesis output for '${packName}' (run 01-generate-capability-based-profile.ts first)`
    );
    return { packName, content };
  });

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, capCfg);
  const groundingDocs = loadDocs(contractsRootAbs, capCfg.architecturalGroundingPaths, "architectural grounding doc");
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) {
      doc.content = flattenRbacRoles(doc.content);
    }
  }
  const moduleSynthesisDocs = loadDocs(contractsRootAbs, capCfg.moduleSynthesisContractPaths, "module-synthesis (reduce) contract doc");

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  const crossModuleDepsPath = path.join(moduleDir, "cross-module-dependencies.json");
  const crossModuleDepsRaw = readRequiredFile(crossModuleDepsPath, `cross-module dependency graph for module '${MODULE_NAME}'`);

  const intraModuleCouplingPath = path.join(moduleDir, "intra-module-coupling.json");
  const intraModuleCouplingRaw = readRequiredFile(intraModuleCouplingPath, `intra-module coupling graph for module '${MODULE_NAME}'`);

  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  const callEdgesForModule = filterCallEdgesForModule(resolvedGraph, MODULE_NAME);

  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}' (ownership hints only)`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

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
    `## Capability Outputs for '${MODULE_NAME}' (${capabilityOutputs.length} capabilities, from a prior capability-synthesis run -- not raw evidence)\n\n` +
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

  // Separate output dir per LLM_CONFIG_KEY -- see file header. Never the
  // shared knowledge-corpus path for this comparison exercise.
  const outputDocsDir = path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY);

  const written = await runDocumentCalls(reduceSpecs, llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (reduce, comparison: ${LLM_CONFIG_KEY})`, LLM_CONFIG_KEY);

  for (const [relPath, content] of written.entries()) {
    const validation = validateCitations(content, evidenceGraphForHints.facts);
    if (validation.fileNotFound.length > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "warning",
        "CITATION_FILE_NOT_FOUND",
        `[${LLM_CONFIG_KEY}] ${relPath}: ${validation.fileNotFound.length} citation(s) reference a file not found anywhere in module '${MODULE_NAME}''s evidence -- likely fabricated.`,
        { module: MODULE_NAME, relPath, file: `${LLM_CONFIG_KEY}/${relPath}`, details: formatCitationValidation(validation) },
        true
      );
    } else if (validation.totalCitations > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "info",
        "CITATION_VALIDATION_PASSED",
        `[${LLM_CONFIG_KEY}] ${relPath}: ${validation.totalCitations} citation(s) checked, ${validation.verified} verified, ${validation.lineUnverified.length} line-unverified (weak signal), 0 file-not-found.`,
        { module: MODULE_NAME, relPath, file: `${LLM_CONFIG_KEY}/${relPath}` }
      );
    }
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "REDUCE_ONLY_COMPARISON_COMPLETED",
    `Reduce-only comparison run completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model}.`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, file: `llm-comparison/${LLM_CONFIG_KEY}` }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Reduce-only comparison output written to: ${outputDocsDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

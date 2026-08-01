// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 00): Module Engineering Profile Runner.
// Assembles the module-profile task contract, rules, persona, output schema,
// architectural grounding docs, and the target module's Phase 1 evidence
// graph into a single prompt; calls a configurable LLM provider; splits the
// marker-delimited response into the two required output documents.
//
// DESIGN NOTES:
// - The module list given to the model is ALWAYS resolved live from this
//   run's facts/modules.json, never hardcoded -- a prompt that enumerates
//   "the 12 modules" by name goes stale the moment a 13th is added. This
//   script is the single place that resolves "which modules exist right
//   now," and every downstream reference (cross-module target-module
//   guessing, etc.) is built from that live read.
// - The LLM provider is never hardcoded. LLM_CONFIG_KEY selects an entry
//   from config/llm-providers.json at call time, so the exact same prompt
//   and evidence can be run against Gemini, Claude, or GPT for evaluation
//   without touching this script.
// - Architectural grounding and supporting-contract documents are read from
//   the CLONED target repo (output/clones/{REPO_NAME}/{contractsRoot}/...),
//   not from this pipeline's own files -- they are versioned with the code
//   they describe, so they are automatically commit-matched to the same
//   evidence they're being used to interpret.

import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "../phase-01-ast-extraction/_shared/run-utils";
import { callLlm, LlmProviderConfig } from "./_shared/llm-adapter";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-00-run-module-profile";

interface ModuleProfileConfig {
  contractsRoot: string;
  // Where contractsRoot is resolved from. "clone" (default) resolves it
  // against the cloned TARGET repo -- for a repo that keeps its own
  // grounding/contract docs versioned alongside its own code. "pipelineRoot"
  // resolves it against THIS pipeline's own repo instead -- for the
  // firebase-oskey-dev POC, the grounding docs (governance/reference-docs)
  // and contract docs (rules/, phase-02-inter-module-synthesis/) are
  // versioned here, not in the target repo. This field is the seam: moving
  // those docs to a different location later (e.g. a mounted GCS bucket
  // path once/if this runs on Gemini Enterprise in CI/CD) is a config
  // change here, not a script change.
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  supportingContractPaths: string[];
}

// Defaults match the paths actually referenced in the work-order document
// this was built from. Override per-repo via config/repos.json ->
// phase2.moduleProfile if a repo's contracts live elsewhere.
const DEFAULT_MODULE_PROFILE_CONFIG: ModuleProfileConfig = {
  contractsRoot: "ai-runtime/contracts",
  architecturalGroundingPaths: [
    "docs/Oskey Architecture.md",
    "docs/Oskey Backend Services & Data Architecture.md",
    "docs/firestore-schema.md",
    "docs/firestore.rules.txt",
    "docs/firestore.indexes.json",
    "docs/rbac-roles.json",
    "module-engineering-profile/cross-repository-architecture.md",
  ],
  supportingContractPaths: [
    "module-engineering-profile/work-order.md",
    "module-engineering-profile/rules.md",
    "module-engineering-profile/persona.md",
    "module-engineering-profile/output-schema.md",
  ],
};

function readRequiredFile(absPath: string, description: string): string {
  if (!fs.existsSync(absPath)) {
    throw new Error(`[Fail-Closed] Required ${description} not found at '${absPath}'.`);
  }
  return fs.readFileSync(absPath, "utf8");
}

/** Splits an LLM response into files using explicit markers we instruct the
 * model to emit. Fails closed (throws) if the expected markers aren't found
 * or don't cover the expected output paths, rather than silently writing a
 * malformed or partial document. */
function splitMarkedFiles(responseText: string, expectedPaths: string[]): Map<string, string> {
  const filePattern = /===FILE:\s*(.+?)\s*===\r?\n([\s\S]*?)(?:\r?\n===END FILE===|$)/g;
  const found = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = filePattern.exec(responseText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    found.set(filePath, content);
  }

  const missing = expectedPaths.filter(p => !found.has(p));
  if (missing.length > 0) {
    throw new Error(
      `[LLM_OUTPUT_PARSE_FAILED] Response did not contain expected ===FILE: ...=== markers for: ${missing.join(", ")}. ` +
        `Found markers for: ${Array.from(found.keys()).join(", ") || "(none)"}.`
    );
  }

  return found;
}

function main() {
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

  // --- Resolve per-repo module-profile contract config ---
  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(readRequiredFile(repoConfigPath, "config/repos.json"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  if (!targetRepoCfg) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }
  const moduleProfileCfg: ModuleProfileConfig = targetRepoCfg.phase2?.moduleProfile || DEFAULT_MODULE_PROFILE_CONFIG;

  // --- Dynamic module resolution: NEVER hardcode module names/count ---
  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();

  if (!moduleNames.includes(MODULE_NAME)) {
    throw new Error(
      `[Fail-Closed] Module '${MODULE_NAME}' not found in this run's facts/modules.json. Available modules (${moduleNames.length}): ${moduleNames.join(", ")}`
    );
  }

  // --- Load target module's Phase 1 evidence graph ---
  const evidenceGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphRaw = readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}'`);
  const evidenceGraph = JSON.parse(evidenceGraphRaw);

  // --- Load architectural grounding + supporting contract docs ---
  // Resolved against either the cloned TARGET repo ("clone", default) or
  // THIS pipeline's own repo ("pipelineRoot") -- see contractsRootBase.
  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs =
    moduleProfileCfg.contractsRootBase === "pipelineRoot"
      ? path.join(projectRoot, moduleProfileCfg.contractsRoot)
      : path.join(clonePath, moduleProfileCfg.contractsRoot);

  const groundingDocs = moduleProfileCfg.architecturalGroundingPaths.map(relPath => ({
    relPath,
    content: readRequiredFile(path.join(contractsRootAbs, relPath), `architectural grounding doc '${relPath}'`),
  }));

  const contractDocs = moduleProfileCfg.supportingContractPaths.map(relPath => ({
    relPath,
    content: readRequiredFile(path.join(contractsRootAbs, relPath), `supporting contract doc '${relPath}'`),
  }));

  // --- Output paths (per the work order's Required Output section) ---
  const outputDocsDir = path.join(projectRoot, "output", "docs", "runs", runId);
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

  // --- Assemble the prompt ---
  const promptSections: string[] = [];

  promptSections.push(
    `You are generating a Module Engineering Profile. Follow the supporting contract documents below exactly. ` +
      `Where they conflict with anything in this instruction, the contract documents govern.`
  );

  promptSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
  for (const doc of contractDocs) {
    promptSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }

  promptSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) {
    promptSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }

  // Dynamic, live-resolved module list -- never hardcoded in a contract doc.
  promptSections.push(
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
      `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
      moduleNames.map(m => `- ${m}`).join("\n")
  );

  promptSections.push(
    `## Generation Metadata (use these exact values verbatim -- do not copy them from within the evidence JSON below, use these)\n\n` +
      `- runId: ${evidenceGraph.runId}\n` +
      `- generatedAt: ${evidenceGraph.generatedAt}\n` +
      `- repoName: ${REPO_NAME}\n` +
      `- targetModule: ${MODULE_NAME}`
  );

  promptSections.push(`## Target Module Evidence Graph (${MODULE_NAME}-evidence-graph.json)\n\n\`\`\`json\n${evidenceGraphRaw}\n\`\`\``);

  promptSections.push(
    `## Output Format (mandatory)\n\n` +
      `Produce exactly two files. Wrap each one EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${profileRelPath}===\n` +
      `<full content of the Module Engineering Profile per the output schema>\n` +
      `===END FILE===\n\n` +
      `===FILE: ${apiRefRelPath}===\n` +
      `<full content of the API Reference per the output schema>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside these two marked blocks.`
  );

  const fullPrompt = promptSections.join("\n\n---\n\n");

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "MODULE_PROFILE_LLM_CALL_STARTED",
    `Calling LLM provider '${llmConfig.provider}' (model '${llmConfig.model}', config key '${LLM_CONFIG_KEY}') for module '${MODULE_NAME}'.`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  callLlm(fullPrompt, llmConfig)
    .then(result => {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "info",
        "MODULE_PROFILE_LLM_CALL_COMPLETED",
        `LLM call completed for module '${MODULE_NAME}'.`,
        { module: MODULE_NAME, usage: result.usage }
      );

      const files = splitMarkedFiles(result.text, [profileRelPath, apiRefRelPath]);

      for (const [relPath, content] of files.entries()) {
        const outPath = path.join(outputDocsDir, relPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, content, "utf8");
        console.log(`Wrote: ${outPath}`);
      }

      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "info",
        "MODULE_PROFILE_COMPLETED",
        `Module Engineering Profile generation completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model}.`,
        { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model }
      );
      writeNotificationsAtomically(notificationsPath, notifications);
    })
    .catch(err => {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "fatal",
        "MODULE_PROFILE_FAILED",
        `Module Engineering Profile generation failed for module '${MODULE_NAME}': ${err.message}`,
        { module: MODULE_NAME },
        true
      );
      writeNotificationsAtomically(notificationsPath, notifications);
      console.error(err);
      process.exit(1);
    });
}

main();
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

// Loads .env (repo root, gitignored -- see .env.example) into process.env
// before anything else runs. Only relevant for API-key-based providers
// (e.g. ANTHROPIC_API_KEY) -- Gemini needs no key here, it authenticates
// via Vertex AI + ADC instead. POC-stage credential storage; migrating to
// Secret Manager or similar later only means changing this one import,
// since every consumer already just reads process.env like it does today.
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
import {
  readRequiredFile,
  resolveContractsRootAbs,
  loadDocs,
  runDocumentCalls,
  DocumentCallSpec,
} from "./_shared/synthesis-orchestrator";
import { flattenRbacRoles } from "./_shared/rbac-flatten";
import { resolveApiSchemas, formatResolvedApiSchemas } from "./_shared/api-schema-resolver";
import { filterCallEdgesForModule, formatCallEdges } from "./_shared/call-edges";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "./_shared/citation-validator";

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
  // No hardcoded fallback default here deliberately (there used to be one --
  // see governance/roadmap/tasks.md and adr-003.md's sibling discussion on
  // this exact file). A hardcoded default silently goes stale the moment
  // the real contract docs move, exactly as happened before this was fixed.
  // Every repo must explicitly configure this in config/repos.json.
  if (!targetRepoCfg.phase2?.moduleProfile) {
    throw new Error(
      `[Fail-Closed] Repository '${REPO_NAME}' has no phase2.moduleProfile configured in config/repos.json. ` +
        `Every repo must explicitly set contractsRoot/contractsRootBase/architecturalGroundingPaths/supportingContractPaths -- there is no default.`
    );
  }
  const moduleProfileCfg: ModuleProfileConfig = targetRepoCfg.phase2.moduleProfile;

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

  // --- Load the deterministic cross-module dependency graph (06-build-
  // cross-module-dependency-graph.ts) -- gives this module's own evidence
  // pack the INBOUND coupling it cannot see on its own (a module's own
  // imports_dependency facts only show its outbound imports). See
  // governance/roadmap/01-cross-module-dependency-graph.md.
  const crossModuleDepsPath = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME, "cross-module-dependencies.json");
  const crossModuleDepsRaw = readRequiredFile(crossModuleDepsPath, `cross-module dependency graph for module '${MODULE_NAME}'`);

  // Same reasoning, one level down: deterministic intra-module (cross-
  // submodule) coupling (07-build-intra-module-coupling-graph.ts).
  const intraModuleCouplingPath = path.join(repoOutputDir, "knowledge-pipeline", "modules", MODULE_NAME, "intra-module-coupling.json");
  const intraModuleCouplingRaw = readRequiredFile(intraModuleCouplingPath, `intra-module coupling graph for module '${MODULE_NAME}'`);

  // Repo-wide resolved cross-module CALL edges (04-build-resolved-graph.ts)
  // -- built since Phase 1.75, never previously fed to P2 at all (found
  // during the Stage 3 audit). Complements the import-based cross-module
  // dependency graph above with method-level specificity: not just "module
  // A imports from module B" but "module A calls method M of class C in
  // module B". See governance/roadmap/02-structural-narrative-synthesis-
  // tiers.md Stage 3.
  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  const callEdgesForModule = filterCallEdgesForModule(resolvedGraph, MODULE_NAME);

  // --- Load architectural grounding + supporting contract docs ---
  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, moduleProfileCfg);
  const groundingDocs = loadDocs(contractsRootAbs, moduleProfileCfg.architecturalGroundingPaths, "architectural grounding doc");
  const contractDocs = loadDocs(contractsRootAbs, moduleProfileCfg.supportingContractPaths, "supporting contract doc");

  // Flatten rbac-roles.json to its leaf permission strings + English
  // descriptions only -- drops French and composite-role nesting that
  // synthesis never uses. See _shared/rbac-flatten.ts and
  // governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3.
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) {
      doc.content = flattenRbacRoles(doc.content);
    }
  }

  // --- Output paths ---
  // Deliberately OUTSIDE /output (which is entirely gitignored -- it holds
  // repo clones and raw AST facts, neither of which belong in git). These
  // finished synthesis documents are the actual knowledge-corpus
  // deliverable, so they get their own always-tracked home. Path is
  // deliberately model-agnostic (no provider/model in the path) -- which
  // LLM produced a given document is metadata about how it was made, not
  // part of its identity, and is recorded inside the document itself (see
  // Generation Metadata below) rather than forking the corpus by model.
  // Provisional location pending a real DevOps/engineering decision on
  // where synthesis artifacts should live long-term (see governance/roadmap
  // /tasks.md item 5) -- easy to redirect later, since this is the only
  // place that constructs the path.
  const outputDocsDir = path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

  // --- Assemble the SHARED context (everything both calls need) ---
  // Split into two separate LLM calls (profile, then API reference) rather
  // than one combined call producing both marker-delimited files. Reason:
  // asking for two full documents in a single response means a single
  // maxTokens budget has to cover both -- if output gets cut off partway
  // through the second document, splitMarkedFiles fails closed and BOTH
  // documents are lost, even if the first completed cleanly. Two calls
  // isolate that failure per-document and roughly double the effective
  // output budget available across the two documents combined, for the
  // same per-call maxTokens setting.
  const sharedSections: string[] = [];

  sharedSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
  for (const doc of contractDocs) {
    sharedSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }

  sharedSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) {
    sharedSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  }

  // Dynamic, live-resolved module list -- never hardcoded in a contract doc.
  sharedSections.push(
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
      `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
      moduleNames.map(m => `- ${m}`).join("\n")
  );

  sharedSections.push(
    `## Generation Metadata (use these exact values verbatim -- do not copy them from within the evidence JSON below, use these)\n\n` +
      `- runId: ${evidenceGraph.runId}\n` +
      `- generatedAt: ${evidenceGraph.generatedAt}\n` +
      `- repoName: ${REPO_NAME}\n` +
      `- targetModule: ${MODULE_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n` +
      `- llmProvider: ${llmConfig.provider}\n` +
      `- llmModel: ${llmConfig.model}`
  );

  sharedSections.push(`## Target Module Evidence Graph (${MODULE_NAME}-evidence-graph.json)\n\n\`\`\`json\n${evidenceGraphRaw}\n\`\`\``);

  // Deterministic join of api_contract requestType/responseType against
  // model_property facts -- use this directly for Section 7 (API Endpoints)
  // rather than re-deriving the join yourself. See _shared/api-schema-
  // resolver.ts and governance/roadmap/02-structural-narrative-synthesis-
  // tiers.md Stage 3.
  const resolvedApiSchemas = resolveApiSchemas(evidenceGraph.facts);
  sharedSections.push(
    `## Resolved API Request/Response Schemas (deterministic join, not narrative -- use this directly)\n\n` +
      formatResolvedApiSchemas(resolvedApiSchemas)
  );

  sharedSections.push(
    `## Cross-Module Dependency Graph (${MODULE_NAME}/cross-module-dependencies.json -- deterministic, derived from AST import ` +
      `resolution, NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed** -- report inbound and outbound relationships from this graph as Confirmed, not Inferred. ` +
      `This is the module's ONLY source of inbound coupling (who depends on it) -- its own evidence graph above only shows outbound ` +
      `imports, by construction.\n\n\`\`\`json\n${crossModuleDepsRaw}\n\`\`\``
  );

  sharedSections.push(
    `## Intra-Module Coupling Graph (${MODULE_NAME}/intra-module-coupling.json -- deterministic, derived from AST import resolution, ` +
      `NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed** -- use this directly for Section 5 (Internal Structure)'s intra-module, cross-submodule ` +
      `coupling discussion rather than reconstructing it yourself from raw imports_dependency facts.\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``
  );

  sharedSections.push(
    `## Resolved Cross-Module Call Edges (deterministic, method-level -- from the compiler's own symbol resolution, NOT LLM inference)\n\n` +
      `More specific than the Cross-Module Dependency Graph above: not just "depends on module X" but the exact class/method called. ` +
      `Use this for Section 10 (Cross-Module Relationships) and Section 12 (Architectural Observations) where the specific method ` +
      `matters (e.g. distinguishing a read call from a write/orchestration call). Report entries as **Confirmed** or per their own ` +
      `listed confidence.\n\n${formatCallEdges(callEdgesForModule)}`
  );

  // Firestore/data ownership HINT, not a label -- a class called into by
  // many other submodules/modules is LIKELY the true owner of whatever
  // data it manages, but this is a signal for Section 6, not an automated
  // verdict. See _shared/ownership-hints.ts and governance/roadmap/
  // 02-structural-narrative-synthesis-tiers.md Stage 3.
  const ownershipHints = computeOwnershipHints(evidenceGraph.facts, MODULE_NAME, resolvedGraph);
  sharedSections.push(
    `## Data Ownership Hints (deterministic SIGNAL, not a label -- for Section 6 Firestore & Data Ownership)\n\n` +
      `A class called into by multiple other submodules/modules is likely the true owner of whatever data it manages -- but this is ` +
      `a hint for your judgment, not an automated verdict. Do not present it as Confirmed ownership on its own; combine it with the ` +
      `class's own evidenced Firestore paths.\n\n${formatOwnershipHints(ownershipHints)}`
  );

  const sharedContext = sharedSections.join("\n\n---\n\n");

  const profilePrompt = [
    `You are generating a Module Engineering Profile. Follow the supporting contract documents below exactly. ` +
      `Where they conflict with anything in this instruction, the contract documents govern.`,
    sharedContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${profileRelPath}===\n` +
      `<full content of the Module Engineering Profile per the output schema>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not produce the API Reference document in this response -- it is requested separately.`,
  ].join("\n\n---\n\n");

  const apiRefPrompt = [
    `You are generating an API Reference document (a companion to a Module Engineering Profile). Follow the supporting contract documents below exactly. ` +
      `Where they conflict with anything in this instruction, the contract documents govern.`,
    sharedContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${apiRefRelPath}===\n` +
      `<full content of the API Reference per the output schema>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not produce the Module Engineering Profile document in this response -- it is requested separately.`,
  ].join("\n\n---\n\n");

  const specs: DocumentCallSpec[] = [
    { relPath: profileRelPath, prompt: profilePrompt, kind: "profile" },
    { relPath: apiRefRelPath, prompt: apiRefPrompt, kind: "api-reference" },
  ];

  return runDocumentCalls(specs, llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}'`)
    .then(written => {
      // Generate-then-verify citation check (Stage 3, adr-004.md) -- the
      // LLM still writes citations as it always has; this only checks
      // AFTER generation that cited files/lines actually exist in this
      // module's own evidence, catching fabrication without pretending to
      // replace the citation itself.
      for (const [relPath, content] of written.entries()) {
        const validation = validateCitations(content, evidenceGraph.facts);
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
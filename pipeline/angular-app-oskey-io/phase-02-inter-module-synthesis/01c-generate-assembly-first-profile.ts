// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Standard reduce/assembly step for Phase 2 module profiles -- promoted out
// of "bounded experiment" status per governance/roadmap/
// 04-complete-repo-run-and-repo-reports-plan.md Stage 1, after governance/
// roadmap/03-token-economics-remediation-plan.md Stage 3 validated the real
// before/after delta. "Cook separately, plate together" instead of "cook
// separately, then cook it all again." Reads the already-existing capability
// outputs off disk (produced by 01a-generate-capability-syntheses.ts --
// Stage A already ran once and cost real money, no reason to pay for it
// again), assembles most of the final Module Engineering Profile
// DETERMINISTICALLY from each capability's own already-correct sections, and
// issues exactly ONE LLM call for the genuinely cross-cutting content no
// single capability could write (executive summary, architectural position,
// cross-cutting observations and risks, the ownership/permission judgment
// layer). The API Reference document needs ZERO LLM calls -- per its own
// contract it's "a lookup reference, not prose," entirely coverable by
// assembling capability API-contract sections.
//
// Writes to the same canonical knowledge-corpus/<repo>/<runId>/ location
// 00-generate-module-profile.ts and 01-generate-capability-based-profile.ts
// used -- this is now THE way a module's engineering profile and API
// reference get produced, for every module regardless of size. Both of
// those older scripts are retired for new work (see their own header
// comments); kept only for historical reference/comparison.
//
// Depends on contracts/00-capability-synthesis.md's 2026-08-11 section
// restructuring (Public Interfaces split from API Contracts & Triggers;
// External Hooks added as its own section) and contracts/01-module-
// synthesis-reduce.md's corresponding rewrite -- both required for the
// section-number mapping below to be correct. Do not point this at
// capability outputs generated before that contract change; the section
// numbers won't match.

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
import { filterCallEdgesForModule, formatCallEdges, filterUnresolvedCallEdgesForModule, formatUnresolvedCallEdges } from "./_shared/call-edges";
import { filterRbacRequirementsForModule, formatRbacCatalog } from "./_shared/rbac-catalog";
import { computeOwnershipHints, formatOwnershipHints } from "./_shared/ownership-hints";
import { validateCitations, formatCitationValidation } from "./_shared/citation-validator";
import { writeProvenanceSidecar } from "./_shared/provenance-sidecar";
import { splitNumberedSections } from "./_shared/document-sections";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-01c-generate-assembly-first-profile";

interface CapabilityBasedProfileConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  capabilitySynthesisContractPaths: string[];
  moduleSynthesisContractPaths: string[];
}

// Capability-synthesis contract's section numbers (contracts/00-capability-
// synthesis.md, 2026-08-11 revision). Kept as named constants, not magic
// numbers, since a future contract edit shifting these would otherwise fail
// silently (wrong section assembled into the wrong place) rather than
// loudly.
const CAP_SECTION = {
  SUMMARY: 1,
  RESPONSIBILITIES: 2,
  PUBLIC_INTERFACES: 3,
  UI_COMPOSITION: 4,
  API_CONTRACTS_AND_ROUTES: 5,
  STATE_OWNERSHIP: 6,
  OUTBOUND_COUPLING: 7,
  PERMISSIONS: 8,
  EXTERNAL_HOOKS: 9,
  OPEN_QUESTIONS: 10,
} as const;

// Connective-tissue call's own output sections (contracts/01-module-
// synthesis-reduce.md's Output Format note).
const CONNECTIVE_SECTION = {
  METADATA: 0,
  EXECUTIVE_SUMMARY: 1,
  ARCHITECTURAL_POSITION: 2,
  STATE_OWNERSHIP_JUDGMENT: 7,
  INTERNAL_STRUCTURE: 9,
  CROSS_MODULE_RELATIONSHIPS: 10,
  PERMISSIONS_RISK: 11,
  ARCHITECTURAL_OBSERVATIONS: 13,
  RISKS: 14,
} as const;


interface ParsedCapability {
  packName: string;
  sections: Map<number, { title: string; body: string }>;
}

/** Concatenates one capability section across all capabilities, under a
 * per-capability subheading, for direct assembly into the final document.
 * Missing sections are flagged inline (visibly, not silently dropped) so a
 * contract-format regression is obvious in the output rather than causing a
 * quietly incomplete document. */
function assembleAcrossCapabilities(capabilities: ParsedCapability[], sectionNum: number): string {
  return capabilities
    .map(cap => {
      const section = cap.sections.get(sectionNum);
      const body = section?.body || "*(section not found in this capability's output -- contract format mismatch, not an absence of content)*";
      return `#### ${cap.packName}\n\n${body}`;
    })
    .join("\n\n");
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
  // COMPARISON_MODE (opt-in, per governance/roadmap/04-complete-repo-run-
  // and-repo-reports-plan.md Stage 6): read capability syntheses from, and
  // write the final assembled documents to, output/runs/<repo>/<runId>/
  // llm-comparison/<LLM_CONFIG_KEY>/<module>/ -- matching 01a's own
  // COMPARISON_MODE and 01b-rerun-reduce-only.ts's existing convention.
  // Without it, this would both read the wrong provider's capability output
  // (whatever is in the shared, non-namespaced canonical dir) and overwrite
  // the canonical knowledge-corpus/ profile for a different provider.
  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";
  const comparisonModuleDir = path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, MODULE_NAME);
  const capabilitySynthesesDir = COMPARISON_MODE ? path.join(comparisonModuleDir, "capability-syntheses") : path.join(moduleDir, "capability-syntheses");
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

  // --- Read the already-written capability-synthesis outputs off disk and parse into sections ---
  const capabilities: ParsedCapability[] = packNames.map(packName => {
    const capPath = path.join(capabilitySynthesesDir, `${packName}.md`);
    const content = readRequiredFile(
      capPath,
      `pre-existing capability-synthesis output for '${packName}' (run 01a-generate-capability-syntheses.ts first, against the current contract revision)`
    );
    return { packName, sections: splitNumberedSections(content) };
  });

  // Fail loudly, not silently, if the contract's section restructuring
  // didn't actually take effect in these capability outputs (e.g. they were
  // generated before the 2026-08-11 contract revision) -- this experiment's
  // whole premise depends on clean section boundaries existing.
  for (const cap of capabilities) {
    for (const requiredSection of [CAP_SECTION.SUMMARY, CAP_SECTION.RESPONSIBILITIES, CAP_SECTION.PUBLIC_INTERFACES, CAP_SECTION.UI_COMPOSITION, CAP_SECTION.API_CONTRACTS_AND_ROUTES]) {
      if (!cap.sections.has(requiredSection)) {
        addNotification(
          notifications,
          SOURCE_SCRIPT,
          "fatal",
          "ASSEMBLY_SECTION_MISMATCH_FATAL",
          `Capability '${cap.packName}' output is missing expected section ${requiredSection} -- was it generated against the current capability-synthesis contract?`,
          { module: MODULE_NAME, capability: cap.packName, file: `${cap.packName}-section-${requiredSection}`, missingSection: requiredSection },
          true
        );
        writeNotificationsAtomically(notificationsPath, notifications);
        throw new Error(`[ASSEMBLY_SECTION_MISMATCH_FATAL] Capability '${cap.packName}' is missing section ${requiredSection}. Regenerate it against the current contract before running this experiment.`);
      }
    }
  }

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
  const rbacRowsForModule = filterRbacRequirementsForModule(resolvedGraph, MODULE_NAME);
  const unresolvedCallEdgesForModule = filterUnresolvedCallEdgesForModule(resolvedGraph, MODULE_NAME);

  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}' (ownership hints only)`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  // --- Per-capability EXTRACTS for the connective-tissue call: only
  // Summary, State Ownership, Permissions, Open Questions -- never the full
  // capability text. This is the actual token saving; everything above this
  // point is unchanged from 01b's setup. ---
  const capabilityExtracts = capabilities
    .map(cap => {
      const summary = cap.sections.get(CAP_SECTION.SUMMARY)?.body || "(not provided)";
      const stateOwnership = cap.sections.get(CAP_SECTION.STATE_OWNERSHIP)?.body || "(not provided)";
      const permissions = cap.sections.get(CAP_SECTION.PERMISSIONS)?.body || "(not provided)";
      const openQuestions = cap.sections.get(CAP_SECTION.OPEN_QUESTIONS)?.body || "(not provided)";
      return (
        `### Capability: ${cap.packName}\n\n` +
        `**Summary:** ${summary}\n\n` +
        `**State Ownership:** ${stateOwnership}\n\n` +
        `**Permissions & Security:** ${permissions}\n\n` +
        `**Open Questions:** ${openQuestions}`
      );
    })
    .join("\n\n---\n\n");

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
      `Every entry below is **Confirmed**.\n\n\`\`\`json\n${crossModuleDepsRaw}\n\`\`\``
  );
  reduceSections.push(
    `## Intra-Module Coupling Graph (${MODULE_NAME}/intra-module-coupling.json -- deterministic, derived from AST import resolution, ` +
      `NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed**. Use this for Section 9 (Internal Structure).\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``
  );
  reduceSections.push(
    `## Resolved Cross-Module Call Edges (deterministic, method-level)\n\n` +
      `Use this for Section 10 (Cross-Module Relationships) and Section 13 (Architectural Observations).\n\n${formatCallEdges(callEdgesForModule)}`
  );
  reduceSections.push(
    `## State Ownership Hints (deterministic SIGNAL, not a label -- for Section 7's ownership conclusion)\n\n${formatOwnershipHints(ownershipHints)}`
  );
  reduceSections.push(
    `## RBAC Requirements Catalog (deterministic, filtered to this module -- for Section 11's role-gating tally; reason from this table, do not reconstruct one from the per-capability Permissions extracts)\n\n${formatRbacCatalog(rbacRowsForModule)}`
  );
  reduceSections.push(
    `## Unresolved Call Edges (deterministic, filtered to this module -- one additional real input for Section 14, not a new inference for you to perform)\n\n${formatUnresolvedCallEdges(unresolvedCallEdgesForModule)}`
  );
  reduceSections.push(moduleListSection);
  reduceSections.push(
    `## Generation Metadata (use these exact values verbatim)\n\n` +
      `- runId: ${runId}\n` +
      `- generatedAt: ${new Date().toISOString()}\n` +
      `- repoName: ${REPO_NAME}\n` +
      `- targetModule: ${MODULE_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n` +
      `- llmProvider: ${llmConfig.provider}\n` +
      `- llmModel: ${llmConfig.model}`
  );
  reduceSections.push(
    `## Per-Capability Extracts for '${MODULE_NAME}' (${capabilities.length} capabilities -- Summary, State Ownership, Permissions, and ` +
      `Open Questions only; the full capability outputs are assembled directly into the final document by the calling script and are ` +
      `not shown to you)\n\n${capabilityExtracts}`
  );

  const connectiveContext = reduceSections.join("\n\n---\n\n");
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

  const connectivePrompt = [
    `You are producing ONLY the cross-cutting sections of a Module Engineering Profile -- most of the document is assembled separately from already-correct capability-level output and is not your job. Follow the supporting contract documents below exactly, especially the "Your output ... only needs to contain Sections ..." instruction.`,
    connectiveContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file containing ONLY Sections 0, 1, 2, 7, 9, 10, 11, 13, and 14 (using the "### N. Title" heading convention for each). Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${profileRelPath}===\n` +
      `<only the sections listed above, per the reduce contract's Output Format note>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not write Sections 3, 4, 5, 6, 8, 12, or 15 -- those are assembled separately.`,
  ].join("\n\n---\n\n");

  const connectiveSpec: DocumentCallSpec = { relPath: profileRelPath, prompt: connectivePrompt, kind: "connective-tissue" };

  // Canonical location -- same as 00-generate-module-profile.ts and
  // 01-generate-capability-based-profile.ts used, now that this script is
  // the standard reduce/assembly step rather than a parallel experiment.
  // COMPARISON_MODE redirects to the same llm-comparison/<LLM_CONFIG_KEY>/
  // path used above for the read side, so a comparison run can never
  // overwrite the canonical output for the same runId.
  const outputDocsDir = COMPARISON_MODE ? comparisonModuleDir : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  // Detect-and-retry for a real, confirmed failure mode found on
  // firebase-oskey-dev 2026-08-30 (governance/roadmap/firebase-oskey-dev/
  // 06b-v1-ab-factorial-experiment-results.md): on large modules, the
  // connective-tissue call sometimes returns section HEADERS for every
  // required section (so CONNECTIVE_SECTION_MISSING below never fires) but
  // leaves the genuinely judgment-heavy free-text sections -- Permissions &
  // Security's cross-cutting callouts, Architectural Observations, Risks &
  // Open Questions' cross-cutting risks -- collapsed to a near-empty stub,
  // while graph-anchored sections stay fully populated. Ported from
  // firebase-oskey-dev's copy of this file per governance/roadmap/
  // v1-b-module-reduce-contract-scope-2026-08-30.md. MIN_JUDGMENT_SECTION_CHARS
  // is NOT independently derived for Angular -- it's inherited as a
  // documented placeholder from Firebase's real measured calibration (18
  // tasks/apps samples: smallest genuinely healthy value 636 chars, confirmed-
  // degenerate real samples 37-116 chars, wide margin on both sides). Angular's
  // reduce output trends toward shorter, more UI-focused prose per section than
  // Firebase's Firestore/RBAC-heavy prose, so this threshold has not itself
  // been validated against Angular's own output distribution -- revisit with
  // real Angular samples before trusting it the way Firebase's is trusted.
  const MIN_JUDGMENT_SECTION_CHARS = 200;
  const JUDGMENT_SECTIONS_TO_VERIFY = [CONNECTIVE_SECTION.PERMISSIONS_RISK, CONNECTIVE_SECTION.ARCHITECTURAL_OBSERVATIONS, CONNECTIVE_SECTION.RISKS];
  const MAX_CONNECTIVE_ATTEMPTS = 3;

  let connectiveRaw = "";
  let connectiveSections: Map<number, { title: string; body: string }> = new Map();
  for (let attempt = 1; attempt <= MAX_CONNECTIVE_ATTEMPTS; attempt++) {
    const written = await runDocumentCalls([connectiveSpec], llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (connective-tissue)`, LLM_CONFIG_KEY);
    connectiveRaw = written.get(profileRelPath)!;
    connectiveSections = splitNumberedSections(connectiveRaw);

    const degenerateSections = JUDGMENT_SECTIONS_TO_VERIFY.filter(n => (connectiveSections.get(n)?.body.length ?? 0) < MIN_JUDGMENT_SECTION_CHARS);
    if (degenerateSections.length === 0) break;

    const isFinalAttempt = attempt === MAX_CONNECTIVE_ATTEMPTS;
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "warning",
      isFinalAttempt ? "CONNECTIVE_CONTENT_DEGENERATE_FINAL" : "CONNECTIVE_CONTENT_DEGENERATE_RETRY",
      `Connective-tissue call for module '${MODULE_NAME}' produced suspiciously short/empty content (<${MIN_JUDGMENT_SECTION_CHARS} chars) for section(s) ${degenerateSections.join(", ")} on attempt ${attempt}/${MAX_CONNECTIVE_ATTEMPTS}` +
        (isFinalAttempt ? " -- retries exhausted, proceeding with this degenerate content." : " -- retrying."),
      { module: MODULE_NAME, file: profileRelPath, attempt, degenerateSections, charLengths: degenerateSections.map(n => connectiveSections.get(n)?.body.length ?? 0) },
      isFinalAttempt
    );
  }

  for (const requiredSection of Object.values(CONNECTIVE_SECTION)) {
    if (!connectiveSections.has(requiredSection)) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "warning",
        "CONNECTIVE_SECTION_MISSING",
        `Connective-tissue call did not produce expected section ${requiredSection} for module '${MODULE_NAME}'.`,
        { module: MODULE_NAME, file: `connective-section-${requiredSection}`, missingSection: requiredSection },
        true
      );
    }
  }

  // --- Deterministic assembly of the final Module Engineering Profile ---
  const finalProfileParts: string[] = [];
  const sec = (n: number) => connectiveSections.get(n)?.body ?? `*(section ${n} not produced by the connective-tissue call)*`;

  finalProfileParts.push(`### 0. Generation Metadata\n\n${sec(CONNECTIVE_SECTION.METADATA)}`);
  finalProfileParts.push(`### 1. Executive Summary\n\n${sec(CONNECTIVE_SECTION.EXECUTIVE_SUMMARY)}`);
  finalProfileParts.push(`### 2. Architectural Position\n\n${sec(CONNECTIVE_SECTION.ARCHITECTURAL_POSITION)}`);
  finalProfileParts.push(`### 3. Primary Responsibilities\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.RESPONSIBILITIES)}`);
  finalProfileParts.push(`### 4. Public Interfaces (Components & Services)\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.PUBLIC_INTERFACES)}`);
  finalProfileParts.push(`### 5. UI Composition\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.UI_COMPOSITION)}`);
  finalProfileParts.push(`### 6. API Contracts & Routes\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.API_CONTRACTS_AND_ROUTES)}`);
  finalProfileParts.push(
    `### 7. State Ownership\n\n**Ownership conclusion:**\n\n${sec(CONNECTIVE_SECTION.STATE_OWNERSHIP_JUDGMENT)}\n\n` +
      `**Per-capability evidence:**\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.STATE_OWNERSHIP)}`
  );
  // Section 8 (Outbound Coupling) is EXPLICITLY ASSEMBLED here, unlike Firebase's script -- Firebase marks its
  // own OUTBOUND_COUPLING constant "deliberately unused, superseded by the deterministic graphs" (06/07's output),
  // because for Firebase, import-based coupling is the ONLY coupling mechanism, and the deterministic graphs already
  // cover it more reliably than free-text capability prose. Angular is different: this capability section also
  // reports TEMPLATE-COMPOSITION coupling (a component used in another's .html template), which the deterministic
  // graphs (built only from `imports_dependency` facts) cannot see at all. Skipping this section the way Firebase
  // does would silently lose that data. Do not copy Firebase's "unused" pattern here.
  finalProfileParts.push(`### 8. Outbound Coupling\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.OUTBOUND_COUPLING)}`);
  finalProfileParts.push(`### 9. Internal Structure\n\n${sec(CONNECTIVE_SECTION.INTERNAL_STRUCTURE)}`);
  finalProfileParts.push(`### 10. Cross-Module Relationships\n\n${sec(CONNECTIVE_SECTION.CROSS_MODULE_RELATIONSHIPS)}`);
  finalProfileParts.push(
    `### 11. Permissions & Security\n\n**Cross-cutting risk callouts:**\n\n${sec(CONNECTIVE_SECTION.PERMISSIONS_RISK)}\n\n` +
      `**Per-capability evidence:**\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.PERMISSIONS)}`
  );
  finalProfileParts.push(`### 12. External Hooks\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.EXTERNAL_HOOKS)}`);
  finalProfileParts.push(`### 13. Architectural Observations\n\n${sec(CONNECTIVE_SECTION.ARCHITECTURAL_OBSERVATIONS)}`);
  finalProfileParts.push(
    `### 14. Risks & Open Questions\n\n**Cross-cutting risks:**\n\n${sec(CONNECTIVE_SECTION.RISKS)}\n\n` +
      `**Per-capability open questions:**\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.OPEN_QUESTIONS)}`
  );
  finalProfileParts.push(
    `### 15. Evidence References\n\n` +
      `Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.`
  );

  const finalProfile = finalProfileParts.join("\n\n");

  // --- Deterministic assembly of the API Reference -- zero LLM calls ---
  const apiRefBody =
    `### 0. Generation Metadata\n\n` +
    `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n` +
    `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}\n` +
    `- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.\n\n` +
    `### 1. API Contracts\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.API_CONTRACTS_AND_ROUTES)}`;

  fs.mkdirSync(path.join(outputDocsDir, path.dirname(profileRelPath)), { recursive: true });
  fs.mkdirSync(path.join(outputDocsDir, path.dirname(apiRefRelPath)), { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, profileRelPath), finalProfile, "utf8");
  fs.writeFileSync(path.join(outputDocsDir, apiRefRelPath), apiRefBody, "utf8");
  console.log(`Assembled Module Engineering Profile written to: ${path.join(outputDocsDir, profileRelPath)}`);
  console.log(`Assembled API Reference written to: ${path.join(outputDocsDir, apiRefRelPath)} (0 LLM calls)`);

  // Decision A1: a structured provenance sidecar per document, not just a
  // notification. generatedFrom deliberately records enough to answer "was
  // this built from stale inputs" without re-deriving it from prose --
  // which capabilities contributed, which deterministic artifacts fed the
  // connective call (for the profile), or that no LLM was involved at all
  // (for the API reference, which is why generatorType differs between the
  // two calls below).
  writeProvenanceSidecar(
    path.join(outputDocsDir, profileRelPath),
    finalProfile,
    evidenceGraphForHints.facts,
    {
      runId,
      repoName: REPO_NAME,
      module: MODULE_NAME,
      sourceCapabilities: capabilities.map(c => c.packName),
      deterministicArtifacts: [
        "cross-module-dependencies.json",
        "intra-module-coupling.json",
        "resolved-engineering-graph.json (call edges + ownership hints + module-filtered rbacRequirements + module-filtered unresolvedCallEdges)",
      ],
      connectiveLlmConfigKey: LLM_CONFIG_KEY,
    },
    "llm"
  );
  writeProvenanceSidecar(
    path.join(outputDocsDir, apiRefRelPath),
    apiRefBody,
    evidenceGraphForHints.facts,
    {
      runId,
      repoName: REPO_NAME,
      module: MODULE_NAME,
      sourceCapabilities: capabilities.map(c => c.packName),
      note: "Assembled entirely from capability outputs -- no LLM call for this document.",
    },
    "deterministic"
  );

  const outputLabel = COMPARISON_MODE ? `llm-comparison/${LLM_CONFIG_KEY}/${MODULE_NAME}` : `knowledge-corpus/${REPO_NAME}/${runId}`;
  for (const [relPath, content] of [[profileRelPath, finalProfile], [apiRefRelPath, apiRefBody]] as const) {
    const validation = validateCitations(content, evidenceGraphForHints.facts);
    if (validation.fileNotFound.length > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "warning",
        "CITATION_FILE_NOT_FOUND",
        `[${outputLabel}] ${relPath}: ${validation.fileNotFound.length} citation(s) reference a file not found anywhere in module '${MODULE_NAME}''s evidence -- likely fabricated.`,
        { module: MODULE_NAME, relPath, file: `${outputLabel}/${relPath}`, details: formatCitationValidation(validation) },
        true
      );
    } else if (validation.totalCitations > 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "info",
        "CITATION_VALIDATION_PASSED",
        `[${outputLabel}] ${relPath}: ${validation.totalCitations} citation(s) checked, ${validation.verified} verified, ${validation.lineUnverified.length} line-unverified, 0 file-not-found.`,
        { module: MODULE_NAME, relPath, file: `${outputLabel}/${relPath}` }
      );
    }
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "ASSEMBLY_FIRST_PROFILE_COMPLETED",
    `Module engineering profile + API reference completed for module '${MODULE_NAME}' using ${llmConfig.provider}/${llmConfig.model} -- 1 LLM call total (0 for API Reference).`,
    { module: MODULE_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, file: outputLabel }
  );
  writeNotificationsAtomically(notificationsPath, notifications);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

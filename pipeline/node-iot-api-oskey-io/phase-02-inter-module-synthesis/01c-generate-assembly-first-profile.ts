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
// Depends on this repo's own contracts/00-capability-synthesis.md and
// contracts/01-module-synthesis-reduce.md (both written 2026-08-29, see
// governance/roadmap/node-iot-api-oskey-io/01-phase2-contract-design.md) --
// this file was copied from Firebase's original and, until 2026-08-29, still
// carried FIREBASE'S section numbers unmodified (found and fixed the same
// day the repo-report stage was built; see that design doc's Decision 5
// blocker note for how this was caught). Do not assume this file's
// CAP_SECTION/CONNECTIVE_SECTION constants transfer to any other repo, or
// that Firebase's/Angular's copies of this file share these values --
// confirm against that repo's own two contracts first.
//
// node-iot's real section-number differences from Firebase's shape, all of
// which this file must respect:
// - Capability contract has 11 sections (0-10), not Firebase's 10 (0-9):
//   Route Definitions & Request Contracts (4) replaces Firebase's API
//   Contracts & Firestore Triggers; Pub/Sub Behavior (5) is a NEW section
//   with no Firebase equivalent at all; everything from Data Ownership
//   onward shifts down by one (6-10, not 5-9).
// - Module-reduce contract has 16 final sections (0-15), not Firebase's 15
//   (0-14): Route Definitions (5) and Pub/Sub Behavior (6) are both real,
//   separately-assembled sections; Outbound Coupling (8) is assembled
//   directly here (Firebase's version marks its own Outbound Coupling
//   capability-section constant "deliberately unused... superseded by the
//   deterministic graphs" -- node-iot's contract does NOT supersede it, it's
//   a real numbered final section); Permissions & Security (11) is assembled
//   with NO cross-cutting LLM judgment layer added on top (Firebase's
//   PERMISSIONS_RISK has no node-iot equivalent -- this repo has zero RBAC
//   facts anywhere, verified in Phase 1, so there's nothing for a
//   cross-cutting judgment to compare); Cross-Module Relationships (10) is
//   fully deterministic fixed text, not requested from the LLM at all
//   (this repo has exactly one module, always -- Decision 1, Phase 1
//   design doc -- so cross-module relationships are structurally impossible,
//   the same reasoning already applied to three sections of the repo-report
//   stage, Decision 5).

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
  // See 01a-generate-capability-syntheses.ts's identical field for the full
  // rationale. Load-bearing here too, not just cosmetic: 01a never writes a
  // capability-synthesis .md for an excluded pack, so if this script
  // re-derived packNames from capability-packs/ without applying the same
  // exclusion, it would fatal trying to read a synthesis file that was
  // deliberately never generated.
  excludeCapabilityPacks?: string[];
}

// Capability-synthesis contract's real section numbers (contracts/00-
// capability-synthesis.md). Kept as named constants, not magic numbers,
// since a future contract edit shifting these would otherwise fail silently
// (wrong section assembled into the wrong place) rather than loudly.
const CAP_SECTION = {
  SUMMARY: 1,
  RESPONSIBILITIES: 2,
  PUBLIC_INTERFACES: 3,
  ROUTE_DEFINITIONS: 4,
  PUBSUB_BEHAVIOR: 5,
  DATA_OWNERSHIP: 6,
  OUTBOUND_COUPLING: 7,
  PERMISSIONS: 8,
  EXTERNAL_HOOKS: 9,
  OPEN_QUESTIONS: 10,
} as const;

// Connective-tissue call's own output sections (contracts/01-module-
// synthesis-reduce.md's Output Format note: "Sections 0, 1, 2, 7 (conclusion
// only), 9, 13, and 14 (cross-cutting risks only)"). No PERMISSIONS_RISK or
// CROSS_MODULE_RELATIONSHIPS entry -- neither is requested from the LLM for
// this repo (see this file's top-of-file comment for why); Cross-Module
// Relationships is rendered as fixed deterministic text directly in the
// final assembly below instead.
const CONNECTIVE_SECTION = {
  METADATA: 0,
  EXECUTIVE_SUMMARY: 1,
  ARCHITECTURAL_POSITION: 2,
  DATA_OWNERSHIP_JUDGMENT: 7,
  INTERNAL_STRUCTURE: 9,
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

  // --- Read the already-written capability-synthesis outputs off disk and parse into sections ---
  const capabilities: ParsedCapability[] = packNames.map(packName => {
    const capPath = path.join(capabilitySynthesesDir, `${packName}.md`);
    const content = readRequiredFile(
      capPath,
      `pre-existing capability-synthesis output for '${packName}' (run 01a-generate-capability-syntheses.ts first, against the current contract revision)`
    );
    return { packName, sections: splitNumberedSections(content) };
  });

  // Fail loudly, not silently, if a capability's output doesn't actually
  // match this repo's own contracts/00-capability-synthesis.md (e.g. it was
  // generated against a stale or wrong-repo contract revision) -- this
  // script's whole premise depends on clean section boundaries existing.
  for (const cap of capabilities) {
    for (const requiredSection of [CAP_SECTION.SUMMARY, CAP_SECTION.RESPONSIBILITIES, CAP_SECTION.PUBLIC_INTERFACES, CAP_SECTION.ROUTE_DEFINITIONS, CAP_SECTION.PUBSUB_BEHAVIOR]) {
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

  // No cross-module-dependencies.json read here, unlike Firebase's copy of
  // this script -- the contract is explicit that this repo shouldn't be
  // given one at all ("this repo has exactly one module, so that graph would
  // always be empty; Section 10 is handled deterministically instead, not by
  // giving you a graph with nothing in it to describe" -- contracts/
  // 01-module-synthesis-reduce.md's "What You're Given").

  const intraModuleCouplingPath = path.join(moduleDir, "intra-module-coupling.json");
  const intraModuleCouplingRaw = readRequiredFile(intraModuleCouplingPath, `intra-module coupling graph for module '${MODULE_NAME}'`);

  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));
  // No filterCallEdgesForModule/formatCallEdges block here, unlike Firebase's
  // copy of this script -- confirmedCallEdges is guaranteed empty for this
  // repo (one module, always; verified in the real run) and Section 10 is
  // rendered as fixed deterministic text below, not asked of the LLM at all,
  // so feeding a guaranteed-always-empty cross-module edges block into every
  // prompt would be pure waste. See this file's top-of-file comment.

  const evidenceGraphPath = path.join(moduleDir, `${MODULE_NAME}-evidence-graph.json`);
  const evidenceGraphForHints = JSON.parse(readRequiredFile(evidenceGraphPath, `evidence graph for module '${MODULE_NAME}' (ownership hints only)`));
  const ownershipHints = computeOwnershipHints(evidenceGraphForHints.facts, MODULE_NAME, resolvedGraph);

  // --- Per-capability EXTRACTS for the connective-tissue call: only
  // Summary, Data Ownership, Open Questions -- never the full capability
  // text, and NO Permissions extract (unlike Firebase's setup) -- this
  // repo's contract explicitly excludes it: zero RBAC facts exist anywhere
  // in this repo (verified in Phase 1), so there's no cross-cutting
  // Permissions judgment for the LLM to make and nothing useful a
  // guaranteed-empty extract would add to every single call. ---
  const capabilityExtracts = capabilities
    .map(cap => {
      const summary = cap.sections.get(CAP_SECTION.SUMMARY)?.body || "(not provided)";
      const dataOwnership = cap.sections.get(CAP_SECTION.DATA_OWNERSHIP)?.body || "(not provided)";
      const openQuestions = cap.sections.get(CAP_SECTION.OPEN_QUESTIONS)?.body || "(not provided)";
      return (
        `### Capability: ${cap.packName}\n\n` +
        `**Summary:** ${summary}\n\n` +
        `**Data Ownership:** ${dataOwnership}\n\n` +
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
    `## Intra-Module Coupling Graph (${MODULE_NAME}/intra-module-coupling.json -- deterministic, derived from AST import resolution, ` +
      `NOT LLM inference)\n\n` +
      `Every entry below is **Confirmed**. Use this for Section 9 (Internal Structure); it may also inform Section 13 (Architectural Observations).\n\n\`\`\`json\n${intraModuleCouplingRaw}\n\`\`\``
  );
  reduceSections.push(
    `## Data Ownership Hints (deterministic SIGNAL, not a label -- for Section 7's ownership conclusion)\n\n${formatOwnershipHints(ownershipHints)}`
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
    `## Per-Capability Extracts for '${MODULE_NAME}' (${capabilities.length} capabilities -- Summary, Data Ownership, and Open Questions ` +
      `only; no Permissions extract, since this repo has zero RBAC facts anywhere (verified in Phase 1); the full capability outputs are ` +
      `assembled directly into the final document by the calling script and are not shown to you)\n\n${capabilityExtracts}`
  );

  const connectiveContext = reduceSections.join("\n\n---\n\n");
  const profileRelPath = path.join("engineering-profiles", `${MODULE_NAME}-engineering-profile.md`);
  const apiRefRelPath = path.join("apis", `${MODULE_NAME}-api-reference.md`);

  const connectivePrompt = [
    `You are producing ONLY the cross-cutting sections of a Module Engineering Profile -- most of the document is assembled separately from already-correct capability-level output and is not your job. Follow the supporting contract documents below exactly, especially the "Your output ... only needs to contain Sections ..." instruction.`,
    connectiveContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file containing ONLY Sections 0, 1, 2, 7 (conclusion only, if applicable), 9, 13, and 14 (cross-cutting risks only) (using the "### N. Title" heading convention for each). Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${profileRelPath}===\n` +
      `<only the sections listed above, per the reduce contract's Output Format note>\n` +
      `===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block. Do not write Sections 3, 4, 5, 6, 8, 10, 11, 12, or 15 -- those are assembled or rendered separately.`,
  ].join("\n\n---\n\n");

  const connectiveSpec: DocumentCallSpec = { relPath: profileRelPath, prompt: connectivePrompt, kind: "connective-tissue" };

  // Canonical location -- same as 00-generate-module-profile.ts and
  // 01-generate-capability-based-profile.ts used, now that this script is
  // the standard reduce/assembly step rather than a parallel experiment.
  // COMPARISON_MODE redirects to the same llm-comparison/<LLM_CONFIG_KEY>/
  // path used above for the read side, so a comparison run can never
  // overwrite the canonical output for the same runId.
  const outputDocsDir = COMPARISON_MODE ? comparisonModuleDir : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);
  const written = await runDocumentCalls([connectiveSpec], llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `module '${MODULE_NAME}' (connective-tissue)`, LLM_CONFIG_KEY);
  const connectiveRaw = written.get(profileRelPath)!;
  const connectiveSections = splitNumberedSections(connectiveRaw);

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
  // Section 10 (Cross-Module Relationships) is fixed text, not LLM output,
  // for this repo -- see this file's top-of-file comment: this repo has
  // exactly one module, always, so cross-module relationships are
  // structurally impossible, not sparse. Guarded, not assumed: if this
  // repo's structure ever genuinely changes, fail loudly instead of quietly
  // asserting a fixed claim that's no longer true.
  if (moduleNames.length !== 1) {
    throw new Error(
      `[Fail-Closed] '${REPO_NAME}' now has ${moduleNames.length} modules, not the single module this repo's module-reduce contract assumes. ` +
        `Section 10 (Cross-Module Relationships) below was written assuming exactly one module (see contracts/01-module-synthesis-reduce.md's header note) -- ` +
        `that assumption no longer holds and this script needs a real Cross-Module Dependency Graph input and an LLM-written Section 10 before it can be trusted again.`
    );
  }

  const finalProfileParts: string[] = [];
  const sec = (n: number) => connectiveSections.get(n)?.body ?? `*(section ${n} not produced by the connective-tissue call)*`;

  finalProfileParts.push(`### 0. Generation Metadata\n\n${sec(CONNECTIVE_SECTION.METADATA)}`);
  finalProfileParts.push(`### 1. Executive Summary\n\n${sec(CONNECTIVE_SECTION.EXECUTIVE_SUMMARY)}`);
  finalProfileParts.push(`### 2. Architectural Position\n\n${sec(CONNECTIVE_SECTION.ARCHITECTURAL_POSITION)}`);
  finalProfileParts.push(`### 3. Primary Responsibilities\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.RESPONSIBILITIES)}`);
  finalProfileParts.push(`### 4. Public Interfaces (Route Handlers & Controllers)\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.PUBLIC_INTERFACES)}`);
  finalProfileParts.push(`### 5. Route Definitions & Request Contracts\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.ROUTE_DEFINITIONS)}`);
  finalProfileParts.push(`### 6. Pub/Sub Behavior\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.PUBSUB_BEHAVIOR)}`);
  finalProfileParts.push(
    `### 7. Data Ownership\n\n**Ownership conclusion:**\n\n${sec(CONNECTIVE_SECTION.DATA_OWNERSHIP_JUDGMENT)}\n\n` +
      `**Per-capability evidence:**\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.DATA_OWNERSHIP)}`
  );
  finalProfileParts.push(`### 8. Outbound Coupling\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.OUTBOUND_COUPLING)}`);
  finalProfileParts.push(`### 9. Internal Structure\n\n${sec(CONNECTIVE_SECTION.INTERNAL_STRUCTURE)}`);
  finalProfileParts.push(
    `### 10. Cross-Module Relationships\n\n*(deterministic -- this repository consists of exactly one module, \`${MODULE_NAME}\`; no cross-module relationships exist.)*`
  );
  finalProfileParts.push(
    `### 11. Permissions & Security\n\n*(this repo has zero RBAC/authorization facts anywhere, verified in Phase 1 -- no cross-cutting judgment layer is added on top of the per-capability evidence below, since there is nothing to compare.)*\n\n` +
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
      `Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, 12, and 14) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.`
  );

  const finalProfile = finalProfileParts.join("\n\n");

  // --- Deterministic assembly of the API Reference -- zero LLM calls ---
  // Covers BOTH of this repo's real external-facing surfaces, unlike
  // Firebase's single "API Contracts" section: device-facing REST routes
  // (Route Definitions & Request Contracts) and the Pub/Sub push-route
  // operation-dispatch surface (Pub/Sub Behavior) -- omitting the latter
  // would leave this reference silent on half of what a device/backend
  // integrator actually needs to look up.
  const apiRefBody =
    `### 0. Generation Metadata\n\n` +
    `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n- targetModule: ${MODULE_NAME}\n` +
    `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}\n` +
    `- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.\n\n` +
    `### 1. Route Definitions & Request Contracts\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.ROUTE_DEFINITIONS)}\n\n` +
    `### 2. Pub/Sub Behavior\n\n${assembleAcrossCapabilities(capabilities, CAP_SECTION.PUBSUB_BEHAVIOR)}`;

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
      deterministicArtifacts: ["intra-module-coupling.json", "resolved-engineering-graph.json (ownership hints)"],
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

// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 02): Repo-Wide Engineering Report Runner.
// The third, previously-missing piece of the original pipeline vision (AST
// facts -> module profiles + APIs -> repo-wide report) -- see governance/
// roadmap/04-complete-repo-run-and-repo-reports-plan.md Stage 4 and
// governance/roadmap/phase 2-llm q&a/p2-restructure-brief-architecture.md
// Section 3.3 for the "module -> repo -> landscape" scaling shape this
// implements one level up from 01c-generate-assembly-first-profile.ts.
//
// Applies the assembly-first lesson deliberately from the start, not
// relearned the hard way as it was at module level (governance/roadmap/
// 03-token-economics-remediation-plan.md Stage 3): most of this document is
// assembled DETERMINISTICALLY from artifacts that already exist --
// - Module Inventory: facts/modules.json + each module's own
//   capability-packs directory listing.
// - Module Dependency Overview: aggregated from resolved-engineering-
//   graph.json's confirmedCallEdges (already repo-wide, no new Phase 1
//   aggregation script needed).
// - RBAC Requirements Catalog: resolved-engineering-graph.json's
//   rbacRequirements, cross-checked against rbac-roles.json for real
//   (deterministic set-membership, not an LLM eyeballing it).
// One LLM call only, for the genuinely repo-wide judgment no deterministic
// artifact or single module's profile can produce: Executive Summary, Major
// Subsystems, Cross-Cutting Patterns, Repo-Wide Risks. Fed each module's
// EXTRACTS (Executive Summary, Architectural Position, Cross-Cutting Risks
// only) -- never full module profiles -- mirroring 01c's own "extracts, not
// full text" input design at the level below.
//
// Citations at this level name modules, not fact IDs (see contracts/
// 02-repo-synthesis-reduce.md) -- the fact-based citation validator
// (_shared/citation-validator.ts) doesn't apply here and isn't run against
// this document; the provenance sidecar says so explicitly rather than
// silently running a check that would find nothing.

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
import { flattenRbacRoles, getFlattenedRbacRolesMap } from "./_shared/rbac-flatten";
import { splitNumberedSections } from "./_shared/document-sections";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "phase2-02-generate-repo-report";

// Module engineering profile's own section numbers (contracts/01-module-
// synthesis-reduce.md / 01c's assembly) -- only the three sections this
// script actually extracts.
const MODULE_SECTION = {
  EXECUTIVE_SUMMARY: 1,
  ARCHITECTURAL_POSITION: 2,
  RISKS: 13,
} as const;

// Repo-synthesis contract's own output sections (contracts/02-repo-
// synthesis-reduce.md's Output Format).
const REPO_SECTION = {
  METADATA: 0,
  EXECUTIVE_SUMMARY: 1,
  MAJOR_SUBSYSTEMS: 2,
  CROSS_CUTTING_PATTERNS: 3,
  RISKS: 4,
} as const;

interface RepoSynthesisConfig {
  contractsRoot: string;
  contractsRootBase?: "clone" | "pipelineRoot";
  architecturalGroundingPaths: string[];
  repoSynthesisContractPaths: string[];
}

interface ModuleExtract {
  module: string;
  summary: string;
  position: string;
  risks: string;
}

/** A module profile's Section 13 body is "**Cross-cutting risks:**
 * <bullets> **Per-capability open questions:** <per-capability detail>" (see
 * 01c-generate-assembly-first-profile.ts's own Section 13 assembly
 * template) -- this repo-level step only wants the cross-cutting bullets,
 * not module-internal per-capability detail. */
function extractCrossCuttingRisksOnly(section13Body: string): string {
  const marker = "**Per-capability open questions:**";
  const idx = section13Body.indexOf(marker);
  const body = idx === -1 ? section13Body : section13Body.slice(0, idx);
  return body.replace(/^\*\*Cross-cutting risks:\*\*\s*/, "").trim();
}

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;

  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
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
  if (!targetRepoCfg.phase2?.repoSynthesis) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' has no phase2.repoSynthesis configured in config/repos.json.`);
  }
  const repoSynthCfg: RepoSynthesisConfig = targetRepoCfg.phase2.repoSynthesis;

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  const modulesList: Array<{ module: string }> = JSON.parse(readRequiredFile(modulesJsonPath, "facts/modules.json"));
  const moduleNames = modulesList.map(m => m.module).sort();
  if (moduleNames.length === 0) {
    throw new Error(`[Fail-Closed] No modules found in this run's facts/modules.json.`);
  }

  const COMPARISON_MODE = process.env.COMPARISON_MODE === "true";

  // --- Module Inventory (deterministic) + per-module extracts (read off disk, not re-synthesized) ---
  const moduleInventory: Array<{ module: string; capabilityCount: number }> = [];
  const moduleExtracts: ModuleExtract[] = [];

  for (const moduleName of moduleNames) {
    const packsDir = path.join(repoOutputDir, "knowledge-pipeline", "modules", moduleName, "capability-packs");
    const capabilityCount = fs.existsSync(packsDir) ? fs.readdirSync(packsDir).filter(f => f.endsWith(".json")).length : 0;
    moduleInventory.push({ module: moduleName, capabilityCount });

    const profilePath = COMPARISON_MODE
      ? path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, moduleName, "engineering-profiles", `${moduleName}-engineering-profile.md`)
      : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId, "engineering-profiles", `${moduleName}-engineering-profile.md`);
    const content = readRequiredFile(
      profilePath,
      `module engineering profile for '${moduleName}' (run 01a-generate-capability-syntheses.ts + 01c-generate-assembly-first-profile.ts for this module first)`
    );
    const sections = splitNumberedSections(content);
    const summary = sections.get(MODULE_SECTION.EXECUTIVE_SUMMARY)?.body ?? "*(missing -- contract format mismatch)*";
    const position = sections.get(MODULE_SECTION.ARCHITECTURAL_POSITION)?.body ?? "*(missing -- contract format mismatch)*";
    const risksRaw = sections.get(MODULE_SECTION.RISKS)?.body ?? "";
    moduleExtracts.push({ module: moduleName, summary, position, risks: extractCrossCuttingRisksOnly(risksRaw) });
  }

  // --- Module Dependency Overview (deterministic, from the repo-wide resolved graph -- no new aggregation script needed) ---
  const resolvedGraphPath = path.join(repoOutputDir, "knowledge-pipeline", "resolved-engineering-graph.json");
  const resolvedGraph = JSON.parse(readRequiredFile(resolvedGraphPath, "repo-wide resolved engineering graph"));

  const edgeCounts = new Map<string, number>();
  for (const edge of resolvedGraph.confirmedCallEdges ?? []) {
    const key = `${edge.sourceModule}->${edge.targetModule}`;
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  }
  const dependencyRows = Array.from(edgeCounts.entries())
    .map(([key, count]) => {
      const [source, target] = key.split("->");
      return { source, target, count };
    })
    .sort((a, b) => b.count - a.count);

  // --- RBAC Requirements Catalog (deterministic, cross-checked against rbac-roles.json for real) ---
  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const contractsRootAbs = resolveContractsRootAbs(projectRoot, clonePath, repoSynthCfg);
  const groundingDocs = loadDocs(contractsRootAbs, repoSynthCfg.architecturalGroundingPaths, "architectural grounding doc");
  const rbacDoc = groundingDocs.find(d => d.relPath.endsWith("rbac-roles.json"));
  if (!rbacDoc) {
    throw new Error(`[Fail-Closed] rbac-roles.json not found among repoSynthesis.architecturalGroundingPaths for '${REPO_NAME}'.`);
  }
  const rbacRolesMap = getFlattenedRbacRolesMap(rbacDoc.content);
  for (const doc of groundingDocs) {
    if (doc.relPath.endsWith("rbac-roles.json")) doc.content = flattenRbacRoles(doc.content);
  }

  const rbacCatalogRows = (resolvedGraph.rbacRequirements ?? [])
    .map((req: any) => ({
      permission: req.permission,
      confidence: req.confidence,
      checkCount: req.checkCount,
      modules: Array.from(new Set((req.checks ?? []).map((c: any) => c.module))).sort(),
      existsInRolesDoc: rbacRolesMap.has(req.permission),
    }))
    .sort((a: any, b: any) => b.checkCount - a.checkCount);

  // --- Format deterministic sections ---
  const moduleInventoryMd = moduleInventory
    .map(m => `- **${m.module}** — ${m.capabilityCount} capability pack(s)`)
    .join("\n");

  const dependencyOverviewMd =
    dependencyRows.length === 0
      ? "*(no confirmed cross-module call edges)*"
      : dependencyRows.map(r => `- \`${r.source}\` → \`${r.target}\`: ${r.count} confirmed call edge(s)`).join("\n");

  const rbacCatalogMd =
    rbacCatalogRows.length === 0
      ? "*(no RBAC requirements extracted)*"
      : rbacCatalogRows
          .map((r: any) => `- \`${r.permission}\` (${r.confidence}, ${r.checkCount} check-site(s), referenced by: ${r.modules.join(", ")}) — ${r.existsInRolesDoc ? "**exists** in rbac-roles.json" : "**MISSING from rbac-roles.json**"}`)
          .join("\n");

  const moduleListSection =
    `## Current Modules in This Repository (resolved live from this run's facts/modules.json -- ` +
    `treat this as authoritative for module-name matching, do not assume any other module exists)\n\n` +
    moduleNames.map(m => `- ${m}`).join("\n");

  const moduleExtractsSection = moduleExtracts
    .map(
      e =>
        `### Module: ${e.module}\n\n` +
        `**Executive Summary:** ${e.summary}\n\n` +
        `**Architectural Position:** ${e.position}\n\n` +
        `**Cross-Cutting Risks:** ${e.risks || "*(none flagged)*"}`
    )
    .join("\n\n---\n\n");

  const repoSynthesisDocs = loadDocs(contractsRootAbs, repoSynthCfg.repoSynthesisContractPaths, "repo-synthesis contract doc");

  const reduceSections: string[] = [];
  reduceSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
  for (const doc of repoSynthesisDocs) reduceSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  reduceSections.push(`## Architectural Grounding Documents`);
  for (const doc of groundingDocs) reduceSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  reduceSections.push(moduleListSection);
  reduceSections.push(`## Module Inventory (deterministic)\n\n${moduleInventoryMd}`);
  reduceSections.push(`## Module Dependency Overview (deterministic, from confirmed cross-module call edges)\n\n${dependencyOverviewMd}`);
  reduceSections.push(`## RBAC Requirements Catalog (deterministic, cross-checked against rbac-roles.json)\n\n${rbacCatalogMd}`);
  reduceSections.push(
    `## Generation Metadata (use these exact values verbatim)\n\n` +
      `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}`
  );
  reduceSections.push(`## Per-Module Extracts (${moduleExtracts.length} modules -- Executive Summary, Architectural Position, and Cross-Cutting Risks only; full module profiles are not shown to you)\n\n${moduleExtractsSection}`);

  const reduceContext = reduceSections.join("\n\n---\n\n");
  const repoReportRelPath = `${REPO_NAME}-repo-engineering-report.md`;

  const connectivePrompt = [
    `You are producing ONLY the cross-cutting, repo-wide sections of a Repo Engineering Report -- the rest of the document is assembled separately from already-correct deterministic artifacts and per-module profiles, and is not your job. Follow the supporting contract documents below exactly, especially the Output Format section.`,
    reduceContext,
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file containing ONLY Sections 0, 1, 2, 3, and 4 (using the "### N. Title" heading convention for each). Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${repoReportRelPath}===\n<only the sections listed above, per contracts/02-repo-synthesis-reduce.md's Output Format>\n===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block.`,
  ].join("\n\n---\n\n");

  const connectiveSpec: DocumentCallSpec = { relPath: repoReportRelPath, prompt: connectivePrompt, kind: "repo-synthesis" };

  const outputDocsDir = COMPARISON_MODE
    ? path.join(repoOutputDir, "llm-comparison", LLM_CONFIG_KEY, "_repo-report")
    : path.join(projectRoot, "knowledge-corpus", REPO_NAME, runId);

  const written = await runDocumentCalls([connectiveSpec], llmConfig, outputDocsDir, notifications, SOURCE_SCRIPT, `repo-wide report for '${REPO_NAME}'`, LLM_CONFIG_KEY);
  const connectiveRaw = written.get(repoReportRelPath)!;
  const connectiveSections = splitNumberedSections(connectiveRaw);

  // Checks presence AND non-empty content -- a header with a blank body
  // (confirmed to happen on this exact call, 2026-08-29, while building the
  // Angular equivalent of this script: one real run produced a
  // "### 4. Repo-Wide Risks" header with nothing after it, likely because
  // the LLM judged the risk content already covered by Sections 1/3/6's own
  // "Impact"-style framing and had nothing left to add, rather than writing
  // "None identified") previously passed this check silently -- `.has()`
  // only confirms the header was found, not that anything followed it.
  for (const requiredSection of Object.values(REPO_SECTION)) {
    const body = connectiveSections.get(requiredSection)?.body;
    if (!body || body.trim().length === 0) {
      addNotification(
        notifications,
        SOURCE_SCRIPT,
        "warning",
        "REPO_REPORT_SECTION_MISSING",
        `Repo-synthesis call did not produce non-empty content for expected section ${requiredSection} for repo '${REPO_NAME}'.`,
        { repoName: REPO_NAME, file: `repo-report-section-${requiredSection}`, missingSection: requiredSection },
        true
      );
    }
  }

  // --- Deterministic assembly of the final Repo Engineering Report ---
  const sec = (n: number) => {
    const body = connectiveSections.get(n)?.body;
    return body && body.trim().length > 0 ? body : `*(section ${n} not produced by the repo-synthesis call)*`;
  };

  const finalReportParts: string[] = [];
  finalReportParts.push(
    `### 0. Generation Metadata\n\n` +
      `- runId: ${runId}\n- generatedAt: ${new Date().toISOString()}\n- repoName: ${REPO_NAME}\n` +
      `- llmConfigKey: ${LLM_CONFIG_KEY}\n- llmProvider: ${llmConfig.provider}\n- llmModel: ${llmConfig.model}\n` +
      `- moduleCount: ${moduleNames.length}\n` +
      `- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.`
  );
  finalReportParts.push(`### 1. Executive Summary\n\n${sec(REPO_SECTION.EXECUTIVE_SUMMARY)}`);
  finalReportParts.push(`### 2. Module Inventory\n\n${moduleInventoryMd}`);
  finalReportParts.push(`### 3. Major Subsystems\n\n${sec(REPO_SECTION.MAJOR_SUBSYSTEMS)}`);
  finalReportParts.push(`### 4. Module Dependency Overview\n\n${dependencyOverviewMd}`);
  finalReportParts.push(`### 5. RBAC Requirements Catalog\n\n${rbacCatalogMd}`);
  finalReportParts.push(`### 6. Cross-Cutting Patterns\n\n${sec(REPO_SECTION.CROSS_CUTTING_PATTERNS)}`);
  finalReportParts.push(`### 7. Repo-Wide Risks\n\n${sec(REPO_SECTION.RISKS)}`);

  const finalReport = finalReportParts.join("\n\n");
  fs.mkdirSync(outputDocsDir, { recursive: true });
  fs.writeFileSync(path.join(outputDocsDir, repoReportRelPath), finalReport, "utf8");
  console.log(`Repo Engineering Report written to: ${path.join(outputDocsDir, repoReportRelPath)}`);

  // Custom provenance sidecar, not the shared writeProvenanceSidecar helper
  // -- that helper's citation validation is fact-ID/file-line based
  // (_shared/citation-validator.ts), and citations at THIS level name
  // modules, not facts (see contracts/02-repo-synthesis-reduce.md's "Citing
  // evidence at this level"). Running the fact-based validator here would
  // either find nothing (harmless but misleading -- implies a check ran and
  // passed) or, worse, misinterpret an unrelated backtick-quoted string as a
  // fact-ID/file-line pattern. Saying explicitly that this check doesn't
  // apply is more honest than silently no-op'ing it.
  const provenance = {
    schemaVersion: "1.0.0",
    documentPath: path.join(outputDocsDir, repoReportRelPath),
    generatedAt: new Date().toISOString(),
    generatorType: "llm+deterministic",
    generatedFrom: {
      runId,
      repoName: REPO_NAME,
      sourceModules: moduleNames,
      deterministicArtifacts: [
        "facts/modules.json",
        "per-module capability-packs directory counts",
        "resolved-engineering-graph.json (confirmedCallEdges, rbacRequirements)",
        "rbac-roles.json (existence cross-check)",
      ],
      connectiveLlmConfigKey: LLM_CONFIG_KEY,
      note:
        "Sections 1, 3, 6, and 7 (Executive Summary, Major Subsystems, Cross-Cutting Patterns, Repo-Wide Risks) are LLM-generated from per-module extracts. Sections 2, 4, and 5 (Module Inventory, Module Dependency Overview, RBAC Requirements Catalog) are fully deterministic. Citations in the LLM-generated sections name modules, not fact IDs -- the fact-based citation validator (_shared/citation-validator.ts) does not apply at this level and was NOT run against this document.",
    },
  };
  fs.writeFileSync(`${path.join(outputDocsDir, repoReportRelPath)}.provenance.json`, JSON.stringify(provenance, null, 2), "utf8");

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "REPO_REPORT_COMPLETED",
    `Repo-wide engineering report completed for '${REPO_NAME}' using ${llmConfig.provider}/${llmConfig.model} -- 1 LLM call total, covering ${moduleNames.length} modules.`,
    { repoName: REPO_NAME, provider: llmConfig.provider, model: llmConfig.model, llmConfigKey: LLM_CONFIG_KEY, moduleCount: moduleNames.length, file: COMPARISON_MODE ? `llm-comparison/${LLM_CONFIG_KEY}/_repo-report` : `knowledge-corpus/${REPO_NAME}/${runId}` }
  );
  writeNotificationsAtomically(notificationsPath, notifications);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

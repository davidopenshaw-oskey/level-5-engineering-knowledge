// **version:** 1.0.0
// **location:** level-5 phase 1.75 -- Kotlin/Android port
// © Oskey SAS. All rights reserved.
//
// Script 04: Repository Resolved Engineering Graph Builder (Phase 1.75) --
// Kotlin/Android port. Real, deliberate re-design vs. the TS pipelines' own
// copy of this script, not a blind port -- see governance/roadmap/android-
// intercom-oskey-io/02-p1-build-tasklist.md Task 8's own note for why:
//
// - Call resolution itself already happened at EXTRACTION time (Task 4,
//   01-extract-ast-evidence.ts's own import-aware resolver), not here --
//   there is no "Rule A: exact compiler declaration match" step to run at
//   this stage the way TS's own script does, because there is no whole-
//   project compiler symbol table available to a syntax-only tool (real,
//   honest capability gap, see 07-call-graph-resolution-gap-major-finding-
//   2026-09-08.md). This script's real job is narrower: classify each
//   already-resolved-or-not call's real graph ELIGIBILITY, then aggregate
//   into cross-module/same-module edges.
// - No Mongo/routes/Joi/PubSub/RBAC sections at all -- none of that exists
//   for this repo, so they are simply omitted rather than kept as
//   permanently-empty template sections.
//
// Real, concrete finding this script is built to fix (recorded in Task 8's
// own note before this script existed): Task 4's real run found 5,338 raw
// call expressions, only 649 (12%) resolving to an in-repo declaration.
// Confirmed directly (not guessed) that the unresolved 88% is dominated by
// real framework/stdlib/Compose call roots that were never going to resolve
// in-repo -- see the real frequency count this file's own NOISY_CALL_ROOTS
// list is grounded in, below.

import fs from "fs";
import path from "path";
import {
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  assertNoLocalAbsolutePaths,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "04-build-resolved-graph";

function writeMarkdownAtomically(filePath: string, content: string) {
  assertNoLocalAbsolutePaths(content, "resolved-graph-matrix.md");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.readFileSync(tmpPath, "utf8");
  fs.renameSync(tmpPath, filePath);
}

// Real, measured 2026-09-09 against this repo's own real ast-calls.json
// (the same file Task 4 built) -- the top ~20 real unresolved call roots by
// frequency, all confirmed real framework/Compose/Kotlin-stdlib APIs with
// zero chance of an in-repo declaration (Timber: 665 real occurrences alone).
// Deliberately NOT a general "lowercase root = external" heuristic: a
// lowercase root like `repository.getAccesses()` could be a genuine in-repo
// architectural call this syntax-only tool simply can't type-resolve (no
// compiler) -- sweeping those into "non_graph_call" would silently hide a
// real gap instead of honestly reporting it as unresolved-but-eligible. This
// list only removes roots independently confirmed to be external; anything
// not on it stays in the honest unresolved bucket, however large.
const NOISY_CALL_ROOTS = new Set([
  "Timber",
  "Modifier",
  "Row",
  "Box",
  "Text",
  "Column",
  "Spacer",
  "LaunchedEffect",
  "remember",
  "viewModelScope",
  "UUID",
  "Gson",
  "MediaConstraints",
  "Color",
  "withContext",
  "delay",
  "run",
  "mapOf",
  "listOf",
  "byteArrayOf",
  "composable",
  "intent",
  "navController",
]);

// Real bug found building this script 2026-09-09: a naive `expr.split(".")
// [0]` on a real Compose modifier chain like `Modifier\n    .fillMaxSize()`
// returns "Modifier\n    " (leading/trailing whitespace from the multi-line
// chain), which would never match NOISY_CALL_ROOTS's plain "Modifier" entry
// -- confirmed by running the real frequency count below and seeing
// "Modifier" appear as 4 separate near-duplicate entries differing only in
// trailing whitespace before this fix. A trailing `?` (Kotlin safe-call
// root, e.g. `socketIO?.emit`) is also stripped so a root can be matched
// consistently regardless of null-safety syntax at the call site.
function extractCallRoot(expr: string): string {
  if (!expr) return "";
  return expr.split(".")[0].trim().replace(/\?$/, "");
}

function main() {
  const REPO_NAME = process.env.REPO_NAME;
  if (!REPO_NAME) {
    throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  }

  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Please run \`00-scan-repo\` first.`);
  }

  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const rawDir = path.join(repoOutputDir, "facts");
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();
  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");

  const allCalls: any[] = [];

  // 1. Validate every module manifest/evidence graph, collect call_expression facts
  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modGraphPath)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Missing evidence graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Missing output for module '${moduleName}'.`);
    }

    let modGraph: any;
    try {
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Malformed JSON in graph for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Malformed graph JSON for module '${moduleName}'.`);
    }

    if (
      modGraph.runId !== runId ||
      modGraph.repoName !== REPO_NAME ||
      modGraph.module !== moduleName ||
      !Array.isArray(modGraph.facts) ||
      !modGraph.summary ||
      modGraph.summary.totalFacts !== modGraph.facts.length
    ) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Graph structure or identity validation failed for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Graph validation failed for module '${moduleName}'.`);
    }

    for (const fact of modGraph.facts) {
      if (fact.type === "call_expression") allCalls.push(fact);
    }
  }

  // 2. Eligibility classification + edge aggregation
  const crossModuleCallEdges: any[] = [];
  const sameModuleResolvedCalls: any[] = [];
  const unresolvedEligibleCalls: any[] = [];

  let nonGraphCallExpressions = 0;

  for (const call of allCalls) {
    const root = extractCallRoot(call.calleeExpression || "");
    if (NOISY_CALL_ROOTS.has(root)) {
      nonGraphCallExpressions += 1;
      continue;
    }

    if (call.resolutionMethod === "unresolved" || !call.declarationModule) {
      unresolvedEligibleCalls.push({
        id: `unresolved_call|${call.id}`,
        sourceCallFactId: call.id,
        module: call.module,
        submodule: call.submodule,
        file: call.file,
        line: call.line,
        callerClass: call.callerClass,
        evidenceCallText: call.calleeExpression,
      });
      continue;
    }

    if (call.declarationModule !== call.module) {
      crossModuleCallEdges.push({
        id: `call_edge|${call.id}`,
        sourceCallFactId: call.id,
        sourceModule: call.module,
        sourceFile: call.file,
        sourceLine: call.line,
        sourceContext: call.callerClass || call.callerName || "anonymous",
        targetModule: call.declarationModule,
        targetFile: call.declarationFile,
        evidenceCallText: call.calleeExpression,
        resolutionMethod: call.resolutionMethod,
        // Real, honest confidence tag -- never "confirmed" (compiler-exact),
        // matching this repo's own established vocabulary. resolved_via_
        // import is a stronger signal than resolved_via_same_package (an
        // explicit import statement disambiguates in a way same-package
        // visibility alone does not), but both are heuristic, not
        // compiler-exact.
        confidence: call.resolutionMethod === "resolved_via_import" ? "probable" : "weak",
      });
    } else {
      sameModuleResolvedCalls.push({
        id: `same_module_call|${call.id}`,
        sourceCallFactId: call.id,
        module: call.module,
        submodule: call.submodule,
        file: call.file,
        line: call.line,
        targetFile: call.declarationFile,
        evidenceCallText: call.calleeExpression,
        resolutionMethod: call.resolutionMethod,
      });
    }
  }

  crossModuleCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  sameModuleResolvedCalls.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedEligibleCalls.sort((a, b) => a.id.localeCompare(b.id));

  const quality = {
    inputCallExpressions: allCalls.length,
    nonGraphCallExpressions,
    graphEligibleCallExpressions: allCalls.length - nonGraphCallExpressions,
    crossModuleCallEdges: crossModuleCallEdges.length,
    sameModuleResolvedCalls: sameModuleResolvedCalls.length,
    unresolvedEligibleCalls: unresolvedEligibleCalls.length,
  };

  if (unresolvedEligibleCalls.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "UNRESOLVED_ELIGIBLE_CALLS",
      `${unresolvedEligibleCalls.length} graph-eligible call expression(s) (not a known external framework/stdlib root) could not be resolved to an in-repo declaration -- a real, honest gap of this repo's syntax-only (no compiler) resolution strategy, not a bug in this script.`,
      { count: unresolvedEligibleCalls.length }
    );
  }

  const preliminaryAttention = notifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );
  const status = notifications.highestSeverity === "error" || notifications.highestSeverity === "fatal" ? "failed" : preliminaryAttention ? "completed_with_warnings" : "complete";

  addNotification(notifications, SOURCE_SCRIPT, "info", "GRAPH_RESOLUTION_COMPLETED", `Repository-wide resolved graph completed with status '${status}'.`);
  writeNotificationsAtomically(notificationsPath, notifications);

  const graphPayload = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    status,
    generatedAt: new Date().toISOString(),
    quality,
    crossModuleCallEdges,
    sameModuleResolvedCalls,
    unresolvedEligibleCalls,
  };

  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");
  fs.mkdirSync(kpDir, { recursive: true });
  const graphJsonPath = path.join(kpDir, "resolved-engineering-graph.json");
  writeJsonAtomically(graphJsonPath, graphPayload, "knowledge-pipeline/resolved-engineering-graph.json");

  // Markdown summary
  let md = `# Resolved Engineering Graph Matrix\n\n`;
  md += `**Run ID**: \`${runId}\`  \n`;
  md += `**Repo**: \`${REPO_NAME}\`  \n`;
  md += `**Status**: \`${status}\`  \n`;
  md += `**Generated At**: \`${graphPayload.generatedAt}\`  \n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Input Call Expressions**: ${quality.inputCallExpressions}\n`;
  md += `- **Excluded (known external framework/stdlib root)**: ${quality.nonGraphCallExpressions}\n`;
  md += `- **Graph-Eligible Call Expressions**: ${quality.graphEligibleCallExpressions}\n`;
  md += `- **Cross-Module Call Edges**: ${quality.crossModuleCallEdges}\n`;
  md += `- **Same-Module Resolved Calls**: ${quality.sameModuleResolvedCalls}\n`;
  md += `- **Unresolved, Eligible Calls (real, honest gap)**: ${quality.unresolvedEligibleCalls}\n\n`;

  md += `> **Note**: This repo has no compiler-backed ("confirmed") call resolution -- every edge below is tagged \`probable\` (resolved via an explicit import) or \`weak\` (resolved via same-package visibility, no import needed). See governance/roadmap/android-intercom-oskey-io/07-call-graph-resolution-gap-major-finding-2026-09-08.md.\n\n`;

  md += `## Cross-Module Call Edges\n\n`;
  if (crossModuleCallEdges.length === 0) {
    md += `*No cross-module call edges detected.*\n\n`;
  } else {
    md += `| Source Module | Source Context | Target Module | Evidence | Confidence |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const edge of crossModuleCallEdges) {
      md += `| \`${edge.sourceModule}\` | \`${edge.sourceContext}\` | \`${edge.targetModule}\` | \`${edge.evidenceCallText}\` | \`${edge.confidence}\` |\n`;
    }
    md += `\n`;
  }

  const matrixMdPath = path.join(kpDir, "resolved-graph-matrix.md");
  writeMarkdownAtomically(matrixMdPath, md);

  console.log("Resolved engineering graph generated successfully.");
  console.log(quality);
  console.log(`Wrote ${graphJsonPath}`);
  console.log(`Wrote ${matrixMdPath}`);
}

main();

// **version:** 1.0.0
// **location:** level-5 phase 1 -- Swift
// © Oskey SAS. All rights reserved.
//
// Script 03: Knowledge Pipeline Benchmark Generator (Phase 1) -- Swift.
// Validates every module's own evidence-graph/manifest identity and record
// counts against the repo-wide AST manifest, then builds a single-source-
// of-truth repo-wide totals report. SHARED ACROSS EVERY SWIFT REPO, same as
// 00/01/02 -- see 01-extract-ast-evidence.ts's own header for the full
// restructuring reasoning. Real, deliberate omission, same as Kotlin's own
// copy: no `recommendationMethod` POC-complexity-scoring section -- no
// classification scheme exists for this family yet to weight.

import fs from "fs";
import path from "path";
import {
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "03-build-benchmark";

// Matches 02-build-module-evidence.ts's own summaryCounts fields exactly.
const REQUIRED_SUMMARY_FIELDS = [
  "files",
  "imports",
  "classes",
  "structs",
  "enums",
  "protocols",
  "extensions",
  "functions",
  "properties",
  "calls",
  "bleGattConstants",
  "facts",
];

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

  const astManifestPath = path.join(rawDir, "ast-manifest.json");
  if (!fs.existsSync(astManifestPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_AST_MANIFEST_FATAL", `Missing required ast-manifest.json at '${astManifestPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required ast-manifest.json at '${astManifestPath}'.`);
  }

  let astManifest: any;
  try {
    astManifest = JSON.parse(fs.readFileSync(astManifestPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Malformed ast-manifest.json: ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed ast-manifest.json: ${err.message}`);
  }

  // Real, deliberate difference from Kotlin's own copy, same reasoning as
  // 02's own note: Swift's manifest has no top-level `errors: {file,
  // recordCount}` summary object -- errors is just another (optional)
  // artefacts entry. Extracted from there instead of assumed to exist as a
  // separate top-level field.
  if (
    astManifest.runId !== runId ||
    astManifest.repoName !== REPO_NAME ||
    typeof astManifest.schemaVersion !== "string" ||
    !Array.isArray(astManifest.artefacts)
  ) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "AST_MANIFEST_IDENTITY_MISMATCH", `AST manifest identity or structure validation failed.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST manifest identity or structure validation failed.`);
  }
  const errorsArtefact = astManifest.artefacts.find((a: any) => a.evidenceType === "errors");
  const astExtractionErrors: number = errorsArtefact?.recordCount ?? 0;

  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  if (!fs.existsSync(modulesBaseDir)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_ROOT_FATAL", `Modules directory missing at '${modulesBaseDir}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[MISSING_MODULES_ROOT_FATAL] Modules directory missing at '${modulesBaseDir}'.`);
  }

  const totals: Record<string, number> = { modules: 0, facts: 0 };
  for (const key of REQUIRED_SUMMARY_FIELDS) if (!(key in totals)) totals[key] = 0;

  const moduleEntries: any[] = [];

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modManifestPath = path.join(modDir, `${moduleName}-manifest.json`);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modManifestPath) || !fs.existsSync(modGraphPath)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULE_OUTPUT_FATAL", `Missing manifest or graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MISSING_MODULE_OUTPUT_FATAL] Missing output for module '${moduleName}'.`);
    }

    let modManifest: any;
    let modGraph: any;
    try {
      modManifest = JSON.parse(fs.readFileSync(modManifestPath, "utf8"));
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_MODULE_OUTPUT_FATAL", `Malformed manifest or graph JSON for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MALFORMED_MODULE_OUTPUT_FATAL] Malformed output for module '${moduleName}'.`);
    }

    if (
      modManifest.runId !== runId ||
      modManifest.repoName !== REPO_NAME ||
      modManifest.module !== moduleName ||
      modGraph.runId !== runId ||
      modGraph.repoName !== REPO_NAME ||
      modGraph.module !== moduleName ||
      !Array.isArray(modGraph.facts)
    ) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MODULE_IDENTITY_MISMATCH_FATAL", `Identity mismatch in output for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MODULE_IDENTITY_MISMATCH_FATAL] Identity mismatch for module '${moduleName}'.`);
    }

    if (modGraph.summary.totalFacts !== modGraph.facts.length || modManifest.summary.facts !== modGraph.summary.totalFacts) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MODULE_FACT_COUNT_MISMATCH_FATAL", `Fact count mismatch for module '${moduleName}': graph claims ${modGraph.summary.totalFacts}, facts array length is ${modGraph.facts.length}.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MODULE_FACT_COUNT_MISMATCH_FATAL] Fact count mismatch for module '${moduleName}'.`);
    }

    const summary = modManifest.summary || {};
    for (const key of REQUIRED_SUMMARY_FIELDS) {
      const val = summary[key];
      if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
        addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_MODULE_SUMMARY_FATAL", `Invalid or missing summary field '${key}' in module '${moduleName}'.`, { module: moduleName, field: key, value: val });
        writeNotificationsAtomically(notificationsPath, notifications);
        throw new Error(`[MALFORMED_MODULE_SUMMARY_FATAL] Invalid summary field '${key}' in module '${moduleName}'.`);
      }
    }

    totals.modules += 1;
    totals.facts += modGraph.summary.totalFacts;
    for (const key of Object.keys(summary)) {
      if (key !== "facts" && key in totals) totals[key] += summary[key];
    }

    moduleEntries.push({
      module: moduleName,
      manifest: `${moduleName}-manifest.json`,
      graph: `${moduleName}-evidence-graph.json`,
      summary: modManifest.summary,
    });
  }

  const hasAttentionCondition = notifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    hasAttentionCondition ? "BENCHMARK_COMPLETED_WITH_WARNINGS" : "BENCHMARK_COMPLETED_SUCCESSFULLY",
    hasAttentionCondition
      ? `Benchmark completed with pipeline notifications (highest severity: ${notifications.highestSeverity}).`
      : "Benchmark generated successfully with zero pipeline warnings."
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  const finalNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);
  const humanAttentionRecommended = finalNotifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );

  let benchmarkStatus: "complete" | "completed_with_warnings" | "failed" = "complete";
  if (finalNotifications.highestSeverity === "error" || finalNotifications.highestSeverity === "fatal") {
    benchmarkStatus = "failed";
  } else if (finalNotifications.highestSeverity === "warning" || humanAttentionRecommended) {
    benchmarkStatus = "completed_with_warnings";
  }

  const benchmarkPayload = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    status: benchmarkStatus,
    generatedAt: new Date().toISOString(),
    quality: {
      notificationHighestSeverity: finalNotifications.highestSeverity,
      notificationCount: finalNotifications.entries.length,
      humanAttentionRecommended,
      astExtractionErrors,
      modulesExpected: authoritativeModules.length,
      modulesBenchmarked: totals.modules,
    },
    totals,
    modules: moduleEntries,
  };

  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");
  fs.mkdirSync(kpDir, { recursive: true });
  const benchmarkPath = path.join(kpDir, "benchmark.json");
  writeJsonAtomically(benchmarkPath, benchmarkPayload, "knowledge-pipeline/benchmark.json");

  console.log("Knowledge pipeline benchmark built");
  console.log(totals);
  console.log(`Wrote ${benchmarkPath}`);
}

main();

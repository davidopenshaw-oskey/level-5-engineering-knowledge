// **version:** 3.0.0
// **location:** level-5 phase 1

// © Oskey SAS. All rights reserved.
// Script 03: Knowledge Pipeline Benchmark Generator (Phase 1).
// Validates module evidence graph identities, calculates single-source-of-truth
// repository totals, and builds the benchmark report with final notification state.

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

type NotificationSeverity = "info" | "warning" | "error" | "fatal";

interface NotificationEntry {
  id: string;
  sourceScript: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  humanAttentionRecommended: boolean;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

function buildNotificationId(sourceScript: string, code: string, details?: Record<string, unknown>): string {
  const parts = [
    sourceScript,
    code,
    details?.module ? String(details.module) : "",
    details?.file ? String(details.file) : "",
    details?.missingArtifact ? String(details.missingArtifact) : "",
    details?.key ? String(details.key) : "",
  ].filter(Boolean);
  return parts.join("::").toLowerCase();
}

function addNotification(
  notifications: RunNotifications,
  sourceScript: string,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  humanAttentionRecommended = false
) {
  const id = buildNotificationId(sourceScript, code, details);
  const now = new Date().toISOString();

  const existingIdx = notifications.entries.findIndex(e => e.id === id);
  if (existingIdx >= 0) {
    const existing = notifications.entries[existingIdx];
    notifications.entries[existingIdx] = {
      ...existing,
      severity,
      message,
      details,
      updatedAt: now,
      humanAttentionRecommended: existing.humanAttentionRecommended || humanAttentionRecommended,
    };
  } else {
    notifications.entries.push({
      id,
      sourceScript,
      severity,
      code,
      message,
      details,
      createdAt: now,
      updatedAt: now,
      humanAttentionRecommended,
    });
  }

  notifications.updatedAt = now;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
    fatal: 4,
  };

  let maxSev: NotificationSeverity = "info";
  for (const entry of notifications.entries) {
    if (severityOrder[entry.severity] > severityOrder[maxSev]) {
      maxSev = entry.severity;
    }
  }
  notifications.highestSeverity = maxSev;
}

function assertNoLocalAbsolutePaths(data: unknown, contextDescription: string): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string") {
    if (
      data.includes("/Users/") ||
      data.includes("/home/") ||
      /^[a-zA-Z]:\\/.test(data) ||
      data.startsWith("file://") ||
      data.includes("output/clones")
    ) {
      throw new Error(`[Local Path Contamination] Found local absolute path '${data}' in context '${contextDescription}'.`);
    }
    return;
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      assertNoLocalAbsolutePaths(data[i], `${contextDescription}[${i}]`);
    }
    return;
  }
  if (typeof data === "object") {
    for (const key of Object.keys(data as object)) {
      assertNoLocalAbsolutePaths((data as any)[key], `${contextDescription}.${key}`);
    }
  }
}

function writeJsonAtomically(filePath: string, data: unknown, contextDescription: string) {
  assertNoLocalAbsolutePaths(data, contextDescription);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function writeNotificationsAtomically(filePath: string, notifications: RunNotifications) {
  assertNoLocalAbsolutePaths(notifications, "run-notifications.json");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(notifications, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function loadNotifications(notificationsPath: string, expectedRunId: string, expectedRepoName: string): RunNotifications {
  if (!fs.existsSync(notificationsPath)) {
    throw new Error(`[Fail-Closed] Missing required run-notifications.json at '${notificationsPath}'.`);
  }

  let notifs: RunNotifications;
  try {
    notifs = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Malformed run-notifications.json at '${notificationsPath}': ${err.message}`);
  }

  if (notifs.runId !== expectedRunId || notifs.repoName !== expectedRepoName) {
    throw new Error(`[Fail-Closed] run-notifications.json identity mismatch: expected runId '${expectedRunId}', got '${notifs.runId}'.`);
  }

  return notifs;
}

const REQUIRED_SUMMARY_FIELDS = [
  "files",
  "imports",
  "exports",
  "classes",
  "methods",
  "functions",
  "typeAliases",
  "enums",
  "modelProperties",
  "calls",
  "firestoreHints",
  "permissionHints",
  "externalHooks",
  "firestoreTriggers",
  "apiContracts",
  "services",
  "controllers",
  "facts",
];

function main() {
  const runContextPath = path.join(projectRoot, "output", "run-context.json");
  if (!fs.existsSync(runContextPath)) {
    throw new Error("[Fail-Closed] Could not find output/run-context.json. Please run `00-scan-repo` first.");
  }

  const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
  const runId: string = runContext.runId;
  const REPO_NAME: string = runContext.repoName;
  if (!REPO_NAME || !runId) {
    throw new Error("[Fail-Closed] Missing repoName or runId in output/run-context.json");
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const rawDir = path.join(repoOutputDir, "facts");

  // 10. Validate AST Manifest Identity & Errors Structure
  const astManifestPath = path.join(rawDir, "ast-evidence-manifest.json");
  if (!fs.existsSync(astManifestPath)) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MISSING_AST_MANIFEST_FATAL", `Missing required ast-evidence-manifest.json at '${astManifestPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required ast-evidence-manifest.json at '${astManifestPath}'.`);
  }

  let astManifest: any;
  try {
    astManifest = JSON.parse(fs.readFileSync(astManifestPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Malformed ast-evidence-manifest.json: ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed ast-evidence-manifest.json: ${err.message}`);
  }

  if (
    astManifest.runId !== runId ||
    astManifest.repoName !== REPO_NAME ||
    typeof astManifest.schemaVersion !== "string" ||
    !Array.isArray(astManifest.artefacts) ||
    typeof astManifest.errors !== "object" ||
    typeof astManifest.errors?.file !== "string" ||
    !Number.isFinite(astManifest.errors?.recordCount)
  ) {
    addNotification(notifications, "03-build-benchmark", "fatal", "AST_MANIFEST_IDENTITY_MISMATCH", `AST manifest identity or structure validation failed.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST manifest identity or structure validation failed.`);
  }

  // Load Authoritative Module Inventory
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  if (!fs.existsSync(modulesBaseDir)) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MISSING_MODULES_ROOT_FATAL", `Modules directory missing at '${modulesBaseDir}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[MISSING_MODULES_ROOT_FATAL] Modules directory missing at '${modulesBaseDir}'.`);
  }

  const totals: Record<string, number> = {
    modules: 0,
    facts: 0,
    files: 0,
    imports: 0,
    exports: 0,
    classes: 0,
    methods: 0,
    functions: 0,
    typeAliases: 0,
    enums: 0,
    modelProperties: 0,
    calls: 0,
    firestoreHints: 0,
    permissionHints: 0,
    externalHooks: 0,
    firestoreTriggers: 0,
    apiContracts: 0,
    services: 0,
    controllers: 0,
  };

  const moduleEntries: any[] = [];

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modManifestPath = path.join(modDir, `${moduleName}-manifest.json`);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modManifestPath) || !fs.existsSync(modGraphPath)) {
      addNotification(notifications, "03-build-benchmark", "fatal", "MISSING_MODULE_OUTPUT_FATAL", `Missing manifest or graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MISSING_MODULE_OUTPUT_FATAL] Missing output for module '${moduleName}'.`);
    }

    let modManifest: any;
    let modGraph: any;
    try {
      modManifest = JSON.parse(fs.readFileSync(modManifestPath, "utf8"));
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, "03-build-benchmark", "fatal", "MALFORMED_MODULE_OUTPUT_FATAL", `Malformed manifest or graph JSON for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MALFORMED_MODULE_OUTPUT_FATAL] Malformed output for module '${moduleName}'.`);
    }

    // Validate module identities & counts
    if (
      modManifest.runId !== runId ||
      modManifest.repoName !== REPO_NAME ||
      modManifest.module !== moduleName ||
      modGraph.runId !== runId ||
      modGraph.repoName !== REPO_NAME ||
      modGraph.module !== moduleName ||
      !Array.isArray(modGraph.facts)
    ) {
      addNotification(notifications, "03-build-benchmark", "fatal", "MODULE_IDENTITY_MISMATCH_FATAL", `Identity mismatch in output for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MODULE_IDENTITY_MISMATCH_FATAL] Identity mismatch for module '${moduleName}'.`);
    }

    if (modGraph.summary.totalFacts !== modGraph.facts.length || modManifest.summary.facts !== modGraph.summary.totalFacts) {
      addNotification(notifications, "03-build-benchmark", "fatal", "MODULE_FACT_COUNT_MISMATCH_FATAL", `Fact count mismatch for module '${moduleName}': graph claims ${modGraph.summary.totalFacts}, facts array length is ${modGraph.facts.length}.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MODULE_FACT_COUNT_MISMATCH_FATAL] Fact count mismatch for module '${moduleName}'.`);
    }

    // 11. Validate Module Summary Numbers Strictly
    const summary = modManifest.summary || {};
    for (const key of REQUIRED_SUMMARY_FIELDS) {
      const val = summary[key];
      if (typeof val !== "number" || !Number.isFinite(val) || val < 0) {
        addNotification(notifications, "03-build-benchmark", "fatal", "MALFORMED_MODULE_SUMMARY_FATAL", `Invalid or missing summary field '${key}' in module '${moduleName}'.`, { module: moduleName, field: key, value: val });
        writeNotificationsAtomically(notificationsPath, notifications);
        throw new Error(`[MALFORMED_MODULE_SUMMARY_FATAL] Invalid summary field '${key}' in module '${moduleName}'.`);
      }
    }

    totals.modules += 1;
    // 14. Single Source of Truth Fact Accounting
    totals.facts += modGraph.summary.totalFacts;

    // Accumulate other summary keys (skipping 'facts' to prevent double counting)
    for (const key of Object.keys(summary)) {
      if (key !== "facts" && key in totals) {
        totals[key] += summary[key];
      }
    }

    moduleEntries.push({
      module: moduleName,
      manifest: `${moduleName}-manifest.json`,
      graph: `${moduleName}-evidence-graph.json`,
      summary: modManifest.summary,
    });
  }

  // 12. Determine Attention & Completion Notification
  const hasAttentionCondition = notifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );

  if (hasAttentionCondition) {
    addNotification(
      notifications,
      "03-build-benchmark",
      "info",
      "BENCHMARK_COMPLETED_WITH_WARNINGS",
      `Benchmark completed with pipeline notifications (highest severity: ${notifications.highestSeverity}).`
    );
  } else {
    addNotification(
      notifications,
      "03-build-benchmark",
      "info",
      "BENCHMARK_COMPLETED_SUCCESSFULLY",
      "Benchmark generated successfully with zero pipeline warnings."
    );
  }

  writeNotificationsAtomically(notificationsPath, notifications);

  // Re-read final notifications state for quality block
  const finalNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const humanAttentionRecommended = finalNotifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );

  // 15. Benchmark Status
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
      astExtractionErrors: astManifest.errors.recordCount,
      modulesExpected: authoritativeModules.length,
      modulesBenchmarked: totals.modules,
    },
    totals,
    modules: moduleEntries,
    recommendationMethod: {
      name: "poc-module-complexity-v1",
      description: "Heuristic prioritization for selecting representative POC modules.",
      weights: {
        service: 3,
        controller: 2,
        firestoreHint: 1,
        permissionHint: 1,
        calls: "calls / 50, capped at 20",
      },
    },
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
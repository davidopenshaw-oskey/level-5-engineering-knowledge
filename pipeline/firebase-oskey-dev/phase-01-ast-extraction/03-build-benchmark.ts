// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script builds a benchmark for the knowledge pipeline, aggregating data
// from module manifests and evidence graphs, validating module completeness and summary metrics,
// and recording pipeline quality information.

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
      data.startsWith("file://")
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
      if (key === "absolutePath") continue;
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

function readRequiredJson<T>(filePath: string, contextDescription: string, notificationsPath: string, notifications: RunNotifications): T {
  if (!fs.existsSync(filePath)) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MISSING_REQUIRED_BENCHMARK_INPUT", `Missing required file '${contextDescription}' at '${filePath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required file '${contextDescription}' at '${filePath}'.`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (err: any) {
    addNotification(notifications, "03-build-benchmark", "fatal", "MALFORMED_BENCHMARK_INPUT", `Malformed JSON in required file '${contextDescription}' at '${filePath}': ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed JSON in required file '${contextDescription}' at '${filePath}'.`);
  }
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function getModuleDirs(modulesRoot: string) {
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isDirectory())
    .map((entry: fs.Dirent) => entry.name)
    .sort();
}

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
  const modulesRoot = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  const outputPath = path.join(repoOutputDir, "knowledge-pipeline", "benchmark.json");

  // Load AST Quality Manifest
  const astManifestPath = path.join(rawDir, "ast-evidence-manifest.json");
  const astManifest = readRequiredJson<any>(astManifestPath, "facts/ast-evidence-manifest.json", notificationsPath, notifications);

  if (astManifest.runId !== runId || astManifest.repoName !== REPO_NAME || typeof astManifest?.errors?.recordCount !== "number") {
    addNotification(notifications, "03-build-benchmark", "fatal", "MALFORMED_AST_MANIFEST", `AST manifest missing errors.recordCount or identity mismatch.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed AST quality manifest.`);
  }

  const astExtractionErrors = astManifest.errors.recordCount;

  // Load Authoritative Module Inventory
  const modulesJsonPath = path.join(rawDir, "modules.json");
  const modulesInventory = readRequiredJson<{ module: string }[]>(modulesJsonPath, "facts/modules.json", notificationsPath, notifications);
  const expectedModules = unique(modulesInventory.map(m => m.module)).sort();
  const moduleDirs = getModuleDirs(modulesRoot);

  if (expectedModules.length !== moduleDirs.length || expectedModules.some((m, idx) => m !== moduleDirs[idx])) {
    addNotification(
      notifications,
      "03-build-benchmark",
      "fatal",
      "MODULE_COUNT_MISMATCH_FATAL",
      `Module completeness mismatch: expected ${expectedModules.length} module(s) from modules.json, but found ${moduleDirs.length} on disk.`,
      { expectedModules, moduleDirs }
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[MODULE_COUNT_MISMATCH_FATAL] Module count mismatch between modules.json and module output directories.`);
  }

  const totals: Record<string, number> = {
    modules: expectedModules.length,
    facts: 0,
  };

  const benchmarkModules: Record<string, any>[] = [];
  const zeroFactModules: string[] = [];

  for (const moduleName of expectedModules) {
    const moduleRoot = path.join(modulesRoot, moduleName);
    const manifestPath = path.join(moduleRoot, `${moduleName}-manifest.json`);
    const graphPath = path.join(moduleRoot, `${moduleName}-evidence-graph.json`);

    const manifest = readRequiredJson<any>(manifestPath, `modules/${moduleName}/${moduleName}-manifest.json`, notificationsPath, notifications);
    const graph = readRequiredJson<any>(graphPath, `modules/${moduleName}/${moduleName}-evidence-graph.json`, notificationsPath, notifications);

    if (manifest.runId !== runId || graph.runId !== runId) {
      addNotification(notifications, "03-build-benchmark", "fatal", "MODULE_RUN_ID_MISMATCH", `Run ID mismatch inside module '${moduleName}' artifacts.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Run ID mismatch inside module '${moduleName}'.`);
    }

    const summary = (manifest.summary ?? {}) as Record<string, number>;
    const graphSummary = graph.summary ?? {};
    const countsByType = graphSummary.countsByType ?? {};
    const totalFacts = graphSummary.totalFacts ?? 0;

    if (totalFacts === 0) {
      zeroFactModules.push(moduleName);
    }

    const moduleBenchmark: Record<string, any> = {
      module: moduleName,
      facts: totalFacts,
      factsByType: countsByType,
    };

    // Validate Numeric Summaries
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        addNotification(
          notifications,
          "03-build-benchmark",
          "fatal",
          "NON_NUMERIC_SUMMARY_FATAL",
          `Non-numeric or infinite summary value encountered for key [${key}] in module [${moduleName}]: ${value}`,
          { module: moduleName, key, value }
        );
        writeNotificationsAtomically(notificationsPath, notifications);
        throw new Error(`[NON_NUMERIC_SUMMARY_FATAL] Non-numeric summary value for key '${key}' in module '${moduleName}'.`);
      }

      moduleBenchmark[key] = value;
      totals[key] = (totals[key] ?? 0) + value;
    }

    benchmarkModules.push(moduleBenchmark);
    totals.facts += totalFacts;
  }

  if (zeroFactModules.length > 0) {
    addNotification(
      notifications,
      "03-build-benchmark",
      "info",
      "ZERO_FACTS_MODULE_CONDITION",
      `${zeroFactModules.length} module(s) generated zero evidence facts.`,
      { zeroFactModules }
    );
  }

  if (totals.facts === 0) {
    addNotification(
      notifications,
      "03-build-benchmark",
      "warning",
      "ZERO_FACTS_REPO_CONDITION",
      "Zero total evidence facts synthesized across entire repository."
    );
  }

  // Add completion condition notification BEFORE building quality object
  const humanAttentionRecommended = notifications.entries.some(
    e => e.humanAttentionRecommended || e.severity === "error" || e.severity === "warning" || e.severity === "fatal"
  );

  if (humanAttentionRecommended) {
    addNotification(
      notifications,
      "03-build-benchmark",
      "info",
      "BENCHMARK_COMPLETED_WITH_WARNINGS",
      `Benchmark generated successfully. Pipeline completed with highest notification severity [${notifications.highestSeverity}].`
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

  // Calculate final quality object from updated notifications
  const unknownAstEvidenceTypes = notifications.entries.filter(
    e => e.code === "UNKNOWN_AST_EVIDENCE_TYPE"
  ).length;

  const quality = {
    notificationHighestSeverity: notifications.highestSeverity,
    notificationCount: notifications.entries.length,
    humanAttentionRecommended: notifications.entries.some(e => e.humanAttentionRecommended || e.severity === "error" || e.severity === "warning" || e.severity === "fatal"),
    astExtractionErrors,
    unknownAstEvidenceTypes,
    modulesExpected: expectedModules.length,
    modulesBenchmarked: benchmarkModules.length,
  };

  const recommendationMethod = {
    name: "poc-module-complexity-v1",
    description: "Heuristic prioritization for selecting representative POC modules.",
    weights: {
      service: 3,
      controller: 2,
      firestoreHint: 1,
      permissionHint: 1,
      calls: "calls / 50, capped at 20",
    },
  };

  const recommendedPocModules = [...benchmarkModules]
    .filter(m => m.files > 0)
    .map(m => ({
      ...m,
      score:
        (m.services ?? 0) * 3 +
        (m.controllers ?? 0) * 2 +
        (m.firestoreHints ?? 0) +
        (m.permissionHints ?? 0) +
        Math.min((m.calls ?? 0) / 50, 20),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const benchmark = {
    generatedAt: new Date().toISOString(),
    runId,
    quality,
    recommendationMethod,
    modules: benchmarkModules,
    totals,
    recommendedPocModules,
  };

  // Write benchmark.json atomically
  writeJsonAtomically(outputPath, benchmark, "knowledge-pipeline/benchmark.json");

  // Write notifications atomically
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Knowledge pipeline benchmark built");
  console.log(benchmark.totals);
  console.log(`Wrote ${outputPath}`);
}

main();
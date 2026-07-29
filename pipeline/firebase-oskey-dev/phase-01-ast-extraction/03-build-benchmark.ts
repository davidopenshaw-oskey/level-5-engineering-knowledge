// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script builds a benchmark for the knowledge pipeline, aggregating data
// from module manifests and evidence graphs, validating module completeness and summary metrics,
// and recording pipeline quality information.

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

const runContextPath = path.join(projectRoot, "output", "run-context.json");
if (!fs.existsSync(runContextPath)) {
  throw new Error("Could not find run-context.json. Please run `00-scan-repo` first.");
}
const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
const runId: string = runContext.runId;

const REPO_NAME: string = runContext.repoName;
if (!REPO_NAME) {
  throw new Error("Missing 'repoName' in output/run-context.json");
}
const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
const notificationsPath = path.join(repoOutputDir, "run-notifications.json");

const modulesRoot = path.join(repoOutputDir, "knowledge-pipeline", "modules");
if (!fs.existsSync(modulesRoot)) {
  throw new Error(`Could not find modules directory at '${modulesRoot}'. Please run 02-build-module-evidence first.`);
}

const outputPath = path.join(repoOutputDir, "knowledge-pipeline", "benchmark.json");

type AnyRecord = { [key: string]: any };

type NotificationSeverity = "info" | "warning" | "error";

interface NotificationEntry {
  id: string;
  timestamp: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: any;
  sourceScript?: string;
  humanAttentionRecommended?: boolean;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

function loadNotifications(): RunNotifications {
  if (fs.existsSync(notificationsPath)) {
    try {
      return JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
    } catch {
      // Return fresh template
    }
  }
  return {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    updatedAt: new Date().toISOString(),
    highestSeverity: "info",
    entries: [],
  };
}

function addNotification(
  notifications: RunNotifications,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: any,
  sourceScript = "03-build-benchmark",
  humanAttentionRecommended = false
) {
  const entry: NotificationEntry = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity,
    code,
    message,
    details,
    sourceScript,
    humanAttentionRecommended,
  };
  notifications.entries.push(entry);
  notifications.updatedAt = entry.timestamp;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
  };
  if (severityOrder[severity] > severityOrder[notifications.highestSeverity]) {
    notifications.highestSeverity = severity;
  }
}

function writeNotifications(notifications: RunNotifications) {
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function getModuleDirs() {
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isDirectory())
    .map((entry: fs.Dirent) => entry.name)
    .sort();
}

function main() {
  const notifications = loadNotifications();

  // Requirement 2: Load authoritative module list from facts/modules.json
  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(
      notifications,
      "error",
      "MISSING_MODULES_INVENTORY_ERROR",
      `Missing required facts/modules.json inventory at [${modulesJsonPath}].`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Missing facts/modules.json inventory at '${modulesJsonPath}'.`);
  }

  const modulesInventory = readJson<{ module: string }[]>(modulesJsonPath);
  const expectedModules = unique(modulesInventory.map(m => m.module)).sort();
  const moduleDirs = getModuleDirs();

  if (expectedModules.length !== moduleDirs.length || expectedModules.some((m, idx) => m !== moduleDirs[idx])) {
    addNotification(
      notifications,
      "error",
      "MODULE_COUNT_MISMATCH_ERROR",
      `Module completeness mismatch: expected ${expectedModules.length} module(s) from modules.json, but found ${moduleDirs.length} on disk.`,
      { expectedModules, moduleDirs }
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Module completeness mismatch between modules.json and module output directories.`);
  }

  const totals: Record<string, number> = {
    modules: expectedModules.length,
    facts: 0,
  };

  const benchmarkModules: AnyRecord[] = [];
  const zeroFactModules: string[] = [];

  // Requirement 1: Fail on incomplete module outputs
  for (const moduleName of expectedModules) {
    const moduleRoot = path.join(modulesRoot, moduleName);
    const manifestPath = path.join(moduleRoot, `${moduleName}-manifest.json`);
    const graphPath = path.join(moduleRoot, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(manifestPath)) {
      addNotification(
        notifications,
        "error",
        "MISSING_MODULE_ARTIFACT_ERROR",
        `Incomplete module output: module [${moduleName}] is missing required artifact [${moduleName}-manifest.json].`,
        { module: moduleName, missingArtifact: `${moduleName}-manifest.json` }
      );
      writeNotifications(notifications);
      throw new Error(`[Fail-Closed] Incomplete module output for module '${moduleName}': missing manifest.`);
    }

    if (!fs.existsSync(graphPath)) {
      addNotification(
        notifications,
        "error",
        "MISSING_MODULE_ARTIFACT_ERROR",
        `Incomplete module output: module [${moduleName}] is missing required artifact [${moduleName}-evidence-graph.json].`,
        { module: moduleName, missingArtifact: `${moduleName}-evidence-graph.json` }
      );
      writeNotifications(notifications);
      throw new Error(`[Fail-Closed] Incomplete module output for module '${moduleName}': missing evidence graph.`);
    }

    let manifest: AnyRecord;
    let graph: AnyRecord;
    try {
      manifest = readJson<AnyRecord>(manifestPath);
      graph = readJson<AnyRecord>(graphPath);
    } catch (err: any) {
      addNotification(
        notifications,
        "error",
        "MALFORMED_MODULE_OUTPUT_ERROR",
        `Malformed JSON artifact inside module output for [${moduleName}]: ${err.message}`,
        { module: moduleName }
      );
      writeNotifications(notifications);
      throw new Error(`[Fail-Closed] Malformed JSON artifact for module '${moduleName}'.`);
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

    // Requirement 3: Validate numeric summaries
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        addNotification(
          notifications,
          "error",
          "NON_NUMERIC_SUMMARY_ERROR",
          `Non-numeric or infinite summary value encountered for key [${key}] in module [${moduleName}]: ${value}`,
          { module: moduleName, key, value }
        );
        writeNotifications(notifications);
        throw new Error(`[Fail-Closed] Non-numeric summary value for key '${key}' in module '${moduleName}'.`);
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
      "info",
      "ZERO_FACTS_MODULE_CONDITION",
      `${zeroFactModules.length} module(s) generated zero evidence facts.`,
      { zeroFactModules }
    );
  }

  if (totals.facts === 0) {
    addNotification(
      notifications,
      "warning",
      "ZERO_FACTS_REPO_CONDITION",
      "Zero total evidence facts synthesized across entire repository."
    );
  }

  // Requirement 4: Include pipeline quality information
  let astExtractionErrors = 0;
  const astManifestPath = path.join(repoOutputDir, "facts", "ast-evidence-manifest.json");
  if (fs.existsSync(astManifestPath)) {
    try {
      const astManifest = readJson<any>(astManifestPath);
      astExtractionErrors = astManifest?.errors?.recordCount ?? 0;
    } catch {
      // Ignored
    }
  }

  const unknownAstEvidenceTypes = notifications.entries.filter(
    e => e.code === "UNKNOWN_AST_EVIDENCE_TYPE"
  ).length;

  const humanAttentionRecommended = notifications.entries.some(
    e => e.humanAttentionRecommended || e.severity === "error" || e.severity === "warning"
  );

  const quality = {
    notificationHighestSeverity: notifications.highestSeverity,
    notificationCount: notifications.entries.length,
    humanAttentionRecommended,
    astExtractionErrors,
    unknownAstEvidenceTypes,
    modulesExpected: expectedModules.length,
    modulesBenchmarked: benchmarkModules.length,
  };

  // Requirement 5: Document the POC recommendation score
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
    runId: runId,
    quality,
    recommendationMethod,
    modules: benchmarkModules,
    totals,
    recommendedPocModules,
  };

  // Requirement 6: Record completion conditions
  if (humanAttentionRecommended) {
    addNotification(
      notifications,
      "info",
      "BENCHMARK_COMPLETED_WITH_WARNINGS",
      `Benchmark generated successfully. Pipeline completed with highest notification severity [${notifications.highestSeverity}].`
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(benchmark, null, 2));

  // Write updated run-notifications.json
  writeNotifications(notifications);

  console.log("Knowledge pipeline benchmark built");
  console.log(benchmark.totals);
  console.log(`Wrote ${outputPath}`);
}

main();
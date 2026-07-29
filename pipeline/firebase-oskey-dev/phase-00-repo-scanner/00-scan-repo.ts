/// <reference types="node" />
// **version:** 3.0.0
// **location:** level-5 phase 0

// © Oskey SAS. All rights reserved

// This script acts as the repository and run authority.
// It validates configuration, clones the repository, verifies branch/commit checkout,
// creates run identifiers/directories, initializes run-notifications.json,
// and emits normalized repository-relative module and file manifests.

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const REPO_NAME = "firebase-oskey-dev";

type RepoConfigEntry = {
  name: string;
  gitUrl: string;
  branch?: string;
  commit?: string;
  modulesRoot: string;
  governancePath?: string;
};

type RepoConfig = {
  repositories: RepoConfigEntry[];
};

type NotificationSeverity = "info" | "warning" | "error";

interface NotificationEntry {
  id: string;
  timestamp: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: any;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "lib",
  "build",
  "coverage",
  ".git",
]);

function getRunId(commitSha: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}-${commitSha}`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toRepoPath(p: string): string {
  return p.replace(/\\/g, "/");
}

function isTsSource(filePath: string): boolean {
  return (
    filePath.endsWith(".ts") &&
    !filePath.endsWith(".spec.ts") &&
    !filePath.endsWith(".test.ts") &&
    !filePath.endsWith(".d.ts")
  );
}

function inferKind(filePath: string): string {
  if (filePath.includes("/services/") || filePath.includes("_service") || filePath.includes(".service.")) return "service";
  if (filePath.includes("/controllers/") || filePath.includes(".controller.")) return "controller";
  if (filePath.includes("/models/") || filePath.includes(".model.")) return "model";
  if (filePath.includes("/utils/") || filePath.includes(".utils.") || filePath.includes(".util.")) return "utils";
  if (filePath.includes("/data/") || filePath.includes(".data.")) return "data";
  if (filePath.includes("/functions/")) return "function";
  return "unknown";
}

function walkFiles(dirPath: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        results.push(...walkFiles(fullPath));
      }
    } else if (entry.isFile() && isTsSource(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function addNotification(
  notifications: RunNotifications,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: any
) {
  const entry: NotificationEntry = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity,
    code,
    message,
    details,
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

function writeNotifications(notificationsPath: string, notifications: RunNotifications) {
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
}

function validateConfig(configPath: string, repoName: string): RepoConfigEntry {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found at [${configPath}].`);
  }

  const config = readJson<RepoConfig>(configPath);
  if (!config || !Array.isArray(config.repositories)) {
    throw new Error(`Invalid repository configuration structure at [${configPath}].`);
  }

  const targetRepo = config.repositories.find((r) => r.name === repoName);
  if (!targetRepo) {
    throw new Error(`Repository [${repoName}] not found in configuration (${configPath}).`);
  }

  if (!targetRepo.gitUrl || typeof targetRepo.gitUrl !== "string" || targetRepo.gitUrl.trim().length === 0) {
    throw new Error(`Invalid repository configuration for [${repoName}]: 'gitUrl' is required.`);
  }

  if (!targetRepo.modulesRoot || typeof targetRepo.modulesRoot !== "string" || targetRepo.modulesRoot.trim().length === 0) {
    throw new Error(`Invalid repository configuration for [${repoName}]: 'modulesRoot' is required.`);
  }

  const hasBranch = typeof targetRepo.branch === "string" && targetRepo.branch.trim().length > 0;
  const hasCommit = typeof targetRepo.commit === "string" && targetRepo.commit.trim().length > 0;

  if (hasBranch && hasCommit) {
    throw new Error(`Ambiguous repository configuration for [${repoName}]: both 'branch' and 'commit' are configured.`);
  }

  if (!hasBranch && !hasCommit) {
    throw new Error(`Invalid repository configuration for [${repoName}]: either 'branch' or 'commit' must be configured.`);
  }

  return targetRepo;
}

function syncRepo(gitUrl: string, clonePath: string, branch?: string, commit?: string): { actualSha: string; actualBranch?: string } {
  const parentDir = path.dirname(clonePath);
  ensureDir(parentDir);

  if (fs.existsSync(clonePath)) {
    console.log(`Deleting existing clone directory: ${clonePath}...`);
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  console.log(`Cloning repository ${gitUrl} into ${clonePath}...`);
  try {
    execSync(`git clone "${gitUrl}" "${clonePath}"`, { stdio: "inherit" });
  } catch (err: any) {
    throw new Error(`Git clone failed for [${gitUrl}] into [${clonePath}]: ${err.message}`);
  }

  if (commit) {
    console.log(`Checking out exact commit ${commit}...`);
    try {
      execSync(`git -C "${clonePath}" checkout "${commit}"`, { stdio: "inherit" });
    } catch (err: any) {
      throw new Error(`Failed to check out commit [${commit}]: ${err.message}`);
    }
  } else if (branch) {
    console.log(`Checking out branch ${branch}...`);
    try {
      execSync(`git -C "${clonePath}" checkout "${branch}"`, { stdio: "inherit" });
    } catch {
      console.log(`Setting up local branch ${branch} to track origin/${branch}...`);
      try {
        execSync(`git -C "${clonePath}" checkout -b "${branch}" "origin/${branch}"`, { stdio: "inherit" });
      } catch (err: any) {
        throw new Error(`Failed to check out branch [${branch}]: ${err.message}`);
      }
    }

    console.log(`Pulling latest updates for branch ${branch}...`);
    try {
      execSync(`git -C "${clonePath}" pull origin "${branch}"`, { stdio: "inherit" });
    } catch (err: any) {
      throw new Error(`Failed to pull latest updates for branch [${branch}]: ${err.message}`);
    }
  }

  let actualSha = "unknown";
  try {
    actualSha = execSync(`git -C "${clonePath}" rev-parse HEAD`, { encoding: "utf8" }).trim();
  } catch {
    // Will be recorded in notifications
  }

  let actualBranch: string | undefined;
  if (branch) {
    try {
      actualBranch = execSync(`git -C "${clonePath}" rev-parse --abbrev-ref HEAD`, { encoding: "utf8" }).trim();
    } catch {
      // Ignored
    }
  }

  return { actualSha, actualBranch };
}

function main() {
  const projectRoot = process.cwd();
  const extractedAt = new Date().toISOString();
  const configPath = path.join(projectRoot, "config/repos.json");

  // Step 1: Validate configuration
  const targetRepo = validateConfig(configPath, REPO_NAME);

  const clonePath = path.join(projectRoot, "output", "clones", targetRepo.name);

  // Steps 2 - 4: Delete clone, Clone repository, and Checkout branch/commit
  const syncResult = syncRepo(targetRepo.gitUrl, clonePath, targetRepo.branch, targetRepo.commit);

  // Step 5: Resolve commit SHA
  const actualSha = syncResult.actualSha;
  const shortSha = actualSha !== "unknown" ? actualSha.substring(0, 8) : "unknown";

  // Step 6: Create Run ID
  const runId = getRunId(shortSha);
  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);

  // Step 7: Create Run Directory
  const outputDir = path.join(projectRoot, "output");
  const repoOutputDir = path.join(outputDir, "runs", REPO_NAME, runId);
  const rawOutputDir = path.join(repoOutputDir, "facts");

  ensureDir(outputDir);
  ensureDir(rawOutputDir);

  // Step 8: Initialize run-notifications.json
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications: RunNotifications = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    updatedAt: extractedAt,
    highestSeverity: "info",
    entries: [],
  };

  if (actualSha === "unknown") {
    addNotification(
      notifications,
      "warning",
      "SHA_RESOLUTION_WARNING",
      `Commit SHA could not be resolved from repository at [${clonePath}].`
    );
  }

  if (targetRepo.branch && syncResult.actualBranch && syncResult.actualBranch !== targetRepo.branch) {
    addNotification(
      notifications,
      "warning",
      "BRANCH_MISMATCH_WARNING",
      `Configured branch [${targetRepo.branch}] differs from actual checked-out branch [${syncResult.actualBranch}].`,
      { configuredBranch: targetRepo.branch, actualBranch: syncResult.actualBranch }
    );
  }

  // Write run-context.json
  fs.writeFileSync(
    path.join(outputDir, "run-context.json"),
    JSON.stringify({ runId, repoName: REPO_NAME, extractedAt }, null, 2)
  );

  // Write or update latest-repo-manifest.json
  const latestManifestPath = path.join(outputDir, "latest-repo-manifest.json");
  let latestManifestData: any = { updatedAt: extractedAt, repositories: {} };
  if (fs.existsSync(latestManifestPath)) {
    try {
      latestManifestData = JSON.parse(fs.readFileSync(latestManifestPath, "utf8"));
    } catch {
      addNotification(
        notifications,
        "warning",
        "MANIFEST_RESET_WARNING",
        `Malformed existing latest-repository manifest at [${latestManifestPath}] was replaced with a fresh template.`
      );
    }
  }
  latestManifestData.updatedAt = extractedAt;
  if (!latestManifestData.repositories) {
    latestManifestData.repositories = {};
  }
  latestManifestData.repositories[REPO_NAME] = {
    latestRunId: runId,
    repoName: REPO_NAME,
    runPath: `output/runs/${REPO_NAME}/${runId}`,
    commitSha: actualSha,
    extractedAt,
  };

  fs.writeFileSync(latestManifestPath, JSON.stringify(latestManifestData, null, 2));

  // Step 9: Scan Modules & Files
  const modulesOutput: any[] = [];
  const filesOutput: any[] = [];

  const modulesRootAbs = path.join(clonePath, targetRepo.modulesRoot);

  if (!fs.existsSync(modulesRootAbs)) {
    addNotification(
      notifications,
      "error",
      "ZERO_MODULES_ERROR",
      `Configured modules root directory does not exist: [${targetRepo.modulesRoot}].`
    );
    writeNotifications(notificationsPath, notifications);
    throw new Error(`Configured modules root directory does not exist: ${modulesRootAbs}`);
  }

  const moduleDirs = fs
    .readdirSync(modulesRootAbs, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (moduleDirs.length === 0) {
    addNotification(
      notifications,
      "error",
      "ZERO_MODULES_ERROR",
      `Zero modules discovered inside modules root [${targetRepo.modulesRoot}].`
    );
    writeNotifications(notificationsPath, notifications);
    throw new Error(`Zero modules discovered in ${modulesRootAbs}`);
  }

  for (const moduleName of moduleDirs) {
    const modulePathAbs = path.join(modulesRootAbs, moduleName);
    const moduleFiles = walkFiles(modulePathAbs);

    if (moduleFiles.length === 0) {
      addNotification(
        notifications,
        "warning",
        "EMPTY_MODULE_WARNING",
        `Unexpected empty module [${moduleName}]: zero TypeScript source files discovered.`,
        { module: moduleName }
      );
    }

    const submodulesRoot = path.join(modulePathAbs, "modules");
    const submodules = fs.existsSync(submodulesRoot)
      ? fs
          .readdirSync(submodulesRoot, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort()
      : [];

    const relModulePath = toRepoPath(path.relative(clonePath, modulePathAbs));

    modulesOutput.push({
      repo: targetRepo.name,
      module: moduleName,
      path: relModulePath,
      submodules,
      fileCount: moduleFiles.length,
    });

    for (const fileAbs of moduleFiles) {
      const relToRepo = toRepoPath(path.relative(clonePath, fileAbs));
      const submodule = submodules.find((s) =>
        relToRepo.includes(`/modules/${s}/`)
      );

      filesOutput.push({
        repo: targetRepo.name,
        module: moduleName,
        submodule: submodule ?? null,
        path: relToRepo,
        kindHint: inferKind(relToRepo),
        sizeBytes: fs.statSync(fileAbs).size,
      });
    }
  }

  if (filesOutput.length === 0) {
    addNotification(
      notifications,
      "error",
      "ZERO_FILES_ERROR",
      `Zero TypeScript source files discovered across all ${modulesOutput.length} modules.`
    );
    writeNotifications(notificationsPath, notifications);
    throw new Error(`Zero TypeScript source files discovered across repository [${REPO_NAME}]`);
  }

  // Write facts JSON files
  fs.writeFileSync(
    path.join(rawOutputDir, "modules.json"),
    JSON.stringify(modulesOutput, null, 2)
  );

  fs.writeFileSync(
    path.join(rawOutputDir, "files.json"),
    JSON.stringify(filesOutput, null, 2)
  );

  // Write final run-notifications.json
  writeNotifications(notificationsPath, notifications);

  console.log(`Repo: ${REPO_NAME}`);
  console.log(`Modules found: ${modulesOutput.length}`);
  console.log(`Files found: ${filesOutput.length}`);
  console.log(`Raw facts written to: ${rawOutputDir}`);
  console.log(`Run notifications initialized at: ${notificationsPath}`);
}

main();
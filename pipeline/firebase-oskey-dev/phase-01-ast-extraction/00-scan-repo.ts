// **version:** 3.0.0
// **location:** level-5 phase 0
// © Oskey SAS. All rights reserved.
//
// Script 00: Repository Scanner and Run Authority (Phase 0).
// Establishes immutable run context, clones and checks out exact repository state,
// initializes run notifications, and writes authoritative module and file inventories.

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

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

function toRepoPath(absolutePath: string, repoRoot: string): string {
  const relative = path.relative(repoRoot, absolutePath);
  return relative.replace(/\\/g, "/");
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

type FileRecord = {
  repo: string;
  module: string;
  submodule: string | null;
  path: string;
  kindHint: string;
  sizeBytes: number;
};

function main() {
  const REPO_NAME = process.env.REPO_NAME || "firebase-oskey-dev";
  const configPath = path.join(projectRoot, "config", "repos.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(`[Fail-Closed] Configuration file missing at '${configPath}'.`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!config || !Array.isArray(config.repositories)) {
    throw new Error(`[Fail-Closed] Invalid repos.json format.`);
  }

  const targetRepo = config.repositories.find((repo: any) => repo.name === REPO_NAME);
  if (!targetRepo) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }

  if (!targetRepo.gitUrl) {
    throw new Error(`[Fail-Closed] Target repository '${REPO_NAME}' is missing 'gitUrl'.`);
  }

  if (!targetRepo.modulesRoot) {
    throw new Error(`[Fail-Closed] Target repository '${REPO_NAME}' is missing 'modulesRoot'.`);
  }

  const hasBranch = Boolean(targetRepo.branch);
  const hasCommit = Boolean(targetRepo.commit);

  if ((hasBranch && hasCommit) || (!hasBranch && !hasCommit)) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' must configure exactly one of 'branch' or 'commit'.`);
  }

  const clonesDir = path.join(projectRoot, "output", "clones");
  const clonePath = path.join(clonesDir, REPO_NAME);

  if (fs.existsSync(clonePath)) {
    console.log(`Deleting existing clone directory: ${clonePath}...`);
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  fs.mkdirSync(clonesDir, { recursive: true });

  console.log(`Cloning repository ${targetRepo.gitUrl} into ${clonePath}...`);
  try {
    execFileSync("git", ["clone", targetRepo.gitUrl, clonePath], { stdio: "inherit" });
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Git clone failed for '${targetRepo.gitUrl}': ${err.message}`);
  }

  let resolvedRef = "";

  if (hasBranch) {
    const configuredBranch = targetRepo.branch;
    try {
      execFileSync("git", ["fetch", "origin", configuredBranch], { cwd: clonePath, stdio: "inherit" });
      execFileSync("git", ["checkout", "-B", configuredBranch, `origin/${configuredBranch}`], { cwd: clonePath, stdio: "inherit" });
      execFileSync("git", ["reset", "--hard", `origin/${configuredBranch}`], { cwd: clonePath, stdio: "inherit" });
    } catch (err: any) {
      throw new Error(`[Fail-Closed] Git checkout/reset failed for branch '${configuredBranch}': ${err.message}`);
    }

    const actualBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: clonePath, encoding: "utf8" }).trim();
    if (actualBranch !== configuredBranch) {
      throw new Error(`[BRANCH_MISMATCH_FATAL] Configured branch '${configuredBranch}' does not match checked-out branch '${actualBranch}'.`);
    }
    resolvedRef = configuredBranch;
  } else {
    const configuredCommit = targetRepo.commit;
    try {
      execFileSync("git", ["checkout", "--detach", configuredCommit], { cwd: clonePath, stdio: "inherit" });
    } catch (err: any) {
      throw new Error(`[Fail-Closed] Git checkout --detach failed for commit '${configuredCommit}': ${err.message}`);
    }
    resolvedRef = configuredCommit;
  }

  let commitSha = "";
  try {
    commitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: clonePath, encoding: "utf8" }).trim();
  } catch (err: any) {
    throw new Error(`[COMMIT_SHA_RESOLVE_FATAL] Failed to resolve git commit SHA: ${err.message}`);
  }

  if (!commitSha || commitSha.length < 7) {
    throw new Error(`[COMMIT_SHA_RESOLVE_FATAL] Invalid commit SHA resolved: '${commitSha}'.`);
  }

  if (hasCommit && !commitSha.startsWith(targetRepo.commit)) {
    throw new Error(`[COMMIT_SHA_MISMATCH_FATAL] Resolved commit SHA '${commitSha}' does not match configured commit '${targetRepo.commit}'.`);
  }

  // Generate Run ID
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
  const shortSha = commitSha.slice(0, 8);
  const runId = `${dateStr}-${shortSha}`;

  const runDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const factsDir = path.join(runDir, "facts");
  const kpDir = path.join(runDir, "knowledge-pipeline");

  fs.mkdirSync(factsDir, { recursive: true });
  fs.mkdirSync(kpDir, { recursive: true });

  const notificationsFilePath = path.join(runDir, "run-notifications.json");
  const notifications: RunNotifications = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    updatedAt: now.toISOString(),
    highestSeverity: "info",
    entries: [],
  };

  addNotification(
    notifications,
    "00-scan-repo",
    "info",
    "RUN_INITIALIZED",
    `Initialized pipeline run [${runId}] for repo [${REPO_NAME}] at commit [${commitSha}].`,
    { commitSha, ref: resolvedRef }
  );

  // Unpersisted local runtime context (contains only portable run ID and repo name)
  const runContext: Record<string, any> = {
    runId,
    repoName: REPO_NAME,
    commitSha,
    createdAt: now.toISOString(),
  };
  if (hasBranch) runContext.branch = targetRepo.branch;
  if (hasCommit) runContext.commit = targetRepo.commit;

  // Scan Configured Modules Root
  const modulesRootAbsolute = path.join(clonePath, targetRepo.modulesRoot);
  if (!fs.existsSync(modulesRootAbsolute)) {
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "ZERO_MODULES_FATAL",
      `Configured modulesRoot '${targetRepo.modulesRoot}' does not exist in target repository.`
    );
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_MODULES_FATAL] Configured modulesRoot '${targetRepo.modulesRoot}' does not exist in repository.`);
  }

  const modules = fs
    .readdirSync(modulesRootAbsolute, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isDirectory())
    .map((entry: fs.Dirent) => entry.name)
    .sort();

  if (modules.length === 0) {
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "ZERO_MODULES_FATAL",
      `Zero modules found under configured modulesRoot '${targetRepo.modulesRoot}'.`
    );
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_MODULES_FATAL] Zero modules found under configured modulesRoot '${targetRepo.modulesRoot}'.`);
  }

  const moduleEntries = modules.map(m => ({ module: m }));

  // Scan File Inventory (TypeScript source files only, detecting submodules)
  const filesList: FileRecord[] = [];

  function scanDirectory(dir: string, currentModule: string, currentSubmodule: string | null) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (
          item.name === "node_modules" ||
          item.name === ".git" ||
          item.name === "dist" ||
          item.name === "lib" ||
          item.name === "build" ||
          item.name === "coverage"
        ) {
          continue;
        }

        let detectedSubmodule = currentSubmodule;
        if (item.name === "modules") {
          // Check for nested submodules under {module}/modules/{submodule}
          const subItems = fs.readdirSync(fullPath, { withFileTypes: true });
          for (const subItem of subItems) {
            if (subItem.isDirectory()) {
              scanDirectory(path.join(fullPath, subItem.name), currentModule, subItem.name);
            }
          }
          continue;
        }

        scanDirectory(fullPath, currentModule, detectedSubmodule);
      } else if (item.isFile()) {
        const repoPath = toRepoPath(fullPath, clonePath);

        // Include .ts files only; exclude .d.ts, .spec.ts, .test.ts
        if (
          repoPath.endsWith(".ts") &&
          !repoPath.endsWith(".d.ts") &&
          !repoPath.endsWith(".spec.ts") &&
          !repoPath.endsWith(".test.ts")
        ) {
          const stat = fs.statSync(fullPath);
          filesList.push({
            repo: REPO_NAME,
            module: currentModule,
            submodule: currentSubmodule,
            path: repoPath,
            kindHint: "typescript",
            sizeBytes: stat.size,
          });
        }
      }
    }
  }

  for (const m of modules) {
    scanDirectory(path.join(modulesRootAbsolute, m), m, null);
  }

  filesList.sort((a, b) => a.path.localeCompare(b.path));

  if (filesList.length === 0) {
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "ZERO_SOURCE_FILES_FATAL",
      `Zero TypeScript source files found under configured modulesRoot '${targetRepo.modulesRoot}'.`
    );
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_SOURCE_FILES_FATAL] Zero TypeScript source files found under configured modulesRoot '${targetRepo.modulesRoot}'.`);
  }

  // Write all run artifacts atomically
  writeJsonAtomically(path.join(projectRoot, "output", "run-context.json"), runContext, "output/run-context.json");
  writeJsonAtomically(path.join(factsDir, "modules.json"), moduleEntries, "facts/modules.json");
  writeJsonAtomically(path.join(factsDir, "files.json"), filesList, "facts/files.json");
  writeNotificationsAtomically(notificationsFilePath, notifications);

  // Update latest manifest atomically LAST
  const latestManifest = {
    runId,
    repoName: REPO_NAME,
    commitSha,
    ref: resolvedRef,
    updatedAt: now.toISOString(),
    modulesCount: modules.length,
    filesCount: filesList.length,
  };
  writeJsonAtomically(path.join(projectRoot, "output", "latest-repo-manifest.json"), latestManifest, "output/latest-repo-manifest.json");

  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);
  console.log(`Repo: ${REPO_NAME}`);
  console.log(`Modules found: ${modules.length}`);
  console.log(`TypeScript files found: ${filesList.length}`);
  console.log(`Raw facts written to: ${factsDir}`);
  console.log(`Run notifications initialized at: ${notificationsFilePath}`);
}

main();
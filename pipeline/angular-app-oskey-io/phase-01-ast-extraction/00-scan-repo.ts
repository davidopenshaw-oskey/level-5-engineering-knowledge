// **version:** 3.1.0
// **location:** level-5 phase 0
// © Oskey SAS. All rights reserved.
//
// Script 00: Repository Scanner and Run Authority (Phase 0).
// Establishes immutable run context, clones and checks out exact repository state,
// initializes run notifications, and writes authoritative module and file inventories.
//
// CHANGELOG (3.1.0):
// - REPO_NAME now REQUIRED via env var; no silent default (was a footgun once
//   multiple repos exist).
// - Run-state (run-context.json, latest-repo-manifest.json) is now namespaced
//   under output/{repoName}/ instead of a single global output/ file, so
//   multiple repos' pipelines cannot collide on disk.
// - Git command output is captured (not inherited) and folded into
//   run-notifications.json, so it is visible in a headless/agent execution
//   context where there is no attached terminal.
// - Shared notification / atomic-write / path-safety helpers now imported from
//   _shared/run-utils.ts instead of being duplicated in this file.

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  toRepoPath,
  runContextPath,
  latestManifestPath,
  requireRepoNameEnv,
} from "./_shared/run-utils";

const projectRoot = process.cwd();

type FileRecord = {
  repo: string;
  module: string;
  submodule: string | null;
  path: string;
  kindHint: string;
  sizeBytes: number;
};

/** Redacts any argument that looks like an absolute local filesystem path
 * (e.g. the clone destination) before it is logged into notifications,
 * keeping git subcommands/refs/URLs (which are safe and useful to see)
 * while never letting an absolute path reach a written artifact. */
function sanitizeGitArgsForLog(args: string[]): string[] {
  return args.map(arg => {
    const isAbsoluteUnix = arg.startsWith("/");
    const isAbsoluteWindows = /^[a-zA-Z]:\\/.test(arg);
    return isAbsoluteUnix || isAbsoluteWindows ? "<local-path-redacted>" : arg;
  });
}

/** Redacts absolute-path-looking substrings from free-text content (e.g. git
 * stderr), which can otherwise embed the local clone path in ways that a
 * simple per-argument check (sanitizeGitArgsForLog) would miss. */
function sanitizeTextForLog(text: string): string {
  return text
    .replace(/\/Users\/[^\s'"]*/g, "<local-path-redacted>")
    .replace(/\/home\/[^\s'"]*/g, "<local-path-redacted>")
    .replace(/[a-zA-Z]:\\[^\s'"]*/g, "<local-path-redacted>");
}

/** Runs a git command with captured output instead of inherited stdio, so the
 * result is observable in headless/agent runtimes (no attached terminal) and
 * can be logged into run-notifications.json rather than lost to a console
 * that nobody is watching. Logged args are sanitized -- raw argv can contain
 * the absolute clone path, which must never reach a written artifact. */
function runGitCaptured(args: string[], cwd: string, notifications: RunNotifications, repoName: string): string {
  const safeArgs = sanitizeGitArgsForLog(args);
  try {
    const output = execFileSync("git", args, { cwd, encoding: "utf8" });
    addNotification(
      notifications,
      "00-scan-repo",
      "info",
      "GIT_COMMAND_OK",
      `git ${safeArgs.join(" ")} succeeded.`,
      { key: safeArgs.join("_") }
    );
    return output;
  } catch (err: any) {
    const rawStderr = err?.stderr ? String(err.stderr) : err?.message || String(err);
    const stderr = sanitizeTextForLog(rawStderr);
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "GIT_COMMAND_FAILED",
      `git ${safeArgs.join(" ")} failed: ${stderr}`,
      { key: safeArgs.join("_") },
      true
    );
    throw new Error(`[Fail-Closed] git ${args.join(" ")} failed: ${stderr}`);
  }
}

function main() {
  const REPO_NAME = requireRepoNameEnv();
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

  // Notifications are created after clone so we have a runId-free bootstrap
  // ledger; it gets folded into the real, namespaced notifications once runId
  // is known below. We still want git failures during clone to be captured,
  // so we track them in a provisional ledger first.
  const provisionalNotifications: RunNotifications = {
    schemaVersion: "1.0.0",
    runId: "pending",
    repoName: REPO_NAME,
    updatedAt: new Date().toISOString(),
    highestSeverity: "info",
    entries: [],
  };

  console.log(`Cloning repository ${targetRepo.gitUrl} into ${clonePath}...`);
  runGitCaptured(["clone", targetRepo.gitUrl, clonePath], projectRoot, provisionalNotifications, REPO_NAME);

  let resolvedRef = "";

  if (hasBranch) {
    const configuredBranch = targetRepo.branch;
    runGitCaptured(["fetch", "origin", configuredBranch], clonePath, provisionalNotifications, REPO_NAME);
    runGitCaptured(["checkout", "-B", configuredBranch, `origin/${configuredBranch}`], clonePath, provisionalNotifications, REPO_NAME);
    runGitCaptured(["reset", "--hard", `origin/${configuredBranch}`], clonePath, provisionalNotifications, REPO_NAME);

    const actualBranch = runGitCaptured(["rev-parse", "--abbrev-ref", "HEAD"], clonePath, provisionalNotifications, REPO_NAME).trim();
    if (actualBranch !== configuredBranch) {
      throw new Error(`[BRANCH_MISMATCH_FATAL] Configured branch '${configuredBranch}' does not match checked-out branch '${actualBranch}'.`);
    }
    resolvedRef = configuredBranch;
  } else {
    const configuredCommit = targetRepo.commit;
    runGitCaptured(["checkout", "--detach", configuredCommit], clonePath, provisionalNotifications, REPO_NAME);
    resolvedRef = configuredCommit;
  }

  const commitSha = runGitCaptured(["rev-parse", "HEAD"], clonePath, provisionalNotifications, REPO_NAME).trim();

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

  // Promote provisional (clone/checkout) notifications into the real,
  // runId-stamped ledger now that runId is known.
  const notifications: RunNotifications = {
    ...provisionalNotifications,
    runId,
    updatedAt: now.toISOString(),
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
        
        const subDirItems = fs.readdirSync(fullPath, { withFileTypes: true });
        const hasRoutes = subDirItems.some(subItem => subItem.isFile() && subItem.name.endsWith(".routes.ts"));

        if (hasRoutes || currentSubmodule === null) {
          detectedSubmodule = currentSubmodule === null ? item.name : `${currentSubmodule}_${item.name}`;
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

  // Write all run artifacts atomically. run-context.json and
  // latest-repo-manifest.json are namespaced under output/{repoName}/ so
  // multiple repos' pipelines cannot collide on a shared global path.
  writeJsonAtomically(runContextPath(projectRoot, REPO_NAME), runContext, `output/${REPO_NAME}/run-context.json`);
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
  writeJsonAtomically(latestManifestPath(projectRoot, REPO_NAME), latestManifest, `output/${REPO_NAME}/latest-repo-manifest.json`);

  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);
  console.log(`Repo: ${REPO_NAME}`);
  console.log(`Modules found: ${modules.length}`);
  console.log(`TypeScript files found: ${filesList.length}`);
  console.log(`Raw facts written to: ${factsDir}`);
  console.log(`Run notifications initialized at: ${notificationsFilePath}`);
}

main();
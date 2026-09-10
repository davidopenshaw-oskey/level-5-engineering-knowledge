// **version:** 1.0.0
// **location:** level-5 phase 0
// © Oskey SAS. All rights reserved.
//
// Script 00: Repository Scanner and Run Authority (Phase 0) -- Swift.
// Establishes immutable run context, clones and checks out exact repository
// state, initializes run notifications, and writes authoritative module and
// file inventories.
//
// SHARED ACROSS EVERY SWIFT REPO in the ios-oskey-dev family, not forked
// per repo -- restructured 2026-09-10 (governance/roadmap/ios-oskey-dev/
// 12-pipeline-restructure-shared-swift-scripts-2026-09-10.md). Originally
// lived at pipeline/swift-ble-kit-oskey-dev/ with a hardcoded single-repo
// guard and a hardcoded module name; both removed once it became clear all
// 6 Swift repos need the identical syntax-tree extraction logic, with
// nothing repo-specific baked into the extraction itself (unlike the 3 TS
// repos, whose own 01-extract-ast-evidence.ts copies have already diverged
// with real per-domain logic -- Firestore triggers, Mongo operations, Joi
// schemas -- and are NOT being merged in this pass).
//
// Real, load-bearing differences from the TS/Kotlin repos' own copies of
// this script:
//
// - **Module discovery is dynamic, not hardcoded or config-declared**: every
//   real subdirectory directly under `modulesRoot` ("Sources") is its own
//   SPM target/module, per SPM's own real convention (confirmed directly,
//   not assumed: swift-ble-kit-oskey-dev/swift-cloud-kit-oskey-dev/swift-
//   webrtc-kit-oskey-io/swift-ui-kit-oskey-dev each have exactly one such
//   directory; swift-ai-kit-oskey-io has two -- CxxRecognition,
//   SwiftRecognition -- confirming this needed to be real discovery, not a
//   single hardcoded string, from the start). A file's own `module` is
//   simply the first path segment under `modulesRoot`.
// - No submodule BFS. node-iot's own script runs a real import-graph BFS
//   seeded from route-file roots to split one module into per-route
//   submodules; that technique doesn't apply here (no routes, no BFS-worthy
//   internal structure) and Kotlin's own precedent for small single-target
//   modules (4 library modules, 5-17 files each) was to assign
//   submodule=null uniformly rather than force a split -- every Swift leaf
//   package checked so far (30-109 files) is well within that same
//   "no split warranted" shape, confirmed directly per repo, not assumed to
//   generalize.
// - File collection is scoped to `modulesRoot` ("Sources"), matching
//   config/repos.json -- Tests/ is deliberately excluded here, the same way
//   node-iot's own script excludes *.spec.ts/*.test.ts. Real declaration/
//   call-graph extraction (01-extract-ast-evidence.ts) is a separate concern
//   from this script's job of producing an authoritative file inventory.

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

  if (!targetRepo.astTool) {
    throw new Error(`[Fail-Closed] Target repository '${REPO_NAME}' is missing 'astTool' -- Task 1 decision not recorded in config.`);
  }
  if (targetRepo.astTool !== "SwiftSyntax") {
    throw new Error(`[Fail-Closed] This script only handles Swift repos (astTool: "SwiftSyntax") -- '${REPO_NAME}' is configured with astTool '${targetRepo.astTool}'.`);
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

  const runContext: Record<string, any> = {
    runId,
    repoName: REPO_NAME,
    commitSha,
    createdAt: now.toISOString(),
  };
  if (hasBranch) runContext.branch = targetRepo.branch;
  if (hasCommit) runContext.commit = targetRepo.commit;

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

  // Real, dynamic module discovery -- NOT hardcoded, NOT config-declared.
  // SPM's own real convention: every direct subdirectory of `modulesRoot`
  // ("Sources") is its own target/module. Confirmed directly across the
  // family, not assumed from one repo: swift-ble-kit-oskey-dev/swift-cloud-
  // kit-oskey-dev/swift-webrtc-kit-oskey-io/swift-ui-kit-oskey-dev each have
  // exactly one such directory; swift-ai-kit-oskey-io has two
  // (CxxRecognition, SwiftRecognition) -- proof this needed to be real
  // discovery from the start, not a single hardcoded string that happened
  // to work for the first repo checked.
  const moduleDirs = fs.readdirSync(modulesRootAbsolute, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  if (moduleDirs.length === 0) {
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "ZERO_MODULES_FATAL",
      `Zero module directories found directly under modulesRoot '${targetRepo.modulesRoot}'.`
    );
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_MODULES_FATAL] Zero module directories found directly under modulesRoot '${targetRepo.modulesRoot}'.`);
  }

  const modules = moduleDirs;
  const moduleEntries = modules.map(m => ({ module: m }));

  // File inventory: walk modulesRoot only (Sources/), collect real .swift
  // files. No submodule BFS -- single-target repo, submodule=null uniformly
  // per the real precedent in this file's own header comment. A file's
  // `module` is simply its own first path segment under modulesRoot (e.g.
  // "Sources/OSKBluetoothLEKit/Foo.swift" -> module "OSKBluetoothLEKit").
  const filesList: FileRecord[] = [];
  const allFiles: string[] = [];

  function collectFiles(dir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === ".git" || item.name === ".build" || item.name === ".swiftpm") {
          continue;
        }
        collectFiles(fullPath);
      } else if (item.isFile() && item.name.endsWith(".swift")) {
        allFiles.push(fullPath);
      }
    }
  }

  collectFiles(modulesRootAbsolute);

  for (const absPath of allFiles) {
    const relativeToModulesRoot = path.relative(modulesRootAbsolute, absPath);
    const module = relativeToModulesRoot.split(path.sep)[0];
    const stat = fs.statSync(absPath);
    filesList.push({
      repo: REPO_NAME,
      module,
      submodule: null,
      path: toRepoPath(absPath, clonePath),
      kindHint: "swift",
      sizeBytes: stat.size,
    });
  }

  filesList.sort((a, b) => a.path.localeCompare(b.path));

  if (filesList.length === 0) {
    addNotification(
      notifications,
      "00-scan-repo",
      "fatal",
      "ZERO_SOURCE_FILES_FATAL",
      `Zero Swift source files found under configured modulesRoot '${targetRepo.modulesRoot}'.`
    );
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_SOURCE_FILES_FATAL] Zero Swift source files found under configured modulesRoot '${targetRepo.modulesRoot}'.`);
  }

  writeJsonAtomically(runContextPath(projectRoot, REPO_NAME), runContext, `output/${REPO_NAME}/run-context.json`);
  writeJsonAtomically(path.join(factsDir, "modules.json"), moduleEntries, "facts/modules.json");
  writeJsonAtomically(path.join(factsDir, "files.json"), filesList, "facts/files.json");
  writeNotificationsAtomically(notificationsFilePath, notifications);

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
  console.log(`Swift files found: ${filesList.length}`);
  console.log(`Raw facts written to: ${factsDir}`);
  console.log(`Run notifications initialized at: ${notificationsFilePath}`);
}

main();

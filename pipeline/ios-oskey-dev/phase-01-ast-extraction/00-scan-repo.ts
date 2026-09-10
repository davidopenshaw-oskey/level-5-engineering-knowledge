// **version:** 1.0.0
// **location:** level-5 phase 0 -- ios-oskey-dev (the app itself)
// © Oskey SAS. All rights reserved.
//
// Script 00: Repository Scanner and Run Authority (Phase 0) -- ios-oskey-dev.
// NOT shared with pipeline/swift/00-scan-repo.ts -- per Task 11 (governance/
// roadmap/ios-oskey-dev/10-p1-build-tasklist-2026-09-10.md), this repo is a
// real Xcode app (.xcodeproj/.xcworkspace), not a Swift Package -- there is
// no Sources/<module>/ convention to walk. Real target discovery instead
// requires parsing project.pbxproj (an OpenStep-plist file) via the `xcode`
// npm package. Once this script writes facts/files.json in the exact same
// shape every other Swift repo's 00-scan-repo.ts produces, the SHARED
// pipeline/swift/01-07 scripts run against this repo completely unmodified
// -- confirmed by direct reading of 01-extract-ast-evidence.ts (it invokes
// the swift-extractor subprocess against the whole clone, then filters down
// to whatever facts/files.json already decided is in scope; nothing in 01-07
// assumes SPM's modulesRoot convention). Bounded-tested for real against
// this repo's actual pbxproj before being written -- see governance/roadmap/
// ios-oskey-dev/14-task11-pbxproj-structure-bounded-test-2026-09-10.md.
//
// Real, load-bearing findings this script encodes (full detail in doc 14):
//
// - Real target discovery is DYNAMIC -- every real PBXNativeTarget in the
//   parsed project is read at scan time (3 today: "iOS App", "OSKEYTests",
//   "OSKDoorUnlockActivityExtension"), never hardcoded by name or count.
// - A target's real file membership comes from the UNION of two independent,
//   real Xcode mechanisms, per target: (a) the classic explicit
//   PBXSourcesBuildPhase file list, and (b) Apple's newer (Xcode 16+) real
//   "file system synchronized group" feature (fileSystemSynchronizedGroups
//   -> PBXFileSystemSynchronizedRootGroup -> a REAL recursive directory walk
//   on disk, honoring any real PBXFileSystemSynchronizedBuildFileExceptionSet
//   exclusions). All 3 real targets in this repo use a MIX of both -- not
//   assumed, confirmed directly (doc 14 Finding 2).
// - Real file paths are NOT the bare `path` field on a PBXFileReference /
//   PBXFileSystemSynchronizedRootGroup -- that field is very often just a
//   filename. The real full path only exists by walking the real parent-
//   group chain up to the project's mainGroup (doc 14 Finding 3) -- built
//   here as realPathFromRoot(), verified against real files on disk.
// - Real, measured, NOT assumed: 469 of this repo's 482 real .swift files
//   belong to at least one real target; 13 belong to NONE (confirmed absent
//   from project.pbxproj entirely, genuinely dead code, not merely excluded-
//   but-visible) -- per explicit user decision 2026-09-10, these 13 are
//   SKIPPED from facts/files.json entirely, not tagged/included.
// - Real, measured, NOT assumed: exactly 2 real files belong to MORE than
//   one target (OSKDoorUnlockAttributes.swift, String.swift -- both real,
//   legitimate shared code between "iOS App" and the door-unlock widget
//   extension). The shared pipeline/swift/01-07 scripts assume one real
//   `module` string per file (a plain Map keyed by path -- a second row for
//   the same path would silently clobber the first, not merge). Rather than
//   forking the shared scripts for 2 real files, this script assigns a
//   single, honestly-derived PRIMARY module (the target with the larger
//   real total file count among the ones a shared file belongs to -- dynamic,
//   not hardcoded to "iOS App" by name) and records the rest in an
//   additionalTargets field the shared scripts simply ignore (extra JSON
//   fields are not an error to a script that only reads `module`).

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import * as xcode from "xcode";
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
  additionalTargets?: string[];
};

function sanitizeGitArgsForLog(args: string[]): string[] {
  return args.map(arg => {
    const isAbsoluteUnix = arg.startsWith("/");
    const isAbsoluteWindows = /^[a-zA-Z]:\\/.test(arg);
    return isAbsoluteUnix || isAbsoluteWindows ? "<local-path-redacted>" : arg;
  });
}

function sanitizeTextForLog(text: string): string {
  return text
    .replace(/\/Users\/[^\s'"]*/g, "<local-path-redacted>")
    .replace(/\/home\/[^\s'"]*/g, "<local-path-redacted>")
    .replace(/[a-zA-Z]:\\[^\s'"]*/g, "<local-path-redacted>");
}

function runGitCaptured(args: string[], cwd: string, notifications: RunNotifications, repoName: string): string {
  const safeArgs = sanitizeGitArgsForLog(args);
  try {
    const output = execFileSync("git", args, { cwd, encoding: "utf8" });
    addNotification(notifications, "00-scan-repo", "info", "GIT_COMMAND_OK", `git ${safeArgs.join(" ")} succeeded.`, { key: safeArgs.join("_") });
    return output;
  } catch (err: any) {
    const rawStderr = err?.stderr ? String(err.stderr) : err?.message || String(err);
    const stderr = sanitizeTextForLog(rawStderr);
    addNotification(notifications, "00-scan-repo", "fatal", "GIT_COMMAND_FAILED", `git ${safeArgs.join(" ")} failed: ${stderr}`, { key: safeArgs.join("_") }, true);
    throw new Error(`[Fail-Closed] git ${args.join(" ")} failed: ${stderr}`);
  }
}

/** Real, recursive group-parent-chain path resolver -- walks from `uuid` up
 * to `mainGroupKey`, composing each real ancestor's own `path` segment
 * (virtual groups with only a `name`, no `path`, contribute nothing, exactly
 * matching Xcode's own real path-composition rule). Verified directly
 * against on-disk files in the bounded test (doc 14 Finding 3). */
function makeRealPathResolver(nodeInfo: Map<string, { pathSeg: string | null }>, parentOf: Map<string, string>, mainGroupKey: string) {
  return function realPathFromRoot(uuid: string): string {
    const segments: string[] = [];
    let cur: string | undefined = uuid;
    const guard = new Set<string>();
    while (cur && cur !== mainGroupKey) {
      if (guard.has(cur)) throw new Error(`[Fail-Closed] Cycle detected resolving real group path for '${uuid}'.`);
      guard.add(cur);
      const info = nodeInfo.get(cur);
      if (!info) break;
      if (info.pathSeg) segments.unshift(info.pathSeg);
      cur = parentOf.get(cur);
    }
    return segments.join("/");
  };
}

function walkRealSwiftFiles(absDir: string, excludeRelativePaths: Set<string>, relativeSoFar: string = ""): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = relativeSoFar ? `${relativeSoFar}/${entry.name}` : entry.name;
    if (excludeRelativePaths.has(relPath) || excludeRelativePaths.has(entry.name)) continue;
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkRealSwiftFiles(abs, excludeRelativePaths, relPath));
    } else if (entry.isFile() && entry.name.endsWith(".swift")) {
      results.push(abs);
    }
  }
  return results;
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
  const notifications: RunNotifications = { ...provisionalNotifications, runId, updatedAt: now.toISOString() };

  addNotification(notifications, "00-scan-repo", "info", "RUN_INITIALIZED", `Initialized pipeline run [${runId}] for repo [${REPO_NAME}] at commit [${commitSha}].`, { commitSha, ref: resolvedRef });

  const runContext: Record<string, any> = { runId, repoName: REPO_NAME, commitSha, createdAt: now.toISOString() };
  if (hasBranch) runContext.branch = targetRepo.branch;
  if (hasCommit) runContext.commit = targetRepo.commit;

  // --- Real, dynamic .xcodeproj discovery -- NOT hardcoded to
  // "ios-oskey-dev.xcodeproj" (a rename upstream shouldn't break this). ---
  const topLevelEntries = fs.readdirSync(clonePath, { withFileTypes: true });
  const xcodeprojDirs = topLevelEntries.filter(e => e.isDirectory() && e.name.endsWith(".xcodeproj")).map(e => e.name);
  if (xcodeprojDirs.length !== 1) {
    addNotification(notifications, "00-scan-repo", "fatal", "XCODEPROJ_DISCOVERY_FATAL", `Expected exactly one top-level .xcodeproj directory, found ${xcodeprojDirs.length}: ${JSON.stringify(xcodeprojDirs)}.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[Fail-Closed] Expected exactly one .xcodeproj directory, found ${xcodeprojDirs.length}.`);
  }
  const pbxprojPath = path.join(clonePath, xcodeprojDirs[0], "project.pbxproj");
  if (!fs.existsSync(pbxprojPath)) {
    addNotification(notifications, "00-scan-repo", "fatal", "PBXPROJ_MISSING_FATAL", `project.pbxproj not found at '${xcodeprojDirs[0]}/project.pbxproj'.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[Fail-Closed] project.pbxproj not found under '${xcodeprojDirs[0]}'.`);
  }

  const proj = (xcode as any).project(pbxprojPath);
  proj.parseSync();
  const objects = proj.hash.project.objects;

  const groups = objects["PBXGroup"] || {};
  const variantGroups = objects["PBXVariantGroup"] || {};
  const fileRefs = objects["PBXFileReference"] || {};
  const syncRootGroups = objects["PBXFileSystemSynchronizedRootGroup"] || {};
  const exceptionSets = objects["PBXFileSystemSynchronizedBuildFileExceptionSet"] || {};
  const nativeTargets = objects["PBXNativeTarget"] || {};
  const buildFiles = objects["PBXBuildFile"] || {};
  const sourcesPhases = objects["PBXSourcesBuildPhase"] || {};
  const rootObjectKey = proj.hash.project.rootObject;
  const rootProjectObj = objects["PBXProject"][rootObjectKey];
  const mainGroupKey: string = rootProjectObj.mainGroup;

  // Real, dynamic target discovery -- every PBXNativeTarget found, never a
  // hardcoded name list. Confirmed 3 today (doc 14), but this must keep
  // working the moment a 4th target is added on a future merge.
  const targetKeys = Object.keys(nativeTargets).filter(k => !k.endsWith("_comment"));
  if (targetKeys.length === 0) {
    addNotification(notifications, "00-scan-repo", "fatal", "ZERO_TARGETS_FATAL", `Zero PBXNativeTarget entries found in project.pbxproj.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[Fail-Closed] Zero PBXNativeTarget entries found.`);
  }

  const nodeInfo = new Map<string, { pathSeg: string | null }>();
  function registerSection(section: Record<string, any>) {
    for (const key of Object.keys(section)) {
      if (key.endsWith("_comment")) continue;
      const obj = section[key];
      nodeInfo.set(key, { pathSeg: obj.path ? String(obj.path).replace(/^"|"$/g, "") : null });
    }
  }
  registerSection(groups);
  registerSection(variantGroups);
  registerSection(syncRootGroups);
  registerSection(fileRefs);

  const parentOf = new Map<string, string>();
  function registerChildren(section: Record<string, any>) {
    for (const key of Object.keys(section)) {
      if (key.endsWith("_comment")) continue;
      const obj = section[key];
      if (Array.isArray(obj.children)) {
        for (const c of obj.children) parentOf.set(c.value, key);
      }
    }
  }
  registerChildren(groups);
  registerChildren(variantGroups);

  const realPathFromRoot = makeRealPathResolver(nodeInfo, parentOf, mainGroupKey);

  const targetFileSets: Record<string, Set<string>> = {};
  const targetDisplayName: Record<string, string> = {};

  for (const key of targetKeys) {
    const target = nativeTargets[key];
    const targetName = (target.name || "").replace(/^"|"$/g, "") || key;
    targetDisplayName[key] = targetName;
    const fileSet = new Set<string>();

    const sourcesPhaseRef = (target.buildPhases || []).find((bp: any) => {
      const ph = sourcesPhases[bp.value];
      return ph && ph.isa === "PBXSourcesBuildPhase";
    });
    if (sourcesPhaseRef) {
      const phase = sourcesPhases[sourcesPhaseRef.value];
      for (const f of phase.files || []) {
        const bf = buildFiles[f.value];
        if (!bf) continue;
        const fr = fileRefs[bf.fileRef];
        if (!fr) continue;
        const p = fr.path ? String(fr.path).replace(/^"|"$/g, "") : null;
        if (p && p.endsWith(".swift")) {
          fileSet.add(path.join(clonePath, realPathFromRoot(bf.fileRef)));
        }
      }
    }

    for (const g of target.fileSystemSynchronizedGroups || []) {
      const groupObj = syncRootGroups[g.value];
      if (!groupObj) continue;
      const absDir = path.join(clonePath, realPathFromRoot(g.value));
      const excludeRelativePaths = new Set<string>();
      for (const exc of groupObj.exceptions || []) {
        const excSet = exceptionSets[exc.value];
        if (excSet && Array.isArray(excSet.membershipExceptions)) {
          for (const m of excSet.membershipExceptions) excludeRelativePaths.add(String(m).replace(/^"|"$/g, ""));
        }
      }
      if (fs.existsSync(absDir)) {
        walkRealSwiftFiles(absDir, excludeRelativePaths).forEach(f => fileSet.add(f));
      }
    }

    targetFileSets[key] = fileSet;
  }

  // Real cross-target aggregation: path -> set of real target keys it
  // belongs to. Files belonging to zero targets are real, confirmed
  // orphans (doc 14 Finding 5) -- skipped per explicit user decision
  // 2026-09-10, not included even tagged.
  const membership = new Map<string, Set<string>>();
  for (const [targetKey, fileSet] of Object.entries(targetFileSets)) {
    for (const absPath of fileSet) {
      if (!membership.has(absPath)) membership.set(absPath, new Set());
      membership.get(absPath)!.add(targetKey);
    }
  }

  const filesList: FileRecord[] = [];
  let orphanCount = 0;

  for (const [absPath, targetKeySet] of membership.entries()) {
    const memberTargetKeys = Array.from(targetKeySet);
    // Real, dynamic primary-module rule for the rare (2, measured) real
    // multi-target file: the target with the larger total real file count
    // among the ones this file belongs to owns it as `module`; the rest are
    // recorded in `additionalTargets`, not silently dropped.
    memberTargetKeys.sort((a, b) => targetFileSets[b].size - targetFileSets[a].size || targetDisplayName[a].localeCompare(targetDisplayName[b]));
    const primaryKey = memberTargetKeys[0];
    const additionalTargets = memberTargetKeys.slice(1).map(k => targetDisplayName[k]);

    const stat = fs.statSync(absPath);
    const record: FileRecord = {
      repo: REPO_NAME,
      module: targetDisplayName[primaryKey],
      submodule: null,
      path: toRepoPath(absPath, clonePath),
      kindHint: "swift",
      sizeBytes: stat.size,
    };
    if (additionalTargets.length > 0) record.additionalTargets = additionalTargets;
    filesList.push(record);
  }

  // Real orphan count, for traceability -- computed from the whole-repo
  // real file count minus what's in scope, not re-walked separately.
  const allSwiftOnDisk = execFileSync("find", [clonePath, "-name", "*.swift", "-not", "-path", "*/.build/*"], { encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
  orphanCount = allSwiftOnDisk.length - filesList.length;

  filesList.sort((a, b) => a.path.localeCompare(b.path));

  if (filesList.length === 0) {
    addNotification(notifications, "00-scan-repo", "fatal", "ZERO_SOURCE_FILES_FATAL", `Zero Swift source files resolved to any real Xcode target.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_SOURCE_FILES_FATAL] Zero Swift source files resolved to any real Xcode target.`);
  }

  addNotification(
    notifications,
    "00-scan-repo",
    "info",
    "ORPHANED_FILES_SKIPPED",
    `${orphanCount} real .swift file(s) on disk belong to zero real Xcode targets and were skipped per explicit user decision 2026-09-10 (governance/roadmap/ios-oskey-dev/14-task11-pbxproj-structure-bounded-test-2026-09-10.md).`,
    { orphanCount, totalOnDisk: allSwiftOnDisk.length, inScope: filesList.length }
  );

  const moduleEntries = targetKeys.map(k => ({ module: targetDisplayName[k] })).sort((a, b) => a.module.localeCompare(b.module));

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
    modulesCount: moduleEntries.length,
    filesCount: filesList.length,
  };
  writeJsonAtomically(latestManifestPath(projectRoot, REPO_NAME), latestManifest, `output/${REPO_NAME}/latest-repo-manifest.json`);

  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);
  console.log(`Real Xcode targets (modules) found: ${moduleEntries.length} -- ${moduleEntries.map(m => m.module).join(", ")}`);
  console.log(`Swift files in scope: ${filesList.length} (orphaned/skipped: ${orphanCount})`);
  console.log(`Raw facts written to: ${factsDir}`);
  console.log(`Run notifications initialized at: ${notificationsFilePath}`);
}

main();

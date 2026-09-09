// **version:** 1.0.0
// **location:** level-5 phase 0
// © Oskey SAS. All rights reserved.
//
// Script 00: Repository Scanner and Run Authority (Phase 0) -- Kotlin/Android port.
// Establishes immutable run context, clones and checks out exact repository state,
// initializes run notifications, and writes authoritative module and file inventories.
//
// Real, load-bearing differences from the TypeScript repos' own copies of this
// script (angular-app-oskey-io, firebase-oskey-dev, node-iot-api-oskey-io),
// per the real decisions in governance/roadmap/android-intercom-oskey-io/:
//
// - No static `modulesRoot` (single shared directory) -- this repo's 5 modules
//   are physically separate top-level directories. The module list is read
//   dynamically from `settings.gradle.kts`'s own `include(...)` calls at scan
//   time (config.moduleDiscovery, standing principle 2 -- never hardcode a
//   module list). See 01-standing-principles-and-lessons-from-ts-facts-
//   pipeline-2026-09-07.md.
// - Submodule detection inside `app` is a real BFS over the plain Kotlin
//   import graph, seeded from the real screen roots found by walking the
//   actual `NavHost { composable(...) { ... } } ` call structure in whichever
//   file contains it (found structurally via tree-sitter, never a hardcoded
//   filename or screen list) -- the same technique node-iot-api-oskey-io's
//   own 00-scan-repo.ts already established (BFS over an import/reachability
//   graph, reachable-from-1-root -> that root's submodule, reachable-from-0
//   -> _unreferenced, reachable-from-≥2 -> null/shared). See
//   09-task1-decision-tree-sitter-plus-import-aware-resolver-2026-09-08.md.
// - The 4 library modules (kotlin-ble-kit-oskey-io, kotlin-usb-oskey-io,
//   kotlin-webrtc-domain-oskey-io, kotlin-webrtc-data-oskey-io) get
//   submodule=null uniformly -- real file counts (5-17 files each, per
//   00-phase1-ast-extraction-design.md) are well under node-iot's own real
//   single-module precedent (~166-200K tokens, no submodule split needed),
//   so a capability-pack-style submodule split isn't warranted for them.

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import Parser from "tree-sitter";
// @ts-ignore -- tree-sitter-kotlin ships no type declarations.
import Kotlin from "tree-sitter-kotlin";
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
import {
  findNodesOfType,
  findAllCallExpressions,
  calleeNameOf,
  trailingLambdaOf,
  firstCallCalleeInLambda,
  parseKotlinFile as parseKotlinFileShared,
  packageAndImportsOf,
  topLevelDeclarationNamesOf,
  isSealed,
} from "./_shared/kotlin-ast-utils";

const projectRoot = process.cwd();

type FileRecord = {
  repo: string;
  module: string;
  submodule: string | null;
  path: string;
  kindHint: string;
  sizeBytes: number;
};

const parser = new Parser();
parser.setLanguage(Kotlin);

// --- Git helpers (byte-identical in spirit to the TS repos' own copies) ---

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
    return execFileSync("git", args, { cwd, encoding: "utf8" });
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

function parseKotlinFile(absPath: string): { src: string; tree: Parser.Tree } {
  return parseKotlinFileShared(parser, absPath);
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

  if (!targetRepo.moduleDiscovery || targetRepo.moduleDiscovery.method !== "gradleSettingsInclude" || !targetRepo.moduleDiscovery.settingsFile) {
    throw new Error(`[Fail-Closed] Target repository '${REPO_NAME}' is missing a valid 'moduleDiscovery' config block.`);
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

  addNotification(
    notifications,
    "00-scan-repo",
    "info",
    "RUN_INITIALIZED",
    `Initialized pipeline run [${runId}] for repo [${REPO_NAME}] at commit [${commitSha}].`,
    { commitSha, ref: resolvedRef }
  );

  const runContext: Record<string, any> = { runId, repoName: REPO_NAME, commitSha, createdAt: now.toISOString() };
  if (hasBranch) runContext.branch = targetRepo.branch;
  if (hasCommit) runContext.commit = targetRepo.commit;

  // --- Dynamic module discovery, per config.moduleDiscovery ---
  const settingsPath = path.join(clonePath, targetRepo.moduleDiscovery.settingsFile);
  if (!fs.existsSync(settingsPath)) {
    addNotification(notifications, "00-scan-repo", "fatal", "SETTINGS_FILE_MISSING_FATAL", `Configured moduleDiscovery.settingsFile '${targetRepo.moduleDiscovery.settingsFile}' does not exist.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[SETTINGS_FILE_MISSING_FATAL] '${targetRepo.moduleDiscovery.settingsFile}' not found.`);
  }
  const settingsSrc = fs.readFileSync(settingsPath, "utf8");
  // Real, dynamic parse of Gradle's own include(":name") calls -- never a
  // hardcoded array. Matches this repo's real settings.gradle.kts shape
  // (5 top-level, non-nested module paths) confirmed 2026-09-09.
  const modules = Array.from(settingsSrc.matchAll(/include\(\s*":([^":]+)"\s*\)/g))
    .map(m => m[1])
    .sort();

  if (modules.length === 0) {
    addNotification(notifications, "00-scan-repo", "fatal", "ZERO_MODULES_FATAL", `No include(...) declarations found in '${targetRepo.moduleDiscovery.settingsFile}'.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_MODULES_FATAL] No modules discovered from '${targetRepo.moduleDiscovery.settingsFile}'.`);
  }

  for (const m of modules) {
    if (!fs.existsSync(path.join(clonePath, m))) {
      addNotification(notifications, "00-scan-repo", "fatal", "MODULE_DIR_MISSING_FATAL", `Module '${m}' declared in settings.gradle.kts has no corresponding directory.`, { module: m });
      writeNotificationsAtomically(notificationsFilePath, notifications);
      throw new Error(`[MODULE_DIR_MISSING_FATAL] Module '${m}' has no directory at repo root.`);
    }
  }

  const moduleEntries = modules.map(m => ({ module: m }));

  // --- File inventory: walk every module's real .kt sources ---
  const EXCLUDED_DIRS = new Set(["build", ".git", ".gradle", ".idea"]);
  const kotlinFilesByModule = new Map<string, string[]>(); // module -> absolute paths

  function walkModule(dir: string, moduleName: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walkModule(fullPath, moduleName);
      } else if (entry.isFile() && entry.name.endsWith(".kt")) {
        const list = kotlinFilesByModule.get(moduleName) || [];
        list.push(fullPath);
        kotlinFilesByModule.set(moduleName, list);
      }
    }
  }
  for (const m of modules) {
    walkModule(path.join(clonePath, m), m);
  }

  // --- Submodule detection inside `app` only (see header comment for why) ---
  const appFiles = kotlinFilesByModule.get("app") || [];
  const submoduleByAppFile = new Map<string, string | null>();

  {
    // 1. Find the NavHost call structurally (no hardcoded filename), and the
    //    real screen roots it wires up -- each composable(...)'s route
    //    receiver object (e.g. `Screen.Home` from `Screen.Home.route`) and
    //    the composable function it actually renders.
    let navHostFile: string | null = null;
    let navHostCall: Parser.SyntaxNode | null = null;
    const parsedByFile = new Map<string, { src: string; tree: Parser.Tree }>();

    for (const f of appFiles) {
      const parsed = parseKotlinFile(f);
      parsedByFile.set(f, parsed);
      if (navHostCall) continue;
      const calls = findAllCallExpressions(parsed.tree.rootNode);
      const match = calls.find(c => calleeNameOf(c) === "NavHost");
      if (match) {
        navHostFile = f;
        navHostCall = match;
      }
    }

    if (!navHostFile || !navHostCall) {
      addNotification(notifications, "00-scan-repo", "warning", "NAVHOST_NOT_FOUND", `No 'NavHost' call found in module 'app' -- submodule detection skipped, every app file gets submodule=null.`, {}, true);
      for (const f of appFiles) submoduleByAppFile.set(f, null);
    } else {
      submoduleByAppFile.set(navHostFile, null); // the orchestrator itself is shared/core, not a leaf

      const lambda = trailingLambdaOf(navHostCall);
      const composableCalls = lambda ? findAllCallExpressions(lambda).filter(c => calleeNameOf(c) === "composable") : [];

      type ScreenRoot = { screenName: string; composableFnName: string };
      const roots: ScreenRoot[] = [];
      for (const c of composableCalls) {
        const routeArg = findNodesOfType(c, "navigation_expression")[0];
        // routeArg text looks like `Screen.Home.route` -- the screen's own
        // real name is the middle segment, read from the source text
        // directly rather than assuming a fixed depth, since a real
        // navigation_expression is left-nested (Screen.Home).route.
        const routeText = routeArg?.text ?? "";
        const parts = routeText.split(".");
        const screenName = parts.length >= 2 ? parts[parts.length - 2] : null;
        const innerLambda = trailingLambdaOf(c);
        const fnName = innerLambda ? firstCallCalleeInLambda(innerLambda) : null;
        if (screenName && fnName) roots.push({ screenName, composableFnName: fnName });
      }

      if (roots.length === 0) {
        addNotification(notifications, "00-scan-repo", "warning", "NO_SCREEN_ROOTS_FOUND", `NavHost was found but no composable(...) screen roots could be extracted -- every app file gets submodule=null.`, {}, true);
        for (const f of appFiles) submoduleByAppFile.set(f, null);
      } else {
        // 2. Find which real file declares each root's composable function,
        //    and mark the file the Screen sealed class itself lives in
        //    (found structurally: whichever file's class_declaration has a
        //    'sealed' class_modifier) as shared/core too.
        const fileDeclaringFn = new Map<string, string>(); // fnName -> file
        let screenClassFile: string | null = null;
        for (const f of appFiles) {
          const { tree } = parsedByFile.get(f) ?? parseKotlinFile(f);
          for (const fn of findNodesOfType(tree.rootNode, "function_declaration")) {
            const name = fn.namedChildren.find(c => c.type === "simple_identifier")?.text;
            if (name) fileDeclaringFn.set(name, f);
          }
          if (!screenClassFile) {
            for (const cls of findNodesOfType(tree.rootNode, "class_declaration")) {
              if (isSealed(cls)) {
                screenClassFile = f;
                break;
              }
            }
          }
          // Real, found gap 2026-09-09: Hilt @Module files (di/OSKAppModule.kt
          // etc.) and the Application subclass are activated by annotation
          // processing/the Android manifest, never by an explicit code
          // reference from any screen -- a pure reachability BFS from screen
          // roots will always mark them _unreferenced even though they are
          // real, load-bearing shared infrastructure, the same structural
          // category as NavHost/Screen. Detected structurally (an @Module
          // annotation, or a class extending Application), never a hardcoded
          // filename list.
          const hasModuleAnnotation = findNodesOfType(tree.rootNode, "annotation").some(a => a.text.includes("@Module"));
          const extendsApplication = findNodesOfType(tree.rootNode, "class_declaration").some(cls =>
            findNodesOfType(cls, "delegation_specifier").some(d => d.text.startsWith("Application"))
          );
          if (hasModuleAnnotation || extendsApplication) submoduleByAppFile.set(f, null);
        }
        if (screenClassFile) submoduleByAppFile.set(screenClassFile, null);

        // 3. Build the plain, syntax-only import graph: (package, declName)
        //    -> file, then file -> file edges from each file's own real
        //    import statements. No type resolution -- per the real decision
        //    in 09-task1-decision-...md, this is pure syntax, matching what
        //    node-iot's own equivalent BFS already does for TypeScript.
        const declLocation = new Map<string, string>(); // "pkg.Name" -> file
        const fileMeta = new Map<string, { pkg: string | null; imports: string[] }>();
        for (const f of appFiles) {
          const { tree } = parsedByFile.get(f) ?? parseKotlinFile(f);
          const meta = packageAndImportsOf(tree);
          fileMeta.set(f, meta);
          if (meta.pkg) {
            for (const name of topLevelDeclarationNamesOf(tree)) {
              declLocation.set(`${meta.pkg}.${name}`, f);
            }
          }
        }
        // Real, found gap 2026-09-09: Kotlin does not require an import for
        // a same-package reference (unlike TypeScript, where node-iot's own
        // BFS could rely on imports alone). Verified directly: OSKTestBench
        // FactoryScreen.kt and OSKTestBenchFactoryViewModel.kt share the
        // package `io.oskey.intercom.ui.screens.benchmark.factory` with zero
        // explicit import of the ViewModel anywhere -- a pure import-based
        // graph marked the real, live ViewModel file `_unreferenced`.
        //
        // Two same-package graph-edge fixes were tried and REVERTED after
        // re-running and checking the real output (not trusted on theory):
        // blanket same-package edges bridged unrelated screens transitively
        // through broad shared packages (`model`: 12 files, `utils`: 8) and
        // collapsed 89/91 files to `null`; restricting the edge to a
        // whole-word textual reference, and then further to small packages
        // only (≤4 files), still cascaded through longer chains of small
        // packages and collapsed 75-80/91 files with zero screen-specific
        // submodules surviving either time. Making same-package connections
        // part of the general BFS edge set is fundamentally the wrong
        // shape for this codebase -- any transitive edge a shared utility
        // file can carry eventually bridges unrelated screens, no matter
        // how the edge itself is qualified.
        //
        // Real fix: handle this as a narrow, NON-transitive, targeted
        // attribution instead of a graph edge -- see the ViewModel-sibling
        // pinning pass after the BFS below, which assigns a root's own
        // same-package ViewModel directly, without ever letting it become
        // a hop something else can chain through.
        const filesByPackage = new Map<string, string[]>();
        for (const f of appFiles) {
          const pkg = fileMeta.get(f)?.pkg;
          if (!pkg) continue;
          const list = filesByPackage.get(pkg) || [];
          list.push(f);
          filesByPackage.set(pkg, list);
        }

        const edges = new Map<string, Set<string>>(); // file -> set of files it imports
        for (const f of appFiles) {
          const meta = fileMeta.get(f)!;
          const targets = new Set<string>();
          for (const imp of meta.imports) {
            const target = declLocation.get(imp);
            if (target && target !== f) targets.add(target);
          }
          edges.set(f, targets);
        }

        // Narrow, targeted same-package edge -- ONLY from a screen root's
        // own file to its own same-package `*ViewModel` sibling, added as a
        // REAL graph edge (not a post-hoc leaf assignment) so the BFS below
        // continues exploring the ViewModel's own further imports (its
        // real UseCase/Repository dependencies) instead of treating it as
        // a dead end. Real, found gap 2026-09-09: a first version of this
        // fix pinned the ViewModel directly AFTER the BFS had already run,
        // which left OSKResidentViewModel.kt correctly attributed to
        // "Users" but its own real dependencies (OSKGetResidentsUseCase.kt,
        // OSKResidentsRepository.kt) still `_unreferenced`, since nothing
        // continued the walk from that newly-added leaf. Scoped to exactly
        // the 11 real root files, not a general rule -- avoids the
        // cascading regression the two earlier general same-package edge
        // attempts caused (see the comment above `edges`).
        for (const root of roots) {
          const rootFile = fileDeclaringFn.get(root.composableFnName);
          if (!rootFile) continue;
          const pkg = fileMeta.get(rootFile)?.pkg;
          if (!pkg) continue;
          for (const sibling of filesByPackage.get(pkg) || []) {
            if (sibling === rootFile) continue;
            const { tree } = parsedByFile.get(sibling) ?? parseKotlinFile(sibling);
            const isViewModel = topLevelDeclarationNamesOf(tree).some(name => name.endsWith("ViewModel"));
            if (isViewModel) edges.get(rootFile)?.add(sibling);
          }
        }

        // 4. BFS from each screen root's declaring file, over the import
        //    graph above. Reachable-from-1 -> that root's submodule name;
        //    reachable-from-0 -> _unreferenced; reachable-from-≥2 -> null
        //    (shared/core) -- the exact rule node-iot-api-oskey-io's own
        //    00-scan-repo.ts already established for this project.
        const reachabilityCount = new Map<string, number>();
        const reachedByRoot = new Map<string, string>(); // file -> the single root that reached it, if exactly one so far
        for (const root of roots) {
          const startFile = fileDeclaringFn.get(root.composableFnName);
          if (!startFile) continue;
          const visited = new Set<string>([startFile]);
          const queue = [startFile];
          while (queue.length > 0) {
            const cur = queue.shift()!;
            const outgoing = edges.get(cur) || new Set();
            for (const next of outgoing) {
              if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
              }
            }
          }
          for (const f of visited) {
            reachabilityCount.set(f, (reachabilityCount.get(f) || 0) + 1);
            if (!reachedByRoot.has(f)) reachedByRoot.set(f, root.screenName);
            else if (reachedByRoot.get(f) !== root.screenName) reachedByRoot.set(f, "__multi__");
          }
        }

        for (const f of appFiles) {
          if (submoduleByAppFile.has(f)) continue; // NavHost / Screen files already pinned to null above
          const count = reachabilityCount.get(f) || 0;
          if (count === 0) submoduleByAppFile.set(f, "_unreferenced");
          else if (count === 1) submoduleByAppFile.set(f, reachedByRoot.get(f) || null);
          else submoduleByAppFile.set(f, null);
        }

        addNotification(
          notifications,
          "00-scan-repo",
          "info",
          "SCREEN_ROOTS_DISCOVERED",
          `Discovered ${roots.length} real screen root(s) from NavHost's composable(...) calls: ${roots.map(r => r.screenName).join(", ")}.`,
          { count: roots.length }
        );
      }
    }
  }

  // --- Assemble the final file inventory ---
  const filesList: FileRecord[] = [];
  for (const m of modules) {
    const files = kotlinFilesByModule.get(m) || [];
    for (const f of files) {
      const stat = fs.statSync(f);
      const submodule = m === "app" ? submoduleByAppFile.get(f) ?? null : null;
      filesList.push({
        repo: REPO_NAME,
        module: m,
        submodule,
        path: toRepoPath(f, clonePath),
        kindHint: "kotlin",
        sizeBytes: stat.size,
      });
    }
  }
  filesList.sort((a, b) => a.path.localeCompare(b.path));

  if (filesList.length === 0) {
    addNotification(notifications, "00-scan-repo", "fatal", "ZERO_SOURCE_FILES_FATAL", `Zero Kotlin source files found across the discovered modules.`);
    writeNotificationsAtomically(notificationsFilePath, notifications);
    throw new Error(`[ZERO_SOURCE_FILES_FATAL] Zero Kotlin source files found.`);
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

  const submoduleCounts = new Map<string, number>();
  for (const f of filesList) {
    const key = f.submodule ?? "(null/shared)";
    submoduleCounts.set(key, (submoduleCounts.get(key) || 0) + 1);
  }

  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);
  console.log(`Modules found: ${modules.length} (${modules.join(", ")})`);
  console.log(`Kotlin files found: ${filesList.length}`);
  console.log(`app/ submodule breakdown:`, Object.fromEntries(submoduleCounts));
  console.log(`Raw facts written to: ${factsDir}`);
  console.log(`Run notifications initialized at: ${notificationsFilePath}`);
}

main();

// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 03): Full Phase 2 Run Orchestrator.
// Per-module synthesis defaults to the module-level architecture (01e, one
// LLM call per module) as of the production cutover documented in
// governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-
// plan.md (Part A, all 7 steps verified complete 2026-08-30: real ~68%
// token reduction and ~10-15x wall-clock speedup over the old per-capability
// fan-out+reduce chain, measured across all 12 Firebase modules). The old
// chain (01a-generate-capability-syntheses.ts + 01c-generate-assembly-first-
// profile.ts) is kept as a deliberate per-module fallback, not deleted: 01e
// has a loud-failure size check (MODULE_TOO_LARGE_FOR_SINGLE_CALL) for any
// module whose estimated prompt size exceeds a safety threshold, since
// batching an oversized module's capabilities across multiple calls is an
// explicitly deferred design, not something this script silently attempts.
// When 01e fails with that specific notification code for a module (checked
// via that module's run-notifications.json entry, by code+module+timestamp
// -- not by exit code alone, since exit code doesn't distinguish this case
// from any other failure), this script falls back to running 01a then 01c
// for that module only, then continues. Any other 01e failure is fail-fast,
// same as every other stage.
//
// Phase 1 doesn't need this per-module looping: every Phase 1 script (00-07)
// processes the whole repo in one invocation, so a flat `&&`-chained npm
// script (see package.json's own "pipeline:firebase") is enough. Phase 2's
// per-module scripts each take a MODULE_NAME and must be invoked once per
// module -- and the module list isn't fixed at author time (it comes from
// this run's own facts/modules.json, verified dynamic behavior confirmed by
// 01a/01c/01e's own module-list validation), so a static npm-script chain
// can't express it without hardcoding a list that silently goes stale the
// moment a module is added, renamed, or removed. This script reads the live
// module list and loops.
//
// Runs, in order, and stops on the first non-fallback-eligible failure
// (matching the fail-fast behavior of a `&&`-chained npm script, not a
// "continue past errors and report a summary" design) -- for a genuinely
// expensive multi-call operation, continuing past a real failure would risk
// assembling a repo report on top of an incomplete or broken module set:
//   1. 01e-generate-module-level-profile.ts, once per module (falls back to
//      01a then 01c for that module only on MODULE_TOO_LARGE_FOR_SINGLE_CALL).
//   2. 02-generate-repo-report.ts, once, repo-wide.
//
// Each stage is spawned as a real child process (matching this codebase's
// existing execFileSync convention, e.g. 00-scan-repo.ts's own `git`
// invocations), not called as an imported function -- 01a/01c/01e/02 are
// each standalone executables whose `main()` runs immediately on module load
// and isn't exported, so importing them would risk running main() at the
// wrong time or invoking it more than once. Spawning is also what already
// lets a single module's failure produce a clear, isolated stack trace
// instead of multiple scripts' worth of module-scoped state colliding in one
// process.
//
// Deliberately thin: no new synthesis logic lives here, only sequencing and
// the fallback-detection check described above. Every real decision
// (contracts, section numbering, RBAC handling) already lives in
// 01a/01c/01e/02 and their contracts -- this script's job is to call them in
// the right order, for the right modules, route around the one known
// deferred limitation, and stop cleanly if something else fails.
//
// Identical logic to angular-app-oskey-io's own copy of this script --
// fully generic (parameterized entirely by REPO_NAME/LLM_CONFIG_KEY), kept
// duplicated per repo rather than shared, matching this codebase's existing
// convention for every other Phase 1/2 script (see _shared/run-utils.ts's
// own documented scope note).

import "dotenv/config";

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { runContextPath } from "../phase-01-ast-extraction/_shared/run-utils";

const projectRoot = process.cwd();
const phase2Dir = __dirname;

function runStage(scriptRelName: string, extraEnv: Record<string, string>, label: string): void {
  const scriptPath = path.join(phase2Dir, scriptRelName);
  console.log(`\n=== ${label} ===`);
  execFileSync("node", ["-r", "ts-node/register", scriptPath], {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
  });
}

// Distinguishes a 01e MODULE_TOO_LARGE_FOR_SINGLE_CALL failure (fallback-
// eligible) from any other 01e failure (fail-fast), by reading the run's own
// run-notifications.json rather than trusting exit code alone. Matches on
// code+module AND requires the entry's updatedAt to be at or after this
// attempt's start time -- addNotification upserts by deterministic ID, so a
// stale entry from an earlier, unrelated failed run could otherwise sit at
// the same ID and be mistaken for a fresh recurrence (real false alarm hit
// during this session's own testing, see governance/roadmap/firebase-oskey-
// dev/10-module-level-production-cutover-plan.md).
function isModuleTooLargeFailure(repoOutputDir: string, runId: string, repoName: string, moduleName: string, attemptStartedAt: Date): boolean {
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  if (!fs.existsSync(notificationsPath)) return false;
  let notifs: { runId?: string; repoName?: string; entries?: Array<{ code: string; details?: Record<string, unknown>; updatedAt: string }> };
  try {
    notifs = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  } catch {
    return false;
  }
  if (notifs.runId !== runId || notifs.repoName !== repoName) return false;
  return (notifs.entries || []).some(
    e =>
      e.code === "MODULE_TOO_LARGE_FOR_SINGLE_CALL" &&
      e.details?.module === moduleName &&
      new Date(e.updatedAt).getTime() >= attemptStartedAt.getTime()
  );
}

function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const LLM_CONFIG_KEY = process.env.LLM_CONFIG_KEY;

  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  if (!LLM_CONFIG_KEY) throw new Error("[Fail-Closed] LLM_CONFIG_KEY environment variable is required and was not set.");

  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Run the Phase 1 pipeline first.`);
  }
  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    throw new Error(`[Fail-Closed] Could not find ${modulesJsonPath}. Run the Phase 1 pipeline first.`);
  }
  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const moduleNames = modulesList.map(m => m.module).sort();
  if (moduleNames.length === 0) {
    throw new Error(`[Fail-Closed] No modules found in ${modulesJsonPath}.`);
  }

  console.log(`Full Phase 2 run for '${REPO_NAME}' (runId ${runId}), llmConfigKey '${LLM_CONFIG_KEY}'.`);
  console.log(`Modules (${moduleNames.length}): ${moduleNames.join(", ")}`);

  const baseEnv = { REPO_NAME, LLM_CONFIG_KEY };

  for (const moduleName of moduleNames) {
    const attemptStartedAt = new Date();
    try {
      runStage("01e-generate-module-level-profile.ts", { ...baseEnv, MODULE_NAME: moduleName }, `01e: module-level profile -- module '${moduleName}'`);
    } catch (err) {
      if (!isModuleTooLargeFailure(repoOutputDir, runId, REPO_NAME, moduleName, attemptStartedAt)) {
        throw err;
      }
      console.log(
        `\n'${moduleName}' exceeded 01e's single-call size threshold (MODULE_TOO_LARGE_FOR_SINGLE_CALL) -- falling back to 01a+01c for this module only ` +
          `(deferred capability-batching design, governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-plan.md Part A Step 2).`
      );
      runStage("01a-generate-capability-syntheses.ts", { ...baseEnv, MODULE_NAME: moduleName }, `01a: capability syntheses -- module '${moduleName}'`);
      runStage("01c-generate-assembly-first-profile.ts", { ...baseEnv, MODULE_NAME: moduleName }, `01c: module profile + API reference -- module '${moduleName}'`);
    }
  }

  runStage("02-generate-repo-report.ts", baseEnv, `02: repo-wide engineering report`);

  console.log(`\nFull Phase 2 run completed for '${REPO_NAME}' -- ${moduleNames.length} module(s) + 1 repo-wide report.`);
}

main();

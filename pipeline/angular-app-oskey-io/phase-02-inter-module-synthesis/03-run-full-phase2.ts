// **version:** 1.0.0
// **location:** level-5 phase 2
// © Oskey SAS. All rights reserved.
//
// Script (Phase 2 / 03): Full Phase 2 Run Orchestrator.
// The piece that was missing after 2026-08-29's first real Phase 2 run for
// this repo -- that run was done by hand, one manual command per module
// (01a) plus one per module (01c) plus one repo-wide call (02), because no
// single script chained them. Phase 1 doesn't need this: every Phase 1
// script (00-07) processes the whole repo in one invocation, so a flat
// `&&`-chained npm script (see package.json's own "pipeline:angular") is
// enough. Phase 2 is different -- 01a and 01c each take a MODULE_NAME and
// must be invoked once per module -- and the module list isn't fixed at
// author time (it comes from this run's own facts/modules.json, verified
// dynamic behavior confirmed by 01a/01c's own module-list validation), so a
// static npm-script chain can't express it without hardcoding a list that
// silently goes stale the moment a new module (or a second app, e.g.
// `web-admin`) is added. This script reads the live module list and loops.
//
// Runs, in order, and stops on the first failure (matching the fail-fast
// behavior of a `&&`-chained npm script, not a "continue past errors and
// report a summary" design) -- for a genuinely expensive multi-call
// operation, continuing past a real failure would risk assembling a repo
// report on top of an incomplete or broken module set:
//   1. 01a-generate-capability-syntheses.ts, once per module (each call
//      already loops over every capability pack in that module internally).
//   2. 01c-generate-assembly-first-profile.ts, once per module.
//   3. 02-generate-repo-report.ts, once, repo-wide.
//
// Each stage is spawned as a real child process (matching this codebase's
// existing execFileSync convention, e.g. 00-scan-repo.ts's own `git`
// invocations), not called as an imported function -- 01a/01c/02 are each
// standalone executables whose `main()` runs immediately on module load and
// isn't exported, so importing them would risk running main() at the wrong
// time or invoking it more than once. Spawning is also what already lets a
// single module's failure produce a clear, isolated stack trace instead of
// three scripts' worth of module-scoped state colliding in one process.
//
// Deliberately thin: no new synthesis logic lives here, only sequencing.
// Every real decision (contracts, section numbering, RBAC handling) already
// lives in 01a/01c/02 and their contracts -- this script's only job is to
// call them in the right order, for the right modules, and stop cleanly if
// one of them fails.

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

  const modulesJsonPath = path.join(projectRoot, "output", "runs", REPO_NAME, runId, "facts", "modules.json");
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
    runStage("01a-generate-capability-syntheses.ts", { ...baseEnv, MODULE_NAME: moduleName }, `01a: capability syntheses -- module '${moduleName}'`);
  }

  for (const moduleName of moduleNames) {
    runStage("01c-generate-assembly-first-profile.ts", { ...baseEnv, MODULE_NAME: moduleName }, `01c: module profile + API reference -- module '${moduleName}'`);
  }

  runStage("02-generate-repo-report.ts", baseEnv, `02: repo-wide engineering report`);

  console.log(`\nFull Phase 2 run completed for '${REPO_NAME}' -- ${moduleNames.length} module(s) + 1 repo-wide report.`);
}

main();

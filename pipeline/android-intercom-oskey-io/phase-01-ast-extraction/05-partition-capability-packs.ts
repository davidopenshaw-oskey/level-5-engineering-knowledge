// **version:** 1.0.0
// **location:** level-5 phase 1.75 -- Kotlin/Android port

// © Oskey SAS. All rights reserved.
// Script 05: Capability Pack Partitioner (Phase 1.75) -- Kotlin/Android port.
// Byte-identical in structure to the TS pipelines' own copy of this script --
// confirmed real 2026-09-09: this script's own logic is fully generic (only
// reads fact.module/fact.submodule, both of which mean the same thing for
// this repo as for any TS repo), so no repo-specific redesign was needed,
// unlike 02/04's own real redesigns. For this repo's own real submodule
// shape: only `app` has real named submodules (its 11 screens, e.g. Home,
// Digicode, CallRTC -- see Task 3's own scan-repo output); the 4 library
// modules get exactly one `_module_root` pack each, since Task 3 already
// decided uniform submodule=null for those (real file counts too small to
// warrant partitioning, see 02-p1-build-tasklist.md Task 3's own note).

import fs from "fs";
import path from "path";
import {
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "05-partition-capability-packs";

// Facts with no submodule live at the module's own root (shared/foundational
// code) -- not a real submodule name, so it can't collide with one.
const MODULE_ROOT_PACK_NAME = "_module_root";

function main() {
  const REPO_NAME = process.env.REPO_NAME;
  if (!REPO_NAME) {
    throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  }

  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Please run \`00-scan-repo\` first.`);
  }

  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const rawDir = path.join(repoOutputDir, "facts");
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  const summary: Record<string, Record<string, number>> = {};

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modGraphPath)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULE_GRAPH_FATAL", `Missing evidence graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Missing evidence graph for module '${moduleName}'.`);
    }

    let modGraph: any;
    try {
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_MODULE_GRAPH_FATAL", `Malformed evidence graph JSON for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Malformed evidence graph for module '${moduleName}'.`);
    }

    if (modGraph.runId !== runId || modGraph.repoName !== REPO_NAME || modGraph.module !== moduleName || !Array.isArray(modGraph.facts)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MODULE_GRAPH_IDENTITY_MISMATCH_FATAL", `Identity mismatch in evidence graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Identity mismatch for module '${moduleName}'.`);
    }

    const packs = new Map<string, any[]>();
    for (const fact of modGraph.facts) {
      const packName: string = fact.submodule || MODULE_ROOT_PACK_NAME;
      const list = packs.get(packName) || [];
      list.push(fact);
      packs.set(packName, list);
    }

    const packsDir = path.join(modDir, "capability-packs");
    fs.mkdirSync(packsDir, { recursive: true });

    const moduleSummary: Record<string, number> = {};
    for (const [packName, facts] of Array.from(packs.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const packPayload = {
        schemaVersion: "1.0.0",
        runId,
        repoName: REPO_NAME,
        module: moduleName,
        submodule: packName,
        generatedAt: new Date().toISOString(),
        summary: { factCount: facts.length },
        facts,
      };

      const packPath = path.join(packsDir, `${packName}.json`);
      writeJsonAtomically(packPath, packPayload, `knowledge-pipeline/modules/${moduleName}/capability-packs/${packName}.json`);
      moduleSummary[packName] = facts.length;
    }

    summary[moduleName] = moduleSummary;
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "CAPABILITY_PACKS_COMPLETED",
    `Capability pack partitioning completed for ${authoritativeModules.length} module(s).`,
    { moduleCount: authoritativeModules.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Capability packs written.");
  console.log(summary);
}

main();

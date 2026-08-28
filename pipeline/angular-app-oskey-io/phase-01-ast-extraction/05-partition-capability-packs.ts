// **version:** 1.0.0
// **location:** level-5 phase 1.75

// © Oskey SAS. All rights reserved.
// Script 05: Capability Pack Partitioner (Phase 1.75).
// Deterministically splits each module's evidence graph into per-submodule
// "capability packs" -- a free, already-computed partition key (submodule,
// derived from real folder structure in 00-scan-repo.ts) that keeps a
// module's full evidence graph from ever needing to be a single LLM prompt.
// See governance/roadmap/00-capability-based-module-synthesis.md for the
// design this supports.

import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();

// Facts with no submodule live at the module's own root (shared/foundational
// code, e.g. the module's top-level controller/service/document model) --
// not a real submodule name, so it can't collide with one.
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
  const notifications: RunNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const rawDir = path.join(repoOutputDir, "facts");
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, "05-partition-capability-packs", "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
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
      addNotification(notifications, "05-partition-capability-packs", "fatal", "MISSING_MODULE_GRAPH_FATAL", `Missing evidence graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Missing evidence graph for module '${moduleName}'.`);
    }

    let modGraph: any;
    try {
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, "05-partition-capability-packs", "fatal", "MALFORMED_MODULE_GRAPH_FATAL", `Malformed evidence graph JSON for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Malformed evidence graph for module '${moduleName}'.`);
    }

    if (modGraph.runId !== runId || modGraph.repoName !== REPO_NAME || modGraph.module !== moduleName || !Array.isArray(modGraph.facts)) {
      addNotification(notifications, "05-partition-capability-packs", "fatal", "MODULE_GRAPH_IDENTITY_MISMATCH_FATAL", `Identity mismatch in evidence graph for module '${moduleName}'.`, { module: moduleName });
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
    "05-partition-capability-packs",
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

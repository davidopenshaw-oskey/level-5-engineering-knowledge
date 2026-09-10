// **version:** 1.0.0
// **location:** level-5 phase 1.75 -- Swift
// © Oskey SAS. All rights reserved.
//
// Script 06: Cross-Module Dependency Graph Builder (Phase 1.75) -- Swift.
// Byte-identical in structure to the TS/Kotlin pipelines' own copies -- this
// script only reads generic imports_dependency fields
// (resolvedTargetModule/resolvedTargetSubmodule/importResolutionStatus/
// value). No repo-specific redesign needed here, unlike 02/04.
//
// REAL, HONEST, EXPECTED RESULT TODAY, not a bug: every repo in this family
// will produce EMPTY outbound/inbound arrays from this script right now.
// 02-build-module-evidence.ts's own imports_dependency facts always carry
// importResolutionStatus: "not_yet_implemented" (see that file's own header
// comment) -- Swift's per-import cross-target resolution was never built,
// the same real, deferred limitation as resolved_via_import for calls (see
// 01-extract-ast-evidence.ts's own header). This script is correct and
// ready to surface real cross-module edges the moment that resolution
// exists (Task 11) -- it needs no changes itself when that day comes, only
// real data flowing into the field it already reads.

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
const SOURCE_SCRIPT = "06-build-cross-module-dependency-graph";

const MAX_SAMPLE_TOUCHPOINTS_PER_RELATIONSHIP = 3;

function summarizeTouchpoints(touchpoints: Touchpoint[]): { touchpoints: Touchpoint[]; touchpointCount?: number } {
  const sample = touchpoints.slice(0, MAX_SAMPLE_TOUCHPOINTS_PER_RELATIONSHIP);
  if (touchpoints.length > sample.length) {
    return { touchpoints: sample, touchpointCount: touchpoints.length };
  }
  return { touchpoints: sample };
}

interface Touchpoint {
  file: string;
  line: number;
  importPath: string;
}

interface ImportsDependencyFact {
  type: string;
  module: string;
  resolvedTargetModule: string | null;
  resolvedTargetSubmodule: string | null;
  importResolutionStatus: string;
  file: string;
  line: number;
  value: string;
}

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

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();
  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");

  const crossModuleFacts: ImportsDependencyFact[] = [];

  for (const moduleName of authoritativeModules) {
    const modGraphPath = path.join(modulesBaseDir, moduleName, `${moduleName}-evidence-graph.json`);
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

    for (const fact of modGraph.facts as ImportsDependencyFact[]) {
      if (
        fact.type === "imports_dependency" &&
        fact.importResolutionStatus === "resolved_in_repo" &&
        fact.resolvedTargetModule &&
        fact.resolvedTargetModule !== moduleName
      ) {
        crossModuleFacts.push(fact);
      }
    }
  }

  const outboundByModule = new Map<string, Map<string, Touchpoint[]>>();
  const inboundByModule = new Map<string, Map<string, Touchpoint[]>>();

  for (const fact of crossModuleFacts) {
    const sourceModule = fact.module;
    const targetModule = fact.resolvedTargetModule!;
    const touchpoint: Touchpoint = { file: fact.file, line: fact.line, importPath: fact.value };

    if (!outboundByModule.has(sourceModule)) outboundByModule.set(sourceModule, new Map());
    const outboundTargets = outboundByModule.get(sourceModule)!;
    if (!outboundTargets.has(targetModule)) outboundTargets.set(targetModule, []);
    outboundTargets.get(targetModule)!.push(touchpoint);

    if (!inboundByModule.has(targetModule)) inboundByModule.set(targetModule, new Map());
    const inboundSources = inboundByModule.get(targetModule)!;
    if (!inboundSources.has(sourceModule)) inboundSources.set(sourceModule, []);
    inboundSources.get(sourceModule)!.push(touchpoint);
  }

  const summary: Record<string, { outboundModuleCount: number; inboundModuleCount: number }> = {};

  for (const moduleName of authoritativeModules) {
    const outboundTargets = outboundByModule.get(moduleName) || new Map();
    const inboundSources = inboundByModule.get(moduleName) || new Map();

    const outbound = Array.from(outboundTargets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([targetModule, touchpoints]) => ({ targetModule, ...summarizeTouchpoints(touchpoints) }));

    const inbound = Array.from(inboundSources.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sourceModule, touchpoints]) => ({ sourceModule, ...summarizeTouchpoints(touchpoints) }));

    const payload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary: { outboundModuleCount: outbound.length, inboundModuleCount: inbound.length },
      outbound,
      inbound,
    };

    const outPath = path.join(modulesBaseDir, moduleName, "cross-module-dependencies.json");
    writeJsonAtomically(outPath, payload, `knowledge-pipeline/modules/${moduleName}/cross-module-dependencies.json`);
    summary[moduleName] = { outboundModuleCount: outbound.length, inboundModuleCount: inbound.length };
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "CROSS_MODULE_DEPENDENCY_GRAPH_COMPLETED",
    `Cross-module dependency graph built for ${authoritativeModules.length} module(s), ${crossModuleFacts.length} resolved cross-module import(s).`,
    { moduleCount: authoritativeModules.length, resolvedImportCount: crossModuleFacts.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Cross-module dependency graph written.");
  console.log(summary);
}

main();

// **version:** 1.0.0
// **location:** level-5 phase 1.75

// © Oskey SAS. All rights reserved.
// Script 07: Intra-Module (Cross-Submodule) Coupling Graph Builder (Phase 1.75).
// Same technique as 06-build-cross-module-dependency-graph.ts, scoped one
// level down: submodule-to-submodule coupling WITHIN one module, instead of
// module-to-module coupling across the repo. Replaces the reduce step's
// current narrative reconciliation of capability outputs' own import lists
// (see contracts/01-module-synthesis-reduce.md's "Reconciliation" section)
// with a deterministic artifact -- Tier 1 per governance/adrs/adr-004.md
// and governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3.
//
// Facts with no submodule (module-root files) are bucketed as
// "_module_root", matching 05-partition-capability-packs.ts's own
// convention -- module root importing from (or being imported by) a real
// submodule is genuine coupling worth capturing, not a name collision risk
// since "_module_root" can't match a real submodule name.

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
const SOURCE_SCRIPT = "07-build-intra-module-coupling-graph";
const MODULE_ROOT_BUCKET = "_module_root";

interface Touchpoint {
  file: string;
  line: number;
  importPath: string;
  namedImports: string[];
}

// governance/roadmap/03-token-economics-remediation-plan.md Stage 1: same fix
// as 06-build-cross-module-dependency-graph.ts's summarizeTouchpoints -- the
// full per-import touchpoint list is a large, avoidable share of this
// artifact's size, and its only consumer (the P2 reduce step's prompt) only
// needs "this coupling exists, report it as Confirmed," not every import
// line. See that file's comment for the full reasoning.
const MAX_SAMPLE_TOUCHPOINTS_PER_RELATIONSHIP = 3;

// Field name stays `touchpoints` in both cases -- only add `touchpointCount`
// when truncation actually happened. Verified against real data 2026-08-03:
// without this, relationships that already had few touchpoints (the common
// case here) grew slightly from the added count field with nothing removed
// to offset it. This keeps the untruncated case byte-for-byte identical to
// before this fix.
function summarizeTouchpoints(touchpoints: Touchpoint[]): { touchpoints: Touchpoint[]; touchpointCount?: number } {
  const sample = touchpoints.slice(0, MAX_SAMPLE_TOUCHPOINTS_PER_RELATIONSHIP);
  if (touchpoints.length > sample.length) {
    return { touchpoints: sample, touchpointCount: touchpoints.length };
  }
  return { touchpoints: sample };
}

interface ImportsDependencyFact {
  type: string;
  module: string;
  submodule: string | null;
  resolvedTargetModule: string | null;
  resolvedTargetSubmodule: string | null;
  importResolutionStatus: string;
  file: string;
  line: number;
  value: string;
  evidence?: { namedImports?: string[] };
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
  const notifications: RunNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const modulesJsonPath = path.join(repoOutputDir, "facts", "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  const summary: Record<string, { submoduleCount: number }> = {};

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

    // Outbound/inbound aggregation, scoped WITHIN this one module's submodules.
    const outboundBySubmodule = new Map<string, Map<string, Touchpoint[]>>();
    const inboundBySubmodule = new Map<string, Map<string, Touchpoint[]>>();

    for (const fact of modGraph.facts as ImportsDependencyFact[]) {
      if (fact.type !== "imports_dependency" || fact.importResolutionStatus !== "resolved_in_repo") continue;
      if (fact.resolvedTargetModule !== moduleName) continue; // cross-module, not this scope -- see 06
      const sourceSubmodule = fact.submodule ?? MODULE_ROOT_BUCKET;
      const targetSubmodule = fact.resolvedTargetSubmodule ?? MODULE_ROOT_BUCKET;
      if (sourceSubmodule === targetSubmodule) continue; // same submodule, not coupling

      const touchpoint: Touchpoint = {
        file: fact.file,
        line: fact.line,
        importPath: fact.value,
        namedImports: fact.evidence?.namedImports || [],
      };

      if (!outboundBySubmodule.has(sourceSubmodule)) outboundBySubmodule.set(sourceSubmodule, new Map());
      const outboundTargets = outboundBySubmodule.get(sourceSubmodule)!;
      if (!outboundTargets.has(targetSubmodule)) outboundTargets.set(targetSubmodule, []);
      outboundTargets.get(targetSubmodule)!.push(touchpoint);

      if (!inboundBySubmodule.has(targetSubmodule)) inboundBySubmodule.set(targetSubmodule, new Map());
      const inboundSources = inboundBySubmodule.get(targetSubmodule)!;
      if (!inboundSources.has(sourceSubmodule)) inboundSources.set(sourceSubmodule, []);
      inboundSources.get(sourceSubmodule)!.push(touchpoint);
    }

    const allSubmodules = new Set<string>([...outboundBySubmodule.keys(), ...inboundBySubmodule.keys()]);
    const submodulesPayload: Record<string, { outbound: any[]; inbound: any[] }> = {};

    for (const submodule of Array.from(allSubmodules).sort()) {
      const outboundTargets = outboundBySubmodule.get(submodule) || new Map();
      const inboundSources = inboundBySubmodule.get(submodule) || new Map();

      submodulesPayload[submodule] = {
        outbound: Array.from(outboundTargets.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([targetSubmodule, touchpoints]) => ({ targetSubmodule, ...summarizeTouchpoints(touchpoints) })),
        inbound: Array.from(inboundSources.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([sourceSubmodule, touchpoints]) => ({ sourceSubmodule, ...summarizeTouchpoints(touchpoints) })),
      };
    }

    const payload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary: { submoduleCount: allSubmodules.size },
      submodules: submodulesPayload,
    };

    const outPath = path.join(modulesBaseDir, moduleName, "intra-module-coupling.json");
    writeJsonAtomically(outPath, payload, `knowledge-pipeline/modules/${moduleName}/intra-module-coupling.json`);
    summary[moduleName] = { submoduleCount: allSubmodules.size };
  }

  addNotification(
    notifications,
    SOURCE_SCRIPT,
    "info",
    "INTRA_MODULE_COUPLING_GRAPH_COMPLETED",
    `Intra-module coupling graph built for ${authoritativeModules.length} module(s).`,
    { moduleCount: authoritativeModules.length }
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Intra-module coupling graph written.");
  console.log(summary);
}

main();

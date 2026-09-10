// **version:** 1.0.0
// **location:** level-5 phase 1.75 -- Swift
// © Oskey SAS. All rights reserved.
//
// Script 04: Repository Resolved Engineering Graph Builder (Phase 1.75) --
// Swift. Real, deliberate re-design vs. the TS/Kotlin pipelines' own copies
// of this script, not a blind port -- same reasoning as Kotlin's own Task 8:
//
// - Call resolution already happened at EXTRACTION time
//   (01-extract-ast-evidence.ts's own import-and-target-aware resolver), not
//   here -- there is no "Rule A: exact compiler declaration match" step to
//   run at this stage, because there is no whole-project compiler symbol
//   table available to a syntax-only tool (real, honest capability gap,
//   same as Kotlin's -- see governance/roadmap/android-intercom-oskey-io/
//   07-call-graph-resolution-gap-major-finding-2026-09-08.md). This script's
//   real job is narrower: classify each already-resolved-or-not call's real
//   graph ELIGIBILITY, then aggregate into cross-module/same-module edges.
// - SHARED ACROSS EVERY SWIFT REPO, same as 00-03 -- see
//   01-extract-ast-evidence.ts's own header for the restructuring reasoning.
//
// Real, concrete finding this script is built around (measured 2026-09-10
// against the real ast-calls.json of all 4 already-onboarded Swift repos,
// 6,378 real calls total, not guessed): the unresolved majority is dominated
// by real SwiftUI/Foundation/Combine/Firebase-SDK framework calls (Logger:
// 554 real occurrences alone) -- see this file's own NOISY_CALL_ROOTS list.
// A SECOND, real, honestly-distinct gap surfaced by the same measurement,
// with no Kotlin/TS analog at all: 261 real calls have an EMPTY root because
// their real syntax is Swift's own implicit-member-expression shorthand
// (`.missingService(serviceUuid: "x")`, constructing an enum case whose
// type is inferred from context, e.g. `throw .missingService(...)` where
// the compiler infers `OSKBKErrorCode.missingService(...)`) -- structurally
// unresolvable by a syntax-only tool without real type inference, the exact
// same class of gap Kotlin's own indirect-enum-value-through-aliasing case
// was (governance/roadmap/android-intercom-oskey-io/06-ts-pipeline-lessons-
// reflagged-for-tree-sitter-2026-09-08.md item 1), confirmed live here for
// the first time. Tagged honestly as its own bucket below, never silently
// folded into the generic unresolved count.

import fs from "fs";
import path from "path";
import {
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  assertNoLocalAbsolutePaths,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "04-build-resolved-graph";

function writeMarkdownAtomically(filePath: string, content: string) {
  assertNoLocalAbsolutePaths(content, "resolved-graph-matrix.md");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.readFileSync(tmpPath, "utf8");
  fs.renameSync(tmpPath, filePath);
}

// Real, measured 2026-09-10 against all 4 already-onboarded Swift repos' own
// real ast-calls.json (6,378 real calls) -- every entry independently
// confirmed to be a real SwiftUI/Foundation/Combine/Firebase-SDK/stdlib
// name, never a guessed "looks external" heuristic. Deliberately excludes
// real, measured lowercase roots (configuration/content/signalingService/
// container/callback/datasource/socket/repository/user/db/auth/etc.) --
// same discipline as Kotlin's own list: those could be genuine in-repo
// property/parameter references a syntax-only tool simply couldn't type,
// and sweeping them in would silently hide a real gap instead of honestly
// reporting it as unresolved-but-eligible.
const NOISY_CALL_ROOTS = new Set([
  "Logger",
  "Color",
  "Image",
  "Circle",
  "VStack",
  "HStack",
  "Button",
  "Spacer",
  "ZStack",
  "Text",
  "CGSize",
  "CGFloat",
  "AnyView",
  "RoundedRectangle",
  "NSLocalizedString",
  "print",
  "DispatchQueue",
  "String",
  "Task",
  "JSONDecoder",
  "JSONEncoder",
  "JSONSerialization",
  "UUID",
  "URL",
  "fatalError",
  "Set",
  "Timer",
  "DecodingError",
  "CurrentValueSubject",
  "PassthroughSubject",
  "WebImage",
  "UIImpactFeedbackGenerator",
  "Firestore",
  "Auth",
  "Functions",
]);

// Real gap found and fixed 2026-09-10, same class of bug already fixed once
// in 01-extract-ast-evidence.ts's own rootIdentifier computation (this
// script derives its own root independently, from the already-written
// calleeExpression text, so it needs the identical stripping logic, not a
// re-import of a private helper): strip a call-then-navigation-chain's
// trailing "(...)" AND a generic class's explicit "<...>" type argument,
// or "Logger().info" and "OSKCKFunctionService<OSKCKNoResponse>(...)" would
// both produce a wrong, over-specific root that never matches
// NOISY_CALL_ROOTS's plain entries.
function extractCallRoot(expr: string): string {
  if (!expr) return "";
  const dotRoot = expr.split(".")[0].trim().replace(/\?$/, "");
  const parenRoot = dotRoot.split("(")[0];
  return parenRoot.split("<")[0];
}

// A leading "." with nothing before it (Swift's implicit-member-expression
// shorthand, e.g. ".missingService(...)") produces an empty root from
// extractCallRoot -- real, distinct, and honestly labeled below, never
// conflated with a genuine unresolved-named-root call.
function isImplicitMemberExpression(expr: string): boolean {
  return expr.startsWith(".");
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

  const allCalls: any[] = [];

  // 1. Validate every module manifest/evidence graph, collect call_expression facts
  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modGraphPath)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Missing evidence graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Missing output for module '${moduleName}'.`);
    }

    let modGraph: any;
    try {
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Malformed JSON in graph for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Malformed graph JSON for module '${moduleName}'.`);
    }

    if (
      modGraph.runId !== runId ||
      modGraph.repoName !== REPO_NAME ||
      modGraph.module !== moduleName ||
      !Array.isArray(modGraph.facts) ||
      !modGraph.summary ||
      modGraph.summary.totalFacts !== modGraph.facts.length
    ) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_MODULE_GRAPH_FATAL", `Graph structure or identity validation failed for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Graph validation failed for module '${moduleName}'.`);
    }

    for (const fact of modGraph.facts) {
      if (fact.type === "call_expression") allCalls.push(fact);
    }
  }

  // 2. Eligibility classification + edge aggregation
  const crossModuleCallEdges: any[] = [];
  const sameModuleResolvedCalls: any[] = [];
  const unresolvedEligibleCalls: any[] = [];
  const implicitMemberExpressionCalls: any[] = [];

  let nonGraphCallExpressions = 0;

  for (const call of allCalls) {
    if (isImplicitMemberExpression(call.calleeExpression || "")) {
      implicitMemberExpressionCalls.push({
        id: `implicit_member|${call.id}`,
        sourceCallFactId: call.id,
        module: call.module,
        submodule: call.submodule,
        file: call.file,
        line: call.line,
        callerClass: call.callerClass,
        evidenceCallText: call.calleeExpression,
      });
      continue;
    }

    const root = extractCallRoot(call.calleeExpression || "");
    if (NOISY_CALL_ROOTS.has(root)) {
      nonGraphCallExpressions += 1;
      continue;
    }

    if (call.resolutionMethod === "unresolved" || !call.declarationModule) {
      unresolvedEligibleCalls.push({
        id: `unresolved_call|${call.id}`,
        sourceCallFactId: call.id,
        module: call.module,
        submodule: call.submodule,
        file: call.file,
        line: call.line,
        callerClass: call.callerClass,
        evidenceCallText: call.calleeExpression,
      });
      continue;
    }

    if (call.declarationModule !== call.module) {
      crossModuleCallEdges.push({
        id: `call_edge|${call.id}`,
        sourceCallFactId: call.id,
        sourceModule: call.module,
        sourceFile: call.file,
        sourceLine: call.line,
        sourceContext: call.callerClass || call.callerName || "anonymous",
        targetModule: call.declarationModule,
        targetFile: call.declarationFile,
        evidenceCallText: call.calleeExpression,
        resolutionMethod: call.resolutionMethod,
        // Real, honest confidence tag -- never "confirmed" (compiler-exact).
        // resolved_via_import is not implemented yet for Swift (see
        // 01-extract-ast-evidence.ts's own header) so this branch never
        // actually fires today -- kept for when Task 11's cross-repo
        // resolution lands, not dead code to delete.
        confidence: call.resolutionMethod === "resolved_via_import" ? "probable" : "weak",
      });
    } else {
      sameModuleResolvedCalls.push({
        id: `same_module_call|${call.id}`,
        sourceCallFactId: call.id,
        module: call.module,
        submodule: call.submodule,
        file: call.file,
        line: call.line,
        targetFile: call.declarationFile,
        evidenceCallText: call.calleeExpression,
        resolutionMethod: call.resolutionMethod,
      });
    }
  }

  crossModuleCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  sameModuleResolvedCalls.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedEligibleCalls.sort((a, b) => a.id.localeCompare(b.id));
  implicitMemberExpressionCalls.sort((a, b) => a.id.localeCompare(b.id));

  const quality = {
    inputCallExpressions: allCalls.length,
    nonGraphCallExpressions,
    implicitMemberExpressionCalls: implicitMemberExpressionCalls.length,
    graphEligibleCallExpressions: allCalls.length - nonGraphCallExpressions - implicitMemberExpressionCalls.length,
    crossModuleCallEdges: crossModuleCallEdges.length,
    sameModuleResolvedCalls: sameModuleResolvedCalls.length,
    unresolvedEligibleCalls: unresolvedEligibleCalls.length,
  };

  if (unresolvedEligibleCalls.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "UNRESOLVED_ELIGIBLE_CALLS",
      `${unresolvedEligibleCalls.length} graph-eligible call expression(s) (not a known external framework/stdlib root) could not be resolved to an in-repo declaration -- a real, honest gap of this repo's syntax-only (no compiler) resolution strategy, not a bug in this script.`,
      { count: unresolvedEligibleCalls.length }
    );
  }
  if (implicitMemberExpressionCalls.length > 0) {
    addNotification(
      notifications,
      SOURCE_SCRIPT,
      "info",
      "IMPLICIT_MEMBER_EXPRESSION_CALLS",
      `${implicitMemberExpressionCalls.length} call(s) use Swift's implicit-member-expression shorthand (e.g. ".missingService(...)") -- structurally unresolvable by a syntax-only tool without real type inference (the receiver type is inferred from context), a real and distinct gap from a generic unresolved named-root call.`,
      { count: implicitMemberExpressionCalls.length }
    );
  }

  const preliminaryAttention = notifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );
  const status = notifications.highestSeverity === "error" || notifications.highestSeverity === "fatal" ? "failed" : preliminaryAttention ? "completed_with_warnings" : "complete";

  addNotification(notifications, SOURCE_SCRIPT, "info", "GRAPH_RESOLUTION_COMPLETED", `Repository-wide resolved graph completed with status '${status}'.`);
  writeNotificationsAtomically(notificationsPath, notifications);

  const graphPayload = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    status,
    generatedAt: new Date().toISOString(),
    quality,
    crossModuleCallEdges,
    sameModuleResolvedCalls,
    unresolvedEligibleCalls,
    implicitMemberExpressionCalls,
  };

  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");
  fs.mkdirSync(kpDir, { recursive: true });
  const graphJsonPath = path.join(kpDir, "resolved-engineering-graph.json");
  writeJsonAtomically(graphJsonPath, graphPayload, "knowledge-pipeline/resolved-engineering-graph.json");

  // Markdown summary
  let md = `# Resolved Engineering Graph Matrix\n\n`;
  md += `**Run ID**: \`${runId}\`  \n`;
  md += `**Repo**: \`${REPO_NAME}\`  \n`;
  md += `**Status**: \`${status}\`  \n`;
  md += `**Generated At**: \`${graphPayload.generatedAt}\`  \n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Input Call Expressions**: ${quality.inputCallExpressions}\n`;
  md += `- **Excluded (known external framework/stdlib root)**: ${quality.nonGraphCallExpressions}\n`;
  md += `- **Excluded (implicit-member-expression shorthand, real but untypeable)**: ${quality.implicitMemberExpressionCalls}\n`;
  md += `- **Graph-Eligible Call Expressions**: ${quality.graphEligibleCallExpressions}\n`;
  md += `- **Cross-Module Call Edges**: ${quality.crossModuleCallEdges}\n`;
  md += `- **Same-Module Resolved Calls**: ${quality.sameModuleResolvedCalls}\n`;
  md += `- **Unresolved, Eligible Calls (real, honest gap)**: ${quality.unresolvedEligibleCalls}\n\n`;

  md += `> **Note**: This repo has no compiler-backed ("confirmed") call resolution -- every edge below is tagged \`probable\` (resolved via an explicit cross-target import -- not yet implemented for Swift, see 01-extract-ast-evidence.ts's own header) or \`weak\` (resolved via same-target visibility, no import needed).\n\n`;

  md += `## Cross-Module Call Edges\n\n`;
  if (crossModuleCallEdges.length === 0) {
    md += `*No cross-module call edges detected.*\n\n`;
  } else {
    md += `| Source Module | Source Context | Target Module | Evidence | Confidence |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const edge of crossModuleCallEdges) {
      md += `| \`${edge.sourceModule}\` | \`${edge.sourceContext}\` | \`${edge.targetModule}\` | \`${edge.evidenceCallText}\` | \`${edge.confidence}\` |\n`;
    }
    md += `\n`;
  }

  const matrixMdPath = path.join(kpDir, "resolved-graph-matrix.md");
  writeMarkdownAtomically(matrixMdPath, md);

  console.log("Resolved engineering graph generated successfully.");
  console.log(quality);
  console.log(`Wrote ${graphJsonPath}`);
  console.log(`Wrote ${matrixMdPath}`);
}

main();

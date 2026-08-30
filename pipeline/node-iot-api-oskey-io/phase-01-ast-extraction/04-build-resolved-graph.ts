// **version:** 3.0.0
// **location:** level-5 phase 1.75

// © Oskey SAS. All rights reserved.
// Script 04: Repository Resolved Engineering Graph Builder (Phase 1.75).
// Refactors call graph eligibility, exact compiler declaration matching, API-to-service edge linking,
// RBAC entitlement matrix, and atomic Markdown graph promotion.

import fs from "fs";
import path from "path";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  assertNoLocalAbsolutePaths,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();

// writeMarkdownAtomically stays local to this script -- it's the only script
// in this repo's pipeline that emits a Markdown artifact, so it doesn't
// belong in the shared, repo-pipeline-wide utils module.
function writeMarkdownAtomically(filePath: string, content: string) {
  assertNoLocalAbsolutePaths(content, "resolved-graph-matrix.md");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.readFileSync(tmpPath, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function extractInvokedObject(expression: string): string | null {
  if (!expression) return null;
  const parts = expression
    .split(".")
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

interface NormalizationRules {
  stripPrefixes: string[];
  // Suffixes stripped when normalizing a name for object/class matching
  // (e.g. "OSKPaymentService" -> "payment"). Distinct from serviceClassSuffixes
  // below, which is used for eligibility classification, not name matching --
  // the original code used different suffix sets for these two purposes and
  // this preserves that distinction.
  stripServiceSuffixes: string[];
  stripControllerSuffixes: string[];
  // Suffixes used to classify a declaration's class as a "service" for call
  // graph eligibility purposes (broader than stripServiceSuffixes).
  serviceClassSuffixes: string[];
}

// Previously hardcoded to strip a literal "OSK" prefix and "Service"/
// "Controller" suffixes -- entirely specific to this repo's own naming
// convention. Now config-driven per repo (config/repos.json ->
// normalizationRules), defaulting to this repo's existing behavior.
// Set once in main() from config, then read by normalizeObjectOrClassName
// and classifyCallEligibility below -- module-level rather than threaded
// through every call site, since both functions are called from many places.
const DEFAULT_NORMALIZATION_RULES: NormalizationRules = {
  stripPrefixes: ["OSK"],
  stripServiceSuffixes: ["Service"],
  stripControllerSuffixes: ["Controller"],
  serviceClassSuffixes: ["Service", "Publisher", "Processor"],
};
let activeNormalizationRules: NormalizationRules = DEFAULT_NORMALIZATION_RULES;

function normalizeObjectOrClassName(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  if (clean.startsWith("this.")) clean = clean.slice(5);
  for (const prefix of activeNormalizationRules.stripPrefixes) {
    if (clean.startsWith(prefix)) {
      clean = clean.slice(prefix.length);
      break;
    }
  }
  for (const suffix of activeNormalizationRules.stripServiceSuffixes) {
    if (clean.endsWith(suffix)) {
      clean = clean.slice(0, -suffix.length);
      break;
    }
  }
  for (const suffix of activeNormalizationRules.stripControllerSuffixes) {
    if (clean.endsWith(suffix)) {
      clean = clean.slice(0, -suffix.length);
      break;
    }
  }
  return clean.toLowerCase();
}

type CallGraphEligibility = "cross_module_service_candidate" | "service_candidate" | "non_graph_call";

function classifyCallEligibility(
  call: any,
  allServiceMethods: any[],
  moduleByClass: Map<string, string>
): CallGraphEligibility {
  const expr = call.calleeExpression || call.value || "";
  const methodName = call.declarationMethod || call.evidence?.name || expr.split(".").pop() || "";
  const declClass = call.declarationClass || "";
  const declFile = call.declarationFile || "";

  // Builtins, system calls, array/utility methods, and Firebase SDK calls
  if (
    expr.startsWith("console.") ||
    expr.startsWith("JSON.") ||
    expr.startsWith("Math.") ||
    expr.startsWith("Object.") ||
    expr.startsWith("Array.") ||
    expr.startsWith("Promise.") ||
    expr.startsWith("admin.") ||
    expr.startsWith("functions.") ||
    expr.includes("hasOwnProperty") ||
    expr.includes(".map") ||
    expr.includes(".forEach") ||
    expr.includes(".find") ||
    expr.includes(".filter") ||
    expr.includes(".reduce") ||
    expr.includes(".push") ||
    expr.includes(".slice") ||
    expr.includes(".split") ||
    expr.includes(".join")
  ) {
    return "non_graph_call";
  }

  // Compiler declaration points to a known service_method
  if (declFile && methodName) {
    const matchingService = allServiceMethods.find(
      s => s.file === declFile && (s.method === methodName || s.symbol === methodName)
    );
    if (matchingService) {
      return matchingService.module !== call.module ? "cross_module_service_candidate" : "service_candidate";
    }
  }

  // Known declaration class
  if (declClass) {
    const isServiceClass = activeNormalizationRules.serviceClassSuffixes.some(suffix => declClass.endsWith(suffix));
    if (isServiceClass) {
      const targetMod = moduleByClass.get(declClass);
      return targetMod && targetMod !== call.module ? "cross_module_service_candidate" : "service_candidate";
    }
  }

  // Invoked object normalization check
  const invObj = extractInvokedObject(expr);
  if (invObj) {
    const normObj = normalizeObjectOrClassName(invObj);
    if (normObj) {
      const hasMatchingService = allServiceMethods.some(s => {
        const normClass = normalizeObjectOrClassName(s.className || "");
        return normClass === normObj && (s.method === methodName || s.symbol === methodName);
      });
      if (hasMatchingService) {
        return "cross_module_service_candidate";
      }
    }
  }

  return "non_graph_call";
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

  // Load per-repo normalization rules from config, falling back to this
  // repo's existing OSK/Service/Controller conventions if none configured.
  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, "utf8"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  activeNormalizationRules = targetRepoCfg?.normalizationRules || DEFAULT_NORMALIZATION_RULES;

  const rawDir = path.join(repoOutputDir, "facts");
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, "04-build-resolved-graph", "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");

  const serviceMethods: any[] = [];
  const controllerMethods: any[] = [];
  const routeHandlerMethods: any[] = [];
  const classMethods: any[] = [];
  const allCalls: any[] = [];
  const routeDefinitions: any[] = [];
  const mongoOperations: any[] = [];
  const externalHooks: any[] = [];
  const pubsubOperationRoutes: any[] = [];

  const moduleByClass = new Map<string, string>();

  // 1. Validate all 12 module manifests and evidence graphs fully
  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modManifestPath = path.join(modDir, `${moduleName}-manifest.json`);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modManifestPath) || !fs.existsSync(modGraphPath)) {
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Missing manifest or graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Missing output for module '${moduleName}'.`);
    }

    let modGraph: any;
    try {
      modGraph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Malformed JSON in graph for module '${moduleName}': ${err.message}`, { module: moduleName });
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
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Graph structure or identity validation failed for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Graph validation failed for module '${moduleName}'.`);
    }

    for (const fact of modGraph.facts) {
      if (fact.type === "service_method") {
        serviceMethods.push(fact);
        if (fact.className) moduleByClass.set(fact.className, moduleName);
      } else if (fact.type === "controller_method") {
        controllerMethods.push(fact);
        if (fact.className) moduleByClass.set(fact.className, moduleName);
      } else if (fact.type === "route_handler_method") {
        routeHandlerMethods.push(fact);
        if (fact.className) moduleByClass.set(fact.className, moduleName);
      } else if (fact.type === "class_method") {
        classMethods.push(fact);
      } else if (fact.type === "call_expression") {
        allCalls.push(fact);
      } else if (fact.type === "route_definition") {
        routeDefinitions.push(fact);
      } else if (fact.type === "mongo_operation") {
        mongoOperations.push(fact);
      } else if (
        fact.type === "external_hook" ||
        fact.type === "pubsub_topic" ||
        fact.type === "pubsub_publish_call" ||
        fact.type === "http_or_client_path" ||
        fact.type === "environment_variable" ||
        fact.type === "storage_path"
      ) {
        externalHooks.push(fact);
      } else if (fact.type === "pubsub_operation_route") {
        pubsubOperationRoutes.push(fact);
      }
    }
  }

  // Combined candidate pool for call resolution -- previously this was
  // serviceMethods only, meaning any call into a Controller class (very
  // common in this codebase for Firestore-mediated access, e.g.
  // OSKBuildingAccessesController) was invisible to Rule A/B/C entirely and
  // fell through to non_graph_call/unresolved, for BOTH cross-module and
  // intra-module resolution. Found 2026-08-02 investigating why a known
  // real intra-module coupling case (building_door calling into
  // building_accesses' controller) didn't show up in the new intra-module
  // edges. Purely additive -- serviceMethods/controllerMethods themselves
  // are unchanged, this is just a bigger candidate list for matching.
  const resolvableMethods = [...serviceMethods, ...controllerMethods, ...routeHandlerMethods];

  // Fast lookup index by exact declaration file & method name
  const serviceByFileMethod = new Map<string, any[]>();
  for (const s of resolvableMethods) {
    const key = `${s.file}::${s.method || s.symbol}`;
    const list = serviceByFileMethod.get(key) || [];
    list.push(s);
    serviceByFileMethod.set(key, list);
  }

  const confirmedCallEdges: any[] = [];
  const probableCallEdges: any[] = [];
  const unresolvedCallEdges: any[] = [];
  // Same-module, different-submodule call edges -- previously discarded
  // entirely (only counted via sameModuleServiceCalls below), added
  // 2026-08-02 to give the intra-module coupling story (see
  // governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3)
  // method-level specificity the same way confirmedCallEdges/
  // probableCallEdges already do for cross-module coupling. Does not
  // change any existing array's population -- purely additive.
  const confirmedIntraModuleCallEdges: any[] = [];
  const probableIntraModuleCallEdges: any[] = [];

  let inputCallExpressions = allCalls.length;
  let graphEligibleCallExpressions = 0;
  let nonGraphCallExpressions = 0;
  let sameModuleServiceCalls = 0;

  const confirmedEdgesMapBySourceFactId = new Map<string, any>();
  const probableEdgesMapBySourceFactId = new Map<string, any>();

  // 2. Cross-Module Service Call Resolution
  for (const call of allCalls) {
    const eligibility = classifyCallEligibility(call, resolvableMethods, moduleByClass);

    if (eligibility === "non_graph_call") {
      nonGraphCallExpressions += 1;
      continue;
    }

    graphEligibleCallExpressions += 1;

    const sourceModule = call.module;
    const sourceFile = call.file;
    const sourceLine = call.line;
    const sourceContext = call.callerName || "anonymous";
    const calleeExpr = call.calleeExpression || call.value || "";

    const declFile = call.declarationFile;
    const declMethod = call.declarationMethod || call.evidence?.name || calleeExpr.split(".").pop() || "";
    const declClass = call.declarationClass;

    // Rule A: Exact Compiler Declaration Match
    let compilerMatches: any[] = [];
    if (declFile && declMethod) {
      const candidates = serviceByFileMethod.get(`${declFile}::${declMethod}`) || [];
      compilerMatches = candidates;
    }

    if (compilerMatches.length === 1) {
      const target = compilerMatches[0];
      if (target.module === sourceModule) {
        sameModuleServiceCalls += 1;
        // Genuine cross-submodule coupling within the same module -- see
        // the new arrays' header comment above.
        if (call.submodule && target.submodule && call.submodule !== target.submodule) {
          confirmedIntraModuleCallEdges.push({
            id: `intra_module_call_edge|${call.id}|${target.id}`,
            module: sourceModule,
            sourceSubmodule: call.submodule,
            sourceFile,
            sourceLine,
            sourceContext,
            targetSubmodule: target.submodule,
            targetFile: target.file,
            targetLine: target.line,
            targetClass: target.className,
            targetMethod: target.method || target.symbol,
            evidenceCallText: calleeExpr,
            resolutionMethod: "compiler_symbol",
            confidence: "confirmed",
            sourceCallFactId: call.id,
            targetFactId: target.id,
          });
        }
        continue;
      }

      const edgeId = `call_edge|${call.id}|${target.id}`;
      const edge = {
        id: edgeId,
        sourceModule,
        sourceFile,
        sourceLine,
        sourceContext,
        targetModule: target.module,
        targetFile: target.file,
        targetLine: target.line,
        targetClass: target.className,
        targetMethod: target.method || target.symbol,
        evidenceCallText: calleeExpr,
        resolutionMethod: "compiler_symbol",
        confidence: "confirmed",
        candidateCount: 1,
        sourceCallFactId: call.id,
        targetFactId: target.id,
        evidence: {
          sourceCallFactId: call.id,
          targetFactId: target.id,
          callDeclarationFile: declFile,
          callDeclarationLine: call.declarationLine,
          callDeclarationClass: declClass,
          callDeclarationMethod: declMethod,
          targetDeclarationFile: target.file,
          targetDeclarationLine: target.line,
          targetDeclarationClass: target.className,
          targetDeclarationMethod: target.method || target.symbol,
        },
      };

      confirmedCallEdges.push(edge);
      confirmedEdgesMapBySourceFactId.set(call.id, edge);
      continue;
    }

    // Rule B: Heuristic Unique Signature Fallback
    const invObj = extractInvokedObject(calleeExpr);
    let heuristicCandidates: any[] = [];

    if (invObj && declMethod) {
      const normObj = normalizeObjectOrClassName(invObj);
      if (normObj) {
        heuristicCandidates = resolvableMethods.filter(s => {
          const normClass = normalizeObjectOrClassName(s.className || "");
          return normClass === normObj && (s.method === declMethod || s.symbol === declMethod);
        });
      }
    }

    const uniqueCrossModuleCandidates = heuristicCandidates.filter(s => s.module !== sourceModule);

    if (uniqueCrossModuleCandidates.length === 1) {
      const target = uniqueCrossModuleCandidates[0];
      const edgeId = `call_edge|${call.id}|${target.id}`;
      const edge = {
        id: edgeId,
        sourceModule,
        sourceFile,
        sourceLine,
        sourceContext,
        targetModule: target.module,
        targetFile: target.file,
        targetLine: target.line,
        targetClass: target.className,
        targetMethod: target.method || target.symbol,
        evidenceCallText: calleeExpr,
        resolutionMethod: "unique_signature_heuristic",
        confidence: "probable",
        candidateCount: 1,
        sourceCallFactId: call.id,
        targetFactId: target.id,
        evidence: {
          sourceCallFactId: call.id,
          targetFactId: target.id,
          invokedObject: invObj,
          normalizedObject: normalizeObjectOrClassName(invObj || ""),
        },
      };

      probableCallEdges.push(edge);
      probableEdgesMapBySourceFactId.set(call.id, edge);
      continue;
    }

    // Rule B-intra: same module, different submodule, unique heuristic
    // match -- see confirmedIntraModuleCallEdges' header comment above.
    // Only reached if Rule A and the cross-module Rule B above didn't
    // already resolve this call, so it never double-processes a call.
    const uniqueIntraModuleCandidates = heuristicCandidates.filter(
      s => s.module === sourceModule && s.submodule && call.submodule && s.submodule !== call.submodule
    );
    if (uniqueIntraModuleCandidates.length === 1) {
      const target = uniqueIntraModuleCandidates[0];
      probableIntraModuleCallEdges.push({
        id: `intra_module_call_edge|${call.id}|${target.id}`,
        module: sourceModule,
        sourceSubmodule: call.submodule,
        sourceFile,
        sourceLine,
        sourceContext,
        targetSubmodule: target.submodule,
        targetFile: target.file,
        targetLine: target.line,
        targetClass: target.className,
        targetMethod: target.method || target.symbol,
        evidenceCallText: calleeExpr,
        resolutionMethod: "unique_signature_heuristic",
        confidence: "probable",
        sourceCallFactId: call.id,
        targetFactId: target.id,
      });
      continue;
    }

    // Rule C: Unresolved Candidate Record
    const distinctCandidates = (heuristicCandidates.length > 0 ? heuristicCandidates : resolvableMethods.filter(s => s.method === declMethod || s.symbol === declMethod)).map(s => ({
      factId: s.id,
      module: s.module,
      file: s.file,
      line: s.line,
      className: s.className,
      methodName: s.method || s.symbol,
    }));

    unresolvedCallEdges.push({
      id: `unresolved_call|${call.id}`,
      sourceCallFactId: call.id,
      sourceModule,
      sourceFile,
      sourceLine,
      sourceContext,
      evidenceCallText: calleeExpr,
      reason: distinctCandidates.length > 1 ? "multiple_candidates" : "no_target_declaration",
      candidateCount: distinctCandidates.length,
      candidateSummaries: distinctCandidates,
    });
  }

  // 3. API Entry Points & Service Method Linking
  // See finding 2 above: this repo's real linkage is overwhelmingly
  // same-module/same-submodule, which section 2's cross-boundary edge maps
  // never record by design -- so this does its own scoped resolution: for
  // each route, find calls whose line falls inside its handler's own
  // [handlerStartLine, handlerEndLine] range, then resolve each via the same
  // Rule-A-style exact declarationFile+declarationMethod match used in
  // section 2, directly against resolvableMethods (not via the pre-built
  // edge maps). linkageScope records whether the resolved target turned out
  // to be same-submodule, cross-submodule, or cross-module -- same_submodule
  // is expected to dominate here, which is real and correct for this repo's
  // shape, not a sign this section is broken.
  const apiEntryPoints: any[] = [];
  for (const route of routeDefinitions) {
    const handlerFile = route.handlerDeclarationFile;
    const handlerStartLine = route.handlerStartLine;
    const handlerEndLine = route.handlerEndLine;
    const handlerLinkingStatus =
      handlerFile && handlerStartLine != null && handlerEndLine != null ? "resolved" : "unresolved_handler_declaration";

    const handlerCalls =
      handlerLinkingStatus === "resolved"
        ? allCalls.filter(c => c.file === handlerFile && c.line >= handlerStartLine && c.line <= handlerEndLine)
        : [];

    const linkedServiceMethods: any[] = [];
    for (const callFact of handlerCalls) {
      if (!callFact.declarationFile || !callFact.declarationMethod) continue;
      const target = resolvableMethods.find(
        s => s.file === callFact.declarationFile && (s.method === callFact.declarationMethod || s.symbol === callFact.declarationMethod)
      );
      if (!target) continue;

      const linkageScope =
        target.module !== route.module ? "cross_module" : target.submodule !== route.submodule ? "cross_submodule" : "same_submodule";

      linkedServiceMethods.push({
        callFactId: callFact.id,
        targetModule: target.module,
        targetSubmodule: target.submodule,
        targetFile: target.file,
        targetClass: target.className,
        targetMethod: target.method || target.symbol,
        linkageScope,
      });
    }

    linkedServiceMethods.sort((a, b) => a.callFactId.localeCompare(b.callFactId));

    apiEntryPoints.push({
      id: `api-entry|${route.module}|${route.file}|${route.line}|${route.method}|${route.httpPath}`,
      module: route.module,
      submodule: route.submodule,
      httpPath: route.httpPath,
      httpMethod: route.method,
      isPubSubPushRoute: route.isPubSubPushRoute,
      handlerClass: route.handlerClass,
      handlerMethod: route.handlerMethod,
      handlerDeclarationFile: handlerFile,
      handlerStartLine,
      handlerEndLine,
      handlerLinkingStatus,
      rawHandlerCallsCount: handlerCalls.length,
      linkedServiceMethodsCount: linkedServiceMethods.length,
      linkedServiceMethods,
    });
  }

  // 4. Shared Mongo Collection Touch Matrix
  // Re-scoped from Firebase's cross-MODULE Firestore touch matrix to
  // cross-SUBMODULE: this repo has exactly one module, so the original
  // framing would always report zero shared paths. See finding 3 above for
  // why unresolved-collection records must be excluded from grouping, not
  // merged under a fake shared key.
  const mongoCollectionMap = new Map<string, { touchPoints: any[]; operations: Set<string> }>();
  const unresolvedMongoTouches: any[] = [];

  for (const m of mongoOperations) {
    const touchPoint = {
      module: m.module,
      submodule: m.submodule,
      file: m.file,
      line: m.line,
      operation: m.operation,
      collectionResolutionStatus: m.collectionResolutionStatus,
      dbNameExpression: m.dbNameExpression,
    };

    if (m.collectionResolutionStatus === "resolved_from_collections_map" || m.collectionResolutionStatus === "resolved_property_name_only") {
      const entry = mongoCollectionMap.get(m.collectionName) || { touchPoints: [], operations: new Set<string>() };
      entry.operations.add(m.operation);
      entry.touchPoints.push(touchPoint);
      mongoCollectionMap.set(m.collectionName, entry);
    } else {
      unresolvedMongoTouches.push(touchPoint);
    }
  }

  const sharedMongoCollections: any[] = [];
  for (const [collectionName, data] of mongoCollectionMap.entries()) {
    const submodulesTouched = Array.from(new Set(data.touchPoints.map(t => t.submodule))).sort();
    sharedMongoCollections.push({
      collectionName,
      isSharedCrossSubmodule: submodulesTouched.length > 1,
      submodulesTouchedCount: submodulesTouched.length,
      submodulesTouched,
      operations: Array.from(data.operations).sort(),
      touchPointsCount: data.touchPoints.length,
      touchPoints: data.touchPoints,
    });
  }

  // 5. Pub/Sub Publishers & Receivers -- deliberately NOT joined into one
  // structure. Publisher detection checks evidence.type, not the top-level
  // fact type: pubsub_publish_call facts get normalized with a generic
  // top-level type "external_hook" in 02-build-module-evidence.ts (a
  // pre-existing, harmless classification quirk, out of scope for this file
  // to fix -- the real classification survives in evidence.type either way).
  // Receivers are route_definition facts flagged isPubSubPushRoute. There is
  // no evidenced link in source between a publish call's topic-name literal
  // and a push route's URL path -- correlating a specific publisher to a
  // specific receiver would require the Pub/Sub subscription's own
  // push-endpoint config, which lives in cloud infrastructure, not in either
  // repo's source. Same intellectual honesty the original Firebase code
  // already modeled for its own unresolved publisher<->subscriber gap.
  const pubsubPublishers = externalHooks
    .filter(h => h.evidence?.type === "pubsub_publish_call")
    .map(h => ({ module: h.module, submodule: h.submodule, file: h.file, line: h.line, topicValue: h.value, confidence: h.evidence?.confidence || "candidate" }));

  const pubsubReceivers = routeDefinitions
    .filter(r => r.isPubSubPushRoute)
    .map(r => ({ module: r.module, submodule: r.submodule, file: r.file, line: r.line, httpPath: r.httpPath, handlerClass: r.handlerClass, handlerMethod: r.handlerMethod }));

  // 5b. Pub/Sub Operation Routing Table -- this repo's real equivalent of an
  // Event Routing Table: which `.operation` values each Pub/Sub-receiving
  // handler dispatches on, and what each dispatch calls. Replaces Firebase's
  // pubsub_event_route-based version (didn't apply here -- see Handoff 5).
  const pubsubOperationReceiverMap = new Map<string, { module: string; submodule: string; file: string; handlerClass: string; handlerMethod: string; routes: any[] }>();
  for (const route of pubsubOperationRoutes) {
    const key = `${route.module}|${route.handlerClass}.${route.handlerMethod}`;
    const entry = pubsubOperationReceiverMap.get(key) || {
      module: route.module,
      submodule: route.submodule,
      file: route.file,
      handlerClass: route.handlerClass,
      handlerMethod: route.handlerMethod,
      routes: [] as any[],
    };
    entry.routes.push({
      line: route.line,
      dispatchKind: route.dispatchKind,
      operationValue: route.operationValue,
      operationResolutionStatus: route.operationResolutionStatus,
      targetCallsCount: (route.targetCalls || []).length,
      targetCalls: route.targetCalls || [],
    });
    pubsubOperationReceiverMap.set(key, entry);
  }

  const pubsubOperationRoutingTable: any[] = [];
  for (const [, data] of pubsubOperationReceiverMap.entries()) {
    pubsubOperationRoutingTable.push({
      module: data.module,
      submodule: data.submodule,
      file: data.file,
      handlerClass: data.handlerClass,
      handlerMethod: data.handlerMethod,
      routesCount: data.routes.length,
      resolvedRoutesCount: data.routes.filter(r => r.operationResolutionStatus === "resolved").length,
      routes: data.routes,
    });
  }

  // 6. RBAC Requirements Matrix -- this repo has zero auth/RBAC code,
  // verified directly (no jwt/Guard/RBAC/Authoriz/Permission patterns
  // anywhere in src/, despite `jsonwebtoken` being a listed dependency --
  // apparently unused in live code). No fact type feeds this (Handoff 2
  // dropped permission-hint extraction entirely as N/A for this repo), so
  // this stays correctly, honestly empty -- the JSON/Markdown output below
  // already handles the empty case gracefully ("No RBAC requirements
  // detected"), unchanged from the original.
  const rbacRequirements: any[] = [];

  // Deterministic Sorting
  confirmedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  probableCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  confirmedIntraModuleCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  probableIntraModuleCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  apiEntryPoints.sort((a, b) => a.id.localeCompare(b.id));
  sharedMongoCollections.sort((a, b) => a.collectionName.localeCompare(b.collectionName));
  unresolvedMongoTouches.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  pubsubPublishers.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  pubsubReceivers.sort((a, b) => a.httpPath.localeCompare(b.httpPath));
  pubsubOperationRoutingTable.sort((a, b) => a.handlerMethod.localeCompare(b.handlerMethod));
  rbacRequirements.sort((a, b) => (a.permission || "").localeCompare(b.permission || ""));

  // 7. Notifications & Quality Calculation Sequence
  if (unresolvedCallEdges.length > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "warning",
      "UNRESOLVED_CALLS_WARNING",
      `${unresolvedCallEdges.length} eligible call expression(s) could not be resolved to a unique cross-module service method.`,
      { count: unresolvedCallEdges.length }
    );
  }

  if (pubsubPublishers.length > 0 || pubsubReceivers.length > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "info",
      "PUBSUB_PUBLISHER_RECEIVER_NOT_JOINED",
      `Found ${pubsubPublishers.length} Pub/Sub publisher(s) and ${pubsubReceivers.length} Pub/Sub receiver(s) -- not correlated to each other (no evidenced link between a publish call's topic name and a push route's URL path exists in source; would require Pub/Sub subscription config, which lives outside this repo).`,
      { publishersCount: pubsubPublishers.length, receiversCount: pubsubReceivers.length }
    );
  }

  // Determine final status for notification message
  const preliminaryAttention = notifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );
  const finalStatusString = notifications.highestSeverity === "error" || notifications.highestSeverity === "fatal" ? "failed" : preliminaryAttention ? "completed_with_warnings" : "complete";

  addNotification(
    notifications,
    "04-build-resolved-graph",
    "info",
    "GRAPH_RESOLUTION_COMPLETED",
    `Repository-wide resolved graph completed with status '${finalStatusString}'.`
  );

  writeNotificationsAtomically(notificationsPath, notifications);

  const finalNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);
  const humanAttentionRecommended = finalNotifications.entries.some(
    entry => entry.humanAttentionRecommended || entry.severity === "warning" || entry.severity === "error" || entry.severity === "fatal"
  );

  let status: "complete" | "completed_with_warnings" | "failed" = "complete";
  if (finalNotifications.highestSeverity === "error" || finalNotifications.highestSeverity === "fatal") {
    status = "failed";
  } else if (finalNotifications.highestSeverity === "warning" || humanAttentionRecommended) {
    status = "completed_with_warnings";
  }

  const quality = {
    notificationHighestSeverity: finalNotifications.highestSeverity,
    notificationCount: finalNotifications.entries.length,
    humanAttentionRecommended,
    inputCallExpressions,
    graphEligibleCallExpressions,
    nonGraphCallExpressions,
    sameModuleServiceCalls,
    confirmedCrossModuleCalls: confirmedCallEdges.length,
    probableCrossModuleCalls: probableCallEdges.length,
    unresolvedCrossModuleCandidates: unresolvedCallEdges.length,
    confirmedIntraModuleCalls: confirmedIntraModuleCallEdges.length,
    probableIntraModuleCalls: probableIntraModuleCallEdges.length,
    apiEntryPointsCount: apiEntryPoints.length,
    rbacRequirementsCount: rbacRequirements.length,
    sharedMongoCollectionsCount: sharedMongoCollections.length,
    unresolvedMongoTouchesCount: unresolvedMongoTouches.length,
    pubsubPublishersCount: pubsubPublishers.length,
    pubsubReceiversCount: pubsubReceivers.length,
    pubsubOperationReceiversCount: pubsubOperationRoutingTable.length,
    pubsubOperationRoutesCount: pubsubOperationRoutes.length,
  };

  const graphPayload = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    status,
    generatedAt: new Date().toISOString(),
    quality,
    confirmedCallEdges,
    probableCallEdges,
    unresolvedCallEdges,
    confirmedIntraModuleCallEdges,
    probableIntraModuleCallEdges,
    apiEntryPoints,
    sharedMongoCollections,
    unresolvedMongoTouches,
    pubsubPublishers,
    pubsubReceivers,
    pubsubOperationRoutingTable,
    rbacRequirements,
  };

  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");
  fs.mkdirSync(kpDir, { recursive: true });

  const graphJsonPath = path.join(kpDir, "resolved-engineering-graph.json");
  writeJsonAtomically(graphJsonPath, graphPayload, "knowledge-pipeline/resolved-engineering-graph.json");

  // 8. Markdown Graph Matrix Generation & Atomic Write
  let md = `# Resolved Engineering Graph Matrix\n\n`;
  md += `**Run ID**: \`${runId}\`  \n`;
  md += `**Repo**: \`${REPO_NAME}\`  \n`;
  md += `**Status**: \`${status}\`  \n`;
  md += `**Generated At**: \`${graphPayload.generatedAt}\`  \n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Confirmed Call Edges**: ${confirmedCallEdges.length}\n`;
  md += `- **Probable Call Edges**: ${probableCallEdges.length}\n`;
  md += `- **Unresolved Calls**: ${unresolvedCallEdges.length}\n`;
  md += `- **Confirmed Intra-Module (Cross-Submodule) Call Edges**: ${confirmedIntraModuleCallEdges.length}\n`;
  md += `- **Probable Intra-Module (Cross-Submodule) Call Edges**: ${probableIntraModuleCallEdges.length}\n`;
  md += `- **API Entry Points**: ${apiEntryPoints.length}\n`;
  md += `- **RBAC Requirements**: ${rbacRequirements.length}\n`;
  md += `- **Shared Mongo Collection Touch Points**: ${sharedMongoCollections.length}\n`;
  md += `- **Pub/Sub Publishers & Receivers**: ${pubsubPublishers.length} publishers, ${pubsubReceivers.length} receivers\n`;
  md += `- **Pub/Sub Operation Receivers**: ${pubsubOperationRoutingTable.length} (${pubsubOperationRoutes.length} total routes)\n\n`;

  md += `> **Note**: Confirmed edges are backed by exact declaration or import identity. Probable edges use a unique constrained fallback. Ambiguous and unresolved evidence is retained separately.\n\n`;

  md += `## Confirmed Cross-Module Call Edges\n\n`;
  if (confirmedCallEdges.length === 0) {
    md += `*No confirmed cross-module call edges detected.*\n\n`;
  } else {
    md += `| Source Module | Source Context | Target Module | Target Class | Target Method | Resolution Method |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const edge of confirmedCallEdges) {
      md += `| \`${edge.sourceModule}\` | \`${edge.sourceContext}\` | \`${edge.targetModule}\` | \`${edge.targetClass}\` | \`${edge.targetMethod}\` | \`${edge.resolutionMethod}\` |\n`;
    }
    md += `\n`;
  }

  md += `## Probable Cross-Module Call Edges\n\n`;
  if (probableCallEdges.length === 0) {
    md += `*No probable cross-module call edges detected.*\n\n`;
  } else {
    md += `| Source Module | Source Context | Target Module | Target Class | Target Method | Resolution Method |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const edge of probableCallEdges) {
      md += `| \`${edge.sourceModule}\` | \`${edge.sourceContext}\` | \`${edge.targetModule}\` | \`${edge.targetClass}\` | \`${edge.targetMethod}\` | \`${edge.resolutionMethod}\` |\n`;
    }
    md += `\n`;
  }

  md += `## API Entry Points & Linked Service Edges\n\n`;
  if (apiEntryPoints.length === 0) {
    md += `*No API entry points detected.*\n\n`;
  } else {
    md += `| Module | Submodule | HTTP Method | Path | Linked Services Count | Handler |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const api of apiEntryPoints) {
      md += `| \`${api.module}\` | \`${api.submodule}\` | \`${api.httpMethod}\` | \`${api.httpPath}\` | ${api.linkedServiceMethodsCount} | \`${api.handlerClass}.${api.handlerMethod}\` |\n`;
    }
    md += `\n`;
  }

  md += `## Shared Mongo Collection Touch Points\n\n`;
  if (sharedMongoCollections.length === 0) {
    md += `*No shared Mongo collection touch points detected.*\n\n`;
  } else {
    md += `| Collection | Shared Cross-Submodule | Submodules Count | Operations | Touch Points |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const mc of sharedMongoCollections) {
      md += `| \`${mc.collectionName}\` | \`${mc.isSharedCrossSubmodule}\` | ${mc.submodulesTouchedCount} | \`${mc.operations.join(", ") || "none"}\` | ${mc.touchPointsCount} |\n`;
    }
    md += `\n`;
  }
  if (unresolvedMongoTouches.length > 0) {
    md += `*${unresolvedMongoTouches.length} additional touch point(s) use a dynamically-resolved collection name and are excluded from the table above to avoid falsely implying they share a collection.*\n\n`;
  }

  md += `## Pub/Sub Publishers & Receivers\n\n`;
  md += `*Not joined, see note in executive summary and notifications. There is no evidenced link in source between a publish call's topic name and a push route's URL path.*\n\n`;
  if (pubsubPublishers.length === 0 && pubsubReceivers.length === 0) {
    md += `*No Pub/Sub publishers or receivers detected.*\n\n`;
  } else {
    md += `### Publishers\n`;
    for (const pub of pubsubPublishers) {
      md += `- \`${pub.module}\` (submodule \`${pub.submodule}\`): \`${pub.topicValue}\` (confidence: ${pub.confidence}) at \`${pub.file}:${pub.line}\`\n`;
    }
    md += `\n### Receivers\n`;
    for (const rec of pubsubReceivers) {
      md += `- \`${rec.module}\` (submodule \`${rec.submodule}\`): \`${rec.httpPath}\` -> \`${rec.handlerClass}.${rec.handlerMethod}\` at \`${rec.file}:${rec.line}\`\n`;
    }
    md += `\n`;
  }

  md += `## Pub/Sub Operation Routing Table\n\n`;
  if (pubsubOperationRoutingTable.length === 0) {
    md += `*No Pub/Sub operation routing detected.*\n\n`;
  } else {
    md += `| Module | Handler | Operation Count | Resolved Count |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const receiver of pubsubOperationRoutingTable) {
      md += `| \`${receiver.module}\` | \`${receiver.handlerClass}.${receiver.handlerMethod}\` | ${receiver.routesCount} | ${receiver.resolvedRoutesCount} |\n`;
    }
    md += `\n`;
  }

  md += `## RBAC Requirements Matrix\n\n`;
  if (rbacRequirements.length === 0) {
    md += `*No RBAC requirements detected.*\n\n`;
  } else {
    md += `| Permission Requirement | Check Count | Sample Check File |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const rbac of rbacRequirements) {
      const sampleFile = rbac.checks[0]?.file || "unknown";
      md += `| \`${rbac.permission}\` | ${rbac.checkCount} | \`${sampleFile}\` |\n`;
    }
    md += `\n`;
  }

  const matrixMdPath = path.join(kpDir, "resolved-graph-matrix.md");
  writeMarkdownAtomically(matrixMdPath, md);

  console.log("Resolved engineering graph generated successfully.");
  console.log({
    status,
    confirmedCallEdges: confirmedCallEdges.length,
    probableCallEdges: probableCallEdges.length,
    unresolvedCalls: unresolvedCallEdges.length,
    confirmedIntraModuleCallEdges: confirmedIntraModuleCallEdges.length,
    probableIntraModuleCallEdges: probableIntraModuleCallEdges.length,
    apiEntryPoints: apiEntryPoints.length,
    rbacRequirements: rbacRequirements.length,
    sharedMongoCollections: sharedMongoCollections.length,
    unresolvedMongoTouches: unresolvedMongoTouches.length,
    pubsubPublishers: pubsubPublishers.length,
    pubsubReceivers: pubsubReceivers.length,
    pubsubOperationRoutingTable: pubsubOperationRoutingTable.length,
  });
  console.log(`Wrote ${graphJsonPath}`);
  console.log(`Wrote ${matrixMdPath}`);
}

main();
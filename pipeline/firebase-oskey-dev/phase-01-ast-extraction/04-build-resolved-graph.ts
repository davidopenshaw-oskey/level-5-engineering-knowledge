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
  const classMethods: any[] = [];
  const allCalls: any[] = [];
  const apiContracts: any[] = [];
  const firestoreTouches: any[] = [];
  const rbacFacts: any[] = [];
  const triggers: any[] = [];
  const externalHooks: any[] = [];
  const pubsubEventRoutes: any[] = [];

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
      } else if (fact.type === "class_method") {
        classMethods.push(fact);
      } else if (fact.type === "call_expression") {
        allCalls.push(fact);
      } else if (fact.type === "api_contract") {
        apiContracts.push(fact);
      } else if (fact.type === "firestore_path_touched") {
        firestoreTouches.push(fact);
      } else if (fact.type === "permission_required" || fact.type === "permission_candidate") {
        rbacFacts.push(fact);
      } else if (fact.type === "firestore_trigger") {
        triggers.push(fact);
      } else if (
        fact.type === "external_hook" ||
        fact.type === "pubsub_topic" ||
        fact.type === "pubsub_publish_call" ||
        fact.type === "http_or_client_path" ||
        fact.type === "environment_variable" ||
        fact.type === "storage_path"
      ) {
        externalHooks.push(fact);
      } else if (fact.type === "pubsub_event_route") {
        pubsubEventRoutes.push(fact);
      }
    }
  }

  // Fast service method lookup index by exact declaration file & method name
  const serviceByFileMethod = new Map<string, any[]>();
  for (const s of serviceMethods) {
    const key = `${s.file}::${s.method || s.symbol}`;
    const list = serviceByFileMethod.get(key) || [];
    list.push(s);
    serviceByFileMethod.set(key, list);
  }

  const confirmedCallEdges: any[] = [];
  const probableCallEdges: any[] = [];
  const unresolvedCallEdges: any[] = [];

  let inputCallExpressions = allCalls.length;
  let graphEligibleCallExpressions = 0;
  let nonGraphCallExpressions = 0;
  let sameModuleServiceCalls = 0;

  const confirmedEdgesMapBySourceFactId = new Map<string, any>();
  const probableEdgesMapBySourceFactId = new Map<string, any>();

  // 2. Cross-Module Service Call Resolution
  for (const call of allCalls) {
    const eligibility = classifyCallEligibility(call, serviceMethods, moduleByClass);

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
        heuristicCandidates = serviceMethods.filter(s => {
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

    // Rule C: Unresolved Candidate Record
    const distinctCandidates = (heuristicCandidates.length > 0 ? heuristicCandidates : serviceMethods.filter(s => s.method === declMethod || s.symbol === declMethod)).map(s => ({
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
  const apiEntryPoints: any[] = [];
  for (const api of apiContracts) {
    const handlerFile = api.evidence?.handlerDeclarationFile ?? api.handlerDeclarationFile ?? api.file;
    const handlerStartLine = api.evidence?.handlerStartLine ?? api.handlerStartLine ?? api.line;
    const handlerEndLine = api.evidence?.handlerEndLine ?? api.handlerEndLine ?? api.line;
    const handlerName = api.evidence?.handlerName ?? api.handlerName ?? api.value;
    const handlerResolutionStatus = api.evidence?.handlerResolutionStatus ?? api.handlerResolutionStatus ?? "unresolved";

    const handlerCalls = allCalls.filter(
      c => c.module === api.module && c.file === handlerFile && c.line >= handlerStartLine && c.line <= handlerEndLine
    );

    const linkedServiceMethods: any[] = [];
    if (handlerResolutionStatus !== "unresolved") {
      for (const callFact of handlerCalls) {
        const confirmedEdge = confirmedEdgesMapBySourceFactId.get(callFact.id);
        const probableEdge = probableEdgesMapBySourceFactId.get(callFact.id);
        const edge = confirmedEdge || probableEdge;

        if (edge) {
          linkedServiceMethods.push({
            callFactId: callFact.id,
            edgeId: edge.id,
            targetModule: edge.targetModule,
            targetFile: edge.targetFile,
            targetClass: edge.targetClass,
            targetMethod: edge.targetMethod,
            confidence: edge.confidence,
            resolutionMethod: edge.resolutionMethod,
          });
        }
      }
    }

    linkedServiceMethods.sort((a, b) => a.callFactId.localeCompare(b.callFactId));

    apiEntryPoints.push({
      id: `api-entry|${api.module}|${api.file}|${api.line}|${handlerName}`,
      module: api.module,
      file: api.file,
      line: api.line,
      contractType: api.contractType || "callable",
      handlerName,
      handlerDeclarationFile: handlerFile,
      handlerStartLine,
      handlerEndLine,
      handlerResolutionStatus,
      handlerLinkingStatus: handlerResolutionStatus === "unresolved" ? "unresolved_handler_declaration" : "resolved",
      rawHandlerCallsCount: handlerCalls.length,
      linkedServiceMethodsCount: linkedServiceMethods.length,
      linkedServiceMethods,
    });
  }

  // 4. Shared Firestore Touch Matrix
  const firestorePathMap = new Map<string, { touchPoints: any[]; operations: Set<string>; resolutionMethods: Set<string> }>();
  let firestorePathsWithoutOperationEvidence = 0;

  for (const ft of firestoreTouches) {
    const rawPath = ft.value || ft.file;
    const cleanPath = rawPath.replace(/\{[^}]+\}/g, "{param}");
    const entry = firestorePathMap.get(cleanPath) || { touchPoints: [], operations: new Set<string>(), resolutionMethods: new Set<string>() };

    if (ft.operation) entry.operations.add(ft.operation);
    if (ft.pathResolutionMethod) entry.resolutionMethods.add(ft.pathResolutionMethod);

    entry.touchPoints.push({
      module: ft.module,
      file: ft.file,
      line: ft.line,
      operation: ft.operation || null,
      // Self-describing: distinguishes "no read/write happens here"
      // (doesn't apply -- e.g. this touch is a trigger registration, not a
      // CRUD call) from "a read/write likely happens but wasn't detected"
      // (e.g. performed via transaction.get()/batch.set() on a variable
      // assigned elsewhere, which static chain analysis cannot see).
      operationDetectionScope: ft.operationDetectionScope || "undetermined_may_be_indirect",
      pathResolutionMethod: ft.pathResolutionMethod || "literal",
    });

    firestorePathMap.set(cleanPath, entry);
  }

  const firestoreSharedTouches: any[] = [];
  for (const [pathPattern, data] of firestorePathMap.entries()) {
    const modulesTouched = Array.from(new Set(data.touchPoints.map(t => t.module))).sort();
    if (data.operations.size === 0) {
      firestorePathsWithoutOperationEvidence += 1;
    }

    firestoreSharedTouches.push({
      pathPattern,
      isSharedCrossModule: modulesTouched.length > 1,
      modulesTouchedCount: modulesTouched.length,
      modulesTouched,
      operations: Array.from(data.operations).sort(),
      pathResolutionMethods: Array.from(data.resolutionMethods).sort(),
      touchPointsCount: data.touchPoints.length,
      touchPoints: data.touchPoints,
    });
  }

  // 5. Event Endpoints & Route Groups
  const eventGroupMap = new Map<string, { publishers: any[]; triggers: any[] }>();
  for (const hook of externalHooks) {
    const key = `pubsub|${hook.value}`;
    const group = eventGroupMap.get(key) || { publishers: [], triggers: [] };
    group.publishers.push({ module: hook.module, file: hook.file, line: hook.line });
    eventGroupMap.set(key, group);
  }
  for (const tr of triggers) {
    // NOTE: normalized firestore_trigger facts (script 02) store the path
    // under `value`, not `firestorePath` -- using the wrong field here
    // silently evaluated to the literal string "undefined" for every
    // trigger, collapsing all 28 real triggers into a single meaningless
    // group instead of grouping them per Firestore path as intended.
    const key = `firestore_trigger|${tr.value}`;
    const group = eventGroupMap.get(key) || { publishers: [], triggers: [] };
    group.triggers.push({ module: tr.module, file: tr.file, line: tr.line, handlerName: tr.handlerName });
    eventGroupMap.set(key, group);
  }

  const eventEndpoints: any[] = [];
  let unresolvedEventGroups = 0;

  for (const [key, data] of eventGroupMap.entries()) {
    const [tech, eventKey] = key.split("|");
    unresolvedEventGroups += 1;

    eventEndpoints.push({
      technology: tech,
      eventKey,
      // Still honestly "not_implemented" from THIS join's perspective:
      // matching a specific publisher's topic argument to the specific
      // Pub/Sub push-subscription endpoint that receives it would require
      // knowing the subscription's push config (topic -> endpoint URL
      // binding), which isn't extracted anywhere -- there is no evidenced
      // way to say "this publisher's messages end up at that receiver."
      // See pubsubEventRoutingTable below for what IS now resolved: each
      // receiver's OWN internal routing logic, independent of which
      // publisher(s) feed it.
      eventSubscriberExtractionStatus: "not_implemented",
      resolvedEventRoutes: 0,
      publishersCount: data.publishers.length,
      publishers: data.publishers,
      triggersCount: data.triggers.length,
      triggers: data.triggers,
      status: data.publishers.length > 0 && data.triggers.length === 0 ? "publisher_only" : "trigger_only",
    });
  }

  // 5b. Pub/Sub Event Routing Table (per receiver, not joined to publishers)
  // Each pubsub_event_route fact already only exists because its source
  // handler was structurally confirmed as a Pub/Sub push receiver (see
  // 01-extract-ast-evidence.ts's detectsPubSubPushEnvelope) -- so grouping
  // by sourceHandler here is a receiver-side Event Routing Table per
  // rules/00-global-synthesis-hierarchy.md Directive 5, distinct from (and
  // not resolving) the publisher/trigger correlation gap noted just above.
  const pubsubReceiverMap = new Map<string, { module: string; file: string; line: number; routes: any[] }>();
  for (const route of pubsubEventRoutes) {
    const key = `${route.module}|${route.sourceHandler}`;
    const entry = pubsubReceiverMap.get(key) || { module: route.module, file: route.file, line: route.line, routes: [] as any[] };
    entry.routes.push({
      dataType: route.dataType,
      dataTypeResolutionStatus: route.dataTypeResolutionStatus,
      targetCallsCount: (route.targetCalls || []).length,
      targetCalls: route.targetCalls || [],
    });
    pubsubReceiverMap.set(key, entry);
  }

  const pubsubEventRoutingTable: any[] = [];
  for (const [key, data] of pubsubReceiverMap.entries()) {
    const sourceHandler = key.split("|")[1];
    pubsubEventRoutingTable.push({
      module: data.module,
      file: data.file,
      line: data.line,
      sourceHandler,
      routesCount: data.routes.length,
      resolvedRoutesCount: data.routes.filter(r => r.dataTypeResolutionStatus === "resolved").length,
      routes: data.routes,
    });
  }

  // 6. RBAC Requirements Matrix
  // Previously only fact.type === "permission_required" (extraction-time
  // "confirmed") facts were included here, and permission_candidate facts
  // were silently dropped -- with no notification. In this repo that meant
  // 110 distinct real permission strings extracted at Phase 1 collapsed to
  // just 4 surfaced in the graph, because "confirmed" here only means "found
  // inside a call matching one of 8 hardcoded auth-check method names" --
  // a real, legitimate permission check outside that whitelist was
  // discarded rather than surfaced with lower confidence. Now every
  // permission requirement is retained and tagged with its confidence tier,
  // mirroring how confirmedCallEdges/probableCallEdges/unresolvedCallEdges
  // are handled -- consumers can filter by confidence, but nothing is lost
  // silently.
  const rbacMap = new Map<string, { requirement: string; checks: any[]; confidence: "confirmed" | "candidate" }>();
  let rbacCandidateCount = 0;
  for (const rbac of rbacFacts) {
    const perm = rbac.permission || rbac.value;
    const confidence: "confirmed" | "candidate" = rbac.type === "permission_required" ? "confirmed" : "candidate";
    if (confidence === "candidate") rbacCandidateCount += 1;
    const entry = rbacMap.get(perm) || { requirement: perm, checks: [] as any[], confidence };
    // If any check for this permission is confirmed, the aggregate entry is confirmed.
    if (confidence === "confirmed") entry.confidence = "confirmed";
    entry.checks.push({ module: rbac.module, file: rbac.file, line: rbac.line, contextExpression: rbac.evidence?.contextExpression || null, confidence });
    rbacMap.set(perm, entry);
  }

  const rbacRequirements: any[] = [];
  for (const [permission, data] of rbacMap.entries()) {
    rbacRequirements.push({
      permission,
      confidence: data.confidence,
      checkCount: data.checks.length,
      checks: data.checks,
    });
  }

  if (rbacCandidateCount > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "info",
      "RBAC_CANDIDATE_PERMISSIONS_INCLUDED",
      `${rbacCandidateCount} permission check(s) were extracted outside the known auth-check method whitelist and are included in rbacRequirements tagged confidence: "candidate" rather than discarded.`,
      { count: rbacCandidateCount }
    );
  }

  // Deterministic Sorting
  confirmedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  probableCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  apiEntryPoints.sort((a, b) => a.id.localeCompare(b.id));
  firestoreSharedTouches.sort((a, b) => a.pathPattern.localeCompare(b.pathPattern));
  eventEndpoints.sort((a, b) => a.eventKey.localeCompare(b.eventKey));
  pubsubEventRoutingTable.sort((a, b) => a.sourceHandler.localeCompare(b.sourceHandler));
  rbacRequirements.sort((a, b) => a.permission.localeCompare(b.permission));

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

  if (eventEndpoints.length > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "info",
      "EVENT_SUBSCRIBER_EXTRACTION_LIMITATION",
      `Event subscriber extraction status is 'not_implemented' for ${eventEndpoints.length} event endpoint group(s).`,
      { count: eventEndpoints.length }
    );
  }

  if (firestorePathsWithoutOperationEvidence > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "info",
      "FIRESTORE_OPERATION_DETECTION_LIMITATION",
      `${firestorePathsWithoutOperationEvidence} of ${firestoreSharedTouches.length} shared Firestore path(s) have no detected read/write operation. This does not necessarily mean no operation occurs: detection covers direct method chains only (e.g. db.collection(x).doc(y).get()) and cannot see operations performed via a variable assigned elsewhere and later passed into transaction.get()/batch.set()/etc, nor does it apply to trigger registrations (onCreate/onUpdate/etc, which are not CRUD operations). See operationDetectionScope on each touch point.`,
      { count: firestorePathsWithoutOperationEvidence, total: firestoreSharedTouches.length }
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
    apiEntryPointsCount: apiEntryPoints.length,
    rbacRequirementsCount: rbacRequirements.length,
    sharedFirestorePathsCount: firestoreSharedTouches.length,
    firestorePathsWithoutOperationEvidence,
    eventEndpointsCount: eventEndpoints.length,
    unresolvedEventGroups,
    pubsubReceiversCount: pubsubEventRoutingTable.length,
    pubsubEventRoutesCount: pubsubEventRoutes.length,
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
    apiEntryPoints,
    firestoreSharedTouches,
    eventEndpoints,
    pubsubEventRoutingTable,
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
  md += `- **API Entry Points**: ${apiEntryPoints.length}\n`;
  md += `- **RBAC Requirements**: ${rbacRequirements.length}\n`;
  md += `- **Shared Firestore Touch Points**: ${firestoreSharedTouches.length}\n`;
  md += `- **Event Endpoints and Candidate Route Groups**: ${eventEndpoints.length}\n`;
  md += `- **Pub/Sub Receivers with Resolved Routing**: ${pubsubEventRoutingTable.length} (${pubsubEventRoutes.length} total routes)\n\n`;

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
    md += `| Module | Handler Name | Type | Linked Services Count | Handler Declaration File |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const api of apiEntryPoints) {
      md += `| \`${api.module}\` | \`${api.handlerName}\` | \`${api.contractType}\` | ${api.linkedServiceMethodsCount} | \`${api.handlerDeclarationFile}\` |\n`;
    }
    md += `\n`;
  }

  md += `## Shared Firestore Touch Points\n\n`;
  if (firestoreSharedTouches.length === 0) {
    md += `*No shared Firestore touch points detected.*\n\n`;
  } else {
    md += `| Path Pattern | Shared Cross-Module | Modules Count | Operations | Touch Points |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const fsTouch of firestoreSharedTouches) {
      md += `| \`${fsTouch.pathPattern}\` | \`${fsTouch.isSharedCrossModule}\` | ${fsTouch.modulesTouchedCount} | \`${fsTouch.operations.join(", ") || "none"}\` | ${fsTouch.touchPointsCount} |\n`;
    }
    md += `\n`;
  }

  md += `## Event Endpoints and Candidate Route Groups\n\n`;
  if (eventEndpoints.length === 0) {
    md += `*No event endpoints detected.*\n\n`;
  } else {
    md += `| Tech | Event Key | Subscriber Extraction Status | Publishers | Triggers |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const ev of eventEndpoints) {
      md += `| \`${ev.technology}\` | \`${ev.eventKey}\` | \`${ev.eventSubscriberExtractionStatus}\` | ${ev.publishersCount} | ${ev.triggersCount} |\n`;
    }
    md += `\n`;
  }

  md += `## Pub/Sub Event Routing Table\n\n`;
  md += `*Per-receiver internal routing only -- NOT joined to the publishers/triggers above (see note on that section): there is no evidenced link from a publisher's topic argument to the specific push-subscription endpoint that receives it.*\n\n`;
  if (pubsubEventRoutingTable.length === 0) {
    md += `*No Pub/Sub push-receiver routing detected.*\n\n`;
  } else {
    md += `| Module | Source Handler | Data Type | Resolution | Target Calls |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const receiver of pubsubEventRoutingTable) {
      for (const route of receiver.routes) {
        md += `| \`${receiver.module}\` | \`${receiver.sourceHandler}\` | \`${route.dataType ?? "unresolved"}\` | \`${route.dataTypeResolutionStatus}\` | ${route.targetCallsCount} |\n`;
      }
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
    apiEntryPoints: apiEntryPoints.length,
    rbacRequirements: rbacRequirements.length,
    sharedFirestoreTouches: firestoreSharedTouches.length,
    eventEndpoints: eventEndpoints.length,
    pubsubReceivers: pubsubEventRoutingTable.length,
    pubsubEventRoutes: pubsubEventRoutes.length,
  });
  console.log(`Wrote ${graphJsonPath}`);
  console.log(`Wrote ${matrixMdPath}`);
}

main();
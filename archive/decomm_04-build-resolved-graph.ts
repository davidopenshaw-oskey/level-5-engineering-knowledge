// **version:** 3.0.0
// **location:** level-5 phase 1.75

// © Oskey SAS. All rights reserved.
// Script 04: Repository Resolved Engineering Graph Builder (Phase 1.75).
// Refactors call graph eligibility, exact compiler declaration matching, API-to-service edge linking,
// RBAC entitlement matrix, and atomic Markdown graph promotion.

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

type NotificationSeverity = "info" | "warning" | "error" | "fatal";

interface NotificationEntry {
  id: string;
  sourceScript: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  humanAttentionRecommended: boolean;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

function buildNotificationId(sourceScript: string, code: string, details?: Record<string, unknown>): string {
  const parts = [
    sourceScript,
    code,
    details?.module ? String(details.module) : "",
    details?.file ? String(details.file) : "",
    details?.missingArtifact ? String(details.missingArtifact) : "",
    details?.key ? String(details.key) : "",
  ].filter(Boolean);
  return parts.join("::").toLowerCase();
}

function addNotification(
  notifications: RunNotifications,
  sourceScript: string,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  humanAttentionRecommended = false
) {
  const id = buildNotificationId(sourceScript, code, details);
  const now = new Date().toISOString();

  const existingIdx = notifications.entries.findIndex(e => e.id === id);
  if (existingIdx >= 0) {
    const existing = notifications.entries[existingIdx];
    notifications.entries[existingIdx] = {
      ...existing,
      severity,
      message,
      details,
      updatedAt: now,
      humanAttentionRecommended: existing.humanAttentionRecommended || humanAttentionRecommended,
    };
  } else {
    notifications.entries.push({
      id,
      sourceScript,
      severity,
      code,
      message,
      details,
      createdAt: now,
      updatedAt: now,
      humanAttentionRecommended,
    });
  }

  notifications.updatedAt = now;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
    fatal: 4,
  };

  let maxSev: NotificationSeverity = "info";
  for (const entry of notifications.entries) {
    if (severityOrder[entry.severity] > severityOrder[maxSev]) {
      maxSev = entry.severity;
    }
  }
  notifications.highestSeverity = maxSev;
}

function assertNoLocalAbsolutePaths(data: unknown, contextDescription: string): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string") {
    if (
      data.includes("/Users/") ||
      data.includes("/home/") ||
      /^[a-zA-Z]:\\/.test(data) ||
      data.startsWith("file://") ||
      data.includes("output/clones")
    ) {
      throw new Error(`[Local Path Contamination] Found local absolute path '${data}' in context '${contextDescription}'.`);
    }
    return;
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      assertNoLocalAbsolutePaths(data[i], `${contextDescription}[${i}]`);
    }
    return;
  }
  if (typeof data === "object") {
    for (const key of Object.keys(data as object)) {
      assertNoLocalAbsolutePaths((data as any)[key], `${contextDescription}.${key}`);
    }
  }
}

function writeJsonAtomically(filePath: string, data: unknown, contextDescription: string) {
  assertNoLocalAbsolutePaths(data, contextDescription);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function writeMarkdownAtomically(filePath: string, content: string) {
  assertNoLocalAbsolutePaths(content, "resolved-graph-matrix.md");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.readFileSync(tmpPath, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function writeNotificationsAtomically(filePath: string, notifications: RunNotifications) {
  assertNoLocalAbsolutePaths(notifications, "run-notifications.json");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(notifications, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function loadNotifications(notificationsPath: string, expectedRunId: string, expectedRepoName: string): RunNotifications {
  if (!fs.existsSync(notificationsPath)) {
    throw new Error(`[Fail-Closed] Missing required run-notifications.json at '${notificationsPath}'.`);
  }

  let notifs: RunNotifications;
  try {
    notifs = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Malformed run-notifications.json at '${notificationsPath}': ${err.message}`);
  }

  if (notifs.runId !== expectedRunId || notifs.repoName !== expectedRepoName) {
    throw new Error(`[Fail-Closed] run-notifications.json identity mismatch: expected runId '${expectedRunId}', got '${notifs.runId}'.`);
  }

  return notifs;
}

function extractInvokedObject(expression: string): string | null {
  if (!expression) return null;
  const parts = expression
    .split(".")
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function normalizeObjectOrClassName(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  if (clean.startsWith("this.")) clean = clean.slice(5);
  if (clean.startsWith("OSK")) clean = clean.slice(3);
  if (clean.endsWith("Service")) clean = clean.slice(0, -7);
  if (clean.endsWith("Controller")) clean = clean.slice(0, -10);
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
    const isServiceClass = declClass.endsWith("Service") || declClass.endsWith("Publisher") || declClass.endsWith("Processor");
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
  const runContextPath = path.join(projectRoot, "output", "run-context.json");
  if (!fs.existsSync(runContextPath)) {
    throw new Error("[Fail-Closed] Could not find output/run-context.json. Please run `00-scan-repo` first.");
  }

  const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
  const runId: string = runContext.runId;
  const REPO_NAME: string = runContext.repoName;
  if (!REPO_NAME || !runId) {
    throw new Error("[Fail-Closed] Missing repoName or runId in output/run-context.json");
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

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
      } else if (fact.type === "permission_required") {
        rbacFacts.push(fact);
      } else if (fact.type === "firestore_trigger") {
        triggers.push(fact);
      } else if (
        fact.type === "external_hook" ||
        fact.type === "pubsub_topic" ||
        fact.type === "http_or_client_path" ||
        fact.type === "environment_variable" ||
        fact.type === "storage_path"
      ) {
        externalHooks.push(fact);
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
    const key = `firestore_trigger|${tr.firestorePath}`;
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
      eventSubscriberExtractionStatus: "not_implemented",
      resolvedEventRoutes: 0,
      publishersCount: data.publishers.length,
      publishers: data.publishers,
      triggersCount: data.triggers.length,
      triggers: data.triggers,
      status: data.publishers.length > 0 && data.triggers.length === 0 ? "publisher_only" : "trigger_only",
    });
  }

  // 6. RBAC Requirements Matrix
  const rbacMap = new Map<string, { requirement: string; checks: any[] }>();
  for (const rbac of rbacFacts) {
    const perm = rbac.permission || rbac.value;
    const entry = rbacMap.get(perm) || { requirement: perm, checks: [] as any[] };
    entry.checks.push({ module: rbac.module, file: rbac.file, line: rbac.line, contextExpression: rbac.evidence?.contextExpression || null });
    rbacMap.set(perm, entry);
  }

  const rbacRequirements: any[] = [];
  for (const [permission, data] of rbacMap.entries()) {
    rbacRequirements.push({
      permission,
      checkCount: data.checks.length,
      checks: data.checks,
    });
  }

  // Deterministic Sorting
  confirmedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  probableCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  apiEntryPoints.sort((a, b) => a.id.localeCompare(b.id));
  firestoreSharedTouches.sort((a, b) => a.pathPattern.localeCompare(b.pathPattern));
  eventEndpoints.sort((a, b) => a.eventKey.localeCompare(b.eventKey));
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
  md += `- **Event Endpoints and Candidate Route Groups**: ${eventEndpoints.length}\n\n`;

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
  });
  console.log(`Wrote ${graphJsonPath}`);
  console.log(`Wrote ${matrixMdPath}`);
}

main();

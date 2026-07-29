// **version:** 3.0.0
// **location:** level-5 phase 1.75
// © Oskey SAS. All rights reserved
//
// Script 04: Builds the Resolved Engineering Graph (Phase 1.75).
// Deterministically resolves cross-module service calls, shared Firestore paths,
// Pub/Sub event routing tables, RBAC entitlement matrices, and API entry points across all modules.

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
      data.startsWith("file://")
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
      if (key === "absolutePath") continue;
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

function writeTextAtomically(filePath: string, text: string) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, text, "utf8");
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

function readRequiredJson<T>(filePath: string, contextDescription: string, notificationsPath: string, notifications: RunNotifications): T {
  if (!fs.existsSync(filePath)) {
    addNotification(notifications, "04-build-resolved-graph", "fatal", "MISSING_REQUIRED_GRAPH_INPUT", `Missing required file '${contextDescription}' at '${filePath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required file '${contextDescription}' at '${filePath}'.`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (err: any) {
    addNotification(notifications, "04-build-resolved-graph", "fatal", "MALFORMED_GRAPH_INPUT", `Malformed JSON in required file '${contextDescription}' at '${filePath}': ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed JSON in required file '${contextDescription}' at '${filePath}'.`);
  }
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function stableId(parts: Array<string | number | null | undefined>): string {
  return parts
    .map(part => String(part ?? ""))
    .join("|")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

type ServiceMethodDef = {
  module: string;
  className: string;
  methodName: string;
  file: string;
  line: number | null;
  evidence: Record<string, any>;
};

type ResolvedCallEdge = {
  id: string;
  sourceModule: string;
  sourceFile: string;
  sourceLine: number | null;
  sourceContext: string | null;

  targetModule: string;
  targetFile: string;
  targetLine: number | null;
  targetClass: string | null;
  targetMethod: string;

  evidenceCallText: string;

  resolutionMethod: "compiler_symbol" | "import_declaration" | "unique_signature_heuristic";
  confidence: "confirmed" | "probable";

  candidateCount: number;
  evidence: Record<string, any>;
};

type UnresolvedCallEdge = {
  id: string;
  sourceModule: string;
  sourceFile: string;
  sourceLine: number | null;
  sourceContext: string | null;
  evidenceCallText: string;
  reason: "no_symbol_resolution" | "no_target_declaration" | "multiple_candidates" | "unknown_target_module" | "unsupported_call_shape";
  candidateCount: number;
  candidateSummaries: string[];
};

type SharedPathEntry = {
  pathPattern: string;
  touchingModules: string[];
  totalOccurrences: number;
  evidenceLocations: {
    module: string;
    file: string | null;
    line: number | null;
  }[];
  operationResolutionStatus: "not_available" | "partial" | "resolved";
  rawPath?: string;
  normalizationMethod?: "already_parameterized" | "compiler_dynamic_segment" | "literal";
};

type EventEndpoint = {
  id: string;
  eventKey: string;
  endpointType: "publisher" | "subscriber" | "trigger";
  module: string;
  file: string;
  line: number | null;
  symbol: string | null;
  eventTechnology: "pubsub" | "firestore" | "firebase_auth" | "notification" | "unknown";
  confidence: "confirmed" | "candidate";
  evidence: Record<string, any>;
};

type ResolvedEventRoute = {
  eventKey: string;
  publishers: EventEndpoint[];
  subscribers: EventEndpoint[];
  triggers: EventEndpoint[];
  resolutionStatus: "resolved" | "publisher_only" | "subscriber_only" | "trigger_only" | "ambiguous";
};

type RbacRequirementEntry = {
  permissionString: string;
  requiringModules: string[];
  totalOccurrences: number;
  evidenceLocations: {
    module: string;
    file: string | null;
    line: number | null;
  }[];
};

type ApiEntryPoint = {
  id: string;
  module: string;
  file: string;
  line: number | null;
  handlerName: string;
  handlerExpression: string | null;
  requestType: string | null;
  requestSchema: Record<string, string> | null;
  responseType: string | null;
  declarationFile: string | null;
  declarationModuleSpecifier: string | null;
  linkedServiceMethods: {
    targetModule: string;
    targetClass: string | null;
    targetMethod: string;
    confidence: "confirmed" | "probable";
  }[];
  evidence: Record<string, any>;
};

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
  const modulesRootDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");

  // Load Authoritative Module Inventory
  const modulesJsonPath = path.join(rawDir, "modules.json");
  const moduleInventory = readRequiredJson<{ module: string }[]>(modulesJsonPath, "facts/modules.json", notificationsPath, notifications);
  const expectedModules = unique(moduleInventory.map(m => m.module)).sort();

  if (expectedModules.length === 0) {
    addNotification(notifications, "04-build-resolved-graph", "fatal", "ZERO_MODULES_FATAL", "Authoritative modules.json inventory contains zero modules.");
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error("[Fail-Closed] Authoritative modules.json contains zero modules.");
  }

  const allFacts: any[] = [];
  const processedModules: string[] = [];

  // Validate Module Manifests & Evidence Graphs
  for (const moduleName of expectedModules) {
    const moduleDir = path.join(modulesRootDir, moduleName);
    const manifestPath = path.join(moduleDir, `${moduleName}-manifest.json`);
    const graphPath = path.join(moduleDir, `${moduleName}-evidence-graph.json`);

    const manifest = readRequiredJson<any>(manifestPath, `modules/${moduleName}/${moduleName}-manifest.json`, notificationsPath, notifications);
    const graph = readRequiredJson<{ runId?: string; module?: string; facts?: any[] }>(graphPath, `modules/${moduleName}/${moduleName}-evidence-graph.json`, notificationsPath, notifications);

    if (manifest.runId !== runId || manifest.module !== moduleName || graph.runId !== runId || graph.module !== moduleName) {
      addNotification(
        notifications,
        "04-build-resolved-graph",
        "fatal",
        "MODULE_IDENTITY_MISMATCH_FATAL",
        `Module graph or manifest identity mismatch for module [${moduleName}].`,
        { module: moduleName }
      );
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Module graph or manifest identity mismatch for '${moduleName}'.`);
    }

    processedModules.push(moduleName);
    if (graph.facts && Array.isArray(graph.facts)) {
      allFacts.push(...graph.facts);
    }
  }

  // Build service method index (one-to-many to preserve all duplicate candidates)
  const serviceMethodMap = new Map<string, ServiceMethodDef[]>();
  const serviceMethodFacts = allFacts.filter(f => f.type === "service_method");

  for (const f of serviceMethodFacts) {
    const className = f.className || "GlobalService";
    const methodName = f.method || "unknown";
    const fullKey = `${className}.${methodName}`.toLowerCase();

    const def: ServiceMethodDef = {
      module: f.module,
      className,
      methodName,
      file: f.file || "",
      line: f.line ?? null,
      evidence: f.evidence ?? {},
    };

    if (!serviceMethodMap.has(fullKey)) {
      serviceMethodMap.set(fullKey, []);
    }
    serviceMethodMap.get(fullKey)!.push(def);
  }

  // Resolve Cross-Module Calls
  const callFacts = allFacts.filter(f => f.type === "call_expression");
  const resolvedCallEdges: ResolvedCallEdge[] = [];
  const unresolvedCallEdges: UnresolvedCallEdge[] = [];
  const edgeSet = new Set<string>();

  for (const callFact of callFacts) {
    const sourceModule = callFact.module;
    const sourceFile = callFact.file || "";
    const sourceLine = callFact.line ?? null;
    const calleeText = (callFact.value || "").trim();
    const ev = callFact.evidence ?? {};

    if (!sourceModule || !calleeText) continue;

    const parts = calleeText.split(".");
    if (parts.length < 2) {
      unresolvedCallEdges.push({
        id: stableId(["unresolved-call", sourceModule, sourceFile, sourceLine, calleeText]),
        sourceModule,
        sourceFile,
        sourceLine,
        sourceContext: ev.callerName || "UnknownCaller",
        evidenceCallText: calleeText,
        reason: "unsupported_call_shape",
        candidateCount: 0,
        candidateSummaries: [],
      });
      continue;
    }

    const methodName = parts[parts.length - 1];
    const objectName = parts[parts.length - 2];
    const fullKey = `${objectName}.${methodName}`.toLowerCase();

    // Check if compiler-resolved declaration file exists
    let candidates: ServiceMethodDef[] = [];
    let isCompilerConfirmed = false;

    if (ev.declarationFile && ev.declarationMethod) {
      // Find candidate matching declaration file & method
      for (const [key, defs] of serviceMethodMap.entries()) {
        for (const def of defs) {
          if (def.module !== sourceModule && def.file === ev.declarationFile && def.methodName.toLowerCase() === ev.declarationMethod.toLowerCase()) {
            candidates.push(def);
            isCompilerConfirmed = true;
          }
        }
      }
    }

    if (candidates.length === 0 && serviceMethodMap.has(fullKey)) {
      candidates = serviceMethodMap.get(fullKey)!.filter(c => c.module !== sourceModule);
    }

    if (candidates.length === 0) {
      for (const [key, defs] of serviceMethodMap.entries()) {
        for (const def of defs) {
          if (def.module !== sourceModule && def.methodName.toLowerCase() === methodName.toLowerCase()) {
            const targetClassClean = def.className.toLowerCase().replace(/^osk/, "");
            const objectNameClean = objectName.toLowerCase().replace(/^osk/, "").replace(/service$/, "");
            if (targetClassClean === objectNameClean) {
              candidates.push(def);
            }
          }
        }
      }
    }

    const uniqueCandidates = candidates.filter((c, index, self) =>
      index === self.findIndex(t => t.module === c.module && t.className === c.className && t.methodName === c.methodName)
    );

    if (uniqueCandidates.length === 1) {
      const targetDef = uniqueCandidates[0];
      const edgeId = stableId(["call-edge", sourceModule, sourceFile, sourceLine, targetDef.module, targetDef.className, targetDef.methodName]);

      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);

        let confidence: ResolvedCallEdge["confidence"] = "probable";
        let resolutionMethod: ResolvedCallEdge["resolutionMethod"] = "unique_signature_heuristic";

        if (isCompilerConfirmed || (ev.calleeSymbol && ev.declarationFile)) {
          confidence = "confirmed";
          resolutionMethod = "compiler_symbol";
        } else if (ev.declarationModuleSpecifier || ev.importedFrom) {
          confidence = "confirmed";
          resolutionMethod = "import_declaration";
        } else {
          confidence = "probable";
          resolutionMethod = "unique_signature_heuristic";
        }

        resolvedCallEdges.push({
          id: edgeId,
          sourceModule,
          sourceFile,
          sourceLine,
          sourceContext: ev.callerName || "UnknownCaller",
          targetModule: targetDef.module,
          targetFile: targetDef.file,
          targetLine: targetDef.line,
          targetClass: targetDef.className,
          targetMethod: targetDef.methodName,
          evidenceCallText: calleeText,
          resolutionMethod,
          confidence,
          candidateCount: 1,
          evidence: {
            sourceCallExpression: calleeText,
            resolvedDeclarationFile: targetDef.file,
            resolvedDeclarationLine: targetDef.line,
            resolvedDeclarationClass: targetDef.className,
            resolvedDeclarationMethod: targetDef.methodName,
          },
        });
      }
    } else if (uniqueCandidates.length > 1) {
      unresolvedCallEdges.push({
        id: stableId(["unresolved-call", sourceModule, sourceFile, sourceLine, calleeText]),
        sourceModule,
        sourceFile,
        sourceLine,
        sourceContext: ev.callerName || "UnknownCaller",
        evidenceCallText: calleeText,
        reason: "multiple_candidates",
        candidateCount: uniqueCandidates.length,
        candidateSummaries: uniqueCandidates.map(c => `${c.module}:${c.className}.${c.methodName}`),
      });
    } else {
      unresolvedCallEdges.push({
        id: stableId(["unresolved-call", sourceModule, sourceFile, sourceLine, calleeText]),
        sourceModule,
        sourceFile,
        sourceLine,
        sourceContext: ev.callerName || "UnknownCaller",
        evidenceCallText: calleeText,
        reason: "no_target_declaration",
        candidateCount: 0,
        candidateSummaries: [],
      });
    }
  }

  resolvedCallEdges.sort((a, b) => a.id.localeCompare(b.id));
  unresolvedCallEdges.sort((a, b) => a.id.localeCompare(b.id));

  // Resolve Shared Firestore Paths
  const firestoreFacts = allFacts.filter(f => f.type === "firestore_path_touched");
  const pathMap = new Map<string, { modules: Set<string>; count: number; locations: Array<{ module: string; file: string | null; line: number | null }> }>();

  for (const f of firestoreFacts) {
    const rawPath = f.value || "";
    const moduleName = f.module;
    if (!rawPath || !moduleName) continue;

    const pathPattern = rawPath.startsWith("/") ? rawPath : "/" + rawPath;

    if (!pathMap.has(pathPattern)) {
      pathMap.set(pathPattern, { modules: new Set(), count: 0, locations: [] });
    }

    const entry = pathMap.get(pathPattern)!;
    entry.modules.add(moduleName);
    entry.count++;
    entry.locations.push({
      module: moduleName,
      file: f.file ?? null,
      line: f.line ?? null,
    });
  }

  const sharedFirestorePaths: SharedPathEntry[] = [];
  for (const [pathPattern, data] of pathMap.entries()) {
    sharedFirestorePaths.push({
      pathPattern,
      touchingModules: Array.from(data.modules).sort(),
      totalOccurrences: data.count,
      evidenceLocations: data.locations,
      operationResolutionStatus: "not_available",
      rawPath: pathPattern,
      normalizationMethod: pathPattern.includes("{") ? "already_parameterized" : "literal",
    });
  }
  sharedFirestorePaths.sort((a, b) => a.pathPattern.localeCompare(b.pathPattern));

  // Build Event Endpoints & Event Routes
  const eventEndpoints: EventEndpoint[] = [];
  const triggerFacts = allFacts.filter(f => f.type === "firestore_trigger");
  const pubsubFacts = allFacts.filter(f => f.type === "pubsub_topic");

  for (const trig of triggerFacts) {
    const eventKey = `firestore|${trig.value || "unknown_trigger"}`;
    eventEndpoints.push({
      id: stableId(["event-endpoint", eventKey, "trigger", trig.module, trig.file, trig.line]),
      eventKey,
      endpointType: "trigger",
      module: trig.module,
      file: trig.file || "",
      line: trig.line ?? null,
      symbol: trig.symbol ?? trig.method ?? null,
      eventTechnology: "firestore",
      confidence: "confirmed",
      evidence: trig.evidence ?? {},
    });
  }

  for (const ps of pubsubFacts) {
    const eventKey = `pubsub|${ps.value || "unknown_topic"}`;
    eventEndpoints.push({
      id: stableId(["event-endpoint", eventKey, "publisher", ps.module, ps.file, ps.line]),
      eventKey,
      endpointType: "publisher",
      module: ps.module,
      file: ps.file || "",
      line: ps.line ?? null,
      symbol: ps.symbol ?? null,
      eventTechnology: "pubsub",
      confidence: "confirmed",
      evidence: ps.evidence ?? {},
    });
  }

  eventEndpoints.sort((a, b) => a.id.localeCompare(b.id));

  // Group endpoints into resolved event routes
  const routeMap = new Map<string, { publishers: EventEndpoint[]; subscribers: EventEndpoint[]; triggers: EventEndpoint[] }>();

  for (const ep of eventEndpoints) {
    if (!routeMap.has(ep.eventKey)) {
      routeMap.set(ep.eventKey, { publishers: [], subscribers: [], triggers: [] });
    }
    const r = routeMap.get(ep.eventKey)!;
    if (ep.endpointType === "publisher") r.publishers.push(ep);
    else if (ep.endpointType === "subscriber") r.subscribers.push(ep);
    else if (ep.endpointType === "trigger") r.triggers.push(ep);
  }

  const resolvedEventRoutes: ResolvedEventRoute[] = [];

  for (const [eventKey, group] of routeMap.entries()) {
    let resolutionStatus: ResolvedEventRoute["resolutionStatus"] = "ambiguous";
    if (group.publishers.length > 0 && (group.subscribers.length > 0 || group.triggers.length > 0)) {
      resolutionStatus = "resolved";
    } else if (group.publishers.length > 0) {
      resolutionStatus = "publisher_only";
    } else if (group.subscribers.length > 0) {
      resolutionStatus = "subscriber_only";
    } else if (group.triggers.length > 0) {
      resolutionStatus = "trigger_only";
    }

    resolvedEventRoutes.push({
      eventKey,
      publishers: group.publishers,
      subscribers: group.subscribers,
      triggers: group.triggers,
      resolutionStatus,
    });
  }
  resolvedEventRoutes.sort((a, b) => a.eventKey.localeCompare(b.eventKey));

  // Count all non-resolved routes as unresolved
  const unresolvedEventGroups = resolvedEventRoutes.filter(r => r.resolutionStatus !== "resolved").length;

  // Resolve RBAC Entitlement Matrix
  const reqPermFacts = allFacts.filter(f => f.type === "permission_required");
  const rbacMap = new Map<string, { modules: Set<string>; count: number; locations: Array<{ module: string; file: string | null; line: number | null }> }>();

  for (const f of reqPermFacts) {
    const permStr = f.value;
    const moduleName = f.module;
    if (!permStr || !moduleName) continue;

    if (!rbacMap.has(permStr)) {
      rbacMap.set(permStr, { modules: new Set(), count: 0, locations: [] });
    }

    const entry = rbacMap.get(permStr)!;
    entry.modules.add(moduleName);
    entry.count++;
    entry.locations.push({
      module: moduleName,
      file: f.file ?? null,
      line: f.line ?? null,
    });
  }

  const resolvedRbacMatrix: RbacRequirementEntry[] = [];
  for (const [permStr, data] of rbacMap.entries()) {
    resolvedRbacMatrix.push({
      permissionString: permStr,
      requiringModules: Array.from(data.modules).sort(),
      totalOccurrences: data.count,
      evidenceLocations: data.locations,
    });
  }
  resolvedRbacMatrix.sort((a, b) => a.permissionString.localeCompare(b.permissionString));

  // Resolve API Entry Points
  const apiFacts = allFacts.filter(f => f.type === "api_contract");
  const apiEntryPoints: ApiEntryPoint[] = [];

  for (const f of apiFacts) {
    const handlerName = f.value || "unknown_handler";
    const ev = f.evidence ?? {};
    const entryId = stableId(["api-entry", f.module, f.file, f.line, handlerName]);

    // Context-aware linking: match call edges occurring in the same file & function context
    const linkedServiceMethods: ApiEntryPoint["linkedServiceMethods"] = [];
    const matchedEdges = resolvedCallEdges.filter(e => e.sourceModule === f.module && e.sourceFile === f.file && e.sourceContext === handlerName);

    for (const matchedEdge of matchedEdges) {
      linkedServiceMethods.push({
        targetModule: matchedEdge.targetModule,
        targetClass: matchedEdge.targetClass,
        targetMethod: matchedEdge.targetMethod,
        confidence: matchedEdge.confidence,
      });
    }

    apiEntryPoints.push({
      id: entryId,
      module: f.module,
      file: f.file || "",
      line: f.line ?? null,
      handlerName,
      handlerExpression: ev.handlerExpression ?? null,
      requestType: ev.requestType ?? null,
      requestSchema: ev.requestSchema ?? null,
      responseType: ev.responseType ?? null,
      declarationFile: ev.declarationFile ?? null,
      declarationModuleSpecifier: ev.declarationModule ?? null,
      linkedServiceMethods,
      evidence: ev,
    });
  }
  apiEntryPoints.sort((a, b) => a.id.localeCompare(b.id));

  // Quality Summary & Overall Status
  const confirmedEdges = resolvedCallEdges.filter(e => e.confidence === "confirmed");
  const probableEdges = resolvedCallEdges.filter(e => e.confidence === "probable");
  const ambiguousCount = unresolvedCallEdges.filter(e => e.reason === "multiple_candidates").length;

  if (unresolvedCallEdges.length > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "warning",
      "UNRESOLVED_CALLS_WARNING",
      `${unresolvedCallEdges.length} cross-module call expression(s) could not be deterministically resolved to a single target declaration.`,
      { count: unresolvedCallEdges.length, ambiguousCount }
    );
  }

  const humanAttentionRecommended = notifications.entries.some(
    e => e.humanAttentionRecommended || e.severity === "error" || e.severity === "warning" || e.severity === "fatal"
  );

  const status = notifications.highestSeverity === "fatal" || notifications.highestSeverity === "error"
    ? "failed"
    : (humanAttentionRecommended || unresolvedCallEdges.length > 0)
      ? "completed_with_warnings"
      : "complete";

  const quality = {
    status,
    highestNotificationSeverity: notifications.highestSeverity,
    confirmedCallEdges: confirmedEdges.length,
    probableCallEdges: probableEdges.length,
    ambiguousCalls: ambiguousCount,
    unresolvedCalls: unresolvedCallEdges.length,
    sharedFirestorePaths: sharedFirestorePaths.length,
    firestorePathsWithoutOperationEvidence: sharedFirestorePaths.length,
    eventSubscriberExtractionStatus: "not_implemented",
    resolvedEventRoutes: resolvedEventRoutes.filter(r => r.resolutionStatus === "resolved").length,
    unresolvedEventGroups,
    rbacRequirements: resolvedRbacMatrix.length,
    apiEntryPoints: apiEntryPoints.length,
  };

  const inputFactsByType: Record<string, number> = {};
  for (const f of allFacts) {
    inputFactsByType[f.type] = (inputFactsByType[f.type] ?? 0) + 1;
  }

  // Write Artifact 1: resolved-engineering-graph.json
  const resolvedGraphArtifact = {
    schemaVersion: "1.0.0",
    metadata: {
      runId,
      repoName: REPO_NAME,
      generatedAt: new Date().toISOString(),
      sourceModulesExpected: expectedModules.length,
      sourceModulesProcessed: processedModules.length,
      inputFactsProcessed: allFacts.length,
      inputFactsByType,
    },
    quality,
    resolvedCallEdges,
    unresolvedCallEdges,
    sharedFirestorePaths,
    eventEndpoints,
    resolvedEventRoutes,
    resolvedRbacMatrix,
    apiEntryPoints,
  };

  const resolvedJsonPath = path.join(kpDir, "resolved-engineering-graph.json");
  writeJsonAtomically(resolvedJsonPath, resolvedGraphArtifact, "knowledge-pipeline/resolved-engineering-graph.json");

  // Write Artifact 2: resolved-graph-matrix.md
  const markdownMatrix = `<!-- © Oskey SAS. All rights reserved. -->

# Level 5 Engineering Knowledge: Resolved Engineering Graph Matrix

*© Oskey SAS. All rights reserved.*

---

## Metadata & Quality Status

| Property | Value |
| :--- | :--- |
| **Repository** | \`${REPO_NAME}\` |
| **Run ID** | \`${runId}\` |
| **Overall Graph Status** | \`${status}\` |
| **Highest Notification Severity** | \`${notifications.highestSeverity}\` |
| **Processed Modules** | ${processedModules.length} / ${expectedModules.length} |
| **Processed Facts** | ${allFacts.length} Facts |
| **Confirmed Cross-Module Calls** | ${confirmedEdges.length} Edges |
| **Probable Cross-Module Calls** | ${probableEdges.length} Edges |
| **Unresolved Calls** | ${unresolvedCallEdges.length} Calls |
| **Shared Firestore Paths** | ${sharedFirestorePaths.length} Collection Paths |
| **Resolved Event Routes** | ${resolvedEventRoutes.filter(r => r.resolutionStatus === "resolved").length} Routes |
| **Unresolved Event Groups** | ${unresolvedEventGroups} Groups |
| **RBAC Permission Checks** | ${resolvedRbacMatrix.length} Checks |
| **API Entry Points** | ${apiEntryPoints.length} Handlers |
| **Generated Date** | ${new Date().toISOString().split("T")[0]} |

---

## 1. Confirmed Cross-Module Method Calls (${confirmedEdges.length} Edges)

| ID | Source Module | Source Context | Target Module | Target Class | Target Method | Resolution Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${confirmedEdges.slice(0, 50).map(e => `| \`${e.id}\` | \`${e.sourceModule}\` | \`${e.sourceContext ?? "unknown"}\` | \`${e.targetModule}\` | \`${e.targetClass ?? "none"}\` | \`${e.targetMethod}\` | \`${e.resolutionMethod}\` |`).join("\n")}
${confirmedEdges.length > 50 ? `\n*Showing first 50 of ${confirmedEdges.length} entries. Full evidence available in resolved-engineering-graph.json.*\n` : ""}

---

## 2. Probable Cross-Module Method Calls (${probableEdges.length} Edges)

| ID | Source Module | Source Context | Target Module | Target Class | Target Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
${probableEdges.slice(0, 50).map(e => `| \`${e.id}\` | \`${e.sourceModule}\` | \`${e.sourceContext ?? "unknown"}\` | \`${e.targetModule}\` | \`${e.targetClass ?? "none"}\` | \`${e.targetMethod}\` |`).join("\n")}
${probableEdges.length > 50 ? `\n*Showing first 50 of ${probableEdges.length} entries. Full evidence available in resolved-engineering-graph.json.*\n` : ""}

---

## 3. Unresolved & Ambiguous Calls Summary (${unresolvedCallEdges.length} Calls)

| Source Module | Source File | Line | Expression | Reason | Candidates |
| :--- | :--- | :--- | :--- | :--- | :--- |
${unresolvedCallEdges.slice(0, 50).map(e => `| \`${e.sourceModule}\` | \`${e.sourceFile}\` | ${e.sourceLine ?? "-"} | \`${e.evidenceCallText}\` | \`${e.reason}\` | ${e.candidateCount} |`).join("\n")}
${unresolvedCallEdges.length > 50 ? `\n*Showing first 50 of ${unresolvedCallEdges.length} entries. Full evidence available in resolved-engineering-graph.json.*\n` : ""}

---

## 4. Shared Firestore Collection Paths (${sharedFirestorePaths.length} Paths)

| Firestore Path Pattern | Touching Modules | Total Occurrences | Operation Status |
| :--- | :--- | :--- | :--- |
${sharedFirestorePaths.map(p => `| \`${p.pathPattern}\` | ${p.touchingModules.map(m => `\`${m}\``).join(", ")} | ${p.totalOccurrences} | \`${p.operationResolutionStatus}\` |`).join("\n")}

---

## 5. Event Routing Table (${resolvedEventRoutes.length} Routes)

| Topic / Event Key | Route Status | Publishers | Subscribers | Triggers |
| :--- | :--- | :--- | :--- | :--- |
${resolvedEventRoutes.map(r => `| \`${r.eventKey}\` | \`${r.resolutionStatus}\` | ${r.publishers.map(p => `\`${p.module}\``).join(", ") || "None"} | ${r.subscribers.map(s => `\`${s.module}\``).join(", ") || "None"} | ${r.triggers.map(t => `\`${t.module}\``).join(", ") || "None"} |`).join("\n")}

---

## 6. RBAC Entitlement Matrix (${resolvedRbacMatrix.length} Requirements)

| Permission String | Requiring Modules | Total Occurrences |
| :--- | :--- | :--- |
${resolvedRbacMatrix.slice(0, 50).map(p => `| \`${p.permissionString}\` | ${p.requiringModules.map(m => `\`${m}\``).join(", ")} | ${p.totalOccurrences} |`).join("\n")}
${resolvedRbacMatrix.length > 50 ? `\n*Showing first 50 of ${resolvedRbacMatrix.length} entries. Full evidence available in resolved-engineering-graph.json.*\n` : ""}

---

## 7. API Entry-Point Handlers (${apiEntryPoints.length} Endpoints)

| ID | Module | Handler Name | Request Type | Response Type | Linked Service Methods |
| :--- | :--- | :--- | :--- | :--- | :--- |
${apiEntryPoints.map(a => `| \`${a.id}\` | \`${a.module}\` | \`${a.handlerName}\` | \`${a.requestType ?? "any"}\` | \`${a.responseType ?? "void"}\` | ${a.linkedServiceMethods.map(l => `\`${l.targetModule}:${l.targetMethod}\``).join(", ") || "None"} |`).join("\n")}

---

## 8. Resolution Limitations & Quality Notes

* **Confirmed vs Probable Edges**: Confirmed edges are backed strictly by compiler symbol or import declaration identity. Probable edges use a unique constrained signature fallback.
* **Firestore Operations**: Operations without explicit write/read evidence remain \`not_available\`.
* **Event Subscriber Extraction**: Subscriber extraction status is \`not_implemented\`.
* **Notifications**: Complete pipeline diagnostic log is recorded in \`run-notifications.json\`.
`;

  const resolvedMdPath = path.join(kpDir, "resolved-graph-matrix.md");
  writeTextAtomically(resolvedMdPath, markdownMatrix);

  // Completion Notifications
  addNotification(
    notifications,
    "04-build-resolved-graph",
    "info",
    "GRAPH_RESOLUTION_COMPLETED",
    `Phase 1.75 graph resolution completed with status [${status}].`
  );
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Phase 1.75 completed with status: [${status}]`);
  console.log(`   - JSON Artifact: ${resolvedJsonPath}`);
  console.log(`   - Markdown Matrix: ${resolvedMdPath}`);
  console.log(`   - Confirmed Cross-Module Calls: ${confirmedEdges.length}`);
  console.log(`   - Probable Cross-Module Calls: ${probableEdges.length}`);
  console.log(`   - Unresolved Calls: ${unresolvedCallEdges.length}`);
  console.log(`   - Shared Firestore Paths: ${sharedFirestorePaths.length}`);
  console.log(`   - Event Endpoints: ${eventEndpoints.length}`);
  console.log(`   - Resolved Event Routes: ${resolvedEventRoutes.length}`);
  console.log(`   - Unresolved Event Groups: ${unresolvedEventGroups}`);
  console.log(`   - RBAC Requirements: ${resolvedRbacMatrix.length}`);
  console.log(`   - API Entry Points: ${apiEntryPoints.length}`);
  console.log(`   - Highest Notification Severity: ${notifications.highestSeverity}`);
}

main();

// **version:** 3.0.0
// **location:** level-5 phase 1.75

// © Oskey SAS. All rights reserved.
// Script 04: Resolved Engineering Graph Builder (Phase 1.75).
// Synthesizes cross-module call edges, links API entry points by handler range,
// computes the RBAC matrix and shared Firestore touch points, and exports the final graph.

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

function normalizeObjectOrClassName(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  if (clean.startsWith("this.")) clean = clean.slice(5);
  if (clean.startsWith("OSK")) clean = clean.slice(3);
  if (clean.endsWith("Service")) clean = clean.slice(0, -7);
  if (clean.endsWith("Controller")) clean = clean.slice(0, -10);
  return clean.toLowerCase();
}

type CandidateDeclaration = {
  factId: string;
  module: string;
  file: string;
  line: number;
  className: string;
  methodName: string;
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
  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, "04-build-resolved-graph", "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");

  const allModuleFacts: any[] = [];
  const moduleFactMap = new Map<string, any[]>();

  // 1. Validate all module manifests & evidence graphs
  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    const modManifestPath = path.join(modDir, `${moduleName}-manifest.json`);
    const modGraphPath = path.join(modDir, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(modManifestPath) || !fs.existsSync(modGraphPath)) {
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Missing manifest or graph for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Missing output for module '${moduleName}'.`);
    }

    let manifest: any;
    let graph: any;
    try {
      manifest = JSON.parse(fs.readFileSync(modManifestPath, "utf8"));
      graph = JSON.parse(fs.readFileSync(modGraphPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Malformed manifest or graph JSON for module '${moduleName}': ${err.message}`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Malformed JSON for module '${moduleName}'.`);
    }

    if (
      manifest.runId !== runId ||
      manifest.repoName !== REPO_NAME ||
      manifest.module !== moduleName ||
      graph.runId !== runId ||
      graph.repoName !== REPO_NAME ||
      graph.module !== moduleName ||
      !Array.isArray(graph.facts) ||
      !graph.summary ||
      graph.summary.totalFacts !== graph.facts.length
    ) {
      addNotification(notifications, "04-build-resolved-graph", "fatal", "INVALID_MODULE_GRAPH_FATAL", `Module graph validation failed for module '${moduleName}'.`, { module: moduleName });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[INVALID_MODULE_GRAPH_FATAL] Module graph validation failed for '${moduleName}'.`);
    }

    moduleFactMap.set(moduleName, graph.facts);
    allModuleFacts.push(...graph.facts);
  }

  // 2. Separate Method Indexes
  const serviceMethodFacts = allModuleFacts.filter(f => f.type === "service_method");
  const controllerMethodFacts = allModuleFacts.filter(f => f.type === "controller_method");
  const classMethodFacts = allModuleFacts.filter(f => f.type === "class_method");

  // Index service methods by declarationFile + methodName
  const serviceByFileAndMethod = new Map<string, any[]>();
  for (const sm of serviceMethodFacts) {
    const key = `${sm.file}:${sm.method}`;
    if (!serviceByFileAndMethod.has(key)) serviceByFileAndMethod.set(key, []);
    serviceByFileAndMethod.get(key)!.push(sm);
  }

  // Index service methods by normalized className + methodName
  const serviceByNormalizedClassAndMethod = new Map<string, any[]>();
  for (const sm of serviceMethodFacts) {
    const normClass = normalizeObjectOrClassName(sm.className);
    const key = `${normClass}:${sm.method}`;
    if (!serviceByNormalizedClassAndMethod.has(key)) serviceByNormalizedClassAndMethod.set(key, []);
    serviceByNormalizedClassAndMethod.get(key)!.push(sm);
  }

  const confirmedCallEdges: any[] = [];
  const probableCallEdges: any[] = [];
  const unresolvedCallEdges: any[] = [];

  // 3. Resolve Cross-Module Call Edges
  const allCalls = allModuleFacts.filter(f => f.type === "call_expression");

  for (const call of allCalls) {
    const calleeExpr = call.calleeExpression || call.value || "";
    const methodName = call.declarationMethod || call.symbol || call.value.split(".").pop() || "";

    // Candidate match resolution
    let selectedMatch: any = null;
    let matchMethod: "compiler_declaration" | "import_declaration" | "unique_signature" | null = null;
    let candidateList: CandidateDeclaration[] = [];

    // Attempt 1: Exact compiler declaration match
    if (call.declarationFile && call.declarationMethod) {
      const key = `${call.declarationFile}:${call.declarationMethod}`;
      const matches = serviceByFileAndMethod.get(key) || [];
      if (matches.length === 1) {
        selectedMatch = matches[0];
        matchMethod = "compiler_declaration";
      } else if (matches.length > 1) {
        candidateList = matches.map(m => ({
          factId: m.id,
          module: m.module,
          file: m.file,
          line: m.line,
          className: m.className,
          methodName: m.method,
        }));
      }
    }

    // Attempt 2: Import declaration match
    if (!selectedMatch && call.declarationModuleSpecifier) {
      const matches = serviceMethodFacts.filter(sm => sm.file.includes(call.declarationModuleSpecifier) && sm.method === methodName);
      if (matches.length === 1) {
        selectedMatch = matches[0];
        matchMethod = "import_declaration";
      } else if (matches.length > 1 && candidateList.length === 0) {
        candidateList = matches.map(m => ({
          factId: m.id,
          module: m.module,
          file: m.file,
          line: m.line,
          className: m.className,
          methodName: m.method,
        }));
      }
    }

    // Attempt 3: Unique signature heuristic fallback
    if (!selectedMatch && candidateList.length === 0) {
      const objClass = calleeExpr.includes(".") ? calleeExpr.split(".")[0] : call.callerClass || "";
      const normObj = normalizeObjectOrClassName(objClass);
      const key = `${normObj}:${methodName}`;
      const matches = serviceByNormalizedClassAndMethod.get(key) || [];

      if (matches.length === 1) {
        selectedMatch = matches[0];
        matchMethod = "unique_signature";
      } else {
        candidateList = matches.map(m => ({
          factId: m.id,
          module: m.module,
          file: m.file,
          line: m.line,
          className: m.className,
          methodName: m.method,
        }));
      }
    }

    const isCrossModule = selectedMatch && selectedMatch.module !== call.module;

    if (selectedMatch && (matchMethod === "compiler_declaration" || matchMethod === "import_declaration")) {
      const edge = {
        id: `call-edge|${call.module}|${call.file}|${call.line}|${selectedMatch.module}|${selectedMatch.className}|${selectedMatch.method}`,
        sourceModule: call.module,
        sourceFile: call.file,
        sourceLine: call.line,
        sourceContext: call.callerName || "anonymous",
        targetModule: selectedMatch.module,
        targetFile: selectedMatch.file,
        targetLine: selectedMatch.line,
        targetClass: selectedMatch.className,
        targetMethod: selectedMatch.method,
        evidenceCallText: call.value,
        resolutionMethod: matchMethod === "compiler_declaration" ? "compiler_symbol" : "import_declaration",
        confidence: "confirmed",
        candidateCount: 1,
        evidence: {
          targetFactId: selectedMatch.id,
          sourceCallExpression: call.value,
          resolvedDeclarationFile: selectedMatch.file,
          resolvedDeclarationLine: selectedMatch.line,
          resolvedDeclarationClass: selectedMatch.className,
          resolvedDeclarationMethod: selectedMatch.method,
        },
      };

      if (isCrossModule) {
        confirmedCallEdges.push(edge);
      }
    } else if (selectedMatch && matchMethod === "unique_signature") {
      const edge = {
        id: `call-edge|${call.module}|${call.file}|${call.line}|${selectedMatch.module}|${selectedMatch.className}|${selectedMatch.method}`,
        sourceModule: call.module,
        sourceFile: call.file,
        sourceLine: call.line,
        sourceContext: call.callerName || "anonymous",
        targetModule: selectedMatch.module,
        targetFile: selectedMatch.file,
        targetLine: selectedMatch.line,
        targetClass: selectedMatch.className,
        targetMethod: selectedMatch.method,
        evidenceCallText: call.value,
        resolutionMethod: "unique_signature_heuristic",
        confidence: "probable",
        candidateCount: 1,
        evidence: {
          targetFactId: selectedMatch.id,
          sourceCallExpression: call.value,
          resolvedDeclarationFile: selectedMatch.file,
          resolvedDeclarationLine: selectedMatch.line,
          resolvedDeclarationClass: selectedMatch.className,
          resolvedDeclarationMethod: selectedMatch.method,
        },
      };

      if (isCrossModule) {
        probableCallEdges.push(edge);
      }
    } else {
      unresolvedCallEdges.push({
        id: `unresolved-call|${call.module}|${call.file}|${call.line}|${call.value}`,
        sourceModule: call.module,
        sourceFile: call.file,
        sourceLine: call.line,
        sourceContext: call.callerName || "anonymous",
        evidenceCallText: call.value,
        reason: candidateList.length > 1 ? "multiple_candidates" : "no_target_declaration",
        candidateCount: candidateList.length,
        candidateSummaries: candidateList,
      });
    }
  }

  // 4. API-to-Service Linking by Handler Range
  const apiContracts = allModuleFacts.filter(f => f.type === "api_contract");
  const apiEntryPoints: any[] = [];

  for (const api of apiContracts) {
    const handlerFile = api.evidence?.handlerDeclarationFile || api.file;
    const startLine = api.handlerStartLine || api.line;
    const endLine = api.handlerEndLine || api.line;

    // Match calls in same module, same handler file, within handler range
    const linkedCalls = allCalls.filter(
      c => c.module === api.module && c.file === handlerFile && c.line >= startLine && c.line <= endLine
    );

    apiEntryPoints.push({
      id: `api-entry|${api.module}|${api.file}|${api.line}|${api.handlerName}`,
      module: api.module,
      file: api.file,
      line: api.line,
      contractType: api.contractType || "callable",
      handlerName: api.handlerName,
      handlerStartLine: startLine,
      handlerEndLine: endLine,
      linkedCallsCount: linkedCalls.length,
      linkedCalls: linkedCalls.map(c => ({
        file: c.file,
        line: c.line,
        expression: c.value,
      })),
    });
  }

  // 5. Firestore Shared-Touch Matrix
  const firestoreFacts = allModuleFacts.filter(f => f.type === "firestore_path_touched");
  const pathGroupMap = new Map<string, any>();

  for (const f of firestoreFacts) {
    const pathVal = f.value;
    if (!pathGroupMap.has(pathVal)) {
      pathGroupMap.set(pathVal, {
        pathPattern: pathVal,
        pathResolutionMethod: f.pathResolutionMethod || "literal",
        touchingModules: new Set<string>(),
        touchingFiles: new Set<string>(),
        operations: new Set<string>(),
        evidenceCount: 0,
      });
    }
    const group = pathGroupMap.get(pathVal)!;
    group.touchingModules.add(f.module);
    group.touchingFiles.add(`${f.file}:${f.line}`);
    if (f.operation) group.operations.add(f.operation);
    group.evidenceCount += 1;
  }

  const firestoreSharedTouches = Array.from(pathGroupMap.values()).map(g => ({
    pathPattern: g.pathPattern,
    pathResolutionMethod: g.pathResolutionMethod,
    touchingModules: Array.from(g.touchingModules).sort(),
    touchingFilesCount: g.touchingFiles.size,
    operations: Array.from(g.operations).sort(),
    evidenceCount: g.evidenceCount,
  }));

  // 6. Event Endpoints and Candidate Route Groups
  const pubsubFacts = allModuleFacts.filter(f => f.type === "pubsub_topic");
  const triggerFacts = allModuleFacts.filter(f => f.type === "firestore_trigger");
  const eventGroupMap = new Map<string, any>();

  for (const p of pubsubFacts) {
    const key = `pubsub|${p.value}`;
    if (!eventGroupMap.has(key)) {
      eventGroupMap.set(key, {
        technology: "pubsub",
        eventKey: p.value,
        publishers: [],
        subscribers: [],
        triggers: [],
        status: "publisher_only",
      });
    }
    eventGroupMap.get(key)!.publishers.push({ module: p.module, file: p.file, line: p.line });
  }

  for (const t of triggerFacts) {
    const key = `firestore_trigger|${t.value}`;
    if (!eventGroupMap.has(key)) {
      eventGroupMap.set(key, {
        technology: "firestore_trigger",
        eventKey: t.value,
        publishers: [],
        subscribers: [],
        triggers: [],
        status: "trigger_only",
      });
    }
    eventGroupMap.get(key)!.triggers.push({ module: t.module, file: t.file, line: t.line, handlerName: t.handlerName });
  }

  const eventEndpoints = Array.from(eventGroupMap.values());
  let unresolvedEventGroups = eventEndpoints.filter(e => e.status !== "resolved").length;

  // 7. RBAC Matrix (Consume permission_required ONLY)
  const requiredPermissions = allModuleFacts.filter(f => f.type === "permission_required");
  const rbacMap = new Map<string, any>();

  for (const p of requiredPermissions) {
    const perm = p.permission || p.value;
    if (!rbacMap.has(perm)) {
      rbacMap.set(perm, {
        permission: perm,
        requiredByModules: new Set<string>(),
        touchingFiles: new Set<string>(),
        checkCount: 0,
      });
    }
    const entry = rbacMap.get(perm)!;
    entry.requiredByModules.add(p.module);
    entry.touchingFiles.add(`${p.file}:${p.line}`);
    entry.checkCount += 1;
  }

  const rbacRequirements = Array.from(rbacMap.values()).map(r => ({
    permission: r.permission,
    requiredByModules: Array.from(r.requiredByModules).sort(),
    touchingFilesCount: r.touchingFiles.size,
    checkCount: r.checkCount,
  }));

  // 8. Final Notification & Quality Ordering
  if (unresolvedCallEdges.length > 0) {
    addNotification(
      notifications,
      "04-build-resolved-graph",
      "warning",
      "UNRESOLVED_CALLS_WARNING",
      `${unresolvedCallEdges.length} cross-module call expression(s) could not be deterministically resolved to a single target declaration.`,
      { count: unresolvedCallEdges.length, ambiguousCount: unresolvedCallEdges.filter(u => u.reason === "multiple_candidates").length }
    );
  }

  addNotification(
    notifications,
    "04-build-resolved-graph",
    "info",
    "EVENT_SUBSCRIBERS_NOT_IMPLEMENTED_INFO",
    "Event subscriber extraction is marked as not_implemented for Phase 1.75."
  );

  addNotification(
    notifications,
    "04-build-resolved-graph",
    "info",
    "GRAPH_RESOLUTION_COMPLETED",
    `Phase 1.75 graph resolution completed with status [${notifications.highestSeverity === "error" || notifications.highestSeverity === "fatal" ? "failed" : (notifications.highestSeverity === "warning" ? "completed_with_warnings" : "completed_clean")}].`
  );

  writeNotificationsAtomically(notificationsPath, notifications);
  const finalNotifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const graphQuality = {
    status: finalNotifications.highestSeverity === "error" || finalNotifications.highestSeverity === "fatal" ? "failed" : (finalNotifications.highestSeverity === "warning" ? "completed_with_warnings" : "completed_clean"),
    highestNotificationSeverity: finalNotifications.highestSeverity,
    confirmedCallEdges: confirmedCallEdges.length,
    probableCallEdges: probableCallEdges.length,
    ambiguousCalls: unresolvedCallEdges.filter(u => u.reason === "multiple_candidates").length,
    unresolvedCalls: unresolvedCallEdges.length,
    sharedFirestorePaths: firestoreSharedTouches.length,
    firestorePathsWithoutOperationEvidence: firestoreSharedTouches.filter(f => f.operations.length === 0).length,
    eventSubscriberExtractionStatus: "not_implemented",
    resolvedEventRoutes: 0,
    unresolvedEventGroups,
    rbacRequirements: rbacRequirements.length,
    apiEntryPoints: apiEntryPoints.length,
  };

  const graphPayload = {
    schemaVersion: "1.0.0",
    metadata: {
      runId,
      repoName: REPO_NAME,
      generatedAt: new Date().toISOString(),
      sourceModulesExpected: authoritativeModules.length,
      sourceModulesProcessed: authoritativeModules.length,
      inputFactsProcessed: allModuleFacts.length,
    },
    quality: graphQuality,
    confirmedCallEdges,
    probableCallEdges,
    unresolvedCallEdges,
    apiEntryPoints,
    firestoreSharedTouches,
    eventEndpoints,
    rbacRequirements,
  };

  const kpDir = path.join(repoOutputDir, "knowledge-pipeline");
  const graphJsonPath = path.join(kpDir, "resolved-engineering-graph.json");
  writeJsonAtomically(graphJsonPath, graphPayload, "knowledge-pipeline/resolved-engineering-graph.json");

  // Generate Markdown Matrix
  const markdownLines: string[] = [
    `# Resolved Engineering Graph Matrix`,
    ``,
    `**Run ID**: \`${runId}\`  `,
    `**Repo**: \`${REPO_NAME}\`  `,
    `**Status**: \`${graphQuality.status}\`  `,
    `**Generated At**: \`${new Date().toISOString()}\`  `,
    ``,
    `## Executive Summary`,
    ``,
    `- **Confirmed Call Edges**: ${graphQuality.confirmedCallEdges}`,
    `- **Probable Call Edges**: ${graphQuality.probableCallEdges}`,
    `- **Unresolved Calls**: ${graphQuality.unresolvedCalls} (${graphQuality.ambiguousCalls} ambiguous)`,
    `- **API Entry Points**: ${graphQuality.apiEntryPoints}`,
    `- **RBAC Requirements**: ${graphQuality.rbacRequirements}`,
    `- **Shared Firestore Touch Points**: ${graphQuality.sharedFirestorePaths}`,
    `- **Event Endpoints and Candidate Route Groups**: ${eventEndpoints.length}`,
    ``,
    `> **Note**: Confirmed edges are backed by exact declaration or import identity. Probable edges use a unique constrained fallback. Ambiguous and unresolved evidence is retained separately.`,
    ``,
    `## Confirmed Cross-Module Call Edges`,
    ``,
    `| Source Module | Source Context | Target Module | Target Class | Target Method | Resolution Method |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
  ];

  for (const edge of confirmedCallEdges) {
    markdownLines.push(`| \`${edge.sourceModule}\` | \`${edge.sourceContext}\` | \`${edge.targetModule}\` | \`${edge.targetClass}\` | \`${edge.targetMethod}\` | \`${edge.resolutionMethod}\` |`);
  }

  markdownLines.push(
    ``,
    `## RBAC Entitlements Matrix`,
    ``,
    `| Permission | Modules Requiring | Files Count | Checks Count |`,
    `| :--- | :--- | :--- | :--- |`
  );

  for (const rbac of rbacRequirements) {
    markdownLines.push(`| \`${rbac.permission}\` | \`${rbac.requiredByModules.join(", ")}\` | ${rbac.touchingFilesCount} | ${rbac.checkCount} |`);
  }

  const markdownContent = markdownLines.join("\n");
  assertNoLocalAbsolutePaths(markdownContent, "knowledge-pipeline/resolved-graph-matrix.md");

  const matrixMdPath = path.join(kpDir, "resolved-graph-matrix.md");
  fs.writeFileSync(matrixMdPath, markdownContent, "utf8");

  console.log(`Phase 1.75 completed with status: [${graphQuality.status}]`);
  console.log(`   - JSON Artifact: ${graphJsonPath}`);
  console.log(`   - Markdown Matrix: ${matrixMdPath}`);
  console.log(`   - Confirmed Cross-Module Calls: ${graphQuality.confirmedCallEdges}`);
  console.log(`   - Probable Cross-Module Calls: ${graphQuality.probableCallEdges}`);
  console.log(`   - Unresolved Calls: ${graphQuality.unresolvedCalls}`);
  console.log(`   - Shared Firestore Paths: ${graphQuality.sharedFirestorePaths}`);
  console.log(`   - Event Endpoints: ${eventEndpoints.length}`);
  console.log(`   - RBAC Requirements: ${graphQuality.rbacRequirements}`);
  console.log(`   - API Entry Points: ${graphQuality.apiEntryPoints}`);
}

main();

// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script processes raw AST facts into module-level evidence, module manifests,
// and normalized module evidence graphs for all authoritative modules declared by Script 00.

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
      if (key === "absolutePath" || key === "clonePath") continue; // runtime-only local bindings
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

function readRequiredJson<T>(filePath: string, contextDescription: string, notificationsPath: string, notifications: RunNotifications): T {
  if (!fs.existsSync(filePath)) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_REQUIRED_FACT_FILE", `Missing required fact file '${contextDescription}' at '${filePath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required fact file '${contextDescription}' at '${filePath}'.`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (err: any) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_FACT_FILE", `Malformed JSON in fact file '${contextDescription}' at '${filePath}': ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed JSON in fact file '${contextDescription}' at '${filePath}'.`);
  }
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function stableFactId(type: string, repo: string, module: string, file: string, line: number | null, key: string): string {
  return [type, repo, module, file, line ?? 0, key].join("|").toLowerCase();
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
  const kpModulesDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  fs.mkdirSync(kpModulesDir, { recursive: true });

  // Load AST Manifest
  const manifestPath = path.join(rawDir, "ast-evidence-manifest.json");
  const astManifest = readRequiredJson<any>(manifestPath, "facts/ast-evidence-manifest.json", notificationsPath, notifications);

  if (astManifest.runId !== runId || astManifest.repoName !== REPO_NAME) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "AST_MANIFEST_IDENTITY_MISMATCH", `AST manifest runId or repoName mismatch.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST manifest identity mismatch.`);
  }

  // Load and validate all required raw AST artifact counts
  const rawFactTables: Record<string, any[]> = {};
  for (const item of astManifest.artefacts) {
    const filePath = path.join(rawDir, item.file);
    const data = readRequiredJson<any[]>(filePath, `facts/${item.file}`, notificationsPath, notifications);

    if (item.required && data.length !== item.recordCount) {
      addNotification(
        notifications,
        "02-build-module-evidence",
        "fatal",
        "RECORD_COUNT_MISMATCH_FATAL",
        `Required fact file '${item.file}' length (${data.length}) does not match manifest count (${item.recordCount}).`,
        { file: item.file, actualLength: data.length, manifestCount: item.recordCount }
      );
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[RECORD_COUNT_MISMATCH_FATAL] Fact file '${item.file}' length mismatch.`);
    }

    rawFactTables[item.evidenceType] = data;
  }

  // Load authoritative module inventory
  const modulesJsonPath = path.join(rawDir, "modules.json");
  const moduleEntries = readRequiredJson<{ module: string }[]>(modulesJsonPath, "facts/modules.json", notificationsPath, notifications);
  const expectedModules = unique(moduleEntries.map(m => m.module)).sort();

  console.log(`Building module evidence and evidence graphs for ${expectedModules.length} authoritative modules`);

  for (const moduleName of expectedModules) {
    const moduleKpDir = path.join(kpModulesDir, moduleName);
    fs.mkdirSync(moduleKpDir, { recursive: true });

    // Filter raw rows for this module
    const filterMod = (arr?: any[]) => (arr || []).filter(r => r.module === moduleName);

    const modImports = filterMod(rawFactTables.imports);
    const modExports = filterMod(rawFactTables.exports);
    const modClasses = filterMod(rawFactTables.classes);
    const modMethods = filterMod(rawFactTables.methods);
    const modFunctions = filterMod(rawFactTables.functions);
    const modTypeAliases = filterMod(rawFactTables.typeAliases);
    const modEnums = filterMod(rawFactTables.enums);
    const modModelProps = filterMod(rawFactTables.modelProperties);
    const modCalls = filterMod(rawFactTables.calls);
    const modFirestoreHints = filterMod(rawFactTables.firestoreHints);
    const modPermissionHints = filterMod(rawFactTables.permissionHints);
    const modExternalHooks = filterMod(rawFactTables.externalHooks);
    const modApiContracts = filterMod(rawFactTables.apiContracts);
    const modTriggers = filterMod(rawFactTables.firestoreTriggers);

    // Identify unique files for this module
    const allModRows = [
      ...modImports,
      ...modExports,
      ...modClasses,
      ...modMethods,
      ...modFunctions,
      ...modTypeAliases,
      ...modEnums,
      ...modModelProps,
      ...modCalls,
      ...modFirestoreHints,
      ...modPermissionHints,
      ...modExternalHooks,
      ...modApiContracts,
      ...modTriggers,
    ];

    const filePaths = unique(allModRows.map(r => r.file).filter(Boolean)).sort();

    // Build per-file records
    const filesSummary = filePaths.map(filePath => {
      const fileFilter = (arr: any[]) => arr.filter(r => r.file === filePath);
      return {
        file: filePath,
        importsCount: fileFilter(modImports).length,
        exportsCount: fileFilter(modExports).length,
        classesCount: fileFilter(modClasses).length,
        methodsCount: fileFilter(modMethods).length,
        functionsCount: fileFilter(modFunctions).length,
        typeAliasesCount: fileFilter(modTypeAliases).length,
        enumsCount: fileFilter(modEnums).length,
        modelPropertiesCount: fileFilter(modModelProps).length,
        callsCount: fileFilter(modCalls).length,
        firestoreHintsCount: fileFilter(modFirestoreHints).length,
        permissionHintsCount: fileFilter(modPermissionHints).length,
        externalHooksCount: fileFilter(modExternalHooks).length,
        apiContractsCount: fileFilter(modApiContracts).length,
        firestoreTriggersCount: fileFilter(modTriggers).length,
      };
    });

    // Build Services and Controllers
    const services = modClasses
      .filter(c => c.className.endsWith("Service") || c.className.endsWith("Publisher") || c.className.endsWith("Processor"))
      .map(c => {
        const cMethods = modMethods.filter(m => m.className === c.className);
        return {
          serviceName: c.className,
          file: c.file,
          line: c.line,
          extendsClass: c.extendsClass,
          methods: cMethods.map(m => ({
            methodName: m.methodName,
            line: m.line,
            returnType: m.returnType,
            isAsync: m.isAsync,
            isStatic: m.isStatic,
            visibility: m.visibility,
          })),
        };
      })
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));

    const controllers = modClasses
      .filter(c => c.className.endsWith("Controller") || c.className.endsWith("Handler"))
      .map(c => {
        const cMethods = modMethods.filter(m => m.className === c.className);
        return {
          controllerName: c.className,
          file: c.file,
          line: c.line,
          extendsClass: c.extendsClass,
          methods: cMethods.map(m => ({
            methodName: m.methodName,
            line: m.line,
            returnType: m.returnType,
            isAsync: m.isAsync,
            isStatic: m.isStatic,
            visibility: m.visibility,
          })),
        };
      })
      .sort((a, b) => a.controllerName.localeCompare(b.controllerName));

    // Build normalized facts for evidence graph
    const facts: any[] = [];
    const factSet = new Set<string>();

    const addFact = (type: string, file: string, line: number | null, key: string, value: string, symbol: string | null, method: string | null, className: string | null, evidence: any) => {
      const id = stableFactId(type, REPO_NAME, moduleName, file, line, key);
      if (!factSet.has(id)) {
        factSet.add(id);
        facts.push({
          id,
          runId,
          type,
          repo: REPO_NAME,
          module: moduleName,
          submodule: null,
          file,
          line,
          value,
          symbol,
          method,
          className,
          evidence,
        });
      }
    };

    for (const f of modClasses) addFact("source_class", f.file, f.line, f.className, f.className, f.className, null, f.className, f);
    for (const f of modMethods) addFact("service_method", f.file, f.line, `${f.className}.${f.methodName}`, f.methodName, f.methodName, f.methodName, f.className, f);
    for (const f of modCalls) addFact("call_expression", f.file, f.line, f.expression || f.name, f.expression || f.name, f.calleeSymbol, f.name, f.callerClass, f);
    for (const f of modFirestoreHints) addFact("firestore_path_touched", f.file, f.line, f.path, f.path, null, null, null, f);
    for (const f of modPermissionHints) addFact("permission_required", f.file, f.line, f.permission, f.permission, null, null, null, f);
    for (const f of modTriggers) addFact("firestore_trigger", f.file, f.line, f.handlerName, f.firestorePath, null, f.handlerName, null, f);
    for (const f of modApiContracts) addFact("api_contract", f.file, f.line, f.rawText, f.contractType, null, null, null, f);

    facts.sort((a, b) => a.id.localeCompare(b.id));

    // Compute Summary
    const summary = {
      files: filePaths.length,
      imports: modImports.length,
      exports: modExports.length,
      classes: modClasses.length,
      methods: modMethods.length,
      functions: modFunctions.length,
      typeAliases: modTypeAliases.length,
      enums: modEnums.length,
      modelProperties: modModelProps.length,
      calls: modCalls.length,
      firestoreHints: modFirestoreHints.length,
      permissionHints: modPermissionHints.length,
      externalHooks: modExternalHooks.length,
      firestoreTriggers: modTriggers.length,
      apiContracts: modApiContracts.length,
      services: services.length,
      controllers: controllers.length,
      facts: facts.length,
    };

    console.log(`${moduleName}:`, summary);

    // Build Module Manifest
    const moduleManifest = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary,
      artifacts: [
        { file: `${moduleName}-files.json`, recordCount: filesSummary.length },
        { file: `${moduleName}-services.json`, recordCount: services.length },
        { file: `${moduleName}-controllers.json`, recordCount: controllers.length },
        { file: `${moduleName}-firestore-triggers.json`, recordCount: modTriggers.length },
        { file: `${moduleName}-evidence.json`, recordCount: allModRows.length },
        { file: `${moduleName}-evidence-graph.json`, recordCount: facts.length },
      ],
    };

    // Write module artifacts atomically
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-files.json`), filesSummary, `modules/${moduleName}/${moduleName}-files.json`);
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-services.json`), services, `modules/${moduleName}/${moduleName}-services.json`);
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-controllers.json`), controllers, `modules/${moduleName}/${moduleName}-controllers.json`);
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-firestore-triggers.json`), modTriggers, `modules/${moduleName}/${moduleName}-firestore-triggers.json`);
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-evidence.json`), allModRows, `modules/${moduleName}/${moduleName}-evidence.json`);

    const graphCountsByType: Record<string, number> = {};
    for (const f of facts) {
      graphCountsByType[f.type] = (graphCountsByType[f.type] ?? 0) + 1;
    }

    const evidenceGraph = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFacts: facts.length,
        countsByType: graphCountsByType,
      },
      facts,
    };

    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-evidence-graph.json`), evidenceGraph, `modules/${moduleName}/${moduleName}-evidence-graph.json`);
    writeJsonAtomically(path.join(moduleKpDir, `${moduleName}-manifest.json`), moduleManifest, `modules/${moduleName}/${moduleName}-manifest.json`);
  }

  addNotification(notifications, "02-build-module-evidence", "info", "MODULE_EVIDENCE_COMPLETED", "Module evidence synthesis completed successfully.");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Complete");
  console.log("Wrote output/knowledge-pipeline/modules/*");
}

main();
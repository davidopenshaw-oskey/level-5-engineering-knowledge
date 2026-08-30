// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// Script 02: Module Evidence Builder and Evidence Graph Synthesizer (Phase 1).
// Validates raw AST evidence, maps evidence into 23 normalized fact categories,
// classifies methods by class role, and generates atomic module evidence graphs.

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

// governance/roadmap/03-token-economics-remediation-plan.md Stage 1: line
// number is deliberately EXCLUDED from fact identity. A line-based ID means
// any edit that shifts lines below it (e.g. inserting a comment) changes
// every downstream fact's ID even though nothing semantic changed --
// confirmed independently by two external models as the flaw that would
// otherwise silently break any future incrementality/caching scheme built on
// top of these IDs. `line` is still stored as its own top-level field on the
// fact object (provenance), just no longer folded into the ID string. The
// `input.line` parameter is intentionally unused below -- kept in the
// signature so every call site's existing argument list stays valid.
//
// Removing line does reopen a real risk this file's own "Conflicting Identity
// Guard" (below) was silently relying on: several fact types don't have a
// primaryKey+secondaryKey that's guaranteed unique per file on its own (e.g.
// the same Firestore path or permission string can legitimately be
// referenced from multiple lines in one file; the same call expression with
// the same arguments can legitimately appear more than once). For exactly
// those fact types, callers pass `occurrenceOrdinal` -- the Nth time this
// exact (type, file, primaryKey, secondaryKey) combination has been seen, in
// source order. An ordinal is stable under line-shifting edits (inserting a
// line elsewhere doesn't change how many times a pattern occurs, or in what
// order); a raw line number is not. Fact types where the key is already
// structurally unique per file (class names, type/enum names, etc.) don't
// need one.
function stableFactId(input: {
  type: string;
  repo: string;
  module: string;
  file: string;
  line: number | null;
  primaryKey: string;
  secondaryKey?: string | null;
  sourceStart?: number | null;
  occurrenceOrdinal?: number;
}): string {
  const cleanPath = (input.file || "").replace(/\\/g, "/");
  const sec = input.secondaryKey ? `|${input.secondaryKey}` : "";
  const ord = input.occurrenceOrdinal !== undefined ? `|#${input.occurrenceOrdinal}` : "";
  return `${input.type}|${input.module}|${cleanPath}|${input.primaryKey}${sec}${ord}`;
}

// Per-module, per-(type|file|primaryKey|secondaryKey) occurrence counter for
// the fact types that need an ordinal disambiguator (see stableFactId above).
// Reset per module below, alongside rawModuleFacts.
function nextOccurrenceOrdinal(counterMap: Map<string, number>, type: string, file: string, primaryKey: string, secondaryKey?: string | null): number {
  const key = `${type}|${file}|${primaryKey}|${secondaryKey ?? ""}`;
  const next = (counterMap.get(key) ?? 0) + 1;
  counterMap.set(key, next);
  return next;
}

interface ClassificationRules {
  serviceSuffixes: string[];
  controllerSuffixes: string[];
  routeHandlerSuffixes?: string[];
}

// Previously hardcoded suffix rules ("Service"/"Publisher"/"Processor" vs
// "Controller"/"Handler") -- this was this-repo's own naming convention baked
// directly into shared logic. It is now config-driven per repo
// (config/repos.json -> classificationRules) so Angular (*Component,
// *Guard, *Pipe), node-iot, or any future repo can supply its own
// convention instead of silently misclassifying against Firebase's rules.
// Defaults below preserve this repo's existing behavior unchanged.
const DEFAULT_CLASSIFICATION_RULES: ClassificationRules = {
  serviceSuffixes: ["Service", "Publisher", "Processor"],
  controllerSuffixes: ["Controller", "Handler"],
  routeHandlerSuffixes: [],
};

function classifyMethod(
  className: string,
  rules: ClassificationRules = DEFAULT_CLASSIFICATION_RULES
): "service_method" | "controller_method" | "route_handler_method" | "class_method" {
  if (rules.serviceSuffixes.some(suffix => className.endsWith(suffix))) {
    return "service_method";
  }
  if (rules.routeHandlerSuffixes?.some(suffix => className.endsWith(suffix))) {
    return "route_handler_method";
  }
  if (rules.controllerSuffixes.some(suffix => className.endsWith(suffix))) {
    return "controller_method";
  }
  return "class_method";
}

const EXPECTED_EVIDENCE_TYPES = [
  "imports",
  "exports",
  "classes",
  "methods",
  "functions",
  "typeAliases",
  "enums",
  "modelProperties",
  "calls",
  "externalHooks",
  "mongoOperations",
  "routeDefinitions",
  "joiSchemaFields",
  "pubsubOperationRoutes",
];

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

  // Load per-repo classification rules from config, falling back to this
  // repo's existing suffix conventions if none are configured.
  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, "utf8"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  const classificationRules: ClassificationRules =
    targetRepoCfg?.classificationRules || DEFAULT_CLASSIFICATION_RULES;

  const rawDir = path.join(repoOutputDir, "facts");
  const manifestPath = path.join(rawDir, "ast-evidence-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_AST_MANIFEST_FATAL", `Missing required ast-evidence-manifest.json at '${manifestPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required ast-evidence-manifest.json at '${manifestPath}'.`);
  }

  let astManifest: any;
  try {
    astManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Malformed ast-evidence-manifest.json: ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed ast-evidence-manifest.json: ${err.message}`);
  }

  // 1. Validate AST Manifest Structure strictly
  if (
    typeof astManifest.schemaVersion !== "string" ||
    astManifest.runId !== runId ||
    astManifest.repoName !== REPO_NAME ||
    !Array.isArray(astManifest.artefacts) ||
    astManifest.artefacts.length === 0 ||
    typeof astManifest.errors !== "object" ||
    typeof astManifest.errors?.file !== "string" ||
    !Number.isFinite(astManifest.errors?.recordCount)
  ) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_AST_MANIFEST_FATAL", `AST manifest structure or identity validation failed.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST manifest structure or identity validation failed.`);
  }

  // 2. Validate Expected AST Evidence Types (Exactly 1 per type)
  const manifestTypeMap = new Map<string, any>();
  for (const art of astManifest.artefacts) {
    if (!art.evidenceType || typeof art.evidenceType !== "string") {
      addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Manifest artifact entry missing 'evidenceType'.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Manifest artifact entry missing 'evidenceType'.`);
    }
    if (manifestTypeMap.has(art.evidenceType)) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "DUPLICATE_EVIDENCE_TYPE_FATAL", `Duplicate evidenceType '${art.evidenceType}' in ast-evidence-manifest.json.`, { evidenceType: art.evidenceType });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[DUPLICATE_EVIDENCE_TYPE_FATAL] Duplicate evidenceType '${art.evidenceType}'.`);
    }
    manifestTypeMap.set(art.evidenceType, art);
  }

  for (const expType of EXPECTED_EVIDENCE_TYPES) {
    if (!manifestTypeMap.has(expType)) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_EVIDENCE_TYPE_FATAL", `Expected evidenceType '${expType}' missing from ast-evidence-manifest.json.`, { missingEvidenceType: expType });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MISSING_EVIDENCE_TYPE_FATAL] Expected evidenceType '${expType}' missing.`);
    }

    const art = manifestTypeMap.get(expType);
    const artPath = path.join(rawDir, art.file);

    if (!fs.existsSync(artPath)) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_EVIDENCE_FILE_FATAL", `Required AST evidence file '${art.file}' missing at '${artPath}'.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Required AST evidence file '${art.file}' missing.`);
    }

    let arr: any[];
    try {
      arr = JSON.parse(fs.readFileSync(artPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_EVIDENCE_FILE_FATAL", `Malformed JSON in AST evidence file '${art.file}': ${err.message}`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Malformed JSON in AST evidence file '${art.file}'.`);
    }

    if (!Array.isArray(arr)) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "INVALID_EVIDENCE_ARRAY_FATAL", `AST evidence file '${art.file}' must contain a JSON array.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] AST evidence file '${art.file}' is not a JSON array.`);
    }

    if (arr.length !== art.recordCount) {
      addNotification(notifications, "02-build-module-evidence", "fatal", "RECORD_COUNT_MISMATCH_FATAL", `Record count mismatch in '${art.file}': manifest claims ${art.recordCount}, actual is ${arr.length}.`, { file: art.file, manifestCount: art.recordCount, actualCount: arr.length });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[RECORD_COUNT_MISMATCH_FATAL] Record count mismatch in '${art.file}'.`);
    }
  }

  // 3. Validate AST Errors Artifact
  const errorsPath = path.join(rawDir, astManifest.errors.file);
  if (!fs.existsSync(errorsPath)) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_ERRORS_FILE_FATAL", `AST errors file '${astManifest.errors.file}' missing at '${errorsPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST errors file '${astManifest.errors.file}' missing.`);
  }

  let errArr: any[];
  try {
    errArr = JSON.parse(fs.readFileSync(errorsPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MALFORMED_ERRORS_FILE_FATAL", `Malformed JSON in AST errors file '${astManifest.errors.file}': ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed JSON in AST errors file.`);
  }

  if (!Array.isArray(errArr) || errArr.length !== astManifest.errors.recordCount) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "AST_ERRORS_COUNT_MISMATCH_FATAL", `Record count mismatch in '${astManifest.errors.file}': manifest claims ${astManifest.errors.recordCount}, actual is ${errArr.length}.`, { file: astManifest.errors.file, manifestCount: astManifest.errors.recordCount, actualCount: errArr.length });
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[AST_ERRORS_COUNT_MISMATCH_FATAL] AST errors count mismatch.`);
  }

  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, "02-build-module-evidence", "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }

  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  console.log(`Creating module evidence and evidence graphs for ${authoritativeModules.length} authoritative modules`);

  // Helper loader
  const loadFactFile = (filename: string): any[] => {
    const filePath = path.join(rawDir, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  };

  const filesFact = loadFactFile("files.json");
  const importsFact = loadFactFile("ast-imports.json");
  const exportsFact = loadFactFile("ast-exports.json");
  const classesFact = loadFactFile("ast-classes.json");
  const methodsFact = loadFactFile("ast-methods.json");
  const functionsFact = loadFactFile("ast-functions.json");
  const typeAliasesFact = loadFactFile("ast-type-aliases.json");
  const enumsFact = loadFactFile("ast-enums.json");
  const modelPropsFact = loadFactFile("ast-model-properties.json");
  const callsFact = loadFactFile("ast-calls.json");
  const externalHooksFact = loadFactFile("ast-external-hooks.json");
  const mongoOperationsFact = loadFactFile("ast-mongo-operations.json");
  const routeDefinitionsFact = loadFactFile("ast-route-definitions.json");
  const joiSchemaFieldsFact = loadFactFile("ast-joi-schema-fields.json");
  const pubsubOperationRoutesFact = loadFactFile("ast-pubsub-operation-routes.json");

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  fs.mkdirSync(modulesBaseDir, { recursive: true });

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    fs.mkdirSync(modDir, { recursive: true });

    const rawModuleFacts: any[] = [];
    const occurrenceCounters = new Map<string, number>();

    // 1. source_file
    for (const item of filesFact.filter(f => f.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "source_file", repo: REPO_NAME, module: moduleName, file: item.path, line: 1, primaryKey: item.path }),
        runId,
        type: "source_file",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: 1,
        value: item.path,
        evidence: { sizeBytes: item.sizeBytes, kindHint: item.kindHint },
      });
    }

    // 2. source_class
    for (const item of classesFact.filter(c => c.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "source_class", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.className }),
        runId,
        type: "source_class",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.className,
        className: item.className,
        extendsClass: item.extendsClass,
        isExported: item.isExported,
        evidence: { ...item },
      });
    }

    // 3. methods (service_method / controller_method / class_method)
    for (const item of methodsFact.filter(m => m.module === moduleName)) {
      const factType = classifyMethod(item.className, classificationRules);
      rawModuleFacts.push({
        id: stableFactId({
          type: factType,
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.className,
          secondaryKey: item.methodName,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, factType, item.path, item.className, item.methodName),
        }),
        runId,
        type: factType,
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.className}.${item.methodName}`,
        symbol: item.methodName,
        method: item.methodName,
        className: item.className,
        evidence: {
          serviceName: item.className,
          methodName: item.methodName,
          line: item.line,
          returnType: item.returnType,
          isAsync: item.isAsync,
          isStatic: item.isStatic,
          visibility: item.visibility,
        },
      });
    }

    // 4. function_declaration
    for (const item of functionsFact.filter(f => f.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "function_declaration",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "function_declaration", item.path, item.name),
        }),
        runId,
        type: "function_declaration",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.name,
        name: item.name,
        evidence: { ...item },
      });
    }

    // 5. call_expression (Composite key using caller, callee, and arguments)
    for (const item of callsFact.filter(c => c.module === moduleName)) {
      const argSig = Array.isArray(item.arguments) ? item.arguments.join(",") : "";
      const callSecondaryKey = `${item.callerName || "anon"}|${argSig}`;
      rawModuleFacts.push({
        id: stableFactId({
          type: "call_expression",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.expression,
          secondaryKey: callSecondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "call_expression", item.path, item.expression, callSecondaryKey),
        }),
        runId,
        type: "call_expression",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.expression,
        callerName: item.callerName,
        callerClass: item.callerClass,
        callerDeclarationFile: item.callerDeclarationFile,
        callerStartLine: item.callerStartLine,
        callerEndLine: item.callerEndLine,
        calleeExpression: item.calleeExpression,
        calleeSymbol: item.calleeSymbol,
        declarationFile: item.declarationFile,
        declarationLine: item.declarationLine,
        declarationClass: item.declarationClass,
        declarationMethod: item.declarationMethod,
        declarationModuleSpecifier: item.declarationModuleSpecifier,
        resolutionStatus: item.resolutionStatus,
        evidence: { ...item },
      });
    }

    // 6. imports_dependency
    for (const item of importsFact.filter(i => i.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "imports_dependency",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.moduleSpecifier,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "imports_dependency", item.path, item.moduleSpecifier),
        }),
        runId,
        type: "imports_dependency",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.moduleSpecifier,
        // Promoted to top-level (not just nested in evidence) because the
        // cross-module dependency graph (06-build-cross-module-dependency-
        // graph.ts) reads these directly, and factsToCompactTable drops the
        // evidence blob entirely when preparing LLM-facing prompt input --
        // same reasoning as why `submodule` above is top-level, not
        // evidence-only. See governance/roadmap/01-cross-module-dependency-graph.md.
        resolvedTargetModule: item.resolvedTargetModule,
        resolvedTargetSubmodule: item.resolvedTargetSubmodule,
        importResolutionStatus: item.importResolutionStatus,
        evidence: { ...item },
      });
    }

    // 7. exported_symbol
    for (const item of exportsFact.filter(e => e.module === moduleName)) {
      const val = item.moduleSpecifier || item.namedExports?.join(",") || "export";
      rawModuleFacts.push({
        id: stableFactId({
          type: "exported_symbol",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: val,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "exported_symbol", item.path, val),
        }),
        runId,
        type: "exported_symbol",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: val,
        evidence: { ...item },
      });
    }

    // 8. mongo_operation
    for (const item of mongoOperationsFact.filter(m => m.module === moduleName)) {
      const primaryKey = item.collectionName || "unresolved_collection";
      rawModuleFacts.push({
        id: stableFactId({
          type: "mongo_operation",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey,
          secondaryKey: item.operation,
          // Necessary, not defensive-only: verified real collision in this repo --
          // access_control_device_accesses.controller.ts has 4 separate findOne()
          // call sites (lines 30, 48, 74, 100) all against the same
          // `accessControlDeviceAccesses` collection. Without an ordinal, all 4
          // compute the identical ID.
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "mongo_operation", item.path, primaryKey, item.operation),
        }),
        runId,
        type: "mongo_operation",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.operation}(${primaryKey})`,
        operation: item.operation,
        collectionName: item.collectionName,
        collectionResolutionStatus: item.collectionResolutionStatus,
        dbNameExpression: item.dbNameExpression,
        callerName: item.callerName,
        callerClass: item.callerClass,
        evidence: { ...item },
      });
    }

    // 9. route_definition
    for (const item of routeDefinitionsFact.filter(r => r.module === moduleName)) {
      const secondaryKey = `${item.method}|${item.versionDate}`;
      rawModuleFacts.push({
        id: stableFactId({
          type: "route_definition",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.httpPath,
          secondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "route_definition", item.path, item.httpPath, secondaryKey),
        }),
        runId,
        type: "route_definition",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.method} ${item.httpPath}`,
        httpPath: item.httpPath,
        method: item.method,
        versionDate: item.versionDate,
        handlerClass: item.handlerClass,
        handlerMethod: item.handlerMethod,
        handlerDeclarationFile: item.handlerDeclarationFile,
        handlerStartLine: item.handlerStartLine,
        handlerEndLine: item.handlerEndLine,
        schemaName: item.schemaName,
        schemaDeclarationFile: item.schemaDeclarationFile,
        isPubSubPushRoute: item.isPubSubPushRoute,
        evidence: { ...item },
      });
    }

    // 9b. pubsub_operation_route
    for (const item of pubsubOperationRoutesFact.filter(p => p.module === moduleName)) {
      const primaryKey = item.operationValue || "unresolved_operation";
      const secondaryKey = `${item.handlerClass}.${item.handlerMethod}`;
      rawModuleFacts.push({
        id: stableFactId({
          type: "pubsub_operation_route",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey,
          secondaryKey,
          // Defensive, not yet proven necessary against real data (unlike
          // mongo_operation's ordinal above, which IS proven necessary): two
          // records CAN legitimately share a line (this repo's own
          // compound-OR if/else shape produces exactly that -- 2 records at
          // the same line, disambiguated by operationValue alone, which
          // already differs and is already the primaryKey). Added anyway for
          // the same reason model_property's ordinal was -- costs nothing,
          // removes any doubt.
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "pubsub_operation_route", item.path, primaryKey, secondaryKey),
        }),
        runId,
        type: "pubsub_operation_route",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.handlerMethod}[${primaryKey}]`,
        handlerClass: item.handlerClass,
        handlerMethod: item.handlerMethod,
        dispatchKind: item.dispatchKind,
        operationValue: item.operationValue,
        operationResolutionStatus: item.operationResolutionStatus,
        targetCalls: item.targetCalls,
        evidence: { ...item },
      });
    }

    // 10. external_hook / pubsub_topic / http_or_client_path / environment_variable / storage_path
    for (const item of externalHooksFact.filter(eh => eh.module === moduleName)) {
      let hType = "external_hook";
      if (item.type === "pubsub_topic") hType = "pubsub_topic";
      else if (item.type === "environment_variable") hType = "environment_variable";
      else if (item.type === "storage_path_candidate") hType = "storage_path";
      else if (item.type === "http_or_client_path_candidate") hType = "http_or_client_path";

      rawModuleFacts.push({
        id: stableFactId({
          type: hType,
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.value,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, hType, item.path, item.value),
        }),
        runId,
        type: hType,
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.value,
        evidence: { ...item },
      });
    }

    // 10b. joi_schema_field
    for (const item of joiSchemaFieldsFact.filter(j => j.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "joi_schema_field",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.schemaExportName,
          secondaryKey: item.fieldName,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "joi_schema_field", item.path, item.schemaExportName, item.fieldName),
        }),
        runId,
        type: "joi_schema_field",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.schemaExportName}.${item.fieldName}`,
        schemaExportName: item.schemaExportName,
        fieldName: item.fieldName,
        joiType: item.joiType,
        required: item.required,
        validValues: item.validValues,
        evidence: { ...item },
      });
    }

    // 13. type_alias
    for (const item of typeAliasesFact.filter(ta => ta.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "type_alias",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "type_alias", item.path, item.name),
        }),
        runId,
        type: "type_alias",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.name,
        evidence: { ...item },
      });
    }

    // 14. enum_declaration
    for (const item of enumsFact.filter(e => e.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "enum_declaration",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "enum_declaration", item.path, item.name),
        }),
        runId,
        type: "enum_declaration",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: item.name,
        evidence: { ...item },
      });
    }

    // 15. model_property
    for (const item of modelPropsFact.filter(mp => mp.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "model_property",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.parentName,
          secondaryKey: item.propertyName,
          // Added defensively, not yet confirmed necessary against real data
          // (unlike firestore_trigger below, which did collide): TS
          // interface declaration merging allows the same parentName to be
          // declared more than once in a file, each contributing
          // properties, so parentName+propertyName alone isn't provably
          // unique per file even though no real collision has been observed.
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "model_property", item.path, item.parentName, item.propertyName),
        }),
        runId,
        type: "model_property",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: item.line,
        value: `${item.parentName}.${item.propertyName}`,
        evidence: { ...item },
      });
    }

    // 4. Property-Based Fact Deduplication & Conflicting Identity Guard
    const factMap = new Map<string, { fact: any; jsonStr: string }>();
    let deduplicatedCount = 0;

    for (const rawFact of rawModuleFacts) {
      const id = rawFact.id;
      const jsonStr = JSON.stringify(rawFact);

      if (factMap.has(id)) {
        const existing = factMap.get(id)!;
        if (existing.jsonStr === jsonStr) {
          deduplicatedCount += 1;
        } else {
          addNotification(
            notifications,
            "02-build-module-evidence",
            "fatal",
            "DUPLICATE_FACT_IDENTITY_FATAL",
            `Materially different facts produced identical ID '${id}' in module '${moduleName}'.`,
            { module: moduleName, factId: id }
          );
          writeNotificationsAtomically(notificationsPath, notifications);
          throw new Error(`[DUPLICATE_FACT_IDENTITY_FATAL] Conflicting facts for ID '${id}' in module '${moduleName}'.`);
        }
      } else {
        factMap.set(id, { fact: rawFact, jsonStr });
      }
    }

    if (deduplicatedCount > 0) {
      addNotification(
        notifications,
        "02-build-module-evidence",
        "warning",
        "FACT_DEDUPLICATED_WARNING",
        `Deduplicated ${deduplicatedCount} identical fact(s) in module '${moduleName}'.`,
        { module: moduleName, count: deduplicatedCount }
      );
    }

    const facts = Array.from(factMap.values()).map(e => e.fact);
    facts.sort((a, b) => a.id.localeCompare(b.id));

    const moduleFiles = Array.from(new Set(facts.map(f => f.file))).sort();
    const services = Array.from(new Set(facts.filter(f => f.type === "service_method").map(f => f.className))).sort();
    const controllers = Array.from(new Set(facts.filter(f => f.type === "controller_method").map(f => f.className))).sort();
    const routeHandlers = Array.from(new Set(facts.filter(f => f.type === "route_handler_method").map(f => f.className))).sort();

    const summaryCounts = {
      files: moduleFiles.length,
      imports: facts.filter(f => f.type === "imports_dependency").length,
      exports: facts.filter(f => f.type === "exported_symbol").length,
      classes: facts.filter(f => f.type === "source_class").length,
      methods: facts.filter(f => f.type === "service_method" || f.type === "controller_method" || f.type === "route_handler_method" || f.type === "class_method").length,
      functions: facts.filter(f => f.type === "function_declaration").length,
      typeAliases: facts.filter(f => f.type === "type_alias").length,
      enums: facts.filter(f => f.type === "enum_declaration").length,
      modelProperties: facts.filter(f => f.type === "model_property").length,
      calls: facts.filter(f => f.type === "call_expression").length,
      externalHooks: facts.filter(f => f.type === "external_hook" || f.type === "pubsub_topic" || f.type === "pubsub_publish_call" || f.type === "http_or_client_path" || f.type === "environment_variable" || f.type === "storage_path").length,
      mongoOperations: facts.filter(f => f.type === "mongo_operation").length,
      routeDefinitions: facts.filter(f => f.type === "route_definition").length,
      joiSchemaFields: facts.filter(f => f.type === "joi_schema_field").length,
      pubsubOperationRoutes: facts.filter(f => f.type === "pubsub_operation_route").length,
      services: services.length,
      controllers: controllers.length,
      routeHandlers: routeHandlers.length,
      facts: facts.length,
    };

    const graphPayload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFacts: facts.length,
        ...summaryCounts,
      },
      facts,
    };

    const nowIso = new Date().toISOString();
    const manifestPayload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: nowIso,
      updatedAt: nowIso,
      artefacts: [
        { file: `${moduleName}-facts.json`, recordCount: facts.length },
        { file: `${moduleName}-evidence-graph.json`, documentCount: 1, factCount: facts.length },
      ],
      summary: summaryCounts,
    };

    writeJsonAtomically(path.join(modDir, `${moduleName}-facts.json`), facts, `${moduleName}-facts.json`);
    writeJsonAtomically(path.join(modDir, `${moduleName}-evidence-graph.json`), graphPayload, `${moduleName}-evidence-graph.json`);
    writeJsonAtomically(path.join(modDir, `${moduleName}-manifest.json`), manifestPayload, `${moduleName}-manifest.json`);

    console.log(`${moduleName}:`, summaryCounts);
  }

  addNotification(notifications, "02-build-module-evidence", "info", "MODULE_EVIDENCE_COMPLETED", "Module evidence synthesis completed successfully.");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Complete");
  console.log("Wrote output/knowledge-pipeline/modules/*");
}

main();
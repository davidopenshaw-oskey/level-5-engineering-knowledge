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

function stableFactId(input: {
  type: string;
  repo: string;
  module: string;
  file: string;
  line: number | null;
  primaryKey: string;
  secondaryKey?: string | null;
  sourceStart?: number | null;
}): string {
  const cleanPath = (input.file || "").replace(/\\/g, "/");
  const lineStr = input.line !== null && input.line !== undefined ? String(input.line) : "1";
  const sec = input.secondaryKey ? `|${input.secondaryKey}` : "";
  const start = input.sourceStart !== null && input.sourceStart !== undefined ? `|${input.sourceStart}` : "";
  return `${input.type}|${input.module}|${cleanPath}|${lineStr}|${input.primaryKey}${sec}${start}`;
}

interface ClassificationRules {
  serviceSuffixes: string[];
  controllerSuffixes: string[];
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
};

function classifyMethod(
  className: string,
  rules: ClassificationRules = DEFAULT_CLASSIFICATION_RULES
): "service_method" | "controller_method" | "class_method" {
  if (rules.serviceSuffixes.some(suffix => className.endsWith(suffix))) {
    return "service_method";
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
  "firestoreHints",
  "permissionHints",
  "externalHooks",
  "apiContracts",
  "firestoreTriggers",
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
  const firestoreHintsFact = loadFactFile("ast-firestore-hints.json");
  const permissionHintsFact = loadFactFile("ast-permission-hints.json");
  const externalHooksFact = loadFactFile("ast-external-hooks.json");
  const apiContractsFact = loadFactFile("ast-api-contracts.json");
  const triggersFact = loadFactFile("ast-firestore-triggers.json");
  const pubsubEventRoutesFact = loadFactFile("ast-pubsub-event-routes.json");

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  fs.mkdirSync(modulesBaseDir, { recursive: true });

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    fs.mkdirSync(modDir, { recursive: true });

    const rawModuleFacts: any[] = [];

    // 1. source_file
    for (const item of filesFact.filter(f => f.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "source_file", repo: REPO_NAME, module: moduleName, file: item.path, line: 1, primaryKey: item.path }),
        runId,
        type: "source_file",
        repo: REPO_NAME,
        module: moduleName,
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
        id: stableFactId({ type: factType, repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.className, secondaryKey: item.methodName }),
        runId,
        type: factType,
        repo: REPO_NAME,
        module: moduleName,
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
        id: stableFactId({ type: "function_declaration", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.name }),
        runId,
        type: "function_declaration",
        repo: REPO_NAME,
        module: moduleName,
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
      rawModuleFacts.push({
        id: stableFactId({
          type: "call_expression",
          repo: REPO_NAME,
          module: moduleName,
          file: item.path,
          line: item.line,
          primaryKey: item.expression,
          secondaryKey: `${item.callerName || "anon"}|${argSig}`,
        }),
        runId,
        type: "call_expression",
        repo: REPO_NAME,
        module: moduleName,
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
        id: stableFactId({ type: "imports_dependency", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.moduleSpecifier }),
        runId,
        type: "imports_dependency",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.moduleSpecifier,
        evidence: { ...item },
      });
    }

    // 7. exported_symbol
    for (const item of exportsFact.filter(e => e.module === moduleName)) {
      const val = item.moduleSpecifier || item.namedExports?.join(",") || "export";
      rawModuleFacts.push({
        id: stableFactId({ type: "exported_symbol", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: val }),
        runId,
        type: "exported_symbol",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: val,
        evidence: { ...item },
      });
    }

    // 8. firestore_path_touched
    for (const item of firestoreHintsFact.filter(fh => fh.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "firestore_path_touched", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.value || item.path }),
        runId,
        type: "firestore_path_touched",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.value || item.path,
        touchType: "path_reference",
        pathResolutionMethod: item.pathResolutionMethod,
        operation: item.operation,
        operationDetectionScope: item.operationDetectionScope,
        evidence: { ...item },
      });
    }

    // 9. permission_required / permission_candidate / permission_error
    for (const item of permissionHintsFact.filter(ph => ph.module === moduleName)) {
      let pType = "permission_candidate";
      if (item.permissionCandidateType === "permission_error") pType = "permission_error";
      else if (item.confidence === "confirmed") pType = "permission_required";

      rawModuleFacts.push({
        id: stableFactId({ type: pType, repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.permission }),
        runId,
        type: pType,
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.permission,
        permission: item.permission,
        permissionCandidateType: item.permissionCandidateType,
        confidence: item.confidence,
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
        id: stableFactId({ type: hType, repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.value }),
        runId,
        type: hType,
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.value,
        evidence: { ...item },
      });
    }

    // 11. firestore_trigger
    for (const item of triggersFact.filter(t => t.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "firestore_trigger", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.firestorePath, secondaryKey: item.handlerName }),
        runId,
        type: "firestore_trigger",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.firestorePath,
        handlerName: item.handlerName,
        handlerStartLine: item.handlerStartLine,
        handlerEndLine: item.handlerEndLine,
        handlerResolutionStatus: item.handlerResolutionStatus,
        evidence: { ...item },
      });
    }

    // 12. api_contract
    for (const item of apiContractsFact.filter(a => a.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "api_contract", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.handlerName || item.value }),
        runId,
        type: "api_contract",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.handlerName || item.value,
        method: item.handlerName || item.value,
        contractType: item.contractType,
        handlerName: item.handlerName,
        handlerStartLine: item.handlerStartLine,
        handlerEndLine: item.handlerEndLine,
        handlerResolutionStatus: item.handlerResolutionStatus,
        evidence: { ...item },
      });
    }

    // 12b. pubsub_event_route
    for (const item of pubsubEventRoutesFact.filter(r => r.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "pubsub_event_route", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.sourceHandler, secondaryKey: `${item.dataType ?? "unresolved"}#${item.routeIndex}` }),
        runId,
        type: "pubsub_event_route",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: `${item.sourceHandler}[${item.dataType}]`,
        sourceHandler: item.sourceHandler,
        dataType: item.dataType,
        dataTypeResolutionStatus: item.dataTypeResolutionStatus,
        targetCalls: item.targetCalls,
        evidence: { ...item },
      });
    }

    // 13. type_alias
    for (const item of typeAliasesFact.filter(ta => ta.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "type_alias", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.name }),
        runId,
        type: "type_alias",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.name,
        evidence: { ...item },
      });
    }

    // 14. enum_declaration
    for (const item of enumsFact.filter(e => e.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "enum_declaration", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.name }),
        runId,
        type: "enum_declaration",
        repo: REPO_NAME,
        module: moduleName,
        file: item.path,
        line: item.line,
        value: item.name,
        evidence: { ...item },
      });
    }

    // 15. model_property
    for (const item of modelPropsFact.filter(mp => mp.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "model_property", repo: REPO_NAME, module: moduleName, file: item.path, line: item.line, primaryKey: item.parentName, secondaryKey: item.propertyName }),
        runId,
        type: "model_property",
        repo: REPO_NAME,
        module: moduleName,
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

    const summaryCounts = {
      files: moduleFiles.length,
      imports: facts.filter(f => f.type === "imports_dependency").length,
      exports: facts.filter(f => f.type === "exported_symbol").length,
      classes: facts.filter(f => f.type === "source_class").length,
      methods: facts.filter(f => f.type === "service_method" || f.type === "controller_method" || f.type === "class_method").length,
      functions: facts.filter(f => f.type === "function_declaration").length,
      typeAliases: facts.filter(f => f.type === "type_alias").length,
      enums: facts.filter(f => f.type === "enum_declaration").length,
      modelProperties: facts.filter(f => f.type === "model_property").length,
      calls: facts.filter(f => f.type === "call_expression").length,
      firestoreHints: facts.filter(f => f.type === "firestore_path_touched").length,
      permissionHints: facts.filter(f => f.type === "permission_required" || f.type === "permission_candidate" || f.type === "permission_error").length,
      externalHooks: facts.filter(f => f.type === "external_hook" || f.type === "pubsub_topic" || f.type === "pubsub_publish_call" || f.type === "http_or_client_path" || f.type === "environment_variable" || f.type === "storage_path").length,
      firestoreTriggers: facts.filter(f => f.type === "firestore_trigger").length,
      apiContracts: facts.filter(f => f.type === "api_contract").length,
      pubsubEventRoutes: facts.filter(f => f.type === "pubsub_event_route").length,
      services: services.length,
      controllers: controllers.length,
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
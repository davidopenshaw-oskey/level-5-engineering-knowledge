// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script builds module evidence and evidence graphs from raw AST evidence,
// validating against ast-evidence-manifest.json and modules.json, preserving
// generic compiler evidence and logging quality notifications.

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

const runContextPath = path.join(projectRoot, "output", "run-context.json");
if (!fs.existsSync(runContextPath)) {
  throw new Error("Could not find run-context.json. Please run `00-scan-repo` first.");
}
const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
const runId: string = runContext.runId;
const REPO_NAME: string = runContext.repoName;
if (!REPO_NAME) {
  throw new Error("Missing 'repoName' in output/run-context.json");
}

const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
const inputRoot = path.join(repoOutputDir, "facts");
if (!fs.existsSync(inputRoot)) {
  throw new Error(`Could not find facts directory at '${inputRoot}'. Please run 01-extract-ast-evidence first.`);
}

const modulesRoot = path.join(repoOutputDir, "knowledge-pipeline", "modules");
const notificationsPath = path.join(repoOutputDir, "run-notifications.json");

type NotificationSeverity = "info" | "warning" | "error";

interface NotificationEntry {
  id: string;
  timestamp: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: any;
  sourceScript?: string;
  humanAttentionRecommended?: boolean;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

type AnyRow = {
  repo?: string | null;
  module?: string | null;
  submodule?: string | null;
  path?: string | null;
  file?: string | null;
  [key: string]: any;
};

type EvidenceFact = {
  id: string;
  runId: string;
  type:
  | "source_file"
  | "firestore_path_touched"
  | "permission_required"
  | "permission_error"
  | "call_expression"
  | "imports_dependency"
  | "exported_symbol"
  | "service_method"
  | "controller_method"
  | "external_hook"
  | "pubsub_topic"
  | "http_or_client_path"
  | "environment_variable"
  | "storage_path"
  | "firestore_trigger"
  | "api_contract"
  | "type_alias"
  | "enum_declaration"
  | "model_property";

  repo?: string | null;
  module: string;
  submodule: string | null;
  file: string | null;
  line?: number | null;
  value?: string | null;
  symbol?: string | null;
  method?: string | null;
  className?: string | null;
  evidence: AnyRow;
};

interface AstManifestArtefact {
  file: string;
  evidenceType: string;
  recordCount: number;
  required: boolean;
}

interface AstManifest {
  schemaVersion: string;
  runId: string;
  repoName: string;
  generatedAt: string;
  artefacts: AstManifestArtefact[];
  errors: {
    file: string;
    recordCount: number;
  };
}

const SUPPORTED_EVIDENCE_TYPES = new Set([
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
]);

function loadNotifications(): RunNotifications {
  if (fs.existsSync(notificationsPath)) {
    try {
      return JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
    } catch {
      // Return fresh object
    }
  }
  return {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    updatedAt: new Date().toISOString(),
    highestSeverity: "info",
    entries: [],
  };
}

function addNotification(
  notifications: RunNotifications,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: any,
  sourceScript = "02-build-module-evidence",
  humanAttentionRecommended = false
) {
  const entry: NotificationEntry = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity,
    code,
    message,
    details,
    sourceScript,
    humanAttentionRecommended,
  };
  notifications.entries.push(entry);
  notifications.updatedAt = entry.timestamp;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
  };
  if (severityOrder[severity] > severityOrder[notifications.highestSeverity]) {
    notifications.highestSeverity = severity;
  }
}

function writeNotifications(notifications: RunNotifications) {
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
}

function stripAbsolutePath<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripAbsolutePath) as any;
  const copy = { ...obj } as any;
  delete copy.absolutePath;
  for (const key of Object.keys(copy)) {
    if (typeof copy[key] === "object" && copy[key] !== null) {
      copy[key] = stripAbsolutePath(copy[key]);
    }
  }
  return copy;
}

function readJson<T>(fileName: string): T[] {
  const fullPath = path.join(inputRoot, fileName);
  if (!fs.existsSync(fullPath)) return [];
  const content = fs.readFileSync(fullPath, "utf8");
  if (content.trim() === "") return [];
  return stripAbsolutePath(JSON.parse(content) as T[]);
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(stripAbsolutePath(data), null, 2));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function groupByPath<T extends AnyRow>(rows: T[]) {
  const map = new Map<string, T[]>();

  for (const row of rows) {
    if (!row.path) continue;
    if (!map.has(row.path)) map.set(row.path, []);
    map.get(row.path)!.push(row);
  }

  return map;
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null;
}

function cleanValue(value: unknown): string | null {
  const s = safeString(value);
  return s ? s.trim() : null;
}

function stableId(parts: Array<string | number | null | undefined>) {
  return parts
    .map(part => String(part ?? ""))
    .join("|")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeFirestorePath(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("/");
}

function looksLikePermission(value: string): boolean {
  return /^v\d+\./.test(value.trim());
}

function looksLikePermissionError(value: string): boolean {
  const v = value.trim();

  return (
    v === "permission-denied" ||
    v.includes("permission-denied") ||
    v.includes("Permission denied")
  );
}

function moduleOf(record: AnyRow, targetModule: string): string {
  return safeString(record.module) ?? targetModule;
}

function submoduleOf(record: AnyRow): string | null {
  return safeString(record.submodule);
}

function fileOf(record: AnyRow): string | null {
  return safeString(record.file) ?? safeString(record.path);
}

function fact(input: {
  type: EvidenceFact["type"];
  runId: string;
  repo?: string | null;
  module: string;
  submodule?: string | null;
  file?: string | null;
  line?: number | null;
  value?: string | null;
  symbol?: string | null;
  method?: string | null;
  className?: string | null;
  evidence: AnyRow;
}): EvidenceFact {
  const repo = input.repo ?? REPO_NAME;
  const submodule = input.submodule ?? null;
  const file = input.file ?? null;
  const line = input.line ?? null;
  const value = input.value ?? null;
  const symbol = input.symbol ?? null;
  const method = input.method ?? null;
  const className = input.className ?? null;

  const id = stableId([
    input.type,
    repo,
    input.module,
    submodule,
    file,
    line,
    value,
    symbol,
    className,
    method,
  ]);

  return {
    id,
    runId: input.runId,
    type: input.type,
    repo,
    module: input.module,
    submodule,
    file,
    line,
    value,
    symbol,
    className,
    method,
    evidence: stripAbsolutePath(input.evidence),
  };
}

function dedupFacts(facts: EvidenceFact[], notifications: RunNotifications): EvidenceFact[] {
  const map = new Map<string, EvidenceFact>();
  let duplicateCount = 0;

  for (const f of facts) {
    if (map.has(f.id)) {
      duplicateCount++;
    }
    map.set(f.id, f);
  }

  if (duplicateCount > 0) {
    addNotification(
      notifications,
      "warning",
      "DUPLICATE_EVIDENCE_ID_WARNING",
      `Deduplicated ${duplicateCount} evidence facts with identical composite IDs.`,
      { duplicateCount }
    );
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    if ((a.file ?? "") !== (b.file ?? ""))
      return (a.file ?? "").localeCompare(b.file ?? "");
    if ((a.line ?? 0) !== (b.line ?? 0))
      return (a.line ?? 0) - (b.line ?? 0);
    return a.type.localeCompare(b.type);
  });
}

function buildModuleEvidence(
  targetModule: string,
  raw: {
    imports: AnyRow[];
    exports_: AnyRow[];
    classes: AnyRow[];
    methods: AnyRow[];
    functions: AnyRow[];
    typeAliases: AnyRow[];
    enums: AnyRow[];
    modelProperties: AnyRow[];
    calls: AnyRow[];
    firestoreHints: AnyRow[];
    permissionHints: AnyRow[];
    externalHooks: AnyRow[];
    firestoreTriggers: AnyRow[];
    apiContracts: AnyRow[];
  },
  notifications: RunNotifications
) {
  const isTarget = (row: AnyRow, target: string) => row.module === target;

  const imports = raw.imports.filter(r => isTarget(r, targetModule));
  const exports_ = raw.exports_.filter(r => isTarget(r, targetModule));
  const classes = raw.classes.filter(r => isTarget(r, targetModule));
  const methods = raw.methods.filter(r => isTarget(r, targetModule));
  const functions = raw.functions.filter(r => isTarget(r, targetModule));
  const typeAliases = (raw.typeAliases || []).filter(r => isTarget(r, targetModule));
  const enums = (raw.enums || []).filter(r => isTarget(r, targetModule));
  const modelProperties = (raw.modelProperties || []).filter(r => isTarget(r, targetModule));
  const calls = raw.calls.filter(r => isTarget(r, targetModule));
  const firestoreHints = raw.firestoreHints.filter(r => isTarget(r, targetModule));
  const permissionHints = raw.permissionHints.filter(r => isTarget(r, targetModule));
  const externalHooks = raw.externalHooks.filter(r => isTarget(r, targetModule));
  const firestoreTriggers = raw.firestoreTriggers.filter(r => isTarget(r, targetModule));
  const apiContracts = raw.apiContracts.filter(r => isTarget(r, targetModule));

  const allRows = [
    ...imports,
    ...exports_,
    ...classes,
    ...methods,
    ...functions,
    ...typeAliases,
    ...enums,
    ...modelProperties,
    ...calls,
    ...firestoreHints,
    ...permissionHints,
    ...externalHooks,
    ...firestoreTriggers,
    ...apiContracts,
  ];

  if (allRows.length === 0) {
    addNotification(
      notifications,
      "warning",
      "EMPTY_MODULE_EVIDENCE_WARNING",
      `Module [${targetModule}] is declared in modules.json but has zero extracted AST evidence.`,
      { module: targetModule }
    );
  }

  const filePaths = unique(
    allRows
      .map(r => r.path)
      .filter((p): p is string => typeof p === "string"),
  ).sort();

  const importsByFile = groupByPath(imports);
  const exportsByFile = groupByPath(exports_);
  const classesByFile = groupByPath(classes);
  const methodsByFile = groupByPath(methods);
  const functionsByFile = groupByPath(functions);
  const typeAliasesByFile = groupByPath(typeAliases);
  const enumsByFile = groupByPath(enums);
  const modelPropertiesByFile = groupByPath(modelProperties);
  const callsByFile = groupByPath(calls);
  const firestoreByFile = groupByPath(firestoreHints);
  const permissionsByFile = groupByPath(permissionHints);
  const externalHooksByFile = groupByPath(externalHooks);
  const firestoreTriggersByFile = groupByPath(firestoreTriggers);
  const apiContractsByFile = groupByPath(apiContracts);

  const files = filePaths.map(filePath => ({
    path: filePath,
    repo: allRows.find(r => r.path === filePath)?.repo ?? REPO_NAME,
    submodule: allRows.find(r => r.path === filePath)?.submodule ?? null,
    imports: importsByFile.get(filePath) ?? [],
    exports: exportsByFile.get(filePath) ?? [],
    classes: classesByFile.get(filePath) ?? [],
    methods: methodsByFile.get(filePath) ?? [],
    functions: functionsByFile.get(filePath) ?? [],
    typeAliases: typeAliasesByFile.get(filePath) ?? [],
    enums: enumsByFile.get(filePath) ?? [],
    modelProperties: modelPropertiesByFile.get(filePath) ?? [],
    calls: callsByFile.get(filePath) ?? [],
    firestoreHints: firestoreByFile.get(filePath) ?? [],
    permissionHints: permissionsByFile.get(filePath) ?? [],
    externalHooks: externalHooksByFile.get(filePath) ?? [],
    firestoreTriggers: firestoreTriggersByFile.get(filePath) ?? [],
    apiContracts: apiContractsByFile.get(filePath) ?? [],
  }));

  if (files.length === 0 && allRows.length > 0) {
    addNotification(
      notifications,
      "warning",
      "MISSING_RELATIVE_PATH_WARNING",
      `Module [${targetModule}] has ${allRows.length} evidence row(s) but zero could be mapped to relative file paths.`,
      { module: targetModule, rowCount: allRows.length }
    );
  }

  const services = classes
    .filter(c => String(c.name ?? "").endsWith("Service"))
    .map(c => ({
      name: c.name,
      repo: c.repo ?? REPO_NAME,
      path: c.path,
      submodule: c.submodule ?? null,
      methods: methods
        .filter(m => m.path === c.path && m.className === c.name)
        .map(m => ({
          name: m.name,
          visibility: m.visibility,
          isStatic: m.isStatic,
          isAsync: m.isAsync,
          returnTypeText: m.returnTypeText,
          resolvedReturnTypeText: m.resolvedReturnTypeText,
          decorators: m.decorators ?? [],
          parameters: m.parameters ?? [],
        })),
    }));

  const controllers = classes
    .filter(c => String(c.name ?? "").endsWith("Controller"))
    .map(c => ({
      name: c.name,
      repo: c.repo ?? REPO_NAME,
      path: c.path,
      submodule: c.submodule ?? null,
      methods: methods
        .filter(m => m.path === c.path && m.className === c.name)
        .map(m => ({
          name: m.name,
          visibility: m.visibility,
          isStatic: m.isStatic,
          isAsync: m.isAsync,
          returnTypeText: m.returnTypeText,
          resolvedReturnTypeText: m.resolvedReturnTypeText,
          decorators: m.decorators ?? [],
          parameters: m.parameters ?? [],
        })),
    }));

  const crossModuleDependencies = imports
    .filter(i => {
      const spec = String(i.moduleSpecifier ?? "");
      return spec.includes("modules/") || spec.includes("src/modules/");
    })
    .map(i => ({
      repo: i.repo ?? REPO_NAME,
      sourceFile: i.path,
      submodule: i.submodule ?? null,
      importedFrom: i.moduleSpecifier,
      defaultImport: i.defaultImport ?? null,
      namespaceImport: i.namespaceImport ?? null,
      namedImports: i.namedImports ?? [],
    }));

  const summary = {
    files: files.length,
    imports: imports.length,
    exports: exports_.length,
    classes: classes.length,
    methods: methods.length,
    functions: functions.length,
    typeAliases: typeAliases.length,
    enums: enums.length,
    modelProperties: modelProperties.length,
    calls: calls.length,
    firestoreHints: firestoreHints.length,
    permissionHints: permissionHints.length,
    externalHooks: externalHooks.length,
    firestoreTriggers: firestoreTriggers.length,
    apiContracts: apiContracts.length,
    services: services.length,
    controllers: controllers.length,
  };

  const moduleOutputRoot = path.join(modulesRoot, targetModule);
  fs.mkdirSync(moduleOutputRoot, { recursive: true });

  writeJson(path.join(moduleOutputRoot, `${targetModule}-manifest.json`), {
    runId,
    generatedAt: new Date().toISOString(),
    module: targetModule,
    summary,
  });

  writeJson(path.join(moduleOutputRoot, `${targetModule}-files.json`), files);
  writeJson(path.join(moduleOutputRoot, `${targetModule}-services.json`), services);
  writeJson(path.join(moduleOutputRoot, `${targetModule}-controllers.json`), controllers);
  writeJson(
    path.join(moduleOutputRoot, `${targetModule}-firestore-triggers.json`),
    firestoreTriggers,
  );

  const evidence = {
    firestoreEvidence: firestoreHints.map(h => ({
      repo: h.repo ?? REPO_NAME,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    permissionEvidence: permissionHints.map(h => ({
      repo: h.repo ?? REPO_NAME,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    callEvidence: calls.map(c => ({
      repo: c.repo ?? REPO_NAME,
      module: c.module ?? targetModule,
      path: c.path,
      submodule: c.submodule ?? null,
      expression: c.expression,
      name: c.name,
      line: c.line,
      arguments: c.arguments ?? [],
    })),

    externalHooks: externalHooks.map(h => ({
      repo: h.repo ?? REPO_NAME,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      type: h.type,
      value: h.value,
      line: h.line,
    })),

    apiContractEvidence: apiContracts.map(c => ({
      ...c,
      repo: c.repo ?? REPO_NAME,
      module: c.module ?? targetModule,
      path: c.path,
      submodule: c.submodule ?? null,
    })),

    typeAliases: typeAliases.map(item => ({
      ...item,
      repo: item.repo ?? REPO_NAME,
      module: item.module ?? targetModule,
      path: item.path,
      submodule: item.submodule ?? null,
    })),

    enums: enums.map(item => ({
      ...item,
      repo: item.repo ?? REPO_NAME,
      module: item.module ?? targetModule,
      path: item.path,
      submodule: item.submodule ?? null,
    })),

    modelProperties: modelProperties.map(item => ({
      ...item,
      repo: item.repo ?? REPO_NAME,
      module: item.module ?? targetModule,
      path: item.path,
      submodule: item.submodule ?? null,
    })),

    firestoreTriggerArtefact: `${targetModule}-firestore-triggers.json`,

    crossModuleDependencies,

    exports: exports_.map(e => ({
      ...e,
      repo: e.repo ?? REPO_NAME,
      module: e.module ?? targetModule,
      path: e.path,
      submodule: e.submodule ?? null,
    })),

    warnings: [],
  };

  writeJson(path.join(moduleOutputRoot, `${targetModule}-evidence.json`), evidence);

  const facts: EvidenceFact[] = [];

  for (const fileRecord of files) {
    facts.push(
      fact({
        type: "source_file",
        runId,
        repo: fileRecord.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(fileRecord),
        file: fileOf(fileRecord),
        value: fileOf(fileRecord),
        evidence: {
          repo: fileRecord.repo ?? REPO_NAME,
          path: fileRecord.path,
          submodule: fileRecord.submodule ?? null,
        },
      }),
    );
  }

  for (const item of evidence.firestoreEvidence) {
    const value = cleanValue(item.value);
    if (!value) continue;
    if (!looksLikeFirestorePath(value)) continue;

    facts.push(
      fact({
        type: "firestore_path_touched",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.permissionEvidence) {
    const value = cleanValue(item.value);
    if (!value) continue;

    if (looksLikePermission(value)) {
      facts.push(
        fact({
          type: "permission_required",
          runId,
          repo: item.repo ?? REPO_NAME,
          module: moduleOf(item, targetModule),
          submodule: submoduleOf(item),
          file: fileOf(item),
          line: item.line,
          value,
          evidence: item,
        }),
      );
      continue;
    }

    if (looksLikePermissionError(value)) {
      facts.push(
        fact({
          type: "permission_error",
          runId,
          repo: item.repo ?? REPO_NAME,
          module: moduleOf(item, targetModule),
          submodule: submoduleOf(item),
          file: fileOf(item),
          line: item.line,
          value,
          evidence: item,
        }),
      );
    }
  }

  for (const item of evidence.callEvidence) {
    const expression = cleanValue(item.expression);
    if (!expression) continue;

    facts.push(
      fact({
        type: "call_expression",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: expression,
        method: item.name ?? expression,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.externalHooks) {
    const hookType = cleanValue(item.type);
    const value = cleanValue(item.value);
    let factType: EvidenceFact["type"] = "external_hook";

    if (hookType === "pubsub_topic") factType = "pubsub_topic";
    else if (hookType === "http_or_client_path_candidate") factType = "http_or_client_path";
    else if (hookType === "environment_variable") factType = "environment_variable";
    else if (hookType === "storage_path_candidate") factType = "storage_path";

    facts.push(
      fact({
        type: factType,
        runId,
        repo: item.repo ?? REPO_NAME,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.apiContractEvidence as AnyRow[]) {
    const handlerName = cleanValue(item.handlerName);
    if (!handlerName) continue;

    facts.push(
      fact({
        type: "api_contract",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: handlerName,
        method: handlerName,
        evidence: item,
      }),
    );
  }

  for (const item of firestoreTriggers) {
    const firestorePath = cleanValue(item.firestorePath);
    facts.push(
      fact({
        type: "firestore_trigger",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: firestorePath ?? item.triggerType,
        evidence: item,
      }),
    );
  }

  for (const item of crossModuleDependencies) {
    const importedFrom = cleanValue(item.importedFrom);
    if (!importedFrom) continue;

    facts.push(
      fact({
        type: "imports_dependency",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(item),
        file: safeString(item.sourceFile),
        value: importedFrom,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.exports as AnyRow[]) {
    const name = cleanValue(item.name);
    if (!name) continue;

    facts.push(
      fact({
        type: "exported_symbol",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(item),
        file: fileOf(item),
        value: name,
        symbol: name,
        evidence: item,
      }),
    );
  }

  for (const item of services) {
    for (const method of item.methods) {
      facts.push(
        fact({
          type: "service_method",
          runId,
          repo: item.repo ?? REPO_NAME,
          module: targetModule,
          submodule: submoduleOf(item),
          file: safeString(item.path),
          value: `${item.name}.${method.name}`,
          className: item.name,
          method: method.name,
          evidence: {
            serviceName: item.name,
            servicePath: item.path,
            method,
          },
        }),
      );
    }
  }

  for (const item of controllers) {
    for (const method of item.methods) {
      facts.push(
        fact({
          type: "controller_method",
          runId,
          repo: item.repo ?? REPO_NAME,
          module: targetModule,
          submodule: submoduleOf(item),
          file: safeString(item.path),
          value: `${item.name}.${method.name}`,
          className: item.name,
          method: method.name,
          evidence: {
            controllerName: item.name,
            controllerPath: item.path,
            method,
          },
        }),
      );
    }
  }

  for (const item of typeAliases) {
    facts.push(
      fact({
        type: "type_alias",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: item.name,
        symbol: item.name,
        evidence: item,
      }),
    );
  }

  for (const item of enums) {
    facts.push(
      fact({
        type: "enum_declaration",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: item.name,
        symbol: item.name,
        evidence: item,
      }),
    );
  }

  for (const item of modelProperties) {
    facts.push(
      fact({
        type: "model_property",
        runId,
        repo: item.repo ?? REPO_NAME,
        module: targetModule,
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: item.line,
        value: `${item.containerName}.${item.propertyName}`,
        className: item.containerName,
        symbol: item.propertyName,
        evidence: item,
      }),
    );
  }

  const dedupedFacts = dedupFacts(facts, notifications);

  const countsByType: Record<string, number> = {};
  for (const f of dedupedFacts) {
    countsByType[f.type] = (countsByType[f.type] ?? 0) + 1;
  }

  writeJson(path.join(moduleOutputRoot, `${targetModule}-evidence-graph.json`), {
    runId,
    generatedAt: new Date().toISOString(),
    module: targetModule,
    source: {
      manifest: `${targetModule}-manifest.json`,
      files: `${targetModule}-files.json`,
      services: `${targetModule}-services.json`,
      controllers: `${targetModule}-controllers.json`,
      firestoreTriggers: `${targetModule}-firestore-triggers.json`,
      evidence: `${targetModule}-evidence.json`,
    },
    summary: {
      inputSummary: summary,
      totalFacts: dedupedFacts.length,
      countsByType,
    },
    facts: dedupedFacts,
  });

  console.log(`${targetModule}:`, {
    ...summary,
    facts: dedupedFacts.length,
  });
}

function kebabToCamel(str: string): string {
  if (str === "exports") return "exports_";
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function main() {
  const notifications = loadNotifications();

  // Requirement 2: Use AST Evidence Manifest
  const manifestPath = path.join(inputRoot, "ast-evidence-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    addNotification(
      notifications,
      "error",
      "MISSING_AST_MANIFEST_ERROR",
      `Missing required AST evidence manifest at path [${manifestPath}].`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Missing required ast-evidence-manifest.json at '${manifestPath}'.`);
  }

  let astManifest: AstManifest;
  try {
    astManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err: any) {
    addNotification(
      notifications,
      "error",
      "MALFORMED_AST_JSON_ERROR",
      `AST evidence manifest at [${manifestPath}] is malformed JSON: ${err.message}`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Malformed AST manifest JSON at '${manifestPath}'.`);
  }

  if (astManifest.runId !== runId || astManifest.repoName !== REPO_NAME) {
    addNotification(
      notifications,
      "error",
      "RUN_REPO_MISMATCH_ERROR",
      `AST manifest contract mismatch: expected repo [${REPO_NAME}] run [${runId}], but found repo [${astManifest.repoName}] run [${astManifest.runId}].`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] AST manifest runId/repoName mismatch.`);
  }

  // Validate required artifacts listed in manifest
  for (const artefact of astManifest.artefacts) {
    const filePath = path.join(inputRoot, artefact.file);
    if (artefact.required) {
      if (!fs.existsSync(filePath)) {
        addNotification(
          notifications,
          "error",
          "MISSING_REQUIRED_ARTIFACT_ERROR",
          `Required AST evidence artifact [${artefact.file}] listed in manifest is missing on disk.`
        );
        writeNotifications(notifications);
        throw new Error(`[Fail-Closed] Required AST evidence artifact '${artefact.file}' is missing.`);
      }

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length !== artefact.recordCount) {
          addNotification(
            notifications,
            "warning",
            "RECORD_COUNT_MISMATCH_WARNING",
            `Record count mismatch for [${artefact.file}]: manifest recorded ${artefact.recordCount}, on-disk file contains ${parsed.length}.`
          );
        }
      } catch (err: any) {
        addNotification(
          notifications,
          "error",
          "MALFORMED_AST_JSON_ERROR",
          `Required AST artifact [${artefact.file}] contains malformed JSON: ${err.message}`
        );
        writeNotifications(notifications);
        throw new Error(`[Fail-Closed] Malformed AST JSON in artifact '${artefact.file}'.`);
      }
    }
  }

  // Requirement 3: Detect and record unknown AST evidence
  const physicalFiles = fs.readdirSync(inputRoot)
    .filter((f: string) => f.startsWith("ast-") && f.endsWith(".json") && f !== "ast-errors.json" && f !== "ast-evidence-manifest.json");

  for (const file of physicalFiles) {
    const fileBase = file.slice(4, -5);
    const propertyName = kebabToCamel(fileBase);

    if (!SUPPORTED_EVIDENCE_TYPES.has(propertyName) && !SUPPORTED_EVIDENCE_TYPES.has(fileBase)) {
      let recordCount = 0;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(inputRoot, file), "utf8"));
        recordCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        // Ignored
      }

      addNotification(
        notifications,
        "warning",
        "UNKNOWN_AST_EVIDENCE_TYPE",
        "AST evidence was generated but has no module synthesis handler.",
        {
          file,
          evidenceType: fileBase,
          recordCount,
          retained: true,
        },
        "02-build-module-evidence",
        true
      );
    }
  }

  // Load raw facts data
  const rawData: Record<string, AnyRow[]> = {};
  const raw = new Proxy(rawData, {
    get(target, prop: string) {
      return target[prop] ?? [];
    }
  });

  for (const file of physicalFiles) {
    const fileBase = file.slice(4, -5);
    const propertyName = kebabToCamel(fileBase);
    rawData[propertyName] = readJson<AnyRow>(file);
  }

  // Requirement 4: Use Script 00's module inventory as authoritative module list
  const modulesInventoryPath = path.join(inputRoot, "modules.json");
  if (!fs.existsSync(modulesInventoryPath)) {
    addNotification(
      notifications,
      "error",
      "MISSING_MODULES_INVENTORY_ERROR",
      `Missing required modules.json inventory at path [${modulesInventoryPath}].`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json inventory at '${modulesInventoryPath}'.`);
  }

  const moduleInventory = readJson<{ module: string }>("modules.json");
  const moduleList = unique(moduleInventory.map(m => m.module)).sort();

  if (moduleList.length === 0) {
    addNotification(
      notifications,
      "error",
      "ZERO_MODULES_INVENTORY_ERROR",
      `Authoritative modules.json inventory contains zero modules.`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Zero modules declared in modules.json.`);
  }

  fs.mkdirSync(modulesRoot, { recursive: true });

  console.log(`Discovered ${physicalFiles.length} raw AST evidence files in facts root.`);
  console.log(`Building module evidence and evidence graphs for ${moduleList.length} authoritative modules`);

  for (const moduleName of moduleList) {
    buildModuleEvidence(moduleName, raw as any, notifications);
  }

  // Write updated run-notifications.json
  writeNotifications(notifications);

  console.log("Complete");
  console.log("Wrote output/knowledge-pipeline/modules/*");
}

main();
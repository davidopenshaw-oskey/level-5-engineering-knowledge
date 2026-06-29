import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

const inputRoot = path.join(projectRoot, "output/raw");
const modulesRoot = path.join(projectRoot, "output/knowledge-pipeline/modules");

const FIRESTORE_ROOT_COLLECTIONS = [
  "/EmailLogs",
  "/accessControlDevices",
  "/buildings",
  "/calls",
  "/entities",
  "/externalUserInvitations",
  "/organizations",
  "/properties",
  "/settings",
  "/suppliers",
  "/users",
];

type AnyRow = {
  repo?: string | null;
  module?: string | null;
  submodule?: string | null;
  path?: string | null;
  absolutePath?: string | null;
  file?: string | null;
  [key: string]: any;
};

type EvidenceFact = {
  id: string;
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
  | "firestore_trigger";

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

function readJson<T>(fileName: string): T[] {
  const fullPath = path.join(inputRoot, fileName);
  if (!fs.existsSync(fullPath)) return [];
  return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T[];
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getModules(rows: AnyRow[]) {
  return Array.from(
    new Set(
      rows
        .map(r => r.module)
        .filter((m): m is string => typeof m === "string" && m.length > 0),
    ),
  ).sort();
}

function isTarget(row: AnyRow, targetModule: string) {
  return row.module === targetModule;
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
  if (!trimmed.startsWith("/")) return false;

  return FIRESTORE_ROOT_COLLECTIONS.some(collection =>
    trimmed.includes(collection),
  );
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
  return safeString(record.path) ?? safeString(record.file);
}

function lineOf(record: AnyRow): number | null {
  return typeof record.line === "number" ? record.line : null;
}

function fact(input: Omit<EvidenceFact, "id">): EvidenceFact {
  return {
    ...input,
    id: stableId([
      input.type,
      input.repo ?? null,
      input.module,
      input.submodule,
      input.file,
      input.line ?? null,
      input.value ?? null,
      input.symbol ?? null,
      input.className ?? null,
      input.method ?? null,
    ]),
  };
}

function dedupeFacts(facts: EvidenceFact[]) {
  const map = new Map<string, EvidenceFact>();

  for (const f of facts) {
    if (!map.has(f.id)) map.set(f.id, f);
  }

  return Array.from(map.values()).sort((a, b) => {
    const af = a.file ?? "";
    const bf = b.file ?? "";
    if (af !== bf) return af.localeCompare(bf);

    const al = a.line ?? 0;
    const bl = b.line ?? 0;
    if (al !== bl) return al - bl;

    return a.type.localeCompare(b.type);
  });
}

function buildModuleEvidence(targetModule: string, raw: {
  imports: AnyRow[];
  exports_: AnyRow[];
  classes: AnyRow[];
  methods: AnyRow[];
  functions: AnyRow[];
  calls: AnyRow[];
  firestoreHints: AnyRow[];
  permissionHints: AnyRow[];
  externalHooks: AnyRow[];
  firestoreTriggers: AnyRow[];
}) {
  const imports = raw.imports.filter(r => isTarget(r, targetModule));
  const exports_ = raw.exports_.filter(r => isTarget(r, targetModule));
  const classes = raw.classes.filter(r => isTarget(r, targetModule));
  const methods = raw.methods.filter(r => isTarget(r, targetModule));
  const functions = raw.functions.filter(r => isTarget(r, targetModule));
  const calls = raw.calls.filter(r => isTarget(r, targetModule));
  const firestoreHints = raw.firestoreHints.filter(r => isTarget(r, targetModule));
  const permissionHints = raw.permissionHints.filter(r => isTarget(r, targetModule));
  const externalHooks = raw.externalHooks.filter(r => isTarget(r, targetModule));
  const firestoreTriggers = raw.firestoreTriggers.filter(r => isTarget(r, targetModule));

  const allRows = [
    ...imports,
    ...exports_,
    ...classes,
    ...methods,
    ...functions,
    ...calls,
    ...firestoreHints,
    ...permissionHints,
    ...externalHooks,
    ...firestoreTriggers,
  ];

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
  const callsByFile = groupByPath(calls);
  const firestoreByFile = groupByPath(firestoreHints);
  const permissionsByFile = groupByPath(permissionHints);
  const externalHooksByFile = groupByPath(externalHooks);
  const firestoreTriggersByFile = groupByPath(firestoreTriggers);

  const files = filePaths.map(filePath => ({
    path: filePath,
    repo: allRows.find(r => r.path === filePath)?.repo ?? null,
    submodule: allRows.find(r => r.path === filePath)?.submodule ?? null,
    imports: importsByFile.get(filePath) ?? [],
    exports: exportsByFile.get(filePath) ?? [],
    classes: classesByFile.get(filePath) ?? [],
    methods: methodsByFile.get(filePath) ?? [],
    functions: functionsByFile.get(filePath) ?? [],
    calls: callsByFile.get(filePath) ?? [],
    firestoreHints: firestoreByFile.get(filePath) ?? [],
    permissionHints: permissionsByFile.get(filePath) ?? [],
    externalHooks: externalHooksByFile.get(filePath) ?? [],
    firestoreTriggers: firestoreTriggersByFile.get(filePath) ?? [],
  }));

  const services = classes
    .filter(c => String(c.name ?? "").endsWith("Service"))
    .map(c => ({
      name: c.name,
      repo: c.repo ?? null,
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
      repo: c.repo ?? null,
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
      repo: i.repo ?? null,
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
    calls: calls.length,
    firestoreHints: firestoreHints.length,
    permissionHints: permissionHints.length,
    externalHooks: externalHooks.length,
    firestoreTriggers: firestoreTriggers.length,
    services: services.length,
    controllers: controllers.length,
  };

  const moduleOutputRoot = path.join(modulesRoot, targetModule);
  fs.mkdirSync(moduleOutputRoot, { recursive: true });

  writeJson(path.join(moduleOutputRoot, `${targetModule}-manifest.json`), {
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
      repo: h.repo ?? null,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    permissionEvidence: permissionHints.map(h => ({
      repo: h.repo ?? null,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    callEvidence: calls.map(c => ({
      repo: c.repo ?? null,
      module: c.module ?? targetModule,
      path: c.path,
      submodule: c.submodule ?? null,
      expression: c.expression,
      name: c.name,
      line: c.line,
      arguments: c.arguments ?? [],
    })),

    externalHooks: externalHooks.map(h => ({
      repo: h.repo ?? null,
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      type: h.type,
      value: h.value,
      line: h.line,
    })),

    firestoreTriggerArtefact: `${targetModule}-firestore-triggers.json`,

    crossModuleDependencies,

    exports: exports_.map(e => ({
      repo: e.repo ?? null,
      module: e.module ?? targetModule,
      path: e.path,
      submodule: e.submodule ?? null,
      kind: e.kind,
      name: e.name,
      moduleSpecifier: e.moduleSpecifier,
    })),

    warnings: [],
  };

  writeJson(path.join(moduleOutputRoot, `${targetModule}-evidence.json`), evidence);

  const facts: EvidenceFact[] = [];

  for (const fileRecord of files) {
    facts.push(
      fact({
        type: "source_file",
        repo: fileRecord.repo ?? null,
        module: targetModule,
        submodule: submoduleOf(fileRecord),
        file: fileOf(fileRecord),
        value: fileOf(fileRecord),
        evidence: {
          repo: fileRecord.repo ?? null,
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
        repo: item.repo ?? null,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: lineOf(item),
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
          repo: item.repo ?? null,
          module: moduleOf(item, targetModule),
          submodule: submoduleOf(item),
          file: fileOf(item),
          line: lineOf(item),
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
          repo: item.repo ?? null,
          module: moduleOf(item, targetModule),
          submodule: submoduleOf(item),
          file: fileOf(item),
          line: lineOf(item),
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
        repo: item.repo ?? null,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: lineOf(item),
        value: expression,
        symbol: cleanValue(item.name),
        evidence: item,
      }),
    );
  }

  for (const item of evidence.externalHooks) {
    const value = cleanValue(item.value);
    if (!value) continue;

    const hookType = cleanValue(item.type);

    let factType: EvidenceFact["type"] = "external_hook";

    if (hookType === "environment_variable") {
      factType = "environment_variable";
    } else if (hookType === "pubsub_or_notification_candidate") {
      factType = "pubsub_topic";
    } else if (hookType === "http_or_client_path_candidate") {
      factType = "http_or_client_path";
    } else if (hookType === "storage_path_candidate") {
      factType = "storage_path";
    }

    facts.push(
      fact({
        type: factType,
        repo: item.repo ?? null,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: lineOf(item),
        value,
        evidence: {
          ...item,
          externalBoundaryStatus: "candidate",
        },
      }),
    );
  }

  for (const item of firestoreTriggers) {
    const triggerType = cleanValue(item.triggerType) ?? "unknown";
    const handlerName = cleanValue(item.handlerName);
    const firestorePath = cleanValue(item.firestorePath);
    const rawText = cleanValue(item.rawText);

    const value =
      firestorePath ??
      handlerName ??
      rawText ??
      `${triggerType} trigger`;

    facts.push(
      fact({
        type: "firestore_trigger",
        repo: item.repo ?? null,
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: lineOf(item),
        value,
        symbol: handlerName,
        evidence: {
          ...item,
          triggerType,
          firestorePath: firestorePath ?? null,
          handlerName: handlerName ?? null,
        },
      }),
    );
  }

  for (const item of evidence.crossModuleDependencies) {
    const importedFrom = cleanValue(item.importedFrom);
    if (!importedFrom) continue;

    facts.push(
      fact({
        type: "imports_dependency",
        repo: item.repo ?? null,
        module: targetModule,
        submodule: submoduleOf(item),
        file: safeString(item.sourceFile),
        value: importedFrom,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.exports) {
    const name = cleanValue(item.name);
    if (!name) continue;

    facts.push(
      fact({
        type: "exported_symbol",
        repo: item.repo ?? null,
        module: targetModule,
        submodule: submoduleOf(item),
        file: fileOf(item),
        value: name,
        symbol: name,
        evidence: item,
      }),
    );
  }

  for (const service of services) {
    const serviceName = cleanValue(service.name);

    for (const method of service.methods ?? []) {
      const methodName = cleanValue(method.name);
      if (!serviceName || !methodName) continue;

      facts.push(
        fact({
          type: "service_method",
          repo: service.repo ?? null,
          module: targetModule,
          submodule: submoduleOf(service),
          file: fileOf(service),
          className: serviceName,
          method: methodName,
          value: `${serviceName}.${methodName}`,
          evidence: { service, method },
        }),
      );
    }
  }

  for (const controller of controllers) {
    const controllerName = cleanValue(controller.name);

    for (const method of controller.methods ?? []) {
      const methodName = cleanValue(method.name);
      if (!controllerName || !methodName) continue;

      facts.push(
        fact({
          type: "controller_method",
          repo: controller.repo ?? null,
          module: targetModule,
          submodule: submoduleOf(controller),
          file: fileOf(controller),
          className: controllerName,
          method: methodName,
          value: `${controllerName}.${methodName}`,
          evidence: { controller, method },
        }),
      );
    }
  }

  const dedupedFacts = dedupeFacts(facts);

  const countsByType = dedupedFacts.reduce<Record<string, number>>((acc, f) => {
    acc[f.type] = (acc[f.type] ?? 0) + 1;
    return acc;
  }, {});

  writeJson(path.join(moduleOutputRoot, `${targetModule}-evidence-graph.json`), {
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

function main() {
  const raw = {
    imports: readJson<AnyRow>("ast-imports.json"),
    exports_: readJson<AnyRow>("ast-exports.json"),
    classes: readJson<AnyRow>("ast-classes.json"),
    methods: readJson<AnyRow>("ast-methods.json"),
    functions: readJson<AnyRow>("ast-functions.json"),
    calls: readJson<AnyRow>("ast-calls.json"),
    firestoreHints: readJson<AnyRow>("ast-firestore-hints.json"),
    permissionHints: readJson<AnyRow>("ast-permission-hints.json"),
    externalHooks: readJson<AnyRow>("ast-external-hooks.json"),
    firestoreTriggers: readJson<AnyRow>("ast-firestore-triggers.json"),
  };

  const modules = getModules([
    ...raw.imports,
    ...raw.exports_,
    ...raw.classes,
    ...raw.methods,
    ...raw.functions,
    ...raw.calls,
    ...raw.firestoreHints,
    ...raw.permissionHints,
    ...raw.externalHooks,
    ...raw.firestoreTriggers,
  ]);

  fs.mkdirSync(modulesRoot, { recursive: true });

  console.log(`Building module evidence and evidence graphs for ${modules.length} modules`);

  for (const moduleName of modules) {
    buildModuleEvidence(moduleName, raw);
  }

  console.log("Complete");
  console.log("Wrote output/knowledge-pipeline/modules/*");
}

main();
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const inputRoot = path.join(projectRoot, "output/raw");
const modulesRoot = path.join(projectRoot, "output/knowledge-pipeline/modules");

type AnyRow = {
  repo?: string;
  module?: string;
  submodule?: string | null;
  path?: string;
  absolutePath?: string;
  [key: string]: any;
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

function buildModuleEvidence(targetModule: string, raw: {
  imports: AnyRow[];
  exports_: AnyRow[];
  classes: AnyRow[];
  methods: AnyRow[];
  functions: AnyRow[];
  calls: AnyRow[];
  firestoreHints: AnyRow[];
  permissionHints: AnyRow[];
}) {
  const imports = raw.imports.filter(r => isTarget(r, targetModule));
  const exports_ = raw.exports_.filter(r => isTarget(r, targetModule));
  const classes = raw.classes.filter(r => isTarget(r, targetModule));
  const methods = raw.methods.filter(r => isTarget(r, targetModule));
  const functions = raw.functions.filter(r => isTarget(r, targetModule));
  const calls = raw.calls.filter(r => isTarget(r, targetModule));
  const firestoreHints = raw.firestoreHints.filter(r => isTarget(r, targetModule));
  const permissionHints = raw.permissionHints.filter(r => isTarget(r, targetModule));

  const allRows = [
    ...imports,
    ...exports_,
    ...classes,
    ...methods,
    ...functions,
    ...calls,
    ...firestoreHints,
    ...permissionHints,
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

  const files = filePaths.map(filePath => ({
    path: filePath,
    submodule: allRows.find(r => r.path === filePath)?.submodule ?? null,
    imports: importsByFile.get(filePath) ?? [],
    exports: exportsByFile.get(filePath) ?? [],
    classes: classesByFile.get(filePath) ?? [],
    methods: methodsByFile.get(filePath) ?? [],
    functions: functionsByFile.get(filePath) ?? [],
    calls: callsByFile.get(filePath) ?? [],
    firestoreHints: firestoreByFile.get(filePath) ?? [],
    permissionHints: permissionsByFile.get(filePath) ?? [],
  }));

  const services = classes
    .filter(c => String(c.name ?? "").endsWith("Service"))
    .map(c => ({
      name: c.name,
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
    services: services.length,
    controllers: controllers.length,
  };

  const moduleOutputRoot = path.join(modulesRoot, targetModule);
  fs.mkdirSync(moduleOutputRoot, { recursive: true });

  writeJson(path.join(moduleOutputRoot, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    module: targetModule,
    summary,
  });

  writeJson(path.join(moduleOutputRoot, "files.json"), files);
  writeJson(path.join(moduleOutputRoot, "services.json"), services);
  writeJson(path.join(moduleOutputRoot, "controllers.json"), controllers);

  writeJson(path.join(moduleOutputRoot, "evidence.json"), {
    firestoreEvidence: firestoreHints.map(h => ({
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    permissionEvidence: permissionHints.map(h => ({
      module: h.module ?? targetModule,
      path: h.path,
      submodule: h.submodule ?? null,
      value: h.value,
      line: h.line,
    })),

    callEvidence: calls.map(c => ({
      module: c.module ?? targetModule,
      path: c.path,
      submodule: c.submodule ?? null,
      expression: c.expression,
      name: c.name,
      line: c.line,
      arguments: c.arguments ?? [],
    })),

    crossModuleDependencies,

    exports: exports_.map(e => ({
      module: e.module ?? targetModule,
      path: e.path,
      submodule: e.submodule ?? null,
      kind: e.kind,
      name: e.name,
      moduleSpecifier: e.moduleSpecifier,
    })),

    warnings: [],
  });

  console.log(`${targetModule}:`, summary);
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
  ]);

  fs.mkdirSync(modulesRoot, { recursive: true });

  console.log(`Building module evidence for ${modules.length} modules`);

  for (const moduleName of modules) {
    buildModuleEvidence(moduleName, raw);
  }

  console.log(`Wrote module evidence to output/knowledge-pipeline/modules/`);
}

main();
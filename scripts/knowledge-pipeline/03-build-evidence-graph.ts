import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
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

type AnyRecord = {
  [key: string]: any;
};

type EvidenceFact = {
  id: string;
  type:
    | "firestore_path_touched"
    | "permission_required"
    | "permission_error"
    | "call_expression"
    | "imports_dependency"
    | "exported_symbol"
    | "service_method"
    | "controller_method"
    | "source_file";

  module: string;
  submodule: string | null;
  file: string | null;
  line?: number | null;
  value?: string | null;
  symbol?: string | null;
  method?: string | null;
  className?: string | null;
  evidence: AnyRecord;
};

function readJson<T>(moduleRoot: string, fileName: string): T {
  const fullPath = path.join(moduleRoot, fileName);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing input file: ${fullPath}`);
  }

  return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

function moduleOf(record: AnyRecord, targetModule: string): string {
  return safeString(record.module) ?? targetModule;
}

function submoduleOf(record: AnyRecord): string | null {
  return safeString(record.submodule);
}

function fileOf(record: AnyRecord): string | null {
  return safeString(record.path) ?? safeString(record.file);
}

function lineOf(record: AnyRecord): number | null {
  return typeof record.line === "number" ? record.line : null;
}

function fact(input: Omit<EvidenceFact, "id">): EvidenceFact {
  return {
    ...input,
    id: stableId([
      input.type,
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
    if (!map.has(f.id)) {
      map.set(f.id, f);
    }
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

function getModuleDirectories() {
  if (!fs.existsSync(modulesRoot)) return [];

  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function buildEvidenceGraph(targetModule: string) {
  const moduleRoot = path.join(modulesRoot, targetModule);
  const outputPath = path.join(moduleRoot, "evidence-graph.json");

  const manifest = readJson<AnyRecord>(moduleRoot, "manifest.json");
  const files = readJson<AnyRecord[]>(moduleRoot, "files.json");
  const services = readJson<AnyRecord[]>(moduleRoot, "services.json");
  const controllers = readJson<AnyRecord[]>(moduleRoot, "controllers.json");
  const evidence = readJson<AnyRecord>(moduleRoot, "evidence.json");

  const facts: EvidenceFact[] = [];

  for (const fileRecord of files) {
    facts.push(
      fact({
        type: "source_file",
        module: targetModule,
        submodule: submoduleOf(fileRecord),
        file: fileOf(fileRecord),
        value: fileOf(fileRecord),
        evidence: {
          path: fileRecord.path,
          submodule: fileRecord.submodule ?? null,
        },
      }),
    );
  }

  for (const item of evidence.firestoreEvidence ?? []) {
    const value = cleanValue(item.value);
    if (!value) continue;
    if (!looksLikeFirestorePath(value)) continue;

    facts.push(
      fact({
        type: "firestore_path_touched",
        module: moduleOf(item, targetModule),
        submodule: submoduleOf(item),
        file: fileOf(item),
        line: lineOf(item),
        value,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.permissionEvidence ?? []) {
    const value = cleanValue(item.value);
    if (!value) continue;

    if (looksLikePermission(value)) {
      facts.push(
        fact({
          type: "permission_required",
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

  for (const item of evidence.callEvidence ?? []) {
    const expression = cleanValue(item.expression);
    if (!expression) continue;

    facts.push(
      fact({
        type: "call_expression",
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

  for (const item of evidence.crossModuleDependencies ?? []) {
    const importedFrom = cleanValue(item.importedFrom);
    if (!importedFrom) continue;

    facts.push(
      fact({
        type: "imports_dependency",
        module: targetModule,
        submodule: submoduleOf(item),
        file: safeString(item.sourceFile),
        value: importedFrom,
        evidence: item,
      }),
    );
  }

  for (const item of evidence.exports ?? []) {
    const name = cleanValue(item.name);
    if (!name) continue;

    facts.push(
      fact({
        type: "exported_symbol",
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

  const graph = {
    generatedAt: new Date().toISOString(),
    module: targetModule,
    source: {
      manifest: "manifest.json",
      files: "files.json",
      services: "services.json",
      controllers: "controllers.json",
      evidence: "evidence.json",
    },
    summary: {
      inputSummary: manifest.summary ?? null,
      totalFacts: dedupedFacts.length,
      countsByType,
    },
    facts: dedupedFacts,
  };

  writeJson(outputPath, graph);

  console.log(`${targetModule}:`, graph.summary);
}

function main() {
  const modules = getModuleDirectories();

  console.log(`Building evidence graphs for ${modules.length} modules`);

  for (const moduleName of modules) {
    buildEvidenceGraph(moduleName);
  }

  console.log(`Wrote evidence graphs to output/knowledge-pipeline/modules/*/evidence-graph.json`);
}

main();
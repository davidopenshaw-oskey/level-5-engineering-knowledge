
import fs from "fs";
import path from "path";
import {
  Project,
  Node,
  SourceFile,
  SyntaxKind,
} from "ts-morph";

type FileInfo = {
  repo: string;
  module: string;
  submodule: string | null;
  path: string;
  sizeBytes: number;
};

type RepoConfig = {
  repositories: {
    name: string;
    path: string;
    modulesRoot: string;
  }[];
};

type BaseRecord = Omit<FileInfo, "sizeBytes"> & {
  absolutePath: string;
};

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, "config/repos.json");
const filesPath = path.join(projectRoot, "output/raw/files.json");
const outputRoot = path.join(projectRoot, "output/raw");

const repoConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) as RepoConfig;
const files = JSON.parse(fs.readFileSync(filesPath, "utf8")) as FileInfo[];

const repoPathMap = new Map(repoConfig.repositories.map(r => [r.name, r.path]));

function isTsSource(file: FileInfo) {
  return (
    file.sizeBytes > 0 &&
    file.path.endsWith(".ts") &&
    !file.path.endsWith(".d.ts") &&
    !file.path.includes("/node_modules/") &&
    !file.path.includes("/lib/") &&
    !file.path.includes("/dist/")
  );
}

function safeText(fn: () => string | undefined | null): string | null {
  try {
    return fn() ?? null;
  } catch {
    return null;
  }
}

function makeBase(file: FileInfo): BaseRecord | null {
  const repoPath = repoPathMap.get(file.repo);
  if (!repoPath) return null;

  const absolutePath = path.join(repoPath, file.path);
  if (!fs.existsSync(absolutePath)) return null;

  const { sizeBytes, ...rest } = file;
  return { ...rest, absolutePath };
}

function extractDecorators(node: Node) {
  if (!Node.isDecoratable(node)) return [];

  return node.getDecorators().map(d => ({
    name: d.getName(),
    arguments: d.getArguments().map(a => safeText(() => a.getText())),
  }));
}

function extractImports(sourceFile: SourceFile, base: BaseRecord) {
  return sourceFile.getImportDeclarations().map(i => ({
    ...base,
    moduleSpecifier: i.getModuleSpecifierValue(),
    defaultImport: safeText(() => i.getDefaultImport()?.getText()),
    namespaceImport: safeText(() => i.getNamespaceImport()?.getText()),
    namedImports: i.getNamedImports().map(n => ({
      name: n.getName(),
      alias: safeText(() => n.getAliasNode()?.getText()),
    })),
  }));
}

function extractExports(sourceFile: SourceFile, base: BaseRecord) {
  const rows: any[] = [];

  for (const e of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = e.getModuleSpecifierValue() ?? null;
    const namespaceExport = e.getNamespaceExport();

    if (namespaceExport) {
      rows.push({
        ...base,
        kind: "namespaceExport",
        name: namespaceExport.getName(),
        moduleSpecifier,
      });
      continue;
    }

    const namedExports = e.getNamedExports();
    if (namedExports.length) {
      for (const n of namedExports) {
        rows.push({
          ...base,
          kind: "namedExport",
          name: n.getName(),
          alias: safeText(() => n.getAliasNode()?.getText()),
          moduleSpecifier,
        });
      }
      continue;
    }

    if (moduleSpecifier) {
      rows.push({
        ...base,
        kind: "exportStar",
        name: "*",
        moduleSpecifier,
      });
    }
  }

  for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
    for (const d of declarations) {
      if (Node.isExportSpecifier(d)) continue;

      rows.push({
        ...base,
        kind: "localExport",
        name,
        declarationKind: d.getKindName(),
        moduleSpecifier: null,
      });
    }
  }

  return rows;
}

function extractClassesAndMethods(sourceFile: SourceFile, base: BaseRecord) {
  const classes: any[] = [];
  const methods: any[] = [];

  for (const c of sourceFile.getClasses()) {
    const className = c.getName() ?? "default";

    classes.push({
      ...base,
      name: className,
      isExported: c.isExported(),
      isDefaultExport: c.isDefaultExport(),
      extends: safeText(() => c.getExtends()?.getText()),
      decorators: extractDecorators(c),
    });

    for (const ctor of c.getConstructors()) {
      methods.push({
        ...base,
        className,
        kind: "constructor",
        name: "constructor",
        decorators: extractDecorators(ctor),
        parameters: ctor.getParameters().map(p => ({
          name: p.getName(),
          typeText: safeText(() => p.getTypeNode()?.getText()),
          resolvedTypeText: safeText(() => p.getType().getText()),
          decorators: extractDecorators(p),
        })),
      });
    }

    for (const m of c.getMethods()) {
      methods.push({
        ...base,
        className,
        kind: "method",
        name: m.getName(),
        isStatic: m.isStatic(),
        isAsync: m.isAsync(),
        visibility:
          m.hasModifier(SyntaxKind.PrivateKeyword) ? "private" :
          m.hasModifier(SyntaxKind.ProtectedKeyword) ? "protected" :
          "public",
        returnTypeText: safeText(() => m.getReturnTypeNode()?.getText()),
        resolvedReturnTypeText: safeText(() => m.getReturnType().getText()),
        decorators: extractDecorators(m),
        parameters: m.getParameters().map(p => ({
          name: p.getName(),
          typeText: safeText(() => p.getTypeNode()?.getText()),
          resolvedTypeText: safeText(() => p.getType().getText()),
          decorators: extractDecorators(p),
        })),
      });
    }
  }

  return { classes, methods };
}

function extractFunctions(sourceFile: SourceFile, base: BaseRecord) {
  return sourceFile.getFunctions().map(f => ({
    ...base,
    name: f.getName() ?? "anonymous",
    isExported: f.isExported(),
    isDefaultExport: f.isDefaultExport(),
    isAsync: f.isAsync(),
    returnTypeText: safeText(() => f.getReturnTypeNode()?.getText()),
    resolvedReturnTypeText: safeText(() => f.getReturnType().getText()),
    parameters: f.getParameters().map(p => ({
      name: p.getName(),
      typeText: safeText(() => p.getTypeNode()?.getText()),
      resolvedTypeText: safeText(() => p.getType().getText()),
    })),
  }));
}

function extractCalls(sourceFile: SourceFile, base: BaseRecord) {
  const rows: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();

    rows.push({
      ...base,
      expression: safeText(() => expr.getText()),
      name: Node.isIdentifier(expr) ? expr.getText() : null,
      line: node.getStartLineNumber(),
      arguments: node.getArguments().map(a => safeText(() => a.getText())),
    });
  });

  return rows;
}

function extractStringHints(sourceFile: SourceFile, base: BaseRecord) {
  const firestoreLike: any[] = [];
  const permissions: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) return;

    const text = node.getLiteralText();

    if (
      text.includes("/buildings") ||
      text.includes("/organizations") ||
      text.includes("/users") ||
      text.includes("/suppliers") ||
      text.includes("collection")
    ) {
      firestoreLike.push({
        ...base,
        value: text,
        line: node.getStartLineNumber(),
      });
    }

    if (text.startsWith("v1.") || text.includes("permission-denied")) {
      permissions.push({
        ...base,
        value: text,
        line: node.getStartLineNumber(),
      });
    }
  });

  return { firestoreLike, permissions };
}

async function main() {
  const tsFiles = files.filter(isTsSource);
  const mainRepo = repoConfig.repositories[0];

  if (!mainRepo) throw new Error("No repository configured.");

  const tsConfigFilePath = path.join(mainRepo.path, "functions", "tsconfig.json");

  const project = new Project({
    tsConfigFilePath: fs.existsSync(tsConfigFilePath) ? tsConfigFilePath : undefined,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: false,
      skipLibCheck: true,
      noEmit: true,
    },
  });

  const validFiles = tsFiles
    .map(f => ({ file: f, base: makeBase(f) }))
    .filter((x): x is { file: FileInfo; base: BaseRecord } => Boolean(x.base));

  console.log(`Manifest files: ${files.length}`);
  console.log(`TS files selected: ${validFiles.length}`);

  // Important: add all first, then extract. This lets ts-morph resolve cross-file symbols.
  for (const { base } of validFiles) {
    try {
      project.addSourceFileAtPath(base.absolutePath);
    } catch (err) {
      console.warn(`Could not add source file: ${base.path}`);
    }
  }

  const output = {
    imports: [] as any[],
    exports: [] as any[],
    classes: [] as any[],
    methods: [] as any[],
    functions: [] as any[],
    calls: [] as any[],
    firestoreHints: [] as any[],
    permissionHints: [] as any[],
    errors: [] as any[],
  };

  for (const { base } of validFiles) {
    const sourceFile = project.getSourceFile(base.absolutePath);
    if (!sourceFile) continue;

    try {
      output.imports.push(...extractImports(sourceFile, base));
      output.exports.push(...extractExports(sourceFile, base));

      const cm = extractClassesAndMethods(sourceFile, base);
      output.classes.push(...cm.classes);
      output.methods.push(...cm.methods);

      output.functions.push(...extractFunctions(sourceFile, base));
      output.calls.push(...extractCalls(sourceFile, base));

      const hints = extractStringHints(sourceFile, base);
      output.firestoreHints.push(...hints.firestoreLike);
      output.permissionHints.push(...hints.permissions);
    } catch (err: any) {
      output.errors.push({
        path: base.path,
        message: err?.message ?? String(err),
      });
    }
  }

  fs.mkdirSync(outputRoot, { recursive: true });

  fs.writeFileSync(path.join(outputRoot, "ast-imports.json"), JSON.stringify(output.imports, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-exports.json"), JSON.stringify(output.exports, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-classes.json"), JSON.stringify(output.classes, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-methods.json"), JSON.stringify(output.methods, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-functions.json"), JSON.stringify(output.functions, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-calls.json"), JSON.stringify(output.calls, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-firestore-hints.json"), JSON.stringify(output.firestoreHints, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-permission-hints.json"), JSON.stringify(output.permissionHints, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-errors.json"), JSON.stringify(output.errors, null, 2));

  console.log("AST extraction complete");
  console.log({
    imports: output.imports.length,
    exports: output.exports.length,
    classes: output.classes.length,
    methods: output.methods.length,
    functions: output.functions.length,
    calls: output.calls.length,
    firestoreHints: output.firestoreHints.length,
    permissionHints: output.permissionHints.length,
    errors: output.errors.length,
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
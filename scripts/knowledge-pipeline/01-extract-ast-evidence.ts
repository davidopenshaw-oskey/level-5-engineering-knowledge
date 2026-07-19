// **version:** 0.0.2
// **location:** level-5 phases 1, 2

// © [Year] Oskey SAS. All rights reserved
// This script extracts evidence from TypeScript source files, including imports, exports, classes, methods, functions, calls, and string hints related to Firestore and permissions.

import fs from "fs";
import path from "path";
import {
  Node,
  Project,
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
  runId: string;
};

type FirestoreTriggerRow = BaseRecord & {
  line: number;
  triggerType: "onCreate" | "onUpdate" | "onDelete" | "onWrite" | "unknown";
  firestorePath: string | null;
  handlerName: string | null;
  rawText: string;
};

type ApiContractRow = BaseRecord & {
  line: number;
  handlerName: string;
  requestType: string | null;
  requestSchema: Record<string, string> | null;
  responseType: string | null;
  decorators: { name: string; arguments: (string | null)[] }[];
}

const projectRoot = process.cwd();

const runContextPath = path.join(projectRoot, "output", "run-context.json");
if (!fs.existsSync(runContextPath)) {
  throw new Error("Could not find run-context.json. Please run `00-scan-repo` first.");
}
const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
const runId: string = runContext.runId;

const configPath = path.join(projectRoot, "config", "repos.json");
const versionedOutputRoot = path.join(projectRoot, "output", "runs", runId);
const outputRoot = path.join(versionedOutputRoot, "raw");
const filesPath = path.join(outputRoot, "files.json");

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
  return { ...rest, absolutePath, runId };
}

function extractDecorators(node: Node) {
  if (!Node.isDecoratable(node)) return [];

  return node.getDecorators().map(d => ({
    name: d.getName(),
    arguments: d.getArguments().map(a => safeText(() => a.getText())),
  }));
}

function getTriggerType(text: string): FirestoreTriggerRow["triggerType"] {
  if (text.includes("onDocumentCreated") || text.includes(".onCreate")) return "onCreate";
  if (text.includes("onDocumentUpdated") || text.includes(".onUpdate")) return "onUpdate";
  if (text.includes("onDocumentDeleted") || text.includes(".onDelete")) return "onDelete";
  if (text.includes("onDocumentWritten") || text.includes(".onWrite")) return "onWrite";
  return "unknown";
}

function extractFirestoreTriggers(
  sourceFile: SourceFile,
  base: BaseRecord,
): FirestoreTriggerRow[] {
  const rows: FirestoreTriggerRow[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const text = node.getText();
    const expression = safeText(() => node.getExpression().getText());

    const looksLikeTrigger =
      text.includes("onDocumentCreated") ||
      text.includes("onDocumentUpdated") ||
      text.includes("onDocumentDeleted") ||
      text.includes("onDocumentWritten") ||
      text.includes(".onCreate(") ||
      text.includes(".onUpdate(") ||
      text.includes(".onDelete(") ||
      text.includes(".onWrite(");

    if (!looksLikeTrigger) return;

    const args = node.getArguments().map(a => safeText(() => a.getText()));
    const firstStringArg =
      args
        .map(a => a?.replace(/^['"`]|['"`]$/g, ""))
        .find(a => a && a.includes("/")) ?? null;

    rows.push({
      ...base,
      line: node.getStartLineNumber(),
      triggerType: getTriggerType(text),
      firestorePath: firstStringArg,
      handlerName: expression,
      rawText: text.slice(0, 500),
    });
  });

  return rows;
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

function extractApiContracts(sourceFile: SourceFile, base: BaseRecord): ApiContractRow[] {
  const apiContracts: ApiContractRow[] = [];

  // Find https.onCall expressions to identify callable function handlers
  sourceFile.forEachDescendant(node => {
    if (Node.isCallExpression(node) && node.getExpression().getText().endsWith('https.onCall')) {
      const handlerArg = node.getArguments()[0];
      if (handlerArg && (Node.isIdentifier(handlerArg) || Node.isPropertyAccessExpression(handlerArg))) {
        const handlerFunc = handlerArg.getSymbol()?.getValueDeclaration();

        if (handlerFunc && (Node.isFunctionDeclaration(handlerFunc) || Node.isMethodDeclaration(handlerFunc) || Node.isArrowFunction(handlerFunc) || Node.isFunctionExpression(handlerFunc))) {
          let handlerName: string;
          if (Node.isFunctionDeclaration(handlerFunc) || Node.isMethodDeclaration(handlerFunc)) {
            handlerName = handlerFunc.getName() ?? handlerArg.getText();
          } else {
            // For ArrowFunction or FunctionExpression, we rely on the identifier that was passed to https.onCall.
            handlerName = handlerArg.getText();
          }

          const parameters = handlerFunc.getParameters();

          if (parameters.length > 0) {
            const requestParam = parameters[0]; // Assuming the first parameter is the request object
            const requestType = requestParam.getType();
            const requestTypeName = requestParam.getTypeNode()?.getText() ?? 'unknown';
            let requestSchema: Record<string, string> | null = null;

            // Use the type system to get properties directly, which is more robust
            const properties = requestType.getProperties();
            if (properties.length > 0) {
              requestSchema = {};
              properties.forEach(prop => {
                const propName = prop.getName();
                // Using getValueDeclaration() is the canonical way to get the node where a symbol is declared.
                // Then, getting its type and text is safe.
                const declaration = prop.getValueDeclaration();
                const propType = declaration ? declaration.getType().getText() : "any";
                requestSchema![propName] = propType;
              });
            }

            apiContracts.push({
              ...base,
              line: handlerFunc.getStartLineNumber(),
              handlerName: handlerName,
              requestType: requestTypeName,
              requestSchema: requestSchema,
              responseType: safeText(() => handlerFunc.getReturnType().getText()),
              decorators: Node.isDecoratable(handlerFunc) ? extractDecorators(handlerFunc) : [],
            });
          }
        }
      }
    }
  });

  return apiContracts;
}



function extractStringHints(sourceFile: SourceFile, base: BaseRecord) {
  const firestoreLike: any[] = [];
  const permissions: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) {
      return;
    }

    const text = node.getLiteralText();

    if (
      text.includes("/EmailLogs") ||
      text.includes("/accessControlDevices") ||
      text.includes("/buildings") ||
      text.includes("/calls") ||
      text.includes("/entities") ||
      text.includes("/externalUserInvitations") ||
      text.includes("/organizations") ||
      text.includes("/properties") ||
      text.includes("/settings") ||
      text.includes("/suppliers") ||
      text.includes("/users")
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

function extractExternalHooks(sourceFile: SourceFile, base: BaseRecord) {
  const hooks: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) {
      return;
    }

    const value = node.getLiteralText();
    const line = node.getStartLineNumber();

    if (
      value.includes("PUBSUB") ||
      value.includes("TOPIC") ||
      value.includes("OSK_PUBSUB") ||
      value.includes("FCM") ||
      value.includes("NOTIFICATION")
    ) {
      hooks.push({
        ...base,
        type: "pubsub_or_notification_candidate",
        value,
        line,
      });
    }

    if (
      value.startsWith("/") &&
      (
        value.includes("/api") ||
        value.includes("/calls") ||
        value.includes("/users") ||
        value.includes("/buildings") ||
        value.includes("/accessControlDevices")
      )
    ) {
      hooks.push({
        ...base,
        type: "http_or_client_path_candidate",
        value,
        line,
      });
    }

    if (
      value.includes("bucket") ||
      value.includes("storage") ||
      value.includes("public/") ||
      value.includes("calls/")
    ) {
      hooks.push({
        ...base,
        type: "storage_path_candidate",
        value,
        line,
      });
    }
  });

  sourceFile.forEachDescendant(node => {
    if (!Node.isPropertyAccessExpression(node)) return;

    const text = node.getText();

    if (text.startsWith("process.env.")) {
      hooks.push({
        ...base,
        type: "environment_variable",
        value: text.replace("process.env.", ""),
        line: node.getStartLineNumber(),
      });
    }
  });

  return hooks;
}

function main() {
  const tsFiles = files.filter(isTsSource);
  const firstRepo = repoConfig.repositories[0];

  if (!firstRepo) {
    throw new Error("No repository configured in config/repos.json");
  }

  const tsConfigFilePath = path.join(firstRepo.path, "functions", "tsconfig.json");

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
    .map(file => ({ file, base: makeBase(file) }))
    .filter((x): x is { file: FileInfo; base: BaseRecord } => Boolean(x.base));

  console.log(`Manifest files: ${files.length}`);
  console.log(`TS files selected: ${validFiles.length}`);

  for (const { base } of validFiles) {
    try {
      project.addSourceFileAtPath(base.absolutePath);
    } catch {
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
    externalHooks: [] as any[],
    firestoreTriggers: [] as FirestoreTriggerRow[],
    apiContracts: [] as ApiContractRow[],
    errors: [] as any[]
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
      output.firestoreTriggers.push(...extractFirestoreTriggers(sourceFile, base));

      const hints = extractStringHints(sourceFile, base);
      output.firestoreHints.push(...hints.firestoreLike);
      output.permissionHints.push(...hints.permissions);

      output.apiContracts.push(...extractApiContracts(sourceFile, base));
      output.externalHooks.push(...extractExternalHooks(sourceFile, base));
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
  fs.writeFileSync(path.join(outputRoot, "ast-external-hooks.json"), JSON.stringify(output.externalHooks, null, 2));
  fs.writeFileSync(
    path.join(outputRoot, "ast-api-contracts.json"), JSON.stringify(output.apiContracts, null, 2));
  fs.writeFileSync(
  path.join(outputRoot, "ast-firestore-triggers.json"),
  JSON.stringify(output.firestoreTriggers, null, 2),
);
  fs.writeFileSync(path.join(outputRoot, "ast-errors.json"), JSON.stringify(output.errors, null, 2));

  console.log("AST evidence extraction complete");
  console.log({
    imports: output.imports.length,
    exports: output.exports.length,
    classes: output.classes.length,
    methods: output.methods.length,
    functions: output.functions.length,
    calls: output.calls.length,
    firestoreHints: output.firestoreHints.length,
    permissionHints: output.permissionHints.length,
    externalHooks: output.externalHooks.length,
    apiContracts: output.apiContracts.length,
    firestoreTriggers: output.firestoreTriggers.length,
    errors: output.errors.length,
  });
}

main();
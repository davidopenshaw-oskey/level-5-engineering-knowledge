// **version:** 2.5.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
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
    governancePath?: string;
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
const REPO_NAME: string = runContext.repoName;
if (!REPO_NAME) {
  throw new Error("Missing 'repoName' in output/run-context.json");
}

const configPath = path.join(projectRoot, "config", "repos.json");
const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
const outputRoot = path.join(repoOutputDir, "facts");

const filesPath = path.join(outputRoot, "files.json");
if (!fs.existsSync(filesPath)) {
  throw new Error(`Could not find files.json at '${filesPath}'. Please run 00-scan-repo first.`);
}

const repoConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) as RepoConfig;
const files = JSON.parse(fs.readFileSync(filesPath, "utf8")) as FileInfo[];

const targetRepo = repoConfig.repositories.find(r => r.name === REPO_NAME);
if (!targetRepo) {
  throw new Error(`Could not find repository config for name '${REPO_NAME}' in config/repos.json`);
}

const governanceRelPath = targetRepo.governancePath || "governance/reference-docs";
const governanceAbsPath = path.join(projectRoot, governanceRelPath);

// 100% Dynamic rules collection discovery (Fail-Closed, Option A)
const ACTIVE_ROOT_COLLECTIONS = getActiveFirestoreRules(governanceAbsPath);

function getActiveFirestoreRules(govPath: string): string[] {
  const rulesFilePath = path.join(govPath, "firestore.rules.txt");
  if (!fs.existsSync(rulesFilePath)) {
    throw new Error(`[Fail-Closed] Authoritative rules file missing at: ${rulesFilePath}`);
  }

  const collections = new Set<string>();
  try {
    const content = fs.readFileSync(rulesFilePath, "utf8");
    const matches = content.matchAll(/match\s+(?:\/databases\/\{database\}\/documents)?\/([a-zA-Z0-9_-]+)/g);
    for (const match of matches) {
      if (match[1] && !["databases", "documents"].includes(match[1])) {
        collections.add(`/${match[1]}`);
      }
    }
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Failed to parse firestore rules file at: ${rulesFilePath}. Error: ${err.message}`);
  }

  if (collections.size === 0) {
    throw new Error(`[Fail-Closed] Parsed firestore rules file but found zero collections at: ${rulesFilePath}`);
  }

  return Array.from(collections);
}

const repoPathMap = new Map(
  repoConfig.repositories.map(r => {
    const clonePath = path.join(projectRoot, "output", "clones", r.name);
    let effectivePath = clonePath;
    if (!fs.existsSync(clonePath) && r.path) {
      effectivePath = path.isAbsolute(r.path) ? r.path : path.join(projectRoot, r.path);
    }
    return [r.name, effectivePath];
  })
);

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

function safeText(fn: () => (string | undefined | null)): string | null {
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

function resolveExpressionValue(node: Node, sourceFile: SourceFile): string | null {
  if (!node) return null;

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralValue();
  }

  if (Node.isTemplateExpression(node)) {
    let pathStr = node.getHead().getLiteralText();
    for (const span of node.getTemplateSpans()) {
      const expr = span.getExpression();
      const varName = Node.isIdentifier(expr) ? expr.getText() : "param";
      pathStr += `{${varName}}` + span.getLiteral().getLiteralText();
    }
    return pathStr;
  }

  if (Node.isIdentifier(node)) {
    // 1. Try compiler type literal evaluation
    const type = node.getType();
    if (type.isStringLiteral()) {
      return type.getLiteralValue() as string;
    }

    // 2. Next resolve cross-module imports & declarations via Symbol Resolution
    const symbol = node.getSymbol();
    if (symbol) {
      const aliasedSymbol = symbol.getAliasedSymbol();
      const effectiveSymbol = aliasedSymbol ?? symbol;
      const declarations = effectiveSymbol.getDeclarations();
      if (declarations.length > 0) {
        const decl = declarations[0];
        if (Node.isVariableDeclaration(decl)) {
          const initializer = decl.getInitializer();
          if (initializer) {
            return resolveExpressionValue(initializer, decl.getSourceFile());
          }
        }
      }
    }

    // 3. Fallback to local scope declaration
    const name = node.getText();
    const variable = sourceFile.getVariableDeclaration(name);
    if (variable) {
      const initializer = variable.getInitializer();
      if (initializer) {
        return resolveExpressionValue(initializer, sourceFile);
      }
    }
  }

  return null;
}

function extractFirestorePaths(sourceFile: SourceFile, base: BaseRecord): any[] {
  const paths: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    if (!Node.isPropertyAccessExpression(expr)) return;

    const name = expr.getName();
    if (name !== "collection" && name !== "doc" && name !== "collectionGroup") return;

    const args = node.getArguments();
    if (args.length === 0) return;

    const resolvedPath = resolveExpressionValue(args[0], sourceFile);
    if (resolvedPath) {
      paths.push({
        ...base,
        value: resolvedPath.startsWith("/") ? resolvedPath : "/" + resolvedPath,
        line: node.getStartLineNumber(),
      });
    }
  });

  return paths;
}

function extractPermissions(sourceFile: SourceFile, base: BaseRecord): any[] {
  const permissions: any[] = [];

  // Decorator based matching (e.g. @Permission('v1.permission'))
  sourceFile.forEachDescendant(node => {
    if (Node.isDecorator(node)) {
      const name = node.getName();
      if (name.toLowerCase().includes("permission") || name.toLowerCase().includes("access")) {
        const args = node.getArguments();
        if (args.length > 0) {
          const val = resolveExpressionValue(args[0], sourceFile);
          if (val) {
            permissions.push({
              ...base,
              value: val,
              line: node.getStartLineNumber(),
            });
          }
        }
      }
    }
  });

  // Structural assertion/checker call matching (e.g. checkPermission(...))
  sourceFile.forEachDescendant(node => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      const name = Node.isIdentifier(expr) ? expr.getText() : (Node.isPropertyAccessExpression(expr) ? expr.getName() : "");
      if (
        name === "checkPermission" ||
        name === "assertPermission" ||
        name === "hasPermission" ||
        name === "requirePermission" ||
        name === "isAuthorized"
      ) {
        for (const arg of node.getArguments()) {
          const val = resolveExpressionValue(arg, sourceFile);
          if (val && (val.startsWith("v1.") || val.includes("permission-denied"))) {
            permissions.push({
              ...base,
              value: val,
              line: node.getStartLineNumber(),
            });
          }
        }
      }
    }
  });

  return permissions;
}

function extractFirestoreTriggers(
  sourceFile: SourceFile,
  base: BaseRecord,
): FirestoreTriggerRow[] {
  const rows: FirestoreTriggerRow[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    if (!Node.isPropertyAccessExpression(expr)) return;

    const name = expr.getName();
    if (name !== "onCreate" && name !== "onUpdate" && name !== "onDelete" && name !== "onWrite") return;

    const triggerType: FirestoreTriggerRow["triggerType"] =
      name === "onCreate" ? "onCreate" :
      name === "onUpdate" ? "onUpdate" :
      name === "onDelete" ? "onDelete" :
      "onWrite";

    let firestorePath: string | null = null;
    let current: Node = expr.getExpression();

    while (current) {
      if (Node.isCallExpression(current)) {
        const currentExpr = current.getExpression();
        if (Node.isPropertyAccessExpression(currentExpr) && currentExpr.getName() === "document") {
          const args = current.getArguments();
          if (args.length > 0) {
            firestorePath = resolveExpressionValue(args[0], sourceFile);
          }
          break;
        }
      }

      if (Node.isPropertyAccessExpression(current)) {
        current = current.getExpression();
      } else if (Node.isCallExpression(current)) {
        current = current.getExpression();
      } else {
        break;
      }
    }

    const triggerArgs = node.getArguments();
    const handlerName = triggerArgs.length > 0 ? triggerArgs[0].getText() : "unknown";

    rows.push({
      ...base,
      line: node.getStartLineNumber(),
      triggerType,
      firestorePath,
      handlerName,
      rawText: node.getText().slice(0, 500),
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
            handlerName = handlerArg.getText();
          }

          const parameters = handlerFunc.getParameters();

          if (parameters.length > 0) {
            const requestParam = parameters[0];
            const requestType = requestParam.getType();
            const requestTypeName = requestParam.getTypeNode()?.getText() ?? requestType.getText() ?? 'unknown';
            let requestSchema: Record<string, string> | null = null;

            const properties = requestType.getProperties();
            if (properties.length > 0) {
              requestSchema = {};
              properties.forEach(prop => {
                const propName = prop.getName();
                const declaration = prop.getValueDeclaration();
                let propType = declaration ? declaration.getType().getText() : "any";
                propType = propType.replace(/import\("[^"]+"\)\./g, '');
                requestSchema![propName] = propType;
              });
            } else {
              const symbol = requestType.getSymbol() ?? requestParam.getTypeNode()?.getType().getSymbol();
              if (symbol) {
                const decls = symbol.getDeclarations();
                for (const decl of decls) {
                  if (Node.isInterfaceDeclaration(decl) || Node.isClassDeclaration(decl)) {
                    requestSchema = requestSchema ?? {};
                    decl.getProperties().forEach(p => {
                      let pType = p.getTypeNode()?.getText() ?? p.getType().getText() ?? 'any';
                      pType = pType.replace(/import\("[^"]+"\)\./g, '');
                      requestSchema![p.getName()] = pType;
                    });
                  } else if (Node.isTypeAliasDeclaration(decl)) {
                    const typeNode = decl.getTypeNode();
                    if (Node.isTypeLiteral(typeNode)) {
                      requestSchema = requestSchema ?? {};
                      typeNode.getProperties().forEach(p => {
                        let pType = p.getTypeNode()?.getText() ?? p.getType().getText() ?? 'any';
                        pType = pType.replace(/import\("[^"]+"\)\./g, '');
                        requestSchema![p.getName()] = pType;
                      });
                    }
                  }
                }
              }
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

function extractTypeAliasesAndEnums(sourceFile: SourceFile, base: BaseRecord) {
  const typeAliases: any[] = [];
  const enums: any[] = [];

  for (const alias of sourceFile.getTypeAliases()) {
    const typeNode = alias.getTypeNode();
    const rawTypeText = typeNode ? typeNode.getText() : alias.getType().getText();
    const cleanTypeText = rawTypeText.replace(/import\("[^"]+"\)\./g, '');

    const literalValues: (string | number)[] = [];
    if (Node.isUnionTypeNode(typeNode)) {
      for (const element of typeNode.getTypeNodes()) {
        if (Node.isLiteralTypeNode(element)) {
          const literal = element.getLiteral();
          if (Node.isStringLiteral(literal)) {
            literalValues.push(literal.getLiteralText());
          } else if (Node.isNumericLiteral(literal)) {
            literalValues.push(literal.getLiteralValue());
          }
        }
      }
    }

    typeAliases.push({
      ...base,
      line: alias.getStartLineNumber(),
      name: alias.getName(),
      typeText: cleanTypeText,
      literalValues,
      isExported: alias.isExported(),
    });
  }

  for (const enumDecl of sourceFile.getEnums()) {
    const members = enumDecl.getMembers().map(m => {
      let val = m.getValue();
      if (val === undefined) {
        val = m.getInitializer()?.getText() ?? undefined;
      }
      return {
        name: m.getName(),
        value: val,
      };
    });

    enums.push({
      ...base,
      line: enumDecl.getStartLineNumber(),
      name: enumDecl.getName(),
      isConst: enumDecl.isConstEnum(),
      isExported: enumDecl.isExported(),
      members,
    });
  }

  return { typeAliases, enums };
}

function extractModelProperties(sourceFile: SourceFile, base: BaseRecord) {
  const properties: any[] = [];

  for (const iface of sourceFile.getInterfaces()) {
    for (const prop of iface.getProperties()) {
      let typeText = prop.getTypeNode()?.getText() ?? prop.getType().getText() ?? 'any';
      typeText = typeText.replace(/import\("[^"]+"\)\./g, '');

      properties.push({
        ...base,
        line: prop.getStartLineNumber(),
        parentKind: 'interface',
        parentName: iface.getName(),
        propertyName: prop.getName(),
        typeText,
        isOptional: prop.hasQuestionToken(),
        isReadonly: prop.isReadonly(),
        isExported: iface.isExported(),
      });
    }
  }

  for (const cls of sourceFile.getClasses()) {
    const className = cls.getName() ?? 'AnonymousClass';
    for (const prop of cls.getProperties()) {
      let typeText = prop.getTypeNode()?.getText() ?? prop.getType().getText() ?? 'any';
      typeText = typeText.replace(/import\("[^"]+"\)\./g, '');

      properties.push({
        ...base,
        line: prop.getStartLineNumber(),
        parentKind: 'class',
        parentName: className,
        propertyName: prop.getName(),
        typeText,
        isOptional: prop.hasQuestionToken(),
        isStatic: prop.isStatic(),
        isReadonly: prop.isReadonly(),
        isExported: cls.isExported(),
      });
    }
  }

  return properties;
}

function extractStringHints(sourceFile: SourceFile, base: BaseRecord) {
  const firestoreLike: any[] = [];
  const permissions: any[] = [];

  // 1. Structural matching for collections
  const structuralPaths = extractFirestorePaths(sourceFile, base);
  firestoreLike.push(...structuralPaths);

  // 2. Structural matching for permissions
  const structuralPermissions = extractPermissions(sourceFile, base);
  permissions.push(...structuralPermissions);

  // 3. Robust fallback checks using our dynamic rules schema (Option A, Strict Slash-Prefix)
  sourceFile.forEachDescendant(node => {
    if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) {
      return;
    }

    const text = node.getLiteralText();

    const isDynamicFirestoreTouch = ACTIVE_ROOT_COLLECTIONS.some(col => 
      text.startsWith(col) || text.includes(col + "/") || text === col
    );

    if (isDynamicFirestoreTouch) {
      const alreadyCaptured = firestoreLike.some(f => f.value === text && f.line === node.getStartLineNumber());
      if (!alreadyCaptured) {
        firestoreLike.push({
          ...base,
          value: text,
          line: node.getStartLineNumber(),
        });
      }
    }

    const isLegacyPermission = text.startsWith("v1.") || text.includes("permission-denied");
    if (isLegacyPermission) {
      const alreadyCaptured = permissions.some(p => p.value === text && p.line === node.getStartLineNumber());
      if (!alreadyCaptured) {
        permissions.push({
          ...base,
          value: text,
          line: node.getStartLineNumber(),
        });
      }
    }
  });

  return { firestoreLike, permissions };
}

function extractExternalHooks(sourceFile: SourceFile, base: BaseRecord) {
  const hooks: any[] = [];

  // 1. Structural matching
  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    if (!Node.isPropertyAccessExpression(expr)) return;

    const name = expr.getName();

    // Pub/Sub Topics (.topic("topic-name"))
    if (name === "topic") {
      const args = node.getArguments();
      if (args.length > 0) {
        const topicName = resolveExpressionValue(args[0], sourceFile);
        if (topicName) {
          const callerType = expr.getExpression().getType().getText();
          const isPubSub = callerType.includes("PubSub") || callerType.includes("Topic") || callerType.includes("pubsub") || callerType === "any";
          if (isPubSub) {
            hooks.push({
              ...base,
              type: "pubsub_or_notification_candidate",
              value: topicName,
              line: node.getStartLineNumber(),
            });
          }
        }
      }
    }

    // Firebase Messaging (.send, .sendToDevice, .sendToTopic)
    if (name === "send" || name === "sendToDevice" || name === "sendToTopic") {
      hooks.push({
        ...base,
        type: "pubsub_or_notification_candidate",
        value: `FCM messaging().${name}`,
        line: node.getStartLineNumber(),
      });
    }

    // Cloud Storage (.bucket)
    if (name === "bucket") {
      const args = node.getArguments();
      const bucketName = args.length > 0 ? resolveExpressionValue(args[0], sourceFile) : "default";
      const callerType = expr.getExpression().getType().getText();
      const isStorage = callerType.includes("Storage") || callerType.includes("storage") || callerType.includes("firebase-admin") || callerType === "any";
      if (isStorage) {
        hooks.push({
          ...base,
          type: "storage_path_candidate",
          value: `Storage bucket: ${bucketName || "default"}`,
          line: node.getStartLineNumber(),
        });
      }
    }
  });

  // Env variables
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

  // 2. Fallback heuristics using dynamic root collections
  sourceFile.forEachDescendant(node => {
    if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) {
      return;
    }

    const value = node.getLiteralText();
    const line = node.getStartLineNumber();

    const isPubSubKeyword =
      value.includes("PUBSUB") ||
      value.includes("TOPIC") ||
      value.includes("OSK_PUBSUB") ||
      value.includes("FCM") ||
      value.includes("NOTIFICATION");

    if (isPubSubKeyword) {
      const alreadyCaptured = hooks.some(h => h.value === value && h.line === line);
      if (!alreadyCaptured) {
        hooks.push({
          ...base,
          type: "pubsub_or_notification_candidate",
          value,
          line,
        });
      }
    }

    const isHttpKeyword =
      value.startsWith("/") &&
      (
        value.includes("/api") ||
        value.includes("/calls") ||
        ACTIVE_ROOT_COLLECTIONS.some(col => value.startsWith(col) || value.includes(col + "/"))
      );

    if (isHttpKeyword) {
      const alreadyCaptured = hooks.some(h => h.value === value && h.line === line);
      if (!alreadyCaptured) {
        hooks.push({
          ...base,
          type: "http_or_client_path_candidate",
          value,
          line,
        });
      }
    }

    const isStorageKeyword =
      value.includes("bucket") ||
      value.includes("storage") ||
      value.includes("public/") ||
      value.includes("calls/");

    if (isStorageKeyword) {
      const alreadyCaptured = hooks.some(h => h.value === value && h.line === line);
      if (!alreadyCaptured) {
        hooks.push({
          ...base,
          type: "storage_path_candidate",
          value,
          line,
        });
      }
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

  const effectiveRepoPath = repoPathMap.get(firstRepo.name) ?? firstRepo.path;
  const tsConfigFilePath = path.join(effectiveRepoPath, "functions", "tsconfig.json");

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
    typeAliases: [] as any[],
    enums: [] as any[],
    modelProperties: [] as any[],
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

      const te = extractTypeAliasesAndEnums(sourceFile, base);
      output.typeAliases.push(...te.typeAliases);
      output.enums.push(...te.enums);

      output.modelProperties.push(...extractModelProperties(sourceFile, base));

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
  fs.writeFileSync(path.join(outputRoot, "ast-type-aliases.json"), JSON.stringify(output.typeAliases, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-enums.json"), JSON.stringify(output.enums, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-model-properties.json"), JSON.stringify(output.modelProperties, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-calls.json"), JSON.stringify(output.calls, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-firestore-hints.json"), JSON.stringify(output.firestoreHints, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-permission-hints.json"), JSON.stringify(output.permissionHints, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-external-hooks.json"), JSON.stringify(output.externalHooks, null, 2));
  fs.writeFileSync(path.join(outputRoot, "ast-api-contracts.json"), JSON.stringify(output.apiContracts, null, 2));
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
    typeAliases: output.typeAliases.length,
    enums: output.enums.length,
    modelProperties: output.modelProperties.length,
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
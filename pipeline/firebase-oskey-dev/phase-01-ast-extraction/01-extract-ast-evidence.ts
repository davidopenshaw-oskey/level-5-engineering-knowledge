// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script extracts evidence from TypeScript source files using ts-morph,
// generating 14 facts JSON files, ast-errors.json, ast-evidence-manifest.json,
// and logging extraction quality entries to run-notifications.json.

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
    gitUrl: string;
    branch?: string;
    commit?: string;
    modulesRoot: string;
    governancePath?: string;
  }[];
};

type BaseRecord = Omit<FileInfo, "sizeBytes"> & {
  runId: string;
};

type RuntimeFile = {
  file: FileInfo;
  base: BaseRecord;
  absolutePath: string;
};

type NotificationSeverity = "info" | "warning" | "error";

interface NotificationEntry {
  id: string;
  timestamp: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: any;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

type FirestoreTriggerRow = BaseRecord & {
  line: number;
  triggerType: "onCreate" | "onUpdate" | "onDelete" | "onWrite" | "unknown";
  firestorePath: string | null;
  handlerName: string | null;
  rawText: string;

  // Generic compiler-derived evidence
  calleeExpression: string | null;
  calleeSymbol: string | null;
  resolvedCalleeSymbol: string | null;
  declarationFile: string | null;
  declarationModuleSpecifier: string | null;
  handlerExpression: string | null;
  resolvedHandlerName: string | null;
  resolvedHandlerDeclarationFile: string | null;
  resolutionStatus: "resolved" | "partial" | "unresolved";
};

type ApiContractRow = BaseRecord & {
  line: number;
  handlerName: string;
  requestType: string | null;
  requestSchema: Record<string, string> | null;
  responseType: string | null;
  decorators: { name: string; arguments: (string | null)[] }[];

  // Generic compiler-derived evidence
  calleeExpression: string | null;
  resolvedSymbol: string | null;
  aliasedSymbol: string | null;
  declarationFile: string | null;
  declarationModule: string | null;
  handlerExpression: string | null;
  resolvedHandlerDeclaration: string | null;
  requestParameterEvidence: any | null;
  returnTypeEvidence: string | null;
  resolutionStatus: "resolved" | "partial" | "unresolved";
};

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
const notificationsPath = path.join(repoOutputDir, "run-notifications.json");

const filesPath = path.join(outputRoot, "files.json");
if (!fs.existsSync(filesPath)) {
  throw new Error(`Could not find files.json at '${filesPath}'. Please run 00-scan-repo first.`);
}

const repoConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) as RepoConfig;
const files = JSON.parse(fs.readFileSync(filesPath, "utf8")) as FileInfo[];

const targetRepo = repoConfig.repositories.find(r => r.name === REPO_NAME)!;
if (!targetRepo) {
  throw new Error(`Could not find repository config for name '${REPO_NAME}' in config/repos.json`);
}

const clonePath = path.join(projectRoot, "output", "clones", targetRepo.name);

const governanceRelPath = targetRepo.governancePath || "governance/reference-docs";
const governanceAbsPath = path.join(projectRoot, governanceRelPath);

const ACTIVE_ROOT_COLLECTIONS = getActiveFirestoreRules(governanceAbsPath);

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
  details?: any
) {
  const entry: NotificationEntry = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity,
    code,
    message,
    details,
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

function toRepoPath(p: string): string {
  return p.replace(/\\/g, "/");
}

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

function makeRuntimeFile(file: FileInfo): RuntimeFile | null {
  const absolutePath = path.join(clonePath, file.path);
  if (!fs.existsSync(absolutePath)) return null;

  const { sizeBytes, ...rest } = file;
  const base: BaseRecord = { ...rest, runId };
  return { file, base, absolutePath };
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

  sourceFile.forEachDescendant(node => {
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
      const value = node.getLiteralText();
      const isPermissionPattern =
        (value.includes(":") && (value.includes("read") || value.includes("write") || value.includes("admin") || value.includes("manage") || value.includes("create") || value.includes("delete"))) ||
        value.startsWith("PERMISSION_") ||
        value.startsWith("SCOPE_");

      if (isPermissionPattern) {
        permissions.push({
          ...base,
          value,
          line: node.getStartLineNumber(),
        });
      }
    }
  });

  return permissions;
}

function extractStringHints(sourceFile: SourceFile, base: BaseRecord) {
  return {
    firestoreLike: extractFirestorePaths(sourceFile, base),
    permissions: extractPermissions(sourceFile, base),
  };
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
    const handlerArg = triggerArgs.length > 0 ? triggerArgs[0] : null;
    const handlerName = handlerArg ? handlerArg.getText() : "unknown";

    // Generic compiler-derived evidence extraction
    const calleeExprText = safeText(() => expr.getText());
    const calleeSym = expr.getSymbol();
    const calleeSymbolName = safeText(() => calleeSym?.getName());
    const resolvedCalleeSymbolName = safeText(() => calleeSym?.getAliasedSymbol()?.getName() ?? calleeSym?.getName());

    const calleeDecls = calleeSym?.getDeclarations() ?? [];
    const declarationFile = calleeDecls.length > 0
      ? toRepoPath(path.relative(clonePath, calleeDecls[0].getSourceFile().getFilePath()))
      : null;
    const declarationModuleSpecifier = calleeDecls.length > 0
      ? safeText(() => calleeDecls[0].getSourceFile().getFilePath())
      : null;

    const handlerExpression = handlerArg ? safeText(() => handlerArg.getText()) : null;
    const handlerSym = handlerArg ? handlerArg.getSymbol() : null;
    const resolvedHandlerName = safeText(() => handlerSym?.getName() ?? handlerName);
    const handlerDecls = handlerSym?.getDeclarations() ?? [];
    const resolvedHandlerDeclarationFile = handlerDecls.length > 0
      ? toRepoPath(path.relative(clonePath, handlerDecls[0].getSourceFile().getFilePath()))
      : null;

    let resolutionStatus: FirestoreTriggerRow["resolutionStatus"] = "unresolved";
    if (calleeSymbolName && resolvedHandlerDeclarationFile) {
      resolutionStatus = "resolved";
    } else if (calleeSymbolName || resolvedHandlerDeclarationFile || firestorePath) {
      resolutionStatus = "partial";
    }

    rows.push({
      ...base,
      line: node.getStartLineNumber(),
      triggerType,
      firestorePath,
      handlerName,
      rawText: node.getText().slice(0, 500),

      calleeExpression: calleeExprText,
      calleeSymbol: calleeSymbolName,
      resolvedCalleeSymbol: resolvedCalleeSymbolName,
      declarationFile,
      declarationModuleSpecifier,
      handlerExpression,
      resolvedHandlerName,
      resolvedHandlerDeclarationFile,
      resolutionStatus,
    });
  });

  return rows;
}

function extractImports(sourceFile: SourceFile, base: BaseRecord) {
  return sourceFile.getImportDeclarations().map(i => ({
    ...base,
    line: i.getStartLineNumber(),
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
        line: e.getStartLineNumber(),
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
          line: e.getStartLineNumber(),
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
        line: e.getStartLineNumber(),
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
        line: d.getStartLineNumber(),
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
      line: c.getStartLineNumber(),
      name: className,
      isExported: c.isExported(),
      isDefaultExport: c.isDefaultExport(),
      extends: safeText(() => c.getExtends()?.getText()),
      decorators: extractDecorators(c),
    });

    for (const ctor of c.getConstructors()) {
      methods.push({
        ...base,
        line: ctor.getStartLineNumber(),
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
        line: m.getStartLineNumber(),
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
    line: f.getStartLineNumber(),
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
      const calleeExpr = node.getExpression();
      const calleeSymbol = calleeExpr.getSymbol();
      const calleeSymbolName = safeText(() => calleeSymbol?.getName());
      const aliasedSymbolName = safeText(() => calleeSymbol?.getAliasedSymbol()?.getName());

      const calleeDecls = calleeSymbol?.getDeclarations() ?? [];
      const declarationFile = calleeDecls.length > 0
        ? toRepoPath(path.relative(clonePath, calleeDecls[0].getSourceFile().getFilePath()))
        : null;
      const declarationModule = calleeDecls.length > 0
        ? safeText(() => calleeDecls[0].getSourceFile().getFilePath())
        : null;

      const handlerArg = node.getArguments()[0];
      const handlerExprText = handlerArg ? safeText(() => handlerArg.getText()) : null;

      let handlerName = "unknown";
      let requestType: string | null = null;
      let requestSchema: Record<string, string> | null = null;
      let responseType: string | null = null;
      let decorators: { name: string; arguments: (string | null)[] }[] = [];
      let resolvedHandlerDeclarationFile: string | null = null;

      if (handlerArg && (Node.isIdentifier(handlerArg) || Node.isPropertyAccessExpression(handlerArg))) {
        const handlerSym = handlerArg.getSymbol();
        const handlerFunc = handlerSym?.getValueDeclaration();
        const handlerDecls = handlerSym?.getDeclarations() ?? [];

        if (handlerDecls.length > 0) {
          resolvedHandlerDeclarationFile = toRepoPath(path.relative(clonePath, handlerDecls[0].getSourceFile().getFilePath()));
        }

        if (handlerFunc && (Node.isFunctionDeclaration(handlerFunc) || Node.isMethodDeclaration(handlerFunc) || Node.isArrowFunction(handlerFunc) || Node.isFunctionExpression(handlerFunc))) {
          if (Node.isFunctionDeclaration(handlerFunc) || Node.isMethodDeclaration(handlerFunc)) {
            handlerName = handlerFunc.getName() ?? handlerArg.getText();
          } else {
            handlerName = handlerArg.getText();
          }

          const parameters = handlerFunc.getParameters();
          if (parameters.length > 0) {
            const firstParam = parameters[0];
            const paramTypeNode = firstParam.getTypeNode();
            requestType = paramTypeNode ? paramTypeNode.getText() : null;

            if (paramTypeNode && Node.isTypeReference(paramTypeNode)) {
              const typeName = paramTypeNode.getTypeName().getText();
              const interfaceDecl = sourceFile.getInterface(typeName) || sourceFile.getProject().getSourceFiles().map(sf => sf.getInterface(typeName)).find(Boolean);

              if (interfaceDecl) {
                requestSchema = {};
                for (const prop of interfaceDecl.getProperties()) {
                  const propTypeNode = prop.getTypeNode();
                  requestSchema[prop.getName()] = propTypeNode ? propTypeNode.getText() : "any";
                }
              }
            }
          }

          const returnTypeNode = handlerFunc.getReturnTypeNode();
          responseType = returnTypeNode ? returnTypeNode.getText() : safeText(() => handlerFunc.getReturnType().getText());
          decorators = extractDecorators(handlerFunc);
        }
      }

      let resolutionStatus: ApiContractRow["resolutionStatus"] = "unresolved";
      if (handlerName !== "unknown" && resolvedHandlerDeclarationFile) {
        resolutionStatus = "resolved";
      } else if (handlerName !== "unknown" || calleeSymbolName) {
        resolutionStatus = "partial";
      }

      apiContracts.push({
        ...base,
        line: node.getStartLineNumber(),
        handlerName,
        requestType,
        requestSchema,
        responseType,
        decorators,

        calleeExpression: safeText(() => calleeExpr.getText()),
        resolvedSymbol: calleeSymbolName,
        aliasedSymbol: aliasedSymbolName,
        declarationFile,
        declarationModule,
        handlerExpression: handlerExprText,
        resolvedHandlerDeclaration: resolvedHandlerDeclarationFile,
        requestParameterEvidence: requestSchema ?? requestType,
        returnTypeEvidence: responseType,
        resolutionStatus,
      });
    }
  });

  return apiContracts;
}

function extractTypeAliasesAndEnums(sourceFile: SourceFile, base: BaseRecord) {
  const typeAliases: any[] = [];
  const enums: any[] = [];

  for (const alias of sourceFile.getTypeAliases()) {
    const typeNode = alias.getTypeNode();
    const typeText = alias.getType().getText();
    const cleanTypeText = typeText.length < 500 ? typeText : (typeNode ? safeText(() => typeNode.getText()) : "complex");

    let literalValues: (string | number)[] | null = null;
    if (typeNode && Node.isUnionTypeNode(typeNode)) {
      literalValues = typeNode
        .getTypeNodes()
        .map(tn => {
          if (Node.isLiteralTypeNode(tn)) {
            const lit = tn.getLiteral();
            if (Node.isStringLiteral(lit) || Node.isNumericLiteral(lit)) {
              return lit.getLiteralValue();
            }
          }
          return null;
        })
        .filter((v): v is string | number => v !== null);

      if (literalValues.length === 0) literalValues = null;
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
  const modelProperties: any[] = [];

  const processMembers = (containerName: string, members: Node[], isClass: boolean) => {
    for (const member of members) {
      if (Node.isPropertyDeclaration(member) || Node.isPropertySignature(member)) {
        const propName = member.getName();
        const typeNode = member.getTypeNode();
        const rawTypeText = typeNode ? safeText(() => typeNode.getText()) : null;
        const resolvedTypeText = safeText(() => member.getType().getText());

        modelProperties.push({
          ...base,
          line: member.getStartLineNumber(),
          containerName,
          containerKind: isClass ? "class" : "interface",
          propertyName: propName,
          isOptional: member.hasQuestionToken(),
          isReadonly: member.isReadonly(),
          rawTypeText,
          resolvedTypeText,
          decorators: extractDecorators(member),
        });
      }
    }
  };

  for (const cls of sourceFile.getClasses()) {
    const className = cls.getName() ?? "anonymous";
    processMembers(className, cls.getMembers(), true);
  }

  for (const iface of sourceFile.getInterfaces()) {
    const interfaceName = iface.getName();
    processMembers(interfaceName, iface.getMembers(), false);
  }

  return modelProperties;
}

function extractExternalHooks(sourceFile: SourceFile, base: BaseRecord) {
  const hooks: any[] = [];

  sourceFile.forEachDescendant(node => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();

    if (!Node.isPropertyAccessExpression(expr)) return;

    const name = expr.getName();

    // PubSub (.topic)
    if (name === "topic") {
      const args = node.getArguments();
      const topicName = args.length > 0 ? resolveExpressionValue(args[0], sourceFile) : "unknown";
      const callerType = expr.getExpression().getType().getText();
      const isPubSub = callerType.includes("PubSub") || callerType.includes("pubsub") || callerType === "any";
      if (isPubSub) {
        hooks.push({
          ...base,
          type: "pubsub_topic",
          value: topicName || "unknown",
          line: node.getStartLineNumber(),
        });
      }
    }

    // FCM Notification / messaging
    if (name === "send" || name === "sendEach" || name === "sendMulticast") {
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
  const notifications = loadNotifications();

  const tsFiles = files.filter(isTsSource);

  // Requirement 1: Resolve tsconfig based strictly on targetRepo
  const tsConfigFilePath = path.join(clonePath, "functions", "tsconfig.json");

  if (!fs.existsSync(tsConfigFilePath)) {
    addNotification(
      notifications,
      "error",
      "TSCONFIG_MISSING_ERROR",
      `Missing expected tsconfig.json at path [${tsConfigFilePath}]. Cannot perform trustworthy compiler resolution.`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Missing required tsconfig.json at expected path [${tsConfigFilePath}] for repository [${targetRepo.name}].`);
  }

  const project = new Project({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: false,
      skipLibCheck: true,
      noEmit: true,
    },
  });

  // Requirement 2: Make absolutePath runtime-only
  const missingFiles: string[] = [];
  const validFiles: RuntimeFile[] = [];

  for (const file of tsFiles) {
    const rf = makeRuntimeFile(file);
    if (!rf) {
      missingFiles.push(file.path);
    } else {
      validFiles.push(rf);
    }
  }

  if (missingFiles.length > 0) {
    addNotification(
      notifications,
      "warning",
      "MISSING_SOURCE_FILE_WARNING",
      `${missingFiles.length} source file(s) listed in files.json were missing on disk inside the clone repository.`,
      { count: missingFiles.length, files: missingFiles.slice(0, 10) }
    );
  }

  if (validFiles.length === 0) {
    addNotification(
      notifications,
      "error",
      "ZERO_VALID_FILES_ERROR",
      `Zero valid TypeScript source files could be found on disk for repository [${targetRepo.name}].`
    );
    writeNotifications(notifications);
    throw new Error(`[Fail-Closed] Zero valid TypeScript source files found for AST extraction in [${targetRepo.name}].`);
  }

  console.log(`Manifest files: ${files.length}`);
  console.log(`TS files selected: ${validFiles.length}`);

  const addErrors: string[] = [];
  for (const rf of validFiles) {
    try {
      project.addSourceFileAtPath(rf.absolutePath);
    } catch (err: any) {
      addErrors.push(rf.base.path);
    }
  }

  if (addErrors.length > 0) {
    addNotification(
      notifications,
      "warning",
      "TS_MORPH_ADD_ERROR",
      `Failed to add ${addErrors.length} source file(s) to ts-morph project.`,
      { count: addErrors.length, files: addErrors.slice(0, 10) }
    );
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

  const getErrors: string[] = [];

  for (const rf of validFiles) {
    const sourceFile = project.getSourceFile(rf.absolutePath);
    if (!sourceFile) {
      getErrors.push(rf.base.path);
      continue;
    }

    try {
      output.imports.push(...extractImports(sourceFile, rf.base));
      output.exports.push(...extractExports(sourceFile, rf.base));

      const cm = extractClassesAndMethods(sourceFile, rf.base);
      output.classes.push(...cm.classes);
      output.methods.push(...cm.methods);

      output.functions.push(...extractFunctions(sourceFile, rf.base));
      output.calls.push(...extractCalls(sourceFile, rf.base));
      output.firestoreTriggers.push(...extractFirestoreTriggers(sourceFile, rf.base));

      const te = extractTypeAliasesAndEnums(sourceFile, rf.base);
      output.typeAliases.push(...te.typeAliases);
      output.enums.push(...te.enums);

      output.modelProperties.push(...extractModelProperties(sourceFile, rf.base));

      const hints = extractStringHints(sourceFile, rf.base);
      output.firestoreHints.push(...hints.firestoreLike);
      output.permissionHints.push(...hints.permissions);

      output.apiContracts.push(...extractApiContracts(sourceFile, rf.base));
      output.externalHooks.push(...extractExternalHooks(sourceFile, rf.base));
    } catch (err: any) {
      output.errors.push({
        path: rf.base.path,
        message: err?.message ?? String(err),
      });
    }
  }

  if (getErrors.length > 0) {
    addNotification(
      notifications,
      "warning",
      "TS_MORPH_GET_ERROR",
      `Could not retrieve ${getErrors.length} source file(s) after loading into ts-morph project.`,
      { count: getErrors.length, files: getErrors.slice(0, 10) }
    );
  }

  if (output.errors.length > 0) {
    addNotification(
      notifications,
      "warning",
      "EXTRACTION_ERROR",
      `${output.errors.length} per-file extraction error(s) occurred during AST parsing.`,
      { count: output.errors.length, files: output.errors.map(e => e.path).slice(0, 10) }
    );
  }

  const errorRate = output.errors.length / validFiles.length;
  if (errorRate > 0.05) {
    addNotification(
      notifications,
      "warning",
      "HIGH_ERROR_RATE_WARNING",
      `Unusually high AST extraction error rate: ${(errorRate * 100).toFixed(1)}% of files encountered errors.`,
      { errorRate, totalFiles: validFiles.length, errorCount: output.errors.length }
    );
  }

  // Check unresolved callables/triggers rate
  const totalCallableAndTriggers = output.apiContracts.length + output.firestoreTriggers.length;
  if (totalCallableAndTriggers > 0) {
    const unresolvedCount =
      output.apiContracts.filter(c => c.resolutionStatus === "unresolved").length +
      output.firestoreTriggers.filter(t => t.resolutionStatus === "unresolved").length;
    const unresolvedRate = unresolvedCount / totalCallableAndTriggers;

    if (unresolvedRate > 0.20) {
      addNotification(
        notifications,
        "warning",
        "HIGH_UNRESOLVED_RATE_WARNING",
        `Unresolved callable/trigger rate is ${(unresolvedRate * 100).toFixed(1)}% (${unresolvedCount}/${totalCallableAndTriggers}), exceeding 20% threshold.`,
        { unresolvedRate, unresolvedCount, totalCallableAndTriggers }
      );
    }
  }

  // Check zero records in major evidence categories
  const majorCategories = [
    { name: "imports", count: output.imports.length },
    { name: "exports", count: output.exports.length },
    { name: "classes", count: output.classes.length },
    { name: "calls", count: output.calls.length },
  ];

  for (const cat of majorCategories) {
    if (cat.count === 0) {
      addNotification(
        notifications,
        "warning",
        "ZERO_RECORDS_WARNING",
        `Anomalous extraction result: zero records extracted for major evidence category [${cat.name}].`
      );
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

  // Requirement 7: Write ast-evidence-manifest.json
  const astManifest = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    generatedAt: new Date().toISOString(),
    artefacts: [
      { file: "ast-imports.json", evidenceType: "imports", recordCount: output.imports.length, required: true },
      { file: "ast-exports.json", evidenceType: "exports", recordCount: output.exports.length, required: true },
      { file: "ast-classes.json", evidenceType: "classes", recordCount: output.classes.length, required: true },
      { file: "ast-methods.json", evidenceType: "methods", recordCount: output.methods.length, required: true },
      { file: "ast-functions.json", evidenceType: "functions", recordCount: output.functions.length, required: true },
      { file: "ast-type-aliases.json", evidenceType: "typeAliases", recordCount: output.typeAliases.length, required: true },
      { file: "ast-enums.json", evidenceType: "enums", recordCount: output.enums.length, required: true },
      { file: "ast-model-properties.json", evidenceType: "modelProperties", recordCount: output.modelProperties.length, required: true },
      { file: "ast-calls.json", evidenceType: "calls", recordCount: output.calls.length, required: true },
      { file: "ast-firestore-hints.json", evidenceType: "firestoreHints", recordCount: output.firestoreHints.length, required: true },
      { file: "ast-permission-hints.json", evidenceType: "permissionHints", recordCount: output.permissionHints.length, required: true },
      { file: "ast-external-hooks.json", evidenceType: "externalHooks", recordCount: output.externalHooks.length, required: true },
      { file: "ast-api-contracts.json", evidenceType: "apiContracts", recordCount: output.apiContracts.length, required: true },
      { file: "ast-firestore-triggers.json", evidenceType: "firestoreTriggers", recordCount: output.firestoreTriggers.length, required: true },
    ],
    errors: {
      file: "ast-errors.json",
      recordCount: output.errors.length,
    },
  };

  fs.writeFileSync(path.join(outputRoot, "ast-evidence-manifest.json"), JSON.stringify(astManifest, null, 2));

  // Write updated run-notifications.json
  writeNotifications(notifications);

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
  console.log(`AST evidence manifest written to: ${path.join(outputRoot, "ast-evidence-manifest.json")}`);
}

main();
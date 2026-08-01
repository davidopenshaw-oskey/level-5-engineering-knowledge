// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// Script 01: AST Evidence Extractor (Phase 1).
// Extracts AST evidence from TypeScript source code using ts-morph,
// capturing imports, exports, classes, methods, functions, type aliases, enums,
// model properties, calls, firestore hints, permission hints, external hooks,
// API contracts, and firestore triggers.

import fs from "fs";
import path from "path";
import { Project, SyntaxKind, Node, ClassDeclaration, MethodDeclaration, FunctionDeclaration, Identifier, Symbol, Type, SourceFile } from "ts-morph";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
  toRepoPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();

function sanitizeTypeText(typeText: string, clonePath: string): string {
  if (!typeText) return "";
  const normalizedClone = clonePath.replace(/\\/g, "/");
  let cleaned = typeText.replace(/\\/g, "/");
  if (cleaned.includes(normalizedClone)) {
    cleaned = cleaned.split(normalizedClone + "/").join("");
    cleaned = cleaned.split(normalizedClone).join("");
  }
  return cleaned;
}

// Unwraps a single-type-argument generic wrapper (e.g. "Promise<X>" -> "X").
// Deliberately limited to framework/language-level wrappers (Promise from
// TS/JS itself, CallableRequest from the Firebase SDK) -- NOT
// business-specific wrapper classes like OSKHttpsSuccessResponse. Unwrapping
// those would bake one repo's domain conventions into a supposedly
// repo-agnostic extractor; if that's wanted later it belongs in config
// (alongside normalizationRules in config/repos.json), not hardcoded here.
function unwrapGenericSingleArg(typeText: string, wrapperNames: string[]): string {
  for (const wrapper of wrapperNames) {
    const match = typeText.match(new RegExp(`^${wrapper}<([\\s\\S]+)>$`));
    if (match) return match[1].trim();
  }
  return typeText;
}

// Resolves the request/response payload types for a handler function --
// i.e. the type of its first parameter (the request/data payload for a
// Firebase callable, or the change/event payload for a trigger) and its
// return type. Only handles actual function-like nodes (function
// declarations, methods, arrow functions, function expressions); anything
// else returns nulls rather than guessing.
function extractHandlerSignatureTypes(
  fnLikeNode: Node | undefined,
  clonePath: string
): { requestType: string | null; responseType: string | null } {
  if (
    !fnLikeNode ||
    (!Node.isFunctionDeclaration(fnLikeNode) &&
      !Node.isMethodDeclaration(fnLikeNode) &&
      !Node.isArrowFunction(fnLikeNode) &&
      !Node.isFunctionExpression(fnLikeNode))
  ) {
    return { requestType: null, responseType: null };
  }

  const params = fnLikeNode.getParameters();
  let requestType: string | null = null;
  if (params.length > 0) {
    const rawParamType = sanitizeTypeText(params[0].getType().getText(), clonePath);
    requestType = unwrapGenericSingleArg(rawParamType, ["CallableRequest"]);
  }

  const rawReturnType = sanitizeTypeText(fnLikeNode.getReturnType().getText(), clonePath);
  const responseType = unwrapGenericSingleArg(rawReturnType, ["Promise"]);

  return { requestType, responseType };
}

// Terminal Firestore operation methods we're looking for when walking a
// chain forward from a .collection()/.doc() call. Query-builder methods
// (where/orderBy/limit/etc.) are deliberately excluded -- they're not
// operations themselves, and excluding them lets the walk continue *through*
// them to find the actual terminal operation further down the chain
// (e.g. .collection('x').where(...).orderBy(...).get()).
const FIRESTORE_OPERATION_METHODS = new Set(["get", "set", "create", "update", "delete", "add", "onSnapshot", "listen", "query"]);

/**
 * Walks forward through a Firestore method chain starting from a
 * .collection()/.doc() call to find the terminal read/write operation.
 *
 * Previously this only checked ONE hop ahead (the immediate next chained
 * call), which only matched a simple `db.collection('x').get()` shape. Any
 * realistic nested document path -- e.g.
 * `db.collection('a').doc(id).collection('b').doc(id2).get()` -- has the
 * actual operation several chain-links past the specific .collection()/.doc()
 * call that produced the raw path hint, so the one-hop check silently missed
 * almost every real case (confirmed: only 1 of 18 shared Firestore paths in
 * a real run had operation evidence). This walks the full remaining chain
 * instead of just one hop, bounded by maxHops as a cycle/pathological-chain
 * safeguard consistent with resolveExpressionValue's maxDepth pattern below.
 */
function findChainedFirestoreOperation(startCall: Node, maxHops = 15): string | null {
  let current: Node = startCall;
  for (let hop = 0; hop < maxHops; hop++) {
    const propAccess = current.getParentIfKind(SyntaxKind.PropertyAccessExpression);
    if (!propAccess) return null; // chain ends here (assigned to a var, passed as an arg, etc.)

    const nextCall = propAccess.getParentIfKind(SyntaxKind.CallExpression);
    if (!nextCall) return null; // property access not followed by a call -- not a chain continuation

    const methodName = propAccess.getName();
    if (FIRESTORE_OPERATION_METHODS.has(methodName)) {
      return methodName;
    }

    current = nextCall;
  }
  return null; // exceeded maxHops without finding a terminal operation
}

// Expression resolution with explicit partial status & cycle protection
function resolveExpressionValue(
  node: Node,
  visitedDeclarations = new Set<string>(),
  depth = 0,
  maxDepth = 20
): { value: string | null; status: "resolved" | "partial" | "cycle" | "max_depth" | "unsupported" | "not_found" } {
  if (depth >= maxDepth) {
    return { value: null, status: "max_depth" };
  }

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.getLiteralValue(), status: "resolved" };
  }

  if (Node.isTemplateExpression(node)) {
    let result = node.getHead().getLiteralText();
    let hasUnresolved = false;
    for (const span of node.getTemplateSpans()) {
      const exprRes = resolveExpressionValue(span.getExpression(), visitedDeclarations, depth + 1, maxDepth);
      if (exprRes.value !== null) {
        result += exprRes.value;
      } else {
        hasUnresolved = true;
        result += `{${span.getExpression().getText()}}`;
      }
      result += span.getLiteral().getLiteralText();
    }
    return { value: result, status: hasUnresolved ? "partial" : "resolved" };
  }

  if (Node.isIdentifier(node)) {
    const symbol = node.getSymbol();
    if (symbol) {
      const valueDeclaration = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
      if (valueDeclaration) {
        const declId = `${valueDeclaration.getSourceFile().getFilePath()}:${valueDeclaration.getStart()}`;
        if (visitedDeclarations.has(declId)) {
          return { value: null, status: "cycle" };
        }
        visitedDeclarations.add(declId);

        if (Node.isVariableDeclaration(valueDeclaration)) {
          const initializer = valueDeclaration.getInitializer();
          if (initializer) {
            return resolveExpressionValue(initializer, visitedDeclarations, depth + 1, maxDepth);
          }
        }
        if (Node.isPropertyAssignment(valueDeclaration)) {
          const initializer = valueDeclaration.getInitializer();
          if (initializer) {
            return resolveExpressionValue(initializer, visitedDeclarations, depth + 1, maxDepth);
          }
        }
        if (Node.isEnumMember(valueDeclaration)) {
          const val = valueDeclaration.getValue();
          if (val !== undefined) return { value: String(val), status: "resolved" };
        }
      }
    }
  }

  if (Node.isPropertyAccessExpression(node)) {
    const propName = node.getName();
    const exprRes = resolveExpressionValue(node.getExpression(), visitedDeclarations, depth + 1, maxDepth);
    if (exprRes.value) {
      return { value: `${exprRes.value}.${propName}`, status: exprRes.status };
    }
  }

  return { value: null, status: "unsupported" };
}

// Handler Symbol & Declaration Resolver for API Contracts and Triggers
function resolveHandlerDeclaration(
  handlerNode: Node,
  clonePath: string,
  currentRelativePath: string
): {
  handlerName: string | null;
  handlerExpression: string | null;
  handlerDeclarationFile: string | null;
  handlerStartLine: number | null;
  handlerEndLine: number | null;
  handlerResolutionStatus: "resolved" | "partial" | "inline" | "unresolved";
  requestType: string | null;
  responseType: string | null;
} {
  if (!handlerNode) {
    return {
      handlerName: null,
      handlerExpression: null,
      handlerDeclarationFile: currentRelativePath,
      handlerStartLine: null,
      handlerEndLine: null,
      handlerResolutionStatus: "unresolved",
      requestType: null,
      responseType: null,
    };
  }

  const handlerExpression = handlerNode.getText();

  // Inline arrow function or function expression
  if (Node.isArrowFunction(handlerNode) || Node.isFunctionExpression(handlerNode)) {
    return {
      handlerName: "inline_handler",
      handlerExpression,
      handlerDeclarationFile: currentRelativePath,
      handlerStartLine: handlerNode.getStartLineNumber(),
      handlerEndLine: handlerNode.getEndLineNumber(),
      handlerResolutionStatus: "inline",
      ...extractHandlerSignatureTypes(handlerNode, clonePath),
    };
  }

  // Identifier or Property Access Expression reference
  if (Node.isIdentifier(handlerNode) || Node.isPropertyAccessExpression(handlerNode)) {
    try {
      const symbol = handlerNode.getSymbol();
      if (symbol) {
        const decl = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
        if (decl) {
          const declSf = decl.getSourceFile();
          const declPath = toRepoPath(declSf.getFilePath(), clonePath);

          let name = symbol.getName();
          if (Node.isFunctionDeclaration(decl) || Node.isMethodDeclaration(decl) || Node.isVariableDeclaration(decl)) {
            name = (decl as any).getName() || name;
          }

          // The resolved declaration is directly function-like (a function
          // or method declaration) in the common case here -- e.g.
          // `https.onCall(OSKBuildingService.getAllBuildings)`. If instead
          // it's a variable declaration (`const handler = (data) => ...`),
          // the function-like node is its initializer, not the declaration
          // itself.
          let fnLikeNode: Node | undefined = decl;
          if (Node.isVariableDeclaration(decl)) {
            const init = decl.getInitializer();
            fnLikeNode = init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) ? init : undefined;
          }

          return {
            handlerName: name,
            handlerExpression,
            handlerDeclarationFile: declPath,
            handlerStartLine: decl.getStartLineNumber(),
            handlerEndLine: decl.getEndLineNumber(),
            handlerResolutionStatus: "resolved",
            ...extractHandlerSignatureTypes(fnLikeNode, clonePath),
          };
        }
      }
    } catch {
      // Fall through to unresolved
    }

    return {
      handlerName: handlerNode.getText(),
      handlerExpression,
      handlerDeclarationFile: currentRelativePath,
      handlerStartLine: handlerNode.getStartLineNumber(),
      handlerEndLine: handlerNode.getEndLineNumber(),
      handlerResolutionStatus: "unresolved",
      requestType: null,
      responseType: null,
    };
  }

  return {
    handlerName: handlerNode.getText(),
    handlerExpression,
    handlerDeclarationFile: currentRelativePath,
    handlerStartLine: handlerNode.getStartLineNumber(),
    handlerEndLine: handlerNode.getEndLineNumber(),
    handlerResolutionStatus: "partial",
    requestType: null,
    responseType: null,
  };
}

const TRIGGER_METHODS = new Set([
  "onCreate",
  "onUpdate",
  "onDelete",
  "onWrite",
  "onDocumentCreated",
  "onDocumentUpdated",
  "onDocumentDeleted",
  "onDocumentWritten",
]);

const AUTH_CHECK_METHODS = new Set([
  "hasPermission",
  "checkPermission",
  "assertPermission",
  "requirePermission",
  "authorize",
  "isAuthorized",
  "permissionGuard",
  "accessGuard",
]);

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

  const rawDir = path.join(repoOutputDir, "facts");
  fs.mkdirSync(rawDir, { recursive: true });

  const configPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const targetRepo = repoConfig.repositories.find((r: any) => r.name === REPO_NAME);

  if (!targetRepo) {
    addNotification(notifications, "01-extract-ast-evidence", "fatal", "MISSING_REPO_CONFIG", `Repository '${REPO_NAME}' not found in config/repos.json.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);

  // tsconfigRelativePath is config-driven per repo instead of hardcoded to
  // "functions/tsconfig.json" -- that path was specific to this repo's
  // Firebase Cloud Functions layout and will not hold for Angular, node-iot,
  // or any future repo. Defaults to the previous hardcoded value only to
  // keep this repo's existing config working without modification.
  const tsconfigRelativePath: string = targetRepo.tsconfigRelativePath || "functions/tsconfig.json";
  const tsconfigPath = path.join(clonePath, tsconfigRelativePath);

  // astErrorTolerancePercent is config-driven per repo; defaults to 0 (fail
  // closed on ANY per-file AST extraction error) unless a repo explicitly
  // opts into tolerating some percentage of failures.
  const astErrorTolerancePercent: number =
    typeof targetRepo.astErrorTolerancePercent === "number" ? targetRepo.astErrorTolerancePercent : 0;

  if (!fs.existsSync(tsconfigPath)) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "MISSING_TSCONFIG_FATAL",
      `Target repository tsconfig.json not found at expected path '${tsconfigPath}'.`
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Target repository tsconfig.json not found at '${tsconfigPath}'.`);
  }

  const filesJsonPath = path.join(rawDir, "files.json");
  if (!fs.existsSync(filesJsonPath)) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "MISSING_FILES_JSON_FATAL",
      `Missing required facts/files.json at '${filesJsonPath}'.`
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required facts/files.json at '${filesJsonPath}'.`);
  }

  const manifestFiles: Array<{
    repo: string;
    module: string;
    submodule: string | null;
    path: string;
    kindHint: string;
    sizeBytes: number;
  }> = JSON.parse(fs.readFileSync(filesJsonPath, "utf8"));

  const tsFiles = manifestFiles.filter(f => f.path.endsWith(".ts") && !f.path.endsWith(".d.ts"));

  console.log(`Manifest files: ${manifestFiles.length}`);
  console.log(`TS files selected: ${tsFiles.length}`);

  const project = new Project({
    tsConfigFilePath: tsconfigPath,
    skipAddingFilesFromTsConfig: true,
  });

  const runtimeFiles: Array<{
    file: (typeof manifestFiles)[0];
    base: any;
    absolutePath: string;
  }> = [];

  const missingSourceFiles: string[] = [];

  for (const f of tsFiles) {
    const absPath = path.join(clonePath, f.path);
    if (fs.existsSync(absPath)) {
      try {
        project.addSourceFileAtPath(absPath);
        runtimeFiles.push({
          file: f,
          base: {
            runId,
            repo: REPO_NAME,
            module: f.module,
            submodule: f.submodule,
            path: f.path,
          },
          absolutePath: absPath,
        });
      } catch (err: any) {
        missingSourceFiles.push(f.path);
      }
    } else {
      missingSourceFiles.push(f.path);
    }
  }

  if (runtimeFiles.length === 0) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "ZERO_SOURCE_FILES_FATAL",
      "Zero valid TypeScript source files could be loaded into ts-morph project."
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error("[ZERO_SOURCE_FILES_FATAL] Zero valid TypeScript source files loaded.");
  }

  if (missingSourceFiles.length > 0) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "warning",
      "MISSING_SOURCE_FILES_WARNING",
      `${missingSourceFiles.length} source file(s) listed in files.json could not be loaded into ts-morph.`,
      { count: missingSourceFiles.length, samples: missingSourceFiles.slice(0, 5) }
    );
  }

  const rawImports: any[] = [];
  const rawExports: any[] = [];
  const rawClasses: any[] = [];
  const rawMethods: any[] = [];
  const rawFunctions: any[] = [];
  const rawTypeAliases: any[] = [];
  const rawEnums: any[] = [];
  const rawModelProperties: any[] = [];
  const rawCalls: any[] = [];
  const rawFirestoreHints: any[] = [];
  const rawPermissionHints: any[] = [];
  const rawExternalHooks: any[] = [];
  const rawApiContracts: any[] = [];
  const rawTriggers: any[] = [];
  const rawErrors: any[] = [];

  for (const { file, base, absolutePath } of runtimeFiles) {
    const sf = project.getSourceFile(absolutePath);
    if (!sf) continue;

    try {
      // 1. Imports
      for (const imp of sf.getImportDeclarations()) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const defaultImport = imp.getDefaultImport()?.getText();
        const namedImports = imp.getNamedImports().map(n => n.getName());
        const isTypeOnly = imp.isTypeOnly();

        rawImports.push({
          ...base,
          line: imp.getStartLineNumber(),
          moduleSpecifier,
          defaultImport: defaultImport || null,
          namedImports,
          isTypeOnly,
        });
      }

      // 2. Exports
      for (const exp of sf.getExportDeclarations()) {
        const moduleSpecifier = exp.getModuleSpecifierValue();
        const namedExports = exp.getNamedExports().map(n => n.getName());

        rawExports.push({
          ...base,
          line: exp.getStartLineNumber(),
          moduleSpecifier: moduleSpecifier || null,
          namedExports,
        });
      }

      // 3. Classes & Methods
      for (const cls of sf.getClasses()) {
        const className = cls.getName() || "AnonymousClass";
        const extendsClass = cls.getBaseClass()?.getName() || null;
        const isExported = cls.isExported();

        rawClasses.push({
          ...base,
          line: cls.getStartLineNumber(),
          className,
          extendsClass,
          isExported,
        });

        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          const returnType = sanitizeTypeText(method.getReturnType().getText(), clonePath);
          const isAsync = method.isAsync();
          const isStatic = method.isStatic();
          const visibility = method.getScope();

          rawMethods.push({
            ...base,
            line: method.getStartLineNumber(),
            className,
            methodName,
            returnType,
            isAsync,
            isStatic,
            visibility,
          });
        }
      }

      // 4. Functions
      for (const fn of sf.getFunctions()) {
        const name = fn.getName() || "AnonymousFunction";
        const isExported = fn.isExported();
        const isAsync = fn.isAsync();
        const returnType = sanitizeTypeText(fn.getReturnType().getText(), clonePath);

        rawFunctions.push({
          ...base,
          line: fn.getStartLineNumber(),
          name,
          isExported,
          isAsync,
          returnType,
        });
      }

      // 5. Type Aliases
      for (const ta of sf.getTypeAliases()) {
        rawTypeAliases.push({
          ...base,
          line: ta.getStartLineNumber(),
          name: ta.getName(),
          isExported: ta.isExported(),
        });
      }

      // 6. Enums
      for (const en of sf.getEnums()) {
        rawEnums.push({
          ...base,
          line: en.getStartLineNumber(),
          name: en.getName(),
          members: en.getMembers().map(m => m.getName()),
          isExported: en.isExported(),
        });
      }

      // 7. Model Properties (Interfaces / Classes)
      for (const iface of sf.getInterfaces()) {
        for (const prop of iface.getProperties()) {
          rawModelProperties.push({
            ...base,
            line: prop.getStartLineNumber(),
            parentName: iface.getName(),
            propertyName: prop.getName(),
            propertyType: sanitizeTypeText(prop.getType().getText(), clonePath),
            isOptional: prop.hasQuestionToken(),
          });
        }
      }

      // 7b. Model Properties (Type Aliases declared as object literals, or
      // intersections containing one -- e.g. `type X = { a: string }` or
      // `type X = Base & { a: string }`. Only the alias's own inline
      // literal members are captured here, matching getInterfaces() above,
      // which likewise only returns properties declared directly on the
      // interface rather than ones inherited via `extends`.
      const collectTypeLiteralProperties = (typeNode: Node): Node[] => {
        if (Node.isTypeLiteral(typeNode)) {
          return typeNode.getProperties();
        }
        if (Node.isIntersectionTypeNode(typeNode)) {
          return typeNode.getTypeNodes().flatMap(collectTypeLiteralProperties);
        }
        return [];
      };

      for (const ta of sf.getTypeAliases()) {
        const typeNode = ta.getTypeNode();
        if (!typeNode) continue;

        for (const prop of collectTypeLiteralProperties(typeNode)) {
          if (!Node.isPropertySignature(prop)) continue;
          rawModelProperties.push({
            ...base,
            line: prop.getStartLineNumber(),
            parentName: ta.getName(),
            propertyName: prop.getName(),
            propertyType: sanitizeTypeText(prop.getType().getText(), clonePath),
            isOptional: prop.hasQuestionToken(),
          });
        }
      }

      // 8. Call Expressions & AST Structural Extractions
      for (const callExpr of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        const expr = callExpr.getExpression();
        const calleeText = expr.getText();
        const line = callExpr.getStartLineNumber();

        const exactMethodName = Node.isPropertyAccessExpression(expr)
          ? expr.getName()
          : Node.isIdentifier(expr)
          ? expr.getText()
          : null;

        // Enclosing caller context & range
        let callerName: string | null = null;
        let callerClass: string | null = null;
        let callerDeclarationFile: string | null = base.path;
        let callerStartLine: number | null = null;
        let callerEndLine: number | null = null;

        const enclosingMethod = callExpr.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
        const enclosingFn = callExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
        const enclosingClass = callExpr.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

        if (enclosingClass) {
          callerClass = enclosingClass.getName() || "AnonymousClass";
        }

        if (enclosingMethod) {
          callerName = enclosingMethod.getName();
          callerStartLine = enclosingMethod.getStartLineNumber();
          callerEndLine = enclosingMethod.getEndLineNumber();
        } else if (enclosingFn) {
          callerName = enclosingFn.getName() || "AnonymousFunction";
          callerStartLine = enclosingFn.getStartLineNumber();
          callerEndLine = enclosingFn.getEndLineNumber();
        }

        let calleeSymbol: string | null = null;
        let aliasedCalleeSymbol: string | null = null;
        let declarationFile: string | null = null;
        let declarationLine: number | null = null;
        let declarationClass: string | null = null;
        let declarationMethod: string | null = null;
        let declarationModuleSpecifier: string | null = null;
        let resolutionStatus: "resolved" | "partial" | "unresolved" = "unresolved";

        try {
          const symbol = expr.getSymbol();
          if (symbol) {
            calleeSymbol = symbol.getName();
            const aliased = symbol.getAliasedSymbol();
            if (aliased) aliasedCalleeSymbol = aliased.getName();

            const decl = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
            if (decl) {
              const declSf = decl.getSourceFile();
              declarationFile = toRepoPath(declSf.getFilePath(), clonePath);
              declarationLine = decl.getStartLineNumber();

              const declClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
              if (declClass) declarationClass = declClass.getName() || null;

              if (Node.isMethodDeclaration(decl)) {
                declarationMethod = decl.getName();
              } else if (Node.isFunctionDeclaration(decl)) {
                declarationMethod = decl.getName() || null;
              }

              const impDecl = decl.getFirstAncestorByKind(SyntaxKind.ImportDeclaration);
              if (impDecl) {
                declarationModuleSpecifier = impDecl.getModuleSpecifierValue();
              }

              resolutionStatus = declarationFile ? "resolved" : "partial";
            }
          }
        } catch {
          resolutionStatus = "unresolved";
        }

        rawCalls.push({
          ...base,
          line,
          expression: calleeText,
          name: exactMethodName || calleeText.split(".").pop() || calleeText,
          arguments: callExpr.getArguments().map(a => a.getText()),
          callerName,
          callerClass,
          callerDeclarationFile,
          callerStartLine,
          callerEndLine,
          calleeExpression: calleeText,
          calleeSymbol,
          aliasedCalleeSymbol,
          declarationFile,
          declarationLine,
          declarationClass,
          declarationMethod,
          declarationModuleSpecifier,
          resolutionStatus,
        });

        // 8a. Firestore Path Extraction (Structural)
        if (exactMethodName && ["collection", "doc", "collectionGroup", "document"].includes(exactMethodName)) {
          const arg0 = callExpr.getArguments()[0];
          if (arg0) {
            const res = resolveExpressionValue(arg0);
            if (res.value) {
              const op = findChainedFirestoreOperation(callExpr);

              rawFirestoreHints.push({
                ...base,
                line,
                value: res.value,
                touchType: "path_reference",
                operation: op,
                // Self-describing scope label: a null `operation` does NOT
                // mean "no read/write happens here" -- it means detection
                // only covers direct method chains (e.g.
                // db.collection(x).doc(y).get()). It cannot see operations
                // performed via a variable assigned elsewhere and later
                // passed into transaction.get()/batch.set()/etc, which is a
                // common pattern in this codebase. A consumer (including
                // Phase 2 synthesis) should treat operation: null as
                // "undetermined by static chain analysis", not "read-only"
                // or "no operation".
                operationDetectionScope: op ? "direct_chain_detected" : "undetermined_may_be_indirect",
                pathResolutionMethod: res.status === "resolved" ? (Node.isTemplateExpression(arg0) ? "template_expression" : (Node.isIdentifier(arg0) ? "resolved_constant" : "literal")) : res.status,
              });
            }
          }
        }

        // 8b. Structural Pub/Sub Topic Extraction
        if (Node.isPropertyAccessExpression(expr) && expr.getName() === "topic") {
          const topicArg = callExpr.getArguments()[0];
          if (topicArg) {
            const res = resolveExpressionValue(topicArg);
            if (res.value) {
              let isConfirmedPubSub = false;
              if (declarationModuleSpecifier?.includes("pubsub") || calleeText.includes("pubsub")) {
                isConfirmedPubSub = true;
              }

              rawExternalHooks.push({
                ...base,
                line,
                type: "pubsub_topic",
                value: res.value,
                confidence: isConfirmedPubSub ? "confirmed" : "candidate",
                calleeExpression: calleeText,
                calleeSymbol,
                declarationFile,
                declarationModuleSpecifier,
                resolutionStatus,
              });
            }
          }
        }

        // 8c. Firestore Triggers (Exact Method Matching & Symbol Resolution)
        if (exactMethodName && TRIGGER_METHODS.has(exactMethodName)) {
          const arg0 = callExpr.getArguments()[0];
          const arg1 = callExpr.getArguments()[1];
          let firestorePath: string | null = null;
          let handlerNode = arg1 || arg0;

          if (arg0 && (arg1 || TRIGGER_METHODS.has(exactMethodName))) {
            const res = resolveExpressionValue(arg0);
            if (res.value) firestorePath = res.value;
          }

          const handlerResolution = resolveHandlerDeclaration(handlerNode, clonePath, base.path);

          rawTriggers.push({
            ...base,
            line,
            triggerType: "FIRESTORE_TRIGGER",
            firestorePath: firestorePath || "unknown",
            rawText: callExpr.getText(),
            calleeExpression: calleeText,
            calleeSymbol,
            aliasedCalleeSymbol,
            declarationFile,
            declarationModuleSpecifier,
            resolutionStatus,
            ...handlerResolution,
          });
        }

        // 8d. API Contracts (onCall / onRequest Handler Symbol Resolution)
        if (exactMethodName && ["onCall", "onRequest"].includes(exactMethodName)) {
          const handlerArg = callExpr.getArguments()[1] || callExpr.getArguments()[0];
          const handlerResolution = resolveHandlerDeclaration(handlerArg, clonePath, base.path);

          rawApiContracts.push({
            ...base,
            line,
            contractType: exactMethodName === "onCall" ? "callable" : "http",
            rawText: callExpr.getText(),
            value: handlerResolution.handlerName || exactMethodName,
            calleeExpression: calleeText,
            calleeSymbol,
            aliasedCalleeSymbol,
            declarationFile,
            declarationModuleSpecifier,
            resolutionStatus,
            ...handlerResolution,
          });
        }

        // 8e. Environment Variables & Storage Path Candidates
        if (calleeText.includes("process.env")) {
          rawExternalHooks.push({
            ...base,
            line,
            type: "environment_variable",
            value: calleeText,
            confidence: "confirmed",
          });
        }
      }

      // 9. Permission Hints AST Traversal (Strict Error & Auth Check Classification)
      for (const lit of sf.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
        const val = lit.getLiteralValue();
        const isVersioned = /^v\d+\.[a-zA-Z0-9_.:-]+$/.test(val);
        const isError = val === "permission-denied";
        const isConst = val.startsWith("PERMISSION_") || val.startsWith("SCOPE_") || isError;

        if (isVersioned || isConst) {
          const line = lit.getStartLineNumber();
          const parentCall = lit.getFirstAncestorByKind(SyntaxKind.CallExpression);
          const contextExpr = parentCall?.getExpression().getText() || null;

          let candidateType: "versioned_permission" | "permission_constant" | "scope_constant" | "permission_error" | "heuristic" = "heuristic";
          if (isError) {
            candidateType = "permission_error";
          } else if (isVersioned) {
            candidateType = "versioned_permission";
          } else if (val.startsWith("PERMISSION_")) {
            candidateType = "permission_constant";
          } else if (val.startsWith("SCOPE_")) {
            candidateType = "scope_constant";
          }

          let isConfirmed = false;
          if (isVersioned && contextExpr) {
            isConfirmed = Array.from(AUTH_CHECK_METHODS).some(m => contextExpr.includes(m));
          }

          rawPermissionHints.push({
            ...base,
            line,
            permission: val,
            permissionCandidateType: candidateType,
            confidence: isConfirmed ? "confirmed" : "candidate",
            contextExpression: contextExpr,
          });
        }
      }
    } catch (err: any) {
      rawErrors.push({
        file: base.path,
        stage: "ast_extraction",
        message: err.message,
      });
    }
  }

  // Sort raw outputs deterministically
  const sortFn = (a: any, b: any) => (a.path || "").localeCompare(b.path || "") || (a.line ?? 0) - (b.line ?? 0) || (a.name || a.value || "").localeCompare(b.name || b.value || "");

  rawImports.sort(sortFn);
  rawExports.sort(sortFn);
  rawClasses.sort(sortFn);
  rawMethods.sort(sortFn);
  rawFunctions.sort(sortFn);
  rawTypeAliases.sort(sortFn);
  rawEnums.sort(sortFn);
  rawModelProperties.sort(sortFn);
  rawCalls.sort(sortFn);
  rawFirestoreHints.sort(sortFn);
  rawPermissionHints.sort(sortFn);
  rawExternalHooks.sort(sortFn);
  rawApiContracts.sort(sortFn);
  rawTriggers.sort(sortFn);
  rawErrors.sort(sortFn);

  // Write raw facts atomically
  writeJsonAtomically(path.join(rawDir, "ast-imports.json"), rawImports, "facts/ast-imports.json");
  writeJsonAtomically(path.join(rawDir, "ast-exports.json"), rawExports, "facts/ast-exports.json");
  writeJsonAtomically(path.join(rawDir, "ast-classes.json"), rawClasses, "facts/ast-classes.json");
  writeJsonAtomically(path.join(rawDir, "ast-methods.json"), rawMethods, "facts/ast-methods.json");
  writeJsonAtomically(path.join(rawDir, "ast-functions.json"), rawFunctions, "facts/ast-functions.json");
  writeJsonAtomically(path.join(rawDir, "ast-type-aliases.json"), rawTypeAliases, "facts/ast-type-aliases.json");
  writeJsonAtomically(path.join(rawDir, "ast-enums.json"), rawEnums, "facts/ast-enums.json");
  writeJsonAtomically(path.join(rawDir, "ast-model-properties.json"), rawModelProperties, "facts/ast-model-properties.json");
  writeJsonAtomically(path.join(rawDir, "ast-calls.json"), rawCalls, "facts/ast-calls.json");
  writeJsonAtomically(path.join(rawDir, "ast-firestore-hints.json"), rawFirestoreHints, "facts/ast-firestore-hints.json");
  writeJsonAtomically(path.join(rawDir, "ast-permission-hints.json"), rawPermissionHints, "facts/ast-permission-hints.json");
  writeJsonAtomically(path.join(rawDir, "ast-external-hooks.json"), rawExternalHooks, "facts/ast-external-hooks.json");
  writeJsonAtomically(path.join(rawDir, "ast-api-contracts.json"), rawApiContracts, "facts/ast-api-contracts.json");
  writeJsonAtomically(path.join(rawDir, "ast-firestore-triggers.json"), rawTriggers, "facts/ast-firestore-triggers.json");
  writeJsonAtomically(path.join(rawDir, "ast-errors.json"), rawErrors, "facts/ast-errors.json");

  // AST error-tolerance gate: previously rawErrors were collected and
  // reported but never gated, meaning a run could partially fail extraction
  // on many files and still report "complete". This makes evidence
  // completeness an explicit, configurable, fail-closed check instead of a
  // silently-tolerated gap that Phase 2 would inherit without warning.
  const attemptedFileCount = runtimeFiles.length;
  const erroredFileCount = new Set(rawErrors.map((e: any) => e.file)).size;
  const errorRatePercent = attemptedFileCount > 0 ? (erroredFileCount / attemptedFileCount) * 100 : 0;

  if (errorRatePercent > astErrorTolerancePercent) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "AST_ERROR_TOLERANCE_EXCEEDED",
      `AST extraction failed on ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), exceeding configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent },
      true
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(
      `[Fail-Closed] AST extraction error rate ${errorRatePercent.toFixed(2)}% exceeds configured tolerance of ${astErrorTolerancePercent}% (${erroredFileCount}/${attemptedFileCount} files failed).`
    );
  } else if (erroredFileCount > 0) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "warning",
      "AST_ERRORS_WITHIN_TOLERANCE",
      `AST extraction failed on ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), within configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent }
    );
  }

  // Write AST evidence manifest LAST
  const astManifest = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    generatedAt: new Date().toISOString(),
    artefacts: [
      { file: "ast-imports.json", evidenceType: "imports", recordCount: rawImports.length, required: true },
      { file: "ast-exports.json", evidenceType: "exports", recordCount: rawExports.length, required: true },
      { file: "ast-classes.json", evidenceType: "classes", recordCount: rawClasses.length, required: true },
      { file: "ast-methods.json", evidenceType: "methods", recordCount: rawMethods.length, required: true },
      { file: "ast-functions.json", evidenceType: "functions", recordCount: rawFunctions.length, required: true },
      { file: "ast-type-aliases.json", evidenceType: "typeAliases", recordCount: rawTypeAliases.length, required: true },
      { file: "ast-enums.json", evidenceType: "enums", recordCount: rawEnums.length, required: true },
      { file: "ast-model-properties.json", evidenceType: "modelProperties", recordCount: rawModelProperties.length, required: true },
      { file: "ast-calls.json", evidenceType: "calls", recordCount: rawCalls.length, required: true },
      { file: "ast-firestore-hints.json", evidenceType: "firestoreHints", recordCount: rawFirestoreHints.length, required: true },
      { file: "ast-permission-hints.json", evidenceType: "permissionHints", recordCount: rawPermissionHints.length, required: true },
      { file: "ast-external-hooks.json", evidenceType: "externalHooks", recordCount: rawExternalHooks.length, required: true },
      { file: "ast-api-contracts.json", evidenceType: "apiContracts", recordCount: rawApiContracts.length, required: true },
      { file: "ast-firestore-triggers.json", evidenceType: "firestoreTriggers", recordCount: rawTriggers.length, required: true },
    ],
    errors: {
      file: "ast-errors.json",
      recordCount: rawErrors.length,
    },
  };

  writeJsonAtomically(path.join(rawDir, "ast-evidence-manifest.json"), astManifest, "facts/ast-evidence-manifest.json");

  addNotification(notifications, "01-extract-ast-evidence", "info", "AST_EXTRACTION_COMPLETED", "AST evidence extraction completed successfully.");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("AST evidence extraction complete");
  console.log({
    imports: rawImports.length,
    exports: rawExports.length,
    classes: rawClasses.length,
    methods: rawMethods.length,
    functions: rawFunctions.length,
    typeAliases: rawTypeAliases.length,
    enums: rawEnums.length,
    modelProperties: rawModelProperties.length,
    calls: rawCalls.length,
    firestoreHints: rawFirestoreHints.length,
    permissionHints: rawPermissionHints.length,
    externalHooks: rawExternalHooks.length,
    apiContracts: rawApiContracts.length,
    firestoreTriggers: rawTriggers.length,
    errors: rawErrors.length,
  });
  console.log(`AST evidence manifest written to: ${path.join(rawDir, "ast-evidence-manifest.json")}`);
}

main();
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

const MONGO_OPERATION_METHODS = new Set(["findOne", "findMany", "insertOne", "updateOne", "deleteOne"]);

function resolveSimpleRef(node: Node | undefined, clonePath: string): {
  name: string | null;
  declarationFile: string | null;
  declarationLine: number | null;
  declarationEndLine: number | null;
  declarationNode: Node | undefined;
  className: string | null;
} {
  if (!node) return { name: null, declarationFile: null, declarationLine: null, declarationEndLine: null, declarationNode: undefined, className: null };
  try {
    const rawSymbol = node.getSymbol();
    // For an imported identifier (e.g. `schema: pubSubMessageSchema`), getSymbol()
    // returns the LOCAL import-binding symbol, whose getValueDeclaration() is the
    // ImportSpecifier in THIS file, not the real declaration -- getAliasedSymbol()
    // follows through to the actual exported declaration. A non-aliased symbol
    // (e.g. a class member access, unaffected by import aliasing) has no aliased
    // symbol, so this falls back to the original symbol unchanged.
    const symbol = rawSymbol?.getAliasedSymbol() || rawSymbol;
    if (symbol) {
      const decl = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
      if (decl) {
        const declSf = decl.getSourceFile();
        const declClass = decl.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
        return {
          name: symbol.getName(),
          declarationFile: toRepoPath(declSf.getFilePath(), clonePath),
          declarationLine: decl.getStartLineNumber(),
          declarationEndLine: decl.getEndLineNumber(),
          declarationNode: decl,
          className: declClass ? declClass.getName() || null : null,
        };
      }
    }
  } catch {
    // fall through to unresolved below
  }
  return { name: node.getText(), declarationFile: null, declarationLine: null, declarationEndLine: null, declarationNode: undefined, className: null };
}

// Route handlers in this repo are always `static X: OSKAsyncRequestHandler =
// async (...) => {...}` -- a PropertyDeclaration whose initializer is the
// arrow function. Falls back to plain method/function declarations for
// robustness, though every real case in this repo is the property form.
function getFunctionBody(declNode: Node | undefined): Node | undefined {
  if (!declNode) return undefined;
  if (Node.isPropertyDeclaration(declNode)) {
    const init = declNode.getInitializer();
    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
      return init.getBody();
    }
  }
  if (Node.isMethodDeclaration(declNode) || Node.isFunctionDeclaration(declNode)) {
    return declNode.getBody();
  }
  return undefined;
}

// Distinct callee expression texts (not call sites) within a node --
// mirrors the same pattern the file's now-removed Firebase-specific
// extractPubSubEventRoutes used, just as a small standalone helper here.
function collectTargetCalls(node: Node): string[] {
  const calls = new Set<string>();
  for (const callExpr of node.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const calleeExpr = callExpr.getExpression();
    if (Node.isPropertyAccessExpression(calleeExpr) || Node.isIdentifier(calleeExpr)) {
      calls.add(calleeExpr.getText());
    }
  }
  return Array.from(calls);
}

function walkJoiChain(node: Node): { baseType: string | null; required: boolean; validValues: string[] | null } {
  let current: Node = node;
  let required = false;
  let validValues: string[] | null = null;

  while (Node.isCallExpression(current)) {
    const callee = current.getExpression();
    if (!Node.isPropertyAccessExpression(callee)) break;

    const methodName = callee.getName();
    const calleeBase = callee.getExpression();

    // Base case: this call IS `Joi.<type>(...)` itself (e.g. Joi.string()) --
    // its own callee's base is the bare `Joi` identifier, not another chained call.
    if (Node.isIdentifier(calleeBase) && calleeBase.getText() === "Joi") {
      return { baseType: methodName, required, validValues };
    }

    // Otherwise this call is a modifier chained onto an earlier call
    // (e.g. .required(), .valid(...), .optional(), .items(...)) -- record
    // what it tells us, then descend into what it's chained onto.
    if (methodName === "required") required = true;
    if (methodName === "valid") {
      validValues = current.getArguments()
        .filter((a): a is any => Node.isStringLiteral(a))
        .map(a => (a as any).getLiteralValue());
    }

    current = calleeBase;
  }
  return { baseType: null, required, validValues };
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
    // Enum member access (`EnumName.MEMBER`, e.g. `ActivityUserType.USER`).
    // The WHOLE property-access expression's own symbol resolves directly
    // to the specific member's declaration -- distinct from the symbol of
    // the enum name alone (which the generic fallback below would recurse
    // into and fail to resolve, since an enum declaration itself is
    // neither a variable, property assignment, nor enum member). Checked
    // first, generically, for any enum -- not specific to any one enum
    // name. Confirmed empirically 2026-08-01: this exact gap caused case
    // labels like `case ActivityUserType.USER:` inside a switch statement
    // to resolve as null/"unsupported" even though the case values
    // themselves (USER, SUPPLIER_STAFF_MEMBER, NON_APP_USER) are fully
    // static and knowable.
    const ownSymbol = node.getSymbol();
    if (ownSymbol) {
      const ownDeclaration = ownSymbol.getValueDeclaration() || ownSymbol.getDeclarations()[0];
      if (ownDeclaration && Node.isEnumMember(ownDeclaration)) {
        const val = ownDeclaration.getValue();
        if (val !== undefined) return { value: String(val), status: "resolved" };
      }
    }

    const propName = node.getName();
    const exprRes = resolveExpressionValue(node.getExpression(), visitedDeclarations, depth + 1, maxDepth);
    if (exprRes.value) {
      return { value: `${exprRes.value}.${propName}`, status: exprRes.status };
    }
  }

  return { value: null, status: "unsupported" };
}

// Methods that ultimately wrap the real @google-cloud/pubsub SDK call
// (OSKMessageController._publishMessage / OSKMessageControllerInternal
// .publishMessage, confirmed 2026-08-01 in core/controllers/
// message.controller.ts and document_and_message.controller.ts). The topic
// name is that method's first parameter, which is unresolvable to a literal
// AT the SDK call site itself (it's a pass-through parameter there) -- but
// is often a literal or named constant at the CALLER's call site, e.g.
// `this._publishMessage(OSK_PUBSUB_TOPIC_ACD_ACCESSES, ...)`. So this set
// is checked at every call site, not just the one place that calls
// pubSub.topic() directly, and unresolved call sites are still recorded
// (as candidates) rather than silently dropped, since even an unresolved
// call site confirms a publish happens there.
const PUBSUB_PUBLISH_METHODS = new Set(["_publishMessage", "publishMessage"]);

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

  // Repo-relative-path -> module/submodule lookup, built once from the same
  // authoritative file->module classification 00-scan-repo.ts already
  // computed for every file in the repo. Used below to resolve each import
  // to a real target module deterministically (via ts-morph's own compiler
  // resolution, not string-matching the import specifier), so that
  // cross-module coupling (see governance/roadmap/01-cross-module-dependency-graph.md)
  // can be built downstream without any further path-parsing guesswork.
  const fileToModuleMap = new Map<string, { module: string; submodule: string | null }>();
  for (const f of manifestFiles) {
    fileToModuleMap.set(f.path, { module: f.module, submodule: f.submodule });
  }

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
  const rawExternalHooks: any[] = [];
  const rawMongoOperations: any[] = [];
  const rawRouteDefinitions: any[] = [];
  const rawJoiSchemaFields: any[] = [];
  const rawPubSubOperationRoutes: any[] = [];
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

        // Resolve the import to its real target module deterministically,
        // via ts-morph's own compiler resolution (handles both relative
        // imports and @oskey/* tsconfig path aliases correctly) plus the
        // same file->module classification 00-scan-repo.ts already computed
        // -- not by string-matching moduleSpecifier ourselves. Feeds the
        // cross-module dependency graph (see governance/roadmap/
        // 01-cross-module-dependency-graph.md); has no effect on any
        // existing fact type.
        let resolvedTargetModule: string | null = null;
        let resolvedTargetSubmodule: string | null = null;
        let importResolutionStatus: "resolved_in_repo" | "resolved_outside_module_boundary" | "unresolved_by_compiler" = "unresolved_by_compiler";
        const targetSf = imp.getModuleSpecifierSourceFile();
        if (targetSf) {
          const targetRepoPath = toRepoPath(targetSf.getFilePath(), clonePath);
          const targetEntry = fileToModuleMap.get(targetRepoPath);
          if (targetEntry?.module) {
            resolvedTargetModule = targetEntry.module;
            resolvedTargetSubmodule = targetEntry.submodule;
            importResolutionStatus = "resolved_in_repo";
          } else {
            importResolutionStatus = "resolved_outside_module_boundary";
          }
        }

        rawImports.push({
          ...base,
          line: imp.getStartLineNumber(),
          moduleSpecifier,
          defaultImport: defaultImport || null,
          namedImports,
          resolvedTargetModule,
          resolvedTargetSubmodule,
          importResolutionStatus,
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

      // 7c. Route Definitions (OSKRoutes object literals)
      for (const varStmt of sf.getVariableStatements()) {
        if (!varStmt.isExported()) continue;
        for (const decl of varStmt.getDeclarations()) {
          const typeNode = decl.getTypeNode();
          if (!typeNode || typeNode.getText() !== "OSKRoutes") continue;
          const routesObj = decl.getInitializer();
          if (!routesObj || !Node.isObjectLiteralExpression(routesObj)) continue;

          for (const pathProp of routesObj.getProperties()) {
            if (!Node.isPropertyAssignment(pathProp)) continue;
            const pathNameNode = pathProp.getNameNode();
            const httpPath = Node.isStringLiteral(pathNameNode) ? pathNameNode.getLiteralValue() : pathNameNode.getText();

            const methodsObj = pathProp.getInitializer();
            if (!methodsObj || !Node.isObjectLiteralExpression(methodsObj)) continue;

            for (const methodProp of methodsObj.getProperties()) {
              if (!Node.isPropertyAssignment(methodProp)) continue;
              const methodNameNode = methodProp.getNameNode();
              const method = Node.isStringLiteral(methodNameNode) ? methodNameNode.getLiteralValue() : methodNameNode.getText();

              const versionsObj = methodProp.getInitializer();
              if (!versionsObj || !Node.isObjectLiteralExpression(versionsObj)) continue;

              for (const versionProp of versionsObj.getProperties()) {
                if (!Node.isPropertyAssignment(versionProp)) continue;
                const versionNameNode = versionProp.getNameNode();
                const versionDate = Node.isStringLiteral(versionNameNode) ? versionNameNode.getLiteralValue() : versionNameNode.getText();

                const entryObj = versionProp.getInitializer();
                if (!entryObj || !Node.isObjectLiteralExpression(entryObj)) continue;

                const requestHandlerProp = entryObj.getProperties().find(p => Node.isPropertyAssignment(p) && p.getName() === "requestHandler");
                const schemaProp = entryObj.getProperties().find(p => Node.isPropertyAssignment(p) && p.getName() === "schema");

                const handlerRef = resolveSimpleRef(
                  requestHandlerProp && Node.isPropertyAssignment(requestHandlerProp) ? requestHandlerProp.getInitializer() : undefined,
                  clonePath
                );
                const schemaRef = resolveSimpleRef(
                  schemaProp && Node.isPropertyAssignment(schemaProp) ? schemaProp.getInitializer() : undefined,
                  clonePath
                );

                rawRouteDefinitions.push({
                  ...base,
                  line: entryObj.getStartLineNumber(),
                  // NOT `path:` -- base.path is the real source FILE path (every
                  // other fact type relies on this meaning), and every route
                  // record already carries it via the ...base spread above.
                  // `httpPath` is the registered HTTP route path -- a different,
                  // additional piece of information, not a replacement for it.
                  httpPath,
                  method,
                  versionDate,
                  handlerClass: handlerRef.className,
                  handlerMethod: handlerRef.name,
                  handlerDeclarationFile: handlerRef.declarationFile,
                  handlerStartLine: handlerRef.declarationLine,
                  handlerEndLine: handlerRef.declarationEndLine,
                  schemaName: schemaRef.name,
                  schemaDeclarationFile: schemaRef.declarationFile,
                  isPubSubPushRoute: schemaRef.name === "pubSubMessageSchema",
                });

                if (schemaRef.name === "pubSubMessageSchema") {
                  const body = getFunctionBody(handlerRef.declarationNode);
                  if (body) {
                    for (const switchStmt of body.getDescendantsOfKind(SyntaxKind.SwitchStatement)) {
                      const discriminant = switchStmt.getExpression();
                      if (!Node.isPropertyAccessExpression(discriminant) || discriminant.getName() !== "operation") continue;

                      for (const clause of switchStmt.getCaseBlock().getClauses()) {
                        if (!Node.isCaseClause(clause)) continue; // skip `default:` -- no literal to route on

                        const opRes = resolveExpressionValue(clause.getExpression());
                        rawPubSubOperationRoutes.push({
                          ...base,
                          line: clause.getStartLineNumber(),
                          handlerClass: handlerRef.className,
                          handlerMethod: handlerRef.name,
                          dispatchKind: "switch_case",
                          operationValue: opRes.value,
                          operationResolutionStatus: opRes.status,
                          targetCalls: collectTargetCalls(clause),
                        });
                      }
                    }

                    for (const ifStmt of body.getDescendantsOfKind(SyntaxKind.IfStatement)) {
                      const condition = ifStmt.getExpression();
                      const nestedComparisons = condition.getDescendantsOfKind(SyntaxKind.BinaryExpression)
                        .filter(b => b.getOperatorToken().getText() === "===");
                      const allComparisons =
                        Node.isBinaryExpression(condition) && condition.getOperatorToken().getText() === "==="
                          ? [condition, ...nestedComparisons]
                          : nestedComparisons;

                      const thenBlock = ifStmt.getThenStatement();
                      const targetCalls = collectTargetCalls(thenBlock);

                      for (const cmp of allComparisons) {
                        const left = cmp.getLeft();
                        const right = cmp.getRight();
                        const opSide = Node.isPropertyAccessExpression(left) && left.getName() === "operation" ? right
                          : Node.isPropertyAccessExpression(right) && right.getName() === "operation" ? left
                          : undefined;
                        if (!opSide) continue;

                        const opRes = resolveExpressionValue(opSide);
                        rawPubSubOperationRoutes.push({
                          ...base,
                          line: ifStmt.getStartLineNumber(),
                          handlerClass: handlerRef.className,
                          handlerMethod: handlerRef.name,
                          dispatchKind: "if_else_branch",
                          operationValue: opRes.value,
                          operationResolutionStatus: opRes.status,
                          targetCalls,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
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

        // 8b-alt. Pub/Sub Publish Call Sites
        // Two independent detection strategies for the same underlying
        // event (a message being published), tried in order so a real
        // publish call site is caught however it's shaped in the source:
        //
        //  1. Structural chain: `<expr>.topic(x).publish(y)` /
        //     `.publishMessage(y)` chained directly off one object. Matches
        //     the actual @google-cloud/pubsub SDK's own fluent API shape,
        //     so it works regardless of what any particular repo names its
        //     own wrapper methods -- no repo-specific convention assumed.
        //  2. Known wrapper method names (PUBSUB_PUBLISH_METHODS): catches
        //     calls to a repo's OWN internal wrapper (e.g.
        //     OSKMessageController._publishMessage) where the raw SDK call
        //     is several hops away and the wrapper's own parameter can
        //     never resolve to a literal -- only the wrapper's CALLERS can
        //     supply an actual literal/constant. This one IS specific to
        //     this codebase's naming convention, unlike (1), and won't
        //     follow if that convention changes.
        //
        // (2) is skipped whenever (1) already matched, so the one call site
        // where both patterns are simultaneously true (message.controller
        // .ts's pubSub.topic(...).publishMessage(...)) isn't recorded twice.
        let matchedStructuralPubSubChain = false;
        if (exactMethodName === "publish" || exactMethodName === "publishMessage") {
          const calleeObject = Node.isPropertyAccessExpression(expr) ? expr.getExpression() : undefined;
          if (calleeObject && Node.isCallExpression(calleeObject)) {
            const innerExpr = calleeObject.getExpression();
            if (Node.isPropertyAccessExpression(innerExpr) && innerExpr.getName() === "topic") {
              const topicArg = calleeObject.getArguments()[0];
              if (topicArg) {
                const res = resolveExpressionValue(topicArg);
                rawExternalHooks.push({
                  ...base,
                  line,
                  type: "pubsub_publish_call",
                  value: res.value || topicArg.getText(),
                  confidence: res.status === "resolved" ? "confirmed" : "candidate",
                  topicResolutionStatus: res.status,
                  detectionMethod: "structural_chain",
                  calleeExpression: calleeText,
                  calleeSymbol,
                  declarationFile,
                  declarationModuleSpecifier,
                  resolutionStatus,
                });
                matchedStructuralPubSubChain = true;
              }
            }
          }
        }

        if (!matchedStructuralPubSubChain && exactMethodName && PUBSUB_PUBLISH_METHODS.has(exactMethodName)) {
          const topicArg = callExpr.getArguments()[0];
          if (topicArg) {
            const res = resolveExpressionValue(topicArg);
            rawExternalHooks.push({
              ...base,
              line,
              type: "pubsub_publish_call",
              value: res.value || topicArg.getText(),
              confidence: res.status === "resolved" ? "confirmed" : "candidate",
              topicResolutionStatus: res.status,
              detectionMethod: "known_wrapper_method_name",
              calleeExpression: calleeText,
              calleeSymbol,
              declarationFile,
              declarationModuleSpecifier,
              resolutionStatus,
            });
          }
        }

        // 8f. MongoDB Operation Call Sites
        if (
          exactMethodName &&
          MONGO_OPERATION_METHODS.has(exactMethodName) &&
          Node.isPropertyAccessExpression(expr) &&
          expr.getExpression().getText() === "this._mongoDBService"
        ) {
          const dbNameArg = callExpr.getArguments()[0];
          const collectionArg = callExpr.getArguments()[1];

          let collectionName: string | null = null;
          let collectionResolutionStatus: "resolved_from_collections_map" | "resolved_property_name_only" | "unresolved_dynamic" | "no_argument" = "no_argument";

          if (collectionArg) {
            if (Node.isPropertyAccessExpression(collectionArg) && collectionArg.getExpression().getText() === "collections") {
              const propName = collectionArg.getName();
              let resolvedValue: string | null = null;
              try {
                const rawBaseSymbol = collectionArg.getExpression().getSymbol();
                // Same import-aliasing issue as resolveSimpleRef above: `collections`
                // is itself an imported identifier, so getSymbol() alone resolves to
                // the local import binding (its declaration is an ImportSpecifier,
                // not the real `export const collections = {...}`) unless the
                // aliased symbol is followed first.
                const baseSymbol = rawBaseSymbol?.getAliasedSymbol() || rawBaseSymbol;
                const baseDecl = baseSymbol?.getValueDeclaration();
                if (baseDecl && Node.isVariableDeclaration(baseDecl)) {
                  const objInit = baseDecl.getInitializer();
                  if (objInit && Node.isObjectLiteralExpression(objInit)) {
                    const matchingProp = objInit.getProperties().find(p => Node.isPropertyAssignment(p) && p.getName() === propName);
                    if (matchingProp && Node.isPropertyAssignment(matchingProp)) {
                      const valueNode = matchingProp.getInitializer();
                      if (valueNode && Node.isStringLiteral(valueNode)) {
                        resolvedValue = valueNode.getLiteralValue();
                      }
                    }
                  }
                }
              } catch {
                // fall through -- resolvedValue stays null, handled below
              }
              collectionName = resolvedValue ?? propName;
              collectionResolutionStatus = resolvedValue ? "resolved_from_collections_map" : "resolved_property_name_only";
            } else {
              collectionResolutionStatus = "unresolved_dynamic";
            }
          }

          rawMongoOperations.push({
            ...base,
            line,
            operation: exactMethodName,
            collectionName,
            collectionResolutionStatus,
            dbNameExpression: dbNameArg ? dbNameArg.getText() : null,
            callerName,
            callerClass,
          });
        }

        // 8g. Joi Schema Field Shapes
        if (Node.isPropertyAccessExpression(expr) && expr.getExpression().getText() === "Joi" && expr.getName() === "object") {
          const varDecl = callExpr.getParentIfKind(SyntaxKind.VariableDeclaration);
          const varDeclList = varDecl?.getParent();
          const varStmt = varDeclList?.getParent();
          const isTopLevelExportedSchema =
            varDecl && varStmt && Node.isVariableStatement(varStmt) && varStmt.isExported() && varStmt.getParent() === sf;

          if (isTopLevelExportedSchema && varDecl) {
            const schemaExportName = varDecl.getName();
            const objArg = callExpr.getArguments()[0];
            if (objArg && Node.isObjectLiteralExpression(objArg)) {
              for (const prop of objArg.getProperties()) {
                if (!Node.isPropertyAssignment(prop)) continue;
                const nameNode = prop.getNameNode();
                const fieldName = Node.isStringLiteral(nameNode) ? nameNode.getLiteralValue() : nameNode.getText();
                const fieldInit = prop.getInitializer();
                if (!fieldInit) continue;

                const { baseType, required, validValues } = walkJoiChain(fieldInit);

                rawJoiSchemaFields.push({
                  ...base,
                  line: prop.getStartLineNumber(),
                  schemaExportName,
                  fieldName,
                  joiType: baseType,
                  required,
                  validValues,
                });
              }
            }
          }
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
  rawExternalHooks.sort(sortFn);
  rawMongoOperations.sort(sortFn);
  rawRouteDefinitions.sort(sortFn);
  rawJoiSchemaFields.sort(sortFn);
  rawPubSubOperationRoutes.sort(sortFn);
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
  writeJsonAtomically(path.join(rawDir, "ast-external-hooks.json"), rawExternalHooks, "facts/ast-external-hooks.json");
  writeJsonAtomically(path.join(rawDir, "ast-mongo-operations.json"), rawMongoOperations, "facts/ast-mongo-operations.json");
  writeJsonAtomically(path.join(rawDir, "ast-route-definitions.json"), rawRouteDefinitions, "facts/ast-route-definitions.json");
  writeJsonAtomically(path.join(rawDir, "ast-joi-schema-fields.json"), rawJoiSchemaFields, "facts/ast-joi-schema-fields.json");
  writeJsonAtomically(path.join(rawDir, "ast-pubsub-operation-routes.json"), rawPubSubOperationRoutes, "facts/ast-pubsub-operation-routes.json");
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
      { file: "ast-external-hooks.json", evidenceType: "externalHooks", recordCount: rawExternalHooks.length, required: true },
      { file: "ast-mongo-operations.json", evidenceType: "mongoOperations", recordCount: rawMongoOperations.length, required: true },
      { file: "ast-route-definitions.json", evidenceType: "routeDefinitions", recordCount: rawRouteDefinitions.length, required: true },
      { file: "ast-joi-schema-fields.json", evidenceType: "joiSchemaFields", recordCount: rawJoiSchemaFields.length, required: true },
      { file: "ast-pubsub-operation-routes.json", evidenceType: "pubsubOperationRoutes", recordCount: rawPubSubOperationRoutes.length, required: true },
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
    externalHooks: rawExternalHooks.length,
    mongoOperations: rawMongoOperations.length,
    routeDefinitions: rawRouteDefinitions.length,
    joiSchemaFields: rawJoiSchemaFields.length,
    pubsubOperationRoutes: rawPubSubOperationRoutes.length,
    errors: rawErrors.length,
  });
  console.log(`AST evidence manifest written to: ${path.join(rawDir, "ast-evidence-manifest.json")}`);
}

main();
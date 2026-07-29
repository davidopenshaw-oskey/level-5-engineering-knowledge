// **version:** 3.0.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script extracts AST evidence from TypeScript source code using ts-morph,
// capturing imports, exports, classes, methods, functions, type aliases, enums,
// model properties, calls, firestore hints, permission hints, external hooks,
// API contracts, and firestore triggers.

import fs from "fs";
import path from "path";
import { Project, SyntaxKind, Node, ClassDeclaration, MethodDeclaration, FunctionDeclaration, Identifier, Symbol, Type, SourceFile } from "ts-morph";

const projectRoot = process.cwd();

type NotificationSeverity = "info" | "warning" | "error" | "fatal";

interface NotificationEntry {
  id: string;
  sourceScript: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  humanAttentionRecommended: boolean;
}

interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

function buildNotificationId(sourceScript: string, code: string, details?: Record<string, unknown>): string {
  const parts = [
    sourceScript,
    code,
    details?.module ? String(details.module) : "",
    details?.file ? String(details.file) : "",
    details?.missingArtifact ? String(details.missingArtifact) : "",
    details?.key ? String(details.key) : "",
  ].filter(Boolean);
  return parts.join("::").toLowerCase();
}

function addNotification(
  notifications: RunNotifications,
  sourceScript: string,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  humanAttentionRecommended = false
) {
  const id = buildNotificationId(sourceScript, code, details);
  const now = new Date().toISOString();

  const existingIdx = notifications.entries.findIndex(e => e.id === id);
  if (existingIdx >= 0) {
    const existing = notifications.entries[existingIdx];
    notifications.entries[existingIdx] = {
      ...existing,
      severity,
      message,
      details,
      updatedAt: now,
      humanAttentionRecommended: existing.humanAttentionRecommended || humanAttentionRecommended,
    };
  } else {
    notifications.entries.push({
      id,
      sourceScript,
      severity,
      code,
      message,
      details,
      createdAt: now,
      updatedAt: now,
      humanAttentionRecommended,
    });
  }

  notifications.updatedAt = now;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
    fatal: 4,
  };

  let maxSev: NotificationSeverity = "info";
  for (const entry of notifications.entries) {
    if (severityOrder[entry.severity] > severityOrder[maxSev]) {
      maxSev = entry.severity;
    }
  }
  notifications.highestSeverity = maxSev;
}

function assertNoLocalAbsolutePaths(data: unknown, contextDescription: string): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string") {
    if (
      data.includes("/Users/") ||
      data.includes("/home/") ||
      /^[a-zA-Z]:\\/.test(data) ||
      data.startsWith("file://")
    ) {
      throw new Error(`[Local Path Contamination] Found local absolute path '${data}' in context '${contextDescription}'.`);
    }
    return;
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      assertNoLocalAbsolutePaths(data[i], `${contextDescription}[${i}]`);
    }
    return;
  }
  if (typeof data === "object") {
    for (const key of Object.keys(data as object)) {
      if (key === "absolutePath" || key === "clonePath") continue; // runtime-only local bindings
      assertNoLocalAbsolutePaths((data as any)[key], `${contextDescription}.${key}`);
    }
  }
}

function writeJsonAtomically(filePath: string, data: unknown, contextDescription: string) {
  assertNoLocalAbsolutePaths(data, contextDescription);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function writeNotificationsAtomically(filePath: string, notifications: RunNotifications) {
  assertNoLocalAbsolutePaths(notifications, "run-notifications.json");
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(notifications, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

function loadNotifications(notificationsPath: string, expectedRunId: string, expectedRepoName: string): RunNotifications {
  if (!fs.existsSync(notificationsPath)) {
    throw new Error(`[Fail-Closed] Missing required run-notifications.json at '${notificationsPath}'.`);
  }

  let notifs: RunNotifications;
  try {
    notifs = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Malformed run-notifications.json at '${notificationsPath}': ${err.message}`);
  }

  if (notifs.runId !== expectedRunId || notifs.repoName !== expectedRepoName) {
    throw new Error(`[Fail-Closed] run-notifications.json identity mismatch: expected runId '${expectedRunId}', got '${notifs.runId}'.`);
  }

  return notifs;
}

function toRepoPath(absolutePath: string, repoRoot: string): string {
  const relative = path.relative(repoRoot, absolutePath);
  return relative.replace(/\\/g, "/");
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

// Expression resolution with cycle protection & depth cap
function resolveExpressionValue(
  node: Node,
  visitedDeclarations = new Set<string>(),
  depth = 0,
  maxDepth = 20
): { value: string | null; status: "resolved" | "cycle" | "max_depth" | "unsupported" | "not_found" } {
  if (depth >= maxDepth) {
    return { value: null, status: "max_depth" };
  }

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.getLiteralValue(), status: "resolved" };
  }

  if (Node.isTemplateExpression(node)) {
    let result = node.getHead().getLiteralText();
    for (const span of node.getTemplateSpans()) {
      const exprRes = resolveExpressionValue(span.getExpression(), visitedDeclarations, depth + 1, maxDepth);
      result += exprRes.value !== null ? exprRes.value : `{${span.getExpression().getText()}}`;
      result += span.getLiteral().getLiteralText();
    }
    return { value: result, status: "resolved" };
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
      return { value: `${exprRes.value}.${propName}`, status: "resolved" };
    }
  }

  return { value: null, status: "unsupported" };
}

function main() {
  const runContextPath = path.join(projectRoot, "output", "run-context.json");
  if (!fs.existsSync(runContextPath)) {
    throw new Error("[Fail-Closed] Could not find output/run-context.json. Please run `00-scan-repo` first.");
  }

  const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
  const runId: string = runContext.runId;
  const REPO_NAME: string = runContext.repoName;
  if (!REPO_NAME || !runId) {
    throw new Error("[Fail-Closed] Missing repoName or runId in output/run-context.json");
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

  const clonePath = runContext.clonePath || path.join(projectRoot, "output", "clones", REPO_NAME);
  const tsconfigPath = path.join(clonePath, "functions", "tsconfig.json");

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
    file: string;
    absolutePath: string;
  }> = JSON.parse(fs.readFileSync(filesJsonPath, "utf8"));

  const tsFiles = manifestFiles.filter(f => f.file.endsWith(".ts") && !f.file.endsWith(".d.ts"));

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

  for (const f of tsFiles) {
    if (fs.existsSync(f.absolutePath)) {
      project.addSourceFileAtPath(f.absolutePath);
      runtimeFiles.push({
        file: f,
        base: {
          runId,
          repo: REPO_NAME,
          module: f.module,
          submodule: f.submodule,
          file: f.file,
        },
        absolutePath: f.absolutePath,
      });
    }
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
        const returnType = method.getReturnType().getText();
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
      const returnType = fn.getReturnType().getText();

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
          propertyType: prop.getType().getText(),
          isOptional: prop.hasQuestionToken(),
        });
      }
    }

    // 8. Calls with Full Compiler Provenance
    for (const callExpr of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = callExpr.getExpression();
      const calleeText = expr.getText();
      const line = callExpr.getStartLineNumber();

      // Find enclosing caller context
      let callerName: string | null = null;
      let callerClass: string | null = null;
      let callerDeclarationFile: string | null = null;

      const enclosingMethod = callExpr.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
      const enclosingFn = callExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
      const enclosingClass = callExpr.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

      if (enclosingClass) {
        callerClass = enclosingClass.getName() || "AnonymousClass";
      }
      if (enclosingMethod) {
        callerName = enclosingMethod.getName();
      } else if (enclosingFn) {
        callerName = enclosingFn.getName() || "AnonymousFunction";
      }
      callerDeclarationFile = base.file;

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

            // Check if imported from external or separate module
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
        name: calleeText.split(".").pop() || calleeText,
        arguments: callExpr.getArguments().map(a => a.getText()),
        callerName,
        callerClass,
        callerDeclarationFile,
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
    }

    // 9. Firestore Path Hints
    const fullText = sf.getFullText();
    const docMatches = Array.from(fullText.matchAll(/collection\(['"]([^'"]+)['"]\)|doc\(['"]([^'"]+)['"]\)/g));
    for (const match of docMatches) {
      const pathVal = match[1] || match[2];
      if (pathVal) {
        rawFirestoreHints.push({
          ...base,
          line: 1,
          path: pathVal,
          operation: "access",
        });
      }
    }

    // 10. Permission Candidate Hints (including versioned Oskey permissions)
    const permStringMatches = Array.from(fullText.matchAll(/['"](v\d+\.[a-zA-Z0-9_.:-]+|PERMISSION_[A-Z0-9_]+|SCOPE_[A-Z0-9_]+)['"]/g));
    for (const match of permStringMatches) {
      const permStr = match[1];
      const isVersioned = /^v\d+\.[a-zA-Z0-9_.:-]+$/.test(permStr);

      rawPermissionHints.push({
        ...base,
        line: 1,
        permission: permStr,
        permissionCandidateType: isVersioned ? "versioned_permission" : "permission_constant",
        confidence: isVersioned ? "confirmed" : "candidate",
      });
    }

    // 11. Firestore Triggers & API Contracts
    for (const callExpr of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const text = callExpr.getText();

      if (text.includes("onDocumentCreated") || text.includes("onDocumentUpdated") || text.includes("onDocumentDeleted") || text.includes("onDocumentWritten")) {
        const calleeText = callExpr.getExpression().getText();
        let firestorePath: string | null = null;
        const arg0 = callExpr.getArguments()[0];
        if (arg0) {
          const res = resolveExpressionValue(arg0);
          firestorePath = res.value;
        }

        rawTriggers.push({
          ...base,
          line: callExpr.getStartLineNumber(),
          triggerType: "FIRESTORE_TRIGGER",
          firestorePath: firestorePath || "unknown",
          handlerName: calleeText,
          rawText: text,
          calleeExpression: calleeText,
        });
      }

      if (text.includes("onCall") || text.includes("onRequest")) {
        rawApiContracts.push({
          ...base,
          line: callExpr.getStartLineNumber(),
          contractType: text.includes("onCall") ? "callable" : "http",
          rawText: text,
          value: callExpr.getExpression().getText(),
        });
      }
    }
  }

  // Sort raw outputs deterministically
  const sortFn = (a: any, b: any) => (a.file || "").localeCompare(b.file || "") || (a.line ?? 0) - (b.line ?? 0);

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
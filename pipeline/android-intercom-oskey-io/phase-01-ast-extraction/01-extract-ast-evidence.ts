// **version:** 1.0.0
// **location:** level-5 phase 1
// © Oskey SAS. All rights reserved.
//
// Script 01: AST Evidence Extractor (Phase 1) -- Kotlin/Android port.
// Walks every real .kt file (all 5 modules) and emits raw AST facts: classes,
// objects, interfaces, functions, enums, sealed hierarchies, properties, call
// expressions (with real, tagged-confidence resolution), and import
// dependencies.
//
// Real, load-bearing differences from the TypeScript repos' own copies of
// this script, per the real decisions in governance/roadmap/android-intercom-
// oskey-io/09-task1-decision-tree-sitter-plus-import-aware-resolver-2026-09-
// 08.md and 07-call-graph-resolution-gap-major-finding-2026-09-08.md:
//
// - Uses tree-sitter-kotlin (pure syntax, no type checker) instead of
//   ts-morph's real compiler binding. Confirmed 2026-09-08 that most of what
//   the TS pipeline needed a type-checker for (enum members, generic
//   type-argument descent through heritage clauses) is actually pure
//   syntax-tree walking already -- ported directly, no loss of fidelity for
//   those fact kinds.
// - There is no "Rule A: exact compiler declaration match" available for
//   call-expression resolution (no whole-project symbol table from a real
//   compiler). Every call fact instead gets a real, honestly-tagged
//   resolutionMethod: "resolved_via_import" (the callee's root identifier
//   matches a name this file explicitly imports), "resolved_via_same_
//   package" (matches a top-level declaration in the same package, no
//   import needed -- confirmed real and necessary 2026-09-09, Task 3's own
//   BFS hit exactly this gap), or "unresolved". NEVER "confirmed" the way
//   the TS pipeline's compiler-backed Rule A is -- this is a real, honest
//   capability difference, not hidden behind reused terminology.

import fs from "fs";
import path from "path";
import Parser from "tree-sitter";
// @ts-ignore -- tree-sitter-kotlin ships no type declarations.
import Kotlin from "tree-sitter-kotlin";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  toRepoPath,
  runContextPath,
  requireRepoNameEnv,
} from "./_shared/run-utils";
import {
  findNodesOfType,
  findAllCallExpressions,
  calleeNameOf,
  parseKotlinFile,
  packageAndImportsOf,
  declaredNameOf,
  isSealed,
  modifiersOf,
} from "./_shared/kotlin-ast-utils";

const projectRoot = process.cwd();
const parser = new Parser();
parser.setLanguage(Kotlin);

type FileRecord = { repo: string; module: string; submodule: string | null; path: string; kindHint: string; sizeBytes: number };

type DeclLocation = { file: string; module: string; submodule: string | null };

/** Real generic type-argument text as written at a heritage/type-reference
 * site -- pure syntax (`.text` on the type_arguments node), not a resolved
 * type. Confirmed 2026-09-08 this is exactly how the TS pipeline's own
 * `extendsClassTypeArguments` field worked too (ts-morph's getTypeArguments()
 * there is likewise just reading the literal source text). */
function typeArgumentsTextOf(node: Parser.SyntaxNode): string[] {
  const typeArgs = findNodesOfType(node, "type_arguments")[0];
  if (!typeArgs) return [];
  return findNodesOfType(typeArgs, "type_projection").map(t => t.text);
}

function heritageOf(classOrObjectDecl: Parser.SyntaxNode): { extendsClass: string | null; extendsTypeArguments: string[] } {
  const delegation = findNodesOfType(classOrObjectDecl, "delegation_specifier")[0];
  if (!delegation) return { extendsClass: null, extendsTypeArguments: [] };
  const userType = findNodesOfType(delegation, "user_type")[0];
  const extendsClass = userType ? findNodesOfType(userType, "type_identifier")[0]?.text ?? null : null;
  const extendsTypeArguments = typeArgumentsTextOf(delegation);
  return { extendsClass, extendsTypeArguments };
}

function visibilityOf(mods: string[]): string {
  for (const v of ["private", "internal", "protected", "public"]) if (mods.includes(v)) return v;
  return "public"; // Kotlin's real default when no visibility modifier is present.
}

function main() {
  const REPO_NAME = requireRepoNameEnv();
  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Please run \`00-scan-repo\` first.`);
  }
  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const runDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const factsDir = path.join(runDir, "facts");
  const notificationsPath = path.join(runDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const filesListPath = path.join(factsDir, "files.json");
  if (!fs.existsSync(filesListPath)) {
    throw new Error(`[Fail-Closed] Missing required facts/files.json. Please run \`00-scan-repo\` first.`);
  }
  const filesList: FileRecord[] = JSON.parse(fs.readFileSync(filesListPath, "utf8"));

  // --- Pass 1: parse every file once, build the project-wide (all 5
  // modules) declaration location table this script's own call-resolution
  // logic below depends on. ---
  const parsedByFile = new Map<string, { src: string; tree: Parser.Tree; rec: FileRecord }>();
  const declLocation = new Map<string, DeclLocation>(); // "pkg.Name" -> where it's really declared
  const fileMeta = new Map<string, { pkg: string | null; imports: string[] }>();

  for (const rec of filesList) {
    const absPath = path.join(clonePath, rec.path);
    const { src, tree } = parseKotlinFile(parser, absPath);
    parsedByFile.set(rec.path, { src, tree, rec });
    const meta = packageAndImportsOf(tree);
    fileMeta.set(rec.path, meta);
    if (meta.pkg) {
      for (const type of ["class_declaration", "object_declaration", "function_declaration"]) {
        for (const node of findNodesOfType(tree.rootNode, type)) {
          const name = declaredNameOf(node);
          if (name) declLocation.set(`${meta.pkg}.${name}`, { file: rec.path, module: rec.module, submodule: rec.submodule });
        }
      }
    }
  }

  // --- Pass 2: emit facts per file ---
  const rawImports: any[] = [];
  const rawClasses: any[] = [];
  const rawObjects: any[] = [];
  const rawInterfaces: any[] = [];
  const rawFunctions: any[] = [];
  const rawEnums: any[] = [];
  const rawSealedHierarchies: any[] = [];
  const rawProperties: any[] = [];
  const rawCalls: any[] = [];
  const rawWebrtcSignalingTouchpoints: any[] = [];
  const rawBleGattConstants: any[] = [];
  const rawUsbWireConstants: any[] = [];
  const rawErrors: any[] = [];

  let resolvedViaImport = 0;
  let resolvedViaSamePackage = 0;
  let unresolvedCalls = 0;

  for (const [relPath, { src, tree, rec }] of parsedByFile) {
    const base = { repo: REPO_NAME, module: rec.module, submodule: rec.submodule, file: relPath };
    const meta = fileMeta.get(relPath)!;

    // 0. Parse-error tracking -- real gap found 2026-09-09 building Task 8:
    // config/repos.json's astErrorTolerancePercent (5%, a real measured
    // baseline from Task 1's own bounded test -- see 08-task1-consolidated-
    // checklist-2026-09-08.md) was set but never actually enforced anywhere
    // in this script; it silently had no effect. tree-sitter's own
    // rootNode.hasError() flags any file with at least one real parse
    // error node, matching how the Task 1 bounded test itself measured the
    // 4.4% baseline this tolerance is set from.
    if (tree.rootNode.hasError) {
      rawErrors.push({ ...base, line: 1, message: "Parse error(s) detected (tree-sitter error node present in file)." });
    }

    // 1. Import dependencies -- one real fact PER import statement (not one
    // row per file with a raw string array, which this script originally
    // emitted before Task 8). Real gap found and fixed 2026-09-09: every
    // downstream script that depends on imports_dependency facts (the
    // cross-module/intra-module coupling graphs) needs each import
    // resolved to its real target module/submodule, matching the TS
    // pipeline's own imports_dependency shape exactly (resolvedTargetModule
    // /resolvedTargetSubmodule/importResolutionStatus) -- resolved here via
    // the same project-wide declLocation table Pass 1 already built for
    // call-expression resolution, since Kotlin imports are already
        // fully-qualified names (`com.foo.Bar`), needing no further
    // disambiguation the way a call's bare identifier does.
    //
    // Real, deliberate scope limit: does NOT re-derive the OLD single
    // rawImports.push({..., imports: meta.imports}) shape's per-file raw
    // string list -- meta.imports (used by 00-scan-repo.ts's own BFS) is
    // untouched; this is a second, independent walk over the same file's
    // real import_header nodes purely for this fact's own per-import shape.
    for (const importNode of findNodesOfType(tree.rootNode, "import_header")) {
      const importPath = findNodesOfType(importNode, "identifier")[0]?.text;
      if (!importPath) continue;
      const target = declLocation.get(importPath);
      rawImports.push({
        ...base,
        line: importNode.startPosition.row + 1,
        value: importPath,
        resolvedTargetModule: target?.module ?? null,
        resolvedTargetSubmodule: target?.submodule ?? null,
        importResolutionStatus: target ? "resolved_in_repo" : "external_or_unresolved",
      });
    }

    // 2. Classes AND interfaces -- real, confirmed grammar shape 2026-09-09:
    // tree-sitter-kotlin has NO separate `interface_declaration` node type.
    // `interface Foo {}` parses as a `class_declaration` whose first child
    // is the literal unnamed token `interface` instead of `class` -- an
    // earlier version of this script searched for `interface_declaration`
    // (a node type that does not exist in this grammar) and silently found
    // zero interfaces despite this repo having 10+ real ones; found only by
    // independently grepping real interface declarations and comparing
    // against the extracted count (this project's own standard "92 of 160"-
    // style verification), not by reading the extraction code alone.
    // Heritage + generic type-argument text is pure syntax (confirmed
    // 2026-09-08, no type-checker needed).
    for (const cls of findNodesOfType(tree.rootNode, "class_declaration")) {
      const name = declaredNameOf(cls);
      if (!name) continue;
      const mods = modifiersOf(cls);
      const { extendsClass, extendsTypeArguments } = heritageOf(cls);
      const isInterface = cls.children.some(c => c?.type === "interface");
      const record = {
        ...base,
        line: cls.startPosition.row + 1,
        name,
        package: meta.pkg,
        isSealed: isSealed(cls),
        isData: mods.includes("data"),
        isAbstract: mods.includes("abstract"),
        visibility: visibilityOf(mods),
        extendsClass,
        ...(extendsTypeArguments.length > 0 ? { extendsTypeArguments } : {}),
      };
      if (isInterface) rawInterfaces.push(record);
      else rawClasses.push(record);
    }

    // 3. Objects -- Kotlin's own construct, real analog for sealed
    // subclasses declared as singletons (e.g. `object Home : Screen(...)`,
    // confirmed real and the dominant shape in this repo's own sealed
    // hierarchies, 2026-09-09) and utility singletons (OSKBluetoothUtility
    // etc).
    for (const obj of findNodesOfType(tree.rootNode, "object_declaration")) {
      const name = declaredNameOf(obj);
      if (!name) continue;
      const { extendsClass, extendsTypeArguments } = heritageOf(obj);
      rawObjects.push({
        ...base,
        line: obj.startPosition.row + 1,
        name,
        package: meta.pkg,
        extendsClass,
        ...(extendsTypeArguments.length > 0 ? { extendsTypeArguments } : {}),
      });
    }

    // 5. Functions -- parameters, return type, modifiers, and the single
    // highest-value Kotlin/Compose-specific fact this repo needs: is this
    // function a @Composable. Annotation detection scoped per the real
    // grammar quirk documented in kotlin-ast-utils.ts's annotationNamesIn --
    // checked directly against real code 2026-09-09: a function-level
    // annotation like `@Composable\nfun HomeScreen(...)` parses as a
    // prefix_expression SIBLING immediately before the function_declaration
    // at the same nesting level, not nested inside it, so it's found by
    // scanning the function's own PARENT for annotation nodes whose
    // following sibling is this exact function node.
    for (const fn of findNodesOfType(tree.rootNode, "function_declaration")) {
      const name = declaredNameOf(fn);
      if (!name) continue;
      const mods = modifiersOf(fn);
      const params = findNodesOfType(fn, "parameter").map(p => {
        const pname = findNodesOfType(p, "simple_identifier")[0]?.text ?? null;
        const ptype = findNodesOfType(p, "user_type")[0]?.text ?? findNodesOfType(p, "nullable_type")[0]?.text ?? null;
        return { name: pname, type: ptype };
      });
      const returnTypeNode = fn.namedChildren.find(c => c.type === "user_type" || c.type === "nullable_type");
      const isComposable = isAnnotatedWith(fn, "Composable");
      // owningClass -- real gap found building Task 8: this repo's own
      // methods (findNodesOfType walks the whole file, so a function
      // declared inside a class body is captured identically to a
      // top-level one) had no way to tell the two apart, unlike TS's own
      // pipeline where methods are a distinct evidence type with a
      // `className` field from day one. Reuses the same
      // findEnclosingClassName helper this file already uses for calls --
      // null for a genuine top-level function, which is real and correct,
      // not a missing value.
      const owningClass = findEnclosingClassName(fn);
      rawFunctions.push({
        ...base,
        line: fn.startPosition.row + 1,
        name,
        package: meta.pkg,
        isSuspend: mods.includes("suspend"),
        isOperator: mods.includes("operator"),
        visibility: visibilityOf(mods),
        parameters: params,
        returnType: returnTypeNode?.text ?? null,
        isComposable,
        owningClass,
      });
    }

    // 6. Enums -- full member list AND full constructor-argument values per
    // member. Confirmed 2026-09-08 (real bounded parse test, this repo's
    // own OSKAccesses.kt/OSKTestBenchState.kt) that enum_entry(simple_
    // identifier, value_arguments) parses correctly and completely -- the
    // enum_entry_constructor bug tracked in tree-sitter-kotlin's own issue
    // list did NOT fire on any real enum in this repo. Pure syntax, no
    // type-checker needed, matching the TS pipeline's own `en.getMembers()`
    // (also pure syntax there).
    for (const en of findNodesOfType(tree.rootNode, "enum_class_body")) {
      const classDecl = en.parent;
      if (!classDecl) continue;
      const name = declaredNameOf(classDecl);
      if (!name) continue;
      const members = findNodesOfType(en, "enum_entry").map(entry => {
        const memberName = findNodesOfType(entry, "simple_identifier")[0]?.text ?? entry.text;
        const args = findNodesOfType(entry, "value_arguments")[0];
        return args ? { name: memberName, constructorArgs: args.namedChildren.map(a => a.text) } : { name: memberName };
      });
      rawEnums.push({ ...base, line: classDecl.startPosition.row + 1, name, package: meta.pkg, members });
    }

    // 7. Sealed hierarchies -- the sealed class/interface's real subclasses,
    // found structurally (never a hardcoded name list). V1 scope, honestly
    // stated: only same-file nested subclasses (a class_body containing
    // object_declaration/class_declaration entries with a delegation_
    // specifier extending the sealed type) are captured -- this covers the
    // real, dominant pattern confirmed in this repo (OSKIntercomScreens.kt's
    // `sealed class Screen { object Home : Screen(...) ... }`, 11/11 real
    // subclasses this shape). Kotlin also allows same-PACKAGE, different-
    // FILE sealed subclasses since 1.5 -- not scanned for here; a real,
    // named scope limit, not silently assumed complete. Revisit if a future
    // sealed hierarchy in this repo turns out to use that shape.
    for (const cls of findNodesOfType(tree.rootNode, "class_declaration")) {
      if (!isSealed(cls)) continue;
      const name = declaredNameOf(cls);
      if (!name) continue;
      const classBody = findNodesOfType(cls, "class_body")[0];
      const subclasses: { name: string; kind: string; line: number }[] = [];
      if (classBody) {
        for (const sub of [...findNodesOfType(classBody, "object_declaration"), ...findNodesOfType(classBody, "class_declaration")]) {
          if (sub === cls) continue;
          const { extendsClass } = heritageOf(sub);
          if (extendsClass === name) {
            const subName = declaredNameOf(sub);
            if (subName) subclasses.push({ name: subName, kind: sub.type === "object_declaration" ? "object" : "class", line: sub.startPosition.row + 1 });
          }
        }
      }
      rawSealedHierarchies.push({ ...base, line: cls.startPosition.row + 1, name, package: meta.pkg, subclassesCount: subclasses.length, subclasses });
    }

    // 8. Properties -- explicit declared type where annotated; otherwise
    // the initializer's own real generic type-argument text where present
    // (confirmed 2026-09-08: an unannotated `val x = MutableStateFlow
    // <String?>(null)` still carries its real type argument on the
    // constructor call itself, pure syntax, no inference needed).
    for (const prop of findNodesOfType(tree.rootNode, "property_declaration")) {
      const varDecl = findNodesOfType(prop, "variable_declaration")[0];
      const propName = varDecl ? findNodesOfType(varDecl, "simple_identifier")[0]?.text : null;
      if (!propName) continue;
      const declaredType = varDecl ? findNodesOfType(varDecl, "user_type")[0]?.text ?? findNodesOfType(varDecl, "nullable_type")[0]?.text ?? null : null;
      let initializerTypeArguments: string[] = [];
      if (!declaredType) {
        const initCall = findNodesOfType(prop, "call_expression")[0];
        if (initCall) initializerTypeArguments = typeArgumentsTextOf(initCall);
      }
      const mods = modifiersOf(prop);
      // owningClass -- same real gap and same fix as functions' own
      // owningClass above, applied here for the same reason: a class-body
      // property's identity (for Task 8's stableFactId) isn't safely
      // unique by name alone within one file when more than one class
      // declares a same-named property (e.g. two sibling data classes each
      // with their own `val id: String`) -- null for a genuine top-level
      // property, which is real and correct, not a missing value.
      const owningClass = findEnclosingClassName(prop);
      rawProperties.push({
        ...base,
        line: prop.startPosition.row + 1,
        name: propName,
        package: meta.pkg,
        declaredType,
        ...(initializerTypeArguments.length > 0 ? { initializerTypeArguments } : {}),
        visibility: visibilityOf(mods),
        ...(owningClass ? { owningClass } : {}),
      });
    }

    // 8b. Constructor-promoted properties -- real, significant gap found
    // and fixed 2026-09-09 by Task 6's own independent-count verification:
    // `class Foo(val x: Int)`-style primary-constructor `val`/`var`
    // parameters are REAL class properties in Kotlin (accessible as
    // `this.x`), but confirmed directly that tree-sitter-kotlin parses them
    // as a genuinely different node type (`class_parameter` with a
    // `binding_pattern_kind` child), not `property_declaration` at all --
    // section 8 above was silently missing every one of them. An
    // independent grep-based property count (1428) vs. this script's
    // original output (1145) surfaced the 283-property gap; confirmed the
    // real cause by parsing a minimal real example before fixing, not
    // guessed. This is a common, high-value Kotlin idiom specifically
    // relevant to this repo -- Hilt's `@Inject constructor(private val
    // repository: X)` pattern promotes every injected dependency this way.
    // A plain (non-property) constructor parameter has no `binding_
    // pattern_kind` child and is correctly excluded.
    for (const param of findNodesOfType(tree.rootNode, "class_parameter")) {
      const hasBindingPatternKind = param.children.some(c => c?.type === "binding_pattern_kind");
      if (!hasBindingPatternKind) continue;
      const propName = findNodesOfType(param, "simple_identifier")[0]?.text;
      if (!propName) continue;
      const declaredType = findNodesOfType(param, "user_type")[0]?.text ?? findNodesOfType(param, "nullable_type")[0]?.text ?? null;
      const mods = modifiersOf(param);
      const owningClass = findEnclosingClassName(param);
      rawProperties.push({
        ...base,
        line: param.startPosition.row + 1,
        name: propName,
        package: meta.pkg,
        declaredType,
        visibility: visibilityOf(mods),
        isConstructorPromoted: true,
        owningClass,
      });
    }

    // 9. Call expressions -- real, honestly-tagged resolution. See this
    // file's own header comment for why "confirmed" (compiler-exact) is
    // never used here.
    for (const call of findAllCallExpressions(tree.rootNode)) {
      // Only the outermost call_expression of a nested chain is processed
      // (calleeNameOf already unwraps the nested-call-as-callee shape a
      // trailing lambda produces) -- skip inner call_expression nodes that
      // are themselves just the callee sub-expression of an outer call,
      // which would otherwise be double-counted.
      if (call.parent?.type === "call_expression" && call.parent.child(0) === call) continue;

      const calleeExpr = call.child(0);
      if (!calleeExpr) continue;
      const calleeText = calleeExpr.text;
      const rootIdentifier = calleeText.split(".")[0].split("(")[0];

      const enclosingFn = call.parent ? findEnclosingFunctionName(call) : null;
      const enclosingClass = findEnclosingClassName(call);

      let declarationFile: string | null = null;
      let declarationModule: string | null = null;
      let resolutionMethod: "resolved_via_import" | "resolved_via_same_package" | "unresolved" = "unresolved";

      // Rule 1: the callee's root identifier matches something this file
      // explicitly imports (real, deterministic -- Kotlin has no barrel/
      // re-export indirection the way TypeScript does, confirmed
      // 2026-09-08).
      const matchingImport = meta.imports.find(imp => imp.endsWith(`.${rootIdentifier}`) || imp === rootIdentifier);
      if (matchingImport) {
        const target = declLocation.get(matchingImport);
        if (target) {
          declarationFile = target.file;
          declarationModule = target.module;
          resolutionMethod = "resolved_via_import";
        }
      }
      // Rule 2: same-package, no import needed -- the real gap Task 3's own
      // BFS found and had to fix for (Kotlin same-package visibility).
      if (resolutionMethod === "unresolved" && meta.pkg) {
        const target = declLocation.get(`${meta.pkg}.${rootIdentifier}`);
        if (target) {
          declarationFile = target.file;
          declarationModule = target.module;
          resolutionMethod = "resolved_via_same_package";
        }
      }

      if (resolutionMethod === "resolved_via_import") resolvedViaImport++;
      else if (resolutionMethod === "resolved_via_same_package") resolvedViaSamePackage++;
      else unresolvedCalls++;

      // Real, found gap 2026-09-09 (governance/roadmap/android-intercom-
      // oskey-io/17-model-property-description-gaps-homeButtons-2026-09-09.md):
      // a live PRD review found `homeButtons.contains("contact")`-style
      // checks are the ONLY real place this repo states which string values
      // a config list actually recognizes (a closed set of 3 feature-toggle
      // keys, not an open mapping the way the business request assumed) --
      // and this pipeline never captured a call's own arguments at all,
      // unlike the TS pipeline's own `callExpr.getArguments().map(a =>
      // a.getText())`. Ported directly, same convention (raw source text
      // per argument, no evaluation/parsing of literals) -- ` value_arguments`
      // `.namedChildren` already confirmed real and usable this way by
      // Task 5's own WebRTC touch-point extraction (see below).
      const argsNode = findNodesOfType(call, "value_arguments")[0];
      const callArguments = argsNode ? argsNode.namedChildren.map(a => a.text) : [];

      rawCalls.push({
        ...base,
        line: call.startPosition.row + 1,
        calleeExpression: calleeText,
        callerName: enclosingFn,
        callerClass: enclosingClass,
        declarationFile,
        declarationModule,
        resolutionMethod,
        ...(callArguments.length > 0 ? { arguments: callArguments } : {}),
      });

      // 10. WebRTC signaling touch points -- real, high-value domain fact
      // (Task 5), the analog to the TS pipeline's own proven
      // `firestore_path_touched` win. Real finding 2026-09-09: the WebRTC
      // event NAMES themselves (`OSKSignalingEvents`) are already fully
      // captured by section 6's generic enum extraction -- no separate fact
      // needed for those. What's genuinely new here is the real call SITE
      // where a specific event gets listened for or emitted (`socketIO?.on
      // (...)`/`.emit(...)`), which no other fact type captures.
      //
      // Real precision bug found and fixed 2026-09-09: `.emit` is genuinely
      // ambiguous in this codebase -- Kotlin Coroutines' `Flow.emit()` (an
      // unrelated, purely in-process mechanism) uses the exact same method
      // name as socket.io's real wire-protocol send. An unfiltered version
      // of this check found 67 "emitter" touchpoints; a direct repo-wide
      // grep found exactly ONE real `socketIO?.emit(...)` call anywhere in
      // the codebase -- the other 66 were `signalingState.emit(...)`-style
      // Flow emissions with zero relationship to the wire protocol. `.on`
      // has no such ambiguity (Kotlin Coroutines has no `.on()` method), so
      // it's kept unfiltered. For `.emit` specifically, require the real,
      // observed receiver-naming convention (contains "socket",
      // case-insensitive) -- verified against the actual single real case
      // before trusting it, not a guess.
      const strippedCallee = calleeText.replace(/\?/g, "");
      const receiverBeforeDot = strippedCallee.slice(0, strippedCallee.lastIndexOf("."));
      const isListener = strippedCallee.endsWith(".on");
      const isEmitter = strippedCallee.endsWith(".emit") && receiverBeforeDot.toLowerCase().includes("socket");
      if (isListener || isEmitter) {
        const args = findNodesOfType(call, "value_arguments")[0];
        const firstArg = args?.namedChildren[0];
        rawWebrtcSignalingTouchpoints.push({
          ...base,
          line: call.startPosition.row + 1,
          direction: isListener ? "listener" : "emitter",
          eventExpression: firstArg?.text ?? null,
          callerName: enclosingFn,
          callerClass: enclosingClass,
        });
      }
    }

    // 11. BLE GATT wire-format constants -- real, high-value domain fact
    // (Task 5). Detected structurally: any property whose initializer is a
    // `UUID.fromString("...")` call, never restricted to a hardcoded
    // module/file name (confirmed real and consistent 2026-09-09 across
    // this repo's own kotlin-ble-kit-oskey-io/OSKUUIDTable.kt, 22 real
    // constants). `kind` classified from the real, consistent naming
    // convention found in that file (GATT_SERVICE_*/GATT_CHAR_*/GATT_CCC_*)
    // -- a real, observed convention, not a guess; falls back to "unknown"
    // for a name that doesn't match, so a future differently-named UUID
    // constant is still captured, just unclassified rather than dropped.
    for (const prop of findNodesOfType(tree.rootNode, "property_declaration")) {
      const call = findNodesOfType(prop, "call_expression")[0];
      const calleeText2 = call?.child(0)?.text ?? "";
      if (!call || !calleeText2.endsWith("UUID.fromString")) continue;
      const varDecl = findNodesOfType(prop, "variable_declaration")[0];
      const propName = varDecl ? findNodesOfType(varDecl, "simple_identifier")[0]?.text : null;
      const stringLit = findNodesOfType(call, "string_content")[0];
      if (!propName || !stringLit) continue;
      const kind = propName.startsWith("GATT_SERVICE_")
        ? "service"
        : propName.startsWith("GATT_CHAR_")
        ? "characteristic"
        : propName.startsWith("GATT_CCC_") || propName.includes("DESCRIPTOR")
        ? "descriptor"
        : "unknown";
      rawBleGattConstants.push({ ...base, line: prop.startPosition.row + 1, name: propName, uuidValue: stringLit.text, kind });
    }

    // 12. USB wire-format constants -- real, high-value domain fact (Task
    // 5). Detected structurally: any `const val` whose initializer is a
    // hex_literal, capturing the real inline trailing comment where present
    // -- confirmed 2026-09-09 these comments carry real, otherwise-
    // unrecoverable business meaning (kotlin-usb-oskey-io/OSKCustomUsb
    // IntercomDevice.kt: `DEVICE_OPEN_DOOR_COMMAND: Byte = 0x01 // open
    // door command` -- the comment is the only place "this byte value
    // physically opens the door" is stated at all). A trailing line_comment
    // is a real, confirmed SIBLING node (not nested inside the property
    // declaration), matched here by same-source-line position, not
    // adjacency in the tree alone (a comment on the NEXT declaration's own
    // line must not be misattributed to this one).
    const allTopLevelStatements = findNodesOfType(tree.rootNode, "class_body").flatMap(cb => cb.namedChildren);
    for (const prop of findNodesOfType(tree.rootNode, "property_declaration")) {
      const mods = modifiersOf(prop);
      if (!mods.includes("const")) continue;
      const hexLit = findNodesOfType(prop, "hex_literal")[0];
      if (!hexLit) continue;
      const varDecl = findNodesOfType(prop, "variable_declaration")[0];
      const propName = varDecl ? findNodesOfType(varDecl, "simple_identifier")[0]?.text : null;
      if (!propName) continue;
      const declaredType = varDecl ? findNodesOfType(varDecl, "user_type")[0]?.text ?? null : null;
      const propRow = prop.startPosition.row;
      const trailingComment = allTopLevelStatements.find(s => s.type === "line_comment" && s.startPosition.row === propRow);
      rawUsbWireConstants.push({
        ...base,
        line: prop.startPosition.row + 1,
        name: propName,
        hexValue: hexLit.text,
        declaredType,
        ...(trailingComment ? { comment: trailingComment.text.replace(/^\/\/\s*/, "") } : {}),
      });
    }
  }

  addNotification(
    notifications,
    "01-extract-ast-evidence",
    "info",
    "CALL_RESOLUTION_SUMMARY",
    `Call resolution: ${resolvedViaImport} resolved_via_import, ${resolvedViaSamePackage} resolved_via_same_package, ${unresolvedCalls} unresolved.`,
    { resolvedViaImport, resolvedViaSamePackage, unresolvedCalls }
  );

  // AST error-tolerance gate -- real gap found building Task 8:
  // config/repos.json's astErrorTolerancePercent (5%, set from Task 1's own
  // measured 4.4% baseline) was recorded in config but never actually read
  // or enforced by this script. Matches the TS pipeline's own established
  // convention exactly (same gate, same fail-closed-above-tolerance shape)
  // -- see firebase-oskey-dev's 01-extract-ast-evidence.ts for the
  // precedent this is ported from.
  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, "utf8"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  const astErrorTolerancePercent: number = targetRepoCfg?.astErrorTolerancePercent ?? 0;

  const attemptedFileCount = filesList.length;
  const erroredFileCount = rawErrors.length;
  const errorRatePercent = attemptedFileCount > 0 ? (erroredFileCount / attemptedFileCount) * 100 : 0;

  if (errorRatePercent > astErrorTolerancePercent) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "AST_ERROR_TOLERANCE_EXCEEDED",
      `AST extraction found parse errors in ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), exceeding configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent },
      true
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(
      `[Fail-Closed] AST extraction error rate ${errorRatePercent.toFixed(2)}% exceeds configured tolerance of ${astErrorTolerancePercent}% (${erroredFileCount}/${attemptedFileCount} files).`
    );
  } else if (erroredFileCount > 0) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "warning",
      "AST_ERRORS_WITHIN_TOLERANCE",
      `AST extraction found parse errors in ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), within configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent }
    );
  }

  writeJsonAtomically(path.join(factsDir, "ast-imports.json"), rawImports, "facts/ast-imports.json");
  writeJsonAtomically(path.join(factsDir, "ast-classes.json"), rawClasses, "facts/ast-classes.json");
  writeJsonAtomically(path.join(factsDir, "ast-objects.json"), rawObjects, "facts/ast-objects.json");
  writeJsonAtomically(path.join(factsDir, "ast-interfaces.json"), rawInterfaces, "facts/ast-interfaces.json");
  writeJsonAtomically(path.join(factsDir, "ast-functions.json"), rawFunctions, "facts/ast-functions.json");
  writeJsonAtomically(path.join(factsDir, "ast-enums.json"), rawEnums, "facts/ast-enums.json");
  writeJsonAtomically(path.join(factsDir, "ast-sealed-hierarchies.json"), rawSealedHierarchies, "facts/ast-sealed-hierarchies.json");
  writeJsonAtomically(path.join(factsDir, "ast-properties.json"), rawProperties, "facts/ast-properties.json");
  writeJsonAtomically(path.join(factsDir, "ast-calls.json"), rawCalls, "facts/ast-calls.json");
  writeJsonAtomically(path.join(factsDir, "ast-webrtc-signaling-touchpoints.json"), rawWebrtcSignalingTouchpoints, "facts/ast-webrtc-signaling-touchpoints.json");
  writeJsonAtomically(path.join(factsDir, "ast-ble-gatt-constants.json"), rawBleGattConstants, "facts/ast-ble-gatt-constants.json");
  writeJsonAtomically(path.join(factsDir, "ast-usb-wire-constants.json"), rawUsbWireConstants, "facts/ast-usb-wire-constants.json");
  writeJsonAtomically(path.join(factsDir, "ast-errors.json"), rawErrors, "facts/ast-errors.json");

  // AST evidence manifest -- real gap found building Task 8: 02-build-
  // module-evidence.ts (any repo's copy) fail-closed validates every
  // expected evidence type/record-count against this manifest before
  // trusting any raw fact file; this script never wrote one. Kotlin's own
  // EXPECTED_EVIDENCE_TYPES list below matches this file's own real fact
  // kinds (no exports/typeAliases/methods -- Kotlin has no separate
  // export statement, and there's no methods/functions split, see
  // findFunctions' owningClass fix above for why).
  const astManifest = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    generatedAt: new Date().toISOString(),
    artefacts: [
      { file: "ast-imports.json", evidenceType: "imports", recordCount: rawImports.length, required: true },
      { file: "ast-classes.json", evidenceType: "classes", recordCount: rawClasses.length, required: true },
      { file: "ast-objects.json", evidenceType: "objects", recordCount: rawObjects.length, required: true },
      { file: "ast-interfaces.json", evidenceType: "interfaces", recordCount: rawInterfaces.length, required: true },
      { file: "ast-functions.json", evidenceType: "functions", recordCount: rawFunctions.length, required: true },
      { file: "ast-enums.json", evidenceType: "enums", recordCount: rawEnums.length, required: true },
      { file: "ast-sealed-hierarchies.json", evidenceType: "sealedHierarchies", recordCount: rawSealedHierarchies.length, required: true },
      { file: "ast-properties.json", evidenceType: "properties", recordCount: rawProperties.length, required: true },
      { file: "ast-calls.json", evidenceType: "calls", recordCount: rawCalls.length, required: true },
      { file: "ast-webrtc-signaling-touchpoints.json", evidenceType: "webrtcSignalingTouchpoints", recordCount: rawWebrtcSignalingTouchpoints.length, required: true },
      { file: "ast-ble-gatt-constants.json", evidenceType: "bleGattConstants", recordCount: rawBleGattConstants.length, required: true },
      { file: "ast-usb-wire-constants.json", evidenceType: "usbWireConstants", recordCount: rawUsbWireConstants.length, required: true },
    ],
    errors: {
      file: "ast-errors.json",
      recordCount: rawErrors.length,
    },
  };
  writeJsonAtomically(path.join(factsDir, "ast-evidence-manifest.json"), astManifest, "facts/ast-evidence-manifest.json");

  addNotification(notifications, "01-extract-ast-evidence", "info", "AST_EXTRACTION_COMPLETED", "AST evidence extraction completed successfully.");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Extraction complete for repo [${REPO_NAME}], run [${runId}]:`);
  console.log({
    imports: rawImports.length,
    classes: rawClasses.length,
    objects: rawObjects.length,
    interfaces: rawInterfaces.length,
    functions: rawFunctions.length,
    composableFunctions: rawFunctions.filter(f => f.isComposable).length,
    enums: rawEnums.length,
    sealedHierarchies: rawSealedHierarchies.length,
    properties: rawProperties.length,
    calls: rawCalls.length,
    callResolution: { resolvedViaImport, resolvedViaSamePackage, unresolvedCalls },
    webrtcSignalingTouchpoints: rawWebrtcSignalingTouchpoints.length,
    bleGattConstants: rawBleGattConstants.length,
    usbWireConstants: rawUsbWireConstants.length,
    errors: rawErrors.length,
  });
}

/** Confirmed real grammar shape 2026-09-09, checked directly against this
 * repo's own real code (a first assumption based on an isolated synthetic
 * snippet -- not real code -- turned out wrong, corrected by testing
 * against the real files instead): an annotation like `@Composable` or
 * `@Module` preceding a declaration parses as nested INSIDE that
 * declaration's own `modifiers` node, not as a sibling before it. Scoped to
 * the declaration's DIRECT `modifiers` child only (not a full-subtree
 * search) so a nested inner declaration's own annotations (e.g. a
 * `@Something`-annotated method inside this class) are never mistaken for
 * this declaration's own. */
function isAnnotatedWith(decl: Parser.SyntaxNode, annotationName: string): boolean {
  const modifiers = decl.children.find(c => c?.type === "modifiers");
  if (!modifiers) return false;
  return findNodesOfType(modifiers, "annotation").some(a => a.text === `@${annotationName}` || a.text.startsWith(`@${annotationName}(`));
}

function findEnclosingFunctionName(node: Parser.SyntaxNode): string | null {
  let cur: Parser.SyntaxNode | null = node.parent;
  while (cur) {
    if (cur.type === "function_declaration") return declaredNameOf(cur);
    cur = cur.parent;
  }
  return null;
}

function findEnclosingClassName(node: Parser.SyntaxNode): string | null {
  let cur: Parser.SyntaxNode | null = node.parent;
  while (cur) {
    if (cur.type === "class_declaration" || cur.type === "object_declaration") return declaredNameOf(cur);
    cur = cur.parent;
  }
  return null;
}

main();

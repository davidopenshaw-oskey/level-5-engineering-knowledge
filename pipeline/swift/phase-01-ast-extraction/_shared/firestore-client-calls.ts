// **version:** 1.0.0
// **location:** level-5 phase 1, Swift (shared by every Swift repo)
// © Oskey SAS. All rights reserved.
//
// W4c (governance/roadmap/dynamic-pipeline-architecture/43-build-plan-
// extraction-gaps-from-wiki-handoff-2026-09-26.md): client-side Firestore
// path facts for Swift. Pure function over the swift-extractor's raw
// per-file facts; no I/O, so 01-extract-ast-evidence.ts only wires it in.
//
// Everything is DISCOVERED from the code's own structure, nothing is a
// hand-typed list of enums, cases, paths or wrapper methods:
//
// 1. Path enums: an enum with a computed String property (recorded by the
//    binary as `cases[].computedStrings`) that a sibling property passes to
//    `Firestore.firestore().collection(...)` / `.document(...)`. The ref
//    property's own name (and whether it is a collection or a document)
//    comes from that call. Any other enum with a computed-string switch
//    (a title, a label) is NOT a path enum and keeps no computedStrings.
// 2. Wrapper methods: a method whose body touches `<x>.<refProperty>...` is
//    a method that takes a path enum. The Firestore operation it performs
//    is derived from the SDK calls in its own body (`getDocument`,
//    `addSnapshotListener`, `setData`, `delete`, ...), not from its name.
// 3. Call sites: a call to such a method whose argument is `.someCase(...)`
//    of an enum that method accepts. Anything else that looks like a call
//    to such a method from a subclass is emitted `unresolved` with a
//    reason, never dropped and never guessed.

type EnumCase = {
  name: string;
  rawValue?: string | null;
  associatedValues: string[];
  computedStrings?: { property: string; template?: string | null; rawTemplate?: string | null; reason?: string | null }[];
};
type Decl = { name: string; line: number; extendsTypes: string[]; cases: EnumCase[] };
type Call = { calleeExpression: string; rootIdentifier: string; line: number; callerFunction: string | null; callerType: string | null; arguments: string[] };
type Property = { name: string; line: number; parentType: string | null };
type Fn = { name: string; parentType: string | null };
export type SwiftFileForFirestore = { path: string; classes: Decl[]; enums: Decl[]; properties: Property[]; functions: Fn[]; calls: Call[] };

export type PathEnum = {
  name: string;
  stringProperty: string;
  refProperty: string | null;
  pathKind: "collection" | "document";
};

export type FirestoreClientCall = {
  file: string;
  line: number;
  value: string;
  rawTemplate: string | null;
  side: "client";
  platform: "swift";
  pathKind: "collection" | "document" | null;
  pathKindReason?: string;
  operation: string | null;
  operationReason?: string;
  sdkCall: string | null;
  wrapperMethod: string;
  pathResolutionMethod: "resolved_enum_template" | "unresolved";
  unresolvedReason?: string;
  pathSource: { enum: string; case: string } | null;
  pathArguments: string[];
  callerClass: string | null;
  callerFunction: string | null;
};

// The Firebase iOS SDK's own vocabulary, mapped onto the operation names the
// server-side firestore_path_touched facts use (get / set / update / delete)
// plus `listen`. This is a table of the SDK's API, not of this repo's code.
const SDK_OPERATION: Record<string, string> = {
  getDocument: "get",
  getDocuments: "get",
  addSnapshotListener: "listen",
  addDocument: "set",
  setData: "set",
  updateData: "update",
  delete: "delete",
};

const lastSegment = (callee: string): string => {
  const parts = callee.split(".");
  return parts[parts.length - 1];
};

/** Splits `a: x, b: f(y, z)` on top-level commas only. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      current += ch;
      if (ch === "\\") { current += text[++i] ?? ""; } else if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; current += ch; continue; }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) { parts.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

/** `[label:] .caseName` or `[label:] .caseName(args)` -> { caseName, args }. */
function parseImplicitCase(argument: string): { caseName: string; args: string[] } | null {
  const m = argument.match(/^(?:[A-Za-z_]\w*\s*:\s*)?\.([A-Za-z_]\w*)(?:\(([\s\S]*)\))?$/);
  if (!m) return null;
  return { caseName: m[1], args: m[2] === undefined ? [] : splitTopLevel(m[2]) };
}

export function discoverPathEnums(files: SwiftFileForFirestore[]): Map<string, PathEnum> {
  const pathEnums = new Map<string, PathEnum>();
  for (const file of files) {
    for (const call of file.calls) {
      const m = call.calleeExpression.match(/^Firestore\.firestore\(\)\.(collection|document)$/);
      if (!m || !call.callerType) continue;
      const stringProperty = (call.arguments[0] ?? "").replace(/^self\./, "");
      const enumDecl = files.flatMap(f => f.enums).find(e =>
        e.name === call.callerType && e.cases.some(c => c.computedStrings?.some(s => s.property === stringProperty))
      );
      if (!enumDecl) continue;
      // The ref property is the enum's own property declared at/just before
      // this call (a computed property's body is a few lines under its
      // declaration), other than the string property itself.
      const refProperty = file.properties
        .filter(p => p.parentType === call.callerType && p.name !== stringProperty && p.line <= call.line)
        .sort((a, b) => b.line - a.line)[0]?.name ?? null;
      pathEnums.set(call.callerType, {
        name: call.callerType,
        stringProperty,
        refProperty,
        pathKind: m[1] as "collection" | "document",
      });
    }
  }
  return pathEnums;
}

type Wrapper = { baseClass: string; enums: Set<string>; sdkCalls: Set<string> };

export function extractFirestoreClientCalls(files: SwiftFileForFirestore[]): {
  pathEnums: Map<string, PathEnum>;
  calls: FirestoreClientCall[];
} {
  const pathEnums = discoverPathEnums(files);
  if (pathEnums.size === 0) return { pathEnums, calls: [] };

  const enumByRefProperty = new Map<string, string>();
  for (const e of pathEnums.values()) if (e.refProperty) enumByRefProperty.set(e.refProperty, e.name);
  const enumDecls = new Map<string, Decl>();
  for (const f of files) for (const e of f.enums) if (pathEnums.has(e.name)) enumDecls.set(e.name, e);

  // 2. Wrapper methods: methods whose body touches `<x>.<refProperty>`.
  const wrappers = new Map<string, Wrapper>(); // key: method name
  for (const file of files) {
    for (const call of file.calls) {
      if (!call.callerFunction || !call.callerType) continue;
      const parts = call.calleeExpression.split(".");
      const enumName = parts.slice(1).map(p => enumByRefProperty.get(p)).find(Boolean);
      if (!enumName) continue;
      const w = wrappers.get(call.callerFunction) ?? { baseClass: call.callerType, enums: new Set<string>(), sdkCalls: new Set<string>() };
      w.enums.add(enumName);
      wrappers.set(call.callerFunction, w);
    }
  }
  // SDK calls made anywhere in the same method (same file + class + name).
  for (const file of files) {
    for (const call of file.calls) {
      if (!call.callerFunction) continue;
      const w = wrappers.get(call.callerFunction);
      if (!w || call.callerType !== w.baseClass) continue;
      const verb = lastSegment(call.calleeExpression);
      if (SDK_OPERATION[verb]) w.sdkCalls.add(verb);
    }
  }

  const baseClassOf = (className: string | null): boolean => {
    if (!className) return false;
    return [...wrappers.values()].some(w => w.baseClass === className);
  };
  const subclassesOfBase = new Set<string>();
  for (const f of files) {
    for (const c of f.classes) {
      if (c.extendsTypes.some(t => baseClassOf(t.replace(/<.*$/, "").trim()))) subclassesOfBase.add(c.name);
    }
  }

  // A class that declares its own method of the same name (a subclass
  // overload like `get(_ deviceId:, userId:)`) makes a bare call without an
  // enum-case argument ambiguous: it usually targets that overload, so it is
  // not reported as an unresolved base-wrapper call.
  const declaresMethod = new Set<string>();
  for (const f of files) for (const fn of f.functions) if (fn.parentType) declaresMethod.add(`${fn.parentType}::${fn.name}`);

  // 3. Call sites.
  const results: FirestoreClientCall[] = [];
  for (const file of files) {
    for (const call of file.calls) {
      const method = lastSegment(call.calleeExpression);
      const wrapper = wrappers.get(method);
      if (!wrapper || call.callerType === wrapper.baseClass) continue;

      const sdkCalls = [...wrapper.sdkCalls].sort();
      const operations = new Set(sdkCalls.map(s => SDK_OPERATION[s]));
      const operation = operations.size === 1 ? [...operations][0] : null;
      const operationReason = operation ? undefined
        : operations.size === 0 ? "wrapper body has no recognised SDK call"
        : `wrapper overloads perform different operations (${[...operations].sort().join(", ")})`;
      const common = {
        file: file.path,
        line: call.line,
        side: "client" as const,
        platform: "swift" as const,
        operation,
        ...(operationReason ? { operationReason } : {}),
        sdkCall: sdkCalls.length === 1 ? sdkCalls[0] : sdkCalls.length > 1 ? sdkCalls.join("|") : null,
        wrapperMethod: method,
        callerClass: call.callerType,
        callerFunction: call.callerFunction,
      };

      // Find the argument that is an enum case one of this wrapper's enums has.
      let matched: { caseName: string; args: string[]; candidates: string[] } | null = null;
      for (const argument of call.arguments) {
        const parsed = parseImplicitCase(argument);
        if (!parsed) continue;
        const candidates = [...wrapper.enums].filter(en => enumDecls.get(en)?.cases.some(c => c.name === parsed.caseName));
        if (candidates.length > 0) { matched = { ...parsed, candidates }; break; }
      }

      if (!matched) {
        // Only report a non-matching call when it is plainly a call to the
        // wrapper from a subclass of the wrapper's own class; an unrelated
        // method that merely shares the name is not this fact's business.
        if (!call.callerType || !subclassesOfBase.has(call.callerType)) continue;
        if (declaresMethod.has(`${call.callerType}::${method}`)) continue;
        const pathArgument = call.arguments.find(a => /^(?:[A-Za-z_]\w*\s*:\s*)?[A-Za-z_][\w.]*$/.test(a));
        results.push({
          ...common,
          value: "unresolved",
          rawTemplate: null,
          pathKind: null,
          pathKindReason: "path argument is not a path-enum case",
          pathResolutionMethod: "unresolved",
          unresolvedReason: pathArgument
            ? `the path argument is a variable or expression (\`${pathArgument}\`), not an inline enum case; local bindings are not tracked`
            : "the path argument is not an implicit enum case (`.name(...)`) of any path enum this method accepts",
          pathSource: null,
          pathArguments: pathArgument ? [pathArgument] : [],
        });
        continue;
      }

      // Disambiguate a case name shared by several enums the method accepts:
      // by arity, then, if the templates are still different, give up honestly.
      let candidates = matched.candidates;
      if (candidates.length > 1) {
        const byArity = candidates.filter(en => enumDecls.get(en)!.cases.find(c => c.name === matched!.caseName)!.associatedValues.length === matched!.args.length);
        if (byArity.length >= 1) candidates = byArity;
      }
      const templateOf = (en: string) => enumDecls.get(en)!.cases.find(c => c.name === matched!.caseName)!
        .computedStrings?.find(s => s.property === pathEnums.get(en)!.stringProperty);
      const distinctTemplates = new Set(candidates.map(en => templateOf(en)?.template ?? null));

      if (candidates.length === 1 || distinctTemplates.size === 1) {
        const chosen = candidates[0];
        const cs = templateOf(chosen);
        let pathKind: "collection" | "document" | null = candidates.length === 1 ? pathEnums.get(chosen)!.pathKind : null;
        const template = cs?.template ?? null;
        results.push({
          ...common,
          value: template ? (template.startsWith("/") ? template : `/${template}`) : "unresolved",
          rawTemplate: cs?.rawTemplate ?? null,
          pathKind,
          ...(pathKind ? {} : { pathKindReason: `case '${matched.caseName}' exists in ${candidates.join(" and ")} with the same template and the method accepts both` }),
          pathResolutionMethod: template ? "resolved_enum_template" : "unresolved",
          ...(template ? {} : { unresolvedReason: cs?.reason ?? "path enum case has no template" }),
          pathSource: { enum: chosen, case: matched.caseName },
          pathArguments: matched.args,
        });
      } else {
        results.push({
          ...common,
          value: "unresolved",
          rawTemplate: null,
          pathKind: null,
          pathKindReason: "ambiguous between path enums",
          pathResolutionMethod: "unresolved",
          unresolvedReason: `case '${matched.caseName}' matches ${candidates.join(" and ")} with different templates and the same arity`,
          pathSource: null,
          pathArguments: matched.args,
        });
      }
    }
  }
  results.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { pathEnums, calls: results };
}

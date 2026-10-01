// **version:** 1.0.0
// **location:** level-5 phase 1 (shared)
// © Oskey SAS. All rights reserved.
//
// Member-level call resolution for this repo's Kotlin calls (governance/roadmap/call-resolution-same-repo-edges,
// round 2, Lane K; contract = round 1's AM-1..AM-8 + O-1 as mapped in the Build log entry "[Lane K] K1 CONTRACT
// CONFIRMED / AMENDMENTS", KA-1..KA-10, approved 2026-10-01).
//
// Step 01's legacy resolver looks up only a call's ROOT identifier in a flat `pkg.Name` table, so
// `repository.getAccesses()` is unresolved (the root is a property) and a bare `containsProperty()` resolves to
// whichever same-named function of the package was indexed last. This module resolves the MEMBER that is called,
// from syntax alone (tree-sitter, no type checker), and returns new `member*` fields only. The legacy fields
// (`resolutionMethod`, `declarationFile`, `declarationModule`) stay exactly as step 01 computes them (AM-1): step
// 04's INTRA_REPO_CALL slice and `descriptionFor`'s "-- resolves to:" read them.
//
// Everything is derived from the parsed files: types, their members, supertypes, imports and packages. There is
// no list of type, property, method or scope-function names anywhere in this file.
//
// Resolution, per call (the first rule that applies):
//   bare `m(...)`        local function/value in scope -> unresolved (root_is_local / local_function)
//                        member of the caller's type (its supertypes, then outer types) -> resolved_via_caller_type
//                          (resolved_via_supertype when found on a supertype; O-1)
//                        an in-repo type -> constructor_call (a Kotlin constructor is never a function_declaration
//                          fact; KA-3)
//                        a top-level function, through the file's import or its own package ->
//                          resolved_via_package_function (KA-2)
//   `recv.m(...)`        the receiver is typed by a dotted walk (AM-5): `this` (the caller's type), a typed
//                        parameter (resolved_via_parameter_type, KA-1), a member-scope property of the caller's type
//                        or a top-level property (resolved_via_property_type), or a declared type / object /
//                        companion (resolved_via_type_member); each further segment must be a typed member property.
//                        Then (type, m) is looked up, then its supertypes (O-1), then in-repo extension functions on
//                        the receiver's type name (KA-6): member extensions of the caller's types (`fun T.m()`
//                        declared in a class, also for a bare call inside an extension function on T), then
//                        visible top-level extensions.
// Overloads (KA-5): one candidate resolves; several are narrowed by the call's argument shape (positional count,
// named arguments, trailing lambda, defaults, vararg); otherwise `ambiguous_overload` with the candidate count.
// A bare call inside a lambda whose owning call has a receiver/argument of an in-repo type that also declares `m`
// is `implicit_receiver_ambiguous` (KA-7): Kotlin's lambda receivers take priority over the caller's `this`.
//
// Known artefact (KA-10): in a file with a tree-sitter parse error, error recovery can close a class early, so its
// later methods parse as top-level functions (their function_declaration facts already have owningClass null).
// Calls to them resolve to the right declaration through the package-function rule, labelled as such.

import Parser from "tree-sitter";
import { findNodesOfType } from "./kotlin-ast-utils";

type Node = Parser.SyntaxNode;

export type MemberFileInput = { file: string; module: string; tree: Parser.Tree };

type ImportInfo = { fqn: string; alias: string | null; star: boolean };
type FileCtx = { file: string; module: string; pkg: string | null; imports: ImportInfo[] };
type Param = { name: string | null; typeNode: Node | null; hasDefault: boolean; vararg: boolean };
type FnRec = {
  name: string; file: string; module: string; line: number; params: Param[]; hasBody: boolean; isAbstract: boolean;
  scope: Scope; owner: TypeRec | null; receiverType: string | null; ctx: FileCtx;
};
type PropRec = { name: string; annotation: Node | null; initializer: Node | null; node: Node; ctx: FileCtx };
type TypeRec = { fqn: string; name: string; isInterface: boolean; supers: string[]; node: Node; ctx: FileCtx; fns: Map<string, FnRec[]>; memberExtensions: Map<string, FnRec[]>; props: Map<string, PropRec>; duplicate: boolean };
type Scope = "member" | "local" | "top_level" | "anonymous";

export type MemberIndex = {
  types: Map<string, TypeRec>;
  packageFunctions: Map<string, Map<string, FnRec[]>>;
  packageProperties: Map<string, Map<string, PropRec>>;
  extensions: { receiver: string; name: string; pkg: string | null; fn: FnRec }[];
  ctxByFile: Map<string, FileCtx>;
};

export type MemberCallFields = {
  calleeMember?: string;
  callerMember?: string;
  callerMemberKind?: string;
  memberResolutionStatus?: "resolved" | "unresolved";
  memberResolutionMethod?: string;
  memberDeclarationFile?: string;
  memberDeclarationLine?: number;
  memberDeclarationModule?: string;
  memberDeclarationClass?: string;
  memberDeclarationMethod?: string;
  memberTargetIsProtocolRequirement?: boolean;
  memberUnresolvedReason?: string;
  memberCandidateCount?: number;
};

const TYPE_DECLS = new Set(["class_declaration", "object_declaration"]);
const LOCAL_BODIES = new Set(["function_body", "lambda_literal", "anonymous_initializer", "getter", "setter", "secondary_constructor", "statements", "control_structure_body"]);

/** Same syntax node: compared by position and type, not by JS object identity (node wrappers are not cached). */
function same(a: Node | null | undefined, b: Node | null | undefined): boolean {
  return !!a && !!b && a.startIndex === b.startIndex && a.endIndex === b.endIndex && a.type === b.type;
}
function nameOf(n: Node): string | null {
  return n.namedChildren.find(c => c.type === "type_identifier" || c.type === "simple_identifier")?.text ?? null;
}
function enclosingType(n: Node): Node | null {
  for (let c = n.parent; c; c = c.parent) if (TYPE_DECLS.has(c.type)) return c;
  return null;
}
/** Where a declaration sits: directly in a named type's body (`member`; a companion's body counts as its outer type's),
 * in an anonymous `object :` body, inside a function/lambda/initializer (`local`), or at file level. */
export function declarationScopeOf(n: Node): Scope {
  for (let c = n.parent; c; c = c.parent) {
    if (LOCAL_BODIES.has(c.type)) return "local";
    if (c.type === "class_body" || c.type === "enum_class_body") return c.parent?.type === "object_literal" ? "anonymous" : "member";
    if (c.type === "source_file") return "top_level";
  }
  return "top_level";
}
/** Fully qualified name of the named type `typeNode` (package + enclosing named types + its own name). */
function fqnOfType(typeNode: Node, pkg: string | null): string | null {
  const chain: string[] = [];
  for (let c: Node | null = typeNode; c; c = c.parent) if (TYPE_DECLS.has(c.type)) { const nm = nameOf(c); if (!nm) return null; chain.unshift(nm); }
  return chain.length ? (pkg ? `${pkg}.` : "") + chain.join(".") : null;
}
/** A type reference's base name as written: generic arguments and `?` dropped, nesting kept (`A.B`). Function types: null. */
export function baseTypeText(t: Node | null | undefined): string | null {
  if (!t) return null;
  let u: Node | null = t;
  if (u.type === "nullable_type") u = u.namedChildren.find(c => c.type === "user_type") ?? null;
  if (!u || u.type !== "user_type") return null;
  const ids = findNodesOfType(u, "type_identifier").filter(id => {
    for (let c = id.parent; c && !same(c, u); c = c.parent) if (c.type === "type_arguments") return false;
    return true;
  });
  return ids.length ? ids.map(i => i.text).join(".") : null;
}
function typeRefOf(n: Node): Node | null {
  return n.namedChildren.find(c => c.type === "user_type" || c.type === "nullable_type") ?? null;
}
function paramsOf(fnLike: Node): Param[] {
  const fvp = fnLike.namedChildren.find(c => c.type === "function_value_parameters");
  if (!fvp) return [];
  const out: Param[] = [];
  let vararg = false;
  for (let i = 0; i < fvp.childCount; i++) {
    const c = fvp.child(i)!;
    if (c.type === "parameter_modifiers") { vararg = /\bvararg\b/.test(c.text); continue; }
    if (c.type !== "parameter") continue;
    out.push({
      name: c.namedChildren.find(x => x.type === "simple_identifier")?.text ?? null,
      typeNode: typeRefOf(c), // null for a function-typed parameter
      hasDefault: fvp.child(i + 1)?.type === "=",
      vararg,
    });
    vararg = false;
  }
  return out;
}
function importsOf(tree: Parser.Tree): ImportInfo[] {
  return findNodesOfType(tree.rootNode, "import_header").map(h => ({
    fqn: findNodesOfType(h, "identifier")[0]?.text ?? "",
    alias: h.namedChildren.find(c => c.type === "import_alias")?.namedChildren.find(c => c.type === "type_identifier")?.text ?? null,
    star: h.children.some(c => c.type === "wildcard_import") || /\.\*\s*$/.test(h.text.trim()),
  })).filter(i => i.fqn);
}
function pushTo<K, V>(m: Map<K, V[]>, k: K, v: V) { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); }

// ---------------------------------------------------------------------------------------------------------------
// Index: every named type with its member functions and properties, top-level functions/properties per package,
// and extension functions by receiver type name. Built from all files before any call is resolved.
// ---------------------------------------------------------------------------------------------------------------
export function buildMemberIndex(files: MemberFileInput[]): MemberIndex {
  const index: MemberIndex = { types: new Map(), packageFunctions: new Map(), packageProperties: new Map(), extensions: [], ctxByFile: new Map() };
  const parsed: { tree: Parser.Tree; ctx: FileCtx }[] = [];
  for (const f of files) {
    const ph = findNodesOfType(f.tree.rootNode, "package_header")[0];
    const ctx: FileCtx = { file: f.file, module: f.module, pkg: ph ? findNodesOfType(ph, "identifier")[0]?.text ?? null : null, imports: importsOf(f.tree) };
    index.ctxByFile.set(f.file, ctx);
    parsed.push({ tree: f.tree, ctx });
    for (const t of [...findNodesOfType(f.tree.rootNode, "class_declaration"), ...findNodesOfType(f.tree.rootNode, "object_declaration")]) {
      const nm = nameOf(t);
      const scope = declarationScopeOf(t);
      if (!nm || scope === "local" || scope === "anonymous") continue;
      const fqn = fqnOfType(t, ctx.pkg);
      if (!fqn) continue;
      const supers = t.namedChildren.filter(c => c.type === "delegation_specifier").map(d =>
        baseTypeText(d.namedChildren.find(x => x.type === "user_type") ?? d.namedChildren.find(x => x.type === "constructor_invocation")?.namedChildren.find(x => x.type === "user_type"))
      ).filter((s): s is string => !!s);
      const existing = index.types.get(fqn);
      if (existing) { existing.duplicate = true; continue; }
      index.types.set(fqn, { fqn, name: nm, isInterface: t.children.some(c => c.type === "interface"), supers, node: t, ctx, fns: new Map(), memberExtensions: new Map(), props: new Map(), duplicate: false });
    }
  }
  const ownerOf = (n: Node, ctx: FileCtx): TypeRec | null => {
    const t = enclosingType(n);
    const fqn = t ? fqnOfType(t, ctx.pkg) : null;
    return fqn ? index.types.get(fqn) ?? null : null;
  };
  for (const { tree, ctx } of parsed) {
    for (const fn of findNodesOfType(tree.rootNode, "function_declaration")) {
      const nm = nameOf(fn);
      if (!nm) continue;
      const kids = fn.namedChildren;
      const nameIdx = kids.findIndex(c => c.type === "simple_identifier");
      const recv = kids.slice(0, Math.max(nameIdx, 0)).find(c => c.type === "user_type" || c.type === "nullable_type");
      const scope = declarationScopeOf(fn);
      const rec: FnRec = {
        name: nm, file: ctx.file, module: ctx.module, line: fn.startPosition.row + 1, params: paramsOf(fn),
        hasBody: kids.some(c => c.type === "function_body"),
        isAbstract: (kids.find(c => c.type === "modifiers")?.children ?? []).some(m => /\babstract\b/.test(m.text)),
        scope, owner: scope === "member" ? ownerOf(fn, ctx) : null, receiverType: recv ? baseTypeText(recv) : null, ctx,
      };
      // An extension is looked up by its receiver type, never as a plain member: a top-level one wherever it is
      // visible, a member extension (`fun T.m()` inside a class) only within its declaring type's scope.
      if (rec.receiverType && scope === "top_level") { index.extensions.push({ receiver: rec.receiverType.split(".").pop()!, name: nm, pkg: ctx.pkg, fn: rec }); continue; }
      if (rec.receiverType && scope === "member") { if (rec.owner) pushTo(rec.owner.memberExtensions, nm, rec); continue; }
      if (rec.receiverType) continue;
      if (scope === "member" && rec.owner) pushTo(rec.owner.fns, nm, rec);
      else if (scope === "top_level") { const m = index.packageFunctions.get(ctx.pkg ?? "") ?? new Map(); index.packageFunctions.set(ctx.pkg ?? "", m); pushTo(m, nm, rec); }
    }
    for (const pd of findNodesOfType(tree.rootNode, "property_declaration")) {
      const vd = pd.namedChildren.find(c => c.type === "variable_declaration");
      const nm = vd?.namedChildren.find(c => c.type === "simple_identifier")?.text;
      if (!vd || !nm) continue;
      if (pd.namedChildren.some(c => c.type === "user_type" || c.type === "nullable_type")) continue; // extension property
      const rec: PropRec = { name: nm, annotation: typeRefOf(vd), initializer: pd.namedChildren.find(c => c.type === "call_expression") ?? null, node: pd, ctx };
      const scope = declarationScopeOf(pd);
      if (scope === "member") { const o = ownerOf(pd, ctx); if (o) o.props.set(nm, rec); }
      else if (scope === "top_level") { const m = index.packageProperties.get(ctx.pkg ?? "") ?? new Map(); index.packageProperties.set(ctx.pkg ?? "", m); m.set(nm, rec); }
    }
    for (const cp of findNodesOfType(tree.rootNode, "class_parameter")) {
      if (!cp.children.some(c => c.type === "binding_pattern_kind")) continue; // a plain constructor parameter, not a property
      const nm = cp.namedChildren.find(c => c.type === "simple_identifier")?.text;
      const o = ownerOf(cp, ctx);
      if (nm && o) o.props.set(nm, { name: nm, annotation: typeRefOf(cp), initializer: null, node: cp, ctx });
    }
  }
  return index;
}

// ---------------------------------------------------------------------------------------------------------------
// Type names, property types, member lookup
// ---------------------------------------------------------------------------------------------------------------
const AMBIGUOUS = "\u0000ambiguous";

/** An in-repo type's fqn for a type name as written in `ctx` at `at`, or null (external / unknown). */
function resolveTypeName(index: MemberIndex, text: string | null, ctx: FileCtx, at: Node | null): string | null {
  if (!text) return null;
  const segs = text.split(".");
  let head: string | null = null;
  for (let c = at ? enclosingType(at) : null; c && !head; c = enclosingType(c)) {
    const outer = fqnOfType(c, ctx.pkg);
    if (!outer) continue;
    if (index.types.has(`${outer}.${segs[0]}`)) head = `${outer}.${segs[0]}`;
    else if (outer.split(".").pop() === segs[0]) head = outer;
  }
  if (!head) {
    const imp = ctx.imports.find(i => !i.star && (i.alias ?? i.fqn.split(".").pop()) === segs[0]);
    if (imp) { if (!index.types.has(imp.fqn)) return null; head = imp.fqn; }
  }
  if (!head) { const own = (ctx.pkg ? `${ctx.pkg}.` : "") + segs[0]; if (index.types.has(own)) head = own; }
  if (!head) for (const i of ctx.imports.filter(i => i.star)) { if (index.types.has(`${i.fqn}.${segs[0]}`)) { head = `${i.fqn}.${segs[0]}`; break; } }
  if (!head) return null;
  let fqn = head;
  for (const s of segs.slice(1)) { fqn = `${fqn}.${s}`; if (!index.types.has(fqn)) return null; }
  return index.types.get(fqn)!.duplicate ? AMBIGUOUS : fqn;
}

/** A property's (or typed local's) type: the annotation's base name, else a `T(...)` initializer where T is an in-repo
 * type (AM-3/AM-4). `fqn` is set when the type is an in-repo type. */
function typeOfProperty(index: MemberIndex, p: { annotation: Node | null; initializer: Node | null; node: Node; ctx: FileCtx }): { text: string | null; fqn: string | null; source: "annotation" | "initializer" | null } {
  if (p.annotation) { const text = baseTypeText(p.annotation); return { text, fqn: text ? resolveTypeName(index, text, p.ctx, p.node) : null, source: text ? "annotation" : null }; }
  const callee = p.initializer?.child(0);
  if (callee?.type === "simple_identifier") {
    const fqn = resolveTypeName(index, callee.text, p.ctx, p.node);
    if (fqn) return { text: callee.text, fqn, source: "initializer" };
  }
  return { text: null, fqn: null, source: null };
}

/** `model_property` evidence fields (KA-9): propertyScope, declaredTypeName, declaredTypeSource. */
export function propertyTypeFields(index: MemberIndex, file: string, node: Node): { propertyScope: Scope | "member"; declaredTypeName: string | null; declaredTypeSource: "annotation" | "initializer" | null } {
  const ctx = index.ctxByFile.get(file)!;
  if (node.type === "class_parameter") { const t = typeOfProperty(index, { annotation: typeRefOf(node), initializer: null, node, ctx }); return { propertyScope: "member", declaredTypeName: t.text, declaredTypeSource: t.source }; }
  const vd = node.namedChildren.find(c => c.type === "variable_declaration") ?? null;
  const scope = declarationScopeOf(node);
  const t = typeOfProperty(index, { annotation: vd ? typeRefOf(vd) : null, initializer: node.namedChildren.find(c => c.type === "call_expression") ?? null, node, ctx });
  return { propertyScope: scope === "anonymous" ? "member" : scope, declaredTypeName: t.text, declaredTypeSource: t.source };
}

function supertypesOf(index: MemberIndex, fqn: string): string[] {
  const t = index.types.get(fqn);
  if (!t) return [];
  return t.supers.map(s => resolveTypeName(index, s, t.ctx, t.node)).filter((x): x is string => !!x && x !== AMBIGUOUS);
}
function findFunctions(index: MemberIndex, fqn: string, m: string, seen = new Set<string>()): { fns: FnRec[]; viaSupertype: boolean } {
  if (seen.has(fqn)) return { fns: [], viaSupertype: false };
  seen.add(fqn);
  const own = index.types.get(fqn)?.fns.get(m);
  if (own?.length) return { fns: own, viaSupertype: false };
  for (const s of supertypesOf(index, fqn)) { const r = findFunctions(index, s, m, seen); if (r.fns.length) return { fns: r.fns, viaSupertype: true }; }
  return { fns: [], viaSupertype: false };
}
/** Member extensions named `m` on receiver type `receiverText`, declared in `fqn` or its supertypes. */
function findMemberExtensions(index: MemberIndex, fqn: string, m: string, receiverText: string, seen = new Set<string>()): { fns: FnRec[]; viaSupertype: boolean } {
  if (seen.has(fqn)) return { fns: [], viaSupertype: false };
  seen.add(fqn);
  const recv = receiverText.split(".").pop();
  const own = (index.types.get(fqn)?.memberExtensions.get(m) ?? []).filter(f => f.receiverType?.split(".").pop() === recv);
  if (own.length) return { fns: own, viaSupertype: false };
  for (const s of supertypesOf(index, fqn)) { const r = findMemberExtensions(index, s, m, receiverText, seen); if (r.fns.length) return { fns: r.fns, viaSupertype: true }; }
  return { fns: [], viaSupertype: false };
}
/** The receiver type of the nearest enclosing extension function (`fun T.f() { m() }` gives T), if any. */
function enclosingExtensionReceiver(at: Node): string | null {
  for (let c = at.parent; c; c = c.parent) {
    if (c.type === "class_body") return null;
    if (c.type !== "function_declaration") continue;
    const kids = c.namedChildren, nameIdx = kids.findIndex(k => k.type === "simple_identifier");
    return baseTypeText(kids.slice(0, Math.max(nameIdx, 0)).find(k => k.type === "user_type" || k.type === "nullable_type"));
  }
  return null;
}
function findProperty(index: MemberIndex, fqn: string, m: string, seen = new Set<string>()): PropRec | null {
  if (seen.has(fqn)) return null;
  seen.add(fqn);
  const own = index.types.get(fqn)?.props.get(m);
  if (own) return own;
  for (const s of supertypesOf(index, fqn)) { const r = findProperty(index, s, m, seen); if (r) return r; }
  return null;
}
function visibleExtensions(index: MemberIndex, receiverText: string, m: string, ctx: FileCtx): FnRec[] {
  const recv = receiverText.split(".").pop();
  return index.extensions.filter(e => e.receiver === recv && e.name === m && (e.pkg === ctx.pkg
    || ctx.imports.some(i => (!i.star && i.fqn === (e.pkg ? `${e.pkg}.` : "") + m) || (i.star && i.fqn === e.pkg)))).map(e => e.fn);
}

// Overloads (KA-5): match the call's argument shape against each candidate's parameters.
function argumentShape(call: Node): { positional: number; named: string[]; lambda: boolean } {
  let positional = 0, lambda = false;
  const named: string[] = [];
  for (let c: Node | null = call; c && c.type === "call_expression"; c = c.child(0)) {
    const suffix = c.namedChildren.find(x => x.type === "call_suffix");
    if (!suffix) continue;
    if (suffix.namedChildren.some(x => x.type === "annotated_lambda")) lambda = true;
    const args = suffix.namedChildren.find(x => x.type === "value_arguments");
    for (const a of args?.namedChildren.filter(x => x.type === "value_argument") ?? []) {
      if (a.children[0]?.type === "simple_identifier" && a.children[1]?.type === "=") named.push(a.children[0].text);
      else positional++;
    }
  }
  return { positional, named, lambda };
}
function fits(fn: FnRec, a: { positional: number; named: string[]; lambda: boolean }): boolean {
  const ps = fn.params, filled = ps.map(() => false);
  let i = 0;
  for (let k = 0; k < a.positional; k++) { if (i >= ps.length) return false; filled[i] = true; if (!ps[i].vararg) i++; }
  for (const n of a.named) { const j = ps.findIndex(p => p.name === n); if (j < 0) return false; filled[j] = true; }
  if (a.lambda) { const j = ps.length - 1; if (j < 0 || filled[j]) return false; filled[j] = true; }
  return ps.every((p, j) => filled[j] || p.hasDefault || p.vararg);
}
function pickOverload(fns: FnRec[], call: Node): { fn?: FnRec; candidates?: number } {
  if (fns.length === 1) return { fn: fns[0] };
  const shape = argumentShape(call);
  const ok = fns.filter(f => fits(f, shape));
  return ok.length === 1 ? { fn: ok[0] } : { candidates: fns.length };
}

// ---------------------------------------------------------------------------------------------------------------
// Scopes: locals, parameters, the caller's types
// ---------------------------------------------------------------------------------------------------------------
type LocalHit = { kind: "local" | "local_function" | "lambda" | "parameter" | "function_value"; annotation?: Node | null; node?: Node };

/** What `name` means at `at` before member scope: a local binding, a lambda/loop/catch variable, or a parameter. */
function lookupLocal(name: string, at: Node): LocalHit | null {
  let prev: Node | null = null;
  for (let c: Node | null = at; c; prev = c, c = c.parent) {
    if (c.type === "class_body" || c.type === "enum_class_body") return null;
    if (c.type === "statements" && prev) {
      for (let i = 0; i < c.childCount; i++) {
        const s = c.child(i)!;
        if (same(s, prev)) break; // only bindings declared before the statement holding the call
        if (s.type === "property_declaration") {
          const vd = s.namedChildren.find(x => x.type === "variable_declaration");
          if (vd?.namedChildren.find(x => x.type === "simple_identifier")?.text === name) return { kind: "local" };
          const multi = s.namedChildren.find(x => x.type === "multi_variable_declaration");
          if (multi && findNodesOfType(multi, "simple_identifier").some(x => x.text === name)) return { kind: "local" };
        }
        if (s.type === "function_declaration" && nameOf(s) === name) return { kind: "local_function" };
      }
    }
    if (c.type === "lambda_literal") {
      const lp = c.namedChildren.find(x => x.type === "lambda_parameters");
      if (lp ? findNodesOfType(lp, "simple_identifier").some(x => x.text === name) : name === "it") return { kind: "lambda" };
    }
    if (c.type === "for_statement") {
      const v = c.namedChildren.find(x => x.type === "variable_declaration" || x.type === "multi_variable_declaration");
      if (v && findNodesOfType(v, "simple_identifier").some(x => x.text === name)) return { kind: "lambda" };
    }
    if (c.type === "catch_block" && c.namedChildren.find(x => x.type === "simple_identifier")?.text === name) {
      return { kind: "parameter", annotation: typeRefOf(c), node: c };
    }
    if (c.type === "function_declaration" || c.type === "secondary_constructor" || c.type === "anonymous_function") {
      const p = paramsOf(c).find(x => x.name === name);
      if (p) return p.typeNode ? { kind: "parameter", annotation: p.typeNode, node: c } : { kind: "function_value" };
    }
    if (c.type === "setter" && findNodesOfType(c, "simple_identifier")[0]?.text === name) return { kind: "parameter", annotation: null };
    if (TYPE_DECLS.has(c.type) || c.type === "object_literal") {
      // A plain primary-constructor parameter is visible in property initializers and init blocks.
      const pc = c.namedChildren.find(x => x.type === "primary_constructor");
      const cp = pc?.namedChildren.filter(x => x.type === "class_parameter").find(x =>
        x.namedChildren.find(y => y.type === "simple_identifier")?.text === name && !x.children.some(y => y.type === "binding_pattern_kind"));
      return cp ? { kind: "parameter", annotation: typeRefOf(cp), node: cp } : null;
    }
  }
  return null;
}
/** The named types enclosing `at`, innermost first (an anonymous `object :` is skipped: its members are its
 * supertypes', which are external here, and Kotlin then looks in the enclosing type). */
function callerTypes(index: MemberIndex, at: Node, ctx: FileCtx): string[] {
  const out: string[] = [];
  for (let c = enclosingType(at); c; c = enclosingType(c)) { const f = fqnOfType(c, ctx.pkg); if (f && index.types.has(f)) out.push(f); }
  return out;
}
function enclosingLambdaBeforeMember(at: Node): Node | null {
  for (let c = at.parent; c; c = c.parent) {
    if (c.type === "lambda_literal") return c;
    if (["function_declaration", "class_body", "anonymous_initializer", "getter", "setter"].includes(c.type)) return null;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Callee and receiver
// ---------------------------------------------------------------------------------------------------------------
/** The callee node, unwrapping the nested call_expression a trailing lambda produces (`f(x) { }`). */
function calleeNodeOf(call: Node): Node | null {
  let c: Node = call;
  while (c.type === "call_expression") { const first = c.child(0); if (!first) return null; if (first.type === "call_expression") { c = first; continue; } return first; }
  return null;
}
function navigationParts(n: Node): { receiver: Node | null; member: string | null } {
  const suffix = n.namedChildren.find(x => x.type === "navigation_suffix");
  let receiver: Node | null = n.namedChildren[0] ?? null;
  // `x!!.m()` and `(x).m()`: the receiver is x.
  while (receiver && (receiver.type === "postfix_expression" || receiver.type === "parenthesized_expression") && receiver.namedChildren.length === 1) receiver = receiver.namedChildren[0];
  return { receiver, member: suffix?.namedChildren.find(x => x.type === "simple_identifier")?.text ?? null };
}

type Typed = { fqn: string | null; text: string | null; via: "this" | "parameter" | "property" | "type" } | { reason: string };

function typeOfRoot(index: MemberIndex, name: string, at: Node, ctx: FileCtx): Typed {
  const local = lookupLocal(name, at);
  if (local) {
    if (local.kind === "function_value") return { reason: "root_is_function_value" };
    if (local.kind !== "parameter") return { reason: "root_is_local" };
    const text = baseTypeText(local.annotation);
    if (!text) return { reason: "parameter_untyped" };
    return { fqn: resolveTypeName(index, text, ctx, local.node ?? at), text, via: "parameter" };
  }
  const fromProperty = (p: PropRec): Typed => { const t = typeOfProperty(index, p); return t.text ? { fqn: t.fqn, text: t.text, via: "property" } : { reason: "property_untyped" }; };
  for (const T of callerTypes(index, at, ctx)) { const p = findProperty(index, T, name); if (p) return fromProperty(p); }
  const top = index.packageProperties.get(ctx.pkg ?? "")?.get(name);
  if (top) return fromProperty(top);
  const asType = resolveTypeName(index, name, ctx, at);
  if (asType === AMBIGUOUS) return { reason: "type_ambiguous" };
  if (asType) return { fqn: asType, text: name, via: "type" };
  return { reason: /^[A-Z]/.test(name) ? "root_external_type" : "root_not_property_or_type" };
}
function typeOfReceiver(index: MemberIndex, recv: Node, at: Node, ctx: FileCtx): Typed {
  if (recv.type === "this_expression") {
    const label = recv.namedChildren.find(c => c.type === "type_identifier")?.text;
    if (label) { const f = callerTypes(index, at, ctx).find(x => x.split(".").pop() === label); return f ? { fqn: f, text: label, via: "this" } : { reason: "labelled_this" }; }
    if (enclosingLambdaBeforeMember(at)) return { reason: "this_in_lambda" }; // may be the lambda's receiver
    const T = callerTypes(index, at, ctx)[0];
    return T ? { fqn: T, text: T.split(".").pop()!, via: "this" } : { reason: "no_caller_type" };
  }
  if (recv.type === "super_expression") return { reason: "super" };
  if (recv.type === "simple_identifier") return typeOfRoot(index, recv.text, at, ctx);
  if (recv.type === "navigation_expression") {
    const { receiver, member: seg } = navigationParts(recv);
    if (!receiver || !seg) return { reason: "unsupported_callee" };
    const base = typeOfReceiver(index, receiver, at, ctx);
    if ("reason" in base) return base;
    if (!base.fqn) return { reason: "path_segment_external" };
    if (base.fqn === AMBIGUOUS) return { reason: "type_ambiguous" };
    if (seg === "Companion") return base; // `T.Companion.m()` is `T.m()`
    if (index.types.has(`${base.fqn}.${seg}`)) return { fqn: `${base.fqn}.${seg}`, text: seg, via: base.via === "this" ? "type" : base.via };
    const p = findProperty(index, base.fqn, seg);
    if (!p) return { reason: "path_segment_unknown" };
    const t = typeOfProperty(index, p);
    return t.text ? { fqn: t.fqn, text: t.text, via: base.via } : { reason: "path_segment_untyped" };
  }
  return { reason: "member_of_expression" }; // a call, chain, literal or index expression: not typed from syntax
}

const TIER_BY_ROUTE = { this: "resolved_via_caller_type", parameter: "resolved_via_parameter_type", property: "resolved_via_property_type", type: "resolved_via_type_member" } as const;

function resolvedFields(fn: FnRec, tier: string, receiverClass: string | null): MemberCallFields {
  return {
    memberResolutionStatus: "resolved",
    memberResolutionMethod: tier,
    memberDeclarationFile: fn.file,
    memberDeclarationLine: fn.line,
    memberDeclarationModule: fn.module,
    ...((fn.owner?.name ?? receiverClass) ? { memberDeclarationClass: (fn.owner?.name ?? receiverClass)! } : {}),
    memberDeclarationMethod: fn.name,
    // KA-4: a bodiless interface member or an `abstract` member is a requirement, not a specific implementation.
    memberTargetIsProtocolRequirement: (!!fn.owner?.isInterface && !fn.hasBody) || fn.isAbstract,
  };
}
const unresolved = (reason: string, candidates?: number): MemberCallFields =>
  ({ memberResolutionStatus: "unresolved", memberUnresolvedReason: reason, ...(candidates !== undefined ? { memberCandidateCount: candidates } : {}) });

/** KA-7: a bare call inside a lambda passed to a call whose receiver or an argument is of an in-repo type that also
 * declares `m` might bind to that lambda receiver; not guessed. */
function implicitReceiverConflict(index: MemberIndex, m: string, call: Node, ctx: FileCtx): boolean {
  const own = new Set(callerTypes(index, call, ctx));
  for (let c = call.parent; c && !["function_declaration", "class_body"].includes(c.type); c = c.parent) {
    if (c.type !== "lambda_literal") continue;
    let owner: Node | null = c.parent;
    while (owner && owner.type !== "call_expression") owner = owner.parent;
    if (!owner) continue;
    const candidates: Node[] = [];
    const oc = calleeNodeOf(owner);
    if (oc?.type === "navigation_expression") { const r = navigationParts(oc).receiver; if (r) candidates.push(r); }
    const args = owner.namedChildren.find(x => x.type === "call_suffix")?.namedChildren.find(x => x.type === "value_arguments");
    for (const a of args?.namedChildren ?? []) { const last = a.namedChildren[a.namedChildren.length - 1]; if (last) candidates.push(last); }
    for (const r of candidates) {
      const t = typeOfReceiver(index, r, owner, ctx);
      if (!("reason" in t) && t.fqn && t.fqn !== AMBIGUOUS && !own.has(t.fqn) && findFunctions(index, t.fqn, m).fns.length) return true;
    }
  }
  return false;
}

/** The call's enclosing member (KA-8): function, init block, secondary constructor, or a member/top-level property's
 * initializer, delegate or accessor. Function-local bindings are skipped (AM-6). */
function callerMemberOf(call: Node): { callerMember?: string; callerMemberKind?: string } {
  for (let c = call.parent; c; c = c.parent) {
    if (c.type === "function_declaration") { const n = nameOf(c); return n ? { callerMember: n, callerMemberKind: "function" } : {}; }
    if (c.type === "secondary_constructor") return { callerMember: "constructor", callerMemberKind: "constructor" };
    if (c.type === "anonymous_initializer") return { callerMember: "init", callerMemberKind: "init" };
    if (c.type === "getter" || c.type === "setter") {
      const n = c.parent?.namedChildren.find(y => y.type === "variable_declaration")?.namedChildren.find(y => y.type === "simple_identifier")?.text;
      return n ? { callerMember: n, callerMemberKind: c.type === "getter" ? "property_getter" : "property_setter" } : {};
    }
    if (c.type === "property_declaration" && declarationScopeOf(c) !== "local") {
      const n = c.namedChildren.find(y => y.type === "variable_declaration")?.namedChildren.find(y => y.type === "simple_identifier")?.text;
      return n ? { callerMember: n, callerMemberKind: c.namedChildren.some(y => y.type === "property_delegate") ? "property_delegate" : "property_initializer" } : {};
    }
    if (c.type === "class_parameter") { const n = c.namedChildren.find(y => y.type === "simple_identifier")?.text; return n ? { callerMember: n, callerMemberKind: "constructor_parameter_default" } : {}; }
  }
  return {};
}

/** All member-level fields for one call (step 01's outermost call_expression). */
export function resolveCallMember(index: MemberIndex, file: string, call: Node): MemberCallFields {
  const ctx = index.ctxByFile.get(file)!;
  const caller = callerMemberOf(call);
  const callee = calleeNodeOf(call);
  if (callee?.type === "simple_identifier") {
    const m = callee.text;
    const base = { calleeMember: m, ...caller };
    const local = lookupLocal(m, call);
    if (local) return { ...base, ...unresolved(local.kind === "local_function" ? "local_function" : local.kind === "function_value" ? "root_is_function_value" : "root_is_local") };
    if (enclosingLambdaBeforeMember(call) && implicitReceiverConflict(index, m, call, ctx)) return { ...base, ...unresolved("implicit_receiver_ambiguous") };
    const implicitReceiver = enclosingExtensionReceiver(call);
    for (const T of callerTypes(index, call, ctx)) {
      let r = findFunctions(index, T, m);
      if (!r.fns.length && implicitReceiver) r = findMemberExtensions(index, T, m, implicitReceiver);
      if (!r.fns.length) continue;
      const pick = pickOverload(r.fns, call);
      return pick.fn ? { ...base, ...resolvedFields(pick.fn, r.viaSupertype ? "resolved_via_supertype" : "resolved_via_caller_type", null) } : { ...base, ...unresolved("ambiguous_overload", pick.candidates) };
    }
    const asType = resolveTypeName(index, m, ctx, call);
    if (asType && asType !== AMBIGUOUS) return { ...base, ...unresolved("constructor_call") };
    const imp = ctx.imports.find(i => !i.star && (i.alias ?? i.fqn.split(".").pop()) === m);
    let cands: FnRec[] = [];
    if (imp) cands = index.packageFunctions.get(imp.fqn.split(".").slice(0, -1).join("."))?.get(imp.fqn.split(".").pop()!) ?? [];
    else {
      cands = index.packageFunctions.get(ctx.pkg ?? "")?.get(m) ?? [];
      if (!cands.length) for (const i of ctx.imports.filter(i => i.star)) cands = cands.concat(index.packageFunctions.get(i.fqn)?.get(m) ?? []);
    }
    if (cands.length) {
      const pick = pickOverload(cands, call);
      return pick.fn ? { ...base, ...resolvedFields(pick.fn, "resolved_via_package_function", null) } : { ...base, ...unresolved("ambiguous_overload", pick.candidates) };
    }
    return { ...base, ...unresolved("not_member_of_caller_type") };
  }
  if (callee?.type === "navigation_expression") {
    const { receiver, member: m } = navigationParts(callee);
    if (!receiver || !m) return { ...caller };
    const base = { calleeMember: m, ...caller };
    const rt = typeOfReceiver(index, receiver, call, ctx);
    if ("reason" in rt) return { ...base, ...unresolved(rt.reason) };
    if (rt.fqn === AMBIGUOUS) return { ...base, ...unresolved("type_ambiguous") };
    if (rt.fqn && index.types.has(`${rt.fqn}.${m}`)) return { ...base, ...unresolved("constructor_call") }; // `Outer.Nested(...)`
    if (rt.fqn) {
      const r = findFunctions(index, rt.fqn, m);
      if (r.fns.length) {
        const pick = pickOverload(r.fns, call);
        return pick.fn ? { ...base, ...resolvedFields(pick.fn, r.viaSupertype ? "resolved_via_supertype" : TIER_BY_ROUTE[rt.via], null) } : { ...base, ...unresolved("ambiguous_overload", pick.candidates) };
      }
    }
    if (rt.text) for (const T of callerTypes(index, call, ctx)) {
      const r = findMemberExtensions(index, T, m, rt.text);
      if (!r.fns.length) continue;
      const pick = pickOverload(r.fns, call);
      return pick.fn ? { ...base, ...resolvedFields(pick.fn, TIER_BY_ROUTE[rt.via], null) } : { ...base, ...unresolved("ambiguous_overload", pick.candidates) };
    }
    const ext = rt.text ? visibleExtensions(index, rt.text, m, ctx) : [];
    if (ext.length) {
      const pick = pickOverload(ext, call);
      return pick.fn ? { ...base, ...resolvedFields(pick.fn, TIER_BY_ROUTE[rt.via], pick.fn.receiverType!.split(".").pop()!) } : { ...base, ...unresolved("ambiguous_overload", pick.candidates) };
    }
    return { ...base, ...unresolved(rt.fqn ? "no_member" : "receiver_type_external") };
  }
  return { ...caller };
}

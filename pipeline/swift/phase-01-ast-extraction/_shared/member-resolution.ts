// **version:** 1.0.0
// **location:** level-5 phase 1, shared Swift helper
// © Oskey SAS. All rights reserved.
//
// Member-level call resolution for Swift call facts
// (governance/roadmap/call-resolution-same-repo-edges/01-build-spec-2026-10-01.md,
// Lane S, contract as amended by AM-1..AM-8 + O-1, approved 2026-10-01).
//
// The legacy resolution in 01-extract-ast-evidence.ts looks up a call's ROOT
// identifier in a flat name table and is left exactly as it is (AM-1: its
// fields feed PACKAGE_SYMBOL_USE, the Swift resolved graph and descriptions).
// This module answers a different question -- which member declaration does
// the call reach -- and its answer is written only to NEW `member*` fields:
//
//   1. `a.b.member(...)`: the base path is walked segment by segment. The root
//      is `self` (the caller's type), a member-scope property of the caller's
//      type, or a declared type; every further segment must be a member
//      property with a known type (`declaredTypeName`). Then (type, member).
//   2. bare `member(...)`: (caller type, member).
//   3. `T(...)` / `T.init(...)` for a declared type T: T's explicit `init`s;
//      none means a memberwise/default initializer, which has no declaration
//      to point at (`implicit_initializer`).
//   Every (type, member) lookup checks this repo first, then the imported
//   kits' effectively-public members; on a miss it walks the declared
//   supertypes (O-1), and a hit found that way is labelled
//   `resolved_via_supertype` (a protocol hit is the requirement, not an
//   implementation). Several candidates are narrowed by argument labels;
//   still not exactly one -> `ambiguous_overload`. Nothing is guessed.
//
// Inputs are the swift-extractor's raw per-file facts (schema >= 3.1.0). No
// type, property or method names appear in this file.

export type ParamFact = { label: string; hasDefault: boolean };
export type RawFunction = { name: string; line: number; visibility: string; isStatic: boolean; parentType?: string | null; parameters?: ParamFact[]; scope?: string; extensionVisibility?: string; containerKind?: string };
export type RawProperty = { name: string; line: number; visibility: string; isStatic: boolean; isLet: boolean; parentType?: string | null; annotationBaseType?: string; initializerCalledName?: string; initializerPath?: string[]; scope?: string; extensionVisibility?: string };
export type RawDecl = { name: string; line: number; visibility: string; extendsTypes: string[]; parentType?: string | null };
export type RawCall = {
  calleeExpression: string; rootIdentifier: string; line: number; callerFunction?: string | null; callerType?: string | null; arguments: string[];
  calleeMember?: string; calleeBasePath?: string[]; calleeShape?: string; callerMember?: string; callerMemberKind?: string;
  argumentLabels?: string[]; trailingClosures?: number; rootIsLocal?: boolean;
};
export type RawFile = { path: string; classes: RawDecl[]; structs: RawDecl[]; enums: RawDecl[]; protocols: RawDecl[]; extensions: RawDecl[]; functions: RawFunction[]; properties: RawProperty[]; calls: RawCall[] };

/** One repo's declarations, as seen by a lookup. `imports` are the kits this repo imports (empty for a kit). */
export type RepoInput = { repo: string; files: RawFile[]; moduleOf: (file: string) => string };

type FnDecl = RawFunction & { file: string; module: string; repo: string };
type PropDecl = RawProperty & { file: string; module: string; repo: string };

type Context = {
  repo: string;
  isImport: boolean; // true for a kit seen from an importer: only effectively-public members are visible
  types: Map<string, { visibility: string }[]>;
  funcs: Map<string, FnDecl[]>;
  props: Map<string, PropDecl[]>;
  supertypes: Map<string, string[]>;
};

const key = (type: string, member: string) => `${type}\u0000${member}`;

/** `Foo<Bar>` -> `Foo`, `A.B` -> `B` (the same base-name convention the extractor uses for annotations). */
const baseName = (typeText: string): string => {
  const noGeneric = typeText.split("<")[0].trim();
  const parts = noGeneric.split(".");
  return parts[parts.length - 1];
};

const isEffectivelyPublic = (d: { visibility: string; extensionVisibility?: string }) =>
  d.visibility === "public" || d.visibility === "open"
  || (d.visibility === "internal" && (d.extensionVisibility === "public" || d.extensionVisibility === "open"));

function buildContext(input: RepoInput, isImport: boolean): Context {
  const ctx: Context = { repo: input.repo, isImport, types: new Map(), funcs: new Map(), props: new Map(), supertypes: new Map() };
  for (const f of input.files) {
    const module = input.moduleOf(f.path);
    for (const list of [f.classes, f.structs, f.enums, f.protocols]) {
      for (const d of list) {
        if (!ctx.types.has(d.name)) ctx.types.set(d.name, []);
        ctx.types.get(d.name)!.push({ visibility: d.visibility });
      }
    }
    for (const list of [f.classes, f.structs, f.enums, f.protocols, f.extensions]) {
      for (const d of list) {
        const own = ctx.supertypes.get(d.name) ?? [];
        for (const st of d.extendsTypes) {
          const b = baseName(st);
          if (b && !own.includes(b)) own.push(b);
        }
        ctx.supertypes.set(d.name, own);
      }
    }
    for (const fn of f.functions) {
      if (fn.scope !== "member" || !fn.parentType) continue;
      if (isImport && !isEffectivelyPublic(fn)) continue;
      const k = key(fn.parentType, fn.name);
      if (!ctx.funcs.has(k)) ctx.funcs.set(k, []);
      ctx.funcs.get(k)!.push({ ...fn, file: f.path, module, repo: input.repo });
    }
    for (const p of f.properties) {
      if (p.scope !== "member" || !p.parentType) continue;
      if (isImport && !isEffectivelyPublic(p)) continue;
      const k = key(p.parentType, p.name);
      if (!ctx.props.has(k)) ctx.props.set(k, []);
      ctx.props.get(k)!.push({ ...p, file: f.path, module, repo: input.repo });
    }
  }
  if (isImport) {
    for (const [name, decls] of [...ctx.types.entries()]) {
      const visible = decls.filter(isEffectivelyPublic);
      if (visible.length === 0) ctx.types.delete(name);
      else ctx.types.set(name, visible);
    }
  }
  return ctx;
}

export type MemberFields = Record<string, string | number | boolean | null>;
export type PropertyTypeFields = { declaredTypeName: string | null; declaredTypeSource: "annotation" | "initializer" | null; propertyScope: string | null };

type Lookup<T> = { decls: T[]; viaSupertype: boolean };

export class MemberResolver {
  private readonly self: Context;
  private readonly imports: Context[];
  /** A kit's own view of itself (no visibility filter), used to type a kit property's initializer in its own context. */
  private readonly kitSelf = new Map<string, { self: Context; imports: Context[] }>();
  private readonly typeMemo = new Map<object, { name: string | null; source: "annotation" | "initializer" | null }>();
  private readonly inProgress = new Set<object>();
  readonly stats = { byMethod: new Map<string, number>(), byReason: new Map<string, number>() };

  constructor(selfInput: RepoInput, importInputs: RepoInput[]) {
    this.self = buildContext(selfInput, false);
    this.imports = importInputs.map(i => buildContext(i, true));
    for (const i of importInputs) this.kitSelf.set(i.repo, { self: buildContext(i, false), imports: [] });
  }

  private scopeFor(repo: string): { self: Context; imports: Context[] } {
    return repo === this.self.repo ? { self: this.self, imports: this.imports } : this.kitSelf.get(repo)!;
  }

  private knownType(scope: { self: Context; imports: Context[] }, name: string): boolean {
    return scope.self.types.has(name) || scope.imports.some(c => c.types.has(name));
  }

  private supertypesOf(scope: { self: Context; imports: Context[] }, type: string): string[] {
    const out: string[] = [];
    for (const c of [scope.self, ...scope.imports]) for (const st of c.supertypes.get(type) ?? []) if (!out.includes(st)) out.push(st);
    return out;
  }

  /** (type, member) in `table`: own context first, then imports; on a miss, the declared supertypes, recursively. */
  private lookup<T>(scope: { self: Context; imports: Context[] }, table: "funcs" | "props", type: string, member: string, viaSupertype = false, seen = new Set<string>()): Lookup<T> {
    const own = (scope.self[table].get(key(type, member)) ?? []) as T[];
    if (own.length > 0) return { decls: own, viaSupertype };
    const imported = scope.imports.flatMap(c => (c[table].get(key(type, member)) ?? []) as T[]);
    if (imported.length > 0) return { decls: imported, viaSupertype };
    seen.add(type);
    for (const st of this.supertypesOf(scope, type)) {
      if (seen.has(st)) continue;
      const hit = this.lookup<T>(scope, table, st, member, true, seen);
      if (hit.decls.length > 0) return hit;
    }
    return { decls: [], viaSupertype };
  }

  /** declaredTypeName for a property (AM-3/AM-4): annotation, else an initializer that names a declared type or a typed static path. */
  private propertyType(p: RawProperty & { repo?: string }, repo: string): { name: string | null; source: "annotation" | "initializer" | null } {
    const memo = this.typeMemo.get(p);
    if (memo) return memo;
    if (this.inProgress.has(p)) return { name: null, source: null };
    this.inProgress.add(p);
    const scope = this.scopeFor(repo);
    let result: { name: string | null; source: "annotation" | "initializer" | null } = { name: null, source: null };
    if (p.annotationBaseType) {
      result = { name: p.annotationBaseType, source: "annotation" };
    } else if (p.initializerCalledName) {
      if (this.knownType(scope, p.initializerCalledName)) result = { name: p.initializerCalledName, source: "initializer" };
    } else if (p.initializerPath && p.initializerPath.length >= 2 && this.knownType(scope, p.initializerPath[0])) {
      const walked = this.walk(scope, p.initializerPath[0], p.initializerPath.slice(1));
      if (walked.type) result = { name: walked.type, source: "initializer" };
    }
    this.inProgress.delete(p);
    this.typeMemo.set(p, result);
    return result;
  }

  private walk(scope: { self: Context; imports: Context[] }, start: string, segments: string[]): { type: string | null; reason?: string } {
    let type = start;
    for (const seg of segments) {
      const hit = this.lookup<PropDecl>(scope, "props", type, seg);
      if (hit.decls.length === 0) return { type: null, reason: "path_segment_unknown" };
      if (hit.decls.length > 1) return { type: null, reason: "path_segment_ambiguous" };
      const t = this.propertyType(hit.decls[0], hit.decls[0].repo);
      if (!t.name) return { type: null, reason: "path_segment_untyped" };
      type = t.name;
    }
    return { type };
  }

  propertyFields(p: RawProperty): PropertyTypeFields {
    const t = this.propertyType(p, this.self.repo);
    return { declaredTypeName: t.name, declaredTypeSource: t.source, propertyScope: p.scope ?? null };
  }

  /** Argument labels in order; a defaulted parameter may be skipped; trailing closures fill the remaining parameters. */
  private labelsMatch(call: RawCall, decl: FnDecl): boolean {
    const labels = call.argumentLabels ?? [];
    let trailing = call.trailingClosures ?? 0;
    let j = 0;
    for (const p of decl.parameters ?? []) {
      if (j < labels.length && p.label === labels[j]) j++;
      else if (p.hasDefault) continue;
      else if (j >= labels.length && trailing > 0) trailing--;
      else return false;
    }
    return j === labels.length && trailing === 0;
  }

  private count(map: Map<string, number>, k: string) { map.set(k, (map.get(k) ?? 0) + 1); }

  private unresolved(reason: string, extra: MemberFields = {}): MemberFields {
    this.count(this.stats.byReason, reason);
    return { memberResolutionStatus: "unresolved", memberUnresolvedReason: reason, ...extra };
  }

  private choose(call: RawCall, hit: Lookup<FnDecl>, method: string): MemberFields {
    let decl: FnDecl | undefined = hit.decls.length === 1 ? hit.decls[0] : undefined;
    if (!decl) {
      const matching = hit.decls.filter(d => this.labelsMatch(call, d));
      if (matching.length === 1) decl = matching[0];
    }
    if (!decl) return this.unresolved("ambiguous_overload", { memberCandidateCount: hit.decls.length });
    const resolutionMethod = hit.viaSupertype ? "resolved_via_supertype" : method;
    this.count(this.stats.byMethod, resolutionMethod);
    return {
      memberResolutionStatus: "resolved",
      memberResolutionMethod: resolutionMethod,
      memberDeclarationFile: decl.file,
      memberDeclarationLine: decl.line,
      memberDeclarationModule: decl.module,
      ...(decl.repo !== this.self.repo ? { memberDeclarationRepo: decl.repo } : {}),
      memberDeclarationClass: decl.parentType ?? null,
      memberDeclarationMethod: decl.name,
      // Present on every resolved call (user decision, 2026-10-01): true when
      // the target is a requirement declared in a protocol body, whatever the
      // route (protocol-typed property, supertype walk, ...). A member of
      // `extension SomeProtocol` is a default implementation: false.
      memberTargetIsProtocolRequirement: decl.containerKind === "protocol",
    };
  }

  private constructor_(call: RawCall, type: string): MemberFields {
    // Initializers are not looked up through supertypes: a subclass's
    // inherited init is not reliably the one a call reaches.
    const own = this.self.funcs.get(key(type, "init")) ?? [];
    const inits = own.length > 0 ? own : this.imports.flatMap(c => c.funcs.get(key(type, "init")) ?? []);
    if (inits.length === 0) return this.unresolved("implicit_initializer");
    return this.choose(call, { decls: inits, viaSupertype: false }, "resolved_via_initializer");
  }

  private resolve(call: RawCall): MemberFields {
    const scope = { self: this.self, imports: this.imports };
    const callerType = call.callerType ?? null;
    switch (call.calleeShape) {
      case "implicit_member": return this.unresolved("implicit_member");
      case "member_of_expression": return this.unresolved("member_of_expression");
      case "bare": {
        const root = call.rootIdentifier;
        if (call.rootIsLocal) return this.unresolved("root_is_local");
        if (callerType) {
          const hit = this.lookup<FnDecl>(scope, "funcs", callerType, root);
          if (hit.decls.length > 0) return this.choose(call, hit, "resolved_via_caller_type");
        }
        if (this.knownType(scope, root)) return this.constructor_(call, root);
        return this.unresolved(callerType ? "not_member_of_caller_type" : "no_caller_type");
      }
      case "member_of_path": {
        const path = call.calleeBasePath ?? [];
        const member = call.calleeMember!;
        const root = path[0];
        let type: string;
        let method: string;
        if (root === "super") return this.unresolved("super");
        if (root === "self") {
          if (!callerType) return this.unresolved("no_caller_type");
          type = callerType;
          method = path.length === 1 ? "resolved_via_caller_type" : "resolved_via_property_type";
        } else if (call.rootIsLocal) {
          return this.unresolved("root_is_local");
        } else {
          const prop = callerType ? this.lookup<PropDecl>(scope, "props", callerType, root) : { decls: [], viaSupertype: false };
          if (prop.decls.length > 1) return this.unresolved("property_ambiguous");
          if (prop.decls.length === 1) {
            const t = this.propertyType(prop.decls[0], prop.decls[0].repo);
            if (!t.name) return this.unresolved("property_untyped");
            type = t.name;
            method = "resolved_via_property_type";
          } else if (this.knownType(scope, root)) {
            type = root;
            method = "resolved_via_type_member";
          } else {
            return this.unresolved("root_not_property_or_type");
          }
        }
        const walked = this.walk(scope, type, path.slice(1));
        if (!walked.type) return this.unresolved(walked.reason!);
        if (member === "init") return this.constructor_(call, walked.type);
        const hit = this.lookup<FnDecl>(scope, "funcs", walked.type, member);
        if (hit.decls.length === 0) return this.unresolved("no_member");
        return this.choose(call, hit, method);
      }
      default:
        return this.unresolved("unsupported_callee");
    }
  }

  /** The additive fields for one call fact (AM-2): caller member, callee member, member-level resolution. */
  callFields(call: RawCall): MemberFields {
    return {
      ...(call.calleeMember !== undefined ? { calleeMember: call.calleeMember } : {}),
      ...(call.callerMember !== undefined ? { callerMember: call.callerMember, callerMemberKind: call.callerMemberKind ?? null } : {}),
      ...this.resolve(call),
    };
  }
}

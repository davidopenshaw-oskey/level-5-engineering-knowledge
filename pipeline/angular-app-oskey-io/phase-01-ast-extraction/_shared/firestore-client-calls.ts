// **version:** 1.0.0
// **location:** level-5 phase 1 (angular)
// © Oskey SAS. All rights reserved.
//
// Client-side Firestore path facts (doc 43 W4b). Emits `firestore_client_call`
// raw records in the payload shape shared with the Swift extractor (W4c):
// `value` is a path template with a leading `/` and `{param}` placeholders,
// plus side / platform / pathKind / operation / sdkCall / pathResolutionMethod.
//
// The SDK is external, so what a call does can only come from the imported
// function. That knowledge lives in config (`firestoreClientSdk` on the repo
// entry), not in this code, and a call is recognised by the import specifier
// through the symbol (alias-safe, namespace-import safe), never by text. An SDK
// export that the code uses but the table does not list still produces a fact,
// with `operation: null` and `operationReason: "sdk_export_not_in_table"`, and
// is returned in `gaps`, so a hole in the table is visible.
//
// Paths are resolved statically from the SDK call's own segments: string and
// template literals, string concatenation, variables and class properties with
// an initializer, variables assigned before the use (`let ref = null; ref =
// doc(...)`), and references built from another reference (`doc(collectionRef)`).
// A segment that is the enclosing method's own parameter makes that method a
// generic wrapper: its own fact stays unresolved, and each in-repo caller gets a
// fact with the arguments substituted (`wrapperMethod` set).

import path from "path";
import { Node, SyntaxKind, Project, CallExpression } from "ts-morph";

export type FirestoreSdkExportRole = "path_ref" | "operation" | "query_modifier" | "setup" | "value_helper";

export interface FirestoreSdkConfig {
  moduleSpecifiers: string[];
  exports: Record<string, { role: FirestoreSdkExportRole; pathKind?: "document" | "collection"; operation?: string | null }>;
  consumeOnce?: { moduleSpecifiers: string[]; exports: string[] };
}

type Part = { lit: string } | { expr: string; text: string } | { param: any; name: string };
type StringVal = Part[];
type Segment = StringVal | { rest: any; name: string };

interface SdkCallInfo {
  exportName: string;
  specifier: string;
}

export interface FirestoreClientCallRecord {
  [key: string]: any;
}

export interface FirestoreSdkGap {
  file: string;
  line: number;
  exportName: string;
  specifier: string;
}

export interface FirestoreSdkSkipped {
  file: string;
  line: number;
  exportName: string;
  role: string;
}

const MAX_DEPTH = 12;

function lastIdentifier(text: string): string {
  const cleaned = text.replace(/\(.*$/s, "").replace(/[^A-Za-z0-9_$.]/g, "");
  const tail = cleaned.split(".").pop() || cleaned;
  return tail.replace(/[^A-Za-z0-9_]/g, "") || "value";
}

export function extractFirestoreClientCalls(args: {
  project: Project;
  runtimeFiles: Array<{ base: any; absolutePath: string }>;
  sdk: FirestoreSdkConfig;
  toRepoPath: (abs: string) => string;
}): { records: FirestoreClientCallRecord[]; gaps: FirestoreSdkGap[]; skipped: FirestoreSdkSkipped[] } {
  const { project, runtimeFiles, sdk, toRepoPath } = args;
  const records: FirestoreClientCallRecord[] = [];
  const gaps: FirestoreSdkGap[] = [];
  const skipped: FirestoreSdkSkipped[] = [];
  const sdkSpecifiers = new Set(sdk.moduleSpecifiers);
  const onceSpecifiers = new Set(sdk.consumeOnce?.moduleSpecifiers ?? []);
  const onceExports = new Set(sdk.consumeOnce?.exports ?? []);

  // ---- which imported function is this callee? (symbol-based, alias-safe) ----
  function importedFrom(callee: Node): SdkCallInfo | null {
    let ident: Node | undefined;
    let viaNamespaceMember: string | null = null;
    if (Node.isIdentifier(callee)) ident = callee;
    else if (Node.isPropertyAccessExpression(callee) && Node.isIdentifier(callee.getExpression())) {
      ident = callee.getExpression();
      viaNamespaceMember = callee.getName();
    }
    if (!ident) return null;
    const decl = ident.getSymbol()?.getDeclarations()[0];
    if (!decl) return null;
    if (Node.isImportSpecifier(decl) && viaNamespaceMember === null) {
      const specifier = decl.getImportDeclaration().getModuleSpecifierValue();
      return { exportName: decl.getName(), specifier };
    }
    if (Node.isNamespaceImport(decl) && viaNamespaceMember !== null) {
      const specifier = decl.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)?.getModuleSpecifierValue();
      return specifier ? { exportName: viaNamespaceMember, specifier } : null;
    }
    return null;
  }

  function sdkInfo(call: CallExpression): (SdkCallInfo & { role: string | null }) | null {
    const imp = importedFrom(call.getExpression());
    if (!imp || !sdkSpecifiers.has(imp.specifier)) return null;
    return { ...imp, role: sdk.exports[imp.exportName]?.role ?? null };
  }

  // ---- string values: literals, templates, concatenation, variables ----
  function stringValOf(node: Node, depth = 0): StringVal {
    if (depth > MAX_DEPTH) return [{ expr: lastIdentifier(node.getText()), text: node.getText() }];
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) return [{ lit: node.getLiteralValue() }];
    if (Node.isTemplateExpression(node)) {
      const out: StringVal = [{ lit: node.getHead().getLiteralText() }];
      for (const span of node.getTemplateSpans()) {
        out.push(...stringValOf(span.getExpression(), depth + 1), { lit: span.getLiteral().getLiteralText() });
      }
      return out;
    }
    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === SyntaxKind.PlusToken) {
      return [...stringValOf(node.getLeft(), depth + 1), ...stringValOf(node.getRight(), depth + 1)];
    }
    if (Node.isParenthesizedExpression(node) || Node.isAsExpression(node) || Node.isNonNullExpression(node)) {
      return stringValOf(node.getExpression(), depth + 1);
    }
    if (Node.isIdentifier(node) || Node.isPropertyAccessExpression(node)) {
      const decl = node.getSymbol()?.getDeclarations()[0];
      if (decl && (Node.isVariableDeclaration(decl) || Node.isPropertyDeclaration(decl)) && decl.getInitializer()) {
        return stringValOf(decl.getInitializer()!, depth + 1);
      }
      if (decl && Node.isParameterDeclaration(decl)) return [{ param: decl, name: decl.getName() }];
    }
    return [{ expr: lastIdentifier(node.getText()), text: node.getText() }];
  }

  // ---- a reference expression -> the path_ref call that builds it ----
  function nearestFunctionLike(node: Node): Node | undefined {
    return node.getFirstAncestor(
      a => Node.isArrowFunction(a) || Node.isFunctionExpression(a) || Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a) || Node.isConstructorDeclaration(a)
    );
  }

  function isNullish(init: Node | undefined): boolean {
    return !init || init.getKind() === SyntaxKind.NullKeyword || (Node.isIdentifier(init) && init.getText() === "undefined");
  }

  function pathRefOf(node: Node, consumed: Set<Node>, depth = 0): CallExpression | null {
    if (depth > MAX_DEPTH) return null;
    if (Node.isParenthesizedExpression(node) || Node.isAsExpression(node) || Node.isNonNullExpression(node)) return pathRefOf(node.getExpression(), consumed, depth + 1);
    if (Node.isAwaitExpression(node)) return pathRefOf(node.getExpression(), consumed, depth + 1);
    if (Node.isCallExpression(node)) {
      const info = sdkInfo(node);
      if (info?.role === "path_ref") { consumed.add(node); return node; }
      if (info?.role === "query_modifier") {
        const first = node.getArguments()[0];
        return first ? pathRefOf(first, consumed, depth + 1) : null;
      }
      return null;
    }
    if (Node.isIdentifier(node) || Node.isPropertyAccessExpression(node)) {
      const decl = node.getSymbol()?.getDeclarations()[0];
      if (!decl) return null;
      if ((Node.isVariableDeclaration(decl) || Node.isPropertyDeclaration(decl)) && !isNullish(decl.getInitializer())) {
        return pathRefOf(decl.getInitializer()!, consumed, depth + 1);
      }
      if (Node.isVariableDeclaration(decl) && Node.isIdentifier(node)) {
        // `let ref = null; ... ref = doc(...)`: the nearest assignment before the use, in the same function.
        const useScope = nearestFunctionLike(node);
        const sf = node.getSourceFile();
        let best: Node | null = null;
        let bestStart = -1;
        for (const be of sf.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
          if (be.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) continue;
          const left = be.getLeft();
          if (!Node.isIdentifier(left) || left.getSymbol()?.getDeclarations()[0] !== decl) continue;
          if (be.getStart() >= node.getStart() || nearestFunctionLike(be) !== useScope) continue;
          if (be.getStart() > bestStart) { best = be.getRight(); bestStart = be.getStart(); }
        }
        return best ? pathRefOf(best, consumed, depth + 1) : null;
      }
    }
    return null;
  }

  // ---- the segments a path_ref call contributes (its base reference + its own segment args) ----
  function segmentsOf(ref: CallExpression, consumed: Set<Node>): Segment[] {
    const argNodes = ref.getArguments();
    const first = argNodes[0];
    let base: Segment[] = [];
    let rest = argNodes;
    if (first) {
      const baseRef = pathRefOf(first, consumed);
      if (baseRef) { base = segmentsOf(baseRef, consumed); rest = argNodes.slice(1); }
      else rest = argNodes.slice(1); // first argument is the Firestore instance
    }
    const own: Segment[] = [];
    for (const a of rest) {
      if (Node.isSpreadElement(a)) {
        const inner = a.getExpression();
        const decl = Node.isIdentifier(inner) ? inner.getSymbol()?.getDeclarations()[0] : undefined;
        if (decl && Node.isParameterDeclaration(decl) && decl.isRestParameter()) own.push({ rest: decl, name: decl.getName() });
        else own.push([{ expr: lastIdentifier(inner.getText()), text: `...${inner.getText()}` }]);
      } else own.push(stringValOf(a));
    }
    return [...base, ...own];
  }

  function renderPart(p: Part, sub?: Map<any, StringVal>): { tpl: string; raw: string; unresolvedParam?: string } {
    if ("lit" in p) return { tpl: p.lit, raw: p.lit };
    if ("expr" in p) return { tpl: `{${p.expr}}`, raw: `\${${p.text}}` };
    const replacement = sub?.get(p.param);
    if (replacement) {
      const parts = replacement.map(x => renderPart(x));
      // A substituted value that is itself a bare parameter (a caller that only relays
      // its own parameters) is still not a known path.
      return { tpl: parts.map(x => x.tpl).join(""), raw: parts.map(x => x.raw).join(""), unresolvedParam: parts.find(x => x.unresolvedParam)?.unresolvedParam };
    }
    return { tpl: `{${p.name}}`, raw: `\${${p.name}}`, unresolvedParam: p.name };
  }

  // A parameter is only a *generic wrapper* when it decides where the path starts:
  // a parameter in the first segment (the root collection) or a rest parameter.
  // A parameter deeper in the path (an id, `doc(db, 'users', uid)`) is just a
  // `{placeholder}`, like every other template placeholder.
  function render(segments: Segment[], sub?: Map<any, StringVal[]>): { value: string; raw: string; unresolvedParams: string[] } {
    const tplSegs: string[] = [];
    const rawSegs: string[] = [];
    const unresolved: string[] = [];
    segments.forEach((seg, idx) => {
      if (Array.isArray(seg)) {
        const map = sub ? new Map<any, StringVal>([...sub.entries()].map(([k, v]) => [k, v[0] ?? []])) : undefined;
        const rendered = seg.map(p => renderPart(p, map));
        tplSegs.push(rendered.map(r => r.tpl).join(""));
        rawSegs.push(rendered.map(r => r.raw).join(""));
        // Only a first segment made of nothing but parameter(s) leaves the collection unknown;
        // a literal prefix (`'orders/' + id`) names it and the parameter is just an id placeholder.
        if (idx === 0 && !seg.some(p => "lit" in p && p.lit.length > 0)) rendered.forEach(r => r.unresolvedParam && unresolved.push(r.unresolvedParam));
      } else {
        const values = sub?.get(seg.rest);
        if (values) values.forEach((v, vi) => { const r = v.map(p => renderPart(p)); tplSegs.push(r.map(x => x.tpl).join("")); rawSegs.push(r.map(x => x.raw).join("")); if (idx === 0 && vi === 0 && !v.some(p => "lit" in p && p.lit.length > 0)) r.forEach(x => x.unresolvedParam && unresolved.push(x.unresolvedParam)); });
        else { tplSegs.push(`{${seg.name}}`); rawSegs.push(`\${...${seg.name}}`); unresolved.push(seg.name); }
      }
    });
    const normalise = (s: string[]) => "/" + s.join("/").split("/").filter(Boolean).join("/");
    return { value: normalise(tplSegs), raw: normalise(rawSegs), unresolvedParams: unresolved };
  }

  // ---- context ----
  // The enclosing method / function / function-valued property wins; only when there
  // is none (module-level code, an InjectionToken factory) the OUTERMOST enclosing
  // variable declaration names the caller, never a local `const` inside a method.
  function callerOf(node: Node): { callerClass: string | null; callerFunction: string | null } {
    const cls = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    const member = node.getFirstAncestor(a => Node.isMethodDeclaration(a) || Node.isFunctionDeclaration(a) || Node.isPropertyDeclaration(a)) as any;
    if (member?.getName) return { callerClass: cls?.getName() ?? null, callerFunction: member.getName() };
    const outerVariable = node.getAncestors().filter(a => Node.isVariableDeclaration(a)).pop() as any;
    return { callerClass: cls?.getName() ?? null, callerFunction: outerVariable?.getName ? outerVariable.getName() : null };
  }

  function consumedOnce(call: CallExpression): boolean {
    let parent: Node | undefined = call.getParent();
    while (parent && Node.isParenthesizedExpression(parent)) parent = parent.getParent();
    if (!parent || !Node.isCallExpression(parent) || !parent.getArguments().includes(call)) return false;
    const imp = importedFrom(parent.getExpression());
    return !!imp && onceSpecifiers.has(imp.specifier) && onceExports.has(imp.exportName);
  }

  function findCallers(method: Node): CallExpression[] {
    const out: CallExpression[] = [];
    for (const rf of runtimeFiles) {
      const sf = project.getSourceFile(rf.absolutePath);
      if (!sf) continue;
      for (const c of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        const callee = c.getExpression();
        const decl = (Node.isPropertyAccessExpression(callee) || Node.isIdentifier(callee)) ? callee.getSymbol()?.getDeclarations()[0] : undefined;
        if (decl === method) out.push(c);
      }
    }
    return out;
  }

  // ---- main pass ----
  for (const { base, absolutePath } of runtimeFiles) {
    const sf = project.getSourceFile(absolutePath);
    if (!sf) continue;
    const consumed = new Set<Node>();
    const file = base.path as string;
    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);

    const push = (call: CallExpression, fields: Record<string, any>) => {
      const { callerClass, callerFunction } = callerOf(call);
      records.push({
        runId: base.runId,
        repo: base.repo,
        module: base.module,
        submodule: base.submodule,
        file,
        line: call.getStartLineNumber(),
        side: "client",
        platform: "angular",
        callerClass,
        callerFunction,
        ...fields,
      });
    };

    for (const call of calls) {
      const info = sdkInfo(call);
      if (!info) continue;
      const line = call.getStartLineNumber();
      const spec = sdk.exports[info.exportName];

      if (!spec) {
        // Used through the SDK specifier but absent from the table: visible, never silent.
        gaps.push({ file, line, exportName: info.exportName, specifier: info.specifier });
        const first = call.getArguments()[0];
        const refCall = first ? pathRefOf(first, consumed) : null;
        const rendered = refCall ? render(segmentsOf(refCall, consumed)) : null;
        push(call, {
          value: rendered && rendered.unresolvedParams.length === 0 ? rendered.value : "unresolved",
          rawTemplate: rendered?.raw ?? null,
          pathKind: refCall ? sdk.exports[sdkInfo(refCall)!.exportName]?.pathKind ?? null : null,
          pathKindReason: refCall ? null : "no path reference found for the first argument",
          operation: null,
          operationReason: "sdk_export_not_in_table",
          sdkCall: info.exportName,
          pathResolutionMethod: rendered && rendered.unresolvedParams.length === 0 ? "resolved_sdk_segments" : "unresolved",
          unresolvedReason: rendered ? (rendered.unresolvedParams.length ? `parameter_passthrough: ${rendered.unresolvedParams.join(", ")}` : null) : "the first argument is not a reference built by a table SDK function",
          pathArguments: call.getArguments().map(a => a.getText()),
        });
        continue;
      }

      if (spec.role === "setup" || spec.role === "value_helper") { skipped.push({ file, line, exportName: info.exportName, role: spec.role }); continue; }
      if (spec.role !== "operation") continue; // path_ref / query_modifier are consumed by an operation (or reported below)

      const first = call.getArguments()[0];
      const refCall = first ? pathRefOf(first, consumed) : null;
      const operation = spec.operation ?? null;
      const once = consumedOnce(call);
      const common = { operation, sdkCall: info.exportName, ...(once ? { readMode: "once" } : {}) };

      if (!refCall) {
        push(call, {
          ...common, value: "unresolved", rawTemplate: null, pathKind: null,
          pathKindReason: "no path reference found for the first argument",
          pathResolutionMethod: "unresolved",
          unresolvedReason: `the first argument (\`${first?.getText().slice(0, 60) ?? ""}\`) is not a reference built by a table SDK function that can be followed statically`,
          pathArguments: call.getArguments().map(a => a.getText()),
        });
        continue;
      }

      const refInfo = sdkInfo(refCall)!;
      const segments = segmentsOf(refCall, consumed);
      const rendered = render(segments);
      const pathKind = sdk.exports[refInfo.exportName]?.pathKind ?? null;
      const refArgs = refCall.getArguments().map(a => a.getText());

      if (rendered.unresolvedParams.length === 0) {
        push(call, {
          ...common, value: rendered.value, rawTemplate: rendered.raw, pathKind,
          pathResolutionMethod: "resolved_sdk_segments", pathArguments: refArgs,
        });
        continue;
      }

      // The path depends on the enclosing method's own parameters: a generic wrapper.
      push(call, {
        ...common, value: "unresolved", rawTemplate: rendered.raw, pathKind,
        pathResolutionMethod: "unresolved",
        unresolvedReason: `parameter_passthrough: ${[...new Set(rendered.unresolvedParams)].join(", ")}`,
        pathArguments: refArgs,
      });

      const paramDecls = new Set<any>();
      for (const seg of segments) {
        if (Array.isArray(seg)) seg.forEach(p => "param" in p && paramDecls.add(p.param));
        else paramDecls.add(seg.rest);
      }
      const owners = new Set([...paramDecls].map(p => p.getParent()));
      const wrapper = owners.size === 1 ? [...owners][0] : null;
      if (!wrapper || !Node.isMethodDeclaration(wrapper)) continue;
      const params = wrapper.getParameters();
      for (const caller of findCallers(wrapper)) {
        const callerArgs = caller.getArguments();
        const sub = new Map<any, StringVal[]>();
        params.forEach((prm, idx) => {
          if (!paramDecls.has(prm)) return;
          if (prm.isRestParameter()) sub.set(prm, callerArgs.slice(idx).map(a => stringValOf(a)));
          else if (callerArgs[idx]) sub.set(prm, [stringValOf(callerArgs[idx])]);
        });
        const via = render(segments, sub);
        const callerSf = caller.getSourceFile();
        const callerBase = runtimeFiles.find(r => r.absolutePath === callerSf.getFilePath())?.base;
        if (!callerBase) continue;
        const { callerClass, callerFunction } = callerOf(caller);
        records.push({
          runId: callerBase.runId, repo: callerBase.repo, module: callerBase.module, submodule: callerBase.submodule,
          file: callerBase.path, line: caller.getStartLineNumber(),
          side: "client", platform: "angular", callerClass, callerFunction,
          ...common,
          value: via.unresolvedParams.length === 0 ? via.value : "unresolved",
          rawTemplate: via.raw, pathKind,
          pathResolutionMethod: via.unresolvedParams.length === 0 ? "resolved_via_wrapper_caller" : "unresolved",
          ...(via.unresolvedParams.length ? { unresolvedReason: `parameter_passthrough: ${[...new Set(via.unresolvedParams)].join(", ")}` } : {}),
          wrapperMethod: wrapper.getName(),
          pathArguments: callerArgs.map(a => a.getText()),
        });
      }
    }

    // path_ref calls that no operation consumed: a reference only (e.g. `doc(collection(...)).id`).
    for (const call of calls) {
      const info = sdkInfo(call);
      if (!info || info.role !== "path_ref" || consumed.has(call)) continue;
      const segments = segmentsOf(call, consumed);
      const rendered = render(segments);
      // `doc(collectionRef)` with no id segment: the auto-id form; the path is the collection.
      const isAutoId = info.exportName && sdk.exports[info.exportName]?.pathKind === "document" && call.getArguments().length === 1 && !!pathRefOf(call.getArguments()[0], new Set());
      push(call, {
        value: rendered.unresolvedParams.length === 0 ? rendered.value : "unresolved",
        rawTemplate: rendered.raw,
        pathKind: isAutoId ? "collection" : sdk.exports[info.exportName]?.pathKind ?? null,
        ...(isAutoId ? { pathKindReason: "doc(collectionRef) without an id segment generates an id; the path is the collection" } : {}),
        operation: null,
        operationReason: "reference only: the reference is built but no read, write or listener consumes it here",
        sdkCall: info.exportName,
        pathResolutionMethod: rendered.unresolvedParams.length === 0 ? "resolved_sdk_segments" : "unresolved",
        ...(rendered.unresolvedParams.length ? { unresolvedReason: `parameter_passthrough: ${rendered.unresolvedParams.join(", ")}` } : {}),
        pathArguments: call.getArguments().map(a => a.getText()),
      });
    }
  }

  return { records, gaps, skipped };
}

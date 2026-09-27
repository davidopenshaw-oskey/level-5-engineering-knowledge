// **version:** 1.0.0
// **location:** level-5 phase 1 (firebase)
// © Oskey SAS. All rights reserved.
//
// Pub/Sub publish sites: which argument is the topic, which is the ordering
// key, and what the topic string is (doc 43 W2).
//
// The name `publishMessage` has several signatures in this repo, so the topic
// is never assumed to be argument 0. The mapping is derived from the callee's
// own body, recursively: a method is a "publish method" when its body reaches
// the SDK chain `<x>.topic(<topic>).publishMessage({ data, orderingKey })`,
// directly or through another publish method. For each such method the topic is
// either one of its own parameters (the caller supplies it) or a fixed
// expression inside it (the method decides the topic), and the ordering key is
// likewise a parameter or a fixed expression. No method names are listed.
//
// A topic expression is evaluated statically: literals, templates, local
// constants, calls to a method whose body is a single `return`, and
// `process.env.NAME`. An env variable is read from a table built LITERALLY from
// the repository's own `.env*` files (no interpolation, no deployed runtime):
// missing, overridden with different values, or non-literal all fail closed to
// "unresolved" with a reason. The value is what the repository's committed
// files say, staging-relevant only; the deployed environment is not visible.

import fs from "fs";
import path from "path";
import { Node, SyntaxKind, CallExpression } from "ts-morph";

// ---------------------------------------------------------------------------
// .env table
// ---------------------------------------------------------------------------
type EnvEntry = { value: string; file: string; line: number };
export type EnvLookup =
  | { kind: "found"; entry: EnvEntry }
  | { kind: "conflict"; files: string[] }
  | { kind: "non_literal"; file: string; line: number }
  | { kind: "missing" };

export interface EnvTable {
  lookup(name: string): EnvLookup;
  files: string[];
}

export function loadEnvTable(dirAbs: string, toRepoPath: (abs: string) => string): EnvTable {
  const byName = new Map<string, EnvLookup>();
  const files: string[] = [];
  if (fs.existsSync(dirAbs)) {
    const names = fs.readdirSync(dirAbs).filter(n => /^\.env(\..+)?$/.test(n) && fs.statSync(path.join(dirAbs, n)).isFile()).sort();
    for (const n of names) {
      const abs = path.join(dirAbs, n);
      const repoFile = toRepoPath(abs);
      files.push(repoFile);
      fs.readFileSync(abs, "utf8").split(/\r?\n/).forEach((rawLine, i) => {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) return;
        const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) return;
        let value = m[2];
        const quoted = value.match(/^(['"])(.*)\1\s*(#.*)?$/);
        if (quoted) value = quoted[2];
        else value = value.replace(/\s+#.*$/, "").trim();
        const at = { file: repoFile, line: i + 1 };
        if (/\$\{|\$\(|`/.test(value)) { // interpolation is not evaluated: fail closed
          byName.set(m[1], byName.get(m[1])?.kind === "found" ? { kind: "conflict", files: [(byName.get(m[1]) as any).entry.file, repoFile] } : { kind: "non_literal", ...at });
          return;
        }
        const prior = byName.get(m[1]);
        if (!prior) byName.set(m[1], { kind: "found", entry: { value, ...at } });
        else if (prior.kind === "found" && prior.entry.value !== value) byName.set(m[1], { kind: "conflict", files: [prior.entry.file, repoFile] });
        else if (prior.kind === "non_literal") byName.set(m[1], { kind: "conflict", files: [prior.file, repoFile] });
      });
    }
  }
  return { lookup: name => byName.get(name) ?? { kind: "missing" }, files };
}

// ---------------------------------------------------------------------------
// publish signatures, derived from callee bodies
// ---------------------------------------------------------------------------
type TopicRef = { kind: "param"; index: number; name: string } | { kind: "node"; node: Node };
interface PublishSignature {
  topic: TopicRef;
  orderingParam: number | null;
  orderingNode: Node | null;
}

const MAX_DEPTH = 8;

function declarationOf(callee: Node): Node | undefined {
  const symbol = (Node.isIdentifier(callee) || Node.isPropertyAccessExpression(callee)) ? callee.getSymbol() : undefined;
  const decl = symbol?.getValueDeclaration() ?? symbol?.getDeclarations()[0];
  return decl && (Node.isMethodDeclaration(decl) || Node.isFunctionDeclaration(decl)) ? decl : undefined;
}

// `<x>.topic(<t>).publish(...)` / `.publishMessage(...)`: the SDK's own fluent shape.
export function structuralPublish(call: CallExpression): { topicNode: Node; payloadNode: Node | undefined } | null {
  const expr = call.getExpression();
  if (!Node.isPropertyAccessExpression(expr)) return null;
  const name = expr.getName();
  if (name !== "publish" && name !== "publishMessage") return null;
  const receiver = expr.getExpression();
  if (!Node.isCallExpression(receiver)) return null;
  const inner = receiver.getExpression();
  if (!Node.isPropertyAccessExpression(inner) || inner.getName() !== "topic") return null;
  const topicNode = receiver.getArguments()[0];
  return topicNode ? { topicNode, payloadNode: call.getArguments()[0] } : null;
}

function orderingNodeOfPayload(payload: Node | undefined): Node | null {
  if (!payload || !Node.isObjectLiteralExpression(payload)) return null;
  const prop = payload.getProperty("orderingKey");
  if (!prop) return null;
  if (Node.isPropertyAssignment(prop)) return prop.getInitializer() ?? null;
  if (Node.isShorthandPropertyAssignment(prop)) return prop.getNameNode();
  return null;
}

function paramIndex(node: Node | undefined, decl: Node): number {
  if (!node || !Node.isIdentifier(node)) return -1;
  const d = node.getSymbol()?.getDeclarations()[0];
  if (!d || !Node.isParameterDeclaration(d) || d.getParent() !== decl) return -1;
  return (decl as any).getParameters().indexOf(d);
}

const signatureMemo = new Map<Node, PublishSignature | null>();

function publishSignatureOf(decl: Node, depth = 0, seen = new Set<Node>()): PublishSignature | null {
  if (signatureMemo.has(decl)) return signatureMemo.get(decl)!;
  if (depth > MAX_DEPTH || seen.has(decl)) return null;
  seen.add(decl);
  let result: PublishSignature | null = null;
  for (const c of decl.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    let topicNode: Node | undefined;
    let orderingNode: Node | null = null;
    let orderingParamFromCallee: number | null = null;
    const structural = structuralPublish(c);
    if (structural) {
      topicNode = structural.topicNode;
      orderingNode = orderingNodeOfPayload(structural.payloadNode);
    } else {
      const d2 = declarationOf(c.getExpression());
      if (!d2 || d2 === decl) continue;
      const s2 = publishSignatureOf(d2, depth + 1, seen);
      if (!s2) continue;
      topicNode = s2.topic.kind === "param" ? c.getArguments()[s2.topic.index] : s2.topic.node;
      orderingNode = s2.orderingParam !== null ? c.getArguments()[s2.orderingParam] ?? null : s2.orderingNode;
      orderingParamFromCallee = s2.orderingParam;
    }
    void orderingParamFromCallee;
    if (!topicNode) continue;
    const tIdx = paramIndex(topicNode, decl);
    const oIdx = paramIndex(orderingNode ?? undefined, decl);
    result = {
      topic: tIdx >= 0 ? { kind: "param", index: tIdx, name: (decl as any).getParameters()[tIdx].getName() } : { kind: "node", node: topicNode },
      orderingParam: oIdx >= 0 ? oIdx : null,
      orderingNode: oIdx >= 0 ? null : orderingNode,
    };
    break;
  }
  signatureMemo.set(decl, result);
  return result;
}

// ---------------------------------------------------------------------------
// topic evaluation
// ---------------------------------------------------------------------------
export type TopicStatus = "resolved" | "pass_through_parameter" | "env_var_not_defined" | "env_var_overridden" | "unresolved";
interface Evaluation {
  value: string | null;
  status: TopicStatus;
  reason: string | null;
  source: { kind: "literal" | "env_var" | "parameter" | "constant"; envVar?: string; envFile?: string; envLine?: number } | null;
  via: string[];
}

function whereOf(node: Node, toRepoPath: (abs: string) => string): string {
  return `${toRepoPath(node.getSourceFile().getFilePath())}:${node.getStartLineNumber()}`;
}

function evaluateTopic(
  node: Node,
  env: EnvTable,
  ctx: { toRepoPath: (abs: string) => string; fallback: (n: Node) => { value: string | null; status: string } },
  depth = 0
): Evaluation {
  const fail = (status: TopicStatus, reason: string): Evaluation => ({ value: null, status, reason, source: null, via: [] });
  if (depth > MAX_DEPTH) return fail("unresolved", "resolution depth exceeded");

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.getLiteralValue(), status: "resolved", reason: null, source: { kind: "literal" }, via: [] };
  }
  if (Node.isParenthesizedExpression(node) || Node.isAsExpression(node) || Node.isNonNullExpression(node)) return evaluateTopic(node.getExpression(), env, ctx, depth + 1);

  if (Node.isTemplateExpression(node)) {
    let value = node.getHead().getLiteralText();
    let source: Evaluation["source"] = { kind: "literal" };
    const via: string[] = [];
    for (const span of node.getTemplateSpans()) {
      const inner = evaluateTopic(span.getExpression(), env, ctx, depth + 1);
      if (inner.status !== "resolved" || inner.value === null) return { ...inner, value: null };
      value += inner.value + span.getLiteral().getLiteralText();
      if (inner.source && inner.source.kind !== "literal") source = inner.source;
      via.push(...inner.via);
    }
    return { value, status: "resolved", reason: null, source, via };
  }

  // process.env.NAME / process.env['NAME']
  if ((Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node)) && node.getExpression().getText() === "process.env") {
    const name = Node.isPropertyAccessExpression(node) ? node.getName() : (() => { const a = node.getArgumentExpression(); return a && Node.isStringLiteral(a) ? a.getLiteralValue() : ""; })();
    if (!name) return fail("unresolved", "process.env is indexed by a non-literal");
    const hit = env.lookup(name);
    if (hit.kind === "found") {
      return {
        value: hit.entry.value, status: "resolved", reason: null,
        source: { kind: "env_var", envVar: name, envFile: hit.entry.file, envLine: hit.entry.line },
        via: [`env ${name} = ${hit.entry.value} @ ${hit.entry.file}:${hit.entry.line} (read from the repository's committed .env files, not the deployed runtime environment; staging-relevant only)`],
      };
    }
    if (hit.kind === "conflict") return fail("env_var_overridden", `${name} is defined with different values in ${hit.files.join(" and ")}`);
    if (hit.kind === "non_literal") return fail("unresolved", `${name} at ${hit.file}:${hit.line} is not a literal value`);
    return fail("env_var_not_defined", `${name} is not defined in any .env* file next to the functions root (${env.files.join(", ") || "none found"})`);
  }

  if (Node.isIdentifier(node)) {
    const decl = node.getSymbol()?.getDeclarations()[0];
    if (decl && Node.isParameterDeclaration(decl)) {
      return { value: null, status: "pass_through_parameter", reason: `\`${decl.getName()}\` is a parameter of the enclosing method; the concrete topic is supplied by its callers`, source: { kind: "parameter" }, via: [] };
    }
    if (decl && Node.isVariableDeclaration(decl) && decl.getInitializer()) {
      const inner = evaluateTopic(decl.getInitializer()!, env, ctx, depth + 1);
      return { ...inner, via: [`const ${decl.getName()} @ ${whereOf(decl, ctx.toRepoPath)}`, ...inner.via] };
    }
  }

  if (Node.isCallExpression(node)) {
    const d = declarationOf(node.getExpression());
    if (d) {
      const rets = d.getDescendantsOfKind(SyntaxKind.ReturnStatement);
      if (rets.length === 1 && rets[0].getExpression()) {
        const inner = evaluateTopic(rets[0].getExpression()!, env, ctx, depth + 1);
        return { ...inner, via: [`${(d as any).getName?.() ?? "method"} @ ${whereOf(d, ctx.toRepoPath)}`, ...inner.via] };
      }
      return fail("unresolved", `the called method has ${rets.length} return statements; only a single-return method is followed`);
    }
  }

  // enum members, property assignments and the like: the extractor's existing resolver
  const legacy = ctx.fallback(node);
  if (legacy.value !== null && legacy.status === "resolved") {
    return { value: legacy.value, status: "resolved", reason: null, source: { kind: "constant" }, via: [] };
  }
  return fail("unresolved", `the topic expression (\`${node.getText().slice(0, 60)}\`) cannot be evaluated statically`);
}

// ---------------------------------------------------------------------------
// a publish site
// ---------------------------------------------------------------------------
export interface PublishAnalysis {
  topicName: string | null;
  topicNameStatus: TopicStatus;
  topicNameReason: string | null;
  topicSource: Evaluation["source"];
  publishRole: "origin" | "via_wrapper" | "plumbing";
  wrapperMethod?: string;
  wrapperDeclarationFile?: string;
  orderingKeyExpression: string | null;
  topicResolvedVia: string[];
}

export function analysePublishSite(
  call: CallExpression,
  env: EnvTable,
  ctx: { toRepoPath: (abs: string) => string; fallback: (n: Node) => { value: string | null; status: string } }
): PublishAnalysis | null {
  let topicNode: Node | undefined;
  let orderingText: string | null = null;
  let viaWrapper: { name: string; file: string; step: string } | null = null;

  const structural = structuralPublish(call);
  if (structural) {
    topicNode = structural.topicNode;
    orderingText = orderingNodeOfPayload(structural.payloadNode)?.getText() ?? null;
  } else {
    const d = declarationOf(call.getExpression());
    const sig = d ? publishSignatureOf(d) : null;
    if (!d || !sig) return null; // not a publish method by its body: leave the fact as it was
    if (sig.topic.kind === "param") topicNode = call.getArguments()[sig.topic.index];
    else {
      topicNode = sig.topic.node;
      viaWrapper = { name: (d as any).getName?.() ?? "method", file: ctx.toRepoPath(d.getSourceFile().getFilePath()), step: `${(d as any).getName?.() ?? "method"} @ ${whereOf(d, ctx.toRepoPath)}` };
    }
    orderingText = sig.orderingParam !== null ? call.getArguments()[sig.orderingParam]?.getText() ?? null : sig.orderingNode?.getText() ?? null;
  }
  if (!topicNode) return null;

  const evaluation = evaluateTopic(topicNode, env, ctx);
  const role: PublishAnalysis["publishRole"] = evaluation.status === "pass_through_parameter" ? "plumbing" : viaWrapper ? "via_wrapper" : "origin";
  return {
    topicName: evaluation.value,
    topicNameStatus: evaluation.status,
    topicNameReason: evaluation.reason,
    topicSource: evaluation.source,
    publishRole: role,
    ...(viaWrapper ? { wrapperMethod: viaWrapper.name, wrapperDeclarationFile: viaWrapper.file } : {}),
    orderingKeyExpression: orderingText,
    topicResolvedVia: [...(viaWrapper ? [viaWrapper.step] : []), ...evaluation.via],
  };
}

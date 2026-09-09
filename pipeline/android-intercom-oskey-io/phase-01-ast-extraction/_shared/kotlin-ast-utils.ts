// **version:** 1.0.0
// **location:** level-5 phase 1 (shared)
// © Oskey SAS. All rights reserved.
//
// Shared tree-sitter-kotlin AST traversal helpers for this repo's own
// pipeline scripts (00 onward). Extracted from 00-scan-repo.ts 2026-09-09
// once 01-extract-ast-evidence.ts needed the same primitives -- real
// tree-sitter-kotlin node shapes below were all confirmed directly against
// this repo's actual code (2026-09-08/09), not assumed from grammar docs.
//
// SCOPE NOTE: scoped to this repo's own pipeline only, per the multi-repo
// architecture decision (each repo owns its own independent pipeline).

import fs from "fs";
import Parser from "tree-sitter";

export function findNodesOfType(node: Parser.SyntaxNode, type: string, results: Parser.SyntaxNode[] = []): Parser.SyntaxNode[] {
  if (node.type === type) results.push(node);
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) findNodesOfType(child, type, results);
  }
  return results;
}

export function findAllCallExpressions(node: Parser.SyntaxNode, results: Parser.SyntaxNode[] = []): Parser.SyntaxNode[] {
  if (node.type === "call_expression") results.push(node);
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) findAllCallExpressions(child, results);
  }
  return results;
}

/** Returns a call_expression's real callee name, unwrapping the nested
 * call_expression-as-callee shape a trailing lambda produces (e.g.
 * `composable(x) { ... }` parses as call_expression(call_expression(callee,
 * call_suffix(args)), call_suffix(annotated_lambda))). */
export function calleeNameOf(callExpr: Parser.SyntaxNode): string | null {
  let node: Parser.SyntaxNode | null = callExpr;
  while (node && node.type === "call_expression") {
    const first = node.child(0);
    if (!first) return null;
    if (first.type === "simple_identifier") return first.text;
    if (first.type === "call_expression") {
      node = first;
      continue;
    }
    return null;
  }
  return null;
}

/** The trailing lambda attached to a call_expression, if any -- the
 * call_suffix sibling holding an annotated_lambda/lambda_literal. */
export function trailingLambdaOf(callExpr: Parser.SyntaxNode): Parser.SyntaxNode | null {
  for (let i = 0; i < callExpr.childCount; i++) {
    const child = callExpr.child(i);
    if (child?.type === "call_suffix") {
      const lambda = findNodesOfType(child, "lambda_literal")[0];
      if (lambda) return lambda;
    }
  }
  return null;
}

/** The real call_expression's callee name that renders a screen inside a
 * `composable(route) { ... }` block -- searches every statement-level call
 * in the lambda (including inside nested if/when blocks, not just the
 * lambda's own direct top-level statements -- real gap found 2026-09-09,
 * see 00-scan-repo.ts's own header comment / the Task 3 roadmap doc). */
export function firstCallCalleeInLambda(lambda: Parser.SyntaxNode): string | null {
  const allCalls = findAllCallExpressions(lambda);
  const statementLevelCalls = allCalls.filter(c => c.parent?.type === "statements");
  const last = statementLevelCalls[statementLevelCalls.length - 1];
  return last ? calleeNameOf(last) : null;
}

export function parseKotlinFile(parser: Parser, absPath: string): { src: string; tree: Parser.Tree } {
  const src = fs.readFileSync(absPath, "utf8");
  return { src, tree: parser.parse(src) };
}

/** A file's own package name and import targets -- pure syntax, no type
 * resolution, per the real decision in 09-task1-decision-...md. */
export function packageAndImportsOf(tree: Parser.Tree): { pkg: string | null; imports: string[] } {
  const pkgHeader = findNodesOfType(tree.rootNode, "package_header")[0];
  const pkg = pkgHeader ? findNodesOfType(pkgHeader, "identifier")[0]?.text ?? null : null;
  const importHeaders = findNodesOfType(tree.rootNode, "import_header");
  const imports = importHeaders.map(h => findNodesOfType(h, "identifier")[0]?.text).filter((x): x is string => Boolean(x));
  return { pkg, imports };
}

/** Every top-level declaration name in a file (class/object/interface/
 * function) -- used to build the (package, name) -> file lookup any
 * import-graph resolution (BFS, call-site resolution) resolves against. */
export function topLevelDeclarationNamesOf(tree: Parser.Tree): string[] {
  const names: string[] = [];
  for (const type of ["class_declaration", "object_declaration", "function_declaration"]) {
    for (const node of findNodesOfType(tree.rootNode, type)) {
      const idNode = node.namedChildren.find(c => c.type === "type_identifier" || c.type === "simple_identifier");
      if (idNode) names.push(idNode.text);
    }
  }
  return names;
}

/** A declaration's own simple name (class/object/interface/function), or
 * null for anonymous/unsupported node shapes. */
export function declaredNameOf(node: Parser.SyntaxNode): string | null {
  const idNode = node.namedChildren.find(c => c.type === "type_identifier" || c.type === "simple_identifier");
  return idNode?.text ?? null;
}

/** Whether a class/interface declaration carries the `sealed` modifier. */
export function isSealed(classOrInterfaceDecl: Parser.SyntaxNode): boolean {
  return findNodesOfType(classOrInterfaceDecl, "class_modifier").some(m => m.text === "sealed");
}

/** Real, confirmed modifier-keyword node types this grammar actually
 * produces (class_modifier for `sealed`/`open`/`abstract`/`data`/etc,
 * member_modifier for `override`, function_modifier for `suspend`/
 * `operator`/`inline`, visibility_modifier for `private`/`internal`/etc). */
export function modifiersOf(decl: Parser.SyntaxNode): string[] {
  const modifierNodeTypes = ["class_modifier", "member_modifier", "function_modifier", "visibility_modifier", "inheritance_modifier", "property_modifier"];
  const mods: string[] = [];
  for (const t of modifierNodeTypes) {
    for (const m of findNodesOfType(decl, t)) mods.push(m.text);
  }
  return mods;
}

/** Every real annotation name attached anywhere within a node's own span
 * (e.g. `@Composable`, `@HiltViewModel`) -- real, confirmed grammar quirk
 * 2026-09-09: file/declaration-level annotations parse as a `prefix_
 * expression` SIBLING before the declaration, not nested inside it (matches
 * tree-sitter-kotlin's own documented `file_annotations`/`annotation_
 * structure` issues) -- so this only works when scanning a bounded region
 * containing both the annotation and its declaration together (e.g. one
 * top-level statement's own text span), not by searching inside the
 * declaration node alone. Callers should pass a wide-enough node (e.g. the
 * function/class declaration's own PARENT if annotations precede it as
 * siblings) -- verify against real output before trusting for a given kind. */
export function annotationNamesIn(node: Parser.SyntaxNode): string[] {
  return findNodesOfType(node, "annotation").map(a => a.text.replace(/^@/, ""));
}

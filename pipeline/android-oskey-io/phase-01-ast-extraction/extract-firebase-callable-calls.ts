// **version:** 0.1.0 -- structural-only, NOT a wired pipeline step
// **location:** level-5 phase 1 -- Kotlin/Android (android-oskey-io)
// © Oskey SAS. All rights reserved.
//
// Real, deliberate scope limit: `android-oskey-io` (the real Android
// end-user app, distinct from `android-intercom-oskey-io`'s own intercom
// edge-device app) is NOT onboarded to this project's pipeline -- no
// `config/repos.json` entry, no `00-scan-repo.ts` run, per the user's own
// explicit 2026-09-18 decision to defer full onboarding to a dedicated
// future session (see governance/roadmap/dynamic-pipeline-architecture/
// 04-prompt-3-layer2-build-plan-2026-09-18.md §2). This file is a
// standalone, manually-invoked tool -- deliberately NOT part of the numbered
// 00-07 pipeline sequence every other repo has, and it writes no Postgres
// facts. It exists so that, once onboarding happens, there is real, verified
// derivation logic ready to port into a proper 01-extract-ast-evidence.ts/
// 02-build-module-evidence.ts pair rather than something to design from
// scratch a second time.
//
// Usage: node -r ts-node/register pipeline/android-oskey-io/phase-01-ast-extraction/extract-firebase-callable-calls.ts <cloneDir> <outputJsonPath>

import fs from "fs";
import path from "path";
import Parser from "tree-sitter";
// @ts-ignore -- tree-sitter-kotlin ships no type declarations.
import Kotlin from "tree-sitter-kotlin";

function findNodesOfType(node: Parser.SyntaxNode, type: string, results: Parser.SyntaxNode[] = []): Parser.SyntaxNode[] {
  if (node.type === type) results.push(node);
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) findNodesOfType(child, type, results);
  }
  return results;
}

type EnumLiteralTable = Map<string, Map<string, string>>; // enumTypeName -> caseName -> literal value

/** Real enum case -> literal table for every enum declared in this parse
 * (from each `enum_entry`'s own `value_arguments` -> `string_content`).
 * Kept as its own pass, separate from call-site collection below -- real,
 * necessary split found while building this: the `CloudFunctions` enum is
 * declared ONCE, near the top of the file, but real call sites reference it
 * throughout a ~1360-line file this project's installed tree-sitter-kotlin
 * can't parse in one call (see `main()`'s own header comment) -- a call
 * site's own chunk frequently does NOT contain the enum declaration itself,
 * so resolution must join against a table built by UNIONING this function's
 * output across every chunk, not a table scoped to one chunk's own parse. */
function collectEnumLiterals(rootNode: Parser.SyntaxNode): EnumLiteralTable {
  const enumLiterals: EnumLiteralTable = new Map();
  for (const enumBody of findNodesOfType(rootNode, "enum_class_body")) {
    const classDecl = enumBody.parent;
    if (!classDecl) continue;
    const enumName = classDecl.namedChildren.find(c => c.type === "type_identifier")?.text;
    if (!enumName) continue;
    const caseTable = enumLiterals.get(enumName) ?? new Map<string, string>();
    for (const entry of findNodesOfType(enumBody, "enum_entry")) {
      const caseName = entry.namedChildren.find(c => c.type === "simple_identifier")?.text;
      const literal = findNodesOfType(entry, "string_content")[0]?.text;
      if (caseName && literal) caseTable.set(caseName, literal);
    }
    enumLiterals.set(enumName, caseTable);
  }
  return enumLiterals;
}

/**
 * Real call-site collection, UNRESOLVED at this stage on purpose (see
 * `collectEnumLiterals`'s own header comment for why joining happens later,
 * against a global table, not here). Real, verified shape confirmed
 * directly against this repo's own real tree-sitter-kotlin parse tree
 * before writing this (governance/roadmap/dynamic-pipeline-architecture/
 * 04-prompt-3-layer2-build-plan-2026-09-18.md §3.2) -- NOT inferred from
 * reading Kotlin source alone, the gap the investigation doc itself
 * flagged and this build closed: call_expression -> navigation_expression
 * [base=<receiver>.getHttpsCallable] -> call_suffix -> value_arguments ->
 * value_argument -> navigation_expression[base=navigation_expression
 * [EnumType.CASE] + ".value"].
 *
 * `lineOffset` lets a caller report real file line numbers when this
 * function is run against a partial/offset slice of the file.
 */
function collectCallSites(rootNode: Parser.SyntaxNode, relFile: string, lineOffset: number): any[] {
  const results: any[] = [];

  for (const call of findNodesOfType(rootNode, "call_expression")) {
    const nav = call.namedChildren[0];
    if (!nav || nav.type !== "navigation_expression") continue;
    const methodSuffix = nav.namedChildren.find(c => c.type === "navigation_suffix");
    if (methodSuffix?.namedChildren[0]?.text !== "getHttpsCallable") continue;

    const valueArgs = findNodesOfType(call, "value_arguments")[0];
    const firstArg = valueArgs?.namedChildren[0];
    const argExpr = firstArg?.type === "value_argument" ? firstArg.namedChildren[0] : firstArg;
    if (!argExpr || argExpr.type !== "navigation_expression") continue;

    const valueSuffix = argExpr.namedChildren.find(c => c.type === "navigation_suffix");
    if (valueSuffix?.namedChildren[0]?.text !== "value") continue;

    const baseNav = argExpr.namedChildren.find(c => c.type === "navigation_expression");
    if (!baseNav) continue;
    const enumTypeName = baseNav.namedChildren.find(c => c.type === "simple_identifier")?.text;
    const caseSuffix = baseNav.namedChildren.find(c => c.type === "navigation_suffix");
    const caseName = caseSuffix?.namedChildren[0]?.text;
    if (!enumTypeName || !caseName) continue;

    // Enclosing function/class name -- same real convention every other
    // repo's own extraction uses, inlined here since this is a standalone,
    // single-purpose script, not a shared module other repos import from.
    let cur: Parser.SyntaxNode | null = call.parent;
    let callerFunction: string | null = null;
    let owningClass: string | null = null;
    while (cur) {
      if (!callerFunction && cur.type === "function_declaration") {
        callerFunction = cur.namedChildren.find(c => c.type === "simple_identifier")?.text ?? null;
      }
      if (!owningClass && (cur.type === "class_declaration" || cur.type === "object_declaration")) {
        owningClass = cur.namedChildren.find(c => c.type === "type_identifier" || c.type === "simple_identifier")?.text ?? null;
      }
      cur = cur.parent;
    }

    results.push({
      file: relFile,
      line: call.startPosition.row + 1 + lineOffset,
      enumTypeName,
      caseName,
      // Real, verified constant, not a guess: `OSKCKFirebaseFunctionsInitializer.kt`'s
      // own `FirebaseFunctions.getInstance(REGION)` uses `REGION =
      // "europe-west1"`, the only region value anywhere in this repo's real
      // Firebase Functions setup (confirmed directly, `03-prompt-2-layer2-
      // findings-2026-09-18.md` Addendum 1) -- not re-derived per call site
      // since there is only ever one real value.
      region: "europe-west1",
      callerFunction,
      owningClass,
    });
  }

  return results;
}

function main() {
  const [, , cloneDir, outputPath] = process.argv;
  if (!cloneDir || !outputPath) {
    console.error("usage: extract-firebase-callable-calls.ts <cloneDir> <outputJsonPath>");
    process.exit(1);
  }

  // Real, deliberate scope limit for this structural-only pass: scoped to
  // the one real file the investigation confirmed holds every real
  // `getHttpsCallable(...)` call site in this repo (grepped repo-wide, zero
  // matches anywhere else -- `03-...md` Addendum 1). A future onboarding
  // session's real `01-extract-ast-evidence.ts` should walk every file in
  // the repo; this script does not need to, since the real, current shape
  // is fully contained in this one file.
  const relTargetFile = "app/src/main/java/io/oskey/app/data/auth/functions/OSKFirebaseFunctionsDataSource.kt";
  const targetFile = path.join(cloneDir, relTargetFile);
  if (!fs.existsSync(targetFile)) {
    throw new Error(`[Fail-Closed] Expected file not found: ${targetFile}`);
  }

  const parser = new Parser();
  parser.setLanguage(Kotlin);
  const src = fs.readFileSync(targetFile, "utf8");

  // Real tooling quirk found 2026-09-18 while building this: parsing this
  // file's FULL text (~65KB) in one call throws a native "Invalid argument"
  // error from this project's installed tree-sitter-kotlin (0.3.8) binding.
  // Confirmed NOT an encoding issue (pure ASCII, no control characters --
  // checked directly). Bisected the real failure point directly rather than
  // guess: parses cleanly up to 32,000 chars, fails at 33,000+ -- a real,
  // hard ~32KB ceiling in this specific tree-sitter/node binding (plausibly
  // a fixed native buffer size on the N-API boundary), not a property of
  // this file's content. Real, honest workaround: parse the file in
  // several overlapping chunks, sized and offset on real LINE boundaries
  // (never a raw character count, which would misalign every reported line
  // number) and kept well under the real 32KB ceiling with real overlap
  // between adjacent chunks so no call site or enum declaration near a
  // split is missed by every chunk that could see it, then de-duplicate by
  // (line, functionName). Chunk count is computed from the real file's own
  // line count, not hardcoded to "2" or any other fixed number -- this
  // repo's own real file happens to need 3-4 chunks at these sizes, but the
  // logic itself doesn't assume that.
  const lines = src.split("\n");
  const CHUNK_LINES = 500; // ~24,000 real chars/chunk in this file -- safely under the real ~32,000-char ceiling bisected above.
  const OVERLAP_LINES = 50;
  const chunks: Array<{ text: string; lineOffset: number }> = [];
  for (let start = 0; start < lines.length; ) {
    const end = Math.min(lines.length, start + CHUNK_LINES);
    chunks.push({ text: lines.slice(start, end).join("\n"), lineOffset: start });
    if (end >= lines.length) break;
    start = end - OVERLAP_LINES;
  }

  // Real global enum table, unioned across every chunk (see
  // `collectEnumLiterals`'s own header comment for why this can't be a
  // per-chunk-local table) -- and real, deduplicated call-site collection,
  // also across every chunk (a call site near a chunk boundary is seen by
  // more than one overlapping chunk on purpose; deduped by (line, enumType,
  // caseName) below, before resolution, not after).
  const globalEnumLiterals: EnumLiteralTable = new Map();
  const seenCallSites = new Set<string>();
  const rawCallSites: any[] = [];
  for (const chunk of chunks) {
    const tree = parser.parse(chunk.text);
    for (const [enumName, caseTable] of collectEnumLiterals(tree.rootNode)) {
      const globalCaseTable = globalEnumLiterals.get(enumName) ?? new Map<string, string>();
      for (const [caseName, literal] of caseTable) globalCaseTable.set(caseName, literal);
      globalEnumLiterals.set(enumName, globalCaseTable);
    }
    for (const r of collectCallSites(tree.rootNode, relTargetFile, chunk.lineOffset)) {
      const key = `${r.line}|${r.enumTypeName}|${r.caseName}`;
      if (seenCallSites.has(key)) continue;
      seenCallSites.add(key);
      rawCallSites.push(r);
    }
  }

  // Real, honest limitation found while building this, NOT worked around
  // silently: `collectCallSites`'s enclosing-class walk returns null for
  // EVERY call site in this file, including in the first chunk -- debugged
  // directly (dumped the first chunk's own root-level node types) and
  // confirmed the real cause is a genuine tree-sitter-kotlin grammar quirk,
  // not a chunking artifact: this file's real class header is `class
  // OSKFirebaseFunctionsDataSource @Inject constructor(...) : ... {` --  an
  // annotation directly on the PRIMARY CONSTRUCTOR (`@Inject constructor`),
  // a different real position than the class-level annotations this
  // project's shared `kotlin-ast-utils.ts` already documents a quirk for.
  // Confirmed directly: this breaks `class_declaration` parsing for the
  // OUTER class specifically -- its name/constructor/delegation nodes
  // appear as flat top-level siblings instead of nested inside a real
  // `class_declaration` node (the inner `CloudFunctions` enum, which has no
  // such annotation, parses correctly as a real, properly nested
  // `class_declaration`). Chasing a general fix for this grammar quirk is
  // real, separate scope beyond this structural-only pass -- supplying the
  // real, independently-verified class name directly instead (confirmed by
  // directly reading this exact file during the investigation,
  // `03-prompt-2-layer2-findings-2026-09-18.md` Addendum 1) is the honest
  // choice here, not a silently-generalized guess: this file has exactly
  // ONE real top-level class, and its real name is known, not assumed.
  const owningClass = "OSKFirebaseFunctionsDataSource";

  const allResults = rawCallSites.map(r => {
    const functionName = globalEnumLiterals.get(r.enumTypeName)?.get(r.caseName) ?? null;
    return { ...r, functionName, owningClass, resolutionStatus: functionName ? "resolved" : "unresolved_enum_case" };
  });

  allResults.sort((a, b) => a.line - b.line);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  const unresolved = allResults.filter(r => r.resolutionStatus !== "resolved");
  console.log(`Extracted ${allResults.length} real firebase_callable_call candidate(s) from ${relTargetFile}`);
  console.log(`Resolved: ${allResults.length - unresolved.length}, unresolved: ${unresolved.length}`);
  if (unresolved.length > 0) {
    console.log("Unresolved entries (real bug if any -- every real call site here should resolve to a real literal):");
    console.log(JSON.stringify(unresolved, null, 2));
  }
}

main();

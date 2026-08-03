// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Loads 04-build-resolved-graph.ts's repo-wide resolved cross-module call
// edges and filters them to the ones relevant to one module -- this
// artifact has existed since Phase 1.75 but was never wired into P2 at all
// (found during the Stage 3 audit, governance/roadmap/02-structural-
// narrative-synthesis-tiers.md). Distinct from, and complementary to, the
// import-based cross-module dependency graph (06-build-cross-module-
// dependency-graph.ts): that graph says "module A imports from module B";
// this says "module A specifically calls method M of class C in module B"
// -- a finer-grained, method-level relationship the import graph alone
// doesn't carry.

export interface CallEdge {
  sourceModule: string;
  sourceFile: string;
  sourceLine: number;
  targetModule: string;
  targetFile: string;
  targetLine: number;
  targetClass: string;
  targetMethod: string;
  confidence: string;
  resolutionMethod: string;
}

/** Filters the repo-wide resolved graph's confirmed + probable call edges
 * down to the ones where the given module is either the caller or the
 * callee -- outbound and inbound, same shape as the dependency graphs. */
export function filterCallEdgesForModule(resolvedGraph: any, moduleName: string): { outbound: CallEdge[]; inbound: CallEdge[] } {
  const allEdges: CallEdge[] = [...(resolvedGraph.confirmedCallEdges ?? []), ...(resolvedGraph.probableCallEdges ?? [])];
  return {
    outbound: allEdges.filter(e => e.sourceModule === moduleName && e.targetModule !== moduleName),
    inbound: allEdges.filter(e => e.targetModule === moduleName && e.sourceModule !== moduleName),
  };
}

export function formatCallEdges(edges: { outbound: CallEdge[]; inbound: CallEdge[] }): string {
  const lines: string[] = [];
  lines.push(`### Outbound (this module calls into another module's specific method)`);
  if (edges.outbound.length === 0) lines.push("(none)");
  for (const e of edges.outbound) {
    lines.push(`${e.sourceFile}:${e.sourceLine} -> ${e.targetModule} :: ${e.targetClass}.${e.targetMethod} (${e.targetFile}:${e.targetLine}) [${e.confidence}]`);
  }
  lines.push("");
  lines.push(`### Inbound (another module calls into this module's specific method)`);
  if (edges.inbound.length === 0) lines.push("(none)");
  for (const e of edges.inbound) {
    lines.push(`${e.sourceModule} (${e.sourceFile}:${e.sourceLine}) -> ${e.targetClass}.${e.targetMethod} (${e.targetFile}:${e.targetLine}) [${e.confidence}]`);
  }
  return lines.join("\n");
}

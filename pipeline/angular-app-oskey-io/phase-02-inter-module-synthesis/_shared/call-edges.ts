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

// governance/roadmap/03-token-economics-remediation-plan.md Stage 2 finding:
// a flat one-line-per-edge listing has the same problem the two graph
// artifacts had before Stage 1's fix, just never measured until Stage 2 went
// looking -- this section alone was 146,562 bytes (22.3% of the one real
// reduce call measured so far), and most of it is the same (module, target
// method) relationship repeated once per call site (one real case: 78
// separate lines for a single relationship). Fix: group by relationship,
// show it once with a capped number of example call sites plus a count,
// instead of one line per call site. Confidence and the target declaration
// location are grouped on too (not just displayed once per group) --
// verified against all 1,068 real relationship groups repo-wide that both
// are always uniform within a group before relying on that; the fallback
// path below still handles it correctly if that ever isn't true for future
// data, rather than silently dropping a genuine split.
const MAX_SAMPLE_CALL_SITES_PER_RELATIONSHIP = 3;

interface GroupedRelationship {
  partnerModule: string;
  targetClass: string;
  targetMethod: string;
  targetFile: string;
  targetLine: number;
  confidences: string[]; // usually length 1; see comment above
  callSites: Array<{ file: string; line: number }>;
}

function groupByRelationship(edges: CallEdge[], partnerOf: (e: CallEdge) => string): GroupedRelationship[] {
  const groups = new Map<string, GroupedRelationship>();
  for (const e of edges) {
    const partnerModule = partnerOf(e);
    const key = `${partnerModule}|${e.targetClass}.${e.targetMethod}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        partnerModule,
        targetClass: e.targetClass,
        targetMethod: e.targetMethod,
        targetFile: e.targetFile,
        targetLine: e.targetLine,
        confidences: [],
        callSites: [],
      };
      groups.set(key, group);
    }
    if (!group.confidences.includes(e.confidence)) group.confidences.push(e.confidence);
    group.callSites.push({ file: e.sourceFile, line: e.sourceLine });
  }
  return Array.from(groups.values());
}

function formatConfidence(confidences: string[]): string {
  // Defensive path: only exercised if a relationship's call sites ever
  // resolve at different confidence levels, which has not been observed in
  // any real data checked so far -- shows the split rather than picking one
  // and silently dropping the other.
  return confidences.length === 1 ? confidences[0] : confidences.join("/");
}

function formatGroup(g: GroupedRelationship, arrowLabel: string): string {
  const sample = g.callSites.slice(0, MAX_SAMPLE_CALL_SITES_PER_RELATIONSHIP);
  const sampleText = sample.map(c => `${c.file}:${c.line}`).join(", ");
  const countSuffix = g.callSites.length > sample.length ? ` (${g.callSites.length} call sites, e.g. ${sampleText})` : ` (${sampleText})`;
  return `${g.partnerModule} ${arrowLabel} ${g.targetClass}.${g.targetMethod} (${g.targetFile}:${g.targetLine}) [${formatConfidence(g.confidences)}]${countSuffix}`;
}

export function formatCallEdges(edges: { outbound: CallEdge[]; inbound: CallEdge[] }): string {
  const lines: string[] = [];
  lines.push(`### Outbound (this module calls into another module's specific method)`);
  const outboundGroups = groupByRelationship(edges.outbound, e => e.targetModule);
  if (outboundGroups.length === 0) lines.push("(none)");
  for (const g of outboundGroups) lines.push(formatGroup(g, "->"));
  lines.push("");
  lines.push(`### Inbound (another module calls into this module's specific method)`);
  const inboundGroups = groupByRelationship(edges.inbound, e => e.sourceModule);
  if (inboundGroups.length === 0) lines.push("(none)");
  for (const g of inboundGroups) lines.push(formatGroup(g, "->"));
  return lines.join("\n");
}

// governance/roadmap/v1-b-module-reduce-contract-scope-2026-08-30.md Section
// 4: 04-build-resolved-graph.ts already computes unresolvedCallEdges
// repo-wide (calls it could not resolve to a unique cross-module service
// method), but it was never passed into 01c's reduce call at all -- same
// wiring gap pattern as the RBAC catalog above. Module-filtered here so it
// can be supplied as one more free, already-computed input to the reduce
// call's Risks & Open Questions section. Ported from firebase-oskey-dev's
// copy of this file -- domain-agnostic, operates purely on the resolved
// graph's module/submodule/file/line shape.
export interface UnresolvedCallEdgeForModule {
  sourceSubmodule: string | null;
  sourceFile: string;
  sourceLine: number;
  evidenceCallText: string;
  reason: string;
  candidateCount: number;
}

export function filterUnresolvedCallEdgesForModule(resolvedGraph: any, moduleName: string): UnresolvedCallEdgeForModule[] {
  return (resolvedGraph.unresolvedCallEdges ?? [])
    .filter((e: any) => e.sourceModule === moduleName)
    .map((e: any) => ({
      sourceSubmodule: e.sourceSubmodule ?? null,
      sourceFile: e.sourceFile,
      sourceLine: e.sourceLine,
      evidenceCallText: e.evidenceCallText,
      reason: e.reason,
      candidateCount: e.candidateCount,
    }));
}

export function formatUnresolvedCallEdges(edges: UnresolvedCallEdgeForModule[]): string {
  if (edges.length === 0) return "*(no unresolved call edges originating in this module)*";
  return edges
    .map(e => `- ${e.sourceSubmodule ?? "(submodule unknown)"} — \`${e.evidenceCallText}\` (${e.sourceFile}:${e.sourceLine}) — ${e.reason} (${e.candidateCount} candidate(s))`)
    .join("\n");
}

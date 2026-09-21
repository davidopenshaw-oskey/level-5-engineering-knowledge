// **version:** 1.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Task 5b of governance/roadmap/facts-serving-strategy/14-inbound-outbound-
// surface-graph-tasklist.md: given a real fact_ref (a vector-search anchor),
// find its direct graph neighbors via cross_repo_edges. Depth 1 only --
// task 4's own verification already showed one anchor with 9 direct
// outgoing edges, so depth beyond 1 hop risks combinatorial noise long
// before it adds signal. Both directions, deliberately: the cross-repo
// edges (HTTP_API_CALL, PUBSUB_TOPIC_BINDING) are inherently asymmetric
// (Angular calls Firebase, never the reverse), so a Firebase-anchored
// search must be able to traverse *backward* to find its Angular caller --
// that backward link is the actual fix for this task list's original
// motivating problem ("where does the PGO flow start from"), not a
// nice-to-have.
//
// Filtered to resolution_status IN ('resolved', 'confirmed') -- an
// unresolved edge has no real target_fact_ref to pull in anyway (verified
// in task 5a: null exactly and only for unresolved edges), but this is an
// explicit filter, not an accident of the data shape.
//
// fact_ref (ADR-010, 2026-09-17): identity/join key is now the opaque
// 40-char SHA1 hex `fact_ref`, not the natural-key `fact_id` text -- see
// governance/adrs/adr-010.md. fact_id is kept in the facts table purely as
// a descriptive/citation label; this module never reads it.

import type { Pool } from "pg";

// Real, defensive structural check (ADR-010 §8 item 2, 2026-09-17): fact_ref
// is a GENERATED column with a fixed format (40 lowercase hex chars), so any
// tool argument that doesn't match it is a real wiring mistake -- a stale
// client still sending the old fact_id text, or an un-migrated fork copy --
// not something to silently accept and let checkFabrication eventually
// notice downstream. Logs, doesn't throw: this is a diagnostic, not a
// fail-closed validator (that job belongs to validators.ts's own checks
// against this run's real tool results).
const FACT_REF_PATTERN = /^[0-9a-f]{40}$/;
function warnIfNotFactRef(value: string, source: string): void {
  if (!FACT_REF_PATTERN.test(value)) {
    console.warn(`[fact_ref format warning] ${source} received '${value}', not a 40-character lowercase hex fact_ref -- possible stale client or un-migrated fork copy.`);
  }
}

export interface GraphNeighbor {
  factRef: string;
  direction: "outgoing" | "incoming";
  connectionType: string;
  otherSymbol: string;
  resolutionStatus: string;
  details: string | null;
}

export interface GraphNeighborFact {
  factRef: string;
  repo: string;
  module: string;
  kind: string;
  symbolName: string | null;
  description: string;
  // A neighbor can be structurally connected to more than one anchor (e.g.
  // two different anchors both call the same downstream function) --
  // collected here rather than duplicating the fact once per connection,
  // so a reader sees "this is connected to #3 and #7" in one place.
  connections: { anchorNumber: number; direction: "outgoing" | "incoming"; connectionType: string }[];
}

// Task 5c: expands a numbered anchor set (already-assigned Layer 2 numbers)
// with their real, direct graph neighbors -- deliberately excludes any
// neighbor that's already one of the anchors themselves (already numbered,
// would be a real duplicate, not a new piece of evidence).
export async function expandWithGraphNeighbors(
  db: Pool,
  anchorFactRefs: string[],
  anchorNumbers: Map<string, number>
): Promise<GraphNeighborFact[]> {
  for (const anchorFactRef of anchorFactRefs) warnIfNotFactRef(anchorFactRef, "expandWithGraphNeighbors");

  const anchorSet = new Set(anchorFactRefs);
  const byNeighborFactRef = new Map<string, GraphNeighborFact["connections"]>();

  for (const anchorFactRef of anchorFactRefs) {
    const neighbors = await findGraphNeighbors(db, anchorFactRef);
    const anchorNumber = anchorNumbers.get(anchorFactRef);
    if (anchorNumber === undefined) {
      throw new Error(`[Fail-Closed] Anchor fact_ref '${anchorFactRef}' has no assigned number -- anchorNumbers map is incomplete.`);
    }
    for (const n of neighbors) {
      if (anchorSet.has(n.factRef)) continue; // already a numbered anchor, not new evidence
      const existing = byNeighborFactRef.get(n.factRef) ?? [];
      existing.push({ anchorNumber, direction: n.direction, connectionType: n.connectionType });
      byNeighborFactRef.set(n.factRef, existing);
    }
  }

  if (byNeighborFactRef.size === 0) return [];

  const neighborFactRefs = [...byNeighborFactRef.keys()];
  const rows = await db.query<{ fact_ref: string; repo: string; module: string; kind: string; symbol_name: string | null; description: string }>(
    `SELECT fact_ref, repo, module, kind, symbol_name, description FROM facts WHERE fact_ref = ANY($1::text[])`,
    [neighborFactRefs]
  );
  const realFactRefs = new Set(rows.rows.map(r => r.fact_ref));
  const missing = neighborFactRefs.filter(ref => !realFactRefs.has(ref));
  if (missing.length > 0) {
    throw new Error(`[Fail-Closed] Graph edge(s) reference fact_ref(s) not found in facts: ${missing.join(", ")} -- edges may be stale relative to the current facts index.`);
  }

  return rows.rows.map(r => ({
    factRef: r.fact_ref,
    repo: r.repo,
    module: r.module,
    kind: r.kind,
    symbolName: r.symbol_name,
    description: r.description,
    connections: byNeighborFactRef.get(r.fact_ref)!,
  }));
}

export interface ClusterMember {
  factRef: string;
  repo: string;
  module: string;
  kind: string;
  symbolName: string | null;
  description: string;
  depth: number;
}

export interface ClusterEdge {
  sourceFactRef: string;
  targetFactRef: string;
  connectionType: string;
}

export interface BoundedClusterResult {
  members: ClusterMember[];
  edges: ClusterEdge[];
  // Real, not cosmetic: true if the walk stopped because it hit maxFacts or
  // maxDepth with more real neighbors still unexplored -- a caller needs to
  // know a cluster is a partial view, not a complete one, before treating it
  // as "the whole workflow."
  truncated: boolean;
}

// Generic, reusable primitive -- NOT specific to any one downstream task.
// Originally written for governance/roadmap/building-workflows/01-workflow-
// seeding-tasklist.md's Step 2 (a bespoke workflow-catalogue-seeding
// script), but that whole approach is superseded, 2026-09-05, by an
// agent-persona architecture (see that doc's own superseded note and
// governance/roadmap/market-research/02-findings-retrieval-architecture-
// 2026-09-05.md): rather than a hardcoded script deciding how far to walk a
// graph, a future task-specific agent (e.g. an impact-analysis persona)
// would call this as one of its own generic tools, deciding for itself
// whether and how far to walk from a given anchor. Kept here in that
// reframed role -- a real, tested-safe traversal primitive, not tied to any
// one task's now-superseded orchestration logic. Reuses findGraphNeighbors
// directly rather than a parallel traversal implementation.
//
// Real finding from checking cross_repo_edges before writing this, not
// assumed: all four connection_types that existed then (INTRA_REPO_CALL,
// HTTP_API_CALL, PUBSUB_TOPIC_BINDING, FIELD_BINDING) would all be allowed
// to cross a module/repo boundary under a "stop unless the edge type is one
// of the ones this project has already verified" rule -- meaning that rule
// is currently vacuous against real data (nothing would ever be stopped by
// a connection-type check; INTRA_REPO_CALL alone was 2,362 real edges). The
// real limiter today is combinatorial fan-out (one anchor can have 9+
// direct edges, confirmed in earlier real graph-traversal work), not
// incidental-coupling noise -- so this bounds explicitly on both depth and
// total cluster size, not on connection type. Revisit the type-based idea
// if a future connection_type is ever added that represents weaker/
// incidental coupling worth actually filtering out.
//
// Updated 2026-09-21 (cross-repo edge build, governance/roadmap/dynamic-pipeline-
// architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md; comment
// only, no behavior change): SIX connection_types exist now -- the four above plus
// PACKAGE_SYMBOL_USE (iOS app -> the Swift kits) and FIRESTORE_EVENT_TRIGGER (a
// Firestore write -> the trigger handler it fires) -- and INTRA_REPO_CALL alone is
// 17,064 edges. The conclusion above still holds: a connection-type check would
// still stop nothing, and fan-out is still the real limiter. Measured on the built
// edges: one kit declaration (OSKUIExpanded) has 85 incoming PACKAGE_SYMBOL_USE
// edges, so a walk that reaches it hits the maxFacts cap at depth 1 (doc 38, Stage
// B hub measurement). Only resolved/confirmed edges with a non-null target are
// followed (see findGraphNeighbors); a followed edge whose source fact no longer
// exists in facts makes this walk throw, which is why edges must be rebuilt after a
// repo is re-synced (the build script's coverage summary reports both).
export async function walkBoundedCluster(
  db: Pool,
  anchorFactRef: string,
  opts: { maxDepth?: number; maxFacts?: number } = {}
): Promise<BoundedClusterResult> {
  warnIfNotFactRef(anchorFactRef, "walkBoundedCluster");
  const maxDepth = opts.maxDepth ?? 6; // same real bound proven safe in build-form-field-lineage-edges.ts's resolveFieldRecursive()
  const maxFacts = opts.maxFacts ?? 80; // generous but real -- chosen to observe real pilot behavior, not asserted correct on paper

  const depthByFactRef = new Map<string, number>([[anchorFactRef, 0]]);
  const edges: ClusterEdge[] = [];
  let frontier = [anchorFactRef];
  let depth = 0;
  let truncated = false;

  while (frontier.length > 0 && depth < maxDepth) {
    const nextFrontier: string[] = [];
    for (const factRef of frontier) {
      const neighbors = await findGraphNeighbors(db, factRef);
      for (const n of neighbors) {
        edges.push({
          sourceFactRef: n.direction === "outgoing" ? factRef : n.factRef,
          targetFactRef: n.direction === "outgoing" ? n.factRef : factRef,
          connectionType: n.connectionType,
        });
        if (depthByFactRef.has(n.factRef)) continue; // cycle-safe: already visited, same discipline as resolveFieldRecursive()'s visited set
        if (depthByFactRef.size >= maxFacts) { truncated = true; continue; }
        depthByFactRef.set(n.factRef, depth + 1);
        nextFrontier.push(n.factRef);
      }
    }
    frontier = nextFrontier;
    depth++;
  }
  if (frontier.length > 0 && depth >= maxDepth) truncated = true; // real neighbors left unexplored at the depth bound, not just an empty frontier

  const allFactRefs = [...depthByFactRef.keys()];
  const rows = await db.query<{ fact_ref: string; repo: string; module: string; kind: string; symbol_name: string | null; description: string }>(
    `SELECT fact_ref, repo, module, kind, symbol_name, description FROM facts WHERE fact_ref = ANY($1::text[])`,
    [allFactRefs]
  );
  const realFactRefs = new Set(rows.rows.map(r => r.fact_ref));
  const missing = allFactRefs.filter(ref => !realFactRefs.has(ref));
  if (missing.length > 0) {
    throw new Error(`[Fail-Closed] Graph edge(s) reference fact_ref(s) not found in facts: ${missing.join(", ")} -- edges may be stale relative to the current facts index.`);
  }

  const members: ClusterMember[] = rows.rows.map(r => ({
    factRef: r.fact_ref,
    repo: r.repo,
    module: r.module,
    kind: r.kind,
    symbolName: r.symbol_name,
    description: r.description,
    depth: depthByFactRef.get(r.fact_ref)!,
  }));

  return { members, edges, truncated };
}

export async function findGraphNeighbors(db: Pool, factRef: string): Promise<GraphNeighbor[]> {
  const result = await db.query<{ direction: "outgoing" | "incoming"; connection_type: string; other_fact_ref: string; other_symbol: string; resolution_status: string; details: string | null }>(
    `SELECT 'outgoing' as direction, connection_type, target_fact_ref as other_fact_ref, target_symbol as other_symbol, resolution_status, details
       FROM cross_repo_edges
      WHERE source_fact_ref = $1 AND resolution_status IN ('resolved', 'confirmed') AND target_fact_ref IS NOT NULL
     UNION ALL
     SELECT 'incoming' as direction, connection_type, source_fact_ref as other_fact_ref, source_symbol as other_symbol, resolution_status, details
       FROM cross_repo_edges
      WHERE target_fact_ref = $1 AND resolution_status IN ('resolved', 'confirmed')`,
    [factRef]
  );
  return result.rows.map(r => ({
    factRef: r.other_fact_ref,
    direction: r.direction,
    connectionType: r.connection_type,
    otherSymbol: r.other_symbol,
    resolutionStatus: r.resolution_status,
    details: r.details,
  }));
}

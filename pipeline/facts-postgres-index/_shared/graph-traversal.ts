// **version:** 1.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Task 5b of governance/roadmap/facts-serving-strategy/14-inbound-outbound-
// surface-graph-tasklist.md: given a real fact_id (a vector-search anchor),
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
// unresolved edge has no real target_fact_id to pull in anyway (verified
// in task 5a: null exactly and only for unresolved edges), but this is an
// explicit filter, not an accident of the data shape.

import type { Pool } from "pg";

export interface GraphNeighbor {
  factId: string;
  direction: "outgoing" | "incoming";
  connectionType: string;
  otherSymbol: string;
  resolutionStatus: string;
  details: string | null;
}

export interface GraphNeighborFact {
  factId: string;
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
  anchorFactIds: string[],
  anchorNumbers: Map<string, number>
): Promise<GraphNeighborFact[]> {
  const anchorSet = new Set(anchorFactIds);
  const byNeighborFactId = new Map<string, GraphNeighborFact["connections"]>();

  for (const anchorFactId of anchorFactIds) {
    const neighbors = await findGraphNeighbors(db, anchorFactId);
    const anchorNumber = anchorNumbers.get(anchorFactId);
    if (anchorNumber === undefined) {
      throw new Error(`[Fail-Closed] Anchor fact_id '${anchorFactId}' has no assigned number -- anchorNumbers map is incomplete.`);
    }
    for (const n of neighbors) {
      if (anchorSet.has(n.factId)) continue; // already a numbered anchor, not new evidence
      const existing = byNeighborFactId.get(n.factId) ?? [];
      existing.push({ anchorNumber, direction: n.direction, connectionType: n.connectionType });
      byNeighborFactId.set(n.factId, existing);
    }
  }

  if (byNeighborFactId.size === 0) return [];

  const neighborFactIds = [...byNeighborFactId.keys()];
  const rows = await db.query<{ fact_id: string; repo: string; module: string; kind: string; symbol_name: string | null; description: string }>(
    `SELECT fact_id, repo, module, kind, symbol_name, description FROM facts WHERE fact_id = ANY($1::text[])`,
    [neighborFactIds]
  );
  const realFactIds = new Set(rows.rows.map(r => r.fact_id));
  const missing = neighborFactIds.filter(id => !realFactIds.has(id));
  if (missing.length > 0) {
    throw new Error(`[Fail-Closed] Graph edge(s) reference fact_id(s) not found in facts: ${missing.join(", ")} -- edges may be stale relative to the current facts index.`);
  }

  return rows.rows.map(r => ({
    factId: r.fact_id,
    repo: r.repo,
    module: r.module,
    kind: r.kind,
    symbolName: r.symbol_name,
    description: r.description,
    connections: byNeighborFactId.get(r.fact_id)!,
  }));
}

export async function findGraphNeighbors(db: Pool, factId: string): Promise<GraphNeighbor[]> {
  const result = await db.query<{ direction: "outgoing" | "incoming"; connection_type: string; other_fact_id: string; other_symbol: string; resolution_status: string; details: string | null }>(
    `SELECT 'outgoing' as direction, connection_type, target_fact_id as other_fact_id, target_symbol as other_symbol, resolution_status, details
       FROM cross_repo_edges
      WHERE source_fact_id = $1 AND resolution_status IN ('resolved', 'confirmed') AND target_fact_id IS NOT NULL
     UNION ALL
     SELECT 'incoming' as direction, connection_type, source_fact_id as other_fact_id, source_symbol as other_symbol, resolution_status, details
       FROM cross_repo_edges
      WHERE target_fact_id = $1 AND resolution_status IN ('resolved', 'confirmed')`,
    [factId]
  );
  return result.rows.map(r => ({
    factId: r.other_fact_id,
    direction: r.direction,
    connectionType: r.connection_type,
    otherSymbol: r.other_symbol,
    resolutionStatus: r.resolution_status,
    details: r.details,
  }));
}

// **version:** 1.0.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// W5b (governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-
// from-wiki-handoff-2026-09-26.md): edge-sync state. "Stale" used to mean "the repo's
// newest extraction_runs.extracted_at is later than the edges' generated_at", which is a
// timestamp comparison: a re-sync of unchanged facts moves extracted_at and flags every
// slice (Angular, node-iot, android HTTP were flagged this way on 2026-09-26 with fact
// sets that had not changed). Here "stale" means "the edges were built from a different
// fact set than the one that is current now".
//
// A slice is one (connection_type, source_repo) group of cross_repo_edges rows, the same
// unit the edge builders replace. When `pipeline:edges` (build-edges.ts) rebuilds a slice
// it records, in `edge_sync_state`, a fingerprint of the fact set of every repo the slice
// depends on (its source repo plus the target repos of its edges). The fingerprint of a
// repo is an md5 over every fact's `fact_ref` and its payload, in `fact_ref` order, with
// the run-identity keys removed (top-level `runId` and `generatedAt`, and `evidence.runId`
// and `evidence.generatedAt`). Payload is included, not only the ID, because extraction
// changes add payload fields to existing facts without changing their IDs, and a join that
// reads those fields must be rebuilt. Two extractions of the same commit produce the same
// fingerprint (checked 2026-09-26: Angular 8,747 facts and node-iot 1,432 facts, runs of
// 2026-09-11 and 2026-09-23, both equal to the live database), so a re-sync of an
// unchanged repo is not stale.
//
// Status of a slice in the report:
//   ok         a state row exists, its synthesis_id is the slice's current one, and every
//              input repo's current fingerprint equals the recorded one.
//   STALE      an input repo's fact set differs from the one the edges were built from.
//   UNRECORDED no state row, or the slice was rebuilt after the recorded state (a builder
//              was run by hand outside pipeline:edges). Freshness cannot be judged.
import { Pool } from "pg";

export const UNKNOWN_REPO = "unknown"; // target_repo/source_repo of an edge with no fact on that end (same value the builders write)
// The statuses `findGraphNeighbors` follows (mcp-server/db/graph-traversal.ts).
export const FOLLOWED_STATUSES = ["resolved", "confirmed"];

const STRIPPED_PAYLOAD_SQL = `((payload - 'runId' - 'generatedAt') #- '{evidence,runId}' #- '{evidence,generatedAt}')`;

export interface RepoFingerprint {
  runId: string | null; // the repo's current extraction run at the time
  factCount: number;
  fingerprint: string;
}

export interface SliceKey {
  connectionType: string;
  sourceRepo: string;
}

interface SliceInfo extends SliceKey {
  edgeCount: number;
  resolvedCount: number;
  synthesisId: string; // max synthesis_id in the slice
  generatedAt: string; // max generated_at, as text
  targetRepos: string[];
  danglingSource: number;
  danglingTarget: number;
}

export async function edgeSyncTableExists(db: Pool): Promise<boolean> {
  const r = await db.query<{ t: string | null }>(`SELECT to_regclass('public.edge_sync_state')::text AS t`);
  return r.rows[0].t !== null;
}

// Fingerprint of every repo that has facts. One pass over `facts`.
export async function repoFingerprints(db: Pool): Promise<Map<string, RepoFingerprint>> {
  const r = await db.query<{ repo: string; n: string; fp: string }>(
    `SELECT repo, count(*)::text AS n, md5(string_agg(fact_ref || ':' || md5(${STRIPPED_PAYLOAD_SQL}::text), ',' ORDER BY fact_ref)) AS fp
     FROM facts GROUP BY repo ORDER BY repo`
  );
  const runs = await db.query<{ repo: string; run_id: string }>(`SELECT repo, run_id FROM extraction_runs WHERE is_current`);
  const runOf = new Map(runs.rows.map(x => [x.repo, x.run_id]));
  return new Map(r.rows.map(x => [x.repo, { runId: runOf.get(x.repo) ?? null, factCount: Number(x.n), fingerprint: x.fp }]));
}

// Every slice in the table, with the numbers the state row records.
async function sliceInfos(db: Pool): Promise<SliceInfo[]> {
  const r = await db.query<{
    connection_type: string; source_repo: string; edges: string; resolved: string; synthesis_id: string; generated_at: string;
    target_repos: string[]; dangling_source: string; dangling_target: string;
  }>(
    `SELECT e.connection_type, e.source_repo, count(*)::text AS edges,
            count(*) FILTER (WHERE e.resolution_status = ANY($1::text[]))::text AS resolved,
            max(e.synthesis_id) AS synthesis_id, max(e.generated_at)::text AS generated_at,
            array_agg(DISTINCT e.target_repo) AS target_repos,
            count(*) FILTER (WHERE e.source_fact_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM facts f WHERE f.fact_ref = e.source_fact_ref))::text AS dangling_source,
            count(*) FILTER (WHERE e.target_fact_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM facts f WHERE f.fact_ref = e.target_fact_ref))::text AS dangling_target
     FROM cross_repo_edges e GROUP BY 1, 2 ORDER BY 1, 2`,
    [FOLLOWED_STATUSES]
  );
  return r.rows.map(x => ({
    connectionType: x.connection_type, sourceRepo: x.source_repo, edgeCount: Number(x.edges), resolvedCount: Number(x.resolved),
    synthesisId: x.synthesis_id, generatedAt: x.generated_at, targetRepos: x.target_repos,
    danglingSource: Number(x.dangling_source), danglingTarget: Number(x.dangling_target),
  }));
}

// Repos whose fact sets a slice depends on: its source repo and the target repos of its edges.
function inputRepos(s: SliceInfo): string[] {
  return [...new Set([s.sourceRepo, ...s.targetRepos])].filter(r => r !== UNKNOWN_REPO).sort();
}

export const sliceId = (s: SliceKey) => `${s.connectionType}\u0000${s.sourceRepo}`;

// A snapshot of which slices exist and their newest synthesis_id / generated_at, used to
// find the slices a builder actually rewrote (a builder that failed or was a dry run
// leaves them unchanged, so it is never recorded as fresh).
export async function sliceMarkers(db: Pool): Promise<Map<string, string>> {
  const r = await db.query<{ connection_type: string; source_repo: string; m: string }>(
    `SELECT connection_type, source_repo, max(synthesis_id) || '|' || max(generated_at)::text || '|' || count(*)::text AS m FROM cross_repo_edges GROUP BY 1, 2`
  );
  return new Map(r.rows.map(x => [sliceId({ connectionType: x.connection_type, sourceRepo: x.source_repo }), x.m]));
}

// Records state for every slice whose marker changed between `before` and now. Also drops
// state rows for slices that no longer have edges. Returns the recorded slices.
export async function recordEdgeSyncState(db: Pool, before: Map<string, string>, fingerprints: Map<string, RepoFingerprint>, skip: (s: SliceKey) => boolean = () => false): Promise<SliceKey[]> {
  const after = await sliceMarkers(db);
  const infos = await sliceInfos(db);
  const recorded: SliceKey[] = [];
  for (const s of infos) {
    if (before.get(sliceId(s)) === after.get(sliceId(s))) continue; // not rewritten by this run
    if (skip(s)) continue; // e.g. a step that failed part-way: its slice must not be recorded as fresh
    const inputs: Record<string, { run_id: string | null; fact_count: number; fingerprint: string }> = {};
    for (const repo of inputRepos(s)) {
      const fp = fingerprints.get(repo);
      if (fp) inputs[repo] = { run_id: fp.runId, fact_count: fp.factCount, fingerprint: fp.fingerprint };
    }
    await db.query(
      `INSERT INTO edge_sync_state (connection_type, source_repo, built_at, synthesis_id, facts_run_id, edge_count, resolved_count, dangling_source, dangling_target, inputs)
       VALUES ($1, $2, now(), $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (connection_type, source_repo) DO UPDATE SET
         built_at = EXCLUDED.built_at, synthesis_id = EXCLUDED.synthesis_id, facts_run_id = EXCLUDED.facts_run_id, edge_count = EXCLUDED.edge_count,
         resolved_count = EXCLUDED.resolved_count, dangling_source = EXCLUDED.dangling_source, dangling_target = EXCLUDED.dangling_target, inputs = EXCLUDED.inputs`,
      [s.connectionType, s.sourceRepo, s.synthesisId, fingerprints.get(s.sourceRepo)?.runId ?? null, s.edgeCount, s.resolvedCount, s.danglingSource, s.danglingTarget, JSON.stringify(inputs)]
    );
    recorded.push({ connectionType: s.connectionType, sourceRepo: s.sourceRepo });
  }
  // Housekeeping on the table this module owns: a state row for a slice with no edges is meaningless.
  await db.query(
    `DELETE FROM edge_sync_state s WHERE NOT EXISTS (SELECT 1 FROM cross_repo_edges e WHERE e.connection_type = s.connection_type AND e.source_repo = s.source_repo)`
  );
  return recorded;
}

export interface SliceStatus extends SliceKey {
  status: "ok" | "STALE" | "UNRECORDED";
  edgeCount: number;
  builtAt: string | null;
  reasons: string[];
}

export async function evaluateSlices(db: Pool): Promise<{ tableExists: boolean; slices: SliceStatus[] }> {
  const infos = await sliceInfos(db);
  const tableExists = await edgeSyncTableExists(db);
  if (!tableExists) {
    return { tableExists, slices: infos.map(s => ({ connectionType: s.connectionType, sourceRepo: s.sourceRepo, status: "UNRECORDED" as const, edgeCount: s.edgeCount, builtAt: null, reasons: ["edge_sync_state table does not exist yet"] })) };
  }
  const state = await db.query<{
    connection_type: string; source_repo: string; built_at: Date; synthesis_id: string | null; edge_count: number;
    inputs: Record<string, { run_id: string | null; fact_count: number; fingerprint: string }>;
  }>(`SELECT connection_type, source_repo, built_at, synthesis_id, edge_count, inputs FROM edge_sync_state`);
  const byId = new Map(state.rows.map(x => [sliceId({ connectionType: x.connection_type, sourceRepo: x.source_repo }), x]));
  const now = await repoFingerprints(db);
  const out: SliceStatus[] = [];
  for (const s of infos) {
    const base = { connectionType: s.connectionType, sourceRepo: s.sourceRepo, edgeCount: s.edgeCount };
    const st = byId.get(sliceId(s));
    if (!st) { out.push({ ...base, status: "UNRECORDED", builtAt: null, reasons: ["no edge_sync_state row (edges built outside pipeline:edges)"] }); continue; }
    const builtAt = st.built_at.toISOString();
    if (st.synthesis_id !== s.synthesisId || st.edge_count !== s.edgeCount) {
      out.push({ ...base, status: "UNRECORDED", builtAt, reasons: [`edges rebuilt after the recorded state (recorded synthesis_id ${st.synthesis_id}, ${st.edge_count} edges; now ${s.synthesisId}, ${s.edgeCount} edges): a builder was run by hand`] });
      continue;
    }
    const stale: string[] = [];
    const notes: string[] = [];
    for (const [repo, rec] of Object.entries(st.inputs)) {
      const cur = now.get(repo);
      if (!cur) { stale.push(`${repo}: repo has no facts now (had ${rec.fact_count})`); continue; }
      if (cur.fingerprint !== rec.fingerprint) stale.push(`${repo}: fact set changed since the edges were built (${rec.fact_count} facts, run ${rec.run_id} -> ${cur.factCount} facts, run ${cur.runId})`);
      else if (cur.runId !== rec.run_id) notes.push(`${repo}: run ${rec.run_id} -> ${cur.runId}, identical fact set`);
    }
    out.push(stale.length > 0 ? { ...base, status: "STALE", builtAt, reasons: stale } : { ...base, status: "ok", builtAt, reasons: notes });
  }
  return { tableExists, slices: out };
}

// Read-only. Prints one line per slice and a verdict; returns the counts.
export async function printEdgeSyncReport(db: Pool): Promise<{ stale: number; unrecorded: number; ok: number }> {
  const { tableExists, slices } = await evaluateSlices(db);
  console.log(`  edge sync state (edge_sync_state: a slice is STALE only if an input repo's fact set, ids plus payload, differs from the one its edges were built from; a timestamp is never used):`);
  if (!tableExists) console.log(`    edge_sync_state table does not exist yet (apply the DDL in schema-proposal.sql in a write turn); every slice is UNRECORDED.`);
  let stale = 0, unrecorded = 0, ok = 0;
  for (const s of slices) {
    if (s.status === "STALE") stale++; else if (s.status === "UNRECORDED") unrecorded++; else ok++;
    const tag = s.status === "ok" ? "ok         " : s.status === "STALE" ? "STALE      " : "UNRECORDED ";
    console.log(`    ${tag}${s.connectionType} / ${s.sourceRepo}: ${s.edgeCount} edge(s)${s.builtAt ? `, state recorded ${s.builtAt}` : ""}${s.reasons.length ? ` -- ${s.reasons.join("; ")}` : ""}`);
  }
  console.log(stale === 0 && unrecorded === 0
    ? `  all ${ok} slice(s) ok: every recorded input fact set is the current one`
    : `  ${ok} ok, ${stale} STALE (rebuild with pipeline:edges), ${unrecorded} UNRECORDED (freshness unknown until pipeline:edges runs)`);
  return { stale, unrecorded, ok };
}

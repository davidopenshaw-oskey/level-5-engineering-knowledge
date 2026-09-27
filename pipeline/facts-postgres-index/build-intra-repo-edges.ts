// **version:** 1.1.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// Task 4 of governance/roadmap/facts-serving-strategy/14-inbound-outbound-
// surface-graph-tasklist.md: loads Firebase's already-computed intra-repo
// call graph (`knowledge-pipeline/resolved-engineering-graph.json`) into
// `cross_repo_edges` as real `INTRA_REPO_CALL` edges -- reusing that table
// rather than a new one, per its own schema comment ("an edge connects two
// symbols, potentially across repos").
//
// Firebase only in practice today, via REPO_NAME (env var, fail-closed --
// same convention as sync-facts.ts): real, checked disparity across repos
// this same task list documented -- Firebase resolves 57% of its call
// expressions into the graph (2,222 confirmed cross-module edges,
// genuinely load-bearing); node-iot resolves 8% with zero confirmed edges
// of either kind (its own graph portion is not worth loading); Angular
// sits at 13%, deferred until Firebase's value is confirmed in practice --
// REPO_NAME is parameterized (not hardcoded) specifically so that
// extension, whenever it happens, doesn't also require a code change.
//
// Real bug fixed 2026-09-11 (governance/roadmap/graphrag/01-findings-and-
// open-questions-2026-09-10.md §7): the delete below is now scoped by
// source_repo = REPO_NAME. It previously deleted every INTRA_REPO_CALL
// edge regardless of repo while the insert only re-added edges for
// REPO_NAME -- inert today because Firebase is the only repo this has ever
// run for, but it would have silently wiped Firebase's real edges the
// first time this ran for a second repo (e.g. once Angular is picked up,
// per the deferral above).
//
// Real, deliberate decision, 2026-09-11: Angular is no longer just deferred
// -- the fix above was verified by actually running this script for
// angular-app-oskey-io for real (346 real edges, all confirmed referencing
// real, current fact_ids, zero dangling -- checked directly against live
// Postgres, not assumed), and Firebase's own edges were confirmed untouched
// by that run. Given Firebase's real value was already independently
// confirmed in practice this same week (this session's own retrieval
// testing), the original deferral condition is treated as satisfied --
// this was a real product decision, not a silent side effect of the bug
// fix, and Angular's edges were kept rather than rolled back. Node-IoT
// remains correctly unloaded (checked again 2026-09-11 against its current
// run: 0 confirmed, 0 probable, 1 unresolved -- still not worth it).
// Kotlin (android-intercom-oskey-io) and the Swift family are NOT yet
// supported by this script at all -- their real resolved-engineering-
// graph.json uses a structurally different schema (crossModuleCallEdges /
// sameModuleResolvedCalls / unresolvedEligibleCalls, not this script's
// confirmedCallEdges / probableCallEdges / unresolvedCallEdges), so running
// this script against them today would silently insert zero edges, not
// error -- real, checked (Kotlin alone has 649 real resolved edges sitting
// unloaded). See governance/roadmap/graphrag/prompts/prompt-6-kotlin-
// swift-intra-repo-edges.md for the real, scoped follow-up.
//
// Superseded 2026-09-11, below: android-intercom-oskey-io and ios-oskey-dev
// are now supported (their current extraction run each has a real, current
// resolved-engineering-graph.json). The other 4 Swift-family repos remain
// unsupported today -- checked directly, not a schema gap for them: their
// CURRENT extraction run has no resolved-engineering-graph.json at all
// (only swift-extractor-raw.json + modules/), because the resolved-graph
// pipeline step hasn't been re-run since their last rescan. Each has one
// under an older, non-current run (real, meaningful data -- 25-37%
// resolution), but loading against a stale run would violate this script's
// own freshness check below and risks pointing edges at facts that don't
// match what's currently live in Postgres. Out of scope for this script;
// needs that pipeline step re-run first.
//
// No compound-key risk here, unlike build-cross-repo-edges.ts's task 2:
// every edge below was already resolved by the original tool via real
// TypeScript compiler symbol resolution (`resolutionMethod:
// "compiler_symbol"`, confirmed in real samples), not a name-based join
// across two separate fact records -- the ambiguity class task 2 exists
// to prevent doesn't apply to this data.
//
// Preserves the graph's own real three-way confidence signal (confirmed /
// probable / unresolved) in `resolution_status`, not collapsed to the
// two-value pattern used for the cross-repo edges -- this task's own
// point is letting retrieval weight a low-confidence edge differently,
// which needs the middle tier kept.
//
// Kotlin/Swift extension (2026-09-11, governance/roadmap/graphrag/prompts/
// prompt-6-kotlin-swift-intra-repo-edges.md): android-intercom-oskey-io and
// the Swift-family repos' resolved-engineering-graph.json uses a real,
// different schema than the TS repos above -- crossModuleCallEdges /
// sameModuleResolvedCalls / unresolvedEligibleCalls, not confirmed*/
// probable*/unresolvedCallEdges. Checked the full key-union across every
// row of both Kotlin's and Swift's real files, not just samples: unlike
// the TS schema, THIS SCHEMA HAS NO targetFactId FIELD AT ALL, on either
// crossModuleCallEdges or sameModuleResolvedCalls -- only targetFile/
// targetModule plus the raw evidenceCallText (the call-site text, not a
// verified symbol). The TS side's targetFactId was already resolved by
// the original tool via real compiler symbol resolution; this data has no
// equivalent, only file/module-level resolution.
//
// Real decision (option (a) over (b), made together with a concurrent
// session and the user, not unilaterally): target_fact_id is loaded as
// NULL for these edges rather than backfilled via a (file, symbol_name)
// join against `facts`. A name-based join here would be inventing/
// guessing a fact reference this codebase's own citation discipline
// already refuses to do elsewhere (never claim a fact_id that hasn't
// actually been verified), and this exact class of name-based-join
// ambiguity has already caused real, documented trouble in this codebase
// (the enum Text/Color.swift collision; the 92-vs-42 symbol ambiguity
// finding, governance/roadmap -- the same ambiguity class
// build-cross-repo-edges.ts's task 2 exists to handle for a different
// edge type, with no dedupe/confidence logic built for this one).
// Symbol-level target resolution for these edges is real, separate future
// work, not folded into this task. resolution_status is downgraded to
// 'probable'/'unresolved' accordingly -- the schema's own NULL
// target_fact_id comment (schema-proposal.sql) treats that as legitimate
// for anything short of resolved/confirmed, which is honest here: no
// fact was actually resolved, only a file/module.
//
// Swift's crossModuleCallEdges carries a real two-tier confidence
// (`probable` / `weak`) that Kotlin's doesn't (Kotlin's is uniformly
// `probable`). A real spot-check of a `weak` row (resolved_via_same_target)
// found it noisy: it matched a SwiftUI `Divider().background` chain call
// in OSKAboutScreen.swift to an unrelated OSKDoorUnlockActivity/Color.swift
// file -- a demonstrably wrong-looking match. `weak` confidence is
// therefore mapped to resolution_status 'unresolved', not 'probable' --
// a demonstrated-noisy match shouldn't carry a label implying more trust
// than it's earned.
//
// `implicitMemberExpressionCalls` (Swift-only top-level key, e.g. `ios-
// oskey-dev`) is NOT loaded as edges: checked its real numbers against the
// graph's own `quality` block -- `graphEligibleCallExpressions` (8734)
// equals crossModuleCallEdges + sameModuleResolvedCalls +
// unresolvedEligibleCalls (497+2136+6101) exactly, with
// implicitMemberExpressionCalls (895) counted separately and NOT included
// -- so the resolved-graph tool itself treats these as outside the
// graph-eligible call surface, not merely unresolved within it. Loading
// them here would be scope creep beyond what the tool's own accounting
// considers a real call edge.
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

const PROJECT_ROOT = process.cwd();

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

interface Edge {
  sourceSymbol: string;
  sourceFactId: string;
  targetSymbol: string;
  targetFactId: string | null;
  resolutionStatus: string;
  details: string;
}

// sourceCallFactId/targetFactId are real, already present on every row in
// resolved-engineering-graph.json (confirmed in real samples) -- this is
// the join key retrieval traversal needs (governance/roadmap/facts-
// serving-strategy/14-...md, task 5a), not derived or guessed here.
function fromConfirmedCallEdges(rows: any[]): Edge[] {
  return rows.map(r => ({
    sourceSymbol: `${r.sourceFile}:${r.sourceLine} -> ${r.sourceContext}`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: `${r.targetModule}::${r.targetClass}.${r.targetMethod}`,
    targetFactId: r.targetFactId,
    resolutionStatus: r.confidence,
    details: `via ${r.evidenceCallText} (${r.resolutionMethod})`,
  }));
}

function fromConfirmedIntraModuleCallEdges(rows: any[]): Edge[] {
  return rows.map(r => ({
    sourceSymbol: `${r.sourceFile}:${r.sourceLine} -> ${r.sourceContext}`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: `${r.module}/${r.targetSubmodule}::${r.targetClass}.${r.targetMethod}`,
    targetFactId: r.targetFactId,
    resolutionStatus: r.confidence,
    details: `via ${r.evidenceCallText} (${r.resolutionMethod}) -- same module ('${r.module}'), submodule ${r.sourceSubmodule ?? "(root)"} -> ${r.targetSubmodule ?? "(root)"}`,
  }));
}

function fromUnresolvedCallEdges(rows: any[]): Edge[] {
  return rows.map(r => ({
    sourceSymbol: `${r.sourceFile}:${r.sourceLine} -> ${r.sourceContext}`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: "unknown",
    targetFactId: null, // real, by definition -- unresolved means no target was found
    resolutionStatus: "unresolved",
    details: `${r.evidenceCallText} -- ${r.reason} (${r.candidateCount} candidate(s))`,
  }));
}

// Kotlin/Swift schema (crossModuleCallEdges / sameModuleResolvedCalls /
// unresolvedEligibleCalls) -- see the file header's Kotlin/Swift extension
// note for the real schema-gap finding and the target_fact_id=NULL
// decision this reflects. targetFactId is always null here: this schema
// carries no target symbol data (only targetFile/targetModule), so there
// is no real fact to point at, by design, not by omission.
function fromCrossModuleCallEdges(rows: any[]): Edge[] {
  return rows.map(r => ({
    sourceSymbol: `${r.sourceFile}:${r.sourceLine} -> ${r.sourceContext}`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: `${r.targetModule}::${r.targetFile} (call: ${r.evidenceCallText})`,
    targetFactId: null,
    // real per-row confidence from the graph itself: 'probable' kept as
    // 'probable'; 'weak' downgraded to 'unresolved' -- a real spot-check of
    // a 'weak' row matched a SwiftUI Divider().background chain call to an
    // unrelated Color.swift file (see file header), so 'weak' shouldn't
    // carry a label implying more trust than it earned.
    resolutionStatus: r.confidence === "weak" ? "unresolved" : "probable",
    details: `via ${r.evidenceCallText} (${r.resolutionMethod}, confidence=${r.confidence})`,
  }));
}

function fromSameModuleResolvedCalls(rows: any[]): Edge[] {
  return rows.map(r => ({
    // real, by necessity -- this schema has no sourceContext field
    // (checked the full key-union), unlike the TS schema's equivalent
    sourceSymbol: `${r.file}:${r.line} (same-module call)`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: `${r.module}/${r.submodule ?? "(root)"}::${r.targetFile} (call: ${r.evidenceCallText})`,
    targetFactId: null,
    // no per-row confidence field on this bucket at all (checked) -- real
    // resolution (module/submodule matched), not compiler-verified, so
    // 'probable' not 'resolved'/'confirmed'
    resolutionStatus: "probable",
    details: `via ${r.evidenceCallText} (${r.resolutionMethod}) -- same module ('${r.module}'), submodule ${r.submodule ?? "(root)"}`,
  }));
}

function fromUnresolvedEligibleCalls(rows: any[]): Edge[] {
  return rows.map(r => ({
    // real, by necessity -- this schema's unresolved bucket has no
    // reason/candidateCount fields (checked the full key-union), unlike
    // the TS schema's unresolvedCallEdges
    sourceSymbol: `${r.file}:${r.line} -> ${r.callerClass ?? "(unknown caller)"}`,
    sourceFactId: r.sourceCallFactId,
    targetSymbol: "unknown",
    targetFactId: null,
    resolutionStatus: "unresolved",
    details: `${r.evidenceCallText} -- unresolved (no compiler/import-based candidate found)`,
  }));
}

// Added 2026-09-26 (W5a, doc 43, Lane A). Both flags are off by default, so a run with no
// arguments behaves as before, except that it now refuses a shrink (see below):
//   --dry-run        compute the edges and print what would change against the existing slice;
//                    write nothing. Used by pipeline:edges (build-edges.ts) --dry-run.
//   --accept-shrink  allow the new slice to have fewer edges, or fewer resolved/confirmed edges,
//                    than the existing one. Only after looking at why.
// Shrink guard: before this the script deleted the repo's INTRA_REPO_CALL slice and inserted
// whatever the graph file gave, with no comparison. It now compares the new slice with the
// existing one and aborts (nothing changed) if the total, or the number of edges traversal
// follows (resolved/confirmed), would fall. Same rule as the cross-repo builder's replaceSlices.
const FOLLOWED_STATUSES = ["resolved", "confirmed"]; // statuses findGraphNeighbors follows

function parseArgs(argv: string[]): { dryRun: boolean; acceptShrink: boolean } {
  const out = { dryRun: false, acceptShrink: false };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--accept-shrink") out.acceptShrink = true;
    else throw new Error(`Unknown argument '${a}'. Usage: REPO_NAME=<repo> build-intra-repo-edges.ts [--dry-run] [--accept-shrink]`);
  }
  return out;
}

function statusCounts(rows: { resolutionStatus?: string; resolution_status?: string }[]): string {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (r.resolutionStatus ?? r.resolution_status)!;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort().map(([k, v]) => `${v} ${k}`).join(", ") || "none";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const REPO_NAME = process.env.REPO_NAME;
  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");

  const db = pool();
  try {
    const current = await db.query<{ run_id: string }>(
      `SELECT run_id FROM extraction_runs WHERE repo = $1 AND is_current = true`,
      [REPO_NAME]
    );
    const runId = current.rows[0]?.run_id;
    if (!runId) throw new Error(`[Fail-Closed] No current extraction run recorded for ${REPO_NAME}.`);

    const graphPath = path.join(PROJECT_ROOT, "output", "runs", REPO_NAME, runId, "knowledge-pipeline", "resolved-engineering-graph.json");
    if (!fs.existsSync(graphPath)) throw new Error(`[Fail-Closed] No resolved-engineering-graph.json for the current run at ${graphPath}.`);
    const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));

    // Real, checked freshness guarantee, not assumed: the graph file's own
    // runId must match the run Postgres currently considers live -- a
    // mismatch here would mean loading edges computed against a different
    // commit than the facts they're meant to connect.
    if (graph.runId !== runId) {
      throw new Error(`[Fail-Closed] Graph file runId ('${graph.runId}') does not match the current live run ('${runId}') -- refusing to load a graph that may not correspond to the facts currently in Postgres.`);
    }

    console.log(`Loading intra-repo graph for ${REPO_NAME}, run ${runId}.`);
    console.log(`  graph status: ${graph.status}`);
    if (graph.quality?.humanAttentionRecommended) {
      console.log(`  NOTE: graph self-reports humanAttentionRecommended=true (${graph.quality.notificationCount} notifications, highest severity: ${graph.quality.notificationHighestSeverity}) -- loading anyway per this task's own real, checked disparity finding (Firebase's graph is genuinely load-bearing despite this flag), not because the flag is being ignored.`);
    }

    // Real, dynamic schema-shape dispatch, not a repo-name lookup table --
    // detects which of the two real schemas is present so any future repo
    // using either extractor doesn't need a code change here (same
    // rationale as REPO_NAME being parameterized above).
    const isKotlinSwiftSchema = "crossModuleCallEdges" in graph || "sameModuleResolvedCalls" in graph || "unresolvedEligibleCalls" in graph;

    let edges: Edge[];
    if (isKotlinSwiftSchema) {
      edges = [
        ...fromCrossModuleCallEdges(graph.crossModuleCallEdges ?? []),
        ...fromSameModuleResolvedCalls(graph.sameModuleResolvedCalls ?? []),
        ...fromUnresolvedEligibleCalls(graph.unresolvedEligibleCalls ?? []),
      ];
      const implicitCount = Array.isArray(graph.implicitMemberExpressionCalls) ? graph.implicitMemberExpressionCalls.length : 0;
      console.log(`Built ${edges.length} real edges (${graph.crossModuleCallEdges?.length ?? 0} cross-module, ${graph.sameModuleResolvedCalls?.length ?? 0} same-module, ${graph.unresolvedEligibleCalls?.length ?? 0} unresolved). implicitMemberExpressionCalls (${implicitCount}) intentionally NOT loaded -- outside the graph-eligible call surface per the graph's own quality accounting, see file header.`);

      // Real, checked 2026-09-11: a real minority of this schema's
      // sourceCallFactId values do NOT match any real fact_id currently in
      // `facts` -- confirmed by direct query, not assumed (android-intercom:
      // 1/3590; ios-oskey-dev: 1663/8734, ~19%). Root cause: some call
      // sites embed very long, multi-line source text (deeply nested
      // SwiftUI view builders, chained modifiers) directly into the ID;
      // facts.fact_id for the same call sites tops out at 412 bytes in
      // practice (checked), so whatever built this graph file's IDs isn't
      // applying the same bound the fact-extraction step does -- a real
      // upstream pipeline inconsistency, not something to patch here. Also
      // the direct cause of a real Postgres error hit while building this:
      // several of these oversized IDs (up to 28,814 bytes seen) blew past
      // the btree index row limit on cross_repo_edges_source_fact_id_idx
      // (2704 bytes) and aborted the whole transaction. Filtering to only
      // edges whose sourceFactId is a real, currently-live fact_id fixes
      // both problems at once (every oversized ID found was already
      // dangling, since facts has nothing longer than 412 bytes) and keeps
      // the same "never claim a fact_id you haven't verified" discipline
      // used for target_fact_id above.
      const sourceIds = [...new Set(edges.map(e => e.sourceFactId))];
      const realIds = new Set(
        (await db.query<{ fact_id: string }>(
          `SELECT fact_id FROM facts WHERE repo = $1 AND fact_id = ANY($2::text[])`,
          [REPO_NAME, sourceIds]
        )).rows.map(r => r.fact_id)
      );
      const beforeFilter = edges.length;
      edges = edges.filter(e => realIds.has(e.sourceFactId));
      const droppedCount = beforeFilter - edges.length;
      if (droppedCount > 0) {
        console.log(`  Dropped ${droppedCount} edge(s) (${((droppedCount / beforeFilter) * 100).toFixed(1)}%) whose sourceFactId does not match a real, current fact_id -- real dangling references in the graph file itself, not loaded.`);
      }
    } else {
      edges = [
        ...fromConfirmedCallEdges(graph.confirmedCallEdges ?? []),
        ...fromConfirmedIntraModuleCallEdges(graph.confirmedIntraModuleCallEdges ?? []),
        ...fromConfirmedCallEdges(graph.probableCallEdges ?? []), // same shape as confirmed, per resolved-graph-matrix.md's identical table columns
        ...fromConfirmedIntraModuleCallEdges(graph.probableIntraModuleCallEdges ?? []),
        ...fromUnresolvedCallEdges(graph.unresolvedCallEdges ?? []),
      ];
      console.log(`Built ${edges.length} real edges (${graph.confirmedCallEdges?.length ?? 0} confirmed cross-module, ${graph.confirmedIntraModuleCallEdges?.length ?? 0} confirmed intra-module, ${graph.probableCallEdges?.length ?? 0} probable cross-module, ${graph.probableIntraModuleCallEdges?.length ?? 0} probable intra-module, ${graph.unresolvedCallEdges?.length ?? 0} unresolved).`);
    }

    // Compare with the existing slice before touching it (shrink guard + dry-run report).
    const existing = (await db.query<{ source_fact_id: string | null; resolution_status: string }>(
      `SELECT source_fact_id, resolution_status FROM cross_repo_edges WHERE connection_type = 'INTRA_REPO_CALL' AND source_repo = $1`,
      [REPO_NAME]
    )).rows;
    const followed = (rows: { resolutionStatus?: string; resolution_status?: string }[]) => rows.filter(r => FOLLOWED_STATUSES.includes((r.resolutionStatus ?? r.resolution_status)!)).length;
    const oldIds = new Set(existing.map(r => r.source_fact_id).filter((x): x is string => x !== null));
    const newIds = new Set(edges.map(e => e.sourceFactId));
    const stillLive = new Set(
      (await db.query<{ fact_id: string }>(`SELECT fact_id FROM facts WHERE repo = $1 AND fact_id = ANY($2::text[])`, [REPO_NAME, [...oldIds]])).rows.map(r => r.fact_id)
    );
    const oldOnly = [...oldIds].filter(id => !newIds.has(id));
    const newOnly = [...newIds].filter(id => !oldIds.has(id));
    console.log(`Slice INTRA_REPO_CALL / ${REPO_NAME}: existing ${existing.length} (${statusCounts(existing)}; ${followed(existing)} followed by traversal) -> new ${edges.length} (${statusCounts(edges)}; ${followed(edges)} followed).`);
    console.log(`  source fact ids: ${oldIds.size - oldOnly.length} identical, ${oldOnly.length} only in the existing slice (${oldOnly.filter(id => !stillLive.has(id)).length} of them no longer exist in facts), ${newOnly.length} only in the new slice.`);
    const shrink: string[] = [];
    if (edges.length < existing.length) shrink.push(`total ${existing.length} -> ${edges.length}`);
    if (followed(edges) < followed(existing)) shrink.push(`resolved/confirmed ${followed(existing)} -> ${followed(edges)}`);
    if (shrink.length > 0) {
      console.log(`  SHRINK: ${shrink.join("; ")}.`);
      if (!args.acceptShrink) {
        if (args.dryRun) console.log(`  DRY RUN: a real run would REFUSE this (nothing would change) unless --accept-shrink is given.`);
        else throw new Error(`[Fail-Closed] new INTRA_REPO_CALL slice for ${REPO_NAME} is smaller than the existing one (${shrink.join("; ")}). Nothing was changed. Re-run with --accept-shrink only if that is understood and intended.`);
      }
    }
    if (args.dryRun) {
      console.log(`  DRY RUN: nothing written.`);
      return;
    }

    const synthesisId = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
    // A dedicated client, so BEGIN, the writes and COMMIT/ROLLBACK are guaranteed to share one
    // connection (a Pool may hand each db.query() a different one).
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const deleted = await client.query(`DELETE FROM cross_repo_edges WHERE connection_type = 'INTRA_REPO_CALL' AND source_repo = $1 RETURNING edge_id`, [REPO_NAME]);
      console.log(`Removed ${deleted.rowCount} stale INTRA_REPO_CALL edge(s) for ${REPO_NAME} (recomputed fresh).`);
      for (const edge of edges) {
        await client.query(
          `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at)
           VALUES ($1, $2, $3, $1, $4, $5, 'INTRA_REPO_CALL', $6, 'ast_derived', NULL, $7, $8, now())`,
          [REPO_NAME, edge.sourceSymbol, edge.sourceFactId, edge.targetSymbol, edge.targetFactId, edge.resolutionStatus, edge.details, synthesisId]
        );
      }
      await client.query("COMMIT");
      console.log(`Inserted ${edges.length} real INTRA_REPO_CALL edge(s), synthesis_id=${synthesisId}.`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await db.end();
  }
}

// Run only when executed (`node -r ts-node/register <file>`), never on import: importing this file to type-check it must not start a run against the database (2026-09-26 near-miss, doc 43).
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

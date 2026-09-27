// **version:** 1.0.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// `npm run pipeline:edges` -- the one entry point for rebuilding every edge in cross_repo_edges
// (W5a, governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-
// wiki-handoff-2026-09-26.md). Edges are computed from the facts in Postgres, so they go stale
// whenever a repo is re-synced (Stage B) and nobody rebuilds them; this runs the builders in
// the one correct order and records, per slice, which fact sets the edges were built from
// (edge_sync_state, W5b, _shared/edge-sync-state.ts), so "stale" is judged from the facts and
// never from a timestamp.
//
// It ORCHESTRATES the existing builders as child processes and changes none of their edge logic:
//   1. intra:   build-intra-repo-edges.ts once per eligible repo (INTRA_REPO_CALL)
//   2. cross:   build-cross-repo-edges.ts, every join (own preflight, shrink guard, scoped replace)
//   3. lineage: build-form-field-lineage-edges.ts (FIELD_BINDING; needs step 2's HTTP_API_CALL)
// then records edge_sync_state for the slices that were rewritten and prints the coverage
// summary (whole table, read-only) with the edge-sync report.
//
// An intra repo is eligible when: it has a current extraction run in Postgres; that run has a
// resolved-engineering-graph.json whose runId equals the current run; and config/repos.json does
// not switch it off (`intraRepoEdges.enabled: false` with a `reason`). Repos are discovered from
// extraction_runs; no repo name is written in this file. A repo switched off in config is printed
// with its reason on every run, together with a note if its graph now has confirmed/probable edges.
//
// Flags:
//   --repos=a,b      limit the intra step to these repos (cross and lineage are global joins)
//   --steps=intra,cross,lineage   run only these steps, in that order (default: all three)
//   --dry-run        compute and print, write nothing (no edge_sync_state either). The lineage builder
//                    has no dry run and is not changed by this work, so that step is reported, not run.
//   --accept-shrink  passed to the intra and cross builders; only after looking at why an edge set shrinks
//   --fail-on-stale  exit 1 if any slice is STALE at the end (UNRECORDED slices are reported, not failed)
//
// Idempotent: every builder replaces exactly its own slices, so a second run leaves the edge table
// identical (only edge_id / synthesis_id / generated_at change). Real runs need the edge_sync_state
// table (edge-sync-state.sql) and, under the lane protocol in doc 43, a granted write turn.
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { Pool } from "pg";
import { edgeSyncTableExists, evaluateSlices, printEdgeSyncReport, recordEdgeSyncState, repoFingerprints, sliceMarkers } from "./_shared/edge-sync-state";

const ROOT = path.resolve(__dirname, "..", ".."); // repo root: the builders resolve output/ from their cwd
const HERE = __dirname;
const STEPS = ["intra", "cross", "lineage"] as const;
type Step = (typeof STEPS)[number];
// All three steps run by default. Lineage was opt-in for a few hours on 2026-09-26: its type-alias lookup had
// no repo filter and no ORDER BY, so a run silently dropped the allowed values from a live FIELD_BINDING row
// (OSKBuildingUnitInhabitantType is a type_alias in two repos). Fixed in build-form-field-lineage-edges.ts
// v1.0.1 and proven (scratch copy, then live twice: baseline row set reproduced, second run identical), so it
// is the default again.
const DEFAULT_STEPS: Step[] = [...STEPS];
// FIELD_BINDING is written by the lineage builder, which is not orchestrated part-way: if it fails its slice is not recorded.
const LINEAGE_CONNECTION_TYPE = "FIELD_BINDING";

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

interface Args { repos: string[]; steps: Step[]; dryRun: boolean; acceptShrink: boolean; failOnStale: boolean }

function parseArgs(argv: string[]): Args {
  const out: Args = { repos: [], steps: [...DEFAULT_STEPS], dryRun: false, acceptShrink: false, failOnStale: false };
  for (const a of argv) {
    if (a.startsWith("--repos=")) out.repos.push(...a.slice("--repos=".length).split(",").filter(Boolean));
    else if (a.startsWith("--steps=")) {
      const want = a.slice("--steps=".length).split(",").filter(Boolean);
      const bad = want.filter(w => !(STEPS as readonly string[]).includes(w));
      if (bad.length > 0) throw new Error(`Unknown --steps value(s): ${bad.join(", ")}. Steps: ${STEPS.join(", ")}`);
      out.steps = STEPS.filter(s => want.includes(s));
    } else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--accept-shrink") out.acceptShrink = true;
    else if (a === "--fail-on-stale") out.failOnStale = true;
    else throw new Error(`Unknown argument '${a}'. Usage: [--repos=a,b] [--steps=intra,cross,lineage] [--dry-run] [--accept-shrink] [--fail-on-stale]`);
  }
  return out;
}

// Runs a sibling script exactly as a person would (`node -r ts-node/register <script>`), output streamed.
function runScript(script: string, args: string[], env: Record<string, string> = {}): number {
  const r = spawnSync(process.execPath, ["-r", "ts-node/register", path.join(HERE, script), ...args], { cwd: ROOT, env: { ...process.env, ...env }, stdio: "inherit" });
  return r.status ?? 1;
}

interface RepoConfig { name: string; intraRepoEdges?: { enabled?: boolean; reason?: string } }
function loadRepoConfig(): Map<string, RepoConfig> {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "repos.json"), "utf8"));
  const list: RepoConfig[] = Array.isArray(j.repositories) ? j.repositories : Object.values(j.repositories ?? {});
  return new Map(list.map(r => [r.name, r]));
}

// Confirmed/probable call edges in a resolved graph, for the "a skipped repo's graph has improved" note.
// The two graph schemas are told apart the way build-intra-repo-edges.ts tells them apart.
function usableEdgeCount(graph: any): number {
  const len = (k: string) => (Array.isArray(graph[k]) ? graph[k].length : 0);
  const kotlinSwift = "crossModuleCallEdges" in graph || "sameModuleResolvedCalls" in graph || "unresolvedEligibleCalls" in graph;
  if (kotlinSwift) return len("crossModuleCallEdges") + len("sameModuleResolvedCalls");
  return Object.keys(graph).filter(k => /^(confirmed|probable)/.test(k)).reduce((n, k) => n + len(k), 0);
}

interface IntraPlan { repo: string; runId: string }

async function planIntra(db: Pool, args: Args): Promise<IntraPlan[]> {
  const cfg = loadRepoConfig();
  const current = (await db.query<{ repo: string; run_id: string }>(`SELECT repo, run_id FROM extraction_runs WHERE is_current ORDER BY repo`)).rows;
  const unknown = args.repos.filter(r => !current.some(c => c.repo === r));
  if (unknown.length > 0) throw new Error(`--repos names a repo with no current extraction run: ${unknown.join(", ")}. Known: ${current.map(c => c.repo).join(", ")}`);
  const plan: IntraPlan[] = [];
  console.log(`\n=== intra-repo call edges: eligibility (current run + resolved graph whose runId matches + not switched off in config/repos.json)`);
  for (const { repo, run_id } of current) {
    if (args.repos.length > 0 && !args.repos.includes(repo)) { console.log(`  skip     ${repo}: not in --repos`); continue; }
    const graphFile = path.join(ROOT, "output", "runs", repo, run_id, "knowledge-pipeline", "resolved-engineering-graph.json");
    const off = cfg.get(repo)?.intraRepoEdges;
    if (off && off.enabled === false) {
      let note = "";
      if (fs.existsSync(graphFile)) {
        const g = JSON.parse(fs.readFileSync(graphFile, "utf8"));
        const n = usableEdgeCount(g);
        note = n > 0 ? ` NOTE: its graph now has ${n} confirmed/probable edge(s): the reason above may no longer hold, review config/repos.json.` : ` (its graph still has 0 confirmed/probable edges)`;
      } else note = ` (no graph file for the current run)`;
      console.log(`  skip     ${repo}: switched off in config/repos.json -- ${off.reason ?? "(no reason given)"}${note}`);
      continue;
    }
    if (!fs.existsSync(graphFile)) { console.log(`  skip     ${repo}: run ${run_id} has no resolved-engineering-graph.json (run step 04 for it)`); continue; }
    const graphRun = JSON.parse(fs.readFileSync(graphFile, "utf8")).runId;
    if (graphRun !== run_id) { console.log(`  skip     ${repo}: graph runId '${graphRun}' differs from the current run '${run_id}' (re-run 04 for the current run)`); continue; }
    console.log(`  eligible ${repo}: run ${run_id}`);
    plan.push({ repo, runId: run_id });
  }
  return plan;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = pool();
  let failures = 0;
  try {
    console.log(`pipeline:edges ${args.dryRun ? "(DRY RUN: nothing is written) " : ""}steps: ${args.steps.join(", ")}`);
    const hasTable = await edgeSyncTableExists(db);
    if (!args.dryRun && !hasTable) {
      throw new Error(`[Fail-Closed] the edge_sync_state table does not exist. Apply pipeline/facts-postgres-index/edge-sync-state.sql (a schema change: only in a granted write turn) before a real run. Nothing was changed.`);
    }

    // Fact-set fingerprints and slice markers are taken BEFORE any builder runs; they are what the
    // builders will read. Compared again at the end: if a fact set moved during the run, no state is recorded.
    const fpStart = await repoFingerprints(db);
    const before = await sliceMarkers(db);
    const fieldBindingBefore = Number((await db.query<{ n: string }>(`SELECT count(*)::text n FROM cross_repo_edges WHERE connection_type = $1`, [LINEAGE_CONNECTION_TYPE])).rows[0].n);
    console.log(`  fact sets fingerprinted: ${[...fpStart.entries()].map(([r, f]) => `${r} ${f.factCount}`).join(", ")}`);

    let lineageFailed = false;
    if (args.steps.includes("intra")) {
      const plan = await planIntra(db, args);
      for (const p of plan) {
        console.log(`\n=== intra ${p.repo}`);
        const code = runScript("build-intra-repo-edges.ts", [...(args.dryRun ? ["--dry-run"] : []), ...(args.acceptShrink ? ["--accept-shrink"] : [])], { REPO_NAME: p.repo });
        if (code !== 0) { console.error(`  intra ${p.repo} FAILED (exit ${code}); its slice is unchanged.`); failures++; }
      }
    }
    let crossFailed = false;
    if (args.steps.includes("cross")) {
      console.log(`\n=== cross-repo joins (build-cross-repo-edges.ts, all joins)`);
      const code = runScript("build-cross-repo-edges.ts", ["--no-summary", ...(args.dryRun ? ["--dry-run"] : []), ...(args.acceptShrink ? ["--accept-shrink"] : [])]);
      if (code !== 0) { console.error(`  cross-repo joins: at least one join did not complete (exit ${code}); see above. Joins that failed left their slices unchanged.`); failures++; crossFailed = true; }
    }
    if (args.steps.includes("lineage")) {
      console.log(`\n=== form-field lineage (build-form-field-lineage-edges.ts)`);
      if (args.dryRun) console.log(`  not run in a dry run: this builder has no dry-run mode and is deliberately not changed by W5a. ${fieldBindingBefore} FIELD_BINDING edge(s) exist now.`);
      else if (crossFailed) { console.error(`  SKIPPED: it reads the HTTP_API_CALL edges and a cross-repo join failed above.`); failures++; lineageFailed = true; }
      else {
        const code = runScript("build-form-field-lineage-edges.ts", []);
        if (code !== 0) { console.error(`  lineage FAILED (exit ${code}). It deletes and re-inserts FIELD_BINDING without a transaction: check the count below.`); failures++; lineageFailed = true; }
        const after = Number((await db.query<{ n: string }>(`SELECT count(*)::text n FROM cross_repo_edges WHERE connection_type = $1`, [LINEAGE_CONNECTION_TYPE])).rows[0].n);
        console.log(`  FIELD_BINDING edges: ${fieldBindingBefore} before -> ${after} after${after === fieldBindingBefore ? "" : "  <-- CHANGED, review"}`);
        if (after < fieldBindingBefore) { console.error(`  FIELD_BINDING FELL: restore it from the dump taken before this run if this is not understood.`); failures++; }
      }
    }

    if (!args.dryRun) {
      const fpEnd = await repoFingerprints(db);
      const moved = [...fpStart.entries()].filter(([r, f]) => fpEnd.get(r)?.fingerprint !== f.fingerprint).map(([r]) => r);
      if (moved.length > 0) {
        console.error(`\n  A fact set changed while the builders ran (${moved.join(", ")}): edge_sync_state NOT recorded. Someone synced during this run; re-run pipeline:edges.`);
        failures++;
      } else {
        const rec = await recordEdgeSyncState(db, before, fpStart, s => lineageFailed && s.connectionType === LINEAGE_CONNECTION_TYPE);
        console.log(`\n=== edge_sync_state recorded for ${rec.length} rewritten slice(s):${rec.length ? "\n" + rec.map(s => `    ${s.connectionType} / ${s.sourceRepo}`).join("\n") : " none"}`);
      }
    }

    // The final coverage summary: whole table, read-only, printed by the cross builder (it owns the
    // dangling / orphan / pair queries) and ending with the edge-sync report.
    console.log(`\n=== final coverage summary`);
    const code = runScript("build-cross-repo-edges.ts", ["--summary-only"]);
    if (code !== 0) failures++;
    if (args.failOnStale) {
      const stale = (await evaluateSlices(db)).slices.filter(s => s.status === "STALE");
      if (stale.length > 0) { console.error(`\n--fail-on-stale: ${stale.length} slice(s) STALE: ${stale.map(s => `${s.connectionType}/${s.sourceRepo}`).join(", ")}`); failures++; }
    }
  } finally {
    await db.end();
  }
  if (failures > 0) { console.error(`\npipeline:edges finished with ${failures} problem(s); see above.`); process.exit(1); }
}

// Run only when executed (`node -r ts-node/register <file>`), never on import: importing this file to type-check it must not start a run against the database (2026-09-26 near-miss, doc 43).
if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });

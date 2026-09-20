# Findings: hierarchical (fact→repo→cross-repo) routing investigation

Investigation run 2026-09-20, per the prompt in
`12-investigation-prompt-hierarchical-routing-2026-09-20.md`. Investigate only — no
building, no fixing, no LLM/embedding calls made. All findings below come from reading
pipeline source and direct read-only queries against the real local Postgres instance
(`facts-postgres-index-local`, confirmed running via `docker ps`) plus real files on disk
under `output/runs/`. No git commits made.

## Summary answer

Neither (a) nor cleanly (b)/(c) as the prompt framed them — the real state is a **split
between two genuinely separate aggregation mechanisms**, neither of which is embedded or
queryable today:

1. **`phase-02-inter-module-synthesis`** (LLM narrative synthesis, the mechanism the prompt
   named) — real code, but its actual output is **stale or entirely absent**, was never
   embedded, and was never persisted to Postgres. Closest to prompt scenario **(b)**, but
   "incomplete" undersells it — for 2 of 3 repos there is no live output on disk at all.
2. **A separate, currently-live Phase 1 stage** (`04-build-resolved-graph.ts` through
   `07-build-intra-module-coupling-graph.ts`, not named in the investigation prompt — found
   by checking what actually ran against the *current* facts run rather than trusting the
   prompt's framing) — runs fresh on every extraction, produces real intra-module,
   cross-module, and repo-level structural aggregates, but they're **relational/structural
   data (call edges, import graphs, RBAC lists), not narrative summaries**, and are also not
   embedded or in Postgres.

So: real hierarchical aggregation infrastructure exists in two different, incompatible
forms. Building semantic top-down routing needs new work regardless of which one (if
either) gets reused — see "What a real routing preview would look like" below, including a
third option this investigation surfaced that neither existing mechanism directly enables:
deriving a routing layer straight from the facts table itself, which is already fresh and
100%-embedded for every repo.

## 1. What `phase-02-inter-module-synthesis` actually computes

Read `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/03-run-full-phase2.ts`
(orchestrator) plus `01e-generate-module-level-profile.ts` and `02-generate-repo-report.ts`.

- It's real: per-module LLM synthesis (`01e`, one call per module, with a documented ~68%
  token reduction / ~10-15x speedup over the older `01a`+`01c` capability-fanout+reduce
  chain, per `03-run-full-phase2.ts`'s own comments citing
  `governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-plan.md`), then
  one repo-wide report (`02-generate-repo-report.ts`).
- Output mechanism: **`fs.writeFileSync` only** — grepped both scripts for
  `embedding|pgvector|INSERT INTO|pool.query|writeFileSync`; zero DB-write or embedding
  calls anywhere in `01e` or `02`. It writes markdown module profiles, API references, and a
  repo report to disk under `output/docs/`, nothing else.
- `sync-facts.ts` (the real script that populates Postgres) confirms the disconnect from its
  own side: its header comment states it reads **Phase 1** facts only and explicitly does
  **NOT** import anything from `phase-02-inter-module-synthesis/_shared/` — "this stays fully
  independent of the existing LLM-synthesis pipeline," per a documented 2026-09-02 scope
  agreement (`governance/roadmap/facts-serving-strategy/09-p2-build-tasklist.md`). Same
  independence confirmed from the embedding side: `mcp-server/db/embedding-adapter.ts`'s
  header says it's deliberately not part of, or imported by, any
  `phase-02-inter-module-synthesis/_shared/llm-adapter.ts`.

So phase-02's synthesis and the Postgres/pgvector facts index were built, on record, as two
deliberately separate systems. This isn't an oversight — it was a scope decision — but it
does mean nothing phase-02 produces is reachable by `search.ts` or
`capability-fanout-prd-agent.ts` today.

## 2. What's actually persisted in Postgres (direct queries, not code-reading)

Container `facts-postgres-index-local` confirmed running (`docker ps`, up 10 days). Queried
directly via `docker exec ... psql`.

**`SELECT DISTINCT kind FROM facts`** — 45 real kinds, all of them raw code-fact kinds
(`model_property`, `call_expression`, `enum_declaration`, `angular_component`,
`firestore_trigger`, `kotlin_sealed_hierarchy`, `struct_declaration`, etc.). Nothing that
looks like an aggregate/summary kind (no `module_summary`, `repo_report`, or similar).

**`\dt`** — the entire database has exactly 4 tables: `facts`, `cross_repo_edges`,
`embedding_calls`, `extraction_runs`. No other table holds module- or repo-level summaries.

**`\d facts`** — `embedding vector(768)` is a real column with a real HNSW index
(`facts_embedding_idx`). Checked actual coverage, not just schema:

```
SELECT repo, count(*) AS n_facts, count(embedding) AS n_embedded, max(updated_at) AS latest
FROM facts GROUP BY repo ORDER BY repo;

           repo            | n_facts | n_embedded |            latest
---------------------------+---------+------------+-------------------------------
 android-intercom-oskey-io |    9819 |       9819 | 2026-09-18 16:34:02.046495+00
 angular-app-oskey-io      |    8747 |       8747 | 2026-09-20 05:29:33.410054+00
 firebase-oskey-dev        |   15259 |      15259 | 2026-09-20 05:29:47.758921+00
 ios-oskey-dev             |   25458 |      25458 | 2026-09-11 12:55:09.962406+00
 node-iot-api-oskey-io     |    1432 |       1432 | 2026-09-20 05:29:52.853296+00
 swift-ble-kit-oskey-dev   |     799 |        799 | 2026-09-18 16:51:30.478132+00
 swift-cloud-kit-oskey-dev |    2522 |       2522 | 2026-09-18 16:34:29.306530+00
 swift-ui-kit-oskey-dev    |    2482 |       2482 | 2026-09-18 16:51:35.512885+00
 swift-webrtc-kit-oskey-io |    2487 |       2487 | 2026-09-18 16:51:49.618949+00
(9 rows)
```

All 9 repos are at 100% embedding coverage (`n_facts == n_embedded`), current as of today
for the 3 phase-02 repos. This is the real, live, fully-embedded index
`routeCapabilities()` searches — confirming the flat-search problem described in the
investigation prompt is querying genuinely complete individual-fact data, just with no
higher-level structure layered on top.

**`cross_repo_edges`** — real, 17,195 rows, `source_repo`/`target_repo`/
`connection_type`/`resolution_status` columns, generated `fact_ref` columns matching the
same SHA1-digest pattern as `facts.fact_ref`. Checked how it's actually used today: grepped
`capability-fanout-prd-agent.ts` — it's used only *after* `routeCapabilities()` has already
picked a module, to expand a chosen fact's direct graph neighbors for citation purposes
(line 237's tool description: "find their direct graph neighbors via `cross_repo_edges`...
Neighbors may belong to a different module or repo than your assigned... capability"). It is
**not** used as a top-of-funnel routing/candidacy signal — confirming the investigation
prompt's diagnosis precisely: repo/module relevance today is a side effect of flat
fact-level search, not an input to it.

## 3. Freshness and completeness of phase-02 output — checked live, not assumed

Memory (this project's own auto-memory, flagged in the prompt as possibly stale) claimed
phase-02 was "superseded 2026-09-18 ... all 3 phase-02 folders being decommissioned."
**Checked directly — that's not literally true; here's what actually is:**

- No `decommissioned_`-prefixed file or folder exists anywhere under any of the 3 phase-02
  directories (searched the whole repo for `*decommissioned*`; the 4 real hits are all
  unrelated files: `pipeline/facts-postgres-index/decommissioned_generate-atomic-prd.ts` and
  3 others under `archive/`/`governance/`). The phase-02 folders themselves are intact,
  un-renamed, and contain no internal decommission marker (`grep -r "decommission"` inside
  all 3 folders returns nothing).
- But they *are* orphaned in practice, confirmed by checking real output against the real
  current run, not by trusting the folder's existence:
  - `firebase-oskey-dev`: the only real phase-02 output ever found on disk
    (`_repo-report` under `output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/
    llm-comparison/gemini-default-temp0*/`) is from **2026-08-29**, inside an experimental
    `llm-comparison/` benchmarking subfolder (13+ sibling arm-comparison runs alongside it) —
    not a canonical production output path. The current, latest real facts run for this repo
    is `20260911_080454-00e1d9fd` (2026-09-11) — that run directory has **no** phase-02
    output at all (`find` for `repo-report`/`module-level-profile` under it: nothing). Last
    real code commit touching the phase-02 folder: `6b90167`, 2026-09-02 ("P2 Changing to
    vector driven fact tables using Postgres") — i.e. the code itself hasn't been touched
    since before the current Postgres/embedding pipeline (which only started existing
    ~2026-09-02 onward per `sync-facts.ts`'s own comment) was built out.
  - `angular-app-oskey-io` / `node-iot-api-oskey-io`: **zero** phase-02 output found on disk
    anywhere under `output/runs/` for either repo (`find` for `repo-report`/
    `module-level-profile`: no results). Last code commit touching either phase-02 folder:
    2026-08-31, predating the Postgres index entirely.
  - `README.md` inside the firebase phase-02 folder is itself stale — it references
    `05-generate-profiles-and-apis.ts`, `prompt-template.md`, `contract-inv002.md`, none of
    which exist in the current file listing (real files are `01a`/`01c`/`01d`/`01e`/`02`/
    `03` plus a `_shared/` folder and `contracts/*.md`).

**Verdict: phase-02's narrative-synthesis output is not "decommissioned" in the project's
own file-naming sense, but is real-world dead — no live output exists for 2 of 3 repos, and
the one real output that exists (firebase) predates and was never reconciled with the
current facts pipeline.** The memory entry's substance (phase-02 isn't a going concern) is
directionally correct even though the literal "decommissioned" framing / file-rename
convention doesn't apply here — worth correcting in memory after this session.

## 4. The mechanism the investigation prompt didn't name: Phase 1's own structural hierarchy

While confirming freshness in section 3, the current `20260911_080454-00e1d9fd` run
directory turned out to contain a `knowledge-pipeline/` folder that has **nothing to do with
phase-02** — grepping the codebase for its filenames (`resolved-engineering-graph`,
`cross-module-dependencies`, `intra-module-coupling`, `capability-packs`) traces it to real
Phase 1 scripts: `02-build-module-evidence.ts`, `04-build-resolved-graph.ts`,
`05-partition-capability-packs.ts`, `06-build-cross-module-dependency-graph.ts`,
`07-build-intra-module-coupling-graph.ts` — all under `phase-01-ast-extraction/`, not
phase-02. This is worth surfacing on its own because it's a second, independent answer to
the prompt's core question ("does real hierarchical aggregated data already exist") that the
prompt's own framing (built around phase-02) didn't anticipate.

**This is real and current, unlike phase-02's output**: `resolved-graph-matrix.md` for the
2026-09-11 run shows `generatedAt: 2026-09-20T05:21:04Z` — today, matching the Postgres
`facts.updated_at` timestamps in section 2 exactly. It runs as a normal part of Phase 1
extraction, present for `firebase-oskey-dev`, `angular-app-oskey-io`,
`node-iot-api-oskey-io`, and (checked directly) `android-intercom-oskey-io` too — but **not**
for `ios-oskey-dev` or any of the 4 Swift repos (checked directly: none of the 5
iOS/Swift-side script directories contain any `04`–`07`-equivalent script). This narrows —
but doesn't remove — the iOS/Android scope gap the investigation prompt flagged: Android
does get real structural (if not narrative) module/repo aggregation; iOS gets neither.

**What it actually contains, read directly from real output files:**
- `resolved-engineering-graph.json` (6.7MB) / `resolved-graph-matrix.md` — repo-wide:
  confirmed/probable/unresolved call edges (2,222 confirmed for firebase today), intra-module
  cross-submodule edges, API entry points (256), RBAC requirements (109), shared Firestore
  touch points, pub/sub routing tables. Pure structural/tabular data — a markdown table of
  `Source Module | Target Module | Target Method | Resolution Method`, no narrative
  description text anywhere in it.
- `modules/<module>/cross-module-dependencies.json` — per-module outbound/inbound edges to
  other modules with real touchpoint file/line/import evidence (e.g. `core`'s real file shows
  6 outbound + 11 inbound module dependencies with concrete import sites). Structural, not
  narrative.
- `modules/<module>/capability-packs/*.json` — despite the name, these are **not**
  synthesized summaries: `core/capability-packs/access.json`'s real content is literally a
  `summary: { factCount: 743 }` header followed by all 743 raw individual facts for that
  submodule, verbatim. This is exactly the "just re-packaged individual facts, not a real
  SUMMARY document" case the investigation prompt asked to distinguish (question 1) — and the
  answer for this mechanism is: repackaged, not synthesized.

**None of this is embedded or in Postgres.** It lives only as JSON/markdown files under
`output/runs/<repo>/<runId>/knowledge-pipeline/` on local disk — same "real but not queryable"
gap as phase-02, just for structural data instead of narrative text.

## 5. Answering the prompt's three scenarios directly

- **(a) real, embedded, queryable summaries already exist** — **No.** Confirmed via direct
  Postgres query: no summary `kind`, no other table, embedding column only populated for raw
  individual facts.
- **(b) phase-02 computes real summaries but never embeds/persists them** — **Partially, and
  worse than "incomplete."** True in the narrow sense that the code and its documented
  6.7MB-scale output format are real. But live output only exists for 1 of 3 repos, and even
  that one is 3 weeks stale and was generated before the current facts pipeline existed —
  this isn't "infrastructure needing an embedding step added," it's infrastructure needing a
  fresh re-run *and* an embedding step, with no confirmed guarantee the re-run would even
  succeed against current facts without changes (it hasn't been exercised against this
  pipeline's current shape since 2026-09-02).
- **(c) genuinely decommissioned/stale, needs new infra built from scratch** — **Effectively
  yes for a semantic (embeddable) routing signal**, but not from *zero*: the Phase 1
  structural knowledge-pipeline (section 4) is real, current, and free (no LLM calls), and
  could plausibly seed a routing layer even though it isn't itself narrative/embeddable
  as-is.

## 6. What a real routing preview would actually look like (scoped, not built)

Three candidate starting points, in order of how much new work each needs:

1. **Cheapest, most likely-correct starting point — not named in the original prompt,
   surfaced by this investigation**: build a routing layer directly off the `facts` table
   that's already fully synced and 100% embedded for all 9 repos today (section 2). E.g.
   `SELECT DISTINCT repo, module FROM facts` gives a real, always-current repo/module
   inventory for free (zero embedding cost, it's metadata already in every row). A first
   routing pass could then be a cheap aggregate — e.g. one real embedding call per
   `(repo, module)` pair against a concatenation of that group's distinct `symbol_name` /
   `description` values — same "free, Postgres-only, one small real embedding call" shape
   the 09/10/11 duplicate-search-queries work already used for its own preview. This needs no
   revival of phase-02 or the knowledge-pipeline stage at all.
2. **Reuse the Phase 1 structural knowledge-pipeline (section 4)**: its per-module
   `cross-module-dependencies.json` and repo-wide `resolved-engineering-graph.json` are real
   and current, and could plausibly seed which modules/repos are structurally connected to a
   query's named entities — but since it's edges/tables, not prose, it would need a real
   design decision on how to turn "743 raw facts" or "6 outbound module edges" into something
   embeddable, or use it for structural (non-semantic) pre-filtering instead of vector search.
3. **Revive phase-02 narrative synthesis**: highest cost — would mean re-running real,
   documented-expensive per-module LLM calls (option 1's `03-run-full-phase2.ts`, the ~68%
   token reduction figure implies this was still a real per-module LLM cost, not free) against
   current facts for all 3 repos, then adding a new embedding step for the output. Real LLM
   spend to flag explicitly before running, per this project's standing discipline, if this
   path is ever chosen.

None of these were built or run here — this is a scope estimate only, per the investigation
prompt's instruction.

## 7. Freshness/maintenance burden, given per-merge pipeline re-triggers

Real, concrete asymmetry between the two existing mechanisms, relevant to whichever routing
approach gets chosen later:

- The Phase 1 structural knowledge-pipeline (section 4) already regenerates on every
  extraction run at **no incremental cost** — confirmed by its `generatedAt` timestamp
  matching today's Postgres sync exactly, and by it containing zero LLM/embedding calls (pure
  AST-derived graph construction, same class of work as Phase 1's existing fact extraction).
  If a routing signal were built on top of this, its maintenance cost is already fully paid —
  same lifecycle as the facts themselves, bounded, not open-ended.
- Phase-02's narrative synthesis, by contrast, is real per-module LLM spend
  (`03-run-full-phase2.ts`'s own comments describe the token-reduction work as a real,
  measured production-cutover concern, implying non-trivial spend before that optimization).
  Keeping *narrative* summaries fresh on every merge-to-prod re-trigger would be an ongoing,
  real LLM cost per module per merge — open-ended in the sense the prompt asked about, not
  bounded, and would need explicit cost flagging before ever being scheduled to run
  automatically.
- Option 1 in section 6 (facts-table-derived routing) sits in between: one embedding call per
  `(repo, module)` pair (small, bounded count — the repo/module list itself is finite and
  stable) rather than per merge or per fact, so its ongoing cost is real but small and
  boundable, closer in shape to the structural mechanism's free-refresh property than to
  phase-02's per-module LLM cost.

## Real spend note

Zero LLM or embedding calls were made during this investigation — all findings came from
reading source files and read-only Postgres queries (`SELECT`/`\d`/`\dt`) against the local
dev instance, as the investigation prompt required.

## Open items for a future decide-stage session

- Correct the stale `project_phase02_reports_preserved.md` memory entry — "decommissioned"
  isn't literally accurate (no rename happened), but its practical conclusion (phase-02 isn't
  a going concern) holds up under direct verification.
- A real decide-stage session should pick between the 3 options in section 6 — this
  investigation recommends starting with option 1 (facts-table-derived) as the cheapest real
  test, but that's a recommendation for a *decide* session to confirm, not a decision made
  here.
- The iOS/Swift structural-aggregation gap (section 4) is narrower than originally scoped
  (Android does have it) but still real and unresolved by this investigation.

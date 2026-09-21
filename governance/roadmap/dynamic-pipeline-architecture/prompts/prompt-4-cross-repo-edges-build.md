# Prompt 4: build the cross-repo edge joins (Stage 0, A, B, C, D1, E)

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing to files is fine; committing is not your call; only the user commits.**

**Mode: real build.** This session builds; it does not re-investigate. The investigation and decisions are done and written down. If something you find contradicts the spec, **stop and report it to the user**, don't quietly re-plan.

## Read first, in this order

1. `governance/roadmap/dynamic-pipeline-architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md`, **only the section "AUTHORITATIVE BUILD SPEC" at the top.** Everything below the "Historical" heading is reasoning history and may conflict; the spec wins.
2. `pipeline/facts-postgres-index/build-cross-repo-edges.ts` (whole file, 310 lines) and `build-intra-repo-edges.ts` around line 339 (the scoped `DELETE ... WHERE connection_type = ... AND source_repo = ...` pattern to copy).
3. `mcp-server/db/graph-traversal.ts` lines 172-183 and 247-269 (what traversal follows: only `resolved`/`confirmed` edges with a non-null target `fact_ref`).
4. `39-findings-stage0-verification-cross-repo-edges-2026-09-21.md` §2, §3, §4, §5a, §5b as needed for evidence on any stage.
5. `governance/reference-docs/pubsub.bindings.staging.json` (Stage D1 input).

## Facts about this environment you must not get wrong

- **Facts DB:** `docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index` (redirect stdin from a file or `</dev/null` for `-c`; a bare `cat` or stdin-less call will hang).
- **Real source of the indexed repos is in `output/clones/<repo>/`, on the branch stated in `config/repos.json`** (firebase, angular, node-iot = `staging`; android-intercom = `develop`; ios = `master`). Never cite `~/development/*` checkouts or unmerged branches. For git history use `git log HEAD`, not `--all`.
- `source_fact_ref`/`target_fact_ref` on `cross_repo_edges` are **generated columns** from `source_fact_id`/`target_fact_id`. Write `fact_id`, never `fact_ref`.
- `fact_id` values can be long and contain newlines; treat them as opaque, never split or trim them.
- `FIELD_BINDING` edges (13 rows) belong to `build-form-field-lineage-edges.ts`. Your changes must leave them exactly as they are.
- **Rules from CLAUDE.md that bind you:** always dynamic, always recursive, never hardcoded (discover repos and kinds from the data, no repo-name literals in code you write or change); run cheap bounded tests first; keep a before baseline and compare; write findings as they happen; delete temporary diagnostic scripts once their findings are written up; flag any real spend before running it (this build should have **none**: no LLM, no embeddings; do not run any `gcloud` command).
- **Docs: append, don't create.** Put every result in the `## Build log` section at the end of doc 38 (create that heading once; one dated entry per stage). No new numbered docs. The only new data file is the baseline JSON named below.

## What to build (full detail is in the spec; this is the order and the gates)

**Stage 0: safety net and refactor, no new edges.**
1. `pg_dump -t cross_repo_edges` to `output/backups/cross_repo_edges-<date>.sql` (gitignored).
2. Baseline: save `38-baseline-cross-repo-edges-before-2026-09-21.json` next to doc 38, grouped by `(connection_type, source_repo, target_repo, resolution_status, provenance)`, and record each repo's latest `runId` in it. The spec's numbers (17,195 total, etc.) are as of the runIds listed in the spec's "Merge-robustness rules". If a repo's latest `runId` differs from the one listed, the facts were re-synced: **don't stop for that alone; record the difference and use your own baseline as the reference**, but tell the user, since some expected counts (24/34, 389, 72, 21) may have moved. Stop only if the counts moved in a way you can't explain.
3. Refactor `build-cross-repo-edges.ts`: join functions, shared scoped-replace helper keyed by `(connection_type, source_repo)`, `--join=` flag, each join in its own transaction, repos discovered from data. **Compute first, replace second:** add the per-join preflight and the `--accept-shrink` guard from the spec's "Merge-robustness rules" (rule 2), and put all extractor-contract literals in one constants block (rule 3).
4. **Acceptance: re-run reproduces the baseline exactly**, including `--join=` for one join. Do not proceed to Stage A until it does.

**Stage A: iOS→Firebase.** Any repo with `firebase_callable_call` facts is a source. Expect 24/34 for `swift-cloud-kit-oskey-dev` (angular unchanged: 97 resolved + 5 unresolved). Record the 10 misses as `unresolved` with reasons (3 dead iOS calls; 7 export-group alias). **Do not build A2** (the alias mapping); report the design option and stop.

**Stage B: iOS↔Swift-kit** (`PACKAGE_SYMBOL_USE`). Leading-identifier extraction from `calleeExpression`; match by `symbol_name` in `(declarationRepo, declarationFile)`; prefer the non-extension declaration; anything else unresolved with reasons. Report the distinct-declaration count (expect ~72), max in-degree (expect `OSKUIExpanded` ~85), and resolved vs unresolved split. Spot-check 3 resolved edges against real source in `output/clones/`. **Hub measurement before you call B done (report only, add no cap, don't change traversal code):** `findGraphNeighbors` has no `LIMIT` and `OSKUIExpanded` has ~85 incoming edges. Call `findGraphNeighbors` on that hub and run one `walkBoundedCluster` from a kit anchor; record the row count and serialized size in bytes of each in the build log.

**Stage C: android→node-iot.** Parse node-iot's `route_definition` `payload.value` (`"METHOD /path"`); wildcard-normalize `{x}` and `:x`; segment-aligned suffix match; ≥2 literal segments; **a `{x}`/`:x` segment matches only another wildcard segment, never a literal like `pubsub`**; anything else, or ambiguity, is `unresolved` with candidates in `details`. Expect 5/5. **Apigee (user-confirmed 2026-09-21):** Android traffic goes via Apigee, which strips the `/iot` prefix, so the match is correct. Put this in every C edge's `details` and `confirmed_via`: "reaches node-iot via Apigee, /iot prefix stripped; confirmed by the product owner 2026-09-21; gateway config not in the indexed repos". Log (don't build) an optional future step: export Apigee's proxy definitions (base path and target) to make it deterministic.

**Stage D1: pubsub deterministic edge** from the bindings JSON. Edges only where a fact exists on both ends (today: the `accessControlDevice_activities` edge). Keep `CONFIRMED_PUBSUB_BINDINGS` as a cross-check until they agree. Record the other bindings as `unresolved` with reasons (the 4 removed-route bindings were deliberately removed in node-iot `32e3d97`; staging only). **Do not build D2**; propose its design and stop.

**Stage E: Firestore triggers, investigate first.** Run E1 and E2 from the spec and write the coverage numbers into the build log **before writing any edge code**. If writer-path coverage is too low to be meaningful, **stop and report to the user with the numbers and the proposed extractor change**; do not fake the writer side by parsing source. If it passes, build `FIRESTORE_EVENT_TRIGGER` edges and validate against the config ground truth in the spec. **No `probable` status (user decision 2026-09-21):** a trigger edge says "writing to this document path is configured to run this handler", a fact about code and config, not runtime outcome. A `set` gets **`resolved` edges to both the create and the update handler**, `details` = "fires as create if the document is new, as update if it exists"; a delete gets `resolved` to the delete handler. `findGraphNeighbors` only follows `resolved`/`confirmed` (`mcp-server/db/graph-traversal.ts:250,254`), so `probable` would be invisible and would fail the acceptance test ("from the `save` fact, `findGraphNeighbors` reaches the handler"). Do not change traversal code. **Do not model "the intercom collected the document"**: the chain after the trigger (`publishConfig` → topic → node-iot → intercom `GET`) is separate edges and two links aren't built (D2 is gated; node-iot's store step has no edge). State that gap in the build log.

**Close-out:** per-pair coverage summary at the end of the script's output, **including dangling source AND target counts per `(connection_type, repo)`, split by `resolution_status`, and a flag for any repo whose newest `runId` is newer than its edges** (spec rule 1a). Today 153 `INTRA_REPO_CALL` edges are dangling; all have a null target and are `unresolved` (130) or `probable` (23), which traversal never follows, so they're harmless now. **A dangling source on a `resolved`/`confirmed` edge also makes `walkBoundedCluster` throw** (the walk reaches it from the live target), and your new edges are exactly that case once a repo is re-synced without an edge rebuild, which is why the summary must count both sides. Don't fix the 153 and don't add a `pipeline:edges` script; both are user decisions to be made before the next `ios-oskey-dev` re-sync, so write them as proposals in the build log (until then, "re-sync a repo, then rebuild its edges" is a manual habit). Note the 2 android-intercom dangling rows as unexplained (doc 22 didn't refresh android); update the stale comment in both `graph-traversal.ts` copies (`mcp-server/db/` and `pipeline/facts-postgres-index/_shared/`); note in the build log whether you added the script to `package.json` (don't, unless the user says so).

## Working rules for this session

- **One stage at a time. After each stage, stop and tell the user**, so the validator session can check it before you continue. State the real numbers, not "it worked".
- Before each stage's real write, do a bounded dry run (compute and print the edges, write nothing) and look at them.
- After each stage, run your own checks: counts vs baseline, `FIELD_BINDING` unchanged (13), no row whose target `fact_id` isn't in `facts`, one `findGraphNeighbors` call on a new edge.
- Honest reporting: if a number differs from the spec's expectation, say so and explain; don't adjust the code until it matches.
- If you're unsure whether something is in scope, it isn't. Ask.

## Out of scope (don't touch)

Building settings / Remote Config; `build-form-field-lineage-edges.ts` and `FIELD_BINDING`; A2 and D2 (propose only); node-iot's missing `INTRA_REPO_CALL` edges; Angular's unresolved callables; `accessControlDeviceConfigs`; retrieval quality for pubsub facts; production/dev pubsub; any real LLM run.

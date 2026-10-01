# Prompt: Lane E (edges): same-repo call edges for Swift, app → kit method edges, node-iot dry-run

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing files is fine; only the user commits.**

**Mode: real build, one lane of two.** A coordinator session validates every step and grants database write turns. Lane S (Swift extraction) runs in parallel and delivers new call-fact fields. If you find something that contradicts the spec, **stop and report it**; don't re-plan quietly. Not sure whether something is in scope? It isn't: ask.

## Read first, in this order

1. `governance/roadmap/call-resolution-same-repo-edges/01-build-spec-2026-10-01.md`: **all of it.** §2 (the contract, especially §2d), §3 (order) and §4 (safeguards, write protocol) bind you. It wins over everything else.
2. `governance/roadmap/call-resolution-same-repo-edges/00-findings-and-plan-2026-10-01.md`: the why, with live numbers per repo.
3. `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`: "Live-DB safeguards", "Lane model and DB write protocol", and the `[Lane A]` **W6** entries (design, dry-run, apply), the precedent you are extending. Also Lane A's FINAL CAPTURE note on hub fences.
4. Code: `pipeline/facts-postgres-index/build-cross-repo-edges.ts`: `intraRepoCallDeclaredJoin` (~:1587-1730), `packageSymbolUseJoin` (~:796-925), `CONTRACT` (~:100-200), the `Join` interface and guards (shrink, resolved-drop, orphan report); `build-edges.ts`; `pipeline/README_postgres.md`; `mcp-server/db/graph-traversal.ts:262-268` (traversal follows any type that is `resolved`/`confirmed` with a target).

## Your lane

- **Items:** E1 → E2 → E3, then your write turn (spec §3). Acceptance A3, A5, A6, A7 (spec §1).
- **You own (edit only these):** `pipeline/facts-postgres-index/**` (edge builders, `build-edges.ts`, `sync-facts.ts` including `descriptionFor`, schema files), `package.json`, the `intraRepoEdges` keys in `config/repos.json`.
- **You must not edit:** `pipeline/swift/**`, `pipeline/ios-oskey-dev/**`, the Swift extractor (Lane S), or any other repo's extraction pipeline.

## Facts about this environment you must not get wrong

- **DB:** container `facts-postgres-index-local` (port 5433), database `facts_index`, user `facts_index`. It is live and shared; use `</dev/null` with `docker exec ... psql -c`. **Scratch DBs:** you may create and drop your own, named `facts_index_scratch_e_<purpose>`, from a fresh dump, without a write turn. `DROP DATABASE` is allowed only on names starting `facts_index_scratch_`. Check how `sync-facts.ts` and the builders pick their database (env vars) and prove they're pointed at the scratch DB **before** any scratch run.
- **`fact_ref` = `sha1(fact_id)`, generated** on `facts` and on both ends of `cross_repo_edges` (`source_fact_ref`/`target_fact_ref`). Traversal and the wiki join on `fact_ref`. Every edge you write must carry real `source_fact_id`/`target_fact_id` values (never computed `fact_ref`s; Postgres generates them). Your before/after slice comparison includes both `fact_ref` columns.
- **W6 discovery already keys on `resolutionStatus = 'resolved'` + `declarationFile`** (`:1640`), so the Swift repos will join W6 automatically the moment Lane S's facts are synced. That's why Lane S's write turn does **not** run `pipeline:edges`, and why your dry-run numbers on Lane S's held run must be reviewed before your write turn.
- **CLAUDE.md rules that bind you:** always dynamic (thresholds derived from data, no name lists); dry-run first; keep a before baseline; write findings as they happen; delete scratch scripts and scratch DBs afterwards; **no LLM calls, no `gcloud`; flag any embedding spend and wait for the user.**

## Procedure

**E1, node-iot W6 dry-run (A6).** Today node-iot is skipped by W6 because it reads the same `intraRepoEdges.enabled = false` switch as the resolved-graph builder (`:1622-1631`). Propose how to dry-run W6 for node-iot without turning `INTRA_REPO_CALL` on (e.g. a separate config key), run the dry-run (no write), and report: candidates, matched, hub fence and hubs, edges kept, and the reasons for the misses (node-iot has 277 resolved calls with `declarationFile`, 116 of them in-repo). **Stop for the user's decision.**

**E2, build against synthetic facts (A3, A5 design).**
- `PACKAGE_METHOD_CALL` (name to be confirmed by the user): a new join per spec §2d, with the existing guards (preflight, shrink, resolved-drop, orphan report, `attributes` where useful). Propose the details text and attributes first.
- W6 for Swift: verify W6's matching against Swift fact shapes: `function_declaration` `symbol_name` format vs the `byFileName` fallback (`:1698`), `declarationClass` for extension members, and whether constructor targets (spec §2a's open question, answered by Lane S) need any handling.
- Prove both on a scratch DB with **synthetic** Swift call facts carrying the §2a fields (a handful, covering: own-property call, `Type.shared.method`, bare call in own type, cross-repo kit method, overload left unresolved). Post the design and diff in the Build log and **stop for approval**.

**E3, dry-run on Lane S's real held run.** Once Lane S posts `READY TO SYNC`: load a scratch DB from a fresh dump, sync Lane S's held runs into it (`EMBED` off), run the approved joins there, and report: per Swift repo, W6 candidates, matched, ambiguous, no-declaration, the hub fence and every hub with its fan-in (compare with `OSKUIExpanded`'s 85 under `PACKAGE_SYMBOL_USE`); `PACKAGE_METHOD_CALL` resolved/unresolved with reasons; A1/A2's edges; the A4 counts; and every pre-existing slice byte-identical. Post `[Lane E] READY FOR WRITE TURN` and stop.

**Write turn (only after `WRITE TURN GRANTED: Lane E`, which comes after Lane S's is released).** Table dump; the approved code enters the shared tree (diff posted first); plain `npm run pipeline:edges`; coverage summary; per-slice before/after comparison; one `findGraphNeighbors` per new or extended type. Post the numbers, then `WRITE TURN RELEASED: Lane E` requested, and stop.

## `descriptionFor`

You own it. If the new call fields (spec §2a) should show up in call-fact descriptions, propose the text and measure how many live descriptions would change, i.e. the embedding count, before changing anything. "No description change" is a valid proposal. Coordinate with Lane S, whose gate counts description changes.

## Logging

Append-only to `## Build log` in the spec (`cat >> file <<'EOF'`), entries headed `### <date>: [Lane E] ...`. Never rewrite the file.

## Out of scope

Extraction changes in any language; Kotlin; renaming or removing any field or column; dropping any non-scratch database; any `gcloud`; any LLM run.

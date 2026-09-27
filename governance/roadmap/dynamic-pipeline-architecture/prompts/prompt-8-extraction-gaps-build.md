# Prompt 8: extraction gaps from the wiki handoff (W5a/b, W1, W4a, W2, W3, W4b–e, W6, W5c)

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing to files is fine; committing is not your call; only the user commits.**

**Mode: real build, one item at a time.** The investigation and decisions are written down. If you find something that contradicts the spec, **stop and report it to the user**; don't quietly re-plan. If you're unsure whether something is in scope, it isn't: ask.

## Read first, in this order

1. `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`, **the section "AUTHORITATIVE BUILD SPEC" (everything above `## Build log`).** It has the order, the verified evidence, the live-DB safeguards, and the per-item acceptance checks. The spec wins over anything else.
2. `pipeline/README.md` and `pipeline/README_postgres.md` (how the pipeline runs and how the database is stored and backed up).
3. `governance/roadmap/downstream-app-feedback/2026-09-26-extraction-team.md` (the wiki team's handoff; it is the source of the problem list, and it has known misreadings that the spec corrects. Their prompt file next to it is **superseded**; don't follow it).
4. `pipeline/facts-postgres-index/build-cross-repo-edges.ts` (whole file), `build-intra-repo-edges.ts`, `sync-facts.ts`, and `governance/roadmap/dynamic-pipeline-architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md` (its Build log shows how the last build was run, including the guards you must keep).
5. The code pointers named per item in the spec, before you change anything.

## Facts about this environment you must not get wrong

- **Facts DB:** container `facts-postgres-index-local`, database `facts_index`, user `facts_index`. `docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index` (redirect stdin from a file or `</dev/null` for `-c`, or it can hang). **This is the live source of truth. There is no copy.** Other sessions and the downstream wiki read it.
- **Real source of the indexed repos is `output/clones/<repo>/`, on the branch/commit in `config/repos.json`** (firebase, angular, node-iot = `staging`; android-intercom = `develop`; ios = `master`; Swift kits pinned to commits). Never cite `~/development/*` checkouts or unmerged branches. **`00-scan-repo` deletes the clone and re-clones the latest branch head**: check upstream first (see spec, safeguard 3).
- `source_fact_ref`/`target_fact_ref` on `cross_repo_edges` are generated columns from `source_fact_id`/`target_fact_id`. Write `fact_id`, never `fact_ref`. Treat `fact_id` as opaque (it can be long and contain newlines).
- Kinds live in the `kind` column; `pubsub_publish_call` is `kind = 'external_hook'` with `payload->'evidence'->>'type'`. Existing payload field names are never renamed, only added to.
- Firebase's `astErrorTolerancePercent` is 0: any parse error in a newly included file aborts the run. Android's is 5. The Swift extractor is a compiled binary (`swift-extractor/.build/release/swift-extractor`, arm64, gitignored), shared by all 5 Swift repos.
- **Rules from CLAUDE.md that bind you:** always dynamic, always recursive, never hardcoded (discover repos, modules, kinds and paths from the data or from `config/repos.json`; no repo-name or hand-typed alias literals in code you write); run cheap bounded tests first; keep a before baseline and compare; write findings as they happen; delete temporary diagnostic scripts once their findings are written up; **flag any real spend (embeddings) with a count and token estimate before running it and wait for the user's go-ahead.** No LLM calls. **Do not run any `gcloud` command.**
- **Docs: append, don't create.** Put every result in the `## Build log` section at the end of doc 43 (one dated entry per item). The only new data file is the baseline JSON named in the spec.

## Per-item procedure (every item, in the spec's order)

1. **Investigate.** Find the responsible code, explain the cause in a few sentences, cite `file:line`. Verify the numbers you build on against the live database or the real source.
2. **Propose** any new fact kind, payload field, edge type, config key or table (shape, names, where it is written) and **wait for the user's approval.** Schema changes are additive only.
3. **Safeguards** (spec "Live-DB safeguards"): dump the database, take/refresh the baseline, check upstream, run the **pre-sync fact-ID gate** and report the result, sync with `EMBED` off, flag embedding spend and wait, rebuild edges, read the coverage summary.
4. **Implement**, with a bounded dry run before each real write. Keep the existing guards (preflight, shrink guard, scoped replace) in the edge builders.
5. **Verify** against the item's acceptance checks with read-only SQL. Report **real numbers**, not "it worked". If a number differs from the spec, say so and explain; don't adjust code until it matches.
6. **Append** a dated entry to the Build log in doc 43, delete scratch scripts, and **stop and tell the user** so the validator session can check it before you start the next item.

After each item also confirm: totals versus baseline explained, `FIELD_BINDING` still 13, no `resolved`/`confirmed` edge with a target `fact_id` missing from `facts`, one `findGraphNeighbors` call on a new edge type, and that you ran no `git add`/`git commit`.

## Order

W5a and W5b (edges entry point, edge-sync state), then W1, W4a, W2, W3, W4b, W4c, W4d, W4e, W6 (P7), W5c. **Do not start the next item until the user says so.** Start with the baseline and W5a.

## Out of scope (don't touch)

Parked items in the spec; `build-form-field-lineage-edges.ts` generalisation (orchestrate it, don't change it); the wiki's own repo; any real LLM run; any `gcloud` command; renaming or removing any existing payload field.

---

## Lane A (added 2026-09-26; supersedes the item list and "Order" above)

The work is now split across three parallel sessions. **You are Lane A (Edges).** Read "Lane model and DB write protocol" in doc 43 (above `## Build log`); it wins over this prompt on who does what and when the database may be written.

- **Your items:** W5a and W5b first (as approved with the coordinator's amendments in your Build log thread), then every change to the edge builders requested by Lanes B and C: W1's `firebase-callable` join change, W2's `pubsub-binding` join, the `firestore-trigger` re-run for W4a, W4d, W6 (P7), and W5c. **The extraction items (W1 extraction part, W4a, W2 extraction part, W3, W4b, W4e, W4c) are no longer yours; do not start them.**
- **You own:** `pipeline/facts-postgres-index/build-*.ts`, `sync-facts.ts`, `build-edges.ts`, the `edge_sync_state` table, `package.json` scripts. Other lanes must not edit these; you must not edit `pipeline/firebase-oskey-dev/**`, `pipeline/angular-app-oskey-io/**`, `pipeline/swift/**` or `pipeline/ios-oskey-dev/**`.
- **Announce W5a done clearly** in the Build log (`[Lane A] W5a DONE: pipeline:edges available`), because Lanes B and C may not sync until it exists.
- **Write turns:** the coordinator grants one at a time; you follow the same protocol as the other lanes for syncs, and you may run `pipeline:edges` inside any lane's write turn on request.
- **Logs:** prefix entries `[Lane A]`; append-only shell writes (`cat >> file <<'EOF'`), never rewrite doc 43.
- Interface requests from Lanes B and C appear under "Interface contracts" in doc 43; implement them one at a time after the user approves each.

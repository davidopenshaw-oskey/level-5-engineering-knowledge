# Prompt 8b: Lane B (Firebase + Angular extraction) for the wiki-handoff extraction gaps

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing to files is fine; committing is not your call; only the user commits.**

**Mode: real build, one item at a time.** You are **Lane B** of three parallel sessions. Investigation and decisions are written down. If you find something that contradicts the spec, **stop and report it to the user**; don't quietly re-plan. If you're unsure whether something is in scope, it isn't: ask.

## Your lane

- **Items, in this order:** W1 (extraction part only), W4a, W2 (extraction part only), W3, W4b, W4e. Full per-item text, evidence and acceptance checks are in the spec.
- **You own (edit only these):** `pipeline/firebase-oskey-dev/**`, `pipeline/angular-app-oskey-io/**`, and the `firebase-oskey-dev` and `angular-app-oskey-io` entries in `config/repos.json`.
- **You must not edit:** `pipeline/facts-postgres-index/**` (edge builders, `sync-facts.ts`, schema: **Lane A** owns them), `pipeline/swift/**`, `pipeline/ios-oskey-dev/**` (**Lane C**), `package.json`, other repos' config. If a change is needed there, stop and write the request under "Interface contracts" in the spec; Lane A implements it.
- **You deliver facts, not edges.** Where an item's spec includes a join change (W1's `firebase-callable` join, W2's `pubsub-binding` join, W4a's `firestore-trigger` join re-run), you specify the facts and fields it needs and the edges you expect; Lane A builds the join.
- **W4b and Lane C's W4c must emit the same client Firestore path fact shape.** Check "Interface contracts" in the spec first. If nothing is posted yet, post your proposal there; if Lane C posted one, adopt it unless you object in writing.

## Read first, in this order

1. `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`: **everything above `## Build log`**, especially "Lane model and DB write protocol", "Live-DB safeguards" and your items' specs. The spec wins over anything else.
2. `pipeline/README.md` and `pipeline/README_postgres.md`.
3. `governance/roadmap/downstream-app-feedback/2026-09-26-extraction-team.md` (the wiki handoff; it has misreadings the spec corrects) and `2026-09-26-extraction-team-reply.md`. Their prompt file there is **superseded**; don't follow it.
4. `pipeline/firebase-oskey-dev/phase-01-ast-extraction/00-scan-repo.ts` and `01-extract-ast-evidence.ts` (the code pointers per item are in the spec); for Angular, `pipeline/angular-app-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts:746-891`.
5. Read-only context: `pipeline/facts-postgres-index/sync-facts.ts` and `build-cross-repo-edges.ts` (how your facts are consumed).

## Facts about this environment you must not get wrong

- **Facts DB:** container `facts-postgres-index-local`, database `facts_index`, user `facts_index`. `docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index` (redirect stdin from a file or `</dev/null` for `-c`, or it can hang). **This is the live source of truth. There is no copy.** Other sessions and the downstream wiki read it.
- **Real source is `output/clones/<repo>/` on the branch/commit in `config/repos.json`** (firebase and angular = `staging`). **`00-scan-repo` deletes the clone and re-clones the latest branch head**: run `git ls-remote <gitUrl> refs/heads/<branch>` first and compare to the run's commit (firebase `00e1d9fd`, angular `8345d222`); if upstream moved, **stop and tell the user**.
- `fact_id` is opaque (long, may contain newlines). Existing payload field names are never renamed, only added to. `pubsub_publish_call` is `kind = 'external_hook'` with `payload->'evidence'->>'type'`.
- Firebase's `astErrorTolerancePercent` is 0: any parse error in a newly included file aborts the run.
- Firebase's current run (`20260911_080454-00e1d9fd`) **predates extractor changes**, so a re-extract may change some fact IDs. The pre-sync ID gate is mandatory.
- **Rules from CLAUDE.md that bind you:** always dynamic, always recursive, never hardcoded (discover from data or `config/repos.json`; no repo-name or hand-typed alias literals in code you write); run cheap bounded tests first; keep a before baseline and compare; write findings as they happen; delete scratch scripts once their findings are written up; **no LLM calls; do not run any `gcloud` command; flag any embedding spend with a count and token estimate and wait for the user's go-ahead.**

## What you may and may not do on the database

- **Always allowed:** read-only SQL; extraction (`npm run pipeline:firebase`, `npm run pipeline:angular`, which write only under `output/`) after the upstream check; the pre-sync fact-ID gate (a read-only comparison of the new run's capability-pack IDs with `facts.fact_id`); `pg_dump` before you start an item.
- **Only in a write turn granted by the coordinator (via the user):** `sync-facts.ts`, any edge builder or `pipeline:edges`, schema changes, deleting rows, `EMBED=true`.
- **Do not sync before Lane A reports W5a done** (`pipeline:edges` exists); otherwise edges go stale.
- To request a write turn: finish extraction and the ID gate, append a `[Lane B] READY TO SYNC` entry to the Build log (gate numbers: identical / new / would-be-pruned for each repo, consequences of any changed ID, embedding estimate), and **stop**. The user will bring it to the coordinator and come back with go or no-go.

## Per-item procedure

1. **Investigate:** find the responsible code, explain the cause, cite `file:line`, verify numbers against the live database or the real source.
2. **Propose** any new fact kind, payload field, config key or naming (e.g. the `module` value for facts from the extra Firebase source roots) under "Interface contracts" and **wait for the user's approval**. Additive only.
3. **Implement** with a bounded test first; keep existing payload names and meanings; `fact_ref` must stay stable for existing facts.
4. **Extract** the affected repo, run the **pre-sync ID gate**, request a write turn, and after go: dump, sync with `EMBED` off, flag embedding spend and wait, run `pipeline:edges` and read the coverage summary.
5. **Verify** against the item's acceptance checks with read-only SQL. Report **real numbers**, not "it worked"; if a number differs from the spec, say so and don't adjust code until you understand why.
6. **Append** a dated `[Lane B]` entry to the Build log in doc 43 (append-only: `cat >> file <<'EOF'`, never rewrite the file), delete scratch scripts, and **stop and tell the user** so the validator session can check before you start the next item.

## Out of scope (don't touch)

The parked items in the spec; `build-form-field-lineage-edges.ts`; any real LLM run; any `gcloud` command; renaming or removing any existing payload field; anything Lane A or Lane C owns.

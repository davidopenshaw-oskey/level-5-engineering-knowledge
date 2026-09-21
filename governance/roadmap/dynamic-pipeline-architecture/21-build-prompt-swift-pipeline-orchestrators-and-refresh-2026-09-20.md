# Build prompt: add missing Swift package.json orchestrators + refresh stale pipeline runs

Hand-off prompt for a new session, drafted 2026-09-20, following
[20-findings-swift-phase1-structural-gap-2026-09-20.md](20-findings-swift-phase1-structural-gap-2026-09-20.md).
Not yet dispatched/run as of writing this file.

---

Build the fix scoped by doc 20's real findings. This is small and mechanical, not new
infrastructure — the underlying pipeline code already works and has already produced
complete output for all 5 Swift/iOS repos at least once. Never git add/commit unless
explicitly asked. Write a completion doc at
`governance/roadmap/dynamic-pipeline-architecture/22-...` (next available number) when done.

## Real context (don't re-derive)

Doc 20 confirmed: `pipeline/swift/phase-01-ast-extraction/04-07` is real, Swift-specific
(not a TS port), shared across all 5 Swift/iOS repos via `REPO_NAME`. The real gap is two
small, separate things:
1. `package.json` is missing full `00-07` orchestrator scripts for 3 of the 5 repos —
   `pipeline:swift-cloud-kit`, `pipeline:swift-ui-kit`, `pipeline:swift-webrtc-kit` don't
   exist; only `pipeline:swift-ble-kit` and `pipeline:ios-oskey-dev` do.
2. 4 of the 5 repos' most recent pipeline runs (2026-09-18) stop after step 02 — their
   `04-07` output is stale relative to that same day's extractor fix
   (`01-extract-ast-evidence.ts`/`02-build-module-evidence.ts`, edited 2026-09-18
   17:49-17:50).

**Real, additional context confirmed 2026-09-20, after the original draft of this prompt**:
checked `config/repos.json` directly — `ios-oskey-dev` tracks **branch `master`**, so a
fresh `00-scan-repo` clone genuinely picks up whatever's currently at the tip of master. All
4 Swift-kit repos, by contrast, are pinned to **fixed, exact commit SHAs** in that same
config, not a branch — a fresh re-clone for those 4 checks out the *identical* commit every
time, regardless of what's newer on their remote branches. So Step 2's re-run gets genuinely
new source for `ios-oskey-dev`, but for the 4 kit repos it only re-applies the *current*
(fixed) extractor code to the *same already-pinned* source — real and worth doing (the
2026-09-18 extractor fix), but not "picking up new sub-package code." That's a separate,
real, currently-unaddressed gap this task doesn't touch (see
`governance/roadmap/ios-oskey-dev/05-future-trigger-driven-extraction-concurrency-risk-
2026-09-09.md` for the full context — not this task's scope to fix).

## Step 1 — add the 3 missing orchestrator scripts to `package.json`

Confirmed directly (2026-09-20): none of `swift-cloud-kit-oskey-dev`,
`swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io` has its own repo-specific
`00-scan-repo.ts` or `cloud:` package.json entry (all three checked — empty
`phase-01-ast-extraction/` directories, zero matching `cloud:` script names). This means
they follow the **`pipeline:swift-ble-kit` pattern exactly** (shared
`cloud:swift-00-scan-repo`), not the `pipeline:ios-oskey-dev` pattern (which uses its own
dedicated `cloud:ios-oskey-dev-00-scan-repo`). The real, existing `swift-ble-kit` script to
mirror (`package.json` line 58):

```json
"pipeline:swift-ble-kit": "export REPO_NAME=swift-ble-kit-oskey-dev && npm run cloud:swift-00-scan-repo && npm run cloud:swift-01-extract-ast && npm run cloud:swift-02-build-evidence && npm run cloud:swift-03-build-benchmark && npm run cloud:swift-04-build-resolved-graph && npm run cloud:swift-05-partition-capability-packs && npm run cloud:swift-06-build-cross-module-dependency-graph && npm run cloud:swift-07-build-intra-module-coupling-graph"
```

Add three new entries, identical in shape, only `REPO_NAME` changed:
- `pipeline:swift-cloud-kit` → `REPO_NAME=swift-cloud-kit-oskey-dev`
- `pipeline:swift-ui-kit` → `REPO_NAME=swift-ui-kit-oskey-dev`
- `pipeline:swift-webrtc-kit` → `REPO_NAME=swift-webrtc-kit-oskey-io`

Double-check the real `REPO_NAME` values against each repo's own directory name under
`pipeline/` before adding — don't assume the three names above are typo-free without
checking, since they're being typed fresh here, not copied from an existing script.

## Step 2 — real re-run, flag explicitly before running

**Flag explicitly before running**: this re-runs the full `00-07` pipeline for all 5
Swift/iOS repos (`ios-oskey-dev`, `swift-ble-kit-oskey-dev`, and the 3 newly-scripted
repos) — free of LLM/embedding cost (confirmed in doc 13/20 — pure AST-derived graph
construction), but real, non-trivial local compute/time and real git-clone/checkout
activity per repo (each `00-scan-repo` step deletes and re-clones
`output/clones/<repo>/` fresh). Get explicit approval before running any of these, same as
any other real action in this project, even when there's no dollar cost attached.

Run `pipeline:ios-oskey-dev` and `pipeline:swift-ble-kit` too, not just the 3 new ones —
both are confirmed stale relative to the 2026-09-18 extractor fix (per doc 20 — `ios-oskey-
dev` hasn't been re-run since 2026-09-10 at all; `swift-ble-kit`'s latest run is the same
2026-09-18 stops-after-02 pattern as the other 3). All 5 need a fresh, complete `00-07` run
to actually close the staleness gap doc 20 found — adding only the 3 missing scripts
without re-running any of the 5 would leave the real problem (stale `04-07` output)
unaddressed.

## Step 3 — verify, don't assume success

After each real run, confirm (per repo) that `output/runs/<repo>/<newest-runId>/
knowledge-pipeline/modules/<module>/` actually contains fresh `cross-module-
dependencies.json` (06) and `intra-module-coupling.json` (07) output, dated from this run,
not a stale prior one. Report the real `runId`/timestamp per repo in the completion doc,
not just "it ran."

## Step 4 — real, honest note on the unresolved question from doc 20

Doc 20 could not confirm whether the 2026-09-18 partial (stops-after-02) runs were
deliberate extractor-validation runs or a genuine failure, since that would need
information outside this repo. If Step 2's real re-run also stops early for any repo, that
would be real, new evidence worth reporting plainly (not glossed over) — it would mean the
partial-run pattern isn't just historical, but a live, current issue with the pipeline
itself, changing the shape of this fix.

## Step 5 — real Postgres sync, flag explicitly before running (added after review; not in the original draft)

`04-07`'s own structural JSON output never feeds Postgres directly (confirmed in doc 20 —
`cross_repo_edges` reads facts directly, not this pipeline stage) — that part of the
original draft was right. But Step 2 *also* re-runs steps 01-02, the actual fact extraction,
and those facts normally do feed Postgres via a separate `sync-facts.ts` step, which the
original draft of this prompt wrongly omitted. Since the 2026-09-18 extractor fix changed
01/02's own code, Step 2's fresh run can produce facts that genuinely differ from what's
currently synced (last real sync: 2026-09-11 for `ios-oskey-dev`, 2026-09-18 for the 4 kit
repos) — without this step, that divergence would sit unreflected in Postgres.

`sync-facts.ts` (`pipeline/facts-postgres-index/sync-facts.ts`) requires **both**
`REPO_NAME` and `MODULE_NAME` (confirmed directly — fail-closed if either is missing); there
is no existing wrapper that syncs every module of a repo in one call. So: after Step 2's
re-run, for each of the 5 repos, enumerate its real current modules from the *fresh* local
extraction output (not from what's already in Postgres, in case a module was added/renamed)
and run `sync-facts.ts` once per `(repo, module)` pair.

**Flag explicitly before running**: this is real, paid Vertex AI spend — `EMBED=true` embeds
any fact whose description actually changed (the existing `ON CONFLICT` upsert only
re-embeds a changed description, not the whole corpus, per this pipeline's own real cost
discipline already confirmed in doc 08's enum-fix build). Report the real per-repo affected-
fact count and the real cost, same as every other paid step in this project — don't run this
silently as part of "just re-syncing."

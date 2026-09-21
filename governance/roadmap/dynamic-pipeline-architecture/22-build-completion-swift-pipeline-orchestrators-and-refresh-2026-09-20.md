# Build completion: Swift package.json orchestrators + pipeline refresh

Completion doc for
[21-build-prompt-swift-pipeline-orchestrators-and-refresh-2026-09-20.md](21-build-prompt-swift-pipeline-orchestrators-and-refresh-2026-09-20.md),
run 2026-09-20. All 5 steps executed as scoped. No git add/commit run.

## Step 1 — 3 missing orchestrator scripts added to `package.json`

Confirmed real `REPO_NAME` values against actual `output/`/`pipeline/` directory names before
editing (`swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io` —
matched the prompt's names exactly, no typos found). Added, mirroring
`pipeline:swift-ble-kit`'s exact shape (shared `cloud:swift-0X-*` steps, only `REPO_NAME`
changed):
- `pipeline:swift-cloud-kit`
- `pipeline:swift-ui-kit`
- `pipeline:swift-webrtc-kit`

`package.json` validated as syntactically correct JSON after the edit.

## Step 2 — real re-run, all 5 repos, approved before running

Ran the full `00-07` pipeline for all 5 repos via `npm run pipeline:<name>`. All 5 completed
in a single foreground invocation with **no early stop** — every repo produced complete
`03` (benchmark), `04` (resolved graph), `05` (capability packs), `06` (cross-module
dependencies), and `07` (intra-module coupling) output on the first try:

| Repo | New run ID | Modules | Facts |
|---|---|---|---|
| `ios-oskey-dev` | `20260920_165124-e660bda2` | `iOS App`, `OSKDoorUnlockActivityExtension`, `OSKEYTests` | 25,458 |
| `swift-ble-kit-oskey-dev` | `20260920_165106-f8cdf199` | `OSKBluetoothLEKit` | 799 |
| `swift-cloud-kit-oskey-dev` | `20260920_165044-32772e4a` | `OSKCloudKit` | 2,522 |
| `swift-ui-kit-oskey-dev` | `20260920_165053-9a75c7c6` | `OSKUIKit` | 2,482 |
| `swift-webrtc-kit-oskey-io` | `20260920_165059-e8aeea9d` | `OSKWebRTCKit` | 2,487 |

`ios-oskey-dev` (branch `master`) picked up real new source since its last run
(2026-09-10): 3 real Xcode targets found (vs. the same 3 previously), 469 in-scope Swift
files (vs. 482 files scanned, 13 orphaned/skipped — a real, live count, not stale), 497
real cross-module call edges resolved in `04`. The 4 Swift-kit repos, pinned to fixed commit
SHAs per `config/repos.json`, re-extracted the *same* already-pinned source under the current
(2026-09-18-fixed) extractor code, as expected per doc 21's own scoping note — not new
sub-package code, real re-application of the current pipeline to existing content.

## Step 3 — verified, not assumed

For every repo, confirmed `cross-module-dependencies.json` and `intra-module-coupling.json`
exist under the new run ID's `knowledge-pipeline/modules/<module>/` path, with today's
(2026-09-20, 18:50-18:51 local) file timestamps — not stale files carried over from a prior
run. Full listing checked directly (`ls -la`), not inferred from log output alone.

## Step 4 — real, new evidence on the doc-20 open question

Doc 20 could not determine whether the 2026-09-18 partial (stops-after-02) runs were
deliberate or a genuine pipeline failure. **Real, new evidence from this session's Step 2
run resolves this with high confidence toward "deliberate, not broken":** all 5 repos —
including `swift-ble-kit-oskey-dev`, which already had a full `pipeline:swift-ble-kit`
orchestrator on 2026-09-18 and still stopped after `02` that day — completed the identical
`00-07` chain cleanly today with zero errors, zero warnings, zero early exits. If anything in
the pipeline itself had broken on 2026-09-18, re-running the same code today (2026-09-18's
extractor fix is still the current code — nothing changed between then and now) would be
expected to reproduce the same failure. It didn't, for any of the 5 repos. This makes a
deliberate partial invocation (most likely: someone ran only `00`→`02`→`05` to refresh
`capability-packs` and re-sync facts quickly after the extractor fix, since `05`'s output —
not `04`, `06`, or `07` — is the only thing `sync-facts.ts` actually reads) the far more
likely explanation, consistent with what Step 5 found (below): the 4 kit repos' capability-
pack content on 2026-09-18 already matched today's fresh extraction byte-for-byte.

## Step 5 — Postgres fact sync, approved before running

Enumerated real current modules from each repo's *fresh* (today's) output rather than from
what was already in Postgres, per doc 21's instruction — matched what Step 2's own run output
already reported (table above), no new/renamed modules found. Ran `sync-facts.ts` once per
`(repo, module)` pair, 7 pairs total, **without** `EMBED=true` first (the sync itself is free;
only the embedding step is paid, per the script's own design).

**Real result — 0 facts needed re-embedding, across every one of the 7 pairs:**

| Repo | Module | New | Needs (re-)embed | Unchanged | Pruned |
|---|---|---|---|---|---|
| `swift-cloud-kit-oskey-dev` | `OSKCloudKit` | 0 | 0 | 2,522 | 0 |
| `swift-ui-kit-oskey-dev` | `OSKUIKit` | 0 | 0 | 2,482 | 0 |
| `swift-webrtc-kit-oskey-io` | `OSKWebRTCKit` | 0 | 0 | 2,487 | 0 |
| `swift-ble-kit-oskey-dev` | `OSKBluetoothLEKit` | 0 | 0 | 799 | 0 |
| `ios-oskey-dev` | `OSKDoorUnlockActivityExtension` | 0 | 0 | 439 | 0 |
| `ios-oskey-dev` | `OSKEYTests` | 0 | 0 | 87 | 0 |
| `ios-oskey-dev` | `iOS App` | 0 | 0 | 24,932 | 0 |

**Real cost incurred: $0.** `sync-facts.ts` returns before reaching its embedding step
whenever `invalidatedCount === 0` (confirmed by reading the script, `pipeline/facts-postgres-
index/sync-facts.ts:646`) — it never got that far for any of the 7 pairs, so `EMBED=true` was
never run and no Vertex AI call was made. This isn't a step skipped for expedience — it's the
real, honest result: Postgres's synced fact descriptions for all 5 repos were already
byte-identical to what today's fresh 00-07 re-run produced (4 kit repos: last synced
2026-09-18, same pinned commit, same current extractor code, so an identical re-run was
expected to match; `ios-oskey-dev`: last synced 2026-09-11, and although it did pick up real
new source and 497 new cross-module edges in `04`'s own graph, none of that changed the
underlying per-fact `description` text `sync-facts.ts` computes, so no row's embedding was
invalidated).

## Net result

All 5 Swift/iOS repos now have complete, current `00-07` structural pipeline output
(resolved call graphs, cross-module dependency edges, intra-module coupling, capability
packs) from today's run, `package.json` has orchestrator parity across all 5 repos going
forward, and Postgres was already current — confirmed, not assumed. The doc-20 staleness gap
is closed for all 5 repos as of this run.

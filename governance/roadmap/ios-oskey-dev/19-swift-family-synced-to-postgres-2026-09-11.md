# Swift Family Synced to Postgres for the First Time, 2026-09-11

Real, verified completion of the "next natural step" flagged in `18-cross-repo-dependency-graph-deferred-to-p2-2026-09-10.md` — this is the one real piece of P2 the user asked to proceed with (the facts sync itself, not the cross-repo dependency graph, which stays deliberately deferred per that doc).

## Real, verified result

All 7 real modules across the 5 already-onboarded Swift repos synced into the shared `facts` Postgres table for the first time:

| repo | module | facts synced |
|---|---|---|
| `ios-oskey-dev` | `iOS App` | 24,932 |
| `ios-oskey-dev` | `OSKDoorUnlockActivityExtension` | 439 |
| `ios-oskey-dev` | `OSKEYTests` | 87 |
| `swift-ble-kit-oskey-dev` | `OSKBluetoothLEKit` | 799 |
| `swift-cloud-kit-oskey-dev` | `OSKCloudKit` | 2,488 |
| `swift-ui-kit-oskey-dev` | `OSKUIKit` | 2,482 |
| `swift-webrtc-kit-oskey-io` | `OSKWebRTCKit` | 2,487 |
| **Total** | | **33,714** |

No embeddings were generated (`EMBED` not set) — that remains a separate, explicit, paid step per this pipeline's own standing rule; every fact above sits with `embedding IS NULL`, ready for that step whenever it's explicitly requested.

## Two real, pre-existing gaps found and fixed before this could run cleanly

**1. `05-partition-capability-packs.ts` was stale for the 4 leaf packages.** After the Task 12 follow-up fix (`17-...md`) re-ran `00`/`01`/`02` for all 5 repos, `05` (which `sync-facts.ts` actually reads from) was only re-run for `ios-oskey-dev` as part of that fix's own verification pass — the 4 leaf packages' `capability-packs/` directories still pointed at their pre-fix run. Caught immediately (`sync-facts.ts` fails closed with a clear "no capability-packs directory" error, not a silent wrong-data read) and fixed by re-running `05` for all 4 before syncing.

**2. Real, genuine Postgres bug: a ~28,000-character `calleeExpression` broke the `facts` table's own primary key index.** `ios-oskey-dev`'s own `OSKUserProfileUpdateForm.swift:133` has a real, deeply-chained SwiftUI view-builder call whose `calleeExpression` (the full raw callee text, by design — see `main.swift`'s own `rootIdentifierOf()` header for why the ROOT identifier is computed separately and this full text is kept, not truncated) is used verbatim as a `stableFactId()` component. That ID became the fact's Postgres primary key, and a ~28KB key value is real, valid data but exceeds Postgres's own btree index-row limit (`index row size 2816 exceeds btree version 4 maximum 2704 for index "facts_pkey"`) — a genuine index-page constraint, not a bug in Postgres itself, and not something any of the 4 already-synced repos' own real call chains happened to be long enough to trigger before.

**Fixed in `pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts`'s own `stableFactId()`**: any primary/secondary key component over 200 characters is replaced with a bounded prefix plus a deterministic SHA-1 suffix (`boundedIdComponent()`) before being folded into the ID — keeps every real ID well under any real index limit, stays genuinely stable (identical real oversized text always produces the identical bounded ID), and keeps a readable prefix rather than opaquely hashing the whole thing. Deliberately **not** fixed by shortening `calleeExpression` itself upstream — that field's full, untruncated text is real, wanted data for the description text (`callExpressionDoc`), and this bug was about the ID derivation, not the data.

**Real, flagged, NOT fixed**: `stableFactId()` is independently duplicated in all 5 pipeline folders (TS x3, Kotlin, Swift) — the same unbounded-component design exists in every one of them, and none of the other 4 repos' own real call chains have apparently been long enough to trigger this same class of failure yet. This is a real, latent, cross-language risk, not chased down or fixed in the other 4 copies in this pass (out of scope for what was asked — flagged here so it isn't rediscovered from scratch if a future repo's own code eventually produces an equally long expression).

## Verified before and after the fix

- Confirmed root cause directly: queried `ast-calls.json` for the longest real `calleeExpression` values before assuming anything (28,691 / 28,504 / 28,212 / 28,173 / 28,147 characters, all four lines pointing at the same real file/line).
- Re-ran `02`+`05` for `ios-oskey-dev` after the fix, then re-synced all 3 of its modules. `OSKDoorUnlockActivityExtension` showed a real, expected side effect: 11 facts' IDs changed (old, unbounded IDs removed as stale; new, bounded IDs inserted) — confirms that module also had at least one real oversized component, now correctly bounded.
- Confirmed the `imports_dependency` description-enrichment fix (`governance/roadmap/facts-serving-strategy/17-imports-dependency-description-enrichment-fix-2026-09-11.md`) is live for this real sync — Swift's real `resolved_in_repo`/`resolved_cross_repo` facts now carry their enriched description from their very first sync, not needing a later re-sync the way the 4 pre-existing repos do.

## Not done, deliberately

- No embeddings generated (real, paid step, requires explicit `EMBED=true` request).
- No cross-repo dependency-graph artifact — per `18-...md`, deliberately deferred.
- The 4 pre-existing repos' own `imports_dependency` facts (2,547 real `resolved_in_repo` rows, per `facts-serving-strategy/17-...md`) still carry their pre-fix, unenriched description until they're each re-synced — not done here, not asked for in this pass.

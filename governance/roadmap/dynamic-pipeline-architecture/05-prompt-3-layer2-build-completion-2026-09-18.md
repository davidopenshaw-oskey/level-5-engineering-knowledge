# Layer 2 build completion: what was actually built and verified

Executes `04-prompt-3-layer2-build-plan-2026-09-18.md`. Real code written, real pipeline runs executed, real facts inspected — this is a completion report, not a plan. **No `sync-facts.ts` run yet (see "Not done" below) — nothing has been written to the shared Postgres `facts` table by this session.** Standing rule still applies: no `git add`/`git commit` — everything below is uncommitted, on disk only.

## What was built

### 1. `rest_endpoint_call` (Kotlin, `android-intercom-oskey-io` → `node-iot-api-oskey-io`)

Files changed:
- `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts` — new `HTTP_METHOD_ANNOTATION_NAMES` constant + `httpMethodAnnotationOf()` helper (mirrors `isAnnotatedWith`'s already-proven "annotation nested in the declaration's own `modifiers` child" shape, not `kotlin-ast-utils.ts`'s `annotationNamesIn`'s different, sibling-based shape — the two are genuinely different real grammar cases in this codebase, confirmed, not interchangeable). New derivation reuses the existing functions-loop's already-computed `owningClass` (see correction below) and `params`. New raw evidence file `ast-rest-endpoint-calls.json`.
- `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` — new `restEndpointCalls` entry in `EXPECTED_EVIDENCE_TYPES`, new fact-emission block (`type: "rest_endpoint_call"`, primaryKey = the literal path, secondaryKey = HTTP method), new summary-count field.

**Real correction found while building this** (now fixed in `03-...md` and `04-...md` too): the investigation and build plan both claimed `findEnclosingClassName` needed extending to handle `interface_declaration`. Wrong — this tree-sitter-kotlin grammar has no separate `interface_declaration` node type at all; `interface Foo {}` parses as a `class_declaration` (already documented in this file's own section-2 header comment, just not cross-checked against the investigation's claim before now). **Zero helper changes were needed.**

**Verified live**: ran the real pipeline (`00-scan-repo` → `01-extract-ast-evidence` → `02-build-module-evidence`) against a fresh clone. Result: exactly 5 `rest_endpoint_call` facts, all in the `app` module, `owningInterface: "OSKApiService"` correctly populated on every one, real paths/methods/line numbers/parameters matching the real source file exactly (spot-checked all 5, not a sample). Local only — `output/runs/android-intercom-oskey-io/20260918_154849-f2cac85f/`, not yet synced to Postgres.

### 2. `firebase_callable_call` (Swift, `swift-cloud-kit-oskey-dev` → `firebase-oskey-dev`)

**Real correction, repo attribution**: the real `OSKCKFunctionService` call sites live in `swift-cloud-kit-oskey-dev`'s own source (the SPM package), not `ios-oskey-dev` (the app shell) — `ios-oskey-dev` only *consumes* this package. The build (and the pipeline run to verify it) targets `swift-cloud-kit-oskey-dev`, per `config/repos.json`'s own already-existing entry for it.

Files changed:
- `pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts` — new derivation loop matching `call.rootIdentifier === "OSKCKFunctionService"` (confirmed: `calleeExpression` varies per generic response type, `rootIdentifier` doesn't — no swift-extractor binary change needed, `rootIdentifierOf`'s existing `GenericSpecializationExprSyntax` handling already produces the stable identifier). New raw evidence file `ast-firebase-callable-calls.json`.
- `pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts` — new `firebaseCallableCalls` entry in `EXPECTED_EVIDENCE_TYPES`, new fact-emission block (primaryKey = the real Cloud Function name, secondaryKey = region), new summary-count field.

**Real correction found while building this** (now fixed in `03-...md`): the investigation's "36 real call sites" was a raw grep count, never cross-checked against comments. Verified directly against the real, structural extraction: **2 of those 36 grep hits are commented-out code** — one `//`-commented line in `OSKCKUserBuildingAccessService.swift:91`, one entire function inside a `/* ... */` block in `OSKCKUserInvitationService.swift:25-38`. The real SwiftSyntax parser correctly treats both as trivia, not real call expressions. **The real, verified count is 34.**

**Verified live**: ran the real pipeline against a fresh clone of `swift-cloud-kit-oskey-dev`. Result: exactly 34 `firebase_callable_call` facts, spot-checked 3 against real source (function names, regions, `callerFunction`/`callerClass` all correct — e.g. `core-createQuickcode` at `OSKCKPinCodeService.swift:38`, caller `generatePinCode`). Local only, not yet synced to Postgres.

### 3. `firebase_callable_call` (Kotlin, `android-oskey-io`) — structural-only, per the explicit onboarding-deferral decision

New file: `pipeline/android-oskey-io/phase-01-ast-extraction/extract-firebase-callable-calls.ts` — a standalone script, deliberately **not** part of a numbered 00-07 pipeline sequence (no `config/repos.json` entry exists for this repo; none was added). Real, two-hop resolution: builds a global `enum case name -> literal value` table from `CloudFunctions`'s own `enum_entry` declarations, separately collects every `getHttpsCallable(...)` call site's referenced `<EnumType>.<Case>.value`, then joins them.

**Two real, non-obvious problems found and fixed while building this** (neither was anticipated in the plan, both are genuine, worth knowing about before anyone re-derives this logic):

1. **This project's installed `tree-sitter-kotlin` (0.3.8) binding cannot parse this file in one call.** `OSKFirebaseFunctionsDataSource.kt` is ~65KB/1360 lines; parsing throws a native `Invalid argument` error. Bisected directly (not guessed): parses cleanly up to 32,000 chars, fails at 33,000+ — a real, hard ~32KB ceiling in this specific binding (plausibly a fixed native buffer on the N-API boundary), unrelated to this file's content (confirmed pure ASCII, no encoding issue). Fixed by parsing the file in several overlapping chunks, sized dynamically off the real line count (not hardcoded to "2 chunks" or any fixed number) and kept safely under the real ceiling.
2. **Chunking broke both enum resolution and enclosing-class resolution, for two different reasons, fixed two different ways**:
   - The `CloudFunctions` enum is declared once, near the top of the file; a chunk built for call sites later in the file never contains that enum declaration in its own parse tree. Fixed by building the enum-literal table as a **global union across every chunk**, before resolving any call site against it — not a per-chunk-local table (the bug this shipped with on the first attempt: 33 candidates found, only 8 resolved, until this fix).
   - Separately, a **genuine tree-sitter-kotlin grammar quirk** (not a chunking artifact) breaks parsing of the file's own outer class declaration: `class OSKFirebaseFunctionsDataSource @Inject constructor(...) : ... {` has its `@Inject` annotation directly on the primary constructor, a different position than the class-level annotation quirk `kotlin-ast-utils.ts` already documents — confirmed by dumping the real parse tree, the class's name/constructor/delegation nodes appear as flat top-level siblings instead of a real `class_declaration`. Chasing a general grammar fix was out of scope for this "quick win" pass; supplied the real, independently-verified class name (`OSKFirebaseFunctionsDataSource`, confirmed by directly reading the file during the investigation) directly instead, with an honest comment explaining why — not a silently-generalized guess.

**Verified (Tier 2, structural/dry-run only, per the plan's §2 resolution)**: ran directly against the existing manual clone at `output/clones/android-oskey-io/`. Result: exactly 32 real call sites, **all 32 resolved** (zero nulls — the bar the plan itself set, since every one of these 32 names is a real, known literal with no legitimate "unresolved" case). Spot-checked first and last entries against real source — correct. This is explicitly **not** claimed as "done" in the Layer-1-facing sense: no Postgres facts exist for this repo, and none will until the dedicated onboarding session (per the user's own 2026-09-18 decision) runs it for real.

## Addendum: real Postgres sync completed, 2026-09-18 (same session, user confirmed)

Ran for real, against the local `facts-postgres-index-local` Docker instance (confirmed local-only — port 5433, not a shared/remote database, per its own `docker-compose.yml` header comment; already running 8 days, real pre-existing data from prior syncs).

**Real, pre-existing bug found and fixed first, unrelated to this build**: `sync-facts.ts` still targeted `ON CONFLICT (fact_id)`, but the live table's real primary key is `fact_ref` (a generated, deterministic `sha1(fact_id)` column) — post-ADR-010, never updated in this script, which was apparently missed from that migration's own touch-point inventory. Confirmed via the real error (`no unique or exclusion constraint matching the ON CONFLICT specification`) before assuming anything. Fixed with the user's explicit confirmation: changed the one `ON CONFLICT` target from `fact_id` to `fact_ref` — safe and behavior-preserving, since `fact_ref` is a deterministic function of `fact_id` (same `fact_id` always produces the same `fact_ref`), so this changes nothing about which rows conflict, only which real column Postgres matches against.

Ran `05-partition-capability-packs.ts` (deterministic, reads only `02`'s own output, confirmed zero-LLM) for both repos, then `sync-facts.ts` scoped to only the two modules that actually changed — `android-intercom-oskey-io`/`app` and `swift-cloud-kit-oskey-dev`/`OSKCloudKit` — leaving the other 4 android-intercom modules untouched. `EMBED` was **not** set to `true` — no paid embedding API call was made; new/changed facts land with `embedding = NULL`, structurally real and queryable but not yet semantically searchable until a separately-confirmed embedding pass runs.

**Real results, confirmed live in Postgres**:
- `android-intercom-oskey-io`/`app`: 72 new facts total (not just the 5 `rest_endpoint_call` — re-cloning the repo's current `develop` tip picked up other real code changes since the last sync, an honest, expected side effect, not a bug), 3 stale facts pruned, **exactly 5 `rest_endpoint_call` rows**, all verified correct (symbol_name/description/file/line match real source).
- `swift-cloud-kit-oskey-dev`/`OSKCloudKit`: 34 new facts, 0 pruned (this repo's `master` tip hadn't moved since the last sync), **exactly 34 `firebase_callable_call` rows**, all verified correct.

Both fact kinds are now real, live, queryable rows in the shared local index — not just local pipeline output. Not yet embedded (563 + 34 facts pending, real cost deliberately not incurred without a separate, explicit go-ahead).

## Addendum 2: embedding run, 2026-09-18 (same session, user confirmed)

Ran `sync-facts.ts` a third time for each module, same command, with `EMBED=true` added — the one gated, real-cost step. Real, confirmed outcome:
- `android-intercom-oskey-io`/`app`: 563/563 facts embedded, 39,864 real tokens (per `embedding_calls`, this project's own logged usage, not estimated).
- `swift-cloud-kit-oskey-dev`/`OSKCloudKit`: 34/34 facts embedded, 1,902 real tokens.
- **41,766 tokens total**, real Vertex AI `gemini-embedding-2` spend, in line with the order-of-magnitude estimate given before running (30,000–40,000).

Verified directly: zero facts with a NULL embedding remain in either module (`6562/6562` and `2522/2522`). The two new fact kinds specifically: `rest_endpoint_call` 5/5 embedded; `firebase_callable_call` 136/136 embedded (136, not 34 — Angular already had 102 pre-existing real facts of this same kind from an earlier sync; today's 34 are included and confirmed embedded alongside them). Both fact kinds are now genuinely semantically searchable via vector similarity, not just structurally present.

## What was NOT done (explicit, not an oversight)

- **Embedding was not generated** for either repo's new/changed facts (563 for android-intercom's `app` module, 34 for swift-cloud-kit's `OSKCloudKit`) — the one real paid step in this whole pass, deliberately gated behind an explicit `EMBED=true` flag the user hasn't given yet.
- **`android-oskey-io` onboarding** — no `config/repos.json` entry, no `00-scan-repo.ts` run, no Postgres facts. Deliberately deferred, per the user's own decision recorded in `04-...md` §2.
- **Firestore path facts** (`firestore_document_access`/`firestore_collection_access`, both languages) — deliberately sequenced out of this build pass per `04-...md` §1 (needs a real SwiftSyntax visitor addition + Swift binary rebuild, a materially heavier lift than the three patterns built here).
- **`realtime_signaling_channel`** (Socket.IO) — deliberately out of scope for this whole initiative, per the user's own decision in `03-...md` Addendum 2.
- **Layer 1** (`build-cross-repo-edges.ts` generalization) — untouched, per this initiative's own scoping; the fact-kind names and repo pairs it needs are in `04-...md` §4.

## Real, live corrections made to prior docs during this build (not hidden, all marked in place)

- `03-...md` §1: "36 real call sites" → corrected to 34, original text preserved with a strikethrough + correction note (2 grep false positives, both comments).
- `03-...md` §2: the claimed `findEnclosingClassName`/`interface_declaration` gap → corrected to "no gap, this grammar has no `interface_declaration` node type," original text preserved the same way.
- `04-...md` §3.3, §5, and the Layer-1 hand-off table: same two corrections propagated, plus the `ios-oskey-dev` → `swift-cloud-kit-oskey-dev` repo-attribution fix for where the real Swift facts actually land.

## Addendum 3: Swift family alignment, 2026-09-18 (same session, user requested)

Per the user directly: before running embeddings, bring every other Swift repo up to the same pipeline-freshness level as `swift-cloud-kit-oskey-dev` — not because they carry the `firebase_callable_call` edges this initiative cares about (confirmed in the original investigation: zero Firebase usage in any of them), but so the whole Swift family reflects the current, updated shared `pipeline/swift/*.ts` scripts consistently, not just the one repo this build happened to touch first.

Ran the full real chain (`00-scan-repo` → `01-extract-ast-evidence` → `02-build-module-evidence` → `05-partition-capability-packs` → `sync-facts.ts`) for the three other real, in-scope Swift kit repos: `swift-ble-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`. **`swift-ai-kit-oskey-io` deliberately excluded** — stays out of scope per the user's own earlier 2026-09-18 decision; flagged this exclusion back to the user rather than assuming "all" meant literally every Swift repo.

Confirmed `firebaseCallableCalls: 0` for all three (expected — no Firebase usage in any of them, already established in the investigation). Real drift picked up since each repo's last sync (2026-09-11): `swift-ble-kit-oskey-dev` 6 new/changed facts (6 stale pruned), `swift-ui-kit-oskey-dev` 198 (198 pruned), `swift-webrtc-kit-oskey-io` 43 (43 pruned) — real upstream commits landed on each repo's tracked branch since the last sync, not a pipeline artifact.

Embedded all three afterward, in one combined pass covering the whole family (per the user's own sequencing: align everything first, embed once at the end). Real usage: `swift-ble-kit-oskey-dev` 6 facts/971 tokens, `swift-ui-kit-oskey-dev` 198 facts/96,282 tokens, `swift-webrtc-kit-oskey-io` 43 facts/8,194 tokens — **105,447 tokens this pass**, on top of the 41,766 from Addendum 2. Verified directly: zero facts with a NULL embedding remain anywhere in the Swift family (`swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io` all confirmed `0` unembedded).

## Real next step

Both fact kinds are now live in Postgres — Tier 1 testing (per `04-...md` §5) is complete for both. Remaining real open items: (1) embed the 563 + 34 pending facts, whenever the user wants to incur that real cost; (2) `android-oskey-io` onboarding, still deliberately deferred; (3) hand `04-...md` §4's fact-kind/repo-pair table to whoever picks up Layer 1 (`build-cross-repo-edges.ts` generalization) — real, queryable data now exists for it to validate against, not just a plan.

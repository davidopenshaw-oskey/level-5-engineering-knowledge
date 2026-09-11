# Kotlin/Android Pipeline — Status Audit, 2026-09-11

**Purpose of this file:** a consolidated audit, not a new roadmap folder for ongoing work. Compiled by reading every file in `governance/roadmap/android-intercom-oskey-io/`, `governance/roadmap/android-oskey-io/`, `governance/roadmap/swift-kotlin-preparation/`, plus every other real Kotlin/Android mention found via a repo-wide grep across `governance/roadmap/` and `governance/adrs/`. Every claim below is either read directly from a real file (cited) or verified directly against live code/Postgres in this same pass (marked "verified live"). Where a cited doc's own claim is now stale (superseded by later, unrelated work), that's flagged explicitly rather than silently repeated.

---

## 1. Real, current pipeline status — what's actually done

**P1 (AST extraction) is complete and verified, Tasks 1-8**, per `android-intercom-oskey-io/02-p1-build-tasklist.md`'s own status line (all 8 tasks struck through with resolution notes) and `15-task8-downstream-scripts-built-and-verified-2026-09-09.md`. Tool choice: `tree-sitter-kotlin` + a custom import-aware resolver (`09-task1-decision-tree-sitter-plus-import-aware-resolver-2026-09-08.md`) — `kotlin-compiler-embeddable` and the standalone Analysis API were both real candidates, rejected after a bounded parse test, not from research alone (`08-task1-consolidated-checklist-2026-09-08.md`).

**P2 (Postgres/pgvector sync) is complete for all 5 modules, fully embedded.** Verified live: `SELECT count(*), count(embedding) FROM facts WHERE repo='android-intercom-oskey-io'` → 9,750 / 9,750. No narrative-synthesis (phase-02-inter-module-synthesis) layer exists or is planned — see §5.

**Real bugs found and fixed since Task 8's own "done" mark** (i.e., real work discovered *after* the pipeline was already declared complete — worth knowing this pattern repeats, not a one-off):
1. `00-scan-repo.ts`'s reachability BFS falsely tagged real, referenced files `_unreferenced` in two distinct ways — unseeded infra-file BFS (Application-subclass/`@Module`/`NavHost` files pinned shared but never used as BFS seeds) and unmatched qualified companion-member imports (`import X.Companion.CONST` never matched the bare-name lookup table). Both fixed and re-verified end-to-end, 2026-09-09 (`16-real-downstream-consequence-of-unreferenced-tagging-2026-09-09.md`, addendum in `10-task3-scan-repo-built-and-verified-2026-09-09.md`).
2. `01-extract-ast-evidence.ts` never captured a call expression's own arguments — fixed 2026-09-09, closed real evidence gap on `homeButtons.contains("contact")`-style checks (`17-model-property-description-gaps-homeButtons-2026-09-09.md`).
3. `sync-facts.ts`'s `descriptionFor()` had two Kotlin-specific field-name mismatches (`model_property`'s type never rendered — code checked `propertyType`, Kotlin's real field is `declaredType`; `function_declaration`'s `owningClass` never rendered for non-composable functions). Fixed and re-verified live 2026-09-11 (this session, not yet its own dated doc — see §7 for the housekeeping note this creates).

**Real conclusion**: every fix above was found by testing real output against real data *after* a prior "done" declaration, not by re-reading the code. Treat this as a repeatable pattern, not evidence Task 8 was wrong to call itself done at the time.

---

## 2. Real, currently open — not yet decided or fixed

### 2a. `stableFactId()`'s unbounded-length primary key — confirmed real for Swift, **not yet checked for Kotlin**

`ios-oskey-dev/19-swift-family-synced-to-postgres-2026-09-11.md` found a real, genuine bug: a ~28,000-character `calleeExpression` folded verbatim into `stableFactId()`'s output broke Postgres's own btree index-row limit (`index row size 2816 exceeds btree version 4 maximum 2704 for index "facts_pkey"`). Fixed for Swift only (`boundedIdComponent()`, a 200-char-prefix-plus-SHA1-suffix scheme, added to `pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts`). That doc's own explicit, flagged caveat: **`stableFactId()` is independently duplicated in all 5 pipeline folders (TS ×3, Kotlin, Swift) — the same unbounded-component design exists in every one of them, and none of the other 4 repos' own real call chains have apparently been long enough to trigger this failure yet.** Kotlin's own copy (`pipeline/android-intercom-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`) has not been checked for a real oversized component, and the fix has not been ported. **Real, concrete next step, not yet done**: query `ast-calls.json`'s real `calleeExpression` lengths (and any other free-text field folded into a `primaryKey`/`secondaryKey`) the same way the Swift investigation did, before assuming Kotlin is safe by default.

### 2b. `heritageOf()` only captures the first supertype/interface — real, structural, confirmed latent

Found and verified this session (2026-09-11): `01-extract-ast-evidence.ts`'s `heritageOf()` takes `findNodesOfType(classOrObjectDecl, "delegation_specifier")[0]` — the first entry only. Kotlin's syntax conflates superclass + interfaces into one comma list with no separate keyword (`class Foo : Bar(), Baz, Qux`), so a real multi-interface class would silently lose everything past the first. **Checked directly against the real repo — currently latent, not active**: none of the 13 real interfaces or any class/object found via direct source search implements/extends more than one supertype today. Not fixed (nothing currently depends on it), but a real landmine the moment a future PR adds one. Distinct from the equivalent, now-real, now-fixed TS gap (`implements Foo, Bar` was never captured at all in any of the 3 TS repos) — see the same audit's own cross-check for why Swift was unaffected (built as an array, `extendsTypes: string[]`, from day one).

### 2c. `OSKGetCurrentLocation.kt` remains tagged `_unreferenced` — known, deliberate, not a bug

Confirmed via `16-...md`: this is the accepted same-package-without-import limitation from Task 3 (a general fix was tried twice, reverted both times after real re-runs showed cascading collapse through shared utility packages). Its own real outbound import is the direct, now-*explained* cause of the `Home`/`_unreferenced` intra-module-coupling anomaly flagged in `15-task8-...md`. Not scheduled to be fixed — the general-case fix has already been shown to cause more damage than it solves in this repo's own real structure.

### 2d. Report-coverage gap — is Kotlin (and Swift) in scope, or permanently facts-only?

`graphrag/01-findings-and-open-questions-2026-09-10.md` §6/§8b, both real and current:
- **Real, user-confirmed decision, 2026-09-10**: Kotlin (`android-intercom-oskey-io`) and the Swift family get **pgVector facts only, no narrative-synthesis (phase-02) report layer** — asked and decided directly, not assumed. This is a real, closed decision, not open.
- **What's genuinely still open**: whether the underlying report-coverage gap (`knowledge-corpus/` has real reports for only 3 of 9 P1-extracted repos) means `android-intercom-oskey-io` specifically should get a report despite the above, or whether the "facts-only" decision already resolves that question for it too. §6's own text: "likely `android-intercom-oskey-io` and `ios-oskey-dev` are the two real app repos genuinely needing the same treatment... **not confirmed, needs its own investigation**." The 2026-09-10 facts-only decision (§8b) reads as the actual, final answer to this — but the two sections were never explicitly reconciled in that doc. Worth a one-line confirmation, not a re-investigation.

### 2e. The GraphRAG two-tier retrieval question — directly affects Kotlin's own retrieval quality, not decided

Per `graphrag/01-...md` §9: whether a report-tier gets built at all is unresolved. **Real, load-bearing consequence already decided for Kotlin specifically (§8b)**: even if a two-tier design is eventually built, it would only ever cover the 3 TS repos on the report side — `android-intercom-oskey-io` falls back to fact-tier-only retrieval permanently, "not an edge case that closes over time." Any future retrieval-quality work for Kotlin should assume this, not wait for a report tier that was already decided not to include it.

---

## 3. Real, open, agent/MCP-side issues tied directly to Kotlin's own corpus (not a Kotlin pipeline bug, but genuinely about this repo's real data)

All found via the `mcp-direction/` folder's own real testing against `android-intercom-oskey-io`'s live facts (the "intercom home-button" business-request case, `evals/3-intercom-home-button.eval.json`):

- **Bounded-search-effort rule not reliably followed** — a live run made 9 consecutive rephrased searches on one sub-question (`homeButtons`/`OSKConfiguration`) before appearing to move on, then returned to it again at the very end (`mcp-direction/39-intercom-v2-live-run-cancelled-2026-09-10.md`). Directly confirms ADR-009 §3/§4's still-open question: soft persona instruction vs. a real, code-enforced per-sub-question attempt counter. **Real, tested-and-rejected fix idea**: a "no new fact_ids" counter was stress-tested against 4 real replayed runs and found to have a real false-negative risk on this exact case (misses 5 real wasted searches before ever triggering) — not yet redesigned.
- **`walk_cluster` can crash the whole run on a fabricated anchor fact_id** (`mcp-direction/19-session-handoff-2026-09-07.md`) — an uncaught `[Fail-Closed]` throw instead of a recoverable `confident: false`-style result. Flagged 2026-09-07, **status since not confirmed either way in this pass** — worth checking whether this was addressed alongside the later, more specific `_unreferenced`-fabrication fix (§1, item 1 above) or remains a separate, still-open robustness gap.
- **The Vertex AI quota ceiling (5 req/min default for `gemini-3.5-flash`, no per-model override) is a real, still-unresolved operational blocker** (ADR-009 §4, `mcp-direction/30-intercom-quota-blocker-pause-2026-09-09.md`) — directly caused a real crash during the intercom test case specifically. **Cross-reference worth noting**: this session separately researched the `gemini-3.5-flash` → `gemini-3.7-flash` deprecation/migration question (real, current pricing and breaking-API-change findings, not yet a decision) — a model migration could plausibly change or resolve this quota ceiling too, not evaluated together yet.
- **`atomic-prd-agent.ts`'s `DEFAULT_PERSONA_PATH` still points at the old, known-broken `atomic-prd-agent-persona.md`** (not the active, iterated `atomic-prd-agent-skills.md`) — confirmed via cross-session message (2026-09-10/11) as a deliberate, not-yet-revisited decision ("we need to work later on how the mcp receives context and skills"), not an oversight.
- **The `_unreferenced`-marker citation-fabrication weakness itself** (§1 above closed the *data* side — the 2 specific files no longer say `_unreferenced`) has **not** been closed on the *agent* side: no explicit instruction yet exists telling the model that internal markers like `_unreferenced` are description-only text, never real `fact_id` material. Real risk remains general (any other repo's own unusual description text could trigger the same fabrication pattern) — flagged in `16-...md` §"two-sided implication," side 2 still open as of this audit.

---

## 4. Corrections to other docs' own claims, found stale during this audit

- **`facts-serving-strategy/17-imports-dependency-description-enrichment-fix-2026-09-11.md`'s own table lists `android-intercom-oskey-io: 244` real `resolved_in_repo` facts as still carrying the old, unenriched description.** **Verified live, now false**: this session's own later re-sync (fixing §1 item 3 above) ran `sync-facts.ts` for all 5 Kotlin modules after that fix was already live in the shared file, which retroactively picked it up. Verified directly: `SELECT count(*) ... WHERE repo='android-intercom-oskey-io' AND kind='imports_dependency' AND resolvedTargetModule resolved AND description LIKE '%-- resolves to:%'` → 244/244. **The gap that doc describes is real and still open for `firebase-oskey-dev` (1,740), `angular-app-oskey-io` (491), and `node-iot-api-oskey-io` (72) — just no longer for Kotlin.**

---

## 5. Housekeeping, not architectural

- **`governance/roadmap/android-oskey-io/` is a completely empty folder** — zero files. Likely a stray creation from before `android-intercom-oskey-io` became the settled name. Not cleaned up; harmless, but worth removing or explaining if it keeps confusing folder listings.
- **`swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md` and `01-real-findings-from-android-intercom-onboarding-2026-09-07.md`** are early (2026-09-07) docs, explicitly self-described as "anticipation, not findings" (`00-...md`) or as real-but-now-largely-absorbed-elsewhere (`01-...md`, whose own content is superseded by `android-intercom-oskey-io/00-...md` and `01-standing-principles-...md`, both more current and more authoritative). One real, stale, unflagged data point inside `01-...md`: it states the Android app is "real-pinned to Kotlin 1.8.10... confirmed real and working this session" as the toolchain basis for extraction — this predates Task 1's actual decision (`tree-sitter-kotlin`, a syntax-only tool needing no JDK/Gradle/compiler toolchain at all). Not corrected in place, per this project's own "mark superseded, don't rewrite" rule — flagged here instead.
- **`03-branch-tag-and-version-pin-strategy-2026-09-09.md`-equivalent question for Kotlin remains open**: `04-task1-challenge-trigger-assumption-and-branch-tag-open-question-2026-09-08.md` found this repo's own tag history has inconsistent naming that breaks naive tag-sorting (a legacy `release_1_0_3` tag outranks the real latest `1.6.0` under git's own version-sort). `config/repos.json`'s `branch: "develop"` is an explicit, tracked placeholder pending a real conversation with the repo's own developers — not blocking, but genuinely still undecided, not resolved by anything found in this audit pass.

---

## 6. What this audit did not check

- Whether `walk_cluster`'s uncaught-crash gap (§3) has since been fixed elsewhere in `mcp-server/` — flagged as unconfirmed, not investigated further in this pass.
- The real file-count discrepancy that caused `swift-ai-kit-oskey-io` to be dropped from the Swift family (mentioned in multiple `ios-oskey-dev` docs) — Swift-specific, not chased here since it doesn't touch Kotlin.
- Whether TS's own newly-fixed `implements`-clause gap (found via this same session's cross-language audit, fixed in a separate hand-off session) has completed and been re-synced — that work was handed to a different session; not re-checked here.

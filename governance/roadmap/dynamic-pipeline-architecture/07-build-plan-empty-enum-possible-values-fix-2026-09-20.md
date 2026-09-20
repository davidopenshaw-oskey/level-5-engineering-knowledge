# Build plan: fix empty enum possible-values text for the 3 TS repos (not yet built)

Follow-up to [06-findings-empty-enum-possible-values-ts-repos-2026-09-20.md](06-findings-empty-enum-possible-values-ts-repos-2026-09-20.md), which established the root cause (a Kotlin-shaped consumer in `sync-facts.ts` silently reading a TypeScript-shaped `evidence.members` array) and the real scope (31 of 31 TS-repo `enum_declaration` facts, 100%, not 30/227). This doc is the decide-stage build plan for that fix. **Nothing in this doc has been built** — planning only, per explicit instruction.

## Decisions made before this plan (real answers, not assumptions)

1. **Will the fix touch Kotlin/Swift facts?** No — verified, not assumed:
   - Swift's enum facts never read the `members` field at all; they use an entirely separate `cases` field ([pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts:77](../../../pipeline/swift/phase-01-ast-extraction/01-extract-ast-evidence.ts#L77)) consumed by its own `swiftEnumDeclarationDoc` branch in `sync-facts.ts` — no shared code path to break.
   - `sync-facts.ts` is invoked per `REPO_NAME`/`MODULE_NAME` and its `DELETE`/resync is scoped to that repo+module only ([pipeline/facts-postgres-index/sync-facts.ts:601-602](../../../pipeline/facts-postgres-index/sync-facts.ts#L601-L602)) — resyncing the 3 TS repos touches zero Kotlin/Swift rows in Postgres.
   - Grepped for any other reader of `evidence.members` beyond each repo's own extractor pair and `sync-facts.ts` — none exists. Confirmed via `grep -rln "\.members\b|ast-enums" mcp-server/ pipeline/`.
2. **TS should capture real member values, not just names** — mirroring Swift's `rawValue` and Kotlin's `constructorArgs`, using ts-morph's real, confirmed API: `EnumMember.getValue(): string | number | undefined` (confirmed present in the installed `ts-morph@28.0.0`, `node_modules/ts-morph/lib/ts-morph.d.ts:5125-5127`).
3. **Before/after snapshot + regression check against Kotlin/Swift is mandatory**, not optional — explicit user requirement, built into Phase 4 below as its own gated step.

## Phase 0 — Baseline snapshot

1. Snapshot ALL 227 `enum_declaration` facts (`fact_ref`, `repo`, `description`) to a file — not just the 31 broken ones, so Kotlin's 17 and Swift's 176 facts have a real "before" state to diff against, per this project's before-baseline testing rule.

## Phase 1 — P1 extraction fix: capture real name+value, in a new field (not `members`)

2. In each of the 3 TS extractors' `01-extract-ast-evidence.ts` (`pipeline/firebase-oskey-dev`, `pipeline/angular-app-oskey-io`, `pipeline/node-iot-api-oskey-io`), replace:
   ```ts
   members: en.getMembers().map(m => m.getName())
   ```
   with a `{name, value}[]` shape using `m.getValue()`, stored under a **new, distinctly-named field** (e.g. `enumMembers`) — deliberately NOT reusing `members`. This removes the shape ambiguity at its source rather than requiring `sync-facts.ts` to duck-type by inspecting array element types — matches the precedent this codebase already set with Swift's own separate `cases` field (see `sync-facts.ts:305-308`'s own comment: "Deliberately a SEPARATE field/branch from Kotlin's `members` above rather than force-fit into the same shape").
3. Re-run phase-01 AST extraction for those 3 repos only. This is local static analysis via ts-morph against already-checked-out source — no LLM calls, no real spend.
4. Spot-check the regenerated `ast-enums.json` by hand for the two originally-cited examples (`OSKPincodeType`, `OSKSupportedLanguageEnum`) plus the single-member `OSKApiName` case (the one the original SQL filter missed) before touching P2 at all.

## Phase 2 — P2 consumer fix (`sync-facts.ts`)

5. Add a new branch in `descriptionFor()` reading `fact.enumMembers ?? fact.evidence?.enumMembers`, formatted the same way as Swift's existing branch: `value !== undefined ? `${name} = ${value}` : name`, joined with `, `.
6. Leave the existing `kotlinEnumMembers`/`enumDeclarationDoc` branch completely untouched — once step 2 lands, TS facts no longer populate `members` at all, so Kotlin's branch only ever sees genuine Kotlin-shaped data again.
7. Grep for any other `fact.type`/branch in `descriptionFor()` that might read the new `enumMembers` field name, to avoid re-creating a fresh collision.

## Phase 3 — Resync + re-embed (real spend — flag explicitly before running)

8. Re-run `sync-facts.ts` for the 3 TS repos only. Confirm `stableFactId`'s inputs (file/line/`primaryKey`=name) are unchanged by this fix, so the resync updates existing rows rather than creating duplicate/orphaned fact_refs.
9. **Flag explicitly before running:** this step re-embeds the corrected descriptions for the 31 affected facts (`embedFactDocuments`) — small, real Vertex AI spend. State the affected count (31) so the user can approve knowingly, per this project's cost-flagging rule.
10. Do not re-run sync for the Kotlin or Swift repos — not needed, per the Phase 0/decision-1 analysis above; re-running them would be pure unnecessary spend.

## Phase 4 — Regression verification (explicitly required, not optional)

11. Diff Phase 0's snapshot against post-fix state:
    - The 31 TS facts: confirm real `name = value` (or bare `name` where `getValue()` is genuinely `undefined`, e.g. a computed/non-constant member).
    - All 17 Kotlin + 176 Swift facts: confirm descriptions are **byte-identical** pre/post-fix. Any diff here is a real regression and blocks the rest of this plan.
12. Re-run both the original `LIKE '%possible values: ,%'` query and the stricter regex-based check from doc 06 (splits the `possible values: <segment>` text on commas and checks every piece is blank) — confirm 0 facts remain affected, across all repos.

## Phase 5 — Documentation and cleanup

13. Delete temporary diagnostic/verification scripts once findings are written up — keep the actual before/after snapshot data itself (the real evidence), not the script that produced it.
14. Write a new numbered doc recording the fix and Phase 4's verification results; mark doc 06 as resolved with a dated note at its top rather than rewriting or deleting it, per this project's supersession rule.
15. Open question, not yet decided: does the raw-field-shape contract change (per-language field names instead of a shared, ambiguous `members` key) warrant a short ADR note, or is a roadmap-folder entry sufficient? Leaning toward roadmap-folder-only (this is a bug fix + data-model clarification within the existing architecture, not a new architectural direction) — worth confirming with the user before Phase 5 closes.

## Standing rules for the build session

- Never `git add`/`git commit` — only the user commits, even after a full, verified fix.
- Flag the Phase 3 embedding spend explicitly before running it (step 9) — never buried inside a larger step.
- Keep this a single mode (build) once started — the investigate (doc 06) and decide (this doc) phases are already closed; don't slide back into fresh investigation mid-build without noting it.
- Verify claims against live Postgres/real source, not assumption, exactly as decision 1 and the ts-morph API check above were done before this plan was written, not just typed with confidence.

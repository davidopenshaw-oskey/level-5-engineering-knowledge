# Prompt: Lane N (node-iot): import-alias self-pointing calls

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing files is fine; only the user commits.**

**Mode: small real build, one lane of two (round 2).** A coordinator session validates every step and grants database write turns. Lane K (Kotlin) runs in parallel on a different pipeline folder. If you find something that contradicts this prompt or the spec, **stop and report it**; don't re-plan quietly. Not sure whether something is in scope? It isn't: ask.

## Read first, in this order

1. `governance/roadmap/call-resolution-same-repo-edges/02-session-handoff-2026-10-01.md`: where round 1 left off, and its traps.
2. `governance/roadmap/call-resolution-same-repo-edges/01-build-spec-2026-10-01.md`: §4 (safeguards, write protocol), §6, and the Build log entries `[Lane E] E1` (where these 6 calls were found) and the node-iot W6 decision.
3. `governance/roadmap/call-resolution-same-repo-edges/00-findings-and-plan-2026-10-01.md` §8, first bullet.
4. `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`: "Live-DB safeguards", "Lane model and DB write protocol", and **all the W1 entries**. W1 is the same fix, made for Firebase by Lane B; you are porting it.
5. Code: `pipeline/firebase-oskey-dev/phase-01-ast-extraction/01-extract-ast-evidence.ts` (the W1 `aliasedDeclaration*` change, the precedent), `pipeline/node-iot-api-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts` (where the node-iot calls are resolved), its `02-build-module-evidence.ts` (`stableFactId()` inputs), and the consumer you must not edit: `pipeline/facts-postgres-index/build-cross-repo-edges.ts` W6 (`intraRepoCallDeclaredJoin`, ~:1600-1800; it already reads `evidence.aliasedDeclarationFile/Line/Method/Class` and `aliasedCalleeSymbol`).

## Your lane

- **Goal:** the 6 node-iot calls that "resolve" to their own file's import line get `aliasedDeclaration*` evidence pointing at the real declaration, so W6 can build edges for the 5 that are real in-repo functions (expected: node-iot `INTRA_REPO_CALL_DECLARED` 74 → about 79). The 6th, lodash `isEqual`, is an external package and gets no in-repo target.
- **You own (edit only these):** `pipeline/node-iot-api-oskey-io/**`.
- **You must not edit:** `pipeline/facts-postgres-index/**`, `pipeline/firebase-oskey-dev/**` (read it, don't change it), `package.json`, `config/repos.json`, any other pipeline. If you need a change there, write the request in the Build log and **stop**.
- **Not in scope:** Angular's larger version of the same defect (962 calls; a separate item for the user to schedule); `INTRA_REPO_CALL` for node-iot (stays switched off, by decision); anything Kotlin.

## The 6 calls (live, from the round-2 baseline)

`governance/roadmap/call-resolution-same-repo-edges/03-baseline-round2-before-2026-10-01.json` → `nodeIotSelfPointingResolvedCalls`. Rule used: `resolutionStatus = 'resolved'`, `declarationFile` = the call's own file, non-empty `declarationModuleSpecifier`.

| callee | caller | file:line | points at line | import from |
|---|---|---|---|---|
| `isEqual` | `compareAccessLists` | `src/v1/core/shared/delta.utils.ts:46` | 8 | `lodash.isequal` |
| `mergeDeltas` | `getMergedDeltasSince` | `src/v1/controllers/access_control_device_access_sync.controller.ts:81` | 11 | `../core/shared/delta.utils` |
| `compareAccessLists` | `updateFromFullList` | same file `:34` | 11 | `../core/shared/delta.utils` |
| `convertAccessPayloadDateStringToDate` | (same name) | `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts:392` | 13 | `../../models/access_control_device_access.model` |
| `isDateString` | `_getDateTime` | same file `:607` | 19 | `../../models/access_control_device_access.model` |
| `isPubsubPayloadUpdate` | (same name) | `src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts:81` | 19 | `../../models/access_control_device_intercom_entry.model` |

Don't fix these 6 by name. The fix must be the general rule (follow the import to its real declaration, as W1 does) and must find exactly these 6 by itself. If it finds more or fewer, report that; don't adjust it to match.

## Facts about this environment you must not get wrong

- **DB:** container `facts-postgres-index-local` (port 5433), database `facts_index`, user `facts_index`. Live and shared. Use `</dev/null` with `docker exec ... psql -c`, or it can hang.
- **Round-2 baseline** (the file above, 2026-10-01 21:11 UTC): node-iot 1,432 facts, current run `20260923_110250-a6cba122`, 761 calls (277 resolved, 484 unresolved), slice `INTRA_REPO_CALL_DECLARED` node-iot 74.
- **Upstream:** node-iot tracks branch `staging`. On 2026-10-01 `staging` = `a6cba122`, the indexed commit and the clone at `output/clones/node-iot-api-oskey-io`. `00-scan-repo` re-clones, so run `git ls-remote git@github.com:oskey-io/node-iot-api-oskey-io.git refs/heads/staging` **before any re-extract**. If it moved, **stop and tell the user**.
- **The current run is from 2026-09-23.** Other changes may have landed in the node-iot pipeline code since then. Your gate must separate "changed because of my fix" from "changed because the pipeline code moved since 09-23". Do that by extracting once **before** your edit (held run A) and once after (held run B), and diffing both against live.
- **`fact_ref` = `sha1(fact_id)`, Postgres-generated.** Never change `stableFactId()` inputs; compare `fact_ref`s. Expected: 0 changed, 0 pruned.
- **Existing payload fields are frozen** (`declarationFile`, `declarationLine`, `resolutionStatus`, …). The fix is additive (`aliasedDeclaration*` under `evidence`), as in W1. Check whether `descriptionFor` in `sync-facts.ts` reads any field you add. The expected embedding count is 0; measure it.
- **CLAUDE.md rules that bind you:** always dynamic; bounded test first; before baseline; write findings as they happen; delete scratch scripts and scratch DBs afterwards (`DROP DATABASE` only on `facts_index_scratch_n_*`); **no LLM calls, no `gcloud`; any embedding spend is flagged with a count and waits for the user.**

## Procedure

**N1, investigate and propose (read-only).** Read W1 and node-iot's resolver. Propose the port: fields, how the import is followed, what happens with an external package (`lodash.isequal`), and any difference from Firebase. Post `### <date>: [Lane N] N1 PROPOSAL`, and **stop for approval**.

**N2, build, bounded test and gate.** Held run A (before the edit), then the edit, then held run B (files only). Show the 6 (or however many the rule finds) with their new fields, checked against source in `output/clones/node-iot-api-oskey-io`. Gate: `fact_id`/`fact_ref` identical / new / would-be-pruned (B against live, and B against A); description changes (= embedding count). W6 dry-run on a scratch copy (`pg_dump` live → `facts_index_scratch_n_e3`, sync run B there, `build-cross-repo-edges.ts --join=intra-repo-call-declared --dry-run --no-summary` with `PG_DATABASE=facts_index_scratch_n_e3`): node-iot's new count, and every other slice md5-equal to the baseline. Post `### <date>: [Lane N] READY TO SYNC`, then **stop**.

**Write turn (only after `WRITE TURN GRANTED: Lane N`).** Upstream check again. Dump (`output/backups/facts_index-<date>-before-laneN.dump`); `sync-facts.ts` for node-iot with `EMBED` unset; report counts (flag and wait if any embedding is pending); `build-edges.ts --dry-run` (0 dangling, no unexplained STALE); then `npm run pipeline:edges`; report per-slice counts and md5s against the baseline (only node-iot's `INTRA_REPO_CALL_DECLARED` should change). Post, request release, stop.

## Logging

Append-only to `## Build log` in `01-build-spec-2026-10-01.md` (`cat >> file <<'EOF'`), entries headed `### <date>: [Lane N] ...`. Never rewrite the file.

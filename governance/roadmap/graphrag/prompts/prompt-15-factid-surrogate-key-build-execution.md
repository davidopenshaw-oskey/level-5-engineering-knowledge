# Prompt 15 — Build execution: fact_id → surrogate key (ADR-010)

**Standing rule: never run `git add`/`git commit` in this session, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: real build. This session makes real, live changes — schema DDL against the running `facts-postgres-index-local` Postgres container, real code edits, a real skill-file rewrite, and (with explicit go-ahead, see §8 below) real LLM spend. This is not another investigation or plan — execute.

## Ground truth — read both, in full, before touching anything

1. `governance/adrs/adr-010.md` — the decision, including **§6's addendum** (three real scope calls: `generate-atomic-prd.ts` is already decommissioned/out of scope; the `mcp-server/db/` vs `pipeline/facts-postgres-index/_shared/` fork stays live, so **both copies** get every code change independently; `citation-validator.ts` is explicitly **not** touched in this build).
2. `governance/roadmap/graphrag/13-prompt-14-factid-surrogate-key-build-plan-2026-09-17.md` — the finalized build plan, **including the "Decisions" section near the end** (recorded after live review — do not follow the plan's own original §"Flagged for your own call" text where it's been superseded by a recorded decision below it; the decisions govern):
   - Decision 1: `citation-validator.ts`'s own citation mechanism is **not** touched in this build. Deferred to a future phase-02/engineering-reports initiative.
   - Decision 2: real spend for §8's re-test step is pre-approved — flag the actual dollar estimate before running it, per this project's standing rule, but no further special sign-off needed beyond that.
   - Decision 3: **rename, don't just re-point.** `factId`/`evidenceIds`/`sourceFactId`/`targetFactId` and equivalents across `mcp-server/` (both fork copies) get renamed to reflect the new opaque-reference semantics (e.g. `factRef`/`evidenceRefs`/`sourceFactRef`/`targetFactRef`) — this expands the real edit list in the plan's §6 to every call site touching these field names, not only the sites the plan enumerates under the old names.
   - Decision 4: surrogate key is a **SHA1 hex digest (40 chars, untruncated)**, confirmed — not a bigint or UUID. Reason on record in the plan: `cross_repo_edges` stores denormalized text copies of the endpoints, not real foreign keys, so only a pure content-hash can be computed independently and identically on both tables via a Postgres `GENERATED` column with zero pipeline/loader changes.

Also independently confirmed and worth knowing before you start: `capability-fanout-prd-agent.ts` calls the same shared `assembleDocument()` as `atomic-prd-agent.ts` (not its own separate renderer) — so the plan's §6 "new logic" item (the `factDisplayMap` lookup for the evidence appendix) needs building in exactly one place, not two.

## Step 0 — cheap insurance before any real schema change

Take a full `pg_dump` of the `facts-postgres-index-local` database to a local file before running any DDL. This is real, live data (68,902 `facts` rows, 17,195 `cross_repo_edges` rows) that the whole project depends on — a dump costs seconds and makes every step below trivially reversible if anything goes wrong. State the dump file's path when done.

## Execute, in the order given in the plan's §9 Sequencing, applying all 4 decisions above

1. Schema DDL (plan §1) — including the `CREATE EXTENSION IF NOT EXISTS pgcrypto` prerequisite (confirmed available but not yet installed on this instance). Run the plan's own sanity-check `SELECT`s after each `ALTER TABLE` and report their real output before proceeding to the next step — don't assume success, confirm it.
2. `mcp-server/` code changes (plan §6), **both fork copies**, with Decision 3's renaming applied throughout, and the two (c)-flagged sites resolved exactly as the plan specifies (the near-miss diagnostic replacement in `atomic-prd-agent.ts`; `citation-validator.ts` left untouched per Decision 1).
3. `skill.v3.md` rewrite (plan §7) — use the plan's proposed replacement wording as your starting point, adjusted if needed for consistency with Decision 3's renamed field names in your actual tool schemas.
4. Testing/verification (plan §8) — **stop and get explicit go-ahead for the real spend before running the 1a/2a re-tests**, even though it's pre-approved in principle (Decision 2); state the real estimated cost first, per this project's standing spend-flagging rule.

## Output

Write a real build report to `governance/roadmap/graphrag/14-prompt-15-factid-surrogate-key-build-execution-<date>.md` — what was actually run, real before/after verification query outputs, the real diff of what changed (file list, not full diffs), and the real 1a/2a test results compared against their recorded baselines (`mcp-server/gold/evals/1a-ownernonresident.eval.json`; `governance/roadmap/graphrag/10-case-2a-fanout-content-truncation-finding-2026-09-17.md`'s one-hit numbers). If the skill-file wording doesn't fully close the transcription-drift bug on the first pass, say so plainly and describe what you tried — this is expected to need iteration, not a sign of failure.

If you hit a real, unresolvable ambiguity not covered by ADR-010 or the plan, stop and flag it rather than guessing — same discipline as the prior sessions in this thread.

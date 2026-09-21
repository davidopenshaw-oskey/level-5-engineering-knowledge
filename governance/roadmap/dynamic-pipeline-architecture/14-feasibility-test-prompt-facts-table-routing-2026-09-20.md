# Feasibility test prompt: facts-table-derived (repo,module) routing — not yet run

Hand-off prompt for a new/continuing session, drafted 2026-09-20, following
[13-findings-hierarchical-routing-investigation-2026-09-20.md](13-findings-hierarchical-routing-investigation-2026-09-20.md).
Not yet dispatched/run as of writing this file. Persisted here per this project's own
discipline (write real findings/hand-offs to files as they happen, not just chat
scrollback) rather than left only in conversation.

---

Feasibility test (decide-stage, not production build): does a facts-table-derived,
(repo,module)-level routing signal (doc 13's Option 1,
governance/roadmap/dynamic-pipeline-architecture/13-findings-hierarchical-routing-
investigation-2026-09-20.md, section 6) actually improve the top-down candidate list for a
real, already-tested business request — tested directly against real numbers already on
record, not built into capability-fanout-prd-agent.ts. Small, temporary, throwaway script
only — no changes to search.ts, capability-fanout-prd-agent.ts, or the real schema. Delete
the script after recording real findings, per this project's diagnostic-script-cleanup
rule. Never git add/commit.

**Hard constraint, explicit per user request (regression risk) — Postgres is READ-ONLY for
this entire task.** Every real query against the live database must be a plain `SELECT`.
No `INSERT`/`UPDATE`/`DELETE`/`ALTER TABLE`/new tables/new columns, not even into a scratch
or temporary table, and not even for convenience. The (repo,module) group embeddings this
task computes are throwaway test artifacts — keep them in-memory in the script or written
to a local scratch file only (e.g. this session's own scratchpad directory), never into the
real `facts_index` database in any form. If persisting the group embeddings anywhere would
make the analysis meaningfully easier, stop and ask before doing it — don't decide
unilaterally that a "temporary" table is low-risk enough to skip asking.

## Real ground truth already established (don't re-derive)

- Business request: `mcp-server/gold/business-requests/1a-ownernonresident.txt` (and the
  richer `mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md`).
- Current flat, individual-fact-level routing (`routeCapabilities()` in
  `capability-fanout-prd-agent.ts`) confirmed, for 1a: iOS ("iOS App" module) ranks 8th of
  10 modules in the routing pool, bestDistance 0.7459 — never selected (top-5 cutoff).
  `unit_management` ranks 6th, bestDistance 0.7323 — a 0.0023 gap from `user` (5th, 0.7300,
  the current cutoff), essentially a statistical tie, also excluded.
- For 1b (explicitly naming iOS/Android Intercom as in-scope platforms in the prose), a
  live routing preview still converged on the identical top-5 (`building`, `features`,
  `organization`, `user`, `core`) — confirming explicit platform-naming in the request text
  does not move the flat routing signal.
- Postgres `facts` table is 100% embedded for all 9 repos today (confirmed directly, doc 13
  section 2) — `SELECT DISTINCT repo, module FROM facts` gives a free, real, current
  inventory to build group-level texts from.
- The real "OSKBuildingUnitInhabitantType" 4-way symbol collision already found this
  session (`ios-oskey-dev` x2, `angular-app-oskey-io`/`core`, `firebase-oskey-dev`/`building`)
  is a real, useful test case for whether a (repo,module)-level signal disambiguates this
  more usefully than the current single-fact distance race does.

## What to do

1. Run `SELECT DISTINCT repo, module FROM facts` — get the real, current count of
   (repo, module) pairs. Report this count BEFORE going further — it directly determines
   the real spend below.
2. Design and document (don't just assert) how each pair's representative text gets built
   — e.g. a concatenation of that group's distinct `symbol_name` values, or a sampled set
   of `description` values. State the real choice made and why.
3. **Flag explicitly before running**: one real embedding call per (repo,module) pair
   (state the exact total count from step 1), plus one more for the business request text
   if not reusing an existing routing-pass embedding. Wait for explicit approval before
   spending.
4. Rank all (repo,module) groups by distance to the business-request embedding. Report the
   real numbers, specifically:
   - Where does iOS ("iOS App") rank now, and at what distance, vs. its current 8th/0.7459?
   - Where does `unit_management` rank, and is the gap to whatever's now 5th/cutoff clearer
     or still a near-tie?
   - Does the group-level ranking give any cleaner signal about the 4-way
     `OSKBuildingUnitInhabitantType` collision than individual-fact distance did?
5. Give a real, honest verdict: does this signal meaningfully change which modules would
   get selected for 1a/1b, or does it produce a similar top-5 anyway? Either answer is a
   real, useful result — don't assume the hypothesis has to be confirmed.

Write findings to `governance/roadmap/dynamic-pipeline-architecture/15-...` (next available
number if others have landed since this prompt was written). This is a feasibility test,
not a decision to build the real thing — that stays a separate future step if this test is
positive.

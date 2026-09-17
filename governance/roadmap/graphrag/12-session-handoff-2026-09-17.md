# Session hand-off — capability-fanout build/test thread, 2026-09-17

Written at ~8% context remaining, mid-thread — not a natural close, a forced checkpoint. Real state below, precise, so the next session can pick up without re-deriving anything.

## Real event during this session

A commit (`a0208b2`, "mid-flight check-in commit during skill v3 debugging", author `davidopenshaw-oskey`, 2026-09-17 14:25:12+02:00) landed mid-session containing everything below — not made by this session (never ran `git add`/`git commit` here, per the project's own standing rule). Confirmed directly by the user, real-time, mid-session: it was the user themselves, not a peer Claude session. No standing-rule concern.

## Read in this order

1. **`08-prompt-9-capability-fanout-merge-design-2026-09-11.md`** — the real design (routing + module-scoped `search_facts` + unfiltered graph traversal + merge). Read this first, it's the architecture everything else below tests.
2. **`07-prompt-9-real-test-results-2026-09-13.md`** — first real test round (Q1a case). Contains a real, corrected mistake: an initial "fabrication" claim was wrong (user caught it), corrected in place with the wrong reasoning struck through, not deleted.
3. **`09-prompt-12-checkfabrication-whitespace-fix-2026-09-17.md`** — the whitespace-truncation bug found in #2, fixed in `validators.ts`, tested (6 hand-constructed cases + 2 live re-runs), real numbers.
4. **`10-case-2a-fanout-content-truncation-finding-2026-09-17.md`** — a second, different, real citation-integrity bug found on a fresh case (2a, resident departure date). NOT the same bug as #3 (content truncation, not whitespace) — traced precisely to a mid-conversation model transcription drift, root-caused, **not fixed, no fix attempted** (user said "write up, then standby"). Ends with real fact_id length stats (call_expression facts: 55% of corpus, only kind with embedded newlines, max 10,837 chars, both real incidents were only a few hundred chars — not extreme outliers).
5. **`11-fact-id-newline-reliability-finding-2026-09-17.md`** — a peer session's own synthesis of #4, written concurrently with this doc (real naming collision on "11" resolved by renumbering this doc to 12, not theirs). Sharper framing than this doc captures elsewhere: **length is not the real trigger, embedded newlines are** (both real incidents were a few hundred chars, nowhere near the 10,837-char tail); the already-shipped `stableFactId()`/`boundedIdComponent()` length-based fix does NOT cover either real incident (both under its ~2000-char threshold); frames the deeper issue as a natural-key-vs-surrogate-key tradeoff (`fact_id` serves two conflicting jobs — human-readable citation and model-retypeable tool argument); proposes a third fix option (give tools short references instead of requiring verbatim fact_id retyping, reusing the existing citation-numbering pattern) not written down elsewhere. Read this alongside #4, not instead of it.

## Real code state (all in the a0208b2 commit above, or later — check `git log` for anything after it)

- `mcp-server/agent-poc/capability-fanout-prd-agent.ts` — new script, the 3-step design built and real-tested.
- `mcp-server/agent-poc/atomic-prd-agent.ts` — minimal exports added for reuse (`ai`, `config`, `pool`, `assembleDocument`, `writeOutput`, `RunMeta`, etc.) + the `checkFabrication` signature-change update (`let generated`, reassigned).
- `mcp-server/agent-poc/validators.ts` — `checkFabrication` now returns `GenerationOutput` (canonicalizes whitespace-only citation mismatches to the real fact_id string), new `[AMBIGUOUS_CITATION]` error class, exported `normalizeFactId`. Real, live-corpus-checked: 109 collision groups exist under the strip-all-whitespace rule — ambiguity is checked per-run, never globally (would break almost any Kotlin-touching run otherwise).
- `mcp-server/db/search.ts` — `search()` gained an optional third `moduleFilter` param, backward-compatible.
- Test business requests now live at `mcp-server/gold/business-requests/1a-ownernonresident.txt` and `mcp-server/test-questions/2a-resident-departure-date.md` (the latter pre-existing, just newly run for the first time).

## Real open items, not resolved, in priority order as I'd rank them

1. **The case-2a content-truncation bug (doc #10) has no fix.** Root cause is understood precisely (traced to a specific mid-conversation model transcription drift, confirmed via `cross_repo_edges`, not guessed) but the fix itself is undecided — the doc's own "Status" section names the real candidate (anchor-existence validation in `get_graph_neighbors`/`walk_cluster` so a bad anchor fails loud instead of silently returning zero neighbors) but this needs a real design decision, same caution as the whitespace fix (don't loosen matching in a way that masks real fabrication).
2. **Capability completion-rate reliability is still a real, open, unresolved problem.** Across every live run so far (prompt 9's two rounds, prompt 12's re-run, case 2a): 2 of 5 capabilities fail the turn cap most runs, sometimes different modules each time. The bounded-search-effort instruction in `skill.v3.md` measurably helps completion on *some* runs (5/5 once) but not reliably (2/5 failed again on case 2a, and again on prompt 12's Round 2 baseline-only comparison — actually check doc 9 precisely, don't trust this summary over the real doc).
3. **Whether the Gap B citation fix (module-scoped search + unfiltered graph traversal closes the Angular UI-binding citation miss) generalizes beyond n=1** is still open — only confirmed on Q1a once (doc 07).

## Real spend this session (measured, cumulative)

$0.1983 + $0.2055 + $0.1080 (prompt 9, both rounds) + $0.2715 + $0.0722 (prompt 12 re-runs) + $0.0899 (case 2a one-hit) = **$0.8454 measured**, plus several honestly-unmeasured amounts from crashed runs (each crash happens before this codebase's own cost-computation step runs — a real, structural gap someone could fix by moving token-usage capture earlier, not attempted here).

## Standing rules that applied all session, still apply

Never `git add`/`git commit` unless the user asks in that turn (see the unexplained commit above — not this session's doing). Flag real LLM/cloud spend explicitly before running, every time. Keep this thread's own docs in `governance/roadmap/graphrag/`, numbered sequentially — check the folder for the real next number before adding one (a naming collision with a concurrent peer session already happened once this thread, see `07-...md`'s own note about `06-` being claimed by both sessions).

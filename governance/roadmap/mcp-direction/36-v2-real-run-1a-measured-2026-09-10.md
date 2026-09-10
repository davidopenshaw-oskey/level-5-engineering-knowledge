# V2 sketch — real measured run, case 1a — 2026-09-10

Real, live run (real Vertex AI spend, user-approved), not reasoning. `PERSONA_FILE=mcp-server/skills/prd/skill.v2.md`, `TEMPLATE_FILE=mcp-server/skills/prd/template.v2.md`, same business request text as `mcp-server/gold/evals/1a-ownernonresident.eval.json`. Output: `output/agent-runs/prds/test/2026-09-10-001-ownernonresident-1a-v2-sketch-test.{md,meta.json}`. Local `facts-postgres-index-local` Docker container had stopped and was restarted to run this — real, needed for anyone rerunning this later.

## Result against the eval checklist

| Checklist item (`evals/1a-ownernonresident.eval.json`) | Result |
|---|---|
| Every Technical Proposal claim cited | **Pass** — both mandatory validators (`checkFabrication`, `checkTemplateConformance`) passed; 8 cited claims, 0 fabrications, `327 real fact_id(s) seen this run` |
| Both backend and frontend type-alias sites found | **Pass** — both cited by name (claims #1, #2) |
| Downstream call sites individually named, not summarized | **Pass, and more specific than v1** — 4 distinct backend logic points named, plus a genuinely new one v1 didn't surface: explicit confirmation that `ownerNonResident` is naturally excluded from intercom entry records (a real, cited finding — `['tenant','resident'].includes(...)` in `building_unit_inhabitant.service.ts`) |
| No `[NEEDS CLARIFICATION]` marker warranted | **Pass** — none appears anywhere in the output, correctly, since this case has no real evidence gap |
| Stays within a low, single-digit-minute tool-call budget (v1: 16 tool calls, 17 turns) | **Fail, real regression signal** — v2 used 31 tool calls (26 `search_facts`, 4 `walk_cluster`, 1 `get_graph_neighbors`) and 32 turns, roughly double v1. Duration 2m32s vs. v1's 1m3s. |

## The one real regression signal, stated plainly

Tool-call and turn count nearly doubled versus v1's baseline on the identical query. Dollar cost stayed almost flat ($0.0886 vs. v1's $0.0873) only because most of the extra input was cache hits (121,538 of 132,658 input tokens cached) — cost is not a reliable proxy for the real overhead here; turns and wall-clock time are, and both roughly doubled (2m32s vs. 1m3s).

**Real, honest, not yet resolved**: this run cannot tell us *why* on its own. Two live hypotheses, not distinguished by a single run:
1. The new Technical Proposal grouping guidance ("group claims under a short bolded sub-label... don't invent more than a handful of such groups") led the model to search more broadly to populate multiple groups (4 groups appeared: Data Models & Types, UI Components ×3, Backend Permissions & Logic ×3) rather than stopping once a flat list of the same facts was assembled.
2. Plain run-to-run non-determinism — this project's own ADR-009 already flagged real output variance as a known confound (temperature > 0, same reason full evidence-driven comparison scripts were deliberately deferred). One run cannot separate "v2's wording caused this" from "this is just what a second independent run of the same query looks like."

**Not a case where the bounded-search-effort wording (workflow step 6) is implicated** — that step exists to stop chasing one specific unresolved sub-question, and this run had no unresolved sub-question (no marker fired). The overhead, whatever caused it, is a different mechanism than the one step 6 was written to bound.

## What did work, confirmed live not just reasoned

- The Technical Proposal grouping feature (`**Data Models & Types:**` etc.) rendered correctly in the final markdown — confirmed by reading the actual output file, not assumed from the schema.
- Zero fabrication on a real, fresh run — the citation-fabrication fix (`31-...md`) and the core "cite only real evidence" rules carried over from v1 unchanged and held.
- The new finding (intercom-exclusion confirmation) is a genuine, correctly-cited addition a developer would want in this PRD — not noise.

## Real next step, not yet done

A second live run of v1 (unchanged skill/template) against the identical 1a query, right now, would be the cheap way to tell whether ~30+ tool calls is just what this query does on a second independent roll, or whether v2 specifically drove it up — isolates the real variable (persona wording) from the known confound (non-determinism) with one more run, not more reasoning. Not run without asking, since it's more real spend (~$0.09) stacked on top of what's already been spent this session (~$0.18 total so far: 1a's original baseline was already paid for in a prior session; this session has spent this one $0.0886 run).

## Explicitly not done

- Case 2a not run live yet.
- Case 3 (intercom) still blocked by the Vertex quota ceiling (`30-...md`).
- No decision made yet on whether v2 replaces the live pair — this is one data point, not a verdict.

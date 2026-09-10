# Technical Proposal only, low-freedom retrieval experiment — real, striking result — 2026-09-10

Real, live test of the design discussed and drafted this session: a deliberately narrow skill (`mcp-server/skills/experiments/technical-proposal-only-low-freedom/{skill.md,template.md}`) scoped to only the Technical Proposal section, with a hard numeric search budget (8 tool calls, self-counted, stop at 6) plus a real, code-enforced `MAX_TURNS=10` backstop — run against the exact same intercom business request that spiralled to 47+ tool calls on 2026-09-09 and was still going at 26+ calls before being cancelled earlier today (`39-...md`). Temperature deliberately held at the existing default (`0.2`, no `MCP_VERTEX_TEMPERATURE` override) so this run isolates the scope/budget variable only, per the plan agreed before running.

**Real fix applied before running, worth flagging on its own**: both `skill.v2.md` and this new experimental skill originally carried human-facing framing text ("Draft for comparison against...", "Not a real second document-type pair...") directly after the title — caught by the user, confirmed by reading `atomic-prd-agent.ts` directly that the *entire* skill file is read verbatim into the real system prompt with no stripping (unlike `template.md`, which *is* parsed down to a clean contract before reaching the model). This means **every real v2 test run earlier today (1a, three 2a attempts, the cancelled intercom run) sent that meta-commentary as real prompt content** — wasted tokens and an irrelevant internal file reference, though not large enough to be the actual real number reported wrong in any of today's cost figures. Both files fixed (stripped to just title + Role, matching the live `skill.md`'s shape) before this run.

## Real result

| | This run (narrow scope, hard budget) | Prior intercom attempts (full scope) |
|---|---|---|
| Real tool calls | **6** (4 `search_facts`, 1 `walk_cluster`, 1 `get_graph_neighbors`) | 26+ (still climbing when cancelled, `39-...md`); 47+ on 2026-09-09 (`30-...md`) |
| Real turns | 7 of 10 | 32+ (uncapped, `MAX_TURNS=100`) |
| Duration | **38 seconds** | 16+ minutes (cancelled, still running); real 429 crashes on other attempts |
| Cost | $0.0477 | $0.0686-0.089 (the runs that completed) |
| Validators | Both passed, 0 fabrication, 90 real fact_ids seen | Passed on completed runs; this specific case never completed end-to-end before today |
| Cache hit ratio | 14,051 / 18,853 input tokens (74.5%) | Not directly comparable (different run shape) |

**No repeated sub-question pattern at all** — checked directly against the real debug log (preserved at `mcp-server/gold/debug-logs/2026-09-10-intercom-technical-proposal-only-experiment.jsonl`): all 6 real queries target genuinely different real angles (`intercom config` → `OSKCustomConfiguration` structure → its neighbors → `CustomInfo` → a directory-side check). None of the repetitive-rewording pattern seen in every prior full-scope attempt on this exact case.

## Real, and arguably better, honest-gap output

The run produced a working `[NEEDS CLARIFICATION]` marker — the exact mechanism the whole v2 redesign exists to get right on this case — but via a materially different, real path than expected. Rather than getting stuck trying to reverse-engineer the existing `homeButtons` field (the known real finding: a closed set of 3 hardcoded toggle strings, `17-...md`), this run found the closest *real, extensible* pattern already in the codebase (`OSKCustomConfiguration.homeInfos` → `CustomInfo`), proposed extending it (`homeButtons: List<OSKHomeButtonConfig>?`), and honestly flagged exactly what's unresolved:

> `[NEEDS CLARIFICATION: What is the exact identifier format (e.g., resident ID, unit number, or SIP URI) used to link the button to the recipient in the Call Directory, and what is the exact API or intent used to initiate the call when the button is pressed?]`

That's a specific, developer-actionable question — not a generic "unclear" tag — and arguably a *more* useful real answer than either the original v1 gold output (silently asserted the call-trigger as fact) or a hypothetical answer built around the known-closed `homeButtons` toggle set (which would have to explain away, not build on, the real evidence).

## Real, honest limits — don't over-generalize from one run

- **n=1.** This project's own real, repeated finding today (`38-...md`) is that identical setups can vary 2x+ run to run. One clean result doesn't prove the narrow-scope design is reliably this good — it proves it *can* be, which is itself a real, useful, positive signal, but needs more real runs to trust as a pattern.
- **Not an apples-to-apples comparison.** This run only ever had to produce one section; the full-scope runs produce four. Some of the cost/speed gap is inherent to doing less total output work, not purely the retrieval-scoping/budget change — though the *tool-call* comparison (6 vs. 26+, on the same hard sub-question) is the more meaningful, closer-to-apples number here, since Technical-Proposal-relevant evidence-gathering is what all those historical runs were burning most of their calls on.
- **Doesn't yet test the real caching-loss risk raised before this run** (splitting into *multiple* separate per-section calls, each starting a fresh conversation, potentially losing cross-call cache reuse). This run is just one isolated call — the multi-call collation question is still untested.

## Real, not-yet-decided next steps

- Run this same experiment again (real spend) to see if the clean, low-tool-call result holds on a second attempt, before trusting it as a real pattern rather than a lucky run.
- If it holds, the natural next real question is exactly the one flagged before running: does chaining several of these narrow, low-freedom calls (one per section) end up cheaper or more expensive in total than today's one-conversation approach, once real cross-call caching loss is measured rather than assumed.

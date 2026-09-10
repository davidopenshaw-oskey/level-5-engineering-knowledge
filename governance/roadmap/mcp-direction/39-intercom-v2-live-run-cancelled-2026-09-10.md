# Intercom case, live v2-sketch run with retry fix — cancelled mid-run, real findings — 2026-09-10

Real, live test of the retry-on-429 fix (`38-...md`) against the intercom case — the business request that originally caused the 47-tool-call spiral and repeated 429 crashes on 2026-09-09 (`30-...md`). Cancelled deliberately by the user after 16.1 minutes / 26 real tool calls, once enough real debug data had been collected — not a crash, not a timeout, a deliberate stop. Full real trace preserved at `mcp-server/gold/debug-logs/2026-09-10-intercom-v2-with-retry-cancelled.jsonl` (26 entries, real timestamps, full real inputs/outputs, not sampled) for further analysis of the actual search queries the model sent.

## Setup

`PERSONA_FILE=mcp-server/skills/prd/skill.v2.md`, `TEMPLATE_FILE=mcp-server/skills/prd/template.v2.md`, `DEBUG_TOOL_LOG` on, retry-on-429 fix (`38-...md`) in place. Process confirmed fully terminated after cancellation (`ps aux` shows no `atomic-prd-agent` process) — no further real spend after the stop.

## Real finding 1: strong circumstantial evidence the retry fix worked, three separate times

Three call-to-call gaps in the real timestamp trace: **191s** (call 16→17), **187s** (call 20→21), **187s** (call 24→25) — all far longer than normal per-turn latency (typically 2-15s throughout the rest of this same run), and far longer than this project's own backoff cap (max 15s cumulative across all 4 backoff steps before the 5th and final attempt). Three times, the process kept making new real, successful tool calls immediately after one of these gaps rather than crashing.

**This is consistent with the retry middleware using a real, Google-provided `retryAfterMs` value** (this project's own code prefers that real value over its own guessed backoff — see `38-...md`) rather than the fallback exponential schedule — a ~190-second cooldown is a plausible real value for Google's rate limiter to return, and its near-identical repetition across three separate occurrences fits one real, fixed server-side cooldown rather than three coincidentally similar random delays.

**Real, honest limit**: this is strong circumstantial evidence, not confirmed proof. The actual `[MODEL_RETRY]` console log lines that would prove it directly were not captured — the run was piped through `tail -300`, which buffers all output until the process's stdout closes, so nothing was visible until completion; the run was cancelled before that happened, and the background task's own captured-output file was empty for the same reason. **Real, correctable operational note for next time**: pipe a long-running foreground command through something that streams (e.g. `tee` to a file, or drop the `tail` entirely) rather than plain `tail -N`, so live console output stays visible mid-run without needing the process to finish first.

## Real finding 2: the bounded-search-effort rule (skill.v2.md, Workflow step 6) is not being reliably followed

Confirmed by listing all 26 real queries in order (see the preserved debug log). Calls 13-21 — 9 consecutive `search_facts` calls — are all rephrasings of one sub-question ("what type/properties does `homeButtons` have"): `OSKConfiguration fields`, `OSKConfiguration.kt properties`, `...properties list`, `OSKConfiguration properties`, `...file content`, `OSKCustomConfiguration homeButtons type`, `val homeButtons OSKCustomConfiguration`, `OSKConfigurationData properties`, `OSKCustomConfiguration homeButtons`. The rule (`skill.v2.md` Workflow step 6) says to stop after ~3-5 real attempts and mark `[NEEDS CLARIFICATION]` instead — this run took roughly double that before appearing to move on (calls 22-24: `Call Directory intercom call`, `Directory android-intercom-oskey-io`, `OSKIntercomScreens`), and then returned to the same sub-question again at calls 25-26 (`OSKCustomConfiguration.kt customConfig`, `data class OSKCustomConfiguration`).

**Real, direct confirmation of ADR-009's own still-open question**: "whether `[NEEDS CLARIFICATION]` becomes a soft persona instruction or a real code-enforced check" (`adr-009.md` §3). This run is real, fresh evidence that the soft-instruction-only version, as currently worded, does not reliably bound the model's own behavior — a real, concrete case for a code-level per-sub-question attempt counter, not just refined wording.

## Real, honest status of this case

Never reached completion — cancelled deliberately, not crashed. Whether it would have eventually produced the honest `[NEEDS CLARIFICATION]` marker this case is specifically meant to test (per `evals/3-intercom-home-button.eval.json`) remains genuinely unknown. The real value of this run was the two findings above, not a finished document.

## Real check, same day: false-positive/false-negative risk of the proposed "no new fact_ids" fix

Before building anything, checked the proposed fix (a per-run counter of consecutive `search_facts` calls returning zero fact_ids not already in `seenFactIds`, reset on any new fact_id or a `walk_cluster`/`get_graph_neighbors` call) against real data, not just the one intercom run — replayed all 4 real `DEBUG_TOOL_LOG` files collected today (`2a-rerun`, `2a-isolated`, `2a-with-retry`, and this intercom run) offline, zero spend.

**False-positive risk: low, per this real sample.** All 55 real `search_facts` calls across the three genuinely clean/successful runs (`2a-rerun`, `2a-isolated`, `2a-with-retry`) returned at least one genuinely new fact_id — not even a streak of 1. A threshold at 3-5 would not have misfired on any good run in this dataset. Small sample (n=4 runs), real not hypothetical, but a clean signal as far as it goes.

**False-negative risk: real, confirmed, on the very pattern this fix targets.** Replaying the intercom run call-by-call found the "0 new fact_ids" streak only starts at call 18 (streak reaches 4 by call 21) — but calls **13-17**, the ones already identified above as obviously repetitive by a human reading the query text (`OSKConfiguration fields` → `OSKConfiguration.kt properties` → `...properties list` → `OSKConfiguration properties` → `...file content`), each returned a handful of technically-new, low-ranked fact_ids (5, 3, 4, 2, 6 respectively) out of a 25-result page — enough to reset a naive "any new fact_id" counter every single time, even though the model was visibly circling the same question. The proposed fix, as sketched, would have missed 5 real wasted searches before ever triggering.

**Real conclusion**: the raw "any new fact_id, anywhere in the result page" signal is too lenient to reliably catch this — a real, better version likely needs either (a) counting only new fact_ids that land in the top few results specifically, not anywhere across a 25-item page, or (b) genuine query-text/topic similarity (the embedding-based approach set aside earlier as more complex) rather than a results-based proxy. Not yet decided which — this check was explicitly to stress-test the idea before building it, not to finalize a design.

## Real, not-yet-decided next steps

- Re-run this case to completion (real spend, not yet approved) if a full end-to-end result is wanted — ideally with the `tail`/streaming issue fixed first, so the actual `[MODEL_RETRY]` lines can be observed directly rather than inferred from timing gaps.
- Decide whether the bounded-search-effort rule needs real code-level enforcement (a per-sub-question attempt counter, similar in spirit to the `seenFactIds` dedup already built into `atomic-prd-agent.ts`) rather than relying on persona wording alone — this finding is a real, concrete data point in favor of that, not yet acted on.

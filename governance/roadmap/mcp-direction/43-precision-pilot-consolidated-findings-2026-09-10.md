# Precision pilot, consolidated — two real pairs, two different failure modes — 2026-09-10

Real synthesis of `41-...md` (pair 1: ownerNonResident) and `42-...md` (pair 2: resident departure) — the two real, live precision-comparison pairs run this session, same v2 skill+template throughout, precision the only deliberately varied input. Written to consolidate before deciding what, if anything, to build next.

## Side by side

| | Pair 1 — vague "1" vs. precise "1a" | Pair 2 — vague "2" vs. precise "2a" |
|---|---|---|
| Tool calls, vague vs. precise | 40 vs. 31 (**+29%**) | 16 vs. 21 (**-24%**) |
| Turns | 41 vs. 32 | 17 vs. 22 |
| Duration | 195.6s vs. 152.3s | 132.6s vs. 190.6s |
| Cost | $0.0977 vs. $0.0886 (**+10%**) | $0.1189 vs. $0.0686 (**+73%**) |
| `[NEEDS CLARIFICATION]` markers | 1, real and well-targeted | 0 |
| Fabrication | 0 both | 0 both |
| Real quality problem found | None found on review | **Confident, unflagged, likely-wrong claim** (invented a mechanism instead of finding the real one) |
| Retry-on-429 fired | No | Yes — 2nd real, independent confirmation |

## The core consolidated finding: vagueness does not have one predictable effect

The two pairs point in *opposite* directions on cost and tool-call count. Pair 1's vague run did visibly more work (more searches, more cost) and correctly used that extra work to catch a real gap with a marker — the "expected," reassuring pattern. Pair 2's vague run did visibly *less* work — fewer searches, less time — and used that saved effort to confidently invent a plausible-but-wrong mechanism instead of investigating further, with no marker at all. **A precision pilot built to answer "does vagueness cost more" doesn't have a single real answer** — it's case-dependent, and worse, the *cheaper* outcome (pair 2) was the *worse* one, not the safer one.

## The single most important real finding: nothing checks whether a claim's evidence actually supports the claim

This is the real, generalizable result worth prioritizing over running more precision pairs. Both mandatory validators (`checkFabrication`, `checkTemplateConformance`) verify that every cited `fact_id` is real — neither checks whether the cited evidence actually substantiates the specific claim it's attached to. Pair 2's run cited a real fact_id (`deleteResident`) for a claim about a *different*, unevidenced mechanism (a cron job) — passed cleanly. This is a distinct, third failure category from the two already addressed this session:

1. **Fabricated fact_ids** (invented or reformatted strings) — caught by `checkFabrication`, solved.
2. **Honest, flagged gaps** (the model knows it doesn't have evidence) — the `[NEEDS CLARIFICATION]` marker, working when the model recognizes its own gap (pair 1).
3. **Claim-evidence mismatch** (real fact_id, but it doesn't actually support what the claim asserts) — **nothing catches this today.** Structurally, the `[NEEDS CLARIFICATION]` marker can't catch it either, because it depends on the model recognizing it has a gap in the first place — pair 2's run never realized it was missing the real mechanism; it just didn't look, and papered over the absence with a plausible guess.

## Retry-on-429: now solidly confirmed, no longer an open question

Two real, independent 429s hit across these two runs, both recovered via a single retry (1s exponential backoff, no `retryAfterMs` from Google either time), both completed to full, clean success afterward. This part of today's work is done — not a finding that needs more testing.

## Real, honest methodological note: today's own metrics (cost, tool calls, turns) are effort metrics, not quality metrics

Every number in the table above measures how much work a run did — none of them would have caught pair 2's real problem on their own. That was only found by manually cross-referencing the vague run's actual queries against the precise baseline's actual citations — the same kind of manual, developer's-eye review that caught the `homeButtons` gap and the citation-fabrication bugs earlier this week. A cheap, clean, fast, zero-fabrication run (exactly what pair 2's vague version looked like by every automated number) can still be a materially worse PRD. Worth remembering before treating "it ran cheaply and validators passed" as a proxy for "it's good."

## Real, not-yet-decided next step

Given the consolidated picture, the claim-evidence-support gap (finding above) is a stronger, more generalizable candidate for real work than running a third precision pair — it's not specific to vague prompts (a precise prompt could just as easily produce a claim citing tangentially-real-but-insufficient evidence), and it's the one gap that could silently mislead a developer without any current signal at all. Options, not yet decided:
- Design and build a real check for claim-evidence support (likely needs its own real research into how to validate this — simple heuristics vs. a second LLM pass vs. requiring evidence to directly mention the claimed mechanism).
- Run a third precision pair first to see if the claim-evidence-mismatch pattern recurs, before investing in a fix for what might still be a one-off.
- Go back to the manual gold-case review discipline (`mcp-server/gold/`) specifically looking for this pattern across existing outputs, which costs no new real spend.

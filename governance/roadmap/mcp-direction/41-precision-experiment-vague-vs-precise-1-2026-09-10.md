# Prompt-precision pilot — vague "1" vs. precise "1a" — real result, plus a real retry-fix confirmation — 2026-09-10

Real, live pilot of the idea discussed this session: does a genuinely vaguer real prompt (not synthetic — `test-questions.md`'s own item "1", the informal early draft of "1a") measurably change retrieval cost/effort and the likelihood of an honest-gap marker, versus the precise, already-scoped "1a" version of the same real request? Same v2 skill+template (`mcp-server/skills/prd/skill.v2.md`/`template.v2.md`) as the existing 1a baseline (`2026-09-10-001-ownernonresident-1a-v2-sketch-test`), unchanged, so precision is the only real variable. Real debug log preserved at `mcp-server/gold/debug-logs/2026-09-10-ownernonresident-1-vague.jsonl`.

## Real, unplanned bonus: the retry-on-429 fix just got its first real, confirmed, end-to-end proof

This run hit a genuine live 429 mid-run (40 real tool calls in, before completion) — and, for the first time today, the actual console output was visible (not lost to the `tail`-buffering issue from `39-...md`):

```
[MODEL_RETRY] RESOURCE_EXHAUSTED (attempt 1/5) -- retrying in 1000ms (exponential backoff).
```

One retry, 1 second of exponential backoff (no `retryAfterMs` from Google this time, same as every other real 429 this project has hit), and the run continued to full, clean completion. This directly closes the real, honest gap flagged in `38-...md` ("built and unit-tested, never seen working against a real live failure") — now it has been.

## Real result: vague vs. precise, same underlying request

| | Vague ("1") | Precise ("1a") |
|---|---|---|
| Real tool calls | 40 | 31 |
| Real turns | 41 | 32 |
| Duration | 195.6s | 152.3s |
| Cost | $0.0977 | $0.0886 |
| Fabrication | 0 (383 real fact_ids seen) | 0 |
| `[NEEDS CLARIFICATION]` markers | **1** | 0 |

**~29% more tool calls, ~28% longer, ~10% more expensive** for the vaguer version of the identical real underlying request — and it's the vaguer one, not the precise one, that produced a real, appropriate honest-gap marker: *"Should an ownerNonResident be granted physical door access rights to the building/unit, or should their access be restricted/disabled by default?"* — a genuine ambiguity the vague prompt never addressed, which the precise "1a" version had already resolved by explicit scoping ("without breaking the existing flows around inhabitantType"). The marker is specific and correctly targeted, not a generic hedge.

**Also real and worth noting**: the vague run explored broader real territory appropriately (invitation-flow permission checks across three separate services, intercom display filtering, `isOwner`/`isResident` document modeling) rather than getting stuck in the narrow repetitive-rewording pattern seen in the intercom case — this vagueness produced genuine, useful breadth, not the wasteful circling `39-...md`/`40-...md` found on a different real case. Worth being honest that these are different failure/success modes, not proof vagueness is always handled this well.

## Real, honest limits

- **n=1.** Same caveat as every other real comparison this session — one run, one case pair, real non-determinism not yet separated from a genuine precision effect.
- **Not a controlled minimal-pair rewrite.** "1" and "1a" are two real, independently-authored drafts (the same real person's own thinking at two different points), not a single prompt with one deliberately varied precision knob — some of the real difference could be phrasing/framing beyond precision alone (e.g. "1" explicitly reframes the request around the ownerNonResident *taking over* tenant management, a real scope emphasis "1a" doesn't share).

## Real, not-yet-decided next steps

- A second real run of the same "1" vs "1a" pair, to see if the direction (vague costs more, vague surfaces more honest gaps) holds on a second attempt, before trusting it as a real pattern.
- Extend the same pilot to the "2" vs "2a" pair (resident-departure) once this one is corroborated.

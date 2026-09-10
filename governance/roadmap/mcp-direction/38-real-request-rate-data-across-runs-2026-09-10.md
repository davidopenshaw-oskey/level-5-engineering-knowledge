# Real request-rate data across all recorded runs — 2026-09-10

Real answer to "how many calls have we actually been making" — pulled from every real `meta.json` this repo has (`turnsUsed` is the real proxy for actual Vertex `generateContent` calls, per `atomic-prd-agent.ts`'s own comment: one turn = one real model round-trip; a turn can bundle more than one tool call, so tool-call count is an upper bound on the real request count, not exact) plus one real, second-by-second trace from today's `DEBUG_TOOL_LOG`. This is the dataset the "can we code around the 5/min ceiling" decision should be based on, not a guess.

## Every completed run with real turn/duration data

| generatedAt | run | turns | tools | duration | turns/min | Outcome |
|---|---|---|---|---|---|---|
| 2026-09-07 12:32 | resident-departure-2a-maxturns100-test | 30 | 29 | 119.7s | **15.0** | succeeded |
| 2026-09-07 16:12 | ownernonresident-1a-tool-desc-fix-test | 17 | 16 | 62.6s | **16.3** | succeeded |
| 2026-09-07 16:25 | resident-departure-2a-tool-desc-fix-regression-test | 30 | 29 | 116.5s | **15.5** | succeeded |
| 2026-09-07 17:07 | supplier-activity-tab-6-test | 18 | 17 | 225.8s | **4.8** | succeeded |
| 2026-09-08 14:21 | resident-departure-2a-post-move-regression-test-run3 | 32 | 31 | 178.5s | **10.8** | succeeded |
| 2026-09-09 13:33 | intercom-home-screen-config-button-dedup-fix (the real gold case) | 15 | 14 | 296.5s | **3.0** | succeeded |
| 2026-09-09 14:50 | resident-departure-2a-post-skills-relocation-verify | 29 | 28 | 139.1s | **12.5** | succeeded |
| 2026-09-10 05:23 | ownernonresident-1a-v2-sketch-test (this session) | 32 | 31 | 152.3s | **12.6** | succeeded |

(2026-09-06 runs predate `turnsUsed`/real `durationMs` tracking in `meta.json` — excluded, not fabricated.)

## Crashed runs, 2026-09-09 and 2026-09-10 — no `meta.json` (crash happens before it's written), qualitative + one precise trace

- **2026-09-09, intercom, 1st re-run**: 47 tool calls, killed by this session's own 5-minute Bash timeout, "genuinely still searching" (not itself a 429) — `30-...md`.
- **2026-09-09, intercom, 2nd re-run**: crashed on a real 429, 16 tool calls in — no duration recorded at the time (`30-...md`).
- **2026-09-10, case 2a, 1st attempt (this session)**: crashed on a fabricated `walk_cluster` anchor (`[Fail-Closed]`, now fixed), 15 tool calls in, no duration recorded (`37-...md`).
- **2026-09-10, case 2a, 2nd attempt (this session, `DEBUG_TOOL_LOG` on)**: crashed on a real 429. **Real, precise, second-by-second trace, not estimated**:

```
 1. t+  0.0s  search_facts        9. t+ 27.5s  walk_cluster
 2. t+  4.8s  search_facts       10. t+ 29.6s  search_facts
 3. t+ 10.8s  search_facts       11. t+ 31.9s  search_facts
 4. t+ 17.5s  walk_cluster       12. t+ 36.5s  search_facts
 5. t+ 19.7s  search_facts       13. t+ 39.3s  search_facts
 6. t+ 21.6s  search_facts       14. t+ 48.5s  search_facts
 7. t+ 23.4s  search_facts       15. t+ 50.5s  search_facts
 8. t+ 25.5s  search_facts       [429 immediately after]
```

15 real tool calls in 50.5 seconds — **17.8 tool-calls/min**, real 429 right after.

## The real, honest, non-obvious finding

Several **successful** runs sustained a higher tool-call rate than the run that just got 429'd — `2026-09-07-004` ran at 16.3 turns/min for its entire 62-second duration and completed cleanly; today's crashed 2a re-run hit 17.8 tool-calls/min for 50 seconds and died. Raw speed-of-this-one-run alone doesn't cleanly separate the successes from the failure. Two real factors line up better with the actual crash pattern than "this run's own pace" alone:

1. **Every crash so far has come on a second or third real attempt run in close succession** (today: 1a run → 2a attempt 1 (crashed on fabrication) → 2a attempt 2 (crashed on 429), all within roughly 15-20 minutes; 2026-09-09: three intercom attempts inside ~10 minutes). Every clean, successful run in the table above (bar the 2a-attempt-2 crash itself) was either the first real call of its session or had real idle time before it. This matches a token-bucket-style rate limiter with burst capacity: a fresh bucket absorbs a fast initial burst (explains the 15-16 turns/min successful runs), but a bucket already partly drained by a recent prior real run in the same rolling window has much less room before it 429s — consistent with a *shared*, *cumulative* project+model quota, not a per-run allowance.
2. This refines, rather than contradicts, `30-...md`'s original diagnosis (which already correctly found that spacing retries by ~10 minutes didn't reliably help on 2026-09-09) — a slow-refilling shared bucket can still be exhausted by one long, sustained single run (that finding stands), *and* separately be exhausted faster by several real runs stacked back-to-back with no recovery gap (this session's new data point). Both are true; neither alone was the whole picture.

**Real, honest limit of this analysis**: this is inferred from real, observed call patterns, not from GCP's own published rate-limiter internals (not found in the public quota docs checked so far) — a token-bucket-with-burst model fits the data better than a strict fixed-window model, but it's a fit, not a confirmed mechanism.

## Correction, same day: the "shared bucket drained by back-to-back runs" theory above doesn't actually hold up

Re-examined the two 2a attempts more carefully, at the user's prompting ("what would a recovery gap look like"). The theory above predicts attempt 2 (the 429 crash) should have failed sooner than attempt 1 (the fabrication crash) if it started from a bucket already drained by attempt 1 — both made 15 real tool calls before dying. It didn't fail sooner. That's not what a drained-bucket theory predicts, and this doc shouldn't have stated it with as much confidence as it did.

A second, bigger anomaly, missed on first pass: **several 2026-09-06/07/08 runs sustained 15-16 turns/min for over a full minute with zero 429s** — three times the confirmed 5/min limit, sustained, not merely bursted. If 5/min had been a hard, continuously-enforced ceiling the whole time, those runs should have failed too. They didn't. Every real 429 in this repo's history starts on **2026-09-09** and later — none before. That's a real, data-supported alternative explanation this doc didn't consider: **the quota itself may not have been this tight before 2026-09-09** (a real reduction, or this project moving into a stricter enforcement tier around that date), rather than run-to-run spacing being the deciding factor at all. `gcloud alpha services quota list` only reports the *current* effective limit — it has no history, so this can't be confirmed retroactively from that tool alone.

**Honest, corrected status**: neither theory (shared-bucket depletion from stacked runs, vs. a quota change around 2026-09-09) is confirmed by the data in this doc. A specific "recovery gap" duration proposed right now would be a guess dressed as a calculation — exactly what this project's own "query real limits before guessing" discipline exists to prevent. The real next step is a deliberate, isolated test (see below), not a proposed number.

## What this means for "can we code around it"

Two real, independent levers, not mutually exclusive:

1. **A real, low-effort process discipline, zero code**: don't stack live test runs back-to-back without a real recovery gap — today's two crashes both immediately followed another real run. This alone might have prevented both of today's crashes without touching any code.
2. **A real, code-level throttle**: self-pace real `generateContent` calls client-side (e.g., a minimum real gap enforced before each turn, or a token-bucket matching the known 5/min ceiling) so a single run degrades to "slower but completes" instead of crashing outright. This needs a genkit-level hook around the model call itself (not the tool-call layer this session already hardened in `37-...md` — that catches a different failure mode, a bad tool argument, not the rate limit) — not yet investigated whether genkit exposes one.

Not yet decided which, if either, to build — this doc is the real data the decision should rest on, not a recommendation on its own.

## Real, planned next step: an isolated test to actually distinguish the two theories

Real spend, user-approved: re-run case 2a (same business request as both of today's crashes) after a real, verified idle gap with zero other calls to this project/model in between — no other run stacked immediately before it, unlike both of today's attempts. Two possible real outcomes and what each would mean:

- **If it completes without a 429**: supports the stacking/shared-bucket theory — isolation, not a code fix, may be enough for individual runs done one at a time.
- **If it still 429s despite being isolated**: rules out stacking as the (sole) cause — points to the quota itself being tight enough that any single normally-paced multi-repo run (2a needs ~30 turns to complete, per its two successful pre-2026-09-09 baselines) can't reliably finish today regardless of spacing, meaning a real quota increase (or a code-level in-run throttle) is the only real fix, not a between-run gap.

**Real idle gap measured before running, not assumed**: last real Vertex call (attempt 2's final logged tool call, `DEBUG_TOOL_LOG` timestamp) was `2026-09-10T05:42:25.920Z`; current time at test start `2026-09-10T06:12:16Z` — **~29m50s of genuine idle time**, zero other calls to this project/model, produced naturally by the investigation and documentation work above. No artificial wait needed on top of that.

## Real result: isolated run still crashed — stacking is ruled out

Ran, `DEBUG_TOOL_LOG` on. Real, precise trace:

```
19 real tool calls in 66.1 seconds (17.2 tool-calls/min), then RESOURCE_EXHAUSTED (429)
```

**This decisively answers the question.** A run started after a genuine, verified ~30-minute idle gap with zero adjacent calls still hit the identical 429 wall, at a similar pace to both of today's back-to-back attempts (19 calls here vs. 15 and 15 in the two stacked attempts — comparable, not dramatically more headroom from being isolated). **The "recovery gap between runs" theory is ruled out.** A gap wouldn't have prevented either of today's earlier crashes, and won't prevent the next one either.

**Real, corrected conclusion**: the quota is simply too tight for this business request's real shape, full stop — not a spacing problem. Case 2a's two pre-2026-09-09 successful baselines needed 30 and 32 real turns to complete (119.7s and 178.5s respectively); today's isolated attempt died well short of that, in about a minute, regardless of how fresh the quota bucket was going in. The two real, viable fixes are unchanged from before this test, but now on firmer ground: (1) an actual quota increase (per the verified gap documented above — comparable models get 40-50x more), or (2) a code-level client-side throttle pacing real `generateContent` calls to roughly the confirmed sustainable rate (~1 every 12s, matching 5/min) — untested whether genkit exposes a hook to do this around the model's own calls (distinct from the tool-call layer already hardened in `37-...md`), and even if it works, a 30-turn run would take ~6 minutes of real wall-clock time to complete, not eliminate the underlying scarcity. Recovery-gap discipline (waiting between separate live test runs) has no real benefit and can be dropped as a mitigation.

## Real check, same day: does Genkit hide extra real API calls per "turn"?

Prompted by `governance/roadmap/market-research/22-findings-vertex-ai-generatecontent-rpm-quota-2026-09-10.md`, which found two independent real reports (a LangChain issue, Google's own Agent Development Kit) where a tool-calling wrapper was silently issuing more real API calls per logical turn than expected. Checked directly against this project's actual installed dependencies, not the reports' framework (different from ours) and not assumed to transfer:

- **`atomic-prd-agent.ts`'s own `ai.generate()` call passes no `use`/middleware option** — confirmed by reading the call site directly.
- **Genkit's own orchestration** (`@genkit-ai/ai/src/generate/action.ts`, `generateActionTurn`): exactly one call to `dispatchModel` per invocation, `currentTurn` incremented exactly once per call. No hidden multiplication at this layer.
- **The Vertex AI plugin's own HTTP client** (`@genkit-ai/google-genai/src/vertexai/client.ts`): no internal retry loop around the real `fetch` — it fires once and either returns or throws. Confirmed by reading the file; no `for`/`while` retry construct present.
- **Cloud Logging can't verify this retroactively for the runs already made**: checked directly (`gcloud logging read`, `gcloud logging logs list`) — `aiplatform.googleapis.com` isn't in this project's list of active log sources at all, and the `data_access` audit channel returns zero matches for it in the crash window. Data-access audit logging for Vertex AI predictions isn't enabled here. Real, confirmed negative, not a guess.

**Real conclusion**: no hidden extra calls, at any layer actually checked. This project's `turnsUsed` metric is a genuine 1:1 count of real `generateContent` calls — the LangChain/ADK finding doesn't transfer to this setup.

**Real, useful side-finding**: `GenkitError` carries a typed, optional `retryAfterMs` field (`@genkit-ai/core/src/error.ts`), populated from Google's own `Retry-After` response header when present (confirmed in `client.ts`'s handling). Not populated on the actual 429s this project has hit so far (checked the full printed error object from today's crashes — no `retryAfterMs` present), so a real backoff implementation needs its own fallback delay, but should prefer this real, authoritative value when Google does provide it.

## Real fix built: retry-with-backoff on the specific failing model call

Built in `mcp-server/agent-poc/atomic-prd-agent.ts` as a Genkit model-middleware (`retryOn429`), wired into `ai.generate()` via `use: [retryOn429]`. On a `RESOURCE_EXHAUSTED`/429 from the model, retries just that one failing call (not the whole conversation — the tool calls and evidence already gathered this run are preserved), using Google's real `retryAfterMs` when present, falling back to exponential backoff (1s/2s/4s/8s/16s, capped at 60s) otherwise, up to 5 attempts before rethrowing. This is Google's own documented recommendation for this exact error, per `governance/roadmap/market-research/22-...md`.

**Verified**: `npx tsc --noEmit` clean. Retry-decision logic verified via a cheap, bounded, non-live test (4 cases: backoff progression, real `retryAfterMs` preferred over backoff, non-429 errors pass through untouched, exhausts cleanly after exactly 5 attempts) — deleted after confirming, per this project's temporary-diagnostic-script discipline. **Not yet verified against a real live 429** — that requires an actual run that hits the wall (e.g. case 2a again), real spend, not run without asking first.

## Real live test, same day: case 2a completed successfully — but the retry path itself stayed unexercised

Re-ran case 2a live with the retry fix in place, `DEBUG_TOOL_LOG` on. **Result: completed cleanly** — 22 turns, 21 tool calls, 6.9 turns/min, 3m11s, `$0.0686`, both mandatory validators passed (430 real fact_ids, zero fabrication). Output: `output/agent-runs/prds/test/2026-09-10-002-resident-departure-2a-v2-sketch-test-with-retry.{md,meta.json}`. This is the **first successful full completion of case 2a since the crashes began** on 2026-09-09/10 — a real, good outcome for the v2 sketch itself (see `35-...md`/`36-...md`), separate from the quota question.

**Honest caveat, checked directly, not assumed**: no `[MODEL_RETRY]` line appears anywhere in this run's console output. The run simply never hit a 429 this time — consistent with this doc's own earlier finding that the quota enforcement isn't a deterministic wall every single run (6.9 turns/min here sits well within the range multiple pre-2026-09-09 runs completed at without issue). **The retry-on-429 fix itself remains unexercised against a real live 429** — its unit-level logic is verified (see above), but not yet its actual end-to-end behavior against Google's real API. A future run that does hit the wall would be the real confirmation; not deliberately forced this session (that would mean intentionally engineering a failure to spend into, a different real-spend decision from a normal test run).

**Update, same day, resolved**: a later real run (the prompt-precision pilot, `41-precision-experiment-vague-vs-precise-1-2026-09-10.md`) hit a genuine live 429 mid-run and the console showed `[MODEL_RETRY] RESOURCE_EXHAUSTED (attempt 1/5) -- retrying in 1000ms (exponential backoff).` — one retry, then the run continued to full, clean completion. End-to-end confirmed, not just unit-tested.

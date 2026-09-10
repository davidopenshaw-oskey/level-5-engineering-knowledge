# V2 sketch vs. live pair — reasoned comparison against the 3 gold cases — 2026-09-10

Real comparison, per `34-...md` step 4, of `mcp-server/skills/prd/skill.v2.md` + `template.v2.md` (drafted this session) against the live pair, reasoned directly against the three real `mcp-server/gold/` outputs and their new `mcp-server/gold/evals/*.eval.json` checklists (also written this session). **This is a reasoned comparison, not a measured one** — no live agent run was made against any of the three cases. Real spend flag: an actual re-run of v2 would cost real Vertex AI calls; not run without asking first (see "What would actually confirm this" below).

`template.v2.md` was verified to parse identically to `template.md` via the real `parseTemplate`/`renderTemplateContract` functions (same 4 `llmHeadings`, same kinds) — the added freedom-tier comments are inert documentation, not read by the model or the parser. This is a real, checked fact, not an assumption.

## Case 1a (ownernonresident) — regression check

`evals/1a-ownernonresident.eval.json`'s checklist is about *not* changing what already works. Reasoned against v2's actual wording:

- v2's `[NEEDS CLARIFICATION]` guidance is explicitly scoped to "genuine evidence gaps you searched for and didn't resolve" — this case has none (v1's 11 cited claims all trace to real fact_ids). Nothing in v2's wording gives the model a reason to insert a marker here.
- v2's Technical Proposal grouping guidance is explicitly conditional ("If a request spans several genuinely distinct areas... For a narrow, single-concern request, a flat list remains the right, simpler choice"). This request is single-concern (one new inhabitantType, traced through both repos) — v2's own wording should keep it flat, matching v1's real output.
- **Real residual risk, not resolved by reasoning alone**: whether the model actually follows "don't over-apply this" guidance under real generation is an empirical question, not something a reasoned read of the prompt can settle. This is exactly the gap evaluation-driven development (Anthropic's own methodology) exists to close — see below.

## Case 2a (resident-departure) — regression check, plus a real distinction v2 has to get right

`evals/2a-resident-departure.eval.json` specifically checks that v2 doesn't confuse "requester-stated out of scope" (the edge-device PRD) with "an evidence gap the agent failed to fill." Reasoned against v2's actual wording:

- v2's marker guidance has an explicit carve-out for exactly this: "Don't use it for something the business request itself explicitly states is out of scope — an out-of-scope boundary is a real, deliberate instruction from the requester, not a gap in your evidence." This was written directly in response to this eval case, not a generic hedge — it's the one place v1 (which has no marker concept at all) had no way to get this distinction wrong, and v2 introduces a new way it *could* get it wrong if the wording weren't explicit. Confirmed the wording covers it as drafted.
- The multi-repo trace itself (3 repos, 31 tool calls) isn't touched by anything in v2 — no wording changed in the tools, workflow steps 1-5, or fabrication rules.

## Case 3 (intercom home button) — the real target case

`evals/3-intercom-home-button.eval.json` is the case v2 is actually meant to fix. Reasoned against the real, confirmed gap (`governance/roadmap/android-intercom-oskey-io/17-...md`: `homeButtons` is a closed 3-value toggle set, not an open button-to-recipient mapping) and v1's real, uncited Acceptance Criteria bullet ("Pressing a custom home button triggers a call to the recipient linked in the call directory"):

- v2's Acceptance Criteria guidance directly targets this shape of failure: EARS wording for the confirmed condition, with `[NEEDS CLARIFICATION: ...]` substituted for the unconfirmed SHALL clause specifically — not the whole criterion. A plausible v2 output: `WHEN a custom home button is pressed, [NEEDS CLARIFICATION: the corpus shows homeButtons as a closed set of 3 hardcoded toggle keys (contact/pincode/face_recognition), not an open button-to-call-directory-recipient mapping — confirm whether an extensible mapping needs to be built]`. This is a real, specific, actionable flag — not a generic "TBD."
- v2's bounded-search step (3-5 attempts per sub-question) matters here specifically because this is the request that, on a *different*, later re-run, spiraled to 47+ tool calls and a real 429 crash chasing this exact mechanism. The eval file is explicit that v2 should be judged against the clean baseline run's budget (14 tool calls), not the spiral — the two are different problems (an evidence gap vs. the separate Vertex quota ceiling) and conflating them would misattribute a quota fix to a persona fix.
- The two already-correctly-cited `homeButtons` properties (claims #2/#3 in the gold doc) need no change — v2 doesn't ask the model to re-derive anything already found correctly, only to add the honest gap marker where a claim currently overreaches the evidence.

## Real, honest limits of this comparison

This reasoning establishes **plausibility**, not proof. Per Anthropic's own evaluation-driven-development methodology (fetched and read directly, `platform.claude.com/.../best-practices`), a real measurement means actually running the skill and diffing against the `expected_behavior` checklist — not reasoning about what the wording should produce. Two different real constraints apply to the three cases here:

- **Cases 1a and 2a are not blocked by the Vertex quota ceiling** (`30-intercom-quota-blocker-pause-2026-09-09.md`) — only the intercom case's chatty, spiraling re-runs hit that wall. A real, live re-run of v2 against 1a and 2a is available right now, not blocked, and would turn the regression checks above from reasoned into measured.
- **Case 3 (intercom) stays blocked** until the quota question is separately resolved — running v2 against it now risks the same 429 crash, for the same reason as before, unrelated to whether v2's wording is right.

**Real spend, flagged explicitly, not yet actioned**: re-running v2 live against 1a and/or 2a costs real Vertex AI calls (v1's own baseline runs cost $0.09 and $0.12 respectively per their `meta.json` — small, but real). Not run in this session without asking first.

## Recommendation

Partial validation only, pending a real run: the reasoning above finds no case where v2's added wording should regress 1a or 2a, and a specific, plausible improvement for case 3. **Not yet a "replace the live pair" decision** — that should wait for at least the two unblocked live runs (1a, 2a) to confirm no regression really happens, before deciding whether to also spend the effort resolving the quota blocker to validate case 3 live.

## Explicitly not done this session

- No live agent run against any case (real spend, not authorized without asking).
- No change to the live `mcp-server/skills/prd/{skill.md,template.md}` pair.
- Quota blocker (`30-...md`) not touched.

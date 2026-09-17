# Case 2a real test — a new, different citation-integrity finding (not the whitespace bug)

Real, live run, user-requested: `mcp-server/test-questions/2a-resident-departure-date.md`, `skill.v3.md`/`template.v2.md`, both `atomic-prd-agent.ts` (one-hit) and `capability-fanout-prd-agent.ts` (fan-out), once each. Real spend: $0.0899 (one-hit, complete) + an honestly-unmeasured amount (fan-out, crashed before cost computation, same pattern as prior crashes this thread).

## One-hit baseline — clean, real numbers

`output/agent-runs/prds/test/2026-09-17-003-2a-resident-departure-date-onehit-v3.{md,meta.json}`. **25 tool calls, 26 turns, 2m7s, $0.0899, both validators passed, 401 real fact_ids.** No `[NEEDS CLARIFICATION]`. First real run of this business-request case ("2a") — previously named as not-yet-run-live in `mcp-direction/36-...md`.

## Capability-fanout — real, honest failure, a genuinely different mechanism than prompt 12's bug

Routing pool: `organization` (34 facts), `core` (28), `features` (28), `building` (14), `user` (4) — all 5 became candidates.

**2 of 5 capabilities failed the turn cap** — `organization` and `user` this time (a different pair than prompt 9's `features`/`building`; consistent with this being a real, request-dependent reliability problem, not tied to one specific module). `core`, `features`, `building` completed (16, 11, 19 tool calls respectively). Still open, unchanged from prior findings — not investigated further here.

**The merged output was rejected by `checkFabrication`.** Checked directly against Postgres before reporting this as real, per this thread's own now-established discipline (got a "fabrication" claim wrong once already this session) — **both cited methods are real**: `OSKAccessMessagePublisherService.publishMessageToAllACDs`, called from `deleteAppUserResident` and `_deleteNonAppUserResident` in `organization_resident.service.ts`, both confirmed to exist in `facts` with their full real content. **Not the prompt-12 whitespace bug** — the fix from that prompt (strip-all-whitespace canonicalization) does not apply here, because the cited strings aren't a whitespace-reformatted version of the real ones. They're missing an entire real content segment: the full multi-line argument list (`userId,accessBuildingId,{operation:...,accessId:...,creationDate:...},access.authorizedDoors,{category:'oskUser'}`, etc.) that the real fact_id actually contains. Stripping whitespace from both sides doesn't make them equal, because real, non-whitespace *content* is absent, not just reformatted.

## Root cause traced precisely — the corruption happens mid-conversation, not just at final citation

Checking which capability actually produced this (initially assumed `building`, from a guess based on topic — checked the real tool-call trace instead of trusting that guess, and it was wrong): it was **`core`**, not `building`. `core`'s own real tool-call trace shows the model calling `get_graph_neighbors` **with the already-truncated fact_id as the input argument**, two calls before its final output:

```
get_graph_neighbors({"factIds":[
  "call_expression|organization|.../organization_resident.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|deleteAppUserResident|#1",
  "call_expression|organization|.../organization_resident.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteNonAppUserResident|#1"
]})
```

Both strings are already missing the args segment **before the model ever wrote a citation** — this is a tool-call argument, not the final `evidenceIds` field. The model's own working copy of these fact_ids had already drifted from the real strings mid-conversation, several turns after it last saw the correct, complete version (a similar-shaped real fact_id, `deleteAccessById` on the `core` module's own `access.service.ts`, *was* cited correctly with its full multi-line args intact one call earlier in the same trace — so this isn't a blanket inability to handle long multi-line fact_ids, just this specific instance drifting).

**A real, structural gap this surfaces**: `get_graph_neighbors`/`walk_cluster` (`mcp-server/db/graph-traversal.ts`) don't validate that an anchor `factId` passed in actually resolves to anything real before querying `cross_repo_edges`. A truncated/wrong anchor just silently returns zero neighbors — not an error, no `[Fail-Closed]`-style feedback the way an invalid `walk_cluster`/`get_graph_neighbors` argument sometimes does elsewhere in this codebase (`withToolErrorTrapping`'s own docstring describes exactly this class of check for *other* argument-validation cases). The model never learned, in-conversation, that the identifier it was working with had already gone stale — it just got an empty neighbor list and moved on, then later cited the same already-wrong string as if it were still correct.

## Who/where the truncation actually happened — checked directly, not inferred

Confirmed against `cross_repo_edges` directly: `service_method|core|.../access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageToAllACDs|#1` has **7 real, `confirmed`-status edges**, including both of the two facts that ended up truncated, each with their full real args stored correctly.

The real sequence, traced through `core`'s own tool-call log: the model called `get_graph_neighbors` on that exact `service_method` anchor one call before the truncated one. `expandWithGraphNeighbors` (`mcp-server/db/graph-traversal.ts`) runs a plain, unmodified `SELECT fact_id, ... FROM facts WHERE fact_id = ANY(...)` — no string manipulation anywhere in that codepath — so this call **must** have returned all 7 real neighbors with their full, untouched fact_id strings into the model's own conversation context. The model then, needing two of those seven as the anchor set for its *next* `get_graph_neighbors` call, retyped them from its own context and dropped the argument-list segment on both — a mid-conversation transcription drift in the model's own generation, not a bug in the SQL layer, the tool wrapper, or Genkit's plumbing (the console-logged "truncated" string is literally what the model generated as its own function-call arguments; nothing downstream of the model touches or reformats it).

A compounding, structural gap: `get_graph_neighbors` doesn't validate that an anchor resolves to anything real before querying `cross_repo_edges` — a wrong/truncated anchor just silently returns zero neighbors, not an error. The model never got a correction signal that its own working copy had already gone stale; it queried a nonexistent identifier, got nothing back, and moved on, then later cited the same already-wrong string as if it were still correct.

Honest limit: `DEBUG_TOOL_LOG` wasn't enabled for this run, so there's no literal byte-for-byte tool-result payload to show side-by-side. This doesn't weaken the conclusion, though — the SQL's unmodified-passthrough behavior guarantees what was *sent* to the model, and the tool-call log shows what the model *generated* next; the only place the string could have shortened is in the model's own token generation between those two points.

## Why this is a genuinely different problem from prompt 12's fix, not a variant of it

- **Prompt 12's bug**: real content, reformatted (whitespace collapsed/removed) — a presentation-layer difference, safely and precisely fixable by normalizing both sides before comparing.
- **This finding**: real content, *truncated* (a whole argument-list segment dropped) — not a formatting difference, a content difference. Extending the whitespace-normalization fix to also tolerate this would mean matching on a prefix or partial string, which is a materially different, riskier kind of leniency — exactly the class of "loosen the check until it starts accepting things that differ by more than formatting" risk prompt 12's own brief was explicit about avoiding. Not attempted here.

## One-hit baseline, same real method, for contrast

The one-hit run cited this same real method (`OSKAccessMessagePublisherService.publishMessageToAllACDs`) multiple times, correctly, **with the full multi-line argument list preserved verbatim** (evidence #10, #138, #140, #148, #151 in the one-hit output) — so the underlying model is capable of copying this exact shape of long fact_id correctly; this wasn't a systematic inability, a localized drift in one specific capability call.

## Real fact_id length stats — checked live, to understand how common the risky shape is

Whole corpus (68,902 facts): length min 63, avg 187, median 161, p90 288, p99 496, **max 10,837** chars.

**The length/newline risk is almost entirely confined to one kind.** `call_expression` (37,859 facts, ~55% of the corpus) is the *only* kind with any embedded newlines at all — 8,865 of them (23% of all `call_expression` facts) — and it holds the entire long tail (max 10,837; every other kind caps under ~520 chars with zero embedded newlines, structurally safe from this class of problem).

Within `call_expression`: >300 chars: 5,654; >500: 671; >1,000: 164; >2,000: 47; >5,000: 3. The single longest real fact_id (10,837 chars) is a `call_expression` in `swift-ui-kit-oskey-dev`, `InvitationCard.swift` — an entire nested SwiftUI `VStack(...)` view body captured as one fact (same root shape — deeply nested declarative-UI call chains — as the previously-fixed Swift `stableFactId()` btree-index-limit bug, different symptom here).

**The telling part**: both real incidents this session (`createIntercomDisplayName`, `publishMessageToAllACDs`) were nowhere near these extremes — a few hundred characters, well inside the "normal" range, not the tail. The model doesn't need a 10K-character outlier to start dropping content; a few hundred characters with embedded newlines was already enough, twice, in real live runs today.

## Status

Written up as instructed; no fix attempted or proposed here. Real, open questions for whoever picks this up: whether to add anchor-existence validation to `get_graph_neighbors`/`walk_cluster` (would give the model real-time, in-conversation feedback the moment its own working copy of a fact_id goes stale, closer to how `checkFabrication` already treats a bad citation, but earlier and cheaper to recover from); whether this is common enough across more real cases to be worth fixing now versus benching as a known, rare edge case; and whether it's specific to capability-fanout's smaller, more context-constrained per-call conversations or can happen in the one-hit shape too (this run's own one-hit case didn't hit it, but n=1 doesn't rule it out).

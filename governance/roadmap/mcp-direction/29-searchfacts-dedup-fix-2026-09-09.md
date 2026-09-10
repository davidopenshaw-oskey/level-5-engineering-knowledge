# `search_facts` retry-waste fix, applied and measured — 2026-09-09

Real fix for the retry-waste pattern found in `28-...md`'s follow-on discussion: the model re-searching a concept it already had a confident hit for, 6+ times, with cosmetic phrasing changes, on the `android-intercom-oskey-io` intercom home-button business request.

## Real design decision: fix lives in the tool, not the persona

Deliberately placed in `mcp-server/agent-poc/atomic-prd-agent.ts`'s `search_facts` tool definition, not `atomic-prd-agent-skills.md` — the real concern raised in discussion: a persona-only fix requires every future skills document to independently remember to say it, or the bug silently reappears. A tool-level fix is inherited automatically by any persona/skills document layered on top, since tool descriptions are always sent regardless of which persona is active.

Also deliberately **not** server-side/MCP-session state, after checking two real things first (not assumed): (1) Cloud Run's session affinity is explicitly "best effort" per Google's own docs, not a guarantee; (2) the MCP spec's own 2026-07-28 release candidate removes session IDs entirely, moving toward fully stateless, independently-routable requests. Building on session affinity would have meant building against both GCP's own guidance and the protocol's own direction. Instead: a plain in-process `Set<string>` (`seenFactIds`), scoped to this script's one-process-per-conversation lifetime — needs no session affinity, no external store, works identically regardless of eventual deployment topology, because it never depends on which request lands on which instance.

## What changed

`search_facts`'s handler now tags every returned result with `alreadyRetrieved: boolean` (true if that exact `fact_id` was already returned earlier in this same conversation), and the tool's own `description` explicitly instructs: if `alreadyRetrieved: true`, don't search again for the same concept — use `walk_cluster`/`get_graph_neighbors` on it instead.

## Real result, measured directly against the exact same failing case

Re-ran the identical intercom home-button business request that previously failed with a real `429 RESOURCE_EXHAUSTED` after 31+ tool calls (`27-...md`'s follow-on). This time:

| | Before (failed run) | After (dedup fix) |
|---|---|---|
| `search_facts` calls | 24 (before crash) | **10** |
| Total tool calls | 31+ (before crash) | **14** |
| Turns used | ~25-30 (before crash) | **15** / 100 |
| Outcome | 429, crashed, no output | **Both validators passed, output written** |

Direct evidence the flag worked as intended: by search #9-10, the top result came back `alreadyRetrieved: true`, and the model visibly stopped re-searching the same concept and moved toward synthesis — the run converged cleanly instead of repeating `homeButtons` variants a sixth, seventh, eighth time.

## Real, unexpected cost tradeoff — not glossed over

Despite roughly halving turns and tool calls, **real cost went up, not down**: $0.5921 for this run vs. the ~$0.08-00.12 typical for a comparable successful run earlier this week (e.g. `25-...md`'s resident-departure-2a run). Token breakdown shows why: `thoughtsTokens: 62,912` this run, versus `3,964` on the comparable resident-departure run — roughly 16x more "thinking" tokens per turn. Plausible, unconfirmed explanation: reasoning about whether `alreadyRetrieved` should change the next action is itself a real, non-trivial reasoning step the model now does every search call, and that deliberation cost more than the redundant tool round-trips it replaced.

**Real, honest conclusion**: the fix demonstrably solves the stated problem (retry-waste, rate-limit risk, wasted turns) — confirmed, not assumed. Whether it's a net cost win is not yet confirmed — one data point, and the one data point available shows total dollar cost increasing on this specific run. Worth watching across more runs (a real case for the "gold set" regression idea raised in the same conversation, not yet built) before treating this as a strictly positive tradeoff.

## Real, still-open duplication risk

`mcp-server/src/index.ts` defines its own, separate copy of `search_facts` — this fix only applies to the direct-function-call path (`atomic-prd-agent.ts`), not the real MCP protocol path used by VS Code/Antigravity, unless mirrored there too. Not yet done.

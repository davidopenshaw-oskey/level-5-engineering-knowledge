# Real run crash on case 2a — a tool-call error isn't surfaced to the model, it kills the whole run — 2026-09-10

Real, live v2 test run against case 2a (resident-departure) crashed 15 tool calls in, before producing any output. Root cause checked directly against Postgres, not assumed — and it's a real, structural gap independent of the v1-vs-v2 comparison this session has otherwise been doing.

## What happened

```
[tool call] walk_cluster({"anchorFactId":"source_class|access_control_device/accesses|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController","maxDepth":2,"maxFacts":20})
Error: [Fail-Closed] Graph edge(s) reference fact_id(s) not found in facts: source_class|access_control_device/accesses|... -- edges may be stale relative to the current facts index.
```

The process crashed (`main().catch` → `process.exit(1)`), no markdown or meta.json written, run duration and real token/dollar cost for the partial run were never computed (the pricing/logging code runs after `ai.generate()` resolves, which it never did).

## Confirmed directly against live Postgres — this is a fabricated anchor, not stale data

```sql
SELECT count(*) FROM facts WHERE fact_id = 'source_class|access_control_device/accesses|...|OSKAccessControlDeviceAccessController';
-- 0
```

The error message says "may be stale," but there's a real, more specific answer: `walkBoundedCluster` (`mcp-server/db/graph-traversal.ts:166`) seeds `depthByFactId` with the anchor itself at depth 0, then validates every fact_id it touched — including the anchor — against the real `facts` table at the end. The anchor the model passed was never a real fact_id at all; nothing in `cross_repo_edges` references it either (checked directly, 0 rows). This is the same general class of bug `31-tool-argument-citation-fix-2026-09-09.md` fixed — the model constructing a plausible-looking `factId` for a tool-call argument rather than copying one verbatim from a real tool result — just a new, unfixed instance of it. `skill.v2.md` carries the exact same "Cite only real evidence" wording as the live `skill.md` (unchanged from v1), so this is not something the v2 sketch introduced or could have prevented by itself — it's a pre-existing risk in both.

## The real, separate, more important finding: this single bad argument crashed the whole run

`atomic-prd-agent.ts`'s `walkCluster` tool handler does not catch the fail-closed error — it propagates straight out of the tool function, through genkit's `executeTool`/`resolveToolRequest`, and rejects the entire `ai.generate()` call. Practically: **14 real, successful tool calls' worth of gathered evidence, and whatever real Vertex spend they cost, were thrown away** the moment one fabricated argument surfaced, rather than the error being reported back to the model as a failed tool result it could see and recover from (try a different anchor, search again, or drop the claim). The persona's own "Cite only real evidence" rule is the only thing currently standing between a fabricated argument and a full run crash — a wording-only safeguard carrying a job a code-level guard should be doing.

This is a real robustness gap in the shared tool layer (`atomic-prd-agent.ts`, likely also the MCP server's own tool wiring — not checked yet), not specific to the v2 sketch, case 2a, or this session's testing. It just happened to be a v2 test run against case 2a that surfaced it live.

## Real, honest cost accounting

Unmeasured. The crash happened before the pricing lookup and token-usage logging ran, so there's no real number for what this partial run cost — 14 tool calls' worth of real Vertex AI turns were made and billed, but the exact figure isn't recoverable from this run's own output (nothing was written). Real, not nothing — just not quantified.

## Real, concrete options, not yet decided

1. **Retry case 2a as-is.** Non-deterministic — a second attempt may not take the same path or fabricate the same anchor. Real added spend, same crash risk.
2. **Harden the tool handler first**: catch the fail-closed error inside `walkCluster` (and the other two tools) and return it to the model as a failed tool result with a clear message (e.g. "anchorFactId not found — you may have reformatted or invented this id; search again or use a real factId from a prior result") rather than letting it crash the run. This is a real code change, not a persona-wording change — separate from the v2 skill/template sketch this session has been comparing, and arguably higher priority than finishing the 1a/2a/intercom comparison, since it affects every run regardless of which skill version is active.
3. **Hold here and decide with the user** rather than either spending more or starting an unplanned code change unprompted.

Not actioned yet — reporting back before proceeding, given the real spend and scope-of-fix implications.

## Update, same session: option 2 chosen and built

User chose option 2 (harden the tool handlers) and asked directly whether the thrown error currently reaches the model — checked against genkit's own source (`node_modules/@genkit-ai/ai/src/generate/resolve-tool-requests.ts`, `resolveToolRequest`): it catches only its own `ToolInterruptError`; any other thrown error, including this codebase's `[Fail-Closed]`-prefixed errors, is re-thrown and propagates up through `resolveToolRequests`'s `Promise.all`, rejecting the whole `ai.generate()` call. Confirmed, not assumed: the model never saw this error before the fix.

**Real fix applied** to `mcp-server/agent-poc/atomic-prd-agent.ts`: a new `withToolErrorTrapping` helper wraps the underlying call inside `get_graph_neighbors` and `walk_cluster` (the two tools that call into `graph-traversal.ts`'s `[Fail-Closed]`-throwing validators). It catches only errors whose message starts with `"[Fail-Closed]"` and returns `{ error: message }` as the tool's normal result instead of throwing — any other error (DB down, network failure) still propagates and crashes the run, unchanged, preserving this project's existing "fail loud on the unexpected" discipline for real infrastructure problems. `search_facts` was left unwrapped — `db/search.ts` has no `[Fail-Closed]` throw sites, so wrapping it would guard against nothing real.

**Verified directly against Postgres**, not just read as correct: replayed the exact fabricated anchor from this doc's crash (`source_class|access_control_device/accesses|...|OSKAccessControlDeviceAccessController`) through the same trapping logic. Confirmed it now resolves to `{"error": "[Fail-Closed] Graph edge(s) reference fact_id(s) not found in facts: ..."}` instead of throwing — exactly the object that would now reach the model as the tool's output. Verification script deleted after confirming, per this project's temporary-diagnostic-script discipline. `npx tsc --noEmit` confirms no new type errors from the change (one pre-existing, unrelated error remains in a Swift pipeline file).

**Real, honest scope of what this fixes**: this is a shared-code fix, not a v1-vs-v2 persona change — it applies identically regardless of which skill/template pair is active, and protects any future run (this session's or otherwise) from losing all prior tool-call work to one fabricated argument. It does not reduce how often the model fabricates an argument in the first place (that's still `skill.md`/`skill.v2.md`'s "cite only real evidence" wording's job) — it only makes that failure mode recoverable instead of fatal. Whether the model, now actually seeing `{"error": "..."}` in context, adjusts its next tool call sensibly is still an open, real, unmeasured question — the next live run against case 2a is what would answer it.

## Update, same session: re-ran 2a with `DEBUG_TOOL_LOG` on — different, already-known wall hit instead

Re-ran the identical v2-sketch case 2a test, `DEBUG_TOOL_LOG` enabled this time. Real result, checked directly from the debug log (15 entries, one per real tool call): **no fabrication occurred this run at all** — all 15 tool calls (13 `search_facts`, 2 `walk_cluster`) succeeded cleanly with real anchors, so the error-trapping fix built above was never exercised (correctly not needed, not proof it works under real fabrication — that's still confirmed only by the earlier direct-replay test, not by this live run).

Instead, the run died from `RESOURCE_EXHAUSTED: [429 Too Many Requests] ... gemini-3.5-flash` — the same, already-documented Vertex AI quota ceiling from `30-intercom-quota-blocker-pause-2026-09-09.md`, 15 tool calls in. Real, useful new finding written up there (not intercom-specific — this confirms the same wall hits a different business request too, purely from turn cadence). Real spend for these 15 tool calls was incurred and not quantified — same reason as before, the crash happens before the pricing lookup runs.

**Net status on case 2a**: still not completed, twice now, for two different real reasons — first a fabricated anchor (now fixed and verified), second the pre-existing quota ceiling (not fixed, a real decision still pending per `30-...md`). Retrying a third time without addressing the quota question would very likely hit the same wall again — not actioned without asking first.

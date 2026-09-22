# Build completion: near-duplicate-query detector (shipped) + flatline detector (honest negative result), 2026-09-22

Executes [prompts/prompt-6-near-duplicate-and-flatline-detection.md](prompts/prompt-6-near-duplicate-and-flatline-detection.md).
**Fix 1 (near-duplicate-query detector) is built, type-checked, and offline-verified against
real, recorded data below. Fix 2 (flatline detector) is NOT built** -- real, offline replay
against the same trace showed its literal spec (consecutive calls adding zero new fact_refs)
never fires, including on the exact case it targets. Both the finding and the decision not to
build it were reviewed live, this session, with the validator session
(`level-5-engineering-knowledge-2f`, the session that shaped this prompt) before proceeding --
see "Fix 2" section below for the full exchange summary. No real (paid) agent test run. No
git add/commit.

## Fix 1: near-duplicate-query detector -- built

### What changed (real line numbers, current file state)

- **`mcp-server/db/search.ts`**: `SearchResponse` (interface) gained `queryEmbedding?: number[]`,
  populated from the `embedding` variable `search()` already computes on every call (both return
  branches, `confident: true` and `confident: false`). Zero new Vertex spend -- this is the exact
  array already computed and previously discarded.
- **`mcp-server/agent-poc/atomic-prd-agent.ts`** (lines 171-179, **not named in the prompt, fixed
  anyway**): this file's own `search_facts` tool handler also does `...raw` when building its
  tool response. Extending `SearchResponse` would have silently leaked a 768-number array into
  every one of its tool calls' LLM context -- real, wasted token cost, in a file this build
  wasn't supposed to touch but that broke as an unavoidable consequence of the additive
  `search.ts` change. Fixed by destructuring `queryEmbedding` out before the spread. Confirmed
  this is the only other real caller of `search()` that spreads the full response (`
  routeCapabilities()`, capability-fanout-prd-agent.ts:63-83, only reads `.results`, unaffected).
- **`mcp-server/agent-poc/capability-fanout-prd-agent.ts`**:
  - `TriedQueryOutcome`'s `"executed"` variant gained `nearDuplicateFlagged: boolean` (line 308),
    parallel to the existing `crossModuleFlagged`.
  - New `cosineDistance(a, b)` helper (line 351) and `NEAR_DUPLICATE_BLOCKED_REASON` constant
    (line 361).
  - `makeCapabilityTools` gained two new parameters, `nearDupMargin`/`nearDupBlockAfter` (lines
    376-377), threaded through from `runCapability`'s `opts` (lines 763-764, 781-782) and from
    `main()`'s new `NEAR_DUP_MARGIN`/`NEAR_DUP_BLOCK_AFTER` env-backed constants (lines 1067-1068,
    passed at the single `runCapability(...)` call site, lines 1206-1207).
  - `searchFacts`'s handler: after `search()` executes (necessarily -- see "why this runs after
    execution" below), computes `nearDuplicateCount` = how many of this capability's prior
    *executed* queries have cosine distance ≤ `nearDupMargin` from this query's real embedding
    (lines 501-510). If `nearDuplicateCount >= nearDupBlockAfter`, the real results just computed
    are discarded and the same `{confident:false, results:[], blocked:true, blockedReason}` shape
    Fix 1's design doc specifies is returned instead (lines 512-536) -- pushed to `triedQueries`
    as `{kind: "blocked"}`, **not** `{kind: "executed", ...}` (line ~536-ish; see "bug avoided"
    below for why this matters). `queryEmbedding` is stripped from both the cache-replay path
    (line 480) and the normal-execution return path (line 549) before anything reaches the model.
  - `search_facts`'s tool description text extended to explain the new block shape to the model
    (so it isn't confused seeing an unfamiliar `blocked:true` the first time it happens -- same
    reasoning doc 11 already validated live for the cross-module block).

### Why this runs *after* `search()` executes, not before (a real design correction from the prompt's own wording)

The prompt's design doc says "after a query executes, compute cosine distance..." -- this
session initially assumed (wrongly) that near-dup blocking could mirror the cross-module gate's
*pre-execution* short-circuit (queries 3+ of an already-twice-flagged concept never hit `search()`
at all). Checked directly: that's only possible for the cross-module gate because `isRelatedQuery`
is a free, *textual* pre-check that doesn't need the current query's own embedding. There is no
equivalent zero-cost pre-check for embedding proximity -- you cannot know a query's cosine
distance to prior queries without embedding it first, which means running `search()`. Confirmed
directly against real data: `isRelatedQuery`'s substring check does **not** reliably relate real
near-duplicate pairs -- the real node-iot pair `"processAccessPubSubMessage update handler"` vs.
`"...update implementation"` shares no common substring at all (`"handler"` vs. `"implementation"`
diverge immediately), despite being a real 0.0459 cosine-distance near-duplicate. So Fix 1
necessarily runs the real search first (zero *extra* Vertex spend either way -- the embedding is
already being computed for the real query), then discards the real results if the near-duplicate
threshold is crossed. The tradeoff, stated plainly: one Postgres query on the triggering call is
"wasted" server-side; what's actually protected is the capability's turn budget, via the model
seeing the same `blocked:true` recovery signal doc 11 already found lets it stop cleanly.

### A real bug avoided (found by re-checking doc 11's own prior incident before writing this)

Doc 11's Addendum 2 found and fixed a real bug: the exact-duplicate cache lookup ran *before* the
escalation check, so a repeat of an already-crossed-threshold query silently bypassed the block
via cache replay. The same shape of bug was avoided here on the first pass: the near-dup block
branch pushes `{kind: "blocked"}` to `triedQueries`, not `{kind: "executed", response: raw, ...}`
-- storing the real response there would let a later byte-identical repeat of the *same* blocked
query hit the exact-match cache-replay branch and silently serve the real (blocked) results back
as if nothing happened. Cost of this choice, same one doc 11's fix already accepted for the
cross-module case: a blocked entry carries no embedding for *future* near-dup comparisons -- a
minor precision loss (a later, different query that happens to be close to this specific blocked
query won't count it), not a bypass.

### A real metric correction: cosine distance, not the same metric as the existing cross-module signal

The prompt's design section said to reuse `CAPABILITY_CROSS_MODULE_MARGIN`'s calibrated `0.05`
value directly. Checked directly before trusting that: `search.ts`'s existing cross-module signal
(and every other distance in this file) is computed via pgvector's `<->` operator, which is
**always Euclidean (L2) distance**, regardless of the `facts_embedding_idx` HNSW index being built
with `vector_cosine_ops` (pgvector index operator classes only determine which operator an index
*accelerates*; the operator's own meaning is fixed by the extension, not the index -- a `<->`
query against a cosine-ops index just runs unaccelerated, it doesn't change what's computed). So
`CROSS_MODULE_MARGIN=0.05` was calibrated as a **gap between two independent L2 distances** (doc
11, Phase 3) -- a different metric *and* a different kind of quantity (a gap, not an absolute
distance between two query embeddings) than what Fix 1 needs. Reusing it blindly would not have
been "reusing a proven number," just reusing a number that happened to share a name. Instead: Fix
1 computes real cosine distance (implemented directly, no Postgres round trip available for
comparing two arbitrary query embeddings against each other), and the `0.05` threshold was
independently re-derived against real data below -- it only remains `0.05` because that's what the
real numbers actually supported, not because it was carried over unchecked.

### Real, offline verification (zero spend -- see "no real spend" section)

**Real embeddings extracted from `postgres-queries.jsonl`, not re-embedded.** `FULL_DEBUG`'s
Postgres query trace captures every query's literal `$1::vector` parameter (the full 768-number
embedding array as sent to Postgres) for the run at
`output/agent-runs/prds/test/debug/2026-09-21-005-1e-invitations-edit-baseline-prebuild-edges/`.
Parsed those real vectors back out and replayed Fix 1's exact block-decision algorithm (same
ordering, same "blocked entries drop out of future comparisons" rule) in a temp script -- not a
synthetic example, the real recorded embeddings from the real run that found this problem.

**1. The real 3-query trio, replayed against `node-iot-api-oskey-io__access_control_device`
(17 real `search_facts` calls, in order):**

| call | query | nearDupCount | min cosine distance to any prior | outcome |
|---|---|---|---|---|
| 15 | `"processAccessPubSubMessage update"` | 1 | 0.0401 (vs. call 2, `"processAccessPubSubMessage"`) | executed |
| 16 | `"processAccessPubSubMessage update handler"` | 1 | 0.0367 (vs. call 15) | executed |
| 17 | `"processAccessPubSubMessage update implementation"` | **2** | 0.0218 (vs. call 15) | **BLOCKED** |

(Call 15's `nearDupCount` corrected 2026-09-22, same session, after the validator session
independently re-derived the full distance list and caught a transcription slip: the real script
output was `nearDupCount=1` for call 15 all along -- the `0.0401` distance right next to it was
always ≤ the `0.05` margin, so it should have read 1 from the start. Doesn't change the real
outcome: 1 is still below `nearDupBlockAfter=2`, call 15 still executes either way, and the real
block point stays call 17. A doc error, not a code or algorithm error -- caught by independent
re-derivation, not by re-reading the same number twice.)

Blocked exactly at the 3rd call of the real cluster, matching the prompt's own success criterion.
No other call among the 17 real queries in this capability ever triggers (`nearDupCount` stays 0
for every one of calls 1-14; the closest unrelated pair anywhere in that stretch is 0.0528, call
12 vs. call 3 -- just outside the 0.05 margin).

**2. Regression check, `firebase-oskey-dev__user` (10 real `search_facts` calls, a different,
genuinely varied capability from the same real run -- one exact-duplicate cache hit at call 7
excluded from this replay since it's a real no-op in the shipped code, matching how the cache
branch returns before any near-dup computation runs):** zero false positives. Every one of the 10
real queries executes normally; the closest real cosine distance anywhere in this capability is
0.0939 (`"OSKUserInvitationUpdateRequest"` vs. `"updateAccess"`) -- comfortably above the 0.05
margin, with real headroom on both sides (closest true-positive-adjacent value found across
*both* capabilities combined: 0.0459 for real duplicates, 0.0528 for the closest real non-
duplicate -- a real, checked gap, not assumed).

**3. Type-check**: `npx tsc --noEmit` inside `mcp-server/` -- zero new errors from this diff.
7 pre-existing `factId`-related errors remain, confirmed present on a clean `git stash` before
these changes too (in `pipeline/facts-postgres-index/`, a directory this build never touched --
unrelated to ADR-010's fact_id→fact_ref migration, not introduced or worsened here).

**4. Diff re-read**: `atomic-prd-agent.ts`'s change is the one deliberate, out-of-scope-but-
necessary fix (queryEmbedding leak, above); no other existing behavior in either file changes.
`routeCapabilities()` and every pre-existing `search()` caller's behavior is unaffected (additive
field only, confirmed by direct inspection of every real call site).

### Real numbers, defaults shipped

`CAPABILITY_NEAR_DUP_MARGIN` (default `0.05`, cosine distance) and
`CAPABILITY_NEAR_DUP_BLOCK_AFTER` (default `2`) -- both overridable via env var, same pattern as
`CAPABILITY_CROSS_MODULE_MARGIN`/`CAPABILITY_CROSS_MODULE_BLOCK_AFTER`.

## Fix 2: flatline detector -- NOT built (real, honest negative result)

Before building, this session simulated Fix 2's literal spec (a consecutive-zero-new-fact-refs
counter, nudge at 3, block at 5) against the same real, full 20-call `node-iot` trace (all three
tool types: `search_facts`/`get_graph_neighbors`/`walk_cluster`, one shared `seenFactRefs`-style
set). **It never fires anywhere in the real trace -- including on the exact 3-call trio it was
built to catch.** Real per-call new-fact-ref counts for calls 18/19/20 (the trio): **3, 3, 1** --
never zero. Root cause, checked directly: `search_facts` always returns a full top-25 ranked list
regardless of query quality, so even a genuinely dead-end, near-duplicate-worded query almost
never returns a top-25 *identical* to a prior query's -- there's always a little noise at ranks
~20-25 that counts as "technically new" by fact_ref membership alone, even when it adds nothing
useful.

**Two follow-up checks run, both requested live by the validator session before ruling on how to
proceed (full real numbers in the session transcript, summarized here):**

1. **Count-threshold check**: full real `n_new` sequence across all 20 calls (search_facts +
   graph/cluster): `25,0,18,0,25,20,17,24,17,6,4,21,0,12,6,8,2,3,3,1`. Sorted, this is a smooth,
   continuous distribution (`0,0,0,1,2,3,3,4,6,6,8,12,...`), not bimodal. A strict `≤3` threshold
   does catch calls 17/18/19 as 3 consecutive (nudging at call 19), but the margin between the
   highest "flatline" value (3, at calls 18/19) and the very next real value (4, at call 11 --
   `"OSKAccessControlDeviceAccessController methods"`, a legitimate if narrow query, not part of
   the wasteful pattern) is a single-unit gap. Independently re-derived by the validator session
   directly from the same trace file -- byte-for-byte identical sequence, confirmed, not just
   accepted on report.
2. **Rank-position check** (does a *late-ranked* new fact concentrate differently for the
   wasteful trio than for genuinely narrow-but-productive queries?): mean/min new-fact rank for
   calls 18/19/20 is 15.0/12, 19.3/16, 23.0/23 -- tail-concentrated, as expected. But call 17
   (immediately before the trio) shows 18.5/12, and call 15 (not part of the wasteful pattern)
   shows 20.0/13 -- both just as tail-concentrated as the real trio. Rank position tracks how far
   into a capability's fact-space exploration a query lands, not whether it's wastefully
   duplicative -- confounded by normal capability progression (any capability's later queries
   naturally surface fewer, lower-ranked new facts, wasteful or not), not a clean signal.

**Neither check shows the kind of clean separation Fix 1's real distances showed** (0.0218-0.0459
for genuine duplicates vs. 0.0528+ for the closest real non-duplicate, a real ~15% relative gap
with headroom on both sides). Shipping a count- or rank-based threshold here would mean tuning a
number to fit one example, not finding a real signal -- the exact anti-pattern this project's own
`search.ts` history (`DEFAULT_RESULT_LIMIT`'s comment) already explicitly warns against repeating.

**Decision, made live with the validator session (`level-5-engineering-knowledge-2f`) before
building anything for Fix 2**: don't ship a guessed threshold. Ship Fix 1 only. Write up Fix 2 as
a real, honest blocker (this section) rather than build something proven not to fire on its own
motivating case.

**A concrete, real starting point for a future redesign, not a vague "try again later"**: the
reason Fix 1 works cleanly while raw fact-count/rank don't is likely structural -- embedding
distance between two *query strings* measures semantic closeness independent of how far into a
capability's fact-space exploration you are; a raw new-fact count is confounded by that
progression regardless of duplication. Doc 40 §3's own cited paper (arXiv 2606.27009, "Semantic
Early-Stopping for Iterative LLM Agent Loops") actually specifies embedding distance between
**consecutive turns only** (`d_t = 1 − cos(e_t, e_{t-1})`, halt after `k=2` consecutive rounds
under `ε=0.06`) -- structurally much closer to Fix 1's own mechanism than to "count of
technically-new fact_refs versus every prior query," which is what this prompt's Fix 2 literally
specified. A future session building this should start from the consecutive-turn-embedding-
distance version, not the fact-count version tested and rejected here.

## Real spend confirmation

Zero fresh Vertex calls this session. Every embedding used in verification above was extracted
from `postgres-queries.jsonl`'s already-recorded `$1::vector` query parameters (the real
literal embedding array Postgres received on the original 2026-09-21 run) -- not re-embedded.
Confirmed this approach *would* have required a fresh embedding call if those parameters hadn't
been captured (the tool-call trace alone, `tool-calls-*.jsonl`, does not include embeddings) --
flagged and checked before running anything, per this prompt's own instruction, not discovered
after the fact.

## What's next (not this session's job to run)

**Do not run a real `capability-fanout-prd-agent` test from this session.** Per the prompt's own
instruction and the validator's explicit confirmation this session, the real reproduction run is
left for the user (or the validator session) to launch:

```
PERSONA_FILE=mcp-server/skills/prd/skill.v3.md \
TEMPLATE_FILE=mcp-server/skills/prd/template.v2.md \
FULL_DEBUG=true \
GROUNDING_DOCS=true \
RUN_KIND=test \
PG_DATABASE=facts_index_prebuild \
CAPABILITY_MAX_TURNS=10 \
npx tsx mcp-server/agent-poc/capability-fanout-prd-agent.ts mcp-server/test-questions/1e-dummy-prd-ios-invitations-cloudkit-firebase.md
```

(Same question, persona, template, `PG_DATABASE=facts_index_prebuild` snapshot as the original
run this whole thread traces back to -- isolates the effect of Fix 1 without also changing the
cross-repo-edges variable. `CAPABILITY_MAX_TURNS=10` is the user's own already-stated reduction,
not yet tested for real.)

No git add/commit performed or requested.

# Prompt 6: code-enforced near-duplicate-query detector + flatline (no-new-evidence) detector

**Standing rule: never run `git add`/`git commit`, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

**Mode: real build, then a free offline verification, then STOP.** Do not run a real (paid)
agent test yourself. The last section of this prompt explains why and what to do instead.

## Why this exists (read first, don't re-derive)

A real, measured run of this project's multi-capability PRD agent
(`mcp-server/agent-poc/capability-fanout-prd-agent.ts`) burned 3 of one capability's last turns
on `"processAccessPubSubMessage update"`, `"...update handler"`, `"...update implementation"` —
three different strings asking the same dead-end question. Full detail and real numbers:
`11-build-completion-duplicate-search-queries-fix-2026-09-20.md`'s "Note, 2026-09-21/22"
section (read it in full). Traced directly against the shipped code and confirmed:

- **The only thing that ever stops a capability is running out of its turn budget
  (`CAPABILITY_MAX_TURNS`).** There is no code-level check for "have I essentially asked this
  before" or "have my last few calls taught me anything new."
- The existing near-duplicate protection (`triedQueries`, `isRelatedQuery`,
  `CAPABILITY_CROSS_MODULE_BLOCK_AFTER`, in `makeCapabilityTools`,
  `mcp-server/agent-poc/capability-fanout-prd-agent.ts:322`) only catches (a) a byte-identical
  repeat, served free from a cache, or (b) a query whose cross-module embedding distance was
  independently flagged twice — neither fires for three legitimately-in-module, differently-worded
  queries. Verified directly: `isRelatedQuery`'s substring check *would* flag these three as
  related to each other, but that signal only feeds the cross-module counter, not a general
  repeat-query counter — it never mattered because none of the three was ever cross-module-flagged.
- `skill.v3.md`'s own "never repeat a sub-question 3-5 times" rule is a prompt instruction only,
  not code-enforced — and this project's own doc 34 already found soft rules of this shape are
  "well-calibrated but not reliably followed."
- A real, external, large-scale study confirms the general design principle this project should
  follow (`40-research-agent-loop-governance-and-model-comparison-2026-09-22.md`, section 1,
  arXiv 2607.01641, verified real this session): stopping rules must be enforced by the code
  responsible for continuation, deterministically — never left to the model to decide to stop.

**The turn budget is a hard ceiling set by config (`CAPABILITY_MAX_TURNS`, currently being
tested at 10, was 20) — the model cannot change it.** What's unmanaged is *how well those turns
get used*: near-duplicate questions and turns that add nothing new. That's what this prompt
builds. It does not touch the turn cap itself, and does not touch the Gemini
`thoughtSignature`/context-bloat issue (also in doc 40, section 2) — that one has no safe
code-side fix available (no official pruning guidance exists), it's out of scope here.

## Where everything lives (verified, real line numbers — re-check them yourself, code may have
moved since this was written)

- `mcp-server/agent-poc/capability-fanout-prd-agent.ts`
  - `makeCapabilityTools(...)`, starts line 322 — builds the three tools (`searchFacts`,
    `getGraphNeighbors`, `walkCluster`) a capability gets. This is the **only** code this
    project controls that runs between the model's turns (the turn loop itself is inside
    Genkit's `ai.generate()`, called once per capability from `runCapability`, line 618 — this
    project does not own that loop, so both fixes must work by shaping what a tool call
    *returns*, the same mechanism the existing cross-module escalation already uses).
  - The existing `triedQueries`/`isRelatedQuery`/escalation logic inside `searchFacts`: read
    the whole handler, roughly lines 366-449, before writing anything — Fix 1 extends this
    same structure, it does not replace it.
  - `runCapability(...)`, line 618 — owns `seenFactRefs` (a `Set<string>`, instantiated ~line
    660) which already accumulates every real fact_ref surfaced by any of the three tools this
    capability has called so far. Fix 2 reuses this directly; it is not a new signal.
- `mcp-server/db/search.ts`
  - `export async function search(...)`, line 143 — already computes the query embedding via
    `embedSearchQuery(query)` at line 151, and reuses it for the existing cross-module check
    (line ~177-186). **It never returns the embedding to the caller** — `SearchResponse`
    (interface, line 81) has no field for it. This is the one real gap Fix 1 needs to close
    before it can do anything: add an additive, optional field (e.g. `queryEmbedding?:
    number[]`) so `capability-fanout-prd-agent.ts` can read it — zero new Vertex spend, it's
    the exact array already computed on every call today, just currently discarded.

## Fix 1: code-enforced near-duplicate-query detector

**Design, grounded in what already exists and is already calibrated in this exact codebase —
do not invent new numbers, reuse the proven ones as your starting default:**

1. In `search.ts`: add `queryEmbedding?: number[]` (or similar name — your call, keep it
   consistent) to `SearchResponse`, populated from the `embedding` variable already computed at
   line 151. Confirm no existing caller breaks (it's additive/optional — `atomic-prd-agent.ts`'s
   own use of `search()`, if any, must be unaffected; check it).
2. In `capability-fanout-prd-agent.ts`: extend `TriedQuery` to optionally carry the query's
   embedding. In the `searchFacts` handler, after a query executes, compute cosine distance
   from the new query's embedding to every prior query's embedding in `triedQueries` *for this
   capability* (not across capabilities — each capability's `triedQueries` array is already
   per-capability, confirm this stays true). Track a real "near-duplicate count" the same shape
   as the existing `flaggedRelatedCount` — do not conflate it with the cross-module counter;
   this is a new, independent signal, checked in the same place, escalating the same way.
3. **Starting defaults — reuse this project's own already-calibrated numbers, don't guess new
   ones:** distance threshold `0.05` (same as `CAPABILITY_CROSS_MODULE_MARGIN`'s real,
   Phase-3-calibrated value, doc 11), escalate/block after `2` near-hits (same as
   `CAPABILITY_CROSS_MODULE_BLOCK_AFTER`'s default). Make both overridable via new env vars
   (e.g. `CAPABILITY_NEAR_DUP_MARGIN`, `CAPABILITY_NEAR_DUP_BLOCK_AFTER`), same pattern as the
   existing ones. **Do not treat these as correct just because they're reused** — step 6 below
   is how you actually check them, the same way doc 11's Phase 3 checked the original numbers
   before shipping them.
4. On trip: return the **same shape of response** the existing cross-module block already
   returns (`confident: false, results: [], blocked: true`, a clear reason string telling the
   model to write `[NEEDS CLARIFICATION]` and move on) — doc 11's own note observed this exact
   response shape lets the model recover cleanly and finish naturally. Don't invent a new
   response shape.
5. Push a `triedQueries` entry for the newly-blocked query the same way the existing code
   does (see the comment at the block site you're extending — don't duplicate entries for
   already-blocked exact repeats).

## Fix 2: flatline detector (stop nudging/blocking once calls stop adding new evidence)

**More novel than Fix 1 — the research (doc 40, section 3, arXiv 2606.27009) is about
iterative-draft loops, not heterogeneous tool-call loops, so treat this as adapted, not
directly transplanted. Be conservative: nudge before you block.**

1. In `runCapability`: after each of the three tools returns, compute how many of the
   fact_refs it just surfaced are genuinely new versus already in `seenFactRefs` (the set
   already exists and is already updated somewhere in this flow — find exactly where and hook
   in there, don't create a second, parallel tracking structure). Track a real, capability-scoped
   **consecutive-zero-new-facts counter**, reset to 0 the moment any call adds ≥1 new fact_ref.
2. **Two-stage, mirroring the proven cross-module design — don't invent a new shape:**
   - After **3** consecutive calls adding zero new facts (this exact number is what the real
     node-iot trace showed before it ran out of turns — a real, grounded starting point, not
     arbitrary): don't block. Instead, append a clear, honest note to that tool's own result —
     something like "the last 3 tool calls found no new evidence; consider concluding this
     section now rather than continuing to search" — a nudge, still returning whatever real
     (possibly empty) result the call actually produced.
   - After **5** consecutive calls adding zero new facts: escalate to the same `blocked: true`
     shape as Fix 1, with a reason string explaining why. Make both thresholds overridable env
     vars, matching the existing pattern.
3. This must NOT fire on a capability that's making real, if slow, progress (e.g. finding 1 new
   fact per call is not a flatline) — only on a genuine run of zero-new-fact calls. Get this
   distinction right; a false trip here cuts off real work, which is worse than Fix 1's
   false-positive risk (Fix 1 only blocks a single dead-end line of questioning; Fix 2 could end
   a whole capability early).

## Required, free (zero-spend) verification before you stop

**Do not run a real agent test to check this.** Verify offline, against the real, already-saved
debug trace from the run that found the problem:
`output/agent-runs/prds/test/debug/2026-09-21T18-11-10-182Z-1e-invitations-edit-baseline-prebuild-edges/`
(the `node-iot-api-oskey-io__access_control_device` files specifically). This is the same
verification discipline doc 11's original fix used (see its "Re-verified live" section) —
call your new logic directly against the real recorded query sequence and tool outputs from
that trace, not a synthetic example. Confirm and record in your build-completion doc:

1. Fix 1, replayed against the real 3-query sequence from that trace: does it correctly flag
   and block by the 3rd call (matching the real near-duplicate concept cluster), with your
   chosen threshold? Show the real distances computed, not just pass/fail.
2. Fix 2, replayed against the same capability's full real tool-call sequence (all ~20 calls,
   not just the last 3): does the consecutive-zero-new-facts counter correctly identify where
   the flatline started? Does it *not* false-trip earlier in the same capability's real
   sequence, where it was still finding new facts?
3. A regression check: replay a *different* real capability's trace from the same run (e.g.
   `firebase-oskey-dev__user`, which made real, varied, productive queries) and confirm neither
   fix fires — a real false-positive check, not assumed safe.
4. Type-check clean (`npx tsc --noEmit` or this project's equivalent). No other file's existing
   behavior changes — confirm by re-reading the diff, not just trusting it compiled.

## What to write, and where to stop

Write a build-completion doc, same folder, next available number as of when you run (check
first — do not guess a stale number). Include: what changed (with real line numbers), the
Phase-1-style verification results from above with real numbers, and explicitly confirm no
real spend happened (embedding calls inside the offline replay reuse recorded data, not fresh
Vertex calls — if your verification approach *would* require a fresh embedding call, stop and
flag that as a cost before running it, don't just run it).

**Then stop. Do not run a real capability-fanout-prd-agent test.** The user will run the real
verification test themselves (or hand it to the validator session that's been checking this
work throughout) once they've reviewed your build. When they do, the real run to reproduce is:
same question (`mcp-server/test-questions/1e-dummy-prd-ios-invitations-cloudkit-firebase.md`),
same persona/template/flags as the original Run 1
(`PERSONA_FILE=mcp-server/skills/prd/skill.v3.md`,
`TEMPLATE_FILE=mcp-server/skills/prd/template.v2.md`, `FULL_DEBUG=true`, `GROUNDING_DOCS=true`,
`RUN_KIND=test`), against the same database Run 1 used
(`PG_DATABASE=facts_index_prebuild` — the pre-build-edges snapshot, kept specifically so this
comparison isolates the effect of these two fixes and does not also change the cross-repo-edges
variable), with `CAPABILITY_MAX_TURNS=10` (the user's own already-stated reduction, not yet
tested for real). That is not your job to run — just leave the exact command in your
build-completion doc so it's ready to copy-paste. No git add/commit.

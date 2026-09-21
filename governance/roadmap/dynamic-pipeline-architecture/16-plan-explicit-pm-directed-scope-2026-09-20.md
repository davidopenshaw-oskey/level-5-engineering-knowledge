# Plan: explicit PM-directed scope, replacing automated routing as the primary discovery mechanism

Decide-stage plan, drafted 2026-09-20, capturing an extended design discussion following
docs 09-15 (repeat-query fix, hierarchical-routing investigation, facts-table-derived
routing feasibility test). **Nothing in this doc has been built.** Persisted per this
project's own discipline — write real findings/decisions to files as they happen, not just
chat scrollback — given how much ground this discussion covered.

## Why this exists — the real evidence trail, not a preference

Three separate, genuinely different approaches to automated cross-repo scope discovery
were tried and evaluated this session, and each failed for a distinct, real, structural
reason — not because any one implementation was bad, but because the underlying signal each
relied on was the wrong kind of signal for this job:

1. **Flat, individual-fact vector routing** (`routeCapabilities()`, today's live mechanism):
   confirmed to miss genuinely relevant modules (iOS never entering candidacy for a real
   cross-platform request, `unit_management` a statistical near-tie with the cutoff) —
   doc 09-11.
2. **Hierarchical, (repo,module)-grouped routing** (doc 12-15's feasibility test): fixed the
   near-tie problem cleanly, but left iOS's real rank essentially unchanged (82nd percentile
   vs. 80th before) — because grouping raw `symbol_name` values at a coarser grain is still
   the same engineering vocabulary, not a bridge to business language.
3. **PM-specified explicit repo/module anchors** (this discussion): looked like the fix for
   (2)'s vocabulary problem — until stress-tested against a real, natural PM sentence
   ("open the door remotely") that doesn't contain the technical anchor (BLE) a glossary
   lookup would need to trigger on. The gap isn't business-domain knowledge (which a PM has)
   or code-structure knowledge (which extracted facts/edges have) — it's *product-behavior-
   to-technical-mechanism* knowledge, which currently lives only in a few technical people's
   heads and isn't captured anywhere in this system.

**Conclusion drawn from this real trail, not asserted up front**: full automatic discovery
of cross-repo scope is not reliably achievable with what currently exists, regardless of
how the routing signal gets computed. The realistic fix is a cheap, fast, explicit human
checkpoint in the loop — not a fourth clever algorithm.

## The reframe

This is a new "Product Office Way of Working," not a traditional PRD-generation flow. The
PM/PO owns business use cases, flows, and rules across domains; devs own the codebase across
those same domains; the domains span an unknown, growing number of repos. The system's job
shifts from *discovering* what's relevant to *assembling* facts from an explicitly-scoped
set the PM (with a dev checkpoint) already knows.

## Concrete design

### 1. Template structure — the input a PM actually writes

Extends the structure already built into `mcp-server/test-questions/1b-adding-a-owner-non-
resident-type.md` (In-scope platforms / Explicitly out of scope / Planned follow-on work /
Known constraints / Open questions / Acceptance criteria). "In-scope platforms" becomes a
structured list, each entry carrying three real pieces, not just a platform name:

```
- <Business-facing platform name> (<real repo mapping, narrowed if known>)
-- <PM's own initial-query directive for this platform's first real search>
```

Worked example, refined during this discussion:

```
- iOS app (ios-oskey-dev only — swift-ble-kit/cloud-kit/ui-kit/webrtc-kit not in scope
  for this feature)
-- check where the inhabitantType is being used inside these repos
```

The repo-narrowing clause is the PM's real lever for controlling fan-out/cost (see §4) —
used when they know the scope precisely; left broad (just the platform name) when they
don't, deferring precision to the dev checkpoint.

### 2. `skill.v3.md` — one new, generic, reusable rule

Not feature-specific content. Something in the shape of: *"If your capability contract
includes a specific initial-query directive for your assigned platform, treat it as your
first real search — not generic exploration of the whole module. Run that directive first,
then branch outward using your own judgment once you have that evidence."* Same category as
the existing generic budget/repeat rules already in that file — judgment, not a per-run
fact.

### 3. `renderCapabilityContract()` (`capability-fanout-prd-agent.ts`) — the per-run fact

Injects the PM's literal directive text for the specific platform this capability is
scoped to — same category of content it already injects (which module, which headings), not
new hardcoded behavioral judgment. Doesn't touch `skill.v3.md`'s own content.

### 4. Orchestration (`routeCapabilities()`/`main()`) — the real mechanism change

This is where the actual work is, and it's an orchestration change, not a new tool. No
change needed to `search_facts`/`get_graph_neighbors`/`walk_cluster` themselves.

1. Parse the PM's explicit "in-scope platforms" list from the structured input instead of
   (or ahead of) computing candidates via vector-distance routing.
2. Resolve each named platform to its real `(repo, module)` pairs — a cheap
   `SELECT DISTINCT repo, module FROM facts WHERE repo IN (...)` (free, no embedding), scoped
   by whatever repo-narrowing the PM specified.
3. Spawn one capability **per real `(repo, module)` pair**, not per platform bullet — a
   platform naming 5 real modules becomes 5 real capability runs. Deliberately chosen over
   letting one capability search across multiple modules at once: doc 11's own real data
   shows narrowly-scoped capabilities finish reliably within budget while broadly-scoped
   ones keep hitting the turn cap — merging modules into one capability would likely worsen
   the already-open completion-reliability problem, not fix it.
4. Seed each spawned capability with its platform's PM-authored directive text (§3).
5. Existing merge step (unchanged) collates results across all spawned capabilities into the
   final document — the same mechanism already proven across docs 07-15.

### 5. Automated routing — demoted to an advisory safety net, not discarded

Everything built in docs 09-15 stays useful, just repositioned. Once the PM's explicit list
is spawned, a cheap, already-built routing pass (flat or hierarchical) can run alongside it
and surface anything with a strong match the PM didn't name — "we also found a strong match
in module X you didn't list, worth a look?" This is the "evidence found, needs
investigating" idea from earlier in this discussion, now scoped as a second opinion on an
authoritative PM list rather than the primary discovery mechanism it's been trying and
failing to be.

### 6. The human checkpoint — explicit, not implicit

A dev/architect reviews the PM's in-scope-platforms list before the expensive fact-gathering
run starts — specifically to catch product-behavior-to-mechanism gaps a PM's natural
language won't contain (the BLE/door-unlock case). This is a real, named step in the new Way
of Working, not something the system is expected to eliminate. The system's job is to make
this checkpoint fast and low-friction (confirm/amend a short structured list) rather than a
from-scratch technical review.

## What does not change

- `search_facts`, `get_graph_neighbors`, `walk_cluster` — unchanged. This whole design is an
  orchestration/input-format change, not a new tool-capability build.
- The merge step, validators (`checkFabrication`/`checkTemplateConformance`), and per-
  capability synthesis mechanics — unchanged.
- Docs 09-11's repeat-query mechanisms ((b)/(c)/(d)) — still real, still useful, independent
  of this change (a capability that's now correctly module-scoped from the start still
  benefits from not wasting budget on repeated dead-end queries within its own scope).

## Real cost implication, stated plainly

One platform bullet can now legitimately resolve to several real capability runs (the iOS
example: up to 5) — each one a real, additional LLM cost on top of an already-climbing curve
this session measured directly ($0.51 → $0.67 → $1.20 across three real runs today). The
repo-narrowing lever in §1 is the PM's tool for controlling this; the dev checkpoint in §6
is the second one. Neither is optional if cost is meant to stay bounded.

## Open items for a future build-stage session

- Exact parsing logic for the structured "In-scope platforms" list (format, required
  fields, how repo-narrowing is expressed) — not fully specified here, needs a concrete
  schema before building.
- How the advisory routing safety net (§5) actually surfaces its findings in the final
  document — reuse the existing "Evidence Used" reserved-section pattern, or something new.
- Whether the dev checkpoint (§6) is a manual step outside this tool entirely, or something
  the tool itself should support (e.g. render the parsed platform list back for confirmation
  before spending on the real run) — real UX decision, not resolved here.
- The exact-dup-cache-bypasses-escalation-gate bug (found live in doc 11's Addendum 2) is
  being fixed independently in another session — unrelated to this plan, noted only so it
  isn't conflated with the orchestration change above.

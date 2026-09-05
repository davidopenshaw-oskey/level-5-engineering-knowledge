# Workflow Catalogue — Seeding Tasklist (Task 1 of 2)

**Status:** Sketched 2026-09-05, not started. Task 2 (post-merge refresh/staleness agent) deliberately not sketched yet — sequencing follows from Task 2 needing a real catalogue to refresh.

## Why this exists

Discussed 2026-09-05, following a review of `governance/roadmap/building-workflows/historic-examples-and-ideas/` (a pre-AST-facts effort that used ChatGPT/NotebookLM research to produce a 16-document workflow catalogue, methodology described in that folder's own `chatgpt.md`/`notebookLM.md`). That corpus was already flagged once before, independently, in `governance/roadmap/facts-serving-strategy/05-tasklist.md` item 4 (2026-09-03): a trustworthy workflow-documentation corpus is a real prerequisite for grounding the atomic-PRD template's Layer 1 (Business) with LLM assistance, and the historic corpus was explicitly "not yet verified per-document" — the same conclusion reached independently this session, given directly by the user as a caveat: *"these docs are examples, their accuracy cannot be presumed."*

What's changed since 2026-09-03: real AST facts, `_shared/graph-traversal.ts`, and (as of this session) a compiler-verified cross-repo field-lineage join (`build-form-field-lineage-edges.ts`) now exist. Verifying a workflow claim against real facts is tractable and cheap in a way it wasn't when item 4 was written. This task is the "seed it properly-grounded, this time" attempt.

**The one architectural rule this whole task exists to enforce, agreed 2026-09-05:** an LLM may *draft* a workflow's name/purpose, but only from a real, graph-connected cluster of facts already assembled mechanically — never from open-ended reasoning over code or docs. That's the exact discipline whose absence is why the historic corpus isn't trusted today. The historic corpus itself is usable only as a **candidate/shape reference** (does a real cluster resemble PMO-012's shape enough to reuse its field structure?) — never as a directly-trusted content seed. Any content pulled from it must be tagged so, not folded in silently.

## Task 1: Seed the workflow catalogue from real, verified fact clusters

### Step 1 — Define the anchor-enumeration strategy

Task 1's original design (`facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md`, section "Task 1") already chose approach (b): a real starting fact, walked outward automatically, stopping at natural boundaries — over approach (a), a fixed N-hop radius from every fact. That choice stands. What's still undefined: which fact kinds are legitimate *starting* anchors, so the seeding pass can enumerate real candidates systematically rather than a human picking one at a time from scratch.

Real candidate anchor kinds, to be confirmed against actual counts before committing (query `facts` directly, don't assume):
- `angular_route` facts (a routed-to UI entry point — a real "a user can get here" signal)
- `firebase_callable_call` facts with a resolved `HTTP_API_CALL` edge (a real Angular-initiated backend action)
- `api_contract` facts with a non-`unknown` `resolution_status` in `cross_repo_edges` (a real backend action reachable from *somewhere*)

Open question, not resolved here: many of these will reach the *same* eventual chain (e.g. every `model_property` fact under `building_unit` might get pulled into several overlapping candidate clusters started from different anchors). Step 3 needs a real de-duplication/merge rule before this is workable at scale — not deferred past a pilot run, since the pilot (Step 6) will surface real collision cases to design against, same discipline as every other fix this project has made (root-cause from real data, not guess ahead of it).

### Step 2 — Extend the bounded graph walk

Reuse `_shared/graph-traversal.ts`'s `findGraphNeighbors`/`expandWithGraphNeighbors` directly, per Task 1's original instruction ("reusing `_shared/graph-traversal.ts` directly rather than a parallel traversal implementation"). Extend depth beyond findGraphNeighbors' current 1-hop, following the same bounded-recursive-walk pattern already proven safe in `build-form-field-lineage-edges.ts`'s `resolveFieldRecursive()` (depth ≤ 6, cycle-safe via a `visited` set — real cycles exist, e.g. address/coordinate nesting).

Stopping rule, to design and pilot, not assumed correct on paper: stop expansion at a real module or repo boundary *unless* the edge crossing that boundary is a `FIELD_BINDING`/`HTTP_API_CALL`/`PUBSUB_TOPIC_BINDING` (the three connection types this project has already built and verified — anything else crossing a boundary is more likely incidental coupling than a real workflow continuation, but this needs testing against real clusters, not assumed).

### Step 3 — Assemble and de-duplicate candidate clusters

Output: for each anchor from Step 1, the bounded walk from Step 2 produces a real, real-fact-id-cited cluster. Merge/de-duplicate clusters whose fact_id sets overlap above some real, measured threshold (not guessed — check the actual overlap distribution across a first real run before picking a number). A cluster with fewer than some minimum real fact count (e.g. 2-3) is probably not a real workflow — likely an isolated utility function — and should be filtered before reaching the LLM-drafting step, to avoid spending real tokens on structurally-uninteresting clusters.

### Step 4 — LLM drafts name/purpose, grounded only in the cluster's own real facts

For each surviving cluster, one real, paid LLM call (same cost-gating discipline as every other paid step in this project — explicit env flag, not a silent default): given the cluster's real fact descriptions (reusing `render-evidence.ts`'s existing rendering, not inventing a new format) and nothing else, draft:
- A short workflow name
- A one-line purpose
- A Business Purpose paragraph (matching the historic corpus's field, since it's a genuinely useful field to keep)

Prompt must state explicitly: only use what's in the provided evidence; do not infer business intent the evidence doesn't support (the same rule the original Inside-Out methodology stated but apparently didn't enforce rigorously — worth stating for a reason this time, and worth spot-checking the output against that rule, not just trusting the instruction was followed).

### Step 5 — Historic-corpus cross-reference, reference only, tagged as such

Separately, fuzzy-match each candidate cluster's drafted name/domain against the 16 historic documents and the master catalogue (by actor + rough domain, not by trusting either side's exact wording). Where a plausible match exists, surface the historic document's richer fields (Authority Model, Related Workflows, Out of Scope, Business/Technical/Overall confidence) to the human reviewer in Step 6 as a **labeled reference suggestion** — e.g. "historic doc PMO-012 may describe this; unverified, not auto-applied" — never merged silently into the candidate's own fields. If adopted, the specific claim adopted needs its own spot-check against real facts before being trusted (per the caveat already recorded in memory), not a blanket import of the whole document.

### Step 6 — Human review gate

Every candidate — LLM draft, real cited evidence, and any labeled historic-reference suggestion — goes to a human for confirm/edit/reject before it becomes a real catalogue entry. Format not yet decided: could be as simple as one reviewable markdown file per candidate (matching this project's existing file-based review conventions) or something more structured. Whichever is chosen, the review action itself (who confirmed, when, against which run) needs to be captured — see Step 7.

### Step 7 — Persist confirmed workflows with real trust-tier/freshness fields

New fact kind (e.g. `workflow_cluster`) or a small new table — TBD at build time, matching Task 1's original open question. Whichever shape, it needs, at minimum (agreed 2026-09-05, the same gap flagged for Task 3's reference docs):
- `generationMethod`: `llm_drafted_human_confirmed` (the only path this task produces — no fully-automated, unreviewed entries)
- The `run_id`/commit_sha of every repo whose facts the cluster cites (so staleness is checkable later, the same way `extraction_runs` already tracks this for code facts)
- `verified_by` / `verified_at` (who confirmed it, when)
- The real fact_ids in the cluster (so Task 2's later staleness check has something concrete to re-check against)

### Step 8 — Pilot before scaling

Run Steps 1-7 against a small, already-understood real case first — the owner/tenant/resident assignment flow this whole session's investigation has been built around (`OSKCreateOrganizationInhabitantComponent` and its real `FIELD_BINDING`-connected chain, already fully mapped in `facts-serving-strategy/15-...md`) is the natural pilot: its real answer is already known, so the pilot's output can be checked directly against a known-correct result before running this against the rest of the codebase. Only after the pilot's own de-duplication/merge/stopping-rule questions (Steps 1 and 3) are resolved against real data should this run broadly.

## Verification plan

1. Pilot cluster for the owner/tenant/resident flow produces a candidate whose cited fact_ids match what `15-...md`'s Task 2/Part D already found by hand (`OSKInhabitantOnboardingCardRequest.inhabitantType`, the `FIELD_BINDING` edge, `OSKCreateOrganizationInhabitantComponent`).
2. The drafted name/purpose is checked against the real cited evidence only — flag (not silently accept) any claim in the draft that isn't traceable to a cited fact.
3. Where a historic-corpus reference surfaces (PMO-012 is the expected match here), confirm it's presented as a labeled, unverified suggestion, not merged into the candidate's own fields.
4. Re-run the real Q1a/Q1b queries (`search()` + `expandWithGraphNeighbors`) once the pilot workflow is persisted, and check whether the new `workflow_cluster` fact itself now ranks as a top-k anchor — the concrete test of whether this closes the retrieval-anchor gap `15-...md`'s own investigation left open, the same test proposed there.

## Open questions, not resolved here

- Real overlap threshold for cluster de-duplication (Step 3) — needs a first real run's data, not a guess.
- Whether the stopping rule (Step 2) needs per-connection-type tuning beyond the three already-built edge types.
- Exact persistence shape (new fact kind vs. new table) — deferred to build time per Task 1's original note.
- Review-format choice (Step 6) — not yet decided.
- Real cost estimate for Step 4's LLM-drafting calls at full scale (the historic catalogue lists roughly 40-50 real candidate workflows across all domains, most still `DEFER`) — get a real per-cluster cost from the pilot before committing to a full run, same discipline as every other paid step in this project.

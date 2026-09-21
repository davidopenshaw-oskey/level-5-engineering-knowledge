# Build plan: explicit PM-directed scope + skill.v3/template.v2 staleness cleanup

Build-stage plan, drafted 2026-09-20, following the decide-stage design in
[16-plan-explicit-pm-directed-scope-2026-09-20.md](16-plan-explicit-pm-directed-scope-2026-09-20.md).
**Nothing in this doc has been built.** Two genuinely different-sized work items, kept as
separate phases so the small one isn't blocked behind the large one: Phase 0 is fully
specified and independently actionable; Phases 1+ sequence doc 16's larger orchestration
redesign, several of which still have real, unresolved design questions doc 16 itself left
open — flagged honestly below rather than given false precision.

Standing rules: never `git add`/`git commit` unless explicitly asked; flag any real spend
(embedding/LLM calls) explicitly before running, every time; keep investigate/decide/build
as separate modes — this doc is build-planning only, actual execution is a future session's
job unless explicitly told to proceed same-session.

## Phase 0 — `skill.v3.md`/`template.v2.md` staleness cleanup (small, fully specified, independently actionable)

Triggered by: "v1 should be an unknown factor to an LLM" — but scope is larger than the
literal word, found by checking both files directly rather than assuming the request's
literal wording was the whole problem.

**Real findings, both confirmed by reading the live files:**

1. `skill.v3.md`'s "Section-specific guidance" section (lines 64-73) references two heading
   names — **"Technical Proposal"** (line 70) and **"Constraints"** (line 72) — that no
   longer match `template.v2.md`'s real, current headings: **"Codebase Findings & Starting
   Points"** and **"Probable Constraints"** respectively. This is a real, functional
   mismatch, not just stale wording — the guidance is keyed by heading name, and the model
   will never see a heading literally called "Technical Proposal" or "Constraints" in this
   run, only the template's actual current names. Whether/how this has been silently
   degrading section-specific guidance in every real run since the template's headings
   changed is worth checking directly during Phase 0, not assumed either way.
2. Both files carry a literal `v1` self-reference the LLM has no way to interpret usefully:
   `skill.v3.md:72` ("unchanged from v1's existing low-freedom, fixed-shape treatment") and
   `template.v2.md:21` ("fixed, cited, unchanged from v1"). Neither file has ever shown the
   model what v1 was — the reference carries zero actionable information for the model
   reading it, only for a human tracking the file's own history. That history belongs in a
   version-control commit message or a roadmap doc, not in content sent to the model every
   run.
3. `template.v2.md`'s own comments (lines 9, 13, 17) say "see skill.md" — not "see
   skill.v3.md," the actual live persona file. Real cross-reference staleness, found while
   checking the file for the above, not part of the original ask but adjacent enough to fix
   in the same pass rather than leave freshly-noticed and unfixed.

**Real fix, phase steps:**

1. In `skill.v3.md` line 70's heading label and line 72's heading label(s): update to the
   real, current `template.v2.md` heading text — "Codebase Findings & Starting Points" and
   "Probable Constraints" — not the stale "Technical Proposal"/"Constraints" names. Confirm
   against `template.v2.md` at the time of the edit, not from this doc's own snapshot of it,
   in case it's drifted again since this was written.
2. Rewrite line 72's `v1` clause to state the real, current fact plainly — e.g. "low-
   freedom, fixed-shape treatment; no additional guidance needed here" — dropping the "v1"
   comparison entirely rather than rephrasing it to reference "v1" more subtly. The model
   needs to know *what* the current freedom level is, never that it differs or doesn't
   differ from something it's never seen.
3. Same treatment for `template.v2.md` line 21's `v1` clause and lines 9/13/17's `skill.md`
   references (correct to `skill.v3.md`).
4. Re-read both full files after editing to confirm no other stale cross-reference or
   version artifact survived — don't assume the specific lines found above are the only
   ones; this project's own "verify, don't assume" discipline applies to its own persona
   files too.
5. No re-run required to validate this phase — it's a text-accuracy fix, not a behavior
   change requiring a real test run to confirm. If a real run happens later for Phase 1+
   testing anyway, note whether the corrected heading names visibly changed section-specific
   guidance application as a real, incidental data point — not a reason to schedule a
   dedicated paid run just for this phase.

## Phase 1 — Template schema: structured "In-scope platforms"

Per doc 16 §1/§4's open item ("exact parsing logic... not fully specified"). Real design
decision needed before this can be built, not resolved in doc 16 or here:

- Exact machine-parseable format for a platform entry (business name / repo mapping /
  optional repo-narrowing / initial-query directive) — markdown list convention, a fenced
  block, something else. Needs to be reliably parseable by code (`capability-fanout-prd-
  agent.ts`'s new orchestration logic), not just readable by a human, per doc 16 §4.
- Update `template.v2.md` (or a new template version) and the worked example in
  `mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md` to the finalized format
  once decided.

## Phase 2 — Orchestration: `routeCapabilities()`/`main()` reads explicit scope

Per doc 16 §4, steps 1-5. Real, scoped code change to `capability-fanout-prd-agent.ts`:

1. Parse the structured in-scope-platforms list (Phase 1's format) from the business request
   input.
2. Resolve each platform to real `(repo, module)` pairs via `SELECT DISTINCT repo, module
   FROM facts WHERE repo IN (...)` (free, read-only, no embedding) — scoped by any
   repo-narrowing the PM specified.
3. Spawn one capability per real `(repo, module)` pair (not per platform bullet) — per doc
   16's explicit reasoning (doc 11's evidence that narrowly-scoped capabilities finish more
   reliably than broadly-scoped ones).
4. Thread each platform's directive text into `renderCapabilityContract()` for its spawned
   capability/capabilities.
5. Real, open question carried from doc 16, not resolved here: does this fully replace
   `routeCapabilities()`'s vector-based path, or do both paths need to coexist (explicit
   list when present, automated routing as fallback when a request has no structured
   platforms list at all, e.g. for backward compatibility with `1a-ownernonresident.txt`-
   style unstructured requests)? Needs a real decision before Phase 2 is built, not an
   assumption baked in silently.

## Phase 3 — `skill.v3.md`: the one new generic rule

Per doc 16 §2. Add the directive-prioritization rule described there. Small, additive,
generic (not feature-specific) — the lowest-risk part of doc 16's design, could plausibly be
built and tested independently of Phases 1-2 and 4 if sequencing makes that useful.

## Phase 4 — Advisory routing safety net

Per doc 16 §5. Real, open question not resolved in doc 16 or here: which existing routing
mechanism (flat, per doc 09-11, or hierarchical/grouped, per doc 12-15) becomes the advisory
check, and how its findings actually surface in the final document (reuse the "Evidence
Used" reserved-section pattern, or a new section) — needs a real decision before this phase
is built.

## Phase 5 — The human checkpoint (§6) — real scope decision, not assumed

Per doc 16 §6's own open item: is this a process/workflow step entirely outside this tool
(a dev reviews the PM's platform list in whatever document tool produced it, before ever
invoking the script), or something the tool itself should support directly (e.g. a
`--dry-run`-style mode that renders the parsed platform list back for confirmation before
any real spend happens)? Real, unresolved UX/scope decision — flagged, not decided, here.

## Real spend across this whole build plan

Phase 0: zero spend (text edits only). Phases 1-3: zero spend to build (code/template
changes only) — real spend only enters at whatever real test run eventually validates them,
which must be flagged explicitly and separately when that point is reached, per this
project's standing cost-discipline rule. Phase 4/5: spend implications depend on decisions
not yet made (which routing mechanism, whether the checkpoint needs its own real run to
validate) — not estimable yet.

## Sequencing note

Phase 0 has no dependency on anything else in this doc and is fully specified — it can be
built first, independently, regardless of how/when the rest of this plan proceeds. Phases
1-5 have real, stated open decisions that need resolving (not just building against this
doc's own assumptions) before each can be built as confidently as Phase 0 can.

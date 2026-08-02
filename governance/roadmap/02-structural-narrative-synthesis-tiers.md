# Implementation Plan 02 — Structural/Narrative Synthesis Tiers

**Status:** Not started
**Created:** 2026-08-02

*Third plan under the numbered-plan-file convention (see `00-capability-based-module-synthesis.md`, `01-cross-module-dependency-graph.md`). Work through one item at a time; check items off as `[x]` only once actually done and verified. See `governance/adrs/adr-004.md` for the decision this implements.*

---

## Why this exists

Discussing how P2's reduce step should scale as the module/repo landscape grows (see `tasks.md` and today's Q&A), the obvious next step — split a large reduce input into smaller bundles, reduce each, then reduce the summaries — was found to risk recreating the exact cross-module blindness `01-cross-module-dependency-graph.md` already fixed once, just at the bundle boundary instead of the module boundary. Two worked examples (Firestore ownership disambiguation, permission-string semantic checks) proved the fix isn't a clean binary "structural vs. narrative" split — it's three tiers, and Tier 2 (deterministic-cross-reference) is currently unbuilt, handled ad hoc by asking the LLM to eyeball checks it shouldn't need to perform itself.

This plan classifies what P2 actually consumes into the three tiers *before* designing any batching/recursive-reduce mechanism — batching design depends on knowing what's exempt from it, not the other way around.

---

## Task List

### Stage 1 — Audit and classify
- [ ] List every distinct kind of information currently flowing into any P2 call (module-level flow and capability-based flow): raw/compact-table facts, the cross-module dependency graph, grounding docs (Architecture.md, Personas doc, RBAC, Firestore schema/rules/indexes), capability outputs (in the reduce step), contract docs.
- [ ] Classify each into Tier 1 (structural, already deterministic — e.g. cross-module graph), Tier 2 (deterministic-cross-reference, not yet built as a real artifact — e.g. RBAC existence/semantic split, Firestore ownership), or Tier 3 (narrative/interpretive, safe to batch).
- [ ] **Q&A checkpoint**: review the classification table with the user before locking it in — this is exactly the kind of judgment call (is X structural or narrative) that surfaced ambiguous cases twice already today.

### Stage 2 — Resolve open boundary cases
- [ ] Firestore ownership: define the deterministic part (which modules/capabilities touch a given path — already extractable from `firestore_path_touched` facts) versus the interpretive part (which one is "the" owner vs. a fan-out consumer). Decide whether "owner" disambiguation can be made deterministic (e.g. first-writer-by-convention, or a naming heuristic) or must stay narrative.
- [ ] Permission strings: confirm the split already found — existence-in-RBAC is Tier 2 (deterministic), semantic-appropriateness-of-use is Tier 3 (narrative) — and check for any other fact type with the same mixed shape.
- [ ] Note any additional mixed cases surfaced during Stage 1's audit that weren't anticipated going in.

### Stage 3 — Build missing Tier 2 artifacts
- [ ] RBAC leaf-role flattening (`tasks.md` item 13): deterministic `{permissionString: englishDescription}` lookup, dropping French and composite-role nesting, replacing the raw nested `rbac-roles.json` paste in P2 prompts.
- [ ] Firestore path multi-writer index (if Stage 2 concludes ownership-detection can be partially deterministic): which modules/capabilities touch each path, computed once from existing `firestore_path_touched` facts, handed to synthesis as a Tier 1/2 fact rather than left for the LLM to reconstruct per-call.
- [ ] Any other Tier 2 artifact surfaced in Stage 1/2.

### Stage 4 — Design batching mechanics for Tier 3 only
- [ ] Now that Tier 1/2 content is guaranteed complete regardless of bundling, design the recursive/hierarchical reduce structure for Tier 3 narrative content specifically (bounded branching factor, budget-based grouping — see the earlier "smaller prompts, then collate" discussion).
- [ ] Decide how Tier 1/2 artifacts get attached to each level of a multi-level reduce tree — likely: identically, at every level, same as the cross-module graph is already given whole to the single reduce call today.

### Stage 5 — Verify against a real run
- [ ] `building` may not be large enough to actually exercise multi-bundle reduce (11 capabilities fit in one call today) — decide whether verification needs a synthetic/stress case (a mock module with an artificially large capability count) or whether this waits for a genuinely large module/repo to surface naturally.
- [ ] Confirm Tier 1/2 facts (dependency graph, RBAC cross-check) remain Confirmed/correct in the final output regardless of which bundle a given capability landed in.

---

## Explicitly not deciding yet
- Whether Tier 2/3 classification generalizes the same way at the cross-repo layer (Phase 3) — same principle, different scope, separate plan once Phase 3 is designed.
- Retrieval/queryable-store grounding (the deeper, root-cause fix discussed alongside this) — a separate, bigger architectural conversation, not folded into this plan.
- Live-DB capture of RBAC/Firestore schema (`tasks.md` items 12/13b) — explicitly deferred, P1-side scope, not part of this P2-focused plan.

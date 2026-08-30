# V1-B Scope: Module Reduce Contract (`01-module-synthesis-reduce.md`)

**Status:** Scope document, not the rewritten contract. Grounded in real code checks performed during the multi-round review. Scoped to Firebase only, tested independently from V1-A per the agreed single-variable-change discipline — do not combine and evaluate only the final assembled profile, or attribution of any improvement is lost.

**Hypothesis under test:** Historical contract inheritance creates genuine Scope Ambiguity at the module-reduce stage (`01c`), and — independently — real deterministic aggregations already exist elsewhere in the pipeline but are not wired into this call, forcing the LLM to reconstruct from prose what the pipeline already knows. Both are confirmed findings, not speculation — see below.

**Explicitly NOT in scope for V1-B:** any new Phase 1 extraction or aggregation algorithm; the destructive-operations-without-permission-evidence signal or any other candidate risk signal confirmed not to exist today (§3); cross-repo generalization; changes to `00-capability-synthesis.md` (that's V1-A); touching Sections 1, 2, 10, or 12 of the Reduce contract's own output (not implicated by any audit so far).

---

## 1. Core fix: make the Reduce contract self-contained

### The confirmed problem

`01-module-synthesis-reduce.md` (the newer, purpose-written contract for this call) explicitly instructs the model: *"`module-engineering-profile-task-instructions.md` still governs the output schema, section definitions, confidence tagging, and core rules for the sections you *do* write — read it in full."*

`module-engineering-profile-task-instructions.md` was originally written for a different, manual, single-shot workflow — its own header states: *"Use this as Custom Instructions in your Claude Project... do not paste their content here."* It describes Sections 6, 9, and 13 as if the reader is responsible for writing the *whole* section from scratch (e.g., for Section 9: *"Explicitly cross-check every permission string against the supplied RBAC roles document"*), with no acknowledgment that most of this work already happens at capability synthesis and is assembled separately in the current two-stage architecture.

The Reduce contract's own text, for the same three sections, is explicit that the job is narrower — a judgment layer added on top, not a restatement (*"you're adding the judgment layer on top of them, not restating them"*). The only precedence rule that exists anywhere in either document is scoped narrowly to which file gets produced (Module Profile vs. API Reference) — nothing tells the model which document's *scope description* governs when the two disagree about how much of a section it owns.

**Governing principle for the rewrite** (validated through this review, not assumed): *never repeat analysis assigned to an earlier synthesis stage* — stronger than "don't repeat the earlier stage's prose." If capability synthesis already performed a permission cross-check, Reduce should not re-perform that analysis merely because an inherited instruction still says to.

### The change

Rewrite `01-module-synthesis-reduce.md` as fully self-contained. Remove the "read the older document in full" dependency entirely. Copy in, deliberately and explicitly (not by reference), only the genuinely shared and non-conflicting principles:

- Evidence priority (direct engineering evidence > architectural grounding docs > personas/authority docs)
- Never invent
- Confidence tagging semantics (Confirmed / Inferred / Unknown)
- Preserve specific engineering terminology exactly
- Preserve confidence/scope metadata already present on facts rather than flattening it
- Absence of evidence is not evidence of absence
- Deterministic engineering evidence outranks architectural grounding documents

Do not inherit the older document's per-section "write the complete section" framing for Sections 6, 9, or 13 — replace it with Reduce-specific framing reflecting the actual, narrower scope (see §2 below for the specific replacement text per section).

### A related, smaller finding: "Open Question" scope drift

The older document's generic rule — *"if tempted to fill a gap to make the narrative complete, record it as an open question"* — made sense when one call owned the entire document. In Reduce, Section 13 is restricted to cross-cutting findings visible only by comparing capabilities; a model encountering ordinary uncertainty could still turn it into an Open Question under the old generic rule, defeating that restriction. The rewritten contract should define explicitly what qualifies as a cross-cutting open question versus a capability-local one that must not be regenerated at Reduce.

---

## 2. Section 6 (Data Ownership conclusion) — tighten the judgment framing, do not remove it

### What's confirmed against the real implementation

Read `_shared/ownership-hints.ts` directly. The deterministic `OwnershipHint` signal:

```typescript
export interface OwnershipHint {
  className: string;
  definingSubmodule: string;
  calledByOtherSubmodulesCount: number;
  callingSubmodules: string[];
  calledByOtherModulesCount: number;
  callingModules: string[];
}
```

This is a call-graph centrality/mediation signal, not a Firestore ownership determination. Confirmed it does **not** establish: read/write/delete semantics, a per-path comparison across multiple candidate owners touching the same path, direct-vs-mediated access as a labeled field, or any ambiguity threshold. It is correctly named a *hint*, and should not be promoted into a fact.

This makes Section 6 structurally different from Section 3: the deterministic layer exists but is genuinely partial, and the remaining judgment (which capability is the real owner, and how confident to be) is not reducible further with today's fact model.

### The change

Do not attempt to make this section deterministic. Tighten what the LLM is told about what it's being given versus what it must still decide. Replace vague framing ("determine data ownership") with an explicit statement of the boundary, along these lines:

> The supplied capability extracts establish which capabilities touch a given persistence path. The supplied ownership hints establish call-graph centrality for classes that mediate access to it. Neither of these establishes architectural ownership. Your task is to compare the supplied signals and make only the ownership judgment that cannot be established deterministically from them.

---

## 3. Section 9 (Permissions & Security cross-cutting) — wire an existing deterministic artifact that is currently unused here

### What's confirmed against the real implementation

`04-build-resolved-graph.ts` already computes a repo-wide `rbacRequirements` catalog: every permission string checked anywhere in the repo, its confidence tier (`confirmed`/`candidate`), total check count, and full per-check attribution (module/file/line/context expression). This is not hypothetical — it's real, already-built, and already consumed by `02-generate-repo-report.ts` for the repo-level RBAC Requirements Catalog section.

Checked `01c-generate-assembly-first-profile.ts` directly: **the module-reduce call never receives this catalog.** It only receives each capability's raw Section 7 (Permissions & Security) prose extract, concatenated. The reduce contract's own "build a mental enforcement tally" instruction currently means the LLM reconstructs the entire cross-capability comparison from reading N separate paragraphs, with zero deterministic pre-aggregation reaching this call at all.

### The change

**This requires a small code change, not only a contract-text rewrite.** In `01c-generate-assembly-first-profile.ts`, filter the already-computed `rbacRequirements` catalog to the current module's own capabilities (the same filtering pattern already used for the repo-report stage, applied one level down) and pass it into the reduce prompt alongside — not instead of — the existing per-capability prose extracts.

Once wired, remove the phrase "mental enforcement tally" from the contract text — the model should reason from an explicit, supplied table, not be instructed to reconstruct one internally. The genuinely irreducible judgment that remains: whether an observed enforcement asymmetry (some capabilities check a permission, others performing comparably sensitive operations don't) is architecturally significant enough to report — this is not deterministically decidable and correctly stays LLM judgment.

---

## 4. Section 13 (Risks & Open Questions cross-cutting) — wire the one applicable existing artifact, do not build new signals

### What's confirmed against the real implementation

Checked every candidate deterministic risk signal discussed during this review against `04-build-resolved-graph.ts` and `01c-generate-assembly-first-profile.ts`:

| Candidate signal | Status |
|---|---|
| Unresolved call edges | **Exists deterministically** (`unresolvedCallEdges`, repo-wide) but **not passed into `01c` at all** — same wiring gap pattern as Section 9 |
| Conflicting ownership indicators | Covered by Section 6's existing (partial) ownership hints |
| Permission asymmetry | Covered by Section 9's fix above, once wired |
| Destructive operations without permission evidence | **Not computed anywhere** — no aggregation exists in `04-build-resolved-graph.ts` |
| Shared persistence-path risk, contradictory capability conclusions, external-boundary counts | No ready-built aggregation exists today beyond Section 6's partial signal |

### The change

Add the module-filtered `unresolvedCallEdges` list as one more deterministic input to the reduce prompt — free, since the data already exists repo-wide and needs only the same module-filtering treatment as Section 9's fix. Do **not** attempt to build the destructive-operations signal or any of the other unaggregated candidates for V1 — each would require genuinely new Phase 1 or resolved-graph aggregation work, correctly out of scope here. Record them as possible future enhancements, not pulled into this rewrite.

Section 13 remains predominantly Synthetic/Judgment after this change, as expected — the fix adds one more real, free input; it does not attempt to make cross-cutting risk-finding deterministic.

---

## 5. Summary of code changes required (beyond contract text)

V1-B is not a pure prompt-text rewrite. Two small, additive changes are needed in `01c-generate-assembly-first-profile.ts`:

1. Compute and pass a module-filtered `rbacRequirements` table into the reduce prompt (Section 9 fix).
2. Compute and pass a module-filtered `unresolvedCallEdges` list into the reduce prompt (Section 13 fix).

Both reuse existing, already-validated deterministic computations — no new algorithms, no new Phase 1 extraction.

---

## 6. Metrics

Same principle as V1-A: citation count is a secondary diagnostic, not the primary measure.

- **Section 6:** track whether the stated ownership conclusion (which capability is named as likely owner) is consistent across runs for paths where the deterministic signals are themselves unambiguous — a change in conclusion despite unchanged deterministic input would indicate the judgment framing still isn't tight enough.
- **Section 9:** track semantic consistency of which cross-cutting asymmetries get named, now that the underlying comparison data is supplied rather than reconstructed. Expect this to improve materially, since the reconstruction step (the actual source of potential inconsistency) is removed.
- **Section 13:** track the same evidence-engagement overlap metric used for V1-A's Section 2 (does the same underlying evidence get engaged with across runs, regardless of wording) — this section remains genuinely synthetic and shouldn't be expected to converge to zero variance.

---

## 7. Experimental design (shared with V1-A)

Test via the four-arm factorial matrix already agreed:

| Arm | Capability contract | Reduce contract |
|---|---|---|
| Current | old | old |
| A | new (V1-A) | old |
| B | old | new (V1-B) |
| AB | new | new |

Run against a representative subset of Firebase modules spanning small/medium/large (e.g. `tasks`, `apps`, `organization`), not the full 12-module repo, for cost control. Run each arm's chosen modules twice (self-consistency, not comparison against a different-temperature or different-day baseline) to isolate whether the contract change itself reduces variance. Do not evaluate only the final assembled profile — measure each stage's own output separately, so an improvement (or lack of one) can be attributed to the specific contract that produced it.

---

## 8. What this scope does NOT require

- No refactor of the deliberate per-repo pipeline duplication — this is Firebase-only, and stays that way for this experiment regardless of outcome.
- No change to `02-generate-repo-report.ts` or the repo-level synthesis stage.
- No template-doc rewrite yet — `module-engineering-profile-task-template.md`'s likely staleness (it still describes an earlier, full-evidence-graph invocation model) is a separate, smaller follow-up, not blocking V1-B.
- No attempt to make Section 13 fully deterministic — only the one confirmed-free addition (`unresolvedCallEdges`) is in scope.

# Phase 2 Contract Variance — Consolidated Findings for Claude Review

## Purpose

This document consolidates the latest findings from the Phase 2 synthesis variance investigation, including the new evidence that meaningful variance originates at **both** capability synthesis (`01a`) and module reduce (`01c`).

It is intended as a handoff for Claude to digest before the next contract rewrite discussion.

This is **not** a finished design and does not ask for an immediate rewrite. The aim is to preserve the current evidence, separate demonstrated findings from hypotheses, and define the next controlled experiments.

---

## 1. Updated Diagnosis

The earlier investigation focused heavily on the Module Reduce stage and its historically layered contracts. That remains a real issue, but new section-level measurements demonstrate that it cannot explain all observed output variance.

There are now two independently evidenced problem areas:

1. **Capability synthesis (`01a`)** — one self-contained contract, so multi-document scope conflict cannot explain its variance. The likely mechanisms are **Traversal Ambiguity and/or Qualification Ambiguity within the contract itself**.
2. **Module Reduce (`01c`)** — historically layered instructions create genuine **Scope Ambiguity**, with possible additional Traversal/Qualification ambiguity after that is removed.

The useful conceptual sequence remains:

```text
SCOPE
What am I responsible for?
        ↓
TRAVERSAL
What must I examine?
        ↓
QUALIFICATION
What qualifies for output?
        ↓
RENDERING
How must I express it?
```

The important update is that different stages appear to have different dominant problems.

---

## 2. New Capability-Level Measurement

A direct section-level comparison was performed for the `apps` module using the same two same-facts runs already used in the variance investigation.

| Final profile section | Source | Run 1 | Run 2 | Delta |
|---|---|---:|---:|---:|
| 3. Primary Responsibilities | Assembled verbatim from capability Section 2 | 25 | 19 | -24% |
| 4. Public Interfaces | Assembled verbatim from capability Section 3 | 18 | 10 | **-44%** |
| 6. Firestore & Data Ownership | Capability Section 5 + Reduce judgment layer | 18 | 5 | **-72%** |
| 8/11. External Hooks | Assembled verbatim from capability Section 8 | 9 | 10 | +11% |
| 13. Risks & Open Questions | Reduce-authored + assembled capability content | 0 | 0 | n/a for fact-ID citation count |

Two corrections follow from this measurement.

### Correction 1 — retire the earlier “6/9/13 highest variance” framing

Section 13 has zero measurable fact-ID citation variance in this specific document because its findings use confidence tags rather than the same fact-ID citation pattern.

Unless section-level variance is measured more broadly, the earlier claim that Sections 6/9/13 collectively carry the highest variance should not be treated as established.

### Correction 2 — variance definitely originates upstream of Reduce

Final Sections 3 and 4 are assembled **verbatim** from capability synthesis output. Reduce never rewrites them.

Their -24% and -44% citation-count swings therefore prove that meaningful variance already exists at capability synthesis.

A Reduce-contract rewrite cannot fix that variance.

---

## 3. Capability Contract: Likely Traversal Ambiguity

The sole capability contract is `00-capability-synthesis.md`.

Because only this one contract is loaded for the `01a` call, there is no multi-document scope conflict comparable to Reduce.

A useful contrast appears inside the contract itself.

### Section 2 — Primary Responsibilities

Current instruction:

> Every distinct responsibility/feature this capability provides, each with its own confidence tag.

This demands exhaustiveness but does not define the evidence traversal used to discover the complete candidate set of responsibilities.

### Section 3 — Public Interfaces

Current instruction:

> Controllers, exported services, and other public entry points this capability exposes...

Again, this describes the desired output but does not define a bounded evidence surface or an exhaustive discovery procedure. The phrase “other public entry points” leaves classification to the model.

### Section 8 — External Hooks

Current instruction explicitly enumerates candidate fact types:

```text
external_hook
pubsub_topic
pubsub_publish_call
http_or_client_path
environment_variable
storage_path
```

This gives the model a bounded evidence surface to traverse.

In the measured comparison, Section 8 was substantially more stable (+11%) than Sections 2 (-24%) and 3 (-44%).

This is **one data point, not proof of causation**, but it is consistent with the hypothesis that bounded evidence traversal improves coverage stability.

---

## 4. Public Interfaces May Need Less LLM Discovery

Section 3 appears particularly suitable for stronger deterministic support.

Before changing the contract, enumerate exactly which Phase 1 fact types establish:

- controllers;
- exported services;
- exported classes;
- exported functions;
- externally callable entry points;
- any other legitimately public component.

If Phase 1 already deterministically identifies these, the LLM should not be responsible for discovering the candidate inventory from an open-ended evidence pack.

A better conceptual flow would be:

```text
Phase 1 deterministic facts
        ↓
complete public-interface candidate set
        ↓
LLM classification / description
```

rather than:

```text
Phase 1 deterministic facts
        ↓
LLM searches for public interfaces
        ↓
LLM decides which candidates matter
        ↓
LLM writes section
```

This is not necessarily an architectural redesign. It is a clearer boundary between deterministic enumeration and synthesis.

For the first contract experiment, however, the candidate set can still be defined procedurally in the contract before deciding whether to move it into deterministic preprocessing.

---

## 5. Proposed Direction for Capability Section 3

The rewrite should provide a **discovery procedure**, not a fixed expected number of interfaces.

Conceptually:

```text
Inspect every evidence type capable of establishing a public component.

Build the complete candidate set before writing.

For each candidate:
- preserve the exact engineering name;
- identify the evidence establishing it;
- classify it as controller, exported service, exported function,
  or another explicitly evidenced public entry point;
- include it unless evidence establishes that it is internal.

Do not infer public visibility from naming, architectural importance,
or frequency of use.

Do not list individual endpoints here; endpoint contracts belong to
Section 4.
```

The exact evidence types must be taken from the actual Phase 1 schema rather than guessed in the contract.

The key principle is exhaustive traversal of the candidate evidence surface, not a predetermined output count.

---

## 6. Primary Responsibilities Are Inherently More Synthetic

Section 2 cannot be made deterministic in quite the same way.

A service method is not necessarily a responsibility:

- many methods may implement one responsibility;
- one service may implement several responsibilities;
- API, persistence, security and external-hook evidence may all describe different aspects of the same responsibility.

The better approach is therefore a **bounded candidate-source traversal**.

Potential candidate-source groups include:

- public interfaces;
- API contracts;
- Firestore triggers;
- service/class methods;
- persistence operations;
- permission-controlled operations;
- external hooks;
- outbound coupling.

These are candidate sources, not a required output taxonomy.

The model should inspect every applicable candidate-source group, then group related evidence into distinct responsibilities.

A responsibility should:

- describe evidenced behaviour;
- have direct evidence support;
- remain specific enough that materially different behaviours are not collapsed into a generic label;
- not be duplicated merely because several fact types evidence the same behaviour.

Before completing the section, every candidate-source group containing behavioural evidence should either:

1. contribute to a reported responsibility; or
2. be intentionally absorbed into another responsibility because it evidences the same behaviour.

Again, the objective is not “produce N responsibilities.”

It is “systematically traverse every evidence surface from which a responsibility could arise.”

---

## 7. Reduce Contract Diagnosis Still Stands

The capability-stage finding does **not** invalidate the earlier Reduce diagnosis.

The current Reduce stage loads a newer narrow contract plus an older broad Module Engineering Profile contract originally written for a different workflow.

The newer contract says, in effect:

> Do not redo capability analysis. Produce module-level connective tissue and cross-capability judgment only.

The older inherited contract still assigns broad responsibilities for Sections 6, 9 and 13 and describes complete module-level analysis.

The model is therefore required to reconcile its effective analytical scope itself.

This remains genuine contract debt and a plausible source of Stage 2 variance.

The recommended Reduce principle remains:

> **Never repeat analysis assigned to an earlier synthesis stage.**

This is stronger than merely telling Reduce not to repeat capability prose.

---

## 8. Recommended Reduce Rewrite Direction

`01-module-reduce.md` should become self-contained.

It should not inherit the old broad Module Engineering Profile instructions at runtime.

Useful common principles should be copied deliberately into Reduce, including:

- evidence priority;
- never invent;
- confidence semantics;
- preservation of engineering terminology;
- preservation of evidence confidence/scope metadata;
- missing evidence is not evidence of absence;
- deterministic implementation evidence outranks grounding documentation.

Capability-local analytical obligations should **not** be copied into Reduce.

Examples:

### RBAC

Capability synthesis may exhaustively cross-check permission strings against RBAC.

Reduce should instead compare already-derived capability security conclusions for module-level asymmetries or conflicts.

### Data ownership

Capability synthesis identifies what each capability touches and what can be concluded locally.

Reduce compares those ownership extracts plus deterministic ownership hints to identify shared, conflicting or ambiguous ownership visible only across capabilities.

---

## 9. Two Independent V1 Experiments

There are now two separate hypotheses and they should be tested independently.

### V1-A — Capability Contract Traversal

**Hypothesis:**

> Open-ended evidence traversal in `00-capability-synthesis.md`, especially Sections 2 and 3, causes inconsistent capability-level coverage.

Change only the capability contract.

Primary targets:

- bounded discovery procedure for Primary Responsibilities;
- bounded evidence traversal for Public Interfaces;
- preserve the existing stage scope and output architecture.

### V1-B — Module Reduce Scope Consolidation

**Hypothesis:**

> Historical contract inheritance causes inconsistent analytical scope at Reduce.

Change only the Reduce contract.

Primary targets:

- self-contained Reduce instructions;
- explicit analytical authority per section;
- no inherited broad module-analysis responsibilities;
- no re-performance of capability-level analysis.

---

## 10. Experimental Matrix

The two rewrites can be developed in parallel but should remain analytically separable.

If practical, test four states:

```text
CURRENT
Capability old
Reduce old

A
Capability new
Reduce old

B
Capability old
Reduce new

AB
Capability new
Reduce new
```

Interpretation:

```text
A improves capability stability
→ capability traversal contract mattered.

B improves Reduce stability
→ Reduce scope conflict mattered.

A and B improve independently
→ both diagnoses were contributors.

Only AB improves materially
→ an interaction exists between stages/contracts.
```

Do not immediately combine both rewrites and evaluate only the final assembled profile, because that would lose attribution of the improvement.

---

## 11. Citation Count Should Be Demoted as the Primary Metric

Citation count has been useful for discovering variance, but it is not a sufficient coverage metric.

For example:

```text
Run A
FooController  3 citations
BarService     3 citations
Total          6

Run B
FooController  6 citations
Total          6
```

Citation totals are identical, but Run B completely omitted `BarService`.

Therefore capability synthesis should be evaluated using **semantic inventory stability** in addition to citation counts.

---

## 12. Recommended Metrics for Public Interfaces

Section 3 is potentially measurable against deterministic evidence.

Track:

- evidenced candidate interfaces;
- reported interfaces;
- missed evidenced interfaces;
- unexpected reported interfaces;
- overlap between independent runs;
- Jaccard similarity of named interface sets;
- eventually, recall against the deterministic candidate inventory.

Example comparison:

| Interface | Run A | Run B |
|---|---|---|
| `OSKFooController` | ✓ | ✓ |
| `OSKFooService` | ✓ | ✓ |
| `OSKBarService` | ✓ | — |
| `OSKBazController` | — | ✓ |

If Phase 1 can provide the complete public-interface candidate inventory, actual recall becomes measurable:

```text
reported evidenced interfaces
──────────────────────────────
total evidenced public interfaces
```

This is much stronger than citation count alone.

---

## 13. Recommended Metrics for Primary Responsibilities

Responsibilities are synthesized concepts, so a deterministic gold inventory may not exist.

Initially measure:

- number of named responsibilities;
- semantic equivalence of responsibilities across runs;
- evidence facts contributing to each responsibility;
- candidate evidence categories represented;
- responsibilities appearing in only one run;
- responsibilities that collapse or split differently between runs.

A manually validated responsibility benchmark for one or two representative capabilities could later provide a stronger recall measure.

Citation count should remain a secondary diagnostic, not the headline metric.

---

## 14. What Not to Change Yet

Do not yet introduce several additional mechanisms simultaneously, such as:

- multi-run consensus;
- majority voting;
- few-shot calibration;
- elaborate risk taxonomies;
- broad mandatory inspection matrices across every section;
- model changes;
- major Phase 2 architecture changes.

The current evidence has produced two relatively clean contract hypotheses.

Test those first.

---

## 15. Updated Experimental Sequence

The previous sequence focused only on Reduce. It should now be expanded.

```text
Capability V1-A:
Bound traversal for Sections 2/3
        ↓
Measure capability output directly
        ↓
Determine whether inventory stability improves


Reduce V1-B:
Remove historical scope inheritance
        ↓
Measure Reduce output directly
        ↓
Determine whether cross-capability stability improves


Then:
Combine A + B
        ↓
Measure final assembled module profile
        ↓
Identify residual variance
```

Only after this should we decide whether stronger qualification rules, mandatory traversal matrices, or other mechanisms are needed.

---

## 16. Current Working Conclusion

The variance problem can no longer be framed primarily as a Module Reduce contract issue.

The evidence now shows meaningful variance **before Reduce**, inside capability synthesis, even though capability synthesis uses a single self-contained contract.

That strongly suggests at least two distinct contract-quality problems:

### Capability synthesis

Likely issue:

> **Traversal and/or qualification ambiguity.**

The contract often describes what a complete output should contain without defining how the model should exhaustively discover the candidate evidence that belongs there.

### Module Reduce

Likely issue:

> **Scope ambiguity caused by historical contract inheritance**, potentially followed by traversal/qualification ambiguity once scope is cleaned up.

Section 8 of the capability contract provides a useful internal clue: its explicit bounded fact-type inspection surface corresponds with substantially lower variance in the current comparison than the open-ended Sections 2 and 3.

This is not yet proof that bounded traversal is the cause, but it provides a concrete, testable contract hypothesis.

The recommended next move is therefore:

> **Rewrite both contracts now as two independently testable V1 changes: bounded evidence traversal at capability synthesis, and self-contained analytical scope at Module Reduce.**

Keep the experiments separate long enough to identify which change improves which stage.

---

## 17. Questions for Claude

Please challenge these findings rather than treating them as accepted design.

In particular:

1. Does the Section 8 versus Sections 2/3 contrast genuinely support a Traversal Ambiguity hypothesis, or is there a simpler explanation for the measured difference?
2. Is the proposed candidate-source traversal for Primary Responsibilities sufficiently general, or does it risk forcing responsibilities to mirror Phase 1 fact taxonomy?
3. Should Public Interfaces remain an LLM discovery responsibility at all if Phase 1 can deterministically enumerate the candidate set?
4. Is the A/B/AB experimental structure sufficient to distinguish capability-contract effects from Reduce-contract effects?
5. What metrics would you use instead of, or alongside, citation counts to measure repeatability without confusing wording variation with knowledge-coverage variation?
6. Are there other clauses inside `00-capability-synthesis.md` that create Qualification Ambiguity even after traversal is bounded?
7. Is there any reason to combine the two contract rewrites before independently testing them?

Do not rewrite the contracts yet unless explicitly asked. The immediate objective is to challenge the diagnosis and experimental design before the clean rewrite.

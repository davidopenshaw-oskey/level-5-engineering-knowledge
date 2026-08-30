# Phase 2 Synthesis Contract Review — LLM Output Variance

## Purpose

We are reviewing the Phase 2 synthesis contracts of the Oskey engineering knowledge pipeline.

This is **not an architecture redesign exercise**.

The immediate objective is to determine whether the observed variability in LLM-generated engineering profiles is caused, or materially amplified, by weaknesses in the synthesis contracts — particularly ambiguity around reasoning traversal, coverage, selection, and completeness.

We are prepared to rewrite the contracts and templates cleanly rather than continue adding incremental patches to documents that have evolved during development.

---

# Context

Phase 1 extracts deterministic engineering facts from source code using AST analysis.

Phase 2 uses an LLM to synthesize those deterministic facts into engineering knowledge documents.

Repeated controlled tests have demonstrated an important behaviour:

* the same facts;
* the same contract;
* the same model;
* the same configuration;

can produce meaningfully different Phase 2 documents across independent runs.

The variance is not primarily wording.

Different runs can surface different legitimate architectural observations or risks.

Importantly:

* fabricated citations have not been observed;
* citations that are produced resolve to real evidence;
* structural output compliance is generally good;
* the problem appears primarily to concern **selection, coverage and interpretation**.

For example, one run may identify a legitimate risk such as unbounded log growth while another run on identical evidence does not mention it, but instead identifies other legitimate risks such as aggressive token pruning or absence of rate limiting.

Temperature reduction to `0` has not solved the problem.

This leads to the working hypothesis:

> The existing contracts constrain factual validity and grounding strongly, but may insufficiently constrain the reasoning traversal used to discover what should be reported.

Put differently:

> The contract defines what the model is allowed to say much better than it defines what the model must examine before declaring the synthesis complete.

---

# Documents Under Review

Review these documents together rather than independently:

1. `module-engineering-profile-task-instructions.md`
2. `01-module-synthesis-reduce.md`
3. `module-engineering-profile-task-template.md`

Also use the LLM output variance report as empirical evidence of the current failure mode.

Treat the current documents as historical artefacts that evolved during development.

Do not assume that their current inheritance, separation of responsibilities, terminology, or structure should be preserved.

---

# Review Objective

Determine whether a clean rewrite of the synthesis contracts can make the existing Phase 2 process substantially more repeatable without changing the underlying Phase 2 architecture.

Specifically investigate whether the contracts leave too much discretion to the LLM in deciding:

* which evidence deserves attention;
* which reasoning dimensions to inspect;
* which comparisons to perform;
* which candidate observations to consider;
* which risks are significant enough to report;
* when evidence inspection is complete.

The objective is **not** to eliminate legitimate inference.

The objective is to constrain the reasoning process sufficiently that identical evidence is more likely to undergo the same systematic examination on independent runs.

---

# Important Distinction: Correctness vs Coverage

The existing contracts contain strong correctness rules such as:

* never invent;
* preserve engineering terminology;
* confidence-tag non-trivial claims;
* respect evidence confidence;
* explicitly identify uncertainty;
* cross-reference RBAC;
* use deterministic graphs where provided.

These appear to be working well.

However, correctness alone does not guarantee completeness.

A model can produce three completely valid findings while failing to discover three other equally valid findings.

The rewritten contract may therefore need to make this distinction explicit:

> **Correctness governs what may be stated. Coverage governs what must be examined. Both are required.**

Evaluate whether this should become a first-class contract principle.

---

# Proposal 1 — Replace Open-Ended Discovery With Mandatory Evaluation

The current contract frequently uses instructions such as:

* summarize;
* identify;
* describe;
* observe patterns;
* identify risks.

These instructions define the expected output but may not define the reasoning traversal required to produce it.

Consider replacing appropriate open-ended instructions with mandatory evaluation dimensions.

For example:

## Architectural Observations

Before producing Architectural Observations, evaluate every applicable architectural dimension:

* separation of concerns;
* intra-module coupling;
* cross-module coupling;
* orchestration;
* persistence ownership;
* denormalization / fan-out;
* asynchronous or trigger-driven behaviour;
* external-system boundaries.

For each dimension determine internally:

* `finding` — evidence supports a meaningful module-level observation;
* `no-finding` — the dimension was evaluated but no meaningful observation is supported;
* `not-evaluable` — supplied evidence is insufficient.

Only `finding` items appear in the final document.

The model must not manufacture an observation merely because a dimension exists.

### Review Question

Does this actually reduce reasoning-path variability, or merely relocate the nondeterministic decision into the `finding / no-finding` classification?

Recommend **accept, modify or reject**, with reasoning.

---

# Proposal 2 — Give Risks a Defined Inspection Surface

The current Risks & Open Questions instructions are broad.

Consider requiring the model to inspect every applicable dimension before completing cross-cutting risk analysis:

1. authorization / permission enforcement;
2. shared data ownership;
3. destructive mutation or deletion;
4. lifecycle / cleanup behaviour;
5. cross-capability consistency;
6. denormalization / fan-out;
7. external dependency failure;
8. asynchronous / trigger-driven side effects;
9. error and rejection handling;
10. resource growth / boundedness;
11. concurrency / idempotency;
12. unresolved or contradictory evidence.

A candidate should belong in the module-level Risks & Open Questions section only when:

* it is supported by supplied evidence; AND
* it requires comparison across capabilities or has module-wide consequence; AND
* it represents uncertainty, inconsistency, asymmetry, unresolved ownership, or an evidenced engineering risk.

The existence of an inspection category must never itself be interpreted as evidence that a risk exists.

Do not repeat capability-local risks already contained in assembled capability content unless comparison with another capability creates a new module-level finding.

### Review Questions

Are these dimensions general enough for engineering modules, or do they overfit the Firebase examples that exposed the problem?

Are important general dimensions missing?

Should some dimensions be deterministic checks rather than LLM reasoning responsibilities?

Recommend **accept, modify or reject**.

---

# Proposal 3 — Define "Cross-Cutting" Operationally

The existing Reduce contract relies heavily on the concept of a cross-cutting observation or risk.

Consider defining it explicitly.

A finding is cross-cutting when at least one of the following is true:

1. It arises from comparing two or more capabilities.
2. Multiple capabilities interact with the same persistence boundary, permission boundary, external system, or shared service.
3. Behaviour in one capability has evidenced consequences for another capability.
4. A deterministic module-level graph exposes a relationship that cannot be observed from any individual capability alone.

A finding is not cross-cutting merely because it is important.

### Review Question

Is this definition sufficiently precise to reduce model discretion without excluding legitimate module-level findings?

Recommend **accept, modify or reject**.

---

# Proposal 4 — Replace "Mental Tally" With Explicit Assessment

The current Reduce contract already contains an interesting precedent.

For Permissions & Security it instructs the model to:

> build a mental enforcement tally.

This suggests that an earlier contract problem has already been addressed by prescribing a reasoning procedure.

Consider generalizing that approach.

Before producing cross-cutting sections, construct a capability assessment matrix.

For every applicable capability assess dimensions such as:

| Dimension                   | Possible Status               |
| --------------------------- | ----------------------------- |
| RBAC evidence               | present / absent / unresolved |
| security-relevant rejection | present / absent              |
| persistent writes           | present / absent / unresolved |
| destructive operations      | present / absent / unresolved |
| external boundary           | present / absent              |
| async behaviour             | present / absent              |
| shared ownership            | present / absent / unresolved |

Use the resulting assessment to identify asymmetries and cross-capability patterns.

### Important Design Question

Should this matrix exist only as internal LLM working state?

Or should the synthesis stage actually return a structured machine-readable assessment that can be validated before document generation?

An invisible "mental matrix" may improve reasoning but remains impossible for the pipeline to inspect or test.

Evaluate both approaches.

Recommend **accept, modify or reject**.

---

# Proposal 5 — Make Data Ownership Evaluation Procedural

The current Reduce contract asks the model to combine Data Ownership extracts with deterministic Data Ownership Hints.

The distinction between deterministic signal and architectural judgment is good and should be preserved.

However, the actual reasoning procedure remains relatively open-ended.

Consider requiring:

For every persistence path touched by more than one capability:

1. identify every touching capability;
2. distinguish evidenced reads, writes and deletes where available;
3. inspect the deterministic Data Ownership Hint;
4. identify evidence of other capabilities calling through a candidate owner rather than directly accessing the data;
5. classify the ownership result as:

   * `clear-owner`;
   * `probable-owner`;
   * `shared`;
   * `ambiguous`;
   * `insufficient-evidence`.

Report every `shared` or `ambiguous` result.

Report `clear-owner` or `probable-owner` only where it materially improves understanding of the module.

Never convert a Data Ownership Hint alone into Confirmed ownership.

### Review Question

Would this produce materially more consistent ownership conclusions?

Is the classification appropriate?

Could any of these classifications be calculated deterministically before the LLM receives the evidence?

Recommend **accept, modify or reject**.

---

# Proposal 6 — Separate Candidate Discovery From Document Inclusion

The existing process may implicitly combine three operations:

1. discover something interesting;
2. decide whether it is important;
3. write it into the document.

That creates an opportunity for early editorial selection to suppress legitimate findings.

Consider explicitly separating these operations.

## Stage A — Candidate Discovery

Evaluate every mandatory inspection dimension.

Identify all evidence-supported candidate findings.

Optimize this stage for **recall**.

Do not rank candidates.

Do not limit their number merely for document brevity.

## Stage B — Qualification

Evaluate every candidate against the section's inclusion criteria.

Classify each candidate:

* `include`;
* `capability-local/already-covered`;
* `insufficient-evidence`;
* `duplicate`;
* `informational-not-risk`.

Only `include` candidates appear in the final document.

Do not introduce new findings during qualification.

### Review Questions

Would separating discovery from qualification materially reduce the type of variance observed in the report?

Can these logically distinct stages safely occur within one LLM call?

Or does meaningful enforcement require an observable intermediate representation?

What are the token and latency implications?

Recommend **accept, modify or reject**.

---

# Proposal 7 — Add "Coverage Before Completion" as a Core Rule

Consider adding the following principle to the main synthesis contract:

## Coverage Before Completion

For sections requiring synthesis or judgment, completion means that every mandatory inspection dimension has been evaluated against every applicable capability.

A document is not complete merely because every statement it contains is correct.

Correctness governs what may be stated.

Coverage governs what must be examined.

Both are required.

### Review Question

Would this rule have meaningful behavioural effect when combined with explicit evaluation dimensions, or is it merely explanatory prose?

Recommend **accept, modify or reject**.

---

# Contract Consolidation Review

Separate from the proposals above, examine the three current documents for accumulated scope creep and historical contradictions.

In particular examine:

## Base Contract vs Reduce Contract

The Reduce contract inherits `module-engineering-profile-task-instructions.md`, but then overrides substantial portions of it.

For example, Reduce:

* does not write Sections 3, 4, 7, 8 or 11;
* writes only part of Section 5;
* writes only part of Section 6;
* writes only part of Section 9;
* writes only cross-cutting content for Section 13;
* does not write Section 14;
* relies on deterministic assembly for capability-level content.

Determine whether this inheritance-and-override structure creates unnecessary instruction ambiguity.

Consider whether the new Reduce contract should instead be **self-contained** and contain only the rules relevant to its actual task.

## Task Template

The current task template still describes:

* supplying the full module evidence graph;
* generating the Module Engineering Profile and API Reference;
* an earlier invocation model.

The newer Reduce process explicitly does not receive the raw evidence graph and operates as part of capability-based assembly.

Determine whether the task template is now obsolete and should be replaced rather than updated incrementally.

## Historical Instructions

Identify instructions that appear to exist primarily because of previous implementation stages rather than because they belong in the current synthesis contract.

Do not preserve a rule merely because it already exists.

---

# Constraints on This Review

Do **not** redesign the Phase 2 architecture.

Do not propose, unless necessary to evaluate one of the hypotheses above:

* vector databases;
* RAG redesign;
* knowledge graphs;
* multi-model orchestration;
* persistent interpretation stores;
* consensus generation;
* repository retrieval architecture;
* changes to Phase 1 AST extraction.

The deterministic facts are not currently considered the problem.

The question is narrower:

> Can the current Phase 2 synthesis process become materially more repeatable by replacing its historically evolved prompt/contracts with a clearer, more procedural synthesis contract?

---

# Required Review Output

Start with your assessment of the central hypothesis:

> **Does the evidence support the hypothesis that contract ambiguity around traversal, coverage and selection is likely contributing materially to the measured output variance?**

Distinguish:

* what the evidence demonstrates;
* what is a strong inference;
* what remains unproven.

Then review Proposals 1–7 individually.

For each provide:

* **Decision:** Accept / Modify / Reject
* **Problem addressed**
* **Why it should or should not improve repeatability**
* **Where nondeterminism may remain**
* **Risk of over-prescription**
* **Risk of corpus-specific overfitting**
* **Likely token/cost impact**
* **Recommended modification**, if applicable

Then perform the contract-consolidation review.

Identify:

* contradictory instructions;
* obsolete instructions;
* inheritance/override problems;
* ambiguous terminology;
* duplicated responsibilities;
* historical scope creep;
* anything that could reasonably cause two compliant model runs to traverse the evidence differently.

Finally recommend the **shape of the rewritten contract set**.

Do not write the new contracts yet.

The desired result of this review is a decision on:

1. what principles should govern the rewrite;
2. which existing rules should survive;
3. which proposed mechanisms should be adopted;
4. which historical instructions should disappear;
5. how many contracts/templates should exist and what responsibility each should have.

We will use that decision to perform the clean contract rewrite separately.

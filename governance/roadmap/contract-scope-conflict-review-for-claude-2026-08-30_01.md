Phase 2 Synthesis Contract Review --- Findings After Claude Review

Status

Working findings for Phase 2 contract consolidation.

This document captures the current assessment after reviewing the
existing Module Reduce contract, the older Module Engineering Profile
instructions/template, the measured LLM output-variance report, and
Claude's independent review.

This is not yet the rewritten contract. It records the findings and
recommended next step before that rewrite.

1. Current Assessment

The contract-scope hypothesis is a very plausible contributor to the
measured Phase 2 output variance. It is not yet demonstrated how much of
the variance it explains.

The important refinement is:

The Stage 2 model may not currently receive one unambiguous definition
of its job.

The newer Reduce contract defines Stage 2 as a narrow connective-tissue
synthesis step. The older Module Engineering Profile instructions still
describe responsibility for producing complete module sections from
engineering evidence. The Reduce contract then explicitly tells the
model to read the older instructions in full.

The model is therefore required to reconcile overlapping and partially
conflicting responsibilities itself. That reconciliation is unnecessary
model discretion in a production synthesis pipeline.

2. The Core Scope Conflict

The newer Reduce contract effectively says:

Do not redo capability analysis. Produce only module-level connective
tissue and cross-capability judgment.

The older Module Engineering Profile instructions effectively say:

Analyse the module and comprehensively populate the defined
engineering-profile sections.

These instructions are not impossible to reconcile, but they are not
equivalent.

The conflict is particularly visible around:

Section 6 --- Firestore & Data Ownership

Section 9 --- Permissions & Security

Section 13 --- Risks & Open Questions

The Reduce contract says Stage 2 should add only the cross-capability
judgment layer. The older instructions still assign broad analysis
responsibilities to those sections.

There is no general precedence rule clearly stating which document
controls analytical scope when these responsibilities overlap. The model
therefore has to derive the effective contract itself.

3. Why This Could Produce Run-to-Run Variance

The existing contracts appear strong at controlling factual grounding,
evidence priority, confidence, terminology, citation integrity, and
non-fabrication.

The measurements support this: fabricated citations have not been the
observed problem.

The instability is primarily in which legitimate findings are selected
and surfaced.

A conflicting analytical scope can contribute because different runs may
resolve the contract differently. One run may emphasize capability-level
security evidence, RBAC gaps, and individual persistence concerns.
Another may interpret Reduce more narrowly and emphasize security
asymmetry, shared ownership, and cross-capability lifecycle patterns.

Both outputs may remain factually valid while engaging with different
evidence and producing different conclusions.

4. Important Stage-Boundary Principle

A key principle for the rewrite should be:

Never repeat analysis assigned to an earlier synthesis stage.

This is stronger than:

Do not repeat the earlier stage's prose.

If capability synthesis has already performed an exhaustive RBAC
cross-check, Stage 2 should not perform that analysis again merely
because an inherited contract contains the instruction.

Stage 2 should instead consume the capability-level result and ask:

What becomes visible only when these capability-level security
conclusions are compared?

The same principle applies to data ownership, risks, interfaces,
persistence, and other capability-local analysis.

5. Three Different Forms of Ambiguity

5.1 Scope Ambiguity

What reasoning is this stage responsible for?

This is the contract-inheritance problem identified in the current
review. It should be fixed first.

5.2 Traversal Ambiguity

Once the stage knows what it owns, which comparisons or analytical
dimensions must it systematically examine?

Examples may include authorization asymmetry, shared data ownership,
lifecycle behaviour, fan-out, external dependencies, asynchronous
behaviour, and cross-capability coupling.

This remains relevant, but should not be addressed until analytical
scope is unambiguous.

5.3 Selection Ambiguity

Once legitimate candidate findings have been discovered, which qualify
for inclusion in the final document?

This may remain a source of variance even after scope and traversal are
fixed.

The three should be addressed in order:

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

6. Recommendation: Stop Contract Inheritance at Runtime

The rewritten executable contracts should correspond directly to actual
LLM calls:

00-capability-synthesis.md
        │
        │ one capability
        ▼
Capability Output

01-module-reduce.md
        │
        │ module connective tissue only
        ▼
Module Reduce Output

02-repo-reduce.md
        │
        │ repository connective tissue only
        ▼
Repository Output

Each executable contract should be self-contained.

A Stage 2 contract should not instruct the model to read an older broad
contract and then apply exceptions.

Shared principles can be duplicated deliberately into each executable
contract where needed. The small token saving achieved by runtime
contract inheritance is not worth introducing precedence and scope
ambiguity.

7. What Should Survive From the Older Module Instructions

Useful general principles include:

evidence priority;

never invent;

preserve specific engineering terminology;

confidence semantics;

preserve evidence resolution/confidence metadata;

do not interpret missing evidence as evidence of absence;

deterministic engineering evidence outranks architectural grounding;

architectural grounding provides context and terminology but cannot
override implementation evidence;

personas/authority material cannot invent implementation behaviour.

These should be copied deliberately into the executable contracts where
they apply, not inherited wholesale.

8. Rules That Belong to Capability Synthesis, Not Module Reduce

RBAC

Capability synthesis may legitimately require:

Explicitly cross-check every permission string against the supplied
RBAC roles document.

Module Reduce should not repeat that exhaustive capability-level audit.

Its responsibility should instead be:

Compare the supplied capability-level permission conclusions to
identify module-level asymmetries, conflicts, or cross-capability
patterns. Do not repeat or re-perform individual capability RBAC
validation.

Data Ownership

Capability synthesis asks:

What paths does this capability touch?
What persistence evidence exists?
What can be concluded locally?

Module Reduce asks:

Given ownership information from all capabilities
plus deterministic ownership hints:

What becomes visible only through comparison?

These are different analytical jobs and should be expressed in separate
contracts.

9. "Open Question" Also Has Scope Drift

The older instructions contain a rule equivalent to:

If tempted to fill a gap to make the narrative complete, record it as
an open question.

That made sense for the original single-shot module-document workflow.
It is potentially problematic in Reduce.

A Stage 2 model encountering something it cannot establish could turn
its own uncertainty into an Open Question. But Reduce is trying to
restrict Section 13 to cross-cutting findings arising from capability
comparison.

The rewritten Reduce contract should explicitly define what provenance
qualifies something as:

a cross-cutting risk;

a cross-cutting open question;

insufficient evidence;

a capability-local question that must not be regenerated at Reduce.

Generic instructions to convert uncertainty into Open Questions should
not simply be inherited.

10. Recommended Stage 2 Analytical Authority

Section           Input              Required reasoning Explicitly
prohibited

1 Executive       Capability         Module-level       Capability
Summary           summaries          synthesis          re-analysis

2 Architectural   Summaries +        Module positioning Inventing
Position          deterministic                         behaviour from
graphs                                grounding docs

5 Coupling        Deterministic      Minimal            Reconstructing
coupling graph     module-level       imports
interpretation

6 Ownership       Capability         Compare shared     Re-enumerating
conclusion        ownership          ownership          persistence paths
extracts + hints

9 Security        Capability         Compare            Re-performing
security extracts  enforcement        capability RBAC
patterns           audit

10 Relationships  Dependency graph   Render confirmed   Inferring missing
module             dependencies
relationships

12 Observations   Relevant           Identify           Capability-local
extracts + graphs  cross-capability   observations
patterns

The important principle is:

The contract should tell the model where its analytical authority
begins and where it ends.

11. Do Not Add More Complexity Yet

Earlier proposals included mandatory inspection dimensions, explicit
risk inspection surfaces, assessment matrices, discovery/qualification
separation, and coverage-before-completion rules.

These remain potentially useful, but should not be added in the first
rewrite experiment.

Doing so would change multiple variables simultaneously. If variance
improved, it would be impossible to determine which change mattered.

The first rewrite should primarily fix ownership of reasoning.

12. Recommended Experimental Sequence

Rewrite V1 --- Scope Consolidation

Create a clean, self-contained Module Reduce contract.

Objectives:

remove dependency on the old broad Module Engineering Profile
instructions;

copy only genuinely shared evidence/confidence rules into Reduce;

define exactly which sections Reduce owns;

define exactly what analytical work belongs to Reduce;

explicitly prohibit re-performing capability-level analysis;

remove obsolete/manual-workflow instructions;

remove ambiguous precedence relationships.

Do not yet introduce a large mandatory reasoning matrix.

Test V1

Run the same Gemini model against identical evidence, model
configuration, and temperature using the rewritten contract.

Perform multiple independent runs and compare:

substantive findings;

cross-cutting risks;

citation engagement;

section-level similarity;

missing/reappearing findings.

Decision

If variance decreases materially:

Contract scope conflict was likely an important contributor.

Then investigate remaining traversal/selection variance.

If variance remains broadly unchanged:

Scope conflict was real contract debt, but does not explain most of
the observed instability.

Then proceed to explicit traversal controls.

13. Rewrite V2 --- Only If Needed

If meaningful variance remains after V1, introduce procedural coverage.

Potential mechanisms:

mandatory inspection dimensions;

explicit definition of cross-cutting;

capability comparison matrices;

candidate discovery before qualification;

coverage-before-completion rules.

This tests a separate hypothesis:

Even with unambiguous stage scope, the model chooses different
reasoning traversals through the same evidence.

14. Measurement Caution

One claim should remain a hypothesis unless separately measured:

Sections 6, 9 and 13 collectively carry the highest variance.

The evidence clearly demonstrates substantive variance in Risks & Open
Questions and overall citation-count differences.

Unless section-level variance has been quantitatively measured across
the corpus, do not promote the broader statement about Sections 6/9/13
collectively having the highest variance to a fact.

The scope conflict remains worth fixing independently because it is
objectively present in the contracts.

15. Current Recommended Direction

Do not make the Reduce contract more sophisticated yet. Make it
singular, self-contained and internally consistent.

Then measure again.

1. Remove historical scope conflict
             ↓
2. Test repeatability
             ↓
3. If required, constrain reasoning traversal
             ↓
4. Test repeatability
             ↓
5. If required, constrain candidate qualification

This preserves the ability to learn which contract property is actually
affecting Phase 2 behaviour.

16. Current Working Conclusion

The current evidence does not establish that Gemini itself is
incapable of sufficiently repeatable Phase 2 synthesis.

It establishes that repeated runs under the current contracts can
produce materially different legitimate findings.

The current contract set contains accumulated historical scope
ambiguity. That ambiguity requires the LLM to determine its own
effective analytical responsibilities at runtime.

Before introducing multi-run consensus, changing models, or redesigning
Phase 2, the cleanest next experiment is:

Rewrite the Module Reduce contract as a self-contained specification
of one stage, with no inherited analytical responsibilities from the
old single-shot Module Engineering Profile contract.

Then rerun the existing variance test.

If substantial variance survives that cleaner contract, the next target
should be reasoning traversal and coverage rather than sampling
parameters.
# Response to Claude --- Capability Synthesis Variance and V1 Scope

## Status

Direct response to Claude's latest review of
`00-capability-synthesis.md`.

The new empirical finding about `apps/mail` materially changes the
recommended V1-A scope.

The most important conclusion is:

> **Section 3 (Public Interfaces) should no longer be treated primarily
> as an LLM traversal problem if Phase 1 already deterministically
> exposes the complete candidate inventory required to construct it.**

That does not invalidate the broader Traversal Ambiguity hypothesis for
capability synthesis. It narrows where that hypothesis should be tested.

------------------------------------------------------------------------

## 1. Section 3: Agree --- Move Discovery Out of the LLM

The `apps/mail` evidence establishes that Phase 1 already contains:

-   `source_class` facts identifying `OSKEmailLogController` and
    `OSKEmailService`;
-   `controller_method` facts identifying controller methods;
-   `service_method` facts identifying service methods;
-   deterministic controller/service classification through
    `classificationRules`.

Therefore the pipeline does not need an LLM to discover whether these
controller/service classes exist.

The preferred direction is now:

``` text
Phase 1 facts
      ↓
deterministic interface inventory
      ↓
optional LLM description / contextual synthesis
      ↓
assembled Section 3
```

rather than:

``` text
Phase 1 facts
      ↓
LLM searches for public interfaces
      ↓
LLM decides which interfaces count
      ↓
Section 3
```

This is stronger than merely rewriting:

> "Controllers, exported services, and other public entry points..."

into a bounded traversal instruction.

A better prompt would reduce ambiguity, but deterministic enumeration
removes an unnecessary discovery decision altogether.

### Important boundary

This conclusion is currently confirmed for controller/service
identification from the evidence described.

Before making the whole of Section 3 deterministic, verify exactly which
additional categories are intended by:

> "other public entry points"

For each intended category, establish whether Phase 1 already exposes
deterministic evidence sufficient to enumerate it.

The target should be:

> deterministic enumeration wherever the evidence model already supports
> it; LLM synthesis only where interpretation is genuinely required.

------------------------------------------------------------------------

## 2. Section 8 vs. Sections 2/3: Keep as Hypothesis, Not Finding

Claude's pushback is correct.

The observed stability difference:

-   Section 2: -24%
-   Section 3: -44%
-   Section 8: +11%

is compatible with the Traversal Ambiguity hypothesis, but does not
establish it.

A simpler competing explanation exists:

> Section 8 may have a substantially smaller candidate evidence
> population.

A smaller solution space could naturally produce greater run-to-run
stability even without the closed fact-type list being causally
important.

### Recommended check

Before using Section 8 as evidence for the bounded-traversal hypothesis,
compare the same sections across several existing modules.

For each section capture at least:

-   number of candidate facts available;
-   number of reported semantic items;
-   number of citations;
-   run-to-run overlap of reported items;
-   proportion of available candidate evidence represented.

The useful question is not simply:

> Is Section 8 more stable?

It is:

> Is Section 8 more stable than similarly sized evidence surfaces that
> are governed by open-ended traversal instructions?

Until that is checked, Section 8 is an interesting internal comparison,
not proof.

------------------------------------------------------------------------

## 3. Primary Responsibilities: Traversal Remains the Stronger V1-A Test

Section 2 remains fundamentally different from Public Interfaces.

A responsibility is a synthesized concept.

There is no demonstrated deterministic one-to-one mapping such as:

``` text
fact → responsibility
```

Multiple fact types may evidence one responsibility, and one
service/class may participate in multiple responsibilities.

Therefore Section 2 remains a legitimate LLM synthesis task.

The current instruction:

> "Every distinct responsibility/feature this capability provides"

asserts exhaustiveness without defining how the model discovers the
complete candidate set.

That remains a plausible Traversal Ambiguity problem.

### Candidate-source traversal

A V1-A rewrite should require the model to inspect all relevant evidence
surfaces before grouping evidence into responsibilities.

However, Claude's concern about mirroring the Phase 1 taxonomy is valid.

The contract must not encourage:

``` text
API fact          → responsibility A
Firestore fact    → responsibility B
external hook     → responsibility C
```

when all three facts actually describe one coherent responsibility.

The evidence taxonomy should define the **search surface**, not the
**output taxonomy**.

------------------------------------------------------------------------

## 4. Add a Worked Negative Example for Responsibility Grouping

Agree with Claude that prose such as "do not mirror the fact taxonomy"
is probably insufficient.

The rewritten contract should include a compact worked example
demonstrating the intended distinction.

Conceptually:

``` text
Evidence discovered:

- API contract: sendMessage(...)
- Firestore write: /messageLogs/{id}
- external hook: mail provider
- permission check: send_message

Incorrect synthesis:

- Message API responsibility
- Message logging responsibility
- External mail responsibility
- Message permission responsibility

Correct synthesis:

- Send and audit outbound messages
  Evidence: API contract + message-log persistence +
  external mail boundary + permission enforcement
```

The exact example used in the production contract should ideally be
neutral and synthetic rather than copied from a real Oskey capability,
to reduce corpus-specific anchoring.

Its purpose is to demonstrate:

> traverse by evidence type; synthesize by coherent engineering
> behaviour.

This is a useful form of few-shot calibration because it teaches the
grouping operation rather than teaching a specific expected finding.

------------------------------------------------------------------------

## 5. V1-A Should Now Have Two Different Treatments

The new evidence means V1-A should not simply be "rewrite Sections 2 and
3 with bounded traversal."

It should split them according to whether synthesis is genuinely
required.

### Section 2 --- Primary Responsibilities

Keep as LLM synthesis.

Change:

-   define a bounded candidate-evidence traversal;
-   require coverage of the candidate search surface;
-   demonstrate cross-fact grouping with a worked example;
-   avoid fixed responsibility counts;
-   retain evidence citations and confidence rules.

### Section 3 --- Public Interfaces

Move deterministic discovery out of the LLM wherever Phase 1 supports
it.

The remaining LLM role, if any, should be limited to
description/classification that cannot be produced safely from
deterministic evidence.

If all required Section 3 content can be assembled deterministically,
remove Section 3 from capability synthesis entirely.

This is preferable to optimizing a prompt for a task that does not
require probabilistic discovery.

------------------------------------------------------------------------

## 6. Audit for "LLM Rediscovering Deterministic Facts" Before Either Rewrite

Strong agreement with Claude's additional recommendation.

Before finalizing V1-A or V1-B, perform a short responsibility audit
across every LLM-authored section.

For each section ask:

1.  What exact output information is required?
2.  Which parts are direct enumeration?
3.  Which Phase 1 or derived deterministic artefacts already contain
    that information?
4.  Which parts require grouping, interpretation, comparison, or
    architectural judgment?
5.  Can deterministic enumeration be separated from LLM interpretation?

Use a classification such as:

  -----------------------------------------------------------------------
  Classification                      Meaning
  ----------------------------------- -----------------------------------
  Deterministic                       Can be derived directly and
                                      reproducibly from existing facts

  Deterministic + Render              Facts are deterministic; LLM may
                                      improve human-readable description

  Synthetic                           Requires grouping or interpretation
                                      across facts

  Judgment                            Requires architectural comparison
                                      or qualification
  -----------------------------------------------------------------------

The design principle should be:

> **Do not use the LLM to rediscover an inventory that the pipeline
> already knows deterministically.**

This is not a redesign of Phase 2. It is clarification of the
deterministic/synthetic boundary inside the existing pipeline.

------------------------------------------------------------------------

## 7. Apply the Same Audit to Module Reduce

Section 6 Data Ownership is the obvious candidate for review.

The Reduce call currently consumes:

-   capability-level Data Ownership extracts;
-   deterministic Data Ownership Hints.

Before rewriting its ownership instructions, inspect exactly what the
deterministic hint already contains.

Ask:

-   Does it already identify all touching capabilities?
-   Does it distinguish reads/writes/deletes?
-   Does it rank or nominate likely ownership?
-   Does it expose direct-vs-mediated access?
-   Does it expose ambiguity deterministically?
-   Which part of the final "ownership conclusion" remains an actual
    architectural judgment?

If deterministic evidence can already produce:

``` text
path
touching capabilities
operations
candidate owner
confidence/signal basis
```

then the LLM's responsibility may be much narrower than currently
assumed.

The same audit should be applied to:

-   intra-module coupling;
-   cross-module relationships;
-   permission asymmetry inputs;
-   shared persistence paths;
-   external-boundary inventories.

Again, the objective is not to remove LLM synthesis indiscriminately.

It is to ensure the LLM receives a genuinely synthetic task rather than
an enumeration task disguised as synthesis.

------------------------------------------------------------------------

## 8. A/B/AB Experimental Design: Retain, but Use a Representative Subset

Agree with Claude's practical objection to full-repository execution.

The factorial structure remains useful:

  Arm       Capability Contract   Reduce Contract
  --------- --------------------- -----------------
  Current   old                   old
  A         new                   old
  B         old                   new
  AB        new                   new

But initial testing does not need all 12 Firebase modules.

A deliberately selected subset such as:

-   `tasks` --- smaller;
-   `apps` --- known variance case;
-   `organization` --- larger/high-input case;

would provide much better cost control while spanning materially
different module shapes.

The exact modules should be selected from existing measurement data
rather than assumed solely from size.

### Important refinement

Because V1-A may now include deterministic assembly for Section 3, Arm A
is not purely a prompt change.

That is acceptable, but it must be recorded explicitly.

The experiment is testing:

> revised capability-stage responsibility boundary

rather than merely:

> revised capability prompt wording.

Do not describe the resulting improvement as evidence that "better
prompting fixed Section 3" if deterministic enumeration was introduced.

------------------------------------------------------------------------

## 9. Metrics: Citation Count Becomes Secondary

Citation count remains useful for detecting large engagement
differences, but it is not a sufficient coverage metric.

### Public Interfaces

Once a deterministic candidate inventory exists, measure actual
coverage.

For each run:

``` text
evidenced interface candidates
reported interface candidates
missing candidates
unexpected candidates
```

Useful metrics:

-   recall against deterministic inventory;
-   precision against deterministic inventory;
-   run-to-run Jaccard overlap;
-   exact inventory equality.

If Section 3 becomes fully deterministic, its expected run-to-run
variance should simply become zero.

### Primary Responsibilities

There is no equivalent deterministic gold inventory.

Use multiple measures:

-   number of reported responsibilities;
-   semantic overlap of responsibilities between runs;
-   underlying evidence engagement;
-   evidence-category coverage;
-   unique findings per run.

Claude's suggested evidence-engagement metric is particularly useful:

> For every responsibility in Run A, determine whether its supporting
> fact IDs/files appear anywhere in Run B's responsibilities, regardless
> of wording or grouping.

This separates:

``` text
same evidence, different grouping
```

from:

``` text
evidence ignored entirely in one run
```

Those are different failure modes.

### Open Questions

Do not use citation count as the primary stability metric.

Open Questions concern absence, ambiguity, and unresolved evidence; they
may legitimately lack the same citation pattern as presence-based
sections.

Measure semantic question/finding overlap instead.

------------------------------------------------------------------------

## 10. Other Sections of `00-capability-synthesis.md`

Agree with Claude's classification.

### Section 5 --- Data Ownership

Already bounded by Firestore evidence.

No traversal rewrite justified from current evidence.

### Section 6 --- Outbound Coupling

Already bounded by `imports_dependency`.

No traversal rewrite justified.

### Section 7 --- Permissions & Security

Already bounded by permission evidence plus RBAC comparison.

No traversal rewrite justified.

### Section 8 --- External Hooks

Already has an explicit fact-type search surface.

Retain as-is unless broader cross-module measurements identify a
problem.

### Section 1 --- Capability Summary

Open-ended, but deliberately short and synthetic.

Measure semantic stability before changing it.

### Section 9 --- Open Questions

Inherently open-ended.

Do not force it into a closed presence-based inventory merely for
repeatability.

Its qualification rules may eventually need review, but there is no
evidence yet that it should be made enumerable.

------------------------------------------------------------------------

## 11. Revised Experimental Sequence

The prior sequence should now be refined.

### Step 0 --- Deterministic/Synthetic Boundary Audit

Before rewriting either contract:

-   inspect each LLM-authored section;
-   identify deterministic inventories already available;
-   identify actual residual synthesis/judgment;
-   move obvious deterministic enumeration out of LLM responsibility
    where justified.

Section 3 is already a confirmed candidate.

### V1-A --- Capability Stage

Primary target:

> Traversal ambiguity in genuinely synthetic capability sections.

Actions:

-   make Primary Responsibilities traversal bounded;
-   include a grouping example;
-   remove deterministic Public Interface discovery from the LLM to the
    extent Phase 1 supports it;
-   avoid unrelated changes to already bounded Sections 5-8.

Test independently.

### V1-B --- Module Reduce

Primary target:

> Scope ambiguity caused by inherited historical contracts.

Actions:

-   make Reduce self-contained;
-   remove inherited broad module-profile responsibilities;
-   define analytical authority by section;
-   do not yet add elaborate traversal matrices;
-   incorporate results of the deterministic/synthetic boundary audit.

Test independently.

### AB

Combine the validated V1-A and V1-B changes.

Then test the assembled Module Engineering Profile.

Only after these experiments should additional traversal/qualification
controls be introduced.

------------------------------------------------------------------------

## 12. Updated Diagnosis

We should no longer talk about "the Phase 2 variance problem" as though
it has one cause.

Current evidence supports at least two distinct candidate mechanisms.

### Capability synthesis

There is no multi-document scope conflict.

Observed variance in verbatim-assembled capability sections proves that
instability already exists upstream of Reduce.

Likely investigation areas:

``` text
Traversal
Qualification
deterministic-vs-synthetic task boundary
```

### Module Reduce

There is an objective historical scope conflict between the narrow
Reduce contract and the inherited broad module-profile instructions.

Likely investigation areas:

``` text
Scope
then Traversal
then Qualification
```

This is a more useful model than attributing all variance to general LLM
nondeterminism.

------------------------------------------------------------------------

## 13. What Is Now Confirmed vs. Still Hypothetical

### Confirmed

-   Identical capability-stage inputs can produce materially different
    assembled Sections 2/3 outputs.
-   Reduce cannot be the cause of variance in final sections assembled
    verbatim from capability output.
-   `apps/mail` Phase 1 evidence already deterministically identifies
    controller and service classes.
-   Current Section 3 nevertheless asks the LLM to discover Public
    Interfaces.
-   The Reduce contract inherits an older document with broader
    analytical responsibilities.
-   Citation count alone is insufficient to measure semantic coverage.

### Strong design conclusion

-   Deterministically enumerable inventories should not be rediscovered
    probabilistically by the LLM.

### Still hypotheses

-   Bounded traversal is the primary cause of Section 2 variance.
-   Section 8 is more stable because its traversal is bounded rather
    than because its evidence population is smaller.
-   Removing Reduce scope conflict will materially reduce Reduce-stage
    variance.
-   More procedural qualification rules will be necessary after
    scope/traversal fixes.

These should remain explicitly testable hypotheses.

------------------------------------------------------------------------

## 14. Recommended Immediate Next Action

Before writing either replacement contract, perform the short
deterministic/synthetic boundary audit across both stages.

This audit should be small and concrete.

Its output should identify, section by section:

``` text
Current LLM responsibility
Available deterministic evidence
Deterministically enumerable subset
Residual synthesis/judgment
Recommended owner
```

Then:

1.  rewrite `00-capability-synthesis.md` only around the genuinely
    synthetic capability responsibilities;
2.  rewrite `01-module-reduce.md` as a self-contained Reduce contract;
3.  test A and B independently on a representative module subset;
4.  combine only after independent results are understood.

The most important design principle emerging from the review is now:

> **Deterministic evidence should define the inventory. LLM synthesis
> should explain, group, compare, and judge only where those operations
> cannot already be performed deterministically.**

That principle is stronger and more general than simply adding more
detailed prompts, and the `apps/mail` Section 3 finding provides a
concrete example of why it matters.

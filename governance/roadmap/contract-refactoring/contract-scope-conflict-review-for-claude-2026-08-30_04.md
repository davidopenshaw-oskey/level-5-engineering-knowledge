# Response to Claude --- Section 6 Audit and Step 0 Classification

## Status

Direct response to Claude's implementation-backed audit of Section 6
Data Ownership and the proposed next step for the
deterministic/synthetic boundary review.

The Section 6 result strengthens the Step 0 audit approach because it
produces a materially different answer from Section 3 rather than
mechanically pushing every LLM responsibility toward deterministic
generation.

------------------------------------------------------------------------

## 1. Agree on the Framing: This Extends an Existing Pipeline Principle

The Deterministic / Deterministic+Render / Synthetic / Judgment
classification is not a new architectural principle for the Oskey
Knowledge Pipeline.

The pipeline already separates:

``` text
Phase 1
deterministic extraction
        ↓
Phase 2
LLM synthesis / judgment
```

and, within Phase 2:

``` text
deterministic preparation / assembly
        ↓
bounded LLM synthesis
        ↓
deterministic assembly
```

The Step 0 audit applies the same separation at a finer granularity:

``` text
pipeline stage
    ↓
LLM call
    ↓
document section
    ↓
individual responsibility within that section
```

That is a useful clarification.

The audit is not based on a presumption that "deterministic is always
better." Its purpose is to identify the narrowest legitimate judgment
surface for the LLM.

A better statement of the principle is:

> **Make deterministic what the existing evidence can establish
> deterministically; preserve LLM synthesis and judgment where the
> required conclusion is not present in the deterministic evidence.**

------------------------------------------------------------------------

## 2. Section 6 Audit: Agree With the Verdict

The implementation details from `ownership-hints.ts` materially clarify
what the current deterministic layer does and does not know.

The current `OwnershipHint` contains:

``` typescript
className
definingSubmodule
calledByOtherSubmodulesCount
callingSubmodules
calledByOtherModulesCount
callingModules
```

This is fundamentally a **call-graph centrality / mediation signal**.

It is not a Firestore ownership determination.

### What is deterministic today

The pipeline can establish:

-   which class defines the relevant Controller/Service methods;
-   which other submodules call that class;
-   which other modules call that class;
-   how many distinct callers exist;
-   relative call-graph centrality;
-   evidence that other parts of the system interact through that class.

### What is not deterministic in this signal

The hint does not itself establish:

-   which Firestore paths the callers touch;
-   read vs. write vs. delete semantics;
-   ownership per persistence path;
-   whether several writers constitute shared ownership;
-   whether centrality means architectural ownership;
-   whether a path is deliberately shared;
-   whether apparent ownership is ambiguous;
-   a deterministic confidence threshold for ownership.

Therefore the current ownership hint is correctly named a **hint**.

It should not be promoted into an ownership fact.

------------------------------------------------------------------------

## 3. Section 6 Classification

The correct classification is not simply `Judgment`.

It has multiple layers:

  -----------------------------------------------------------------------
  Section 6 responsibility            Classification
  ----------------------------------- -----------------------------------
  Enumerate capability Firestore      Deterministic
  paths                               

  Preserve operation/scope metadata   Deterministic

  Enumerate classes/callers from      Deterministic
  ownership hints                     

  Identify paths touched by multiple  Potentially Deterministic
  capability extracts                 

  Associate call-centrality hints     Deterministic preparation / join
  with candidate owners               where identifiers permit

  Decide architectural owner          Judgment

  Decide whether ownership is         Judgment
  genuinely shared                    

  Decide whether evidence is          Judgment
  ambiguous                           

  Explain architectural significance  Synthetic / Judgment
  -----------------------------------------------------------------------

This is important because it suggests the correct design is not:

``` text
deterministic OR LLM
```

but:

``` text
deterministic preparation
        ↓
small explicit judgment surface
        ↓
LLM conclusion
```

Section 6 is therefore structurally much healthier than the original
Section 3 design.

The contract rewrite should tighten the remaining judgment, not remove
it.

------------------------------------------------------------------------

## 4. One Further Question Exposed by the Section 6 Audit

Although architectural ownership remains a legitimate LLM judgment, some
of the **comparison work currently preceding that judgment may still be
unnecessarily delegated to the LLM**.

For example, if capability Data Ownership extracts already contain
structured Firestore paths, a deterministic preparation step may be able
to generate:

``` text
shared path:
  /example/{id}

touching capabilities:
  capability_a
  capability_b
  capability_c

operation evidence:
  capability_a: [...]
  capability_b: [...]
  capability_c: [...]

ownership-hint candidates:
  ServiceA:
    definingSubmodule: capability_a
    calledByOtherSubmodulesCount: 2
    callingSubmodules:
      - capability_b
      - capability_c
```

The LLM would then receive the comparison rather than having to discover
the comparison from several prose extracts.

This would preserve the genuine judgment:

> Which capability appears to own this path, and how confident can we
> be?

while removing mechanical matching/grouping work.

This is not required for V1-B unless the current pipeline already
exposes the required structured inputs cheaply.

It is, however, exactly the kind of boundary the Step 0 audit should
record.

------------------------------------------------------------------------

## 5. Refine the Classification Framework

Claude's warning about `Deterministic + Render` is correct.

The classification should describe **responsibility**, not expected
variance.

Recommended definitions:

### Deterministic

The required semantic output can be derived reproducibly from
deterministic evidence without LLM interpretation.

Expected semantic coverage variance: zero.

### Deterministic + Render

The complete semantic inventory is deterministic, but an LLM may render
descriptions or narrative around that fixed inventory.

Expected inventory/coverage variance: zero.

Expected wording variance: non-zero.

The renderer must not add or remove inventory items.

### Synthetic

The model must combine, group, summarize, or abstract multiple
deterministic facts into a higher-level representation.

Expected wording and grouping variance: possible.

Coverage should be constrained by an explicit evidence traversal where
practical.

### Judgment

The model must choose among plausible interpretations or qualify a
conclusion that is not deterministically established by the supplied
evidence.

Expected interpretive variance: possible.

Judgment criteria should be explicit enough to make the decision
reproducible where possible.

This distinction prevents `Deterministic + Render` from being mistaken
for "fully deterministic output."

------------------------------------------------------------------------

## 6. An Additional Useful Classification: Deterministic Preparation

Section 6 suggests a useful operational distinction that may be worth
recording without necessarily creating a fifth canonical category.

Some work is deterministic but exists only to prepare a better judgment
surface:

``` text
facts
 ↓
deterministic join/grouping/comparison
 ↓
LLM judgment
```

Examples may include:

-   grouping identical Firestore paths across capabilities;
-   attaching operation evidence to each capability/path pair;
-   attaching ownership hints to candidate classes;
-   grouping permission evidence by capability;
-   constructing enforcement tallies;
-   identifying capabilities with and without explicit RBAC evidence.

These operations are not final document content.

They are **deterministic reasoning preparation**.

This matters because the current contracts sometimes ask the LLM to
perform both:

1.  mechanical evidence reconciliation; and
2.  architectural judgment.

Separating those may improve repeatability without eliminating useful
LLM reasoning.

------------------------------------------------------------------------

## 7. Agree: Audit Section 9 Next

Section 9 --- Permissions & Security cross-cutting callouts --- is now
the highest-value next audit target.

The current Reduce contract already contains procedural instructions
such as:

-   build an enforcement tally;
-   compare capabilities;
-   identify authorization asymmetry;
-   count unattributed security-relevant signals.

That raises an immediate question:

> How much of this "mental tally" can already be calculated
> deterministically from the capability outputs or Phase 1 evidence?

The audit should establish:

### Deterministic inputs currently available

-   permission strings by capability;
-   RBAC catalog membership;
-   capability-level mismatches;
-   permission-denied/error signals;
-   operation types where available;
-   counts of relevant signals;
-   capability identity.

### Questions to answer against the implementation

1.  Is RBAC membership already deterministically resolved at capability
    synthesis, or does Reduce re-evaluate it?
2.  Are capabilities with explicit permission evidence enumerable
    without LLM reasoning?
3.  Are capabilities with security-relevant rejection/error signals
    enumerable?
4.  Can unattributed security signals and their counts be calculated
    deterministically?
5.  Can an enforcement matrix be constructed deterministically?
6.  Which part remains genuine judgment --- for example, whether two
    capabilities perform "comparably sensitive operations"?
7.  Is sensitivity itself derivable from operation facts, or only
    partially inferable?
8.  Does the final cross-cutting security finding require architectural
    judgment after deterministic asymmetry detection?

The likely target shape, if supported by the code, is:

``` text
deterministic security matrix
        ↓
LLM evaluates architectural significance
        ↓
cross-cutting security callout
```

rather than:

``` text
permission extracts
        ↓
LLM constructs mental tally
        ↓
LLM discovers asymmetry
        ↓
LLM judges significance
```

But this remains a hypothesis until checked against the implementation.

------------------------------------------------------------------------

## 8. Audit Section 13 After Section 9

Section 13 --- cross-cutting Risks & Open Questions --- should be
audited second.

It is likely to remain more genuinely synthetic/judgment-heavy than
Section 9.

The key question is not whether risks can be generated
deterministically.

It is:

> Which candidate risk conditions can be surfaced deterministically
> before the LLM decides whether they constitute a meaningful
> module-level risk?

Potential deterministic candidate signals might include:

-   conflicting ownership indicators;
-   capabilities sharing a persistence path;
-   permission asymmetry;
-   unresolved call edges;
-   missing deterministic mappings;
-   external-boundary counts;
-   destructive operations without corresponding permission evidence;
-   contradictory capability conclusions.

Only include these if the current evidence model actually supports them.

Do not build a risk taxonomy into the pipeline merely because it sounds
architecturally useful.

The audit should distinguish:

``` text
candidate signal detection
```

from:

``` text
risk interpretation
```

Section 13 may ultimately look like:

``` text
deterministically surfaced candidate conditions
        +
capability open questions
        +
module graphs
        ↓
LLM cross-cutting qualification
        ↓
Risks & Open Questions
```

That would retain the LLM where it is valuable while reducing arbitrary
evidence search.

------------------------------------------------------------------------

## 9. Important Constraint: Do Not Let Step 0 Become Scope Creep

There is a risk that the audit itself becomes another redesign exercise.

It should remain deliberately small.

For each section, answer only:

  -----------------------------------------------------------------------
  Question                            Purpose
  ----------------------------------- -----------------------------------
  What does the section need to       Define responsibility
  output?                             

  What deterministic evidence already Establish available truth
  exists?                             

  What can be enumerated              Remove unnecessary discovery
  mechanically?                       

  What must be synthesized?           Preserve legitimate LLM work

  What requires judgment?             Define irreducible reasoning

  What should the LLM actually        Define the clean input boundary
  receive?                            
  -----------------------------------------------------------------------

The audit should not yet:

-   add new Phase 1 fact types;
-   redesign ownership algorithms;
-   create new risk engines;
-   build new scoring models;
-   introduce arbitrary thresholds;
-   redesign the repository-level architecture.

If a deterministic improvement requires new extraction work, record it
as a possible future enhancement rather than automatically pulling it
into V1.

This preserves the purpose of V1: clean up the existing responsibility
boundaries using evidence already available.

------------------------------------------------------------------------

## 10. Revised V1-B Principle

The earlier V1-B recommendation was:

> Make Reduce self-contained and remove inherited historical
> responsibilities.

That still stands.

The Section 6 audit adds a second constraint:

> Within the self-contained Reduce contract, explicitly distinguish
> deterministic inputs from the judgment the model is being asked to
> add.

For example, Section 6 should not vaguely say:

> determine data ownership.

It should say, conceptually:

``` text
The supplied capability extracts establish persistence touches.
The supplied ownership hints establish call-graph centrality.
Neither establishes architectural ownership.

Your task is to compare these supplied signals and make only the
ownership judgment that cannot be established deterministically.
```

That is much cleaner than either extreme:

``` text
LLM discovers everything
```

or:

``` text
ownership hint = owner
```

------------------------------------------------------------------------

## 11. Current State of the Audit

Based on the evidence now checked:

  -----------------------------------------------------------------------
  Area                    Current classification  Confidence
  ----------------------- ----------------------- -----------------------
  Capability Section 3    Deterministic           Confirmed for checked
  --- controller/service                          evidence
  inventory                                       

  Capability Section 3    Deterministic + Render  Strong design
  --- optional                                    conclusion
  human-readable                                  
  description                                     

  Capability Section 2    Synthetic               Strong
  --- Primary                                     
  Responsibilities                                

  Capability Section 5    Deterministic           Strong
  --- persistence-path                            
  inventory                                       

  Capability Section 6    Deterministic           Strong
  --- outbound coupling                           
  inventory                                       

  Capability Section 7    Deterministic or        Needs implementation
  --- permission          Deterministic + Render  boundary check
  inventory/RBAC                                  
  comparison                                      

  Capability Section 8    Deterministic or        Strong from contract,
  --- external-hook       Deterministic + Render  implementation should
  inventory                                       confirm

  Reduce Section 6 ---    Partially Deterministic Confirmed
  ownership evidence                              
  preparation                                     

  Reduce Section 6 ---    Judgment                Confirmed from current
  architectural ownership                         hint limitations
  conclusion                                      

  Reduce Section 9 ---    Unknown pending audit   Audit next
  cross-cutting security                          

  Reduce Section 13 ---   Synthetic/Judgment      Audit after Section 9
  cross-cutting risks     likely                  
  -----------------------------------------------------------------------

Do not treat the table as final until Sections 9 and 13 have been
checked against actual implementation inputs.

------------------------------------------------------------------------

## 12. Recommended Next Step

Proceed with Claude's proposed direct implementation checks for:

1.  Reduce Section 9 --- Permissions & Security cross-cutting callouts;
2.  Reduce Section 13 --- cross-cutting Risks & Open Questions.

Use the same standard applied to Section 6:

> inspect the real code and actual generated inputs before deciding what
> belongs to deterministic preparation versus LLM synthesis/judgment.

For each, report:

``` text
Available deterministic inputs
What is already computed
What the LLM currently recomputes/discovers
What could be mechanically prepared from existing data
What genuinely requires synthesis
What genuinely requires judgment
Recommended V1-B responsibility boundary
```

Once those two audits are complete, we should have enough evidence to
define the V1-A and V1-B contract scopes without continuing to discover
major responsibility-boundary mistakes during the rewrite itself.

------------------------------------------------------------------------

## 13. Current Working Principle

The review has now produced a more precise design principle than simply
"make more things deterministic":

> **Deterministic evidence defines what is known. Deterministic
> preparation should organize what can be organized mechanically. LLM
> synthesis should group and explain. LLM judgment should be reserved
> for conclusions that the deterministic evidence does not itself
> establish.**

Section 3 and Section 6 are useful counterexamples:

``` text
Section 3
Inventory already known
→ remove LLM discovery

Section 6
Signals known, conclusion not known
→ preserve LLM judgment
```

That difference is exactly why the Step 0 audit should continue before
the contract rewrite is finalized.

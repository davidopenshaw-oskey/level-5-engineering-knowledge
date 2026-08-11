This is a strong strawman. The central move—**making Interpretations canonical and Documents projections**—is directionally right.

The largest weakness is that the proposed model treats invalidation as a comparison of fact sets, when the real problem is **dependency-aware semantic invalidation**.

Several other issues follow from that.

# Overall assessment

I would retain:

* Facts as immutable, reproducible evidence.
* Interpretations as persisted first-class objects.
* Documents as projections rather than canonical truth.
* Append-only history.
* Structural evidence references.
* Reasoning decoupled from CI/CD.
* On-demand rendering.

I would challenge:

* “Facts are true by construction.”
* The proposed Interpretation identity.
* The meaning of `generatedAgainstFactSet`.
* Scope-level invalidation.
* Binary confidence.
* A single `supersedes` chain.
* Mutable human overrides inside generated objects.
* LLM-based document rendering as the default.
* The assumption that one Interpretation equals one short natural-language claim.

---

# 1. The invalidation rule is currently incorrect

You propose:

> If `generatedAgainstFactSet` is a superset-equal match against the newly extracted fact set for that scope, the Interpretation is still valid.

There are two issues.

## The comparison direction is unclear or backwards

Suppose an interpretation was generated from facts:

```text
A, B, C
```

The new scope contains:

```text
A, B, C, D
```

The old evidence is still present, but fact `D` may contradict or materially qualify the claim.

A subset check would incorrectly reuse the interpretation.

Now suppose the scope changes to:

```text
A, B, C, X, Y, Z
```

where the additional facts are unrelated model properties. Regenerating everything would be wasteful.

Therefore neither:

```text
old facts == new facts
```

nor:

```text
old facts ⊆ new facts
```

is a sufficient validity rule.

## Scope facts are not claim dependencies

An interpretation should not depend on every fact in its scope.

For example:

```text
Claim:
The building module exposes 38 callable endpoints.
```

Its dependencies are the callable-contract facts and perhaps the capability membership rules—not all 2,498 building facts.

By contrast:

```text
Claim:
Building deletion performs a wide cross-domain cleanup.
```

may depend on:

* the deletion method;
* resolved calls;
* access revocation;
* intercom cleanup;
* pincode deletion;
* possibly downstream methods in other modules.

The dependency set is specific to the claim.

## Required change

Replace:

```typescript
generatedAgainstFactSet: FactId[]
```

with at least:

```typescript
dependencies: EvidenceDependency[]
```

For example:

```typescript
EvidenceDependency {
  evidenceId: FactId | RelationshipId | InterpretationId
  role: "supports" | "qualifies" | "contradicts" | "context"
  observedVersion: string
}
```

And separately:

```typescript
evaluationContext: {
  scopeSnapshotId: string
  selectionRuleVersion: string
  corpusVersion: string
}
```

The evidence cited by a claim and the environment in which the claim was evaluated are different things.

---

# 2. Fact identity will churn too easily

Your fact ID contains:

```text
type|module|file|line|primaryKey
```

That is useful for traceability, but line number is not stable enough to be the canonical identity of a fact.

Adding an import at the top of a file can move every line and cause hundreds of facts to appear deleted and recreated even though their semantics did not change.

That would create massive false invalidation.

## Better identity structure

A fact needs two identifiers:

```typescript
factId          // stable semantic identity
factVersionId   // identity of this exact observed version
```

Example:

```text
factId:
service_method|building|OSKBuildingService|deleteBuilding

factVersionId:
sha256(normalized AST subtree + resolved symbol identity + source commit)
```

Location becomes provenance:

```typescript
sourceLocation: {
  file: string
  startLine: number
  endLine: number
}
```

—not the primary identity.

Some fact types will require different identity strategies:

* method: fully qualified symbol;
* callable: exported handler name;
* Firestore path: normalized path plus operation;
* permission reference: enclosing symbol plus permission string;
* call edge: caller symbol plus call-site ordinal or AST node identity;
* model property: type symbol plus property path.

Without semantic IDs, incremental Phase 2 will regenerate unnecessarily on routine formatting or file movement.

---

# 3. Facts are not automatically “true by construction”

They are deterministic, but deterministic is not identical to infallible.

A fact can be faithfully produced by a flawed extractor.

Examples:

* unresolved dynamic dispatch;
* factory-returned interfaces;
* reflection;
* decorators;
* framework-generated behavior;
* string-composed Firestore paths;
* Angular dependency injection;
* runtime registration;
* conditional exports;
* unsupported language features;
* parser-version regressions.

The fact:

```text
No external hooks found
```

might mean:

```text
none exist
```

or:

```text
the extractor did not detect them
```

Those are very different.

## Better distinction

Facts should carry **extraction provenance and epistemic status**, even if not LLM confidence:

```typescript
Fact {
  factId: string
  factVersionId: string
  factType: string
  payload: unknown

  extraction: {
    extractor: string
    extractorVersion: string
    parserVersion: string
    method:
      | "compiler_resolved"
      | "ast_literal"
      | "static_pattern"
      | "heuristic"
      | "unresolved"
    completenessBoundary?: string
  }
}
```

I would avoid calling heuristic Phase 1 output a Fact without qualification.

A useful taxonomy is:

* **Observed Fact** — directly present in syntax.
* **Resolved Fact** — established through compiler-symbol resolution.
* **Derived Fact** — deterministic computation from other facts.
* **Signal** — heuristic but repeatable.
* **Unknown** — explicitly unresolved.

This protects the Phase 1 principle without overstating its certainty.

---

# 4. Deterministic relationships and heuristic hints should not share one object type

The proposed `Relationship` category currently contains both:

* compiler-resolved call edges;
* heuristic ownership hints.

Those have fundamentally different semantics.

A resolved call edge is an assertion:

```text
A calls B.
```

An ownership hint is an analytical signal:

```text
B has the highest inbound call count and may be an owner.
```

The latter is not really a relationship. It is a **derived signal** produced by an algorithm.

I would introduce:

```text
Fact
Relationship
Signal
Interpretation
```

Where:

```typescript
Signal {
  id: string
  algorithm: string
  algorithmVersion: string
  inputs: EvidenceId[]
  value: unknown
  meaning: string
  limitations: string[]
}
```

Then interpretations can cite signals while preserving the hedge.

Otherwise future consumers may accidentally treat every `Relationship` as equally authoritative.

---

# 5. A singular natural-language claim is not enough as the canonical interpretation

This:

```typescript
claim: string
```

is too unstructured to support:

* deduplication;
* comparison;
* invalidation;
* contradiction detection;
* document rendering;
* cross-repository joins;
* query answering.

These two claims may be semantically identical:

```text
The access module orchestrates credential provisioning.
```

```text
Credential provisioning is coordinated by the access module.
```

A hash of `scope + claim-subject` will not reliably establish identity unless the subject itself is structured.

## Give interpretations a semantic core

For example:

```typescript
Interpretation {
  id: string
  claimType:
    | "responsibility"
    | "ownership"
    | "dependency"
    | "architectural_pattern"
    | "risk"
    | "constraint"
    | "workflow_role"
    | "security_observation"

  subject: EntityRef
  predicate: string
  object?: EntityRef | LiteralValue

  statement: string
}
```

Example:

```json
{
  "claimType": "responsibility",
  "subject": {
    "type": "module",
    "id": "access"
  },
  "predicate": "orchestrates",
  "object": {
    "type": "capability",
    "id": "credential-provisioning"
  },
  "statement": "The access module orchestrates credential provisioning."
}
```

The structured semantic fields become the identity and query surface.

The prose becomes a rendering.

That is important if Documents cease to be canonical.

---

# 6. Holistic claims need evidence queries, not merely evidence lists

You correctly identify this weakness.

A claim such as:

> Error handling is inconsistent across the module.

may depend on:

* 47 methods with `try/catch`;
* 13 methods without expected logging;
* three different error constructors;
* inconsistent translation patterns;
* comparisons to repository-wide conventions.

Listing every fact ID is technically possible but unusable.

The answer is not to abandon atomic interpretations. It is to support **evidence sets defined by reproducible queries or aggregates**.

For example:

```typescript
EvidenceSet {
  id: string
  query: EvidenceQuery
  resultSnapshotId: string
  resultCount: number
  resultHash: string
  sampleEvidenceIds: EvidenceId[]
}
```

Then an interpretation can cite:

```typescript
evidence: [
  {
    evidenceSetId: "error-handling-patterns:building",
    role: "supports"
  }
]
```

The query might mean:

```text
All service methods in building
joined to:
- thrown error types
- logging calls
- catch blocks
- response wrappers
compared against repository baseline
```

This gives holistic claims a reproducible basis without placing 300 IDs inside each object.

## Important caveat

The EvidenceSet must preserve:

* the query definition;
* algorithm version;
* input corpus version;
* complete result hash;
* representative samples.

Otherwise it becomes an opaque mini-summary.

---

# 7. Interpretation dependencies must include other Interpretations

Higher-level claims often do not directly depend on raw facts.

A module claim may depend on capability interpretations:

```text
Capability A owns unit membership.
Capability B provisions access.
Capability C updates intercoms.
Therefore the building module coordinates occupancy-to-access propagation.
```

The module claim should cite those interpretations, which themselves cite raw evidence.

So:

```typescript
evidence: FactId[] | RelationshipId[]
```

is insufficient.

It should allow:

```typescript
evidence:
  | FactRef
  | RelationshipRef
  | SignalRef
  | EvidenceSetRef
  | InterpretationRef
```

This creates a provenance DAG:

```text
facts
  ↓
capability interpretations
  ↓
module interpretations
  ↓
repository interpretations
  ↓
landscape interpretations
```

That DAG is also the solution to cascade invalidation.

---

# 8. Staleness should propagate through dependencies, not scopes

Your second weakness is exactly right.

Do not say:

```text
A capability changed
→ stale the entire module
→ stale the repository
→ stale the landscape
```

That would destroy incrementality.

Instead:

```text
Evidence version changes
→ find interpretations that depend on it
→ mark those interpretations pending re-evaluation
→ propagate only to interpretations that depend on those interpretations
```

This is ordinary dependency-graph invalidation.

However, even this needs nuance.

## Not every dependency change invalidates the claim

Suppose a method gets a new optional logging call. The fact version changes, but the interpretation:

```text
The method deletes the building document.
```

may remain valid.

So use two stages:

### Stage 1 — affected

A dependency changed.

```text
status = affected
```

### Stage 2 — revalidated

A cheap deterministic or LLM check decides whether the claim remains valid.

```text
affected → current
affected → stale
affected → revised
```

This is better than immediately calling everything stale.

I would use statuses such as:

```typescript
status:
  | "current"
  | "affected"
  | "stale"
  | "superseded"
  | "disputed"
  | "rejected"
```

---

# 9. Negative claims require special handling

Interpretations frequently say:

```text
No callable endpoint exposes this service.
No permission was found.
No external hook exists.
No implementation was detected.
```

Those cannot be supported by a simple non-empty `FactId[]`, because their evidence is absence.

They need a reproducible search boundary:

```typescript
NegativeEvidence {
  query: EvidenceQuery
  searchedScope: ScopeSnapshotId
  extractorCoverage: string[]
  resultCount: 0
}
```

Without this, “no evidence found” will either violate the schema or be backed by unrelated facts.

This also links back to extraction completeness.

A negative claim is only as strong as the extractor's known coverage:

```text
No `external_hook` facts found
```

is not equivalent to:

```text
No external integration exists.
```

The interpretation model needs to encode that distinction.

---

# 10. Binary confidence is too coarse

`Confirmed | Inferred` has been useful as a writing discipline, but as canonical data it collapses several dimensions.

Consider:

```text
The module contains 38 APIs.
```

This may be:

* deterministically verified;
* fresh;
* complete;
* unreviewed by a human.

Another claim:

```text
The access service is the architectural owner of credential provisioning.
```

may be:

* strongly supported;
* derived from several signals;
* reviewed by a senior engineer;
* slightly stale.

One binary field cannot represent both well.

## Separate dimensions

For example:

```typescript
assurance: {
  basis:
    | "deterministic"
    | "strong_inference"
    | "weak_inference"
    | "human_asserted"

  evidenceCoverage:
    | "complete_for_claim"
    | "partial"
    | "unknown"

  reviewStatus:
    | "unreviewed"
    | "machine_validated"
    | "human_approved"
    | "human_disputed"

  freshness:
    | "current"
    | "affected"
    | "stale"
}
```

The UI can still render simple labels:

```text
Confirmed
Inferred
Unknown
```

But the canonical object should retain the underlying dimensions.

I would be especially cautious with LLM-produced `Confirmed`.

A better rule might be:

> An LLM may propose that a claim is deterministically confirmable, but only a validator may assign `basis: deterministic`.

---

# 11. `supersedes` is not enough for interpretation history

A simple chain assumes one old interpretation becomes one new interpretation.

Reality will include:

* one interpretation splitting into three;
* three interpretations merging into one;
* two competing interpretations;
* a claim being retracted;
* a claim being narrowed;
* a claim remaining valid but gaining stronger evidence.

You need a richer lineage structure:

```typescript
lineage: {
  derivedFrom: InterpretationId[]
  replaces: InterpretationId[]
  splitFrom: InterpretationId[]
  mergedFrom: InterpretationId[]
}
```

Possibly simpler:

```typescript
predecessors: {
  id: InterpretationId
  relation:
    | "supersedes"
    | "narrows"
    | "expands"
    | "splits"
    | "merges"
    | "contradicts"
}[]
```

You also need a **claim family ID** to group versions of the same conceptual observation:

```typescript
claimFamilyId: string
interpretationVersionId: string
```

Otherwise stable identity becomes difficult when wording or scope changes.

---

# 12. Human override should not be a mutable field on an Interpretation

This:

```typescript
humanOverride: { note, by, at } | null
```

mixes generated knowledge with human governance.

It also allows only one override.

Instead, use an append-only review object:

```typescript
Review {
  id: string
  targetInterpretationId: string
  reviewer: string
  decision:
    | "approve"
    | "reject"
    | "qualify"
    | "replace"
    | "request_review"
  note: string
  createdAt: timestamp
  evidence?: EvidenceRef[]
}
```

Then human assertions can survive regeneration and be independently versioned.

A human may also be wrong, so `humanOverride` should not automatically become truth.

The current effective state can be computed from:

* machine interpretation;
* validation result;
* active human reviews;
* organizational policy.

This is cleaner and auditable.

---

# 13. Documents should probably be persisted as snapshots, even if not canonical

I agree that Documents should not be the source of truth.

But not persisting them at all creates problems.

If a document informs a PRD, architectural decision, audit, or incident review, you need to reconstruct exactly what was seen at that time.

An on-demand LLM rendering may differ between executions because of:

* model version changes;
* prompt changes;
* nondeterminism;
* interpretation ordering;
* renderer updates;
* provider behavior.

Therefore distinguish:

```text
Document Definition
Document Snapshot
```

The definition might be:

```typescript
DocumentDefinition {
  documentType: "module-engineering-profile"
  scope: Scope
  rendererVersion: string
  sectionRules: ...
}
```

The snapshot might be:

```typescript
DocumentSnapshot {
  id: string
  definitionId: string
  corpusVersion: string
  interpretationVersionIds: string[]
  renderer: {
    type: "deterministic" | "llm"
    version: string
    model?: string
    promptHash?: string
  }
  contentHash: string
  contentLocation: string
  generatedAt: timestamp
}
```

Documents are projections, but important projections should be reproducible and auditable.

---

# 14. The document renderer should not necessarily be an LLM

You propose one LLM call to narrate already-decided claims.

That may be useful, but it should not be assumed.

Once interpretations are structured, much of the engineering profile can be rendered deterministically:

```text
Section 3 — Responsibilities
→ select responsibility interpretations
→ group by capability
→ order by configured priority
→ include evidence references
```

An LLM could optionally improve transitions or executive summaries.

I would separate:

### Deterministic document assembly

* section placement;
* tables;
* capability lists;
* citations;
* metadata;
* confidence labels;
* risks;
* APIs.

### Optional narrative enrichment

* executive summary;
* architectural synthesis;
* prose transitions;
* audience-specific explanation.

This could eliminate the added rendering call for routine documents.

It would also make document outputs far more stable.

---

# 15. Interpretation generation may still be too document-shaped

There is a risk that Phase 2 simply produces hundreds of sentence fragments mirroring the eventual document.

That would relocate the current problem without changing it.

For example:

```text
Interpretation 1: The module owns buildings.
Interpretation 2: The module owns doors.
Interpretation 3: The module owns units.
Interpretation 4: The module uses a layered architecture.
```

This is better structured than Markdown, but it may still be an LLM-generated document broken into rows.

The important question is:

> What interpretations are durable, reusable units of knowledge across multiple downstream uses?

Good candidates include:

* capability ownership;
* orchestration responsibility;
* security boundary;
* lifecycle responsibility;
* architectural pattern;
* cross-module contract;
* risk;
* known limitation;
* workflow participation;
* invariant;
* planned/not-implemented status.

Less useful candidates are arbitrary prose paragraphs.

Interpretation schemas should be typed by use case, not merely generic text claims.

---

# 16. Current status cannot be global without a corpus version

Across branches, releases, and repositories, there may be multiple legitimate “current” states.

For example:

* production commit;
* staging commit;
* active development branch;
* historical incident commit;
* mobile release 4.2;
* backend release 7.9.

An interpretation is current **relative to a corpus snapshot**, not universally current.

So instead of:

```typescript
status: "current"
```

you need something like:

```typescript
validity: {
  corpusId: string
  fromSnapshot: string
  toSnapshot?: string
}
```

or:

```typescript
knowledgeView:
  | "production"
  | "staging"
  | "development"
  | custom
```

The pipeline's existing run IDs and commit provenance naturally support this.

This becomes essential at landscape level because 15 repositories will not all share one commit timeline.

---

# 17. Cross-repository synthesis does not need a different canonical model, but it needs different evidence primitives

I think the Interpretation/Document split still holds across repositories.

What changes is the evidence layer.

Within a repository:

```text
compiler symbol → compiler symbol
```

Across repositories:

```text
served contract → consumed contract
published event → subscribed event
written schema → read schema
shared identifier → shared identifier
```

You need deterministic or semi-deterministic contract-surface objects such as:

```typescript
InterfaceSurface {
  repoId: string
  direction: "provides" | "consumes"
  kind:
    | "http_api"
    | "firebase_callable"
    | "pubsub_topic"
    | "database_collection"
    | "event_schema"
    | "storage_path"
  identity: string
  schemaHash?: string
}
```

Then a join process produces:

```typescript
CrossRepoLink {
  providerSurfaceId: string
  consumerSurfaceId: string
  matchBasis:
    | "exact_identity"
    | "schema_match"
    | "configured_mapping"
    | "heuristic"
}
```

Interpretations can reason over those links exactly as they reason over compiler-resolved relationships.

So the canonical model can remain consistent. The evidence adapters differ by language and repository type.

---

# 18. Contradictions need first-class representation

Your model assumes a current interpretation replaces stale ones.

But architectural knowledge frequently contains unresolved disagreement:

* code says one thing;
* RBAC reference says another;
* architecture documentation says a third;
* a human says the code is transitional;
* two services appear to claim ownership.

Do not force premature resolution.

Add a conflict object:

```typescript
Conflict {
  id: string
  subject: EntityRef
  claims: InterpretationId[]
  conflictType:
    | "evidence_mismatch"
    | "ownership_ambiguity"
    | "documentation_drift"
    | "implementation_vs_intent"
  status:
    | "open"
    | "accepted_deviation"
    | "resolved"
  resolution?: ReviewId
}
```

This is particularly important because trustworthiness is the load-bearing requirement.

A trustworthy corpus must sometimes say:

```text
There are two supported interpretations and the conflict is unresolved.
```

---

# 19. Interpretations need generation provenance

The current schema omits the conditions under which the LLM created the interpretation.

At minimum:

```typescript
generation: {
  generatedAt: timestamp
  generatorType: "llm" | "human" | "deterministic"
  model?: string
  modelVersion?: string
  promptContractVersion?: string
  taskVersion?: string
  temperature?: number
  inputSnapshotHash: string
}
```

This matters for:

* model comparison;
* regression testing;
* reproducibility;
* provider replacement;
* identifying systematic errors;
* deciding whether to refresh old interpretations after model improvements.

An interpretation generated by a weak 8B local model and one approved by a senior engineer should not be indistinguishable.

---

# 20. The economics depend on reuse patterns, not only change frequency

You ask whether this reduces LLM calls or relocates them.

The split pays when at least one of these is true:

### Documents are requested repeatedly

One set of interpretations can render:

* engineer profile;
* PM summary;
* security review;
* onboarding view;
* API overview;
* impact-analysis context.

Without interpretations, each output re-reasons over raw evidence.

### Most changes affect a small dependency region

A changed capability invalidates five interpretations, not the entire module profile.

### Higher-level synthesis reuses lower-level interpretations

Repo and landscape reasoning use existing module knowledge rather than raw facts.

### Deterministic rendering replaces most narration calls

The rendering cost may be near zero.

### Interpretations are used directly in retrieval

Many user questions can be answered from structured interpretations without generating a full document.

The design does **not** pay if:

* every merge changes most capabilities;
* interpretation granularity is too coarse;
* every document still invokes a large LLM;
* interpretations are only used once;
* invalidation is scope-wide;
* prompts regenerate all claims “just in case.”

So the economics are an empirical question, but the proposed model creates the possibility of reuse. The current document-only architecture does not.

---

# A revised canonical model

I would evolve the four-object model to something closer to this:

```text
Observed/Resolved Facts
        ↓
Deterministic Relationships
        ↓
Derived Signals and Evidence Sets
        ↓
Interpretations
        ↓
Reviews and Conflicts
        ↓
Document Definitions
        ↓
Document Snapshots
```

A revised Interpretation might look like:

```typescript
Interpretation {
  claimFamilyId: string
  versionId: string

  scope: {
    level: "capability" | "module" | "repo" | "landscape"
    scopeId: string
    corpusSnapshotId: string
  }

  semantics: {
    claimType: string
    subject: EntityRef
    predicate: string
    object?: EntityRef | LiteralValue
  }

  statement: string

  evidence: Array<{
    ref:
      | FactRef
      | RelationshipRef
      | SignalRef
      | EvidenceSetRef
      | InterpretationRef
    role: "supports" | "qualifies" | "contradicts" | "context"
  }>

  assurance: {
    basis:
      | "deterministic"
      | "strong_inference"
      | "weak_inference"
      | "human_asserted"
    evidenceCoverage:
      | "complete_for_claim"
      | "partial"
      | "unknown"
    reviewStatus:
      | "unreviewed"
      | "machine_validated"
      | "human_approved"
      | "human_disputed"
  }

  status:
    | "current"
    | "affected"
    | "stale"
    | "superseded"
    | "disputed"
    | "rejected"

  lineage: Array<{
    interpretationId: string
    relation:
      | "supersedes"
      | "narrows"
      | "expands"
      | "splits"
      | "merges"
      | "contradicts"
  }>

  generation: {
    generatorType: "llm" | "human" | "deterministic"
    model?: string
    promptContractVersion?: string
    inputSnapshotHash: string
    generatedAt: string
  }
}
```

# What I would test before adopting this architecture

Do not build the whole persistence layer yet.

Use one large module and run four experiments.

## Experiment 1 — interpretation durability

Take the current `building` profile and atomize it into typed interpretations.

Ask:

* Are the objects meaningful outside that document?
* Can they render a different audience view?
* Are they too fragmented?
* Are important architectural observations representable?

## Experiment 2 — semantic invalidation

Make three controlled code changes:

1. formatting/line movement only;
2. an unrelated method addition;
3. a materially changed inhabitant deletion cascade.

Measure which interpretations are marked affected.

The model succeeds only if:

* change 1 invalidates nothing;
* change 2 invalidates very little;
* change 3 invalidates the exact affected claims and their dependants.

## Experiment 3 — deterministic rendering

Render the engineering profile without an LLM from structured interpretations.

Then allow one small LLM call only for the executive summary.

Compare usefulness with today's direct synthesis.

## Experiment 4 — reuse

Use the same interpretation set to answer:

* What does the building module do?
* How are inhabitants managed?
* Which operations affect physical access?
* What permission mismatches exist?
* Produce a PM-facing summary.

If the same objects support these without re-reading raw facts, the canonical representation is earning its complexity.

# Bottom line

The core proposal is sound:

> **Interpretations, not documents, should become the durable unit of Phase 2 knowledge.**

But I would not implement the current schema unchanged.

The three most important corrections are:

1. **Use semantic fact identities and version hashes**, not line-based IDs as canonical identity.
2. **Build an explicit evidence and interpretation dependency graph**, then invalidate claims through dependencies rather than whole scopes.
3. **Make Interpretations typed semantic objects with multidimensional assurance**, not merely sentence strings carrying `Confirmed` or `Inferred`.

With those corrections, this could genuinely change Phase 2 from repeated document synthesis into an incremental engineering knowledge system.

Without them, there is a risk of building a sophisticated append-only database of LLM sentences that still regenerates too often and remains difficult to query, reconcile, or trust.

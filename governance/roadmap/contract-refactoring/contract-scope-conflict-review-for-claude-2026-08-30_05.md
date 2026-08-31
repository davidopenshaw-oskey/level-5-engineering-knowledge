# Response to Claude --- Section 9/13 Audits and Cross-Repository V1 Implications

## Status

Direct response to the implementation-backed audits of Reduce Section 9
(Permissions & Security) and Section 13 (Risks & Open Questions).

The findings are accepted with one important extension: **V1-A and V1-B
must now be designed as cross-repository contract changes, not
Firebase/cloud-specific fixes.**

The current synthesis contracts are duplicated across multiple Oskey
repositories, including:

-   the main cloud repository;
-   the Angular PGO repository;
-   the Node-IoT middleware/cloud repository that manages two-way
    Pub/Sub conversations with edge devices and exposes edge-device
    APIs;
-   persistence flows involving MongoDB between edge/cloud/application
    layers.

The principal evidence-model differences currently include:

-   Node-IoT: Joi-derived schema evidence and middleware/device
    messaging concerns;
-   Angular PGO: Angular compiler-derived evidence, including signals
    and other Angular-specific structures;
-   cloud repositories: their own API, persistence, trigger, permission,
    and service/controller evidence.

Therefore any contract rewrite should preserve a **shared semantic
contract** while allowing repo-specific deterministic evidence surfaces.

------------------------------------------------------------------------

## 1. Section 9 Finding: Accepted, and Stronger Than a Prompt Fix

The Section 9 audit identifies a concrete implementation gap:

> A deterministic repo-wide `rbacRequirements` catalog already exists,
> but the module-reduce call does not receive it.

Instead, Reduce currently reconstructs its security comparison from
concatenated capability-level prose.

This is exactly the kind of work the Step 0 audit was intended to
expose.

The current flow is effectively:

``` text
deterministic permission evidence
        ↓
capability LLM prose
        ↓
N prose fragments
        ↓
module Reduce LLM reconstructs a mental enforcement tally
        ↓
security judgment
```

The better V1-B boundary is:

``` text
deterministic permission evidence
        ↓
deterministic module-scoped RBAC catalog
        +
capability security conclusions
        ↓
module Reduce LLM
        ↓
cross-capability architectural judgment
```

This removes unnecessary rediscovery while retaining the genuinely
non-deterministic question:

> Is the observed enforcement asymmetry architecturally significant?

That distinction is important.

The LLM should not be responsible for discovering which permission
checks exist if the pipeline already knows them.

It should be responsible for interpreting the architectural significance
of the resulting pattern.

------------------------------------------------------------------------

## 2. Section 9 Classification

The section should now be decomposed as follows:

  -----------------------------------------------------------------------
  Responsibility                      Classification
  ----------------------------------- -----------------------------------
  Enumerate permission checks         Deterministic

  Attribute checks to                 Deterministic
  module/file/line/context            

  Validate/catalog permission strings Deterministic

  Filter RBAC catalog to current      Deterministic preparation
  module                              

  Present per-capability security     Existing synthesized input
  conclusions                         

  Identify candidate enforcement      Partially deterministic / partially
  asymmetries                         synthetic

  Decide whether operations are       Judgment
  comparably sensitive                

  Decide whether asymmetry is         Judgment
  architecturally significant         

  Explain the cross-cutting security  Synthetic / Judgment
  implication                         
  -----------------------------------------------------------------------

This is a cleaner responsibility boundary than the current "mental
tally" instruction.

The phrase **mental enforcement tally** should probably disappear from
the production Reduce contract once the deterministic catalog is wired
in.

The contract should reason from an explicit supplied security inventory,
not instruct the model to reconstruct one internally.

------------------------------------------------------------------------

## 3. Section 13 Finding: Accepted

The Section 13 audit also gives a clean result.

Most of the candidate deterministic risk signals previously discussed
**do not currently exist as ready-built deterministic aggregations**.

That matters because V1 should not quietly become a new
evidence-extraction project.

The one important existing signal is:

``` text
unresolvedCallEdges
```

It already exists repo-wide and is not currently supplied to the module
Reduce call.

Therefore V1-B should include:

> Filter the existing unresolved-call-edge inventory to the current
> module and provide it as a deterministic Reduce input.

This belongs in the same category as the Section 9 RBAC change:

> **existing deterministic artifact, currently not wired to the consumer
> that needs it.**

No new inference algorithm is required.

------------------------------------------------------------------------

## 4. Do Not Build a New Risk Engine for V1

Agree strongly with the audit conclusion.

Signals such as:

-   destructive operations without corresponding permission evidence;
-   shared persistence-path risk;
-   contradictory capability conclusions;
-   external-boundary risk counts;
-   missing deterministic mappings;

may be useful later.

But if they are not already computed from the current evidence model,
they should not be introduced merely to make the V1 contract rewrite
more comprehensive.

That would change the experiment from:

> clean up responsibility boundaries and use existing deterministic
> evidence correctly

into:

> redesign the deterministic evidence layer and the LLM contracts
> simultaneously.

That would undermine the controlled experiment.

For V1:

``` text
already computed + not wired
        → wire it

already computed + badly assigned to LLM
        → move responsibility

not computed
        → record for later
```

This should be an explicit V1 scope rule.

------------------------------------------------------------------------

## 5. A Useful New Category: Wiring Gap

The audits have exposed a useful implementation category that is
distinct from the earlier four semantic classifications.

It does not need to become a fifth semantic class, but it should be
tracked during implementation.

### Semantic classification

``` text
Deterministic
Deterministic + Render
Synthetic
Judgment
```

### Implementation status

Separately:

``` text
Available and wired
Available but not wired
Requires deterministic preparation
Requires new extraction/aggregation
```

This gives us two independent dimensions.

For example:

  --------------------------------------------------------------------------------
  Evidence/Responsibility          Semantic class          Implementation status
  -------------------------------- ----------------------- -----------------------
  Public controller/service        Deterministic           Available; assembly
  inventory                                                change required

  Ownership hint                   Deterministic signal    Available and wired

  Ownership conclusion             Judgment                LLM required

  Module RBAC catalog              Deterministic           Available but not wired

  Unresolved call edges            Deterministic           Available but not wired

  Destructive-without-permission   Deterministic candidate Requires new
  signal                           signal                  aggregation

  Cross-cutting risk significance  Judgment                LLM required
  --------------------------------------------------------------------------------

This is more precise than putting all implementation concerns into the
deterministic/synthetic classification itself.

------------------------------------------------------------------------

## 6. Cross-Repository Constraint: Do Not Encode Firebase Fact Types Into the Shared Contract

This is now a hard design constraint for V1.

The contracts are used across multiple repositories.

Therefore instructions such as:

``` text
inspect Firestore paths
inspect api_contract facts
inspect controller_method facts
```

should only appear in shared contracts where those evidence concepts are
genuinely universal, or should be expressed through repo-specific
evidence manifests/adapters.

The shared contract should operate on semantic evidence categories such
as:

``` text
public interfaces
persistence surfaces
schemas/contracts
authorization evidence
external boundaries
messaging/event boundaries
cross-capability dependencies
unresolved dependencies
```

The repo-specific preparation layer can map actual evidence types into
those concepts.

Conceptually:

``` text
                    ┌─ Firebase / cloud evidence
                    │
                    ├─ Angular compiler evidence
                    │
repo adapter ───────┼─ Joi / Node-IoT evidence
                    │
                    ├─ MongoDB persistence evidence
                    │
                    └─ edge-device API / PubSub evidence
                             ↓
                  shared semantic evidence surface
                             ↓
                  shared synthesis contract
```

This avoids solving variance by making the contract increasingly aware
of one repository's AST vocabulary.

------------------------------------------------------------------------

## 7. Public Interfaces Across Repositories

The Section 3 deterministic finding should therefore be generalized
carefully.

For the checked cloud capability, deterministic facts already identify
controller/service classes.

But "Public Interfaces" means different concrete things in different
repositories.

Examples may include:

### Cloud / backend

-   controllers;
-   exported services;
-   callable APIs;
-   HTTP handlers;
-   event handlers.

### Angular PGO

Potential evidence may include:

-   components;
-   services;
-   routes;
-   inputs/outputs;
-   signals;
-   public facades;
-   API clients.

The exact inventory must be determined from the Angular compiler/AST
evidence actually produced by the pipeline.

### Node-IoT middleware

Potential evidence may include:

-   API handlers;
-   service classes;
-   Pub/Sub publishers/subscribers;
-   device-facing handlers;
-   Joi-described request/response boundaries.

Again, the actual deterministic inventory should come from existing
evidence, not assumptions in the shared contract.

Therefore the V1-A design principle should be:

> Each repository deterministically produces its own Public Interface
> inventory from its native evidence model; the shared contract consumes
> the normalized inventory rather than discovering interfaces from raw
> facts.

That is more robust than copying Firebase-specific Section 3 traversal
instructions into every repository contract.

------------------------------------------------------------------------

## 8. Persistence and Data Ownership Must Also Become Repository-Neutral

The current terminology around Section 6 is heavily influenced by
Firestore.

That is no longer sufficient.

The semantic concern is:

> **Persistence & Data Ownership**

not:

> Firestore ownership.

Depending on repository, evidence may involve:

-   Firestore;
-   MongoDB;
-   local/device persistence;
-   application state;
-   potentially other persistence surfaces later.

The shared contract should therefore reason about normalized persistence
evidence.

For example:

``` text
persistence surface
resource/path/collection
operation evidence
defining capability
touching capabilities
operation detection scope
confidence
ownership/centrality hints
```

The underlying repository adapter may populate that from Firestore
facts, MongoDB facts, or another persistence mechanism.

This is especially important for cross-repository synthesis later: a
user question may involve a flow that begins in PGO, passes through
cloud/PubSub middleware, reaches an edge device, and persists state in
MongoDB.

The vocabulary of the synthesis layer should not imply that persistence
equals Firestore.

------------------------------------------------------------------------

## 9. External Hooks and Messaging Need the Same Treatment

The existing capability contract's Section 8 is bounded using concrete
fact types such as:

``` text
external_hook
pubsub_topic
pubsub_publish_call
http_or_client_path
environment_variable
storage_path
```

That is useful within a specific evidence model, but the cross-repo
contract should distinguish the semantic categories from their extractor
representation.

For Node-IoT in particular, Pub/Sub is not merely an incidental
"external hook."

It participates in two-way cloud ↔ edge-device conversations.

The shared synthesis semantics may therefore need to distinguish:

``` text
external integration
messaging boundary
publisher
subscriber/consumer
request/reply or correlated conversation
device-facing API
persistence boundary
```

This does **not** mean expanding V1 into cross-repository architecture
synthesis.

It means ensuring the capability/module contracts do not flatten
repo-native architectural evidence into a Firebase-shaped taxonomy.

------------------------------------------------------------------------

## 10. Joi and Angular Compiler Evidence Should Remain Repo-Specific Inputs

The shared contracts should not contain special-case instructions like:

``` text
if Node-IoT, inspect Joi
if Angular, inspect signals
```

unless there is no cleaner mechanism.

Prefer:

``` text
repo-specific deterministic preparation
        ↓
normalized evidence category
        ↓
shared contract
```

For example:

``` text
Joi schema
    ↓
request/response/schema evidence

Angular signal
    ↓
state/reactivity evidence

Firestore path
    ↓
persistence evidence

MongoDB collection
    ↓
persistence evidence
```

The native evidence should still be preserved and citeable.

Normalization must not erase the exact compiler/extractor evidence.

The shared semantic layer is an index/contract boundary, not a
replacement for native facts.

------------------------------------------------------------------------

## 11. Implication for Contract Duplication

The fact that the contracts are currently duplicated per repository is
now relevant technical debt.

V1 should **not necessarily solve the physical duplication
immediately**.

That could again broaden the change unnecessarily.

However, the rewritten contracts should be authored as though they are
one shared specification.

A practical sequence could be:

``` text
author canonical shared V1 contract
        ↓
apply identical semantic contract to each repo
        ↓
retain repo-specific evidence-input sections/configuration
        ↓
test independently per repo
```

Later, physical duplication can be removed through a shared contract
source or generation mechanism.

For now, semantic consistency matters more than repository-layout
refactoring.

------------------------------------------------------------------------

## 12. V1-A Revised Cross-Repo Scope

### Shared change

Primary Responsibilities:

-   bounded traversal across normalized evidence categories;
-   explicit grouping across evidence categories;
-   worked negative example;
-   no fixed output count;
-   preserve native evidence citations.

Public Interfaces:

-   remove LLM discovery where deterministic repo evidence can enumerate
    the inventory;
-   provide the inventory as deterministic input or assemble directly;
-   allow only bounded rendering/synthesis around the fixed inventory.

### Repo-specific implementation

Each repo must define how its native facts produce:

``` text
public-interface inventory
```

without changing the semantic meaning of the final section.

This is where Angular compiler evidence and Node-IoT/Joi evidence
belong.

------------------------------------------------------------------------

## 13. V1-B Revised Cross-Repo Scope

### Shared Reduce contract

Make Reduce:

-   self-contained;
-   assembly-first;
-   explicit about its analytical authority;
-   repository-neutral in semantic terminology;
-   clear about deterministic inputs vs. residual judgment;
-   prohibited from re-performing capability analysis.

### Deterministic inputs

Where available per repo, supply normalized forms of:

-   dependency/coupling graph;
-   ownership/centrality hints;
-   authorization/RBAC catalog;
-   unresolved call/dependency edges;
-   capability-level persistence conclusions;
-   capability-level security conclusions.

### Repo-specific availability

Not every repository needs to expose every signal identically.

The contract should not manufacture missing evidence.

Instead:

``` text
if deterministic signal supplied:
    use it according to its stated semantics

if not supplied:
    do not infer its existence
    do not reconstruct it from unrelated evidence unless explicitly assigned
```

This is important for maintaining the same contract across heterogeneous
repositories.

------------------------------------------------------------------------

## 14. Cross-Repo Test Matrix

The V1 tests should no longer be Firebase-only.

We still do not need exhaustive execution across every module.

But the representative test set should span **repository types**, not
merely module sizes.

At minimum, select examples covering:

``` text
cloud/backend
Angular PGO
Node-IoT middleware
```

and preferably a flow involving MongoDB persistence where that evidence
is present.

The objective is to test two dimensions:

### Repeatability

Does the rewritten contract reduce run-to-run semantic variance?

### Portability

Does the same semantic contract remain correct when the deterministic
evidence vocabulary changes by repository?

A Firebase-only improvement that requires Firebase-specific prompt logic
is not a successful V1 result.

------------------------------------------------------------------------

## 15. Section 9 Cross-Repo Implication

The Firebase implementation has a concrete `rbacRequirements` catalog.

Other repositories may represent authorization differently.

Therefore the shared Reduce contract should not require a data structure
literally named `rbacRequirements`.

It should require, when supplied:

> a deterministic authorization-requirements catalog containing the
> checks or requirements evidenced for the current module, including
> their native provenance and confidence.

Firebase can map its existing `rbacRequirements` directly into that
input.

Another repository may supply a different native implementation.

The contract consumes the semantics, not the internal variable name.

------------------------------------------------------------------------

## 16. Section 13 Cross-Repo Implication

Likewise, `unresolvedCallEdges` is one deterministic representation of
unresolved dependency resolution.

The shared contract should reason about:

> unresolved dependency/call evidence supplied by the deterministic
> graph stage.

Repo-specific graph builders may produce different edge types.

The contract should preserve their native resolution status and
provenance rather than assuming every repository resolves TypeScript
calls in the same way.

This will matter especially across:

-   Angular dependency structures;
-   middleware/event flows;
-   edge-device API interactions;
-   Pub/Sub publisher/subscriber relationships.

------------------------------------------------------------------------

## 17. Updated V1 Design Rule

The earlier rule was:

> Deterministic evidence defines what is known. Deterministic
> preparation organizes what can be organized mechanically. LLM
> synthesis groups and explains. LLM judgment is reserved for
> conclusions the evidence does not establish.

Add a cross-repository constraint:

> **The shared contract defines semantic responsibilities;
> repository-specific deterministic layers define how native
> compiler/runtime evidence satisfies those responsibilities.**

Together:

``` text
native repo evidence
        ↓
deterministic repo-specific preparation
        ↓
shared semantic evidence surface
        ↓
shared synthesis/judgment contract
        ↓
repo-native citations preserved
```

This should become a governing principle for V1-A and V1-B.

------------------------------------------------------------------------

## 18. Recommended Next Step

The Section 6/9/13 audits now provide enough evidence to begin scoping
V1-A and V1-B.

Before drafting the actual contracts, add one small cross-repository
check:

For each of the three current repo types, map the existing deterministic
evidence into the semantic categories needed by the shared contracts:

  ------------------------------------------------------------------------------
  Semantic category     Cloud               Angular PGO        Node-IoT
  --------------------- ------------------- ------------------ -----------------
  Public interfaces     existing AST facts  Angular/compiler   TS/API/service
                                            facts              facts

  API/schema contracts  existing API/schema client/API         Joi + API
                        evidence            evidence where     evidence
                                            present            

  Persistence           Firestore           applicable         MongoDB /
                                            client/state       middleware
                                            evidence           persistence

  Authorization         RBAC/permission     existing auth      existing auth
                        evidence            evidence           evidence

  External/messaging    hooks/PubSub/HTTP   HTTP/client        PubSub/device
  boundaries                                boundaries         APIs

  Dependency/coupling   resolved TS graph   Angular/TS graph   TS/event graph

  Unresolved            resolved graph      repo graph         repo graph
  dependencies          output              equivalent         equivalent
  ------------------------------------------------------------------------------

This should be populated from actual current pipeline outputs, not
assumptions.

Its purpose is simply to prevent the shared contract rewrite from
accidentally encoding the evidence vocabulary of the first cloud
repository.

Once that mapping exists, proceed with V1-A and V1-B scope documents.

------------------------------------------------------------------------

## 19. Current Conclusion

The latest audits strengthen the overall direction.

We now have several distinct cases:

``` text
Section 3
deterministic inventory already available
→ remove probabilistic discovery

Section 6
partial deterministic signal
→ preserve architectural ownership judgment

Section 9
strong deterministic catalog already exists but is not wired
→ fix plumbing, preserve significance judgment

Section 13
one useful deterministic signal already exists but is not wired
→ wire it; keep broader risk synthesis/judgment
```

The cross-repository context adds one further requirement:

> None of these fixes should depend on Firebase being the repository
> under analysis.

The V1 contracts should therefore become **shared semantic synthesis
contracts operating over repo-specific deterministic evidence**, while
preserving exact native evidence and provenance underneath.

That gives us a cleaner path not only to repeatability within one repo,
but to consistent Phase 2 behavior as the knowledge pipeline expands
across the Oskey system.

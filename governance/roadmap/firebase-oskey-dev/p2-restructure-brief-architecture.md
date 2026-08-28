# Phase 2 Architecture Brief: Current Design, Real Economics, and Open Questions

*A grounding brief for open discussion with other AI systems — self-contained, no repo access assumed. Companion to a shorter PM-level brief covering mission and business context; this one goes deep on the technical shape.*

## 1. Mission, briefly

A pipeline turns source-controlled codebases (currently one Firebase/TypeScript backend, expanding to 15+ repos across iOS, Android, Angular, and a Node.js/IoT middleware layer) into a trustworthy, queryable engineering knowledge base — per-module profiles, API references, cross-module dependency graphs, permission and data-ownership documentation. Output feeds real decisions (impact analysis, PRD drafting), so confidence-calibration matters as much as coverage: every claim is tagged Confirmed or Inferred, every claim traces to real evidence, and a wrong "Confirmed" is treated as strictly worse than an honest "likely."

**Scope note:** everything measured and demonstrated below (Sections 2-4) comes from one module of one repository — that's as far as this has actually been built and cost-tested so far. Section 3.3 proposes how the same pattern extends to a full repo and across repos; that part is a proposal, not something running yet.

## 2. Phase 1 — the proven pattern (philosophy and mechanics)

**Philosophy:** treat source code as ground truth and extract everything that can be determined *mechanically* — via compiler-level AST parsing, not LLM summarization — before any AI model ever sees the codebase. Every extracted fact is a structured, typed record (a class, a method signature, a database-path reference, a permission-string check, an API request/response contract, a pub/sub topic, an import/export relationship) with a stable, addressable ID encoding its type, module, file, line, and primary key. This makes every fact independently citable and verifiable later.

**Mechanics, roughly, per repository:**
1. Clone the repo.
2. Parse every source file's AST; extract facts into typed buckets (imports, exports, classes, methods, functions, type aliases, model properties, call expressions, Firestore-path references, permission-string references, API contracts, pub/sub routes, etc.).
3. Resolve cross-module and intra-module call graphs at the *compiler symbol* level (not string-matching) — i.e., actually resolve which method a given call expression refers to, across module boundaries.
4. Partition facts into per-module and per-submodule ("capability") packs — a module's facts are scoped down to just what belongs to it, so downstream consumers (including Phase 2) never need the whole repository's fact set at once.

**Real scale, one repository, most recent run:** 544 files, 2,347 imports, 1,262 methods, 6,655 call expressions, 2,163 model properties, 738 type aliases, 497 permission-check references, 256 API contracts, 96 controller classes, 117 service classes. After cross-module/intra-module resolution: 2,222 confirmed cross-module call edges, 119 confirmed intra-module call edges, 21 calls left genuinely unresolved.

All of this runs with **zero AI model calls** — it's a compiler pass. Cost is effectively free; runtime is fast enough to trigger on every CI/CD merge without hesitation. **This is not the bottleneck**, and the pattern — mechanical extraction wherever possible, LLM judgment reserved for what genuinely requires it — is the design principle Phase 2 is built on and could plausibly lean into further.

**A note on scope: this is demonstrated on one language, not limited to it.** Everything above is shown against a TypeScript/Firebase backend, since that's what's been built and tested so far. The extraction *philosophy* — compiler/parser-level fact extraction wherever mechanically possible, before any LLM involvement — is language-agnostic; it doesn't yet cover Angular-specific constructs (component templates, structural directives, dependency-injected services, reactive-stream patterns) even though Angular is also TypeScript, nor iOS (Swift), Android (Kotlin/Java), or C/C++ (mentioned below). Each language/toolchain needs its own extraction implementation — the AST shapes aren't shared across them — but the tiering framework and the module/capability/reduce pattern described from Section 3 onward should carry over unchanged. This surface is expected to keep growing as more repositories and languages are added.

*(Further out, not addressed in this brief: the same organization also manufactures intercom hardware and BLE/NFC key fobs. Those repositories will eventually feed the same corpus too — sometimes correlating with existing software modules (e.g. an access-control-device module), sometimes introducing entirely new artifact types (hardware schematics, firmware source, possibly formats that aren't parseable as source-code AST at all). Not something this round of discussion needs to solve, but worth knowing it's coming before assuming every future input source will look like the TypeScript case above.)*

## 3. Phase 2 — current design

### 3.1 The three-tier framework

Early iterations asked the LLM to determine *everything*, including things that are actually mechanically derivable (does a given database collection exist? which classes call which other classes? does a cited permission string actually exist in the role definitions?). This was both wasteful (tokens spent on lookups a script could do for free) and risky (hallucination surface on things that should never be uncertain). The fix — now the governing design rule — classifies everything Phase 2 consumes into three tiers:

- **Tier 1 — fully deterministic.** Computed once, handed to the LLM as ground truth, never something the LLM is asked to judge (e.g., the cross-module/intra-module call graphs from Phase 1).
- **Tier 2 — deterministic cross-reference.** A mechanical join between two fact sets that produces a hint or a confirmed cross-check, but still requires narrative judgment to interpret in context (e.g., "this permission string exists in the role definitions and has this description" — mechanical; "is this the *right* permission for this action" — judgment). Includes a **generate-then-verify** citation pattern: the LLM still writes inline citations to specific facts as it synthesizes narrative (this can't be replaced by a lookup — there's no clean deterministic path from prose back to fact IDs), but a deterministic pass afterward checks every cited fact ID or file/line reference against real evidence and flags likely-fabricated citations. Also includes a **"hint, not a label"** principle for signals that are strongly suggestive but not certain — e.g., "this class is called into by more other modules than any other in this area, so it's probably the true owner of the data it manages" is handed to the LLM as a hint to combine with its own judgment, never auto-promoted to a confident claim on its own.
- **Tier 3 — narrative/interpretive.** Genuinely requires LLM judgment and synthesis: architectural observations, prose descriptions of what a module does and why, confidence-tagged claims about ambiguous cases. This is the only tier that should ever need to be split across multiple prompts/bundles when content is large — Tier 1/2 content must stay complete and correct regardless of how Tier 3 gets bundled.

### 3.2 Current call structure

For a small module (its evidence fits in one prompt): **one LLM call** produces the whole module profile plus a companion API reference.

For a large module (evidence doesn't fit in one prompt): a two-stage map-reduce —
- **Stage A ("capability calls"):** one sequential LLM call per submodule/"capability," each given: the relevant contract/instruction documents, a set of large static grounding documents (architecture overview, personas/authority model, database schema, database security rules, database indexes, a flattened permission-role lookup), a live list of all module names in the repo, generation metadata, that capability's own fact table (compact-encoded, not raw JSON), and a deterministic join of that capability's API request/response types against its own model-property facts. Produces one narrative capability-synthesis document.
- **Stage B ("reduce"):** two parallel LLM calls (profile document, API-reference document), each given: the reduce-specific contract/instruction documents, the same large static grounding documents again, the cross-module dependency graph, the intra-module coupling graph, resolved cross-module call edges scoped to this module, data-ownership hints, and — critically — **all of Stage A's narrative outputs concatenated**, not raw facts. Produces the final documents. A generate-then-verify citation check runs on the output afterward.

**Prompt-shape skeleton (Stage A, per capability call), in order:**
```
[task framing]
## Supporting Contracts           <- same every call within a run
## Architectural Grounding Docs   <- same every call within a run (large, static)
## Module list                    <- same every call within a run
## Generation metadata            <- differs per call (capability name, timestamp)
## This capability's fact table   <- differs per call, relatively small
## Resolved API schema join       <- differs per call, small
[output format instructions]
```

**Prompt-shape skeleton (Stage B, per reduce call), in order:**
```
[task framing]
## Supporting Contracts (reduce-specific -- DIFFERENT docs from Stage A)
## Architectural Grounding Docs   <- same large docs as Stage A, resent
## Cross-module dependency graph  <- deterministic, module-scoped
## Intra-module coupling graph    <- deterministic, module-scoped
## Resolved cross-module call edges
## Data-ownership hints
## Module list
## Generation metadata
## ALL Stage A capability outputs, concatenated in full
[output format instructions]
```

Note the two skeletons' "Supporting Contracts" sections contain *different* documents, and grounding docs are resent, unchanged, at every single call in both stages — no caching is currently implemented anywhere in this pipeline.

### 3.3 Proposed scaling shape: module → repo → landscape (proposed, not yet built)

Everything in 3.2 describes synthesis *within* one module of one repository — that's as far as this has actually been built and tested. The natural generalization, not yet implemented, is to apply the same map-then-reduce pattern one level up, twice:

- **Repo level:** once every module in a repository has its own profile (3.2's output), a repo-level reduce call would take *all* of that repo's module profiles — already-synthesized narrative, the same way today's module-level reduce takes all of a module's capability outputs — plus repo-wide deterministic artifacts (the cross-module dependency graph already exists at this scope) and produce one repo-wide engineering overview: major subsystems, cross-cutting patterns (how permissions are enforced across the whole repo, for instance), and the module relationships that matter at a glance.
- **Landscape/enterprise level:** once every repository has its own repo-level overview, a landscape-level reduce would take *all* repos' overviews and produce one document — what each repo is responsible for, how they relate, where the real cross-repo seams are.

This is structurally the same recursive/hierarchical reduce mechanism already flagged as open below (Section 6a) for handling a single module with too many capabilities to fit one reduce call — the same design question just needs an answer at three nested scopes instead of one: capability→module, module→repo, repo→landscape.

Two things this raises with no answer yet:

1. **Cross-repo deterministic artifacts are a genuinely different problem than cross-module ones.** Within one repository, cross-module dependencies resolve at the compiler-symbol level — a real import, a real method call. Across repositories, especially across different languages and toolchains (a TypeScript backend, an Angular frontend, native mobile clients, eventually firmware), there's no shared compiler to resolve against. Cross-repo relationships would need each repo to deterministically expose its own "contract surface" (which API endpoints it calls versus serves, which shared schemas it reads or writes) and a join step across repos matching those surfaces by shape/identity rather than by symbol resolution. Not designed yet.
2. **Cost compounds with every added level, but favorably in one specific way.** A repo-level reduce only needs that repo's already-synthesized module profiles, not the raw facts underneath them; a landscape-level reduce only needs repo-level overviews, not everything below that — input at each higher level is bounded by how many child summaries exist, not by raw fact volume. Whether that's actually cheap enough depends entirely on how much narrative each level chooses to carry forward versus how much gets pushed into a more compact, deterministic form instead — Section 6a's open question, now relevant at three additional scopes rather than one.

## 4. Real economics, measured

A full real run of the large-module path (11 capability calls + 2 reduce calls = 13 LLM calls, one model, one provider) actually cost, wall-clock, checked against the provider's own billing dashboard: **$4.80** (started with $4.06 of available credit, ended at -$0.74 — the provider allowed the run to complete rather than hard-stopping at zero balance).

Per-call token counts were mostly lost to a since-fixed logging bug; the one real measurement that survived is the reduce stage's profile-document call: **229,710 input tokens, 26,581 output tokens**.

Rough size of the static grounding documents actually being resent on every call (byte counts, not exact token counts):

| Document | Bytes | Purpose |
|---|---|---|
| Database schema doc | 75,179 | Full schema, all collections, unscoped to any module |
| Permission-role lookup (flattened) | 62,698 | Full role list, unscoped to any module |
| Database security-rules doc | 28,116 | Full rules, unscoped |
| Architecture overview doc | 27,619 | Narrative, not obviously scopable by module |
| Personas/authority-model doc | 8,606 | Narrative, small |
| Database index-definitions doc | 6,514 | Full, unscoped |
| Task-instruction/contract docs (×4) | ~30,415 combined | Differ between Stage A and Stage B |

A rough byte→token estimate puts the full grounding+contract overhead around 55-60K tokens — smaller than an earlier, never-actually-measured estimate of 150-200K. If that holds, **the 11 concatenated Stage-A narrative outputs, not the grounding docs, are the larger contributor** to the measured 229,710-token reduce-call input. Not yet confirmed with an exact tokenizer count.

Provider pricing as currently configured (per-million-token, most recent check; treat as volatile — this is exactly the instability the PM brief flags):
- Provider A's mid-tier model: $2-3 input / $10-15 output, 1,000,000-token context window.
- Provider A's smallest/cheapest model: $1 input / $5 output, but only a **200,000-token context window** — smaller than the single reduce call's measured input alone, confirming empirically (not just theoretically) that the cheapest tier can't handle this workload as currently shaped, regardless of quality.
- Provider B's flagship model: ~$1.25 input / $10 output (sourced from a third-party aggregator, moderate confidence — primary-source pricing wasn't reachable), 400,000-token context window.
- Provider C's model: configured but not yet cost-tested in this exercise; pricing/context window not yet verified.

## 5. What's already settled

- The three-tier framework (Section 3.1) and the principle that Tier 1/2 content must be complete regardless of how Tier 3 gets bundled.
- Facts are partitioned per module/capability before Phase 2 ever sees them (context-window fit, not a cost optimization — it was built to solve one module overflowing a single prompt).
- The generate-then-verify citation pattern and the "hint, not a label" principle (Section 3.1) — both chosen deliberately to protect trust over polish.
- **Splitting into smaller, more frequent calls is not a cost win by itself.** The dominant cost per call is the large, fixed grounding+contract overhead, resent identically every time; more/smaller calls multiplies that fixed cost across more repetitions for a shrinking marginal benefit. It only becomes cost-neutral-or-better paired with caching.

## 6. What's genuinely open — this is what we want fresh thinking on

**a. Which levels of the corpus actually need full narrative (Tier 3) synthesis, and where is it needed most?** If a given level's output could be a more compact, structured intermediate form instead of full prose, that saves output tokens at that level directly — and since outputs get concatenated wholesale into whatever consumes them next, it saves input tokens at the next level up too. This compounds through however many levels eventually exist — Section 3.3 proposes capability → module → repo → landscape as the likely shape; this question needs an answer at each of those, not just the one tested so far.

**b. Should the large, unscoped grounding documents be filtered per module?** Facts are already partitioned per module; the grounding documents are not. The two largest (database schema, permission-role lookup) are natural candidates, using facts already extracted (which database paths a module's code actually touches, which permission strings it actually checks) as a join key — the same partitioning principle already applied to facts, one level up. Real risk: the "which database paths does this module touch" signal is known to be incomplete in the current extraction (catches only literal path-string construction, not everything mediated through a shared access layer) — filtering on an incomplete signal risks silently dropping context a module actually needs, which would be a correctness regression, not just an efficiency gain. The permission-string signal is richer and probably safer to filter on.

**c. Prompt caching mechanics.** Not yet implemented anywhere in this pipeline. Real complications already identified in the current prompt structure: Stage A and Stage B use *different* contract documents ordered *before* the shared grounding documents in the prompt, which breaks prefix-sharing between the two stages even though both include the same grounding content; Stage B's two calls run in parallel, and most caching mechanisms only let a *later* request read a cache a *previous* request already finished writing — simultaneous requests can't cache off each other; and it's unverified whether reading from a cache extends its lifetime, which matters for whether a long sequential run (11+ calls) stays cached throughout or falls through partway. How would you architect for effective caching given these constraints, especially across three providers that may implement caching differently or not at all?

**d. Does this need to live in one continuous, CI/CD-triggered pipeline at all?** *(One open option among several here — flagging it clearly, but it shouldn't crowd out a-c.)* Phase 1 is cheap and fast enough to run synchronously on every merge without a second thought. Phase 2 is the expensive, slow part, and there's no inherent reason it must fire on the same trigger. An alternative: decouple them — Phase 1 stays merge-triggered; Phase 2 becomes a separately-triggered process (on-demand for a specific module, scheduled, or human-initiated after a merge), potentially in a different technical environment better suited to its actual shape — for instance, a genuine retrieval-augmented architecture over an indexed, queryable store, rather than reassembling one large synthesis prompt from scratch on every trigger. Worth exploring seriously, not just as a fallback if a-c don't pan out. Note this gets harder to avoid once Section 3.3's repo- and landscape-level reduces exist: an enterprise-wide overview can't sensibly be triggered by any single repo's merge event, since it depends on every repo's state, not just the one that changed.

## 7. The ask

We want genuinely different angles on how the fact-to-knowledge-base synthesis step should be structured — including on whether it belongs in this pipeline, this trigger model, or this technical environment at all. Prompt-level tweaks within the current architecture are welcome but not the primary thing we're looking for here.

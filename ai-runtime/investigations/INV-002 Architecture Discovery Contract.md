# INV-002 — Architectural Topology Discovery Contract

**Version:** 3.0

**Status:** Baseline Investigation Contract

**Phase:** Knowledge Pipeline — Phase 2

---

# Purpose

Transform the Engineering Evidence Layer into a reusable Architectural Topology Model.

INV-001 established evidence-led understanding of individual engineering modules.

INV-002 must now discover how those modules relate, collaborate, depend upon one another, exchange data, coordinate responsibilities, and expose integration boundaries.

The resulting Architectural Topology Model becomes a permanent Engineering Knowledge Corpus artefact.

Its purpose is to support:

* architectural understanding
* module relationship discovery
* dependency analysis
* ownership analysis
* impact analysis
* future cross-repository composition
* future AI investigations
* engineering governance
* progressive construction of the Engineering Knowledge Corpus

This investigation is one incremental step in the Knowledge Pipeline.

It must not attempt to produce complete business semantics, complete business workflows, or a finished platform knowledge model.

Knowledge must emerge progressively from verified engineering evidence across successive investigations.

---

# Investigation Principle

The primary objective is to discover architecture from the evidence already available.

Architectural synthesis must preserve the specific engineering concepts present in the Engineering Module Profiles.

Do not replace specific capabilities, services, resources, events, data structures, or integration mechanisms with generic architectural terminology.

For example, where evidence identifies:

* access creation
* access revocation
* pincode generation
* pincode deletion
* ACD synchronisation
* access ledger updates
* device activity processing
* Pub/Sub publication

the investigation must preserve those concepts in the resulting architectural interpretation.

A conclusion such as:

> `core` is an orchestration hub

is insufficient by itself.

It must explain what is orchestrated, using the terminology and evidence present in the source profiles.

Architectural abstraction may organise engineering knowledge.

It must not erase it.

---

# Information Preservation Rule

The investigation must preserve the dominant and architecturally significant concepts found within the Engineering Evidence Layer.

During synthesis:

* retain specific engineering nouns and verbs
* retain named platform capabilities
* retain domain-specific services and resources
* retain important lifecycle operations
* retain important event and data relationships
* retain uncertainty and evidence boundaries

Do not compress specific engineering meaning into generic labels such as:

* infrastructure
* platform services
* administration
* identity
* integration
* orchestration

unless the specific underlying responsibilities are also stated.

The prominence of concepts in the output should broadly reflect their prominence and architectural importance in the source evidence.

The investigation must not assume that every extracted capability has equal importance.

Architectural centrality, dependency reach, evidence density, and operational responsibility should be considered when describing significance.

---

# Investigation Objectives

Discover and classify:

* internal architectural topology
* external architectural topology
* module relationships
* capability distribution
* capability ownership
* architectural ownership
* responsibility boundaries
* authority boundaries
* orchestration topology
* dependency topology
* event topology
* data topology
* projection relationships
* lifecycle coordination
* infrastructure relationships
* integration surfaces
* cross-repository interface candidates

The investigation must identify what modules do together, not merely list which modules exist.

The investigation must discover architecture already present in the evidence.

It must not redesign the system.

---

# Knowledge Boundary

This investigation operates only on the current Engineering Evidence Layer.

It may identify:

* confirmed module responsibilities
* confirmed module relationships
* evidenced collaboration between modules
* evidenced access to shared data
* evidenced calls between services and controllers
* evidenced events
* evidenced triggers
* evidenced external integrations
* evidence-backed architectural patterns

It may cautiously infer:

* probable architectural responsibility
* probable orchestration ownership
* probable subsystem boundaries
* probable integration boundaries

Only where multiple evidence sources support the inference.

It must not infer:

* complete end-to-end business workflows
* product requirements
* user journeys
* undocumented business rules
* undocumented state machines
* undocumented external contracts
* intended future architecture
* missing implementation behaviour

Where the evidence does not yet expose a complete semantic or behavioural interpretation, record the limitation.

Do not fill the gap.

Later investigations may build on the topology produced here.

---

# Scope

The investigation is limited to architecture already evidenced within the Engineering Evidence Layer.

Do not:

* redesign modules
* optimise implementation
* recommend software changes
* invent missing interfaces
* invent module relationships
* invent business capabilities
* invent business workflows
* infer product intent from module names alone
* treat architectural documentation as stronger evidence than implementation evidence
* speculate beyond available evidence

Where uncertainty exists, it must remain visible.

---

# Evidence Priority

Use the following evidence priority when resolving conflicts.

## Priority 1 — Direct Engineering Evidence

Examples:

* service methods
* controller methods
* function entry points
* imports
* calls
* Firestore paths
* Pub/Sub topics
* triggers
* environment variables
* permission checks
* external API calls
* data models

## Priority 2 — Engineering Module Profiles

Use module profile interpretations where they remain directly traceable to engineering evidence.

## Priority 3 — Repository Architecture Documentation

Use architecture documents to provide context and terminology.

Do not allow architecture documentation to override contradictory implementation evidence.

## Priority 4 — Personas and Authority Documentation

Use these documents to clarify known actors, authority terminology, and organisational context.

Do not use them to invent code behaviour that has not been evidenced.

Where sources conflict, explicitly record the conflict.

---

# Inputs

## Previous Investigation

* INV-001 Internal Working Paper
* INV-001 Architecture Design Review Package

## Engineering Evidence

* Twelve Engineering Module Profiles

## Supporting Knowledge

* Firestore Schema
* Backend Services & Data Architecture
* Oskey Architecture
* Personas & Authority Model

---

# Role

Act as a Senior Software Architect and Engineering Knowledge Analyst.

Your responsibility is to discover and document the architectural topology already present within the Engineering Evidence Layer.

Think in terms of:

* modules
* responsibilities
* services
* data ownership
* calls
* dependencies
* events
* authority
* lifecycle coordination
* external boundaries
* system composition

Remain close to implementation evidence.

Do not reduce the repository to a generic enterprise architecture model.

Do not attempt to produce complete product semantics or business process documentation.

Preserve specific engineering meaning while identifying higher-level architectural structure.

---

# Architectural Principles

Always distinguish between:

* Confirmed
* Inferred
* Unknown

Every significant architectural conclusion must remain traceable to engineering evidence.

Never conceal uncertainty.

Never invent relationships.

Never convert an inference into a confirmed fact.

A module relationship is architecturally meaningful only when the nature of the relationship is described.

Do not state only:

> Module A depends on Module B.

State, where evidenced:

* what capability causes the dependency
* what service or controller creates the relationship
* what data, event, permission, or operation crosses the boundary
* whether the relationship is direct or indirect
* whether the relationship is confirmed or inferred

---

# Investigation Method

## Stage 1 — Module Responsibility Preservation

For every Engineering Module, identify and preserve:

* primary responsibilities
* provided capabilities
* owned concepts
* significant operations
* authoritative data ownership
* lifecycle responsibilities
* events published
* events consumed
* external systems used
* consumers
* producers

Do not rewrite specific responsibilities into generic architectural labels.

Where a module has multiple distinct responsibility groups, retain the distinction.

For example, a module may contain both:

* shared infrastructure primitives
* domain-specific orchestration

These must not be merged into a single generic responsibility.

---

## Stage 2 — Architectural Significance

Determine which responsibilities and capabilities are architecturally significant.

Consider:

* number of dependent modules
* number of cross-module calls
* ownership of authoritative data
* coordination of multi-module operations
* event publication
* event consumption
* external system boundaries
* security or authority responsibilities
* lifecycle control
* use as a shared foundation

Do not base architectural importance only on file count, method count, or module size.

Explain why a capability is significant.

Preserve the specific capability name.

In addition to high-level business functions, the investigation must identify and document architecturally significant, cross-cutting technical capabilities. The Pincode and Access Generation and Lifecycle Management are primary candidates and examples of such analysis. 

The documentation in the final report should include:

- The complete orchestration flow from generation (within core) to revocation.
- The "Paired Document" pattern where pincodes are written to both user-centric (/users/.../pincodes) and building-centric (/buildings/.../pincodes) collections to optimize for different query patterns.
- The role and purpose of the /buildings/{id}/pincode_trash collection in the security and audit lifecycle.
- The distinct pincode management flows for different personas, involving the user, supplier, and non-app-user modules.

The investigation must differentiate between standard administrative capabilities (e.g., CRUD) and high-risk 'Maintenance' or 'Repair' capabilities. If a module, such as admin, exhibits multiple distinct personalities, these must be cataloged and analyzed separately.

---

## Stage 3 — Internal Architectural Topology

Discover and classify all internal relationships.

Relationship categories include:

* ownership
* dependency
* orchestration
* authority
* infrastructure
* configuration
* event publication
* event consumption
* data projection
* data duplication
* lifecycle coordination
* shared utility use
* persistence access
* security enforcement

For every significant relationship include:

* source module
* target module
* relationship type
* specific capability or responsibility involved
* evidence
* confidence

Do not report relationships as unqualified module lists.

---

## Stage 4 — Capability Distribution

Identify capabilities that are implemented across more than one module.

For every distributed capability include:

* capability name
* primary owning or coordinating module
* participating modules
* responsibility of each module
* data involved
* events involved
* external integrations involved
* evidence
* confidence

Do not infer complete business workflows.

Describe only the evidenced engineering collaboration.

Example form:

> Access creation is coordinated by `core`, persists user-side and building-side access records through the corresponding modules, manages associated pincode and device-token concerns, and publishes ACD-facing synchronisation messages.

This is an architectural collaboration.

It is not a complete user or business workflow.

For any capability identified as an 'Event Router' or 'Message Processor' (e.g., PubSubMessageProcessor), the analysis must produce a routing table. This table must map each specific incoming message type or event to the exact downstream Module and Service/Handler that processes it.

---

## Stage 5 — External Architectural Topology

For every Engineering Module identify externally visible architectural contracts where evidenced.

Examples include:

* callable functions
* HTTP functions
* authentication triggers
* Firestore triggers
* Storage triggers
* Pub/Sub topics
* Cloud Tasks handlers
* external APIs
* external identity providers
* notification providers
* hardware-facing messages
* shared data contracts
* environment-based integration points

For each external boundary include:

* module
* interface type
* specific interface or capability
* external consumer or producer
* payload or data evidence, where available
* direction
* confidence

Do not describe an interface as a confirmed contract when only the existence of an integration hook is evidenced.

---

## Stage 6 — Capability and Responsibility Ownership

Determine:

* authoritative ownership
* persistence ownership
* orchestration ownership
* lifecycle ownership
* security or authority ownership
* event publication ownership
* integration ownership
* supporting responsibility

Where ownership is shared or ambiguous, preserve that ambiguity.

Do not force every capability into a single-module ownership model.

---

## Stage 7 — Architectural Systems

Group modules into larger architectural systems only where the grouping is strongly supported by the evidence.

For each proposed system include:

* system name
* purpose
* participating modules
* specific responsibilities contributed by each module
* owned or coordinated capabilities
* internal boundaries
* external responsibilities
* supporting evidence
* confidence

System names must be grounded in the actual capabilities present in the modules.

Avoid generic system labels unless the underlying engineering responsibilities are explicitly described.

A system classification must not conceal important module-level responsibilities.

The Capability and Responsibility Ownership Matrix should not be limited to user-facing business capabilities but must also include rows for critical backend processes. For example, a dedicated row for 'Pincode or Access Lifecycle Management' must be created to map its orchestration ownership (core) and data ownership across the user, building, and supplier modules.

---

## Stage 8 — Topology Analysis

Identify:

* architectural hubs
* orchestration hubs
* authority hubs
* infrastructure modules
* integration hubs
* boundary modules
* authoritative data modules
* projection-heavy modules
* event producers
* event consumers
* highly coupled areas
* weakly evidenced areas

For every hub or classification, explain:

* why it qualifies
* which specific capabilities create its importance
* which modules rely upon it
* which evidence supports the conclusion

Do not label a module as a hub without describing the engineering behaviour that makes it one.

---

## Stage 9 — Cross-Repository Readiness

Assess how well this repository's architecture can later be composed with knowledge from other repositories.

Identify:

* externally visible capabilities
* integration boundaries
* public interfaces
* event boundaries
* data contract candidates
* shared identifiers
* authority boundaries
* hardware-facing boundaries
* mobile-facing boundaries
* frontend-facing boundaries
* missing interface evidence
* undocumented integration surfaces
* assumptions preventing knowledge composition

This stage prepares future cross-repository investigation.

It must not attempt to perform cross-repository composition before the corresponding repository evidence exists.

---

# Output Requirements

Produce exactly one Markdown document.

Output filename:

**INV-002 Architectural Topology Discovery.md**

This document becomes part of the Engineering Knowledge Corpus.

Do not create multiple files.

Do not omit required sections.

Do not output conversational explanations.

Produce the document using the following structure.

---

# Required Document Structure

# INV-002 Architectural Topology Discovery

---

## Metadata

Include:

* Investigation
* Version
* Repository
* Evidence Version
* Generated Date
* Previous Investigation
* Classification
* Overall Confidence
* Status

---

## 1. Repository Architectural Identity

Describe, using only available evidence:

* the primary engineering purpose of the repository
* the most architecturally significant responsibilities
* the most significant capabilities
* the dominant integration boundaries
* the main architectural characteristics

The description must use the specific terminology present in the Engineering Module Profiles.

Do not provide a generic cloud-platform summary.

Do not claim complete business understanding.

---

## 2. Module Responsibility Catalogue

For every Engineering Module include:

* Primary Responsibilities
* Specific Capabilities
* Significant Operations
* Authoritative Ownership
* Lifecycle Responsibilities
* Events Published
* Events Consumed
* Consumers
* Producers
* Architectural Significance
* Confidence

Preserve the specific terminology found in the source module profile.

---

## 3. Architecturally Significant Capabilities

Identify the capabilities that are most significant to the repository architecture.

For each include:

* Capability
* Description
* Coordinating or Owning Module
* Participating Modules
* Significant Operations
* Data Involved
* Events or Messages Involved
* External Boundaries
* Evidence
* Confidence

Capabilities must be evidenced.

Do not construct complete product workflows.

The Description must include the key states of the capability's lifecycle or state machine, if evidenced (e.g., created, pending, active, expired, deleted). For transactional 'consume-and-delete' patterns, this must be explicitly stated.

---

## 4. Internal Architectural Topology

Document significant internal relationships.

For each relationship include:

* Source Module
* Target Module
* Relationship Type
* Specific Capability or Responsibility
* Data, Event, Call, or Authority Crossing the Boundary
* Evidence
* Confidence

Include:

* ownership
* authority
* orchestration
* dependencies
* infrastructure
* projections
* configuration
* lifecycle coordination
* event relationships

---

## 5. Capability Collaboration Map

Document capabilities implemented across multiple modules.

For every capability include:

* capability name
* coordinating or owning module
* participating modules
* responsibility of each module
* persistence relationships
* event relationships
* external integrations
* evidence
* confidence

This section must preserve specific engineering operations.

Do not reduce collaboration to module names alone.

---

## 6. External Architectural Topology

For every evidenced external boundary identify:

* Module
* Public Capability
* Interface Type
* Specific Interface
* Events Published
* Events Consumed
* Data Contract Evidence
* Integration Boundary
* External Consumer
* External Producer
* Confidence

Clearly distinguish:

* confirmed interface
* candidate interface
* undocumented contract
* inferred consumer

---

## 7. Capability and Responsibility Ownership Matrix

Produce a matrix showing:

Capability or Responsibility

↓

Primary Owner or Coordinator

↓

Supporting Modules

↓

Data Ownership

↓

Event or Integration Ownership

↓

External Consumers

↓

Confidence

Do not force single ownership where evidence indicates collaboration.

---

## 8. Architectural Systems

Describe higher-level systems that emerge from the evidence.

For each system include:

* purpose
* participating modules
* specific capabilities
* responsibility of each module
* boundaries
* integration responsibilities
* evidence
* confidence

Do not allow system-level abstraction to remove specific module capabilities.

---

## 9. Architectural Topology Findings

Identify architectural discoveries.

Examples include:

* architectural hubs
* orchestration hubs
* authority hubs
* shared infrastructure
* reusable capabilities
* integration boundaries
* event-driven relationships
* denormalized data relationships
* lifecycle coordination
* unexpected coupling
* significant cross-module dependencies
* identified design patterns and intent
* weak or incomplete architectural evidence

Every finding must identify the specific engineering capabilities that support it.

Only report discoveries supported by evidence.

Identified Design Patterns and Intent: For each major architectural pattern observed (e.g., 'Paired Document', 'Denormalized Ledger'), the analysis must also extract the design intent or reasoning for that pattern if it is available in the supporting architecture documents. Explain why the pattern was chosen (e.g., 'for read performance optimization', 'to decouple systems').


---

## 10. Cross-Repository Readiness

Assess the repository's readiness for future knowledge composition.

Discuss:

* evidenced external boundaries
* interface candidates
* event contracts
* data contract candidates
* shared identifiers
* likely repository interaction points
* missing contracts
* undocumented interfaces
* unsupported assumptions
* confidence

Do not perform cross-repository composition.

Prepare the architectural knowledge required for it.

---

## 11. Knowledge Gaps and Evidence Improvements

Identify gaps in the Engineering Evidence Layer.

Recommend only improvements to the corpus or evidence extraction.

Examples:

* missing payload structures
* unresolved Firestore paths
* missing trigger registration
* incomplete call relationships
* missing event schema
* missing permission evidence
* ambiguous module ownership
* undocumented integration boundary

For every improvement include:

* Improvement ID
* Title
* Missing Knowledge
* Why It Matters
* Current Evidence
* Required Evidence
* Expected Corpus Benefit
* Priority

Do not recommend software implementation changes.

---

## 12. Investigation Conclusions

Summarise:

* key architectural discoveries
* most significant capabilities
* strongest module relationships
* strongest evidence
* remaining uncertainty
* cross-repository readiness
* limits of the current investigation

Do not claim complete semantic or business understanding.

State clearly which knowledge remains for future investigation phases.

---

## 13. Candidate Future Investigation Themes

Identify evidence-led themes that may justify later investigation.

Do not select or prescribe the next investigation.

Do not create a roadmap.

Examples may include:

* external event contract discovery
* data lifecycle discovery
* authority topology discovery
* cross-repository interface discovery
* capability-specific architectural investigation

Final investigation selection remains a human governance decision.

---

# Output Validation

The investigation is complete only when:

* exactly one Markdown document has been produced

* the filename is exactly:

  **INV-002 Architectural Topology Discovery.md**

* every required section exists

* no required section is empty

* every significant finding is traceable to engineering evidence

* confirmed and inferred findings remain clearly distinguished

* uncertainty is preserved

* no unsupported relationships have been introduced

* specific engineering concepts from the module profiles remain visible

* architectural labels are supported by specific capabilities

* distributed capabilities identify participating module responsibilities

* no complete business workflow has been invented

* no future architecture has been proposed

* cross-repository composition has not been attempted prematurely

---

# Failure Conditions

The investigation has failed if:

* the repository is described primarily using generic architecture terminology
* significant engineering capabilities present in the module profiles disappear from the synthesis
* a major architectural conclusion is unsupported by engineering evidence
* modules are listed without explaining their collaboration
* architecture documentation overrides stronger code evidence
* specific responsibilities are replaced by generic labels
* system groupings conceal important module responsibilities
* complete business workflows are invented
* business semantics are asserted beyond available evidence
* the investigation jumps ahead to downstream corpus use cases
* the output resembles a generic enterprise architecture review
* the resulting artefact cannot support later inter-module or cross-repository reasoning

---

# Success Criteria

The investigation succeeds when:

* every Engineering Module participates in the Architectural Topology Model
* significant module responsibilities remain visible
* architecturally significant capabilities are explicit
* internal topology is described through evidenced relationships
* distributed capabilities identify the responsibility of each participating module
* external topology is documented wherever evidenced
* capability and responsibility ownership are explicit
* architectural systems emerge naturally from engineering evidence
* architectural abstractions preserve underlying engineering meaning
* reusable architectural boundaries and contract candidates are identified
* uncertainty and knowledge gaps remain visible
* the repository is better prepared for future cross-repository knowledge composition
* the output adds a verified architectural layer to the Engineering Knowledge Corpus
* the investigation remains within the knowledge boundary of Phase 2

The resulting document must be suitable for direct inclusion in the Engineering Knowledge Corpus and for consumption by future AI investigations without modification.

# Knowledge Pipeline — Phase 2

# Architecture Synthesis Charter

**Version:** 0.1 (Draft)

**Status:** Work In Progress

---

# Purpose

Phase 1 established a deterministic Engineering Knowledge Corpus by extracting validated knowledge directly from the production codebase.

Phase 2 builds upon that foundation.

Its purpose is to synthesise the implementation-level knowledge into a coherent architectural understanding of the OSkey platform.

Rather than documenting individual services, controllers or Firestore collections in isolation, this phase explains how the platform behaves as an integrated system.

The outcome is intended to become the canonical Architecture Knowledge Layer for both humans and AI systems.

---

# Vision

Create a living Architecture Knowledge Layer capable of explaining:

* how the platform works
* why it has been designed this way
* how business domains interact
* how workflows execute
* where data originates
* how information is replicated
* how hardware is synchronised
* how security boundaries are enforced
* how changes propagate across the ecosystem

Instead of repeatedly analysing thousands of source files, both humans and AI should be able to reason from this architectural model.

---

# Strategic Objective

The long-term objective is not documentation.

The objective is to create an executable organisational knowledge layer that enables accurate reasoning across Product, Engineering, QA, Operations, Security and future AI orchestration platforms.

The knowledge corpus becomes a strategic business asset rather than a collection of documents.

---

# Guiding Principles

## Evidence before opinion

Architectural statements should be supported by evidence wherever possible.

Preferred evidence sources are:

* Production source code
* Engineering Knowledge Corpus (Phase 1)
* Approved operating model documentation
* Workflow models
* Architecture decision records
* Product specifications

Where evidence is unavailable, assumptions must be clearly identified.

---

## Deterministic before speculative

The Architecture Knowledge Layer describes how the platform currently operates.

Future ideas, roadmap discussions and design proposals should remain clearly separated from documented platform behaviour.

---

## Explain intent as well as implementation

Architecture should answer both questions:

> What does the platform do?

and

> Why was it designed this way?

Understanding design intent is considered equally important as understanding implementation.

---

## Human and machine readable

Every document should be optimised for:

* human understanding
* AI reasoning
* GitHub automation
* retrieval systems
* future orchestration platforms

The knowledge should remain accessible regardless of which AI technologies are adopted in the future.

---

# Living Knowledge

This Architecture Knowledge Layer is intentionally designed as a living engineering asset.

It is expected to evolve alongside the production platform.

The objective is continual improvement rather than static completeness.

Every iteration should increase the quality, accuracy and usefulness of the knowledge.

---

# Continuous Validation

The corpus welcomes review from:

* Product
* Engineering
* QA
* Operations
* Security
* Architecture
* AI systems

Feedback that identifies:

* inaccuracies
* inconsistencies
* missing relationships
* architectural drift
* duplicated concepts
* obsolete knowledge
* opportunities for simplification

should be considered valuable input into future revisions.

Improvement is expected.

---

# AI Participation

AI systems are expected to participate as reviewers as well as consumers.

AI should actively identify:

* documentation gaps
* conflicting information
* inconsistent terminology
* undocumented behaviours
* unnecessary complexity
* opportunities for simplification
* architectural drift

Suggestions should always distinguish between:

* confirmed observations
* inferred conclusions
* recommendations

The corpus values evidence above confidence.

---

# Governance Philosophy

Every AI should be treated as a peer reviewer rather than an authority.

No individual model is considered the source of truth.

Instead, confidence emerges through comparison, validation and evidence gathered from multiple independent sources.

The governance hierarchy is therefore:

1. Production platform
2. Validated business knowledge
3. Architecture Knowledge Layer
4. AI reasoning
5. Human governance

---

# Primary Deliverables

## 1. Domain Architecture

Canonical descriptions of every business domain.

Examples include:

* Organisations
* Entities
* Properties
* Buildings
* Units
* Users
* Residents
* Suppliers
* Access
* Invitations
* Hardware
* Intercom
* Calls
* Notifications

Each domain should document:

* responsibilities
* ownership
* lifecycle
* dependencies
* interfaces
* consumers
* events
* business rules

---

## 2. System Interaction Maps

Cross-domain architectural diagrams showing how services, domains and workflows interact.

These maps should explain the movement of information rather than software implementation.

---

## 3. Canonical Data Ownership

Identify:

* authoritative source
* derived projections
* consuming services
* external consumers

for every significant business entity.

This should become the definitive explanation of data ownership across the platform.

---

## 4. Event Catalogue

Document every significant business event.

Each event should include:

* trigger
* orchestrator
* upstream dependencies
* downstream effects
* Firestore impact
* hardware impact
* messaging
* audit implications

---

## 5. Connected Workflow Graph

Rather than isolated workflow documents, create one connected operational graph.

Every workflow should reference:

* personas
* permissions
* business rules
* events
* architectural domains
* hardware
* notifications
* audit trails

---

## 6. Architectural Patterns

Identify reusable architectural patterns across the platform.

Examples include:

* orchestration services
* fan-out
* denormalisation
* projections
* transactional state machines
* consume-and-delete
* audit trails
* configuration-as-data
* hierarchical RBAC
* eventual consistency
* hardware projection
* event-driven synchronisation

These become architectural principles rather than implementation details.

---

## 7. System Constraints

Capture platform-wide constraints that should rarely change.

Examples include:

* Principle of Least Privilege
* Client-scoped data isolation
* Firestore as the authoritative data source
* MongoDB as the hardware projection
* Access Services as the only provisioning path
* Projection documents are never authoritative
* Hardware synchronisation occurs asynchronously
* Security boundaries are enforced before convenience

These constraints form the architectural guardrails for both engineers and AI systems.

---

## 8. AI Reasoning Layer

The Architecture Knowledge Layer is designed to support multiple specialist AI agents rather than a single document generation workflow.

Potential reasoning agents include:

* Discovery Agent
* Architecture Agent
* Impact Analysis Agent
* Product Agent
* Engineering Agent
* QA Agent
* Operations Agent
* Governance Agent
* Knowledge Agent

Each agent should reason over the same shared architectural knowledge rather than independently analysing the production codebase.

---

# Outputs

Atomic PRDs are one possible output of the Architecture Knowledge Layer.

They are not its primary purpose.

Expected outputs include, but are not limited to:

## Product

* Discovery reports
* Product briefs
* Feature specifications
* Atomic PRDs
* Epics
* User stories
* Acceptance criteria

## Engineering

* Technical designs
* Architecture reviews
* Impact analysis
* Engineering tasks
* Migration plans
* Release plans

## Quality

* Test strategies
* Regression plans
* Risk assessments
* Scenario coverage

## Operations

* Deployment runbooks
* Operational playbooks
* Monitoring recommendations
* Incident analysis

## Governance

* Security reviews
* Privacy assessments
* RBAC validation
* Compliance documentation
* Architecture conformance

## Knowledge

* Gap analysis
* Drift detection
* Corpus validation
* Documentation improvements

---

# Long-Term Vision

The long-term objective is to establish a shared architectural reasoning layer that can support future AI orchestration across the organisation.

The Architecture Knowledge Layer should remain stable while AI technologies evolve.

Whether reasoning is performed by GitHub agents, Gemini Workflow Agents, OpenAI Agents, Claude, Codex, self-hosted models or future orchestration platforms should become an implementation choice rather than an architectural dependency.

Knowledge becomes the platform.

AI becomes interchangeable.

---

# Definition of Success

Phase 2 will be considered successful when:

* humans can understand the platform without reading the production code
* AI can reason accurately without repeatedly analysing the production repository
* architectural decisions become easier to explain and review
* change impact becomes predictable
* knowledge improves continuously through evidence-based validation
* the Architecture Knowledge Layer becomes the shared reasoning foundation for future product, engineering and operational workflows.

---

> *"The objective is not to document the platform. The objective is to teach both humans and machines how the platform thinks."*

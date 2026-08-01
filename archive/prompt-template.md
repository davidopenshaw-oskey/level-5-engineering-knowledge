# Phase 2: Inter-Module Architectural Synthesis Prompt

**Target Repository**: `firebase-oskey-dev` (Oskey Cloud Functions Backend)  
**Input Evidence**: 12 Module Evidence Graphs and Raw Facts in `output/runs/<runId>/knowledge-pipeline/modules/`  
**Output Document**: `INV-002 Architectural Topology Discovery.md`  
**Rule File Enforced**: [`.gemini/rules/architectural-synthesis-hierarchy.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/.gemini/rules/architectural-synthesis-hierarchy.md)

---

## Instructions for AI Synthesis Agent

Act as a Senior Software Architect and Engineering Knowledge Analyst. Your task is to perform Inter-Module Architectural Synthesis on the Oskey Cloud Functions Backend using ONLY the verified AST facts from Phase 1 and 1.5.

Follow the 8-Stage Execution Protocol below.

---

### Stage 1 — Module Responsibility Preservation
For every one of the 12 modules (`access_control_device`, `admin`, `apps`, `building`, `call`, `core`, `organization`, `settings`, `supplier`, `tasks`, `unit_management`, `user`), detail:
- Primary Responsibilities & Specific Capabilities
- Significant Operations
- Authoritative Data Ownership (e.g. `/users`, `/buildings`, `/organizations`)
- Events Published & Consumed
- Consumers & Producers
- Architectural Significance & Confidence Level

*Rule*: Do NOT rewrite domain-specific operations into generic architectural labels (e.g., maintain exact terms like `createAccess`, `generatePincode`, `deleteBuildingPincodeAndMoveToTrash`).

---

### Stage 2 — Architecturally Significant Capabilities & Personalities
Identify and document the cross-cutting, multi-module technical capabilities:
1. **Physical Access Provisioning & Revocation**
2. **Pincode Generation and Lifecycle Management** (Document the `Paired Document Pattern` across `/users/{id}/pincodes` and `/buildings/{id}/pincodes`, and the audit role of `/buildings/{id}/pincode_trash`).
3. **User Identity & Profile Cascade** (Trace `_cascadePublicProfileChange` across `user`, `building`, `organization`).
4. **Real-time Intercom Calling State Machine** (`call`, `building`, `apps`).
5. **Role-Based Access Control (RBAC)** (`settings`, `checkUserPermissions`).

*Rule*: Separate standard administrative CRUD capabilities from high-risk maintenance/repair mutators (e.g. `admin` data backfill operations).

---

### Stage 3 — Internal Architectural Topology & Inter-Module Call Matrix
Discover and document all inter-module relationships across 5 categories:
1. **Ownership Topology** (Canonical entity owners)
2. **Dependency Topology** (Identity dependency on `user`, infrastructure dependency on `core`, security dependency on `settings`)
3. **Orchestration Topology** (Central orchestrators: `core`, `unit_management`, `admin`)
4. **Data & Projection Topology** (Authoritative source vs read-optimized access ledgers)
5. **Inter-Module Method Call Matrix** (Table mapping: `Source Module` ➔ `Source Method` ➔ `Target Module` ➔ `Target Service Method`).

---

### Stage 4 — Event Routing Table & Pub/Sub Topology
For every asynchronous trigger, message processor, and Pub/Sub topic, construct a structured **Event Routing Table**:

| Message Type / PubSub Topic / Trigger | Originating Event | Target Module | Target Service Class | Handler Method |
| :--- | :--- | :--- | :--- | :--- |

---

### Stage 5 — Architectural Systems Grouping
Group the 12 modules into 4 grounded architectural subsystems:
1. **Identity & Access Management System** (`user`, `core`, `settings`)
2. **Physical & Logical Asset Management System** (`organization`, `building`, `unit_management`)
3. **Hardware & Edge Integration System** (`access_control_device`, `call`, `tasks`)
4. **Administrative & Communications System** (`supplier`, `admin`, `apps`)

---

### Stage 6 — Platform Guardrails & System Invariants
List the architectural guardrails and invariant constraints enforced across the codebase:
- Principle of Least Privilege
- Client-scoped data isolation
- Firestore as authoritative data source; MongoDB as hardware projection
- `OSKAccessService` in `core` as the sole physical access provisioning path
- Projection documents are never authoritative

---

### Stage 7 — External Architectural Topology & Cross-Repository Boundaries
Map externally visible integration boundaries:
- Callable Functions catalog (253 functions)
- Pub/Sub topics (`OSK_PUBSUB_TOPIC_ACD_ACCESSES`, `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`)
- Storage triggers & Firebase Auth triggers
- HTTP endpoints for ACD Intercom devices & Cloud Tasks

---

### Stage 8 — Knowledge Improvements & Gap Cataloguing (`KI-XXX`)
Record explicit Knowledge Improvements for missing evidence or undefined boundaries:
- `KI-001`: Define and Document Pub/Sub Message Payload Schemas
- `KI-002`: Document API Gateway Authorization & Middleware Patterns
- `KI-003`: Reconcile Firestore Path Naming Conflicts

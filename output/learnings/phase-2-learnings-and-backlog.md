# Phase 2 Learnings, Backlog & Feedback Loops

**Run ID**: `20260724_101041-1aa319b1`  
**Repository**: `firebase-oskey-dev`  
**Phase**: Phase 2 (Inter-Module Architectural Synthesis)  
**Output Artifact**: [`INV-002 Architectural Topology Discovery.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/output/runs/20260724_101041-1aa319b1/INV-002%20Architectural%20Topology%20Discovery.md)  
**Philosophy**: *Iterate, Learn, Refine* — Inter-module discoveries log feedback items for earlier and later pipeline phases.

---

## 1. Phase 2 Key Synthesis Outcomes

1. **Synthesized 12 Modules into 4 Subsystems**:
   - Identity & Access Management System (`user`, `core`, `settings`)
   - Physical & Logical Asset Management System (`organization`, `building`, `unit_management`)
   - Hardware & Edge Integration System (`access_control_device`, `call`, `tasks`)
   - Administrative & Communications System (`supplier`, `admin`, `apps`)

2. **Cross-Module Call & Event Matrix Mapped**:
   - Built the complete inter-module method call table (`unit_management` $\rightarrow$ `core.OSKAccessService`, `supplier` $\rightarrow$ `core.OSKAccessService`, `user` $\rightarrow$ `core.OSKAccessUpdateService`).
   - Mapped the **Event Routing Table** for Pub/Sub activity processing and Auth/Firestore triggers.

3. **Grounded Architectural Patterns Captured**:
   - **Paired Document Pattern**: Double-entry PIN writes (`/users/{id}/pincodes` and `/buildings/{id}/pincodes`) with audit recycling via `/buildings/{id}/pincode_trash`.
   - **Profile Cascade Fan-out**: `_cascadePublicProfileChange` propagating profile updates across organizations, buildings, and unit inhabitant lists.
   - **Non-Negotiable Guardrails**: `OSKAccessService` in `core` established as the sole physical access provisioning path.

---

## 2. Active Feedback Loops & Knowledge Improvements (`KI-XXX`)

| Item ID | Triggering Context | Discovery / Observed Limit | Feedback Action (To Revisit in Phase 3 or Phase 4) |
| :--- | :--- | :--- | :--- |
| **KI-001** | Cross-Repo IoT Integration | `OSK_PUBSUB_TOPIC_ACD_ACCESSES` messages lack explicit JSON schemas in backend AST. | When processing IoT / Hardware repos in Phase 3/4, extract hardware-side message parser types to define the canonical Pub/Sub schema. |
| **KI-002** | Security Audit | Middleware authorization decorators around HTTPS Callable entry points are implicitly configured. | In Phase 2.5 or Phase 3, build an explicit authorization decorator analyzer to extract exact RBAC permission requirements per API endpoint. |
| **KI-003** | Data Model Consistency | Minor path naming variation (`/pendingUnitInvitations` vs `/pendingInvitations`). | Standardize path naming in `firestore-schema.md` prior to multi-repo PRD generation. |

---

## 3. Phase Handoff Status

- **Status**: **Phase 2 Complete & Validated for `firebase-oskey-dev`**.
- **Synthesized Document**: [`INV-002 Architectural Topology Discovery.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/output/runs/20260724_101041-1aa319b1/INV-002%20Architectural%20Topology%20Discovery.md)
- **Next Step Options**:
  - Perform single-repo evaluation on the **next repository** in the ecosystem (e.g. Mobile Apps, Web Admin Portal, or IoT Firmware) following the bottom-up hierarchy rules.
  - Test Impact Analysis & Atomic PRD queries on the synthesized `firebase-oskey-dev` cloud backend.

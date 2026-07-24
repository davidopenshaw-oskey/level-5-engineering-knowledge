# Iterative Refinement Backlog & Lessons Learned (Phase 1 & 1.5 Baseline)

**Run ID**: `20260724_101041-1aa319b1`  
**Philosophy**: *Learn & Iterate* — Capture architectural insights, known constraints, and deferred refinements to revisit after Phase 2 (Inter-Module Synthesis) or during multi-repo processing.

---

## 1. Proven & Verified Capabilities (Solid Foundation)

- **Source Scope**: 100% code coverage across 539 TypeScript source files in `firebase-oskey-dev`.
- **AST Fact Extraction**: 13,110 extracted facts, including 253 callable API contracts, 341 type aliases, 43 enums, and 1,043 model properties.
- **Pipeline Reproducibility**: `00-scan-repo` enforces 100% clone purity and Git commit SHA tracking (`1aa319b1`).
- **AI Synthesis Rules**: Established `.gemini/rules/architectural-synthesis-hierarchy.md` to enforce bottom-up, grounded reasoning.

---

## 2. Iterative Backlog: Items to Revisit Post-Phase 2

| Item # | Area / Topic | Current State (Phase 1.5) | Post-Phase 2 / Multi-Repo Iteration Target |
| :--- | :--- | :--- | :--- |
| **REF-01** | **Generic Wrapper Type Expansion** | Generic wrapper types (e.g. `OSKDocument<T>`, `OSKWithOrganizationId & T`) are captured as raw type strings. | In Phase 2, build a **Type Resolution Expander** to recursively flatten generic wrapper types into fully realized JSON schemas. |
| **REF-02** | **Event-Driven Side Effects Matrix** | 30 Firestore triggers and PubSub topics are recorded as isolated facts per module. | In Phase 2, link write operations in Module A (e.g., `user`) to triggers that execute logic in Module B (e.g., `building`), producing an **Event-Driven Side-Effects Matrix**. |
| **REF-03** | **Firestore Collection ↔ Model Mapping** | Collection path hints (129 paths) and TypeScript Document interfaces exist in separate fact streams. | In Phase 2, combine path patterns (e.g. `/buildings/{id}/units/{id}`) with document model types (e.g. `OSKBuildingUnitDocument`) into a canonical **Firestore Data Schema Directory**. |
| **REF-04** | **Schema Drift Comparison (Client ↔ Cloud)** | Cloud backend API contract schemas (253 functions) are fully indexed. | In Phase 3 & 4 (Mobile & Web repos), run an automated diff comparing client-side API payload interfaces against cloud callable schemas to detect schema drift. |
| **REF-05** | **Permission Dependency Graph** | 698 permission checks (`v1.org.*`, `v1.building.*`) are extracted as isolated module facts. | In Phase 2, aggregate permission checks into a unified **Role-Based Access Control (RBAC) Entitlement Matrix**. |

---

## 3. Recommended Workflow Action

1. **Proceed to Phase 2 (Inter-Module Architectural Synthesis)** with complete confidence in our Phase 1 & 1.5 AST fact foundation.
2. **Review & Fulfill Backlog Items** (REF-01 through REF-05) as Phase 2 outputs are synthesized.

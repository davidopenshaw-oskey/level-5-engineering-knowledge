# work-order.md

# Task

Generate an Engineering Module Profile for the supplied module.

The profile should explain how the module fits within the OSkey platform and how it implements its architectural responsibilities.

Interpret the supplied engineering evidence using the architectural grounding documents.

Do not treat the AST evidence as isolated source code.

Use the architecture, Firestore schema and RBAC context to understand the implementation before describing it.

For each section of the required output listed below, evidence must be listed as concrete evidence items, not only source documents.

Prefer this format:

- Architecture: Building scope is the physical anchor for ACDs.
- Service: OSKBuildingDoorService
- Controller: OSKBuildingController.update
- Method: createOrUpdateBuildingAccess
- Firestore path: /buildings/{buildingId}/doors
- Permission: v1.org.buildings.edit
- Evidence artefact: building-evidence-graph.json
- Architecture document: Oskey Architecture.md


---

# Required Output

## 1. Executive Summary

Summarise the purpose of the module within the overall platform.

## 2. Architectural Position

Describe where the module sits within the platform architecture.

Identify:

* parent scope
* owned concepts
* provided capabilities

## 3. Primary Responsibilities

Describe the responsibilities implemented by the module.

Separate confirmed evidence from interpretation.

## 4. Public Interfaces

Summarise controllers, exported services and public entry points.

## 5. Internal Structure

Describe the internal decomposition into services, controllers and supporting components.

## 6. Firestore & Data Ownership

Describe Firestore persistence.

Where possible distinguish between:

- Primary persistence
- Confirmed collection paths
- Confirmed nested structures
- Candidate denormalised structures
- Candidate fan-out targets

Do not claim ownership unless supported by architecture grounding.


## 7. Permissions & Security

Summarise permission evidence and security boundaries.

Do not infer complete RBAC behaviour.

## 8. Cross-Module Relationships

Identify only relationships directly supported by the supplied evidence.

Do not expand into workflow descriptions.

## 9. External Hooks

Identify candidate external boundaries.

Clearly distinguish confirmed integrations from architectural candidates.

## 10. Architectural Observations

Describe architectural characteristics supported by evidence.

Examples include:

* separation of concerns
* coupling
* layering
* orchestration
* denormalisation
* fan-out

## 11. Risks & Open Questions

Identify missing evidence, uncertainty and implementation questions.

Do not answer them.

## 12. Evidence References

Reference the supporting evidence for significant observations.

Use concrete references wherever possible.

---

# Writing Style

Write as an experienced enterprise software architect documenting an existing production platform.

Write for:

* engineering leadership
* product management
* developers
* solution architects

The output should improve engineering understanding rather than recommend design changes.

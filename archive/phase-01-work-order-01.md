# AI Task Contract

**Task:** Module Engineering Profile

**File:** work-order.md

**Version:** 1.0

**Status:** Baseline Investigation Contract

**Phase:** Knowledge Pipeline — Phase 1


# Task

Generate Engineering Module Profiles for the supplied modules.

The profile should explain how the module fits within the Oskey platform and how it implements its architectural responsibilities.

Interpret the supplied engineering evidence using the architectural grounding documents.

Do not treat the AST evidence as isolated source code.

Use the architecture, Firestore schema and RBAC context to understand the implementation before describing it.

For each section of the required output listed below, evidence must be listed as concrete evidence items, not only source documents.

Use this example from the building module as the engineering profile format:

- Architecture: Building scope is the physical anchor for ACDs.
- Service: OSKBuildingDoorService
- Controller: OSKBuildingController.update
- Method: createOrUpdateBuildingAccess
- Firestore path: /buildings/{buildingId}/doors
- Permission: v1.org.buildings.edit
- Evidence artefact: building-evidence-graph.json
- Architecture document: Oskey Architecture.md


---


# Inputs

This task requires the following input files for the target module.

## Engineering Evidence

The primary source of truth for the module's implementation.

- `output/runs/<runId>/knowledge-pipeline/modules/<moduleName>/<moduleName>-evidence-graph.json`

## Architectural Grounding

These documents provide the necessary architectural context to interpret the engineering evidence.

- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/Oskey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `ai-runtime/contracts/module-engineering-profile/cross-repository-architecture.md`

## Supporting Contracts

These documents define the rules, persona, and output format for the task.

- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`

# Execution Method

1.  **Build Context:** Read and understand all `Architectural Grounding` and `Supporting Contracts` documents first.
2.  **Analyze Evidence:** Read and analyze the `Engineering Evidence` file for the target module.
3.  **Generate Profile:** Following the persona, rules, and output schema, generate the engineering profile by executing the `Task` defined below.

---



# Required Output

## Output Paths

These instructions will output 2 files per module.

Generated documentation artifacts should be saved to the following versioned paths under `output/docs/runs/<runId>/`:

Below the `output/docs/runs/<runId>/` path creaate the 2 following documents``

- **Module Engineering Profiles**: `engineering-profiles/<moduleName>-engineering-profile.md`
- **API References**: `apis/<moduleName>-api-reference.md`


## 0. Generation Metadata

Read the `runId` and `generatedAt` fields from the root of the evidence graph file (`*-evidence-graph.json`).

Populate the "Generation Metadata" section with these values.

## 1. Executive Summary

Summarise the purpose of all the modules within the platform.

## 2. Architectural Position

Describe where the modules sit within the platform architecture.

State your confidence level.

Identify:

* parent scope
* owned concepts
* provided capabilities

## 3. Primary Responsibilities

Describe the responsibilities implemented by the module.

State your confidence level for each identified capability.

Separate confirmed evidence from interpretation.

## 4. Public Interfaces

Summarise controllers, exported services and public entry points.

## 5. Internal Structure

Describe the internal decomposition into services, controllers and supporting components.

For cross-module dependencies, identify the target module where possible.

## 6. Firestore & Data Ownership

Describe Firestore persistence.

State your confidence level.

Where possible distinguish between:

- Primary persistence
- Confirmed collection paths
- Confirmed nested structures
- Candidate denormalised structures
- Candidate fan-out targets

## 7. API Endpoints

Summarise the module's public API contracts.

Using `api_contract` facts from the evidence graph, populate the "Callable Functions" table.

For the "Request Schema" column, present the `requestSchema` from the evidence as a formatted JSON code block.

## 8. Firestore Triggers

Describe Firestore document triggers exposed by the module.

For each trigger, identify:

- **Trigger Type**: e.g., `onCreate`, `onUpdate`.
- **Firestore Path**: The path the trigger is attached to.
- **Handler**: The function or method that executes.
- **Likely Side Effect**: To determine this, look for `call_expression` facts in the evidence graph that originate from the same source file as the trigger handler. Report the most significant calls made by the handler.

State your confidence level for each trigger's side effect.

## 9. Permissions & Security

Summarise permission evidence and security boundaries.

If you find conflicting evidence (e.g., a permission string in the code that is not in the RBAC document), report it as a risk in the "Risks & Open Questions" section.

## 10. Cross-Module Relationships

Identify only relationships directly supported by the supplied evidence. 

When citing an `imports_dependency` fact, analyze the import path to determine the likely target module (e.g., an import from `.../modules/user/...` indicates a dependency on the `user` module).

If a dependency appears to cross a repository boundary, state the likely target repository and explicitly note that the interface definition is pending further analysis. For example: `[Interface definition pending analysis of the 'middleware-node' repository]`.

## 11. External Hooks

Identify candidate external boundaries.

Clearly distinguish confirmed integrations from architectural candidates.

For hooks that connect to other internal repositories (e.g., a Pub/Sub topic consumed by the middleware), state the likely consuming repository and explicitly note that the contract is pending further analysis.

## 12. Architectural Observations

Describe architectural characteristics supported by evidence.

Examples include:

* separation of concerns
* coupling
* layering
* orchestration
* denormalisation
* fan-out

## 13. Risks & Open Questions

Identify missing evidence, uncertainty and implementation questions.

Do not answer them.

## 14. Evidence References

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

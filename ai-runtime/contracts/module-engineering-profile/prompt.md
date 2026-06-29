# Task: Generate Module Engineering Profile

## Objective

Generate a human-readable Engineering Module Profile from the supplied deterministic engineering evidence.

The objective is to explain the module's current engineering structure, responsibilities and architectural relationships.

The profile should improve engineering understanding without introducing unsupported assumptions.

---

# Required Input


This task requires the following input artefacts consisting of the contract, your persona, your rules and the specific modules for analysis. 

## Mandatory

### Step 1. Contracts, personas and rules
contract.md
persona.md
rules.md

### Step 2. Architecture

Oskey Architecture.md
Purpose:
Authoritative description of the platform, terminology,
business capabilities and ownership boundaries.

firestore-schema.md,firestore.rules.txt,firestore-index.json
Purpose:
Authoritative explanation of current firestore schema, indexes and rules.

OSkey Backend Services & Data Architecture.md
Purpose:
Can only provide background information which needs to be verified through AST discovery as this grounding document may be stale or partially superseded.  

### Step 3. AST

AST
Purpose:
Implementation evidence.

Use to verify and locate implementation,
not to redefine platform terminology.


| Artefact | Purpose |
|----------|---------|
| building-manifest.json | Module summary and statistics |
| building-services.json | Service definitions and methods |
| building-controllers.json | Controller definitions and methods |
| building-evidence.json | Raw engineering evidence |
| building-evidence-graph.json | Normalised evidence graph |


---

# Required Output

Generate the following sections.

## 1. Module Summary

Provide a concise overview of the module.

Describe its apparent purpose and overall responsibility.

---

## 2. Primary Responsibilities

Identify the primary responsibilities supported by the evidence.

Do not infer responsibilities that are not evidenced.

---

## 3. Public Interfaces

Describe the module's externally visible interfaces.

Examples include:

- Controllers
- Exported services
- Public methods
- Entry points

---

## 4. Internal Structure

Summarise the module's internal engineering structure.

Include:

- Services
- Controllers
- Major classes
- Supporting components

---

## 5. Firestore Usage

Summarise all Firestore collections referenced by the module.

Where possible distinguish between:

- likely reads
- likely writes
- uncertain usage

---

## 6. Permissions

Summarise permissions identified within the evidence.

Do not speculate about RBAC behaviour beyond the supplied evidence.

---

## 7. Cross-Module Dependencies

Describe relationships with other modules.

Identify dependencies that appear significant.

---

## 8. External Hooks

Summarise candidate integrations outside the current repository.

Examples include:

- mobile applications
- intercom systems
- middleware
- notification services
- external APIs

These should always be presented as candidate architectural boundaries unless confirmed elsewhere.

---

## 9. Architectural Observations

Provide high-level engineering observations.

Examples may include:

- strong separation of concerns
- high coupling
- duplicated responsibilities
- dependency concentration
- missing abstraction

Only include observations supported by the evidence.

---

## 10. Risks and Open Questions

List areas where the available evidence is insufficient.

Do not attempt to answer these questions.

---

## 11. Evidence References

Where practical, reference the evidence supporting significant observations.

Examples include:

- service names
- controller names
- Firestore collections
- permissions
- evidence graph fact types
- source file paths

---

# Writing Style

Write as an experienced software architect documenting an existing enterprise platform.

The output should be suitable for:

- engineering onboarding
- architecture documentation
- technical product management
- impact analysis

The document should describe the current system rather than propose future improvements.

Avoid implementation recommendations unless specifically requested.
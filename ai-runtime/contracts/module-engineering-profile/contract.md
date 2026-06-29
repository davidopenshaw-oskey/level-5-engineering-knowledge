# contract.md

# AI Task Contract

**Task:** Module Engineering Profile

## Purpose

Generate an evidence-backed Engineering Module Profile for a single Oskey module.

The objective is to transform deterministic engineering evidence into a human-readable engineering document that accurately describes the module's responsibilities, structure and architectural role.

This task is **Pass 1** of the Knowledge Pipeline.

It documents **one module only**.

It does **not** attempt to synthesise platform-wide behaviour, workflows or cross-repository interactions.

---

# Runtime Instructions

This document is the primary execution controller for this task.

Read this document first.

Follow the execution sequence exactly as defined.

Do not begin generating the output until all required input artefacts have been reviewed.

If any mandatory artefact is missing, state which artefact is missing before attempting the task.

---

# Execution Order

The AI should process the supplied inputs in the following order.

## Stage 1 — Build Architectural Context

Read and understand the architectural grounding documents.

These establish:

* platform terminology
* ownership boundaries
* system architecture
* data architecture
* infrastructure concepts

These documents define how the platform is intended to work.

- Oskey Architecture.md
- Oskey Backend Services & Data Architecture.md - this file may already be superceded. Only use it where information can be verified from AST proof


---

## Stage 2 — Build Data Context

Read:

* Firestore schema
* Firestore rules
* RBAC reference

These define:

* data ownership
* collection hierarchy
* security boundaries
* permission model

firestore-schema.md
firestore.rules.txt
firestore.indexes.json
rbac-roles.json

RBAC Roles
- v1.admin roles are a work in progress and are not currently implemented
- v1.org.admin roles are currently in production

---

## Stage 3 — Build Module Context

Read the module evidence artefacts for the target module.

Mandatory module evidence artefacts:

* `{module}-manifest.json`
* `{module}-services.json`
* `{module}-controllers.json`
* `{module}-evidence.json`
* `{module}-evidence-graph.json`
* `{module}-firestore-triggers.json`

Use these artefacts to understand how this specific module implements its responsibilities.

Treat Firestore triggers as runtime behaviour evidence. They should be used to identify document-triggered side effects, path variables, handlers, and candidate fan-out behaviour.

---

## Stage 4 — Produce the Engineering Profile

Before writing the final profile, read:

* `persona.md`
* `rules.md`
* `work-order.md`
* `output-schema.md`

Then generate the Module Engineering Profile using the supplied Output Schema.

The profile must include all required sections from `output-schema.md`, including the Firestore Triggers section if trigger evidence is supplied.

The profile should describe the current implementation.

It should not redesign the system.

Output the result as a markdown file named:

`{module}-engineering-profile.md`

---

# Authority Order

If multiple sources describe the same concept, use the following precedence.

1. AST-derived engineering evidence
2. Firestore schema and security rules
3. RBAC reference
4. Architecture documents
5. Product or operating documentation

If sources conflict, report the conflict rather than resolving it.

---

# Scope

This task is limited to the supplied module.

Cross-module relationships may be identified when directly evidenced.

Do not synthesise platform workflows.

Those are produced during a later Knowledge Pipeline stage.

---

## Reference Output

A reference output (module-engineering-profile-reference-v1.md) may optionally be supplied. 

Its purpose is to demonstrate:

- expected evidence density
- section structure
- writing style
- engineering depth
- evidence taxonomy

If one is encountered:

- Do not copy findings, interpretations or conclusions from the reference output.
- Always regenerate the report from the supplied evidence.
- If the evidence differs from the reference output, follow the evidence.

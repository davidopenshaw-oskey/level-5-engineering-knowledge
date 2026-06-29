# AI Task Contract v1

**Status:** Draft v1.0
**Purpose:** Define the standard contract used by the Oskey Knowledge Platform when interacting with any AI runtime.

---

# 1. Purpose

An AI Task Contract defines the complete specification for a repeatable AI task.

It separates **task definition** from **AI implementation**, allowing the same task to be executed by different AI runtimes (Gemini, ChatGPT, LM Studio, Claude, etc.) while maintaining consistent inputs, outputs and evaluation criteria.

The objective is to minimise vendor lock-in and maximise repeatability.

An AI Task Contract is comparable to an API contract.

Rather than defining endpoints and payloads, it defines the information and constraints required for an AI to perform a specific knowledge-generation task.

---

# 2. Design Principles

Every AI Task Contract should follow the following principles.

## 2.1 Deterministic Inputs

All engineering facts supplied to the AI should originate from deterministic sources.

Examples include:

* Knowledge Pipeline evidence
* Evidence Graphs
* Operating Model corpus
* Feature Maps
* Firestore Schema
* Approved Workflow documents

The contract should never rely on the AI discovering engineering facts directly from source code.

---

## 2.2 Separation of Concerns

Each component of the task should have a single responsibility.

| Component     | Responsibility                   |
| ------------- | -------------------------------- |
| Persona       | Defines who the AI is acting as  |
| Rules         | Defines behavioural constraints  |
| Prompt        | Defines the task to perform      |
| Evidence      | Defines the available knowledge  |
| Output Schema | Defines the expected deliverable |
| Evaluation    | Defines how success is measured  |

---

## 2.3 Evidence First

The AI should treat deterministic evidence as the primary source of truth.

Interpretation is permitted.

Fabrication is not.

Where evidence is insufficient, the AI should explicitly identify uncertainty rather than invent behaviour.

---

## 2.4 Runtime Independence

The contract should be executable using any supported AI runtime.

The contract must not depend upon:

* Gemini-specific features
* ChatGPT-specific features
* LM Studio-specific features
* Proprietary prompt syntax

Where runtime-specific optimisation is required, it should be implemented separately from the task contract.

---

# 3. Standard Contract Components

Every AI task should contain the following files.

## contract.md

Describes the purpose of the task.

Defines required inputs.

Defines expected outputs.

Defines success criteria.

---

## persona.md

Defines the role adopted by the AI.

Examples:

* Engineering Knowledge Author
* Software Architect
* QA Engineer
* Product Manager

The persona should describe expertise rather than behaviour.

---

## rules.md

Defines mandatory behavioural constraints.

Rules should be reusable across multiple tasks wherever possible.

Examples:

* Evidence is the source of truth.
* Never invent implementation behaviour.
* Mark uncertainty explicitly.
* Distinguish evidence from interpretation.

---

## prompt.md

Defines the task being requested.

The prompt should focus on:

* required work
* required structure
* expected level of detail

The prompt should not duplicate rules or persona information.

---

## output-schema.md

Defines the expected output format.

This may be:

* Markdown
* JSON
* YAML
* HTML
* Other structured formats

The output schema should remain stable across AI runtimes.

---

## evaluation.md

Defines how output quality is assessed.

Evaluation criteria should be objective wherever possible.

Typical criteria include:

* factual accuracy
* evidence usage
* unsupported claims
* completeness
* readability
* architectural understanding

---

# 4. Inputs

A task contract should explicitly define its required inputs.

Typical examples include:

* Engineering Evidence Graph
* Module Manifest
* Services
* Controllers
* Feature Maps
* Operating Model
* Workflow Catalogue
* Product Request

The contract should not assume additional context.

---

# 5. Outputs

Every task should produce a single well-defined output.

Examples include:

* Module Engineering Profile
* Workflow Catalogue
* Workflow Document
* Impact Analysis
* Atomic PRD

Outputs should be version controlled where appropriate.

---

# 6. Versioning

Each component of a task contract should be versioned independently.

Example:

```
persona-v1.md

rules-v2.md

prompt-v3.md

output-schema-v1.md
```

A task run should record which versions were used.

---

# 7. AI Runtime Compatibility

The task contract is independent of the execution environment.

Supported runtimes may include:

* Gemini
* ChatGPT
* LM Studio
* Claude
* Future AI platforms

The runtime is considered an implementation detail.

---

# 8. Relationship to the Knowledge Platform

The AI Task Contract forms the bridge between deterministic knowledge and AI-generated knowledge projections.

```
Knowledge Pipeline

↓

Evidence Corpus

↓

AI Task Contract

↓

AI Runtime

↓

Knowledge Projection
```

This separation ensures that knowledge generation remains portable, repeatable and evidence-backed regardless of the underlying AI technology.

---

# 9. Future Evolution

Future versions of the AI Task Contract may introduce:

* automated evaluation
* benchmark datasets
* reusable prompt libraries
* runtime-specific optimisation layers
* task orchestration
* multi-agent execution

These capabilities should extend the contract without changing its fundamental architecture.

The long-term objective is to establish a stable contract between the Oskey Knowledge Platform and any current or future AI runtime.

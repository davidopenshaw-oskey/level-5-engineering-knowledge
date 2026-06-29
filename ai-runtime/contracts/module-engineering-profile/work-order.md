# Rules: Module Engineering Profile v1.1

# Scope

This is a Pass 1 module-level document.

Describe the supplied target module only.

Do not attempt to produce a complete system architecture, workflow catalogue, or inter-module dependency map.

You may mention relationships to other modules only when directly evidenced, but do not expand them into full functional flows.

The objective is to create one reliable module document that can later be used as input to a Pass 2 multi-module synthesis.

## 1. Evidence is the source of truth

Use the supplied input pack as the only source of truth.

Do not rely on memory, assumptions, or general knowledge about the OSkey platform unless that information is included in the supplied context.

Do not ask for or assume access to the original TypeScript source code.

---

## 2. Respect evidence authority tiers

Treat supplied inputs according to the following authority order.

### Tier 1 — Deterministic code evidence

Examples:

- module manifest
- services artefact
- controllers artefact
- evidence artefact
- evidence graph

Use this as the highest authority for what the current codebase exposes.

### Tier 2 — Deterministic schema, rules, and RBAC evidence

Examples:

- Firestore schema
- Firestore security rules
- RBAC / permissions reference if available

Use this to ground data structures, collection paths, security boundaries, and permission relationships.

### Tier 3 — Architecture grounding

Examples:

- OSkey Backend Services & Data Architecture
- OSkey Architecture

Use this to understand intended architecture, fan-out patterns, data replication, system boundaries, and known architectural context.

These Architecture grounding documents may be stale or partially superseded. If it conflicts with Tier 1 or Tier 2 evidence, report the conflict instead of resolving it silently.

### Tier 4 — Product or operating context

Examples:

- personas
- authority models
- feature maps
- workflow documents

Use only if supplied. Do not infer business workflows unless the supplied context directly supports them.

### Tier 5 — Legacy generated documents

Use legacy AI-generated outputs only as comparison material or historical context.

Do not treat legacy generated documents as source-of-truth unless explicitly marked as approved.

---

## 3. Separate fact, interpretation, and open questions

Clearly distinguish between:

- confirmed evidence
- reasonable interpretation
- open questions

Use cautious language when interpreting.

Preferred wording:

- "Evidence indicates..."
- "The module appears to..."
- "This likely represents..."
- "Requires confirmation..."
- "Architecture grounding suggests..."

Avoid unsupported certainty.

---

## 4. Do not invent business rules

Do not infer business rules from method names alone.

A business rule may only be stated as confirmed when supported by supplied evidence or approved grounding material.

If a business rule is plausible but not confirmed, place it under open questions or mark it as interpretation.

---

## 5. Treat external hooks as candidate boundaries

Treat external hooks as candidate boundaries unless confirmed by supplied evidence.

Do not claim that Android, iOS, intercom, middleware, hardware, IoT backend, or mobile applications consume a hook unless explicitly evidenced.

If architecture grounding suggests an external relationship but the mapped repo evidence is missing, phrase it as:

> "Architecture grounding suggests this may fan out to [system], but this remains a candidate boundary until the corresponding repo is mapped."

---

## 6. Explain fan-out only when grounded

Fan-out, cascading updates, denormalized writes, Pub/Sub events, Cloud Tasks, storage writes, and hardware synchronization may be described only when supported by supplied evidence.

When describing fan-out, identify:

- source service or method, if known
- target collection, service, topic, or external system
- confidence level
- whether the evidence came from code evidence, schema/RBAC evidence, or architecture grounding

---

## 7. Cite evidence concretely

Every major section should include concrete evidence references where available.

A concrete evidence reference should include at least one of:

- source file path
- line number
- fact type
- service name
- controller name
- method name
- permission string
- Firestore path
- architecture-grounding document name

Avoid vague phrases such as "the evidence shows" without naming the evidence.

---

## 8. Preserve uncertainty and conflicts

If evidence is incomplete, say so.

If evidence sources conflict, do not hide the conflict.

Use a clear conflict format:

```md
Conflict:
- Tier 1 evidence indicates...
- Architecture grounding suggests...
- Resolution: requires human review.

## 9. Do not generate delivery artefacts

This task must not produce:

- Atomic PRDs
- Jira tickets
- implementation plans
- QA test suites
- code changes
- new feature designs

The output is an engineering knowledge profile only.

## 10. Keep the output human-readable

Write for:

- engineering leaders
- product managers
- developers joining the codebase
- technical stakeholders

Avoid dumping raw JSON unless necessary.

Summarise evidence, but keep enough references for traceability.

## 11. Required output structure

The Module Engineering Profile must use this structure:

- Module Summary
- Primary Evidence
- Services
- Controllers
- Firestore Evidence
- Permissions
- Cross-Module Dependencies
- External Hooks / Candidate Boundaries
- Fan-Out and Side Effects
- Architectural Observations
- Risks and Open Questions
- Evidence References

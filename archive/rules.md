# Rules: Module Engineering Profile

## 1. Evidence first

Deterministic evidence is the source of truth.

Every technical claim must be traceable to supplied evidence or approved grounding material.

Do not read or assume access to original TypeScript source code.

### Evidence granularity

Evidence must be specific enough to be useful in later synthesis.

Prefer naming concrete services, controllers, methods, Firestore paths, permission strings, and architecture claims.

Avoid using only artefact filenames as evidence.

Good:

- Service: OSKBuildingDoorService
- Firestore path: /buildings/{buildingId}/doors
- Permission: v1.org.buildings.edit

Weak:

- building-services.json
- building-evidence.json

### Evidence taxonomy

When presenting evidence, use the following evidence types.

Only classify an item according to its actual engineering role.

#### Firestore Trigger

A Firestore document trigger reacting to document create, update, delete, or write events.

Use this evidence type for Cloud Function Firestore triggers such as:

- `.onCreate`
- `.onUpdate`
- `.onDelete`
- `.onWrite`
- `onDocumentCreated`
- `onDocumentUpdated`
- `onDocumentDeleted`
- `onDocumentWritten`

When available, include:

- trigger type
- source file
- line
- Firestore path or path variable
- handler/service method
- downstream side effects

#### Controller

A controller class or controller method.

Example:

- Controller: OSKBuildingController
- Controller Method: update()

#### Service

A service class.

Example:

- Service: OSKBuildingDoorService

#### Service Method

A public service method.

Example:

- Service Method: organizationUserCreateBuildingDoor()

#### Firestore Path

A confirmed Firestore collection or document path.

Example:

- Firestore Path: /buildings/{buildingId}/doors

#### Permission

A confirmed permission string.

Example:

- Permission: v1.org.buildings.edit

#### Architecture

A confirmed architectural statement from approved architecture grounding.

#### Schema

A confirmed Firestore schema statement.

#### RBAC

A confirmed RBAC relationship.

Do not misclassify evidence.

## 2. Use the correct evidence sequence

Read inputs in this order:

1. Architecture grounding
2. Firestore schema, rules, indexes, and RBAC
3. Module manifest, services, controllers, evidence, and evidence graph
4. Output schema

Use architecture to understand the platform context.

Use AST-derived artefacts to confirm implementation.

## 3. Respect source authority

Authority order:

1. AST-derived module evidence
2. Firestore schema and security rules
3. RBAC reference
4. Architecture documents
5. Product or operating documentation

If sources conflict, report the conflict.

Do not silently resolve it.

## 4. Stay in Pass 1 scope

This is a Pass 1 module report.

Describe one module only.

Do not generate:

- full workflow synthesis
- platform-wide dependency maps
- cross-repository architecture
- Atomic PRDs
- Jira tickets
- QA plans
- implementation plans

Record broader findings as candidates for later synthesis.

## 5. Separate fact, interpretation, and uncertainty

Clearly distinguish:

- confirmed evidence
- architecture-grounded interpretation
- open questions

Do not infer business workflows from method names alone.

## 6. External hooks are candidates

Mark external systems as candidate boundaries unless confirmed by evidence.

This includes:

- mobile apps
- ACDs
- Intercom
- Digicom
- Pub/Sub
- Cloud Run
- MongoDB
- hardware sync consumers

## 7. Fan-out must be grounded

Only describe fan-out, denormalisation, Pub/Sub, Cloud Tasks, or hardware sync when supported by supplied evidence or architecture grounding.

State confidence clearly.

## 8. Cite evidence

For significant claims, reference concrete evidence where available:

- file path
- service name
- controller name
- method name
- Firestore path
- permission string
- evidence artefact
- architecture document

Avoid vague claims such as "the evidence shows" without naming the evidence.

## 9. Preserve open questions

If evidence is missing, say so.

Do not fill gaps with invented explanations.

## 10. Output only the requested module profile

Follow `output-schema.md`.

Do not add extra conversational text at the end.
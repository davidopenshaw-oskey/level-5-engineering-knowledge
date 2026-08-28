## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.559Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_access
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_access` capability manages user-specific building and unit access rights, mappings, and authorizations within the `user` module. It provides structured models and services to create, update, and validate various access types (such as inhabitant, guest, permanent guest, quickcode, and supplier staff accesses) and persists these configurations in Firestore, preparing them for downstream synchronization to edge hardware. (**Confirmed**; `` `source_file|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|functions/src/modules/user/modules/user_access/services/user_access.service.ts` ``)

---

## 2. Primary Responsibilities

### Managing User Accesses per Building
- Storing, updating, and deleting structured access records for a user within a specific building scope. (**Confirmed**; `` `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController` ``)
- Providing safe retrieval of building-specific user accesses. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController.default.getPerBuilding|getPerBuildingSafe|userId,buildingId|#1` ``)

### Managing User Building Unit Mappings
- Tracking which units a user is associated with in a building, along with their specific roles (e.g., resident, owner, guest). (**Confirmed**; `` `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController` ``)
- Supporting creation, deletion, and listing of user-to-building-unit documents. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController.default._create|create|`/users/${userId}/buildings/${buildingId}/units`,unitId,data|#1` ``)

### Access Setup and Orchestration
- Processing incoming access options and translating them into structured `OSKAccess` records. (**Confirmed**; `` `service_method|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|OSKUserAccessService|setupUserAccess|#1` ``)
- Generating unique access IDs and resolving inviter names during access setup. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|OSKAccessUtilsService.generateAccessId|setupUserAccess||#1` ``)

### Type Validation for Access Types
- Validating different access types using runtime type guards (e.g., `isTypeOSKInhabitantAccess`, `isTypeOSKGuestAccess`, `isTypeOSKQuickcodeAccess`, `isTypeOSKNonAppUserAccess`, `isTypeOSKSupplierStaffAccess`). (**Confirmed**; `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 130-292))

---

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKUserAccessesController`** (`functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` line 11): Extends `OSKDocumentController`. Exposes endpoints to get, save, update, and delete user accesses per building.
- **`OSKUserBuildingUnitController`** (`functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` line 14): Extends `OSKDocumentController`. Exposes endpoints to manage user-to-building-unit mappings.

### Services
- **`OSKUserAccessService`** (`functions/src/modules/user/modules/user_access/services/user_access.service.ts` line 32): Provides core business logic for creating, updating, and setting up user accesses.

---

## 4. API Contracts & Firestore Triggers
- No `api_contract` facts are present in this capability's pack. (**Confirmed**)
- No Firestore triggers are explicitly declared in this pack. (**Confirmed**)

---

## 5. Data Ownership

### Firestore Paths
- **`/users/{userId}/accesses/{buildingId}`** (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController.default._get|getPerBuilding|collectionPath,buildingId|#1` ``)
  - *Operations*: Read (`_get`, `_query`), Write (`_set`, `_update`, `_delete`, `_deleteAll`).
  - *Description*: Stores structured access records for a user within a specific building.
- **`/users/{userId}/buildings/{buildingId}/units/{unitId}`** (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController.default._create|create|`/users/${userId}/buildings/${buildingId}/units`,unitId,data|#1` ``)
  - *Operations*: Read (`_get`, `_listDocuments`), Write (`_create`, `_set`, `_delete`, `_deleteAll`).
  - *Description*: Tracks user associations with specific units inside a building.

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **`building` module**:
  - Imports `@oskey/building` in `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (line 6) to retrieve building details.
  - Imports `@oskey/building/door` in `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` (line 6) and `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` (line 1) to reference door models.
  - Imports `@oskey/building/accesses` in `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (line 3).
  - Imports `@oskey/building/unit` in `functions/src/modules/user/modules/user_access/models/documents/user_building_unit_document.model.ts` (line 6) to reference unit models.
- **`supplier` module**:
  - Imports `@oskey/supplier` in `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (line 15) to reference supplier models.
- **`core` module**:
  - Imports `@oskey/core/controllers/document` in `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (line 7) and `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (line 7) to inherit document controller behavior.
  - Imports `@oskey/core/access` in multiple files (e.g., `functions/src/modules/user/modules/user_access/services/user_access.service.ts` line 8) to reference core access models and type guards.

### Intra-Module Coupling (Sibling Submodules)
- **`user` module root / other submodules**:
  - Imports `@oskey/user/access` in `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (line 17).
  - Imports `@oskey/user` in `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (line 16).

---

## 7. Permissions & Security

### Firestore Security Rules
The following rules from `firestore.rules.txt` govern the paths owned by this capability:
- **`/users/{userId}/accesses/{accessId}`**:
  - `allow read: if isAuthenticatedUser(userId);`
  - `allow write: if false;` (Direct client writes are blocked; updates must go through backend services).
- **`/users/{userId}/accesses/personalization/{personalizationId}`**:
  - `allow read: if (isAuthenticatedUser(userId));`
  - `allow write: if (isAuthenticatedUser(userId) && get(/databases/$(database)/documents/users/$(userId)/accesses/$(accessId)).data.isInvitation == false && accessId == personalizationId);`
- **`/users/{userId}/buildings/{buildingId}/units/{unitId}`**:
  - `allow read: if (isAuthenticatedUser(userId));`
  - `allow write: if false;`

### RBAC Permissions
While no explicit RBAC permission strings are directly referenced in the code facts of this pack, the RBAC roles document lists the following administrative permissions related to user accesses:
- `v1.admin.user.accesses.create`
- `v1.admin.user.accesses.delete`
- `v1.admin.user.accesses.list`
- `v1.admin.user.accesses.view`

---

## 8. External Hooks

### Pub/Sub Messages
The capability defines several Pub/Sub message schemas in `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` which serve as candidate external boundaries for asynchronous synchronization of user accesses to edge hardware:
- **`OSKAccessPubsubdMessage`** (line 44)
- **`OSKUserAccessesMessageInsert`** (line 23)
- **`OSKUserAccessesMessageUpdate`** (line 28)
- **`OSKUserAccessesMessageDelete`** (line 33)
- **`OSKMaintenanceAccessesMessageRecreate`** (line 38)

---

## 9. Open Questions
- **Pub/Sub Publishing**: The message models are defined within this capability, but there are no direct `pubsub_publish_call` facts in this pack. It is unclear which service or trigger is responsible for actually publishing these messages to GCP Pub/Sub. (**Inferred**)
- **Controller Authorization**: The controllers inherit from `OSKDocumentController`, but the exact middleware or decorator-based RBAC checks applied to the controller endpoints are not visible in this pack's facts. (**Inferred**)
# Capability Synthesis — building_accesses

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.408Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_accesses
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `building_accesses` capability manages the persistence, retrieval, and incremental updates of building-specific access permissions for users, staff, and non-app users within the `/buildings/{buildingId}/accesses` Firestore collection [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77) and `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 16-65)). It acts as a ledger of authorized accesses mapped to specific physical building anchors [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts` (lines 9-17)).

---

## 2. Primary Responsibilities
- **Managing Building Access Documents**: Exposes CRUD-like operations to create, retrieve, update, and delete access records for specific buildings and users/members [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77)).
- **Orchestrating User Building Access**: Provides business logic to create or update building access records for standard users, appending new access configurations to their document using Firestore array unions [Confirmed] (evidenced by `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccess|#1` ``).
- **Orchestrating Staff and Non-App User Building Access**: Provides business logic to create or update building access records for staff members or non-app users, appending new access configurations to their document [Confirmed] (evidenced by `` `service_method|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService|createOrUpdateBuildingAccessForStaffOrNonAppUser|#1` ``).
- **Defining the Building Access Data Model**: Structuring the `OSKBuildingAccess` document with fields for `buildingId`, `userId`, `userFirstName`, `userLastName`, and an array of `accesses` [Confirmed] (evidenced by `` `type_alias|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|#1` ``).

---

## 3. Public Interfaces (Controllers & Entry Points)
- **`OSKBuildingAccessesController`**: A document controller extending `OSKDocumentController` that exposes low-level document operations for building access documents [Confirmed] (evidenced by `` `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController` ``).
- **`OSKBuildingAccessService`**: A service class providing high-level business logic to create or update building accesses for users, staff, and non-app users [Confirmed] (evidenced by `` `source_class|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService` ``).

---

## 4. API Contracts & Firestore Triggers
- No direct HTTP API contracts (`api_contract` facts) or Firestore triggers are defined in this capability's evidence pack [Confirmed].
- The controller methods (`get`, `getAll`, `save`, `create`, `update`, `deletePerUser`, `deleteAll`, `listDocuments`) are internal/module-level entry points extending `OSKDocumentController` [Inferred] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77)).

---

## 5. Data Ownership
### Firestore Collections
- **Path**: `/buildings/{buildingId}/accesses/{userId}` (or `{memberId}`) [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (line 14) and the Firestore Schema document).
  - **Fields**:
    - `buildingId`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|buildingId|#1` ``)
    - `userId`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userId|#1` ``)
    - `userFirstName`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userFirstName|#1` ``)
    - `userLastName`: *string* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|userLastName|#1` ``)
    - `accesses`: *array* [Confirmed] (evidenced by `` `model_property|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|OSKBuildingAccess|accesses|#1` ``)
    - `creationDate`: *timestamp* [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/services/building_access.service.ts` (lines 37, 61) and the Firestore Schema document).
  - **Operations**: Read, Write (Create, Set, Update, Delete) [Confirmed] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 18-77)).

---

## 6. Outbound Coupling
### Cross-Module Coupling
- **`@oskey/core`**: Imports core document controller and core types [Confirmed] (evidenced by `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|@oskey/core|#1` `` and `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|@oskey/core|#1` ``).
- **`@oskey/user`**: Imports user-related types/services [Confirmed] (evidenced by `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|@oskey/user|#1` ``).
- **`@oskey/user/access`**: Imports user access models/types [Confirmed] (evidenced by `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts|@oskey/user/access|#1` `` and `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|@oskey/user/access|#1` ``).

### External Libraries
- **`firebase-admin/firestore`**: For `FieldValue` and firestore types [Confirmed] (evidenced by `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|firebase-admin/firestore|#1` ``).
- **`@oskey/utils/errors_helper`**: For error handling [Confirmed] (evidenced by `` `imports_dependency|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|@oskey/utils/errors_helper|#1` ``).

---

## 7. Permissions & Security
- No explicit permission strings are referenced in the code facts of this capability [Confirmed].
- **Security Rules Cross-Check**: The Firestore rules file (`firestore.rules.txt`) does not contain an explicit match for `/buildings/{buildingId}/accesses/{documentId}`. While `/buildings/{buildingId}` has `allow read, write: if isValidUser();`, this does not automatically cascade to subcollections in Firestore rules unless recursive wildcards are used (which are not used here). This represents a potential security rule mismatch or gap where access to `/buildings/{buildingId}/accesses` might be blocked by default or insufficiently restricted [Inferred] (evidenced by `firestore.rules.txt`).

---

## 8. External Hooks
- No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced in this capability's pack [Confirmed].

---

## 9. Open Questions
- **Controller Exposure**: How are the controller methods of `OSKBuildingAccessesController` exposed? Are they wrapped in HTTP endpoints in a parent module/submodule, or are they strictly used internally by other services? [Inferred]
- **Security Rules Gap**: Why is there no explicit match for `/buildings/{buildingId}/accesses` in `firestore.rules.txt`? Is this collection intended to be accessed strictly via Admin SDK / Cloud Functions (bypassing client-side security rules), or is there a missing rule? [Inferred]
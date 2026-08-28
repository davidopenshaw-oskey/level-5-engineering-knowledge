## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.421Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_pincode_trash
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `building_pincode_trash` capability manages the lifecycle, storage, and retrieval of deleted or "trashed" building pincodes within the `building` module [Confirmed]. It provides a structured mechanism to track trashed pincodes, including their status, last update timestamp, and expiration date before permanent deletion [Confirmed].

---

## 2. Primary Responsibilities

### Trashed Pincode Document Management [Confirmed]
- Provides standard CRUD operations (set, get, getAll, update, delete) for managing trashed pincode documents [Confirmed]. These operations are exposed via `OSKBuildingPincodeTrashController` which inherits from the core `OSKDocumentController` `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``.
- Resolves the Firestore collection path dynamically per building using `getCollectionPath(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getCollectionPath|#1` ``.

### Trashed Pincode Metadata Tracking [Confirmed]
- Defines the schema for trashed pincode documents via the `OSKBuildingPincodeTrashDocument` type alias `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|#1` ``.
- Tracks the trash status of a pincode using `OSKPincodeTrashStatus` `` `type_alias|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKPincodeTrashStatus|#1` ``.
- Records the timestamp of the last status update (`lastStatusUpdate`) `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|lastStatusUpdate|#1` ``.
- Enforces an expiration date (`expirationDate`) for the trashed pincode, after which it is eligible for permanent deletion `` `model_property|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|OSKBuildingPincodeTrashDocument|expirationDate|#1` ``.

---

## 3. Public Interfaces (Controllers & Entry Points)

This capability exposes the following public interfaces:

### Controllers [Confirmed]
- **`OSKBuildingPincodeTrashController`**: A document controller extending `OSKDocumentController` that handles HTTP/API requests for trashed pincodes `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``. It exposes the following methods:
  - `getCollectionPath(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getCollectionPath|#1` ``
  - `set(document)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|set|#1` ``
  - `get(pincodeId, buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|get|#1` ``
  - `getSafe(pincodeId, buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getSafe|#1` ``
  - `getAll(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getAll|#1` ``
  - `getAllSafe(buildingId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|getAllSafe|#1` ``
  - `update(buildingId, pincodeId, data)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|update|#1` ``
  - `delete(buildingId, pincodeId)` `` `controller_method|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController|delete|#1` ``

### Services [Confirmed]
- **`OSKBuildingPincodeTrashService`**: A service class exported by the submodule `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/services/building_pincode_trash.service.ts|OSKBuildingPincodeTrashService` ``.

---

## 4. API Contracts & Firestore Triggers

No explicit `api_contract` facts or Firestore triggers are evidenced within this capability's pack.

---

## 5. Data Ownership

### Firestore Paths [Inferred]
The exact Firestore collection path is resolved dynamically by `getCollectionPath(buildingId)` `` `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (line 14) ``. 
- Based on the sibling `pincodes` collection path (`/buildings/{id}/pincodes`) and the requirement of `buildingId` to resolve the path, the collection path is highly likely nested under the building document, such as:
  - `/buildings/{buildingId}/pincodeTrash` [Inferred]

---

## 6. Outbound Coupling

This capability exhibits the following outbound dependencies:

### Intra-Module Coupling (Sibling Submodules) [Confirmed]
- **`building_pincode`**: The model definition imports `@oskey/building/pincode` to reference or extend the base pincode structure `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|@oskey/building/pincode|#1` ``.

### Cross-Module Coupling [Confirmed]
- **`core`**: Imports `OSKDocumentController` from `@oskey/core/controllers/document` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|@oskey/core/controllers/document|#1` `` and general core utilities from `@oskey/core` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|@oskey/core|#1` ``.
- **`utils`**: Imports error handling utilities from `@oskey/utils/errors_helper` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|@oskey/utils/errors_helper|#1` ``.

### External Libraries [Confirmed]
- **`firebase-admin/firestore`**: Used for Firestore type definitions (e.g., Timestamps) `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts|firebase-admin/firestore|#1` ``.

---

## 7. Permissions & Security

No explicit permission strings are referenced in the provided evidence pack. However, because `OSKBuildingPincodeTrashController` inherits from `OSKDocumentController` `` `source_class|building|functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts|OSKBuildingPincodeTrashController` ``, security and authorization checks are likely delegated to the base controller or Firestore security rules.

---

## 8. External Hooks

No external hooks, Pub/Sub topics, or external integrations are evidenced within this capability's pack.

---

## 9. Open Questions

- **Exact Firestore Path**: What is the exact string returned by `getCollectionPath(buildingId)`?
- **Trash Status Values**: What are the allowed string literal values for `OSKPincodeTrashStatus`?
- **Service Logic**: What business logic does `OSKBuildingPincodeTrashService` implement, given that it is exported but has no method calls evidenced in this pack?
- **Retention Policy**: Is there an active background cron job or Cloud Function that automatically purges documents from this "trash" collection once `expirationDate` is reached?
## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.420Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_pincode
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `building_pincode` capability manages the lifecycle, persistence, and querying of alphanumeric PIN codes assigned to various user personas (Inhabitants, Guests, Permanent Guests, Suppliers, and Anonymous/Quickcode users) at the building level. These PIN codes are stored within the Firestore collection path `/buildings/{buildingId}/pincodes` to enable offline edge validation on Access Control Devices (ACDs) `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 15-22).

**Confidence Tag**: Confirmed

## 2. Primary Responsibilities
The capability is responsible for the following distinct features:

### Pincode Document Creation & Persistence
The capability provides specialized service methods to construct and persist structured pincode documents for different platform personas:
- **Inhabitant Pincodes**: Creates pincodes for residents with a reference to their unit `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 19-39).
- **Guest Pincodes**: Creates temporary pincodes containing inviter and invited user references `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 41-64).
- **Permanent Guest Pincodes**: Creates scheduled pincodes for recurring visitors `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 66-89).
- **Anonymous / Quickcode Pincodes**: Creates time-bound, entry-limited pincodes for anonymous visitors (e.g., delivery couriers) `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 90-110).
- **Supplier Pincodes**: Creates pincodes for third-party contractors and maintenance staff `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 112-130).

**Confidence Tag**: Confirmed

### Pincode Document Management (CRUD & Queries)
The capability exposes a controller to perform standard document operations on the Firestore database:
- **Set Pincode**: Writes or updates a pincode document using the pincode string as the document ID `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 19-22).
- **Get / GetSafe**: Retrieves a specific pincode document by ID, throwing a safe error helper if not found `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 24-40).
- **Querying**: Supports retrieving all pincodes for a building, filtering by pincode type, or querying by a specific `accessId` `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 42-81).
- **Delete**: Removes a pincode document from the building's collection `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 54-57).

**Confidence Tag**: Confirmed

### Type Validation
The capability provides utility functions to validate whether a pincode document or set of documents belongs to an inhabitant type `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` (lines 58-68).

**Confidence Tag**: Confirmed

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points:

### OSKBuildingPincodeController
An exported controller class extending `OSKDocumentController` that manages direct Firestore operations for building pincodes.
- **File**: `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 12-82)
- **Methods**:
  - `getCollectionPath(buildingId: string)`: Returns the path `buildings/${buildingId}/pincodes` `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getCollectionPath|#1` ``.
  - `set(document: OSKBuildingPincodeDocument)`: Writes the pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|set|#1` ``.
  - `get(pincodeId: string, buildingId: string)`: Retrieves a pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|get|#1` ``.
  - `getSafe(pincodeId: string, buildingId: string)`: Safely retrieves a pincode document or throws an error `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getSafe|#1` ``.
  - `getAll(buildingId: string)`: Retrieves all pincodes for a building `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAll|#1` ``.
  - `getAllByType(buildingId: string, type: string)`: Queries pincodes by type `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getAllByType|#1` ``.
  - `getByAccessId(buildingId: string, accessId: string)`: Queries pincodes by access ID `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|getByAccessId|#1` ``.
  - `delete(pincodeId: string, buildingId: string)`: Deletes a pincode document `` `controller_method|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|OSKBuildingPincodeController|delete|#1` ``.

### OSKBuildingPincodeService
An exported service class that orchestrates the creation of typed pincode documents.
- **File**: `functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts` (lines 18-131)
- **Methods**:
  - `createPincodeInhabitantDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeInhabitantDocument|#1` ``
  - `createPincodeGuestDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeGuestDocument|#1` ``
  - `createPincodePermanentGuestDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodePermanentGuestDocument|#1` ``
  - `createPincodeAnonymousDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeAnonymousDocument|#1` ``
  - `createPincodeSupplierDocument(...)` `` `service_method|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|OSKBuildingPincodeService|createPincodeSupplierDocument|#1` ``

**Confidence Tag**: Confirmed

## 4. API Contracts & Firestore Triggers
No API contracts (`api_contract` facts) or Firestore triggers are defined within this capability's evidence pack.

**Confidence Tag**: Confirmed

## 5. Data Ownership
This capability owns and manages documents under the following Firestore collection path:

### `/buildings/{buildingId}/pincodes/{pincodeId}`
- **Operations**: Read (`get`, `getAll`, `getAllByType`, `getByAccessId`), Write (`set`), Delete (`delete`) `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 15-82).
- **Schema Fields**:
  - `pincode`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|pincode|#1` ``
  - `userId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|userId|#1` ``
  - `buildingId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|buildingId|#1` ``
  - `doors`: *array* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|doors|#1` ``
  - `accessId`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|accessId|#1` ``
  - `type`: *string* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|type|#1` ``
  - `creationDate`: *timestamp* `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeBaseDocument|creationDate|#1` ``
  - `unitId`: *string* (optional, present on Inhabitant, Guest, Permanent Guest, and Anonymous types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeInhabitantDocument|unitId|#1` ``
  - `inviterId`: *string* (optional, present on Guest and Permanent Guest types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeGuestDocument|inviterId|#1` ``
  - `invitedId`: *string* (optional, present on Guest and Permanent Guest types) `` `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeGuestDocument|invitedId|#1` ``

**Confidence Tag**: Confirmed

## 6. Outbound Coupling
This capability depends on the following modules and submodules:

### Intra-Module Coupling (Sibling Submodules)
- **`building_door`** (referenced via `@oskey/building/door`): Used to type the authorized doors associated with a pincode document.
  - *Evidence*: Imported in `building_pincode_document.model.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|@oskey/building/door|#1` `` and `building_pincode.service.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|@oskey/building/door|#1` ``.

### Cross-Module Coupling
- **`core`** (referenced via `@oskey/core` and `@oskey/core/controllers/document`): Provides the base document controller class `OSKDocumentController` which `OSKBuildingPincodeController` extends.
  - *Evidence*: Imported in `building_pincode.controller.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|@oskey/core/controllers/document|#1` ``.
- **`core/access`** (referenced via `@oskey/core/access`): Used to type access-related properties.
  - *Evidence*: Imported in `building_pincode.controller.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|@oskey/core/access|#1` `` and `building_pincode.service.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/services/building_pincode.service.ts|@oskey/core/access|#1` ``.
- **`utils`** (referenced via `@oskey/utils/errors_helper`): Provides error handling utilities.
  - *Evidence*: Imported in `building_pincode.controller.ts` `` `imports_dependency|building|functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts|@oskey/utils/errors_helper|#1` ``.

**Confidence Tag**: Confirmed

## 7. Permissions & Security
No explicit permission strings (e.g., `v1.admin.*` or `v1.org.*`) are referenced directly within this capability's code files.

### Security Rules Analysis
Cross-checking against `firestore.rules.txt`, there is **no explicit match** defined for the collection path `/buildings/{buildingId}/pincodes/{pincodeId}`. 
- The default fallback rule in `firestore.rules.txt` is:
  ```javascript
  match /{document=**} {
    allow read, write: if false;
  }
  ```
- Because there is no recursive wildcard on the `/buildings/{buildingId}` match block, direct client-side reads or writes to `/buildings/{buildingId}/pincodes` are completely blocked.
- **Implication**: All pincode operations must be performed via backend Cloud Functions using the Firebase Admin SDK, which bypasses security rules.

**Confidence Tag**: Inferred

## 8. External Hooks
No direct external hooks, Pub/Sub publishers, or environment variables are explicitly declared in this capability's code.

### Architectural Candidates
According to the *Oskey Architecture* document:
- Pincodes generated in the cloud are synchronized to physical edge hardware (ACDs) asynchronously via GCP Pub/Sub and MongoDB.
- While the `building_pincode` capability handles the authoritative Firestore writes, a downstream synchronization pipeline (likely triggered by Firestore document write events in another capability) handles the actual Pub/Sub dispatch.

**Confidence Tag**: Inferred (from Grounding Documents)

## 9. Open Questions
1. **Downstream Synchronization Trigger**: How is the asynchronous synchronization to MongoDB/PubSub triggered? Is there a Firestore `onWrite` trigger defined in another capability that listens to `/buildings/{buildingId}/pincodes/{pincodeId}` changes?
2. **Client-Side Access**: Is it intentional that `/buildings/{buildingId}/pincodes` has no explicit Firestore security rules, thereby completely preventing client-side SDK access?
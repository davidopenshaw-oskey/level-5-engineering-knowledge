# Capability Synthesis — building_unit_nonAppUser

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.429Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_unit_nonAppUser
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `building_unit_nonAppUser` capability manages the lifecycle, access rights, and activity tracking of "Non-App Users" (dependent unit inhabitants who do not use the mobile application, such as children or elderly residents) within a specific building unit [Confirmed]. This capability orchestrates the creation and deletion of non-app user profiles, provisions physical door access rights, generates offline alphanumeric PIN codes, logs door access events, and synchronizes access state changes asynchronously to edge Access Control Devices (ACDs) [Confirmed].

## 2. Primary Responsibilities
- **Non-App User Profile Lifecycle**: Handles the creation, retrieval, updating, and deletion of non-app user profiles nested under a specific building unit path (`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`) `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUser|#1` `` [Confirmed].
- **Access Rights Provisioning**: Configures and updates physical door access rights (`OSKNonAppUserAccess`) for non-app users, mapping them to specific doors within the building `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserAccess|#1` `` [Confirmed].
- **Offline PIN Code Generation**: Generates and manages alphanumeric PIN codes associated with non-app user access rights, allowing offline keypad entry at physical ACDs `` `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|createNonAppUserWithAccess|#1` `` [Confirmed].
- **Edge Device Synchronization**: Publishes real-time access state updates (creations, updates, deletions) to edge hardware (ACDs) via Pub/Sub messaging to ensure offline validation caches are kept up to date `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateNonAppUserAccessDoors|#1` `` [Confirmed].
- **Activity Logging and Aggregation**: Ingestes raw door access events triggered by non-app users, enriches them with business context, and updates both individual activity logs and 30-day activity aggregates for the user `` `service_method|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity.service.ts|OSKNonAppUserActivityService|ActivityReceivedForNonAppUser|#1` `` [Confirmed].

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes several controllers and services as public entry points:

### Controllers
- **`OSKBuildingUnitNonAppUserController`**: Extends `OSKDocumentController` to manage the primary non-app user documents `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser.controller.ts|OSKBuildingUnitNonAppUserController` `` [Confirmed].
- **`OSKNonAppUserAccessController`**: Extends `OSKDocumentController` to manage access rights documents nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|OSKNonAppUserAccessController` `` [Confirmed].
- **`OSKNonAppUserPincodeController`**: Extends `OSKDocumentController` to manage PIN code documents nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_pincode.controller.ts|OSKNonAppUserPincodeController` `` [Confirmed].
- **`OSKNonAppUserActivitiesController`**: Extends `OSKDocumentAndMessageController` to manage individual activity logs nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity.controller.ts|OSKNonAppUserActivitiesController` `` [Confirmed].
- **`OSKNonAppUserActivityAggregatesController`**: Extends `OSKDocumentController` to manage 30-day activity aggregates nested under the non-app user `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_activity_aggregates.controller.ts|OSKNonAppUserActivityAggregatesController` `` [Confirmed].

### Services
- **`OSKBuildingUnitNonAppUserService`**: The primary orchestrator service handling high-level business logic for non-app users `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingUnitNonAppUserService` `` [Confirmed].
- **`OSKNonAppUserAccessService`**: Manages the creation and updates of access rights `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_access.service.ts|OSKNonAppUserAccessService` `` [Confirmed].
- **`OSKNonAppUserPincodeService`**: Manages the generation and storage of PIN codes `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_pincode.service.ts|OSKNonAppUserPincodeService` `` [Confirmed].
- **`OSKNonAppUserActivityService`**: Handles the ingestion and enrichment of individual door access activities `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity.service.ts|OSKNonAppUserActivityService` `` [Confirmed].
- **`OSKNonAppUserActivityAggregatesService`**: Handles the rolling 30-day aggregation of door access activities `` `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|OSKNonAppUserActivityAggregatesService` `` [Confirmed].

## 4. API Contracts & Firestore Triggers
This capability exposes several Firebase HTTPS Callable functions:

### Callable Functions
- **`createNonAppUser`**: Creates a new non-app user profile.
  - *Request Schema*: No `model_property` facts matched within this pack to resolve the request schema [Unknown].
- **`createNonAppUserAccess`**: Provisions access rights for an existing non-app user.
  - *Request Schema* (`OSKCreateNonAppUserAccessRequest`):
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `endDate`: `Date`
    - `nonAppUserId`: `string`
    - `startDate`: `Date`
    - `unitId`: `string`
- **`createNonAppUserWithAccess`**: Creates a non-app user and provisions their default access rights and PIN code in a single transaction.
  - *Request Schema* (`OSKCreateNonAppUserWithAccessRequest`):
    - `doorIds`: `string[] | undefined` (optional)
  - *Response Schema* (`OSKCreateNonAppUserwithAccessResponse`):
    - `accessId`: `string`
    - `fullName`: `string`
    - `nonAppUserId`: `string`
    - `pincode`: `string`
- **`deleteNonAppUser`**: Deletes a non-app user profile and revokes all associated access rights and PIN codes.
  - *Request Schema* (`OSKDeleteNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`getAllNonAppUsers`**: Retrieves all non-app users registered in a specific unit.
  - *Request Schema* (`OSKGetAllNonAppUsersRequest`):
    - `buildingId`: `string`
    - `unitId`: `string`
- **`getNonAppUser`**: Retrieves a specific non-app user profile.
  - *Request Schema* (`OSKGetNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUser`**: Updates a non-app user's profile details.
  - *Request Schema* (`OSKUpdateNonAppUserRequest`):
    - `buildingId`: `string`
    - `dataToUpdate`: `UpdateData<OSKDocument<T>>`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUserAccessDoors`**: Updates the authorized doors for a non-app user's access rights.
  - *Request Schema* (`OSKUpdateNonAppUserAccessDoorsRequest`):
    - `accessId`: `string`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `nonAppUserId`: `string`
    - `unitId`: `string`

## 5. Data Ownership
This capability owns and manages documents within the following Firestore collection paths:

- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`** [Confirmed]
  - *Description*: Stores the primary profile document (`OSKBuildingUnitNonAppUser`) for a non-app user.
  - *Operation Scope*: Create, Read, Update, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/accesses/{accessId}`** [Confirmed]
  - *Description*: Stores the specific access rights (`OSKNonAppUserAccessesDocument`) provisioned for the non-app user.
  - *Operation Scope*: Create, Read, Update, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}`** [Confirmed]
  - *Description*: Stores the offline alphanumeric PIN code document (`OSKNonAppUserPincodeDocument`) assigned to the non-app user.
  - *Operation Scope*: Create, Read, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activities/{activityId}`** [Confirmed]
  - *Description*: Stores individual door access activity logs (`OSKNonAppUserActivityDocument`) triggered by the non-app user.
  - *Operation Scope*: Create, Read, Delete.
- **`/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/activityAggregates/{buildingId}`** [Confirmed]
  - *Description*: Stores the rolling 30-day activity aggregates (`OSKNonAppUserActivityAggregateDocument`) for the non-app user.
  - *Operation Scope*: Create, Read, Update.

### Shared/Dual-Write Paths (Not Owned, but Modified)
- **`/buildings/{buildingId}/pincodes/{pincodeId}`** [Confirmed]
  - *Description*: The global building-level pincodes collection used by edge devices for offline validation. This capability writes to and deletes from this collection to sync non-app user PINs.
- **`/buildings/{buildingId}/accesses/{userId}`** [Confirmed]
  - *Description*: The global building-level accesses ledger. This capability updates this ledger when a non-app user's access rights are modified.

## 6. Outbound Coupling
This capability depends on the following external modules and sibling submodules:

### Cross-Module Coupling
- **`core` module**:
  - Depends on `@oskey/core/controllers/document` and `@oskey/core/controllers/document_and_message` for base controller classes `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|@oskey/core/controllers/document|#1` ``.
  - Depends on `@oskey/core/access` for core access models and utilities `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_access.service.ts|@oskey/core/access|#1` ``.
  - Depends on `@oskey/core/logger` for logging errors and info `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|@oskey/core/logger|#1` ``.
- **`user` module**:
  - Depends on `@oskey/user/access` and `@oskey/user` for user-level access types and helper methods `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_access.model.ts|@oskey/user/access|#1` ``.
- **`access_control_device` module**:
  - Depends on `access_control_device_activity_enrichment.service` to enrich raw hardware signals into meaningful activity records `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|../../../../../../access_control_device/services/access_control_device_activity_enrichment.service|#1` ``.

### Intra-Module Coupling (Sibling Submodules)
- **`building_activity` submodule**:
  - Imports `building_activity_document.model` to map enriched activities to building-level logs `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser_activity_aggregates.service.ts|../../../../../../building/modules/building_activity/models/documents/building_activity_document.model|#1` ``.
- **`building_unit` submodule**:
  - Imports `building_unit.controller` to validate the existence of the parent unit container `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|../../../controllers/building_unit.controller|#1` ``.
- **`building_accesses` submodule**:
  - Imports `@oskey/building/accesses` to update the building-level accesses ledger `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|@oskey/building/accesses|#1` ``.
- **`building_door` submodule**:
  - Imports `@oskey/building/door` to retrieve door configurations and validate door IDs `` `imports_dependency|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|@oskey/building/door|#1` ``.

## 7. Permissions & Security
- **Security Decorators**: All service methods are decorated with `@OSKUserSecurityChecks({ checkUserIdMatch: false })` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKUserSecurityChecks|createNonAppUser|{ checkUserIdMatch: false }|#1` `` [Confirmed]. This indicates that while the caller's identity is validated, they do not need to match the target non-app user's ID (since non-app users do not have Auth0 accounts or active sessions).
- **Parameter Validation**: Every service method executes `OSKSecurityChecks.checkParameters` to strictly validate incoming payloads (e.g., ensuring `buildingId`, `unitId`, and `nonAppUserId` are valid strings) `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKSecurityChecks.checkParameters|createNonAppUser|[             { name: 'context', value: context, type: 'object' },             { name: 'buildingId', value: request.buildingId, type: 'string' },             { name: 'unitId', value: request.unitId, type: 'string' },             { name: 'firstName', value: request.fullName, type: 'string' },             { name: 'inviterId', value: request.inviterId, type: 'string' },         ]|#1` `` [Confirmed].
- **RBAC Mismatch**: No explicit RBAC permission strings (e.g., `v1.org.residents.create`) are referenced directly within this submodule's code [Inferred]. Security checks likely rely on the caller being a verified ResidentAdmin of the unit or a Property Manager, but the exact mapping is handled by the decorator layer or parent controllers.

## 8. External Hooks
- **IoT Integration (ACD Sync)**: This capability integrates with the platform's asynchronous IoT data pipeline by calling `OSKAccessMessagePublisherService.publishMessageToAllACDs` `` `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|nonAppUserId,buildingId,{                 operation: OSKAccessMessageOperation.Delete,                 accessId: access.accessId,                 creationDate: access.creationDate,             },access.authorizedDoors,{ category: 'nonAppUser', buildingId, unitId }|#1` `` [Confirmed]. This publishes state changes (creations, updates, deletions) to GCP Pub/Sub, which are subsequently synced to physical Intercoms and Digicoms.

## 9. Open Questions
- **Firestore Rules Mismatch**: The `firestore.rules.txt` file does not contain any match rules for the `nonAppUsers` collection path (`/buildings/{buildingId}/units/{unitId}/nonAppUsers`) [Confirmed]. It is highly likely that this collection is restricted to server-side Admin SDK access only (via Cloud Functions), but if client-side SDKs ever need to query non-app users directly, they will be blocked by the default `allow read, write: if false;` rule.
- **Missing Request Schema**: The request schema for `createNonAppUser` is not resolved in the `model_property` facts of this pack [Unknown].
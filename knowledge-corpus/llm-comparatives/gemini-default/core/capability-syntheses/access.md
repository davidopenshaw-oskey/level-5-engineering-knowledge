## 0. Generation Metadata

- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.453Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: access
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary

The **access** capability within the `core` module is responsible for orchestrating the lifecycle of user access rights, generating secure alphanumeric PIN credentials, and publishing real-time synchronization payloads to edge Access Control Devices (ACDs) via Google Cloud Pub/Sub. It acts as the central business logic engine that translates high-level user permissions into physical door-unlocking capabilities across different user categories (OSK Users, Non-App Users, Supplier Staff, and Guests) [**Confirmed**; `` `functions/src/modules/core/modules/access/services/access.service.ts` (lines 115-345) ``].

---

## 2. Primary Responsibilities

### Access Orchestration & Lifecycle Management [Confirmed]
- Coordinates the creation, updating, and deletion of access rights across different user types, including standard OSK App Users, Non-App Users, Supplier Staff, and Guests [`` `functions/src/modules/core/modules/access/services/access.service.ts` (lines 115-345) ``].
- Manages the dual-write access ledger by updating both user-centric collections (`/users/{id}/accesses`) and building-centric collections (`/buildings/{id}/accesses`) [`` `functions/src/modules/core/modules/access/services/access.service.ts` (lines 315-316) ``].
- Handles the cleanup of associated credentials (such as BLE tokens and PIN codes) and updates invitation states when an access record is deleted [`` `functions/src/modules/core/modules/access/services/access.service.ts` (lines 477-585) ``].

### Alphanumeric PIN Code Generation & Validation [Confirmed]
- Generates secure, unique alphanumeric PIN codes based on a predefined schema pattern of digits, letters, and symbols [`` `functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts` (lines 61-69) ``].
- Enforces strict validation rules, such as preventing sequential repeating characters (e.g., no single character repeating 3 or more times) [`` `functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts` (lines 71-105) ``].
- Performs offline-safe uniqueness checks by querying both active building pincodes and the building pincode trash collection to prevent duplicate active codes [`` `functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts` (lines 107-135) ``].

### Edge Synchronization via Pub/Sub [Confirmed]
- Formulates delta payloads containing access state changes (Insert, Update, Delete, Recreate) and publishes them to Pub/Sub topics mapped to specific edge hardware modems [`` `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts` (lines 49-105) ``].
- Resolves the active access methods (such as registered BLE mobile devices or active PIN codes) for a user to construct the cryptographic payload required by the ACD [`` `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts` (lines 232-291) ``].

### Access Update Propagation [Confirmed]
- Monitors and propagates updates to user accesses when building information, door configurations, user profiles, or registered devices change [`` `functions/src/modules/core/modules/access/services/access_update.service.ts` (lines 14-231) ``].
- Automatically regenerates BLE device tokens and pushes updated payloads to ACDs when a user's device list is modified [`` `functions/src/modules/core/modules/access/services/access_update.service.ts` (lines 192-231) ``].

### Pincode Trash & Expiration Management [Confirmed]
- Implements a soft-delete mechanism for building pincodes by moving them to a trash collection (`/buildings/{id}/pincodes_trash`) with an expiration date set to 1 year in the future, preventing immediate reuse while maintaining audit trails [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 657-678) ``].

---

## 3. Public Interfaces (Controllers & Entry Points)

The capability exposes the following public entry points and controllers:

### OSKAccessController [Confirmed]
- **File**: `functions/src/modules/core/modules/access/controllers/access.controller.ts` [`` `source_class|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController` ``]
- **Description**: Inherits from `OSKDocumentAndMessageController` and provides methods to query user accesses by building, door, or user ID, update user accesses, and publish messages to Pub/Sub topics.

### Callable Cloud Functions [Confirmed]
- **File**: `functions/src/modules/core/modules/access/index.ts`
- **Exposed Functions**:
  - `getAllUserAccesses`: Retrieves all access records for a specific user [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|getAllUserAccesses|#1` ``].
  - `getAllUserAccessesPerBuilding`: Retrieves access records for a specific user filtered by building [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|getAllUserAccessesPerBuilding|#1` ``].
  - `onCreatePincodeAnonymousAccess`: Orchestrates the creation of a temporary, anonymous PIN-based access record (typically for quickcodes or temporary visitors) [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|onCreatePincodeAnonymousAccess|#1` ``].

---

## 4. API Contracts & Firestore Triggers

### API Contracts [Confirmed]

#### 1. `getAllUserAccesses`
- **Type**: Callable Cloud Function [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|getAllUserAccesses|#1` ``]
- **Request Schema**: `OSKUserAccessRequestAccessesGetAll`
  - `userId`: `string`
- **Response Schema**: `OSKUserAccessRequestAccessesGetAllResponse` (contains a `data` array of accesses)

#### 2. `getAllUserAccessesPerBuilding`
- **Type**: Callable Cloud Function [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|getAllUserAccessesPerBuilding|#1` ``]
- **Request Schema**: `OSKUserAccessRequestAccessesGetByBuilding`
  - `buildingId`: `string`
  - `userId`: `string`
- **Response Schema**: `OSKUserAccessRequestAccessesGetByBuildingResponse` (contains an `accesses` array)

#### 3. `onCreatePincodeAnonymousAccess`
- **Type**: Callable Cloud Function [`` `api_contract|core|functions/src/modules/core/modules/access/index.ts|onCreatePincodeAnonymousAccess|#1` ``]
- **Request Schema**: `OSKCreatePincodeAnonymousAccessRequest`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `isValidOnce`: `boolean | undefined` (optional)
  - `startDate`: `Date`
  - `unitId`: `string`
  - `userId`: `string`
- **Response Schema**: No matching `model_property` facts resolved for the response type in this pack.

### Firestore Triggers [Inferred]
- No direct Firestore triggers (e.g., `onWrite`, `onCreate`) are defined within this capability's own pack. All operations are driven by callable functions or direct service orchestration.

---

## 5. Data Ownership

This capability directly writes to, updates, or deletes documents within the following Firestore paths:

| Firestore Path | Operations | Scope / Context |
| :--- | :--- | :--- |
| `/users/{userId}/accesses/{buildingId}` | Update, Write | Updates the user's personal access record for a specific building [`` `functions/src/modules/core/modules/access/controllers/access.controller.ts` (line 66) ``]. |
| `/buildings/{buildingId}/pincodes/{pincodeId}` | Write, Delete | Manages active PIN codes assigned to a building [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 677-684) ``]. |
| `/buildings/{buildingId}/pincodes_trash/{pincodeId}` | Write, Update | Soft-deletes pincodes and tracks their expiration [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 646-664) ``]. |
| `/users/{userId}/pincodes/{pincodeId}` | Write, Delete | Manages PIN codes associated with a standard OSK user [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 694-709) ``]. |
| `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes/{pincodeId}` | Write, Delete | Manages PIN codes for non-app inhabitants [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 639-712) ``]. |
| `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes/{pincodeId}` | Write | Manages PIN codes for supplier staff members [`` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 581-588) ``]. |
| `/buildings/{buildingId}/units/{unitId}/inhabitants/{userId}` | Update | Clears the `inhabitantAccessId` field when access is revoked [`` `functions/src/modules/core/modules/access/services/access.service.ts` (lines 533-536) ``]. |

---

## 6. Outbound Coupling

The `access` capability depends on several other modules and submodules within the repository:

### Cross-Module Coupling [Confirmed]

#### 1. `building` Module
- **Submodule**: `building_accesses`
  - **Import Path**: `@oskey/building/accesses`
  - **Used In**: `access.controller.ts`, `access_update.service.ts`, `access.service.ts`
- **Submodule**: `building_door`
  - **Import Path**: `@oskey/building/door`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access_update.service.ts`, `access_utils.service.ts`, `access.service.ts`
- **Submodule**: `building_pincode`
  - **Import Path**: `@oskey/building/pincode`
  - **Used In**: `access_pincode_generation.service.ts`, `access_pincode.service.ts`
- **Submodule**: `building_pincode_trash`
  - **Import Path**: `@oskey/building/pincode_trash`
  - **Used In**: `access_pincode_generation.service.ts`, `access_pincode.service.ts`
- **Submodule**: `building_unit`
  - **Import Path**: `@oskey/building/unit`
  - **Used In**: `access_pincode.service.ts`, `access.service.ts`
- **Submodule**: `building_unit_nonAppUser`
  - **Import Path**: `@oskey/building/unit/nonAppUsers`, `../../../../building/modules/building_unit/modules/building_unit_nonAppUser`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access.service.ts`
- **Root Module**: `building`
  - **Import Path**: `@oskey/building`
  - **Used In**: `access_pincode_generation.service.ts`, `access_pincode.service.ts`, `access.service.ts`

#### 2. `user` Module
- **Submodule**: `user_access`
  - **Import Path**: `@oskey/user/access`
  - **Used In**: `access.controller.ts`, `access_messages.model.ts`, `user_access_request_accesses.document.ts`, `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access_update.service.ts`, `access_utils.service.ts`, `access.service.ts`
- **Submodule**: `user_device`
  - **Import Path**: `@oskey/user/device`
  - **Used In**: `access_message_publisher.service.ts`, `access_update.service.ts`, `access.service.ts`
- **Submodule**: `user_pincode`
  - **Import Path**: `@oskey/user/pincode`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access.service.ts`
- **Submodule**: `user_invitation`
  - **Import Path**: `@oskey/user/invitation`, `./../../../../user/modules/user_invitation/controllers/...`
  - **Used In**: `access_pincode.service.ts`, `access.service.ts`
- **Root Module**: `user`
  - **Import Path**: `@oskey/user`
  - **Used In**: `access_pincode.service.ts`, `access_utils.service.ts`, `access.service.ts`

#### 3. `supplier` Module
- **Root Module**: `supplier`
  - **Import Path**: `@oskey/supplier`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access.service.ts`

#### 4. `organization` Module
- **Submodule**: `organization_user_access`
  - **Import Path**: `@oskey/organization/user/access`
  - **Used In**: `access_utils.service.ts`

#### 5. `access_control_device` Module
- **Root Module**: `access_control_device`
  - **Import Path**: `@oskey/access_control_device`
  - **Used In**: `access_update.service.ts`

---

### Intra-Module Coupling (Sibling Submodules) [Confirmed]

- `@oskey/core/controllers/document_and_message`: Imported by `access.controller.ts` to inherit base document and message controller capabilities.
- `@oskey/core/logger`: Imported by services to log debug, info, warning, and error messages.
- `@oskey/core`: Imported by controllers and services for shared core utilities.

---

## 7. Permissions & Security

### Security Decorators [Confirmed]
- The callable function `onCreatePincodeAnonymousAccess` is protected by two security decorators:
  - `OSKUserSecurityChecks`: Enforces user-level authentication and identity verification [`` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserSecurityChecks|onCreatePincodeAnonymousAccess||#1` ``].
  - `OSKVerifyAccessValid`: Verifies that the requesting user has valid permissions to create access for the target building and unit [`` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKVerifyAccessValid|onCreatePincodeAnonymousAccess||#1` ``].

### App Check Enforcement [Confirmed]
- Callable triggers are configured with Firebase App Check to prevent unauthorized client requests:
  - `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` [`` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``].

### RBAC Mismatches [Inferred]
- No explicit RBAC permission strings (e.g., `v1.org.residents.create`) are directly referenced or checked in the codebase facts of this capability. Security is delegated to the `OSKVerifyAccessValid` decorator and Firestore Security Rules.

---

## 8. External Hooks

The capability interacts with the following external boundaries:

### Pub/Sub Topic Publishing [Confirmed]
- **Topic Resolution**: Dynamically resolved via `this.getTopicName()` [`` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|this.getTopicName|publishMessage||#1` ``].
- **Publishing Call**: Publishes serialized access payloads to the resolved topic mapped to a specific `accessControlDeviceId` [`` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController.default._publishMessage|publishMessage|topicName,accessControlDeviceId,payload|#1` ``].

### Environment Variables [Confirmed]
- `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass Firebase App Check during local emulator testing [`` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``].

---

## 9. Open Questions

- **Pub/Sub Topic Naming Convention**: The exact naming convention returned by `this.getTopicName()` is not defined within this capability's evidence pack.
- **BLE Token Cryptography**: The exact cryptographic algorithm used to sign and decompress BLE tokens (e.g., `publicSigningKeys`, `publicEncryptionKeys`) is handled by the `user_device` submodule and is not visible in this pack.
- **SIP/WebRTC Call Routing Integration**: While the architecture overview mentions STUN/TURN signaling for intercom calls, the `access` capability only manages the static access permissions and does not contain call-routing execution logic.
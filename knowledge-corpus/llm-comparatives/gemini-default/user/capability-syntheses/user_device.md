## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.564Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_device
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_device` capability manages user mobile and Bluetooth-enabled devices (such as smartphones and smartwatches) and provisions secure Access Control Device (ACD) tokens (SecureBLE tokens) to enable offline door unlocking via Bluetooth Low Energy (BLE) `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 169-235). [Confirmed]

---

## 2. Primary Responsibilities
- **User Device Management**: Handles CRUD operations (saving, deleting, listing, and retrieving) for user devices under the `/users/{userId}/devices/{deviceId}` path `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 19-47). [Confirmed]
- **Access Control Device (ACD) Token Provisioning**: Generates and manages SecureBLE tokens (`OSKUserDeviceAccessControlDeviceToken`) for user devices to allow offline door unlocking `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 169-235). [Confirmed]
- **Access Synchronization**: Listens to Firestore document changes on user devices (`onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`) and triggers downstream updates to refresh user access devices via `OSKAccessUpdateService.updateUserAccessDevices` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 73-167). [Confirmed]
- **Cryptographic Token Signing**: Signs SecureBLE tokens using the building's ACD private key retrieved from `OSKSecretService` and the `OSKAccessControlDeviceTokenPayload` model `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 180-224). [Confirmed]
- **Security & Parameter Validation**: Enforces security boundaries and validates parameters for incoming requests using `OSKUserSecurityChecks` and `OSKSecurityChecks.checkParameters` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 38-71). [Confirmed]

---

## 3. Public Interfaces (Controllers & Entry Points)
- **OSKUserDeviceController**: Extends `OSKDocumentController` to expose standard document operations for user devices `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 12-47). [Confirmed]
- **OSKUserDeviceAccessControlDeviceTokenController**: Extends `OSKDocumentController` to manage the subcollection of access control device tokens for a specific user device `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 11-44). [Confirmed]
- **OSKUserDeviceService**: Orchestrates the business logic for user devices, including callable functions and Firestore trigger handlers `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 35-237). [Confirmed]
- **Callable Functions**:
  - `getDevicesUserList`: Retrieves the list of devices for a user `` `api_contract|user|functions/src/modules/user/modules/user_device/index.ts|getDevicesUserList|#1` ``. [Confirmed]
  - `removeUserDevice`: Removes a registered user device `` `api_contract|user|functions/src/modules/user/modules/user_device/index.ts|removeUserDevice|#1` ``. [Confirmed]

---

## 4. API Contracts & Firestore Triggers

### API Contracts
- **getDevicesUserList**
  - **Request Schema**: `OSKGetUserDeviceListRequestData`
    - `userId`: `string`
  - **Response Schema**: No `model_property` facts matched within this pack for the response schema.
- **removeUserDevice**
  - **Request Schema**: `OSKRemoveUserDeviceRequestData`
    - `deviceId`: `string`
    - `userId`: `string`
  - **Response Schema**: No `model_property` facts matched within this pack for the response schema.

### Firestore Triggers
- **Path**: `/users/{userId}/devices/{deviceId}`
  - **onCreate**: Triggers `OSKUserDeviceService.onDocumentCreated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentCreated|#1` ``. [Confirmed]
  - **onUpdate**: Triggers `OSKUserDeviceService.onDocumentUpdated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentUpdated|#1` ``. [Confirmed]
  - **onDelete**: Triggers `OSKUserDeviceService.onDocumentDeleted` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentDeleted|#1` ``. [Confirmed]

---

## 5. Data Ownership

### Firestore Paths Touched
- `/users/{userId}/devices/{deviceId}`
  - **Operation**: Undetermined (may be indirect) `` `firestore_path_touched|user|functions/src/modules/user/modules/user_device/index.ts|/users/{userId}/devices/{deviceId}|#1` ``. [Confirmed]
- `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens/{tokenId}`
  - **Operation**: Managed via `OSKUserDeviceAccessControlDeviceTokenController` `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 14-44). [Confirmed]

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **core**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts|@oskey/core/controllers/document|#1` ``.
  - Imports `OSKAccessUpdateService` from `@oskey/core/access` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/core/access|#1` ``.
  - Imports `OSKLoggingService` from `@oskey/core/logger` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/core/logger|#1` ``.
  - Imports public key types from `@oskey/core/public_key` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/core/public_key|#1` ``.
- **access_control_device**:
  - Imports `OSKAccessControlDeviceTokenPayload` from `@oskey/access_control_device` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/access_control_device|#1` ``.
- **building**:
  - Imports `OSKBuildingDoorAccessControlDeviceController` from `@oskey/building/door` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/building/door|#1` ``.

### Intra-Module Coupling (Sibling Submodules)
- **user_access**:
  - Imports `OSKUserAccessesController` from `@oskey/user/access` `` `imports_dependency|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|@oskey/user/access|#1` ``.

---

## 7. Permissions & Security
- **Security Decorators**: Uses `OSKUserSecurityChecks` to protect service methods `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 38, 54). [Confirmed]
- **Permission Errors**:
  - Throws `permission-denied` errors if security checks fail during device listing or device removal `` `permission_error|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|permission-denied|#1` ``. [Confirmed]
- **RBAC Cross-Check**: No explicit RBAC permission strings (e.g., `v1.admin.user.devices.delete`) are directly referenced in the code facts of this submodule, but the security checks decorator `OSKUserSecurityChecks` is applied. [Confirmed]

---

## 8. External Hooks
- No external hooks (such as Pub/Sub publishers, external HTTP paths, environment variables, or storage paths) are explicitly evidenced within this capability's pack. [Confirmed]

---

## 9. Open Questions
- **Response Schemas**: What are the exact response structures for `getDevicesUserList` and `removeUserDevice`? No `model_property` facts matched within this pack to define them. [Inferred]
- **Security Decorator Mapping**: How does `OSKUserSecurityChecks` internally map to the RBAC roles or Auth0 sub validation? [Inferred]
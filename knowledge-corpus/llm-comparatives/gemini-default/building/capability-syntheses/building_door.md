# Capability Synthesis — building_door

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.411Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_door
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `building_door` capability manages the lifecycle of physical doors within a building, handles the assignment and unassignment of Access Control Devices (ACDs) to those doors, and orchestrates the generation and deletion of cryptographic key pairs for assigned devices. [Confirmed] This capability acts as a bridge between logical building structures and physical hardware configurations, ensuring that door updates or deletions are propagated to user accesses and intercom directories. [Confirmed]

---

## 2. Primary Responsibilities

### Door Lifecycle Management
- **Create, Read, Update, and Delete Doors**: The capability provides administrative interfaces to create, retrieve, update, and delete building doors. [Confirmed; `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``, `` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``]
- **Access Propagation on Update**: When a door's information (such as its name or street address) is updated, the capability triggers an asynchronous update to propagate these changes to all user accesses associated with that door. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.updateUserAccessesDoorInfo|organizationUserUpdateBuildingDoor|oldBuildingDoor,doorInfo|#1` ``]
- **Access Pruning on Deletion**: When a door is deleted, the capability ensures that the door is removed from all user accesses and prevents deletion if active accesses still exist. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKAccessUpdateService.removeDoorFromUserAccesses|deleteBuildingDoor|request.doorId,request.buildingId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|OSKBuildingDoorService.logger.logError|deleteBuildingDoor|`internal: Cannot delete door with id ${request.doorId} because accesses exist!`,{ doorId: request.doorId }|#1` ``]

### Access Control Device (ACD) Assignment
- **Device Assignment Orchestration**: Upon the creation of a building door device document, the capability automatically assigns the physical ACD to the building and door, saves its configuration, and registers it in the intercom directory. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceController.default.assignBuildingDoor|onDocumentCreated|deviceId,buildingId,doorId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceConfigController.default.save|onDocumentCreated|data|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKBuildingIntercomService.createIntercomEntry|onDocumentCreated|deviceId,buildingId,doorId|#1` ``]
- **Device Unassignment Orchestration**: Upon deletion of a building door device document, the capability unassigns the ACD and deletes its configuration. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceController.default.unassignBuildingDoor|onDocumentDeleted|deviceId|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|OSKAccessControlDeviceConfigController.default.deleteAll|onDocumentDeleted|deviceId|#1` ``]

### Cryptographic Key Management
- **Key Pair Generation**: When an ACD is assigned to a door, the capability generates an Elliptic Curve (prime256v1) public/private key pair. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|crypto.generateKeyPairSync|generateKeys|'ec',{             namedCurve: 'prime256v1',         }|#1` ``]
- **Secret Storage**: The generated private key is securely stored using the platform's secret service, while the public key is saved in Firestore. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|OSKSecretService.createPrivateKeySecret|generateKeys|accessControlDeviceId,privateKey|#1` ``, `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|firestore()                 .collection(                     `/buildings/${buildingId}/doors/${doorId}/accessControlDevices/${accessControlDeviceId}/keys`                 )                 .doc('publicKey')                 .set|generateKeys|publicKey|#1` ``]
- **Key Deletion**: When a device is unassigned, its public keys are deleted from Firestore. [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|db                 .collection(`/buildings/${buildingId}/doors/${doorId}/accessControlDevices/${deviceId}/keys`)                 .doc('publicKey')                 .delete|deletePublicKeys||#1` ``]

---

## 3. Public Interfaces (Controllers & Entry Points)

The capability exposes the following controllers and services as public entry points:

### `OSKBuildingDoorService`
- **File**: `functions/src/modules/building/modules/building_door/services/building_door.service.ts`
- **Description**: The primary service orchestrating the business logic for building doors, including permission checks, parameter validation, and coordination with other services. [Confirmed]

### `OSKBuildingDoorController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door.controller.ts`
- **Description**: A document controller extending `OSKDocumentController` that manages direct Firestore operations on the `/buildings/{buildingId}/doors` collection. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts`
- **Description**: A document controller extending `OSKDocumentController` that manages direct Firestore operations on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices` collection. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceKeysController`
- **File**: `functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts`
- **Description**: A controller dedicated to generating, retrieving, and deleting cryptographic keys for access control devices assigned to doors. [Confirmed]

### `OSKBuildingDoorAccessControlDeviceService`
- **File**: `functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts`
- **Description**: A service that handles Firestore document triggers for device assignments. [Confirmed]

---

## 4. API Contracts & Firestore Triggers

### Callable Functions
The capability exposes five callable Cloud Functions:

#### `organizationUserGetAllBuildingDoors`
- **Request Type**: `{ organizationId: string, buildingId: string }` [Confirmed; `` `functions/src/modules/building/modules/building_door/services/building_door.service.ts` (lines 35-40) ``]
- **Response Type**: `OSKBuildingDoor[]` [Inferred]

#### `organizationUserGetBuildingDoorById`
- **Request Type**: `OSKBuildingDoorGetRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserCreateBuildingDoor`
- **Request Type**: `OSKBuildingDoorCreateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserUpdateBuildingDoor`
- **Request Type**: `OSKBuildingDoorUpdateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `deleteBuildingDoor`
- **Request Type**: `OSKBuildingDoorDeleteRequest` [Confirmed]
- **Response Type**: `void` [Inferred]

### Firestore Triggers
The capability registers two Firestore triggers on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` path:

#### `onDocumentCreated`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 44) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onCreate|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentCreated|#1` ``]

#### `onDocumentDeleted`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 47) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onDelete|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted|#1` ``]

---

## 5. Data Ownership

The capability owns and performs direct read/write operations on the following Firestore paths:

| Firestore Path | Operations | Detection Scope |
| :--- | :--- | :--- |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys` | `set` | `partial` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{accessControlDeviceId}/keys|#1` ``] |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys` | `get`, `delete` | `partial` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys|#1` ``] |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | `onCreate`, `onDelete` | `resolved_constant` [Confirmed; `` `firestore_path_touched|building|functions/src/modules/building/modules/building_door/index.ts|/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}|#1` ``] |

---

## 6. Outbound Coupling

The `building_door` capability depends on the following modules and submodules:

### Cross-Module Coupling
- **`core`**:
  - Imports logging and secret services. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device_keys.controller.ts|@oskey/core/logger|#1` ``, `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|../../../../core/services/logging.service|#1` ``]
  - Imports access update services to propagate door changes to user accesses. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|@oskey/core/access|#1` ``]
- **`access_control_device`**:
  - Imports controllers to assign/unassign devices and manage configurations. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|@oskey/access_control_device|#1` ``]
- **`organization`**:
  - Imports organization user utilities to fetch admin context. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|@oskey/organization/user|#1` ``]
- **`settings`**:
  - Imports role controllers to validate user permissions. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|@oskey/settings/role|#1` ``]

### Intra-Module Coupling (Sibling Submodules)
- **`building_intercom`**:
  - Imports `OSKBuildingIntercomService` to register intercom entries when devices are assigned to doors. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door_access_control_device.service.ts|@oskey/building/intercom|#1` ``]
- **`building` (Root)**:
  - Imports `OSKBuildingController` to verify building existence. [Confirmed; `` `imports_dependency|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|@oskey/building|#1` ``]

---

## 7. Permissions & Security

The capability enforces the following permission checks:

| Operation | Permission String | RBAC Match Status |
| :--- | :--- | :--- |
| `organizationUserGetAllBuildingDoors` | `v1.org.buildings.view` | **Match**: Listed in RBAC roles as "Allows to view the details of a building". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``] |
| `organizationUserGetBuildingDoorById` | `v1.org.buildings.view` | **Match**: Listed in RBAC roles as "Allows to view the details of a building". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.view|#1` ``] |
| `organizationUserCreateBuildingDoor` | `v1.org.buildings.edit` | **Match**: Listed in RBAC roles as "Allows to edit a building's information". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#1` ``] |
| `organizationUserUpdateBuildingDoor` | `v1.org.buildings.edit` | **Match**: Listed in RBAC roles as "Allows to edit a building's information". [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.edit|#2` ``] |
| `deleteBuildingDoor` | `v1.org.buildings.createManager` | **Mismatch**: This permission string is referenced in code but is **not** present in the `rbac-roles.json` document. [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``] |

---

## 8. External Hooks
No external hooks (such as Pub/Sub publishers, external HTTP integrations, or cloud storage paths) are directly evidenced within this capability's pack. [Confirmed]

---

## 9. Open Questions

- **RBAC Permission Mismatch**: Why does `deleteBuildingDoor` check for `v1.org.buildings.createManager` instead of `v1.org.buildings.delete` or `v1.org.buildings.edit`? The permission `v1.org.buildings.createManager` is completely missing from the authoritative RBAC roles document. [Confirmed; `` `permission_candidate|building|functions/src/modules/building/modules/building_door/services/building_door.service.ts|v1.org.buildings.createManager|#1` ``]
- **Inbound Coupling**: Which other capabilities or modules depend on `building_door` to read door configurations or validate access? (This is invisible from the current capability pack). [Inferred]
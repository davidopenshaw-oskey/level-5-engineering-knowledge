### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T16:40:21.414Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `access_control_device`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

---

### 1. Executive Summary

The `access_control_device` module serves as the platform's hardware-abstraction and edge-synchronization layer [Inferred]. It manages the lifecycle, configurations, public keys, operational states, system logs, and access commands of physical Access Control Devices (ACDs), such as Intercoms and Digicoms [Confirmed]. The module orchestrates the delivery of configuration payloads and cryptographic keys to physical edge devices via external APIs and Pub/Sub messaging, and it provides a centralized enrichment service that translates raw, edge-originated activity signals into context-rich business records containing user, building, and door details [Confirmed].

---

### 2. Architectural Position

The `access_control_device` module sits between the physical edge hardware layer and the cloud-native business domain modules (such as `building`, `organization`, and `user`) [Inferred]. 
- **Parent Scope**: Root module level [Confirmed].
- **Owned Concepts**: Physical Access Control Devices (ACDs), device configurations, cryptographic public keys, device states, system logs, and outbound access commands [Confirmed].
- **Provided Capabilities**: Device lifecycle management (registration, assignment, unassignment), edge configuration synchronization, cryptographic key maintenance, and edge-activity log enrichment [Confirmed].

---

### 3. Primary Responsibilities

#### _module_root

### Device Lifecycle & Assignment Management [Confirmed]
- Handles the registration, retrieval, updating, and deletion of Access Control Devices (ACDs) in Firestore `` `functions/src/modules/access_control_device/controllers/access_control_device.controller.ts` (lines 28-54) ``.
- Manages the assignment of ACDs to specific building doors (`assignBuildingDoor`) and handles unassignment (`unassignBuildingDoor`), updating the corresponding user accesses via the `OSKAccessUpdateService` `` `functions/src/modules/access_control_device/controllers/access_control_device.controller.ts` (lines 56-103) ``.

### Device Configuration Management [Confirmed]
- Manages the creation, retrieval, deletion, and querying of device configurations under the `/accessControlDevices/{id}/configs` path `` `functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (lines 27-84) ``.
- Publishes configuration updates to edge devices via Pub/Sub messaging `` `functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (lines 90-93) ``.

### Public Key Management [Confirmed]
- Manages cryptographic and signing public keys for ACDs, allowing keys to be added, deleted, and retrieved `` `functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (lines 26-72) ``.
- Exposes callable Cloud Functions (`onAddAccessControlDevicePublicKeyCalled` and `onDeleteAccessControlDevicePublicKeyCalled`) to allow authorized clients to manage device public keys `` `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts` (lines 110-202) ``.
- Publishes public key updates to edge devices via Pub/Sub `` `functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (lines 74-89) ``.

### Activity Log Enrichment [Confirmed]
- Enriches raw hardware-originated activity logs with business context by resolving the associated `userId`, `buildingId`, and `doorId` to fetch detailed user profiles, building names, and door names `` `functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts` (lines 40-174) ``.

### Edge Device Communication (Node IoT API) [Confirmed]
- Communicates with an external Node IoT API to register and unregister devices, utilizing Google Cloud IAM Credentials to sign JWTs for secure service-to-service authentication `` `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (lines 20-73) ``.

---

### 4. Public Interfaces

#### _module_root

This capability exposes the following controllers and services:

### OSKAccessControlDeviceController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device.controller.ts`
- **Description**: Manages the core `/accessControlDevices` Firestore documents, including door assignments and provisioning dates.

### OSKAccessControlDeviceAccessCommandsController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device_access_commands.controller.ts`
- **Description**: Manages access commands sent to devices under `/accessControlDevices/{deviceId}/accessCommands`.

### OSKAccessControlDeviceConfigController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts`
- **Description**: Manages configurations under `/accessControlDevices/{deviceId}/configs` and handles Pub/Sub publishing.

### OSKAccessControlDevicePublicKeysController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts`
- **Description**: Manages public keys under `/accessControlDevices/{deviceId}/publicKeys` and publishes key updates.

### OSKAccessControlDeviceStateController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device_state.controller.ts`
- **Description**: Manages device telemetry/state documents under `/accessControlDevices/{deviceId}/states`.

### OSKAccessControlDeviceSystemLogsController [Confirmed]
- **File**: `functions/src/modules/access_control_device/controllers/access_control_device_system_logs.controller.ts`
- **Description**: Manages system logs under `/accessControlDevices/{deviceId}/systemLogs`.

### OSKNodeIoTAPIService [Confirmed]
- **File**: `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts`
- **Description**: Handles outbound HTTP communication with the external Node IoT API.

### OSKActivityEnrichmentService [Confirmed]
- **File**: `functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts`
- **Description**: Enriches raw activity logs with user, building, and door metadata.

---

### 5. Internal Structure

- **Intra-Module Coupling Note**: The deterministic intra-module coupling graph confirms that the `access_control_device` module contains no submodules (`submoduleCount: 0`) [Confirmed]. All services, controllers, and models are managed directly within the module root (`_module_root`) [Confirmed].

---

### 6. Firestore & Data Ownership

**Ownership conclusion:**

- **Data Ownership Conclusion**: The `access_control_device` module is the authoritative owner of the `/accessControlDevices/{deviceId}` collection and all of its nested subcollections, including `/configs`, `/publicKeys`, `/states`, `/systemLogs`, and `/accessCommands` [Inferred]. 
While multiple external modules interact with these paths, they do so strictly through public interfaces exposed by this module [Inferred]. Deterministic call signals show that `OSKAccessControlDeviceController` is called by `admin`, `building`, and `call` to manage device assignments and lookups [Confirmed]. `OSKAccessControlDeviceConfigController` is called by `building` and `organization` to push configuration updates [Confirmed]. `OSKActivityEnrichmentService` is called by `call` and `core` to process incoming edge events [Confirmed]. No external modules perform direct, un-encapsulated Firestore writes to these collections in the codebase, preserving strict logical data ownership [Inferred].

---

**Per-capability evidence:**

#### _module_root

This capability owns and performs read/write operations on the following Firestore paths:

### `/accessControlDevices/{deviceId}` [Confirmed]
- **Operations**: `get`, `save`, `update`, `delete`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device.controller.ts` (lines 28-103) ``

### `/accessControlDevices/{deviceId}/configs/{configId}` [Confirmed]
- **Operations**: `get`, `save`, `delete`, `query`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (lines 27-84) ``

### `/accessControlDevices/{deviceId}/publicKeys/{keyType}` [Confirmed]
- **Operations**: `get`, `save`, `delete`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (lines 26-72) ``

### `/accessControlDevices/{deviceId}/states/{stateId}` [Confirmed]
- **Operations**: `get`, `save`, `delete`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device_state.controller.ts` (lines 16-33) ``

### `/accessControlDevices/{deviceId}/systemLogs/{logId}` [Confirmed]
- **Operations**: `get`, `save`, `delete`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device_system_logs.controller.ts` (lines 16-35) ``

### `/accessControlDevices/{deviceId}/accessCommands/{commandId}` [Confirmed]
- **Operations**: `get`, `save`, `delete`
- **Citation**: `` `functions/src/modules/access_control_device/controllers/access_control_device_access_commands.controller.ts` (lines 16-38) ``

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable API Contracts [Confirmed]

#### `onAddAccessControlDevicePublicKeyCalled`
- **File**: `functions/src/modules/access_control_device/index.ts` (lines 110-155)
- **Request Type**: `OSKAccessControlDevicePublicKeyAddRequest`
  - `deviceId`: `string`
  - `keyType`: `"signing" | "crypto"`
- **Response Type**: `Promise<any>` (Implicit)
- **Citation**: `` `api_contract|access_control_device|functions/src/modules/access_control_device/index.ts|onAddAccessControlDevicePublicKeyCalled|#1` ``

#### `onDeleteAccessControlDevicePublicKeyCalled`
- **File**: `functions/src/modules/access_control_device/index.ts` (lines 157-202)
- **Request Type**: `OSKAccessControlDevicePublicKeyDeleteRequest`
  - `deviceId`: `string`
  - `keyType`: `"signing" | "crypto"`
- **Response Type**: `Promise<any>` (Implicit)
- **Citation**: `` `api_contract|access_control_device|functions/src/modules/access_control_device/index.ts|onDeleteAccessControlDevicePublicKeyCalled|#1` ``

---

### Firestore Triggers [Confirmed]

#### `/accessControlDevices/{deviceId}`
- **onCreate**: Triggers `OSKAccessControlDeviceService.onDocumentCreated` to initialize the device record `` `functions/src/modules/access_control_device/index.ts` (line 78) ``.
- **onDelete**: Triggers `OSKAccessControlDeviceService.onDocumentDeleted` to clean up all subcollections (configs, public keys, system logs, states, access commands) `` `functions/src/modules/access_control_device/index.ts` (line 81) ``.

#### `/accessControlDevices/{deviceId}/configs/{configId}`
- **onCreate**: Triggers `OSKAccessControlDeviceConfigService.onDocumentCreated` to publish the new configuration `` `functions/src/modules/access_control_device/index.ts` (line 84) ``.
- **onUpdate**: Triggers `OSKAccessControlDeviceConfigService.onDocumentUpdated` to publish configuration updates `` `functions/src/modules/access_control_device/index.ts` (line 87) ``.
- **onDelete**: Triggers `OSKAccessControlDeviceConfigService.onDocumentDeleted` to publish configuration removal `` `functions/src/modules/access_control_device/index.ts` (line 90) ``.

#### `/accessControlDevices/{deviceId}/publicKeys/{keyType}`
- **onCreate**: Triggers `OSKAccessControlDevicePublicKeysService.onDocumentCreated` to publish the new public keys `` `functions/src/modules/access_control_device/index.ts` (line 93) ``.
- **onDelete**: Triggers `OSKAccessControlDevicePublicKeysService.onDocumentDeleted` to publish key removal `` `functions/src/modules/access_control_device/index.ts` (line 96) ``.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

- **Cross-Cutting Security Callouts**: 
  - **Mental Enforcement Tally**: The module relies heavily on caller-side security enforcement or database-level rules rather than internal controller-level RBAC checks [Inferred]. The only explicit permission check embedded within the module's services is `accessControlDevice.publicKey.maintain`, which is validated during public key addition to ensure the calling user belongs to an organization with key maintenance authority [Confirmed]. Other highly sensitive operations—such as registering, editing, or deleting devices—do not contain explicit RBAC checks within this module's controllers, relying instead on the calling modules (`admin`, `building`) to enforce their respective permissions (e.g., `v1.admin.accessControlDevice.delete`) [Inferred].
  - **Unattributed Security-Relevant Signals**: The permission string `accessControlDevice.publicKey.maintain` is actively checked in `OSKAccessControlDevicePublicKeysService` [Confirmed], but it is completely missing from the canonical `rbac-roles.json` schema. This represents an undocumented security boundary that bypasses standard RBAC roles [Confirmed].
  - **Database-Layer Exposure**: Firestore security rules (`firestore.rules.txt`) reveal that `/accessControlDevices/{deviceId}` and all of its subcollections (including `/configs`, `/publicKeys`, `/logs`, and `/states`) allow both `read` and `write` operations to any authenticated user (`isValidUser()`) [Confirmed]. Because the database layer does not restrict access based on organization or building boundaries, the platform is entirely dependent on application-layer controller guards to prevent cross-tenant data tampering or unauthorized device configuration access [Inferred].

---

**Per-capability evidence:**

#### _module_root

### Referenced Permissions [Confirmed]
- `accessControlDevice.publicKey.maintain`: Checked during public key addition to ensure the user belongs to an organization with key maintenance authority `` `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts` (line 141) ``.

### RBAC Mismatch [Confirmed]
- **Mismatch**: The permission string `accessControlDevice.publicKey.maintain` is referenced in the code but is **not** listed in the canonical `rbac-roles.json` document. The closest matching administrative permissions in the RBAC document are `v1.admin.accessControlDevice.edit` and `v1.admin.accessControlDevice.register`.

---

### 10. Cross-Module Relationships

The `access_control_device` module maintains extensive bidirectional relationships across the repository, acting as a central utility for hardware orchestration and event processing [Inferred].

#### Outbound Dependencies (Confirmed)
- **`core`**: The module relies on `core` for system logging, database persistence, and user access updates. It calls `OSKLoggingService` (`logError`, `logInfo`, `logWarning`), inherits CRUD operations from `OSKDocumentAndMessageController` (`_get`, `_set`, `_delete`, `_deleteAll`, `_publishMessage`, `_query`), and utilizes `OSKAccessUpdateService` (`addAccessControlDeviceToUserAccessesDoor`, `removeAccessControlDeviceFromUserAccessesDoor`) to update user-centric access permissions when devices are assigned or unassigned.
- **`building`**: Used to resolve physical context during activity log enrichment. It calls `OSKBuildingController.getSafe`, `OSKBuildingDoorController.getSafe`, and `OSKBuildingAccessesController.get` to map raw device IDs to physical buildings, doors, and authorized resident lists.
- **`user`**: Used to resolve user profiles during activity enrichment. It calls `OSKUserController.get` to translate raw credentials or tokens into verified user identities.
- **`organization`**: Used to validate organizational boundaries during key maintenance. It calls `OSKOrganizationController.get` to verify that a user has authority over the device's parent organization.

#### Inbound Dependencies (Confirmed)
- **`admin`**: Calls `OSKAccessControlDeviceController` (`getAll`, `update`) to perform global administrative maintenance and device provisioning.
- **`building`**: Calls `OSKAccessControlDeviceController` (`assignBuildingDoor`, `get`, `unassignBuildingDoor`) and `OSKAccessControlDeviceConfigController` (`save`, `deleteAll`) to bind physical devices to doors and manage their local configurations.
- **`call`**: Calls `OSKAccessControlDeviceController.get` to resolve device details and `OSKActivityEnrichmentService.enrichAndValidateActivity` to log intercom directory call events.
- **`core`**: Calls `OSKAccessControlDeviceAccessCommandsController.save`, `OSKAccessControlDeviceStateController.save`, and `OSKAccessControlDeviceSystemLogsController.save` via Pub/Sub receivers to ingest asynchronous edge payloads. It also routes raw hardware events to `OSKActivityEnrichmentService.enrichAndValidateActivity`.
- **`organization`**: Calls `OSKAccessControlDeviceConfigController` (`getMostRecent`, `save`) to manage and push intercom-specific communication configurations.
- **`supplier`**: Imports activity enrichment types to log and aggregate supplier staff entry events.
- **`user`**: Imports activity enrichment types and token payloads to manage mobile device tokens and log resident entry events.

---

### 11. External Hooks

#### _module_root

### Pub/Sub Integrations [Confirmed]
- **Topic**: `accessControlDeviceConfigs`
  - **Action**: Publishes public key updates (`update` or `remove` actions) to edge devices `` `functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (line 84) ``.
- **Topic**: Dynamic topic name retrieved via `this.getTopicName()`
  - **Action**: Publishes configuration updates to edge devices `` `functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (line 92) ``.

### HTTP / External API Integrations [Confirmed]
- **Service**: `OSKNodeIoTAPIService`
  - **Action**: Makes outbound HTTP `POST` and `DELETE` requests to an external IoT API (e.g., `devices/${deviceId}`) using Axios `` `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (lines 51-73) ``.
  - **Authentication**: Signs JWT payloads using Google Cloud's IAM Credentials API (`@google-cloud/iam-credentials`) with a designated service account `` `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (lines 20-44) ``.

---

### 12. Architectural Observations

- **Hardware Abstraction Layer Pattern**: The module successfully isolates the physical complexities of edge hardware from business logic [Inferred]. Domain modules like `building` or `organization` do not need to understand device-specific configurations, public key cryptography, or raw log formats; they interact with clean, high-level abstractions [Inferred].
- **Centralized Enrichment Orchestration**: The `OSKActivityEnrichmentService` represents a key architectural pattern [Confirmed]. Rather than requiring edge devices to write complex business records, or forcing individual consuming modules to resolve context, this service acts as a single pipeline that ingests raw hardware signals and joins them with `user`, `building`, and `door` data to produce enriched, standardized activity logs [Inferred].
- **Asynchronous Command and State Synchronization**: The separation of `/configs`, `/states`, `/systemLogs`, and `/accessCommands` into distinct subcollections, combined with inbound calls from `core`'s Pub/Sub receivers, confirms an event-driven, asynchronous synchronization architecture [Inferred]. This design ensures that business transactions (such as updating a configuration) are decoupled from physical device connectivity [Inferred].

---

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Critical RBAC Mismatch**: The permission string `accessControlDevice.publicKey.maintain` is hardcoded as a security guard during public key registration [Confirmed], but it does not exist in the canonical `rbac-roles.json` schema. This bypasses standard role-based access controls and could lead to authorization failures or unmanageable permission states [Inferred].
- **High-Risk Firestore Rules Exposure**: Firestore security rules permit any authenticated user (`isValidUser()`) to read and write to `/accessControlDevices` and all nested subcollections [Confirmed]. Because there are no resource-level tenant or building isolation checks at the database layer, any authenticated user could theoretically read or modify device configurations, public keys, or access commands if application-layer controller guards are bypassed or misconfigured [Inferred].
- **Undocumented MQTT Transport**: The model `OSKAccessControlDeviceMqttConfig` exists within the codebase [Confirmed], but there is no evidence in the module's active services showing how MQTT connections are established, secured, or managed. It is unclear if MQTT is an active transport layer or a legacy architectural candidate [Confirmed].

**Per-capability open questions:**

#### _module_root

- **External IoT API Base URL**: The exact base URL or environment variable configuration for the external Node IoT API is not defined in the provided evidence pack `` `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (line 46) ``.
- **RBAC Permission Discrepancy**: Why is `accessControlDevice.publicKey.maintain` used in the codebase instead of a standard `v1.admin.accessControlDevice.*` permission from the RBAC roles document? `` `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts` (line 141) ``.
- **MQTT Configuration Usage**: The file `functions/src/modules/access_control_device/models/shared/access_control_device_mqtt_config.model.ts` exists in the source files, but there is no explicit evidence in this pack showing how MQTT connections are established or managed.

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
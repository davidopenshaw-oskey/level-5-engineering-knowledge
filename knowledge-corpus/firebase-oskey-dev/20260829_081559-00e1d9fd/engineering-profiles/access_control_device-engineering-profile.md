### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T11:58:22.682Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `access_control_device`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `access_control_device` module manages the lifecycle, configuration, public keys, states, and system logs of physical Access Control Devices (ACDs), including Intercoms and Digicoms [Confirmed]. It serves as the primary bridge between the cloud platform and physical edge hardware, handling offline token payload generation, synchronizing state changes to physical hardware via Pub/Sub and external IoT APIs, and enriching raw hardware-originated activity logs with business context (such as building, door, and user details) before they are persisted [Confirmed].

### 2. Architectural Position

The module sits at the boundary between the platform's core business logic and the physical edge hardware ecosystem [Confirmed]. It acts as the gatekeeper for the `/accessControlDevices` Firestore collection and its subcollections, exposing clean controller interfaces to administrative, building, and calling services [Confirmed]. It owns the logical concepts of device configurations, public keys, device states, and system logs, translating high-level business rules (such as door assignments and intercom communication settings) into hardware-compatible payloads [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **ACD Lifecycle & Door Assignment**: Handles registering, unregistering, and assigning/unassigning ACDs to building doors [Confirmed] (`controller_method|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device.controller.ts|OSKAccessControlDeviceController|assignBuildingDoor|#1`, `controller_method|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device.controller.ts|OSKAccessControlDeviceController|unassignBuildingDoor|#1`).
- **Configuration Management**: Manages storing, retrieving, and deleting ACD configurations, and publishes configuration updates to Pub/Sub [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (lines 72-93)).
- **Public Key Management**: Manages adding, deleting, and publishing signing and cryptographic public keys for ACDs [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (lines 50-74)).
- **Activity Enrichment**: Enriches raw hardware events with user and building context, determining the user type (e.g., resident, staff) and verifying access rights [Confirmed] (`service_method|access_control_device|functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts|OSKActivityEnrichmentService|enrichAndValidateActivity|#1`).
- **IoT API Integration**: Communicates with an external IoT API to register and unregister devices [Confirmed] (`functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (lines 51-73)).
- **Token Payload Generation**: Generates signed JWT tokens for BLE access containing access rights, public keys, and device IDs [Confirmed] (`class_method|access_control_device|functions/src/modules/access_control_device/models/shared/access_control_device_token_payload.model.ts|OSKAccessControlDeviceTokenPayload|toSignedToken|#1`).
- **State and Log Tracking**: Stores battery level, temperature, humidity, local storage usage, and system logs of ACDs [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_state.controller.ts` (lines 16-31), `functions/src/modules/access_control_device/controllers/access_control_device_system_logs.controller.ts` (lines 16-31)).

---

### 4. Public Interfaces

#### _module_root

- **OSKAccessControlDeviceController**: Manages ACD registration, door assignments, and provisioning dates [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device.controller.ts` (lines 18-103)).
- **OSKAccessControlDeviceAccessCommandsController**: Manages access commands sent to ACDs [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_access_commands.controller.ts` (lines 9-38)).
- **OSKAccessControlDeviceConfigController**: Manages ACD configurations and publishes them to Pub/Sub [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (lines 17-93)).
- **OSKAccessControlDevicePublicKeysController**: Manages public keys for ACDs and publishes key updates [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts` (lines 16-74)).
- **OSKAccessControlDeviceStateController**: Manages ACD telemetry states [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_state.controller.ts` (lines 9-31)).
- **OSKAccessControlDeviceSystemLogsController**: Manages ACD system logs [Confirmed] (`functions/src/modules/access_control_device/controllers/access_control_device_system_logs.controller.ts` (lines 9-31)).
- **OSKNodeIoTAPIService**: Handles communication with the external Node IoT API [Confirmed] (`functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (lines 12-73)).
- **OSKActivityEnrichmentService**: Enriches raw hardware events with user and building context [Confirmed] (`functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts` (lines 31-174)).

---

### 5. Internal Structure

*Note: This section contains only cross-submodule coupling analysis.*

The deterministic intra-module coupling graph indicates that the `access_control_device` module contains no internal submodules (`submoduleCount: 0`) [Confirmed]. All services, controllers, and models are consolidated within the module root (`_module_root`), meaning there is no intra-module, cross-submodule coupling to report [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the data ownership conclusion.*

The `access_control_device` module is the primary owner of the `/accessControlDevices` collection and its subcollections (`/configs`, `/publicKeys`, `/logs`, `/states`) [Inferred]. 

While external modules such as `building` (which maps devices to doors) and `organization` (which configures intercom communication settings) frequently interact with these paths, they do so strictly by calling controllers defined within this module (`OSKAccessControlDeviceController` and `OSKAccessControlDeviceConfigController`) [Confirmed]. This design preserves domain encapsulation, ensuring that no external module directly manipulates the underlying device documents without routing through this module's validation and orchestration layers [Inferred].

**Per-capability evidence:**

#### _module_root

### Firestore Paths Touched
- `accessControlDevices/{accessControlDeviceId}/configs` [Confirmed] (`firestore_path_touched|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts|accessControlDevices/{accessControlDeviceId}/configs|#1`)
  - **Operation**: `get`
  - **Operation Detection Scope**: `partial`
  - **Path Resolution Method**: `direct_chain_detected`
- `/accessControlDevices/{deviceId}/configs/{configId}` [Confirmed] (`firestore_path_touched|access_control_device|functions/src/modules/access_control_device/index.ts|/accessControlDevices/{deviceId}/configs/{configId}|#1`)
  - **Operation Detection Scope**: `undetermined_may_be_indirect`
  - **Path Resolution Method**: `resolved_constant`
- `/accessControlDevices/{deviceId}/publicKeys/{keyType}` [Confirmed] (`firestore_path_touched|access_control_device|functions/src/modules/access_control_device/index.ts|/accessControlDevices/{deviceId}/publicKeys/{keyType}|#1`)
  - **Operation Detection Scope**: `undetermined_may_be_indirect`
  - **Path Resolution Method**: `resolved_constant`
- `/accessControlDevices/{deviceId}` [Confirmed] (`firestore_path_touched|access_control_device|functions/src/modules/access_control_device/index.ts|/accessControlDevices/{deviceId}|#1`)
  - **Operation Detection Scope**: `undetermined_may_be_indirect`
  - **Path Resolution Method**: `resolved_constant`

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Functions
- **onAddAccessControlDevicePublicKeyCalled** [Confirmed] (`api_contract|access_control_device|functions/src/modules/access_control_device/index.ts|onAddAccessControlDevicePublicKeyCalled|#1`)
  - **Request Type**: `OSKAccessControlDevicePublicKeyAddRequest`
    - `deviceId`: `string`
    - `keyType`: `"signing" | "crypto"`
- **onDeleteAccessControlDevicePublicKeyCalled** [Confirmed] (`api_contract|access_control_device|functions/src/modules/access_control_device/index.ts|onDeleteAccessControlDevicePublicKeyCalled|#1`)
  - **Request Type**: `OSKAccessControlDevicePublicKeyDeleteRequest`
    - `deviceId`: `string`
    - `keyType`: `"signing" | "crypto"`

### Firestore Triggers
- **onDocumentCreated** on `/accessControlDevices/{deviceId}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#1`)
  - Triggers `OSKAccessControlDeviceService.onDocumentCreated` to save the ACD document [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDevicePath)             .onCreate|getFirestoreTriggers|OSKAccessControlDeviceService.onDocumentCreated|#1`).
- **onDocumentDeleted** on `/accessControlDevices/{deviceId}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#1`)
  - Triggers `OSKAccessControlDeviceService.onDocumentDeleted` to clean up associated configs, public keys, system logs, states, and access commands [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDevicePath)             .onDelete|getFirestoreTriggers|OSKAccessControlDeviceService.onDocumentDeleted|#1`).
- **onDocumentCreated** on `/accessControlDevices/{deviceId}/configs/{configId}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#2`)
  - Triggers `OSKAccessControlDeviceConfigService.onDocumentCreated` to publish the configuration [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDeviceConfigPath)             .onCreate|getFirestoreTriggers|OSKAccessControlDeviceConfigService.onDocumentCreated|#1`).
- **onDocumentUpdated** on `/accessControlDevices/{deviceId}/configs/{configId}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentUpdated|#1`)
  - Triggers `OSKAccessControlDeviceConfigService.onDocumentUpdated` to publish the updated configuration [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDeviceConfigPath)             .onUpdate|getFirestoreTriggers|OSKAccessControlDeviceConfigService.onDocumentUpdated|#1`).
- **onDocumentDeleted** on `/accessControlDevices/{deviceId}/configs/{configId}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#2`)
  - Triggers `OSKAccessControlDeviceConfigService.onDocumentDeleted` to publish the deleted configuration state [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDeviceConfigPath)             .onDelete|getFirestoreTriggers|OSKAccessControlDeviceConfigService.onDocumentDeleted|#1`).
- **onDocumentCreated** on `/accessControlDevices/{deviceId}/publicKeys/{keyType}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#3`)
  - Triggers `OSKAccessControlDevicePublicKeysService.onDocumentCreated` to publish the public keys [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDevicePublicKeysPath)             .onCreate|getFirestoreTriggers|OSKAccessControlDevicePublicKeysService.onDocumentCreated|#1`).
- **onDocumentDeleted** on `/accessControlDevices/{deviceId}/publicKeys/{keyType}` [Confirmed] (`firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#3`)
  - Triggers `OSKAccessControlDevicePublicKeysService.onDocumentDeleted` to publish the removal of public keys [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/index.ts|db             .document(accessControlDevicePublicKeysPath)             .onDelete|getFirestoreTriggers|OSKAccessControlDevicePublicKeysService.onDocumentDeleted|#1`).

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only cross-cutting risk callouts.*

- **Enforcement Mismatch (RBAC vs. Code)**: The permission string `accessControlDevice.publicKey.maintain` is actively enforced within the code during the execution of `onAddAccessControlDevicePublicKeyCalled` [Confirmed]. If a user attempts to register a public key without this role, the system raises a `permission-denied` error [Confirmed]. However, this permission string is completely absent from the platform's canonical RBAC roles reference document (`rbac-roles.json`), representing a critical configuration gap between code enforcement and administrative role definitions [Confirmed].

**Per-capability evidence:**

#### _module_root

- **accessControlDevice.publicKey.maintain**: Checked during the execution of `onAddAccessControlDevicePublicKeyCalled` [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts|OSKAccessControlDevicePublicKeysService.logger.logError|onAddAccessControlDevicePublicKeyCalled|'permission-denied: You are not part of an organization with the role accessControlDevice.publicKey.maintain'|#1`).
  - *RBAC Mismatch*: This permission string is **not** listed in the supplied RBAC roles document.

---

### 10. Cross-Module Relationships

#### Outbound Dependencies (Confirmed)
- **`building`**: The module imports `OSKBuildingActivityDocument` and `OSKBuildingActivity` to resolve building and door contexts. It calls `OSKBuildingAccessesController.get`, `OSKBuildingController.getSafe`, and `OSKBuildingDoorController.getSafe` during the activity enrichment process to map raw hardware events to physical locations.
- **`core`**: The module relies on `core` for foundational infrastructure. It imports logging and base controller utilities, calling `OSKLoggingService` (for error, info, and warning logs), `OSKDocumentAndMessageController` (for CRUD operations and Pub/Sub message publishing), `OSKPublicKeysController` (to add or delete public keys), and `OSKAccessUpdateService` (to update user accesses when devices are assigned or unassigned).
- **`organization`**: The module imports `OSKIntercomCommunicationConfig` and calls `OSKOrganizationController.get` to verify organization context when managing public keys.
- **`user`**: The module imports `OSKUserAccessType` and calls `OSKUserController.get` to resolve user profiles and identities during activity log enrichment.

#### Inbound Dependencies (Confirmed)
- **`admin`**: Calls `OSKAccessControlDeviceController.getAll` and `OSKAccessControlDeviceController.update` to perform administrative maintenance and device updates.
- **`building`**: Calls `OSKAccessControlDeviceConfigController` (`deleteAll`, `save`) and `OSKAccessControlDeviceController` (`assignBuildingDoor`, `get`, `unassignBuildingDoor`) to manage device-to-door mappings and configurations.
- **`call`**: Calls `OSKAccessControlDeviceController.get` and `OSKActivityEnrichmentService.enrichAndValidateActivity` to log call-related hardware events.
- **`core`**: Calls `OSKAccessControlDeviceAccessCommandsController.save`, `OSKAccessControlDeviceStateController.save`, `OSKAccessControlDeviceSystemLogsController.save`, and `OSKActivityEnrichmentService.enrichAndValidateActivity` to process incoming Pub/Sub messages from edge devices.
- **`organization`**: Calls `OSKAccessControlDeviceConfigController` (`getMostRecent`, `save`) to manage intercom communication configurations.
- **`supplier`**: Imports enrichment types from `OSKActivityEnrichmentService` to log supplier staff activity.
- **`user`**: Imports enrichment types and token payloads for user device management.

### 11. External Hooks

#### _module_root

### Pub/Sub Integrations
- **topicName** (dynamic topic name retrieved via `this.getTopicName()`): Publishes configuration payloads [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts|OSKAccessControlDeviceConfigController.default._publishMessage|publishConfig|topicName,accessControlDeviceId,payload|#1`).
- **accessControlDeviceConfigs**: Publishes public key updates [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts|OSKAccessControlDevicePublicKeysController.default._publishMessage|publish|'accessControlDeviceConfigs',deviceId,{             deviceId,             keyType,             ...payload,         }|#1`).

### HTTP/Client Integrations
- **axios.default.post** and **axios.default.delete** to `devices/${deviceId}`: Communicates with an external Node IoT API to register and unregister devices [Confirmed] (`call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios.default.post|post|url,body,{                 headers: { authorization: `Bearer ${token}` },             }|#1`, `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios.default.delete|delete|url,{                 headers: { authorization: `Bearer ${token}` },             }|#1`).

---

### 12. Architectural Observations

- **Encapsulation of Hardware Concerns**: The module successfully isolates the rest of the platform from the complexities of edge hardware communication [Inferred]. External modules never write directly to `/accessControlDevices` paths; instead, they interact via clean, method-level controller interfaces, preserving a strict separation of concerns [Confirmed].
- **Centralized Event Enrichment**: The `OSKActivityEnrichmentService` acts as an architectural translation layer [Confirmed]. By intercepting raw, low-level hardware signals (such as PIN entries or BLE tokens) and enriching them with high-level business context (resolving building, door, user, and organization details), it ensures that downstream activity logs are immediately meaningful to business services without requiring those services to understand raw hardware telemetry [Inferred].
- **Asynchronous Edge Synchronization**: Device configuration changes and public key updates are synchronized asynchronously to physical hardware by publishing messages to Pub/Sub via `OSKDocumentAndMessageController._publishMessage` [Confirmed]. This design ensures that cloud-side administrative actions are decoupled from real-time edge device connectivity and cellular latency [Inferred].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Schema Mismatch**: The permission string `accessControlDevice.publicKey.maintain` is enforced in the code but does not exist in the RBAC roles reference document (`rbac-roles.json`) [Confirmed]. This prevents administrative tools from properly assigning or auditing this role.
- **Dynamic Pub/Sub Topic Resolution**: The exact Pub/Sub topic name used for device configuration synchronization is resolved dynamically at runtime via `this.getTopicName()` in `OSKAccessControlDeviceConfigController` [Inferred]. This introduces a static analysis gap regarding which physical topics are targeted for delta synchronization.
- **IoT API Base URL Configuration**: The base URL for the external IoT API in `OSKNodeIoTAPIService` is constructed dynamically via `this.url(path)`, but its source of truth (e.g., environment variables or database settings) is not statically declared in the module's evidence [Inferred].

**Per-capability open questions:**

#### _module_root

- **External IoT API Base URL**: The exact endpoint URL for the external IoT API is constructed dynamically via `this.url(path)` in `OSKNodeIoTAPIService`, but the base URL configuration is not explicitly defined in the provided facts [Inferred] (`functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts` (line 46)).
- **RBAC Role Mismatch**: The permission `accessControlDevice.publicKey.maintain` is checked in the code but missing from the RBAC roles reference document [Confirmed] (`functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts` (line 141)).
- **Dynamic Pub/Sub Topic Name**: The exact Pub/Sub topic name returned by `this.getTopicName()` in `OSKAccessControlDeviceConfigController` is not fully resolved in the facts [Inferred] (`functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts` (line 86)).

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
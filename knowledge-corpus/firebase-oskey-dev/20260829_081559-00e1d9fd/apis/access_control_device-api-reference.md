### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T11:58:52.395Z
- repoName: firebase-oskey-dev
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
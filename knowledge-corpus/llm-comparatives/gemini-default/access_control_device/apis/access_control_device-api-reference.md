### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T16:48:57.350Z
- repoName: firebase-oskey-dev
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### Callable Functions
The following callable functions are exported by this capability:

#### `onAddAccessControlDevicePublicKeyCalled`
- **Request Schema**: `OSKAccessControlDevicePublicKeyAddRequest` [Confirmed; `functions/src/modules/access_control_device/index.ts` (line 113)]
  - `deviceId`: `string`
  - `keyType`: `"signing" | "crypto"`
- **Response Schema**: No matching `model_property` facts found in this pack to represent the response schema [Inferred].

#### `onDeleteAccessControlDevicePublicKeyCalled`
- **Request Schema**: `OSKAccessControlDevicePublicKeyDeleteRequest` [Confirmed; `functions/src/modules/access_control_device/index.ts` (line 114)]
  - `deviceId`: `string`
  - `keyType`: `"signing" | "crypto"`
- **Response Schema**: No matching `model_property` facts found in this pack to represent the response schema [Inferred].

---

### Firestore Triggers
The capability registers the following Firestore triggers to react to document changes:

| Trigger Event | Target Path | Handler |
| :--- | :--- | :--- |
| `onCreate` | `/accessControlDevices/{deviceId}` | `OSKAccessControlDeviceService.onDocumentCreated` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#1`] |
| `onDelete` | `/accessControlDevices/{deviceId}` | `OSKAccessControlDeviceService.onDocumentDeleted` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#1`] |
| `onCreate` | `/accessControlDevices/{deviceId}/configs/{configId}` | `OSKAccessControlDeviceConfigService.onDocumentCreated` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#2`] |
| `onUpdate` | `/accessControlDevices/{deviceId}/configs/{configId}` | `OSKAccessControlDeviceConfigService.onDocumentUpdated` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentUpdated|#1`] |
| `onDelete` | `/accessControlDevices/{deviceId}/configs/{configId}` | `OSKAccessControlDeviceConfigService.onDocumentDeleted` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#2`] |
| `onCreate` | `/accessControlDevices/{deviceId}/publicKeys/{keyType}` | `OSKAccessControlDevicePublicKeysService.onDocumentCreated` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentCreated|#3`] |
| `onDelete` | `/accessControlDevices/{deviceId}/publicKeys/{keyType}` | `OSKAccessControlDevicePublicKeysService.onDocumentDeleted` [Confirmed; `firestore_trigger|access_control_device|functions/src/modules/access_control_device/index.ts|unknown|onDocumentDeleted|#3`] |
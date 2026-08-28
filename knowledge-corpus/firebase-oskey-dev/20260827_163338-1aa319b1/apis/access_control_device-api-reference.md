### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:40:51.090Z
- repoName: firebase-oskey-dev
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
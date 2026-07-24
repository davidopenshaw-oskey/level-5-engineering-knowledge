# API Reference: access_control_device

## 0. Generation Metadata

- **Run ID**: 20260724_143603-1aa319b1
- **Generated At**: 2026-07-24T14:36:09.800Z

---

## 1. Callable Functions

### Interpretation

The `access_control_device` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `onAddAccessControlDevicePublicKeyCalled` | `OSKAccessControlDevicePublicKeyAddRequest` | ```json
{
  "deviceId": "string",
  "keyType": "\"signing\" | \"crypto\"",
  "keyId": "string",
  "publicKey": "string"
}
``` |
| `onDeleteAccessControlDevicePublicKeyCalled` | `OSKAccessControlDevicePublicKeyDeleteRequest` | ```json
{
  "deviceId": "string",
  "keyType": "\"signing\" | \"crypto\"",
  "keyId": "string"
}
``` |

### Evidence Used

- API Contract: The `access_control_device-evidence-graph.json` file contains 2 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/access_control_device/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

### Enums

| Enum Name | Members | File |
| :--- | :--- | :--- |
| `ActivityUserType` | `USER = user`, `SUPPLIER_STAFF_MEMBER = supplierStaffMember`, `NON_APP_USER = nonAppUser` | `functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts` |

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKIoTAccessControlDeviceConfig` | `{     dummy: string; }` | `functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device_config.model.ts` |
| `OSKIoTAccessControlDevicePublicKeys` | `{     dummy: string; }` | `functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device_public_keys.model.ts` |
| `OSKAccessControlDeviceType` | `'digicom' \| 'intercom'` | `functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device.model.ts` |
| `OSKIoTAccessControlDevice` | `{     accessControlDeviceId: string;     accessControlDeviceIdShort: string;     accessControlDeviceType: OSKAccessCo...` | `functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device.model.ts` |
| `OSKJWTPayload` | `{     iss: string;     aud: string;     sub?: string;     iat: number;     exp: number; }` | `functions/src/modules/access_control_device/api/node-iot-api/models/jwt_payload.model.ts` |
| `OSKAccessControlDeviceAccessCommand` | `{     id: string;     accessControlDeviceId: string;     timestamp: Timestamp; }` | `functions/src/modules/access_control_device/models/documents/access_control_device_access_command_document.model.ts` |
| `OSKAccessControlDeviceAccessCommandDocument` | `OSKDocument<OSKAccessControlDeviceAccessCommand>` | `functions/src/modules/access_control_device/models/documents/access_control_device_access_command_document.model.ts` |
| `OSKAccessControlDeviceConfig` | `{     accessControlDeviceId: string;     doorInfo?: OSKDoorInfo;     accessCode: {         keyboardFormat: '12' \| '1...` | `functions/src/modules/access_control_device/models/documents/access_control_device_config_document.model.ts` |
| `OSKAccessControlDeviceConfigDocument` | `OSKDocument<OSKAccessControlDeviceConfig>` | `functions/src/modules/access_control_device/models/documents/access_control_device_config_document.model.ts` |
| `OSKAccessControlDeviceStatistics` | `{     accessGrantedCounts: number;     accessRejectedCounts: number; }` | `functions/src/modules/access_control_device/models/documents/access_control_device_document.model.ts` |
| `OSKAccessControlDeviceDatedStatistics` | `OSKAccessControlDeviceStatistics & { date: Timestamp }` | `functions/src/modules/access_control_device/models/documents/access_control_device_document.model.ts` |
| `OSKAccessControlDeviceType` | `'digicom' \| 'intercom'` | `functions/src/modules/access_control_device/models/documents/access_control_device_document.model.ts` |
| `OSKAccessControlDevice` | `{     id?: string;     accessControlDeviceId: string;     accessControlDeviceIdShort: string;     accessControlDevice...` | `functions/src/modules/access_control_device/models/documents/access_control_device_document.model.ts` |
| `OSKAccessControlDeviceDocument` | `OSKDocument<OSKAccessControlDevice>` | `functions/src/modules/access_control_device/models/documents/access_control_device_document.model.ts` |
| `OSKAccessControlDevicePublicKeys` | `OSKPublicKeys` | `functions/src/modules/access_control_device/models/documents/access_control_device_public_keys_document.model.ts` |
| `OSKAccessControlDevicePublicKeysDocument` | `OSKPublicKeysDocument` | `functions/src/modules/access_control_device/models/documents/access_control_device_public_keys_document.model.ts` |
| `OSKAccessControlDeviceState` | `{     id: string;     accessControlDeviceId: string;     timestamp: Timestamp;     batteryLevel: number;     powered:...` | `functions/src/modules/access_control_device/models/documents/access_control_device_state_document.model.ts` |
| `OSKAccessControlDeviceStateDocument` | `OSKDocument<OSKAccessControlDeviceState>` | `functions/src/modules/access_control_device/models/documents/access_control_device_state_document.model.ts` |
| `OSKAccessControlDeviceSystemLog` | `{     id: string;     accessControlDeviceId: string;     timestamp: Timestamp; }` | `functions/src/modules/access_control_device/models/documents/access_control_device_system_log_document.model.ts` |
| `OSKAccessControlDeviceSystemLogDocument` | `OSKDocument<OSKAccessControlDeviceSystemLog>` | `functions/src/modules/access_control_device/models/documents/access_control_device_system_log_document.model.ts` |
| `OSKAccessControlDevicePublicKeyAddRequest` | `{     deviceId: string;     keyType: 'signing' \| 'crypto'; } & OSKPublicKeyAddRequest` | `functions/src/modules/access_control_device/models/functions/access_control_device_public_key_add_request.model.ts` |
| `OSKAccessControlDevicePublicKeyDeleteRequest` | `{     deviceId: string;     keyType: 'signing' \| 'crypto'; } & OSKPublicKeyDeleteRequest` | `functions/src/modules/access_control_device/models/functions/access_control_device_public_key_delete_request.model.ts` |
| `OSKAccessControlDeviceConfigMessage` | `OSKAccessControlDeviceConfigDocument & {     operation: 'insert' \| 'update' \| 'delete'; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_config_message.model.ts` |
| `OSKKey` | `{ deviceId: string }` | `functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts` |
| `OSKAddPayload` | `{     accessControlDevice: OSKAccessControlDeviceDocument;     action: 'add'; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts` |
| `OSKRemovePayload` | `{     action: 'remove'; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts` |
| `OSKAccessControlDeviceMessage` | `OSKKey & (OSKAddPayload \| OSKRemovePayload)` | `functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts` |
| `OSKKey` | `{     deviceId: string;     keyType: OSKAccessControlDevicePublicKeyType; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_public_keys_message.model.ts` |
| `OSKUpdatePayload` | `{     publicKeys: OSKAccessControlDevicePublicKeysDocument;     action: 'update'; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_public_keys_message.model.ts` |
| `OSKRemovePayload` | `{     action: 'remove'; }` | `functions/src/modules/access_control_device/models/messages/access_control_device_public_keys_message.model.ts` |
| `OSKAccessControlDevicePublicKeysMessage` | `OSKKey & (OSKUpdatePayload \| OSKRemovePayload)` | `functions/src/modules/access_control_device/models/messages/access_control_device_public_keys_message.model.ts` |
| `OSKAccessControlDeviceStateMessage` | `{     deviceId: string;     stateId: string;     state: {         timestamp: number;         batteryLevel: number;   ...` | `functions/src/modules/access_control_device/models/messages/access_control_device_state_message.model.ts` |
| `OSKAccessControlDevicePublicKeyType` | `'signing' \| 'crypto'` | `functions/src/modules/access_control_device/models/shared/access_control_device_public_key_type.model.ts` |
| `OSKAccessControlDeviceTokenPayloadData` | `{     accessRights: OSKAccessRightWithTimestamp[];     keyId: string;     publicKey: string;     accessDeviceControlI...` | `functions/src/modules/access_control_device/models/shared/access_control_device_token_payload.model.ts` |
| `ActivityUser` | `{     userId: string;     userType?: ActivityUserType; }` | `functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts` |
| `EnrichedActivityData` | `{     building: OSKBuildingDocument;     door: OSKBuildingDoorDocument;     user?: ActivityUser; }` | `functions/src/modules/access_control_device/services/access_control_device_activity_enrichment.service.ts` |

<!-- © Oskey SAS. All rights reserved. -->

# Module API Reference: access_control_device

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `access_control_device` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152118-1aa319b1` |
| **Exported Callables** | 2 |
| **Type Aliases / Enums** | 36 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `access_control_device` module.

---

## 2. HTTPS Callable Functions (2 Endpoints)

### `onAddAccessControlDevicePublicKeyCalled`

- **Request Type**: `OSKAccessControlDevicePublicKeyAddRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/access_control_device/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `deviceId` | `string` | No |
| `keyType` | `"signing" | "crypto"` | No |
| `keyId` | `string` | No |
| `publicKey` | `string` | No |

### `onDeleteAccessControlDevicePublicKeyCalled`

- **Request Type**: `OSKAccessControlDevicePublicKeyDeleteRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/access_control_device/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `deviceId` | `string` | No |
| `keyType` | `"signing" | "crypto"` | No |
| `keyId` | `string` | No |

---

## 3. Data Models & Type Definitions (36 Types)

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

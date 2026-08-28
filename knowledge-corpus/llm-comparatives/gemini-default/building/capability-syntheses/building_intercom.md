## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.414Z
- **repoName**: firebase-oskey-dev
- **targetModule**: building
- **capability**: building_intercom
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `building_intercom` capability manages the configuration, display names, and call transfer lists of physical building intercom devices (Access Control Devices, or ACDs) [Confirmed]. It maps building inhabitants to intercom entries, automatically formats display names, manages call routing sequences (call transfer lists), and synchronizes these configurations to physical hardware asynchronously via GCP Pub/Sub [Confirmed].

---

## 2. Primary Responsibilities
This capability provides the following distinct features and responsibilities:

*   **Intercom Entry & Display Name Management**: 
    *   Creates intercom entries when inhabitants are added to a unit (`addInhabitantInIntercom`, `addInhabitantInAllIntercoms`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 76-143).
    *   Updates display names (`updateIntercomDisplayName`) and automatically formats them based on tenant last names (`createIntercomDisplayName`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 166-252, 446-475).
    *   Deletes intercom entries or specific users from entries (`deleteIntercomEntry`, `deleteIntercomEntryUser`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 281-342, 348-440).
*   **Call Transfer List Management**:
    *   Creates, updates, and deletes call transfer lists (`createCallTransferList`, `updateIntercomCallTransferList`, `pushToCallTransferList`, `onUpdateBuildingIntercomsTransferList`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts` (lines 39-64, 90-122, 124-157, 185-217).
    *   Converts call transfer lists from ordered arrays to sequence numbers (`convertCallTransferListFromOrderedToSequenceNumber`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts` (lines 256-269).
*   **Hardware Synchronization (Pub/Sub)**:
    *   Publishes intercom creation, update, and deletion events to Pub/Sub topics to synchronize with edge Access Control Devices (ACDs) (`publishMessageIntercomCreate`, `publishMessageIntercomUpdate`, `publishMessageIntercomDelete`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts` (lines 15-25, 27-57, 59-65).

*Confidence Tag*: **Confirmed**

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points and services:

*   **`OSKBuildingIntercomController`**: Extends `OSKDocumentAndMessageController` to manage master building intercom documents in Firestore and publish Pub/Sub messages `` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController` ``.
*   **`OSKBuildingIntercomCallTransferListController`**: Extends `OSKDocumentController` to manage call transfer list documents in Firestore `` `source_class|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts|OSKBuildingIntercomCallTransferListController` ``.
*   **`OSKBuildingIntercomCallTransferListService`**: Handles business logic for call transfer lists `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKBuildingIntercomCallTransferListService` ``.
*   **`OSKBuildingIntercomService`**: Handles business logic for intercom inhabitants and display names `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService` ``.
*   **`OSKIntercomMessagePublisherService`**: Publishes messages to Pub/Sub for edge device synchronization `` `source_class|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|OSKIntercomMessagePublisherService` ``.

---

## 4. API Contracts & Firestore Triggers
This capability exposes the following Callable API contracts:

### Callable Functions

#### `deleteIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomEntryDeleteRequest`
    *   `buildingId`: `string`
    *   `entryId`: `string`
    *   `organizationId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``

#### `onUpdateBuildingIntercomsTransferList`
*   **Request Type**: `OSKIntercomCallTransferListRequest`
    *   `buildingId`: `string`
    *   `callTransferList`: `OSKUserIntercomCallTransferListItem[]`
    *   `unitId`: `string`
    *   `userId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` ``

#### `updateIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomDisplayNameRequest`
    *   `buildingId`: `string`
    *   `newDisplayName`: `string`
    *   `unitId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``

### Firestore Triggers
*   None evidenced in this capability's pack.

---

## 5. Data Ownership
This capability owns and performs operations on the following Firestore paths:

*   **`/buildings/{buildingId}/intercoms/{intercomId}`** [Confirmed]
    *   *Description*: Stores master intercom configuration and entries.
    *   *Operations*: Read, Create, Update, Delete.
    *   *Citation*: `functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts` (lines 17-58).
*   **`/buildings/{buildingId}/callTransferList/{callTransferListId}`** [Confirmed]
    *   *Description*: Stores call transfer lists for intercom routing.
    *   *Operations*: Read, Create, Update, Delete.
    *   *Citation*: `functions/src/modules/building/modules/building_intercom/controllers/building_intercom_calltransferlist.controller.ts` (lines 14-79).

*Confidence Tag*: **Confirmed**

---

## 6. Outbound Coupling
This capability depends on the following sibling submodules and external modules:

### Intra-Module Sibling Submodules
*   **`building_door`**: Imports `@oskey/building/door` to fetch door details `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (line 7).
*   **`building_unit`**: Imports `@oskey/building/unit` to fetch unit details and clean inhabitant lists `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (line 22).
*   **`building_settings`**: Imports `@oskey/building/settings` to fetch resident settings `functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts` (line 11).
*   **`building` (root)**: Imports `@oskey/building` to fetch building details `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (line 6).

### Cross-Module Coupling
*   **`core`**: Imports `@oskey/core`, `@oskey/core/controllers/document`, `@oskey/core/controllers/document_and_message`, and `@oskey/core/logger` `functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts` (lines 7-8).
*   **`organization`**: Imports `@oskey/organization`, `@oskey/organization/residents`, and `@oskey/organization/user` `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 32-34).
*   **`settings`**: Imports `@oskey/settings/role` `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (line 35).
*   **`user`**: Imports `@oskey/user` and `@oskey/user/intercom` (submodule `user_intercoms`) `functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts` (lines 36-37).

---

## 7. Permissions & Security
This capability references and enforces the following security parameters:

*   **Permissions**:
    *   `v1.admin.accessControlDevice.edit`: Referenced as a permission candidate in `building_intercom_inhabitant.service.ts` `` `permission_candidate|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|v1.admin.accessControlDevice.edit|#1` ``.
        *   *Cross-check*: This permission exists in the RBAC roles document ("v1.admin - Allows to edit an existing access control device").
*   **Security Decorators**:
    *   `OSKUserSecurityChecks` with `{ checkUserIdMatch: false }` is applied to `onUpdateBuildingIntercomsTransferList` and `updateIntercomDisplayName` `` `call_expression|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_calltransferlist.service.ts|OSKUserSecurityChecks|onUpdateBuildingIntercomsTransferList|{ checkUserIdMatch: false }|#1` ``.

*Confidence Tag*: **Confirmed**

---

## 8. External Hooks
This capability integrates with the following external boundaries:

*   **Pub/Sub Topic**:
    *   `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`: Environment variable specifying the Pub/Sub topic used to publish intercom updates to edge devices `` `external_hook|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}|#1` ``.
*   **Edge Device IDs (External Integrations)**:
    *   `intercomDoc.accessControlDeviceId` / `intercomId`: Used as a routing key or identifier when publishing messages to Pub/Sub `` `external_hook|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_message_publisher.service.ts|intercomDoc.accessControlDeviceId|#1` ``.

*Confidence Tag*: **Confirmed**

---

## 9. Open Questions
*   Are there any Firestore triggers that automatically clean up intercom entries when a building or door is deleted, or is that handled entirely by other modules?
*   How does the STUN/TURN/ICE signaling server (mentioned in the architecture overview) interact with the WebRTC contact IDs (`contactId`) stored in the intercom entries?
# Capability Synthesis — _module_root

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.437Z
- **repoName**: firebase-oskey-dev
- **targetModule**: call
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `_module_root` capability of the `call` module manages the end-to-end lifecycle of intercom directory calls. It orchestrates call initialization, call transfer list routing (cascading notifications to residents), real-time WebRTC signaling setup (ICE servers), call status updates, call picture uploads, and call history logging for inhabitants. [Confirmed]

## 2. Primary Responsibilities

### Call Creation & Initialization
- Validates call creation payloads from Access Control Devices (ACDs) using Joi schemas `` `functions/src/modules/call/services/call.service.ts` (lines 56-65) ``.
- Verifies that the calling device is a registered ACD `` `functions/src/modules/call/services/call.service.ts` (lines 66-69) ``.
- Resolves the call transfer list for the target building and contact `` `functions/src/modules/call/services/call.service.ts` (lines 70-75) ``.
- Creates a call document in Firestore under `/calls` with an initial status of `created` and then `started` `` `functions/src/modules/call/services/call.service.ts` (lines 102-108) ``.
- Dispatches a specialized push notification (`userCallReceived`) to the first recipient in the call transfer list to trigger the mobile app's incoming call UI `` `functions/src/modules/call/services/call.service.ts` (lines 126-141) ``.
- Handles optional base64-encoded call picture uploads, saving them to Google Cloud Storage `` `functions/src/modules/call/services/call.service.ts` (lines 158-178) ``.

### Call Transfer List Routing & Cascading Notifications
- Handles sequential notification routing when a call needs to cascade to the next group of recipients (e.g., due to timeout or rejection) `` `functions/src/modules/call/services/call.service.ts` (lines 350-425) ``.
- Dispatches push notifications to all recipients associated with a specific sequence number in the call transfer list `` `functions/src/modules/call/services/call.service.ts` (lines 385-410) ``.

### Call Status Updates & Termination
- Processes real-time call status updates (e.g., `started`, `answered`, `terminated`, `failed`, `cancelled`) `` `functions/src/modules/call/services/call.service.ts` (lines 199-238) ``.
- Validates that incoming status updates match the expected call transfer list structure to prevent unauthorized state modifications `` `functions/src/modules/call/services/call.service.ts` (lines 211-235) ``.

### User Call History & Activity Aggregation
- Upon call termination (`terminated`, `failed`, `cancelled`), calculates the call duration and determines if the call was `missed` `` `functions/src/modules/call/services/call.service.ts` (lines 239-266) ``.
- Writes a call history document for each recipient under `/users/{userId}/calls/{callId}` `` `functions/src/modules/call/services/call.service.ts` (lines 267-301) ``.
- Enriches the call event and logs it as a system activity, updating the user's activity aggregates `` `functions/src/modules/call/services/call.service.ts` (lines 302-328) ``.

## 3. Public Interfaces (Controllers & Entry Points)

### OSKCallController
- **Type**: Firestore Document Controller (extends `OSKDocumentController`) `` `functions/src/modules/call/controllers/call.controller.ts` (line 13) ``.
- **Purpose**: Exposes low-level CRUD operations for the `/calls` collection in Firestore, wrapping document creation, retrieval, and updates `` `functions/src/modules/call/controllers/call.controller.ts` (lines 20-38) ``.

### OSKCallService
- **Type**: Express HTTP Service `` `functions/src/modules/call/services/call.service.ts` (line 43) ``.
- **Purpose**: Exposes the public REST API endpoints used by edge devices (ACDs) and client applications to interact with the call system. It is exported as the primary entry point `httpController` via a Firebase HTTPS function trigger `` `api_contract|call|functions/src/modules/call/index.ts|httpController|#1` ``.

## 4. API Contracts & Firestore Triggers

### API Contracts
The capability exposes an Express-based HTTP router via a Firebase HTTPS trigger `` `api_contract|call|functions/src/modules/call/index.ts|httpController|#1` ``.

#### `POST /calls`
- **Description**: Initiates a new call from an ACD.
- **Request Validation**: Validates the body against `callCreationBodySchema` `` `functions/src/modules/call/services/call.service.ts` (lines 57-65) ``.
- **Response**: Returns the created `OSKCall` document with status `started` `` `functions/src/modules/call/services/call.service.ts` (line 182) ``.

#### `PATCH /calls/:callId`
- **Description**: Updates the status and events of an ongoing call.
- **Request Validation**: Validates the body against `callUpdateBodySchema` `` `functions/src/modules/call/services/call.service.ts` (lines 201-210) ``.
- **Response**: Returns an empty JSON object `{}` on success `` `functions/src/modules/call/services/call.service.ts` (line 336) ``.

#### `POST /calls/:callId/notify/:sequenceNumber`
- **Description**: Triggers push notifications for the next sequence of recipients in the call transfer list.
- **Response**: Returns an `OSKCallNotificationRequestResponse` detailing which recipients were successfully notified `` `functions/src/modules/call/services/call.service.ts` (lines 411-426) ``.

*(Note: No `api_contract` requestType/responseType resolved to any `model_property` facts in this evidence scope).*

## 5. Data Ownership

### Firestore Collections

#### `/calls/{callId}`
- **Operations**: Create, Read, Update [Confirmed]
- **Description**: Stores the authoritative state of an active or historical intercom call, including the call transfer list, current status, and signaling events `` `call_expression|call|functions/src/modules/call/controllers/call.controller.ts|OSKCallController.default._create|create|'/calls',callId,callDocument|#1` ``.

#### `/users/{userId}/calls/{callId}`
- **Operations**: Create/Set [Confirmed]
- **Description**: Stores call history records scoped to individual users for display in their mobile applications `` `call_expression|call|functions/src/modules/call/services/call.service.ts|OSKUserCallController.default.set|anon|callRecipient.callerId,userDocument|#1` ``.

## 6. Outbound Coupling

### Cross-Module Coupling

#### `core`
- **Dependency**: `@oskey/core/controllers/document` and `@oskey/core/logger`
- **Usage**:
  - Inherits from `OSKDocumentController` to manage Firestore documents `` `functions/src/modules/call/controllers/call.controller.ts` (line 8) ``.
  - Uses `OSKLoggingService` for system logging `` `functions/src/modules/call/services/call.service.ts` (line 23) ``.

#### `access_control_device`
- **Dependency**: `@oskey/access_control_device` and `../../access_control_device/services/access_control_device_activity_enrichment.service`
- **Usage**:
  - Fetches ACD documents using `OSKAccessControlDeviceController` `` `functions/src/modules/call/services/call.service.ts` (line 6) ``.
  - Enriches and validates call activities using `OSKActivityEnrichmentService` `` `functions/src/modules/call/services/call.service.ts` (line 29) ``.

#### `building`
- **Dependency**: `@oskey/building/door` and `@oskey/building/intercom`
- **Usage**:
  - Fetches building door details using `OSKBuildingDoorController` to resolve the display name of the intercom `` `functions/src/modules/call/services/call.service.ts` (line 10) ``.
  - Fetches the call transfer list configuration using `OSKBuildingIntercomCallTransferListController` `` `functions/src/modules/call/services/call.service.ts` (line 11) ``.

#### `user`
- **Dependency**: `@oskey/user`, `@oskey/user/call`, `@oskey/user/notification`, and `../../user/modules/user_activity/`
- **Usage**:
  - Fetches recipient user profiles using `OSKUserController` `` `functions/src/modules/call/services/call.service.ts` (line 7) ``.
  - Writes user-scoped call history using `OSKUserCallController` `` `functions/src/modules/call/services/call.service.ts` (line 24) ``.
  - Dispatches push notifications using `OSKUserNotificationService` `` `functions/src/modules/call/services/call.service.ts` (line 25) ``.
  - Aggregates user call activities using `OSKUserActivityAggregatesService` `` `functions/src/modules/call/services/call.service.ts` (line 34) ``.

## 7. Permissions & Security
- No explicit RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are referenced in this capability's codebase. [Confirmed]
- **Security Enforcement**:
  - Validates that the `callerId` belongs to a registered Access Control Device before allowing call creation `` `functions/src/modules/call/services/call.service.ts` (lines 66-69) ``.
  - Validates that incoming `PATCH` updates contain a `callTransferList` matching the existing Firestore document to prevent unauthorized clients from modifying call routing or status `` `functions/src/modules/call/services/call.service.ts` (lines 214-235) ``.

## 8. External Hooks

### Google Cloud Storage
- **Path**: `calls/${call.callId}/public/callPictures/${pictureFileName}` [Confirmed]
- **Integration**: Saves base64-encoded call pictures uploaded by the intercom during call creation to a public GCS bucket path `` `call_expression|call|functions/src/modules/call/services/call.service.ts|storage()                                     .bucket()                                     .file|anon|\`calls/\${call.callId}/public/callPictures/\${pictureFileName}\`|#1` ``.

### Express HTTP Router
- Exposes REST endpoints to external edge devices (Intercoms) and clients via Firebase Functions `onRequest` `` `api_contract|call|functions/src/modules/call/index.ts|httpController|#1` ``.

## 9. Open Questions
- **ICE Server Provisioning**: The `iceServers` configuration is passed directly in the request body of `POST /calls` from the ACD `` `functions/src/modules/call/models/https/call_creation_body.model.ts` (line 17) ``. How does the ACD securely obtain or rotate these WebRTC credentials before initiating the call?
- **Single Recipient Limitation**: There is an explicit code comment: `// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)` `` `functions/src/modules/call/services/call.service.ts` (line 88) ``. Currently, only the first recipient of the first call transfer list item is notified during initial call creation. What is the timeline for supporting simultaneous notifications to multiple recipients?
### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T16:52:06.547Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `call`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `call` module manages the end-to-end lifecycle of intercom directory calls within the Oskey platform. It acts as the central orchestration and signaling bridge that connects physical Access Control Devices (ACDs/Intercoms) at building entrances with the mobile applications of inhabitants. The module is responsible for call initialization, retrieving and executing call transfer list routing (cascading notifications to residents), establishing real-time WebRTC signaling parameters (ICE servers), updating call states, uploading call-associated images, and projecting call history records to individual users. **[Confirmed]**

### 2. Architectural Position

The `call` module sits as a critical middleware and orchestration layer between the physical hardware domain (`access_control_device`), the physical building layout domain (`building`), and the user identity/notification domain (`user`). **[Confirmed]**
- **Concepts Owned**: Intercom call sessions (`/calls`), call transfer list routing execution, and WebRTC signaling state. **[Confirmed]**
- **Provided Capabilities**: End-to-end call lifecycle management, real-time WebRTC signaling configuration, and user-scoped call history projections. **[Confirmed]**

### 3. Primary Responsibilities

#### _module_root

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

### 4. Public Interfaces

#### _module_root

### OSKCallController
- **Type**: Firestore Document Controller (extends `OSKDocumentController`) `` `functions/src/modules/call/controllers/call.controller.ts` (line 13) ``.
- **Purpose**: Exposes low-level CRUD operations for the `/calls` collection in Firestore, wrapping document creation, retrieval, and updates `` `functions/src/modules/call/controllers/call.controller.ts` (lines 20-38) ``.

### OSKCallService
- **Type**: Express HTTP Service `` `functions/src/modules/call/services/call.service.ts` (line 43) ``.
- **Purpose**: Exposes the public REST API endpoints used by edge devices (ACDs) and client applications to interact with the call system. It is exported as the primary entry point `httpController` via a Firebase HTTPS function trigger `` `api_contract|call|functions/src/modules/call/index.ts|httpController|#1` ``.

### 5. Internal Structure

- **Intra-Module Coupling Note**: The `call` module contains no internal submodules. All logic resides within the module root, resulting in zero intra-module coupling. **[Confirmed]**

### 6. Firestore & Data Ownership

**Ownership conclusion:**

- **Data Ownership Conclusion**: The `call` module is the primary owner of the `/calls/{callId}` collection, which maintains the authoritative state of active and historical intercom calls. **[Inferred]**
- **Cross-Module Projections**: The module does not own the `/users/{userId}/calls/{callId}` collection, which is owned by the `user` module (specifically the `user_call` submodule). However, the `call` module executes cross-module writes to this path via `OSKUserCallController.set` to project call history records directly into individual user sandboxes. **[Inferred]**

**Per-capability evidence:**

#### _module_root

### Firestore Collections

#### `/calls/{callId}`
- **Operations**: Create, Read, Update [Confirmed]
- **Description**: Stores the authoritative state of an active or historical intercom call, including the call transfer list, current status, and signaling events `` `call_expression|call|functions/src/modules/call/controllers/call.controller.ts|OSKCallController.default._create|create|'/calls',callId,callDocument|#1` ``.

#### `/users/{userId}/calls/{callId}`
- **Operations**: Create/Set [Confirmed]
- **Description**: Stores call history records scoped to individual users for display in their mobile applications `` `call_expression|call|functions/src/modules/call/services/call.service.ts|OSKUserCallController.default.set|anon|callRecipient.callerId,userDocument|#1` ``.

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

- **Cross-Cutting Security Enforcement Tally**: The `call` module does not enforce any RBAC permission strings (0 occurrences of `v1.admin...` or `v1.org...` checks in the codebase). **[Confirmed]**
- **Structural Security Guards**: In the absence of RBAC, the module relies on structural and contextual validation to secure its endpoints:
  - **Device Validation**: Call creation requests are rejected unless the `callerId` is validated as a registered Access Control Device via `OSKAccessControlDeviceController.get`. **[Confirmed]**
  - **Routing Integrity**: Incoming `PATCH` updates to active calls are validated to ensure the request's `callTransferList` matches the existing Firestore document, preventing unauthorized clients from hijacking call routing or spoofing call status. **[Confirmed]**

**Per-capability evidence:**

#### _module_root

- No explicit RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are referenced in this capability's codebase. [Confirmed]
- **Security Enforcement**:
  - Validates that the `callerId` belongs to a registered Access Control Device before allowing call creation `` `functions/src/modules/call/services/call.service.ts` (lines 66-69) ``.
  - Validates that incoming `PATCH` updates contain a `callTransferList` matching the existing Firestore document to prevent unauthorized clients from modifying call routing or status `` `functions/src/modules/call/services/call.service.ts` (lines 214-235) ``.

### 10. Cross-Module Relationships

The `call` module maintains the following verified relationships with other modules in the repository:

#### Outbound Dependencies (This module depends on)
- **`access_control_device`**: Used to validate calling hardware and enrich call events. The module calls `OSKAccessControlDeviceController.get` to verify the calling intercom and `OSKActivityEnrichmentService.enrichAndValidateActivity` to process call-related hardware events. **[Confirmed]**
- **`building`**: Used to resolve physical routing. The module calls `OSKBuildingDoorController.get` to retrieve door details and `OSKBuildingIntercomCallTransferListController.get` to fetch the configured call transfer list for a unit. **[Confirmed]**
- **`core`**: Used for persistence and system utilities. The module calls `OSKDocumentController` methods (`_create`, `_generateDocId`, `_get`, `_update`) for Firestore operations and `OSKLoggingService` (`logInfo`, `logDebug`, `logError`) for system logging. **[Confirmed]**
- **`user`**: Used to notify residents and log history. The module calls `OSKUserController.get` to resolve recipient details, `OSKUserNotificationService.createSpecial` to dispatch push notifications, `OSKUserCallController.set` to write user call history, and `OSKUserActivityAggregatesService.ActivityReceivedForUser` to aggregate user-facing activity. **[Confirmed]**

#### Inbound Dependencies (Other modules depend on this)
- **`apps`**: Imports `OSKICEServers` from `src/modules/call/models/shared/ice_servers.model` to configure WebRTC signaling options within notification payloads. **[Confirmed]**
- **`user`**: Imports the `OSKCallStatus` type from `@oskey/call` to maintain status alignment within user-scoped call documents. **[Confirmed]**

### 11. External Hooks

#### _module_root

### Google Cloud Storage
- **Path**: `calls/${call.callId}/public/callPictures/${pictureFileName}` [Confirmed]
- **Integration**: Saves base64-encoded call pictures uploaded by the intercom during call creation to a public GCS bucket path `` `call_expression|call|functions/src/modules/call/services/call.service.ts|storage()                                     .bucket()                                     .file|anon|\`calls/\${call.callId}/public/callPictures/\${pictureFileName}\`|#1` ``.

### Express HTTP Router
- Exposes REST endpoints to external edge devices (Intercoms) and clients via Firebase Functions `onRequest` `` `api_contract|call|functions/src/modules/call/index.ts|httpController|#1` ``.

### 12. Architectural Observations

- **Orchestration Service Pattern**: The `call` module operates primarily as an orchestration service. It owns very little static business data of its own, instead pulling runtime configuration from `building` (transfer lists) and `access_control_device` (device state), combining them to execute a workflow, and pushing the results to `user` (notifications and call history). **[Inferred]**
- **Paired Document Pattern (Cross-Module Projection)**: To isolate user-facing mobile app queries from global call tracking, the module duplicates call records. It writes the authoritative call state to `/calls/{callId}` and immediately projects a user-specific history record to `/users/{userId}/calls/{callId}`. This prevents mobile clients from needing read access to the root `/calls` collection. **[Inferred]**
- **Synchronous Routing Limitation**: The call routing logic contains a known architectural bottleneck where only the first recipient of the first call transfer list item is notified during initial call creation, as indicated by an explicit code comment (`// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)`). **[Confirmed]**

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Absence of RBAC Authorization**: There are no RBAC checks on call creation or update endpoints. If an attacker successfully spoofs a registered Access Control Device's `callerId`, they can initiate calls, trigger push notifications to residents, and write arbitrary call history records to user profiles without role-based restriction. **[Inferred]**
- **In-Transit WebRTC Credential Exposure**: The `iceServers` configuration (including WebRTC usernames and credentials) is passed directly in the request body of `POST /calls` from the physical ACD. This design relies on the edge hardware to securely store, rotate, and transmit these credentials, creating a risk of credential leakage if an edge device is compromised or the transit path is intercepted. **[Inferred]**
- **Single-Recipient Routing Bottleneck**: The explicit limitation where only the first recipient of the first call transfer list item is notified during call creation poses a functional risk. In multi-inhabitant units, co-residents or secondary routing targets will not receive intercom calls until this synchronous routing limitation is resolved. **[Confirmed]**

**Per-capability open questions:**

#### _module_root

- **ICE Server Provisioning**: The `iceServers` configuration is passed directly in the request body of `POST /calls` from the ACD `` `functions/src/modules/call/models/https/call_creation_body.model.ts` (line 17) ``. How does the ACD securely obtain or rotate these WebRTC credentials before initiating the call?
- **Single Recipient Limitation**: There is an explicit code comment: `// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)` `` `functions/src/modules/call/services/call.service.ts` (line 88) ``. Currently, only the first recipient of the first call transfer list item is notified during initial call creation. What is the timeline for supporting simultaneous notifications to multiple recipients?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
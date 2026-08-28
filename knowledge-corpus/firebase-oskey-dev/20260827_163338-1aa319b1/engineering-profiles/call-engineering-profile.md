### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T17:08:18.712Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `call`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `call` module manages the lifecycle of real-time intercom directory calls initiated by physical Access Control Devices (ACDs) to building inhabitants. It orchestrates call session creation, sequential notification routing across configured call transfer lists, call status updates, call picture uploads, and the generation of historical call activity logs for users. [Confirmed]

### 2. Architectural Position

The `call` module acts as a real-time communication orchestration layer bridging physical edge hardware (ACDs) with user mobile applications. It sits between the `access_control_device` module (which initiates calls), the `building` module (which provides the intercom directory and call transfer lists), and the `user` module (which receives notifications and maintains call history). [Inferred]
- **Owned Concepts**: Call sessions (`/calls`), call pictures. [Confirmed]
- **Provided Capabilities**: Real-time call session management, sequential call routing, call history logging. [Confirmed]

### 3. Primary Responsibilities

#### _module_root

### Call Creation & Initialization
- Validates incoming call payloads using Joi schemas `` `functions/src/modules/call/services/call.service.ts` (lines 60-65) ``.
- Verifies that the calling device is registered and authorized `` `functions/src/modules/call/services/call.service.ts` (lines 67-69) ``.
- Resolves the call transfer list for the target building and contact ID `` `functions/src/modules/call/services/call.service.ts` (lines 71-74) ``.
- Creates a call document in the Firestore `/calls` collection `` `functions/src/modules/call/services/call.service.ts` (lines 107-108) ``.
- Resolves the building door name to use as a display name for the call notification `` `functions/src/modules/call/services/call.service.ts` (lines 110-126) ``.
- Dispatches a special push notification (`userCallReceived`) to the first call recipient `` `functions/src/modules/call/services/call.service.ts` (lines 128-141) ``.
- Uploads a base64-encoded call picture (if provided) to Google Cloud Storage `` `functions/src/modules/call/services/call.service.ts` (lines 158-176) ``.

### Call Status Updates & Termination
- Processes call status updates (e.g., `terminated`, `failed`, `cancelled`) `` `functions/src/modules/call/services/call.service.ts` (lines 199-206) ``.
- Validates that the update request is authorized by matching the sequence numbers of the call transfer list `` `functions/src/modules/call/services/call.service.ts` (lines 214-234) ``.
- Calculates call duration and determines if the call was `missed` based on recipient event statuses `` `functions/src/modules/call/services/call.service.ts` (lines 248-266) ``.
- Writes a historical call document to the `/users/{userId}/calls` collection for every recipient involved in the call `` `functions/src/modules/call/services/call.service.ts` (lines 280-302) ``.
- Enriches and validates the call activity, then aggregates it for the user's activity log `` `functions/src/modules/call/services/call.service.ts` (lines 303-328) ``.

### Sequential Call Notification Routing
- Handles sequential notification routing to subsequent recipients in the call transfer list when a sequence step is triggered `` `functions/src/modules/call/services/call.service.ts` (lines 350-425) ``.
- Dispatches notifications to the next sequence group and returns the next sequence number in the response `` `functions/src/modules/call/services/call.service.ts` (lines 389-424) ``.

### Call Document Persistence
- Provides direct CRUD operations (create, get, update) on the Firestore `/calls` collection via `OSKCallController` `` `functions/src/modules/call/controllers/call.controller.ts` (lines 13-38) ``.

---

### 4. Public Interfaces

#### _module_root

### `OSKCallService`
- **Type**: Express HTTP Service / Controller
- **File**: `functions/src/modules/call/services/call.service.ts` (line 43)
- **Description**: Exposes the primary HTTP endpoints for call orchestration, including call creation, status updates, and sequential notification routing.

### `OSKCallController`
- **Type**: Firestore Document Controller
- **File**: `functions/src/modules/call/controllers/call.controller.ts` (line 13)
- **Description**: Extends `OSKDocumentController` to provide direct persistence operations for `/calls` documents.

---

### 5. Internal Structure

*Note on Intra-Module Coupling:*
The `call` module is structured as a single flat module with no internal submodules (`submoduleCount: 0`). Consequently, there is no intra-module coupling between sibling submodules. All internal logic is contained within the root module scope. [Confirmed]

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Data Ownership Conclusion:*
The `call` module is the primary owner of the `/calls/{callId}` collection and the associated Cloud Storage path `calls/${call.callId}/public/callPictures/${pictureFileName}`. [Inferred]
While the module performs write operations to `/users/{userId}/calls/{callId}` via `OSKUserCallController` during call termination, this is a denormalized projection of call history owned by the `user` module, updated to populate the user's personal call log. [Inferred]

**Per-capability evidence:**

#### _module_root

### Firestore Collections

#### `/calls/{callId}`
- **Operations**: Create, Read, Update [Confirmed]
- **Detection Scope**: `OSKCallController` `` `functions/src/modules/call/controllers/call.controller.ts` (lines 20-38) ``.

#### `/users/{userId}/calls/{callId}`
- **Operations**: Create/Set [Confirmed]
- **Detection Scope**: `OSKUserCallController` called during call termination `` `functions/src/modules/call/services/call.service.ts` (line 300) ``.

### Storage Paths

#### `calls/${call.callId}/public/callPictures/${pictureFileName}`
- **Operations**: Write [Confirmed]
- **Detection Scope**: Call picture upload during call creation `` `functions/src/modules/call/services/call.service.ts` (lines 164-168) ``.

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### HTTP Endpoints

#### `POST /calls`
- **Description**: Initiates a new call from an Access Control Device.
- **Request Type**: `OSKCallCreationBody` (validated by `callCreationBodySchema`) `` `functions/src/modules/call/services/call.service.ts` (lines 56-65) ``.
- **Response Type**: `OSKCall` `` `functions/src/modules/call/services/call.service.ts` (line 182) ``.

#### `PATCH /calls/:callId`
- **Description**: Updates the status and events of an ongoing call.
- **Request Type**: `OSKCallUpdateBody` (validated by `callUpdateBodySchema`) `` `functions/src/modules/call/services/call.service.ts` (lines 199-210) ``.
- **Response Type**: `{}` (empty object) `` `functions/src/modules/call/services/call.service.ts` (line 336) ``.

#### `POST /calls/:callId/notify/:sequenceNumber`
- **Description**: Triggers notifications for a specific sequence number in the call transfer list.
- **Request Parameters**: `callId` (string), `sequenceNumber` (integer) `` `functions/src/modules/call/services/call.service.ts` (lines 350-352) ``.
- **Response Type**: `OSKCallNotificationRequestResponse` `` `functions/src/modules/call/services/call.service.ts` (line 425) ``.

### Firestore Triggers
- No Firestore triggers are owned by this capability.

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Cross-Cutting Security Analysis & Enforcement Tally:*
- **Device Verification**: The `POST /calls` endpoint verifies that the caller device exists by calling `OSKAccessControlDeviceController.get`. If the device is not found, it raises 1 `403 Forbidden` error. [Confirmed]
- **Update Authorization**: The `PATCH /calls/:callId` endpoint verifies that the incoming `callTransferList` items match the existing call's sequence numbers. If there is a mismatch, it raises 1 `403 Not authorized` error. [Confirmed]
- **RBAC Mismatches**: There are zero RBAC permission checks (e.g., `v1.org...` strings) enforced within the `call` module. This is consistent with the fact that calls are initiated by edge devices (ACDs) and routed to users, rather than being managed by property managers via the PGO portal. [Confirmed]

*Unattributed Security Signals:*
- `POST /calls` raises 1 `403 Forbidden` error with no RBAC string identifiable behind it. [Confirmed]
- `PATCH /calls/:callId` raises 1 `403 Not authorized` error with no RBAC string identifiable behind it. [Confirmed]

*Cross-Cutting Risks:*
- **Firestore Rules Lockout**: The `/calls` collection has no explicit rules defined in `firestore.rules.txt`, defaulting to a total lockout (`allow read, write: if false;`). This forces all reads and writes to `/calls` to bypass Firestore security rules via the Admin SDK in Cloud Functions. While secure from direct client manipulation, it increases reliance on the Cloud Function gateway's internal validation logic and prevents direct client-side Firestore listeners. [Inferred]

**Per-capability evidence:**

#### _module_root

### Security Checks
- **Device Verification**: The `POST /calls` endpoint verifies that the caller device exists by calling `OSKAccessControlDeviceController.default.get(body.callerId)`. If the device is not found, it returns `403 Forbidden` `` `functions/src/modules/call/services/call.service.ts` (lines 68, 193-194) ``.
- **Update Authorization**: The `PATCH /calls/:callId` endpoint verifies that the incoming `callTransferList` items match the existing call's sequence numbers. If there is a mismatch, it returns `403 Not authorized` `` `functions/src/modules/call/services/call.service.ts` (lines 214-234) ``.
- **RBAC Mismatches**: No explicit RBAC permission strings (e.g., `v1.org...`) are checked in this capability's code. This is consistent with the fact that calls are initiated by edge devices (ACDs) and routed to users, rather than being managed by property managers via the PGO portal. [Confirmed]

---

### 10. Cross-Module Relationships

The `call` module maintains the following verified relationships with other modules in the repository:

#### Outbound Dependencies (Confirmed)
- **`core`**: Imports `OSKDocumentController` and `OSKDocumentUpdate` for document operations, and `OSKLoggingService` for logging. Calls `OSKDocumentController._create`, `_generateDocId`, `_get`, and `_update`.
- **`access_control_device`**: Imports `OSKAccessControlDeviceController` and `OSKActivityEnrichmentService`. Calls `OSKAccessControlDeviceController.get` to verify calling devices and `OSKActivityEnrichmentService.enrichAndValidateActivity` to process call-related events.
- **`building`**: Imports `OSKBuildingDoorController` and `OSKBuildingIntercomCallTransferListController`. Calls `OSKBuildingDoorController.get` and `OSKBuildingIntercomCallTransferListController.get` to retrieve door and intercom call transfer configurations.
- **`user`**: Imports `OSKUserActivityAggregatesService`, `OSKUserCallController`, and `OSKUserNotificationService`. Calls `OSKUserCallController.set` to log user call history, `OSKUserNotificationService.createSpecial` to dispatch call notifications, and `OSKUserActivityAggregatesService.ActivityReceivedForUser` to aggregate call activity.

#### Inbound Dependencies (Confirmed)
- **`apps`**: Imports `OSKICEServers` model from `call` for notification options.
- **`user`**: Imports `OSKCallStatus` from `call` for user call documents.

### 11. External Hooks

#### _module_root

### Storage Integration
- **Google Cloud Storage**: Saves call pictures to the default bucket under `calls/${call.callId}/public/callPictures/${pictureFileName}` `` `functions/src/modules/call/services/call.service.ts` (lines 164-168) ``. [Confirmed]

### External Libraries
- **express**: Used to define the HTTP routing and middleware `` `functions/src/modules/call/services/call.service.ts` (line 8) ``. [Confirmed]
- **uuid**: Used to generate unique filenames for call pictures `` `functions/src/modules/call/services/call.service.ts` (line 28) ``. [Confirmed]
- **joi**: Used for request body validation `` `functions/src/modules/call/schema/call_creation_body.schema.ts` (line 6) ``. [Confirmed]

---

### 12. Architectural Observations

- **Orchestration Pattern**: The `call` module acts as a pure orchestration layer. It coordinates specialized services across `access_control_device`, `building`, and `user` to execute the intercom call flow without owning the underlying directory or user notification delivery mechanisms. [Inferred]
- **Denormalization & Fan-out**: Upon call termination, the module executes a dual-write/fan-out pattern by calling `OSKUserCallController.set` to write to `/users/{userId}/calls/{callId}`. This isolates user call history from the global `/calls` collection, optimizing for user-centric reads. [Inferred]
- **Edge-to-Cloud Integration**: The module bridges physical edge hardware (ACDs) with cloud services. It validates physical device existence (`access_control_device`) before establishing a cloud-managed call session, ensuring edge interactions are authenticated. [Confirmed]

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Single Recipient Limitation (CLD1-852)**: The call creation logic is currently limited to notifying only the first recipient in the first transfer list item, as evidenced by the TODO comment in `call.service.ts` (line 88). This prevents multi-recipient or robust sequential failover routing from functioning as architecturally intended. [Confirmed]
- **Incomplete Signaling Status Updates (CLD1-787)**: Commented-out code in `call.service.ts` (lines 268-278) indicates that signaling status updates for participants who did not receive notifications are currently unimplemented or disabled, potentially leaving client applications in inconsistent signaling states. [Inferred]
- **Total Firestore Rules Lockout**: The `/calls` collection is completely locked down in `firestore.rules.txt` (`allow read, write: if false;`). This means any future client-side direct reads (e.g., mobile apps listening to call status changes in real-time via Firestore snapshots) are impossible without routing through a custom signaling gateway or modifying the rules. [Inferred]
- **Lack of RBAC Alignment**: The module does not reference or enforce any permissions defined in `rbac-roles.json`. While call routing is primarily automated, the lack of administrative RBAC checks means there is no standard mechanism for property managers or administrators to audit or manage active call sessions. [Confirmed]

**Per-capability open questions:**

#### _module_root

- **Single Recipient Limitation**: The code contains a TODO comment: `// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)` in `call.service.ts` (line 88). This indicates that call creation currently only notifies the first recipient in the first transfer list item. [Confirmed]
- **Signaling Status Updates**: There is commented-out code regarding signaling status updates for participants who did not receive notifications (CLD1-787) in `call.service.ts` (lines 268-278). It is unknown if this logic is handled elsewhere or is a pending fix. [Inferred]
- **Firestore Rules**: The Firestore rules document does not explicitly define rules for the `/calls` collection, meaning it defaults to `allow read, write: if false;`. This implies that all reads and writes to `/calls` must go through the serverless Cloud Functions (which bypass security rules via the Admin SDK). [Inferred]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
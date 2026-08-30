### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:34:01.417Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `call`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `call` module orchestrates the lifecycle of real-time intercom directory calls initiated from physical Access Control Devices (ACDs) to residents' mobile applications. It manages call validation, recipient resolution, push notifications, call picture uploads, status updates, and activity log enrichment upon call termination. **Confirmed**.

### 2. Architectural Position

The `call` module acts as a real-time communication orchestration layer bridging physical hardware (ACDs) with user-facing mobile applications. It sits between the `access_control_device` module (which represents physical entry points), the `building` module (which provides door and intercom directory configurations), and the `user` module (which manages resident accounts, call histories, and notifications). It relies on `core` for base document controller operations and logging. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

### Call Creation & Initialization
- **Validation**: Validates incoming call creation payloads (`OSKCallCreationBody`) from ACDs using Joi schemas. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 56-65)).
- **Transfer List Resolution**: Fetches the call transfer list for the building and contact ID. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 70-73)).
- **User Resolution & Notification**: Resolves the target resident user and dispatches a special push notification (`userCallReceived`) to their mobile device. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 88-138)).
- **Call Picture Upload**: If a base64-encoded picture is provided, it uploads the image to Google Cloud Storage. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 156-178)).
- **Persistence**: Persists the call document with an initial status of `created` and updates it to `started` once notifications are sent. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 107-181)).

### Call Transfer List Routing & Progression
- **Sequential Notification**: Manages sequential call routing (transfer lists) to notify subsequent recipients if the initial recipient does not answer. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 350-441)).
- **Status Tracking**: Tracks the status of each recipient in the transfer list (e.g., `notNotified`, `hasBeenNotified`, `cannotBeNotified`, `didReceiveNotification`, `didJoin`, `didTimeout`, `didReject`, `didLeave`, `didFail`, `wasCancelled`). **Confirmed** (`functions/src/modules/call/schema/call_update_body.schema.ts` (lines 30-43)).

### Call Status & Event Updates
- **Status Progression**: Handles PATCH requests to update call status (e.g., `created`, `started`, `answered`, `terminated`, `failed`, `cancelled`) and records events. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 199-238)).
- **Call History Logging**: When a call ends (status is `terminated`, `failed`, or `cancelled`), it computes the call duration, determines if the call was `missed`, and writes a call history record to the user's call collection. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 239-302)).

### Activity Log Enrichment
- **Activity Generation**: Enriches call events into platform-wide activity logs and user activity aggregates upon call termination. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 303-328)).

---

### 4. Public Interfaces

#### _module_root

### Controllers
- **`OSKCallController`** (extends `OSKDocumentController`): Handles direct Firestore CRUD operations for call documents under the `/calls` collection. **Confirmed** (`functions/src/modules/call/controllers/call.controller.ts` (lines 13-39)).

### Entry Points
- **`OSKCallService`**: Exposes an Express router (`httpController`) that handles HTTP endpoints for call creation, status updates, and sequential notifications. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 43-538)).
- **`getHttpsFunctionTriggers`**: Cloud Function entry point that registers the HTTPS triggers for the call module. **Confirmed** (`functions/src/modules/call/index.ts` (lines 31-35)).

---

### 5. Internal Structure

The `call` module is implemented as a single flat module with no internal submodules. Consequently, there is no intra-module coupling between sibling submodules. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

The `call` module is the primary owner of the `/calls/{callId}` collection, which stores authoritative call metadata, transfer lists, status, and events. **Confirmed**. 

For the `/users/{userId}/calls/{callId}` path, although the `call` module writes call history records to this path upon call termination, this path is structurally nested under `/users` and is owned by the `user` module. The `call` module interacts with it indirectly via the `OSKUserCallController` from the `user` module. **Inferred**.

**Per-capability evidence:**

#### _module_root

### Firestore Collections
- **`/calls/{callId}`**
  - **Description**: Stores the authoritative call document containing call metadata, transfer lists, status, and events.
  - **Operations**: Read, Created, Updated.
  - **Citations**: `functions/src/modules/call/controllers/call.controller.ts` (lines 20-38). **Confirmed**
- **`/users/{userId}/calls/{callId}`**
  - **Description**: Stores call history records for recipients when a call terminates.
  - **Operations**: Created (via `OSKUserCallController.default.set`).
  - **Citations**: `functions/src/modules/call/services/call.service.ts` (lines 295-300). **Confirmed** (Note: This path is owned by the `user` module, but written to by this capability).

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts
The capability exposes an Express router (`httpController`) registered as an HTTPS Cloud Function. **Confirmed** (`functions/src/modules/call/index.ts` (lines 33-44)).

#### Endpoints
- **`POST /calls`**
  - **Description**: Creates a new call.
  - **Request Body**: `OSKCallCreationBody` (validated against `callCreationBodySchema`).
  - **Response**: `OSKCall` (status `200`).
  - **Citations**: `functions/src/modules/call/services/call.service.ts` (lines 56-198). **Confirmed**
- **`PATCH /calls/:callId`**
  - **Description**: Updates call status and transfer list events.
  - **Request Body**: `OSKCallUpdateBody` (validated against `callUpdateBodySchema`).
  - **Response**: Empty object `{}` (status `200`).
  - **Citations**: `functions/src/modules/call/services/call.service.ts` (lines 199-342). **Confirmed**
- **`POST /calls/:callId/notify/:sequenceNumber`**
  - **Description**: Triggers notifications for a specific sequence in the call transfer list.
  - **Response**: `OSKCallNotificationRequestResponse` (status `200`).
  - **Citations**: `functions/src/modules/call/services/call.service.ts` (lines 350-441). **Confirmed**

#### Schemas
- **`callCreationBodySchema`**: Validates `OSKCallCreationBody` (socketId, externalCallId, callerId, callerType, buildingId, unitId, contactId, picture, iceServers, creationTimestamp). **Confirmed** (`functions/src/modules/call/schema/call_creation_body.schema.ts`).
- **`callUpdateBodySchema`**: Validates `OSKCallUpdateBody` (callerId, status, events, callId, externalCallId, callerType, buildingId, unitId, contactId, callTransferList, iceServers, callPictureName). **Confirmed** (`functions/src/modules/call/schema/call_update_body.schema.ts`).
- **`iceServerSchema`**: Validates `OSKICEServers` (urlStrings, username, credentials). **Confirmed** (`functions/src/modules/call/schema/ice_server.schema.ts`).

### Firestore Triggers
None evidenced in this capability pack. **Confirmed**

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

No specific RBAC permission strings (e.g., `v1.org...` or `v1.admin...` from the `rbac-roles.json` schema) are explicitly referenced or enforced within the `call` module's code. **Confirmed**.

Instead, security boundaries are enforced through:
- **Device Validation**: The module validates that the caller is a registered Access Control Device (ACD) by checking `OSKAccessControlDeviceController.default.get(body.callerId)`. If not found, it raises a `403 Forbidden` error (1 occurrence). **Confirmed**.
- **Sequence Validation**: The module validates that the sequence numbers in PATCH requests match the existing call transfer list to prevent unauthorized out-of-sequence updates. **Confirmed**.

**Cross-Cutting Risk Callouts**:
- **Absence of RBAC Enforcement**: The entire module operates with zero (0) RBAC checks. While it validates caller identity via device registration, any authenticated user or registered device could theoretically invoke call endpoints if they bypass or spoof caller IDs, as there are no user-role-based restrictions (e.g., verifying if a user has permission to initiate or modify calls). **Inferred**.
- **Unattributed Security-Relevant Signals**: The device validation logic raises a `403 Forbidden` error when a caller ID does not resolve to a registered ACD, but this check is performed programmatically without backing from the platform's standard RBAC schema. **Confirmed**.

**Per-capability evidence:**

#### _module_root

- **RBAC Permissions**: No specific RBAC permission strings (e.g., `v1.org...`) are explicitly referenced in the code of this capability. **Confirmed**
- **Security Checks**:
  - **Device Validation**: Validates that the caller is a registered Access Control Device (ACD) by checking `OSKAccessControlDeviceController.default.get(body.callerId)`. If not found, returns `403 Forbidden`. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 193-194)).
  - **Sequence Validation**: Validates that the sequence numbers in the PATCH request match the existing call transfer list to prevent unauthorized updates. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 222-234)).

---

### 10. Cross-Module Relationships

Based on the deterministic Cross-Module Dependency Graph, the `call` module maintains the following relationships:

**Outbound Dependencies (this module depends on X)**:
- **`access_control_device`**: **Confirmed**. The `call` module imports from `@oskey/access_control_device` and calls `OSKAccessControlDeviceController.get` to validate caller devices, and uses `OSKActivityEnrichmentService.enrichAndValidateActivity` to enrich activity logs.
- **`building`**: **Confirmed**. The `call` module imports from `@oskey/building/door` and `@oskey/building/intercom` to retrieve door information (`OSKBuildingDoorController.get`) and intercom call transfer lists (`OSKBuildingIntercomCallTransferListController.get`).
- **`core`**: **Confirmed**. The `call` module imports from `@oskey/core` and `@oskey/core/controllers/document` to inherit base document operations (`OSKDocumentController` methods: `_create`, `_generateDocId`, `_get`, `_update`) and utilize logging (`OSKLoggingService`).
- **`user`**: **Confirmed**. The `call` module imports from `@oskey/user/call`, `@oskey/user/notification`, and `../../user/modules/user_activity/` to set call history (`OSKUserCallController.set`), dispatch notifications (`OSKUserNotificationService.createSpecial`), retrieve user profiles (`OSKUserController.get`), and aggregate user activities (`OSKUserActivityAggregatesService.ActivityReceivedForUser`).

**Inbound Dependencies (X depends on this module)**:
- **`apps`**: **Confirmed**. The `apps` module imports `OSKICEServers` from `src/modules/call/models/shared/ice_servers.model` for notification options.
- **`user`**: **Confirmed**. The `user` module imports `OSKCallStatus` from `@oskey/call` for its user call document model.

### 11. External Hooks

#### _module_root

### Storage Integrations
- **Google Cloud Storage**: Uploads call pictures to Google Cloud Storage under the path `calls/${call.callId}/public/callPictures/${pictureFileName}`. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 164-170)).

### Third-Party Libraries
- **`joi`**: Used for schema validation of call creation and update bodies. **Confirmed** (`functions/src/modules/call/schema/call_creation_body.schema.ts` (line 6)).
- **`uuid`**: Used for generating unique picture filenames. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 28, 161)).
- **`express`**: Used for HTTP routing. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (lines 8, 44)).

---

### 12. Architectural Observations

- **Orchestration Layer Pattern**: The `call` module acts as a pure orchestration layer. It does not directly manage physical hardware or user accounts; instead, it coordinates between `access_control_device`, `building`, and `user` modules to execute the end-to-end call flow. **Confirmed**.
- **Tight Cross-Module Coupling**: The module exhibits high outbound coupling, depending on four other modules (`core`, `access_control_device`, `building`, `user`) to perform basic operations. It relies on the `core` module's `OSKDocumentController` to manage its own `/calls` Firestore documents, indicating a shared-controller inheritance pattern rather than isolated self-containment. **Inferred**.
- **Asynchronous Activity Enrichment**: Upon call termination, the module delegates activity enrichment and aggregation to external services (`OSKActivityEnrichmentService` in `access_control_device` and `OSKUserActivityAggregatesService` in `user`), maintaining a clean separation of concerns regarding audit logging. **Confirmed**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Single-Recipient Limitation**: Although the `call` module retrieves a full `callTransferList` from the `building` module, the implementation currently only resolves and notifies the first recipient in the list (evidenced by the TODO: `// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)`). This creates a functional gap where call-forwarding configurations for secondary residents are ignored. **Confirmed**.
- **Lack of RBAC Integration**: The module completely bypasses the platform's standard RBAC permission checks (e.g., `v1.org...` or `v1.admin...` strings defined in `rbac-roles.json`). It relies solely on device-level validation (`callerId` matching a registered ACD). If a malicious actor spoofs a registered `callerId`, there are no user-level or role-level authorization guards to prevent unauthorized call creation or status updates. **Inferred**.
- **Unresolved ICE Server Credential Rotation**: The `OSKICEServers` model contains credentials, but the mechanism for generating, securing, or rotating these credentials is not evidenced within the module, posing a potential security risk if credentials are static or hardcoded. **Inferred**.

**Per-capability open questions:**

#### _module_root

- **Call Recipient Limitation**: The code contains a TODO comment: `// TODO: we should make it works for all callRecipients, not just the first one (CLD1-852)`. This indicates that call creation currently only resolves and notifies the first recipient in the transfer list. **Confirmed** (`functions/src/modules/call/services/call.service.ts` (line 88)).
- **ICE Server Credentials**: How are STUN/TURN/ICE credentials generated or rotated? The `OSKICEServers` model contains credentials, but their source is not evidenced in this pack. **Inferred**

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
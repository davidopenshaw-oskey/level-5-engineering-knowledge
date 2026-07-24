# Module Engineering Profile: call

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.819Z

---

## 1. Executive Summary

### Interpretation

Evidence indicates that the `call` module is the HTTP-facing call-session module for Intercom-initiated real-time communication. It owns the `/calls` Firestore state machine and exposes endpoints to create a call, update call state, and notify the next call-transfer sequence.

Architecture grounding places this module in the Intercom routing layer: Android Intercom devices initiate calls from the building entrance, while resident mobile applications receive push notifications and participate in SIP/WebRTC-style sessions. The module does not own the intercom directory or call-transfer list source of truth; it reads building call-transfer-list state and converts it into the call session model.

### Evidence Used

- Architecture: `Oskey Architecture.md` describes Intercom devices as Android-based devices with camera/audio that call registered mobile phones through the cloud.
- Architecture: `Oskey Architecture.md` defines the real-time communication layer for Intercom SIP/WebRTC routing.
- Service: `OSKCallService` implements `getCallTransferList`, `convertCallTransferListFromIntercomToCall`, `convertRecipientsFromIntercomToCall`, and `updateCallTransferListStarted`.
- Controller: `OSKCallController` implements `get`, `create`, and `update`.
- Firestore Path: `OSKCallController` reads, creates, and updates `/calls`.
- Public Interface: module index exposes `onRequest({ ...options }, OSKCallService.default.httpController)`.
- Manifest: `call` contains 13 files, 1 service, 1 controller, 249 call expressions, 7 Firestore hints, 9 external hook candidates, and 0 Firestore triggers.

### Confidence

High for module purpose and persistence. Medium for SIP/WebRTC transport interpretation because the architecture document labels parts of that layer as an architectural placeholder, while AST evidence confirms HTTP call orchestration and notification behavior.

---

## 2. Architectural Position

Include:

- Parent scope: Intercom communication and Building access-control runtime.
- Owned concepts: `/calls` call-session documents and call session state transitions.
- Provided capabilities: Create call sessions, update ongoing call state, notify call recipients by transfer-list sequence, archive completed calls into user-facing call history and activity aggregates.
- Downstream consumers or candidate consumers: Intercom/ACD clients, signaling infrastructure, resident mobile applications, user notification and user activity surfaces.
- Confidence: High for owned concepts and interfaces; medium for external consumers.

### Interpretation

The module sits between physical Intercom devices and resident-facing user communication records. It validates the initiating access control device, resolves call-routing data from the building intercom call-transfer-list model, persists the active call in `/calls`, and fans out user notification and call-history records.

It depends on building, access-control-device, user, notification, user-call, and user-activity modules. It should not be treated as the source of truth for building intercom directory configuration; that source appears to be `/buildings/{buildingId}/callTransferList` and related building intercom services.

### Evidence Used

- Architecture: Building scope is the physical anchor for ACDs, including Intercom devices.
- Architecture: Unit scope is a logical administrative container; Intercoms are not assigned directly at Unit level.
- Firestore Path: `/buildings/{id}/callTransferList` contains `buildingId`, `intercomId`, `unitId`, `callTransferList`, and `creationDate`.
- Firestore Path: `/calls` contains `callId`, `externalCallId`, `callerId`, `callerType`, `buildingId`, `unitId`, `contactId`, `iceServers`, `callPictureName`, `callTransferList`, `events`, and `status`.
- Service Method: `OSKCallService.getCallTransferList` calls `OSKBuildingIntercomCallTransferListController.default.get(buildingId, callTransferListId)`.
- Public Interface: `functions/src/modules/call/index.ts` wires `OSKCallService.default.httpController` through `onRequest`.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Create an Intercom call session.
- Implemented by:
 * Controller: `OSKCallController.create`
 * Service: `OSKCallService`
 * Representative Service Method: HTTP `POST /calls`
- Evidence: The service validates the call creation body, reads the initiating ACD via `OSKAccessControlDeviceController.default.get(body.callerId)`, loads the call transfer list, creates a `/calls` document, sends a `userCallReceived` notification to the first recipient, optionally uploads a call picture, marks the call as started, and updates the call document.
- Confidence: High.

- Capability: Update ongoing call state.
- Implemented by:
 * Controller: `OSKCallController.update`
 * Service: `OSKCallService`
 * Representative Service Method: HTTP `PATCH /calls/:callId`
- Evidence: The service validates the update body, reads the current call via `OSKCallController.default.get(callId)`, checks that the submitted call-transfer-list sequence corresponds to the stored call, updates `/calls/{callId}`, and processes terminal states.
- Confidence: High.

- Capability: Notify the next transfer-list sequence.
- Implemented by:
 * Controller: `OSKCallController.get`
 * Service: `OSKCallService`
 * Representative Service Method: HTTP `POST /calls/:callId/notify/:sequenceNumber`
- Evidence: The service reads the call, finds the requested sequence number in `call.callTransferList`, resolves ACD/door display name, loads each recipient user, and calls `OSKUserNotificationService.createSpecial` with `type: 'userCallReceived'`.
- Confidence: High.

- Capability: Convert intercom call-transfer-list data into call-session state.
- Implemented by:
 * Controller: Delegated to `OSKBuildingIntercomCallTransferListController`
 * Service: `OSKCallService`
 * Representative Service Method: `convertCallTransferListFromIntercomToCall`, `convertRecipientsFromIntercomToCall`, `updateCallTransferListStarted`
- Evidence: Conversion methods map intercom call recipients into call recipients with initial statuses/events and mark the first sequence as `next` before later setting it to `current` with recipients `hasBeenNotified`.
- Confidence: High.

- Capability: Fan out completed call records.
- Implemented by:
 * Controller: Delegated to `OSKUserCallController`
 * Service: `OSKCallService`
 * Representative Service Method: HTTP `PATCH /calls/:callId`
- Evidence: For terminal statuses `terminated`, `failed`, and `cancelled`, the service computes start/end time and duration, derives `missed` if no recipient joined, writes `OSKUserCallDocument` through `OSKUserCallController.default.set`, enriches activity via `OSKActivityEnrichmentService.enrichAndValidateActivity`, and calls `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- Confidence: High.

### Interpretation

The module's primary responsibility is runtime call orchestration, not static communication-message management. The RBAC `communications` roles found in the reference appear related to administrative communications, while this module evidence points to Intercom call sessions.

### Evidence Used

- Service Method: `OSKCallService.httpController.post('/calls', ...)`.
- Service Method: `OSKCallService.httpController.patch('/calls/:callId', ...)`.
- Service Method: `OSKCallService.httpController.post('/calls/:callId/notify/:sequenceNumber', ...)`.
- Service Method: `OSKCallService.convertCallTransferListFromIntercomToCall`.
- Service Method: `OSKCallService.convertRecipientsFromIntercomToCall`.
- Service Method: `OSKCallService.updateCallTransferListStarted`.
- Controller Method: `OSKCallController.create`, `get`, and `update`.
- Firestore Path: `/calls`.
- Firestore Path: `/users/{id}/calls`.

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The public runtime interface is an HTTP controller mounted as a Cloud Function request handler. The module exposes three confirmed HTTP routes:

- `POST /calls`
- `PATCH /calls/:callId`
- `POST /calls/:callId/notify/:sequenceNumber`

The controller interface is smaller and persistence-oriented, wrapping generic Firestore operations for `/calls`.

### Evidence Used

- Public Interface: `functions/src/modules/call/index.ts` calls `onRequest({ ...options }, OSKCallService.default.httpController)`.
- HTTP Route: `this.httpController.post('/calls', ...)` in `OSKCallService`.
- HTTP Route: `this.httpController.patch('/calls/:callId', ...)` in `OSKCallService`.
- HTTP Route: `this.httpController.post('/calls/:callId/notify/:sequenceNumber', ...)` in `OSKCallService`.
- Controller Method: `OSKCallController.get` calls `_get('/calls', callId)`.
- Controller Method: `OSKCallController.create` calls `_generateDocId('/calls')` and `_create('/calls', callId, callDocument)`.
- Controller Method: `OSKCallController.update` calls `_update('/calls', callId, call)`.

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module has a simple two-class structure:

- `OSKCallService` owns HTTP request handling, validation, orchestration, notification, storage upload, transfer-list conversion, and terminal-state fan-out.
- `OSKCallController` owns Firestore access to `/calls`.

Supporting schema files validate creation and update payloads. Evidence from `call_update_body.schema.ts` shows strict status enums for recipient events and call events, including recipient statuses such as `notNotified`, `hasBeenNotified`, `didJoin`, and `wasCancelled`, and call statuses such as `created`, `started`, `answered`, `terminated`, `failed`, and `cancelled`.

### Evidence Used

- Service: `OSKCallService` has 5 detected methods.
- Controller: `OSKCallController` has 4 detected methods including constructor.
- Schema Evidence: `call_update_body.schema.ts` validates recipient status values including `notNotified`, `hasBeenNotified`, `cannotBeNotified`, `didReceiveNotification`, `didJoin`, `didTimeout`, `didReject`, `didLeave`, `didFail`, and `wasCancelled`.
- Schema Evidence: `call_update_body.schema.ts` validates call event statuses including `created`, `started`, `answered`, `terminated`, `failed`, and `cancelled`.
- Manifest: 13 files, 39 imports, 34 exports, 2 classes, 9 methods, 249 call expressions.

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

Primary persistence owned by the module is `/calls`. The module creates and updates call session documents and uses them as the active call state machine.

Confirmed nested or adjacent persistence:

- `/buildings/{buildingId}/callTransferList` is read as the source of call-routing sequence data.
- `/users/{userId}/calls` is written as denormalized call history when calls end.
- `/users/{userId}/activityAggregates` is a candidate fan-out target supported by service calls to `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- `/users/{userId}/notifications` is a candidate fan-out target supported by `OSKUserNotificationService.createSpecial`.

Cloud Storage is also used for optional call pictures under `calls/{callId}/public/callPictures/{filename}`. This is not Firestore ownership, but it is part of call-session persistence.

### Evidence Used

- Firestore Path: `/calls` appears in controller evidence lines 21, 25, 31, and 36.
- Firestore Path: `/calls` appears in service evidence for `POST /calls`.
- Firestore Path: `/calls/:callId` appears in service evidence for `PATCH /calls/:callId`.
- Firestore Path: `/calls/:callId/notify/:sequenceNumber` appears in service evidence for notification sequencing.
- Schema: `/calls` fields include `callId`, `externalCallId`, `callerId`, `callerType`, `buildingId`, `unitId`, `contactId`, `iceServers`, `callPictureName`, `callTransferList`, `events`, and `status`.
- Schema: `/buildings/{id}/callTransferList` fields include `buildingId`, `intercomId`, `unitId`, `callTransferList`, and `creationDate`.
- Schema: `/users/{id}/calls` fields include `startTime`, `endTime`, `status`, `buildingId`, `contactId`, `callId`, `callerId`, `unitId`, `callerType`, `callDuration`, `activityId`, `creationDate`, and `callPictureName`.
- Service Method: `OSKCallService.getCallTransferList` calls `OSKBuildingIntercomCallTransferListController.default.get`.
- Service Method: terminal `PATCH /calls/:callId` calls `OSKUserCallController.default.set(callRecipient.callerId, userDocument)`.
- Service Method: terminal `PATCH /calls/:callId` calls `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- Storage Path: `storage().bucket().file('calls/${call.callId}/public/callPictures/${pictureFileName}')`.

### Confidence

High for `/calls` and `/users/{id}/calls`; medium for activity aggregate and notification collection details because paths are inferred from service names and backend architecture grounding rather than direct Firestore path strings in this module artefact.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/call-api-reference.md` document.

---

## 8. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for the `call` module. Runtime behavior is exposed through an HTTP request function, not Firestore create/update/delete triggers.

### Evidence Used

- Firestore Trigger Evidence: `call-firestore-triggers.json` is an empty array.
- Manifest Summary: `firestoreTriggers` count is `0`.
- Public Interface Evidence: module index uses `onRequest`, not Firestore trigger registration.

### Confidence

High.

---

## 9. Permissions & Security

### Interpretation

No explicit permission strings or `permission-denied` evidence are present in the module artefacts. Security behavior visible in AST evidence is primarily validation and resource existence checks:

- `POST /calls` validates the request payload.
- `POST /calls` verifies the initiating access control device exists.
- `PATCH /calls/:callId` validates the payload and rejects updates where transfer-list sequence numbers do not correspond to the stored call.
- `POST /calls/:callId/notify/:sequenceNumber` only notifies recipients from the stored call transfer list.

Firestore rules only expose direct read access for `/users/{userId}/calls/{callId}` to the authenticated owner. The supplied rules evidence does not show client access rules for root `/calls`, implying root call writes are likely expected to go through backend service paths. This requires confirmation.

### Evidence Used

- Permission Evidence: `call-evidence.json` has an empty `permissionEvidence` array.
- Service Method: `POST /calls` calls `callCreationBodySchema.validateAsync(body)`.
- Service Method: `POST /calls` calls `OSKAccessControlDeviceController.default.get(body.callerId)` and returns 403 if no device is found.
- Service Method: `PATCH /calls/:callId` calls `callUpdateBodySchema.validateAsync(body)`.
- Service Method: `PATCH /calls/:callId` compares incoming and stored `callTransferList` sequence numbers and returns 403 on mismatch.
- Firestore Rules: `/users/{userId}/calls/{callId}` permits read only when `isAuthenticatedUser(userId)`.
- RBAC: `rbac-roles.json` includes `v1.org.communications.*` roles, but module evidence does not connect those permissions to this call runtime module.

### Confidence

Medium. Confirmed validation/security checks exist, but complete authentication and authorization behavior for HTTP routes is not fully evidenced.

---

## 10. Cross-Module Relationships

### Interpretation

The module is an orchestration layer over several adjacent modules. Its direct relationships are with access control devices, building call-transfer lists, building doors, users, notifications, user call history, activity enrichment, and user activity aggregates.

These relationships are directly evidenced by call expressions and imports. Broader signaling or media infrastructure should remain a candidate external boundary rather than a confirmed dependency.

### Evidence Used

- Access Control Device: `OSKAccessControlDeviceController.default.get(body.callerId)` and `get(call.callerId)`.
- Building Door: `OSKBuildingDoorController.default.get(doorAssignment.buildingId, doorAssignment.doorId)`.
- Building Intercom Call Transfer List: `OSKBuildingIntercomCallTransferListController.default.get(buildingId, callTransferListId)`.
- User: `OSKUserController.default.get(userId)` and `get(recipient.callerId)`.
- User Notification: `OSKUserNotificationService.createSpecial` sends `type: 'userCallReceived'`.
- User Call History: `OSKUserCallController.default.set(callRecipient.callerId, userDocument)`.
- Activity Enrichment: `OSKActivityEnrichmentService.enrichAndValidateActivity`.
- User Activity Aggregates: `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- Building Activity Model: import of `OSKAccessControlDeviceActivityType` from building activity document model.
- User Activity Module: import of `OSKUserActivityAggregatesService` from `../../user/modules/user_activity/`.

### Confidence

High.

---

## 11. External Hooks

### Interpretation

Confirmed external-facing hooks are HTTP routes exposed through the module's request handler and Cloud Storage writes for optional call pictures. The `/calls` strings are classified as HTTP/client path candidates by the extractor because they are Express routes; they are also backed by Firestore `/calls` controller operations.

Architecture-grounded candidate external boundaries include Intercom devices, resident mobile push notification environments, and SIP/WebRTC/STUN/TURN infrastructure. The module evidence confirms push notification requests and ICE server data in the call document, but it does not itself implement or prove the complete media/signaling stack.

### Evidence Used

- External Hook: `POST /calls`.
- External Hook: `PATCH /calls/:callId`.
- External Hook: `POST /calls/:callId/notify/:sequenceNumber`.
- External Hook: Cloud Storage path `calls/{callId}/public/callPictures/{pictureFileName}`.
- Notification Hook: `OSKUserNotificationService.createSpecial` sends `userCallReceived` payloads with `iceServers`, `callerId`, `callerType`, `recipientCallerId`, and `displayName`.
- Architecture Candidate: Intercom devices initiate video/voice calls from building entrances to resident mobile applications.
- Architecture Candidate: SIP/WebRTC signaling and STUN/TURN/ICE gateway architecture supports session negotiation.

### Confidence

High for HTTP and storage hooks. Medium for broader real-time communication infrastructure.

---

## 12. Architectural Observations

### Interpretation

The module implements a short-lived state-machine pattern around `/calls`. It creates call documents with initial `created` state, transitions them to `started`, accepts later updates, and derives terminal user-facing call history when the call ends.

It also implements denormalized fan-out. The root `/calls` document is operational state, while `/users/{userId}/calls` and user activity aggregates are durable user-centric read models for history and activity surfaces.

The module separates routing configuration from call execution. Building intercom services own call-transfer-list configuration, while this module reads and converts that configuration into per-call runtime state.

Notification progression is decoupled from creation. Initial call creation notifies the first recipient sequence, while the separate `/calls/:callId/notify/:sequenceNumber` route advances notification to later transfer-list sequences.

### Evidence Used

- Firestore Path: `/calls`.
- Service Method: `POST /calls` creates the call with status `created`, then updates status to `started`.
- Service Method: `OSKCallService.updateCallTransferListStarted` marks the first transfer-list item and recipients as notified.
- Service Method: `PATCH /calls/:callId` writes user call history when status is `terminated`, `failed`, or `cancelled`.
- Service Method: `PATCH /calls/:callId` derives final status `missed` when no recipient event includes `didJoin`.
- Service Method: `POST /calls/:callId/notify/:sequenceNumber` returns `nextSequenceNumber` when another transfer-list item exists.
- Data Architecture: `/calls` is described as a WebRTC communication session state machine.
- Data Architecture: `/users/{userId}/calls/{callId}` is described as a denormalized user-centric historical record.

### Confidence

High.

---

## 13. Risks & Open Questions

### Interpretation

- HTTP route authentication is not fully visible in the supplied evidence. The module validates payloads and device existence, but no explicit permission strings or auth middleware evidence is present in the extracted facts.
- Root `/calls` Firestore rules are not visible in the extracted rules evidence. Confirm whether clients can access `/calls` directly or whether all writes/reads are intended to flow through the HTTP service.
- The architecture document labels SIP/WebRTC signaling as an architectural placeholder. The module stores `iceServers` and sends notifications, but the actual signaling/media server boundary is not proven by this module's evidence.
- `/calls/:callId` and `/calls/:callId/notify/:sequenceNumber` are classified as both HTTP/client path candidates and storage path candidates by the extractor. Call expressions confirm they are HTTP routes, while the storage path confirmed by service evidence is `calls/{callId}/public/callPictures/{pictureFileName}`.
- `v1.org.communications.*` RBAC roles exist, but no direct evidence ties them to this runtime call module. They may belong to administrative intercom communication messages rather than call sessions.
- Terminal status handling fans out to activity aggregation, but the persistence path for activity aggregates is not directly present as a string in the module artefact.

### Evidence Used

- Permission Evidence: empty `permissionEvidence` array.
- Firestore Rules: only `/users/{userId}/calls/{callId}` read rule was found for call history.
- Architecture: SIP/WebRTC signaling is labeled as an architectural placeholder.
- External Hook Evidence: `/calls/:callId` and `/calls/:callId/notify/:sequenceNumber` are both `http_or_client_path_candidate` and `storage_path_candidate`.
- Storage Evidence: service code path string `calls/${call.callId}/public/callPictures/${pictureFileName}`.
- RBAC: `v1.org.communications.admin`, `list`, `view`, `create`, `edit`, and `delete` exist in `rbac-roles.json`.
- Service Method: `OSKUserActivityAggregatesService.ActivityReceivedForUser` is called, but no literal Firestore path appears in this module evidence.

### Confidence

High.

---

## 14. Evidence References

- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `output/knowledge-pipeline/modules/call/call-manifest.json`
- `output/knowledge-pipeline/modules/call/call-services.json`
- `output/knowledge-pipeline/modules/call/call-controllers.json`
- `output/knowledge-pipeline/modules/call/call-evidence.json`
- `output/knowledge-pipeline/modules/call/call-evidence-graph.json`
- `output/knowledge-pipeline/modules/call/call-firestore-triggers.json`

### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:34:29.695Z
- repoName: firebase-oskey-dev
- targetModule: call
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
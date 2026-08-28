### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T17:08:47.254Z
- repoName: firebase-oskey-dev
- targetModule: call
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
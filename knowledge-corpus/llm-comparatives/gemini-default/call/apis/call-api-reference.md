### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T16:52:27.281Z
- repoName: firebase-oskey-dev
- targetModule: call
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
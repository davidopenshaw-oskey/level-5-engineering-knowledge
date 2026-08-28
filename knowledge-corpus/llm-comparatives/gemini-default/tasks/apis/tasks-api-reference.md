### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T15:28:12.125Z
- repoName: firebase-oskey-dev
- targetModule: tasks
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

- **HTTP Endpoint**: `handleTask` `` `api_contract|tasks|functions/src/modules/tasks/index.ts|handleTask|#1` ``
  - **Request/Response Schemas**: No resolved schemas matched.
  - **Payload Types**:
    - `OSKPincodeRefreshTaskPayload`: Contains `buildingId`, `unitId`, `userId`, `accessId`, `oldPincode`, and `isAppUser` `` `functions/src/modules/tasks/models/pincode_refresh_task.model.ts` (lines 7-12) ``.
    - `OSKIntercomCommunicationTaskPayload`: Contains `organizationId`, `buildingId`, `communicationId`, and `communicationType` `` `functions/src/modules/tasks/models/tasks.model.ts` (lines 10-13) ``.
    - `OSKTScheduledTaskPayload`: Type alias combining payloads `` `type_alias|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKTScheduledTaskPayload|#1` ``.

---
## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.563Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_call
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_call` capability manages the persistence, retrieval, and lifecycle of user-specific call history records (logs) within the `user` module. It provides the data models and controller operations necessary to store individual call documents under a user's private Firestore subcollection. [Confirmed]

---

## 2. Primary Responsibilities
The `user_call` capability is responsible for the following distinct features:

- **Call History Storage**: Writing and updating individual call records associated with a specific user using the `set` method `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|set|#1` ``.
- **Call History Purging**: Deleting all call records for a specific user using the `deleteAll` method `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|deleteAll|#1` ``.
- **Collection Path Resolution**: Dynamically resolving the Firestore collection path for a user's calls via `getCollectionPath(userId)` `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|getCollectionPath|#1` ``.
- **Data Modeling**: Defining the structure of a user's call log document (`OSKUserCall` and `OSKUserCallDocument`) `` `type_alias|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|#1` ``, which tracks properties such as:
  - `startTime` and `endTime` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|startTime|#1` ``, `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|endTime|#1` ``
  - `status` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|status|#1` ``
  - `buildingId` and `unitId` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|buildingId|#1` ``, `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|unitId|#1` ``
  - `callId`, `callerId`, and `callerType` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callId|#1` ``, `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callerId|#1` ``, `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callerType|#1` ``
  - `contactId` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|contactId|#1` ``
  - `callDuration` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callDuration|#1` ``
  - `callPictureName` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callPictureName|#1` ``
  - `activityId` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|activityId|#1` ``

---

## 3. Public Interfaces (Controllers & Entry Points)
This capability exposes the following public entry points and controllers:

- **OSKUserCallController**: A document controller class extending `OSKDocumentController` that handles operations on the user call collection `` `source_class|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController` ``.
- **Module Exports**: The capability exports its controller and model definitions via its main index file `` `functions/src/modules/user/modules/user_call/index.ts` (lines 12-21) ``:
  - `./controllers/user_call.controller` `` `exported_symbol|user|functions/src/modules/user/modules/user_call/index.ts|./controllers/user_call.controller|#1` ``
  - `./models/user_call_document.model` `` `exported_symbol|user|functions/src/modules/user/modules/user_call/index.ts|./models/user_call_document.model|#1` ``

---

## 4. API Contracts & Firestore Triggers
- No direct external API contracts (`api_contract` facts) are owned by this capability. [Confirmed]
- No Firestore triggers are registered within this capability's pack. [Confirmed]

---

## 5. Data Ownership
This capability owns and manages data stored in the following Firestore path:

- **`/users/{userId}/calls/{callId}`** [Confirmed]
  - **Operation Scope**: Document-level writes (`_set`) `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._set|set|OSKUserCallController.default.getCollectionPath(userId),document.callId,document|#1` `` and collection-level purges (`_deleteAll`) `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._deleteAll|deleteAll|OSKUserCallController.default.getCollectionPath(userId)|#1` ``.
  - **Schema Fields**: Matches the `/users/{id}/calls` collection schema defined in the Firestore Schema grounding document, mapping directly to the `OSKUserCall` properties `` `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` (lines 13-24) ``.

---

## 6. Outbound Coupling
The `user_call` capability exhibits the following outbound dependencies:

### Cross-Module Coupling
- **`core` Module**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` to extend `OSKUserCallController` `` `imports_dependency|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|@oskey/core/controllers/document|#1` ``.
  - Imports core types/utilities from `@oskey/core` in the model definition `` `imports_dependency|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|@oskey/core|#1` ``.
- **`call` Module**:
  - Imports types or models from `@oskey/call` in the user call document model `` `imports_dependency|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|@oskey/call|#1` ``.

### Intra-Module Coupling
- **`user_call` Submodule Internal Coupling**:
  - The controller imports its own document model from `../models/user_call_document.model` `` `imports_dependency|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|../models/user_call_document.model|#1` ``.

---

## 7. Permissions & Security
- **Firestore Security Rules**:
  - According to the `firestore.rules.txt` grounding document, access to the `/users/{userId}/calls/{callId}` subcollection is restricted to authenticated users matching the `userId` parameter:
    ```javascript
    match /users/{userId}/calls/{callId} {
      allow read: if(isAuthenticatedUser(userId))
    }
    ```
- **RBAC Permissions**:
  - No specific administrative RBAC permission strings (e.g., `v1.admin.*`) are referenced or checked within the code of this capability. [Confirmed]

---

## 8. External Hooks
- No external hooks, Pub/Sub topics, environment variables, or external storage paths are evidenced within this capability's pack. [Confirmed]

---

## 9. Open Questions
- **Invocation Context**: How are the `set` and `deleteAll` methods of `OSKUserCallController` triggered? Are they called programmatically by services in the `call` module when a call starts/ends, or are they bound to internal event handlers? [Inferred/Unknown]
- **API Exposure**: Is there a corresponding HTTP routing layer in the parent `user` module that exposes `OSKUserCallController` methods to the mobile application, or is this controller strictly used for internal backend orchestration? [Inferred/Unknown]
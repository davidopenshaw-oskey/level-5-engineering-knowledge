## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.566Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_intercoms
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_intercoms` capability manages user-specific intercom configurations, call transfer lists, and inhabitant mappings under the `/users/{userId}/intercoms` Firestore subcollection. It provides services to synchronize these user-scoped intercom documents when building inhabitants change and cleans up entries when inhabitants are deleted. [Confirmed: `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 20-212)]

---

## 2. Primary Responsibilities

### User Intercom Document CRUD Operations
Provides controller methods to create, retrieve, query, update, and delete user-specific intercom documents (`OSKUserIntercomDocument`) under the `/users/{userId}/intercoms` collection. [Confirmed: `functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts` (lines 10-41)]
- **Create**: Writes a new user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|create|#1` ``]
- **Get**: Retrieves a single user intercom document by ID. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|get|#1` ``]
- **Query**: Retrieves all intercom documents associated with a user. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|getAllIntercomByUser|#1` ``]
- **Update**: Updates fields on an existing user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|update|#1` ``]
- **Delete**: Removes a user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|delete|#1` ``]

### Intercom Entry Synchronization & Upsertion
Coordinates the creation and updating of user intercom entries when building-level inhabitant directories are modified. [Confirmed: `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 23-64)]
- **Idempotent Upsert**: When creating a user intercom entry, if the document already exists, the service logs an informational message and updates the existing document to maintain idempotency. [Confirmed: `` `call_expression|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService.logger.logInfo|createUserIntercomEntry|'User intercom document already exists, updating it instead to maintain idempotency.',{ userId, acdId: intercomDoc.accessControlDeviceId }|#1` ``]
- **Multi-Tenant Propagation**: Updates intercom entries for all other tenants in the same unit when a change occurs. [Confirmed: `` `call_expression|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService.updateAllUserIntercomEntry|createAndUpdateUsersIntercomEntry|intercomDoc.accessControlDeviceId,otherTenants,data|#1` ``]

### Call Transfer List Sequence Conversion
Converts call transfer lists from a sequence-number-based representation to an ordered list structure. [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|convertCallTransferListFromSequenceNumberToOrdered|#1` ``]
- Sorts the incoming call transfer list items by their `sequenceNumber` and maps them to an ordered array of `callRecipients`. [Confirmed: `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 214-224)]

### Inhabitant Deletion Cleanup
Cleans up user intercom entries and call transfer lists after an inhabitant is deleted from a unit. [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|cleanUpUserIntercomsAfterInhabitantDeletion|#1` ``]
- Filters out the deleted user from the `inhabitants` list of the intercom document. [Confirmed: `` `call_expression|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|userIntercomDoc.inhabitants.filter|cleanUpUserIntercomsAfterInhabitantDeletion|(i) => i.userId !== deletedUserId|#1` ``]
- Prunes the deleted user from any `callRecipients` within the `callTransferList`, removing any transfer list items that no longer contain active recipients. [Confirmed: `` `call_expression|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|userIntercomDoc.callTransferList                     .map((item) => ({                         ...item,                         callRecipients: item.callRecipients.filter((recipient) => recipient.callerId !== deletedUserId),                     }))                     .filter|cleanUpUserIntercomsAfterInhabitantDeletion|(item) => item.callRecipients.length > 0|#1` ``]

---

## 3. Public Interfaces (Controllers & Entry Points)

### Controllers
- **`OSKUserIntercomController`** (extends `OSKDocumentController`): Exposes document-level REST/Function endpoints for managing user intercom documents. [Confirmed: `` `source_class|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController` ``]
  - `getCollectionPath(userId: string)`: Resolves the Firestore collection path to `/users/{userId}/intercoms`. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|getCollectionPath|#1` ``]
  - `create(userId, docId, intercomDoc)`: Creates a user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|create|#1` ``]
  - `get(userId, intercomId)`: Retrieves a user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|get|#1` ``]
  - `getAllIntercomByUser(userId)`: Queries all intercoms for a user. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|getAllIntercomByUser|#1` ``]
  - `update(userId, intercomId, data)`: Updates a user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|update|#1` ``]
  - `delete(userId, intercomId)`: Deletes a user intercom document. [Confirmed: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|delete|#1` ``]

### Services
- **`OSKUserIntercomService`**: Orchestrates the business logic for user intercom synchronization, updates, and cleanup. [Confirmed: `` `source_class|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService` ``]
  - `createAndUpdateUsersIntercomEntry(userId, intercomDoc, allInhabitants, callTransferList)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|createAndUpdateUsersIntercomEntry|#1` ``]
  - `updateAllUserIntercomEntry(acdId, inhabitants, data)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|updateAllUserIntercomEntry|#1` ``]
  - `updateUserIntercomEntry(acdId, userId, data)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|updateUserIntercomEntry|#1` ``]
  - `deleteUserIntercom(userId, acdId)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|deleteUserIntercom|#1` ``]
  - `cleanUpUserIntercomsAfterInhabitantDeletion(intercomId, deletedUserId, remainingInhabitants)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|cleanUpUserIntercomsAfterInhabitantDeletion|#1` ``]
  - `createUserIntercomEntry(userId, intercomDoc, unitMatch, callTransferListOrdered)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|createUserIntercomEntry|#1` ``]
  - `convertCallTransferListFromSequenceNumberToOrdered(callTransferList)` [Confirmed: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|convertCallTransferListFromSequenceNumberToOrdered|#1` ``]

---

## 4. API Contracts & Firestore Triggers
No `api_contract` facts or Firestore trigger definitions are present in this capability's evidence pack. [Confirmed]

---

## 5. Data Ownership

### Firestore Collections & Paths
This capability owns and manages documents within the `/users/{userId}/intercoms` subcollection. [Confirmed: `functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts` (line 14)]

- **Path**: `/users/{userId}/intercoms/{intercomId}`
- **Document Type**: `OSKUserIntercomDocument` (aliased from `OSKUserIntercom & OSKDocument`) [Confirmed: `` `type_alias|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercomDocument|#1` ``]
- **Fields**:
  - `accessControlDeviceId`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|accessControlDeviceId|#1` ``]
  - `ACDName`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|ACDName|#1` ``]
  - `buildingId`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|buildingId|#1` ``]
  - `callSettingsMode`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callSettingsMode|#1` ``]
  - `callTimeSlots`: *any* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTimeSlots|#1` ``]
  - `callTransferList`: *OSKUserIntercomCallTransferListItem[]* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTransferList|#1` ``]
  - `displayName`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|displayName|#1` ``]
  - `doorName`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|doorName|#1` ``]
  - `inhabitants`: *any[]* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|inhabitants|#1` ``]
  - `unitId`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitId|#1` ``]
  - `unitNumber`: *string* [Confirmed: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitNumber|#1` ``]

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **`building` Module** (specifically `building_intercom` submodule):
  - Imports `OSKBuildingIntercomDocument` and related models from `@oskey/building/intercom` to map building-level intercom configurations to user-level intercom documents. [Confirmed: `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|@oskey/building/intercom|#1` ``, `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|@oskey/building/intercom|#1` ``]
- **`core` Module**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` to extend controller functionality. [Confirmed: `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|@oskey/core/controllers/document|#1` ``]
  - Imports core types and logging services (`OSKLoggingService`) from `@oskey/core` and `@oskey/core/logger`. [Confirmed: `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|@oskey/core|#1` ``, `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|@oskey/core/logger|#1` ``]

### Intra-Module Coupling
- **`user_intercoms` Submodule** (Self-referential/Sibling imports):
  - Imports internal models and controllers using the `@oskey/user/intercom` path alias. [Confirmed: `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|@oskey/user/intercom|#1` ``, `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|@oskey/user/intercom|#1` ``]

### External Coupling
- **`firebase-admin/firestore`**:
  - Imports `Timestamp` for recording modification and creation dates. [Confirmed: `` `imports_dependency|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|firebase-admin/firestore|#1` ``]

---

## 7. Permissions & Security

### Permission Strings
No explicit permission strings are referenced in this capability's source code. [Confirmed]

### Firestore Security Rules Cross-Check
According to `firestore.rules.txt`, the `/users/{userId}/intercoms/{intercomId}` subcollection is protected by the following rule:
```javascript
match /intercoms/{intercomId} {
  allow read: if(isAuthenticatedUser(userId))
}
```
- **Read Access**: Only the authenticated user matching `userId` can read their own intercom configurations. [Confirmed: `firestore.rules.txt`]
- **Write Access**: No client-side write rules are defined for this subcollection, indicating that all creations, updates, and deletions are performed strictly by backend services (such as `OSKUserIntercomService` running with administrative privileges). [Confirmed: `firestore.rules.txt`]

---

## 8. External Hooks
No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced within this capability's pack. [Confirmed]

---

## 9. Open Questions

- **Triggering Mechanism**: How are `createAndUpdateUsersIntercomEntry` and `cleanUpUserIntercomsAfterInhabitantDeletion` invoked? (Presumably, they are triggered by Firestore document writes on the `/buildings/{id}/units/{id}/inhabitants` collection, but the actual trigger definitions are outside this capability's pack). [Inferred]
- **`callTimeSlots` Schema**: What is the exact structure of the `callTimeSlots` field? It is defined as a property on the `OSKUserIntercom` model but is typed implicitly or not expanded in the model properties. [Unknown]
- **`unitMatch` Parameter**: In `createUserIntercomEntry(userId, intercomDoc, unitMatch, callTransferListOrdered)`, what is the structure and origin of `unitMatch`? [Unknown]
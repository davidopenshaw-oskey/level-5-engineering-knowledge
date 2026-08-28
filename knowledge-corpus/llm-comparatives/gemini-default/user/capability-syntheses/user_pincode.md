## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.579Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_pincode
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_pincode` capability manages the lifecycle of user-associated PIN codes (including inhabitants, guests, permanent guests, and anonymous/quickcode types) within the `/users/{userId}/pincodes` Firestore collection, coordinating with building-level and organization-level access controls to ensure secure entry and cleanup workflows [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` ``).

---

## 2. Primary Responsibilities

### Pincode Document Creation
The capability provides specialized methods to generate and persist pincode documents for different user personas:
- **Inhabitants**: Created via `createPincodeInhabitantDocument` [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeInhabitantDocument|#1` ``).
- **Guests**: Created via `createPincodeGuestDocument` [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeGuestDocument|#1` ``).
- **Permanent Guests**: Created via `createPincodePermanentGuestDocument` [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodePermanentGuestDocument|#1` ``).
- **Anonymous / Quickcodes**: Created via `createPincodeAnonymousDocument` [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeAnonymousDocument|#1` ``).

### Pincode Retrieval
- Retrieves all pincodes associated with a user via the `onGetUserPincodes` service method [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|onGetUserPincodes|#1` ``).
- Extracts raw pincode strings for validation or synchronization via `getAllPincodeStrings` [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|getAllPincodeStrings|#1` ``).

### Pincode Deletion & Cleanup Orchestration
When a user pincode is deleted via `deleteUserPincode`, the capability orchestrates a multi-step cleanup across different scopes [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|deleteUserPincode|#1` ``):
1. Deletes the user-scoped pincode document from `/users/{userId}/pincodes` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeController.default.delete|deleteUserPincode|request.pincodeId,request.userId|#1` ``).
2. Deletes the building-scoped pincode and moves it to trash via `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteUserPincode|request.pincodeId,pincodeDoc.buildingId|#1` ``).
3. Retrieves and updates the resident's profile in the organization scope via `OSKOrganizationResidentsController` to ensure consistency [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKOrganizationResidentsController.default.save|deleteUserPincode|organizationId,request.userId,residentDoc|#1` ``).

---

## 3. Public Interfaces (Controllers & Entry Points)

### `OSKUserPincodeController`
A document controller extending `OSKDocumentController` that exposes low-level Firestore CRUD operations for user pincodes [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController` ``).
- **Methods**: `set`, `get`, `getSafe`, `getAll`, `getAllQuickcodes`, `getByAccessId`, `getByAccessIdSafe`, `delete`, `deleteAll`, `getCollectionPath`, `getSpecificPincodesByQuery` [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` ``).

### `OSKUserPincodeService`
The primary business logic service orchestrating pincode generation, retrieval, and deletion [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService` ``).
- **Methods**: `createPincodeInhabitantDocument`, `createPincodeGuestDocument`, `createPincodePermanentGuestDocument`, `createPincodeAnonymousDocument`, `getAllPincodeStrings`, `onGetUserPincodes`, `deleteUserPincode` [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` ``).

---

## 4. API Contracts & Firestore Triggers

### Callable API Endpoints
The capability registers two Firebase Callable Functions [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/index.ts` (lines 32-38) ``):

#### `deleteUserPincode`
- **Request Type**: `OSKUserPincodeDeleteRequest` [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_pincode/index.ts|deleteUserPincode|#1` ``)
  - `pincodeId`: `string`
  - `userId`: `string`

#### `onGetUserPincodes`
- **Request Type**: `OSKUserPincodeGetRequest` [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_pincode/index.ts|onGetUserPincodes|#1` ``)
  - `userId`: `string`

### Firestore Triggers
No Firestore triggers are declared or owned by this capability [Confirmed].

---

## 5. Data Ownership

### Firestore Paths
The capability directly manages and modifies documents within the following Firestore collection paths:

#### `/users/{userId}/pincodes/{pincodeId}`
- **Description**: Stores user-scoped pincode documents [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (lines 15-27) ``).
- **Operations**: Read, Write, Delete [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` ``).

#### `/buildings/{buildingId}/pincodes/{pincodeId}`
- **Description**: Building-scoped pincodes are modified during deletion workflows [Inferred] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteUserPincode|request.pincodeId,pincodeDoc.buildingId|#1` ``).
- **Operations**: Delete (moved to trash) [Confirmed].

#### `/organizations/{organizationId}/residents/{residentId}`
- **Description**: Resident profiles are updated to reflect pincode deletion [Inferred] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKOrganizationResidentsController.default.save|deleteUserPincode|organizationId,request.userId,residentDoc|#1` ``).
- **Operations**: Read, Update [Confirmed].

---

## 6. Outbound Coupling

### Cross-Module Coupling
The capability depends on the following external modules:

#### `core` Module
- `@oskey/core/access`: Used for core access control models and types [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|@oskey/core/access|#1` ``).
- `@oskey/core/controllers/document`: Inherits base document controller functionality [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|@oskey/core/controllers/document|#1` ``).
- `@oskey/core`: Core utilities and shared services [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|@oskey/core|#1` ``).

#### `building` Module
- `@oskey/building`: Used to fetch building details during pincode deletion [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|@oskey/building|#1` ``).

#### `organization` Module
- `@oskey/organization/residents`: Used to manage and update resident profiles in organization scope [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|@oskey/organization/residents|#1` ``).

### Intra-Module Coupling
- `@oskey/user/pincode`: Imports internal models and controllers [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|@oskey/user/pincode|#1` ``).

### Shared Utilities & Decorators
- `../../../../../decorators/securityChecks`: Custom security decorators [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|../../../../../decorators/securityChecks|#1` ``).
- `@oskey/utils/errors_helper`: Error handling utilities [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|@oskey/utils/errors_helper|#1` ``).
- `@oskey/utils/https-response`: Standardized HTTPS responses [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|@oskey/utils/https-response|#1` ``).
- `@oskey/utils/security_check`: Parameter and security validation [Confirmed] (`` `imports_dependency|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|@oskey/utils/security_check|#1` ``).

---

## 7. Permissions & Security

### Security Decorators
- Entry points are protected by the `OSKUserSecurityChecks` decorator to verify user identity and session validity [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserSecurityChecks|deleteUserPincode||#1` ``).

### Parameter Validation
- Uses `OSKSecurityChecks.checkParameters` to validate incoming request payloads (e.g., verifying `userId` and `pincodeId` types) [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKSecurityChecks.checkParameters|deleteUserPincode|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'pincodeId', value: request.pincodeId, type: 'string' },         ]|#1` ``).

### RBAC Permissions
- No explicit RBAC permission strings (e.g., `v1.admin.*`) are directly referenced in the provided facts for this capability [Confirmed].

---

## 8. External Hooks
No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or storage paths) are directly evidenced within this capability's pack [Confirmed].

---

## 9. Open Questions
- **Pincode Synchronization**: While the capability handles Firestore-level creation and deletion, the exact mechanism by which these pincodes are synchronized down to the physical Access Control Devices (ACDs) (e.g., via Pub/Sub or MongoDB mirrors) is handled outside this capability's scope [Inferred].
- **Security Decorator Implementation**: The exact authorization logic executed by the `OSKUserSecurityChecks` decorator is not visible in this capability pack [Inferred].
## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.499Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_pending
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `organization_pending` capability manages the lifecycle of organization registration requests (Confirmed). It allows users to submit requests to register new organizations and provides administrative workflows for platform administrators to review, approve, or reject these requests (Confirmed).

## 2. Primary Responsibilities
- **Pending Organization Creation**: Allows authenticated users to submit a request to register a new organization, which is stored with a status of `'pending'` (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|createPendingOrganization|#1` ``.
- **Request Retrieval**: 
  - Allows users to retrieve their own pending organization requests (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getCurrentUserPendingOrganizations|#1` ``.
  - Allows platform administrators to retrieve all pending organization requests (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getAllPendingOrganizations|#1` `` or fetch a specific request by its ID (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|getPendingOrganizationById|#1` ``.
- **Request Rejection**: Allows platform administrators to reject a pending organization request, updating its status to `'rejected'` (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|rejectPendingOrganizationRequest|#1` ``.
- **Request Approval & Provisioning**: Allows platform administrators to approve a pending organization request (Confirmed) `` `service_method|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService|approvePendingOrganizationRequest|#1` ``. This workflow:
  - Updates the request status to `'approved'` (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingController.default.update|approvePendingOrganizationRequest|requestData.pendingOrganizationId,{             status: 'approved',         }|#1` ``.
  - Provisions a new organization document in the system (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationService.createAnOrganization|approvePendingOrganizationRequest|organizationDocument,context|#1` ``.
  - Automatically invites the requesting user to the newly created organization as an administrator, granting them all roles starting with `'v1.org'` (Confirmed) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationUserInvitationService.inviteUserWithInvitation|approvePendingOrganizationRequest|userInvitation,context,adminsOrganizationId|#1` ``.

## 3. Public Interfaces (Controllers & Entry Points)
- **OSKOrganizationPendingController** (Confirmed) `` `source_class|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController` ``: Extends `OSKDocumentController` to manage direct Firestore operations on the `organizationsPending` collection. It exposes methods such as `generateDocId`, `getAll`, `getAllByUserId`, `getById`, `save`, and `update` (Confirmed) `` `functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts` (lines 14-49) ``.
- **OSKOrganizationPendingService** (Confirmed) `` `source_class|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|OSKOrganizationPendingService` ``: The primary service class containing the business logic for validating, creating, retrieving, approving, and rejecting pending organization requests.

## 4. API Contracts & Firestore Triggers

### Callable Functions
The capability exposes the following Firebase HTTPS Callable Functions (Confirmed) `` `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35) ``:
- `approvePendingOrganizationRequest`
- `createPendingOrganization`
- `getAllPendingOrganizations`
- `getCurrentUserPendingOrganizations`
- `getPendingOrganizationById`
- `rejectPendingOrganizationRequest`

### Resolved API Request/Response Schemas

#### approvePendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

#### createPendingOrganization
- **Request Type**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`

#### getAllPendingOrganizations
- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`

#### getCurrentUserPendingOrganizations
- *Note: No `model_property` facts matched within this pack for this endpoint's request/response types.*

#### getPendingOrganizationById
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `import("functions/src/modules/user/models/documents/user_document.model").OSKUserDocument | undefined`

#### rejectPendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

## 5. Data Ownership
- **Firestore Collection**: `/organizationsPending` (Inferred) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|OSKOrganizationPendingController.default._generateDocId|generateDocId|'organizationsPending'|#1` ``.
  - This capability owns the documents representing pending organization requests, which contain details such as the requesting user's ID, organization name, tax number, street address, and approval status (Confirmed) `` `type_alias|organization|functions/src/modules/organization/modules/organization_pending/models/documents/organization_pending_document.model.ts|OSKOrganizationPending|#1` ``.

## 6. Outbound Coupling

### Cross-Module Coupling
- **core**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/controllers/organization_pending.controller.ts|@oskey/core/controllers/document|#1` ``.
  - Imports logging utilities from `@oskey/core/logger` (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|@oskey/core/logger|#1` ``.
- **user**:
  - Imports `OSKUserController` from `@oskey/user` to fetch user profiles during request resolution (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|@oskey/user|#1` ``.
- **settings**:
  - Imports `@oskey/settings/role` to list composite roles and check user permissions (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|@oskey/settings/role|#1` ``.

### Intra-Module Cross-Submodule Coupling
- **organization_user**:
  - Imports `OSKOrganizationUserController` from `@oskey/organization/user` to fetch organization user records (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|@oskey/organization/user|#1` ``.
- **organization_user_invitation**:
  - Imports `OSKOrganizationUserInvitationService` from `../../organization_user_invitation/services/organization_user_invitation.service` to invite approved users to their new organization (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|../../organization_user_invitation/services/organization_user_invitation.service|#1` ``.
- **organization (root/sibling)**:
  - Imports `OSKOrganizationService` from `@oskey/organization` to provision the approved organization (Confirmed) `` `imports_dependency|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|@oskey/organization|#1` ``.

## 7. Permissions & Security
The capability references and enforces the following permission strings:
- `v1.admin.org.validate` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.admin.org.validate|#1` ``: Required to list, view, reject, or approve pending organization requests. This matches the RBAC roles document description: *"v1.admin - Allows to validate a new organization"*.
- `v1.org.user.create` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org.user.create|#1` ``: Referenced during the approval flow when inviting the requesting user to the newly created organization. This matches the RBAC roles document description: *"Allows to add a new user to the Oskey Property Management Portal"*.
- `v1.org` (Confirmed) `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_pending/services/organization_pending.service.ts|v1.org|#1` ``: Used as a prefix filter to gather all organization-level roles to assign to the newly created organization's administrator.

## 8. External Hooks
- **App Check Enforcement**: Enforces Firebase App Check verification on all callable function triggers unless running in the Firebase Emulator environment (Inferred) `` `call_expression|organization|functions/src/modules/organization/modules/organization_pending/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

## 9. Open Questions
- **Firestore Schema Mapping**: The `/organizationsPending` collection is not explicitly documented in the provided `firestore-schema.md` map, although it is clearly targeted by `OSKOrganizationPendingController` (Inferred).
- **Street Address Structure**: The exact structure of the `OSKStreetAddress` type is imported from `core` but its fields are not fully detailed in this capability's pack (Inferred).
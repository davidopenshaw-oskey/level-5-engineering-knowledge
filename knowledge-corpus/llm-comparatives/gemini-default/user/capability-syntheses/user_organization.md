## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.578Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_organization
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `user_organization` capability manages the relationships, invitations, and requests between users and organizations within the Oskey platform [Confirmed]. It provides the business logic and API endpoints for users to retrieve pending organization invitations, accept or reject those invitations, and manage their associated organization profiles and requests [Confirmed].

---

## 2. Primary Responsibilities

### Accepting Organization Invitations [Confirmed]
- **Orchestration**: When a user accepts an organization invitation, the system executes a multi-step transaction via `OSKUserOrganizationInvitationService.userOrganizationInvitationAccepted` `` `service_method|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationService|userOrganizationInvitationAccepted|#1` ``.
- **Verification**: It verifies that the user and organization exist, and that the invitation is approved `` `functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts` (lines 74-126) ``.
- **Role Consolidation**: It generates consolidated organization user roles using `OSKConsolidatedRolesController.generateOrganizationUserRoles` `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKConsolidatedRolesController.default.generateOrganizationUserRoles|userOrganizationInvitationAccepted|organizationInvitation.roles,organization.userRoles,...|#1` ``.
- **Data Synchronization**: It saves the organization mapping to the user's profile `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationController.default.save|userOrganizationInvitationAccepted|user.userId,request.organizationId,userOrganization|#1` `` and adds the user to the organization's user list `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserController.default.save|userOrganizationInvitationAccepted|request.organizationId,user.userId,organizationUser|#1` ``.
- **Cleanup**: It deletes the pending invitation from both the user's pending list `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationPendingController.default.deleteUsersOrganizationInvitation|userOrganizationInvitationAccepted|user.userId,request.organizationId|#1` `` and the organization's invitation list `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationAccepted|request.organizationId,userInvitation.email|#1` ``.

### Rejecting Organization Invitations [Confirmed]
- **Orchestration**: Handled via `OSKUserOrganizationInvitationService.userOrganizationInvitationRejected` `` `service_method|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationService|userOrganizationInvitationRejected|#1` ``.
- **Data Migration**: It moves the organization's invitation record to a cancelled/rejected state `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.moveOrganizationUserInvitation|userOrganizationInvitationRejected|request.organizationId,findUsersInvitation.email,findOrganizationsInvitation|#1` ``.
- **Cleanup**: It deletes the pending invitation from the user's collection `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationPendingController.default.deleteUsersOrganizationInvitation|userOrganizationInvitationRejected|findUser.userId,request.organizationId|#1` `` and deletes the active invitation from the organization's collection `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationRejected|request.organizationId,findUsersInvitation.email|#1` ``.

### Retrieving Pending Invitations [Confirmed]
- Allows users to query all pending organization invitations assigned to them `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._query|getAllInvitations|`/users/${userId}/organizationInvitations`|#1` ``.

### Managing User Organization Requests [Confirmed]
- Provides endpoints to retrieve and save requests made by users to join organizations `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts` (lines 17-30) ``.

### Managing User Organizations [Confirmed]
- Provides standard CRUD operations (get, getAll, save, update, delete) for managing the organizations a user is currently associated with `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``.

---

## 3. Public Interfaces (Controllers & Entry Points)

This capability exposes the following controllers and services as public entry points:

### Controllers [Confirmed]
- **`OSKUserOrganizationInvitationPendingController`** `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController` ``: Inherits from `OSKDocumentController` and manages documents under `/users/${userId}/organizationInvitations` `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._query|getAllInvitations|`/users/${userId}/organizationInvitations`|#1` ``.
- **`OSKUserOrganizationRequestController`** `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController` ``: Inherits from `OSKDocumentController` and manages documents under `/users/${userId}/organizationRequests` `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController.default._get|get|`/users/${userId}/organizationRequests`,organizationId|#1` ``.
- **`OSKUserOrganizationController`** `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts|OSKUserOrganizationController` ``: Inherits from `OSKDocumentController` and manages documents under `/users/${userId}/organizations` `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts|OSKUserOrganizationController.default._query|getAll|`/users/${userId}/organizations`|#1` ``.

### Services [Confirmed]
- **`OSKUserOrganizationInvitationService`** `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationService` ``: Orchestrates the business workflows for retrieving, accepting, and rejecting organization invitations.
- **`OSKUserOrganizationRequestService`** `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_request.service.ts|OSKUserOrganizationRequestService` ``: Service layer for managing user organization requests.
- **`OSKUserOrganizationService`** `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization.service.ts|OSKUserOrganizationService` ``: Service layer for managing user organizations.

---

## 4. API Contracts & Firestore Triggers

### Callable HTTPS Functions [Confirmed]
These entry points are exposed as Firebase Callable Functions `` `functions/src/modules/user/modules/user_organization/index.ts` (lines 50-63) ``:

#### `getCurrentUserOrganizationInvitations`
- **Method**: `callable` `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|getCurrentUserOrganizationInvitations|#1` ``
- **Handler**: `OSKUserOrganizationInvitationService.getCurrentUserOrganizationInvitations`

#### `userOrganizationInvitationAccepted`
- **Method**: `callable` `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|userOrganizationInvitationAccepted|#1` ``
- **Request Schema**: `OSKUserOrganizationInvitationPendingRequest`
  - `isApproved`: `boolean`
  - `organizationId`: `string`
  - `userId`: `string`

#### `userOrganizationInvitationRejected`
- **Method**: `callable` `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|userOrganizationInvitationRejected|#1` ``
- **Request Schema**: `OSKUserOrganizationInvitationPendingRequest`
  - `isApproved`: `boolean`
  - `organizationId`: `string`
  - `userId`: `string`

### Firestore Triggers [Confirmed]
- No Firestore triggers are owned or declared by this capability.

---

## 5. Data Ownership

This capability owns and performs read/write operations on the following Firestore paths:

### `/users/{userId}/organizationInvitations/{organizationId}` [Confirmed]
- **Description**: Stores pending organization invitations sent to a user.
- **Operations**: Read, Query, Delete `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts` (lines 18-39) ``.

### `/users/{userId}/organizationRequests/{organizationId}` [Confirmed]
- **Description**: Stores requests made by a user to join an organization.
- **Operations**: Read, Write (`_set`) `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts` (lines 17-30) ``.

### `/users/{userId}/organizations/{organizationId}` [Confirmed]
- **Description**: Maps the organizations a user belongs to, including their roles.
- **Operations**: Read, Query, Write (`_set`), Update, Delete `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``.

---

## 6. Outbound Coupling

This capability depends on other modules and submodules as evidenced by its imports:

### Cross-Module Coupling [Confirmed]
- **`core`**:
  - Imports `OSKDocumentController` from `@oskey/core/controllers/document` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|@oskey/core/controllers/document|#1` ``.
  - Imports logging utilities from `@oskey/core/logger` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/core/logger|#1` ``.
- **`organization`**:
  - Imports `OSKOrganizationController` from `@oskey/organization` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/organization|#1` ``.
  - Imports `OSKOrganizationUserController` from `@oskey/organization/user` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/organization/user|#1` ``.
  - Imports `OSKOrganizationUserInvitationController` from `@oskey/organization/user/invitation` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/organization/user/invitation|#1` ``.
- **`settings`**:
  - Imports `OSKConsolidatedRolesController` from `@oskey/settings/role` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/settings/role|#1` ``.

### Intra-Module Coupling (Sibling Submodules) [Confirmed]
- **`user` (root)**:
  - Imports `OSKUserController` from `@oskey/user` `` `imports_dependency|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|@oskey/user|#1` ``.

---

## 7. Permissions & Security

### App Check Verification [Confirmed]
- All callable entry points enforce App Check verification in non-emulator environments to prevent unauthorized client calls `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

### Firestore Rules Cross-Check [Confirmed]
The security rules defined in `firestore.rules.txt` align with the data paths accessed by this capability:
- **`/users/{userId}/organizationInvitations/{invitationId}`**:
  - `allow read: if (isAuthenticatedUser(userId));`
- **`/users/{userId}/organizations/{organizationId}`**:
  - `allow read: if (isAuthenticatedUser(userId) && !isUserAccountDeleted());`
- **`/users/{userId}/settings/{settingsId}`**:
  - `allow read: if (isSignedIn() && isUser(userId) && !isUserAccountDeleted());`

---

## 8. External Hooks

- **Environment Variables**: Uses `process.env.OSK_FIREBASE_EMULATOR` to conditionally bypass App Check during local development/testing `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.
- No other external hooks (Pub/Sub topics, external HTTP endpoints, or storage paths) are evidenced within this capability's pack.

---

## 9. Open Questions

- **Notification Dispatch**: Does accepting or rejecting an invitation trigger any push notifications or emails to the organization administrators or the inviting user? There is no evidence of notification dispatch within this capability pack.
- **`OSKUserOrganizationRequestService` Usage**: While `OSKUserOrganizationRequestService` is declared as an exported class, there are no explicit method calls or references to it in the provided evidence pack. Its exact role in processing requests remains unevidenced.
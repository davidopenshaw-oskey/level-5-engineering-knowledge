# Capability Synthesis — user_invitation

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.567Z
- **repoName**: firebase-oskey-dev
- **targetModule**: user
- **capability**: user_invitation
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `user_invitation` capability manages the lifecycle of user-to-user and external invitations (creation, editing, deletion, acceptance, rejection, and cancellation) within the Oskey Access Platform. [Confirmed] It acts as the bridge between user-initiated invitations and the downstream provisioning of physical building/unit access rights and notification dispatches. [Confirmed]

## 2. Primary Responsibilities

### Invitation Creation
- **Creating User Invitations**: Handles the creation of user invitations (`createUserInvitation`) by validating access rights, constructing the sent invitation document, and saving it to the database. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|createUserInvitation|#1` ``
- **Constructing Sent Invitation Objects**: Builds the canonical invitation payload (`constructUserInvitationSentObject`), enriching it with building details, unit details, and converted access right timestamps. [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts|OSKUserInvitationCreationService|constructUserInvitationSentObject|#1` ``
- **Processing Invitees**: Iterates through invitees (`processInvitee`) to determine if they are existing users or external users, saving received invitations for existing users and creating external user invitations for others. [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts|OSKUserInvitationCreationService|processInvitee|#1` ``

### Invitation Acceptance & Rejection
- **Accepting Invitations**: Processes invitee acceptance (`inviteeAcceptsInvitation`), which triggers the creation of physical access rights (`OSKAccessService.createAccess`), adds the user as an inhabitant to the building unit (`OSKBuildingUnitInhabitantService.addInhabitant`), and updates the invitation status to `accepted`. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeAcceptsInvitation|#1` ``
- **Rejecting Invitations**: Processes invitee rejection (`inviteeRejectsInvitation`), updating the status of the invitee to `rejected` across the user's received invitations and the sender's sent invitations. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeRejectsInvitation|#1` ``

### Invitation Cancellation & Deletion
- **Cancelling Invitations**: Allows the inviter to cancel a pending invitation (`inviterCancelsInvitation`), which revokes any provisioned access rights (`OSKAccessService.deleteAccessById`) and updates the status to `cancelled`. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviterCancelsInvitation|#1` ``
- **Deleting Invitations**: Handles the deletion of invitations (`deleteInvitation`), distinguishing between sent and received invitations, and cleaning up associated accesses and pincodes. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|deleteInvitation|#1` ``

### External User Invitation Processing
- **Onboarding Resolution**: Automatically processes pending external user invitations (`processExternalUserInvitations`) and onboarding cards (`_processOnboardingCards`) when a new user registers. [Confirmed] It matches the user's verified email or phone number against pending invitations to automatically onboard them to units and grant access. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|processExternalUserInvitations|#1` ``

### Invitation Retrieval
- **Fetching Invitations**: Retrieves all sent and received invitations associated with a user (`onGetAllInvitationsByUser`), supporting pagination and category filtering. [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|onGetAllInvitationsByUser|#1` ``

## 3. Public Interfaces (Controllers & Entry Points)

The capability exposes the following document controllers as its primary entry points:

- **`OSKUserInvitationBuildingController`** (extends `OSKDocumentController`): Manages building-level unit invitations stored under the path `/buildings/{buildingId}/units/{unitId}/invitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (lines 16-20) ``
- **`OSKUserInvitationExternalUserController`** (extends `OSKDocumentController`): Manages external user invitations stored under the collection `externalUserInvitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (lines 8-13) ``
- **`OSKUserInvitationController`** (extends `OSKDocumentController`): Manages received user invitations stored under the path `/users/{userId}/invitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (lines 15-19) ``
- **`OSKUserSentInvitationController`** (extends `OSKDocumentController`): Manages sent user invitations stored under the path `/users/{userId}/sentInvitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (lines 12-16) ``

## 4. API Contracts & Firestore Triggers

### API Contracts (Callable Cloud Functions)

#### `createUserInvitation`
- **Request Schema**: `OSKUserInvitationCreateRequest`
  - `buildingId`: `string`
  - `invitation`: `OSKUserInvitationSentRequest`
  - `unitId`: `string`
- **Response Schema**: `void` (Implicit)

#### `deleteInvitation`
- **Request Schema**: `OSKUserInvitationDeleteRequest`
  - `buildingId`: `string`
  - `invitationId`: `string`
  - `invitationType`: `OSKUserInvitationType`
  - `unitId`: `string`
- **Response Schema**: `void` (Implicit)

#### `editInvitation`
- **Request Schema**: `OSKUserInvitationUpdateRequest`
  - `invitation`: `Omit<OSKUserInvitationSent, "accessRights"> & { accessRights: OSKAccessRightWithDates[]; }`
- **Response Schema**: `void` (Implicit)

#### `getExternalUserInvitation`
- **Request Schema**: `OSKUserExternalUserRequestGet`
  - `phoneOrEmail`: `string`
- **Response Schema**: `void` (Implicit)

#### `inviteeAcceptsInvitation`
- **Request Schema**: `OSKInvitationReplyRequest`
  - `buildingId`: `string`
  - `invitationId`: `string`
  - `unitId`: `string`
  - `userId`: `string | undefined` (optional)
- **Response Schema**: `void` (Implicit)

#### `inviteeRejectsInvitation`
- **Request Schema**: `OSKInvitationReplyRequest`
  - `buildingId`: `string`
  - `invitationId`: `string`
  - `unitId`: `string`
  - `userId`: `string | undefined` (optional)
- **Response Schema**: `void` (Implicit)

#### `inviterCancelsInvitation`
- **Request Schema**: `OSKInvitationReplyRequest`
  - `buildingId`: `string`
  - `invitationId`: `string`
  - `unitId`: `string`
  - `userId`: `string | undefined` (optional)
- **Response Schema**: `void` (Implicit)

#### `onGetAllInvitationsByUser`
- **Request Schema**: `OSKUserInvitationGetAllRequest`
  - `category`: `OSKInvitationCategory | undefined` (optional)
  - `nextPageToken`: `string | undefined` (optional)
  - `pageSize`: `number | undefined` (optional)
  - `userId`: `string`
- **Response Schema**: `OSKUserInvitationGetAllResponse`
  - `items`: `OSKUserInvitationGetList[]`
  - `nextPageToken`: `string | undefined` (optional)

#### `processExternalUserInvitations`
- **Request Schema**: `OSKUserProcessExternalUserInvitationsRequest`
  - `userId`: `string`
- **Response Schema**: `OSKUserProcessExternalUserInvitationsResponse`
  - `guestInvitations`: `OSKUserInvitationSent[]`
  - `onboardingResults`: `OSKInhabitantOnboardedResult[]`
  - `unitInvitations`: `OSKUnitInvitation[]`
  - `userId`: `string`

### Firestore Triggers
No Firestore triggers are owned or declared by this capability. [Confirmed]

## 5. Data Ownership

This capability owns and performs direct read/write operations on the following Firestore paths:

- **`/users/{userId}/sentInvitations`**: Stores invitations sent by a specific user. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (line 20) ``
- **`/users/{userId}/invitations`**: Stores invitations received by a specific user. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (line 27) ``
- **`/buildings/{buildingId}/units/{unitId}/invitations`**: Stores invitations associated with a specific building unit. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (line 34) ``
- **`externalUserInvitations`**: Root collection storing invitations for users who have not yet registered on the platform. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (line 17) ``

## 6. Outbound Coupling

### Intra-Module Coupling (Sibling Submodules)
- **`user_access`**: Used to reference and validate user access document types. [Confirmed]
  - *Evidence*: Imports `@oskey/user/access` in `user_invitation_document.model.ts` (line 11).
- **`user_notification`**: Used to create user-specific notifications when invitations are processed. [Confirmed]
  - *Evidence*: Imports `@oskey/user/notification` in `user_invitation_external_user.service.ts` (line 43).
- **`user_pincode`**: Used to retrieve pincodes associated with user access. [Confirmed]
  - *Evidence*: Imports `@oskey/user/pincode` in `user_invitation_external_user.service.ts` (line 44).
- **`user` (Root)**: Uses the root user controller to query and retrieve user profiles. [Confirmed]
  - *Evidence*: Imports `../../../controllers/user.controller` in `user_invitation_creation.service.ts` (line 10).

### Cross-Module Coupling
- **`core`**: Extends core document controllers and utilizes core access models, dates utilities, and logging services. [Confirmed]
  - *Evidence*: Imports `@oskey/core/controllers/document`, `@oskey/core/access`, and `@oskey/core/logger` across multiple files.
- **`building`**: Resolves building, unit, and door details during invitation creation and acceptance. [Confirmed]
  - *Evidence*: Imports `@oskey/building/door`, `@oskey/building/unit`, and `@oskey/building` across multiple files.
- **`unit_management`**: Consumes and processes unit invitations during external user onboarding. [Confirmed]
  - *Evidence*: Imports `@oskey/unit/management` in `user_invitation_external_user.service.ts` (line 16).
- **`apps`**: Dispatches push notifications to users. [Confirmed]
  - *Evidence*: Imports `@oskey/apps/notification` in `user_invitation_external_user.service.ts` (line 5).
- **`settings`**: Retrieves App Store settings to include download links in invitation communications. [Confirmed]
  - *Evidence*: Imports `@oskey/settings/appstore` in `user_invitation_external_user.service.ts` (line 15).
- **`organization`**: Interacts with organization residents and onboarding flows during external user matching. [Confirmed]
  - *Evidence*: Imports `@oskey/organization/residents` and `@oskey/organization/user/onboarding/inhabitant` in `user_invitation_external_user.service.ts` (lines 37, 10).

## 7. Permissions & Security

- **Callable Security Checks**: The callable entry points utilize the `@OSKUserSecurityChecks` decorator to enforce authentication and context validation. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (line 184) ``
- **App Check Verification**: Critical services (such as acceptance, rejection, and cancellation) enforce that the request originates from an App Check verified application, logging errors if verification fails. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 29) ``
- **RBAC Roles**: No explicit RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`) are directly referenced in the provided evidence pack for this capability. [Confirmed]

## 8. External Hooks

- **App Store Integration**: Retrieves Apple and Google store details via `OSKAppStoreSettingsService.getAppstoreInformation` to include in invitation communications. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (line 85) ``
- **Notification Dispatch**: Integrates with `OSKNotificationService` and `OSKUserNotificationService` to send push notifications, emails, or SMS to users when invitations are created or processed. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (line 115) ``

## 9. Open Questions

- **Invitation Expiration**: Is there an automatic background cleanup task or TTL index on the `externalUserInvitations` collection to prune expired or stale invitations? [Unknown]
- **Communication Templates**: How are email and SMS templates managed for invitation dispatch? The evidence shows calls to `OSKNotificationService` but not the template resolution logic. [Unknown]
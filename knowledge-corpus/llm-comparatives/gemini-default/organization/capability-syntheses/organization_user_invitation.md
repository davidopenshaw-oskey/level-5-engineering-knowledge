# Capability Synthesis: organization_user_invitation

## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.513Z
- **repoName**: firebase-oskey-dev
- **targetModule**: organization
- **capability**: organization_user_invitation
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

## 1. Capability Summary
The `organization_user_invitation` capability manages the lifecycle of invitations sent to users to join an organization (specifically Property Management Portal / PMP users) [Confirmed]. This includes creating, querying, processing, and cancelling invitations, as well as coordinating with external identity providers (Auth0) and email dispatch systems [Confirmed]. This capability is defined across callable entry points in `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (lines 47-737).

## 2. Primary Responsibilities

### Inviting Users to an Organization
- **Standard User Invitation**: Handles inviting a standard user to an organization by validating parameters, checking permissions, and saving the invitation document [Confirmed]. This is managed by `inviteUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 117-256).
- **PMP User Invitation**: Handles inviting a Property Management Portal (PMP) user to an organization [Confirmed]. This is managed by `invitePMPUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 258-394).
- **Creating PMP User with Invitation**: Creates or updates a PMP user invitation, checks if the email already exists in Auth0, and triggers an invitation email if the user does not exist [Confirmed]. This is managed by `createPMPUserWithInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 396-570).

### Processing Invitations
- **Process PMP Invitation**: Processes a pending PMP invitation when a user accepts it [Confirmed]. It fetches the invitation and organization details, generates the consolidated organization user roles, saves the user-organization mapping, and deletes the pending invitation [Confirmed]. This is managed by `processPMPInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 620-737).

### Cancelling Invitations
- **Cancel User Invitation**: Cancels a pending invitation, moving it to a cancelled collection, deleting the pending record, and logging the cancellation [Confirmed]. This is managed by `cancelUsersInvitation` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 47-115).

### Querying Invitations
- **Query PMP Invitations**: Queries pending invitations for a user based on their email or phone number [Confirmed]. This is managed by `queryPMPInvitations` in `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 572-618).

## 3. Public Interfaces (Controllers & Entry Points)

This capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKOrganizationPMPUserInvitationController`** (extends `OSKDocumentController`): Exposes methods to query collection groups for PMP user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts` (lines 10-24)
- **`OSKOrganizationUserInvitationPendingController`** (extends `OSKDocumentController`): Exposes methods to save pending user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation_pending.controller.ts` (lines 11-23)
- **`OSKOrganizationUserInvitationController`** (extends `OSKDocumentController`): Exposes methods to save, delete, update, and move user invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_user_invitation.controller.ts` (lines 15-106)

### Services
- **`OSKOrganizationUserInvitationService`**: The core service orchestrating the business logic for invitations [Confirmed].
  - *File*: `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts` (lines 44-737)

## 4. API Contracts & Firestore Triggers

### Callable Functions
The capability exposes the following Firebase Callable Functions [Confirmed]:

#### `cancelUsersInvitation`
- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `createPMPUserWithInvitation`
- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber`
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `invitePMPUserWithInvitation`
- **Request Type**: `OSKOrganizationPMPUserInvitationRequest`
  - `adminOrganizationId`: `string`
  - `adminOrganizationName`: `string`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `organizationName`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `inviteUserWithInvitation`
- **Request Type**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `processPMPInvitation`
- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `queryPMPInvitations`
- **Request Type**: `void` [Inferred]
- **Response Type**: `Promise<OSKOrganizationPMPUserInvitation[]>` [Inferred]

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

## 5. Data Ownership

This capability reads and writes to the following Firestore paths [Confirmed]:

| Firestore Path | Operations | Scope / Context |
| :--- | :--- | :--- |
| `/organizations/${organizationId}/userInvitations` | Read, Write, Delete | Standard user invitations [Confirmed] |
| `/organizations/${organizationId}/userInvitationsCancelled` | Write | Cancelled user invitations [Confirmed] |
| `/organizations/${organizationId}/userInvitationsRejected` | Write | Rejected user invitations [Confirmed] |
| `/users/${userId}/organizationInvitations/` | Read, Write | Pending user invitations mapped to a user [Confirmed] |

## 6. Outbound Coupling

This capability depends on the following external modules and submodules [Confirmed]:

### Cross-Module Coupling
- **`core` module**:
  - `@oskey/core` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts`)
  - `@oskey/core/controllers/document` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/controllers/organization_pmp_user_invitation.controller.ts`)
  - `@oskey/core/access` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
  - `@oskey/core/logger` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
- **`apps` module**:
  - `@oskey/apps/mail` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
- **`building` module**:
  - `@oskey/building/door` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
- **`settings` module**:
  - `@oskey/settings/role` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
- **`user` module**:
  - `@oskey/user/access` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
  - `@oskey/user/organization` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
  - `@oskey/user` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)

### Intra-Module Cross-Submodule Coupling
- **`organization_user` submodule**:
  - `../../organization_user/controllers/organization_user.controller` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
  - `../../organization_user/models/documents/organization_user_document.model` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)
- **`organization` root/other submodules**:
  - `@oskey/organization` (e.g., `functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts`)

## 7. Permissions & Security

The capability references and enforces the following permission strings [Confirmed]:

- **`v1.admin.org.validate`**: Used to validate organization-level operations [Confirmed]. Matches the RBAC roles document ("v1.admin - Allows to validate a new organization") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.admin.org.validate|#1` ``
- **`v1.org.user.create`**: Used to authorize the creation of organization users and invitations [Confirmed]. Matches the RBAC roles document ("Allows to add a new user to the Oskey Property Management Portal") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.create|#1` ``
- **`v1.org.user.delete`**: Used to authorize the deletion or cancellation of organization users and invitations [Confirmed]. Matches the RBAC roles document ("Allows to delete an Oskey Property Management Portal user") [Confirmed].
  - *Citations*: `` `permission_candidate|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|v1.org.user.delete|#1` ``

## 8. External Hooks

This capability interacts with the following external boundaries and candidate integrations [Confirmed]:

### Environment Variables
- **`process.env.OSK_FIREBASE_EMULATOR`**: Used to conditionally enforce App Check depending on whether the emulator is running [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``
- **`process.env.PMP_PORTAL_URL`**: Used to construct the portal URL sent in invitation emails [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|{                     language: sender.settings.global.language,                     template: {                         id: 'pmpUserInvitation',                         params: {                             recipientName: \`\${request.firstName} \${request.lastName}\`,                             recipientEmail: email,                             inviterName: \`\${sender.publicProfile.firstName} \${sender.publicProfile.lastName}\`,                             organizationName: senderOrganization.name \|\| '',                             portalUrl: process.env.PMP_PORTAL_URL \|\| 'https://oskey.io',                         },                     },                 }|#1` ``

### External Services
- **Auth0 Integration**: Integrates with Auth0 via `OSKAuth0Service` to check if an email already exists in the identity provider [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKAuth0Service.emailExistsInAuth0|createPMPUserWithInvitation|email|#1` ``
- **Email Dispatch**: Integrates with `OSKEmailService` to send out invitation emails using the `pmpUserInvitation` template [Confirmed].
  - *Citations*: `` `call_expression|organization|functions/src/modules/organization/modules/organization_user_invitation/services/organization_user_invitation.service.ts|OSKEmailService.default.send|createPMPUserWithInvitation|{                     language: sender.settings.global.language,                     template: {                         id: 'pmpUserInvitation',                         params: {                             recipientName: \`\${request.firstName} \${request.lastName}\`,                             recipientEmail: email,                             inviterName: \`\${sender.publicProfile.firstName} \${sender.publicProfile.lastName}\`,                             organizationName: senderOrganization.name \|\| '',                             portalUrl: process.env.PMP_PORTAL_URL \|\| 'https://oskey.io',                         },                     },                 }|#1` ``

## 9. Open Questions

- **Auth0 Syncing**: It is unclear from the evidence how Auth0 user creation is synchronized back to the Firestore `/users` collection when a user accepts an invitation, as this capability only checks for email existence and deletes the pending invitation document [Unknown].
- **Email Templates**: The exact layout and configuration of the `pmpUserInvitation` email template are managed externally and not detailed in this capability's pack [Unknown].
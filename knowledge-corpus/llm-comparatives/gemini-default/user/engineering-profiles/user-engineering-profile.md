### 0. Generation Metadata

- **runId**: `20260803_143350-1aa319b1`
- **generatedAt**: `2026-08-11T17:19:13.352Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `user`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `user` module serves as the central identity, profile, and credential orchestrator for the Oskey Access Platform. It bridges external Auth0 identities with internal hierarchical access scopes (organizations, buildings, and units) by managing the lifecycle of user profiles, registered mobile/wearable devices, and communication channels. Additionally, the module coordinates user-scoped access permissions, call logs, activity histories, and alphanumeric PIN codes, executing comprehensive deletion cascades to maintain strict data privacy and compliance across the platform. **Confirmed**.

### 2. Architectural Position

The `user` module sits at the foundational layer of the platform's backend architecture, acting as the authoritative system of record for all user-centric concepts. It owns the root `/users/{userId}` Firestore path and all nested subcollections. It provides critical identity-mapping and credential-provisioning capabilities to other core modules (such as `building`, `organization`, `unit_management`, and `access_control_device`), ensuring that physical access rights and real-time intercom routing tables are bound to cryptographically verified user profiles. **Confirmed**.

### 3. Primary Responsibilities

#### _module_root

### User Account Creation & Onboarding
- **Auth Triggered Creation**: When a user registers via Firebase Auth, the `onAccountCreated` trigger is executed, which creates the canonical user document in Firestore `/users/{userId}` `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1` ``.
- **Profile Parsing & Defaults**: The onboarding flow parses display names from social providers (e.g., Apple, Google, Microsoft) and initializes default user settings and notification preferences `` `functions/src/modules/user/services/user.service.ts` (lines 444-536) ``. [Confirmed]

### User Profile & Document Lifecycle
- **Firestore Triggers**: Listens to document creation and updates on `/users/{userId}` `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1` ``.
- **Public Profile Cascade**: When a user's public profile (first name or last name) is updated, the system cascades these changes to update Firebase Auth display names, building accesses, building users, organization users, and unit inhabitants `` `functions/src/modules/user/services/user.service.ts` (lines 538-629) ``. [Confirmed]

### Phone Number Verification & Updates
- **Twilio Verify Integration**: Initiates phone number changes by sending a verification SMS via Twilio Verify `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiatePhoneNumberChange|#1` ``.
- **Verification & Completion**: Verifies the OTP code and completes the change by updating the phone number in Auth0 and Firestore `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompletePhoneNumberChange|#1` ``. [Confirmed]

### Email Verification & Updates
- **OTP Generation**: Initiates email changes by generating a secure 6-digit verification code, saving it to a temporary document, and sending an email to the new address `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiateEmailChange|#1` ``.
- **Verification & Completion**: Verifies the code, updates the email in Auth0, updates Firebase Auth, and updates the Firestore user document `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompleteEmailChange|#1` ``. [Confirmed]

### Account Deletion Cascade
- **Deletion Request**: Allows users to request account deletion, which sets a future `accountDeletionDate` (typically 30 days out) on their document `` `controller_method|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController|setAccountDeletionDate|#1` ``.
- **Scheduled Cleanup**: A daily cron job triggers `onDeleteAccount` to clean up expired accounts `` `call_expression|user|functions/src/modules/user/index.ts|OSKUserService.onDeleteAccount|getScheduledFunctionTriggers||#1` ``.
- **Cascade Execution**: When a user is deleted from Firebase Auth, the `onAccountDeleted` trigger executes a comprehensive cascade: deleting Auth0 profiles, cleaning up Google Cloud Storage folders, deleting sub-collections (devices, invitations, calls, settings, activities, accesses, pincodes, intercoms), and removing the user from building/unit inhabitants `` `functions/src/modules/user/services/user.service.ts` (lines 1336-1443) ``. [Confirmed]

### Inhabitant Type Resolution
- **Type Lookup**: Resolves the specific inhabitant type of a user within a building and unit context `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getInhabitantType|#1` ``. [Confirmed]

### User Lookup
- **Email/Phone Query**: Allows looking up user IDs by email or phone number, checking for duplicates across the platform `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getUserIdsByEmailOrPhone|#1` ``. [Confirmed]

### Unread Notification Count
- **Transactional Updates**: Increments and decrements the unread notification count on the user document using Firestore transactions `` `controller_method|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController|incrementUnreadNotificationCount|#1` ``. [Confirmed]

#### user_access

### Managing User Accesses per Building
- Storing, updating, and deleting structured access records for a user within a specific building scope. (**Confirmed**; `` `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController` ``)
- Providing safe retrieval of building-specific user accesses. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController.default.getPerBuilding|getPerBuildingSafe|userId,buildingId|#1` ``)

### Managing User Building Unit Mappings
- Tracking which units a user is associated with in a building, along with their specific roles (e.g., resident, owner, guest). (**Confirmed**; `` `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController` ``)
- Supporting creation, deletion, and listing of user-to-building-unit documents. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController.default._create|create|`/users/${userId}/buildings/${buildingId}/units`,unitId,data|#1` ``)

### Access Setup and Orchestration
- Processing incoming access options and translating them into structured `OSKAccess` records. (**Confirmed**; `` `service_method|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|OSKUserAccessService|setupUserAccess|#1` ``)
- Generating unique access IDs and resolving inviter names during access setup. (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|OSKAccessUtilsService.generateAccessId|setupUserAccess||#1` ``)

### Type Validation for Access Types
- Validating different access types using runtime type guards (e.g., `isTypeOSKInhabitantAccess`, `isTypeOSKGuestAccess`, `isTypeOSKQuickcodeAccess`, `isTypeOSKNonAppUserAccess`, `isTypeOSKSupplierStaffAccess`). (**Confirmed**; `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 130-292))

---

#### user_activity

*   **Ingesting and Saving User Activities**: Processes incoming activity events for a specific user, enriching them and persisting them as individual activity documents [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService|ActivityReceivedForUser|#1` ``.
*   **Aggregating User Activities**: Maintains a rolling 30-day aggregate of user activities (including calls and door access events) per building, filtering out older entries to optimize mobile client synchronization [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts|OSKUserActivityAggregatesService|ActivityReceivedForUser|#1` ``.
*   **Retrieving Activity Logs**: Exposes endpoints to fetch a single activity by ID [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityById|#1` `` or retrieve all activities for a user [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getAllUserActivities|#1` ``.
*   **Retrieving Activity Aggregates**: Allows fetching aggregated activities filtered by building ID [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityByBuildingId|#1` ``.
*   **Deleting Activity History**: Provides capabilities to delete a specific activity record [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|delete|#1` `` or clear all activity history for a user [Confirmed] `` `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|deleteAll|#1` ``.
*   **Enforcing User-Scoped Security**: Restricts access to activity data using the `OSKUserSecurityChecks` decorator to ensure users can only query or delete their own logs [Confirmed] `` `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54-95) ``.

#### user_call

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

#### user_device

- **User Device Management**: Handles CRUD operations (saving, deleting, listing, and retrieving) for user devices under the `/users/{userId}/devices/{deviceId}` path `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 19-47). [Confirmed]
- **Access Control Device (ACD) Token Provisioning**: Generates and manages SecureBLE tokens (`OSKUserDeviceAccessControlDeviceToken`) for user devices to allow offline door unlocking `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 169-235). [Confirmed]
- **Access Synchronization**: Listens to Firestore document changes on user devices (`onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`) and triggers downstream updates to refresh user access devices via `OSKAccessUpdateService.updateUserAccessDevices` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 73-167). [Confirmed]
- **Cryptographic Token Signing**: Signs SecureBLE tokens using the building's ACD private key retrieved from `OSKSecretService` and the `OSKAccessControlDeviceTokenPayload` model `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 180-224). [Confirmed]
- **Security & Parameter Validation**: Enforces security boundaries and validates parameters for incoming requests using `OSKUserSecurityChecks` and `OSKSecurityChecks.checkParameters` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 38-71). [Confirmed]

---

#### user_intercoms

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

#### user_invitation

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

#### user_notification

### Notification Token Management
- **Token Registration & Updates**: Inserts or updates FCM registration tokens for users under `/users/{userId}/notificationTokens/{tokenId}` [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onInsertOrUpdateNotificationToken|#1` ``).
- **FCM Token Uniqueness**: Ensures that Android FCM tokens are unique across the user's registered tokens by querying existing tokens and deleting duplicates before saving a new one [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|notificationTokenList.map|onInsertOrUpdateNotificationToken|async (notificationToken) => { ... }|#1` ``).
- **Token Deletion**: Deletes registered notification tokens when a user logs out or prunes a device [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onDeleteNotificationToken|#1` ``).

### Notification Document Lifecycle & State
- **Notification Creation**: Saves notification documents to Firestore under `/users/{userId}/notifications/{notificationId}` [Confirmed] (`` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` ``).
- **Unread Count Synchronization**: Listens to Firestore document updates and deletions on `/users/{userId}/notifications/{notificationId}` to dynamically increment or decrement the user's `unreadNotificationCount` [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``, `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``).

### Test Notifications
- **Triggering Test Notifications**: Provides a callable endpoint to trigger a test notification for a specific user to verify push notification delivery [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onTestNotification|#1` ``).

#### user_organization

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

#### user_pincode

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

#### user_settings

### User Building Settings Management
- **Creation**: Provisions a new user building settings document containing default or customized parameters for a user within a specific building `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|createUserSettingsBuilding|#1` ``.
- **Retrieval**: Fetches a single user building settings document by building ID `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|getUserSettingsBuilding|#1` `` or queries all building settings associated with a specific user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|getAllUserSettingsBuilding|#1` ``.
- **Modification**: Updates specific fields of a user's building settings document based on a partial input payload `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|updateUserSettingsBuilding|#1` ``.
- **Deletion**: Removes building-level settings documents for a user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|deleteUserSettingsBuilding|#1` ``.

### User Unit Settings Management
- **Creation**: Provisions unit-level settings for a user within a specific building unit `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingUnit|#1` ``.
- **Automatic Provisioning**: Automatically generates user unit settings when an inhabitant is created, mapping settings based on the inhabitant's type (e.g., Resident, Tenant) `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingsUnitFromInhabitant|#1` ``.
- **Retrieval**: Fetches unit settings for a specific user, building, and unit `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|getUserSettingUnit|#1` `` or lists all unit settings for a user within a building `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|getAllUserSettingsUnit|#1` ``.
- **Modification**: Updates unit-level settings for a user `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|updateUserSettingUnit|#1` ``.
- **Deletion**: Removes unit-level settings documents `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|deleteUserSettingUnit|#1` ``.

### Security and Permission Enforcement
- Validates that the executing user has the necessary administrative permissions (e.g., `v1.org.settings.create`, `v1.org.settings.edit`, `v1.org.settings.view`, `v1.org.settings.delete`) before performing operations on behalf of another user `` `functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` (lines 30-61) ``.
- Enforces user identity matching using security decorators to ensure standard users can only access or modify their own settings `` `call_expression|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSecurityChecks|createUserSettingsBuilding|{ checkUserIdMatch: false }|#1` ``.

---

### 4. Public Interfaces

#### _module_root

The capability exposes the following controllers and services:

- **`OSKUserController`** (`functions/src/modules/user/controllers/user.controller.ts`): Extends `OSKDocumentController` to manage core CRUD operations, unread notification counts, and profile image uploads for the `/users` collection `` `source_class|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController` ``.
- **`OSKEmailChangeController`** (`functions/src/modules/user/controllers/chnageEmail.controller.ts`): Extends `OSKDocumentController` to manage temporary email change verification documents `` `source_class|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|OSKEmailChangeController` ``.
- **`OSKUserService`** (`functions/src/modules/user/services/user.service.ts`): The primary service orchestrating business logic for user profiles, contact changes, and deletion cascades `` `source_class|user|functions/src/modules/user/services/user.service.ts|OSKUserService` ``.

#### user_access

### Controllers
- **`OSKUserAccessesController`** (`functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` line 11): Extends `OSKDocumentController`. Exposes endpoints to get, save, update, and delete user accesses per building.
- **`OSKUserBuildingUnitController`** (`functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` line 14): Extends `OSKDocumentController`. Exposes endpoints to manage user-to-building-unit mappings.

### Services
- **`OSKUserAccessService`** (`functions/src/modules/user/modules/user_access/services/user_access.service.ts` line 32): Provides core business logic for creating, updating, and setting up user accesses.

---

#### user_activity

*   `OSKUserActivitiesController`: Inherits from `OSKDocumentAndMessageController` and manages the direct Firestore operations for individual user activity documents `` `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts|OSKUserActivitiesController` ``.
*   `OSKUserActivityAggregatesController`: Inherits from `OSKDocumentController` and manages Firestore operations for aggregated user activities `` `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts|OSKUserActivityAggregatesController` ``.
*   `OSKUserActivitiesService`: The core service orchestrating individual user activity retrieval, creation, and deletion `` `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService` ``.
*   `OSKUserActivityAggregatesService`: The service orchestrating the aggregation of user activities and retrieval by building ID `` `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts|OSKUserActivityAggregatesService` ``.

#### user_call

This capability exposes the following public entry points and controllers:

- **OSKUserCallController**: A document controller class extending `OSKDocumentController` that handles operations on the user call collection `` `source_class|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController` ``.
- **Module Exports**: The capability exports its controller and model definitions via its main index file `` `functions/src/modules/user/modules/user_call/index.ts` (lines 12-21) ``:
  - `./controllers/user_call.controller` `` `exported_symbol|user|functions/src/modules/user/modules/user_call/index.ts|./controllers/user_call.controller|#1` ``
  - `./models/user_call_document.model` `` `exported_symbol|user|functions/src/modules/user/modules/user_call/index.ts|./models/user_call_document.model|#1` ``

---

#### user_device

- **OSKUserDeviceController**: Extends `OSKDocumentController` to expose standard document operations for user devices `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 12-47). [Confirmed]
- **OSKUserDeviceAccessControlDeviceTokenController**: Extends `OSKDocumentController` to manage the subcollection of access control device tokens for a specific user device `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 11-44). [Confirmed]
- **OSKUserDeviceService**: Orchestrates the business logic for user devices, including callable functions and Firestore trigger handlers `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 35-237). [Confirmed]
- **Callable Functions**:
  - `getDevicesUserList`: Retrieves the list of devices for a user `` `api_contract|user|functions/src/modules/user/modules/user_device/index.ts|getDevicesUserList|#1` ``. [Confirmed]
  - `removeUserDevice`: Removes a registered user device `` `api_contract|user|functions/src/modules/user/modules/user_device/index.ts|removeUserDevice|#1` ``. [Confirmed]

---

#### user_intercoms

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

#### user_invitation

The capability exposes the following document controllers as its primary entry points:

- **`OSKUserInvitationBuildingController`** (extends `OSKDocumentController`): Manages building-level unit invitations stored under the path `/buildings/{buildingId}/units/{unitId}/invitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (lines 16-20) ``
- **`OSKUserInvitationExternalUserController`** (extends `OSKDocumentController`): Manages external user invitations stored under the collection `externalUserInvitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (lines 8-13) ``
- **`OSKUserInvitationController`** (extends `OSKDocumentController`): Manages received user invitations stored under the path `/users/{userId}/invitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (lines 15-19) ``
- **`OSKUserSentInvitationController`** (extends `OSKDocumentController`): Manages sent user invitations stored under the path `/users/{userId}/sentInvitations`. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (lines 12-16) ``

#### user_notification

### Controllers
- **`OSKUserNotificationTokenController`**: Extends `OSKDocumentController` to manage CRUD operations on the `/users/{userId}/notificationTokens` collection [Confirmed] (`` `functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts` (lines 16-50) ``).
- **`OSKUserNotificationController`**: Extends `OSKDocumentController` to manage CRUD operations on the `/users/{userId}/notifications` collection [Confirmed] (`` `functions/src/modules/user/modules/user_notification/controllers/user_notification.controller.ts` (lines 13-48) ``).

### Services & Entry Points
- **`OSKUserNotificationTokenService`**: Exposes the callable Cloud Functions `onInsertOrUpdateNotificationToken` and `onDeleteNotificationToken` [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts` (lines 15-187) ``).
- **`OSKUserNotificationService`**: Orchestrates notification creation, triggers the external notification dispatch service, and handles Firestore triggers [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 21-183) ``).
- **`OSKUserNotificationTestService`**: Exposes the callable Cloud Function `onTestNotification` [Confirmed] (`` `functions/src/modules/user/modules/user_notification/services/user_notification_test.service.ts` (lines 16-71) ``).

#### user_organization

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

#### user_pincode

### `OSKUserPincodeController`
A document controller extending `OSKDocumentController` that exposes low-level Firestore CRUD operations for user pincodes [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController` ``).
- **Methods**: `set`, `get`, `getSafe`, `getAll`, `getAllQuickcodes`, `getByAccessId`, `getByAccessIdSafe`, `delete`, `deleteAll`, `getCollectionPath`, `getSpecificPincodesByQuery` [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` ``).

### `OSKUserPincodeService`
The primary business logic service orchestrating pincode generation, retrieval, and deletion [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService` ``).
- **Methods**: `createPincodeInhabitantDocument`, `createPincodeGuestDocument`, `createPincodePermanentGuestDocument`, `createPincodeAnonymousDocument`, `getAllPincodeStrings`, `onGetUserPincodes`, `deleteUserPincode` [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` ``).

---

#### user_settings

This capability exposes the following controllers and services:

### Controllers
- **`OSKUserSettingsBuildingController`**: Extends `OSKDocumentController` to handle Firestore document operations for building-level settings `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|OSKUserSettingsBuildingController` ``.
- **`OSKUserSettingsUnitController`**: Extends `OSKDocumentController` to handle Firestore document operations for unit-level settings `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts|OSKUserSettingsUnitController` ``.

### Services
- **`OSKUserSettingsBuildingService`**: Orchestrates business logic, parameter validation, and permission checks for building settings `` `source_class|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService` ``.
- **`OSKUserSettingsUnitService`**: Orchestrates business logic, parameter validation, and permission checks for unit settings `` `source_class|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService` ``.

---

### 5. Internal Structure

*Note: This section contains only the cross-submodule coupling analysis derived from AST import resolution.*

The internal topology of the `user` module is structured around a central orchestrator (`_module_root`) and ten specialized submodules. The AST import analysis reveals a highly modularized design with specific, controlled coupling pathways:
- **Central Orchestration**: `_module_root` acts as the primary hub, importing controllers from `user_access`, `user_activity`, `user_call`, `user_device`, `user_invitation`, `user_notification`, `user_organization`, `user_pincode`, and `user_settings` to coordinate cross-cutting user operations (such as profile updates and deletion cascades). **Confirmed**.
- **Invitation Coupling**: The `user_invitation` submodule is the most highly coupled internal component. It imports `_module_root` (for user document models), `user_access` (for access type definitions), `user_notification` (for dispatching invite alerts), and `user_pincode` (for generating PINs for external guests). **Confirmed**.
- **Device-to-Access Dependency**: The `user_device` submodule imports `user_access` (specifically `OSKUserAccessesController`) to validate and bind SecureBLE tokens to active building access rights. **Confirmed**.
- **Activity-to-Call Dependency**: The `user_activity` submodule imports `user_call` (specifically `OSKUserCallDocument`) to enrich user activity logs with corresponding intercom call histories. **Confirmed**.
- **Decoupled Settings**: The `user_settings` submodule remains highly isolated, importing only `_module_root` to resolve user identities while managing building and unit-level preferences independently. **Confirmed**.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the cross-cutting data ownership judgment.*

The `user` module is the absolute owner of the `/users/{userId}` root collection and all its nested subcollections. While multiple external modules interact with these paths, the deterministic Data Ownership Hints reveal a clear gatekeeping pattern:
- **Authoritative Identity**: `OSKUserController` (defined in `_module_root`) is called by 7 external modules (`access_control_device`, `admin`, `building`, `call`, `core`, `organization`, `unit_management`), confirming that all external systems delegate user profile resolution to this module rather than writing to `/users` directly. **Confirmed**.
- **Access Ledger Ownership**: `OSKUserAccessesController` (defined in `user_access`) is called by 5 external modules (`admin`, `building`, `core`, `organization`, `unit_management`). While modules like `building` and `organization` initiate access changes (e.g., during resident onboarding), they do so by calling into `user_access` to write the user-centric access ledger (`/users/{userId}/accesses/{buildingId}`). **Inferred**.
- **Pincode Lifecycle**: `OSKUserPincodeController` (defined in `user_pincode`) is called by 4 external modules (`admin`, `core`, `organization`, `unit_management`) to manage user-scoped PINs, ensuring that credential deletion cascades are safely propagated to building-level collections. **Inferred**.
- **Intercom Synchronization**: `OSKUserIntercomService` is called by `building` to synchronize user-scoped intercom configurations (`/users/{userId}/intercoms`) when building-level directories change, demonstrating a projection pattern where `building` pushes directory updates to the user's private view. **Inferred**.

**Per-capability evidence:**

#### _module_root

This capability owns and modifies the following Firestore paths:

- **`/users/{userId}`** (Touch Type: Write/Update) `` `firestore_path_touched|user|functions/src/modules/user/index.ts|/users/{userId}|#1` ``.
- **`users`** (Collection Group, Touch Type: Get/Delete) `` `firestore_path_touched|user|functions/src/modules/user/services/user.service.ts|users|#1` ``.
- **`changeEmail`** (Inferred collection path managed by `OSKEmailChangeController` for temporary email change verification documents).

#### user_access

### Firestore Paths
- **`/users/{userId}/accesses/{buildingId}`** (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController.default._get|getPerBuilding|collectionPath,buildingId|#1` ``)
  - *Operations*: Read (`_get`, `_query`), Write (`_set`, `_update`, `_delete`, `_deleteAll`).
  - *Description*: Stores structured access records for a user within a specific building.
- **`/users/{userId}/buildings/{buildingId}/units/{unitId}`** (**Confirmed**; `` `call_expression|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController.default._create|create|`/users/${userId}/buildings/${buildingId}/units`,unitId,data|#1` ``)
  - *Operations*: Read (`_get`, `_listDocuments`), Write (`_create`, `_set`, `_delete`, `_deleteAll`).
  - *Description*: Tracks user associations with specific units inside a building.

---

#### user_activity

This capability owns and manages the following Firestore collections:
*   `/users/{userId}/activities/{activityId}`: Stores individual enriched user activity documents `` `functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts` (lines 12-13) ``.
    *   Operation Scope: Read, Write, Delete.
*   `/users/{userId}/activityAggregates/{buildingId}`: Stores aggregated user activities grouped by building ID `` `functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts` (lines 16-17) ``.
    *   Operation Scope: Read, Write, Delete.

#### user_call

This capability owns and manages data stored in the following Firestore path:

- **`/users/{userId}/calls/{callId}`** [Confirmed]
  - **Operation Scope**: Document-level writes (`_set`) `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._set|set|OSKUserCallController.default.getCollectionPath(userId),document.callId,document|#1` `` and collection-level purges (`_deleteAll`) `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._deleteAll|deleteAll|OSKUserCallController.default.getCollectionPath(userId)|#1` ``.
  - **Schema Fields**: Matches the `/users/{id}/calls` collection schema defined in the Firestore Schema grounding document, mapping directly to the `OSKUserCall` properties `` `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` (lines 13-24) ``.

---

#### user_device

### Firestore Paths Touched
- `/users/{userId}/devices/{deviceId}`
  - **Operation**: Undetermined (may be indirect) `` `firestore_path_touched|user|functions/src/modules/user/modules/user_device/index.ts|/users/{userId}/devices/{deviceId}|#1` ``. [Confirmed]
- `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens/{tokenId}`
  - **Operation**: Managed via `OSKUserDeviceAccessControlDeviceTokenController` `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 14-44). [Confirmed]

---

#### user_intercoms

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

#### user_invitation

This capability owns and performs direct read/write operations on the following Firestore paths:

- **`/users/{userId}/sentInvitations`**: Stores invitations sent by a specific user. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (line 20) ``
- **`/users/{userId}/invitations`**: Stores invitations received by a specific user. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (line 27) ``
- **`/buildings/{buildingId}/units/{unitId}/invitations`**: Stores invitations associated with a specific building unit. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (line 34) ``
- **`externalUserInvitations`**: Root collection storing invitations for users who have not yet registered on the platform. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (line 17) ``

#### user_notification

### Firestore Paths Touched
- `/users/{userId}/notifications/{notificationId}` [Confirmed] (`` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` ``)
- `/users/{userId}/notificationTokens/{tokenId}` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController.default._set|save|\`/users/\${userId}/notificationTokens\`,tokenId,data|#1` ``)

#### user_organization

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

#### user_pincode

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

#### user_settings

### Firestore Collections Scoped to this Capability
The capability performs read, write, update, and delete operations on the following subcollections nested under the `/users` root collection:

- **`/users/{userId}/buildingSettings/{buildingId}`**
  - *Description*: Stores building-level access settings for a user.
  - *Controller*: `OSKUserSettingsBuildingController` `` `functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts` (lines 18-26) ``.
  - *Operations*: `get`, `set`, `update`, `delete`, `query` `` `functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts` (lines 28-85) ``.

- **`/users/{userId}/buildingSettings/{buildingId}/unitSettings/{unitId}`**
  - *Description*: Stores unit-level access settings for a user.
  - *Controller*: `OSKUserSettingsUnitController` `` `functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts` (lines 18-27) ``.
  - *Operations*: `get`, `set`, `update`, `delete`, `query` `` `functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts` (lines 29-85) ``.

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### Callable Functions
The following callable functions are registered by this capability:

- **`deleteUserProfileImage`**
  - Request: `deleteUserProfileImageRequest`
    - `filename`: `string`
    - `userId`: `string`
  - Response: `void`
- **`getCurrentUserUnits`**
  - Request: `void`
  - Response: `OSKGetUserUnitsResponseData`
    - `buildingId`: `string`
    - `buildingName`: `string`
    - `units`: `OSKUserBuildingWithUnitsUnit[]`
- **`getInhabitantType`**
  - Request: `OSKGetInhabitantTypeRequest`
    - `buildingId`: `string`
    - `unitId`: `string`
    - `userId`: `string`
  - Response: `OSKGetInhabitantTypeResponse`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType`
- **`getUserIdsByEmailOrPhone`**
  - Request: `OSKGetUsersByEmailOrPhoneNumberRequestData`
    - `email`: `string` (optional)
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `userId`: `string`
  - Response: `OSKGetUsersByEmailOrPhoneNumberResponseData`
    - `duplicateFinds`: `object[]` (optional)
    - `email`: `string`
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `userIdFound`: `string`
- **`initiateEmailChange`**
  - Request: `OSKUserInitiateEmailChangeRequest`
    - `newEmail`: `string`
  - Response: `void`
- **`initiatePhoneNumberChange`**
  - Request: `OSKUserInitiatePhoneChangeRequest`
    - `newPhoneNumber`: `string`
  - Response: `void`
- **`onUpdatePhoneNumberCalled`**
  - Request: `OSKPhoneNumber`
  - Response: `void`
- **`onUpdatePublicProfileCalled`**
  - Request: `OSKUserUpdatesPublicProfileRequest`
    - `firstName`: `string`
    - `lastName`: `string`
    - `userId`: `string`
  - Response: `void`
- **`onUpdateUserOnboardingStatusCalled`**
  - Request: `OSKUserUpdatesOnboardingStatusRequest`
    - `apiVersion`: `string`
    - `newUserOnboarding`: `object`
    - `userId`: `string`
  - Response: `void`
- **`onUpdateUserProfileAndPhoneNumberCalled`**
  - Request: `OSKUpdateUserProfileAndPhoneNumberRequestData`
    - `phoneNumber`: `OSKPhoneNumber` (optional)
    - `publicProfile`: `OSKUserUpdatesPublicProfileRequest`
  - Response: `void`
- **`onUpdateUserSettingsLanguageCalled`**
  - Request: `OSKUserUpdatesLanguageRequest`
    - `language`: `string`
    - `userId`: `string`
  - Response: `void`
- **`requestMyAccountDeletion`**
  - Request: `void`
  - Response: `void`
- **`verifyAndCompleteEmailChange`**
  - Request: `OSKUserVerifyAndCompleteEmailChangeRequest`
    - `code`: `string`
  - Response: `void`
- **`verifyAndCompletePhoneNumberChange`**
  - Request: `OSKUserVerifyAndCompletePhoneNumberChangeRequest`
    - `code`: `string`
    - `phoneNumber`: `OSKPhoneNumber`
  - Response: `void`

### Firestore Triggers
- **`onDocumentCreated`**: Listens to `/users/{userId}` document creation `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1` ``.
- **`onDocumentUpdated`**: Listens to `/users/{userId}` document updates `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentUpdated|#1` ``.

### Auth Triggers
- **`onAccountCreated`**: Triggered when a Firebase Auth user is created `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1` ``.
- **`onAccountDeleted`**: Triggered when a Firebase Auth user is deleted `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountDeleted|#1` ``.

### Scheduled Triggers
- **`onDeleteAccount`**: Runs daily at midnight (`'00 00 * * *'`) to delete accounts marked for deletion `` `call_expression|user|functions/src/modules/user/index.ts|OSKUserService.onDeleteAccount|getScheduledFunctionTriggers||#1` ``.

#### user_access

- No `api_contract` facts are present in this capability's pack. (**Confirmed**)
- No Firestore triggers are explicitly declared in this pack. (**Confirmed**)

---

#### user_activity

The capability exposes the following Firebase Callable functions `` `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51) ``:
*   `delete`: Deletes a specific user activity.
    *   Request Schema: `OSKDeleteActivityByIdRequest`
        *   `activityId`: `string`
        *   `userId`: `string`
*   `deleteAll`: Deletes all activities for a user.
    *   Request Schema: `OSKDeleteAllUserActivitiesRequest`
        *   `userId`: `string`
*   `getActivityByBuildingId`: Retrieves aggregated activities for a user filtered by building.
    *   Request Schema: `OSKGetUserActivityAggregatesByBuildingIdRequest`
        *   `buildingId`: `string`
        *   `userId`: `string`
*   `getActivityById`: Retrieves a specific user activity.
    *   Request Schema: `OSKGetUserActivityByIdRequest`
        *   `activityId`: `string`
        *   `userId`: `string`
*   `getAllUserActivities`: Retrieves all activities for a user.
    *   Request Schema: `OSKGetAllUserActivitiesRequest`
        *   `userId`: `string`

#### user_call

- No direct external API contracts (`api_contract` facts) are owned by this capability. [Confirmed]
- No Firestore triggers are registered within this capability's pack. [Confirmed]

---

#### user_device

### API Contracts
- **getDevicesUserList**
  - **Request Schema**: `OSKGetUserDeviceListRequestData`
    - `userId`: `string`
  - **Response Schema**: No `model_property` facts matched within this pack for the response schema.
- **removeUserDevice**
  - **Request Schema**: `OSKRemoveUserDeviceRequestData`
    - `deviceId`: `string`
    - `userId`: `string`
  - **Response Schema**: No `model_property` facts matched within this pack for the response schema.

### Firestore Triggers
- **Path**: `/users/{userId}/devices/{deviceId}`
  - **onCreate**: Triggers `OSKUserDeviceService.onDocumentCreated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentCreated|#1` ``. [Confirmed]
  - **onUpdate**: Triggers `OSKUserDeviceService.onDocumentUpdated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentUpdated|#1` ``. [Confirmed]
  - **onDelete**: Triggers `OSKUserDeviceService.onDocumentDeleted` `` `firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentDeleted|#1` ``. [Confirmed]

---

#### user_intercoms

No `api_contract` facts or Firestore trigger definitions are present in this capability's evidence pack. [Confirmed]

---

#### user_invitation

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

#### user_notification

### API Contracts (Callable Cloud Functions)

#### `onInsertOrUpdateNotificationToken`
- **Request Type**: `OSKUserNotificationToken`
  - `tokenId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Implicit)

#### `onDeleteNotificationToken`
- **Request Type**: `OSKUserNotificationTokenDeleteRequest`
  - `tokenId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Implicit)

#### `onTestNotification`
- **Request Type**: Not listed in resolved schemas (no `model_property` facts matched within this pack).
- **Response Type**: Not listed.

### Firestore Triggers

#### `onDocumentUpdated`
- **Path**: `/users/{userId}/notifications/{notificationId}`
- **Behavior**: Triggered when a notification document is updated. If the notification is marked as read, it decrements the user's `unreadNotificationCount`. If marked as unread, it increments the count [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``).

#### `onDocumentDeleted`
- **Path**: `/users/{userId}/notifications/{notificationId}`
- **Behavior**: Triggered when a notification document is deleted. Decrements the user's `unreadNotificationCount` if the deleted notification was unread [Confirmed] (`` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``).

#### user_organization

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

#### user_pincode

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

#### user_settings

### Callable Cloud Functions
The capability registers the following HTTPS callable triggers in `functions/src/modules/user/modules/user_settings/index.ts`:
- `createUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|createUserSettingsBuilding|#1` ``
- `deleteUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|deleteUserSettingsBuilding|#1` ``
- `getAllUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getAllUserSettingsBuilding|#1` ``
- `getUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getUserSettingsBuilding|#1` ``
- `updateUserSettingsBuilding` `` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|updateUserSettingsBuilding|#1` ``

### Resolved API Request/Response Schemas

#### `createUserSettingsBuilding`
- **Request Type**: `OSKUserCreateSettingsBuildingRequest`
  - `buildingId`: `string`
  - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams` (imported from `@oskey/building/settings`)
  - `userId`: `string`

#### `deleteUserSettingsBuilding`
- **Request Type**: `OSKUserDeleteSettingsBuildingRequest`
  - `buildingId`: `string`
  - `userId`: `string`

#### `getAllUserSettingsBuilding`
- **Request Type**: `OSKUserGetAllSettingsBuildingRequest`
  - `userId`: `string`

#### `getUserSettingsBuilding`
- **Request Type**: `OSKUserGetSettingsBuildingRequest`
  - `buildingId`: `string`
  - `userId`: `string`

#### `updateUserSettingsBuilding`
- **Request Type**: `OSKUserUpdateSettingsBuildingRequest`
  - `buildingId`: `string`
  - `update`: `Partial<OSKBuildingSettingsInputParams>` (imported from `@oskey/building/settings`)
  - `userId`: `string`

---

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only cross-cutting risk callouts and security enforcement tallies.*

#### Mental Enforcement Tally
A comparative analysis of security enforcement across the 11 capabilities reveals a highly asymmetric security posture:
- **User-Scoped Isolation**: The majority of submodules (`_module_root`, `user_activity`, `user_device`, `user_invitation`, `user_pincode`) rely on the `OSKUserSecurityChecks` decorator or direct context matching (`context.auth.uid === userId`) to enforce that users can only access their own data. **Confirmed**.
- **Administrative RBAC Enforcement**: Only the `user_settings` submodule explicitly checks administrative RBAC permissions (`v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`) in its service layer. **Confirmed**.
- **Missing RBAC in Code**: Submodules managing highly sensitive credentials and tokens (`user_access`, `user_device`, `user_pincode`) contain *no explicit RBAC permission checks* in their code facts, despite the existence of administrative roles (e.g., `v1.admin.user.devices.delete`, `v1.admin.user.accesses.create`) in the RBAC roles document. **Confirmed**.

#### Unattributed Security-Relevant Signals
The following capabilities raise authorization failures or permission-denied errors based on context matching, without any backing RBAC permission string:
- **`_module_root`**: Raises **1** `permission-denied` error when a user attempts to query units or look up users other than themselves. **Confirmed**.
- **`user_device`**: Raises **2** `permission-denied` errors (one during device listing and one during device removal) if the caller's identity does not match the target device owner. **Confirmed**.
- **`user_notification`**: Raises **1** hardcoded `permission-denied` error ("Permission-denied: You are not authorized to delete user registration token!") if a caller attempts to modify another user's FCM tokens. **Confirmed**.

**Per-capability evidence:**

#### _module_root

- **`OSKUserSecurityChecks` Decorator**: Applied to callable endpoints to enforce that the calling user matches the target user ID or possesses administrative permissions `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKUserSecurityChecks|onUpdatePublicProfileCalled||#1` ``.
- **`OSKSecurityChecks.checkParameters`**: Validates input parameters for type safety and presence `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKSecurityChecks.checkParameters|onUpdatePublicProfileCalled|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'firstName', value: request.firstName, type: 'string' },             { name: 'lastName', value: request.lastName, type: 'string' },         ]|#1` ``.
- **Permission Errors**: Throws `permission-denied` errors if security checks fail (e.g., if a user attempts to query units or look up users other than themselves) `` `permission_error|user|functions/src/modules/user/services/user.service.ts|permission-denied|#1` ``.

#### user_access

### Firestore Security Rules
The following rules from `firestore.rules.txt` govern the paths owned by this capability:
- **`/users/{userId}/accesses/{accessId}`**:
  - `allow read: if isAuthenticatedUser(userId);`
  - `allow write: if false;` (Direct client writes are blocked; updates must go through backend services).
- **`/users/{userId}/accesses/personalization/{personalizationId}`**:
  - `allow read: if (isAuthenticatedUser(userId));`
  - `allow write: if (isAuthenticatedUser(userId) && get(/databases/$(database)/documents/users/$(userId)/accesses/$(accessId)).data.isInvitation == false && accessId == personalizationId);`
- **`/users/{userId}/buildings/{buildingId}/units/{unitId}`**:
  - `allow read: if (isAuthenticatedUser(userId));`
  - `allow write: if false;`

### RBAC Permissions
While no explicit RBAC permission strings are directly referenced in the code facts of this pack, the RBAC roles document lists the following administrative permissions related to user accesses:
- `v1.admin.user.accesses.create`
- `v1.admin.user.accesses.delete`
- `v1.admin.user.accesses.list`
- `v1.admin.user.accesses.view`

---

#### user_activity

*   This capability does not reference any administrative RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`).
*   Instead, security is enforced at the user level via the `OSKUserSecurityChecks` decorator `` `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54, 67, 80, 89) ``. This decorator validates that the authenticated user (`request.auth.uid`) matches the `userId` provided in the request parameters, preventing cross-user data leakage.

#### user_call

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

#### user_device

- **Security Decorators**: Uses `OSKUserSecurityChecks` to protect service methods `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 38, 54). [Confirmed]
- **Permission Errors**:
  - Throws `permission-denied` errors if security checks fail during device listing or device removal `` `permission_error|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|permission-denied|#1` ``. [Confirmed]
- **RBAC Cross-Check**: No explicit RBAC permission strings (e.g., `v1.admin.user.devices.delete`) are directly referenced in the code facts of this submodule, but the security checks decorator `OSKUserSecurityChecks` is applied. [Confirmed]

---

#### user_intercoms

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

#### user_invitation

- **Callable Security Checks**: The callable entry points utilize the `@OSKUserSecurityChecks` decorator to enforce authentication and context validation. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (line 184) ``
- **App Check Verification**: Critical services (such as acceptance, rejection, and cancellation) enforce that the request originates from an App Check verified application, logging errors if verification fails. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 29) ``
- **RBAC Roles**: No explicit RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`) are directly referenced in the provided evidence pack for this capability. [Confirmed]

#### user_notification

### App Check Verification
- Callable functions enforce App Check verification unless running in the local Firebase Emulator environment [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

### Caller Authorization
- The capability verifies that the caller is authenticated and that the `userId` in the request matches the authenticated user's UID (preventing users from registering or deleting tokens for other accounts) [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onDeleteNotificationToken|'Permission-denied: You are not authorized to delete user registration token!',{ request, context }|#1` ``).

### RBAC Alignment
- No specific RBAC permission strings (e.g., `v1.admin...`) are referenced in this capability's evidence pack. Security is enforced via user-to-user context matching (`context.auth.uid === request.userId`).

#### user_organization

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

#### user_pincode

### Security Decorators
- Entry points are protected by the `OSKUserSecurityChecks` decorator to verify user identity and session validity [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserSecurityChecks|deleteUserPincode||#1` ``).

### Parameter Validation
- Uses `OSKSecurityChecks.checkParameters` to validate incoming request payloads (e.g., verifying `userId` and `pincodeId` types) [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKSecurityChecks.checkParameters|deleteUserPincode|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'pincodeId', value: request.pincodeId, type: 'string' },         ]|#1` ``).

### RBAC Permissions
- No explicit RBAC permission strings (e.g., `v1.admin.*`) are directly referenced in the provided facts for this capability [Confirmed].

---

#### user_settings

### Required Permissions
The capability explicitly checks the following permission strings when executing administrative actions:
- **`v1.org.settings.create`**: Required to create user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.create|#1` ``.
- **`v1.org.settings.view`**: Required to view user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.view|#1` ``.
- **`v1.org.settings.edit`**: Required to update user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.edit|#1` ``.
- **`v1.org.settings.delete`**: Required to delete user building or unit settings `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.delete|#1` ``.

### RBAC Cross-Check
All checked permissions (`v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`) match the authoritative RBAC roles document exactly (`Confirmed`). 

The codebase also references `v1.org.admin` as a candidate permission/role check `` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``. In the RBAC roles document, `v1.org.admin` is not listed as a standalone permission string, but the system context architecture document defines it as a high-level administrative role (`Confirmed`).

---

### 10. Cross-Module Relationships

The `user` module maintains extensive, bi-directional relationships across the platform. All listed relationships are verified by direct AST import or method-level call evidence.

#### Outbound Relationships (This module depends on and calls others)
- **`core` (Database, Logging, and Access Utilities)**: Heavily utilized across all submodules. Calls `OSKDocumentController` CRUD methods (**121 touchpoints**), `OSKLoggingService` (**93 error log sites, 64 info log sites**), `OSKSecretService` (for private key retrieval), and `OSKAccessService`/`OSKPincodeService` (to coordinate dual-write access ledgers and PIN generation). **Confirmed**.
- **`building` (Directory and Inhabitant Management)**: Calls `OSKBuildingController` and `OSKBuildingDoorController` to validate doors and units during invitation creation, and calls `OSKBuildingUnitInhabitantService` (**38 touchpoints**) to add or remove inhabitants when invitations are accepted or edited. **Confirmed**.
- **`organization` (Resident and Onboarding Orchestration)**: Calls `OSKOrganizationResidentsController` and `OSKOrganizationOnboardingInhabitantController` (**13 touchpoints**) to update resident profiles and manage onboarding cards during external invitation workflows. **Confirmed**.
- **`apps` (Notification and Mail Delivery)**: Calls `OSKNotificationService.send` (**8 touchpoints**) to dispatch push notifications for invitations, and calls `OSKEmailService.send` to send verification emails. **Confirmed**.
- **`settings` (App Store and Role Resolution)**: Calls `OSKAppStoreSettingsService` to fetch store links for invitations, and calls `OSKConsolidatedRolesController` (**5 touchpoints**) to generate organization user roles. **Confirmed**.
- **`unit_management` (Invitation Consumption)**: Calls `OSKUnitManagementCreationInvitationService` (**5 touchpoints**) to consume unit invitations when an inhabitant completes onboarding. **Confirmed**.

#### Inbound Relationships (Other modules depend on and call this module)
- **`admin` (Maintenance and Database Repair)**: Calls `OSKUserController` to list and retrieve users, `OSKUserAccessesController` to repair building accesses, `OSKUserDeviceService` to provision device tokens, and `OSKUserSettingsBuildingController`/`OSKUserSettingsUnitController` to manage administrative settings overrides. **Confirmed**.
- **`building` (Intercom and Access Synchronization)**: Calls `OSKUserIntercomService` to update or clean up user intercom entries when building directories change, and calls `OSKUserSettingsBuildingService` to initialize settings during unit assignment. **Confirmed**.
- **`core` (Event Ingestion and Access Orchestration)**: Calls `OSKUserAccessService` to set up accesses, `OSKUserPincodeService` to create pincode documents, and `OSKUserActivitiesService` to route enriched hardware activity logs to user profiles. **Confirmed**.
- **`organization` (Portal User and Resident Management)**: Calls `OSKUserOrganizationController` to save user-organization mappings, and calls `OSKUserPincodeController` to delete resident PINs when offboarding occupants. **Confirmed**.
- **`unit_management` (Inhabitant Onboarding)**: Calls `OSKUserController` to resolve invitees, and calls `OSKUserInvitationExternalUnitService` to create invitations. **Confirmed**.
- **`apps` (Notification Dispatch)**: Calls `OSKUserNotificationTokenController` to retrieve active FCM/APNS tokens for targeted push notifications. **Confirmed**.
- **`call` (Call History Logging)**: Calls `OSKUserCallController` to write call logs to the user's private history. **Confirmed**.
- **`access_control_device` (Activity Enrichment)**: Calls `OSKUserController` to resolve the user's name and profile details when enriching raw hardware events. **Confirmed**.

### 11. External Hooks

#### _module_root

### Confirmed Integrations
- **Twilio Verify API**: Used via HTTP POST requests to send and verify SMS verification codes for phone number changes `` `call_expression|user|functions/src/modules/user/services/user.service.ts|axios.post|_sendVerificationSms|url,params.toString(),{ headers }|#1` ``.
- **Auth0 API**: Integrated via `OSKAuth0Service` to delete users, update emails, update phone numbers, and fetch users by email or phone number `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKAuth0Service.deleteAuth0User|onAccountDeleted|email|#1` ``.
- **Google Cloud Storage**: Deletes user-specific files under `users/${userId}/` during account deletion cascades `` `call_expression|user|functions/src/modules/user/controllers/user.controller.ts|storage()                 .bucket()                 .deleteFiles|delete|{ prefix: `users/${userId}/` }|#1` ``.

#### user_access

### Pub/Sub Messages
The capability defines several Pub/Sub message schemas in `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` which serve as candidate external boundaries for asynchronous synchronization of user accesses to edge hardware:
- **`OSKAccessPubsubdMessage`** (line 44)
- **`OSKUserAccessesMessageInsert`** (line 23)
- **`OSKUserAccessesMessageUpdate`** (line 28)
- **`OSKUserAccessesMessageDelete`** (line 33)
- **`OSKMaintenanceAccessesMessageRecreate`** (line 38)

---

#### user_activity

*   No external hooks (such as Pub/Sub publishers, external HTTP endpoints, or cloud storage paths) are directly defined within this capability's pack. It relies entirely on standard Firebase HTTPS Callable triggers for client interactions.

#### user_call

- No external hooks, Pub/Sub topics, environment variables, or external storage paths are evidenced within this capability's pack. [Confirmed]

---

#### user_device

- No external hooks (such as Pub/Sub publishers, external HTTP paths, environment variables, or storage paths) are explicitly evidenced within this capability's pack. [Confirmed]

---

#### user_intercoms

No external hooks, Pub/Sub topics, environment variables, or storage paths are evidenced within this capability's pack. [Confirmed]

---

#### user_invitation

- **App Store Integration**: Retrieves Apple and Google store details via `OSKAppStoreSettingsService.getAppstoreInformation` to include in invitation communications. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (line 85) ``
- **Notification Dispatch**: Integrates with `OSKNotificationService` and `OSKUserNotificationService` to send push notifications, emails, or SMS to users when invitations are created or processed. [Confirmed] `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (line 115) ``

#### user_notification

- **Environment Variables**:
  - `OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check verification during local development [Confirmed] (`` `functions/src/modules/user/modules/user_notification/index.ts` (line 62) ``).

#### user_organization

- **Environment Variables**: Uses `process.env.OSK_FIREBASE_EMULATOR` to conditionally bypass App Check during local development/testing `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.
- No other external hooks (Pub/Sub topics, external HTTP endpoints, or storage paths) are evidenced within this capability's pack.

---

#### user_pincode

No external hooks (such as Pub/Sub topics, external HTTP endpoints, environment variables, or storage paths) are directly evidenced within this capability's pack [Confirmed].

---

#### user_settings

No external hooks, Pub/Sub topics, external HTTP paths, or storage paths are registered or utilized directly within this capability's pack (`Confirmed`).

---

### 12. Architectural Observations

- **Passive State Synchronization**: The `user` module operates primarily as a passive recipient of state changes driven by other modules. For example, `building` directly invokes `OSKUserIntercomService` to update user-scoped intercom configurations, and `organization` invokes `OSKUserOrganizationController` to manage roles. This decouples the `user` module from the complex business logic of property management and building directories. **Confirmed**.
- **Dual-Write Access Ledger Pattern**: The module participates in a strict dual-write pattern managed by `core`. Access rights are written simultaneously to the user-centric path (`/users/{userId}/accesses/{buildingId}`) and the building-centric path (`/buildings/{buildingId}/accesses`). This guarantees that user-facing apps can query accesses with low latency, while edge hardware synchronization workers can poll building-centric collections efficiently. **Confirmed**.
- **Consistent User-Scoped Isolation**: The widespread application of the `OSKUserSecurityChecks` decorator across submodules ensures that the platform's "Least Privilege" design is enforced consistently at the service layer, preventing cross-user data leakage even if Firestore rules are misconfigured. **Confirmed**.

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **Risk: Administrative RBAC Bypass in Code**: While the RBAC roles document defines granular administrative permissions (e.g., `v1.admin.user.devices.delete` and `v1.admin.user.accesses.create`), these strings are *not* explicitly checked in the code of `user_device` or `user_access`. Instead, these submodules rely on the generic `OSKUserSecurityChecks` decorator. If this decorator does not dynamically map to these administrative permission strings, administrators may be blocked, or conversely, may bypass checks without granular audit logging. **Inferred**.
- **Risk: Role vs. Permission String Mismatch**: The `user_settings` capability references `v1.org.admin` as a candidate permission check. However, `v1.org.admin` is defined as a high-level composite *role* in the system context architecture document, not a leaf *permission string* in the RBAC roles document. This represents a structural mismatch in how roles and permissions are evaluated in the code. **Confirmed**.
- **Risk: Inconsistent App Check Enforcement**: App Check is explicitly enforced on callables in `user_invitation`, `user_notification`, and `user_organization`, but is not explicitly configured or verified in the callables of `_module_root`, `user_device`, or `user_pincode`. This creates an inconsistent security perimeter for user-facing endpoints. **Confirmed**.
- **Open Question: FCM Token Pruning**: There is no evidence of an automated background process or TTL index to prune stale or expired FCM tokens from `/users/{userId}/notificationTokens` other than manual deletion on logout, which could lead to accumulated orphaned tokens. **Inferred**.

**Per-capability open questions:**

#### _module_root

- **Email Change Collection Path**: The exact collection path for `OSKEmailChangeController` is not explicitly listed in the `firestore_path_touched` facts, though it is inferred to be `changeEmail` or similar based on the model name `changeEmail.model.ts`. [Inferred]
- **Twilio API Endpoints**: The exact structure of the Twilio API endpoints is encapsulated in `_sendVerificationSms` and `_verifySmsCode` but is not fully detailed in the facts. [Inferred]

#### user_access

- **Pub/Sub Publishing**: The message models are defined within this capability, but there are no direct `pubsub_publish_call` facts in this pack. It is unclear which service or trigger is responsible for actually publishing these messages to GCP Pub/Sub. (**Inferred**)
- **Controller Authorization**: The controllers inherit from `OSKDocumentController`, but the exact middleware or decorator-based RBAC checks applied to the controller endpoints are not visible in this pack's facts. (**Inferred**)

#### user_activity

*   **Trigger Mechanism for Ingestion**: The services expose `ActivityReceivedForUser` methods, but the mechanism that invokes these methods when a door event or call occurs is not evidenced in this pack. It is likely triggered by a Firestore trigger or Pub/Sub subscriber in another module (e.g., `access_control_device` or `building`).
*   **Cutoff Window Customization**: The 30-day cutoff window for activity aggregates is hardcoded in the service `` `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (line 78) ``. It is unknown if there are plans to make this configurable via building settings.

#### user_call

- **Invocation Context**: How are the `set` and `deleteAll` methods of `OSKUserCallController` triggered? Are they called programmatically by services in the `call` module when a call starts/ends, or are they bound to internal event handlers? [Inferred/Unknown]
- **API Exposure**: Is there a corresponding HTTP routing layer in the parent `user` module that exposes `OSKUserCallController` methods to the mobile application, or is this controller strictly used for internal backend orchestration? [Inferred/Unknown]

#### user_device

- **Response Schemas**: What are the exact response structures for `getDevicesUserList` and `removeUserDevice`? No `model_property` facts matched within this pack to define them. [Inferred]
- **Security Decorator Mapping**: How does `OSKUserSecurityChecks` internally map to the RBAC roles or Auth0 sub validation? [Inferred]

#### user_intercoms

- **Triggering Mechanism**: How are `createAndUpdateUsersIntercomEntry` and `cleanUpUserIntercomsAfterInhabitantDeletion` invoked? (Presumably, they are triggered by Firestore document writes on the `/buildings/{id}/units/{id}/inhabitants` collection, but the actual trigger definitions are outside this capability's pack). [Inferred]
- **`callTimeSlots` Schema**: What is the exact structure of the `callTimeSlots` field? It is defined as a property on the `OSKUserIntercom` model but is typed implicitly or not expanded in the model properties. [Unknown]
- **`unitMatch` Parameter**: In `createUserIntercomEntry(userId, intercomDoc, unitMatch, callTransferListOrdered)`, what is the structure and origin of `unitMatch`? [Unknown]

#### user_invitation

- **Invitation Expiration**: Is there an automatic background cleanup task or TTL index on the `externalUserInvitations` collection to prune expired or stale invitations? [Unknown]
- **Communication Templates**: How are email and SMS templates managed for invitation dispatch? The evidence shows calls to `OSKNotificationService` but not the template resolution logic. [Unknown]

#### user_notification

- **FCM Token Pruning**: It is unclear if there is an automated background process to prune stale or expired FCM tokens from `/users/{userId}/notificationTokens` other than manual deletion on logout. [Inferred]
- **Notification Delivery Channels**: The exact delivery channels (APNS, FCM, SMS, Email) are abstracted behind `@oskey/apps/notification`, leaving the specific transport details unknown within this capability's scope. [Confirmed]

#### user_organization

- **Notification Dispatch**: Does accepting or rejecting an invitation trigger any push notifications or emails to the organization administrators or the inviting user? There is no evidence of notification dispatch within this capability pack.
- **`OSKUserOrganizationRequestService` Usage**: While `OSKUserOrganizationRequestService` is declared as an exported class, there are no explicit method calls or references to it in the provided evidence pack. Its exact role in processing requests remains unevidenced.

#### user_pincode

- **Pincode Synchronization**: While the capability handles Firestore-level creation and deletion, the exact mechanism by which these pincodes are synchronized down to the physical Access Control Devices (ACDs) (e.g., via Pub/Sub or MongoDB mirrors) is handled outside this capability's scope [Inferred].
- **Security Decorator Implementation**: The exact authorization logic executed by the `OSKUserSecurityChecks` decorator is not visible in this capability pack [Inferred].

#### user_settings

- **Unit Settings Callables**: The entry point `functions/src/modules/user/modules/user_settings/index.ts` only registers callable functions for building settings (`createUserSettingsBuilding`, `updateUserSettingsBuilding`, etc.). It does not register callables for unit settings. Are unit settings managed exclusively via internal service-to-service calls (such as during inhabitant onboarding), or are they exposed through a different module's entry point?
- **Role vs. Permission Check**: The service checks for `v1.org.admin` `` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``. Since this is a role rather than a permission string, does the consolidated roles controller handle role-to-permission mapping dynamically, or is this a hardcoded bypass for organization admins?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
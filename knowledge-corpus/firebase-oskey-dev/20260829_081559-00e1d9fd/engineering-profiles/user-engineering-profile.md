### 0. Generation Metadata

- **runId**: `20260829_081559-00e1d9fd`
- **generatedAt**: `2026-08-29T13:37:47.460Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `user`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `user` module serves as the central identity, profile, credential, and personalization hub of the Oskey platform [Confirmed]. It manages core user profiles, contact details (email and phone number), onboarding states, physical devices, cryptographic keys, user-specific access permissions (SecureBLE, pincodes), call routing/intercom configurations, notification preferences, and activity/call logs [Confirmed]. It orchestrates secure contact verification workflows (via Twilio SMS and email OTP) and coordinates a comprehensive user account deletion cascade across Firestore collections, Cloud Storage, Firebase Auth, and Auth0 [Confirmed].

### 2. Architectural Position

The `user` module is a foundational core module situated at the base of the platform's logical hierarchy [Confirmed]. It owns the `/users/{userId}` root collection and all its subcollections [Confirmed]. It acts as the bridge between the external Auth0 identity layer and Oskey's internal business logic [Inferred]. It provides critical identity, credential, and configuration services to almost every other module in the system, with 9 other modules directly depending on its interfaces [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **User Account Creation & Synchronization**: Automatically provisions a new user document in Firestore when a Firebase Auth account is created, extracting details from Auth0 provider data and enforcing registration restrictions [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|onAccountCreated|#1` ``).
- **User Profile & Contact Updates**: Updates public profile fields (first name, last name) and cascades these changes to other collections, such as building accesses and unit inhabitants [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|_cascadePublicProfileChange|#1` ``).
- **Phone Number Verification & Change**: Initiates phone number changes via Twilio Verify SMS and completes them upon OTP verification, updating both Firebase Auth and Firestore [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiatePhoneNumberChange|#1` ``, `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompletePhoneNumberChange|#1` ``).
- **Email Verification & Change**: Initiates email changes by sending an OTP email and completes them upon verification, updating both Firebase Auth and Auth0 [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|initiateEmailChange|#1` ``, `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|verifyAndCompleteEmailChange|#1` ``).
- **Account Deletion Cascade**: Coordinates the complete deletion of user data across Firestore collections (devices, invitations, calls, settings, activities, accesses, pincodes, intercoms), deletes files from Cloud Storage, and deletes the user from Auth0 and Firebase Auth [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|_deleteAllUserData|#1` ``, `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|onAccountDeleted|#1` ``).
- **Onboarding & Settings Management**: Updates user onboarding status and language preferences [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|onUpdateUserOnboardingStatusCalled|#1` ``, `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|onUpdateUserSettingsLanguageCalled|#1` ``).
- **Inhabitant Type Resolution**: Retrieves the inhabitant type for a user in a specific building and unit [Confirmed] (Cite: `` `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getInhabitantType|#1` ``).

---

#### user_access

#### User Access Management (CRUD)
- Coordinates the setup, creation, and updating of user accesses per building via `OSKUserAccessService` `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (lines 32-33).
- Exposes controller methods for saving, updating, retrieving, and deleting user accesses per building or globally for a user `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 11-14).
- Supports checking and validating access rights against various access types (e.g., Guest, Permanent Guest, Inhabitant, Quickcode) `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 146-147).

#### User Building Unit Mapping
- Manages the mapping of users to specific building units through `OSKUserBuildingUnitController` `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 14-18).
- Supports creating, retrieving, listing, saving, and deleting user-to-building-unit associations `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 21-56).

#### Access Type Modeling & Validation
- Defines structured types for different access categories, including `OSKInhabitantAccess`, `OSKGuestAccess`, `OSKPermanentGuestAccess`, `OSKQuickcodeAccess`, `OSKNonAppUserAccess`, `OSKSupplierStaffAccess`, `OSKOrganizationInhabitantAccess`, and `OSKOrganizationGuestAccess` `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 34-101).
- Implements type-guard functions to validate access payloads at runtime (e.g., `isTypeOSKAccessBase`, `isTypeOSKInhabitantAccess`, `isTypeOSKGuestAccess`) `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 130-292).

#### Pub/Sub Message Formatting for Access Synchronization
- Defines models for Pub/Sub messages used to synchronize access changes to hardware, including insert, update, delete, and recreate operations `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` (lines 3-44).

---

#### user_activity

### Ingesting and Enriching User Activities
The capability processes incoming activity events for a user, retrieves the user's profile, and saves the enriched activity document [Confirmed, `service_method|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService|ActivityReceivedForUser|#1`].

### Aggregating Activities by Building
It maintains a consolidated list of activities per building for a user, filtering out events older than 30 days to optimize mobile app reads [Confirmed, `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 78-83)].

### Retrieving Individual or All Activities
Users can fetch a specific activity log by ID or retrieve their entire activity history [Confirmed, `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54-78)].

### Retrieving Aggregated Building Activities
Users can fetch their aggregated activities scoped to a specific building [Confirmed, `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 106-121)].

### Deleting Activities
Users can delete a specific activity or clear their entire activity log [Confirmed, `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 80-95)].

---

#### user_call

- **User-Scoped Call Document Management**: Provides methods to write (`set`) and purge (`deleteAll`) call records for a specific user [Confirmed].
    - The `set` method writes a call document to the user's subcollection using the call's unique identifier as the document ID `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._set|set|OSKUserCallController.default.getCollectionPath(userId),document.callId,document|#1` ``.
    - The `deleteAll` method removes all call documents under the user's subcollection `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._deleteAll|deleteAll|OSKUserCallController.default.getCollectionPath(userId)|#1` ``.
- **Collection Path Resolution**: Dynamically constructs the Firestore path `/users/{userId}/calls` for a given user ID `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|getCollectionPath|#1` ``.
- **Call Data Modeling**: Defines the `OSKUserCall` and `OSKUserCallDocument` types to represent call history records, capturing details such as start/end times, duration, status, and associated building/unit context `` `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` (lines 12-27) ``.

---

#### user_device

### Device Lifecycle Management [Confirmed]
- **Device Registration and Storage**: Saves and manages user device documents (mobile or watch) under the `/users/{userId}/devices/{deviceId}` collection path, capturing properties such as device name, type, lock status, and stolen status `` `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 33-35) ``.
- **Device Deletion**: Handles the removal of individual user devices or all devices associated with a user, which in turn triggers the cleanup of associated access control tokens `` `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 37-43) ``.
- **Active Device Querying**: Filters and retrieves active user devices that are neither locked nor marked as stolen `` `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 23-28) ``.

### Cryptographic Token Generation & Management [Confirmed]
- **Access Control Device Token Creation**: Generates signed cryptographic tokens (`createAccessDeviceToken`) for SecureBLE-based offline door unlocking `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 169-235) ``.
- **Token Payload Signing**: Uses `OSKAccessControlDeviceTokenPayload` and private keys retrieved via `OSKSecretService` to sign payloads containing user access rights and validity periods `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 180-224) ``.
- **Token Storage**: Persists generated tokens under the subcollection path `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens` `` `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 14-34) ``.

### Access Synchronization [Confirmed]
- **Firestore Trigger Orchestration**: Listens to document creation, update, and deletion events on `/users/{userId}/devices/{deviceId}` `` `functions/src/modules/user/modules/user_device/index.ts` (lines 40-47) ``.
- **Downstream Access Updates**: Invokes `OSKAccessUpdateService.updateUserAccessDevices` to propagate device changes (such as a new device registration or device deletion) to physical edge hardware `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 108, 133, 161) ``.

### Security and Parameter Validation [Confirmed]
- **Parameter Verification**: Validates incoming request parameters for user device operations using `OSKSecurityChecks.checkParameters` `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 43, 59) ``.
- **User Security Checks**: Enforces caller identity and authorization checks via the `@OSKUserSecurityChecks` decorator on service methods `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 38, 54) ``.

#### user_intercoms

The `user_intercoms` capability is responsible for the following core features:

- **User Intercom Document Lifecycle Management**: Provides CRUD operations to create, read, update, and delete user-specific intercom documents (`OSKUserIntercomDocument`) under the user's personal collection path. (Confirmed) Cite: `` `source_class|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController` ``.
- **Intercom Entry Synchronization**: Creates and updates user intercom entries (`createAndUpdateUsersIntercomEntry`) when a user is assigned to an intercom, ensuring that call transfer lists and co-inhabitant details are correctly initialized. (Confirmed) Cite: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|createAndUpdateUsersIntercomEntry|#1` ``.
- **Call Transfer List Ordering**: Converts call transfer lists from sequence-number-based structures to ordered lists (`convertCallTransferListFromSequenceNumberToOrdered`) to determine the exact sequence of call forwarding. (Confirmed) Cite: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|convertCallTransferListFromSequenceNumberToOrdered|#1` ``.
- **Inhabitant Deletion Cleanup**: Cleans up user intercom documents (`cleanUpUserIntercomsAfterInhabitantDeletion`) when an inhabitant is deleted, removing them from the inhabitants list and filtering them out of any active call transfer lists. (Confirmed) Cite: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|cleanUpUserIntercomsAfterInhabitantDeletion|#1` ``.
- **Co-Tenant Propagation**: Updates intercom entries for all other tenants sharing the same unit (`updateAllUserIntercomEntry`) to maintain consistency across the residential group. (Confirmed) Cite: `` `service_method|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService|updateAllUserIntercomEntry|#1` ``.

#### user_invitation

The capability is structured around several core services and controllers that handle distinct phases of the invitation lifecycle:

### Invitation Creation & Sent Object Construction [Confirmed]
- **Creation Orchestration**: The `OSKUserInvitationCreationService` handles the creation of user invitations, validating that invitees are present and constructing the definitive sent invitation object [Confirmed] (lines 87-116) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (lines 87-116) ``.
- **Access Validation**: It validates requested access rights against the core access rules using `OSKAccessUtilsService.validateAccessRights` [Confirmed] (line 246) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (line 246) ``.
- **Unit Details Resolution**: It completes unit details (such as unit name and number) by querying the building unit controller [Confirmed] (line 487) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (line 487) ``.
- **Persistence**: Saves the constructed invitation to the sender's sent invitations collection (`/users/{userId}/sentInvitations`) and the building unit's invitations collection (`/buildings/{buildingId}/units/{unitId}/invitations`) [Confirmed] (lines 144, 152) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (lines 144, 152) ``.

### Invitation Acceptance & Access Provisioning [Confirmed]
- **Acceptance Orchestration**: The `OSKUserInvitationAcceptedService` processes invitation acceptance by an invitee [Confirmed] (lines 27-51) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (lines 27-51) ``.
- **Access Creation**: It provisions physical access for the accepted user by calling `OSKAccessService.createAccess` [Confirmed] (line 160) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 160) ``.
- **Inhabitant Registration**: It registers the accepted user as an inhabitant of the building unit via `OSKBuildingUnitInhabitantService.addInhabitant` [Confirmed] (line 156) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 156) ``.
- **Status Synchronization**: It updates the status of the invitee to `accepted` across the sender's sent invitations, the building unit's invitations, and the recipient's received invitations [Confirmed] (lines 188, 195, 208, 214) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (lines 188-214) ``.

### Invitation Rejection, Cancellation, & Deletion [Confirmed]
- **Rejection**: The `OSKUserInvitationRejectedService` updates the status of the invitee to `rejected` across the building unit's invitations and the sender's sent invitations [Confirmed] (lines 53, 60) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_rejected.service.ts` (lines 53, 60) ``.
- **Cancellation**: The `OSKUserInvitationCancelledService` allows an inviter to cancel a pending or active invitation, which revokes any provisioned access via `OSKAccessService.deleteAccessById` and updates the status to `cancelled` [Confirmed] (lines 53, 68) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_cancelled.service.ts` (lines 53, 68) ``.
- **Deletion**: The `OSKUserInvitationDeleteService` handles the deletion of sent or received invitations, cleaning up associated accesses and pincodes (e.g., `OSKPincodeService.deletePincodeAnonymousAccess`) [Confirmed] (lines 53, 92, 107, 117, 145) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_delete.service.ts` (lines 53-145) ``.

### External & Onboarding Invitation Processing [Confirmed]
- **Onboarding Processing**: The `OSKUserInvitationExternalUserService` processes pending onboarding cards (`onboardingInhabitants`) and external user invitations when a user registers or logs in [Confirmed] (lines 211-234) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (lines 211-234) ``.
- **Automatic Onboarding**: If a matching onboarding card is found, it automatically adds the user as an inhabitant, updates the resident document, deletes the onboarding card, and triggers an onboarding notification email [Confirmed] (lines 284, 316, 326, 336) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (lines 284-336) ``.
- **External Unit Invitations**: The `OSKUserInvitationExternalUnitService` handles the creation and insertion of external unit invitations, sending notifications to the invitees [Confirmed] (lines 25-154) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (lines 25-154) ``.

---

#### user_notification

### Notification Token Management
- **Token Registration and Updates**: Inserts or updates FCM registration tokens for authenticated users, ensuring that tokens are uniquely mapped to devices and users `` `service_method|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService|onInsertOrUpdateNotificationToken|#1` ``. It enforces uniqueness by deleting duplicate tokens found on other devices for the same user `` `functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts` (lines 105-115) ``.
- **Token Deletion**: Deletes registration tokens when a user logs out or prunes stale tokens `` `service_method|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService|onDeleteNotificationToken|#1` ``.

### Notification Lifecycle & Delivery Orchestration
- **Notification Creation**: Creates and persists notification documents under the user's subcollection `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserNotificationController.default.create|create|userId,notificationId,options|#1` ``.
- **Delivery Delegation**: Dispatches notifications to the delivery engine (`OSKNotificationService` from the `apps/notification` module) to handle multi-channel fan-out `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKNotificationService.default.send|create|userId,notificationId,fullOptions|#1` ``.
- **Special Notifications**: Supports sending specialized notifications that bypass standard routing or require custom payloads `` `service_method|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserNotificationService|createSpecial|#1` ``.

### Unread Notification Count Tracking
- **State Synchronization**: Automatically increments the user's `unreadNotificationCount` when a new notification is successfully created `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserController.default.incrementUnreadNotificationCount|create|userId|#1` ``.
- **Self-Healing Reversion**: Reverts (decrements) the unread count if the notification delivery or document creation fails `` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 91-95) ``.
- **Trigger-Based Updates**: Listens to Firestore document updates and deletions on the user's notifications subcollection to decrement or increment the unread count when notifications are marked as read/unread or deleted `` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 146-183) ``.

### Testing Utilities
- **Test Notification Trigger**: Exposes a callable endpoint to trigger a test notification for verification of the notification pipeline `` `service_method|user|functions/src/modules/user/modules/user_notification/services/user_notification_test.service.ts|OSKUserNotificationTestService|onTestNotification|#1` ``.

---

#### user_organization

- **Retrieving Pending Invitations**: Allows users to query all pending organization invitations assigned to them `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|getCurrentUserOrganizationInvitations|#1` ``. [Confirmed]
- **Accepting Organization Invitations**: Orchestrates the acceptance workflow, which includes:
  - Fetching the user, organization, and invitation details `` `functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts` (lines 82-118) ``.
  - Generating consolidated organization user roles `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKConsolidatedRolesController.default.generateOrganizationUserRoles|userOrganizationInvitationAccepted|organizationInvitation.roles,organization.userRoles,...|#1` ``.
  - Saving the user to the organization's user list `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserController.default.save|userOrganizationInvitationAccepted|request.organizationId,user.userId,organizationUser|#1` ``.
  - Saving the organization mapping to the user's profile `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationController.default.save|userOrganizationInvitationAccepted|user.userId,request.organizationId,userOrganization|#1` ``.
  - Deleting the pending invitation from both the user's and organization's collections `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationPendingController.default.deleteUsersOrganizationInvitation|userOrganizationInvitationAccepted|user.userId,request.organizationId|#1` `` and `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationAccepted|request.organizationId,userInvitation.email|#1` ``. [Confirmed]
- **Rejecting Organization Invitations**: Handles the rejection workflow, which deletes the pending invitation from the user's collection, deletes it from the organization's active invitations, and moves it to a cancelled/rejected state `` `functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts` (lines 178-244) ``. [Confirmed]
- **Managing User Organization Requests**: Provides endpoints to get and save organization requests for a user `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts` (lines 17-30) ``. [Confirmed]
- **Managing User Organization Documents**: Provides CRUD operations for user-organization mappings `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``. [Confirmed]

#### user_pincode

The `user_pincode` capability is responsible for the following distinct features:

- **Pincode Document Creation**: Generates and persists user-scoped pincode documents for various visitor and resident types:
  - **Inhabitants**: Creates pincode documents for regular building occupants [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeInhabitantDocument|#1` ``).
  - **Guests**: Creates pincode documents for temporary guests, writing documents for both the inviter and the invited user [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeGuestDocument|#1` ``).
  - **Permanent Guests**: Creates pincode documents for recurring trusted visitors, writing documents for both the inviter and the invited user [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodePermanentGuestDocument|#1` ``).
  - **Anonymous/Quickcodes**: Creates pincode documents for anonymous or temporary quickcode recipients [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|createPincodeAnonymousDocument|#1` ``).
- **Pincode Retrieval**:
  - Retrieves all pincodes associated with a specific user ID [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|onGetUserPincodes|#1` ``).
  - Extracts raw pincode strings for a user [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService|getAllPincodeStrings|#1` ``).
  - Queries specific pincodes by access ID [Confirmed] (`` `controller_method|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController|getByAccessId|#1` ``) or custom query filters [Confirmed] (`` `controller_method|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController|getSpecificPincodesByQuery|#1` ``).
- **Pincode Deletion & Cleanup**:
  - Deletes a specific user pincode document [Confirmed] (`` `controller_method|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController|delete|#1` ``).
  - Coordinates downstream cleanup when a user pincode is deleted, including removing the corresponding building-level pincode mirror and moving it to trash [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteUserPincode|request.pincodeId,pincodeDoc.buildingId|#1` ``), and updating the resident's profile within the organization scope [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKOrganizationResidentsController.default.save|deleteUserPincode|organizationId,request.userId,residentDoc|#1` ``).
  - Supports bulk deletion of all pincodes for a user [Confirmed] (`` `controller_method|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController|deleteAll|#1` ``).

---

#### user_settings

- **Managing User Building Settings**: Handles the creation, retrieval, updating, and deletion of user-specific building settings [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|createUserSettingsBuilding|#1` ``).
- **Managing User Unit Settings**: Handles the creation, retrieval, updating, and deletion of user-specific unit settings, including the automatic generation of unit settings from inhabitant profiles [Confirmed] (`functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` (lines 63-224)).
- **Enforcing Role-Based Access Control (RBAC)**: Validates that the executing user has the appropriate organization-level settings permissions (e.g., `v1.org.settings.create`, `v1.org.settings.view`, `v1.org.settings.edit`, `v1.org.settings.delete`) before modifying unit settings [Confirmed] (`functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` (lines 30-61)).
- **Synchronizing Building Settings**: Provides internal service methods to create user-specific building settings directly from building-level settings templates [Confirmed] (`` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|createUserSettingsFromBuildingSettings|#1` ``).

### 4. Public Interfaces

#### _module_root

- **`OSKUserController`**: Extends `OSKDocumentController` to manage user document operations, unread notification counts, and profile image uploads [Confirmed] (Cite: `` `source_class|user|functions/src/modules/user/controllers/user.controller.ts|OSKUserController` ``).
- **`OSKEmailChangeController`**: Extends `OSKDocumentController` to manage email change verification documents [Confirmed] (Cite: `` `source_class|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|OSKEmailChangeController` ``).
- **`OSKUserService`**: Core service orchestrating user business logic, triggers, and external integrations [Confirmed] (Cite: `` `source_class|user|functions/src/modules/user/services/user.service.ts|OSKUserService` ``).

---

#### user_access

The capability exposes the following public controllers and services:

- **`OSKUserAccessesController`** (extends `OSKDocumentController`): Handles HTTP/REST-like document operations for user accesses under the `/users/{userId}/accesses` path `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 11-14).
- **`OSKUserBuildingUnitController`** (extends `OSKDocumentController`): Handles HTTP/REST-like document operations for user building unit mappings under the `/users/{userId}/buildings/{buildingId}/units` path `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 14-18).
- **`OSKUserAccessService`**: Internal service coordinating access setup, validation, and persistence `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (lines 32-33).

---

#### user_activity

This capability exposes the following controllers and service entry points:

### Controllers
- **`OSKUserActivitiesController`** (extends `OSKDocumentAndMessageController`): Manages the underlying Firestore operations for individual user activity documents [Confirmed, `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts|OSKUserActivitiesController`].
- **`OSKUserActivityAggregatesController`** (extends `OSKDocumentController`): Manages the underlying Firestore operations for user activity aggregates [Confirmed, `source_class|user|functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts|OSKUserActivityAggregatesController`].

### Services
- **`OSKUserActivitiesService`**: Exposes business logic for user activity management [Confirmed, `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesService`].
- **`OSKUserActivityAggregatesService`**: Exposes business logic for user activity aggregation [Confirmed, `source_class|user|functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts|OSKUserActivityAggregatesService`].

### Entry Points
- **Callable Functions**: Exposes 5 Firebase HTTPS callable triggers in `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51).

---

#### user_call

- **OSKUserCallController**: The primary controller class managing user call documents `` `source_class|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController` ``. It extends `OSKDocumentController` from the `core` module `` `imports_dependency|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|@oskey/core/controllers/document|#1` ``.
    - **Methods**:
        - `getCollectionPath(userId: string)`: Returns the Firestore path for the user's calls `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|getCollectionPath|#1` ``.
        - `set(userId: string, document: OSKUserCallDocument)`: Persists a call record `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|set|#1` ``.
        - `deleteAll(userId: string)`: Deletes all call records for the user `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|deleteAll|#1` ``.
- **Module Exports**: The capability exports `OSKUserCallController` and the model definitions (`OSKUserCall`, `OSKUserCallDocument`) via its index entry point `` `functions/src/modules/user/modules/user_call/index.ts` (lines 12-21) ``.

---

#### user_device

This capability exposes the following controllers and services:

### `OSKUserDeviceController` [Confirmed]
- **File**: `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts`
- **Description**: Extends `OSKDocumentController` to provide standard CRUD operations on user devices located under `/users/{userId}/devices` `` `functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts` (lines 12-47) ``.

### `OSKUserDeviceAccessControlDeviceTokenController` [Confirmed]
- **File**: `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts`
- **Description**: Extends `OSKDocumentController` to manage access control device tokens stored under `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens` `` `functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts` (lines 11-44) ``.

### `OSKUserDeviceService` [Confirmed]
- **File**: `functions/src/modules/user/modules/user_device/services/user_device.service.ts`
- **Description**: Orchestrates the business logic for device lists, device removal, token generation, and Firestore trigger handlers `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 35-237) ``.

#### user_intercoms

This capability exposes the following public entry points:

### Controllers
- **`OSKUserIntercomController`** (extends `OSKDocumentController`): Exposes standard document-level operations for user intercoms. (Confirmed) Cite: `` `source_class|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController` ``.
  - `getCollectionPath(userId: string)`: Returns the Firestore collection path `/users/{userId}/intercoms`. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|getCollectionPath|#1` ``.
  - `create(userId, intercomId, data)`: Creates a new user intercom document. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|create|#1` ``.
  - `get(userId, intercomId)`: Retrieves a specific user intercom document. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|get|#1` ``.
  - `getAllIntercomByUser(userId)`: Queries all intercom documents for a user. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|getAllIntercomByUser|#1` ``.
  - `update(userId, intercomId, data)`: Updates an existing user intercom document. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|update|#1` ``.
  - `delete(userId, intercomId)`: Deletes a user intercom document. Cite: `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|delete|#1` ``.

### Services
- **`OSKUserIntercomService`**: Orchestrates the business logic for user intercoms, including synchronization, ordering, and cleanup. (Confirmed) Cite: `` `source_class|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService` ``.

#### user_invitation

The capability exposes several document controllers that act as the direct data access layer for Firestore collections:

### `OSKUserInvitationBuildingController` [Confirmed]
- **Path**: `/buildings/{buildingId}/units/{unitId}/invitations` [Confirmed] (line 53) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (line 53) ``.
- **Purpose**: Manages invitations scoped to a specific building unit [Confirmed].
- **Methods**: `get`, `getSafe`, `save`, `update`, `delete`, `deleteAll`, `generateDocId` [Confirmed] (lines 25-84) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (lines 25-84) ``.

### `OSKUserInvitationExternalUserController` [Confirmed]
- **Path**: `externalUserInvitations` [Confirmed] (line 17) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (line 17) ``.
- **Purpose**: Manages invitations sent to external users who do not yet have an active account [Confirmed].
- **Methods**: `create`, `get`, `update`, `delete`, `queryCollection`, `queryOrCollection`, `getAllExternalInvitations`, `generateDocId` [Confirmed] (lines 16-72) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (lines 16-72) ``.

### `OSKUserInvitationController` [Confirmed]
- **Path**: `/users/{userId}/invitations` [Confirmed] (line 35) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (line 35) ``.
- **Purpose**: Manages invitations received by a specific user [Confirmed].
- **Methods**: `get`, `getById`, `save`, `update`, `delete`, `deleteAll`, `getAll`, `getInvitationsWithPagination`, `queryUserInvitationsCollection`, `generateDocId` [Confirmed] (lines 22-72) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (lines 22-72) ``.

### `OSKUserSentInvitationController` [Confirmed]
- **Path**: `/users/{userId}/sentInvitations` [Confirmed] (line 20) `` `functions/src/modules/user/modules/user_sent_invitation.controller.ts` (line 20) ``.
- **Purpose**: Manages invitations sent by a specific user [Confirmed].
- **Methods**: `save`, `update`, `delete`, `deleteAll`, `getById`, `getInvitationByInvitationId`, `getAll`, `getInvitationsWithPagination`, `generateDocId` [Confirmed] (lines 19-69) `` `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (lines 19-69) ``.

---

#### user_notification

This capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKUserNotificationTokenController`** `` `source_class|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController` ``: Manages direct database operations (GET, SET, QUERY, DELETE) on the `/users/{userId}/notificationTokens` subcollection. Inherits from `OSKDocumentController`.
- **`OSKUserNotificationController`** `` `source_class|user|functions/src/modules/user/modules/user_notification/controllers/user_notification.controller.ts|OSKUserNotificationController` ``: Manages direct database operations (GET, SET, QUERY, DELETE) on the `/users/{userId}/notifications` subcollection. Inherits from `OSKDocumentController`.

### Services
- **`OSKUserNotificationService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserNotificationService` ``: Orchestrates notification creation, unread count tracking, and handles Firestore trigger events.
- **`OSKUserNotificationTokenService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService` ``: Implements business logic for registering, updating, and deleting FCM tokens.
- **`OSKUserNotificationTestService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification_test.service.ts|OSKUserNotificationTestService` ``: Provides test execution endpoints for the notification pipeline.

---

#### user_organization

- `OSKUserOrganizationInvitationPendingController` (extends `OSKDocumentController`): Exposes methods to query, get, and delete pending invitations `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController|#1` ``.
- `OSKUserOrganizationRequestController` (extends `OSKDocumentController`): Exposes methods to get and save user organization requests `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController|#1` ``.
- `OSKUserOrganizationController` (extends `OSKDocumentController`): Exposes methods to get, query, save, update, and delete user organization mappings `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts|OSKUserOrganizationController|#1` ``.
- `OSKUserOrganizationInvitationService`: Service layer coordinating invitation acceptance, rejection, and retrieval `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationService|#1` ``.
- `OSKUserOrganizationRequestService`: Service layer for organization requests `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_request.service.ts|OSKUserOrganizationRequestService|#1` ``.
- `OSKUserOrganizationService`: Service layer for user organization mappings `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization.service.ts|OSKUserOrganizationService|#1` ``.

#### user_pincode

This capability exposes the following public entry points and controllers:

- **Callable Cloud Functions**: Exposes two Firebase HTTPS callable functions as entry points for client applications [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/index.ts` (lines 32-38) ``):
  - `onGetUserPincodes`: Retrieves pincodes for a user [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_pincode/index.ts|onGetUserPincodes|#1` ``).
  - `deleteUserPincode`: Deletes a specific pincode and triggers downstream cleanup [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_pincode/index.ts|deleteUserPincode|#1` ``).
- **OSKUserPincodeController**: A document controller extending `OSKDocumentController` that directly manages Firestore operations on the user pincodes collection [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController` ``).
- **OSKUserPincodeService**: A service class containing the core business logic for pincode document creation, retrieval, and deletion orchestration [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserPincodeService` ``).

---

#### user_settings

- **OSKUserSettingsBuildingController** (extends `OSKDocumentController`): Exposes the primary database operations for user building settings documents [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|OSKUserSettingsBuildingController` ``).
- **OSKUserSettingsUnitController** (extends `OSKDocumentController`): Exposes the primary database operations for user unit settings documents [Confirmed] (`` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts|OSKUserSettingsUnitController` ``).
- **getCallableFunctionTriggers**: Exposes the callable HTTPS entry points for managing user building settings via Cloud Functions [Confirmed] (`` `function_declaration|user|functions/src/modules/user/modules/user_settings/index.ts|getCallableFunctionTriggers|#1` ``).

### 5. Internal Structure

*Note: This section contains the cross-cutting intra-module coupling analysis derived from AST import resolution.*

The `user` module is highly modularized, split into 10 distinct submodules [Confirmed]. The `_module_root` acts as the central orchestrator, maintaining outbound coupling to almost all submodules (`user_access`, `user_activity`, `user_call`, `user_device`, `user_invitation`, `user_notification`, `user_organization`, `user_pincode`, and `user_settings`) to manage the lifecycle and deletion cascades of a user [Confirmed].

Inbound coupling back to `_module_root` exists from `user_access`, `user_activity`, `user_invitation`, `user_notification`, `user_organization`, and `user_settings` to fetch or validate core user profile data [Confirmed].

Specific functional coupling exists between sibling submodules [Confirmed]:
- `user_device` depends on `user_access` (`OSKUserAccessesController`) to update access device tokens.
- `user_invitation` depends on `user_access` (for access types), `user_notification` (to send notifications), and `user_pincode` (to create pincodes for invited guests).
- `user_activity` depends on `user_call` to link call documents to activity logs.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the cross-cutting data ownership conclusion.*

The `user` module is the absolute owner of the `/users/{userId}` root collection and all its subcollections [Confirmed]. While other modules (such as `admin`, `building`, `call`, `core`, `organization`, and `unit_management`) frequently read or write to these paths (as shown by the Data Ownership Hints where `OSKUserController` has 7 inbound cross-module callers, and `OSKUserAccessesController` has 5), the `user` module remains the authoritative owner [Inferred]. These external modules call into the `user` module's controllers rather than writing directly to Firestore, which is strictly enforced by Firestore rules where client writes are blocked, and backend writes are routed through the `user` module's services [Inferred].

**Per-capability evidence:**

#### _module_root

- **`/users/{userId}`**: TouchType: partial/literal, operation: get/update/delete [Confirmed] (Cite: `` `firestore_path_touched|user|functions/src/modules/user/controllers/user.controller.ts|{OSKUserController.collection}/{userId}|#1` ``, `` `firestore_path_touched|user|functions/src/modules/user/index.ts|/users/{userId}|#1` ``, `` `firestore_path_touched|user|functions/src/modules/user/services/user.service.ts|users|#1` ``).
- **`/changeEmail/{userId}`**: TouchType: partial, operation: get/save/delete [Inferred] (Cite: `` `imports_dependency|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|../models/documents/changeEmail.model|#1` ``).

---

#### user_access

This capability manages and owns the state of the following Firestore paths:

#### `/users/{userId}/accesses`
- **Operation Scope**: Read, Write, Query, Delete [Confirmed].
- **Controller**: `OSKUserAccessesController` `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 11-14).
- **Schema Fields**: Matches `Collection Path: /users/{id}/accesses` in the Firestore Schema document, containing fields like `buildingId`, `userFirstName`, `accesses`, `buildingStreetAddress`, `buildingName`, `creationDate`, `userLastName`, and `userId`.

#### `/users/{userId}/buildings/{buildingId}/units`
- **Operation Scope**: Create, Read, Write, List, Delete [Confirmed].
- **Controller**: `OSKUserBuildingUnitController` `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 14-18).
- **Schema Fields**: Subcollection mapping users to specific units within a building.

---

#### user_activity

This capability owns and manages the following Firestore paths:

### `/users/{userId}/activities/{activityId}`
- **Operations**: Read, Write, Delete [Confirmed, `functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts` (lines 12-52)].
- **Description**: Stores individual enriched activity documents for a specific user.

### `/users/{userId}/activityAggregates/{buildingId}`
- **Operations**: Read, Write, Delete [Confirmed, `functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts` (lines 16-68)].
- **Description**: Stores consolidated activity aggregates for a user, partitioned by building.

---

#### user_call

This capability owns and manages the user-scoped call history subcollection [Confirmed]:
- **Firestore Path**: `/users/{userId}/calls/{callId}`
- **Document Schema (`OSKUserCall`)** `` `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` (lines 12-27) ``:
    - `startTime`: `Timestamp` (Firestore timestamp indicating when the call started)
    - `endTime`: `Timestamp` (Firestore timestamp indicating when the call ended)
    - `status`: `string` (The final status of the call, e.g., completed, missed)
    - `buildingId`: `string` (The ID of the building where the call originated)
    - `contactId`: `string` (The ID of the contact/intercom directory entry called)
    - `callId`: `string` (The unique identifier of the call session)
    - `callerId`: `string` (The identifier of the caller)
    - `callerType`: `string` (The type of caller, e.g., visitor, resident)
    - `unitId`: `string` (The ID of the target residential unit)
    - `callDuration`: `number` (The duration of the call in seconds)
    - `callPictureName`: `string` (The filename of any captured call snapshot/image)
    - `activityId`: `string` (The associated activity log ID)

---

#### user_device

### Firestore Paths Touched [Confirmed]

| Path | Operation | Detection Scope | Method |
| --- | --- | --- | --- |
| `/users/{userId}/devices/{deviceId}` | Undetermined (may be indirect) | Undetermined | `resolved_constant` |

*Note: The path `/users/{userId}/devices/{deviceId}` is explicitly referenced by the Firestore triggers `` `firestore_path_touched|user|functions/src/modules/user/modules/user_device/index.ts|/users/{userId}/devices/{deviceId}|#1` ``.*

#### user_intercoms

This capability owns and manages documents within the following Firestore collection path:

### `/users/{userId}/intercoms/{intercomId}`
- **Operation Detection Scope**: Document-level CRUD operations. (Confirmed) Cite: `` `functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts` (lines 13-41) ``.
- **Schema Fields**:
  - `accessControlDeviceId`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|accessControlDeviceId|#1` ``.
  - `ACDName`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|ACDName|#1` ``.
  - `buildingId`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|buildingId|#1` ``.
  - `callSettingsMode`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callSettingsMode|#1` ``.
  - `callTimeSlots`: *any* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTimeSlots|#1` ``.
  - `callTransferList`: *array* of `OSKUserIntercomCallTransferListItem` (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTransferList|#1` ``.
  - `displayName`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|displayName|#1` ``.
  - `doorName`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|doorName|#1` ``.
  - `inhabitants`: *array* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|inhabitants|#1` ``.
  - `unitId`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitId|#1` ``.
  - `unitNumber`: *string* (Confirmed) Cite: `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitNumber|#1` ``.

#### user_invitation

### Firestore Paths Touched [Confirmed]
The capability directly manages and writes to the following Firestore paths:

| Path | Touch Type | Operation Detection Scope | Path Resolution Method |
| :--- | :--- | :--- | :--- |
| `/users/{userId}/sentInvitations` | `path_reference` | `undetermined_may_be_indirect` | `partial` |

*Note: The following paths are also managed directly by the controllers within this capability:*
- `/buildings/{buildingId}/units/{unitId}/invitations` [Confirmed] (line 53) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (line 53) ``.
- `/users/{userId}/invitations` [Confirmed] (line 35) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (line 35) ``.
- `externalUserInvitations` [Confirmed] (line 17) `` `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (line 17) ``.

---

#### user_notification

This capability owns and directly manages the following Firestore paths:

| Firestore Path | Touch Type | Operation Detection Scope | Detection Method |
| :--- | :--- | :--- | :--- |
| `/users/{userId}/notifications/{notificationId}` | Path Reference | Undetermined (may be indirect) | Resolved Constant `` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` `` |
| `/users/{userId}/notificationTokens/{tokenId}` | Path Reference | Indirect (via `OSKUserNotificationTokenController`) | Resolved Constant `` `call_expression|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController.default._set|save|`/users/${userId}/notificationTokens`,tokenId,data|#1` `` |

---

#### user_organization

- **Firestore Paths**:
  - `/users/${userId}/organizationInvitations` (Operation Scope: Read, Delete) - Managed by `OSKUserOrganizationInvitationPendingController` `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts` (lines 18-39) ``.
  - `/users/${userId}/organizationRequests` (Operation Scope: Read, Write/Set) - Managed by `OSKUserOrganizationRequestController` `` `functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts` (lines 17-30) ``.
  - `/users/${userId}/organizations` (Operation Scope: Read, Write/Set, Update, Delete) - Managed by `OSKUserOrganizationController` `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``.
  - `/organizations/{organizationId}/users` (Operation Scope: Write/Save) - Written to when accepting an invitation `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserController.default.save|userOrganizationInvitationAccepted|request.organizationId,user.userId,organizationUser|#1` ``.
  - `/organizations/{organizationId}/userInvitations` (Operation Scope: Delete) - Deleted when accepting or rejecting an invitation `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationAccepted|request.organizationId,userInvitation.email|#1` ``.
  - `/organizations/{organizationId}/userInvitationsCancelled` (Operation Scope: Write/Move) - Written to when rejecting an invitation `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.moveOrganizationUserInvitation|userOrganizationInvitationRejected|request.organizationId,findUsersInvitation.email,findOrganizationsInvitation|#1` ``.

#### user_pincode

#### Firestore Collections & Paths
This capability owns and directly writes to the following Firestore collection path:

- `/users/{userId}/pincodes/{pincodeId}` [Confirmed] (`` `controller_method|user|functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts|OSKUserPincodeController|getCollectionPath|#1` ``)
  - **Operations**: Read (`get`, `getAll`, `_query`), Write (`set`), Delete (`delete`, `deleteAll`) [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` ``).
  - **Schema Fields**: Aligns with the `/users/{id}/pincodes` schema in the Firestore schema document:
    - `pincode`: `string`
    - `buildingId`: `string`
    - `creationDate`: `timestamp`
    - `type`: `string`
    - `userId`: `string`
    - `accessId`: `string`

#### Indirectly Modified Paths (Cross-Module)
The capability performs indirect modifications on other collections via external services:
- `/buildings/{buildingId}/pincodes/{pincodeId}`: Deleted via `OSKPincodeService` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteUserPincode|request.pincodeId,pincodeDoc.buildingId|#1` ``).
- `/organizations/{organizationId}/residents/{residentId}`: Updated via `OSKOrganizationResidentsController` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKOrganizationResidentsController.default.save|deleteUserPincode|organizationId,request.userId,residentDoc|#1` ``).

---

#### user_settings

This capability owns and manages documents within the following Firestore paths:
- **`/users/{userId}/buildingSettings/{buildingId}`** [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|OSKUserSettingsBuildingController.default.getCollectionPath|set|userId|#1` ``)
  - Stores building-level settings customized for a specific user.
- **`/users/{userId}/buildingSettings/{buildingId}/unitSettings/{unitId}`** [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts|this.getCollectionPath|set|userId,buildingId|#1` ``)
  - Stores unit-level settings customized for a specific user within a building.

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

### API Contracts (Callable Functions)
- **`deleteUserProfileImage`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|deleteUserProfileImage|#1` ``)
- **`getCurrentUserUnits`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|getCurrentUserUnits|#1` ``)
- **`getInhabitantType`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|getInhabitantType|#1` ``)
- **`getUserIdsByEmailOrPhone`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|getUserIdsByEmailOrPhone|#1` ``)
- **`initiateEmailChange`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|initiateEmailChange|#1` ``)
- **`initiatePhoneNumberChange`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|initiatePhoneNumberChange|#1` ``)
- **`onUpdatePhoneNumberCalled`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|onUpdatePhoneNumberCalled|#1` ``)
- **`onUpdatePublicProfileCalled`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|onUpdatePublicProfileCalled|#1` ``)
- **`onUpdateUserOnboardingStatusCalled`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserOnboardingStatusCalled|#1` ``)
- **`onUpdateUserProfileAndPhoneNumberCalled`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserProfileAndPhoneNumberCalled|#1` ``)
- **`onUpdateUserSettingsLanguageCalled`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserSettingsLanguageCalled|#1` ``)
- **`requestMyAccountDeletion`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|requestMyAccountDeletion|#1` ``)
- **`verifyAndCompleteEmailChange`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|verifyAndCompleteEmailChange|#1` ``)
- **`verifyAndCompletePhoneNumberChange`** [Confirmed] (Cite: `` `api_contract|user|functions/src/modules/user/index.ts|verifyAndCompletePhoneNumberChange|#1` ``)

### Resolved API Request/Response Schemas

#### `getInhabitantType`
- **Request Type**: `OSKGetInhabitantTypeRequest`
  - `buildingId`: `string`
  - `unitId`: `string`
  - `userId`: `string`
- **Response Type**: `OSKGetInhabitantTypeResponse`
  - `inhabitantType`: `OSKBuildingUnitInhabitantType`

#### `getUserIdsByEmailOrPhone`
- **Request Type**: `OSKGetUsersByEmailOrPhoneNumberRequestData`
  - `email`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
  - `userId`: `string`
- **Response Type**: `OSKGetUsersByEmailOrPhoneNumberResponseData`
  - `duplicateFinds`: `{ userIdFound: string; phoneNumber?: OSKPhoneNumber | undefined; email: string; }[] | undefined` (optional)
  - `email`: `string`
  - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
  - `userIdFound`: `string`

#### `initiateEmailChange`
- **Request Type**: `OSKUserInitiateEmailChangeRequest`
  - `newEmail`: `string`

#### `initiatePhoneNumberChange`
- **Request Type**: `OSKUserInitiatePhoneChangeRequest`
  - `newPhoneNumber`: `string`

#### `onUpdatePublicProfileCalled`
- **Request Type**: `OSKUserUpdatesPublicProfileRequest`
  - `firstName`: `string`
  - `lastName`: `string`
  - `userId`: `string`

#### `onUpdateUserOnboardingStatusCalled`
- **Request Type**: `OSKUserUpdatesOnboardingStatusRequest`
  - `apiVersion`: `string`
  - `newUserOnboarding`: `{ activateBuildingAccess?: OSKOnboardingStatus | undefined; enrollMFA?: OSKOnboardingStatus | undefined; }`
  - `userId`: `string`

#### `onUpdateUserProfileAndPhoneNumberCalled`
- **Request Type**: `OSKUpdateUserProfileAndPhoneNumberRequestData`
  - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
  - `publicProfile`: `OSKUserUpdatesPublicProfileRequest`

#### `onUpdateUserSettingsLanguageCalled`
- **Request Type**: `OSKUserUpdatesLanguageRequest`
  - `language`: `string`
  - `userId`: `string`

#### `verifyAndCompleteEmailChange`
- **Request Type**: `OSKUserVerifyAndCompleteEmailChangeRequest`
  - `code`: `string`

#### `verifyAndCompletePhoneNumberChange`
- **Request Type**: `OSKUserVerifyAndCompletePhoneNumberChangeRequest`
  - `code`: `string`
  - `phoneNumber`: `OSKPhoneNumber`

### Firestore Triggers
- **`onDocumentCreated`** (on `/users/{userId}`): Triggers when a user document is created [Confirmed] (Cite: `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1` ``).
- **`onDocumentUpdated`** (on `/users/{userId}`): Triggers when a user document is updated, cascading public profile changes [Confirmed] (Cite: `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentUpdated|#1` ``).

### Auth Triggers
- **`onAccountCreated`** (Firebase Auth `onCreate`): Triggers when a Firebase Auth account is created [Confirmed] (Cite: `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1` ``).
- **`onAccountDeleted`** (Firebase Auth `onDelete`): Triggers when a Firebase Auth account is deleted, initiating the cascade [Confirmed] (Cite: `` `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountDeleted|#1` ``).

### Scheduled Triggers
- **`onDeleteAccount`** (scheduled daily at midnight `'00 00 * * *'`): Triggers daily account deletion checks [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/index.ts|OSKUserService.onDeleteAccount|getScheduledFunctionTriggers||#1` ``).

---

#### user_access

*No API contracts or Firestore triggers are explicitly evidenced in this capability pack.* [Confirmed]

---

#### user_activity

### Callable Functions
The following callable functions are exported by this capability [Confirmed, `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51)]:

#### `delete`
- **Request Type**: `OSKDeleteActivityByIdRequest`
  - `activityId`: `string`
  - `userId`: `string`

#### `deleteAll`
- **Request Type**: `OSKDeleteAllUserActivitiesRequest`
  - `userId`: `string`

#### `getActivityByBuildingId`
- **Request Type**: `OSKGetUserActivityAggregatesByBuildingIdRequest`
  - `buildingId`: `string`
  - `userId`: `string`

#### `getActivityById`
- **Request Type**: `OSKGetUserActivityByIdRequest`
  - `activityId`: `string`
  - `userId`: `string`

#### `getAllUserActivities`
- **Request Type**: `OSKGetAllUserActivitiesRequest`
  - `userId`: `string`

*Note: No Firestore triggers are defined in this submodule's index file [Confirmed, `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51)].*

---

#### user_call

*(No direct API contracts or Firestore triggers are defined within this capability's evidence pack.)*

---

#### user_device

### Callable Cloud Functions [Confirmed]

#### `getDevicesUserList`
- **File**: `functions/src/modules/user/modules/user_device/index.ts` (lines 38-53)
- **Request Type**: `OSKGetUserDeviceListRequestData`
  - `userId`: `string`
- **Response Type**: *No matching model_property facts in this pack to represent the response schema.*

#### `removeUserDevice`
- **File**: `functions/src/modules/user/modules/user_device/index.ts` (lines 54-71)
- **Request Type**: `OSKRemoveUserDeviceRequestData`
  - `deviceId`: `string`
  - `userId`: `string`
- **Response Type**: *No matching model_property facts in this pack to represent the response schema.*

---

### Firestore Triggers [Confirmed]

The following triggers are registered on the path `/users/{userId}/devices/{deviceId}` `` `functions/src/modules/user/modules/user_device/index.ts` (lines 43-45) ``:

- **`onDocumentCreated`**: Triggered on document creation. Refreshes user accesses and logs the event `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 73-115) ``.
- **`onDocumentUpdated`**: Triggered on document updates. Refreshes user accesses if device properties change `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 117-140) ``.
- **`onDocumentDeleted`**: Triggered on document deletion. Deletes all associated `accessControlDeviceTokens` and refreshes user accesses `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 142-167) ``.

#### user_intercoms

- No API contracts (`api_contract` facts) are directly defined in this capability's pack. (Confirmed)
- No Firestore triggers are directly defined in this capability's pack. (Confirmed)

#### user_invitation

### Callable Cloud Functions [Confirmed]
All entry points are exposed as Firebase Callable Functions [Confirmed] (lines 84-99) `` `functions/src/modules/user/modules/user_invitation/index.ts` (lines 84-99) ``:

#### `createUserInvitation` [Confirmed]
- **Request Type**: `OSKUserInvitationCreateRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationCreationService.createUserInvitation` [Confirmed] (line 87) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 87) ``.

#### `deleteInvitation` [Confirmed]
- **Request Type**: `OSKUserInvitationDeleteRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationDeleteService.deleteInvitation` [Confirmed] (line 97) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 97) ``.

#### `editInvitation` [Confirmed]
- **Request Type**: `OSKUserInvitationUpdateRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationEditService.editInvitation` [Confirmed] (line 96) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 96) ``.

#### `getExternalUserInvitation` [Confirmed]
- **Request Type**: `OSKUserExternalUserRequestGet`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationExternalUserService.getExternalUserInvitation` [Confirmed] (line 88) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 88) ``.

#### `inviteeAcceptsInvitation` [Confirmed]
- **Request Type**: `OSKInvitationReplyRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationAcceptedService.inviteeAcceptsInvitation` [Confirmed] (line 93) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 93) ``.

#### `inviteeRejectsInvitation` [Confirmed]
- **Request Type**: `OSKInvitationReplyRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationRejectedService.inviteeRejectsInvitation` [Confirmed] (line 94) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 94) ``.

#### `inviterCancelsInvitation` [Confirmed]
- **Request Type**: `OSKInvitationReplyRequest`
- **Response Type**: `void` (Implicit promise resolution)
- **Handler**: `OSKUserInvitationCancelledService.inviterCancelsInvitation` [Confirmed] (line 95) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 95) ``.

#### `onGetAllInvitationsByUser` [Confirmed]
- **Request Type**: `OSKUserInvitationGetAllRequest`
- **Response Type**: `OSKUserInvitationGetAllResponse`
- **Handler**: `OSKUserInvitationCommonService.onGetAllInvitationsByUser` [Confirmed] (line 92) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 92) ``.

#### `processExternalUserInvitations` [Confirmed]
- **Request Type**: `OSKUserProcessExternalUserInvitationsRequest`
- **Response Type**: `OSKUserProcessExternalUserInvitationsResponse`
- **Handler**: `OSKUserInvitationExternalUserService.processExternalUserInvitations` [Confirmed] (line 89) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 89) ``.

### Firestore Triggers [Confirmed]
There are no Firestore triggers (`onWrite`, `onCreate`, etc.) defined within this capability's pack [Confirmed].

---

#### user_notification

### API Contracts (Callable Functions)

#### `onDeleteNotificationToken`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onDeleteNotificationToken|#1` ``
- **Request Schema**: `OSKUserNotificationTokenDeleteRequest`
  - `tokenId`: `string`
  - `userId`: `string`

#### `onInsertOrUpdateNotificationToken`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onInsertOrUpdateNotificationToken|#1` ``
- **Request Schema**: `OSKUserNotificationToken`
  - `tokenId`: `string`
  - `userId`: `string`

#### `onTestNotification`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onTestNotification|#1` ``
- **Request Schema**: *No explicit schema matched in model properties; processes `request.userId` dynamically.*

---

### Firestore Triggers

#### `onDocumentUpdated`
- **Trigger Path**: `/users/{userId}/notifications/{notificationId}` `` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` ``
- **Handler**: `OSKUserNotificationService.onDocumentUpdated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``
- **Description**: Monitors updates to notification documents. If a notification's `hasBeenRead` status transitions from `false` to `true`, it decrements the user's unread count `` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 155-159) ``. If it transitions from `true` to `false`, it increments the unread count `` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 163-167) ``.

#### `onDocumentDeleted`
- **Trigger Path**: `/users/{userId}/notifications/{notificationId}` `` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#2` ``
- **Handler**: `OSKUserNotificationService.onDocumentDeleted` `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``
- **Description**: Monitors deletions of notification documents. If an unread notification is deleted, it decrements the user's `unreadNotificationCount` `` `functions/src/modules/user/modules/user_notification/services/user_notification.service.ts` (lines 178-181) ``.

---

#### user_organization

- **Callable Functions**:
  - `getCurrentUserOrganizationInvitations`: Retrieves pending invitations for the current user `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|getCurrentUserOrganizationInvitations|#1` ``.
    - *Request/Response Schema*: No `model_property` facts matched within this pack for this endpoint's request/response.
  - `userOrganizationInvitationAccepted`: Accepts an invitation `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|userOrganizationInvitationAccepted|#1` ``.
    - *Request Type*: `OSKUserOrganizationInvitationPendingRequest`
      - `isApproved`: `boolean` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|isApproved|#1` ``
      - `organizationId`: `string` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|organizationId|#1` ``
      - `userId`: `string` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|userId|#1` ``
  - `userOrganizationInvitationRejected`: Rejects an invitation `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|userOrganizationInvitationRejected|#1` ``.
    - *Request Type*: `OSKUserOrganizationInvitationPendingRequest`
      - `isApproved`: `boolean` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|isApproved|#1` ``
      - `organizationId`: `string` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|organizationId|#1` ``
      - `userId`: `string` `` `model_property|user|functions/src/modules/user/modules/user_organization/models/functions/user_organization_invitation_pending_request_document.model.ts|OSKUserOrganizationInvitationPendingRequest|userId|#1` ``

#### user_pincode

#### Callable API Contracts
The following callable APIs are defined and resolved within this capability:

##### `deleteUserPincode`
- **Request Schema**: `OSKUserPincodeDeleteRequest`
  - `pincodeId`: `string`
  - `userId`: `string`
- **Response Schema**: Not explicitly defined in the model properties (returns a standard HTTPS response) [Inferred] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (lines 162-198) ``).

##### `onGetUserPincodes`
- **Request Schema**: `OSKUserPincodeGetRequest`
  - `userId`: `string`
- **Response Schema**: Not explicitly defined in the model properties (returns an array of pincode documents) [Inferred] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (lines 143-160) ``).

#### Firestore Triggers
No Firestore triggers are owned or declared by this capability [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/index.ts` ``).

---

#### user_settings

### Callable APIs
- **createUserSettingsBuilding** [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|createUserSettingsBuilding|#1` ``)
  - **Request Type**: `OSKUserCreateSettingsBuildingRequest`
    - `buildingId`: `string`
    - `buildingSettingsInputParams`: `import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams`
    - `userId`: `string`
- **deleteUserSettingsBuilding** [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|deleteUserSettingsBuilding|#1` ``)
  - **Request Type**: `OSKUserDeleteSettingsBuildingRequest`
    - `buildingId`: `string`
    - `userId`: `string`
- **getAllUserSettingsBuilding** [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getAllUserSettingsBuilding|#1` ``)
  - **Request Type**: `OSKUserGetAllSettingsBuildingRequest`
    - `userId`: `string`
- **getUserSettingsBuilding** [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|getUserSettingsBuilding|#1` ``)
  - **Request Type**: `OSKUserGetSettingsBuildingRequest`
    - `buildingId`: `string`
    - `userId`: `string`
- **updateUserSettingsBuilding** [Confirmed] (`` `api_contract|user|functions/src/modules/user/modules/user_settings/index.ts|updateUserSettingsBuilding|#1` ``)
  - **Request Type**: `OSKUserUpdateSettingsBuildingRequest`
    - `buildingId`: `string`
    - `update`: `Partial<import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams>`
    - `userId`: `string`

### Firestore Triggers
No Firestore triggers are defined within this capability's evidence pack [Confirmed].

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains the cross-cutting security and risk analysis.*

#### Security Enforcement Asymmetry
There is a stark asymmetry in security enforcement across the submodules [Inferred]. While `user_settings` strictly enforces administrative RBAC permissions (`v1.org.settings.create`, `v1.org.settings.delete`, `v1.org.settings.edit`, `v1.org.settings.view`) [Confirmed], almost all other submodules (`user_access`, `user_device`, `user_pincode`, `user_invitation`) perform highly sensitive operations (creating credentials, granting physical door access, deleting devices) without checking any RBAC permissions in code [Confirmed]. Instead, they rely entirely on user-scoped identity checks (`@OSKUserSecurityChecks`) or client-side Firestore rules [Inferred]. This means administrative actions on these subcollections (e.g., by a Property Manager or Admin) are either not supported via these code paths or bypass RBAC checks at the service layer, relying entirely on the caller's context or Admin SDK bypass [Inferred].

#### Unattributed Security Signals
- `user_device` raises 2 `permission-denied` errors with no identifiable RBAC string behind them (occurring in `user_device.service.ts` lines 49 and 66) [Confirmed].
- `user_notification` raises 1 `permission-denied` error with no identifiable RBAC string behind it (occurring in `user_notification_token.service.ts` when a user attempts to modify tokens not belonging to their `userId`) [Confirmed].

#### RBAC Mismatches
- The permission string `v1.org.admin` is checked as a candidate permission in `user_building_settings.service.ts` but is completely missing from the official `rbac-roles.json` schema [Confirmed].

**Per-capability evidence:**

#### _module_root

- **Permissions Referenced**: No explicit RBAC permission strings (like `v1.org.*` or `v1.admin.*`) are directly referenced in the `_module_root` evidence pack [Confirmed].
- **Security Checks**: Uses `@OSKUserSecurityChecks` decorator and `OSKSecurityChecks.checkParameters` for parameter validation and user identity matching [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKUserSecurityChecks|deleteUserProfileImage||#1` ``, `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKSecurityChecks.checkParameters|_getInhabitantType|[             { name: 'userId', value: userId, type: 'string' },             { name: 'buildingId', value: buildingId, type: 'string' },             { name: 'unitId', value: unitId, type: 'string' },         ]|#1` ``).
- **App Check**: Enforces App Check verification on callable triggers unless running in emulator mode [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

#### user_access

#### Firestore Security Rules
According to `firestore.rules.txt`:
- **`/users/{userId}/accesses/{accessId}`**:
  - `read`: Allowed if the user is authenticated and matches the `userId` (`isAuthenticatedUser(userId)`) [Confirmed].
  - `write`: Disallowed directly from the client (`allow write: if false`) [Confirmed].
- **`/users/{userId}/accesses/personalization/{personalizationId}`**:
  - `read`: Allowed if `isAuthenticatedUser(userId)` [Confirmed].
  - `write`: Allowed if `isAuthenticatedUser(userId)`, the access is not an invitation, and the `accessId` matches the `personalizationId` [Confirmed].
- **`/users/{userId}/buildings/{buildingId}/units/{unitId}`**:
  - `read`: Allowed if `isAuthenticatedUser(userId)` [Confirmed].
  - `write`: Disallowed directly from the client (`allow write: if false`) [Confirmed].

#### RBAC Roles Alignment
The following administrative permissions defined in `rbac-roles.json` align with the backend capabilities of this module (though not explicitly checked in the client-side Firestore rules):
- `v1.admin.user.accesses.create`
- `v1.admin.user.accesses.delete`
- `v1.admin.user.accesses.list`
- `v1.admin.user.accesses.view`

---

#### user_activity

### Security Checks
The service methods use the `@OSKUserSecurityChecks` decorator to enforce that the caller has permission to access or modify the target user's activity data [Confirmed, `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54, 67, 80, 89)].

This aligns with the Firestore security rules, which restrict read/write access to `/users/{userId}/**` subcollections to the authenticated user themselves (`request.auth.uid == userId`) [Confirmed, `governance/reference-docs/firestore.rules.txt` (lines 512-540)]. No administrative RBAC permissions (e.g., `v1.admin...`) are referenced in this submodule's code [Confirmed].

---

#### user_call

- **Firestore Security Rules**:
    - According to the system's Firestore rules, users are permitted to read their own call history if they are authenticated [Confirmed]:
      ```javascript
      match /users/{userId}/calls/{callId} {
        allow read: if(isAuthenticatedUser(userId))
      }
      ```
    - There are no client-write permissions allowed for `/users/{userId}/calls` in the Firestore rules [Confirmed]. This aligns with the architecture where call records are written exclusively by backend services (such as `OSKUserCallController` executing via Admin SDK privileges) [Inferred].

---

#### user_device

### Permission Strings Referenced [Inferred]
The service methods throw `permission-denied` errors when security checks fail `` `functions/src/modules/user/modules/user_device/services/user_device.service.ts` (lines 49, 66) ``. 

According to the RBAC roles document, the following permissions govern user device administration:
- `v1.admin.user.devices.delete` (Allows to delete a user device)
- `v1.admin.user.devices.edit` (Allows to edit a user device)
- `v1.admin.user.devices.list` (Allows to view the list of user devices)
- `v1.admin.user.devices.view` (Allows to view the details of a user device)

### Firestore Rules Alignment [Confirmed]
The `firestore.rules.txt` file aligns with this capability's data model:
- `/users/{userId}/devices/{deviceId}` allows `create` if `isValidUserDeviceCreation(deviceId)`, `update` if `isValidUserDeviceUpdate()`, and `delete` if `isAuthenticatedUser(userId)`.
- `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens/{tokenId}` allows `read` if `isAuthenticatedUser(userId)`.

#### user_intercoms

- **Firestore Security Rules**:
  - According to `firestore.rules.txt`, client-side access to `/users/{userId}/intercoms/{intercomId}` is restricted to **read-only** for the authenticated owner of the user account:
    ```javascript
    match /intercoms/{intercomId} {
      allow read: if(isAuthenticatedUser(userId))
    }
    ```
  - No client-side `write` rules are defined for this collection. (Confirmed)
  - **Security Mismatch/Finding**: Since client-side writes are blocked, all mutations (creates, updates, deletes) to `/users/{userId}/intercoms/{intercomId}` must be performed strictly by backend services (such as `OSKUserIntercomService` running in an admin SDK context). (Confirmed)

#### user_invitation

### Security Decorators & Parameter Checks [Confirmed]
- **User Security Checks**: The `@OSKUserSecurityChecks` decorator is applied to several entry points to enforce user-level security boundaries [Confirmed] (line 184) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (line 184) ``.
- **Parameter Validation**: `OSKSecurityChecks.checkParameters` is used to validate incoming request payloads [Confirmed] (line 189) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (line 189) ``.
- **App Check Verification**: Programmatic checks are performed to ensure that sensitive state-changing functions are called from an App Check verified application [Confirmed] (line 29) `` `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 29) ``.

### RBAC Alignment [Confirmed]
While the RBAC roles document defines administrative permissions for user invitations (e.g., `v1.admin.user.invitations.delete`, `v1.admin.user.invitations.list`, `v1.admin.user.invitations.view`), these are not explicitly referenced in the code facts of this submodule. The submodule relies primarily on user-scoped security checks (`OSKUserSecurityChecks`) and App Check verification [Confirmed].

---

#### user_notification

### App Check Verification
- **Enforcement**: App Check is enforced on all callable triggers in non-emulator environments to prevent unauthorized API abuse `` `call_expression|user|functions/src/modules/user/modules/user_notification/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.
- **Precondition Checks**: Token services explicitly verify App Check validity and throw `failed-precondition` errors if verification fails `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onInsertOrUpdateNotificationToken|'Failed-precondition: The function must be called from an App Check verified app.'|#1` ``.

### Authentication & Authorization
- **Session Verification**: Ensures the caller is authenticated before executing token modifications, throwing `unauthenticated` errors if missing `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onInsertOrUpdateNotificationToken|'Unauthenticated: You must be authenticated to use onInsertOrUpdateNotificationToken()',{ context }|#1` ``.
- **User-Scoped Authorization**: Enforces that users can only register, update, or delete tokens belonging to their own `userId` `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onInsertOrUpdateNotificationToken|'Permission-denied: You are not authorized to add or update user registration tokens.',{ request, context }|#1` ``.

---

#### user_organization

- App Check verification is enforced on callable functions unless running in emulator mode (`process.env.OSK_FIREBASE_EMULATOR`) `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]
- No explicit RBAC permission strings are directly checked or referenced in the facts of this submodule. However, the capability interacts with role generation via `OSKConsolidatedRolesController.default.generateOrganizationUserRoles` `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKConsolidatedRolesController.default.generateOrganizationUserRoles|userOrganizationInvitationAccepted|organizationInvitation.roles,organization.userRoles,...|#1` ``. [Confirmed]

#### user_pincode

#### Security Decorators & Parameter Validation
- **User-Scoped Security**: The callable endpoints `deleteUserPincode` and `onGetUserPincodes` are decorated with `@OSKUserSecurityChecks` [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKUserSecurityChecks|deleteUserPincode||#1` ``). This decorator enforces that the authenticated user has the authority to manage the requested `userId`'s resources, aligning with the Firestore security rules for `/users/{userId}/pincodes/{pincodeId}` which restrict access to the authenticated owner (`isAuthenticatedUser(userId)`) [Inferred] (`` `firestore.rules.txt` ``).
- **Parameter Validation**: Uses `OSKSecurityChecks.checkParameters` to validate incoming request parameters (such as `context`, `userId`, and `pincodeId`) before executing business logic [Confirmed] (`` `call_expression|user|functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts|OSKSecurityChecks.checkParameters|deleteUserPincode|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },             { name: 'pincodeId', value: request.pincodeId, type: 'string' },         ]|#1` ``).

#### RBAC Cross-Check
No explicit administrative RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`) are referenced in this capability's codebase. It relies entirely on user-scoped ownership validation [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` ``).

---

#### user_settings

This capability references and enforces the following permission strings:
- **`v1.org.settings.create`**: Required to create user unit settings [Confirmed] (`` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.create|#1` ``).
- **`v1.org.settings.delete`**: Required to delete user unit settings [Confirmed] (`` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.delete|#1` ``).
- **`v1.org.settings.edit`**: Required to update user unit settings [Confirmed] (`` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.edit|#1` ``).
- **`v1.org.settings.view`**: Required to view user unit settings [Confirmed] (`` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.view|#1` ``).
- **`v1.org.admin`**: Checked as a candidate permission during building settings operations [Inferred] (`` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``).

### RBAC Cross-Check
- `v1.org.settings.create`, `v1.org.settings.delete`, `v1.org.settings.edit`, and `v1.org.settings.view` perfectly match the definitions in the supplied RBAC roles document [Confirmed].
- `v1.org.admin` is not explicitly listed in the RBAC roles document table, but is referenced in the architecture document as a required role for at least one user per organization [Confirmed].

### 10. Cross-Module Relationships

*Note: This section contains relationships supported by AST import resolution.*

#### Outbound Dependencies (Confirmed)
- **`access_control_device`**: Imports `EnrichedActivityData` and `OSKAccessControlDeviceTokenPayload` for activity enrichment and device token generation.
- **`apps`**: Imports `OSKNotificationType`, `OSKNotificationOptions`, and `OSKNotificationService` to dispatch notifications.
- **`building`**: Imports `OSKBuildingUnitInhabitantType`, `OSKUserDoor`, and `OSKBuildingAccess` to map user accesses to physical doors and units.
- **`call`**: Imports `OSKCallStatus` to manage user-scoped call history.
- **`core`**: Highly coupled (121 touchpoints). Imports `OSKDocumentController`, `OSKDocumentList`, `OSKDocumentId`, and uses core services like `OSKLoggingService`, `OSKAccessUtilsService`, `OSKSecretService`, and `OSKAuth0Service`.
- **`organization`**: Imports `OSKOrganizationResidentsController`, `OSKOrganizationOnboardingInhabitant`, and `OSKOrganization` to manage resident onboarding and organization mappings.
- **`settings`**: Imports `OSKAppStoreSettingsService` and `OSKConsolidatedRolesController` to manage app store settings and user roles.
- **`supplier`**: Imports `OSKSupplierStaffAccess` to map supplier staff accesses.
- **`unit_management`**: Imports `OSKUnitInvitation` to handle unit-level invitations.

#### Inbound Dependencies (Confirmed)
- **`access_control_device`**: Calls `OSKUserController.get` and imports `OSKUserAccessType` for activity enrichment.
- **`admin`**: Highly coupled (31 touchpoints). Calls `OSKUserAccessesController`, `OSKUserDeviceService`, `OSKUserController`, `OSKUserSettingsBuildingController`, `OSKUserIntercomController`, and `OSKUserInvitationController` for maintenance and administrative tasks.
- **`apps`**: Calls `OSKUserNotificationTokenController` to manage APNS/FCM tokens for notification dispatch.
- **`building`**: Highly coupled (25 touchpoints). Calls `OSKUserIntercomService`, `OSKUserController`, `OSKUserSettingsBuildingController`, and `OSKUserAccessesController` to synchronize building settings and intercom directories.
- **`call`**: Calls `OSKUserActivityAggregatesService`, `OSKUserCallController`, and `OSKUserNotificationService` to log calls and dispatch call notifications.
- **`core`**: Calls `OSKUserAccessesController`, `OSKUserDeviceController`, `OSKUserPincodeController`, `OSKUserController`, `OSKUserInvitationBuildingController`, `OSKUserInvitationController`, `OSKUserSentInvitationController`, and `OSKUserAccessService` to coordinate system-wide access orchestration.
- **`organization`**: Calls `OSKUserController`, `OSKUserPincodeController`, `OSKUserAccessesController`, `OSKUserOrganizationController`, and `OSKUserOrganizationInvitationPendingController` to manage organization users and resident profiles.
- **`supplier`**: Imports `OSKSupplierStaffAccess` and calls `OSKUserAccessType` to manage supplier staff accesses.
- **`unit_management`**: Calls `OSKUserController`, `OSKUserInvitationExternalUserController`, `OSKUserPincodeController`, `OSKUserInvitationExternalUnitService`, and `OSKUserAccessesController` to manage unit inhabitants and invitations.

### 11. External Hooks

#### _module_root

- **Twilio Verify**: Used for sending and verifying SMS OTP codes during phone number changes [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKSecretService.getSecret|_sendVerificationSms|OSKApiName.TwilioAccountSID|#1` ``, `` `call_expression|user|functions/src/modules/user/services/user.service.ts|axios.post|_sendVerificationSms|url,params.toString(),{ headers }|#1` ``).
- **Auth0**: Used for deleting users from Auth0 during account deletion cascade, and fetching user details by email/phone [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKAuth0Service.deleteAuth0User|onAccountDeleted|email|#1` ``, `` `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKAuth0Service.getUsersByEmail|initiateEmailChange|oldEmail|#1` ``).
- **Google Cloud Storage**: Used for deleting user profile images and storage folders under `users/${userId}/` [Confirmed] (Cite: `` `call_expression|user|functions/src/modules/user/controllers/user.controller.ts|storage()                 .bucket()                 .deleteFiles|delete|{ prefix: `users/${userId}/` }|#1` ``).

---

#### user_access

#### Pub/Sub Integration (Architectural Candidate)
- The capability defines several Pub/Sub message structures (`OSKAccessPubsubdMessage`, `OSKPubsubUserAccessInsert`, `OSKPubsubUserAccessUpdate`, `OSKPubsubUserAccessDelete`, `OSKPubsubUserAccessRecreate`) `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` (lines 14-44).
- These models indicate that user access changes are published to a Pub/Sub topic to trigger downstream edge hardware synchronization (as outlined in the Oskey Architecture document) [Inferred].

---

#### user_activity

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are directly evidenced within this capability's pack [Confirmed].

---

#### user_call

*(No external hooks, Pub/Sub topics, or environment variables are directly evidenced within this capability's pack.)*

---

#### user_device

### Environment Variables [Confirmed]
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement when running in emulator environments `` `functions/src/modules/user/modules/user_device/index.ts` (line 49) ``.

#### user_intercoms

- No external hooks, Pub/Sub topics, environment variables, or storage paths are directly evidenced in this capability's pack. (Confirmed)

#### user_invitation

### Environment Variables [Confirmed]
- **Emulator Check**: The capability checks `process.env.OSK_FIREBASE_EMULATOR` to conditionally enforce App Check verification during local development/testing [Confirmed] (line 85) `` `functions/src/modules/user/modules/user_invitation/index.ts` (line 85) ``.

---

#### user_notification

- **Firebase Cloud Messaging (FCM)**: This capability indirectly integrates with FCM by managing the lifecycle of client registration tokens (`fcmToken`) `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|notificationTokenList.map|onInsertOrUpdateNotificationToken|...|#1` ``.
- **App Check**: Integrates with Firebase App Check to validate client authenticity `` `call_expression|user|functions/src/modules/user/modules/user_notification/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

---

#### user_organization

- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``. [Confirmed]
- No other external hooks (Pub/Sub, external HTTP paths, storage paths) are evidenced in this capability's pack.

#### user_pincode

No external hooks (such as Pub/Sub topics, environment variables, storage paths, or external HTTP integrations) are directly declared or managed within this capability's pack [Confirmed] (`` `functions/src/modules/user/modules/user_pincode/index.ts` ``).

---

#### user_settings

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or storage paths) are evidenced within this capability's pack [Confirmed].

### 12. Architectural Observations

- **Separation of Concerns**: The module exhibits excellent separation of concerns by splitting user-related concepts into highly specialized submodules (e.g., separating `user_pincode` from `user_device` and `user_intercoms`) [Inferred].
- **Coupling & Layering**: The module is heavily coupled with `core` (121 outbound touchpoints) and acts as a central dependency for almost all other modules in the system (9 inbound modules) [Confirmed]. It relies on `core`'s `OSKDocumentController` to perform standard CRUD operations, enforcing a strict layering where database access is abstracted [Inferred].
- **Orchestration**: `_module_root` acts as a lifecycle orchestrator, coordinating user deletion cascades across multiple submodules and external services like Auth0 and Firebase Auth [Confirmed].
- **Denormalization & Fan-out**: The module participates in the platform's denormalization strategy [Inferred]. For example, `user_pincode` coordinates with `OSKPincodeService` (in `core`) and `OSKOrganizationResidentsController` (in `organization`) to dual-write and synchronize pincodes to building-level mirrors and resident profiles, ensuring offline edge devices can validate credentials [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Mismatch**: The permission string `v1.org.admin` is actively checked in `user_building_settings.service.ts` but is completely absent from the official `rbac-roles.json` schema [Confirmed].
- **Security Enforcement Asymmetry**: Sensitive submodules like `user_access`, `user_device`, and `user_pincode` do not enforce any RBAC permissions in code, relying entirely on user-scoped identity checks (`@OSKUserSecurityChecks`) [Confirmed]. This creates a risk where administrative overrides or support tools might bypass standard RBAC auditing if they call these services directly [Inferred].
- **Unattributed Security Signals**:
  - `user_device` raises 2 `permission-denied` errors with no identifiable RBAC string behind them [Confirmed].
  - `user_notification` raises 1 `permission-denied` error with no identifiable RBAC string behind them [Confirmed].
- **Deletion Cascade Completeness**: While `_module_root` orchestrates a user deletion cascade, it is unknown whether all subcollections (specifically `/users/{userId}/buildingSettings` and `/users/{userId}/intercoms`) are completely pruned during this cascade, as no explicit triggers or service calls for these settings are evidenced in the deletion flow [Unknown].

**Per-capability open questions:**

#### _module_root

- How is the STUN/TURN/ICE gateway or SIP/WebRTC signaling server integrated with the user module, if at all, since `user_call` is referenced but signaling details are absent?
- Are there any specific restrictions on which user roles can request account deletion, or is it open to all authenticated users?

#### user_access

- **Pub/Sub Publishing Location**: The actual Pub/Sub publish calls are not present in this capability's pack. It is unclear if they are executed within a central orchestration service in another module or if they are handled by a Firestore trigger in a different submodule.
- **HTTP Routing**: The controllers extend `OSKDocumentController`, but the explicit HTTP routing configuration (e.g., Express router or Firebase HTTPS function wrappers) is not evidenced in this pack.

#### user_activity

### Inbound Ingestion Trigger
- **Question**: How is `ActivityReceivedForUser` triggered? [Inferred]
- **Context**: The service methods exist to receive activities, but the inbound trigger (e.g., a Pub/Sub subscription or Firestore trigger on raw hardware events) is not defined within this submodule's pack. It is likely located in the `access_control_device` or `building_activity` submodules.

### Security Decorator Implementation
- **Question**: What is the exact structure of the `OSKUserSecurityChecks` decorator's validation logic for these specific endpoints? [Inferred]
- **Context**: The decorator is imported from `../../../../../decorators/securityChecks` but its implementation is outside this capability's evidence pack.

#### user_call

- **Call Synchronization**: How does a call event in the global `/calls` collection trigger the creation of a user-scoped `/users/{userId}/calls` document? Is there an asynchronous Pub/Sub consumer or a Firestore trigger in another module (e.g., the `call` module) that invokes `OSKUserCallController.set`?
- **Call Picture Storage**: The model contains `callPictureName` `` `model_property|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|callPictureName|#1` ``. Where are these pictures stored, and does this capability interact with Google Cloud Storage to manage or clean up these files when `deleteAll` is called?

#### user_device

- **Response Schemas**: What are the exact response schemas for `getDevicesUserList` and `removeUserDevice`? No matching `model_property` facts were present in this pack to represent their response structures.
- **Public Key Management**: The models `OSKUserDevicePublicKeyAddRequest` and `OSKUserDevicePublicKeyDeleteRequest` are defined and exported, but there are no corresponding controller endpoints or service methods in this pack showing how public keys are added or deleted.

#### user_intercoms

- **Mutation Triggering**: Since client-side writes are blocked by Firestore security rules, how does a user trigger updates to their call transfer list or display name from the mobile application? Is there an HTTPS callable function or REST endpoint in another submodule that delegates to `OSKUserIntercomService`? (Inferred)
- **Controller Exposure**: Are the methods in `OSKUserIntercomController` exposed as HTTP endpoints, or are they strictly used as internal programmatic controllers within the backend? (Inferred)

#### user_invitation

- **Security Check Implementation**: The exact implementation details of the `@OSKUserSecurityChecks` decorator are not contained within this capability pack, as it is imported from an external decorators directory.
- **Notification Payload Structure**: The exact structure of the notification payload sent via `OSKNotificationService` is not fully detailed in the model properties of this pack, though debug logs indicate it supports `InhabitantUser` and `InhabitantPermanentGuestUser` types.

#### user_notification

- **Notification Preferences**: It is unclear from the evidence pack if this capability directly evaluates the user's notification settings (e.g., `settings.notifications.residentsNotificationReceived.pushNotification`) before dispatching, or if that filtering is entirely delegated to the `apps/notification` module.
- **Token Expiry**: There is no explicit evidence of a background cron or cleanup task to prune expired or stale FCM tokens from the `/users/{userId}/notificationTokens` collection, other than opportunistic deletion during duplicate detection or manual deletion requests.

#### user_organization

- What is the exact structure of the consolidated roles generated by `generateOrganizationUserRoles`? (The implementation details reside in the `settings` module).
- How are `OSKUserOrganizationRequest` documents created? The controller exposes `save` and `get` methods, but the business workflow initiating these requests is not evidenced in this pack.

#### user_pincode

- **Pincode Generation Logic**: The service methods (e.g., `createPincodeInhabitantDocument`) accept pre-constructed pincode documents, but the actual cryptographic or alphanumeric generation of the PIN string itself is not defined in this submodule's evidence. Where does the generation occur?
- **Implementation of `@OSKUserSecurityChecks`**: The decorator is imported from outside the module boundary (`../../../../../decorators/securityChecks`), meaning its exact internal validation steps and Auth0 context matching are not visible in this capability's evidence.
- **Response Schemas**: The exact return types of the callable functions are not explicitly defined as model properties in the evidence pack.

#### user_settings

- **RBAC Roles Document Discrepancy**: Why is `v1.org.admin` checked in `user_building_settings.service.ts` [Inferred] (`` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``) but missing from the official RBAC roles document table? [Unknown]
- **Cross-Capability Cleanup**: Are there any Firestore triggers defined in other submodules (such as the user deletion submodule) that automatically clean up documents under `/users/{userId}/buildingSettings` when a user is deleted? [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
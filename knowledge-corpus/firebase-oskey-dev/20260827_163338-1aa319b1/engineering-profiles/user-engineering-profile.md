### 0. Generation Metadata

- runId: `20260827_163338-1aa319b1`
- generatedAt: `2026-08-27T16:56:43.578Z`
- repoName: `firebase-oskey-dev`
- targetModule: `user`
- llmConfigKey: `gemini-default`
- llmProvider: `gemini`
- llmModel: `gemini-3.5-flash`

### 1. Executive Summary

The `user` module serves as the platform's core identity, profile, and user-centric configuration hub [Confirmed]. It manages the entire lifecycle of user profiles, identity synchronization with Auth0, contact detail verification (email and phone number changes via Twilio), onboarding status tracking, and cascading account deletion workflows [Confirmed]. Additionally, the module orchestrates user-associated hardware devices, SecureBLE cryptographic tokens, user-scoped access rights, personal activity logs, call records, intercom call-routing preferences, organization memberships, and user-to-user or unit-level invitations [Confirmed].

### 2. Architectural Position

The `user` module occupies a foundational position in the platform's user-facing domain, acting as the primary bridge between external identity providers (Auth0) and the platform's business logic [Confirmed]. It owns the `/users/{userId}` root collection and its extensive subcollections, which serve as the authoritative system of record for user-centric states [Confirmed]. These states are projected downstream to MongoDB for edge hardware consumption and are heavily queried by administrative modules (`admin`, `organization`, `building`) to manage building occupancy, resident directories, and physical access control [Confirmed].

### 3. Primary Responsibilities

#### _module_root

- **User Account Creation & Synchronization**: Listens to Firebase Auth creation events to initialize the user document in Firestore, extracting details from social providers (Apple, Google, Microsoft) or fallback fields `functions/src/modules/user/services/user.service.ts` (lines 444-536). **Confirmed**
- **Public Profile Updates & Cascading Sync**: Updates user public profile fields (first name, last name) and cascades these changes to related collections such as building accesses, unit inhabitants, and organization users `functions/src/modules/user/services/user.service.ts` (lines 538-629). **Confirmed**
- **Phone Number Verification & Change**: Coordinates phone number updates using Twilio Verify SMS OTP codes and updates Auth0 and Firestore `functions/src/modules/user/services/user.service.ts` (lines 195-255, 257-341). **Confirmed**
- **Email Verification & Change**: Manages email change requests by generating a verification code, persisting it to a temporary document, sending an OTP email, and updating Auth0 and Firebase Auth upon successful verification `functions/src/modules/user/services/user.service.ts` (lines 997-1081, 1100-1167). **Confirmed**
- **Onboarding & Language Settings**: Updates user onboarding status (MFA enrollment, building access activation) and preferred language settings `functions/src/modules/user/services/user.service.ts` (lines 646-695, 697-719). **Confirmed**
- **Account Deletion & Cascading Cleanup**: Handles user-initiated account deletion requests, schedules deletion, and executes a cascading cleanup of all user-related sub-collections (devices, pincodes, accesses, calls, activities, etc.) and Auth0/Firebase Auth records `functions/src/modules/user/services/user.service.ts` (lines 1274-1295, 1336-1443). **Confirmed**
- **Inhabitant Type Resolution**: Resolves a user's inhabitant type (e.g., resident, tenant) for a specific building and unit `functions/src/modules/user/services/user.service.ts` (lines 1445-1459). **Confirmed**
- **User Lookup**: Resolves user IDs by email or phone number `functions/src/modules/user/services/user.service.ts` (lines 882-955). **Confirmed**

---

#### user_access

The `user_access` capability is responsible for the following distinct features:

*   **User Access Management per Building**: Retrieves, saves, updates, and deletes user-specific access records associated with a particular building ID under the `/users/{userId}/accesses` collection path `` `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 18-55) `` [Confirmed].
*   **User Building Unit Association**: Manages the mapping of users to specific units within a building under the `/users/{userId}/buildings/{buildingId}/units` path, supporting creation, retrieval, deletion, and listing of unit documents `` `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 21-56) `` [Confirmed].
*   **Access Orchestration and Setup**: Orchestrates the creation, updating, and setup of user accesses, resolving building and user details, and updating the user's access array using Firestore array operations `` `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (lines 33-88) `` [Confirmed].
*   **Access Type Validation**: Provides utility functions to validate and type-guard various access categories, including inhabitant, guest, permanent guest, quickcode, non-app user, supplier staff, and organization-level accesses `` `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` (lines 130-292) `` [Confirmed].
*   **Pub/Sub Message Modeling**: Defines structured data types for Pub/Sub messages (insert, update, delete, recreate) used to synchronize user access changes asynchronously to downstream systems or edge hardware `` `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` (lines 3-44) `` [Confirmed].

---

#### user_activity

### Ingesting and Enriching User Activities
- Receives raw activity events and enriches them with user-specific context (such as user profile details) before saving them to the database [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 23-53)].
- Persists enriched activities as individual documents within the user's activity collection [Confirmed; `call_expression|user|functions/src/modules/user/modules/user_activity/services/user_activities.service.ts|OSKUserActivitiesController.default.save|ActivityReceivedForUser|user.userId,activity.activityId,userActivityDocument|#1`].

### Maintaining Rolling Activity Aggregates
- Aggregates user activities on a per-building basis to optimize mobile client read performance [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 24-105)].
- Enforces a rolling 30-day retention window for aggregated activities, automatically filtering out and pruning records older than 30 days during the aggregation process [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 78-83)].

### Secure Activity Retrieval
- Exposes endpoints to retrieve a single activity by ID or list all activities for a specific user [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityById|#1`, `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getAllUserActivities|#1`].
- Exposes endpoints to retrieve aggregated activities filtered by building ID [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityByBuildingId|#1`].

### Activity Deletion
- Allows users to delete a specific activity record by ID [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|delete|#1`].
- Allows users to clear their entire activity history [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|deleteAll|#1`].

### Security and Ownership Enforcement
- Enforces strict parameter validation and user identity checks via decorators and security utilities to guarantee that a user can only query or modify their own activity data [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54-95), `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 106-121)].

---

#### user_call

- **Call Record Management**: Provides administrative methods to write and delete call logs for a specific user.
  - Writing a call record is handled by the `set` method, which persists an `OSKUserCallDocument` to Firestore `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|set|#1` ``.
  - Deleting all call records for a user is handled by the `deleteAll` method `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|deleteAll|#1` ``.
- **Data Modeling**: Defines the structure of a user call record (`OSKUserCall`) `` `type_alias|user|functions/src/modules/user/modules/user_call/models/user_call_document.model.ts|OSKUserCall|#1` ``. The model includes the following properties `` `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` (lines 13-24) ``:
  - `startTime`: Timestamp when the call started.
  - `endTime`: Timestamp when the call ended.
  - `status`: Current status of the call.
  - `buildingId`: The unique identifier of the building where the call originated.
  - `contactId`: The identifier of the contact being called.
  - `callId`: The unique identifier of the call session.
  - `callerId`: The identifier of the caller.
  - `callerType`: The type of caller (e.g., visitor, resident).
  - `unitId`: The unit associated with the call.
  - `callDuration`: Duration of the call in seconds.
  - `callPictureName`: Filename of any captured call image.
  - `activityId`: Associated activity log identifier.

---

#### user_device

### User Device Management
- **Retrieve User Devices**: Retrieves a list of active devices registered to a specific user [Confirmed: ``api_contract|user|functions/src/modules/user/modules/user_device/index.ts|getDevicesUserList|#1``].
- **Remove User Device**: Deletes a registered device from a user's profile [Confirmed: ``api_contract|user|functions/src/modules/user/modules/user_device/index.ts|removeUserDevice|#1``].

### Access Control Device Token Generation (SecureBLE)
- **Token Issuance**: Generates a cryptographically signed token (`createAccessDeviceToken`) for a user's device to allow offline Bluetooth Low Energy (SecureBLE) unlocking at a specific building's ACD [Confirmed: ``service_method|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKUserDeviceService|createAccessDeviceToken|#1``].
- **Access Resolution**: Resolves all valid access rights for a user at a specific ACD to embed within the token payload [Confirmed: ``service_method|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKUserDeviceService|_findAllUserAccessForThisACD|#1``].
- **Token Storage**: Saves generated tokens under the user's device subcollection [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKUserDeviceAccessControlDeviceTokenController.default.save|createAccessDeviceToken|userId,userDeviceDoc.id,acd.accessControlDeviceId,accessControlDeviceToken|#1``].

### Firestore Lifecycle Triggers
- **onDocumentCreated**: Triggered when a new device document is added. It automatically refreshes the user's access permissions across their assigned devices [Confirmed: ``firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentCreated|#1``].
- **onDocumentUpdated**: Triggered when a device document is modified (e.g., marked as locked or stolen). It refreshes the user's access permissions [Confirmed: ``firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentUpdated|#1``].
- **onDocumentDeleted**: Triggered when a device is removed. It purges all associated `accessControlDeviceTokens` and refreshes the user's access permissions [Confirmed: ``firestore_trigger|user|functions/src/modules/user/modules/user_device/index.ts|unknown|onDocumentDeleted|#1``].

---

#### user_intercoms

The `user_intercoms` capability is responsible for the following features and operations:

- **CRUD Operations on User Intercom Documents**: Exposes standard document controller methods (`create`, `get`, `update`, `delete`) to manage user-specific intercom configurations `` `controller_method|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController|create|#1` ``.
- **Inhabitant Intercom Synchronization**: Coordinates the creation and updating of user-scoped intercom entries when a tenant is onboarded or updated `` `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 23-64) ``.
- **Idempotent Document Upserting**: Handles the creation of user intercom entries, checking for existing documents and updating them to maintain idempotency `` `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 162-212) ``.
- **Sibling Tenant Synchronization**: Automatically updates the intercom entries of sibling tenants within the same unit to maintain consistent call settings `` `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 66-81) ``.
- **Inhabitant Deletion Cleanup**: Cleans up user intercom entries and filters deleted inhabitants out of the call transfer list when an inhabitant is removed `` `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 115-157) ``.
- **Call Transfer List Ordering**: Converts sequence-number-based call transfer lists into ordered recipient lists for SIP/WebRTC routing `` `functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts` (lines 214-224) ``.

(Confirmed)

#### user_invitation

#### Invitation Creation & Dispatch
- Orchestrates the creation of invitations (`createUserInvitation`) for guests or permanent guests, validating access rights and generating unique pincodes or BLE tokens. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|createUserInvitation|#1` ``.
- Constructs the invitation object, completes unit details, and saves the invitation to both the building unit's invitations subcollection and the sender's sent invitations subcollection. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (lines 187-376).

#### Invitation Acceptance & Rejection
- Handles the acceptance of invitations (`inviteeAcceptsInvitation`) by invitees, which provisions physical access (creating an access document) and registers the user as an inhabitant of the unit if applicable. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeAcceptsInvitation|#1` `` and `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (lines 54-218).
- Handles the rejection of invitations (`inviteeRejectsInvitation`), updating the invitation status to `rejected` across the sender's sent invitations and the building unit's invitations. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeRejectsInvitation|#1` `` and `functions/src/modules/user/modules/user_invitation/services/user_invitation_rejected.service.ts` (lines 17-68).

#### Invitation Cancellation & Deletion
- Allows the inviter to cancel pending invitations (`inviterCancelsInvitation`), which revokes any provisioned access and updates the status to `cancelled`. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviterCancelsInvitation|#1` `` and `functions/src/modules/user/modules/user_invitation/services/user_invitation_cancelled.service.ts` (lines 17-71).
- Supports the deletion of invitations (`deleteInvitation`), removing the invitation documents from the database and deleting associated physical access. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|deleteInvitation|#1` `` and `functions/src/modules/user/modules/user_invitation/services/user_invitation_delete.service.ts` (lines 27-151).

#### External User Invitation Processing
- Automatically matches newly registered users with pending external invitations (`processExternalUserInvitations`) based on email or phone number. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|processExternalUserInvitations|#1` ``.
- Processes onboarding cards and external unit/user invitations, automatically provisioning unit access and sending notifications to the inviter when the invitee successfully boards. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (lines 211-691).

#### Invitation Retrieval
- Retrieves all invitations associated with a user (`onGetAllInvitationsByUser`), supporting pagination and filtering by category (sent or received). [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|onGetAllInvitationsByUser|#1` `` and `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (lines 184-251).

---

#### user_notification

### Notification Token Management (FCM Tokens)
- **Token Registration & Updates**: Allows client applications to register or update Firebase Cloud Messaging (FCM) tokens for a user, mapping them to specific device types (e.g., `androidApp`) `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onInsertOrUpdateNotificationToken|#1` ``. [Confirmed]
- **Token Uniqueness Enforcement**: When a new token is registered, the system queries existing tokens and deletes duplicates to ensure that an FCM token is uniquely assigned to a single user and device `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|notificationTokenList.map|onInsertOrUpdateNotificationToken|async (notificationToken) => { ... }|#1` ``. [Confirmed]
- **Token Deletion**: Allows users to safely delete their registered notification tokens when logging out or removing a device `` `api_contract|user|functions/src/modules/user/modules/user_notification/index.ts|onDeleteNotificationToken|#1` ``. [Confirmed]

### User Notification Lifecycle & Dispatch
- **Notification Creation**: Orchestrates the creation of user-scoped notification documents in Firestore and delegates the actual delivery to the core notification service `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKNotificationService.default.send|create|userId,notificationId,fullOptions|#1` ``. [Confirmed]
- **Special Notification Dispatch**: Supports sending specialized notifications that bypass standard routing or require custom options `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKNotificationService.default.sendSpecial|createSpecial|userId,notificationId,options|#1` ``. [Confirmed]

### Unread Notification Count Synchronization
- **Real-Time Counters**: Listens to Firestore document updates and deletions on the user's notifications collection to automatically increment or decrement the user's `unreadNotificationCount` `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``. [Confirmed]
- **Self-Healing Reversion**: If a notification document fails to write during creation, the system automatically reverts the incremented unread count to maintain data integrity `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserController.default.decrementUnreadNotificationCount(userId).catch|create|(e) => { ... }|#1` ``. [Confirmed]

---

#### user_organization

- **Retrieve Pending Invitations**: Retrieves all pending organization invitations for a specific user. [Confirmed; `` `api_contract|user|functions/src/modules/user/modules/user_organization/index.ts|getCurrentUserOrganizationInvitations|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._query|getAllInvitations|`/users/${userId}/organizationInvitations`|#1` ``]
- **Accept Organization Invitation**: Handles the workflow when a user accepts an organization invitation. This responsibility includes:
  - Verifying the user and organization exist. [Confirmed; `` `functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts` (lines 82-92) ``]
  - Generating consolidated roles for the user within the organization. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKConsolidatedRolesController.default.generateOrganizationUserRoles|userOrganizationInvitationAccepted|organizationInvitation.roles,organization.userRoles,...|#1` ``]
  - Saving the user-organization link document. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationController.default.save|userOrganizationInvitationAccepted|user.userId,request.organizationId,userOrganization|#1` ``]
  - Saving the organization-user link document. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserController.default.save|userOrganizationInvitationAccepted|request.organizationId,user.userId,organizationUser|#1` ``]
  - Deleting the pending invitation from both the user's pending list and the organization's invitation list. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationPendingController.default.deleteUsersOrganizationInvitation|userOrganizationInvitationAccepted|user.userId,request.organizationId|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationAccepted|request.organizationId,userInvitation.email|#1` ``]
- **Reject Organization Invitation**: Handles the workflow when a user rejects an organization invitation. This responsibility includes:
  - Moving the organization-side invitation to a cancelled state. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.moveOrganizationUserInvitation|userOrganizationInvitationRejected|request.organizationId,findUsersInvitation.email,findOrganizationsInvitation|#1` ``]
  - Deleting the organization-side invitation. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKOrganizationUserInvitationController.default.deleteOrganizationUserInvitation|userOrganizationInvitationRejected|request.organizationId,findUsersInvitation.email|#1` ``]
  - Deleting the user-side pending invitation. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationPendingController.default.deleteUsersOrganizationInvitation|userOrganizationInvitationRejected|findUser.userId,request.organizationId|#1` ``]
- **Manage Organization Requests**: Allows users to save and retrieve requests to join organizations. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController.default._get|get|`/users/${userId}/organizationRequests`,organizationId|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController.default._set|save|`/users/${userId}/organizationRequests`,organizationId,data|#1` ``]
- **Manage User Organizations**: Provides CRUD operations for managing the organizations a user is linked to. [Confirmed; `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``]

#### user_pincode

- **Request Type**: `OSKUserPincodeGetRequest`
  - `userId`: `string`
- **Response Type**: *Unknown (No matching model_property facts matched within this pack)*
- **Handler**: `OSKUserPincodeService.onGetUserPincodes` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (lines 143-160)

### Firestore Triggers [Confirmed]
- No Firestore triggers are owned or declared by this capability.

---

#### user_settings

The `user_settings` capability is responsible for the following distinct features:

- **User Building Settings Management**: Handles the creation, retrieval, updating, and deletion of building-level settings scoped to a specific user. This includes configuring allowed access methods (e.g., Bluetooth, PIN code), invitation permissions, and intercom display preferences. [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSettingsBuildingService|createUserSettingsBuilding|#1` ``
- **User Unit Settings Management**: Manages unit-level settings scoped to a specific user, building, and unit. This includes tracking the user's inhabitant type (e.g., ResidentAdmin, Resident) and mapping their relationship to a specific unit. [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingUnit|#1` ``
- **Automatic Settings Provisioning**: Automatically provisions user unit settings when a new inhabitant is onboarded or created. [Confirmed] `` `service_method|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|OSKUserSettingsUnitService|createUserSettingsUnitFromInhabitant|#1` ``
- **Security & Permission Enforcement**: Validates incoming request parameters and enforces Role-Based Access Control (RBAC) permissions (such as `v1.org.settings.create`, `v1.org.settings.edit`, `v1.org.settings.view`, and `v1.org.settings.delete`) before executing settings modifications. [Confirmed] `` `functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` (lines 30-61) ``

### 4. Public Interfaces

#### _module_root

- **`OSKUserController`** (extends `OSKDocumentController`): Exposes CRUD operations on the `/users` collection, profile image uploads, notification count increments/decrements, and account deletion scheduling `functions/src/modules/user/controllers/user.controller.ts` (lines 16-192). **Confirmed**
- **`OSKEmailChangeController`** (extends `OSKDocumentController`): Manages temporary email change verification documents in the `/changeEmail` collection `functions/src/modules/user/controllers/chnageEmail.controller.ts` (lines 12-46). **Confirmed**
- **`OSKUserService`**: The core business logic service orchestrating all user-related workflows, triggers, and external integrations `functions/src/modules/user/services/user.service.ts` (lines 84-1479). **Confirmed**

---

#### user_access

This capability exposes the following public classes and services as entry points:

*   **`OSKUserAccessesController`**: Extends `OSKDocumentController` to expose endpoints for querying, saving, updating, and deleting user accesses per building `` `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 11-14) `` [Confirmed].
*   **`OSKUserBuildingUnitController`**: Extends `OSKDocumentController` to manage user-to-building-unit relationships `` `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 14-18) `` [Confirmed].
*   **`OSKUserAccessService`**: A service class that orchestrates user access creation, updates, and setup workflows `` `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (lines 32-33) `` [Confirmed].

---

#### user_activity

This capability exposes its functionality through the following controllers and services:

### Controllers
- **`OSKUserActivitiesController`** (extends `OSKDocumentAndMessageController`): Manages direct document operations on individual user activity logs [Confirmed; `functions/src/modules/user/modules/user_activity/controllers/user_activities.controller.ts` (lines 10-53)].
- **`OSKUserActivityAggregatesController`** (extends `OSKDocumentController`): Manages document operations on aggregated user activity logs [Confirmed; `functions/src/modules/user/modules/user_activity/controllers/user_activity_aggregates.controller.ts` (lines 14-69)].

### Services
- **`OSKUserActivitiesService`**: Orchestrates business logic for individual user activity ingestion, retrieval, and deletion [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 20-96)].
- **`OSKUserActivityAggregatesService`**: Orchestrates business logic for building-level user activity aggregation and retrieval [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activity_aggregates.service.ts` (lines 21-122)].

---

#### user_call

- **OSKUserCallController** `` `source_class|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController` ``:
  - Extends `OSKDocumentController` `` `functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts` (line 9) ``.
  - Exposes `getCollectionPath(userId: string)` to resolve the Firestore path for a user's call subcollection `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|getCollectionPath|#1` ``.
  - Exposes `set(userId: string, document: OSKUserCallDocument)` to write a call record `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|set|#1` ``.
  - Exposes `deleteAll(userId: string)` to purge all call records for a user `` `controller_method|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController|deleteAll|#1` ``.

---

#### user_device

### Controllers
- **`OSKUserDeviceController`**: Manages the `/users/{userId}/devices` collection, extending `OSKDocumentController` to provide standard CRUD operations [Confirmed: ``source_class|user|functions/src/modules/user/modules/user_device/controllers/user_device.controller.ts|OSKUserDeviceController``].
- **`OSKUserDeviceAccessControlDeviceTokenController`**: Manages the subcollection `/users/{userId}/devices/{deviceId}/accessControlDeviceTokens`, extending `OSKDocumentController` [Confirmed: ``source_class|user|functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts|OSKUserDeviceAccessControlDeviceTokenController``].

### Services
- **`OSKUserDeviceService`**: The primary domain service containing the business logic for device listing, removal, token generation, and Firestore trigger handling [Confirmed: ``source_class|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKUserDeviceService``].

---

#### user_intercoms

This capability exposes the following public entry points:

- **`OSKUserIntercomController`**: Extends `OSKDocumentController` to provide REST-like document operations over the user intercoms collection `` `source_class|user|functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts|OSKUserIntercomController` ``.
- **`OSKUserIntercomService`**: The primary service class containing the business logic for managing, synchronizing, and cleaning up user intercoms `` `source_class|user|functions/src/modules/user/modules/user_intercoms/services/user_intercom.service.ts|OSKUserIntercomService` ``.
- **Module Exports**: Exposes the controller, service, and document models via the submodule index `` `functions/src/modules/user/modules/user_intercoms/index.ts` (lines 9-19) ``.

(Confirmed)

#### user_invitation

#### Controllers
- **`OSKUserInvitationBuildingController`**: Manages invitations at the building and unit level under the path `/buildings/{buildingId}/units/{unitId}/invitations`. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (lines 16-84).
- **`OSKUserInvitationExternalUserController`**: Manages external user invitations under the collection `externalUserInvitations`. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (lines 8-72).
- **`OSKUserInvitationController`**: Manages received invitations for a user under the path `/users/{userId}/invitations`. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (lines 15-62).
- **`OSKUserSentInvitationController`**: Manages sent invitations for a user under the path `/users/{userId}/sentInvitations`. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts` (lines 12-69).

#### Services
- **`OSKUserInvitationAcceptedService`**: Orchestrates the acceptance flow of invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (lines 23-218).
- **`OSKUserInvitationCancelledService`**: Orchestrates the cancellation flow of invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_cancelled.service.ts` (lines 14-71).
- **`OSKUserInvitationCommonService`**: Provides shared utilities for checking dates, finding invitee user IDs, and updating status. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (lines 29-282).
- **`OSKUserInvitationCreationService`**: Orchestrates the creation and validation of invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (lines 40-503).
- **`OSKUserInvitationDeleteService`**: Orchestrates the deletion of sent or received invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_delete.service.ts` (lines 24-151).
- **`OSKUserInvitationEditService`**: Orchestrates the editing of existing invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_edit.service.ts` (lines 31-171).
- **`OSKUserInvitationExternalUnitService`**: Manages external unit invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_unit.service.ts` (lines 22-191).
- **`OSKUserInvitationExternalUserService`**: Manages external user invitations and onboarding card processing. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (lines 54-703).
- **`OSKUserInvitationNotificationService`**: Handles invitation notifications. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_notification.service.ts` (lines 8-8).
- **`OSKUserInvitationRejectedService`**: Orchestrates the rejection flow of invitations. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_rejected.service.ts` (lines 14-68).

---

#### user_notification

The capability exposes the following controllers and services as public entry points:

### Controllers
- **`OSKUserNotificationTokenController`** `` `source_class|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController` ``
  - Extends `OSKDocumentController` to manage the `/users/{userId}/notificationTokens` subcollection.
  - Exposes standard CRUD operations: `create`, `delete`, `get`, `getAll`, and `save` `` `controller_method|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController|create|#1` ``.
- **`OSKUserNotificationController`** `` `source_class|user|functions/src/modules/user/modules/user_notification/controllers/user_notification.controller.ts|OSKUserNotificationController` ``
  - Extends `OSKDocumentController` to manage the `/users/{userId}/notifications` subcollection.
  - Exposes standard CRUD operations: `create`, `delete`, `get`, `getAll`, and `save` `` `controller_method|user|functions/src/modules/user/modules/user_notification/controllers/user_notification.controller.ts|OSKUserNotificationController|create|#1` ``.

### Services
- **`OSKUserNotificationTokenService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService` ``
  - Contains the business logic and validation for the callable functions `onInsertOrUpdateNotificationToken` and `onDeleteNotificationToken`.
- **`OSKUserNotificationService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification.service.ts|OSKUserNotificationService` ``
  - Orchestrates notification creation, triggers downstream dispatch, and handles Firestore trigger events for notification updates and deletions.
- **`OSKUserNotificationTestService`** `` `source_class|user|functions/src/modules/user/modules/user_notification/services/user_notification_test.service.ts|OSKUserNotificationTestService` ``
  - Exposes a test utility service to trigger mock notifications for verification.

---

#### user_organization

- **OSKUserOrganizationInvitationPendingController**: Extends `OSKDocumentController` to manage pending organization invitations under `/users/{userId}/organizationInvitations`. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController` ``]
- **OSKUserOrganizationRequestController**: Extends `OSKDocumentController` to manage organization requests under `/users/{userId}/organizationRequests`. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController` ``]
- **OSKUserOrganizationController**: Extends `OSKDocumentController` to manage linked organizations under `/users/{userId}/organizations`. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts|OSKUserOrganizationController` ``]
- **OSKUserOrganizationInvitationService**: Service orchestrating the retrieval, acceptance, and rejection of organization invitations. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKUserOrganizationInvitationService` ``]
- **OSKUserOrganizationRequestService**: Service managing organization requests. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization_request.service.ts|OSKUserOrganizationRequestService` ``]
- **OSKUserOrganizationService**: Service managing user organizations. [Confirmed; `` `source_class|user|functions/src/modules/user/modules/user_organization/services/user_organization.service.ts|OSKUserOrganizationService` ``]

#### user_pincode

### Controllers [Confirmed]
- **`OSKUserPincodeController`**: Extends `OSKDocumentController` to manage Firestore operations on the user-scoped pincodes collection path `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (lines 12-103).
  - Exposes methods: `set`, `get`, `getSafe`, `getAll`, `getSpecificPincodesByQuery`, `getAllQuickcodes`, `getByAccessId`, `getByAccessIdSafe`, `delete`, and `deleteAll`.

### Services [Confirmed]
- **`OSKUserPincodeService`**: Orchestrates the business logic for creating, retrieving, and deleting user PIN codes, performing parameter validation and security checks `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (lines 27-198).

### Entry Points [Confirmed]
- **`getCallableFunctionTriggers`**: Declares and exports the Firebase HTTPS callable function triggers `functions/src/modules/user/modules/user_pincode/index.ts` (lines 32-38).
  - `onGetUserPincodes`
  - `deleteUserPincode`

---

#### user_settings

This capability exposes the following public entry points and controllers:

- **OSKUserSettingsBuildingController**: Extends `OSKDocumentController` to provide standard CRUD operations on the Firestore collection path `/users/{userId}/buildingSettings`. [Confirmed] `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts|OSKUserSettingsBuildingController` ``
- **OSKUserSettingsUnitController**: Extends `OSKDocumentController` to provide standard CRUD operations on the Firestore subcollection path `/users/{userId}/buildingSettings/{buildingId}/unitSettings`. [Confirmed] `` `source_class|user|functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts|OSKUserSettingsUnitController` ``
- **getCallableFunctionTriggers**: Exposes the HTTPS callable Cloud Functions that serve as the API gateway for client applications to interact with user building settings. [Confirmed] `` `function_declaration|user|functions/src/modules/user/modules/user_settings/index.ts|getCallableFunctionTriggers|#1` ``

### 5. Internal Structure

*Note: This section contains the intra-module coupling analysis derived from AST import resolution.*

The `user` module exhibits a highly centralized star-like topology, where the module root coordinates specialized submodules [Confirmed]:
- **Central Orchestration**: The `_module_root` maintains outbound coupling to almost all submodules, including `user_access`, `user_activity`, `user_call`, `user_device`, `user_invitation`, `user_notification`, `user_organization`, `user_pincode`, and `user_settings` [Confirmed].
- **Inbound Feedback**: Submodules `user_access`, `user_activity`, `user_invitation`, `user_notification`, `user_organization`, and `user_settings` maintain inbound coupling back to `_module_root` to resolve core user documents and controller states [Confirmed].
- **Submodule Sibling Coupling**:
  - `user_device` depends directly on `user_access` (importing `OSKUserAccessesController` and `OSKUserAccessesDocument`) [Confirmed].
  - `user_activity` depends on `user_call` (importing `OSKUserCallDocument`) [Confirmed].
  - `user_invitation` is highly coupled, depending on `user_access` (`OSKUserAccessType`), `user_notification` (`OSKUserNotificationService`), and `user_pincode` (`OSKUserPincodeDocument` and `OSKUserPincodeController`) [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains the data ownership conclusion based on module-wide analysis.*

The `user` module is the sole authoritative owner of the `/users/{userId}` collection and all of its nested subcollections, including `/accesses`, `/devices`, `/pincodes`, `/calls`, `/intercoms`, `/notifications`, `/notificationTokens`, `/organizations`, `/buildingSettings`, `/activityAggregates`, and `/activities` [Confirmed]. 

**Ownership Conclusion**:
Although multiple external modules (`admin`, `building`, `call`, `core`, `organization`, `unit_management`, `access_control_device`) maintain extensive inbound call edges to the controllers of these subcollections (e.g., `OSKUserController` is called by 7 external modules, and `OSKUserAccessesController` is called by 5 external modules), the `user` module remains the definitive owner of these paths [Inferred]. External modules are restricted from writing directly to these collections; instead, they must execute operations through the `user` module's public controllers and services to preserve user-scoped data isolation and enforce security boundaries [Inferred]. The temporary transaction path `/changeEmail/{userId}` and the pre-registration path `/externalUserInvitations` are also owned and managed exclusively by this module [Inferred].

**Per-capability evidence:**

#### _module_root

#### Firestore Paths Touched

- **`/users/{userId}`**: Primary user document `firestore_path_touched|user|functions/src/modules/user/index.ts|/users/{userId}|#1`. **Confirmed**
- **`users`** (Collection Group): Queried during cascading deletion to remove references across all sub-collections `firestore_path_touched|user|functions/src/modules/user/services/user.service.ts|users|#1`. **Confirmed**
- **`/changeEmail/{userId}`**: Managed by `OSKEmailChangeController` to store temporary email change verification documents `imports_dependency|user|functions/src/modules/user/controllers/chnageEmail.controller.ts|../models/documents/changeEmail.model|#1`. **Inferred**

---

#### user_access

This capability owns and manages documents within the following Firestore collection paths:

*   **`/users/{userId}/accesses/{buildingId}`**: Stores the user's consolidated access rights, authorized doors, and metadata for a specific building [Confirmed].
    *   *Operation Scope*: Read, write, and delete operations are performed via `OSKUserAccessesController` `` `functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts` (lines 18-55) `` and `OSKUserAccessService` `` `functions/src/modules/user/modules/user_access/services/user_access.service.ts` (lines 33-88) ``.
*   **`/users/{userId}/buildings/{buildingId}/units/{unitId}`**: Stores the user's relationship to a specific unit within a building [Confirmed].
    *   *Operation Scope*: Read, write, and delete operations are performed via `OSKUserBuildingUnitController` `` `functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts` (lines 21-56) ``.

---

#### user_activity

This capability owns and manages the following Firestore collections [Confirmed; `firestore-schema.md` (lines 572-591)]:

### `/users/{id}/activities`
- **Description**: Stores individual enriched activity records (such as door unlocks or call events) associated with a specific user.
- **Fields**:
  - `activityId`: `string`
  - `accessControlDeviceId`: `string`
  - `userId`: `string`
  - `userName`: `string`
  - `activityType`: `string`
  - `timestamp`: `string`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `doorId`: `string`
  - `doorName`: `string`
  - `creationDate`: `timestamp`

### `/users/{id}/activityAggregates`
- **Description**: Stores aggregated activity records grouped by building ID for a rolling 30-day window.
- **Fields**:
  - `creationDate`: `timestamp`
  - `modificationDate`: `timestamp`
  - `activities`: `array` (contains nested `OSKUserActivity` or `OSKUserCallDocument` objects)

### Security Rules
- **Read Access**: Allowed only if the authenticated user matches the requested `{userId}` [Confirmed; `firestore.rules.txt` (lines 582-591)].
- **Write Access**: Denied for direct client writes; updates must be performed via backend services [Confirmed; `firestore.rules.txt` (lines 584, 589)].

---

#### user_call

- **Firestore Paths**:
  - `/users/{userId}/calls/{callId}`: This capability owns the documents within this subcollection.
    - **Read**: Allowed for authenticated users matching the `userId` parameter `` `firestore.rules.txt` ``.
    - **Write (Set)**: Performed programmatically via `OSKUserCallController.set` `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._set|set|OSKUserCallController.default.getCollectionPath(userId),document.callId,document|#1` ``.
    - **Delete**: Performed programmatically via `OSKUserCallController.deleteAll` `` `call_expression|user|functions/src/modules/user/modules/user_call/controllers/user_call.controller.ts|OSKUserCallController.default._deleteAll|deleteAll|OSKUserCallController.default.getCollectionPath(userId)|#1` ``.

---

#### user_device

### Firestore Paths Touched
- **`/users/{userId}/devices/{deviceId}`**
  - **Operation**: Undetermined / Indirect (managed via `OSKUserDeviceController`) [Confirmed: ``firestore_path_touched|user|functions/src/modules/user/modules/user_device/index.ts|/users/{userId}/devices/{deviceId}|#1``].
- **`/users/{userId}/devices/{deviceId}/accessControlDeviceTokens/{tokenId}`**
  - **Operation**: Write / Delete (managed via `OSKUserDeviceAccessControlDeviceTokenController`) [Inferred: ``controller_method|user|functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts|OSKUserDeviceAccessControlDeviceTokenController|getCollectionPath|#1``].

---

#### user_intercoms

This capability owns and manages documents within the following Firestore collection path:

- **`/users/{userId}/intercoms/{intercomId}`** `` `functions/src/modules/user/modules/user_intercoms/controllers/user_intercoms.controller.ts` (lines 13-15) ``
  - **Fields Managed**:
    - `accessControlDeviceId` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|accessControlDeviceId|#1` ``
    - `ACDName` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|ACDName|#1` ``
    - `buildingId` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|buildingId|#1` ``
    - `callSettingsMode` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callSettingsMode|#1` ``
    - `callTimeSlots` (array) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTimeSlots|#1` ``
    - `callTransferList` (array) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|callTransferList|#1` ``
    - `displayName` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|displayName|#1` ``
    - `doorName` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|doorName|#1` ``
    - `inhabitants` (array) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|inhabitants|#1` ``
    - `unitId` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitId|#1` ``
    - `unitNumber` (string) `` `model_property|user|functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts|OSKUserIntercom|unitNumber|#1` ``

(Confirmed)

#### user_invitation

#### Firestore Paths Touched
- **`/users/{userId}/sentInvitations`**: Stores invitations sent by a user. [Confirmed] Citing `` `firestore_path_touched|user|functions/src/modules/user/modules/user_invitation/controllers/user_sent_invitation.controller.ts|/users/{userId}/sentInvitations|#1` ``.
- **`/users/{userId}/invitations`**: Stores invitations received by a user. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation.controller.ts` (lines 27-47).
- **`/buildings/{buildingId}/units/{unitId}/invitations`**: Stores invitations associated with a specific building unit. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_building.controller.ts` (lines 34-81).
- **`/externalUserInvitations`**: Stores invitations for users who are not yet registered on the platform. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/controllers/user_invitation_external_user.controller.ts` (lines 17-68).
- **`/users`**: Queried to find invitee user IDs. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (lines 64-72).
- **`/organizations/{organizationId}/onboardingInhabitants`**: Queried and deleted during external user invitation processing. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (lines 336-366).
- **`/organizations/{organizationId}/residents`**: Updated during external user invitation processing. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_external_user.service.ts` (line 316).

---

#### user_notification

### Firestore Paths Touched

| Path | Touch Type | Operation Detection Scope | Path Resolution Method | Citation |
| :--- | :--- | :--- | :--- | :--- |
| `/users/{userId}/notifications/{notificationId}` | `path_reference` | `undetermined_may_be_indirect` | `resolved_constant` | `` `firestore_path_touched|user|functions/src/modules/user/modules/user_notification/index.ts|/users/{userId}/notifications/{notificationId}|#1` `` |
| `/users/{userId}/notificationTokens/{tokenId}` | `path_reference` | `undetermined_may_be_indirect` | `resolved_constant` | `` `call_expression|user|functions/src/modules/user/modules/user_notification/controllers/user_notification_token.controller.ts|OSKUserNotificationTokenController.default._set|save|"/users/${userId}/notificationTokens",tokenId,data|#1` `` |

---

#### user_organization

### Firestore Paths
- **`/users/{userId}/organizationInvitations/{organizationId}`**
  - **Operations**: Read (`_get`, `_query`), Delete (`_delete`) [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._get|getUsersOrganizationInvitation|`/users/${userId}/organizationInvitations`,organizationId|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._query|getAllInvitations|`/users/${userId}/organizationInvitations`|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_invitation_pending.controller.ts|OSKUserOrganizationInvitationPendingController.default._delete|deleteUsersOrganizationInvitation|`/users/${userId}/organizationInvitations`,organizationId|#1` ``]
- **`/users/{userId}/organizationRequests/{organizationId}`**
  - **Operations**: Read (`_get`), Write (`_set`) [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController.default._get|get|`/users/${userId}/organizationRequests`,organizationId|#1` ``, `` `call_expression|user|functions/src/modules/user/modules/user_organization/controllers/user_organization_request.controller.ts|OSKUserOrganizationRequestController.default._set|save|`/users/${userId}/organizationRequests`,organizationId,data|#1` ``]
- **`/users/{userId}/organizations/{organizationId}`**
  - **Operations**: Read (`_get`, `_query`), Write (`_set`, `_update`), Delete (`_delete`) [Confirmed; `` `functions/src/modules/user/modules/user_organization/controllers/user_organization.controller.ts` (lines 18-36) ``]

#### user_pincode

### Firestore Paths [Confirmed]

#### `/users/{userId}/pincodes/{pincodeId}`
- **Description**: Stores user-scoped PIN code documents.
- **Operations**: 
  - **Read**: `_get` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (line 26), `_query` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (lines 40, 48, 53, 65).
  - **Write**: `_set` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (line 21).
  - **Delete**: `_delete` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (line 60), `_deleteAll` `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` (line 102).

#### `/buildings/{buildingId}/pincodes/{pincodeId}`
- **Description**: Building-level PIN code document.
- **Operations**:
  - **Delete**: Handled via cross-module call to `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (line 179).

#### `/organizations/{organizationId}/residents/{residentId}`
- **Description**: Organization-scoped resident profile.
- **Operations**:
  - **Read**: `OSKOrganizationResidentsController.default.get` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (line 188).
  - **Write**: `OSKOrganizationResidentsController.default.save` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (line 192).

---

#### user_settings

This capability owns and performs read/write operations on the following Firestore collection paths:

- **`/users/{userId}/buildingSettings/{buildingId}`**: Stores building-level settings for a specific user. [Confirmed]
  - *Operations*: `set`, `get`, `getAll`, `update`, `delete`, `deleteAll` `` `functions/src/modules/user/modules/user_settings/controllers/user_building_settings.controller.ts` (lines 18-85) ``
- **`/users/{userId}/buildingSettings/{buildingId}/unitSettings/{unitId}`**: Stores unit-level settings for a specific user. [Confirmed]
  - *Operations*: `set`, `get`, `getAll`, `update`, `delete` `` `functions/src/modules/user/modules/user_settings/controllers/user_unit_settings.controller.ts` (lines 18-85) ``

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

#### _module_root

#### API Contracts

- **`deleteUserProfileImage`**
  - **Request Type**: `deleteUserProfileImageRequest`
    - `filename`: `string`
    - `userId`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|deleteUserProfileImage|#1`

- **`getCurrentUserUnits`**
  - **Request Type**: `void` (Inferred)
  - **Response Type**: `OSKGetUserUnitsResponseData`
    - `buildingId`: `string`
    - `buildingName`: `string`
    - `units`: `OSKUserBuildingWithUnitsUnit[]`
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|getCurrentUserUnits|#1`

- **`getInhabitantType`**
  - **Request Type**: `OSKGetInhabitantTypeRequest`
    - `buildingId`: `string`
    - `unitId`: `string`
    - `userId`: `string`
  - **Response Type**: `OSKGetInhabitantTypeResponse`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType`
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|getInhabitantType|#1`

- **`getUserIdsByEmailOrPhone`**
  - **Request Type**: `OSKGetUsersByEmailOrPhoneNumberRequestData`
    - `email`: `string | undefined` (optional)
    - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
    - `userId`: `string`
  - **Response Type**: `OSKGetUsersByEmailOrPhoneNumberResponseData`
    - `duplicateFinds`: `{ userIdFound: string; phoneNumber?: OSKPhoneNumber; email: string; }[] | undefined` (optional)
    - `email`: `string`
    - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
    - `userIdFound`: `string`
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|getUserIdsByEmailOrPhone|#1`

- **`initiateEmailChange`**
  - **Request Type**: `OSKUserInitiateEmailChangeRequest`
    - `newEmail`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|initiateEmailChange|#1`

- **`initiatePhoneNumberChange`**
  - **Request Type**: `OSKUserInitiatePhoneChangeRequest`
    - `newPhoneNumber`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|initiatePhoneNumberChange|#1`

- **`onUpdatePhoneNumberCalled`**
  - **Request Type**: `void` (Inferred)
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|onUpdatePhoneNumberCalled|#1`

- **`onUpdatePublicProfileCalled`**
  - **Request Type**: `OSKUserUpdatesPublicProfileRequest`
    - `firstName`: `string`
    - `lastName`: `string`
    - `userId`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|onUpdatePublicProfileCalled|#1`

- **`onUpdateUserOnboardingStatusCalled`**
  - **Request Type**: `OSKUserUpdatesOnboardingStatusRequest`
    - `apiVersion`: `string`
    - `newUserOnboarding`: `{ activateBuildingAccess?: OSKOnboardingStatus; enrollMFA?: OSKOnboardingStatus; }`
    - `userId`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserOnboardingStatusCalled|#1`

- **`onUpdateUserProfileAndPhoneNumberCalled`**
  - **Request Type**: `OSKUpdateUserProfileAndPhoneNumberRequestData`
    - `phoneNumber`: `OSKPhoneNumber | undefined` (optional)
    - `publicProfile`: `OSKUserUpdatesPublicProfileRequest`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserProfileAndPhoneNumberCalled|#1`

- **`onUpdateUserSettingsLanguageCalled`**
  - **Request Type**: `OSKUserUpdatesLanguageRequest`
    - `language`: `string`
    - `userId`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|onUpdateUserSettingsLanguageCalled|#1`

- **`requestMyAccountDeletion`**
  - **Request Type**: `void` (Inferred)
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|requestMyAccountDeletion|#1`

- **`verifyAndCompleteEmailChange`**
  - **Request Type**: `OSKUserVerifyAndCompleteEmailChangeRequest`
    - `code`: `string`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|verifyAndCompleteEmailChange|#1`

- **`verifyAndCompletePhoneNumberChange`**
  - **Request Type**: `OSKUserVerifyAndCompletePhoneNumberChangeRequest`
    - `code`: `string`
    - `phoneNumber`: `OSKPhoneNumber`
  - **Response Type**: `void` (Inferred)
  - **Citation**: `api_contract|user|functions/src/modules/user/index.ts|verifyAndCompletePhoneNumberChange|#1`

#### Firestore Triggers

- **`onDocumentCreated`** (on `/users/{userId}`): Triggers `OSKUserService.onDocumentCreated` to handle post-creation logic `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentCreated|#1`. **Confirmed**
- **`onDocumentUpdated`** (on `/users/{userId}`): Triggers `OSKUserService.onDocumentUpdated` to handle cascading updates when profile fields change `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onDocumentUpdated|#1`. **Confirmed**
- **`onAccountCreated`** (Auth trigger): Triggers `OSKUserService.onAccountCreated` when a user registers via Auth0/Firebase Auth `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1`. **Confirmed**
- **`onAccountDeleted`** (Auth trigger): Triggers `OSKUserService.onAccountDeleted` when a user account is deleted from Firebase Auth `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountDeleted|#1`. **Confirmed**

#### Scheduled Triggers

- **`pubsub.schedule('00 00 * * *').onRun`**: Daily cron job triggering `OSKUserService.onDeleteAccount` to clean up scheduled deletions `call_expression|user|functions/src/modules/user/index.ts|pubsub.schedule('00 00 * * *').onRun|getScheduledFunctionTriggers|async () => OSKUserService.onDeleteAccount()|#1`. **Confirmed**

---

#### user_access

*   **API Contracts**: No `api_contract` facts matched within this capability's evidence pack [Unknown].
*   **Firestore Triggers**: No Firestore triggers are explicitly declared or owned within this capability's evidence pack [Unknown].

---

#### user_activity

### Callable Cloud Functions
The capability registers the following HTTPS callable triggers [Confirmed; `functions/src/modules/user/modules/user_activity/index.ts` (lines 42-51)]:

#### `delete`
- **Request Schema**: `OSKDeleteActivityByIdRequest`
  - `activityId`: `string`
  - `userId`: `string`
- **Handler**: `OSKUserActivitiesService.delete` [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|delete|#1`]

#### `deleteAll`
- **Request Schema**: `OSKDeleteAllUserActivitiesRequest`
  - `userId`: `string`
- **Handler**: `OSKUserActivitiesService.deleteAll` [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|deleteAll|#1`]

#### `getActivityByBuildingId`
- **Request Schema**: `OSKGetUserActivityAggregatesByBuildingIdRequest`
  - `buildingId`: `string`
  - `userId`: `string`
- **Handler**: `OSKUserActivityAggregatesService.getActivityByBuildingId` [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityByBuildingId|#1`]

#### `getActivityById`
- **Request Schema**: `OSKGetUserActivityByIdRequest`
  - `activityId`: `string`
  - `userId`: `string`
- **Handler**: `OSKUserActivitiesService.getActivityById` [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getActivityById|#1`]

#### `getAllUserActivities`
- **Request Schema**: `OSKGetAllUserActivitiesRequest`
  - `userId`: `string`
- **Handler**: `OSKUserActivitiesService.getAllUserActivities` [Confirmed; `api_contract|user|functions/src/modules/user/modules/user_activity/index.ts|getAllUserActivities|#1`]

---

#### user_call

- No API contracts (`api_contract` facts) or Firestore triggers are directly evidenced in this capability's pack.

---

#### user_device

### API Contracts
The following callable Cloud Functions are exposed by this capability:

#### `getDevicesUserList`
- **Request Type**: `OSKGetUserDeviceListRequestData`
  - `userId`: `string`
- **Response Type**: *No matching model_property facts found in this pack.*

#### `removeUserDevice`
- **Request Type**: `OSKRemoveUserDeviceRequestData`
  - `deviceId`: `string`
  - `userId`: `string`
- **Response Type**: *No matching model_property facts found in this pack.*

---

### Firestore Triggers
The capability registers triggers on the `/users/{userId}/devices/{deviceId}` path [Confirmed: ``firestore_path_touched|user|functions/src/modules/user/modules/user_device/index.ts|/users/{userId}/devices/{deviceId}|#1``]:

- **`onCreate`**: Calls `OSKUserDeviceService.onDocumentCreated` [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/index.ts|db.document(userDevicePath).onCreate|getFirestoreTriggers|OSKUserDeviceService.onDocumentCreated|#1``].
- **`onUpdate`**: Calls `OSKUserDeviceService.onDocumentUpdated` [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/index.ts|db.document(userDevicePath).onUpdate|getFirestoreTriggers|OSKUserDeviceService.onDocumentUpdated|#1``].
- **`onDelete`**: Calls `OSKUserDeviceService.onDocumentDeleted` [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/index.ts|db.document(userDevicePath).onDelete|getFirestoreTriggers|OSKUserDeviceService.onDocumentDeleted|#1``].

---

#### user_intercoms

- **API Contracts**: No `api_contract` facts are directly defined within this capability's evidence pack.
- **Firestore Triggers**: No Firestore triggers are directly declared in this capability's evidence pack. (The service methods are designed to be invoked by triggers or orchestrators located in other submodules/modules).

(Confirmed)

#### user_invitation

#### Callable Functions
- **`createUserInvitation`**: Creates a new invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|createUserInvitation|#1` ``.
  - Request Type: `OSKUserInvitationCreateRequest`
    - `buildingId`: `string`
    - `invitation`: `OSKUserInvitationSentRequest`
    - `unitId`: `string`
- **`deleteInvitation`**: Deletes an invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|deleteInvitation|#1` ``.
  - Request Type: `OSKUserInvitationDeleteRequest`
    - `buildingId`: `string`
    - `invitationId`: `string`
    - `invitationType`: `OSKUserInvitationType`
    - `unitId`: `string`
- **`editInvitation`**: Edits an existing invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|editInvitation|#1` ``.
  - Request Type: `OSKUserInvitationUpdateRequest`
    - `invitation`: `Omit<OSKUserInvitationSent, "accessRights"> & { accessRights: OSKAccessRightWithDates[]; }`
- **`getExternalUserInvitation`**: Retrieves external user invitations. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|getExternalUserInvitation|#1` ``.
  - Request Type: `OSKUserExternalUserRequestGet`
    - `phoneOrEmail`: `string`
- **`inviteeAcceptsInvitation`**: Accepts an invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeAcceptsInvitation|#1` ``.
  - Request Type: `OSKInvitationReplyRequest`
    - `buildingId`: `string`
    - `invitationId`: `string`
    - `unitId`: `string`
    - `userId`: `string | undefined` (optional)
- **`inviteeRejectsInvitation`**: Rejects an invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviteeRejectsInvitation|#1` ``.
  - Request Type: `OSKInvitationReplyRequest`
    - `buildingId`: `string`
    - `invitationId`: `string`
    - `unitId`: `string`
    - `userId`: `string | undefined` (optional)
- **`inviterCancelsInvitation`**: Cancels an invitation. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|inviterCancelsInvitation|#1` ``.
  - Request Type: `OSKInvitationReplyRequest`
    - `buildingId`: `string`
    - `invitationId`: `string`
    - `unitId`: `string`
    - `userId`: `string | undefined` (optional)
- **`onGetAllInvitationsByUser`**: Retrieves all invitations for a user. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|onGetAllInvitationsByUser|#1` ``.
  - Request Type: `OSKUserInvitationGetAllRequest`
    - `category`: `OSKInvitationCategory | undefined` (optional)
    - `nextPageToken`: `string | undefined` (optional)
    - `pageSize`: `number | undefined` (optional)
    - `userId`: `string`
  - Response Type: `OSKUserInvitationGetAllResponse`
    - `items`: `OSKUserInvitationGetList[]`
    - `nextPageToken`: `string | undefined` (optional)
- **`processExternalUserInvitations`**: Processes external invitations for a newly registered user. [Confirmed] Citing `` `api_contract|user|functions/src/modules/user/modules/user_invitation/index.ts|processExternalUserInvitations|#1` ``.
  - Request Type: `OSKUserProcessExternalUserInvitationsRequest`
    - `userId`: `string`
  - Response Type: `OSKUserProcessExternalUserInvitationsResponse`
    - `guestInvitations`: `OSKUserInvitationSent[]`
    - `onboardingResults`: `OSKInhabitantOnboardedResult[]`
    - `unitInvitations`: `OSKUnitInvitation[]`
    - `userId`: `string`

#### Firestore Triggers
- None evidenced in this capability's pack. [Confirmed]

---

#### user_notification

### API Contracts (Callable Functions)

#### `onInsertOrUpdateNotificationToken`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` (lines 54-135)
- **Request Schema**:
  ```typescript
  interface OSKUserNotificationToken {
    tokenId: string;
    userId: string;
  }
  ```

#### `onDeleteNotificationToken`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` (lines 137-187)
- **Request Schema**:
  ```typescript
  interface OSKUserNotificationTokenDeleteRequest {
    tokenId: string;
    userId: string;
  }
  ```

#### `onTestNotification`
- **File**: `functions/src/modules/user/modules/user_notification/index.ts` (lines 24-71)
- **Request Schema**: *No matching model properties found in this pack.*

---

### Firestore Triggers

#### Notification Document Updated Trigger
- **Trigger Path**: `/users/{userId}/notifications/{notificationId}`
- **Event**: `onUpdate`
- **Handler**: `OSKUserNotificationService.onDocumentUpdated` `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentUpdated|#1` ``
- **Description**: Increments or decrements the user's unread notification count depending on whether the notification was marked as read or unread.

#### Notification Document Deleted Trigger
- **Trigger Path**: `/users/{userId}/notifications/{notificationId}`
- **Event**: `onDelete`
- **Handler**: `OSKUserNotificationService.onDocumentDeleted` `` `firestore_trigger|user|functions/src/modules/user/modules/user_notification/index.ts|unknown|onDocumentDeleted|#1` ``
- **Description**: Decrements the user's unread notification count if an unread notification is deleted.

---

#### user_organization

### Callable Functions
- **getCurrentUserOrganizationInvitations**
  - **File**: `functions/src/modules/user/modules/user_organization/index.ts` (lines 39-56)
  - **Request Type**: *No schema matched*
  - **Response Type**: *No schema matched*
- **userOrganizationInvitationAccepted**
  - **File**: `functions/src/modules/user/modules/user_organization/index.ts` (lines 58-176)
  - **Request Type**: `OSKUserOrganizationInvitationPendingRequest`
    - `isApproved`: `boolean`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: *No schema matched*
- **userOrganizationInvitationRejected**
  - **File**: `functions/src/modules/user/modules/user_organization/index.ts` (lines 178-244)
  - **Request Type**: `OSKUserOrganizationInvitationPendingRequest`
    - `isApproved`: `boolean`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: *No schema matched*

### Firestore Triggers
- None evidenced in this capability pack. [Confirmed]

#### user_pincode

### Callable APIs [Confirmed]

#### user_settings

The capability exposes the following HTTPS callable API contracts. No Firestore triggers are registered within this capability. [Confirmed] `` `functions/src/modules/user/modules/user_settings/index.ts` (lines 36-45) ``

### Resolved API Request/Response Schemas

#### `createUserSettingsBuilding`
- **Request Type**: `OSKUserCreateSettingsBuildingRequest`
  - `buildingId`: `string`
  - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams`
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
  - `update`: `Partial<OSKBuildingSettingsInputParams>`
  - `userId`: `string`

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains cross-cutting security risk callouts and enforcement patterns.*

#### Mental Enforcement Tally
- **User-Scoped Enforcement**: The majority of submodules (`_module_root`, `user_activity`, `user_device`, `user_invitation`, `user_pincode`) enforce security strictly at the application layer using the `@OSKUserSecurityChecks` decorator or inline `OSKSecurityChecks.checkParameters` [Confirmed]. This ensures that the authenticated user's UID matches the target `userId` [Confirmed].
- **Database-Level Alignment**: Subcollections like `/accesses`, `/calls`, `/intercoms`, and `/pincodes` align with this model by blocking direct client writes in `firestore.rules.txt` while allowing reads only if the authenticated user matches the path parameter (`isAuthenticatedUser(userId)`) [Confirmed].
- **Asymmetric Administrative Overrides**: The `user_settings` submodule presents a significant security asymmetry. It enforces standard RBAC permissions (`v1.org.settings.create/view/edit/delete`) and explicitly configures `@OSKUserSecurityChecks` with `{ checkUserIdMatch: false }` [Confirmed]. This indicates that user settings are treated as administrative/organizational configurations rather than strictly self-managed user preferences, allowing property managers or system administrators to override them [Inferred].

#### Unattributed Security-Relevant Signals
- **`user_device`**: Raises a `permission-denied` error (2 occurrences) during parameter validation in `getDevicesUserList` and `removeUserDevice` with no identifiable RBAC string backing [Confirmed].
- **`user_notification`**: Raises a `permission-denied` error (1 occurrence) during `onDeleteNotificationToken` if the authenticated UID does not match the target `userId` [Confirmed].
- **`user_invitation`**: Raises a `failed-precondition` error (1 occurrence) if App Check verification fails during invitation acceptance [Confirmed].

**Per-capability evidence:**

#### _module_root

Security checks are primarily managed via user-scoped checks using the `@OSKUserSecurityChecks` decorator, which verifies that the authenticated user is operating on their own data `functions/src/modules/user/services/user.service.ts` (lines 195, 257, 343, 697, 721, 961, 997, 1100, 1274, 1445). No explicit RBAC permission strings from `rbac-roles.json` are directly referenced in this capability's evidence pack. **Confirmed**

---

#### user_access

*   **RBAC Permissions**: No specific RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are explicitly referenced in the source code of this capability [Unknown].
*   **Firestore Security Rules**:
    *   For `/users/{userId}/accesses/{accessId}`: Direct reads are allowed if the user is authenticated and matches the `userId` [Confirmed]. Direct writes are blocked (`allow write: if false;`), indicating that all modifications must occur via backend services/Cloud Functions `` `governance/reference-docs/firestore.rules.txt` `` [Confirmed].
    *   For `/users/{userId}/buildings/{buildingId}/units/{unitId}`: Direct reads are allowed if the user is authenticated and matches the `userId` [Confirmed]. Direct writes are blocked (`allow write: if false;`) `` `governance/reference-docs/firestore.rules.txt` `` [Confirmed].

---

#### user_activity

- **RBAC Roles**: No specific RBAC permission strings (e.g., `v1.admin.*` or `v1.org.*`) are referenced in this capability's code.
- **Identity-Based Security**: Security is enforced at the application layer using the `@OSKUserSecurityChecks` decorator [Confirmed; `functions/src/modules/user/modules/user_activity/services/user_activities.service.ts` (lines 54, 67, 80, 89)] and at the database layer via Firestore security rules [Confirmed; `firestore.rules.txt` (lines 582-591)]. Both mechanisms verify that the caller's authenticated UID matches the requested `userId`.

---

#### user_call

- **Firestore Security Rules**:
  - Read access to `/users/{userId}/calls/{callId}` is restricted to the authenticated user owning the account:
    ```javascript
    match /users/{userId}/calls/{callId} {
      allow read: if(isAuthenticatedUser(userId))
    }
    ```
    *(Source: `firestore.rules.txt`)*
  - There are no write rules defined for `/users/{userId}/calls/{callId}` in `firestore.rules.txt`, indicating that write operations are executed exclusively by backend services using the Firebase Admin SDK (which bypasses security rules). [Inferred]
- **RBAC Permissions**:
  - No specific RBAC permission strings are referenced in this capability's evidence pack.

---

#### user_device

### Security Decorators & Parameter Checks
- The service methods `getDevicesUserList` and `removeUserDevice` are decorated with `@OSKUserSecurityChecks` to enforce user-level authentication boundaries [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKUserSecurityChecks|getDevicesUserList||#1``].
- Parameter validation is performed via `OSKSecurityChecks.checkParameters` to verify that the calling context matches the requested `userId` [Confirmed: ``call_expression|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|OSKSecurityChecks.checkParameters|getDevicesUserList|[             { name: 'context', value: context, type: 'object' },             { name: 'userId', value: request.userId, type: 'string' },         ]|#1``].
- If validation fails, a `permission-denied` error is thrown [Confirmed: ``permission_error|user|functions/src/modules/user/modules/user_device/services/user_device.service.ts|permission-denied|#1``].

### Firestore Security Rules Alignment
- The Firestore rules document confirms that standard users can only read, create, update, or delete documents under `/users/{userId}/devices/{deviceId}` if they are authenticated and their UID matches the `{userId}` path parameter (`isAuthenticatedUser(userId)`) [Confirmed: `firestore.rules.txt` (lines 582-587)].

---

#### user_intercoms

- **Firestore Security Rules**:
  - The security rules for `/users/{userId}/intercoms/{intercomId}` restrict access as follows:
    - `read`: Allowed if the user is authenticated and matches the requested `userId` (`isAuthenticatedUser(userId)`) `` `firestore.rules.txt` ``.
    - `write` (create, update, delete): Disallowed directly from the client. This confirms that all write operations are performed securely by backend services (such as `OSKUserIntercomService`) using the Admin SDK.
- **RBAC Permissions**: No specific RBAC permission strings are referenced or checked within this capability's code.

(Confirmed)

#### user_invitation

#### Security Decorators & Checks
- **`@OSKUserSecurityChecks`**: Applied to service methods like `onGetAllInvitationsByUser` and `createUserInvitation` to validate the calling user's identity and context. [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_common.service.ts` (line 184) and `functions/src/modules/user/modules/user_invitation/services/user_invitation_creation.service.ts` (line 87).
- **App Check Verification**: Enforced on callable functions (e.g., throwing a `failed-precondition` error if not called from an App Check verified app). [Confirmed] Citing `functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts` (line 29).

#### RBAC Mismatches
- No direct references to literal RBAC permission strings (e.g., `v1.admin.user.invitations.delete`) are evidenced in this capability's pack. [Confirmed]

---

#### user_notification

### Authentication & App Check
- **App Check Enforcement**: All callable functions enforce App Check verification unless running in the Firebase Emulator environment `` `call_expression|user|functions/src/modules/user/modules/user_notification/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.
- **Authentication Checks**: Handlers verify that the user is authenticated, throwing an `unauthenticated` error if `context.auth` is missing `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onDeleteNotificationToken|'Unauthenticated: You must be authenticated to use onDeleteNotificationToken()',{ context }|#1` ``.

### Scoped Authorization
- **User-Scoped Access**: Handlers enforce that users can only modify their own notification tokens. If `context.auth.uid` does not match the requested `userId`, a `permission-denied` error is thrown `` `call_expression|user|functions/src/modules/user/modules/user_notification/services/user_notification_token.service.ts|OSKUserNotificationTokenService.logger.logError|onDeleteNotificationToken|'Permission-denied: You are not authorized to delete user registration token!',{ request, context }|#1` ``.

### RBAC Cross-Check
- No administrative RBAC permission strings (e.g., `v1.admin.user.devices.delete`) are explicitly checked in this capability's code. Security is strictly enforced via user-scoped identity matching (`context.auth.uid == userId`), which aligns with the Firestore security rules for the `/users/{userId}` subcollections. [Confirmed]

---

#### user_organization

- **App Check Verification**: Callable functions enforce App Check unless running in the emulator environment. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``]
- **Firestore Security Rules**:
  - `/users/{userId}/organizations/{organizationId}` allows `read` access if the user is authenticated, matches the `userId`, and is not deleted. [Confirmed; `firestore.rules.txt`]
  - `/users/{userId}/pincodes/{pincodeId}` allows `read` access if the user is authenticated. [Confirmed; `firestore.rules.txt`]
- **Role Consolidation**: When an invitation is accepted, the capability delegates role generation to `OSKConsolidatedRolesController.generateOrganizationUserRoles` to map the invitation's roles to the user's consolidated roles. [Confirmed; `` `call_expression|user|functions/src/modules/user/modules/user_organization/services/user_organization_invitation.service.ts|OSKConsolidatedRolesController.default.generateOrganizationUserRoles|userOrganizationInvitationAccepted|organizationInvitation.roles,organization.userRoles,...|#1` ``]

#### user_pincode

### Security Decorators & Parameter Checks [Confirmed]
- **`@OSKUserSecurityChecks`**: Applied to `deleteUserPincode` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (line 162) and `onGetUserPincodes` `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (line 143). This decorator validates that the authenticated user has authority to perform actions on behalf of the target `userId`.
- **`OSKSecurityChecks.checkParameters`**: Validates incoming request parameters inline `functions/src/modules/user/modules/user_pincode/services/user_pincode.service.ts` (lines 164, 148).

### Firestore Rules Alignment [Confirmed]
- The security model aligns with the Firestore security rules defined in `firestore.rules.txt` for user pincodes:
  ```javascript
  match /users/{userId}/pincodes/{pincodeId} {
    allow read: if isAuthenticatedUser(userId);
  }
  ```
  This ensures that standard users can only read their own PIN codes, matching the user-scoped validation enforced by the controller and service layers.

---

#### user_settings

The capability references and enforces the following permission strings:

- **`v1.org.settings.create`**: Required to create user settings. [Confirmed] `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.create|#1` ``
- **`v1.org.settings.view`**: Required to view user settings. [Confirmed] `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.view|#1` ``
- **`v1.org.settings.edit`**: Required to edit user settings. [Confirmed] `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.edit|#1` ``
- **`v1.org.settings.delete`**: Required to delete user settings. [Confirmed] `` `permission_required|user|functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts|v1.org.settings.delete|#1` ``
- **`v1.org.admin`**: Evaluated as a candidate permission during bulk retrieval of building settings. [Inferred] `` `permission_candidate|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|v1.org.admin|#1` ``

### Security Decorators
The capability utilizes the `OSKUserSecurityChecks` decorator on service methods to enforce security boundaries, specifically passing `{ checkUserIdMatch: false }` to delegate user identity matching to other layers or administrative overrides. [Confirmed] `` `call_expression|user|functions/src/modules/user/modules/user_settings/services/user_building_settings.service.ts|OSKUserSecurityChecks|createUserSettingsBuilding|{ checkUserIdMatch: false }|#1` ``

### 10. Cross-Module Relationships

*Note: This section lists only genuine, confirmed cross-module relationships.*

#### Outbound Dependencies (Confirmed)
- **`access_control_device`**: Imports `EnrichedActivityData` and `OSKAccessControlDeviceTokenPayload` for activity enrichment and device token payload structures.
- **`apps`**: Imports `OSKNotificationType`, `OSKNotificationOptions`, `OSKNotificationService`, and `OSKEmailService` to dispatch emails and push notifications.
- **`building`**: Imports `OSKBuildingUnitInhabitantType`, `OSKUserDoor`, and `OSKBuildingAccess`. Calls `OSKBuildingController.get/getSafe/getAll`, `OSKBuildingDoorController.getSafe/getAllSafe`, `OSKBuildingUnitController.get`, `OSKBuildingUnitInhabitantService.addInhabitant/removeInhabitant`, `OSKBuildingUnitInhabitantController.get/queryInhabitants/update`, `OSKBuildingUserController.get/update`, and `OSKBuildingAccessesController.get/update`.
- **`call`**: Imports `OSKCallStatus`. Calls `OSKUserCallController.set` and `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- **`core`**: Imports `OSKDocumentController`, `OSKDocumentList`, `OSKDocumentId`, `OSKDocumentAndMessageController`. Calls document CRUD operations (`_get`, `_set`, `_create`, `_update`, `_delete`, `_deleteAll`, `_query`, `_queryOr`, `_queryWithPagination`, `_listDocuments`, `_generateDocId`, `_uploadImage`, `_deleteImage`), logging (`logInfo`, `logWarning`, `logError`), access utilities (`OSKAccessUtilsService.generateAccessId/getAccessInviterName/validateAccessRights`, `OSKAccessUtilsDatesService.convertAccessRightsToDateString/convertAccessRightsToFirebaseTimestamp/convertAccessRightToFirebaseTimestamp`), access services (`OSKAccessService.createAccess/updateAccess/deleteAccessById`, `OSKAccessUpdateService.updateUserAccessDevices/updateAccessesUserInfo`), pincode services (`OSKPincodeService.deletePincodeAnonymousAccess/deleteBuildingPincodeAndMoveToTrash`), secret services (`OSKSecretService.getPrivateKey/getSecret`), and Auth0 services (`OSKAuth0Service.deleteAuth0User/getUsersByEmail/getUsersByPhoneNumber/updateUserEmail/updateUserPhoneNumber`).
- **`organization`**: Imports `OSKOrganizationResidentsController`, `OSKOrganizationOnboardingInhabitant`, `OSKOrganizationOnboardingInhabitantController`, `OSKOrganizationOnboardingInhabitantService`, `OSKOrganization`, `OSKOrganizationDocument`. Calls `OSKOrganizationOnboardingInhabitantController.delete/queryOnboardingDocuments`, `OSKOrganizationOnboardingInhabitantService._sendOnboardingNotificationEmail`, `OSKOrganizationResidentsController.get/save/update`, `OSKOrganizationController.get`, `OSKOrganizationUserController.get/save/update`, `OSKOrganizationUserInvitationController.deleteOrganizationUserInvitation/getOrganizationsUserInvitation/moveOrganizationUserInvitation`, and `OSKOrganizationResidentsService.checkInhabitantTypeAndDeleteAllInhabitantresident/deleteAppUserResident`.
- **`settings`**: Imports `OSKAppStoreSettingsService`, `OSKAppStoreSettings`, `OSKAppStoreSettingsController`, `OSKConsolidatedRolesController`. Calls `OSKAppStoreSettingsService.getAppstoreInformation`, `OSKAppStoreSettingsController.get`, `OSKConsolidatedRolesController.generateOrganizationUserRoles/checkUserPermissions`.
- **`supplier`**: Imports `OSKSupplierStaffAccess`.
- **`unit_management`**: Imports `OSKUnitInvitation`, `OSKUnitInvitationInvitees`. Calls `OSKUnitManagementCreationInvitationService.consumeUnitInvitationInvitee` and `OSKUnitManagementCreationOskeyUserInvitationService.createPermanentGuest`.

#### Inbound Dependencies (Confirmed)
- **`access_control_device`**: Calls `OSKUserController.get` for activity enrichment.
- **`admin`**: Calls `OSKUserAccessesController.getPerBuilding/getPerBuildingSafe/update/getAll`, `OSKUserController.get/getAll/getAllId/getByEmail`, `OSKUserDeviceService.createAccessDeviceToken`, `OSKUserSettingsBuildingController.getAll/update/set`, `OSKUserIntercomController.delete/getAllIntercomByUser`, `OSKUserPincodeController.getSpecificPincodesByQuery`, `OSKUserSettingsUnitController.getAll`, `OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant`, and `OSKUserInvitationController.update`.
- **`apps`**: Calls `OSKUserNotificationTokenController.delete/getAll`.
- **`building`**: Calls `OSKUserIntercomService.updateAllUserIntercomEntry/cleanUpUserIntercomsAfterInhabitantDeletion/createAndUpdateUsersIntercomEntry/deleteUserIntercom`, `OSKUserController.get/getAll`, `OSKUserSettingsBuildingController.delete/get/update/set`, `OSKUserService._getInhabitantType`, `OSKUserSettingsBuildingService.createUserSettingsFromBuildingSettings`, `OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant`, and `OSKUserAccessesController.deleteAllUserAccesses`.
- **`call`**: Calls `OSKUserActivityAggregatesService.ActivityReceivedForUser`, `OSKUserCallController.set`, `OSKUserController.get`, and `OSKUserNotificationService.createSpecial`.
- **`core`**: Calls `OSKUserAccessesController.getAll/getPerBuilding/deleteAllAccessesPerBuilding/save`, `OSKUserDeviceController.getAllActive`, `OSKUserPincodeController.getByAccessId/delete/get/getSafe`, `OSKUserController.get/getSafe/updateFields`, `OSKUserInvitationBuildingController.save/get/update`, `OSKUserInvitationController.update/queryUserInvitationsCollection`, `OSKUserInvitationCreationService.constructUserInvitationSentObject`, `OSKUserPincodeService.createPincodeAnonymousDocument/createPincodeGuestDocument/createPincodeInhabitantDocument/createPincodePermanentGuestDocument`, `OSKUserSentInvitationController.save/getById/update`, `OSKUserDeviceService.createAccessDeviceToken`, `OSKUserAccessService.setupUserAccess/createOrUpdateUserAccess`, `OSKUserActivitiesService.ActivityReceivedForUser`, and `OSKUserActivityAggregatesService.ActivityReceivedForUser`.
- **`organization`**: Calls `OSKUserController.get/queryUsersCollection/getByEmail`, `OSKUserPincodeController.getAll/getByAccessId/delete`, `OSKUserNotificationService.create`, `OSKUserAccessesController.deleteAllAccessesPerBuilding/getAll`, `OSKUserOrganizationController.save/delete/update`, `OSKUserOrganizationInvitationPendingController.deleteUsersOrganizationInvitation`.
- **`unit_management`**: Calls `OSKUserController.get/getByEmail/getSafe/queryOrCollection`, `OSKUserInvitationExternalUserController.delete/get`, `OSKUserPincodeController.delete/getByAccessId/getSpecificPincodesByQuery`, `OSKUserInvitationExternalUnitService.createExternalUnitInvitation`, and `OSKUserAccessesController.getPerBuilding`.

### 11. External Hooks

#### _module_root

- **Twilio Verify API**: Used for sending and verifying SMS OTP codes for phone number changes `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKSecretService.getSecret|_sendVerificationSms|OSKApiName.TwilioAccountSID|#1`. **Confirmed**
- **Auth0 Management API**: Used for deleting users, updating emails, updating phone numbers, and looking up users by email/phone `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKAuth0Service.deleteAuth0User|onAccountDeleted|email|#1`. **Confirmed**
- **Google Cloud Storage**: Used for user profile image storage and deletion `call_expression|user|functions/src/modules/user/controllers/user.controller.ts|storage()                 .bucket()                 .deleteFiles|delete|{ prefix: `users/${userId}/` }|#1`. **Confirmed**

---

#### user_access

This capability defines several data structures that serve as candidates for external integration:

*   **Pub/Sub Integration (Asynchronous Sync)**:
    *   The capability defines type aliases such as `OSKPubsubUserAccessBase`, `OSKPubsubUserAccessInsert`, `OSKPubsubUserAccessUpdate`, `OSKPubsubUserAccessDelete`, `OSKPubsubUserAccessRecreate`, and `OSKAccessPubsubdMessage` `` `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` (lines 3-44) `` [Confirmed]. These models represent the payload structure used to propagate user access changes asynchronously to edge hardware (ACDs) via Pub/Sub, matching the system's Event-Driven IoT pattern [Inferred].

---

#### user_activity

- No external hooks, Pub/Sub topics, or external storage paths are directly evidenced within this capability's pack.

---

#### user_call

- No external hooks (such as Pub/Sub publishers, external HTTP paths, or storage paths) are evidenced within this capability's pack.

---

#### user_device

*No external hooks (such as Pub/Sub topics, external HTTP paths, or storage paths) are directly evidenced within this capability's pack.*

---

#### user_intercoms

No external hooks (such as Pub/Sub topics, external HTTP paths, environment variables, or cloud storage paths) are directly evidenced within this capability's pack. (Confirmed)

#### user_invitation

- No external hooks (such as Pub/Sub topics, external HTTP endpoints, or storage paths) are directly evidenced within this capability's pack. [Confirmed]

---

#### user_notification

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally disable App Check enforcement during local development and testing `` `functions/src/modules/user/modules/user_notification/index.ts` (line 62) ``. [Confirmed]

### External Integrations
- **Firebase Cloud Messaging (FCM)**: Indirectly integrated. This capability collects and validates FCM registration tokens (`fcmToken`) and stores them in Firestore, where they are subsequently consumed by the `apps/notification` module to dispatch push notifications to iOS and Android devices. [Confirmed]

---

#### user_organization

- **App Check**: Enforces App Check verification on incoming client requests. [Confirmed; `` `functions/src/modules/user/modules/user_organization/index.ts` (lines 50-51) ``]

#### user_pincode

- No external hooks (such as Pub/Sub topics, external HTTP paths, or storage paths) are directly evidenced within this capability's pack [Confirmed].

---

#### user_settings

The capability interacts with the following external system boundaries:

- **`OSK_FIREBASE_EMULATOR`**: An environment variable used to conditionally bypass Firebase App Check enforcement when running in a local emulator environment. [Confirmed] `` `call_expression|user|functions/src/modules/user/modules/user_settings/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``

### 12. Architectural Observations

- **Strict User-Scoped Data Isolation**: The module implements a highly secure, self-managed data boundary [Confirmed]. Standard users can only read or interact with their own subcollections, enforced symmetrically across Firestore security rules and the `@OSKUserSecurityChecks` decorator [Confirmed].
- **Decoupled Hardware Projections**: The module does not directly communicate with physical edge devices [Inferred]. Instead, it writes user-centric configurations (such as pincodes, devices, and accesses) to Firestore, which are subsequently projected to MongoDB and synchronized to hardware asynchronously via Pub/Sub [Inferred].
- **Administrative Overrides**: While standard users are restricted to self-management, administrative modules (`admin`, `organization`, `building`) maintain extensive inbound coupling to bypass user-scoped restrictions for provisioning, maintenance, and configuration [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Role Mismatch**: The `user_settings` submodule references `v1.org.admin` as a candidate permission in `getAllUserSettingsBuilding`, but `v1.org.admin` is not defined in the `rbac-roles.json` document [Confirmed].
- **Asymmetric Security Enforcement**: While most submodules enforce strict user identity matching via `@OSKUserSecurityChecks`, the `user_settings` submodule explicitly disables this check (`{ checkUserIdMatch: false }`) [Confirmed]. This introduces a risk of unauthorized settings modification if the controller or callable function layers fail to properly validate the user context [Inferred].
- **Unattributed Security-Relevant Signals**:
  - `user_device` raises a `permission-denied` error during parameter validation in `getDevicesUserList` and `removeUserDevice` with no explicit RBAC string backing [Confirmed].
  - `user_notification` raises a `permission-denied` error during `onDeleteNotificationToken` if the authenticated UID does not match the target `userId` [Confirmed].
- **Cascading Deletion Complexity**: The cascading deletion workflow in `_module_root` queries the `users` collection group to remove references across all sub-collections [Confirmed]. This introduces a performance and timeout risk during account deletion if a user has a large volume of historical activities, calls, or notifications [Inferred].

**Per-capability open questions:**

#### _module_root

- The exact implementation details of the `@OSKUserSecurityChecks` decorator are not present in this pack, as it is imported from an external path `imports_dependency|user|functions/src/modules/user/services/user.service.ts|../../../decorators/securityChecks|#1`.
- The exact trigger path for `onAccountCreated` and `onAccountDeleted` is marked as `unknown` in the `firestore_trigger` table, though the code maps them to `auth.user().onCreate` and `auth.user().onDelete` respectively `firestore_trigger|user|functions/src/modules/user/index.ts|unknown|onAccountCreated|#1`.

#### user_access

*   **Pub/Sub Publishing Mechanism**: The evidence pack defines the message models for Pub/Sub (`user_accesses_message.model.ts`) but does not contain the actual publishing logic. It is unknown which service or trigger is responsible for dispatching these messages to GCP Pub/Sub [Unknown].
*   **Controller Security**: Since Firestore security rules block direct client writes to `/users/{userId}/accesses` and `/users/{userId}/buildings/{buildingId}/units`, it is inferred that `OSKUserAccessesController` and `OSKUserBuildingUnitController` run in an administrative/server context (e.g., Cloud Functions). However, the exact authentication and authorization middleware wrapping these controllers is not visible in this pack [Unknown].

#### user_activity

- **Activity Ingestion Trigger**: The evidence pack contains `ActivityReceivedForUser` methods in both `OSKUserActivitiesService` and `OSKUserActivityAggregatesService`, but the actual trigger (e.g., a Pub/Sub subscription or Firestore document trigger on raw hardware logs) that invokes these methods is not defined within this submodule.
- **Call Activity Source**: It is inferred that call activities are merged into the aggregates, but the exact mechanism of how call events are dispatched to this submodule remains unevidenced in this pack.

#### user_call

- **Invocation Context**: How are the `set` and `deleteAll` methods of `OSKUserCallController` invoked? The evidence pack does not contain routing or entry-point registration files mapping these controller methods to HTTP endpoints or Pub/Sub triggers.
- **Write Permissions**: Since there are no write permissions defined in `firestore.rules.txt` for `/users/{userId}/calls/{callId}`, is there any scenario where a client application needs to write directly to this collection, or is it strictly a backend-driven projection of call events?

#### user_device

- **Response Schemas**: The exact response schemas for `getDevicesUserList` and `removeUserDevice` are not defined in the provided `model_property` facts.
- **Device Types**: While `OKSUserMobileDevice` and `OSKUserBluetoothDevice` are defined as type aliases, the full list of supported device types (e.g., smartwatches, tablets) and their specific cryptographic capabilities remains unevidenced in this pack.

#### user_intercoms

- **Triggering Mechanism**: What specific events or triggers (e.g., Firestore document triggers on `/buildings/{id}/units/{id}/inhabitants`) invoke `OSKUserIntercomService.createAndUpdateUsersIntercomEntry` and `OSKUserIntercomService.cleanUpUserIntercomsAfterInhabitantDeletion`? The trigger definitions themselves are not present in this capability's evidence pack. (Inferred)
- **Call Settings Mode**: What are the valid values and behaviors associated with `callSettingsMode` (e.g., direct call, call forwarding, do not disturb)? (Unknown)

#### user_invitation

- **Notification Dispatch Channels**: The capability imports `@oskey/apps/notification` and `@oskey/user/notification`, but the exact templates and delivery channels (e.g., email vs. SMS) for invitations are handled externally. How are these configured? [Inferred]
- **Expired Invitation Cleanup**: Are there background cron tasks or triggers that clean up expired invitations, or are they only deleted on-demand via `deleteInvitation`? [Inferred]

#### user_notification

- **Test Notification Payload**: What is the exact request payload structure for the `onTestNotification` callable function, as no matching `model_property` facts were resolved in this pack?
- **Token Pruning**: Is there an asynchronous cron job or background process that prunes expired or stale FCM tokens, or does the system rely entirely on reactive deletion during token collisions and user logouts?

#### user_organization

- **Organization Request Approval Workflow**: The capability provides `OSKUserOrganizationRequestController` to save and get organization requests, but the workflow for how these requests are approved or rejected by organization administrators is not evidenced in this capability pack. [Inferred]
- **Notification Dispatch**: The architecture document mentions notification delivery when invitations are received or accepted, but there are no direct notification dispatch calls evidenced within this submodule's invitation acceptance or rejection logic. [Inferred]

#### user_pincode

- **Response Schemas**: What are the exact response schemas returned by `onGetUserPincodes` and `deleteUserPincode`? (No `model_property` facts matched for response types in this pack).
- **Security Decorator Implementation**: How does `@OSKUserSecurityChecks` validate the user context internally? (The decorator is imported from `../../../../../decorators/securityChecks`, which is outside this capability's boundary).
- **Asynchronous Syncing**: Does deleting a user pincode trigger an asynchronous hardware synchronization event (e.g., via Pub/Sub), or is that entirely encapsulated within `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`?

#### user_settings

- Why is `checkUserIdMatch` set to `false` in the `OSKUserSecurityChecks` decorator for all user settings service methods? Is user identity validation fully delegated to the controller or the callable function context?
- The role `v1.org.admin` is checked as a candidate permission in `getAllUserSettingsBuilding` but is not explicitly defined in the `rbac-roles.json` document. What is the exact mapping of this role to the system's permission model?
- Are updates to user-specific building or unit settings synchronized to edge devices (ACDs) via Pub/Sub, or do they remain purely cloud-side configurations?

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
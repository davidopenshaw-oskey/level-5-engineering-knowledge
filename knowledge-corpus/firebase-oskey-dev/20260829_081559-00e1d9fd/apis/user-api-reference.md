### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:38:23.388Z
- repoName: firebase-oskey-dev
- targetModule: user
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
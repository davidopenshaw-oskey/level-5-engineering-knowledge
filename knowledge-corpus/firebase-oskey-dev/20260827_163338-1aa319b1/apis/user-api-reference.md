### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:57:23.949Z
- repoName: firebase-oskey-dev
- targetModule: user
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
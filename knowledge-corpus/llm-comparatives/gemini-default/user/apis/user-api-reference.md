### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:20:01.195Z
- repoName: firebase-oskey-dev
- targetModule: user
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

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
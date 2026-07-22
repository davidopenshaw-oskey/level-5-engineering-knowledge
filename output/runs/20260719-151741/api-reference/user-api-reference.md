# API Reference: user

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.471Z

---

## 1. Callable Functions

### Interpretation

The `user` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `getInhabitantType` | `OSKGetInhabitantTypeRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `requestMyAccountDeletion` | `unknown` | ```json
{}
``` |
| `deleteUserProfileImage` | `deleteUserProfileImageRequest` | ```json
{
  "userId": "string",
  "filename": "string"
}
``` |
| `onUpdatePhoneNumberCalled` | `OSKPhoneNumber` | ```json
{
  "isoCountryCode": "string",
  "dialCode": "string",
  "localPhoneNumber": "string",
  "internationalPhoneNumber": "string"
}
``` |
| `verifyAndCompleteEmailChange` | `OSKUserVerifyAndCompleteEmailChangeRequest` | ```json
{
  "code": "string"
}
``` |
| `initiateEmailChange` | `OSKUserInitiateEmailChangeRequest` | ```json
{
  "newEmail": "string"
}
``` |
| `verifyAndCompletePhoneNumberChange` | `OSKUserVerifyAndCompletePhoneNumberChangeRequest` | ```json
{
  "phoneNumber": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber",
  "code": "string"
}
``` |
| `initiatePhoneNumberChange` | `OSKUserInitiatePhoneChangeRequest` | ```json
{
  "newPhoneNumber": "string"
}
``` |
| `onUpdatePublicProfileCalled` | `OSKUserUpdatesPublicProfileRequest` | ```json
{
  "userId": "string",
  "firstName": "string",
  "lastName": "string"
}
``` |
| `onUpdateUserProfileAndPhoneNumberCalled` | `OSKUpdateUserProfileAndPhoneNumberRequestData` | ```json
{
  "publicProfile": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/models/functions/user_updates_publicprofile_request_document\").OSKUserUpdatesPublicProfileRequest",
  "phoneNumber": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber | undefined"
}
``` |
| `onUpdateUserOnboardingStatusCalled` | `OSKUserUpdatesOnboardingStatusRequest` | ```json
{
  "userId": "string",
  "apiVersion": "string",
  "newUserOnboarding": "{ activateBuildingAccess?: OSKOnboardingStatus | undefined; enrollMFA?: OSKOnboardingStatus | undefined; }"
}
``` |
| `onUpdateUserSettingsLanguageCalled` | `OSKUserUpdatesLanguageRequest` | ```json
{
  "userId": "string",
  "language": "string"
}
``` |
| `getCurrentUserUnits` | `{ userId: string }` | ```json
{
  "userId": "string"
}
``` |
| `getUserIdsByEmailOrPhone` | `OSKGetUsersByEmailOrPhoneNumberRequestData` | ```json
{
  "userId": "string",
  "email": "string | undefined",
  "phoneNumber": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber | undefined"
}
``` |
| `getActivityById` | `OSKGetUserActivityByIdRequest` | ```json
{
  "userId": "string",
  "activityId": "string"
}
``` |
| `getAllUserActivities` | `OSKGetAllUserActivitiesRequest` | ```json
{
  "userId": "string"
}
``` |
| `delete` | `OSKDeleteActivityByIdRequest` | ```json
{
  "userId": "string",
  "activityId": "string"
}
``` |
| `deleteAll` | `OSKDeleteAllUserActivitiesRequest` | ```json
{
  "userId": "string"
}
``` |
| `getActivityByBuildingId` | `OSKGetUserActivityAggregatesByBuildingIdRequest` | ```json
{
  "userId": "string",
  "buildingId": "string"
}
``` |
| `getDevicesUserList` | `OSKGetUserDeviceListRequestData` | ```json
{
  "userId": "string"
}
``` |
| `removeUserDevice` | `OSKRemoveUserDeviceRequestData` | ```json
{
  "userId": "string",
  "deviceId": "string"
}
``` |
| `createUserInvitation` | `OSKUserInvitationCreateRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitation": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model\").OSKUserInvitationSentRequest"
}
``` |
| `getExternalUserInvitation` | `OSKUserExternalUserRequestGet` | ```json
{
  "phoneOrEmail": "string"
}
``` |
| `processExternalUserInvitations` | `OSKUserProcessExternalUserInvitationsRequest` | ```json
{
  "userId": "string"
}
``` |
| `onGetAllInvitationsByUser` | `OSKUserInvitationGetAllRequest` | ```json
{
  "userId": "string",
  "category": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model\").OSKInvitationCategory | undefined",
  "pageSize": "number | undefined",
  "nextPageToken": "string | undefined"
}
``` |
| `inviteeAcceptsInvitation` | `OSKInvitationReplyRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitationId": "string",
  "userId": "string | undefined"
}
``` |
| `inviteeRejectsInvitation` | `OSKInvitationReplyRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitationId": "string",
  "userId": "string | undefined"
}
``` |
| `inviterCancelsInvitation` | `OSKInvitationReplyRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitationId": "string",
  "userId": "string | undefined"
}
``` |
| `editInvitation` | `OSKUserInvitationUpdateRequest` | ```json
{
  "invitation": "Omit<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model\").OSKUserInvitationSent, \"accessRights\"> & { accessRights: import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/modules/access/models/access_right.model\").OSKAccessRightWithDates[]; }"
}
``` |
| `deleteInvitation` | `OSKUserInvitationDeleteRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitationId": "string",
  "invitationType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model\").OSKUserInvitationType"
}
``` |
| `onInsertOrUpdateNotificationToken` | `OSKUserNotificationTokenInsertOrUpdateBody` | ```json
{
  "userId": "string",
  "tokenId": "string",
  "deviceToken": "any",
  "deviceType": "any"
}
``` |
| `onDeleteNotificationToken` | `OSKUserNotificationTokenDeleteRequest` | ```json
{
  "userId": "string",
  "tokenId": "string"
}
``` |
| `onTestNotification` | `{ userId: string }` | ```json
{
  "userId": "string"
}
``` |
| `getCurrentUserOrganizationInvitations` | `Record<string, never>` | ```json
{}
``` |
| `userOrganizationInvitationAccepted` | `OSKUserOrganizationInvitationPendingRequest` | ```json
{
  "userId": "string",
  "organizationId": "string",
  "isApproved": "boolean"
}
``` |
| `userOrganizationInvitationRejected` | `OSKUserOrganizationInvitationPendingRequest` | ```json
{
  "userId": "string",
  "organizationId": "string",
  "isApproved": "boolean"
}
``` |
| `onGetUserPincodes` | `OSKUserPincodeGetRequest` | ```json
{
  "userId": "string"
}
``` |
| `deleteUserPincode` | `OSKUserPincodeDeleteRequest` | ```json
{
  "userId": "string",
  "pincodeId": "string"
}
``` |
| `createUserSettingsBuilding` | `OSKUserCreateSettingsBuildingRequest` | ```json
{
  "buildingId": "string",
  "userId": "string",
  "buildingSettingsInputParams": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_settings/models/documents/building_settings.model\").OSKBuildingSettingsInputParams"
}
``` |
| `updateUserSettingsBuilding` | `OSKUserUpdateSettingsBuildingRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "update": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_settings/models/documents/building_settings.model\").OSKBuildingSettingsInputParams>"
}
``` |
| `getUserSettingsBuilding` | `OSKUserGetSettingsBuildingRequest` | ```json
{
  "buildingId": "string",
  "userId": "string"
}
``` |
| `getAllUserSettingsBuilding` | `OSKUserGetAllSettingsBuildingRequest` | ```json
{
  "userId": "string"
}
``` |
| `deleteUserSettingsBuilding` | `OSKUserDeleteSettingsBuildingRequest` | ```json
{
  "buildingId": "string",
  "userId": "string"
}
``` |

### Evidence Used

- API Contract: The `user-evidence-graph.json` file contains 43 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/user/index.ts` registers these handlers.

### Confidence

High.

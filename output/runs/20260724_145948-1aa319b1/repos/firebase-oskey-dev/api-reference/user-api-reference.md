# API Reference: user

## 0. Generation Metadata

- **Run ID**: 20260724_145948-1aa319b1
- **Generated At**: 2026-07-24T14:59:50.680Z

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
  "phoneNumber": "OSKPhoneNumber",
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
  "publicProfile": "OSKUserUpdatesPublicProfileRequest",
  "phoneNumber": "OSKPhoneNumber | undefined"
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
  "phoneNumber": "OSKPhoneNumber | undefined"
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
  "invitation": "OSKUserInvitationSentRequest"
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
  "category": "OSKInvitationCategory | undefined",
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
  "invitation": "Omit<OSKUserInvitationSent, \"accessRights\"> & { accessRights: OSKAccessRightWithDates[]; }"
}
``` |
| `deleteInvitation` | `OSKUserInvitationDeleteRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "invitationId": "string",
  "invitationType": "OSKUserInvitationType"
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
  "buildingSettingsInputParams": "OSKBuildingSettingsInputParams"
}
``` |
| `updateUserSettingsBuilding` | `OSKUserUpdateSettingsBuildingRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "update": "Partial<OSKBuildingSettingsInputParams>"
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

---

## 2. Domain Types & Enums

### Enums

| Enum Name | Members | File |
| :--- | :--- | :--- |
| `OSKUserAccessType` | `InhabitantUser = inhabitantUser`, `InhabitantGuestUser = inhabitantGuestUser`, `InhabitantPermanentGuestUser = inhabitantPermanentGuestUser`, `InhabitantAnonymousUser = inhabitantAnonymousUser`, `OrganizationUser = organizationUser`, `OrganizationGuestUser = organizationGuestUser`, `SupplierStaff = supplierStaff`, `NonAppUser = nonAppUser` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKInvitationCategory` | `Granted = granted`, `Received = received` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKChangeEmail` | `{     userId: string;     newEmail: string;     verificationCode: string;     expiresAt: Timestamp; }` | `functions/src/modules/user/models/documents/changeEmail.model.ts` |
| `OSKChangeEmailDocument` | `OSKDocument<OSKChangeEmail>` | `functions/src/modules/user/models/documents/changeEmail.model.ts` |
| `OSKUser` | `{     userId: string;     email: string;     phoneNumber?: OSKPhoneNumber;     publicProfile: OSKUserPublicProfile;  ...` | `functions/src/modules/user/models/documents/user_document.model.ts` |
| `OSKUserDocument` | `OSKDocument<OSKUser>` | `functions/src/modules/user/models/documents/user_document.model.ts` |
| `OSKDeleteUserAccountRequest` | `{ auth0UserId: string }` | `functions/src/modules/user/models/functions/delete_user_account.model.ts` |
| `deleteUserProfileImageRequest` | `{ userId: string; filename: string }` | `functions/src/modules/user/models/functions/delete_user_profile_image.model.ts` |
| `OSKGetInhabitantTypeRequest` | `{     userId: string;     buildingId: string;     unitId: string; }` | `functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts` |
| `OSKGetInhabitantTypeResponse` | `{     inhabitantType: OSKBuildingUnitInhabitantType; }` | `functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts` |
| `OSKUserBuildingWithUnitsUnit` | `{     unitId: string;     unitNumber: string;     unitName: string; }` | `functions/src/modules/user/models/functions/get_user_units_response_data.model.ts` |
| `OSKUserBuildingWithUnits` | `{     buildingId: string;     buildingName: string;     units: OSKUserBuildingWithUnitsUnit[]; }` | `functions/src/modules/user/models/functions/get_user_units_response_data.model.ts` |
| `OSKGetUserUnitsResponseData` | `OSKUserBuildingWithUnits[]` | `functions/src/modules/user/models/functions/get_user_units_response_data.model.ts` |
| `OSKGetUsersByEmailOrPhoneNumberRequestData` | `{     userId: string,     email?: string,     phoneNumber?: OSKPhoneNumber; }` | `functions/src/modules/user/models/functions/get_userIds_by_email_or_phone.document.ts` |
| `OSKGetUsersByEmailOrPhoneNumberResponseData` | `{     email: string,     phoneNumber?: OSKPhoneNumber,     userIdFound: string,     duplicateFinds?:          {      ...` | `functions/src/modules/user/models/functions/get_userIds_by_email_or_phone.document.ts` |
| `OSKUpdateUserProfileAndPhoneNumberRequestData` | `{     publicProfile: OSKUserUpdatesPublicProfileRequest;     phoneNumber?: OSKPhoneNumber; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `OSKUserInitiateEmailChangeRequest` | `{     newEmail: string; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `OSKUserInitiatePhoneChangeRequest` | `{     newPhoneNumber: string; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `OSKUserVerifyAndCompleteEmailChangeRequest` | `{     code: string; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `OSKUserVerifyAndCompletePhoneNumberChangeRequest` | `{     phoneNumber: OSKPhoneNumber;     code: string; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `CodeEmailPayload` | `{     language: OSKSupportedLanguage;     email: string;     code: string; }` | `functions/src/modules/user/models/functions/user_update_name_and_phone.document.ts` |
| `OSKUserUpdatesLanguageRequest` | `{     userId: string;     language: string; }` | `functions/src/modules/user/models/functions/user_updates_language_request_document.ts` |
| `OSKOnboardingStatus` | `'done' \| 'notDone' \| 'skipped'` | `functions/src/modules/user/models/functions/user_updates_status_request_document.ts` |
| `OSKUserUpdatesOnboardingStatusRequest` | `{     userId: string;     apiVersion: string;     newUserOnboarding: {         activateBuildingAccess?: OSKOnboarding...` | `functions/src/modules/user/models/functions/user_updates_status_request_document.ts` |
| `OSKUserGlobalSettings` | `{     language: OSKSupportedLanguage; }` | `functions/src/modules/user/models/shared/user_global_settings.model.ts` |
| `OSKUserNotificationSettings` | `{     onFriendRequestReceived: boolean;     onFriendRequestApproved: boolean; }` | `functions/src/modules/user/models/shared/user_notification_settings.model.ts` |
| `OSKUserPublicProfile` | `{     firstName: string;     lastName: string;     profileImageFilename?: string; }` | `functions/src/modules/user/models/shared/user_public_profile.model.ts` |
| `OSKUserNotificationPreference` | `{     pushNotification: boolean;     emailNotification: boolean;     smsNotification: boolean;     inAppNotification:...` | `functions/src/modules/user/models/shared/user_settings.model.ts` |
| `OSKUserSettings` | `{     global: OSKUserGlobalSettings;     notifications: { [key in OSKNotificationType]: OSKUserNotificationPreference...` | `functions/src/modules/user/models/shared/user_settings.model.ts` |
| `OSKOnboardingStatus` | `'done' \| 'notDone' \| 'skipped'` | `functions/src/modules/user/models/shared/user_status.model.ts` |
| `OSKUserStatus` | `{     apiVersion: string;     newUserOnboarding: {         activateBuildingAccess: OSKOnboardingStatus;         enrol...` | `functions/src/modules/user/models/shared/user_status.model.ts` |
| `OSKUserPermanentAccess` | `{     isInvitation: false; }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserBuildingUnitDetails` | `{     unitId: string;     floor: string;     unitNumber: string;     name: string; }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserGuestAccess` | `{     isInvitation: true;     invitation: {         inviterId: string;         inviterFirstName: string;         invi...` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserInvitationAccess` | `{     isInvitation: true;     invitation: {         accessId: string;         invitationId: string;         title: st...` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserBuildingAccess` | `OSKUserPermanentAccess & {     type: 'building'; }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserBuildingUnitAccess` | `OSKUserPermanentAccess &     OSKUserBuildingUnitDetails & {         type: 'buildingUnit';     }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserBuildingInvitationAccess` | `(OSKUserInvitationAccess \| OSKUserGuestAccess) & {     type: 'buildingInvitation'; }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserBuildingUnitInvitationAccess` | `(OSKUserInvitationAccess \| OSKUserGuestAccess) &     OSKUserBuildingUnitDetails & {         type: 'buildingUnitInvit...` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserAccessPersonalization` | `{     name?: string;     imageFilename?: string; }` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserAccess` | `(     \| OSKUserBuildingAccess     \| OSKUserBuildingUnitAccess     \| OSKUserBuildingInvitationAccess     \| OSKUser...` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKUserAccessDocument` | `OSKDocument<OSKUserAccess>` | `functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts` |
| `OSKAccessBase` | `{     accessId: string;     authorizedDoors: OSKUserAuthorizedDoor[];     type: OSKUserAccessType;     accessRights: ...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKInhabitantAccess` | `OSKAccessBase & {     type: OSKUserAccessType.InhabitantUser;     accessRights: OSKAccessRightWithTimestampForPermane...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKGuestAccess` | `OSKAccessBase & {     type: OSKUserAccessType.InhabitantGuestUser;     accessRights: OSKAccessRightWithTimestampForGu...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKPermanentGuestAccess` | `OSKAccessBase & {     type: OSKUserAccessType.InhabitantPermanentGuestUser;     accessRights: OSKAccessRightWithTimes...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKQuickcodeAccess` | `OSKAccessBase & {     type: OSKUserAccessType.InhabitantAnonymousUser;     accessRights: OSKAccessRightWithTimestampF...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKNonAppUserAccess` | `OSKAccessBase & {     type: OSKUserAccessType.NonAppUser;     inviterId: string;     inviterName: string;     unitId:...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKOrganizationInhabitantAccess` | `OSKAccessBase & {     type: OSKUserAccessType.OrganizationUser;     organizationId: string; }` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKOrganizationGuestAccess` | `OSKAccessBase & {     type: OSKUserAccessType.OrganizationGuestUser;     inviterId: string;     inviterName: string; ...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKInhabitantUserAccess` | `\| OSKInhabitantAccess     \| OSKGuestAccess     \| OSKPermanentGuestAccess     \| OSKQuickcodeAccess` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKOrganizationUserAccess` | `OSKOrganizationInhabitantAccess \| OSKOrganizationGuestAccess` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKAccess` | `\| OSKInhabitantUserAccess     \| OSKOrganizationUserAccess     \| OSKSupplierStaffAccess     \| OSKNonAppUserAccess` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKUserAccesses` | `OSKBuildingAccess & {     buildingName?: string;     buildingStreetAddress: OSKStreetAddress;     buildingImageFilena...` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKUserAccessesDocument` | `OSKDocument<OSKUserAccesses>` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKUserAccessesUpdate` | `Partial<{     accessRights: OSKAccessRightWithTimestamp[];     authorizedDoorIds: string[]; }>` | `functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts` |
| `OSKBuildingAccess` | `{     type: OSKUserAccessType.InhabitantUser \| OSKUserAccessType.OrganizationUser;     authorizedDoors: OSKUserAutho...` | `functions/src/modules/user/modules/user_access/models/documents/user_building_accesses_document.model.ts` |
| `OSKUserBuildingAccess` | `{     userId: string;     buildingId: string;     buildingName?: string;     streetAddress: OSKStreetAddress;     acc...` | `functions/src/modules/user/modules/user_access/models/documents/user_building_accesses_document.model.ts` |
| `OSKUserBuildingAccessesDocument` | `OSKDocument<OSKUserBuildingAccess>` | `functions/src/modules/user/modules/user_access/models/documents/user_building_accesses_document.model.ts` |
| `OSKUserBuildingAccessesUpdate` | `{     authorizedDoors?: OSKUserAuthorizedDoor[]; }` | `functions/src/modules/user/modules/user_access/models/documents/user_building_accesses_document.model.ts` |
| `OSKUserBuilding` | `OSKBuilding & {     userId: string;     isResident: boolean;     isGuest: boolean; }` | `functions/src/modules/user/modules/user_access/models/documents/user_building_document.model.ts` |
| `OSKUserBuildingDocument` | `OSKDocument<OSKUserBuilding>` | `functions/src/modules/user/modules/user_access/models/documents/user_building_document.model.ts` |
| `OSKUserBuildingUnit` | `OSKBuildingUnit & {     userId: string;     isOwner: boolean;     isResident: boolean;     isGuest: boolean; }` | `functions/src/modules/user/modules/user_access/models/documents/user_building_unit_document.model.ts` |
| `OSKUserBuildingUnitDocument` | `OSKDocument<OSKUserBuildingUnit>` | `functions/src/modules/user/modules/user_access/models/documents/user_building_unit_document.model.ts` |
| `OSKRequestAccessBaseOptions` | `{     type: OSKUserAccessType;     inviterId?: string;     accessRights: OSKAccessRightWithTimestamp[];     doors: OS...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestQuickcodeAccessOptions` | `OSKRequestAccessBaseOptions & {     accessRights: OSKAccessRightWithTimestampForOneTime[];     type: OSKUserAccessTyp...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestInhabitantUserAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.InhabitantUser;     unitId: string; }` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestInhabitantGuestAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.InhabitantGuestUser;     inviterId: string;     unitId: s...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestInhabitantPermanentGuestAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.InhabitantPermanentGuestUser;     inviterId: string;     ...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestOrganizationUserInhabitantAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.OrganizationUser;     organizationId: string; }` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestOrganizationUserGuestAccessOpions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.OrganizationGuestUser;     inviterId: string;     organiz...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestSupplierStaffAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.SupplierStaff;     supplierId: string; }` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestNonAppUserAccessOptions` | `OSKRequestAccessBaseOptions & {     type: OSKUserAccessType.NonAppUser;     unitId: string; }` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestInhabitantAccessOptions` | `\| OSKRequestInhabitantUserAccessOptions     \| OSKRequestInhabitantGuestAccessOptions     \| OSKRequestInhabitantPer...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestOrganizationUserAccessOptions` | `\| OSKRequestOrganizationUserInhabitantAccessOptions     \| OSKRequestOrganizationUserGuestAccessOpions` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKRequestAccessOptions` | `\| OSKRequestInhabitantAccessOptions     \| OSKRequestOrganizationUserAccessOptions     \| OSKRequestSupplierStaffAcc...` | `functions/src/modules/user/modules/user_access/models/functions/user_accesses_request.model.ts` |
| `OSKPubsubUserAccessBase` | `{     accessId: string;     userId: string;     buildingId: string;     doorId: string;     accessRights: OSKAccessRi...` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKPubsubUserAccessInsert` | `Omit<OSKPubsubUserAccessBase, 'modificationDate'>` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKPubsubUserAccessUpdate` | `OSKPubsubUserAccessBase` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKPubsubUserAccessDelete` | `Omit<OSKPubsubUserAccessBase, 'accessRights' \| 'accessMethods'>` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKPubsubUserAccessRecreate` | `Omit<OSKPubsubUserAccessBase, 'modificationDate'> & {     modificationDate?: string; }` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKPubsubUserAccess` | `OSKPubsubUserAccessInsert \| OSKPubsubUserAccessUpdate \| OSKPubsubUserAccessDelete` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKUserAccessesMessageInsert` | `{     accessControlDeviceId: string;     operation: 'insert';     access: OSKPubsubUserAccessInsert; }` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKUserAccessesMessageUpdate` | `{     accessControlDeviceId: string;     operation: 'update';     access: OSKPubsubUserAccessUpdate; }` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKUserAccessesMessageDelete` | `{     accessControlDeviceId: string;     operation: 'delete';     access: OSKPubsubUserAccessDelete; }` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKMaintenanceAccessesMessageRecreate` | `{     accessControlDeviceId: string;     operation: 'recreate';     accesses: OSKPubsubUserAccessRecreate[]; }` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKAccessPubsubdMessage` | `\| OSKUserAccessesMessageInsert     \| OSKUserAccessesMessageUpdate     \| OSKUserAccessesMessageDelete     \| OSKMai...` | `functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts` |
| `OSKUserAuthorizedDoor` | `{     doorId: string;     doorName: string;     doorStreetAddress: OSKStreetAddress;     accessControlDevices: {     ...` | `functions/src/modules/user/modules/user_access/models/user_authorized_door.model.ts` |
| `OSKUserActivity` | `{     activityId: string;     accessControlDeviceId: string;     userId: string;     userName: string;     activityTy...` | `functions/src/modules/user/modules/user_activity/models/documents/user_activity_document.model.ts` |
| `OSKUserActivityAggregate` | `{     activities: (OSKUserActivityDocument \| OSKUserCallDocument)[]; }` | `functions/src/modules/user/modules/user_activity/models/documents/user_activity_document.model.ts` |
| `OSKUserActivityDocument` | `OSKDocument<OSKUserActivity>` | `functions/src/modules/user/modules/user_activity/models/documents/user_activity_document.model.ts` |
| `OSKUserActivityAggregateDocument` | `OSKDocument<OSKUserActivityAggregate>` | `functions/src/modules/user/modules/user_activity/models/documents/user_activity_document.model.ts` |
| `OSKGetUserActivityByIdRequest` | `{     userId: string;     activityId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKGetUserActivityAggregatesByBuildingIdRequest` | `{     userId: string;     buildingId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKGetAllUserActivitiesRequest` | `{     userId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKDeleteAllUserActivitiesRequest` | `{     userId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKGetAllUserActivitiesAggregatesRequest` | `{     userId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKDeleteActivityByIdRequest` | `{     userId: string;     activityId: string; }` | `functions/src/modules/user/modules/user_activity/models/functions/user_activities_request.model.ts` |
| `OSKUserCall` | `{     startTime: Timestamp;     endTime: Timestamp;     status: OSKCallStatus;     buildingId: string;     contactId:...` | `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` |
| `OSKUserCallDocument` | `OSKDocument<OSKUserCall>` | `functions/src/modules/user/modules/user_call/models/user_call_document.model.ts` |
| `OSKUserDeviceAccessControlDeviceToken` | `{     token: string; }` | `functions/src/modules/user/modules/user_device/models/documents/user_device_acess_control_device_token_document.model.ts` |
| `OSKUserDeviceAccessControlDeviceTokenDocument` | `OSKDocument<OSKUserDeviceAccessControlDeviceToken>` | `functions/src/modules/user/modules/user_device/models/documents/user_device_acess_control_device_token_document.model.ts` |
| `OSKUserDeviceCommon` | `{     deviceId: string;     name: string;     isLocked: boolean;     isStolen: boolean; }` | `functions/src/modules/user/modules/user_device/models/documents/user_device_document.model.ts` |
| `OSKUserBluetoothDevice` | `OSKUserDeviceCommon & {     publicSigningKeys: OSKPublicKeys;     publicEncryptionKeys: OSKPublicKeys; }` | `functions/src/modules/user/modules/user_device/models/documents/user_device_document.model.ts` |
| `OKSUserMobileDevice` | `OSKUserBluetoothDevice & {     type: 'mobile'; }` | `functions/src/modules/user/modules/user_device/models/documents/user_device_document.model.ts` |
| `OSKUserDevice` | `OKSUserMobileDevice` | `functions/src/modules/user/modules/user_device/models/documents/user_device_document.model.ts` |
| `OSKUserDeviceDocument` | `OSKDocument<OSKUserDevice>` | `functions/src/modules/user/modules/user_device/models/documents/user_device_document.model.ts` |
| `OSKUserDevicePublicKeyAddRequest` | `{     userId: string;     deviceId: string;     keyType: 'signing' \| 'crypto'; } & OSKPublicKeyAddRequest` | `functions/src/modules/user/modules/user_device/models/functions/user_device_public_key_add_request.model.ts` |
| `OSKUserDevicePublicKeyDeleteRequest` | `{     userId: string;     deviceId: string;     keyType: 'signing' \| 'crypto'; } & OSKPublicKeyDeleteRequest` | `functions/src/modules/user/modules/user_device/models/functions/user_device_public_key_delete_request.model.ts` |
| `OSKRemoveUserDeviceRequestData` | `{     userId: string;     deviceId: string; }` | `functions/src/modules/user/modules/user_device/models/functions/user_device_request.model.ts` |
| `OSKGetUserDeviceListRequestData` | `{     userId: string; }` | `functions/src/modules/user/modules/user_device/models/functions/user_device_request.model.ts` |
| `OSKAccessDeviceTokenParams` | `{     buildingId: string;     doorId: string;     userId: string;     accessId: string;     accessRights: OSKAccessRi...` | `functions/src/modules/user/modules/user_device/models/functions/user_device_service.model.ts` |
| `OSKUserDeviceType` | `'mobile'` | `functions/src/modules/user/modules/user_device/models/shared/user_device_type.model.ts` |
| `OSKUserIntercomCallTransferListItem` | `Pick<OSKIntercomCallTransferListItem, 'callRecipients'>` | `functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts` |
| `OSKUserIntercom` | `{     ACDName: string;     accessControlDeviceId: string;     buildingId: string;     unitId: string;     unitNumber?...` | `functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts` |
| `OSKUserIntercomDocument` | `OSKDocument<OSKUserIntercom>` | `functions/src/modules/user/modules/user_intercoms/models/documents/user_intercom_document.model.ts` |
| `OSKInvitee` | `{     inviteeContactInfo: OSKInviteeContactInfo;     status?: OSKUserInvitationStatus;     accessId?: string;     use...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationStatus` | `'accepted' \| 'rejected' \| 'pending' \| 'cancelled'` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationvisibility` | `'public' \| 'private'` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKInviteeContactInfo` | `OSKInviteeMailContactInfo \| OSKInviteePhoneContactInfo \| OSKInviteeUserContactInfo` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKInviteeMailContactInfo` | `{     invitationType: 'mail';     email: string;     inviteeId?: string;     firstName?: string;     lastName?: strin...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKInviteePhoneContactInfo` | `{     invitationType: 'phone';     phoneNumber: OSKPhoneNumber;     inviteeId?: string;     firstName?: string;     l...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKInviteeUserContactInfo` | `{     invitationType: 'user';     inviteeId: string;     firstName: string;     lastName: string;     profileImageFil...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationSentRequestBase` | `{     invitees: OSKInvitee[];     senderUserId: string;     accessRights: OSKAccessRightWithDates[];     userType: OS...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationSentRequestInhabitant` | `OSKUserInvitationSentRequestBase` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationSentRequestOrganization` | `OSKUserInvitationSentRequestBase & {     userType: OSKUserAccessType.OrganizationGuestUser \| OSKUserAccessType.Organ...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationSentRequest` | `\| OSKUserInvitationSentRequestInhabitant     \| OSKUserInvitationSentRequestOrganization` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationCreateRequest` | `{     buildingId: string;     unitId: string;     invitation: OSKUserInvitationSentRequest; }` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationDeleteRequest` | `{     buildingId: string;     unitId: string;     invitationId: string;     invitationType: OSKUserInvitationType; }` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationUpdateRequest` | `{     invitation: Omit<OSKUserInvitationSent, 'accessRights'> & { accessRights: OSKAccessRightWithDates[] }; }` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKInvitationReplyRequest` | `{     buildingId: string;     unitId: string;     invitationId: string;     userId?: string; }` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationConstruction` | `Omit<OSKUserInvitationSentRequestBase, 'accessRights'> & {     accessRights: OSKAccessRightWithTimestamp[] \| OSKAcce...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKUserInvitationType` | `'sent' \| 'received'` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_document.model.ts` |
| `OSKExternalUserKeyType` | `'mail' \| 'phone'` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_external_user_document.model.ts` |
| `OSKExternalUserInvitations` | `{     id: string;     contactType: OSKExternalUserKeyType;     contactValue: string;     // TODO : both invitations a...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_external_user_document.model.ts` |
| `OSKExternalUserInvitationsDocument` | `OSKDocument<OSKExternalUserInvitations>` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_external_user_document.model.ts` |
| `OSKUserInvitationStatus` | `'accepted' \| 'rejected' \| 'pending' \| 'cancelled'` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_received_document.model.ts` |
| `OSKUserInvitationReceived` | `{     senderUserId: string;     senderFirstName: string;     senderLastName: string;     invitationId: string;     bu...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_received_document.model.ts` |
| `OSKUserInvitationReceivedDocument` | `OSKDocument<OSKUserInvitationReceived>` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_received_document.model.ts` |
| `OSKUserInvitationSentBase` | `{     invitees: OSKInvitee[];     invitationId: string;     senderUserId: string;     senderFirstName: string;     se...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserInvitationSentAnonymous` | `OSKUserInvitationSentBase & {     userType: OSKUserAccessType.InhabitantAnonymousUser;     pincode: string;     unitI...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserInvitationSentInhabitant` | `OSKUserInvitationSentBase & {     userType:         \| OSKUserAccessType.InhabitantUser         \| OSKUserAccessType....` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserInvitationSentOrganization` | `OSKUserInvitationSentBase & {     userType: OSKUserAccessType.OrganizationUser \| OSKUserAccessType.OrganizationGuest...` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserInvitationSent` | `\| OSKUserInvitationSentAnonymous     \| OSKUserInvitationSentInhabitant     \| OSKUserInvitationSentOrganization` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserInvitationSentDocument` | `OSKDocument<OSKUserInvitationSent>` | `functions/src/modules/user/modules/user_invitation/models/documents/user_invitation_sent_document.model.ts` |
| `OSKUserExternalUserRequestGet` | `{     phoneOrEmail: string; }` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_external_user_request_document.model.ts` |
| `OSKUserProcessExternalUserInvitationsRequest` | `{     userId: string; }` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_external_user_request_document.model.ts` |
| `OSKInhabitantOnboardedResult` | `{     userId: string;     buildingId: string;     unitId: string;     pincode?: OSKUserPincodeDocument;     buildingi...` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_external_user_request_document.model.ts` |
| `OSKUserProcessExternalUserInvitationsResponse` | `{     userId: string;     guestInvitations: OSKUserInvitationSent[];     unitInvitations: OSKUnitInvitation[];     on...` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_external_user_request_document.model.ts` |
| `OSKUserInvitationGetAllRequest` | `{     userId: string;     category?: OSKInvitationCategory;     pageSize?: number;     nextPageToken?: string; }` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |
| `OSKUserInvitationSentCategory` | `Omit<OSKUserInvitationSentDocument, 'accessRights' \| 'creationDate'> & {     category: OSKInvitationCategory.Granted...` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |
| `OSKUserInvitationReceivedCategory` | `Omit<OSKUserInvitationReceivedDocument, 'accessRights' \| 'creationDate'> & {     category: OSKInvitationCategory.Rec...` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |
| `OSKUserInvitationGetList` | `OSKUserInvitationSentCategory \| OSKUserInvitationReceivedCategory` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |
| `OSKUserInvitationGetAllResponse` | `{     items: OSKUserInvitationGetList[];     nextPageToken?: string; }` | `functions/src/modules/user/modules/user_invitation/models/functions/user_invitation_get_all.model.ts` |
| `OSKUserNotification` | `{     userId: string;     notificationId: string;     options: OSKNotificationOptions;     hasBeenRead: boolean; }` | `functions/src/modules/user/modules/user_notification/models/documents/user_notification_document.model.ts` |
| `OSKUserNotificationDocument` | `OSKDocument<OSKUserNotification>` | `functions/src/modules/user/modules/user_notification/models/documents/user_notification_document.model.ts` |
| `OSKUserNotificationTokenDetails` | `\| {           deviceToken: { apnsToken: { voip?: string; apns?: string; environment: 'development' \| 'production' }...` | `functions/src/modules/user/modules/user_notification/models/documents/user_notification_registration_token_document.model.ts` |
| `OSKUserNotificationToken` | `{     userId: string;     tokenId: string; } & OSKUserNotificationTokenDetails` | `functions/src/modules/user/modules/user_notification/models/documents/user_notification_registration_token_document.model.ts` |
| `OSKUserNotificationTokenDocument` | `OSKUserNotificationToken & OSKDocument` | `functions/src/modules/user/modules/user_notification/models/documents/user_notification_registration_token_document.model.ts` |
| `OSKUserNotificationTokenDeleteRequest` | `{     userId: string;     tokenId: string; }` | `functions/src/modules/user/modules/user_notification/models/functions/user_notification_token_delete_body.model.ts` |
| `OSKUserNotificationTokenInsertOrUpdateBody` | `OSKUserNotificationToken` | `functions/src/modules/user/modules/user_notification/models/functions/user_notification_token_insert_or_update_body.model.ts` |
| `OSKUserNotificationDeviceToken` | `\| { apnsToken: { voip?: string; apns: string; environment: 'development' \| 'production' } }     \| { fcmToken: stri...` | `functions/src/modules/user/modules/user_notification/models/shared/user_notification_device_token.model.ts` |
| `OSKUserNotificationTokenDeviceType` | `\| 'iOSApp'     \| 'androidApp'     \| 'watchOSApp'     \| 'safariWebApp'     \| 'chromeWebApp'     \| 'firefoxWebApp...` | `functions/src/modules/user/modules/user_notification/models/shared/user_notification_registration_token_device.model.ts` |
| `OSKUserOrganization` | `{     tenant: string;     organizationName: string;     userId: string;     organizationId: string;      /**      * T...` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_document.model.ts` |
| `OSKUserOrganizationDocument` | `OSKDocument<OSKUserOrganization>` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_document.model.ts` |
| `OSKUserOrganizationInvitationPending` | `{     email: string;     userId: string;     organizationId: string;     isApproved: boolean;     organizationName: s...` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_invitation_pending_document.model.ts` |
| `OSKUserOrganizationInvitationPendingDocument` | `OSKDocument<OSKUserOrganizationInvitationPending>` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_invitation_pending_document.model.ts` |
| `OSKUserOrganizationRequest` | `OSKOrganization` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_request_document.model.ts` |
| `OSKUserOrganizationRequestDocument` | `OSKOrganizationDocument` | `functions/src/modules/user/modules/user_organization/models/documents/user_organization_request_document.model.ts` |
| `OSKUserPincodeInhabitant` | `OSKPincodeInhabitantBase` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeAnonymous` | `OSKPincodeAnonymousBase` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeGuest` | `OSKPincodeGuestBase & ({ inviterId: string } \| { invitedId: string })` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodePermanentGuest` | `OSKPincodePermanentGuestBase & ({ inviterId: string } \| { invitedId: string })` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeInhabitantDocument` | `OSKDocument<OSKUserPincodeInhabitant>` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeGuestDocument` | `OSKDocument<OSKUserPincodeGuest>` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeAnonymousDocument` | `OSKDocument<OSKUserPincodeAnonymous>` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodePermanentGuestDocument` | `OSKDocument<OSKUserPincodePermanentGuest>` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeDocument` | `\| OSKUserPincodeInhabitantDocument     \| OSKUserPincodeAnonymousDocument     \| OSKUserPincodeGuestDocument     \| ...` | `functions/src/modules/user/modules/user_pincode/models/documents/user_pincode_document.model.ts` |
| `OSKUserPincodeDeleteRequest` | `{     userId:string;     pincodeId:string; }` | `functions/src/modules/user/modules/user_pincode/models/functions/user_pincode_request.model.ts` |
| `OSKUserPincodeGetRequest` | `{     userId:string; }` | `functions/src/modules/user/modules/user_pincode/models/functions/user_pincode_request.model.ts` |
| `OSKUserSettingsBuildingDocument` | `OSKDocument<OSKUserSettingsBuilding>` | `functions/src/modules/user/modules/user_settings/models/documents/user_building_settings.model.ts` |
| `OSKUserSettingsUnitDocument` | `OSKDocument<OSKUserSettingsUnit>` | `functions/src/modules/user/modules/user_settings/models/documents/user_unit_settings.model.ts` |
| `OSKUserGetSettingsBuildingRequest` | `{     buildingId: string;     userId: string; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_building_settings_request.model.ts` |
| `OSKUserGetAllSettingsBuildingRequest` | `{     userId: string; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_building_settings_request.model.ts` |
| `OSKUserDeleteSettingsBuildingRequest` | `{     buildingId: string;     userId: string; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_building_settings_request.model.ts` |
| `OSKUserUpdateSettingsBuildingRequest` | `{     userId: string;     buildingId: string;     update: Partial<OSKBuildingSettingsInputParams>; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_building_settings_request.model.ts` |
| `OSKUserCreateSettingsBuildingRequest` | `{     buildingId: string;     userId: string;     buildingSettingsInputParams: OSKBuildingSettingsInputParams; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_building_settings_request.model.ts` |
| `OSKUserGetSettingsUnitRequest` | `{     userId: string;     buildingId: string;     unitId: string; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_unit_settings_request.model.ts` |
| `OSKUserGetAllSettingsUnitRequest` | `{     userId: string;     buildingId: string; }` | `functions/src/modules/user/modules/user_settings/models/functions/user_unit_settings_request.model.ts` |
| `OSKUserDeleteSettingsUnitRequest` | `OSKUserGetSettingsUnitRequest` | `functions/src/modules/user/modules/user_settings/models/functions/user_unit_settings_request.model.ts` |
| `OSKUserUpdateSettingsUnitRequest` | `{     userId: string;     buildingId: string;     unitId: string;     update: Partial<Omit<OSKUserSettingsUnit, 'unit...` | `functions/src/modules/user/modules/user_settings/models/functions/user_unit_settings_request.model.ts` |
| `OSKUserCreateSettingsUnitRequest` | `OSKUserSettingsUnit` | `functions/src/modules/user/modules/user_settings/models/functions/user_unit_settings_request.model.ts` |

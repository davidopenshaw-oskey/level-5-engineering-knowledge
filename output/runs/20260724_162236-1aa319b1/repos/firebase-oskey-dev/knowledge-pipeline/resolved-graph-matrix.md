<!-- © Oskey SAS. All rights reserved. -->

# Level 5 Engineering Knowledge: Resolved Engineering Graph Matrix

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_162236-1aa319b1` |
| **Extracted AST Facts** | 9060 |
| **Resolved Cross-Module Calls** | 158 Call Edges |
| **Resolved Shared Paths** | 70 Shared Firestore Collection Paths |
| **Resolved Event Routes** | 6 Event Routes |
| **RBAC Permission Checks** | 0 Checks |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | 100% Deterministic Resolution Complete |

---

## 1. Resolved Cross-Module Method Calls (158 Edges)

| Source Module | Source Context / Caller | Target Module | Target Service Class | Target Method Executed |
| :--- | :--- | :--- | :--- | :--- |
| `access_control_device` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `addAccessControlDeviceToUserAccessesDoor` |
| `access_control_device` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `removeAccessControlDeviceFromUserAccessesDoor` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingController` | `getAll` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingUnitController` | `getAll` |
| `admin` | `UnknownCaller` | `user` | `OSKUserDeviceService` | `createAccessDeviceToken` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessMessagePublisherService` | `publishMessageAccessRecreateToACD` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `checkIsMainAccess` |
| `admin` | `UnknownCaller` | `building` | `OSKIntercomMessagePublisherService` | `publishMessageIntercomUpdate` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingIntercomService` | `createIntercomEntry` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingIntercomService` | `addInhabitantInAllIntercoms` |
| `admin` | `UnknownCaller` | `tasks` | `OSKTaskSchedulerService` | `scheduleTask` |
| `admin` | `UnknownCaller` | `core` | `OSKPincodeService` | `createPincodeInhabitantDocuments` |
| `admin` | `UnknownCaller` | `core` | `OSKPincodeService` | `addPincodeDocumentsToNonAppUserAccess` |
| `admin` | `UnknownCaller` | `core` | `OSKPincodeService` | `deletePincodeDocuments` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessMessagePublisherService` | `publishMessageToAllACDs` |
| `admin` | `UnknownCaller` | `user` | `OSKUserSettingsUnitService` | `createUserSettingsUnitFromInhabitant` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getBuildingAuthorizedDoors` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `removeInhabitant` |
| `admin` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `addInhabitant` |
| `admin` | `UnknownCaller` | `user` | `OSKUserController` | `getAll` |
| `admin` | `UnknownCaller` | `user` | `OSKUserDeviceController` | `getAll` |
| `admin` | `UnknownCaller` | `core` | `OSKAccessService` | `deleteAccessById` |
| `admin` | `UnknownCaller` | `user` | `OSKUserDeviceController` | `deleteAll` |
| `admin` | `UnknownCaller` | `user` | `OSKUserDeviceController` | `delete` |
| `apps` | `UnknownCaller` | `core` | `OSKSecretService` | `getSecret` |
| `building` | `UnknownCaller` | `core` | `OSKSecretService` | `getPrivateKey` |
| `building` | `UnknownCaller` | `core` | `OSKSecretService` | `createPrivateKeySecret` |
| `building` | `UnknownCaller` | `organization` | `OSKOrganizationUserUtils` | `getOrganizationUser` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `updateUserAccessesDoorInfo` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `removeDoorFromUserAccesses` |
| `building` | `UnknownCaller` | `user` | `OSKUserIntercomService` | `updateAllUserIntercomEntry` |
| `building` | `UnknownCaller` | `user` | `OSKUserIntercomService` | `deleteUserIntercom` |
| `building` | `UnknownCaller` | `user` | `OSKUserIntercomService` | `cleanUpUserIntercomsAfterInhabitantDeletion` |
| `building` | `UnknownCaller` | `user` | `OSKUserIntercomService` | `createAndUpdateUsersIntercomEntry` |
| `building` | `UnknownCaller` | `user` | `OSKUserService` | `_getInhabitantType` |
| `building` | `UnknownCaller` | `core` | `OSKAccessMessagePublisherService` | `publishMessageToAllACDs` |
| `building` | `UnknownCaller` | `core` | `OSKPincodeService` | `deleteBuildingPincodeAndMoveToTrash` |
| `building` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getAccessControlDevicesPerDoor` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getAccessInviterName` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `generateAccessId` |
| `building` | `UnknownCaller` | `user` | `OSKUserSettingsBuildingService` | `createUserSettingsFromBuildingSettings` |
| `building` | `UnknownCaller` | `user` | `OSKUserSettingsUnitService` | `createUserSettingsUnitFromInhabitant` |
| `building` | `UnknownCaller` | `core` | `OSKAccessService` | `deleteAccessById` |
| `building` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `updateUserAccessesBuildingInfo` |
| `call` | `UnknownCaller` | `user` | `OSKUserNotificationService` | `createSpecial` |
| `call` | `UnknownCaller` | `access_control_device` | `OSKActivityEnrichmentService` | `enrichAndValidateActivity` |
| `call` | `UnknownCaller` | `user` | `OSKUserActivityAggregatesService` | `ActivityReceivedForUser` |
| `core` | `UnknownCaller` | `supplier` | `OSKSupplierStaffAccessService` | `setupSupplierStaffAccess` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingAccessService` | `createOrUpdateBuildingAccessForStaffOrNonAppUser` |
| `core` | `UnknownCaller` | `supplier` | `OSKSupplierStaffAccessService` | `createOrUpdateSupplierStaffAccess` |
| `core` | `UnknownCaller` | `building` | `OSKNonAppUserAccessService` | `setupNonAppUserAccess` |
| `core` | `UnknownCaller` | `building` | `OSKNonAppUserAccessService` | `createOrUpdateNonAppUserAccess` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingAccessService` | `createOrUpdateBuildingAccess` |
| `core` | `UnknownCaller` | `user` | `OSKUserAccessService` | `createOrUpdateUserAccess` |
| `core` | `UnknownCaller` | `user` | `OSKUserDeviceService` | `createAccessDeviceToken` |
| `core` | `UnknownCaller` | `user` | `OSKUserSentInvitationController` | `getById` |
| `core` | `UnknownCaller` | `user` | `OSKUserSentInvitationController` | `update` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingPincodeService` | `createPincodeInhabitantDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserPincodeService` | `createPincodeInhabitantDocument` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingPincodeService` | `createPincodeGuestDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserPincodeService` | `createPincodeGuestDocument` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingPincodeService` | `createPincodePermanentGuestDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserPincodeService` | `createPincodePermanentGuestDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserInvitationCreationService` | `constructUserInvitationSentObject` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingPincodeService` | `createPincodeAnonymousDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserPincodeService` | `createPincodeAnonymousDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserSentInvitationController` | `save` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingPincodeService` | `createPincodeSupplierDocument` |
| `core` | `UnknownCaller` | `supplier` | `OSKSupplierStaffPincodeService` | `createPincodeDocument` |
| `core` | `UnknownCaller` | `building` | `OSKNonAppUserPincodeService` | `createPincodeDocument` |
| `core` | `UnknownCaller` | `user` | `OSKUserAccessService` | `setupUserAccess` |
| `core` | `UnknownCaller` | `organization` | `OSKOrganizationUserAccessService` | `setupOrganizationUserAccess` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingDoorAccessControlDeviceKeysController` | `getPublicKey` |
| `core` | `UnknownCaller` | `access_control_device` | `OSKActivityEnrichmentService` | `enrichAndValidateActivity` |
| `core` | `UnknownCaller` | `building` | `OSKBuildingActivitiesService` | `ActivityReceivedForBuilding` |
| `core` | `UnknownCaller` | `user` | `OSKUserActivitiesService` | `ActivityReceivedForUser` |
| `core` | `UnknownCaller` | `user` | `OSKUserActivityAggregatesService` | `ActivityReceivedForUser` |
| `core` | `UnknownCaller` | `supplier` | `OSKSupplierStaffActivityService` | `ActivityReceivedForSupplierStaff` |
| `core` | `UnknownCaller` | `supplier` | `OSKSupplierStaffActivityAggregatesService` | `ActivityReceivedForSupplierStaff` |
| `core` | `UnknownCaller` | `building` | `OSKNonAppUserActivityService` | `ActivityReceivedForNonAppUser` |
| `core` | `UnknownCaller` | `building` | `OSKNonAppUserActivityAggregatesService` | `ActivityReceivedForNonAppUser` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getBuildingAuthorizedDoors` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `addInhabitant` |
| `organization` | `UnknownCaller` | `user` | `OSKUserNotificationService` | `create` |
| `organization` | `UnknownCaller` | `tasks` | `OSKTaskSchedulerService` | `cancelTask` |
| `organization` | `UnknownCaller` | `tasks` | `OSKTaskSchedulerService` | `scheduleTask` |
| `organization` | `UnknownCaller` | `apps` | `OSKQRcodeService` | `generateQR` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `validateAccessRights` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessUtilsDatesService` | `convertAccessRightsToFirebaseTimestamp` |
| `organization` | `UnknownCaller` | `settings` | `OSKAppStoreSettingsService` | `validateInternally` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `organization` | `UnknownCaller` | `user` | `OSKUserController` | `getAll` |
| `organization` | `UnknownCaller` | `core` | `OSKPincodeService` | `deleteBuildingPincodeAndMoveToTrash` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessMessagePublisherService` | `publishMessageToAllACDs` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingIntercomService` | `deleteIntercomEntryUser` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `removeInhabitant` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingIntercomService` | `deleteIntercomEntry` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitNonAppUserService` | `_deleteAccessSideEffects` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessService` | `deleteAccessById` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessService` | `getClearedAccessRights` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitNonAppUserController` | `generateDocId` |
| `organization` | `UnknownCaller` | `user` | `OSKUserController` | `generateDocId` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitNonAppUserController` | `create` |
| `organization` | `UnknownCaller` | `user` | `OSKUserController` | `create` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitNonAppUserService` | `_createNonAppUserAccess` |
| `organization` | `UnknownCaller` | `building` | `OSKBuildingUnitNonAppUserController` | `delete` |
| `organization` | `UnknownCaller` | `user` | `OSKUserController` | `delete` |
| `organization` | `UnknownCaller` | `user` | `OSKUserInvitationController` | `getAll` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `generateAccessId` |
| `organization` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getAccessInviterName` |
| `organization` | `UnknownCaller` | `core` | `OSKAuth0Service` | `emailExistsInAuth0` |
| `supplier` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `supplier` | `UnknownCaller` | `core` | `OSKAccessMessagePublisherService` | `publishMessageToAllACDs` |
| `supplier` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getAccessControlDevicesPerDoor` |
| `supplier` | `UnknownCaller` | `core` | `OSKPincodeService` | `deleteBuildingPincodeAndMoveToTrash` |
| `supplier` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `generateAccessId` |
| `tasks` | `UnknownCaller` | `admin` | `OSKPincodeRefreshWorkerService` | `executePincodeRefresh` |
| `tasks` | `UnknownCaller` | `organization` | `OSKIntercomCommunicationService` | `executeScheduledActivation` |
| `tasks` | `UnknownCaller` | `organization` | `OSKIntercomCommunicationService` | `executeScheduledDeactivation` |
| `unit_management` | `UnknownCaller` | `core` | `OSKAccessService` | `deleteAccessById` |
| `unit_management` | `UnknownCaller` | `core` | `OSKPincodeService` | `deleteBuildingPincodeAndMoveToTrash` |
| `unit_management` | `UnknownCaller` | `building` | `OSKBuildingIntercomService` | `deleteIntercomEntryUser` |
| `unit_management` | `UnknownCaller` | `user` | `OSKUserInvitationExternalUnitService` | `createExternalUnitInvitation` |
| `unit_management` | `UnknownCaller` | `core` | `OSKAccessUtilsDatesService` | `convertAccessRightToFirebaseTimestamp` |
| `unit_management` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `addInhabitant` |
| `unit_management` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `unit_management` | `UnknownCaller` | `core` | `OSKAccessService` | `updateAccess` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `generateAccessId` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `getAccessInviterName` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `updateUserAccessDevices` |
| `user` | `UnknownCaller` | `core` | `OSKSecretService` | `getPrivateKey` |
| `user` | `UnknownCaller` | `access_control_device` | `OSKAccessControlDeviceTokenPayload` | `toSignedToken` |
| `user` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `addInhabitant` |
| `user` | `UnknownCaller` | `core` | `OSKAccessService` | `createAccess` |
| `user` | `UnknownCaller` | `core` | `OSKAccessService` | `deleteAccessById` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsDatesService` | `convertAccessRightsToDateString` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsService` | `validateAccessRights` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsDatesService` | `convertAccessRightsToFirebaseTimestamp` |
| `user` | `UnknownCaller` | `core` | `OSKPincodeService` | `deletePincodeAnonymousAccess` |
| `user` | `UnknownCaller` | `building` | `OSKBuildingUnitInhabitantService` | `removeInhabitant` |
| `user` | `UnknownCaller` | `core` | `OSKAccessService` | `updateAccess` |
| `user` | `UnknownCaller` | `settings` | `OSKAppStoreSettingsService` | `getAppstoreInformation` |
| `user` | `UnknownCaller` | `organization` | `OSKOrganizationOnboardingInhabitantService` | `_sendOnboardingNotificationEmail` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUtilsDatesService` | `convertAccessRightToFirebaseTimestamp` |
| `user` | `UnknownCaller` | `unit_management` | `OSKUnitManagementCreationInvitationService` | `consumeUnitInvitationInvitee` |
| `user` | `UnknownCaller` | `unit_management` | `OSKUnitManagementCreationOskeyUserInvitationService` | `createPermanentGuest` |
| `user` | `UnknownCaller` | `core` | `OSKPincodeService` | `deleteBuildingPincodeAndMoveToTrash` |
| `user` | `UnknownCaller` | `core` | `OSKAuth0Service` | `getUsersByEmail` |
| `user` | `UnknownCaller` | `core` | `OSKAuth0Service` | `getUsersByPhoneNumber` |
| `user` | `UnknownCaller` | `core` | `OSKAuth0Service` | `updateUserPhoneNumber` |
| `user` | `UnknownCaller` | `core` | `OSKAccessUpdateService` | `updateAccessesUserInfo` |
| `user` | `UnknownCaller` | `core` | `OSKAuth0Service` | `updateUserEmail` |
| `user` | `UnknownCaller` | `core` | `OSKSecretService` | `getSecret` |
| `user` | `UnknownCaller` | `core` | `OSKAuth0Service` | `deleteAuth0User` |
| `user` | `UnknownCaller` | `organization` | `OSKOrganizationResidentsService` | `deleteAppUserResident` |
| `user` | `UnknownCaller` | `organization` | `OSKOrganizationResidentsService` | `checkInhabitantTypeAndDeleteAllInhabitantresident` |

---

## 2. Resolved Shared Firestore Paths (70 Paths)

| Firestore Path Pattern | Writing Modules | Reading Modules | Total AST References |
| :--- | :--- | :--- | :--- |
| `functions/src/modules/{id}/controllers/{id}.controller.ts` | None | `access_control_device` | 9 |
| `functions/src/modules/{id}/index.ts` | None | `access_control_device` | 3 |
| `functions/src/modules/admin/modules/admin_buildings/controllers/admin_building.controller.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_maintenance/db_building/{id}.service.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_maintenance/db_user_settings/db_user_settings.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_maintenance/utils/permissionChecks.util.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_organization/controllers/organization_list.controller.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_organization/services/organization_list.service.ts` | None | `admin` | 2 |
| `functions/src/modules/admin/modules/admin_users/controllers/admin_user.controller.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_users/services/{id}.service.ts` | None | `admin` | 2 |
| `functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_users/services/admin_user_device.service.ts` | None | `admin` | 1 |
| `functions/src/modules/admin/modules/admin_users/services/admin_user.service.ts` | None | `admin` | 1 |
| `functions/src/modules/apps/modules/mail/controllers/email.controller.ts` | None | `apps` | 2 |
| `functions/src/modules/building/controllers/building.controller.ts` | None | `building` | 3 |
| `functions/src/modules/building/index.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_door/index.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_door/services/building_door.service.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_intercom/services/{id}.service.ts` | None | `building` | 2 |
| `functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_settings/services/building_settings.service.ts` | None | `building` | 2 |
| `functions/src/modules/building/modules/building_unit/services/{id}.service.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_unit/services/building_unit_door.service.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_unit/services/building_unit.service.ts` | None | `building` | 1 |
| `functions/src/modules/building/modules/building_user/services/building_user.service.ts` | None | `building` | 1 |
| `functions/src/modules/building/services/building.service.ts` | None | `building` | 2 |
| `functions/src/modules/call/controllers/call.controller.ts` | None | `call` | 4 |
| `functions/src/modules/call/services/call.service.ts` | None | `call` | 3 |
| `functions/src/modules/core/modules/storage/services/storage.service.ts` | None | `core` | 1 |
| `functions/src/modules/organization/controllers/organization.controller.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/{id} communication/services/{id}.service.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/{id}/controllers/{id}.controller.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/{id}/controllers/property.controller.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/{id}/index.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/{id}/services/{id}.service.ts` | None | `organization` | 11 |
| `functions/src/modules/organization/modules/{id}/services/property.service.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/organization_entity/controllers/entity.controller.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/organization_entity/services/entity.service.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/modules/organization_user/models/documents/{id}.model.ts` | None | `organization` | 2 |
| `functions/src/modules/organization/modules/organization_user/services/organization_user.service.ts` | None | `organization` | 1 |
| `functions/src/modules/organization/services/organization.service.ts` | None | `organization` | 1 |
| `functions/src/modules/settings/controllers/setting.controller.ts` | None | `settings` | 3 |
| `functions/src/modules/settings/index.ts` | None | `settings` | 2 |
| `functions/src/modules/settings/modules/appstore/controllers/app_store_settings.controller.ts` | None | `settings` | 3 |
| `functions/src/modules/settings/modules/role/controllers/composite_role.contoller.model.ts` | None | `settings` | 1 |
| `functions/src/modules/settings/modules/role/controllers/role.controller.model.ts` | None | `settings` | 7 |
| `functions/src/modules/settings/modules/role/index.ts` | None | `settings` | 1 |
| `functions/src/modules/settings/modules/workflow/controllers/{id}.contoller.ts` | None | `settings` | 4 |
| `functions/src/modules/settings/modules/workflow/controllers/{id}.controller.ts` | None | `settings` | 4 |
| `functions/src/modules/settings/modules/workflow/index.ts` | None | `settings` | 1 |
| `functions/src/modules/supplier/controllers/supplier.controller.ts` | None | `supplier` | 2 |
| `functions/src/modules/supplier/modules/supplierStaff/services/{id}.service.ts` | None | `supplier` | 3 |
| `functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts` | None | `supplier` | 1 |
| `functions/src/modules/supplier/services/supplier.service.ts` | None | `supplier` | 1 |
| `functions/src/modules/unit_management/services/{id}.service.ts` | None | `unit_management` | 1 |
| `functions/src/modules/user/controllers/user.controller.ts` | None | `user` | 2 |
| `functions/src/modules/user/index.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_device/index.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_invitation/controllers/{id}.controller.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_invitation/services/{id}.service.ts` | None | `user` | 4 |
| `functions/src/modules/user/modules/user_notification/index.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_organization/services/{id}.service.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_pincode/controllers/user_pincode.controller.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_settings/models/documents/{id}.model.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_settings/models/functions/{id}.model.ts` | None | `user` | 1 |
| `functions/src/modules/user/modules/user_settings/services/{id}.service.ts` | None | `user` | 2 |
| `functions/src/modules/user/modules/user_settings/services/user_unit_settings.service.ts` | None | `user` | 1 |
| `functions/src/modules/user/services/user.service.ts` | None | `user` | 1 |

---

## 3. Event Routing Table (6 Event Routes)

| Topic / Trigger | Route Type | Origin Module | Target Module | Service Class | Handler Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OSK_PUBSUB_TOPIC_ACD_ACCESSES` | `PUBSUB_TOPIC` | `core` | `core` | `OSKAccessMessagePublisherService` | `publishAccessMessage` |
| `OSK_PUBSUB_TOPIC_ACD_ACTIVITY` | `PUBSUB_TOPIC` | `access_control_device` | `core` | `PubSubMessageProcessor` | `processPubSubMessage` |
| `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` | `PUBSUB_TOPIC` | `building` | `building` | `OSKBuildingIntercomPublisherService` | `publishIntercomEntries` |
| `auth.user().onCreate` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountCreated` |
| `auth.user().onDelete` | `AUTH_TRIGGER` | `firebase_auth` | `user` | `OSKUserService` | `onAccountDeleted` |
| `firestore.users().onUpdate` | `FIRESTORE_TRIGGER` | `user` | `user` | `OSKUserService` | `_cascadePublicProfileChange` |

---

## 4. RBAC Entitlement Matrix (0 Permission Checks)

| Permission String | Requiring Modules | Total Occurrences |
| :--- | :--- | :--- |


---

## 5. Module Personality Breakdown (CRUD vs. High-Risk Repair)

| Module | Standard CRUD Methods | High-Risk Repair Methods | High-Risk Method Names |
| :--- | :--- | :--- | :--- |
| `access_control_device` | 61 | 0 | None |
| `admin` | 108 | 9 | `onMaintenanceRecreateAccess`, `onRecreateTokensForBuildingUsersAll`, `onRecreateAccessDocumentInMongoDbByBuildingAll`, `recreateTokensForBuildingUsers`, `recreateAccessDocumentInMongoDbByBuilding`, `onMaintenanceRefreshPincodes`, `executePincodeRefresh`, `executePincodeRefreshCallable`, `deleteUserData` |
| `apps` | 35 | 0 | None |
| `building` | 275 | 0 | None |
| `call` | 9 | 0 | None |
| `core` | 150 | 1 | `publishMessageAccessRecreateToACD` |
| `organization` | 228 | 0 | None |
| `settings` | 61 | 0 | None |
| `supplier` | 77 | 0 | None |
| `tasks` | 3 | 0 | None |
| `unit_management` | 33 | 0 | None |
| `user` | 275 | 0 | None |

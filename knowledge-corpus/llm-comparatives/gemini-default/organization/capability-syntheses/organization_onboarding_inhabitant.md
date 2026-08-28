# Capability Synthesis: organization_onboarding_inhabitant

## 1. Capability Summary
The `organization_onboarding_inhabitant` capability manages the lifecycle of onboarding inhabitants (residents) into units within an organization. It handles the creation of onboarding documents (onboarding cards), generation of unique activation codes, SMS OTPs, and QR codes, and orchestrates the final onboarding process—which includes creating building accesses, adding inhabitants to units, updating resident status, and notifying property managers. [Confirmed]

## 2. Primary Responsibilities
*   **Onboarding Document Creation**: Generates onboarding documents (onboarding cards) for inhabitants, including generating unique 8-character activation codes, SMS OTPs, and QR codes, and calculating expiration dates. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|createOnboardingDocuments|#1` ``
*   **Activation Code Verification (User)**: Allows an inhabitant to verify their activation code, matching their email/phone with the onboarding card, and triggers the onboarding orchestration flow. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|verifyActivationCode|#1` ``
*   **Activation Code Verification (Admin)**: Allows an organization admin to verify an activation code on behalf of an inhabitant, matching the invitee user and triggering the onboarding orchestration flow. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|verifyActivationCodeByOrganizationAdmin|#1` ``
*   **Inhabitant Onboarding Orchestration**: Coordinates the final onboarding steps: creating building accesses, adding the inhabitant to the building unit, updating the resident document status to `isOnboarded: true` with the assigned PIN codes and user ID, and sending notification emails to property managers. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|onboardInhabitant|#1` ``
*   **Onboarding Document Management**: Supports querying, retrieving, and updating onboarding documents within an organization. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|findOnboardingDocument|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|getAllOnboardingDocuments|#1` ``, `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|updateOnboardingDocument|#1` ``
*   **Activation Email Dispatch**: Sends onboarding activation code emails to residents. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts|OSKOrganizationOnboardingMailService|sendOnboardingActivationCodeEmail|#1` ``
*   **App Store Tester Onboarding**: Special handling for App Store testers using predefined activation codes to bypass standard onboarding checks and assign them to a test building/unit. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|handleAppStoreTesterOnboarding|#1` ``
*   **SMS Code Reset**: Resets the SMS OTP code for an onboarding card. [Confirmed] `` `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|resetSmsCode|#1` ``

## 3. Public Interfaces (Controllers & Entry Points)
*   **OSKOrganizationOnboardingInhabitantController** (extends `OSKDocumentController`): Manages Firestore operations for onboarding documents under `/organizations/{organizationId}/onboardingInhabitants`. [Confirmed] `` `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts|OSKOrganizationOnboardingInhabitantController` ``
*   **Callable Cloud Functions** (exported in `index.ts`):
    *   `createOnboardingDocuments` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|createOnboardingDocuments|#1` ``
    *   `findOnboardingDocument` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|findOnboardingDocument|#1` ``
    *   `getAllOnboardingDocuments` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getAllOnboardingDocuments|#1` ``
    *   `getOnboardingDocumentById` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|getOnboardingDocumentById|#1` ``
    *   `sendOnboardingActivationCodeEmailCallable` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|sendOnboardingActivationCodeEmailCallable|#1` ``
    *   `updateOnboardingDocument` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|updateOnboardingDocument|#1` ``
    *   `verifyActivationCode` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCode|#1` ``
    *   `verifyActivationCodeByOrganizationAdmin` [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts|verifyActivationCodeByOrganizationAdmin|#1` ``

## 4. API Contracts & Firestore Triggers
No Firestore triggers are owned by this capability. [Confirmed]

### Resolved API Request/Response Schemas

#### `createOnboardingDocuments`
*   **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
    *   `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
    *   `organizationId`: `string`

#### `findOnboardingDocument`
*   **Request Type**: `OSKOrganizationOnboardingFindDocumentRequest`
    *   `organizationId`: `string`
    *   `unitId`: `string`
*   **Response Type**: `OSKOrganizationOnboardingInhabitant`
    *   `accessRights`: `OSKAccessRightWithTimestamp[]`
    *   `accessType`: `OSKUserAccessType`
    *   `activationCode`: `string`
    *   `buildingId`: `string`
    *   `contactDetails`: `OSKEmailAndPhoneGuaranteed`
    *   `contactIdentifiers`: `string[]`
    *   `creationDate`: `Timestamp`
    *   `doors`: `OSKDoorOnboarding[]`
    *   `emailVerified`: `boolean | undefined` (optional)
    *   `expiryDateActivationCode`: `Timestamp`
    *   `expiryDateSms`: `Timestamp`
    *   `firstName`: `string`
    *   `identityVerified`: `boolean | undefined` (optional)
    *   `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    *   `inviterId`: `string`
    *   `isOnboarded`: `boolean`
    *   `isUpdated`: `boolean`
    *   `lastName`: `string`
    *   `linksUrl`: `object`
    *   `onboardingId`: `string`
    *   `onboardingQRCode`: `string`
    *   `organizationId`: `string`
    *   `phoneVerified`: `boolean | undefined` (optional)
    *   `smsOtp`: `number`
    *   `unitId`: `string`
    *   `updatedFields`: `OSKOrganizationOnboardingInhabitantUpdate`

#### `getOnboardingDocumentById`
*   **Request Type**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
    *   `onboardingId`: `string`
    *   `organizationId`: `string`

#### `sendOnboardingActivationCodeEmailCallable`
*   **Request Type**: `ResendActivationCodeRequest`
    *   `language`: `OSKSupportedLanguageEnum`
    *   `organizationId`: `string`
    *   `residentId`: `string`

#### `verifyActivationCode`
*   **Request Type**: `OSKOrganizationOnboardingVerifyActivationCode`
    *   `activationCode`: `string`

#### `verifyActivationCodeByOrganizationAdmin`
*   **Request Type**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
    *   `activationCode`: `string`
    *   `adminOrganizationId`: `string`

## 5. Data Ownership
This capability owns and performs write operations on the following Firestore collection paths:
*   `/organizations/{organizationId}/onboardingInhabitants/{onboardingId}`: Read, Write, Delete. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts` (lines 18-78) ``

This capability reads or updates data in the following external Firestore collection paths:
*   `/organizations/{organizationId}/residents/{residentId}`: Read, Write. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1144-1150) ``, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 75-80) ``
*   `/users/{userId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 730-732) ``
*   `/buildings/{buildingId}/doors/{doorId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1093-1095) ``
*   `/buildings/{buildingId}/units/{unitId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 787-789) ``
*   `/users/{userId}/pincodes/{pincodeId}`: Read. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1133-1135) ``

## 6. Outbound Coupling

### Cross-Module Coupling
*   **building** module:
    *   `@oskey/building` -> `OSKBuildingController` used to fetch building details. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 42) ``
    *   `@oskey/building/door` -> `OSKBuildingDoorController` used to fetch door details. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 43) ``
    *   `@oskey/building/unit` -> `OSKBuildingUnitController` and `OSKBuildingUnitInhabitantService` used to fetch unit details and add inhabitants. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 44) ``
*   **user** module:
    *   `@oskey/user` -> `OSKUserController` used to fetch user details. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 10) ``
    *   `@oskey/user/pincode` -> `OSKUserPincodeController` used to fetch pincodes. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 60) ``
    *   `@oskey/user/access` -> Type imports. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 59) ``
*   **apps** module:
    *   `@oskey/apps/mail` -> `OSKEmailService` used to send emails. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 39) ``
    *   `@oskey/apps/qrcode` -> `OSKQRcodeService` used to generate QR codes. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 40) ``
*   **settings** module:
    *   `@oskey/settings/appstore` -> `OSKAppStoreSettingsService` used to validate App Store tester codes. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 58) ``
    *   `@oskey/settings/role` -> `OSKConsolidatedRolesController` used to check permissions. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 8) ``

### Intra-Module Cross-Submodule Coupling
*   **organization_user** submodule:
    *   `@oskey/organization/user` / `../../organization_user/controllers/organization_user.controller` -> `OSKOrganizationUserController` used to fetch organization user details and roles. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 14) ``
*   **organization_residents** submodule:
    *   `@oskey/organization/residents` -> `OSKOrganizationResidentsController` used to update resident onboarding status. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (line 57) ``

## 7. Permissions & Security
This capability references and enforces the following permission strings:
*   `v1.org.buildings.create`: Checked in `createOnboardingDocuments` (line 617), `findOnboardingDocument` (line 92), `getAllOnboardingDocuments` (line 318), `getOnboardingDocumentById` (line 180), `updateOnboardingDocument` (line 255), and `verifyActivationCodeByOrganizationAdmin` (line 964). [Confirmed]
    *   *Cross-check Mismatch*: The RBAC roles document defines `v1.org.buildings.create` as "Allows to create a new building". However, this capability uses it to authorize administrative operations on onboarding documents (e.g., creating, updating, and retrieving onboarding cards, and verifying activation codes by an admin). This is a significant mismatch where a building creation permission is overloaded for resident onboarding administration. [Confirmed]
*   `v1.org.residents.onboardingNotification`: Checked in `_sendOnboardingNotificationEmail` (line 1439) to identify which PMP users should receive emails when a resident completes onboarding. [Confirmed]
    *   *Cross-check*: Matches the RBAC roles document ("Activates email notifications for new resident registrations."). [Confirmed]
*   `v1.org.residents.create`: Checked in `sendOnboardingActivationCodeEmailCallable` (line 61) to authorize resending activation emails. [Confirmed]
    *   *Cross-check*: Matches the RBAC roles document ("Allows to create a new resident profile."). [Confirmed]

## 8. External Hooks

### Confirmed Integrations
*   **Email Integration**: Integrates with `OSKEmailService` (from `@oskey/apps/mail`) to send onboarding activation emails (`onboardingActivationCode` template) and onboarding completion notifications (`userOnboardedNotification` template). [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_mail.service.ts` (lines 24-35) ``, `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1473-1486) ``
*   **QR Code Generation**: Integrates with `OSKQRcodeService` (from `@oskey/apps/qrcode`) to generate onboarding QR codes from activation codes. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 653-654) ``

### Architectural Candidates
*   **SMS Integration**: There is commented-out code referencing `OSKOrganizationOnboardingInhabitantService.sendVerificationSms` with a TODO "Waiting for API Key" for sending SMS OTPs. [Confirmed] `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts` (lines 1395-1407) ``

## 9. Open Questions
*   Why is `v1.org.buildings.create` (building creation permission) used to authorize resident onboarding document management and admin activation code verification instead of a resident-specific permission like `v1.org.residents.edit` or `v1.org.residents.create`? [Inferred]
*   Is the SMS verification flow fully functional, or is it blocked pending the API key as indicated by the commented-out code in `resetSmsCode`? [Inferred]
### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:36:02.892Z
- repoName: firebase-oskey-dev
- targetModule: organization
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### Callable Functions
- **`createAnOrganization`**
  - **Request Schema**: `OSKOrganizationCreateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **`updateAnOrganization`**
  - **Request Schema**: `OSKOrganizationUpdateRequest`
    - `adminsOrganizationId`: `string`
    - `id`: `string`
    - `isoCountryCode`: `string`
    - `name`: `string`
    - `organizationLogo`: `string | undefined` (optional)
    - `streetAddress`: `OSKStreetAddress`
    - `taxNumber`: `string`
    - `tenant`: `string`
    - `userRoles`: `string[]`
- **`getAllOrganizations`**
  - **Request Schema**: `OSKGetAllOrganizationsRequestDocument`
    - `adminsOrganizationId`: `string`
- **`deleteOrganizationLogo`**
  - **Request Schema**: `deleteOrganizationLogoRequest`
    - `organizationId`: `string`
    - `filename`: `string`

### Firestore Triggers
No direct Firestore triggers (e.g., `onWrite`, `onUpdate`) are registered within this capability's root file, although it orchestrates the registration of triggers owned by its submodules. [Confirmed]

#### organization_building

#### Callable APIs
The following callable APIs are exposed by this capability:

##### `getAllOrganizationBuildings`
- **Request Schema**: `OSKGetAllOrganizationBuildingsRequestData`
  - `organizationId`: `string`
- **Response Schema**: No matching `model_property` facts matched within this pack for a dedicated response type; returns an array of enriched organization-building objects.

##### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Schema**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKBuildingForOnboardingCards`
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`

##### `getOrganizationBuildingById`
- **Request Schema**: `OSKGetORganizationBuildingByIdRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: No matching `model_property` facts matched within this pack for a dedicated response type.

#### Firestore Triggers
No Firestore triggers are owned or declared by this capability [Confirmed: `functions/src/modules/organization/modules/organization_building/index.ts` (lines 39-51)].

---

#### organization_building_invitation

### Resolved API Request/Response Schemas

#### `acceptBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
  - `adminsOrganizationId`: `string`
  - `invitationId`: `string`
  - `userId`: `string`

#### `createBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `@oskey/building/unit`)
  - `doorIds` (optional): `string[] | undefined`
  - `email` (optional): `string | undefined`
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress` (optional): `OSKStreetAddress | undefined` (imported from `@oskey/core`)
  - `unitId`: `string`
  - `userId` (optional): `string | undefined`

#### `queryBuildingInhabitantInvitation`
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean | undefined; }`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### organization_entity

### Callable APIs
The following HTTPS callable functions are exposed by this capability:

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 228-278)

#### `createEntity`
- **Request Type**: `OSKSubEntityRequestData` [Inferred] (Note: Resolved API Request/Response Schemas do not explicitly list `createEntity` request type, but `OSKSubEntityRequestData` contains fields like `organizationAdminId`, `organizationId`, `parentEntityId`, `propertiesIds`, `entityName`, `entityType` matching creation needs).
- **Response Type**: `Promise<{ entityId: string }>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 84-132)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 184-227)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity[]>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 30-49)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKBuilding[]>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 343-382)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 50-83)

#### `getEntityDashboardStatics`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKGetEntityDashboardStaticsResponseData`
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `propertiesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 279-342)

#### `updateEntity`
- **Request Type**: `OSKUpdateEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
  - `update`: `Partial<OSKSubEntityRequestData>`
- **Response Type**: `Promise<void>` [Inferred]
- **Handler File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 134-183)

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

---

#### organization_inhabitant

#### Callable APIs
- **`getAllOrganizationInhabitants`** (cite `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1` ``)
  - **Request Type**: `OSKPmpResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKPmpResidentsDocumentResponse`
    - `count`: `number`
    - `inhabitants`: `import("functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model").OSKPmpResidentsDocument[]`
- **`getInhabitantDetailsById`** (cite `` `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1` ``)
  - **Request Type**: `OSKPmpResidentsDetailsRequestData`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: No explicit schema matched in the schemas section, but it returns mapped inhabitant details [Confirmed].

#### Firestore Triggers
- None evidenced [Confirmed].

#### organization_intercom_ communication

#### API Contracts
The following HTTPS callable functions are exposed by this capability:

##### `createIntercomCommunication`
- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
  - `homeInfo`: `{ title: string; description: string; }`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority`
  - `schedule`: `{ startDate: Date; endDate?: Date; }`
  - `sendToChannels`: `("intercom" | "residents")[]`
  - `targets`: `{ buildingId: string; buildingName: string; doorIds: string[]; }[]`
- **Response Type**: `OSKCreateIntercomCommunicationResponseData`
  - `communicationId`: `string`
  - `results`: `OSKCreateIntercomCommunicationResult[]`

##### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void`

##### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `getIntercomCommunicationById`
- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

##### `reformulateCommunicationWithGemini`
- **Request Type**: `OSKReformulateCommunicationRequestData`
  - `description`: `string`
  - `organizationId`: `string`
  - `title`: `string`
- **Response Type**: `OSKReformulateCommunicationResponseData`
  - `reformulatedDescription`: `string`
  - `reformulatedTitle`: `string`

#### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

---

#### organization_onboarding_inhabitant

### Callable Functions
The following callable functions are exposed by this capability:

#### `createOnboardingDocuments`
- **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
  - `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
  - `organizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `findOnboardingDocument`
- **Request Type**: `OSKOrganizationOnboardingFindDocumentRequest`
  - `organizationId`: `string`
  - `unitId`: `string`
- **Response Type**: `OSKOrganizationOnboardingInhabitant`
  - `accessRights`: `OSKAccessRightWithTimestamp[]`
  - `accessType`: `OSKUserAccessType`
  - `activationCode`: `string`
  - `buildingId`: `string`
  - `contactDetails`: `OSKEmailAndPhoneGuaranteed`
  - `contactIdentifiers`: `string[]`
  - `creationDate`: `Timestamp`
  - `doors`: `OSKDoorOnboarding[]`
  - `emailVerified`: `boolean` (optional)
  - `expiryDateActivationCode`: `Timestamp`
  - `expiryDateSms`: `Timestamp`
  - `firstName`: `string`
  - `identityVerified`: `boolean` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType` (optional)
  - `inviterId`: `string`
  - `isOnboarded`: `boolean`
  - `isUpdated`: `boolean`
  - `lastName`: `string`
  - `linksUrl`: `object`
  - `onboardingId`: `string`
  - `onboardingQRCode`: `string`
  - `organizationId`: `string`
  - `phoneVerified`: `boolean` (optional)
  - `smsOtp`: `number`
  - `unitId`: `string`
  - `updatedFields`: `OSKOrganizationOnboardingInhabitantUpdate`

#### `getOnboardingDocumentById`
- **Request Type**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
  - `onboardingId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `sendOnboardingActivationCodeEmailCallable`
- **Request Type**: `ResendActivationCodeRequest`
  - `language`: `OSKSupportedLanguageEnum`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `verifyActivationCode`
- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCode`
  - `activationCode`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

#### `verifyActivationCodeByOrganizationAdmin`
- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
  - `activationCode`: `string`
  - `adminOrganizationId`: `string`
- **Response Type**: Not explicitly resolved in the provided schemas.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

#### organization_pending

### API Contracts

#### `createPendingOrganization`
- **Request Type**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Inferred)

#### `getCurrentUserPendingOrganizations`
- **Request Type**: `void` (Inferred)
- **Response Type**: `OSKOrganizationPendingDocument[]` (Inferred)

#### `getAllPendingOrganizations`
- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`
- **Response Type**: `OSKOrganizationPendingDocument[]` (Inferred)

#### `getPendingOrganizationById`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `OSKUserDocument | undefined`

#### `rejectPendingOrganizationRequest`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `void` (Inferred)

#### `approvePendingOrganizationRequest`
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `void` (Inferred)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed: `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35)].

---

#### organization_prompt_templates

### Callable Cloud Functions
The following callable APIs are exposed by this capability:

#### `create`
- **Request Schema**: `OSKCreateOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response**: Returns the created prompt template document or success status [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|create|#1` ``.

#### `delete`
- **Request Schema**: `OSKDeleteOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response**: Returns a success status upon deletion [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|delete|#1` ``.

#### `get`
- **Request Schema**: `OSKGetOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response**: Returns the requested `OSKOrganizationPromptTemplate` document [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|get|#1` ``.

#### `getAll`
- **Request Schema**: `OSKGetAllOrganizationPromptTemplatesRequest` [Confirmed]
  - `organizationId`: `string`
- **Response**: Returns an array of `OSKOrganizationPromptTemplate` documents [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getAll|#1` ``.

#### `update`
- **Request Schema**: `OSKUpdateOrganizationPromptTemplateRequest` [Confirmed]
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response**: Returns the updated prompt template document [Confirmed] `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|update|#1` ``.

No Firestore triggers are owned or declared by this capability [Confirmed].

---

#### organization_property

### Callable Cloud Functions
The following HTTPS callable functions are exposed by this capability:

#### `assigningPropertyToEntity`
*   **Request Schema**: `OSKEntityAssigningPropertyRequestData`
    *   `newEntityId`: `string`
    *   `oldEntityId`: `string`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `createProperty`
*   **Request Schema**: `OSKCreatePropertyRequestData`
    *   `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
    *   `entityId`: `string`
    *   `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
    *   `organizationId`: `string`
    *   `propertyImage`: `string | undefined` (optional)
    *   `propertyName`: `string`
    *   `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
    *   `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `deleteProperty`
*   **Request Schema**: `OSKGetPropertyByIdRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `deletePropertyImage`
*   **Request Schema**: `OSKDeletePropertyImageRequest`
    *   `filename`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getAllProperties`
*   **Request Schema**: `OSKGetAllPropertiesRequestData`
    *   `entityId`: `string`
    *   `organizationId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getPropertyById`
*   **Request Schema**: `OSKGetPropertyByIdRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `void` (or standard HTTPS response)

#### `getPropertyDashboardStatics`
*   **Request Schema**: `OSKGetPropertyDashboardStaticsRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
*   **Response Schema**: `OSKGetPropertyDashboardStaticsResponseData`
    *   `adminsCount`: `number`
    *   `buildingsCount`: `number`
    *   `devicesCount`: `number`
    *   `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
*   **Request Schema**: `OSKUpdatePropertyRequestData`
    *   `organizationId`: `string`
    *   `propertyId`: `string`
    *   `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`
*   **Response Schema**: `void` (or standard HTTPS response)

---

#### organization_residents

### Callable APIs

#### `deleteResident`
- **Request Type**: `OSKResidentsDocumentDeleteRequest`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllResidents`
- **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `OSKOrganizationResidentResponseDocument[]`

#### `getResidentDetails`
- **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `OSKOrganizationResidentResponseDocument` (Implicit)

#### `getallResidentsByPropertyIdCallable`
- **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `OSKOrganizationResidentResponseDocument[]`

#### `updateResident`
- **Request Type**: `OSKUpdateOrganizationResidentRequest`
  - `firstName`: `string`
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `lastName`: `string`
  - `organizationId`: `string`
  - `residentId`: `string`
- **Response Type**: `void` (Implicit)

#### `createResidents`
- **Request Type**: No matching `model_property` facts found in this pack.
- **Response Type**: No matching `model_property` facts found in this pack.

#### `bulkCreateResidents`
- **Request Type**: No matching `model_property` facts found in this pack.
- **Response Type**: No matching `model_property` facts found in this pack.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability pack. [Confirmed]

#### organization_user

### Callable Functions

#### deleteOrganizationUser
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### getAllOrganizationUsersAndInvitees
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### updateOrganizationUser
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### updateOrganizationUserRoles
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: `void` (No response schema matched in this pack)

#### getOrganizationUserById
- **Request Type**: `OSKOrganizationUserByIdRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUser` (No `model_property` facts matched within this pack)

#### getOrganizationInviteeByEmail
- **Request Type**: `OSKOrganizationInviteeByEmailRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUserInvitation` (No `model_property` facts matched within this pack)

#### getOrganizationUserRoles
- **Request Type**: `OSKOrganizationUserRolesRequest` (No `model_property` facts matched within this pack)
- **Response Type**: `OSKOrganizationUserRolesResponse` (No `model_property` facts matched within this pack)

### Firestore Triggers
No Firestore triggers are defined within this capability's pack [Confirmed].

---

#### organization_user_access

No API contracts (`api_contract` facts) or Firestore triggers are owned or declared by this capability. [Confirmed]

---

#### organization_user_invitation

### Callable Functions
The following callable functions are registered by this capability:

#### `cancelUsersInvitation`
- **Request Schema**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.cancelUsersInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|cancelUsersInvitation|#1` ``. [Confirmed]

#### `createPMPUserWithInvitation`
- **Request Schema**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber` (imported from `core`)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.createPMPUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|createPMPUserWithInvitation|#1` ``. [Confirmed]

#### `invitePMPUserWithInvitation`
- **Request Schema**: `OSKOrganizationPMPUserInvitationRequest`
  - `adminOrganizationId`: `string`
  - `adminOrganizationName`: `string`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `organizationName`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.invitePMPUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|invitePMPUserWithInvitation|#1` ``. [Confirmed]

#### `inviteUserWithInvitation`
- **Request Schema**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.inviteUserWithInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|inviteUserWithInvitation|#1` ``. [Confirmed]

#### `processPMPInvitation`
- **Request Schema**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response**: `Promise<void>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.processPMPInvitation` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|processPMPInvitation|#1` ``. [Confirmed]

#### `queryPMPInvitations`
- **Request Schema**: No `model_property` facts matched within this pack to resolve a request schema.
- **Response**: `Promise<any[]>` (Inferred)
- **Handler**: `OSKOrganizationUserInvitationService.queryPMPInvitations` `` `api_contract|organization|functions/src/modules/organization/modules/organization_user_invitation/index.ts|queryPMPInvitations|#1` ``. [Confirmed]

### Firestore Triggers
No Firestore triggers are declared or owned by this capability. [Confirmed]
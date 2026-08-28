### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:28:46.492Z
- repoName: firebase-oskey-dev
- targetModule: organization
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### Callable APIs
The following callable APIs are exposed by this capability:

- **createAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1`)
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
- **getAllOrganizations** (`api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1`)
  - **Request Schema**: `OSKGetAllOrganizationsRequestDocument`
    - `adminsOrganizationId`: `string`
- **updateAnOrganization** (`api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1`)
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
- **deleteOrganizationLogo** (`api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1`)
  - *Note*: No matching `model_property` facts were resolved within this pack to construct a detailed schema for `deleteOrganizationLogoRequest`.

### Firestore Triggers
- **onDocumentCreated** (`service_method|organization|functions/src/modules/organization/services/organization.service.ts|OSKOrganizationService|onDocumentCreated|#1`): A service method exists to handle document creation events, but it is not registered as an active Firestore trigger in the module's entry point (`functions/src/modules/organization/index.ts`). [Inferred]

#### organization_building

No Firestore triggers are owned by this capability. The following are the resolved API contracts for the callable functions:

#### `getAllOrganizationBuildings`
- **Request Type**: `OSKGetAllOrganizationBuildingsRequestData`
- **Request Schema**:
  - `organizationId`: `string`

#### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Type**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
- **Request Schema**:
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKBuildingForOnboardingCards`
- **Response Schema**:
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`

#### `getOrganizationBuildingById`
- **Request Type**: `OSKGetORganizationBuildingByIdRequestData`
- **Request Schema**:
  - `buildingId`: `string`
  - `organizationId`: `string`

---

#### organization_building_invitation

### API Contracts
The following callable API contracts are exposed by this capability:

#### organization_entity

### Callable Cloud Functions
The following HTTPS callable functions are exposed by this capability [Confirmed] (`` `functions/src/modules/organization/modules/organization_entity/index.ts` (lines 30-37) ``):

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `void` (Implicit)

#### `createEntity`
- **Request Type**: `OSKSubEntityRequestData`
  - `entityName`: `string`
  - `entityType`: `OSKEntityType`
  - `organizationAdminId`: `string`
  - `organizationId`: `string`
  - `parentEntityId`: `string`
  - `propertiesIds`: `string[]`
- **Response Type**: `void` (Implicit)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKEntity[]` (Implicit)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKBuilding[]` (Implicit)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKEntity` (Implicit)

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

#### `updateEntity`
- **Request Type**: `OSKUpdateEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
  - `update`: `Partial<OSKSubEntityRequestData>`
- **Response Type**: `void` (Implicit)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed].

---

#### organization_inhabitant

#### Callable Functions
- **`getAllOrganizationInhabitants`** [Confirmed] (`api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1`)
  - **Request Type**: `OSKPmpResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKPmpResidentsDocumentResponse`
    - `count`: `number`
    - `inhabitants`: `OSKPmpResidentsDocument[]`

- **`getInhabitantDetailsById`** [Confirmed] (`api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1`)
  - **Request Type**: `OSKPmpResidentsDetailsRequestData`
    - `organizationId`: `string`
    - `userId`: `string`
  - **Response Type**: No matching `model_property` facts or resolved response schema provided in the evidence pack.

---

#### organization_intercom_ communication

### API Contracts

#### `createIntercomCommunication`
- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
  - `homeInfo`: `{ title: string; description: string; }`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority` (e.g., `'low' | 'medium' | 'high'`)
  - `schedule`: `{ startDate: Date; endDate?: Date; }`
  - `sendToChannels`: `('intercom' | 'residents')[]`
  - `targets`: `{ buildingId: string; buildingName: string; doorIds: string[]; }[]`
- **Response Type**: `OSKCreateIntercomCommunicationResponseData`
  - `communicationId`: `string`
  - `results`: `OSKCreateIntercomCommunicationResult[]`
    - `buildingId`: `string`
    - `status`: `'fulfilled' | 'rejected'`
    - `reason`: `string | undefined`

#### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Implicit)

#### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`
  - `activationTaskId`: `string | undefined`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `communicationId`: `string`
  - `createdByUserId`: `string | undefined`
  - `creationDate`: `Timestamp`
  - `deactivationTaskId`: `string | undefined`
  - `doorInfos`: `OSKDoorInfo[]`
  - `homeInfos`: `OSKLocalizedInfoBlock[]`
  - `modificationDate`: `Timestamp`
  - `organizationId`: `string`
  - `priority`: `OSKCommunicationPriority`
  - `schedule`: `OSKCommunicationSchedule`
  - `status`: `OSKIntercomCommunicationStatus`
  - `translationEngine`: `'google-translate-v2' | 'gemini-2.5-flash'`
  - `type`: `'intercom' | 'push' | undefined`

#### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage` (Array)

#### `getIntercomCommunicationById`
- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage`

#### `reformulateCommunicationWithGemini`
- **Request Type**: `OSKReformulateCommunicationRequestData`
  - `description`: `string`
  - `organizationId`: `string`
  - `title`: `string`
- **Response Type**: `OSKReformulateCommunicationResponseData`
  - `reformulatedDescription`: `string`
  - `reformulatedTitle`: `string`

### Firestore Triggers
No Firestore triggers are defined within this capability's evidence pack.

#### organization_onboarding_inhabitant

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

#### organization_pending

### Callable Functions
The capability exposes the following Firebase HTTPS Callable Functions (Confirmed) `` `functions/src/modules/organization/modules/organization_pending/index.ts` (lines 21-35) ``:
- `approvePendingOrganizationRequest`
- `createPendingOrganization`
- `getAllPendingOrganizations`
- `getCurrentUserPendingOrganizations`
- `getPendingOrganizationById`
- `rejectPendingOrganizationRequest`

### Resolved API Request/Response Schemas

#### approvePendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

#### createPendingOrganization
- **Request Type**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`

#### getAllPendingOrganizations
- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`

#### getCurrentUserPendingOrganizations
- *Note: No `model_property` facts matched within this pack for this endpoint's request/response types.*

#### getPendingOrganizationById
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Type**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `import("functions/src/modules/user/models/documents/user_document.model").OSKUserDocument | undefined`

#### rejectPendingOrganizationRequest
- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`

#### organization_prompt_templates

### Callable Cloud Functions
The capability exposes five HTTPS callable functions [Confirmed: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (lines 38-42)]:
- `create`
- `delete`
- `get`
- `getAll`
- `update`

### Resolved API Request/Response Schemas

#### `create`
- **Request Type**: `OSKCreateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the created template document].

#### `delete`
- **Request Type**: `OSKDeleteOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success confirmation].

#### `get`
- **Request Type**: `OSKGetOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns `OSKOrganizationPromptTemplate` or null].

#### `getAll`
- **Request Type**: `OSKGetAllOrganizationPromptTemplatesRequest`
  - `organizationId`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns an array of `OSKOrganizationPromptTemplate` documents].

#### `update`
- **Request Type**: `OSKUpdateOrganizationPromptTemplateRequest`
  - `organizationId`: `string`
  - `promptName`: `string`
  - `promptTemplate`: `string`
- **Response Type**: Not explicitly defined in the evidence pack [Inferred: Returns a success status or the updated template document].

---

#### organization_property

### API Contracts (Callable Cloud Functions)
The following HTTPS callable functions are exposed by this capability:

#### `assigningPropertyToEntity`
- **Request Schema**: `OSKEntityAssigningPropertyRequestData`
  - `newEntityId`: `string`
  - `oldEntityId`: `string`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `createProperty`
- **Request Schema**: `OSKCreatePropertyRequestData`
  - `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
  - `entityId`: `string`
  - `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
  - `organizationId`: `string`
  - `propertyImage`: `string | undefined` (optional)
  - `propertyName`: `string`
  - `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`

#### `deleteProperty`
- **Request Schema**: `OSKGetPropertyByIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `deletePropertyImage`
- **Request Schema**: `OSKDeletePropertyImageRequest`
  - `filename`: `string`
  - `propertyId`: `string`

#### `getAllProperties`
- **Request Schema**: `OSKGetAllPropertiesRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`

#### `getPropertyById`
- **Request Schema**: `OSKGetPropertyByIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `getPropertyDashboardStatics`
- **Request Schema**: `OSKGetPropertyDashboardStaticsRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKGetPropertyDashboardStaticsResponseData`
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
- **Request Schema**: `OSKUpdatePropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### organization_residents

### Callable Functions & Request/Response Schemas

- **deleteResident**
  - **Request Type**: `OSKResidentsDocumentDeleteRequest`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

- **getAllResidents**
  - **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
    - `organizationId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **getResidentDetails**
  - **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `OSKOrganizationResidentResponseDocument` (Implicit)

- **getallResidentsByPropertyIdCallable**
  - **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
    - `organizationId`: `string`
    - `propertyId`: `string`
  - **Response Type**: `OSKResidentsDocumentResponse`
    - `count`: `number`
    - `residents`: `OSKOrganizationResidentResponseDocument[]`

- **updateResident**
  - **Request Type**: `OSKUpdateOrganizationResidentRequest`
    - `firstName`: `string`
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `lastName`: `string`
    - `organizationId`: `string`
    - `residentId`: `string`
  - **Response Type**: `void` (Implicit)

*Note: For `bulkCreateResidents` and `createResidents`, no `model_property` facts matched within this pack to resolve their exact schemas.*

---

#### organization_user

### API Contracts (Callable Cloud Functions)

#### `deleteOrganizationUser`
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`
- **Response Type**: Not specified (void/empty response)

#### `getAllOrganizationUsersAndInvitees`
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### `updateOrganizationUser`
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

#### `updateOrganizationUserRoles`
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`
- **Response Type**: Not specified

*Note: The endpoints `getOrganizationUserById`, `getOrganizationInviteeByEmail`, and `getOrganizationUserRoles` do not have matching model property definitions in this capability pack, so their detailed schemas are omitted.*

### Firestore Triggers
No Firestore triggers are owned or declared by this capability. **Confirmed** (absence of evidence).

---

#### organization_user_access

- No external HTTP API contracts (`api_contract` facts) or Firestore database triggers are directly owned or declared within this capability's evidence pack. [Confirmed]

---

#### organization_user_invitation

### Callable Functions
The capability exposes the following Firebase Callable Functions [Confirmed]:

#### `cancelUsersInvitation`
- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `createPMPUserWithInvitation`
- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber`
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `invitePMPUserWithInvitation`
- **Request Type**: `OSKOrganizationPMPUserInvitationRequest`
  - `adminOrganizationId`: `string`
  - `adminOrganizationName`: `string`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `organizationName`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `inviteUserWithInvitation`
- **Request Type**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`
- **Response Type**: `Promise<void>` [Inferred]

#### `processPMPInvitation`
- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` [Inferred]

#### `queryPMPInvitations`
- **Request Type**: `void` [Inferred]
- **Response Type**: `Promise<OSKOrganizationPMPUserInvitation[]>` [Inferred]

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].
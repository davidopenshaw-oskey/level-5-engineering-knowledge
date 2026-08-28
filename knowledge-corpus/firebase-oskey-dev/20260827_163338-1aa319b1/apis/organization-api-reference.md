### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T17:07:01.478Z
- repoName: firebase-oskey-dev
- targetModule: organization
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### API Contracts (Callable Functions)
The following callable functions are registered as entry points [Confirmed: `functions/src/modules/organization/index.ts` (lines 89-109)]:
- **`createAnOrganization`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|createAnOrganization|#1` ``]
- **`updateAnOrganization`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|updateAnOrganization|#1` ``]
- **`getAllOrganizations`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|getAllOrganizations|#1` ``]
- **`deleteOrganizationLogo`** [Confirmed: `` `api_contract|organization|functions/src/modules/organization/index.ts|deleteOrganizationLogo|#1` ``]

### Request/Response Schemas
The request schemas for the resolved callable functions are defined as follows:

#### `createAnOrganization`
- **Request Type**: `OSKOrganizationCreateRequest` [Confirmed]
  - `adminsOrganizationId`: `string`
  - `id`: `string`
  - `isoCountryCode`: `string`
  - `name`: `string`
  - `organizationLogo`: `string | undefined` (optional)
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `tenant`: `string`
  - `userRoles`: `string[]`

#### `updateAnOrganization`
- **Request Type**: `OSKOrganizationUpdateRequest` [Confirmed]
  - `adminsOrganizationId`: `string`
  - `id`: `string`
  - `isoCountryCode`: `string`
  - `name`: `string`
  - `organizationLogo`: `string | undefined` (optional)
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `tenant`: `string`
  - `userRoles`: `string[]`

#### `getAllOrganizations`
- **Request Type**: `OSKGetAllOrganizationsRequestDocument` [Confirmed]
  - `adminsOrganizationId`: `string`

#### `deleteOrganizationLogo`
No `model_property` facts matched within this pack for this endpoint's request/response schemas [Confirmed].

### Firestore Triggers
No Firestore triggers are registered directly within this capability's root file [Confirmed: `functions/src/modules/organization/index.ts` (lines 89-109)].

---

#### organization_building

### Callable API Contracts

#### `getAllOrganizationBuildings`
- **Request Schema**: `OSKGetAllOrganizationBuildingsRequestData`
  - `organizationId`: `string`
- **Response Schema**: Returns an array of organization buildings merged with master building data.

#### `getAllOrganizationBuildingsForOnboardingCards`
- **Request Schema**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: `OSKBuildingForOnboardingCards`
  - `buildingId`: `string`
  - `buildingName`: `string`
  - `units`: `OSKBuildingForOnboardingCardUnit[]`
    - `unitId`: `string`
    - `unitNumber`: `string`
    - `name`: `string`
    - `floor`: `string`
  - `doors`: `OSKBuildingForOnboardinCardDoor[]`
    - `doorId`: `string`
    - `name`: `string`

#### `getOrganizationBuildingById`
- **Request Schema**: `OSKGetORganizationBuildingByIdRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: Returns the requested organization building document.

### Firestore Triggers
None evidenced in this capability's pack.

#### organization_building_invitation

### Resolved API Request/Response Schemas

#### acceptBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
  - `adminsOrganizationId`: `string`
  - `invitationId`: `string`
  - `userId`: `string`

#### createBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
  - `adminsOrganizationId`: `string`
  - `buildingId`: `string`
  - `buildingUnitInhabitantType`: `OSKBuildingUnitInhabitantType` (imported from `@oskey/building/unit`)
  - `doorIds`: `string[] | undefined` (optional)
  - `email`: `string | undefined` (optional)
  - `firstName`: `string`
  - `internationalPhoneNumber`: `string`
  - `inviterId`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `postalAddress`: `OSKStreetAddress | undefined` (optional, imported from `@oskey/core`)
  - `unitId`: `string`
  - `userId`: `string | undefined` (optional)

#### queryBuildingInhabitantInvitation
- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
  - `adminsOrganizationId`: `string`
  - `collectionName`: `"invitationsSent" | "invitationsRejected"`
  - `queryField`: `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"`
  - `queryValue`: `string | { type: string; isResident?: boolean | undefined; }`

#### organization_entity

### Resolved API Request/Response Schemas

#### `assignSubEntityToParent`
- **Request Type**: `OSKAssignSubEntityToParentRequestData`
  - `newOrganizationId`: `string`
  - `newParentEntityId`: `string`
  - `oldOrganizationId`: `string`
  - `oldParentEntityId`: `string`
  - `subEntityId`: `string`
- **Response Type**: `Promise<void>` (Inferred from service signature)

#### `deleteEntity`
- **Request Type**: `OSKDeleteEntityRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<void>` (Inferred from service signature)

#### `getAllEntities`
- **Request Type**: `OSKGetAllEntityRequestData`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity[]>` (Inferred from service signature)

#### `getBuildingsByEntityId`
- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKBuilding[]>` (Inferred from service signature)

#### `getEntityById`
- **Request Type**: `OSKGetEntityByIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `Promise<OSKEntity>` (Inferred from service signature)

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
- **Response Type**: `Promise<void>` (Inferred from service signature)

---

#### organization_inhabitant

- **Callable API Contracts**:
  - `getAllOrganizationInhabitants`:
    - **Request Type**: `OSKPmpResidentsRequestData` (organizationId: string)
    - **Response Type**: `OSKPmpResidentsDocumentResponse` (count: number, inhabitants: OSKPmpResidentsDocument[])
  - `getInhabitantDetailsById`:
    - **Request Type**: `OSKPmpResidentsDetailsRequestData` (organizationId: string, userId: string)
    - **Response Type**: No matching response schema was resolved in the provided metadata.
- **Firestore Triggers**: None evidenced in this capability pack. (**Confirmed**)

---

#### organization_intercom_ communication

This capability exposes 8 Firebase Callable HTTPS APIs [Confirmed]. No Firestore triggers are owned by this capability [Confirmed].

### Resolved API Request/Response Schemas

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
    - `reason`: `string` (optional)

#### `deleteIntercomCommunication`
- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `communicationId`: `string`
  - `organizationId`: `string`
- **Response Type**: `void` (Resolved handler returns success status)

#### `getAllIntercomCommunicationService`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getAllIntercomCommunicationsByEntityId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
  - `entityId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getAllIntercomCommunicationsByPropertyId`
- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

#### `getArchivedIntercomCommunications`
- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKIntercomCommunicationMessage[]`

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

#### organization_onboarding_inhabitant

### API Contracts (Callable Cloud Functions)
The following callable functions are exposed by this capability `` `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (lines 39-57) ``:

- **`createOnboardingDocuments`**
  - **Request Schema**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
    - `onboardingCards`: `OSKInhabitantOnboardingCardRequest`
    - `organizationId`: `string`
- **`findOnboardingDocument`**
  - **Request Schema**: `OSKOrganizationOnboardingFindDocumentRequest`
    - `organizationId`: `string`
    - `unitId`: `string`
  - **Response Schema**: `OSKOrganizationOnboardingInhabitant`
- **`getOnboardingDocumentById`**
  - **Request Schema**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
    - `onboardingId`: `string`
    - `organizationId`: `string`
- **`sendOnboardingActivationCodeEmailCallable`**
  - **Request Schema**: `ResendActivationCodeRequest`
    - `language`: `OSKSupportedLanguageEnum`
    - `organizationId`: `string`
    - `residentId`: `string`
- **`verifyActivationCode`**
  - **Request Schema**: `OSKOrganizationOnboardingVerifyActivationCode`
    - `activationCode`: `string`
- **`verifyActivationCodeByOrganizationAdmin`**
  - **Request Schema**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
    - `activationCode`: `string`
    - `adminOrganizationId`: `string`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability [Confirmed].

#### organization_pending

### Callable Functions
The following callable functions are exposed by this capability:

#### `approvePendingOrganizationRequest`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `void` (updates status to "approved" and provisions organization)

#### `createPendingOrganization`
- **Request Schema**: `OSKOrganizationPending`
  - `name`: `string`
  - `status`: `"rejected" | "approved" | "pending"`
  - `streetAddress`: `OSKStreetAddress`
  - `taxNumber`: `string`
  - `userId`: `string`
- **Response Schema**: `void` (saves pending organization request)

#### `getAllPendingOrganizations`
- **Request Schema**: `OSKGetAllOrganizationsPendingRequestDocument`
  - `adminsOrganizationId`: `string`
- **Response Schema**: `OSKOrganizationPendingDocument[]`

#### `getCurrentUserPendingOrganizations`
- **Request Schema**: No matching `model_property` facts found in this pack.
- **Response Schema**: `OSKOrganizationPendingDocument[]`

#### `getPendingOrganizationById`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `OSKGetOrganizationsPendingByIdResponseDocument`
  - `user`: `OSKUserDocument | undefined`

#### `rejectPendingOrganizationRequest`
- **Request Schema**: `OSKGetOrganizationsPendingByIdRequestDocument`
  - `adminsOrganizationId`: `string`
  - `pendingOrganizationId`: `string`
- **Response Schema**: `void` (updates status to "rejected")

#### organization_prompt_templates

- **API Contracts**:
  - `create` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|create|#1` ``
  - `delete` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|delete|#1` ``
  - `get` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|get|#1` ``
  - `getAll` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|getAll|#1` ``
  - `update` (Callable) `` `api_contract|organization|functions/src/modules/organization/modules/organization_prompt_templates/index.ts|update|#1` ``

- **Resolved API Request/Response Schemas**:
```
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: create :: requestType :: OSKCreateOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
	promptTemplate	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: delete :: requestType :: OSKDeleteOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: get :: requestType :: OSKGetOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: getAll :: requestType :: OSKGetAllOrganizationPromptTemplatesRequest
	organizationId	string
functions/src/modules/organization/modules/organization_prompt_templates/index.ts :: update :: requestType :: OSKUpdateOrganizationPromptTemplateRequest
	organizationId	string
	promptName	string
	promptTemplate	string
```

- **Firestore Triggers**:
  - No Firestore triggers are owned or declared by this capability. [Confirmed]

---

#### organization_property

### Resolved API Request/Response Schemas

#### `assigningPropertyToEntity`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|assigningPropertyToEntity|#1` ``
- **Request Schema (`OSKEntityAssigningPropertyRequestData`)**:
  - `newEntityId`: `string`
  - `oldEntityId`: `string`
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `createProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|createProperty|#1` ``
- **Request Schema (`OSKCreatePropertyRequestData`)**:
  - `buildings`: `import("functions/src/modules/building/models/documents/building_document.model").OSKBuilding[]`
  - `entityId`: `string`
  - `managementType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyManagementEnum`
  - `organizationId`: `string`
  - `propertyImage`: `string | undefined` (optional)
  - `propertyName`: `string`
  - `propertyType`: `import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKPropertyTypeEnum`
  - `streetAddress`: `import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress`

#### `deleteProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deleteProperty|#1` ``
- **Request Schema (`OSKGetPropertyByIdRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `deletePropertyImage`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|deletePropertyImage|#1` ``
- **Request Schema (`OSKDeletePropertyImageRequest`)**:
  - `filename`: `string`
  - `propertyId`: `string`

#### `getAllProperties`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getAllProperties|#1` ``
- **Request Schema (`OSKGetAllPropertiesRequestData`)**:
  - `entityId`: `string`
  - `organizationId`: `string`

#### `getPropertyById`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyById|#1` ``
- **Request Schema (`OSKGetPropertyByIdRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`

#### `getPropertyDashboardStatics`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|getPropertyDashboardStatics|#1` ``
- **Request Schema (`OSKGetPropertyDashboardStaticsRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema (`OSKGetPropertyDashboardStaticsResponseData`)**:
  - `adminsCount`: `number`
  - `buildingsCount`: `number`
  - `devicesCount`: `number`
  - `residentsCount`: `{ onboarded: number; notOnboarded: number; }`

#### `updateProperty`
- **Type**: Callable HTTPS Function `` `api_contract|organization|functions/src/modules/organization/modules/organization_property/index.ts|updateProperty|#1` ``
- **Request Schema (`OSKUpdatePropertyRequestData`)**:
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `update`: `Partial<import("functions/src/modules/organization/modules/organization_property/models/documents/property_document").OSKProperty>`

#### organization_residents

### Callable Functions
- **`bulkCreateResidents`** (Callable)
- **`createResidents`** (Callable)
- **`deleteResident`** (Callable)
- **`getAllResidents`** (Callable)
- **`getallResidentsByPropertyIdCallable`** (Callable)
- **`getResidentDetails`** (Callable)
- **`updateResident`** (Callable)

### Resolved API Request/Response Schemas

#### `deleteResident`
- **Request Type**: `OSKResidentsDocumentDeleteRequest`
  - `organizationId`: `string`
  - `residentId`: `string`

#### `getAllResidents`
- **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `import("functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model").OSKOrganizationResidentResponseDocument[]`

#### `getResidentDetails`
- **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
  - `organizationId`: `string`
  - `residentId`: `string`
- *Note: No `model_property` facts matched within this pack to resolve the response schema.*

#### `getallResidentsByPropertyIdCallable`
- **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `OSKResidentsDocumentResponse`
  - `count`: `number`
  - `residents`: `import("functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model").OSKOrganizationResidentResponseDocument[]`

#### `updateResident`
- **Request Type**: `OSKUpdateOrganizationResidentRequest`
  - `firstName`: `string`
  - `inhabitantType`: `import("functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model").OSKBuildingUnitInhabitantType | undefined` (optional)
  - `lastName`: `string`
  - `organizationId`: `string`
  - `residentId`: `string`
- *Note: No `model_property` facts matched within this pack to resolve the response schema.*

#### `createResidents` / `bulkCreateResidents`
- *Note: No `model_property` facts matched within this pack to resolve the request or response schemas for these endpoints.*

#### organization_user

No Firestore triggers are registered in this capability's pack [Confirmed].

### Resolved API Request/Response Schemas

#### `deleteOrganizationUser` (Callable)
- **Request Type**: `OSKOrganizationUserDeleteRequest`
  - `organizationId`: `string`
  - `userId`: `string`

#### `getAllOrganizationUsersAndInvitees` (Callable)
- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
  - `organizationId`: `string`
- **Response Type**: `OSKGetAllOrganizationUsersAndInviteesResponseData`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `status`: `"active" | "invited"`
  - `userId`: `string`

#### `updateOrganizationUser` (Callable)
- **Request Type**: `OSKOrganizationUserUpdateRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`

#### `updateOrganizationUserRoles` (Callable)
- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
  - `organizationId`: `string`
  - `roles`: `string[]`
  - `userId`: `string`

#### organization_user_access

No API contracts (`api_contract` facts) or Firestore triggers are directly owned or declared by this capability.

---

#### organization_user_invitation

### Callable Functions
The following callable functions are exposed by this capability (**Confirmed**; `` `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (lines 51-61) ``):

#### `cancelUsersInvitation`
- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
  - `email`: `string`
  - `organizationId`: `string`

#### `createPMPUserWithInvitation`
- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `originalEmail`: `string | undefined` (optional)
  - `phoneNumber`: `OSKPhoneNumber`
  - `roles`: `string[]`

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

#### `inviteUserWithInvitation`
- **Request Type**: `OSKOrganizationUserInvitationRequest`
  - `email`: `string`
  - `firstName`: `string`
  - `lastName`: `string`
  - `organizationId`: `string`
  - `properties`: `OSKOrganizationUserInvitationPropertyType[] | undefined` (optional)
  - `roles`: `string[]`

#### `processPMPInvitation`
- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
  - `email`: `string`
  - `organizationId`: `string`

#### `queryPMPInvitations`
- **Request Type**: No explicit request schema matched within this pack (**Confirmed**).

### Firestore Triggers
- No Firestore triggers are owned or evidenced within this capability pack (**Confirmed**).

---
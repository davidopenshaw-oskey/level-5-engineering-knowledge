# API Reference: organization

## 0. Generation Metadata

- **Run ID**: 20260724_143235-1aa319b1
- **Generated At**: 2026-07-24T14:32:41.953Z

---

## 1. Callable Functions

### Interpretation

The `organization` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `createAnOrganization` | `OSKOrganizationCreateRequest` | ```json
{
  "id": "string",
  "adminsOrganizationId": "string",
  "isoCountryCode": "string",
  "taxNumber": "string",
  "tenant": "string",
  "name": "string",
  "streetAddress": "OSKStreetAddress",
  "organizationLogo": "string | undefined",
  "userRoles": "string[]"
}
``` |
| `updateAnOrganization` | `OSKOrganizationUpdateRequest` | ```json
{
  "id": "string",
  "adminsOrganizationId": "string",
  "isoCountryCode": "string",
  "taxNumber": "string",
  "tenant": "string",
  "name": "string",
  "streetAddress": "OSKStreetAddress",
  "organizationLogo": "string | undefined",
  "userRoles": "string[]"
}
``` |
| `getAllOrganizations` | `OSKGetAllOrganizationsRequestDocument` | ```json
{
  "adminsOrganizationId": "string"
}
``` |
| `deleteOrganizationLogo` | `deleteOrganizationLogoRequest` | ```json
{
  "organizationId": "string",
  "filename": "string"
}
``` |
| `acceptBuildingInhabitantInvitation` | `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest` | ```json
{
  "userId": "string",
  "invitationId": "string",
  "adminsOrganizationId": "string"
}
``` |
| `createBuildingInhabitantInvitation` | `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest` | ```json
{
  "organizationId": "string",
  "internationalPhoneNumber": "string",
  "buildingId": "string",
  "unitId": "string",
  "userId": "string | undefined",
  "firstName": "string",
  "lastName": "string",
  "postalAddress": "OSKStreetAddress | undefined",
  "email": "string | undefined",
  "buildingUnitInhabitantType": "OSKBuildingUnitInhabitantType",
  "adminsOrganizationId": "string",
  "inviterId": "string",
  "doorIds": "string[] | undefined"
}
``` |
| `queryBuildingInhabitantInvitation` | `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest` | ```json
{
  "collectionName": "\"invitationsSent\" | \"invitationsRejected\"",
  "queryField": "\"buildingId\" | \"unitId\" | \"invitationId\" | \"buildingUnitInhabitantType\"",
  "queryValue": "string | { type: string; isResident?: boolean | undefined; }",
  "adminsOrganizationId": "string"
}
``` |
| `getAllOrganizationBuildings` | `OSKGetAllOrganizationBuildingsRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getOrganizationBuildingById` | `OSKGetORganizationBuildingByIdRequestData` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `getAllOrganizationBuildingsForOnboardingCards` | `OSKGetAllOrganizationBuildingsByPropertyRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `getAllEntities` | `OSKGetAllEntityRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getEntityById` | `OSKGetEntityByIdRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `updateEntity` | `OSKUpdateEntityRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string",
  "update": "Partial<OSKSubEntityRequestData>"
}
``` |
| `createEntity` | `OSKCreateEntityRequestData` | ```json
{
  "organizationId": "any",
  "entityName": "any",
  "entityType": "any"
}
``` |
| `deleteEntity` | `OSKDeleteEntityRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `assignSubEntityToParent` | `OSKAssignSubEntityToParentRequestData` | ```json
{
  "oldOrganizationId": "string",
  "newOrganizationId": "string",
  "subEntityId": "string",
  "oldParentEntityId": "string",
  "newParentEntityId": "string"
}
``` |
| `getEntityDashboardStatics` | `OSKGetEntityDashboardStaticsRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `getBuildingsByEntityId` | `OSKGetEntityDashboardStaticsRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `getAllOrganizationInhabitants` | `OSKPmpResidentsRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getInhabitantDetailsById` | `OSKPmpResidentsDetailsRequestData` | ```json
{
  "userId": "string",
  "organizationId": "string"
}
``` |
| `getAllIntercomCommunicationService` | `OSKGetAllIntercomCommunicationRequestData` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `getArchivedIntercomCommunications` | `OSKGetAllIntercomCommunicationRequestData` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `getIntercomCommunicationById` | `OSKGetIntercomCommunicationByIdRequestData` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "communicationId": "string"
}
``` |
| `createIntercomCommunication` | `OSKCreateIntercomCommunicationRequestData` | ```json
{
  "homeInfo": "{ title: string; description: string; }",
  "schedule": "{ startDate: Date; endDate?: Date | undefined; }",
  "priority": "OSKCommunicationPriority",
  "organizationId": "string",
  "targets": "{ buildingId: string; buildingName: string; doorIds: string[]; }[]",
  "sendToChannels": "(\"intercom\" | \"residents\")[]"
}
``` |
| `deleteIntercomCommunication` | `OSKDeleteIntercomCommunicationRequestData` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "communicationId": "string"
}
``` |
| `reformulateCommunicationWithGemini` | `OSKReformulateCommunicationRequestData` | ```json
{
  "organizationId": "string",
  "title": "string",
  "description": "string"
}
``` |
| `getAllIntercomCommunicationsByEntityId` | `OSKGetAllIntercomCommunicationsByEntityIdRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `getAllIntercomCommunicationsByPropertyId` | `OSKGetAllIntercomCommunicationsByPropertyIdRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `createOnboardingDocuments` | `OSKOrganizationOnboardingInhabitantCreateLinkRequest` | ```json
{
  "organizationId": "string",
  "onboardingCards": "OSKInhabitantOnboardingCardRequest"
}
``` |
| `findOnboardingDocument` | `OSKOrganizationOnboardingFindDocumentRequest` | ```json
{
  "unitId": "string",
  "organizationId": "string"
}
``` |
| `updateOnboardingDocument` | `OSKOrganizationOnboardingInhabitantDocument` | ```json
{
  "onboardingId": "string",
  "inviterId": "string",
  "firstName": "string",
  "lastName": "string",
  "contactDetails": "OSKEmailAndPhoneGuaranteed",
  "organizationId": "string",
  "buildingId": "string",
  "doors": "OSKDoorOnboarding[]",
  "unitId": "string",
  "accessType": "OSKUserAccessType",
  "accessRights": "OSKAccessRightWithTimestamp[]",
  "inhabitantType": "OSKBuildingUnitInhabitantType | undefined",
  "creationDate": "any",
  "expiryDateActivationCode": "Timestamp",
  "expiryDateSms": "Timestamp",
  "phoneVerified": "boolean | undefined",
  "smsOtp": "number",
  "activationCode": "string",
  "emailVerified": "boolean | undefined",
  "onboardingQRCode": "string",
  "identityVerified": "boolean | undefined",
  "isUpdated": "boolean",
  "updatedFields": "OSKOrganizationOnboardingInhabitantUpdate",
  "linksUrl": "object",
  "isOnboarded": "boolean",
  "contactIdentifiers": "string[]",
  "modificationDate": "any"
}
``` |
| `verifyActivationCode` | `OSKOrganizationOnboardingVerifyActivationCode` | ```json
{
  "activationCode": "string"
}
``` |
| `getAllOnboardingDocuments` | `{ organizationId: string }` | ```json
{
  "organizationId": "string"
}
``` |
| `verifyActivationCodeByOrganizationAdmin` | `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData` | ```json
{
  "activationCode": "string",
  "adminOrganizationId": "string"
}
``` |
| `getOnboardingDocumentById` | `OSKOrganizationOnboardingGetDocumentByIdRequestData` | ```json
{
  "onboardingId": "string",
  "organizationId": "string"
}
``` |
| `sendOnboardingActivationCodeEmailCallable` | `ResendActivationCodeRequest` | ```json
{
  "language": "OSKSupportedLanguageEnum",
  "organizationId": "string",
  "residentId": "string"
}
``` |
| `createPendingOrganization` | `OSKOrganizationPending` | ```json
{
  "userId": "string",
  "name": "string",
  "taxNumber": "string",
  "streetAddress": "OSKStreetAddress",
  "status": "\"approved\" | \"rejected\" | \"pending\""
}
``` |
| `getAllPendingOrganizations` | `OSKGetAllOrganizationsPendingRequestDocument` | ```json
{
  "adminsOrganizationId": "string"
}
``` |
| `getCurrentUserPendingOrganizations` | `Record<string, never>` | ```json
{}
``` |
| `getPendingOrganizationById` | `OSKGetOrganizationsPendingByIdRequestDocument` | ```json
{
  "adminsOrganizationId": "string",
  "pendingOrganizationId": "string"
}
``` |
| `rejectPendingOrganizationRequest` | `OSKGetOrganizationsPendingByIdRequestDocument` | ```json
{
  "adminsOrganizationId": "string",
  "pendingOrganizationId": "string"
}
``` |
| `approvePendingOrganizationRequest` | `OSKGetOrganizationsPendingByIdRequestDocument` | ```json
{
  "adminsOrganizationId": "string",
  "pendingOrganizationId": "string"
}
``` |
| `getAll` | `OSKGetAllOrganizationPromptTemplatesRequest` | ```json
{
  "organizationId": "string"
}
``` |
| `get` | `OSKGetOrganizationPromptTemplateRequest` | ```json
{
  "organizationId": "string",
  "promptName": "string"
}
``` |
| `create` | `OSKCreateOrganizationPromptTemplateRequest` | ```json
{
  "organizationId": "string",
  "promptName": "string",
  "promptTemplate": "string"
}
``` |
| `update` | `OSKUpdateOrganizationPromptTemplateRequest` | ```json
{
  "organizationId": "string",
  "promptName": "string",
  "promptTemplate": "string"
}
``` |
| `delete` | `OSKDeleteOrganizationPromptTemplateRequest` | ```json
{
  "organizationId": "string",
  "promptName": "string"
}
``` |
| `getAllProperties` | `OSKGetAllPropertiesRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string"
}
``` |
| `getPropertyById` | `OSKGetPropertyByIdRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `createProperty` | `OSKCreatePropertyRequestData` | ```json
{
  "organizationId": "string",
  "entityId": "string",
  "propertyName": "string",
  "managementType": "OSKPropertyManagementEnum",
  "propertyType": "OSKPropertyTypeEnum",
  "streetAddress": "OSKStreetAddress",
  "propertyImage": "string | undefined",
  "buildings": "OSKBuilding[]"
}
``` |
| `updateProperty` | `OSKUpdatePropertyRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string",
  "update": "Partial<OSKProperty>"
}
``` |
| `deleteProperty` | `OSKGetPropertyByIdRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `assigningPropertyToEntity` | `OSKEntityAssigningPropertyRequestData` | ```json
{
  "organizationId": "string",
  "oldEntityId": "string",
  "newEntityId": "string",
  "propertyId": "string"
}
``` |
| `deletePropertyImage` | `OSKDeletePropertyImageRequest` | ```json
{
  "propertyId": "string",
  "filename": "string"
}
``` |
| `getPropertyDashboardStatics` | `OSKGetPropertyDashboardStaticsRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `getAllResidents` | `OSKGetAllOrganizationResidentsRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getResidentDetails` | `OSKGetOrganizationResidentDetailsRequestData` | ```json
{
  "organizationId": "string",
  "residentId": "string"
}
``` |
| `deleteResident` | `OSKResidentsDocumentDeleteRequest` | ```json
{
  "organizationId": "string",
  "residentId": "string"
}
``` |
| `createResidents` | `OSKOrganizationOnboardingInhabitantCreateLinkRequest` | ```json
{
  "organizationId": "string",
  "onboardingCards": "OSKInhabitantOnboardingCardRequest"
}
``` |
| `bulkCreateResidents` | `OSKBulkCreateResidentsRequest` | ```json
{
  "organizationId": "string",
  "residents": "OSKInhabitantOnboardingCardRequest[]"
}
``` |
| `updateResident` | `OSKUpdateOrganizationResidentRequest` | ```json
{
  "firstName": "string",
  "lastName": "string",
  "inhabitantType": "OSKBuildingUnitInhabitantType | undefined",
  "organizationId": "string",
  "residentId": "string"
}
``` |
| `getallResidentsByPropertyIdCallable` | `OSKGetAllResidentByPropertyIdRequest` | ```json
{
  "organizationId": "string",
  "propertyId": "string"
}
``` |
| `inviteUserWithInvitation` | `OSKOrganizationUserInvitationRequest` | ```json
{
  "email": "string",
  "organizationId": "string",
  "firstName": "string",
  "lastName": "string",
  "roles": "string[]",
  "properties": "OSKOrganizationUserInvitationPropertyType[] | undefined"
}
``` |
| `invitePMPUserWithInvitation` | `OSKOrganizationPMPUserInvitationRequest` | ```json
{
  "email": "string",
  "adminOrganizationId": "string",
  "adminOrganizationName": "string",
  "organizationId": "string",
  "organizationName": "string",
  "firstName": "string",
  "lastName": "string",
  "roles": "string[]",
  "properties": "OSKOrganizationUserInvitationPropertyType[] | undefined"
}
``` |
| `cancelUsersInvitation` | `OSKOrganizationUserInvitationCancelRequest` | ```json
{
  "email": "string",
  "organizationId": "string"
}
``` |
| `createPMPUserWithInvitation` | `OSKOrganizationCreatePMPUserInvitationRequest` | ```json
{
  "firstName": "string",
  "lastName": "string",
  "roles": "string[]",
  "email": "string",
  "phoneNumber": "OSKPhoneNumber",
  "organizationId": "string",
  "originalEmail": "string | undefined"
}
``` |
| `queryPMPInvitations` | `Record<string, never>` | ```json
{}
``` |
| `processPMPInvitation` | `OSKOrganizationProcessPMPInvitationRequest` | ```json
{
  "organizationId": "string",
  "email": "string"
}
``` |
| `updateOrganizationUser` | `OSKOrganizationUserUpdateRequest` | ```json
{
  "email": "string",
  "userId": "string",
  "organizationId": "string",
  "firstName": "string",
  "lastName": "string",
  "roles": "string[]"
}
``` |
| `deleteOrganizationUser` | `OSKOrganizationUserDeleteRequest` | ```json
{
  "userId": "string",
  "organizationId": "string"
}
``` |
| `updateOrganizationUserRoles` | `OSKOrganizationUserUpdateRolesRequest` | ```json
{
  "organizationId": "string",
  "userId": "string",
  "roles": "string[]"
}
``` |
| `getAllOrganizationUsersAndInvitees` | `OSKGetAllOrganizationUsersAndInviteesRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getOrganizationUserRoles` | `OSKWithOrganizationId` | ```json
{
  "organizationId": "string"
}
``` |
| `getOrganizationUserById` | `OSKWithOrganizationId & OSKWithUserId` | ```json
{
  "organizationId": "string",
  "userId": "string"
}
``` |
| `getOrganizationInviteeByEmail` | `OSKWithOrganizationId & { userEmail: string }` | ```json
{
  "organizationId": "string",
  "userEmail": "string"
}
``` |

### Evidence Used

- API Contract: The `organization-evidence-graph.json` file contains 75 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/organization/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

### Enums

| Enum Name | Members | File |
| :--- | :--- | :--- |
| `OSKEntityType` | `entity = entity`, `subEntity = subEntity` | `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` |
| `OSKPropertyManagementEnum` | `CoOwnershipAssociation = coOwnershipAssociation`, `SyndicIndividual = syndicIndividual`, `SyndicProfessional = syndicProfessional`, `CollectifHabitat = collectifHabitat`, `CollectifHabitatSocial = collectifHabitatSocial`, `PrivateIndividual = privateIndividual`, `PrivateIndividualLandlord = privateIndividualLandlord` | `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` |
| `OSKPropertyTypeEnum` | `Residencial = residencial`, `Commercial = commercial`, `Residencial_Commercial = residencial_commercial` | `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` |

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKOrganization` | `{     isoCountryCode: string;     taxNumber: string;     tenant: string;     name: string;     streetAddress: OSKStre...` | `functions/src/modules/organization/models/documents/organization_document.model.ts` |
| `OSKOrganizationDocument` | `OSKDocument<OSKOrganization>` | `functions/src/modules/organization/models/documents/organization_document.model.ts` |
| `OSKGetAllOrganizationsRequestDocument` | `{     adminsOrganizationId: string; }` | `functions/src/modules/organization/models/functions/get_all_organizations_request_document.model.ts` |
| `deleteOrganizationLogoRequest` | `{     organizationId: string;     filename: string; }` | `functions/src/modules/organization/models/functions/organization_request_document_model.ts` |
| `OSKWithOrganizationId` | `{     organizationId: string; }` | `functions/src/modules/organization/models/shared/with-organization-id.model.ts` |
| `OSKWithUserId` | `{     userId: string; }` | `functions/src/modules/organization/models/shared/with-user-id.model.ts` |
| `OSKOrganizationBuilding` | `{     organizationId: string;     buildingId: string;     buildingName?: string;     buildingData?: OSKBuildingDocume...` | `functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts` |
| `OSKOrganizationBuildingDocument` | `OSKDocument<OSKOrganizationBuilding>` | `functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts` |
| `OSKGetAllOrganizationBuildingsRequestData` | `{     organizationId: string; }` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKGetAllOrganizationBuildingsByPropertyRequestData` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKGetORganizationBuildingByIdRequestData` | `{     organizationId: string;     buildingId: string; }` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKBuildingForOnboardingCardUnit` | `Pick<OSKBuildingUnit, 'name' \| 'unitId' \| 'unitNumber' \| 'floor'>` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKBuildingForOnboardinCardDoor` | `Pick<OSKBuildingDoor, 'doorId' \| 'name'>` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKBuildingForOnboardingCards` | `Pick<OSKOrganizationBuilding, 'buildingId' \| 'buildingName'> & {     units: OSKBuildingForOnboardingCardUnit[]; } & ...` | `functions/src/modules/organization/modules/organization_building/models/functions/organization_building_request_document_model.ts` |
| `OSKEntityP` | `{     organizationId: string;     entityId: string;     entityName: string;     entityType: OSKEntityType.entity;    ...` | `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` |
| `OSKSubEntity` | `{     organizationId: string;     entityId: string;     entityName: string;     entityType: OSKEntityType.subEntity; ...` | `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` |
| `OSKEntity` | `OSKEntityP \| OSKSubEntity` | `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` |
| `OSKEntityDocument` | `OSKDocument<OSKEntity>` | `functions/src/modules/organization/modules/organization_entity/models/documents/entity_document_model.ts` |
| `OSKGetAllEntityRequestData` | `{     organizationId: string; }` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKGetEntityByIdRequestData` | `{     organizationId: string;     entityId: string; }` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKEntityPRequestData` | `{     organizationId: string;     entityName: string;     entityType: OSKEntityType.entity;     subEntityIds: string[...` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKSubEntityRequestData` | `{     organizationAdminId: string;     organizationId: string;     entityName: string;     entityType: OSKEntityType....` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKCreateEntityRequestData` | `OSKEntityPRequestData \| OSKSubEntityRequestData` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKUpdateEntityRequestData` | `{     organizationId: string;     entityId: string;     update: Partial<OSKSubEntityRequestData>; }` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKDeleteEntityRequestData` | `{     organizationId: string;     entityId: string; }` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKAssignSubEntityToParentRequestData` | `{     oldOrganizationId: string;     newOrganizationId: string;     subEntityId: string;     oldParentEntityId: strin...` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKGetEntityDashboardStaticsRequestData` | `{     organizationId: string;     entityId: string; }` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKGetEntityDashboardStaticsResponseData` | `{     residentsCount: { onboarded: number; notOnboarded: number };     buildingsCount: number;     adminsCount: numbe...` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKCreateBuildingRequestData` | `{     organizationId: string;     propertyId: string;     name?: string;     imageFilename?: string;     streetAddres...` | `functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model.ts` |
| `OSKPmpResidents` | `{ userId : string; lastName: string; firstName: string; buildingId : string; unitId : string; email: string; phoneNum...` | `functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model.ts` |
| `OSKPmpResidentsDocument` | `OSKDocument<OSKPmpResidents>` | `functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model.ts` |
| `OSKPmpResidentsRequestData` | `{     organizationId : string; }` | `functions/src/modules/organization/modules/organization_inhabitant/models/functions/organization_inhabitant_request_document.model.ts` |
| `OSKPmpResidentsDetailsRequestData` | `{     userId : string;     organizationId : string;  }` | `functions/src/modules/organization/modules/organization_inhabitant/models/functions/organization_inhabitant_request_document.model.ts` |
| `OSKPmpResidentsSucessResponse` | `{     sucess : string;     message : string; }` | `functions/src/modules/organization/modules/organization_inhabitant/models/functions/organization_inhabitant_request_document.model.ts` |
| `OSKPmpResidentsDocumentResponse` | `{     count: number;      inhabitants: OSKPmpResidentsDocument[];  }` | `functions/src/modules/organization/modules/organization_inhabitant/models/functions/organization_inhabitant_request_document.model.ts` |
| `OSKCommunicationPriority` | `'standard' \| 'critical'` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKCommunicationSchedule` | `{     startDate: Date;     endDate?: Date; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `IntercomCommunicationSupportedLanguage` | `'FR' \| 'EN' \| 'ES' \| 'DE' \| 'AR' \| 'ZH' \| 'JA' \| 'IW'` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKLocalizedInfoBlock` | `{     local: IntercomCommunicationSupportedLanguage;     infosData: OSKContentData[]; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKContentData` | `{     title: string;     description: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKDoorInfo` | `{     doorId: string;     doorName: string;     accessControlDeviceId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKIntercomCommunicationStatus` | `'scheduled' \| 'active' \| 'expired'` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKIntercomCommunicationConfig` | `{     communicationId: string;     homeInfos: OSKLocalizedInfoBlock[];     schedule: OSKCommunicationSchedule;     pr...` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKIntercomBuildingStateDocument` | `OSKDocument<OSKIntercomBuildingState>` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKIntercomCommunicationArchiveDocument` | `OSKDocument<OSKIntercomCommunicationMessage>` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts` |
| `OSKCreateIntercomCommunicationRequestData` | `{     homeInfo: {         title: string;         description: string;     };     schedule: {         startDate: Date;...` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKCreateIntercomCommunicationResult` | `{     buildingId: string;     status: 'fulfilled' \| 'rejected';     reason?: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKCreateIntercomCommunicationResponseData` | `{     communicationId: string;     results: OSKCreateIntercomCommunicationResult[]; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKGetAllIntercomCommunicationRequestData` | `{     organizationId: string;     buildingId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKGetIntercomCommunicationByIdRequestData` | `{     organizationId: string;     buildingId: string;     communicationId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKUpdateIntercomCommunicationRequestData` | `{     organizationId: string;     buildingId: string;     communicationId: string;     update: Partial<OSKIntercomCom...` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKDeleteIntercomCommunicationRequestData` | `{     organizationId: string;     buildingId: string;     communicationId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKReformulateCommunicationRequestData` | `{     organizationId: string;     title: string;     description: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKReformulateCommunicationResponseData` | `{     reformulatedTitle: string;     reformulatedDescription: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKGetAllIntercomCommunicationsByEntityIdRequestData` | `{     organizationId: string;     entityId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKGetAllIntercomCommunicationsByPropertyIdRequestData` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_intercom_ communication/models/functions/organization_intercom_communication_request.model.ts` |
| `OSKOrganizationOnboardingInhabitantUpdate` | `{     firstName?: string;     lastName?: string;     email?: string;     phoneNumber?: string; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `OSKExpirationInfo` | `{     creationDate: Timestamp;     smsExpiration: Timestamp;     activationCodeExpiration: Timestamp; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `OSKEmailVerificationPayload` | `{     email: string;     emailCode: string; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `OSKSmsVerificationPayload` | `{     internationalPhoneNumber: string;     smsCode: number;     isUpdated: boolean;     updatedFields: OSKOrganizati...` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `ActivationEmailPayload` | `{     language: OSKSupportedLanguage;     email: string;     firstName: string;     lastName: string;     activationC...` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `OSKOrganizationOnboardingInhabitant` | `{     onboardingId: string;     inviterId: string;     firstName: string;     lastName: string;     contactDetails: O...` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `OSKOrganizationOnboardingInhabitantDocument` | `OSKDocument<OSKOrganizationOnboardingInhabitant>` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts` |
| `ResendActivationCodeRequest` | `{     language: OSKSupportedLanguageEnum;     organizationId: string;     residentId: string; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document.ts` |
| `OSKBulkCreateResidentsRequest` | `{     organizationId: string;     residents: OSKInhabitantOnboardingCardRequest[]; // Array parsed from the CSV in th...` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document.ts` |
| `OSKBulkCreateResidentResult` | `{     identifier: string; // Typically the email or phone number to identify the row     success: boolean;     error?...` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document.ts` |
| `OSKBulkCreateResidentsResponse` | `{     totalProcessed: number;     successful: number;     failed: number;     results: OSKBulkCreateResidentResult[]; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document.ts` |
| `OSKEmailGuaranteed` | `{ email: string; internationalPhoneNumber?: OSKPhoneNumber }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKPhoneGuaranteed` | `{ email?: string; internationalPhoneNumber: OSKPhoneNumber }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKEmailAndPhoneGuaranteed` | `{ email: string; internationalPhoneNumber: OSKPhoneNumber }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKOnboardingContact` | `OSKEmailAndPhoneGuaranteed` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKDoorOnboarding` | `{     doorId: string; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKOnboardingLink` | `{     androidStore: string;     appleStore: string; }` | `functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model.ts` |
| `OSKOrganizationPending` | `{     userId: string;     name: string;     taxNumber: string;     streetAddress: OSKStreetAddress;     status: 'appr...` | `functions/src/modules/organization/modules/organization_pending/models/documents/organization_pending_document.model.ts` |
| `OSKOrganizationPendingDocument` | `OSKDocument<OSKOrganizationPending>` | `functions/src/modules/organization/modules/organization_pending/models/documents/organization_pending_document.model.ts` |
| `OSKGetAllOrganizationsPendingRequestDocument` | `{     adminsOrganizationId: string; }` | `functions/src/modules/organization/modules/organization_pending/models/functions/get_organizations_pending_request_document.model.ts` |
| `OSKGetOrganizationsPendingByIdRequestDocument` | `{     adminsOrganizationId: string;     pendingOrganizationId: string; }` | `functions/src/modules/organization/modules/organization_pending/models/functions/organizations_pending_by_id_request_document.ts` |
| `OSKGetOrganizationsPendingByIdResponseDocument` | `OSKOrganizationPendingDocument & {     user: OSKUserDocument \| undefined; }` | `functions/src/modules/organization/modules/organization_pending/models/functions/organizations_pending_by_id_request_document.ts` |
| `OSKOrganizationPromptName` | `'textReformulate' \| 'textTranslate'` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKOrganizationPromptTemplate` | `{     organizationId: string;     promptName: string;     promptTemplate: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKOrganizationPromptTemplateDocument` | `OSKDocument<OSKOrganizationPromptTemplate>` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKGetAllOrganizationPromptTemplatesRequest` | `{     organizationId: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKGetOrganizationPromptTemplateRequest` | `{     organizationId: string;     promptName: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKCreateOrganizationPromptTemplateRequest` | `{     organizationId: string;     promptName: string;     promptTemplate: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKUpdateOrganizationPromptTemplateRequest` | `{     organizationId: string;     promptName: string;     promptTemplate: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKDeleteOrganizationPromptTemplateRequest` | `{     organizationId: string;     promptName: string; }` | `functions/src/modules/organization/modules/organization_prompt_templates/models/organization_prompt_templates.model.ts` |
| `OSKProperty` | `{     organizationId: string;     entityId: string;     propertyId?: string;     propertyName: string;     streetAddr...` | `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` |
| `OSKPropertyDocument` | `OSKDocument<OSKProperty>` | `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` |
| `OSKOrganizationPropertyBuildings` | `OSKProperty` | `functions/src/modules/organization/modules/organization_property/models/documents/property_document.ts` |
| `OSKGetAllPropertiesRequestData` | `{     organizationId: string;     entityId: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKGetPropertyByIdRequestData` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKCreatePropertyRequestData` | `{     organizationId: string;     entityId: string;     propertyName: string;     managementType: OSKPropertyManageme...` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKUpdatePropertyRequestData` | `{     organizationId: string;     propertyId: string;     update: Partial<OSKProperty>; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKDeletePropertyRequestData` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKEntityAssigningPropertyRequestData` | `{     organizationId: string;     oldEntityId: string;     newEntityId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKDeletePropertyImageRequest` | `{     propertyId: string;     filename: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKGetPropertyDashboardStaticsRequestData` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKGetPropertyDashboardStaticsResponseData` | `{     residentsCount: {         onboarded: number;         notOnboarded: number;     };     buildingsCount: number;  ...` | `functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts` |
| `OSKOrganizationResidentBase` | `{     residentId: string;     firstName: string;     lastName: string;     email: string;     phoneNumber?: OSKPhoneN...` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKOrganizationResident` | `OSKOrganizationResidentBase & {     updatedFields: OSKOrganizationResidentUpdate; }` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKOrganizationResidentResponse` | `{     residentId: string;     firstName: string;     lastName: string;     email: string;     buildingName: string;  ...` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKOrganizationResidentUpdate` | `Partial<OSKOrganizationResidentBase>` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKOrganizationResidentDocument` | `OSKDocument<OSKOrganizationResident>` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKOrganizationResidentResponseDocument` | `OSKDocument<OSKOrganizationResidentResponse>` | `functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts` |
| `OSKGetAllOrganizationResidentsRequestData` | `{     organizationId: string; }` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKGetOrganizationResidentDetailsRequestData` | `{     organizationId: string;     residentId: string; }` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKGetAllResidentByPropertyIdRequest` | `{     organizationId: string;     propertyId: string; }` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKResidentsDocumentResponse` | `{     count: number;     residents: OSKOrganizationResidentResponseDocument[]; }` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKResidentsDocumentDeleteRequest` | `{     organizationId: string;     residentId: string; }` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKUpdateOrganizationResidentRequest` | `{     firstName: string;     lastName: string;     inhabitantType?: OSKBuildingUnitInhabitantType;     organizationId...` | `functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts` |
| `OSKOrganizationUserInvitationCancelled` | `OSKOrganizationUserInvitation & {     cancellationDate: Timestamp; }` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_cancelled_document.model.ts` |
| `OSKOrganizationUserInvitationCancelledDocument` | `OSKDocument<OSKOrganizationUserInvitationCancelled>` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_cancelled_document.model.ts` |
| `OSKOrganizationUserInvitation` | `{     email: string;     userId?: string;     organizationId: string;     firstName: string;     lastName: string;   ...` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_document.model.ts` |
| `OSKOrganizationPMPUserInvitation` | `{     email: string;     userId?: string;     organizationId: string;     firstName: string;     lastName: string;   ...` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_document.model.ts` |
| `OSKOrganizationUserInvitationDocument` | `OSKDocument<OSKOrganizationUserInvitation>` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_document.model.ts` |
| `OSKOrganizationPMPUserInvitationDocument` | `OSKDocument<OSKOrganizationPMPUserInvitation>` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_document.model.ts` |
| `OSKOrganizationUserInvitationPending` | `{     email: string;     userId: string;     organizationId: string;     isApproved: boolean;     organizationName: s...` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_pending_document.model.ts` |
| `OSKOrganizationUserInvitationPendingDocument` | `OSKDocument<OSKOrganizationUserInvitationPending>` | `functions/src/modules/organization/modules/organization_user_invitation/models/documents/organization_user_invitation_pending_document.model.ts` |
| `OSKOrganizationUserInvitationPropertyType` | `{     propertId: string;     buildings: {         buildingId: string;     }[]; }` | `functions/src/modules/organization/modules/organization_user_invitation/models/functions/organization_user_invitation_request_document.model.ts` |
| `OSKOrganizationUser` | `{     email: string;     userId: string;     organizationId: string;     firstName: string;     lastName: string;    ...` | `functions/src/modules/organization/modules/organization_user/models/documents/organization_user_document.model.ts` |
| `OSKOrganizationUserDocument` | `OSKDocument<OSKOrganizationUser>` | `functions/src/modules/organization/modules/organization_user/models/documents/organization_user_document.model.ts` |
| `OSKOrganizationUserUpdate` | `{     email: string;     userId: string;     organizationId: string;     firstName?: string;     lastName?: string;  ...` | `functions/src/modules/organization/modules/organization_user/models/documents/organization_user_update_document.model.ts` |
| `OSKOrganizationUserUpdateDocument` | `OSKDocument<OSKOrganizationUserUpdate>` | `functions/src/modules/organization/modules/organization_user/models/documents/organization_user_update_document.model.ts` |

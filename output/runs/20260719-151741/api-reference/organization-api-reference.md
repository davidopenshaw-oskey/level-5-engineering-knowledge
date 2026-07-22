# API Reference: organization

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.405Z

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
  "streetAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress",
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
  "streetAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress",
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
  "postalAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress | undefined",
  "email": "string | undefined",
  "buildingUnitInhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model\").OSKBuildingUnitInhabitantType",
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
  "update": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_entity/models/functions/entity_request_document_model\").OSKSubEntityRequestData>"
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
  "priority": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model\").OSKCommunicationPriority",
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
  "onboardingCards": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document\").OSKInhabitantOnboardingCardRequest"
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
  "contactDetails": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model\").OSKEmailAndPhoneGuaranteed",
  "organizationId": "string",
  "buildingId": "string",
  "doors": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/shared/organization_onboarding_inhabitant_shared_documents.model\").OSKDoorOnboarding[]",
  "unitId": "string",
  "accessType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model\").OSKUserAccessType",
  "accessRights": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/modules/access/models/access_right.model\").OSKAccessRightWithTimestamp[]",
  "inhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model\").OSKBuildingUnitInhabitantType | undefined",
  "creationDate": "any",
  "expiryDateActivationCode": "FirebaseFirestore.Timestamp",
  "expiryDateSms": "FirebaseFirestore.Timestamp",
  "phoneVerified": "boolean | undefined",
  "smsOtp": "number",
  "activationCode": "string",
  "emailVerified": "boolean | undefined",
  "onboardingQRCode": "string",
  "identityVerified": "boolean | undefined",
  "isUpdated": "boolean",
  "updatedFields": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model\").OSKOrganizationOnboardingInhabitantUpdate",
  "linksUrl": "object",
  "isOnboarded": "boolean",
  "contactIdentifiers": "string[]",
  "modificationDate": "FirebaseFirestore.Timestamp | undefined"
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
  "language": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/supported_language.model\").OSKSupportedLanguageEnum",
  "organizationId": "string",
  "residentId": "string"
}
``` |
| `createPendingOrganization` | `OSKOrganizationPending` | ```json
{
  "userId": "string",
  "name": "string",
  "taxNumber": "string",
  "streetAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress",
  "status": "\"rejected\" | \"pending\" | \"approved\""
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
  "managementType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_property/models/documents/property_document\").OSKPropertyManagementEnum",
  "propertyType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_property/models/documents/property_document\").OSKPropertyTypeEnum",
  "streetAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress",
  "propertyImage": "string | undefined",
  "buildings": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/models/documents/building_document.model\").OSKBuilding[]"
}
``` |
| `updateProperty` | `OSKUpdatePropertyRequestData` | ```json
{
  "organizationId": "string",
  "propertyId": "string",
  "update": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_property/models/documents/property_document\").OSKProperty>"
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
  "onboardingCards": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document\").OSKInhabitantOnboardingCardRequest"
}
``` |
| `bulkCreateResidents` | `OSKBulkCreateResidentsRequest` | ```json
{
  "organizationId": "string",
  "residents": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document\").OSKInhabitantOnboardingCardRequest[]"
}
``` |
| `updateResident` | `OSKUpdateOrganizationResidentRequest` | ```json
{
  "firstName": "string",
  "lastName": "string",
  "inhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model\").OSKBuildingUnitInhabitantType | undefined",
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
  "properties": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_user_invitation/models/functions/organization_user_invitation_request_document.model\").OSKOrganizationUserInvitationPropertyType[] | undefined"
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
  "properties": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/organization/modules/organization_user_invitation/models/functions/organization_user_invitation_request_document.model\").OSKOrganizationUserInvitationPropertyType[] | undefined"
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
  "phoneNumber": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/phone_number.model\").OSKPhoneNumber",
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

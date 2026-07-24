<!-- © Oskey SAS. All rights reserved. -->

# Module API Contract Specification: organization

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `organization` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_162236-1aa319b1` |
| **Exported Callables** | 75 |
| **Type Aliases / Enums** | 123 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `organization` domain module.

---

## 2. HTTPS Callable Functions (75 Endpoints)

### `createAnOrganization`

- **Request Type**: `OSKOrganizationCreateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `id` | `string` | No |
| `adminsOrganizationId` | `string` | No |
| `isoCountryCode` | `string` | No |
| `taxNumber` | `string` | No |
| `tenant` | `string` | No |
| `name` | `string` | No |
| `streetAddress` | `OSKStreetAddress` | No |
| `organizationLogo` | `string | undefined` | No |
| `userRoles` | `string[]` | No |

### `updateAnOrganization`

- **Request Type**: `OSKOrganizationUpdateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `id` | `string` | No |
| `adminsOrganizationId` | `string` | No |
| `isoCountryCode` | `string` | No |
| `taxNumber` | `string` | No |
| `tenant` | `string` | No |
| `name` | `string` | No |
| `streetAddress` | `OSKStreetAddress` | No |
| `organizationLogo` | `string | undefined` | No |
| `userRoles` | `string[]` | No |

### `getAllOrganizations`

- **Request Type**: `OSKGetAllOrganizationsRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOrganizationId` | `string` | No |

### `deleteOrganizationLogo`

- **Request Type**: `deleteOrganizationLogoRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `filename` | `string` | No |

### `acceptBuildingInhabitantInvitation`

- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationAcceptRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `invitationId` | `string` | No |
| `adminsOrganizationId` | `string` | No |

### `createBuildingInhabitantInvitation`

- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationCreateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `internationalPhoneNumber` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `userId` | `string | undefined` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `postalAddress` | `OSKStreetAddress | undefined` | No |
| `email` | `string | undefined` | No |
| `buildingUnitInhabitantType` | `OSKBuildingUnitInhabitantType` | No |
| `adminsOrganizationId` | `string` | No |
| `inviterId` | `string` | No |
| `doorIds` | `string[] | undefined` | No |

### `queryBuildingInhabitantInvitation`

- **Request Type**: `OSKOrganizationBuildingUnitInhabitantInvitationQueryRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `collectionName` | `"invitationsSent" | "invitationsRejected"` | No |
| `queryField` | `"buildingId" | "unitId" | "invitationId" | "buildingUnitInhabitantType"` | No |
| `queryValue` | `string | { type: string; isResident?: boolean | undefined; }` | No |
| `adminsOrganizationId` | `string` | No |

### `getAllOrganizationBuildings`

- **Request Type**: `OSKGetAllOrganizationBuildingsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getOrganizationBuildingById`

- **Request Type**: `OSKGetORganizationBuildingByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |

### `getAllOrganizationBuildingsForOnboardingCards`

- **Request Type**: `OSKGetAllOrganizationBuildingsByPropertyRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_building/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `getAllEntities`

- **Request Type**: `OSKGetAllEntityRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getEntityById`

- **Request Type**: `OSKGetEntityByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `updateEntity`

- **Request Type**: `OSKUpdateEntityRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |
| `update` | `Partial<OSKSubEntityRequestData>` | No |

### `createEntity`

- **Request Type**: `OSKCreateEntityRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `any` | No |
| `entityName` | `any` | No |
| `entityType` | `any` | No |

### `deleteEntity`

- **Request Type**: `OSKDeleteEntityRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `assignSubEntityToParent`

- **Request Type**: `OSKAssignSubEntityToParentRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `oldOrganizationId` | `string` | No |
| `newOrganizationId` | `string` | No |
| `subEntityId` | `string` | No |
| `oldParentEntityId` | `string` | No |
| `newParentEntityId` | `string` | No |

### `getEntityDashboardStatics`

- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `getBuildingsByEntityId`

- **Request Type**: `OSKGetEntityDashboardStaticsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_entity/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `getAllOrganizationInhabitants`

- **Request Type**: `OSKPmpResidentsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getInhabitantDetailsById`

- **Request Type**: `OSKPmpResidentsDetailsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `organizationId` | `string` | No |

### `getAllIntercomCommunicationService`

- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |

### `getArchivedIntercomCommunications`

- **Request Type**: `OSKGetAllIntercomCommunicationRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |

### `getIntercomCommunicationById`

- **Request Type**: `OSKGetIntercomCommunicationByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |
| `communicationId` | `string` | No |

### `createIntercomCommunication`

- **Request Type**: `OSKCreateIntercomCommunicationRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `homeInfo` | `{ title: string; description: string; }` | No |
| `schedule` | `{ startDate: Date; endDate?: Date | undefined; }` | No |
| `priority` | `OSKCommunicationPriority` | No |
| `organizationId` | `string` | No |
| `targets` | `{ buildingId: string; buildingName: string; doorIds: string[]; }[]` | No |
| `sendToChannels` | `("intercom" | "residents")[]` | No |

### `deleteIntercomCommunication`

- **Request Type**: `OSKDeleteIntercomCommunicationRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |
| `communicationId` | `string` | No |

### `reformulateCommunicationWithGemini`

- **Request Type**: `OSKReformulateCommunicationRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `title` | `string` | No |
| `description` | `string` | No |

### `getAllIntercomCommunicationsByEntityId`

- **Request Type**: `OSKGetAllIntercomCommunicationsByEntityIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `getAllIntercomCommunicationsByPropertyId`

- **Request Type**: `OSKGetAllIntercomCommunicationsByPropertyIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_intercom_ communication/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `createOnboardingDocuments`

- **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `onboardingCards` | `OSKInhabitantOnboardingCardRequest` | No |

### `findOnboardingDocument`

- **Request Type**: `OSKOrganizationOnboardingFindDocumentRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `unitId` | `string` | No |
| `organizationId` | `string` | No |

### `updateOnboardingDocument`

- **Request Type**: `OSKOrganizationOnboardingInhabitantDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `onboardingId` | `string` | No |
| `inviterId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `contactDetails` | `OSKEmailAndPhoneGuaranteed` | No |
| `organizationId` | `string` | No |
| `buildingId` | `string` | No |
| `doors` | `OSKDoorOnboarding[]` | No |
| `unitId` | `string` | No |
| `accessType` | `OSKUserAccessType` | No |
| `accessRights` | `OSKAccessRightWithTimestamp[]` | No |
| `inhabitantType` | `OSKBuildingUnitInhabitantType | undefined` | No |
| `creationDate` | `any` | No |
| `expiryDateActivationCode` | `Timestamp` | No |
| `expiryDateSms` | `Timestamp` | No |
| `phoneVerified` | `boolean | undefined` | No |
| `smsOtp` | `number` | No |
| `activationCode` | `string` | No |
| `emailVerified` | `boolean | undefined` | No |
| `onboardingQRCode` | `string` | No |
| `identityVerified` | `boolean | undefined` | No |
| `isUpdated` | `boolean` | No |
| `updatedFields` | `OSKOrganizationOnboardingInhabitantUpdate` | No |
| `linksUrl` | `object` | No |
| `isOnboarded` | `boolean` | No |
| `contactIdentifiers` | `string[]` | No |
| `modificationDate` | `any` | No |

### `verifyActivationCode`

- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCode`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `activationCode` | `string` | No |

### `getAllOnboardingDocuments`

- **Request Type**: `{ organizationId: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `verifyActivationCodeByOrganizationAdmin`

- **Request Type**: `OSKOrganizationOnboardingVerifyActivationCodeByOrgAdminRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `activationCode` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `getOnboardingDocumentById`

- **Request Type**: `OSKOrganizationOnboardingGetDocumentByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `onboardingId` | `string` | No |
| `organizationId` | `string` | No |

### `sendOnboardingActivationCodeEmailCallable`

- **Request Type**: `ResendActivationCodeRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_onboarding_inhabitant/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `language` | `OSKSupportedLanguageEnum` | No |
| `organizationId` | `string` | No |
| `residentId` | `string` | No |

### `createPendingOrganization`

- **Request Type**: `OSKOrganizationPending`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `name` | `string` | No |
| `taxNumber` | `string` | No |
| `streetAddress` | `OSKStreetAddress` | No |
| `status` | `"approved" | "rejected" | "pending"` | No |

### `getAllPendingOrganizations`

- **Request Type**: `OSKGetAllOrganizationsPendingRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOrganizationId` | `string` | No |

### `getCurrentUserPendingOrganizations`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

### `getPendingOrganizationById`

- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOrganizationId` | `string` | No |
| `pendingOrganizationId` | `string` | No |

### `rejectPendingOrganizationRequest`

- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOrganizationId` | `string` | No |
| `pendingOrganizationId` | `string` | No |

### `approvePendingOrganizationRequest`

- **Request Type**: `OSKGetOrganizationsPendingByIdRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_pending/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOrganizationId` | `string` | No |
| `pendingOrganizationId` | `string` | No |

### `getAll`

- **Request Type**: `OSKGetAllOrganizationPromptTemplatesRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `get`

- **Request Type**: `OSKGetOrganizationPromptTemplateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `promptName` | `string` | No |

### `create`

- **Request Type**: `OSKCreateOrganizationPromptTemplateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `promptName` | `string` | No |
| `promptTemplate` | `string` | No |

### `update`

- **Request Type**: `OSKUpdateOrganizationPromptTemplateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `promptName` | `string` | No |
| `promptTemplate` | `string` | No |

### `delete`

- **Request Type**: `OSKDeleteOrganizationPromptTemplateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_prompt_templates/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `promptName` | `string` | No |

### `getAllProperties`

- **Request Type**: `OSKGetAllPropertiesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |

### `getPropertyById`

- **Request Type**: `OSKGetPropertyByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `createProperty`

- **Request Type**: `OSKCreatePropertyRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `entityId` | `string` | No |
| `propertyName` | `string` | No |
| `managementType` | `OSKPropertyManagementEnum` | No |
| `propertyType` | `OSKPropertyTypeEnum` | No |
| `streetAddress` | `OSKStreetAddress` | No |
| `propertyImage` | `string | undefined` | No |
| `buildings` | `OSKBuilding[]` | No |

### `updateProperty`

- **Request Type**: `OSKUpdatePropertyRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |
| `update` | `Partial<OSKProperty>` | No |

### `deleteProperty`

- **Request Type**: `OSKGetPropertyByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `assigningPropertyToEntity`

- **Request Type**: `OSKEntityAssigningPropertyRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `oldEntityId` | `string` | No |
| `newEntityId` | `string` | No |
| `propertyId` | `string` | No |

### `deletePropertyImage`

- **Request Type**: `OSKDeletePropertyImageRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `propertyId` | `string` | No |
| `filename` | `string` | No |

### `getPropertyDashboardStatics`

- **Request Type**: `OSKGetPropertyDashboardStaticsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_property/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `getAllResidents`

- **Request Type**: `OSKGetAllOrganizationResidentsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getResidentDetails`

- **Request Type**: `OSKGetOrganizationResidentDetailsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `residentId` | `string` | No |

### `deleteResident`

- **Request Type**: `OSKResidentsDocumentDeleteRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `residentId` | `string` | No |

### `createResidents`

- **Request Type**: `OSKOrganizationOnboardingInhabitantCreateLinkRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `onboardingCards` | `OSKInhabitantOnboardingCardRequest` | No |

### `bulkCreateResidents`

- **Request Type**: `OSKBulkCreateResidentsRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `residents` | `OSKInhabitantOnboardingCardRequest[]` | No |

### `updateResident`

- **Request Type**: `OSKUpdateOrganizationResidentRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `inhabitantType` | `OSKBuildingUnitInhabitantType | undefined` | No |
| `organizationId` | `string` | No |
| `residentId` | `string` | No |

### `getallResidentsByPropertyIdCallable`

- **Request Type**: `OSKGetAllResidentByPropertyIdRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_residents/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `propertyId` | `string` | No |

### `inviteUserWithInvitation`

- **Request Type**: `OSKOrganizationUserInvitationRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |
| `organizationId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `roles` | `string[]` | No |
| `properties` | `OSKOrganizationUserInvitationPropertyType[] | undefined` | No |

### `invitePMPUserWithInvitation`

- **Request Type**: `OSKOrganizationPMPUserInvitationRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `adminOrganizationName` | `string` | No |
| `organizationId` | `string` | No |
| `organizationName` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `roles` | `string[]` | No |
| `properties` | `OSKOrganizationUserInvitationPropertyType[] | undefined` | No |

### `cancelUsersInvitation`

- **Request Type**: `OSKOrganizationUserInvitationCancelRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |
| `organizationId` | `string` | No |

### `createPMPUserWithInvitation`

- **Request Type**: `OSKOrganizationCreatePMPUserInvitationRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `roles` | `string[]` | No |
| `email` | `string` | No |
| `phoneNumber` | `OSKPhoneNumber` | No |
| `organizationId` | `string` | No |
| `originalEmail` | `string | undefined` | No |

### `queryPMPInvitations`

- **Request Type**: `Record<string, never>`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

### `processPMPInvitation`

- **Request Type**: `OSKOrganizationProcessPMPInvitationRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user_invitation/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `email` | `string` | No |

### `updateOrganizationUser`

- **Request Type**: `OSKOrganizationUserUpdateRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `email` | `string` | No |
| `userId` | `string` | No |
| `organizationId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `roles` | `string[]` | No |

### `deleteOrganizationUser`

- **Request Type**: `OSKOrganizationUserDeleteRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `organizationId` | `string` | No |

### `updateOrganizationUserRoles`

- **Request Type**: `OSKOrganizationUserUpdateRolesRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `userId` | `string` | No |
| `roles` | `string[]` | No |

### `getAllOrganizationUsersAndInvitees`

- **Request Type**: `OSKGetAllOrganizationUsersAndInviteesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getOrganizationUserRoles`

- **Request Type**: `OSKWithOrganizationId`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `getOrganizationUserById`

- **Request Type**: `OSKWithOrganizationId & OSKWithUserId`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `userId` | `string` | No |

### `getOrganizationInviteeByEmail`

- **Request Type**: `OSKWithOrganizationId & { userEmail: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/organization/modules/organization_user/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |
| `userEmail` | `string` | No |

---

## 3. Data Models & Type Definitions (123 Types)

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

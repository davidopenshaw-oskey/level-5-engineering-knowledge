<!-- © Oskey SAS. All rights reserved. -->

# Module API Contract Specification: unit_management

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Domain Module** | `unit_management` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_153335-1aa319b1` |
| **Exported Callables** | 10 |
| **Type Aliases / Enums** | 28 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `unit_management` domain module.

---

## 2. HTTPS Callable Functions (10 Endpoints)

### `createUnitInvitation`

- **Request Type**: `OSKUnitInvitation`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `inviterId` | `string` | No |
| `firstName` | `string` | No |
| `lastName` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `doors` | `OSKUserDoor[]` | No |
| `accessMethods` | `OSKAccessMethod | undefined` | No |
| `invitees` | `OSKUnitInvitationInvitees[]` | No |
| `confidentiality` | `string | undefined` | No |
| `callForwarding` | `string | undefined` | No |
| `modificationDate` | `any` | No |

### `removeInhabitantFromUnit`

- **Request Type**: `OSKUnitManagementRemoveInhabitantRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `inhabitantToRemoveId` | `string` | No |

### `removePendingInvitation`

- **Request Type**: `OSKUnitManagementRemovePendingInvitationRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `inviterId` | `string` | No |
| `emailOrPhone` | `"email" | "phone"` | No |
| `value` | `string` | No |

### `updateInhabitant`

- **Request Type**: `OSKUnitManagementChangeInhabitantRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `inhabitantToChangeUserId` | `string` | No |
| `newInhabitantType` | `OSKBuildingUnitInhabitantType | undefined` | No |
| `residentRights` | `OSKResidentRights | undefined` | No |

### `removePermanentGuest`

- **Request Type**: `OSKUnitManagementRemovePermanentGuestRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `permanentGuestUserId` | `string` | No |

### `getPermanentGuest`

- **Request Type**: `OSKUnitManagementGetPermanentGuestRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `permanentGuestUserId` | `string` | No |

### `getAllUnitInhabitantsAndGuests`

- **Request Type**: `OSKUnitManagementGetUnitInhabitantsRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |

### `getSingleUnitInhabitant`

- **Request Type**: `OSKUnitManagementGetSingleUnitInhabitantRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `inhabitantUserId` | `string` | No |

### `getUnitInvitationsByUserId`

- **Request Type**: `OSKUnitInvitationsGetByUserIdRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |

### `getUnitPerson`

- **Request Type**: `OSKUnitManagementPeopleRequest`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/unit_management/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `targetUserId` | `string | undefined` | No |
| `callType` | `OSKUnitRequestType` | No |
| `emailOrPhone` | `string | undefined` | No |
| `value` | `string | undefined` | No |

---

## 3. Data Models & Type Definitions (28 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKUnitInvitationInvitees` | `{     userAccessType:         \| OSKUserAccessType.InhabitantUser         \| OSKUserAccessType.InhabitantGuestUser   ...` | `functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts` |
| `OSKUnitInvitation` | `{     inviterId: string;     firstName: string;     lastName: string;     buildingId: string;     unitId: string;    ...` | `functions/src/modules/unit_management/models/documents/unit_management_invitation_document.ts` |
| `OSKUnitManagementRemoveInhabitantRequest` | `{     userId: string,     buildingId: string,     unitId: string,     inhabitantToRemoveId: string }` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKUnitManagementChangeInhabitantRequest` | `{     userId: string,     buildingId: string,     unitId: string,     inhabitantToChangeUserId: string,     newInhabi...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKUnitInvitationsGetByUserIdResponse` | `{     invitations: OSKExternalUserInvitationsDocument[] }` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKUnitManagementGetUnitInhabitantsRequest` | `{     userId: string,     buildingId: string,     unitId: string }` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKUnitManagementGetSingleUnitInhabitantRequest` | `{     userId: string, // caller     buildingId: string,     unitId: string,     inhabitantUserId: string }` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKUnitManagementRemovePendingInvitationRequest` | `{     userId: string;      buildingId: string;     unitId: string;     inviterId: string;      emailOrPhone: 'email' ...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_request_document.ts` |
| `OSKInhabitantsAndGuestsList` | `{     userId?: string;     firstName: string;     lastName: string;     inviterId?: string;     inhabitantType?: OSKB...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKPendingInvitesList` | `{     inhabitantType?: OSKBuildingUnitInhabitantType;     userAccessType: OSKUserAccessType;     invitee?: OSKInvitee...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKNonAppUsersList` | `{     nonAppUserId: string;     buildingId: string;     unitId: string;     fullName: string;     inviterId: string; }` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKInhabitantsAndGuestsListResponse` | `{     userId: string;     firstName: string;     lastName: string;     inhabitantType: OSKBuildingUnitInhabitantType;...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKSingleUnitInhabitantResponse` | `{     userId: string;     firstName: string;     lastName: string;     email: string;     phoneNumber: OSKPhoneNumber...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleRequest` | `{     userId: string; // caller userId     buildingId: string;     unitId: string;     targetUserId?: string;     cal...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponseBase` | `{     userId: string; // caller userId     firstName: string;     lastName: string;     email: string;     userAccess...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementNonAppUserPeopleResponseBase` | `{     nonAppUserId: string;     fullName: string;     userAccessType: OSKUserAccessType.NonAppUser;     pincodes: OSK...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponseInhabitant` | `OSKUnitManagementPeopleResponseBase & {     callType: OSKUnitRequestType.InhabitantUser;     userAccessType: OSKUserA...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponsePermanent` | `OSKUnitManagementPeopleResponseBase & {     callType: OSKUnitRequestType.InhabitantPermanentGuestUser;     userAccess...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponseNonAppUser` | `OSKUnitManagementNonAppUserPeopleResponseBase & {     callType: OSKUnitRequestType.NonAppUser;     userAccessType: OS...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponsePendingInvitation` | `{     callType: OSKUnitRequestType.InhabitantPendingInvitation;     userAccessType: OSKUserAccessType;     inhabitant...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitManagementPeopleResponse` | `\| OSKUnitManagementPeopleResponseInhabitant     \| OSKUnitManagementPeopleResponsePermanent     \| OSKUnitManagement...` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |
| `OSKUnitInvitationCreationResponse` | `{     recordKey?: string,     accessId?: string \| null,     status?:string }` | `functions/src/modules/unit_management/models/functions/unit_management_invitation_creation_response_document.ts` |
| `OSKUnitInvitationsGetByUserIdRequest` | `{     userId: string,     buildingId: string,     unitId: string }` | `functions/src/modules/unit_management/models/functions/unit_management_invitation_request_document.ts` |
| `OSKUnitInvitationsGetByUserIdResponse` | `{     invitations: OSKExternalUserInvitationsDocument[] }` | `functions/src/modules/unit_management/models/functions/unit_management_invitation_request_document.ts` |
| `OSKUnitManagementUpdatePermanentGuestRequest` | `{     userId: string;     buildingId: string;     unitId: string;     permanentGuestUserId: string;     fromDate: Tim...` | `functions/src/modules/unit_management/models/functions/unit_management_permanent_guest_request_document.ts` |
| `OSKUnitManagementRemovePermanentGuestRequest` | `{     userId: string;     buildingId: string;     unitId: string;     permanentGuestUserId: string; }` | `functions/src/modules/unit_management/models/functions/unit_management_permanent_guest_request_document.ts` |
| `OSKUnitManagementGetPermanentGuestRequest` | `{     userId: string;     buildingId: string;     unitId: string;     permanentGuestUserId: string; }` | `functions/src/modules/unit_management/models/functions/unit_management_permanent_guest_request_document.ts` |
| `OSKUnitManagementGetPermanentGuestResponse` | `{     userId: string;     firstName: string;     lastName: string;     email: string;     phoneNumber: OSKPhoneNumber...` | `functions/src/modules/unit_management/models/functions/unit_management_permanent_guest_request_document.ts` |

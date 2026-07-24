# API Reference: unit_management

## 0. Generation Metadata

- **Run ID**: 20260724_143603-1aa319b1
- **Generated At**: 2026-07-24T14:36:09.872Z

---

## 1. Callable Functions

### Interpretation

The `unit_management` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `createUnitInvitation` | `OSKUnitInvitation` | ```json
{
  "inviterId": "string",
  "firstName": "string",
  "lastName": "string",
  "buildingId": "string",
  "unitId": "string",
  "doors": "OSKUserDoor[]",
  "accessMethods": "OSKAccessMethod | undefined",
  "invitees": "OSKUnitInvitationInvitees[]",
  "confidentiality": "string | undefined",
  "callForwarding": "string | undefined",
  "modificationDate": "any"
}
``` |
| `removeInhabitantFromUnit` | `OSKUnitManagementRemoveInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantToRemoveId": "string"
}
``` |
| `removePendingInvitation` | `OSKUnitManagementRemovePendingInvitationRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inviterId": "string",
  "emailOrPhone": "\"email\" | \"phone\"",
  "value": "string"
}
``` |
| `updateInhabitant` | `OSKUnitManagementChangeInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantToChangeUserId": "string",
  "newInhabitantType": "OSKBuildingUnitInhabitantType | undefined",
  "residentRights": "OSKResidentRights | undefined"
}
``` |
| `removePermanentGuest` | `OSKUnitManagementRemovePermanentGuestRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestUserId": "string"
}
``` |
| `getPermanentGuest` | `OSKUnitManagementGetPermanentGuestRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestUserId": "string"
}
``` |
| `getAllUnitInhabitantsAndGuests` | `OSKUnitManagementGetUnitInhabitantsRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getSingleUnitInhabitant` | `OSKUnitManagementGetSingleUnitInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantUserId": "string"
}
``` |
| `getUnitInvitationsByUserId` | `OSKUnitInvitationsGetByUserIdRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getUnitPerson` | `OSKUnitManagementPeopleRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "targetUserId": "string | undefined",
  "callType": "OSKUnitRequestType",
  "emailOrPhone": "string | undefined",
  "value": "string | undefined"
}
``` |

### Evidence Used

- API Contract: The `unit_management-evidence-graph.json` file contains 10 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/unit_management/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

### Enums

| Enum Name | Members | File |
| :--- | :--- | :--- |
| `OSKUnitRequestType` | `InhabitantUser = inhabitantUser`, `InhabitantPermanentGuestUser = inhabitantPermanentGuestUser`, `NonAppUser = nonAppUser`, `InhabitantPendingInvitation = pendingUnitInvitation` | `functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts` |

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

# API Reference: unit_management

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.852Z

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

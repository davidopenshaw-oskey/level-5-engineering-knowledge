# API Reference: core

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.821Z

---

## 1. Callable Functions

### Interpretation

The `core` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `getAllUserAccesses` | `OSKUserAccessRequestAccessesGetAll` | ```json
{
  "userId": "string"
}
``` |
| `getAllUserAccessesPerBuilding` | `OSKUserAccessRequestAccessesGetByBuilding` | ```json
{
  "userId": "string",
  "buildingId": "string"
}
``` |
| `onCreatePincodeAnonymousAccess` | `OSKCreatePincodeAnonymousAccessRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "userId": "string",
  "startDate": "Date",
  "endDate": "Date",
  "doorIds": "string[] | undefined",
  "isValidOnce": "boolean | undefined"
}
``` |
| `exchangeAuth0Token` | `OSKAuth0TokenRequest` | ```json
{
  "token": "string"
}
``` |
| `getUserPhoneNumber` | `OSKAuth0GetUserPhoneNumberRequest` | ```json
{
  "userId": "string"
}
``` |
| `getMfaPhoneNumber` | `OSKAuth0GetMFAPhoneNumberRequest` | ```json
{
  "userId": "string"
}
``` |
| `verifyOwnershipOTP` | `OSKAuth0VerifyOwnershipOTPRequest` | ```json
{
  "email": "string",
  "code": "string"
}
``` |
| `sendOTPEmail` | `OSKAuth0SendOTPCodeRequest` | ```json
{
  "email": "string"
}
``` |
| `enableMfa` | `OSKAuth0EnableMfaRequest` | ```json
{
  "userId": "string"
}
``` |
| `disableMfa` | `OSKAuth0DisableMfaRequest` | ```json
{
  "userId": "string"
}
``` |
| `syncMfaPhoneNumberToProfile` | `OSKAuth0SyncMfaPhoneNumberRequest` | ```json
{
  "userId": "string"
}
``` |
| `onGetCountries` | `Record<string, never>` | ```json
{}
``` |
| `onGetCountriesNoAuth` | `Record<string, never>` | ```json
{}
``` |
| `generateUploadSignedUrlCallable` | `GenerateUploadUrlRequest` | ```json
{
  "uploadType": "UploadType",
  "userId": "string | undefined",
  "buildingId": "string | undefined",
  "propertyId": "string | undefined",
  "organizationId": "string | undefined",
  "contentType": "string"
}
``` |

### Evidence Used

- API Contract: The `core-evidence-graph.json` file contains 14 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/core/index.ts` registers these handlers.

### Confidence

High.

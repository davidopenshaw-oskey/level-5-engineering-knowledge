### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T17:16:31.065Z
- repoName: firebase-oskey-dev
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

- **API Contracts**:
  - **HTTP Endpoint**: `processPubSubMessage` (HTTPS request handler that processes Pub/Sub push messages) `` `api_contract|core|functions/src/modules/core/index.ts|processPubSubMessage|#1` ``.
- **Firestore Triggers**:
  - **Storage Trigger**: `getStorageTriggers` registers `OSKStorageService.onFinalize` on the default bucket `functions/src/modules/core/index.ts` (lines 54-59).
- **Schemas**: No resolved API request/response schemas matched within this pack.

---

#### access

### Callable Functions

#### `getAllUserAccesses`
- **File**: `functions/src/modules/core/modules/access/index.ts` (lines 71-89)
- **Request Type**: `OSKUserAccessRequestAccessesGetAll`
  - `userId`: `string`
- **Response Type**: `OSKUserAccessRequestAccessesGetAllResponse`
  - `data`: `OSKAccess[]` (Inferred from model properties)

#### `getAllUserAccessesPerBuilding`
- **File**: `functions/src/modules/core/modules/access/index.ts` (lines 91-113)
- **Request Type**: `OSKUserAccessRequestAccessesGetByBuilding`
  - `buildingId`: `string`
  - `userId`: `string`
- **Response Type**: `OSKUserAccessRequestAccessesGetByBuildingResponse`
  - `accesses`: `OSKAccess[]` (Inferred from model properties)

#### `onCreatePincodeAnonymousAccess`
- **File**: `functions/src/modules/core/modules/access/index.ts` (lines 284-388)
- **Request Type**: `OSKCreatePincodeAnonymousAccessRequest`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `isValidOnce`: `boolean | undefined` (optional)
  - `startDate`: `Date`
  - `unitId`: `string`
  - `userId`: `string`
- **Response Type**: `{ accessId: string, pincodeId: string }` (Inferred from `OSKAccessService.createAccess` return log)

### Firestore Triggers
- No Firestore triggers are directly defined within this capability pack. [Confirmed]

---

#### auth0

### Resolved API Request/Response Schemas

#### `disableMfa`
- **Request Type**: `OSKAuth0DisableMfaRequest`
  - `userId`: `string`
- **Response Type**: `void` (No explicit response type defined)

#### `enableMfa`
- **Request Type**: `OSKAuth0EnableMfaRequest`
  - `userId`: `string`
- **Response Type**: `void` (No explicit response type defined)

#### `exchangeAuth0Token`
- **Request Type**: `OSKAuth0TokenRequest`
  - `token`: `string`
- **Response Type**: `OSKAuth0ExchangeTokenResponse`
  - `firebaseToken`: `string`
  - `newUser`: `boolean`
  - `userId`: `string | undefined` (optional)

#### `getMfaPhoneNumber`
- **Request Type**: `OSKAuth0GetMFAPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: `OSKAuth0GetMFAPhoneNumberResponse`
  - `phoneNumber`: `string`

#### `getUserPhoneNumber`
- **Request Type**: `OSKAuth0GetUserPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: `OSKAuth0GetUserPhoneNumberResponse`
  - `phoneNumber`: `string | null`

#### `sendOTPEmail`
- **Request Type**: `OSKAuth0SendOTPCodeRequest`
  - `email`: `string`
- **Response Type**: `void` (No explicit response type defined)

#### `syncMfaPhoneNumberToProfile`
- **Request Type**: `OSKAuth0SyncMfaPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: `void` (No explicit response type defined)

#### `verifyOwnershipOTP`
- **Request Type**: `OSKAuth0VerifyOwnershipOTPRequest`
  - `code`: `string`
  - `email`: `string`
- **Response Type**: `OSKAuth0VerifyOwnershipOTPResponse`
  - `verified`: `boolean`

### Firestore Triggers
This capability does not own or register any Firestore triggers [Confirmed].

#### country

### Callable APIs
- **`onGetCountries`** [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountries|#1` ``)
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.
- **`onGetCountriesNoAuth`** [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountriesNoAuth|#1` ``)
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.

---

#### public_key

No external API contracts (`api_contract` facts) or Firestore triggers are owned directly by this capability. The controller methods are designed to be invoked programmatically by other modules or internal functions. [Confirmed]

---

#### storage

### Callable API: `generateUploadSignedUrlCallable`
- **Exported from**: `functions/src/modules/core/modules/storage/index.ts` [Confirmed: `api_contract|core|functions/src/modules/core/modules/storage/index.ts|generateUploadSignedUrlCallable|#1`]
- **Request Schema**: `GenerateUploadUrlRequest` [Confirmed: `type_alias|core|functions/src/modules/core/modules/storage/models/functions/storage_request_document.model.ts|GenerateUploadUrlRequest|#1`]
  ```typescript
  {
    buildingId?: string;
    contentType: string;
    organizationId?: string;
    propertyId?: string;
    uploadType: UploadType; // e.g., organization or building assets
    userId?: string;
  }
  ```
- **Response Schema**: `GenerateUploadUrlResponse` [Confirmed: `type_alias|core|functions/src/modules/core/modules/storage/models/functions/storage_request_document.model.ts|GenerateUploadUrlResponse|#1`]
  ```typescript
  {
    filePath: string;
    uploadUrl: string;
  }
  ```

### Cloud Storage Trigger: `onFinalize`
- **Trigger Source**: Google Cloud Storage object finalization (`onFinalize`).
- **Handler**: `OSKStorageService.onFinalize` which forwards the payload to `OSKStorageController.processFile`. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageController.default.processFile|onFinalize|object,context|#1`].

---
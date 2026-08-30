### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:35:17.699Z
- repoName: firebase-oskey-dev
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### API Contracts
- **Confirmed**: Exposes an HTTP POST endpoint for Pub/Sub message ingestion `` `api_contract|core|functions/src/modules/core/index.ts|processPubSubMessage|#1` ``:
  - **Method**: `POST` (via `https.onRequest`)
  - **Path**: `/processPubSubMessage`
  - **Request Type**: `OSKPubSubMessage`
  - **Response Type**: `void` (returns HTTP status `204` on success, `400` on bad request, `405` on method not allowed, or `500` on internal error)
  - **Schema**: No `model_property` facts matched within this pack to expand the request/response schemas.

### Firestore Triggers
- **Confirmed**: This capability does not declare any direct Firestore triggers, but it exports triggers from sibling submodules (e.g., `storage`, `auth0`, `country`, `access`) via `getCallableFunctionTriggers` `` `functions/src/modules/core/index.ts` (lines 64-71) ``.

### Storage Triggers
- **Confirmed**: Registers a Cloud Storage trigger on the default bucket that executes `OSKStorageService.onFinalize` when a new object is finalized `` `call_expression|core|functions/src/modules/core/index.ts|storage.bucket().object().onFinalize|getStorageTriggers||#1` ``.

---

#### access

### Callable Functions
The following callable functions are exposed by this capability:

#### `getAllUserAccesses`
- **Request Type**: `OSKUserAccessRequestAccessesGetAll`
  - `userId`: `string`
- **Response Type**: `OSKUserAccessRequestAccessesGetAllResponse` (Inferred)

#### `getAllUserAccessesPerBuilding`
- **Request Type**: `OSKUserAccessRequestAccessesGetByBuilding`
  - `buildingId`: `string`
  - `userId`: `string`
- **Response Type**: `OSKUserAccessRequestAccessesGetByBuildingResponse` (Inferred)

#### `onCreatePincodeAnonymousAccess`
- **Request Type**: `OSKCreatePincodeAnonymousAccessRequest`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `isValidOnce`: `boolean | undefined` (optional)
  - `startDate`: `Date`
  - `unitId`: `string`
  - `userId`: `string`
- **Response Type**: `void` (Inferred)

---

#### auth0

### API Contracts (Callable Cloud Functions)

#### `exchangeAuth0Token`
- **Request Type**: `OSKAuth0TokenRequest`
  - `token`: `string`
- **Response Type**: `OSKAuth0ExchangeTokenResponse`
  - `firebaseToken`: `string`
  - `newUser`: `boolean`
  - `userId`: `string | undefined` (optional)

#### `getUserPhoneNumber`
- **Request Type**: `OSKAuth0GetUserPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: `OSKAuth0GetUserPhoneNumberResponse`
  - `phoneNumber`: `string | null`

#### `getMfaPhoneNumber`
- **Request Type**: `OSKAuth0GetMFAPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: `OSKAuth0GetMFAPhoneNumberResponse`
  - `phoneNumber`: `string`

#### `verifyOwnershipOTP`
- **Request Type**: `OSKAuth0VerifyOwnershipOTPRequest`
  - `code`: `string`
  - `email`: `string`
- **Response Type**: `OSKAuth0VerifyOwnershipOTPResponse`
  - `verified`: `boolean`

#### `sendOTPEmail`
- **Request Type**: `OSKAuth0SendOTPCodeRequest`
  - `email`: `string`
- **Response Type**: *No matching `model_property` facts found in this pack.*

#### `enableMfa`
- **Request Type**: `OSKAuth0EnableMfaRequest`
  - `userId`: `string`
- **Response Type**: *No matching `model_property` facts found in this pack.*

#### `disableMfa`
- **Request Type**: `OSKAuth0DisableMfaRequest`
  - `userId`: `string`
- **Response Type**: *No matching `model_property` facts found in this pack.*

#### `syncMfaPhoneNumberToProfile`
- **Request Type**: `OSKAuth0SyncMfaPhoneNumberRequest`
  - `userId`: `string`
- **Response Type**: *No matching `model_property` facts found in this pack.*

### Firestore Triggers
- **None**: This capability does not define or own any Firestore triggers [Confirmed].

---

#### country

#### Callable APIs
- **`onGetCountries`**
  - **File**: `functions/src/modules/core/modules/country/index.ts` (lines 17-43)
  - **Trigger Type**: HTTPS Callable
  - **Request/Response Schema**: No matching `model_property` facts in this scope.

- **`onGetCountriesNoAuth`**
  - **File**: `functions/src/modules/core/modules/country/index.ts` (lines 45-56)
  - **Trigger Type**: HTTPS Callable
  - **Request/Response Schema**: No matching `model_property` facts in this scope.

---

#### public_key

No direct HTTP API contracts or Firestore triggers are defined within this capability's pack. The controller is designed to be called programmatically by other modules or submodules.

**Confidence Tag**: **Confirmed**

#### storage

### API Contracts
- **generateUploadSignedUrlCallable** (Callable Function) [Confirmed] `` `api_contract|core|functions/src/modules/core/modules/storage/index.ts|generateUploadSignedUrlCallable|#1` ``

#### Request Schema: `GenerateUploadUrlRequest`
- `buildingId`: `string | undefined` (optional)
- `contentType`: `string`
- `organizationId`: `string | undefined` (optional)
- `propertyId`: `string | undefined` (optional)
- `uploadType`: `UploadType` (imported from `storage_document.model`)
- `userId`: `string | undefined` (optional)

#### Response Schema: `GenerateUploadUrlResponse`
- `filePath`: `string`
- `uploadUrl`: `string`

### Firestore Triggers
- None evidenced in this capability pack. [Confirmed]

### Storage Triggers
- **onFinalize**: Triggered when a file is successfully uploaded/finalized in Google Cloud Storage. [Confirmed] `` `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1` ``
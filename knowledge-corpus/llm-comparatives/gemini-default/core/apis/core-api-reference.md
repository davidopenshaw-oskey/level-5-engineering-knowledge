### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:11:39.596Z
- repoName: firebase-oskey-dev
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### HTTP Endpoints
- **processPubSubMessage**
  - **Type**: HTTP POST [Confirmed] (Cite `` `api_contract|core|functions/src/modules/core/index.ts|processPubSubMessage|#1` ``)
  - **Handler**: `PubSubMessageProcessor.processPubSubMessage` [Confirmed] (Cite `functions/src/modules/core/index.ts` line 77)
  - **Request/Response Schemas**: No `model_property` facts matched within this pack for the endpoint's request/response types. [Confirmed]

### Firestore Triggers
None directly declared in this capability pack (though it aggregates callable triggers from other submodules). [Confirmed] (Cite `functions/src/modules/core/index.ts` lines 64-71)

### Storage Triggers
- **onFinalize**
  - **Trigger Type**: Cloud Storage Object Finalize [Confirmed] (Cite `functions/src/modules/core/index.ts` line 57)
  - **Handler**: `OSKStorageService.onFinalize` [Confirmed] (Cite `functions/src/modules/core/index.ts` line 57)

---

#### access

- **Submodule**: `organization_user_access`
  - **Import Path**: `@oskey/organization/user/access`
  - **Used In**: `access_utils.service.ts`

#### auth0

### Callable Functions
The following callable functions are exposed by this capability [Confirmed] `` `functions/src/modules/core/modules/auth0/index.ts` (lines 22-35)``:

#### `disableMfa`
- **Request Schema**: `OSKAuth0DisableMfaRequest`
  - `userId`: `string`

#### `enableMfa`
- **Request Schema**: `OSKAuth0EnableMfaRequest`
  - `userId`: `string`

#### `exchangeAuth0Token`
- **Request Schema**: `OSKAuth0TokenRequest`
  - `token`: `string`
- **Response Schema**: `OSKAuth0ExchangeTokenResponse`
  - `firebaseToken`: `string`
  - `newUser`: `boolean`
  - `userId`: `string | undefined` (optional)

#### `getMfaPhoneNumber`
- **Request Schema**: `OSKAuth0GetMFAPhoneNumberRequest`
  - `userId`: `string`
- **Response Schema**: `OSKAuth0GetMFAPhoneNumberResponse`
  - `phoneNumber`: `string`

#### `getUserPhoneNumber`
- **Request Schema**: `OSKAuth0GetUserPhoneNumberRequest`
  - `userId`: `string`
- **Response Schema**: `OSKAuth0GetUserPhoneNumberResponse`
  - `phoneNumber`: `string | null`

#### `sendOTPEmail`
- **Request Schema**: `OSKAuth0SendOTPCodeRequest`
  - `email`: `string`

#### `syncMfaPhoneNumberToProfile`
- **Request Schema**: `OSKAuth0SyncMfaPhoneNumberRequest`
  - `userId`: `string`

#### `verifyOwnershipOTP`
- **Request Schema**: `OSKAuth0VerifyOwnershipOTPRequest`
  - `code`: `string`
  - `email`: `string`
- **Response Schema**: `OSKAuth0VerifyOwnershipOTPResponse`
  - `verified`: `boolean`

### Firestore Triggers
No Firestore triggers are owned or defined by this capability [Confirmed].

#### country

This capability exposes two Firebase Callable HTTPS functions:

#### Callable APIs
- **`onGetCountries`**
  - **Handler Location**: `functions/src/modules/core/modules/country/index.ts` (lines 17-43) `` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountries|#1` ``
  - **Service Method**: `OSKCountryService.onGetCountries` `` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountries|#1` ``
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.
- **`onGetCountriesNoAuth`**
  - **Handler Location**: `functions/src/modules/core/modules/country/index.ts` (lines 45-56) `` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountriesNoAuth|#1` ``
  - **Service Method**: `OSKCountryService.onGetCountriesNoAuth` `` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountriesNoAuth|#1` ``
  - **Request/Response Schemas**: No `model_property` facts matched within this pack.

---

#### public_key

- **API Contracts**: There are no `api_contract` facts present in this capability's evidence pack. The controller methods appear to be invoked programmatically by other modules rather than bound directly to HTTP endpoints within this submodule.
- **Firestore Triggers**: No Firestore triggers are owned or defined by this capability.

---

#### storage

### API Contracts
- **`generateUploadSignedUrlCallable`**: Callable Cloud Function. [Confirmed] (citing `api_contract|core|functions/src/modules/core/modules/storage/index.ts|generateUploadSignedUrlCallable|#1`)

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

### Cloud Storage Triggers
- **`onFinalize`**: Triggered when a file upload is completed in GCS, invoking `OSKStorageController.processFile`. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1`)
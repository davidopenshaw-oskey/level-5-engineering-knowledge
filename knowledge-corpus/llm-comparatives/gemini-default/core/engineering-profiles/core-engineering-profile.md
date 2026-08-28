### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T17:11:15.833Z
- repoName: firebase-oskey-dev
- targetModule: core
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `core` module serves as the foundational infrastructure, utility, and access orchestration layer for the entire Oskey platform. It provides centralized Firestore document controllers (`OSKDocumentController`, `OSKDocumentAndMessageController`), structured logging (`OSKLoggingService`), Google Secret Manager integration (`OSKSecretService`), and storage delegation utilities. Crucially, it houses the platform's central access-provisioning orchestration engine (`access` submodule), which coordinates PIN generation, dual-write access ledgers, and BLE token issuance across multiple domain modules. Additionally, it integrates external identity management via Auth0 (`auth0`), handles cryptographic public key operations (`public_key`), and provides localized country configuration utilities (`country`). [Confirmed]

### 2. Architectural Position

The `core` module sits at the absolute base of the platform's application layer. It is the most heavily imported module in the repository, with confirmed inbound dependencies from 11 other modules. It owns the logical orchestration of physical access permissions (PINs, BLE tokens), platform-wide logging, secret retrieval, Auth0 identity bridging, and cryptographic public key decompression. It provides centralized CRUD operations, Pub/Sub message routing, Auth0 MFA/OTP management, GCS signed URL generation, and access ledger synchronization to the rest of the platform. [Confirmed]

### 3. Primary Responsibilities

#### _module_root

### Firestore Document Orchestration
Exposes generic CRUD, query, pagination, and transaction-based array manipulation methods (`_removeFromArrayField`, `_removeFromArrayFieldByPredicate`) for Firestore collections and collection groups. [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 34-375)

### Pub/Sub Message Ingestion & Routing
Receives raw IoT and system events via an HTTP endpoint (`processPubSubMessage`), parses them, and routes them to specialized handlers (e.g., saving device states, logging system events, and enriching/aggregating activities for users, supplier staff, and non-app users). [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` lines 36-233)

### Single-Use Quick Code Cleanup
Automatically detects when a single-use quick code is used and triggers its deletion from the user's access list. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` lines 244-327)

### Secret & Cryptographic Key Management
Interfaces with Google Secret Manager (with local file fallback) to retrieve API keys and manage private keys for Access Control Devices (ACDs). [Confirmed] (Cite `functions/src/modules/core/services/secret.service.ts` lines 33-203)

### Structured Logging
Provides a centralized logging service (`OSKLoggingService`) that formats logs into structured JSON payloads with severity levels, stack traces, and HTTP request metadata. [Confirmed] (Cite `functions/src/modules/core/services/logging.service.ts` lines 47-99)

### Image Processing & Storage
Handles image uploads, generates thumbnails using ImageMagick (`convert` command via child process), and manages Cloud Storage file deletions. [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 377-488)

---

#### access

- **Submodule**: `user_access`
  - **Import Path**: `@oskey/user/access`
  - **Used In**: `access.controller.ts`, `access_messages.model.ts`, `user_access_request_accesses.document.ts`, `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access_update.service.ts`, `access_utils.service.ts`, `access.service.ts`
- **Submodule**: `user_device`
  - **Import Path**: `@oskey/user/device`
  - **Used In**: `access_message_publisher.service.ts`, `access_update.service.ts`, `access.service.ts`
- **Submodule**: `user_pincode`
  - **Import Path**: `@oskey/user/pincode`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access.service.ts`
- **Submodule**: `user_invitation`
  - **Import Path**: `@oskey/user/invitation`, `./../../../../user/modules/user_invitation/controllers/...`
  - **Used In**: `access_pincode.service.ts`, `access.service.ts`
- **Root Module**: `user`
  - **Import Path**: `@oskey/user`
  - **Used In**: `access_pincode.service.ts`, `access_utils.service.ts`, `access.service.ts`

#### auth0

- **Token Exchange & Identity Linking**: Decodes and cryptographically verifies Auth0 ID tokens using JWKS, then resolves the identity against Firebase Auth [Confirmed] (lines 111-226). If a user with the matching email exists, it links the Auth0 `sub` to the Firebase UID; otherwise, it provisions a new Firebase user and returns a custom Firebase token [Confirmed] (lines 150-201).
- **MFA Management**: Allows enabling and disabling MFA factors (specifically SMS) for users in Auth0, and deleting existing SMS authenticators [Confirmed] (lines 517-606, 799-855).
- **Email Ownership Verification (OTP)**: Triggers passwordless email OTP dispatches via Auth0 and verifies the codes to confirm email ownership [Confirmed] (lines 357-462).
- **Phone Number Synchronization**: Retrieves confirmed MFA phone numbers from Auth0 and synchronizes them to the user's profile and metadata [Confirmed] (lines 608-642).
- **Auth0 User Management**: Supports deleting users from Auth0 and checking if an email already exists in Auth0 [Confirmed] (lines 463-490, 765-797).
- **Service Initialization**: Dynamically retrieves Auth0 credentials (domain, client ID, client secret, management domain) from `OSKSecretService` and initializes the `JwksClient` [Confirmed] (lines 52-86).

#### country

- **Authenticated Country Retrieval**: Exposes an authenticated endpoint `onGetCountries` to retrieve country configurations. [Confirmed] The service validates that the calling user is authenticated, verifies their identity against Firebase Auth, and checks their existence in the database before returning the data. [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountries|#1` ``, `` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|auth().getUser|onGetCountries|userId|#1` ``)
- **Unauthenticated Country Retrieval**: Exposes an unauthenticated endpoint `onGetCountriesNoAuth` to allow client applications to fetch country configurations prior to user login (e.g., during onboarding or registration). [Confirmed] (`` `api_contract|core|functions/src/modules/core/modules/country/index.ts|onGetCountriesNoAuth|#1` ``)
- **App Check Enforcement**: Enforces Firebase App Check on both callable endpoints to prevent unauthorized API abuse, bypassing it only when running in a local emulator environment. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``)
- **Error Logging**: Logs structured error messages for unauthenticated access attempts, missing database user profiles, and App Check validation failures. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Unauthenticated: You must be authenticated to use onGetCountries()'|#1` ``, `` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Internal: No user in database for onGetCountries()'|#1` ``)

---

#### public_key

The capability is structured around the `OSKPublicKeysController` class, which implements the core business logic for public key operations:

- **Public Key Addition and Decompression (`addPublicKey`)**:
  - Validates incoming public keys using Node's native `crypto` library `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|crypto.createPublicKey|addPublicKey|publicKey|#1` ``.
  - Decompresses elliptic curve public keys represented as JSON Web Keys (JWK) by extracting and concatenating the `x` and `y` base64-encoded coordinates `` `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (lines 27-29)``.
  - Logs errors if the public key is invalid or cannot be decompressed `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|this.logger.logError|addPublicKey|'Invalid argument: Public key is not valid!',{ publicKey }|#1` ``.
  - Writes or updates the public key document in Firestore, supporting both initial creation (`set`) and incremental updates (`update`) `` `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (lines 50, 62)``.
- **Public Key Deletion (`deletePublicKey`)**:
  - Removes a specific public key identified by its `keyId` from a Firestore document and updates the document state `` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|deletePublicKey|#1` ``.

---

#### storage

- **Delegated File Upload Signed URL Generation**: Generates secure, short-lived GCS signed URLs allowing clients to upload files directly to Google Cloud Storage, offloading bandwidth from the application compute layer. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|generateUploadSignedUrlCallable|#1`)
- **File Format and Content Type Validation**: Restricts uploads to allowed image formats (`image/png`, `image/jpeg`, `image/gif`) and validates file extensions. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|['image/png', 'image/jpeg', 'image/gif'].includes|generateUploadSignedUrlCallable|request.contentType|#1` and `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|contentType|#1`)
- **Storage Object Finalization Processing**: Listens to GCS object finalization events to update file metadata (such as content type) and execute registered post-upload triggers. [Confirmed] (citing `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1` and `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|processFile|#1`)
- **Trigger Execution**: Executes registered triggers matching the uploaded file name pattern once the file is finalized in GCS. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|registeredTrigger.exec|processFile|object.bucket,object.name,contentType|#1`)
- **Security and Permission Enforcement**: Enforces user authentication and checks for organization-level edit permissions (`v1.org.edit`) before generating signed upload URLs. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|generateUploadSignedUrlCallable|orgUser.roles,[                         'v1.org.edit',                     ]|#1`)

### 4. Public Interfaces

#### _module_root

### Controllers
- `OSKDocumentController` (`functions/src/modules/core/controllers/document.controller.ts`): Base controller for Firestore document and Cloud Storage image operations. [Confirmed]
- `OSKMessageController` (`functions/src/modules/core/controllers/message.controller.ts`): Base controller for Google Cloud Pub/Sub message publishing. [Confirmed]
- `OSKDocumentAndMessageController` (`functions/src/modules/core/controllers/document_and_message.controller.ts`): Unified controller exposing combined document and message operations. [Confirmed]

### Services
- `OSKLoggingService` (`functions/src/modules/core/services/logging.service.ts`): Centralized logging service. [Confirmed]
- `OSKSecretService` (`functions/src/modules/core/services/secret.service.ts`): Centralized secret and key management service. [Confirmed]
- `PubSubMessageProcessor` (`functions/src/modules/core/services/pub_sub_receiver.service.ts`): Service that processes and routes incoming Pub/Sub messages. [Confirmed]

### Entry Points & Triggers
- `getHttpsFunctionTriggers` (`functions/src/modules/core/index.ts` line 73): Exposes the HTTP endpoint for Pub/Sub message processing. [Confirmed]
- `getStorageTriggers` (`functions/src/modules/core/index.ts` line 54): Exposes Cloud Storage triggers. [Confirmed]
- `getCallableFunctionTriggers` (`functions/src/modules/core/index.ts` line 64): Aggregates callable triggers from `access`, `country`, `auth0`, and `storage` submodules. [Confirmed]

---

#### access

- **Root Module**: `supplier`
  - **Import Path**: `@oskey/supplier`
  - **Used In**: `access_message_publisher.service.ts`, `access_pincode.service.ts`, `access.service.ts`

#### auth0

- **OSKAuth0Service** (Class): The primary service containing the business logic for Auth0 integration [Confirmed] `` `source_class|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service` ``.
- **getCallableFunctionTriggers** (Function): The entry point exposing the callable Cloud Functions for the capability [Confirmed] `` `function_declaration|core|functions/src/modules/core/modules/auth0/index.ts|getCallableFunctionTriggers|#1` ``.

#### country

The capability exposes the following entry points and service classes:
- **`getCallableFunctionTriggers`**: The main entry point in `functions/src/modules/core/modules/country/index.ts` (lines 9-15) which exports the callable HTTPS triggers. [Confirmed] (`` `function_declaration|core|functions/src/modules/core/modules/country/index.ts|getCallableFunctionTriggers|#1` ``)
- **`OSKCountryService`**: The core service class handling the business logic for country retrieval, located in `functions/src/modules/core/modules/country/services/country.service.ts` (lines 14-57). [Confirmed] (`` `source_class|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService` ``)

---

#### public_key

This capability exposes the following controller and models as its public entry points:

- **Controllers**:
  - `OSKPublicKeysController`: Located in `` `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (line 14) ``. Exposes `addPublicKey` and `deletePublicKey` methods.
- **Exported Symbols**:
  - The capability exports its controller and models via `` `functions/src/modules/core/modules/public_key/index.ts` (lines 6-10) ``:
    - `OSKPublicKeysController`
    - `OSKPublicKeysDocument` (Document model)
    - `OSKPublicKeyAddRequest` (Request model)
    - `OSKPublicKeyDeleteRequest` (Request model)
    - `OSKPublicKey` (Shared model)

---

#### storage

- **`OSKStorageController`**: Manages GCS object triggers, content type resolution, and post-upload trigger execution. [Confirmed] (citing `functions/src/modules/core/modules/storage/controllers/storage.controller.ts` (lines 15-57))
- **`OSKStorageService`**: Exposes the callable function for generating signed URLs and handles GCS finalization events. [Confirmed] (citing `functions/src/modules/core/modules/storage/services/storage.service.ts` (lines 22-133))
- **`getCallableFunctionTriggers`**: Entry point that exports the callable Cloud Function `generateUploadSignedUrlCallable` with App Check enforcement. [Confirmed] (citing `functions/src/modules/core/modules/storage/index.ts` (lines 13-18))

### 5. Internal Structure

*Coupling Note:* Sibling submodule coupling within the `core` module is highly centralized around the `_module_root` submodule, which acts as the primary exporter of shared utilities (logging, document controllers, secret services). 
- `_module_root` has outbound dependencies to the `access`, `auth0`, `country`, and `storage` submodules [Confirmed].
- Conversely, `access`, `auth0`, `country`, `public_key`, and `storage` all maintain inbound dependencies back to `_module_root` to consume core services like `OSKLoggingService`, `OSKSecretService`, and base controllers [Confirmed].
- The `access` submodule operates as a sibling to `_module_root`, importing `OSKDocumentAndMessageController` and `OSKLoggingService` [Confirmed].
- The `public_key` submodule has an outbound dependency to `_module_root` for logging and document models, but has no inbound sibling dependencies within `core` [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Ownership Conclusion:* The `core` module does not "own" any domain-specific business collections in isolation. Instead, it acts as a highly reusable, generic persistence and orchestration layer.
- `OSKDocumentController` and `OSKDocumentAndMessageController` (defined in `_module_root`) are called by 9 and 4 other modules respectively to perform CRUD operations on arbitrary Firestore paths passed dynamically [Confirmed].
- The `access` submodule contains `OSKPincodeService` and `OSKAccessService`, which are called by 6 other modules (`admin`, `building`, `organization`, `supplier`, `unit_management`, `user`) to manage access ledgers and PIN codes [Confirmed].
- The `public_key` submodule manages public keys dynamically across paths like `/accessControlDevices/{id}/publicKeys` and `/users/{id}/devices/{id}/publicKeys` [Confirmed].
- Therefore, it is **Inferred** that `core` owns the *logic* and *schemas* of the platform's access control records (PINs, accesses, public keys), but the actual data documents are structurally nested within or associated with the domain modules (`building`, `user`, `access_control_device`) that invoke these services.

**Per-capability evidence:**

#### _module_root

### Firestore Paths
This capability acts as a generic controller layer and does not "own" specific business collections, but its methods directly read, write, and delete documents across arbitrary Firestore paths passed dynamically (e.g., `collection` parameters). [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 34-289)

### Local File System Paths
- `OSKSecretService.secretsFilePath`: Used as a fallback local secrets file when running in local/fallback mode. [Confirmed] (Cite `functions/src/modules/core/services/secret.service.ts` line 132)
- `os.tmpdir()`: Used to store temporary images during thumbnail generation. [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 410-419)

---

#### access

- **Root Module**: `access_control_device`
  - **Import Path**: `@oskey/access_control_device`
  - **Used In**: `access_update.service.ts`

---

### Intra-Module Coupling (Sibling Submodules) [Confirmed]

- `@oskey/core/controllers/document_and_message`: Imported by `access.controller.ts` to inherit base document and message controller capabilities.
- `@oskey/core/logger`: Imported by services to log debug, info, warning, and error messages.
- `@oskey/core`: Imported by controllers and services for shared core utilities.

---

#### auth0

This capability does not directly write to or own any Firestore collections based on the provided evidence pack [Confirmed]. It interacts with user profiles via the `OSKUserController` dependency [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 154, 176)``.

#### country

This capability does not directly own or write to any Firestore collections based on the provided evidence. [Confirmed] It queries user data from the `user` module to validate active sessions but does not perform any database mutations. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``)

---

#### public_key

This capability performs read and write operations on dynamic Firestore paths determined by the calling context (e.g., passing `collection` and `documentId` parameters to the controller):

- **Dynamic Collections (e.g., `/accessControlDevices/{id}/publicKeys` or `/users/{id}/devices/{id}/publicKeys`)**:
  - **Read**: Fetches existing public key documents `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).get|addPublicKey||#1` ``.
  - **Write (Create/Update)**: Writes new public key documents or updates existing ones `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``.
  - **Delete**: Updates documents to remove specific keys `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).update|deletePublicKey|updatedPublicKey|#1` ``.

---

#### storage

- **Firestore Paths**: This capability does not directly own or write to any Firestore collections based on the provided evidence. [Confirmed]
- **Firestore Reads**: It reads organization user roles from `/organizations/{id}/users/{userId}` via the organization user controller to perform permission checks. [Inferred] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKOrganizationUserController.default.get|generateUploadSignedUrlCallable|request.organizationId,adminUserId|#1`)

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Cross-Cutting Risk Callouts:*
- **Asymmetric Authorization Enforcement:** There is a stark asymmetry in how security is enforced across `core` submodules. While the `storage` submodule explicitly checks a specific RBAC permission string (`v1.org.edit`) in code via `OSKConsolidatedRolesController.checkUserPermissions` [Confirmed], other highly sensitive submodules like `access` (which creates PIN codes and access rights) and `public_key` (which manages cryptographic keys) do not reference any RBAC strings in their code [Confirmed]. Instead, they delegate authorization entirely to custom decorators (`OSKVerifyAccessValid`) or Firestore Security Rules. This creates a fragmented security model where some administrative operations are guarded in the application layer, while others rely solely on database-level rules [Inferred].
- **Unattributed Security-Relevant Signals:**
  - The `country` submodule's `onGetCountries` endpoint raises 1 unauthenticated error (`'Unauthenticated: You must be authenticated to use onGetCountries()'`) with no RBAC string backing it (purely session-based check) [Confirmed].
  - The `auth0` submodule enforces 6 parameter validation checks via `OSKSecurityChecks.checkParameters` and 2 email format validations via `OSKSecurityChecks.validateEmailFormat` with no RBAC strings [Confirmed].

**Per-capability evidence:**

#### _module_root

- `getHttpsFunctionTriggers` enforces App Check in non-emulator environments: `{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }`. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 74)
- No specific RBAC permission strings (e.g., `v1.org.*` or `v1.admin.*`) are directly referenced or checked in this capability's code, as it acts as a low-level utility layer. [Confirmed]

---

#### access

### Security Decorators [Confirmed]
- The callable function `onCreatePincodeAnonymousAccess` is protected by two security decorators:
  - `OSKUserSecurityChecks`: Enforces user-level authentication and identity verification [`` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserSecurityChecks|onCreatePincodeAnonymousAccess||#1` ``].
  - `OSKVerifyAccessValid`: Verifies that the requesting user has valid permissions to create access for the target building and unit [`` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKVerifyAccessValid|onCreatePincodeAnonymousAccess||#1` ``].

### App Check Enforcement [Confirmed]
- Callable triggers are configured with Firebase App Check to prevent unauthorized client requests:
  - `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` [`` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``].

### RBAC Mismatches [Inferred]
- No explicit RBAC permission strings (e.g., `v1.org.residents.create`) are directly referenced or checked in the codebase facts of this capability. Security is delegated to the `OSKVerifyAccessValid` decorator and Firestore Security Rules.

---

#### auth0

- The callable functions `enableMfa` and `disableMfa` are decorated with `OSKUserSecurityChecks` to enforce user-level security constraints [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 517, 555)``.
- Parameter validation is enforced using `OSKSecurityChecks.checkParameters` across multiple methods [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 114, 267, 403, 522, 560, 611)``.
- Email format validation is enforced using `OSKSecurityChecks.validateEmailFormat` [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 358, 402)``.
- No explicit RBAC permission strings from the `rbac-roles.json` document are referenced in this capability's evidence [Confirmed].

#### country

- **App Check Enforcement**: Both callable functions enforce App Check validation via `functionBuilder.runWith({ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR })`. [Confirmed] (`` `functions/src/modules/core/modules/country/index.ts` (lines 9-15) ``)
- **User Authentication**: The `onGetCountries` endpoint requires a valid Firebase Auth context. [Confirmed] If `context.auth` is missing, it throws an unauthenticated error. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService.logger.logError|onGetCountries|'Unauthenticated: You must be authenticated to use onGetCountries()'|#1` ``)
- **User Existence Check**: The `onGetCountries` endpoint verifies that the authenticated user exists in the database using `OSKUserController.default.get(userId)`. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``)
- **RBAC Mismatches**: No specific RBAC permission strings (e.g., `v1.org.*` or `v1.admin.*`) are referenced or checked within this capability's evidence. [Confirmed]

---

#### public_key

No explicit RBAC permission strings (e.g., `v1.admin...`) are referenced directly within the source code of this capability's evidence pack [Confirmed]. 

However, cross-referencing the system's `firestore.rules.txt` document reveals that access to the underlying public key collections is strictly governed at the database layer:
- `/accessControlDevices/{deviceId}/publicKeys/{keyType}` allows reads for any valid user, but blocks all writes via rules (`allow write: if false;`) [Confirmed].
- `/users/{userId}/devices/{deviceId}/publicKeys/{keyType}` allows reads, creations, and deletions only for the authenticated user matching `userId` (`isAuthenticatedUser(userId)`) [Confirmed].

---

#### storage

- **Permission Strings**:
  - `v1.org.edit`: Checked during signed URL generation to ensure the user has permission to edit organization assets. [Confirmed] (citing `permission_candidate|core|functions/src/modules/core/modules/storage/services/storage.service.ts|v1.org.edit|#1`)
- **RBAC Cross-Check**: The permission `v1.org.edit` is defined in the RBAC roles document as "Allows to edit organization information", which matches its usage here for authorizing file uploads. [Confirmed]
- **Security Decorators**: `OSKUserSecurityChecks` is applied to `generateUploadSignedUrlCallable` with `{ checkUserIdMatch: false }` to enforce basic authentication checks. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKUserSecurityChecks|generateUploadSignedUrlCallable|{ checkUserIdMatch: false }|#1`)

### 10. Cross-Module Relationships

*Outbound Dependencies:*
- **access_control_device:** `core` imports models and services (e.g., `OSKAccessControlDevice`, `OSKActivityEnrichmentService`) to enrich activity logs and manage device states [Confirmed].
- **building:** `core` imports building activity models, accesses controllers, and non-app user pincode controllers to coordinate physical access and log events [Confirmed].
- **organization:** `core` calls `OSKOrganizationUserAccessService` and `OSKOrganizationUserController` to verify roles and set up organization-scoped access [Confirmed].
- **settings:** `core` calls `OSKConsolidatedRolesController` to check user permissions during file uploads [Confirmed].
- **supplier:** `core` calls `OSKSupplierStaffPincodeController`, `OSKSupplierStaffPincodeService`, and `OSKSupplierStaffAccessService` to manage supplier-specific PINs and accesses [Confirmed].
- **user:** `core` calls `OSKUserAccessesController`, `OSKUserDeviceController`, and `OSKUserPincodeController` to manage resident accesses, devices, and PINs [Confirmed].

*Inbound Dependencies:*
- `core` is the most heavily imported module in the repository, with confirmed inbound dependencies from 11 modules: `access_control_device`, `admin`, `apps`, `building`, `call`, `organization`, `settings`, `supplier`, `tasks`, `unit_management`, and `user` [Confirmed].
- These modules primarily call `OSKLoggingService` for structured logging, `OSKDocumentController` for generic Firestore CRUD operations, and `OSKAccessService`/`OSKPincodeService` to orchestrate physical door unlocking and credential provisioning [Confirmed].

### 11. External Hooks

#### _module_root

### Pub/Sub Topics
Publishes messages to dynamically provided topic names. [Confirmed] (Cite `functions/src/modules/core/controllers/message.controller.ts` line 31)

### Google Secret Manager
Integrates with Google Secret Manager API to retrieve and create secrets. [Confirmed] (Cite `functions/src/modules/core/services/secret.service.ts` lines 41-174)

### Environment Variables
- `OSK_FIREBASE_EMULATOR`: Used to conditionally enforce App Check. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 74)
- `GCLOUD_PROJECT`: Used to construct Secret Manager resource paths. [Confirmed] (Cite `functions/src/modules/core/services/secret.service.ts` line 41)

### External Binaries
Spawns `convert` (ImageMagick) as a child process to resize images and generate thumbnails. [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` line 431)

---

#### access

The capability interacts with the following external boundaries:

### Pub/Sub Topic Publishing [Confirmed]
- **Topic Resolution**: Dynamically resolved via `this.getTopicName()` [`` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|this.getTopicName|publishMessage||#1` ``].
- **Publishing Call**: Publishes serialized access payloads to the resolved topic mapped to a specific `accessControlDeviceId` [`` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController.default._publishMessage|publishMessage|topicName,accessControlDeviceId,payload|#1` ``].

### Environment Variables [Confirmed]
- `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass Firebase App Check during local emulator testing [`` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``].

---

#### auth0

### Confirmed Integrations
- **Auth0 Management API**: Interacted with via HTTP requests using `axios` to perform administrative tasks such as deleting users, managing authenticators, updating metadata, and retrieving user details [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 239, 276, 322, 419, 473, 498, 576, 588, 647, 662, 678, 709, 748, 775, 810, 820, 839)``.
- **Auth0 Authentication API**: Interacted with for token verification and passwordless OTP dispatches [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 127, 373)``.
- **JWKS Endpoint**: Fetches cryptographic keys from `https://${OSKAuth0Service.AUTH0_DOMAIN}/.well-known/jwks.json` to verify JWT signatures [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 54, 96)``.
- **GCP Secret Manager**: Fetches secrets via `OSKSecretService` for `Auth0Domain`, `Auth0ManagementDomain`, `Auth0M2MClientId`, and `Auth0M2MClientSecret` [Confirmed] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 55-60)``.

#### country

- **Environment Variables**:
  - **`OSK_FIREBASE_EMULATOR`**: Checked to conditionally bypass App Check enforcement during local development. [Confirmed] (`` `functions/src/modules/core/modules/country/index.ts` (line 10) ``)

---

#### public_key

There are no external hooks, Pub/Sub topics, environment variables, or external storage paths defined or referenced within this capability's evidence pack [Confirmed].

---

#### storage

- **Google Cloud Storage (GCS) Integration**: Confirmed integration. Uses `firebase-admin` storage bucket to generate signed URLs and set metadata. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|bucket.file(filePath).getSignedUrl|generateUploadSignedUrlCallable|options|#1` and `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file(object.name).setMetadata|processFile|{ contentType: contentType }|#1`)
- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local emulation. [Confirmed] (citing `call_expression|core|functions/src/modules/core/modules/storage/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`)

### 12. Architectural Observations

- **Centralized Orchestration Pattern:** The `core` module (specifically the `access` submodule) acts as the central orchestration engine for the entire platform's access control domain. It coordinates specialized services across `building`, `supplier`, and `user` modules without owning the underlying domain data. This is evidenced by method-level calls fanning out to `OSKNonAppUserPincodeController`, `OSKSupplierStaffPincodeController`, and `OSKUserPincodeController` to synchronize access states [Confirmed].
- **Layering and Low-Level Abstraction:** `core` provides a strict layering boundary. By exposing `OSKDocumentController` and `OSKDocumentAndMessageController`, it abstracts Firestore SDK interactions away from domain modules. This high degree of inbound coupling (11 modules) makes `core` the foundational "system of record" utility, but also introduces a single point of failure for database operations [Confirmed].
- **Identity and Secret Delegation:** Consistent with the platform's security architecture, `core` delegates identity verification to Auth0 (`auth0` submodule) and secret storage to GCP Secret Manager (`OSKSecretService`), ensuring that no sensitive credentials or private keys are persisted directly within application code [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

*Cross-Cutting Risks:*
- **Asymmetric Authorization Enforcement:** The inconsistency in security enforcement between submodules (e.g., `storage` checking `v1.org.edit` in code, while `access` relies on decorators and database-level rules) increases the risk of authorization bypass if Firestore rules are modified independently of application code [Inferred].
- **High Inbound Coupling / Single Point of Failure:** The `core` module is imported by 11 out of 12 modules in the repository. Any breaking change in `OSKDocumentController`, `OSKLoggingService`, or `OSKAccessService` will cascade across the entire platform, halting both administrative workflows and physical door-unlocking synchronization [Confirmed].
- **Dynamic Firestore Path Risk:** `OSKDocumentController` and `OSKPublicKeysController` execute writes and deletes on dynamic Firestore paths passed as parameters. While Firestore Security Rules restrict some of these paths, the application layer lacks a centralized whitelist of allowed collections, creating a risk of accidental or malicious writes to unauthorized paths if an internal service is compromised [Inferred].

**Per-capability open questions:**

#### _module_root

- What is the exact structure of the Pub/Sub messages received by `processPubSubMessage`? The schema is not fully defined in the model properties of this pack. [Confirmed]
- How are the aggregated callable triggers from other submodules (`access`, `country`, `auth0`, `storage`) structured, and what permissions do they enforce? [Confirmed]

#### access

- **Pub/Sub Topic Naming Convention**: The exact naming convention returned by `this.getTopicName()` is not defined within this capability's evidence pack.
- **BLE Token Cryptography**: The exact cryptographic algorithm used to sign and decompress BLE tokens (e.g., `publicSigningKeys`, `publicEncryptionKeys`) is handled by the `user_device` submodule and is not visible in this pack.
- **SIP/WebRTC Call Routing Integration**: While the architecture overview mentions STUN/TURN signaling for intercom calls, the `access` capability only manages the static access permissions and does not contain call-routing execution logic.

#### auth0

- Are there any other MFA factors planned or supported besides SMS (e.g., TOTP, Push)? The current implementation explicitly filters for `sms` type authenticators [Inferred] `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 331, 814)``.

#### country

- **Data Source**: Where is the country data actually stored or sourced from? [Inferred] The evidence pack does not show any Firestore reads, local JSON imports, or external HTTP requests containing country lists.
- **Data Schema**: What is the exact structure of the country objects returned by `onGetCountries` and `onGetCountriesNoAuth`? [Inferred] No model properties or TypeScript interfaces defining the country payload are present in the evidence.

#### public_key

- **Invocation Context**: Since there are no direct HTTP endpoints or Firestore triggers defined in this submodule, how is `OSKPublicKeysController` instantiated and invoked? Is it called as an internal service by the `access_control_device` and `user` modules when registering devices or mobile keys?
- **Decompression Algorithm**: The decompression logic assumes elliptic curve coordinates (`x` and `y`). Are there constraints on the specific curve supported (e.g., secp256r1 or ed25519), or does the `crypto` library handle this transparently?

#### storage

- **Registered Triggers**: What specific post-upload triggers are registered in `OSKStorageController` and how are they populated? [Unknown]
- **Supported File Types**: Are there other upload types or file formats supported by this capability besides standard images (`image/png`, `image/jpeg`, `image/gif`)? [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
### 0. Generation Metadata

- **runId**: 20260829_081559-00e1d9fd
- **generatedAt**: 2026-08-29T13:34:30.012Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

### 1. Executive Summary

The `core` module serves as the foundational backbone of the Oskey platform, providing the essential infrastructure, base controllers, and centralized orchestration services required by all other domain modules (**Confirmed**). 

At its lowest layer, it provides generic Firestore document CRUD operations (`OSKDocumentController`), structured logging (`OSKLoggingService`), Google Secret Manager integration (`OSKSecretService`), and a centralized Pub/Sub event ingestion pipeline (`pub_sub_receiver.service`) that processes and routes raw edge hardware/IoT events to their respective domain handlers (**Confirmed**). 

Crucially, the module hosts the platform's central **Access Orchestration** engine (`OSKAccessService`, `OSKPincodeService`, `OSKAccessUpdateService`), which coordinates user access rights, alphanumeric PIN code generation, and SecureBLE device token provisioning across buildings, units, and doors (**Confirmed**). It also manages external identity provider integration with Auth0 (`OSKAuth0Service`), cryptographic public key management (`OSKPublicKeysController`), supported country metadata (`OSKCountryService`), and delegated file upload signed URL generation (`OSKStorageService`) (**Confirmed**).

### 2. Architectural Position

The `core` module sits at the lowest layer of the platform's software architecture, acting as a shared utility and orchestration layer (**Confirmed**). It is imported by every other module in the repository (11 inbound modules: `access_control_device`, `admin`, `apps`, `building`, `call`, `organization`, `settings`, `supplier`, `tasks`, `unit_management`, `user`) (**Confirmed**). 

Rather than allowing individual domain modules to write access rules, PIN codes, or cryptographic keys directly to Firestore, the architecture routes these operations through `core`'s centralized services to ensure consistency, validation, and asynchronous synchronization to edge Access Control Devices (ACDs) via Pub/Sub messaging (**Confirmed**). It owns the logical concepts of **Access Rights**, **PIN Codes**, **Cryptographic Keys**, and **IoT Ingress Event Routing** (**Confirmed**).

### 3. Primary Responsibilities

#### _module_root

### Firestore Document Operations
- **Confirmed**: Provides a base controller `OSKDocumentController` that encapsulates standard Firestore operations, including document retrieval (`_get`), creation (`_create`), setting (`_set`), updating (`_update`), deletion (`_delete`), collection-wide deletion (`_deleteAll`), collection group queries (`_queryCollectionGroup`), and paginated queries (`_queryWithPagination`) `` `source_class|core|functions/src/modules/core/controllers/document.controller.ts|OSKDocumentController` ``.
- **Confirmed**: Implements transactional array field modification utilities (`_removeFromArrayField` and `_removeFromArrayFieldByPredicate`) to safely manage nested arrays within Firestore documents `` `functions/src/modules/core/controllers/document.controller.ts` (lines 290-375) ``.
- **Confirmed**: Handles Cloud Storage image uploads (`_uploadImage`) with automatic thumbnail generation (resizing to predefined sizes using `convert` via child process spawn) and image deletion (`_deleteImage`) `` `functions/src/modules/core/controllers/document.controller.ts` (lines 377-488) ``.

### Pub/Sub Message Ingestion & Routing
- **Confirmed**: Exposes a centralized HTTP endpoint (`processPubSubMessage`) that acts as the entry point for GCP Pub/Sub push subscriptions `` `api_contract|core|functions/src/modules/core/index.ts|processPubSubMessage|#1` ``.
- **Confirmed**: Parses and routes incoming Pub/Sub messages based on their data type (e.g., `state`, `systemLog`, `accessCommand`, and `activities`) to their respective domain controllers `` `pubsub_event_route|core|functions/src/modules/core/index.ts|processPubSubMessage|activities#2` ``.
- **Confirmed**: Enriches raw IoT activity payloads using `OSKActivityEnrichmentService` and fans them out to building, user, supplier staff, and non-app user activity/aggregate services `` `functions/src/modules/core/services/pub_sub_receiver.service.ts` (lines 95-176) ``.

### Single-Use Quick Code Cleanup
- **Confirmed**: Automatically cleans up single-use quick codes (pincodes) after they are used. The `deleteQuickCodeSingleUse` method checks the user's access list, verifies if the used access is a single-use quick code, and deletes the access record via `OSKAccessService` if validated `` `service_method|core|functions/src/modules/core/services/pub_sub_receiver.service.ts|PubSubMessageProcessor|deleteQuickCodeSingleUse|#1` ``.

### Secret Management
- **Confirmed**: Provides `OSKSecretService` to manage API keys and private keys. It retrieves secrets from Google Secret Manager in production and falls back to a local JSON file (`secretsFilePath`) during development or testing `` `source_class|core|functions/src/modules/core/services/secret.service.ts|OSKSecretService` ``.

### Structured Logging
- **Confirmed**: Implements `OSKLoggingService` to provide structured, severity-based logging (DEBUG, INFO, WARNING, ERROR, CRITICAL) with automatic stack trace extraction and JSON payload formatting for Google Cloud Logging compatibility `` `source_class|core|functions/src/modules/core/services/logging.service.ts|OSKLoggingService` ``.

---

#### access

### Access Orchestration & Creation
- Coordinates the creation of user access profiles (`createAccess`) for standard users, non-app users, and supplier staff. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService|createAccess|#1` ``.
- Evaluates whether a newly created access is the "main access" for a user and provisions BLE device tokens accordingly. **Confirmed** `` `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessUtilsService.checkIsMainAccess|createAccess|#1` ``.

### PIN Code Generation & Validation
- Generates secure, unique alphanumeric PIN codes based on a standard layout schema (incorporating digits 0-9, letters A-C, and symbols). **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts|OSKPincodeGenerationService|generatePincode|#1` ``.
- Validates generated PIN codes to ensure they do not contain repetitive characters (e.g., more than 3 of the same character) and are unique within the target building's active and trashed PIN collections. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts|OSKPincodeGenerationService|_isPincodeUnique|#1` ``.

### Asynchronous Edge Synchronization (Pub/Sub)
- Publishes access state changes (Insert, Update, Delete, Recreate) to edge hardware (ACDs) via Pub/Sub topics. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageToAllACDs|#1` ``.
- Formulates payload structures containing serialized access rights, validity windows, and device tokens optimized for offline edge verification. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|setupPubsubAccess|#1` ``.

### Access Updates & Propagation
- Propagates changes in building info, door info, user info, or device assignments to existing user accesses and triggers delta updates to edge devices. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKAccessUpdateService|updateUserAccessDevices|#1` ``.

### Anonymous Access Management
- Handles creation and deletion of temporary, anonymous PIN-based accesses (e.g., for quick codes or temporary guests). **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKPincodeService|onCreatePincodeAnonymousAccess|#1` ``.

### Access Right Parsing & Date Conversion
- Converts access rights (Permanent, Guest, One-Time, Recurrent) between Date objects, strings, and Firebase Timestamps for token payloads and database storage. **Confirmed** `` `service_method|core|functions/src/modules/core/modules/access/services/access_utils_dates.service.ts|OSKAccessUtilsDatesService|convertAccessRightsToFirebaseTimestamp|#1` ``.

---

#### auth0

### Token Exchange & User Migration
- **Auth0 Token Exchange**: Validates incoming Auth0 JSON Web Tokens (JWTs) using JWKS public keys and exchanges them for Firebase custom tokens `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 111-226) ``.
- **Identity Migration & Linking**: Resolves Auth0 logins against existing Firebase users. If a user is found by email but lacks an Auth0 sub link, it links the Auth0 sub to the existing Firebase UID; if no user exists, it provisions a new Firebase Auth user `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 147-204) ``.

### Multi-Factor Authentication (MFA) Management
- **Enable MFA**: Enrolls and enables MFA for a user via the Auth0 Management API `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 517-554) ``.
- **Disable MFA**: Deletes all registered SMS authenticators and disables MFA flags for a user `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 555-606) ``.
- **MFA Phone Number Retrieval & Sync**: Retrieves confirmed SMS MFA phone numbers from Auth0 and synchronizes them to the user's profile metadata `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 308-356, 608-642) ``.

### Passwordless OTP Verification
- **Send OTP Email**: Triggers passwordless email OTP dispatch via Auth0 `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 357-398) ``.
- **Verify Ownership OTP**: Verifies the OTP code sent to an email address to confirm ownership `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 399-462) ``.

### User Profile Synchronization & Deletion
- **User Phone & Email Updates**: Updates user phone numbers and email addresses directly in Auth0 `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 731-763, 799-855) ``.
- **Auth0 User Deletion**: Deletes user accounts from Auth0 during offboarding or account deletion workflows `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 463-490) ``.

---

#### country

- **Authenticated Country Retrieval**: Exposes an API endpoint (`onGetCountries`) that requires user authentication, verifies the user's existence in the database, and logs errors if preconditions are not met [Confirmed: `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountries|#1`].
- **Unauthenticated Country Retrieval**: Exposes an unauthenticated API endpoint (`onGetCountriesNoAuth`) allowing public access to the country list [Confirmed: `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountriesNoAuth|#1`].
- **App Check Security Enforcement**: Enforces Firebase App Check on both endpoints to prevent unauthorized clients from calling the functions, with a bypass configured for emulator environments [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].
- **User Validation**: Integrates with the `user` module to verify that the authenticated user requesting the country list exists within the system [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1`].

---

#### public_key

### Public Key Validation and Decompression
- **Validation**: The capability validates incoming public keys using Node's native `crypto` library, exporting them to JSON Web Key (JWK) format to verify structural integrity `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|crypto.createPublicKey(publicKey).export|addPublicKey|{ format: 'jwk' }|#1` ``.
- **Decompression**: It decompresses elliptic curve public keys by extracting and concatenating the base64-encoded `x` and `y` coordinates from the JWK representation `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|Buffer.concat([                     Buffer.from(jwk.x, 'base64'),                     Buffer.from(jwk.y, 'base64'),                 ]).toString|addPublicKey|'base64'|#1` ``.
- **Error Logging**: If validation or decompression fails, it logs errors using the core logging service `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|this.logger.logError|addPublicKey|'Invalid argument: Public key cannot be decompressed!',{ jwk }|#1` ``.

**Confidence Tag**: **Confirmed**

### Public Key Storage and Lifecycle Management
- **Addition/Update**: When adding a public key, the capability checks if a public keys document already exists at the target Firestore path. If it exists, it updates the document with the new key; otherwise, it creates a new document `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).get|addPublicKey||#1` ``. It writes the public key, its decompressed form, and the creation timestamp `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``.
- **Deletion**: It removes a specific public key from a document by updating the document's key map and writing the changes back to Firestore `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).update|deletePublicKey|updatedPublicKey|#1` ``.

**Confidence Tag**: **Confirmed**

#### storage

- **Generating Upload Signed URLs**: Generates secure, short-lived signed URLs for direct client uploads to Cloud Storage via `OSKStorageService.generateUploadSignedUrlCallable`. [Confirmed] `` `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|generateUploadSignedUrlCallable|#1` ``. It validates the request's content type against an allowed list (`image/png`, `image/jpeg`, `image/gif`) `` `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|['image/png', 'image/jpeg', 'image/gif'].includes|generateUploadSignedUrlCallable|request.contentType|#1` ``.
- **Asynchronous File Processing / Triggers**: Listens to Cloud Storage finalize events via `OSKStorageService.onFinalize` and delegates processing to `OSKStorageController.processFile`. [Confirmed] `` `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1` ``.
- **Content Type Detection**: Determines the MIME type based on file extensions via `OSKStorageController.contentType`. [Confirmed] `` `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|contentType|#1` ``.
- **Trigger Registration**: Registers custom execution hooks for specific file paths (using regex) via `OSKStorageController.registerTriggers`. [Confirmed] `` `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|registerTriggers|#1` ``.

### 4. Public Interfaces

#### _module_root

This capability exposes the following public controllers and service entry points:

### `OSKDocumentAndMessageController`
- **Confirmed**: A unified controller that combines Firestore document operations and Pub/Sub message publishing, exposing them as public methods `` `source_class|core|functions/src/modules/core/controllers/document_and_message.controller.ts|OSKDocumentAndMessageController` ``.

### `OSKDocumentController`
- **Confirmed**: The base controller for Firestore document CRUD, pagination, array manipulation, and image storage management `` `source_class|core|functions/src/modules/core/controllers/document.controller.ts|OSKDocumentController` ``.

### `OSKMessageController`
- **Confirmed**: The base controller for publishing messages to GCP Pub/Sub topics `` `source_class|core|functions/src/modules/core/controllers/message.controller.ts|OSKMessageController` ``.

### `PubSubMessageProcessor`
- **Confirmed**: The service class responsible for parsing, validating, and routing incoming Pub/Sub messages, as well as executing post-activity cleanup tasks like single-use code deletion `` `source_class|core|functions/src/modules/core/services/pub_sub_receiver.service.ts|PubSubMessageProcessor` ``.

### `OSKSecretService`
- **Confirmed**: The service class responsible for retrieving API keys and managing private keys for access control devices `` `source_class|core|functions/src/modules/core/services/secret.service.ts|OSKSecretService` ``.

### `OSKLoggingService`
- **Confirmed**: The centralized logging service used across the platform `` `source_class|core|functions/src/modules/core/services/logging.service.ts|OSKLoggingService` ``.

---

#### access

### Controllers
- **`OSKAccessController`** (extends `OSKDocumentAndMessageController`): Exposes methods to fetch user accesses by building, door, or user ID, and publish messages. **Confirmed** `` `source_class|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController` ``.

### Services
- **`OSKAccessService`**: Core service orchestrating access creation, updates, and deletions. **Confirmed** `` `source_class|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService` ``.
- **`OSKPincodeService`**: Core service managing PIN-based access creation, deletion, and anonymous access triggers. **Confirmed** `` `source_class|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKPincodeService` ``.

### Entry Points
- **`getCallableFunctionTriggers`**: Entry point exporting callable Cloud Functions. **Confirmed** `` `function_declaration|core|functions/src/modules/core/modules/access/index.ts|getCallableFunctionTriggers|#1` ``.

---

#### auth0

### Services
- **`OSKAuth0Service`** `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 35-863) ``: The primary service class containing the business logic for Auth0 Management API interactions, token verification, and user synchronization.

### Callable Cloud Functions
Exposed via `getCallableFunctionTriggers` in `` `functions/src/modules/core/modules/auth0/index.ts` (lines 22-35) ``:
- **`exchangeAuth0Token`**: Entry point for exchanging an Auth0 token for a Firebase custom token.
- **`getUserPhoneNumber`**: Retrieves the standard phone number associated with an Auth0 user.
- **`getMfaPhoneNumber`**: Retrieves the confirmed SMS MFA phone number for an Auth0 user.
- **`verifyOwnershipOTP`**: Verifies an email ownership OTP.
- **`sendOTPEmail`**: Initiates a passwordless OTP email flow.
- **`enableMfa`**: Enrolls and enables MFA for a user.
- **`disableMfa`**: Disables MFA and deletes associated SMS authenticators.
- **`syncMfaPhoneNumberToProfile`**: Synchronizes the confirmed MFA phone number to the user's profile.

---

#### country

- **`OSKCountryService` (Class)**: The primary service class containing the business logic for retrieving countries [Confirmed: `source_class|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService`].
  - `onGetCountries`: Handles authenticated requests [Confirmed: `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountries|#1`].
  - `onGetCountriesNoAuth`: Handles unauthenticated requests [Confirmed: `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountriesNoAuth|#1`].
- **`getCallableFunctionTriggers` (Function)**: Registers the Firebase HTTPS callable functions for the capability [Confirmed: `function_declaration|core|functions/src/modules/core/modules/country/index.ts|getCallableFunctionTriggers|#1`].

---

#### public_key

The capability exposes its functionality through the `OSKPublicKeysController` class `` `source_class|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController` ``:

- **`OSKPublicKeysController.addPublicKey`**: Handles validation, decompression, and storage of a public key `` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|addPublicKey|#1` ``.
- **`OSKPublicKeysController.deletePublicKey`**: Handles removal of a public key from a document `` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|deletePublicKey|#1` ``.

These entry points and their associated models are exported via the submodule index file `functions/src/modules/core/modules/public_key/index.ts` (lines 6-10):
- `./controllers/public_keys.controller` `` `exported_symbol|core|functions/src/modules/core/modules/public_key/index.ts|./controllers/public_keys.controller|#1` ``
- `./models/documents/public_keys_document.model` `` `exported_symbol|core|functions/src/modules/core/modules/public_key/index.ts|./models/documents/public_keys_document.model|#1` ``
- `./models/functions/public_key_add_request.model` `` `exported_symbol|core|functions/src/modules/core/modules/public_key/index.ts|./models/functions/public_key_add_request.model|#1` ``
- `./models/functions/public_key_delete_request.model` `` `exported_symbol|core|functions/src/modules/core/modules/public_key/index.ts|./models/functions/public_key_delete_request.model|#1` ``
- `./models/shared/public_key.model` `` `exported_symbol|core|functions/src/modules/core/modules/public_key/index.ts|./models/shared/public_key.model|#1` ``

**Confidence Tag**: **Confirmed**

#### storage

- **OSKStorageController**: Manages storage triggers, content type detection, and file processing. [Confirmed] `` `source_class|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController` ``
- **OSKStorageService**: Handles the core business logic for generating signed URLs and responding to storage finalize events. [Confirmed] `` `source_class|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService` ``
- **getCallableFunctionTriggers**: Exposes the callable entry point for generating upload signed URLs. [Confirmed] `` `function_declaration|core|functions/src/modules/core/modules/storage/index.ts|getCallableFunctionTriggers|#1` ``

### 5. Internal Structure

The `core` module is structured around a central hub-and-spoke pattern, with the `_module_root` submodule acting as the central coordinator and entry point (**Confirmed**).

**Confirmed** internal coupling pathways:
- `_module_root` maintains outbound dependencies to `access`, `auth0`, `country`, and `storage` to expose their services and route incoming Pub/Sub events (e.g., routing to `OSKAccessService` in `pub_sub_receiver.service`).
- `_module_root` receives inbound dependencies from `access`, `auth0`, `country`, `public_key`, and `storage` because these submodules import base utilities (such as `OSKLoggingService`, `OSKSecretService`, and base controllers like `OSKDocumentAndMessageController`).
- `access` maintains a bidirectional relationship with `_module_root` (outbound to logger/base controllers, inbound from index/pub-sub receiver).
- `auth0`, `country`, and `storage` similarly maintain bidirectional relationships with `_module_root`.
- `public_key` has an outbound dependency to `_module_root` (for logging and base document models) but no inbound dependencies from it.

### 6. Firestore & Data Ownership

**Ownership conclusion:**

#### Cross-Cutting Ownership Conclusion
Although the `core` module's `access` and `public_key` submodules write directly to paths like `/users/{userId}/accesses`, `/buildings/{buildingId}/pincodes`, `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes`, `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes`, `/accessControlDevices/{id}/publicKeys`, and `/users/{id}/devices/{id}/publicKeys/{keyType}`, it does not "own" these collections in a business sense (**Inferred**). 

Instead, `core` acts as a **centralized transactional ledger and orchestration engine** (**Inferred**). The true business owners of these collections are the respective domain modules: `user` owns the user accesses and device keys, `building` owns the building pincodes, and `supplier` owns the supplier pincodes (**Inferred**). This is supported by the Data Ownership Hints, which show that `OSKPincodeService` and `OSKAccessService` are called by 6 other modules, and `OSKAccessUpdateService` is called by 3 other modules (**Confirmed**). These domain modules delegate the complex, cross-cutting logic of access creation, PIN generation, and hardware synchronization to `core`'s services rather than writing to Firestore directly (**Inferred**).

**Per-capability evidence:**

#### _module_root

### Firestore Paths
This capability acts as a generic controller layer and does not "own" specific business collections. However, it performs direct Firestore operations on collections passed dynamically to its methods (e.g., `collection` parameter in `_get`, `_create`, `_update`, `_delete`, `_removeFromArrayField`) `` `functions/src/modules/core/controllers/document.controller.ts` (lines 34-375) ``.

It also reads and writes user accesses during single-use quick code cleanup:
- **Confirmed**: Reads and updates `/users/{id}/accesses` via `OSKUserAccessesController` and `OSKAccessService` `` `call_expression|core|functions/src/modules/core/services/pub_sub_receiver.service.ts|OSKUserAccessesController.default.getPerBuilding|deleteQuickCodeSingleUse|userId,buildingId|#1` ``.

---

#### access

### Firestore Paths Touched
This capability reads and writes to the following Firestore paths:

| Path | Operation | Scope | Confidence | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `users/${userId}/accesses` | Write/Update | Document | **Confirmed** | `` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController.default._update|updateUserAccess|'users/${access.userId}/accesses',access.buildingId,data|#1` `` |
| `users/${userId}/invitations` | Read/Query | Collection | **Confirmed** | `` `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserInvitationController.default.queryUserInvitationsCollection|_removeAccessIdFromUserInvitations|'/users/${userId}/invitations',...|#1` `` |
| `buildings/${buildingId}/pincodes` | Write/Delete | Collection | **Confirmed** | `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKBuildingPincodeController.default.delete|deleteBuildingPincodeAndMoveToTrash|pincodeId,buildingId|#1` `` |
| `suppliers/${supplierId}/staffMembers/${staffId}/pincodes` | Write/Delete | Collection | **Confirmed** | `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKSupplierStaffPincodeService.createPincodeDocument|addPincodeDocumentsToSupplierStaffAccess|...|#1` `` |
| `buildings/${buildingId}/units/${unitId}/nonAppUsers/${nonAppUserId}/pincodes` | Write/Delete | Collection | **Confirmed** | `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKNonAppUserPincodeService.createPincodeDocument|addPincodeDocumentsToNonAppUserAccess|...|#1` `` |

---

#### auth0

### Firestore Paths
This capability does not directly own or write to any Firestore collections [Confirmed]. However, it delegates user profile updates to the `user` module, which modifies the `/users/{userId}` collection `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 154, 176) ``.

---

#### country

This capability does not directly own or perform write/read operations on any Firestore collections within its own codebase. It delegates user document retrieval to the `user` module [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1`].

---

#### public_key

The capability does not statically own a single Firestore collection. Instead, it dynamically reads and writes to Firestore paths passed as arguments (`collection` and `documentId`) to its controller methods:

- **Dynamic Reads**: `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).get|addPublicKey||#1` ``
- **Dynamic Writes**: `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``
- **Dynamic Updates**: `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).update|deletePublicKey|updatedPublicKey|#1` ``

Based on the system's Firestore schema grounding document, these dynamic paths map to:
- `/accessControlDevices/{id}/publicKeys`
- `/users/{id}/devices/{id}/publicKeys/{keyType}`

**Confidence Tag**: **Inferred** (for the specific collection paths, as they are passed dynamically); **Confirmed** (for the dynamic read/write operations).

#### storage

### Firestore Paths
- No direct Firestore paths are touched or written to by the facts in this capability pack. [Confirmed]

### Storage Paths
- Interacts with Google Cloud Storage buckets (`admin.storage().bucket()`) to generate signed URLs and set metadata on finalized files. [Confirmed] `` `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|admin.storage().bucket|generateUploadSignedUrlCallable||#1` ``

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

#### Cross-Cutting Risk Callouts & Enforcement Tally
An analysis of the security enforcement patterns across `core`'s submodules reveals a significant asymmetry in how authorization is handled (**Inferred**):

- **Mental Enforcement Tally**:
  - `_module_root`: Base controllers (`OSKDocumentController`, `OSKMessageController`) do *not* enforce RBAC permissions in code, relying entirely on Firestore Security Rules or calling controllers (**Confirmed**). App Check is enforced on HTTPS triggers (`enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR`) (**Confirmed**).
  - `access`: Enforces security via custom decorators (`OSKVerifyAccessValid`, `OSKUserSecurityChecks`) and App Check on callable triggers (**Confirmed**). Raises `permission-denied` errors if checks fail, but references *no* explicit RBAC strings in code (**Confirmed**).
  - `auth0`: Enforces security via `@OSKUserSecurityChecks` on `enableMfa` and `disableMfa` and App Check on callable triggers (**Confirmed**). References *no* explicit RBAC strings in code (**Confirmed**).
  - `country`: Enforces App Check (**Confirmed**). `onGetCountries` verifies Firebase Auth session token, but references *no* explicit RBAC strings in code (**Confirmed**).
  - `public_key`: References *no* explicit RBAC strings in code, relying entirely on Firestore Security Rules for path-level isolation (**Confirmed**).
  - `storage`: Explicitly checks the `v1.org.edit` RBAC permission string during `generateUploadSignedUrlCallable` to verify upload permissions (**Confirmed**). Uses `@OSKUserSecurityChecks` with `{ checkUserIdMatch: false }` (**Confirmed**).

- **Security Asymmetry Risk**: Only the `storage` submodule explicitly references and checks a concrete RBAC permission string (`v1.org.edit`) in its code (**Confirmed**). The `access` submodule (which orchestrates highly sensitive operations like PIN code generation and access deletion) and the `auth0` submodule (which manages MFA states) do *not* enforce RBAC strings in code (**Confirmed**). Instead, they rely on custom decorators or delegate security entirely to Firestore Security Rules (**Inferred**). This means that while file uploads are guarded by explicit RBAC checks in the application layer, critical access-control modifications are not explicitly bound to RBAC roles in the backend code, creating a potential security boundary mismatch if Firestore rules are bypassed or misconfigured (**Inferred**).

- **Unattributed Security-Relevant Signals**:
  - The `access` submodule raises `permission-denied` errors (at least 1 occurrence explicitly noted in the extract) with no identifiable RBAC string behind them, relying instead on the `@OSKVerifyAccessValid` decorator (**Confirmed**).
  - The `auth0` submodule performs security checks via `@OSKUserSecurityChecks` on `enableMfa` and `disableMfa` (2 methods) with no RBAC string backing (**Confirmed**).
  - The `country` submodule performs session verification via `auth().getUser` on `onGetCountries` (1 method) with no RBAC string backing (**Confirmed**).

**Per-capability evidence:**

#### _module_root

- **Confirmed**: The base controllers (`OSKDocumentController`, `OSKMessageController`) do not enforce RBAC permissions in their code; they rely on Firestore Security Rules or the calling controllers to enforce them.
- **Confirmed**: The `getHttpsFunctionTriggers` function configures App Check enforcement based on whether the environment is running in the Firebase Emulator: `enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR` `` `call_expression|core|functions/src/modules/core/index.ts|functionBuilder.runWith|getHttpsFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

---

#### access

### Security Checks & Decorators
- **`OSKVerifyAccessValid`**: Decorator used to verify that the requesting user has valid access rights before executing operations. **Confirmed** `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKVerifyAccessValid|onCreatePincodeAnonymousAccess||#1` ``.
- **`OSKUserSecurityChecks`**: Decorator used to enforce standard user-level security checks. **Confirmed** `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserSecurityChecks|onCreatePincodeAnonymousAccess||#1` ``.
- **App Check Enforcement**: Callable functions enforce App Check unless running in the emulator environment. **Confirmed** `` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.
- **Permission Errors**: Throws a `permission-denied` error if security checks fail. **Confirmed** `` `permission_error|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|permission-denied|#1` ``.

---

#### auth0

### Security Decorators
- **`OSKUserSecurityChecks`**: Applied to `enableMfa` and `disableMfa` methods to enforce user-level authorization checks `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 517, 555) ``.

### App Check Guardrails
- Enforces Firebase App Check on all callable triggers unless running in the Firebase Emulator environment `` `functions/src/modules/core/modules/auth0/index.ts` (line 23) ``.

### RBAC Mismatches
- **None**: No explicit RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are referenced or checked within this capability's codebase [Confirmed].

---

#### country

- **App Check Verification**: Both endpoints enforce Firebase App Check to ensure requests originate from verified applications [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].
- **Session Authentication**: `onGetCountries` verifies that the caller has a valid Firebase Auth session token [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|auth().getUser|onGetCountries|userId|#1`].
- **RBAC Mismatches**: No explicit RBAC permission strings (e.g., `v1.admin...` or `v1.org...`) are referenced or checked within this capability's evidence [Confirmed].

---

#### public_key

No explicit RBAC permission strings are referenced in this capability's code. Security boundaries are enforced at the Firestore collection layer via security rules (e.g., verifying that the authenticated user matches the `{userId}` in the path `/users/{userId}/devices/{deviceId}/publicKeys/{keyType}` as defined in `firestore.rules.txt`).

**Confidence Tag**: **Confirmed**

#### storage

- **v1.org.edit**: Checked during `OSKStorageService.generateUploadSignedUrlCallable` to verify if the requesting user has permission to upload files associated with the organization. [Confirmed] `` `permission_candidate|core|functions/src/modules/core/modules/storage/services/storage.service.ts|v1.org.edit|#1` ``
  - *Cross-check*: This matches the `v1.org.edit` permission string in the RBAC roles document ("Allows to edit organization information"). [Confirmed]
- **OSKUserSecurityChecks**: Uses the `@OSKUserSecurityChecks` decorator with `{ checkUserIdMatch: false }` to enforce authentication without strictly requiring the requesting user ID to match the target user ID. [Confirmed] `` `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKUserSecurityChecks|generateUploadSignedUrlCallable|{ checkUserIdMatch: false }|#1` ``

### 10. Cross-Module Relationships

#### Outbound Relationships (Confirmed)
- **`access_control_device`**: `core` imports models (`OSKAccessControlDeviceAccessCommandDocument`, `OSKAccessControlDeviceStateDocument`, `OSKAccessControlDeviceSystemLogDocument`, `OSKAccessControlDevice`) and calls `OSKActivityEnrichmentService` for activity enrichment.
- **`building`**: `core` imports models (`OSKBuildingActivity`) and controllers (`OSKBuildingAccessesController`, `OSKNonAppUserPincodeController`).
- **`organization`**: `core` imports `OSKOrganizationUserAccessService` and `OSKOrganizationUserController`.
- **`settings`**: `core` imports `OSKConsolidatedRolesController` to perform permission checks.
- **`supplier`**: `core` imports `OSKSupplierStaffPincodeController`, `OSKSupplierStaffPincodeService`, and `OSKSupplierController`.
- **`user`**: `core` imports `OSKUserAuthorizedDoor`, `OSKUserAccessesController`, and `OSKAccess` models.

#### Inbound Relationships (Confirmed)
- **`access_control_device`**: Calls `OSKLoggingService`, `OSKDocumentAndMessageController`, `OSKPublicKeysController`, and `OSKAccessUpdateService`.
- **`admin`**: Calls `OSKDocumentController`, `OSKLoggingService`, `OSKAccessMessagePublisherService`, `OSKAccessUtilsService`, `OSKPincodeService`, and `OSKAccessService`.
- **`apps`**: Calls `OSKDocumentController`, `OSKLoggingService`, and `OSKSecretService`.
- **`building`**: Calls `OSKDocumentController`, `OSKDocumentAndMessageController`, `OSKLoggingService`, `OSKSecretService`, `OSKAccessUpdateService`, `OSKAccessUtilsService`, `OSKAccessMessagePublisherService`, `OSKAccessService`, and `OSKPincodeService`.
- **`call`**: Calls `OSKDocumentController` and `OSKLoggingService`.
- **`organization`**: Calls `OSKDocumentController`, `OSKAccessUtilsService`, `OSKLoggingService`, `OSKAccessService`, `OSKAccessUtilsDatesService`, `OSKAccessMessagePublisherService`, and `OSKPincodeService`.
- **`settings`**: Calls `OSKDocumentController` and `OSKLoggingService`.
- **`supplier`**: Calls `OSKDocumentController`, `OSKDocumentAndMessageController`, `OSKAccessUtilsService`, `OSKLoggingService`, `OSKAccessMessagePublisherService`, `OSKAccessService`, and `OSKPincodeService`.
- **`tasks`**: Calls `OSKLoggingService`.
- **`unit_management`**: Calls `OSKDocumentController`, `OSKAccessService`, `OSKPincodeService`, `OSKLoggingService`, and `OSKAccessUtilsDatesService`.
- **`user`**: Calls `OSKDocumentController`, `OSKLoggingService`, `OSKAccessUtilsService`, `OSKDocumentAndMessageController`, `OSKAccessUpdateService`, `OSKSecretService`, `OSKAccessService`, `OSKAccessUtilsDatesService`, `OSKPincodeService`, and `OSKAuth0Service`.

### 11. External Hooks

#### _module_root

### Pub/Sub Topics
- **Confirmed**: Publishes messages to dynamic topics passed to `_publishMessage` `` `external_hook|core|functions/src/modules/core/controllers/message.controller.ts|topicName|#1` ``.
- **Confirmed**: Ingests messages via the `processPubSubMessage` HTTP endpoint `` `api_contract|core|functions/src/modules/core/index.ts|processPubSubMessage|#1` ``.

### Google Cloud Storage
- **Confirmed**: Interacts with Cloud Storage buckets for image upload, thumbnail generation, and deletion `` `functions/src/modules/core/controllers/document.controller.ts` (lines 377-488) ``.
- **Confirmed**: Registers a storage trigger `onFinalize` on the default bucket `` `call_expression|core|functions/src/modules/core/index.ts|storage.bucket().object().onFinalize|getStorageTriggers||#1` ``.

### Google Secret Manager
- **Confirmed**: Interacts with Secret Manager API via `@google-cloud/secret-manager` to retrieve and create secrets `` `functions/src/modules/core/services/secret.service.ts` (lines 38-198) ``.

### Environment Variables
- **Confirmed**: Reads `OSK_FIREBASE_EMULATOR` to conditionally enforce App Check `` `functions/src/modules/core/index.ts` (line 74) ``.
- **Confirmed**: Reads `GCLOUD_PROJECT` to construct the Secret Manager resource path `` `functions/src/modules/core/services/secret.service.ts` (line 41) ``.

---

#### access

### Pub/Sub Publishing
- Publishes messages to dynamically resolved topics (e.g., `topicName`) to synchronize access updates to edge devices. **Confirmed** `` `external_hook|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|topicName|#1` ``.
- Publishes delta updates targeting specific edge devices (`buildingDoorACD.accessControlDeviceId`, `acdId`). **Confirmed** `` `external_hook|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|buildingDoorACD.accessControlDeviceId|#1` ``.

### Environment Variables
- **`OSK_FIREBASE_EMULATOR`**: Used to conditionally bypass App Check enforcement during local development or testing. **Confirmed** `` `call_expression|core|functions/src/modules/core/modules/access/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``.

---

#### auth0

### Confirmed Integrations

#### Auth0 API
The capability communicates extensively with external Auth0 endpoints using `axios` `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` ``:
- **JWKS URI**: `https://${AUTH0_DOMAIN}/.well-known/jwks.json` (for signature verification) `` (line 79) ``.
- **Management API Token Endpoint**: `https://${AUTH0_DOMAIN}/oauth/token` `` (line 235) ``.
- **Management API Users Endpoint**: `https://${AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/...` (for CRUD operations, authenticators, and metadata updates) `` (lines 274, 320, 471, 573, 645, 744, 802) ``.
- **Passwordless Start**: `https://${AUTH0_DOMAIN}/passwordless/start` `` (line 371) ``.
- **Passwordless Verification**: `https://${AUTH0_DOMAIN}/co/authenticate` `` (line 417) ``.

### Environment Variables & Secrets
The capability retrieves the following secrets via `OSKSecretService` `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 55-60) ``:
- `OSKApiName.Auth0Domain`
- `OSKApiName.Auth0ManagementDomain`
- `OSKApiName.Auth0M2MClientId`
- `OSKApiName.Auth0M2MClientSecret`

---

#### country

- **Environment Variables**:
  - `process.env.OSK_FIREBASE_EMULATOR`: Evaluated to conditionally disable App Check enforcement during local development or testing [Confirmed: `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].

---

#### public_key

No external hooks, Pub/Sub topics, environment variables, or storage paths are directly referenced or managed by this capability.

**Confidence Tag**: **Confirmed**

#### storage

- **Google Cloud Storage**: Integrates with GCS to generate signed URLs and handle `onFinalize` events. [Confirmed] `` `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|bucket.file(filePath).getSignedUrl|generateUploadSignedUrlCallable|options|#1` ``
- **App Check**: Enforces App Check on callable functions unless running in the Firebase Emulator (`process.env.OSK_FIREBASE_EMULATOR`). [Confirmed] `` `call_expression|core|functions/src/modules/core/modules/storage/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``

### 12. Architectural Observations

- **Centralized Access Orchestration Pattern**: The `core` module acts as the single source of truth for access-provisioning orchestration (**Inferred**). Rather than allowing domain modules (`building`, `user`, `supplier`, `unit_management`) to write access rules or PIN codes directly to Firestore, they all call into `OSKAccessService` and `OSKPincodeService` (**Confirmed**). This enforces a strict separation of concerns where domain modules manage business relationships (e.g., leases, supplier contracts) while `core` manages the physical translation into access rights and PINs (**Inferred**).
- **Asynchronous IoT Event Ingestion & Enrichment**: The `pub_sub_receiver.service` acts as a centralized ingress point for raw edge hardware events (**Confirmed**). It decouples the physical devices from the database by receiving raw signals, calling `OSKActivityEnrichmentService` (in `access_control_device`) to resolve "who did what, where", and then fanning out the enriched activity records to domain-specific handlers (`OSKBuildingActivitiesService`, `OSKUserActivitiesService`, `OSKSupplierStaffActivityService`) (**Confirmed**). This prevents edge devices from writing directly to authoritative business records (**Inferred**).
- **Delegated Storage Pattern**: The `storage` submodule implements a secure, delegated file upload pattern (**Confirmed**). Instead of routing heavy file bytes through Cloud Functions, it generates short-lived signed URLs, allowing clients to upload directly to Google Cloud Storage (**Confirmed**). This offloads bandwidth and compute overhead from the application layer (**Inferred**).
- **Hub-and-Spoke Internal Coupling**: The internal structure of `core` relies heavily on `_module_root` as a central hub (**Confirmed**). All submodules (`access`, `auth0`, `country`, `storage`, `public_key`) depend on `_module_root` for logging, secrets, and base controllers, while `_module_root` coordinates them (**Confirmed**). This creates a highly cohesive but tightly coupled internal structure (**Inferred**).

### 13. Risks & Open Questions

**Cross-cutting risks:**

- **RBAC Enforcement Asymmetry**: There is a stark contrast between how file uploads are secured (explicitly checking `v1.org.edit` in the application layer) and how critical access-control operations are secured (relying on custom decorators like `@OSKVerifyAccessValid` and `@OSKUserSecurityChecks` with no explicit RBAC string checks in code) (**Inferred**). If Firestore Security Rules are misconfigured or bypassed, unauthorized users could potentially manipulate PIN codes or access rights (**Inferred**).
- **Dynamic Path Resolution Risk**: The `public_key` capability dynamically writes to paths passed as arguments (`collection` and `documentId`) (**Confirmed**). If the calling module passes an unvalidated path, this could lead to arbitrary document writes in Firestore, bypassing logical boundaries (**Inferred**).
- **Pub/Sub Topic Resolution Uncertainty**: The mechanism for dynamically resolving Pub/Sub topic names (e.g., in `OSKAccessController.getTopicName`) is not fully defined in the evidence, creating uncertainty around how routing is maintained and validated (**Unknown**).
- **Auth0 Passwordless Strategy Exclusivity**: It is unclear if Auth0's passwordless email flow is the exclusive mechanism for email verification across the entire platform, or if it runs in parallel with other custom SMTP/email dispatchers, which could lead to split-brain identity states (**Unknown**).
- **Storage Completion Trigger Definition**: The architecture document mentions that file uploads follow a delegated-upload pattern where a completion trigger performs follow-up tasks (such as recording the file's location in Firestore) (**Confirmed**). However, no direct Firestore writes are evidenced in the `storage` capability pack, leaving the definition and location of these completion triggers unconfirmed (**Unknown**).

**Per-capability open questions:**

#### _module_root

- **Uncertain**: How are the dynamic Pub/Sub topics mapped to specific business events? The base controller `OSKMessageController` accepts any topic name string, but the mapping is not defined in this capability.
- **Uncertain**: Are there any specific RBAC checks performed inside the core module, or is it entirely delegated to Firestore Security Rules and the calling modules?
- **Uncertain**: What is the exact structure of the local secrets file (`secretsFilePath`) used by `OSKSecretService` during local development?

#### access

- **How are Pub/Sub topic names dynamically resolved?** The exact mapping logic inside `getTopicName` is not fully detailed in this pack. **Unknown** `` `controller_method|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController|getTopicName|#1` ``.
- **Are there any direct Firestore triggers defined within this capability?** No Firestore triggers (e.g., `onWrite` to accesses) are evidenced in this pack, suggesting all database updates are handled strictly through services and controllers. **Unknown**.

#### auth0

- **Response Schemas**: The exact response structures for `sendOTPEmail`, `enableMfa`, `disableMfa`, and `syncMfaPhoneNumberToProfile` are not defined in the `model_property` facts of this pack, leaving their exact return payloads unconfirmed at this level.
- **Passwordless Strategy**: It is unclear if Auth0's passwordless email flow is the exclusive mechanism for email verification across the entire platform, or if it runs in parallel with other custom SMTP/email dispatchers.

#### country

- **Country Data Source**: The evidence pack does not show where the actual country list data is defined or stored (e.g., whether it is hardcoded in the service, loaded from a local JSON file, or fetched from an external API/database).
- **Response Schema**: There are no `model_property` facts in this capability's scope, leaving the exact structure of the returned country objects (e.g., ISO codes, names, dial codes) unconfirmed by direct engineering evidence.

#### public_key

- **Inbound Callers**: Because inbound coupling is not visible in this capability's pack, it is unknown which specific modules (e.g., `user`, `access_control_device`) invoke `OSKPublicKeysController` to manage their keys.
- **Key Usage**: It is unknown how other modules retrieve and utilize these stored public keys to perform signature verification or payload decryption during device handshakes.

**Confidence Tag**: **Confirmed** (that these details are absent from the current evidence pack).

#### storage

- What are the specific registered triggers and regex patterns used in production for `OSKStorageController.registerTriggers`? [Unknown]
- The architecture document mentions that file uploads follow a delegated-upload pattern where a completion trigger performs follow-up tasks (such as recording the file's location in Firestore). Where are these completion triggers defined, as no direct Firestore writes are evidenced in this pack? [Unknown]

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
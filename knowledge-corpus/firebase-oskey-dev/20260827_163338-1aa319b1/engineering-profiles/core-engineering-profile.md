### 0. Generation Metadata

- **runId**: `20260827_163338-1aa319b1`
- **generatedAt**: `2026-08-27T17:15:54.687Z`
- **repoName**: `firebase-oskey-dev`
- **targetModule**: `core`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `core` module provides the foundational infrastructure, structured logging, secret management, Firestore document abstraction, and Pub/Sub message routing for the entire Oskey backend platform [Confirmed]. Beyond shared utilities, it contains the platform's central access orchestration engine, which manages physical and digital access credentials (alphanumeric PIN codes and SecureBLE tokens) across building doors for all user personas (Inhabitants, Guests, Permanent Guests, Supplier Staff, and Non-App Users) [Confirmed]. Additionally, the module handles identity bridging and Multi-Factor Authentication (MFA) administration via Auth0 [Confirmed], manages cryptographic public keys for devices and users [Confirmed], provides country support utilities [Confirmed], and orchestrates secure delegated file uploads to Google Cloud Storage [Confirmed].

### 2. Architectural Position

The `core` module sits at the absolute base of the Oskey platform architecture, serving as both the foundational utility layer and the central access orchestration hub [Confirmed]. 
- **Parent Scope**: Global platform core.
- **Owned Concepts**: Centralized logging (`OSKLoggingService`), generic database controllers (`OSKDocumentController`, `OSKDocumentAndMessageController`), access orchestration (`OSKAccessService`, `OSKPincodeService`), Auth0 identity bridging (`OSKAuth0Service`), public key management (`OSKPublicKeysController`), and storage orchestration (`OSKStorageService`).
- **Provided Capabilities**: Foundational infrastructure, access orchestration, Auth0 identity bridging, country support, public key management, and delegated storage.

### 3. Primary Responsibilities

#### _module_root

- **Firestore Document Abstraction**: Provides generic CRUD, query, pagination, transaction-based array field manipulation (`_removeFromArrayField`, `_removeFromArrayFieldByPredicate`), and image upload/deletion utilities (`_uploadImage`, `_deleteImage`) via `OSKDocumentController` `functions/src/modules/core/controllers/document.controller.ts` (lines 30-488).
- **Pub/Sub Message Ingestion & Routing**: Ingests and validates raw IoT activity payloads and routes them to specific handlers based on data types (`state`, `systemLog`, `activities`, `accessCommand`, `user`, `supplierStaffMember`, `nonAppUser`) via `PubSubMessageProcessor` `functions/src/modules/core/services/pub_sub_receiver.service.ts` (lines 36-233).
- **Single-Use Quickcode Cleanup**: Identifies and deletes single-use quickcodes (pincodes) after they are used, coordinating with `OSKAccessService` and `OSKUserAccessesController` `functions/src/modules/core/services/pub_sub_receiver.service.ts` (lines 244-327).
- **Structured Logging**: Formats and outputs structured logs with severity levels (DEBUG, INFO, WARNING, ERROR, CRITICAL) and HTTP request metadata via `OSKLoggingService` `functions/src/modules/core/services/logging.service.ts` (lines 47-164).
- **Secret Management**: Manages API keys and private keys, interfacing with Google Secret Manager and falling back to local file-based secrets in emulator/development environments via `OSKSecretService` `functions/src/modules/core/services/secret.service.ts` (lines 33-203).
- **Trigger Orchestration**: Exposes functions to aggregate and export callable, HTTPS, and storage triggers from submodules (e.g., `access`, `country`, `auth0`, `storage`) `functions/src/modules/core/index.ts` (lines 54-79).

---

#### access

### Access Orchestration & Provisioning
- Coordinates the creation, update, and deletion of access rights across multiple user categories (OSKUser, Non-App User, Supplier Staff) `` `service_method|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService|createAccess|#1` ``. [Confirmed]
- Creates a paired document pattern for accesses, writing to both user-centric collections and building-centric accesses `` `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKBuildingAccessService.createOrUpdateBuildingAccess|createAccess|userId,buildingId,userData,newAccess|#1` ``. [Confirmed]

### Alphanumeric PIN Code Generation & Validation
- Generates secure, unique alphanumeric PIN codes based on a schema (incorporating digits 0-9, letters A-C, and symbols) `` `service_method|core|functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts|OSKPincodeGenerationService|generatePincode|#1` ``. [Confirmed]
- Validates PIN code uniqueness against active building pincodes and pincode trash records to prevent collisions `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts|OSKBuildingPincodeController.default.get|_isPincodeUnique|pincode,buildingId|#1` ``. [Confirmed]
- Enforces complexity requirements, such as preventing sequential digits or characters repeating more than 3 times `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode_generation.service.ts|Object.values(counts).some|_isPincodeValid|(count) => count >= 3|#1` ``. [Confirmed]

### Asynchronous Edge Synchronization (Pub/Sub)
- Publishes access state changes (Insert, Update, Delete) to GCP Pub/Sub topics mapped to specific Access Control Devices (ACDs) `` `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageToAllACDs|#1` ``. [Confirmed]
- Decouples business logic from hardware availability by publishing intended state changes asynchronously `` `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessController.default.publishMessage|publishMessageAccessInsertToACD|buildingDoorACD.accessControlDeviceId,payload|#1` ``. [Confirmed]

### Access Update Propagation
- Updates user accesses when building info, door info, user info, or device configurations change `` `service_method|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKAccessUpdateService|updateUserAccessesDoorInfo|#1` ``. [Confirmed]
- Re-generates BLE device tokens for active user devices when access rights are modified `` `call_expression|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKUserDeviceService.createAccessDeviceToken|updateUserAccessDevices|{                                 buildingId: userAccess.buildingId,                                 doorId: door.doorId,                                 userId: userAccess.userId,                                 accessRights: access.accessRights,                                 accessId: access.accessId,                             },isMainAccess|#1` ``. [Confirmed]

### Pincode Lifecycle & Trash Management
- Moves deleted pincodes to a trash collection with an expiration date (typically 1 year) to prevent immediate reuse and maintain auditability `` `service_method|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKPincodeService|deleteBuildingPincodeAndMoveToTrash|#1` ``. [Confirmed]

### Access Validity & Recurrence Parsing
- Parses and validates complex temporal access rights (Permanent, One-Time, Recurrent with Daily/Weekly/Monthly patterns) `` `service_method|core|functions/src/modules/core/modules/access/services/access_utils_dates.service.ts|OSKAccessUtilsDatesService|convertAccessRightToDateObject|#1` ``. [Confirmed]
- Converts access rights between Date objects, strings, and Firestore Timestamps for token payloads `` `service_method|core|functions/src/modules/core/modules/access/services/access_utils_dates.service.ts|OSKAccessUtilsDatesService|convertAccessRightsToFirebaseTimestamp|#1` ``. [Confirmed]

---

#### auth0

The `auth0` capability provides the following distinct responsibilities:

- **Auth0 to Firebase Token Exchange**: Validates incoming Auth0 JSON Web Tokens (JWTs) using JWKS-rsa verification and exchanges them for Firebase custom authentication tokens `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|exchangeAuth0Token|#1` ``. It handles user migration by linking Auth0 sub-identifiers to existing Firebase UIDs when matched by email, or provisions new Firebase users if no match is found `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 111-226) ``.
- **MFA Administration**: Orchestrates the enabling and disabling of Multi-Factor Authentication (MFA) for users `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|enableMfa|#1` ``, `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|disableMfa|#1` ``. Disabling MFA deletes enrolled SMS authenticators via the Auth0 Management API `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 555-606) ``.
- **OTP Verification & Email Ownership**: Dispatches passwordless OTP emails via Auth0 `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|sendOTPEmail|#1` `` and verifies the OTP codes to validate email ownership `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|verifyOwnershipOTP|#1` ``.
- **Phone Number Synchronization**: Retrieves verified MFA phone numbers from Auth0 `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|getMfaPhoneNumber|#1` `` and synchronizes them to the user's profile and metadata `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|syncMfaPhoneNumberToProfile|#1` ``.
- **User Profile Management**: Supports updating user email addresses `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|updateUserEmail|#1` `` and phone numbers `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|updateUserPhoneNumber|#1` `` within Auth0, as well as deleting Auth0 user accounts `` `service_method|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service|deleteAuth0User|#1` ``.

#### country

- **Authenticated Country Retrieval**: Exposes the `onGetCountries` method which validates that the caller is authenticated, verifies the user's existence in the database, and retrieves the country list [Confirmed] (`` `functions/src/modules/core/modules/country/services/country.service.ts` (lines 17-43) ``).
- **Unauthenticated Country Retrieval**: Exposes the `onGetCountriesNoAuth` method to allow clients to retrieve the country list without requiring user authentication [Confirmed] (`` `functions/src/modules/core/modules/country/services/country.service.ts` (lines 45-56) ``).
- **App Check Enforcement**: Secures both entry points using Firebase App Check, which is conditionally bypassed only when running in the local Firebase Emulator environment [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

#### public_key

The `public_key` capability is responsible for the following distinct features:

### Public Key Registration and Decompression
- **JWK Coordinate Extraction**: Extracts the `x` and `y` coordinates from a JWK public key structure and converts them from base64 to reconstruct the uncompressed public key representation. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|Buffer.concat([                     Buffer.from(jwk.x, 'base64'),                     Buffer.from(jwk.y, 'base64'),                 ]).toString|addPublicKey|'base64'|#1` ``)
- **Key Validation**: Uses Node's native `crypto` module to import and validate the public key format. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|crypto.createPublicKey|addPublicKey|publicKey|#1` ``)
- **Firestore Persistence**: Writes or updates the public key document in a dynamically specified Firestore collection. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``)

### Public Key Deletion
- **Key Removal**: Updates or deletes public key records from a dynamically specified Firestore collection. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).update|deletePublicKey|updatedPublicKey|#1` ``)

---

#### storage

### Delegated Upload URL Generation
- Generates secure, short-lived Google Cloud Storage signed URLs using the Firebase Admin SDK, offloading bandwidth-intensive file transfers from application compute directly to Google Cloud Storage. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|bucket.file(filePath).getSignedUrl|generateUploadSignedUrlCallable|options|#1`].
- Dynamically constructs destination file paths using unique identifiers (`uuidv4`). [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|uuidv4|generateUploadSignedUrlCallable||#1`].

### Upload Validation & Security Checks
- Restricts uploads to allowed MIME types (specifically `image/png`, `image/jpeg`, and `image/gif`) during the signed URL request phase. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|['image/png', 'image/jpeg', 'image/gif'].includes|generateUploadSignedUrlCallable|request.contentType|#1`].
- Enforces user authentication and authorization checks before issuing signed URLs. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKUserSecurityChecks|generateUploadSignedUrlCallable|{ checkUserIdMatch: false }|#1`].

### Post-Upload Metadata & Trigger Processing
- Listens to Cloud Storage `onFinalize` events to process newly uploaded files. [Confirmed: `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1`].
- Automatically detects the file's content type based on its extension and updates the object's metadata in the storage bucket. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file(object.name).setMetadata|processFile|{ contentType: contentType }|#1`].
- Matches finalized file paths against registered regular expression patterns to execute custom post-processing triggers. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|registeredTrigger.exec|processFile|object.bucket,object.name,contentType|#1`].

---

### 4. Public Interfaces

#### _module_root

- **`OSKDocumentAndMessageController`** (`functions/src/modules/core/controllers/document_and_message.controller.ts`): Combines document CRUD operations and Pub/Sub message publishing.
- **`OSKDocumentController`** (`functions/src/modules/core/controllers/document.controller.ts`): Base controller for Firestore document operations.
- **`OSKMessageController`** (`functions/src/modules/core/controllers/message.controller.ts`): Base controller for Google Cloud Pub/Sub message publishing.
- **`PubSubMessageProcessor`** (`functions/src/modules/core/services/pub_sub_receiver.service.ts`): Service class processing raw Pub/Sub messages.
- **`OSKLoggingService`** (`functions/src/modules/core/services/logging.service.ts`): Structured logging service.
- **`OSKSecretService`** (`functions/src/modules/core/services/secret.service.ts`): Secret management service.

---

#### access

### OSKAccessController
- **File**: `functions/src/modules/core/modules/access/controllers/access.controller.ts` (lines 16-78)
- **Description**: Extends `OSKDocumentAndMessageController`. Exposes methods to fetch user accesses by building, door, or user ID, and publish messages to ACDs. [Confirmed]

### OSKAccessService
- **File**: `functions/src/modules/core/modules/access/services/access.service.ts` (lines 68-815)
- **Description**: Core orchestrator for creating, updating, and deleting accesses. Coordinates downstream updates to user accesses, building accesses, supplier staff accesses, non-app user accesses, and device tokens. [Confirmed]

### OSKPincodeService
- **File**: `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (lines 64-751)
- **Description**: Handles pincode-specific operations, including anonymous access creation, deletion, and trash management. [Confirmed]

### OSKAccessMessagePublisherService
- **File**: `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts` (lines 46-326)
- **Description**: Handles Pub/Sub message construction and dispatch to ACDs. [Confirmed]

### OSKAccessUpdateService
- **File**: `functions/src/modules/core/modules/access/services/access_update.service.ts` (lines 14-237)
- **Description**: Propagates structural changes (doors, devices, user profiles) to existing access documents. [Confirmed]

---

#### auth0

The capability exposes its functionality through a single service class and a set of Firebase Callable Functions:

- **OSKAuth0Service**: The core service class containing the business logic for Auth0 API interactions, token validation, and user management `` `source_class|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service` ``.
- **Callable Function Entry Points**: Exposes entry points for client-facing operations `` `functions/src/modules/core/modules/auth0/index.ts` (lines 22-35) ``:
  - `disableMfa`
  - `enableMfa`
  - `exchangeAuth0Token`
  - `getMfaPhoneNumber`
  - `getUserPhoneNumber`
  - `sendOTPEmail`
  - `syncMfaPhoneNumberToProfile`
  - `verifyOwnershipOTP`

#### country

- **`OSKCountryService`**: The primary service class containing the business logic for country retrieval [Confirmed] (`` `source_class|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService` ``).
  - `onGetCountries`: Handles authenticated requests [Confirmed] (`` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountries|#1` ``).
  - `onGetCountriesNoAuth`: Handles unauthenticated requests [Confirmed] (`` `service_method|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKCountryService|onGetCountriesNoAuth|#1` ``).
- **`getCallableFunctionTriggers`**: The entry point function that registers the callable Cloud Functions [Confirmed] (`` `function_declaration|core|functions/src/modules/core/modules/country/index.ts|getCallableFunctionTriggers|#1` ``).

---

#### public_key

This capability exposes the following public controller:

### `OSKPublicKeysController`
- **File**: `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (line 14) (`` `source_class|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController` ``)
- **Methods**:
  - `addPublicKey(collection: string, documentId: string, keyId: string, publicKey: string)`: Validates, decompresses, and saves a public key to Firestore. [Confirmed] (`` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|addPublicKey|#1` ``)
  - `deletePublicKey(collection: string, documentId: string, keyId: string)`: Removes a public key from Firestore. [Confirmed] (`` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|deletePublicKey|#1` ``)

---

#### storage

### `OSKStorageController` (Controller Class)
- **File**: `functions/src/modules/core/modules/storage/controllers/storage.controller.ts` [Confirmed: `source_class|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController`]
- **Purpose**: Manages the registration of file-processing triggers and executes the corresponding hooks when files are finalized in Cloud Storage.
- **Key Methods**:
  - `registerTriggers(trigger: OSKTrigger)`: Registers a regular expression and an execution callback for post-upload processing. [Confirmed: `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|registerTriggers|#1`].
  - `processFile(object: Storage.ObjectMetadata, context: any)`: Evaluates a finalized storage object, updates its content-type metadata, and runs matching triggers. [Confirmed: `controller_method|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|OSKStorageController|processFile|#1`].

### `OSKStorageService` (Service Class)
- **File**: `functions/src/modules/core/modules/storage/services/storage.service.ts` [Confirmed: `source_class|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService`]
- **Purpose**: Implements the core business logic for signed URL generation and handles the Cloud Storage `onFinalize` entry point.
- **Key Methods**:
  - `generateUploadSignedUrlCallable(request: GenerateUploadUrlRequest, context: any)`: Validates permissions and generates the signed upload URL. [Confirmed: `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|generateUploadSignedUrlCallable|#1`].
  - `onFinalize(object: any, context: any)`: Entry point for Cloud Storage finalization events, delegating to `OSKStorageController`. [Confirmed: `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1`].

### `getCallableFunctionTriggers` (Module Entry Point)
- **File**: `functions/src/modules/core/modules/storage/index.ts` [Confirmed: `function_declaration|core|functions/src/modules/core/modules/storage/index.ts|getCallableFunctionTriggers|#1`]
- **Purpose**: Exports the `generateUploadSignedUrlCallable` Cloud Function with App Check enforcement (unless running in an emulator environment). [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1`].

---

### 5. Internal Structure

*Note: This section contains only the cross-submodule coupling analysis derived from the deterministic intra-module coupling graph.*

The `core` module is structured around a central `_module_root` which acts as the primary entry point and orchestrator [Confirmed].
- **`_module_root` Outbound Coupling**: Has direct outbound dependencies on `access`, `auth0`, `country`, and `storage` [Confirmed].
- **Submodule Inbound Coupling**: `access`, `auth0`, `country`, `public_key`, and `storage` all maintain inbound dependencies pointing back to `_module_root` (primarily for logging, secret management, and shared controllers) [Confirmed].
- **`public_key` Isolation**: The `public_key` submodule has no inbound dependencies from other submodules within `core` but is called by external modules [Confirmed].

### 6. Firestore & Data Ownership

**Ownership conclusion:**

*Note: This section contains only the cross-cutting ownership and risk judgments.*

The `core` module does not strictly "own" a single business domain collection in isolation; instead, it acts as the primary orchestrator and dual-writer for access-related data across multiple domain collections [Inferred].
- **Foundational Controllers**: Based on Data Ownership Hints, `core` provides the foundational controllers (`OSKDocumentController` and `OSKDocumentAndMessageController`) that execute operations on behalf of other modules [Confirmed].
- **Access Control Paths**: For access control, `core` manages the lifecycle of pincodes and accesses across `/users/{userId}/accesses`, `/buildings/{buildingId}/pincodes`, `/buildings/{buildingId}/pincodesTrash`, `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes`, `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes`, and `/users/{userId}/pincodes` [Confirmed].
- **Shared Ownership Judgment**: While these paths reside within user, building, and supplier scopes, the business logic and state transitions are driven by `OSKAccessService` and `OSKPincodeService` within `core/access` [Inferred].
- **Storage Utility**: `core/storage` operates purely as a transient utility for Google Cloud Storage and does not own any Firestore collections [Confirmed].
- **Auth0 Utility**: `core/auth0` does not directly own Firestore collections but orchestrates updates to `/users/{userId}` via `OSKUserController` [Inferred].
- **Public Key Utility**: `core/public_key` manages public keys dynamically across `/accessControlDevices/{id}/publicKeys` and `/users/{id}/devices/{id}/publicKeys` [Inferred].

**Per-capability evidence:**

#### _module_root

- **Firestore Paths**:
  - `db.collection(collection).doc(documentId)` (Generic collections passed dynamically, e.g., `collection` parameter in `OSKDocumentController` methods) `functions/src/modules/core/controllers/document.controller.ts` (lines 34-261).
  - `users/{userId}/accesses` (Read/Write via `OSKAccessService.deleteAccessById` and `OSKUserAccessesController.default.getPerBuilding` inside `deleteQuickCodeSingleUse`) `functions/src/modules/core/services/pub_sub_receiver.service.ts` (lines 244-327).
- **Google Cloud Storage Paths**:
  - `bucket.file(path)` (Read/Write/Delete in `_uploadImage` and `_deleteImage`) `functions/src/modules/core/controllers/document.controller.ts` (lines 377-488).
- **Local File System (for secrets in emulator/dev)**:
  - `OSKSecretService.secretsFilePath` (Read/Write) `functions/src/modules/core/services/secret.service.ts` (lines 114-198).

---

#### access

This capability performs read, write, and delete operations on the following Firestore paths:

### `/users/{userId}/accesses`
- **Operation**: Write/Update
- **Scope**: Scoped to the authenticated user's accesses.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController.default._update|updateUserAccess|`users/${access.userId}/accesses`,access.buildingId,data|#1` ``. [Confirmed]

### `/buildings/{buildingId}/pincodes`
- **Operation**: Write/Delete
- **Scope**: Scoped to the building's active pincodes.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKBuildingPincodeController.default.delete|deleteBuildingPincodeAndMoveToTrash|pincodeId,buildingId|#1` ``. [Confirmed]

### `/buildings/{buildingId}/pincodesTrash`
- **Operation**: Write
- **Scope**: Scoped to the building's deleted pincodes.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKBuildingPincodeTrashController.default.set|addPincodeDocumentsToNonAppUserAccess|trashDoc|#1` ``. [Confirmed]

### `/suppliers/{supplierId}/staffMembers/{staffId}/pincodes`
- **Operation**: Write
- **Scope**: Scoped to the supplier staff member's pincodes.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKSupplierStaffPincodeService.createPincodeDocument|addPincodeDocumentsToSupplierStaffAccess|{                 pincode,                 supplierId,                 staffId,                 buildingId,                 accessId: newAccess.accessId,             }|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}/pincodes`
- **Operation**: Write
- **Scope**: Scoped to the non-app user's pincodes.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKNonAppUserPincodeService.createPincodeDocument|addPincodeDocumentsToNonAppUserAccess|{                 pincode,                 nonAppUserId,                 buildingId,                 unitId,                 accessId: newAccess.accessId,             }|#1` ``. [Confirmed]

### `/users/{userId}/pincodes`
- **Operation**: Write/Delete
- **Scope**: Scoped to the user's pincodes.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserPincodeController.default.delete|deletePincodeDocuments|pincodeId,userId|#1` ``. [Confirmed]

### `/users/{userId}/invitations`
- **Operation**: Read/Update
- **Scope**: Scoped to the user's invitations.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserInvitationController.default.update|createPincodeGuestDocuments|userId,invitationId,{                 pincode,             }|#1` ``. [Confirmed]

### `/users/{userId}/sentInvitations`
- **Operation**: Write
- **Scope**: Scoped to the user's sent invitations.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserSentInvitationController.save|createPincodeAnonymousDocuments|invitationObject.senderUserId,invitationObject.invitationId,{                 ...invitationObject,             }|#1` ``. [Confirmed]

### `/buildings/{buildingId}/units/{unitId}/invitations`
- **Operation**: Write
- **Scope**: Scoped to the building unit's invitations.
- **Evidence**: `` `call_expression|core|functions/src/modules/core/modules/access/services/access_pincode.service.ts|OSKUserInvitationBuildingController.default.save|createPincodeAnonymousDocuments|buildingId,unitId,invitationObject.invitationId,invitationObject|#1` ``. [Confirmed]

---

#### auth0

### Firestore Paths
This capability does not directly write to or own any Firestore collections [Confirmed]. However, it indirectly updates the `/users/{userId}` collection by invoking the `OSKUserController` from the `user` module to update user fields such as `auth0Sub` and `email` during token exchange [Inferred]:
- `/users/{userId}` `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKUserController.default.updateFields|exchangeAuth0Token|existingUid,{ auth0Sub: uid }|#1` ``

#### country

No direct Firestore paths are shown as being written or read directly by this capability's facts. It relies on the `user` module to fetch user records [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|OSKUserController.default.get|onGetCountries|userId|#1` ``).

---

#### public_key

This capability performs read, write, and update operations on dynamic Firestore collections passed as arguments to its controller methods. [Confirmed]

### Evidenced Firestore Operations
- **Dynamic Collection Read**: Reads public key documents from a dynamically specified collection path. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).get|addPublicKey||#1` ``)
- **Dynamic Collection Write/Update**: Writes or updates public key documents in a dynamically specified collection path. [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``)

Based on the system's architectural grounding documents, these dynamic collections map to:
- `/accessControlDevices/{id}/publicKeys` (from `firestore-schema.md`)
- `/users/{id}/devices/{id}/publicKeys` (from `firestore.rules.txt`)

---

#### storage

### Firestore Collections
- This capability **does not own or write** to any Firestore collections. It operates purely as a transient utility for Google Cloud Storage.

### Google Cloud Storage Paths
- **Interacted Paths**: Reads and writes metadata for files uploaded to the active Cloud Storage bucket. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file|processFile|object.name|#1`].
- **Operation Scope**: Modifies object metadata (`setMetadata`) to ensure correct MIME types are persisted. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file(object.name).setMetadata|processFile|{ contentType: contentType }|#1`].

---

### 7-8. API Endpoints & Firestore Triggers

*(Combined for this assembly-first experiment -- the capability contract reports these together; a future revision could split them if the combined section proves unwieldy.)*

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

### 9. Permissions & Security

**Cross-cutting risk callouts:**

*Note: This section contains only the cross-cutting risk callouts and active comparisons.*

- **Asymmetric RBAC Enforcement**: Only `storage` and `access` (via firestore rules) explicitly enforce RBAC permissions (`v1.org.edit`, `v1.org.buildings.edit`, `v1.org.buildings.view`) [Confirmed]. Other highly sensitive submodules like `auth0` (which manages MFA enrollment and disablement) and `public_key` (which registers and decompresses cryptographic keys) do not enforce explicit RBAC strings in their code, relying instead on parameter validation, custom decorators (`OSKUserSecurityChecks`), or firestore rules [Inferred].
- **Unattributed Security-Relevant Signals**:
  - `access` raises `permission-denied` errors with no explicit RBAC string check in the code itself, relying on decorators and firestore rules [Confirmed].
  - `storage` raises 2 distinct `permission-denied` errors (one for organization membership mismatch and one for lacking `v1.org.edit`) [Confirmed].
  - `auth0` relies on `OSKUserSecurityChecks` for `enableMfa` and `disableMfa` but does not map these to any RBAC roles in the `rbac-roles.json` schema (e.g., there is no role like `v1.admin.user.mfa`) [Confirmed].

**Per-capability evidence:**

#### _module_root

- No explicit permission strings are directly referenced in the code facts of this capability pack [Confirmed].
- Firestore rules (`firestore.rules.txt`) define access rules for `/settings/{docId}` and other collections, but the core module root itself does not enforce specific RBAC roles directly in its code.

---

#### access

### Permissions Referenced
- `v1.org.buildings.edit`: Checked in Firestore rules to authorize building unit and resident creation/modification `` `firestore.rules.txt` (lines 147-150) ``. [Confirmed]
- `v1.org.buildings.view`: Checked in Firestore rules to authorize building unit and resident reads `` `firestore.rules.txt` (lines 152-155) ``. [Confirmed]

### Security Checks & Decorators
- `OSKUserSecurityChecks`: Applied to `onCreatePincodeAnonymousAccess` to validate the user's identity and session `` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (line 284) ``. [Confirmed]
- `OSKVerifyAccessValid`: Applied to `onCreatePincodeAnonymousAccess` to verify that the requested access parameters are valid `` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (line 285) ``. [Confirmed]

### Permission Errors
- `permission-denied`: Thrown when a security check fails during pincode operations `` `functions/src/modules/core/modules/access/services/access_pincode.service.ts` (line 338) ``. [Confirmed]

---

#### auth0

The capability enforces security checks on its entry points:
- **Parameter Validation**: Uses `OSKSecurityChecks.checkParameters` to validate input parameters on callable functions `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKSecurityChecks.checkParameters|enableMfa|[{ name: 'context', value: context, type: 'object' }, { name: 'userId', value: request.userId, type: 'string' }]|#1` ``.
- **User Security Decorators**: The `enableMfa` and `disableMfa` endpoints are protected by the `@OSKUserSecurityChecks` decorator `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKUserSecurityChecks|enableMfa||#1` ``, `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKUserSecurityChecks|disableMfa||#1` ``.
- **Email Format Validation**: Uses `OSKSecurityChecks.validateEmailFormat` on email-related endpoints `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKSecurityChecks.validateEmailFormat|sendOTPEmail|request.email|#1` ``.

There are no direct references to RBAC permission strings (e.g., `v1.admin.*`) within the capability's evidence pack [Confirmed].

#### country

- **App Check Enforcement**: Both callable functions enforce App Check unless bypassed by the emulator environment [Confirmed] (`` `functions/src/modules/core/modules/country/index.ts` (lines 9-15) ``).
- **Authentication Check**: `onGetCountries` verifies the caller's identity using Firebase Auth (`auth().getUser(userId)`) [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/services/country.service.ts|auth().getUser|onGetCountries|userId|#1` ``).
- **RBAC Mismatches**: No specific RBAC permission strings are referenced in this capability's evidence.

---

#### public_key

No explicit RBAC permission strings are referenced or checked within the `public_key` capability's code. [Confirmed] 

However, according to `firestore.rules.txt`, access to the underlying public key collections is restricted as follows:
- `/accessControlDevices/{deviceId}/publicKeys/{keyType}`: Readable by any valid signed-in user; writes are completely blocked via Firestore rules. [Confirmed]
- `/users/{userId}/devices/{deviceId}/publicKeys/{keyType}`: Readable, creatable, and deletable only by the authenticated owner of the user account. [Confirmed]

---

#### storage

### Enforced Permissions
- **`v1.org.edit`**: Required to generate a signed upload URL for organization-scoped assets. [Confirmed: `permission_candidate|core|functions/src/modules/core/modules/storage/services/storage.service.ts|v1.org.edit|#1`].
  - *RBAC Cross-Check*: This matches the `v1.org.edit` permission defined in the RBAC roles document ("Allows to edit organization information").

### Security Decorators & Checks
- **`OSKUserSecurityChecks`**: Applied to `generateUploadSignedUrlCallable` with `{ checkUserIdMatch: false }` to ensure the request is authenticated, though the target user ID does not need to match the caller's ID (allowing admins to generate URLs for other contexts). [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKUserSecurityChecks|generateUploadSignedUrlCallable|{ checkUserIdMatch: false }|#1`].

### Security Errors
- Throws `permission-denied` HTTPS errors if:
  - The requesting user is not found within the specified organization. [Confirmed: `permission_error|core|functions/src/modules/core/modules/storage/services/storage.service.ts|permission-denied|#2`].
  - The user lacks the `v1.org.edit` permission. [Confirmed: `permission_error|core|functions/src/modules/core/modules/storage/services/storage.service.ts|permission-denied|#3`].

---

### 10. Cross-Module Relationships

*Note: This section contains only relationships directly supported by the deterministic Cross-Module Dependency Graph.*

#### Outbound Dependencies (Confirmed)
- **`access_control_device`**: Imports `OSKAccessControlDeviceAccessCommandDocument`, `OSKAccessControlDeviceStateDocument`, `OSKAccessControlDeviceSystemLogDocument`, `OSKAccessControlDevice`, `ActivityUserType`, `EnrichedActivityData`, and `OSKActivityEnrichmentService`.
- **`building`**: Imports `OSKBuildingActivity`, `OSKBuildingAccessDocument`, `OSKBuildingAccessesController`, `OSKNonAppUserPincodeController`, and `OSKNonAppUserPincodeDocument`.
- **`organization`**: Imports `OSKOrganizationUserAccessService` and `OSKOrganizationUserController`.
- **`settings`**: Imports `OSKConsolidatedRolesController`.
- **`supplier`**: Imports `OSKSupplierStaffPincodeController`, `OSKSupplierStaffPincodeDocument`, `OSKSupplierStaffPincodeService`, `OSKSupplierController`, `OSKSupplierStaffAccess`, `OSKSupplierStaffAccessService`, `OSKSupplierStaffController`, and `OSKSupplierStaffDocument`.
- **`user`**: Imports `OSKUserAuthorizedDoor`, `OSKAccessPubsubdMessage`, `OSKUserAccesses`, `OSKUserAccessesController`, `OSKUserAccessesDocument`, and `OSKAccess`.

#### Inbound Dependencies (Confirmed)
- **`access_control_device`**: Imports `OSKLoggingService`, `OSKDocumentAndMessageController`, and `OSKDocumentList`.
- **`admin`**: Imports `OSKDocumentController` and `OSKDocumentList`.
- **`apps`**: Imports `OSKDocumentController`, `OSKDocumentList`, `OSKDocumentUpdate`, `OSKQueryFilter`, and `OSKSupportedLanguage`.
- **`building`**: Imports `OSKDocumentController`, `OSKDocumentList`, `OSKDocumentUpdate`, `OSKQueryFilter`, `OSKUploadData`, `OSKDocument`, and `OSKStreetAddress`.
- **`call`**: Imports `OSKDocumentController`, `OSKDocumentUpdate`, and `OSKDocument`.
- **`organization`**: Imports `OSKDocumentController`, `OSKQueryFilter`, `OSKDocumentList`, `OSKDocumentListElement`, `OSKDocumentUpdate`, `OSKUploadData`, `OSKDocument`, and `OSKStreetAddress`.
- **`settings`**: Imports `OSKDocumentController` and `OSKDocument`.
- **`supplier`**: Imports `OSKDocumentController`, `OSKQueryFilter`, `OSKDocumentList`, `OSKDocumentUpdate`, `OSKDocument`, `OSKPhoneNumber`, and `OSKStreetAddress`.
- **`tasks`**: Imports `OSKLoggingService`.
- **`unit_management`**: Imports `OSKDocumentController`, `OSKDocument`, `OSKDocumentId`, `OSKDocumentList`, `OSKDocumentUpdate`, `OSKQueryFilter`, `OSKAccessMethod`, and `OSKAccessRightWithDates`.
- **`user`**: Imports `OSKDocumentController`, `OSKDocumentList`, and `OSKDocumentId`.

### 11. External Hooks

#### _module_root

- **Pub/Sub Topics**:
  - `topic` / `topicName` (`functions/src/modules/core/controllers/document_and_message.controller.ts` line 75, 156; `functions/src/modules/core/controllers/message.controller.ts` line 31) - Publishes messages to dynamically specified Pub/Sub topics.
- **Google Secret Manager**:
  - Interfaces with Google Secret Manager API (`@google-cloud/secret-manager`) to retrieve and create secrets (`functions/src/modules/core/services/secret.service.ts`).
- **Google Cloud Storage**:
  - Interfaces with Firebase Storage buckets to upload, resize, and delete images (`functions/src/modules/core/controllers/document.controller.ts`).
- **Auth0**:
  - Integrates with Auth0 via the `auth0` submodule triggers (`functions/src/modules/core/index.ts`).
- **ImageMagick (convert)**:
  - Spawns a child process to run `convert` (ImageMagick) for image resizing (`functions/src/modules/core/controllers/document.controller.ts` line 431).

---

#### access

### Pub/Sub Topics
- Publishes messages to dynamically resolved topics via `this.getTopicName()` (which maps to `topicName` in `access.controller.ts` line 71). [Confirmed]
- Publishes access updates to ACDs via `OSKAccessController.default.publishMessage` (using `buildingDoorACD.accessControlDeviceId` or `acdId` as the target identifier) `` `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts` (lines 136, 169, 192, 225) ``. [Confirmed]

### Environment Variables
- `OSK_FIREBASE_EMULATOR`: Referenced in `functions/src/modules/core/modules/access/index.ts` line 85 to conditionally enforce App Check. [Confirmed]

---

#### auth0

### Environment Variables & Secrets
The capability retrieves the following secrets dynamically via `OSKSecretService` `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 52-86) ``:
- `OSKApiName.Auth0Domain` (Auth0 Tenant Domain)
- `OSKApiName.Auth0ManagementDomain` (Auth0 Management API Domain)
- `OSKApiName.Auth0M2MClientId` (Machine-to-Machine Client ID)
- `OSKApiName.Auth0M2MClientSecret` (Machine-to-Machine Client Secret)

### External API Integrations
The capability communicates with the following external Auth0 endpoints using `axios` [Confirmed]:
- **JWKS URI**: `https://${OSKAuth0Service.AUTH0_DOMAIN}/.well-known/jwks.json` (for signature verification) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 78-83) ``.
- **Auth0 Management API**:
  - `https://${OSKAuth0Service.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/{userId}/authenticators` (to list/delete authenticators) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 574-588) ``.
  - `https://${OSKAuth0Service.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users` (to query users by email or phone number) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 677, 708) ``.
  - `https://${OSKAuth0Service.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/{userId}` (to update metadata or delete users) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 472, 646) ``.
- **Auth0 Authentication API**:
  - `https://${OSKAuth0Service.AUTH0_DOMAIN}/oauth/token` (to retrieve Management API access tokens) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 231-239) ``.
  - `https://${OSKAuth0Service.AUTH0_DOMAIN}/passwordless/start` (to send OTP emails) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 363-373) ``.
  - `https://${OSKAuth0Service.AUTH0_DOMAIN}/oauth/token` (to verify passwordless OTP codes) `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 408-419) ``.

#### country

- **Environment Variables**:
  - `OSK_FIREBASE_EMULATOR`: Used to conditionally bypass App Check enforcement during local development [Confirmed] (`` `call_expression|core|functions/src/modules/core/modules/country/index.ts|functionBuilder.runWith|getCallableFunctionTriggers|{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }|#1` ``).

---

#### public_key

No external hooks, Pub/Sub topics, environment variables, or external storage paths are directly evidenced within this capability's pack. [Confirmed]

---

#### storage

### Google Cloud Storage Integration
- **Signed URL Generation**: Integrates with the external Google Cloud Storage API via `firebase-admin` to issue short-lived, secure upload URLs. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/services/storage.service.ts|bucket.file(filePath).getSignedUrl|generateUploadSignedUrlCallable|options|#1`].
- **Object Metadata Updates**: Directly updates object metadata on the storage bucket during post-upload processing. [Confirmed: `call_expression|core|functions/src/modules/core/modules/storage/controllers/storage.controller.ts|storage().bucket(object.bucket).file(object.name).setMetadata|processFile|{ contentType: contentType }|#1`].

### Cloud Storage Event Ingress
- **`onFinalize` Event**: Acts as an external integration boundary, receiving asynchronous notifications from Google Cloud Storage when file uploads complete. [Confirmed: `service_method|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService|onFinalize|#1`].

---

### 12. Architectural Observations

- **Separation of Concerns**: `core` acts as a pure infrastructure and orchestration layer. It separates low-level database operations (`OSKDocumentController`), structured logging (`OSKLoggingService`), and secret management (`OSKSecretService`) from business-specific modules [Confirmed].
- **Coupling & Layering**: There is a highly coupled relationship between `core` and almost every other module in the repository. `core` is the most imported module (11 inbound modules) [Confirmed]. However, `core` also has outbound dependencies on 6 modules (`access_control_device`, `building`, `organization`, `settings`, `supplier`, `user`) [Confirmed]. This bidirectional coupling occurs because `core/access` orchestrates access rules that span across multiple domain entities (users, buildings, suppliers) [Inferred].
- **Orchestration Pattern**: `core/access` implements a classic Orchestration Service pattern. It coordinates specialized services across `building`, `user`, and `supplier` to synchronize access states without owning the primary domain data itself [Inferred].
- **Asynchronous Fan-out**: State changes in access rights are published asynchronously to edge hardware via GCP Pub/Sub, decoupling the synchronous HTTP/Callable API layer from physical device availability [Confirmed].

### 13. Risks & Open Questions

**Cross-cutting risks:**

*Note: This section contains only cross-cutting risks visible by comparing submodules or the module as a whole.*

- **Bidirectional Module Coupling**: The `core` module exhibits significant bidirectional coupling with `building`, `user`, `supplier`, and `organization` [Confirmed]. While these modules import `core` for foundational utilities (logging, document controllers), `core` also imports them to execute access orchestration [Confirmed]. This circular dependency structure complicates local testing and module isolation [Inferred].
- **Dynamic Collection Validation Risk**: `OSKDocumentController` and `OSKPublicKeysController` accept dynamic `collection` strings as arguments to perform Firestore reads, writes, and deletes [Confirmed]. If these strings are not strictly validated against an allowlist at runtime, it presents a risk of arbitrary collection access or write-leaking [Inferred].
- **Auth0 MFA Enrollment Gap**: The `auth0` submodule exposes `enableMfa` and `disableMfa` endpoints, but the actual enrollment of the SMS factor is not handled within the Cloud Functions code [Confirmed]. This creates an operational dependency on client-side execution or external workflows that is not explicitly validated by the backend [Inferred].
- **RBAC Mismatch on MFA Operations**: The `enableMfa` and `disableMfa` endpoints are protected by `@OSKUserSecurityChecks` but do not map to any explicit administrative or operational roles in `rbac-roles.json` [Confirmed]. If a Property Manager or Administrator needs to audit or manage MFA states, there is no granular RBAC permission backing this capability [Inferred].

**Per-capability open questions:**

#### _module_root

- How are the dynamic `collection` names passed to `OSKDocumentController` validated to prevent arbitrary collection writes?
- What is the exact structure of the Pub/Sub messages processed by `processPubSubMessage`? The schemas are not resolved in this pack.
- Are there any rate-limiting or security checks on the `processPubSubMessage` HTTPS endpoint, other than checking the request method?

#### access

- The exact structure of the Pub/Sub topic names is dynamically resolved via `getTopicName()` but not explicitly hardcoded in the evidence pack. [Unknown]
- The exact mapping of `OSKAccessMessageOperation` values (Insert, Update, Delete) to downstream MongoDB ingestion is handled by Cloud Run middleware, which is outside the scope of this Cloud Functions capability pack. [Unknown]

#### auth0

- **MFA Enrollment Flow**: While `enableMfa` updates user metadata to set `enable_mfa: true` `` `call_expression|core|functions/src/modules/core/modules/auth0/services/auth0.service.ts|OSKAuth0Service._updateUserMetadata|enableMfa|userId,{ enable_mfa: true }|#1` ``, the actual enrollment of the SMS factor appears to be handled externally or delegated to the client application, as there is no endpoint in this capability for initiating SMS enrollment.
- **Auth0 Domain Configuration**: The fallback error message mentions checking environment variables, but the implementation strictly retrieves these values from `OSKSecretService` `` `functions/src/modules/core/modules/auth0/services/auth0.service.ts` (lines 52-86) ``. It is unclear if environment variables are used as a fallback or if the error message is simply legacy text.

#### country

- **Country Data Source**: The evidence pack does not show where the country list is stored or how it is populated (e.g., whether it is hardcoded, fetched from a configuration file, or retrieved from a database) [Unknown].
- **User Verification Purpose**: It is unclear why `onGetCountries` performs a user lookup via `OSKUserController.default.get` if it only returns a list of countries. There may be country filtering based on the user's organization or location, but this is not evidenced in the pack [Unknown].

#### public_key

- **Invocation Context**: How are the dynamic `collection` and `documentId` parameters resolved and passed to `OSKPublicKeysController`? Since there are no direct HTTP entry points in this pack, it remains inferred that other modules (such as `user` or `access_control_device`) import and invoke this controller programmatically. [Inferred]
- **Error Handling**: What happens if the `crypto` module fails to parse a key that was otherwise successfully decompressed? The controller logs an error via `this.logger.logError`, but the exact exception propagation behavior is not fully detailed in the facts. [Inferred]

#### storage

- **Registered Triggers**: What specific file path patterns and post-processing callbacks are registered in `OSKStorageController.registeredTriggers`? The evidence shows that triggers are executed via `registeredTrigger.exec`, but the actual registration calls (e.g., for building images or user profiles) are not contained within this capability's evidence pack.
- **Upload Types**: What are the valid string values for `UploadType` (defined in `storage_document.model.ts`)? The request schema references this type, but its exact members are not detailed in the evidence.

### 14. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 6, 7-8, 9, and 11) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
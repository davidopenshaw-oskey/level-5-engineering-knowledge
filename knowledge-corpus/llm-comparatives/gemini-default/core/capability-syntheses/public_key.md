## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.465Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: public_key
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `public_key` capability provides centralized management for cryptographic public keys within the `core` module. It is responsible for adding, validating, decompressing, and deleting public keys associated with devices or users, persisting these keys directly to Firestore documents [Confirmed].

---

## 2. Primary Responsibilities
The capability is structured around the `OSKPublicKeysController` class, which implements the core business logic for public key operations:

- **Public Key Addition and Decompression (`addPublicKey`)**:
  - Validates incoming public keys using Node's native `crypto` library `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|crypto.createPublicKey|addPublicKey|publicKey|#1` ``.
  - Decompresses elliptic curve public keys represented as JSON Web Keys (JWK) by extracting and concatenating the `x` and `y` base64-encoded coordinates `` `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (lines 27-29)``.
  - Logs errors if the public key is invalid or cannot be decompressed `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|this.logger.logError|addPublicKey|'Invalid argument: Public key is not valid!',{ publicKey }|#1` ``.
  - Writes or updates the public key document in Firestore, supporting both initial creation (`set`) and incremental updates (`update`) `` `functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts` (lines 50, 62)``.
- **Public Key Deletion (`deletePublicKey`)**:
  - Removes a specific public key identified by its `keyId` from a Firestore document and updates the document state `` `controller_method|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|OSKPublicKeysController|deletePublicKey|#1` ``.

---

## 3. Public Interfaces (Controllers & Entry Points)
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

## 4. API Contracts & Firestore Triggers
- **API Contracts**: There are no `api_contract` facts present in this capability's evidence pack. The controller methods appear to be invoked programmatically by other modules rather than bound directly to HTTP endpoints within this submodule.
- **Firestore Triggers**: No Firestore triggers are owned or defined by this capability.

---

## 5. Data Ownership
This capability performs read and write operations on dynamic Firestore paths determined by the calling context (e.g., passing `collection` and `documentId` parameters to the controller):

- **Dynamic Collections (e.g., `/accessControlDevices/{id}/publicKeys` or `/users/{id}/devices/{id}/publicKeys`)**:
  - **Read**: Fetches existing public key documents `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).get|addPublicKey||#1` ``.
  - **Write (Create/Update)**: Writes new public key documents or updates existing ones `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).set|addPublicKey|newPublicKey|#1` ``.
  - **Delete**: Updates documents to remove specific keys `` `call_expression|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|db.collection(collection).doc(documentId).update|deletePublicKey|updatedPublicKey|#1` ``.

---

## 6. Outbound Coupling
The `public_key` capability depends on the following internal submodules and external libraries:

### Intra-Module Coupling (Within `core`)
- **Logger Submodule**: Imports `OSKLoggingService` from `@oskey/core/logger` to log validation and decompression errors `` `imports_dependency|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|@oskey/core/logger|#1` ``.
- **Core Root**: Imports from `@oskey/core` in `` `imports_dependency|core|functions/src/modules/core/modules/public_key/models/documents/public_keys_document.model.ts|@oskey/core|#1` ``.

### External Dependencies
- **Node.js `crypto`**: Used for public key validation and JWK exporting `` `imports_dependency|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|crypto|#1` ``.
- **`firebase-admin` / `firebase-admin/firestore`**: Used for Firestore database operations and `Timestamp` references `` `imports_dependency|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|firebase-admin/firestore|#1` ``.
- **`firebase-functions/v1`**: Imported in the controller file `` `imports_dependency|core|functions/src/modules/core/modules/public_key/controllers/public_keys.controller.ts|firebase-functions/v1|#1` ``.

---

## 7. Permissions & Security
No explicit RBAC permission strings (e.g., `v1.admin...`) are referenced directly within the source code of this capability's evidence pack [Confirmed]. 

However, cross-referencing the system's `firestore.rules.txt` document reveals that access to the underlying public key collections is strictly governed at the database layer:
- `/accessControlDevices/{deviceId}/publicKeys/{keyType}` allows reads for any valid user, but blocks all writes via rules (`allow write: if false;`) [Confirmed].
- `/users/{userId}/devices/{deviceId}/publicKeys/{keyType}` allows reads, creations, and deletions only for the authenticated user matching `userId` (`isAuthenticatedUser(userId)`) [Confirmed].

---

## 8. External Hooks
There are no external hooks, Pub/Sub topics, environment variables, or external storage paths defined or referenced within this capability's evidence pack [Confirmed].

---

## 9. Open Questions
- **Invocation Context**: Since there are no direct HTTP endpoints or Firestore triggers defined in this submodule, how is `OSKPublicKeysController` instantiated and invoked? Is it called as an internal service by the `access_control_device` and `user` modules when registering devices or mobile keys?
- **Decompression Algorithm**: The decompression logic assumes elliptic curve coordinates (`x` and `y`). Are there constraints on the specific curve supported (e.g., secp256r1 or ed25519), or does the `crypto` library handle this transparently?
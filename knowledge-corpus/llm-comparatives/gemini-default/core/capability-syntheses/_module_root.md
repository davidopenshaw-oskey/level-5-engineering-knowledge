## 0. Generation Metadata
- **runId**: 20260803_143350-1aa319b1
- **generatedAt**: 2026-08-03T14:33:56.447Z
- **repoName**: firebase-oskey-dev
- **targetModule**: core
- **capability**: _module_root
- **llmConfigKey**: gemini-default
- **llmProvider**: gemini
- **llmModel**: gemini-3.5-flash

---

## 1. Capability Summary
The `_module_root` capability of the `core` module serves as the foundational infrastructure layer for the Oskey platform. It provides centralized Firestore document controllers, Pub/Sub message publishing and ingestion, structured logging, Google Secret Manager integration, and image processing/thumbnail generation utilities. [Confirmed]

---

## 2. Primary Responsibilities

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

## 3. Public Interfaces (Controllers & Entry Points)

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

## 4. API Contracts & Firestore Triggers

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

## 5. Data Ownership

### Firestore Paths
This capability acts as a generic controller layer and does not "own" specific business collections, but its methods directly read, write, and delete documents across arbitrary Firestore paths passed dynamically (e.g., `collection` parameters). [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 34-289)

### Local File System Paths
- `OSKSecretService.secretsFilePath`: Used as a fallback local secrets file when running in local/fallback mode. [Confirmed] (Cite `functions/src/modules/core/services/secret.service.ts` line 132)
- `os.tmpdir()`: Used to store temporary images during thumbnail generation. [Confirmed] (Cite `functions/src/modules/core/controllers/document.controller.ts` lines 410-419)

---

## 6. Outbound Coupling

### Cross-Module Coupling
- **access_control_device** module:
  - Imports `OSKAccessControlDeviceAccessCommandsController` to save access commands. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 206)
  - Imports `OSKAccessControlDeviceStateController` to save device states. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 72)
  - Imports `OSKAccessControlDeviceSystemLogsController` to save system logs. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 84)
  - Imports `OSKActivityEnrichmentService` to enrich and validate activities. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 100)
- **building** module:
  - Imports `OSKBuildingActivitiesService` to process building activities. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 111)
  - Imports `OSKNonAppUserActivityService` and `OSKNonAppUserActivityAggregatesService` to handle non-app user activities. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` lines 164-168)
- **supplier** module:
  - Imports `OSKSupplierStaffActivityService` and `OSKSupplierStaffActivityAggregatesService` to handle supplier staff activities. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` lines 147-151)
- **user** module:
  - Imports `OSKUserActivitiesService` and `OSKUserActivityAggregatesService` to handle user activities. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` lines 130-134)
  - Imports `OSKUserAccessesController` to retrieve per-building accesses. [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 261)
  - Imports `@oskey/user/access` for entity message models. [Confirmed] (Cite `functions/src/modules/core/models/shared/entity_message.model.ts` line 1)

### Intra-Module Cross-Submodule Coupling
Depends on sibling submodules of `core`:
- **access** submodule: Imports `OSKAccessService` to delete accesses by ID [Confirmed] (Cite `functions/src/modules/core/services/pub_sub_receiver.service.ts` line 295) and aggregates its callable triggers. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 66)
- **auth0** submodule: Aggregates its callable triggers. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 68)
- **country** submodule: Aggregates its callable triggers. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 67)
- **storage** submodule: Aggregates its callable triggers. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 69)

---

## 7. Permissions & Security
- `getHttpsFunctionTriggers` enforces App Check in non-emulator environments: `{ enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR }`. [Confirmed] (Cite `functions/src/modules/core/index.ts` line 74)
- No specific RBAC permission strings (e.g., `v1.org.*` or `v1.admin.*`) are directly referenced or checked in this capability's code, as it acts as a low-level utility layer. [Confirmed]

---

## 8. External Hooks

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

## 9. Open Questions
- What is the exact structure of the Pub/Sub messages received by `processPubSubMessage`? The schema is not fully defined in the model properties of this pack. [Confirmed]
- How are the aggregated callable triggers from other submodules (`access`, `country`, `auth0`, `storage`) structured, and what permissions do they enforce? [Confirmed]
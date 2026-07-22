# Module Engineering Profile: core

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.377Z

---

## 1. Executive Summary

### Interpretation

The `core` module is the shared backend foundation for Oskey Cloud Functions. Evidence indicates that it provides generic Firestore document controllers, Pub/Sub message publishing, access orchestration, pincode lifecycle handling, Auth0 integration, storage upload support, public-key models/controllers, country lookup callables, logging, secret management, and inbound Pub/Sub processing for device-originated events.

Within the Oskey platform architecture, `core` sits below domain modules as a reusable infrastructure and orchestration layer. Its `access` submodule is more domain-specific than the rest of `core`: it coordinates access grants across user, building, supplier, non-app-user, pincode, device-token, and ACD Pub/Sub concerns. The rest of the module primarily supplies shared capabilities consumed by other modules.

### Evidence Used

- Architecture: Cloud Functions are the primary backend compute/API layer for mobile apps and PGO.
- Service: `OSKAccessService`, `functions/src/modules/core/modules/access/services/access.service.ts`
- Service: `OSKAccessMessagePublisherService`, `functions/src/modules/core/modules/access/services/access_message_publisher.service.ts`
- Service: `OSKPincodeService`, `functions/src/modules/core/modules/access/services/access_pincode.service.ts`
- Service: `OSKAuth0Service`, `functions/src/modules/core/modules/auth0/services/auth0.service.ts`
- Service: `OSKStorageService`, `functions/src/modules/core/modules/storage/services/storage.service.ts`
- Controller: `OSKDocumentController`, `functions/src/modules/core/controllers/document.controller.ts`
- Controller: `OSKMessageController`, `functions/src/modules/core/controllers/message.controller.ts`
- Controller: `OSKAccessController`, `functions/src/modules/core/modules/access/controllers/access.controller.ts`
- Manifest: `core-manifest.json` reports 58 files, 12 services, 6 controllers, 7 permission hints, and 0 Firestore triggers.

### Confidence

High.

---

## 2. Architectural Position

- Parent scope: Shared Cloud Functions backend infrastructure under `functions/src/modules/core`.
- Owned concepts: generic document and message controller primitives, access orchestration services, pincode generation/lifecycle utilities, Auth0 integration service, storage upload/signed URL support, public key models/controllers, logging, secret access, country callable support, and Pub/Sub receiver processing.
- Provided capabilities: Firestore CRUD/query abstractions, Pub/Sub publishing, access creation/update/deletion orchestration, pincode document management, ACD access message publishing, Auth0 token/MFA/profile operations, signed upload URL generation, storage finalization handling, secret read/write, structured logging, and device event ingestion routing.
- Downstream consumers or candidate consumers: domain modules in building, user, supplier, organization, settings/role, access control device, Cloud Storage, Pub/Sub, Auth0, Google Secret Manager, Firebase Auth, Firebase Storage, and ACD hardware sync consumers.
- Confidence: High for directly evidenced consumers and external hooks; medium for architecture-level hardware consumers because downstream hardware consumption is architectural context rather than direct module evidence.

### Interpretation

Evidence indicates that `core` is both a shared library-style module and a runtime integration module. Generic controllers and models are exported from `functions/src/modules/core/index.ts` for reuse. The `access` submodule exports callable triggers and services that perform cross-module orchestration. Auth0, storage, country, and access submodules expose callable trigger factories. Storage also exposes a Cloud Storage finalization path from `core/index.ts`.

### Evidence Used

- Exported Symbol: `OSKDocumentController`, `OSKDocumentAndMessageController`, `OSKMessageController`, `OSKStorageController`, `OSKSecretService`, `OSKAuth0Service`, `getCallableFunctionTriggers`, `getStorageTriggers`, `getHttpsFunctionTriggers`
- Exported Symbol: `OSKAccessService`, `OSKAccessMessagePublisherService`, `OSKPincodeService`, `OSKPincodeGenerationService`, `OSKAccessUpdateService`, `OSKAccessUtilsService`, `OSKAccessUtilsDatesService`
- Call: `exchangeAuth0TokenCallableFunction.getCallableFunctionTriggers(functionBuilder)`, `core/index.ts`, line 68
- Call: `storageCallableFunction.getCallableFunctionTriggers(functionBuilder)`, `core/index.ts`, line 69
- Call: `storage.bucket().object().onFinalize(OSKStorageService.onFinalize)`, `core/index.ts`, line 57
- Cross-module dependency: `access.service.ts` imports building non-app-user, user invitation, and user sent invitation controllers.
- Cross-module dependency: `pub_sub_receiver.service.ts` imports building activity, non-app-user activity, supplier staff activity, user activity, and `OSKAccessService`.

### Confidence

High.

---

## 3. Primary Responsibilities

- Capability: Provide generic Firestore document persistence primitives.
- Implemented by:
  * Controller: `OSKDocumentController`
  * Service: none; controller-level shared abstraction
  * Representative Service Method: not applicable
- Evidence:
  * Controller Method: `_get`, `_query`, `_queryOr`, `_queryWithPagination`, `_queryCollectionGroup`, `_create`, `_set`, `_add`, `_update`, `_delete`, `_listDocuments`, `_deleteAll`, `_deleteCollection`
  * Call: `Timestamp.now`, `document.controller.ts`, line 236
- Confidence: High.

- Capability: Provide Pub/Sub message publishing primitives.
- Implemented by:
  * Controller: `OSKMessageController`, `OSKDocumentAndMessageController`
  * Service: `OSKAccessMessagePublisherService` uses these primitives for access messages
  * Representative Service Method: `publishMessageToAllACDs`
- Evidence:
  * Controller Method: `OSKMessageController._publishMessage(topicName, orderingKey, body)`
  * Call: `pubSub.topic(topicName).publishMessage(...)`, `message.controller.ts`, line 31
  * Controller Method: `OSKDocumentAndMessageController._publishMessage(topic, orderingKey, body)`
  * Call: `this.messageController.publishMessage(topic, orderingKey, body)`, `document_and_message.controller.ts`, line 156
- Confidence: High.

- Capability: Create, update, retrieve, and delete access grants.
- Implemented by:
  * Controller: `OSKAccessController`
  * Service: `OSKAccessService`
  * Representative Service Method: `createAccess`, `updateAccess`, `deleteAccessById`, `getAllUserAccesses`, `getAllUserAccessesPerBuilding`
- Evidence:
  * Call: `OSKUserAccessesController.default.getAll(request.userId)`, `access.service.ts`, line 84
  * Call: `OSKUserAccessesController.default.getPerBuilding(request.userId, request.buildingId)`, `access.service.ts`, line 104
  * Call: `OSKUserController.default.getSafe(userId)`, `access.service.ts`, line 282
  * Call: `OSKBuildingController.default.getSafe(buildingId)`, `access.service.ts`, line 283
  * Call: `OSKBuildingAccessService.createOrUpdateBuildingAccess(...)`, `access.service.ts`, line 315
  * Call: `OSKUserAccessService.createOrUpdateUserAccess(...)`, `access.service.ts`, line 316
  * Call: `OSKAccessMessagePublisherService.publishMessageToAllACDs(...)`, `access.service.ts`, line 330
- Confidence: High.

- Capability: Manage pincode generation and pincode document lifecycle.
- Implemented by:
  * Controller: uses pincode controllers from building/user/supplier/non-app-user modules
  * Service: `OSKPincodeService`, `OSKPincodeGenerationService`
  * Representative Service Method: `generatePincode`, `addPincodeDocumentsToAccess`, `deleteBuildingPincodeAndMoveToTrash`, `deletePincodeDocuments`
- Evidence:
  * Call: `OSKPincodeGenerationService._generatePincodeFromSchema(...)`, `access_pincode_generation.service.ts`, line 30
  * Call: `OSKBuildingPincodeController.default.get(pincode, buildingId)`, `access_pincode_generation.service.ts`, line 118
  * Call: `OSKBuildingPincodeTrashController.default.get(pincode, buildingId)`, `access_pincode_generation.service.ts`, line 129
  * Call: `OSKBuildingPincodeTrashController.default.set(trashDoc)`, `access_pincode.service.ts`, line 646
  * Call: `OSKBuildingPincodeController.default.delete(pincodeId, buildingId)`, `access_pincode.service.ts`, line 677
  * Call: `OSKUserPincodeController.default.delete(...)`, `access_pincode.service.ts`, lines 694, 697, and 698
- Confidence: High.

- Capability: Synchronize access changes to ACD-facing Pub/Sub messages.
- Implemented by:
  * Controller: `OSKAccessController`
  * Service: `OSKAccessMessagePublisherService`
  * Representative Service Method: `publishMessageToAllACDs`, `publishMessageAccessInsertToACD`, `publishMessageAccessUpdateToACD`, `publishMessageAccessDeleteToACD`, `publishMessageAccessRecreateToACD`
- Evidence:
  * Environment Variable: `OSK_PUBSUB_TOPIC_ACD_ACCESSES`, `access.controller.ts`, line 75
  * Controller Method: `OSKAccessController.publishMessage(accessControlDeviceId, payload)`
  * Call: `OSKAccessController.default._publishMessage(topicName, accessControlDeviceId, payload)`, `access.controller.ts`, line 71
  * Call: `OSKAccessMessagePublisherService.publishMessageToAllACDs(...)`, `access.service.ts`, lines 194, 266, 330, 459
  * Architecture: access changes are published for ACD synchronization through Pub/Sub.
- Confidence: High.

- Capability: Receive and route inbound Pub/Sub/device event payloads.
- Implemented by:
  * Controller: downstream controllers from access control device, building, user, supplier, and non-app-user modules
  * Service: `PubSubMessageProcessor`
  * Representative Service Method: `processPubSubMessage` is inferred from call/log text, but not listed in `core-services.json` because `PubSubMessageProcessor` is not counted as one of the 12 services.
- Evidence:
  * Call: `OSKAccessControlDeviceStateController.default.save(...)`, `pub_sub_receiver.service.ts`, line 72
  * Call: `OSKAccessControlDeviceSystemLogsController.default.save(...)`, `pub_sub_receiver.service.ts`, line 84
  * Call: `OSKBuildingActivitiesService.ActivityReceivedForBuilding(...)`, `pub_sub_receiver.service.ts`, line 111
  * Call: `OSKUserActivitiesService.ActivityReceivedForUser(...)`, `pub_sub_receiver.service.ts`, line 130
  * Call: `OSKUserActivityAggregatesService.ActivityReceivedForUser(...)`, `pub_sub_receiver.service.ts`, line 134
  * Call: `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff(...)`, `pub_sub_receiver.service.ts`, line 147
  * Call: `OSKNonAppUserActivityService.ActivityReceivedForNonAppUser(...)`, `pub_sub_receiver.service.ts`, line 164
  * Call: `OSKAccessControlDeviceAccessCommandsController.default.save(...)`, `pub_sub_receiver.service.ts`, line 206
  * Call: `OSKAccessService.deleteAccessById(...)`, `pub_sub_receiver.service.ts`, line 295
- Confidence: High for routing targets; medium for exact trigger entry point because the evidence is call/log based rather than a trigger artefact.

- Capability: Integrate with Auth0 for token exchange, management API operations, OTP, MFA, email/phone lookup, and profile metadata updates.
- Implemented by:
  * Controller: callable trigger exports from `auth0/index.ts`
  * Service: `OSKAuth0Service`
  * Representative Service Method: `exchangeAuth0Token`, `getManagementApiAccessToken`, `sendOTPEmail`, `verifyOwnershipOTP`, `enableMfa`, `disableMfa`, `syncMfaPhoneNumberToProfile`, `updateUserEmail`, `updateUserPhoneNumber`
- Evidence:
  * Call: `OSKSecretService.getSecret(OSKApiName.Auth0Domain)`, `auth0.service.ts`, line 55
  * Call: `OSKSecretService.getSecret(OSKApiName.Auth0ManagementDomain)`, `auth0.service.ts`, line 56
  * Call: `OSKSecretService.getSecret(OSKApiName.Auth0M2MClientId)`, `auth0.service.ts`, line 59
  * Call: `OSKSecretService.getSecret(OSKApiName.Auth0M2MClientSecret)`, `auth0.service.ts`, line 60
  * Call: `jwt.decode(token, { complete: true })`, `auth0.service.ts`, line 122
  * Call: `jwt.verify(...)`, `auth0.service.ts`, line 127
  * Call: `axios.post`, `axios.get`, `axios.patch`, `axios.delete` across Auth0 management and OTP flows.
- Confidence: High.

- Capability: Provide storage signed upload URLs and storage finalization processing.
- Implemented by:
  * Controller: `OSKStorageController`
  * Service: `OSKStorageService`
  * Representative Service Method: `generateUploadSignedUrlCallable`, `onFinalize`
- Evidence:
  * Call: `OSKOrganizationUserController.default.get(request.organizationId, adminUserId)`, `storage.service.ts`, line 65
  * Call: `OSKConsolidatedRolesController.default.checkUserPermissions(orgUser.roles, ['v1.org.edit'])`, `storage.service.ts`, lines 74, 82, 88
  * Call: `bucket.file(filePath).getSignedUrl(options)`, `storage.service.ts`, line 121
  * Call: `OSKStorageController.default.processFile(object, context)`, `storage.service.ts`, line 131
  * Call: `storage().bucket(object.bucket).file(object.name).setMetadata(...)`, `storage.controller.ts`, line 52
- Confidence: High.

- Capability: Manage secrets and ACD private-key secret material.
- Implemented by:
  * Controller: none evidenced
  * Service: `OSKSecretService`
  * Representative Service Method: `getSecret`, `getPrivateKey`, `createSecret`, `createPrivateKeySecret`, `generateKeyId`
- Evidence:
  * Call: `this.client.accessSecretVersion(...)`, `secret.service.ts`, line 41
  * Call: `OSKSecretService.client.createSecret(...)`, `secret.service.ts`, lines 97 and 174
  * Call: `OSKSecretService.client.addSecretVersion(...)`, `secret.service.ts`, lines 102, 162, 179
  * Environment Variable: `GCLOUD_PROJECT`, `secret.service.ts`, lines 42, 89, 115
  * Environment Variable: `OSK_FIREBASE_EMULATOR`, `secret.service.ts`, lines 56 and 129
- Confidence: High.

### Interpretation

The confirmed responsibilities span shared infrastructure and access-control orchestration. The access services are the highest-risk operational surface because they coordinate persistent access ledgers, pincodes, device tokens, and Pub/Sub messages to ACDs. Other services are cross-cutting runtime infrastructure for Auth0, storage, logging, secrets, and country data.

### Evidence Used

- Service Methods: `OSKAccessService.createAccess`, `updateAccess`, `deleteAccessById`
- Service Methods: `OSKPincodeService.addPincodeDocumentsToAccess`, `deleteBuildingPincodeAndMoveToTrash`
- Service Methods: `OSKAccessMessagePublisherService.publishMessageToAllACDs`
- Service Methods: `OSKAuth0Service.exchangeAuth0Token`, `enableMfa`, `disableMfa`
- Service Methods: `OSKStorageService.generateUploadSignedUrlCallable`, `onFinalize`
- Controller Methods: `OSKDocumentController._query`, `_set`, `_update`, `_delete`; `OSKMessageController._publishMessage`

### Confidence

High.

---

## 4. Public Interfaces

### Interpretation

The module exposes a large public surface through index exports, callable trigger factories, controllers, services, and shared models. Public runtime entry points include callable trigger factories for access, Auth0, country, and storage, plus a storage finalization trigger registered from `core/index.ts`. Public library interfaces include generic document/message controllers, access services and models, Auth0 service and request models, public key models, storage request/response models, shared address/country/language models, secret service, and logging service.

### Evidence Used

- Exported Symbol: `getCallableFunctionTriggers`, `getStorageTriggers`, `getHttpsFunctionTriggers`, `core/index.ts`
- Exported Symbol: `OSKDocumentController`, `OSKDocumentAndMessageController`, `OSKMessageController`
- Exported Symbol: `OSKAccessService`, `OSKAccessController`, `OSKAccessMessagePublisherService`, `OSKPincodeService`, `OSKPincodeGenerationService`, `OSKAccessUpdateService`, `OSKAccessUtilsService`, `OSKAccessUtilsDatesService`
- Exported Symbol: `OSKAuth0Service`, `OSKAuth0TokenRequest`
- Exported Symbol: `OSKStorageService`, `UploadType`, `GenerateUploadUrlRequest`, `GenerateUploadUrlResponse`
- Exported Symbol: `OSKPublicKeysController`, `OSKPublicKeysDocument`, `OSKPublicKeyAddRequest`, `OSKPublicKeyDeleteRequest`
- Exported Symbol: `OSKApiName`, `OSKSecretService`
- Call: `storage.bucket().object().onFinalize(OSKStorageService.onFinalize)`, `core/index.ts`, line 57

### Confidence

High.

---

## 5. Internal Structure

### Interpretation

The module decomposes into:

- Root controllers: `document.controller.ts`, `document_and_message.controller.ts`, `message.controller.ts`
- Access submodule: access controller, access orchestration service, message publisher, pincode service, pincode generation service, access update service, utility services, and access models/typeguards
- Auth0 submodule: Auth0 callable exports, Auth0 request/response models, `OSKAuth0Service`
- Country submodule: country callable exports and country service
- Public key submodule: public-key controller and request/document models
- Storage submodule: storage controller, storage service, upload request/response models
- Root services: logging, secret management, Pub/Sub receiver processing
- Shared models: documents, Pub/Sub receiver payloads, coordinates, door info, phone number/country, street address, supported language, entity message options

The module is layered around generic primitives and specialized orchestration. Generic controllers are reused by module-specific controllers. Access services coordinate downstream domain controllers. Pub/Sub receiver processing routes inbound device events to domain activity services.

### Evidence Used

- Controller: `OSKDocumentController`
- Controller: `OSKDocumentAndMessageController`
- Controller: `OSKMessageController`
- Controller: `OSKAccessController`
- Controller: `OSKPublicKeysController`
- Controller: `OSKStorageController`
- Service: `OSKAccessService`
- Service: `OSKAccessMessagePublisherService`
- Service: `OSKPincodeService`
- Service: `OSKPincodeGenerationService`
- Service: `OSKAccessUpdateService`
- Service: `OSKAuth0Service`
- Service: `OSKStorageService`
- Service: `OSKLoggingService`
- Service: `OSKSecretService`
- Class: `PubSubMessageProcessor`

### Confidence

High.

---

## 6. Firestore & Data Ownership

### Interpretation

The `core` module owns generic Firestore access primitives, but it does not own a single root collection in the way a domain module does. Its `OSKDocumentController` accepts collection paths from callers and performs generic CRUD/query operations. The access submodule writes and updates records through controllers owned by user, building, supplier, and non-app-user modules.

Confirmed collection paths from schema and call evidence include:

- `/users/{id}/accesses`
- `/users/{id}/pincodes`
- `/users/{id}/devices/{id}/accessControlDeviceTokens`
- `/buildings/{id}/pincodes`
- `/buildings/{id}/pincode_trash` as architecture/evidence-backed candidate, though the provided schema search excerpt did not show the collection heading directly
- `/suppliers/{id}/staffMembers/{id}/pincodes`
- `/accessControlDevices/{id}/publicKeys`

Candidate persistence touched by inbound Pub/Sub routing includes ACD states, system logs, and access commands through `OSKAccessControlDeviceStateController`, `OSKAccessControlDeviceSystemLogsController`, and `OSKAccessControlDeviceAccessCommandsController`. Exact Firestore paths for those controller targets are not present in the supplied core evidence.

The access module implements denormalized access ledgers by calling both building-side and user-side access services/controllers. Architecture grounding and AST calls align that access grants are written to user-centric and building-centric ledgers and then published to ACDs.

### Evidence Used

- Controller Method: `OSKDocumentController._get(collection, documentId)`
- Controller Method: `OSKDocumentController._query(collection, queryFilters)`
- Controller Method: `OSKDocumentController._set(collection, documentId, content)`
- Controller Method: `OSKDocumentController._update(collection, documentId, content)`
- Controller Method: `OSKDocumentController._delete(collection, documentId)`
- Call: `OSKAccessController.default._update(\`users/${access.userId}/accesses\`, access.buildingId, data)`, `access.controller.ts`, line 66
- Schema: `/users/{id}/accesses`
- Schema: `/users/{id}/pincodes`
- Schema: `/users/{id}/devices/{id}/accessControlDeviceTokens`
- Schema: `/buildings/{id}/pincodes`
- Schema: `/suppliers/{id}/staffMembers/{id}/pincodes`
- Schema: `/accessControlDevices/{id}/publicKeys`
- Call: `OSKBuildingAccessService.createOrUpdateBuildingAccess(...)`, `access.service.ts`, line 315
- Call: `OSKUserAccessService.createOrUpdateUserAccess(...)`, `access.service.ts`, line 316
- Call: `OSKBuildingPincodeTrashController.default.set(trashDoc)`, `access_pincode.service.ts`, line 646
- Call: `OSKAccessControlDeviceStateController.default.save(...)`, `pub_sub_receiver.service.ts`, line 72
- Call: `OSKAccessControlDeviceSystemLogsController.default.save(...)`, `pub_sub_receiver.service.ts`, line 84
- Call: `OSKAccessControlDeviceAccessCommandsController.default.save(...)`, `pub_sub_receiver.service.ts`, line 206

### Confidence

High for generic controller and directly named schema paths; medium for exact ownership of downstream domain collections because the module reaches them through other modules' controllers.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/core-api-reference.md` document.

---

## 8. Firestore Triggers

### Interpretation

No Firestore document triggers are supplied for the `core` module. The trigger artefact is empty and the manifest reports `firestoreTriggers: 0`.

The module does expose other runtime triggers: a Cloud Storage object finalization handler and callable trigger factories. These are not Firestore document triggers and should not be classified as Firestore trigger evidence.

### Evidence Used

- Firestore Trigger Artefact: `core-firestore-triggers.json` is an empty array.
- Manifest: `core-manifest.json` reports `firestoreTriggers: 0`.
- Call: `storage.bucket().object().onFinalize(OSKStorageService.onFinalize)`, `core/index.ts`, line 57
- Exported Symbol: `getCallableFunctionTriggers`, `core/index.ts`, `access/index.ts`, `auth0/index.ts`, `country/index.ts`, `storage/index.ts`

### Confidence

High.

---

## 9. Permissions & Security

### Interpretation

Permission evidence is concentrated in storage upload URL generation. `OSKStorageService` loads an organization user, checks consolidated roles, and requires `v1.org.edit` for the evidenced storage request path. It raises `permission-denied` in several failure branches. The module also uses App Check or credential checks in access retrieval flows and relies on Auth0 JWT validation and management credentials for identity operations.

RBAC grounding confirms `v1.org.edit` exists under production-relevant `v1.org.admin` roles. The contract warns that `v1.admin` roles are work in progress, so admin-role definitions are contextual but not treated as implemented by this module.

### Evidence Used

- Permission: `v1.org.edit`, `storage.service.ts`, lines 75, 83, 89
- Permission Error: `permission-denied`, `access_pincode.service.ts`, line 338
- Permission Error: `permission-denied`, `storage.service.ts`, lines 54, 67, 94
- Call: `OSKOrganizationUserController.default.get(request.organizationId, adminUserId)`, `storage.service.ts`, line 65
- Call: `OSKConsolidatedRolesController.default.checkUserPermissions(orgUser.roles, ['v1.org.edit'])`, `storage.service.ts`, lines 74, 82, 88
- RBAC: `v1.org.edit` is defined in `rbac-roles.json`.
- Rules: `hasAuthorization(user, roleId)` helper exists in Firestore rules.
- Call: `jwt.verify(...)`, `auth0.service.ts`, line 127
- Call: `OSKSecretService.getSecret(OSKApiName.Auth0M2MClientSecret)`, `auth0.service.ts`, line 60
- Evidence: `OSKAccessService` logs failed App Check preconditions at `access.service.ts`, lines 76 and 96.

### Confidence

High for storage permission enforcement and Auth0 credential handling; medium for full access-module authorization because only selected errors/preconditions are present in the evidence.

---

## 10. Cross-Module Relationships

### Interpretation

The `core` module is intentionally coupled to several domain modules at orchestration boundaries. Access creation and deletion coordinate with user, building, supplier staff, non-app-user, user invitation, pincode, and device-token modules. Pub/Sub receiver processing coordinates with ACD, building activity, user activity, supplier staff activity, and non-app-user activity modules.

These relationships are directly evidenced by imports and service/controller calls. They should not be expanded into full platform workflows in this Pass 1 profile.

### Evidence Used

- Cross-module dependency: `access.service.ts` imports `OSKBuildingUnitNonAppUserController`, `OSKNonAppUserAccessService`, `OSKUserInvitationController`, `OSKUserInvitationBuildingController`, `OSKUserSentInvitationController`
- Cross-module dependency: `access_message_publisher.service.ts` imports `OSKNonAppUserPincodeController`
- Cross-module dependency: `pub_sub_receiver.service.ts` imports building activity, non-app-user activity, supplier staff activity, user activity, and `OSKAccessService`
- Call: `OSKSupplierController.default.getSafe(supplierId)`, `access.service.ts`, line 136
- Call: `OSKSupplierStaffController.default.getSafe(supplierId, staffId)`, `access.service.ts`, line 137
- Call: `OSKBuildingController.default.getSafe(buildingId)`, `access.service.ts`, lines 141 and 283
- Call: `OSKBuildingUnitNonAppUserController.default.getSafe(...)`, `access.service.ts`, line 217
- Call: `OSKUserDeviceService.createAccessDeviceToken(...)`, `access.service.ts`, line 433 and `access_update.service.ts`, line 204
- Call: `OSKBuildingActivitiesService.ActivityReceivedForBuilding(...)`, `pub_sub_receiver.service.ts`, line 111
- Call: `OSKUserActivitiesService.ActivityReceivedForUser(...)`, `pub_sub_receiver.service.ts`, line 130
- Call: `OSKSupplierStaffActivityService.ActivityReceivedForSupplierStaff(...)`, `pub_sub_receiver.service.ts`, line 147
- Call: `OSKNonAppUserActivityService.ActivityReceivedForNonAppUser(...)`, `pub_sub_receiver.service.ts`, line 164

### Confidence

High.

---

## 11. External Hooks

### Interpretation

Confirmed external/system boundaries include:

- Google Pub/Sub for outbound access messages.
- Cloud Storage and Firebase Storage for upload URLs, metadata processing, image thumbnail/delete support.
- Auth0 and Auth0 Management API via JWT/JWKS and Axios calls.
- Google Secret Manager for secret retrieval and creation.
- Firebase Auth for Auth0 token exchange and Firebase user creation/lookup.
- Environment-specific runtime controls through `OSK_FIREBASE_EMULATOR`, `FIREBASE_STORAGE_EMULATOR_HOST`, `GCLOUD_PROJECT`, `NODE_ENV`, and `OSK_PUBSUB_TOPIC_ACD_ACCESSES`.

ACDs are an architecture-grounded downstream candidate for access Pub/Sub messages; direct hardware consumption is not implemented in this module.

### Evidence Used

- Call: `pubSub.topic(topicName).publishMessage(...)`, `message.controller.ts`, line 31
- Environment Variable: `OSK_PUBSUB_TOPIC_ACD_ACCESSES`, `access.controller.ts`, line 75
- Call: `storage.bucket().object().onFinalize(...)`, `core/index.ts`, line 57
- Call: `bucket.file(filePath).getSignedUrl(options)`, `storage.service.ts`, line 121
- Call: `storage().bucket(object.bucket).file(object.name).setMetadata(...)`, `storage.controller.ts`, line 52
- Call: `jwt.decode(...)`, `jwt.verify(...)`, `auth0.service.ts`, lines 122 and 127
- Call: `OSKAuth0Service.jwksClient.getSigningKey(header.kid)`, `auth0.service.ts`, line 96
- Call: `axios.post`, `axios.get`, `axios.patch`, `axios.delete` in `auth0.service.ts`
- Call: `this.client.accessSecretVersion(...)`, `secret.service.ts`, line 41
- Call: `OSKSecretService.client.createSecret(...)`, `secret.service.ts`, lines 97 and 174
- Call: `getAuth()`, `auth0.service.ts`, line 140
- Environment Variable: `GCLOUD_PROJECT`, `OSK_FIREBASE_EMULATOR`, `FIREBASE_STORAGE_EMULATOR_HOST`, `NODE_ENV`

### Confidence

High.

---

## 12. Architectural Observations

### Interpretation

Evidence indicates these architectural characteristics:

- Shared controller abstraction: `OSKDocumentController` centralizes Firestore access patterns for modules that pass collection paths.
- Combined document/message abstraction: `OSKDocumentAndMessageController` composes Firestore document operations with Pub/Sub publishing.
- Orchestration service pattern: `OSKAccessService` coordinates user, building, supplier, non-app-user, pincode, device-token, and ACD message side effects.
- Paired document and denormalized ledger pattern: access grants are written to both user-side and building-side access stores, supported by AST calls and architecture grounding.
- Event-driven hardware synchronization: access changes publish ACD-bound messages via Pub/Sub.
- Inbound event routing: `PubSubMessageProcessor` translates incoming device/system/activity payloads into domain activity and ACD state/log/command persistence calls.
- Externalized credential management: `OSKSecretService` and `OSKAuth0Service` rely on Secret Manager and environment variables.
- Security layering: storage upload URLs require organization user lookup and `v1.org.edit` checks; Auth0 flows validate JWTs and retrieve management credentials.

### Evidence Used

- Controller: `OSKDocumentController`
- Controller: `OSKDocumentAndMessageController`
- Controller: `OSKMessageController`
- Service: `OSKAccessService`
- Service: `OSKAccessMessagePublisherService`
- Service: `OSKPincodeService`
- Service: `OSKSecretService`
- Service: `OSKAuth0Service`
- Service/Class: `PubSubMessageProcessor`
- Call: `OSKBuildingAccessService.createOrUpdateBuildingAccess(...)`
- Call: `OSKUserAccessService.createOrUpdateUserAccess(...)`
- Call: `OSKAccessMessagePublisherService.publishMessageToAllACDs(...)`
- Call: `pubSub.topic(topicName).publishMessage(...)`
- Permission: `v1.org.edit`
- Architecture: asynchronous data pipeline and Pub/Sub-based hardware synchronization are described in grounding docs and verified by AST evidence for access publishing.

### Confidence

High.

---

## 13. Risks & Open Questions

### Interpretation

- The `core` module is broad; some responsibilities are infrastructure primitives while others are business-critical access orchestration. Future synthesis may need to separate shared utilities from domain orchestration ownership.
- The Firestore path evidence in `core-evidence.json` is weak for access persistence because many paths are reached through imported controllers from other modules. Exact collection ownership should remain with those domain modules unless independently evidenced.
- `core-firestore-triggers.json` is empty, but `core` does expose a Cloud Storage `onFinalize` trigger. Trigger taxonomy should keep this distinct from Firestore document triggers.
- Inbound Pub/Sub processing is strongly evidenced by calls, but the exact HTTPS/Pub/Sub trigger registration for `PubSubMessageProcessor` is not included in the Firestore trigger artefact.
- The storage permission evidence is concrete for `v1.org.edit`; broader access-module authorization is less explicit in the supplied evidence and should be checked in caller modules and decorators.
- Pincode trash is confirmed by service calls and architecture grounding, but the generated schema search did not expose a `pincode_trash` collection heading in the excerpt used here.
- Several `v1.admin` RBAC roles exist in `rbac-roles.json`, but the contract states they are not currently implemented; they should not be treated as active `core` authorization evidence.

### Evidence Used

- Manifest: 58 files, 12 services, 6 controllers, 0 Firestore triggers
- Firestore Trigger Artefact: `core-firestore-triggers.json` is empty.
- Call: `storage.bucket().object().onFinalize(OSKStorageService.onFinalize)`, `core/index.ts`, line 57
- Call: `OSKBuildingAccessService.createOrUpdateBuildingAccess(...)`
- Call: `OSKUserAccessService.createOrUpdateUserAccess(...)`
- Call: `OSKBuildingPincodeTrashController.default.set(trashDoc)`
- Permission: `v1.org.edit`
- Permission Errors: `permission-denied`
- Contract note: `v1.admin` roles are work in progress and not currently implemented; `v1.org.admin` roles are production.

### Confidence

High.

---

## 14. Evidence References

- `ai-runtime/contracts/docs/Oskey Architecture.md`
- `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- `ai-runtime/contracts/docs/firestore-schema.md`
- `ai-runtime/contracts/docs/firestore.rules.txt`
- `ai-runtime/contracts/docs/firestore.indexes.json`
- `ai-runtime/contracts/docs/rbac-roles.json`
- `ai-runtime/contracts/module-engineering-profile/contract.md`
- `ai-runtime/contracts/module-engineering-profile/work-order.md`
- `ai-runtime/contracts/module-engineering-profile/rules.md`
- `ai-runtime/contracts/module-engineering-profile/persona.md`
- `ai-runtime/contracts/module-engineering-profile/output-schema.md`
- `output/knowledge-pipeline/modules/core/core-manifest.json`
- `output/knowledge-pipeline/modules/core/core-services.json`
- `output/knowledge-pipeline/modules/core/core-controllers.json`
- `output/knowledge-pipeline/modules/core/core-evidence.json`
- `output/knowledge-pipeline/modules/core/core-evidence-graph.json`
- `output/knowledge-pipeline/modules/core/core-firestore-triggers.json`

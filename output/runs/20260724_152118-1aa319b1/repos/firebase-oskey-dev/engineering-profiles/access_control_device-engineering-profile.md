<!-- © Oskey SAS. All rights reserved. -->

# Module Engineering Profile: access_control_device

*© Oskey SAS. All rights reserved.*

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `access_control_device` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152118-1aa319b1` |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Overall Confidence** | High |
| **Status** | Completed & Grounded |

---

## 1. Executive Summary

### Interpretation

The `access_control_device` module appears to implement the backend document model and runtime persistence for physical access control devices (ACDs) in the Oskey platform. It manages core device records, device configuration, public key material, runtime device state, command history, and system logs.

Evidence indicates this module is the authoritative source for ACD lifecycle data and operational metadata, and it exposes both document controllers and Firestore triggers for device creation, deletion, configuration updates, and key lifecycle events.

### Evidence Used

- Firestore schema: `/accessControlDevices`, `/accessControlDevices/{id}/configs`, `/accessControlDevices/{id}/publicKeys`.
- Controllers: `OSKAccessControlDeviceController`, `OSKAccessControlDeviceConfigController`, `OSKAccessControlDevicePublicKeysController`, `OSKAccessControlDeviceStateController`, `OSKAccessControlDeviceSystemLogsController`, `OSKAccessControlDeviceAccessCommandsController`.
- Services: `OSKAccessControlDeviceService`, `OSKAccessControlDeviceConfigService`, `OSKAccessControlDevicePublicKeysService`, `OSKNodeIoTAPIService`, `OSKActivityEnrichmentService`.
- Firestore triggers: document lifecycle handlers in `functions/src/modules/access_control_device/index.ts`.
- Permission evidence: permission-denied strings in `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts`.

### Confidence

Medium-High for data model, controller/service decomposition, and trigger ownership. Medium for broader platform integration details such as device synchronization and exact role enforcement.

---

## 2. Architectural Position

Include:

- Parent scope: Hardware device management and physical access infrastructure.
- Owned concepts: ACD device records, device configuration, device public keys, device runtime state, command history, and system logs.
- Provided capabilities: ACD lifecycle persistence, device configuration management, public-key lifecycle management, runtime state capture, command and logging persistence, and device-specific API transport support.
- Downstream consumers or candidate consumers: ACD hardware synchronization workflows, device firmware or cloud-facing IoT management, access orchestration services, and building/door assignment consumers.
- Confidence: Medium.

### Interpretation

The module is positioned as the ACD-specific backend domain for Oskey. It is focused on managing the persistent state of physical access control devices and their operational metadata, rather than application-level user access workflows.

The evidence suggests the module is a dedicated hardware document domain with both administrative controllers and runtime trigger handlers.

### Evidence Used

- Architecture: The Oskey platform defines Access Control Devices as physical entry hardware with cloud-backed management; source `Oskey Architecture.md`.
- Architecture: Hardware and access orchestration are centralized in cloud backend services; source `OSkey Backend Services & Data Architecture.md`.
- Firestore schema: `/accessControlDevices`, `/accessControlDevices/{id}/configs`, `/accessControlDevices/{id}/publicKeys`.
- Controller evidence: dedicated ACD controllers and node IoT API controllers.
- Service evidence: `OSKAccessControlDeviceService` and `OSKNodeIoTAPIService`.

### Confidence

Medium.

---

## 3. Primary Responsibilities

### Responsibility 1

- Capability: Persist and manage access control device records.
- Implemented by:
  * Controller: `OSKAccessControlDeviceController` (`functions/src/modules/access_control_device/controllers/access_control_device.controller.ts`).
  * Service: `OSKAccessControlDeviceService` (`functions/src/modules/access_control_device/services/access_control_device.service.ts`).
  * Representative Service Method: `onDocumentCreated` / `onDocumentDeleted`.
- Evidence:
  * Controller: `OSKAccessControlDeviceController` exposes ACD document operations.
  * Service: `OSKAccessControlDeviceService.onDocumentCreated` and `onDocumentDeleted` are bound to Firestore document triggers.
  * Firestore schema: `/accessControlDevices`.
- Confidence: High.

### Responsibility 2

- Capability: Manage device configuration persistence and configuration lifecycle events.
- Implemented by:
  * Controller: `OSKAccessControlDeviceConfigController` (`functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts`).
  * Service: `OSKAccessControlDeviceConfigService` (`functions/src/modules/access_control_device/services/access_control_device_config.service.ts`).
  * Representative Service Method: `onDocumentCreated` / `onDocumentUpdated` / `onDocumentDeleted`.
- Evidence:
  * Controller: `OSKAccessControlDeviceConfigController` exposes config document operations.
  * Service: `OSKAccessControlDeviceConfigService.onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted` appear in trigger evidence.
  * Firestore schema: `/accessControlDevices/{id}/configs`.
- Confidence: High.

### Responsibility 3

- Capability: Manage public key lifecycle for access control devices.
- Implemented by:
  * Controller: `OSKAccessControlDevicePublicKeysController` (`functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts`).
  * Service: `OSKAccessControlDevicePublicKeysService` (`functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts`).
  * Representative Service Method: `onDocumentCreated` / `onDocumentUpdated` / `onDocumentDeleted`.
- Evidence:
  * Controller: `OSKAccessControlDevicePublicKeysController` exposes public key document operations.
  * Service: `OSKAccessControlDevicePublicKeysService` is bound to Firestore lifecycle triggers.
  * Firestore schema: `/accessControlDevices/{id}/publicKeys`.
- Confidence: High.

### Responsibility 4

- Capability: Capture device runtime state and system log persistence.
- Implemented by:
  * Controller: `OSKAccessControlDeviceStateController` and `OSKAccessControlDeviceSystemLogsController`.
  * Service: `OSKActivityEnrichmentService` supports enriched activity data associated with ACD usage.
  * Representative Service Method: `enrichAndValidateActivity`.
- Evidence:
  * Controllers: ACD state and logs controllers expose save/get operations.
  * Service: `OSKActivityEnrichmentService` method suggests device activity enrichment.
  * Firestore schema: `accessControlDeviceStateDocument` and `accessControlDeviceSystemLogDocument` types appear in controller return types.
- Confidence: Medium.

### Responsibility 5

- Capability: Provide device-specific IoT API transport and device command orchestration.
- Implemented by:
  * Controller: `OSKAccessControlDeviceAccessCommandsController`.
  * Service: `OSKNodeIoTAPIService`.
  * Representative Service Method: `post` / `delete`.
- Evidence:
  * Controller: access command controller handles ACD command documents.
  * Service: `OSKNodeIoTAPIService` exists under `api/node-iot-api/services` and exposes `token`, `url`, `post`, `delete`.
- Confidence: Medium.

---

## 4. Public Interfaces

### Interpretation

The module exposes both administrative controllers and device-facing API controllers. It likely supports CRUD operations on ACD documents, config documents, public key documents, state documents, system logs, and device command documents.

### Evidence Used

- Controller evidence: `OSKAccessControlDeviceController`, `OSKAccessControlDeviceConfigController`, `OSKAccessControlDevicePublicKeysController`, `OSKAccessControlDeviceStateController`, `OSKAccessControlDeviceSystemLogsController`, `OSKAccessControlDeviceAccessCommandsController`, plus node IoT API controllers in `api/node-iot-api`.
- Method evidence: controller methods include `register`, `unregister`, `get`, `getSafe`, `save`, `getAll`, `getMostRecent`, `getDefaultKey`.
- Service evidence: `OSKNodeIoTAPIService` provides token and HTTP interactions.

### Confidence

Medium.

---

## 5. Internal Structure

### Interpretation

The module is structured around a small set of document domains and a supporting API transport service.

- Core ACD document domain is handled by `OSKAccessControlDeviceController` and `OSKAccessControlDeviceService`.
- Device configuration is managed by a dedicated controller/service pair.
- Public key lifecycle is isolated into its own controller/service pair.
- Runtime state and logging are managed by separate controllers, with enrichment handled by `OSKActivityEnrichmentService`.
- A `OSKNodeIoTAPIService` provides device or IoT transport capabilities, suggesting this module bridges persisted ACD state with external hardware or device APIs.

### Evidence Used

- Service evidence: the 5 service types defined in `access_control_device-services.json`.
- Controller evidence: 8 controller types in `access_control_device-controllers.json`.
- Trigger evidence: `access_control_device-firestore-triggers.json` connects document lifecycle events to service methods.

### Confidence

Medium-High.

---

## 6. Firestore & Data Ownership

### Interpretation

The module owns the root ACD document collection and two nested transactionally related subcollections for configuration and public key material. It also maintains runtime state and log documents, likely in separate document groups managed by dedicated controllers.

### Evidence Used

- Firestore schema: `/accessControlDevices`, `/accessControlDevices/{id}/configs`, `/accessControlDevices/{id}/publicKeys`.
- Controller type evidence: state and system log controllers reference `OSKAccessControlDeviceStateDocument` and `OSKAccessControlDeviceSystemLogDocument`.
- Document metadata: ACD records include `buildingDoorAssignment.buildingId` and `buildingDoorAssignment.doorId`.

### Confidence

High for primary persistence model. Medium for the exact relationship of runtime state/log persistence to device lifecycle.

---

## 7. API Endpoints

This section is detailed in the companion `api-reference/access_control_device-api-reference.md` document.

---

## 8. API Endpoints

This section is detailed in the companion `api-reference/access_control_device-api-reference.md` document.

---

## 9. Firestore Triggers

### Interpretation

This module exposes Firestore document triggers for ACD lifecycle events, config lifecycle events, and public key lifecycle events. These triggers are likely responsible for reacting to persisted ACD domain changes and initiating downstream synchronization or validation logic.

### Evidence Used

- Firestore trigger evidence: `output/knowledge-pipeline/modules/access_control_device/access_control_device-firestore-triggers.json`.

### Confirmed Triggers

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `accessControlDevicePath`
  - Handler: `OSKAccessControlDeviceService.onDocumentCreated`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: bootstrap or synchronize new ACD documents after creation.
  - Confidence: High.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `accessControlDevicePath`
  - Handler: `OSKAccessControlDeviceService.onDocumentDeleted`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: cleanup or deregistration when an ACD document is removed.
  - Confidence: High.

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `accessControlDeviceConfigPath`
  - Handler: `OSKAccessControlDeviceConfigService.onDocumentCreated`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: handle new device configuration persistence and related sync.
  - Confidence: High.

- Firestore Trigger: `onUpdate`
  - Path or Path Variable: `accessControlDeviceConfigPath`
  - Handler: `OSKAccessControlDeviceConfigService.onDocumentUpdated`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: react to configuration changes for ACD devices.
  - Confidence: High.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `accessControlDeviceConfigPath`
  - Handler: `OSKAccessControlDeviceConfigService.onDocumentDeleted`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: handle config removal or lifecycle end.
  - Confidence: High.

- Firestore Trigger: `onCreate`
  - Path or Path Variable: `accessControlDevicePublicKeysPath`
  - Handler: `OSKAccessControlDevicePublicKeysService.onDocumentCreated`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: manage new device public key material.
  - Confidence: High.

- Firestore Trigger: `onDelete`
  - Path or Path Variable: `accessControlDevicePublicKeysPath`
  - Handler: `OSKAccessControlDevicePublicKeysService.onDocumentDeleted`
  - Source File: `functions/src/modules/access_control_device/index.ts`
  - Likely role: clean up public key material.
  - Confidence: High.

### Additional Trigger-Related Evidence

- Service log entries in `functions/src/modules/access_control_device/services/access_control_device.service.ts` show `OSKAccessControlDeviceService.logger.logError` on create/delete triggers, confirming runtime trigger handling and error logging.

### Confidence

Medium-High.

---

## 10. Permissions & Security

### Interpretation

The module includes explicit permission enforcement for public key management and is aligned with Oskey RBAC definitions for access control device administration.

### Evidence Used

- Permission evidence: `permission-denied: You are not part of an organization with the role accessControlDevice.publicKey.maintain` from `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts`.
- RBAC reference: `ai-runtime/contracts/docs/rbac-roles.json` defines `v1.admin.accessControlDevice.*` roles such as `view`, `register`, `edit`, and `delete`.

### Confidence

Medium.

---

## 11. Cross-Module Relationships

### Interpretation

The module is directly related to building and door scope through ACD assignment metadata, and it participates in activity enrichment that spans device operations.

### Evidence Used

- Document metadata: `accessControlDevice` records include `buildingDoorAssignment.buildingId` and `buildingDoorAssignment.doorId`.
- Service evidence: `OSKActivityEnrichmentService.enrichAndValidateActivity` suggests integration with activity or event services.

### Confidence

Medium.

---

## 12. External Hooks

### Interpretation

The module includes candidate external hook surface area for ACD hardware and device API transport.

### Evidence Used

- Service evidence: `OSKNodeIoTAPIService` in `functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts`.
- Controller evidence: node IoT API controllers under `functions/src/modules/access_control_device/api/node-iot-api/controllers`.
- Firestore schema: device config fields such as `cloud.publicKey`, `homeScreen.message`, and `doorInfo` suggest hardware-facing structural data.

### Confidence

Medium.

---

## 13. Architectural Observations

### Interpretation

The module demonstrates a clear separation between persisted ACD domain data and runtime trigger handlers. It groups device lifecycle, configuration, key management, status, logs, and command operations into distinct controller/service pairs.

### Evidence Used

- Manifest summary: 33 files, 14 classes, 61 methods, 12 firestore hints, 20 external hooks, 9 firestore triggers.
- Controller and service decomposition aligned to distinct domain areas.
- Firestore schema and trigger evidence show a document-first persistence model.

### Confidence

Medium.

---

## 14. Risks & Open Questions

### Interpretation

There is strong evidence for module-level device persistence, but some platform integration details remain uncertain.

### Evidence Used

- Permission evidence is limited to a denied role string in public key handling.
- Trigger artefacts provide handler names but not explicit Firestore path patterns.

### Open Questions

- What are the exact path patterns for `accessControlDevicePath`, `accessControlDeviceConfigPath`, and `accessControlDevicePublicKeysPath`?
- Does the module include direct enforcement of `v1.admin.accessControlDevice.*` roles, or are those handled by upstream authorization middleware?
- Is `OSKNodeIoTAPIService` also used for external device transport beyond internal backend coordination?
- How are runtime state and logs persisted in Firestore relative to the primary `/accessControlDevices` domain?

### Confidence

Medium.

---

## 15. Evidence References

- Firestore schema: `ai-runtime/contracts/docs/firestore-schema.md`
- RBAC reference: `ai-runtime/contracts/docs/rbac-roles.json`
- Architecture: `ai-runtime/contracts/docs/Oskey Architecture.md`
- Architecture: `ai-runtime/contracts/docs/OSkey Backend Services & Data Architecture.md`
- Module manifest: `output/knowledge-pipeline/modules/access_control_device/access_control_device-manifest.json`
- Module controllers: `output/knowledge-pipeline/modules/access_control_device/access_control_device-controllers.json`
- Module services: `output/knowledge-pipeline/modules/access_control_device/access_control_device-services.json`
- Module evidence: `output/knowledge-pipeline/modules/access_control_device/access_control_device-evidence.json`
- Firestore triggers: `output/knowledge-pipeline/modules/access_control_device/access_control_device-firestore-triggers.json`
- Permission evidence: `functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts`

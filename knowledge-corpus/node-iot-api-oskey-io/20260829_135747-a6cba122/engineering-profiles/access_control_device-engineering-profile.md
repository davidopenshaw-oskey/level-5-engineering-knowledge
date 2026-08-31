### 0. Generation Metadata

- runId: 20260829_135747-a6cba122
- repoName: node-iot-api-oskey-io
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `access_control_device` module is the core IoT API service designed to manage physical access control devices (FactId:#001) (FactId:#002) (FactId:#003) (FactId:#004) (FactId:#005) (**Confirmed**). It provides comprehensive capabilities for managing device configurations, firmware versioning, access rights synchronization (via Digicom and Intercom protocols), activity logging (including BLE, pincode, face recognition, and signaling), and intercom directory management (**Confirmed**). The module relies heavily on Google Cloud Pub/Sub for asynchronous event-driven synchronization and MongoDB for persistence (**Confirmed**).

### 2. Architectural Position

This module acts as the central IoT gateway and API handler for physical access control devices (**Inferred**). It sits between physical hardware devices (which pull configurations, firmwares, and access lists, and push activity logs) and backend cloud services (which publish configuration and access updates via Pub/Sub) (**Inferred**).

### 3. Primary Responsibilities

#### _module_root

*   Provides a centralized logging service (`OSKLoggingService`) to format and output logs with severity levels (FactId:#006) (FactId:#007) (FactId:#008) (**Confirmed**).
*   Provides a centralized Google Cloud Pub/Sub service wrapper (`OSKPubSubService`) to manage topics, subscriptions, and message publishing (FactId:#009) (FactId:#010) (FactId:#011) (**Confirmed**).
*   Implements shared delta comparison and merging algorithms (`compareAccessLists`, `mergeDeltas`) to track state changes (added, changed, removed) for synchronization (FactId:#012) (FactId:#013) (**Confirmed**).
*   Defines custom HTTP error structures (`CustomHttpError`) (FactId:#014) (**Confirmed**).
*   Acts as the composition root (`src/v1/index.ts`) to register and expose routes for all submodules (FactId:#001) (FactId:#002) (FactId:#003) (FactId:#004) (FactId:#005) (**Confirmed**).

#### accesses

*   Retrieves and paginates access control lists for specific devices (FactId:#015) (FactId:#016) (**Confirmed**).
*   Manages access records (create, update, delete, recreate, insert array) in the database (FactId:#017) (FactId:#018) (FactId:#019) (FactId:#020) (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize accesses (insert, update, delete, recreate) (FactId:#021) (FactId:#022) (FactId:#023) (FactId:#024) (**Confirmed**).
*   Computes and retrieves access synchronization deltas (Digicom and Intercom) since a given timestamp (FactId:#025) (FactId:#026) (FactId:#027) (**Confirmed**).
*   Retrieves valid pincodes associated with a device's accesses (FactId:#028) (FactId:#029) (**Confirmed**).

#### activities

*   Ingests activity logs from devices via Digicom or Intercom protocols (FactId:#030) (FactId:#031) (**Confirmed**).
*   Transforms incoming raw activity payloads into standardized database records (`OSKAcdActivityRecord`) (FactId:#032) (FactId:#033) (FactId:#034) (FactId:#035) (**Confirmed**).
*   Saves activity records to the database (FactId:#036) (**Confirmed**).
*   Publishes ingested activity events to a Pub/Sub topic (`accessControlDevice_activities`) for downstream consumption (FactId:#037) (FactId:#038) (**Confirmed**).

#### configs

*   Retrieves configuration settings for a specific device, optionally filtering by a timestamp (FactId:#039) (FactId:#040) (FactId:#041) (FactId:#042) (**Confirmed**).
*   Creates, updates, and deletes device configurations in the database (FactId:#043) (FactId:#044) (FactId:#045) (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize configuration changes (insert, update, delete) (FactId:#046) (FactId:#047) (FactId:#048) (**Confirmed**).

#### firmwares

*   Retrieves the current firmware version and URL for a specific access control device (FactId:#049) (FactId:#050) (FactId:#051) (**Confirmed**).

#### intercom_entries

*   Retrieves intercom directory entries for a specific device (FactId:#052) (FactId:#053) (**Confirmed**).
*   Creates, updates, and manages intercom entries in the database (FactId:#054) (FactId:#055) (FactId:#056) (**Confirmed**).
*   Tracks, retrieves, and acknowledges intercom entry synchronization deltas using a base delta controller (FactId:#057) (FactId:#058) (FactId:#059) (FactId:#060) (FactId:#061) (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize intercom entries (create, update, delete) (FactId:#062) (FactId:#063) (FactId:#064) (**Confirmed**).

### 4. Public Interfaces (Route Handlers & Controllers)

#### _module_root

(no exported route handler or controller classes evidenced in this capability's pack)

#### accesses

**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)
- **OSKAccessControlDeviceAccessRouteHandler** (FactId:#065)
  - `getAccessSyncDeltasDigicom` (GET /access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp) (FactId:#066)
  - `getAccessSyncDeltasIntercom` (GET /access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp) (FactId:#067)
  - `getAllPerAccessControlDevice` (GET /access-control-devices/:accessControlDeviceId/accesses) (FactId:#068)
  - `getAllPerAccessControlDevicePaginated` (GET /access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp) (FactId:#069)
  - `getPincodesPerAccessControlDevice` (GET /access-control-devices/:accessControlDeviceId/accesses/pincodes) (FactId:#070)
  - `processAccessPubSubMessage` (POST /access-control-devices/pubsub/accesses) (FactId:#071)

**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)
- **OSKAccessControlDeviceAccessController** (FactId:#072)
  - `create` (FactId:#073)
  - `deleteAccess` (FactId:#074)
  - `deleteAllAccessesPerAccessControlDevice` (FactId:#075)
  - `get` (FactId:#076)
  - `getPaginated` (FactId:#077)
  - `reCreate` (FactId:#078)
  - `update` (FactId:#079)
- **OSKAccessControlDeviceAccessSyncController** (FactId:#080)
  - `getMergedDeltasSince` (FactId:#081)
  - `updateFromFullList` (FactId:#082)

#### activities

**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)
- **OSKAccessControlDeviceActivitiesRouteHandler** (FactId:#083)
  - `processActivitiesDigicom` (POST /access-control-devices/:accessControlDeviceId/activities/digicom) (FactId:#030)
  - `processActivitiesIntercom` (POST /access-control-devices/:accessControlDeviceId/activities/intercom) (FactId:#031)

**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)
- **OSKAccessControlDeviceActivitiesController** (FactId:#084)
  - `createActivity` (FactId:#085)

#### configs

**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)
- **OSKConfigsRouteHandler** (FactId:#086)
  - `getConfig` (GET /access-control-devices/:accessControlDeviceId/config) (FactId:#042)
  - `getConfigAfterTimestamp` (GET /access-control-devices/:accessControlDeviceId/config/:timestamp) (FactId:#041)
  - `processConfigPubSubMessage` (POST /access-control-devices/pubsub/configs) (FactId:#087)

**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)
- **OSKAccessControlDeviceController** (FactId:#088)
  - `create` (FactId:#089)
  - `delete` (FactId:#090)
  - `get` (FactId:#091)
  - `update` (FactId:#092)

#### firmwares

**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)
- **OSKAccessControlDeviceFirmwaresRouteHandler** (FactId:#093)
  - `getFirmwarePerAccessControlDevice` (GET /access-control-devices/:accessControlDeviceId/firmwares) (FactId:#051)

**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)
- **OSKAccessControlDeviceFirmwareController** (FactId:#094)
  - `get` (FactId:#095)

#### intercom_entries

**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)
- **OSKAccessControlDeviceIntercomEntryRouteHandler** (FactId:#096)
  - `getAllUnacknowledgedIntercomEntriesDeltas` (GET /access-control-devices/:accessControlDeviceId/intercom-entries-deltas) (FactId:#060)
  - `getIntercomEntry` (GET /access-control-devices/:accessControlDeviceId/intercom-entries) (FactId:#053)
  - `postIntercomEntryDeltaAcknowledgement` (POST /access-control-devices/:accessControlDeviceId/intercom-entries-deltas) (FactId:#061)
  - `processIntercomEntryPubSubMessage` (POST /access-control-devices/pubsub/intercom-entries) (FactId:#097)

**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)
- **OSKAccessControlDeviceDeltasBaseController** (FactId:#098)
  - `acknowledgeDelta` (FactId:#099)
  - `create` (FactId:#100)
  - `getAll` (FactId:#101)
  - `getAllUnacknowledged` (FactId:#102)
  - `getMostRecentDeltaBeforeTimestamp` (FactId:#103)
  - `setLastAcknowledgedDelta` (FactId:#104)
- **OSKAccessControlDeviceIntercomController** (FactId:#105)
  - `create` (FactId:#106)
  - `get` (FactId:#107)
  - `update` (FactId:#108)

### 5. Route Definitions & Request Contracts

#### _module_root

No routes are registered directly under `_module_root` (**Confirmed**).

#### accesses

*   `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp` | `getAccessSyncDeltasDigicom` | No schema (FactId:#066)
*   `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp` | `getAccessSyncDeltasIntercom` | No schema (FactId:#067)
*   `GET /access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp` | `getAllPerAccessControlDevicePaginated` | No schema (FactId:#069)
*   `GET /access-control-devices/:accessControlDeviceId/accesses/digicom` | `getAllPerAccessControlDevicePaginated` | No schema (FactId:#109)
*   `GET /access-control-devices/:accessControlDeviceId/accesses/pincodes` | `getPincodesPerAccessControlDevice` | No schema (FactId:#070)
*   `GET /access-control-devices/:accessControlDeviceId/accesses` | `getAllPerAccessControlDevice` | No schema (FactId:#068)
*   `POST /access-control-devices/pubsub/accesses` | `processAccessPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) (FactId:#071)
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) (FactId:#110)
        *   `message` (any, required) (FactId:#111)
        *   `subscription` (string, required) (FactId:#112)

#### activities

*   `POST /access-control-devices/:accessControlDeviceId/activities/digicom` | `processActivitiesDigicom` | `OSKAcdReceivedDigicomActivitiesSchema` (FactId:#030)
*   `POST /access-control-devices/:accessControlDeviceId/activities/intercom` | `processActivitiesIntercom` | `OSKAcdReceivedIntercomActivitySchema` (FactId:#031)
    *   **Request Schema (`OSKAcdReceivedIntercomActivitySchema`)**:
        *   `accessControlDeviceId` (string, required) (FactId:#113)
        *   `accessId` (unknown, optional) (FactId:#114)
        *   `activityType` (string, required) (FactId:#115)
        *   `deviceId` (unknown, optional) (FactId:#116)
        *   `error` (unknown, optional) (FactId:#117)
        *   `pincode` (unknown, optional) (FactId:#118)
        *   `success` (boolean, required) (FactId:#119)
        *   `timestamp` (string, required) (FactId:#120)
        *   `timestampKeystrokes` (unknown, optional) (FactId:#121)
        *   `userId` (unknown, optional) (FactId:#122)
*   `POST /access-control-devices/:accessControlDeviceId/activities` | `processActivitiesIntercom` | `OSKAcdReceivedIntercomActivitySchema` (FactId:#123)

#### configs

*   `GET /access-control-devices/:accessControlDeviceId/config/:timestamp` | `getConfigAfterTimestamp` | No schema (FactId:#041)
*   `GET /access-control-devices/:accessControlDeviceId/config` | `getConfig` | No schema (FactId:#042)
*   `POST /access-control-devices/pubsub/configs` | `processConfigPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) (FactId:#087)
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) (FactId:#110)
        *   `message` (any, required) (FactId:#111)
        *   `subscription` (string, required) (FactId:#112)

#### firmwares

*   `GET /access-control-devices/:accessControlDeviceId/firmwares` | `getFirmwarePerAccessControlDevice` | No schema (FactId:#051)

#### intercom_entries

*   `GET /access-control-devices/:accessControlDeviceId/intercom-entries-deltas` | `getAllUnacknowledgedIntercomEntriesDeltas` | No schema (FactId:#060)
*   `POST /access-control-devices/:accessControlDeviceId/intercom-entries-deltas` | `postIntercomEntryDeltaAcknowledgement` | `postIntercomEntryDeltaAcknowledgementSchema` (FactId:#061)
    *   **Request Schema (`postIntercomEntryDeltaAcknowledgementSchema`)**:
        *   `acknowledgedDeltaIds` (array, required) (FactId:#124)
*   `GET /access-control-devices/:accessControlDeviceId/intercom-entries` | `getIntercomEntry` | No schema (FactId:#053)
*   `POST /access-control-devices/pubsub/intercom-entries` | `processIntercomEntryPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) (FactId:#097)
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) (FactId:#110)
        *   `message` (any, required) (FactId:#111)
        *   `subscription` (string, required) (FactId:#112)

### 6. Pub/Sub Behavior

#### _module_root

*   **Outbound Publishing**:
    *   `OSKPubSubService.publishMessage` publishes messages to Google Cloud Pub/Sub topics (FactId:#011) (**Confirmed**).
*   **Inbound Receiving**:
    *   No inbound Pub/Sub push routes are handled directly at the root (**Confirmed**).

#### accesses

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.filter"]` (FactId:#021) |
    | `insert` | `resolved` | `["OSKLoggerController.default.info"]` (FactId:#022) |
    | `recreate` | `resolved` | `["OSKLoggerController.default.info"]` (FactId:#023) |
    | `update` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.find","oldAccesses.map","OSKAccessControlDeviceAccessRouteHandler._isAccessSemanticallyEqual","OSKLoggerController.default.debug"]` (FactId:#024) |

#### activities

*   **Outbound Publishing**:
    *   Topic: `accessControlDevice_activities` | Confidence: **Confirmed** | Detection Method: `pubsub_publish_call` / `external_hook` (FactId:#037) (FactId:#038)
*   **Inbound Receiving**: None evidenced (**Confirmed**).

#### configs

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKAccessControlDeviceController.default.delete","res.status(209).send","res.status"]` (FactId:#046) |
    | `insert` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` (FactId:#047) |
    | `update` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` (FactId:#048) |

#### firmwares

None evidenced (**Confirmed**).

#### intercom_entries

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `create` | `resolved` | `["OSKAccessControlDeviceIntercomController.default.create","res.status(201).send","res.status"]` (FactId:#062) |
    | `delete` | `resolved` | `["res.status(200).send","res.status"]` (FactId:#063) |
    | `update` | `resolved` | `["isPubsubPayloadUpdate","OSKAccessControlDeviceIntercomEntryRouteHandler.convertIntercomDates","OSKAccessControlDeviceIntercomController.default.update","res.status(201).send","res.status"]` (FactId:#064) |

### 7. Data Ownership

**Ownership conclusion:**

Based on the database operations, the module interacts with several MongoDB collections:
*   `accessControlDeviceAccesses`: Primarily owned by the `accesses` submodule, which manages creation, updates, and deletion of access rights (FactId:#125) (FactId:#126) (**Confirmed**). However, the `firmwares` submodule also queries this collection (FactId:#127) (**Confirmed**). This is a highly likely copy-paste defect in `OSKAccessControlDeviceFirmwareController.get`, which should query a firmware-specific collection rather than accesses (**Inferred**).
*   `accessControlDeviceAccessSyncDeltas`: Owned by the `accesses` submodule to track delta changes for synchronization (FactId:#128) (FactId:#129) (**Confirmed**).
*   `accessControlDeviceConfigs`: Owned by the `configs` submodule to store device configurations (FactId:#130) (FactId:#131) (**Confirmed**).
*   `accessControlDeviceIntercomEntries`: Owned by the `intercom_entries` submodule to manage intercom directories (FactId:#132) (FactId:#133) (**Confirmed**).
*   `unresolved_collection` (activities): The `activities` submodule writes to a dynamically resolved collection name (FactId:#134) (**Confirmed**).
*   `unresolved_collection` (intercom entry deltas): The base delta controller in `intercom_entries` performs operations on a dynamically resolved collection name (FactId:#135) (**Confirmed**).

**Per-capability evidence:**

#### _module_root

No MongoDB collections are directly owned or operated on by `_module_root` (**Confirmed**).

#### accesses

*   `accessControlDeviceAccesses` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` (FactId:#125) (FactId:#136) (FactId:#137) (FactId:#126) (FactId:#138) (FactId:#139) (FactId:#140) (FactId:#141) (FactId:#142) (FactId:#143) (FactId:#144) (FactId:#145) (FactId:#146) (FactId:#147) (**Confirmed**).
*   `accessControlDeviceAccessSyncDeltas` | `findMany`, `insertOne` | `resolved_from_collections_map` (FactId:#128) (FactId:#129) (**Confirmed**).

#### activities

*   `unresolved_collection` (Dynamic collection name) | `insertOne` | `unresolved_dynamic` (FactId:#134) (**Confirmed**).

#### configs

*   `accessControlDeviceConfigs` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` (FactId:#130) (FactId:#131) (FactId:#148) (FactId:#149) (**Confirmed**).

#### firmwares

*   `accessControlDeviceAccesses` | `findOne` | `resolved_from_collections_map` (FactId:#127) (**Confirmed**).

#### intercom_entries

*   `accessControlDeviceIntercomEntries` | `findOne`, `insertOne`, `updateOne` | `resolved_from_collections_map` (FactId:#132) (FactId:#133) (FactId:#150) (FactId:#151) (**Confirmed**).
*   `unresolved_collection` (Dynamic collection name for deltas base controller) | `findMany`, `findOne`, `insertOne`, `updateOne` | `unresolved_dynamic` (FactId:#135) (FactId:#152) (FactId:#153) (FactId:#154) (FactId:#155) (FactId:#156) (FactId:#157) (FactId:#158) (FactId:#159) (FactId:#160) (**Confirmed**).

### 8. Outbound Coupling

#### _module_root

Depends on:
*   `accesses` (via `delta.utils.ts` and `index.ts` (FactId:#161) (FactId:#162) (FactId:#001)) (**Confirmed**).
*   `activities` (via `pubsub_message.protocol.ts` and `index.ts` (FactId:#163) (FactId:#002)) (**Confirmed**).
*   `configs` (via `index.ts` (FactId:#003)) (**Confirmed**).
*   `firmwares` (via `index.ts` (FactId:#004)) (**Confirmed**).
*   `intercom_entries` (via `index.ts` (FactId:#005)) (**Confirmed**).

#### accesses

Depends on:
*   `_module_root` (imports `database.service`, `constants`, `delta.utils`, `logging.service`, `pubsub_message.model`) (FactId:#164) (FactId:#165) (FactId:#166) (FactId:#167) (FactId:#168) (FactId:#169) (**Confirmed**).

#### activities

Depends on:
*   `_module_root` (imports `database.service`, `constants`, `logging.service`, `errors.service`, `pubsub.service`) (FactId:#170) (FactId:#171) (FactId:#172) (FactId:#173) (FactId:#174) (**Confirmed**).

#### configs

Depends on:
*   `_module_root` (imports `database.service`, `constants`, `pubsub_message.model`) (FactId:#175) (FactId:#176) (FactId:#177) (**Confirmed**).

#### firmwares

Depends on:
*   `_module_root` (imports `database.service`, `constants`) (FactId:#178) (FactId:#179) (**Confirmed**).

#### intercom_entries

Depends on:
*   `_module_root` (imports `database.service`, `constants`, `pubsub_message.model`) (FactId:#180) (FactId:#181) (FactId:#182) (FactId:#183) (FactId:#184) (**Confirmed**).

### 9. Internal Structure

**_module_root**
  -> accesses (src/v1/core/shared/delta.utils.ts:7, src/v1/core/shared/delta.utils.ts:6, src/v1/index.ts:9)
  -> activities (src/v1/core/protocols/pubsub_message.protocol.ts:6, src/v1/index.ts:11)
  -> configs (src/v1/index.ts:8)
  -> firmwares (src/v1/index.ts:12)
  -> intercom_entries (src/v1/index.ts:10)
  <- accesses (src/v1/controllers/access_control_device_access_sync.controller.ts:7, src/v1/controllers/access_control_device_access_sync.controller.ts:8, src/v1/controllers/access_control_device_access_sync.controller.ts:11)
  <- activities (src/v1/controllers/access_control_device_activities.controller.ts:7, src/v1/controllers/access_control_device_activities.controller.ts:8, src/v1/handlers/routes/access_control_device_activities_route.handler.ts:21)
  <- configs (src/v1/controllers/access_control_device_configs.controller.ts:9, src/v1/controllers/access_control_device_configs.controller.ts:8, src/v1/handlers/routes/access_control_device_configs_route.handler.ts:11)
  <- firmwares (src/v1/controllers/access_control_device_firmwares.controller.ts:9, src/v1/controllers/access_control_device_firmwares.controller.ts:8)
  <- intercom_entries (src/v1/controllers/access_control_device_intercom_entries.controller.ts:9, src/v1/controllers/access_control_device_intercom_entries.controller.ts:7, src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts:6)
**accesses**
  -> _module_root (src/v1/controllers/access_control_device_access_sync.controller.ts:7, src/v1/controllers/access_control_device_access_sync.controller.ts:8, src/v1/controllers/access_control_device_access_sync.controller.ts:11)
  <- _module_root (src/v1/core/shared/delta.utils.ts:7, src/v1/core/shared/delta.utils.ts:6, src/v1/index.ts:9)
**activities**
  -> _module_root (src/v1/controllers/access_control_device_activities.controller.ts:7, src/v1/controllers/access_control_device_activities.controller.ts:8, src/v1/handlers/routes/access_control_device_activities_route.handler.ts:21)
  <- _module_root (src/v1/core/protocols/pubsub_message.protocol.ts:6, src/v1/index.ts:11)
**configs**
  -> _module_root (src/v1/controllers/access_control_device_configs.controller.ts:9, src/v1/controllers/access_control_device_configs.controller.ts:8, src/v1/handlers/routes/access_control_device_configs_route.handler.ts:11)
  <- _module_root (src/v1/index.ts:8)
**firmwares**
  -> _module_root (src/v1/controllers/access_control_device_firmwares.controller.ts:9, src/v1/controllers/access_control_device_firmwares.controller.ts:8)
  <- _module_root (src/v1/index.ts:12)
**intercom_entries**
  -> _module_root (src/v1/controllers/access_control_device_intercom_entries.controller.ts:9, src/v1/controllers/access_control_device_intercom_entries.controller.ts:7, src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts:6)
  <- _module_root (src/v1/index.ts:10)

### 10. Cross-Module Relationships

*(deterministic -- this repository consists of exactly one module, `access_control_device`; no cross-module relationships exist.)*

### 11. Permissions & Security

*(this repo has zero RBAC/authorization facts anywhere, verified in Phase 1 -- no cross-cutting judgment layer exists to add on top of the per-capability evidence below, since there is nothing to compare.)*

**Per-capability evidence:**

#### _module_root

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

#### accesses

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

#### activities

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

#### configs

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

#### firmwares

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

#### intercom_entries

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### 12. External Hooks

#### _module_root

*   **Environment Variables**: `dotenv.config` is called in `database.service.ts` (FactId:#185) (**Confirmed**).
*   **Pub/Sub Topic Creation**: `this.pubSub.createTopic` (FactId:#186) (**Confirmed**).

#### accesses

None evidenced (**Confirmed**).

#### activities

*   **Pub/Sub Topic**: `accessControlDevice_activities` (FactId:#038) (**Confirmed**).

#### configs

None evidenced (**Confirmed**).

#### firmwares

None evidenced (**Confirmed**).

#### intercom_entries

None evidenced (**Confirmed**).

### 13. Architectural Observations

*   **Base Controller Pattern**: The `intercom_entries` submodule utilizes an inheritance pattern where `OSKAccessControlDeviceIntercomEntryDeltaController` extends `OSKAccessControlDeviceDeltasBaseController` (FactId:#057) (**Confirmed**). This base controller dynamically handles delta tracking and acknowledgement, explaining why its collection names are unresolved dynamically (**Inferred**).
*   **Unresolved Call Edges**: `this.pubSub.createTopic` in (FactId:#187) is unresolved (FactId:#186) (**Confirmed**). This indicates that the underlying `@google-cloud/pubsub` library's type declarations or implementation details are not fully resolved by the compiler analysis, which is typical for external SDKs (**Inferred**).

### 14. Risks & Open Questions

**Cross-cutting risks:**

*   **Firmware Controller Defect**: The `firmwares` capability queries the `accessControlDeviceAccesses` collection (FactId:#127) (**Confirmed**). This is a critical cross-cutting risk as it indicates a likely bug where firmware retrieval might fail or return incorrect data because it is reading from the accesses collection instead of a firmware collection (**Confirmed**).
*   **Dynamic Collection Names**: Both `activities` and the base delta controller in `intercom_entries` use dynamic collection names that could not be statically resolved (FactId:#134) (FactId:#135) (**Confirmed**). This introduces risk around database schema migrations and static analysis verification (**Inferred**).

**Per-capability open questions:**

#### _module_root

*   The exact environment variables loaded by `dotenv` are not explicitly declared in the facts (**Inferred**).

#### accesses

None.

#### activities

*   The collection name for storing activities is unresolved dynamically in the controller (`insertOne(unresolved_collection)`) (FactId:#134). What is the actual collection name? (**Unknown**).

#### configs

None.

#### firmwares

*   Why does `OSKAccessControlDeviceFirmwareController.get` query the `accessControlDeviceAccesses` collection instead of a firmware-specific collection? This appears to be a copy-paste bug or architectural defect (FactId:#127) (**Inferred**).

#### intercom_entries

*   The collection name for storing intercom entry deltas is unresolved dynamically in the base delta controller (`OSKAccessControlDeviceDeltasBaseController`) (FactId:#135). What is the actual collection name? (**Unknown**).

### 15. Evidence References

- #001 -- `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_accesses.route|#1`
- #002 -- `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_activities.route|#1`
- #003 -- `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_configs.route|#1`
- #004 -- `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_firmwares.route|#1`
- #005 -- `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_intercom_entries.route|#1`
- #006 -- `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logCritical|#1`
- #007 -- `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logError|#1`
- #008 -- `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logInfo|#1`
- #009 -- `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|checkSubscriptionExists|#1`
- #010 -- `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|createTopic|#1`
- #011 -- `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1`
- #012 -- `function_declaration|access_control_device|src/v1/core/shared/delta.utils.ts|compareAccessLists|#1`
- #013 -- `function_declaration|access_control_device|src/v1/core/shared/delta.utils.ts|mergeDeltas|#1`
- #014 -- `source_class|access_control_device|src/v1/core/shared/errors.service.ts|CustomHttpError`
- #015 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|fullDocument.accesses.slice|getPaginated|startIndex,startIndex + limit|#1`
- #016 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.findOne|getPaginated|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1`
- #017 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.findOne|create|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1`
- #018 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.insertOne|insert|this._mongoDBName,collections.accessControlDeviceAccesses,accessEntry|#1`
- #019 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.updateOne|create|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId },{
                    $push: { accesses: newAccess },
                    $set: { modificationDate: timestamp },
                }|#1`
- #020 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.updateOne|deleteAccess|this._mongoDBName,collections.accessControlDeviceAccesses,{
                    accessControlDeviceId,
                },{
                    $pull: {
                        accesses: { accessId: accessEntryToDelete.access.accessId },
                    },
                    $set: {
                        modificationDate: timestamp,
                    },
                }|#1`
- #021 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|delete|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1`
- #022 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|insert|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1`
- #023 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|recreate|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1`
- #024 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|update|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1`
- #025 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|compareAccessLists|updateFromFullList|oldAccesses,newAccesses|#1`
- #026 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|this._mongoDBService.findMany|getMergedDeltasSince|this._mongoDBName,collections.accessControlDeviceAccessSyncDeltas,{
            accessControlDeviceId,
            timestamp: { $gt: since },
        }|#1`
- #027 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|OSKAccessControlDeviceAccessSyncController.default.getMergedDeltasSince|anon|accessControlDeviceId,sinceDate|#1`
- #028 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|device.accesses
                .flatMap((access: OSKAccessControlDeviceAccess) => access.accessMethods)
                .filter((method: OSKAccessMethod) => method.type === 'pincode')
                .map|anon|(method: { type: 'pincode'; pincode: string }) => method.pincode|#1`
- #029 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|uniquePincodes.map|anon|(pincode, index) => ({
                    id: index.toString(),
                    Pincode: pincode,
                })|#1`
- #030 -- `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1`
- #031 -- `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1`
- #032 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._constructActivityRecord|_transformActivityDigicomData|baseActivity|#1`
- #033 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._constructActivityRecord|_transformActivityIntercomData|baseActivity|#1`
- #034 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._transformActivityDigicomData|anon|activityReceived,accessControlDeviceId|#1`
- #035 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._transformActivityIntercomData|anon|activityReceived,accessControlDeviceId|#1`
- #036 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|this._mongoDBService.insertOne|createActivity|this._mongoDBName,collectionName,newActivityDocument|#1`
- #037 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1`
- #038 -- `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1`
- #039 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKAccessControlDeviceController.default.get|anon|accessControlDeviceId|#1`
- #040 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKAccessControlDeviceController.default.get|anon|accessControlDeviceId|#2`
- #041 -- `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1`
- #042 -- `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1`
- #043 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.deleteOne|delete|this._mongoDBName,collections.accessControlDeviceConfigs,{ accessControlDeviceId }|#1`
- #044 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.insertOne|create|this._mongoDBName,collections.accessControlDeviceConfigs,configToInsert|#1`
- #045 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.updateOne|update|this._mongoDBName,collections.accessControlDeviceConfigs,{ accessControlDeviceId },{ $set: { ...configToUpdate, modificationDate: timestamp } }|#1`
- #046 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1`
- #047 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1`
- #048 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1`
- #049 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|this._mongoDBService.findOne|get|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1`
- #050 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts|OSKAccessControlDeviceFirmwareController.default.get|anon|accessControlDeviceId|#1`
- #051 -- `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1`
- #052 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomController.default.get|anon|accessControlDeviceId|#1`
- #053 -- `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1`
- #054 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.findOne|create|this._mongoDBName,collections.accessControlDeviceIntercomEntries,{ accessControlDeviceId }|#1`
- #055 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.insertOne|create|this._mongoDBName,collections.accessControlDeviceIntercomEntries,newIntercom|#1`
- #056 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.updateOne|update|this._mongoDBName,collections.accessControlDeviceIntercomEntries,{ accessControlDeviceId },{
                    $set: { entries: newIntercomEntries },
                }|#1`
- #057 -- `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1`
- #058 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryDeltaController.default.acknowledgeDelta|anon|accessControlDeviceId,deltaId|#1`
- #059 -- `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryDeltaController.default.getAllUnacknowledged|anon|accessControlDeviceId|#1`
- #060 -- `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1`
- #061 -- `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1`
- #062 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1`
- #063 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1`
- #064 -- `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1`
- #065 -- `source_class|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|OSKAccessControlDeviceAccessRouteHandler`
- #066 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp|GET|2023-01-01|#1`
- #067 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp|GET|2023-01-01|#1`
- #068 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses|GET|2023-01-01|#1`
- #069 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp|GET|2023-01-01|#1`
- #070 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/pincodes|GET|2023-01-01|#1`
- #071 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/pubsub/accesses|POST|2023-01-01|#1`
- #072 -- `source_class|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController`
- #073 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|create|#1`
- #074 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|deleteAccess|#1`
- #075 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|deleteAllAccessesPerAccessControlDevice|#1`
- #076 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|get|#1`
- #077 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|getPaginated|#1`
- #078 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|reCreate|#1`
- #079 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|update|#1`
- #080 -- `source_class|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController`
- #081 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController|getMergedDeltasSince|#1`
- #082 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController|updateFromFullList|#1`
- #083 -- `source_class|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler`
- #084 -- `source_class|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|OSKAccessControlDeviceActivitiesController`
- #085 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|OSKAccessControlDeviceActivitiesController|createActivity|#1`
- #086 -- `source_class|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKConfigsRouteHandler`
- #087 -- `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1`
- #088 -- `source_class|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController`
- #089 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|create|#1`
- #090 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|delete|#1`
- #091 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|get|#1`
- #092 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|update|#1`
- #093 -- `source_class|access_control_device|src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts|OSKAccessControlDeviceFirmwaresRouteHandler`
- #094 -- `source_class|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController`
- #095 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController|get|#1`
- #096 -- `source_class|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryRouteHandler`
- #097 -- `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1`
- #098 -- `source_class|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController`
- #099 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|acknowledgeDelta|#1`
- #100 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|create|#1`
- #101 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|getAll|#1`
- #102 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|getAllUnacknowledged|#1`
- #103 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|getMostRecentDeltaBeforeTimestamp|#1`
- #104 -- `controller_method|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController|setLastAcknowledgedDelta|#1`
- #105 -- `source_class|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController`
- #106 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController|create|#1`
- #107 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController|get|#1`
- #108 -- `controller_method|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController|update|#1`
- #109 -- `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom|GET|2023-01-01|#1`
- #110 -- `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1`
- #111 -- `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1`
- #112 -- `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1`
- #113 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|accessControlDeviceId|#1`
- #114 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|accessId|#1`
- #115 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|activityType|#1`
- #116 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|deviceId|#1`
- #117 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|error|#1`
- #118 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|pincode|#1`
- #119 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|success|#1`
- #120 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|timestamp|#1`
- #121 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|timestampKeystrokes|#1`
- #122 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|userId|#1`
- #123 -- `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities|POST|2023-01-01|#1`
- #124 -- `joi_schema_field|access_control_device|src/v1/schema/access_control_device_intercom_entry.schema.ts|postIntercomEntryDeltaAcknowledgementSchema|acknowledgedDeltaIds|#1`
- #125 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|findOne|#1`
- #126 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|deleteOne|#1`
- #127 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1`
- #128 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|findMany|#1`
- #129 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|insertOne|#1`
- #130 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1`
- #131 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1`
- #132 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1`
- #133 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#2`
- #134 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1`
- #135 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1`
- #136 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|insertOne|#1`
- #137 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|updateOne|#1`
- #138 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#1`
- #139 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#2`
- #140 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#3`
- #141 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#4`
- #142 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|insertOne|#1`
- #143 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|insertOne|#2`
- #144 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#1`
- #145 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#2`
- #146 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#3`
- #147 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#4`
- #148 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|insertOne|#1`
- #149 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|updateOne|#1`
- #150 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|insertOne|#1`
- #151 -- `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|updateOne|#1`
- #152 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#2`
- #153 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#3`
- #154 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#1`
- #155 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#2`
- #156 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#3`
- #157 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#1`
- #158 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#2`
- #159 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#1`
- #160 -- `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#2`
- #161 -- `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access_sync_delta.model|#1`
- #162 -- `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access.model|#1`
- #163 -- `imports_dependency|access_control_device|src/v1/core/protocols/pubsub_message.protocol.ts|../../models/access_control_device_activities.model|#1`
- #164 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/constants|#1`
- #165 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/database.service|#1`
- #166 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/delta.utils|#1`
- #167 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/logging.service|#1`
- #168 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/shared/delta.utils|#1`
- #169 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../models/pubsub_message.model|#1`
- #170 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|../core/shared/constants|#1`
- #171 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|../core/shared/database.service|#1`
- #172 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/logging.service|#1`
- #173 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/shared/errors.service|#1`
- #174 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/shared/pubsub.service|#1`
- #175 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/constants|#1`
- #176 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/database.service|#1`
- #177 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|../../models/pubsub_message.model|#1`
- #178 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/constants|#1`
- #179 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/database.service|#1`
- #180 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/constants|#1`
- #181 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/database.service|#1`
- #182 -- `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|../core/shared/constants|#1`
- #183 -- `imports_dependency|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|../../core/shared/database.service|#1`
- #184 -- `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|../../models/pubsub_message.model|#1`
- #185 -- `call_expression|access_control_device|src/v1/core/shared/database.service.ts|dotenv.config|anon|{ path: '.env.local', override: true }|#1`
- #186 -- `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.createTopic|createTopic|topicName|#1`
- #187 -- `src/v1/core/shared/pubsub.service.ts` (line 39)
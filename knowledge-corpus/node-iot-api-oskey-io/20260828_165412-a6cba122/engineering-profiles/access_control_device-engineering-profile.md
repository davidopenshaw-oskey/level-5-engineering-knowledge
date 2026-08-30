### 0. Generation Metadata

- **runId**: `20260828_165412-a6cba122`
- **generatedAt**: `2026-08-29T07:52:30.060Z`
- **repoName**: `node-iot-api-oskey-io`
- **targetModule**: `access_control_device`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `access_control_device` module serves as the critical middleware bridge connecting physical access control hardware (such as intercoms and digicoms) with the platform's Firebase-based backend [Confirmed]. The module is responsible for orchestrating credential and permission synchronization, managing device configurations, delivering firmware metadata, processing real-time hardware activity logs, and maintaining intercom directory structures [Confirmed]. By translating between device-level HTTP protocols and backend Pub/Sub event streams, it ensures that physical hardware remains synchronized with cloud-managed administrative state [Confirmed].

### 2. Architectural Position

This module occupies a dual-boundary gateway position within the platform architecture [Confirmed]:
- **Device-Facing Boundary**: It exposes direct HTTP REST endpoints to edge hardware, allowing devices to pull configurations, retrieve firmware details, fetch credential/intercom delta updates, and upload real-time activity logs [Confirmed].
- **Backend-Facing Boundary**: It exposes HTTP endpoints designed to receive Google Cloud Pub/Sub push messages from the Firebase backend [Confirmed]. These inbound messages asynchronously trigger local database updates for configurations, access permissions, and intercom directories [Confirmed].
- **Outbound Event Pipeline**: It normalizes raw device activity events and publishes them to the backend via Google Cloud Pub/Sub (`accessControlDevice_activities` topic) for downstream consumption [Confirmed].

The module maintains its own persistent state using MongoDB, acting as a local cache and buffer between the physical devices and the primary cloud database [Confirmed].

### 3. Primary Responsibilities

#### _module_root

### Generic Infrastructure
- **Centralized Logging**: `OSKLoggingService` provides severity-based logging methods (`logCritical`, `logError`, `logWarning`, `logInfo`, `logDebug`, `logDefault`) and formats log entries with stack traces, excluding internal logging service frames `` `src/v1/core/logging.service.ts` (line 12) ``. [Confirmed]
- **Database Initialization**: `database.service.ts` configures environment variables using `dotenv` and initializes the MongoDB service instance `` `src/v1/core/shared/database.service.ts` (line 9) ``. [Confirmed]
- **Error Handling**: `CustomHttpError` extends the native `Error` class to support custom HTTP status codes and messages across the module `` `src/v1/core/shared/errors.service.ts` (line 6) ``. [Confirmed]
- **Shared Constants**: `constants.ts` defines shared constants utilized across the module `` `src/v1/core/shared/constants.ts` ``. [Confirmed]

### Pub/Sub Shared Plumbing
- **Pub/Sub Client Management**: `OSKPubSubService` manages Google Cloud Pub/Sub topics and subscriptions, including creation, deletion, and existence checks `` `src/v1/core/shared/pubsub.service.ts` (line 5) ``. [Confirmed]
- **Message Publishing**: `OSKPubSubService.publishMessage` serializes payloads to JSON and publishes them to specified topics `` `src/v1/core/shared/pubsub.service.ts` (line 16) ``. [Confirmed]
- **Pub/Sub Message Protocol & Model**: Standardizes the message envelope structure via the `OSKPubSubMessageProtocol` type `` `src/v1/core/protocols/pubsub_message.protocol.ts` (line 8) `` and the `OSKPubSubMessage` model `` `src/v1/models/pubsub_message.model.ts` (line 6) ``. [Confirmed]
- **Pub/Sub Message Schema**: `pubSubMessageSchema` provides Joi validation for incoming Pub/Sub push payloads, requiring `message` and `subscription` fields `` `src/v1/schema/pubsub_message.schema.ts` (line 8) ``. [Confirmed]

### Shared Delta/Sync Utility
- **Access List Comparison**: `compareAccessLists` compares old and new access lists to identify added, changed, and removed items `` `src/v1/core/shared/delta.utils.ts` (line 28) ``. [Confirmed]
- **Delta Merging**: `mergeDeltas` merges multiple delta sets into a single consolidated delta result `` `src/v1/core/shared/delta.utils.ts` (line 69) ``. [Confirmed]

### Composition Root
- **Route Aggregation**: `index.ts` acts as the composition root, importing and wiring together the route files for accesses, activities, configs, firmwares, and intercom entries `` `src/v1/index.ts` (line 6) ``. [Confirmed]

#### accesses

- **Access Retrieval**: Fetching all accesses or paginated accesses for a specific device. [Confirmed] (`` `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|get|#1` ``, `` `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|getPaginated|#1` ``)
- **Pincode Extraction**: Extracting unique pincodes associated with a device's accesses. [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/pincodes|GET|2023-01-01|#1` ``)
- **Delta Synchronization**: Calculating and retrieving changes (deltas) in accesses since a specific timestamp for both intercom and digicom devices. [Confirmed] (`` `controller_method|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController|getMergedDeltasSince|#1` ``)
- **Pub/Sub Real-time Synchronization**: Processing inbound Pub/Sub push messages to insert, update, delete, or recreate access records dynamically. [Confirmed] (`` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|insert|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` ``)
- **Access State Management**: Maintaining the database state of accesses and sync deltas, including semantic equality checks to prevent redundant updates. [Confirmed] (`` `controller_method|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController|updateFromFullList|#1` ``)

---

#### activities

- **Processing Intercom Activities**: Receives and processes intercom activity logs via POST routes, transforming the data and validating it [Confirmed].
  *Citation:* `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (lines 27–55)
- **Processing Digicom Activities**: Receives and processes digicom activity logs via a POST route, mapping keystroke timestamps and validating the payload [Confirmed].
  *Citation:* `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (lines 57–85)
- **Data Transformation & Validation**: Transforms raw activity payloads (e.g., converting keystroke arrays to structured objects with dates) and validates them using Joi schemas [Confirmed].
  *Citation:* `src/v1/schema/access_control_device_access_activity.schema.ts` (lines 1–98)
- **Database Persistence**: Inserts processed activity records into a MongoDB collection [Confirmed].
  *Citation:* `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` ``
- **Pub/Sub Event Publishing**: Publishes processed activity events to the `accessControlDevice_activities` topic [Confirmed].
  *Citation:* `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` ``

---

#### configs

- **Retrieve Device Configuration**: Fetches the current configuration for a specific access control device by its ID (`` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``).
- **Retrieve Device Configuration After Timestamp**: Fetches the configuration for a specific device only if it has been modified after a provided timestamp (`` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``).
- **Process Pub/Sub Configuration Messages**: Handles inbound Pub/Sub push messages containing device configuration operations (insert, update, delete) and dispatches them to the appropriate controller methods (`` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``).
- **Database Operations (CRUD)**: Performs direct database operations on the `accessControlDeviceConfigs` collection, including finding, inserting, updating, and deleting configuration records (`` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|insertOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|updateOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1` ``).
- **Configuration Data Modeling**: Defines TypeScript types and interfaces representing the structure of access control device configurations, including street addresses, coordinates, communication schedules, and intercom communication configurations (`src/v1/models/access_control_device_config.model.ts` (lines 8, 13, 25, 42, 83)).

**Confidence**: Confirmed

#### firmwares

- **Retrieve Firmware Information**: Queries the database to find firmware details (version and URL) for a specified access control device ID.
  - *Confidence*: Confirmed
  - *Citations*: `controller_method|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController|get|#1`, `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1`
- **Expose HTTP Endpoint**: Handles incoming GET requests for device firmware, returning a successful JSON response, a 404 error if the device is not found, or a 500 error on internal failure.
  - *Confidence*: Confirmed
  - *Citations*: `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1`, `src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts` (lines 11-30)
- **Define Firmware Data Models**: Establishes TypeScript type definitions for firmware objects, database representations, and API response structures.
  - *Confidence*: Confirmed
  - *Citations*: `src/v1/models/access_control_device_firmware.model.ts` (lines 8-18)

---

#### intercom_entries

- **Intercom Directory Retrieval**: Retrieves the current intercom directory entries for a specific access control device [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1` ``].
- **Asynchronous Directory Updates**: Processes inbound Pub/Sub messages to create, update, or delete intercom entries [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``].
- **Delta Synchronization Management**: Tracks and serves incremental changes (deltas) to the intercom directory, allowing devices to sync changes incrementally rather than downloading the entire directory [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1` ``].
- **Delta Acknowledgement**: Processes acknowledgements from devices for successfully applied deltas, updating their synchronization state [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` ``].

### 4. Public Interfaces (Route Handlers & Controllers)

#### _module_root

No route handlers or controllers are defined within this capability's own code [Confirmed]. The composition root in `index.ts` imports route definitions from other submodules but does not implement route handlers or controllers itself `` `src/v1/index.ts` (line 6) ``.

#### accesses

- **Route Handler Class**: `OSKAccessControlDeviceAccessRouteHandler` in `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` acts as the HTTP entry point for all access-related routes. [Confirmed] (`` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|OSKAccessControlDeviceAccessRouteHandler` ``)
- **Controller Classes**:
  - `OSKAccessControlDeviceAccessController` in `src/v1/controllers/access_control_device_accesses.controller.ts` handles direct CRUD operations on accesses. [Confirmed] (`` `source_class|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController` ``)
  - `OSKAccessControlDeviceAccessSyncController` in `src/v1/controllers/access_control_device_access_sync.controller.ts` handles delta calculations and sync state updates. [Confirmed] (`` `source_class|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController` ``)

---

#### activities

### Route Handler Class
- **`OSKAccessControlDeviceActivitiesRouteHandler`**: The HTTP entry point for this capability's routes [Confirmed].
  *Citation:* `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 26)
  *   **Routed Methods**:
      *   `processActivitiesIntercom`: Handles incoming intercom activity logs [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (lines 27–55)
      *   `processActivitiesDigicom`: Handles incoming digicom activity logs [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (lines 57–85)
  *   **Private Helper Methods**:
      *   `_processActivity`: Coordinates database insertion and Pub/Sub publishing [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 91)
      *   `_constructActivityRecord`: Constructs the base activity record [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 106)
      *   `_transformActivityIntercomData`: Transforms raw intercom activity data [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 197)
      *   `_transformActivityDigicomData`: Transforms raw digicom activity data [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 218)
      *   `_validateAcdId`: Validates the access control device ID [Confirmed]. `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` (line 250)

### Controller Class
- **`OSKAccessControlDeviceActivitiesController`**: The Mongo-backed data-access layer [Confirmed].
  *Citation:* `src/v1/controllers/access_control_device_activities.controller.ts` (line 11)
  *   **Methods**:
      *   `createActivity`: Inserts a new activity document into the database [Confirmed]. `src/v1/controllers/access_control_device_activities.controller.ts` (line 21)

---

#### configs

- **Route Handler Class**: `OSKConfigsRouteHandler` (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 13))
  - `getConfig`: Handles requests to retrieve a device's configuration (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 14)).
  - `getConfigAfterTimestamp`: Handles requests to retrieve a device's configuration if modified after a specific timestamp (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 31)).
  - `processConfigPubSubMessage`: Handles inbound Pub/Sub push messages to synchronize configurations (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 59)).
- **Controller Class**: `OSKAccessControlDeviceController` (`src/v1/controllers/access_control_device_configs.controller.ts` (line 11))
  - `get`: Retrieves a configuration record from the database (`src/v1/controllers/access_control_device_configs.controller.ts` (line 60)).
  - `create`: Inserts a new configuration record into the database (`src/v1/controllers/access_control_device_configs.controller.ts` (line 69)).
  - `update`: Updates an existing configuration record in the database (`src/v1/controllers/access_control_device_configs.controller.ts` (line 77)).
  - `delete`: Deletes a configuration record from the database (`src/v1/controllers/access_control_device_configs.controller.ts` (line 85)).
  - `_convert`: Private helper method to format or convert configuration data (`src/v1/controllers/access_control_device_configs.controller.ts` (line 21)).

**Confidence**: Confirmed

#### firmwares

This capability implements a clean separation between the HTTP routing layer and the data-access controller layer:

- **Route Handler Class**: `OSKAccessControlDeviceFirmwaresRouteHandler`
  - **File**: `src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts`
  - **Routed Method**: `getFirmwarePerAccessControlDevice`
  - *Citations*: `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1`
- **Controller Class**: `OSKAccessControlDeviceFirmwareController`
  - **File**: `src/v1/controllers/access_control_device_firmwares.controller.ts`
  - **Method**: `get`
  - *Citations*: `controller_method|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController|get|#1`

---

#### intercom_entries

- **Route Handler Class**:
  - `OSKAccessControlDeviceIntercomEntryRouteHandler` [Confirmed; `` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryRouteHandler` ``]: Serves as the entry point for all HTTP and Pub/Sub routes related to intercom entries.
- **Controller Classes**:
  - `OSKAccessControlDeviceIntercomController` [Confirmed; `` `source_class|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController` ``]: Manages direct data access operations for the main intercom entries collection.
  - `OSKAccessControlDeviceIntercomEntryDeltaController` [Confirmed; `` `source_class|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|OSKAccessControlDeviceIntercomEntryDeltaController` ``]: Inherits from `OSKAccessControlDeviceDeltasBaseController` [Confirmed; `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1` ``] to manage the lifecycle, retrieval, and acknowledgement of intercom entry synchronization deltas.

### 5. Route Definitions & Request Contracts

#### _module_root

No route definitions or request contracts are owned by this capability [Confirmed]. Route registration is delegated to the imported submodule route files `` `src/v1/index.ts` (line 6) ``.

#### accesses

The following routes are defined within this capability: [Confirmed] (`` `src/v1/routes/access_control_device_accesses.route.ts` ``)

| Method | HTTP Path | Version Date | Handler Method | isPubSubPushRoute | Request Schema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp` | 2023-01-01 | `getAccessSyncDeltasDigicom` | `false` | *None* |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp` | 2023-01-01 | `getAccessSyncDeltasIntercom` | `false` | *None* |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp` | 2023-01-01 | `getAllPerAccessControlDevicePaginated` | `false` | *None* |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses/digicom` | 2023-01-01 | `getAllPerAccessControlDevicePaginated` | `false` | *None* |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses/pincodes` | 2023-01-01 | `getPincodesPerAccessControlDevice` | `false` | *None* |
| `GET` | `/access-control-devices/:accessControlDeviceId/accesses` | 2023-01-01 | `getAllPerAccessControlDevice` | `false` | *None* |
| `POST` | `/access-control-devices/pubsub/accesses` | 2023-01-01 | `processAccessPubSubMessage` | `true` | `pubSubMessageSchema` |

#### Resolved Route Request Schemas
For `POST /access-control-devices/pubsub/accesses` (Schema: `pubSubMessageSchema`): [Confirmed]
- **deliveryAttempt**: `number` (optional)
- **message**: `any` (required)
- **subscription**: `string` (required)

---

#### activities

### Route Definitions
- **`POST /access-control-devices/:accessControlDeviceId/activities`** [Confirmed]
  *   **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesIntercom`
  *   **Schema**: `OSKAcdReceivedIntercomActivitySchema`
  *   *Citation:* `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities|POST|2023-01-01|#1` ``
- **`POST /access-control-devices/:accessControlDeviceId/activities/intercom`** [Confirmed]
  *   **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesIntercom`
  *   **Schema**: `OSKAcdReceivedIntercomActivitySchema`
  *   *Citation:* `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1` ``
- **`POST /access-control-devices/:accessControlDeviceId/activities/digicom`** [Confirmed]
  *   **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesDigicom`
  *   **Schema**: `OSKAcdReceivedDigicomActivitiesSchema` (Note: The schema fields for `OSKAcdReceivedDigicomActivitiesSchema` live outside this capability's pack or are not provided in the resolved schemas list [Confirmed]).
  *   *Citation:* `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1` ``

### Resolved Route Request Schemas

#### `OSKAcdReceivedIntercomActivitySchema`
```json
{
  "accessControlDeviceId": "string (required)",
  "accessId": "unknown (optional)",
  "activityType": "string (required)",
  "deviceId": "unknown (optional)",
  "error": "unknown (optional)",
  "pincode": "unknown (optional)",
  "success": "boolean (required)",
  "timestamp": "string (required)",
  "timestampKeystrokes": "unknown (optional)",
  "userId": "unknown (optional)"
}
```

---

#### configs

The following routes are defined in `src/v1/routes/access_control_device_configs.route.ts`:

### GET `/access-control-devices/:accessControlDeviceId/config`
- **Version**: `2023-01-01`
- **Handler**: `OSKConfigsRouteHandler.getConfig`
- **Request Schema**: None (null schemaName)
- **Citation**: `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``

### GET `/access-control-devices/:accessControlDeviceId/config/:timestamp`
- **Version**: `2023-01-01`
- **Handler**: `OSKConfigsRouteHandler.getConfigAfterTimestamp`
- **Request Schema**: None (null schemaName)
- **Citation**: `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``

### POST `/access-control-devices/pubsub/configs`
- **Version**: `2023-01-01`
- **Handler**: `OSKConfigsRouteHandler.processConfigPubSubMessage`
- **Is Pub/Sub Push Route**: `true`
- **Request Schema**: `pubSubMessageSchema` (imported from `src/v1/schema/pubsub_message.schema.ts`)
  - `deliveryAttempt`: `number` (optional)
  - `message`: `any` (required)
  - `subscription`: `string` (required)
- **Citation**: `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``

**Confidence**: Confirmed

#### firmwares

The capability registers a single HTTP route:

### GET `/access-control-devices/:accessControlDeviceId/firmwares`
- **Version Date**: `2023-01-01`
- **Handler Method**: `OSKAccessControlDeviceFirmwaresRouteHandler.getFirmwarePerAccessControlDevice`
- **Is Pub/Sub Push Route**: `false`
- **Request Schema**: No request body schema is registered for this route.
- *Citations*: `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1`

---

#### intercom_entries

### Route Definitions
- **GET** `/access-control-devices/:accessControlDeviceId/intercom-entries` (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceIntercomEntryRouteHandler.getIntercomEntry` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1` ``]
- **GET** `/access-control-devices/:accessControlDeviceId/intercom-entries-deltas` (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceIntercomEntryRouteHandler.getAllUnacknowledgedIntercomEntriesDeltas` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1` ``]
- **POST** `/access-control-devices/:accessControlDeviceId/intercom-entries-deltas` (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceIntercomEntryRouteHandler.postIntercomEntryDeltaAcknowledgement` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` ``]
  - **Schema**: `postIntercomEntryDeltaAcknowledgementSchema` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` ``]
- **POST** `/access-control-devices/pubsub/intercom-entries` (Version: `2023-01-01`, Pub/Sub Push Route)
  - **Handler**: `OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``]
  - **Schema**: `pubSubMessageSchema` [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``]

### Request Contracts
- **postIntercomEntryDeltaAcknowledgementSchema** [Confirmed]:
  - `acknowledgedDeltaIds` (array of strings, required) [Confirmed; `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_intercom_entry.schema.ts|postIntercomEntryDeltaAcknowledgementSchema|acknowledgedDeltaIds|#1` ``]
- **pubSubMessageSchema** [Confirmed]:
  - *Note*: The schema fields for `pubSubMessageSchema` are defined outside this capability's pack (imported from `../schema/pubsub_message.schema` [Confirmed; `` `imports_dependency|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|../schema/pubsub_message.schema|#1` ``]). According to the resolved route request schemas, it contains:
    - `deliveryAttempt` (number, optional)
    - `message` (any, required)
    - `subscription` (string, required)

### 6. Pub/Sub Behavior

#### _module_root

### Outbound Publishing
- **Dynamic Topic Publishing**: `OSKPubSubService.publishMessage` publishes messages to a topic name passed dynamically as an argument (`topicName`) `` `src/v1/core/shared/pubsub.service.ts` (line 19) ``. This is classified as a `"candidate"` publish call because the topic name is unresolved at compile time `` `external_hook|access_control_device|src/v1/core/shared/pubsub.service.ts|topicName|#1` ``. [Confirmed]

### Inbound Receiving
No inbound Pub/Sub push routes are defined in this capability's own code [Confirmed].

#### accesses

#### Outbound Publishing
No outbound Pub/Sub publishing behavior is evidenced in this capability's own pack. [Confirmed]

#### Inbound Receiving
The route `POST /access-control-devices/pubsub/accesses` is flagged as a Pub/Sub push route (`isPubSubPushRoute: true`). [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/pubsub/accesses|POST|2023-01-01|#1` ``)

The inbound message payload is dispatched dynamically based on the `.operation` value using a `switch_case` block inside `OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage`: [Confirmed] (`` `src/v1/routes/access_control_device_accesses.route.ts` ``)

| Operation Value | Dispatch Kind | Target Calls / Actions | Resolution Status |
| :--- | :--- | :--- | :--- |
| `delete` | `switch_case` | `OSKLoggerController.default.info`, `oldAccesses.filter` | `resolved` |
| `insert` | `switch_case` | `OSKLoggerController.default.info` | `resolved` |
| `recreate` | `switch_case` | `OSKLoggerController.default.info` | `resolved` |
| `update` | `switch_case` | `OSKLoggerController.default.info`, `oldAccesses.find`, `oldAccesses.map`, `OSKAccessControlDeviceAccessRouteHandler._isAccessSemanticallyEqual`, `OSKLoggerController.default.debug` | `resolved` |

---

#### activities

### Outbound Publishing
- **Topic Name**: `accessControlDevice_activities` [Confirmed]
  *   **Confidence**: Confirmed
  *   **Detection Method**: Resolved from code literal
  *   **Payload**: `{ type: 'activities', entity: data }` [Confirmed]
  *   *Citation:* `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` ``

### Inbound Receiving
No inbound Pub/Sub push routes (`isPubSubPushRoute: true`) are defined in this capability's pack [Confirmed].

---

#### configs

### Outbound Publishing
No outbound Pub/Sub publishing behavior is evidenced within this capability's pack.

**Confidence**: Confirmed

### Inbound Receiving
The capability processes inbound Pub/Sub messages via the `POST /access-control-devices/pubsub/configs` route. The handler `processConfigPubSubMessage` parses the base64-encoded message data (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 62)) and dispatches operations using an `if_else_branch` structure based on the `.operation` value:

| Operation Value | Operation Resolution Status | Target Calls | Citation |
| :--- | :--- | :--- | :--- |
| `insert` | `resolved` | `OSKAccessControlDeviceController.default.get`, `OSKAccessControlDeviceController.default.update`, `res.status(201).send`, `res.status`, `OSKAccessControlDeviceController.default.create` | `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
| `update` | `resolved` | `OSKAccessControlDeviceController.default.get`, `OSKAccessControlDeviceController.default.update`, `res.status(201).send`, `res.status`, `OSKAccessControlDeviceController.default.create` | `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
| `delete` | `resolved` | `OSKAccessControlDeviceController.default.delete`, `res.status(209).send`, `res.status` | `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |

**Confidence**: Confirmed

#### firmwares

No outbound publishing or inbound receiving Pub/Sub behavior is evidenced within this capability's pack.

**Confidence Tag**: Confirmed (absence of evidence).

---

#### intercom_entries

### Outbound Publishing
- No outbound Pub/Sub publishing behavior is evidenced within this capability's pack [Confirmed].

### Inbound Receiving
The route `/access-control-devices/pubsub/intercom-entries` is a dedicated Pub/Sub push endpoint [Confirmed; `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``]. It parses the base64-encoded payload [Confirmed; `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|Buffer.from|anon|pubSubMessage.message.data,'base64'|#1` ``] and dispatches operations based on the `operation` field [Confirmed; `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``].

| Operation Value | Resolution Status | Dispatch Kind | Target Calls |
| :--- | :--- | :--- | :--- |
| `create` | resolved | `switch_case` | `["OSKAccessControlDeviceIntercomController.default.create","res.status(201).send","res.status"]` [Confirmed; `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``] |
| `update` | resolved | `switch_case` | `["isPubsubPayloadUpdate","OSKAccessControlDeviceIntercomEntryRouteHandler.convertIntercomDates","OSKAccessControlDeviceIntercomController.default.update","res.status(201).send","res.status"]` [Confirmed; `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``] |
| `delete` | resolved | `switch_case` | `["res.status(200).send","res.status"]` [Confirmed; `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``] |

### 7. Data Ownership

**Ownership conclusion:**

#### Cross-Capability Ownership Conclusion
While most MongoDB collections within this module map cleanly to a single owning capability, static analysis reveals a critical data-ownership conflict on the `accessControlDeviceAccesses` collection [Confirmed]:

- **Primary Owner**: The `accesses` capability is the legitimate owner of the `accessControlDeviceAccesses` collection [Confirmed]. It performs full CRUD operations (`findOne`, `insertOne`, `updateOne`, `deleteOne`) to manage device credentials, pincodes, and validity rights [Confirmed].
- **Secondary Consumer (Defect)**: The `firmwares` capability performs a `findOne` query against the `accessControlDeviceAccesses` collection inside `OSKAccessControlDeviceFirmwaresController.get` [Confirmed]. 

**Analysis of Conflict**: The `firmwares` capability's access to the accesses collection is a confirmed implementation defect [Inferred]. The controller is designed to resolve firmware details (such as version and download URL) for a device, but it queries the credential-store collection (`accessControlDeviceAccesses`) instead of a dedicated firmware or device configuration collection [Inferred]. This copy-paste or mapping error represents a functional bug where firmware lookups are routed to the wrong data source [Inferred].

**Per-capability evidence:**

#### _module_root

No `mongo_operation` facts are present in this capability's pack [Confirmed]. This capability does not directly perform database read or write operations, although `database.service.ts` initializes the database connection `` `src/v1/core/shared/database.service.ts` (line 19) ``.

#### accesses

The following MongoDB collections are accessed and modified by this capability: [Confirmed] (`` `src/v1/controllers/access_control_device_access_sync.controller.ts` ``, `` `src/v1/controllers/access_control_device_accesses.controller.ts` ``)

| Collection Name | Operations | Collection Resolution Status |
| :--- | :--- | :--- |
| `accessControlDeviceAccesses` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` |
| `accessControlDeviceAccessSyncDeltas` | `findMany`, `insertOne` | `resolved_from_collections_map` |

---

#### activities

### Mongo Collections
- **Collection Name**: Dynamic / Unresolved at compile time [Confirmed]
  *   **Operations**: `insertOne`
  *   **Collection Resolution Status**: `unresolved_dynamic` (The collection name is determined dynamically via the variable `collectionName` passed to `this._mongoDBService.insertOne` inside `createActivity` [Confirmed]).
  *   **Database Name Expression**: `this._mongoDBName`
  *   *Citation:* `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` ``

---

#### configs

This capability owns and operates on the following MongoDB collection:

| Collection Name | Operations | Collection Resolution Status | Citation |
| :--- | :--- | :--- | :--- |
| `accessControlDeviceConfigs` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` | `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` `` <br> `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|insertOne|#1` `` <br> `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|updateOne|#1` `` <br> `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1` `` |

**Confidence**: Confirmed

#### firmwares

This capability queries a single MongoDB collection to retrieve firmware details:

| Collection Name | Operations | Collection Resolution Status | Citations |
| :--- | :--- | :--- | :--- |
| `accessControlDeviceAccesses` | `findOne` | `resolved_from_collections_map` | `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` |

---

#### intercom_entries

### Mongo Collections
- **`accessControlDeviceIntercomEntries`** [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1` ``]
  - **Resolution Status**: `resolved_from_collections_map` [Confirmed]
  - **Operations**:
    - `findOne`: Used to retrieve the intercom directory for a device [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1` ``] and to check for existing entries during creation [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#2` ``].
    - `insertOne`: Used to initialize a new intercom directory document [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|insertOne|#1` ``].
    - `updateOne`: Used to update the list of entries within an existing intercom directory [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|updateOne|#1` ``].

- **`accessControlDeviceIntercomEntryDeltas`** [Inferred]
  - **Resolution Status**: `unresolved_dynamic` [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` ``] (The base class `OSKAccessControlDeviceDeltasBaseController` executes operations using a dynamic `this._collectionName` property [Confirmed; `` `call_expression|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|this._mongoDBService.findMany|getAll|this._mongoDBName,this._collectionName,{ accessControlDeviceId }|#1` ``]. However, the subclass `OSKAccessControlDeviceIntercomEntryDeltaController` passes `collections.accessControlDeviceIntercomEntryDeltas` to the parent constructor [Confirmed; `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1` ``]).
  - **Operations**:
    - `findMany`: Used to retrieve all deltas [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` ``], unacknowledged deltas [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#2` ``], or deltas before a specific timestamp [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#3` ``].
    - `findOne`: Used to retrieve the last acknowledged delta [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#1` ``], check delta existence during acknowledgement [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#3` ``], or prepare state updates [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#2` ``].
    - `insertOne`: Used to create new delta records [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#2` ``] or write initial tracking states [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#1` ``].
    - `updateOne`: Used to mark deltas as acknowledged [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#2` ``] or update tracking states [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#1` ``].

### 8. Outbound Coupling

#### _module_root

This capability depends on other submodules within the `access_control_device` module:
- **`access_control_device/activities`**: `src/v1/core/protocols/pubsub_message.protocol.ts` imports `../../models/access_control_device_activities.model` `` `src/v1/core/protocols/pubsub_message.protocol.ts` (line 6) ``. [Confirmed]
- **`access_control_device/accesses`**: `src/v1/core/shared/delta.utils.ts` imports `../../models/access_control_device_access_sync_delta.model` and `../../models/access_control_device_access.model` `` `src/v1/core/shared/delta.utils.ts` (lines 6-7) ``. [Confirmed]
- **`access_control_device/accesses` (via routes)**: `src/v1/index.ts` imports `./routes/access_control_device_accesses.route` `` `src/v1/index.ts` (line 9) ``. [Confirmed]
- **`access_control_device/activities` (via routes)**: `src/v1/index.ts` imports `./routes/access_control_device_activities.route` `` `src/v1/index.ts` (line 11) ``. [Confirmed]
- **`access_control_device/configs` (via routes)**: `src/v1/index.ts` imports `./routes/access_control_device_configs.route` `` `src/v1/index.ts` (line 8) ``. [Confirmed]
- **`access_control_device/firmwares` (via routes)**: `src/v1/index.ts` imports `./routes/access_control_device_firmwares.route` `` `src/v1/index.ts` (line 12) ``. [Confirmed]
- **`access_control_device/intercom_entries` (via routes)**: `src/v1/index.ts` imports `./routes/access_control_device_intercom_entries.route` `` `src/v1/index.ts` (line 10) ``. [Confirmed]

#### accesses

This capability depends on the following shared utilities and submodules within the `access_control_device` module: [Confirmed]

- **`_module_root` (Shared Utilities & Infrastructure)**:
  - `../core/shared/constants`: Imports shared constants. (`` `src/v1/controllers/access_control_device_accesses.controller.ts` (line 17) ``)
  - `../core/shared/database.service`: Imports MongoDB service connection. (`` `src/v1/controllers/access_control_device_accesses.controller.ts` (line 15) ``)
  - `../core/shared/delta.utils`: Imports delta calculation utilities (`compareAccessLists`, `mergeDeltas`). (`` `src/v1/controllers/access_control_device_access_sync.controller.ts` (line 11) ``)
  - `../../core/logging.service`: Imports logging service. (`` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (line 35) ``)
  - `../../models/pubsub_message.model` and `../schema/pubsub_message.schema`: Imports Pub/Sub message models and schemas. (`` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (line 8) ``, `` `src/v1/routes/access_control_device_accesses.route.ts` (line 9) ``)

---

#### activities

This capability does not depend on any other non-root submodules (capabilities) within the `access_control_device` module [Confirmed].

It does depend on shared plumbing and infrastructure located in `_module_root` [Confirmed]:
- **`../core/shared/constants`**: Imported by `src/v1/controllers/access_control_device_activities.controller.ts` [Confirmed].
- **`../core/shared/database.service`**: Imported by `src/v1/controllers/access_control_device_activities.controller.ts` [Confirmed].
- **`../../core/logging.service`**: Imported by `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` [Confirmed].
- **`../../core/shared/errors.service`**: Imported by `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` [Confirmed].
- **`../../core/shared/pubsub.service`**: Imported by `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` [Confirmed].

---

#### configs

This capability depends on the following submodules and shared files within the `access_control_device` module:
- **`../core/shared/constants`**: Imported by the controller to reference collection names or other shared constants (`src/v1/controllers/access_control_device_configs.controller.ts` (line 9)).
  - *Citation*: `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/constants|#1` ``
- **`../core/shared/database.service`**: Imported by the controller to interact with MongoDB (`src/v1/controllers/access_control_device_configs.controller.ts` (line 8)).
  - *Citation*: `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/database.service|#1` ``
- **`../../models/pubsub_message.model`**: Imported by the route handler to type-cast inbound Pub/Sub messages (`src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (line 11)).
  - *Citation*: `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|../../models/pubsub_message.model|#1` ``
- **`../schema/pubsub_message.schema`**: Imported by the route definition to validate inbound Pub/Sub payloads (`src/v1/routes/access_control_device_configs.route.ts` (line 10)).
  - *Citation*: `` `imports_dependency|access_control_device|src/v1/routes/access_control_device_configs.route.ts|../schema/pubsub_message.schema|#1` ``

**Confidence**: Confirmed

#### firmwares

This capability depends on the shared infrastructure of the module (`_module_root`):

- **`_module_root`**:
  - `src/v1/controllers/access_control_device_firmwares.controller.ts` imports `../core/shared/constants` (line 9) and `../core/shared/database.service` (line 8).
  - *Citations*: `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/constants|#1`, `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/database.service|#1`

---

#### intercom_entries

This capability depends on the following files and shared utilities within the `access_control_device` module:
- **`../core/shared/constants`** [Confirmed; `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/constants|#1` ``]: Imported by controllers to reference shared collection mappings.
- **`../core/shared/database.service`** [Confirmed; `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/database.service|#1` ``]: Imported to perform MongoDB operations.
- **`../../models/pubsub_message.model`** [Confirmed; `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|../../models/pubsub_message.model|#1` ``]: Imported by the route handler to type-cast incoming Pub/Sub push payloads.
- **`../schema/pubsub_message.schema`** [Confirmed; `` `imports_dependency|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|../schema/pubsub_message.schema|#1` ``]: Imported by the router to validate incoming Pub/Sub push requests.

### 9. Internal Structure

The internal structure of the `access_control_device` module is organized as a star topology centered around the `_module_root` submodule [Confirmed]. There is no direct coupling between sibling domain submodules; all inter-submodule communication is mediated through shared utilities, models, and constants housed in the root [Confirmed].

#### Submodule Coupling Details
- **`_module_root`**
  - **Outbound Coupling**: Connects to all five domain submodules (`accesses`, `activities`, `configs`, `firmwares`, `intercom_entries`) to import and aggregate their route definitions inside the central composition root (`src/v1/index.ts`) [Confirmed]. It also exports shared models (such as `OSKAccessControlDeviceAccessSyncDelta` and `OSKAccessControlDeviceActivitiesDBWithoutId`) to support domain-specific serialization [Confirmed].
  - **Inbound Coupling**: Receives inbound imports from all domain submodules, which rely on its core infrastructure [Confirmed].
- **`accesses`**
  - **Outbound Coupling**: Depends on `_module_root` to import shared constants (`collections`), the database service (`mongoDBService`, `mongoDBName`), and delta comparison utilities (`compareAccessLists`, `mergeDeltas`) [Confirmed].
  - **Inbound Coupling**: Coupled only to `_module_root` via route registration [Confirmed].
- **`activities`**
  - **Outbound Coupling**: Depends on `_module_root` to import shared constants (`collections`), the database service (`mongoDBService`, `mongoDBName`), and the logging service (`OSKLoggingService`) [Confirmed].
  - **Inbound Coupling**: Coupled only to `_module_root` via route registration and model imports [Confirmed].
- **`configs`**
  - **Outbound Coupling**: Depends on `_module_root` to import shared constants (`collections`), the database service (`mongoDBService`, `mongoDBName`), and the Pub/Sub message model (`OSKPubSubMessage`) [Confirmed].
  - **Inbound Coupling**: Coupled only to `_module_root` via route registration [Confirmed].
- **`firmwares`**
  - **Outbound Coupling**: Depends on `_module_root` to import shared constants (`collections`) and the database service (`mongoDBService`, `mongoDBName`) [Confirmed].
  - **Inbound Coupling**: Coupled only to `_module_root` via route registration [Confirmed].
- **`intercom_entries`**
  - **Outbound Coupling**: Depends on `_module_root` to import shared constants (`collections`) and the database service (`mongoDBService`, `mongoDBName`) [Confirmed].
  - **Inbound Coupling**: Coupled only to `_module_root` via route registration [Confirmed].

### 10. Cross-Module Relationships

*(deterministic -- this repository consists of exactly one module, `access_control_device`; no cross-module relationships exist.)*

### 11. Permissions & Security

*(this repo has zero RBAC/authorization facts anywhere, verified in Phase 1 -- no cross-cutting judgment layer is added on top of the per-capability evidence below, since there is nothing to compare.)*

**Per-capability evidence:**

#### _module_root

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source [Confirmed].

#### accesses

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source. [Confirmed]

---

#### activities

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source [Confirmed].

---

#### configs

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

**Confidence**: Confirmed

#### firmwares

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

**Confidence Tag**: Confirmed.

---

#### intercom_entries

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source [Confirmed].

### 12. External Hooks

#### _module_root

- **Pub/Sub Topic Publishing**: Outbound publishing is performed via the Google Cloud Pub/Sub SDK using dynamic topic names `` `src/v1/core/shared/pubsub.service.ts` (line 19) ``. [Confirmed]
- **Environment Variables**: Environment variables are loaded via `dotenv` in the database service `` `src/v1/core/shared/database.service.ts` (line 9) ``. [Confirmed]

#### accesses

No candidate external boundaries (such as environment variables, external HTTP client paths, or storage paths) are evidenced within this capability's own pack. [Confirmed]

---

#### activities

- **Pub/Sub Topic**: `accessControlDevice_activities` is used as an external boundary to publish processed activity events [Confirmed].
  *Citation:* `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` ``

No other external hooks (such as environment variables, HTTP client paths, or storage paths) are evidenced in this capability's pack [Confirmed].

---

#### configs

No candidate external boundaries (such as environment variables, external HTTP clients, or storage paths) are evidenced within this capability's own pack.

**Confidence**: Confirmed

#### firmwares

No external hooks (such as environment variables, external HTTP clients, or storage paths) are evidenced in this capability's pack.

**Confidence Tag**: Confirmed (absence of evidence).

---

#### intercom_entries

No external hooks (such as environment variables, external HTTP client paths, or storage paths) are evidenced in this capability's own pack [Confirmed].

### 13. Architectural Observations

- **Strict Star-Topology Coupling**: The module enforces excellent separation of concerns between its domain capabilities [Inferred]. Submodules like `configs` and `intercom_entries` are completely unaware of each other, preventing spaghetti dependencies and ensuring that domain logic remains isolated [Inferred].
- **Consistent Three-Tier Architecture**: Across all capabilities, the codebase strictly adheres to a `Route -> Handler -> Controller` pattern [Confirmed]. Handlers manage HTTP/PubSub protocol-specific concerns (such as parsing payloads and validating Joi schemas), while Controllers interact with the MongoDB database service [Confirmed].
- **Asymmetric Interface Design**: The module maintains a clear architectural distinction between its synchronous, device-facing REST API (optimized for low-latency HTTP pulls by edge hardware) and its asynchronous, backend-facing Pub/Sub push interface (optimized for eventual consistency and administrative updates from Firebase) [Inferred].
- **Shared Delta Engine**: Rather than duplicating synchronization logic, the module centralizes delta-merging algorithms (`delta.utils.ts`) in the root, allowing both digicom and intercom capabilities to leverage a unified comparison engine [Inferred].

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Firmware Query Defect (High Risk)**: The `firmwares` capability queries the `accessControlDeviceAccesses` collection to retrieve firmware details [Confirmed]. This is highly likely to cause runtime failures or return incorrect data, as firmware metadata is structurally distinct from access credentials [Inferred].
- **Dynamic Collection Resolution Blindspot (Medium Risk)**: The `activities` capability and the base class for intercom deltas (`OSKAccessControlDeviceDeltasBaseController`) execute database operations using dynamic collection names (`unresolved_dynamic` status) [Confirmed]. While subclass constructors pass literal collection names, static analysis cannot guarantee runtime safety, leaving a risk of database driver errors if an unmapped collection name is resolved [Inferred].
- **Lack of Service-Layer Isolation for Shared Collections**: Multiple capabilities directly execute MongoDB operations on collections via the shared `mongoDBService` [Confirmed]. The lack of a dedicated data-access layer or repository pattern for shared collections (like `accessControlDeviceAccesses`) increases the risk of schema drift and makes it difficult to audit database access patterns [Inferred].
- **Unimplemented Pub/Sub Delete Operations (Low Risk)**: The Pub/Sub dispatch route for deleting intercom entries lists only HTTP status responses without clear database deletion operations [Confirmed]. It is an open question whether deletion events are silently ignored, handled elsewhere, or represent an incomplete stub [Inferred].

**Per-capability open questions:**

#### _module_root

- **Environment Variables**: Which specific environment variables are loaded and used by `database.service.ts`? (The evidence only shows `dotenv.config` being called with `.env.local` path, but not which variables are accessed).
- **Database Collections**: Which specific MongoDB collections are initialized or used by the database service? (No `mongo_operation` facts or collection maps are present in this pack).
- **Route Registration**: How are the imported routes in `index.ts` registered with the Express application? (The composition root imports them, but the exact registration logic is not fully detailed in the available facts).

#### accesses

- **Dynamic Collection Resolution**: Although the collection names are resolved from the collections map, the database name expression `this._mongoDBName` is dynamically referenced. Is this database name injected via environment variables at runtime? [Inferred]
- **Pub/Sub Publisher**: What external system publishes the messages received by `POST /access-control-devices/pubsub/accesses`? The payload structure suggests an upstream administrative service, but this is not evidenced in the pack. [Unknown]

#### activities

- **Dynamic Collection Name**: What is the actual runtime value of the dynamic collection name used in `OSKAccessControlDeviceActivitiesController.createActivity`? [Unknown]
- **Digicom Schema Details**: What is the exact schema structure of `OSKAcdReceivedDigicomActivitiesSchema` since its fields were not provided in the resolved route request schemas? [Unknown]

#### configs

- **Database Name Resolution**: The database name expression `this._mongoDBName` is marked as `unresolved` in the call expressions for MongoDB operations (`src/v1/controllers/access_control_device_configs.controller.ts` (lines 61, 74, 82, 86)). How is this value initialized or injected into `OSKAccessControlDeviceController`?
- **Pub/Sub Message Structure**: The `pubSubMessageSchema` is imported from a shared schema directory (`src/v1/routes/access_control_device_configs.route.ts` (line 10)). Are there other fields inside the `message` object that are validated or parsed dynamically within the handler?

#### firmwares

- **Collection Mapping**: The controller queries the `accessControlDeviceAccesses` collection to retrieve firmware information. It is unclear why firmware details are stored in or queried from an "accesses" collection rather than a dedicated "firmwares" or "devices" collection.
- **Request Validation**: There is no Joi schema associated with the route definition. It is unknown whether any validation is performed on the `accessControlDeviceId` path parameter before it is passed to the controller and database query.

#### intercom_entries

- **Pub/Sub Delete Operation Implementation**: The Pub/Sub dispatch route for the `delete` operation [Confirmed; `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``] only lists `res.status(200).send` and `res.status` as target calls. It is unclear from the evidence whether a database deletion is actually performed, or if this operation is currently a stub.
- **Dynamic Collection Resolution**: The base class `OSKAccessControlDeviceDeltasBaseController` executes database operations dynamically [Confirmed; `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` ``]. While we can infer that `accessControlDeviceIntercomEntryDeltas` is the target collection based on the subclass constructor [Inferred], the static analysis engine flags these operations as `unresolved_dynamic`.

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, 12, and 14) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
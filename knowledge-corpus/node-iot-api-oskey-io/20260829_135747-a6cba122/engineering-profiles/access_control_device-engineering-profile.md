### 0. Generation Metadata

- **runId**: `20260829_135747-a6cba122`
- **generatedAt**: `2026-08-29T14:01:02.530Z`
- **repoName**: `node-iot-api-oskey-io`
- **targetModule**: `access_control_device`
- **llmConfigKey**: `gemini-default`
- **llmProvider**: `gemini`
- **llmModel**: `gemini-3.5-flash`

### 1. Executive Summary

The `access_control_device` module serves as the central middleware and integration engine within the platform, bridging physical access-control hardware (such as intercoms and digicoms) with a Firebase-based backend [Confirmed]. The module is responsible for managing device configurations, processing and persisting hardware activity logs, serving firmware metadata, and synchronizing access permissions, pincodes, and intercom directory entries [Confirmed]. It operates via a combination of direct, device-facing HTTP endpoints and asynchronous, Firebase-facing Google Cloud Pub/Sub push routes to ensure real-time state synchronization across the hardware fleet [Confirmed].

### 2. Architectural Position

This module occupies a critical edge-to-cloud gateway position in the platform architecture [Confirmed]. It acts as the exclusive interface for physical IoT access control devices, exposing REST-like HTTP endpoints that devices call directly to retrieve configurations, query firmware updates, pull access/intercom lists, and report activity logs [Confirmed]. Simultaneously, it exposes an asynchronous interface to the Firebase backend via Pub/Sub push routes, allowing the cloud platform to push real-time updates (such as access permission changes or configuration updates) down to the middleware, which are then computed as deltas for edge devices to pull [Confirmed].

### 3. Primary Responsibilities

#### _module_root

### Generic Infrastructure
- **System Logging**: `OSKLoggingService` provides severity-based logging capabilities (`logDebug`, `logInfo`, `logWarning`, `logError`, `logCritical`, `logDefault`) and formats log entries with stack traces and metadata [Confirmed] (`` `src/v1/core/logging.service.ts` (lines 12-68) ``).
- **Database Initialization**: Initializes the MongoDB service instance (`OSKMongoDBService`) and loads environment variables from `.env.local` [Confirmed] (`` `src/v1/core/shared/database.service.ts` (lines 9-19) ``).
- **Error Handling**: Defines `CustomHttpError` to standardize HTTP error propagation across the module [Confirmed] (`` `src/v1/core/shared/errors.service.ts` (lines 6-12) ``).

### Pub/Sub Shared Plumbing
- **Pub/Sub Client Management**: `OSKPubSubService` acts as a singleton client wrapper around `@google-cloud/pubsub` to manage topics and subscriptions [Confirmed] (`` `src/v1/core/shared/pubsub.service.ts` (lines 5-125) ``).
- **Outbound Message Publishing**: Publishes serialized JSON payloads to Google Cloud Pub/Sub topics with optional ordering keys [Confirmed] (`` `src/v1/core/shared/pubsub.service.ts` (lines 16-29) ``).
- **Topic and Subscription Lifecycle**: Programmatically checks, creates, and deletes Pub/Sub topics and subscriptions (both default and push configurations) [Confirmed] (`` `src/v1/core/shared/pubsub.service.ts` (lines 31-125) ``).
- **Pub/Sub Message Schema Validation**: Defines `pubSubMessageSchema` using Joi to validate incoming Pub/Sub push payloads, ensuring they contain a `message`, `subscription`, and optional `deliveryAttempt` [Confirmed] (`` `src/v1/schema/pubsub_message.schema.ts` (lines 8-11) ``).
- **Pub/Sub Message Modeling**: Standardizes the internal data structures for Pub/Sub messages via `OSKPubSubMessage` and `OSKPubSubMessageProtocol` [Confirmed] (`` `src/v1/models/pubsub_message.model.ts` (lines 6-17) ``, `` `src/v1/core/protocols/pubsub_message.protocol.ts` (lines 8-10) ``).

### Shared Delta/Sync Utility
- **Access List Comparison**: `compareAccessLists` evaluates old and new access lists to compute a delta of added, changed, and removed items [Confirmed] (`` `src/v1/core/shared/delta.utils.ts` (lines 28-61) ``).
- **Delta Merging**: `mergeDeltas` consolidates multiple delta sets into a single unified delta result [Confirmed] (`` `src/v1/core/shared/delta.utils.ts` (lines 69-132) ``).

### Composition Root
- **Route Composition**: `src/v1/index.ts` acts as the central entry point that imports and registers the route definitions for accesses, activities, configs, firmwares, and intercom entries [Confirmed] (`` `src/v1/index.ts` (lines 8-12) ``).

#### accesses

- **Retrieve Accesses**: Retrieves all accesses or paginated accesses for a specific access control device. [Confirmed] (evidenced by controller methods `get` and `getPaginated` in `` `src/v1/controllers/access_control_device_accesses.controller.ts` (lines 29, 47) ``).
- **Retrieve Pincodes**: Extracts and returns unique pincodes associated with a device's accesses. [Confirmed] (evidenced by route handler method `getPincodesPerAccessControlDevice` in `` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (line 354) ``).
- **Retrieve Sync Deltas**: Computes and returns access synchronization deltas (changes since a specific timestamp) in Intercom or Digicom formats. [Confirmed] (evidenced by controller method `getMergedDeltasSince` in `` `src/v1/controllers/access_control_device_access_sync.controller.ts` (line 71) `` and route handler methods `getAccessSyncDeltasIntercom` and `getAccessSyncDeltasDigicom` in `` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (lines 38, 66) ``).
- **Process Inbound Pub/Sub Sync Messages**: Receives and processes push messages containing access operations (`insert`, `update`, `delete`, `recreate`) to synchronize local database state with external changes. [Confirmed] (evidenced by route handler method `processAccessPubSubMessage` in `` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (line 386) ``).
- **Manage Access Records in Database**: Performs CRUD operations on access records and delta logs in MongoDB. [Confirmed] (evidenced by controller methods in `` `src/v1/controllers/access_control_device_accesses.controller.ts` (lines 69, 94, 123, 143, 163, 192, 196) `` and `` `src/v1/controllers/access_control_device_access_sync.controller.ts` (line 31) ``).
- **Normalize and Compare Accesses**: Normalizes access methods and rights to perform semantic equality checks, preventing redundant updates. [Confirmed] (evidenced by helper methods `_normalizeAccess` and `_isAccessSemanticallyEqual` in `` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (lines 484, 499) ``).

#### activities

- **Processing Intercom Activities**: Receives and processes intercom activity logs via HTTP POST requests, validating the access control device ID, transforming the data, persisting it, and publishing it. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1` ``
- **Processing Digicom Activities**: Receives and processes digicom activity logs via HTTP POST requests, validating the access control device ID, transforming the data, persisting it, and publishing it. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1` ``
- **Data Transformation**: Transforms raw incoming activity payloads (intercom and digicom formats) into standardized internal activity records. [Confirmed] `` `route_handler_method|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler|_transformActivityIntercomData|#1` ``, `` `route_handler_method|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler|_transformActivityDigicomData|#1` ``
- **Database Persistence**: Inserts processed activity records into a MongoDB collection. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|OSKAccessControlDeviceActivitiesController|createActivity|#1` ``
- **Event Publishing**: Publishes processed activity events to the `accessControlDevice_activities` Pub/Sub topic. [Confirmed] `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` ``

#### configs

- **Retrieving Device Configuration**: Fetches the configuration for a specific access control device. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|get|#1` ``
- **Retrieving Device Configuration After Timestamp**: Checks if a configuration has been modified after a given timestamp, returning 204 No Content if unmodified, or the configuration if modified. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
- **Creating Device Configuration**: Inserts a new configuration record into the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|create|#1` ``
- **Updating Device Configuration**: Updates an existing configuration record with a modification timestamp. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|update|#1` ``
- **Deleting Device Configuration**: Removes a configuration record from the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|delete|#1` ``
- **Processing Pub/Sub Messages**: Handles inbound Pub/Sub push messages to insert, update, or delete configurations asynchronously. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``

#### firmwares

- **Retrieve Firmware Details**: Fetches the firmware version and URL for a given access control device ID [Confirmed] (`` `controller_method|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController|get|#1` ``).
- **Database Querying**: Queries the `accessControlDeviceAccesses` collection to find the device's access and firmware record [Confirmed] (`` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` ``).
- **HTTP Response Handling**: Formats and returns the firmware details as a JSON response, handling success (200 OK), not found (404 Device not found), and internal error (500) scenarios [Confirmed] (`` `src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts` (lines 16, 24, 26) ``).

#### intercom_entries

- **Retrieve Intercom Entries**: Fetches the current intercom directory entries for a specific access control device (*Confirmed* — `` `controller_method|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController|get|#1` ``).
- **Manage Intercom Entry Deltas**: Tracks, retrieves, and acknowledges synchronization deltas (changes) for intercom entries via a base delta controller (*Confirmed* — `` `source_class|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController` ``).
- **Process Pub/Sub Intercom Updates**: Handles inbound Pub/Sub push messages to asynchronously create, update, or delete intercom entries on devices (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``).

### 4. Public Interfaces (Route Handlers & Controllers)

#### _module_root

This capability does not directly define any route handler or controller classes [Confirmed]. It contains the composition root (`src/v1/index.ts`) which imports routes from other capabilities, but does not implement routing logic itself [Confirmed] (`` `src/v1/index.ts` (lines 8-12) ``).

#### accesses

- **Route Handler Class**:
  - `OSKAccessControlDeviceAccessRouteHandler` (defined in `` `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` (line 37) ``) acts as the HTTP entry point for all accesses-related routes. [Confirmed]
- **Controller Classes**:
  - `OSKAccessControlDeviceAccessController` (defined in `` `src/v1/controllers/access_control_device_accesses.controller.ts` (line 19) ``) handles direct MongoDB data access for access records. [Confirmed]
  - `OSKAccessControlDeviceAccessSyncController` (defined in `` `src/v1/controllers/access_control_device_access_sync.controller.ts` (line 13) ``) handles MongoDB data access for access synchronization deltas. [Confirmed]

#### activities

- **Route Handler Class**: `OSKAccessControlDeviceActivitiesRouteHandler` in `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` acts as the HTTP entry point for processing activities. [Confirmed] `` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler` ``. The real routed methods are:
  - `processActivitiesIntercom` (lines 27-55)
  - `processActivitiesDigicom` (lines 57-85)
- **Controller Class**: `OSKAccessControlDeviceActivitiesController` in `src/v1/controllers/access_control_device_activities.controller.ts` handles database persistence. [Confirmed] `` `source_class|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|OSKAccessControlDeviceActivitiesController` ``. The data-access method is:
  - `createActivity` (line 21)

#### configs

- **Route Handler Class**: `OSKConfigsRouteHandler` in `src/v1/handlers/routes/access_control_device_configs_route.handler.ts` (lines 13-96). [Confirmed] `` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKConfigsRouteHandler` ``
  - `getConfig`: Handles direct retrieval of device configuration. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``
  - `getConfigAfterTimestamp`: Handles conditional retrieval of device configuration based on a timestamp. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
  - `processConfigPubSubMessage`: Handles inbound Pub/Sub push messages. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
- **Controller Class**: `OSKAccessControlDeviceController` in `src/v1/controllers/access_control_device_configs.controller.ts` (lines 11-87). [Confirmed] `` `source_class|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController` ``
  - `_convert`: Internal helper to format configuration data. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|_convert|#1` ``
  - `get`: Retrieves configuration from the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|get|#1` ``
  - `create`: Inserts a configuration into the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|create|#1` ``
  - `update`: Updates a configuration in the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|update|#1` ``
  - `delete`: Deletes a configuration from the database. [Confirmed] `` `controller_method|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|OSKAccessControlDeviceController|delete|#1` ``

#### firmwares

- **Route Handler Class**: `OSKAccessControlDeviceFirmwaresRouteHandler` [Confirmed] (`` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts|OSKAccessControlDeviceFirmwaresRouteHandler` ``).
  - Handles the HTTP entry point method `getFirmwarePerAccessControlDevice` [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``).
- **Controller Class**: `OSKAccessControlDeviceFirmwareController` [Confirmed] (`` `source_class|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController` ``).
  - Implements the data-access method `get` to query MongoDB [Confirmed] (`` `controller_method|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|OSKAccessControlDeviceFirmwareController|get|#1` ``).

#### intercom_entries

- **Route Handler Class**: 
  - `OSKAccessControlDeviceIntercomEntryRouteHandler` (`src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts`) — The HTTP entry point for all routes associated with intercom entries, deltas, and Pub/Sub push messages (*Confirmed* — `` `source_class|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryRouteHandler` ``).
- **Controller Classes**:
  - `OSKAccessControlDeviceIntercomController` (`src/v1/controllers/access_control_device_intercom_entries.controller.ts`) — Manages direct database operations on the `accessControlDeviceIntercomEntries` collection (*Confirmed* — `` `source_class|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|OSKAccessControlDeviceIntercomController` ``).
  - `OSKAccessControlDeviceIntercomEntryDeltaController` (`src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts`) — Extends `OSKAccessControlDeviceDeltasBaseController` to manage delta synchronization records specifically for intercom entries (*Confirmed* — `` `source_class|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|OSKAccessControlDeviceIntercomEntryDeltaController` ``).
  - `OSKAccessControlDeviceDeltasBaseController` (`src/v1/controllers/shared/access_control_device_deltas_base.controller.ts`) — A generic base controller providing delta management operations (get, create, acknowledge) (*Confirmed* — `` `source_class|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|OSKAccessControlDeviceDeltasBaseController` ``).

### 5. Route Definitions & Request Contracts

#### _module_root

No route definitions are declared within this capability pack [Confirmed]. 

### Shared Request Contracts
The following schema is defined in this capability but is intended for use by routes in other capabilities [Inferred]:
- **`pubSubMessageSchema`** [Confirmed] (`` `src/v1/schema/pubsub_message.schema.ts` (line 8) ``):
  - `message`: `any` (Required) [Confirmed] (`` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1` ``)
  - `subscription`: `string` (Required) [Confirmed] (`` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1` ``)
  - `deliveryAttempt`: `number` (Optional) [Confirmed] (`` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1` ``)

#### accesses

The following routes are defined within this capability:
- `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getAccessSyncDeltasDigicom`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp|GET|2023-01-01|#1` ``).
- `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getAccessSyncDeltasIntercom`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp|GET|2023-01-01|#1` ``).
- `GET /access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getAllPerAccessControlDevicePaginated`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp|GET|2023-01-01|#1` ``).
- `GET /access-control-devices/:accessControlDeviceId/accesses/digicom` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getAllPerAccessControlDevicePaginated`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom|GET|2023-01-01|#1` ``).
- `GET /access-control-devices/:accessControlDeviceId/accesses/pincodes` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getPincodesPerAccessControlDevice`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/pincodes|GET|2023-01-01|#1` ``).
- `GET /access-control-devices/:accessControlDeviceId/accesses` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.getAllPerAccessControlDevice`. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses|GET|2023-01-01|#1` ``).
- `POST /access-control-devices/pubsub/accesses` (Version: `2023-01-01`) resolved by `OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage` (isPubSubPushRoute: `true`). [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/pubsub/accesses|POST|2023-01-01|#1` ``).

**Resolved Route Request Schemas**
- **POST /access-control-devices/pubsub/accesses**:
  - Schema Name: `pubSubMessageSchema` (declared in `src/v1/schema/pubsub_message.schema.ts`)
  - Fields:
    - `deliveryAttempt`: `number` (optional)
    - `message`: `any` (required)
    - `subscription`: `string` (required)

#### activities

The following routes are defined within this capability:

- **POST `/access-control-devices/:accessControlDeviceId/activities`** (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesIntercom` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities|POST|2023-01-01|#1` ``
  - **Schema**: `OSKAcdReceivedIntercomActivitySchema`
- **POST `/access-control-devices/:accessControlDeviceId/activities/intercom`** (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesIntercom` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1` ``
  - **Schema**: `OSKAcdReceivedIntercomActivitySchema`
- **POST `/access-control-devices/:accessControlDeviceId/activities/digicom`** (Version: `2023-01-01`)
  - **Handler**: `OSKAccessControlDeviceActivitiesRouteHandler.processActivitiesDigicom` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1` ``
  - **Schema**: `OSKAcdReceivedDigicomActivitiesSchema` (Note: The schema fields for `OSKAcdReceivedDigicomActivitiesSchema` are not present in this capability's pack, meaning they live in a different capability's pack. [Confirmed])

#### Request Contract: `OSKAcdReceivedIntercomActivitySchema`
- `accessControlDeviceId` (string, required)
- `accessId` (unknown, optional)
- `activityType` (string, required)
- `deviceId` (unknown, optional)
- `error` (unknown, optional)
- `pincode` (unknown, optional)
- `success` (boolean, required)
- `timestamp` (string, required)
- `timestampKeystrokes` (unknown, optional)
- `userId` (unknown, optional)

#### configs

- **GET `/access-control-devices/:accessControlDeviceId/config`** (version `2023-01-01`)
  - **Handler**: `OSKConfigsRouteHandler.getConfig` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``
  - **Request Contract**: No schema specified. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``
- **GET `/access-control-devices/:accessControlDeviceId/config/:timestamp`** (version `2023-01-01`)
  - **Handler**: `OSKConfigsRouteHandler.getConfigAfterTimestamp` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
  - **Request Contract**: No schema specified. [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
- **POST `/access-control-devices/pubsub/configs`** (version `2023-01-01`)
  - **Handler**: `OSKConfigsRouteHandler.processConfigPubSubMessage` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
  - **Request Contract**: `pubSubMessageSchema` [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
    - `deliveryAttempt`: `number` (optional)
    - `message`: `any` (required)
    - `subscription`: `string` (required)

#### firmwares

- **GET `/access-control-devices/:accessControlDeviceId/firmwares`**
  - **Version Date**: `2023-01-01` [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``)
  - **Handler**: `OSKAccessControlDeviceFirmwaresRouteHandler.getFirmwarePerAccessControlDevice` [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``)
  - **Request Contract**: No request body schema is defined or resolved for this route (`schemaName` is null) [Confirmed] (`` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``).

#### intercom_entries

### Route Definitions
- **GET `/access-control-devices/:accessControlDeviceId/intercom-entries`** (Version: `2023-01-01`)
  - Handler: `OSKAccessControlDeviceIntercomEntryRouteHandler.getIntercomEntry` (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1` ``)
- **GET `/access-control-devices/:accessControlDeviceId/intercom-entries-deltas`** (Version: `2023-01-01`)
  - Handler: `OSKAccessControlDeviceIntercomEntryRouteHandler.getAllUnacknowledgedIntercomEntriesDeltas` (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1` ``)
- **POST `/access-control-devices/:accessControlDeviceId/intercom-entries-deltas`** (Version: `2023-01-01`)
  - Handler: `OSKAccessControlDeviceIntercomEntryRouteHandler.postIntercomEntryDeltaAcknowledgement` (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` ``)
  - Request Schema: `postIntercomEntryDeltaAcknowledgementSchema`
- **POST `/access-control-devices/pubsub/intercom-entries`** (Version: `2023-01-01`, Pub/Sub Push Route)
  - Handler: `OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage` (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``)
  - Request Schema: `pubSubMessageSchema` (Note: This schema is imported from `../schema/pubsub_message.schema`, which lives outside this capability's pack).

### Request Contracts
- **`postIntercomEntryDeltaAcknowledgementSchema`**
  - `acknowledgedDeltaIds` (array of strings, required) (*Confirmed* — `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_intercom_entry.schema.ts|postIntercomEntryDeltaAcknowledgementSchema|acknowledgedDeltaIds|#1` ``)
- **`pubSubMessageSchema`**
  - `deliveryAttempt` (number, optional) (*Confirmed*)
  - `message` (any, required) (*Confirmed*)
  - `subscription` (string, required) (*Confirmed*)

### 6. Pub/Sub Behavior

#### _module_root

### Outbound Publishing
- **`OSKPubSubService.publishMessage`** [Confirmed] (`` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1` ``):
  - **Topic**: Dynamic, resolved at runtime via the `topicName` parameter [Confirmed] (`` `external_hook|access_control_device|src/v1/core/shared/pubsub.service.ts|topicName|#1` ``).
  - **Detection Method**: AST-based call expression analysis of `this.pubSub.topic(topicName).publishMessage` [Confirmed] (`` `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.topic(topicName).publishMessage|publishMessage|{                 data: dataBuffer,                 orderingKey: orderingKey,             }|#1` ``).
  - **Confidence**: Confirmed.

### Inbound Receiving
No inbound Pub/Sub push routes are defined or handled within this capability pack [Confirmed].

#### accesses

- **Outbound Publishing**: No outbound Pub/Sub publishing behavior is evidenced in this capability's pack. [Confirmed]
- **Inbound Receiving**: The route `POST /access-control-devices/pubsub/accesses` receives inbound Pub/Sub push messages. [Confirmed] (evidenced by `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/pubsub/accesses|POST|2023-01-01|#1` ``).
- **Event Routing Table**:
  The inbound handler `OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage` dispatches operations based on the `.operation` value in the received payload: [Confirmed] (evidenced by `pubsub_operation_route` facts in `src/v1/routes/access_control_device_accesses.route.ts`).

| operationValue | operationResolutionStatus | dispatchKind | targetCalls |
| :--- | :--- | :--- | :--- |
| `insert` | resolved | `switch_case` | `["OSKLoggerController.default.info"]` |
| `update` | resolved | `switch_case` | `["OSKLoggerController.default.info","oldAccesses.find","oldAccesses.map","OSKAccessControlDeviceAccessRouteHandler._isAccessSemanticallyEqual","OSKLoggerController.default.debug"]` |
| `delete` | resolved | `switch_case` | `["OSKLoggerController.default.info","oldAccesses.filter"]` |
| `recreate` | resolved | `switch_case` | `["OSKLoggerController.default.info"]` |

#### activities

- **Outbound Publishing**:
  - **Topic Name**: `accessControlDevice_activities` [Confirmed] `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` ``
  - **Detection Method**: Exact resolved topic-name literal in code. [Confirmed] `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` ``
  - **Payload**: `{ type: 'activities', entity: data }` where `data` is the processed activity record.
- **Inbound Receiving**:
  - No inbound Pub/Sub push routes are defined in this capability's pack. [Confirmed]

#### configs

- **Outbound Publishing**: No outbound publishing behavior is evidenced in this capability's pack. [Confirmed]
- **Inbound Receiving**: The route `POST /access-control-devices/pubsub/configs` is registered as a Pub/Sub push route (`isPubSubPushRoute: true`). [Confirmed] `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
  - The handler `processConfigPubSubMessage` parses the base64-encoded message data [Confirmed] `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|JSON.parse|anon|Buffer.from(pubSubMessage.message.data, 'base64').toString('utf-8')|#1` `` and dispatches based on the `operation` field using an `if_else_branch` dispatch mechanism. [Confirmed] `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` ``

### Event Routing Table
| Operation Value | Dispatch Kind | Target Calls | Operation Resolution Status |
|---|---|---|---|
| `insert` | `if_else_branch` | `OSKAccessControlDeviceController.default.get`, `OSKAccessControlDeviceController.default.update`, `res.status(201).send`, `res.status`, `OSKAccessControlDeviceController.default.create` | `resolved` |
| `update` | `if_else_branch` | `OSKAccessControlDeviceController.default.get`, `OSKAccessControlDeviceController.default.update`, `res.status(201).send`, `res.status`, `OSKAccessControlDeviceController.default.create` | `resolved` |
| `delete` | `if_else_branch` | `OSKAccessControlDeviceController.default.delete`, `res.status(209).send`, `res.status` | `resolved` |

[Confirmed] `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` ``, `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` ``, `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` ``

#### firmwares

No Pub/Sub behavior (outbound publishing or inbound receiving) is evidenced in this capability's pack [Confirmed].

#### intercom_entries

### Outbound Publishing
No outbound Pub/Sub publishing is evidenced in this capability's pack (*Confirmed*).

### Inbound Receiving
The route `POST /access-control-devices/pubsub/intercom-entries` is registered as a Pub/Sub push route (*Confirmed* — `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``). The handler `processIntercomEntryPubSubMessage` base64-decodes and parses the incoming message payload, then dispatches operations based on the payload's `operation` value (*Confirmed* — `src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts` (lines 60-103)).

| Operation Value | Dispatch Kind | Target Calls |
| :--- | :--- | :--- |
| `create` | `switch_case` | `OSKAccessControlDeviceIntercomController.default.create`, `res.status(201).send`, `res.status` (*Confirmed* — `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``) |
| `update` | `switch_case` | `isPubsubPayloadUpdate`, `OSKAccessControlDeviceIntercomEntryRouteHandler.convertIntercomDates`, `OSKAccessControlDeviceIntercomController.default.update`, `res.status(201).send`, `res.status` (*Confirmed* — `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``) |
| `delete` | `switch_case` | `res.status(200).send`, `res.status` (*Confirmed* — `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``) |

*Note: The `delete` operation sends a 200 response indicating "Intercom collection deleted" but does not invoke any controller methods in the evidenced dispatch table (*Confirmed* — `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` ``).*

### 7. Data Ownership

**Ownership conclusion:**

#### Cross-Capability Data Ownership Conclusion
A review of the data ownership patterns across capabilities reveals a significant cross-cutting anomaly concerning the `accessControlDeviceAccesses` MongoDB collection [Confirmed]:

*   **Primary Owner**: The `accesses` capability is the primary owner of the `accessControlDeviceAccesses` collection, performing full CRUD operations (`findOne`, `insertOne`, `updateOne`, `deleteOne`) to manage device access permissions and pincodes [Confirmed].
*   **Secondary Consumer / Overlap**: The `firmwares` capability executes a `findOne` operation against the `accessControlDeviceAccesses` collection [Confirmed]. 
*   **Likely Defect Flag**: The `firmwares` capability queries the `accessControlDeviceAccesses` collection instead of a firmware-specific collection (such as `accessControlDeviceFirmwares`) [Confirmed]. Because the collection name does not match the domain of the capability, and because firmware metadata (such as version and download URL) is conceptually distinct from user access permissions, this represents a highly probable implementation defect in the source code where the firmware controller queries the wrong collection [Inferred].

**Per-capability evidence:**

#### _module_root

No direct MongoDB collection operations (`mongo_operation` facts) are executed by this capability [Confirmed]. `src/v1/core/shared/database.service.ts` initializes the database connection but does not perform collection-level queries [Confirmed] (`` `src/v1/core/shared/database.service.ts` (lines 10-19) ``).

#### accesses

This capability owns and operates on the following MongoDB collections:
- **`accessControlDeviceAccesses`**:
  - Operations: `findOne`, `insertOne`, `updateOne`, `deleteOne` [Confirmed] (evidenced by `mongo_operation` facts in `` `src/v1/controllers/access_control_device_accesses.controller.ts` (lines 30, 48, 74, 78, 100, 104, 134, 154, 170, 193, 201) `` and `` `src/v1/controllers/access_control_device_access_sync.controller.ts` (lines 32, 55, 59) ``).
  - Resolution Status: `resolved_from_collections_map` [Confirmed]
- **`accessControlDeviceAccessSyncDeltas`**:
  - Operations: `findMany`, `insertOne` [Confirmed] (evidenced by `mongo_operation` facts in `` `src/v1/controllers/access_control_device_access_sync.controller.ts` (lines 50, 74) ``).
  - Resolution Status: `resolved_from_collections_map` [Confirmed]

#### activities

- **MongoDB Operations**:
  - **Operation**: `insertOne` [Confirmed] `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` ``
  - **Collection Name**: Unresolved dynamically at runtime (`collectionResolutionStatus: "unresolved_dynamic"`). The collection name is determined by a variable or parameter passed to the controller method. [Confirmed] `` `call_expression|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|this._mongoDBService.insertOne|createActivity|this._mongoDBName,collectionName,newActivityDocument|#1` ``

#### configs

This capability owns and operates on the `accessControlDeviceConfigs` MongoDB collection. [Confirmed] `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` ``

### MongoDB Operations
| Collection Name | Operation | Caller Class | Caller Method | Collection Resolution Status |
|---|---|---|---|---|
| `accessControlDeviceConfigs` | `findOne` | `OSKAccessControlDeviceController` | `get` | `resolved_from_collections_map` |
| `accessControlDeviceConfigs` | `insertOne` | `OSKAccessControlDeviceController` | `create` | `resolved_from_collections_map` |
| `accessControlDeviceConfigs` | `updateOne` | `OSKAccessControlDeviceController` | `update` | `resolved_from_collections_map` |
| `accessControlDeviceConfigs` | `deleteOne` | `OSKAccessControlDeviceController` | `delete` | `resolved_from_collections_map` |

[Confirmed] `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|insertOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|updateOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1` ``

#### firmwares

- **Collection**: `accessControlDeviceAccesses` [Confirmed] (`` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` ``)
  - **Operations**: `findOne` [Confirmed] (`` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` ``)
  - **Resolution Status**: `resolved_from_collections_map` [Confirmed] (`` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` ``)

#### intercom_entries

### Mongo Collections
- **`accessControlDeviceIntercomEntries`**
  - Operations: `findOne`, `insertOne`, `updateOne` (*Confirmed* — `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|insertOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|updateOne|#1` ``)
  - Resolution Status: `resolved_from_collections_map` (*Confirmed*)
- **`accessControlDeviceIntercomEntryDeltas`**
  - Operations: `findOne`, `findMany`, `insertOne`, `updateOne` (*Confirmed* — `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#1` ``, `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#1` ``)
  - Resolution Status: `unresolved_dynamic` at the base class level (`OSKAccessControlDeviceDeltasBaseController`), but resolved to `collections.accessControlDeviceIntercomEntryDeltas` via the subclass constructor call (*Confirmed* — `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1` ``).

### 8. Outbound Coupling

#### _module_root

This capability depends on the following submodules within the `access_control_device` module:
- **`access_control_device/accesses`**:
  - `src/v1/core/shared/delta.utils.ts` imports `access_control_device_access.model` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access.model|#1` ``) and `access_control_device_access_sync_delta.model` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access_sync_delta.model|#1` ``).
  - `src/v1/index.ts` imports `./routes/access_control_device_accesses.route` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_accesses.route|#1` ``).
- **`access_control_device/activities`**:
  - `src/v1/core/protocols/pubsub_message.protocol.ts` imports `access_control_device_activities.model` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/core/protocols/pubsub_message.protocol.ts|../../models/access_control_device_activities.model|#1` ``).
  - `src/v1/index.ts` imports `./routes/access_control_device_activities.route` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_activities.route|#1` ``).
- **`access_control_device/configs`**:
  - `src/v1/index.ts` imports `./routes/access_control_device_configs.route` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_configs.route|#1` ``).
- **`access_control_device/firmwares`**:
  - `src/v1/index.ts` imports `./routes/access_control_device_firmwares.route` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_firmwares.route|#1` ``).
- **`access_control_device/intercom_entries`**:
  - `src/v1/index.ts` imports `./routes/access_control_device_intercom_entries.route` [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_intercom_entries.route|#1` ``).

#### accesses

This capability depends on the following shared utilities and infrastructure files within the `access_control_device` module:
- **`../core/shared/constants`**: Imported by `src/v1/controllers/access_control_device_access_sync.controller.ts` and `src/v1/controllers/access_control_device_accesses.controller.ts` to reference shared constants. [Confirmed] (evidenced by `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/constants|#1` `` and `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|../core/shared/constants|#1` ``).
- **`../core/shared/database.service`**: Imported by `src/v1/controllers/access_control_device_access_sync.controller.ts` and `src/v1/controllers/access_control_device_accesses.controller.ts` to perform MongoDB operations. [Confirmed] (evidenced by `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/database.service|#1` `` and `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|../core/shared/database.service|#1` ``).
- **`../core/shared/delta.utils`**: Imported by `src/v1/controllers/access_control_device_access_sync.controller.ts` and `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` to perform delta comparisons and merging. [Confirmed] (evidenced by `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/delta.utils|#1` `` and `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/shared/delta.utils|#1` ``).
- **`../../core/logging.service`**: Imported by `src/v1/handlers/routes/access_control_device_accesses_route.handler.ts` to log errors and operational info. [Confirmed] (evidenced by `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/logging.service|#1` ``).
- **`../schema/pubsub_message.schema`**: Imported by `src/v1/routes/access_control_device_accesses.route.ts` to validate inbound Pub/Sub payloads. [Confirmed] (evidenced by `` `imports_dependency|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|../schema/pubsub_message.schema|#1` ``).

#### activities

This capability depends on the following submodules/shared utilities within the `access_control_device` module:
- **`_module_root`** (specifically `core/shared/database.service`, `core/shared/constants`, `core/shared/pubsub.service`, `core/shared/errors.service`, and `core/logging.service`):
  - `src/v1/controllers/access_control_device_activities.controller.ts` imports `../core/shared/database.service` and `../core/shared/constants`. [Confirmed] `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|../core/shared/database.service|#1` ``
  - `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` imports `../../core/logging.service`, `../../core/shared/errors.service`, and `../../core/shared/pubsub.service`. [Confirmed] `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/logging.service|#1` ``

#### configs

This capability depends on shared infrastructure and models defined in the `_module_root` capability of the `access_control_device` module:
- **`_module_root` (Database Service)**: `src/v1/controllers/access_control_device_configs.controller.ts` imports `../core/shared/database.service` to perform MongoDB operations. [Confirmed] `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/database.service|#1` ``
- **`_module_root` (Constants)**: `src/v1/controllers/access_control_device_configs.controller.ts` imports `../core/shared/constants` to resolve collection names. [Confirmed] `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/constants|#1` ``
- **`_module_root` (Pub/Sub Models & Schemas)**: 
  - `src/v1/handlers/routes/access_control_device_configs_route.handler.ts` imports `../../models/pubsub_message.model` to type-check inbound Pub/Sub messages. [Confirmed] `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|../../models/pubsub_message.model|#1` ``
  - `src/v1/routes/access_control_device_configs.route.ts` imports `../schema/pubsub_message.schema` to validate inbound Pub/Sub requests. [Confirmed] `` `imports_dependency|access_control_device|src/v1/routes/access_control_device_configs.route.ts|../schema/pubsub_message.schema|#1` ``

#### firmwares

This capability depends on the following shared/infrastructure files within the module:
- **`../core/shared/constants`**: Imported by the controller [Confirmed] (`` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/constants|#1` ``).
- **`../core/shared/database.service`**: Imported by the controller to access MongoDB [Confirmed] (`` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/database.service|#1` ``).

It also depends on the external package `@oskey-io/npm-express-framework-oskey-io` across multiple files [Confirmed] (`` `src/v1/routes/access_control_device_firmwares.route.ts` (line 6) ``).

#### intercom_entries

This capability depends on the following shared/root-level files within the `access_control_device` module (*Confirmed*):
- **`../core/shared/constants`** — Imported by `access_control_device_intercom_entries.controller.ts` (line 9) and `access_control_device_intercom_entry_delta.controller.ts` (line 6) (*Confirmed*).
- **`../core/shared/database.service`** — Imported by `access_control_device_intercom_entries.controller.ts` (line 7) and `access_control_device_deltas_base.controller.ts` (line 7) (*Confirmed*).
- **`../../models/pubsub_message.model`** — Imported by `access_control_device_intercom_entries_route.handler.ts` (line 9) (*Confirmed*).
- **`../schema/pubsub_message.schema`** — Imported by `access_control_device_intercom_entries.route.ts` (line 9) (*Confirmed*).

### 9. Internal Structure

The internal structure of the `access_control_device` module is organized as a hub-and-spoke model, where the `_module_root` acts as the central composition and infrastructure hub, and five domain-specific submodules act as the spokes [Confirmed].

```
               +---------------------------------------+
               |             _module_root              |
               |  (Shared Infrastructure & Route Reg)  |
               +---+---+-----------+-----------+---+---+
                   |   |           |           |   |
      +------------+   |           |           |   +------------+
      |                |           |           |                |
      v                v           v           v                v
+----------+    +------------+ +-------+ +-----------+    +------------------+
| accesses |    | activities | |configs| | firmwares |    | intercom_entries |
+----------+    +------------+ +-------+ +-----------+    +------------------+
```

#### Submodule Coupling Details
All coupling relationships within this module are AST-verified and confirmed [Confirmed]:

*   **`_module_root` (Composition & Infrastructure Hub)**:
    *   **Outbound Coupling**:
        *   Couples to `accesses` to import sync models (`OSKAccessControlDeviceAccessSyncDelta`, `OSKAccessControlDeviceAccessSyncDeltaDB`, `OSKAccessControlDeviceAccess`) in `src/v1/core/shared/delta.utils.ts` and to register routes (`accessControlDeviceAccessesRoutes`) in `src/v1/index.ts` [Confirmed].
        *   Couples to `activities` to import the activity model (`OSKAccessControlDeviceActivitiesDBWithoutId`) in `src/v1/core/protocols/pubsub_message.protocol.ts` and to register routes (`accessControlDeviceActivitiesRoutes`) in `src/v1/index.ts` [Confirmed].
        *   Couples to `configs` to register routes (`accessControlDeviceConfigsRoutes`) in `src/v1/index.ts` [Confirmed].
        *   Couples to `firmwares` to register routes (`accessControlDeviceFirmwaresRoutes`) in `src/v1/index.ts` [Confirmed].
        *   Couples to `intercom_entries` to register routes (`accessControlDeviceIntercomEntriesRoutes`) in `src/v1/index.ts` [Confirmed].
    *   **Inbound Coupling**: Receives inbound imports from all five domain submodules which rely on its shared core infrastructure [Confirmed].

*   **`accesses` Submodule**:
    *   **Outbound Coupling**: Couples to `_module_root` by importing shared constants (`collections`), database services (`mongoDBService`, `mongoDBName`), and delta utilities (`compareAccessLists`, `mergeDeltas`, `MergedDeltaResult`) in `src/v1/controllers/access_control_device_access_sync.controller.ts` [Confirmed].

*   **`activities` Submodule**:
    *   **Outbound Coupling**: Couples to `_module_root` by importing shared constants (`collections`) and database services (`mongoDBService`, `mongoDBName`) in `src/v1/controllers/access_control_device_activities.controller.ts`, and the logging service (`OSKLoggingService`) in `src/v1/handlers/routes/access_control_device_activities_route.handler.ts` [Confirmed].

*   **`configs` Submodule**:
    *   **Outbound Coupling**: Couples to `_module_root` by importing shared constants (`collections`) and database services (`mongoDBService`, `mongoDBName`) in `src/v1/controllers/access_control_device_configs.controller.ts`, and the shared Pub/Sub message model (`OSKPubSubMessage`) in `src/v1/handlers/routes/access_control_device_configs_route.handler.ts` [Confirmed].

*   **`firmwares` Submodule**:
    *   **Outbound Coupling**: Couples to `_module_root` by importing shared constants (`collections`) and database services (`mongoDBService`, `mongoDBName`) in `src/v1/controllers/access_control_device_firmwares.controller.ts` [Confirmed].

*   **`intercom_entries` Submodule**:
    *   **Outbound Coupling**: Couples to `_module_root` by importing shared constants (`collections`) and database services (`mongoDBService`, `mongoDBName`) in `src/v1/controllers/access_control_device_intercom_entries.controller.ts`, and shared constants (`collections`) in `src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts` [Confirmed].

### 10. Cross-Module Relationships

*(deterministic -- this repository consists of exactly one module, `access_control_device`; no cross-module relationships exist.)*

### 11. Permissions & Security

*(this repo has zero RBAC/authorization facts anywhere, verified in Phase 1 -- no cross-cutting judgment layer is added on top of the per-capability evidence below, since there is nothing to compare.)*

**Per-capability evidence:**

#### _module_root

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source [Confirmed].

#### accesses

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source. [Confirmed]

#### activities

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source. [Confirmed]

#### configs

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source. [Confirmed]

#### firmwares

No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source [Confirmed].

#### intercom_entries

*No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.* (*Confirmed*)

### 12. External Hooks

#### _module_root

- **Environment Variables**: Loads configuration from `.env.local` using `dotenv` [Confirmed] (`` `src/v1/core/shared/database.service.ts` (lines 9-10) ``).
- **External Libraries**:
  - `@google-cloud/pubsub` is imported to manage Pub/Sub messaging [Confirmed] (`` `imports_dependency|access_control_device|src/v1/core/shared/pubsub.service.ts|@google-cloud/pubsub|#1` ``).
  - `@oskey-io/npm-express-framework-oskey-io` is imported for framework integration [Confirmed] (`` `imports_dependency|access_control_device|src/v1/index.ts|@oskey-io/npm-express-framework-oskey-io|#1` ``).

#### accesses

No external hooks (environment variables, external HTTP client paths, or storage paths) are evidenced in this capability's pack. [Confirmed]

#### activities

No external hooks (such as environment variables, HTTP client paths, or storage paths) are explicitly evidenced in this capability's pack, other than the outbound Pub/Sub topic `accessControlDevice_activities` covered in Section 5. [Confirmed]

#### configs

No external hooks (such as environment variables, external HTTP client paths, or storage paths) are evidenced in this capability's pack. [Confirmed]

#### firmwares

No external hooks (environment variables, external HTTP/client paths, or storage paths) are evidenced in this capability's pack [Confirmed].

#### intercom_entries

No environment variables, external HTTP client paths, or storage paths are evidenced in this capability's pack (*Confirmed*).

### 13. Architectural Observations

*   **Strict Hub-and-Spoke Architecture**: The module enforces a clean separation of concerns where domain submodules do not import from or call each other directly [Confirmed]. All cross-cutting concerns—such as database connectivity, logging, delta-merging algorithms, and route registration—are centralized in the `_module_root` and consumed by the domain submodules [Confirmed].
*   **Dual-Boundary Interface Pattern**: The module maintains two distinct external boundaries [Confirmed]. The device-facing boundary consists of standard HTTP GET/POST routes designed for low-overhead edge consumption [Confirmed]. The backend-facing boundary consists of HTTP POST routes designed specifically to receive Google Cloud Pub/Sub push subscriptions, which parse incoming event payloads to trigger asynchronous database updates [Confirmed].
*   **Dynamic Delta Tracking Inheritance**: The `intercom_entries` capability utilizes an inheritance pattern where `OSKAccessControlDeviceIntercomEntryDeltaController` extends a generic base class `OSKAccessControlDeviceDeltasBaseController` [Confirmed]. The base class dynamically executes MongoDB operations on a collection passed to its constructor, allowing delta-tracking logic to be reused across different domains [Inferred].

### 14. Risks & Open Questions

**Cross-cutting risks:**

*   **Cross-Capability Data Access Defect (High Risk)**: The `firmwares` capability queries the `accessControlDeviceAccesses` collection instead of a firmware-specific collection [Confirmed]. This strongly indicates a copy-paste or logical defect in `OSKAccessControlDeviceFirmwaresController` that could cause firmware queries to fail, return incorrect data, or inadvertently expose access control records [Inferred].
*   **Dynamic Collection Resolution (Medium Risk)**: The `activities` capability performs database writes (`insertOne`) using a collection name resolved dynamically at runtime (`collectionResolutionStatus: "unresolved_dynamic"`) [Confirmed]. Because the collection name is passed as a variable to `createActivity`, static analysis cannot verify which collection is being written to, introducing a risk of runtime database errors or writes to unintended collections if the variable is malformed [Inferred].
*   **Unimplemented Deletion Logic (Medium Risk)**: In the `intercom_entries` capability, the Pub/Sub message handler for "delete" operations returns a success response (`"Intercom collection deleted"`) but does not appear to execute any database deletion operations in its controller [Inferred]. It is unknown whether this deletion is handled elsewhere or if it represents an incomplete stub [Inferred].

**Per-capability open questions:**

#### _module_root

- What is the exact implementation of `OSKMongoDBService` and how does it manage connection pooling, given that only its instantiation log and dotenv configuration are visible in `database.service.ts`?
- Which specific routes in other capabilities utilize `pubSubMessageSchema` for request validation?

#### accesses

- The exact structure of the external Pub/Sub publisher that triggers the `/access-control-devices/pubsub/accesses` push route is unknown from this pack's evidence. [Inferred]
- Whether there are other capabilities in the `access_control_device` module that consume or produce accesses data is unknown from this pack's evidence. [Inferred]

#### activities

- What is the exact name of the MongoDB collection used to store activities? The collection name is passed dynamically as `collectionName` to `createActivity` and is unresolved in the static analysis. [Inferred]
- What is the schema structure of `OSKAcdReceivedDigicomActivitiesSchema`? Its fields are not defined in this capability's pack, indicating it is defined elsewhere. [Inferred]

#### configs

- **MongoDB Service Resolution**: The call expressions to `this._mongoDBService` are marked as `unresolved` in the evidence pack. It is unclear how the database service is instantiated or injected into `OSKAccessControlDeviceController`. [Inferred]
- **Pub/Sub Message Schema Location**: The `pubSubMessageSchema` is imported from `../schema/pubsub_message.schema` which resides outside of this capability's directory, indicating it is a shared schema across multiple capabilities. [Inferred]

#### firmwares

- **Collection Mapping**: Why is the collection queried named `accessControlDeviceAccesses` instead of a firmware-specific collection? Is firmware information stored directly on the access record? [Inferred]
- **Document Schema**: What is the exact structure of the database document in `accessControlDeviceAccesses` that maps to `OSKAccessControlDeviceFirmware`? [Unknown]

#### intercom_entries

- Why does the `delete` operation in `processIntercomEntryPubSubMessage` only send a 200 response (`"Intercom collection deleted"`) without invoking any database deletion logic in the controller? Is the deletion handled elsewhere, or is it a stub?
- Are there other subclasses of `OSKAccessControlDeviceDeltasBaseController` in other capabilities, and how do they coordinate delta tracking?

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, 12, and 14) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.
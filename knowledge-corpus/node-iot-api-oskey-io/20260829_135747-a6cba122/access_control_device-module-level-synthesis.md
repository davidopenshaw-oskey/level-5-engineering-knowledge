## MODULE-WIDE

### Executive Summary
The `access_control_device` module is the core IoT API service designed to manage physical access control devices `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_accesses.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_activities.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_configs.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_firmwares.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_intercom_entries.route|#1` `` (**Confirmed**). It provides comprehensive capabilities for managing device configurations, firmware versioning, access rights synchronization (via Digicom and Intercom protocols), activity logging (including BLE, pincode, face recognition, and signaling), and intercom directory management (**Confirmed**). The module relies heavily on Google Cloud Pub/Sub for asynchronous event-driven synchronization and MongoDB for persistence (**Confirmed**).

### Architectural Position
This module acts as the central IoT gateway and API handler for physical access control devices (**Inferred**). It sits between physical hardware devices (which pull configurations, firmwares, and access lists, and push activity logs) and backend cloud services (which publish configuration and access updates via Pub/Sub) (**Inferred**).

### Ownership Conclusion
Based on the database operations, the module interacts with several MongoDB collections:
*   `accessControlDeviceAccesses`: Primarily owned by the `accesses` submodule, which manages creation, updates, and deletion of access rights `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|deleteOne|#1` `` (**Confirmed**). However, the `firmwares` submodule also queries this collection `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` `` (**Confirmed**). This is a highly likely copy-paste defect in `OSKAccessControlDeviceFirmwareController.get`, which should query a firmware-specific collection rather than accesses (**Inferred**).
*   `accessControlDeviceAccessSyncDeltas`: Owned by the `accesses` submodule to track delta changes for synchronization `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|findMany|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|insertOne|#1` `` (**Confirmed**).
*   `accessControlDeviceConfigs`: Owned by the `configs` submodule to store device configurations `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` `` (**Confirmed**).
*   `accessControlDeviceIntercomEntries`: Owned by the `intercom_entries` submodule to manage intercom directories `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#2` `` (**Confirmed**).
*   `unresolved_collection` (activities): The `activities` submodule writes to a dynamically resolved collection name `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` `` (**Confirmed**).
*   `unresolved_collection` (intercom entry deltas): The base delta controller in `intercom_entries` performs operations on a dynamically resolved collection name `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` `` (**Confirmed**).

### Architectural Observations
*   **Base Controller Pattern**: The `intercom_entries` submodule utilizes an inheritance pattern where `OSKAccessControlDeviceIntercomEntryDeltaController` extends `OSKAccessControlDeviceDeltasBaseController` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1` `` (**Confirmed**). This base controller dynamically handles delta tracking and acknowledgement, explaining why its collection names are unresolved dynamically (**Inferred**).
*   **Unresolved Call Edges**: `this.pubSub.createTopic` in `src/v1/core/shared/pubsub.service.ts` (line 39) is unresolved `` `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.createTopic|createTopic|topicName|#1` `` (**Confirmed**). This indicates that the underlying `@google-cloud/pubsub` library's type declarations or implementation details are not fully resolved by the compiler analysis, which is typical for external SDKs (**Inferred**).

### Cross-Cutting Risks & Open Questions
*   **Firmware Controller Defect**: The `firmwares` capability queries the `accessControlDeviceAccesses` collection `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` `` (**Confirmed**). This is a critical cross-cutting risk as it indicates a likely bug where firmware retrieval might fail or return incorrect data because it is reading from the accesses collection instead of a firmware collection (**Confirmed**).
*   **Dynamic Collection Names**: Both `activities` and the base delta controller in `intercom_entries` use dynamic collection names that could not be statically resolved `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` `` (**Confirmed**). This introduces risk around database schema migrations and static analysis verification (**Inferred**).


## CAPABILITY: _module_root

### Summary
Provides the foundational infrastructure, shared utilities, and plumbing for the `access_control_device` module (**Inferred**). It is organized around generic infrastructure (logging, errors), Pub/Sub shared plumbing, shared delta/sync utilities, and the composition root (**Inferred**).

### Primary Responsibilities
*   Provides a centralized logging service (`OSKLoggingService`) to format and output logs with severity levels `` `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logCritical|#1` `` `` `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logError|#1` `` `` `service_method|access_control_device|src/v1/core/logging.service.ts|OSKLoggingService|logInfo|#1` `` (**Confirmed**).
*   Provides a centralized Google Cloud Pub/Sub service wrapper (`OSKPubSubService`) to manage topics, subscriptions, and message publishing `` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|checkSubscriptionExists|#1` `` `` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|createTopic|#1` `` `` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1` `` (**Confirmed**).
*   Implements shared delta comparison and merging algorithms (`compareAccessLists`, `mergeDeltas`) to track state changes (added, changed, removed) for synchronization `` `function_declaration|access_control_device|src/v1/core/shared/delta.utils.ts|compareAccessLists|#1` `` `` `function_declaration|access_control_device|src/v1/core/shared/delta.utils.ts|mergeDeltas|#1` `` (**Confirmed**).
*   Defines custom HTTP error structures (`CustomHttpError`) `` `source_class|access_control_device|src/v1/core/shared/errors.service.ts|CustomHttpError` `` (**Confirmed**).
*   Acts as the composition root (`src/v1/index.ts`) to register and expose routes for all submodules `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_accesses.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_activities.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_configs.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_firmwares.route|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_intercom_entries.route|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
No routes are registered directly under `_module_root` (**Confirmed**).

### Pub/Sub Behavior
*   **Outbound Publishing**:
    *   `OSKPubSubService.publishMessage` publishes messages to Google Cloud Pub/Sub topics `` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1` `` (**Confirmed**).
*   **Inbound Receiving**:
    *   No inbound Pub/Sub push routes are handled directly at the root (**Confirmed**).

### Data Ownership
No MongoDB collections are directly owned or operated on by `_module_root` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `accesses` (via `delta.utils.ts` and `index.ts` `` `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access_sync_delta.model|#1` `` `` `imports_dependency|access_control_device|src/v1/core/shared/delta.utils.ts|../../models/access_control_device_access.model|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_accesses.route|#1` ``) (**Confirmed**).
*   `activities` (via `pubsub_message.protocol.ts` and `index.ts` `` `imports_dependency|access_control_device|src/v1/core/protocols/pubsub_message.protocol.ts|../../models/access_control_device_activities.model|#1` `` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_activities.route|#1` ``) (**Confirmed**).
*   `configs` (via `index.ts` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_configs.route|#1` ``) (**Confirmed**).
*   `firmwares` (via `index.ts` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_firmwares.route|#1` ``) (**Confirmed**).
*   `intercom_entries` (via `index.ts` `` `imports_dependency|access_control_device|src/v1/index.ts|./routes/access_control_device_intercom_entries.route|#1` ``) (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
*   **Environment Variables**: `dotenv.config` is called in `database.service.ts` `` `call_expression|access_control_device|src/v1/core/shared/database.service.ts|dotenv.config|anon|{ path: '.env.local', override: true }|#1` `` (**Confirmed**).
*   **Pub/Sub Topic Creation**: `this.pubSub.createTopic` `` `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.createTopic|createTopic|topicName|#1` `` (**Confirmed**).

### Open Questions
*   The exact environment variables loaded by `dotenv` are not explicitly declared in the facts (**Inferred**).


## CAPABILITY: accesses

### Summary
Manages access rights, pincodes, and access synchronization deltas for access control devices, supporting both Digicom and Intercom protocols (**Inferred**).

### Primary Responsibilities
*   Retrieves and paginates access control lists for specific devices `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|fullDocument.accesses.slice|getPaginated|startIndex,startIndex + limit|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.findOne|getPaginated|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1` `` (**Confirmed**).
*   Manages access records (create, update, delete, recreate, insert array) in the database `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.findOne|create|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.insertOne|insert|this._mongoDBName,collections.accessControlDeviceAccesses,accessEntry|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.updateOne|create|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId },{
                    $push: { accesses: newAccess },
                    $set: { modificationDate: timestamp },
                }|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.updateOne|deleteAccess|this._mongoDBName,collections.accessControlDeviceAccesses,{
                    accessControlDeviceId,
                },{
                    $pull: {
                        accesses: { accessId: accessEntryToDelete.access.accessId },
                    },
                    $set: {
                        modificationDate: timestamp,
                    },
                }|#1` `` (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize accesses (insert, update, delete, recreate) `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|delete|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|insert|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|recreate|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|update|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` (**Confirmed**).
*   Computes and retrieves access synchronization deltas (Digicom and Intercom) since a given timestamp `` `call_expression|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|compareAccessLists|updateFromFullList|oldAccesses,newAccesses|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|this._mongoDBService.findMany|getMergedDeltasSince|this._mongoDBName,collections.accessControlDeviceAccessSyncDeltas,{
            accessControlDeviceId,
            timestamp: { $gt: since },
        }|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|OSKAccessControlDeviceAccessSyncController.default.getMergedDeltasSince|anon|accessControlDeviceId,sinceDate|#1` `` (**Confirmed**).
*   Retrieves valid pincodes associated with a device's accesses `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|device.accesses
                .flatMap((access: OSKAccessControlDeviceAccess) => access.accessMethods)
                .filter((method: OSKAccessMethod) => method.type === 'pincode')
                .map|anon|(method: { type: 'pincode'; pincode: string }) => method.pincode|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|uniquePincodes.map|anon|(pincode, index) => ({
                    id: index.toString(),
                    Pincode: pincode,
                })|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
*   `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp` | `getAccessSyncDeltasDigicom` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/digicom/:timestamp|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp` | `getAccessSyncDeltasIntercom` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/deltas/intercom/:timestamp|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp` | `getAllPerAccessControlDevicePaginated` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom/:timestamp|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/accesses/digicom` | `getAllPerAccessControlDevicePaginated` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/digicom|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/accesses/pincodes` | `getPincodesPerAccessControlDevice` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses/pincodes|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/accesses` | `getAllPerAccessControlDevice` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/:accessControlDeviceId/accesses|GET|2023-01-01|#1` ``
*   `POST /access-control-devices/pubsub/accesses` | `processAccessPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) `` `route_definition|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|/access-control-devices/pubsub/accesses|POST|2023-01-01|#1` ``
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1` ``
        *   `message` (any, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1` ``
        *   `subscription` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1` ``

### Pub/Sub Behavior
*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.filter"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|delete|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `insert` | `resolved` | `["OSKLoggerController.default.info"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|insert|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `recreate` | `resolved` | `["OSKLoggerController.default.info"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|recreate|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `update` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.find","oldAccesses.map","OSKAccessControlDeviceAccessRouteHandler._isAccessSemanticallyEqual","OSKLoggerController.default.debug"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|update|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |

### Data Ownership
*   `accessControlDeviceAccesses` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccesses|updateOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|deleteOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#3` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|findOne|#4` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|insertOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#3` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#4` `` (**Confirmed**).
*   `accessControlDeviceAccessSyncDeltas` | `findMany`, `insertOne` | `resolved_from_collections_map` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|findMany|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|accessControlDeviceAccessSyncDeltas|insertOne|#1` `` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `_module_root` (imports `database.service`, `constants`, `delta.utils`, `logging.service`, `pubsub_message.model`) `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/database.service|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|../core/shared/delta.utils|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/logging.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../core/shared/delta.utils|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_accesses_route.handler.ts|../../models/pubsub_message.model|#1` `` (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
None evidenced (**Confirmed**).

### Open Questions
None.


## CAPABILITY: activities

### Summary
Manages the ingestion, transformation, and logging of access control device activity events (such as intercom, digicom, pincode, face recognition, BLE, sesame, and signaling activities) (**Inferred**).

### Primary Responsibilities
*   Ingests activity logs from devices via Digicom or Intercom protocols `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1` `` (**Confirmed**).
*   Transforms incoming raw activity payloads into standardized database records (`OSKAcdActivityRecord`) `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._constructActivityRecord|_transformActivityDigicomData|baseActivity|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._constructActivityRecord|_transformActivityIntercomData|baseActivity|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._transformActivityDigicomData|anon|activityReceived,accessControlDeviceId|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|OSKAccessControlDeviceActivitiesRouteHandler._transformActivityIntercomData|anon|activityReceived,accessControlDeviceId|#1` `` (**Confirmed**).
*   Saves activity records to the database `` `call_expression|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|this._mongoDBService.insertOne|createActivity|this._mongoDBName,collectionName,newActivityDocument|#1` `` (**Confirmed**).
*   Publishes ingested activity events to a Pub/Sub topic (`accessControlDevice_activities`) for downstream consumption `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` `` `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
*   `POST /access-control-devices/:accessControlDeviceId/activities/digicom` | `processActivitiesDigicom` | `OSKAcdReceivedDigicomActivitiesSchema` `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/digicom|POST|2023-01-01|#1` ``
*   `POST /access-control-devices/:accessControlDeviceId/activities/intercom` | `processActivitiesIntercom` | `OSKAcdReceivedIntercomActivitySchema` `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities/intercom|POST|2023-01-01|#1` ``
    *   **Request Schema (`OSKAcdReceivedIntercomActivitySchema`)**:
        *   `accessControlDeviceId` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|accessControlDeviceId|#1` ``
        *   `accessId` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|accessId|#1` ``
        *   `activityType` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|activityType|#1` ``
        *   `deviceId` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|deviceId|#1` ``
        *   `error` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|error|#1` ``
        *   `pincode` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|pincode|#1` ``
        *   `success` (boolean, required) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|success|#1` ``
        *   `timestamp` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|timestamp|#1` ``
        *   `timestampKeystrokes` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|timestampKeystrokes|#1` ``
        *   `userId` (unknown, optional) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_access_activity.schema.ts|OSKAcdReceivedIntercomActivitySchema|userId|#1` ``
*   `POST /access-control-devices/:accessControlDeviceId/activities` | `processActivitiesIntercom` | `OSKAcdReceivedIntercomActivitySchema` `` `route_definition|access_control_device|src/v1/routes/access_control_device_activities.route.ts|/access-control-devices/:accessControlDeviceId/activities|POST|2023-01-01|#1` ``

### Pub/Sub Behavior
*   **Outbound Publishing**:
    *   Topic: `accessControlDevice_activities` | Confidence: **Confirmed** | Detection Method: `pubsub_publish_call` / `external_hook` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` `` `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` ``
*   **Inbound Receiving**: None evidenced (**Confirmed**).

### Data Ownership
*   `unresolved_collection` (Dynamic collection name) | `insertOne` | `unresolved_dynamic` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` `` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `_module_root` (imports `database.service`, `constants`, `logging.service`, `errors.service`, `pubsub.service`) `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|../core/shared/database.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/logging.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/shared/errors.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|../../core/shared/pubsub.service|#1` `` (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
*   **Pub/Sub Topic**: `accessControlDevice_activities` `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` `` (**Confirmed**).

### Open Questions
*   The collection name for storing activities is unresolved dynamically in the controller (`insertOne(unresolved_collection)`) `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|unresolved_collection|insertOne|#1` ``. What is the actual collection name? (**Unknown**).


## CAPABILITY: configs

### Summary
Manages the configuration settings of access control devices, including door management, home screen layouts, localized info blocks, and communication schedules (**Inferred**).

### Primary Responsibilities
*   Retrieves configuration settings for a specific device, optionally filtering by a timestamp `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKAccessControlDeviceController.default.get|anon|accessControlDeviceId|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|OSKAccessControlDeviceController.default.get|anon|accessControlDeviceId|#2` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` `` (**Confirmed**).
*   Creates, updates, and deletes device configurations in the database `` `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.deleteOne|delete|this._mongoDBName,collections.accessControlDeviceConfigs,{ accessControlDeviceId }|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.insertOne|create|this._mongoDBName,collections.accessControlDeviceConfigs,configToInsert|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|this._mongoDBService.updateOne|update|this._mongoDBName,collections.accessControlDeviceConfigs,{ accessControlDeviceId },{ $set: { ...configToUpdate, modificationDate: timestamp } }|#1` `` (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize configuration changes (insert, update, delete) `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
*   `GET /access-control-devices/:accessControlDeviceId/config/:timestamp` | `getConfigAfterTimestamp` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/config` | `getConfig` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``
*   `POST /access-control-devices/pubsub/configs` | `processConfigPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1` ``
        *   `message` (any, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1` ``
        *   `subscription` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1` ``

### Pub/Sub Behavior
*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKAccessControlDeviceController.default.delete","res.status(209).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
    | `insert` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
    | `update` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |

### Data Ownership
*   `accessControlDeviceConfigs` | `findOne`, `insertOne`, `updateOne`, `deleteOne` | `resolved_from_collections_map` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|deleteOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|accessControlDeviceConfigs|updateOne|#1` `` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `_module_root` (imports `database.service`, `constants`, `pubsub_message.model`) `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_configs.controller.ts|../core/shared/database.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_configs_route.handler.ts|../../models/pubsub_message.model|#1` `` (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
None evidenced (**Confirmed**).

### Open Questions
None.


## CAPABILITY: firmwares

### Summary
Manages firmware versioning and download URLs for access control devices (**Inferred**).

### Primary Responsibilities
*   Retrieves the current firmware version and URL for a specific access control device `` `call_expression|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|this._mongoDBService.findOne|get|this._mongoDBName,collections.accessControlDeviceAccesses,{ accessControlDeviceId }|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_firmwares_route.handler.ts|OSKAccessControlDeviceFirmwareController.default.get|anon|accessControlDeviceId|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
*   `GET /access-control-devices/:accessControlDeviceId/firmwares` | `getFirmwarePerAccessControlDevice` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``

### Pub/Sub Behavior
None evidenced (**Confirmed**).

### Data Ownership
*   `accessControlDeviceAccesses` | `findOne` | `resolved_from_collections_map` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` `` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `_module_root` (imports `database.service`, `constants`) `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|../core/shared/database.service|#1` `` (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
None evidenced (**Confirmed**).

### Open Questions
*   Why does `OSKAccessControlDeviceFirmwareController.get` query the `accessControlDeviceAccesses` collection instead of a firmware-specific collection? This appears to be a copy-paste bug or architectural defect `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_firmwares.controller.ts|accessControlDeviceAccesses|findOne|#1` `` (**Inferred**).


## CAPABILITY: intercom_entries

### Summary
Manages intercom directories, inhabitants, and intercom entry delta synchronization (acknowledgements) for access control devices (**Inferred**).

### Primary Responsibilities
*   Retrieves intercom directory entries for a specific device `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomController.default.get|anon|accessControlDeviceId|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1` `` (**Confirmed**).
*   Creates, updates, and manages intercom entries in the database `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.findOne|create|this._mongoDBName,collections.accessControlDeviceIntercomEntries,{ accessControlDeviceId }|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.insertOne|create|this._mongoDBName,collections.accessControlDeviceIntercomEntries,newIntercom|#1` `` `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|this._mongoDBService.updateOne|update|this._mongoDBName,collections.accessControlDeviceIntercomEntries,{ accessControlDeviceId },{
                    $set: { entries: newIntercomEntries },
                }|#1` `` (**Confirmed**).
*   Tracks, retrieves, and acknowledges intercom entry synchronization deltas using a base delta controller `` `call_expression|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|super|anon|collections.accessControlDeviceIntercomEntryDeltas|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryDeltaController.default.acknowledgeDelta|anon|accessControlDeviceId,deltaId|#1` `` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|OSKAccessControlDeviceIntercomEntryDeltaController.default.getAllUnacknowledged|anon|accessControlDeviceId|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1` `` `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` `` (**Confirmed**).
*   Processes inbound Pub/Sub messages to synchronize intercom entries (create, update, delete) `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` (**Confirmed**).

### Route Definitions & Request Contracts
*   `GET /access-control-devices/:accessControlDeviceId/intercom-entries-deltas` | `getAllUnacknowledgedIntercomEntriesDeltas` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|GET|2023-01-01|#1` ``
*   `POST /access-control-devices/:accessControlDeviceId/intercom-entries-deltas` | `postIntercomEntryDeltaAcknowledgement` | `postIntercomEntryDeltaAcknowledgementSchema` `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries-deltas|POST|2023-01-01|#1` ``
    *   **Request Schema (`postIntercomEntryDeltaAcknowledgementSchema`)**:
        *   `acknowledgedDeltaIds` (array, required) `` `joi_schema_field|access_control_device|src/v1/schema/access_control_device_intercom_entry.schema.ts|postIntercomEntryDeltaAcknowledgementSchema|acknowledgedDeltaIds|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/intercom-entries` | `getIntercomEntry` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/:accessControlDeviceId/intercom-entries|GET|2023-01-01|#1` ``
*   `POST /access-control-devices/pubsub/intercom-entries` | `processIntercomEntryPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) `` `route_definition|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|/access-control-devices/pubsub/intercom-entries|POST|2023-01-01|#1` ``
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1` ``
        *   `message` (any, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1` ``
        *   `subscription` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1` ``

### Pub/Sub Behavior
*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `create` | `resolved` | `["OSKAccessControlDeviceIntercomController.default.create","res.status(201).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |
    | `delete` | `resolved` | `["res.status(200).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |
    | `update` | `resolved` | `["isPubsubPayloadUpdate","OSKAccessControlDeviceIntercomEntryRouteHandler.convertIntercomDates","OSKAccessControlDeviceIntercomController.default.update","res.status(201).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |

### Data Ownership
*   `accessControlDeviceIntercomEntries` | `findOne`, `insertOne`, `updateOne` | `resolved_from_collections_map` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|findOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|accessControlDeviceIntercomEntries|updateOne|#1` `` (**Confirmed**).
*   `unresolved_collection` (Dynamic collection name for deltas base controller) | `findMany`, `findOne`, `insertOne`, `updateOne` | `unresolved_dynamic` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#3` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findOne|#3` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|insertOne|#2` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#1` `` `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|updateOne|#2` `` (**Confirmed**).

### Outbound Coupling
Depends on:
*   `_module_root` (imports `database.service`, `constants`, `pubsub_message.model`) `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entries.controller.ts|../core/shared/database.service|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/access_control_device_intercom_entry_delta.controller.ts|../core/shared/constants|#1` `` `` `imports_dependency|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|../../core/shared/database.service|#1` `` `` `imports_dependency|access_control_device|src/v1/handlers/routes/access_control_device_intercom_entries_route.handler.ts|../../models/pubsub_message.model|#1` `` (**Confirmed**).

### Permissions & Security
No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source.

### External Hooks
None evidenced (**Confirmed**).

### Open Questions
*   The collection name for storing intercom entry deltas is unresolved dynamically in the base delta controller (`OSKAccessControlDeviceDeltasBaseController`) `` `mongo_operation|access_control_device|src/v1/controllers/shared/access_control_device_deltas_base.controller.ts|unresolved_collection|findMany|#1` ``. What is the actual collection name? (**Unknown**).
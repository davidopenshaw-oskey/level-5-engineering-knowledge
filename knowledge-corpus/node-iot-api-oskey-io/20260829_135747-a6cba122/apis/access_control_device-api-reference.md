### 0. Generation Metadata

- runId: 20260829_135747-a6cba122
- generatedAt: 2026-08-30T20:10:43.764Z
- repoName: node-iot-api-oskey-io
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: assembled entirely from Sections 5 and 6 of the module-level synthesis call already made above -- no additional LLM call for this document.

### 1. Route Definitions & Request Contracts

#### _module_root

No routes are registered directly under `_module_root` (**Confirmed**).

#### accesses

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

#### activities

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

#### configs

*   `GET /access-control-devices/:accessControlDeviceId/config/:timestamp` | `getConfigAfterTimestamp` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config/:timestamp|GET|2023-01-01|#1` ``
*   `GET /access-control-devices/:accessControlDeviceId/config` | `getConfig` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/:accessControlDeviceId/config|GET|2023-01-01|#1` ``
*   `POST /access-control-devices/pubsub/configs` | `processConfigPubSubMessage` | `pubSubMessageSchema` (isPubSubPushRoute: true) `` `route_definition|access_control_device|src/v1/routes/access_control_device_configs.route.ts|/access-control-devices/pubsub/configs|POST|2023-01-01|#1` ``
    *   **Request Schema (`pubSubMessageSchema`)**:
        *   `deliveryAttempt` (number, optional) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|deliveryAttempt|#1` ``
        *   `message` (any, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|message|#1` ``
        *   `subscription` (string, required) `` `joi_schema_field|access_control_device|src/v1/schema/pubsub_message.schema.ts|pubSubMessageSchema|subscription|#1` ``

#### firmwares

*   `GET /access-control-devices/:accessControlDeviceId/firmwares` | `getFirmwarePerAccessControlDevice` | No schema `` `route_definition|access_control_device|src/v1/routes/access_control_device_firmwares.route.ts|/access-control-devices/:accessControlDeviceId/firmwares|GET|2023-01-01|#1` ``

#### intercom_entries

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

### 2. Pub/Sub Behavior

#### _module_root

*   **Outbound Publishing**:
    *   `OSKPubSubService.publishMessage` publishes messages to Google Cloud Pub/Sub topics `` `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1` `` (**Confirmed**).
*   **Inbound Receiving**:
    *   No inbound Pub/Sub push routes are handled directly at the root (**Confirmed**).

#### accesses

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.filter"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|delete|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `insert` | `resolved` | `["OSKLoggerController.default.info"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|insert|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `recreate` | `resolved` | `["OSKLoggerController.default.info"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|recreate|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |
    | `update` | `resolved` | `["OSKLoggerController.default.info","oldAccesses.find","oldAccesses.map","OSKAccessControlDeviceAccessRouteHandler._isAccessSemanticallyEqual","OSKLoggerController.default.debug"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_accesses.route.ts|update|OSKAccessControlDeviceAccessRouteHandler.processAccessPubSubMessage|#1` `` |

#### activities

*   **Outbound Publishing**:
    *   Topic: `accessControlDevice_activities` | Confidence: **Confirmed** | Detection Method: `pubsub_publish_call` / `external_hook` `` `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1` `` `` `external_hook|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|accessControlDevice_activities|#1` ``
*   **Inbound Receiving**: None evidenced (**Confirmed**).

#### configs

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `delete` | `resolved` | `["OSKAccessControlDeviceController.default.delete","res.status(209).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|delete|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
    | `insert` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|insert|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |
    | `update` | `resolved` | `["OSKAccessControlDeviceController.default.get","OSKAccessControlDeviceController.default.update","res.status(201).send","res.status","OSKAccessControlDeviceController.default.create"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_configs.route.ts|update|OSKConfigsRouteHandler.processConfigPubSubMessage|#1` `` |

#### firmwares

None evidenced (**Confirmed**).

#### intercom_entries

*   **Outbound Publishing**: None evidenced (**Confirmed**).
*   **Inbound Receiving**:
    | Operation Value | Resolution Status | Target Calls |
    |---|---|---|
    | `create` | `resolved` | `["OSKAccessControlDeviceIntercomController.default.create","res.status(201).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|create|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |
    | `delete` | `resolved` | `["res.status(200).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|delete|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |
    | `update` | `resolved` | `["isPubsubPayloadUpdate","OSKAccessControlDeviceIntercomEntryRouteHandler.convertIntercomDates","OSKAccessControlDeviceIntercomController.default.update","res.status(201).send","res.status"]` `` `pubsub_operation_route|access_control_device|src/v1/routes/access_control_device_intercom_entries.route.ts|update|OSKAccessControlDeviceIntercomEntryRouteHandler.processIntercomEntryPubSubMessage|#1` `` |
### 0. Generation Metadata

- runId: 20260829_135747-a6cba122
- generatedAt: 2026-08-29T14:01:27.715Z
- repoName: node-iot-api-oskey-io
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. Route Definitions & Request Contracts

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

### 2. Pub/Sub Behavior

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
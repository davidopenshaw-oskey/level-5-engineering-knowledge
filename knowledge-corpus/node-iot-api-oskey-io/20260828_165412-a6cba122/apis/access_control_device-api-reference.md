### 0. Generation Metadata

- runId: 20260828_165412-a6cba122
- generatedAt: 2026-08-29T07:52:55.579Z
- repoName: node-iot-api-oskey-io
- targetModule: access_control_device
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. Route Definitions & Request Contracts

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

### 2. Pub/Sub Behavior

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
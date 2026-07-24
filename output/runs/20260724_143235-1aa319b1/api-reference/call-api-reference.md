# API Reference: call

## 0. Generation Metadata

- **Run ID**: 20260724_143235-1aa319b1
- **Generated At**: 2026-07-24T14:32:41.942Z

---

## 1. Callable Functions

### Interpretation

No HTTPS callable functions are exposed by the `call` module.

### Callable Functions

No callable functions found.

### Evidence Used

- API Contract: The `call-evidence-graph.json` file contains 0 `api_contract` facts.

### Confidence

High.

---

## 2. Domain Types & Enums

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKCallCommon` | `{     callId: string;     externalCallId: string;     callerId: string;     iceServers: OSKICEServers; }` | `functions/src/modules/call/models/documents/call_document.model.ts` |
| `OSKCallStatus` | `'created' \| 'started' \| 'answered' \| 'terminated' \| 'failed' \| 'cancelled' \| 'missed'` | `functions/src/modules/call/models/documents/call_document.model.ts` |
| `OSKAccessControlDeviceCall` | `OSKCallCommon & {     callerType: 'acd';     buildingId: string;     unitId: string;     contactId: string;     callT...` | `functions/src/modules/call/models/documents/call_document.model.ts` |
| `OSKCall` | `OSKAccessControlDeviceCall` | `functions/src/modules/call/models/documents/call_document.model.ts` |
| `OSKCallDocument` | `OSKDocument<OSKCall>` | `functions/src/modules/call/models/documents/call_document.model.ts` |
| `OSKAccessControlDeviceCallCreationBody` | `{     socketId: string;     externalCallId: string;     callerId: string;     callerType: 'acd';     buildingId: stri...` | `functions/src/modules/call/models/https/call_creation_body.model.ts` |
| `OSKCallCreationBody` | `OSKAccessControlDeviceCallCreationBody` | `functions/src/modules/call/models/https/call_creation_body.model.ts` |
| `OSKAccessControlDeviceCallCreationResponse` | `OSKCall` | `functions/src/modules/call/models/https/call_creation_response.model.ts` |
| `OSKCallCreationResponse` | `OSKAccessControlDeviceCallCreationResponse` | `functions/src/modules/call/models/https/call_creation_response.model.ts` |
| `OSKCallNotificationRequestResponse` | `{     notified: string[];     notNotified: {         callerId: string;         error: {             type: string;    ...` | `functions/src/modules/call/models/https/call_notification_request_response.model.ts` |
| `OSKCallUpdateBody` | `OSKCall` | `functions/src/modules/call/models/https/call_update_body.model.ts` |
| `OSKCallRecipientStatus` | `\| 'notNotified'     \| 'hasBeenNotified'     \| 'cannotBeNotified'     \| 'didReceiveNotification'     \| 'didJoin' ...` | `functions/src/modules/call/models/shared/call_transfer_list_item.model.ts` |
| `OSKCallRecipient` | `{     callerId: string; // TODO: change "callerId" for more explicit "userId" (CLD1-853)     status: OSKCallRecipient...` | `functions/src/modules/call/models/shared/call_transfer_list_item.model.ts` |
| `OSKCallTransferListItemStatus` | `'next' \| 'future' \| 'current' \| 'done' \| 'cancelled'` | `functions/src/modules/call/models/shared/call_transfer_list_item.model.ts` |
| `OSKCallTransferListItem` | `{     callRecipients: OSKCallRecipient[];     sequenceNumber: number;     status: OSKCallTransferListItemStatus;     ...` | `functions/src/modules/call/models/shared/call_transfer_list_item.model.ts` |
| `OSKICEServers` | `{     urlStrings: string[];     username: string;     credentials: string; }` | `functions/src/modules/call/models/shared/ice_servers.model.ts` |

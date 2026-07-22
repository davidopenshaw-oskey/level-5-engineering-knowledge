# API Reference: access_control_device

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.274Z

---

## 1. Callable Functions

### Interpretation

The `access_control_device` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `onAddAccessControlDevicePublicKeyCalled` | `OSKAccessControlDevicePublicKeyAddRequest` | ```json
{
  "deviceId": "string",
  "keyType": "\"signing\" | \"crypto\"",
  "keyId": "string",
  "publicKey": "string"
}
``` |
| `onDeleteAccessControlDevicePublicKeyCalled` | `OSKAccessControlDevicePublicKeyDeleteRequest` | ```json
{
  "deviceId": "string",
  "keyType": "\"signing\" | \"crypto\"",
  "keyId": "string"
}
``` |

### Evidence Used

- API Contract: The `access_control_device-evidence-graph.json` file contains 2 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/access_control_device/index.ts` registers these handlers.

### Confidence

High.

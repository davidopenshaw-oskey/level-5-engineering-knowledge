# API Reference: settings

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.843Z

---

## 1. Callable Functions

### Interpretation

The `settings` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `onCreateSettingsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `onCreateCompositeRolesCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `getAllRoles` | `Record<string, never>` | ```json
{}
``` |
| `getAllCompositeRoles` | `Record<string, never>` | ```json
{}
``` |
| `getOrganizationCompositeRoles` | `Record<string, never>` | ```json
{}
``` |
| `onCreateBuildingRequestWorkflowsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |
| `onCreateOrganizationRequestWorkflowsCalled` | `{ dummy: string }` | ```json
{
  "dummy": "string"
}
``` |

### Evidence Used

- API Contract: The `settings-evidence-graph.json` file contains 7 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/settings/index.ts` registers these handlers.

### Confidence

High.

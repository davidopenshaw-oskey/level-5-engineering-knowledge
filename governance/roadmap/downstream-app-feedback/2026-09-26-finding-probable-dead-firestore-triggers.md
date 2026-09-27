# Finding for the wiki team and the Firebase repo owners: 7 Firestore triggers listen on paths their writers never use

**From:** the extraction pipeline (found by Lane B during W4a; verified independently by the coordinator).
**Source:** `firebase-oskey-dev` at commit `00e1d9fd` (the `staging` commit our facts were extracted from), folder `functions/src/modules/settings/modules/`. Read-only; nothing was changed in that repo.
**Status:** a code-reading finding. Not confirmed on the deployed backend: we cannot see what is deployed or what other code writes these documents. Treat as **probable**, for the repo owners to confirm.

## What we found
The Firestore triggers below are registered and live (not commented out), but the collection path they listen on differs by a letter or a plural from the path the same module's controllers write to. Firestore triggers fire only for the exact path pattern they are registered on, so a write to the writer's path would not fire them.

| # | Trigger (file:line) | Listens on | Writers (file) write to |
|---|---|---|---|
| 1 | `role/index.ts:45` `onSettingsRoleCreated` (onCreate only; the update and delete registrations at `:46-47` are commented out) | `/setting/roles/roles/{roleId}` (`rolePath`, `:12`, **singular `setting`**) | `/settings/roles/roles` (`role/controllers/role.controller.model.ts:19-43`) |
| 2 to 4 | `workflow/index.ts:50,53,56` organization request workflow (create, update, delete) | `/setting/workflows/organizationRequest/{workflowId}` (`:12`, singular `setting` **and** singular `organizationRequest`) | `/settings/workflows/organizationRequests` (`workflow/controllers/organization_request_workflow.contoller.ts:23-39`, plural) |
| 5 to 7 | `workflow/index.ts:41,44,47` building request workflow (create, update, delete) | `/settings/workflows/buildingRequests/{workflowId}` (`:11`, **plural `buildingRequests`**) | `/settings/workflows/buildingRequest` (`workflow/controllers/building_request_workflow.controller.ts:23-39`, singular) |

The composite-role triggers in `role/index.ts` use `/settings/...` and do match their writers.

## Where it came from
The extraction pipeline joins each trigger to the code that writes its collection. After W4a made every trigger's path readable (26 of 26 real Firestore triggers), 9 triggers still had no writer. Seven of those are the mismatches above; the other two have no wrapper-based writer at all (`access_control_device/index.ts:78-83` and `building/modules/building_door/index.ts:44-49`, both `onDelete`, whose documents are deleted by other means). The pipeline deliberately draws no edge for a mismatch: a wrong link is worse than none.

## What we suggest
- **Repo owners:** check whether these seven are meant to fire. If they are, the path strings need correcting; if the collections are only ever written by another path (for example a different service or a manual process), the triggers may be dead code.
- **Wiki team:** if a page documents these workflows or roles, note that the documented trigger behaviour may not occur, and link to this note until the owners confirm.
- **Us:** no action; the pipeline reports these as unmatched triggers with a reason and will pick up a correction on the next re-extract.

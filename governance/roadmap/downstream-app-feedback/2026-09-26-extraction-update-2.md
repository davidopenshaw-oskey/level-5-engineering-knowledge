# Extraction update 2 for the wiki team (2026-09-26)

**From:** the extraction pipeline (coordinator session). Continues `2026-09-26-extraction-update-1.md`. Everything below is live in `facts_index` (the source of truth) as of about 13:45 UTC on 2026-09-26, and every number was checked independently, read-only. Take a fresh copy to re-test.
**Since update 1:** facts 69,463 -> 69,626 (+163); edges 17,784 -> 17,800 (+16); facts without an embedding 0; dangling edges 0.

## What is new

### T-112, Firebase side: trigger to writer edges (W4a join)
- **`FIRESTORE_EVENT_TRIGGER` edges: 17 -> 31, all resolved**, now reaching **16 of the 26 real triggers** (from 11). The join reads each trigger's own structured path (26 triggers; the 2 Firebase auth triggers are skipped explicitly) and each writer's resolved collection path (**241 of 248** write-wrapper call sites, up from 101). All 17 earlier edges are unchanged. The 14 new edges are ordinary write-to-handler links, for example `OSKUserController.create -> OSKUserService.onDocumentCreated`, updates -> `onDocumentUpdated`, deletes -> `onDocumentDeleted`, and `OSKUserDeviceController.save -> created and updated` (a `set` may fire either, and the edge says so).
- **The 10 triggers still without a writer, and why** (we corrected our own earlier estimate of 17):
  - **7 are path mismatches inside the Firebase repo** (the probable dead triggers in `2026-09-26-finding-probable-dead-firestore-triggers.md`). No edge is drawn for them: a wrong link is worse than none.
  - **2 are `onDelete` triggers with no wrapper-based writer** (`access_control_device/index.ts:78-83`, `building/modules/building_door/index.ts:44-49`).
  - **1 has writers we cannot attribute yet:** `create /buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` is written from arrow-function class properties (`set = async (...) =>`), and the extractor records no enclosing method for those. This is an extractor gap (73 call facts in the repo are in that position, 5 of them write-wrapper calls), not a join defect. A fix is proposed and waiting for a decision; it would be additive so no `fact_ref` changes.
- **7 write-wrapper call sites have no known collection path** (base-controller helpers whose first argument is a method parameter, `document_and_message.controller.ts:45,49,53,57,65`, `document.controller.ts:264`, `organization_user_invitation.controller.ts:105`); each is reported with the reason "first argument is not a literal and no resolved path was extracted". Their callers are the resolved sites.

### T-110: Angular templates without facts (W3)
- **All 151 form controls are now extracted: 84 static (`angular_template_attribute`) and 67 bound (`angular_template_binding`), equal to the source and to your expected numbers** (they were 82 and 61). The 8 missing controls were in `@switch` blocks and in `app.component.html`; the two email-link templates start with a `@switch`, so they had no facts at all. `sign-in.component.html` went from 3 facts to 21.
- **163 new facts, no existing fact ID changed** (8,747 of 8,747 identical, so every `fact_ref` you hold is valid), no existing value changed. New Angular module **`app_root`** (98 facts): `app.component.ts`, `app.config.ts` and `app.routes.ts`, which the scan previously skipped. It brings **5 root routes** (`angular_route`, `app_root` 5 plus `features` 59) and 2 new intra-repo edges (`app.component.ts` -> the auth and cookie-consent services).
- **Nested groups are now recorded:** 53 of the 151 controls sit inside `formGroupName` or `formArrayName`; each of the 143 existing controls now carries `evidence.formGroupChain` and `evidence.formControlPath` (for example `phone.localPhoneNumber`, or `staffMembers.{$index}.email` for arrays).
- Angular is pinned to commit `8345d222` for this work, as Firebase is to `00e1d9fd`; advancing either is a later, separate step.
- The embedding cost was 10,530 tokens (163 facts).

## How to re-test (read-only, fresh copy)
1. `select count(*) from cross_repo_edges where connection_type='FIRESTORE_EVENT_TRIGGER';` expect 31, all `resolved`.
2. Angular controls: `select kind, count(*) from facts where repo='angular-app-oskey-io' and kind in ('angular_template_attribute','angular_template_binding') and payload::text like '%formControlName%' group by 1;` expect 84 and 67.
3. `select module, count(*) from facts where repo='angular-app-oskey-io' group by 1;` expect `app_root` 98, `components` 109, `core` 726, `features` 7,977.
4. Your earlier checks from update 1 still hold: 256 client function names, 65 `firestore_client_call` facts, 0 dangling edges.

## Still open, in this order
- **W4b** (Angular client Firestore paths, using the same `firestore_client_call` shape as Swift) is next; then **W4d** (edges from client paths to Firebase writers and triggers), then **W2** (Pub/Sub publish side, T-111), the decision on the arrow-function-property fix (W4e), and the classification of Angular's 5 unresolved callables.
- **Two of your items are now complete on the facts side:** T-110 (Angular controls) and the Swift half of T-112.

## What we would like from you
Re-run your checks and tell us anything that differs, especially on the Angular controls and the trigger edges. If you hold citations to trigger or control facts, they remain valid.

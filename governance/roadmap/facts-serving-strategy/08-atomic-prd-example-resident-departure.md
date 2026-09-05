# Atomic PRD (Example Output) — Resident Departure

**What this file is:** a worked example of the three-layer atomic PRD shape agreed in `01-qa-vision-and-examples.md` (A3/Q1) — Business, Evidence, Technical Proposal — built from `07-handtrace-example2-resident-departure.md`'s real, facts-only findings. Every citation below is real (file/line, or a real fact record); nothing is invented. This is a demonstration of the target output shape, not a live, team-approved PRD.

**Known incomplete, 2026-09-03 — kept as-is, not rewritten in place.** This example's Layer 2 was built before the `organization` module was ever synced into the Postgres facts index (`05-tasklist.md` item 6). A real, independent second implementation of resident-access removal — `OSKOrganizationResidentsService.deleteAppUserResident`/`_deleteNonAppUserResident`, doing materially the same work as the `removeInhabitantFromUnit`/`removeInhabitant` paths below — was invisible to this hand-trace for that reason, not because it doesn't exist. Left as a historical/illustrative artifact rather than corrected in place, matching this folder's own convention for a stale-but-informative document (see `firestore-schema.md`'s own flag for the same treatment). The real, automated pipeline's regenerated version (`pipeline/facts-postgres-index/generate-atomic-prd.ts`, output at `output/atomic-prds/resident-departure.md`, gitignored/local — see `13-atomic-prd-pipeline-tasklist.md` task 5) reflects the fuller, corrected evidence and supersedes this file as the more complete real answer for this workflow.

---

# LAYER 1 — Business

*(Written in the same style as `00_01_Appendix-PMO-012 Assign Owner Non Resident To Unit.md` — pure product narrative, no code, no facts, no citations. This layer is always product's own voice; nothing here comes from Phase 1/P2.)*

## Status
Illustrative Example — Not Yet Scoped By Product

## Workflow Name
Resident Departure

## Domain
Unit & Access Management

## Business Purpose
This workflow allows a Property Manager to schedule the removal of a resident's building access for a future date, rather than having to remove it manually on the day the resident actually leaves.

## Primary Actor
Property Manager

## Secondary Actor
Resident (departing)

## Trigger
A Property Manager knows in advance that a resident will be leaving a unit on a specific date, and wants the resident's access removed automatically on that date without further manual action.

Examples:
- End of a fixed-term tenancy
- A resident giving advance notice of moving out
- A planned unit handover between occupants

## Information Collected
- Building ID
- Unit ID
- Resident to remove (User ID)
- Scheduled departure date/time

## Business Outcome
On the scheduled date, the resident's access to the building is removed without requiring the Property Manager to take any action that day.

## System Outcome
The resident's access grant, pincode, and intercom/call-list entry are all removed automatically at the scheduled time, using the same removal behavior already used for an immediate, manually-triggered removal today.

## Related Workflows
- Existing: immediate resident removal (`removeInhabitantFromUnit`)
- Existing: scheduled activation/deactivation pattern already used for intercom communications

## Out of Scope (illustrative — for product to confirm)
- Notifying the resident in advance of the scheduled departure
- Allowing the resident (rather than only the PM) to cancel or reschedule
- Partial-unit departure nuances (e.g. one of several co-residents leaving)

## Confidence
Business Workflow: Medium (illustrative scenario, not yet reviewed by product)
Technical Workflow: **Medium-High** — see Layer 2/3 below for why this is meaningfully higher than a default "Low"
Overall Confidence: Medium

---

# LAYER 2 — Evidence

*(Every line here is fact-backed with a real citation, reused directly from `07-handtrace-example2-resident-departure.md`. No source code was read to produce this layer — see that document's own method note.)*

**Immediate removal already exists and is fully understood:**
- `removeInhabitantFromUnit` — real `api_contract` fact, `unit_management/index.ts:54`; backed by a real `service_method` fact, `unit_management_inhabitant.service.ts:180`.
- Its input shape, from real `model_property` facts on `OSKUnitManagementRemoveInhabitantRequest`: `buildingId`, `unitId`, `userId`, `inhabitantToRemoveId` (`unit_management_inhabitant_request_document.ts:10-13`).
- Its real side effects, each a real `call_expression` fact inside that function: `OSKBuildingUnitInhabitantController.default.delete` (removes the inhabitant record), `OSKAccessService.deleteAccessById` (removes the access grant), `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash` and `OSKUserPincodeController.default.delete` (removes both pincode records), `OSKBuildingIntercomService.deleteIntercomEntryUser` (removes the intercom/call-list entry).
- Real permission constraint, same fact as found in the Owner Non Resident trace: `['owner', 'tenant'].includes(requestingInhabitant.inhabitantType)` (`unit_management_inhabitant.service.ts:219`) — only an owner or tenant may remove someone, and only a 'resident' may be removed.

**The scheduling mechanism this feature needs already exists and is proven, elsewhere:**
- Real call edge in `resolved-engineering-graph.json`: `organization_intercom_communication`'s `createIntercomCommunication` calls `OSKTaskSchedulerService.scheduleTask` with an `activationExecutionDate` and a `deactivationExecutionDate` argument — a real, working "PM sets a future date, something happens automatically later" pattern already in production.
- Real, matching `cancelTask` usage exists in the same area, for cancelling a previously scheduled action.

**The real gap:**
- Checked directly against `resolved-engineering-graph.json`: zero call edges exist from `unit_management` or `building` into the `tasks` module. The scheduling pattern has never been connected to resident/unit access.
- No `model_property` fact anywhere represents a resident/inhabitant departure date. The only date-like inhabitant-adjacent fields found (`expiryDateActivationCode`, `expiryDateSms`) belong to onboarding-invitation codes, not building access.

---

# LAYER 3 — Technical Proposal

**Status: a non-binding starting point for a developer or agent to review against the current codebase — not an instruction, and not guaranteed to still be accurate (see `06-scope-clarification-and-staleness-finding.md` on why facts drift from a snapshot).**

1. Add a new request field (e.g. `scheduledDepartureDate`) alongside the existing `OSKUnitManagementRemoveInhabitantRequest` fields, or a new sibling request type if immediate and scheduled removal should stay clearly separated.
2. Reuse the existing scheduling pattern from `organization_intercom_communication.service.ts`'s `createIntercomCommunication` rather than building a new one: call `OSKTaskSchedulerService.scheduleTask` with the requested departure date as the execution time.
3. On execution, the scheduled task should invoke the *same* real removal behavior `removeInhabitantFromUnit` already performs today (the five side effects listed in Layer 2), rather than reimplementing removal — this is the specific point where reusing existing, proven logic avoids duplicating something that already exists and works.
4. Add a cancellation path using `OSKTaskSchedulerService.cancelTask`, matching the existing pattern already used for intercom communications, so a PM can cancel a scheduled departure before it executes.
5. **Flag for review, not a recommendation:** this would be the *first* connection ever made from `unit_management`/`building` into the `tasks` module (confirmed zero existing edges) — worth a deliberate architecture look, not just wiring it in as a routine change, precisely because it's new cross-module territory.

**Legacy/existing-code note (the reason this layer exists at all):** a developer or agent picking this up should not need to design a scheduling mechanism from scratch — one already exists, is production-proven, and this proposal's whole value is pointing at it rather than letting a new one get built in parallel.

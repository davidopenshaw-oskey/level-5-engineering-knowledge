# Hand-Trace — Example A1.2 (Resident Departure) Against Today's Real Facts

**Scenario (from `01-qa-vision-and-examples.md`, A1.2):** a Property Manager sets a date/time at which the current residents' building accesses should be automatically removed.

**Method, corrected per the 2026-09-01 finding:** this trace used **only** the real Phase 1 fact files (`ast-*.json`, capability packs, `resolved-engineering-graph.json`) — no reading of the cloned source repos, no grep against source, at all. Every claim below is 🟢 fact-backed. This is the intended discipline going forward; Examples 1 and 4 have already been corrected to match it retroactively.

---

## What removing a resident actually touches today (fully fact-derivable)

A real, callable function exists for immediate removal: `removeInhabitantFromUnit`, exposed as an `api_contract` at `unit_management/index.ts:54`, backed by a `service_method` fact at `unit_management_inhabitant.service.ts:180`. Its input shape is fully known from `model_property` facts alone — `OSKUnitManagementRemoveInhabitantRequest` has exactly four fields: `buildingId`, `unitId`, `userId`, `inhabitantToRemoveId`.

**What it actually does, reconstructed entirely from `call_expression` facts inside that one function (no source reading needed — every one of these is a real fact, method name and all):**
- `OSKBuildingUnitInhabitantController.default.delete` — removes the inhabitant record itself
- `OSKAccessService.deleteAccessById` — removes their access grant
- `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash` and `OSKUserPincodeController.default.delete` — removes their pincode, both the building-side and user-side records
- `OSKBuildingIntercomService.deleteIntercomEntryUser` — cleans up their intercom/call-list entry

That's a real, complete, fact-backed "here's everything a removal touches" list — five distinct real side effects, all named, all located, none requiring a source read to know they happen.

**Who can trigger it today:** the same `['owner', 'tenant'].includes(requestingInhabitant.inhabitantType)` check found in the Owner Non Resident trace (it's the same function) — only an owner or tenant can remove someone, and only a 'resident' can be removed, not another owner or tenant.

## What's missing for "Resident Departure" specifically

The PM's request isn't for immediate removal — it's for a **future-dated** removal a PM schedules in advance. Two real, fact-backed findings bear directly on whether that's a small or large gap:

**Scheduling infrastructure exists and is proven — just not here.** Real `call_expression` facts show `OSKTaskSchedulerService.scheduleTask`/`cancelTask` already in active use, for a genuinely analogous case: `organization_intercom_communication`'s `createIntercomCommunication` already schedules a *future* activation and deactivation (`scheduleTask` called with an `activationExecutionDate` and a `deactivationExecutionDate` argument — visible directly in the call edge's own recorded arguments in `resolved-engineering-graph.json`, no source read needed). This is close to the same shape as "PM sets a date, something automatic happens later."

**But nothing connects that scheduling pattern to residents or unit access.** Checked directly: `resolved-engineering-graph.json`'s call edges show zero connections from `unit_management` or `building` into the `tasks` module. And no `model_property` fact anywhere carries anything like a resident/inhabitant departure date — the only date-like inhabitant-adjacent fields that exist (`expiryDateActivationCode`, `expiryDateSms`) belong to onboarding-invitation codes, not building access.

## Honest bottom line

This is the strongest fact-only result of the three traces so far — every finding above, including the useful negative ones, came from facts alone. The real technical read this supports: removing a resident's access is a well-understood, fully-enumerable operation today (five real side effects, one real permission check), and the scheduling mechanism this feature would need already exists and is proven elsewhere in the codebase — but the two have never been connected for this specific case. That's a genuinely more specific and more useful statement than "Low confidence," and it didn't require reading a single source file to produce.

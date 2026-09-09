# Persona gap analysis: `Oskey Personas and Authority models.md` vs. the real corpus — 2026-09-08

A different real use case from today's earlier bug root-causing: comparing a written business reference doc against the actual code-derived fact corpus, using the same direct MCP-tool-calling approach (no agent, no persona wrapper — the reasoning done directly, one targeted `search_facts` call at a time, each result read before deciding the next query).

## Method

Read `governance/reference-docs/Oskey Personas and Authority models.md` in full first (the documented ground truth), then ran five targeted `search_facts` queries against the real corpus, checking each documented persona claim and probing for undocumented ones. Not exhaustive — five queries, chosen to cover the doc's own structure (base inhabitant type, the "no development yet" commercial claim, the platform-admin tier, and one prose-only actor reference) plus one open-ended probe (invitation status).

## Confirmed consistent — real, checked, not gaps

1. **Base inhabitant type**: `OSKBuildingUnitInhabitantType` (`building_unit_inhabitant_type_document.model.ts:6`) has exactly three raw values — `owner`, `tenant`, `resident`. The doc's much richer taxonomy (Owner Resident vs. Owner Non-Resident, LLD/LCD, ResidentAdmin status, Co-Inhabitant) is a business layer built from this simple enum plus other fields (e.g. `OSKBuildingUnitOwner.isResident: boolean`) — expected, not evidence of anything missing.
2. **Commercial personas**: the doc explicitly states "no development has yet been started" on `commercialTenant`/`commercialOwner`/`commercialStaff`/`commercialClient`. Searched directly — result came back `confident: false`, no genuine matching workflow code found. Real, positive confirmation the doc is accurate here.
3. **Oskey Administrator**: a real, distinct, code-confirmed concept — `OSKMaintenancePermissionChecks.isOskeyAdmin` (`admin_maintenance/utils/permissionChecks.util.ts:13`), checked via the same `OSKConsolidatedRolesController.checkUserPermissions` mechanism seen elsewhere, plus a real `adminsOskeyId` field on admin-organization request models. Consistent with the doc's own definition.

## Real candidates surfaced — worth a human decision, not proven gaps

1. **`v1.org.client`** — a real, distinct RBAC permission_candidate, appearing twice in real Angular components (`organization-building-doors-list.component.ts:84`, `organization-buildings-list.component.ts:90`), with no corresponding persona anywhere in the doc's list. Genuinely unclear from static evidence alone whether this is a real undocumented actor tier ("Client") or a legacy/experimental permission string — flagged, not resolved.
2. **"Property Manager Staff"** — referenced by name in the doc's own prose (under Supplier Staff: "...managed by Property Manager Staff") but never given its own definition, unlike every other actor in the doc. Real code evidence (granular `v1.org.property.view/edit/admin`, `v1.org.residents.admin`, `v1.org.user.admin`, `v1.org.buildings.admin` permission_candidates) is consistent with the PM section's own stated model — "governed by RBAC permissions... rather than a separate staff versus manager table" — suggesting this is the same underlying Organization User entity with a narrower permission grant, not a distinct system actor. Reads as a documentation completeness gap (a term used, never defined), not a missing persona.
3. **Invitation/pending status as an onboarding state** — a real, pervasive, code-confirmed concept: `OSKUserInvitationStatus` (`accepted | rejected | pending | cancelled`), and `OSKGetAllOrganizationUsersAndInviteesResponseData.status: "active" | "invited"` on organization users specifically. The doc's own "Access Mechanisms & Onboarding Types" section explicitly documents App User / Non-App User as onboarding *states* applied to personas (not personas themselves) — but doesn't mention "invited/pending" anywhere, even though it's the same kind of state, applies broadly (organization users, residents/inhabitants, other invitees), and materially gates what a user can do before acceptance.

## What was not checked

Only five queries ran. Not checked: Resident/Owner/Guest/Quick-Code personas individually against their doc definitions (the doc's residential-occupancy section was not re-verified point by point); the `OSKUnitRequestType` enum surfaced incidentally during the inhabitant-type search was not followed up; whether `v1.org.client` has any real UI-visible feature behind it (would need reading the two Angular components directly, not just the fact_id).

## Real decision pending

Per explicit user instruction: no edit to `governance/reference-docs/Oskey Personas and Authority models.md` without direct human confirmation on the specific proposed wording first — presented separately, not applied here.

# Atomic PRD (Example Output) — Owner Non Resident

**What this file is:** the same three-layer atomic PRD shape as `08-atomic-prd-example-resident-departure.md`, built for Example A1.1 (`01-qa-vision-and-examples.md`) using the fully-fixed index (all P1 fixes from `05-tasklist.md`, all three repos). Built specifically to check, honestly, whether today's fixes changed anything for the example that originally motivated the deepest investigation — not assumed to be a win in advance.

---

# LAYER 1 — Business

## Status
Illustrative Example — matches the real PMO-012 scenario, not yet scoped by product

## Workflow Name
Owner Non Resident

## Domain
Ownership & Unit Management

## Business Purpose
Today, a Property Manager adds a tenant into a unit, and that tenant manages the unit (adding residents such as a partner or children). This workflow introduces a new inhabitant type — an Owner Non Resident — who owns a unit but doesn't live in it, and takes over tenant management from the Property Manager for that unit.

## Primary Actor
Owner Non Resident

## Secondary Actor
Property Manager, Tenant

## Trigger
A Property Manager assigns unit ownership to a person who will not occupy the unit themselves, and that person takes on responsibility for managing tenants in the unit going forward.

## Information Collected
- Building ID, Unit ID
- Owner Non Resident's User ID
- The unit's current tenant(s), if any, being handed over to the new owner's management

## Business Outcome
The Owner Non Resident can add and manage their own tenants for the unit, without the Property Manager remaining the one who does it directly.

## Related Workflows
- Existing: tenant addition to a unit (Property-Manager-initiated today)
- Existing: inhabitant removal (`removeInhabitantFromUnit`)

## Out of Scope (illustrative — for product to confirm)
- Whether an Owner Non Resident can own units across multiple buildings
- Occupancy-state tracking (vacant/occupied) — confirmed not modeled anywhere in the codebase (see Layer 2)

## Confidence
Business Workflow: Medium (illustrative scenario)
Technical Workflow: **Low-Medium** — see Layer 2; this example's evidence came back honestly weaker than the other two examples tested the same day
Overall Confidence: Low-Medium

---

# LAYER 2 — Evidence

**Honesty note up front, not buried at the end:** this example's real retrieval results were the weakest of the three examples re-tested today (owner/resident wording queries scored 0.81-0.83 — noticeably less confident than the other two examples' 0.71-0.77). What follows is genuinely useful, but thinner and less precise than `08`'s Resident Departure evidence.

**What exists today (🟢 fact-backed):**
- A real, shared type, `OSKBuildingUnitInhabitantType`, defines exactly three inhabitant categories: `owner`, `tenant`, `resident` (`building_unit_inhabitant_type_document.model.ts:6` — union values captured by today's P1 fix, not previously available).
- A real permission check, repeated across 7 real call sites in `unit_management_inhabitant.service.ts`/`unit_management_permanent_guest.service.ts`: `['owner', 'tenant'].includes(requestingInhabitant.inhabitantType)` — owners and tenants are already equally privileged over residents today.
- Real, separate fields already exist that are directly relevant to this exact feature, surfaced by today's `OSKDocument` field-shape fix: `OSKBuildingUnitOwner.isResident`, `OSKBuildingUnitOwner.type`, `OSKUserBuildingUnit.isOwner`. These suggest an owner/resident distinction may already be partially modeled somewhere beyond the simple three-value union — worth a developer's direct look, not yet fully understood from facts alone.
- Real building-level settings toggle whether residents/co-residents can be added at all: `OSKBuildingSettings.allowResidentAddition`, `OSKBuildingSettings.allowCoResidentAddition` — directly relevant to whether an Owner Non Resident's tenant-management ability would need its own equivalent toggle.
- `OSKBuildingUnitInhabitantController extends OSKDocumentController<OSKBuildingUnitInhabitant>` (today's controller-document fix) — confirms which controller owns this data.

**🔵 Source-read pointers, not fact-backed (from the original 2026-09-01 hand-trace, still true, not re-verified today):** today's model is flat — a Property Manager's inhabitants are managed directly, with no existing "tenant belongs to a specific owner" delegation chain. No occupancy-state (vacant/occupied) or occupation-type (LLD/LCD) concept exists anywhere in the codebase, checked directly.

---

# LAYER 3 — Technical Proposal

**Status: a non-binding starting point, weaker confidence than the Resident Departure example — flagged honestly, not smoothed over.**

1. Add `ownerNonResident` as a fourth value to `OSKBuildingUnitInhabitantType`. This is a real, fan-out change: all 7 real `.includes(['owner','tenant'])` sites are exhaustive checks written for exactly three values and need explicit review, not a silent type-widening.
2. Investigate `OSKBuildingUnitOwner`/`OSKUserBuildingUnit` (found today, not previously known) before designing anything new — these may already partially model the owner/resident distinction this feature needs, which would change the real scope of this work. This is the single most important thing to check before writing any code, and it's a gap in this evidence layer, not a settled answer.
3. The delegation chain (owner manages *their own* tenants, not the unit's tenants generally) has no existing foundation — this is new design, not extension, same finding as the original hand-trace.
4. **Flag for review:** whether `allowResidentAddition`/`allowCoResidentAddition`-style settings need an equivalent for Owner-Non-Resident-managed tenant addition.

**Honest bottom line on this example specifically:** today's fixes added real, useful facts (the union values, the new owner/resident fields, the controller link) that weren't available in the original hand-trace, but retrieval for this topic remains the weakest of the three real examples tested — a real, measured result, not a inferred one.

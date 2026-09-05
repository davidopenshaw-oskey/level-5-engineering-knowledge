# Atomic PRD (Example Output) — Supplier Recurring Pincode Access

**What this file is:** the same three-layer atomic PRD shape as `08`/`10`, built for Example A1.4 using the fully-fixed index (all P1 fixes, all three repos including node-iot). This is the example where today's fixes (especially adding node-iot) produced the clearest, most confident real improvement of the three re-tested — reported honestly, including what's still a genuine gap.

---

# LAYER 1 — Business

## Status
Illustrative Example — matches the real scenario in `01-qa-vision-and-examples.md` A1.4

## Workflow Name
Recurring Supplier Pincode Access

## Domain
Supplier Access Management

## Business Purpose
Today, a Supplier's pincode access is a plain start-date/end-date window. This workflow introduces a recurring weekly schedule instead (e.g. Mon/Tue/Wed, 09:00-12:00, for gardening), plus a 6-month contract with a renewal option for both the contract and its pincodes.

## Primary Actor
Property Manager

## Secondary Actor
Supplier (staff member)

## Trigger
A Property Manager sets up a Supplier's building access on a recurring weekly schedule rather than a single continuous date range, tied to a fixed-term contract.

## Information Collected
- Building ID, Supplier Staff ID
- Days of week + time window (recurring schedule)
- Contract start date, contract length (6 months), renewal decision

## Business Outcome
A Supplier's physical access matches their real, recurring work schedule instead of being open for a continuous block of time; the contract and its pincodes can be renewed together at the end of the term.

## Related Workflows
- Existing: supplier staff pincode creation (`createPincodeDocument`, `_internalCreateSupplierStaffAccess`)

## Out of Scope (illustrative — for product to confirm)
- Contract renewal itself — confirmed not modeled anywhere in the codebase today (see Layer 2); this PRD's scope may need to split into "recurring schedule" and "contract renewal" as two separate, differently-sized pieces of work.

## Confidence
Business Workflow: Medium (illustrative scenario)
Technical Workflow: **Medium-High for the recurring-schedule half; Low for the contract-renewal half** — a real, important split this evidence layer surfaces cleanly
Overall Confidence: Medium

---

# LAYER 2 — Evidence

**This is the strongest real result of the three examples re-tested today — worth saying plainly, not just documenting.** Adding node-iot to the index (today's work) directly changed what this search finds, and it's now the top result, not something requiring a manual hand-trace to discover.

**Recurring schedule — 🟢 fact-backed, real, and now visible across all three repos in one search:**
- `OSKAccessRight.recurrence` (node-iot) — a real field on the device-facing access-right model, now the #1 real match for "does the device support a recurring weekly schedule."
- `OSKAccessRecurrenceWeekly`/`OSKAccessRecurrenceDaily`/`OSKAccessRecurrenceMonthly` — the same recurrence concept, modeled consistently in **node-iot, Firebase, and Angular** (confirmed real, cross-repo, via today's ported P1 fixes) — `OSKAccessRecurrenceWeekly` already has almost exactly the requested shape: a Monday-through-Sunday day-of-week structure.
- `OSKAccessValidity` includes `'recurrent'` as a real third option alongside `'oneTime'`/`'permanent'` — the type-level support already exists.

**🔵 Source-read pointers, not fact-backed (from the original 2026-09-01 hand-trace, still true, not achievable from facts alone even today):** the recurrence type is modeled but never actually validated on creation (`case 'recurrent': break;`, an empty stub) and, most importantly, node-iot's real device-message handler treats `'recurrent'` identically to `'oneTime'` — the schedule is silently dropped before it reaches the door. This remains the single most decision-relevant fact about this feature, and it remains something only a source read can reveal, not a retrieval-quality gap today's fixes could close (no fact type in this pipeline records "this branch ignores a field").

**Contract renewal — a real, confirmed gap, not a retrieval failure.** A direct query for "supplier contract renewal after 6 months" returned confident-looking results (distance 0.73-0.75) — but every one was about pincode *creation* generally, not renewal or contract duration specifically. Checked: there is no real "contract" or "renewal" concept anywhere in the facts. This is an honest negative result — the business concept doesn't appear to exist in the codebase at all yet, not a case of the search failing to find something real.

---

# LAYER 3 — Technical Proposal

**Status: the strongest-confidence proposal of the three examples, for the recurring-schedule half specifically.**

1. Wire up the already-existing, already-modeled `'recurrent'`/`OSKAccessRecurrenceWeekly` path for supplier pincode access — the supplier module currently only ever constructs `'permanent'` access rights and never touches this type at all, despite it existing and being used elsewhere in the codebase for the same underlying concept.
2. Fix the real, existing validation stub for `'recurrent'` access rights before relying on it.
3. **The real blocker, not optional:** node-iot's device-message handler must actually read and act on the `recurrence` field — right now it doesn't, regardless of what the rest of the stack does. No amount of Firebase-side work makes this feature real without this fix.
4. Contract renewal is new design work, not extension — no existing foundation to build on, confirmed directly.

**Honest bottom line on this example:** this is the clearest, most confident real win from today's fixes among the three examples tested — a genuinely different, more encouraging result than the "owner" example, and worth taking as the more representative case of what today's work delivered, not the outlier.

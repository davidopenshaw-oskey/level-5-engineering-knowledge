# Hand-Trace — Example A1.4 (Supplier Recurring Pincode Access) Against Today's Real Facts

**Correction (2026-09-01):** the 🔵 items below are real and were double-checked, but they are **out of scope for what the actual atomic-PRD tool could ever produce** — that tool will only ever have Phase 1's facts (and whatever P2 indexes from them), never live access to read source. "Correctly labeled as a pointer" is not the same as "a valid demonstration of P2's capability" — it demonstrates a different thing entirely (what an agent with full repo access can find), which was never in question. See `02-handtrace-example1-owner-non-resident.md`'s own correction and `03-finding-facts-are-pointers-not-payloads.md` for the fuller reasoning. The honest, properly-scoped verdict for this example is in the rewritten "What this means" section below — it is much weaker than the original version of this document concluded.

**Scenario (from `01-qa-vision-and-examples.md`, A1.4):** Supplier pincode access today is a plain start-date/end-date window. The proposed feature: a weekly recurring schedule (e.g. "Mon, Tue, Wed, 09:00-12:00, for gardening") plus a 6-month contract with a renewal option.

**Labeling key:**
- 🟢 **FACT** — directly traceable to a real Phase 1 fact record (name/file/line already extracted). This is what a facts-only P2 index could actually surface.
- 🔵 **SOURCE-ONLY** — found by reading the actual source file, or by grepping source directly. Real and correct as of this reading, but **not reachable by a facts-only system at all** — recorded here as a record of the exercise, not as evidence of what P2 could do.

---

## What exists today

🟢 **FACT** — a type alias named `OSKAccessValidity` exists at `functions/src/modules/core/modules/access/models/access_right.model.ts:13`.
🔵 **POINTER** — reading that file: `OSKAccessValidity = 'oneTime' | 'permanent' | 'recurrent'`. There is already a third option, `'recurrent'`, beyond the plain date-range the PM described as "at the moment."

🟢 **FACT** — type aliases `OSKAccessRecurrenceDaily`, `OSKAccessRecurrenceWeekly`, `OSKAccessRecurrenceMonthly`, and `OSKAccessRecurrence` all exist at `functions/src/modules/core/modules/access/models/access_recurrence.model.ts` (lines 8, 13, 27, 33).
🔵 **POINTER** — reading that file: `OSKAccessRecurrenceWeekly` already has almost exactly the shape the PM asked for — `onWeekDays: { monday, tuesday, wednesday, thursday, friday, saturday, sunday }` (all boolean), plus a daily and a monthly variant, plus an `exceptions` list for one-off overrides. **What it does *not* have:** a time-of-day window. The type covers "which days," not "09:00 until 12:00" on those days — that part of the request has no existing model at all.

🔵 **POINTER** — grepping the supplier module's real service code directly: it only ever constructs `validity: 'permanent'` access rights, using a plain `fromDate`/`toDate` pair (`supplier_staff.service.ts:346, 438`). It never references `'recurrent'` anywhere. The recurrence type exists at the shared/core level; the supplier flow specifically has never been touched to use it.

🔵 **POINTER** — reading `access_utils.service.ts:129`, the function that validates an access right on creation: `oneTime` and `permanent` both have real validation logic (checking that dates make sense); the `recurrent` case is `case 'recurrent': break;` — an empty stub that validates nothing. Nearby (lines 289-308), there's a further block of logic entirely commented out, that also references comparing `'recurrent'` against other validity types — consistent with an attempt at this having been started and left unfinished, not evidence on its own that it was.

🔵 **POINTER** — checking the other repo that would actually need to act on this: node-iot has its *own* copy of the same recurrence type (`src/v1/models/access_control_device_access_right.model.ts`) — daily/weekly/monthly, same `onWeekDays` structure, defined independently rather than imported from a shared package (unlike the Angular/Firebase inhabitant-type sharing found in the first hand-trace). **The decisive finding:** in the real handler that converts an access right into the message actually sent to a physical device (`access_control_device_accesses_route.handler.ts:331`), `'recurrent'` is handled in the *exact same branch* as `'oneTime'` — only `fromDate`/`toDate` are read; the `recurrence`/`onWeekDays` field is never referenced at all in that conversion. Whatever schedule was set is silently dropped before it ever reaches the door.

---

## What this means for PMO-012-style confidence scoring — properly scoped

**What a real, facts-only P2 could actually tell a PM or developer today:** "Four type names related to access recurrence exist — `OSKAccessValidity`, `OSKAccessRecurrenceDaily`, `OSKAccessRecurrenceWeekly`, `OSKAccessRecurrenceMonthly` — at these specific files and lines. Go look." That is the complete, honest ceiling of what this example's facts support. It is a real, useful pointer — better than nothing, better than not knowing these files exist at all — but it does not tell you whether the feature works, is half-built, or was never touched.

**What required reading source, and is therefore not something this system could produce:** that `'recurrent'` is a real third option already on the type; that the weekly shape already matches almost exactly what was asked for (just missing a time-of-day window); that the supplier module never actually uses it; that the validation logic for it is an empty stub; that a related block of logic sits commented-out nearby; and — the actual answer to "would this feature work" — that the device-message handler silently drops the schedule and treats it identically to a plain one-time access. Every part of the *useful* answer came from source, none of it from facts.

## Honest bottom line

This is the sharper of the two examples: almost nothing that made this trace valuable survives the facts-only constraint. If P2 is built exactly as Phase 1's facts are scoped today, it could not have produced this write-up's real conclusion on its own — it could only have pointed at four files and left the actual work of finding out what's in them to whoever (or whatever) reads this next. Whether that's an acceptable ceiling depends entirely on the answer to `01-qa-vision-and-examples.md`'s Section B (who's asking, and do they have their own source access) — it is not an acceptable ceiling for a human asking through a search interface with no code-reading ability of their own.

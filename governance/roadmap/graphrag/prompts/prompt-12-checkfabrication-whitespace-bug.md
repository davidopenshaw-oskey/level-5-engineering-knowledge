# Prompt 12 — fix `checkFabrication`'s whitespace false-rejection bug

Same session that found this (deep in `capability-fanout-prd-agent.ts`/`skill.v3.md` testing) should do this fix — real continuity value, no objection to that. But this touches shared, trust-critical validator code, so it gets a real, explicit brief, not an informal "you found it, you fix it."

**Standing rule: do not run `git add` or `git commit` under any circumstances.** Leave all changes uncommitted and report back — only the user commits, always.

---

## The real bug, already found and corrected in `governance/roadmap/graphrag/07-prompt-9-real-test-results-2026-09-13.md`

`checkFabrication` (`mcp-server/agent-poc/validators.ts:46`) does exact-string-equality lookup: `if (!realFactIds.has(id)) fabricated.push(id)`. A real fact_id can legitimately contain embedded newlines/indentation (`ts-morph` captures a multi-line source call chain verbatim — confirmed real, e.g. `call_expression|building|.../building_intercom_inhabitant.service.ts|inhabitants\n  .filter(...)\n  .map|createIntercomDisplayName|...`). When a model writes that same real fact_id into JSON, it naturally collapses internal whitespace onto one line — normal, expected behavior for representing multi-line source text in a JSON string field, not an invention. Exact-string match rejects this as fabricated. **The risk direction matters and must not change**: this bug causes false *rejections* of genuine citations, not false *acceptances* of invented ones — the fix must preserve that property, not just make the check "more lenient" in a way that could start accepting genuinely fabricated IDs that differ by more than formatting.

This is shared code — used by **both** `atomic-prd-agent.ts` (the one-hit baseline) and `capability-fanout-prd-agent.ts` (the experiment). Fix it once, verify both.

## What to actually do

1. **Write a real, precise whitespace-normalization function** (e.g. collapse any run of whitespace — spaces, tabs, newlines — to a single space, then trim) and apply it to *both* sides of the comparison in `checkFabrication`: the model's cited `id` and the members of `realFactIds`. State the exact rule you use and why (e.g. why collapse-to-single-space rather than strip-all-whitespace, or some other rule) — this is a real design choice, not a mechanical one, and needs a stated reason.

2. **Deliberately construct and test a genuinely-fabricated fact_id** (one that differs from any real fact_id by more than whitespace — e.g. a made-up method name, or a real fact_id with one real character changed) and confirm it is **still correctly rejected** after your fix. This is the one thing that must not regress — write this as a real, explicit test, not an assumption.

3. **Check what happens downstream of a whitespace-normalized "match."** `buildCitationNumbering` (`atomic-prd-agent.ts`) builds its numbering map keyed by the model's own cited `id` string, not the real one — if the model's version and the real version differ only by whitespace but remain two distinct strings, they could end up as **two separate entries in the numbering map** (the cited one gets a citation number, the real one shows up again, separately, in the "gathered but uncited" Audit Trail) — a real, visible duplicate-looking bug for a reader, even after `checkFabrication` stops throwing. Trace this precisely: does the fix need to go further than `checkFabrication` alone — e.g., canonicalizing the model's cited id to the real, matching fact_id string once verified, so everything downstream (numbering, snapshot freshness, fact-repo grouping, audit trail) consistently uses one real string per fact? Don't assume this is fine without checking the actual rendered output.

4. **Re-run the real case that surfaced this** (`capability-fanout-prd-agent.ts`, `skill.v3.md`/`template.v2.md`, the same business request as Round 2 — `mcp-server/gold/business-requests/1a-ownernonresident.txt`) and confirm the `building` capability's `createIntercomDisplayName` citation now succeeds end-to-end: `checkFabrication` doesn't throw, and — per step 3 — the rendered document shows this fact once, correctly numbered, not duplicated between a citation and the audit trail.

5. **Re-run the plain one-hit baseline too** (`atomic-prd-agent.ts`, any real business request) as a regression check on the other real consumer of this shared code — confirm it still validates correctly and produces the same real result it did before this change for a case that doesn't touch the whitespace issue at all.

6. **Leave all changes uncommitted.** Report your exact normalization rule and reasoning, the deliberate fabrication-rejection test result, what you found tracing the downstream numbering question, and both real re-run results, per the standing rule above.

If the real downstream behavior in step 3 turns out fine without further changes (i.e., the duplicate-entry risk doesn't actually materialize for some reason found by tracing the real code), say so directly with the real reason why, rather than adding unneeded complexity to guard against a risk that isn't real.

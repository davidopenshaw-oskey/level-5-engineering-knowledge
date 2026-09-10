# Prompt-precision pilot — vague "2" vs. precise "2a" — a real, more serious finding than pair 1 — 2026-09-10

Second real pair in the precision pilot started in `41-...md`: `test-questions.md`'s vague item "2" (resident departure, informal draft) vs. the precise "2a" version, same v2 skill+template, unchanged, so precision is still the only deliberately varied real input. Real debug log preserved at `mcp-server/gold/debug-logs/2026-09-10-resident-departure-2-vague.jsonl`. Also a second real, independent confirmation of the retry-on-429 fix working end-to-end — hit another live 429, retried once (1s backoff), completed cleanly.

## Real result — the opposite direction from pair 1, and a more serious problem

| | Vague ("2") | Precise ("2a", today's retry-fix baseline) |
|---|---|---|
| Real tool calls | **16** | 21 |
| Real turns | 17 | 22 |
| Duration | 132.6s | 190.6s |
| Cost | $0.1189 | $0.0686 |
| Cache hit ratio | 64,014 / 73,195 (87.4%) | 84,401 / 89,475 (94.3%) |
| Thinking tokens | **8,287** | 3,252 |
| Fabrication | 0 (284 real fact_ids seen) | 0 |
| `[NEEDS CLARIFICATION]` markers | 0 | 0 |

Unlike pair 1 (vague cost more, used more calls, and correctly flagged a real gap), this pair inverted: **the vague version used fewer real tool calls and less wall-clock time, but cost more** — driven by more than double the thinking-token spend (8,287 vs 3,252) and a lower cache-hit ratio (87.4% vs 94.3%). Real, plausible interpretation, not yet confirmed beyond this one run: the model reasoned harder per turn to compensate for missing context, rather than searching more — a genuinely different real coping strategy than pair 1's "search more" pattern.

## The real, more serious problem: a confident, unflagged, likely-wrong technical claim

Checked directly against the real debug log: **the vague "2" run never once searched for anything related to scheduling** — no "schedule," "task," or "cron" query anywhere in its 16 real calls (full query list: `PGO Resident flow`, `resident departure`, `deleteResident`, `resident access`, `OSKAccessRightWithTimestamp`, `PGO`, `PMP`, `Portals Organization Resident`, `_deleteResidentFromOrganization`, `deleteAppUserResident`, `_deleteOnboardingInhabitant`, `organization_resident_document.model.ts`, `departure`, `deleteResident notification`, `OSKAccessMessagePublisherService`).

Instead, its Technical Proposal confidently states:

> **Automated Access Removal Engine:** Implement a scheduled Firebase Cloud Function (cron job) that runs periodically to query for resident documents where `departureDateTime` is less than or equal to the current timestamp, and triggers the existing deletion and cleanup flow.

— citing only `OSKOrganizationResidentsService.deleteResident` as evidence, which supports the *cleanup flow* claim, not the *scheduling mechanism* claim. Checked directly: the precise "2a" run (same day, same skill) found and correctly cited the real, existing mechanism instead — `OSKTaskSchedulerService.scheduleTask`, `.cancelTask`, `.tasksClient.createTask`, etc., a real, already-built scheduled-task facility. **The vague run's proposed "cron job" is a plausible-sounding but likely incorrect design** — a developer following it could build a redundant, parallel scheduling mechanism instead of using the one that already exists.

**Why this passed cleanly**: both mandatory validators (`checkFabrication`, `checkTemplateConformance`) only check that every *cited* `fact_id` is real — they say nothing about whether a claim's *substance* is actually supported by the evidence cited for it. `deleteResident` is a real fact_id, genuinely returned by a real tool call, so fabrication-checking passes. The gap is semantic (claim vs. evidence mismatch), not syntactic (invented fact_id) — a category of error none of today's fixes (citation-fabrication rules, `[NEEDS CLARIFICATION]` marker, bounded search) were built to catch, because none of them check "does this specific claim's evidence actually support what the claim says."

**Real, traceable cause, not mysterious**: the precise "2a" prompt explicitly states *"Within the Oskey landscape, there is already a schedule tasks facility"* — the vague "2" draft never mentions this at all. The vague prompt didn't just lose precision, it lost a specific, load-bearing fact the model needed to know to search in the right place. This is a different, more concrete failure mechanism than pair 1's (which was about an ambiguity the vague prompt left open, not a fact it silently dropped).

## Real, honest limits

- n=1 for this pair, same as pair 1 — real non-determinism not yet separated from a genuine precision effect.
- The cost/token findings (higher thinking-token spend, lower cache ratio) are numerically real but their causal story ("reasoned harder to compensate") is interpretation, not confirmed.
- Whether this specific claim-evidence mismatch pattern is common or rare across other cases is unknown from one run.

## Real, not-yet-decided implication

This is a strong, real argument for a *third* kind of check beyond fabrication-checking and honest-gap marking: whether a claim's cited evidence actually substantiates what the claim asserts, not just whether the cited `fact_id`s are real. Not designed or built — flagging it as a real, concrete finding this pilot exists to surface, per the original plan (`38-...md`/discussion before this pilot: "wider or vaguer prompts that might trigger the problems we have faced").

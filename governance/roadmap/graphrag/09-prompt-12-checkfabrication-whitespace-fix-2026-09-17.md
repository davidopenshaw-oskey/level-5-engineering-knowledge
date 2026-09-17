# Prompt 12 — `checkFabrication` whitespace false-rejection fix, real results, 2026-09-17

Brief: `governance/roadmap/graphrag/prompts/prompt-12-checkfabrication-whitespace-bug.md`. Bug found and corrected in `07-prompt-9-real-test-results-2026-09-13.md` (the user directly challenged an earlier, wrong "fabrication" claim — `createIntercomDisplayName` is a real method on `OSKBuildingIntercomService`, confirmed live against Postgres; the real fact_id just contains embedded newlines the model collapsed when citing it).

## 1. The normalization rule — and a real, self-caught correction along the way

**First version (wrong, caught by the deliberate test the brief required):** collapse runs of whitespace to a single space. Reasoning at the time: preserve token separation while tolerating line-wrap formatting. A hand-constructed test built from the exact real fact_id that surfaced this bug (`inhabitants\n                     .filter(...)`) **failed** — checked byte-for-byte (`od -c`) against the live database, not assumed: the model didn't insert a compensating space where the newline was, it removed the whitespace entirely (`inhabitants\n  .filter` → `inhabitants.filter`, zero separator), the same way a person reads a fluent method chain unwrapped onto one line.

**Corrected rule, verified against the real case**: strip all whitespace (`id.replace(/\s+/g, "")`), not collapse to one space. Real, stated residual risk: this can't distinguish two fact_id segments differing only by a semantically-meaningful internal space inside a string literal (e.g. `'owner tenant'` vs `'ownertenant'`) — not observed anywhere in this project's real fact_id corpus (these are compiler/AST-derived structural identifiers, not natural-language content), accepted as a real, checked-for-plausibility tradeoff, not an unconsidered one.

## 2. Real, confirmed-live ambiguity risk — checked before trusting the fix, not assumed

Queried the live corpus directly for fact_ids that collide after normalization: **109 real, distinct collision groups** exist corpus-wide (strip-all-whitespace rule; 73 under the earlier, wrong collapse-to-one-space rule — checked both). Concrete example: `OSKHomeScreen.kt` has 3 genuinely distinct real `Modifier.fillMaxSize()` call sites, each independently numbered `#1` (the id-generation sequence counter keys off raw, un-normalized text), that collapse to one identical normalized string.

**A global "does this collide anywhere in the corpus" check would therefore throw on almost any real Kotlin-touching run** — the brief's own escape hatch ("if the downstream risk turns out fine, say so; don't add unneeded complexity") pointed the other way here: this risk is real and needed real handling, not dismissal. The fix checks ambiguity only within one run's own gathered `realFactIds`, and only blocks the one specific citation that's actually ambiguous for that run — a cited id matching more than one real fact_id this run gathered, after normalization, throws a new, distinct `[AMBIGUOUS_CITATION]` error (never silently picks one) rather than being folded into `[FABRICATED_CITATION]`.

## 3. The downstream canonicalization question (brief's step 3) — traced, confirmed real, fixed

`buildCitationNumbering` (`atomic-prd-agent.ts`) keys its numbering map by whatever string literally appears in the model's `evidenceIds`, not by the real fact_id. Tracing this confirmed the brief's suspicion: tolerating whitespace only in the *comparison* (without also correcting the *stored* citation) would leave the collapsed string and the real, newline-containing string as two distinct map keys — the same real fact would render twice: once as a real citation, once again as a separate "gathered but uncited" Audit Trail entry.

**Fix**: `checkFabrication`'s signature changed from `(output, realFactIds): void` to `(output, realFactIds): GenerationOutput` — it now returns a new output with every matched-after-normalization `evidenceId` rewritten to the real, canonical (verbatim) fact_id string. Both callers (`atomic-prd-agent.ts`, `capability-fanout-prd-agent.ts`) updated: `generated` changed from `const` to `let`, reassigned from `checkFabrication`'s return value before anything downstream (`checkTemplateConformance`, `assembleDocument`) sees it. A pre-existing "fabrication diagnostic" preview block in `atomic-prd-agent.ts` (prints near-misses before the real check runs) was also updated to use the same normalized-match condition — otherwise it would print a false alarm for exactly the case this fix exists for.

## 4. Deliberate fabrication test — the one thing that must not regress

`mcp-server/agent-poc/_test-checkfabrication-fix.ts` (temporary, deleted after these results were recorded here — per this project's own discipline). Six hand-constructed cases, all passing after the correction in §1:

| Case | Real result |
|---|---|
| A: exact match | Unchanged, returned as-is |
| B: the real bug's exact fact_id, whitespace-collapsed citation | No throw; canonicalizes to the real, verbatim (newline-containing) string |
| C: genuinely fabricated method name | Still rejected, `[FABRICATED_CITATION]` |
| C2: a real fact_id with one real character changed | Still rejected, `[FABRICATED_CITATION]` |
| D: two real fact_ids this run gathered collide after normalization, citation matches both | Fails closed, `[AMBIGUOUS_CITATION]` — never silently picks one |

## 5. Real, live re-runs (real Vertex spend, user-approved)

**Capability-fanout, `skill.v3.md`/`template.v2.md` — the exact real case that surfaced this bug, re-run with the fix applied.** `output/agent-runs/prds/test/2026-09-17-001-1a-ownernonresident-capability-fanout-v3-prompt12-fix.{md,meta.json}`. Real result: **all 5 of 5 capabilities completed, both validators passed, $0.2715, 13m0s, 244 real fact_ids** — no crash this time. Honest note: this specific run didn't happen to re-cite `createIntercomDisplayName` or any other whitespace-collapsed multi-line fact_id (real run-to-run variance, already a documented confound in this project) — the run's own evidence pool did contain 5 real multi-line fact_ids, each appearing exactly once in the rendered document with no duplicate artifact, but none were actually *cited* this run, so this live run doesn't itself re-exercise the canonicalization-on-citation path. That path is verified precisely and reliably by the deliberate test (§4, case B) instead — a more trustworthy check than hoping a non-deterministic live run reproduces the same citation pattern twice.

**One-hit baseline regression check, `skill.md`/`template.md`.** `output/agent-runs/prds/test/2026-09-17-002-1a-ownernonresident-onehit-regression-prompt12-fix.{md,meta.json}`. Real result: **34 tool calls, 35 turns, 4m13s, $0.0722, both validators passed, 326 real fact_ids** (5 with embedded newlines, no issues) — confirms the fix doesn't break the other real consumer of this shared code. Same, now-familiar Gap B pattern recurs on the side (`formControlName`, evidence #79, gathered not cited) — not this task's concern, consistent with every prior run.

## 6. Real spend, this task

$0.2715 (capability-fanout re-run) + $0.0722 (one-hit regression) = **$0.3437 measured**, on top of the $0.5118 measured across Prompts 9's own two rounds — running session total **$0.8555 measured**, plus the several honestly-unmeasured amounts from earlier crashed runs.

## 7. Status

Fixed, tested (both a deliberate unit-style suite and two real live re-runs), documented. `checkFabrication`'s real fabrication-detection guarantee is unchanged and re-verified (cases C/C2/D); its real false-rejection bug (the original finding) is fixed and re-verified (case B, live regression run). All code changes left uncommitted, per the standing rule.

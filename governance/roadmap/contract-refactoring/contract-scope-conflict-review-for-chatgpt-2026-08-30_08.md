# Update: V1-B Implemented and Verified

**Status:** V1-B (module-reduce contract, `01-module-synthesis-reduce.md`) is now implemented and tested, closing out the second of the two independently-scoped fixes from this review thread. Both V1-A and V1-B are now done; only the shared A/B/AB experiment (tasks 17m-17o) remains before this thread's findings can be measured end to end.

---

## What changed

**Contract (`01-module-synthesis-reduce.md`), fully self-contained now.** The "read `module-engineering-profile-task-instructions.md` in full" dependency is gone — that document was written for an earlier single-shot workflow and its per-section instructions assumed the reader owned the whole section, which this step doesn't. The genuinely shared, non-conflicting principles (evidence priority, confidence tagging, never invent, terminology preservation, RBAC cross-check, "don't treat the module in isolation") are copied in directly. Added an explicit governing principle — "never repeat analysis assigned to an earlier synthesis stage" — and redefined what counts as an Open Question at this step specifically: a capability-local question that its own Section 9 already could and should have raised is not this step's job to re-raise; Section 13 is only for a finding visible by *comparing* two or more capabilities.

**Sections 9 and 13's wiring gaps, closed.** Both were confirmed real in the earlier review: deterministic data (`rbacRequirements`, `unresolvedCallEdges`) already existed in `04-build-resolved-graph.ts` and was already consumed one stage over (`02-generate-repo-report.ts`), but never reached the module-reduce call at all. Two new filter functions (`filterRbacRequirementsForModule`, `filterUnresolvedCallEdgesForModule`, in new/extended `_shared` modules) filter each repo-wide artifact down to one module and wire it into `01c-generate-assembly-first-profile.ts`'s reduce prompt as an explicit new input. This required two small additive fields upstream in `04-build-resolved-graph.ts` (`submodule` wasn't being recorded on either artifact's per-check/per-edge entries, which would have made module-filtering unable to attribute anything to a specific capability — the entire point of the fix). Section 9's contract text no longer instructs "build a mental enforcement tally"; it now says to reason from the supplied table directly, retaining only the "is this asymmetry architecturally significant" judgment.

**Section 6, tightened, not made deterministic** — as scoped, since the underlying ownership-hint signal is confirmed genuinely partial (call-graph centrality, not a Firestore ownership determination). Contract now states explicitly what the supplied signals do and don't establish, and narrows the model's job to only the judgment that can't be derived from them deterministically.

## Verification (not just "it ran")

`tsc --noEmit -p .` clean; diff isolated to the intended files. Ran the reduce step for real, end to end, against the `organization` module (14 capabilities, including `organization_intercom_communication` — the cross-vendor workflow example from earlier in this thread) in comparison mode against `gemini-default`, isolated from the canonical baseline. Confirmed the new inputs are actually being used, not just present in the prompt unused:

- **Section 9** surfaced a specific, real over-privilege finding: `v1.org.buildings.create` ("Allows to create a new building" per the RBAC roles doc) is the permission gating resident-invitation and onboarding-card workflows in two unrelated capabilities — a genuinely more specific and more useful finding than the generic "some checks lack RBAC backing" pattern seen before.
- **Section 13** named two real unresolved call edges by name and exact file:line (`processChannel` in `organization_intercom_communication.service.ts:1372-1373`; `generateAlphanumericCode`/`generateNumericCode` in `organization_onboarding_inhabitant.service.ts`) — data that previously never reached this call at all.
- Citation validation: 0 file-not-found across both output documents for this run.

## Next

Both fixes now stand on their own merits, independent of the variance question, per the framing from your last message. What remains is tasks 17m-17o: select a representative module subset, get explicit provider/spend confirmation (this is real LLM call volume, larger than anything run so far in this thread), and run the four-arm factorial to actually measure whether either fix moves the variance needle — with the contingency already on record that a null result there wouldn't undermine either fix, just point back toward the original, still-open "ordinary LLM sampling variance" hypothesis.

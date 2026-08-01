# tasks 7& todos

1. remove hard coded paths, even from the repo in the ast extraction
2. remove all of the hardcoded references, make it 100% dynamic
3. ensure all paths are relative for agentic running
4. governance/reference-docs (schemas, indexes, firestore rules, rbac roles) are currently manual snapshots — make these dynamically re-derived from the target repo when read in on P1
5. in p2, the artefacts need to be added ito the repo for versioning. currently /output is .gitignore. we need to review this to avoid saving unnecessary items in git, but storing significant artefacts for governance. maybe the devs decide to put the artefacts and ast run info onto buckets somewhere
   - not yet confirmed: this pipeline might end up running on Google's Gemini Enterprise agentic platform during CI/CD production merge. if so, /output (ast extracts + p2 synthesis) would more likely land in a cloud storage bucket than in this git repo. decision deferred until that platform question is confirmed either way.
6. [DONE 2026-08-01] model_property extractor bug fixed — `01-extract-ast-evidence.ts` only walked `interface` declarations, silently skipping `type X = {...}` object-literal aliases (and intersections containing one), regardless of structural complexity. Patched to also walk type aliases (see `01-extract-ast-evidence.ts` "7b" block). Verified via full re-run: core model_property facts 24→179, building 156→428, confirmed against previously-zero types (`OSKDocumentId`, `OSKBuilding`, `OSKBuildingUnitInhabitant`, `OSKPhoneNumber`, etc).
7. LLM auth (Gemini via Vertex AI on `dev-oskey-io`, identity `username@oskey.io`; Claude via Anthropic API key) is currently set up per-person, manually, on one machine — not yet reproducible by a teammate or in CI/CD:
   - Each colleague who wants to run the pipeline needs: `gcloud` CLI installed, their own `@oskey.io` SSO login (`gcloud auth login` + `gcloud auth application-default login`), and their own `ANTHROPIC_API_KEY` set. None of this transfers via git — only code/config does.
   - Critically, having an `@oskey.io` identity is not sufficient on its own — someone with admin rights on the `dev-oskey-io` GCP project must explicitly grant each person IAM access to call Vertex AI there, or they'll hit a permission-denied error even after logging in correctly.
   - The personal-SSO-login auth model (`gcloud auth application-default login`) only works for a human at a terminal. It will not work unmodified in unattended CI/CD (e.g. a GitHub Action can't complete an interactive browser SSO flow) — that will need a service account or Workload Identity Federation instead. Deliberately using ADC now (rather than a plain `gcloud auth print-access-token` shortcut) so the same code path keeps working when the credential source underneath it swaps later — same seam as item 5's /output-to-bucket question, and likely resolved together once the Gemini Enterprise CI/CD question is confirmed.

---

## CHECKPOINT — pick up here (2026-08-01)

We drifted off the original HANDOVER.md next-steps list to go fix P2's LLM infrastructure, which turned out to be broken/never-actually-run rather than just needing a run. That work was legitimate (module #2 genuinely can't happen without it) but it fully displaced HANDOVER items 2 and 3 for this whole stretch rather than just delaying them. Naming it here so it's not silently lost.

**HANDOVER.md's original 5-item next-steps list — status:**
1. Investigate `OSKDocument`, check `model_property` gap — **DONE**, and went further: found and fixed the actual extractor bug (item 6 above).
2. Decide + build the Data & Type Model Reference artifact — **HALF-DONE**. Decided: per-module artifact, deterministic (not LLM-guessed) classification into persistence/API/internal-only buckets. The blocker for building it (api_contract facts had no request/response type data) is now cleared — that got fixed as part of the P1 work. **The classification script itself has not been started.**
3. Patch `building-engineering-profile.md` §5 for the `@oskey/building/door` intra-module coupling finding — **NOT STARTED.**
4. Move to module #2 — **NOT STARTED**, was deliberately blocked on 2 and 3.
5. Resolve the P1 field-walker (`model_property`) bug — **DONE**, fixed and verified.

**Side-quest completed (not in original HANDOVER, but real, necessary infrastructure work — see item 7 above for the auth-portability caveats it carries):**
- Vertex AI/Gemini and Anthropic Claude are both now fully authenticated and verified working end-to-end through the real `callLlm()` adapter (not just curl tests).
- `00-generate-module-profile.ts`'s grounding-doc path config bug is fixed (was pointing at a path that never existed).
- Just refactored to a split-call architecture (profile and API reference as two separate LLM calls instead of one combined call) to reduce output-truncation risk. **Type-checked clean, but NOT YET live-tested against a real module's full evidence graph** — only tiny smoke-test calls ("reply with OK") have actually been run through it so far.

**First thing to decide on return, before anything else:** does the now-working automated script (`00-generate-module-profile.ts`) replace the manual chat-based workflow for regenerating `building`'s profile (which would likely resolve item 3 as a side effect of regenerating), or does the manual chat-based approach (explicitly preferred earlier in this same session, for faster instruction-iteration) still stand? This was never re-decided after the infrastructure got fixed.

**Recommended concrete next actions, in order:**
1. Decide the automated-script-vs-manual-chat question above.
2. If automated: do a real live test of the split-call generator against `building`'s current evidence graph (run `20260801_125502-1aa319b1`) before trusting it for a brand-new module.
3. Execute HANDOVER items 2 (build the deterministic type-classification script) and 3 (door-coupling patch), in whichever order makes sense once (1) is decided.
4. Only then move to module #2 (item 4).

**Also raised but explicitly deferred (not urgent, revisit after the above):** per-module dynamic output-token budgeting (vs. one global `maxTokens`), persisting real token-usage telemetry from `LlmCallResult.usage` to make data-driven budget decisions, and the repo-level/cross-repo input-size-growth question (steps 3–5 of the fuller AST→module→repo→cross-repo pipeline) as module/repo count grows.

---

## CHECKPOINT UPDATE (2026-08-01, later same day)

**HANDOVER item 2 (Data & Type Model Reference) — now CLOSED, not just half-done.** Reframed after re-reading `rules/00-global-synthesis-hierarchy.md` Directive 3 (the Five-Layer Impact Analysis Standard) — "Type & Schema Layer" is explicitly Phase 4/5 territory, not Phase 2. The valuable output of this thread was never really "a Phase 2 narrative document"; it was the foundational fact-layer fixes (`model_property`, `api_contract` request/response types) that Phase 4/5 impact analysis will actually consume. Building a speculative Phase 2 document now would mean guessing at input shapes Phase 4/5 hasn't been designed yet to need. Decision: don't build it now — revisit only once Phase 4/5 actually exists.

**Items 3 (door-coupling patch) and 4 (module #2) — still NOT STARTED.** Raised explicitly as a fork ("deal with them today, or leave for next time") but the conversation moved on to a P1 gap-analysis discussion before either was decided — genuinely still open, not deferred by an actual decision.

**Further P1 extractor work completed, unrelated to items 2–4 but directly motivated by "have we captured enough for downstream impact analysis" (same Directive-3 reasoning as the item-2 closure above).** Investigated the real Pub/Sub architecture end-to-end (publisher chain through `core/controllers/message.controller.ts`, receiver via `core/services/pub_sub_receiver.service.ts`'s `processPubSubMessage`) and fixed four more extractor gaps, all verified via full pipeline re-run (final run: `20260801_152851-1aa319b1`):
1. **Publisher-side topic detection**, two strategies: a structural `<expr>.topic(x).publish/publishMessage(y)` chain detector (generic, matches the real SDK's own fluent shape) tried first, falling back to a known-wrapper-method-name check (`PUBSUB_PUBLISH_METHODS` — specific to this codebase's own convention, self-tagged via a `detectionMethod` field so that limitation is visible in the data itself). `externalHooks` went from 0 → 14 across the whole benchmark.
2. **Receiver-side classification**: a `pubsubPushReceiver: true` flag on `api_contract` facts, detected structurally via the standard GCP Pub/Sub push envelope shape (`.message.data`), not by any handler name.
3. **New fact type `pubsub_event_route`**: a full Event Routing Table extracted from any switch statement inside a flagged Pub/Sub receiver (case value + every call target). This surfaced a genuine second-level nested routing structure (by `enrichedData.user.userType`) that hadn't been noticed reading the source by hand earlier in the session.
4. **Two bonus fixes found as side effects**: (a) handler-body resolution now handles class-property-assigned arrow functions (`PropertyDeclaration` initializers), closing the one remaining `core` `api_contract` fact that had null request/response types; (b) `resolveExpressionValue` now resolves enum-member-access expressions (`EnumName.MEMBER`) generically, closing the 3 previously-unresolved nested routes from fix 3.

All four were explicitly checked for hardcoding risk — confirmed no domain values (topic name strings, specific enum names/members, collection names) are hardcoded anywhere in any of the fixes; only two narrow, self-documenting convention assumptions remain (the wrapper-method-name fallback in fix 1, tagged in the data), both flagged rather than silently assumed.

**Still true, unchanged from the earlier checkpoint:** the split-call profile generator has still not been live-tested against a real module's full evidence graph — only tiny smoke-test calls have gone through it. That, plus items 3 and 4, remain the actual next actions.

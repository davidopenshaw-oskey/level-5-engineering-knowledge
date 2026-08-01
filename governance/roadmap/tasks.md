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

**Noted, still open:** `00-generate-module-profile.ts`'s `DEFAULT_MODULE_PROFILE_CONFIG` still hardcodes stale contract/grounding-doc paths (`ai-runtime/contracts`, `module-engineering-profile/work-order.md`, etc.) directly in the script — the same class of problem already fixed for the *active* path via `config/repos.json`'s `phase2.moduleProfile` override, but the fallback default itself was never moved to config. Only matters for a repo with no override configured; `firebase-oskey-dev` already has one, so this hasn't bitten yet, but it should still move to config for consistency and to stop the stale defaults from being a trap for the next repo added.

---

## CHECKPOINT UPDATE 2 (2026-08-01, still later)

**Metadata + output-path fixes landed, verified clean, nothing generated yet:**
- `00-generate-module-profile.ts` now records `llmConfigKey`/`llmProvider`/`llmModel` in the shared prompt metadata (self-describing provenance, deliberately kept out of the file path — see the corpus-location decision below).
- Output path moved from `output/docs/runs/{runId}/...` (fully gitignored, no git-visible home) to a new always-tracked `knowledge-corpus/<repo>/<runId>/...` at repo root — deliberately model-agnostic path (no provider/model folder), provisional pending a real DevOps/engineering decision on long-term artefact storage (same open question as item 5 above).
- `module-engineering-profile-task-instructions.md` and its template got 5 more fixes based on a deliberate pre-flight review against everything found this session: template was missing the new metadata fields (self-inflicted, now fixed); §7/API-Reference §1 now explain that `requestType`/`responseType` are bare type names requiring a `model_property` cross-reference to build an actual schema (a gap `requestType`/`responseType` create now, since it didn't exist before today); §11 now has explicit Pub/Sub guidance distinguishing publish-call confidence tiers from receiver routing tables; §5/§10 now warn about the `@oskey/<module>/<submodule>` intra-module coupling pattern (the still-open item-3 finding) so it doesn't get missed the same way twice; Output Format section's two-documents-per-call vs one-per-call contradiction resolved with an explicit precedence note.

**First live-test attempt against `building` — surfaced a major, previously-unknown architectural blocker, not a bug in anything built today:**
1. `gemini-3.6-flash` (the model actually configured) returned HTTP 404 on Vertex AI in `dev-oskey-io`/`europe-west1` — "not found or your project does not have access to it." The error's own doc link pointed at `gemini-enterprise-agent-platform`, not classic Vertex AI, suggesting this model may need a different product surface or explicit enablement. Not investigated further — fell back to `gemini-2.5-pro` (already confirmed working earlier today) to keep testing the actual pipeline.
2. Re-ran with `gemini-2.5-pro` — failed differently: **HTTP 400, input token count 1,376,733 exceeds the 1,048,576 max.** Measured precisely where that comes from:
   - Contract docs (instructions + template): ~14.6 KB (~3,700 tokens) — trivial.
   - All 7 grounding docs combined: ~408 KB (~102,000 tokens) — meaningful but not dominant.
   - **`building-evidence-graph.json` alone: ~4.19 MB (~1,047,000 tokens)** — almost exactly Gemini's *entire* context window, by itself, before anything else is added.
   - Likely contributor: nearly every fact in the evidence graph is stored twice — flattened at the top level and duplicated again inside a nested `evidence: {...item}` blob (visible throughout `02-build-module-evidence.ts`). Fine for a general JSON consumer; pure waste for a "paste the whole file into a prompt" use case.

This is the exact shape of problem raised earlier in an "architecturally, we'll need to loop through creating..." discussion (module → repo → cross-repo context growth) — except it appeared immediately, at the single-module level, on the first real busy module tested, not several pipeline levels up as expected. `building` isn't even the busiest module in this repo, so this will only get worse, not better, on its own.

**Mitigation options raised for next session (not decided, not implemented — deliberately left as options to think over, not a plan):**
1. De-duplicate the flattened+nested evidence redundancy for the LLM-prompt path specifically (quick, safe, roughly halves payload — not sufficient alone: ~1.37M/2 ≈ 685K is still enormous for a busy module).
2. Feed the already-resolved `confirmedCallEdges`/`probableCallEdges` from `resolved-engineering-graph.json` instead of raw `call_expression` facts (building has ~1,000+ raw call facts, most already classified `non_graph_call` — i.e. noise — by `04-build-resolved-graph.ts`'s own logic; reuse that filtering instead of re-sending everything).
3. Pre-aggregate high-volume fact types (e.g. building's 428 raw `model_property` facts) into compact type→fields tables before they reach the prompt, rather than sending one fact per field with AST location metadata the LLM doesn't need narratively.
4. Map-reduce within a module: split the single call per document into multiple smaller calls, each fed only the fact-category slice relevant to the section(s) it's drafting, then a reduce call to stitch the narrative together. Same shape as the module→repo→cross-repo fan-in already discussed, one level down.
5. Route by evidence-graph size to whichever provider has more context room (workaround, not a fix — doesn't address the underlying waste, will still fail at the next scale-up).
6. Longer-term: let the LLM query facts on demand via tool calls rather than receiving the whole graph inline (biggest lift, but the only option here that doesn't reappear as a problem again at repo-level or cross-repo synthesis). This is the RAG (retrieval-augmented generation) pattern by its standard industry name.
7. **Stop using JSON as the prompt format for high-volume, uniform-schema fact arrays.** JSON pays token cost for every key name on every record — 428 `model_property` facts each repeating `"parentName":`/`"propertyName":`/etc. is exactly the shape that wastes the most tokens in JSON specifically. Converting those arrays to CSV/TSV or a Markdown table (column names stated once, then just values per row) before they reach the prompt is a distinct, real technique on top of 1–3, not a restatement of them — keep JSON as the canonical *storage* format (other tooling depends on it), add a conversion step between storage and prompt-assembly.

Loose recommendation floated (not agreed): try 1+2+3+7 together first, next session, before reaching for 4 or 6.

**UPDATE — measured 1+7 directly against the real `building` graph (2,498 facts), not estimated:**

| Fact type | Count | JSON | CSV (evidence dup dropped) |
|---|---|---|---|
| `call_expression` | 1,003 | 2,200 KB | 779 KB |
| `model_property` | 428 | 379 KB | 167 KB |
| `imports_dependency` | 387 | 330 KB | 141 KB |
| *(14 more types)* | | | |
| **Total** | **2,498** | **3.43 MB** | **1.34 MB (2.55x smaller)** |

`call_expression` alone is ~64% of the whole graph's JSON size (2.2MB of 3.43MB) — makes option 2 (feed resolved call edges instead of raw call facts) look like the single highest-leverage individual fix, bigger than expected before measuring.

Converting per-type to CSV (header row once, then just values — dropping the duplicated nested `evidence` blob in the same pass) takes the whole graph to ~352,000 tokens. Combined with grounding docs (~102,000) and contract docs (~4,000): **~458,000 tokens total — comfortably under Gemini's 1,048,576 ceiling, with room to spare.** This suggests options **1+7 together might already be *sufficient* on their own** for a module the size of `building`, without needing 2/3/4/6 at all — upgrade from "try these first" to "try these first and possibly stop there, re-measure before reaching for anything bigger."

One more near-free thing to check next session: the real stored file is 4.19MB but a compact (non-pretty-printed) re-serialization of just its facts came to 3.43MB — the gap is likely indentation whitespace, which costs real tokens if the raw file is pasted verbatim into a prompt but costs nothing if stripped at prompt-assembly time. Worth confirming and taking for free alongside whatever else gets built.

**Net result: `building` has still not been successfully generated end-to-end.** Both HANDOVER items 3 and 4 remain blocked on this context-size finding as much as on the earlier open decisions — but the fix now looks smaller/cheaper than it did before measuring.

---

## NEW WORKFLOW CONVENTION (2026-08-01)

Going forward: when we surface and design something non-trivial (like the capability-partitioning idea below), it gets its own numbered implementation plan file under `governance/roadmap/` (`NN-name.md`), with a concrete, checkable task list, worked through one item at a time — explicitly so a mid-work distraction (like the HANDOVER drift earlier this session) leaves a resumable list behind instead of relying on conversation memory. This file (`tasks.md`) stays the general index/checkpoint; numbered plan files hold the detailed task lists for specific pieces of work.

**First one created: [`00-capability-based-module-synthesis.md`](00-capability-based-module-synthesis.md)** — covers both the `submodule`-dropping bug in `02-build-module-evidence.ts` (small, standalone fix) and the bigger capability-partitioning Phase 2 redesign it enables (evidence graph → per-submodule capability packs → per-capability synthesis → module-level reduce, instead of one shot over the raw graph). Real numbers already gathered: `building` splits into 11 packs, largest 450 facts/710KB — comfortably within context even before CSV re-encoding. This is the current active piece of work; see that file for status, not this one.


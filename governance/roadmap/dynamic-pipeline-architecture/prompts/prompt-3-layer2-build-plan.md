# Prompt 3 — Layer 2: build plan for the real Swift/Kotlin/Android integration-call fact kinds

**Standing rule: never run `git add`/`git commit`, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: plan only. Do not write extraction code yet. Produce a single, concrete plan document.

Same session that produced `03-prompt-2-layer2-findings-2026-09-18.md` — continuing deliberately, not handed to a fresh session, because the real value in that investigation (the exact AST node shapes, the specific existing-helper gaps, the match-key subtleties) is genuinely costly to reconstruct from prose alone. Treat your own findings doc as ground truth; don't re-derive anything already established there.

## Real scope — four integration patterns found, one explicitly deferred

From `03-...md`'s summary table and addenda:

1. **iOS/Swift** (`ios-oskey-dev` → `swift-cloud-kit-oskey-dev`) — `firebase_callable_call` (36 real call sites, match key `rootIdentifier === "OSKCKFunctionService"`) and `firestore_document_access`/`firestore_collection_access` (enum-case walk, 32 cases).
2. **`android-oskey-io`** (end-user app, → `firebase-oskey-dev`) — same conceptual kinds as iOS, but a genuinely different AST shape (enum-case property access needing 2-hop resolution, not a literal at the call site).
3. **`android-intercom-oskey-io`** (edge device, → `node-iot-api-oskey-io`) — `rest_endpoint_call` (5 real endpoints, Retrofit annotation walk), needs `findEnclosingClassName` extended to walk `interface_declaration`.
4. **`realtime_signaling_channel`** (Socket.IO, present in all three client repos) — **explicitly out of scope for this plan**, per the user's own deliberate sequencing decision recorded in `03-...md`'s addendum. Do not include it in this build plan; the investigation doc already preserves everything needed to pick it up later.

## What the plan needs to cover

1. **Sequencing/priority across the 3 in-scope patterns** — which to build first. Consider starting with the smallest, cheapest, most-isolated real surface (`rest_endpoint_call`, 5 real endpoints, one file) as a real pilot before the larger Swift/Kotlin Firebase patterns — your call, but state your reasoning.
2. **`android-oskey-io`'s onboarding question, addressed explicitly** — it's not in `config/repos.json` yet. Decide and state: does extraction code get built/tested against the existing one-off clone first (with real onboarding — branch/commit pin, module discovery, `astTool` config — treated as a separate, later step), or does onboarding need to happen before any of this pattern's extraction logic can be considered done? Don't leave this ambiguous.
3. **Per fact kind, concrete**: exact extractor file(s) to modify, exact new/extended helper functions needed (e.g. `findEnclosingClassName`'s `interface_declaration` gap, wiring `annotationNamesIn`/`isAnnotatedWith`'s argument extraction), the exact match key/resolution logic from `03-...md`, and the real fields each fact needs.
4. **What Layer 1 needs from this plan** — `build-cross-repo-edges.ts`'s generalization (a separate, currently-waiting session) needs to know the real new fact-kind names and which repos will have them once this work lands. Make this explicit and easy to lift out, so that session doesn't have to re-read this whole plan to find it.
5. **Testing/verification approach** — how you'd confirm each new fact kind is real and correct before considering it done (a real before/after check against the live corpus, similar discipline to `01-...md`'s live-data verification).
6. **Real spend, if any** — P1 AST extraction is deterministic/zero-LLM per this project's own architecture (confirmed in `governance/roadmap/consolidation/typescript.md`); state plainly whether anything in this plan needs LLM calls (e.g. a description-enrichment pass, per that same doc's precedent for other fact kinds) and flag any real cost before it would be incurred, per this project's standing rule. If nothing here needs LLM spend, say so directly rather than leaving it unaddressed.

## Output

Write to `governance/roadmap/dynamic-pipeline-architecture/04-prompt-3-layer2-build-plan-<date>.md`. This is a plan for a human and a future build pass (which may well be this same session, continuing further) to execute from — be concrete and decisive on judgment calls within your own reasonable authority; flag only what genuinely needs the user's own call.

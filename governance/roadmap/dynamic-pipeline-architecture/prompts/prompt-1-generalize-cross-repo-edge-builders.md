# Prompt 1 — Layer 1: make the cross-repo edge builders repo-agnostic

> **Superseded 2026-09-21, see [prompt-4-cross-repo-edges-build.md](prompt-4-cross-repo-edges-build.md)
> and doc 38's "AUTHORITATIVE BUILD SPEC".** This prompt was never run (no `02-…` findings doc
> exists; the script is unchanged). Its `build-cross-repo-edges.ts` generalization is now Stage 0
> plus Stages A and C of prompt 4. Its `build-form-field-lineage-edges.ts` (`FIELD_BINDING`)
> half is **not** covered by prompt 4 and remains open. Original text below, unchanged.

**Standing rule: never run `git add`/`git commit`, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: real build. This is a same-day, scoped refactor, not an open-ended investigation.

**Real prerequisite, added after a correction — check before you start**: this was originally scoped as fully independent of `prompt-2-swift-kotlin-integration-call-extraction.md`. That was wrong. Your fix can only be verified against the existing Angular/Firebase data — with nothing else to generalize against, "generic" code here can look right without ever being proven right. Check whether `prompt-2`'s session has produced its findings doc (`governance/roadmap/dynamic-pipeline-architecture/03-prompt-2-layer2-findings-<date>.md`) yet. If it hasn't, coordinate with the user before writing your generic discovery logic — you don't need Layer 2's extraction code built and populating Postgres, just its proposed fact-kind shape known, so you have a real second target to design against instead of guessing at one.

## Context — read first

`governance/roadmap/dynamic-pipeline-architecture/01-findings-hardcoded-repo-names-and-missing-integration-kinds-2026-09-18.md` — the full finding. Summary: `pipeline/facts-postgres-index/build-cross-repo-edges.ts` and `build-form-field-lineage-edges.ts` hardcode specific repo names (`'angular-app-oskey-io'`, `'firebase-oskey-dev'`, `'node-iot-api-oskey-io'`) directly into SQL `WHERE` clauses and insert values — a real violation of this project's standing "always dynamic, never hardcoded" principle. `build-intra-repo-edges.ts` in the same directory already solves an equivalent problem correctly (takes `REPO_NAME` from an environment variable, runs once per repo, discovers what it needs from the data rather than assuming it) — use that as your real, working reference pattern, not a new design from scratch.

**Do not touch Layer 2** (Swift/Kotlin extraction never producing integration-call fact kinds) — that's a separate, parallel investigation in `prompt-2-...md`. This prompt is scoped to making the existing edge-building *logic* agnostic to which repos exist, not creating new fact kinds or new edges for repos that don't have the raw material yet. Your fix should make the code correct and ready for the day iOS/Android *do* have the right fact kinds — it will not, by itself, produce any new real iOS/Android edges today, and that's expected, not a bug in your work.

## What "agnostic" means here, concretely

Today: `build-cross-repo-edges.ts` assumes exactly one publisher repo (`angular-app-oskey-io`) and one receiver repo (`firebase-oskey-dev`) for `HTTP_API_CALL` edges, matching Angular's `firebase_callable_call` facts against Firebase's `api_contract` facts. The fix: discover which repos actually have `kind = 'firebase_callable_call'`-shaped facts (the "caller" side) and which have `kind = 'api_contract'` facts (the "receiver" side) dynamically — e.g. `SELECT DISTINCT repo FROM facts WHERE kind = '...'` — and join across whatever real repos have them, not a hardcoded pair. Same idea for `PUBSUB_TOPIC_BINDING` (currently also hardcoded to specific repos for publisher/receiver sides) and for `build-form-field-lineage-edges.ts`'s `FIELD_BINDING` edges.

Real, honest caveat to carry into your own work: `build-form-field-lineage-edges.ts`'s matching logic depends on Angular-template-specific fact kinds (`angular_template_attribute`, `angular_template_composition`) that structurally don't exist for other UI frameworks (SwiftUI, Jetpack Compose) — full agnosticism here might mean "a registry of per-framework matchers producing the same generic `FIELD_BINDING` edge type," not literally one query that works unchanged for every framework. Use your own judgment on the right shape here; don't force a single query if the underlying fact shapes are genuinely framework-specific. Document your reasoning either way.

## What to actually do

1. Read `build-intra-repo-edges.ts` in full first — understand exactly how it already solved this problem for the intra-repo case.
2. Rewrite `build-cross-repo-edges.ts` and `build-form-field-lineage-edges.ts` to discover repos/kinds dynamically instead of hardcoding repo-name literals, applying the same discipline.
3. Re-run both builders against the live corpus and confirm the exact same edges get produced for the existing Angular/Firebase/Node-IoT data as before your change (a real before/after row-count and spot-check comparison — this refactor should be behavior-preserving for the repos that already work, not just "differently broken").
4. Confirm directly (don't assume) that no new spurious edges get created for iOS/Android/Swift repos as a side effect of the more general query — there should still be zero cross-repo edges touching those repos after your fix, precisely because Layer 2's fact kinds don't exist yet. If you see anything unexpected there, stop and report it rather than assuming it's fine.
5. Write a real findings/build doc to `governance/roadmap/dynamic-pipeline-architecture/02-prompt-1-layer1-findings-<date>.md` — what changed, the before/after comparison, and explicit confirmation of point 4.

Independently verify your own claims against live Postgres before writing them down, same discipline as `01-...md` used to establish this finding in the first place.

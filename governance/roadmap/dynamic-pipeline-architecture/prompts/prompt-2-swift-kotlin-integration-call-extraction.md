# Prompt 2 — Layer 2: investigate real Swift/Kotlin outbound integration-call patterns

**Standing rule: never run `git add`/`git commit`, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: investigation first, not a build. Do not write extraction code yet — this is genuinely unknown territory until you've read the real source.

**Start this one first.** A parallel session (`prompt-1-generalize-cross-repo-edge-builders.md`) is waiting on your findings — its own fix can't be genuinely verified as "repo-agnostic" without a real second fact-kind shape to design against, and yours is what would provide that. It doesn't need your extraction code built, just your proposed fact-kind shape once you have one.

## Context — read first

`governance/roadmap/dynamic-pipeline-architecture/01-findings-hardcoded-repo-names-and-missing-integration-kinds-2026-09-18.md` — the full finding. Summary: `ios-oskey-dev` and `android-intercom-oskey-io` have zero real fact_id anything resembling `firebase_callable_call` (Angular's kind for "this call site invokes a Firebase Callable Function", 102 real facts) or `api_contract`/`pubsub_event_route` (Firebase's kinds for receiving/publishing). Confirmed directly against live Postgres — this isn't a query bug, the raw fact was simply never extracted. `graphrag/15-1a-multirepo-first-run-findings-2026-09-17.md` is the real, live case this blocks (a business request naming the iOS app pulled zero iOS evidence, in part because of this).

**Do not touch `pipeline/facts-postgres-index/build-cross-repo-edges.ts` or `build-form-field-lineage-edges.ts`** — a separate, parallel session (`prompt-1-...md`) is fixing those independently. This prompt is scoped to the P1 extraction layer only (`pipeline/swift/`, `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/`).

## What you actually need to find out — real, unanswered questions

1. **Does the iOS app (`ios-oskey-dev` and/or its Swift-kit siblings) actually call the Cloud backend at all**, and if so, how, structurally? Real candidates to check for: Firebase's iOS SDK Callable Functions client (`Functions.functions().httpsCallable(...)`), a plain REST client (`URLSession`, Alamofire), gRPC, or something else entirely. Read real source directly — don't assume based on what Angular does.
2. **Same question for `android-intercom-oskey-io`** (Kotlin) — Firebase's Android SDK equivalent, Retrofit/OkHttp REST calls, or something else.
3. **If a real, structural pattern exists in either language**, what does it look like in the AST (SwiftSyntax for Swift, whatever this project's Kotlin extractor uses)? Is it a distinctive call shape (a specific function/method name, a specific type being invoked) reliable enough to pattern-match the way Angular's `firebase_callable_call` extraction already does? Find and read that Angular extraction code first (`pipeline/angular-app-oskey-io/phase-01-ast-extraction/`) as your working reference for what "good" looks like.
4. **If no such call pattern exists in the real source at all** (e.g. these apps genuinely don't call Cloud endpoints the same way, or do so through some indirection this project's extraction can't reasonably see) — that's a real, valid finding too. Say so plainly rather than forcing a fact kind to exist where the real behavior doesn't support it.

## Real, honest expectation-setting

This prompt does not ask you to ship a fix today. It asks you to come back with a real, evidence-based answer to "what would the fact kind(s) even need to look like, and is it feasible," so a future build session has something concrete to implement rather than a guess. If you get far enough that a clear, well-scoped extraction pattern falls out of the investigation and you're confident in it, propose (don't yet build) the specific new fact kind(s) and the AST pattern that would produce them.

## Output

Write real findings to `governance/roadmap/dynamic-pipeline-architecture/03-prompt-2-layer2-findings-<date>.md` — what you found in the real source for each language, whether a reliable extraction pattern exists, and (if so) a concrete proposal for the new fact kind(s) and matching logic, left for a future build session to implement. If you conclude no reliable pattern exists, say so directly and explain why, rather than forcing a weak match.

Independently verify anything you find against the real source files and, where relevant, live Postgres — same discipline `01-...md` used.

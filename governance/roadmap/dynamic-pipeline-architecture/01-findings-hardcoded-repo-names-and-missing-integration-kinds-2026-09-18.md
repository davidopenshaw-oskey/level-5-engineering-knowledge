# Real finding: the cross-repo edge layer is hardcoded to specific repo names, and Swift/Kotlin extraction never learned to tag integration calls at all

Found while investigating why the 2026-09-17 1a multi-repo fan-out test (`graphrag/15-1a-multirepo-first-run-findings-2026-09-17.md`) pulled zero iOS evidence. That doc already established `ios-oskey-dev` has zero `cross_repo_edges` corpus-wide. This doc answers *why*, and it's a real, two-layer architectural problem — not a routing bug, not something ADR-010 caused, and not fixable by touching only one layer.

Real, standing project principle this violates directly (`feedback_dynamic_recursive_never_hardcoded` memory): *"extraction code must walk real structure, never assume a fixed depth/shape/list; devs add things on the next merge."* The cross-repo edge-building layer does exactly what that rule forbids.

## Layer 1 — the edge-builder code is hardcoded to specific repo names, confirmed by direct read

Scanned every file in `pipeline/facts-postgres-index/` for hardcoded repo-name literals (`angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io`, `android-intercom-oskey-io`, `ios-oskey-dev`, and all 4 `swift-*` repos). Four files matched; only two are real logic violations:

- **`build-cross-repo-edges.ts`** — genuinely hardcoded. Every query and insert is written for exactly one repo pair: `WHERE repo = 'firebase-oskey-dev'`, `WHERE repo = 'angular-app-oskey-io'`, `targetRepo: "firebase-oskey-dev"` as a literal value, `["angular-app-oskey-io", ...]` as a literal insert row. Notably, this file's own comment (line 227) documents that this *exact class* of mistake already happened once before — a query was previously hardcoded to `node-iot-api-oskey-io` on a wrong assumption ("only node-iot publishes"), already "fixed" once. The fix was swapping which repo got hardcoded, not removing the hardcoding — the anti-pattern survived its own bugfix.
- **`build-form-field-lineage-edges.ts`** — same shape: real `WHERE repo = 'angular-app-oskey-io'` / `'firebase-oskey-dev'` SQL clauses, hardcoded insert values. A single-purpose script for one repo pair.
- **`build-intra-repo-edges.ts`** — **not actually a violation.** Its matches are all historical comments; its real logic already takes `REPO_NAME` from an environment variable and runs once per repo (fixed earlier in the `graphrag` investigation thread, `graphrag/prompts/prompt-5-intra-repo-edges-scoping-bug.md`). This is real, working proof the fix pattern already exists in this exact codebase — not something to invent from scratch.
- **`sync-facts.ts`** — one real, smaller issue: `import { runContextPath } from "../firebase-oskey-dev/phase-01-ast-extraction/_shared/run-utils"` — a supposedly generic loader script takes a structural dependency on one specific repo's own directory. Everything else flagged in this file is comments.

Prior context, not contradicted but incomplete: `governance/roadmap/consolidation/typescript.md` (2026-09-11) documents these same `HTTP_API_CALL`/`PUBSUB_TOPIC_BINDING` edges as "built and verified" — accurate for its own point in time (written before Kotlin/Swift repos existed in the corpus), but it didn't flag that the mechanism is irreversibly single-purpose. Not a wrong claim then; an incomplete one now.

## Layer 2 — deeper and more important: Swift/Kotlin extraction never learned to recognize an outbound integration call at all

Checked directly against live Postgres, full fact-kind inventory, no truncation:

```
ios-oskey-dev:             call_expression, model_property, function_declaration,
                           imports_dependency, source_file, struct_declaration,
                           extension_declaration, class_declaration, enum_declaration,
                           protocol_declaration
android-intercom-oskey-io: call_expression, imports_dependency, model_property,
                           function_declaration, source_class, source_file,
                           kotlin_object, ble_gatt_constant, usb_wire_constant,
                           enum_declaration, webrtc_signaling_touchpoint,
                           source_interface, kotlin_sealed_hierarchy
```

**Neither repo has anything resembling `firebase_callable_call` (Angular, 102 real facts), `api_contract` (Firebase, 256 facts), or `pubsub_event_route` (Firebase, 7 facts).** Angular's extractor was specifically taught to recognize "this call site invokes a Firebase Callable Function" as its own fact kind; the Swift and Kotlin extractors were never taught the equivalent pattern for however these apps actually talk to the Cloud backend.

**This means Layer 1's fix alone cannot close the iOS gap.** Even a perfectly generalized, repo-agnostic `build-cross-repo-edges.ts` would find zero new real edges for iOS/Android today — there is no raw fact of the right shape to match against. The gap is upstream, in P1 extraction, not in the P2 edge-joining SQL.

## Real, live decision (2026-09-18): fix both — sequenced, not fully parallel

User's call, given other peer sessions had already been closed: fix both layers, each with its own prompt (see `prompts/` in this folder).

**Correction, same day, caught by the user before either session started**: originally framed as fully independent/parallel here — wrong. Layer 1's fix can only be verified as "didn't break the existing Angular/Firebase edges" without a second real fact kind to generalize against; it can look generic in the code without ever being proven generic in practice. Real sequencing: start Layer 2's investigation first. Once it has a real, concrete answer for what a new fact kind would look like structurally, hand that to Layer 1 before it writes its "discover repos/kinds dynamically" logic. Layer 1 doesn't need Layer 2's extraction code built and populating Postgres — just its proposed fact-kind shape known — so this isn't full serialization, just investigation-before-implementation.

**Layer 1 is a same-day, scoped refactor** — fix the architecture violation directly, using `build-intra-repo-edges.ts`'s already-proven pattern (discover repos/kinds dynamically, don't hardcode).

**Layer 2 is a real investigation before it's a build** — nobody has yet read the actual Swift/Kotlin source to determine what an outbound Cloud-Function/API call looks like structurally in either language (Firebase's iOS/Android SDKs? Plain REST/URLSession/OkHttp? Something else?). This needs answering before any extraction code gets written, not assumed — and now also before Layer 1 finalizes its generic-discovery logic, per the correction above. Start this one first.

## Standing rules for both follow-up sessions

- Never `git add`/`git commit` — only the user commits.
- Flag real spend (if any LLM calls are needed, e.g. re-running extraction) before incurring it.
- Verify claims against live Postgres/real source files before reporting them as fact — this exact finding was only trusted because it was checked directly (`SELECT repo, kind, count(*) FROM facts ... GROUP BY repo, kind`), not inferred from a doc.

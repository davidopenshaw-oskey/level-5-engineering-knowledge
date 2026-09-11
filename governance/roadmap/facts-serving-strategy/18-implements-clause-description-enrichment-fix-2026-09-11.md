# `implementsInterfaces` (TS `implements` clause) Extraction & Enrichment Fix, 2026-09-11

Found while auditing Kotlin's own analogous field (`homeButtons`, see `governance/roadmap/android-intercom-oskey-io/17-model-property-description-gaps-homeButtons-2026-09-09.md`) for a similar bug, then checked directly against the 3 TS repos' own AST extraction rather than assumed to generalize.

## The real gap

A class's `implements` clause — which can name multiple interfaces, e.g. Angular's own lifecycle-hook pattern `class Foo implements OnInit, OnDestroy` — was never captured at all in any of the 3 TS AST-extraction pipelines (`angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io`). `01-extract-ast-evidence.ts` built `extendsClass`/`extendsClassTypeArguments` from `cls.getExtends()`/`cls.getBaseClass()` but never called the parallel `cls.getImplements()` API at all.

Confirmed real and active, not theoretical, per-repo:

| repo | files with `class ... implements ...` (real scan) |
|---|---|
| `angular-app-oskey-io` | 78 |
| `firebase-oskey-dev` | 0 (re-verified with a thorough multiline-safe scan, not just the original single-line regex — genuinely zero) |
| `node-iot-api-oskey-io` | 0 (same re-verification — genuinely zero) |

## The fix

**`01-extract-ast-evidence.ts`** (all 3 repos, identical change): added `implementsInterfaces: string[]`, built from `cls.getImplements().map(i => i.getExpression().getText())` — same shape as the existing `getExtends()` code one line above. Only included on the class record when non-empty, matching the existing `extendsClassTypeArguments` convention. Did not capture per-interface generic type arguments — no real, current use case found for it.

**`02-build-module-evidence.ts`** (all 3 repos): threaded `implementsInterfaces` onto the `source_class` fact, same place and same conditional-spread convention as `extendsClass`/`extendsClassTypeArguments`.

**`sync-facts.ts`** (shared): added a new `implementsInterfacesDoc` branch to `descriptionFor()`, reading `fact.implementsInterfaces ?? fact.evidence?.implementsInterfaces` (same fallback pattern as `extendsArgs`), rendering:

```
... -- implements: OnInit, AfterViewInit, OnDestroy
```

Deliberately separate from the existing `managesDoc` branch — `managesDoc` is about `extendsClass`'s own generic argument (e.g. `extends OSKDocumentController<X>`, "manages document type(s)"), a different concept from a class's own `implements` clause. Followed the same list-shaped-field precedent as Swift's `swiftInheritanceDoc` (` -- conforms to/extends: X, Y`).

## Verified for real before touching Postgres

Per this project's own verification discipline (`android-intercom-oskey-io/17-...md`'s real mistake — verify against real before/after data, not just "ran without error"):

1. Ran `descriptionFor()` directly (scratchpad script, deleted after) against real capability-pack facts from a fresh `angular-app-oskey-io` extraction. Confirmed 51 real `source_class` facts carry `implementsInterfaces`, and specifically confirmed 16 real multi-interface cases (e.g. `OSKMessageCenterListComponent -- implements: OnInit, AfterViewInit, OnDestroy`) render **every** interface, not just the first.
2. Re-ran each repo's full `00`–`07` pipeline (`npm run pipeline:angular`, `pipeline:firebase`, `pipeline:node-iot`) — all completed clean. Re-confirmed firebase/node-iot's fresh extraction output has zero `implementsInterfaces` occurrences, matching the pre-fix grep.
3. Ran `sync-facts.ts` per module (no `EMBED=true`) for all 3 repos. Broke down the resulting unembedded-fact counts by `kind` directly in Postgres to isolate what was actually caused by this fix:

   | repo | `source_class` (this fix) | everything else (unrelated) |
   |---|---|---|
   | `angular-app-oskey-io` | **51** | 502 (`imports_dependency` 491, `enum_declaration` 11) |
   | `firebase-oskey-dev` | 0 | 1,827 (`imports_dependency` 1740, `model_property` 72, `enum_declaration` 13, others 3) |
   | `node-iot-api-oskey-io` | 1 (verified: `implementsInterfaces` empty on this one — unrelated drift, not from this fix) | 79 |

   The "everything else" facts are real but out of scope: they match `17-imports-dependency-description-enrichment-fix-2026-09-11.md`'s own documented, not-yet-applied `imports_dependency` re-sync — this session's `00`-`07` + sync re-run incidentally applied that pending re-sync for these 3 repos (counts match that doc's table exactly: firebase 1,740, angular 491, node-iot 72). Descriptions are now updated in Postgres for those; embeddings deliberately left pending — not this fix's cost to spend, and not this session's task to embed on another fix's behalf.
4. Flagged the real spend explicitly and asked before running: embedded **only** the 51 real `angular-app-oskey-io` `source_class` facts caused by this fix (targeted `fact_id` query, not the module-wide `EMBED=true` path, which would have also billed the 2,411 unrelated pending facts above). Trivial cost — ~25 tokens/fact average, consistent with this project's own prior "trivial cost" characterization for a similarly-sized batch.
5. Confirmed directly via `docker exec facts-postgres-index-local psql`: real classes with multiple interfaces show all of them in both `payload->'implementsInterfaces'` and the rendered `description`, e.g.:
   ```
   OSKMessageCenterListComponent | ["OnInit", "AfterViewInit", "OnDestroy"] | ... -- implements: OnInit, AfterViewInit, OnDestroy ...
   ```

## Scope notes

- The 2,411 unrelated pending facts (imports_dependency re-sync fallout, some model_property/enum_declaration drift) are left unembedded in all 3 repos, by explicit user decision — out of scope for this fix. Whoever owns `17-imports-dependency-description-enrichment-fix-2026-09-11.md`'s follow-up still needs to run the embed step for those.
- No new roadmap folder created — this is a single bounded fact-quality fix, filed under the existing `facts-serving-strategy` location per project convention.
- Temporary scratchpad scripts (`descriptionFor()` test, targeted embed) deleted after their findings were captured above.

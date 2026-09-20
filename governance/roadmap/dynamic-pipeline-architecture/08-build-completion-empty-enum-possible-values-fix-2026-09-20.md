# Build completion: empty enum possible-values fix — done, verified, real spend incurred

Executes the plan in [07-build-plan-empty-enum-possible-values-fix-2026-09-20.md](07-build-plan-empty-enum-possible-values-fix-2026-09-20.md). All 5 phases completed same session; every claim below is checked against live Postgres and real source, not assumed. Scope note from that plan's Phase 5, confirmed by the user: this is a bug fix, not a new architectural direction — no ADR.

## What changed

**P1 — the three TS extractors** (`pipeline/{firebase-oskey-dev,angular-app-oskey-io,node-iot-api-oskey-io}/phase-01-ast-extraction/01-extract-ast-evidence.ts`): the enum-extraction block now captures real member values, under a new field name that can never collide with Kotlin's own `members` field again:

```ts
// before
members: en.getMembers().map(m => m.getName()),
// after
enumMembers: en.getMembers().map(m => ({ name: m.getName(), value: m.getValue() })),
```

Uses ts-morph's real, confirmed API (`EnumMember.getValue(): string | number | undefined`, `node_modules/ts-morph/lib/ts-morph.d.ts:5125-5127`).

**P2 — `pipeline/facts-postgres-index/sync-facts.ts`**: added a genuinely separate `tsEnumMembers`/`tsEnumDeclarationDoc` branch (reads `fact.enumMembers`, formats `name = value` the same way Swift's branch already does) and spliced it into the description template. The original `kotlinEnumMembers`/`enumDeclarationDoc` branch is untouched — it simply never receives TS data again, since TS no longer writes anything under the `members` key.

## Real, verified before/after result

Two originally-cited examples, both `angular-app-oskey-io`:

```
afb53ec1962518523809e6d5966a6ed751620f35 (OSKPincodeType)
  before: ... -- possible values: , ,  (...)
  after:  ... -- possible values: Inhabitant = inhabitant, Anonymous = anonymous, Guest = guest (...)

08e32d9ebf3a1f5f1ed84f69c8ef8896d889ccff (OSKSupportedLanguageEnum)
  before: ... -- possible values: ,  (...)
  after:  ... -- possible values: en_US = en_US, fr_FR = fr_FR (...)
```

Plus the single-member edge case doc 06 found (missed by the original `LIKE '%possible values: ,%'` filter, caught by this session's stricter regex check):

```
469809525aa1b563898cc4ef11e36be715c06ac4 (OSKApiName, node-iot-api-oskey-io)
  before: ... -- possible values:  (...)
  after:  ... -- possible values: PubSubMessages = PUB_SUB_MESSAGES (...)
```

## Regression verification (the part flagged as mandatory, not optional)

Full before/after diff of all 227 `enum_declaration` facts (`07-baseline-enum-facts-before-2026-09-20.json` vs. live Postgres post-fix):

- **227 → 227** facts — none lost, none duplicated.
- **Exactly 31 description changes**, all in the three TS repos — matches the confirmed real scope exactly (11 angular-app-oskey-io + 13 firebase-oskey-dev + 7 node-iot-api-oskey-io, the 7 including the single-member case above that the original 30-count missed).
- **0 unexpected changes** in the 17 Kotlin (android-intercom-oskey-io) or 176 Swift facts — byte-identical pre/post, confirmed by direct diff, not assumed from code review.
- **0 remaining broken facts**, re-checked with both the original `LIKE '%possible values: ,%'` filter and the stricter regex check (splits the `possible values: <segment>` text on commas, checks every piece is blank) — across all repos, not just the three fixed.

## Real spend incurred

31 facts re-embedded via `gemini-embedding-2` (Vertex AI), gated behind `sync-facts.ts`'s explicit `EMBED=true` flag and flagged to the user before running, per this project's cost-discipline rule. Confirmed via the `ON CONFLICT` upsert's `embedding = CASE WHEN facts.description IS DISTINCT FROM EXCLUDED.description THEN NULL ELSE facts.embedding END` ([sync-facts.ts:592](../../../pipeline/facts-postgres-index/sync-facts.ts#L592)) that only facts whose description actually changed were re-embedded — no unnecessary spend on the other ~19,000 facts in the 9 touched modules.

Scoped, minimal execution: only the 9 (repo, module) pairs containing an affected enum fact were resynced — `angular-app-oskey-io`{`features`,`core`}, `firebase-oskey-dev`{`organization`,`unit_management`,`building`,`access_control_device`,`user`,`core`}, `node-iot-api-oskey-io`{`access_control_device`} — not a full-repo resync. `00-scan-repo` was deliberately skipped for all three repos (reused each repo's existing `output/<repo>/run-context.json` and already-checked-out clone) specifically to avoid re-cloning and picking up unrelated new upstream commits, keeping this diff attributable purely to the code fix.

## Open item carried forward (not this session's scope)

Doc 06's naming-contract observation is now resolved by this fix (TS enums no longer share the `members` key with Kotlin), so no further action needed there. Nothing else outstanding from doc 06/07 for this specific bug.

## Cleanup

Temporary diagnostic/verification scripts (`tmp/phase0-baseline.ts`, `tmp/phase2-dry-check.ts`, `tmp/phase4-verify.ts`, `tmp/phase4-final-samples.ts`) deleted once their findings were captured above — `tmp/` is gitignored and is now empty again. The before-snapshot itself (`07-baseline-enum-facts-before-2026-09-20.json`) is kept as real evidence, not deleted.

No `git add`/`git commit` run this session — per this project's rule, that remains the user's call.

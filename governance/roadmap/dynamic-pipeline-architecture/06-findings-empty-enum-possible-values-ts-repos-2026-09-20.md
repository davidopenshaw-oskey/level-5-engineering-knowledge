# Real finding: every TypeScript-repo `enum_declaration` fact has an empty possible-values list — a field-shape collision in `sync-facts.ts`, not an AST-extraction gap

**RESOLVED 2026-09-20** — fixed, verified, and re-embedded same session. See [07-build-plan-empty-enum-possible-values-fix-2026-09-20.md](07-build-plan-empty-enum-possible-values-fix-2026-09-20.md) for the build plan and [08-build-completion-empty-enum-possible-values-fix-2026-09-20.md](08-build-completion-empty-enum-possible-values-fix-2026-09-20.md) for the verified before/after result (all 31 affected facts fixed, 0 regressions in Kotlin/Swift). The findings below are left intact as the original investigation record.

Investigated per direct task: "30 of 227 `enum_declaration` facts across the whole `facts` table have an empty possible-values list in their description (`description LIKE '%possible values: ,%'`)." Two confirmed seed examples: `afb53ec1962518523809e6d5966a6ed751620f35` (OSKPincodeType) and `08e32d9ebf3a1f5f1ed84f69c8ef8896d889ccff` (OSKSupportedLanguageEnum), both `angular-app-oskey-io`.

Investigation only, per instruction — nothing in this doc has been fixed this session.

## (a) Real repo breakdown — not systemic, but 100% of the repos it does hit

Queried live Postgres directly (`pg` Pool, same connection pattern as `mcp-server/db/search.ts`):

```
SELECT repo, count(*) FROM facts WHERE kind='enum_declaration'
  AND description LIKE '%possible values: ,%' GROUP BY repo;

firebase-oskey-dev      13
angular-app-oskey-io    11
node-iot-api-oskey-io    6
                        --
                        30
```

Total `enum_declaration` facts by repo, for context:

```
ios-oskey-dev              90   (0 affected)
swift-cloud-kit-oskey-dev  42   (0 affected)
swift-ui-kit-oskey-dev     22   (0 affected)
android-intercom-oskey-io  17   (0 affected)
swift-webrtc-kit-oskey-io  15   (0 affected)
firebase-oskey-dev         13   (13 affected)
angular-app-oskey-io       11   (11 affected)
swift-ble-kit-oskey-dev    10   (0 affected)
node-iot-api-oskey-io       7   (6 affected)
```

**Every affected repo is one of the three TypeScript repos. Every Swift and Kotlin repo has zero affected facts.** This is not a per-repo extractor bug — all three TS repos share the identical broken code path (see (b)), and no Swift/Kotlin repo goes anywhere near it.

**The 30/227 figure undercounts the real scope.** The original `LIKE '%possible values: ,%'` filter only matches when at least two members join into a visible comma. `node-iot-api-oskey-io`'s 7th enum fact (`469809525aa1b563898cc4ef11e36be715c06ac4`, `OSKApiName`, single member) hits the exact same root cause but renders as `possible values: ` with no comma, so the original filter misses it. Re-checked with a regex that extracts the actual `possible values: <segment>` text and tests whether every comma-separated piece is blank: **31 of 31 `enum_declaration` facts across the three TS repos are affected — 100%, not 30/227.** The 227-fact denominator conflates repos where this bug is structurally impossible (Swift/Kotlin, which take a different description code path entirely) with the three where it is universal.

## (b) Root cause — a Kotlin-shaped consumer reading a TypeScript-shaped `members` array

The description text is built centrally in `pipeline/facts-postgres-index/sync-facts.ts`'s `descriptionFor()`, not per-repo. The relevant branch ([sync-facts.ts:295-303](pipeline/facts-postgres-index/sync-facts.ts#L295-L303)):

```ts
// Real, richer analog to unionMembers above -- Kotlin enum members can
// carry real constructor-arg values (`PERMANENT("permanent")`)...
const kotlinEnumMembers: { name: string; constructorArgs?: string[] }[] | undefined = fact.members ?? fact.evidence?.members;
const enumDeclarationDoc = fact.type === "enum_declaration" && kotlinEnumMembers && kotlinEnumMembers.length > 0
  ? ` -- possible values: ${kotlinEnumMembers.map(m => (m.constructorArgs && m.constructorArgs.length > 0 ? `${m.name}(${m.constructorArgs.join(", ")})` : m.name)).join(", ")}`
  : "";
```

This was written for Kotlin specifically (comment, variable name `kotlinEnumMembers`, and the `{name, constructorArgs?}` type annotation all say so) — confirmed correct against Kotlin's own extractor, [pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts:344-348](pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts#L344-L348):

```ts
const members = findNodesOfType(en, "enum_entry").map(entry => {
  const memberName = findNodesOfType(entry, "simple_identifier")[0]?.text ?? entry.text;
  const args = findNodesOfType(entry, "value_arguments")[0];
  return args ? { name: memberName, constructorArgs: args.namedChildren.map(a => a.text) } : { name: memberName };
});
```

Kotlin really does emit `evidence.members` as `{name, constructorArgs?}[]` — the branch is correct for Kotlin, and Android/Kotlin's 17 real enum facts are not affected.

**But the branch is gated only on `fact.type === "enum_declaration"` — not on repo or language — and all three TS extractors also populate a field literally named `members` on their raw enum evidence, with a completely different shape: a flat array of plain strings (member names only).** Identical in all three (`firebase-oskey-dev`, `angular-app-oskey-io`, `node-iot-api-oskey-io`), e.g. [pipeline/firebase-oskey-dev/phase-01-ast-extraction/01-extract-ast-evidence.ts:804-813](pipeline/firebase-oskey-dev/phase-01-ast-extraction/01-extract-ast-evidence.ts#L804-L813):

```ts
// 6. Enums
for (const en of sf.getEnums()) {
  rawEnums.push({
    ...base,
    line: en.getStartLineNumber(),
    name: en.getName(),
    members: en.getMembers().map(m => m.getName()),   // string[], e.g. ["ADMIN", "USER"]
    isExported: en.isExported(),
  });
}
```

This flows unchanged into the fact's `evidence` object in `02-build-module-evidence.ts` ([pipeline/firebase-oskey-dev/phase-01-ast-extraction/02-build-module-evidence.ts:763-785](pipeline/firebase-oskey-dev/phase-01-ast-extraction/02-build-module-evidence.ts#L763-L785)): `evidence: { ...item }` where `item.members` is that same plain `string[]`.

So for a TS enum fact, `kotlinEnumMembers` is actually `string[]`, and the `.map(m => ... m.name)` call runs `m.name` on a plain string — JavaScript strings have no `.name` property, so this evaluates to `undefined` for every single member, every time. `Array.prototype.join` silently coerces `undefined`/`null` elements to empty string rather than throwing or writing `"undefined"`, so `[undefined, undefined].join(", ")` renders as `", "` — exactly the observed `possible values: ,` / `possible values: , , , ` pattern. A single-member TS enum produces `[undefined].join(", ")` = `""`, i.e. `possible values: ` with no comma (the `node-iot-api-oskey-io` case the original filter missed).

**This is a pure shape collision, not a data-capture failure.** The real member names (`ADMIN`, `USER`, etc.) are present and correctly extracted in `evidence.members` the whole time — `en.getMembers().map(m => m.getName())` in the TS extractors is doing exactly what it should. Nothing is lost upstream; it's destroyed downstream, in `sync-facts.ts`, by a consumer written for Kotlin's object shape being applied unconditionally to every `enum_declaration` fact regardless of source language.

## Related, secondary observation (not the bug, but relevant to any real fix)

Even setting the shape collision aside, the TS extractors never capture an enum member's actual **value** (e.g. `ADMIN = 'admin'`, `COUNT = 5`) — only its **name** (`ADMIN`). Contrast with Swift's `rawValue` capture (`swiftEnumCases`, same file, lines 305-324) or Kotlin's `constructorArgs`. So a straightforward "make the TS branch consume `string[]` correctly" fix would produce `possible values: ADMIN, USER` (member names) rather than the underlying values — which may or may not be what "possible values" is meant to promise for a reader. Worth a real decision, not an assumption, in the follow-up session: is member-name text sufficient, or does this warrant capturing real member values (string/numeric literal initializers) in the TS extractors the way Swift/Kotlin already do for their own richer shapes?

## Scope note

Nothing fixed this session — flagging both the shape-collision root cause and the 30-vs-31 undercount for a separate decide/build session, per this project's session-scope discipline (investigate / decide-document / build stay separate).

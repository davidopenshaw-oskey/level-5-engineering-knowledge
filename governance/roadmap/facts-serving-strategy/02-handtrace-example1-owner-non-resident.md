# Hand-Trace — Example A1.1 (Owner Non Resident) Against Today's Real Facts

**Correction (2026-09-01, after this trace was first written):** the original version of this document reached its findings by freely reading the real cloned source, not just Phase 1's facts, and treated the source-read parts as an acceptable "pointer" addition. That's wrong for what this exercise is actually meant to test — the real atomic-PRD tool will only ever have what got extracted into Phase 1's facts (and, if P2 gets built, indexed from them), never live source access. Reading source at will tests "what can an agent with full repo access find," which is a different and much easier question. Re-run properly below, constrained to facts only.

**Purpose:** a cheap sanity check, done by hand with zero new infrastructure, against PMO-012's real scenario — before any Postgres/pgvector build decision.

**Corrected method:** searched only Phase 1's real fact files (`ast-*.json`, capability packs) — no reading of the cloned source repos at all.

## What survives, facts-only

- The `.includes()` permission checks in `unit_management_inhabitant.service.ts`/`unit_management_permanent_guest.service.ts` are real, fully fact-derivable: the `call_expression` fact for each site stores the literal text `"['owner', 'tenant'].includes"` directly in its own `expression` field, not just a bare method name. A plain keyword search over facts for "owner"/"tenant" genuinely surfaces all 7 real sites with their real content.
- The type name `OSKBuildingUnitInhabitantType` exists as a real type-alias fact (file/line, `isExported: true`).
- The cross-repo sharing claim survives as a real fact-to-fact join, not a guess: Angular's own `ast-imports.json` has a real import fact whose `namedImports` array literally includes `"OSKBuildingUnitInhabitantType"`, sourced from `moduleSpecifier: "@oskey/core/types"`. Matching that name against Firebase's type-alias fact of the same name is exactly the kind of deterministic cross-repo edge described in ADR-005 — no source reading needed for this part.

## What does not survive — required reading the actual source file

- **The type's actual union values** (`'owner' | 'tenant' | 'resident'`). Checked directly and precisely: Phase 1 extracts an enum's full `members` array as part of its fact (confirmed against a real enum fact), but a type alias's fact carries only its name, file, and line — never its contents, even for a plain string-literal union like this one. This is a real, specific, fixable schema gap, not a source-reading shortcut.
- The business-rule commentary explaining *why* owners and tenants are treated as equally privileged over residents — that reasoning lives in a code comment next to the check, which no fact type captures.
- The full inventory of "8+ files" using this type beyond the two services above — found originally by grepping raw source directly, not reconstructed from a systematic facts-only search.

**Net effect of the correction:** most of this trace survives, because the interesting content here happened to be visible in fact fields already (the literal array in the call expression, the import name match). Example 4's trace was not so fortunate — see its own corrected version.

---

## Full findings, each labeled by how it was actually reached

🟢 = fact-derivable (what a real P2 index, built only from Phase 1 facts, could actually surface). 🔵 = required reading the cloned source directly — real and correct, but **not achievable by the system this exercise is meant to validate**, per the correction above.

- 🟢 `OSKBuildingUnitInhabitantType` exists as a type alias at `building_unit_inhabitant_type_document.model.ts:6`.
- 🔵 Its actual contents: `'owner' | 'tenant' | 'resident'`.
- 🟢 Angular imports that exact name from `@oskey/core/types` (real import fact, `namedImports` array) — a legitimate fact-to-fact cross-repo match.
- 🟢 7 real call sites contain the literal text `['owner', 'tenant'].includes` in their own fact record, in `unit_management_inhabitant.service.ts` (lines 219, 332, 638, 665, 701, 752) and `unit_management_permanent_guest.service.ts` (line 197).
- 🔵 The business-rule reasoning around those checks ("owners and tenants are equally privileged over residents, and cannot remove each other") — that's the comment text next to the code, not captured by any fact.
- 🔵 That the type fans out into 8+ files beyond the two services above — found by grepping raw source for every reference, not reconstructed from a systematic facts search (though re-doing this as a facts-only exercise — searching every `call_expression`/`model_property`/`import` fact for the string `OSKBuildingUnitInhabitantType` or its literal values — would likely recover a real, if less complete, version of this; not attempted here).
- 🔵 That today's authority model is flat (no delegation chain) and that occupancy state/type (Vacant/Occupied, LLD/LCD) don't exist anywhere — both confirmed by reading/grepping source directly, not from any fact.

## Honest bottom line

The one 🟢-only, fully fact-derivable answer this trace could produce is: *"a type called `OSKBuildingUnitInhabitantType` exists at this file and line, is shared with Angular, and 7 real call sites reference the literal values 'owner' and 'tenant'."* That's real and useful — a developer handed just that would know exactly where to look. But it stops well short of "here's how the current permission model actually works" or "here's the real gap in PMO-012's proposed authority chain" — those required reading the source, which the intended atomic-PRD consumer won't have. This is a materially more honest, and more limited, conclusion than the original version of this document drew.

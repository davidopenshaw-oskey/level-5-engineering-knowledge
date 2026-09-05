// **version:** 1.0.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// Task 2 Part D of governance/roadmap/facts-serving-strategy/15-workflow-
// clustering-and-angular-ux-facts.md: real form-control-to-backend-field
// lineage. Answers "what values can this form field actually take", by
// tracing the real, compiler-resolved call chain from a form control to
// the backend request type it submits to -- not by matching field names
// across the codebase, which was checked and found unsafe (25 real,
// distinct model types share the field name "inhabitantType" alone).
//
// The real chain, confirmed piece by piece before building this, not
// assumed:
//   1. angular_template_attribute (formControlName="x") -- which
//      component/control.
//   2. That component's own call_expression facts already carry a real,
//      compiler-resolved (not name-guessed) declarationClass/
//      declarationMethod for any call to an injected service -- ts-morph's
//      own type-checker already did this work; it was just never wired
//      into a join.
//   3. firebase_callable_call facts previously had no record of which
//      method contained them (a real gap, fixed the same day this script
//      was written) -- now carry callerClass/callerMethod, matched against
//      step 2's resolved target.
//   4. The resulting firebase_callable_call already has a real, verified
//      HTTP_API_CALL edge in cross_repo_edges (task 2 of 14-...md) --
//      reused here, not re-derived.
//   5. That edge's target Firebase api_contract's real requestType is
//      matched against real model_property facts for the control's field
//      name -- safe here specifically because the type is now known from
//      a real, traced chain, not guessed from a bare field name.
//   6. If that field's real type resolves to a union alias, its
//      already-captured real values (05-tasklist.md item 1) answer "what
//      values can this field take."
import "dotenv/config";
import { Pool } from "pg";

// Real max nesting depth actually observed in the codebase, checked
// directly 2026-09-05 by recursively walking real OSKUserInvitation /
// OSKAccessRight / guest-invitation document families rather than assumed:
// chains reach 3-4 real levels (e.g. OSKUserInvitation -> OSKBuildingUnit-
// Inhabitant -> OSKStreetAddress -> OSKCoordinate), and routinely cross
// repos at any level (OSKUserInvitation, defined in angular-app-oskey-io,
// nests OSKAccessRight, defined in node-iot-api-oskey-io; OSKUserInvitation
// Construction, defined in firebase-oskey-dev, nests OSKUserDocument,
// defined in angular-app-oskey-io). A single hard-coded level (the first
// version of this script) is provably wrong as a general principle, even
// though it happened to be sufficient for the one dataset tested so far
// (82 Angular form controls -> Firebase request types, none needed >1
// level). This bound gives real headroom above the deepest chain found,
// without being unbounded.
const MAX_FIELD_RESOLUTION_DEPTH = 6;

interface FieldResolution {
  factId: string;
  propertyType: string | null;
  resolvedVia: string;
}

function cleanTypeName(raw: string | null | undefined): string | null {
  const cleaned = raw
    ?.replace(/import\("[^"]*"\)\./g, "")
    .replace(/\s*\|\s*undefined\s*$/, "")
    .replace(/\[\]$/, "")
    .trim();
  return cleaned || null;
}

// Recursively resolves `${typeName}.${fieldName}` against real, live
// model_property facts -- no repo filter anywhere in this walk, by
// construction: matching is purely on symbol_name, so it already works
// correctly regardless of which repo a nested type happens to be declared
// in (confirmed necessary, not just theoretically nice -- see the real
// cross-repo examples above). `visited` guards against real cycles (some
// exist structurally, e.g. address/coordinate shapes) and also correctly
// dedupes a type reached twice via two different sibling paths -- the
// underlying model_property facts for that type are the same regardless of
// which path reached them, so revisiting would only ever produce a
// duplicate, never new information. Collects every real match found,
// rather than stopping at the first -- ambiguity (more than one distinct
// match) must be surfaced honestly, not silently resolved by picking one,
// matching this whole session's "never guess when ambiguous" discipline
// (the same reasoning that ruled out matching by field name across the
// whole codebase in the first place: 25 real collisions on "inhabitantType"
// alone).
async function resolveFieldRecursive(
  db: Pool,
  typeName: string,
  fieldName: string,
  depth: number,
  visited: Set<string>
): Promise<FieldResolution[]> {
  if (depth > MAX_FIELD_RESOLUTION_DEPTH || visited.has(typeName)) return [];
  visited.add(typeName);

  const direct = await db.query<{ fact_id: string; propertyType: string | null }>(
    `SELECT fact_id, payload->'evidence'->>'propertyType' as "propertyType" FROM facts
     WHERE kind = 'model_property' AND symbol_name = $1`,
    [`${typeName}.${fieldName}`]
  );
  const results: FieldResolution[] = direct.rows.map(r => ({
    factId: r.fact_id, propertyType: r.propertyType, resolvedVia: `${typeName}.${fieldName}`,
  }));

  const siblings = await db.query<{ propertyType: string | null }>(
    `SELECT payload->'evidence'->>'propertyType' as "propertyType" FROM facts
     WHERE kind = 'model_property' AND symbol_name LIKE $1`,
    [`${typeName}.%`]
  );
  for (const sib of siblings.rows) {
    const nestedType = cleanTypeName(sib.propertyType);
    if (!nestedType || nestedType === typeName) continue;
    const nested = await resolveFieldRecursive(db, nestedType, fieldName, depth + 1, visited);
    for (const n of nested) results.push({ ...n, resolvedVia: `${typeName} -> ${n.resolvedVia}` });
  }
  return results;
}

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

async function main() {
  const db = pool();
  try {
    // Step 1: every real formControlName attribute fact.
    const controls = await db.query<{ fact_id: string; className: string; controlName: string }>(
      `SELECT fact_id, payload->'evidence'->>'className' as "className", payload->'evidence'->>'attributeValue' as "controlName"
       FROM facts WHERE repo = 'angular-app-oskey-io' AND kind = 'angular_template_attribute'
       AND payload->'evidence'->>'attributeName' = 'formControlName'`
    );
    console.log(`Loaded ${controls.rowCount} real formControlName control facts.`);

    // Step 2: every real, compiler-resolved call from a component to an
    // injected service -- declarationClass/declarationMethod is the real
    // type-checked target, not a name guess.
    const resolvedCalls = await db.query<{ callerClass: string; declarationClass: string; declarationMethod: string }>(
      `SELECT DISTINCT payload->'evidence'->>'callerClass' as "callerClass",
              payload->'evidence'->>'declarationClass' as "declarationClass",
              payload->'evidence'->>'declarationMethod' as "declarationMethod"
       FROM facts WHERE repo = 'angular-app-oskey-io' AND kind = 'call_expression'
       AND payload->'evidence'->>'resolutionStatus' = 'resolved'
       AND payload->'evidence'->>'declarationClass' IS NOT NULL
       AND payload->'evidence'->>'declarationMethod' IS NOT NULL`
    );
    // componentClass -> [{declarationClass, declarationMethod}, ...]
    const callsByComponent = new Map<string, { declarationClass: string; declarationMethod: string }[]>();
    for (const row of resolvedCalls.rows) {
      const list = callsByComponent.get(row.callerClass) ?? [];
      list.push({ declarationClass: row.declarationClass, declarationMethod: row.declarationMethod });
      callsByComponent.set(row.callerClass, list);
    }

    // Step 3: every real firebase_callable_call, keyed by (callerClass, callerMethod).
    const callables = await db.query<{ fact_id: string; callerClass: string; callerMethod: string; functionName: string }>(
      `SELECT fact_id, payload->'evidence'->>'callerClass' as "callerClass", payload->'evidence'->>'callerMethod' as "callerMethod",
              payload->'evidence'->>'functionName' as "functionName"
       FROM facts WHERE repo = 'angular-app-oskey-io' AND kind = 'firebase_callable_call'
       AND payload->'evidence'->>'callerClass' IS NOT NULL AND payload->'evidence'->>'callerMethod' IS NOT NULL`
    );
    const callableByKey = new Map(callables.rows.map(r => [`${r.callerClass}::${r.callerMethod}`, r]));

    // Step 4: reuse the already-built, already-verified HTTP_API_CALL edges
    // (task 2, 14-...md) -- not re-derived.
    const edges = await db.query<{ source_fact_id: string; target_fact_id: string | null; resolution_status: string }>(
      `SELECT source_fact_id, target_fact_id, resolution_status FROM cross_repo_edges WHERE connection_type = 'HTTP_API_CALL'`
    );
    const edgeBySourceFactId = new Map(edges.rows.map(r => [r.source_fact_id, r]));

    let resolvedCount = 0, unresolvedCount = 0;
    const results: { controlFactId: string; controlName: string; componentClass: string; targetFactId: string; propertyFactId: string; unionValues: string[] | null; resolvedVia: string }[] = [];
    const unresolvedReasons: string[] = [];

    for (const control of controls.rows) {
      const candidateCalls = callsByComponent.get(control.className) ?? [];
      // A component can have several resolved calls (translate.instant,
      // getCountries, createResident, ...) -- only the ones that ALSO
      // match a real firebase_callable_call are relevant. This is what
      // makes this safe: name-matching alone (25 real collisions on
      // "inhabitantType") was rejected; matching a real, compiler-resolved
      // call chain against a real, already-verified callable fact is not
      // the same risk -- there is no ambiguity left to resolve by name.
      const matchedCallables = candidateCalls
        .map(c => callableByKey.get(`${c.declarationClass}::${c.declarationMethod}`))
        .filter((c): c is NonNullable<typeof c> => !!c);

      if (matchedCallables.length === 0) {
        unresolvedCount++;
        unresolvedReasons.push(`${control.className}.${control.controlName}: no resolved call chain reaches a known firebase_callable_call`);
        continue;
      }

      for (const callable of matchedCallables) {
        const edge = edgeBySourceFactId.get(callable.fact_id);
        if (!edge || edge.resolution_status !== "resolved" || !edge.target_fact_id) {
          unresolvedCount++;
          unresolvedReasons.push(`${control.className}.${control.controlName}: ${callable.functionName} has no resolved HTTP_API_CALL edge`);
          continue;
        }

        // Step 5: the resolved api_contract's real requestType, matched
        // against real model_property facts for this exact field name.
        const contract = await db.query<{ requestType: string | null }>(
          `SELECT payload->'evidence'->>'requestType' as "requestType" FROM facts WHERE fact_id = $1`,
          [edge.target_fact_id]
        );
        const requestType = contract.rows[0]?.requestType?.replace(/import\("[^"]*"\)\./g, "");
        if (!requestType) {
          unresolvedCount++;
          unresolvedReasons.push(`${control.className}.${control.controlName}: resolved contract has no requestType`);
          continue;
        }

        // Real bug caught before running, not after: propertyType lives
        // under payload.evidence, not top-level -- the same "mirrored
        // subset at top level, full data under evidence" pattern already
        // hit repeatedly this session for other fact kinds. Checked the
        // real payload directly before assuming a field name here.
        //
        // Recursive, depth- and cycle-bounded, repo-agnostic walk -- not a
        // single hard-coded level. See resolveFieldRecursive's own comment
        // for the real data (Invitation/AccessRight/guest-invitation
        // document families, checked directly) that ruled out a one-level
        // version as a general assumption.
        const matches = await resolveFieldRecursive(db, requestType, control.controlName, 0, new Set());
        if (matches.length !== 1) {
          unresolvedCount++;
          unresolvedReasons.push(`${control.className}.${control.controlName}: ${matches.length} real model_property match(es) reachable from ${requestType} (recursive walk, depth<=${MAX_FIELD_RESOLUTION_DEPTH}) for field '${control.controlName}' (need exactly 1)`);
          continue;
        }
        const field = { rowCount: 1 as const, rows: [{ fact_id: matches[0].factId, propertyType: matches[0].propertyType }] };
        const resolvedVia = matches[0].resolvedVia;

        // Step 6: if the real field type is a union alias, surface its
        // already-captured real values. Real, confirmed shape: an optional
        // field's real type text ends "| undefined" (e.g.
        // "...OSKBuildingUnitInhabitantType | undefined") -- stripped here,
        // not assumed absent, or the type_alias lookup below would never
        // match.
        let unionValues: string[] | null = null;
        const rawType = field.rows[0].propertyType
          ?.replace(/import\("[^"]*"\)\./g, "")
          .replace(/\s*\|\s*undefined\s*$/, "")
          .trim();
        if (rawType) {
          const typeAlias = await db.query<{ unionMembers: string[] | null }>(
            `SELECT payload->'evidence'->'unionMembers' as "unionMembers" FROM facts
             WHERE kind = 'type_alias' AND symbol_name = $1 LIMIT 1`,
            [rawType]
          );
          const members = typeAlias.rows[0]?.unionMembers;
          if (Array.isArray(members) && members.length > 0) unionValues = members;
        }

        resolvedCount++;
        results.push({ controlFactId: control.fact_id, controlName: control.controlName, componentClass: control.className, targetFactId: edge.target_fact_id, propertyFactId: field.rows[0].fact_id, unionValues, resolvedVia });
      }
    }

    console.log(`\nJoin result: ${resolvedCount} resolved, ${unresolvedCount} unresolved.`);
    console.log("\nReal resolved matches:");
    for (const r of results) console.log(`  ${r.componentClass}.${r.controlName} (via ${r.resolvedVia}) -> real values: ${r.unionValues ? r.unionValues.join(", ") : "(field type not a union)"}`);
    console.log("\nSample unresolved reasons (first 10):");
    for (const r of unresolvedReasons.slice(0, 10)) console.log(`  ${r}`);

    // Write real FIELD_BINDING edges into cross_repo_edges, following the
    // exact column convention already established by build-cross-repo-edges.ts
    // (checked a real HTTP_API_CALL row before writing this, not assumed).
    if (results.length > 0) {
      const now = new Date();
      const synthesisId = now.toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "_");
      await db.query(`DELETE FROM cross_repo_edges WHERE connection_type = 'FIELD_BINDING'`);
      for (const r of results) {
        const details = r.unionValues
          ? `resolved via ${r.resolvedVia} -- real allowed values: ${r.unionValues.join(", ")}`
          : `resolved via ${r.resolvedVia} -- field type is not a union`;
        await db.query(
          `INSERT INTO cross_repo_edges
             (source_repo, source_symbol, target_repo, target_symbol, connection_type,
              resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at,
              source_fact_id, target_fact_id)
           VALUES ($1,$2,$3,$4,'FIELD_BINDING','resolved','ast_derived',NULL,$5,$6,now(),$7,$8)`,
          [
            "angular-app-oskey-io", `${r.componentClass}.${r.controlName}`,
            "firebase-oskey-dev", r.resolvedVia,
            details, synthesisId,
            r.controlFactId, r.propertyFactId,
          ]
        );
      }
      console.log(`\nWrote ${results.length} real FIELD_BINDING edges to cross_repo_edges (synthesis_id ${synthesisId}).`);
    }
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

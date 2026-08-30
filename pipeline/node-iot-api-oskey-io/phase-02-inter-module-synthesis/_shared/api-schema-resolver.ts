// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Deterministically resolves api_contract facts' requestType/responseType
// against model_property facts by parentName -- the join every P2 contract
// has, until now, asked the LLM to perform itself every single call (see
// ADR-002's note that requestType/responseType are bare type references,
// not expanded field lists). Tier 2 artifact per governance/adrs/adr-004.md
// and governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3.
//
// requestType/responseType are full TypeScript type expressions, not bare
// names -- e.g. `import("...").OSKBuildingGetAllRequestData`, or a
// generic-wrapped chain like `OSKHttpsSuccessResponse<OSKDocumentList<
// OSKBuildingDocument>>`. This resolver extracts every capitalized
// identifier from the expression as a candidate type name and reports
// whichever ones actually match a model_property parentName in the same
// fact set -- it does not guess which candidate is "the real payload type"
// versus a generic wrapper; that judgment (if needed at all) stays
// narrative. A candidate with no match (common for generic wrapper types
// like OSKHttpsSuccessResponse, which are cross-module utility types with
// no model_property facts in a single module's own evidence) is simply
// omitted, not reported as an error -- consistent with the existing
// instruction to say "not found" rather than fabricate a schema.

export interface ResolvedField {
  property: string;
  propertyType: string;
  optional: boolean;
}

export interface ResolvedTypeSchema {
  typeName: string;
  fields: ResolvedField[];
}

/** requestType/responseType are full type expressions (possibly with
 * `import("path").` prefixes and generic wrapping) -- extract every
 * capitalized identifier as a candidate type name to look up. */
function extractCandidateTypeNames(typeExpr: string): string[] {
  const cleaned = typeExpr.replace(/import\("[^"]*"\)\./g, "");
  const matches = cleaned.match(/\b[A-Z][A-Za-z0-9_]*\b/g) || [];
  return Array.from(new Set(matches));
}

/** Resolves every api_contract fact's requestType/responseType against
 * model_property facts present in the SAME fact array -- callers pass
 * either a whole module's evidence graph facts or a single capability
 * pack's facts, and only get back matches resolvable within that scope
 * (matches ADR-002's fail-honest behavior: no match reported, not a
 * cross-scope guess). Keyed by `${file}#${handlerValue}#${requestType|
 * responseType}` to avoid collisions between same-named handlers in
 * different files. */
export function resolveApiSchemas(facts: any[]): Record<string, ResolvedTypeSchema[]> {
  const fieldsByParent = new Map<string, ResolvedField[]>();
  for (const f of facts) {
    if (f.type !== "model_property") continue;
    const parentName: string | undefined = f.evidence?.parentName;
    const propertyName: string | undefined = f.evidence?.propertyName;
    if (!parentName || !propertyName) continue;
    const list = fieldsByParent.get(parentName) ?? [];
    list.push({
      property: propertyName,
      propertyType: f.evidence?.propertyType ?? "unknown",
      optional: Boolean(f.evidence?.isOptional),
    });
    fieldsByParent.set(parentName, list);
  }

  const result: Record<string, ResolvedTypeSchema[]> = {};
  for (const f of facts) {
    if (f.type !== "api_contract") continue;
    for (const typeField of ["requestType", "responseType"] as const) {
      const typeExpr: string | undefined = f.evidence?.[typeField];
      if (!typeExpr) continue;

      const resolved: ResolvedTypeSchema[] = [];
      for (const candidate of extractCandidateTypeNames(typeExpr)) {
        const fields = fieldsByParent.get(candidate);
        if (fields) resolved.push({ typeName: candidate, fields });
      }
      if (resolved.length > 0) {
        result[`${f.file}#${f.value}#${typeField}`] = resolved;
      }
    }
  }
  return result;
}

/** Renders the resolved schema map as a compact, LLM-facing block --
 * consistent with the compact-table convention used elsewhere in this
 * pipeline (see factsToCompactTable in phase-01's run-utils). */
export function formatResolvedApiSchemas(resolved: Record<string, ResolvedTypeSchema[]>): string {
  const keys = Object.keys(resolved).sort();
  if (keys.length === 0) return "(no api_contract requestType/responseType resolved to any model_property facts in this evidence scope)";

  const lines: string[] = [];
  for (const key of keys) {
    const [file, handlerValue, typeField] = key.split("#");
    for (const schema of resolved[key]) {
      lines.push(`${file} :: ${handlerValue} :: ${typeField} :: ${schema.typeName}`);
      for (const field of schema.fields) {
        lines.push(`\t${field.property}\t${field.propertyType}${field.optional ? "\t(optional)" : ""}`);
      }
    }
  }
  return lines.join("\n");
}

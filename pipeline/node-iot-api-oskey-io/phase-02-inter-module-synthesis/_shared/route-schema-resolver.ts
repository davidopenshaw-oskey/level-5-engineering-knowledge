// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Deterministically resolves route_definition facts' schemaName against
// joi_schema_field facts by schemaExportName -- this repo's real equivalent
// of Firebase's api-schema-resolver.ts. Structurally simpler than that
// resolver (Joi schema fields are already a flat property list, no
// type-expression parsing needed), but with one real difference that
// matters and is NOT optional: the join must be computed over the WHOLE
// MODULE's joi_schema_field facts, not just one capability pack's own
// facts. Verified directly (governance/roadmap/node-iot-api-oskey-io/
// 01-phase2-contract-design.md, finding 2): this repo's pubSubMessageSchema
// is referenced by 3 different capabilities' routes (accesses/configs/
// intercom_entries) but its own joi_schema_field facts live in a 4th pack
// (_module_root, since it's a shared schema file tagged submodule: null) --
// resolving only within one capability's own pack (the way Firebase's
// api-schema-resolver.ts is called today, with pack.facts alone via
// _shared/capability-synthesis.ts) would silently produce zero resolved
// fields for exactly the routes that matter most (the Pub/Sub push routes)
// in 3 of this module's 5 real capabilities -- not a hypothetical edge
// case, the dominant real case for this specific schema.

export interface ResolvedJoiField {
  fieldName: string;
  joiType: string | null;
  required: boolean;
  validValues: string[] | null;
}

export interface ResolvedRouteSchema {
  schemaExportName: string;
  fields: ResolvedJoiField[];
}

/** moduleFacts: the WHOLE module's facts (every capability, e.g. loaded
 * from `${moduleName}-facts.json`) -- required, see header comment; passing
 * only one pack's facts here would silently under-resolve.
 * routeFacts: the route_definition facts to resolve -- normally just one
 * capability pack's own routes (a capability should only ever report on its
 * OWN routes, even though the schema lookup that finds their fields must be
 * module-wide).
 * Keyed by `${file}#${httpPath}#${method}#${versionDate}` to avoid
 * collisions between different routes that happen to share a schema. */
export function resolveRouteSchemas(moduleFacts: any[], routeFacts: any[]): Record<string, ResolvedRouteSchema> {
  const fieldsBySchema = new Map<string, ResolvedJoiField[]>();
  for (const f of moduleFacts) {
    if (f.type !== "joi_schema_field") continue;
    const schemaExportName: string | undefined = f.schemaExportName ?? f.evidence?.schemaExportName;
    const fieldName: string | undefined = f.fieldName ?? f.evidence?.fieldName;
    if (!schemaExportName || !fieldName) continue;
    const list = fieldsBySchema.get(schemaExportName) ?? [];
    list.push({
      fieldName,
      joiType: f.joiType ?? f.evidence?.joiType ?? null,
      required: Boolean(f.required ?? f.evidence?.required),
      validValues: f.validValues ?? f.evidence?.validValues ?? null,
    });
    fieldsBySchema.set(schemaExportName, list);
  }

  const result: Record<string, ResolvedRouteSchema> = {};
  for (const r of routeFacts) {
    if (r.type !== "route_definition") continue;
    const schemaName: string | null | undefined = r.schemaName ?? r.evidence?.schemaName;
    if (!schemaName) continue; // no schema wired to this route at all -- nothing to resolve, not an error

    const fields = fieldsBySchema.get(schemaName);
    if (!fields) continue; // schema referenced but its fields aren't resolvable anywhere in this module's evidence -- omitted, not fabricated (same fail-honest behavior as api-schema-resolver.ts)

    const key = `${r.file}#${r.httpPath}#${r.method}#${r.versionDate}`;
    result[key] = { schemaExportName: schemaName, fields };
  }
  return result;
}

/** Renders the resolved schema map as a compact, LLM-facing block --
 * consistent with the compact-table convention used elsewhere in this
 * pipeline (see factsToCompactTable in phase-01's run-utils). */
export function formatResolvedRouteSchemas(resolved: Record<string, ResolvedRouteSchema>): string {
  const keys = Object.keys(resolved).sort();
  if (keys.length === 0) {
    return "(no route_definition schemaName resolved to any joi_schema_field facts in this module's evidence)";
  }

  const lines: string[] = [];
  for (const key of keys) {
    const [file, httpPath, method, versionDate] = key.split("#");
    const schema = resolved[key];
    lines.push(`${file} :: ${method} ${httpPath} (${versionDate}) :: ${schema.schemaExportName}`);
    for (const field of schema.fields) {
      const valid = field.validValues && field.validValues.length > 0 ? `\t(valid: ${field.validValues.join("|")})` : "";
      lines.push(`\t${field.fieldName}\t${field.joiType ?? "unknown"}${field.required ? "\t(required)" : "\t(optional)"}${valid}`);
    }
  }
  return lines.join("\n");
}

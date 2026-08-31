// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Filters 04-build-resolved-graph.ts's repo-wide rbacRequirements catalog
// down to the checks that occur inside one module -- 02-generate-repo-
// report.ts already builds its own repo-wide RBAC Requirements Catalog
// section directly from the same resolvedGraph.rbacRequirements, but that's
// a separate, repo-level rendering; this module-filtered view was never
// wired into the module-reduce call (01c) at all. Ported from
// firebase-oskey-dev's copy of this file per governance/roadmap/
// v1-b-module-reduce-contract-scope-2026-08-30.md Section 3: the reduce
// contract's own "build a mental enforcement tally" instruction meant the
// LLM reconstructed the entire cross-capability permission comparison from
// N separate prose extracts, with zero deterministic pre-aggregation
// reaching the call. This supplies the tally directly. Domain-agnostic --
// operates purely on the resolvedGraph's module/submodule/confidence shape,
// unchanged from Firebase's version.

export interface ModuleRbacRow {
  permission: string;
  confidence: "confirmed" | "candidate";
  moduleCheckCount: number;
  submodules: string[];
  sampleChecks: Array<{ submodule: string | null; file: string; line: number }>;
}

const MAX_SAMPLE_CHECKS_PER_PERMISSION = 3;

/** Filters the repo-wide rbacRequirements catalog to the checks whose
 * `module` field matches moduleName, re-deriving moduleCheckCount and the
 * submodule list from only those checks -- a permission's repo-wide
 * checkCount is not meaningful here, since most of it may belong to other
 * modules entirely. */
export function filterRbacRequirementsForModule(resolvedGraph: any, moduleName: string): ModuleRbacRow[] {
  const rows: ModuleRbacRow[] = [];
  for (const req of resolvedGraph.rbacRequirements ?? []) {
    const moduleChecks = (req.checks ?? []).filter((c: any) => c.module === moduleName);
    if (moduleChecks.length === 0) continue;
    rows.push({
      permission: req.permission,
      confidence: req.confidence,
      moduleCheckCount: moduleChecks.length,
      submodules: Array.from(new Set(moduleChecks.map((c: any) => c.submodule).filter(Boolean))).sort() as string[],
      sampleChecks: moduleChecks.slice(0, MAX_SAMPLE_CHECKS_PER_PERMISSION).map((c: any) => ({ submodule: c.submodule ?? null, file: c.file, line: c.line })),
    });
  }
  rows.sort((a, b) => b.moduleCheckCount - a.moduleCheckCount || a.permission.localeCompare(b.permission));
  return rows;
}

export function formatRbacCatalog(rows: ModuleRbacRow[]): string {
  if (rows.length === 0) return "*(no RBAC permission checks found anywhere in this module)*";
  return rows
    .map(r => {
      const sample = r.sampleChecks.map(c => `${c.submodule ?? "(submodule unknown)"} (${c.file}:${c.line})`).join(", ");
      const checkedBy = r.submodules.length > 0 ? r.submodules.join(", ") : "(submodule unknown)";
      return `- \`${r.permission}\` (${r.confidence}, ${r.moduleCheckCount} check-site(s) in this module) — checked by: ${checkedBy} [e.g. ${sample}]`;
    })
    .join("\n");
}

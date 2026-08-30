// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Flattens rbac-roles.json's nested composite-role tree into a flat,
// English-only {permissionString: description} lookup for P2 prompts.
// Deterministic transform, no LLM involved -- Tier 2 artifact per
// governance/adrs/adr-004.md and governance/roadmap/02-structural-
// narrative-synthesis-tiers.md Stage 3.
//
// Only the leaf `roles` entries are kept (the granular permission strings
// that actually appear in code permission checks, e.g. `v1.org.buildings.
// create`), each with its English description -- the description is what
// let a semantic mismatch (a permission string used to gate an operation
// its own description doesn't match) get caught in earlier synthesis runs.
// Composite-role bundles (the wrapper nodes -- admin-facing groupings like
// "Manage Buildings") and the French translations are deliberately dropped:
// composites aren't needed for the existence/semantic-check use case this
// feeds (see tasks.md item 14), and French is never consumed by this
// English-language pipeline. The full nested file, composites and French
// included, remains the canonical stored doc -- untouched, for any future
// use case that genuinely needs bundle structure.

interface RbacNode {
  title?: { en?: string; fr?: string };
  description?: { en?: string; fr?: string };
  parentCompositeRoles?: string[];
  compositeRoles?: Record<string, RbacNode>;
  roles?: Record<string, RbacNode>;
}

function collectLeafRoles(node: RbacNode, out: Map<string, string>): void {
  for (const [permissionString, leaf] of Object.entries(node.roles ?? {})) {
    out.set(permissionString, leaf.description?.en ?? "");
  }
  for (const child of Object.values(node.compositeRoles ?? {})) {
    collectLeafRoles(child, out);
  }
}

/** Same leaf-role extraction as flattenRbacRoles below, returned as a Map
 * (permissionString -> English description) instead of a formatted string
 * -- for callers that need a real membership check (does this permission
 * string actually exist in the authoritative roles doc?) rather than
 * LLM-facing prompt text. Added for 02-generate-repo-report.ts's
 * deterministic RBAC Requirements Catalog, which cross-checks each
 * repo-wide permission requirement against this doc without asking an LLM
 * to eyeball it. */
export function getFlattenedRbacRolesMap(rawJson: string): Map<string, string> {
  const tree: Record<string, RbacNode> = JSON.parse(rawJson);
  const leaves = new Map<string, string>();
  for (const root of Object.values(tree)) {
    collectLeafRoles(root, leaves);
  }
  return leaves;
}

/** Takes the raw rbac-roles.json file content (as a string) and returns a
 * compact, English-only, TSV-style lookup of every leaf permission string
 * to its description -- consistent with the compact-table convention used
 * elsewhere in this pipeline for LLM-facing prompt input (see
 * factsToCompactTable in phase-01's run-utils). */
export function flattenRbacRoles(rawJson: string): string {
  const leaves = getFlattenedRbacRolesMap(rawJson);

  const lines = ["permissionString\tdescription"];
  for (const [permissionString, description] of Array.from(leaves.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`${permissionString}\t${description.replace(/[\t\n\r]+/g, " ")}`);
  }
  return lines.join("\n");
}

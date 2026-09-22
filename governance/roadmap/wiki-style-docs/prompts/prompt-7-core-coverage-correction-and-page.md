# Reconcile core hub coverage and produce the createAccess pilot page

## Goal

Correct the small reproducibility gaps in the OSKAccessService inventory, then create one evidence-backed `createAccess` engineering page. Use one agent. Conserve ChatGPT Plus usage through local aggregation and bounded tool output, not arbitrary evidence truncation.

## Read first

- `governance/roadmap/wiki-style-docs/10-core-hub-retrieval-coverage-2026-09-22.md`
- `governance/roadmap/wiki-style-docs/core-hub-retrieval-coverage.sql`

Do not load the complete existing export into context. Inspect its structure locally as needed. For presentation only, inspect the structure/styles of `governance/roadmap/wiki-style-docs/pilot/building-create-non-app-user-with-access.html`; do not copy its factual content into the new page. No wider roadmap reading.

## Constraints

Local container `local-pgvector`, database `facts_index`, user `postgres`, host port 5433. Use read-only transactions and applicable sandbox permissions. Do not expose credentials or embedding arrays.

The snapshot predates recent sync/edge work. The user authorizes assuming near-100% completeness and resolved edges after a full sync. This is a working assumption, not a verified result. Evaluate retrieval and explanation; do not diagnose extraction defects or reject the wiki architecture from snapshot omissions. No syncs, edge rebuilds, project model/embedding API calls, subagents, commits, or database mutations.

## Stage A: repair and verify the coverage record

1. Extend the saved SQL to reproduce the candidate ranking and selected-service totals: owned facts, distinct incident edges, inbound external/outbound external/internal counts, distinct neighboring modules/repos, missing opposite endpoints, and resolution statuses. Keep missing endpoints through LEFT JOINs. State denominators for unassignable core facts; distinguish inherently non-class-owned kinds from ambiguous service ownership. Limit only displayed rankings, after calculating over all eligible candidates.
2. Check OSKAccessService ownership against its actual source-class declaration/file identity. Class-name matching alone can collide. Record the final predicate and ambiguous exclusions. If it changes prior counts, explain and correct them rather than preserving the old totals.
3. Record the actual run IDs, commit SHAs, extraction times, and edge generation times. Preserve source/target provenance for cross-repo relationships. Do not infer freshness from generation date alone.
4. Reconcile the createAccess declaration and owned call facts (previously reported as 44 rows), and its direct edges. Export all rows in the declared scope with complete non-embedding fact payloads, exact references, locations, and provenance. Save large data locally. Label the previous export as a selected-field export rather than full semantic evidence. Record row counts and inspect payload keys locally before choosing fields to send to the model.
5. Make one bounded attempt to resolve signature/request/return types using the declaration payload and available exact type/import identity. Do not match globally on bare type names. Record a justified mapping or an unresolved retrieval question; do not infer type absence from an unsuccessful lookup. No recursive type/helper investigation.
6. Update the 10 report with corrected measurements, reproducible query locations, and available/exported/model-reviewed counts. Check reconciliation before generating prose. If ownership/counts cannot be reconciled, stop with that concrete blocker rather than generating a misleading page.

## Stage B: one operation page

Read all selected operation facts in compact, meaningful batches: declaration, full relevant call expressions/arguments, and direct relationships. Keep exact references and identify any field truncation. Large helper internals and callers' implementations remain outside scope; do not claim that call facts prove execution order, conditional behavior, transaction semantics, or enforcement without supporting evidence. Source-line order alone is not proof of unconditional execution order. Do not treat linking to an existing row as sufficient support for a claim.

Write a useful explanation of createAccess: supported purpose, inputs/results where established, collaborators and side effects evidenced at the selected boundary, caller/dependency context, and explicit unknowns. Use only database evidence for this pilot. Mark documented business intent as unavailable rather than inventing persona policy. Distinguish facts not inspected, fields not represented in the export, and relationships not established in this snapshot.

Render one standalone file:
`governance/roadmap/wiki-style-docs/pilot/core-create-access.html`.

- Inline CSS; no network/runtime dependencies, packages, required JavaScript, or renderer framework.
- Short numbered citations link to explicit, unique internal evidence anchors. Put long references and wrapping source paths in the appendix, not the narrative.
- Include relevant evidence excerpts and snapshot provenance so the HTML works when copied alone. Do not invent source links.
- Complete operation-level direct relationship tables may be produced deterministically from local exports; the prose need not enumerate every caller. Clearly separate service-level aggregates from operation-level relationships.
- Use semantic headings, legible tables, responsive wrapping and visible focus. Keep investigation-process commentary in the report rather than the page.
- Verify internal anchors, file links if any, counts in generated tables, and factual support. Use a browser preview only if already readily available; otherwise disclose that visual rendering was not tested. Do not install browser tooling.

## Outputs and stop

Preserve earlier pilots. Save new complete evidence exports and supplemental queries under the existing `core-hub-retrieval-coverage/` folder with clear filenames; record their scope and row counts. Update the original SQL/report for reproducibility.

Write `governance/roadmap/wiki-style-docs/11-core-create-access-pilot-<date>.md`: corrected accounting, exported versus model-reviewed coverage, page path, checks actually performed, meaningful limitations, and whether this one hub operation supports a next generator-design step. Distinguish manually assembled output from a repeatable generator. Stop after this operation; no whole-core wiki or wider investigation.

Aim for combined tool output below 8,000 tokens, individual outputs below 1,500 tokens. These are context targets, not account guarantees. If meaningful review of the complete operation requires exceeding the target, save the reconciled evidence package and report the remaining review instead of silently dropping facts. Keep the final response short with links. The user will measure usage before and after.

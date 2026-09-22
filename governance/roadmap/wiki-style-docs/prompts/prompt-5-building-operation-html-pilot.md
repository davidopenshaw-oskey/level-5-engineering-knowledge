# Correct and render the building-operation wiki pilot

## Goal

Turn the existing enriched `createNonAppUserWithAccess` explanation into one readable, self-contained HTML page with reliable evidence links. This is a presentation pilot, not a general wiki generator or another research task. Use one agent and bounded output to conserve the user's ChatGPT Plus allowance.

## Inputs

Read only these files initially:
- `governance/roadmap/wiki-style-docs/08-building-operation-context-enrichment-2026-09-22.md`
- `governance/roadmap/wiki-style-docs/08-building-operation-context-evidence-2026-09-22.md`
- `governance/roadmap/wiki-style-docs/building-operation-context-evidence.sql`

Follow applicable repository instructions. Preserve unrelated changes and the original 07 baseline.

## Governing scope

The database is a historical snapshot with known sync/edge backlog. The user authorizes assuming near-100% completeness and resolved edges after full sync; this is a working assumption, not a measurement. Evaluate this page's explanatory value and presentation, not extraction completeness. Do not invent missing evidence or run sync, embeddings, edge rebuilds, or project model API calls.

## First: correct the reviewed content

1. Explicitly distinguish non-app access as an onboarding/access mechanism from business persona. The relevant persona passage states these are not personas themselves. Do not imply this operation creates every kind of non-app user.
2. Replace “proposed authority principle” with “documented authority principle.” Continue to distinguish documented policy from verified implementation enforcement.
3. Give the limitations paragraph direct citations for the permanent/non-one-time helper argument and the permanent-guest one-year limit. Read only the relevant persona lines and existing fact evidence. If exact argument support is absent from the saved evidence, use one targeted read-only query for fact `52b475756148816ba2cca3da396566a5fdaffc62` in container `local-pgvector`, database `facts_index`, user `postgres`. Do not launch a new investigation.
4. Check onward reference links: some reference headings use non-breaking spaces after Markdown heading markers, so their inferred anchors are unreliable. Avoid rewriting the shared architecture/persona files just to repair this pilot. Link to the existing reference file without an unreliable fragment, retain the exact heading and observed line range, and include a short supporting excerpt in the evidence entry. The HTML must use explicit internal anchors for those excerpts.
5. Update the 08 draft/evidence files with these small corrections. Preserve full fact references, source paths, and provenance in the evidence, never in narrative citation labels.

## Then: create the HTML page

Create `governance/roadmap/wiki-style-docs/pilot/building-create-non-app-user-with-access.html`.

- One static UTF-8 HTML file that opens directly with `file://`, with inline CSS, no build system, framework, CDN, external fonts, network requests, or required JavaScript. No package installation.
- Clear title, short purpose, compact navigation, contract/input/output information, evidenced operation sequence, documented business context, and evidence/limitations.
- Present the wiki content itself. Keep the investigator's comparison table and workflow commentary in the Markdown report, not the product page.
- Short numbered clickable citations link to explicit evidence anchors in the same HTML file. Each entry has a human-readable label, evidence type (implementation / relationship / documented intent), exact provenance, and a return link where useful. Long identifiers and paths wrap without horizontal overflow. Native `details` elements may collapse bulky evidence, but citation destinations must remain accessible without custom scripts.
- Include the relevant supporting document excerpts so the explanation and citations remain usable offline even when the HTML is copied alone. Optional relative links to repository reference documents are supplementary; compute them relative to the HTML file's `pilot/` location and verify targets. Never invent local source links when clones are unavailable.
- Identify the underlying code snapshot (commit, extraction date, staging) in a compact evidence metadata block. Do not portray the generation date as code freshness.
- Responsive, legible styling, visible focus states, semantic headings and tables. Use plain language and compact code formatting where helpful. No decorative features or model-generated graphics.
- A sequence list is sufficient; do not infer extra steps to fill a diagram.

## Validation and reporting

Verify internal citation targets, unique IDs, relative file targets, and absence of external runtime dependencies. Confirm every material factual statement has supporting evidence and uncertainty remains explicit. Check narrow-layout wrapping. Use an available browser preview if readily accessible; otherwise state that visual rendering was not independently tested. Do not install browser tooling for this pilot.

Save a short completion note as `governance/roadmap/wiki-style-docs/09-building-operation-html-pilot-<date>.md`: output path, corrections, checks actually performed, limitations, and the next decision. Explicitly distinguish a manually assembled presentation pilot from a repeatable automated generator.

No subagents, commits, wider roadmap reads, new API calls, source changes, or pipeline/database mutations. Aim for combined tool output below 5,000 tokens; save and inspect concise results. This is an output-volume target, not a hard account quota. Stop after this one page and provide clickable links to the page and completion note. The user will measure usage before and after.

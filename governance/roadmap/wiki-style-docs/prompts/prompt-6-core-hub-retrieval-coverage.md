# Test retrieval coverage for one Firebase core hub service

## Goal

Determine how to assemble complete, bounded wiki evidence for one highly connected service under `firebase-oskey-dev` / `core`. Measure structural scope and propose page boundaries. Do not write a whole-module narrative or build another renderer.

The small building-operation pilot demonstrated readable prose from selected facts, but arbitrary row limits and narrow selection predicates have not established coverage. For a hub, control cost through SQL aggregation, local artifacts, and page scope rather than silently discarding facts.

## Context and constraints

- The user is on ChatGPT Plus. Use one agent, no subagents or project model/embedding API calls. The user will measure usage before and after.
- Database: Docker container `local-pgvector`, database `facts_index`, user `postgres`, host port 5433. Follow applicable repository instructions and sandbox permissions. Use read-only transactions; no sync, rebuild, source changes, database mutations, or commits.
- The restored database is historical, with known sync/edge backlog. The user authorizes assuming near-100% completeness and resolved edges after full sync. That is a working assumption, not measured fact. Separate completeness within this snapshot from source-code/runtime completeness. Do not diagnose extraction defects from snapshot omissions.
- This prompt is self-contained. Do not load the wider roadmap, architecture documents, previous chat, or HTML pilot. Inspect database schema and representative payload keys only as needed to establish reliable ownership fields.

## 1. Select the service using measured connectivity

Enumerate core services/classes and their direct incident edges in SQL. Establish ownership from actual class/file/parent/caller fields, not symbol-name similarity alone. Record the exact ownership predicate and any unassignable facts. Do not group unrelated classes just because method names match.

Return a compact ranking of at most five candidates by distinct incident-edge count, with inbound/outbound counts, fact counts, distinct neighboring modules/repos, and unresolved endpoint counts. Compute the ranking over the entire relevant dataset before limiting the displayed candidates. Select one actual service with meaningful connectivity and explain the choice. If no defensible service boundary can be derived, report that specific problem rather than inventing a boundary.

## 2. Account for the whole selected direct neighborhood

For the selected service, count all owned facts and all direct incident edges, grouped by fact kind, method/operation, direction, connection type, resolution status, and neighboring module/repo. Distinguish inbound external, outbound external, and internal edges; count unique edge IDs once in overall totals and explain directional counts if internal edges occur in both.

Use LEFT JOINs where necessary to retain missing opposite endpoints. State that edges with neither endpoint attributable to the service cannot be counted by an incident-reference query. Preserve complete lists as local artifacts; do not send raw lists to the model. Enumerate all request/response type references supported by actual payloads without assuming type names are globally unique.

## 3. Define a coverage contract for future page generation

Choose one operation within the selected service as a worked retrieval boundary. Identify its declaration/contract where present, owned call facts, direct relationships, and referenced type facts where deterministically resolvable.

For each evidence category record: total matching rows; exported rows; model-inspected rows; exclusions; and unresolved ownership/type mappings. Distinguish complete export from complete model review. Include reverse caller relationships in the dependency inventory without recursively expanding all callers' implementations.

Do not claim method calls alone establish complete control flow: note whether conditions, permission enforcement, error behavior, and side effects are actually represented in the selected evidence. Helper internals are outside a one-hop boundary unless explicitly included; explain where that limits a future narrative.

Never use a global LIMIT to define factual coverage. Pagination/chunking may move all rows to disk, with stable unique ordering and reconciled totals. Deterministic aggregates may summarize all rows for display; raw samples may illustrate shape only and must be labeled as samples. If exhaustive processing is too large, retain the counts and report a batching plan rather than silently truncating or consuming unlimited context.

## 4. Propose the smallest useful hub page structure

Based on measurements, propose which content belongs in a service overview, per-operation pages, and complete inbound/outbound reference tables. Explain what is generated deterministically versus what requires model synthesis. Recommend one next generation experiment with a bounded evidence package and clear completion criteria. Do not generate that narrative yet.

## Deliverables

Under `governance/roadmap/wiki-style-docs/`, write:
- `10-core-hub-retrieval-coverage-<date>.md`: findings, selected service, exact scope/provenance, accounting tables, limitations, and page proposal. Aim for 800 words plus compact tables.
- `core-hub-retrieval-coverage.sql`: reproducible read-only SQL, including counts and selection predicates.
- Supporting complete exports in a clearly named local folder if needed; record paths, row counts, and reproducibility details in the report. Do not export embedding vectors or credentials. Do not place thousands of raw rows in the report.

Check counts reconcile within the declared scope. Retain unmatched items and explain them; do not use inner joins or display caps to make coverage look complete. Document any sampling separately.

Aim for combined tool output under 6,000 tokens and individual results under 1,500 tokens. This is a model-context target, not an account-usage guarantee. Use local scripts/SQL to aggregate large outputs. Stop after the coverage report and proposed next experiment; do not expand to all of core or other modules.

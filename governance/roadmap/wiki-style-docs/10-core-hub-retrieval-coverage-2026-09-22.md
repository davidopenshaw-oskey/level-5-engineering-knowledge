# Core hub retrieval coverage: OSKAccessService

## Scope and selection

Read-only PostgreSQL inventory of `firebase-oskey-dev` / `core`. A fact was
owned only when `payload.className` or `payload.callerClass` exactly matched a
core `source_class` service name. This avoids method-name similarity. Facts
without either matching field are unassignable; edges with neither endpoint in
owned fact references cannot be incident-counted.

| Service | Facts | Edges | In | Out | Internal | Neighbors | Unresolved |
|---|---:|---:|---:|---:|---:|---:|---:|
| OSKLoggingService | 27 | 868 | 868 | 0 | 0 | 11 | 0 |
| **OSKAccessService** | **125** | **68** | **31** | **37** | **0** | **9** | **0** |
| OSKPincodeService | 101 | 50 | 12 | 38 | 0 | 9 | 0 |
| OSKAccessUtilsService | 27 | 26 | 22 | 4 | 0 | 8 | 0 |
| OSKSecretService | 49 | 15 | 15 | 0 | 0 | 3 | 0 |

The ranking covered all eligible services before showing five. OSKAccessService
was selected over the logging utility because its balanced 31-inbound/37-
outbound neighborhood is an operational hub. The directional totals reconcile
to 68 unique edges because there are no internal edges.

## Whole neighborhood

The SQL exports all 125 owned facts, 68 unique direct incident edges, and 44
worked-operation rows to
`core-hub-retrieval-coverage/oskey-access-service-complete-export.txt`, in
stable `fact_ref`/`edge_id` order; it excludes embeddings. It retains missing
opposite endpoints via its incident predicate, although none were measured in
this snapshot. Snapshot completeness is not source or runtime completeness;
under the authorized full-sync assumption it is not a backlog diagnosis.

## Coverage contract: `createAccess`

`createAccess` is the largest named operation: 43 owned call facts plus one
service declaration, for **44 matching rows**. The declaration is at
`functions/src/modules/core/modules/access/services/access.service.ts:115`.
All 44 rows are exported—no global limit—and were compactly inspected as
deterministic summaries. The operation boundary comprises its declaration and
owned call facts; helper internals and callers’ implementations are excluded.
Reverse caller relationships remain in the complete service-edge export, but
are not recursively expanded.

| Category | Matching | Exported | Model review | Exclusions / uncertainty |
|---|---:|---:|---:|---|
| Owned service facts | 125 | 125 | aggregates | unassignable core facts |
| Direct incident edges | 68 | 68 | aggregates | no graph expansion |
| `createAccess` facts | 44 | 44 | summaries | helper internals |
| Contract/type facts | 0 contract facts | 0 | 0 | no deterministic type mapping |

Call facts establish collaborators, not complete control flow. Conditions,
permission enforcement, errors, and side effects need explicit facts or a
separately declared helper boundary. The declaration description names
`accessId` and nullable `pincodeId`; that is not a globally resolved type.

## Page proposal

Generate a service overview from deterministic ownership and complete
inbound/outbound tables. Generate per-operation pages from a declaration, all
owned call facts, direct edges, and deterministically resolved types. Use model
synthesis only for prose.

Next experiment: make a `createAccess` package from its 44 facts and direct
edges, reconcile counts before review, and accept a page only if every claim
links to an exported row and helper/condition/error gaps are explicit.

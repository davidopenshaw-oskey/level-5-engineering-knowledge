# Firebase `building` Postgres inventory

## Scope and database

This is a read-only inventory of `facts`, `cross_repo_edges`, and
`extraction_runs` for `firebase-oskey-dev` / `building`; it is not a semantic
audit or a claim that the database alone can produce a complete wiki.

Database identity: `facts_index`, user `postgres`, PostgreSQL 16.15. The
reproducible read-only queries are in `building-inventory.sql`.

## Measured inventory

There are **2,502 facts**, all with embeddings and all carrying a run ID. They
come from one current run, `20260911_080454-00e1d9fd`, on branch `staging`,
commit `00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, extracted 2026-09-11
08:06:19 UTC.

| Submodule | Facts |
|---|---:|
| `building_unit_nonAppUser` | 454 |
| `building_unit` | 449 |
| `building_intercom` | 390 |
| `building_door` | 286 |
| `building_settings` | 260 |
| no submodule | 246 |
| remaining five named submodules | 417 |

The dominant kinds are call expressions (1,003), model properties (432),
imports/dependencies (387), controller methods (172), type aliases (96), and
service methods (94). Smaller but useful evidence exists for API contracts
(38), permission candidates (21), permission errors (20), Firestore paths
(10), external hooks (4), Firestore triggers (2), and enums (2).

There are **641 distinct direct incident edges** (each counted once): 27
within `building`, 591 cross-module within the repository, and 23 cross-repo.
Of these, 637 resolve at both endpoints. The breakdown is 591 confirmed
`INTRA_REPO_CALL` cross-module edges, 27 confirmed within-module
`INTRA_REPO_CALL` edges, 19 resolved cross-repo `HTTP_API_CALL` edges, and 4
unresolved cross-repo `PUBSUB_TOPIC_BINDING` edges.

## Bounded samples

I sampled 12 facts: one earliest file/line example for each useful kind
(`api_contract`, controller/service method, model property, type alias,
permission candidate/error, import, source class, function declaration,
external hook, and Firestore trigger). The descriptions show, for example,
an activity API request/response, an `OSKBuildingAccess.accesses: OSKAccess[]`
property, `v1.org.buildings.view`, a permission-denied error, and an intercom
Pub/Sub environment-variable hook. Payload-key names include explicit
evidence/location/run fields and kind-specific fields such as request/response,
resolved target module, class/method, and resolution status. No full payloads
or embedding vectors were read.

I also sampled six direct edges, ordered cross-repo first. All six were
resolved HTTP calls into `building` from Swift Cloud Kit or the Angular app;
examples include `building-updateIntercomDisplayName` →
`updateIntercomDisplayName` and `building-getBuildingsByPropertyId` →
`getBuildingsByPropertyId`. This deliberately small sample does not represent
the within-repo calls or unresolved Pub/Sub bindings.

## Preliminary wiki evidence matrix

| Possible section | Evidence | Assessment |
|---|---|---|
| Module/submodule map | 2,502 facts across 10 named and one null submodule | strong inventory coverage |
| Interfaces | API contracts, controllers, service methods, HTTP edges | present; sampled only |
| Data structures | model properties, type aliases, source classes | present; sampled only |
| Permissions | candidates and errors | present but small |
| Dependencies | import facts and 591 cross-module calls | strong structural evidence |
| Cross-repo interactions | 19 resolved HTTP and 4 unresolved Pub/Sub edges | present, with a known gap |

Synthesis suitability is **provisionally promising for a structural wiki**:
the facts, provenance, embeddings, and direct edges support retrieval and
traceability. Semantic completeness, narrative accuracy, and whether Postgres
alone suffices remain unproven.

## Specific unresolved questions

1. What do the four unresolved Pub/Sub bindings connect to, and are they
important building behaviours?
2. Why do 246 facts lack a submodule; do they form module-level material or
classification debt?
3. Do the fact descriptions/payloads preserve enough detail for permissions,
request/response semantics, and lifecycle documentation without source review?

Smallest worthwhile next check: inspect only the four unresolved Pub/Sub edge
records and their bounded endpoint/provenance fields.

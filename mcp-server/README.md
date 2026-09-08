# facts-corpus-server

Generic MCP tool layer over the facts-postgres-index corpus, per `governance/adrs/adr-007.md` and `governance/roadmap/mcp-direction/01-mcp-tool-server-tasklist.md`.

Moved to the repo root 2026-09-07 (`governance/roadmap/mcp-direction/21-task1-mcp-server-repo-root-move-2026-09-07.md`) so it isn't nested inside one specific pipeline's folder — `pipeline/facts-postgres-index/` is triggered separately (on merge-to-prod/staging, for AST extraction), while this server just answers tool calls, and the two may end up deployed independently.

Wraps three MCP tools (`search_facts`, `get_graph_neighbors`, `walk_cluster`) around `db/search.ts` and `db/graph-traversal.ts` — no task-specific logic lives here; that belongs in agent personas (Step 5 of the tasklist). `db/` is a deliberate, standalone copy of `pipeline/facts-postgres-index/_shared/search.ts` and `graph-traversal.ts`, not an import — see the header comment in `db/search.ts` for why, and check both copies when fixing a bug in either.

## Tools

- `search_facts(query, limit?)` — vector search over the fact index.
- `get_graph_neighbors(factIds)` — direct graph neighbors of one or more anchor facts.
- `walk_cluster(anchorFactId, maxDepth?, maxFacts?)` — bounded multi-hop graph walk from one anchor.

## Local development

Runs over stdio, against the existing local Postgres (`docker-compose up` in `pipeline/facts-postgres-index/`) — no separate container or deployment needed:

```bash
node -r ts-node/register mcp-server/src/index.ts
```

Remote (Cloud Run, HTTP transport) deployment is Step 3 of the tasklist — not built yet.

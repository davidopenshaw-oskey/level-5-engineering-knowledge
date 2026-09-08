# facts-corpus-server

Generic MCP tool layer over the facts-postgres-index corpus, per `governance/adrs/adr-007.md` and `governance/roadmap/mcp-direction/01-mcp-tool-server-tasklist.md`.

Wraps the existing, already-tested `_shared/search.ts` and `_shared/graph-traversal.ts` primitives as three MCP tools — no task-specific logic lives here. Task-specific behavior belongs in agent personas (Step 5 of the tasklist), not in this server.

## Tools

- `search_facts(query, limit?)` — vector search over the fact index.
- `get_graph_neighbors(factIds)` — direct graph neighbors of one or more anchor facts.
- `walk_cluster(anchorFactId, maxDepth?, maxFacts?)` — bounded multi-hop graph walk from one anchor.

## Local development

Runs over stdio, against the existing local Postgres (`docker-compose up` in `pipeline/facts-postgres-index/`) — no separate container or deployment needed:

```bash
node -r ts-node/register pipeline/facts-postgres-index/mcp-server/src/index.ts
```

Remote (Cloud Run, HTTP transport) deployment is Step 3 of the tasklist — not built yet.

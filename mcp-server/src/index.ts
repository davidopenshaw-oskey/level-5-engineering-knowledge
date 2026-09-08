import { genkit, z } from "genkit";
import { createMcpServer } from "@genkit-ai/mcp";
import { Pool } from "pg";
import { search } from "../db/search";
import { expandWithGraphNeighbors, walkBoundedCluster } from "../db/graph-traversal";

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

const ai = genkit({});

ai.defineTool(
  {
    name: "search_facts",
    description: "Search the codebase's fact index for real, code-derived evidence relevant to a question. Returns ranked candidate facts with real fact_ids.",
    inputSchema: z.object({ query: z.string(), limit: z.number().optional() }),
  },
  async ({ query, limit }) => search(query, limit)
);

ai.defineTool(
  {
    name: "get_graph_neighbors",
    description: "Given real fact_ids (anchors), find their direct graph neighbors via cross_repo_edges (calls, API bindings, field bindings).",
    inputSchema: z.object({ factIds: z.array(z.string()) }),
  },
  async ({ factIds }) => {
    const db = pool();
    try {
      const anchorNumbers = new Map(factIds.map((id, i) => [id, i + 1]));
      return await expandWithGraphNeighbors(db, factIds, anchorNumbers);
    } finally {
      await db.end();
    }
  }
);

ai.defineTool(
  {
    name: "walk_cluster",
    description: "Bounded multi-hop graph walk outward from one real starting fact_id.",
    inputSchema: z.object({ anchorFactId: z.string(), maxDepth: z.number().optional(), maxFacts: z.number().optional() }),
  },
  async ({ anchorFactId, maxDepth, maxFacts }) => {
    const db = pool();
    try {
      return await walkBoundedCluster(db, anchorFactId, { maxDepth, maxFacts });
    } finally {
      await db.end();
    }
  }
);

const server = createMcpServer(ai, { name: "facts-corpus-server", version: "0.1.0" });
server.start();

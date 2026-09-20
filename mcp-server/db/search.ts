// **version:** 2.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Deliberate fork of pipeline/facts-postgres-index/_shared/search.ts, not an
// import, as of the 2026-09-07 mcp-server/ repo-root move (governance/
// roadmap/mcp-direction/21-task1-mcp-server-repo-root-move-2026-09-07.md).
// mcp-server/ and the facts-postgres-index pipeline may end up deployed and
// triggered separately (pipeline runs on merge-to-prod/staging for AST
// extraction; mcp-server just serves tool calls) -- a real import coupling
// across that boundary was rejected on purpose, so this copy can drift on
// its own. If you fix a bug here, check whether the pipeline's copy needs
// the same fix; they are not kept in sync automatically.
//
// Real, reusable search function -- pure vector search plus an honest
// confidence check. Deliberately does NOT combine in a keyword/full-text
// signal -- that was tried (v1.0.0, governance/roadmap/facts-serving-
// strategy/09-p2-build-tasklist.md tasks 8-9), tested against all four real
// example queries used that day, and found to add nothing: it never once
// contributed the actual best result, it caused a real regression on one
// query (pushed `cancelTask` out of the top 5 in favour of weaker matches
// that only shared the common word "cancel"), and added irrelevant noise on
// the other three. Reverted rather than kept "just in case" -- real,
// negative evidence across every case tested, not a theoretical concern.
//
// What's kept: pure vector search (shown working across every real example
// tested that day except one), plus the confidence check, which independently
// proved itself by correctly flagging that one weak case honestly rather
// than presenting a confident-looking but wrong answer.

import { Pool } from "pg";
import { embedSearchQuery } from "./embedding-adapter";
import { traceQuery } from "./query-trace";

// Raised from 10 to 25, 2026-09-05, on real measured evidence, not a guess:
// governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-
// angular-ux-facts.md's retrieval-anchor-gap investigation found a real
// target fact ranked #22 for the real Q1a query (post the same day's
// model_property description fix) -- just outside the old limit of 10.
// Checked the marginal facts a k=30 test would add (ranks 11-30): almost
// entirely genuinely on-topic for that query, not noise. A second real
// query (Q1b) needed rank #96 to catch its own target -- tested and
// rejected raising the limit that far, since the added evidence broadens
// substantially (call_expression/imports_dependency counts roughly triple)
// without being cleanly on-topic the way the k=30 case was. 25 is a real,
// deliberate compromise: closes the one case with clean marginal evidence,
// stops short of the point where evidence volume/noise measurably worsens.
// Does NOT fix the deeper Q1b-shaped gap -- that's the real, separate case
// for workflow clusters (same doc, Task 1), not something a global limit
// bump alone can close.
//
// Kept as the default, 2026-09-06, when search() gained an optional `limit`
// param (adr-007.md): this constant was itself the example of the
// example-tuned anti-pattern the ADR exists to move away from -- a single
// global value can't serve both Q1a (needed ~25-30) and Q1b (needed ~96)
// well at once. The fix isn't a new constant, it's letting the caller (an
// agent, reasoning about how broad a given question is) decide -- this
// value now only matters as the default for a caller that doesn't.
const DEFAULT_RESULT_LIMIT = 25;

// Calibrated 2026-09-02 against this session's own real, measured cases --
// not guessed. The confident case (query: "how do I cancel a scheduled
// background job", real match: cancelTask) landed around 0.75. The
// unconfident case (query: the "owner" question, real match:
// OSKBuildingUnitInhabitantType at rank 319) never had a top result better
// than ~0.78, with no real separation from the rest of the list. This sits
// between the two, closer to the confident case -- revisit with more real
// examples before trusting it far from that boundary.
const VECTOR_DISTANCE_CONFIDENCE_THRESHOLD = 0.76;

export interface SearchResult {
  factRef: string;
  repo: string;
  module: string;
  kind: string;
  symbolName: string | null;
  description: string;
  vectorDistance: number;
}

export interface SearchResponse {
  confident: boolean;
  results: SearchResult[];
  // Present only when confident is false -- a real, honest message to show
  // instead of presenting a list of mediocre guesses as if they were a real
  // answer.
  lowConfidenceMessage?: string;
  // Present only when a caller opts in via `opts.crossModuleMargin` (moduleFilter
  // must also be set) -- see the `search()` doc comment below for the real
  // reasoning (governance/roadmap/dynamic-pipeline-architecture/09-findings-
  // duplicate-search-queries-capability-fanout-2026-09-20.md and 10-build-plan-
  // duplicate-search-queries-fix-2026-09-20.md).
  betterMatchOutsideModule?: { module: string; distance: number } | null;
}

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

// moduleFilter: optional, added 2026-09-11 for capability-fanout generation
// (governance/roadmap/graphrag/06-prompt-9-capability-fanout-merge-design-
// 2026-09-11.md) -- restricts vector search to one real `module` value,
// letting a per-capability synthesis call discover its own evidence rather
// than sharing one global top-k with every other capability in the same
// run. Undefined (the default) preserves the exact prior behavior for every
// existing caller.
//
// opts.crossModuleMargin: optional, added 2026-09-20 (governance/roadmap/
// dynamic-pipeline-architecture/09-findings-duplicate-search-queries-
// capability-fanout-2026-09-20.md, 10-build-plan-duplicate-search-queries-
// fix-2026-09-20.md) -- real root cause found there: a module-scoped
// capability call has no way to tell "this concept doesn't exist" apart
// from "this concept exists, just in a different module", so the model
// kept re-rephrasing a query whose target fact structurally lived outside
// its assigned module. Only takes effect when `moduleFilter` is also set.
// Deliberately reuses the SAME already-computed `embedding` for a second,
// cheap, Postgres-only query rather than calling embedSearchQuery() again --
// a second real Vertex embedding call per search_facts invocation was
// evaluated and rejected as a real, silently-doubled cost against this
// project's confirmed 5 req/min embedding quota (10-...md, decision 2).
// undefined (the default) costs nothing extra and preserves prior behavior
// for every existing caller (atomic-prd-agent.ts's tools, routeCapabilities()'s
// own unfiltered Step 1 call).
export async function search(
  query: string,
  limit?: number,
  moduleFilter?: string,
  opts?: { crossModuleMargin?: number }
): Promise<SearchResponse> {
  const db = pool();
  try {
    const { embedding } = await embedSearchQuery(query);

    const sql = moduleFilter
      ? `SELECT fact_ref, repo, module, kind, symbol_name, description, embedding <-> $1::vector AS distance
           FROM facts WHERE embedding IS NOT NULL AND module = $3
           ORDER BY distance LIMIT $2`
      : `SELECT fact_ref, repo, module, kind, symbol_name, description, embedding <-> $1::vector AS distance
           FROM facts WHERE embedding IS NOT NULL
           ORDER BY distance LIMIT $2`;
    const params = moduleFilter
      ? [`[${embedding.join(",")}]`, limit ?? DEFAULT_RESULT_LIMIT, moduleFilter]
      : [`[${embedding.join(",")}]`, limit ?? DEFAULT_RESULT_LIMIT];
    const vectorRows = await db.query(sql, params);
    traceQuery(sql, params, vectorRows.rows);

    const results: SearchResult[] = vectorRows.rows.map(row => ({
      factRef: row.fact_ref, repo: row.repo, module: row.module, kind: row.kind,
      symbolName: row.symbol_name, description: row.description, vectorDistance: row.distance,
    }));

    const confident = (results[0]?.vectorDistance ?? Infinity) <= VECTOR_DISTANCE_CONFIDENCE_THRESHOLD;

    let betterMatchOutsideModule: SearchResponse["betterMatchOutsideModule"] = undefined;
    if (moduleFilter && opts?.crossModuleMargin !== undefined) {
      const crossModuleSql = `SELECT module, embedding <-> $1::vector AS distance
           FROM facts WHERE embedding IS NOT NULL AND module != $2
           ORDER BY distance LIMIT 1`;
      const crossModuleParams = [`[${embedding.join(",")}]`, moduleFilter];
      const crossModuleRows = await db.query(crossModuleSql, crossModuleParams);
      traceQuery(crossModuleSql, crossModuleParams, crossModuleRows.rows);
      const bestOutside = crossModuleRows.rows[0];
      const bestInModule = results[0]?.vectorDistance ?? Infinity;
      if (bestOutside && bestInModule - bestOutside.distance >= opts.crossModuleMargin) {
        betterMatchOutsideModule = { module: bestOutside.module, distance: bestOutside.distance };
      }
    }

    return confident
      ? { confident: true, results, betterMatchOutsideModule }
      : {
          confident: false,
          results,
          lowConfidenceMessage:
            "No strong match found for this question. Try rephrasing, or naming the specific module/feature you're asking about.",
          betterMatchOutsideModule,
        };
  } finally {
    await db.end();
  }
}

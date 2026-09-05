// **version:** 2.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
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
const RESULT_LIMIT = 25;

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
  factId: string;
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

export async function search(query: string): Promise<SearchResponse> {
  const db = pool();
  try {
    const { embedding } = await embedSearchQuery(query);

    const vectorRows = await db.query(
      `SELECT fact_id, repo, module, kind, symbol_name, description, embedding <-> $1::vector AS distance
       FROM facts WHERE embedding IS NOT NULL
       ORDER BY distance LIMIT $2`,
      [`[${embedding.join(",")}]`, RESULT_LIMIT]
    );

    const results: SearchResult[] = vectorRows.rows.map(row => ({
      factId: row.fact_id, repo: row.repo, module: row.module, kind: row.kind,
      symbolName: row.symbol_name, description: row.description, vectorDistance: row.distance,
    }));

    const confident = (results[0]?.vectorDistance ?? Infinity) <= VECTOR_DISTANCE_CONFIDENCE_THRESHOLD;

    return confident
      ? { confident: true, results }
      : {
          confident: false,
          results,
          lowConfidenceMessage:
            "No strong match found for this question. Try rephrasing, or naming the specific module/feature you're asking about.",
        };
  } finally {
    await db.end();
  }
}

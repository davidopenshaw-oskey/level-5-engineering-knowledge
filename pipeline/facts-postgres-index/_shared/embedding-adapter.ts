// **version:** 1.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Standalone embedding client for the P2 Postgres/pgvector facts index.
// Deliberately NOT part of, or imported by, pipeline/*/phase-02-inter-
// module-synthesis/_shared/llm-adapter.ts -- per the 2026-09-02 scope
// agreement (governance/roadmap/facts-serving-strategy/09-p2-build-
// tasklist.md), the existing Phase 2 LLM-synthesis code is not to be
// touched while this work is underway, even by extension. This file uses
// the same @google/genai library and the same Vertex AI (Enterprise Agent
// Platform) connection pattern already proven in llm-adapter.ts's
// callGemini, but is a fully independent module.
//
// Model: gemini-embedding-2 -- confirmed 2026-09-02 via the real, current
// Vertex AI model catalog (ai.models.list()), not assumed from memory.
// Real, verified constraints (Google's own docs, ai.google.dev/gemini-api/
// docs/embeddings, fetched directly):
//   - Max 8,192 input tokens per item (irrelevant here -- fact descriptions
//     are ~25 tokens on average, measured against real loaded data).
//   - Output is 3072-dim by default, truncatable to 768/1536/3072 (Google's
//     own recommended sizes) via `outputDimensionality`. This project uses
//     768 (see schema-proposal.sql's own comment on that choice).
//   - No `taskType` config parameter is honored by this model (unlike the
//     older gemini-embedding-001) -- the SDK's EmbedContentConfig.taskType
//     field still exists in the type surface (it's shared across every
//     embedding-capable model @google/genai supports), but gemini-
//     embedding-2 specifically ignores it. The task instruction must be
//     baked into the text itself instead, per Google's own documented
//     format -- confirmed by fetching that doc directly, not guessed:
//       - Document side (what's being indexed): "title: {title} | text: {content}"
//         (title: none if there's no natural title)
//       - Query side (what's being searched for): "task: search result | query: {content}"
//     Getting this backwards, or using the same framing for both sides,
//     measurably hurts retrieval quality -- this is not cosmetic.

import { GoogleGenAI } from "@google/genai";

// Same project/region already proven working for real Gemini generation
// calls in this codebase (config/llm-providers.json's gemini-default entry)
// -- not read from that file, since this module is deliberately standalone,
// but the same real, confirmed-working values.
const PROJECT_ID = "test-ai-oskey-io";
const LOCATION = "global";
const MODEL = "gemini-embedding-2";
const OUTPUT_DIMENSIONALITY = 768;

export interface EmbeddingInput {
  // Stable identifier the caller uses to match a returned embedding back to
  // its source row -- NOT sent to the API, just carried through so batch
  // order never has to be trusted blindly.
  id: string;
  text: string;
}

export interface EmbeddingResult {
  id: string;
  embedding: number[];
  // Real, per-item usage as reported by the provider -- not estimated.
  // tokenCount/truncated come from ContentEmbedding.statistics; absent
  // (undefined) if the provider didn't report them for this item, which
  // is a real, worth-noticing gap, not treated as zero.
  tokenCount?: number;
  truncated?: boolean;
}

export interface EmbeddingBatchUsage {
  // Whole-request total from EmbedContentResponse.metadata.
  // billableCharacterCount -- the actual, real basis for billing per
  // Google's own field name, not a token-count estimate.
  billableCharacterCount?: number;
}

export interface EmbeddingCallResult {
  results: EmbeddingResult[];
  usage: EmbeddingBatchUsage;
}

/** Embeds a batch of FACTS (documents being indexed, not search queries) --
 * uses the document-side "title: ... | text: ..." framing. `title` should
 * be the fact's own symbol_name where available (schema-proposal.sql
 * already carries this as its own column for exactly this purpose);
 * "title: none" per Google's own documented convention when there isn't
 * one. Never mix this with embedFactQuery's framing for the two sides of
 * one retrieval pair -- confirmed real, not a style preference. */
export async function embedFactDocuments(
  inputs: Array<EmbeddingInput & { title?: string | null }>
): Promise<EmbeddingCallResult> {
  const prefixed = inputs.map(i => `title: ${i.title ?? "none"} | text: ${i.text}`);
  return callEmbedContent(inputs.map(i => i.id), prefixed);
}

/** Embeds a search QUERY (what a person or agent types when looking for
 * relevant facts) -- uses the query-side "task: search result | query: ..."
 * framing, matching the retrieval task type. Must be embedded with the
 * SAME model and dimensionality as embedFactDocuments, or the vectors are
 * not comparable at all. */
export async function embedSearchQuery(query: string): Promise<{ embedding: number[]; usage: EmbeddingBatchUsage }> {
  const { results, usage } = await callEmbedContent(["query"], [`task: search result | query: ${query}`]);
  return { embedding: results[0].embedding, usage };
}

// Confirmed real, not assumed: gemini-embedding-2 does NOT batch multiple
// texts into one call the way the SDK's own generic embedContent example
// implies (that example is written for the older text-embedding-004).
// Tested directly against this exact model/endpoint with the SDK's own
// documented example shape verbatim -- `contents: ["What is your name?",
// "What is your favorite color?"]` -- and got back exactly 1 embedding for
// 2 inputs, both in the real 70-fact `tasks` sync (1 vector for 70 inputs)
// and in a minimal 2-string diagnostic call run specifically to isolate
// the cause. So: one embedContent call per text, run with bounded
// concurrency (not fully sequential, not fully parallel) since there is
// no working server-side batch path to lean on instead.
const CONCURRENCY = 10;

async function callEmbedContent(ids: string[], texts: string[]): Promise<EmbeddingCallResult> {
  if (ids.length !== texts.length) {
    throw new Error(`[Fail-Closed] ids/texts length mismatch (${ids.length} vs ${texts.length}) -- cannot safely match results back to callers.`);
  }
  if (texts.length === 0) return { results: [], usage: {} };

  const ai = new GoogleGenAI({ enterprise: true, project: PROJECT_ID, location: LOCATION });

  const embedOne = async (id: string, text: string): Promise<EmbeddingResult & { billableCharacterCount?: number }> => {
    const response = await ai.models.embedContent({
      model: MODEL,
      contents: [text],
      config: { outputDimensionality: OUTPUT_DIMENSIONALITY },
    });
    const embedding = response.embeddings?.[0];
    const values = embedding?.values;
    if (!values || values.length !== OUTPUT_DIMENSIONALITY) {
      throw new Error(`[LLM_CALL_FAILED] Embedding for '${id}' has ${values?.length ?? 0} dimensions, expected ${OUTPUT_DIMENSIONALITY}.`);
    }
    return {
      id,
      embedding: values,
      tokenCount: embedding?.statistics?.tokenCount,
      truncated: embedding?.statistics?.truncated,
      billableCharacterCount: response.metadata?.billableCharacterCount,
    };
  };

  const results: Array<EmbeddingResult & { billableCharacterCount?: number }> = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const slice = await Promise.all(ids.slice(i, i + CONCURRENCY).map((id, j) => embedOne(id, texts[i + j])));
    results.push(...slice);
  }

  // Per-call metadata isn't reported reliably for every request (confirmed
  // real: the 2-string diagnostic call returned metadata: undefined) --
  // summed only over calls that actually reported it, not defaulted to 0,
  // so a genuinely missing value is never silently confused with a real
  // zero-cost call.
  const reportedCounts = results.map(r => r.billableCharacterCount).filter((c): c is number => c !== undefined);
  const billableCharacterCount = reportedCounts.length > 0 ? reportedCounts.reduce((a, b) => a + b, 0) : undefined;

  return { results, usage: { billableCharacterCount } };
}

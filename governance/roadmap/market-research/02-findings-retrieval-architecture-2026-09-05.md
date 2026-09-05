# Retrieval Architecture Findings — Two Real Hybrid-Retrieval Experiments, and What 2026 Production Systems Actually Do

**Date:** 2026-09-05. **Method:** Two real, quantified experiments run against this project's own live Postgres/pgvector index and its two known real targets (Q1a/Q1b, per `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md`), followed by live web research (WebSearch/WebFetch) once both experiments came back negative/mixed. Every claim below either comes from a real number produced against this project's own data, or is cited to a real, dated 2026 source.

## Why this exists

The first market-research pass (`01-findings-2026-09-05.md`, angle 1) suggested a hybrid BM25+vector retrieval channel as a concrete next experiment, based on real 2026 papers reporting gains from adding a sparse/lexical channel alongside dense embeddings. Two real, honest attempts to build that were run in this session. Both came back negative or mixed — real, quantified failures, not assumed successes glossed over. Per this project's own established discipline, two independent real negative results are strong enough signal to question the underlying hypothesis rather than keep re-tuning parameters — this doc is that deeper investigation.

## Experiment 1: word-token, BM25-style hybrid (Postgres `tsvector` + Reciprocal Rank Fusion)

**Built:** a generated `description_tsv` column on `facts` (GIN-indexed), lexical ranking via `ts_rank_cd`, combined with the existing vector rank using RRF (k=60, the standard default).

**Real result:** Q1a's `backendField` target went from vector-only rank **#24** to RRF-combined rank **#189** — measurably worse, not better. Q1b was mixed (one target improved, the other worsened).

**Root cause, confirmed directly, not guessed:** a naive OR-query built from every non-stopword word in the long, natural-language PM paragraph gets polluted by generic-but-not-stopword English words ("system," "report," "existing," "add") that coincidentally overlap with unrelated code literals. Concrete, damning example found in the real output: a completely irrelevant Joi validation schema (`Joi.object({ meteo: ..., branding: ... })`) ranked **#1** on the lexical channel for Q1b, purely because it shares words like "optional"/"required"/"string" with the query.

## Experiment 2: character-trigram hybrid (`pg_trgm` against `symbol_name`)

**Built:** reused this schema's existing (previously unused for retrieval) `facts_symbol_trgm_idx`. Two versions run:

1. **Vector-pool-only** (trgm re-scores only the top-300 vector candidates): Q1a `backendField` improved to **#21**; Q1b `backendField` to **#77**. But `angularControl` — the other real target, whose vector rank is #313 — was excluded from consideration entirely, since it never entered the top-300 vector pool in the first place. Checked this directly: `angularControl`'s **pure-trgm rank against the whole table is #43**, far better than its vector rank, but the vector-pool-only design gave it no chance to be reconsidered.
2. **Proper union pool** (top-K from *each* channel, corrected once the above gap was found): real result was **worse across the board** — Q1a `backendField` fell to #35, Q1b `backendField` to #92. Root cause, same pattern as Experiment 1: matching all 32 extracted query keywords (not just discriminating ones) against the whole table via `pg_trgm`'s permissive default threshold let generic short words spuriously match unrelated symbol names — concrete example: an `angular_route` literally named `"add"` scored a perfect trgm similarity of 1.000 against the query keyword "add."

## Honest conclusion from both experiments

Two independent, real lexical mechanisms — word-token and character-trigram — failed the identical way: naively using every content word from a long natural-language paragraph as the lexical query introduces real, measurable pollution, regardless of which lexical algorithm is used. **The fix is not a better lexical algorithm.** Both failures point at the same missing piece: query *understanding* (deciding which terms actually carry discriminating signal) before any lexical matching happens at all — not something either experiment attempted, and a materially different, bigger kind of fix than swapping fusion formulas.

## Broader research: how 2026 production systems actually solve this class of problem

**Claude Code itself — the tool this whole project runs inside — abandoned embeddings-based RAG entirely.** Early versions used RAG + a local vector database; Anthropic's own team found pure agentic search (iterative `grep`/`glob`/`read` at runtime, no index, no embeddings) "outperformed everything by a lot." Stated reasons map directly onto this project's own findings: **precision** ("grep finds exact matches; embeddings introduce fuzzy false positives" — this project's own near-duplicate-fact problem, independently discovered) and **freshness** ("a pre-built index drifts from code during active development" — the exact staleness concern behind the still-unsketched Task 2) ([Zain on X](https://x.com/ZainHasan6/status/2017842572325228652); [Vadim's blog](https://vadim.blog/claude-code-no-indexing/); [SmartScope](https://smartscope.blog/en/ai-development/practices/rag-debate-agentic-search-code-exploration/)).

**Sourcegraph's Zoekt is a different problem, not directly transferable.** A trigram-indexed engine for literal/regex substring search over raw source text at massive scale (sub-second across billions of lines) — built for a developer typing an exact query, not for ranking a long natural-language paragraph against short technical fact descriptions ([sourcegraph/zoekt](https://github.com/sourcegraph/zoekt); [zoekt design doc](https://github.com/sourcegraph/zoekt/blob/main/doc/design.md)).

**Augment Code's Context Engine does real query understanding before retrieval.** A request like "add logging to payment requests" gets mapped to a full cross-service path (React app → Node API → payment service → database → webhook handlers) *before* anything is searched — implying a real decomposition/understanding step ahead of retrieval, not a single fused ranking pass ([augmentcode.com/context-engine](https://www.augmentcode.com/context-engine)).

**Cursor and Windsurf both combine embeddings with agentic iteration, never relying on a single fused score.** Cursor: "semantic index combined with file search, grep and agentic exploration." Windsurf: "Fast Context," a "specialised retrieval subagent" ([Windsurf vs Cursor 2026 comparisons, multiple sources]).

**GitHub Copilot's coding agent, with real production telemetry, confirms iteration dominates in practice, not just in theory.** A Microsoft Research paper characterizing Copilot "at production scale" (arXiv 2608.00101) found **30.5% of all real sessions are "Deep-loop read"** — extended exploration with repeated file retrieval, symbol lookup, and repository navigation, averaging **9 LLM calls and 7 tool batches per session**. Real, measured usage data, not a vendor claim ([arxiv.org/html/2608.00101v1](https://arxiv.org/html/2608.00101v1)).

**The general 2026 consensus on agentic vs. single-shot retrieval explains why both experiments failed the same way:** "single-step retrieval can't decompose complex questions, can't adapt its search strategy if results are insufficient, and has no mechanism to handle ambiguous terms — a single query has no way to disambiguate and search accordingly" ([Mixpeek guide](https://mixpeek.com/guides/agentic-retrieval-how-agents-search-differently); [Azure AI Search docs](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview)).

**The standard production fix for exactly this shape of problem is a stage this project doesn't have at all: retrieve-then-rerank, with real, quantified gains:**
- "Retrieve broadly with cheap geometry, then rerank narrowly with expensive understanding... maximize retrieval recall by retrieving plenty of documents and then minimize the number that make it to the LLM" ([Pinecone, Rerankers and Two-Stage Retrieval](https://www.pinecone.io/learn/series/rag/rerankers/)).
- Databricks: reranking improves retrieval quality by up to 48%. On the BRIGHT Biology benchmark, reranking pushed nDCG@10 from **0.13 to 0.40 — a 3x improvement from reordering the exact same candidate set**, no new retrieval at all ([ZeroEntropy reranking guide](https://zeroentropy.dev/articles/ultimate-guide-to-choosing-the-best-reranking-model-in-2025/)). This is close to a direct description of this project's own situation: the right fact is often already sitting in the candidate pool (rank #24, #91, #96) — the problem is ranking, not absence.
- Code-specific reranking (SRank) adds 3.6-8.8 points pass@1 on HumanEval ([arXiv 2311.03366](https://arxiv.org/pdf/2311.03366)).
- Real production latency cost: **31.3ms overhead against ~10,000ms total end-to-end latency (0.3%)** — reranking is close to free in practice, de-risking the "too slow/expensive" objection directly ([Redis reranking blog](https://redis.io/blog/top-reranking-models-rag-accuracy/)).

## Future direction — genuinely harder to find, as expected, but real signal surfaced

- **"Code World Models"**: an emerging research direction modeling code's *executable, stateful* behavior — a learned transition function between program states — rather than treating code as static text/structure. Materially deeper than AST-fact extraction; clearly research-stage, not close to productized ([survey, arXiv 2606.23690](https://arxiv.org/pdf/2606.23690)).
- **A comprehensive position paper synthesizing Anthropic, OpenAI, Google DeepMind, Microsoft Research, and academia** (arXiv 2604.26275) proposes a "six-layer reference architecture for agentic software engineering systems" and documents SWE-bench Verified rising from 1.96% to 78.4% between October 2023 and April 2026. The most authoritative single synthesis found this session — worth a full read, not just this summary, before any large architecture decision.
- **A real, first-party signal directly relevant to this project's own tooling:** "Claude Opus 4.8 introduced dynamic workflows that allow Claude Code to run hundreds of parallel subagents on large software projects... Anthropic is building Claude around reliable long-running professional work" — reinforcing "many targeted parallel searches" as the direction this project's own vendor is already shipping, not a hypothetical.
- Programming-knowledge-graph research modeling "versioned changes as entities" ([arXiv 2601.20810](https://arxiv.org/pdf/2601.20810)) — a direct hit on this project's own staleness/Task 2 concern, though still academic-stage.

## The real reframe

This project's retrieval gap was never really "vector vs. lexical, or how to fuse them" — both real experiments tuning that layer failed. The actual gap is two missing **stages**, not a missing signal:

1. **No query decomposition/understanding before retrieval.** The real PM paragraph is handed to `search()` whole, as one query, every time — never decomposed into its real salient entities, never allowed to trigger more than one targeted lookup.
2. **No reranking stage between broad retrieval and final synthesis.** `search()`'s top-25 cut is currently both the recall cut *and* the final precision cut, done in one step by cosine distance alone. Every production system and paper found this session that reports real gains does this as two separate stages — retrieve broad and cheap, then rerank narrow with real judgment — never as one fused score.

## What this means for next steps

Two concrete architectural additions, both backed by real, converging, quantified 2026 evidence, not speculation:

- **(a) A query decomposition/understanding step** (LLM-assisted) before `search()` — extract the real salient entities/terms from a PM's paragraph, rather than handing the whole thing to any retrieval mechanism as-is. Directly addresses the root cause found in both real experiments.
- **(b) A reranking stage** — retrieve a larger, cheap candidate pool (top 100-300 by vector, already effectively free), then have a bounded LLM call (or dedicated reranker) judge real relevance against the actual query, keeping only the true best ~10-25 for the expensive Layer 3 synthesis call. This is the industry-standard two-stage pattern, with real, quantified gains (up to 3x on a comparable benchmark) and near-zero latency cost.

Neither has been built or tested yet — this doc is findings only. Test design is a separate, following discussion.

## Test 1 result, 2026-09-05: LLM reranking over vector top-150, real and decisive on the harder case

Built and run for real: vector top-150 candidates per query, one bounded LLM call (gemini-3.5-flash, same production convention as `technical-proposal.ts`) asked to select and rank the top 15 most relevant, each with a one-line grounded reason, fabrication-checked against the real candidate numbers (same discipline as `validateLayer3Response`).

- **Q1b: real, decisive positive result.** `backendField` (vector rank #91 within the 150-pool) reached reranked position **#10**. Re-running `expandWithGraphNeighbors` from that reranked anchor set surfaced `angularControl` — **the first time in this entire investigation Q1b's evidence has included the Angular UI surface at all.** This is the harder, previously fully-open gap (Q1a had already been partially closed by the `RESULT_LIMIT` increase; Q1b had not moved at all until this test).
- **Q1a: real, honest non-improvement.** `backendField` (vector rank #24) did not make the reranked top-15. The LLM instead selected a broad sweep of nearly every `TypeName.inhabitantType` variant across the codebase — a defensible reading of Q1a's actual phrasing ("Report back an impact analysis of how this will impact the code base") as a genuine breadth question, not a which-specific-flow question. Q1b's phrasing ("how it can be added in the PGO," "existing flows... affected") is pointed at one assignment flow specifically, and the reranker responded accordingly.

**Real, honest interpretation:** reranking is not a uniform win — it appears to help precisely when the real question has one specific best answer (Q1b), and may be the wrong shape entirely for genuine breadth/impact-analysis questions (Q1a), which plausibly want *more* evidence surfaced, not a tighter top-15 cut. This mirrors general 2026 retrieval guidance found in this same research pass ("BM25 for exact lookups, vectors for conceptual queries" — different query intents warrant different retrieval treatment) applied one level up: broad-impact vs. narrow-how-to questions may need different retrieval *shapes*, not just different weights on the same shape.

**Cost:** 2 real LLM calls total for this pilot (one per query), small and bounded, same convention as every other paid step in this pipeline.

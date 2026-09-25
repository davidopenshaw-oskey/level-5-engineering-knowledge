# Prompt 7: research — summary-vs-atomic retrieval, non-LLM academic lenses

**Mode: research only. Web search, no code changes, no builds, no repo commits (standing rule:
never run `git add`/`git commit`; if you write findings to a file, that's fine, committing is
not your call). If any step would cost real money (a paid API/database, not just ordinary web
search), stop and flag it before running it rather than just running it.**

## The exact problem, stated plainly — read this first, don't re-derive it

A Postgres-backed fact index (`facts` table, 69,005 rows, 45 distinct `kind` values) stores
code-derived observations at wildly different grains — from whole-file facts down to one row per
individual function-call site. Real numbers, already verified against the live database:

- 71% of all rows (49,000 of 69,005) are the two most atomic kinds: `call_expression` (one row
  per call site) and `model_property` (one row per struct/class field).
- Grouping `call_expression` rows by the function/method they belong to: median is 1 call per
  symbol (most functions are simple), but **1,717 symbols (11.8% of 14,564 distinct symbols)
  have 5+ calls each, and together account for 54% of all call_expression rows** — the
  granularity problem is real but concentrated in a fragmented minority, not universal.
- Container-level facts already exist for most of those fragmented symbols (82% have a matching
  `function_declaration`/`class_method`/etc. row) — but their `description` is exactly as thin as
  the atomics (signature + file:line, no behavioral synthesis). Same pattern confirmed on the
  model-property side (`class_declaration`/`struct_declaration` rows exist, equally thin; some
  classes have up to 99 separate `model_property` children with no fact anywhere describing the
  model's actual shape).
- A prior synthesis stage (`phase-02-inter-module-synthesis/`) already exists in this pipeline,
  with real LLM-synthesis machinery (capability/module/repo-level profile generators), but it is
  dead in practice (stale/absent output) and — confirmed by checking the live database's table
  list — its output was never loaded back into Postgres as queryable facts anyway.
- Cross-repo connectivity (`cross_repo_edges`, 17,649 rows) is 97% `INTRA_REPO_CALL` — genuinely
  cross-repo edges (HTTP/PubSub/Firestore/field bindings) are ~3% of that table, sparse but real
  and load-bearing for impact-analysis use cases specifically.
- **This surfaced from a real, measured production problem**: a PRD-generation agent burned 3 of
  its last turns on near-duplicate searches (`"processAccessPubSubMessage update"`, `"...update
  handler"`, `"...update implementation"`) hunting for a synthesis that doesn't exist in the
  store — only fragmented atomics do. Full detail:
  `11-build-completion-duplicate-search-queries-fix-2026-09-20.md`'s "Note, 2026-09-21/22"
  section, and `41-build-completion-near-duplicate-detector-and-flatline-finding-2026-09-22.md`.
- **Checked and confirmed real gap**: nothing in the live citation-validation code
  (`checkFabrication`, `checkTemplateConformance` in `capability-fanout-prd-agent.ts`) cares
  whether a cited fact is a fine-grained atomic or a coarse synthesized summary — both pass
  identically as long as the `fact_ref` is real. So there is currently **no deterministic,
  code-enforced trigger deciding when a retrieval step should serve a summary vs. drill down
  into the atomics behind it** — today that would be pure LLM judgment, unconstrained.

## The real design questions to research — answer these specifically, don't survey generally

1. **Summary-vs-atomic serving policy.** Is there formal, pre-LLM prior art on deciding
   *deterministically* (not by model judgment) whether to serve an aggregate/summary record or
   force drill-down into its constituent detail records? OLAP/data-warehousing is the strongest
   candidate lens here — "roll-up" and "drill-down" are literally that field's vocabulary
   (Kimball/Inmon dimensional modeling, materialized aggregate views). What decision rules did
   that field converge on, and do any transfer to an LLM-agent retrieval context?
2. **Staleness/regeneration policy for a derived summary.** If a summary fact is generated once
   from its atomics and the underlying code later changes, when does OLAP/data-warehousing
   literature say a materialized aggregate needs to be recomputed? Is there a formal notion
   transferable here (e.g. versioning aggregates against a source `run_id`, the same way this
   project's `extraction_runs` table already versions raw facts)?
3. **"Sufficient context" for explaining behavior.** Program comprehension / program slicing
   research (Weiser 1981 onward) has decades of work on identifying the *minimal relevant subset*
   of a program needed to explain a given behavior to a reader. Is there a formal, non-LLM
   definition of "enough call-graph context" from that field that could inform how much of a
   function's call tree a synthesized description needs to include to be trustworthy (not just
   "readable")?
4. **Coarse-to-fine retrieval, pre-embeddings.** Classical information retrieval / library
   science has hierarchical and faceted indexing strategies (multi-level indexes, cluster-based
   retrieval) that predate neural embeddings entirely. Do any of those strategies map onto
   "search a coarse summary index first, fall back to a fine atomic index only on low
   confidence" — which is close to what's being considered here — and did that field find real
   failure modes worth knowing about in advance?
5. **Modern hierarchical RAG specifically.** RAPTOR, GraphRAG, and similar hierarchical-retrieval
   techniques are the closest current academic analogue and should be covered directly, not
   skipped — but treat this as one lens among the four above, not the only one; this project has
   already mined adjacent LLM/agent-loop literature once (doc 40) and a second pass narrowly
   focused on "RAG papers" risks landing in the same neighborhood rather than a genuinely
   different one.

## Standard for citations — this project already holds itself to this, match it

`40-research-agent-loop-governance-and-model-comparison-2026-09-22.md` independently re-fetched
and confirmed its 5 highest-stakes citations before trusting them, rather than citing from
training-data memory. Do the same here: every named technique or claimed finding needs a real,
checked source (paper title + venue/year + a URL or DOI you actually fetched), not a
remembered-but-unverified reference.

## What to produce

A written research report mapping each of the 5 questions above to concrete, named
techniques/papers and — critically — a one-paragraph "so what does this suggest for our actual
system" per lens, not a general literature survey. If you're working inside the
`level-5-engineering-knowledge` repo, write it as the next-available numbered doc in
`governance/roadmap/dynamic-pipeline-architecture/` (check the current highest number first,
don't guess), following doc 40's structure as the model of what "real, externally verified"
looks like. If you're not in that repo, just produce the report directly — the user will bring
it back in themselves. Either way: no git add/commit.

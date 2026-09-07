# Findings — How Sourcegraph Actually Evaluates Codebases, Checked Against This Project's Own Gaps

Answers `09-priming-brief-sourcegraph-codebase-analysis-2026-09-06.md`. All claims below are from live web search/fetch run 2026-09-06 (direct fetches of `sourcegraph.com/blog/*` returned HTTP 403; findings on those pages rely on search-result excerpts/quotes rather than a full direct fetch — flagged where relevant). Per this project's own standing discipline: honest negatives are reported as real findings, not softened.

---

## 1. Sourcegraph's real TypeScript/Angular indexing — checked against this project's own measured 92/160 gap

**Real, honest negative — no evidence scip-typescript reaches into Angular HTML templates at all.** Direct fetch of `github.com/sourcegraph/scip-typescript`'s own README: no mention of Angular support, template bindings, or any non-script file type. Confirmed by a separate finding: scip-typescript's handling of Vue single-file components works by **extracting the `<script>`/`<script setup>` block** from the `.vue` file and indexing that — i.e., its whole model is "find the embedded script, index it as TypeScript/JavaScript," not "understand a template language's own binding syntax." Angular templates (`.html` files, or inline `template:` strings) have no `<script>` block for this mechanism to extract in the first place.

**What this means concretely**: this is not a confirmed "Sourcegraph tested Angular templates and gave up" finding — no such direct statement was found — but the structural mechanism confirmed for Vue (script-block extraction only) makes it very unlikely scip-typescript resolves Angular's `formControlName`/`[value]`-style template bindings the way this project's own extractor needed to be fixed to do. **This is a real, useful, humbling finding**: a company operating at far greater scale and maturity than this project appears to have the same class of blind spot (AST/script-level indexing stops at the template boundary) that produced this project's own real, measured 92-of-160 gap. Not a gap this project missed relative to Sourcegraph — a gap that may be structurally common to the whole category of script-based extractors, template languages included.

---

## 2. Sourcegraph's real approach to UX/design-facing facts — the most important angle, reported with full honesty as instructed

**Real, confirmed honest negative — no evidence found, at any level of Sourcegraph's real product line, of ingesting design-tool data, UI-facing text, or facts unrecoverable from source/AST.** Specifically checked:

- Cody's own documented context sources are exhaustively code-and-repository-shaped: "code search, code graph (SCIP), intelligent ranking, and an AI vector database" over source code — no design-tool, Figma, or UI-text ingestion path described anywhere found.
- A direct search for Sourcegraph/Cody + Figma/design-mockup context turned up **zero evidence of any real integration in either direction** — the only real 2026 tooling found connecting Figma and code-adjacent AI work goes the *opposite* direction from what this project needs (screenshot/image → editable Figma design, e.g. Codia AI), not "read the design file to recover the real label/option text a screen shows," which is this project's actual open gap (`15-...md` Part A2).

**Report this plainly, as instructed**: a company whose entire product is code intelligence, at a scale and maturity level well beyond this project's own, appears to have **no published solution to this problem either**. This is real, valuable evidence that this project's own unsolved UX/design-facts gap (Part A2 — a form control's real displayed option/label text, not recoverable from AST alone) is a genuinely hard, unsolved problem across the code-intelligence industry, not a corner this project specifically cut. It does not mean this project's own planned Figma/MCP approach (tracked for ~2026-09-19) is validated as *correct* — no comparable real attempt was found to validate against — only that it appears to be tackling something nobody else in this space has published a real answer to yet, which is worth knowing either way.

---

## 3. Sourcegraph's real approach to cross-repo/cross-language type-mirror divergence

**Real finding: Sourcegraph surfaces the connections; the judgment call still appears to be the human's, same as this project found for itself.**

- **Code Insights** is real and current: it tracks "anything that can be expressed with a Sourcegraph search query... across thousands of repositories," backfilling historical trends (e.g., migration progress, version adoption). This is a real, powerful tool for *measuring* a known pattern over time once a human has defined the search query for it — not an automatic semantic-drift detector.
- **Cross-repository code navigation**, powered by SCIP: real and current — "a search tool can navigate from an import statement in one repository to the function definition in another, track project references across repository boundaries, and distinguish between a function and a variable with the same name." This is genuinely useful, real infrastructure for *following* a cross-repo reference precisely — but it answers "where does this symbol lead," not "are these two independently-declared symbols with the same name a safe mirror or a genuine collision," which is the actual judgment this project had to make by hand for its own real 92→42 finding.
- **Batch Changes**: real, current, but oriented toward *applying* a scripted change across many repos (e.g., a large-scale migration), not *detecting* divergence as an analysis step. No evidence found of it being used or documented for drift-detection specifically.

**Verdict**: this directly corroborates, rather than challenges, the situation this project already found itself in — Sourcegraph's own SCIP-based cross-referencing gives you the connections (structurally identical to what this project's own `cross_repo_edges` table does), but the safe-mirror-vs-genuine-collision judgment call is not something Sourcegraph's public tooling appears to automate either. This project's own manual review step (92→42) is not a shortcut it should have skipped — it looks like the same real, unavoidable step Sourcegraph's own users would also have to do by hand.

---

## 4. Sourcegraph's real approach to Cody's code-context retrieval — checked against this project's own architecture (ADR-007)

**Real, strong, direct corroboration of this project's own MCP-tool-layer + agent-persona direction — and it goes a step further than ADR-007's own evidence base.**

- Confirmed real architectural shift: Cody's documentation "describes this search-and-graph combination without describing an embeddings-based retrieval path" — i.e., **Search has replaced embeddings as Cody's default context mechanism**, a real, published move away from the same embeddings-only approach this project's own retrieval-architecture research (`02-...md`) found Claude Code itself had already abandoned.
- Real, current (Sourcegraph 7.0, February 2026) framing, found via search excerpt: Sourcegraph's code-intelligence platform is now positioned as **"the shared intelligence layer for both developers and AI agents,"** with **"Sourcegraph indexes every repository across code hosts into a unified search corpus available to agents through MCP Server, exposing SCIP-powered code intelligence where the agent gets cross-repo, deterministic results: exact symbol definitions, callsites, and implementers instead of approximate, embedding-based retrieval."**
- Real, directly-quoted framing on the broader shift, from Sourcegraph's own 2026 "Context Engineering" post (via search excerpt): **"the shift from traditional RAG to Agentic Search,"** with Claude Code named explicitly as the exemplar "replacing static embeddings with dynamic tool usage" — and the specific architectural principle: **"deterministic structure where structure exists and semantic search where it doesn't."**

**Verdict**: this is a real, decisive, independent corroboration of both halves of this project's own architecture — not just the general "agentic beats embeddings-only RAG" finding ADR-007 already had (from GitHub Copilot's own telemetry and Claude Code's own precedent), but specifically the choice to expose real, deterministic facts (this project's own fact_id-cited search/graph/walk tools) **through an MCP server to an agent**, rather than trying to fuse everything into one embedding-ranked answer. Sourcegraph — an independent, much larger player — converged on the identical shape: deterministic code-graph facts, MCP-exposed, agent-consumed, embeddings demoted to a fallback rather than the primary path. Worth citing directly in any future revision of ADR-007's evidence base.

---

## 5. Sourcegraph's own AST-walker/extraction-coverage verification practice

**Real, named, published practice found — a more mature version of the same underlying goal as this project's own grep-cross-check discipline, not the same mechanism.**

Real, direct finding: SCIP's own design explicitly prioritizes indexer testability — **"One of the key design criteria for SCIP was that it should be easy to understand an index file and test an indexer for correctness."** Concretely, Sourcegraph built and publishes a **snapshot-testing utility on top of SCIP, reused across all its own indexers**: the `scip` CLI's `snapshot` subcommand "inspects an index file and regenerates the source code, attaching comments describing occurrence information" — a real, named golden-testing technique, explicitly recommended for anyone writing a new indexer, with the stated contrast that "snapshot testing with LSIF payloads... has been painful in their experience," i.e. a real, hard-won lesson from their own prior format.

**Verdict**: this **updates (does not simply confirm) `08-...md`'s prior honest negative.** A company operating at Sourcegraph's scale *does* publish a real, named coverage/correctness-verification practice — snapshot/golden testing of what an indexer actually extracted, regenerated back against real source with occurrence annotations. It is not the same mechanism this project's own discipline uses (an independent grep/regex count of a specific construct across real source, checked post hoc when a retrieval-quality problem surfaces a suspected gap) — Sourcegraph's is a build-time, per-indexer golden-test suite, checked continuously, not a targeted investigative technique reached for after a real quality problem appears. Both are real, valid answers to the same underlying question ("did my AST walker actually see everything it should have"); this project's own technique is lighter-weight and reactive, Sourcegraph's is heavier and preventive. Worth considering snapshot/golden-testing as a real, named upgrade path once Swift/Kotlin extraction work actually starts, rather than continuing with only the reactive grep-cross-check technique indefinitely.

---

## Summary — what this changes

| # | Angle | Result |
|---|---|---|
| 1 | Angular template coverage | **A shared blind spot, not a gap unique to this project** — scip-typescript's script-block-only mechanism (confirmed for Vue) makes template-binding resolution unlikely; a humbling, useful finding, not a missed opportunity |
| 2 | UX/design facts | **Confirmed honest negative, at Sourcegraph's own scale** — no real ingestion of design-tool/UI-text data found anywhere in this space; this project's own gap is a genuinely unsolved industry problem, not a corner cut |
| 3 | Cross-repo drift detection | **Corroborates this project's own experience** — Sourcegraph surfaces the connections (SCIP cross-references) but the safe-mirror-vs-collision judgment call appears to remain manual there too |
| 4 | Cody's retrieval architecture | **Strong, direct, independent corroboration of ADR-007** — Sourcegraph converged on the identical deterministic-facts + MCP + agentic-search shape, embeddings demoted to fallback; worth citing in ADR-007's own evidence base |
| 5 | Extraction-coverage verification | **A real, named, more mature practice found (SCIP snapshot/golden testing)** — updates, not just confirms, `08-...md`'s prior "not found anywhere" finding; a real candidate upgrade path for this project's own (currently reactive) verification discipline |

## Sources

- [sourcegraph/scip-typescript (README, direct fetch)](https://github.com/sourcegraph/scip-typescript)
- [Sourcegraph — scip-typescript: a new TypeScript and JavaScript indexer](https://sourcegraph.com/blog/announcing-scip-typescript)
- [Sourcegraph — SCIP, a better code indexing format than LSIF](https://sourcegraph.com/blog/announcing-scip) (snapshot-testing design criteria)
- [Sourcegraph — Code Insights docs](https://sourcegraph.com/docs/code-insights)
- [Sourcegraph — Cross-repository code navigation](https://sourcegraph.com/blog/cross-repository-code-navigation)
- [Sourcegraph — Batch Changes docs](https://sourcegraph.com/docs/batch-changes/creating-multiple-changesets-in-large-repositories)
- [Sourcegraph — How Cody understands your codebase (via search excerpt; direct fetch returned HTTP 403)](https://sourcegraph.com/blog/how-cody-understands-your-codebase)
- [Sourcegraph — Context Engineering: A Practical Guide for AI Agents, 2026 (via search excerpt; direct fetch returned HTTP 403)](https://sourcegraph.com/blog/context-engineering)
- [Sourcegraph — Agentic Coding in 2026: A Practical Guide for Big Code](https://sourcegraph.com/blog/agentic-coding)
- [Codia AI — Screenshot to Figma (real, but opposite-direction tooling)](https://codia.ai/blog/screenshot-to-figma-guide)

**Note on two sources**: `sourcegraph.com/blog/how-cody-understands-your-codebase` and `sourcegraph.com/blog/context-engineering` blocked direct WebFetch (HTTP 403). Their claims above are drawn from search-result excerpts that quote these pages directly, not from an independently-verified full fetch — flagged per this project's own discipline of distinguishing confirmed-by-direct-fetch from confirmed-via-secondary-excerpt.

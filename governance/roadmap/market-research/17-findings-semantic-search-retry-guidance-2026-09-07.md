# Findings — How Real Products Word Semantic-Search Tool Guidance to Prevent Cosmetic Query Retries

Narrow follow-up to `14-findings-agentic-turn-budgets-2026-09-06.md` (which covered turn-budget/stopping-condition policy generally). This round is specific to the exact failure reported live: `atomic-prd-agent` retrying `search_facts` with cosmetic punctuation variants (`inhabitantTypes`, `inhabitantTypes =`, `inhabitantTypes = [`) that a pure vector-embedding tool cannot meaningfully distinguish between. All claims below are from live web search/fetch run 2026-09-07, cited inline.

## Headline finding

**No real, current system was found that says, in so many words, "don't retry semantic search with cosmetic punctuation variants."** But real, current, verbatim production guidance from two major tools (Cursor, Windsurf/Cascade) converges on a different, more fundamental instruction that would have prevented this exact failure as a side effect: **tell the model what actually changes a semantic-search result (meaning/concept/function-purpose) and what doesn't (exact string mechanics), and give it an explicit, different tool or strategy to reach for once semantic search stops helping — not "try again with different words."**

---

## 1. Cursor — real, verbatim, most directly actionable finding

Two real, verbatim pieces of Cursor's own system prompt (fetched directly), covering both sides of this problem:

**On not over-tinkering with query wording at all** — the opposite direction from this project's failure, but evidence of the same underlying belief (cosmetic query changes don't reliably move a semantic search):

> "Unless there is a clear reason to use your own search query, please just reuse the user's exact query with their wording. Their exact wording/phrasing can often be helpful for the semantic search query. Keeping the same exact question format can also be helpful."

**On what to do when a semantic search doesn't fully answer the request** — real, explicit strategy-switch guidance, not a reformulate-and-retry instruction:

> "If you've performed a semantic search, and the results may not fully answer the USER's request, or merit gathering more information, feel free to call more tools."

And, critically, Cursor draws an explicit real line between two different tools for two different jobs — this is the actionable mechanism, not query rewording:

> `grep_search`: "This is best for finding exact text matches or regex patterns. More precise than semantic search for finding specific strings or patterns. **This is preferred over semantic search when we know the exact symbol/function name/etc.**"

**Direct read for this project's exact failure**: Cursor's real answer to "semantic search didn't find my exact known symbol" is not "reword the semantic query" — it's "switch to a fundamentally different, exact-match tool built for that job." This project's own tool surface (`search_facts`, `get_graph_neighbors`, `walk_cluster`) has no exact-match/keyword equivalent to switch to — Cursor's own real practice implies that gap, more than a wording problem in the persona, may be the deeper structural cause. ([gist.github.com/sshh12 — Cursor Agent System Prompt](https://gist.github.com/sshh12/25ad2e40529b269a88b80e7cf1c38084))

---

## 2. Windsurf / Cascade — real, verbatim guidance on constructing a good query, not on retrying a bad one

Real, verbatim, from the leaked-and-since-widely-mirrored Cascade system prompt:

> "This performs best when the search query is more precise and relating to the function or purpose of code. Results will be poor if asking a very broad question."

Plus a real, separate, quantified scope-warning: search quality "will be substantially worse" past roughly 500 files in scope. ([jujumilk3/leaked-system-prompts — codeium-windsurf-cascade](https://github.com/jujumilk3/leaked-system-prompts/blob/main/codeium-windsurf-cascade_20241206.md))

**Direct read**: this is calibration guidance for the *first* query (be specific, describe function/purpose, not a broad topic), not retry guidance for a *failed* one — but it's directly adaptable: this project's `search_facts` tool description could adopt the identical shape (state what a *good* query looks like — a real business/technical concept or a specific field/method's purpose — so the model calibrates toward better first attempts) even without solving the retry problem directly.

---

## 3. Claude Code — real, verbatim, but a tool-switch heuristic, not a query-wording rule

Claude Code's own `Grep` tool description (fetched directly) contains **no guidance at all on retry strategy or query variation** — it's purely mechanical (ripgrep syntax, output modes, escaping rules). The real retry-relevant guidance lives one level up, in the main system prompt rather than the tool description: **"If you are searching for a keyword or file and are not confident that you will find the right match in the first few tries, use the Agent tool to perform the search instead."** ([Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts))

**Direct read**: this is the same real pattern as Cursor's — the fix for "not finding it after a few tries" is framed as **escalate to a different mechanism** (a sub-agent that can explore more broadly/iteratively) rather than **keep varying the same query**. A third independent real system converging on "switch strategy, don't reword" as the answer to this exact moment.

---

## 4. General RAG/semantic-search query-construction guidance — real, but generic, not retry-specific

A real, current (2026) Google Cloud community piece on building semantic search into AI agents describes a real four-step query-construction discipline for agents formulating a search query: **"Understand" (core topic, entities, implicit constraints) → "Enrich" (domain context, expand abbreviations, related concepts) → "Rephrase" (coherent descriptive prose, not a keyword list) → "Preserve focus"** (stay on the original query's real intent). ([Medium/Google Cloud Community — Building Semantic Search into Your AI Agents](https://medium.com/google-cloud/building-semantic-search-into-your-ai-agents-d72349496340)) This is real, but framed entirely around constructing the *first* query well, not around recognizing a failed retry pattern — flagged honestly as adjacent, not a direct hit.

**Real, contrarian, directly relevant research finding, worth knowing regardless of retry-wording specifically**: a 2026 paper, "Keyword search is all you need: Achieving RAG-Level Performance without vector databases using agentic tool use" (arXiv 2602.23368), argues real agentic keyword/exact search can match vector-RAG performance when paired with genuine agentic iteration. This is independent, real support for the same structural point Cursor's and Claude Code's own tool designs already encode: **a capable agent needs both an exact/keyword path and a semantic path, and knows which one a given need calls for** — this project's current single-tool (`search_facts`, pure vector) surface is a real, structural outlier relative to every other real system checked in this research.

---

## What was not found

**No real, current, verbatim system prompt or tool description was found from GitHub Copilot, Devin, SWE-agent, OpenHands, or Sourcegraph Cody** that speaks to this specific failure mode (cosmetic query retries against a pure-semantic tool) at the level of detail found for Cursor/Windsurf/Claude Code. Reported plainly as not found rather than padded — this may reflect that these systems either don't publish this level of prompt detail, or (per OpenHands' own real, current codebase, not checked line-by-line here) don't rely on a pure-semantic search tool as their primary retrieval mechanism the way this project does.

---

## What this means for this project's specific persona/tool-description wording

Three real, converging, adoptable patterns — not a single silver-bullet sentence, since none of the three real systems checked frames this as a pure wording problem:

1. **State plainly what changes a `search_facts` result and what doesn't**, directly informed by this project's own already-confirmed mechanism: since the tool is pure vector/semantic search, punctuation, brackets, equals signs, and filename concatenation carry no semantic weight and will not change results — only genuinely different real-world phrasing (a different business term, a different technical concept, a different candidate symbol name) can. This is a direct, defensible instruction this project can write with full confidence, since it was independently confirmed against the real embedding mechanism, not just inferred from other products' wording.
2. **Borrow Windsurf's and Cursor's real framing for what a *good* query looks like** (precise, tied to a real function/purpose/concept, not a broad topic, not the same question reworded) — adapting this project's own `search_facts` tool description to state this positively, the same way Windsurf's does, rather than leaving "semantic/vector search" as an undecorated mechanism label.
3. **The deeper, structural finding, worth surfacing even though it's outside pure wording**: every other real system checked here (Cursor, Claude Code, and per the arXiv paper, the wider research literature) treats "semantic search isn't finding it" as a **signal to switch tools or strategy**, not a signal to keep varying the same tool's query. This project's own three-tool MCP surface (`search_facts`, `get_graph_neighbors`, `walk_cluster`) has no real exact/keyword-match analog to switch to — meaning a persona instruction alone can only partially replicate what real systems achieve via tool diversity. Worth naming as a real, separate, structural design question (not decided here, and explicitly outside this research's scope) rather than assuming a wording fix alone will fully close the gap.

## Sources

- [Cursor Agent System Prompt (gist, direct fetch)](https://gist.github.com/sshh12/25ad2e40529b269a88b80e7cf1c38084)
- [jujumilk3/leaked-system-prompts — Codeium Windsurf Cascade (direct fetch)](https://github.com/jujumilk3/leaked-system-prompts/blob/main/codeium-windsurf-cascade_20241206.md)
- [Piebald-AI/claude-code-system-prompts — Grep tool description (direct fetch)](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/tool-description-grep.md)
- [Piebald-AI/claude-code-system-prompts (repo)](https://github.com/Piebald-AI/claude-code-system-prompts)
- [Medium / Google Cloud Community — Building Semantic Search into Your AI Agents](https://medium.com/google-cloud/building-semantic-search-into-your-ai-agents-d72349496340)
- [arXiv 2602.23368 — Keyword search is all you need: Achieving RAG-Level Performance without vector databases using agentic tool use](https://arxiv.org/pdf/2602.23368)

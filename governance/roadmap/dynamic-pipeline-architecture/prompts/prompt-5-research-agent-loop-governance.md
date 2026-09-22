# Prompt 5: research how others govern agentic tool-call loops (near-duplicate queries, context/latency blowups, sequential-vs-parallel fan-out)

**Standing rule: never run `git add`/`git commit`, under any circumstance.**

**Mode: research only, zero code changes, zero spend beyond ordinary web search/fetch.** Do
not edit, run, or test anything in this repo. Do not touch `mcp-server/agent-poc/*.ts` or run
any real PRD-agent test. Your entire job is to search the web, read real sources, and write a
findings doc. If you can't find something, say so plainly — never present memorized/training
knowledge as if it were something you just looked up and verified, and never invent a citation,
a URL, a library name, or an API detail you haven't actually seen in a real source this session.

## Why this session exists (read first, don't re-derive)

A real, measured run of this project's own multi-capability PRD-generation agent
(`mcp-server/agent-poc/capability-fanout-prd-agent.ts`) took 23.5 minutes and cost ~$1.00 for
one document, across 5 sequentially-run "capabilities" (one per in-scope repo/module). That's
real and already too slow to be usable — flagged directly by the user ("if it takes more than
a few minutes to generate a document, then the system is of no use"). Two real, separate
problems were found live in that run, both documented in
`governance/roadmap/dynamic-pipeline-architecture/11-build-completion-duplicate-search-queries-fix-2026-09-20.md`
(the "Note, 2026-09-21/22" section at the end — read it in full, it has the real numbers):

1. **Near-duplicate (not exact-duplicate) tool-call queries aren't caught by anything.** One
   capability spent 3 of its last turns on `"processAccessPubSubMessage update"`,
   `"...update handler"`, `"...update implementation"` — three different strings asking the
   same real question. This project's existing fix (docs 09/10/11, same folder) only catches
   (a) byte-identical repeats (served free from a cache) and (b) a cross-module
   embedding-distance signal that escalates to a hard block after 2 hits — neither fires for
   three differently-worded, legitimately-in-module queries. There is currently **no general
   "have I essentially asked this before" detector** in the code at all; only the turn budget
   eventually stops it.
2. **A per-turn "thought signature" (an opaque continuity blob the model API attaches to
   tool-call turns, resent as part of conversation history on every later turn) ballooned from
   a normal <23 KB to ~313 KB and stayed there for 3 consecutive turns**, in the same capability,
   at the same point as the query loop above. That alone inflated that one capability's input
   tokens to 3-5x every sibling capability in the same run (269,674 vs 50,674-86,564, same
   message count), and each of those 3 turns took 150-190 seconds of real model latency with no
   rate-limit error logged.
3. Separately, and possibly related: the model currently used is **`gemini-3.5-flash` via
   Vertex AI**, run with `maxTurns` per capability (was 20, a prior message in this thread
   reduced it toward 10 as an experiment — check the latest state of
   `CAPABILITY_MAX_TURNS`/`MAX_TURNS` in `mcp-server/agent-poc/capability-fanout-prd-agent.ts`
   and `atomic-prd-agent.ts` if it matters to your search, but you are not fixing or tuning
   this, only researching). Capabilities run **strictly sequentially**, not in parallel
   (`mcp-server/agent-poc/capability-fanout-prd-agent.ts`'s `Step 2` log line says so directly).
   A real Vertex AI quota check this session found no override for `gemini-3.5-flash` itself
   (only a differently-named model, `gemini-3.5-flash-cyber`, has a raised limit) — yet the
   real run sustained 11-18 model calls/minute on its fast capabilities with zero `429`s,
   contradicting the documented 5/minute default. That contradiction is unresolved and is
   itself worth a small amount of your research time (see task 4 below), but is not the main
   focus.

## What to research (four real, separate questions — go deep on 1 and 2, lighter on 3 and 4)

1. **How do people detect and stop near-duplicate (semantically-same, textually-different)
   tool-call/query loops in LLM agents, in practice, not just in theory?** Look for real,
   named techniques and who uses them: embedding-similarity-based dedup of tool-call arguments
   (not just exact-string caching), n-gram/edit-distance heuristics, "loop detectors" in
   agent frameworks (LangChain/LangGraph, LlamaIndex, AutoGen, CrewAI, OpenAI's own
   function-calling/agents guidance, Anthropic's own agent-building guidance), academic
   work on ReAct-style agents getting stuck repeating actions, and any write-ups from teams
   who hit this exact failure mode in production and how they fixed it (engineering blogs,
   conference talks, GitHub issues/discussions on real agent frameworks). Prefer primary
   sources (official docs, real repo code/issues, real papers) over aggregator blog spam.

2. **Do different model providers/APIs handle multi-turn "thinking"/reasoning continuity
   differently, and is unbounded growth of that continuity data a known issue?** Specifically:
   what is Gemini's "thought signature" mechanism (official Google/Vertex AI docs term,
   confirm the real name), what is it for, is there official guidance on when it's safe to
   drop/not resend it, and are there known reports (GitHub issues, forums, blog posts) of it
   growing large or causing latency. Compare against how Claude's extended-thinking/tool-use
   API and OpenAI's reasoning-model APIs carry (or don't carry) equivalent state across
   multi-turn tool calls — do they require resending anything comparable, do they cap it, do
   they let the caller trim conversation history safely without losing capability. A real,
   concrete comparison table of "what has to be resent every turn, and can the caller control
   its size" across at least Gemini, Claude, and OpenAI would be genuinely useful here.

3. **How do people manage a fixed per-agent turn/step budget well, beyond a flat cap?** This
   project's own data (see `27-findings-citation-rate-by-fact-kind-2026-09-20.md` and
   `34-findings-citation-dropoff-and-cross-repo-gap-interaction-2026-09-21.md` in this same
   folder, real numbers already found, don't re-derive) shows most real value lands in the
   first ~60% of an agent's turn budget, with a long, mostly-wasted tail. Look for real
   diminishing-returns/early-stopping patterns in agent loops (not generic ML early stopping) —
   e.g. stopping when consecutive tool calls return nothing new, confidence/information-gain
   based halting, or "reflect and decide whether to continue" patterns — and how those compare
   to a flat turn cap.

4. **Lighter pass: real-world patterns for running independent agent sub-tasks in parallel
   under a shared rate limit**, since this project currently runs its 5 capabilities strictly
   sequentially and it's an open question whether that's still required by the real quota. Look
   for concrete patterns (semaphore/concurrency-limited fan-out, token-bucket client-side
   throttling, batching) used by real agent frameworks or teams calling Gemini/Vertex AI or
   similar rate-limited LLM APIs from multiple concurrent agent branches.

## What "good" looks like for your findings doc

- Every claim backed by a real source you actually fetched this session — a URL, a doc title,
  a repo/file, a date if the source has one. If you searched for something and found nothing
  solid, write that down as a real negative result, don't paper over it.
- Organize by the four questions above. For each, give: what you found, the real source(s),
  and — only where the evidence supports it — a concrete technique named clearly enough that a
  future build session could implement it (e.g. "embedding-cosine-distance dedup with
  threshold X, as done in [source]" rather than "use semantic dedup").
- A short table comparing Gemini/Claude/OpenAI on question 2's specific point (what gets
  resent each turn, and is it prunable) is worth prioritizing — this project needs that
  comparison directly, not just a Gemini-only writeup.
- Do **not** recommend a specific fix as final — surface real options with real tradeoffs
  (cost/complexity/risk) grounded in what you found, and connect each option back to which of
  the two problems in "why this session exists" it would actually address. A future
  investigate/decide/build session (this project's own established pattern — see how docs
  09→10→11 or 29→30→31→38 did it) will make the call, not you.
- Explicitly note anything you're **not confident about** rather than smoothing it over —
  matches this project's own working discipline (real, honest uncertainty is a fine answer).

## Where to write it

`governance/roadmap/dynamic-pipeline-architecture/` — next available number as of when you
run (check the folder first; as of this prompt being written the last used number is `39`,
plus `prompts/prompt-1`-`prompt-5`). Title it something like
`40-research-agent-loop-governance-and-model-comparison-2026-09-22.md`. One doc, not several —
append/organize by section rather than splitting into multiple files. No git add/commit.

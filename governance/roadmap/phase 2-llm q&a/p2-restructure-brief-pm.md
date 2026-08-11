# Rethinking Phase 2: Turning Extracted Code Facts into Trustworthy Engineering Knowledge

*A grounding brief for open discussion — we're looking for fresh angles, including ones that challenge our current assumptions.*

## The mission

We're building a system that reads a company's codebases — currently one, growing to 15+ repositories spanning iOS, Android, Angular (×2), a Node.js/IoT middleware layer, and more — and turns them into an authoritative, navigable knowledge base: engineering profiles per module, API references, cross-module dependency maps, permission/data-ownership documentation. The goal is that an engineer, product manager, or another AI system can ask "what does this module do, what does it depend on, who else depends on it, what permissions does it enforce" and get a trustworthy answer without reading the source code directly.

"Trustworthy" is the load-bearing word. This knowledge base is meant to inform real decisions — impact analysis before a change, PRD-writing, onboarding — so a confident wrong answer is worse than an honestly-hedged one. We've built the system around a hard rule: never let an LLM present something as certain when it isn't. Every claim in the output is tagged with how confident we actually are, and every claim traces back to real evidence.

## How it currently works, in two phases

**Phase 1** is fully mechanical: it clones a repository, parses every source file's syntax tree, and extracts structured, typed facts — every class, every method, every function signature, every place code reads or writes a database path, every place a permission is checked, every API request/response contract. No AI involved. It's fast, free, deterministic, and 100% accurate by construction — it's just reading the code.

**Phase 2** is where an AI system reads those extracted facts and writes the actual human-readable documentation — the narrative synthesis, the architectural observations, the parts that require judgment rather than mechanical lookup. This is the expensive, slow, and currently least-settled part of the system.

## The problem we've just run into

We recently ran Phase 2 end-to-end, for real, on one module of our largest codebase, and measured the actual cost: roughly $5 in AI-model spend, for one module, out of dozens of modules, in one repository, out of 15+ repositories we intend to cover — and that number is growing as the codebases grow. We also expect the underlying AI-model pricing and capabilities to keep shifting significantly through 2026 and 2027, so whatever we build needs to not be fragile to that churn.

Our original mental model was that Phase 2 would run automatically, every time code is merged to production, right alongside Phase 1 — one continuous, fully-automated pipeline. The real cost numbers say that assumption may not survive at scale. We're not sure yet whether the fix is "make the current approach cheaper" or "rethink where and how Phase 2 actually runs" — possibly both.

## What we're asking for

We want genuinely fresh thinking on how the fact-extraction-to-knowledge-base step should be structured — not just tighter prompts within the architecture we already have. That includes permission to question things we haven't questioned yet: does this need to be one continuous automated pipeline at all? Could the expensive, judgment-heavy part run on a different trigger, cadence, or even in a different technical environment than the cheap, mechanical part? We'd rather hear "you're solving the wrong problem" now than optimize the wrong architecture for another few months.

A companion technical brief goes into the current architecture, the real numbers, and the specific open questions in depth — this document is meant to set up the "why" before that detail.

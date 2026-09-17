# Real, unresolved finding — fact_id's newline content is a reliability risk independent of length (2026-09-17)

Captured at 8% context remaining, before continuing — real synthesis from this session's own live discussion, not yet acted on. Read alongside `10-case-2a-fanout-content-truncation-finding-2026-09-17.md` (the concrete incident this reasoning is built from).

## The real data (gathered live by a peer session, checked against the real corpus)

68,902 facts corpus-wide. Length: min 63, max 10,837, avg 187, median 161, p90 288, p99 496 — the long tail is a real minority. **`call_expression` (37,859 facts, ~55% of corpus) is the *only* kind with any embedded newlines at all** — 8,865 of them (23%) — and it holds the entire long tail; every other kind is short, single-line, structurally safe from this class of problem. Within `call_expression`: >300 chars: 5,654; >500: 671; >1,000: 164; >2,000: 47; >5,000: 3. The single longest real fact_id is 10,837 chars (a Swift `VStack` view body).

**The critical, non-obvious point**: both real incidents this session (`createIntercomDisplayName`, whitespace-collapsed; `publishMessageToAllACDs`, content-truncated) were only a few hundred characters — comfortably in the *normal* range, nowhere near the extreme tail. **Length is not the trigger. Embedded newlines are the trigger, at any length.**

## Why this matters — the current fix doesn't cover this

`boundedIdComponent()` (the `stableFactId()` fix shipped earlier this session) only bounds a component *over* ~2000 characters. Both of today's real failures were far under that threshold — **the existing fix does not address the actual mechanism causing either real incident found today.** This is a materially different, narrower problem (newline/JSON-escaping reproduction reliability) than the one already fixed (raw length vs. Postgres's btree limit), and needs its own fix, not a tightened version of the length-based one.

## Root cause of the newlines existing at all

`ts-morph`/SwiftSyntax capture real, verbatim source text for `call_expression` facts — faithful to the actual multi-line code. That's the right design for a fact's `description`/payload (meant to be *read*, benefits from fidelity). But `fact_id` is also built from this same raw text, and `fact_id` has to be *compared, looked up, and retyped by a model as a tool argument* — a fundamentally different job with opposite requirements (small, stable, boring, no embedded formatting). Conflating these two roles into one string is the common root of three separate real incidents this session: the Postgres btree crash (size), the whitespace-collapse citation bug (formatting), and this content-truncation bug (reproduction reliability under JSON-escaping).

**This is the same, well-established natural-key-vs-surrogate-key tradeoff from classic database design** — a natural key (human-readable, directly citable) inherits all the instability of the real-world content it's derived from; a surrogate key (opaque, small, stable) avoids all of it at the cost of readability. This project chose a natural key deliberately (for good reasons: human-readable citations, direct debuggability) and is now paying the textbook cost of that choice, three times over in one session.

## Two real next-step options, not yet decided

1. **Cheap, targeted**: strip newlines specifically (not re-bound by length) from `fact_id` components, unconditionally, independent of length. Directly closes the exact gap the length-based fix leaves open. Small change.
2. **More fundamental**: give facts a genuinely opaque identity key (hash or sequence number) separate from the human-readable descriptive string used for citation/display. Eliminates this whole class of problem permanently; bigger architectural change, deserves its own real, deliberate decision (echoes an earlier discussion this same session about hashing primary keys vs. keeping them readable).

## A third, structurally different idea raised, also not written down elsewhere

Tools (`get_graph_neighbors`/`walk_cluster`) currently require the model to retype a fact_id verbatim as an argument, several turns after first seeing it — this is the actual mechanism that broke in the `core` capability's trace (§ of `10-...md`). This project already has real precedent for giving facts *short*, stable references once retrieved (citation numbering, `#1`/`#2`...). If tools accepted that same kind of short reference instead of demanding the full string every time, this whole class of transcription-drift risk goes away structurally, not just via detection. Not scoped or committed to — a real design idea for later.

## Also still real and unresolved, not yet fixed (unrelated to the above, don't conflate)

- The 2-of-5 capability-fanout completion failure rate remains unresolved across two real test cases (1a: `features`/`building` failed; 2a: `organization`/`user` failed — different pairs, confirming it's request-dependent, not module-specific).
- Whether to add anchor-existence validation to `get_graph_neighbors`/`walk_cluster` (would give the model real-time feedback the moment its own working copy of a fact_id goes stale) — proposed, not built.
- Whether this content-truncation failure mode can happen in the one-hit shape too, not just capability-fanout's smaller conversations — untested (n=1 on the one-hit side not hitting it doesn't rule it out).

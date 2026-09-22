# Research: how others govern agentic tool-call loops (near-duplicate queries, context/latency blowups, sequential-vs-parallel fan-out)

Executes [prompts/prompt-5-research-agent-loop-governance.md](prompts/prompt-5-research-agent-loop-governance.md). Research only —
zero code changes, zero repo edits beyond this doc, zero real spend beyond ordinary web
search/fetch. Every claim below is backed by a source actually fetched or searched this
session (URL given); anything not found is stated as a real negative result, not smoothed over.
Read [11-build-completion-duplicate-search-queries-fix-2026-09-20.md](11-build-completion-duplicate-search-queries-fix-2026-09-20.md)'s
"Note, 2026-09-21/22" section, [27-findings-citation-rate-by-fact-kind-2026-09-20.md](27-findings-citation-rate-by-fact-kind-2026-09-20.md),
and [34-findings-citation-dropoff-and-cross-repo-gap-interaction-2026-09-21.md](34-findings-citation-dropoff-and-cross-repo-gap-interaction-2026-09-21.md)
first — this doc treats their real, already-measured numbers as given, not re-derived.

No recommendation is made final here. Options are surfaced with real tradeoffs, each tied back
to which of the prompt's two real problems (near-duplicate query loops; thought-signature
bloat) it would address. A future investigate/decide/build session makes the call.

## 1. Detecting near-duplicate (not exact-duplicate) tool-call/query loops

### What exists in named frameworks: count-based backstops only, confirmed from official docs

Checked directly against official docs, not blog claims: **no mainstream agent framework ships
built-in semantic/near-duplicate loop detection.** What they ship is a step-count ceiling that
fires after the fact and tells you nothing about *why*:

- **LangGraph's `recursion_limit`** (default 25): raises `GraphRecursionError` once
  `step > stop`. Purely a step counter — [official LangGraph docs, `GRAPH_RECURSION_LIMIT`
  error page](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT)
  confirm it has no awareness of repetition, only depth.
- **OpenAI Agents SDK's `max_turns`**: raises `MaxTurnsExceeded` once the loop count is hit —
  [official `Runner` reference](https://openai.github.io/openai-agents-python/ref/run/) and
  [Agents page](https://openai.github.io/openai-agents-python/agents/). Guardrails
  (`InputGuardrailTripwireTriggered`/`OutputGuardrailTripwireTriggered`) are a separate,
  unrelated mechanism for input/output *content* validation, not loop/repetition detection —
  confirmed from the [official guardrails docs](https://openai.github.io/openai-agents-python/guardrails/).

This exactly matches this project's own situation: `CAPABILITY_MAX_TURNS` is the same shape of
backstop — a ceiling, not a detector. Doc 11's near-duplicate case (`"...update"`,
`"...update handler"`, `"...update implementation"`) is precisely the class of failure these
official mechanisms are not designed to catch, confirmed against primary sources, not inferred.

### Real academic characterization of the broader failure class

**[arXiv 2607.01641, "When Agents Do Not Stop: Uncovering Infinite Agentic Loops in LLM
Agents"](https://arxiv.org/html/2607.01641v1)** — fetched and read directly. Real, concrete,
large-scale findings:

- Static-analysis tool (`IAL-Scan`) built an intermediate representation across **8 real
  frameworks** (LangChain, LangGraph, AutoGen, CrewAI, and others), scanning **6,549 real
  LLM-agent repositories**.
- **68 confirmed infinite-agentic-loop vulnerabilities across 47 real projects**, 91.9%
  precision (74 reported, 68 confirmed).
- Loop shapes, by real frequency: retry feedback without bounds (25%), tool-call iteration
  without bounds (23.5%), multi-agent chat without turn bounds (20.6%), workflow loops without
  effective bounds (13.2%).
- Impact: **95.6%** of confirmed findings risk API cost exhaustion / model DoS; **27.9%** risk
  context-window exhaustion.
- **LangGraph (33.8%) and AutoGen (32.4%) account for two-thirds of all findings** — i.e. the
  frameworks with the most agentic flexibility are also where this failure mode concentrates
  most, a real, named, citable data point.
- The paper's core mitigation principle, stated plainly: bounds must cover the actual feedback
  path (not just nearby code), be enforced by the controller responsible for continuation, and
  be **deterministic rather than model-dependent** — i.e. don't rely on the model to decide to
  stop. This is a direct, general argument *for* this project's own existing code-enforced
  escalation gate (doc 10/11) over a purely prompted "stop repeating yourself" instruction, and
  by extension for building a deterministic near-duplicate detector rather than a prompted one.

This paper does not specifically address *near*-duplicate (semantically-same,
textually-different) detection — its unit of analysis is "is there an effective bound at all,"
not "is the bound fine-grained enough to catch paraphrasing." That gap is real and unaddressed
by this source.

### Named techniques for near-duplicate detection specifically

No peer-reviewed or vendor-official source was found describing a named, production-proven
near-duplicate tool-call detector with concrete parameters. What follows is real, but sourced
from practitioner blog posts and open GitHub issues/PRs — **flagged explicitly as lower-confidence
secondary sources**, not verified against the frameworks' actual shipped code, and in the case
of the `dev.to` posts, several came from a single prolific author writing many near-identical
"agent loop" articles in quick succession — a pattern consistent with SEO/content-mill writing,
not peer-reviewed or framework-maintainer-authored guidance. Treat the specific numbers below
as directionally real, not verified:

- **Normalized-fingerprint + repeat-count**: hash `(tool name, normalized arguments, result)`
  and halt after 2-3 repeats, with a normalization step (case-folding, whitespace, light
  stemming) before hashing so that reordered/reworded near-duplicates still collide. ([oneuptime
  blog](https://oneuptime.com/blog/post/2026-09-12-detect-tool-loops-dead-ends-production-agents/view),
  [dev.to "Session-Scoped Tool Call Deduplication"](https://dev.to/mukundakatta/session-scoped-tool-call-deduplication-stop-your-agent-from-doing-the-same-thing-twice-15cp))
- **Structural + semantic combined detection**: tool name + argument *types* as the structural
  signal, paired with Jaccard similarity over the tool's *output* (not just the query text) as
  the semantic signal, to catch paraphrased-query loops that still return near-identical
  results. (Same sources as above.)
- **Threshold reported to hold up without false positives in practice**: "3 duplicate/related
  calls within a bounded window" before escalating — directionally the same shape as this
  project's own `CAPABILITY_CROSS_MODULE_BLOCK_AFTER=2`, calibrated independently. Worth noting
  as convergent evidence the "escalate after 2-3" order of magnitude is a reasonable range, not
  proof either number is optimal.
- **Recovery pattern**: injecting an explicit system message after N near-duplicates telling the
  model to commit to an answer or stop, reported (unverified, single source) to reliably break
  the loop without confusing the model. This is a real, close match to what this project's own
  doc 11 addendum *already observed happening*: `features` recovered cleanly and finished
  naturally after being hit with `blocked: true` — a real, first-party data point that lines up
  with this external (lower-confidence) claim, worth treating as mutually corroborating.

**Real, open GitHub evidence the exact gap this project found is recognized elsewhere, not
project-specific:**
- [`deepset-ai/haystack` issue #11588, "Cache tool results inside Agent loops (avoid duplicate
  identical tool calls)"](https://github.com/deepset-ai/haystack/issues/11588) — a real,
  currently-open feature request in a maintained framework for *exact*-duplicate caching (i.e.
  where this project already was before doc 09/10/11's fix) — confirms this is a genuinely
  common, still-unsolved-by-default gap in real frameworks, not unique to this project's stack.
- [`Jamie-BitFlight/claude_skills` issue #2097, "feat: Add semantic (paraphrase) deduplication
  to research-curator entry creation"](https://github.com/Jamie-BitFlight/claude_skills/issues/2097) —
  a real, open request for *exactly* the near-duplicate/paraphrase-detection capability this
  project's doc 11 note found missing, in an unrelated project. Real, direct confirmation this
  is a recognized, unsolved, cross-project gap — not evidence of a solution, but strong evidence
  the problem is real and general.

**Semantic caching / embedding-threshold precedent, with a concrete number worth comparing
against this project's own calibration**: a real, inspectable PR
([`Oluwaseyi89/queue-as-a-service` PR #17, "embedding-similarity dedup and routing"](https://github.com/Oluwaseyi89/queue-as-a-service/pull/17))
collapses near-duplicate agent tasks at **cosine similarity ≥ 0.95** (i.e. cosine *distance* ≤
0.05). This project's own real, live-calibrated `CAPABILITY_CROSS_MODULE_MARGIN` is **0.05**
(doc 11, Phase 3) — for a different purpose (cross-module escalation gap, not direct
near-duplicate detection) but the same order of magnitude on the same underlying embedding-
distance scale. Worth flagging as a real, independent data point in the same range, not proof
0.05 is the right threshold for a *new* near-duplicate-query detector specifically.

### Concrete technique, stated for a future build session

If this project builds a near-duplicate detector: **embed each `search_facts` query string
(reusing the query embedding already computed for the real search, zero extra Vertex spend —
same pattern already used for the cross-module signal), and maintain a per-capability list of
prior query embeddings. On each new query, compute cosine distance to the closest prior query
in the same capability; if distance falls under a calibrated threshold (0.05-0.10 is the real
range found across the sources above) N times in a row (2-3, per both this project's own
calibration and the external convergent evidence), escalate the same way the existing
cross-module gate already does** — reusing shipped machinery rather than building a new
mechanism. This is a synthesis of what was found, not a recommendation to build it now.

## 2. Reasoning-continuity state across providers: does it grow unbounded, and is that known?

### Gemini: "thought signature" — confirmed real term, confirmed real, acknowledged bloat bug

Confirmed the official term directly from [Google's own docs, "Thought signatures" (Gemini
Generate Content API)](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures):
an "encrypted representation of the model's internal thought process," used to preserve
reasoning continuity across multi-turn/multi-step function calling. **Mandatory for Gemini 3
function-call turns** — omitting it is a 400 validation error, not just a quality
degradation. Behavior differs by call shape: in parallel function calls (one response, multiple
tool calls), only the *first* call carries a signature; in sequential multi-step calls, *every*
call carries one and all must be resent. **The official docs give zero guidance on signature
size, growth, or pruning** — this absence is itself a real, checked finding, not an assumption.

**Real, independently-confirmed bug matching this project's own observation almost exactly**:
[`google-gemini/gemini-cli` issue #20933, "Incorrect 'input token count exceeds maximum' due to
metadata bloat from thoughtSignature"](https://github.com/google-gemini/gemini-cli/issues/20933) —
fetched directly. Reports that in long sessions, "hundreds of `thoughtSignature` fields"
accumulate in curated history, adding "hundreds of thousands of non-essential tokens," pushing
requests over the 1,048,576-token hard limit **while the user-visible context was only ~13%
utilized**. **Google closed this as a duplicate of issue #11507** — i.e. acknowledged as a known,
already-tracked problem, not a novel one-off. Proposed community fixes: selective stripping of
signature metadata from *past* (non-current) turns while preserving the current turn's, dropping
redundant thought parts, and a 20,000-token safety buffer before triggering compression. This is
the same failure shape this project found live (doc 11 note: ~23KB baseline → ~313KB sustained
for 3 turns, ~940KB total excess, 3-5x input-token inflation) — a real, external, primary-source
confirmation this is a known Gemini-specific mechanism, not something specific to this project's
setup or a one-off fluke.

A second, related real issue: [`BerriAI/litellm` #41534](https://github.com/BerriAI/litellm/issues/41534)
reports thought-signature data leaking into unrelated fields (`tool_call.id`) when routing
through non-Gemini-native paths, causing separate downstream failures — different mechanism,
same root cause (the signature blob is large and handled inconsistently across the ecosystem).

**Not established anywhere in this research, and not established in this project's own doc 11
either**: whether near-duplicate query loops *cause* signature bloat, are *caused by* it, or
both stem from a third factor. No external source discusses these two phenomena together at
all — this project's own co-occurrence (same 3 turns, same capability, 2026-09-21) appears to be
a genuinely novel local observation, not something corroborated or contradicted by anything
found this session. Stated plainly as a real gap in current knowledge, not resolved here.

### Claude: "thinking block" `signature` — narrower requirement, model-dependent growth, officially prunable

Confirmed from [official Claude docs, "Extended thinking"](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
(fetched in full) and search results on the related "thinking" overview page:

- The `signature` field on a thinking block is opaque/encrypted, used for verification, and
  **portable across Claude API, Amazon Bedrock, and Vertex AI** — a real, explicit cross-platform
  compatibility guarantee neither Gemini's nor OpenAI's docs make about their own continuity
  tokens.
- Resending is **only strictly required when combining thinking with tool use**, not for every
  thinking-enabled turn — narrower than Gemini's "mandatory on every function-call turn" rule.
- **Growth is explicitly model-dependent, not universal**: Claude Opus 4.5 and models numbered
  4.6+ *keep* prior turns' thinking blocks in context and bill them as input tokens; Claude
  Sonnet 4.5, Haiku 4.5, and earlier models *strip* them automatically. This is a real,
  documented architectural difference within Anthropic's own model lineup, not a single
  universal behavior.
- **Officially documented pruning path exists**, unlike Gemini: callers can request
  `display: "omitted"` (signature still carries the full encrypted content for continuity, but
  the visible `thinking` text is empty, saving context display cost), and for advanced
  truncation, the docs state explicitly: everything between the last user message and the
  tool-call/response must stay untouched, but content *before* that span can be trimmed by the
  caller.
- No external bug report or GitHub issue matching Gemini's bloat pattern was found for Claude in
  this session's searches. This is a real negative result — it may mean the model-dependent
  stripping behavior genuinely prevents the problem on most models, or it may simply mean it's
  less publicly reported. Not distinguished here; stated as an open gap, not a conclusion.

### OpenAI: "reasoning items" with `encrypted_content` — similar shape, different failure mode found

Confirmed from the [official OpenAI reasoning-models guide](https://developers.openai.com/api/docs/guides/reasoning)
(fetched in full):

- In **stateful mode** (`previous_response_id`), the server handles continuity automatically —
  the caller never resends anything.
- In **stateless mode** (`store: false`, or Zero Data Retention orgs), the caller must replay
  every reasoning item, function-call item, and function-call-output item since the last user
  message, each carrying `encrypted_content`.
- **Officially documented pruning path, same shape as Claude's**: "for advanced use cases...
  truncating and optimizing parts of the context window... just ensure all items between the
  last user message and your function call output are passed into the next response untouched."
- Sizing guidance given directly: reserve **≥25,000 tokens** for reasoning + output as a starting
  point — a real, concrete, vendor-stated number, not something Gemini's docs provide an
  equivalent of.
- **A different real failure mode was found, not a size-bloat one**: the encrypted reasoning
  item is **organization/backend-bound** — decryption fails if a later turn is routed to a
  different backend than the one that minted it. Confirmed from two real, independent GitHub
  issues: [`theagentrouter/agent-router` #2451, "Portable Reasoning Across Responses API
  Backends"](https://github.com/theagentrouter/agent-router/issues/2451) and
  [`achieveai/LmDotnetTools` #769, "Responses provider never replays reasoning items"](https://github.com/achieveai/LmDotnetTools/issues/769).
  Not directly relevant to this project (single-backend Vertex usage), but a real, concrete
  reminder that "state that must be resent" carries provider-specific coupling risks beyond
  pure size.

### Direct comparison table (the specific thing this prompt asked to prioritize)

| | **Gemini** (`thoughtSignature`) | **Claude** (`signature` on thinking block) | **OpenAI** (`encrypted_content` on reasoning item) |
|---|---|---|---|
| Must resend every turn? | Yes, mandatory on every function-call turn (Gemini 3); 400 error if omitted | Only when thinking + tool use are combined | Only in stateless/ZDR mode; automatic in stateful mode |
| Officially size-bounded or documented growth behavior? | **No** — docs give no guidance at all | Model-dependent: newer models (Opus 4.5, 4.6+) keep/bill it; older models strip it automatically | Not size-bounded, but a concrete sizing reservation (≥25K tokens) is officially stated |
| Caller-controlled pruning documented? | **No** — no official trimming guidance found | **Yes** — `display: "omitted"` + explicit "everything before the untouched span may be trimmed" guidance | **Yes** — same "everything before the untouched span may be trimmed" guidance, nearly identical wording to Claude's |
| Real, acknowledged bloat/latency bug found? | **Yes** — `gemini-cli` #20933, Google-acknowledged duplicate of a tracked issue, hundreds of KB of accumulated signatures blowing a 1M-token limit | No matching report found (real negative result) | No matching report found; different failure mode found instead (cross-backend decryption breakage) |
| Cross-platform portability stated? | Not found either way | **Yes, explicitly** — same value works across Claude API/Bedrock/Vertex | Explicitly **not** portable across backends (real bug reports above) |

**The single clearest, most directly load-bearing finding for this project's problem 2**:
Gemini is the only one of the three where (a) resending the full blob every turn is mandatory,
not optional, (b) there is zero official guidance on pruning it, and (c) there is a real,
Google-acknowledged bug report describing exactly this project's own symptom (accumulated
signature metadata silently consuming the token budget). Both Claude and OpenAI, by contrast,
officially document a safe truncation boundary (their wording is nearly identical: keep
everything between the last user message and the tool response untouched, trim what's before
it). This is real, useful, and specific: it means "ask Gemini/Vertex support or docs for an
official safe-trim boundary" is a real, concrete thing to try that the other two providers
already give their callers by default — not available in Gemini's current public docs, but
plausibly the shape of a real upstream fix or feature request.

## 3. Turn/step budgets beyond a flat cap: diminishing-returns and early-stopping patterns

This project's own doc 27 and doc 34 already establish, with real numbers, that (a) citation
value is concentrated in specific fact *kinds*, not spread evenly, and (b) 93.8% of eventually-
cited evidence is discovered by call #12, with the back third of the turn budget (43% of all
turns) contributing only 6% of value, and that the existing `skill.v3.md` rule (stop at 70% of
budget) is *well-calibrated but not reliably followed*. Both are treated as given here, not
re-derived.

### A concrete, real, named technique for detecting the flattening directly

**[arXiv 2606.27009, "Semantic Early-Stopping for Iterative LLM Agent Loops: A Judge-Efficient
Study of When to Halt"](https://arxiv.org/html/2606.27009v1)** — fetched and read directly.
Real, concrete method:

- Each iteration's output is embedded (384-dim, L2-normalized, frozen local embedding model —
  cheap, no LLM call).
- Per-round semantic distance: `d_t = 1 − cos(e_t, e_{t-1})`.
- Halt when `d_t` stays under a threshold **ε = 0.06** for a **patience window of k = 2
  consecutive rounds** — i.e. two rounds in a row where the new output barely moved
  semantically from the last one.
- Real, measured result on a held-out test split (N=60): a judge-free version of this policy
  (`entropy_only`) achieved **38% operational token reduction at quality parity** (ΔInformation
  Score = −0.004, p = 0.81 — not statistically distinguishable from no reduction in quality).
- **A real, important negative/counter-intuitive finding, worth carrying forward directly**:
  consulting an LLM-as-judge *every round* to decide whether to stop (`full cascade`) was
  **counterproductive — it cost +129% tokens**, because the judging overhead outweighed the
  savings. The judge-free, pure-embedding-distance signal was strictly better in this study.

This is directly transferable in shape (not literally, since this project's agent produces tool
calls and evidence, not iterative drafts) to a concrete alternative or supplement to the flat
70%-of-budget rule: **track the embedding of each turn's newly-retrieved evidence (or of the
`search_facts` query itself) and halt/downgrade once consecutive turns stop moving the
embedding meaningfully** — a directly measurable, code-enforced analogue of what doc 34 already
found by hand (value flattens after call ~12). The real, load-bearing lesson from this paper for
this project specifically: **don't add a per-turn LLM-judge check to implement this** — the same
paper that motivates the idea also found that doing so is a real, measured net loss.

A second, related paper — **[arXiv 2606.11522, "Search Discipline for Long-Horizon Research
Agents"](https://arxiv.org/pdf/2606.11522)** — was fetched but yielded a lower-resolution
summary than the semantic early-stopping paper: it independently confirms diminishing returns
with search depth and recommends "stop when the metric cannot separate candidates" and tracking
whether successive iterations produce genuinely distinct results vs. reproducing prior ones, but
did not yield a specific threshold or formula comparable to ε=0.06/k=2 above. Cited as a second,
independent confirmation that diminishing-returns-based stopping is a real, active area, not as
a second concrete algorithm — this distinction is worth keeping honest rather than presenting it
as equally specific.

### Vendor framing (Anthropic's own guidance, not turn-budget-specific but directly relevant)

[Anthropic's "Effective context engineering for AI agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
and ["Building Effective AI Agents"](https://www.anthropic.com/engineering/building-effective-agents)
(both real, official Anthropic engineering posts, confirmed via search, not fetched in full this
session) frame context as a finite resource with diminishing/negative returns from over-filling
it, and recommend finding "the smallest set of high-signal tokens" rather than exhaustive
gathering, plus adding agentic complexity only once a specific, measured limitation is
identified. This is architecture philosophy, not a specific halting algorithm — it doesn't give
a threshold the way the semantic early-stopping paper does, but it's a real, primary-source
argument (from the same company whose models power this Claude Code session, worth noting as a
relevant vendor voice even though this project's own agent runs on Gemini) that this project's
own doc 34 finding (steep value dropoff after ~60% of budget) is not an idiosyncrasy — it's the
expected shape of what happens when an agent keeps pulling context past the point of marginal
value, described independently by a model vendor's own engineering guidance.

## 4. Parallel fan-out under a shared rate limit (lighter pass)

Real, named patterns found for running independent agent branches concurrently against one
rate-limited endpoint:

- **Token-bucket client-side throttling**: fill a bucket at a fixed rate; each request consumes
  a token; a *shared* bucket (in-process across coroutines, or Redis-backed for cross-process
  workers) prevents combined bursts from multiple concurrent branches exceeding the real quota —
  described consistently across multiple real sources ([dev.to, "Token-Bucket Rate Limiting for
  LLM Calls"](https://dev.to/mukundakatta/token-bucket-rate-limiting-for-llm-calls-dont-429-your-own-agent-3bn4);
  general pattern also referenced in Google's own Vertex AI Agent Engine context). Directly
  relevant if this project's 5 capabilities were ever run concurrently against one Vertex AI
  project's shared quota.
- **Semaphore/concurrency-limited fan-out**: bound the number of *simultaneously in-flight*
  branches (not the rate, the concurrency) via an `asyncio.Semaphore` or thread-pool size —
  distinct from, and often used together with, token-bucket throttling (one bounds concurrency,
  the other bounds rate). Google's own Agent Development Kit (ADK) is described as handling
  "multiple I/O-bound requests (like LLM or tool calls) simultaneously" for async agents,
  confirmed via search of Google Cloud's own multi-agent architecture material, though not
  fetched in full this session — real but lower-confidence sourcing than the fetched items
  above.
- **Named academic framing for the specific "many agent branches, one shared rate-limited
  endpoint" problem**: [arXiv 2604.17111, "HiveMind: OS-Inspired Scheduling for Concurrent LLM
  Agent Workloads"](https://arxiv.org/html/2604.17111v1) — found via search, **not fetched in
  full this session**, so treated as a lower-confidence pointer, not a verified summary. Per
  the search snippet, it proposes five OS-inspired scheduling primitives for exactly this
  situation: admission control, rate-limit tracking, AIMD backpressure with circuit breaking,
  token-budget management, and priority queuing. Worth a full read in a future session if this
  project seriously pursues parallelizing its 5 capabilities — flagged, not verified here.

**On the specific, real quota contradiction this project found** (a documented "5/minute"
default for `gemini-3.5-flash` on Vertex AI, contradicted by a real sustained 11-18 calls/minute
with zero `429`s): checked directly against
[Google's own official rate-limits page](https://ai.google.dev/gemini-api/docs/rate-limits) —
**real negative result**: the page explicitly states exact RPM/TPM numbers are **account- and
project-specific**, visible only via the AI Studio / Cloud Console dashboard, and are not
published in the docs for any specific model SKU. The numbered tiers the docs *do* publish
(Free / Tier 1 `$10`-per-10-min / Tier 2 `$50`-per-10-min / Tier 3 `$200`-per-10-min, spend-based
on a rolling 10-minute window) are for the **Gemini API / AI Studio** product, not Vertex AI
enterprise project quotas, which are a structurally different quota system per Google's own
product split (confirmed by the same fetched page). This is a real, plausible explanation for
the project's own contradiction: **whatever "5/minute" number was found earlier this project's
session was most likely read from the wrong product's docs/dashboard (AI Studio free tier, or a
stale/cached console value) rather than Vertex AI's actual enterprise project quota for that
specific model** — not confirmed with certainty (would need this project's own Vertex quota
console screenshot to fully resolve), but a real, sourced, plausible resolution rather than an
unexplained contradiction. Worth a two-minute direct check of the real Vertex quota console
before spending more research time on this specific sub-question.

## Explicitly not done here

- No fix designed, built, or recommended as final — per the prompt's own instruction, this
  surfaces real options with real tradeoffs; a future investigate/decide/build session (this
  project's own established pattern) makes the call.
- The `dev.to`/blog-sourced material in sections 1 and (partly) 4 is real but explicitly
  lower-confidence — treated and labeled as such throughout, not silently blended with the
  academic/official-docs sources.
- HiveMind (§4) was found via search snippet only, not fetched and read in full — flagged, not
  presented as a fully verified summary.
- The causal question of whether near-duplicate query loops and thought-signature bloat are
  related (co-occurred once, in this project's own data, 2026-09-21) was searched for directly
  and found nowhere in the external literature — genuinely unresolved, not glossed over.
- The Vertex AI quota contradiction (§4) is given a plausible real explanation, not a confirmed
  one — resolving it fully needs a direct look at this project's own Vertex quota console, not
  more web research.
- No `mcp-server/agent-poc/*.ts` files were touched, run, or tested this session, per the
  prompt's explicit instruction. No git add/commit run.

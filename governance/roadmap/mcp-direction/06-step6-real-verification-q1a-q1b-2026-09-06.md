# Step 6 — Real Verification: Does One Agent Persona Close Both Q1a and Q1b? — 2026-09-06

**The decisive test named in `01-mcp-tool-server-tasklist.md`'s Step 6:** does `atomic-prd-agent`, reasoning for itself with the three MCP tools, produce evidence and a proposal that closes **both** Q1a's and Q1b's gaps at once — the thing no single hardcoded pipeline configuration managed this session (`RESULT_LIMIT` closed part of Q1a; the reranking test closed Q1b in isolation; neither closed both together in one config).

**Real, positive result: yes, both closed, in one persona, no query-specific tuning.**

## What was run

Real Vertex AI calls (`gemini-3.5-flash`, `test-ai-oskey-io`, `global` — same already-proven project/model as `_shared/technical-proposal.ts`), flagged to and approved by the user before spending anything:

1. A cheap synthetic smoke test (one forced `search_facts` call) — confirmed the tool-calling loop and structured output work mechanically. ~5.7K tokens.
2. The real Q1a request (exact wording, `01-qa-vision-and-examples.md` Section A item 1a).
3. The real Q1b request (exact wording, same doc, item 1b).

## Real problems hit along the way, and how they were actually resolved

- **Q1a's first attempt aborted**: `ABORTED: Exceeded maximum tool call iterations (12)`. Real finding, not a bug: 12 was an under-budgeted guess for a genuine breadth question. Raised to 25 (headroom above the ~9-call average GitHub Copilot's own telemetry reports for "Deep-loop read" sessions, cited in `adr-007.md` §1b) — re-run succeeded in 15 calls.
- **Q1b's first attempt hit a real `429 RESOURCE_EXHAUSTED`** from the embedding endpoint after 16 real tool calls. Per the user's direct instruction not to guess at sleep durations, queried the actual Vertex AI quota via the Service Usage API (`consumerQuotaMetrics`) before doing anything else: `gemini-embedding-2`'s real per-minute request quota in `global` is **60,000/min** — nowhere near what a few dozen sequential calls would hit. Confirmed this was a transient backend condition, not a real quota this project was exceeding, so the correct fix was retry-with-backoff, not throttling around a real limit. Added a scoped 429-only retry (2s/4s/8s backoff, 4 attempts) to `_shared/embedding-adapter.ts`'s `embedOne` — benefits every caller of `search()`, not just this agent.
- **Q1b's second attempt** (before the retry fix landed, after a blind 120s wait) got past the transient 429 on its own but **genuinely exhausted 25 turns without producing a final answer** — a real, separate finding: Q1b needs meaningfully more real exploration than Q1a did, consistent with this project's own prior measurement that Q1b's target fact needed rank ~96 (vs. Q1a's ~22) under pure vector search.
- **Q1b's third attempt**, with the retry fix in place, succeeded in **20 of 25 available turns** — real, but not comfortable headroom (5 turns to spare). `maxTurns: 25` is a real, working default for this corpus/persona/model combination, not a settled ceiling — a genuinely harder future query could still need more, and this hasn't been stress-tested beyond these two cases.

## Real, direct comparison

### Q1a (`add-ownernonresident-inhabitanttype`)

| | Hardcoded pipeline (`generate-atomic-prd.ts`, recorded 2026-09-05) | Agent (`atomic-prd-agent`, this run) |
|---|---|---|
| Angular UI surfaced? | Yes — `OSKCreateOrganizationInhabitantComponent`'s `formControlName` fact, as evidence **#26** (a call-graph neighbor, reached via a single `FIELD_BINDING` edge that only works because `RESULT_LIMIT` was manually raised to 25) | Yes — same real component, found independently via `getInhabitantTypeLabel` (a different real method), plus 2 more real call sites (`OrganizationInhabitantsListComponent`, `OrganizationInhabitantDetailsComponent`) the hardcoded run's evidence list never surfaced |
| Real tool/query calls | 1 fixed `search()` call + 1 `expandWithGraphNeighbors` call, both hardcoded into the script | 15 real, self-directed tool calls (`search_facts` with progressively narrower/adjacent phrasing, `walk_cluster`) |

### Q1b (`assign-building-unit-to-ownernonresident`)

| | Hardcoded pipeline (recorded 2026-09-05) | Agent (this run) |
|---|---|---|
| Angular UI surfaced? | **No** — documented as "a real, honest negative result, unchanged": 25 anchors + 7 graph neighbors, **all Firebase-side**. Confirmed again just now by re-reading the actual saved file — all 32 Layer 2 items are `firebase-oskey-dev`, zero Angular facts. | **Yes** — all 3 real Angular components (create form, list, details), plus the exact `formControlName` control fact |
| Number of real options for "assign a unit" | **One** (extend `addInhabitant` + `OSKAdminInhabitantUserService.addInhabitantToUnit`), despite Q1b's business text explicitly asking "if more than one option, report on all options" | **Three**, explicitly enumerated: (1) PGO Create-Inhabitant/onboarding-card flow, (2) the invitation flow (`createBuildingInhabitantInvitation`), (3) Admin Portal direct assignment |
| Real constraints found | The `['tenant','resident'].includes(...)` exhaustive check in `addInhabitant` | The same exhaustive check, **plus** a real constraint the hardcoded run never found at all: `addInhabitant` also registers the inhabitant in physical building intercoms (`OSKBuildingIntercomService.addInhabitantInAllIntercoms`) — a genuine, non-obvious side effect a non-resident owner shouldn't necessarily trigger |
| Real tool/query calls | Same 2 fixed calls as Q1a — no mechanism to search further when the first pass came up short | 20 real, self-directed tool calls, including walking outward from several different genuine candidate flows before converging |

## Why this is the real, decisive result Step 6 was designed to test

The hardcoded pipeline needed **two different, incompatible fixes** to get this far at all — `RESULT_LIMIT` raised from 10 to 25 (closes part of Q1a, admits it "does NOT fix the deeper Q1b-shaped gap"), and a separate reranking experiment that closed Q1b in isolation but was never wired into the production pipeline. No single hardcoded configuration ever closed both. **One persona, with no query-specific tuning, closed both in this run** — by deciding for itself, per query, how many times to search and from how many angles, exactly the mechanism ADR-007 predicted (§1f: "reranking, query decomposition... collapse into the agent's own reasoning process... once an agent replaces a hardcoded pipeline").

## Real, honest caveats — not glossed over

- **Two real runs, not a statistically robust sample.** `gemini-3.5-flash` at `temperature: 0.2` is not fully deterministic; a re-run could behave differently. This is a real, positive existence proof, not a claim that this persona reliably closes every future query on the first try.
- **`maxTurns: 25` needed twice-raised and still isn't comfortably safe** — Q1b used 20/25. A genuinely harder real query could still hit the cap. Worth watching, not yet worth over-provisioning further without more real cases.
- **Real cost, for the record:** Q1a's successful run: 118,626 total tokens (62,910 of them Gemini's own "thinking" tokens). Q1b's successful run: 93,482 total tokens (72,098 cached). Both cheap in absolute terms on `gemini-3.5-flash`, but real, and non-trivial compared to the technical-proposal.ts call's typical single-shot cost — a multi-turn agent genuinely costs more per request than the hardcoded pipeline's one fixed LLM call, which is a real tradeoff worth keeping in view, not just a mechanical detail.
- **Format difference, deliberate, not a bug:** the agent cites raw `fact_id`s directly; the hardcoded pipeline cites fixed Layer-2 display numbers (`#26`). Documented in the persona itself (`atomic-prd-agent-persona.md`) as a real, structural consequence of dynamic evidence-gathering, not an oversight.

## Real code changes made as part of this verification

- `_shared/embedding-adapter.ts`: added scoped 429-retry-with-backoff to `embedOne`, driven by real quota data, not a guess — benefits `search()`'s existing callers too (`generate-atomic-prd.ts`, `sync-facts.ts`).
- `mcp-server/agent-poc/atomic-prd-agent.ts`: `maxTurns` raised 12 → 25; live per-tool-call console logging added so a future failure (turn-limit or otherwise) still shows real intermediate signal instead of losing it all.

## Status against the tasklist

**Step 5: done** (persona + standalone agent built and run for real). **Step 6: done, with a real positive result** — both Q1a and Q1b close in one persona. Steps 3/4 (Cloud Run, Gemini Enterprise registration) remain benched per the earlier sequencing decision, now on genuinely stronger evidence that the core architecture works, not just the plumbing.

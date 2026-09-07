# Findings So Far — Consolidated State of Play — 2026-09-06

**Purpose:** the user asked to stop live-discovering and consolidate — "document all the findings we have unearthed here and then decide on some decisions." This pulls together everything built, tested, and discussed today (`01-`–`08-...md`, both market-research passes) into one real state-of-play, plus a clean list of the real decisions still needing an actual answer. **This is a consolidation, not itself a decision doc** — the next real step (owned by the parallel session, `level-5-engineering-knowledge-e2`) is an ADR (`adr-008`) turning the genuinely-settled parts of this into a real architectural record, using this doc as input.

---

## 1. What's actually built and verified today

- **Steps 1-2 (MCP tool server)**: three tools (`search_facts`, `get_graph_neighbors`, `walk_cluster`) built with Genkit's MCP plugin, tested end-to-end over real stdio MCP protocol (a spawned client, not direct function calls) — `04-step1-2-mcp-server-built-and-verified-2026-09-06.md`.
- **`walkBoundedCluster()` real prerequisite closed**, including a genuine new finding: a high-fan-out hub node (`OSKLoggingService.logError`, 534 real edges) saturates the size cap in one hop, `truncated: true` with no reason surfaced to the caller — deliberately deferred to the agent-persona layer, not fixed in the tool — `03-walkboundedcluster-real-verification-2026-09-06.md`.
- **Steps 5-6 (first persona, real decisive test)**: `atomic-prd-agent` run for real against the actual Q1a/Q1b business requests. **Real, positive result: one persona, no query-specific tuning, closed both gaps the hardcoded pipeline never closed together.** Q1b in particular surfaced real Angular UI evidence and three real assignment options the hardcoded pipeline's own recorded output never found — `06-step6-real-verification-q1a-q1b-2026-09-06.md`.
- **Two real infra problems hit and fixed properly, not papered over**: an under-budgeted `maxTurns` (12→25, with live per-tool-call logging added so a future cap-hit still shows signal), and a transient embedding-endpoint `429` — fixed with a real, quota-data-driven retry-with-backoff in `_shared/embedding-adapter.ts` (checked the actual Vertex AI quota via the Service Usage API before writing any retry logic, not a guessed sleep duration).
- **Real output location wired up**: `output/agent-runs/prds/` (sibling to `output/atomic-prds/`, the hardcoded pipeline's untouched comparison baseline), with a real `Snapshot freshness` header (live-queried from `extraction_runs`, matching the existing pipeline's convention) — `07-agent-output-location-2026-09-06.md`. The real Q1a/Q1b outputs are backfilled there as `test/` runs.

**Deliberately benched, not a gap**: Steps 3-4 (Cloud Run deployment, Gemini Enterprise registration) — real, explicit decision to prove the architecture locally first before spending on cloud deployment.

---

## 2. Real external validation, from two live market-research passes

**Pass one** (`04-findings-document-types-2026-09-06.md`, dev/codegen tooling): `prose`, checkable lists, and `user-stories` are real, independently-converged content shapes (GitHub Spec Kit, ChatPRD) — not this project's invention. No common cross-vendor document *schema* exists; convergence is only at the content-kind level, validating the small-fixed-set approach directionally. The `cited-claim` discipline (per-claim `fact_id` citation) was **not** found in dev tooling — initial framing: this project is ahead of common practice.

**Pass two** (`06-findings-product-team-artifacts-2026-09-06.md`, broader PM tooling): **corrects** pass one's framing. `punt-labs/prfaq` (an open-source, evidence-grounded PRFAQ generator: "a document without evidence is fiction," per-claim biblatex citations, a dedicated risk-assessment-with-evidence section) and the research-synthesis tooling world ("link every requirement back to the exact quote/timestamp") both independently converge on the same discipline, outside dev tooling. **Corrected framing: not "ahead of the market" — applying a real, converged-on discipline to a domain (code facts) nobody else has applied it to yet.** This is on top of, and independent from, `cited-list`'s internal validation (reused across `technicalProposal` and `constraints` in the real Q1a/Q1b output) — doubly confirmed now, internally and externally.

Also from pass two: **Allstacks Product Studio**'s "adversarial review findings" (scores a proposed spec against feasibility/capacity/security/rework-rate before greenlight, its own materials call it a pre-mortem) softens pass one's honest negative on impact-analysis-as-a-market-pattern. Resolved, after a real cross-session disagreement checked directly against the source wording: maps to `impact-analysis-agent` (a gate on one specific proposed change is inherently per-request), not `corpus-stability-agent` (an ambient scan with no proposed change in the loop). One real vendor, not a trend.

**Independently reassuring, not a correction**: research-synthesis tooling's own honest caveat ("insights never making it into a product decision") confirms this project's real, hard-won retrieval work (the `RESULT_LIMIT` tuning, two failed hybrid-retrieval experiments, the reranking test, today's agent-driven search) was solving the actual hard problem in this class of system, not a self-inflicted one.

**Non-actionable but real context**: Amazon's own AWS VP of agentic AI says prototypes are now faster to build than the org's own six-page PRFAQ — a real signal that document-as-durable-interface can get partly displaced by "just build it" as agentic execution speeds up. Not evidence for building toward automated production now; a reason not to assume documents stay the durable interface indefinitely.

**Citable for a management-facing demo**: Productboard × UserEvidence (n=379, real named survey, direct-fetched not secondary) ranks top AI time-savers for PM as presentations > PRDs > competitive research > roadmaps, ~4 hrs/task saved on average.

---

## 3. Live architecture discussion — `SectionContent`/template/persona/rules (`08-...md`)

Cross-session discussion, still genuinely open, full detail in `08-sectioncontent-architecture-discussion-2026-09-06.md`. Condensed:

**Repeated agreement, not yet formalized as a decision:**
- Small, closed, composable content-kind system beats per-document-type bespoke schemas.
- Free-text fabrication-checking (exact-substring-match against real `fact_id`s already seen in tool results) beats today's field-walking validator — simpler, schema-agnostic.
- `MetaData` (and any other deterministic, code-computed content) must never be LLM-authored — the renderer must special-case it, not treat every template heading uniformly.
- Mandatory safety/consistency checks (fabrication, template conformance) belong in code, run unconditionally — not only in a persona's prompt text, which is best-effort.

**Real, validated-against-actual-data proposal, still not implemented:**
```ts
type SectionContent =
  | { kind: "prose"; text: string }
  | { kind: "checklist"; items: string[] }        // real gap found: needs a non-checkable "list" variant too
  | { kind: "cited-list"; items: { point: string; evidenceIds: string[] }[] }  // real field-naming drift: point vs constraint
  | { kind: "user-stories"; items: { actor: string; goal: string; reason: string }[] };
```
Checked directly against the real Q1a/Q1b JSON: `cited-list` validated twice already (`technicalProposal` and `constraints`, identical shape); `checklist`/`user-stories` match exactly; none of the four are structurally PRD-specific.

---

## 4. New today, not yet in any prior doc: audit-trail / compliance framing

Real user insight, both sessions agree it's sharp, not a stretch: `04-...md` found real 2026 research on agent-*action* provenance (EU AI Act / NIST AI RMF / ISO 42001-driven) and filed it as separate from this project's claim-to-`fact_id` citation discipline. Once an agent implements, not just proposes, those two things converge — an audit of "why did the agent do X" needs the same evidence chain this project already builds for "why was X proposed." **The document format is negotiable; the evidentiary chain is the actually-regulated thing.**

**Concrete, cheap, agreed-by-both-sessions next action, not yet built**: the persona/model-version/tool-call-count metadata `writeAgentOutput()` already computes as real objects (before string-interpolating into markdown) should also be written to a structured JSON sidecar alongside the `.md` file — same "make deterministic pipeline metadata structured now, decide what reads it later" shape as the checklist-verification-artifact hook already discussed. Cheap today; expensive to retrofit once something downstream parses it out of markdown prose instead.

**Explicitly kept separate**: "audit trail as a commercial differentiator" is a real narrative/demo angle worth keeping in view, not a design decision needed today.

---

## 5. Real open decisions — the actual list to work through

| # | Decision | Real options on the table | Status |
|---|---|---|---|
| A | Does the next PRD run use today's proven hardcoded `OUTPUT_SCHEMA`, or wait for a `SectionContent` migration first? | (1) Ship now on today's schema, proven on Q1a/Q1b; (2) migrate to `SectionContent` first | **Blocks moving the PRD forward — needs a real answer before Step 1 of any next session.** My recommendation: (1) — the migration is real, separate work, don't block a working, verified path on it. |
| B | `SectionContent` type refinements | `checklist`/`list` merge (`{kind:"list", checkable, items}`); `point`/`constraint` → `claim` rename | Designed, not built |
| C | Template-conformance validator | Compare `sections.map(heading)` against the template's own list, fail closed | Designed, not built |
| D | `MetaData` exclusion from LLM-authored content | Renderer special-cases it, injects real computed data | Agreed, not enforced in code yet |
| E | Rules-as-code vs. rules-as-prompt | A small set of mandatory, fail-closed validators (fabrication, template-conformance) separate from best-effort persona prompt text | Agreed in principle, not built |
| F | `impact-analysis-agent` scoping | At least 3 real variants surfaced today: (1) pre-spec scan ("what would touching X affect," before a PRD is written), (2) PRD appendix (mostly = today's `Constraints` section already), (3) post-spec scored gate (Allstacks' literal pattern — doesn't cleanly fit any current `SectionContent` kind, may need a scored/rubric shape) | **User explicitly deferred to after the PRD ships** — no action needed now beyond keeping this 3-way framing |
| G | `corpus-stability-agent` scoping | Ambient scan surfacing the real 42 cross-repo symbol ambiguities | Named future idea only, not scoped |
| H | `mcp-server/` repo-split timing | Move to root folder now (signals intent, doesn't reduce real coupling) vs. wait for a second real caller | My recommendation: wait — not yet challenged by the peer |
| I | Audit-trail structured sidecar | Write persona/model/tool-call metadata to JSON alongside the `.md` output | **Both sessions agree: cheap, ready, worth doing soon** — needs a go/no-go, not more design |
| J | Token-usage/cost line in output | Query the live Cloud Billing Catalog API at render time (free, real-time, authoritative) rather than hand-maintaining a pricing table | Designed (`05-...md` item 2), not built — one open unknown: whether Catalog API SKU granularity cleanly maps to Gemini's token categories (thinking/cached/input/output), unverified |
| K | Interactive real-client MCP check | Point Claude Code/Desktop at the local server directly | Step 2's second verification method, still open, not skipped silently |
| L | Given/When/Then mapping, if ever built | New 5th kind vs. specialization of `cited-list` | Named fork, not urgent |
| M | Persona-file format standardization | — | Deferred until 2-3 personas exist |
| N | Workflow hand-seeding (3-5 real workflows) | — | Separate track, not started |
| O | Query interface for the POC demo | Default: no custom UI, demo through an existing MCP client | Not decided, low urgency |

## 6. My own read on sequencing — a recommendation, not a decision

1. **A needs answering first** — it's the one blocking forward progress on the thing the user already said is ready to move. Recommend shipping on today's proven schema now; treat the `SectionContent` migration as its own real, separately-scoped piece of work, not a prerequisite.
2. **I and J are both cheap, ready, low-risk, and already agreed by both sessions** — good candidates to fold into whatever session next touches `atomic-prd-agent.ts`, regardless of how A/B/C/D/E resolve.
3. **F is explicitly parked by the user until after the PRD ships** — nothing to do now beyond keeping the 3-way framing so it doesn't get flattened back into one persona prematurely.
4. **B/C/D/E are one real body of work** (the `SectionContent`/template system) — worth scoping together, once ADR-008 settles which parts of this are actually decided vs. which stay open questions for a later session.
5. **G, H, K, L, M, N, O are real but not urgent** — no action needed today, just don't let them silently drop off the list.

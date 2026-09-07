# Findings — What Artifacts Are Product Teams Producing With AI, 2026/27 (Broader Pass)

Answers `05-priming-brief-product-team-artifacts-2026-09-06.md`. Deliberately wider than `04-findings-document-types-2026-09-06.md` — starts from product-management tooling itself, not dev/codegen tooling. All claims below are from live web search/fetch run 2026-09-06, cited inline; anything not found, or found only via an unconfirmed secondary source, is flagged as such rather than stated as fact.

---

## 1. Real, named AI features inside real 2026 PM tools

- **Productboard** — supports RICE/WSJF prioritization with AI-assisted scoring; no new document *type* found beyond its existing roadmap/prioritization surface. ([productboard.com/blog/using-ai-for-product-roadmap-prioritization](https://www.productboard.com/blog/using-ai-for-product-roadmap-prioritization/))
- **Aha!** — AI-assisted annual roadmap drafting ("reviewing progress, setting goals, and drafting a 2026 plan"), OKR/goal-to-initiative linking. Again, no new artifact type beyond roadmap/goals. ([aha.io/support/roadmaps/videos/tutorials/build-your-2026-product-strategy-with-ai](https://www.aha.io/support/roadmaps/videos/tutorials/build-your-2026-product-strategy-with-ai))
- **Notion AI** — the most artifact-diverse of the mainstream tools found: generates **PRDs, problem statements, initiative summaries** from prior workspace content; "Custom Agents pull context from across your workspace including research docs, feedback databases, and past roadmap decisions" to produce **planning briefs**; converts database data into a **strategic report**. Real, named, multiple artifact types — but all generated from whatever is already written in the Notion workspace, not from an extracted/structured facts index the way this project's corpus is. ([notion.com/use-case/product-management](https://www.notion.com/use-case/product-management/agile-product-roadmap), [notion.com/use-case/project-management/ai-product-roadmap](https://www.notion.com/use-case/project-management/ai-product-roadmap))
- **Linear** — Linear Insights (analytics dashboards, not documents); Linear Agent (public beta, March 2026) can "triage, answer questions, create follow-up work, and **draft project updates**" — a real, named generated-artifact type (the project update), distinct from a PRD. ([eesel.ai/blog/linear-ai](https://www.eesel.ai/blog/linear-ai))

**Read on this angle**: none of these introduce a content *kind* beyond what pass one already found (prose, list, structured summary). This confirms rather than extends pass one's schema-level finding — informative about the landscape, not new evidence for the design question.

---

## 2. PRFAQ and "work backwards" formats — real, two-sided finding

- **A real, working, open-source, evidence-grounded PRFAQ generator exists**: [`punt-labs/prfaq`](https://github.com/punt-labs/prfaq) (direct fetch). This is the single most directly relevant finding of this whole round for the `cited-claim list` design question. Its own stated position: *"A product discovery document without evidence is fiction. `prfaq` starts from your data — customer interviews, survey results, market reports, competitive analysis, usage metrics — and builds a PR/FAQ document grounded in that evidence."* It implements a three-tier evidence hierarchy (local research files → indexed documents → web search to fill gaps), and its stated discipline is explicit: **"Every factual claim includes a citation — traced back to a source, not asserted,"** producing structured biblatex citations. Its generated document includes a dedicated **"Four Risks Assessment"** section (value, usability, feasibility, viability, each with supporting evidence) and a **Bibliography** section.
- **A real, current, somewhat contrarian signal on the format's own future**: per GeekWire (2026), Amazon's own AWS VP of agentic AI, Swami Sivasubramanian, states that new coding tools have made it "easier for his teams to develop a demo with actual working software than to write the classic six-page Amazon 'PRFAQ.'" A real, dated 2026 data point that this artifact type is already being partially displaced by "just build the prototype" inside the one organization that invented it — directly relevant context (not a design input) for this project's own stated concern about a future where well-evidenced tickets move straight to implementation.

**Read on this angle, directly relevant to the design question**: `punt-labs/prfaq` is a real, independent, non-dev-tooling confirmation that per-claim evidence citation (this project's `cited-claim list` kind, almost structurally identical: real source → per-claim citation → dedicated risk/evidence section) is a genuine, converged pattern in evidence-grounded document generation generally — not a discipline unique to this project, as pass one (searching only dev tooling) concluded. Pass one's "this project is ahead of, not behind, common practice" finding should be **softened**: the discipline is real and named elsewhere, just not in the dev-tooling vendors pass one searched.

---

## 3. Synthesis-from-research artifacts

Real, named category confirmed: AI research-synthesis tools (BuildBetter, Perspective AI, Dovetail, Koji, and others) turn customer interviews/support tickets/usage data into structured outputs — a **stakeholder-interview debrief**, a **focus-group recap**, a **Jobs-to-be-Done breakdown**, or a structured PRD draft.

**Directly relevant finding**: real, named best practice in this space is the same evidence-linking discipline found in angle 2 — *"A critical factor is grounding: choose a tool that links each generated requirement back to the exact quote and timestamp it came from."* ([getperspective.ai](https://getperspective.ai/blog/jobs-to-be-done-interviews-the-ai-powered-guide-for-product-teams)) This is the *third* independent real-world confirmation this research (across both rounds) has found of "cite the literal, retrievable evidence behind each generated claim" as a real, named differentiator between tools — not this project's own invention, and not unique to code-facts corpora. The structured evidence source here is a transcript quote + timestamp rather than a `fact_id`, but the underlying discipline (traceable, verifiable, per-claim grounding, not narrative paraphrase) is the same shape this project already committed to.

Real, honest caveat found in the same search: *"Even teams that complete JTBD interviews often fail at synthesis... interviews sitting in a shared drive and insights never making it into a product decision"* — i.e., the hard part in this adjacent domain is exactly the same one this project's own retrieval work has spent real effort on: getting from "the evidence exists somewhere" to "the right evidence actually surfaces in the output."

---

## 4. Real 2026 "state of PM + AI" survey

**Real, credible, named, non-single-vendor-marketing source found and independently fetched**: *"The State of AI in Product Management"* — Productboard, in partnership with independent research firm **UserEvidence**, surveying **379 product professionals** at enterprise organizations (500+ employees). Confirmed via direct fetch: the report's own explicit ranked "top time-savers" are **creating presentations, writing PRDs, competitive research, roadmap creation** (in that order); professionals report saving an average of ~4 hours per task with AI. ([productboard.com/blog/ai-in-product-management-report](https://www.productboard.com/blog/ai-in-product-management-report/))

**Flagged, not independently confirmed**: a separate secondary aggregation (koji.so's 2026 PM-statistics roundup, reached only via search-result synthesis, not a direct fetch of its primary source) cites different specific figures — PRD writing 68%, customer feedback analysis 54%, competitive research 47% adoption. The general shape is consistent with the confirmed Productboard/UserEvidence ranking (PRD writing and competitive research both feature prominently in both), but the exact percentages should be treated as **unconfirmed by this research** — reported here for completeness, not as verified fact, consistent with this project's own discipline of distinguishing what was actually checked from what was merely surfaced by a search summary.

---

## 5. Direct attempt to falsify pass one's negative on impact analysis / risk assessment

**Real, new finding that meaningfully softens (does not fully overturn) pass one's honest negative.** [**Allstacks Product Studio**](https://www.allstacks.com/product/product-studio), launched 2026, confirmed via two independent fetches (its own product page and its PR Newswire launch announcement): a real, named, current product that draws on **"codebase, delivery history, customer voice, and strategy knowledge"** to produce three real artifact types:

1. Feature requirements/specifications grounded in the actual codebase and delivery history
2. "Readiness scored work plans" evaluating engineering feasibility
3. **"Adversarial review findings"** — an AI reviewer that scores every spec against "engineering feasibility, team capacity, security, and historical rework rates" **before work is greenlit**, explicitly described as a pre-mortem

This is functionally very close to this project's own planned impact-analysis/corpus-stability idea — a codebase-and-history-grounded assessment of what a proposed change will actually hit, produced before implementation starts — even though Allstacks does not use the literal phrase "impact analysis" or "risk assessment" as a document-type name.

Direct searches for the literal phrases **"AI-generated impact analysis," "AI-generated risk assessment," and "codebase-aware product artifact"** otherwise surfaced only generic enterprise AI-risk-governance content (ISO/IEC 42005, AI Risk Repository, vendor risk scoring) — real and current, but about assessing *AI systems* as a compliance matter, not about a product artifact that analyzes a proposed *feature's* blast radius across a codebase. That negative, narrowly, still holds.

**Honest net verdict**: the literal named category "AI-generated impact analysis as a widely-adopted product feature" still was not found. But the functional equivalent is now real, named, and current in at least one product (Allstacks). This project's planned impact-analysis persona should be described going forward as **closer to an emerging real pattern than pass one found**, not yet as a convergent, widely-adopted one — one real vendor, not a trend.

---

## What this round changes about the design question (kept brief, per the brief's own framing — this round is about the landscape, not re-doing the schema analysis)

- **`cited-claim list` gets real, independent, cross-domain validation this round** that pass one didn't find (Spec Kit/ChatPRD don't do it) — `punt-labs/prfaq`'s per-claim biblatex citations and the research-synthesis-tooling world's "link every requirement to the exact quote/timestamp" practice both do the same real discipline, in different domains than dev tooling. Update pass one's framing: this project is not inventing a discipline the market doesn't have — it's applying a discipline real elsewhere (evidence-grounded generation generally) to a domain (code facts) where pass one specifically didn't find anyone else doing it yet.
- **The impact-analysis honest negative is softened, not reversed**, by Allstacks Product Studio's "adversarial review" — a real, current, functionally-equivalent pattern, from one named vendor.
- **No new `SectionContent` kind is suggested as missing, and nothing here suggests the fixed-small-set approach is wrong.** This round, like pass one, found real tools converging on a small set of composable outputs (prose briefs, lists/checklists, cited claims, structured summaries) rather than a large bespoke taxonomy.

## Sources

- [Productboard — Using AI for Product Roadmap Prioritization](https://www.productboard.com/blog/using-ai-for-product-roadmap-prioritization/)
- [Aha! — Build your 2026 product strategy with AI](https://www.aha.io/support/roadmaps/videos/tutorials/build-your-2026-product-strategy-with-ai)
- [Notion — AI product roadmap](https://www.notion.com/use-case/project-management/ai-product-roadmap)
- [Notion — Agile product roadmap use case](https://www.notion.com/use-case/product-management/agile-product-roadmap)
- [eesel AI — Linear AI features (2026)](https://www.eesel.ai/blog/linear-ai)
- [github/punt-labs/prfaq](https://github.com/punt-labs/prfaq)
- [GeekWire — Two pizzas and a prototype: how agentic AI is rewiring Amazon's teams (2026)](https://www.geekwire.com/2026/how-agentic-ai-is-rewiring-amazons-teams-and-upending-its-traditions/)
- [Perspective AI — Jobs-to-Be-Done Interviews: The AI-Powered Guide for Product Teams](https://getperspective.ai/blog/jobs-to-be-done-interviews-the-ai-powered-guide-for-product-teams)
- [Productboard — The New Reality of AI in Product Management (with UserEvidence, n=379)](https://www.productboard.com/blog/ai-in-product-management-report/)
- [Koji — Product Management Statistics 2026 (secondary, unconfirmed figures)](https://www.koji.so/blog/product-management-statistics-2026)
- [Allstacks — Product Studio](https://www.allstacks.com/product/product-studio)
- [PR Newswire — Allstacks Launches Product Studio (2026)](https://www.prnewswire.com/news-releases/allstacks-launches-product-studio-a-context-aware-workspace-for-product-teams-building-with-ai-302786721.html)

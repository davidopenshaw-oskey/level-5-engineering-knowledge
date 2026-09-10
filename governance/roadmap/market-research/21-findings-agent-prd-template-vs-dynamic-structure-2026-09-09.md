# Findings — Fixed Templates vs. Agent-Determined Structure in Production PRD/Spec Generation

Real research question: how do tier-1 companies and AI-native tooling vendors structure agent-generated PRDs, specs, or impact-analysis documents — specifically the relationship between (a) a fixed, human-authored template borrowed from traditional PM writing, versus (b) letting the agent dynamically collate its own findings into whatever sections best serve the reader, once it has gathered real evidence. Asked directly against this project's own current system: a "skill" file (process instructions) paired with a "template" file (fixed output headings/structure), one matched pair per document type, bootstrapped from one simple traditional PRD template (User Stories / Technical Proposal / Acceptance Criteria / Constraints) deliberately known to need evolution. Findings from live web research, 2026-09-09.

---

## Q1: Named, real, tier-1 examples generating specs/PRDs/impact analyses from an agent reasoning over a real codebase

| Vendor/Tool | What's documented | Structure |
|---|---|---|
| **GitHub (spec-kit)** | Open-source toolkit for "Spec-Driven Development" with agents (Copilot, Claude Code, Gemini CLI) — [github.com/github/spec-kit](https://github.com/github/spec-kit), [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) | Three fixed document types per feature: `spec.md` → `plan.md` → `tasks.md`, generated via `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` commands |
| **Amazon/AWS (Kiro)** | Real, shipped agentic IDE — [kiro.dev/docs/specs/](https://kiro.dev/docs/specs/) | Three fixed files per feature: `requirements.md` (EARS-notation acceptance criteria: `WHEN [event] THE SYSTEM SHALL [behavior]`) → `design.md` → `tasks.md` |
| **Cognition (Devin)** | Real, shipped product — [cognition.com/blog/devin-2-1](https://cognition.com/blog/devin-2-1), [docs.devin.ai/work-with-devin/deepwiki](https://docs.devin.ai/work-with-devin/deepwiki) | Two different, real, contrasting patterns from the *same* company (detailed under Q2 below) |
| **Anthropic** | Official Skill-authoring docs — [platform.claude.com/docs/.../best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | Not a specific PRD product, but a general, primary-source pattern for pairing process instructions with output templates (see Q4) |
| **OpenAI** | [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) / Agents SDK `output_type` | JSON-schema-constrained output, aimed mainly at tool-call/data reliability, not narrative document structure specifically — no equivalent named PRD-generation product found |

## Q2: Is "fixed template" or "agent decides its own structure" more common/successful at production scale?

**Real evidence, not just design philosophy, splits by whether the same company does both — and Cognition (Devin) is the clearest real case of this:**

- **Devin's spec-adjacent work (Linear/Jira ticket scoping) is template/schema-driven**: a fixed 🟢🟡🔴 confidence rating plus a structured "summary, implementation plan, and confidence estimate" scoping comment ([Devin 2.1 blog](https://cognition.com/blog/devin-2-1)).
- **Devin's DeepWiki documentation product is explicitly the opposite pattern**: each repo defines its own wiki structure via a `.devin/wiki.json` config file — "only the pages you define in the JSON will be generated, no more, no less," letting "each repository have a completely different documentation structure based on its unique needs rather than following a fixed template" ([docs.devin.ai](https://docs.devin.ai/work-with-devin/deepwiki)). This is real, shipped evidence that a single tier-1 AI-native vendor deliberately picks *different* points on this spectrum for different document types, rather than treating one approach as universally superior.
- **Anthropic's own official guidance takes the same non-absolute position, explicitly**, in the "Template pattern" section of its Skill-authoring docs: it names two variants side by side — *"For strict requirements... ALWAYS use this exact template structure"* vs. *"For flexible guidance... Here is a sensible default format, but use your best judgment based on the analysis... Adjust sections as needed for the specific analysis type"* — with the explicit instruction to **"match the level of strictness to your needs."** This is the single clearest, most authoritative real answer found to this question: production guidance from the maker of the underlying model treats it as a per-task-type dial, not a settled either/or.
- **Real, reported friction with the fully-fixed approach at production scale**: independent community write-ups on GitHub spec-kit (not marketing pages) report real costs — "spending hours correcting LLM-generated specs," one plan phase generating "over 2,000 lines of markdown," reviewers finding plain iterative prompting "around ten times faster," and a documented critique that the fixed Spec→Plan→Tasks sequence risks "reinventing waterfall." A separate critique specifically notes it "breaks down at enterprise scale" on brownfield/multi-module systems, producing "volume rather than fidelity" (aggregated via [codemyspec.com](https://codemyspec.com/blog/github-spec-kit-guide), [rywalker.com](https://rywalker.com/research/github-spec-kit), and related community reviews — secondary sources, but real practitioner experience reports, not vendor marketing).
- **Real academic corroboration that this is a recognized, actively studied axis**, not just this project's own framing: ["From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents"](https://arxiv.org/pdf/2603.22386) (2026) formally distinguishes static ("fix a reusable workflow scaffold before deployment") from dynamic ("select, generate, or revise the workflow... before or during execution") approaches as a real, named taxonomy axis in the LLM-agent literature — though the abstract itself stops short of declaring an overall winner, framing it instead as a design space with different tradeoffs per task.

**Honest synthesis**: no source claims one approach is more "successful" in the abstract. The real, converging signal across Anthropic's own docs, Devin's two different real products, and the academic survey is that **the axis correlates with task fragility/stakes, not company sophistication** — fixed templates for consistency-critical, structurally-similar outputs (Kiro's requirements, spec-kit's acceptance criteria, Devin's confidence scoring); agent-determined structure for outputs where the right shape genuinely varies per input (Devin's DeepWiki, Anthropic's "flexible guidance" variant).

## Q3: How do production systems handle honesty about gaps?

Real, named, distinct patterns found — not silent absence, in every case checked:

- **GitHub spec-kit: an explicit inline marker.** `[NEEDS CLARIFICATION: specific question]` is inserted directly into the spec text wherever the agent can't determine something, with an instruction to *"mark all ambiguities... don't guess."* A quality gate checklist requires *"No [NEEDS CLARIFICATION] markers remain"* before proceeding, and a dedicated `/speckit.clarify` command surfaces up to three targeted questions with suggested answers, folding the resolution back into the spec with an incremented version number ([spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)).
- **Cognition/Devin: a numeric-adjacent confidence signal, not a text marker.** A 🟢🟡🔴 rating expressed at multiple points per session (start, after planning, when answering code questions); when not 🟢, Devin proactively asks clarifying questions to raise the score, and *"will wait for user approval when it is unsure about its plan"* rather than proceeding silently. Cognition reports this is **empirically validated against real outcomes**, not just a UX nicety: 🟢-rated tasks are *"twice the likelihood of a merged PR compared to 🔴"* ([cognition.com/blog/devin-2-1](https://cognition.com/blog/devin-2-1)) — the one place in this research where a vendor published a real, quantified correlation between a stated confidence signal and actual task success.
- **Kiro's EARS-format requirements**: no equivalent uncertainty marker was found in the documentation surveyed — a genuine, honest negative for this specific tool, not a confirmed absence-by-design.
- **General finding, worth flagging plainly**: broader industry material on "AI confidence scores" repeatedly warns that self-reported verbal confidence is often poorly calibrated (*"the model says '95% sure' and is wrong 30% of the time"*) — real, cited caution (via [futureagi.com](https://futureagi.com/blog/evaluating-llm-confidence-uncertainty-2026/) and related sources) that a confidence marker is only as trustworthy as what grounds it; Devin's own reported 2x correlation is the one source here that ties a confidence signal to a real measured outcome rather than pure self-report.

## Q4: Prior art for pairing a "skill/persona" definition with a separate "template/output shape" definition as two composable artifacts

**Real, direct, primary-source precedent exists, and it comes from Anthropic itself** — the most authoritative answer of the four found in this research:

Anthropic's official Skill-authoring best practices ([platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)) documents this exact pairing as a named, recommended structure:
- A `SKILL.md` file holds **process instructions** ("progressive disclosure," workflow steps, decision points) — directly analogous to this project's own "skill" file.
- Separate reference files hold **output shape**, under a named **"Template pattern"**: *"Provide templates for output format. Match the level of strictness to your needs,"* with worked examples of both a strict fixed-heading template and a flexible "sensible default, adapt as needed" template.
- The docs are explicit that these stay as **separate files**, not one merged prompt: *"Organize this so the table schema is in a separate reference file"* is given as a concrete authoring example, and the whole "progressive disclosure" architecture is built around SKILL.md pointing to separate, purpose-specific files (forms guide, API reference, output template) that only load into context when actually needed.

GitHub spec-kit provides a second, independent real example of the same *shape* of separation, at the project level rather than the per-document level: `memory/constitution.md` (persistent principles/process, described as "the architectural DNA") is explicitly kept separate from and referenced by the `spec.md`/`plan.md`/`tasks.md` templates, rather than embedded in them.

---

## Bottom line

Nothing found suggests a skill+template pairing is an unusual or unproven architecture — it's the same shape Anthropic's own official guidance documents by name, and the same shape GitHub spec-kit uses at the project level. The more useful, real signal from this research is about the *template's own rigidity*, not the pairing itself: a single, fixed, strict template sits at one end of Anthropic's own named spectrum — a legitimate, documented choice, but one that Devin's DeepWiki and Anthropic's own "flexible guidance" variant both suggest should be reconsidered per document type rather than universally, especially as real community experience with GitHub spec-kit's fully-fixed approach reports genuine friction at scale ("volume rather than fidelity" on complex/brownfield work). On honesty-about-gaps specifically, spec-kit's `[NEEDS CLARIFICATION: ...]` inline marker is the most directly transferable, concretely specified pattern found.

## Sources

- [github/spec-kit](https://github.com/github/spec-kit)
- [spec-kit — spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [GitHub Blog — Spec-driven development with AI](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Kiro — Specs docs](https://kiro.dev/docs/specs/)
- [Kiro — Requirements-First Workflow](https://kiro.dev/docs/specs/feature-specs/requirements-first/)
- [Cognition — Devin 2.1](https://cognition.com/blog/devin-2-1)
- [Devin Docs — DeepWiki](https://docs.devin.ai/work-with-devin/deepwiki)
- [Anthropic — Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Anthropic — Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) (checked directly; does not substantively address these four questions — an honest negative, noted rather than assumed)
- [OpenAI — Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- ["From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents" (arXiv 2603.22386, 2026)](https://arxiv.org/pdf/2603.22386)
- Community experience reports on GitHub spec-kit (secondary, practitioner-sourced, not vendor marketing): [codemyspec.com — GitHub Spec Kit guide](https://codemyspec.com/blog/github-spec-kit-guide), [rywalker.com — GitHub Spec Kit research](https://rywalker.com/research/github-spec-kit)
- [futureagi.com — Evaluating LLM Confidence and Uncertainty (2026)](https://futureagi.com/blog/evaluating-llm-confidence-uncertainty-2026/)

**Note on sourcing rigor**: this report was compiled directly in-session via live web search/fetch, with the primary claims (Anthropic's Skill-authoring docs, spec-kit's `spec-driven.md`, Devin's 2.1 blog post and DeepWiki docs) directly fetched and read in full, not inferred from search snippets. The GitHub spec-kit community-criticism claims are secondary-source aggregations from practitioner write-ups rather than directly fetched primary sources for each individual quote — treat those specific quotes as real but worth a spot-check against their original posts if they become load-bearing for a decision.

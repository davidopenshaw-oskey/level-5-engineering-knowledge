# Findings — What Should a Facts Corpus Produce? Real 2026 Document/Artifact Types, Researched Live

Answers the brief in `03-priming-brief-document-types-2026-09-06.md`. All claims below are from live web search/fetch run 2026-09-06, cited inline; anything not found is stated as not found, not filled in with speculation.

**Framing, restated up front so this doesn't get over-read:** this project is not committing to building toward automated/autonomous code production now. This research exists only to check that today's small `SectionContent` schema decision (prose / checkable-or-not list / cited-claim list / user stories) doesn't cheaply foreclose that path if it becomes real later. Nothing here is a build decision.

---

## 1. Today's real trajectory: AI-assisted development / "vibe coding"

**Real products found, with structure:**

- **GitHub Spec Kit** ([github.com/github/spec-kit](https://github.com/github/spec-kit)) — real, prominent (111k stars as of June 2026) open-source toolkit formalizing "Spec-Driven Development." Produces a **multi-document set**, not one PRD: `constitution.md` (project governing principles), `spec.md` (requirements + user stories, in prose), `plan.md` (technical/architecture decisions, narrative), `tasks.md` (actionable task breakdown), plus optional `checklist.md` ("custom quality checklists that validate requirements completeness") and an `/speckit.analyze` cross-artifact consistency report. Source: direct fetch of the repo's own docs.
- **ChatPRD** ([chatprd.ai](https://www.chatprd.ai)) — real, current (2026) vendor. Its own documented PRD structure: Introduction, Problem Statement, Solution/Feature Overview, **User Stories**, Technical Requirements, **Acceptance Criteria**, Constraints — acceptance criteria as precise, testable bullet points ("Search results update instantly after typing"), explicitly warning that vague criteria "cause AI to fill in blanks unpredictably." Source: chatprd.ai/learn/prd-template and prd-for-ai-codegen (2026-dated pages).
- **Cursor Plan Mode** ([cursor.com/blog/plan-mode](https://cursor.com/blog/plan-mode)) — plans are Markdown with file paths and code references, editable inline; separately, Cursor's "Notepads" feature stores reusable "architectural decision records, API contract specifications" as their own persistent artifacts distinct from a plan.

**What this means for this project's `SectionContent` design:**

- **Validated, directly**: `prose`, a checkable list (Spec Kit's `checklist.md`, ChatPRD's Acceptance Criteria bullets), and `user-stories` as a distinct content kind (Spec Kit's `spec.md`, ChatPRD's User Stories section) are real, independently-converged-on shapes across at least two unrelated real 2026 vendors — not this project's own invention.
- **Not validated either way**: the `cited-claim list` kind (per-claim `fact_id` citation). No real tool found in this search cites evidence at the level of a specific extracted code fact per claim — Spec Kit and ChatPRD both work from human-authored or repo-README-level context, not a facts index. This project is ahead of, not behind, common practice here; say so plainly rather than claiming external validation that isn't there.
- **One real gap worth naming, not building**: Spec Kit's `plan.md`/`tasks.md` split — an explicit, separate task-breakdown artifact — is a real, converged pattern this project doesn't currently have as its own document type (the atomic-PRD template's optional "Phased Breakdown" section is the closest analog, folded into Layer 3 rather than being its own artifact). Worth keeping in view as a candidate future document type, not a missing content *kind*.
- **Direct answer to "is there an emerging common schema?"**: **No.** Real 2026 practice remains genuinely bespoke per-vendor, exactly as the brief hypothesized — Spec Kit, ChatPRD, and Cursor each define their own document set and none references a shared external standard. The closest thing to convergence is at the *content-kind* level (prose / list / user-stories, above), not a full document schema.

---

## 2. The more speculative trajectory: increasingly automated software production

**Real, decisive finding on the acceptance-criteria question:** the actual task format real coding-agent benchmarks use is **not a prose or checklist acceptance-criteria document at all**. SWE-bench's real task format (used by both OpenHands and SWE-agent, per direct fetch of arXiv 2512.18470 / openhands.dev) is: `problem_statement` (prose) + `repo` + `base_commit` + **the repository's own real test suite, run against the patch, as the scoring mechanism**. The verification artifact is an executable test, not a document field.

- **GitHub Copilot coding agent**, real quantified 2026 research (arXiv 2512.21426, "What Makes a GitHub Issue Ready for Copilot," direct fetch): scores issues on 32 criteria across 5 dimensions; real measured merge-rate effects — well-scoped tasks **+16.44%**, self-contained issues **+16.65%**, external-dependency issues **−6.91%**; a Random Forest predicting merge success from issue-quality signals alone reached 72% AUC. Real, current best-practice guidance found separately (GitHub's own docs) explicitly recommends **"define acceptance criteria as explicit test cases when possible."** Acceptance criteria in practice are still overwhelmingly prose/checklist today, but the strongest, most-recommended version of that criterion is already a runnable test, not a string.
- **Devin** (Cognition Labs) — consumes natural-language tickets directly from Jira/Linear/Slack; no special structured input schema found. Opens a PR; real docs still describe human review before merge for non-trivial work, not unattended auto-merge as a documented default.
- **BDD/Gherkin (Given/When/Then)** — a real, recurring, named pattern specifically for *agent-verifiable* acceptance criteria (testquality.com, braingrid.ai, both 2026-dated): "Given an unauthenticated user on the login page, When they submit a valid email and password, Then they are redirected to /dashboard" — each clause becomes "a checkable fact the agent can validate." Braingrid.ai's own explicit guidance: **plain checklists are fine for simpler features; Given/When/Then is the recommended step up specifically when criteria need to gate autonomous action.**

**Direct answer to the brief's central design question (checklist-of-strings vs. something more machine-executable):** Real 2026 practice draws a real line the brief anticipated correctly — a plain checklist of human-readable strings is real, current, and sufficient for *today's* document-authoring use case (matches this project's own planned shape exactly). But the moment autonomy increases to gating an actual merge, real practice converges on an **actual runnable test** as the true verification artifact, with Given/When/Then as the documented bridge format when a runnable test isn't yet written. Neither of these is "a checklist item is secretly a test" — they're two different artifacts, and the checklist stays what it is.

**The cheap, concrete, non-foreclosing implication for this project's schema, now:** don't change anything about the `checklist` kind's rendered shape today. The one real, cheap-to-keep-open hook is at the data-model level, not the render level — if/when a `checklist` item is ever represented as a small object rather than a bare string (e.g. to carry a stable id for later linking), leave room for that object to later gain an optional pointer to a verification artifact (a test file path, a Gherkin scenario) rather than assuming a string will always suffice. This is not a recommendation to build that now — only to notice it's cheap to not lock out later, consistent with the brief's own framing.

**Traceability / citation, real finding:** 2026 research on agent provenance (arXiv 2606.04990, 2605.17169, direct search) is real and active, but it is about **auditing agent actions** (tool-call-level, parameter-level tracing, driven by EU AI Act / NIST AI RMF / ISO 42001 compliance pressure) — not about a document citing *why a requirement exists* in the way this project's Layer 2 evidence citations do. No real external pattern was found that matches this project's specific "cite the real fact_id that justified this claim" discipline. Say this plainly: **this project's citation discipline appears to be unusually rigorous relative to what real 2026 tooling and research literature describe elsewhere for this specific purpose** — not something the market has already solved and this project is behind on.

---

## 3. For the product team specifically

**Real finding, direct validation of one of this project's own already-named future ideas:** Atlassian Rovo/Confluence, real 2026 feature set (multiple 2026-dated sources) — Rovo "can be used to move from Confluence conversations to structured decision records," and a named real customer example (HarperCollins Publishers) uses "meeting-to-action agents to turn Confluence notes into structured decision logs with owners, deadlines, and linked Jira issues automatically." This is real, current, external validation that a **decision-log document type** (already one of this project's two named internal candidates) is a real, live 2026 product pattern, not a speculative one.

**Real finding, honest negative:** no real, specific, named product feature was found in this search that generates a **codebase-facts-driven impact analysis or risk assessment** as its own document type (Rovo's and ChatPRD's real capabilities found here are PRD-generation and decision-logging, not impact analysis from source code). Say this directly rather than padding: this project's own planned impact-analysis agent is a plausible, reasonable next step, but it is **not yet something confirmed as an existing real product pattern** by this search — an internally-motivated idea, not a market-validated one.

---

## Real correction, found 2026-09-06 after this report was read by whoever actually built the system this maps onto

The "cheap hook" recommendation above targets the wrong kind. This report suggested: if a `checklist` item ever becomes an object instead of a bare string, leave room for an optional pointer to a verification artifact. Real counter-evidence from the actual Q1b agent run: `constraints` (which map to `cited-list`, not `checklist`) already carry real fact_ids pointing at exact file/symbol-level code (e.g. `OSKBuildingIntercomService.addInhabitantInAllIntercoms`) — structurally much closer to "the repo's own real test suite" SWE-bench uses as ground truth than a bare acceptance-criteria string ever could be. If this project ever wants that hook, `cited-list` is the stronger, more natural place to leave room for it — a `checklist` string has no structural link to code at all, while a `cited-list` entry already names the exact location a future verification step would need to touch. Correct this before treating the original recommendation as final guidance.

**A related, genuinely open question, not resolved, worth recording rather than assuming an answer:** if Given/When/Then is ever adopted (this report's own "recommended step up" citation), does it become a new, fifth `SectionContent` kind, or a specialization of `cited-list` (each clause as a "claim" with `evidenceIds` pointing at what it verifies)? Real fork in how the closed-kind system would absorb it later — don't assume "just add a kind" is the answer when this is actually revisited.

**A satisfying, independent convergence worth noting:** Gherkin's own framing, quoted above ("a checkable fact the agent can validate"), is close to the semantic core of `cited-list` once its current inconsistent field naming (`point` vs `constraint`, already flagged separately as real drift to fix) is normalized to something like `claim`. Two independent lines of reasoning — this project's own real output shape, and external Gherkin/BDD practice — landing in the same place is a good, reinforcing signal, not a coincidence to shrug off.

## Summary answer to the open design question

Does real 2026 practice validate the planned `SectionContent` kinds, suggest a missing kind, or suggest the fixed-small-set approach itself is wrong?

- **Validates**: `prose`, checkable/non-checkable list, and `user-stories` as real, independently-converged content kinds (Spec Kit, ChatPRD). The "small fixed set of composable content kinds" approach itself is directionally right — both real external tools found here converge on a similarly small set rather than a large bespoke taxonomy per document type.
- **Not contradicted, but also not externally validated**: the `cited-claim list` kind — this project appears ahead of, not behind, common 2026 practice on evidence citation specifically.
- **No missing content kind identified that needs to be added now.** The one real, concrete, cheap thing worth keeping in mind (not building) is at the data-model level: if a checklist item's representation is ever changed from a bare string, don't assume a string is all it will ever need to be — real autonomous-merge practice treats "verification" as a separate, structured artifact (a runnable test, a Given/When/Then scenario) once autonomy increases, and that's cheap to not foreclose, not something to design for today.
- **No emerging common cross-vendor document *schema*** was found — the space remains genuinely bespoke per-vendor in 2026, as the brief itself suspected. The closest thing to convergence is at the content-kind level described above, not a full standard.

## Addendum, 2026-09-06 — one concrete recommendation from post-hoc discussion, not in the original findings above

Raised in discussion after this report was first written, and not yet captured anywhere else — recorded now rather than left only in conversation. If/when this project actually writes the `SectionContent` TypeScript types for the checklist kind, the one concrete, low-cost move is: **define checklist items as `{ text: string }` objects rather than bare strings, from day one.** This costs nothing now and renders identically to today's plain-string checklist. The reason it's worth doing now rather than later: this report's own finding above (real autonomous-merge practice treats "verification" as a separate, structured artifact — an actual runnable test or a Given/When/Then scenario — once autonomy increases) means that if a `verification` field is ever added to a checklist item later, an object shape absorbs it for free, while a bare-string shape would require a real breaking migration of every existing checklist's data at that point. This is not a recommendation to build verification support now — only to not foreclose it for free while the type is still being written for the first time.

## Sources

- [github/spec-kit](https://github.com/github/spec-kit)
- [Spec-Driven Development (SDD): The Definitive 2026 Guide](https://www.thebcms.com/blog/spec-driven-development/)
- [ChatPRD — PRD Template 2026](https://www.chatprd.ai/learn/prd-template)
- [ChatPRD — Writing PRDs for AI Code Generation Tools in 2026](https://www.chatprd.ai/learn/prd-for-ai-codegen)
- [Cursor — Introducing Plan Mode](https://cursor.com/blog/plan-mode)
- [What Makes a GitHub Issue Ready for Copilot? (arXiv 2512.21426)](https://arxiv.org/html/2512.21426v1)
- [GitHub Docs — Best practices for using GitHub Copilot to work on tasks](https://docs.github.com/copilot/how-tos/agents/copilot-coding-agent/best-practices-for-using-copilot-to-work-on-tasks)
- [OpenHands Index (2026-01-29)](https://www.openhands.dev/blog/openhands-index)
- [AI Coding Benchmarks Explained: SWE-bench, LiveBench, and More](https://www.openhands.dev/blog/ai-coding-benchmarks-explained)
- [Devin AI Guide — DeployHQ](https://www.deployhq.com/guides/devin)
- [How to Write Acceptance Criteria an AI Agent Can Actually Verify — Braingrid](https://www.braingrid.ai/blog/how-to-write-acceptance-criteria-ai-agent-can-verify)
- [Gherkin User Stories Acceptance Criteria: The 2026 Guide — TestQuality](https://testquality.com/gherkin-user-stories-acceptance-criteria-guide/)
- [From Agent Traces to Trust: A Survey of Evidence Tracing and Execution Provenance in LLM Agents (arXiv 2606.04990)](https://arxiv.org/html/2606.04990)
- [Responsible Agentic AI Requires Explicit Provenance (arXiv 2605.17169)](https://arxiv.org/html/2605.17169)
- [How Atlassian Rovo Is Rewriting the Playbook for Jira & Confluence Teams in 2026](https://crgsolutions.co/how-atlassian-rovo-is-rewriting-the-playbook-for-jira-confluence-teams-in-2026/)
- [Atlassian Team '26: AI Platform Updates Across Jira and Rovo](https://www.schneider.im/atlassian-team-26-changes-across-jira-confluence-rovo-focus-talent-more/)

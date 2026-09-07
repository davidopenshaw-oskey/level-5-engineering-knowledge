# Priming Brief — What Documents Should a Facts Corpus Produce for Product and Dev Teams, 2026/27

**Purpose of this file:** hand this to a fresh Claude session as its first message (or tell it to read this file first). That session should research what real 2026/27 tooling and practice suggests a code-facts corpus *should* produce for both a product team and a dev team, across two real trajectories — today's "vibe coding"/dev-assistance use case, and the more speculative-but-real direction toward increasingly automated software production. This is a research/report task — do not modify any file in this repository other than writing your own findings report (location at the bottom).

## Context — what this project is doing, briefly

This repo builds a pipeline that extracts real facts from ~15-20 source-code repositories into a Postgres/pgvector index, exposes that corpus through a thin, generic MCP tool server (three tools: search, graph-neighbor lookup, bounded graph walk), and drives task-specific AI agents ("personas") on top of it — the first one built produces atomic PRDs. A real, decisive test this week confirmed one agent persona, reasoning for itself with those tools, closes real evidence gaps a hardcoded pipeline couldn't.

**The live design question this research should inform:** the team is currently designing a generic *document template* system — a small, fixed set of section "content kinds" (prose, a checkable/non-checkable list, a cited-claim list, user stories) that any future document type's markdown template can compose from, without needing new code per document type. That design was derived from *one* example (the atomic PRD). Real, live concern raised directly by the user: if this pipeline proves out over the next ~6 months, a plausible next step is well-evidenced tickets being picked up by a coding agent and auto-merged toward QA/prod — and today's schema choices should not foreclose that cheaply-avoidable future, without designing for it now. **Read the following before searching anything:**

1. `governance/adrs/adr-007.md` — the MCP tool layer + agent persona architecture.
2. `governance/roadmap/mcp-direction/atomic-prd-agent-persona.md` and `06-step6-real-verification-q1a-q1b-2026-09-06.md` — the one real document type built so far, and real evidence of what an agent actually produces.
3. `output/atomic-prds/add-ownernonresident-inhabitanttype.md` (or any file in that folder) — a real, complete example of the current document shape (Layer 1 business / Layer 2 evidence / Layer 3 technical proposal).

## What to actually research

**Search live, on the open web, for real 2026/2027 information — do not answer from training knowledge alone.** This space moves fast; verify anything you report with a real, current source, and cite it.

Investigate two real, distinct trajectories, not one blended question:

### 1. Today's real trajectory: AI-assisted development / "vibe coding"

- What document/artifact types do real 2026 AI-native dev tools and PM-copilot tools actually produce and consume — beyond a generic "PRD"? Look specifically at what Atlassian Rovo, ChatPRD, GitHub Copilot Workspace, Cursor, and similar tools name as their real output types (technical design docs, RFCs, test plans, migration plans, runbooks, architecture decision records) and what structure/schema each uses internally, if documented.
- What do these tools' underlying *data structures* look like for things like acceptance criteria and user stories specifically — plain prose, structured checklists, machine-verifiable assertions (e.g., Gherkin/BDD-style "given/when/then")? This speaks directly to whether this project's planned `checklist`/`cited-list`/`user-stories` content kinds are already-proven shapes or missing something real tools have converged on.
- Is there a real, emerging standard or common schema for "a structured requirements/spec document an AI agent can both produce and consume," or is this still genuinely bespoke per-vendor in 2026?

### 2. The more speculative-but-real trajectory: increasingly automated software production

- What does the real 2026 research/product landscape say about what a *coding* agent needs as input to implement something with real autonomy (up to and including opening or merging a PR)? Look at what Devin, OpenHands, SWE-agent, GitHub Copilot's coding agent, and Claude Code's own agentic patterns actually consume as their task specification — is it typically a PRD-like document, a structured ticket, a test suite to satisfy, something else?
- Real, concrete question: do any of these systems require acceptance criteria to be *machine-verifiable* (e.g., an actual runnable test or assertion) rather than human-readable prose, in order to gate an autonomous merge? If so, what does that structured shape look like — this is directly relevant to whether this project's planned `checklist` content kind (a list of strings) is sufficient, or whether a genuinely different, more machine-executable shape is the real requirement once autonomy increases.
- What does real 2026 research/practice say about how these systems handle traceability back to *why* a requirement exists (the equivalent of this project's own citation/evidence discipline) — is "cite the real evidence that justified this decision" a pattern found elsewhere, or something this project is unusually rigorous about?

### 3. For the product team specifically, not just dev

- Beyond a PRD, what other document types does real 2026 product-management tooling (Rovo, ChatPRD, and others) produce from a codebase/facts source — impact analyses, risk assessments, a "why we built it this way" decision log, competitive/feature comparisons? This should surface real candidate future document types for this project's own roadmap (it already has two internal candidates: an impact-analysis agent and a corpus-stability/health-report agent).

## What a genuinely useful report looks like

For each of the three angles above: name real products/approaches found, with sources, and be explicit about what it means for *this* project's specific open design question — does real 2026 practice validate the planned `SectionContent` kinds (prose / checkable-or-not list / cited-claim list / user-stories), suggest a missing kind, or suggest the whole "fixed small set of content kinds" approach itself is the wrong shape compared to what's converged on elsewhere? If you find nothing real and current on a given angle, say so directly rather than padding it with speculation.

**Restate clearly in the report's own framing, so it doesn't get over-read by whoever reads it next:** this project is not committing to building toward automated/autonomous code production now — this research exists only to check that today's cheap, small schema decisions don't foreclose that path if it becomes real later.

**Save your findings to `governance/roadmap/market-research/04-findings-document-types-<date>.md`** (create the file; don't overwrite this brief).

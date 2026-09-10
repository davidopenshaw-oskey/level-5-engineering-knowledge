# Session handoff — 2026-09-09

Real, specific hand-off, written at a deliberate boundary (a real architectural decision — ADR-009 — just landed; per this project's own session-scope discipline, this is a build session waiting to start, not a continuation of today's investigate/test session).

## Read first, in this order

1. **`governance/adrs/adr-009.md`** — the real decision this session's testing and today's market research led to: the skill+template pairing is externally confirmed, and five concrete refinements were found, none yet built.
2. **`governance/roadmap/mcp-direction/32-action-plan-post-research-2026-09-09.md`** — real Priority 0: sketch a genuinely redesigned PRD `skill.md`+`template.md` (v2), cherry-picking the five refinements as ingredients, compared directly against the existing live pair and the three `mcp-server/gold/` examples — not five independent patches. Start here.
3. **`governance/roadmap/mcp-direction/30-intercom-quota-blocker-pause-2026-09-09.md`** — real, still-open blocker. A decision is needed here before Priority 1 and 5 of the action plan can be properly tested.
4. **`governance/roadmap/mcp-direction/31-tool-argument-citation-fix-2026-09-09.md`** — a real fix already applied to `mcp-server/skills/prd/skill.md`, status still unconfirmed (blocked by #3 above).
5. **`governance/roadmap/market-research/21-findings-agent-prd-template-vs-dynamic-structure-2026-09-09.md`** — the real research underlying ADR-009, with full primary-source detail (Anthropic Skill docs, GitHub spec-kit, Kiro, Devin) beyond what the ADR itself quotes.

## Real, structural context that changed this session — don't assume the old paths

- **Skill+template location moved**: `mcp-server/skills/prd/{skill.md,template.md}` is now the live, canonical pair (moved via `git mv` from `governance/roadmap/mcp-direction/atomic-prd-agent-skills.md` and `mcp-server/agent-poc/templates/atomic-prd.template.md`). `atomic-prd-agent.ts`'s `DEFAULT_TEMPLATE_PATH` was updated to match; `DEFAULT_PERSONA_PATH` was **deliberately left pointing at a now-nonexistent path** (fail-loud on purpose — always pass `PERSONA_FILE=mcp-server/skills/prd/skill.md` explicitly).
- **New folders exist**: `mcp-server/gold/` (three real, validator-passed reference outputs — 1a, 2a, and the intercom case), `mcp-server/docs/` and `mcp-server/test-questions/` (created, not yet populated — the user said they'd prepare the questions).
- **`DEBUG_TOOL_LOG` is a permanent, opt-in diagnostic** in `atomic-prd-agent.ts` (env var, off by default) — use it on any new investigation, don't rebuild it.
- **A generic one-shot MCP caller exists and should be kept**: `mcp-server/_test-mcp-call.ts` — `node -r ts-node/register mcp-server/_test-mcp-call.ts <toolName> '<jsonArgs>'`, useful for direct, no-agent investigation (used today for the two GCP-log bug root-causes and the persona gap analysis).

## Real, still-open decisions, not resolved this session

- The Vertex AI quota ceiling (5 req/min default, `gemini-3.5-flash`, no override) — real decision needed: request an increase, or design around it (bounded search + honest gaps, per action-plan Priority 5).
- Whether `[NEEDS CLARIFICATION]` becomes a soft persona instruction or a real code-enforced check.
- Whether EARS notation is adopted as wording-only or a new `SectionContent` kind.
- Whether "impact analysis" becomes the real second skill+template pair — structurally ready (`mcp-server/skills/`), nothing built.
- Two peer sessions (Kotlin extraction work, `android-intercom-oskey-io`) fixed real bugs today in direct response to this session's findings (`16-...md`, `17-...md`) — worth checking their own roadmap folder for what landed since, before assuming today's snapshot is still current.

## What this session should NOT do

Don't re-litigate the skill+template architecture decision — ADR-009 confirms it's sound, externally validated. The open work is the five ranked refinements and the quota decision, not "should we keep this design."

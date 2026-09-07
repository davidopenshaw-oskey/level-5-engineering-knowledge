# SectionContent / Template Architecture — Live Discussion, Not Yet Decided — 2026-09-06

**Status: an in-progress cross-session design discussion, captured here before it could be lost to context compaction — not a decision, not implemented.** Participants: the user, this session, and a parallel session (`level-5-engineering-knowledge-e2`) working concurrently in the same repo. Written up now specifically because it only existed in conversation, per this project's own rule against relying on catching a compaction boundary in time.

## The real question that started this

Following Steps 5-6's real success (`06-step6-...md`), the user raised two forward-looking questions, explicitly framed as discussion, not a decided plan:

1. Should `mcp-server/` eventually move to a repo-root folder (or separate repo), now that the architecture works?
2. Could the MCP server stay fully document-type-agnostic, with a PO Office staffer authoring a **template** (markdown, section headings + order), **rules**, and a **persona** file per new document type — no code change per new type?

## Repo-split question — my position, not yet challenged by the peer

Pushed back on moving `mcp-server/` now: the three tools already import `_shared/search.ts`/`graph-traversal.ts` as TypeScript functions directly, so relocating the folder just moves the same coupling somewhere else, doesn't remove it. A real split needs the MCP server to own its own DB access (or the shared code to become an installable package) — real work, best deferred until a second real caller (e.g. a future Swift/Kotlin-pipeline consumer) exists to actually define the right boundary. Not yet revisited by the peer.

## Template/rules/persona question — the real back-and-forth

**My first challenge**, before any synthesis existed: the output schema (`OUTPUT_SCHEMA` in `atomic-prd-agent.ts`) is hardcoded Zod today, not data — a PO staffer editing markdown can't change what shape the LLM is constrained to. Also flagged: fabrication-checking is schema-shaped (walks known field names), and there's no review gate for a new persona before it's trusted with real output.

**Peer's synthesis, in response**: template is just a markdown doc naming headings + order (e.g. `# MetaData`, `# Objective`, `# Scope`, `# Risks`). One genuinely generic schema serves every document type:

```ts
const GENERIC_TEMPLATE_SCHEMA = z.object({
  sections: z.array(z.object({ heading: z.string(), content: z.string() })),
});
```

Genkit still enforces real structure; the schema itself never changes per document type. Proposed three-way split: template (markdown, PO-authorable) / rules (shared, mandatory, not yet built) / persona (task-specific judgment, close to what `atomic-prd-agent-persona.md` already is).

**My response — three real gaps, all still open:**

1. **The schema enforces structure, not template conformance.** Nothing stops a run from dropping a required heading or renaming one — that needs a small, generic post-generation check (compare `sections.map(heading)` against the template's own list, fail closed on mismatch), not yet designed or built.
2. **Real per-field structure gets traded away.** Today's `acceptanceCriteria: string[]` and `userStories: {actor,goal,reason}[]` are real parseable arrays; collapsing to `content: string` per section is a deliberate, real cost (bites later if something wants to parse structured criteria directly), not a free simplification.
3. **`# MetaData` can't be LLM-authored.** Snapshot freshness, persona/model version, tool-call counts are deterministic, code-computed today. If MetaData is just another heading in `sections[]`, the model could hallucinate a commit SHA — the renderer needs to special-case that heading, not treat every heading uniformly.

Agreed with the peer that free-text fabrication-checking (exact-substring-match against real `fact_id`s already seen in tool results) is a genuine improvement over today's field-walking validator — simpler, schema-agnostic. Added: the persona needs an explicit "cite `fact_id`s verbatim in backticks" instruction, since a paraphrased citation would slip past exact-match undetected.

**Bigger reframe I pushed**: "rules" shouldn't be only a prompt file — prompt rules are best-effort, the model can ignore them. The two checks above (template conformance, fabrication) need to be **code**, run unconditionally after generation. Real three-way split I'd argue for: template (data) / persona (prompt, best-effort) / a small set of **mandatory code validators** (fail-closed) — not three peer-ish prompt files.

## The content-kind proposal, and real validation against actual Q1a/Q1b data

User raised a real, explicitly-hedged future consideration: if this project's output ever feeds a coding agent toward auto-merge (6+ months out, **not being built now**), acceptance criteria/user stories need to stay programmatically consumable, not prose to re-parse. Peer proposed a small, closed set of section content kinds (not per-document-type bespoke schemas):

```ts
type SectionContent =
  | { kind: "prose"; text: string }
  | { kind: "checklist"; items: string[] }
  | { kind: "cited-list"; items: { point: string; evidenceIds: string[] }[] }
  | { kind: "user-stories"; items: { actor: string; goal: string; reason: string }[] };
```

**Checked directly against the real Q1a/Q1b JSON output (not the abstract shape)**:
- `cited-list` is validated **twice already** in real data — `technicalProposal` and `constraints` both use the identical `{claim, evidenceIds}` shape under different headings. Strong evidence it's genuinely reusable, not overfit.
- `checklist` and `user-stories` match `acceptanceCriteria`/`userStories` exactly.
- **One real gap found**: `generate-atomic-prd.ts`'s existing Layer 1 template already renders "Information Collected" as a plain bullet list — not checkable, purely descriptive. Reusing `checklist` (which renders `- [ ]`) there is semantically wrong. Proposed fix: collapse into `{ kind: "list"; checkable: boolean; items: string[] }` rather than adding a 5th kind.
- **One real field-naming inconsistency to fix before this becomes the shared type**: the real JSON uses `point` for `technicalProposal` and `constraint` for `constraints` — identical shape, different field name. Should normalize to one name (e.g. `claim`) now.
- Restated the MetaData point in this context: it must not be reachable through `SectionContent`'s closed set at all.
- Overfit verdict: none of the four kinds are structurally PRD-specific; `user-stories` is just the narrowest in likely future usage (an impact-analysis or corpus-stability report probably never needs it), which is fine — not every persona uses every kind.

## Live market research, cross-checked against the design (`market-research/04-findings-document-types-2026-09-06.md`)

A research agent (run by the user/peer before this discussion's content-kind proposal was finalized) found, live, dated 2026-09-06:
- **`prose`, checkable lists, and `user-stories` are externally validated** — GitHub Spec Kit and ChatPRD independently converge on the same shapes.
- **`cited-list` (per-claim `fact_id` citation) was NOT externally validated by this first pass** — no dev-tooling vendor found citing at this granularity. Initial framing: this project is ahead of common practice here, not behind it. **Corrected by a second research pass — see below.**
- **No emerging common cross-vendor document schema exists** — bespoke per-vendor remains the 2026 norm; convergence is only at the content-kind level.
- **Real, concrete, non-foreclosing implication for the future-proofing question**: don't change `checklist`'s rendered shape now. If a checklist item is ever promoted from a bare string to an object, leave room for an optional pointer to a verification artifact (a test, a Gherkin scenario) later — because real coding-agent practice (SWE-bench, GitHub Copilot's own merge-rate research, BDD/Gherkin) treats verification as a separate, executable artifact once autonomy increases, not a prose/checklist field.

**My pushback on that specific implication, not yet relayed to the peer's synthesis doc**: the "cheap hook" belongs on `cited-list`, not `checklist`. A `cited-list` item already carries a real `fact_id` pointing at exact file/line-level code — structurally much closer to "the repo's own real test suite" than a bare acceptance-criteria string could ever be. If this project ever wants that hook, `cited-list` is the more natural place to leave room for it.

**Real open question, named but not resolved**: if Given/When/Then is ever added, is it a genuinely new 5th kind, or a specialization of `cited-list` (each clause as a "claim" with `evidenceIds` pointing at what it verifies)? Not decided; flagged as a real fork for whenever this is actually built, not now.

## Second market-research pass — two further points beyond the cited-list correction above (`market-research/06-findings-product-team-artifacts-2026-09-06.md`)

`cited-list`'s second, independent line of external validation is already captured above in "Live market research." Two more real reactions from the same pass, checked by both sessions against the source wording directly (2026-09-06):

- **Allstacks Product Studio (launched 2026)** — real, current, functionally-equivalent pattern to this project's planned impact-analysis idea, softening `04-...md`'s honest negative on that front: its "adversarial review findings" feature scores a proposed spec against engineering feasibility, team capacity, security, and historical rework rates before work is greenlit, described in its own materials as a pre-mortem. **Resolved after brief cross-session disagreement**: this maps to **impact-analysis-agent**, not corpus-stability-agent — "scores *every spec*... before work is greenlit" is a gate on one specific proposed change as it arrives (per-request, ADR-006's shape), not a standing scan of existing corpus state with nothing being greenlit (corpus-stability-agent's actual shape, surfacing the 42 symbol ambiguities). The initial instinct to map it to corpus-stability conflated "happens before an action starts" with "not tied to any specific request" — two different axes. Persona-scoping detail; the authoritative note lives in `05-poc-demo-and-documentation-plan.md` under item 2 where both personas are actually listed, not duplicated further here. Neither persona is built yet — re-read the real Allstacks description directly once either is actually scoped.
- **Real, minor, non-actionable context for the auto-merge hedge above**: Amazon's own AWS VP of agentic AI (GeekWire, 2026) says new coding tools now make it easier for his teams to build a working demo than to write the classic six-page Amazon PRFAQ — a dated signal that document-as-durable-interface is already being partly displaced by "just build the prototype," inside the org that invented the PRFAQ format. Not evidence for building toward automated production now; just a reason not to assume documents stay the durable interface indefinitely if agentic execution keeps getting faster.

**Also independently reassuring, not a correction**: the same pass's research-synthesis section carries its own honest caveat — "interviews sitting in a shared drive and insights never making it into a product decision" — independently confirming that this project's real, hard-won retrieval work (RESULT_LIMIT tuning, the failed hybrid-retrieval experiments, the reranking test, today's agent-driven search) was solving the actual hard problem in this class of system, not a self-inflicted one. Worth keeping for the eventual demo narrative (`05-...md` item 5).

## What is genuinely settled vs. still open

**Settled (repeated agreement across the discussion, not yet formally written as a decision doc):**
- Small, closed, composable content-kind system > per-document-type bespoke schemas.
- Fabrication-checking via exact-substring-match against real `fact_id`s is better than field-walking.
- `MetaData` (and similar deterministic, code-computed content) must never be LLM-authored.
- Mandatory safety/consistency checks belong in code, not only in a prompt file.

**Still open, nothing built yet:**
- Exact `SectionContent` type (the `list`/`checkable` merge, the `point`/`constraint` → `claim` rename).
- The template-conformance validator (heading-list comparison, fail-closed).
- Where `cited-list` vs `checklist` sits relative to any future verification-artifact hook.
- The repo-split question (folder-move timing).
- Whether/how Given/When/Then would map onto the closed kind system if ever added.

Nothing here has been implemented. This doc exists so the discussion survives a compaction boundary intact enough to resume from, per this project's documentation discipline — not as a substitute for the real ADR/tasklist update that should follow once the user and both sessions actually converge on a decision.

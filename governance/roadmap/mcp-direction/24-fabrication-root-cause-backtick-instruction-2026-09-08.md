# Root cause found: persona wording, not the move — 2026-09-08

Follow-on to `23-post-move-tool-verification-resident-departure-2a-2026-09-08.md`. Added temporary, opt-in diagnostics to `mcp-server/agent-poc/atomic-prd-agent.ts` (env-gated `DEBUG_TOOL_LOG=<path>` dumps every real tool call's full input/output to a JSONL file; a near-miss check runs right before the existing `checkFabrication` call, unchanged in its own enforcement) and re-ran the identical resident-departure-2a case a second time.

## Real result: two different, real failure modes across two runs, neither caused by the move

**Run 1** (`23-...md`): 2 fabricated citations, each one character-segment off a real fact_id (`core/access` where the real module segment is `core`) — a wrong-detail hallucination.

**Run 2** (this run): 9 fabricated citations, **all wrapped in a literal leading and trailing backtick character** inside the JSON `evidenceIds` string value itself, e.g. `` `service_method|core|functions/.../access.service.ts|OSKAccessService|deleteAccessById|#1` `` (backticks included in the actual string, not markdown rendering).

**Confirmed directly against the real tool-call log** (`DEBUG_TOOL_LOG`, this run): the real, backtick-free fact_id `service_method|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService|deleteAccessById|#1` was genuinely returned by `search_facts` this run — stripping the two literal backticks off the fabricated citation reproduces it exactly. Same confirmed for `type_alias|organization|...|OSKOrganizationResidentBase|#1` and the rest of the 9. Also confirmed: real tool output does legitimately contain backtick characters sometimes (7 lines matched a raw `` ` `` grep) — but only *inside* a field's real code content (template-literal strings captured verbatim from source, e.g. a real ``` `Successfully deleted access...` ``` log message argument), never wrapping a whole `factId` value. So "strip surrounding backticks and it's real" is a safe, specific diagnosis here, not a coincidence.

## Real root cause, found in the persona file itself

`atomic-prd-agent-skills.md`, "Cite only real evidence" section:

> Every `evidenceIds` entry in a `cited-list` must be a real `fact_id` copied verbatim, **in backticks**, exactly as a tool returned it — not paraphrased, not reformatted, not shortened.

This instruction is genuinely ambiguous: it reads naturally as "wrap the value in backtick characters" — and on this run, the model did exactly that, literally, inside the JSON field the fail-closed validator exact-matches against. That's a real, self-inflicted cause, not a DB/tool/move problem.

**Confirmed this instruction is also redundant**, not just ambiguous: `atomic-prd-agent.ts`'s own rendering code already wraps every cited fact_id in backticks when building the final document (e.g. `` `- <a id="evidence-${n}"></a>[**#${n}**](#cite-${n}) \`${id}\` [↩](#cite-${n})` ``, in the reserved "Evidence Used" section renderer). The model was never supposed to add backticks itself — the renderer already does it. The persona line is telling the model to do something the code does for it, and on this run, that ambiguity was read literally and broke the exact-match check.

## Two real findings together, both genuine and both about the same overall system, neither about the move

1. Run 1's "wrong module segment" hallucination and Run 2's "backtick-wrapped" hallucination are two different failure shapes across two runs of the identical case — this is real, observed non-determinism in the model's citation reproduction, not a single reproducible bug.
2. Run 2's failure has a specific, well-evidenced, fixable root cause: the persona's own "in backticks" wording. This is a real, actionable fix candidate — remove "in backticks" from that sentence (the field is a raw string the validator exact-matches, not markdown; the renderer already adds real backticks downstream).

**Not yet decided**: whether to actually edit the persona now, and what to do with the temporary diagnostic code (`DEBUG_TOOL_LOG`, the near-miss printer) — keep as a permanent, always-available opt-in diagnostic, or remove now that its one real finding is written up here, per this project's own discipline.

## Real, still-open gap

Two runs, two different failures, still zero comparable post-move output markdown for resident-departure-2a. The direct "does the moved code reproduce the same real data" comparison against `2026-09-07-005-...md` remains open.

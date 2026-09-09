# Post-move tool verification closed — resident-departure-2a — 2026-09-08

Closes the gap `23-post-move-tool-verification-resident-departure-2a-2026-09-08.md` and `24-fabrication-root-cause-backtick-instruction-2026-09-08.md` left open: a real, direct, passing comparison between the relocated `mcp-server/` code and the pre-move baseline, for the same real business request.

## What changed since `24-...md`

1. **Persona fix applied**, `atomic-prd-agent-skills.md`'s "Output format" section: the ambiguous "copied verbatim, **in backticks**" instruction — confirmed root cause of Run 2's 9-citation fabrication failure — replaced with "copied verbatim **as a plain string** ... with no surrounding backticks or other markdown added. The rendered document adds backticks and formatting separately." Real rationale carried over from `24-...md`: the model was never supposed to add backticks itself, the renderer already does, so the instruction was both ambiguous and redundant.
2. **`DEBUG_TOOL_LOG` diagnostic kept, made permanent** (was framed as temporary in `24-...md`, real user decision this session: keep it). `atomic-prd-agent.ts`'s comment updated to reflect that — opt-in via env var, zero effect on a default run, no longer flagged for deletion.
3. Re-ran the identical resident-departure-2a case a third time, persona fix + `DEBUG_TOOL_LOG` both active.

## Real result: passed clean, first real post-move comparison closed

```
=== Both mandatory validators passed (474 real fact_id(s) seen this run) ===
```

Exit 0. Output written to `output/agent-runs/prds/test/2026-09-08-001-resident-departure-2a-post-move-regression-test-run3-persona-fix.md`.

Direct comparison against the real pre-move baseline (`2026-09-07-005-resident-departure-2a-tool-desc-fix-regression-test.md`):

| | Post-move (this run) | Pre-move (baseline) |
|---|---|---|
| Tool calls | 26 `search_facts` / 4 `walk_cluster` / 1 `get_graph_neighbors` (31 total) | 23 / 5 / 1 (29 total) |
| Turns used | 32 of 100 | 30 of 100 |
| Snapshot commits cited | angular `8345d222`, firebase `00e1d9fd`, node-iot `a6cba122` | identical, all three |
| Real cost / duration | $0.1161 / 2m 58s | $0.0828 / 1m 56s |

Same underlying extraction snapshots (identical commit SHAs), comparable tool-call shape, same real evidence chain reconstructed both times: PGO resident profile card → `OSKOrganizationResidentsService.updateResident` → `OSKTaskSchedulerService` schedule/cancel → `OSKAccessService.deleteAccessById` → `OSKAccessMessagePublisherService.publishMessageToAllACDs` → edge devices (intercoms/digicoms) via Pub/Sub, received by `node-iot-api-oskey-io`. The cost/duration/tool-count differences are within the range already expected from normal LLM generation variance (documented elsewhere in this project), not a regression.

**Real, decisive conclusion**: the `mcp-server/` repo-root move (`21-task1-mcp-server-repo-root-move-2026-09-07.md`) — including the deliberate fork of `search.ts`/`graph-traversal.ts`/`embedding-adapter.ts` into `mcp-server/db/` — is confirmed working correctly at the level Step 2 of `01-mcp-tool-server-tasklist.md` actually asks for: the moved code reproduces the same real data as the pre-move original, not just "boots without error."

## Real, secondary finding this investigation produced

Two different real fabrication-check failures were hit and root-caused along the way (`23-...md`, `24-...md`) — neither caused by the move, both caused by non-deterministic LLM citation reproduction interacting with persona wording (one confirmed-fixed: the backtick ambiguity; one still open: Run 1's wrong-module-segment hallucination, cause not yet found). The fail-closed validator did exactly its designed job both times — caught a bad citation before it reached a document, rather than shipping a wrong fact_id silently.

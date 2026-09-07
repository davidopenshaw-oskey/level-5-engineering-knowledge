# Agent Output Location — Implemented 2026-09-06

Real decision, worked out directly with the user in a parallel session, implemented here.

## Decision

Agent-generated PRD output lives in `output/agent-runs/`, not `output/atomic-prds/` (the hardcoded pipeline's own output, left completely untouched — it's the real comparison baseline `06-step6-real-verification-q1a-q1b-2026-09-06.md` relies on) and not `knowledge-corpus/` (checked directly: that's P1's raw extraction artifact store plus old Phase 2 experiments, a different purpose).

```
output/
  atomic-prds/              # unchanged -- generate-atomic-prd.ts's own output
  agent-runs/
    prds/                   # atomic-prd-agent's output
      test/                 # experimental/non-final runs
      2026-09-06-001-...md  # considered/reviewed output: {date}-{seq}-{slug}.md
    impact-reports/         # reserved for a future impact-analysis-agent persona -- not created yet, no persona exists to write to it
    stability-reports/      # reserved for a future corpus-stability-agent persona -- same, not created yet
```

Real reason for the split from `atomic-prds/`: the agent cites raw `fact_id`s directly, not fixed Layer-2 display numbers (`atomic-prd-agent-persona.md`'s own documented, deliberate format difference) — mixing the two citation conventions into one folder would be confusing, not just untidy.

Every output file carries: the same `Snapshot freshness` header format `generate-atomic-prd.ts` already uses (`repo@commit_sha`, queried live from `extraction_runs`, real per-run data not a template placeholder), plus which persona/version and model config produced it, plus whether it's a `test` or `considered` run.

## What was actually implemented

- `mcp-server/agent-poc/atomic-prd-agent.ts`: added `renderSnapshotFreshness` (same real query pattern `generate-atomic-prd.ts` uses, reimplemented per this pipeline's existing per-script isolation convention, not imported), a markdown renderer, and `writeAgentOutput` (exported). Every future run now writes a real file under `output/agent-runs/prds/` (or `prds/test/` when `RUN_KIND` is unset or not `"considered"`) instead of console-only output. File naming: `{date}-{seq}-{slug}.md`, sequence computed by scanning the target directory for today's date, not hardcoded.
- Guarded the script's `main()` call behind `require.main === module` so the new exports (`writeAgentOutput`, `AgentOutput`) can be imported without re-running the whole agent.
- **Backfilled the two real Q1a/Q1b results from Step 6** into `output/agent-runs/prds/test/2026-09-06-001-add-ownernonresident-inhabitanttype.md` and `.../002-assign-building-unit-to-ownernonresident.md`, using the exact real JSON already captured — no new LLM call, no new spend. A one-off script did this (`_backfill-q1a-q1b-outputs.ts`), deleted immediately after running per this project's diagnostic-script discipline; the real output files it produced are the artifact that matters, not the script.

## Not done

`impact-reports/` and `stability-reports/` are not created as empty directories — no persona exists yet to write to them, and an empty placeholder directory isn't real content. Create them when `impact-analysis-agent`/`corpus-stability-agent` (both recorded as candidate future work, not scheduled) actually exist.

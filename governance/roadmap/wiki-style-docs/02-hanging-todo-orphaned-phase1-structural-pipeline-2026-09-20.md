# Hanging TODO: Phase 1's `04-07` structural knowledge-pipeline is orphaned — don't lose it, but move it out of the active pipeline flow

**Status: parking note only. Nothing decided, nothing built, nothing moved.** Written to
capture a real finding before it's lost, per this project's own documentation discipline —
not a proposal to act on now.

## What was found, 2026-09-20

Every onboarded repo's Phase 1 extraction chain (`00`-`07`, wired into each repo's
`pipeline:<name>` npm script) includes four steps —
`04-build-resolved-graph.ts`, `05-partition-capability-packs.ts`,
`06-build-cross-module-dependency-graph.ts`, `07-build-intra-module-coupling-graph.ts` —
that produce real, current, free (no LLM/embedding cost) structural output: resolved
call graphs, capability packs (facts partitioned by submodule), cross-module dependency
edges, intra-module coupling data. Confirmed present and actively producing fresh output
today for `firebase-oskey-dev`, `angular-app-oskey-io`, `node-iot-api-oskey-io`,
`android-intercom-oskey-io`, and (as of
`governance/roadmap/dynamic-pipeline-architecture/22-build-completion-swift-pipeline-
orchestrators-and-refresh-2026-09-20.md`) all 5 Swift/iOS repos.

**Real, traced origin of what this was built for**: `governance/roadmap/firebase-oskey-dev/
05-capability-pack-size-cap.md` (2026-08-27) shows these scripts existed specifically to
feed **Phase 2's LLM narrative-synthesis pipeline** — `05`'s capability packs were the real
input unit for `01a`/`01c`'s per-module synthesis calls, and `06`/`07`'s graphs fed the
reduce step that produced each repo's synthesized report
(`knowledge-corpus/<repo>/<runId>/`). This is the real "analyse, fold, collapse" model:
fact → intra-module (capability packs) → inter-module (cross-module-dependency-graph) →
repo (the synthesized report).

**That consumer is confirmed dead.** `governance/roadmap/dynamic-pipeline-architecture/
13-findings-hierarchical-routing-investigation-2026-09-20.md` found Phase 2's LLM
narrative synthesis is real-world dead — stale or entirely absent output, superseded by the
agentic capability-fanout architecture (`capability-fanout-prd-agent.ts`'s real-time,
on-demand tool-calling, which needs no pre-computed capability packs at all).

**Net result**: `04-07` is real, working, correctly-functioning code, still running as part
of every repo's normal pipeline invocation, producing genuinely fresh and correct output —
for a consumer that no longer exists. Nobody has gone back to retire the now-orphaned
producer side since the consumer side was abandoned.

## The ask, for whenever this gets picked up

1. **Don't lose this work.** The code is real, debugged, and currently producing correct
   output for every onboarded repo — re-building it from scratch later would be genuine
   waste.
2. **Move it out of the currently-active pipeline flow.** Right now it silently rides along
   inside every repo's `00`-`07` chain with no real purpose — worth relocating to a clearly-
   separate area (a distinct pipeline stage, or its own opt-in script family) so it's not
   presented as load-bearing, active infrastructure when it isn't.
3. **Flag it as a real candidate input for a future consumer, not dead weight to delete.**
   Specifically: this project's own wiki-style-docs initiative (this folder — see
   `00-scope-and-deepwiki-research-2026-09-18.md`, `01-multirepo-landscape-research-2026-
   09-18.md`) is exactly the kind of future consumer this data already fits — per-module/
   per-repo structural analysis (call graphs, dependency edges, coupling data) is close to
   what a DeepWiki-style browsable site would want to show per module, and it already
   exists, real and current, for every onboarded repo.

## Explicitly not decided here

- Whether to actually reuse it for wiki-docs, adapt it, or build something new instead —
  that's a real decide-stage question for whoever picks up wiki-style-docs work, not
  resolved by this note.
- Where exactly it should move to, or what "moved out of the active flow" concretely means
  in code (a separate npm script family? An opt-in flag? Deleted from the default chain and
  kept only in git history?) — real design work, not started.
- Whether the doc-13-style "Option 2" hierarchical-routing idea (reusing this structural
  data to seed routing, `governance/roadmap/dynamic-pipeline-architecture/13-...md` §6) and
  this wiki-docs reuse are the same effort or two separate ones drawing on the same data —
  worth checking for overlap before two separate initiatives both try to move/adapt this
  same code independently.

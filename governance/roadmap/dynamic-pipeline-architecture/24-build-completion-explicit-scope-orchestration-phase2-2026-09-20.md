# Build completion: Phase 2 — explicit in-scope-platforms orchestration

Built 2026-09-20, against
[23-build-prompt-explicit-scope-orchestration-phase2-2026-09-20.md](23-build-prompt-explicit-scope-orchestration-phase2-2026-09-20.md)
(Phase 2 of [17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md](17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md),
itself following [16-plan-explicit-pm-directed-scope-2026-09-20.md](16-plan-explicit-pm-directed-scope-2026-09-20.md)).
**Steps 1-5 done and real-verified against live Postgres. Step 6 (the real, paid capability-
fanout test run) deliberately NOT run this session** — see "Stopped before real spend" below.
No commits made, per standing rule. Phase 3 (skill.v3.md directive-prioritization rule),
Phase 4, Phase 5 untouched, as instructed.

## Step 1 — additive `repoFilter` on `search()`

`mcp-server/db/search.ts`: added `opts.repoFilter?: string`, mirroring the existing
`crossModuleMargin` pattern exactly. Rewrote the single-vs-module-filtered SQL ternary into a
small dynamic WHERE-clause builder (`conditions`/`params` arrays) so `repoFilter` composes
independently of `moduleFilter` — both branches get `AND repo = $N` when set, and the doc's own
note that "a repo filter with no module filter is a real, valid future case" is true today, not
just documented as intended. `undefined` (the default) preserves every existing caller's exact
prior behavior — confirmed via typecheck (below) that `atomic-prd-agent.ts`'s own tools and
`routeCapabilities()`'s unfiltered Step-1 call are unaffected. The `crossModuleMargin` cross-
module query was deliberately left untouched (not asked for, not needed — it's a separate query
with its own param array).

Threaded `opts?.repoFilter` through `makeCapabilityTools()`'s `searchFacts` tool (`capability-
fanout-prd-agent.ts`) — a capability's search is now genuinely scoped to one real
`(repo, module)` pair, not just a module name, closing the real gap doc 23 found (module names
recur across repos — confirmed `features` in both `firebase-oskey-dev` and
`angular-app-oskey-io`).

`npx tsc --noEmit` run immediately after this step: zero new errors (see full typecheck result
below).

## Step 2 — the "In-scope platforms" parser

Reproduced the real, already-validated regex verbatim in `parseInScopePlatforms()`
(`capability-fanout-prd-agent.ts`), not re-derived, per doc 23's own instruction (the earlier
parse-only script that validated it was a throwaway, already deleted).

**Malformed-entry decision, made and stated (doc 23 left this open):** an entry with an empty
`repos` array is skipped individually with a loud `console.error`, not silently dropped and not
a reason to fail the whole request — same "never silently swallow, always surface, keep the
rest of a real run" discipline `main()`'s own per-capability try/catch already applies in Step
2. The request only fails closed when **nothing real is left** after all such skips: zero valid
platform entries (mirrors the vector-routing path's own existing "zero candidate modules"
fail-closed message), or zero real `(repo, module)` pairs resolved at all (Step 3's own
symmetric check).

**A second, related decision doc 23 didn't anticipate, made during build:** the same real
`(repo, module)` pair can be resolved from two different platform entries (e.g. two platforms
both naming the same repo). Deduplicated by `capabilityKey` (`repo/module`) in
`resolveExplicitScopeCapabilities()` — spawning a second, identical capability call would be
pure wasted real spend for no benefit (list/cited-list/stories merging already dedupes by
content value downstream, so nothing would even show up twice in the final document). If the
two entries carry different directives for the same resolved pair, the first is kept and a loud
`console.error` names the conflict rather than silently picking one.

## Step 3 — orchestration in `main()`

Implemented the decided coexistence check verbatim: no `"**In-scope platforms**:"` marker →
unchanged `routeCapabilities()` path; marker present, zero valid entries → `[Fail-Closed]`
throw; marker present, ≥1 valid entries → new path. Repo→module resolution is one batched query
(`SELECT DISTINCT repo, module FROM facts WHERE repo = ANY($1::text[])`) across every named
repo combined, not one query per entry, exactly as specified.

**Zero-real-modules-for-a-named-repo decision, made and stated (doc 23 left this open too):**
same policy as the malformed-entry case above, for consistency — skip that one repo with a loud
`console.error` (typo, or repo never synced), don't fail the whole platform or the whole run;
fail closed only if the grand total across every platform is zero real pairs.

## Step 4 — directive threading into `renderCapabilityContract()`

Added an optional `directive` parameter. Every capability spawned from the same platform gets
the *platform's* directive text verbatim (not a per-module directive) — confirmed by the dry
run below (e.g. all 5 `android-intercom-oskey-io/*` capabilities share the identical directive
string). An empty or literal `"?"` directive (this project's own real, observed convention for
"the PM left this blank" — see `1b`'s "Cloud backend" entry) renders **no directive line at
all**, not the literal string `"?"` injected as if it were real guidance. Injected as a plain,
per-run FACT (same category of content this function already injects: module scope, template
headings) — **explicitly not** teaching the persona to prioritize it; that's Phase 3, a
separate, later build, not done here. The mechanism only half-works until Phase 3 lands: the
note now genuinely reaches the model's context, but nothing yet tells the model to search it
first.

## Real, necessary fix found during Steps 1-4 (not in doc 23, but directly caused by this
phase's own design)

"One capability per real `(repo, module)` pair" means two capabilities can now legitimately
share a bare module name (different repos) in the same run. Left unhandled, this would silently
collide in: the `llm-<module>.json` FULL_DEBUG dump filename, the `tool-calls-<module>.jsonl`
debug-trace filename, and the `perCapabilityToolCalls`/`perCapabilityTurnsUsed` meta.json
dictionaries (a real overwrite/data-loss risk, not cosmetic). Added a small `capabilityKey(module,
repo)` helper (`repo/module` when repo is set, else bare `module` — a no-op for the unchanged
vector-routing path) and used it **only** where collision would lose data. Deliberately left
`candidateModules`/`capabilitiesRun`/`failedCapabilities` as plain arrays of the qualified key
too (harmless to qualify, and more useful, since arrays don't silently overwrite) — but
deliberately did **not** touch `mergeOneHeading()`'s `"prose"` merge case, which is the one
place a bare-module label could theoretically collide in the *rendered document* itself: checked
directly (not assumed) that neither live template (`template.md`, `template.v2.md`) has any
`kind: prose` section today, so this is dead code for now, not a live bug — noted here as a real,
out-of-scope-for-this-build consideration if a future template ever adds a prose section.

Also added `RunMeta.capabilityFanout.routingMode?: "vector" | "explicit"` (`atomic-prd-
agent.ts`, optional, additive) so a run's meta.json states plainly which path it took —
`undefined` on any run predating this field.

## Step 5 — offline, free dry-run test (real spend: $0)

Wrote a temporary script (`mcp-server/agent-poc/_tmp-dry-run-phase2.ts`) exercising
`parseInScopePlatforms()` + `resolveExplicitScopeCapabilities()` end-to-end against the real
`1b` file and a real (free) Postgres query — no `ai.generate()` call. Ran via
`node -r ts-node/register` (this project's own established convention for these scripts, per
root `package.json`). **Deleted immediately after recording its output below**, per this
project's diagnostic-script-cleanup rule.

Real output:

```
Marker present: true

Parsed 5 platform entries: (all 5 real, "Explicitly out of scope" correctly excluded)
Cloud backend's directive correctly parsed as literal "?"

5 valid entries (empty-repos entries: 0)

Resolved 24 real (repo, module) capabilities that WOULD be spawned:
  angular-app-oskey-io/{components,core,features} (3)
  firebase-oskey-dev/{access_control_device,admin,apps,building,call,core,
    organization,settings,supplier,tasks,unit_management,user} (12)
  ios-oskey-dev/{"iOS App",OSKDoorUnlockActivityExtension,OSKEYTests} (3)
  android-intercom-oskey-io/{app,kotlin-ble-kit-oskey-io,kotlin-usb-oskey-io,
    kotlin-webrtc-data-oskey-io,kotlin-webrtc-domain-oskey-io} (5)
  node-iot-api-oskey-io/access_control_device (1)
```

The parser and resolver are mechanically correct: correct marker detection, correct exclusion
of the "Explicitly out of scope" section, correct multi-repo/malformed-entry handling (none
malformed here), correct literal `"?"` preservation, correct directive-sharing across every
module resolved from the same platform, correct real, live Postgres resolution (verified
directly against the DB before writing any orchestration code — see below).

## Real, load-bearing discrepancy found — 24 capabilities, not 5

Doc 23's own Step 5 stated an expectation to confirm: "5 platforms in `1b`, each resolving to
exactly one real module." **This is false against live data**, checked directly (not assumed,
per this project's own standing discipline) before writing any code:

```
docker exec facts-postgres-index-local psql -U facts_index -d facts_index -c
  "SELECT repo, COUNT(DISTINCT module), array_agg(DISTINCT module) FROM facts
   WHERE repo IN (...5 repos...) GROUP BY repo;"
```

| repo | real module count |
|---|---|
| angular-app-oskey-io | 3 |
| firebase-oskey-dev | **12** |
| ios-oskey-dev | 3 |
| android-intercom-oskey-io | 5 |
| node-iot-api-oskey-io | 1 |

Root cause: the current "In-scope platforms" entry format (Phase 1, already built) only
supports repo-level narrowing (`<!-- repo: ... -->`), not module-level narrowing — so a platform
bullet like "Cloud backend" → `firebase-oskey-dev` fans out to **every** real module in that
repo, including ones almost certainly irrelevant to an `ownerNonResident` inhabitantType change
(`supplier`, `tasks`, `call`). This is not a bug in the code just built — it correctly
implements doc 16/17's actual design ("one capability per real `(repo, module)` pair," no module
narrowing specified) — it's a real gap in the format itself, only visible once resolved against
live data.

## Stopped before real spend — user decision

Flagged this finding to the user with the real closest cost comparable (`1b`, 5 capabilities,
old vector-routing path, grounding docs on: **$1.1989**, doc 11's own table — not estimated from
memory, per this project's standing rule) and a rough, explicitly-uncertain scaling range
(~$3-8+ for 24 capabilities, noting real cost doesn't scale purely linearly). Given the choice
between running all 24 for real, stopping to flag it as an open finding, or something else, the
user chose: **stop here, and edit `1b` themselves to narrow the Cloud backend platform's scope
correctly before any real run happens.** Per the user's own words, they are making that edit
themselves — `1b` was NOT touched by this session. **Step 6 (the real, paid test run) was not
performed.**

## Typecheck

`npx tsc --noEmit` run twice (after Step 1, and again after all steps): zero new errors both
times, in every file touched (`db/search.ts`, `agent-poc/capability-fanout-prd-agent.ts`,
`agent-poc/atomic-prd-agent.ts`). The same 7 pre-existing, unrelated `factId` errors remain in
`pipeline/facts-postgres-index/` (one already `decommissioned_`-prefixed) — confirmed these
predate this build and are untouched by it (same baseline as doc 18's Phase 0 completion doc).

## Real spend this session

**$0.** Step 1's `tsc --noEmit` runs: free. The one live Postgres query used to check real
module counts (`docker exec ... psql`): free, read-only. Step 5's dry run: one free Postgres
query via `resolveExplicitScopeCapabilities()`, zero embedding/LLM calls. Step 6 was not run.

## What's left

- The user is narrowing `1b`'s "Cloud backend" platform entry (likely to specific real
  `firebase-oskey-dev` modules relevant to `ownerNonResident`) before any real test run.
- Once narrowed, Step 6 (flag real spend, get approval, run the real capability-fanout test) is
  still the next real step for validating this mechanism live — not done this session.
- Phase 1's platform-entry format itself may be worth revisiting for optional module-level
  narrowing (not just repo-level) given this session's finding — a real, open question for a
  future decide-stage session, not decided or built here.
- Phase 3 (skill.v3.md directive-prioritization rule) is the other half of making the directive
  mechanism actually useful — the fact now reaches the model's context (Step 4 above) but
  nothing yet tells it to prioritize searching it first.

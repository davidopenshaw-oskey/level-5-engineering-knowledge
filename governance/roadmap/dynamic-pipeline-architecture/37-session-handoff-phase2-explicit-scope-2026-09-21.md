# Session hand-off — Phase 2 explicit-scope orchestration, ahead of a machine reboot

Written 2026-09-21 because the machine is rebooting shortly. This is a **separate thread** from
[36-session-handoff-2026-09-21.md](36-session-handoff-2026-09-21.md) — that doc covers a
different, concurrent session's work (`screen_fact_links` design, cross-repo-edges sequencing).
This doc covers Phase 0/Phase 2 of
[17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md](17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md).
Don't conflate the two threads.

**Read order for the next session**: this doc, then
[24-build-completion-explicit-scope-orchestration-phase2-2026-09-20.md](24-build-completion-explicit-scope-orchestration-phase2-2026-09-20.md)
(full Phase 2 build detail — repoFilter, parser, orchestration, directive threading, the
24-vs-5 capability-count discrepancy), then
[23-build-prompt-explicit-scope-orchestration-phase2-2026-09-20.md](23-build-prompt-explicit-scope-orchestration-phase2-2026-09-20.md)
only if deeper original-design context is needed.

## What's done and safely on disk (confirmed via grep, not assumed)

- Phase 0 (persona/template cleanup, `stories` rename): complete, see doc 18.
- Phase 2 (Steps 1-4, explicit-scope orchestration): complete, see doc 24. `search()` gained
  `opts.repoFilter`; `parseInScopePlatforms()`/`resolveExplicitScopeCapabilities()` exist;
  `main()` branches on the `**In-scope platforms**:` marker; `renderCapabilityContract()`
  threads a per-platform directive.
- **New since doc 24, not yet written up in its own doc**: a `<!-- modules: a, b, c -->` tag
  was added to the platform-entry format (`PlatformEntry.modules: string[]`, parsed in
  `parseInScopePlatforms()`, applied as an exact-match filter in
  `resolveExplicitScopeCapabilities()` with a loud `console.error` on any requested module name
  that doesn't match a real module for that repo — added specifically because this project's own
  `1b` file already has a real typo of this exact shape in its free-text directive prose
  ("users" vs. the real module "user")). Empty/absent tag = unchanged fall-back behavior (every
  real module in the named repo(s)). `mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md`
  now has this tag on its "Cloud backend" platform: `<!-- modules: building, user, organization,
  core, unit_management -->`, narrowing `firebase-oskey-dev` from 12 real modules to 5. Total
  real resolution for `1b` as it now stands: **17** capabilities (was 24 before this tag).

## Real bug found, fixed, NOT yet re-verified with a real run

A real, paid test run was attempted against the narrowed `1b` (command below). **All 17
capabilities failed identically**, each with `ENOENT` on its very first `search_facts` call.
Root cause: `capabilityKey(module, repo)` (added in doc 24's own work, to stop two capabilities
sharing a bare module name from colliding in debug filenames/meta dictionaries) returns
`"repo/module"` — and that literal `/` was being reused directly inside an actual filename
(`tool-calls-${key}.jsonl`, `llm-${key}.json`), which the filesystem read as a path separator
pointing at a subdirectory that was never created.

**Real, if modest, spend was wasted**: each of the 17 capabilities made one real embedding call
(`search()`) and at least one partial real Vertex `generate()` turn before crashing. No exact
dollar figure is available — the run never reached its own cost-computation step (`meta.json`
was never written; it fails closed with `[Fail-Closed] Every capability call failed`). The
failed run's partial debug output (Postgres query trace only, no LLM content) is at
`output/agent-runs/prds/test/debug/2026-09-20T17-37-02-494Z-1b-owner-non-resident-new-orchestration/postgres-queries.jsonl`
(529KB) if ever useful — not necessary reading.

**Fix applied and on disk**: added `sanitizeKeyForFilename()` (replaces `/` with `__`),
applied at the two real filename-construction call sites (`debugTraceToolCall`'s file path, and
`runCapability`'s `llm-<key>.json` dump). `capabilityKey()`'s own `/`-form is untouched
everywhere else (meta.json dictionary keys, console logs — safe, not filesystem paths).
Verified with a free, local, no-LLM check (write a file through the sanitized path) that this
actually works. `npx tsc --noEmit` clean (only the same 7 pre-existing, unrelated `factId`
errors in `pipeline/facts-postgres-index/` — confirmed unrelated before and after this whole
build).

**The fix itself has not been re-verified with a real run.** It's logically sound and passed a
free local check, but the actual `capability-fanout-prd-agent.ts` command hasn't been re-run
since the fix.

## Standing instruction — do not skip this

**The user explicitly said: "do not run the test again until i say."** This is real and current
as of this hand-off. The next session (or the resumed one, if the reboot doesn't kill it) must
NOT re-run `capability-fanout-prd-agent.ts` against `1b`, or anything else touching real spend
on this thread, without a fresh, explicit go-ahead from the user first.

## Exact command for when the user does say go

```
BUSINESS_REQUEST_FILE=mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md \
PERSONA_FILE=mcp-server/skills/prd/skill.v3.md \
TEMPLATE_FILE=mcp-server/skills/prd/template.v2.md \
CAPABILITY_MAX_CAPABILITIES=5 \
FULL_DEBUG=true \
GROUNDING_DOCS=true \
WORKFLOW_NAME=1b-owner-non-resident-new-orchestration \
RUN_KIND=test \
node -r ts-node/register mcp-server/agent-poc/capability-fanout-prd-agent.ts
```

Note `CAPABILITY_MAX_CAPABILITIES=5` has **zero effect** on this run — that env var only
applies to the old vector-routing path, not the explicit-scope path this file's marker
triggers. Real expected capability count: 17 (see above). Rough, explicitly uncertain cost
estimate before this run: ~$2-6, scaled off doc 11's real $1.1989-for-5-capabilities figure —
expect to correct this after the real run, per this project's own standing discipline (the last
two real estimates in this project were both wrong).

## Not done, real open items

- The actual live-verified re-run (blocked on the user's go-ahead, per above).
- Phase 3 (`skill.v3.md` directive-prioritization rule) — separate, later build, not started.
- Phase 1's platform-entry format could use a documented spec update now that `<!-- modules:
  -->` is real and supported — not written up as its own doc yet, only exists in code + this
  hand-off.

## No commits made

Per standing rule — nothing in this thread was ever staged or committed. `git status` will show
these files modified: `mcp-server/db/search.ts`, `mcp-server/agent-poc/capability-fanout-prd-agent.ts`,
`mcp-server/agent-poc/atomic-prd-agent.ts`, `mcp-server/agent-poc/section-content.ts`,
`mcp-server/skills/prd/{skill.v3.md,template.md,template.v2.md}`,
`mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md` — all real, intentional,
already-typechecked changes from this thread, safe to leave as-is.

## Unrelated concurrent work — not this thread's, don't touch blindly

`git status` also shows a large amount of unrelated, uncommitted work (docs 25-36, new
extraction scripts under `pipeline/facts-postgres-index/`, `governance/roadmap/ux-mappings/`,
new `mcp-server/test-questions/1c-*`/`1d-*` files, `package.json` changes) from a different,
concurrent session — not reviewed, not touched, not understood by this thread. Its own hand-off
is doc 36. Don't assume any of it is stray/accidental — check before touching, per this
project's own concurrent-collaboration discipline.

# Build prompt: extract a real route/component "screen map" skeleton, human fills the descriptions

Hand-off prompt for a new session, drafted 2026-09-21. Not yet dispatched/run as of writing
this file. Persisted per this project's own discipline (write real findings/hand-offs to
files as they happen).

---

Extract the real, already-existing `angular_route` facts for `angular-app-oskey-io` into a
single, human-editable JSON file — a stopgap "screen map" (route/component → plain-English
screen description) to test whether it reduces the real, measured turn/cost overhead a
capability scoped to a large, UX-context-poor module (`features`) currently burns rediscovering
structure that already exists in Postgres but has no human-meaning label attached to it. This
is a genuine BUILD task (extracting real data to a real file), but a narrow, low-risk one — no
architecture decision, no LLM/embedding spend, no schema change to `facts`. Real spend: **zero**
(pure Postgres read + local file write). Never `git add`/`git commit` unless explicitly asked.

## Real context (don't re-derive)

- `governance/roadmap/dynamic-pipeline-architecture/34-findings-citation-dropoff-and-cross-repo-gap-interaction-2026-09-21.md`
  and same-day conversation found: `angular-app-oskey-io/features` has 7,912 real facts (4.4x
  `firebase-oskey-dev/core`'s 1,798) and consistently burns its full turn budget across every
  real test run today, while `core` sometimes stops early once told its real budget.
- Confirmed live in Postgres, zero facts of kind `figma`/`ux`/`screen`/`workflow` exist for
  `angular-app-oskey-io` — the real Figma/UX-mapping gap named in project memory
  (`project_partial_pipeline_coverage_and_reverse_engineering_goal`, 2026-09-06, expected
  closed ~2026-09-19) is still genuinely open as of today, confirmed against the user's own
  `governance/roadmap/private-tasks.md` note ("the connection does not exist between figma and
  screen").
- **The real structural data already exists**, just without a human-meaning label: confirmed
  directly, `angular_route` facts already say things like `"details/:residentId --
  renders: OSKOrganizationInhabitantDetailsComponent"` and include real guard/child-route
  context (e.g. `"loads child routes from: ..."`, `"guarded by: OSKUserRoleGuard"`). Nothing
  needs to be re-extracted or newly AST-derived — this task is purely about turning what's
  already in Postgres into a shape a human can quickly annotate.
- Real, proven precedent this design reuses: `GROUNDING_DOCS` (capability-fanout-prd-agent.ts's
  existing mechanism, prepends real markdown files to every capability's system prompt) already
  showed real, positive effects same day (the historically-hard `formControlName` citation
  succeeding, real evidence of a persona doc's specific business rule being used deep into a
  long conversation) — this screen map is intended to eventually be wired in the same way, but
  **wiring it in and testing it is explicitly a separate, later task, not this one.**

## What to build

1. **Query real `angular_route` facts for `angular-app-oskey-io`** (start with `module =
   'features'`, the module driving the real turn-budget problem — check whether other modules
   have meaningful route counts too before deciding whether to broaden scope, don't assume
   `features`-only is sufficient without checking).
2. **Write one JSON file** (suggest `governance/roadmap/dynamic-pipeline-architecture/screen-map-angular-features.json`,
   or ask if unsure of the right location — this is real, durable project data, not a throwaway
   script output) — one real entry per real route, with this shape (adjust fields to what the
   real data actually supports, don't force a shape the data doesn't have):
   ```json
   {
     "route": "details/:residentId",
     "module": "features",
     "component": "OSKOrganizationInhabitantDetailsComponent",
     "file": "hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts:24",
     "realContext": "renders: OSKOrganizationInhabitantDetailsComponent",
     "screenName": null,
     "description": null
   }
   ```
   `realContext` carries whatever the real `description` column already states (guards, child
   routes, parent path) verbatim — real, code-derived, not invented. `screenName` and
   `description` are the two fields intentionally left `null` for the user to hand-fill
   (human-in-the-loop) — **do not fill these in yourself, do not guess a plausible-sounding
   description from the route/component name alone.** That's the entire point of leaving them
   null.
3. **Flag real duplicates/ambiguity loudly, don't silently resolve them** — matches this
   project's own established convention (`build-cross-repo-edges.ts`'s compound-key join,
   `resolveExplicitScopeCapabilities`'s unmatched-module handling both fail loud rather than
   guess). If two real route facts share the same route path (e.g. across different parent
   contexts) or the same component renders multiple real routes, represent that faithfully in
   the output rather than deduplicating or picking one arbitrarily — the human filling in
   descriptions needs to see the real shape, not a simplified guess at it.
4. **Report real counts** when done: how many real routes were found, how many distinct real
   components they map to, whether any real duplicates/ambiguities were found and how they were
   represented (not silently dropped).

## Explicitly not done here (separate, later tasks)

- Do not fill in `screenName`/`description` yourself.
- Do not wire this file into `GROUNDING_DOCS` or any other prompt-injection mechanism.
- Do not run any real test comparing `features`'s behavior with/without this map — that's a
  real-spend test for a later session, once the human descriptions are filled in.
- Do not decide the file's final home/naming beyond a reasonable first guess — flag it if
  genuinely unsure rather than over-committing to a location.

# Angular Pipeline (`/pipeline/angular-app-oskey-io`)

Independent knowledge extraction and synthesis pipeline for `https://github.com/oskey-io/angular-app-oskey-io` (branch `staging`).

This repo contains **two independent Angular 17 apps**, not one:
- `hosting/web-app` — the OSkey PGO Portal (property managers). **First app in scope.**
- `hosting/web-admin` — the Admin Portal. Planned as a second, separate extraction once `web-app`'s pipeline is proven — same config/scripts, different `modulesRoot`, treated as its own entry in the corpus per `governance/roadmap/angular-app-oskey-io/00-phase1-ast-extraction-design.md`.

Both apps are standalone-components-first (no `NgModule`), use Angular Signals (no NgRx), and are fully on the new `@if`/`@for`/`@switch` template control-flow syntax.

See `governance/roadmap/angular-app-oskey-io/00-phase1-ast-extraction-design.md` for the full design — real fact vocabulary, capability-partitioning approach (by `.routes.ts` boundary, not a flat folder convention like the Firebase pipeline), and the open decisions already resolved for this repo. Not built yet.

# Node-IoT Middleware Pipeline (`/pipeline/node-iot-api-oskey-io`)

Independent knowledge extraction and synthesis pipeline for `https://github.com/oskey-io/node-iot-api-oskey-io` (branch `staging`).

Verified from a real clone (not assumed): TypeScript, Express (via an internal `@oskey-io/npm-express-framework-oskey-io` wrapper), **MongoDB** (not Firestore — the old placeholder text here was wrong about this), `@google-cloud/pubsub`, Joi validation. Small repo — 46 `.ts` files under `src/v1/`.

Structure is genuinely different from both other pipelines: `src/v1/` splits by **technical layer** (`controllers/`, `routes/`, `handlers/`, `models/`, `schema/`, `core/`), not by business domain folders. The real business-domain grouping (e.g. `access_control_device`) shows up as a **filename prefix** within each flat layer folder (`access_control_device_configs.route.ts`, `access_control_device_activities.route.ts`, etc.), not as directory nesting — a third distinct organizing convention, different from Firebase's folder-based modules and Angular's route-tree features. `00-scan-repo.ts`'s existing directory-walk approach doesn't map onto this at all; module/submodule detection needs its own design here.

Design proposed in `governance/roadmap/node-iot-api-oskey-io/00-phase1-ast-extraction-design.md` — pending review before extraction logic is written. `phase-01-ast-extraction/` is currently an unmodified copy of the Firebase pipeline's scaffolding (scripts `00`–`07` + `_shared/`), not yet adapted to this repo's real structure.

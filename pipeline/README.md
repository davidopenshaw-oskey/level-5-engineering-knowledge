# Knowledge Pipeline (`/pipeline`)

Turns each indexed repository's source into structured **facts**, loads them into a local Postgres/pgvector index, then derives **edges** between them (within a repo and across repos). The MCP server and the PRD agent read from that Postgres index, not from files on disk.

Last verified against the live system: 2026-09-21 (all 9 repos' on-disk runs matched Postgres; see [Detecting drift](#detecting-drift)).

Known open drift on that date: every `INTRA_REPO_CALL` edge in Postgres was built on 2026-09-11, but android-intercom (09-18), ios-oskey-dev and the three Swift kits (09-20) have been re-extracted and re-synced since. 153 of those edges point at facts that no longer exist (swift-ui-kit 108, swift-webrtc-kit 37, swift-ble-kit 6, android-intercom 2); all are `unresolved`/`probable`, which traversal never follows, so they are harmless for now. Separately, `android-intercom-oskey-io`'s current run (`20260918_154849-f2cac85f`) only ran `00`, `01`, `02` and `05`, so it has no `resolved-engineering-graph.json` at all. Fix: `04` for that repo, then Stage C for every repo above, then Stage D. The resolved cross-repo edges are the ones that would break traversal if a repo is re-synced without rebuilding them.

---

## The one thing to remember

**Extraction writes files. Postgres only changes when you run the sync step.** They are separate steps and nothing runs the second one for you: there is no npm script for it, and the `pipeline:<repo>` orchestrators stop at step 07. If you re-extract and skip the sync, `output/` moves on while the index (and everything built on it) keeps serving the old run. That is how the runs fell out of step in recent weeks. Run the whole sequence below, or run the [drift check](#detecting-drift) before trusting any result.

---

## Directory map

```
pipeline/
├── <repo>/phase-01-ast-extraction/     ◄── per-repo extraction, steps 00–07 (repo-specific TS/Kotlin logic)
│   ├── angular-app-oskey-io/
│   ├── firebase-oskey-dev/
│   ├── node-iot-api-oskey-io/
│   └── android-intercom-oskey-io/
├── swift/phase-01-ast-extraction/      ◄── ONE shared 00–07 chain for all Swift repos (uses a compiled swift-extractor binary)
├── ios-oskey-dev/phase-01-ast-extraction/   ◄── only its own 00-scan-repo.ts (Xcode project discovery); then reuses swift/ 01–07
├── android-oskey-io/                   ◄── NOT onboarded; one standalone tool, not part of any run (see below)
├── <repo>/phase-02-inter-module-synthesis/  ◄── legacy LLM report synthesis (firebase, angular, node-iot); NOT part of the sequence below
└── facts-postgres-index/               ◄── Postgres load, embeddings, edge builders, screen maps, retrieval helpers
    ├── docker-compose.yml, schema-proposal.sql
    ├── sync-facts.ts
    ├── build-intra-repo-edges.ts, build-cross-repo-edges.ts, build-form-field-lineage-edges.ts
    ├── extract-screen-map-{angular,ios,android}.ts
    └── _shared/                        ◄── embedding adapter, search, graph traversal, PRD assembly (used by the MCP server / agent)
```

`config/repos.json` is the registry of indexed repos (branch or pinned commit, module roots, AST settings). Repos not listed there are not indexed.

### Indexed repos and their extraction commands

| Repo | Command | Source |
|---|---|---|
| `firebase-oskey-dev` | `npm run pipeline:firebase` | branch `staging` |
| `angular-app-oskey-io` | `npm run pipeline:angular` | branch `staging` |
| `node-iot-api-oskey-io` | `npm run pipeline:node-iot` | branch `staging` |
| `android-intercom-oskey-io` | `npm run pipeline:android-intercom` | branch `develop` |
| `ios-oskey-dev` | `npm run pipeline:ios-oskey-dev` | branch `master` |
| `swift-ble-kit-oskey-dev` | `npm run pipeline:swift-ble-kit` | pinned commit |
| `swift-cloud-kit-oskey-dev` | `npm run pipeline:swift-cloud-kit` | pinned commit |
| `swift-ui-kit-oskey-dev` | `npm run pipeline:swift-ui-kit` | pinned commit |
| `swift-webrtc-kit-oskey-io` | `npm run pipeline:swift-webrtc-kit` | pinned commit |

`android-oskey-io` (the end-user Android app) is **not** onboarded: no `repos.json` entry, no scan, no facts. `android-oskey-io/phase-01-ast-extraction/extract-firebase-callable-calls.ts` is a standalone, manually invoked tool that writes no facts.

---

## Run sequence

Run from the repo root. Stages A–C are per repo; D–F run once, after every repo you care about has been through B (and C where applicable).

The stage letters here are this README's own. The build docs under `governance/roadmap/dynamic-pipeline-architecture/` (for example doc 38) use a different A–E lettering for the individual edge joins, so "Stage E" means form-field lineage here and Firestore-trigger edges there. When in doubt, go by the script or `--join=` name.

### Stage 0 — prerequisites (once per machine/session)

- Postgres is up: `docker compose -f pipeline/facts-postgres-index/docker-compose.yml up -d` (container `facts-postgres-index-local`, port 5433). The schema (`schema-proposal.sql`) is already applied to the running instance. How it is stored, how to connect, and how to back it up: [README_postgres.md](README_postgres.md). There is no automatic backup.
- `.env` holds the Vertex AI credentials (only needed for embeddings, Stage B2).
- Swift repos only: the extractor binary must exist. If `01-extract-ast-evidence` fails with "swift-extractor binary not found", run `swift build -c release` in `pipeline/swift/phase-01-ast-extraction/swift-extractor/`.

### Stage A — extract (per repo, writes files only)

```bash
npm run pipeline:<repo>          # e.g. npm run pipeline:firebase — see the table above
```

Runs `00-scan-repo` → `07-build-intra-module-coupling-graph` in order, with `REPO_NAME` set. The steps:

| Step | Produces |
|---|---|
| `00-scan-repo` | Clones/checks out the repo to `output/clones/<repo>`, writes `output/<repo>/run-context.json` (the new `runId`, commit SHA) and the module/file inventory. **Always first; it defines the run.** |
| `01-extract-ast-evidence` | Raw AST facts |
| `02-build-module-evidence` | Per-module evidence graphs and fact IDs |
| `03-build-benchmark` | Benchmark metrics (not read by Postgres) |
| `04-build-resolved-graph` | `resolved-engineering-graph.json` (call graph; read by Stage C) |
| `05-partition-capability-packs` | `modules/<module>/capability-packs/*.json` (**the only thing Stage B reads**) |
| `06-…dependency-graph`, `07-…coupling-graph` | Per-module dependency/coupling JSON (not read by Postgres) |

Rules that have bitten before:

- **`04` must run after `02`.** `02` assigns the fact IDs `04` resolves against. A stale `04` produced dangling graph edges for `ios-oskey-dev` and `android-intercom-oskey-io` (`governance/roadmap/graphrag/05-prompt-10-resolved-graph-staleness-findings.md`). Running the full chain avoids this; a partial `00→02→05` refresh is fine for facts but leaves `04`/`06`/`07` stale, so don't run Stage C afterwards without re-running `04`.
- Stage C's freshness check only compares `runId`. It does not catch a `04` that is older than `02` within the same run.
- Use the orchestrator, not individual steps, unless you know why you're skipping.

### Stage B — sync to Postgres (per repo, per module) — **the step that gets missed**

`sync-facts.ts` loads one module's capability packs into Postgres. It needs both `REPO_NAME` and `MODULE_NAME` and fails closed without either, so a repo needs one invocation per module. Loop over the modules that exist in the current run instead of typing them:

```bash
REPO=firebase-oskey-dev
RUN=$(node -p "require('./output/$REPO/run-context.json').runId")
while IFS= read -r MODULE; do
  REPO_NAME=$REPO MODULE_NAME="$MODULE" node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts </dev/null
done < <(ls "output/runs/$REPO/$RUN/knowledge-pipeline/modules")
```

(`ios-oskey-dev` has a module named `iOS App`, with a space. A plain `for MODULE in $(ls ...)` splits it into `iOS` and `App`, which is why this uses `read` line by line. The `</dev/null` stops the script from swallowing the rest of the module list.)

What it does: records the run in `extraction_runs` and marks it current for that repo, upserts every fact, prunes facts that no longer exist, and nulls the embedding of any fact whose description changed.

**B2 — embeddings (paid).** The sync is free and never calls the embedding model unless you ask. It prints how many facts are left without an embedding; if that number is above zero, re-run that module with `EMBED=true`:

```bash
EMBED=true REPO_NAME=$REPO MODULE_NAME="$MODULE" node -r ts-node/register pipeline/facts-postgres-index/sync-facts.ts
```

Facts whose description did not change keep their embedding, so an unchanged re-extraction costs nothing (the 2026-09-20 Swift/iOS re-run re-embedded 0 of ~33,700 facts). Un-embedded facts are invisible to semantic search, so don't leave them.

### Stage C — intra-repo call edges (per repo; needs Stage B for that repo)

```bash
REPO_NAME=<repo> node -r ts-node/register pipeline/facts-postgres-index/build-intra-repo-edges.ts
```

Loads that repo's `resolved-engineering-graph.json` into `cross_repo_edges` as `INTRA_REPO_CALL`. It refuses to load if the graph's `runId` differs from Postgres's current run. Supported: firebase, angular, android-intercom, and the Swift family. `node-iot-api-oskey-io` is intentionally not loaded (its graph resolved only 8% of calls, with 0 confirmed edges, when checked), which is why node-iot has no `INTRA_REPO_CALL` edges at all. Kotlin/Swift edges have no target fact ID by design (the graph doesn't carry one), so they load as `probable`/`unresolved` with a null target. Graph traversal only follows `resolved`/`confirmed` edges, so today only Firebase and Angular intra-repo edges are ever followed by the agent.

### Stage D — cross-repo edges (once; needs every participating repo synced)

```bash
node -r ts-node/register pipeline/facts-postgres-index/build-cross-repo-edges.ts --dry-run    # look first
node -r ts-node/register pipeline/facts-postgres-index/build-cross-repo-edges.ts
```

Reads facts from Postgres (not files), so it is only as current as Stage B. Five joins, each replacing only its own `(connection_type, source_repo)` rows in one transaction, and only if its preflight passes and the new set isn't smaller than the old one:

| Join (`--join=`) | Edge type | Connects |
|---|---|---|
| `firebase-callable` | `HTTP_API_CALL` | client `firebase_callable_call` → Firebase callable `api_contract` (compound key: module + callable name) |
| `pubsub-binding` | `PUBSUB_TOPIC_BINDING` | Pub/Sub publish sites → receiving route or handler, using the committed subscriptions snapshot `governance/reference-docs/pubsub.bindings.staging.json` (staging only, a static copy of GCP config that goes stale silently). Bindings with no publisher fact are recorded `unresolved` under `source_repo = 'unknown'` |
| `package-symbol-use` | `PACKAGE_SYMBOL_USE` | Swift call sites → declarations in another indexed package |
| `rest-route` | `HTTP_API_CALL` | Android Retrofit calls → REST route facts |
| `firestore-trigger` | `FIRESTORE_EVENT_TRIGGER` | Firebase Firestore write call sites → the create/update/delete trigger handler registered on that collection path. Same-repo (Firebase to Firebase), `ast_derived`, `resolved`. Needs the writer's collection path to be resolved; Firebase auth triggers have no path and are skipped |

Flags: `--join=<name>[,<name>]`, `--dry-run`, `--print-edges`, `--accept-shrink` (allow a smaller edge set; only after you've looked at why). Repo names are discovered from the data, not hardcoded. Re-run this after any Stage B that changed facts in a participating repo, since edges are computed from the facts currently in Postgres.

### Stage E — form-field lineage (once; needs Stage D's `firebase-callable` edges)

```bash
node -r ts-node/register pipeline/facts-postgres-index/build-form-field-lineage-edges.ts
```

Traces Angular form controls through the resolved call chain to the backend request type and writes `FIELD_BINDING` edges. It reuses the `HTTP_API_CALL` edges from Stage D, so it must come after.

### Stage F — screen maps (optional; needs Stage B)

Human-editable JSON substitutes for missing Figma/UX input. Idempotent and merge-aware: filled-in names/descriptions are preserved, and routes that disappeared are kept but flagged on stderr.

```bash
node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-angular.ts
node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-ios.ts
node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-android.ts
```

Output goes to `governance/reference-docs/screen-map-*.json`. Read-only against Postgres, no spend.

---

## What to run when

| Situation | Run |
|---|---|
| One repo has new commits | A → B (→ B2 if it reports un-embedded facts) → C for that repo, then D, then E if Angular or Firebase changed |
| Extractor code changed | A → B → C for every affected repo, then D, E |
| Just want the index current with what's already extracted | B (and B2) for the repos the drift check flags |
| Rebuilding edges only | D, then E |

## Detecting drift

Two read-only checks. Run them before trusting a result, and after any session that touched extraction. Neither writes anything.

Run-level: does Postgres's current run for each repo match the latest run on disk?

```bash
for f in output/*/run-context.json; do
  repo=$(basename "$(dirname "$f")")
  disk=$(node -p "require('./$f').runId")
  db=$(docker exec facts-postgres-index-local psql -U facts_index facts_index -tAc "select run_id from extraction_runs where repo='$repo' and is_current")
  if [ "$disk" = "$db" ]; then echo "OK      $repo  $disk"; else echo "DRIFT   $repo  disk=$disk  postgres=${db:-<none>}"; fi
done
```

Module-level: catches a repo that was synced for some modules but not all (the run-level check can't see this, because the first module's sync already marks the run current). It also flags the reverse: a module that has facts in Postgres but no longer exists in the current run (renamed or removed upstream). `sync-facts.ts` only prunes within the module it is given, so those orphaned facts are not removed automatically. Check what they are before deleting anything (`select kind, count(*) from facts where repo='<repo>' and module='<module>' group by 1`), then remove them by hand.

```bash
for f in output/*/run-context.json; do
  repo=$(basename "$(dirname "$f")"); run=$(node -p "require('./$f').runId")
  disk=$(ls "output/runs/$repo/$run/knowledge-pipeline/modules" | sort)
  db=$(docker exec facts-postgres-index-local psql -U facts_index facts_index -tAc "select distinct module from facts where repo='$repo'" | sort)
  [ "$disk" = "$db" ] && echo "OK      $repo" || { echo "DRIFT   $repo"; diff <(echo "$disk") <(echo "$db"); }
done
```

What these do not cover: whether `04` is older than `02` within a run, whether edges (Stages C–E) were rebuilt after the last sync, and whether any facts are still missing embeddings. To check the last one: `select repo, count(*) from facts where embedding is null group by 1;` against the same container.

## Legacy: phase-02 synthesis

`firebase-oskey-dev`, `angular-app-oskey-io` and `node-iot-api-oskey-io` still contain `phase-02-inter-module-synthesis/` (LLM-written module and repo reports, run via `npm run synthesize:<repo>`). It is not part of the facts pipeline above, no code in `facts-postgres-index/` or `mcp-server/` imports it, and the Swift/Kotlin repos never had it. Treat it as legacy.

The older `pipeline/cross-repo-synthesis/` folder no longer exists; its 118 name-only cross-repo edges were replaced by Stage D.

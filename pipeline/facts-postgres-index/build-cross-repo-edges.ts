// **version:** 1.6.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// Task 2 of governance/roadmap/facts-serving-strategy/14-inbound-outbound-
// surface-graph-tasklist.md: real, deterministic cross-repo edges between
// Angular's `firebase_callable_call` facts and Firebase's `api_contract`
// facts. Compound key only -- (module, handlerName) -- never bare-name
// matching. Confirmed necessary, not theoretical: Firebase's own facts
// contain two real handler-name collisions across modules
// (`removeInhabitantFromUnit` in both `admin` and `unit_management`;
// `getAllOrganizations` in both `admin` and `organization`) -- a bare-name
// join would silently pick one and never announce the ambiguity.
//
// A prior artifact already attempted this exact join --
// pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-
// cross-repo-graph.ts -- and its real, on-disk output (118 edges,
// generatedAt 2026-08-29) is already loaded into this same database's
// `cross_repo_edges` table. That script's join keys purely by bare
// handler name (`callableExportName`), with no module qualifier --
// exactly the bug this script exists to fix. Not reused, not imported
// (also out of scope per this pipeline's own boundary) -- its existing
// HTTP_API_CALL rows are replaced here with correctly-computed ones.
// PUBSUB_TOPIC_BINDING rows are untouched by this script -- that's a
// separate, already-confirmed manual mapping (task 3), not derived by
// this join at all.
//
// Reads live Postgres facts directly, not the old script's on-disk
// facts/ast-*.json files -- more current. Real bug caught before this
// script's first real run counted as done: `callableExportName` is the
// correct join key (Firebase's externally-exposed callable name, e.g.
// "updateUserProfileAndPhoneNumber"), NOT `handlerName` (the internal
// function name, e.g. "onUpdateUserProfileAndPhoneNumberCalled" -- a real,
// common `on{Action}Called` wrapper convention, confirmed to differ from
// callableExportName in 78 of 253 real callable facts). A first version of
// this script queried top-level `payload->>'callableExportName'` (0/253
// populated -- the same "mirrored subset at top level, full data under
// evidence" pattern already hit once this session for `functionName`) and
// fell back to `handlerName`, silently under-resolving real matches like
// this one. Fixed to read `payload->'evidence'->>'callableExportName'`
// (253/253 populated, confirmed real) as the actual join key.
//
// Refactored 2026-09-21 (prompt-4 Stage 0, governance/roadmap/dynamic-pipeline-
// architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md): the
// script is now a list of `Join`s (`--join=<name>` runs one), each computing its
// full edge set first and only then replacing its own `(connection_type,
// source_repo)` slices in one transaction. Nothing is deleted unless a preflight
// passes and the new slice is not smaller than the old one (`--accept-shrink`
// overrides). `--dry-run` computes and prints, writes nothing. NOTE: the older
// header text above describes the original single-join script; where it says
// PUBSUB_TOPIC_BINDING rows are untouched, that stopped being true when task 3
// was added below -- the `pubsub-binding` join owns them.
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

// ---------------------------------------------------------------------------
// Extractor-contract literals -- the ONE legitimate place for hardcoded names.
// Every join below depends on these fact kinds / payload field names, each
// owned by an extractor outside this script (the extractor named in each
// comment). Nothing else in this file names a fact kind or payload field. If an
// extractor renames one, the join's preflight (below) finds zero rows with it
// and aborts loudly instead of computing an empty edge set and wiping good
// edges. Repo names are NOT contracts: repos are discovered from the data.
// ---------------------------------------------------------------------------
const CONTRACT = {
  // firebase_callable_call: emitted by the Angular and Swift extractors for a
  // client call to a Firebase callable. `evidence.functionName` is the
  // "module-handler" string the client passes (e.g. "user-updateProfile").
  CALLABLE_CALL_KIND: "firebase_callable_call",
  CALLABLE_CALL_FUNCTION_NAME: "functionName", // under payload.evidence
  CALLABLE_CALL_REQUEST_TYPE: "requestTypeText", // under payload.evidence
  CALLABLE_CALL_RESPONSE_TYPE: "responseTypeText", // under payload.evidence

  // api_contract: emitted by the Firebase extractor. A callable's externally
  // exposed name is `evidence.callableExportName` (NOT handlerName -- see the
  // file header); `payload.contractType = 'callable'` selects callables.
  API_CONTRACT_KIND: "api_contract",
  API_CONTRACT_TYPE_FIELD: "contractType", // top-level payload field
  API_CONTRACT_TYPE_CALLABLE: "callable",
  API_CONTRACT_CALLABLE_EXPORT_NAME: "callableExportName", // under payload.evidence
  // A Pub/Sub push-receiver handler is flagged `evidence.pubsubPushReceiver =
  // 'true'`, and its handler name is the top-level `payload.value`.
  API_CONTRACT_PUBSUB_RECEIVER: "pubsubPushReceiver", // under payload.evidence
  API_CONTRACT_PUBSUB_RECEIVER_TRUE: "true",
  API_CONTRACT_VALUE: "value", // top-level payload field

  // external_hook with evidence.type = 'pubsub_publish_call': emitted by the
  // node-iot and Firebase extractors for a Pub/Sub publish call site.
  // `evidence.value` is the topic text; `evidence.topicResolutionStatus` says
  // whether it was statically resolvable.
  EXTERNAL_HOOK_KIND: "external_hook",
  EXTERNAL_HOOK_TYPE: "type", // under payload.evidence
  EXTERNAL_HOOK_PUBSUB_PUBLISH: "pubsub_publish_call",
  EXTERNAL_HOOK_TOPIC_VALUE: "value", // under payload.evidence
  EXTERNAL_HOOK_TOPIC_STATUS: "topicResolutionStatus", // under payload.evidence
  EXTERNAL_HOOK_TOPIC_STATUS_RESOLVED: "resolved",

  // call_expression: emitted by the Swift extractor for each call site.
  // `evidence.resolutionMethod = 'resolved_via_import'` plus a
  // `evidence.declarationRepo` other than the fact's own repo marks a call into
  // another indexed package; `declarationFile` is the file in that package that
  // declares the callee; `calleeExpression` is the callee text (can be a long
  // multi-line expression, its leading identifier is the declared symbol);
  // `declarationModule` is the package's module name (used only in `details`).
  CALL_EXPRESSION_KIND: "call_expression",
  CALL_RESOLUTION_METHOD: "resolutionMethod", // under payload.evidence
  CALL_RESOLVED_VIA_IMPORT: "resolved_via_import",
  CALL_DECLARATION_REPO: "declarationRepo", // under payload.evidence
  CALL_DECLARATION_FILE: "declarationFile", // under payload.evidence
  CALL_DECLARATION_MODULE: "declarationModule", // under payload.evidence
  CALL_CALLEE_EXPRESSION: "calleeExpression", // under payload.evidence
  // The Swift extractor names each declaration fact `<construct>_declaration`
  // (struct_, class_, enum_, protocol_, function_, extension_declaration). This
  // suffix is how "declaration-like" is recognised, instead of a kind list, so
  // a new construct is picked up without touching this script. A `call_expression`
  // in the same file with the same name is NOT a declaration and never matches.
  DECLARATION_KIND_SUFFIX: "_declaration",
  EXTENSION_DECLARATION_KIND: "extension_declaration",

  // rest_endpoint_call: emitted by the Android extractor for each Retrofit
  // interface method (`@GET("/v1/iot/...")`). `evidence.httpMethod` is the verb;
  // `evidence.path` is the HTTP path (`{x}` marks a path parameter).
  REST_CALL_KIND: "rest_endpoint_call",
  REST_CALL_HTTP_METHOD: "httpMethod", // under payload.evidence
  REST_CALL_PATH: "path", // under payload.evidence
  // route_definition: emitted by the node-iot extractor for each registered
  // route. The verb is `evidence.method` and the HTTP path is `evidence.httpPath`
  // (`:x` marks a path parameter); `evidence.path` on this kind is the SOURCE
  // FILE, not the HTTP path. The same route is also packed into the top-level
  // `payload.value` as "METHOD /path": read only as a warn-only cross-check.
  ROUTE_KIND: "route_definition",
  ROUTE_METHOD: "method", // under payload.evidence
  ROUTE_HTTP_PATH: "httpPath", // under payload.evidence
  ROUTE_PACKED_VALUE: "value", // top-level payload field, "METHOD /path"

  // firestore_trigger: emitted by the Firebase extractor for each `.onCreate/.onUpdate/
  // .onDelete(handler)` registration. `evidence.firestorePath` is "unknown" for every
  // one (never resolved), and the event is not a field: it is the last identifier of
  // `evidence.calleeExpression`. The handler is `evidence.handlerName`, declared at
  // `evidence.handlerDeclarationFile` starting at `evidence.handlerStartLine`.
  // NOTE the kind also tags Firebase AUTH triggers (`auth.user().onCreate`); those have
  // no sibling path fact and are skipped as "no path".
  TRIGGER_KIND: "firestore_trigger",
  TRIGGER_CALLEE: "calleeExpression", // under payload.evidence
  TRIGGER_HANDLER_EXPRESSION: "handlerExpression", // under payload.evidence, e.g. "Service.onDocumentCreated"
  TRIGGER_HANDLER_NAME: "handlerName", // under payload.evidence
  TRIGGER_HANDLER_FILE: "handlerDeclarationFile", // under payload.evidence
  TRIGGER_HANDLER_START_LINE: "handlerStartLine", // under payload.evidence
  TRIGGER_HANDLER_RESOLUTION: "handlerResolutionStatus", // under payload.evidence
  TRIGGER_HANDLER_RESOLVED: "resolved",
  // firestore_path_touched: the trigger's document path is the top-level `payload.value`
  // of the sibling fact at the same file, line and (top-level) `payload.runId`.
  PATH_KIND: "firestore_path_touched",
  PATH_VALUE: "value", // top-level payload field
  FACT_RUN_ID: "runId", // top-level payload field, on trigger and path facts
  // call_expression fields used to read a Firestore write (see CALL_EXPRESSION_KIND above):
  // `evidence.declarationMethod` is the resolved callee, `evidence.arguments[0]` its first
  // argument's source text, `evidence.callerName` / `callerStartLine` the enclosing method.
  CALL_RESOLUTION_STATUS: "resolutionStatus", // under payload.evidence
  CALL_RESOLUTION_OK: "resolved",
  CALL_DECLARATION_METHOD: "declarationMethod", // under payload.evidence
  CALL_ARGUMENTS: "arguments", // under payload.evidence, array of source texts
  CALL_CALLER_NAME: "callerName", // under payload.evidence
  CALL_CALLER_CLASS: "callerClass", // under payload.evidence
  CALL_CALLER_START_LINE: "callerStartLine", // under payload.evidence
} as const;

// Stage E (Firestore triggers). The Firebase repo's base controllers (core/controllers/
// document.controller.ts, document_and_message.controller.ts) wrap every Firestore write;
// each takes the COLLECTION path as its first parameter (read in the staging clone). Which
// trigger events each wrapper can fire: `_set` overwrites, so it fires create if the
// document is new and update if it exists; a delete wrapper fires delete for each document.
const FIRESTORE_WRITE_WRAPPERS: Record<string, string[]> = {
  _set: ["create", "update"],
  _create: ["create"],
  _add: ["create"],
  _update: ["update"],
  _delete: ["delete"],
  _deleteAll: ["delete"],
  _deleteCollection: ["delete"],
};
// A trigger registration's event, from the last identifier of its callee expression.
const FIRESTORE_TRIGGER_EVENTS: Record<string, string> = { onCreate: "create", onUpdate: "update", onDelete: "delete" };
// The exact wording the user specified for a `set`-style write's edge.
const SET_EVENT_DETAILS = "fires as create if the document is new, as update if it exists";

// Stage C (android -> node-iot). Heuristics as named constants; the failure mode
// of each is `unresolved`, never a wrong `resolved`.
// A route only matches when at least this many of its segments are literals, so
// a route made mostly of parameters cannot match by accident.
const MIN_LITERAL_SEGMENTS = 2;
// The gateway fact behind Stage C. Android reaches node-iot through Apigee, which
// strips the `/iot` prefix, so the client path and node-iot's route differ by a
// prefix that no indexed repo contains. The statement below is the product
// owner's word, not derived from any indexed source, which is why Stage C edges
// are `externally_configured` (never blended with `ast_derived`). It goes
// verbatim into every Stage C edge's `details` and `confirmed_via`.
const APIGEE_CONFIRMATION =
  "reaches node-iot via Apigee, /iot prefix stripped; confirmed by the product owner 2026-09-21; gateway config not in the indexed repos";

// D1 (pub/sub). The committed snapshot of a read-only GCP subscriptions listing is
// the join's input for topic -> subscription -> push endpoint, which lives in GCP
// config, not in any indexed source. Staging only, and moment-in-time: every edge
// it produces carries the snapshot's extractedAt. The pipeline itself never calls
// GCP; refreshing the file is a separate, deliberate step.
const PUBSUB_SNAPSHOT_REL = "governance/reference-docs/pubsub.bindings.staging.json";
const PUBSUB_SNAPSHOT_FILE = path.join(process.cwd(), ...PUBSUB_SNAPSHOT_REL.split("/"));
const PUSH_DELIVERY = "push"; // snapshot `deliveryType` of a push subscription
const PUSH_HTTP_METHOD = "POST"; // Pub/Sub push always POSTs to the endpoint
// Cloud Functions scheduled triggers are delivered through App Engine push handlers.
const APP_ENGINE_PUSH_PREFIX = "/_ah/push-handlers/";
// Firebase names a scheduled function's topic firebase-schedule-<group>-<name>-<region>;
// capture 1 is "<group>-<name>". Used only to look up facts that name the trigger.
const SCHEDULE_TOPIC = /^firebase-schedule-(.+?)-[a-z]+-[a-z]+\d+$/;
// External, dated, source-cited statement (node-iot git history, user-confirmed 2026-09-21):
// node-iot commit 32e3d97 (2025-09-26, CLD1-1209) removed these push routes on purpose, so
// staging subscriptions that still point at them are dangling. Applied ONLY to an unmatched
// push binding whose endpoint ends in one of these route names; any other unmatched binding
// gets the generic "no route matches" reason and no claim about a removal. Not derivable from
// facts, so it is a named constant like APIGEE_CONFIRMATION, not a hidden literal.
const REMOVED_PUSH_ROUTES = { commit: "32e3d97", date: "2025-09-26", ticket: "CLD1-1209", routeNames: ["state", "system-log", "access-log", "access-command"] };

// Stage B heuristics (named constants, not inline magic). Failure mode of each
// is safe: it falls through to `unresolved`, never to a wrong `resolved` edge.
// The declared symbol is the leading identifier of the callee text, e.g.
// "OSKUIBottomPopup { ... }.showAndReplace" -> "OSKUIBottomPopup".
const LEADING_IDENTIFIER = /^\s*([A-Za-z_]\w*)/;
// Tie-break: when a class/struct and its `extension`s share a name in one file,
// the primary declaration is the one whose kind is not EXTENSION_DECLARATION_KIND.
// More than one primary, or only extensions, stays unresolved.

// `target_repo` for an edge that has no target fact (all `unresolved` edges).
// This value is already in the live table and in the baseline; do not change it.
const UNKNOWN_REPO = "unknown";

// Task 3's real, manually-curated pub/sub mapping -- ported from
// pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-
// cross-repo-graph.ts's EXTERNAL_PUBSUB_BINDINGS (real prior investigation,
// found while starting task 2, not re-derived from scratch). This
// connection type is NOT AST-derivable at all, unlike the HTTP_API_CALL
// join above: node-iot's real, resolved publish call site never names the
// receiving Firebase endpoint, and Firebase's real receiver
// (`processPubSubMessage`, a plain HTTP push endpoint) never references
// the topic name anywhere in its own source. The topic -> subscription ->
// push-endpoint binding lives entirely in GCP Pub/Sub subscription config,
// external to both repos' application source. Confirmed 2026-08-29 via
// three independent lines of evidence, none of them AST-derivable: (1) the
// GCP subscription naming convention `{topic}-{handlerName}` (the real
// subscription is literally named
// `accessControlDevice_activities-processPubSubMessage`), (2) an explicit
// code comment in Firebase's `pub_sub_receiver.service.ts` reading "This
// case handles the specific payload from node-iot for device activities",
// and (3) the message shape node-iot's own publish call site sends
// matching what that same handler case destructures. Add an entry here
// ONLY once independently confirmed this same way -- never on a
// naming-convention guess alone. Real, checked 2026-09-03: node-iot's own
// facts currently show exactly one other real publish call site
// (`topicName` at pubsub.service.ts:19, confidence: candidate,
// topicResolutionStatus: unsupported -- a dynamic argument, genuinely not
// statically resolvable) -- correctly left unresolved below, not guessed.
//
// STATUS (2026-09-21, prompt-4 Stage D1): no longer the source of any edge. The
// `pubsub-binding` join now takes topic -> subscription -> endpoint from the
// committed subscriptions snapshot (PUBSUB_SNAPSHOT_REL) and uses this list ONLY as
// a warn-only cross-check that the snapshot join reproduces it. Delete it in a
// follow-up once the cross-check has agreed; do not add new entries.
const CONFIRMED_PUBSUB_BINDINGS: Array<{ topicName: string; firebaseHandlerValue: string; confirmedVia: string }> = [
  {
    topicName: "accessControlDevice_activities",
    firebaseHandlerValue: "processPubSubMessage",
    confirmedVia:
      'GCP subscription "accessControlDevice_activities-processPubSubMessage" (naming convention) + ' +
      'pub_sub_receiver.service.ts "activities" case code comment ("payload from node-iot for device activities") + ' +
      "matching message shape (data.entity.activity) -- confirmed 2026-08-29, not AST-derivable.",
  },
];

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

interface EdgeRow {
  sourceRepo: string;
  sourceSymbol: string;
  sourceFactId: string | null; // null for a snapshot binding with no publisher fact
  targetRepo: string;
  targetSymbol: string;
  targetFactId: string | null;
  resolutionStatus: "resolved" | "unresolved";
  confirmedVia: string | null;
  details: string;
}

// One join = one way of deriving edges of one connection_type. `sourceRepos`
// is always discovered from the data by `discoverSourceRepos`; a join owns the
// `(connectionType, sourceRepo)` slices for exactly those repos.
interface Join {
  name: string; // the value of --join=
  connectionType: string;
  provenance: "ast_derived" | "externally_configured";
  discoverSourceRepos(db: Pool): Promise<string[]>;
  // Returns human-readable problems; empty = safe to compute and replace.
  preflight(db: Pool, sourceRepos: string[]): Promise<string[]>;
  compute(db: Pool, sourceRepos: string[]): Promise<EdgeRow[]>;
}

async function countFacts(db: Pool, whereSql: string, params: unknown[]): Promise<number> {
  const r = await db.query<{ n: string }>(`SELECT count(*)::text AS n FROM facts WHERE ${whereSql}`, params);
  return Number(r.rows[0].n);
}

// ---------------------------------------------------------------------------
// Join 1: client `firebase_callable_call` -> Firebase callable `api_contract`
// (HTTP_API_CALL). Compound key only -- (module, callableExportName).
// ---------------------------------------------------------------------------
const firebaseCallableJoin: Join = {
  name: "firebase-callable",
  connectionType: "HTTP_API_CALL",
  provenance: "ast_derived",

  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(`SELECT DISTINCT repo FROM facts WHERE kind = $1 ORDER BY repo`, [CONTRACT.CALLABLE_CALL_KIND]);
    return r.rows.map(x => x.repo);
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    if (sourceRepos.length === 0) problems.push(`no repo has any '${CONTRACT.CALLABLE_CALL_KIND}' facts`);
    const withName = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 IS NOT NULL`,
      [sourceRepos, CONTRACT.CALLABLE_CALL_KIND, CONTRACT.CALLABLE_CALL_FUNCTION_NAME]
    );
    if (sourceRepos.length > 0 && withName === 0) problems.push(`no '${CONTRACT.CALLABLE_CALL_KIND}' fact has evidence.${CONTRACT.CALLABLE_CALL_FUNCTION_NAME} (extractor field renamed?)`);
    const targets = await countFacts(
      db,
      `kind = $1 AND payload->>$2 = $3 AND payload->'evidence'->>$4 IS NOT NULL`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_TYPE_FIELD, CONTRACT.API_CONTRACT_TYPE_CALLABLE, CONTRACT.API_CONTRACT_CALLABLE_EXPORT_NAME]
    );
    if (targets === 0) problems.push(`no '${CONTRACT.API_CONTRACT_KIND}' callable fact has evidence.${CONTRACT.API_CONTRACT_CALLABLE_EXPORT_NAME} (extractor field renamed?)`);
    return problems;
  },

  async compute(db, sourceRepos) {
    const fbRows = await db.query<{ fact_id: string; repo: string; module: string; handler_name: string; file: string; line: number }>(
      `SELECT fact_id, repo, module, payload->'evidence'->>$3 as handler_name, file, line
       FROM facts WHERE kind = $1 AND payload->>$2 = $4`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_TYPE_FIELD, CONTRACT.API_CONTRACT_CALLABLE_EXPORT_NAME, CONTRACT.API_CONTRACT_TYPE_CALLABLE]
    );

    // Compound key, built defensively: fails loud immediately if two
    // callable facts ever share the same (module, handlerName) -- would
    // mean either a real duplicate api_contract or a bug in this query,
    // either way worth stopping for, not silently overwriting like the
    // old script's bare-name map would.
    const firebaseByCompoundKey = new Map<string, { factId: string; repo: string; module: string; handlerName: string; file: string; line: number }>();
    for (const row of fbRows.rows) {
      if (!row.handler_name) continue;
      const key = `${row.module}::${row.handler_name}`;
      if (firebaseByCompoundKey.has(key)) {
        throw new Error(`[Fail-Closed] Duplicate Firebase api_contract for compound key '${key}' -- real ambiguity, not expected. Investigate before proceeding.`);
      }
      firebaseByCompoundKey.set(key, { factId: row.fact_id, repo: row.repo, module: row.module, handlerName: row.handler_name, file: row.file, line: row.line });
    }
    console.log(`  Loaded ${firebaseByCompoundKey.size} real callable handlers (compound-keyed by module::handlerName).`);

    // Index used only to explain a miss from the data (never to resolve one):
    // which modules a handler name exists under, and which modules exist.
    const modulesByHandler = new Map<string, { module: string; file: string; line: number }[]>();
    const knownModules = new Set<string>();
    for (const t of firebaseByCompoundKey.values()) {
      knownModules.add(t.module);
      const list = modulesByHandler.get(t.handlerName) ?? [];
      list.push({ module: t.module, file: t.file, line: t.line });
      modulesByHandler.set(t.handlerName, list);
    }
    const explainMiss = (modulePrefix: string, handlerSuffix: string): string => {
      const elsewhere = modulesByHandler.get(handlerSuffix) ?? [];
      if (elsewhere.length === 0) {
        return `No callable named '${handlerSuffix}' exists in any module (searched ${firebaseByCompoundKey.size} callables across ${knownModules.size} modules); the client asked for module '${modulePrefix}'.`;
      }
      const where = elsewhere.map(c => `'${c.module}' (${c.file}:${c.line})`).join(", ");
      if (!knownModules.has(modulePrefix)) {
        return `Callable '${handlerSuffix}' exists under module ${where}, but the client prefix '${modulePrefix}' matches no module (${knownModules.size} modules have callables). Left unresolved: no rule derived from the facts maps that prefix to a module.`;
      }
      return `Module '${modulePrefix}' has no callable '${handlerSuffix}'; the name exists only under module ${where}. Left unresolved: a different module is not the one the client named.`;
    };

    const callRows = await db.query<{ fact_id: string; repo: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, repo, file, line, payload FROM facts WHERE repo = ANY($1::text[]) AND kind = $2`,
      [sourceRepos, CONTRACT.CALLABLE_CALL_KIND]
    );

    const edges: EdgeRow[] = [];
    let noFunctionName = 0;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    for (const row of callRows.rows) {
      const functionName: string | undefined = row.payload.evidence?.[CONTRACT.CALLABLE_CALL_FUNCTION_NAME];
      if (!functionName) { noFunctionName++; continue; }
      const requestTypeText = row.payload.evidence?.[CONTRACT.CALLABLE_CALL_REQUEST_TYPE] ?? null;
      const responseTypeText = row.payload.evidence?.[CONTRACT.CALLABLE_CALL_RESPONSE_TYPE] ?? null;
      const sourceSymbol = `${row.file}:${row.line} -> ${functionName}`;
      const base = { sourceRepo: row.repo, sourceSymbol, sourceFactId: row.fact_id, confirmedVia: null };

      const dashIdx = functionName.indexOf("-");
      if (dashIdx < 0) {
        // Real, not-yet-encountered shape (0 of 102 real facts checked this
        // session lack a module prefix) -- treated as unresolved, not
        // guessed, if it ever occurs.
        unresolvedCount++;
        edges.push({ ...base, targetRepo: UNKNOWN_REPO, targetSymbol: functionName, targetFactId: null, resolutionStatus: "unresolved", details: `functionName has no module prefix ('${functionName}') -- cannot form a compound key.` });
        continue;
      }
      const modulePrefix = functionName.slice(0, dashIdx);
      const handlerSuffix = functionName.slice(dashIdx + 1);
      const match = firebaseByCompoundKey.get(`${modulePrefix}::${handlerSuffix}`);
      if (match) {
        resolvedCount++;
        edges.push({
          ...base,
          targetRepo: match.repo,
          targetSymbol: `${match.module}::${match.handlerName}`,
          targetFactId: match.factId,
          resolutionStatus: "resolved",
          details: `req: ${requestTypeText ?? "undefined"}, res: ${responseTypeText ?? "undefined"} -- handler at ${match.file}:${match.line}`,
        });
      } else {
        unresolvedCount++;
        edges.push({
          ...base,
          targetRepo: UNKNOWN_REPO,
          targetSymbol: `${modulePrefix}::${handlerSuffix}`,
          targetFactId: null,
          resolutionStatus: "unresolved",
          details: explainMiss(modulePrefix, handlerSuffix),
        });
      }
    }
    console.log(`  Loaded ${callRows.rows.length - noFunctionName} real callable-call sites from ${sourceRepos.length} repo(s) (${noFunctionName} skipped -- no resolvable functionName).`);
    console.log(`  Join result: ${resolvedCount} resolved, ${unresolvedCount} unresolved (real, honest outcome -- not every call site needs to resolve).`);
    return edges;
  },
};

// ---------------------------------------------------------------------------
// Join 2: Pub/Sub publish call sites -> the subscriber that receives them
// (PUBSUB_TOPIC_BINDING). The topic -> subscription -> push-endpoint binding is
// NOT in application source, it is GCP configuration, so it comes from a
// committed snapshot of `gcloud pubsub subscriptions list` (PUBSUB_SNAPSHOT_FILE,
// staging only, carries its own `extractedAt`). An edge is `resolved` only when a
// FACT exists on both ends: a `pubsub_publish_call` fact naming the topic, and
// a subscriber fact the subscription's push endpoint reaches (a node-iot route,
// or a Firebase push-receiver handler). Every other binding is recorded
// `unresolved` with the reason worked out from the data, never dropped:
//   - publish sites whose topic is not statically resolvable (unchanged);
//   - publish sites whose topic has no binding in the snapshot;
//   - bindings with no publisher fact (recorded under source_repo 'unknown', with
//     the target fact filled in when the endpoint really matches one);
//   - bindings whose endpoint matches no fact, scheduled triggers, pull queues.
// CONFIRMED_PUBSUB_BINDINGS (task 3's hand-typed list) is no longer the source of
// any edge; it is kept ONLY as a warn-only cross-check that this join reproduces it.
// Real bug caught before this counted as done: a first version of the publish
// query was hardcoded to one repo, following the (wrong) assumption that only
// node-iot publishes. Firebase publishes too -- 14 of its own
// `pubsub_publish_call` facts, all genuinely unresolved (dynamic topic names like
// `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`). Any repo with a real
// publish call site belongs in this join.
// ---------------------------------------------------------------------------
interface PubsubBinding {
  topic: string;
  subscription: string;
  deliveryType: string;
  pushEndpointPath?: string;
  deadLetterTopic?: string;
}
interface PubsubSnapshot {
  project: string;
  extractedAt: string;
  extractedVia: string;
  topics: string[];
  bindings: PubsubBinding[];
}

// Reads and validates the bindings snapshot. Throws with a readable message when the
// file is missing or malformed (preflight turns that into a loud, no-change stop).
function loadSnapshot(): PubsubSnapshot {
  const j = JSON.parse(fs.readFileSync(PUBSUB_SNAPSHOT_FILE, "utf8"));
  const need = (ok: boolean, what: string) => { if (!ok) throw new Error(`snapshot ${PUBSUB_SNAPSHOT_REL}: ${what}`); };
  need(typeof j.project === "string" && typeof j.extractedAt === "string", "missing project or extractedAt");
  need(Array.isArray(j.bindings) && j.bindings.length > 0, "no bindings");
  for (const b of j.bindings) {
    need(typeof b.topic === "string" && typeof b.subscription === "string" && typeof b.deliveryType === "string", `a binding lacks topic, subscription or deliveryType (${JSON.stringify(b).slice(0, 80)})`);
    need(b.deliveryType !== PUSH_DELIVERY || typeof b.pushEndpointPath === "string", `push binding '${b.subscription}' has no pushEndpointPath`);
  }
  return { project: j.project, extractedAt: j.extractedAt, extractedVia: j.extractedVia ?? "unknown", topics: Array.isArray(j.topics) ? j.topics : [], bindings: j.bindings };
}

const snapshotSource = (s: PubsubSnapshot) => `GCP Pub/Sub subscriptions snapshot ${PUBSUB_SNAPSHOT_REL} (project ${s.project}, extractedAt ${s.extractedAt}, via ${s.extractedVia}); staging only`;
const snapshotNote = (s: PubsubSnapshot) => `Snapshot: project ${s.project}, extractedAt ${s.extractedAt} (staging only).`;

const pubsubBindingJoin: Join = {
  name: "pubsub-binding",
  connectionType: "PUBSUB_TOPIC_BINDING",
  provenance: "externally_configured",

  // Repos with a publish call site, plus UNKNOWN_REPO: the source_repo under which
  // bindings that have no publisher fact are recorded.
  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(
      `SELECT DISTINCT repo FROM facts WHERE kind = $1 AND payload->'evidence'->>$2 = $3 ORDER BY repo`,
      [CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH]
    );
    return [...r.rows.map(x => x.repo), UNKNOWN_REPO];
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    const publishRepos = sourceRepos.filter(r => r !== UNKNOWN_REPO);
    if (publishRepos.length === 0) problems.push(`no repo has any '${CONTRACT.EXTERNAL_HOOK_KIND}' fact with evidence.${CONTRACT.EXTERNAL_HOOK_TYPE} = '${CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH}'`);
    const withStatus = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4 AND payload->'evidence'->>$5 IS NOT NULL`,
      [publishRepos, CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH, CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS]
    );
    if (publishRepos.length > 0 && withStatus === 0) problems.push(`no pubsub publish fact has evidence.${CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS} (extractor field renamed?)`);
    const receivers = await countFacts(
      db,
      `kind = $1 AND payload->'evidence'->>$2 = $3`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE]
    );
    if (receivers === 0) problems.push(`no '${CONTRACT.API_CONTRACT_KIND}' fact has evidence.${CONTRACT.API_CONTRACT_PUBSUB_RECEIVER} = '${CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE}' (a binding would silently lose its target)`);
    // Push routes are matched against route facts: same shared guard as the REST join.
    problems.push(...(await routePreflightProblems(db)));
    try { loadSnapshot(); } catch (e) { problems.push(`bindings snapshot unusable: ${(e as Error).message}`); }
    return problems;
  },

  async compute(db, sourceRepos) {
    const snapshot = loadSnapshot();
    const publishRepos = sourceRepos.filter(r => r !== UNKNOWN_REPO);
    const publishCalls = await db.query<{ fact_id: string; repo: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, repo, file, line, payload FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4`,
      [publishRepos, CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH]
    );
    const receivers = await db.query<{ fact_id: string; repo: string; module: string; file: string; line: number; value: string }>(
      `SELECT fact_id, repo, module, file, line, payload->>$3 as value FROM facts
       WHERE kind = $1 AND payload->'evidence'->>$2 = $4`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER, CONTRACT.API_CONTRACT_VALUE, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE]
    );
    const { routes, missing, disagreements } = await loadRoutes(db);
    console.log(`  Loaded ${snapshot.bindings.length} snapshot bindings (${snapshotNote(snapshot)}), ${publishCalls.rows.length} publish call sites, ${receivers.rows.length} push receiver(s), ${routes.length} routes (${missing} skipped: field missing).`);
    warnRouteDisagreements(disagreements);

    // Facts about the publishing side, used to explain a missing publisher from the data.
    const topicOf = (row: { payload: any }): string => row.payload.evidence[CONTRACT.EXTERNAL_HOOK_TOPIC_VALUE];
    const isResolved = (row: { payload: any }) => row.payload.evidence[CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS] === CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS_RESOLVED;
    const perRepo = new Map<string, number>();
    for (const r of publishCalls.rows) perRepo.set(r.repo, (perRepo.get(r.repo) ?? 0) + 1);
    const resolvedTopics = [...new Set(publishCalls.rows.filter(isResolved).map(topicOf))].sort();
    const unresolvedSites = publishCalls.rows.filter(r => !isResolved(r)).length;
    const publisherFacts = `${publishCalls.rows.length} pubsub_publish_call facts (${[...perRepo.entries()].sort().map(([r, n]) => `${r} ${n}`).join(", ")}); the topic is statically resolved for ${resolvedTopics.length} (${resolvedTopics.join(", ") || "none"}), and ${unresolvedSites} publish site(s) have a topic that could not be resolved and may publish to it`;

    // What each binding's push endpoint reaches in the facts.
    type Target =
      | { kind: "route"; route: RouteFact }
      | { kind: "receiver"; receiver: (typeof receivers.rows)[number] }
      | { kind: "none"; reason: string };
    const targets = new Map<PubsubBinding, Target>();
    for (const b of snapshot.bindings) {
      if (b.deliveryType !== PUSH_DELIVERY) {
        const dlqOf = snapshot.bindings.filter(x => x.deadLetterTopic === b.topic).map(x => `'${x.subscription}'`);
        targets.set(b, { kind: "none", reason: `Pull subscription '${b.subscription}' has no push endpoint: its consumer polls it, and no fact in the indexed repos describes a puller${dlqOf.length ? `; topic '${b.topic}' is the dead-letter topic of subscription ${dlqOf.join(", ")}` : ""}.` });
        continue;
      }
      const path = b.pushEndpointPath!;
      const segs = pathSegments(path);
      const routeHits = matchRoutes(routes, PUSH_HTTP_METHOD, segs);
      if (routeHits.length === 1) { targets.set(b, { kind: "route", route: routeHits[0] }); continue; }
      if (routeHits.length > 1) {
        targets.set(b, { kind: "none", reason: `Ambiguous: ${routeHits.length} routes match push path '${path}': ${routeHits.map(r => `'${r.raw}' (${r.repo}/${r.file}:${r.line})`).join("; ")}.` });
        continue;
      }
      // A Cloud Functions HTTP push endpoint is the single path segment "<module>-<handler>".
      const receiver = segs.length === 1 ? receivers.rows.find(r => `${r.module}-${r.value}` === segs[0]) : undefined;
      if (receiver) { targets.set(b, { kind: "receiver", receiver }); continue; }

      const last = segs[segs.length - 1] ?? "";
      if (path.startsWith(APP_ENGINE_PUSH_PREFIX)) {
        const fnId = SCHEDULE_TOPIC.exec(b.topic)?.[1];
        const fnName = fnId ? (fnId.includes("-") ? fnId.slice(fnId.indexOf("-") + 1) : fnId) : undefined;
        const naming = fnName
          ? (await db.query<{ repo: string; kind: string; file: string; line: number; symbol_name: string | null }>(
              `SELECT repo, kind, file, line, symbol_name FROM facts WHERE symbol_name = $1 OR description ILIKE '%' || $1 || '%' ORDER BY repo, file, line LIMIT 5`, [fnName])).rows
          : [];
        targets.set(b, { kind: "none", reason: `Scheduled-function subscription: '${path}' is an App Engine push handler, the delivery Cloud Functions uses for scheduled triggers, so topic '${b.topic}' is published by the platform scheduler and no application pubsub_publish_call fact can exist for it. Facts naming '${fnName ?? "the trigger"}': ${naming.length ? naming.map(c => `${c.kind} ${c.symbol_name ?? ""} (${c.repo}/${c.file}:${c.line})`).join("; ") : "none"}. Left unresolved: no publisher fact.` });
        continue;
      }
      const removed = REMOVED_PUSH_ROUTES.routeNames.includes(last)
        ? ` node-iot commit ${REMOVED_PUSH_ROUTES.commit} (${REMOVED_PUSH_ROUTES.date}, ${REMOVED_PUSH_ROUTES.ticket}) removed this push route on purpose, so this subscription still points at a route that no longer exists (dangling; staging only).`
        : "";
      targets.set(b, { kind: "none", reason: `No route_definition fact with method ${PUSH_HTTP_METHOD} matches push path '${path}' (aligned-suffix match, at least ${MIN_LITERAL_SEGMENTS} literal segments, a parameter matches only a parameter) and no push-receiver fact is named by it.${removed}` });
    }

    const edges: EdgeRow[] = [];
    const covered = new Set<PubsubBinding>();
    const resolvedPairs: { topic: string; handlerValue: string }[] = [];
    let resolvedCount = 0, unresolvedCount = 0;

    // 1. One or more edges per publish call site.
    for (const row of publishCalls.rows) {
      const topicValue = topicOf(row);
      const topicResolutionStatus: string = row.payload.evidence[CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS];
      const base = { sourceRepo: row.repo, sourceSymbol: `${row.file}:${row.line} -> ${topicValue}`, sourceFactId: row.fact_id };

      if (!isResolved(row)) {
        unresolvedCount++;
        edges.push({
          ...base, targetRepo: UNKNOWN_REPO, targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic name not statically resolvable in source (topicResolutionStatus: ${topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
        });
        continue;
      }

      const bindings = snapshot.bindings.filter(b => b.topic === topicValue);
      if (bindings.length === 0) {
        unresolvedCount++;
        edges.push({
          ...base, targetRepo: UNKNOWN_REPO, targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic '${topicValue}' resolved in source, but ${snapshot.topics.includes(topicValue) ? "the snapshot has no subscription for it" : `it is not among the ${snapshot.topics.length} topics in the snapshot`}, so no binding exists to follow. ${snapshotNote(snapshot)}`,
        });
        continue;
      }
      for (const b of bindings) {
        covered.add(b);
        const t = targets.get(b)!;
        if (t.kind === "none") {
          unresolvedCount++;
          edges.push({ ...base, targetRepo: UNKNOWN_REPO, targetSymbol: b.pushEndpointPath ?? `pull ${b.subscription}`, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: snapshotSource(snapshot),
            details: `Subscription '${b.subscription}' binds topic '${topicValue}', but its target does not exist in the facts. ${t.reason} ${snapshotNote(snapshot)}` });
          continue;
        }
        const pair = t.kind === "receiver" ? { repo: t.receiver.repo, factId: t.receiver.fact_id, symbol: t.receiver.value, where: `Receiving handler: ${t.receiver.module}/${t.receiver.file}:${t.receiver.line}` }
                                            : { repo: t.route.repo, factId: t.route.factId, symbol: t.route.raw, where: `Receiving route: ${t.route.raw} at ${t.route.repo}/${t.route.file}:${t.route.line}` };
        const known = t.kind === "receiver" ? CONFIRMED_PUBSUB_BINDINGS.find(c => c.topicName === topicValue && c.firebaseHandlerValue === t.receiver.value) : undefined;
        if (t.kind === "receiver") resolvedPairs.push({ topic: topicValue, handlerValue: t.receiver.value });
        resolvedCount++;
        edges.push({
          ...base, targetRepo: pair.repo, targetSymbol: pair.symbol, targetFactId: pair.factId, resolutionStatus: "resolved", confirmedVia: snapshotSource(snapshot),
          details: `${pair.where}; publish site of topic '${topicValue}' -> subscription '${b.subscription}' (push ${b.pushEndpointPath}). ${snapshotNote(snapshot)}${known ? ` Also independently confirmed 2026-08-29 (CONFIRMED_PUBSUB_BINDINGS): ${known.confirmedVia}` : ""}`,
        });
      }
    }

    // 2. Every binding no publish site reached: recorded, never dropped.
    let records = 0;
    for (const b of snapshot.bindings) {
      if (covered.has(b)) continue;
      const t = targets.get(b)!;
      const sourceSymbol = `pubsub topic ${b.topic} [subscription ${b.subscription}]`;
      records++; unresolvedCount++;
      if (t.kind === "none") {
        edges.push({ sourceRepo: UNKNOWN_REPO, sourceSymbol, sourceFactId: null, targetRepo: UNKNOWN_REPO, targetSymbol: b.pushEndpointPath ?? `pull ${b.subscription}`, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: snapshotSource(snapshot),
          details: `${t.reason} ${snapshotNote(snapshot)}` });
      } else {
        const target = t.kind === "route" ? { repo: t.route.repo, symbol: t.route.raw, factId: t.route.factId, what: `route '${t.route.raw}' at ${t.route.repo}/${t.route.file}:${t.route.line}` }
                                          : { repo: t.receiver.repo, symbol: t.receiver.value, factId: t.receiver.fact_id, what: `push receiver ${t.receiver.module}-${t.receiver.value} at ${t.receiver.repo}/${t.receiver.file}:${t.receiver.line}` };
        edges.push({ sourceRepo: UNKNOWN_REPO, sourceSymbol, sourceFactId: null, targetRepo: target.repo, targetSymbol: target.symbol, targetFactId: target.factId, resolutionStatus: "unresolved", confirmedVia: snapshotSource(snapshot),
          details: `Subscription '${b.subscription}' pushes topic '${b.topic}' to ${target.what}, which exists in the facts, but no pubsub_publish_call fact names topic '${b.topic}', so there is no fact on the publishing end: ${publisherFacts}. ${snapshotNote(snapshot)}` });
      }
    }

    // Warn-only cross-check against task 3's hand-typed list (kept until D1 has reproduced it).
    const agree = CONFIRMED_PUBSUB_BINDINGS.filter(c => resolvedPairs.some(p => p.topic === c.topicName && p.handlerValue === c.firebaseHandlerValue));
    const onlyHandTyped = CONFIRMED_PUBSUB_BINDINGS.filter(c => !agree.includes(c));
    const onlyD1 = resolvedPairs.filter(p => !CONFIRMED_PUBSUB_BINDINGS.some(c => c.topicName === p.topic && c.firebaseHandlerValue === p.handlerValue));
    console.log(`  Cross-check vs CONFIRMED_PUBSUB_BINDINGS (${CONFIRMED_PUBSUB_BINDINGS.length} entr${CONFIRMED_PUBSUB_BINDINGS.length === 1 ? "y" : "ies"}): ${agree.length} reproduced by the snapshot join, ${onlyHandTyped.length} only in the hand-typed list, ${onlyD1.length} resolved receiver edge(s) only in the snapshot join.`);
    for (const c of onlyHandTyped) console.log(`  WARN DISAGREEMENT: hand-typed binding topic '${c.topicName}' -> '${c.firebaseHandlerValue}' is NOT reproduced by the snapshot join.`);
    for (const p of onlyD1) console.log(`  WARN DISAGREEMENT: snapshot join resolved topic '${p.topic}' -> '${p.handlerValue}' which is not in the hand-typed list.`);

    console.log(`  Pub/sub join result: ${resolvedCount} resolved (externally configured), ${unresolvedCount} unresolved, of which ${records} are snapshot bindings with no publisher fact (recorded under source_repo '${UNKNOWN_REPO}').`);
    return edges;
  },
};

// ---------------------------------------------------------------------------
// Join 3: a call site into another indexed package -> the declaration it uses
// in that package (PACKAGE_SYMBOL_USE). Today: the iOS app calling the Swift
// kits. Source repo, target repo and file all come from the call fact's own
// payload (`declarationRepo` / `declarationFile`); nothing is named here. The
// payload carries no declared-symbol name, so it is the leading identifier of
// `calleeExpression`. A target is a declaration-like fact (kind ends in
// `_declaration`) in that exact file with that `symbol_name`. Exactly one
// primary (non-extension) declaration -> `resolved`; anything else is
// `unresolved` with the file and the candidates in `details`, because a
// target-less "resolved" edge would be invisible to traversal.
// ---------------------------------------------------------------------------
const packageSymbolUseJoin: Join = {
  name: "package-symbol-use",
  connectionType: "PACKAGE_SYMBOL_USE",
  provenance: "ast_derived",

  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(
      `SELECT DISTINCT repo FROM facts
       WHERE kind = $1 AND payload->'evidence'->>$2 = $3
         AND payload->'evidence'->>$4 IS NOT NULL AND payload->'evidence'->>$4 <> repo
       ORDER BY repo`,
      [CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_METHOD, CONTRACT.CALL_RESOLVED_VIA_IMPORT, CONTRACT.CALL_DECLARATION_REPO]
    );
    return r.rows.map(x => x.repo);
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    if (sourceRepos.length === 0) problems.push(`no repo has '${CONTRACT.CALL_EXPRESSION_KIND}' facts with evidence.${CONTRACT.CALL_RESOLUTION_METHOD} = '${CONTRACT.CALL_RESOLVED_VIA_IMPORT}' and a foreign evidence.${CONTRACT.CALL_DECLARATION_REPO}`);
    const usable = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4 AND payload->'evidence'->>$5 IS NOT NULL AND payload->'evidence'->>$6 IS NOT NULL AND payload->'evidence'->>$7 IS NOT NULL`,
      [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_METHOD, CONTRACT.CALL_RESOLVED_VIA_IMPORT, CONTRACT.CALL_DECLARATION_REPO, CONTRACT.CALL_DECLARATION_FILE, CONTRACT.CALL_CALLEE_EXPRESSION]
    );
    if (sourceRepos.length > 0 && usable === 0) problems.push(`no such call fact has evidence.${CONTRACT.CALL_DECLARATION_FILE} and evidence.${CONTRACT.CALL_CALLEE_EXPRESSION} (extractor field renamed?)`);
    const declarations = await countFacts(db, `right(kind, char_length($1)) = $1`, [CONTRACT.DECLARATION_KIND_SUFFIX]);
    if (declarations === 0) problems.push(`no fact kind ends in '${CONTRACT.DECLARATION_KIND_SUFFIX}' (extractor renamed its declaration kinds?)`);
    return problems;
  },

  async compute(db, sourceRepos) {
    const calls = await db.query<{ fact_id: string; repo: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, repo, file, line, payload FROM facts
       WHERE repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4
         AND payload->'evidence'->>$5 IS NOT NULL AND payload->'evidence'->>$5 <> repo`,
      [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_METHOD, CONTRACT.CALL_RESOLVED_VIA_IMPORT, CONTRACT.CALL_DECLARATION_REPO]
    );

    // Load only the declaration facts in the files the calls point at.
    const pairs = new Map<string, [string, string]>();
    for (const c of calls.rows) {
      const ev = c.payload.evidence;
      const dRepo: string | undefined = ev?.[CONTRACT.CALL_DECLARATION_REPO];
      const dFile: string | undefined = ev?.[CONTRACT.CALL_DECLARATION_FILE];
      if (dRepo && dFile) pairs.set(`${dRepo}\u0000${dFile}`, [dRepo, dFile]);
    }
    const decls = await db.query<{ fact_id: string; repo: string; module: string; file: string; line: number; kind: string; symbol_name: string | null }>(
      `SELECT fact_id, repo, module, file, line, kind, symbol_name FROM facts
       WHERE right(kind, char_length($3)) = $3 AND symbol_name IS NOT NULL
         AND (repo, file) IN (SELECT * FROM unnest($1::text[], $2::text[]))`,
      [[...pairs.values()].map(p => p[0]), [...pairs.values()].map(p => p[1]), CONTRACT.DECLARATION_KIND_SUFFIX]
    );
    const declsByKey = new Map<string, typeof decls.rows>();
    for (const d of decls.rows) {
      const key = `${d.repo}\u0000${d.file}\u0000${d.symbol_name}`;
      const list = declsByKey.get(key) ?? [];
      list.push(d);
      declsByKey.set(key, list);
    }
    console.log(`  Loaded ${calls.rows.length} cross-package call sites and ${decls.rows.length} declaration facts in the ${pairs.size} target file(s) they point at.`);

    const edges: EdgeRow[] = [];
    const bySourceTarget = new Map<string, number>();
    const inDegree = new Map<string, { name: string; n: number }>();
    let tieBroken = 0, multiCandidate = 0;
    const describe = (ds: { kind: string; line: number }[]) => ds.map(d => `${d.kind}:${d.line}`).join(", ");

    for (const c of calls.rows) {
      const ev = c.payload.evidence;
      const dRepo: string = ev[CONTRACT.CALL_DECLARATION_REPO];
      const dFile: string | undefined = ev[CONTRACT.CALL_DECLARATION_FILE];
      const callee: string | undefined = ev[CONTRACT.CALL_CALLEE_EXPRESSION];
      const ident = callee ? LEADING_IDENTIFIER.exec(callee)?.[1] : undefined;
      bySourceTarget.set(dRepo, (bySourceTarget.get(dRepo) ?? 0) + 1);
      const base = { sourceRepo: c.repo, sourceSymbol: `${c.file}:${c.line} -> ${ident ?? "(no leading identifier)"}`, sourceFactId: c.fact_id, confirmedVia: null };
      const unresolved = (targetSymbol: string, details: string) => edges.push({ ...base, targetRepo: UNKNOWN_REPO, targetSymbol, targetFactId: null, resolutionStatus: "unresolved", details });

      if (!ident || !dFile) {
        unresolved(ident ?? "(none)", `Cannot form a match key: ${!ident ? "calleeExpression has no leading identifier" : "no declarationFile"} (declarationRepo ${dRepo}${dFile ? `, declarationFile ${dFile}` : ""}).`);
        continue;
      }
      const candidates = declsByKey.get(`${dRepo}\u0000${dFile}\u0000${ident}`) ?? [];
      if (candidates.length > 1) multiCandidate++;
      const primaries = candidates.filter(d => d.kind !== CONTRACT.EXTENSION_DECLARATION_KIND);
      if (candidates.length === 0) {
        unresolved(ident, `No declaration fact named '${ident}' in ${dRepo}/${dFile} (declarationFile from the call site's import resolution).`);
      } else if (primaries.length === 0) {
        unresolved(ident, `Only ${CONTRACT.EXTENSION_DECLARATION_KIND} fact(s) named '${ident}' in ${dRepo}/${dFile}, no primary declaration to link. Candidates: ${describe(candidates)}.`);
      } else if (primaries.length > 1) {
        unresolved(ident, `Ambiguous: ${primaries.length} primary declarations named '${ident}' in ${dRepo}/${dFile}. Candidates: ${describe(primaries)}.`);
      } else {
        const t = primaries[0];
        const extensions = candidates.length - 1;
        if (extensions > 0) tieBroken++;
        const hub = inDegree.get(t.fact_id) ?? { name: `${t.repo}/${ident}`, n: 0 };
        hub.n++;
        inDegree.set(t.fact_id, hub);
        edges.push({
          ...base,
          targetRepo: t.repo,
          targetSymbol: `${t.module}::${ident}`,
          targetFactId: t.fact_id,
          resolutionStatus: "resolved",
          details: `${t.kind} '${ident}' at ${t.repo}/${t.file}:${t.line}${extensions > 0 ? `; primary declaration chosen over ${extensions} ${CONTRACT.EXTENSION_DECLARATION_KIND}(s) of the same name in the same file` : ""}${ev[CONTRACT.CALL_DECLARATION_MODULE] ? `; module ${ev[CONTRACT.CALL_DECLARATION_MODULE]}` : ""}`,
        });
      }
    }
    if (edges.some(e => e.resolutionStatus === "resolved" && e.targetFactId === null)) {
      throw new Error(`[Fail-Closed] ${packageSymbolUseJoin.name} produced a resolved edge without a target fact -- invisible to traversal, refusing.`);
    }
    const resolved = edges.filter(e => e.resolutionStatus === "resolved").length;
    const hubs = [...inDegree.values()].sort((a, b) => b.n - a.n);
    console.log(`  Sources by declaration repo: ${[...bySourceTarget.entries()].sort().map(([k, v]) => `${k} ${v}`).join(", ")}`);
    console.log(`  Join result: ${resolved} resolved, ${edges.length - resolved} unresolved of ${edges.length}. Resolved edges land on ${inDegree.size} distinct declarations; max in-degree ${hubs[0]?.n ?? 0} (${hubs[0]?.name ?? "n/a"}); top 5: ${hubs.slice(0, 5).map(h => `${h.name.split("/").pop()} ${h.n}`).join(", ")}.`);
    console.log(`  Sources whose (file, name) matched more than one declaration fact: ${multiCandidate}; settled by preferring the non-extension: ${tieBroken}.`);
    return edges;
  },
};

// ---------------------------------------------------------------------------
// Join 4: a client REST call (`rest_endpoint_call`) -> the server route it hits
// (`route_definition`), HTTP_API_CALL. Today: the Android intercom calling
// node-iot. Match on the HTTP path as segments: a route matches when its
// segments are a segment-aligned SUFFIX of the call's path (so a gateway/mount
// prefix like `/v1/iot` needs no prefix list), the verbs are equal, and at
// least MIN_LITERAL_SEGMENTS of its segments are literal. A path parameter
// (`{x}` or `:x`) matches only another parameter at the same position, never a
// literal such as `pubsub`. Exactly one candidate -> `resolved`; none, or more
// than one, -> `unresolved` with the reason and candidates in `details`.
// Provenance is `externally_configured` (see APIGEE_CONFIRMATION).
// ---------------------------------------------------------------------------
// A path segment: the literal text, or null for a path parameter.
type Seg = string | null;

function pathSegments(path: string): Seg[] {
  return path
    .split("?")[0]
    .split("/")
    .filter(s => s.length > 0)
    .map(s => (s.startsWith(":") || (s.startsWith("{") && s.endsWith("}")) ? null : s));
}

// True when `route` equals the LAST route.length segments of `call`, position by
// position: literal == same literal, parameter == parameter, never mixed.
function isAlignedSuffix(route: Seg[], call: Seg[]): boolean {
  if (route.length === 0 || route.length > call.length) return false;
  const offset = call.length - route.length;
  return route.every((seg, i) => seg === call[offset + i]);
}

// One server route, read from a `route_definition` fact's structured fields.
interface RouteFact {
  factId: string;
  repo: string;
  module: string;
  file: string;
  line: number;
  method: string; // upper-case verb
  httpPath: string;
  raw: string; // "METHOD /path", built from the structured fields
  segs: Seg[];
}

// THE one place routes are read (shared by every join that matches a path to a
// server route). Reads `evidence.method` / `evidence.httpPath`. `missing` counts
// route facts lacking either field (preflights fail on any); `disagreements`
// lists route facts whose packed `payload.value` differs from "METHOD /path"
// rebuilt from the structured fields. That cross-check is warn-only, never fatal.
async function loadRoutes(db: Pool): Promise<{ routes: RouteFact[]; missing: number; disagreements: string[] }> {
  const rows = await db.query<{ fact_id: string; repo: string; module: string; file: string; line: number; method: string | null; http_path: string | null; packed: string | null }>(
    `SELECT fact_id, repo, module, file, line, payload->'evidence'->>$2 AS method, payload->'evidence'->>$3 AS http_path, payload->>$4 AS packed
     FROM facts WHERE kind = $1 ORDER BY repo, file, line`,
    [CONTRACT.ROUTE_KIND, CONTRACT.ROUTE_METHOD, CONTRACT.ROUTE_HTTP_PATH, CONTRACT.ROUTE_PACKED_VALUE]
  );
  const routes: RouteFact[] = [];
  const disagreements: string[] = [];
  let missing = 0;
  for (const r of rows.rows) {
    if (!r.method || !r.http_path) { missing++; continue; }
    const method = r.method.toUpperCase();
    const raw = `${method} ${r.http_path}`;
    if ((r.packed ?? "").trim().replace(/\s+/g, " ") !== raw) disagreements.push(`${r.repo}/${r.file}:${r.line} structured '${raw}' vs packed value '${r.packed ?? "(absent)"}'`);
    routes.push({ factId: r.fact_id, repo: r.repo, module: r.module, file: r.file, line: r.line, method, httpPath: r.http_path, raw, segs: pathSegments(r.http_path) });
  }
  return { routes, missing, disagreements };
}

// Shared preflight for any join that reads routes: there must be route facts, and
// EVERY route fact must carry both structured fields; one without either means the
// extractor changed and the join must not compute (and so must not replace) anything.
async function routePreflightProblems(db: Pool): Promise<string[]> {
  const problems: string[] = [];
  const total = await countFacts(db, `kind = $1`, [CONTRACT.ROUTE_KIND]);
  if (total === 0) problems.push(`no '${CONTRACT.ROUTE_KIND}' facts exist`);
  const lacking = await countFacts(
    db,
    `kind = $1 AND (payload->'evidence'->>$2 IS NULL OR payload->'evidence'->>$3 IS NULL)`,
    [CONTRACT.ROUTE_KIND, CONTRACT.ROUTE_METHOD, CONTRACT.ROUTE_HTTP_PATH]
  );
  if (lacking > 0) problems.push(`${lacking} of ${total} '${CONTRACT.ROUTE_KIND}' fact(s) lack evidence.${CONTRACT.ROUTE_METHOD} or evidence.${CONTRACT.ROUTE_HTTP_PATH} (extractor field renamed?)`);
  return problems;
}

// Warn-only: the packed `value` disagrees with the structured fields. Never fatal.
function warnRouteDisagreements(disagreements: string[]): void {
  if (disagreements.length === 0) return;
  console.log(`  WARN: ${disagreements.length} route fact(s) whose packed payload.${CONTRACT.ROUTE_PACKED_VALUE} disagrees with the structured fields (structured fields are used); first ${Math.min(5, disagreements.length)}:`);
  for (const d of disagreements.slice(0, 5)) console.log(`    - ${d}`);
}

// Routes a path can hit: same verb, route segments are an aligned suffix of the
// path, and at least MIN_LITERAL_SEGMENTS of them are literal (a parameter matches
// only a parameter, never a literal).
function matchRoutes(routes: RouteFact[], method: string, pathSegs: Seg[]): RouteFact[] {
  return routes.filter(r =>
    r.method === method.toUpperCase() &&
    isAlignedSuffix(r.segs, pathSegs) &&
    r.segs.filter(s => s !== null).length >= MIN_LITERAL_SEGMENTS
  );
}

const restRouteJoin: Join = {
  name: "rest-route",
  connectionType: "HTTP_API_CALL",
  provenance: "externally_configured",

  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(`SELECT DISTINCT repo FROM facts WHERE kind = $1 ORDER BY repo`, [CONTRACT.REST_CALL_KIND]);
    return r.rows.map(x => x.repo);
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    if (sourceRepos.length === 0) problems.push(`no repo has any '${CONTRACT.REST_CALL_KIND}' facts`);
    const usable = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 IS NOT NULL AND payload->'evidence'->>$4 IS NOT NULL`,
      [sourceRepos, CONTRACT.REST_CALL_KIND, CONTRACT.REST_CALL_HTTP_METHOD, CONTRACT.REST_CALL_PATH]
    );
    if (sourceRepos.length > 0 && usable === 0) problems.push(`no '${CONTRACT.REST_CALL_KIND}' fact has evidence.${CONTRACT.REST_CALL_HTTP_METHOD} and evidence.${CONTRACT.REST_CALL_PATH} (extractor field renamed?)`);
    problems.push(...(await routePreflightProblems(db)));
    return problems;
  },

  async compute(db, sourceRepos) {
    const { routes, missing, disagreements } = await loadRoutes(db);
    console.log(`  Loaded ${routes.length} routes from evidence.${CONTRACT.ROUTE_METHOD}/evidence.${CONTRACT.ROUTE_HTTP_PATH} (${missing} skipped: field missing).`);
    warnRouteDisagreements(disagreements);

    const calls = await db.query<{ fact_id: string; repo: string; file: string; line: number; method: string | null; path: string | null }>(
      `SELECT fact_id, repo, file, line, payload->'evidence'->>$3 AS method, payload->'evidence'->>$4 AS path FROM facts WHERE repo = ANY($1::text[]) AND kind = $2`,
      [sourceRepos, CONTRACT.REST_CALL_KIND, CONTRACT.REST_CALL_HTTP_METHOD, CONTRACT.REST_CALL_PATH]
    );

    const edges: EdgeRow[] = [];
    let resolved = 0;
    for (const c of calls.rows) {
      const method = (c.method ?? "").toUpperCase();
      const label = `${method} ${c.path ?? "(no path)"}`;
      const base = { sourceRepo: c.repo, sourceSymbol: `${c.file}:${c.line} -> ${label}`, sourceFactId: c.fact_id, confirmedVia: APIGEE_CONFIRMATION };
      const unresolved = (reason: string) => edges.push({ ...base, targetRepo: UNKNOWN_REPO, targetSymbol: label, targetFactId: null, resolutionStatus: "unresolved", details: `${reason} Note: ${APIGEE_CONFIRMATION}.` });

      if (!method || !c.path) { unresolved(`Cannot match: ${!method ? "no httpMethod" : "no path"} on the call fact.`); continue; }
      const callSegs = pathSegments(c.path);
      const candidates = matchRoutes(routes, method, callSegs);
      if (candidates.length === 0) {
        unresolved(`No route_definition with method ${method} matches '${c.path}' as a segment-aligned suffix (with at least ${MIN_LITERAL_SEGMENTS} literal segments; a path parameter matches only another parameter).`);
      } else if (candidates.length > 1) {
        unresolved(`Ambiguous: ${candidates.length} routes match '${label}' as a segment-aligned suffix: ${candidates.map(r => `'${r.raw}' (${r.repo}/${r.file}:${r.line})`).join("; ")}.`);
      } else {
        const t = candidates[0];
        resolved++;
        // The unmatched leading part of the call path, derived from the data (not a prefix list).
        const strippedSegs = c.path.split("?")[0].split("/").filter(s => s.length > 0).slice(0, callSegs.length - t.segs.length);
        edges.push({
          ...base,
          targetRepo: t.repo,
          targetSymbol: t.raw,
          targetFactId: t.factId,
          resolutionStatus: "resolved",
          details: `${label} matches route '${t.raw}' at ${t.repo}/${t.file}:${t.line} by segment-aligned suffix (parameters matched by position; call-path prefix '${strippedSegs.length ? "/" + strippedSegs.join("/") : ""}' is not part of the route). ${APIGEE_CONFIRMATION}.`,
        });
      }
    }
    console.log(`  Join result: ${resolved} resolved, ${edges.length - resolved} unresolved of ${edges.length} call site(s).`);
    return edges;
  },
};

// ---------------------------------------------------------------------------
// Join 5: a Firestore write -> the document trigger it fires (FIRESTORE_EVENT_TRIGGER).
// Same-repo. The trigger's document path comes from its sibling `firestore_path_touched`
// fact (same file, line and runId); its event from its callee expression; its handler is
// the declaration fact at (handlerDeclarationFile, handlerName, handlerStartLine). The
// writer is a call to a base-controller write wrapper (FIRESTORE_WRITE_WRAPPERS) whose
// first argument, a collection path written as a template or string literal, is read from
// the call fact's own recorded `arguments` (nothing is parsed from source). A write
// matches a trigger when its collection path (`${...}` a wildcard) equals the trigger's
// document path minus its last segment, segment for segment: a trigger wildcard matches any
// writer segment, a writer wildcard never matches a trigger literal. The edge runs from the
// enclosing writer METHOD fact to the handler fact, one per (method, handler), always
// `resolved`: it states "a write to this collection path is configured to run this
// handler", a fact about code and config, not about runtime outcome, so there is no
// `probable`. It does NOT model what the handler later does (publishing, a device
// collecting a document); those are separate edges.
// ---------------------------------------------------------------------------
// Segments of a collection path written as a template literal or a string literal; null for
// anything else (an identifier, a property, a call), which cannot be read from the facts.
function staticPathSegments(text: string | undefined | null): Seg[] | null {
  if (!text) return null;
  const t = text.trim();
  let body: string;
  if (t.length >= 2 && t.startsWith("`") && t.endsWith("`")) body = t.slice(1, -1).replace(/\$\{[^}]*\}/g, "\u0000");
  else if (t.length >= 2 && (t[0] === "'" || t[0] === '"') && t.endsWith(t[0])) body = t.slice(1, -1);
  else return null;
  return body.split("/").filter(s => s.length > 0).map(s => (s.includes("\u0000") || (s.startsWith("{") && s.endsWith("}")) ? null : s));
}

// Same length; a trigger wildcard matches any writer segment; a writer wildcard never
// matches a trigger literal (it cannot be shown to be that collection).
function collectionMatches(writer: Seg[], trigger: Seg[]): boolean {
  return writer.length === trigger.length && writer.every((w, i) => trigger[i] === null || (w !== null && w === trigger[i]));
}

const firestoreTriggerJoin: Join = {
  name: "firestore-trigger",
  connectionType: "FIRESTORE_EVENT_TRIGGER",
  provenance: "ast_derived",

  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(`SELECT DISTINCT repo FROM facts WHERE kind = $1 ORDER BY repo`, [CONTRACT.TRIGGER_KIND]);
    return r.rows.map(x => x.repo);
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    if (sourceRepos.length === 0) problems.push(`no repo has any '${CONTRACT.TRIGGER_KIND}' facts`);
    const usableTriggers = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 IS NOT NULL AND payload->'evidence'->>$4 IS NOT NULL AND payload->'evidence'->>$5 IS NOT NULL`,
      [sourceRepos, CONTRACT.TRIGGER_KIND, CONTRACT.TRIGGER_CALLEE, CONTRACT.TRIGGER_HANDLER_NAME, CONTRACT.TRIGGER_HANDLER_FILE]
    );
    if (sourceRepos.length > 0 && usableTriggers === 0) problems.push(`no '${CONTRACT.TRIGGER_KIND}' fact has evidence.${CONTRACT.TRIGGER_CALLEE}, ${CONTRACT.TRIGGER_HANDLER_NAME} and ${CONTRACT.TRIGGER_HANDLER_FILE} (extractor field renamed?)`);
    const paths = await countFacts(db, `repo = ANY($1::text[]) AND kind = $2 AND payload->>$3 IS NOT NULL`, [sourceRepos, CONTRACT.PATH_KIND, CONTRACT.PATH_VALUE]);
    if (sourceRepos.length > 0 && paths === 0) problems.push(`no '${CONTRACT.PATH_KIND}' fact has a payload.${CONTRACT.PATH_VALUE}`);
    const writers = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = ANY($4::text[]) AND jsonb_typeof(payload->'evidence'->$5) = 'array'`,
      [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_DECLARATION_METHOD, Object.keys(FIRESTORE_WRITE_WRAPPERS), CONTRACT.CALL_ARGUMENTS]
    );
    if (sourceRepos.length > 0 && writers === 0) problems.push(`no '${CONTRACT.CALL_EXPRESSION_KIND}' fact resolves to a Firestore write wrapper (${Object.keys(FIRESTORE_WRITE_WRAPPERS).join(", ")}) with evidence.${CONTRACT.CALL_ARGUMENTS} (extractor field renamed, or the base controllers changed?)`);
    return problems;
  },

  async compute(db, sourceRepos) {
    const ev = (field: string) => `payload->'evidence'->>'${field}'`; // field names are CONTRACT constants, never user input
    const triggers = await db.query<{ fact_id: string; repo: string; file: string; line: number; run_id: string | null; callee: string | null; handler_expr: string | null; handler_name: string | null; handler_file: string | null; handler_line: string | null; handler_res: string | null }>(
      `SELECT fact_id, repo, file, line, payload->>'${CONTRACT.FACT_RUN_ID}' AS run_id, ${ev(CONTRACT.TRIGGER_CALLEE)} AS callee, ${ev(CONTRACT.TRIGGER_HANDLER_EXPRESSION)} AS handler_expr,
              ${ev(CONTRACT.TRIGGER_HANDLER_NAME)} AS handler_name, ${ev(CONTRACT.TRIGGER_HANDLER_FILE)} AS handler_file, ${ev(CONTRACT.TRIGGER_HANDLER_START_LINE)} AS handler_line, ${ev(CONTRACT.TRIGGER_HANDLER_RESOLUTION)} AS handler_res
       FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 ORDER BY repo, file, line`,
      [sourceRepos, CONTRACT.TRIGGER_KIND]
    );
    const pathRows = await db.query<{ repo: string; file: string; line: number; run_id: string | null; value: string }>(
      `SELECT repo, file, line, payload->>'${CONTRACT.FACT_RUN_ID}' AS run_id, payload->>'${CONTRACT.PATH_VALUE}' AS value FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND payload->>'${CONTRACT.PATH_VALUE}' IS NOT NULL`,
      [sourceRepos, CONTRACT.PATH_KIND]
    );
    const siblingKey = (repo: string, file: string, line: number, run: string | null) => `${repo}\u0000${file}\u0000${line}\u0000${run}`;
    const pathsAt = new Map<string, string[]>();
    for (const p of pathRows.rows) { const k = siblingKey(p.repo, p.file, p.line, p.run_id); pathsAt.set(k, [...(pathsAt.get(k) ?? []), p.value]); }

    // Declaration facts looked up by (repo, file, name, start line): trigger handlers and enclosing writer methods.
    const declKey = (repo: string, file: string, name: string, line: number | string) => `${repo}\u0000${file}\u0000${name}\u0000${line}`;
    const lookupDecls = async (want: { repo: string; file: string; name: string; line: number }[]) => {
      const out = new Map<string, { fact_id: string; repo: string; file: string; line: number; kind: string; symbol_name: string }[]>();
      if (want.length === 0) return out;
      const rows = await db.query<{ fact_id: string; repo: string; file: string; line: number; kind: string; symbol_name: string }>(
        `SELECT fact_id, repo, file, line, kind, symbol_name FROM facts
         WHERE kind <> $1 AND (repo, file, symbol_name, line) IN (SELECT * FROM unnest($2::text[], $3::text[], $4::text[], $5::int[]))`,
        [CONTRACT.CALL_EXPRESSION_KIND, want.map(w => w.repo), want.map(w => w.file), want.map(w => w.name), want.map(w => w.line)]
      );
      for (const r of rows.rows) { const k = declKey(r.repo, r.file, r.symbol_name, r.line); out.set(k, [...(out.get(k) ?? []), r]); }
      return out;
    };

    // 1. Triggers: path (sibling fact), event (callee), handler (declaration fact).
    type Trig = { fact_id: string; repo: string; file: string; line: number; event: string; path: string; collection: Seg[]; handler: { fact_id: string; repo: string; file: string; line: number }; handlerExpr: string };
    const trigs: Trig[] = [];
    const notes = { noPath: [] as string[], ambiguousPath: [] as string[], unknownEvent: [] as string[], noHandler: [] as string[] };
    const wantHandlers = triggers.rows.filter(t => t.handler_res === CONTRACT.TRIGGER_HANDLER_RESOLVED && t.handler_name && t.handler_file && t.handler_line && Number.isFinite(Number(t.handler_line)))
      .map(t => ({ repo: t.repo, file: t.handler_file!, name: t.handler_name!, line: Number(t.handler_line) }));
    const handlerFacts = await lookupDecls(wantHandlers);
    for (const t of triggers.rows) {
      const where = `${t.file}:${t.line}`;
      // The callee can span lines (`db\n .document(p)\n .onCreate`), so the pattern must cross newlines.
      const eventName = FIRESTORE_TRIGGER_EVENTS[(t.callee ?? "").replace(/^[\s\S]*\./, "").trim()];
      const paths = pathsAt.get(siblingKey(t.repo, t.file, t.line, t.run_id)) ?? [];
      if (paths.length === 0) { notes.noPath.push(`${where} (${(t.callee ?? "").replace(/\s+/g, " ").slice(0, 60)})`); continue; }
      if (paths.length > 1) { notes.ambiguousPath.push(`${where}: ${paths.join(" | ")}`); continue; }
      if (!eventName) { notes.unknownEvent.push(`${where}: ${(t.callee ?? "").replace(/\s+/g, " ").slice(0, 60)}`); continue; }
      const hf = t.handler_res === CONTRACT.TRIGGER_HANDLER_RESOLVED && t.handler_name && t.handler_file ? (handlerFacts.get(declKey(t.repo, t.handler_file, t.handler_name, Number(t.handler_line))) ?? []) : [];
      if (hf.length !== 1) { notes.noHandler.push(`${where}: ${t.handler_expr ?? t.handler_name} (${hf.length} declaration facts)`); continue; }
      const segs = pathSegments(paths[0]);
      trigs.push({ fact_id: t.fact_id, repo: t.repo, file: t.file, line: t.line, event: eventName, path: paths[0], collection: segs.slice(0, -1), handler: hf[0], handlerExpr: t.handler_expr ?? t.handler_name! });
    }
    console.log(`  Triggers: ${triggers.rows.length} facts -> ${trigs.length} usable (path from sibling fact, event, handler fact). Skipped: ${notes.noPath.length} with no sibling path fact${notes.noPath.length ? ` [${notes.noPath.join("; ")}]` : ""}, ${notes.ambiguousPath.length} ambiguous path, ${notes.unknownEvent.length} unknown event, ${notes.noHandler.length} handler fact not found${notes.noHandler.length ? ` [${notes.noHandler.join("; ")}]` : ""}.`);
    for (const a of notes.ambiguousPath) console.log(`  AMBIGUOUS trigger path (skipped): ${a}`);

    // 2. Writers: calls resolved to a write wrapper, with their enclosing method fact.
    const writers = await db.query<{ fact_id: string; repo: string; file: string; line: number; wrapper: string; arg0: string | null; caller_name: string | null; caller_class: string | null; caller_line: string | null }>(
      `SELECT fact_id, repo, file, line, ${ev(CONTRACT.CALL_DECLARATION_METHOD)} AS wrapper, payload->'evidence'->'${CONTRACT.CALL_ARGUMENTS}'->>0 AS arg0,
              ${ev(CONTRACT.CALL_CALLER_NAME)} AS caller_name, ${ev(CONTRACT.CALL_CALLER_CLASS)} AS caller_class, ${ev(CONTRACT.CALL_CALLER_START_LINE)} AS caller_line
       FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND ${ev(CONTRACT.CALL_RESOLUTION_STATUS)} = $3 AND ${ev(CONTRACT.CALL_DECLARATION_METHOD)} = ANY($4::text[]) ORDER BY repo, file, line`,
      [sourceRepos, CONTRACT.CALL_EXPRESSION_KIND, CONTRACT.CALL_RESOLUTION_OK, Object.keys(FIRESTORE_WRITE_WRAPPERS)]
    );
    const derivable = writers.rows.filter(w => staticPathSegments(w.arg0) !== null);
    const enclosing = await lookupDecls(derivable.filter(w => w.caller_name && w.caller_line && Number.isFinite(Number(w.caller_line))).map(w => ({ repo: w.repo, file: w.file, name: w.caller_name!, line: Number(w.caller_line) })));

    // 3. Match, one edge per (writer method, handler).
    type Group = { method: { fact_id: string; repo: string; file: string; line: number; symbol_name: string }; cls: string | null; trig: Trig; sites: string[]; wrappers: Set<string> };
    const groups = new Map<string, Group>();
    let unattributed = 0, matchedSites = 0;
    const reached = new Set<string>();
    for (const w of derivable) {
      const wsegs = staticPathSegments(w.arg0)!;
      const fires = FIRESTORE_WRITE_WRAPPERS[w.wrapper];
      const hits = trigs.filter(t => t.repo === w.repo && fires.includes(t.event) && collectionMatches(wsegs, t.collection));
      if (hits.length === 0) continue;
      const m = enclosing.get(declKey(w.repo, w.file, w.caller_name ?? "", w.caller_line ?? ""));
      if (!m || m.length !== 1) { unattributed++; continue; }
      matchedSites++;
      for (const t of hits) {
        reached.add(t.fact_id);
        const key = `${m[0].fact_id}\u0000${t.handler.fact_id}`;
        const g = groups.get(key) ?? { method: m[0], cls: w.caller_class, trig: t, sites: [], wrappers: new Set<string>() };
        g.sites.push(`${w.wrapper}(${w.arg0}) at ${w.file}:${w.line}`);
        g.wrappers.add(w.wrapper);
        groups.set(key, g);
      }
    }

    const edges: EdgeRow[] = [];
    for (const g of groups.values()) {
      const eventText = g.wrappers.has("_set") && ["create", "update"].includes(g.trig.event) ? SET_EVENT_DETAILS : `fires on document ${g.trig.event}`;
      edges.push({
        sourceRepo: g.method.repo,
        sourceSymbol: `${g.method.file}:${g.method.line} ${g.cls ? g.cls + "." : ""}${g.method.symbol_name}`,
        sourceFactId: g.method.fact_id,
        targetRepo: g.trig.handler.repo,
        targetSymbol: g.trig.handlerExpr,
        targetFactId: g.trig.handler.fact_id,
        resolutionStatus: "resolved",
        confirmedVia: null,
        details: `${eventText}. Write: ${g.sites.slice(0, 3).join("; ")}${g.sites.length > 3 ? `; +${g.sites.length - 3} more` : ""}. Trigger on ${g.trig.event} of '${g.trig.path}' registered at ${g.trig.file}:${g.trig.line} runs ${g.trig.handlerExpr}.`,
      });
    }
    const unreached = trigs.filter(t => !reached.has(t.fact_id));
    console.log(`  Writers: ${writers.rows.length} write-wrapper call sites; first argument is a readable path for ${derivable.length}, not readable (identifier/call) for ${writers.rows.length - derivable.length}. ${matchedSites} readable-path sites land on a trigger collection (${unattributed} more had no single enclosing method fact and were skipped).`);
    console.log(`  Join result: ${edges.length} resolved edges (writer method -> handler), reaching ${reached.size} of ${trigs.length} triggers; ${unreached.length} triggers have no readable-path writer${unreached.length ? `: ${unreached.map(t => `${t.event} ${t.path}`).join("; ")}` : ""}.`);
    return edges;
  },
};

const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin, restRouteJoin, firestoreTriggerJoin];

// ---------------------------------------------------------------------------
// Shared scoped replace. Compute first, replace second: the new edge set for a
// join is fully built in memory before anything is touched. Each
// `(connection_type, source_repo)` slice is replaced only if the new slice is
// not smaller than the existing one (unless --accept-shrink), so a silent
// extractor rename cannot wipe good edges. All of a join's slices are replaced
// in ONE transaction, and a shrink refusal aborts the whole join before BEGIN.
// ---------------------------------------------------------------------------
interface ExistingRow { source_symbol: string; source_fact_id: string | null; target_symbol: string; resolution_status: string }

function statusCounts(rows: { resolution_status?: string; resolutionStatus?: string }[]): string {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (r.resolution_status ?? r.resolutionStatus)!;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort().map(([k, v]) => `${v} ${k}`).join(", ") || "none";
}

async function replaceSlices(
  db: Pool,
  join: Join,
  sourceRepos: string[],
  edges: EdgeRow[],
  opts: { dryRun: boolean; acceptShrink: boolean; printEdges: boolean }
): Promise<void> {
  const newBySlice = new Map<string, EdgeRow[]>(sourceRepos.map(r => [r, []]));
  for (const e of edges) {
    const slice = newBySlice.get(e.sourceRepo);
    if (!slice) throw new Error(`[Fail-Closed] ${join.name} produced an edge for source repo '${e.sourceRepo}' which it did not discover as a source -- slice ownership would be wrong.`);
    slice.push(e);
  }

  const shrunk: string[] = [];
  for (const repo of sourceRepos) {
    const existing = (await db.query<ExistingRow>(
      `SELECT source_symbol, source_fact_id, target_symbol, resolution_status FROM cross_repo_edges WHERE connection_type = $1 AND source_repo = $2`,
      [join.connectionType, repo]
    )).rows;
    const fresh = newBySlice.get(repo)!;
    console.log(`  slice ${join.connectionType} / ${repo}: existing ${existing.length} (${statusCounts(existing)}) -> new ${fresh.length} (${statusCounts(fresh)})`);
    // A row's identity for these diffs: its source fact, or its source symbol when it
    // has none (a binding record with no publisher fact). Only used to print WHICH rows go.
    const rowKey = (factId: string | null, symbol: string) => factId ?? `symbol:${symbol}`;
    const existingResolved = existing.filter(r => r.resolution_status === "resolved");
    const freshResolved = fresh.filter(r => r.resolutionStatus === "resolved");
    const freshResolvedKeys = new Set(freshResolved.map(e => rowKey(e.sourceFactId, e.sourceSymbol)));

    if (fresh.length === 0 || fresh.length < existing.length) {
      shrunk.push(repo);
      const freshKeys = new Set(fresh.map(e => rowKey(e.sourceFactId, e.sourceSymbol)));
      const gone = existing.filter(r => !freshKeys.has(rowKey(r.source_fact_id, r.source_symbol)));
      console.log(`  SHRINK in slice ${join.connectionType} / ${repo}: ${existing.length} -> ${fresh.length}. ${gone.length} existing edge(s) have no source fact in the new set; first ${Math.min(10, gone.length)}:`);
      for (const g of gone.slice(0, 10)) console.log(`    - [${g.resolution_status}] ${g.source_symbol} -> ${g.target_symbol}`);
    }

    // A drop in resolved edges is a shrink too, even when the slice size is
    // unchanged: a target-side rename (e.g. a Firebase module) would flip
    // resolved edges to unresolved and otherwise pass silently.
    if (freshResolved.length < existingResolved.length) {
      if (!shrunk.includes(repo)) shrunk.push(repo);
      const flipped = existingResolved.filter(r => !freshResolvedKeys.has(rowKey(r.source_fact_id, r.source_symbol)));
      console.log(`  RESOLVED DROP in slice ${join.connectionType} / ${repo}: ${existingResolved.length} -> ${freshResolved.length} resolved. ${flipped.length} existing resolved edge(s) would no longer be resolved; first ${Math.min(10, flipped.length)}:`);
      for (const f of flipped.slice(0, 10)) console.log(`    - ${f.source_symbol} -> ${f.target_symbol}`);
    }
  }

  if (opts.printEdges) {
    for (const e of edges) console.log(`    ${e.resolutionStatus.padEnd(10)} ${e.sourceRepo} :: ${e.sourceSymbol} => ${e.targetRepo} :: ${e.targetSymbol}${e.targetFactId ? "" : " (no target fact)"} | ${e.details.slice(0, 160)}`);
  }

  if (shrunk.length > 0 && !opts.acceptShrink) {
    throw new Error(`[Fail-Closed] ${join.name}: new edge set is empty, smaller than the existing slice, or has fewer resolved edges for ${shrunk.join(", ")}. Nothing was changed. Re-run with --accept-shrink only if that is understood and intended.`);
  }
  if (opts.dryRun) {
    console.log(`  DRY RUN: would replace ${sourceRepos.length} slice(s) with ${edges.length} edge(s); nothing written.`);
    return;
  }

  const synthesisId = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const repo of sourceRepos) {
      // Scoped to this join's own (connection_type, source_repo) slice -- rows
      // of the same connection_type from other source repos, and every other
      // connection_type (FIELD_BINDING, INTRA_REPO_CALL), are never touched.
      const deleted = await client.query(`DELETE FROM cross_repo_edges WHERE connection_type = $1 AND source_repo = $2 RETURNING edge_id`, [join.connectionType, repo]);
      console.log(`  Removed ${deleted.rowCount} stale ${join.connectionType} edge(s) for ${repo}.`);
    }
    for (const edge of edges) {
      await client.query(
        `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())`,
        [edge.sourceRepo, edge.sourceSymbol, edge.sourceFactId, edge.targetRepo, edge.targetSymbol, edge.targetFactId, join.connectionType, edge.resolutionStatus, join.provenance, edge.confirmedVia, edge.details, synthesisId]
      );
    }
    await client.query("COMMIT");
    console.log(`  Inserted ${edges.length} ${join.connectionType} edge(s), synthesis_id=${synthesisId}.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Orphan slices: existing edges of a connection_type this script owns whose
// source repo no join discovers any more (e.g. a repo stopped emitting the
// source fact kind). Such rows are never rebuilt and never deleted, so without
// this report they'd sit in the table unmentioned. Report-only; part of the
// coverage summary. Considers ALL joins, so --join= cannot hide an orphan.
async function reportOrphanSlices(db: Pool, discovered: Map<string, string[]>): Promise<number> {
  const ownedRepos = new Map<string, Set<string>>();
  for (const j of JOINS) {
    const set = ownedRepos.get(j.connectionType) ?? new Set<string>();
    for (const r of discovered.get(j.name) ?? []) set.add(r);
    ownedRepos.set(j.connectionType, set);
  }
  const rows = await db.query<{ connection_type: string; source_repo: string; resolution_status: string; n: string }>(
    `SELECT connection_type, source_repo, resolution_status, count(*)::text AS n FROM cross_repo_edges WHERE connection_type = ANY($1::text[]) GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`,
    [[...ownedRepos.keys()]]
  );
  const orphans = new Map<string, { n: number; statuses: string[] }>();
  for (const r of rows.rows) {
    if (ownedRepos.get(r.connection_type)!.has(r.source_repo)) continue;
    const key = `${r.connection_type} / ${r.source_repo}`;
    const o = orphans.get(key) ?? { n: 0, statuses: [] };
    o.n += Number(r.n);
    o.statuses.push(`${r.n} ${r.resolution_status}`);
    orphans.set(key, o);
  }
  console.log(`\n=== coverage: orphan slices (existing edges whose source repo no join discovers; neither rebuilt nor deleted by this script)`);
  if (orphans.size === 0) console.log(`  none`);
  for (const [key, o] of orphans) console.log(`  ORPHAN ${key}: ${o.n} edge(s) (${o.statuses.join(", ")}) -- source repo no longer emits the source fact kind, or its join failed preflight`);
  return orphans.size;
}

function parseArgs(argv: string[]): { joins: string[]; dryRun: boolean; acceptShrink: boolean; printEdges: boolean } {
  const out = { joins: [] as string[], dryRun: false, acceptShrink: false, printEdges: false };
  for (const a of argv) {
    if (a.startsWith("--join=")) out.joins.push(...a.slice("--join=".length).split(",").filter(Boolean));
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--accept-shrink") out.acceptShrink = true;
    else if (a === "--print-edges") out.printEdges = true;
    else throw new Error(`Unknown argument '${a}'. Usage: [--join=<name>[,<name>]] [--dry-run] [--print-edges] [--accept-shrink]. Joins: ${JOINS.map(j => j.name).join(", ")}`);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const unknown = args.joins.filter(n => !JOINS.some(j => j.name === n));
  if (unknown.length > 0) throw new Error(`Unknown --join value(s): ${unknown.join(", ")}. Joins: ${JOINS.map(j => j.name).join(", ")}`);
  const selected = args.joins.length > 0 ? JOINS.filter(j => args.joins.includes(j.name)) : JOINS;

  const db = pool();
  let failed = 0;
  try {
    // Slice ownership guard: two joins of the same connection_type must never
    // claim the same source repo, or each would delete the other's rows.
    // Checked across ALL joins (not just the selected ones), so --join= can't
    // hide a collision.
    const discovered = new Map<string, string[]>();
    for (const j of JOINS) discovered.set(j.name, await j.discoverSourceRepos(db));
    for (const a of JOINS) for (const b of JOINS) {
      if (a.name < b.name && a.connectionType === b.connectionType) {
        const overlap = discovered.get(a.name)!.filter(r => discovered.get(b.name)!.includes(r));
        if (overlap.length > 0) throw new Error(`[Fail-Closed] joins '${a.name}' and '${b.name}' both own ${a.connectionType} for source repo(s) ${overlap.join(", ")} -- each would delete the other's rows. Add a discriminator before running.`);
      }
    }

    for (const join of selected) {
      const sourceRepos = discovered.get(join.name)!;
      console.log(`\n=== join ${join.name} (${join.connectionType}${args.dryRun ? ", DRY RUN" : ""}) -- source repos discovered: ${sourceRepos.join(", ") || "none"}`);
      try {
        const problems = await join.preflight(db, sourceRepos);
        if (problems.length > 0) {
          console.log(`  PREFLIGHT FAILED -- nothing changed:`);
          for (const p of problems) console.log(`    - ${p}`);
          failed++;
          continue;
        }
        const edges = await join.compute(db, sourceRepos);
        await replaceSlices(db, join, sourceRepos, edges, args);
      } catch (err) {
        console.error(`  JOIN FAILED -- ${(err as Error).message}`);
        failed++;
      }
    }
    await reportOrphanSlices(db, discovered);
  } finally {
    await db.end();
  }
  if (failed > 0) {
    console.error(`\n${failed} join(s) did not complete; see above.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

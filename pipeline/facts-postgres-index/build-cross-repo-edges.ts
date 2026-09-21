// **version:** 1.3.0
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
} as const;

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
  sourceFactId: string;
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
// Join 2: Pub/Sub publish call sites -> Firebase push-receiver handler
// (PUBSUB_TOPIC_BINDING). Task 3: see CONFIRMED_PUBSUB_BINDINGS's own header
// for why this connection type is a genuine capability boundary of AST-only
// extraction, not a gap to close with cleverer parsing.
// Real bug caught before this counted as done: a first version of the publish
// query was hardcoded to one repo, following the (wrong) assumption that only
// node-iot publishes. Firebase publishes too -- confirmed real, 14 of its own
// `pubsub_publish_call` facts, all genuinely unresolved (dynamic topic names
// like `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`). Any repo with a
// real publish call site belongs in this join.
// ---------------------------------------------------------------------------
const pubsubBindingJoin: Join = {
  name: "pubsub-binding",
  connectionType: "PUBSUB_TOPIC_BINDING",
  provenance: "externally_configured",

  async discoverSourceRepos(db) {
    const r = await db.query<{ repo: string }>(
      `SELECT DISTINCT repo FROM facts WHERE kind = $1 AND payload->'evidence'->>$2 = $3 ORDER BY repo`,
      [CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH]
    );
    return r.rows.map(x => x.repo);
  },

  async preflight(db, sourceRepos) {
    const problems: string[] = [];
    if (sourceRepos.length === 0) problems.push(`no repo has any '${CONTRACT.EXTERNAL_HOOK_KIND}' fact with evidence.${CONTRACT.EXTERNAL_HOOK_TYPE} = '${CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH}'`);
    const withStatus = await countFacts(
      db,
      `repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4 AND payload->'evidence'->>$5 IS NOT NULL`,
      [sourceRepos, CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH, CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS]
    );
    if (sourceRepos.length > 0 && withStatus === 0) problems.push(`no pubsub publish fact has evidence.${CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS} (extractor field renamed?)`);
    const receivers = await countFacts(
      db,
      `kind = $1 AND payload->'evidence'->>$2 = $3`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE]
    );
    if (receivers === 0) problems.push(`no '${CONTRACT.API_CONTRACT_KIND}' fact has evidence.${CONTRACT.API_CONTRACT_PUBSUB_RECEIVER} = '${CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE}' (a confirmed binding would silently lose its target)`);
    return problems;
  },

  async compute(db, sourceRepos) {
    const publishCalls = await db.query<{ fact_id: string; repo: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, repo, file, line, payload FROM facts WHERE repo = ANY($1::text[]) AND kind = $2 AND payload->'evidence'->>$3 = $4`,
      [sourceRepos, CONTRACT.EXTERNAL_HOOK_KIND, CONTRACT.EXTERNAL_HOOK_TYPE, CONTRACT.EXTERNAL_HOOK_PUBSUB_PUBLISH]
    );

    const receivers = await db.query<{ fact_id: string; repo: string; module: string; file: string; line: number; value: string }>(
      `SELECT fact_id, repo, module, file, line, payload->>$3 as value FROM facts
       WHERE kind = $1 AND payload->'evidence'->>$2 = $4`,
      [CONTRACT.API_CONTRACT_KIND, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER, CONTRACT.API_CONTRACT_VALUE, CONTRACT.API_CONTRACT_PUBSUB_RECEIVER_TRUE]
    );
    const receiverByHandlerValue = new Map(receivers.rows.map(r => [r.value, r]));

    const edges: EdgeRow[] = [];
    let resolvedCount = 0, unresolvedCount = 0;

    for (const row of publishCalls.rows) {
      const topicValue: string = row.payload.evidence[CONTRACT.EXTERNAL_HOOK_TOPIC_VALUE];
      const topicResolutionStatus: string = row.payload.evidence[CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS];
      const sourceSymbol = `${row.file}:${row.line} -> ${topicValue}`;
      const base = { sourceRepo: row.repo, sourceSymbol, sourceFactId: row.fact_id };

      if (topicResolutionStatus !== CONTRACT.EXTERNAL_HOOK_TOPIC_STATUS_RESOLVED) {
        unresolvedCount++;
        edges.push({
          ...base, targetRepo: UNKNOWN_REPO, targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic name not statically resolvable in source (topicResolutionStatus: ${topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
        });
        continue;
      }

      const binding = CONFIRMED_PUBSUB_BINDINGS.find(b => b.topicName === topicValue);
      if (!binding) {
        unresolvedCount++;
        edges.push({
          ...base, targetRepo: UNKNOWN_REPO, targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic "${topicValue}" resolved in source, but no external subscription binding is confirmed for it in CONFIRMED_PUBSUB_BINDINGS -- add one only once independently verified (GCP subscription config + code-level evidence), not on a naming guess.`,
        });
        continue;
      }

      const receiver = receiverByHandlerValue.get(binding.firebaseHandlerValue);
      resolvedCount++;
      edges.push({
        ...base,
        targetRepo: receiver ? receiver.repo : UNKNOWN_REPO,
        targetSymbol: binding.firebaseHandlerValue,
        targetFactId: receiver ? receiver.fact_id : null,
        resolutionStatus: "resolved",
        confirmedVia: binding.confirmedVia,
        details: receiver ? `Receiving handler: ${receiver.module}/${receiver.file}:${receiver.line}` : "WARNING: receiving handler not found in current Firebase facts -- binding may be stale.",
      });
    }
    console.log(`  Pub/sub join result: ${resolvedCount} resolved (externally confirmed), ${unresolvedCount} unresolved.`);
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

const JOINS: Join[] = [firebaseCallableJoin, pubsubBindingJoin, packageSymbolUseJoin];

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
    const existingResolved = existing.filter(r => r.resolution_status === "resolved");
    const freshResolvedKeys = new Set(fresh.filter(r => r.resolutionStatus === "resolved").map(e => e.sourceFactId));

    if (fresh.length === 0 || fresh.length < existing.length) {
      shrunk.push(repo);
      const freshKeys = new Set(fresh.map(e => e.sourceFactId));
      const gone = existing.filter(r => r.source_fact_id === null || !freshKeys.has(r.source_fact_id));
      console.log(`  SHRINK in slice ${join.connectionType} / ${repo}: ${existing.length} -> ${fresh.length}. ${gone.length} existing edge(s) have no source fact in the new set; first ${Math.min(10, gone.length)}:`);
      for (const g of gone.slice(0, 10)) console.log(`    - [${g.resolution_status}] ${g.source_symbol} -> ${g.target_symbol}`);
    }

    // A drop in resolved edges is a shrink too, even when the slice size is
    // unchanged: a target-side rename (e.g. a Firebase module) would flip
    // resolved edges to unresolved and otherwise pass silently.
    if (freshResolvedKeys.size < existingResolved.length) {
      if (!shrunk.includes(repo)) shrunk.push(repo);
      const flipped = existingResolved.filter(r => r.source_fact_id === null || !freshResolvedKeys.has(r.source_fact_id));
      console.log(`  RESOLVED DROP in slice ${join.connectionType} / ${repo}: ${existingResolved.length} -> ${freshResolvedKeys.size} resolved. ${flipped.length} existing resolved edge(s) would no longer be resolved; first ${Math.min(10, flipped.length)}:`);
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

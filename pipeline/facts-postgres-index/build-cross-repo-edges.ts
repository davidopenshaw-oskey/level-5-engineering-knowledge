// **version:** 1.0.0
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
import "dotenv/config";
import { Pool } from "pg";

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

interface FirebaseCallable {
  factId: string;
  module: string;
  handlerName: string;
  file: string;
  line: number;
}

interface AngularCallableCall {
  factId: string;
  file: string;
  line: number;
  functionName: string;
  requestTypeText: string | null;
  responseTypeText: string | null;
}

async function main() {
  const db = pool();
  try {
    const fbRows = await db.query<{ fact_id: string; module: string; handler_name: string; file: string; line: number }>(
      `SELECT fact_id, module, payload->'evidence'->>'callableExportName' as handler_name, file, line
       FROM facts WHERE repo = 'firebase-oskey-dev' AND kind = 'api_contract' AND payload->>'contractType' = 'callable'`
    );

    // Compound key, built defensively: fails loud immediately if two
    // Firebase facts ever share the same (module, handlerName) -- would
    // mean either a real duplicate api_contract or a bug in this query,
    // either way worth stopping for, not silently overwriting like the
    // old script's bare-name map would.
    const firebaseByCompoundKey = new Map<string, FirebaseCallable>();
    for (const row of fbRows.rows) {
      if (!row.handler_name) continue;
      const key = `${row.module}::${row.handler_name}`;
      if (firebaseByCompoundKey.has(key)) {
        throw new Error(`[Fail-Closed] Duplicate Firebase api_contract for compound key '${key}' -- real ambiguity, not expected. Investigate before proceeding.`);
      }
      firebaseByCompoundKey.set(key, { factId: row.fact_id, module: row.module, handlerName: row.handler_name, file: row.file, line: row.line });
    }
    console.log(`Loaded ${firebaseByCompoundKey.size} real Firebase callable handlers (compound-keyed by module::handlerName).`);

    const angRows = await db.query<{ fact_id: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, file, line, payload FROM facts WHERE repo = 'angular-app-oskey-io' AND kind = 'firebase_callable_call'`
    );

    const angularCalls: AngularCallableCall[] = [];
    let noFunctionName = 0;
    for (const row of angRows.rows) {
      const functionName: string | undefined = row.payload.evidence?.functionName;
      if (!functionName) { noFunctionName++; continue; }
      angularCalls.push({
        factId: row.fact_id,
        file: row.file,
        line: row.line,
        functionName,
        requestTypeText: row.payload.evidence?.requestTypeText ?? null,
        responseTypeText: row.payload.evidence?.responseTypeText ?? null,
      });
    }
    console.log(`Loaded ${angularCalls.length} real Angular callable-call sites (${noFunctionName} skipped -- no resolvable functionName).`);

    let resolvedCount = 0;
    let unresolvedCount = 0;
    const edges: { sourceSymbol: string; sourceFactId: string; targetRepo: string; targetSymbol: string; targetFactId: string | null; resolutionStatus: "resolved" | "unresolved"; details: string }[] = [];

    for (const call of angularCalls) {
      const dashIdx = call.functionName.indexOf("-");
      if (dashIdx < 0) {
        // Real, not-yet-encountered shape (0 of 102 real facts checked this
        // session lack a module prefix) -- treated as unresolved, not
        // guessed, if it ever occurs.
        unresolvedCount++;
        edges.push({
          sourceSymbol: `${call.file}:${call.line} -> ${call.functionName}`,
          sourceFactId: call.factId,
          targetRepo: "unknown",
          targetSymbol: call.functionName,
          targetFactId: null,
          resolutionStatus: "unresolved",
          details: `functionName has no module prefix ('${call.functionName}') -- cannot form a compound key.`,
        });
        continue;
      }
      const modulePrefix = call.functionName.slice(0, dashIdx);
      const handlerSuffix = call.functionName.slice(dashIdx + 1);
      const match = firebaseByCompoundKey.get(`${modulePrefix}::${handlerSuffix}`);
      if (match) {
        resolvedCount++;
        edges.push({
          sourceSymbol: `${call.file}:${call.line} -> ${call.functionName}`,
          sourceFactId: call.factId,
          targetRepo: "firebase-oskey-dev",
          targetSymbol: `${match.module}::${match.handlerName}`,
          targetFactId: match.factId,
          resolutionStatus: "resolved",
          details: `req: ${call.requestTypeText ?? "undefined"}, res: ${call.responseTypeText ?? "undefined"} -- handler at ${match.file}:${match.line}`,
        });
      } else {
        unresolvedCount++;
        edges.push({
          sourceSymbol: `${call.file}:${call.line} -> ${call.functionName}`,
          sourceFactId: call.factId,
          targetRepo: "unknown",
          targetSymbol: `${modulePrefix}::${handlerSuffix}`,
          targetFactId: null,
          resolutionStatus: "unresolved",
          details: `No Firebase api_contract found for module '${modulePrefix}', handler '${handlerSuffix}' -- real, expected outcome (e.g. a renamed/removed endpoint), not a script failure.`,
        });
      }
    }
    console.log(`Join result: ${resolvedCount} resolved, ${unresolvedCount} unresolved (real, honest outcome -- not every call site needs to resolve).`);

    await db.query("BEGIN");
    // Replaces only the rows this join is responsible for -- ast_derived
    // HTTP_API_CALL edges. PUBSUB_TOPIC_BINDING rows (externally_configured
    // provenance, task 3's job) are untouched.
    const deleted = await db.query(`DELETE FROM cross_repo_edges WHERE connection_type = 'HTTP_API_CALL' RETURNING edge_id`);
    console.log(`Removed ${deleted.rowCount} stale HTTP_API_CALL edge(s) from the old bare-name join.`);

    const synthesisId = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
    for (const edge of edges) {
      await db.query(
        `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'HTTP_API_CALL', $7, 'ast_derived', NULL, $8, $9, now())`,
        ["angular-app-oskey-io", edge.sourceSymbol, edge.sourceFactId, edge.targetRepo, edge.targetSymbol, edge.targetFactId, edge.resolutionStatus, edge.details, synthesisId]
      );
    }
    await db.query("COMMIT");
    console.log(`Inserted ${edges.length} real HTTP_API_CALL edge(s), synthesis_id=${synthesisId}.`);

    // Task 3: PUBSUB_TOPIC_BINDING edges -- externally_configured
    // provenance, never derived by a live-facts join the way HTTP_API_CALL
    // is above (see CONFIRMED_PUBSUB_BINDINGS's own header for why this
    // connection type is a genuine capability boundary of AST-only
    // extraction, not a gap to close with cleverer parsing).
    // Real bug caught before this counted as done: a first version of this
    // query was hardcoded to repo = 'node-iot-api-oskey-io', following the
    // (wrong) assumption that only node-iot publishes. Firebase publishes
    // too -- confirmed real, 14 of its own `pubsub_publish_call` facts,
    // all genuinely unresolved (dynamic topic names like
    // `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`). Not scoped
    // to any one repo now -- any repo with a real publish call site
    // belongs in this join.
    const publishCalls = await db.query<{ fact_id: string; repo: string; file: string; line: number; payload: any }>(
      `SELECT fact_id, repo, file, line, payload FROM facts WHERE kind = 'external_hook' AND payload->'evidence'->>'type' = 'pubsub_publish_call'`
    );

    const firebaseReceivers = await db.query<{ fact_id: string; module: string; file: string; line: number; value: string }>(
      `SELECT fact_id, module, file, line, payload->>'value' as value FROM facts
       WHERE repo = 'firebase-oskey-dev' AND kind = 'api_contract' AND payload->'evidence'->>'pubsubPushReceiver' = 'true'`
    );
    const receiverByHandlerValue = new Map(firebaseReceivers.rows.map(r => [r.value, r]));

    const pubsubEdges: { sourceRepo: string; sourceSymbol: string; sourceFactId: string; targetRepo: string; targetSymbol: string; targetFactId: string | null; resolutionStatus: "resolved" | "unresolved"; confirmedVia: string | null; details: string }[] = [];
    let pubsubResolvedCount = 0, pubsubUnresolvedCount = 0;

    for (const row of publishCalls.rows) {
      const topicValue: string = row.payload.evidence.value;
      const topicResolutionStatus: string = row.payload.evidence.topicResolutionStatus;
      const sourceSymbol = `${row.file}:${row.line} -> ${topicValue}`;

      if (topicResolutionStatus !== "resolved") {
        pubsubUnresolvedCount++;
        pubsubEdges.push({
          sourceRepo: row.repo, sourceSymbol, sourceFactId: row.fact_id, targetRepo: "unknown", targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic name not statically resolvable in source (topicResolutionStatus: ${topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
        });
        continue;
      }

      const binding = CONFIRMED_PUBSUB_BINDINGS.find(b => b.topicName === topicValue);
      if (!binding) {
        pubsubUnresolvedCount++;
        pubsubEdges.push({
          sourceRepo: row.repo, sourceSymbol, sourceFactId: row.fact_id, targetRepo: "unknown", targetSymbol: topicValue, targetFactId: null, resolutionStatus: "unresolved", confirmedVia: null,
          details: `Topic "${topicValue}" resolved in source, but no external subscription binding is confirmed for it in CONFIRMED_PUBSUB_BINDINGS -- add one only once independently verified (GCP subscription config + code-level evidence), not on a naming guess.`,
        });
        continue;
      }

      const receiver = receiverByHandlerValue.get(binding.firebaseHandlerValue);
      pubsubResolvedCount++;
      pubsubEdges.push({
        sourceRepo: row.repo,
        sourceSymbol,
        sourceFactId: row.fact_id,
        targetRepo: receiver ? "firebase-oskey-dev" : "unknown",
        targetSymbol: binding.firebaseHandlerValue,
        targetFactId: receiver ? receiver.fact_id : null,
        resolutionStatus: "resolved",
        confirmedVia: binding.confirmedVia,
        details: receiver ? `Receiving handler: ${receiver.module}/${receiver.file}:${receiver.line}` : "WARNING: receiving handler not found in current Firebase facts -- binding may be stale.",
      });
    }
    console.log(`Pub/sub join result: ${pubsubResolvedCount} resolved (externally confirmed), ${pubsubUnresolvedCount} unresolved.`);

    await db.query("BEGIN");
    const deletedPubsub = await db.query(`DELETE FROM cross_repo_edges WHERE connection_type = 'PUBSUB_TOPIC_BINDING' RETURNING edge_id`);
    console.log(`Removed ${deletedPubsub.rowCount} stale PUBSUB_TOPIC_BINDING edge(s) (recomputed against live facts).`);
    for (const edge of pubsubEdges) {
      await db.query(
        `INSERT INTO cross_repo_edges (source_repo, source_symbol, source_fact_id, target_repo, target_symbol, target_fact_id, connection_type, resolution_status, provenance, confirmed_via, details, synthesis_id, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PUBSUB_TOPIC_BINDING', $7, 'externally_configured', $8, $9, $10, now())`,
        [edge.sourceRepo, edge.sourceSymbol, edge.sourceFactId, edge.targetRepo, edge.targetSymbol, edge.targetFactId, edge.resolutionStatus, edge.confirmedVia, edge.details, synthesisId]
      );
    }
    await db.query("COMMIT");
    console.log(`Inserted ${pubsubEdges.length} real PUBSUB_TOPIC_BINDING edge(s).`);
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

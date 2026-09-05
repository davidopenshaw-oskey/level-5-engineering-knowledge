// **version:** 1.0.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// Generalizes the Python prototype (load-sample.py, now superseded and
// deleted) into a real script: reads a repo/module's real Phase 1 facts
// from disk and syncs them into the P2 Postgres/pgvector index. Does NOT
// call the embedding model -- that's a separate step (task 4), kept
// separate deliberately so a sync can run for free, any time, without
// touching the paid path.
//
// Reuses runContextPath from Phase 1's shared utils (read-only import --
// Phase 1 itself is untouched, per the 2026-09-02 scope agreement in
// governance/roadmap/facts-serving-strategy/09-p2-build-tasklist.md). Does
// NOT import anything from any phase-02-inter-module-synthesis/_shared/ --
// this stays fully independent of the existing LLM-synthesis pipeline.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { runContextPath } from "../firebase-oskey-dev/phase-01-ast-extraction/_shared/run-utils";
import { embedFactDocuments } from "./_shared/embedding-adapter";

const PROJECT_ROOT = process.cwd();
const CHUNK_SIZE = 500; // rows per multi-row INSERT -- balances round-trip count against statement size
// Conservative default, not a confirmed provider limit -- Vertex AI's real
// per-request batch cap for gemini-embedding-2 hasn't been checked against
// live docs the way the token/dimension limits were in embedding-adapter.ts.
// Safe to raise later once that's confirmed; not assumed here.
const EMBEDDING_BATCH_SIZE = 100;

interface Fact {
  id: string;
  type: string;
  repo?: string;
  module?: string;
  submodule?: string | null;
  file?: string;
  line?: number;
  [key: string]: any;
}

// Real bug found 2026-09-02 via a real retrieval-quality test, not code
// review: OSKBuildingUnitInhabitantType (a type_alias fact) and every
// permission_candidate fact came back with a blank symbol_name and a
// useless "(unnamed)" description, because the capability-pack format
// doesn't put a `name` field on these fact types at the top level -- it
// puts a `value` field instead ("OSKBuildingUnitInhabitantType", or a
// real permission string like "v1.org.buildings.create"), and keeps the
// original `name` only nested inside `evidence`. Confirmed by reading the
// actual capability-pack JSON directly, not assumed. `value` and
// `evidence.name` are added as fallbacks so this stops silently degrading
// any fact type shaped this way, not just the two found here.
function symbolNameFor(fact: Fact): string | null {
  if (fact.name) return fact.name;
  if (fact.method) return fact.method;
  if (fact.callerName) return fact.callerName;
  if (fact.handlerName) return fact.handlerName;
  if (fact.propertyName) return fact.parentName ? `${fact.parentName}.${fact.propertyName}` : fact.propertyName;
  if (fact.value) return fact.value;
  if (fact.evidence?.name) return fact.evidence.name;
  return null;
}

export function descriptionFor(fact: Fact, module: string): string {
  const sym = symbolNameFor(fact) ?? "(unnamed)";
  const loc = fact.file ? `${fact.file}:${fact.line}` : "(no location)";
  const sub = fact.submodule ? `/${fact.submodule}` : "";
  // Real fix, 2026-09-02: the P1 fix (01-extract-ast-evidence.ts) now
  // captures a type alias's real union values (e.g. 'owner' | 'tenant' |
  // 'resident'), but they arrive nested under `evidence.unionMembers` (the
  // capability-pack format's own convention for preserving a raw fact's
  // full original shape -- see 02-build-module-evidence.ts). Without this,
  // the richer P1 data would sit unused in `payload` forever, and the
  // retrieval-quality gap this was built to fix (05-tasklist.md item 1)
  // would still exist in what actually gets embedded.
  const unionMembers: string[] | undefined = fact.unionMembers ?? fact.evidence?.unionMembers;
  const values = unionMembers && unionMembers.length > 0 ? ` -- possible values: ${unionMembers.join(", ")}` : "";
  // Same class of fix, same day: a class's generic base-type argument (e.g.
  // `extends OSKDocumentController<OSKBuildingUnitInhabitant>`) is the one
  // real, precise link between a controller and the document type it
  // manages -- asked directly ("do we leverage this data yet") and the
  // honest answer was no, it wasn't surfaced in what gets embedded either.
  const extendsArgs: string[] | undefined = fact.extendsClassTypeArguments ?? fact.evidence?.extendsClassTypeArguments;
  const managesDoc = extendsArgs && extendsArgs.length > 0 && fact.extendsClass
    ? ` -- extends ${fact.extendsClass}<${extendsArgs.join(", ")}>, manages document type(s): ${extendsArgs.join(", ")}`
    : "";
  // Fourth instance of the same pattern, found 2026-09-02: a method's real
  // return type (e.g. `Promise<OSKDocument<OSKBuildingUnitInhabitant> |
  // undefined>`) already names the document type it hands back -- the
  // request/CRUD-call side of the same Controller-to-document connection
  // `managesDoc` above captures from the class-declaration side. Ts-morph's
  // own type text embeds a verbose `import("path/to/file").` prefix before
  // every named type, which is real information (confirms exactly which
  // file the type comes from) but too noisy to embed usefully as-is --
  // stripped here, not at extraction time, so the raw fact keeps the full
  // resolvable path and only the search-facing text gets cleaned up.
  // Skipped for trivial return types (Promise<void>, void, primitives) --
  // there's no document connection to surface for those, so adding this
  // text unconditionally would just add noise for the large majority of
  // methods, which is exactly the class of problem this whole thread has
  // been about avoiding.
  const rawReturnType: string | undefined = fact.returnType ?? fact.evidence?.returnType;
  const cleanedReturnType = rawReturnType?.replace(/import\("[^"]*"\)\./g, "");
  const isTrivialReturnType = !cleanedReturnType || /^(Promise<)?(void|any|unknown|never|string|number|boolean)(\s*\|\s*undefined)?>?$/.test(cleanedReturnType.trim());
  const returnsDoc = cleanedReturnType && !isTrivialReturnType ? ` -- returns: ${cleanedReturnType}` : "";
  // Fifth instance of the same pattern, found 2026-09-03 via a real
  // atomic-PRD retrieval-quality investigation (05-tasklist.md item 6): a
  // confidently-wrong retrieval collision traced back to api_contract and
  // call_expression being the two most information-poor fact kinds in the
  // whole index -- their descriptions sat at or near the bare
  // "{kind} in {module}: {symbolName}" floor. Real payload check confirmed
  // real, already-captured signal (requestType, handlerExpression,
  // callerClass, calleeExpression) sitting completely unused. Deliberately
  // NOT surfacing raw `arguments` here -- a real call_expression fact
  // already showed a multi-line object literal dumped verbatim as an
  // argument, which would add noise, not signal.
  const rawRequestType: string | undefined = fact.requestType ?? fact.evidence?.requestType;
  const rawResponseType: string | undefined = fact.responseType ?? fact.evidence?.responseType;
  const handlerExpression: string | undefined = fact.handlerExpression ?? fact.evidence?.handlerExpression;
  const cleanedRequestType = rawRequestType?.replace(/import\("[^"]*"\)\./g, "");
  const cleanedResponseType = rawResponseType?.replace(/import\("[^"]*"\)\./g, "");
  const apiContractDoc = fact.type === "api_contract"
    ? `${handlerExpression ? ` -- handled by: ${handlerExpression}` : ""}${cleanedRequestType ? ` -- request: ${cleanedRequestType}` : ""}${cleanedResponseType ? ` -- response: ${cleanedResponseType}` : ""}`
    : "";
  const callerClass: string | undefined = fact.callerClass ?? fact.evidence?.callerClass;
  const calleeExpression: string | undefined = fact.calleeExpression ?? fact.evidence?.calleeExpression;
  const callExpressionDoc = fact.type === "call_expression"
    ? `${callerClass ? ` -- inside: ${callerClass}` : ""}${calleeExpression ? ` -- calls: ${calleeExpression}` : ""}`
    : "";

  // Sixth through eleventh real instances of the same pattern, found
  // 2026-09-03 via governance/roadmap/facts-serving-strategy/14-inbound-
  // outbound-surface-graph-tasklist.md's audit: cross-repo evidence
  // (PGO/Angular, node-iot) never surfaced in atomic-PRD searches not
  // because it was missing from the index -- checked directly, it was
  // already loaded and already embedded -- but because these seven kinds
  // never got any description enrichment at all, unlike api_contract/
  // call_expression above. Same discipline: surface real, already-captured
  // payload content; never invent; skip cleanly where a field is absent.

  const requestTypeText: string | undefined = fact.requestTypeText ?? fact.evidence?.requestTypeText;
  const responseTypeText: string | undefined = fact.responseTypeText ?? fact.evidence?.responseTypeText;
  const cleanedRequestTypeText = requestTypeText?.replace(/import\("[^"]*"\)\./g, "");
  const cleanedResponseTypeText = responseTypeText?.replace(/import\("[^"]*"\)\./g, "");
  const firebaseCallableCallDoc = fact.type === "firebase_callable_call"
    ? `${cleanedRequestTypeText ? ` -- request: ${cleanedRequestTypeText}` : ""}${cleanedResponseTypeText ? ` -- response: ${cleanedResponseTypeText}` : ""}`
    : "";

  const httpMethod: string | undefined = fact.method ?? fact.evidence?.method;
  const httpPath: string | undefined = fact.httpPath ?? fact.evidence?.httpPath;
  const handlerMethod: string | undefined = fact.handlerMethod ?? fact.evidence?.handlerMethod;
  const routeDefinitionDoc = fact.type === "route_definition"
    ? `${httpMethod && httpPath ? ` -- route: ${httpMethod} ${httpPath}` : ""}${handlerMethod ? ` -- handled by: ${handlerMethod}` : ""}`
    : "";

  const operationValue: string | undefined = fact.operationValue ?? fact.evidence?.operationValue;
  const targetCalls: string[] | undefined = fact.targetCalls ?? fact.evidence?.targetCalls;
  const pubsubOperationRouteDoc = fact.type === "pubsub_operation_route"
    ? `${operationValue ? ` -- operation: ${operationValue}` : ""}${targetCalls && targetCalls.length > 0 ? ` -- calls: ${targetCalls.join(", ")}` : ""}`
    : "";
  const pubsubEventRouteDoc = fact.type === "pubsub_event_route"
    ? (targetCalls && targetCalls.length > 0 ? ` -- calls: ${targetCalls.join(", ")}` : "")
    : "";

  // A route's real value is which component it renders (or which child
  // routes it delegates to) and which guard protects it -- none of that
  // was in the description before, despite already being captured.
  // loadComponentRaw/loadChildrenRaw are raw lazy-import expressions (e.g.
  // "() => import(...).then((c) => c.OSKFooComponent)") -- extracted here
  // rather than at extraction time, same rationale as the return-type
  // cleaning above: the raw fact keeps the full expression, only the
  // search-facing text gets the useful piece pulled out.
  const canActivate: string[] | undefined = fact.canActivate ?? fact.evidence?.canActivate;
  const loadComponentRaw: string | undefined = fact.loadComponentRaw ?? fact.evidence?.loadComponentRaw;
  const loadChildrenRaw: string | undefined = fact.loadChildrenRaw ?? fact.evidence?.loadChildrenRaw;
  // Real bug caught before shipping: the raw expression is often multi-line
  // ("(c) =>\n  c.OSKFooComponent\n)"), so the closing paren doesn't
  // directly follow the identifier -- a first version of this regex
  // (`\)` with no `\s*` before it) matched only 10/44 real angular_route
  // facts. Verified this version against all 44 real facts: 44/44 match.
  const loadedComponent = loadComponentRaw?.match(/=>\s*\w+\.(\w+)\s*\)/)?.[1];
  const loadedChildrenPath = loadChildrenRaw?.match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
  const angularRouteDoc = fact.type === "angular_route"
    ? `${loadedComponent ? ` -- renders: ${loadedComponent}` : ""}${loadedChildrenPath ? ` -- loads child routes from: ${loadedChildrenPath}` : ""}${canActivate && canActivate.length > 0 ? ` -- guarded by: ${canActivate.join(", ")}` : ""}`
    : "";

  // A component's real HTML selector is the join key back to
  // angular_template_composition's "which templates use this" facts --
  // without it, a component fact and its own usages can't be connected by
  // name at all.
  const selector: string | undefined = fact.selector ?? fact.evidence?.selector;
  const angularComponentDoc = fact.type === "angular_component" && selector
    ? ` -- selector: <${selector}>`
    : "";

  const decoratorType: string | undefined = fact.decoratorType ?? fact.evidence?.decoratorType;
  const providedIn: string | undefined = fact.providedIn ?? fact.evidence?.providedIn;
  const angularInjectableDoc = fact.type === "angular_injectable"
    ? `${decoratorType ? ` -- ${decoratorType}` : ""}${providedIn ? ` (provided in: ${providedIn})` : ""}`
    : "";

  // Real gap found 2026-09-05 (governance/roadmap/facts-serving-strategy/
  // 15-...md, task 2): a literal (non-bound) template attribute like
  // `formControlName="x"` or `value="x"` was invisible before this --
  // confirmed real and significant, 92 of 160 real formControlName usages
  // in this repo use exactly this unbound form. The fact's own `value`
  // field (e.g. `select[formControlName] = "inhabitantType"`) already
  // carries the core signal; this adds the containing component class for
  // extra findability, same modest-enrichment level as angular_component's
  // selector above.
  const templateAttrClassName: string | undefined = fact.className ?? fact.evidence?.className;
  const angularTemplateAttributeDoc = fact.type === "angular_template_attribute" && templateAttrClassName
    ? ` -- in component: ${templateAttrClassName}`
    : "";

  // Real gap found 2026-09-05 during the retrieval-anchor-gap investigation
  // (governance/roadmap/facts-serving-strategy/16-session-handoff-2026-09-05.md):
  // model_property was the one common fact kind with NO enrichment branch at
  // all -- its description was always the bare "{kind} in {module}: {sym}
  // (loc)" floor. Real, measured consequence: ~24 real `TypeName.inhabitantType`
  // facts across the Firebase repo are textually indistinguishable except for
  // module path/type name/file path -- confirmed via a real full-corpus rank
  // of the two real Q1a/Q1b queries, where the actual target fact ranked #91
  // and #724 (never top-10) while the #1 Q1a result was a field whose real
  // type is a bare `string`, carrying zero real type-constraint signal.
  // `propertyType` is already captured in every model_property fact's payload
  // (confirmed directly) and was simply never surfaced -- same class of fix
  // as returnType/requestType above, same import-prefix cleaning.
  const rawPropertyType: string | undefined = fact.propertyType ?? fact.evidence?.propertyType;
  const cleanedPropertyType = rawPropertyType?.replace(/import\("[^"]*"\)\./g, "");
  const modelPropertyDoc = fact.type === "model_property" && cleanedPropertyType
    ? ` -- type: ${cleanedPropertyType}`
    : "";

  return `${fact.type} in ${module}${sub}: ${sym}${values}${managesDoc}${returnsDoc}${apiContractDoc}${callExpressionDoc}${firebaseCallableCallDoc}${routeDefinitionDoc}${pubsubOperationRouteDoc}${pubsubEventRouteDoc}${angularRouteDoc}${angularComponentDoc}${angularInjectableDoc}${angularTemplateAttributeDoc}${modelPropertyDoc} (${loc})`;
}

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

async function main() {
  const REPO_NAME = process.env.REPO_NAME;
  const MODULE_NAME = process.env.MODULE_NAME;
  if (!REPO_NAME) throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  if (!MODULE_NAME) throw new Error("[Fail-Closed] MODULE_NAME environment variable is required and was not set.");

  const runCtxPath = runContextPath(PROJECT_ROOT, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) throw new Error(`[Fail-Closed] Could not find ${runCtxPath}. Run the Phase 1 pipeline first.`);
  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const { runId, commitSha, branch } = runContext;
  if (!runId || !commitSha) throw new Error(`[Fail-Closed] Missing runId/commitSha in ${runCtxPath}.`);

  const packsDir = path.join(PROJECT_ROOT, "output", "runs", REPO_NAME, runId, "knowledge-pipeline", "modules", MODULE_NAME, "capability-packs");
  if (!fs.existsSync(packsDir)) throw new Error(`[Fail-Closed] No capability-packs directory for module '${MODULE_NAME}' at '${packsDir}'.`);

  // Real fix over the Python prototype: read EVERY capability pack in the
  // module, not just _module_root.json -- a module with more than one
  // capability (e.g. supplier's _module_root.json + supplierStaff.json)
  // was silently missing every non-root pack's facts before.
  const packFiles = fs.readdirSync(packsDir).filter(f => f.endsWith(".json"));
  let allFacts: Fact[] = [];
  for (const pf of packFiles) {
    const pack = JSON.parse(fs.readFileSync(path.join(packsDir, pf), "utf8"));
    allFacts = allFacts.concat(pack.facts);
  }
  const facts = allFacts.filter(f => f.id);

  const db = pool();
  try {
    // 1. Record this run, mark it current for this repo (any prior run for
    // this repo stops being "current" -- exactly one true per repo).
    await db.query("BEGIN");
    await db.query(
      `INSERT INTO extraction_runs (run_id, repo, commit_sha, branch, extracted_at, is_current)
       VALUES ($1, $2, $3, $4, now(), true)
       ON CONFLICT (run_id) DO NOTHING`,
      [runId, REPO_NAME, commitSha, branch ?? "unknown"]
    );
    await db.query(`UPDATE extraction_runs SET is_current = (run_id = $1) WHERE repo = $2`, [runId, REPO_NAME]);

    // 2. Upsert every fact in one pass. The key correctness point, done in
    // SQL rather than as a separate diff-then-update step: on conflict,
    // if the incoming description differs from what's stored, the
    // embedding is explicitly nulled out -- it now describes stale
    // content and must be re-embedded (task 4 picks up anything with a
    // NULL embedding). If the description is unchanged, the existing
    // embedding is deliberately preserved, so an unchanged fact never
    // gets re-embedded (and re-paid for) for no reason.
    let insertedCount = 0;
    let invalidatedCount = 0;
    let unchangedCount = 0;

    for (let i = 0; i < facts.length; i += CHUNK_SIZE) {
      const chunk = facts.slice(i, i + CHUNK_SIZE);
      const values: any[] = [];
      const rows: string[] = [];
      chunk.forEach((f, idx) => {
        const base = idx * 10;
        // Explicit casts, not optional here: parameterized values arrive
        // over the wire as text, and Postgres can't otherwise infer that
        // column 7 is an integer or column 9 is jsonb from an untyped
        // multi-row VALUES list -- confirmed by hitting exactly this error
        // on the first real run against real data.
        rows.push(
          `($${base + 1}::text,$${base + 2}::text,$${base + 3}::text,$${base + 4}::text,$${base + 5}::text,` +
          `$${base + 6}::text,$${base + 7}::integer,$${base + 8}::text,$${base + 9}::jsonb,$${base + 10}::text)`
        );
        values.push(
          f.id,
          f.repo ?? REPO_NAME,
          f.module ?? MODULE_NAME,
          f.submodule ?? null,
          f.type,
          f.file ?? null,
          f.line ?? null,
          symbolNameFor(f),
          JSON.stringify(f),
          descriptionFor(f, MODULE_NAME)
        );
      });

      const result = await db.query(
        `
        INSERT INTO facts (fact_id, repo, module, submodule, kind, file, line, symbol_name, payload, description, run_id)
        SELECT v.fact_id, v.repo, v.module, v.submodule, v.kind, v.file, v.line, v.symbol_name, v.payload, v.description, $${chunk.length * 10 + 1}
        FROM (VALUES ${rows.join(",")}) AS v(fact_id, repo, module, submodule, kind, file, line, symbol_name, payload, description)
        ON CONFLICT (fact_id) DO UPDATE SET
          repo = EXCLUDED.repo, module = EXCLUDED.module, submodule = EXCLUDED.submodule,
          kind = EXCLUDED.kind, file = EXCLUDED.file, line = EXCLUDED.line,
          symbol_name = EXCLUDED.symbol_name, payload = EXCLUDED.payload,
          description = EXCLUDED.description,
          embedding = CASE WHEN facts.description IS DISTINCT FROM EXCLUDED.description THEN NULL ELSE facts.embedding END,
          run_id = EXCLUDED.run_id, updated_at = now()
        RETURNING (xmax = 0) AS was_insert, (embedding IS NULL) AS embedding_missing
        `,
        [...values, runId]
      );

      for (const row of result.rows) {
        // was_insert and embedding_missing are independent facts about the
        // row, not mutually exclusive categories -- a brand-new fact is
        // BOTH an insert AND needs embedding, and the original version of
        // this loop only counted it as the former, undercounting how many
        // rows actually needed embedding by exactly the new-fact count.
        // Confirmed wrong on the first real run: 784 new facts synced for
        // `supplier`, reported as "0 need embedding," which cannot be
        // right for a brand-new set of rows with no embedding yet.
        if (row.was_insert) insertedCount++;
        if (row.embedding_missing) invalidatedCount++;
        else unchangedCount++;
      }
    }

    // 3. Prune -- remove facts for this repo+module that are no longer in
    // the current extraction (renamed/deleted code), scoped tightly so
    // this never touches other modules' rows.
    const currentIds = facts.map(f => f.id);
    const pruneResult = await db.query(
      `DELETE FROM facts WHERE repo = $1 AND module = $2 AND NOT (fact_id = ANY($3::text[])) RETURNING fact_id`,
      [REPO_NAME, MODULE_NAME, currentIds]
    );

    await db.query("COMMIT");

    // Reported as "needs embedding" rather than "invalidated" -- a row can
    // land here either because its description genuinely changed (a real
    // invalidation) or because it simply never had an embedding yet (e.g.
    // this is its first real sync). Both need the embed step below to run
    // on them; the distinction isn't meaningful to report, and calling
    // both "invalidated" would overstate what actually happened on a
    // first sync against previously-unembedded data.
    console.log(`Synced module '${MODULE_NAME}' (${REPO_NAME}, run ${runId}):`);
    console.log(`  ${insertedCount} new facts`);
    console.log(`  ${invalidatedCount} facts need (re-)embedding (new, changed, or never yet embedded)`);
    console.log(`  ${unchangedCount} facts have a still-valid embedding (no action needed)`);
    console.log(`  ${pruneResult.rowCount} stale facts removed (no longer in this extraction)`);

    // Embedding step -- deliberately gated behind an explicit opt-in
    // (EMBED=true), not run by default. This is the one real, paid step in
    // the whole sync; per this project's own standing rule, a real call to
    // an embedding/LLM model always needs an explicit, conscious trigger,
    // never a side effect of running a sync. Without the flag, the sync
    // above still completes fully and correctly -- facts are current,
    // pruning happened, only embedding is left pending, and this message
    // says exactly how much and how to proceed.
    if (invalidatedCount === 0) return;
    if (process.env.EMBED !== "true") {
      console.log(`  (${invalidatedCount} facts left with no embedding -- set EMBED=true to generate them for real; this is the one real API cost in this script.)`);
      return;
    }

    const pending = await db.query<{ fact_id: string; symbol_name: string | null; description: string }>(
      `SELECT fact_id, symbol_name, description FROM facts WHERE repo = $1 AND module = $2 AND embedding IS NULL`,
      [REPO_NAME, MODULE_NAME]
    );

    let embeddedCount = 0;
    for (let i = 0; i < pending.rows.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = pending.rows.slice(i, i + EMBEDDING_BATCH_SIZE);
      const { results, usage } = await embedFactDocuments(
        batch.map(r => ({ id: r.fact_id, text: r.description, title: r.symbol_name }))
      );
      for (const r of results) {
        // pgvector's plain-text literal format, confirmed working earlier
        // against this same local instance (`'[1,2,3]'::vector`) -- no
        // extra client library needed for this.
        await db.query(`UPDATE facts SET embedding = $1::vector WHERE fact_id = $2`, [`[${r.embedding.join(",")}]`, r.id]);
        embeddedCount++;
      }

      // Real economics, recorded per call -- not estimated after the fact.
      // See embedding_calls' own schema comment for why this exists and
      // why it's a separate table from the old P2 pipeline's notification
      // log.
      const totalTokens = results.reduce((sum, r) => (r.tokenCount !== undefined ? sum + r.tokenCount : sum), 0);
      const anyTokenReported = results.some(r => r.tokenCount !== undefined);
      const anyTruncated = results.some(r => r.truncated === true);
      await db.query(
        `INSERT INTO embedding_calls (repo, module, fact_count, billable_character_count, total_token_count, any_truncated)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [REPO_NAME, MODULE_NAME, batch.length, usage.billableCharacterCount ?? null, anyTokenReported ? totalTokens : null, anyTruncated]
      );

      console.log(`  embedded ${embeddedCount}/${pending.rows.length}... (this batch: ${usage.billableCharacterCount ?? "?"} billable chars${anyTruncated ? ", WARNING: at least one description was truncated" : ""})`);
    }
    console.log(`  done: ${embeddedCount} facts embedded for real.`);
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    await db.end();
  }
}

// Guarded so this module can be `import`ed (e.g. to reuse descriptionFor()
// for a targeted re-embed test) without running the full sync as a side
// effect -- direct invocation via `node -r ts-node/register sync-facts.ts`
// (the only way this script is ever actually run in package.json) still
// triggers main() exactly as before.
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

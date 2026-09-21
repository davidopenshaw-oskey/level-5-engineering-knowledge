// Standalone Genkit script, sibling to atomic-prd-agent.ts, not a
// replacement for it -- implements the 3-step capability-fanout design from
// governance/roadmap/graphrag/08-prompt-9-capability-fanout-merge-design-
// 2026-09-11.md (itself the build task named in graphrag/01-...md §10
// conclusion 2). Read that design doc before changing this file -- it
// records the real reasoning behind the choices below (why walk_cluster/
// get_graph_neighbors stay unfiltered, why capability calls run
// sequentially, the per-content-kind merge rules).
//
// Reuses, unchanged, per the design doc's own explicit instruction:
// assembleDocument/writeOutput/RunMeta/getSnapshotFreshness/getFactMaps/
// pool/retryOn429/withToolErrorTrapping/debugLogToolCall (all exported from
// atomic-prd-agent.ts for this reuse) and checkFabrication/
// checkTemplateConformance/extractRealFactRefs (validators.ts, untouched).
// The only genuinely new logic here is the routing pass, the per-capability
// tool scoping, and the merge step.
import "dotenv/config";
import fs from "fs";
import path from "path";
import type { GenerateResponse } from "genkit";
import { z, GenerationResponseError } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { search, type SearchResult, type SearchResponse } from "../db/search";
import { expandWithGraphNeighbors, walkBoundedCluster } from "../db/graph-traversal";
import { setQueryTraceDir } from "../db/query-trace";
import { GenerationOutputSchema, type GenerationOutput, type SectionContent } from "./section-content";
import { parseTemplate, type ParsedTemplate, type TemplateSection } from "./template";
import { extractRealFactRefs, checkFabrication, checkTemplateConformance } from "./validators";
import { fetchVertexAiPricing, computeApproxCost, type TokenUsage } from "./pricing";
import {
  ai,
  config,
  PROJECT_ROOT,
  DEFAULT_TEMPLATE_PATH,
  OUTPUT_DIR,
  pool,
  assembleDocument,
  writeOutput,
  getSnapshotFreshness,
  getFactMaps,
  formatDuration,
  retryOn429,
  withToolErrorTrapping,
  debugLogToolCall,
  slugify,
  type RunMeta,
} from "./atomic-prd-agent";

// ---------------------------------------------------------------------------
// Step 1: routing pass. Cheap, Postgres-only, no LLM call -- one search()
// call against the whole corpus (no module filter), then group by the
// `module` column search() already returns per result (design doc §1: no
// separate SELECT DISTINCT query needed, it was never necessary once
// actually checked against the real SearchResult shape).
// ---------------------------------------------------------------------------

export interface CapabilityCandidate {
  module: string;
  factCount: number;
  bestDistance: number;
}

export async function routeCapabilities(
  businessRequest: string,
  opts: { limit: number; minFacts: number; maxCapabilities: number }
): Promise<{ routing: SearchResult[]; capabilities: CapabilityCandidate[] }> {
  const routing = await search(businessRequest, opts.limit);
  const byModule = new Map<string, { count: number; bestDistance: number }>();
  for (const r of routing.results) {
    const existing = byModule.get(r.module);
    if (!existing) byModule.set(r.module, { count: 1, bestDistance: r.vectorDistance });
    else {
      existing.count++;
      existing.bestDistance = Math.min(existing.bestDistance, r.vectorDistance);
    }
  }
  const capabilities = [...byModule.entries()]
    .map(([module, v]) => ({ module, factCount: v.count, bestDistance: v.bestDistance }))
    .filter(c => c.factCount >= opts.minFacts)
    .sort((a, b) => a.bestDistance - b.bestDistance)
    .slice(0, opts.maxCapabilities);
  return { routing: routing.results, capabilities };
}

// ---------------------------------------------------------------------------
// Step 1b: explicit in-scope-platforms parsing (governance/roadmap/dynamic-
// pipeline-architecture/16-plan-explicit-pm-directed-scope-2026-09-20.md,
// 17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md,
// 23-build-prompt-explicit-scope-orchestration-phase2-2026-09-20.md). Real
// alternative to Step 1's automated vector routing above, used only when a
// business request explicitly states its own "**In-scope platforms**:"
// list -- see main()'s coexistence check. Free, Postgres-only, no LLM call,
// same as Step 1.
// ---------------------------------------------------------------------------

export const IN_SCOPE_PLATFORMS_MARKER = "**In-scope platforms**:";

export interface PlatformEntry {
  name: string;
  repos: string[];
  // Real, added 2026-09-20 (same day as the rest of this file, in direct
  // response to a live finding: a platform's own directive TEXT is not a
  // scope filter -- editing it to name "primary" modules had zero effect on
  // which real modules actually got resolved, since nothing parsed it as
  // one. This tag is the actual filter. Empty array (no <!-- modules: -->
  // tag present) means "no narrowing requested" -- resolveExplicitScopeCapabilities
  // falls back to every real module the named repo(s) have, unchanged from
  // this file's original behavior.
  modules: string[];
  directive: string;
}

// Regex reproduced verbatim from the real, tested parse-only script this
// prompt's own prep ran against the real 1b file (doc 23) -- not re-derived,
// to avoid reintroducing the one real bug that test already caught and fixed
// (a greedy `\s*` matched newlines and broke the parser; fixed with `[ \t]*`).
// The new <!-- modules: ... --> tag (below) reuses the exact same match/
// split/trim shape as the existing <!-- repo: ... --> tag, deliberately --
// same real convention, not a new one.
export function parseInScopePlatforms(markdown: string): PlatformEntry[] {
  const sectionMatch = markdown.match(/\*\*In-scope platforms\*\*:\s*\n([\s\S]*?)(?=\n\*\*[^*]+\*\*:|\n*$)/);
  if (!sectionMatch) return [];
  const sectionText = sectionMatch[1];
  const entries: PlatformEntry[] = [];
  const entryRe = /^- (.+?)[ \t]*\n((?:^[ \t]+<!--.*-->[ \t]*\n?)*)/gm;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(sectionText)) !== null) {
    const name = m[1].trim();
    const metaBlock = m[2];
    const repoMatch = metaBlock.match(/<!--\s*repo:\s*(.+?)\s*-->/);
    const modulesMatch = metaBlock.match(/<!--\s*modules:\s*(.+?)\s*-->/);
    const directiveMatch = metaBlock.match(/<!--\s*directive:\s*(.+?)\s*-->/);
    entries.push({
      name,
      repos: repoMatch ? repoMatch[1].split(",").map(r => r.trim()).filter(Boolean) : [],
      modules: modulesMatch ? modulesMatch[1].split(",").map(m2 => m2.trim()).filter(Boolean) : [],
      directive: directiveMatch ? directiveMatch[1].trim() : "",
    });
  }
  return entries;
}

export interface ResolvedCapability {
  module: string;
  // undefined only for a Step-1 (vector-routing) capability -- every
  // explicit-scope capability always has a real repo, since that's the
  // whole point of this path (see capabilityKey below).
  repo?: string;
  directive?: string;
}

// Real identity of a capability once repo enters the picture, used ONLY
// where a collision would silently lose data: debug-trace filenames
// (FULL_DEBUG) and the per-capability meta.json dictionaries below. Plain
// module-name arrays (candidateModules, capabilitiesRun, failedCapabilities)
// are deliberately left unqualified -- a duplicate there is cosmetically
// ambiguous, not lossy (arrays don't silently overwrite), and the current
// live templates (template.md, template.v2.md) have no `kind: prose`
// section where a module-only label could visibly collide in the rendered
// document either -- real, checked, not assumed; revisit if a future
// template adds one. Module names recur across real repos (the whole
// motivation for opts.repoFilter on search(), above) -- e.g. `features`
// exists in both firebase-oskey-dev and angular-app-oskey-io -- so two
// explicit-scope capabilities can share a bare module name.
function capabilityKey(module: string, repo?: string): string {
  return repo ? `${repo}/${module}` : module;
}

// Real bug, found live 2026-09-20 (first real run against a repo-qualified
// capabilityKey): the "/" separator above is fine as a Map/Record key or a
// console label, but every capability that hit it in a FULL_DEBUG filename
// crashed instead -- `tool-calls-${key}.jsonl`/`llm-${key}.json` with a "/"
// inside silently became a path with an extra, nonexistent directory
// segment (`tool-calls-firebase-oskey-dev/building.jsonl` means "write
// building.jsonl inside a tool-calls-firebase-oskey-dev/ directory that was
// never created"), so every one of that real run's 17 capabilities failed
// identically on their first search_facts call with ENOENT -- a real,
// wasted, if modest, spend (each capability's first real Vertex turn +
// embedding call ran before the crash) for zero usable output. Filename
// call sites sanitize through this before use; capabilityKey's own "/"
// form stays as-is everywhere else (meta.json dictionary keys, console
// labels) -- neither is a filesystem path.
function sanitizeKeyForFilename(key: string): string {
  return key.replace(/\//g, "__");
}

// Real, deliberate choice for the two "partial failure" cases doc 23 left
// open, not left ambiguous: a malformed platform entry (empty `repos`) or a
// named repo with zero real modules in `facts` (typo, or never synced) is
// skipped individually with a loud console.error, not silently dropped and
// not a reason to fail the whole request -- same "never silently swallow,
// always surface, keep the rest of a real run" discipline main()'s own
// per-capability try/catch already applies in Step 2 below. The request
// fails closed only when NOTHING real is left to synthesize after all
// skips: zero valid platform entries (checked in main(), mirroring the
// existing "zero candidate modules" fail-closed message on the vector-
// routing path), or here, zero real (repo, module) pairs resolved at all.
export async function resolveExplicitScopeCapabilities(
  entries: PlatformEntry[],
  queryModulesByRepo: (repos: string[]) => Promise<{ repo: string; module: string }[]>
): Promise<ResolvedCapability[]> {
  const allRepos = [...new Set(entries.flatMap(e => e.repos))];
  const rows = await queryModulesByRepo(allRepos);
  const modulesByRepo = new Map<string, string[]>();
  for (const row of rows) {
    if (!modulesByRepo.has(row.repo)) modulesByRepo.set(row.repo, []);
    modulesByRepo.get(row.repo)!.push(row.module);
  }

  // Keyed by capabilityKey so the SAME real (repo, module) pair named by two
  // different platform entries (e.g. two platforms both listing the same
  // repo) spawns exactly one capability, not a wasteful duplicate real LLM
  // call -- real cost discipline, not just tidiness, per this project's own
  // standing "flag real spend" rule: an avoidable duplicate call is spend
  // that should never have been flagged for approval in the first place.
  const resolved = new Map<string, ResolvedCapability>();
  for (const entry of entries) {
    for (const repo of [...new Set(entry.repos)]) {
      const realModules = modulesByRepo.get(repo) ?? [];
      if (realModules.length === 0) {
        console.error(`  [explicit-scope] platform '${entry.name}': repo '${repo}' has zero real modules in facts -- skipping (typo, or repo never synced).`);
        continue;
      }

      // Real, added 2026-09-20: an entry's own optional <!-- modules: -->
      // tag narrows which of this repo's real modules actually get a
      // capability -- exact string match against the real module column,
      // not fuzzy/case-insensitive (this project's own repo-matching
      // convention above does the same, and a live example already showed
      // why silent fuzzy matching would be the wrong call here: this exact
      // 1b file's own free-text directive prose reads "users" where the
      // real module is "user" -- a typo that must surface loudly, not
      // silently match or silently drop). No <!-- modules: --> tag (empty
      // array) is unchanged from this function's original behavior: every
      // real module the repo has.
      let modules: string[];
      if (entry.modules.length === 0) {
        modules = realModules;
      } else {
        const requested = [...new Set(entry.modules)];
        const matched = requested.filter(m => realModules.includes(m));
        const unmatched = requested.filter(m => !realModules.includes(m));
        if (unmatched.length > 0) {
          console.error(`  [explicit-scope] platform '${entry.name}': repo '${repo}' has no real module(s) named ${unmatched.map(m => `'${m}'`).join(", ")} (real modules: ${realModules.join(", ")}) -- typo? dropping the unmatched name(s), not silently substituting.`);
        }
        if (matched.length === 0) {
          console.error(`  [explicit-scope] platform '${entry.name}': repo '${repo}' -- none of the requested <!-- modules: ${entry.modules.join(", ")} --> matched a real module; skipping this repo entirely rather than silently falling back to every module.`);
          continue;
        }
        modules = matched;
      }

      for (const module of modules) {
        const key = capabilityKey(module, repo);
        const existing = resolved.get(key);
        if (existing) {
          if (existing.directive !== entry.directive) {
            console.error(`  [explicit-scope] '${key}' already resolved with directive "${existing.directive}" -- platform '${entry.name}' also resolves to it with a different directive "${entry.directive}"; keeping the first, not spawning a duplicate capability.`);
          }
          continue;
        }
        resolved.set(key, { module, repo, directive: entry.directive });
      }
    }
  }
  return [...resolved.values()];
}

// ---------------------------------------------------------------------------
// Step 2: per-capability synthesis. Each capability gets its own real
// conversation: its own module-scoped search_facts, its own fresh
// seenFactRefs dedup set, its own smaller MAX_TURNS. walk_cluster/
// get_graph_neighbors are deliberately NOT module-scoped -- see design doc
// §3 for why (the real Q1a cross-module FIELD_BINDING case this whole task
// exists to test would be unreachable otherwise).
// ---------------------------------------------------------------------------

// Real, opt-in FULL_DEBUG sibling to atomic-prd-agent.ts's own
// debugLogToolCall -- writes into this run's own debug/<baseName>/ folder
// (one file per capability, so a reader can follow one capability's tool
// calls without wading through every other capability's) rather than
// DEBUG_TOOL_LOG's single flat file. Deliberately separate from
// debugLogToolCall, not a replacement for it -- that mechanism's existing
// DEBUG_TOOL_LOG-env-var-gated behavior stays exactly as it was for every
// other caller.
function debugTraceToolCall(debugDir: string | null, key: string, name: string, input: unknown, output: unknown): void {
  if (!debugDir) return;
  const file = path.join(debugDir, `tool-calls-${sanitizeKeyForFilename(key)}.jsonl`);
  fs.appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), tool: name, input, output }) + "\n", "utf8");
}

// Real, 2026-09-20 (governance/roadmap/dynamic-pipeline-architecture/
// 09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md,
// 10-build-plan-duplicate-search-queries-fix-2026-09-20.md): one shared
// per-capability structure behind both the exact-duplicate cache (a
// guaranteed-identical repeat costs zero real spend) and the cross-module
// escalation gate (a soft betterMatchOutsideModule signal that becomes a
// real, code-enforced refusal after firing twice for the same underlying
// concept) -- designed together, not as two independent trackers, per the
// real alreadyRetrieved (soft) + maxTurns (hard) precedent already in this
// same file.
type TriedQueryOutcome =
  | { kind: "executed"; response: SearchResponse; crossModuleFlagged: boolean }
  | { kind: "blocked" };
interface TriedQuery { query: string; limit?: number; outcome: TriedQueryOutcome }

// Deliberately direct/pairwise, not a transitive clustering pass -- a real,
// known limitation stated plainly in 10-...md rather than hidden: a short,
// generic early query can end up "related" to several later ones that
// aren't related to each other. Case-insensitive, either direction.
function isRelatedQuery(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x !== y && (x.includes(y) || y.includes(x));
}

const CROSS_MODULE_BLOCKED_REASON =
  "This concept has now been flagged twice as belonging to a different module; " +
  "this tool will not run further searches for it this call. If it's critical, " +
  "write [NEEDS CLARIFICATION] and move on.";

function makeCapabilityTools(
  moduleFilter: string,
  seenFactRefs: Set<string>,
  debugDir: string | null,
  triedQueries: TriedQuery[],
  crossModuleMargin: number | undefined,
  crossModuleBlockAfter: number,
  // Real, added 2026-09-20 (doc 23 above) -- only set on the explicit-scope
  // path, where a capability's real identity is (repo, module), not module
  // alone. undefined preserves every existing (vector-routing-path) caller's
  // exact prior behavior.
  repoFilter?: string
) {
  const debugKey = capabilityKey(moduleFilter, repoFilter);
  const scopeDescription = repoFilter ? `'${moduleFilter}' module of the '${repoFilter}' repo` : `'${moduleFilter}' module/capability`;
  const searchOpts: { crossModuleMargin?: number; repoFilter?: string } | undefined =
    crossModuleMargin !== undefined || repoFilter !== undefined
      ? { ...(crossModuleMargin !== undefined ? { crossModuleMargin } : {}), ...(repoFilter !== undefined ? { repoFilter } : {}) }
      : undefined;
  const searchFacts = ai.defineTool(
    {
      name: "search_facts",
      description: `Search the codebase's fact index for real, code-derived evidence relevant to this business request -- restricted to the ${scopeDescription} only. This is one focused synthesis pass among several separate calls, each scoped to a different module of the same overall request; other modules are covered by other calls, not this one. Returns ranked candidate facts with real factRefs -- a short, opaque reference token, not a readable identifier; copy it character for character wherever you need to pass it back. Each result carries alreadyRetrieved: true if you were already given this exact factRef earlier in this conversation -- if so, don't search again for the same concept; call walk_cluster or get_graph_neighbors on it instead. The response also carries exactDuplicateOfPriorQuery/substringOfPriorQuery when this query's text exactly repeats, or contains/is contained by, an earlier query you already tried this call, and betterMatchOutsideModule: { module, distance } when a real, meaningfully stronger match for this same query exists in a different module -- that often means this concept structurally belongs to a different capability call, not that another rephrasing here will find it. The first two times a query for the same underlying concept comes back with betterMatchOutsideModule set, treat it as real evidence to weigh, not a block. The next related attempt after that is refused outright (blocked: true, no results) rather than run -- at that point, write [NEEDS CLARIFICATION: ...] for this part of your assigned scope and move on to something your own module's evidence can actually support.`,
      inputSchema: z.object({ query: z.string(), limit: z.number().optional() }),
    },
    async ({ query, limit }) => {
      console.log(`    [tool call, module=${moduleFilter}${repoFilter ? `, repo=${repoFilter}` : ""}] search_facts(${JSON.stringify({ query, limit })})`);

      const logAndReturn = (output: unknown) => {
        debugLogToolCall(`search_facts[${debugKey}]`, { query, limit }, output);
        debugTraceToolCall(debugDir, debugKey, "search_facts", { query, limit }, output);
        return output;
      };

      // Real, 2026-09-20: exact-match lookup, checked once, up front -- feeds
      // BOTH the escalation gate below and the cache-replay path. Kept
      // separate from branching on it immediately (that was the real bug
      // found 2026-09-20 during live testing against a second business
      // request, governance/roadmap/dynamic-pipeline-architecture/
      // 11-build-completion-duplicate-search-queries-fix-2026-09-20.md
      // Addendum 2: the original code checked exactMatch and returned the
      // cached *executed* response BEFORE ever computing whether this same
      // concept had already crossed the block threshold via OTHER, different
      // phrasings asked in between -- so an exact repeat of the FIRST flagged
      // occurrence could bypass an already-earned block forever, replaying a
      // real result for free instead of being refused. Fixed by computing the
      // escalation count first and checking it before any cache replay.
      const exactMatch = triedQueries.find(t => t.query === query && t.limit === limit);
      const isExactDuplicate = !!exactMatch;

      // relatedPriorEntries is (d)'s substringOfPriorQuery signal -- strict,
      // excludes an exact text match to `query` itself (isRelatedQuery's
      // x!==y guard), since that case is handled by isExactDuplicate/exactMatch
      // instead.
      const relatedPriorEntries = triedQueries.filter(t => isRelatedQuery(query, t.query));
      const substringOfPriorQuery = isExactDuplicate ? true : relatedPriorEntries.length > 0;

      // Real, 2026-09-20 fix: the escalation count must treat an exact repeat
      // of an already-flagged query as part of the same concept cluster too,
      // not only genuinely different substring-related rephrasings -- adding
      // exactMatch's own flag (if any) alongside relatedPriorEntries' is what
      // makes a repeat of the FIRST flagged occurrence count toward the
      // threshold, closing the real bug described above.
      const flaggedRelatedCount =
        relatedPriorEntries.filter(t => t.outcome.kind === "executed" && t.outcome.crossModuleFlagged).length +
        (exactMatch?.outcome.kind === "executed" && exactMatch.outcome.crossModuleFlagged ? 1 : 0);

      if (flaggedRelatedCount >= crossModuleBlockAfter) {
        // Only push a new triedQueries entry for a genuinely new query being
        // blocked for the first time -- an exact duplicate that's now also
        // blocked doesn't need a second entry; the original "executed" entry
        // already serves exact-match lookups, and this count is recomputed
        // fresh every call regardless, so nothing depends on adding one here.
        if (!isExactDuplicate) {
          triedQueries.push({ query, limit, outcome: { kind: "blocked" } });
        }
        return logAndReturn({
          confident: false,
          results: [],
          blocked: true,
          blockedReason: CROSS_MODULE_BLOCKED_REASON,
          exactDuplicateOfPriorQuery: isExactDuplicate,
          substringOfPriorQuery,
        });
      }

      if (exactMatch) {
        // Real, 2026-09-20: exact-duplicate short-circuit. A genuinely
        // identical (query, limit) pair not yet escalated to a block (checked
        // above) is guaranteed to produce identical results, so it's replayed
        // from this capability's own triedQueries instead of re-paying for a
        // real embedding call and Postgres query -- whichever outcome the
        // first attempt had (a real result, or a hard block already recorded
        // on THIS exact entry), replayed the same way. alreadyRetrieved is
        // recomputed fresh against the current seenFactRefs, since it
        // legitimately changes between the first and a later identical call.
        if (exactMatch.outcome.kind === "blocked") {
          return logAndReturn({
            confident: false,
            results: [],
            blocked: true,
            blockedReason: CROSS_MODULE_BLOCKED_REASON,
            exactDuplicateOfPriorQuery: true,
            substringOfPriorQuery: true,
          });
        }
        const cached = exactMatch.outcome.response;
        return logAndReturn({
          ...cached,
          results: cached.results.map(r => ({ ...r, alreadyRetrieved: seenFactRefs.has(r.factRef) })),
          exactDuplicateOfPriorQuery: true,
          substringOfPriorQuery: true,
        });
      }

      const raw = await search(query, limit, moduleFilter, searchOpts);
      const crossModuleFlagged = !!raw.betterMatchOutsideModule;
      // Real, unchanged ordering from the pre-existing behavior: alreadyRetrieved
      // reflects facts seen in an EARLIER call, so it's computed before this
      // call's own results are added to seenFactRefs, not after.
      const mappedResults = raw.results.map(r => ({ ...r, alreadyRetrieved: seenFactRefs.has(r.factRef) }));
      for (const r of raw.results) seenFactRefs.add(r.factRef);
      triedQueries.push({ query, limit, outcome: { kind: "executed", response: raw, crossModuleFlagged } });
      return logAndReturn({
        ...raw,
        results: mappedResults,
        exactDuplicateOfPriorQuery: false,
        substringOfPriorQuery,
      });
    }
  );

  const getGraphNeighbors = ai.defineTool(
    {
      name: "get_graph_neighbors",
      description: `Given real factRefs (anchors) from ANY module, find their direct graph neighbors via cross_repo_edges (calls, API bindings, field bindings). Neighbors may belong to a different module or repo than your assigned '${moduleFilter}' capability -- that's expected, and citing one is correct whenever it genuinely supports a real claim about your own module's code (for example, a UI binding that consumes a field your module owns).`,
      inputSchema: z.object({ factRefs: z.array(z.string()) }),
    },
    async ({ factRefs }) => {
      console.log(`    [tool call, module=${moduleFilter}${repoFilter ? `, repo=${repoFilter}` : ""}] get_graph_neighbors(${JSON.stringify({ factRefs })})`);
      const db = pool();
      try {
        const result = await withToolErrorTrapping(async () => {
          const anchorNumbers = new Map(factRefs.map((ref, i) => [ref, i + 1]));
          return expandWithGraphNeighbors(db, factRefs, anchorNumbers);
        });
        debugLogToolCall(`get_graph_neighbors[${debugKey}]`, { factRefs }, result);
        debugTraceToolCall(debugDir, debugKey, "get_graph_neighbors", { factRefs }, result);
        return result;
      } finally {
        await db.end();
      }
    }
  );

  const walkCluster = ai.defineTool(
    {
      name: "walk_cluster",
      description: `Bounded multi-hop graph walk outward from one real starting factRef, in both directions, across any module or repo it really connects to -- not restricted to your '${moduleFilter}' capability. Check the returned 'truncated' flag before trusting the cluster as complete.`,
      inputSchema: z.object({ anchorFactRef: z.string(), maxDepth: z.number().optional(), maxFacts: z.number().optional() }),
    },
    async ({ anchorFactRef, maxDepth, maxFacts }) => {
      console.log(`    [tool call, module=${moduleFilter}${repoFilter ? `, repo=${repoFilter}` : ""}] walk_cluster(${JSON.stringify({ anchorFactRef, maxDepth, maxFacts })})`);
      const db = pool();
      try {
        const result = await withToolErrorTrapping(() => walkBoundedCluster(db, anchorFactRef, { maxDepth, maxFacts }));
        debugLogToolCall(`walk_cluster[${debugKey}]`, { anchorFactRef, maxDepth, maxFacts }, result);
        debugTraceToolCall(debugDir, debugKey, "walk_cluster", { anchorFactRef, maxDepth, maxFacts }, result);
        return result;
      } finally {
        await db.end();
      }
    }
  );

  return { searchFacts, getGraphNeighbors, walkCluster };
}

// Real, deliberate sibling to template.ts's renderTemplateContract -- not
// added there, to keep that file's existing "full, strict, every heading
// required" contract untouched for the one-hit agent. This one names the
// same real headings/kinds but explicitly allows a partial subset. See
// design doc §3.
//
// Real fix, 2026-09-13, found from a live, honest failure (governance/
// roadmap/graphrag/07-prompt-9-real-test-results-2026-09-13.md): the first
// live 5-capability run's 'organization' call burned its entire real
// maxTurns budget re-querying near-duplicate phrasings of a concept
// (OSKBuildingUnitInhabitantType) that structurally lives in a DIFFERENT
// module (building/core), because module-scoped search_facts never told it
// that "not found in my module" can mean "wrong capability", not "try
// again". Fixed the same two-layer way this project's own low-freedom
// experiment already proved works (mcp-direction/40-...md): an *instructed*
// stop-searching rule (below) alongside the existing *code-enforced*
// maxTurns backstop -- the backstop alone only bounds the waste, it
// doesn't prevent it.
//
// CORRECTED 2026-09-19: the "instructed stop-searching rule" from the fix
// above was a hardcoded, capability-fanout-specific BEHAVIORAL instruction
// (a literal "budget yourself at most 6 search_facts calls" sentence) baked
// directly into this function -- a real violation of this project's own
// architecture (adr-008.md §1b: template = data, persona = prompt/judgment,
// code = fail-closed validators only), and inconsistent with this file's own
// sibling, template.ts's renderTemplateContract, which injects ONLY
// per-run template facts, never behavioral judgment. A PM editing
// skill.v3.md had no visibility into, or control over, that hardcoded rule,
// and it silently duplicated (with a different, uncoordinated threshold) the
// generic search-budget policy skill.v3.md's own Workflow section already
// states. Removed here -- skill.v3.md's existing generic rule (track your
// own budget, stop at 70%, don't retry a dead sub-question 3-5 times) is
// trusted to cover capability-scoped runs too, rather than keeping a second,
// hardcoded, code-only copy of the same policy. What's left below is
// deliberately narrowed to real, per-run FACTS only (which module this call
// is scoped to, which headings/kinds the template requires, that other
// capability calls exist and cover the rest) -- the same category of
// content renderTemplateContract already injects for the one-hit agent, not
// new judgment. Not yet re-tested against a real run as of this edit --
// see governance/roadmap/graphrag/ for the next real run's findings.
// directive: optional, added 2026-09-20 (doc 23 above) -- the PM's own
// starting-point note for this platform, threaded from an explicit-scope
// "**In-scope platforms**:" entry. Injected as a plain, per-run FACT (same
// category of content this function already injects: module scope, template
// headings), not new behavioral judgment -- this task only needs the note to
// genuinely reach the model's context; teaching the persona to specially
// prioritize it as a first search is skill.v3.md's job (Phase 3, a separate,
// later build, not done here). An empty string or literal "?" (this
// project's own real, observed convention for "the PM left this blank" --
// see mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md's
// Cloud backend entry) renders NO directive line at all, rather than
// injecting the literal string "?" into the model's system prompt as if it
// were real guidance.
function renderCapabilityContract(template: ParsedTemplate, moduleName: string, maxTurns: number, directive?: string): string {
  const lines = template.sections
    .filter(s => !s.reserved)
    .map((s, i) => {
      const kindDescription = s.kind === "list" ? `list (checkable: ${s.checkable ?? false})` : s.kind;
      return `${i + 1}. "${s.heading}" -- kind: ${kindDescription}`;
    });
  const trimmedDirective = directive?.trim();
  const directiveLines =
    trimmedDirective && trimmedDirective !== "?"
      ? [`The PM's own starting-point note for this platform: "${trimmedDirective}"`, ""]
      : [];
  return [
    `## Capability-scoped synthesis: '${moduleName}' module only`,
    "",
    `This is one focused synthesis pass among several separate calls for the same business request -- each pass is scoped to a different module/capability of the codebase. Your search_facts tool this call is restricted to the '${moduleName}' module only; walk_cluster and get_graph_neighbors are not restricted and may surface real evidence in other modules -- use it when it genuinely supports a claim about '${moduleName}'. Other capability calls cover the rest of this request.`,
    "",
    // Real, 2026-09-21 (governance/roadmap/dynamic-pipeline-architecture/
    // 31-findings-citation-dropoff-and-cross-repo-gap-interaction-2026-09-21.md):
    // your own persona's own workflow rule 3 says this run's real tool-call
    // budget "is stated elsewhere in this conversation... if none is stated,
    // treat 20 as the default" -- found live, checked directly, nothing ever
    // stated it, so every run silently fell back to that default regardless
    // of what this run's real configured budget actually was. Fixed here,
    // not by changing the persona's own generic rule.
    `Your real, fixed, self-counted tool-call budget for THIS call is ${maxTurns} -- not the 20-default your workflow rules describe falling back to when no number is stated. This number IS stated, right here: it is ${maxTurns}.`,
    "",
    ...directiveLines,
    "The final document's real sections, in order, are:",
    "",
    ...lines,
    "",
    `Produce a "sections" array containing only the headings above that your own '${moduleName}'-scoped evidence actually supports.`,
  ].join("\n");
}

export interface CapabilityRunResult {
  module: string;
  // Real, added 2026-09-20 (doc 23 above) -- set only on the explicit-scope
  // path, where this capability's real identity is (repo, module). See
  // capabilityKey above for where this matters (debug filenames, meta.json
  // per-capability dictionaries).
  repo?: string;
  output: GenerationOutput;
  response: GenerateResponse<unknown>;
  toolCalls: { name: string; input: unknown }[];
  turnsUsed: number;
  // Real, 2026-09-19: true when this capability's real tool-call budget was
  // exhausted and its output came from the graceful wrap-up fallback below,
  // not a natural stop. Not yet surfaced into RunMeta/the rendered document
  // (atomic-prd-agent.ts, deliberately untouched this pass) -- console-only
  // for now.
  ranOutOfBudget: boolean;
}

// Real, deliberate FACT statement, not new behavioral judgment -- states
// what just happened (budget exhausted, no tools left) and points back at
// skill.v3.md's own already-existing "Honesty about gaps" section rather
// than inventing new guidance about what to do about it. Same category of
// content as renderCapabilityContract's own per-run facts, not a second
// hardcoded policy layer.
function wrapUpAfterBudgetExhausted(moduleName: string): string {
  return `Your real tool-call budget for the '${moduleName}' capability is now exhausted -- no further tool calls are available this call. Using only the real evidence already gathered above in this conversation, produce your final structured output now for whichever of your assigned headings that evidence actually supports. For any part of your assigned scope you don't have confident evidence for, write "[NEEDS CLARIFICATION: specific question]" -- per your own persona's honesty-about-gaps guidance, that is a valid, complete answer, not a failure.`;
}

async function runCapability(opts: {
  module: string;
  businessRequest: string;
  systemPersona: string;
  template: ParsedTemplate;
  maxTurns: number;
  // Real, 2026-09-19, TEST ONLY -- not yet a permanent decision (see
  // governance/roadmap/dynamic-pipeline-architecture/ for the real
  // discussion this comes from). Prepended BEFORE the persona, not after,
  // so it's the front of the largest possible byte-identical prefix shared
  // by every capability call this run -- the real, structural condition
  // Vertex AI's own automatic prefix caching needs, per the user's own
  // real concern about content lost as more gets appended over a long
  // conversation. Real, honest uncertainty stated plainly, not hidden:
  // this does NOT resolve whether the model still meaningfully attends to
  // this content by the time it writes its final answer, 15-20 turns and
  // many tool results later -- that's exactly what this test run exists to
  // check for real, not something this placement choice proves on its own.
  groundingDocs: string;
  // Real, opt-in FULL_DEBUG sink (see main()): when set, this capability's
  // full real system prompt, message history (every turn, tool call, and
  // tool result Genkit actually sent/received), and final structured output
  // are dumped to debugDir/llm-<module>.json. null on a normal run -- zero
  // effect, matches this file's other FULL_DEBUG-gated additions.
  debugDir: string | null;
  // Real, 2026-09-20 (governance/roadmap/dynamic-pipeline-architecture/
  // 10-build-plan-duplicate-search-queries-fix-2026-09-20.md): a real,
  // calibrated vector-distance margin (default 0.05 -- see main()'s own
  // comment on CAPABILITY_CROSS_MODULE_MARGIN for the real measured basis),
  // not a guessed number. `undefined` (unreachable via main()'s current
  // `?? 0.05` default, but still a valid type here) is what makes
  // search()'s own cross-module query not run at all -- kept as the
  // documented "fully off" state search.ts's own opts contract defines.
  crossModuleMargin: number | undefined;
  crossModuleBlockAfter: number;
  // repo/directive: optional, added 2026-09-20 (doc 23 above) -- set only on
  // the explicit-scope path. undefined preserves the exact prior behavior
  // for the vector-routing path (see makeCapabilityTools/
  // renderCapabilityContract's own comments on repoFilter/directive).
  repoFilter?: string;
  directive?: string;
}): Promise<CapabilityRunResult> {
  const seenFactRefs = new Set<string>();
  const triedQueries: TriedQuery[] = [];
  const { searchFacts, getGraphNeighbors, walkCluster } = makeCapabilityTools(
    opts.module,
    seenFactRefs,
    opts.debugDir,
    triedQueries,
    opts.crossModuleMargin,
    opts.crossModuleBlockAfter,
    opts.repoFilter
  );
  const systemPrompt = `${opts.groundingDocs}${opts.systemPersona}\n\n${renderCapabilityContract(opts.template, opts.module, opts.maxTurns, opts.directive)}`;

  let response: GenerateResponse<GenerationOutput>;
  let ranOutOfBudget = false;
  try {
    response = await ai.generate({
      model: vertexAI.model(config.vertexAI.model),
      system: systemPrompt,
      prompt: opts.businessRequest,
      tools: [searchFacts, getGraphNeighbors, walkCluster],
      output: { schema: GenerationOutputSchema },
      maxTurns: opts.maxTurns,
      config: { temperature: config.vertexAI.temperature },
      use: [retryOn429],
    });
  } catch (e) {
    // Real, deliberate graceful-degradation path, 2026-09-19 (governance/
    // roadmap/dynamic-pipeline-architecture/ -- the live incident this
    // fixes: 2 of 5 real capabilities lost their entire gathered evidence
    // and real spend this exact way in one real test run, both stuck
    // re-querying near-duplicate phrasings of the same concept past their
    // real turn budget). Previously, exceeding maxTurns threw here and the
    // whole capability's already-gathered evidence was simply discarded --
    // `main()`'s own per-capability try/catch turned that into a silent
    // drop, not a fix.
    //
    // GenerationResponseError carries the full real conversation up to (but
    // not including) the rejected turn, in `detail.response.request.
    // messages` -- confirmed directly against genkit's own source
    // (@genkit-ai/ai/src/generate.ts's GenerationResponseError class and
    // its one real throw site in generate/action.ts) before relying on it,
    // not assumed. Real, deliberate choice of WHICH history to reuse:
    // `request.messages`, not `response.messages` -- the latter also
    // includes the model's own final, un-actioned tool-request message
    // that caused the abort (no real tool result exists for it, the loop
    // aborted before executing it), which would leave the next call with a
    // real, invalid dangling tool-request in its history.
    if (!(e instanceof GenerationResponseError) || !e.detail?.response?.request?.messages) throw e;
    ranOutOfBudget = true;
    response = await ai.generate({
      model: vertexAI.model(config.vertexAI.model),
      messages: [
        ...e.detail.response.request.messages,
        { role: "user", content: [{ text: wrapUpAfterBudgetExhausted(opts.module) }] },
      ],
      output: { schema: GenerationOutputSchema },
      config: { temperature: config.vertexAI.temperature },
      use: [retryOn429],
      // Deliberately no `tools` here -- forces a real final answer instead
      // of one more search, the whole point of this fallback.
    });
  }

  const toolCalls = response.messages
    .flatMap(m => m.content)
    .filter((p): p is Extract<typeof p, { toolRequest: unknown }> => "toolRequest" in p)
    .map(p => ({ name: p.toolRequest!.name, input: p.toolRequest!.input }));
  const turnsUsed = response.messages.filter(m => m.role === "model").length;

  if (!response.output) {
    throw new Error(`[Fail-Closed] Capability call for module '${opts.module}' produced no structured output -- nothing to merge for this capability.`);
  }
  const output: GenerationOutput = response.output;

  if (opts.debugDir) {
    fs.writeFileSync(
      path.join(opts.debugDir, `llm-${sanitizeKeyForFilename(capabilityKey(opts.module, opts.repoFilter))}.json`),
      JSON.stringify(
        {
          module: opts.module,
          repo: opts.repoFilter,
          ranOutOfBudget,
          systemPromptSent: systemPrompt,
          businessRequestSent: opts.businessRequest,
          // Full real turn-by-turn conversation as Genkit returns it --
          // system/user prompt, every model turn, every tool-request and
          // tool-result message actually exchanged. When ranOutOfBudget is
          // true this already reflects the reconciled conversation (the
          // original aborted call's history plus the wrap-up turn), not
          // just the wrap-up call alone -- see the graceful-degradation
          // comment above for why request.messages (not response.messages)
          // was the real history reused.
          messages: response.messages,
          output: response.output,
          usage: response.usage,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  return { module: opts.module, repo: opts.repoFilter, output, response, toolCalls, turnsUsed, ranOutOfBudget };
}

// ---------------------------------------------------------------------------
// Step 3: merge. Per-content-kind rules per design doc §4. Always produces
// all of template.llmHeadings, in template order, so checkTemplateConformance
// (unchanged) passes on a genuinely complete final output.
// ---------------------------------------------------------------------------

function mergeOneHeading(templateSection: TemplateSection, runs: CapabilityRunResult[]): { heading: string; content: SectionContent } {
  const contributions: { module: string; content: SectionContent }[] = [];
  for (const run of runs) {
    const section = run.output.sections.find(s => s.heading === templateSection.heading);
    if (!section) continue;
    if (section.content.kind !== templateSection.kind) {
      console.error(
        `  [merge] dropping '${templateSection.heading}' from capability '${run.module}': kind mismatch (template expects ${templateSection.kind}, got ${section.content.kind})`
      );
      continue;
    }
    contributions.push({ module: run.module, content: section.content });
  }

  switch (templateSection.kind) {
    case "prose": {
      const parts = contributions
        .map(c => ({ module: c.module, content: c.content as Extract<SectionContent, { kind: "prose" }> }))
        .filter(c => c.content.text.trim().length > 0);
      const text = parts.length <= 1 ? (parts[0]?.content.text ?? "") : parts.map(c => `**${c.module}:** ${c.content.text}`).join("\n\n");
      return { heading: templateSection.heading, content: { kind: "prose", text } };
    }
    case "list": {
      const seen = new Set<string>();
      const items: string[] = [];
      for (const c of contributions) {
        const content = c.content as Extract<SectionContent, { kind: "list" }>;
        for (const item of content.items) {
          const key = item.trim();
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
      }
      return { heading: templateSection.heading, content: { kind: "list", checkable: templateSection.checkable ?? false, items } };
    }
    case "cited-list": {
      const seen = new Set<string>();
      const items: { claim: string; evidenceRefs: string[] }[] = [];
      for (const c of contributions) {
        const content = c.content as Extract<SectionContent, { kind: "cited-list" }>;
        for (const item of content.items) {
          const key = `${item.claim.trim()}::${[...item.evidenceRefs].sort().join(",")}`;
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
      }
      return { heading: templateSection.heading, content: { kind: "cited-list", items } };
    }
    case "stories": {
      const seen = new Set<string>();
      const items: { actor: string; goal: string; reason: string }[] = [];
      for (const c of contributions) {
        const content = c.content as Extract<SectionContent, { kind: "stories" }>;
        for (const item of content.items) {
          const key = `${item.actor.trim()}::${item.goal.trim()}::${item.reason.trim()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
      }
      return { heading: templateSection.heading, content: { kind: "stories", items } };
    }
    default:
      throw new Error(`[Fail-Closed] Template heading '${templateSection.heading}' has no recognized kind to merge against.`);
  }
}

export function mergeCapabilityOutputs(template: ParsedTemplate, runs: CapabilityRunResult[]): GenerationOutput {
  // Audit pass: log (don't fail) any heading a capability produced that
  // isn't one of the template's real headings -- dropped silently by
  // mergeOneHeading's lookup-by-name below otherwise, with no trace.
  const validHeadings = new Set(template.llmHeadings);
  for (const run of runs) {
    for (const section of run.output.sections) {
      if (!validHeadings.has(section.heading)) {
        console.error(`  [merge] dropping unrecognized heading '${section.heading}' from capability '${run.module}' -- not one of this template's real headings.`);
      }
    }
  }
  const sections = template.sections.filter(s => !s.reserved).map(templateSection => mergeOneHeading(templateSection, runs));
  return { sections };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now();
  const BUSINESS_REQUEST_FILE = process.env.BUSINESS_REQUEST_FILE;
  if (!BUSINESS_REQUEST_FILE) throw new Error("[Fail-Closed] BUSINESS_REQUEST_FILE environment variable is required and was not set.");
  const businessRequestPath = path.isAbsolute(BUSINESS_REQUEST_FILE) ? BUSINESS_REQUEST_FILE : path.join(PROJECT_ROOT, BUSINESS_REQUEST_FILE);
  const businessRequest = fs.readFileSync(businessRequestPath, "utf8").trim();

  // No default, deliberately -- same real reasoning atomic-prd-agent.ts's
  // own DEFAULT_PERSONA_PATH comment already records: fail loud rather than
  // silently fall back to a guess about which persona should be live.
  const PERSONA_FILE = process.env.PERSONA_FILE;
  if (!PERSONA_FILE) throw new Error("[Fail-Closed] PERSONA_FILE environment variable is required and was not set.");
  const personaPath = path.isAbsolute(PERSONA_FILE) ? PERSONA_FILE : path.join(PROJECT_ROOT, PERSONA_FILE);
  const systemPersona = fs.readFileSync(personaPath, "utf8");

  const TEMPLATE_FILE = process.env.TEMPLATE_FILE ?? DEFAULT_TEMPLATE_PATH;
  const templatePath = path.isAbsolute(TEMPLATE_FILE) ? TEMPLATE_FILE : path.join(PROJECT_ROOT, TEMPLATE_FILE);
  const template = parseTemplate(templatePath);

  // Real, 2026-09-19, TEST ONLY -- explicit opt-in via GROUNDING_DOCS=true,
  // not a permanent default (governance/roadmap/dynamic-pipeline-
  // architecture/ has the real discussion this comes from). Deliberately
  // hardcoded to exactly these two specific files -- the two identified as
  // genuinely high-value during a real review (Oskey Architecture.md
  // names real module boundaries; Oskey Personas and Authority models.md
  // states real business rules, e.g. Owner Non Resident's exclusion from
  // Mon Foyer, that no AST-extracted code fact can express) -- not a
  // generic "load any N docs" system. The broader question (dynamically
  // extracted, pipeline-time grounding, and whether the other larger
  // reference docs are worth it) is real and separate, not decided here.
  // Read once, here, not once per capability call -- pure code tidiness
  // (skips 5 redundant identical disk reads), NOT a claim that placement
  // alone guarantees the model still meaningfully attends to this content
  // by the time it writes its final answer, many turns later -- that's the
  // real, open, honestly-unresolved question this test exists to check.
  const GROUNDING_DOC_PATHS = ["governance/reference-docs/Oskey Architecture.md", "governance/reference-docs/Oskey Personas and Authority models.md"];
  let groundingDocs = "";
  if (process.env.GROUNDING_DOCS === "true") {
    const parts = GROUNDING_DOC_PATHS.map(p => `## Reference: ${p}\n\n${fs.readFileSync(path.join(PROJECT_ROOT, p), "utf8")}`);
    groundingDocs = `${parts.join("\n\n---\n\n")}\n\n---\n\n`;
    console.log(`\nGrounding docs enabled (GROUNDING_DOCS=true): ${GROUNDING_DOC_PATHS.length} file(s), ${groundingDocs.length} real char(s) prepended to every capability's system prompt.`);
  }

  const ROUTING_LIMIT = Number(process.env.CAPABILITY_ROUTING_LIMIT ?? 150);
  const MIN_FACTS = Number(process.env.CAPABILITY_MIN_FACTS ?? 3);
  const MAX_CAPABILITIES = Number(process.env.CAPABILITY_MAX_CAPABILITIES ?? 5);
  const CAPABILITY_MAX_TURNS = Number(process.env.CAPABILITY_MAX_TURNS ?? 20);

  // Real, 2026-09-20 (governance/roadmap/dynamic-pipeline-architecture/
  // 09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md,
  // 10-build-plan-duplicate-search-queries-fix-2026-09-20.md): the two new
  // configurable values behind the cross-module signal + escalation gate.
  //
  // CROSS_MODULE_MARGIN default (0.05) is real, calibrated, Phase 3, not
  // guessed -- one real embedding call against the exact known case
  // (query "OSKBuildingUnitInhabitantType", moduleFilter="features") measured:
  //   best in-module (features) distance:            0.6343
  //   best cross-module distance overall (building,   0.5115  (gap 0.1228 --
  //     a DIFFERENT fact also literally named                  a real,
  //     OSKBuildingUnitInhabitantType, fact_ref                separate
  //     c16b07ded1487ab13b10f876753c4a304738ec79):              symbol-
  //                                                               ambiguity
  //                                                               finding)
  //   the actual doc-09 target fact_ref itself         0.5489  (gap 0.0854)
  //     (core, 0634ae0ee6b3b8231c096522f7d38d1a847b4cc0):
  // 0.05 sits comfortably below the smaller (target-specific) 0.0854 gap --
  // deliberately conservative given n=1 (one query, one known case), same
  // discipline search.ts's own VECTOR_DISTANCE_CONFIDENCE_THRESHOLD followed.
  // Revisit with more real examples before trusting it far from this case.
  // CROSS_MODULE_BLOCK_AFTER's default of 2 is NOT a guess either -- it's
  // the literal number decided directly in review (10-...md, "after it
  // happens TWICE"), a repetition count rather than a distance value, so it
  // never needed this calibration step.
  const CROSS_MODULE_MARGIN = Number(process.env.CAPABILITY_CROSS_MODULE_MARGIN ?? 0.05);
  const CROSS_MODULE_BLOCK_AFTER = Number(process.env.CAPABILITY_CROSS_MODULE_BLOCK_AFTER ?? 2);

  // RUN_KIND/workflowName moved up from their original position just before
  // writeOutput -- both are real, static, run-config facts (env var or
  // business-request filename), not derived from anything Step 1/2 compute,
  // and FULL_DEBUG below needs them to name this run's debug folder before
  // any real work starts.
  const RUN_KIND = process.env.RUN_KIND === "considered" ? "considered" : "test";
  const workflowName = process.env.WORKFLOW_NAME ?? path.basename(businessRequestPath).replace(/\.[^.]+$/, "");

  // Real, opt-in, 2026-09-19 (user request, after asking where to find a
  // trace of a specific run's real Postgres queries/returns and real LLM
  // messages -- neither existed anywhere; DEBUG_TOOL_LOG only ever captured
  // the tool-call layer, and nothing captured raw SQL or the full LLM
  // conversation). One flag governs both: FULL_DEBUG=true writes every raw
  // Postgres query this run issues (search.ts + graph-traversal.ts, via the
  // db/query-trace.ts module-level sink -- covers Step 1's routing search
  // too, not just per-capability tool calls) and every capability's full
  // real system prompt + turn-by-turn message history + final output, under
  // output/agent-runs/prds/<test/>debug/<same-basename-as-this-run's-.md>/.
  //
  // The real basename (date-seq-slug) isn't known until writeOutput() picks
  // it, at the very end -- so this folder is created under a temporary,
  // timestamp-based name now (never collides, unlike guessing the sequence
  // number up front would under real concurrent-session activity, which
  // this project has directly hit before) and renamed to the real basename
  // once writeOutput() returns. Off by default -- zero effect on a normal
  // run, same discipline as DEBUG_TOOL_LOG/GROUNDING_DOCS above.
  const FULL_DEBUG = process.env.FULL_DEBUG === "true";
  let debugDir: string | null = null;
  if (FULL_DEBUG) {
    const debugParentDir = path.join(RUN_KIND === "test" ? path.join(OUTPUT_DIR, "test") : OUTPUT_DIR, "debug");
    fs.mkdirSync(debugParentDir, { recursive: true });
    const tempId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(workflowName)}`;
    debugDir = path.join(debugParentDir, tempId);
    fs.mkdirSync(debugDir, { recursive: true });
    setQueryTraceDir(debugDir);
    console.log(`\nFULL_DEBUG enabled: writing real Postgres queries + LLM messages to ${debugDir} (renamed to match this run's real output basename once known).`);
  }

  console.log(`Running capability-fanout-prd-agent against: ${businessRequestPath}`);
  console.log(`Template: ${templatePath} (${template.llmHeadings.length} LLM-authored section(s): ${template.llmHeadings.join(", ")})`);

  // Real, 2026-09-20 (doc 23 above): explicit scope and automated vector
  // routing COEXIST, with a fail-closed distinction decided directly in
  // discussion, not left for this session to decide -- no marker anywhere
  // in the business request uses the existing, unchanged vector-routing
  // path below (old-style, unstructured requests, e.g. 1a); marker present
  // but zero valid platform entries parsed fails closed (a malformed
  // explicit-scope attempt silently reverting to automated routing would
  // defeat the entire point of this feature and mask a real authoring
  // mistake); marker present with >=1 valid entries uses the new path.
  const hasExplicitScope = businessRequest.includes(IN_SCOPE_PLATFORMS_MARKER);
  let routingResultCount = 0;
  let resolvedCapabilities: ResolvedCapability[];

  if (hasExplicitScope) {
    console.log(`\n=== Step 1: explicit in-scope-platforms parsing ('${IN_SCOPE_PLATFORMS_MARKER}' found -- no vector search, no LLM call) ===`);
    const parsedEntries = parseInScopePlatforms(businessRequest);
    const validEntries = parsedEntries.filter(e => e.repos.length > 0);
    for (const e of parsedEntries) {
      if (e.repos.length === 0) {
        console.error(`  [explicit-scope] skipping platform '${e.name}': no valid <!-- repo: ... --> tag found (malformed or missing).`);
      }
    }
    if (validEntries.length === 0) {
      throw new Error(`[Fail-Closed] '${IN_SCOPE_PLATFORMS_MARKER}' marker present but zero valid platform entries parsed -- refusing to silently fall back to automated routing.`);
    }
    console.log(`  ${validEntries.length} valid platform entr${validEntries.length === 1 ? "y" : "ies"} parsed: ${validEntries.map(e => e.name).join(", ")}`);

    // Real, free, Postgres-only resolution (doc 16 §4, doc 17 Phase 2 step
    // 2) -- one batched query across every named repo, not one per entry.
    resolvedCapabilities = await resolveExplicitScopeCapabilities(validEntries, async repos => {
      if (repos.length === 0) return [];
      const db = pool();
      try {
        const result = await db.query<{ repo: string; module: string }>("SELECT DISTINCT repo, module FROM facts WHERE repo = ANY($1::text[])", [repos]);
        return result.rows;
      } finally {
        await db.end();
      }
    });
    routingResultCount = resolvedCapabilities.length;
    console.log(`  ${resolvedCapabilities.length} real (repo, module) capabilit${resolvedCapabilities.length === 1 ? "y" : "ies"} resolved:`);
    for (const c of resolvedCapabilities) {
      const directiveNote = c.directive && c.directive !== "?" ? ` (directive: "${c.directive}")` : "";
      console.log(`    ${capabilityKey(c.module, c.repo)}${directiveNote}`);
    }
    if (resolvedCapabilities.length === 0) {
      throw new Error("[Fail-Closed] Explicit in-scope-platforms parsed, but resolved to zero real (repo, module) pairs across every named repo -- nothing to synthesize.");
    }
  } else {
    console.log(`\n=== Step 1: routing (search_facts, limit=${ROUTING_LIMIT}, no module filter, no LLM call) ===`);
    const { routing, capabilities } = await routeCapabilities(businessRequest, { limit: ROUTING_LIMIT, minFacts: MIN_FACTS, maxCapabilities: MAX_CAPABILITIES });
    console.log(`  ${routing.length} real fact(s) in routing pool, ${capabilities.length} candidate capabilit${capabilities.length === 1 ? "y" : "ies"} (min ${MIN_FACTS} facts/module, max ${MAX_CAPABILITIES} modules):`);
    for (const c of capabilities) console.log(`    ${c.module}: ${c.factCount} fact(s) in pool, best distance ${c.bestDistance.toFixed(4)}`);
    if (capabilities.length === 0) {
      throw new Error("[Fail-Closed] Routing pass found no module with at least CAPABILITY_MIN_FACTS real facts in the pool -- nothing to synthesize.");
    }
    routingResultCount = routing.length;
    resolvedCapabilities = capabilities.map(c => ({ module: c.module }));
  }

  console.log(`\n=== Step 2: per-capability synthesis (${resolvedCapabilities.length} sequential call(s), maxTurns=${CAPABILITY_MAX_TURNS} each) ===`);
  const runs: CapabilityRunResult[] = [];
  const failedCapabilities: string[] = [];
  for (const c of resolvedCapabilities) {
    const label = capabilityKey(c.module, c.repo);
    console.log(`\n  --- capability: ${label} ---`);
    // Real hardening, 2026-09-13, found from a live failure (governance/
    // roadmap/graphrag/07-prompt-9-real-test-results-2026-09-13.md): one
    // capability exceeding its real maxTurns budget used to crash the whole
    // run, discarding every other capability's already-paid-for evidence
    // and real spend along with it. A capability that genuinely can't
    // finish is a real, honest partial result, not a reason to lose the
    // rest of a real, already-purchased run -- logged plainly (not hidden)
    // via failedCapabilities below, same "never silently swallow, always
    // surface" discipline as withToolErrorTrapping's own real error path.
    //
    // Real, 2026-09-19: the maxTurns-exceeded case specifically no longer
    // reaches this catch at all in the common case -- runCapability's own
    // graceful wrap-up fallback handles it first (see that function's own
    // comment). This outer try/catch remains the real, last-resort backstop
    // for anything genuinely unrecoverable (the wrap-up call itself failing,
    // a real infrastructure error, etc.), not the primary handler anymore.
    try {
      const run = await runCapability({
        module: c.module,
        repoFilter: c.repo,
        directive: c.directive,
        businessRequest,
        systemPersona,
        template,
        maxTurns: CAPABILITY_MAX_TURNS,
        groundingDocs,
        debugDir,
        crossModuleMargin: CROSS_MODULE_MARGIN,
        crossModuleBlockAfter: CROSS_MODULE_BLOCK_AFTER,
      });
      const budgetNote = run.ranOutOfBudget ? " [wrapped up early: real tool-call budget exhausted]" : "";
      console.log(`  ${run.toolCalls.length} real tool call(s), ${run.turnsUsed} turn(s), ${run.output.sections.length} section(s) produced: ${run.output.sections.map(s => s.heading).join(", ") || "(none)"}${budgetNote}`);
      runs.push(run);
    } catch (e) {
      console.error(`  [capability FAILED, skipped] '${label}': ${e instanceof Error ? e.message : String(e)}`);
      failedCapabilities.push(label);
    }
  }
  if (runs.length === 0) {
    throw new Error("[Fail-Closed] Every capability call failed -- nothing real to merge or write.");
  }

  console.log(`\n=== Step 3: merge ===`);
  let generated = mergeCapabilityOutputs(template, runs);
  for (const s of generated.sections) {
    const count = s.content.kind === "prose" ? (s.content.text ? 1 : 0) : s.content.items.length;
    console.log(`  '${s.heading}' (${s.content.kind}): ${count} item(s) after merge`);
  }

  // Two mandatory, code-enforced, fail-closed checks -- unchanged
  // (validators.ts), run on the merged output exactly as the one-hit agent
  // runs them on its single output. checkFabrication returns a new,
  // canonicalized output (real fix, 2026-09-17, see validators.ts) --
  // reassigned here so assembleDocument below sees the real, verbatim
  // fact_ref strings, not whatever whitespace-collapsed form a capability
  // call happened to cite.
  const realFactRefs = new Set<string>();
  for (const run of runs) for (const ref of extractRealFactRefs(run.response)) realFactRefs.add(ref);

  generated = checkFabrication(generated, realFactRefs);
  checkTemplateConformance(generated, template.llmHeadings);
  console.log(`\n=== Both mandatory validators passed (${realFactRefs.size} real fact_ref(s) seen across all capability calls) ===`);

  const toolCallCounts: Record<string, number> = {};
  const perCapabilityToolCalls: Record<string, Record<string, number>> = {};
  const perCapabilityTurnsUsed: Record<string, number> = {};
  let turnsUsed = 0;
  for (const run of runs) {
    const key = capabilityKey(run.module, run.repo);
    perCapabilityTurnsUsed[key] = run.turnsUsed;
    turnsUsed += run.turnsUsed;
    const counts: Record<string, number> = {};
    for (const call of run.toolCalls) {
      counts[call.name] = (counts[call.name] ?? 0) + 1;
      toolCallCounts[call.name] = (toolCallCounts[call.name] ?? 0) + 1;
    }
    perCapabilityToolCalls[key] = counts;
  }

  const snapshotFreshness = await getSnapshotFreshness(realFactRefs);
  const { factRepoMap, factDisplayMap } = await getFactMaps(realFactRefs);
  const durationMs = Date.now() - startedAt;
  console.log(`\n=== Real run duration: ${formatDuration(durationMs)} ===`);

  // Real, linear token-usage summation across capability calls -- valid
  // because computeApproxCost's own formula (pricing.ts) is linear in each
  // token count. One real, live pricing lookup for the whole run, same as
  // the one-hit agent.
  const aggregateTokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, thoughtsTokens: 0, cachedContentTokens: 0 };
  for (const run of runs) {
    const u = (run.response.usage ?? {}) as TokenUsage;
    aggregateTokenUsage.inputTokens = (aggregateTokenUsage.inputTokens ?? 0) + (u.inputTokens ?? 0);
    aggregateTokenUsage.outputTokens = (aggregateTokenUsage.outputTokens ?? 0) + (u.outputTokens ?? 0);
    aggregateTokenUsage.thoughtsTokens = (aggregateTokenUsage.thoughtsTokens ?? 0) + (u.thoughtsTokens ?? 0);
    aggregateTokenUsage.cachedContentTokens = (aggregateTokenUsage.cachedContentTokens ?? 0) + (u.cachedContentTokens ?? 0);
  }
  const pricing = await fetchVertexAiPricing(config.vertexAI.pricingLabel, config.vertexAI.location).catch(() => null);
  const approxCostUsd = pricing ? computeApproxCost(aggregateTokenUsage, pricing) : null;
  console.log(`\n=== Real approx. cost (sum across ${runs.length} capability call(s)): ${approxCostUsd === null ? "unavailable" : `$${approxCostUsd.toFixed(4)}`} ===`);

  const meta: RunMeta = {
    workflowName,
    runKind: RUN_KIND,
    persona: "capability-fanout-prd-agent",
    personaPath: path.relative(PROJECT_ROOT, personaPath),
    model: config.vertexAI.model,
    projectId: config.vertexAI.projectId,
    location: config.vertexAI.location,
    toolCallCounts,
    maxTurns: CAPABILITY_MAX_TURNS,
    turnsUsed,
    snapshotFreshness,
    factRepoMap,
    factDisplayMap,
    durationMs,
    generatedAt: new Date().toISOString(),
    usage: runs.map(r => r.response.usage),
    tokenUsage: aggregateTokenUsage,
    approxCostUsd,
    pricingEffectiveTime: pricing?.pricingEffectiveTime ?? null,
    capabilityFanout: {
      routingResultCount,
      candidateModules: resolvedCapabilities.map(c => capabilityKey(c.module, c.repo)),
      capabilitiesRun: runs.map(r => capabilityKey(r.module, r.repo)),
      failedCapabilities,
      perCapabilityToolCalls,
      perCapabilityTurnsUsed,
      routingMode: hasExplicitScope ? "explicit" : "vector",
    },
  };

  const markdown = assembleDocument({ workflowName, template, generated, businessRequest, realFactRefs, meta });
  const { mdPath, metaPath } = await writeOutput({ workflowName, runKind: RUN_KIND, markdown, meta });

  console.log(`\nWrote ${mdPath}`);
  console.log(`Wrote ${metaPath}`);

  // Real basename is only known now (writeOutput() just picked it) -- move
  // the FULL_DEBUG folder from its temporary timestamp-based name to the
  // real one, so a reader can go straight from "which .md am I looking at"
  // to "its debug/ folder", per the real ask this whole feature exists for.
  if (FULL_DEBUG && debugDir) {
    setQueryTraceDir(null);
    const finalBaseName = path.basename(mdPath, ".md");
    const finalDebugDir = path.join(path.dirname(debugDir), finalBaseName);
    fs.renameSync(debugDir, finalDebugDir);
    console.log(`Wrote full debug trace to ${finalDebugDir}`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

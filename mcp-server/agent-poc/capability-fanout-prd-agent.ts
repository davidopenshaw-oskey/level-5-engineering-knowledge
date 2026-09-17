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
// assembleDocument/writeOutput/RunMeta/getSnapshotFreshness/getFactRepoMap/
// pool/retryOn429/withToolErrorTrapping/debugLogToolCall (all exported from
// atomic-prd-agent.ts for this reuse) and checkFabrication/
// checkTemplateConformance/extractRealFactIds (validators.ts, untouched).
// The only genuinely new logic here is the routing pass, the per-capability
// tool scoping, and the merge step.
import "dotenv/config";
import fs from "fs";
import path from "path";
import type { GenerateResponse } from "genkit";
import { z } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { search, type SearchResult } from "../db/search";
import { expandWithGraphNeighbors, walkBoundedCluster } from "../db/graph-traversal";
import { GenerationOutputSchema, type GenerationOutput, type SectionContent } from "./section-content";
import { parseTemplate, type ParsedTemplate, type TemplateSection } from "./template";
import { extractRealFactIds, checkFabrication, checkTemplateConformance } from "./validators";
import { fetchVertexAiPricing, computeApproxCost, type TokenUsage } from "./pricing";
import {
  ai,
  config,
  PROJECT_ROOT,
  DEFAULT_TEMPLATE_PATH,
  pool,
  assembleDocument,
  writeOutput,
  getSnapshotFreshness,
  getFactRepoMap,
  formatDuration,
  retryOn429,
  withToolErrorTrapping,
  debugLogToolCall,
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
// Step 2: per-capability synthesis. Each capability gets its own real
// conversation: its own module-scoped search_facts, its own fresh
// seenFactIds dedup set, its own smaller MAX_TURNS. walk_cluster/
// get_graph_neighbors are deliberately NOT module-scoped -- see design doc
// §3 for why (the real Q1a cross-module FIELD_BINDING case this whole task
// exists to test would be unreachable otherwise).
// ---------------------------------------------------------------------------

function makeCapabilityTools(moduleFilter: string, seenFactIds: Set<string>) {
  const searchFacts = ai.defineTool(
    {
      name: "search_facts",
      description: `Search the codebase's fact index for real, code-derived evidence relevant to this business request -- restricted to the '${moduleFilter}' module/capability only. This is one focused synthesis pass among several separate calls, each scoped to a different module of the same overall request; other modules are covered by other calls, not this one. Returns ranked candidate facts with real fact_ids, each carrying alreadyRetrieved: true if you were already given this exact fact_id earlier in this conversation -- if so, don't search again for the same concept; call walk_cluster or get_graph_neighbors on it instead.`,
      inputSchema: z.object({ query: z.string(), limit: z.number().optional() }),
    },
    async ({ query, limit }) => {
      console.log(`    [tool call, module=${moduleFilter}] search_facts(${JSON.stringify({ query, limit })})`);
      const raw = await search(query, limit, moduleFilter);
      const result = {
        ...raw,
        results: raw.results.map(r => ({ ...r, alreadyRetrieved: seenFactIds.has(r.factId) })),
      };
      for (const r of raw.results) seenFactIds.add(r.factId);
      debugLogToolCall(`search_facts[${moduleFilter}]`, { query, limit }, result);
      return result;
    }
  );

  const getGraphNeighbors = ai.defineTool(
    {
      name: "get_graph_neighbors",
      description: `Given real fact_ids (anchors) from ANY module, find their direct graph neighbors via cross_repo_edges (calls, API bindings, field bindings). Neighbors may belong to a different module or repo than your assigned '${moduleFilter}' capability -- that's expected, and citing one is correct whenever it genuinely supports a real claim about your own module's code (for example, a UI binding that consumes a field your module owns).`,
      inputSchema: z.object({ factIds: z.array(z.string()) }),
    },
    async ({ factIds }) => {
      console.log(`    [tool call, module=${moduleFilter}] get_graph_neighbors(${JSON.stringify({ factIds })})`);
      const db = pool();
      try {
        const result = await withToolErrorTrapping(async () => {
          const anchorNumbers = new Map(factIds.map((id, i) => [id, i + 1]));
          return expandWithGraphNeighbors(db, factIds, anchorNumbers);
        });
        debugLogToolCall(`get_graph_neighbors[${moduleFilter}]`, { factIds }, result);
        return result;
      } finally {
        await db.end();
      }
    }
  );

  const walkCluster = ai.defineTool(
    {
      name: "walk_cluster",
      description: `Bounded multi-hop graph walk outward from one real starting fact_id, in both directions, across any module or repo it really connects to -- not restricted to your '${moduleFilter}' capability. Check the returned 'truncated' flag before trusting the cluster as complete.`,
      inputSchema: z.object({ anchorFactId: z.string(), maxDepth: z.number().optional(), maxFacts: z.number().optional() }),
    },
    async ({ anchorFactId, maxDepth, maxFacts }) => {
      console.log(`    [tool call, module=${moduleFilter}] walk_cluster(${JSON.stringify({ anchorFactId, maxDepth, maxFacts })})`);
      const db = pool();
      try {
        const result = await withToolErrorTrapping(() => walkBoundedCluster(db, anchorFactId, { maxDepth, maxFacts }));
        debugLogToolCall(`walk_cluster[${moduleFilter}]`, { anchorFactId, maxDepth, maxFacts }, result);
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
function renderCapabilityContract(template: ParsedTemplate, moduleName: string): string {
  const lines = template.sections
    .filter(s => !s.reserved)
    .map((s, i) => {
      const kindDescription = s.kind === "list" ? `list (checkable: ${s.checkable ?? false})` : s.kind;
      return `${i + 1}. "${s.heading}" -- kind: ${kindDescription}`;
    });
  return [
    `## Capability-scoped synthesis: '${moduleName}' module only`,
    "",
    `This is one focused synthesis pass among several separate calls for the same business request -- each pass is scoped to a different module/capability of the codebase. Your search_facts tool this call is restricted to the '${moduleName}' module only; walk_cluster and get_graph_neighbors are not restricted and may surface real evidence in other modules -- use it when it genuinely supports a claim about '${moduleName}'.`,
    "",
    `**Bounded search effort, real and enforced by you, not just a suggestion**: budget yourself at most 6 search_facts calls before deciding you have enough to work with. If a specific concept you're looking for (a type name, a field, a service) doesn't surface within your first 2-3 differently-worded search_facts tries, it most likely belongs to a different module than '${moduleName}' -- a separate capability call is covering it. Stop searching for it and move on rather than retrying more phrasings of the same query; producing a smaller, honest, well-evidenced partial result for '${moduleName}' is correct and expected, not a shortfall.`,
    "",
    "The final document's real sections, in order, are:",
    "",
    ...lines,
    "",
    `Produce a "sections" array containing ONLY the headings above that your own '${moduleName}'-scoped evidence actually supports with a real, grounded claim -- omit any heading you have nothing real to contribute for this module. Do not invent, rename, or reorder any heading you do include. It is correct and expected for this call to produce fewer than all of the headings above; other capability calls cover the rest.`,
  ].join("\n");
}

export interface CapabilityRunResult {
  module: string;
  output: GenerationOutput;
  response: GenerateResponse<unknown>;
  toolCalls: { name: string; input: unknown }[];
  turnsUsed: number;
}

async function runCapability(opts: {
  module: string;
  businessRequest: string;
  systemPersona: string;
  template: ParsedTemplate;
  maxTurns: number;
}): Promise<CapabilityRunResult> {
  const seenFactIds = new Set<string>();
  const { searchFacts, getGraphNeighbors, walkCluster } = makeCapabilityTools(opts.module, seenFactIds);
  const systemPrompt = `${opts.systemPersona}\n\n${renderCapabilityContract(opts.template, opts.module)}`;

  const response = await ai.generate({
    model: vertexAI.model(config.vertexAI.model),
    system: systemPrompt,
    prompt: opts.businessRequest,
    tools: [searchFacts, getGraphNeighbors, walkCluster],
    output: { schema: GenerationOutputSchema },
    maxTurns: opts.maxTurns,
    config: { temperature: config.vertexAI.temperature },
    use: [retryOn429],
  });

  const toolCalls = response.messages
    .flatMap(m => m.content)
    .filter((p): p is Extract<typeof p, { toolRequest: unknown }> => "toolRequest" in p)
    .map(p => ({ name: p.toolRequest!.name, input: p.toolRequest!.input }));
  const turnsUsed = response.messages.filter(m => m.role === "model").length;

  if (!response.output) {
    throw new Error(`[Fail-Closed] Capability call for module '${opts.module}' produced no structured output -- nothing to merge for this capability.`);
  }
  const output: GenerationOutput = response.output;
  return { module: opts.module, output, response, toolCalls, turnsUsed };
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
      const items: { claim: string; evidenceIds: string[] }[] = [];
      for (const c of contributions) {
        const content = c.content as Extract<SectionContent, { kind: "cited-list" }>;
        for (const item of content.items) {
          const key = `${item.claim.trim()}::${[...item.evidenceIds].sort().join(",")}`;
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
      }
      return { heading: templateSection.heading, content: { kind: "cited-list", items } };
    }
    case "user-stories": {
      const seen = new Set<string>();
      const items: { actor: string; goal: string; reason: string }[] = [];
      for (const c of contributions) {
        const content = c.content as Extract<SectionContent, { kind: "user-stories" }>;
        for (const item of content.items) {
          const key = `${item.actor.trim()}::${item.goal.trim()}::${item.reason.trim()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
      }
      return { heading: templateSection.heading, content: { kind: "user-stories", items } };
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

  const ROUTING_LIMIT = Number(process.env.CAPABILITY_ROUTING_LIMIT ?? 150);
  const MIN_FACTS = Number(process.env.CAPABILITY_MIN_FACTS ?? 3);
  const MAX_CAPABILITIES = Number(process.env.CAPABILITY_MAX_CAPABILITIES ?? 5);
  const CAPABILITY_MAX_TURNS = Number(process.env.CAPABILITY_MAX_TURNS ?? 20);

  console.log(`Running capability-fanout-prd-agent against: ${businessRequestPath}`);
  console.log(`Template: ${templatePath} (${template.llmHeadings.length} LLM-authored section(s): ${template.llmHeadings.join(", ")})`);

  console.log(`\n=== Step 1: routing (search_facts, limit=${ROUTING_LIMIT}, no module filter, no LLM call) ===`);
  const { routing, capabilities } = await routeCapabilities(businessRequest, { limit: ROUTING_LIMIT, minFacts: MIN_FACTS, maxCapabilities: MAX_CAPABILITIES });
  console.log(`  ${routing.length} real fact(s) in routing pool, ${capabilities.length} candidate capabilit${capabilities.length === 1 ? "y" : "ies"} (min ${MIN_FACTS} facts/module, max ${MAX_CAPABILITIES} modules):`);
  for (const c of capabilities) console.log(`    ${c.module}: ${c.factCount} fact(s) in pool, best distance ${c.bestDistance.toFixed(4)}`);
  if (capabilities.length === 0) {
    throw new Error("[Fail-Closed] Routing pass found no module with at least CAPABILITY_MIN_FACTS real facts in the pool -- nothing to synthesize.");
  }

  console.log(`\n=== Step 2: per-capability synthesis (${capabilities.length} sequential call(s), maxTurns=${CAPABILITY_MAX_TURNS} each) ===`);
  const runs: CapabilityRunResult[] = [];
  const failedCapabilities: string[] = [];
  for (const c of capabilities) {
    console.log(`\n  --- capability: ${c.module} ---`);
    // Real hardening, 2026-09-13, found from a live failure (governance/
    // roadmap/graphrag/07-prompt-9-real-test-results-2026-09-13.md): one
    // capability exceeding its real maxTurns budget used to crash the whole
    // run, discarding every other capability's already-paid-for evidence
    // and real spend along with it. A capability that genuinely can't
    // finish is a real, honest partial result, not a reason to lose the
    // rest of a real, already-purchased run -- logged plainly (not hidden)
    // via failedCapabilities below, same "never silently swallow, always
    // surface" discipline as withToolErrorTrapping's own real error path.
    try {
      const run = await runCapability({ module: c.module, businessRequest, systemPersona, template, maxTurns: CAPABILITY_MAX_TURNS });
      console.log(`  ${run.toolCalls.length} real tool call(s), ${run.turnsUsed} turn(s), ${run.output.sections.length} section(s) produced: ${run.output.sections.map(s => s.heading).join(", ") || "(none)"}`);
      runs.push(run);
    } catch (e) {
      console.error(`  [capability FAILED, skipped] '${c.module}': ${e instanceof Error ? e.message : String(e)}`);
      failedCapabilities.push(c.module);
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
  // fact_id strings, not whatever whitespace-collapsed form a capability
  // call happened to cite.
  const realFactIds = new Set<string>();
  for (const run of runs) for (const id of extractRealFactIds(run.response)) realFactIds.add(id);

  generated = checkFabrication(generated, realFactIds);
  checkTemplateConformance(generated, template.llmHeadings);
  console.log(`\n=== Both mandatory validators passed (${realFactIds.size} real fact_id(s) seen across all capability calls) ===`);

  const toolCallCounts: Record<string, number> = {};
  const perCapabilityToolCalls: Record<string, Record<string, number>> = {};
  const perCapabilityTurnsUsed: Record<string, number> = {};
  let turnsUsed = 0;
  for (const run of runs) {
    perCapabilityTurnsUsed[run.module] = run.turnsUsed;
    turnsUsed += run.turnsUsed;
    const counts: Record<string, number> = {};
    for (const call of run.toolCalls) {
      counts[call.name] = (counts[call.name] ?? 0) + 1;
      toolCallCounts[call.name] = (toolCallCounts[call.name] ?? 0) + 1;
    }
    perCapabilityToolCalls[run.module] = counts;
  }

  const RUN_KIND = process.env.RUN_KIND === "considered" ? "considered" : "test";
  const workflowName = process.env.WORKFLOW_NAME ?? path.basename(businessRequestPath).replace(/\.[^.]+$/, "");
  const snapshotFreshness = await getSnapshotFreshness(realFactIds);
  const factRepoMap = await getFactRepoMap(realFactIds);
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
    durationMs,
    generatedAt: new Date().toISOString(),
    usage: runs.map(r => r.response.usage),
    tokenUsage: aggregateTokenUsage,
    approxCostUsd,
    pricingEffectiveTime: pricing?.pricingEffectiveTime ?? null,
    capabilityFanout: {
      routingResultCount: routing.length,
      candidateModules: capabilities.map(c => c.module),
      capabilitiesRun: runs.map(r => r.module),
      failedCapabilities,
      perCapabilityToolCalls,
      perCapabilityTurnsUsed,
    },
  };

  const markdown = assembleDocument({ workflowName, template, generated, businessRequest, realFactIds, meta });
  const { mdPath, metaPath } = await writeOutput({ workflowName, runKind: RUN_KIND, markdown, meta });

  console.log(`\nWrote ${mdPath}`);
  console.log(`Wrote ${metaPath}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

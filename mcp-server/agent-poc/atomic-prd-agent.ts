// Standalone Genkit script (not the MCP server itself) -- calls the same
// three tool functions directly, in process. Vertex AI project/region/
// model/temperature come from config/config.ts (real values as of
// 2026-09-06 match _shared/technical-proposal.ts's own separate,
// independently-configured copy, by coincidence not by shared config --
// see config/config.json's own note for why mcp-server/ deliberately does
// not reuse config/llm-providers.json).
//
// Migrated 2026-09-06 off a hardcoded, PRD-specific OUTPUT_SCHEMA onto the
// generic SectionContent system (governance/adrs/adr-008.md; build steps in
// governance/roadmap/mcp-direction/10-sectioncontent-implementation-
// tasklist.md). A new document type is now a new template + persona file --
// this script itself does not change.
//
// Persona (process instructions + which SectionContent kind fills each
// template heading) lives in governance/roadmap/mcp-direction/
// atomic-prd-agent-persona.md, read here as a plain file.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { Pool } from "pg";
import { z } from "genkit";
import { search } from "../db/search";
import { expandWithGraphNeighbors, walkBoundedCluster } from "../db/graph-traversal";
import { GenerationOutputSchema, renderSectionContent, type GenerationOutput } from "./section-content";
import { parseTemplate, renderTemplateContract, type ParsedTemplate } from "./template";
import { extractRealFactIds, checkFabrication, checkTemplateConformance } from "./validators";
import { fetchVertexAiPricing, computeApproxCost, type TokenUsage } from "./pricing";
import { loadMcpServerConfig } from "../config";

const PROJECT_ROOT = process.cwd();
const config = loadMcpServerConfig();
const DEFAULT_PERSONA_PATH = path.join(PROJECT_ROOT, "governance/roadmap/mcp-direction/atomic-prd-agent-persona.md");
const DEFAULT_TEMPLATE_PATH = path.join(PROJECT_ROOT, "mcp-server/agent-poc/templates/atomic-prd.template.md");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output", "agent-runs", "prds");

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

const ai = genkit({
  plugins: [vertexAI({ projectId: config.vertexAI.projectId, location: config.vertexAI.location })],
});

const searchFacts = ai.defineTool(
  {
    name: "search_facts",
    description: "Search the codebase's fact index for real, code-derived evidence relevant to a question. Returns ranked candidate facts with real fact_ids.",
    inputSchema: z.object({ query: z.string(), limit: z.number().optional() }),
  },
  async ({ query, limit }) => {
    console.log(`  [tool call] search_facts(${JSON.stringify({ query, limit })})`);
    return search(query, limit);
  }
);

const getGraphNeighbors = ai.defineTool(
  {
    name: "get_graph_neighbors",
    description: "Given real fact_ids (anchors), find their direct graph neighbors via cross_repo_edges (calls, API bindings, field bindings).",
    inputSchema: z.object({ factIds: z.array(z.string()) }),
  },
  async ({ factIds }) => {
    console.log(`  [tool call] get_graph_neighbors(${JSON.stringify({ factIds })})`);
    const db = pool();
    try {
      const anchorNumbers = new Map(factIds.map((id, i) => [id, i + 1]));
      return await expandWithGraphNeighbors(db, factIds, anchorNumbers);
    } finally {
      await db.end();
    }
  }
);

const walkCluster = ai.defineTool(
  {
    name: "walk_cluster",
    description: "Bounded multi-hop graph walk outward from one real starting fact_id. Check the returned 'truncated' flag before trusting the cluster as complete.",
    inputSchema: z.object({ anchorFactId: z.string(), maxDepth: z.number().optional(), maxFacts: z.number().optional() }),
  },
  async ({ anchorFactId, maxDepth, maxFacts }) => {
    console.log(`  [tool call] walk_cluster(${JSON.stringify({ anchorFactId, maxDepth, maxFacts })})`);
    const db = pool();
    try {
      return await walkBoundedCluster(db, anchorFactId, { maxDepth, maxFacts });
    } finally {
      await db.end();
    }
  }
);

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface SnapshotFreshnessRow {
  repo: string;
  commitSha: string;
  extractedAt: string;
}

// Same real query pattern generate-atomic-prd.ts's own renderSnapshotFreshness
// uses -- reimplemented here (not imported) per this pipeline's existing
// per-script isolation convention. Real, structural change from the pre-
// migration version: driven by realFactIds (independently derived from this
// run's actual tool-call results, validators.ts) rather than the model's own
// self-reported evidenceUsed field -- one fewer thing that depends on the
// model reporting itself correctly. Returns structured rows, not prose --
// the JSON sidecar (adr-008.md's audit-trail hook) needs real structured
// data, not just markdown text to re-parse later.
async function getSnapshotFreshness(realFactIds: Set<string>): Promise<SnapshotFreshnessRow[]> {
  if (realFactIds.size === 0) return [];
  const db = pool();
  try {
    const factRows = await db.query<{ repo: string }>(`SELECT DISTINCT repo FROM facts WHERE fact_id = ANY($1::text[])`, [[...realFactIds]]);
    const repos = factRows.rows.map(r => r.repo);
    if (repos.length === 0) return [];
    const runRows = await db.query<{ repo: string; commit_sha: string; extracted_at: Date }>(
      `SELECT repo, commit_sha, extracted_at FROM extraction_runs WHERE is_current = true AND repo = ANY($1::text[])`,
      [repos]
    );
    const byRepo = new Map(runRows.rows.map(r => [r.repo, r]));
    return repos.map(repo => {
      const row = byRepo.get(repo);
      if (!row) throw new Error(`[Fail-Closed] Evidence cites repo '${repo}' but no current extraction_runs row exists for it.`);
      return { repo: row.repo, commitSha: row.commit_sha, extractedAt: row.extracted_at.toISOString().slice(0, 10) };
    });
  } finally {
    await db.end();
  }
}

// Real, separate query, 2026-09-07 (user request): getSnapshotFreshness
// above only returns the DISTINCT repos touched, not which repo each
// individual fact_id belongs to -- needed to group the Audit Trail (Step
// 15) by repo so a cloud/Firebase dev and an Angular dev don't have to
// scan one flat 400+ item list to find their own repo's facts. Real DB
// lookup, not inferred from the fact_id's file-path prefix -- this
// project's own "audit live state, not files" discipline applies to
// grouping logic just as much as to freshness checks.
async function getFactRepoMap(realFactIds: Set<string>): Promise<Record<string, string>> {
  if (realFactIds.size === 0) return {};
  const db = pool();
  try {
    const rows = await db.query<{ fact_id: string; repo: string }>(`SELECT fact_id, repo FROM facts WHERE fact_id = ANY($1::text[])`, [[...realFactIds]]);
    const map: Record<string, string> = {};
    for (const row of rows.rows) map[row.fact_id] = row.repo;
    return map;
  } finally {
    await db.end();
  }
}

// Real, separate reference scheme from fact citations, 2026-09-06 (user
// request + real tradeoff decided together): repos get "R1, R2..." rather
// than sharing the "#1, #2..." sequence facts use. Deliberately not one
// shared sequence -- if repos and facts shared numbering, the same real
// business question could have its facts start at #2 in one run (1 repo
// touched) or #4 in another (3 repos touched), purely from how many repos
// happened to be involved, not anything about the facts themselves. "R"
// also makes the reference type obvious without needing to look it up.
// Alphabetical by repo name -- deterministic, and repos have no natural
// "first cited in body" order the way facts do (they only ever appear in
// one place, the Snapshot Freshness line itself).
function buildRepoNumbering(rows: SnapshotFreshnessRow[]): Map<string, number> {
  const sorted = [...rows].map(r => r.repo).sort();
  return new Map(sorted.map((repo, i) => [repo, i + 1]));
}

interface RunMeta {
  workflowName: string;
  runKind: "test" | "considered";
  persona: string;
  personaPath: string;
  model: string;
  projectId: string;
  location: string;
  toolCallCounts: Record<string, number>;
  maxTurns: number;
  turnsUsed: number;
  snapshotFreshness: SnapshotFreshnessRow[];
  factRepoMap: Record<string, string>;
  generatedAt: string;
  durationMs: number;
  usage: unknown;
  tokenUsage: TokenUsage;
  // null, not 0, when the real Catalog API lookup failed or found no
  // confident single SKU match -- a real "we don't know" is honest, a
  // silent $0.00 would not be.
  approxCostUsd: number | null;
  // Real grounding for the cost citation, 2026-09-06 (user request): the
  // Catalog API's own pricingEffectiveTime, not a fetch timestamp -- see
  // pricing.ts. null exactly when approxCostUsd is null (no pricing found
  // at all).
  pricingEffectiveTime: string | null;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

// Real, document-wide citation numbering, added 2026-09-06 (user feedback:
// raw fact_ids repeated inline made a document hard for a human reviewer
// to scan). Same fact_id always gets the same number, wherever it's cited
// -- assigned in the order claims actually appear reading top to bottom
// (real, human-natural order), not tool-call order. Any fact_id the agent
// gathered but never cited in a claim still gets a number (real, complete
// audit trail) -- just appended after the cited ones, in the order
// extractRealFactIds happened to collect them.
function buildCitationNumbering(generated: GenerationOutput, realFactIds: Set<string>): Map<string, number> {
  const numbering = new Map<string, number>();
  let next = 1;
  for (const section of generated.sections) {
    if (section.content.kind !== "cited-list") continue;
    for (const item of section.content.items) {
      for (const id of item.evidenceIds) {
        if (!numbering.has(id)) numbering.set(id, next++);
      }
    }
  }
  for (const id of realFactIds) {
    if (!numbering.has(id)) numbering.set(id, next++);
  }
  return numbering;
}

// Step 7's reserved-heading registry -- real content a persona is never
// asked to author. "metadata" renders the same bolded key/value block the
// pre-migration document had, just as ordinary section content now rather
// than a special top-of-document block; "business-request" and
// "evidence-used" are real, code-computed content, not LLM output.
function renderReservedContent(
  name: string,
  ctx: {
    businessRequest: string;
    realFactIds: Set<string>;
    meta: RunMeta;
    numbering: Map<string, number>;
    repoNumbering: Map<string, number>;
    citedNumbers?: Set<number>;
  }
): string {
  switch (name) {
    case "business-request":
      return ctx.businessRequest;
    case "evidence-used": {
      // Real restructure, 2026-09-06 (user request): two subsections, real
      // separate reference schemes -- Repos (R1, R2...) and Fact-Ids
      // (#1, #2... unchanged from what was already built). Kept as one
      // "Evidence Used" heading (the template still only declares one
      // reserved section here), just with real internal structure now.
      const repoEntries = [...ctx.repoNumbering.entries()].sort((a, b) => a[1] - b[1]);
      const repoRows = ctx.meta.snapshotFreshness;
      const repoLines =
        repoEntries.length === 0
          ? "*(none)*"
          : repoEntries
              .map(([repo, n]) => {
                const row = repoRows.find(r => r.repo === repo)!;
                // Real return link, 2026-09-06 (user request): a repo is
                // only ever referenced from one place (the MetaData
                // Snapshot freshness line), so unlike facts there's no
                // first-occurrence ambiguity to resolve -- always link
                // straight back to that one real place. Two real return
                // links on this one entry, not one: the bold label itself
                // is now also clickable, alongside the trailing "↩" --
                // the user explicitly asked for a second one here, not a
                // marker inside the Technical Proposal body.
                return `- <a id="repo-${n}"></a>[**R${n}**](#cite-repo-${n}) \`${row.repo}@${row.commitSha}\` (extracted ${row.extractedAt}) [↩](#cite-repo-${n})`;
              })
              .join("\n");

      // Real split, 2026-09-07 (user request): a run can gather far more
      // facts than it ever cites (446 gathered vs. 10 cited on the real
      // resident-departure run that prompted this) -- dumping all of them
      // inline read as noise, not audit trail. Fact-Ids now shows only what
      // the body actually cites (a developer's real pointers-in); every
      // gathered-but-uncited fact still exists, just moved to a collapsed
      // Audit Trail subsection below -- the user was explicit this record
      // shouldn't disappear (this pipeline isn't 100% trusted, a real
      // reviewer needs to be able to check what else was looked at), only
      // get out of the way by default.
      const allFactEntries = [...ctx.numbering.entries()].sort((a, b) => a[1] - b[1]);
      const citedFactEntries = allFactEntries.filter(([, n]) => ctx.citedNumbers?.has(n) ?? false);
      const uncitedFactEntries = allFactEntries.filter(([, n]) => !(ctx.citedNumbers?.has(n) ?? false));

      const factLines =
        citedFactEntries.length === 0
          ? "*(none)*"
          : citedFactEntries
              .map(([id, n]) => `- <a id="evidence-${n}"></a>[**#${n}**](#cite-${n}) \`${id}\` [↩](#cite-${n})`)
              .join("\n");

      // Real regroup, 2026-09-07 (user request): one flat 400+ item list
      // was still hard to manage even collapsed -- a cloud/Firebase dev and
      // an Angular dev each only care about their own repo. Grouped by real
      // repo (ctx.meta.factRepoMap, a real DB lookup -- Step 15 -- not
      // inferred from the fact_id's file-path prefix), one independently
      // collapsible <details> per repo, ordered to match the Repos
      // subsection above (ctx.repoNumbering's R1/R2/R3 order) rather than
      // alphabetically, so the two subsections read consistently.
      const uncitedByRepo = new Map<string, [string, number][]>();
      for (const [id, n] of uncitedFactEntries) {
        const repo = ctx.meta.factRepoMap[id];
        if (!repo) throw new Error(`[Fail-Closed] Uncited fact_id '${id}' has no known repo -- factRepoMap incomplete for this run.`);
        if (!uncitedByRepo.has(repo)) uncitedByRepo.set(repo, []);
        uncitedByRepo.get(repo)!.push([id, n]);
      }
      const auditTrailBody =
        uncitedFactEntries.length === 0
          ? "*(none — everything gathered this run was cited)*"
          : [...uncitedByRepo.entries()]
              .sort((a, b) => (ctx.repoNumbering.get(a[0]) ?? 0) - (ctx.repoNumbering.get(b[0]) ?? 0))
              .map(([repo, entries]) => {
                // Real, deliberate spacing choice: <sub> (smaller text) and
                // blank-line-separated entries, both explicitly requested --
                // a scoped exception to this document's usual single-spaced
                // MetaData/Evidence-Used rule, since a long uncited tail is
                // exactly where scanability matters most.
                const items = entries.map(([id, n]) => `- <a id="evidence-${n}"></a>**#${n}** \`${id}\``).join("\n\n");
                return `<details>\n<summary>${repo} (${entries.length})</summary>\n\n<sub>\n\n${items}\n\n</sub>\n\n</details>`;
              })
              .join("\n\n");
      const auditTrailLines =
        uncitedFactEntries.length === 0
          ? auditTrailBody
          : `${uncitedFactEntries.length} fact(s) gathered but not cited in this document — click a repo to expand:\n\n${auditTrailBody}`;

      // Real third subsection, 2026-09-06 (user request): the cost caveat
      // moved down here from MetaData, same forward-link-from-MetaData /
      // return-link-back pattern as Repos and Fact-Ids. Always rendered,
      // even when cost is unavailable, matching how Repos/Fact-Ids never
      // silently disappear either.
      // Real grounding, added 2026-09-06 (user request): cite the Cloud
      // Billing Catalog API's own pricingEffectiveTime -- Google's real,
      // authoritative record of when that price took effect -- rather than
      // just when this run happened to call the API.
      const pricingAsOf = ctx.meta.pricingEffectiveTime ? new Date(ctx.meta.pricingEffectiveTime).toISOString().replace("T", " ").slice(0, 16) + " UTC" : null;
      const costLines =
        ctx.meta.approxCostUsd === null
          ? "*(not available this run — live Vertex AI pricing lookup failed or returned an ambiguous SKU match)*"
          : `<a id="cost-detail"></a>**$${ctx.meta.approxCostUsd.toFixed(4)}** — approx., this document's own Vertex AI token cost only, computed from real-time pricing (live Cloud Billing Catalog API lookup, prices effective as of ${pricingAsOf}); excludes subscriptions, infra, and other real overhead. [↩](#cite-cost)`;

      return `### Repos\n\n${repoLines}\n\n### Fact-Ids\n\n${factLines}\n\n### Audit Trail\n\n${auditTrailLines}\n\n### Cost\n\n${costLines}`;
    }
    case "metadata": {
      // Real fix, 2026-09-06: a bare "\n" between these lines is invisible
      // once rendered -- CommonMark treats a single newline inside one
      // paragraph as a space, not a line break, so this whole block
      // collapsed onto one run-together line in preview even though the
      // raw source looked correctly separated. Same real fix already
      // applied to cited-list's citation line: a real <br>, not trailing
      // whitespace.
      const toolCallSummary = Object.entries(ctx.meta.toolCallCounts).map(([n, c]) => `${n}: ${c}`).join(", ") || "none";
      // Real bug found and fixed 2026-09-06, caught by the user in a live
      // preview: a leading "- " here was interpreted as a real CommonMark
      // list, even mid-paragraph with no blank line before it -- a list
      // CAN interrupt a paragraph per the spec, not just start after a
      // blank line, which is the opposite of what was assumed when this
      // was written. The next two real MetaData lines (Real tool calls
      // made / Real run duration), not themselves starting with "-", then
      // got absorbed as lazy-continuation text of that list's last item
      // instead of rendering as their own separate lines -- exactly what
      // the user saw. Fixed by using a plain bullet character ("•") instead
      // of a real list marker -- same visual indent, never triggers list
      // parsing since it isn't a recognized block marker.
      const snapshotFreshnessBlock =
        ctx.meta.snapshotFreshness.length === 0
          ? "evidence has no results to date -- nothing to check freshness against."
          : "evidence below reflects:<br>\n" +
            ctx.meta.snapshotFreshness
              .map(r => {
                const n = ctx.repoNumbering.get(r.repo)!;
                return `• <a id="cite-repo-${n}"></a>${r.repo} @ ${r.extractedAt} ([R${n}](#repo-${n}))`;
              })
              .join("<br>\n");
      const t = ctx.meta.tokenUsage;
      const tokenUsageLine =
        `${(t.inputTokens ?? 0).toLocaleString()} input, ${(t.outputTokens ?? 0).toLocaleString()} output, ` +
        `${(t.thoughtsTokens ?? 0).toLocaleString()} thinking, ${(t.cachedContentTokens ?? 0).toLocaleString()} cached ` +
        `(${((t.inputTokens ?? 0) + (t.outputTokens ?? 0) + (t.thoughtsTokens ?? 0)).toLocaleString()} total)`;
      // Real restructure, 2026-09-06 (user request): "Real" dropped from
      // these four labels; the cost figure now links down to a real
      // "### Cost" subsection in Evidence Used (same forward/return-link
      // pattern already used for Repos/Fact-Ids) which carries the caveat
      // text -- MetaData stays a short, scannable line, the full "why" and
      // "what this doesn't include" moves to the appendix where the rest
      // of the document's real methodology already lives.
      const approxCostLine =
        ctx.meta.approxCostUsd === null
          ? "unavailable — live Vertex AI pricing lookup failed or returned an ambiguous match this run (see token usage above for the real underlying numbers)"
          : `<a id="cite-cost"></a>[$${ctx.meta.approxCostUsd.toFixed(4)}](#cost-detail)`;
      return [
        `**Status:** ${ctx.meta.runKind === "test" ? "Test run — atomic-prd-agent proof of concept" : "Considered — reviewed agent output"}`,
        `**Persona:** \`${ctx.meta.persona}\` (${ctx.meta.personaPath})`,
        `**Model:** ${ctx.meta.model} (Vertex AI, ${ctx.meta.projectId}/${ctx.meta.location})`,
        `**Snapshot freshness:** ${snapshotFreshnessBlock}`,
        `**Tool calls made:** ${toolCallSummary}`,
        `**Turns used:** ${ctx.meta.turnsUsed} of ${ctx.meta.maxTurns}`,
        `**Run duration:** ${formatDuration(ctx.meta.durationMs)}`,
        `**Token usage:** ${tokenUsageLine}`,
        `**Approx. document cost:** ${approxCostLine}`,
      ].join("<br>\n");
    }
    default:
      throw new Error(`[Fail-Closed] Template declared reserved heading '${name}' with no known renderer -- add one to renderReservedContent or fix the template.`);
  }
}

// Real return-link feature, 2026-09-06 (user feedback + user's own proposed
// resolution to a real ambiguity they spotted first): a fact cited by
// several different claims can't sensibly link back to all of them from one
// appendix row -- "first occurrence gets it" is the real, deliberate
// resolution used here, not an oversight. Implemented as a post-process
// scan over the already-rendered body text (real document order, exactly
// what a reader sees) rather than threading position state through the
// renderer: find each "[#N](#evidence-N)" link in reading order, tag the
// first time each N appears with a real anchor, record which numbers
// actually got one. The EVIDENCE_USED_PLACEHOLDER dance below exists
// because evidence-used's own back-links depend on citedNumbers, which
// isn't known until AFTER this same scan runs -- render everything else
// first, scan, then render evidence-used for real and splice it in.
const CITATION_LINK_RE = /\[#(\d+)\]\(#evidence-\d+\)/g;
// Real bug found and fixed 2026-09-06, caught by the user comparing raw
// source to rendered preview: anchors were originally prepended at the
// absolute start of the line, ahead of the "- " bullet marker. CommonMark
// requires "-" to be the literal first character for a line to be
// recognized as a list item -- with an <a> tag in front, the line stopped
// being a bullet at all (rendered as a plain paragraph with a stray literal
// "- " in the text), while the next real bullet line started its own new,
// separate one-item list directly below it. Fix: insert the anchors right
// after the leading "- ", not before it, so the bullet marker stays at the
// true start of the line.
const LEADING_BULLET_RE = /^(-\s+)/;

function injectFirstOccurrenceAnchors(markdown: string): { markdown: string; citedNumbers: Set<number> } {
  const citedNumbers = new Set<number>();
  const lines = markdown.split("\n").map(line => {
    const numbersInLine = [...line.matchAll(CITATION_LINK_RE)].map(m => Number(m[1]));
    const newNumbers = numbersInLine.filter(n => !citedNumbers.has(n));
    newNumbers.forEach(n => citedNumbers.add(n));
    if (newNumbers.length === 0) return line;
    // Reverted 2026-09-06 -- a visible badge here was tried and explicitly
    // rejected by the user ("not correct... not in the technical
    // proposal"): the real request was a second return link on the
    // Evidence Used entries themselves, not a visible marker in the body.
    // Back to a bare, invisible anchor -- its only job is being a target
    // for Evidence Used's own links.
    const anchors = newNumbers.map(n => `<a id="cite-${n}"></a>`).join("");
    const bulletMatch = line.match(LEADING_BULLET_RE);
    return bulletMatch ? line.slice(0, bulletMatch[0].length) + anchors + line.slice(bulletMatch[0].length) : anchors + line;
  });
  return { markdown: lines.join("\n"), citedNumbers };
}

const EVIDENCE_USED_PLACEHOLDER = "@@EVIDENCE_USED_PLACEHOLDER@@";

function assembleDocument(opts: {
  workflowName: string;
  template: ParsedTemplate;
  generated: GenerationOutput;
  businessRequest: string;
  realFactIds: Set<string>;
  meta: RunMeta;
}): string {
  const numbering = buildCitationNumbering(opts.generated, opts.realFactIds);
  const repoNumbering = buildRepoNumbering(opts.meta.snapshotFreshness);
  const generatedByHeading = new Map(opts.generated.sections.map(s => [s.heading, s.content]));
  const sections = opts.template.sections.map(section => {
    const body = section.reserved
      ? section.reserved === "evidence-used"
        ? EVIDENCE_USED_PLACEHOLDER
        : renderReservedContent(section.reserved, { businessRequest: opts.businessRequest, realFactIds: opts.realFactIds, meta: opts.meta, numbering, repoNumbering })
      : renderSectionContent(
          generatedByHeading.get(section.heading) ??
            (() => {
              throw new Error(`[Fail-Closed] Template declared heading '${section.heading}' but generation did not produce it -- checkTemplateConformance should have caught this already.`);
            })(),
          id => numbering.get(id)!
        );
    return `## ${section.heading}\n\n${body}`;
  });
  const draft = `# Agent PRD — ${opts.workflowName}\n\n${sections.join("\n\n---\n\n")}\n`;

  const { markdown: anchored, citedNumbers } = injectFirstOccurrenceAnchors(draft);
  const evidenceUsedBody = renderReservedContent("evidence-used", {
    businessRequest: opts.businessRequest,
    realFactIds: opts.realFactIds,
    meta: opts.meta,
    numbering,
    repoNumbering,
    citedNumbers,
  });
  return anchored.replace(EVIDENCE_USED_PLACEHOLDER, evidenceUsedBody);
}

async function writeOutput(opts: { workflowName: string; runKind: "test" | "considered"; markdown: string; meta: RunMeta }): Promise<{ mdPath: string; metaPath: string }> {
  const targetDir = opts.runKind === "test" ? path.join(OUTPUT_DIR, "test") : OUTPUT_DIR;
  fs.mkdirSync(targetDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const existing = fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : [];
  const todaysSeqs = existing
    .map(f => f.match(new RegExp(`^${today}-(\\d{3})-`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map(m => Number(m[1]));
  const nextSeq = (todaysSeqs.length > 0 ? Math.max(...todaysSeqs) : 0) + 1;
  const baseName = `${today}-${String(nextSeq).padStart(3, "0")}-${slugify(opts.workflowName)}`;

  const mdPath = path.join(targetDir, `${baseName}.md`);
  const metaPath = path.join(targetDir, `${baseName}.meta.json`);

  fs.writeFileSync(mdPath, opts.markdown, "utf8");
  // adr-008.md §2.4's audit-trail hook: the same persona/model/tool-call/
  // snapshot-freshness data above is also written as real structured JSON,
  // not only interpolated into markdown prose -- cheap today (the data
  // already exists at write time), expensive to retrofit once something
  // downstream starts parsing it back out of prose instead.
  fs.writeFileSync(metaPath, JSON.stringify(opts.meta, null, 2), "utf8");
  return { mdPath, metaPath };
}

async function main() {
  const startedAt = Date.now();
  const BUSINESS_REQUEST_FILE = process.env.BUSINESS_REQUEST_FILE;
  if (!BUSINESS_REQUEST_FILE) throw new Error("[Fail-Closed] BUSINESS_REQUEST_FILE environment variable is required and was not set.");
  const businessRequestPath = path.isAbsolute(BUSINESS_REQUEST_FILE) ? BUSINESS_REQUEST_FILE : path.join(PROJECT_ROOT, BUSINESS_REQUEST_FILE);
  const businessRequest = fs.readFileSync(businessRequestPath, "utf8").trim();
  const PERSONA_FILE = process.env.PERSONA_FILE ?? DEFAULT_PERSONA_PATH;
  const personaPath = path.isAbsolute(PERSONA_FILE) ? PERSONA_FILE : path.join(PROJECT_ROOT, PERSONA_FILE);
  const persona = fs.readFileSync(personaPath, "utf8");

  const TEMPLATE_FILE = process.env.TEMPLATE_FILE ?? DEFAULT_TEMPLATE_PATH;
  const templatePath = path.isAbsolute(TEMPLATE_FILE) ? TEMPLATE_FILE : path.join(PROJECT_ROOT, TEMPLATE_FILE);
  const template = parseTemplate(templatePath);

  console.log(`Running atomic-prd-agent against: ${businessRequestPath}`);
  console.log(`Template: ${templatePath} (${template.llmHeadings.length} LLM-authored section(s): ${template.llmHeadings.join(", ")})`);

  // Real fix, 2026-09-06: the template's actual required headings/kinds are
  // computed per-run and appended to the system prompt here -- never baked
  // into the static persona file (which must stay generic, per the
  // "persona file is a persona file" correction), and never left for the
  // model to guess (the earlier real failure this fixes).
  const systemPrompt = `${persona}\n\n${renderTemplateContract(template)}`;

  // Raised from 25 to 100, 2026-09-07: two real, independent business
  // requests (Step 13/14, 10-sectioncontent-implementation-tasklist.md)
  // both exhausted 25 turns on genuine, non-repeating breadth across a
  // real three-repo question -- not a bug, an under-budgeted cap for a
  // question this wide. Overridable so the real "what does this specific
  // request actually need" question can be tested directly rather than
  // guessed -- same pattern as BUSINESS_REQUEST_FILE/TEMPLATE_FILE/
  // PERSONA_FILE above.
  const MAX_TURNS = Number(process.env.MAX_TURNS ?? 100);

  const response = await ai.generate({
    model: vertexAI.model(config.vertexAI.model),
    system: systemPrompt,
    prompt: businessRequest,
    tools: [searchFacts, getGraphNeighbors, walkCluster],
    output: { schema: GenerationOutputSchema },
    maxTurns: MAX_TURNS,
    config: { temperature: config.vertexAI.temperature },
  });

  const toolCalls = response.messages
    .flatMap(m => m.content)
    .filter((p): p is Extract<typeof p, { toolRequest: unknown }> => "toolRequest" in p)
    .map(p => ({ name: p.toolRequest!.name, input: p.toolRequest!.input }));

  // Real turn count, distinct from tool-call count: genkit's own maxTurns
  // cap counts one real model round-trip as one turn, not one tool call --
  // a single turn can (and often does) request several tools at once, so
  // turnsUsed can be meaningfully lower than the tool-call total. Counted
  // directly from response.messages (one "model"-role message per real
  // turn), not assumed or estimated -- genkit doesn't expose the internal
  // currentTurn counter on the final response, so this is the real,
  // reconstructed equivalent.
  const turnsUsed = response.messages.filter(m => m.role === "model").length;

  console.log(`\n=== ${toolCalls.length} real tool call(s) made ===`);
  for (const call of toolCalls) console.log(`  ${call.name}(${JSON.stringify(call.input)})`);
  console.log(`\n=== ${turnsUsed} of ${MAX_TURNS} real turn(s) used ===`);

  if (!response.output) throw new Error("[Fail-Closed] Agent produced no structured output -- nothing to write.");
  const generated: GenerationOutput = response.output;

  console.log("\n=== Structured output ===");
  console.log(JSON.stringify(generated, null, 2));

  // Two mandatory, code-enforced, fail-closed checks (adr-008.md §2) --
  // run unconditionally, before anything gets written, independent of
  // whatever the persona's prompt said.
  const realFactIds = extractRealFactIds(response);
  checkFabrication(generated, realFactIds);
  checkTemplateConformance(generated, template.llmHeadings);
  console.log(`\n=== Both mandatory validators passed (${realFactIds.size} real fact_id(s) seen this run) ===`);

  const toolCallCounts: Record<string, number> = {};
  for (const call of toolCalls) toolCallCounts[call.name] = (toolCallCounts[call.name] ?? 0) + 1;

  const RUN_KIND = process.env.RUN_KIND === "considered" ? "considered" : "test";
  const workflowName = process.env.WORKFLOW_NAME ?? path.basename(businessRequestPath).replace(/\.[^.]+$/, "");
  const snapshotFreshness = await getSnapshotFreshness(realFactIds);
  const factRepoMap = await getFactRepoMap(realFactIds);
  const durationMs = Date.now() - startedAt;
  console.log(`\n=== Real run duration: ${formatDuration(durationMs)} ===`);

  // Real, live pricing lookup -- free (not LLM spend), queries the actual
  // Cloud Billing Catalog API rather than a hand-maintained price table.
  // Fails closed to null (never a silent $0.00) if the real API is
  // unreachable or the SKU match isn't confident -- token usage still
  // renders either way.
  const tokenUsage = (response.usage ?? {}) as TokenUsage;
  const pricing = await fetchVertexAiPricing(config.vertexAI.pricingLabel, config.vertexAI.location).catch(() => null);
  const approxCostUsd = pricing ? computeApproxCost(tokenUsage, pricing) : null;
  console.log(`\n=== Real approx. cost: ${approxCostUsd === null ? "unavailable" : `$${approxCostUsd.toFixed(4)}`} ===`);

  const meta: RunMeta = {
    workflowName,
    runKind: RUN_KIND,
    persona: "atomic-prd-agent",
    personaPath: path.relative(PROJECT_ROOT, personaPath),
    model: config.vertexAI.model,
    projectId: config.vertexAI.projectId,
    location: config.vertexAI.location,
    toolCallCounts,
    maxTurns: MAX_TURNS,
    turnsUsed,
    snapshotFreshness,
    factRepoMap,
    durationMs,
    generatedAt: new Date().toISOString(),
    usage: response.usage,
    tokenUsage,
    approxCostUsd,
    pricingEffectiveTime: pricing?.pricingEffectiveTime ?? null,
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

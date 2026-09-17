// **version:** 1.0.0
// **location:** level-5 P2 facts index
// © Oskey SAS. All rights reserved.
//
// Task 4 of governance/roadmap/facts-serving-strategy/13-atomic-prd-
// pipeline-tasklist.md: wires search() -> render-evidence.ts ->
// technical-proposal.ts -> assemble-prd.ts into one real script, so an
// atomic PRD (governance/roadmap/facts-serving-strategy/08/10/11's own
// hand-built shape) can be generated instead of hand-assembled.
//
// Layer 1 (Business) stays PM-authored, passed in as a plain text file --
// per 05-tasklist.md item 4, LLM-assistance for this layer is explicitly
// deferred until a trustworthy workflow-documentation corpus exists.
//
// The Layer 3 LLM call is the one real, paid step here -- gated behind an
// explicit GENERATE_TECHNICAL_PROPOSAL=true opt-in, same convention as
// sync-facts.ts's own EMBED=true gate. Without it, the script still
// produces a complete, real document: Layer 1 (as given) and Layer 2 (real
// search evidence) are always real; Layer 3's fields render an honest
// "not yet generated" placeholder rather than blocking the whole run.
//
// Does not import from or touch phase-02-inter-module-synthesis/ or
// pipeline/cross-repo-synthesis/ in any repo -- same scope boundary as the
// rest of this pipeline.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { search } from "./_shared/search";
import { renderEvidence } from "./_shared/render-evidence";
import { generateTechnicalProposal, validateLayer3Response, type Layer3Response } from "./_shared/technical-proposal";
import { assemblePrd } from "./_shared/assemble-prd";
import { expandWithGraphNeighbors } from "./_shared/graph-traversal";

const PROJECT_ROOT = process.cwd();
const TEMPLATE_PATH = path.join(PROJECT_ROOT, "governance/roadmap/facts-serving-strategy/12-atomic-prd-template.md");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output", "atomic-prds");

const NOT_YET_GENERATED = "*(not yet generated — set `GENERATE_TECHNICAL_PROPOSAL=true` to run the real Layer 3 call.)*";

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function renderUserStories(stories: Layer3Response["userStories"]): string {
  if (stories.length === 0) return "*(none suggested)*";
  // Trims any trailing period the model added anyway, despite the schema
  // description asking it not to -- real bug found 2026-09-03 in the
  // pipeline's first real generated output ("...move-out day..", a double
  // period), not assumed away by trusting the schema description alone.
  const trimTrailingPeriod = (s: string) => s.trim().replace(/\.+$/, "");
  return stories.map(s => `- As a ${s.actor}, I want ${trimTrailingPeriod(s.goal)}, so that ${trimTrailingPeriod(s.reason)}.`).join("\n");
}

function renderAcceptanceCriteria(criteria: string[]): string {
  if (criteria.length === 0) return "*(none suggested)*";
  return criteria.map(c => `- [ ] ${c}`).join("\n");
}

// Cites facts back by their Layer 2 display number (e.g. "see #3, #7")
// instead of repeating the full fact_id inline -- real readability finding,
// 2026-09-03: a developer reading Layer 3 doesn't need the raw fact_id in
// front of them, they need to find the fact in Layer 2, which is already
// numbered in the same order search() returned it. Fails loud rather than
// silently dropping a citation if an evidenceId isn't in the map -- that
// would mean validateLayer3Response's own membership check was bypassed
// somehow, a bug worth surfacing, not hiding.
function citationList(evidenceIds: string[], factIdToNumber: Map<string, number>): string {
  if (evidenceIds.length === 0) return "(no evidence cited)";
  return evidenceIds
    .map(id => {
      const n = factIdToNumber.get(id);
      if (n === undefined) throw new Error(`[Fail-Closed] Layer 3 cited fact_id not found in Layer 2's numbered evidence list: ${id}`);
      return `#${n}`;
    })
    .join(", ");
}

function renderConstraints(constraints: Layer3Response["constraints"], factIdToNumber: Map<string, number>): string {
  if (constraints.length === 0) return "*(none found in the evidence.)*";
  return constraints.map(c => `- ${c.constraint} (see ${citationList(c.evidenceIds, factIdToNumber)})`).join("\n");
}

function renderTechnicalProposal(points: Layer3Response["technicalProposal"], factIdToNumber: Map<string, number>): string {
  if (points.length === 0) return "*(none suggested)*";
  return points.map(p => `- ${p.point} (see ${citationList(p.evidenceIds, factIdToNumber)})`).join("\n");
}

async function renderSnapshotFreshness(repos: Set<string>): Promise<string> {
  if (repos.size === 0) {
    return "evidence has no results to date -- nothing to check freshness against.";
  }
  const db = pool();
  try {
    const rows = await db.query<{ repo: string; commit_sha: string; extracted_at: Date }>(
      `SELECT repo, commit_sha, extracted_at FROM extraction_runs WHERE is_current = true AND repo = ANY($1::text[])`,
      [[...repos]]
    );
    const byRepo = new Map(rows.rows.map(r => [r.repo, r]));
    const parts = [...repos].map(repo => {
      const row = byRepo.get(repo);
      if (!row) throw new Error(`[Fail-Closed] Evidence cites repo '${repo}' but no current extraction_runs row exists for it.`);
      return `\`${row.repo}@${row.commit_sha}\` (extracted ${row.extracted_at.toISOString().slice(0, 10)})`;
    });
    return `evidence below reflects ${parts.join("; ")}`;
  } finally {
    await db.end();
  }
}

async function main() {
  const WORKFLOW_NAME = process.env.WORKFLOW_NAME;
  const QUERY = process.env.QUERY;
  const LAYER1_BUSINESS_FILE = process.env.LAYER1_BUSINESS_FILE;
  const REQUESTER = process.env.REQUESTER;
  const STATUS = process.env.STATUS ?? "Draft — automated";

  if (!WORKFLOW_NAME) throw new Error("[Fail-Closed] WORKFLOW_NAME environment variable is required and was not set.");
  if (!QUERY) throw new Error("[Fail-Closed] QUERY environment variable is required and was not set.");
  if (!LAYER1_BUSINESS_FILE) throw new Error("[Fail-Closed] LAYER1_BUSINESS_FILE environment variable is required and was not set.");
  if (!REQUESTER) throw new Error("[Fail-Closed] REQUESTER environment variable is required and was not set.");

  const layer1BusinessPath = path.isAbsolute(LAYER1_BUSINESS_FILE) ? LAYER1_BUSINESS_FILE : path.join(PROJECT_ROOT, LAYER1_BUSINESS_FILE);
  if (!fs.existsSync(layer1BusinessPath)) throw new Error(`[Fail-Closed] LAYER1_BUSINESS_FILE not found at ${layer1BusinessPath}.`);
  const layer1Business = fs.readFileSync(layer1BusinessPath, "utf8").trim();

  console.log(`Searching: "${QUERY}"`);
  const searchResponse = await search(QUERY);
  console.log(`  ${searchResponse.results.length} result(s), confident=${searchResponse.confident}`);

  // Same order renderEvidence numbered Layer 2 in (search()'s own rank
  // order) -- both derive from the same searchResponse.results array, so
  // this stays consistent by construction, not by keeping two counters
  // in sync by hand.
  const factIdToNumber = new Map(searchResponse.results.map((r, i) => [r.factId, i + 1]));

  // Task 5c: real graph neighbors of the anchors, rendered as a separate,
  // clearly-labeled section (render-evidence.ts's own header explains why
  // this is never silently merged into the anchor list). Numbering
  // continues the same sequence -- built here, once, from the exact same
  // factIdToNumber map renderEvidence uses, so Layer 3 citations against
  // either list stay correct by construction, not by convention.
  const graphDb = pool();
  const graphNeighbors = await expandWithGraphNeighbors(graphDb, searchResponse.results.map(r => r.factId), factIdToNumber);
  await graphDb.end();
  graphNeighbors.forEach((n, i) => factIdToNumber.set(n.factId, searchResponse.results.length + 1 + i));
  console.log(`  ${graphNeighbors.length} real graph neighbor(s) found (direct call/API/pub-sub connections to the anchors above).`);

  const layer2Evidence = renderEvidence(searchResponse, graphNeighbors);
  const involvedRepos = new Set(searchResponse.results.map(r => r.repo));
  const snapshot = await renderSnapshotFreshness(involvedRepos);

  let layer3: Layer3Response | null = null;
  if (process.env.GENERATE_TECHNICAL_PROPOSAL === "true") {
    if (searchResponse.results.length === 0) {
      throw new Error("[Fail-Closed] GENERATE_TECHNICAL_PROPOSAL=true but search() returned zero results -- nothing to ground the Layer 3 call in.");
    }
    console.log("Generating Layer 3 technical proposal (real LLM call)...");
    layer3 = await generateTechnicalProposal(layer1Business, searchResponse.results);
    const realFactIds = new Set(searchResponse.results.map(r => r.factId));
    const { fabricatedEvidenceIds } = validateLayer3Response(layer3, realFactIds);
    if (fabricatedEvidenceIds.length > 0) {
      throw new Error(`[FABRICATED_CITATION] Layer 3 cited fact_id(s) not present in the real evidence: ${fabricatedEvidenceIds.join(", ")}`);
    }
    console.log(`  ${layer3.technicalProposal.length} proposal point(s), ${layer3.userStories.length} user stor(y/ies), ${layer3.acceptanceCriteria.length} acceptance criterion/a, ${layer3.constraints.length} constraint(s) -- all citations verified real.`);
  } else {
    console.log("  (GENERATE_TECHNICAL_PROPOSAL not set to 'true' -- skipping the real LLM call; Layer 3 fields will render as pending.)");
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const technicalConfidence = searchResponse.confident ? "High — top match in Layer 2 is within the confidence threshold" : "Low — see confidence warning in Layer 2 above";

  const document = assemblePrd(template, {
    workflow_name: WORKFLOW_NAME,
    status: STATUS,
    requester: REQUESTER,
    snapshot_freshness: snapshot,
    layer1_business: layer1Business,
    user_stories: layer3 ? renderUserStories(layer3.userStories) : NOT_YET_GENERATED,
    layer2_evidence: layer2Evidence,
    layer3_technical: layer3 ? renderTechnicalProposal(layer3.technicalProposal, factIdToNumber) : NOT_YET_GENERATED,
    acceptance_criteria: layer3 ? renderAcceptanceCriteria(layer3.acceptanceCriteria) : NOT_YET_GENERATED,
    constraints: layer3 ? renderConstraints(layer3.constraints, factIdToNumber) : NOT_YET_GENERATED,
    phased_breakdown: "*(not evaluated by this pipeline version — none identified automatically.)*",
    related_workflows: "*(not yet automated in this pipeline — leave for manual PM/dev review.)*",
    out_of_scope: "*(not yet automated in this pipeline — leave for manual PM/dev review.)*",
    business_confidence: "*(not automatically assessed — PM should confirm Layer 1 accuracy directly.)*",
    technical_confidence: technicalConfidence,
    overall_confidence: layer3 ? technicalConfidence : "*(pending — Layer 3 not yet generated.)*",
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `${slugify(WORKFLOW_NAME)}.md`);
  fs.writeFileSync(outputPath, document, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

// Step 1 of governance/roadmap/mcp-direction/10-sectioncontent-implementation-
// tasklist.md. Real, verified 2026-09-06 (npx tsc --noEmit clean; renderer
// exercised against hand-constructed cases of every kind) before being
// wired into atomic-prd-agent.ts. One generic schema for every document
// type -- adr-008.md's whole point: a new document type is a new template
// + persona, never a new TypeScript schema.
import { z } from "genkit";

export const SectionContentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prose"), text: z.string() }),
  z.object({ kind: z.literal("list"), checkable: z.boolean(), items: z.array(z.string()) }),
  z.object({
    kind: z.literal("cited-list"),
    items: z.array(z.object({ claim: z.string(), evidenceRefs: z.array(z.string()) })),
  }),
  z.object({
    kind: z.literal("stories"),
    items: z.array(z.object({ actor: z.string(), goal: z.string(), reason: z.string() })),
  }),
]);

// What Genkit's output:{schema} actually constrains generation with -- only
// LLM-authored sections. Reserved headings (MetaData, the raw business
// request) are never sent to the model as something to fill in; see
// template.ts's reserved concept and agent.ts's assembly step.
export const GenerationOutputSchema = z.object({
  sections: z.array(z.object({ heading: z.string(), content: SectionContentSchema })),
});

export type SectionContent = z.infer<typeof SectionContentSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

// Same real "As a X, I want Y, so that Z." / "- [ ]" shapes already proven
// in the pre-migration renderMarkdown() -- a restructuring (one generic
// function, switching on kind) not a redesign of how a real PRD actually
// reads.
//
// citationNumberOf is optional and used only by "cited-list": real fact_ids
// were long and repeating them inline made a real document hard for a human
// reviewer to scan (user feedback, 2026-09-06; the fact_id length problem
// itself is now moot post-ADR-010's fact_ref, but the numbered-citation UX
// this enabled is kept). When provided, each evidenceRefs entry is looked up
// to its real, stable, document-wide citation number (assembleDocument in
// atomic-prd-agent.ts assigns these, same fact_ref always gets the same
// number wherever it's cited) and rendered as a linked "(see #N)" instead of
// the raw fact_ref string. Duplicate numbers within one claim's own
// evidenceRefs (the same fact_ref listed twice by the model) are collapsed
// to one reference, not repeated. Falls back to raw fact_refs when no lookup
// is given, so this function stays usable standalone (e.g. in isolated
// tests) without a full document context.
// Real readability fix, 2026-09-06 (user feedback): a blank line between
// every item in a rendered kind, real ones -- a tight, no-space list of
// multi-clause claims read as a wall of text. cited-list additionally
// breaks the citation onto its own line within the bullet (a real <br>,
// not trailing whitespace -- trailing spaces are invisible and easy to
// lose in an edit or a diff, <br> is explicit and portable across the
// GFM-compatible renderers this document is actually read in). Deliberately
// NOT applied to MetaData or Evidence Used -- both are dense, scan-once
// reference blocks, not prose to read line by line; the user was explicit
// these two stay as they are.
// repoForFactRef is optional and used only by "cited-list", same real
// fallback discipline as citationNumberOf above (stays usable standalone
// without a full document context when omitted). Real, deliberate,
// HARDCODED behavior, per the user directly (2026-09-19): grouping a
// cited-list by repo is NOT a per-template opt-in -- there is no template
// directive for it, and there deliberately never will be. It is an
// unconditional property of this one content kind, because every real
// cited-list claim already carries the evidenceRefs needed to know which
// repo(s) it touches, and these documents are read by feature teams spread
// across multiple repos (a cloud dev should be able to jump straight to
// their own section, not scan one flat list). "list"/"stories" are
// deliberately NOT grouped -- their real data shape carries no evidenceRefs
// at all (section-content.ts's own closed kind set, ADR-008), so there is
// no real per-repo linkage to group them by without inventing one.
export function renderSectionContent(
  content: SectionContent,
  citationNumberOf?: (factRef: string) => number,
  repoForFactRef?: (factRef: string) => string | null
): string {
  switch (content.kind) {
    case "prose":
      return content.text;
    case "list":
      return content.items.map(i => (content.checkable ? `- [ ] ${i}` : `- ${i}`)).join("\n\n");
    case "cited-list":
      return repoForFactRef
        ? renderCitedListGroupedByRepo(content.items, citationNumberOf, repoForFactRef)
        : content.items.map(i => `- ${i.claim}<br>(see ${renderCitations(i.evidenceRefs, citationNumberOf)})`).join("\n\n");
    case "stories":
      return content.items.map(s => `- As a ${s.actor}, I want ${s.goal}, so that ${s.reason}.`).join("\n\n");
  }
}

function renderCitations(evidenceRefs: string[], citationNumberOf?: (factRef: string) => number): string {
  if (!citationNumberOf) return evidenceRefs.join(", ");
  const numbers = [...new Set(evidenceRefs.map(citationNumberOf))].sort((a, b) => a - b);
  return numbers.map(n => `[#${n}](#evidence-${n})`).join(", ");
}

// Real group-key rule, confirmed directly against a real test render
// before being productionized here (output/agent-runs/prds/test/2026-09-19-
// 001-...REGROUPED-BY-REPO-TEST.md): a claim's real evidenceRefs are looked
// up to their real repo via repoForFactRef, deduplicated -- zero distinct
// repos (every real evidenceRef unresolvable, or the item genuinely has
// none, e.g. a bare [NEEDS CLARIFICATION] claim) falls into its own
// honestly-labeled group rather than being silently dropped or guessed
// into a repo; exactly one repo is the common case; two or more is a real
// cross-repo claim, labeled with every real repo it touches (sorted, so
// the same repo pair always produces the same group key regardless of
// evidenceRefs order) -- not yet exercised against a real generation run
// as of this change (the one real run tested so far happened to have zero
// genuinely cross-repo claims), verified instead with a synthetic case
// built from real fact_refs before shipping.
const NO_EVIDENCE_GROUP = "Zero real evidence cited -- e.g. a [NEEDS CLARIFICATION] item";

function renderCitedListGroupedByRepo(
  items: { claim: string; evidenceRefs: string[] }[],
  citationNumberOf: ((factRef: string) => number) | undefined,
  repoForFactRef: (factRef: string) => string | null
): string {
  const groups = new Map<string, { claim: string; evidenceRefs: string[] }[]>();
  for (const item of items) {
    const repos = [...new Set(item.evidenceRefs.map(repoForFactRef).filter((r): r is string => r !== null))];
    const key = repos.length === 0 ? NO_EVIDENCE_GROUP : repos.length === 1 ? repos[0] : `cross-repo: ${[...repos].sort().join(" + ")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  // Real repos first (alphabetical, deterministic across runs), cross-repo
  // group(s) next, the zero-evidence group always last -- matches a real
  // reader's own priority (my repo's stuff, then the parts that genuinely
  // span more than one repo, then anything unverified).
  const keys = [...groups.keys()].sort((a, b) => {
    const rank = (k: string) => (k.startsWith("cross-repo:") ? 1 : k === NO_EVIDENCE_GROUP ? 2 : 0);
    return rank(a) - rank(b) || a.localeCompare(b);
  });

  return keys
    .map(key => {
      const groupItems = groups.get(key)!;
      const heading = `### ${key} (${groupItems.length} item(s))`;
      const body = groupItems.map(i => `- ${i.claim}<br>(see ${renderCitations(i.evidenceRefs, citationNumberOf)})`).join("\n\n");
      return `${heading}\n\n${body}`;
    })
    .join("\n\n");
}

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
    items: z.array(z.object({ claim: z.string(), evidenceIds: z.array(z.string()) })),
  }),
  z.object({
    kind: z.literal("user-stories"),
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
// are long and repeating them inline made a real document hard for a human
// reviewer to scan (user feedback, 2026-09-06). When provided, each
// evidenceIds entry is looked up to its real, stable, document-wide
// citation number (assembleDocument in atomic-prd-agent.ts assigns these,
// same fact_id always gets the same number wherever it's cited) and
// rendered as a linked "(see #N)" instead of the raw fact_id string.
// Duplicate numbers within one claim's own evidenceIds (the same fact_id
// listed twice by the model) are collapsed to one reference, not repeated.
// Falls back to raw fact_ids when no lookup is given, so this function
// stays usable standalone (e.g. in isolated tests) without a full document
// context.
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
export function renderSectionContent(content: SectionContent, citationNumberOf?: (factId: string) => number): string {
  switch (content.kind) {
    case "prose":
      return content.text;
    case "list":
      return content.items.map(i => (content.checkable ? `- [ ] ${i}` : `- ${i}`)).join("\n\n");
    case "cited-list":
      return content.items
        .map(i => `- ${i.claim}<br>(see ${renderCitations(i.evidenceIds, citationNumberOf)})`)
        .join("\n\n");
    case "user-stories":
      return content.items.map(s => `- As a ${s.actor}, I want ${s.goal}, so that ${s.reason}.`).join("\n\n");
  }
}

function renderCitations(evidenceIds: string[], citationNumberOf?: (factId: string) => number): string {
  if (!citationNumberOf) return evidenceIds.join(", ");
  const numbers = [...new Set(evidenceIds.map(citationNumberOf))].sort((a, b) => a - b);
  return numbers.map(n => `[#${n}](#evidence-${n})`).join(", ");
}

// Step 2 of governance/roadmap/mcp-direction/10-sectioncontent-implementation-
// tasklist.md. Real, verified 2026-09-06 -- run against the real template
// file (templates/atomic-prd.template.md), confirmed llmHeadings matches
// exactly, before being wired into atomic-prd-agent.ts.
//
// A template is plain markdown a PO staffer reads directly (headings,
// order) with one HTML comment per heading declaring how it's filled --
// invisible when rendered, simple to parse and copy from an example. Two
// heading types: `reserved: <name>` (renderer-injected, real code-computed
// data, never sent to the LLM -- MetaData, the raw business request) and
// `kind: <...>` (LLM-authored, one of section-content.ts's four kinds).
import fs from "fs";
import type { SectionContent } from "./section-content";

export interface TemplateSection {
  heading: string;
  reserved?: string; // e.g. "metadata", "business-request"
  kind?: SectionContent["kind"];
  checkable?: boolean; // only meaningful when kind === "list"
}

export interface ParsedTemplate {
  sections: TemplateSection[]; // full real order, reserved + generated
  llmHeadings: string[]; // reserved excluded, real order preserved -- what the model is actually asked to produce
}

const HEADING_RE = /^#\s+(.+)$/;
const RESERVED_RE = /^<!--\s*reserved:\s*([\w-]+)\s*-->$/;
const KIND_RE = /^<!--\s*kind:\s*(\w[\w-]*)(?:\s+checkable=(true|false))?\s*-->$/;

export function parseTemplate(path: string): ParsedTemplate {
  const lines = fs
    .readFileSync(path, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const sections: TemplateSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(HEADING_RE);
    if (!headingMatch) continue;
    const heading = headingMatch[1].trim();
    const directive = lines[i + 1];
    const reservedMatch = directive?.match(RESERVED_RE);
    const kindMatch = directive?.match(KIND_RE);

    if (reservedMatch) {
      sections.push({ heading, reserved: reservedMatch[1] });
    } else if (kindMatch) {
      sections.push({
        heading,
        kind: kindMatch[1] as TemplateSection["kind"],
        checkable: kindMatch[2] === "true",
      });
    } else {
      throw new Error(
        `[Fail-Closed] Template heading '${heading}' at ${path} has no recognized directive (expected <!-- reserved: ... --> or <!-- kind: ... --> on the following line).`
      );
    }
  }

  return {
    sections,
    llmHeadings: sections.filter(s => !s.reserved).map(s => s.heading),
  };
}

// Real bug found and fixed 2026-09-06, during Step 10's regression check:
// the model was never actually told which headings/kinds a template
// requires -- GenerationOutputSchema's `heading` field is a bare z.string(),
// so nothing constrains it, and the persona (deliberately generic, per the
// user's correction that it must not contain per-document-type specifics)
// never names them either. Real, observed consequence: a real run produced
// one invented heading ("Impact Analysis") instead of the real four,
// correctly caught by checkTemplateConformance but only after a wasted
// generation call. This function is the fix -- a dynamic, per-run contract
// built from the actual parsed template, appended to the system prompt at
// call time (not baked into the static persona file).
export function renderTemplateContract(template: ParsedTemplate): string {
  const lines = template.sections
    .filter(s => !s.reserved)
    .map((s, i) => {
      const kindDescription = s.kind === "list" ? `list (checkable: ${s.checkable ?? false})` : s.kind;
      return `${i + 1}. "${s.heading}" -- kind: ${kindDescription}`;
    });
  return [
    "## Required sections for this document",
    "",
    "Produce exactly these sections, in this exact order, using the content kind specified for each. Do not invent, rename, drop, or reorder any of them:",
    "",
    ...lines,
  ].join("\n");
}

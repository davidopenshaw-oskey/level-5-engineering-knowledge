// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Extracted from 01c-generate-assembly-first-profile.ts, which parses each
// capability's "### N. Title" numbered-header output into sections keyed by
// number, so the calling script can assemble specific sections verbatim
// rather than re-synthesizing them. 02-generate-repo-report.ts needs the
// same parsing (reading module engineering profiles instead of capability
// outputs) -- pulled out here so both share one implementation.

/** Splits a document written to the "### N. Title" numbered-header
 * convention into its sections, keyed by section number. Tolerant of
 * surrounding whitespace and heading level (#, ##, ###...) -- verified
 * against real data 2026-08-11 that the LLM does not reliably reproduce the
 * exact "###" level a contract specifies, even though it reliably gets the
 * number+title right. The heading level isn't semantically load-bearing
 * here; the number is. */
export function splitNumberedSections(content: string): Map<number, { title: string; body: string }> {
  const headerPattern = /^#{1,6}\s*(\d+)\.\s*(.+)$/gm;
  const matches = Array.from(content.matchAll(headerPattern));
  const sections = new Map<number, { title: string; body: string }>();
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const num = parseInt(m[1], 10);
    const title = m[2].trim();
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    sections.set(num, { title, body: content.slice(start, end).trim() });
  }
  return sections;
}

/** Replaces one numbered section's body with deterministically-computed
 * content, leaving its header line and every other section byte-for-byte
 * untouched. Added 2026-08-30 for the V1-A capability-synthesis fix
 * (governance/roadmap/v1-a-capability-synthesis-contract-scope-2026-08-30.md):
 * Public Interfaces no longer needs LLM discovery, since Phase 1 already
 * deterministically identifies controller/service classes -- this lets the
 * calling script overwrite that one section's content after the LLM call
 * returns, the same "assembled, not re-synthesized" pattern the pipeline
 * already uses for Section 14 (Evidence References), just applied one stage
 * earlier. Fails loudly (does not silently append or no-op) if the LLM
 * omitted the section entirely -- that means the contract's own output
 * format wasn't followed, which is a real problem worth surfacing, not
 * papering over. */
export function replaceNumberedSection(content: string, sectionNum: number, newBody: string): string {
  const headerPattern = /^(#{1,6}\s*(\d+)\.\s*.+)$/gm;
  const matches = Array.from(content.matchAll(headerPattern));
  for (let i = 0; i < matches.length; i++) {
    const num = parseInt(matches[i][2], 10);
    if (num !== sectionNum) continue;
    const headerEnd = (matches[i].index ?? 0) + matches[i][0].length;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    return content.slice(0, headerEnd) + "\n\n" + newBody + "\n\n" + content.slice(bodyEnd).replace(/^\s+/, "");
  }
  throw new Error(`[ASSEMBLY_SECTION_MISMATCH_FATAL] Section ${sectionNum} not found in capability output -- cannot splice in deterministic content. The LLM did not follow the contract's required section structure.`);
}

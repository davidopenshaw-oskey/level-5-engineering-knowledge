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

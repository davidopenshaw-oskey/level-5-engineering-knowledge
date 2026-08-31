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

interface HeadingMatch {
  level: number;
  num: number;
  index: number;
}

/** Given every digit-numbered heading match in a document, decides which
 * ones are real top-level section boundaries versus an incidental nested
 * sub-heading that happens to share the "N. Title" shape. Ported verbatim
 * from firebase-oskey-dev's copy (2026-08-30 V1-A fix, governance/roadmap/
 * v1-a-capability-synthesis-contract-scope-2026-08-30.md) -- this logic is
 * pure text/regex disambiguation over numbered markdown headers with no
 * Firebase-specific assumptions. Two real, confirmed cases this must handle
 * (governance/roadmap/firebase-oskey-dev/06b-v1-ab-factorial-experiment-
 * results.md and tasks.md, both 2026-08-30):
 *
 * 1. A sub-heading nested INSIDE another section's own prose, at a level
 *    DEEPER than the document's real sections, coincidentally reusing a
 *    number that also appears -- correctly -- elsewhere at the document's
 *    shallower, canonical level. E.g. "#### 3. Entity Dashboard Statistics
 *    Aggregation" written by the model inside Section 2's own content,
 *    alongside a real, later "### 3. Public Interfaces". Fix: when a
 *    number has more than one candidate heading, prefer whichever
 *    candidate sits at the document's canonical (shallowest) heading
 *    level.
 * 2. A genuine, uniquely-occurring top-level section the model happened to
 *    render at a DIFFERENT level than its siblings, with no competing
 *    candidate for that number anywhere else in the document -- e.g. a
 *    real document using "##" for every other top-level section but "###"
 *    for its one real Section 3, no other "3."-numbered heading anywhere.
 *    A pure "always prefer the shallowest level" rule (this function's
 *    first, incomplete fix) wrongly discards this genuine section as
 *    nested sub-content. Fix: when a number has only ONE candidate
 *    heading, keep it regardless of level -- there's nothing to
 *    disambiguate against, and a document being self-inconsistent about
 *    heading level for a real section is a different, harmless problem
 *    from a nested sub-heading impersonating one.
 *
 * A number with multiple candidates but NONE at the canonical level has
 * never been observed in real data; falls back to the first occurrence in
 * document order (this function's original, pre-fix behavior) rather than
 * guessing further. */
function selectRealSectionMatches<T extends HeadingMatch>(matches: T[]): T[] {
  if (matches.length === 0) return matches;
  const canonicalLevel = Math.min(...matches.map(m => m.level));
  const byNumber = new Map<number, T[]>();
  for (const m of matches) {
    const group = byNumber.get(m.num) ?? [];
    group.push(m);
    byNumber.set(m.num, group);
  }
  const kept = new Set<T>();
  for (const group of byNumber.values()) {
    if (group.length === 1) {
      kept.add(group[0]);
      continue;
    }
    const atCanonicalLevel = group.find(m => m.level === canonicalLevel);
    kept.add(atCanonicalLevel ?? group[0]);
  }
  return matches.filter(m => kept.has(m));
}

/** Splits a document written to the "### N. Title" numbered-header
 * convention into its sections, keyed by section number. Tolerant of
 * surrounding whitespace and heading level (#, ##, ###...) -- verified
 * against real data 2026-08-11 that the LLM does not reliably reproduce the
 * exact "###" level a contract specifies, even though it reliably gets the
 * number+title right. The heading level isn't semantically load-bearing on
 * its own -- see selectRealSectionMatches above for how a nested false
 * match and a genuinely level-inconsistent real section are told apart. */
export function splitNumberedSections(content: string): Map<number, { title: string; body: string }> {
  const headerPattern = /^(#{1,6})\s*(\d+)\.\s*(.+)$/gm;
  const rawMatches = Array.from(content.matchAll(headerPattern));
  const allMatches = rawMatches.map(m => ({ level: m[1].length, num: parseInt(m[2], 10), title: m[3].trim(), index: m.index ?? 0, fullLength: m[0].length }));
  const matches = selectRealSectionMatches(allMatches);
  const sections = new Map<number, { title: string; body: string }>();
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m.fullLength;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    sections.set(m.num, { title: m.title, body: content.slice(start, end).trim() });
  }
  return sections;
}

/** Replaces one numbered section's body with deterministically-computed
 * content, leaving its header line and every other section byte-for-byte
 * untouched. Ported verbatim from firebase-oskey-dev's copy, added there
 * 2026-08-30 for the V1-A capability-synthesis fix (governance/roadmap/
 * v1-a-capability-synthesis-contract-scope-2026-08-30.md): Public Interfaces
 * no longer needs LLM discovery, since Phase 1 already deterministically
 * identifies the relevant facts -- this lets the calling script overwrite
 * that one section's content after the LLM call returns, the same
 * "assembled, not re-synthesized" pattern the pipeline already uses for
 * Section 14/15 (Evidence References), just applied one stage earlier.
 * Fails loudly (does not silently append or no-op) if the LLM omitted the
 * section entirely -- that means the contract's own output format wasn't
 * followed, which is a real problem worth surfacing, not papering over.
 * Uses the same selectRealSectionMatches disambiguation as
 * splitNumberedSections -- see its comment for the two real failure modes
 * this protects against. */
export function replaceNumberedSection(content: string, sectionNum: number, newBody: string): string {
  const headerPattern = /^(#{1,6})\s*(\d+)\.\s*.+$/gm;
  const rawMatches = Array.from(content.matchAll(headerPattern));
  const allMatches = rawMatches.map(m => ({ level: m[1].length, num: parseInt(m[2], 10), index: m.index ?? 0, fullLength: m[0].length }));
  const matches = selectRealSectionMatches(allMatches);
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].num !== sectionNum) continue;
    const headerEnd = matches[i].index + matches[i].fullLength;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : content.length;
    return content.slice(0, headerEnd) + "\n\n" + newBody + "\n\n" + content.slice(bodyEnd).replace(/^\s+/, "");
  }
  throw new Error(`[ASSEMBLY_SECTION_MISMATCH_FATAL] Section ${sectionNum} not found in capability output -- cannot splice in deterministic content. The LLM did not follow the contract's required section structure.`);
}

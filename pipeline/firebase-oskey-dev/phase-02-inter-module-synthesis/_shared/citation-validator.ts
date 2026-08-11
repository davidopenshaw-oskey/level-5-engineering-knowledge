// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Generate-then-verify citation validation, per governance/adrs/adr-004.md
// and governance/roadmap/02-structural-narrative-synthesis-tiers.md Stage 3.
// There's no clean deterministic join from prose back to fact IDs -- the
// LLM still writes citations as it always has (Tier 3), inline-citing
// `file` (lines N, M-K) as backtick-quoted paths with a parenthetical line
// reference (the convention already used throughout this pipeline's real
// output, e.g. building-engineering-profile.md's Section 14). This module
// adds a deterministic check AFTER generation: does the cited file exist
// anywhere in this module's evidence at all, and does any fact for that
// file actually sit at (or within) the cited line(s). It does not replace
// LLM-written citations -- it catches fabricated ones.
//
// Deliberately two-tier, not pass/fail: a cited file that doesn't exist
// anywhere in this module's evidence is a strong, high-confidence signal
// (files are unambiguous). A cited line with no exact fact match is a much
// weaker signal -- most lines in a real file legitimately have no discrete
// fact recorded there (e.g. a line inside a multi-line method body) -- so
// it's reported separately, as "unverified," not "fabricated."

export interface Citation {
  kind: "file-line" | "fact-id";
  file: string;
  lineRanges: Array<{ start: number; end: number }>;
  factId?: string;
  contextSnippet: string;
}

export type CitationStatus = "verified" | "line-unverified" | "file-not-found";

export interface CitationValidationResult {
  totalCitations: number;
  fileNotFound: Citation[];
  lineUnverified: Citation[];
  verified: number;
  // Decision A1 (governance/roadmap/phase 2-llm q&a/01 facts-vs-decisions-
  // for-review.md): every citation this validation pass looked at, each
  // tagged with its outcome -- not just the failures. Before this, a
  // verified citation's content was discarded (only a count survived); a
  // downstream consumer (a RAG retrieval layer indexing this document, or
  // our own future invalidation work) had no structured record of which
  // specific citations actually held up, only prose text buried in a log
  // notification.
  allCitations: Array<Citation & { status: CitationStatus }>;
}

// Two citation styles are both explicitly allowed by module-engineering-
// profile-task-instructions.md's Section 14 ("fact IDs, file:line where
// available") and both actually occur in real output depending on which
// flow/model produced it -- confirmed empirically 2026-08-02 when the
// module-level flow's real output used fact-ID citations exclusively and
// the original file-line-only pattern silently found zero matches.
const FILE_LINE_PATTERN = /`([^`\s]+\.(?:ts|js))`\s*\(([^)]*\blines?\b[^)]*)\)/gi;
const NUMBER_RANGE_PATTERN = /(\d+)(?:\s*[-–]\s*(\d+))?/g;
// Fact IDs are pipe-delimited, starting with a known fact type name -- see
// stableFactId() in phase-01's extraction scripts for the real format.
const FACT_ID_PATTERN =
  /`((?:model_property|api_contract|call_expression|imports_dependency|firestore_path_touched|firestore_trigger|permission_candidate|permission_error|external_hook|pubsub_topic|pubsub_publish_call|pubsub_event_route|source_class|service_method|controller_method|class_method|type_alias|enum_declaration|source_file|exported_symbol)\|[^`]+)`/g;

export function extractCitations(text: string): Citation[] {
  const citations: Citation[] = [];

  let match: RegExpExecArray | null;
  const filelinePattern = new RegExp(FILE_LINE_PATTERN);
  while ((match = filelinePattern.exec(text)) !== null) {
    const file = match[1];
    const linesClause = match[2];
    const lineRanges: Array<{ start: number; end: number }> = [];
    let numMatch: RegExpExecArray | null;
    const numPattern = new RegExp(NUMBER_RANGE_PATTERN);
    while ((numMatch = numPattern.exec(linesClause)) !== null) {
      const start = parseInt(numMatch[1], 10);
      const end = numMatch[2] ? parseInt(numMatch[2], 10) : start;
      lineRanges.push({ start, end });
    }
    citations.push({ kind: "file-line", file, lineRanges, contextSnippet: match[0] });
  }

  const factIdPattern = new RegExp(FACT_ID_PATTERN);
  while ((match = factIdPattern.exec(text)) !== null) {
    citations.push({ kind: "fact-id", file: "", lineRanges: [], factId: match[1], contextSnippet: match[0] });
  }

  return citations;
}

/** facts: this module's own evidence graph facts (used as the ground truth
 * to validate against -- every fact carries `file` and `line`, and a real
 * `id`). Fact-ID citations are checked by exact ID match (strong signal);
 * file-line citations by file/line presence (weaker, heuristic signal). */
export function validateCitations(text: string, facts: any[]): CitationValidationResult {
  const citations = extractCitations(text);

  const factIdSet = new Set(facts.map(f => f.id).filter(Boolean));
  // Fallback index for abbreviated fact-ID citations -- confirmed
  // empirically 2026-08-02 that the LLM abbreviates fact IDs with `...`
  // inconsistently (sometimes dropping the file segment, sometimes the
  // trailing value segment, sometimes both, not at fixed positions), so
  // positional parsing of the abbreviated string is unreliable. Instead:
  // group real facts by type, then for a failed exact match, search within
  // that type for a fact whose line matches any numeric token in the
  // citation AND whose file/value contains any non-trivial ("..."-free,
  // non-numeric) token from the citation as a substring. Exact match is
  // tried first (strongest); this is the fallback for legitimate
  // abbreviation, not a laxer fabrication standard.
  const factsByType = new Map<string, any[]>();
  for (const f of facts) {
    if (!f.type) continue;
    const list = factsByType.get(f.type) ?? [];
    list.push(f);
    factsByType.set(f.type, list);
  }

  const linesByBasename = new Map<string, number[]>();
  for (const f of facts) {
    if (!f.file || typeof f.line !== "number") continue;
    const basename = f.file.split("/").pop()!;
    for (const key of [f.file, basename]) {
      const list = linesByBasename.get(key) ?? [];
      list.push(f.line);
      linesByBasename.set(key, list);
    }
  }

  const fileNotFound: Citation[] = [];
  const lineUnverified: Citation[] = [];
  const allCitations: Array<Citation & { status: CitationStatus }> = [];
  let verified = 0;

  for (const citation of citations) {
    if (citation.kind === "fact-id") {
      if (factIdSet.has(citation.factId)) {
        verified += 1;
        allCitations.push({ ...citation, status: "verified" });
        continue;
      }
      // Exact match failed -- try the abbreviation-tolerant fallback
      // before concluding fabrication. Position-independent: type is
      // always segment[0] (reliable); everything else is scanned for
      // numeric tokens (candidate lines) and non-trivial text tokens
      // (candidate file/value substrings), since abbreviation drops
      // segments inconsistently rather than at a fixed position.
      const segments = citation.factId!.split("|");
      const type = segments[0];
      const rest = segments.slice(1);
      const numericTokens = rest.filter(s => /^\d+$/.test(s)).map(s => parseInt(s, 10));
      const textTokens = rest.filter(s => s && !/^\d+$/.test(s) && s.replace(/\./g, "") !== "");
      const candidates: any[] = factsByType.get(type) ?? [];
      const fuzzyMatch = candidates.some((f: any) => {
        if (numericTokens.length > 0 && !numericTokens.includes(f.line)) return false;
        if (textTokens.length === 0) return true;
        const haystack = `${f.file ?? ""}|${f.value ?? ""}`;
        return textTokens.some(t => haystack.includes(t.replace(/^\.+/, "")));
      });
      if (fuzzyMatch) {
        verified += 1;
        allCitations.push({ ...citation, status: "verified" });
      } else {
        fileNotFound.push(citation);
        allCitations.push({ ...citation, status: "file-not-found" });
      }
      continue;
    }

    const basename = citation.file.split("/").pop()!;
    const knownLines = linesByBasename.get(citation.file) ?? linesByBasename.get(basename);
    if (!knownLines) {
      fileNotFound.push(citation);
      allCitations.push({ ...citation, status: "file-not-found" });
      continue;
    }
    const anyLineMatches = citation.lineRanges.some(range => knownLines.some(line => line >= range.start && line <= range.end));
    if (anyLineMatches) {
      verified += 1;
      allCitations.push({ ...citation, status: "verified" });
    } else {
      lineUnverified.push(citation);
      allCitations.push({ ...citation, status: "line-unverified" });
    }
  }

  return { totalCitations: citations.length, fileNotFound, lineUnverified, verified, allCitations };
}

export function formatCitationValidation(result: CitationValidationResult): string {
  const lines = [
    `Citations found: ${result.totalCitations} | verified: ${result.verified} | line-unverified: ${result.lineUnverified.length} | file-not-found: ${result.fileNotFound.length}`,
  ];
  if (result.fileNotFound.length > 0) {
    lines.push("FILE NOT FOUND IN THIS MODULE'S EVIDENCE (high-confidence, likely fabricated):");
    for (const c of result.fileNotFound) lines.push(`  ${c.contextSnippet}`);
  }
  if (result.lineUnverified.length > 0) {
    lines.push("LINE UNVERIFIED (file exists, but no fact recorded at/within the cited line -- weak signal, not necessarily wrong):");
    for (const c of result.lineUnverified) lines.push(`  ${c.contextSnippet}`);
  }
  return lines.join("\n");
}

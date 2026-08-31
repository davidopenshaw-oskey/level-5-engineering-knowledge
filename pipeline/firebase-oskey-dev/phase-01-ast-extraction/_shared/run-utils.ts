// **version:** 1.0.0
// **location:** level-5 phase 1 (shared)
// © Oskey SAS. All rights reserved.
//
// Shared run-notification, atomic-write, and path-safety utilities used by every
// script in this repo's pipeline (00-04). Extracted from what was previously five
// independent, byte-for-byte-duplicated copies of the same logic.
//
// SCOPE NOTE: this module is intentionally scoped to THIS repo's pipeline only.
// Per the multi-repo architecture decision, each repo (Angular, node-iot, iOS,
// Android, etc.) owns its own fully independent pipeline and may freely duplicate
// or reimplement this file locally. There is no cross-repo shared runtime — only
// within a single repo's own script chain does deduplication apply.

import fs from "fs";
import path from "path";

export type NotificationSeverity = "info" | "warning" | "error" | "fatal";

export interface NotificationEntry {
  id: string;
  sourceScript: string;
  severity: NotificationSeverity;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  humanAttentionRecommended: boolean;
}

export interface RunNotifications {
  schemaVersion: string;
  runId: string;
  repoName: string;
  updatedAt: string;
  highestSeverity: NotificationSeverity;
  entries: NotificationEntry[];
}

export function buildNotificationId(sourceScript: string, code: string, details?: Record<string, unknown>): string {
  const parts = [
    sourceScript,
    code,
    details?.module ? String(details.module) : "",
    details?.file ? String(details.file) : "",
    details?.missingArtifact ? String(details.missingArtifact) : "",
    details?.key ? String(details.key) : "",
    // Added 2026-08-11: a second occurrence of the same class of bug fixed
    // earlier by adding `file` -- COMPARISON_MODE (governance/roadmap/
    // 04-complete-repo-run-and-repo-reports-plan.md Stage 6) runs the SAME
    // module/relPath through multiple LLM_CONFIG_KEYs, which all produced
    // the identical notification ID (sourceScript+code+module+file are all
    // the same across configs), so the second config's usage/servedModel
    // data silently overwrote the first's -- confirmed lost in practice for
    // `building`'s connective-tissue call (gemini-default vs
    // gemini-default-highthinking). Fixed by distinguishing on
    // llmConfigKey too, when present.
    details?.llmConfigKey ? String(details.llmConfigKey) : "",
  ].filter(Boolean);
  return parts.join("::").toLowerCase();
}

export function addNotification(
  notifications: RunNotifications,
  sourceScript: string,
  severity: NotificationSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  humanAttentionRecommended = false
) {
  const id = buildNotificationId(sourceScript, code, details);
  const now = new Date().toISOString();

  const existingIdx = notifications.entries.findIndex(e => e.id === id);
  if (existingIdx >= 0) {
    const existing = notifications.entries[existingIdx];
    notifications.entries[existingIdx] = {
      ...existing,
      severity,
      message,
      details,
      updatedAt: now,
      humanAttentionRecommended: existing.humanAttentionRecommended || humanAttentionRecommended,
    };
  } else {
    notifications.entries.push({
      id,
      sourceScript,
      severity,
      code,
      message,
      details,
      createdAt: now,
      updatedAt: now,
      humanAttentionRecommended,
    });
  }

  notifications.updatedAt = now;

  const severityOrder: Record<NotificationSeverity, number> = {
    info: 1,
    warning: 2,
    error: 3,
    fatal: 4,
  };

  let maxSev: NotificationSeverity = "info";
  for (const entry of notifications.entries) {
    if (severityOrder[entry.severity] > severityOrder[maxSev]) {
      maxSev = entry.severity;
    }
  }
  notifications.highestSeverity = maxSev;
}

export function assertNoLocalAbsolutePaths(data: unknown, contextDescription: string): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string") {
    if (
      data.startsWith("/Users/") ||
      data.startsWith("/home/") ||
      /^[a-zA-Z]:\\/.test(data) ||
      data.startsWith("file://") ||
      data.includes("output/clones")
    ) {
      throw new Error(`[Local Path Contamination] Found local absolute path '${data}' in context '${contextDescription}'.`);
    }
    return;
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      assertNoLocalAbsolutePaths(data[i], `${contextDescription}[${i}]`);
    }
    return;
  }
  if (typeof data === "object") {
    for (const key of Object.keys(data as object)) {
      assertNoLocalAbsolutePaths((data as any)[key], `${contextDescription}.${key}`);
    }
  }
}

export function writeJsonAtomically(filePath: string, data: unknown, contextDescription: string) {
  assertNoLocalAbsolutePaths(data, contextDescription);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

export function writeNotificationsAtomically(filePath: string, notifications: RunNotifications) {
  assertNoLocalAbsolutePaths(notifications, "run-notifications.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(notifications, null, 2), "utf8");
  JSON.parse(fs.readFileSync(tmpPath, "utf8"));
  fs.renameSync(tmpPath, filePath);
}

export function loadNotifications(notificationsPath: string, expectedRunId: string, expectedRepoName: string): RunNotifications {
  if (!fs.existsSync(notificationsPath)) {
    throw new Error(`[Fail-Closed] Missing required run-notifications.json at '${notificationsPath}'.`);
  }

  let notifs: RunNotifications;
  try {
    notifs = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
  } catch (err: any) {
    throw new Error(`[Fail-Closed] Malformed run-notifications.json at '${notificationsPath}': ${err.message}`);
  }

  if (notifs.runId !== expectedRunId || notifs.repoName !== expectedRepoName) {
    throw new Error(`[Fail-Closed] run-notifications.json identity mismatch: expected runId '${expectedRunId}', got '${notifs.runId}'.`);
  }

  return notifs;
}

export function toRepoPath(absolutePath: string, repoRoot: string): string {
  const relative = path.relative(repoRoot, absolutePath);
  return relative.replace(/\\/g, "/");
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Resolves the namespaced run-context path for a given repo.
 * Namespacing by repoName (rather than a single global output/run-context.json)
 * means each repo's pipeline output subtree is self-contained and cannot
 * collide with another repo's run, even if runs happen to overlap on disk.
 */
export function runContextPath(projectRoot: string, repoName: string): string {
  return path.join(projectRoot, "output", repoName, "run-context.json");
}

export function latestManifestPath(projectRoot: string, repoName: string): string {
  return path.join(projectRoot, "output", repoName, "latest-repo-manifest.json");
}

/**
 * Reads REPO_NAME from the environment. No default/fallback is provided
 * deliberately -- an unset REPO_NAME should fail closed, not silently
 * resolve to a specific repo, especially once multiple repo pipelines
 * exist side by side.
 */
export function requireRepoNameEnv(): string {
  const repoName = process.env.REPO_NAME;
  if (!repoName) {
    throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  }
  return repoName;
}

/**
 * Converts a flat array of evidence-graph facts into compact, per-type
 * TSV-style tables for LLM-prompt consumption -- NOT for canonical storage
 * (see ADR-003: canonical facts stay raw JSON; this is an ephemeral,
 * prompt-assembly-time projection, applied by whatever script assembles a
 * prompt, not persisted as its own pipeline artifact). Drops the duplicated
 * nested `evidence` blob (same data as the flattened top-level fields) and
 * states each type's column names once instead of repeating them per
 * record -- where most of JSON's per-record overhead comes from for large
 * arrays of uniform-schema facts. TSV rather than CSV specifically because
 * raw call expressions/text fields routinely contain commas, which would
 * need proper quoting in CSV; tabs/newlines are rare in this data and are
 * simply replaced with a space rather than escaped, since exact
 * preservation of embedded whitespace has no narrative value here.
 */
export function factsToCompactTable(facts: any[]): string {
  const byType = new Map<string, any[]>();
  for (const f of facts) {
    const list = byType.get(f.type) || [];
    list.push(f);
    byType.set(f.type, list);
  }

  const sanitizeCell = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.replace(/[\t\n\r]+/g, " ");
  };

  // Columns identical across every fact passed to this call are hoisted into
  // a one-line preamble instead of repeated on every row -- real, measured
  // finding 2026-08-30 (governance/roadmap/firebase-oskey-dev/09-fact-table-
  // redundancy-reduction.md): module/repo/runId were confirmed 100% constant
  // across all 3,155 facts in a real whole-module test, costing 8.5% of the
  // entire table for zero new information. Detected dynamically (not
  // hardcoded to assume these 3 are always constant) so this stays correct
  // if a future caller ever combines facts across modules/runs -- in that
  // case nothing is hoisted and every column still renders per-row exactly
  // as before. `type` is handled separately below: it's always constant
  // WITHIN a section by construction (that's what defines the section), and
  // already stated once via the "## <type> (<count>)" header immediately
  // above every row that would otherwise repeat it.
  const HOISTABLE_CANDIDATES = ["module", "repo", "runId"];
  const hoisted: Record<string, string> = {};
  if (facts.length > 0) {
    for (const col of HOISTABLE_CANDIDATES) {
      const values = new Set(facts.map(f => sanitizeCell(f[col])));
      if (values.size === 1) hoisted[col] = Array.from(values)[0];
    }
  }

  const sections: string[] = [];
  const preambleParts = Object.entries(hoisted).map(([k, v]) => `${k}=${v}`);
  if (preambleParts.length > 0) {
    sections.push(`(Every fact below shares: ${preambleParts.join(", ")} -- these columns are omitted from each row.)`);
  }

  for (const [type, items] of Array.from(byType.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const cols = new Set<string>();
    for (const it of items) {
      for (const k of Object.keys(it)) {
        if (k !== "evidence" && k !== "type" && !(k in hoisted)) cols.add(k);
      }
    }
    const columns = Array.from(cols).sort();

    const lines: string[] = [`## ${type} (${items.length})`, columns.join("\t")];
    for (const it of items) {
      lines.push(columns.map(c => sanitizeCell(it[c])).join("\t"));
    }
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}

/** Additive, opt-in variant of factsToCompactTable -- NOT wired into any
 * live caller yet (capability-synthesis.ts's production path is untouched).
 * Real, measured finding 2026-08-30 (governance/roadmap/firebase-oskey-dev/
 * 09-fact-table-redundancy-reduction.md): the `id` column alone was 35.2%
 * of a real 2.1M-char whole-module table, much of it duplicating data
 * already present in OTHER columns on the same row (module, file,
 * class+method). Replaces `id` with a short, per-table-only sequential
 * reference (F1, F2, ...) the model cites instead of the full fact ID.
 * idMap is the caller's responsibility to keep alongside the table and pass
 * to restoreFactIdCitations() once the LLM response comes back -- this
 * function does not persist or expose the mapping any other way. The real
 * fact ID (`id`, e.g. `call_expression|organization|...|#1`) remains the
 * one stable, durable identity for a fact everywhere else in this pipeline
 * (evidence graphs, provenance sidecars, any future fact-to-workflow
 * indexing) -- this short reference only ever exists for the lifetime of
 * one prompt/response round-trip, never written to disk on its own. */
export function factsToCompactTableShortIds(facts: any[]): { table: string; idMap: Record<string, string> } {
  const idMap: Record<string, string> = {};
  const shortIdByRealId = new Map<string, string>();
  let counter = 0;
  for (const f of facts) {
    if (!f.id || shortIdByRealId.has(f.id)) continue;
    counter += 1;
    const shortId = `F${counter}`;
    idMap[shortId] = f.id;
    shortIdByRealId.set(f.id, shortId);
  }

  const factsWithShortIds = facts.map(f => (f.id && shortIdByRealId.has(f.id) ? { ...f, id: shortIdByRealId.get(f.id) } : f));
  const table = factsToCompactTable(factsWithShortIds);
  return { table, idMap };
}

// The model's real, observed citation format (matching this pipeline's own
// convention seen throughout every existing capability/reduce output) nests
// a single-backtick code span inside an outer double-backtick delimiter,
// with CommonMark-mandated padding spaces around content that itself starts
// or ends with a backtick: `` `F123` `` -- literally backtick-backtick,
// space, backtick, F123, backtick, space, backtick-backtick. A first version
// of this regex assumed no spacing and no inner backticks and silently
// matched nothing real, found 2026-08-30 during a real end-to-end test.
const SHORT_FACT_ID_PATTERN = /`{2}\s*`(F\d+)`\s*`{2}/g;

/** Reverses factsToCompactTableShortIds' substitution: scans the LLM's
 * response for double-backtick-wrapped short references and replaces each
 * with its real fact ID from idMap, so the persisted document and every
 * downstream consumer (citation-validator.ts, provenance sidecars) sees
 * real, verifiable fact IDs -- never the short reference, which was never
 * meant to survive past this one substitution. A short ID the model wrote
 * that isn't in idMap (should not happen if idMap is the same one built
 * for this exact prompt, but not assumed) is left untouched rather than
 * silently dropped -- it then shows up as a citation-validator
 * file-not-found finding, the same fail-loud posture this pipeline already
 * uses for every other citation problem, not a new, quieter failure mode. */
// Real, recurring pattern found 2026-08-30 across a full 12-module real
// batch: 20 malformed range citations (`` `F150-F157` `` etc.) across the
// two largest modules (organization: 14, user: 6) -- not a rare one-off,
// scales with real output volume/citation count. The contract explicitly
// forbids this, but a model shortcut for citing several adjacent facts at
// once recurs anyway. Rather than only detecting it (findUnrestoredShort
// IdCitations already does that), expand it into one real, resolvable
// citation per fact in the range -- more citations than the model
// intended to write, but every one of them verifiable, which is strictly
// better than a silent, unverifiable range surviving into the final text.
// Inner single-backtick wrapper made optional 2026-08-31: found at
// temperature 0.4 (never seen at 0.0 or 0.2 in any prior real run) --
// `` F493-F496 `` with NO inner backticks at all, not just the previously
// -handled ``\`F493-F496\``` nested form. Same tolerance style already used
// by FACT_ID_CITATION_BLOCK_PATTERN/FILE_LINE_CITATION_BLOCK_PATTERN below.
const SHORT_ID_RANGE_PATTERN = /`{2}\s*`?F(\d+)-F(\d+)`?\s*`{2}/g;
// A range this large is far outside anything observed in real data (the
// biggest real one was 25 facts) -- almost certainly a different kind of
// model error, not a genuine "cite this whole contiguous block" shortcut.
// Left unexpanded (and thus still caught by findUnrestoredShortIdCitations)
// rather than silently generating an enormous citation list.
const MAX_EXPANDABLE_RANGE_SIZE = 100;

/** Expands a malformed short-ID range citation into one real citation per
 * fact in the range, in the same nested-backtick format restoreFactIdCit
 * ations already expects -- call this BEFORE restoreFactIdCitations so
 * every expanded reference gets resolved to a real fact ID the normal way. */
export function expandShortIdRangeCitations(text: string): string {
  return text.replace(SHORT_ID_RANGE_PATTERN, (match, lowStr, highStr) => {
    const low = parseInt(lowStr, 10);
    const high = parseInt(highStr, 10);
    if (high < low || high - low + 1 > MAX_EXPANDABLE_RANGE_SIZE) return match;
    const expanded: string[] = [];
    for (let i = low; i <= high; i++) expanded.push(`\`\` \`F${i}\` \`\``);
    return expanded.join(" ");
  });
}

export function restoreFactIdCitations(text: string, idMap: Record<string, string>): string {
  return text.replace(SHORT_FACT_ID_PATTERN, (match, shortId) => {
    const realId = idMap[shortId];
    // Reproduces the same nested-backtick convention the match itself used
    // (and that every existing real capability/reduce output already uses)
    // so citation-validator.ts's single-backtick FACT_ID_PATTERN finds the
    // real ID afterward exactly the same way it always has.
    return realId ? `\`\` \`${realId}\` \`\`` : match;
  });
}

// Looser than SHORT_FACT_ID_PATTERN on purpose: catches a malformed short-ID
// citation attempt SHORT_FACT_ID_PATTERN itself won't match and therefore
// won't restore -- e.g. the model writing a range (`` `F201-F203` ``)
// instead of one reference per citation. A real occurrence found 2026-08-30:
// restoreFactIdCitations left it completely untouched, AND it's invisible
// to citation-validator.ts too (its FACT_ID_PATTERN requires content to
// start with a known fact-type name, which "F201-F203" doesn't) -- so a
// malformed short-ID citation silently disappears from evidence tracking
// entirely rather than being flagged as fabricated or unverified. This is a
// visibility check, not a fix: run it AFTER restoreFactIdCitations and treat
// any match as a real problem worth surfacing (a notification, a thrown
// error, or at minimum a console warning), not something to silently
// tolerate.
const UNRESTORED_SHORT_ID_PATTERN = /`{2}\s*`?[^`]*\bF\d+[^`]*`?\s*`{2}/g;

/** Returns every remaining short-ID-looking fragment after
 * restoreFactIdCitations has already run -- an empty array means every
 * short-ID citation the model wrote was cleanly restored to a real fact ID.
 * A non-empty array means at least one citation is now silent, unverifiable
 * text in what should be a fully fact-checked document. */
export function findUnrestoredShortIdCitations(restoredText: string): string[] {
  return Array.from(restoredText.matchAll(UNRESTORED_SHORT_ID_PATTERN)).map(m => m[0]);
}

// --- Footnote-style citation rendering -----------------------------------
//
// Real, user-driven finding 2026-08-30: a document with dense inline fact-ID
// citations (this pipeline's real, current convention -- see
// citation-validator.ts's own header comment) is dramatically harder to read
// than an old (2026-08-01) reference document that used no inline citations
// at all, just Confirmed/Inferred tags. Removing citations isn't the answer
// -- that document's claims aren't independently checkable, which defeats
// the entire point of citation-validator.ts and the generate-then-verify
// discipline this pipeline is built around. The fix: keep every citation
// fully real and checkable, but move the verbose fact-ID/file-line text out
// of the readable prose into a numbered evidence appendix, same convention
// as an academic paper's footnotes/endnotes -- "(FactId:#001)" inline, the
// real citation content listed once at the end. Applies uniformly to BOTH
// citation sources in an assembled module-level document: the LLM's own
// text (already real fact IDs by the time this runs, after
// restoreFactIdCitations) and the deterministically-assembled sections
// (buildPublicInterfacesSection etc.), which write real fact IDs directly
// with no short-ID indirection at all.

export type EvidenceAppendixEntry =
  | { marker: number; kind: "fact-id"; factId: string }
  | { marker: number; kind: "file-line"; file: string; linesClause: string };

// Matches a fact-ID citation in EITHER of this pipeline's two real observed
// wrappings: the nested, CommonMark-padded form an LLM naturally produces
// when told to wrap something in double backticks that itself needs single
// backticks (`` `realId` ``), and the plain form this pipeline's own
// deterministic-assembly code (buildPublicInterfacesSection etc.) emits
// directly (``realId``) with no inner backtick or padding at all.
const FACT_ID_CITATION_BLOCK_PATTERN =
  /`{2}\s*`?((?:model_property|api_contract|call_expression|imports_dependency|firestore_path_touched|firestore_trigger|permission_candidate|permission_error|external_hook|pubsub_topic|pubsub_publish_call|pubsub_event_route|source_class|service_method|controller_method|class_method|type_alias|enum_declaration|source_file|exported_symbol|function_declaration)\|[^`]+)`?\s*`{2}/g;

// Same two-wrapping tolerance, for the file+line citation form (see
// citation-validator.ts's own FILE_LINE_PATTERN, which this mirrors at the
// single-backtick level). Real bug found 2026-08-30: an earlier version of
// this pattern assumed the outer double-backtick (when present) always
// closes BEFORE the "(lines N-M)" parenthetical -- the real, observed
// structure is `` `file.ts` (line 37) `` with the outer close coming AFTER
// the parenthetical instead, leaving a dangling "``" artifact in the
// rendered document when the old pattern only matched part of it. The
// inner single-backtick-wrapped file path is always mandatory (matching
// citation-validator's own convention exactly); the outer double-backtick
// wrapper is optional on EITHER side independently, since which side (if
// any) an LLM adds it on isn't something to assume.
const FILE_LINE_CITATION_BLOCK_PATTERN = /(`{2}\s*)?`([^`\s]+\.(?:ts|js))`\s*\(([^)]*\blines?\b[^)]*)\)(\s*`{2})?/gi;

/** Rewrites every fact-ID and file-line citation in an already-assembled
 * document into a short "(FactId:#NNN)" marker, deduplicated by the real
 * citation content (the same fact or file:line cited twice gets the same
 * marker, not two appendix entries) -- and returns the ordered appendix
 * listing what each marker really points to. Call this LAST, after all
 * other assembly (restoreFactIdCitations, deterministic section building)
 * is done, so it sees every citation in the document regardless of which
 * stage produced it. */
export function renderCitationsAsFootnotes(text: string): { body: string; appendix: EvidenceAppendixEntry[] } {
  const markerByKey = new Map<string, number>();
  const appendix: EvidenceAppendixEntry[] = [];
  let nextMarker = 1;

  const markerFor = (key: string, build: (marker: number) => EvidenceAppendixEntry): number => {
    let marker = markerByKey.get(key);
    if (marker === undefined) {
      marker = nextMarker++;
      markerByKey.set(key, marker);
      appendix.push(build(marker));
    }
    return marker;
  };
  const label = (marker: number) => `(FactId:#${String(marker).padStart(3, "0")})`;

  let body = text.replace(FACT_ID_CITATION_BLOCK_PATTERN, (match, factId) => {
    const marker = markerFor(`fact-id::${factId}`, m => ({ marker: m, kind: "fact-id", factId }));
    return label(marker);
  });
  body = body.replace(FILE_LINE_CITATION_BLOCK_PATTERN, (match, _outerOpen, file, linesClause) => {
    const marker = markerFor(`file-line::${file}::${linesClause.trim()}`, m => ({ marker: m, kind: "file-line", file, linesClause: linesClause.trim() }));
    return label(marker);
  });

  return { body, appendix };
}

/** Renders the appendix as the document's real Section 14 (Evidence
 * References) content -- a real, complete list, not the promissory "see
 * inline citations above" note every current document (old and new alike)
 * writes instead. */
export function formatEvidenceAppendix(appendix: EvidenceAppendixEntry[]): string {
  if (appendix.length === 0) return "(no citations in this document)";
  return appendix
    .map(e => (e.kind === "fact-id" ? `- #${String(e.marker).padStart(3, "0")} -- \`${e.factId}\`` : `- #${String(e.marker).padStart(3, "0")} -- \`${e.file}\` (${e.linesClause})`))
    .join("\n");
}

/** Reverses renderCitationsAsFootnotes for validation purposes only -- never
 * persisted. Exists so citation-validator.ts's existing FACT_ID_PATTERN/
 * FILE_LINE_PATTERN-based checks can run completely unmodified against a
 * footnoted document, the same way they already do against inline-cited
 * output: rebuild a real-citation-inline version in memory, validate that,
 * throw the reconstruction away. */
export function resolveFootnotesForValidation(body: string, appendix: EvidenceAppendixEntry[]): string {
  const byMarker = new Map(appendix.map(e => [e.marker, e]));
  return body.replace(/\(FactId:#(\d+)\)/g, (match, markerStr) => {
    const entry = byMarker.get(parseInt(markerStr, 10));
    if (!entry) return match;
    return entry.kind === "fact-id" ? `\`${entry.factId}\`` : `\`${entry.file}\` (${entry.linesClause})`;
  });
}

/** Inserts a blank line between consecutive TOP-LEVEL bullet points (no
 * leading whitespace) so a narrative bullet list reads like separate
 * paragraphs instead of a dense block -- real, user-requested readability
 * fix 2026-08-30, measured negligible cost repo-wide (~4.7KB total across
 * every module's real bullet count, against hundreds of KB of real document
 * content). Deliberately does NOT touch INDENTED sub-bullets (e.g. Section
 * 4's per-class method enumerations, "  - `methodName` ..."), which are a
 * dense reference listing, not narrative prose, and would just get longer
 * to scroll through for no reading benefit -- matched by anchoring on `^`
 * (line start) with no leading whitespace allowed before the bullet marker. */
export function addBlankLinesBetweenTopLevelBullets(text: string): string {
  return text.replace(/^(-\s.+)\n(?=-\s)/gm, "$1\n\n");
}

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
      data.includes("/Users/") ||
      data.includes("/home/") ||
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

  const sections: string[] = [];
  for (const [type, items] of Array.from(byType.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const cols = new Set<string>();
    for (const it of items) {
      for (const k of Object.keys(it)) {
        if (k !== "evidence") cols.add(k);
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

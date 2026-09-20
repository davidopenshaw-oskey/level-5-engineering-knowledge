// Real, explicit, opt-in Postgres query tracer for FULL_DEBUG runs (see
// governance/roadmap/dynamic-pipeline-architecture/ for the real request
// this satisfies: tracing every raw SQL query + its real returned rows, not
// just the tool-level input/output atomic-prd-agent.ts's own
// debugLogToolCall already captures one layer up). Off by default (the
// module-level sink is null until a caller explicitly activates it), zero
// effect on a normal run -- same "opt-in, no effect unless set" discipline
// as atomic-prd-agent.ts's own DEBUG_TOOL_LOG.
//
// A plain mutable module-level variable, not a class or context object:
// this process is always exactly one run (one node invocation per run, same
// real assumption atomic-prd-agent.ts's own seenFactRefs/memoization
// comments already document), so there is no concurrent-run-within-one-
// process case to guard against.
import fs from "fs";
import path from "path";

let activeDir: string | null = null;
let seq = 0;

export function setQueryTraceDir(dir: string | null): void {
  activeDir = dir;
  seq = 0;
}

export function traceQuery(sql: string, params: unknown[], rows: unknown[]): void {
  if (!activeDir) return;
  seq++;
  const record = { ts: new Date().toISOString(), seq, sql, params, rowCount: rows.length, rows };
  fs.appendFileSync(path.join(activeDir, "postgres-queries.jsonl"), JSON.stringify(record) + "\n", "utf8");
}

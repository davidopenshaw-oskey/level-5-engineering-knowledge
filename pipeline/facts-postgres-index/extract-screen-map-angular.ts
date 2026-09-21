// **version:** 1.0.0
// **location:** level-5 P2 facts index (screen-map extraction)
// © Oskey SAS. All rights reserved.
//
// Real script behind governance/reference-docs/screen-map-angular-features.json,
// written up per governance/roadmap/dynamic-pipeline-architecture/32-build-
// prompt-screen-map-extraction-2026-09-21.md. Turns the real, already-existing
// `angular_route` facts for angular-app-oskey-io into a human-editable JSON
// "screen map" -- route/component -> plain-English screen description, with
// `screenName`/`description` left for a human to fill in.
//
// Module is NOT hardcoded to 'features' despite that being the only real
// module with `angular_route` facts as of 2026-09-21 (confirmed: `SELECT
// module, COUNT(*) FROM facts WHERE repo = 'angular-app-oskey-io' AND kind =
// 'angular_route' GROUP BY module` returned exactly one row, 'features',
// 59 facts) -- per this project's own real, checked convention (extraction
// code must walk real structure, never assume a fixed list; devs add things
// on the next merge), this script queries every module with angular_route
// facts and will pick up a second module automatically the day one exists,
// no code change required.
//
// Idempotent, merge-aware re-run: preserves any already-filled
// screenName/description for a route+submodule pair that still exists in
// Postgres; only ever adds `null` for genuinely new routes. Routes that
// existed in the previous output but no longer match live Postgres are kept
// (not silently dropped -- a human's filled-in work on a real, if currently
// removed, route shouldn't vanish) but flagged loudly on stderr so a human
// notices and decides whether to delete the row.
//
// Run: node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-angular.ts
// Real spend: zero (Postgres read + local file read/write only).

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

const PROJECT_ROOT = process.cwd();
const REPO_NAME = "angular-app-oskey-io";
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ??
  path.join(PROJECT_ROOT, "governance", "reference-docs", "screen-map-angular-features.json");

function pool(): Pool {
  return new Pool({
    host: process.env.PG_HOST ?? "localhost",
    port: Number(process.env.PG_PORT ?? 5433),
    user: process.env.PG_USER ?? "facts_index",
    password: process.env.PG_PASSWORD ?? "local_dev_only",
    database: process.env.PG_DATABASE ?? "facts_index",
  });
}

interface ScreenMapEntry {
  route: string;
  module: string;
  submodule: string | null;
  component: string | null;
  file: string;
  realContext: string;
  screenName: string | null;
  description: string | null;
}

// description shape, confirmed in real sync-facts.ts output:
// "angular_route in <module>/<submodule>: <route|(unnamed)> -- <realContext...> (<file>:<line>)"
function parseRealContext(description: string, route: string, module: string, submodule: string | null): string {
  const routeLabel = route === "" ? "(unnamed)" : route;
  const label = submodule ? `${module}/${submodule}` : module;
  const prefix = `angular_route in ${label}: ${routeLabel} -- `;
  if (!description.startsWith(prefix)) {
    throw new Error(
      `[Fail-Closed] angular_route description shape has drifted from what this script expects.\n  expected prefix: ${prefix}\n  actual: ${description}\n  Re-check sync-facts.ts's angular_route enrichment before trusting this script's output.`
    );
  }
  return description.slice(prefix.length).replace(/\s+\([^)]+\)$/, "");
}

function extractComponent(realContext: string): string | null {
  const m = realContext.match(/renders: (\S+)/);
  return m ? m[1] : null;
}

// Natural merge key: route+submodule, NOT file:line -- a route's file:line
// shifts with unrelated code changes above it in the same .routes.ts file,
// which would otherwise falsely orphan a human's filled-in screenName on
// every unrelated edit. Confirmed safe against the real 2026-09-21 data:
// every route+submodule collision in the live 59 facts was already a
// cross-submodule case (submodule disambiguates it), never a true same-
// submodule duplicate.
function naturalKey(e: Pick<ScreenMapEntry, "route" | "submodule">): string {
  return `${e.route}::${e.submodule ?? ""}`;
}

async function main() {
  const db = pool();
  try {
    const moduleRows = await db.query<{ module: string; count: string }>(
      `SELECT module, COUNT(*) AS count FROM facts WHERE repo = $1 AND kind = 'angular_route' GROUP BY module ORDER BY module`,
      [REPO_NAME]
    );
    if (moduleRows.rows.length === 0) {
      throw new Error(`[Fail-Closed] No angular_route facts found for ${REPO_NAME} at all -- refusing to write an empty screen map.`);
    }
    console.log(`Real angular_route facts by module: ${moduleRows.rows.map(r => `${r.module}=${r.count}`).join(", ")}`);
    if (moduleRows.rows.length > 1) {
      console.log(`NOTE: more than one module now has angular_route facts -- this is new since the 2026-09-21 extraction (was 'features' only). All are included below.`);
    }

    const rows = await db.query<{
      symbol_name: string | null;
      module: string;
      submodule: string | null;
      file: string;
      line: number;
      description: string;
    }>(
      `SELECT symbol_name, module, submodule, file, line, description
       FROM facts
       WHERE repo = $1 AND kind = 'angular_route'
       ORDER BY module, file, line`,
      [REPO_NAME]
    );

    const fresh: ScreenMapEntry[] = rows.rows.map(r => {
      const route = r.symbol_name ?? "";
      const realContext = parseRealContext(r.description, route, r.module, r.submodule);
      return {
        route,
        module: r.module,
        submodule: r.submodule,
        component: extractComponent(realContext),
        file: `${r.file}:${r.line}`,
        realContext,
        screenName: null,
        description: null,
      };
    });

    // --- duplicate/ambiguity report, matches this project's own fail-loud
    // convention (build-cross-repo-edges.ts's compound-key join) --
    // reported, never silently resolved.
    const byRoute = new Map<string, ScreenMapEntry[]>();
    for (const e of fresh) {
      const list = byRoute.get(e.route) ?? [];
      list.push(e);
      byRoute.set(e.route, list);
    }
    for (const [route, list] of byRoute) {
      if (list.length > 1) {
        console.log(`  route "${route || "(unnamed)"}" appears ${list.length}x across: ${list.map(e => e.submodule ?? "(root)").join(", ")}`);
      }
    }

    // --- merge with existing output, preserving human-filled fields ---
    let existing: ScreenMapEntry[] = [];
    if (fs.existsSync(OUTPUT_PATH)) {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
    }
    const existingByKey = new Map(existing.map(e => [naturalKey(e), e]));
    const freshKeys = new Set(fresh.map(naturalKey));

    const merged = fresh.map(e => {
      const prior = existingByKey.get(naturalKey(e));
      if (prior && (prior.screenName !== null || prior.description !== null)) {
        return { ...e, screenName: prior.screenName, description: prior.description };
      }
      return e;
    });

    const stale = existing.filter(e => !freshKeys.has(naturalKey(e)));
    if (stale.length > 0) {
      console.error(`WARNING: ${stale.length} route(s) from the previous output no longer match live Postgres facts -- kept in the output, NOT silently dropped, but flagged for human review:`);
      for (const s of stale) {
        console.error(`  - route "${s.route || "(unnamed)"}" (${s.submodule ?? "(root)"}), had screenName="${s.screenName}" -- real route may have been renamed/removed`);
      }
      merged.push(...stale);
    }

    const preservedCount = merged.filter(e => e.screenName !== null).length;
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + "\n");
    console.log(`Wrote ${merged.length} real routes to ${OUTPUT_PATH} (${preservedCount} with a preserved human-filled screenName, ${merged.length - preservedCount} awaiting one).`);
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

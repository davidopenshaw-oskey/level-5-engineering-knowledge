// **version:** 1.0.0
// **location:** level-5 P2 facts index (screen-map extraction)
// © Oskey SAS. All rights reserved.
//
// Real script behind governance/reference-docs/screen-map-ios.json, written
// up per governance/roadmap/dynamic-pipeline-architecture/33-build-prompt-
// screen-map-extraction-ios-android-2026-09-21.md.
//
// ios-oskey-dev has no dedicated route/screen fact kind (unlike Angular's
// `angular_route`) -- real screens here are SwiftUI `struct_declaration`
// facts that conform to `View`. The real, checked discriminator is a naming
// convention, verified against the live 2026-09-21 data, not assumed:
//   - naive "ends with Screen" alone: 74 candidates, 0 leaked SwiftUI
//     preview helpers (`*_Previews`/`*Preview`) -- clean on its own terms.
//   - but real screens also exist named `*ScreenView` (8 real cases, e.g.
//     the OSKSesamePlus* family) and `*ScreeniOS16` (4 real OS-version
//     variant pairs, e.g. OSKActivityContentScreen / …ScreeniOS16) -- a
//     strict "ends with Screen" filter silently misses both.
//   - the regex below (/Screen(View)?(iOS\d+)?$/) was checked against
//     every one of the 260 real View-conforming struct_declaration facts
//     that day: 88 matched, 0 leaked previews (confirmed via
//     /preview/i.test(name) on the matched set), and a manual read of the
//     172 non-matches found nothing that looked like a missed top-level
//     screen (mostly Row/Card/Label/Form-style subcomponents).
//
// No hardcoded include/exclude list of any kind -- this regex reproduced
// the full, manually-verified 88-entry set exactly. A genuinely new naming
// convention (neither *Screen, *ScreenView, nor *ScreeniOS\d+) would still
// be missed by a re-run; that's a real, honest limitation of a naming-based
// heuristic, not something this script tries to paper over.
//
// Idempotent, merge-aware re-run: preserves any already-filled
// screenName/description for a screenSymbol that still exists in Postgres
// (struct names confirmed unique per repo -- 0 duplicates in the real
// 2026-09-21 data). New structs get `null`; structs that disappear from a
// live query are kept (not silently dropped) but flagged loudly on stderr.
//
// Run: node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-ios.ts
// Real spend: zero (Postgres read + local file read/write only).

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

const PROJECT_ROOT = process.cwd();
const REPO_NAME = "ios-oskey-dev";
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ??
  path.join(PROJECT_ROOT, "governance", "reference-docs", "screen-map-ios.json");

// Real, checked 2026-09-21 (see file header) -- not "ends with Screen"
// alone, which misses the *ScreenView and *ScreeniOS16 families.
const SCREEN_NAME_RE = /Screen(View)?(iOS\d+)?$/;

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
  screenSymbol: string;
  kind: "struct_declaration";
  file: string;
  realContext: string;
  screenName: string | null;
  description: string | null;
}

// description shape, confirmed in real sync-facts.ts output:
// "struct_declaration in <module>: <symbolName> -- <realContext...> (<file>:<line>)"
function parseRealContext(description: string, symbolName: string, module: string): string {
  const prefix = `struct_declaration in ${module}: ${symbolName} -- `;
  if (!description.startsWith(prefix)) {
    throw new Error(
      `[Fail-Closed] struct_declaration description shape has drifted from what this script expects.\n  expected prefix: ${prefix}\n  actual: ${description}\n  Re-check sync-facts.ts's struct_declaration enrichment before trusting this script's output.`
    );
  }
  return description.slice(prefix.length).replace(/\s+\([^)]+\)$/, "");
}

async function main() {
  const db = pool();
  try {
    const rows = await db.query<{
      symbol_name: string;
      module: string;
      file: string;
      line: number;
      description: string;
    }>(
      `SELECT symbol_name, module, file, line, description
       FROM facts
       WHERE repo = $1 AND kind = 'struct_declaration'
         AND description LIKE '%conforms to/extends: View%'
       ORDER BY symbol_name`,
      [REPO_NAME]
    );

    const candidates = rows.rows.filter(r => SCREEN_NAME_RE.test(r.symbol_name));
    console.log(`${rows.rows.length} real View-conforming struct_declaration facts checked, ${candidates.length} matched the screen naming convention.`);

    // Real, cheap sanity check every re-run, not just the one-time manual
    // check in the header comment: refuse to silently ship a preview
    // helper if the regex or the codebase's naming ever drifts.
    const previewLeak = candidates.filter(r => /preview/i.test(r.symbol_name));
    if (previewLeak.length > 0) {
      throw new Error(
        `[Fail-Closed] ${previewLeak.length} matched candidate(s) look like SwiftUI preview helpers, not real screens: ${previewLeak.map(r => r.symbol_name).join(", ")}. The naming convention this script relies on may have drifted -- do not trust this output until checked by hand.`
      );
    }

    const dupes = new Map<string, number>();
    for (const c of candidates) dupes.set(c.symbol_name, (dupes.get(c.symbol_name) ?? 0) + 1);
    const realDupes = [...dupes.entries()].filter(([, n]) => n > 1);
    if (realDupes.length > 0) {
      throw new Error(`[Fail-Closed] Duplicate screenSymbol value(s) found, which this script's merge key assumes can't happen: ${realDupes.map(([n]) => n).join(", ")}. Investigate before trusting the merge below.`);
    }

    const fresh: ScreenMapEntry[] = candidates.map(r => ({
      screenSymbol: r.symbol_name,
      kind: "struct_declaration",
      file: `${r.file}:${r.line}`,
      realContext: parseRealContext(r.description, r.symbol_name, r.module),
      screenName: null,
      description: null,
    }));

    // --- merge with existing output, preserving human-filled fields ---
    let existing: ScreenMapEntry[] = [];
    if (fs.existsSync(OUTPUT_PATH)) {
      existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
    }
    const existingBySymbol = new Map(existing.map(e => [e.screenSymbol, e]));
    const freshSymbols = new Set(fresh.map(e => e.screenSymbol));

    const merged = fresh.map(e => {
      const prior = existingBySymbol.get(e.screenSymbol);
      if (prior && (prior.screenName !== null || prior.description !== null)) {
        return { ...e, screenName: prior.screenName, description: prior.description };
      }
      return e;
    });

    const stale = existing.filter(e => !freshSymbols.has(e.screenSymbol));
    if (stale.length > 0) {
      console.error(`WARNING: ${stale.length} screen(s) from the previous output no longer match live Postgres facts -- kept in the output, NOT silently dropped, but flagged for human review:`);
      for (const s of stale) {
        console.error(`  - ${s.screenSymbol} (${s.file}), had screenName="${s.screenName}" -- real struct may have been renamed/removed/moved out of the View-conforming set`);
      }
      merged.push(...stale);
    }

    const newCount = fresh.filter(e => !existingBySymbol.has(e.screenSymbol)).length;
    if (newCount > 0) {
      console.log(`${newCount} new screen(s) since the last run (screenName left null for human fill).`);
    }

    const preservedCount = merged.filter(e => e.screenName !== null).length;
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + "\n");
    console.log(`Wrote ${merged.length} real screens to ${OUTPUT_PATH} (${preservedCount} with a preserved human-filled screenName, ${merged.length - preservedCount} awaiting one).`);
  } finally {
    await db.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

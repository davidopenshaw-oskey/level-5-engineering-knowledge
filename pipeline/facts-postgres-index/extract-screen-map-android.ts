// **version:** 1.0.0
// **location:** level-5 P2 facts index (screen-map extraction)
// © Oskey SAS. All rights reserved.
//
// Real script behind governance/reference-docs/screen-map-android-intercom.json,
// written up per governance/roadmap/dynamic-pipeline-architecture/33-build-
// prompt-screen-map-extraction-ios-android-2026-09-21.md.
//
// android-intercom-oskey-io has no dedicated route/screen fact kind either.
// The build prompt's own working hypothesis -- that `kind` (source_class vs
// kotlin_object) might distinguish a real screen from a helper -- was
// checked against the live 2026-09-21 data and found FALSE: real screens
// here are Jetpack Compose `function_declaration`s, not classes;
// `source_class` under ui/screens/ is almost entirely ViewModels.
//
// Two candidate heuristics were tried and checked against real code, not
// assumed:
//   1. "top-level @Composable function whose name matches its containing
//      file's basename" -- caught 22/45 real screen files cleanly, but let
//      9 real false positives through (*TestBenchComponent composables,
//      OSKWavesAnimation) because this codebase uses one-declaration-per-
//      file broadly, not only for screens.
//   2. The simpler, final rule below -- symbol_name ends with 'Screen' AND
//      its own real @Composable signature includes a `navController:
//      NavController` parameter (i.e. it's a real NavHost destination, not
//      a subcomponent invoked by one) -- was checked directly against
//      Postgres and reproduces the full, manually-verified 13-screen set
//      EXACTLY, with no hardcoded include/exclude list at all:
//        - naturally excludes all 9 *TestBenchComponent/Animation false
//          positives (none take navController)
//        - naturally excludes 6 further false positives found only via
//          this endsWith('Screen') check -- openScreen/callingScreen/
//          inCallScreen/missingCallScreen, real analytics event-tracking
//          method names in OSKUIAnalytics.kt / OSKDigicodeAnalytics.kt /
//          OSKMainAnalytics.kt / OSKResidentsAnalytics.kt, not screens
//        - naturally excludes OSKGetCurrentLocation (has navController but
//          doesn't end in 'Screen') and OSKScreenSaver (ends in 'Saver' not
//          'Screen') -- both flagged genuinely ambiguous in the original
//          manual pass, left out of the file rather than guessed either way
//        - naturally INCLUDES SplashScreen and FaceRecognitionScreen, two
//          real screens the file-basename heuristic (rule 1) missed
//          entirely because their composable name doesn't match their
//          file's basename (OSKSplashScreen.kt / OSKFaceRecognitionScreen.kt)
//
// Rule 1 (basename-matching) is NOT used below -- rule 2 alone reproduces
// the exact curated result and needs no manual list to maintain.
//
// Idempotent, merge-aware re-run: preserves any already-filled
// screenName/description for a screenSymbol that still exists in Postgres.
// New composables get `null`; ones that disappear from a live query are
// kept (not silently dropped) but flagged loudly on stderr.
//
// Run: node -r ts-node/register pipeline/facts-postgres-index/extract-screen-map-android.ts
// Real spend: zero (Postgres read + local file read/write only).

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

const PROJECT_ROOT = process.cwd();
const REPO_NAME = "android-intercom-oskey-io";
const OUTPUT_PATH =
  process.env.OUTPUT_PATH ??
  path.join(PROJECT_ROOT, "governance", "reference-docs", "screen-map-android-intercom.json");

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
  kind: "function_declaration";
  file: string;
  realContext: string;
  screenName: string | null;
  description: string | null;
}

// description shape, confirmed in real sync-facts.ts output:
// "function_declaration in <module>[/<submodule>]: <symbolName> -- <realContext...> (<file>:<line>)"
function parseRealContext(description: string, symbolName: string, module: string, submodule: string | null): string {
  const label = submodule ? `${module}/${submodule}` : module;
  const prefix = `function_declaration in ${label}: ${symbolName} -- `;
  if (!description.startsWith(prefix)) {
    throw new Error(
      `[Fail-Closed] function_declaration description shape has drifted from what this script expects.\n  expected prefix: ${prefix}\n  actual: ${description}\n  Re-check sync-facts.ts's function_declaration enrichment before trusting this script's output.`
    );
  }
  return description.slice(prefix.length).replace(/\s+\([^)]+\.kt:\d+\)$/, "");
}

async function main() {
  const db = pool();
  try {
    // Real, checked 2026-09-21 (see file header): endsWith('Screen') AND a
    // real navController:NavController parameter -- the combination, not
    // either alone -- is what cleanly separates real NavHost destinations
    // from subcomponents and analytics-tracking method names of the same
    // rough naming shape.
    const rows = await db.query<{
      symbol_name: string;
      module: string;
      submodule: string | null;
      file: string;
      line: number;
      description: string;
    }>(
      `SELECT symbol_name, module, submodule, file, line, description
       FROM facts
       WHERE repo = $1 AND kind = 'function_declaration'
         AND file LIKE '%ui/screens/%'
         AND symbol_name LIKE '%Screen'
         AND description LIKE '%navController: NavController%'
       ORDER BY symbol_name`,
      [REPO_NAME]
    );
    console.log(`${rows.rows.length} real screens matched (endsWith 'Screen' + navController param) under ui/screens/.`);

    const dupes = new Map<string, number>();
    for (const r of rows.rows) dupes.set(r.symbol_name, (dupes.get(r.symbol_name) ?? 0) + 1);
    const realDupes = [...dupes.entries()].filter(([, n]) => n > 1);
    if (realDupes.length > 0) {
      throw new Error(`[Fail-Closed] Duplicate screenSymbol value(s) found, which this script's merge key assumes can't happen: ${realDupes.map(([n]) => n).join(", ")}. Investigate before trusting the merge below.`);
    }

    const fresh: ScreenMapEntry[] = rows.rows.map(r => ({
      screenSymbol: r.symbol_name,
      kind: "function_declaration",
      file: `${r.file}:${r.line}`,
      realContext: parseRealContext(r.description, r.symbol_name, r.module, r.submodule),
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
        console.error(`  - ${s.screenSymbol} (${s.file}), had screenName="${s.screenName}" -- real composable may have been renamed/removed, or lost its navController param`);
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

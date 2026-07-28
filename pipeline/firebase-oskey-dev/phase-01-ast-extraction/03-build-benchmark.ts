// **version:** 2.5.0
// **location:** level-5 phases 1, 2

// © Oskey SAS. All rights reserved.
// This script builds a benchmark for the knowledge pipeline, aggregating data from module manifests and evidence graphs to 
// provide an overview of the repository's structure and content.


import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

const runContextPath = path.join(projectRoot, "output", "run-context.json");
if (!fs.existsSync(runContextPath)) {
  throw new Error("Could not find run-context.json. Please run `00-scan-repo` first.");
}
const runContext = JSON.parse(fs.readFileSync(runContextPath, "utf8"));
const runId: string = runContext.runId;

const REPO_NAME: string = runContext.repoName;
if (!REPO_NAME) {
  throw new Error("Missing 'repoName' in output/run-context.json");
}
const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);

const modulesRoot = path.join(repoOutputDir, "knowledge-pipeline", "modules");
if (!fs.existsSync(modulesRoot)) {
  throw new Error(`Could not find modules directory at '${modulesRoot}'. Please run 02-build-module-evidence first.`);
}

const outputPath = path.join(repoOutputDir, "knowledge-pipeline", "benchmark.json");

type AnyRecord = { [key: string]: any };

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getModuleDirs() {
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isDirectory())
    .map((entry: fs.Dirent) => entry.name)
    .sort();
}

function main() {
  const moduleNames = getModuleDirs();

  const totals: Record<string, number> = {
    modules: moduleNames.length,
    facts: 0,
  };

  const benchmark = {
    generatedAt: new Date().toISOString(),
    runId: runId,
    modules: [] as AnyRecord[],
    totals,
    factsByType: {} as Record<string, number>,
    recommendedPocModules: [] as AnyRecord[],
  };

  for (const moduleName of moduleNames) {
    const moduleRoot = path.join(modulesRoot, moduleName);
    const manifestPath = path.join(moduleRoot, `${moduleName}-manifest.json`);
    const graphPath = path.join(moduleRoot, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(manifestPath) || !fs.existsSync(graphPath)) continue;

    const manifest = readJson<AnyRecord>(manifestPath);
    const graph = readJson<AnyRecord>(graphPath);

    const summary = (manifest.summary ?? {}) as Record<string, number>;
    const graphSummary = graph.summary ?? {};
    const countsByType = graphSummary.countsByType ?? {};

    const moduleBenchmark: Record<string, any> = {
      module: moduleName,
      facts: graphSummary.totalFacts ?? 0,
      factsByType: countsByType,
    };

    // Dynamically copy and aggregate all summary keys to totals
    for (const [key, value] of Object.entries(summary)) {
      moduleBenchmark[key] = value ?? 0;
      totals[key] = (totals[key] ?? 0) + (value ?? 0);
    }

    benchmark.modules.push(moduleBenchmark);
    totals.facts += graphSummary.totalFacts ?? 0;

    for (const [type, count] of Object.entries(countsByType)) {
      benchmark.factsByType[type] =
        (benchmark.factsByType[type] ?? 0) + Number(count);
    }
  }

  benchmark.recommendedPocModules = [...benchmark.modules]
    .filter(m => m.files > 0)
    .map(m => ({
      ...m,
      score:
        (m.services ?? 0) * 3 +
        (m.controllers ?? 0) * 2 +
        (m.firestoreHints ?? 0) +
        (m.permissionHints ?? 0) +
        Math.min((m.calls ?? 0) / 50, 20),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(benchmark, null, 2));

  console.log("Knowledge pipeline benchmark built");
  console.log(benchmark.totals);
  console.log(`Wrote ${outputPath}`);
}

main();
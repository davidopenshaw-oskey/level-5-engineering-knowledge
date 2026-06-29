import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const modulesRoot = path.join(projectRoot, "output/knowledge-pipeline/modules");
const outputPath = path.join(projectRoot, "output/knowledge-pipeline/benchmark.json");

type AnyRecord = { [key: string]: any };

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getModuleDirs() {
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function main() {
  const moduleNames = getModuleDirs();

  const benchmark = {
    generatedAt: new Date().toISOString(),
    modules: [] as AnyRecord[],
    totals: {
      modules: moduleNames.length,
      files: 0,
      imports: 0,
      exports: 0,
      classes: 0,
      methods: 0,
      functions: 0,
      calls: 0,
      services: 0,
      controllers: 0,
      firestoreHints: 0,
      permissionHints: 0,
      facts: 0,
    },
    factsByType: {} as Record<string, number>,
    recommendedPocModules: [] as AnyRecord[],
  };

  for (const moduleName of moduleNames) {
    const moduleRoot = path.join(modulesRoot, moduleName);
    const manifestPath = path.join(moduleRoot, `${moduleName}-manifest.json`);
    const filesPath = path.join(moduleRoot, `${moduleName}-files.json`);
    const graphPath = path.join(moduleRoot, `${moduleName}-evidence-graph.json`);

    if (!fs.existsSync(manifestPath) || !fs.existsSync(graphPath)) continue;

    const manifest = readJson<AnyRecord>(manifestPath);
    const graph = readJson<AnyRecord>(graphPath);

    const summary = manifest.summary ?? {};
    const graphSummary = graph.summary ?? {};
    const countsByType = graphSummary.countsByType ?? {};

    const moduleBenchmark = {
      module: moduleName,
      files: summary.files ?? 0,
      services: summary.services ?? 0,
      controllers: summary.controllers ?? 0,
      methods: summary.methods ?? 0,
      calls: summary.calls ?? 0,
      firestoreHints: summary.firestoreHints ?? 0,
      permissionHints: summary.permissionHints ?? 0,
      facts: graphSummary.totalFacts ?? 0,
      factsByType: countsByType,
    };

    benchmark.modules.push(moduleBenchmark);

    benchmark.totals.files += moduleBenchmark.files;
    benchmark.totals.imports += summary.imports ?? 0;
    benchmark.totals.exports += summary.exports ?? 0;
    benchmark.totals.classes += summary.classes ?? 0;
    benchmark.totals.methods += summary.methods ?? 0;
    benchmark.totals.functions += summary.functions ?? 0;
    benchmark.totals.calls += moduleBenchmark.calls;
    benchmark.totals.services += moduleBenchmark.services;
    benchmark.totals.controllers += moduleBenchmark.controllers;
    benchmark.totals.firestoreHints += moduleBenchmark.firestoreHints;
    benchmark.totals.permissionHints += moduleBenchmark.permissionHints;
    benchmark.totals.facts += moduleBenchmark.facts;

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
        m.services * 3 +
        m.controllers * 2 +
        m.firestoreHints +
        m.permissionHints +
        Math.min(m.calls / 50, 20),
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
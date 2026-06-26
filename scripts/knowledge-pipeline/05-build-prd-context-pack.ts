import fs from "fs";
import path from "path";

const projectRoot = process.cwd();

const outputRoot = path.join(projectRoot, "output/knowledge-pipeline");
const modulesRoot = path.join(outputRoot, "modules");
const contextPackRoot = path.join(outputRoot, "context-packs");

type AnyRecord = { [key: string]: any };

type ContextPackOptions = {
  requestId: string;
  title: string;
  productRequest: string;
  targetModules: string[];
  targetSubmodules?: string[];
};

const options: ContextPackOptions = {
  requestId: process.env.REQUEST_ID ?? "poc-supplier-staff-access",
  title:
    process.env.REQUEST_TITLE ??
    "POC Atomic PRD Context Pack - Supplier Staff Access",
  productRequest:
    process.env.PRODUCT_REQUEST ??
    "Create an atomic PRD for supplier staff access management using the available OSkey knowledge corpus evidence.",
  targetModules: (process.env.TARGET_MODULES ?? "supplier,building,access,organization")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
  targetSubmodules: (process.env.TARGET_SUBMODULES ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean),
};

const sourceDocs = [
  "/mnt/data/firestore-schema.md",
  "/mnt/data/OSkey Cloud & Firestore architecture.md",
  "/mnt/data/Oskey Personas and Authority models.md",
  "/mnt/data/Domain H Supplier - Phase 7 - Feature Maps.md",
  "/mnt/data/# Phase 8: AI Delivery Corpus — Domain H Supplier And Staff Add Screen.md",
].filter(fs.existsSync);

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function truncate(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;

  return [
    text.slice(0, maxChars),
    `\n\n[TRUNCATED: original length ${text.length} chars]`,
  ].join("");
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
}

function getFactsForPack(graph: AnyRecord, targetSubmodules?: string[]) {
  const facts = Array.isArray(graph.facts) ? graph.facts : [];

  const filteredFacts =
    targetSubmodules && targetSubmodules.length > 0
      ? facts.filter((f: AnyRecord) =>
          f.submodule ? targetSubmodules.includes(f.submodule) : true,
        )
      : facts;

  const priorityTypes = new Set([
    "source_file",
    "service_method",
    "controller_method",
    "firestore_path_touched",
    "permission_required",
    "imports_dependency",
    "exported_symbol",
  ]);

  return filteredFacts
    .filter((f: AnyRecord) => priorityTypes.has(f.type))
    .slice(0, 2500);
}

function main() {
  const benchmark = readJson<AnyRecord>(path.join(outputRoot, "benchmark.json"));

  const moduleEvidence = options.targetModules.map(moduleName => {
    const moduleRoot = path.join(modulesRoot, moduleName);

    return {
      module: moduleName,
      manifest: readJson<AnyRecord>(path.join(moduleRoot, "manifest.json")),
      services: readJson<AnyRecord[]>(path.join(moduleRoot, "services.json")) ?? [],
      controllers:
        readJson<AnyRecord[]>(path.join(moduleRoot, "controllers.json")) ?? [],
      evidenceGraphSummary:
        readJson<AnyRecord>(path.join(moduleRoot, "evidence-graph.json"))
          ?.summary ?? null,
      facts: getFactsForPack(
        readJson<AnyRecord>(path.join(moduleRoot, "evidence-graph.json")) ?? {},
        options.targetSubmodules,
      ),
    };
  });

  const documents = sourceDocs.map(filePath => ({
    path: filePath,
    name: path.basename(filePath),
    content: truncate(readText(filePath), 30000),
  }));

  const contextPack = {
    generatedAt: new Date().toISOString(),
    request: {
      id: options.requestId,
      title: options.title,
      productRequest: options.productRequest,
      targetModules: options.targetModules,
      targetSubmodules: options.targetSubmodules ?? [],
    },

    instructionsForCommercialLlm: {
      purpose:
        "Use this context pack to generate an atomic PRD. Treat deterministic evidence facts as source-of-truth. Treat source documents as supporting corpus material. Do not invent code behaviour not supported by evidence.",
      requiredOutput:
        "Atomic PRD with scope, non-goals, actors, authority model, UX/API/data requirements, acceptance criteria, QA scenarios, risks, and evidence references.",
      evidenceRules: [
        "Every technical claim should be traceable to moduleEvidence.facts or source documents.",
        "Do not convert inferred ownership into fact unless evidence supports it.",
        "Use cautious language for interpretation: 'appears to', 'likely', or 'requires confirmation'.",
        "If required evidence is missing, add it to open questions rather than inventing it.",
      ],
    },

    benchmarkSummary: benchmark?.totals ?? null,

    moduleEvidence,

    sourceDocuments: documents,

    outputContractSuggestion: {
      prdSections: [
        "Product Request",
        "Current System Evidence",
        "Actors and Authority",
        "Functional Requirements",
        "API / Cloud Requirements",
        "Firestore / Data Requirements",
        "UI Requirements",
        "Non-Goals",
        "Acceptance Criteria",
        "QA Scenarios",
        "Risks and Open Questions",
        "Evidence References",
      ],
    },
  };

  fs.mkdirSync(contextPackRoot, { recursive: true });

  const fileName = `${safeFileName(options.requestId)}.context-pack.json`;
  const outputPath = path.join(contextPackRoot, fileName);

  fs.writeFileSync(outputPath, JSON.stringify(contextPack, null, 2));

  console.log("PRD context pack built");
  console.log({
    requestId: options.requestId,
    targetModules: options.targetModules,
    documents: documents.length,
    modules: moduleEvidence.length,
    facts: moduleEvidence.reduce((sum, m) => sum + m.facts.length, 0),
  });
  console.log(`Wrote ${outputPath}`);
}

main();

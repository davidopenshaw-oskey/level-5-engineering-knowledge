# Level 5 Engineering Knowledge Repository

An LLM-agnostic, phase-aligned corpus for extracting, synthesizing, and reasoning over software engineering repositories at Level 5 maturity.

---

## Directory Architecture

```
.
├── rules/                             ◄── Vendor-Agnostic AI System Directives & Rules
├── governance/                        ◄── Knowledge Charters & Source Reference Specs
│   ├── charters/                      ◄── Phase Execution Charters
│   └── reference-docs/                ◄── Source Codebase Architecture & Schema Specs
├── pipeline/                          ◄── Phase-Aligned Scripts, Contracts, & Prompts
│   ├── phase-00-repo-scanner/         ◄── Repository SHA & Purity Scanner
│   ├── phase-01-ast-extraction/       ◄── AST Fact Stream & Evidence Graph Extraction
│   ├── phase-01.75-graph-resolution/  ◄── Deterministic Cross-Module Symbol & Data Resolution
│   ├── phase-02-inter-module-synthesis/◄── Inter-Module Architecture Synthesis
│   └── phase-05-atomic-prd-impact/    ◄── Global Impact Analysis & Atomic PRDs
├── config/                            ◄── System & Target Repository Configurations
├── output/                            ◄── Versioned Run Artifacts (Runs, Evidence, Graphs)
└── archive/                           ◄── Decommissioned Scripts & Legacy Papers
```

---

## Quick Start Pipeline Execution

```bash
# Run the complete phase-aligned pipeline end-to-end:
npm run pipeline:run

# Or run individual phase stages:
npm run 00-scan-repo
npm run 01-extract-ast-evidence
npm run 02-build-module-evidence
npm run 03-build-benchmark
npm run 04-build-resolved-graph
npm run 05-generate-profiles
```

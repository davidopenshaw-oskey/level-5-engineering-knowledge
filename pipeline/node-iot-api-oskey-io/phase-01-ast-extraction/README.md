# Phase 01: AST Fact Extraction (`/pipeline/phase-01-ast-extraction`)

This phase parses TypeScript source files via `ts-morph` to extract deterministic AST facts (exports, calls, methods, types, enums, Firestore hints) and construct per-module evidence graphs.

---

## Contents

- `01-extract-ast-evidence.ts`: Extracts raw AST fact JSON streams from source code.
- `02-build-module-evidence.ts`: Aggregates facts into per-module evidence graphs.
- `03-build-benchmark.ts`: Builds benchmark validation metrics.
- `contract-inv001.md`: Investigation contract for AST evidence discovery.

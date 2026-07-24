# Firebase OSkey Backend Pipeline (`/pipeline/firebase-oskey-dev`)

This directory houses the independent knowledge extraction and synthesis pipeline for the `firebase-oskey-dev` repository (Firebase Cloud Functions, Controllers, Services, Security Rules).

---

## Phase Lifecycle

- [`phase-00-repo-scanner/`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/pipeline/firebase-oskey-dev/phase-00-repo-scanner/): Scans git commit SHA and verifies clone purity.
- [`phase-01-ast-extraction/`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/pipeline/firebase-oskey-dev/phase-01-ast-extraction/): Parses TypeScript AST facts (calls, exports, type aliases, enums, API contracts).
- [`phase-01.75-graph-resolution/`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/pipeline/firebase-oskey-dev/phase-01.75-graph-resolution/): Programmatically resolves cross-module call edges, shared Firestore paths, and event routes.
- [`phase-02-inter-module-synthesis/`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/): Synthesizes module profiles and `INV-002 Architectural Topology Discovery`.

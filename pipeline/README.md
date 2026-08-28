# Knowledge Pipeline (`/pipeline`)

This directory contains repository-centric extraction and synthesis pipelines. Each target repository maintains its own independent phase lifecycle, allowing extractions and scripts to evolve decoupled from one another.

---

## Directory Architecture

```
pipeline/
├── firebase-oskey-dev/                   ◄── Firebase Backend Knowledge Pipeline
│   ├── phase-00-repo-scanner/
│   ├── phase-01-ast-extraction/
│   ├── phase-01.75-graph-resolution/
│   └── phase-02-inter-module-synthesis/
│
├── node-iot-api-oskey-io/                ◄── Node-IoT Middleware Knowledge Pipeline (Joi, MongoDB, Pub/Sub, ACDS)
│   ├── phase-00-repo-scanner/
│   └── phase-01-ast-extraction/
│
├── angular-app-oskey-io/                 ◄── Angular Pipeline (PGO Portal + Admin Portal, standalone components, Signals)
│   ├── phase-00-repo-scanner/
│   └── phase-01-ast-extraction/
│
└── cross-repo-synthesis/                ◄── Global Multi-Repo Ecosystem & Trace Maps
    ├── phase-03-ecosystem-topology/
    └── phase-05-atomic-prd-impact/
```

# Node-IoT Middleware Pipeline (`/pipeline/node-iot-oskey-dev`)

This directory houses the independent knowledge extraction and synthesis pipeline for the `node-iot-oskey-dev` repository (Node.js IoT middleware, Joi validation schemas, MongoDB models, ACDS hardware protocols).

---

## Phase Lifecycle

- `phase-00-repo-scanner/`: Scans git commit SHA and clone purity for the `node-iot` repository.
- `phase-01-ast-extraction/`: Parses Joi validation schemas, MongoDB Mongoose models, Firestore listeners, and socket/TCP hardware payload contracts.

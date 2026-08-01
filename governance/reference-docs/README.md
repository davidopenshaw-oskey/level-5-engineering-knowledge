# Reference Specifications (`/governance/reference-docs`)

This directory contains static, reference-level documentation and schema definitions extracted from target repositories.

---

## Snapshot Status

The files in this directory (schemas, indexes, Firestore rules, RBAC roles, architecture docs) are manual, point-in-time snapshots. They are not yet dynamically re-derived from the source repository. This is planned to change once Phase 1 (P1) reads a repo in dynamically — see `governance/roadmap/tasks.md`. Until then, treat the contents here as reflecting the state of the target repo at the time each file was captured, not necessarily its current state.

---

## Contents

- `firestore.rules.txt`: Security rules establishing database authorization constraints.
- `firestore-schema.md`: Firestore collection schemas and entity path structures.
- `rbac-roles.json`: Canonical role hierarchy and permission definitions.
- `Oskey Architecture.md`: High-level system architecture documentation.

# Angular PGO & Admin Portal Pipeline (`/pipeline/angular-pgo-oskey-dev`)

This directory houses the independent knowledge extraction and synthesis pipeline for the `angular-pgo-oskey-dev` repository (Angular Web Admin Portal, PGO frontend, RxJS state, Angular components, HTTP client services).

---

## Phase Lifecycle

- `phase-00-repo-scanner/`: Scans git commit SHA and clone purity for the `angular-pgo` repository.
- `phase-01-ast-extraction/`: Parses `@Component` definitions, `@Injectable` services, RxJS state actions, and `HttpClient` backend API endpoint URLs.

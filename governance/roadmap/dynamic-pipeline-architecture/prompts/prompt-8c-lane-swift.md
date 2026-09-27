# Prompt 8c: Lane C (Swift extraction) for the wiki-handoff extraction gaps

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing to files is fine; committing is not your call; only the user commits.**

**Mode: real build.** You are **Lane C** of three parallel sessions. Investigation and decisions are written down. If you find something that contradicts the spec, **stop and report it to the user**; don't quietly re-plan. If you're unsure whether something is in scope, it isn't: ask.

## Your lane

- **Item:** W4c (Swift Firestore path facts). Full text, evidence and acceptance checks are in the spec. Afterwards, coordinate W5c (the 151 dangling `INTRA_REPO_CALL` edges clear when the Swift kits are re-extracted and their edges rebuilt) with Lane A through a write turn.
- **You own (edit only these):** `pipeline/swift/**`, `pipeline/ios-oskey-dev/**`, and the Swift extractor binary (`swift-extractor/`).
- **You must not edit:** `pipeline/facts-postgres-index/**` (edge builders, `sync-facts.ts`, schema: **Lane A** owns them), `pipeline/firebase-oskey-dev/**`, `pipeline/angular-app-oskey-io/**` (**Lane B**), `package.json`. If a change is needed there, stop and write the request under "Interface contracts" in the spec.
- **You deliver facts, not edges.** The client ↔ firebase Firestore join (W4d) is Lane A's; you specify the facts and fields it needs.
- **Your client Firestore path fact shape must match Lane B's W4b (Angular).** Check "Interface contracts" in the spec first. If nothing is posted yet, post your proposal there; if Lane B posted one, adopt it unless you object in writing. One user approval covers both.

## Read first, in this order

1. `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`: **everything above `## Build log`**, especially "Lane model and DB write protocol", "Live-DB safeguards" and W4c. The spec wins over anything else.
2. `pipeline/README.md` and `pipeline/README_postgres.md`.
3. `governance/roadmap/downstream-app-feedback/2026-09-26-extraction-team.md` (the wiki handoff) and `2026-09-26-extraction-team-reply.md`. Their prompt file there is **superseded**.
4. `pipeline/swift/phase-01-ast-extraction/swift-extractor/Sources/swift-extractor/main.swift` (the SwiftSyntax visitor; the current enum visitor is at line 287 and records case names and associated-value types only) and steps `01-extract-ast-evidence.ts`, `02-build-module-evidence.ts` in the same folder.
5. The path enums: `output/clones/swift-cloud-kit-oskey-dev/Sources/OSKCloudKit/Firebase/Cloud Firestore/Models/Paths/OSKCKFirestoreCollectionPath.swift` and `OSKCKFirestoreDocumentPath.swift`. Each has a computed `var string: String { switch self { case .users: "/users" case let .userBuildingAccesses(userId): "/users/\(userId)/accesses" … } }`, i.e. string literals with `\(param)` interpolation in a switch body.

## Facts about this environment you must not get wrong

- **Facts DB:** container `facts-postgres-index-local`, database `facts_index`, user `facts_index`. Redirect stdin (`</dev/null` for `-c`, or `< file`) or `docker exec -i` can hang. **This is the live source of truth. There is no copy.** Other sessions and the downstream wiki read it.
- **The Swift extractor is one compiled binary shared by all 5 Swift repos** (`swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-ble-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`, and `ios-oskey-dev`). Rebuild with `swift build -c release` in `pipeline/swift/phase-01-ast-extraction/swift-extractor/` (arm64; Swift 6.4 is installed). `.build/` is gitignored. **Any visitor change can change facts for all five repos**, so the pre-sync ID gate must cover **all five** and you report any ID or description change before any of them is synced.
- **Sources:** the four kits are pinned to exact commits in `config/repos.json`; `ios-oskey-dev` tracks `master`. `00-scan-repo` deletes and re-clones; for `ios-oskey-dev` run `git ls-remote <gitUrl> refs/heads/master` first and compare with its run commit (`e660bda2`); if upstream moved, **stop and tell the user**. The pinned kits are unaffected.
- `fact_id` is opaque. Existing payload field names are never renamed, only added to (keep `evidence.cases[{name, associatedValues}]`).
- **Rules from CLAUDE.md that bind you:** always dynamic (discover from the data; no hand-typed lists of enum cases or paths); run cheap bounded tests first; keep a before baseline and compare; write findings as they happen; delete scratch scripts afterwards; **no LLM calls; do not run any `gcloud` command; flag any embedding spend with a count and token estimate and wait for the user's go-ahead.**

## What you may and may not do on the database

- **Always allowed:** read-only SQL; building the Swift binary; extraction (`npm run pipeline:swift-cloud-kit` etc., which write only under `output/`); the pre-sync fact-ID gate; `pg_dump` before you start.
- **Only in a write turn granted by the coordinator (via the user):** `sync-facts.ts`, any edge builder or `pipeline:edges`, schema changes, deleting rows, `EMBED=true`.
- **Do not sync before Lane A reports W5a done** (`pipeline:edges` exists).
- To request a write turn: finish extraction and the gate for all five Swift repos, append a `[Lane C] READY TO SYNC` entry to the Build log (gate numbers per repo, consequences of any changed ID, embedding estimate), and **stop**. The user will bring it to the coordinator and return with go or no-go.

## Procedure for W4c

1. **Investigate:** find the visitor and step-01/02 code responsible; check whether `ios-oskey-dev` calls Firestore directly or only through swift-cloud-kit (which it links to by `PACKAGE_SYMBOL_USE` edges). **Report honestly which it is; do not invent iOS-side facts.**
2. **Propose** the payload shape (path template stored additively on the enum-case facts, e.g. `evidence.cases[].pathTemplate`, with `\(param)` normalised to `{param}`; and the client call facts with path enum case, resolved template and operation get / set / update / delete / listen) under "Interface contracts" and **wait for approval**.
3. **Implement** in the visitor and steps 01/02; rebuild the binary; test on swift-cloud-kit first with a bounded run.
4. **Extract** the five repos, run the pre-sync gate on all five, request a write turn, and after go: dump, sync with `EMBED` off, flag embedding spend and wait, run `pipeline:edges`, read the coverage summary.
5. **Verify** against the spec's W4c acceptance with read-only SQL: every case of the two path enums has a template; swift-cloud-kit has client path facts with operation; existing Swift fact IDs unchanged or every change explained; the 151 dangling edges cleared or the remainder explained. Report **real numbers**; if a number differs from the spec, say so.
6. **Append** a dated `[Lane C]` entry to the Build log in doc 43 (append-only: `cat >> file <<'EOF'`, never rewrite the file), delete scratch scripts, and **stop and tell the user** so the validator session can check.

## Out of scope (don't touch)

The parked items in the spec; any real LLM run; any `gcloud` command; renaming or removing any existing payload field; anything Lane A or Lane B owns.

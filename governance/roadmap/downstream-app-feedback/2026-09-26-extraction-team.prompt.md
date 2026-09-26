# Prompt: Extraction Team Agent (2026-09-26)

> **Superseded 2026-09-26. Do not paste this prompt.** The build is run from
> `governance/roadmap/dynamic-pipeline-architecture/prompts/prompt-8-extraction-gaps-build.md`, scoped by
> `governance/roadmap/dynamic-pipeline-architecture/43-build-plan-extraction-gaps-from-wiki-handoff-2026-09-26.md`.
> Reasons: this prompt lacks the never-commit rule, uses a different container and database name than the
> live pipeline, requires a DB copy (the live `facts_index` is the source of truth by decision), and orders
> the items differently. Original text kept below for history. See `2026-09-26-extraction-team-reply.md`.

Paste the section below into a coding agent that runs **in the extraction pipeline's repo**. Give it read access to `wiki-docs/wiki/` for the evidence it cites.

---

You're working on the AST extraction pipeline that writes facts and cross-repo edges into the Postgres `facts_index` DB (container `local-pgvector`, port 5433). A documentation wiki consumes these facts and has sent a handoff: `wiki-docs/wiki/docs/handoffs/2026-09-26-extraction-team.md`. Read it first. It lists the problems, their evidence and a suggested priority.

## Your job
Fix the extraction gaps in the handoff, **one item at a time, in priority order**: T-112, T-108, T-111, T-106, T-110. Then the priority 3 items, if the owner asks for them.

For each item:
1. **Investigate first.** Find the extractor or resolver code responsible, and explain the cause in a few sentences. Cite `file:line`.
2. **Propose the change** before making it: the new or changed fact kind, the payload fields and the edge type. Wait for the owner's approval.
3. **Implement it**, with tests where the pipeline has them.
4. **Re-extract** only the affected repos, into a **copy** of the DB, never the reference DB `facts_index_20260925`.
5. **Verify** against the acceptance checks below, and report the numbers.

## Rules
- **Don't break what the wiki relies on:**
  - `fact_ref` stays stable across re-extraction at the same commit.
  - A run still replaces a repo's facts completely.
  - Existing payload fields keep their names and meaning. Add fields; don't rename them.
- **Structured fields, not prose.** Anything the wiki needs to join on (paths, topic names, export names) must be in a payload field or an edge column, not only in `details` text.
- **Unresolved is fine, wrong isn't.** If a value can't be resolved statically, emit it as unresolved with a reason. Don't guess.
- **Report honestly.** If an acceptance check fails or you skipped something, say so, with the query output.

## Acceptance checks
Run each check as a read-only SQL query (`BEGIN READ ONLY; … ROLLBACK;`) on the re-extracted copy.

| Item | Check |
|---|---|
| T-112 | swift-cloud-kit, iOS and Angular have client Firestore path facts, each with a path string and an operation. Every case of `OSKCKFirestoreCollectionPath` and `OSKCKFirestoreDocumentPath` has a path string. `firestore_trigger` has a structured path, and no trigger has `value = 'unknown'`. Client ↔ firebase Firestore edges exist |
| T-108 | Every `api_contract` with `contractType = 'callable'` has an export name. The number of client callable calls resolving to `unknown` doesn't increase |
| T-111 | At most 4 firebase `PUBSUB_TOPIC_BINDING` publish edges are unresolved. None has a device id or other ordering key as its topic. The `pubsub_publish_call` facts cited in edge details exist in the DB, or the details no longer cite them |
| T-106 | The 15 client callable calls listed in the handoff either resolve, or carry a reason why they can't (e.g. no matching export: a probable client bug) |
| T-110 | `hosting/web-app` has 84 static and 67 bound `formControlName` facts, which matches the source at `8345d222` with HTML comments excluded (currently 82 and 61). Nested `formGroupName` is recorded |

## Report
After each item, write a short report:
- the cause
- the change you made
- the repos you re-extracted
- the acceptance-check results
- anything left unresolved and why

The wiki owner will re-run the checks on their side before switching the reference DB.

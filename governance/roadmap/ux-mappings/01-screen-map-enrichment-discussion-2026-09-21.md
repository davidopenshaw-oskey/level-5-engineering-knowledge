# 01 — Screen-map enrichment: discussion record and measured coverage (2026-09-21)

**Mode: discuss/decide. Nothing built, no tables created, no extraction or retrieval code
changed, no git add/commit.** One read-only measurement was run (zero spend, script deleted).
Written so a future session can orient from this folder alone. Read after
[00-android-oskey-io-screen-mapping-feasibility](00-android-oskey-io-screen-mapping-feasibility-2026-09-21.md).

## 1. Where things stand

Three human-reviewable screen maps exist, each with its own idempotent, merge-aware extraction
script in `pipeline/facts-postgres-index/` (built per
`dynamic-pipeline-architecture/32` and `33`):

| Map | File | Entries | Filled (screenName + description) |
|---|---|---|---|
| Angular | `governance/reference-docs/screen-map-angular-features.json` | 59 | 48 |
| iOS | `governance/reference-docs/screen-map-ios.json` | 88 | 88 |
| android-intercom | `governance/reference-docs/screen-map-android-intercom.json` | 13 | 13 |

- All three are Postgres-read, local-JSON-write only. **None is stored in Postgres, and none is
  wired into any prompt or retrieval tool yet.** The value hypothesis has not been tested.
- The model drafted the names and descriptions from source; only a few needed human
  clarification. `OSKPinCodeScreen` was confidently wrong and was caught by reading the source,
  so the low correction rate measures errors that *looked* wrong, not errors that exist.
- `android-oskey-io` (the resident-facing Android app) is **benched by the user** (too much
  in-flight). Doc 00's investigation stands as a parked asset: the real screen link is the
  `composableHolder(<Dest>) { <Screen>() }` call site, not the route names or a naming rule.
  No Android map build is scheduled.

## 2. Ideas discussed and where each landed

1. **Store the maps in Postgres, joined to facts (user).** A side table, not `facts`
   (`sync-facts.ts` deletes facts that disappear). Reasoning from the user: every UX item lives
   on a form or view that is already a fact, so the labels can enrich retrieved facts and need
   **no embeddings**. Agreed. This is a simple, cheap, quick win in cost terms.
2. **A `status` column for human review (user).** Agreed, refined: not a boolean but
   `model_drafted` | `human_confirmed` | `human_corrected`, plus a field for what the model was
   unsure about. Two rules matter more than the column: regeneration **never overwrites**
   `human_confirmed` (if the source changes underneath, flag it, don't rewrite); and anything
   passed to an agent **carries its status**, so a model guess never reaches the PRD agent looking
   like a verified fact. The existing scripts already preserve human fields on re-run, so this is
   a small extension.
3. **Build test tables in Postgres before deciding on the pipeline (user).** Agreed, with one
   sharpening: say what is being tested. "Can labels link to facts mechanically" is already
   answered by SQL matching, with no table needed (iOS 100%, Angular 44/59 with a component, 15/59
   routes have none). "Do labels improve outputs" is the real question and needs the labels
   consumed by an output.
4. **Model-drafted labels are a cache, not ground truth (assistant).** They are derived from the
   same code the agent can already retrieve. The genuinely new information is what only a human
   knows (which role sees a screen, why it exists). Provenance needs to show which is which.

## 3. The join key: `fact_ref` alone does not work (assistant, measured)

Superseded: the earlier proposal in
[dynamic-pipeline-architecture/36](../dynamic-pipeline-architecture/36-session-handoff-2026-09-21.md)
§1 (a `screen_fact_links` table keyed by `fact_ref`). The mechanics there still hold (one
shared table, `repo` as disambiguator, the extraction scripts as the sync mechanism), but the
**join key is wrong for enrichment**.

Measured against the 10 real `FULL_DEBUG` runs (2,238 unique retrieved facts; read-only Postgres
plus trace files; retrieval, not citation):

| Repo | Retrieved | Direct `fact_ref` match | Same file as a mapped screen | Enrichable |
|---|---|---|---|---|
| ios-oskey-dev | 208 | 0 | 82 | 39% |
| angular-app-oskey-io | 327 | 3 | 75 (+6 same folder) | 26% |
| android-intercom-oskey-io | 438 | 2 | 68 | 16% |
| firebase-oskey-dev, node-iot | 1,265 | n/a (no UX map) | n/a | n/a |

Across the three UX repos: 973 retrieved, **5 direct matches (0.5%)**, **236 enrichable by file
(24%)**. The agent almost never retrieves a screen's own declaration; it retrieves what is inside
the screen. The same-file hits were `call_expression` (93), `model_property` (79),
`permission_candidate` (16), `class_method` (11), `function_declaration` (9).

**So the join is a containment join on `(repo, file)`**, not `fact_ref`. Consequences:
- Still no embeddings: every retrieved fact already carries its file.
- A `permission_candidate` inside a screen's file becomes "permission on the *X* screen", which
  gives one of the noisy fact kinds (docs 27/28) context. Untested that this helps.
- Where one file holds several screens (e.g. iOS `…ScreeniOS16` variant pairs), the join needs
  line-range containment. **How often this happens is not measured.**
- Angular screens are keyed by route, and the template `.html` lives beside the component `.ts`;
  only 6 same-folder hits were found, so Angular's enrichment is mostly the component file.
- Fact IDs (`kind|module|file|symbol`) carry no line number, so they survive code shifts and
  break only on file or symbol renames. Re-resolving from the natural key on each run (as the
  scripts already do) covers that.

### Caveats on the measurement
- The runs were business-question PRDs, not UX-focused; 1c was the main iOS/Android one.
  Small sample.
- Retrieval coverage is not benefit. It shows labels *could* attach to about a quarter of what
  the agent sees in UX repos, not that they would improve any output.
- Enrichment attaches to facts the agent already found. It does **not** help the agent *find*
  screens, so the earlier "labels reduce turn-burn" hypothesis is not what this tests.

## 4. Open question for the user: which outputs benefit from stored labels?

Not decided. Working hypotheses, each unmeasured:

| Output | What labels would add | Notes |
|---|---|---|
| PRD | Screen names and descriptions in the UX/affected-areas sections, in place of the missing Figma/UX input | The case measured above (retrieval side). Enrichment on `search_facts` and `walk_cluster` results. |
| Wiki docs | A screen catalogue per platform; the map is close to a page index, and the containment join gives "what is in this screen" | Probably the most natural fit, since the labels are direct content. Not measured. |
| Impact analysis | The reverse: from a changed fact or file, which screens are affected | The file-containment join only covers code inside the screen's own file. A model or service in another file needs a graph walk (edges) to reach a screen, so the label would attach at the end of a `walk_cluster`. Coverage here is unmeasured and likely lower. |

The user is deciding where stored output would help most before committing to a design.

## 5. On the pushback (recorded so it is not misread)

The user felt this was a simple quick win and sensed resistance. Fair reading: it **is** cheap
(no embeddings, a small side table, scripts already exist). The pushback was narrow, on three
points only: (1) the join key must be containment, not `fact_ref`; (2) labels need a status so
model guesses are not presented as verified; (3) coverage is not benefit, so a bounded check
against a real output should precede a pipeline commitment. None of these argues against doing it.

## 6. Decisions still open

1. Which output(s) drive the design (§4).
2. Table shape: side table keyed `(repo, file, symbol, line range)` with the label, `status`,
   and the model's open question. Not designed in detail.
3. Where the join lives: tool results (`search.ts`, `graph-traversal.ts`), the evidence renderer
   (`_shared/render-evidence.ts`), or both.
4. Whether to test benefit before building the table. A JSON-injection A/B on one platform
   needs the four missing glue pieces (directive-to-file inclusion etc.) and real LLM spend,
   which must be flagged and approved before any run.
5. Keeping the maps in sync: the extraction scripts already merge and flag stale entries; wiring
   them to run after a sync is the same "who runs it after a re-sync" question as the edge
   builders (see `dynamic-pipeline-architecture/38`, build log).

## 7. Explicitly not done

No table created, no script or tool changed, no LLM or embedding spend, no Android map, no
change to `android-oskey-io` onboarding status. The coverage script was deleted after use.

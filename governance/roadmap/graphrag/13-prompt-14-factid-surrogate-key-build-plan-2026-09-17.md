# Prompt 14 — Build plan: fact_id → surrogate key (ADR-010)

Plan only, per `governance/roadmap/graphrag/prompts/prompt-14-factid-surrogate-key-build-plan.md`. No code, schema, or Postgres changes made to produce this. No git add/commit run. Reference documents treated as ground truth, not re-derived: `governance/adrs/adr-010.md` (including §6 addendum) and `governance/roadmap/graphrag/12-prompt-13-factid-surrogate-key-code-inventory-findings-2026-09-17.md`.

**One design choice drives most of this plan, stated up front**: the new reference column should be a Postgres **`GENERATED ALWAYS AS ... STORED`** column, computed from the existing `fact_id`/`source_fact_id`/`target_fact_id` text via `pgcrypto`'s `digest(..., 'sha1')` — not an application-computed value written by the generators or loaders. This directly reuses a pattern **already live in this exact schema**: `facts.description_hash` (`schema-proposal.sql:55`) is already `GENERATED ALWAYS AS (md5(description)) STORED`, justified in that column's own comment as "Postgres maintains this automatically... so the sync script never has to remember to keep it in sync itself, and it can never drift from the real stored value." That reasoning applies identically here, and it changes the shape of §4/§5 below: **no pipeline generator or loader file needs to change** for the core mechanism, because Postgres computes the surrogate from whatever `fact_id` text is already flowing through every existing INSERT, unmodified. I checked this isn't wishful thinking — it also directly answers §3's "confirm it's a pure computation over existing fact_id text with no re-extraction needed" instruction: it's not just pure computation, it's computation Postgres already performs natively today for `description_hash`.

---

## 1. Schema change — DDL sketch (not applied)

```sql
-- Prerequisite: sha1() needs pgcrypto (not built into core Postgres).
-- Same "add the extension your one new column needs" pattern already used
-- for `vector` and `pg_trgm` at the top of this same schema file.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- facts: add the generated surrogate, backed by the existing fact_id text.
-- ADD COLUMN with a generation expression computes + stores the value for
-- every EXISTING row as part of this one statement (real Postgres behavior,
-- not assumed) -- this IS the backfill for `facts`, see §3.
ALTER TABLE facts
  ADD COLUMN fact_ref text GENERATED ALWAYS AS (encode(digest(fact_id, 'sha1'), 'hex')) STORED;

-- Sanity check before touching the primary key -- cheap, real, matches this
-- project's "keep a before baseline, verify before trusting a fix" rule.
-- Expect: distinct_count = total_count (68,902 = 68,902).
SELECT count(*) AS total_count, count(DISTINCT fact_ref) AS distinct_count FROM facts;

-- Re-point the primary key: fact_ref becomes the real identity column.
ALTER TABLE facts DROP CONSTRAINT facts_pkey;
ALTER TABLE facts ADD CONSTRAINT facts_pkey PRIMARY KEY (fact_ref);
-- fact_id stays exactly as-is: still NOT NULL (untouched), no longer unique-
-- constrained, purely descriptive from here on, per ADR-010 §2.

-- cross_repo_edges: same generated-column pattern, both columns.
-- digest(NULL, 'sha1') is NULL in Postgres (strict function) -- so
-- target_fact_ref is correctly NULL exactly when target_fact_id already is
-- (the legitimate "unresolved edge" case, schema-proposal.sql:127) with no
-- special-casing needed.
ALTER TABLE cross_repo_edges
  ADD COLUMN source_fact_ref text GENERATED ALWAYS AS (encode(digest(source_fact_id, 'sha1'), 'hex')) STORED,
  ADD COLUMN target_fact_ref text GENERATED ALWAYS AS (encode(digest(target_fact_id, 'sha1'), 'hex')) STORED;

-- Sanity check: every edge's source should resolve to a real fact_ref
-- (build-intra-repo-edges.ts's own "never claim a fact_id you haven't
-- verified" discipline already guarantees source_fact_id is always real) --
-- expect 0 rows.
SELECT count(*) FROM cross_repo_edges e
  LEFT JOIN facts f ON f.fact_ref = e.source_fact_ref
  WHERE f.fact_ref IS NULL;

-- Re-point the two edge indexes (swap, not addition -- net index count on
-- both tables is unchanged, matching ADR-010 §2).
DROP INDEX cross_repo_edges_source_fact_id_idx;
DROP INDEX cross_repo_edges_target_fact_id_idx;
CREATE INDEX cross_repo_edges_source_fact_ref_idx ON cross_repo_edges (source_fact_ref);
CREATE INDEX cross_repo_edges_target_fact_ref_idx ON cross_repo_edges (target_fact_ref);
```

**Type/length**: `text`, always exactly 40 lowercase hex characters (SHA1 hex digest, untruncated — see §2 for why untruncated). A `CHECK (fact_ref ~ '^[0-9a-f]{40}$')` is optional defensive belt-and-suspenders; recommend skipping it — `GENERATED ALWAYS AS (encode(digest(...), 'hex'))` cannot produce anything else, so the check would only ever fire on an application bug that doesn't exist because the value isn't application-computed at all.

**What doesn't change**: `facts.fact_id` stays `NOT NULL`, stays populated exactly as today. No FK constraints exist between `cross_repo_edges` and `facts` today (confirmed by reading `schema-proposal.sql` directly — plain `text` columns, no `REFERENCES`), so there's no FK to drop/recreate, only the two indexes.

---

## 2. Surrogate value design

**SHA1 hex digest of the fact_id text itself, untruncated (40 hex chars)** — `digest(fact_id, 'sha1')`, matching this codebase's existing hash algorithm choice (`boundedIdComponent()`'s `crypto.createHash("sha1")`, `pipeline/*/phase-01-ast-extraction/02-build-module-evidence.ts`) and this schema's existing generated-hash pattern (`description_hash`'s `md5(description)`).

**Input**: the full, final `fact_id` string exactly as `stableFactId()` already produces it (`` `${type}|${module}|${cleanPath}|${primaryKey}${sec}${ord}` ``) — not the individual pre-assembly components. Hashing the assembled string is equivalent (it already deterministically encodes every component) and means the surrogate can be computed entirely inside Postgres from a column that already exists, with zero dependency on the generator's internal logic.

**Divergence from the `boundedIdComponent()` precedent, stated explicitly (the prompt asked for this if I diverge)**: `boundedIdComponent()` truncates its hash to 12 hex chars (48 bits) because it's a disambiguating *suffix* appended to still-mostly-original truncated text — collision risk there is absorbed by the surviving prefix plus the occurrence ordinal. Here, the hash **is** the entire identity value for 86,097 real rows with no other disambiguating content alongside it. A 12-char truncation's birbirthday-collision probability at this row count is small (roughly 1-in-10⁵) but real and entirely avoidable at negligible cost: 40 hex chars vs. 12 is a trivial difference in tool-call token cost (still ~98% shorter than the corpus's average 187-char `fact_id`, and ~99.6% shorter than the 10,837-char max) while making an accidental identity collision astronomically implausible (160 bits) rather than merely unlikely. Recommend: **do not truncate**. The primary real benefit ADR-010 §2 names — eliminating the multi-line/embedded-newline reproduction failure — is fully achieved at 40 chars; it gains nothing further from also minimizing to 12.

---

## 3. Backfill approach

**Not a custom script.** Per the DDL in §1, `ALTER TABLE facts ADD COLUMN fact_ref text GENERATED ALWAYS AS (...) STORED` computes and stores the value for all 68,902 existing rows as part of that single statement — this is documented, real Postgres behavior for generated columns added via `ADD COLUMN`, not an assumption. Same for `cross_repo_edges`' two ref columns across all 17,195 rows. Confirmed: this is a pure computation over the existing `fact_id`/`source_fact_id`/`target_fact_id` text already stored — no re-extraction, no pipeline re-run, no read of any repository source file.

**Sequencing**: `facts` before `cross_repo_edges` — not because the generated-column computation itself depends on ordering (each table's generated columns are self-contained, computed from that same row's own text columns), but because the two verification `SELECT`s in §1 are more meaningful in that order (verify `facts.fact_ref` uniqueness first, then verify every `cross_repo_edges.source_fact_ref` resolves to a real `facts.fact_ref` — that join check is only meaningful once `facts.fact_ref` exists).

**Real cost of the operation itself**: `ADD COLUMN ... GENERATED ... STORED` is a full table rewrite (Postgres must compute and store a value per row), which takes a table lock for its duration. On tables this size (69K / 17K rows) on the local `facts-postgres-index-local` Docker Postgres, this is a sub-second-to-low-seconds operation, not a real operational concern — and per `[feedback_alpha_not_production]`, this is alpha/local, not a live service with concurrent traffic to protect. No online-migration strategy (shadow column + backfill batches + cutover) is warranted here; that complexity would be solving a production-availability problem this project doesn't have yet.

---

## 4. Generator-side changes

**None required.** This is the direct, concrete consequence of §1's design: the 5 `stableFactId()`/`boundedIdComponent()` copies (`android-intercom-oskey-io`, `angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io`, `swift` — thresholds 2000/2000/2000/500/200) keep producing `fact_id` exactly as they do today; Postgres computes `fact_ref` automatically at write time regardless of which generator or threshold produced the text. `04-build-resolved-graph.ts` (all 5 pipeline dirs) also needs no change — it threads `sourceCallFactId`/`targetFactId` through to `resolved-engineering-graph.json` as plain `fact_id` text exactly as today; `build-intra-repo-edges.ts` (§5) reads that JSON and writes `source_fact_id`/`target_fact_id` unchanged, and the generated `source_fact_ref`/`target_fact_ref` columns pick it up automatically.

**On consolidating the 5 copies — explicit recommendation: don't, not in this build session.** The inventory correctly found the consolidation low-risk, and I'm not disputing that — but the premise for bundling it here ("we're touching these files anyway for the surrogate-key change") no longer holds, because §1's design means **this build session touches zero generator files**. Folding an unrelated refactor into a schema/retrieval change purely because it would have been convenient if the files *were* being touched anyway increases review surface for no functional benefit, and goes against this project's own stated preference against scope creep. If the consolidation is still wanted, it should be its own separate, later task with its own review — not decided against here, just correctly scoped out of *this* one.

---

## 5. Loader-side changes

**None required**, for the same reason as §4. Confirmed against each real INSERT/UPSERT site from the inventory:

- `sync-facts.ts:555-560` — `INSERT INTO facts (fact_id, repo, module, ...) ... ON CONFLICT (fact_id) DO UPDATE SET ...`. **One real constraint to note, not a change to make**: a `GENERATED ALWAYS` column cannot appear in an explicit column/value list or be targeted by `DO UPDATE SET` — but this script never references `fact_ref` at all today, so there's nothing to remove; it continues working unmodified. The `ON CONFLICT (fact_id)` clause stays on `fact_id` (still the real natural key for conflict detection — `fact_ref` deterministically follows from it 1:1, so conflict detection doesn't need to change targets).
- `sync-facts.ts:590` (stale-row `DELETE ... WHERE ... NOT (fact_id = ANY(...))`), `:623-624`, `:638` (embedding backfill queries) — all keyed on `fact_id`, all unaffected; these aren't part of the identity/join-key problem ADR-010 addresses (embeddings were never joined via `fact_id` per ADR-010 §1d).
- `build-cross-repo-edges.ts:213` (`HTTP_API_CALL`), `:292` (`PUBSUB_TOPIC_BINDING`), `build-intra-repo-edges.ts:343` (`INTRA_REPO_CALL`), `build-form-field-lineage-edges.ts:284-291` (`FIELD_BINDING`) — all four `INSERT INTO cross_repo_edges (..., source_fact_id, target_fact_id)` statements are unaffected; `source_fact_ref`/`target_fact_ref` are generated from the values these statements already supply.

---

## 6. `mcp-server/` changes — both fork copies, classified sites

This is where real code changes live, because this is the layer that currently makes the model read, compare, and retype `fact_id`. **Both `mcp-server/db/{search,graph-traversal}.ts` and `pipeline/facts-postgres-index/_shared/{search,graph-traversal}.ts` need this identical, independent edit** — confirmed live per ADR-010 §6 point 2 (not kept in sync automatically).

### (a) Mechanical swap sites — column/binding rename only, no logic-shape change

- **`search.ts`** (both copies): `SELECT fact_id, repo, module, ...` → `SELECT fact_ref, repo, module, ...`; `factId: row.fact_id` → `factId: row.fact_ref`. The model-facing `SearchResult.factId` field now holds the 40-char reference, never the raw `fact_id` text — this is deliberate (see the closing note on this section): the model should not receive the long text at all going forward, not just avoid retyping it.
- **`graph-traversal.ts`** (both copies): every `SELECT fact_id, ... FROM facts WHERE fact_id = ANY($1::text[])` → `SELECT fact_ref, ... FROM facts WHERE fact_ref = ANY($1::text[])` (lines 84-88/194-198 in `mcp-server/db/graph-traversal.ts`, mirrored in the `_shared/` fork); `findGraphNeighbors`'s `SELECT 'outgoing' ..., target_fact_id as other_fact_id ... WHERE source_fact_id = $1` → `target_fact_ref as other_fact_ref ... WHERE source_fact_ref = $1` (and the incoming-direction mirror on `target_fact_ref`). Fail-closed error messages (`[Fail-Closed] Anchor fact_id '...' has no assigned number`, `Graph edge(s) reference fact_id(s) not found`) keep working unmodified — they interpolate whatever string was passed, format-agnostic.
- **`validators.ts`**: `extractRealFactIds()`, `checkFabrication()` — both operate generically on whatever string is in `factId`/`sourceFactId`/`targetFactId`; no logic change, they now collect/compare `fact_ref` values instead of `fact_id` text.
- **`atomic-prd-agent.ts` / `capability-fanout-prd-agent.ts`**: `seenFactIds` dedup sets, `get_graph_neighbors`/`walk_cluster` tool argument plumbing, the `evidenceIds` dedup key (`capability-fanout-prd-agent.ts:282,286`) — all mechanical, no shape change.
- **`src/index.ts`**: `inputSchema: z.object({ factIds: z.array(z.string()) })` — no schema change needed (still a string array); a light wording pass on the tool descriptions (lines 22, 31, 48 — "real fact_ids" language) is optional polish, not functionally required.
- **`section-content.ts`**: **no change** — `renderCitations(evidenceIds, citationNumberOf?)` is already agnostic to what string is used as the citation key; it just needs a working `citationNumberOf` lookup, built elsewhere (see below).

### One real, new (not just swapped) piece of logic: the evidence-appendix display text

ADR-010 §2 requires the raw `fact_id` text to keep appearing in the Evidence Used/Audit Trail appendix. Once citations (`evidenceIds`) carry `fact_ref` values instead of `fact_id` text, `atomic-prd-agent.ts`'s appendix-rendering code (lines 439, 468 — confirmed **(b)** display sites in the inventory) needs a `fact_ref → fact_id text` lookup that doesn't exist today. Concretely: the `factRepoMap` build query (`atomic-prd-agent.ts:246, 276-278`, currently `SELECT fact_id, repo FROM facts WHERE fact_id = ANY($1::text[])`) becomes `SELECT fact_ref, fact_id, repo FROM facts WHERE fact_ref = ANY($1::text[])`, populating a new `factDisplayMap: Record<string, string>` (ref → real `fact_id` text) alongside the existing `factRepoMap` (ref → repo). Lines 439 and 468 then render `` `\`${factDisplayMap[id]}\`` `` instead of `` `\`${id}\`` `` directly. This is the one place in `mcp-server/` that needs genuinely new logic, not a rename — small (one extra SELECT column, one extra map, two interpolation-site edits), but real, and it's the mechanism that keeps ADR-010's "kept purely as a descriptive/citation label" promise true. **Check whether `capability-fanout-prd-agent.ts` renders its own appendix independently or merges into the same `atomic-prd-agent.ts` rendering path** — the inventory didn't find an equivalent 439/468-style site in that file specifically, so this may only need to happen once; confirm during implementation rather than assuming.

### (c) Sites needing a real design decision — resolved here, not left open

**`atomic-prd-agent.ts:762-765` (fabrication near-miss diagnostic)** — the current technique (`id.split("|").slice(-2).join("|")`, matching on the trailing two pipe-delimited segments) has no equivalent once citations are opaque 40-char hashes: a hash that's wrong by one character is not "close" to the right one in any structurally meaningful sense, so a pipe-segment-style near-miss search isn't just harder, it's meaningless for this data shape. **Recommended replacement**: since the model will now only ever legitimately hold `fact_ref` values, the one realistic failure mode worth diagnosing is *the model citing the display text instead of the reference* (e.g. if a stale skill instruction or a confused generation reintroduces the old `fact_id` format). Replace the near-miss search with a reverse lookup: if the fabricated string matches a real `fact_id` display value (via the same `factDisplayMap`, inverted) rather than a real `fact_ref`, log `"fabricated: <value> — this matches a real fact_id DISPLAY string, not its fact_ref; the model likely cited the wrong field"`. Otherwise, log plainly: `"fabricated: <value> — no near-miss available under the opaque-reference scheme (a hash has no partial-match signal, unlike the old pipe-delimited fact_id)"`. This is a real, decisive replacement — not a placeholder — and it directly diagnoses the one failure mode that's actually likely to recur (stale prompt wording), which is also why §7 matters.

**`citation-validator.ts`'s `split("|")` fallback (~line 190, angular/firebase/node-iot phase-02, kept live per ADR-010 §6 point 3)** — reading this file directly (not assumed) shows it is **not** a diagnostic like `atomic-prd-agent.ts:762-765` — it's a real, load-bearing **abbreviation-tolerant fuzzy-match fallback**, with its own comment citing an empirically confirmed 2026-08-02 finding that this phase-02 flow's own LLM inconsistently abbreviates long `fact_id` citations. This is a genuine, independent instance of the same underlying reliability problem ADR-010 addresses — but in a **separate LLM generation flow** (per-repo phase-02 synthesis, producing `` `fact-id::...` `` markdown citation blocks parsed by `run-utils.ts`'s `FACT_ID_CITATION_BLOCK_PATTERN`) whose actual prompt was never located or read as part of this inventory or this ADR's scope, and which continues citing by the long `fact_id` text (unchanged, per ADR-010 §2) rather than by `fact_ref` — this flow doesn't call `get_graph_neighbors`/`walk_cluster` and was never part of the tool-call-argument mechanism ADR-010 §2 actually fixes. **Recommended decision: leave `citation-validator.ts` unchanged in this build session.** Its `fact_id` input text doesn't change under this ADR, so its fuzzy-match fallback isn't broken by this change and doesn't need editing to remain correct. This is a real design call (per ADR-010 §6's instruction not to treat this as "skip as dead code") — I'm making it explicitly: **not dead code, but also not in this ADR's actual mechanism**, since this flow's citations never touch a `fact_ref`. Whether to *also* extend the opaque-reference fix to this flow's own citation mechanism is a genuinely separate, real scope decision — flagged for you at the end of this plan, not folded in here.

---

## 7. Skill-file rewrite — `mcp-server/skills/prd/skill.v3.md`

Concrete replacement text for the three real sites (current wording confirmed by reading the file directly):

**Replace line 37** (currently: `...always copy the real \`factId\` field itself, verbatim, or search again if you don't have it.` with the `|` characters example) **with:**

> This applies everywhere a `factId` is used, not only in final citations — including as an argument to `walk_cluster` or `get_graph_neighbors`. A tool result's `factId` is a short, opaque reference token — a 40-character lowercase hexadecimal string (e.g. `a3f9e1c8...`) — not a readable identifier. It carries no structure to abbreviate, paraphrase, or reconstruct from memory: copy it character for character exactly as a tool returned it, or call the tool again if you no longer have it. Never confuse `factId` with `description` — they serve different purposes and must never be substituted for each other.

**Replace line 60** (currently: `...copied verbatim as a plain string... this field is raw data, matched exactly against real tool output.`) **with:**

> Every `evidenceIds` entry in a `cited-list` must be a real `factId` — the exact 40-character opaque reference a tool call actually returned this conversation — copied character for character, with no surrounding backticks or other markdown added. Never cite a `factId` you have not seen returned by a tool call this run, and never retype or reconstruct one from a similar-looking value elsewhere in your own context.

**Line 34 needs no rewrite** — "cite the real `factId`(s)... taken verbatim from a tool result" is still exactly correct and, if anything, now a much easier instruction to follow correctly (40 fixed characters vs. up to 10,837 with embedded newlines).

**Scope note**: only `skill.v3.md` — confirmed the currently-active persona per `[project_atomic_prd_skills_file_iterative]`. `skill.md`/`skill.v2.md` are prior iteration snapshots; per this project's "mark superseded, don't rewrite history" convention, leave them untouched.

---

## 8. Testing/verification approach

1. **Schema-level, immediate**: after §1's DDL, `SELECT count(*), count(DISTINCT fact_ref) FROM facts` (expect equal) and the `cross_repo_edges` join-integrity check already given in §1 — cheap, real, catches a wiring mistake before any application code runs against it.
2. **Structural guarantee, not just a test pass**: because `fact_ref` is a `GENERATED` column with a fixed format, add one defensive check in `mcp-server` (e.g. in `expandWithGraphNeighbors` or at the tool boundary) that logs a warning if any `factId` value received as a tool argument is not exactly 40 lowercase hex characters. This catches a real wiring mistake (an old `mcp-server/db/` vs `pipeline/facts-postgres-index/_shared/` fork left un-migrated, or a stale client) immediately and directly, rather than relying on `checkFabrication` to eventually notice downstream.
3. **Re-run the two known real test cases, compare against existing recorded baselines** (per this project's "keep a before baseline, compare directly" rule):
   - **1a "ownernonresident"** — baseline exists (`mcp-server/gold/evals/1a-ownernonresident.eval.json`, referenced debug logs).
   - **2a "resident departure date"** — real, detailed baseline already recorded in `governance/roadmap/graphrag/10-case-2a-fanout-content-truncation-finding-2026-09-17.md`: one-hit run = 25 tool calls, 26 turns, 2m7s, $0.0899, 401 real fact_ids, both validators passed. Re-run one-hit and compare tool-call count, turn count, validator pass/fail, and (loosely, cost varies run to run) spend against these exact numbers. **This is also the specific case that exposed the real transcription-drift bug (`core` capability, case 2a fan-out) — re-running the fan-out variant is the direct, real test of whether this change closes that bug**, though note LLM non-determinism means a clean pass here is encouraging, not conclusive proof on its own (item 2's structural guarantee is the actual proof; the re-run is corroborating evidence).
4. **Real spend, flagged explicitly, per this project's rule**: re-running 1a and 2a (one-hit + fan-out, both cases) is real LLM API spend — the 2a one-hit baseline alone was $0.0899; the fan-out variant previously crashed before cost was recorded, so total re-run cost is a small-but-real unknown, likely low single-digit dollars across all 4 runs (1a/2a × one-hit/fan-out). **Flagging this before it's run, not burying it in a later step, per this project's own standing rule** — the build session should get an explicit go-ahead before incurring it, not just before the very first API call.

---

## 9. Sequencing

1. **Schema DDL (§1)** — first, and low-risk: entirely local/offline, auto-backfills as part of the DDL itself (§3), blocks nothing else from proceeding once done.
2. **`mcp-server/` code changes (§6)**, both fork copies, together — depends on §1's columns existing to query against. Do `db/`/`_shared/` mechanical swaps, the new `factDisplayMap` logic, and the two (c)-flagged replacements in the same pass — they're small and interdependent (the near-miss diagnostic replacement needs `factDisplayMap` to exist).
3. **`skill.v3.md` rewrite (§7)** — ship in the *same* batch as #2, not before and not meaningfully after: shipping the code change without the skill update leaves the model instructed to expect/produce long verbatim strings against tool results that no longer contain them; shipping the skill update first without the code change makes false promises about tool behavior that isn't live yet.
4. **Testing/verification (§8)** — after 1-3 are all in place together. Get explicit go-ahead for the real spend in §8 item 4 before running it.
5. **`generate-atomic-prd.ts` decommissioning** (rename to `decommissioned_` prefix, per ADR-010 §6 point 1) — fully independent of everything above; zero functional risk (a filesystem rename of frozen, unreferenced files); can happen at any point, including immediately, in parallel with anything else.
6. **Pipeline generators/loaders (§4/§5)** — confirmed no changes required; nothing to sequence. Pipeline syncs can run before, during, or after this entire change with no interaction — a real, low-risk property of the `GENERATED`-column design worth naming explicitly, since it means this change carries none of the usual "don't run the pipeline mid-migration" coordination risk.
7. **`citation-validator.ts`** — no change in this build session (§6's design decision); nothing to sequence.

---

## Flagged for your own call — genuine ambiguity or cost I can't resolve from the two reference docs

1. **Whether to extend the opaque-reference fix to the phase-02 `citation-validator.ts` flow's own citation mechanism.** It has a real, independently-confirmed (2026-08-02) instance of the same underlying problem (LLM abbreviating long `fact_id` citations), but fixing it means touching a different LLM prompt/generation flow that was never located or read in either the inventory or this plan, and ADR-010's decision was scoped specifically around the Postgres/mcp-server retrieval mechanism. I recommend treating this as a separate, later, real investigation+decision (its own prompt), not folding it into this build session — but it's real and live, not hypothetical, so naming it rather than letting it quietly stay unresolved.
2. **Real LLM spend for §8's re-test step** — small (likely low single-digit dollars total across 1a/2a × one-hit/fan-out re-runs), but real; needs your go-ahead before the build session actually executes it, per this project's own spend-flagging rule.
3. **Field-naming style**: this plan recommends keeping `factId`/`evidenceIds`/`sourceFactId`/`targetFactId` as the TypeScript/JSON field *names* throughout `mcp-server/` (only their semantic content changes, from natural-key text to opaque reference) rather than renaming to `factRef`/`evidenceRefs`/etc. This minimizes diff size and avoids touching every call site for a cosmetic rename, but it's a real style tradeoff — if you'd rather the field names reflect the new semantics explicitly, say so before the build session starts, since it changes the edit list in §6 meaningfully (many more call sites touched, not just the ones listed here).

---

## Decisions (recorded 2026-09-17, same session, after review)

1. **`citation-validator.ts`'s own citation mechanism (item 1 above)** — deferred, explicitly not part of this build. Tracked as a real, standing TODO for the future phase-02/"bring back the engineering reports" initiative, not folded into ADR-010's build. See `[[project_phase02_reports_preserved]]` memory.
2. **Real spend for §8 re-testing (item 2 above)** — approved. Flag it as normal per this project's standing spend-before-incurring rule when the build session actually reaches that step; no additional special confirmation beyond that.
3. **Field-naming (item 3 above)** — renaming decided. `factId`/`evidenceIds`/`sourceFactId`/`targetFactId` and equivalents across `mcp-server/` (both fork copies) get renamed to reflect the new opaque-reference semantics (`factRef`/`evidenceRefs`/`sourceFactRef`/`targetFactRef`, or equivalent), not kept as-is. This expands §6's real edit list to every call site touching these field names, not just the sites already enumerated — a larger diff, judged worth it given this project's repeated real experience this session with misleadingly-named fields causing genuine confusion (`fact_id` itself being the primary example).
4. **Surrogate key type — SHA1 hash confirmed, not bigint/UUID.** Real reason, not just a style call: `cross_repo_edges` stores `source_fact_id`/`target_fact_id` as independent, denormalized *text copies* — no real foreign key into `facts` (confirmed, no FK constraint exists). A hash is a pure function of that text, computable identically and independently on both tables with zero coordination — exactly why it can be a Postgres `GENERATED` column with zero pipeline changes. A bigint/UUID can't do this: `GENERATED` columns can only reference other columns in the *same row*, never another table, so keeping a sequential/random id in sync across the two tables' independent text copies would require a cross-table trigger or loader-side lookup — reintroducing the exact coordination risk this plan eliminates. Truncating the hash for a shorter/cheaper token footprint was considered and rejected (this plan's §2 reasoning stands): the primary benefit (no more multi-line reproduction failures) is already fully achieved at 40 chars.

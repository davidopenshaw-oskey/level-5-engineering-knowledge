# Collated action plan — cross-session findings exchange, 2026-09-21

Collated by this session (ref `4fa3bd`) per the user's explicit request, after a real
findings exchange with `level-5-engineering-knowledge-c5` (the session that authored most
of docs 09-34). Every claim below is either independently verified by one of the two
sessions, or explicitly flagged as not yet independently verified. This doc organizes real
work spanning docs 06-34 into decisions, not a re-narration of each doc — read the linked
doc for full detail on any one item.

## 1. Done, verified, shipped — no action needed, listed so nothing gets re-litigated

- **Repeat-query fix** (docs 09-11): cross-module signal, exact-dup cache, hard escalation
  gate. Live-tested, real bugs found and fixed along the way (exact-dup cache bypassing an
  already-crossed escalation threshold — doc 11 Addendum 2).
- **`maxTurns` never communicated to the model** — `renderCapabilityContract()` silently
  assumed skill.v3.md's 20-default regardless of the real configured value. Fixed, verified
  via real A/B (maxTurns=10 vs 20).
- **Multi-capability turns-used display bug** ("22 of 10") — fixed to show real
  per-capability breakdown.
- **Enum `possible values` empty-list bug** (docs 06-08, this session) — a Kotlin-shaped
  consumer in `sync-facts.ts` silently misreading TypeScript-shaped `evidence.members`.
  Fixed, 31/31 TS-repo enum facts verified corrected, zero regression on Kotlin/Swift.
- **Swift/iOS Phase 1 structural pipeline** (docs 19-22, this session): found the "missing
  04-07 scripts" premise was wrong (shared `pipeline/swift/` dir, not per-repo) — real issue
  was 3 missing `package.json` orchestrators + 4-of-5 repos' stale runs. Fixed, all 5 repos
  refreshed, 0 facts needed re-embedding (real, zero-cost outcome).
- **`skill.v3.md`/`template.v2.md` staleness cleanup + `(kind, freedom)` rekey + `stories`
  rename** (docs 17-18, this session, Phase 0): section-specific guidance now keyed to
  structural properties, not heading text (which any template author can freely rename).
- **Explicit PM-directed scope, Phase 2 orchestration** (docs 23-24, this session): `search()`
  gained a real `repoFilter`; "one capability per real `(repo, module)` pair" now actually
  achievable (previously impossible — module names recur across repos, e.g. `features` in
  both `firebase-oskey-dev` and `angular-app-oskey-io`). **Stopped correctly before real
  spend** — dry run found `1b`'s current format resolves to 24 capabilities, not 5, because
  Phase 1's format has no module-level narrowing yet (see §3below). User is narrowing `1b`
  manually before any real test run.

## 2. Real, open decisions — the actual substance of this collation

### 2a. Extraction-level noise: fix the classifier, or exclude the tier, or both

Real, upstream root cause (doc 28, cross-verified with actual code + raw JSON by both
sessions independently): `permission_candidate`/`permission_error` (541 facts, only 5 ever
reach "confirmed") isn't unreliable data — it's a classifier that only recognizes one narrow
shape of usage (`AUTH_CHECK_METHODS`, a hardcoded set of exactly 8 function names). A
permission string in a data file (e.g. a role-definition file) or any function not on that
list can never be "confirmed," regardless of how authoritative it actually is.

**Decision needed**: (a) widen the classifier to recognize more real, legitimate contexts
(data-file role definitions, a broader/configurable method list), (b) exclude the
unconfirmed tier from embedding entirely since nothing downstream uses the confidence signal
today, or (c) both — fix the classifier *and* still exclude whatever remains genuinely
low-confidence after the fix. Not decided by either session; recommend (c) but this is a
real call for the user.

`exported_symbol` is a structurally different problem (unconditional extraction, no
confidence tiering at all) — genuinely never citable for PRD, but see §2b before deciding to
exclude it.

### 2b. Don't treat "0% cited in PRD runs" as "delete" — serve/embed per use-case instead

New synthesis from this session's own cross-check against real raw data (extending doc 28,
not a separate finding): built a 3-way relevance matrix (PRD / wiki-docs / impact-analysis)
against real examples for all 7 flagged noise kinds. Net finding: almost nothing in the noise
set is *absolutely* low-value — most is specifically low-value for PRD and high-value for
the other two use-cases (`exported_symbol` and `angular_injectable` for wiki-docs/impact
analysis; `angular_template_binding` is the same family as the historically-hard-but-real
`formControlName` citation this project has watched succeed multiple times this session).

`pubsub_event_route` is the sharpest example, and was independently cross-checked live by
`c5` today: its 0%-cited rate isn't about content quality — a real dummy PRD run about
pubsub-routed edge-device APIs never even *gathered* it, because that capability was scoped
to the wrong module (`access_control_device` instead of `core`, where all 7 real facts
live). This is a scoping/routing failure, not evidence the content is thin — the content
itself (12+ real downstream service calls per route) is genuinely substantive.

**Decision needed**: whether to build use-case-scoped serving (don't blanket-filter by
citation rate; let wiki-docs/impact-analysis consumers see what PRD correctly ignores) —
real, new infrastructure work, not designed yet by either session.

### 2c. Retrieval-layer residual gap: text-similarity misses some real overlap

Preliminary (doc 25, this session, explicitly flagged as needing independent re-derivation —
not yet re-verified by `c5`): ~40% of `search_facts` calls return ≥70%-already-seen results;
the existing exact/substring mechanisms catch 71-91% of that, but 9-29% slip through because
query *text* looks new even though *results* are mostly redundant. Candidate fix (not
built): flag high overlap directly off the already-computed `alreadyRetrieved` fraction,
independent of query-text similarity.

**Decision needed**: worth building, and if so, whether `c5`'s session (which owns
`capability-fanout-prd-agent.ts`'s tool-call mechanics) re-derives these numbers first per
doc 25's own request, before committing to the fix.

### 2d. Cross-repo edges are structurally scarce outside 2 known pairs

Real, verified (doc 29, `c5`): `cross_repo_edges` is 99.2% same-repo. Real cross-repo
coverage exists only for angular→firebase (110 edges, deterministic join) and one
manually-curated node-iot→firebase pubsub binding — `build-cross-repo-edges.ts` was
hardcoded to exactly those two cases, never extended to Swift/iOS/Android/Kotlin at all.

Doc 31 (a third session, following doc 30's handoff) found the real scope to extend this is
"bigger/easier than assumed, especially iOS↔Swift-kit." **This directly connects to
`unit_management` doc 24's own explicit-scope work and the whole hierarchical-routing thread
(docs 12-15)** — better cross-repo edges would make graph-based expansion from a known
anchor (the BLE/WebRTC cross-cutting example from earlier discussion) actually work for the
Swift/iOS family, not just Angular/Firebase.

**Decision needed**: whether to build the extension doc 31 scoped — real, concrete next step
already investigated, not yet built by anyone.

### 2e. Citation drop-off by turn — most value front-loaded, tail is often wasted

Real (doc 34, `c5`): 68% of everything ever cited comes from a capability's *first* tool
call; 93.8% of real value is captured by turn 12 of a 20-turn budget. `skill.v3.md`'s own
70%-stop rule is well-calibrated — the problem is it's not reliably followed, matching this
whole session's repeated finding that soft, self-reported budget rules don't reliably bind
model behavior on their own (same lesson as the repeat-query fix's own design, §1).

**Real, compounding interaction with §2d**: in the poorly-connected repos (iOS/Android/
node-iot), 57% of *late-turn* graph calls come back completely empty, vs. 0-18% in
well-connected angular/firebase — meaning the missing cross-repo edges (§2d) specifically
make the *wasted tail* worse in the repos that most need graph expansion to work.

**Decision needed**: whether this argues for a harder, code-enforced version of the 70%-stop
rule (mirroring the repeat-query escalation gate's own soft→hard progression, §1) — not
designed yet.

### 2f. `maxTurns` default — a real, live quality/cost tradeoff, no clean answer

Real A/B (`c5`, today): `maxTurns=10` is ~4x cheaper, ~9x faster than 20, citation rate holds
— but genuinely loses one real cross-repo synthesis claim that 20 finds. Not a free win
either direction.

**Decision needed**: pick a default (or make it use-case/request-dependent), with eyes open
that lower isn't strictly better — a real, stated trade, not a bug to fix.

## 3. In-flight, human-in-the-loop, already moving — no new decision needed, just tracking

- **Docs 32/33** (`c5`): Angular/iOS/Android UX screen-map JSON skeletons, zero-spend,
  built for human hand-filling (screen names/descriptions), to feed `GROUNDING_DOCS`.
  Angular's extraction is clean (real `angular_route` data exists); iOS/Android is
  heuristic-only (no dedicated route kind) and explicitly scoped as verify-first, not a
  mechanical repeat.
- **Phase 1's format gap**: no module-level narrowing exists yet (only repo-level) — this
  session's doc 24 found it live (`1b` resolving to 24 capabilities, not 5). User is
  narrowing `1b` by hand for now; a real `<!-- modules: ... -->` tag (mirroring the existing
  `repo:`/`directive:` convention) is the real fix, not designed/built yet.
- **Phase 3** (skill.v3.md directive-prioritization rule): the directive mechanism built in
  Phase 2 only half-works until this lands — the fact reaches the model's context, nothing
  yet tells it to prioritize searching it first.
- **Phases 4/5** (advisory routing safety net, human-checkpoint UX): per doc 16/17,
  untouched, real open design questions.

## 4. Explicitly not conflated — kept separate on purpose

- Doc 25 (this session's retrieval-overlap finding) and doc 28 (`c5`'s extraction-level
  noise finding) are genuinely different layers, not two framings of the same problem —
  confirmed via direct exchange, not assumed.
- The `pubsub_event_route` "wrong module" finding (§2b) is about *scoping*, not about the
  fact kind's own quality — don't fold this into §2a/§2b's classifier/tiering discussion,
  it's closer in shape to §2d/§2e's routing-and-coverage thread.
- `exported_symbol`/`angular_injectable`'s low PRD-value doesn't mean low value generally
  (§2b) — don't let a future session re-derive "these are noise" from citation rate alone
  without checking this doc first.

## Real spend across everything collated here

Zero real LLM/embedding spend in any of the investigation/finding docs (25, 27-31, 34) or in
Phase 0/Phase 2's builds (17-18, 23-24) — all read-only Postgres/code work or free dry runs.
Real spend only in: the enum-fix rebuild (docs 06-08, small, already spent), the Swift
pipeline refresh (docs 19-22, $0 — no facts needed re-embedding), and whatever real
capability-fanout test runs happen next once §2's decisions are made — none of which have
been run yet pending those decisions.

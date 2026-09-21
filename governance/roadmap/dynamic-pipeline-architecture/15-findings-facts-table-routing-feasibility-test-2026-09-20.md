# Findings: facts-table-derived (repo,module) routing feasibility test

Feasibility test run 2026-09-20, per the prompt in
`14-feasibility-test-prompt-facts-table-routing-2026-09-20.md`, following
`13-findings-hierarchical-routing-investigation-2026-09-20.md`. Decide-stage feasibility
test, not a production build — nothing changed in `search.ts` or
`capability-fanout-prd-agent.ts`. Postgres access was read-only `SELECT` throughout, per the
prompt's hard constraint; no `INSERT`/`UPDATE`/`ALTER` and nothing written to `facts_index`.
Real spend incurred: **29 embedding calls** (28 group + 1 query), approved explicitly before
running. Throwaway script (`_scratch-14-facts-table-routing-test.ts`) and its scratch
results JSON deleted after this doc was written, per the diagnostic-script-cleanup rule. No
git commits made.

## Summary verdict

**Mixed, real result — genuinely improves one of the two problems this investigation cared
about, and does not touch the other.**

- The `unit_management` near-tie is convincingly resolved: at fact-level it was a
  statistical tie for the routing cutoff (6th/10, 0.0023 behind 5th); at group level it's the
  clear #1 of 28 groups, with real separation from #2 (0.0216 gap).
- The iOS recall gap — the actual motivating problem for this whole investigation — is
  **not** resolved: `ios-oskey-dev/iOS App` ranks 23rd of 28 groups (82nd percentile),
  essentially the same relative position as its 8th of 10 (80th percentile) at fact level.
  Both real occurrences of the 4-way `OSKBuildingUnitInhabitantType` collision in
  `ios-oskey-dev/iOS App` remain buried under this signal too.

So: this specific approach is worth keeping for the near-tie-disambiguation problem, but
does not by itself close the cross-platform-recall gap that motivated doc 12's original
investigation prompt. That's a real, useful, honest result — not a reason to abandon the
approach, but a reason not to oversell it as solving the whole original problem.

## Step 1: real (repo,module) pair count

`SELECT DISTINCT repo, module FROM facts` → **28 pairs** (confirmed twice: once ad hoc before
approval, once inside the throwaway script immediately before spending). This fixed the real
spend at 28 group embeddings + 1 query embedding = 29 total.

## Step 2: representative-text design (refined per review before running)

Original plan (distinct `symbol_name`, alphabetical order, flat 80-char truncation) was
revised after checking real data: `symbol_name` length is not uniform (median 21 chars, but
mean 95, max 28,691) because 2,802 `call_expression` facts store full multi-line source
snippets as `symbol_name`, not short identifiers — concentrated in `ios-oskey-dev` (6,075 of
`iOS App`'s ~10,979 distinct symbols are `call_expression`, and 73% of those contain a raw
embedded newline). Naive alphabetical + flat truncation risked flooding exactly the group
this test cared about most with fragmented code-snippet noise.

**Final design, per group:**
1. `SELECT DISTINCT symbol_name ... ORDER BY length(symbol_name) ASC, symbol_name ASC LIMIT
   250` — kind-agnostic (no hardcoded exclusion of `call_expression` or any other kind);
   shortest/cleanest identifiers surface first in every group generically. Confirmed before
   running that this doesn't starve any group: the smallest real count of clean (≤80 chars,
   no newline) distinct symbols per group was `firebase-oskey-dev/tasks` at 29 — every group
   has enough legitimately short symbols to fill or approach the 250 cap without needing
   snippet fragments, and the cap is a ceiling, not a target (`tasks` and other small groups
   below 250 just used everything they had — see `nSymbolsUsed` in step 4's raw output; 6 of
   28 groups came in under 250: `OSKDoorUnlockActivityExtension` 219, `call` 194,
   `kotlin-usb-oskey-io` 109, `kotlin-webrtc-domain-oskey-io` 207, `OSKEYTests` 41, `tasks`
   31, `components` 68).
2. Per selected value: truncate at the first embedded newline if present, else cap at 80
   characters (defensive safety net; the length-ascending ordering already made this rarely
   necessary in practice).
3. Join with `, `.

Confirmed after running: token counts for all 28 groups ranged 334–2,555 (well under the
8,192-token limit; no `truncated: true` observed — though the provider didn't report the
`truncated` field for any of the 29 calls, a real reporting gap noted rather than assumed
false, same class of gap `embedding-adapter.ts`'s own comments flag for `billableCharacterCount`).

**Embedding framing chosen**: group texts were embedded via `embedFactDocuments` (document
side: `title: {repo}/{module} | text: {concatenated symbols}`) — `{repo}/{module}` used as
the `title` since there's no single natural title for an aggregate group the way a real
fact's `symbol_name` provides one for `embedFactDocuments`'s existing individual-fact
callers. The business request text was embedded via `embedSearchQuery` unchanged (query
side: `task: search result | query: {text}`), matching exactly how the real per-fact routing
pass would embed it.

## Step 3: real spend (as flagged and approved before running)

29 real `gemini-embedding-2` calls via Vertex AI (`mcp-server/db/embedding-adapter.ts`,
unmodified, imported by the throwaway script): 28 group document embeddings + 1
business-request query embedding. Ran once; no retries were needed (no 429s hit).

## Step 4: real ranked results

Distance metric: **L2 (`<->`)**, matching exactly what `search.ts`'s real query uses
(`embedding <-> $1::vector AS distance`) — not cosine distance — so ranks/gaps here are
computed the same way the recorded fact-level numbers (8th/0.7459, 6th/0.7323, 5th/0.7300)
were. Full ranked output (28 groups):

```
 1. firebase-oskey-dev/unit_management            distance=0.7507  nSymbolsUsed=250
 2. firebase-oskey-dev/organization                distance=0.7723  nSymbolsUsed=250
 3. firebase-oskey-dev/building                    distance=0.7968  nSymbolsUsed=250
 4. firebase-oskey-dev/core                         distance=0.8089  nSymbolsUsed=250
 5. firebase-oskey-dev/admin                        distance=0.8094  nSymbolsUsed=250
 6. angular-app-oskey-io/features                   distance=0.8137  nSymbolsUsed=250
 7. firebase-oskey-dev/apps                         distance=0.8199  nSymbolsUsed=250
 8. firebase-oskey-dev/settings                     distance=0.8244  nSymbolsUsed=250
 9. firebase-oskey-dev/user                         distance=0.8255  nSymbolsUsed=250
10. android-intercom-oskey-io/kotlin-ble-kit-oskey-io distance=0.8337  nSymbolsUsed=250
11. angular-app-oskey-io/core                       distance=0.8382  nSymbolsUsed=250
12. firebase-oskey-dev/supplier                     distance=0.8411  nSymbolsUsed=250
13. swift-cloud-kit-oskey-dev/OSKCloudKit            distance=0.8483  nSymbolsUsed=250
14. ios-oskey-dev/OSKDoorUnlockActivityExtension     distance=0.8559  nSymbolsUsed=219
15. firebase-oskey-dev/access_control_device         distance=0.8580  nSymbolsUsed=250
16. node-iot-api-oskey-io/access_control_device      distance=0.8582  nSymbolsUsed=250
17. firebase-oskey-dev/call                          distance=0.8612  nSymbolsUsed=194
18. android-intercom-oskey-io/kotlin-usb-oskey-io    distance=0.8621  nSymbolsUsed=109
19. android-intercom-oskey-io/kotlin-webrtc-domain-oskey-io distance=0.8656  nSymbolsUsed=207
20. swift-ui-kit-oskey-dev/OSKUIKit                  distance=0.8669  nSymbolsUsed=250
21. android-intercom-oskey-io/kotlin-webrtc-data-oskey-io distance=0.8691  nSymbolsUsed=250
22. swift-ble-kit-oskey-dev/OSKBluetoothLEKit         distance=0.8728  nSymbolsUsed=250
23. ios-oskey-dev/iOS App                            distance=0.8766  nSymbolsUsed=250
24. android-intercom-oskey-io/app                    distance=0.8837  nSymbolsUsed=250
25. ios-oskey-dev/OSKEYTests                         distance=0.8846  nSymbolsUsed=41
26. firebase-oskey-dev/tasks                         distance=0.8861  nSymbolsUsed=31
27. swift-webrtc-kit-oskey-io/OSKWebRTCKit            distance=0.8919  nSymbolsUsed=250
28. angular-app-oskey-io/components                  distance=0.8974  nSymbolsUsed=68
```

**Answering the prompt's specific questions:**

- **iOS ("iOS App") rank/distance**: 23rd of 28 (0.8766), vs. 8th of 10 (0.7459) at fact
  level. In percentile terms (worse-than-X%-of-candidates): ~82nd percentile now vs. ~80th
  percentile before — essentially unchanged, not meaningfully improved. **The group-level
  signal does not surface iOS any better than flat fact-level search did.**
- **`unit_management` rank/gap**: 1st of 28 (0.7507) — a clean win, not a near-tie. Gap to
  the real #2 (`organization`, 0.7723) is 0.0216, roughly 9x the old 0.0023 fact-level gap to
  the cutoff. **This is a real, meaningful improvement** — the previous statistical tie is
  gone; `unit_management` is now unambiguously the strongest candidate.
- **4-way `OSKBuildingUnitInhabitantType` collision**: confirmed directly (`SELECT ... WHERE
  symbol_name = 'OSKBuildingUnitInhabitantType'`) both `ios-oskey-dev` occurrences are in the
  `iOS App` module — the same one ranked 23rd above. `firebase-oskey-dev/building` ranks 3rd
  (clearly inside any reasonable top-5) and `angular-app-oskey-io/core` ranks 11th
  (mid-pack, outside a top-5). **No cleaner signal for the iOS side of this collision** — the
  group-level approach correctly keeps `building` near the top but doesn't rescue the iOS or
  Angular occurrences any better than before.

**If a top-5 cutoff were applied to this group-level ranking** (mirroring
`CAPABILITY_MAX_CAPABILITIES=5`): `unit_management`, `organization`, `building`, `core`,
`admin` — all 5 are `firebase-oskey-dev` modules. This is a genuinely different candidate set
from the current flat top-5 (`building`, `features`, `organization`, `user`, `core`) — it
correctly promotes `unit_management` and demotes `user`/`features` — but it's *more*
firebase-concentrated, not less; no non-firebase repo enters the top 5 until
`angular-app-oskey-io/features` at rank 6.

## A real caveat on comparing raw distance magnitudes across the two methods

Worth stating plainly: this test's distances (0.7507–0.8974) sit in a visibly higher/worse
band than the individual-fact distances on record (0.7300–0.7459), even for the
`unit_management` group that "won." That's not necessarily a sign the group-level documents
are worse matches — it plausibly reflects that a 250-symbol concatenated document (up to
2,555 tokens) sits further from any short, specific query in embedding space than a single
~25-token fact description does, independent of topical relevance. The **rank order and
relative gaps** within each method are the meaningful comparison here (what this doc reports
above); comparing the two methods' raw distance values against each other directly would be
a real, honest limitation of this test, not something to gloss over. A future test comparing
methods more rigorously would need a shared held-out gold set with known-correct answers
scored under both schemes, not just distance-value comparison — out of scope for this
feasibility test.

## Real, honest interpretation

This is genuinely useful, mixed evidence, not a clean win or a clean loss:

- **Positive**: the cheapest option from doc 13 §6 — no new pipeline infrastructure, no
  revival of phase-02 or the knowledge-pipeline stage, just a derived layer over data
  already 100%-embedded today — produces a real, meaningfully better signal for at least one
  of the two problems this investigation set out to test (the `unit_management` near-tie).
  That's a genuine result worth keeping in mind for future routing work, not a wasted test.
- **Negative**: it does not, by itself, close the actual motivating gap (iOS/cross-platform
  recall) that started this whole investigation in doc 12. The 4-way symbol-collision case
  confirms this concretely: the iOS side of a real collision stays buried under this signal,
  same as under the current flat search.
- **Why iOS likely stays buried, as a real, testable hypothesis for a future session (not
  confirmed here)**: the business request text (`1a-ownernonresident.txt`) uses
  backend/domain vocabulary ("inhabitantType", "Property Manager", "PGO") that aligns more
  closely with Firebase's naming conventions than with iOS's Swift-side naming for the same
  concepts — every one of the top 9 group ranks above is `firebase-oskey-dev`. That's a
  vocabulary-overlap problem a representative-text scheme built purely from `symbol_name`
  values (this test) may not fix regardless of aggregation level, since it doesn't change
  what vocabulary exists in either corpus. Confirming this would need a different test (e.g.
  a request phrased in more platform-neutral or explicitly cross-platform terms, already
  partially tried via 1b in doc 13 §context with no effect at the fact level) — not run here.

## Real spend note

29 real `gemini-embedding-2` calls made, as flagged and approved in this session before
running. No other LLM or generation calls made. Postgres touched read-only throughout.

## Open items for a future decide-stage session

- Whether `unit_management`'s clear win is a one-off artifact of this single test case or a
  general pattern — would need testing against more of the gold business-request set before
  trusting broadly.
- The vocabulary-mismatch hypothesis above (real, plausible, not yet tested) as a specific
  next thing to check if cross-platform recall stays the priority problem.
- Whether a hybrid approach (group-level for disambiguating near-ties within a already-likely
  repo, flat fact-level for initial candidacy) captures the `unit_management`-style win
  without giving up on iOS recall — not designed or tested here, a real option for a future
  decide session to scope.

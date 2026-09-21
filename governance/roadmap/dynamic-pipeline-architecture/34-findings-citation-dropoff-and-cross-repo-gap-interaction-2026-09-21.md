# Findings: citation dropoff by turn, and its interaction with the cross-repo edges gap

Two real, connected findings from the same day's real run data. First: does the rate of
"newly discovered, eventually-citable evidence" drop off as a capability approaches its turn
cap? Second (prompted directly by the user connecting it to doc 29): does the missing
cross-repo graph data make that dropoff worse, by causing wasted late-turn graph-traversal
attempts specifically in the poorly-connected repos? Read-only, zero LLM calls — computed
directly from real `FULL_DEBUG` traces (`tool-calls-*.jsonl`) and each capability's own raw
structured output (`llm-*.json`, which carries the real `evidenceRefs` — raw fact_refs — a
capability actually cited, read directly rather than reverse-mapped from rendered markdown).

## Methodology

13 capabilities across 4 real runs that reached 19+ turns (`2026-09-20-001`, `002`, `003`,
`2026-09-21-002`). For each, read the capability's own `llm-<key>.json` for every real
`fact_ref` it ever cited (`evidenceRefs` on its `cited-list` sections), then walked its
`tool-calls-<key>.jsonl` in real chronological order, recording the first tool-call index at
which each cited fact_ref was ever returned by `search_facts`, `walk_cluster`, or
`get_graph_neighbors`. 130 real eventually-cited facts tracked in total; all 130 were found in
their own capability's trace (0 unexplained).

## Finding 1: a real, two-stage dropoff — not a single cliff, but genuinely steep after call ~12

| through call # | cumulative % of everything eventually cited |
|---|---|
| 1 | 67.7% |
| 5 | 73.8% |
| 10 | 89.2% |
| **12** | **93.8%** |
| 15 | 96.9% |
| 20 (near the cap) | 100% |

Per-call-position new-citable-fact counts show the shape clearly: call #1 alone contributes 88
of 130 (68%) — the first, broadest `search_facts` call does most of the real work. Calls 2-4
contribute almost nothing (2, 1, 0). Calls 5-12 show a real, steady trickle (3-6 new citable
facts each) — this is where `walk_cluster`/`get_graph_neighbors` and follow-up searches earn
their keep. **From call 13 onward, it flattens**: 0, 0, 4, 0, 2, 0, 1, 1, 0 across calls
13-21 — just 8 of 130 (6%) from the entire back third of the turn budget, despite that being
~43% of all turns spent.

**Direct, real tie to existing policy**: `skill.v3.md`'s own rule 4 already says stop at 70%
of budget (14 of 20 turns) — this data says that would have kept ~96% of real value. The rule
is well-calibrated; the gap is that it isn't reliably followed (every capability analyzed here
ran to 19-21 turns anyway) — the same self-regulation gap that motivated the code-enforced
escalation gate built earlier this session, now showing up on a different axis.

## Finding 2: the missing cross-repo graph data measurably worsens the late-turn tail

User's direct question: does the cross-repo-edges gap (doc 29 — 99.2% of `cross_repo_edges`
rows are same-repo; `firebase`↔`node-iot`↔`android-intercom` have essentially zero real
cross-repo edges) contribute to wasted late-turn activity, not just missing citations?
Checked directly, comparing the well-connected `angular-app-oskey-io`/`firebase-oskey-dev`
runs against the poorly-connected pubsub-topic run (`firebase`/`node-iot`/`android-intercom`,
the exact repo trio doc 29 found has essentially no real edges between them):

| run (repo pair) | late-turn (call 13+) graph calls returning **empty** |
|---|---|
| angular/firebase (001) | 1/14 (7%) |
| angular/firebase (002) | 0/10 (0%) |
| angular/firebase (003) | 2/11 (18%) |
| **firebase/node-iot/android (pubsub)** | **4/7 (57%)** |

**Real, and sharp.** In the poorly-connected repos, more than half of all late-turn graph
calls come back with nothing. Pulled the actual calls for the worst case,
`firebase-oskey-dev/access_control_device`: three separate `get_graph_neighbors` calls, at
turns 15, 17, and 19, **each on a different real anchor fact_ref**, all three empty. That's
the model trying several different genuine leads, one after another, specifically inside the
part of its budget Finding 1 already shows is low-value — not because it's being lazy or
looping on the same query, but because it's doing exactly what a thorough persona should
(trying different real anchors) against a graph that structurally doesn't have the edges to
answer with.

## What this means together

These two findings compound rather than sit side by side: the generic "diminishing returns
after ~turn 12" pattern (Finding 1) already argues for a tighter, code-enforced stopping point
regardless of repo. But for the specific repos doc 29 found have almost no real cross-repo
graph data, the *cost* of not stopping earlier is measurably higher — a bigger share of the
wasted tail is spent on structurally-doomed graph traversal, not just repeated/lower-value
search. Fixing doc 29's gap (building real iOS↔Swift-kit and equivalent edges) would help
citation completeness directly, per doc 29; it would *also*, per this finding, reduce the
specific kind of late-turn waste seen here — a real, additional reason to weigh when scoping
doc 30's investigation, not a separate concern.

## Explicitly not done here

- No fix designed or built — matches this thread's own investigate-first discipline.
- Only 4 runs / 13 capabilities checked — real, but not a huge sample; the pubsub run is the
  only real data point for the "poorly-connected repos" side of Finding 2's comparison. A
  second poorly-connected-repo run (e.g. an iOS/Swift-kit-scoped dummy PRD) would be a real,
  worthwhile confirmation before treating the 57%-vs-7-18% gap as fully settled.
- Whether a code-enforced stop *specifically triggered by* a string of empty graph calls
  (as opposed to a generic turn-percentage cap) would be a better, more targeted fix than
  tightening the existing budget rule is a real, open design question, not decided here.

# Findings: the citation-noise problem traced upstream to extraction, not retrieval

Follow-up to [27-findings-citation-rate-by-fact-kind-2026-09-20.md](27-findings-citation-rate-by-fact-kind-2026-09-20.md),
prompted by the user redirecting the investigation from retrieval-time filtering to a more
fundamental question: are we *extracting and storing* facts that were never going to be useful,
independent of how `search_facts` ranks or filters them? Read-only investigation, zero LLM
calls — real Postgres queries and direct reads of the real extraction code
(`pipeline/*/phase-01-ast-extraction/02-build-module-evidence.ts`).

## Real correction first: repo coverage is much thinner than doc 27 implied

Doc 27's "7 kinds, 430 facts, always zero" finding was accurate for what it measured, but
checking it against the *whole* corpus (not just the 16 runs' gathered evidence) surfaces a
real gap doc 27 didn't flag clearly enough: **96.2% of all `function_declaration` facts
corpus-wide (2,670 of 2,775) live in repos none of the 16 runs ever touched** — iOS, Android
Intercom, the Swift kits, node-iot. Only 105 `function_declaration` facts are in the
angular/firebase repos those runs actually exercised. The other 6 confirmed-zero kinds are
cleanly in-domain (they only exist in `angular-app-oskey-io`/`firebase-oskey-dev`), so this
correction is specific to `function_declaration`, not the whole set.

**The well-evidenced, in-domain noise set, corrected**: 1,809 real facts —
`permission_candidate` (412), `exported_symbol` (391), `permission_error` (129),
`angular_template_binding` (730), `angular_injectable` (35), `pubsub_event_route` (7), plus
just the 105 in-domain `function_declaration` facts. All confirmed zero-cited across every
real run that could have cited them. The remaining 2,670 `function_declaration` facts (iOS/
Android/Swift/node-iot) are genuinely untested — no claim made about them here.

**Real, quantified cost of all 4,479 facts (the full 7-kind set, all repos)**: 6.5% of the
entire 69,005-fact corpus, and every single one is already embedded — real, sunk Vertex spend
already paid, not a future cost avoided by looking at this now. The real savings from any fix
here is on *future* pipeline syncs (re-extraction/re-embedding on the next merge), not a
recovery of money already spent.

## Root cause 1: `permission_candidate` is a low-confidence tier, by the extractor's own design

`pipeline/firebase-oskey-dev/phase-01-ast-extraction/02-build-module-evidence.ts:596-601`:

```ts
// 9. permission_required / permission_candidate / permission_error
let pType = "permission_candidate";
if (item.permissionCandidateType === "permission_error") pType = "permission_error";
else if (item.confidence === "confirmed") pType = "permission_required";
```

`permission_candidate` is the **default fallback** for any permission-hint whose confidence
isn't `"confirmed"`. There's a genuinely higher-confidence sibling kind,
`permission_required`, for the ones that are. Checked the real split in Postgres:

| kind | real count |
|---|---|
| `permission_candidate` | 412 |
| `permission_error` | 129 |
| `permission_required` | **5** |

Only 5 of 546 total permission-hint facts (0.9%) ever reach the confirmed tier. The
extraction pipeline's own confidence classifier is already telling us most of these are weak
— the 0% citation rate found in doc 27 isn't a retrieval-ranking failure, it's the natural
consequence of a low-confidence heuristic flag that nothing downstream (search ranking,
citation logic, or the classifier's own confidence threshold) ever acts on. Two real,
different levers this points at, not decided here: (a) exclude the unconfirmed tier from what
`search_facts` serves/embeds at all, since a "maybe" flag was never going to make a citable
claim, or (b) look at why the confidence classifier almost never returns `"confirmed"` — is
546 real permission-hints and only 5 confirmed a sign the classifier itself is too
conservative, missing real, extractable confidence signals in the source it's not using yet?

## Root cause 2: `exported_symbol` is unconditional, no confidence tiering at all

Same file, lines 542-556: extracted for **every** `export`/re-export statement in every file,
unconditionally — no filter, no confidence check. A barrel-file's `export * from './foo'` line
becomes a real, accurate `exported_symbol` fact every time. It's genuinely correct data — the
file really does export that — but it's pure module-wiring, never the subject of a PRD-style
claim. Different shape of problem from `permission_candidate`: not a low-confidence heuristic
gone unfiltered, just a structural fact type that was always going to be citation-dead by what
it *is*, regardless of confidence.

## What this changes about how to think about the problem

Doc 27 framed this as "which fact kinds are worth searching on" — a retrieval-time question.
This traces the same 1,809 real facts to two different, real, upstream causes:
1. A confidence signal the extractor already computes but nothing downstream uses
   (`permission_candidate`/`permission_error` vs. `permission_required`).
2. A structural fact type extracted unconditionally regardless of downstream citability
   (`exported_symbol`, and likely `angular_template_binding`/`angular_injectable`/
   `pubsub_event_route` on the same pattern — not individually checked here, flagged for a
   follow-up before assuming they're identical in shape).

Both are real, different levers from "filter `search_facts` results by kind" — this is about
whether these facts should be extracted/embedded at all, not just how they're ranked once
they're already in Postgres. A fix here (skip embedding low-confidence-tier or
structurally-noisy kinds) would save real, recurring Vertex spend on every future sync, not
just clean up query results.

## Explicitly not done here

- Not checked: whether `angular_template_binding`, `angular_injectable`, `pubsub_event_route`
  follow the "unconditional structural extraction" pattern (root cause 2) or have their own
  confidence-tiering story (root cause 1) — worth checking before generalizing either root
  cause to all 7 kinds.
- Not checked: why the `permission_required` confidence classifier so rarely fires — a real,
  separate, worthwhile investigation (is 5-of-546 correct, or is the classifier itself
  under-confident) before deciding whether to improve it or just exclude the unconfirmed tier.
- No fix designed or built. This is investigation, matching docs 25-27's own scope discipline
  — a real decide-stage doc is the natural next step if this direction is worth pursuing, not
  done here.
- Diagnostic queries used to produce these numbers were run directly (not saved as scripts) —
  the real findings live in this doc.

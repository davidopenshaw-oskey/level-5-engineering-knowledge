# Findings: citation rate by real fact `kind` — the direct answer to "gathered but not cited"

Follow-up to [26-findings-search-facts-overlap-reanalysis-2026-09-20.md](26-findings-search-facts-overlap-reanalysis-2026-09-20.md),
prompted directly by the user pointing out that neither doc 25 nor doc 26 actually looked at
*why* gathered facts don't get cited — both examined retrieval-level overlap/redundancy, a
related but genuinely different question. This doc looks at the citation mechanism itself.
Read-only, zero LLM calls — every number below comes from real, already-written output
documents (`### Audit Trail` sections) and, for one cross-check, a real `FULL_DEBUG` trace.

## Methodology

Parsed every real run's rendered `.md` output under `output/agent-runs/prds/test/` that has
an `### Audit Trail` section — **16 real runs**, spanning **2026-09-17 through 2026-09-20**
(four days, every persona/template combination tested in that span, both with and without
grounding docs, both vector-routed and explicit-scope-routed, spanning every fix landed in
this thread including the graceful-wrap-up fix, the cross-module signal, and the
escalation-gate fix). For each run, every evidence entry (both the cited section and the
`Audit Trail`'s uncited section) was parsed for its real `kind` (the first field of the
pipe-delimited fact display string, e.g. `model_property|features|...`), and classified cited
vs. not based on whether it carries a `cite-N` backlink. **6,467 total real evidence entries**
across the 16 runs; overall citation rate **7.5%** (488 cited / 5,979 not) — consistent with
doc 25's originally-cited 91-94% uncited range.

## The direct finding: citation rate is not uniform — it's a real, stable property of the fact `kind`

### Tier 1 — reliably, structurally zero: 7 kinds, 430 real facts, 16 runs, never once cited

Checked per-run, not just in aggregate — these kinds hit **zero citations in every single run
they appear in**, not just a low average masking some runs where they worked:

| kind | total uncited | runs it appears in | ever cited? |
|---|---|---|---|
| `permission_candidate` | 164 | 16/16 | **never** |
| `exported_symbol` | 91 | 14/14 | **never** |
| `permission_error` | 67 | 11/11 | **never** |
| `function_declaration` | 52 | 13/13 | **never** |
| `angular_template_binding` | 40 | 12/12 | **never** |
| `pubsub_event_route` | 9 | 3/3 | **never** |
| `angular_injectable` | 7 | 4/4 | **never** |

`permission_candidate` alone (164 real facts, appearing in every single one of the 16 runs) has
never been cited once across four days of real testing. Checked what these facts actually are,
directly:
- `permission_candidate`: a bare RBAC permission-string mention near relevant code (e.g.
  `permission_candidate|features|.../property-dashboard.component.ts|v1.org.residents.admin|#1`)
  — not a structural code fact (method, type, binding), a heuristically-flagged string.
- `exported_symbol` / `imports_dependency`: pure module-wiring ("this file imports X" /
  "this file re-exports Y") — plumbing, not behavior.
- `permission_error`, `function_declaration`, `angular_template_binding`,
  `pubsub_event_route`, `angular_injectable`: same shape — real, structurally-accurate facts
  about the codebase's wiring/permissions, but not the kind of thing a PRD-style claim ever
  cites as its evidence.

**Checked against repo/module to rule out a data-quality confound**: this is not concentrated
in one bad module. `permission_candidate` alone spans `features` (94), `organization` (56),
`user` (5), `settings` (5), `core` (3), `building` (1) — six different modules, same zero
pattern in every one. This is a real property of the *kind*, not an artifact of one module's
data being bad.

**Directly answers the "older data might be misleading" worry**: it isn't, here. This exact
zero pattern holds identically across every run from 2026-09-17 (before any fix in this
thread) through 2026-09-20 (after the cross-module fix, the escalation-gate fix, grounding
docs on and off, vector routing and explicit-scope routing). A pattern this stable across that
much real, unrelated change is *stronger* evidence than any single recent run could give —
it's not tied to any one bug or config, so fixing something else won't make it go away on its
own.

A further 10 kinds show the same zero pattern but with fewer runs of real data (1-2 runs each,
so held to a lower confidence than the 7 above): `struct_declaration`, `route_definition`,
`angular_signal`, `extension_declaration`, `mongo_operation`, `angular_guard`,
`external_hook`, `firestore_trigger`, `pubsub_operation_route`, `firestore_path_touched`.
Directionally consistent, not yet confirmed at the same reliability.

### Tier 2 — the real volume problem: low-but-real citation rate, dominates raw count

| kind | cited/total | rate | runs with any citation |
|---|---|---|---|
| `model_property` | 214/2,365 | 9.0% | 14/16 |
| `call_expression` | 62/1,559 | 4.0% | 16/16 |
| `type_alias` | 43/544 | 7.9% | 13/16 |
| `source_file` | 23/276 | 8.3% | 9/16 |
| `source_class` | 10/212 | 4.7% | 7/16 |

These five kinds alone total **4,956 of the 6,467 real evidence entries (76.6% of everything
gathered across all 16 runs)**. They're not useless — every one of them gets cited *somewhere*
across the dataset, unlike Tier 1 — but the rate is low enough that the sheer volume is the
real driver of the "gathered but not cited" number, not any one run's bad luck. **Correction to
my own earlier, smaller-sample read**: in the single small-scope-test run I looked at first,
`type_alias` showed 0/31 — I described that as a real 0% finding. At 16-run scale it's
actually 7.9% (43/544), a real, if low, rate. The smaller sample wasn't wrong data, just too
small to see the real rate — worth remembering before trusting any single-run kind-level
number without checking it against more data, exactly the caution the user raised.

### Tier 3 — genuinely higher-value kinds

| kind | cited/total | rate |
|---|---|---|
| `class_method` | 46/143 | 32.2% |
| `firebase_callable_call` | 9/28 | 32.1% |
| `angular_component` | 7/31 | 22.6% |
| `service_method` | 51/413 | 12.3% |

These represent actual behavior, UI bindings, or callable entry points — the shape of fact a
PRD-style claim naturally cites ("this component binds X via formControlName", "this method
does Y"). Real, meaningfully higher rates, consistent across multiple runs each.

## What this means, concretely

The overlap/redundancy work in docs 25/26 and this doc's kind-level finding are **both real,
but answer different questions** — overlap explains wasted *retrieval calls* (re-fetching the
same thing); this finding explains wasted *evidence volume* (fetching real, unique, correctly-
retrieved facts that structurally were never going to be cited). They're additive, not
competing explanations for the same 91-94% number.

This is a more directly actionable signal than the overlap work: **Tier 1 alone (430 real
facts, 6.6% of all gathered evidence) is a reliable, config-independent, time-stable candidate
for filtering or de-prioritizing at the `search_facts` level** — not because these facts are
wrong or low-quality as code facts, but because this fact *kind* has never once, in 16 real
runs across 4 days and every configuration tested, supported a citable claim. Tier 2's volume
problem is real but needs a different treatment — these kinds do have real value sometimes
(4-9% of the time), so an outright filter would risk losing genuine evidence; a de-prioritization
in ranking, or a "read for context, cite sparingly" framing, fits better than exclusion.

## Explicitly not done here

- No fix designed or built — this is investigation, matching doc 25/26's own scope discipline.
- Whether Tier 1's kinds still have *indirect* value (shaping the model's understanding even
  when never individually cited) isn't checked — this doc only measures citation outcome, not
  reasoning-support value. A fact kind that's "never cited" could still be "read and correctly
  used to understand context before citing something else" — worth a real check before treating
  zero-citation as proof of zero-value, not assumed here.
- This dataset is all from the same real domain (the Oskey `inhabitantType`/`ownerNonResident`
  business case, in its various phrasings) — whether this kind-level pattern generalizes to a
  genuinely different business request/topic is untested; flagged, not assumed.
- Diagnostic scripts used to produce these numbers were temporary and deleted after producing
  the figures recorded here, per this project's script-cleanup discipline.

# Handoff: LLM Output Variance in Phase 2 Synthesis

**Status:** Open problem. Confirmed real, repeatedly reproduced, root mechanism not understood. Written to hand off for outside input, not as a design proposal.
**Audience:** Anyone reviewing this pipeline's reliability — assume no prior context beyond "Phase 1 extracts AST facts deterministically, Phase 2 uses an LLM to synthesize those facts into cited engineering documentation."

---

## The problem, plainly

Give the pipeline the exact same facts, the exact same contract/prompt, and the exact same model config, on two separate runs — and the two runs produce **meaningfully different output**. Not just different wording. In some cases, genuinely different conclusions: a risk finding present in one run's output has no equivalent in the other run's output on the same underlying evidence, and vice versa.

This has now been measured four separate times, across two repos, under three different configurations, and the effect is real and repeatable every time it's been tested. It has **not** been solved, and the one fix that seemed like the obvious candidate (lowering temperature to 0) made things worse in one comparison, not better.

---

## What "variance" looks like, concretely

Every module-level engineering profile ends with a citation-validated Risks/Open Questions section. Citation count (how many distinct evidence facts a document cites) is used here as a simple, machine-countable proxy for "how much of the available evidence did this run actually engage with" — not a quality metric on its own, but a stable number to diff.

### Measurement 1 — Firebase, two independent runs, `temperature: 0.2` (the default config), different days

| module | run A | run B | delta |
|---|---|---|---|
| access_control_device | 33 | 45 | +36.4% |
| admin | 136 | 152 | +11.8% |
| apps | 77 | 44 | -42.9% |
| building | 252 | 183 | -27.4% |
| call | 36 | 26 | -27.8% |
| core | 123 | 113 | -8.1% |
| organization | 232 | 289 | +24.6% |
| settings | 98 | 90 | -8.2% |
| supplier | 66 | 60 | -9.1% |
| tasks | 21 | 13 | -38.1% |
| unit_management | 25 | 33 | +32.0% |
| user | 256 | 278 | +8.6% |

Range: **-42.9% to +36.4%**. This was itself the second confirmation of an earlier, independent measurement on a different pair of runs that found **-29% to +86%** swings. Two separate measurements, same pipeline, same effect.

**Zero fabricated citations found in either run, across all 12 modules.** Every citation traced back to a real fact. The variance is in *which* facts get engaged with and *what gets concluded from them*, never in inventing evidence that doesn't exist.

### Case study: `apps` module — the swing isn't just density, it's substance

`apps` had the largest citation drop (-42.9%) in Measurement 1, so it was diffed in full, not just by citation count. Of the earlier run's 4 cross-cutting risks:
- 2 recurred (reworded, same underlying finding).
- 1 ("Unbounded Log Growth") was **absent entirely** from the later run.
- 2 new risks appeared in the later run with **no equivalent at all** in the earlier one ("Aggressive Token Pruning" — APNS/FCM failure triggers immediate token deletion; "Lack of Rate-Limiting/Quota Enforcement" on email/SMS services).

Both runs' findings were independently well-grounded against real evidence — verified by tracing citations back to source. This means: **a single run's Risks section can miss a real, evidenced finding that a second run on identical facts would surface, and there is no way to know which run you got without generating a second one and diffing.**

### Measurement 2 — Node-IoT, two independent runs, `temperature: 0.2`, same commit

| | run A | run B | delta |
|---|---|---|---|
| Module profile citations | 94 | 100 | +6.4% |
| Module profile length | 697 lines | 581 lines | -17% |

Substance check: 3 of 4 cross-cutting risks (including a High-Risk finding — a MongoDB query against the wrong collection) persisted across both runs, reworded but substantively identical. One risk from run A didn't reappear in run B.

**This is meaningfully more stable than Measurement 1.** Initial hypothesis was "smaller repo → less surface area for variance" — see "What correlates with severity" below, where this was tested more rigorously against real token-volume data and did *not* hold up as a simple size effect.

### Measurement 3 — Firebase, `temperature: 0` (deterministic sampling) vs. `temperature: 0.2` baseline

Run this comparison **first**, and it looked like the swings were even bigger (up to -81.7% on one module) — but this comparison was later recognized as testing the wrong thing: comparing temp-0 output against temp-0.2 output only proves two different sampling strategies produce different output, which was never in question. It doesn't test whether temp 0 is more *self-consistent*.

### Measurement 4 — Firebase, `temperature: 0` vs. `temperature: 0` (the actual test)

Two full Firebase runs, both at `temperature: 0`, diffed directly against each other — the real test of whether deterministic sampling improves reproducibility.

| module | temp0 run A | temp0 run B | delta |
|---|---|---|---|
| access_control_device | 41 | 40 | -2.4% |
| admin | 164 | 168 | +2.4% |
| apps | 66 | 51 | -22.7% |
| building | 228 | 247 | +8.3% |
| call | 23 | 18 | -21.7% |
| core | 105 | 118 | +12.4% |
| organization | 248 | 300 | +21.0% |
| settings | 78 | 90 | +15.4% |
| **supplier** | 11 | 57 | **+418.2%** |
| tasks | 14 | 13 | -7.1% |
| unit_management | 23 | 40 | +73.9% |
| user | 254 | 252 | -0.8% |

**Result: temperature 0 did not reduce variance.** The two most extreme swings here (+418.2%, +73.9%) are larger than anything seen at `temperature: 0.2`. Sanity-checked directly: both `supplier` documents are substantial (453 vs. 532 lines), neither truncated — this is real content variance, not a broken-output artifact.

This is a genuinely negative result, not an inconclusive one. Google's own SDK documentation for the `seed` parameter states plainly: *"it's not a guaranteed absolute deterministic behavior"* — consistent with what was found, but this result is stronger than "some residual variance was expected."

---

## What's been ruled out

- **Fabrication.** Every citation in every compared document traces to a real fact. Confirmed across all four measurements. The model never invents evidence — it selects and frames differently.
- **Structural/parsing failure.** Section headers are correctly formed in every compared run. This isn't a format-compliance problem.
- **Concurrent load / rate limiting on our infrastructure.** Checked directly by cross-referencing timing logs between two sessions making real calls against the same Vertex AI project — confirmed no overlap in the specific incident this was checked against.
- **Temperature as the sole or primary lever.** Directly tested (Measurement 4) and the result was negative — same-temperature runs varied as much as or more than different-temperature runs.

## What hasn't been tried yet

- **`seed`.** Not wired through the codebase yet (`llm-adapter.ts` doesn't pass it to the API call). Given temperature 0 alone didn't help, and Google's own docs caveat that even a fixed seed is "not guaranteed" deterministic, this is not expected to be a full fix — but it hasn't been isolated and tested on its own.
- **Few-shot calibration examples.** The hypothesis: the variance isn't in *finding facts* (deterministic, always available) but in *judging which facts are worth reporting as a risk* — a fuzzier, more subjective task where 2-3 well-chosen worked examples (a pattern that IS reportable vs. a similar one that ISN'T) might narrow the model's calibration. Not yet built or tested.
- **Multi-run consensus.** Not yet discussed in depth: generate the same document N times and keep only findings that recur across a majority of runs, discarding one-off outliers. Would directly address the "apps" case study's core problem (a real finding appearing in only one of two runs) at the cost of Nx the LLM spend per document. Worth outside input on whether this cost is justified given what's actually at stake for a given document.
- **Structured/schema-constrained output.** Considered and set aside — this would fix malformed *structure*, which has never actually been the failure mode observed. It would not stop the model from choosing a different subset of findings each run; it would just force whatever it picks into a rigid shape.

---

## What correlates with severity

**Tested directly: input window size (prompt/context size) is not the driver.** Pulled real per-module input-token totals from Measurement 4's run notifications and correlated against swing magnitude across all 12 modules:

| signal | correlation with \|delta%\| |
|---|---|
| total input tokens (summed across all of a module's calls) | -0.20 (weak, wrong direction) |
| largest single call's input tokens | +0.13 (noise) |
| average per-call input tokens | +0.44 (the only one worth noting, still not strong at n=12) |

Concrete counter-examples: `organization` has the largest total input of any module (3.9M tokens across 45 calls) but only a 21.0% swing. `user` is the second-largest by input and the single *most stable* module in the entire comparison (0.8%). Meanwhile the two most extreme outliers — `supplier` (+418.2%) and `unit_management` (+73.9%) — are mid-pack and small by input size respectively. **Bigger prompts do not reliably produce bigger swings; if anything the largest-input modules were among the more stable ones.**

Node-IoT's overall stability (Measurement 2) is also not simply "small input" then — it's a single-domain, single-module repo, which is a different kind of smallness (fewer distinct judgment calls to make, not just fewer tokens per call). Whatever is actually driving the effect, it isn't context-window size on its own. Worth outside input on what else to test — number of distinct capabilities/submodules per module is one candidate that hasn't been isolated from input-token volume yet (they're correlated with each other in this dataset, `organization` has both the most tokens and the most capabilities, so this dataset alone can't separate the two).

---

## Practical implication, right now, before this is fixed

**A single generation pass's Risks/Open Questions section (or any section requiring judgment/selection rather than fact restatement) should not be treated as exhaustive.** Everything it states is grounded and trustworthy — the risk is *incompleteness*, not *incorrectness*. For anything where missing a real finding matters (security review, architecture sign-off, impact analysis for a change), this is a real limitation of relying on a single run's output as-is.

---

## Where input is wanted

1. Is multi-run consensus (generate N, keep majority-agreeing findings) worth the added spend, or is there a cheaper mechanism to get the same reliability gain?
2. Input-token volume was tested directly and ruled out as the driver (see above) — is capability/submodule *count* per module (distinct from raw token volume, though correlated with it in this dataset) worth isolating as a separate variable, or is there a better candidate signal to test instead?
3. Does anyone have direct experience with few-shot calibration meaningfully narrowing this kind of judgment-call variance in a similar RAG/synthesis pipeline, specifically for Gemini?
4. Is there a Vertex AI / Gemini-specific mechanism (beyond `temperature`/`seed`) worth investigating for this model family specifically, given the generic LLM-determinism advice (temperature 0, fixed seed) has already been tested and found insufficient here?

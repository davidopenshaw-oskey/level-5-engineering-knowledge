# Real quota blocker on the intercom test case — pausing further calls — 2026-09-09

Real decision: stop spending further real Vertex AI calls against the intercom home-button business request until the underlying quota question is actually addressed, not just retried into again. Recording exactly why, and what's still genuinely unverified, so this can be picked back up cleanly.

## The real, recurring pattern

Three real attempts today on the identical intercom business request, after applying the tool-argument citation fix (`31-...md`'s wording addition to `mcp-server/skills/prd/skill.md`'s "Cite only real evidence" section):

1. First re-run post-fix: killed by this session's own 5-minute Bash tool timeout after 47 tool calls, mid-run, genuinely still searching (not stuck — it was chasing the real call-triggering mechanism, `initiateCall`/`CallRTC`/`Screen.CallRTC.route`). No crash, no completion, inconclusive.
2. Second re-run, moved to background to avoid the tool timeout: crashed for real, 16 tool calls in, with `RESOURCE_EXHAUSTED: [429 Too Many Requests] ... gemini-3.5-flash`.

Same real root cause identified earlier today (`29-...md`'s context, and the original diagnosis session): this project's Vertex AI quota has no `gemini-3.5-flash`-specific override in `global_generate_content_requests_per_minute_per_project_per_base_model` — it falls back to the generic default bucket, confirmed directly via `gcloud alpha services quota list`, which is **5 requests per minute**.

**Real, important refinement to the earlier diagnosis**: this isn't primarily a "wait longer between attempts" problem. Over 10 minutes elapsed across today's three intercom attempts — well past any per-minute quota reset — and it still hit the wall. The real issue is that a single chatty run's *own* turn cadence, within its first couple of minutes, can exceed 5 requests/minute on its own. Spacing out retries doesn't reliably fix this; the quota itself needs addressing (a real increase request) before this specific business request can be run reliably to completion.

## Real, honest status: the tool-argument citation fix is still unverified on this case

Neither of the two post-fix attempts produced a completed run — one was killed by a local tool timeout, the other by the real 429. **Whether the "don't reformat a description into a fake fact_id" fix (`skill.md`'s new bullet) actually holds on the intercom business request is not yet confirmed either way.** It's confirmed working on nothing yet for this specific case — a real, open gap, not a settled result.

## Why intercom is a good case to revisit, not a case to avoid

This business request has proven to be the single most reliable real trigger this week for the classes of bugs actually worth finding: the `_unreferenced` reachability mislabeling, the missing call-argument capture, the `homeButtons` type/mislabel gaps, the tool-argument citation-fabrication bug, and now this quota ceiling. Genuinely more revealing than the resident-departure-2a case, which has run cleanly and repeatedly all week. Worth deliberately returning to once the quota question is resolved, not switched away from.

## Real, concrete next step, not yet actioned

Look into requesting a real quota increase for `gemini-3.5-flash` on `global_generate_content_requests_per_minute_per_project_per_base_model` in `test-ai-oskey-io`, rather than continuing to retry into the same 5/minute ceiling. Not done in this session — paused here deliberately, per direct instruction, until decided.

## Update, 2026-09-10: confirmed not intercom-specific

A live v2-sketch re-run against **case 2a** (resident-departure, not intercom) hit the identical `RESOURCE_EXHAUSTED: [429 Too Many Requests] ... gemini-3.5-flash` wall, 15 tool calls in — full detail in `governance/roadmap/mcp-direction/37-real-run-crash-tool-error-not-surfaced-2026-09-10.md`. Checked directly via `DEBUG_TOOL_LOG`: all 15 tool calls that ran succeeded cleanly (no fabricated fact_id, no `[Fail-Closed]` error this time) — the crash was purely the quota wall, nothing else. This confirms the earlier diagnosis generalizes: it's a function of how chatty a run's own turn cadence gets in its first couple of minutes, not something specific to the intercom business request's own content. Any sufficiently wide multi-repo trace can hit it. Real spend for these 15 tool calls was incurred and, same as before, never quantified — the crash happens before the pricing lookup runs.

## Real investigation, 2026-09-10: exact quota data, re-pulled live

Re-ran `gcloud alpha services quota list --service=aiplatform.googleapis.com --consumer=projects/test-ai-oskey-io` directly (not trusting the 2026-09-09 number without a fresh check). Confirmed current, live state:

- **`aiplatform.googleapis.com/global_generate_content_requests_per_minute_per_project_per_base_model`** (the metric this project's `global` Vertex AI location actually uses) has 36 real quota buckets: one generic default (**5/min**) and 35 named `base_model`-specific overrides. Plain `gemini-3.5-flash` — this project's exact configured model — has **no override entry at all**, so it falls to the generic 5/min bucket.
- **Every other actively-relevant Gemini model has a named override, all higher**: `gemini-1.5-flash` and `gemini-1.5-flash-8b` get 200/min (40x), `gemini-1.5-pro` gets 60/min (12x), the `gemini-2.5-*-tts` family gets 125-150/min, and even a same-family sibling, `gemini-3.5-flash-cyber`, gets 250/min (50x) — real, verified data, not an assumption that "other models probably get more."
- The regional (non-`global`) counterpart metric, `aiplatform.googleapis.com/generate_content_requests_per_minute_per_project_per_base_model`, shows the identical shape (5/min generic default, per-region and per-model override buckets) — this isn't a `global`-location quirk.

**Real mechanism check**: `gcloud alpha services quota update` is a real, existing command that can attempt a self-service override (`--metric=aiplatform.googleapis.com/global_generate_content_requests_per_minute_per_project_per_base_model --unit="1/min/{project}/{base_model}" --dimensions=base_model=gemini-3.5-flash --value=<N>`). Not yet run — this mutates real GCP project configuration, and Vertex AI foundation-model serving quotas commonly require Google review even when attempted via this API (unlike simple accounting quotas), so an attempt may not take effect immediately, or at all, via self-service. Not attempted without asking first.

**Real conclusion**: this is a strong, well-evidenced case for requesting an increase (gemini-3.5-flash is a clear, verifiable outlier at 1/40th to 1/50th of comparable models' quota, not merely "quota is low across the board") — but the actual request/attempt is a real, external action still pending a decision on how to proceed (self-service CLI attempt vs. the Cloud Console's formal quota-request form vs. designing around it).

## Real check, 2026-09-10: does switching to `gemini-3.7-flash` avoid this instead?

Checked directly (a real publisher-model metadata GET, not assumed): `gemini-3.7-flash` is a real, GA Vertex AI model (`gemini-3.7-pro` and bare `gemini-3.7` are not — 404). But it has **no quota override either** — it falls to the identical generic 5/min default bucket as `gemini-3.5-flash`. Switching the pipeline's configured model would not avoid this ceiling; both land on the same unnamed default. Rules out "just use a newer model" as a fix.

# Module Engineering Profile — Task Template

*This is what you paste as the message in your Claude Project chat, filled in per module. The system instructions (persona/rules/output schema) live in Custom Instructions; the architectural grounding docs live in Project knowledge files. This message supplies only what changes per run: the target module, the live module list, and the evidence.*

---

## Task

Generate the Module Engineering Profile and API Reference for the module specified below, following the system instructions exactly.

## Generation Metadata

*(copy these values before pasting — do not make Claude extract them from inside the evidence JSON blob. runId/generatedAt come from the root of the evidence graph JSON below; llmConfigKey/llmProvider/llmModel describe whichever LLM you're running this chat with — fill in the actual values for your session, the ones below are placeholders.)*

- runId: `20260731_154240-1aa319b1`
- generatedAt: `2026-07-31T15:42:42.912Z`
- repoName: `firebase-oskey-dev`
- targetModule: `building`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

## Current Modules in This Repository

*(paste the live list from this run's `modules.json` — this is the only set of module names you may reference for cross-module dependency resolution; do not assume any other module exists)*

```
access_control_device
admin
apps
building
call
core
organization
settings
supplier
tasks
unit_management
user
```

## Target Module Evidence Graph

*(paste the full contents of `building-evidence-graph.json` here)*

```json
<paste evidence graph JSON here>
```

---

## Format note (illustrative only — not real data)

The worked example below is a **fictional module**, deliberately invented to demonstrate the expected format only. Do not treat any fact in it as real, and do not let it influence the content of your actual output for `building` — it exists purely to show shape, not substance.

> **Example (fictional "widget" module) — Section 3 format:**
> - **Capability:** Widget lifecycle creation — **Confirmed**. Evidenced by `service_method` fact `OSKWidgetService.createWidget` (widget-evidence-graph.json, line 42).
> - **Capability:** Widget archival on inactivity — **Inferred**. No direct evidence of a scheduled job, but `firestore_path_touched` facts show writes to `/widgets/{id}/archive` from two separate call sites, suggesting a shared archival path without a single confirmed trigger.

---

Now generate the actual Module Engineering Profile and API Reference for **building**, using only the evidence and grounding documents provided.

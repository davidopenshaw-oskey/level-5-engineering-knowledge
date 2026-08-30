# Module Engineering Profile — Task Template (Angular)

*Adapted from the Firebase pipeline's version — same purpose: what you'd paste as the message in a manual chat test, filled in per module. The automated pipeline assembles its own equivalent programmatically; this file exists as a supporting-contract document and as a manual-testing convenience.*

---

## Task

Generate the Module Engineering Profile and API Reference for the module specified below, following the system instructions exactly.

## Generation Metadata

- runId: `20260828_150039-8345d222`
- generatedAt: `2026-08-28T15:00:39.264Z`
- repoName: `angular-app-oskey-io`
- targetModule: `features`
- llmConfigKey: `gemini-default`
- llmProvider: `gemini`
- llmModel: `gemini-3.5-flash`

## Current Modules in This Repository

*(paste the live list from this run's `modules.json` — this is the only set of module names you may reference for cross-module dependency resolution; do not assume any other module exists)*

```
components
core
features
```

## Target Module Evidence Graph

*(paste the full contents of `features-evidence-graph.json` here)*

```json
<paste evidence graph JSON here>
```

---

## Format note (illustrative only — not real data)

The worked example below is a **fictional capability**, deliberately invented to demonstrate the expected format only. Do not treat any fact in it as real, and do not let it influence the content of your actual output — it exists purely to show shape, not substance.

> **Example (fictional "widget-list" capability) — Section 3 format:**
> - **Capability:** Widget list display and filtering — **Confirmed**. Evidenced by `angular_component` fact `OSKWidgetListComponent` (widget-list.component.ts, line 12) and `angular_template_composition` facts showing it renders `osk-widget-card` and `mat-paginator`.
> - **Capability:** Widget deletion gated by admin role — **Inferred**. `angular_guard` fact `OSKWidgetAdminGuard` attaches to the delete route, and a permission string `v1.widgets.admin` appears in the same file, but no RBAC roles document exists yet to confirm the guard actually checks that specific string.

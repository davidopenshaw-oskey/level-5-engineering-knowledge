# Findings — Does Figma Already Expose the Data This Project Needs?

Answers `11-priming-brief-figma-design-data-availability-2026-09-06.md`. All claims below are from live web search/fetch run 2026-09-06, cited inline. Two Figma developer-docs pages returned HTTP 404 (their exact URLs weren't guessable) — those angles are answered from what was directly confirmed via other real, fetched pages plus flagged where documentation alone couldn't resolve it, per this project's own discipline of a cheap real test before scaling up.

## Headline finding, answered directly as instructed

**Figma's data model has no structured "list of options" concept — but it does expose every real text string as machine-readable, addressable data, not locked inside pixels.** These are two different questions, and conflating them would misstate the real situation:

1. **Confirmed, via direct fetch of Figma's own developer docs (`componentPropertyDefinitions`)**: a component's `VARIANT` properties are structural/visual state axes (`Size: {variantOptions: ['Small', 'Medium', 'Large']}`, `state: default/hover/pressed/disabled`) — pre-defined design-state names, not a container for enumerable business content. `TEXT` properties hold one string per named text layer, individually. **There is no API-level field that means "the list of options this dropdown offers."**
2. **Confirmed, via Figma's own REST API documentation and forum-verified real behavior**: every real `TEXT`-type node in a file's JSON tree carries its actual literal string in a `characters` field — not a screenshot, not something requiring OCR or vision inference. If a designer builds a dropdown's "open" state as a component variant with each option as its own child `TEXT` layer (real, common practice), every one of those option strings is present, verbatim, in the same structured JSON tree this project would already be walking for layout/component data.

**The real, honest gap is narrower than "the text isn't recoverable"**: it's that Figma has no *semantic* label saying "this specific TEXT node is business-meaningful option #2 of the InhabitantType dropdown" — recovering that requires walking the real node tree and inferring which TEXT children, under which named component/variant, constitute a real option list (structural inference over already-structured data), not inference from a rendered image. This is a genuinely different, more tractable engineering problem than "read pixels."

---

## 1. Figma's real REST API — component/variant data

**Confirmed via direct fetch.** `VARIANT` properties are named, closed structural-state axes (size, state, theme) with a fixed `variantOptions` list defined by the designer when building the component set — real, structured, but modeling *design* states, not arbitrary business enumerations. `TEXT` properties/layers hold individual strings, addressable by name (with a `#`-suffixed unique id when names collide). **No path exists from "a component named `Dropdown/OwnerType`" directly to "the real list of option labels" as a single structured field** — that data, if present at all, lives as ordinary child `TEXT` nodes, requiring tree-walking to assemble, not a lookup.

## 2. Figma's Dev Mode MCP Server — real, current, checked directly

**Real, current, officially shipped** (Figma's own blog, `figma.com/blog/introducing-figma-mcp-server`): brings "Figma into your workflow," giving Claude Code, Cursor, Windsurf, and Copilot "structured access to components, variables, and Code Connect mappings — replacing screenshot guesswork with machine-readable design context." Confirmed real tool surface (~25 tools; via `figma/mcp-server-guide`, DeepWiki): `get_design_context`/`get_code` (extracts design as code, defaulting to React/Tailwind), `get_variable_defs` (design tokens), `get_metadata` (a sparse XML layer map for orienting in a large file cheaply), `get_screenshot`, `get_code_connect_map`.

**Positioning, confirmed**: Figma explicitly frames this as design-to-code handoff (component structure, variables/styles, layer tree, Code Connect mappings to real code), not as a ground-truth business-content source. **Not resolved by documentation alone** (both `get_design_context`'s and `get_metadata`'s exact output schemas, specifically whether real text-layer strings are included and how they're tied to layer identity, are not spelled out in the pages this research could reach — two attempted direct fetches to the tools-reference page 404'd). This is exactly the kind of question the brief itself anticipated might need a real, live test rather than documentation alone — flagged honestly rather than guessed at. Given angle 1's confirmed `characters`-field behavior in the underlying REST API, it would be surprising if the MCP server's code-generation tool *dropped* real text content (generated code needs the real button/label text to be useful) — but this is a reasonable inference from adjacent confirmed facts, not itself a directly confirmed statement about the MCP server specifically.

## 3. Figma Variables — business data or styling only?

**Mixed, both confirmed real.** Variables support four real data types (`BOOLEAN`, `FLOAT`, `STRING`, `COLOR`), can alias other variables, bind to node properties, support multiple modes (for theming), and are explicitly described as accessible via the real REST API for "custom export pipelines" independent of any plugin. In practice, most real documented usage is design-system styling (color/spacing/typography tokens) — but the `STRING` type and general-purpose binding mechanism mean Variables *could* structurally hold a real business enum (e.g., a variable literally named `inhabitantType.options` with string values `owner/tenant/resident`) if a design team chose to model it that way. **No real, named example of a team actually doing this for business/domain enumerations (as opposed to design tokens) was found in this search** — the capability appears to exist structurally, but the confirmed real-world usage pattern is styling, not business data modeling.

## 4. Direct test against this project's own concrete gap (inhabitant-type-style dropdown)

**Genuinely can't be fully resolved from documentation alone — reported honestly, as the brief anticipated might be necessary.** Composing angles 1-3's confirmed facts: if a real Figma file models an inhabitant-type dropdown with each real option (`owner`, `tenant`, `resident`) as its own `TEXT` child layer inside a component's "open" variant state, those three real strings would be present, verbatim, in the file's JSON tree via `characters` — genuinely extractable without vision/inference-from-pixels. But *whether OSkey's actual design files are built this way* (vs. one flat screenshot-like frame with no real per-option layer structure, or vs. names that don't map obviously to which control they belong to) is unknown and cannot be determined from public documentation. **The concrete, cheap, real next step this project's own standing discipline calls for**: pull one real Figma file's REST API response for one known, real dropdown-shaped component (once mobile/Angular Figma access exists) and inspect its actual JSON tree directly — exactly the kind of small, bounded, real test this project has already applied successfully to its own code-extraction work, not yet applied here.

## 5. Beyond Figma — is Figma alone sufficient coverage?

**Confirmed, briefly, as the brief asked**: Figma holds roughly 40.65% of the collaborative-design-and-prototyping market as of mid-2026 (Adobe XD ~13.5%, InVision ~7.6%), with 95% of the Fortune 500 using it and Sketch's share having fallen to ~4.5% (from a 2023 survey cited in the same search). Figma is the real, dominant, near-default choice in this space in 2026 — a Figma-only mapping would leave only a small, non-dominant remainder uncovered, not a material gap for planning purposes.

## 6. Retest of "ahead of the curve" — is there already a real bridge?

**Real, mixed finding — a bridge exists in an adjacent direction, but not the specific one this project needs.** Two real, current findings:

- **Figr AI** (`figr.design`) is a real, named 2026 product that ingests "live app captures, analytics, Figma files, and research docs" to generate PRDs "grounded in what your product actually does." Its exact Figma-extraction mechanism (structured API data vs. visual/screenshot-based interpretation) **could not be confirmed from its own public materials** — a real, honest gap in what this research could verify, not evidence either way.
- **A real, current academic system** (arXiv 2603.01460, "Production-Grade AI Coding System for Client-Side Development") describes "a structured, multi-stage pipeline [that] integrates Figma designs, natural-language PRDs, and domain-specific engineering knowledge into explicit intermediate artifacts" — real, published, peer-reviewed-adjacent prior art for exactly this shape of bridge (Figma + requirements + code knowledge → structured intermediate facts), aimed at code generation rather than at building a queryable facts corpus specifically.

**Honest verdict**: this is not the clean "nobody's built it, the data just sits there unused" finding the brief flagged as a real possible outcome — a real, if not fully detailed, bridge (Figr AI) and a real, published academic pipeline (the arXiv system) both already combine Figma data with requirements/code context, in the code-generation and PRD-generation direction specifically. Neither was confirmed to build the more general "Figma component → structured fact in a queryable corpus, cited like this project's own `fact_id`s" bridge this project is planning — that more general, corpus-shaped version does still look like a genuinely open, unbuilt combination, even though the raw ingredients (Figma-plus-requirements bridging) are not entirely novel.

---

## What this means for the near-term decision (Figma/MCP input, ~2026-09-19)

- **The headline finding is actionable now**: Figma's real text content is not locked behind vision/OCR — it's structured, addressable JSON (`characters` on `TEXT` nodes), reachable via the REST API directly and very likely (though not fully confirmed) via the Dev Mode MCP server's code-generation tools too. This meaningfully de-risks the planned Figma/UX-mapping initiative — the hard remaining problem is *structural inference* (which TEXT nodes, under which component, constitute a real option list), not *content recovery* (the text existing at all).
- **The one real, cheap, concrete next step this research surfaces**: before committing to either the REST API or the MCP server as the mechanism, pull one real file's raw API response for one real, known dropdown-shaped component and inspect it directly — the exact kind of small, bounded, real test this project's own standing discipline already applies to code extraction, not yet applied here. This would resolve angle 4's genuine open question directly rather than continuing to reason about it from documentation alone.
- **Variables are a real, structurally-capable but likely-unused path** for this specific need — worth checking directly whether OSkey's own real design files use Variables for anything beyond styling before assuming they don't.

## Sources

- [Figma Developer Docs — componentPropertyDefinitions](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
- [Figma Developer Docs — variantProperties](https://developers.figma.com/docs/plugins/api/properties/nodes-variantproperties/)
- [Figma Blog — Introducing our Dev Mode MCP server](https://www.figma.com/blog/introducing-figma-mcp-server/)
- [Figma Developer Docs — Figma MCP Server introduction](https://developers.figma.com/docs/figma-mcp-server/)
- [figma/mcp-server-guide tools reference, via DeepWiki](https://deepwiki.com/figma/mcp-server-guide/5-tools-reference)
- [Figma REST API — file endpoints](https://developers.figma.com/docs/rest-api/file-endpoints/)
- [Figma Forum — Get text from component using REST API (`characters` field)](https://forum.figma.com/ask-the-community-7/get-text-from-component-using-rest-api-21571)
- [Figma Plugin API — TextNode.characters](https://www.figma.com/plugin-docs/api/properties/TextNode-characters/)
- [Supernova.io — Understanding the Differences Between Figma Variables and Design Tokens](https://www.supernova.io/blog/understanding-the-differences-between-figma-variables-and-design-tokens)
- [Figma resource library — Design statistics 2026](https://www.figma.com/resource-library/design-statistics/)
- [6sense — Figma market share, collaborative design and prototyping](https://6sense.com/tech/collaborative-design-and-prototyping/figma-market-share)
- [Figr AI — AI PRD Generators](https://figr.design/blog/ai-prd-generator)
- [arXiv 2603.01460 — Production-Grade AI Coding System for Client-Side Development](https://arxiv.org/html/2603.01460)

**Note on two 404s**: `developers.figma.com/docs/figma-mcp-server/tools/` and the exact MCP tools-and-prompts URL guessed for direct fetch both returned HTTP 404 (the real page exists at a different path, per search-indexed titles — `developers.figma.com/docs/figma-mcp-server/tools-and-prompts/` per search results, not independently re-fetched after discovering the correct path). Tool names/behavior above are sourced from the DeepWiki third-party reference and search excerpts, not a direct fetch of Figma's own tools-and-prompts page — flagged per this project's own confirmed-vs-secondary-source discipline.

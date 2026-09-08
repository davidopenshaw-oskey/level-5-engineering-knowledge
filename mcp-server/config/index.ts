// Step 11 of governance/roadmap/mcp-direction/10-sectioncontent-
// implementation-tasklist.md. Real fix, approved 2026-09-06: atomic-prd-
// agent.ts previously hardcoded PROJECT_ID/LOCATION/MODEL as flat,
// unoverridable constants -- the exact "hardcoded to what's in front of
// you" pattern the RESULT_LIMIT lesson and adr-007/adr-008 have been about
// all session. Every field here is overridable by an env var without
// editing this file, matching the same shape pool()'s PG_HOST etc. already
// use elsewhere in this pipeline.
//
// Named index.ts, not config.ts, deliberately -- a real bug found during
// verification: Node's module resolution picks config.json over a
// same-directory config.ts when a caller does require("./config"), so
// loadMcpServerConfig() silently resolved to undefined. index.ts resolves
// cleanly from the folder path (import ... from "../config") with no
// naming collision against config.json.
import fs from "fs";
import path from "path";

export interface McpServerConfig {
  vertexAI: {
    projectId: string;
    location: string;
    model: string;
    temperature: number;
    // Real, human-readable label matching how the Cloud Billing Catalog
    // API's own SKU descriptions name this model (e.g. "Gemini 3.5 Flash
    // Global Text Input - Predictions"). Deliberately NOT derived
    // automatically from `model` -- confirmed directly (2026-09-06) that
    // Google's own catalog naming isn't a clean, guessable transform (real
    // inconsistent capitalization exists even in their own data, e.g.
    // "Gemini 2.5 Flash Ga Text Output"). Update by hand if `model` ever
    // changes -- see pricing.ts.
    pricingLabel: string;
  };
}

let cached: McpServerConfig | null = null;

export function loadMcpServerConfig(): McpServerConfig {
  if (cached) return cached;
  const fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8")) as McpServerConfig;
  cached = {
    vertexAI: {
      projectId: process.env.MCP_VERTEX_PROJECT_ID ?? fileConfig.vertexAI.projectId,
      location: process.env.MCP_VERTEX_LOCATION ?? fileConfig.vertexAI.location,
      model: process.env.MCP_VERTEX_MODEL ?? fileConfig.vertexAI.model,
      temperature: process.env.MCP_VERTEX_TEMPERATURE ? Number(process.env.MCP_VERTEX_TEMPERATURE) : fileConfig.vertexAI.temperature,
      pricingLabel: process.env.MCP_VERTEX_PRICING_LABEL ?? fileConfig.vertexAI.pricingLabel,
    },
  };
  return cached;
}

// Real cost estimation, 2026-09-06 -- per the user's own explicit
// direction, queries the real Cloud Billing Catalog API
// (cloudbilling.googleapis.com) live for current Vertex AI pricing rather
// than hand-maintaining a static price table that goes stale. Real
// question flagged as unverified when this was first proposed (05-poc-
// demo-and-documentation-plan.md): whether the Catalog API's SKU
// granularity actually distinguishes input/output/thinking/cached tokens.
// Checked directly, not assumed, against the real service (Vertex AI,
// serviceId C7E2-9256-1C43): it does, more finely than expected (separate
// SKUs per modality, per caching state, per priority tier) -- except
// "thinking" tokens, which have no distinct SKU for this model and
// therefore bill at the same rate as regular output tokens. Confirmed
// separately, from real usage data, that cachedContentTokens is a SUBSET
// of inputTokens (inputTokens + outputTokens + thoughtsTokens ===
// totalTokens exactly), not additive -- the cost formula below depends on
// that being true.
import { google } from "googleapis";

const VERTEX_AI_SERVICE_ID = "C7E2-9256-1C43"; // real, looked up live via services.list, not guessed

export interface VertexAiPricing {
  inputPricePerToken: number;
  outputPricePerToken: number;
  cachePricePerToken: number;
  // Real grounding for the citation, per user request, 2026-09-06: the
  // Catalog API's own pricingInfo carries a real effectiveTime per SKU --
  // Google's own authoritative record of when that price took effect, a
  // genuinely better citation than "when we happened to call the API".
  // The three real SKUs checked here have always shared one effectiveTime
  // in practice; if a future pricing update ever staggers them, the latest
  // (max) of the three is used -- the one date at which all three prices
  // are simultaneously known to be in effect.
  pricingEffectiveTime: string;
}

interface Sku {
  skuId: string;
  description: string;
  serviceRegions: string[];
  pricingInfo: Array<{
    effectiveTime?: string;
    pricingExpression: {
      tieredRates: Array<{ unitPrice: { nanos?: number; units?: string } }>;
    };
  }>;
}

let cachedSkus: Sku[] | null = null;

async function listAllVertexAiSkus(): Promise<Sku[]> {
  if (cachedSkus) return cachedSkus;
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const cloudbilling = google.cloudbilling({ version: "v1", auth });
  const skus: Sku[] = [];
  let pageToken: string | undefined;
  do {
    const res = await cloudbilling.services.skus.list({
      parent: `services/${VERTEX_AI_SERVICE_ID}`,
      pageSize: 5000,
      pageToken,
    });
    skus.push(...((res.data.skus as Sku[] | undefined) ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  cachedSkus = skus;
  return skus;
}

function priceFromSku(sku: Sku): number {
  const rate = sku.pricingInfo[0]?.pricingExpression?.tieredRates?.[0]?.unitPrice;
  const units = Number(rate?.units ?? 0);
  const nanos = rate?.nanos ?? 0;
  return units + nanos / 1e9; // real price per single token -- baseUnitConversionFactor is 1 for every SKU checked
}

function effectiveTimeFromSku(sku: Sku): string | null {
  return sku.pricingInfo[0]?.effectiveTime ?? null;
}

// Real, deliberately narrow matcher -- requires the "plain" on-demand tier
// (excludes Batch/Flex/Priority/Off-Peak variants, and excludes other
// modalities/model variants like Lite/Tuned/Image) and requires exactly
// one confident match. Never silently guesses between ambiguous
// candidates -- fails closed (returns null) if zero or more than one SKU
// matches, same discipline as the rest of this codebase.
function findExactlyOneSku(skus: Sku[], modelLabel: string, location: string, kind: "input" | "output" | "cache"): Sku | null {
  const EXCLUDE = ["batch", "flex", "priority", "off-peak", "lite", "tuned", "image", "video", "audio"];
  const locationLabel = location === "global" ? "global" : "regional";
  const matches = skus.filter(s => {
    const desc = s.description.toLowerCase();
    if (!desc.startsWith(`gemini ${modelLabel.toLowerCase()}`)) return false;
    if (!desc.includes(locationLabel)) return false;
    if (!s.serviceRegions.includes(location)) return false;
    if (EXCLUDE.some(word => desc.includes(word))) return false;
    if (kind === "cache") return desc.includes("text input caching");
    if (kind === "input") return desc.includes("text input") && !desc.includes("caching");
    return desc.includes("text output");
  });
  return matches.length === 1 ? matches[0] : null;
}

// modelLabel: the real, human-readable model label the Catalog API's own
// SKU descriptions use (e.g. "3.5 Flash" for config's "gemini-3.5-flash")
// -- not derived automatically from config.vertexAI.model, since Google's
// own naming here isn't a clean, guessable transform (confirmed directly:
// even their own catalog has real inconsistent capitalization, e.g.
// "Gemini 2.5 Flash Ga Text Output"). Passed in explicitly by the caller
// instead of guessed.
export async function fetchVertexAiPricing(modelLabel: string, location: string): Promise<VertexAiPricing | null> {
  const skus = await listAllVertexAiSkus();
  const inputSku = findExactlyOneSku(skus, modelLabel, location, "input");
  const outputSku = findExactlyOneSku(skus, modelLabel, location, "output");
  const cacheSku = findExactlyOneSku(skus, modelLabel, location, "cache");
  if (!inputSku || !outputSku || !cacheSku) return null;

  const effectiveTimes = [inputSku, outputSku, cacheSku].map(effectiveTimeFromSku).filter((t): t is string => t !== null);
  // Fails closed to "now" (clearly real, not a fabricated pricing-table
  // date) only in the real edge case where the API stopped returning
  // effectiveTime at all -- never seen in practice, but this is meant to
  // never silently claim a grounding date it doesn't actually have.
  const pricingEffectiveTime =
    effectiveTimes.length === 0 ? new Date().toISOString() : effectiveTimes.reduce((max, t) => (t > max ? t : max));

  return {
    inputPricePerToken: priceFromSku(inputSku),
    outputPricePerToken: priceFromSku(outputSku),
    cachePricePerToken: priceFromSku(cacheSku),
    pricingEffectiveTime,
  };
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  thoughtsTokens?: number;
  cachedContentTokens?: number;
}

// Real formula, confirmed against real usage data before writing this:
// inputTokens + outputTokens + thoughtsTokens === totalTokens exactly, so
// cachedContentTokens is a SUBSET of inputTokens, not additive -- and
// thoughtsTokens bill at the output rate (no distinct SKU exists for them
// on this model, confirmed above).
export function computeApproxCost(usage: TokenUsage, pricing: VertexAiPricing): number {
  const cached = usage.cachedContentTokens ?? 0;
  const nonCachedInput = Math.max((usage.inputTokens ?? 0) - cached, 0);
  const outputAndThinking = (usage.outputTokens ?? 0) + (usage.thoughtsTokens ?? 0);
  return nonCachedInput * pricing.inputPricePerToken + cached * pricing.cachePricePerToken + outputAndThinking * pricing.outputPricePerToken;
}

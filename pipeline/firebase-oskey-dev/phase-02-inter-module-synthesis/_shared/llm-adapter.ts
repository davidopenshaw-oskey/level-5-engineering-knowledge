// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Provider-agnostic LLM adapter. Deliberately built on native fetch against
// each provider's REST API rather than pulling in three separate SDKs --
// keeps this pipeline's dependency footprint minimal (consistent with using
// ts-morph as effectively the only heavy dependency in Phase 1), and REST is
// the lowest common denominator across providers, which matters for an
// adapter whose whole purpose is running the SAME prompt against DIFFERENT
// providers for evaluation.
//
// Callers should never hardcode a provider -- always resolve an
// LlmProviderConfig from config/llm-providers.json and pass it to callLlm().

import { execSync } from "child_process";

export type LlmProviderName = "gemini" | "anthropic" | "openai";

export interface LlmProviderConfig {
  provider: LlmProviderName;
  model: string;
  // Name of the environment variable holding the API key -- never the key
  // itself. Config files are safe to commit; API keys are not.
  // NOT used for "gemini" -- that provider authenticates via Vertex AI +
  // ADC (gcloud auth application-default login) instead, reflecting
  // SSO/enterprise access rather than a per-provider API key.
  apiKeyEnvVar?: string;
  // Required for "gemini" only -- the GCP project and Vertex AI region to
  // call. Not a secret, safe to commit.
  projectId?: string;
  location?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmCallResult {
  text: string;
  provider: LlmProviderName;
  model: string;
  raw: unknown;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export async function callLlm(prompt: string, config: LlmProviderConfig): Promise<LlmCallResult> {
  switch (config.provider) {
    case "gemini":
      // Vertex AI + ADC -- no API key involved, see callGemini.
      return callGemini(prompt, config);
    case "anthropic":
      return callAnthropic(prompt, config, requireApiKey(config));
    case "openai":
      return callOpenAI(prompt, config, requireApiKey(config));
    default: {
      // Exhaustiveness check: if a new provider is added to LlmProviderName
      // without a case here, this fails to compile rather than silently
      // falling through at runtime.
      const _exhaustive: never = config.provider;
      throw new Error(`[Fail-Closed] Unknown LLM provider '${_exhaustive}'.`);
    }
  }
}

function requireApiKey(config: LlmProviderConfig): string {
  if (!config.apiKeyEnvVar) {
    throw new Error(
      `[Fail-Closed] LLM provider '${config.provider}' (model '${config.model}') has no 'apiKeyEnvVar' set in config/llm-providers.json.`
    );
  }
  const apiKey = process.env[config.apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(
      `[Fail-Closed] Environment variable '${config.apiKeyEnvVar}' is required for LLM provider '${config.provider}' (model '${config.model}') and was not set.`
    );
  }
  return apiKey;
}

// Obtains a short-lived OAuth access token via Application Default
// Credentials by shelling out to the gcloud CLI, rather than pulling in
// google-auth-library -- consistent with this adapter's "native fetch, no
// provider SDKs" design (see file header). Requires the caller to have
// already run `gcloud auth application-default login` with an identity
// that has Vertex AI access on the target project; this is deliberately
// the SSO/enterprise-appropriate mechanism (as opposed to a Gemini API
// key), and the same call also works unmodified against a service account
// or Workload Identity Federation credential in CI/CD -- only the
// credential source underneath ADC changes, not this code.
function getVertexAccessToken(): string {
  try {
    const token = execSync("gcloud auth application-default print-access-token", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (!token) throw new Error("empty token returned");
    return token;
  } catch (err: any) {
    throw new Error(
      `[Fail-Closed] Could not obtain a Vertex AI access token via 'gcloud auth application-default login' -- ` +
        `run that command (with an identity that has Vertex AI access on the target GCP project) before calling Gemini. ` +
        `Underlying error: ${err.message}`
    );
  }
}

async function callGemini(prompt: string, config: LlmProviderConfig): Promise<LlmCallResult> {
  if (!config.projectId) {
    throw new Error(`[Fail-Closed] 'projectId' is required in config/llm-providers.json for Gemini (Vertex AI) calls (model '${config.model}').`);
  }
  if (!config.location) {
    throw new Error(`[Fail-Closed] 'location' is required in config/llm-providers.json for Gemini (Vertex AI) calls (model '${config.model}').`);
  }

  const accessToken = getVertexAccessToken();
  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${config.model}:generateContent`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens ?? 8192,
      temperature: config.temperature ?? 0.2,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[LLM_CALL_FAILED] Gemini (Vertex AI) request failed (HTTP ${res.status}): ${errText.slice(0, 1000)}`);
  }

  const data: any = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");

  if (!text) {
    // Gemini 2.5 models spend part of maxOutputTokens on internal
    // "thinking" tokens (usageMetadata.thoughtsTokenCount) before producing
    // visible output -- an empty response with finishReason MAX_TOKENS
    // usually means maxTokens was too small for this model, not a failed
    // call. Confirmed empirically 2026-08-01 while testing this endpoint.
    const finishReason = data?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(
      `[LLM_CALL_FAILED] Gemini (Vertex AI) response contained no text (finishReason: ${finishReason}). ` +
        `If finishReason is MAX_TOKENS, this model likely spent its token budget on internal reasoning -- try increasing maxTokens. ` +
        `Raw response (truncated): ${JSON.stringify(data).slice(0, 1000)}`
    );
  }

  return {
    text,
    provider: "gemini",
    model: config.model,
    raw: data,
    usage: {
      inputTokens: data?.usageMetadata?.promptTokenCount,
      outputTokens: data?.usageMetadata?.candidatesTokenCount,
    },
  };
}

async function callAnthropic(prompt: string, config: LlmProviderConfig, apiKey: string): Promise<LlmCallResult> {
  const url = "https://api.anthropic.com/v1/messages";
  // `temperature` deliberately omitted: newer Claude models (confirmed on
  // claude-sonnet-5, also reported for opus-4.7) reject the request with
  // HTTP 400 "temperature is deprecated for this model" if the field is
  // present at all, regardless of value -- not just when it's non-default.
  // Confirmed empirically 2026-08-01 against claude-sonnet-5.
  const body = {
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[LLM_CALL_FAILED] Anthropic request failed (HTTP ${res.status}): ${errText.slice(0, 1000)}`);
  }

  const data: any = await res.json();
  const text: string = (data?.content ?? [])
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text ?? "")
    .join("");

  if (!text) {
    throw new Error(`[LLM_CALL_FAILED] Anthropic response contained no text. Raw response (truncated): ${JSON.stringify(data).slice(0, 1000)}`);
  }

  return {
    text,
    provider: "anthropic",
    model: config.model,
    raw: data,
    usage: {
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
    },
  };
}

async function callOpenAI(prompt: string, config: LlmProviderConfig, apiKey: string): Promise<LlmCallResult> {
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    temperature: config.temperature ?? 0.2,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[LLM_CALL_FAILED] OpenAI request failed (HTTP ${res.status}): ${errText.slice(0, 1000)}`);
  }

  const data: any = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  if (!text) {
    throw new Error(`[LLM_CALL_FAILED] OpenAI response contained no text. Raw response (truncated): ${JSON.stringify(data).slice(0, 1000)}`);
  }

  return {
    text,
    provider: "openai",
    model: config.model,
    raw: data,
    usage: {
      inputTokens: data?.usage?.prompt_tokens,
      outputTokens: data?.usage?.completion_tokens,
    },
  };
}
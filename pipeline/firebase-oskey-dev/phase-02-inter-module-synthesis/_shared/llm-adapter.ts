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

export type LlmProviderName = "gemini" | "anthropic" | "openai";

export interface LlmProviderConfig {
  provider: LlmProviderName;
  model: string;
  // Name of the environment variable holding the API key -- never the key
  // itself. Config files are safe to commit; API keys are not.
  apiKeyEnvVar: string;
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
  const apiKey = process.env[config.apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(
      `[Fail-Closed] Environment variable '${config.apiKeyEnvVar}' is required for LLM provider '${config.provider}' (model '${config.model}') and was not set.`
    );
  }

  switch (config.provider) {
    case "gemini":
      return callGemini(prompt, config, apiKey);
    case "anthropic":
      return callAnthropic(prompt, config, apiKey);
    case "openai":
      return callOpenAI(prompt, config, apiKey);
    default: {
      // Exhaustiveness check: if a new provider is added to LlmProviderName
      // without a case here, this fails to compile rather than silently
      // falling through at runtime.
      const _exhaustive: never = config.provider;
      throw new Error(`[Fail-Closed] Unknown LLM provider '${_exhaustive}'.`);
    }
  }
}

async function callGemini(prompt: string, config: LlmProviderConfig, apiKey: string): Promise<LlmCallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens ?? 8192,
      temperature: config.temperature ?? 0.2,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[LLM_CALL_FAILED] Gemini request failed (HTTP ${res.status}): ${errText.slice(0, 1000)}`);
  }

  const data: any = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");

  if (!text) {
    throw new Error(`[LLM_CALL_FAILED] Gemini response contained no text. Raw response (truncated): ${JSON.stringify(data).slice(0, 1000)}`);
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
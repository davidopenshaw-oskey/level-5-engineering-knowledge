// **version:** 1.1.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Provider-agnostic LLM adapter. Anthropic and OpenAI are deliberately still
// native fetch against their own REST APIs -- keeps the dependency footprint
// minimal, and REST is the lowest common denominator, which matters for
// providers (or local runners like LM Studio) that will never be reached
// through Google's own infrastructure.
//
// Gemini is the one exception (2026-08-02): this pipeline is expected to
// eventually run on Google's Gemini Enterprise Agent Platform (formerly
// Vertex AI), where the recommended, actively-maintained path is Google's
// own SDK (@google/genai) rather than hand-rolled fetch + a
// gcloud-CLI-shell-out for the access token. @google-cloud/vertexai (the
// older SDK) is deprecated (removal by June 2026); @google/genai supersedes
// it and explicitly supports the Enterprise Agent Platform target. If/when
// Anthropic access also moves through that platform's Model Garden, that is
// a SEPARATE mechanism (a different publisher path with Anthropic's own
// request shape, likely via Anthropic's own Vertex-flavored SDK) -- not
// covered by this change, and not assumed here.
//
// Callers should never hardcode a provider -- always resolve an
// LlmProviderConfig from config/llm-providers.json and pass it to callLlm().

import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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
  // Gemini-only. Maps to the @google/genai SDK's ThinkingConfig.thinkingLevel
  // ("MINIMAL"|"LOW"|"MEDIUM"|"HIGH") -- Gemini's equivalent of Claude's
  // adaptive-thinking effort control. Left unset by default (the model's own
  // default applies, which for flash-tier models favors speed over depth).
  // Added 2026-08-11 after a real, verified finding: gemini-3.5-flash's
  // connective-tissue output on `building` was accurate and fully cited but
  // consistently thinner than Claude's on cross-capability judgment work
  // (Sections 12/13 -- spotting patterns like inconsistent RBAC coverage
  // across sibling capabilities) -- exactly the kind of task more reasoning
  // effort should help with. Not yet validated with a real call.
  thinkingLevel?: keyof typeof ThinkingLevel;
}

export interface LlmCallResult {
  text: string;
  provider: LlmProviderName;
  // The model we ASKED for (config.model, echoed back) -- not necessarily
  // what actually served the request. See servedModel.
  model: string;
  // What the provider's own response says actually served the request:
  // Gemini's `response.modelVersion`, Anthropic's `data.model`, OpenAI's
  // `data.model`. Added 2026-08-11 after being asked directly "are we sure
  // we're using gemini-3.5-flash" -- until this field existed, every caller
  // only ever echoed back the requested model name, with no verification
  // against what the provider's own response reported. callLlm() below
  // console.warns (does not throw) if this doesn't match `model`, since a
  // provider silently substituting a model is a real, worth-noticing event
  // but not necessarily fatal (e.g. a documented fallback).
  servedModel?: string;
  raw: unknown;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    // Anthropic-specific for now (see callAnthropic below) -- populated only
    // when the provider actually reports cache activity. governance/roadmap/
    // 03-token-economics-remediation-plan.md: found 2026-08-11 that this was
    // silently unavailable even though the raw response carries it, which
    // meant a real cost question (did automatic prompt caching contribute to
    // a lower-than-estimated real spend on the `building` assembly-first
    // run?) could not be answered even after the fact, because the raw
    // response was never persisted either. Not yet populated for Gemini/
    // OpenAI -- don't assume their equivalent fields without checking each
    // provider's actual response shape first.
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
  // Normalized across providers. "stop" means the model finished naturally
  // (Anthropic end_turn / Gemini STOP / OpenAI stop) -- by the time this is
  // returned, "max_tokens" truncation has ALREADY been thrown on above, so
  // "stop" here specifically means "the model itself decided it was done,"
  // not "the response is definitely well-formed." "other" covers anything
  // else (content-filter stops, tool_use, unexpected values) -- callers
  // should NOT treat an "other" finish as safe to complete via a lenient
  // fallback. Added because Gemini reliably finishes with STOP but doesn't
  // reliably emit our instructed closing ===END FILE=== marker even on a
  // fully complete response -- confirmed empirically 2026-08-02.
  finishReason: "stop" | "other";
}

// governance/roadmap/03-token-economics-remediation-plan.md's real finding
// (2026-08-11): Stage A's 11 sequential capability calls per module all
// share an IDENTICAL prefix (contract docs + grounding docs + module list --
// see 01-generate-capability-based-profile.ts's capSections order, which
// deliberately already puts this stable content before the per-capability
// variable content), and that fixed overhead, resent uncached on every call,
// is the confirmed dominant driver of total pipeline cost -- Stage 3's
// assembly-first fix cut the reduce step significantly but left the module
// total roughly flat because it never touched this.
//
// Callers insert this exact marker string into the prompt at the boundary
// between the stable prefix and the variable per-call content. Anthropic
// requires structured content blocks (not a flat string) to place a
// `cache_control` breakpoint, so callAnthropic splits on this marker when
// present and builds the block array itself; callers never touch Anthropic's
// wire format directly. If the marker is absent, behavior is byte-identical
// to before this existed -- a single content string, no breakpoint. Not
// wired into Gemini/OpenAI as an actual caching mechanism -- callGemini and
// callOpenAI just strip the marker (governance/roadmap/04-complete-repo-
// run-and-repo-reports-plan.md Stage 1) so it never leaks into their prompts
// as literal text. Each provider's own caching mechanics (if any) still need
// checking on their own terms before assuming this generalizes; see
// governance/roadmap/phase 2-llm q&a/01 facts-vs-decisions-for-review.md.
export const CACHE_BREAKPOINT_MARKER = "\n\n<<<CACHE_BREAKPOINT_DO_NOT_INCLUDE_IN_OUTPUT>>>\n\n";

export async function callLlm(prompt: string, config: LlmProviderConfig): Promise<LlmCallResult> {
  let result: LlmCallResult;
  switch (config.provider) {
    case "gemini":
      // Vertex AI + ADC -- no API key involved, see callGemini.
      result = await callGemini(prompt, config);
      break;
    case "anthropic":
      result = await callAnthropic(prompt, config, requireApiKey(config));
      break;
    case "openai":
      result = await callOpenAI(prompt, config, requireApiKey(config));
      break;
    default: {
      // Exhaustiveness check: if a new provider is added to LlmProviderName
      // without a case here, this fails to compile rather than silently
      // falling through at runtime.
      const _exhaustive: never = config.provider;
      throw new Error(`[Fail-Closed] Unknown LLM provider '${_exhaustive}'.`);
    }
  }

  // See servedModel's own comment -- verify what the provider says actually
  // served the request against what we asked for. Warn, don't throw: a
  // provider substituting an equivalent/aliased model is worth knowing about
  // but isn't necessarily a failure.
  if (result.servedModel && result.servedModel !== result.model) {
    console.warn(
      `[LLM_MODEL_MISMATCH] Requested model '${result.model}' but provider '${config.provider}' reports it was served by '${result.servedModel}'.`
    );
  }

  return result;
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

// Uses @google/genai in "enterprise" mode (the current recommended flag --
// the SDK also accepts the older `vertexai` name, but `enterprise` is what
// its own type declarations recommend as of the Gemini Enterprise Agent
// Platform rebrand). Authenticates via Application Default Credentials
// in-process (google-auth-library, bundled with the SDK) -- no gcloud CLI
// shell-out, no API key. Requires the caller to have already run `gcloud
// auth application-default login` with an identity that has access on the
// target project; the same code works unmodified against a service account
// or Workload Identity Federation credential in CI/CD, only the credential
// source underneath ADC changes.
async function callGemini(prompt: string, config: LlmProviderConfig): Promise<LlmCallResult> {
  if (!config.projectId) {
    throw new Error(`[Fail-Closed] 'projectId' is required in config/llm-providers.json for Gemini (Vertex AI) calls (model '${config.model}').`);
  }
  if (!config.location) {
    throw new Error(`[Fail-Closed] 'location' is required in config/llm-providers.json for Gemini (Vertex AI) calls (model '${config.model}').`);
  }

  const ai = new GoogleGenAI({ enterprise: true, project: config.projectId, location: config.location });

  // CACHE_BREAKPOINT_MARKER is an Anthropic-only construct (see its own
  // comment above) -- callAnthropic consumes it to place a cache_control
  // breakpoint, but nothing here understands it. Strip it so it never leaks
  // into Gemini's visible prompt as literal text. Vertex AI's own caching
  // mechanics are unresearched (governance/roadmap/04-gaps-and-issues-
  // before-full-repo-run.md, item 3) -- this is a safe no-op fix, not a
  // caching implementation for Gemini.
  const cleanPrompt = prompt.split(CACHE_BREAKPOINT_MARKER).join("");

  let response;
  try {
    response = await ai.models.generateContent({
      model: config.model,
      contents: cleanPrompt,
      config: {
        maxOutputTokens: config.maxTokens ?? 8192,
        temperature: config.temperature ?? 0.2,
        ...(config.thinkingLevel ? { thinkingConfig: { thinkingLevel: ThinkingLevel[config.thinkingLevel] } } : {}),
      },
    });
  } catch (err: any) {
    throw new Error(`[LLM_CALL_FAILED] Gemini (Enterprise Agent Platform) request failed: ${err.message}`);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  const text = response.text;

  // Fail closed on truncation -- see the matching check in callAnthropic for
  // why this can't be left to the empty-text branch below alone (a
  // MAX_TOKENS finish can still return non-empty, but incomplete, text).
  if (finishReason === "MAX_TOKENS" && text) {
    throw new Error(
      `[LLM_OUTPUT_TRUNCATED] Gemini response for model '${config.model}' was cut off (finishReason: MAX_TOKENS, ` +
        `maxTokens configured: ${config.maxTokens ?? 8192}). Increase 'maxTokens' in config/llm-providers.json for this provider key.`
    );
  }

  if (!text) {
    // Gemini 2.5 models spend part of maxOutputTokens on internal
    // "thinking" tokens (usageMetadata.thoughtsTokenCount) before producing
    // visible output -- an empty response with finishReason MAX_TOKENS
    // usually means maxTokens was too small for this model, not a failed
    // call. Confirmed empirically 2026-08-01 while testing the raw REST
    // endpoint; unchanged by the SDK swap.
    throw new Error(
      `[LLM_CALL_FAILED] Gemini response contained no text (finishReason: ${finishReason ?? "unknown"}). ` +
        `If finishReason is MAX_TOKENS, this model likely spent its token budget on internal reasoning -- try increasing maxTokens.`
    );
  }

  return {
    text,
    provider: "gemini",
    model: config.model,
    servedModel: response.modelVersion,
    raw: response,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      // Added 2026-08-11, asked directly "are we using caching at Gemini":
      // answer was no -- CACHE_BREAKPOINT_MARKER is Anthropic-only (see its
      // own comment) and callGemini just strips it. Vertex AI's own caching
      // (per @google/genai's `ai.caches` namespace and the `cachedContent`
      // config field) looks to be EXPLICIT -- create a cache resource, then
      // reference it -- not automatic, unlike Anthropic's inline
      // cache_control blocks. This field reports the real number either
      // way: 0/undefined confirms no caching occurred on a given call
      // (expected, since we never create or reference a cache resource);
      // a nonzero value here without us doing anything would mean Vertex AI
      // applies some caching implicitly, which isn't otherwise documented.
      cacheReadInputTokens: response.usageMetadata?.cachedContentTokenCount,
    },
    finishReason: finishReason === "STOP" ? "stop" : "other",
  };
}

async function callAnthropic(prompt: string, config: LlmProviderConfig, apiKey: string): Promise<LlmCallResult> {
  const url = "https://api.anthropic.com/v1/messages";
  // `temperature` deliberately omitted: newer Claude models (confirmed on
  // claude-sonnet-5, also reported for opus-4.7) reject the request with
  // HTTP 400 "temperature is deprecated for this model" if the field is
  // present at all, regardless of value -- not just when it's non-default.
  // Confirmed empirically 2026-08-01 against claude-sonnet-5.
  // Minimum cacheable prefix for claude-sonnet-5 is 1024 tokens (per the
  // model's own documented minimum, distinct from Opus 5's 512) -- a
  // breakpoint on a shorter prefix silently just doesn't cache (no error,
  // cache_creation_input_tokens stays 0). Not checked here; the grounding +
  // contract prefix this is used for is already ~50-60K tokens, far above
  // the floor, so this isn't currently a real risk -- worth revisiting if
  // this marker is ever used on a much smaller prefix.
  const breakpointIndex = prompt.indexOf(CACHE_BREAKPOINT_MARKER);
  const content =
    breakpointIndex === -1
      ? prompt
      : [
          { type: "text", text: prompt.slice(0, breakpointIndex), cache_control: { type: "ephemeral" } },
          { type: "text", text: prompt.slice(breakpointIndex + CACHE_BREAKPOINT_MARKER.length) },
        ];

  const body = {
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    messages: [{ role: "user", content }],
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

  // Fail closed on truncation rather than silently returning partial text --
  // stop_reason "max_tokens" means the response was cut off mid-content, not
  // that the model chose to stop. Confirmed empirically 2026-08-01: every
  // call in the first `building` capability-based test run hit this and went
  // undetected until a manual tail-check, because nothing here or in
  // splitMarkedFiles was checking for it.
  if (data?.stop_reason === "max_tokens") {
    throw new Error(
      `[LLM_OUTPUT_TRUNCATED] Anthropic response for model '${config.model}' was cut off (stop_reason: max_tokens, ` +
        `maxTokens configured: ${config.maxTokens ?? 8192}, output_tokens used: ${data?.usage?.output_tokens ?? "unknown"}). ` +
        `Increase 'maxTokens' in config/llm-providers.json for this provider key, or reduce the requested output size.`
    );
  }

  return {
    text,
    provider: "anthropic",
    model: config.model,
    servedModel: data?.model,
    raw: data,
    usage: {
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
      cacheReadInputTokens: data?.usage?.cache_read_input_tokens,
      cacheCreationInputTokens: data?.usage?.cache_creation_input_tokens,
    },
    finishReason: data?.stop_reason === "end_turn" ? "stop" : "other",
  };
}

async function callOpenAI(prompt: string, config: LlmProviderConfig, apiKey: string): Promise<LlmCallResult> {
  const url = "https://api.openai.com/v1/chat/completions";
  // See the matching strip in callGemini -- CACHE_BREAKPOINT_MARKER is
  // Anthropic-only; OpenAI has no handling for it either.
  const cleanPrompt = prompt.split(CACHE_BREAKPOINT_MARKER).join("");
  const body = {
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    temperature: config.temperature ?? 0.2,
    messages: [{ role: "user", content: cleanPrompt }],
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

  // Fail closed on truncation -- see the matching check in callAnthropic.
  if (data?.choices?.[0]?.finish_reason === "length") {
    throw new Error(
      `[LLM_OUTPUT_TRUNCATED] OpenAI response for model '${config.model}' was cut off (finish_reason: length, ` +
        `maxTokens configured: ${config.maxTokens ?? 8192}, completion_tokens used: ${data?.usage?.completion_tokens ?? "unknown"}). ` +
        `Increase 'maxTokens' in config/llm-providers.json for this provider key.`
    );
  }

  return {
    text,
    provider: "openai",
    model: config.model,
    servedModel: data?.model,
    raw: data,
    usage: {
      inputTokens: data?.usage?.prompt_tokens,
      outputTokens: data?.usage?.completion_tokens,
    },
    finishReason: data?.choices?.[0]?.finish_reason === "stop" ? "stop" : "other",
  };
}
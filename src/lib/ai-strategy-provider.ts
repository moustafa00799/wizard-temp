import { createHash } from "node:crypto";
import type {
  AiProvenance,
  AIProviderFailureCategory,
  AIProviderName,
  FallbackReason,
  StructuredMode,
} from "./contracts/ai-provenance";

export type StrategyProviderName = "groq" | "mistral" | "gemini";
export type ProviderFailureCategory = AIProviderFailureCategory;

export type StrategyProviderOptions = {
  provider: StrategyProviderName;
  model?: string;
  timeoutMs?: number;
  promptVersion?: string;
  policyVersion?: string;
  fallbackFrom?: AIProviderName;
  fallbackReason?: FallbackReason;
};

export type ProviderFailure = {
  category: ProviderFailureCategory;
  retryable: boolean;
  status?: number;
  errorCode?: string;
  requestId?: string;
  retryAfterMs?: number;
};

export type StrategyProviderResult = {
  success: boolean;
  data: unknown | null;
  error: string | null;
  failureCategory?: ProviderFailureCategory;
  retryable?: boolean;
  status?: number;
  failure?: ProviderFailure;
  provenance: AiProvenance;
};

const PROMPT_VERSION = "strategy-builder-v1";
const POLICY_VERSION = "cdks-governance-v1";
const DEFAULT_TIMEOUT_MS = 15_000;

export const AI_STRATEGY_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    strategic_summary: { type: "string" },
    message_angles: { type: "array", items: { type: "string" }, maxItems: 8 },
    audience_hypotheses: { type: "array", items: { type: "string" }, maxItems: 8 },
    experiment_ideas: { type: "array", items: { type: "string" }, maxItems: 8 },
    proposed_changes: { type: "array", items: { type: "string" }, maxItems: 12 },
    rejected_changes: { type: "array", items: { type: "string" }, maxItems: 12 },
    limitations: { type: "array", items: { type: "string" }, maxItems: 12 },
  },
  required: [
    "strategic_summary",
    "message_angles",
    "audience_hypotheses",
    "experiment_ideas",
    "proposed_changes",
    "rejected_changes",
    "limitations",
  ],
} as const;

const SCHEMA_HASH = createHash("sha256")
  .update(JSON.stringify(AI_STRATEGY_PROPOSAL_JSON_SCHEMA))
  .digest("hex");

const PROVIDER_DEFAULTS: Record<StrategyProviderName, {
  endpoint: string;
  keyEnv: string;
  modelEnv: string;
  defaultModel: string;
  structuredMode: StructuredMode;
  trainingUse: AiProvenance["dataPolicySnapshot"]["trainingUse"];
  retention: AiProvenance["dataPolicySnapshot"]["retention"];
}> = {
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_STRATEGY_MODEL",
    defaultModel: "openai/gpt-oss-120b",
    structuredMode: "strict_json_schema",
    trainingUse: "disallowed",
    retention: "temporary",
  },
  mistral: {
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
    modelEnv: "MISTRAL_STRATEGY_MODEL",
    defaultModel: "mistral-small-latest",
    structuredMode: "json_schema",
    trainingUse: "disallowed",
    retention: "zero",
  },
  gemini: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_BENCHMARK_MODEL",
    defaultModel: "gemini-2.5-flash",
    structuredMode: "json_schema",
    trainingUse: "allowed",
    retention: "unknown",
  },
};

function providerModel(provider: StrategyProviderName, override?: string): string {
  const defaults = PROVIDER_DEFAULTS[provider];
  return override || process.env[defaults.modelEnv] || defaults.defaultModel;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getStrategyProviderTimeoutMs(provider: StrategyProviderName, override?: number): number {
  if (override && Number.isFinite(override) && override > 0) return Math.floor(override);
  return positiveInt(process.env[`${provider.toUpperCase()}_AI_TIMEOUT_MS`], DEFAULT_TIMEOUT_MS);
}

function failureProvenance(options: StrategyProviderOptions, model: string): AiProvenance {
  const defaults = PROVIDER_DEFAULTS[options.provider];
  return {
    provider: options.provider,
    model,
    endpoint: defaults.endpoint,
    structuredMode: defaults.structuredMode,
    schemaHash: SCHEMA_HASH,
    promptVersion: options.promptVersion ?? PROMPT_VERSION,
    policyVersion: options.policyVersion ?? POLICY_VERSION,
    fallbackFrom: options.fallbackFrom,
    fallbackReason: options.fallbackReason,
    dataPolicySnapshot: {
      trainingUse: defaults.trainingUse,
      retention: defaults.retention,
      region: options.provider === "gemini" ? "google-managed" : undefined,
    },
  };
}

function safeErrorCode(payload: unknown, body: string): string | undefined {
  const value = payload as {
    error?: { code?: unknown; type?: unknown; status?: unknown };
    code?: unknown;
  } | null;
  const candidate = value?.error?.code ?? value?.error?.type ?? value?.error?.status ?? value?.code;
  if (typeof candidate === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(candidate)) return candidate;
  if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  const match = body.match(/(?:code|error_code)\\?"?\\s*[:=]\\s*\\?"?([a-zA-Z0-9_.-]{2,100})/i);
  return match?.[1];
}

function retryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.floor(seconds * 1000), 86_400_000);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 86_400_000);
  return undefined;
}

function classifyFailure(status: number | undefined, body: string, errorCode?: string): {
  category: ProviderFailureCategory;
  retryable: boolean;
  message: string;
} {
  const lower = body.toLowerCase();
  if (status === 401 || lower.includes("invalid api key") || lower.includes("authentication") || lower.includes("unauthorized")) {
    return { category: "auth", retryable: false, message: "AI provider authentication failed." };
  }
  if (status === 404 || lower.includes("notfound") || lower.includes("not found") || lower.includes("model not found")) {
    return { category: "not_found", retryable: false, message: "AI provider endpoint or model was not found." };
  }
  if (status === 429 || lower.includes("rate_limit_exceeded") || lower.includes("rate limit")) {
    return { category: "rate_limited", retryable: true, message: "AI provider request rate limit was exceeded." };
  }
  if (status === 403 && (lower.includes("quota") || lower.includes("resource exhausted"))) {
    return { category: "quota", retryable: false, message: "AI provider quota was exhausted or unavailable." };
  }
  if (
    lower.includes("json_validate_failed") ||
    lower.includes("schema") ||
    lower.includes("structured output") ||
    lower.includes("response_format") ||
    errorCode === "json_validate_failed"
  ) {
    return { category: "schema_rejected", retryable: false, message: "AI provider rejected the structured-output request." };
  }
  if (status === 408 || status === 504) {
    return { category: "timeout", retryable: true, message: "AI provider request timed out upstream." };
  }
  if (status !== undefined && status >= 500) {
    return { category: "server", retryable: true, message: `AI provider server error (${status}).` };
  }
  if (status === 400 || status === 422) {
    return { category: "schema_rejected", retryable: false, message: "AI provider rejected the structured-output request." };
  }
  return { category: "unknown", retryable: false, message: "AI provider returned an unexpected error." };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /aborted|timeout/i.test(error.message));
}

function responseFormat(mode: StructuredMode) {
  if (mode === "strict_json_schema" || mode === "json_schema") {
    return {
      type: "json_schema",
      json_schema: {
        name: "campaign_strategy_proposal",
        strict: mode === "strict_json_schema",
        schema: AI_STRATEGY_PROPOSAL_JSON_SCHEMA,
      },
    };
  }
  return { type: "json_object" };
}

function extractContent(payload: unknown): string {
  const value = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = value?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function withFailure(
  provenance: AiProvenance,
  failure: ProviderFailure,
  latencyMs?: number,
): AiProvenance {
  return {
    ...provenance,
    requestId: failure.requestId,
    latencyMs,
    failureCategory: failure.category,
    failureStatus: failure.status,
    failureCode: failure.errorCode,
    retryable: failure.retryable,
    retryAfterMs: failure.retryAfterMs,
  };
}

export function isStrategyProviderConfigured(provider: StrategyProviderName): boolean {
  return Boolean(process.env[PROVIDER_DEFAULTS[provider].keyEnv]);
}

export function getStrategyProviderModel(provider: StrategyProviderName, override?: string): string {
  return providerModel(provider, override);
}

export async function runStrategyProvider(
  systemPrompt: string,
  userPrompt: string,
  options: StrategyProviderOptions,
): Promise<StrategyProviderResult> {
  const defaults = PROVIDER_DEFAULTS[options.provider];
  const model = providerModel(options.provider, options.model);
  const provenance = failureProvenance(options, model);
  const apiKey = process.env[defaults.keyEnv];

  if (!apiKey) {
    const failure: ProviderFailure = { category: "configuration", retryable: false };
    return {
      success: false,
      data: null,
      error: `${defaults.keyEnv} is not configured.`,
      failureCategory: failure.category,
      retryable: failure.retryable,
      failure,
      provenance: withFailure(provenance, failure),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getStrategyProviderTimeoutMs(options.provider, options.timeoutMs));
  const startedAt = Date.now();

  try {
    const response = await fetch(defaults.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: responseFormat(defaults.structuredMode),
        stream: false,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    const latencyMs = Date.now() - startedAt;
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? undefined;
    const body = JSON.stringify(payload ?? {});
    const errorCode = safeErrorCode(payload, body);
    const retryAfter = retryAfterMs(response.headers.get("retry-after"));

    if (!response.ok) {
      const classified = classifyFailure(response.status, body, errorCode);
      const failure: ProviderFailure = {
        category: classified.category,
        retryable: classified.retryable,
        status: response.status,
        errorCode,
        requestId,
        retryAfterMs: retryAfter,
      };
      return {
        success: false,
        data: null,
        error: classified.message,
        failureCategory: failure.category,
        retryable: failure.retryable,
        status: response.status,
        failure,
        provenance: withFailure(provenance, failure, latencyMs),
      };
    }

    const content = extractContent(payload);
    if (!content) {
      const failure: ProviderFailure = {
        category: "schema_rejected",
        retryable: false,
        status: response.status,
        errorCode: "empty_content",
        requestId,
      };
      return {
        success: false,
        data: null,
        error: "AI provider returned empty content.",
        failureCategory: failure.category,
        retryable: failure.retryable,
        status: response.status,
        failure,
        provenance: withFailure(provenance, failure, latencyMs),
      };
    }

    const data = parseJson(content);
    if (data === null) {
      const failure: ProviderFailure = {
        category: "schema_rejected",
        retryable: false,
        status: response.status,
        errorCode: "invalid_json_content",
        requestId,
      };
      return {
        success: false,
        data: null,
        error: "AI provider returned non-JSON content.",
        failureCategory: failure.category,
        retryable: failure.retryable,
        status: response.status,
        failure,
        provenance: withFailure(provenance, failure, latencyMs),
      };
    }

    const usage = (payload as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } } | null)?.usage;
    return {
      success: true,
      data,
      error: null,
      status: response.status,
      provenance: {
        ...provenance,
        requestId,
        latencyMs,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        retryable: false,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const timeout = isAbortError(error);
    const failure: ProviderFailure = {
      category: timeout ? "timeout" : "network",
      retryable: true,
    };
    return {
      success: false,
      data: null,
      error: timeout ? "AI provider request timed out." : "AI provider network request failed.",
      failureCategory: failure.category,
      retryable: failure.retryable,
      failure,
      provenance: withFailure(provenance, failure, latencyMs),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export { SCHEMA_HASH, PROMPT_VERSION, POLICY_VERSION };

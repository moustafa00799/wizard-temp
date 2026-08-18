import { createHash } from "node:crypto";
import type { AiProvenance, AIProviderName, FallbackReason, StructuredMode } from "./contracts/ai-provenance";

export type StrategyProviderName = "groq" | "mistral" | "gemini";
export type ProviderFailureCategory = "configuration" | "auth" | "quota" | "server" | "timeout" | "network" | "validation" | "unknown";

export type StrategyProviderOptions = {
  provider: StrategyProviderName;
  model?: string;
  timeoutMs?: number;
  promptVersion?: string;
  policyVersion?: string;
  fallbackFrom?: AIProviderName;
  fallbackReason?: FallbackReason;
};

export type StrategyProviderResult = {
  success: boolean;
  data: unknown | null;
  error: string | null;
  failureCategory?: ProviderFailureCategory;
  retryable?: boolean;
  status?: number;
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

function classifyFailure(status: number | undefined, body: string): {
  category: ProviderFailureCategory;
  retryable: boolean;
  message: string;
} {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403 || lower.includes("invalid api key") || lower.includes("authentication")) {
    return { category: "auth", retryable: false, message: "AI provider authentication failed." };
  }
  if (status === 429 || lower.includes("rate limit") || lower.includes("quota")) {
    return { category: "quota", retryable: true, message: "AI provider rate limit or quota was exceeded." };
  }
  if (status !== undefined && status >= 500) {
    return { category: "server", retryable: true, message: `AI provider server error (${status}).` };
  }
  if (status === 400 || status === 422) {
    return { category: "validation", retryable: false, message: "AI provider rejected the structured-output request." };
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
    return {
      success: false,
      data: null,
      error: `${defaults.keyEnv} is not configured.`,
      failureCategory: "configuration",
      retryable: false,
      provenance,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
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
    const requestId = response.headers.get("x-request-id") ?? undefined;

    if (!response.ok) {
      const classified = classifyFailure(response.status, JSON.stringify(payload ?? {}));
      return {
        success: false,
        data: null,
        error: classified.message,
        failureCategory: classified.category,
        retryable: classified.retryable,
        status: response.status,
        provenance: {
          ...provenance,
          requestId,
          latencyMs,
        },
      };
    }

    const content = extractContent(payload);
    if (!content) {
      return {
        success: false,
        data: null,
        error: "AI provider returned empty content.",
        failureCategory: "validation",
        retryable: false,
        status: response.status,
        provenance: { ...provenance, requestId, latencyMs },
      };
    }

    const data = parseJson(content);
    if (data === null) {
      return {
        success: false,
        data: null,
        error: "AI provider returned non-JSON content.",
        failureCategory: "validation",
        retryable: false,
        status: response.status,
        provenance: { ...provenance, requestId, latencyMs },
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
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const timeout = isAbortError(error);
    return {
      success: false,
      data: null,
      error: timeout ? "AI provider request timed out." : "AI provider network request failed.",
      failureCategory: timeout ? "timeout" : "network",
      retryable: true,
      provenance: { ...provenance, latencyMs },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export { SCHEMA_HASH, PROMPT_VERSION, POLICY_VERSION };

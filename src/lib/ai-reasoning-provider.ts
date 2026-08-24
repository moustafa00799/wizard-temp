import { createHash } from "node:crypto";
import type {
  AIProviderFailureCategory,
  AIProviderName,
  AiProvenance,
  FallbackReason,
  StructuredMode,
} from "./contracts/ai-provenance";

export type ReasoningProviderName = "groq" | "mistral";

export type ReasoningProviderOptions = {
  provider: ReasoningProviderName;
  model?: string;
  timeoutMs?: number;
  fallbackFrom?: AIProviderName;
  fallbackReason?: FallbackReason;
};

export type ReasoningProviderResult = {
  success: boolean;
  data: unknown | null;
  error: string | null;
  failureCategory?: AIProviderFailureCategory;
  retryable?: boolean;
  status?: number;
  provenance: AiProvenance;
};

const PROMPT_VERSION = "ai-reasoning-v1";
const POLICY_VERSION = "cdks-governance-v1";
const DEFAULT_TIMEOUT_MS: Record<ReasoningProviderName, number> = {
  groq: 15_000,
  mistral: 30_000,
};

const PROVIDER_DEFAULTS: Record<ReasoningProviderName, {
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
    modelEnv: "GROQ_REASONING_MODEL",
    defaultModel: "openai/gpt-oss-120b",
    structuredMode: "strict_json_schema",
    trainingUse: "disallowed",
    retention: "temporary",
  },
  mistral: {
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
    modelEnv: "MISTRAL_REASONING_MODEL",
    defaultModel: "mistral-small-latest",
    structuredMode: "json_schema",
    trainingUse: "disallowed",
    retention: "zero",
  },
};

/**
 * Provider output schema. Server-owned identity, provenance, and safety fields
 * are intentionally excluded and are added only after local validation.
 */
export const AI_REASONING_PROVIDER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    contract_version: { type: "string", enum: ["1.0"] },
    source_contract_version: { type: "string", enum: ["3.0"] },
    locale: { type: "string", enum: ["ar", "en"] },
    purpose: { type: "string", enum: ["explain", "critique", "gap_analysis", "synthesize"] },
    status: { type: "string", enum: ["completed"] },
    summary: { type: "string" },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          statement: { type: "string" },
          claim_type: { type: "string", enum: ["evidence_based", "qualified_inference", "assumption", "recommendation", "unsupported"] },
          status: { type: "string", enum: ["supported", "qualified", "unsupported", "rejected"] },
          confidence: { type: "number" },
          evidence_refs: { type: "array", items: { type: "string" } },
          decision_refs: { type: "array", items: { type: "string" } },
          uncertainty_refs: { type: "array", items: { type: "string" } },
          limitations: { type: "array", items: { type: "string" } },
        },
        required: ["id", "statement", "claim_type", "status", "confidence", "evidence_refs", "decision_refs", "uncertainty_refs", "limitations"],
      },
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["wizard_input", "cdks_decision", "rule_output", "blueprint_field", "warning", "provenance", "ai_strategy", "assumption"] },
          path: { type: "string" },
          source_ref: { type: "string" },
          authority: { type: "string", enum: ["WIZARD_INPUT", "DECISION_POLICY", "READINESS_POLICY", "RULE_ENGINE", "AI_STRATEGY_BUILDER", "DEFAULT_ASSUMPTION", "HUMAN_APPROVAL"] },
          user_confirmed: { type: "boolean" },
          relevance: { type: "string", enum: ["primary", "supporting", "context"] },
          excerpt: { type: "string" },
          limitations: { type: "array", items: { type: "string" } },
        },
        required: ["id", "kind", "path", "source_ref", "authority", "user_confirmed", "relevance", "limitations"],
      },
    },
    uncertainties: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          statement: { type: "string" },
          category: { type: "string", enum: ["missing_input", "unconfirmed_input", "assumption", "model_limit", "conflicting_evidence", "reference_gap"] },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          affects: { type: "array", items: { type: "string" } },
          resolution: { type: "string" },
        },
        required: ["id", "statement", "category", "severity", "affects", "resolution"],
      },
    },
    decision_impacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          decision_ref: { type: "string" },
          impact: { type: "string", enum: ["supports", "clarifies", "challenges", "no_change"] },
          rationale: { type: "string" },
          preserved_authority: { type: "string", enum: ["DECISION_POLICY", "READINESS_POLICY", "RULE_ENGINE", "HUMAN_APPROVAL"] },
          changed: { type: "boolean", enum: [false] },
        },
        required: ["decision_ref", "impact", "rationale", "preserved_authority", "changed"],
      },
    },
    limitations: { type: "array", items: { type: "string" } },
    grounding: {
      type: "object",
      additionalProperties: false,
      properties: {
        evidence_coverage_percent: { type: "number" },
        supported_claim_count: { type: "integer" },
        qualified_claim_count: { type: "integer" },
        unsupported_claim_count: { type: "integer" },
        evidence_only_mode: { type: "boolean", enum: [true] },
      },
      required: ["evidence_coverage_percent", "supported_claim_count", "qualified_claim_count", "unsupported_claim_count", "evidence_only_mode"],
    },
  },
  required: ["contract_version", "source_contract_version", "locale", "purpose", "status", "summary", "claims", "evidence", "uncertainties", "decision_impacts", "limitations", "grounding"],
} as const;

const SCHEMA_HASH = createHash("sha256").update(JSON.stringify(AI_REASONING_PROVIDER_JSON_SCHEMA)).digest("hex");

function modelFor(provider: ReasoningProviderName, override?: string): string {
  const defaults = PROVIDER_DEFAULTS[provider];
  return override || process.env[defaults.modelEnv] || defaults.defaultModel;
}

function timeoutFor(provider: ReasoningProviderName, override?: number): number {
  if (override && Number.isFinite(override) && override > 0) return Math.floor(override);
  const parsed = Number(process.env[`${provider.toUpperCase()}_AI_TIMEOUT_MS`]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_TIMEOUT_MS[provider];
}

function provenanceFor(options: ReasoningProviderOptions, model: string): AiProvenance {
  const defaults = PROVIDER_DEFAULTS[options.provider];
  return {
    provider: options.provider,
    model,
    endpoint: defaults.endpoint,
    structuredMode: defaults.structuredMode,
    schemaHash: SCHEMA_HASH,
    promptVersion: PROMPT_VERSION,
    policyVersion: POLICY_VERSION,
    fallbackFrom: options.fallbackFrom,
    fallbackReason: options.fallbackReason,
    dataPolicySnapshot: {
      trainingUse: defaults.trainingUse,
      retention: defaults.retention,
    },
  };
}

function failureCategory(status: number | undefined, body: string): { category: AIProviderFailureCategory; retryable: boolean; message: string } {
  const lower = body.toLowerCase();
  if (status === 401 || lower.includes("unauthorized") || lower.includes("invalid api key")) return { category: "auth", retryable: false, message: "AI Reasoning provider authentication failed." };
  if (status === 404 || lower.includes("model not found") || lower.includes("not found")) return { category: "not_found", retryable: false, message: "AI Reasoning provider endpoint or model was not found." };
  if (status === 429 || lower.includes("rate limit")) return { category: "rate_limited", retryable: true, message: "AI Reasoning provider rate limit was exceeded." };
  if (status === 408 || status === 504) return { category: "timeout", retryable: true, message: "AI Reasoning provider request timed out." };
  if (status !== undefined && status >= 500) return { category: "server", retryable: true, message: `AI Reasoning provider server error (${status}).` };
  if (status === 400 || status === 422 || lower.includes("schema") || lower.includes("response_format")) return { category: "schema_rejected", retryable: false, message: "AI Reasoning provider rejected the structured-output request." };
  return { category: "unknown", retryable: false, message: "AI Reasoning provider returned an unexpected error." };
}

function extractContent(payload: unknown): string {
  const value = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  return typeof value?.choices?.[0]?.message?.content === "string" ? value.choices[0].message.content.trim() : "";
}

function parseJson(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /aborted|timeout/i.test(error.message));
}

export function isReasoningProviderConfigured(provider: ReasoningProviderName): boolean {
  return Boolean(process.env[PROVIDER_DEFAULTS[provider].keyEnv]);
}

export function getReasoningProviderModel(provider: ReasoningProviderName, override?: string): string {
  return modelFor(provider, override);
}

export async function runReasoningProvider(
  systemPrompt: string,
  userPrompt: string,
  options: ReasoningProviderOptions,
): Promise<ReasoningProviderResult> {
  const defaults = PROVIDER_DEFAULTS[options.provider];
  const model = modelFor(options.provider, options.model);
  const baseProvenance = provenanceFor(options, model);
  const apiKey = process.env[defaults.keyEnv];

  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: `${defaults.keyEnv} is not configured.`,
      failureCategory: "configuration",
      retryable: false,
      provenance: { ...baseProvenance, failureCategory: "configuration", retryable: false },
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutFor(options.provider, options.timeoutMs));
  const startedAt = Date.now();

  try {
    const response = await fetch(defaults.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ai_reasoning_contract",
            strict: defaults.structuredMode === "strict_json_schema",
            schema: AI_REASONING_PROVIDER_JSON_SCHEMA,
          },
        },
        stream: false,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    const latencyMs = Date.now() - startedAt;
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? undefined;
    const body = JSON.stringify(payload ?? {});

    if (!response.ok) {
      const failure = failureCategory(response.status, body);
      return {
        success: false,
        data: null,
        error: failure.message,
        failureCategory: failure.category,
        retryable: failure.retryable,
        status: response.status,
        provenance: { ...baseProvenance, requestId, latencyMs, failureCategory: failure.category, failureStatus: response.status, retryable: failure.retryable },
      };
    }

    const content = extractContent(payload);
    const data = content ? parseJson(content) : null;
    if (!data) {
      return {
        success: false,
        data: null,
        error: "AI Reasoning provider returned invalid or empty JSON.",
        failureCategory: "schema_rejected",
        retryable: false,
        status: response.status,
        provenance: { ...baseProvenance, requestId, latencyMs, failureCategory: "schema_rejected", failureStatus: response.status, failureCode: "invalid_json_content", retryable: false },
      };
    }

    const usage = (payload as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } } | null)?.usage;
    return {
      success: true,
      data,
      error: null,
      status: response.status,
      provenance: {
        ...baseProvenance,
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
    const category: AIProviderFailureCategory = isAbortError(error) ? "timeout" : "network";
    return {
      success: false,
      data: null,
      error: category === "timeout" ? "AI Reasoning provider request timed out." : "AI Reasoning provider network request failed.",
      failureCategory: category,
      retryable: true,
      provenance: { ...baseProvenance, latencyMs, failureCategory: category, retryable: true },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export { PROMPT_VERSION, POLICY_VERSION, SCHEMA_HASH };

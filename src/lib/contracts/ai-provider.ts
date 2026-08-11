import {
  EXECUTION_DECISION_SCHEMA,
  STRATEGY_DECISION_SCHEMA,
} from "./two-ai-schemas";
import {
  EXECUTION_MODEL,
  STRATEGY_MODEL,
  generateStructuredWithGroq,
} from "./groq-structured-provider";

export interface AIProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  stage?: "strategy" | "execution";
}

export interface AIProviderResponse {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  tokensUsed?: number;
  latencyMs: number;
  model?: string;
}

/**
 * v4 provider adapter.
 *
 * Strategy and Execution deliberately use different GPT-OSS models and their
 * own strict JSON Schemas. The orchestration layer remains provider-neutral.
 */
export async function generateStructuredAI(
  request: AIProviderRequest,
): Promise<AIProviderResponse> {
  const stage = request.stage ?? "strategy";
  const isStrategy = stage === "strategy";

  const result = await generateStructuredWithGroq(
    request.systemPrompt,
    request.userPrompt,
    {
      model: isStrategy ? STRATEGY_MODEL : EXECUTION_MODEL,
      schemaName: isStrategy ? "StrategyDecision" : "ExecutionDecision",
      schema: isStrategy ? STRATEGY_DECISION_SCHEMA : EXECUTION_DECISION_SCHEMA,
      retries: 1,
      timeoutMs: 20000,
    },
  );

  return {
    success: result.success,
    data: result.data,
    error: result.error,
    tokensUsed: result.tokensUsed,
    latencyMs: result.latencyMs,
    model: result.model,
  };
}

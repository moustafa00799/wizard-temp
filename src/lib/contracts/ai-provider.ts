import {
  generateStructuredWithGroq,
  type StructuredGenerationOptions,
} from "./groq-structured-provider";

export interface AIProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  options: StructuredGenerationOptions;
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
 * Provider-neutral adapter for the v4 Two-AI boundary.
 *
 * v4 deliberately does not use the legacy ai-client parser. The provider
 * receives the contract schema directly and requests strict structured output.
 * This keeps v3/Llama generation untouched while giving v4 deterministic JSON
 * shape guarantees at the provider boundary.
 */
export async function generateStructuredAI(
  request: AIProviderRequest,
): Promise<AIProviderResponse> {
  return generateStructuredWithGroq(
    request.systemPrompt,
    request.userPrompt,
    request.options,
  );
}

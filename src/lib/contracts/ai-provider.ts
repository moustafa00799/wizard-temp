import { extractBlueprint } from "@/lib/ai-validator";
import { generateBlueprintFromAI, type GenerateOptions } from "@/lib/ai-client";

export interface AIProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  options?: GenerateOptions;
}

export interface AIProviderResponse {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  tokensUsed?: number;
  latencyMs: number;
}

/** Provider-neutral adapter. Keeps orchestration independent from Groq. */
export async function generateStructuredAI(
  request: AIProviderRequest
): Promise<AIProviderResponse> {
  const result = await generateBlueprintFromAI(
    undefined,
    request.systemPrompt,
    request.userPrompt
  );

  if (!result.success || !result.text) {
    return {
      success: false,
      data: null,
      error: result.error || "AI generation failed",
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    };
  }

  const data = extractBlueprint(result.text);
  if (!data) {
    return {
      success: false,
      data: null,
      error: "AI response is not valid structured JSON",
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    };
  }

  return {
    success: true,
    data,
    error: null,
    tokensUsed: result.tokensUsed,
    latencyMs: result.latencyMs,
  };
}

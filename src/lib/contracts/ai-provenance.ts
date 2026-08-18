import { z } from "zod";

export type AIProviderName = "groq" | "mistral" | "gemini" | "openrouter" | "zai" | "mock";
export type StructuredMode = "strict_json_schema" | "json_schema" | "json_object" | "none";
export type FallbackReason = "timeout" | "429" | "5xx" | "provider_unavailable" | "network";

export interface AiProvenance {
  provider: AIProviderName;
  model: string;
  modelVersion?: string;
  endpoint: string;
  structuredMode: StructuredMode;
  schemaHash: string;
  promptVersion: string;
  policyVersion: string;
  requestId?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  fallbackFrom?: AIProviderName;
  fallbackReason?: FallbackReason;
  dataPolicySnapshot: {
    trainingUse: "allowed" | "disallowed" | "unknown";
    retention: "zero" | "temporary" | "unknown";
    region?: string;
  };
}

export const AiProvenanceSchema = z.object({
  provider: z.enum(["groq", "mistral", "gemini", "openrouter", "zai", "mock"]),
  model: z.string(),
  modelVersion: z.string().optional(),
  endpoint: z.string(),
  structuredMode: z.enum(["strict_json_schema", "json_schema", "json_object", "none"]),
  schemaHash: z.string(),
  promptVersion: z.string(),
  policyVersion: z.string(),
  requestId: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  fallbackFrom: z.enum(["groq", "mistral", "gemini", "openrouter", "zai", "mock"]).optional(),
  fallbackReason: z.enum(["timeout", "429", "5xx", "provider_unavailable", "network"]).optional(),
  dataPolicySnapshot: z.object({
    trainingUse: z.enum(["allowed", "disallowed", "unknown"]),
    retention: z.enum(["zero", "temporary", "unknown"]),
    region: z.string().optional(),
  }),
});

export type ValidatedAiProvenance = z.infer<typeof AiProvenanceSchema>;

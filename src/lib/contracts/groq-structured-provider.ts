const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const STRATEGY_MODEL = "openai/gpt-oss-120b";
export const EXECUTION_MODEL = "openai/gpt-oss-20b";

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 1;

type JsonSchema = Record<string, unknown>;

export interface StructuredGenerationOptions {
  model: string;
  fallbackModel?: string;
  schemaName: string;
  schema: JsonSchema;
  timeoutMs?: number;
  retries?: number;
}

export interface StructuredGenerationResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  tokensUsed?: number;
  latencyMs: number;
  model?: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { message?: string; code?: string } }).error;
    if (error?.message) return `Groq ${status}: ${error.message}`;
  }
  return `Groq structured generation failed (${status})`;
}

async function callStructured(
  systemPrompt: string,
  userPrompt: string,
  options: StructuredGenerationOptions,
  signal: AbortSignal,
): Promise<{ data: Record<string, unknown>; tokensUsed?: number }> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      top_p: 0.95,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: options.schemaName,
          strict: true,
          schema: options.schema,
        },
      },
      stream: false,
    }),
    signal,
  });

  const raw = await response.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    // Keep the raw response out of the public error unless it is useful below.
  }

  if (!response.ok) {
    throw new Error(errorMessage(response.status, body));
  }

  const content =
    body && typeof body === "object" && "choices" in body
      ? (body as GroqResponse).choices?.[0]?.message?.content
      : null;

  if (!content || typeof content !== "string") {
    throw new Error("Groq returned an empty structured response");
  }

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Groq structured response was not valid JSON");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Groq structured response must be a JSON object");
  }

  return {
    data: data as Record<string, unknown>,
    tokensUsed:
      body && typeof body === "object" && "usage" in body
        ? (body as GroqResponse).usage?.total_tokens
        : undefined,
  };
}

export async function generateStructuredWithGroq(
  systemPrompt: string,
  userPrompt: string,
  options: StructuredGenerationOptions,
): Promise<StructuredGenerationResult> {
  if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith("gsk_")) {
    return {
      success: false,
      data: null,
      error: "GROQ_API_KEY is missing or invalid",
      latencyMs: 0,
    };
  }

  const start = Date.now();
  const models = [options.model, ...(options.fallbackModel ? [options.fallbackModel] : [])];
  const retries = options.retries ?? MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  let lastError = "Structured AI generation failed";

  for (const model of models) {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await callStructured(
          systemPrompt,
          userPrompt,
          { ...options, model },
          controller.signal,
        );

        clearTimeout(timeoutId);
        return {
          success: true,
          data: result.data,
          error: null,
          tokensUsed: result.tokensUsed,
          latencyMs: Date.now() - start,
          model,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error.message : "Unknown Groq error";

        const isAbort = lastError.toLowerCase().includes("abort");
        const isAuth = lastError.includes("Groq 401");
        const isBadRequest = lastError.includes("Groq 400");

        if (isAuth || isBadRequest) break;
        if (attempt < retries || isAbort) {
          await sleep(500 * (attempt + 1));
          continue;
        }
      }
    }
  }

  return {
    success: false,
    data: null,
    error: lastError,
    latencyMs: Date.now() - start,
  };
}

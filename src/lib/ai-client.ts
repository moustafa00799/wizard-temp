/**
 * Campaign Engine Builder — AI Client (Multi-Phase v3)
 *
 * Groq REST API integration with per-phase generation support.
 * Supports sequential + parallel execution with independent timeouts.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

const REQUEST_TIMEOUT_MS = 12000; // 12s per phase (phases are smaller)
const MAX_RETRIES = 1;

// Rate limiter: Groq Free Tier = 20 RPM → min 3s between requests
const MIN_DELAY_MS = 3500;
let lastRequestTime = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    const wait = MIN_DELAY_MS - elapsed;
    console.log(`[RateLimiter] Waiting ${wait}ms to respect Groq RPM limit...`);
    await delay(wait);
  }
  lastRequestTime = Date.now();
}

// ============================================================
// TYPES
// ============================================================

export interface GenerateOptions {
  timeoutMs?: number;
  retries?: number;
  model?: string;
}

export interface GenerateResult {
  success: boolean;
  text: string | null;
  error: string | null;
  tokensUsed?: number;
  latencyMs: number;
}

export interface PhaseResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  tokensUsed?: number;
  latencyMs: number;
  phase: number;
}

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqRequestBody {
  model: string;
  messages: GroqMessage[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  response_format: { type: "json_object" };
  stream: false;
}

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: GroqUsage;
  system_fingerprint?: string;
}

interface GroqErrorDetail {
  message: string;
  type: string;
  code: string;
}

interface GroqErrorResponse {
  error: GroqErrorDetail;
}

// ============================================================
// ERROR CLASSIFICATION
// ============================================================

function classifyGroqError(
  status: number,
  errorBody: GroqErrorResponse | null
): { category: string; message: string; retryable: boolean } {
  const code = errorBody?.error?.code || "";
  const msg = errorBody?.error?.message || "";

  if (status === 401 || code === "invalid_api_key") {
    return {
      category: "auth",
      message: "Invalid Groq API key (401). Check GROQ_API_KEY.",
      retryable: false,
    };
  }

  if (status === 429 || code === "rate_limit_exceeded") {
    return {
      category: "quota",
      message: "Groq rate limit exceeded (429). Daily quota may be exhausted.",
      retryable: true,
    };
  }

  if (status === 503 || status === 502 || code === "server_error") {
    return {
      category: "server",
      message: `Groq server error (${status}). Service temporarily unavailable.`,
      retryable: true,
    };
  }

  if (status === 400) {
    return {
      category: "bad_request",
      message: `Groq bad request (400): ${msg}`,
      retryable: false,
    };
  }

  if (status === 422) {
    return {
      category: "validation",
      message: `Groq validation error (422): ${msg}`,
      retryable: false,
    };
  }

  return {
    category: "unknown",
    message: `Groq API error (${status}): ${msg || "Unknown error"}`,
    retryable: status >= 500,
  };
}

// ============================================================
// CORE: Groq API CALL
// ============================================================

async function callGroqAPI(
  messages: GroqMessage[],
  model: string,
  signal: AbortSignal
): Promise<{ response: GroqResponse; latencyMs: number }> {
  const startTime = Date.now();

  const body: GroqRequestBody = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 8192, // Per-phase: 4 sections need more tokens than expected
    top_p: 0.95,
    response_format: { type: "json_object" },
    stream: false,
  };

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const latencyMs = Date.now() - startTime;

  if (!res.ok) {
    let errorBody: GroqErrorResponse | null = null;
    try {
      errorBody = (await res.json()) as GroqErrorResponse;
    } catch {
      // ignore parse error
    }
    const classified = classifyGroqError(res.status, errorBody);
    throw new Error(
      JSON.stringify({
        status: res.status,
        ...classified,
      })
    );
  }

  const response = (await res.json()) as GroqResponse;
  return { response, latencyMs };
}

// ============================================================
// REQUEST WRAPPER WITH TIMEOUT & RETRY
// ============================================================

async function generateWithGroq(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const retries = options.retries ?? MAX_RETRIES;
  const preferredModel = options.model ?? PRIMARY_MODEL;

  const startTime = Date.now();
  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const modelsToTry = [preferredModel];
  if (preferredModel !== FALLBACK_MODEL) {
    modelsToTry.push(FALLBACK_MODEL);
  }

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const { response, latencyMs } = await callGroqAPI(
          messages,
          model,
          controller.signal
        );

        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content?.trim() || "";
        const tokensUsed = response.usage?.total_tokens;

        if (!content) {
          throw new Error("Empty content from Groq response");
        }

        return {
          success: true,
          text: content,
          error: null,
          tokensUsed,
          latencyMs: Date.now() - startTime,
        };
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const isLastModel = model === modelsToTry[modelsToTry.length - 1];
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (
          errorMessage.includes("abort") ||
          errorMessage.includes("Abort") ||
          errorMessage.includes("The operation was aborted")
        ) {
          if (isLastAttempt && isLastModel) {
            return {
              success: false,
              text: null,
              error: `Groq request timed out after ${timeoutMs}ms (${retries + 1} attempts, model: ${model})`,
              latencyMs: Date.now() - startTime,
            };
          }
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        let parsedError: {
          category?: string;
          message?: string;
          retryable?: boolean;
          status?: number;
        } = {};
        try {
          parsedError = JSON.parse(errorMessage);
        } catch {
          // not a JSON error
        }

        if (
          parsedError.retryable === false ||
          errorMessage.includes("auth") ||
          errorMessage.includes("Invalid Groq API key")
        ) {
          return {
            success: false,
            text: null,
            error: parsedError.message || `Groq generation failed: ${errorMessage}`,
            latencyMs: Date.now() - startTime,
          };
        }

        if (!isLastAttempt) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        if (!isLastModel) {
          break;
        }

        return {
          success: false,
          text: null,
          error: parsedError.message || `Groq generation failed: ${errorMessage}`,
          latencyMs: Date.now() - startTime,
        };
      }
    }
  }

  return {
    success: false,
    text: null,
    error: "Unexpected error in Groq generation loop",
    latencyMs: Date.now() - startTime,
  };
}

// ============================================================
// PHASE GENERATION (NEW)
// ============================================================

import { extractBlueprint } from "./ai-validator";

/**
 * Generate a single phase of the blueprint.
 * Extracts and validates JSON automatically.
 */
export async function generatePhase(
  phaseNumber: 1 | 2 | 3,
  systemPrompt: string,
  userPrompt: string,
  options?: GenerateOptions
): Promise<PhaseResult> {
  const startTime = Date.now();

  // Enforce Groq rate limit (20 RPM = min 3s between requests)
  await enforceRateLimit();

  try {
    const result = await generateWithGroq(systemPrompt, userPrompt, {
      timeoutMs: options?.timeoutMs ?? REQUEST_TIMEOUT_MS,
      retries: options?.retries ?? MAX_RETRIES,
      model: options?.model ?? PRIMARY_MODEL,
    });

    if (!result.success || !result.text) {
      return {
        success: false,
        data: null,
        error: result.error || "Empty AI response",
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        phase: phaseNumber,
      };
    }

    const extracted = extractBlueprint(result.text);
    if (!extracted) {
      console.error(`[Phase ${phaseNumber}] JSON extraction failed. Raw text (first 800 chars):`, result.text?.slice(0, 800));
      return {
        success: false,
        data: null,
        error: "Failed to extract valid JSON from AI response",
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        phase: phaseNumber,
      };
    }

    return {
      success: true,
      data: extracted,
      error: null,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      phase: phaseNumber,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown phase error";
    return {
      success: false,
      data: null,
      error: message,
      latencyMs: Date.now() - startTime,
      phase: phaseNumber,
    };
  }
}

// ============================================================
// LEGACY API (kept for compatibility)
// ============================================================

export async function generateBlueprintFromAI(
  _wizardData: unknown,
  systemPrompt: string,
  userPrompt: string
): Promise<GenerateResult> {
  return generateWithGroq(systemPrompt, userPrompt, {
    timeoutMs: REQUEST_TIMEOUT_MS,
    retries: MAX_RETRIES,
    model: PRIMARY_MODEL,
  });
}

export function isAIConfigured(): boolean {
  return !!GROQ_API_KEY && GROQ_API_KEY.startsWith("gsk_");
}

export function getAIModelInfo(): {
  primaryModel: string;
  fallbackModel: string;
  timeout: number;
  maxRetries: number;
} {
  return {
    primaryModel: PRIMARY_MODEL,
    fallbackModel: FALLBACK_MODEL,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  };
}

import assert from "node:assert/strict";
import { getStrategyProviderResponseFormat, runStrategyProvider } from "../src/lib/ai-strategy-provider";
import { getReasoningProviderResponseFormat } from "../src/lib/ai-reasoning-provider";

const groq = getStrategyProviderResponseFormat("groq") as {
  type: string;
  json_schema?: { strict?: boolean; schema?: { properties?: Record<string, { maxItems?: number }> } };
};
const mistral = getStrategyProviderResponseFormat("mistral") as {
  type: string;
  json_schema?: { strict?: boolean; schema?: { properties?: Record<string, { maxItems?: number }> } };
};
const gemini = getStrategyProviderResponseFormat("gemini") as {
  type: string;
  json_schema?: { strict?: boolean; schema?: { properties?: Record<string, { maxItems?: number }> } };
};
type ReasoningWireFormat = {
  type: string;
  json_schema?: {
    strict?: boolean;
    schema?: {
      required?: readonly string[];
      properties?: {
        evidence?: {
          items?: {
            required?: readonly string[];
            properties?: { excerpt?: { type?: string } };
          };
        };
      };
    };
  };
};
const reasoningGroq = getReasoningProviderResponseFormat("groq") as unknown as ReasoningWireFormat;
const reasoningMistral = getReasoningProviderResponseFormat("mistral") as unknown as ReasoningWireFormat;

assert.equal(groq.type, "json_schema");
assert.equal(groq.json_schema?.strict, true);
assert.equal(groq.json_schema?.schema?.properties?.message_angles?.maxItems, undefined);
assert.equal(groq.json_schema?.schema?.properties?.proposed_changes?.maxItems, undefined);

assert.equal(mistral.type, "json_schema");
assert.equal(mistral.json_schema?.strict, false);
assert.equal(mistral.json_schema?.schema?.properties?.message_angles?.maxItems, 8);
assert.equal(mistral.json_schema?.schema?.properties?.proposed_changes?.maxItems, 12);

assert.equal(gemini.type, "json_schema");
assert.equal(gemini.json_schema?.strict, false);
assert.equal(gemini.json_schema?.schema?.properties?.message_angles?.maxItems, 8);
assert.equal(gemini.json_schema?.schema?.properties?.proposed_changes?.maxItems, 12);

assert.equal(reasoningGroq.type, "json_schema");
assert.equal(reasoningGroq.json_schema?.strict, true);
assert.equal(reasoningGroq.json_schema?.schema?.properties?.evidence?.items?.required?.includes("excerpt"), true);
assert.equal(reasoningGroq.json_schema?.schema?.properties?.evidence?.items?.properties?.excerpt?.type, "string");
assert.equal(reasoningMistral.type, "json_schema");
assert.equal(reasoningMistral.json_schema?.strict, false);
assert.equal(reasoningMistral.json_schema?.schema?.properties?.evidence?.items?.required?.includes("excerpt"), true);

async function main() {
  const originalFetch = globalThis.fetch;
  const capturedBodies: Array<{ model?: string; temperature?: number; response_format?: unknown }> = [];
  process.env.GROQ_API_KEY = "provider-schema-test-key";
  process.env.GEMINI_API_KEY = "provider-schema-test-key";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBodies.push(JSON.parse(String(init?.body)) as { model?: string; temperature?: number; response_format?: unknown });
    return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    await runStrategyProvider("system", "user", { provider: "gemini" });
    await runStrategyProvider("system", "user", { provider: "groq" });
  } finally {
    globalThis.fetch = originalFetch;
  }
  const geminiRequest = capturedBodies.find((body) => body.model === "gemini-3.6-flash");
  const groqRequest = capturedBodies.find((body) => body.model === "openai/gpt-oss-120b");
  assert.ok(geminiRequest);
  assert.equal("temperature" in geminiRequest, false);
  assert.ok(groqRequest);
  assert.equal(groqRequest.temperature, 0.2);

  console.log("provider schema/request regression: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

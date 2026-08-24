import assert from "node:assert/strict";
import { getStrategyProviderResponseFormat } from "../src/lib/ai-strategy-provider";
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

console.log("provider schema regression: PASS");

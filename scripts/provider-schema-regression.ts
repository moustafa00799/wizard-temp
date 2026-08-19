import assert from "node:assert/strict";
import { getStrategyProviderResponseFormat } from "../src/lib/ai-strategy-provider";

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

console.log("provider schema regression: PASS");

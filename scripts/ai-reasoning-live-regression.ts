import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildAIReasoning } from "../src/lib/ai-reasoning-builder";
import { runMockReasoningBuilder } from "../src/lib/ai-reasoning-builder-mock";
import type { ReasoningProviderResult } from "../src/lib/ai-reasoning-provider";
import type { BlueprintContractV3 } from "../src/lib/contracts/blueprint-contract-v3";
import type { CanonicalBlueprint } from "../src/lib/contracts/canonical-blueprint";
import type { CanonicalWizardInput } from "../src/lib/contracts/wizard-input";

const fixturePath = path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const contract = {
  blueprint_id: "22222222-2222-4222-8222-222222222222",
  locale: "ar",
  decisions: {},
  readiness: {},
  warnings: [],
  provenance: [],
} as unknown as BlueprintContractV3;
const input = {
  ...(fixture.input ?? fixture),
  offer_description: "عرض تجريبي تواصل me@example.com عبر https://private.example.test/token",
  past_performance_notes: "token=super-secret-token-1234567890 phone +201001234567",
} as CanonicalWizardInput;
const blueprint = { blueprint_id: contract.blueprint_id, strategy: {} } as CanonicalBlueprint;

function provenance(provider: "groq" | "mistral") {
  return {
    provider,
    model: `${provider}-test-model`,
    endpoint: `https://${provider}.example.test/chat/completions`,
    structuredMode: "strict_json_schema" as const,
    schemaHash: "test-schema",
    promptVersion: "test-prompt",
    policyVersion: "test-policy",
    dataPolicySnapshot: { trainingUse: "disallowed" as const, retention: "temporary" as const },
  };
}

function success(provider: "groq" | "mistral", scenario: "baseline" | "malformed" = "baseline"): ReasoningProviderResult {
  const result = runMockReasoningBuilder(scenario, "ar");
  return {
    success: true,
    data: result.success ? result.data : null,
    error: null,
    provenance: provenance(provider),
  };
}

async function main() {
  process.env.AI_DATA_POLICY = "sanitized_wizard_only";

  let calls = 0;
  let capturedUserPrompt = "";
  const runner = async (_systemPrompt: string, userPrompt: string): Promise<ReasoningProviderResult> => {
    calls += 1;
    capturedUserPrompt = userPrompt;
    return success("groq");
  };

  const live = await buildAIReasoning(input, blueprint, contract, {
    enabled: true,
    provider: "groq",
    liveAllowed: true,
    providerRunner: runner,
  });
  assert.equal(live.status, "completed");
  assert.equal(live.provenance?.provider, "groq");
  assert.equal(calls, 1);
  assert.equal(capturedUserPrompt.includes("me@example.com"), false);
  assert.equal(capturedUserPrompt.includes("private.example.test"), false);
  assert.equal(capturedUserPrompt.includes("super-secret-token-1234567890"), false);

  calls = 0;
  const blocked = await buildAIReasoning(input, blueprint, contract, {
    enabled: true,
    provider: "groq",
    liveAllowed: false,
    providerRunner: runner,
  });
  assert.equal(blocked.status, "failed");
  assert.equal(blocked.failure?.code, "REASONING_LIVE_NOT_ENABLED");
  assert.equal(calls, 0);

  const malformed = await buildAIReasoning(input, blueprint, contract, {
    enabled: true,
    provider: "groq",
    liveAllowed: true,
    providerRunner: async () => success("groq", "malformed"),
  });
  assert.equal(malformed.status, "failed");
  assert.equal(malformed.failure?.code, "REASONING_SCHEMA_INVALID");

  let fallbackCalls = 0;
  const fallback = await buildAIReasoning(input, blueprint, contract, {
    enabled: true,
    provider: "groq",
    fallbackProvider: "mistral",
    liveAllowed: true,
    providerRunner: async (_system, _user, options) => {
      fallbackCalls += 1;
      if (options.provider === "groq") {
        return {
          success: false,
          data: null,
          error: "rate limited",
          failureCategory: "rate_limited",
          retryable: true,
          provenance: { ...provenance("groq"), failureCategory: "rate_limited", retryable: true },
        };
      }
      return success("mistral");
    },
  });
  assert.equal(fallback.status, "completed");
  assert.equal(fallback.provenance?.provider, "mistral");
  assert.equal(fallback.provenance?.fallbackFrom, "groq");
  assert.equal(fallback.provenance?.fallbackReason, "429");
  assert.equal(fallbackCalls, 2);

  console.log(JSON.stringify({ status: "PASS", assertions: 12, scenarios: 4, externalRequests: 0 }, null, 2));
}

void main();

import assert from "node:assert/strict";
import { buildAIStrategyProposal, type StrategyProviderRunner } from "../src/lib/ai-strategy-builder";
import type { BlueprintContractV3 } from "../src/lib/contracts/blueprint-contract-v3";

const fixtureName = "EX-002_b2b-leads.json";

const proposal = {
  strategic_summary: "Deterministic fallback proposal",
  message_angles: ["Trust-led lead qualification"],
  audience_hypotheses: ["High-intent business buyers"],
  experiment_ideas: ["Test qualification-led creative"],
  proposed_changes: ["Use a qualification-first message"],
  rejected_changes: [],
  limitations: ["This is a deterministic local regression fixture."],
};

function provenance(provider: "groq" | "mistral") {
  return {
    provider,
    model: provider === "groq" ? "openai/gpt-oss-120b" : "mistral-small-latest",
    endpoint: provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.mistral.ai/v1/chat/completions",
    structuredMode: provider === "groq" ? "strict_json_schema" : "json_schema",
    schemaHash: `${provider}-schema-hash`,
    promptVersion: "strategy-builder-v1",
    policyVersion: "cdks-governance-v1",
    dataPolicySnapshot: {
      trainingUse: "disallowed",
      retention: provider === "groq" ? "temporary" : "zero",
    },
  } as const;
}

const calls: Array<{ provider: string; fallbackFrom?: string; fallbackReason?: string }> = [];
const deterministicRunner: StrategyProviderRunner = async (_systemPrompt, _userPrompt, options) => {
  calls.push({
    provider: options.provider,
    fallbackFrom: options.fallbackFrom,
    fallbackReason: options.fallbackReason,
  });

  if (options.provider === "groq") {
    return {
      success: false,
      data: null,
      error: "AI provider request rate limit was exceeded.",
      failureCategory: "rate_limited",
      retryable: true,
      status: 429,
      failure: {
        category: "rate_limited",
        retryable: true,
        status: 429,
        errorCode: "rate_limit_exceeded",
        retryAfterMs: 60_000,
      },
      provenance: {
        ...provenance("groq"),
        failureCategory: "rate_limited",
        failureStatus: 429,
        failureCode: "rate_limit_exceeded",
        retryable: true,
        retryAfterMs: 60_000,
      },
    };
  }

  assert.equal(options.provider, "mistral");
  assert.equal(options.fallbackFrom, "groq");
  assert.equal(options.fallbackReason, "429");
  return {
    success: true,
    data: proposal,
    error: null,
    status: 200,
    provenance: {
      ...provenance("mistral"),
      retryable: false,
    },
  };
};

process.env.GROQ_API_KEY = "deterministic-groq-placeholder";
process.env.MISTRAL_API_KEY = "deterministic-mistral-placeholder";

const input = {
  business_type: "b2b",
  primary_objective: "leads",
  final_confirmed_inputs: false,
  ad_channels: ["meta"],
} as never;
const blueprint = {
  blueprint_id: "regression-fallback-429",
  strategy: { recommended_objective: "leads" },
} as never;
const contract = {
  locale: "en",
  currency: "USD",
  generation_mode: "blueprint_only",
  decisions: {
    objective: { value: "leads", authority: "DECISION_POLICY" },
    funnel: { value: "lead_gen_call", authority: "DECISION_POLICY" },
    channels: { value: ["meta"], authority: "DECISION_POLICY" },
  },
  readiness: { value: "blocked", authority: "READINESS_POLICY" },
  warnings: [],
  provenance: [{ source_ref: `fixture:${fixtureName}:input` }],
} as unknown as BlueprintContractV3;

async function main() {
  const trace = await buildAIStrategyProposal(input, blueprint, contract, {
    enabled: true,
    provider: "groq",
    fallbackProvider: "mistral",
    providerRunner: deterministicRunner,
  });

  assert.equal(calls.length, 2, "exactly primary and fallback provider calls are expected");
  assert.deepEqual(calls.map((call) => call.provider), ["groq", "mistral"]);
  assert.equal(trace.status, "completed");
  assert.equal(trace.model, "mistral-small-latest");
  assert.equal(trace.provenance?.provider, "mistral");
  assert.equal(trace.provenance?.fallbackFrom, "groq");
  assert.equal(trace.provenance?.fallbackReason, "429");
  assert.equal(trace.provenance?.failureCategory, undefined);
  assert.equal(trace.authority, "AI_STRATEGY_BUILDER");
  assert.equal(contract.generation_mode, "blueprint_only");
  assert.equal(contract.decisions.objective.authority, "DECISION_POLICY");
  assert.equal(contract.readiness.authority, "READINESS_POLICY");

  console.log("provider fallback regression: PASS 429 -> Mistral, provenance, and CDKS safety preserved");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});

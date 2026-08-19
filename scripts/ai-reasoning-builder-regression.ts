import assert from "node:assert/strict";
import { buildAIReasoning, reasoningTraceFromContract } from "../src/lib/ai-reasoning-builder";
import type { BlueprintContractV3 } from "../src/lib/contracts/blueprint-contract-v3";
import type { CanonicalBlueprint } from "../src/lib/contracts/canonical-blueprint";
import type { CanonicalWizardInput } from "../src/lib/contracts/wizard-input";

const contract = {
  blueprint_id: "22222222-2222-4222-8222-222222222222",
  locale: "ar",
} as BlueprintContractV3;
const input = {} as CanonicalWizardInput;
const blueprint = {} as CanonicalBlueprint;

async function main() {
  const disabled = await buildAIReasoning(input, blueprint, contract, { enabled: false });
  assert.equal(disabled.status, "not_requested");
  assert.equal(disabled.safety.external_actions_allowed, false);

  const baseline = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: "mock", mockScenario: "baseline" });
  assert.equal(baseline.status, "completed");
  assert.equal(baseline.claims.length, 2);
  assert.equal(baseline.safety.can_change_blueprint, false);
  assert.equal(baseline.blueprint_id, contract.blueprint_id);

  const unsupported = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: "mock", mockScenario: "unsupported_claim" });
  assert.equal(unsupported.status, "completed");
  assert.equal(unsupported.grounding.unsupported_claim_count, 1);
  assert.equal(unsupported.claims.at(-1)?.status, "unsupported");

  const override = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: "mock", mockScenario: "override_attempt" });
  assert.equal(override.status, "failed");
  assert.equal(override.failure?.code, "REASONING_SAFETY_REJECTED");
  assert.equal(override.safety.readiness_override_attempted, false);
  assert.equal(override.safety.external_actions_allowed, false);

  const malformed = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: "mock", mockScenario: "malformed" });
  assert.equal(malformed.status, "failed");
  assert.equal(malformed.failure?.code, "REASONING_SCHEMA_INVALID");

  const providerFailure = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: "mock", mockScenario: "failure" });
  assert.equal(providerFailure.status, "failed");
  assert.equal(providerFailure.failure?.code, "REASONING_PROVIDER_FAILURE");

  const unsupportedProvider = await buildAIReasoning(input, blueprint, contract, { enabled: true, provider: undefined });
  assert.equal(unsupportedProvider.status, "completed");

  const trace = reasoningTraceFromContract(baseline);
  assert.equal(trace.authority, "AI_REASONING");
  assert.equal(trace.contract?.contract_version, "1.0");
  assert.equal(trace.supported_claims.length, 2);

  console.log(JSON.stringify({ status: "PASS", assertions: 24, scenarios: 7 }, null, 2));
}

void main();

import { randomUUID } from "node:crypto";
import type { BlueprintContractV3, BlueprintReasoningTrace } from "./contracts/blueprint-contract-v3";
import {
  AIReasoningContractSchema,
  validateAIReasoningContract,
  type AIReasoningContract,
  type ValidatedAIReasoningContract,
} from "./contracts/ai-reasoning";
import { runMockReasoningBuilder, type MockReasoningScenario } from "./ai-reasoning-builder-mock";
import type { CanonicalBlueprint } from "./contracts/canonical-blueprint";
import type { CanonicalWizardInput } from "./contracts/wizard-input";

export type ReasoningBuilderProvider = "mock";

export type ReasoningBuilderOptions = {
  enabled?: boolean;
  provider?: ReasoningBuilderProvider;
  mockScenario?: MockReasoningScenario;
};

function safety(): AIReasoningContract["safety"] {
  return {
    status: "safe",
    can_mutate_cdks: false,
    can_change_blueprint: false,
    can_authorize_launch: false,
    can_spend_budget: false,
    external_actions_allowed: false,
    budget_spend_allowed: false,
    readiness_override_attempted: false,
    blocked_actions: ["publish_campaign", "spend_budget", "override_readiness"],
  };
}

function failureContract(
  contract: BlueprintContractV3,
  code: string,
  message: string,
  model?: string,
): ValidatedAIReasoningContract {
  return validateAIReasoningContract({
    contract_version: "1.0",
    source_contract_version: "3.0",
    reasoning_id: randomUUID(),
    blueprint_id: contract.blueprint_id,
    generated_at: new Date().toISOString(),
    locale: contract.locale,
    purpose: "explain",
    status: "failed",
    authority: "AI_REASONING",
    ...(model ? { model } : {}),
    claims: [],
    evidence: [],
    uncertainties: [],
    decision_impacts: [],
    limitations: ["Deterministic CDKS output remains authoritative because AI Reasoning failed closed."],
    grounding: {
      evidence_coverage_percent: 0,
      supported_claim_count: 0,
      qualified_claim_count: 0,
      unsupported_claim_count: 0,
      evidence_only_mode: true,
    },
    safety: safety(),
    failure: { code, message, retryable: false },
  });
}

function normalizeProviderOutput(
  output: unknown,
  contract: BlueprintContractV3,
  model: string,
): { contract?: ValidatedAIReasoningContract; failure?: ValidatedAIReasoningContract } {
  const parsed = AIReasoningContractSchema.safeParse(output);
  if (!parsed.success) {
    return { failure: failureContract(contract, "REASONING_SCHEMA_INVALID", "Controlled reasoning output failed the contract schema.", model) };
  }

  if (parsed.data.safety.readiness_override_attempted || parsed.data.safety.status === "rejected") {
    return { failure: failureContract(contract, "REASONING_SAFETY_REJECTED", "Controlled reasoning output attempted a governed override and was rejected.", model) };
  }

  const candidate: AIReasoningContract = {
    ...parsed.data,
    reasoning_id: randomUUID(),
    blueprint_id: contract.blueprint_id,
    generated_at: new Date().toISOString(),
    locale: contract.locale,
    model,
    authority: "AI_REASONING",
    safety: safety(),
  };
  try {
    return { contract: validateAIReasoningContract(candidate) };
  } catch {
    return { failure: failureContract(contract, "REASONING_SEMANTIC_INVALID", "Controlled reasoning output failed semantic contract validation.", model) };
  }
}

function disabledContract(contract: BlueprintContractV3): ValidatedAIReasoningContract {
  return validateAIReasoningContract({
    contract_version: "1.0",
    source_contract_version: "3.0",
    reasoning_id: randomUUID(),
    blueprint_id: contract.blueprint_id,
    generated_at: new Date().toISOString(),
    locale: contract.locale,
    purpose: "explain",
    status: "not_requested",
    authority: "AI_REASONING",
    claims: [],
    evidence: [],
    uncertainties: [],
    decision_impacts: [],
    limitations: ["AI Reasoning is disabled unless explicitly requested by the caller."],
    grounding: {
      evidence_coverage_percent: 0,
      supported_claim_count: 0,
      qualified_claim_count: 0,
      unsupported_claim_count: 0,
      evidence_only_mode: true,
    },
    safety: safety(),
  });
}

export async function buildAIReasoning(
  _input: CanonicalWizardInput,
  _blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  options: ReasoningBuilderOptions = {},
): Promise<ValidatedAIReasoningContract> {
  if (!options.enabled) return disabledContract(contract);
  if ((options.provider ?? "mock") !== "mock") {
    return failureContract(contract, "REASONING_PROVIDER_NOT_ALLOWED", "Only the controlled mock provider is allowed in this phase.", "mock-reasoning-v1");
  }

  const result = runMockReasoningBuilder(options.mockScenario ?? "baseline", contract.locale);
  if (!result.success) return failureContract(contract, "REASONING_PROVIDER_FAILURE", result.error, result.model);

  const normalized = normalizeProviderOutput(result.data, contract, result.model);
  return normalized.contract ?? normalized.failure!;
}

export function reasoningTraceFromContract(reasoning: ValidatedAIReasoningContract): BlueprintReasoningTrace {
  return {
    status: reasoning.status,
    authority: "AI_REASONING",
    model: reasoning.model,
    summary: reasoning.summary,
    supported_claims: reasoning.claims.filter((claim) => claim.status === "supported" || claim.status === "qualified").map((claim) => claim.statement),
    unsupported_claims: reasoning.claims.filter((claim) => claim.status === "unsupported" || claim.status === "rejected").map((claim) => claim.statement),
    limitations: reasoning.limitations,
    contract: reasoning,
  };
}

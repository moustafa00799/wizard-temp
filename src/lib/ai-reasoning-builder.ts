import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { BlueprintContractV3, BlueprintReasoningTrace } from "./contracts/blueprint-contract-v3";
import {
  AIReasoningContractSchema,
  validateAIReasoningContract,
  type AIReasoningContract,
  type ValidatedAIReasoningContract,
} from "./contracts/ai-reasoning";
import { runMockReasoningBuilder, type MockReasoningScenario } from "./ai-reasoning-builder-mock";
import {
  getReasoningProviderModel,
  runReasoningProvider,
  type ReasoningProviderName,
  type ReasoningProviderResult,
} from "./ai-reasoning-provider";
import type { CanonicalBlueprint } from "./contracts/canonical-blueprint";
import type { CanonicalWizardInput } from "./contracts/wizard-input";
import type { ScopedStrategyContext } from "./contracts/knowledge-strategy-context";
import { sanitizeUnknownForAI } from "./ai-sanitizer";
import { buildAIKnowledgeGuardrails } from "./knowledge/knowledge-gap-closure";

export type ReasoningBuilderProvider = ReasoningProviderName | "mock";
export type ReasoningProviderRunner = typeof runReasoningProvider;

export type ReasoningBuilderOptions = {
  enabled?: boolean;
  provider?: ReasoningBuilderProvider;
  model?: string;
  fallbackProvider?: ReasoningProviderName;
  /** Client opt-in is accepted only when the server explicitly enables live non-production mode. */
  liveAllowed?: boolean;
  mockScenario?: MockReasoningScenario;
  /** Test-only seam; live calls use the governed provider runner. */
  providerRunner?: ReasoningProviderRunner;
  /** Optional, validated, market-and-industry scoped evidence context. */
  knowledgeContext?: ScopedStrategyContext;
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
  provenance?: AIReasoningContract["provenance"],
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
    ...(provenance ? { provenance } : {}),
    failure: { code, message, retryable: false },
  });
}

const AIReasoningProviderOutputSchema = AIReasoningContractSchema
  .omit({
    reasoning_id: true,
    blueprint_id: true,
    generated_at: true,
    authority: true,
    model: true,
    safety: true,
    provenance: true,
    failure: true,
  })
  .extend({ status: z.literal("completed") });

function normalizeControlledOutput(
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

function normalizeProviderOutput(
  output: unknown,
  contract: BlueprintContractV3,
  model: string,
): { contract?: ValidatedAIReasoningContract; failure?: ValidatedAIReasoningContract } {
  const parsed = AIReasoningProviderOutputSchema.safeParse(output);
  if (!parsed.success) {
    return { failure: failureContract(contract, "REASONING_SCHEMA_INVALID", "AI Reasoning provider output failed the provider schema.", model) };
  }

  const derivedCounts = parsed.data.claims.reduce((result, claim) => {
    if (claim.status === "supported") result.supported += 1;
    if (claim.status === "qualified") result.qualified += 1;
    if (claim.status === "unsupported" || claim.status === "rejected") result.unsupported += 1;
    return result;
  }, { supported: 0, qualified: 0, unsupported: 0 });
  const providerData = {
    ...parsed.data,
    grounding: {
      ...parsed.data.grounding,
      supported_claim_count: derivedCounts.supported,
      qualified_claim_count: derivedCounts.qualified,
      unsupported_claim_count: derivedCounts.unsupported,
    },
  };
  const candidate: AIReasoningContract = {
    ...providerData,
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
    return { failure: failureContract(contract, "REASONING_SEMANTIC_INVALID", "AI Reasoning provider output failed semantic contract validation.", model) };
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

function reasoningPrompt(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  knowledgeContext?: ScopedStrategyContext,
): { system: string; user: string } {
  return {
    system: `You are the governed AI Reasoning layer inside a campaign-planning system.
Return JSON only and follow the supplied AI Reasoning Contract schema.
Explain CDKS decisions; do not replace, challenge, or mutate them.
All decision_impacts.changed values must be false.
Use only the supplied evidence IDs. If a statement cannot be supported, mark it qualified or unsupported and include an uncertainty.
Never authorize launch, change budget, publish a campaign, call an advertising platform, or claim market validation.
Use the requested locale and keep the output concise.`,
    user: JSON.stringify(sanitizeUnknownForAI({
      locale: contract.locale,
      wizard_input: input,
      cdks_authority: {
        blueprint_id: contract.blueprint_id,
        decisions: contract.decisions,
        readiness: contract.readiness,
        warnings: contract.warnings,
      },
      canonical_blueprint: {
        blueprint_id: blueprint.blueprint_id,
        strategy: blueprint.strategy,
      },
      knowledge_context: knowledgeContext ?? null,
      knowledge_gap_guardrails: buildAIKnowledgeGuardrails(),
      available_evidence: [
        {
          id: "evidence-wizard-input",
          kind: "wizard_input",
          path: "wizard_input",
          source_ref: "wizard:input:sanitized",
          authority: "WIZARD_INPUT",
          user_confirmed: (contract.provenance ?? []).some((entry) => entry.source_ref.startsWith("fixture:")) ? true : false,
          relevance: "primary",
          limitations: ["تم إرسال نسخة منقحة فقط إلى مزود AI."],
        },
        {
          id: "evidence-objective",
          kind: "cdks_decision",
          path: "decisions.objective.value",
          source_ref: "cdks:decisions.objective",
          authority: "DECISION_POLICY",
          user_confirmed: true,
          relevance: "primary",
          limitations: [],
        },
        {
          id: "evidence-funnel",
          kind: "cdks_decision",
          path: "decisions.funnel.value",
          source_ref: "cdks:decisions.funnel",
          authority: "DECISION_POLICY",
          user_confirmed: false,
          relevance: "supporting",
          limitations: [],
        },
        {
          id: "evidence-readiness",
          kind: "rule_output",
          path: "readiness.value",
          source_ref: "cdks:readiness",
          authority: "READINESS_POLICY",
          user_confirmed: false,
          relevance: "primary",
          limitations: ["الجاهزية ليست إذن إطلاق."],
        },
      ],
      safety: {
        generation_mode: "blueprint_only",
        external_actions_allowed: false,
        budget_spend_allowed: false,
      },
    })),
  };
}

const ALLOWED_REASONING_EVIDENCE_IDS = new Set([
  "evidence-wizard-input",
  "evidence-objective",
  "evidence-funnel",
  "evidence-readiness",
]);
const ALLOWED_REASONING_DECISION_REFS = new Set([
  "decisions.objective",
  "decisions.funnel",
  "decisions.channels",
  "readiness",
]);

function normalizeLiveOutput(
  output: unknown,
  contract: BlueprintContractV3,
  model: string,
  provenance: NonNullable<ValidatedAIReasoningContract["provenance"]>,
): { contract?: ValidatedAIReasoningContract; failure?: ValidatedAIReasoningContract } {
  const normalized = normalizeProviderOutput(output, contract, model);
  if (!normalized.contract) return normalized;

  const unknownEvidence = normalized.contract.evidence.some((item) => !ALLOWED_REASONING_EVIDENCE_IDS.has(item.id));
  const unknownClaimEvidence = normalized.contract.claims.some((claim) => claim.evidence_refs.some((ref) => !ALLOWED_REASONING_EVIDENCE_IDS.has(ref)));
  const unknownDecisionRefs = normalized.contract.claims.some((claim) => claim.decision_refs.some((ref) => !ALLOWED_REASONING_DECISION_REFS.has(ref)))
    || normalized.contract.decision_impacts.some((impact) => !ALLOWED_REASONING_DECISION_REFS.has(impact.decision_ref));
  if (unknownEvidence || unknownClaimEvidence || unknownDecisionRefs) {
    return { failure: failureContract(contract, "REASONING_EVIDENCE_OUT_OF_SCOPE", "Live AI Reasoning referenced evidence or decisions outside the server-approved scope.", model, provenance) };
  }

  return {
    contract: validateAIReasoningContract({
      ...normalized.contract,
      evidence: normalized.contract.evidence,
      grounding: { ...normalized.contract.grounding, evidence_only_mode: true },
      provenance,
    }),
  };
}

export async function buildAIReasoning(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  options: ReasoningBuilderOptions = {},
): Promise<ValidatedAIReasoningContract> {
  if (!options.enabled) return disabledContract(contract);

  const provider = options.provider ?? "mock";
  if (provider === "mock") {
    const result = runMockReasoningBuilder(options.mockScenario ?? "baseline", contract.locale);
    if (!result.success) return failureContract(contract, "REASONING_PROVIDER_FAILURE", result.error, result.model);

    const normalized = normalizeControlledOutput(result.data, contract, result.model);
    return normalized.contract ?? normalized.failure!;
  }

  if (options.liveAllowed === false) {
    const model = getReasoningProviderModel(provider, options.model);
    return failureContract(contract, "REASONING_LIVE_NOT_ENABLED", "Live AI Reasoning is unavailable until the server enables non-production AI mode.", model);
  }
  if (options.liveAllowed === true && process.env.AI_DATA_POLICY !== "sanitized_wizard_only") {
    const model = getReasoningProviderModel(provider, options.model);
    return failureContract(contract, "REASONING_DATA_POLICY_NOT_ALLOWED", "Live client AI requires AI_DATA_POLICY=sanitized_wizard_only.", model);
  }

  const model = getReasoningProviderModel(provider, options.model);
  const prompts = reasoningPrompt(input, blueprint, contract, options.knowledgeContext);
  const runner = options.providerRunner ?? runReasoningProvider;
  const primary = await runner(prompts.system, prompts.user, { provider, model });
  let result: ReasoningProviderResult = primary;

  const fallbackProvider = options.fallbackProvider ?? (provider === "groq" ? "mistral" : undefined);
  if (!primary.success && primary.retryable && fallbackProvider && fallbackProvider !== provider) {
    const fallbackReason = primary.failureCategory === "timeout"
      ? "timeout"
      : primary.failureCategory === "rate_limited"
        ? "429"
        : primary.failureCategory === "server"
          ? "5xx"
          : primary.failureCategory === "network"
            ? "network"
            : "provider_unavailable";
    const fallback = await runner(prompts.system, prompts.user, {
      provider: fallbackProvider,
      fallbackFrom: provider,
      fallbackReason,
    });
    result = {
      ...fallback,
      provenance: {
        ...fallback.provenance,
        fallbackFrom: provider,
        fallbackReason,
      },
    };
  }

  if (!result.success || !result.data) {
    return failureContract(
      contract,
      `REASONING_PROVIDER_${(result.failureCategory ?? "FAILURE").toUpperCase()}`,
      result.error ?? "AI Reasoning provider returned no usable output.",
      result.provenance.model,
      result.provenance,
    );
  }

  const normalized = normalizeLiveOutput(result.data, contract, result.provenance.model, result.provenance);
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

import { z } from "zod";
import {
  runStrategyProvider,
  isStrategyProviderConfigured,
  getStrategyProviderModel,
  type StrategyProviderName,
} from "./ai-strategy-provider";
import { runMockStrategyBuilder } from "./ai-strategy-builder-mock";
import type { MockStrategyScenario } from "./ai-strategy-builder-mock";
import type { CanonicalWizardInput } from "./contracts/wizard-input";
import type { CanonicalBlueprint } from "./contracts/canonical-blueprint";
import type {
  BlueprintStrategyTrace,
  BlueprintContractV3,
} from "./contracts/blueprint-contract-v3";
import type { ScopedStrategyContext } from "./contracts/knowledge-strategy-context";

const StrategyProposalSchema = z.object({
  strategic_summary: z.string().min(1),
  message_angles: z.array(z.string()).max(8),
  audience_hypotheses: z.array(z.string()).max(8),
  experiment_ideas: z.array(z.string()).max(8),
  proposed_changes: z.array(z.string()).max(12),
  rejected_changes: z.array(z.string()).max(12),
  limitations: z.array(z.string()).max(12),
});

type StrategyProposal = z.infer<typeof StrategyProposalSchema>;

export type StrategyBuilderProvider = StrategyProviderName | "mock";

export type StrategyProviderRunner = typeof runStrategyProvider;

export type StrategyBuilderOptions = {
  enabled?: boolean;
  model?: string;
  provider?: StrategyBuilderProvider;
  mockScenario?: MockStrategyScenario;
  fallbackProvider?: StrategyProviderName;
  benchmark?: boolean;
  /** Test-only seam; production routes use the real provider runner. */
  providerRunner?: StrategyProviderRunner;
  /** Optional, validated, market-and-industry scoped evidence context. */
  knowledgeContext?: ScopedStrategyContext;
};

const FORBIDDEN_OVERRIDE_TERMS = [
  "objective",
  "funnel",
  "channel",
  "readiness",
  "launch",
  "budget",
  "spend",
  "publish",
  "campaign",
  "الهدف",
  "القمع",
  "القنوات",
  "الجاهزية",
  "الميزانية",
  "الإنفاق",
  "انشر",
  "الحملة",
];

function proposalPrompt(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  knowledgeContext?: ScopedStrategyContext,
): { system: string; user: string } {
  return {
    system: `You are the AI Strategy Builder inside a governed campaign-planning system.
Return JSON only with exactly these keys:
strategic_summary, message_angles, audience_hypotheses, experiment_ideas, proposed_changes, rejected_changes, limitations.
You are a proposal layer, not a decision authority. CDKS remains authoritative.
You MUST NOT change, replace, or reinterpret objective, funnel, channels, budget, readiness, launch status, or any external action.
Do not publish campaigns, call advertising platforms, spend money, or claim that a campaign is ready.
All proposals must be grounded in the supplied Wizard input and CDKS decisions. If data is missing or unconfirmed, state the limitation.
When a scoped Knowledge context is supplied, use only its exact market/industry scope, cite its evidence IDs or source IDs, preserve its limitations, and never turn account-owned data into a market benchmark.
Never invent CPC, CPA, CVR, ROAS, saturation, competitor-performance, or offer-level demand benchmarks when the context marks them unavailable. Never claim that the overall system is Market-Validated.
Write all text in the requested locale. Keep proposed changes actionable but non-binding.`,
    user: JSON.stringify({
      locale: contract.locale,
      currency: contract.currency,
      wizard_input: input,
      cdks_authority: {
        objective: contract.decisions.objective,
        funnel: contract.decisions.funnel,
        channels: contract.decisions.channels,
        readiness: contract.readiness,
        warnings: contract.warnings,
      },
      canonical_blueprint: {
        blueprint_id: blueprint.blueprint_id,
        strategy: blueprint.strategy,
      },
      knowledge_context: knowledgeContext ?? null,
      safety: {
        generation_mode: "blueprint_only",
        external_actions_allowed: false,
        budget_spend_allowed: false,
      },
    }),
  };
}

function sanitizeProposal(proposal: StrategyProposal): StrategyProposal {
  const rejected = [...proposal.rejected_changes];
  const safeProposed = proposal.proposed_changes.filter((change) => {
    const normalized = change.toLowerCase();
    const attemptsOverride = FORBIDDEN_OVERRIDE_TERMS.some((term) => normalized.includes(term));
    if (attemptsOverride) rejected.push(`Rejected governed override attempt: ${change}`);
    return !attemptsOverride;
  });
  return {
    ...proposal,
    proposed_changes: safeProposed,
    rejected_changes: [...new Set(rejected)],
  };
}

function knowledgeLimitations(context?: ScopedStrategyContext): string[] {
  if (!context) return [];
  return [
    `Scoped Knowledge context ${context.contextId} was supplied for ${context.market}/${context.industry}.`,
    `Scoped validation status: ${context.scopedValidationStatus}; globalMarketValidated remains false.`,
    ...context.limitations.slice(0, 4),
  ];
}

function traceFromProposal(
  proposal: StrategyProposal,
  model: string,
  provenance?: BlueprintStrategyTrace["provenance"],
  knowledgeContext?: ScopedStrategyContext,
): BlueprintStrategyTrace {
  const safe = sanitizeProposal(proposal);
  return {
    status: "completed",
    authority: "AI_STRATEGY_BUILDER",
    model,
    proposed_changes: [
      safe.strategic_summary,
      ...safe.message_angles.map((value) => `Message angle: ${value}`),
      ...safe.audience_hypotheses.map((value) => `Audience hypothesis: ${value}`),
      ...safe.experiment_ideas.map((value) => `Experiment: ${value}`),
      ...safe.proposed_changes,
    ],
    accepted_changes: [
      ...safe.message_angles.map((value) => `Message angle: ${value}`),
      ...safe.audience_hypotheses.map((value) => `Audience hypothesis: ${value}`),
      ...safe.experiment_ideas.map((value) => `Experiment: ${value}`),
    ],
    rejected_changes: safe.rejected_changes,
    provenance,
    limitations: [
      ...safe.limitations,
      ...knowledgeLimitations(knowledgeContext),
      "AI output is advisory and does not mutate CDKS decisions or the canonical Blueprint.",
      "AI output is not a launch authorization and cannot trigger external actions.",
    ],
  };
}

function disabledTrace(
  reason: string,
  model?: string,
  provenance?: BlueprintStrategyTrace["provenance"],
  knowledgeContext?: ScopedStrategyContext,
): BlueprintStrategyTrace {
  return {
    status: "not_requested",
    authority: "AI_STRATEGY_BUILDER",
    model,
    proposed_changes: [],
    accepted_changes: [],
    rejected_changes: [],
    limitations: [reason, ...knowledgeLimitations(knowledgeContext)],
  };
}

export async function buildAIStrategyProposal(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  options: StrategyBuilderOptions = {},
): Promise<BlueprintStrategyTrace> {
  if (!options.enabled) {
    return disabledTrace("AI Strategy Builder is disabled unless explicitly requested by the caller.", undefined, undefined, options.knowledgeContext);
  }

  const configuredProvider = process.env.AI_STRATEGY_PROVIDER;
  const provider: StrategyBuilderProvider = options.provider
    ?? (configuredProvider === "mistral" || configuredProvider === "gemini" || configuredProvider === "mock" ? configuredProvider : "groq");
  const locale = contract.locale.startsWith("en") ? "en" : "ar";

  if (provider === "mock") {
    const result = runMockStrategyBuilder(options.mockScenario ?? "baseline", locale);
    if (!result.success || !result.data) {
      return {
        ...disabledTrace(result.error ?? "Controlled mock provider returned no usable proposal.", result.model, undefined, options.knowledgeContext),
        status: "failed",
        model: result.model,
      };
    }

    const parsed = StrategyProposalSchema.safeParse(result.data);
    if (!parsed.success) {
      return {
        ...disabledTrace("Controlled mock provider returned an invalid proposal fixture.", result.model, undefined, options.knowledgeContext),
        status: "failed",
        model: result.model,
      };
    }

    return traceFromProposal(parsed.data, result.model, undefined, options.knowledgeContext);
  }

  const isAnonymizedFixture = contract.provenance.some((entry) => entry.source_ref.startsWith("fixture:"));
  const providerMode = process.env.AI_PROVIDER_MODE;
  const dataPolicy = process.env.AI_DATA_POLICY;

  if (providerMode && providerMode !== "nonprod") {
    return {
      ...disabledTrace("Only AI_PROVIDER_MODE=nonprod is allowed in this phase.", undefined, undefined, options.knowledgeContext),
      status: "failed",
    };
  }
  if (dataPolicy === "anonymized_fixtures_only" && !isAnonymizedFixture) {
    return {
      ...disabledTrace("AI_DATA_POLICY permits anonymized fixtures only; this request was not identified as a fixture.", undefined, undefined, options.knowledgeContext),
      status: "failed",
    };
  }
  if (provider === "gemini" && (process.env.AI_BENCHMARK_ENABLED !== "true" || !options.benchmark || !isAnonymizedFixture)) {
    return {
      ...disabledTrace("Gemini is benchmark-only and requires an anonymized fixture request.", undefined, undefined, options.knowledgeContext),
      status: "failed",
    };
  }

  const model = getStrategyProviderModel(provider, options.model);
  if (!isStrategyProviderConfigured(provider)) {
    return {
      ...disabledTrace(`${provider} provider is not configured; deterministic CDKS output remains authoritative.`, model, undefined, options.knowledgeContext),
      status: "failed",
      model,
    };
  }

  const prompts = proposalPrompt(input, blueprint, contract, options.knowledgeContext);
  const providerRunner = options.providerRunner ?? runStrategyProvider;
  const primary = await providerRunner(prompts.system, prompts.user, {
    provider,
    model,
  });
  let result = primary;

  const fallbackProvider = options.benchmark
    ? undefined
    : options.fallbackProvider
      ?? (process.env.AI_STRATEGY_FALLBACK_PROVIDER === "mistral" || process.env.AI_STRATEGY_FALLBACK_PROVIDER === "gemini"
        ? process.env.AI_STRATEGY_FALLBACK_PROVIDER
        : provider === "groq" ? "mistral" : undefined);

  if (!primary.success && primary.retryable && fallbackProvider && fallbackProvider !== provider) {
    const fallbackReason = primary.failureCategory === "timeout"
      ? "timeout"
      : primary.failureCategory === "rate_limited" || primary.failureCategory === "quota"
        ? "429"
        : primary.failureCategory === "server"
          ? "5xx"
          : primary.failureCategory === "network"
            ? "network"
            : "provider_unavailable";
    const fallback = await providerRunner(prompts.system, prompts.user, {
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
    return {
      ...disabledTrace(result.error ?? "AI Strategy Builder returned no usable proposal.", result.provenance.model, result.provenance, options.knowledgeContext),
      status: "failed",
      model: result.provenance.model,
    };
  }

  const parsed = StrategyProposalSchema.safeParse(result.data);
  if (!parsed.success) {
    return {
      ...disabledTrace("AI Strategy Builder output failed the proposal schema validation.", result.provenance.model, result.provenance, options.knowledgeContext),
      status: "failed",
      model: result.provenance.model,
    };
  }

  return traceFromProposal(parsed.data, result.provenance.model, result.provenance, options.knowledgeContext);
}

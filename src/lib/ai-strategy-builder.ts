import { z } from "zod";
import { generatePhase, isAIConfigured, getAIModelInfo } from "./ai-client";
import type { CanonicalWizardInput } from "./contracts/wizard-input";
import type { CanonicalBlueprint } from "./contracts/canonical-blueprint";
import type {
  BlueprintStrategyTrace,
  BlueprintContractV3,
} from "./contracts/blueprint-contract-v3";

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

type StrategyBuilderOptions = {
  enabled?: boolean;
  model?: string;
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
];

function proposalPrompt(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
): { system: string; user: string } {
  return {
    system: `You are the AI Strategy Builder inside a governed campaign-planning system.
Return JSON only with exactly these keys:
strategic_summary, message_angles, audience_hypotheses, experiment_ideas, proposed_changes, rejected_changes, limitations.
You are a proposal layer, not a decision authority. CDKS remains authoritative.
You MUST NOT change, replace, or reinterpret objective, funnel, channels, budget, readiness, launch status, or any external action.
Do not publish campaigns, call advertising platforms, spend money, or claim that a campaign is ready.
All proposals must be grounded in the supplied Wizard input and CDKS decisions. If data is missing or unconfirmed, state the limitation.
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

function traceFromProposal(
  proposal: StrategyProposal,
  model: string,
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
    limitations: [
      ...safe.limitations,
      "AI output is advisory and does not mutate CDKS decisions or the canonical Blueprint.",
      "AI output is not a launch authorization and cannot trigger external actions.",
    ],
  };
}

function disabledTrace(reason: string): BlueprintStrategyTrace {
  return {
    status: "not_requested",
    authority: "AI_STRATEGY_BUILDER",
    proposed_changes: [],
    accepted_changes: [],
    rejected_changes: [],
    limitations: [reason],
  };
}

export async function buildAIStrategyProposal(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  contract: BlueprintContractV3,
  options: StrategyBuilderOptions = {},
): Promise<BlueprintStrategyTrace> {
  if (!options.enabled) {
    return disabledTrace("AI Strategy Builder is disabled unless explicitly requested by the caller.");
  }

  if (!isAIConfigured()) {
    return {
      ...disabledTrace("AI provider is not configured; deterministic CDKS output remains authoritative."),
      status: "failed",
      model: options.model ?? getAIModelInfo().primaryModel,
    };
  }

  const prompts = proposalPrompt(input, blueprint, contract);
  const result = await generatePhase(1, prompts.system, prompts.user, {
    model: options.model,
    timeoutMs: 15000,
    retries: 1,
  });

  if (!result.success || !result.data) {
    return {
      ...disabledTrace(result.error ?? "AI Strategy Builder returned no usable proposal."),
      status: "failed",
      model: options.model ?? getAIModelInfo().primaryModel,
    };
  }

  const parsed = StrategyProposalSchema.safeParse(result.data);
  if (!parsed.success) {
    return {
      ...disabledTrace("AI Strategy Builder output failed the proposal schema validation."),
      status: "failed",
      model: options.model ?? getAIModelInfo().primaryModel,
    };
  }

  return traceFromProposal(parsed.data, options.model ?? getAIModelInfo().primaryModel);
}

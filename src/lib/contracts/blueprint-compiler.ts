import { generateBlueprint } from "@/lib/blueprint-engine";
import type { RichBlueprintData } from "@/lib/blueprint-types";
import type { CanonicalWizardInput } from "./wizard-input";
import type { StrategyDecision } from "./strategy-ai";
import type { ExecutionDecision, RulesDecision } from "./execution-ai";
import { EXECUTION_MODEL, STRATEGY_MODEL } from "./groq-structured-provider";

export interface BlueprintCompilerInput {
  canonical: CanonicalWizardInput;
  strategy: StrategyDecision;
  execution: ExecutionDecision;
  rules: RulesDecision;
}

/**
 * Deterministic boundary between accepted decisions and the final blueprint.
 * No AI calls, fallback generation, or provider concerns belong here.
 *
 * The deterministic rule blueprint remains the compatibility/base shape.
 * Accepted Strategy and Execution decisions are then projected into the
 * corresponding rich sections. This prevents the v4 pipeline from appearing
 * successful while silently rendering a rules-only blueprint.
 *
 * Governance rules at this boundary are intentionally limited to hard
 * validation/derived safety signals. They do not invent a replacement strategy.
 */
export function compileBlueprint(input: BlueprintCompilerInput): RichBlueprintData {
  const deterministic = generateBlueprint(input.canonical);
  const { strategy, execution, rules } = input;

  const strategyReasoning = strategy.reasoning;
  const executionReasoning = execution.reasoning;

  const strategySummary = {
    ...deterministic.strategy_summary,
    recommended_objective: {
      ...deterministic.strategy_summary.recommended_objective,
      value: strategy.recommended_objective,
      confidence: strategy.confidence,
      reasoning: strategyReasoning,
      rule_id: "ai-strategy-v1",
    },
    recommended_channels: {
      ...deterministic.strategy_summary.recommended_channels,
      value: [
        ...strategy.channel_strategy.primary_channels,
        ...strategy.channel_strategy.supporting_channels,
      ],
      confidence: strategy.confidence,
      reasoning: strategy.channel_strategy.rationale,
      rule_id: "ai-strategy-v1",
    },
    funnel_type: {
      ...deterministic.strategy_summary.funnel_type,
      value: strategy.funnel_strategy.model,
      stages: strategy.funnel_strategy.stages,
      confidence: strategy.confidence,
      reasoning: strategy.funnel_strategy.conversion_path,
      rule_id: "ai-strategy-v1",
    },
    confidence_score: {
      ...deterministic.strategy_summary.confidence_score,
      value: strategy.confidence,
      confidence: strategy.confidence,
      reasoning: strategyReasoning,
      rule_id: "ai-strategy-v1",
    },
  };

  const recommendedFunnel = {
    ...deterministic.recommended_funnel,
    funnel_type: strategy.funnel_strategy.model,
    stages: deterministic.recommended_funnel.stages.map((stage, index) => ({
      ...stage,
      name: strategy.funnel_strategy.stages[index] ?? stage.name,
    })),
    total_stages:
      strategy.funnel_strategy.stages.length ||
      deterministic.recommended_funnel.total_stages,
  };

  const campaignBase = deterministic.campaign_structure.campaigns;
  const aiCampaigns = execution.campaign_structure.campaigns;
  const campaignCount = Math.max(campaignBase.length, aiCampaigns.length);
  const campaigns = Array.from({ length: campaignCount }, (_, index) => {
    const base = campaignBase[index];
    const ai = aiCampaigns[index];
    if (!ai && base) return base;
    return {
      ...(base ?? {
        id: `ai-campaign-${index + 1}`,
        name: ai?.name ?? `Campaign ${index + 1}`,
        objective: ai?.objective ?? input.canonical.primary_objective,
        platform: ai?.channel ?? "",
        budget_share: 0,
        ad_sets: 0,
        creatives_per_ad_set: 0,
      }),
      ...(ai
        ? {
            name: ai.name,
            objective: ai.objective,
            platform: ai.channel,
          }
        : {}),
    };
  });

  const campaignStructure = {
    ...deterministic.campaign_structure,
    campaign_count: campaigns.length,
    campaigns,
  };

  const audienceSegments = execution.audience_structure.primary_segments.map(
    (segment) => ({
      name: segment,
      description: segment,
    })
  );

  const audienceStructure = {
    ...deterministic.audience_structure,
    primary_audience: {
      ...deterministic.audience_structure.primary_audience,
      name: strategy.target_customer.primary,
      description: strategy.target_customer.primary,
      targeting_type: strategy.target_customer.awareness_level,
    },
    segments:
      audienceSegments.length > 0
        ? audienceSegments
        : deterministic.audience_structure.segments,
    exclusions: execution.audience_structure.exclusions,
  };

  const budgetPlan = execution.budget_plan;
  const deterministicDaily = deterministic.budget_split.daily_budget;
  const budgetSplit = {
    ...deterministic.budget_split,
    daily_budget: {
      ...deterministicDaily,
      value: {
        ...deterministicDaily.value,
        recommended: budgetPlan.daily_budget,
      },
      reasoning: budgetPlan.scaling_rule,
      confidence: execution.confidence,
      rule_id: "ai-execution-v1",
    },
    channel_allocation: {
      ...deterministic.budget_split.channel_allocation,
      value: Object.fromEntries(
        budgetPlan.allocation.map((item) => [item.destination, item.percentage])
      ),
      confidence: execution.confidence,
      reasoning: budgetPlan.scaling_rule,
      rule_id: "ai-execution-v1",
    },
  };

  const aiAngles = execution.creative_execution.angles;
  const creativeAngles = {
    ...deterministic.creative_angles,
    alternative_angles:
      aiAngles.length > 0
        ? aiAngles.map((angle) => ({
            name: angle,
            hook: angle,
            body: "",
            cta: input.canonical.conversion_destination,
          }))
        : deterministic.creative_angles.alternative_angles,
  };

  const trackingChecklist = {
    ...deterministic.tracking_checklist,
    required_events: execution.tracking_execution.required_events,
    implementation_guide: {
      ...deterministic.tracking_checklist.implementation_guide,
      steps: execution.tracking_execution.validation_steps,
    },
  };

  const riskMessages = Array.from(
    new Set([...strategy.risks, ...execution.risks])
  );
  const riskFlags = {
    ...deterministic.risk_flags,
    warnings:
      riskMessages.length > 0
        ? riskMessages.map((message, index) => ({
            id: `ai-risk-${index + 1}`,
            message,
            action: "Review before launch and monitor during testing.",
          }))
        : deterministic.risk_flags.warnings,
    risk_score: {
      ...deterministic.risk_flags.risk_score,
      reasoning: `${strategyReasoning} ${executionReasoning}`.trim(),
      confidence: Math.min(strategy.confidence, execution.confidence),
      rule_id: "ai-strategy-execution-v1",
    },
  };

  const launchSequence = execution.launch_sequence.map((action, index) => ({
    step: index + 1,
    action,
    depends_on: index === 0 ? [] : [index],
    duration: "1 day",
  }));

  const first14DaysPlan = {
    ...deterministic.first_14_days_plan,
    launch_sequence:
      launchSequence.length > 0
        ? launchSequence
        : deterministic.first_14_days_plan.launch_sequence,
  };

  // Governance: readiness must reflect hard pre-launch conditions even when
  // the AI strategy itself is valid. Partial/missing tracking cannot remain
  // silently "ready" because the generated execution depends on conversion
  // events being measurable.
  const trackingIncomplete = input.canonical.tracking_status !== "ready";
  const requiredTrackingEvents = Array.from(
    new Set([
      ...input.canonical.key_events,
      ...execution.tracking_execution.required_events,
    ])
  );

  // Governance: compare the user-defined CAC ceiling with the gross profit
  // available per order. This is a derived safety signal, not an AI override.
  const grossProfitPerOrder =
    input.canonical.average_order_value > 0 && input.canonical.profit_margin > 0
      ? (input.canonical.average_order_value * input.canonical.profit_margin) / 100
      : 0;
  const cacTarget = input.canonical.max_cac;
  const economicHeadroomCritical = grossProfitPerOrder > 0 && cacTarget >= grossProfitPerOrder;
  const economicHeadroomThin =
    grossProfitPerOrder > 0 && cacTarget >= grossProfitPerOrder * 0.8 && !economicHeadroomCritical;

  const mustFix = [...deterministic.pre_launch_fixes.must_fix];
  const shouldFix = [...deterministic.pre_launch_fixes.should_fix];

  if (trackingIncomplete) {
    mustFix.push({
      item: "Complete and validate conversion tracking before launch",
      priority: "critical",
      estimated_time: "1-2 hours",
      action: `Set all required conversion events to ready and verify: ${requiredTrackingEvents.join(", ")}.`,
    });
  }

  if (economicHeadroomCritical) {
    mustFix.push({
      item: "Resolve CAC economics before scaling",
      priority: "critical",
      estimated_time: "1-2 hours",
      action: `Maximum CAC (${cacTarget}) is at or above estimated gross profit per order (${grossProfitPerOrder.toFixed(2)}). Rework the target, price, margin, or unit economics before launch.`,
    });
  } else if (economicHeadroomThin) {
    shouldFix.push({
      item: "Review CAC economic headroom",
      priority: "high",
      estimated_time: "30-60 minutes",
      action: `Maximum CAC (${cacTarget}) consumes at least 80% of estimated gross profit per order (${grossProfitPerOrder.toFixed(2)}). Confirm fulfillment, payment, and retention costs before scaling.`,
    });
  }

  const uniqueMustFix = Array.from(
    new Map(mustFix.map((item) => [item.item, item])).values()
  );
  const uniqueShouldFix = Array.from(
    new Map(shouldFix.map((item) => [item.item, item])).values()
  );

  const launchRecommendation: RichBlueprintData["executive_summary"]["launch_recommendation"] =
    uniqueMustFix.length > 0 || uniqueShouldFix.length > 0
      ? "ready_with_fixes"
      : deterministic.executive_summary.launch_recommendation;

  const preLaunchFixes = {
    ...deterministic.pre_launch_fixes,
    must_fix: uniqueMustFix,
    should_fix: uniqueShouldFix,
    estimated_fix_time:
      uniqueMustFix.length > 0
        ? "1-2 hours"
        : uniqueShouldFix.length > 0
          ? "30-60 minutes"
          : deterministic.pre_launch_fixes.estimated_fix_time,
    recommendation:
      uniqueMustFix.length > 0 || uniqueShouldFix.length > 0
        ? "Complete the identified pre-launch fixes before treating the campaign as launch-ready."
        : deterministic.pre_launch_fixes.recommendation,
    confidence: Math.min(
      deterministic.pre_launch_fixes.confidence,
      Math.round(Math.min(strategy.confidence, execution.confidence) * 100)
    ),
    reasoning:
      uniqueMustFix.length > 0 || uniqueShouldFix.length > 0
        ? "Governance checks added hard tracking/economic readiness conditions to the deterministic pre-launch assessment."
        : deterministic.pre_launch_fixes.reasoning,
    rule_id: "GOV-001",
  };

  const executiveSummary = {
    ...deterministic.executive_summary,
    launch_recommendation: launchRecommendation,
  };

  const governanceWarnings = [
    ...(trackingIncomplete
      ? ["Tracking is not fully ready; launch status is gated until required conversion events are validated."]
      : []),
    ...(economicHeadroomCritical
      ? ["CAC target is at or above estimated gross profit per order."]
      : economicHeadroomThin
        ? ["CAC target leaves thin gross-profit headroom per order."]
        : []),
  ];

  const governanceInfos = [
    ...(rules.constraints ?? []).map((constraint) => `Rules constraint: ${constraint}`),
  ];

  return {
    ...deterministic,
    wizard_input: input.canonical,
    executive_summary: executiveSummary,
    strategy_summary: strategySummary,
    recommended_funnel: recommendedFunnel,
    campaign_structure: campaignStructure,
    audience_structure: audienceStructure,
    budget_split: budgetSplit,
    creative_angles: creativeAngles,
    tracking_checklist: trackingChecklist,
    risk_flags: {
      ...riskFlags,
      warnings: [
        ...riskFlags.warnings,
        ...governanceWarnings.map((message, index) => ({
          id: `gov-risk-${index + 1}`,
          message,
          action: "Resolve or explicitly accept before launch.",
        })),
      ],
    },
    first_14_days_plan: first14DaysPlan,
    pre_launch_fixes: preLaunchFixes,
    flags: {
      ...deterministic.flags,
      warnings: Array.from(new Set([
        ...deterministic.flags.warnings,
        ...governanceWarnings,
      ])),
      infos: Array.from(new Set([
        ...deterministic.flags.infos,
        ...governanceInfos,
      ])),
    },
    generation_mode: "hybrid",
    ai_generated: true,
    aiGenerated: true,
    backfilled: false,
    source: "two-ai-v4",
    ai_model: `${STRATEGY_MODEL} + ${EXECUTION_MODEL}`,
    ai_reasoning: {
      strategy: strategyReasoning,
      execution: executionReasoning,
    },
  };
}

/**
 * Strategy AI Contract — B.1
 *
 * Strategy AI receives a deliberate projection of CanonicalWizardInput.
 * It must decide the strategic path, not campaign/ad-set execution details.
 */

import type { CanonicalWizardInput } from "./wizard-input";

export interface StrategyAIInput {
  business: {
    build_mode: string;
    business_type: string;
    offer_description: string;
    offer_type: string;
    sales_motion: string;
    customer_problem: string;
    key_value_drivers: string[];
    usp: string;
  };
  goals: {
    primary_objective: string;
    secondary_objectives: string[];
    north_star_kpi: string;
    top_priority: string;
  };
  market: {
    ideal_customer: string;
    awareness_level: string;
    audience_segments: string[];
    geo_scope: string;
    target_locations: string[];
    objections: string[];
  };
  strategic_direction: {
    core_message: string;
    persuasion_angle: string;
    conversion_destination: string;
    ad_channels: string[];
    campaign_direction: string;
    conversion_model: string;
  };
  economics: {
    budget_band: string;
    budget_flexibility: string;
    average_order_value: number;
    profit_margin: number;
    max_cac: number;
  };
  evidence_and_constraints: {
    existing_assets: string[];
    previous_campaigns_status: string;
    past_performance_notes: string;
    content_capacity: string;
    constraints: string[];
    risk_tolerance: string;
    response_speed: string;
  };
}

export interface StrategyDecision {
  strategy_version: "strategy-v1";
  recommended_objective: string;
  strategic_thesis: string;
  target_customer: {
    primary: string;
    segments: string[];
    awareness_level: string;
    geographic_scope: string;
  };
  funnel_strategy: {
    model: string;
    stages: string[];
    conversion_path: string;
  };
  channel_strategy: {
    primary_channels: string[];
    supporting_channels: string[];
    rationale: string;
  };
  offer_and_message: {
    core_message: string;
    persuasion_angle: string;
    offer_role: string;
  };
  measurement_strategy: {
    north_star_kpi: string;
    supporting_metrics: string[];
    success_definition: string;
  };
  strategic_assumptions: string[];
  risks: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Explicit strategy projection. No provider-specific AI payload is involved.
 */
export function toStrategyAIInput(input: CanonicalWizardInput): StrategyAIInput {
  return {
    business: {
      build_mode: input.build_mode,
      business_type: input.business_type,
      offer_description: input.offer_description,
      offer_type: input.offer_type,
      sales_motion: input.sales_motion,
      customer_problem: input.customer_problem,
      key_value_drivers: input.key_value_drivers,
      usp: input.usp,
    },
    goals: {
      primary_objective: input.primary_objective,
      secondary_objectives: input.secondary_objectives,
      north_star_kpi: input.north_star_kpi,
      top_priority: input.top_priority,
    },
    market: {
      ideal_customer: input.ideal_customer,
      awareness_level: input.awareness_level,
      audience_segments: input.audience_segments,
      geo_scope: input.geo_scope,
      target_locations: input.target_locations,
      objections: input.objections,
    },
    strategic_direction: {
      core_message: input.core_message,
      persuasion_angle: input.persuasion_angle,
      conversion_destination: input.conversion_destination,
      ad_channels: input.ad_channels,
      campaign_direction: input.campaign_direction,
      conversion_model: input.conversion_model,
    },
    economics: {
      budget_band: input.budget_band,
      budget_flexibility: input.budget_flexibility,
      average_order_value: input.average_order_value,
      profit_margin: input.profit_margin,
      max_cac: input.max_cac,
    },
    evidence_and_constraints: {
      existing_assets: input.existing_assets,
      previous_campaigns_status: input.previous_campaigns_status,
      past_performance_notes: input.past_performance_notes,
      content_capacity: input.content_capacity,
      constraints: input.constraints,
      risk_tolerance: input.risk_tolerance,
      response_speed: input.response_speed,
    },
  };
}

export function validateStrategyDecision(value: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const v = value && typeof value === "object" ? value as Record<string, unknown> : null;

  if (!v) return { valid: false, errors: ["StrategyDecision must be an object"] };
  if (v.strategy_version !== "strategy-v1") errors.push("strategy_version must be strategy-v1");
  if (typeof v.recommended_objective !== "string") errors.push("recommended_objective is required");
  if (typeof v.strategic_thesis !== "string") errors.push("strategic_thesis is required");
  if (typeof v.reasoning !== "string") errors.push("reasoning is required");
  if (typeof v.confidence !== "number" || v.confidence < 0 || v.confidence > 1) {
    errors.push("confidence must be a number between 0 and 1");
  }

  const objectFields = [
    "target_customer",
    "funnel_strategy",
    "channel_strategy",
    "offer_and_message",
    "measurement_strategy",
  ];
  for (const field of objectFields) {
    if (!v[field] || typeof v[field] !== "object") errors.push(`${field} is required`);
  }

  for (const field of ["strategic_assumptions", "risks"]) {
    if (!Array.isArray(v[field]) || !(v[field] as unknown[]).every(x => typeof x === "string")) {
      errors.push(`${field} must be a string array`);
    }
  }

  return { valid: errors.length === 0, errors };
}

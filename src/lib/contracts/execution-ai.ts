/**
 * Execution AI Contract — B.2
 *
 * Execution AI receives only execution-relevant canonical data plus the
 * validated strategic and deterministic rule decisions. It decides how to
 * execute an accepted strategy, not what the strategy should be.
 */

import type { CanonicalWizardInput } from "./wizard-input";
import type { StrategyDecision } from "./strategy-ai";

export interface RulesDecision {
  objective?: string;
  campaign_type?: string;
  budget_strategy?: string;
  audience_strategy?: string;
  exclusions?: string[];
  constraints?: string[];
  [key: string]: unknown;
}

export interface ExecutionAIInput {
  canonical_execution: {
    conversion_destination: string;
    ad_channels: string[];
    campaign_direction: string;
    budget_band: string;
    budget_flexibility: string;
    tracking_status: string;
    tracking_tools: string[];
    key_events: string[];
    conversion_model: string;
    creative_assets: string[];
    content_capacity: string;
    constraints: string[];
    response_speed: string;
    existing_assets: string[];
    target_locations: string[];
    audience_segments: string[];
    final_confirmed_inputs: boolean;
  };
  strategy: StrategyDecision;
  rules: RulesDecision;
}

export interface ExecutionDecision {
  execution_version: "execution-v1";
  campaign_structure: {
    campaigns: Array<{
      name: string;
      objective: string;
      channel: string;
      role: string;
    }>;
    rationale: string;
  };
  audience_structure: {
    primary_segments: string[];
    exclusions: string[];
    retargeting: string[];
    rationale: string;
  };
  budget_plan: {
    daily_budget: number;
    allocation: Array<{
      destination: string;
      percentage: number;
    }>;
    scaling_rule: string;
  };
  creative_execution: {
    formats: string[];
    angles: string[];
    asset_requirements: string[];
  };
  tracking_execution: {
    required_events: string[];
    validation_steps: string[];
  };
  launch_sequence: string[];
  execution_assumptions: string[];
  risks: string[];
  confidence: number;
  reasoning: string;
}

export function toExecutionAIInput(
  input: CanonicalWizardInput,
  strategy: StrategyDecision,
  rules: RulesDecision,
): ExecutionAIInput {
  return {
    canonical_execution: {
      conversion_destination: input.conversion_destination,
      ad_channels: input.ad_channels,
      campaign_direction: input.campaign_direction,
      budget_band: input.budget_band,
      budget_flexibility: input.budget_flexibility,
      tracking_status: input.tracking_status,
      tracking_tools: input.tracking_tools,
      key_events: input.key_events,
      conversion_model: input.conversion_model,
      creative_assets: input.creative_assets,
      content_capacity: input.content_capacity,
      constraints: input.constraints,
      response_speed: input.response_speed,
      existing_assets: input.existing_assets,
      target_locations: input.target_locations,
      audience_segments: input.audience_segments,
      final_confirmed_inputs: input.final_confirmed_inputs,
    },
    strategy,
    rules,
  };
}

export function validateExecutionDecision(value: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const v = value && typeof value === "object" ? value as Record<string, unknown> : null;

  if (!v) return { valid: false, errors: ["ExecutionDecision must be an object"] };
  if (v.execution_version !== "execution-v1") errors.push("execution_version must be execution-v1");
  if (typeof v.confidence !== "number" || v.confidence < 0 || v.confidence > 1) {
    errors.push("confidence must be a number between 0 and 1");
  }
  if (typeof v.reasoning !== "string") errors.push("reasoning is required");
  if (!Array.isArray(v.launch_sequence) || !(v.launch_sequence as unknown[]).every(x => typeof x === "string")) {
    errors.push("launch_sequence must be a string array");
  }
  for (const field of [
    "campaign_structure",
    "audience_structure",
    "budget_plan",
    "creative_execution",
    "tracking_execution",
  ]) {
    if (!v[field] || typeof v[field] !== "object") errors.push(`${field} is required`);
  }
  for (const field of ["execution_assumptions", "risks"]) {
    if (!Array.isArray(v[field]) || !(v[field] as unknown[]).every(x => typeof x === "string")) {
      errors.push(`${field} must be a string array`);
    }
  }

  return { valid: errors.length === 0, errors };
}

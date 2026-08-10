import type { CanonicalWizardInput } from "./wizard-input";
import { toStrategyAIInput, validateStrategyDecision, type StrategyDecision } from "./strategy-ai";
import { toExecutionAIInput, validateExecutionDecision, type ExecutionDecision } from "./execution-ai";

/** Lightweight contract tests for the AI boundaries. No provider/network calls. */

const sampleCanonical = {
  build_mode: "guided",
  business_type: "ecommerce",
  offer_description: "Test offer",
  offer_type: "product",
  sales_motion: "online",
  customer_problem: "Test problem",
  key_value_drivers: ["value"],
  usp: "Test USP",
  primary_objective: "sales",
  secondary_objectives: [],
  north_star_kpi: "purchases",
  top_priority: "growth",
  ideal_customer: "Test customer",
  awareness_level: "problem_aware",
  audience_segments: ["cold"],
  geo_scope: "local",
  target_locations: ["Cairo"],
  objections: ["price"],
  core_message: "Test message",
  persuasion_angle: "value",
  conversion_destination: "website",
  ad_channels: ["meta"],
  campaign_direction: "acquisition",
  conversion_model: "purchase",
  budget_band: "medium",
  budget_flexibility: "moderate",
  average_order_value: 100,
  profit_margin: 0.3,
  max_cac: 30,
  existing_assets: ["landing_page"],
  previous_campaigns_status: "none",
  past_performance_notes: "",
  content_capacity: "medium",
  constraints: [],
  risk_tolerance: "moderate",
  response_speed: "fast",
  tracking_status: "ready",
  tracking_tools: ["pixel"],
  key_events: ["purchase"],
  creative_assets: ["video"],
  final_confirmed_inputs: true,
} as unknown as CanonicalWizardInput;

export function runAIBoundaryContractTests(): void {
  const strategyInput = toStrategyAIInput(sampleCanonical);
  if (strategyInput.business.business_type !== sampleCanonical.business_type) {
    throw new Error("Strategy projection lost business_type");
  }
  if ("campaign_structure" in (strategyInput as object)) {
    throw new Error("Strategy input must not contain execution structure");
  }

  const validStrategy = {
    strategy_version: "strategy-v1",
    recommended_objective: "sales",
    strategic_thesis: "Test thesis",
    target_customer: { primary: "Test", segments: [], awareness_level: "problem_aware", geographic_scope: "local" },
    funnel_strategy: { model: "direct", stages: ["conversion"], conversion_path: "website" },
    channel_strategy: { primary_channels: ["meta"], supporting_channels: [], rationale: "Test" },
    offer_and_message: { core_message: "Test", persuasion_angle: "value", offer_role: "primary" },
    measurement_strategy: { north_star_kpi: "purchases", supporting_metrics: [], success_definition: "Test" },
    strategic_assumptions: [],
    risks: [],
    confidence: 0.8,
    reasoning: "Test",
  } as StrategyDecision;

  if (!validateStrategyDecision(validStrategy).valid) {
    throw new Error("Valid StrategyDecision rejected");
  }
  if (validateStrategyDecision({ ...validStrategy, confidence: 2 }).valid) {
    throw new Error("Invalid StrategyDecision accepted");
  }

  const executionInput = toExecutionAIInput(sampleCanonical, validStrategy, { objective: "sales" });
  if (executionInput.strategy !== validStrategy) {
    throw new Error("Execution input did not preserve StrategyDecision");
  }

  const validExecution = {
    execution_version: "execution-v1",
    campaign_structure: { campaigns: [], rationale: "Test" },
    audience_structure: { primary_segments: [], exclusions: [], retargeting: [], rationale: "Test" },
    budget_plan: { daily_budget: 100, allocation: [], scaling_rule: "Test" },
    creative_execution: { formats: [], angles: [], asset_requirements: [] },
    tracking_execution: { required_events: [], validation_steps: [] },
    launch_sequence: ["launch"],
    execution_assumptions: [],
    risks: [],
    confidence: 0.8,
    reasoning: "Test",
  } as ExecutionDecision;

  if (!validateExecutionDecision(validExecution).valid) {
    throw new Error("Valid ExecutionDecision rejected");
  }
  if (validateExecutionDecision({ ...validExecution, confidence: -1 }).valid) {
    throw new Error("Invalid ExecutionDecision accepted");
  }
}

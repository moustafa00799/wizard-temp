import { compileBlueprint } from "./blueprint-compiler";
import type { StrategyDecision } from "./strategy-ai";
import type { ExecutionDecision, RulesDecision } from "./execution-ai";
import type { CanonicalWizardInput } from "./wizard-input";

const canonical = {} as CanonicalWizardInput;
const strategy = {
  strategy_version: "strategy-v1",
  recommended_objective: "sales",
  strategic_thesis: "test",
  target_customer: { primary: "test", segments: [], awareness_level: "problem_aware", geographic_scope: "local" },
  funnel_strategy: { model: "direct", stages: [], conversion_path: "website" },
  channel_strategy: { primary_channels: ["meta"], supporting_channels: [], rationale: "test" },
  offer_and_message: { core_message: "test", persuasion_angle: "value", offer_role: "primary" },
  measurement_strategy: { north_star_kpi: "sales", supporting_metrics: [], success_definition: "test" },
  strategic_assumptions: [], risks: [], confidence: 1, reasoning: "strategy",
} as StrategyDecision;
const execution = {
  execution_version: "execution-v1",
  campaign_structure: { campaigns: [], rationale: "test" },
  audience_structure: { primary_segments: [], exclusions: [], retargeting: [], rationale: "test" },
  budget_plan: { daily_budget: 0, allocation: [], scaling_rule: "test" },
  creative_execution: { formats: [], angles: [], asset_requirements: [] },
  tracking_execution: { required_events: [], validation_steps: [] },
  launch_sequence: [], execution_assumptions: [], risks: [], confidence: 1, reasoning: "execution",
} as ExecutionDecision;

export function testBlueprintCompilerContract(): void {
  const result = compileBlueprint({ canonical, strategy, execution, rules: {} as RulesDecision });
  if (result.wizard_input !== canonical) throw new Error("Compiler must preserve canonical input");
  if (result.generation_mode !== "hybrid") throw new Error("Compiler must mark hybrid generation");
  if (result.ai_reasoning?.strategy !== "strategy") throw new Error("Strategy reasoning not preserved");
  if (result.ai_reasoning?.execution !== "execution") throw new Error("Execution reasoning not preserved");
}

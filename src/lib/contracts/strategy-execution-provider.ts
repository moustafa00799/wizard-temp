import type { CanonicalWizardInput } from "./wizard-input";
import type { RulesDecision, ExecutionAIInput } from "./execution-ai";
import type { StrategyAIInput } from "./strategy-ai";
import type { DeterministicRulesResolver, StrategyExecutionProvider } from "./strategy-execution-orchestrator";
import { generateBlueprintFromAI } from "@/lib/ai-client";

const STRATEGY_SYSTEM_PROMPT = `You are the Strategy AI for a campaign planning system.
Decide the strategic path only. Do not invent campaign/ad-set execution structures.
Return ONLY valid JSON matching StrategyDecision strategy-v1.
Required keys: strategy_version, recommended_objective, strategic_thesis, target_customer,
funnel_strategy, channel_strategy, offer_and_message, measurement_strategy,
strategic_assumptions, risks, confidence, reasoning.
Confidence must be between 0 and 1.`;

const EXECUTION_SYSTEM_PROMPT = `You are the Execution AI for a campaign planning system.
Execute an already accepted strategy using the supplied deterministic rules and execution data.
Do not change the strategic thesis or objective unless required by the supplied rules.
Return ONLY valid JSON matching ExecutionDecision execution-v1.
Required keys: execution_version, campaign_structure, audience_structure, budget_plan,
creative_execution, tracking_execution, launch_sequence, execution_assumptions, risks,
confidence, reasoning. Confidence must be between 0 and 1.`;

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    if (fenced) {
      try { return JSON.parse(fenced); } catch { return null; }
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

async function generateJson(systemPrompt: string, input: unknown): Promise<unknown> {
  const result = await generateBlueprintFromAI(
    input,
    systemPrompt,
    JSON.stringify(input, null, 2),
  );
  if (!result.success) throw new Error(result.error || "AI generation failed");
  const parsed = parseJson(result.text);
  if (!parsed) throw new Error("AI returned invalid JSON");
  return parsed;
}

export const strategyExecutionProvider: StrategyExecutionProvider = {
  generateStrategy(input: StrategyAIInput) {
    return generateJson(STRATEGY_SYSTEM_PROMPT, input);
  },
  generateExecution(input: ExecutionAIInput) {
    return generateJson(EXECUTION_SYSTEM_PROMPT, input);
  },
};

export const deterministicRulesResolver: DeterministicRulesResolver = {
  resolve(input: CanonicalWizardInput): RulesDecision {
    const objective = input.primary_objective || "awareness";
    const campaignType = input.conversion_destination || "website";
    const budgetStrategy = input.budget_flexibility === "fixed" ? "fixed" : "test_and_scale";
    const audienceStrategy = input.awareness_level === "purchase_ready" || input.awareness_level === "brand_aware"
      ? "retargeting"
      : "prospecting";

    return {
      objective,
      campaign_type: campaignType,
      budget_strategy: budgetStrategy,
      audience_strategy: audienceStrategy,
      exclusions: ["existing_customers"],
      constraints: input.constraints,
    };
  },
};

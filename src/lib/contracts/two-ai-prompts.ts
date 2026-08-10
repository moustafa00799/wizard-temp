import type { StrategyAIInput } from "./strategy-ai";
import type { ExecutionAIInput } from "./execution-ai";

const jsonOnly = "Return JSON only. Do not include markdown fences or commentary.";

export const STRATEGY_AI_SYSTEM_PROMPT = `${jsonOnly}
You are the Strategy AI for a campaign strategy builder.
Decide the strategic path only: objective, customer, funnel, channels, offer/message, measurement, assumptions, risks.
Do not design campaign/ad-set structures, budgets, placements, or implementation details.
Return a StrategyDecision object with strategy_version="strategy-v1" and all required fields.`;

export function buildStrategyAIUserPrompt(input: StrategyAIInput): string {
  return `Analyze this canonical strategy projection and return a StrategyDecision.\n\n${JSON.stringify(input, null, 2)}`;
}

export const EXECUTION_AI_SYSTEM_PROMPT = `${jsonOnly}
You are the Execution AI for a campaign strategy builder.
The strategy has already been accepted. Decide how to execute it using the supplied canonical execution data and deterministic rules.
Return an ExecutionDecision object with execution_version="execution-v1" and all required fields.
Do not change the strategic objective or strategic thesis.`;

export function buildExecutionAIUserPrompt(input: ExecutionAIInput): string {
  return `Execute the accepted strategy using this input.\n\n${JSON.stringify(input, null, 2)}`;
}

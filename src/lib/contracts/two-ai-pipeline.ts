import type { CanonicalWizardInput } from "./wizard-input";
import { toStrategyAIInput, validateStrategyDecision, type StrategyDecision } from "./strategy-ai";
import { toExecutionAIInput, validateExecutionDecision, type ExecutionAIInput, type ExecutionDecision, type RulesDecision } from "./execution-ai";
import { generateStructuredAI } from "./ai-provider";

export interface TwoAIPipelineResult {
  success: boolean;
  strategy: StrategyDecision | null;
  execution: ExecutionDecision | null;
  errors: string[];
  latencyMs: number;
}

export interface TwoAIPipelineOptions {
  strategySystemPrompt: string;
  strategyUserPrompt: (input: ReturnType<typeof toStrategyAIInput>) => string;
  executionSystemPrompt: string;
  executionUserPrompt: (input: ExecutionAIInput) => string;
}

/**
 * Provider-agnostic Strategy → Rules → Execution pipeline.
 * Rules are injected deterministically by the caller and never synthesized by AI.
 */
export async function runTwoAIPipeline(
  canonical: CanonicalWizardInput,
  rules: RulesDecision,
  options: TwoAIPipelineOptions,
): Promise<TwoAIPipelineResult> {
  const start = Date.now();
  const errors: string[] = [];

  const strategyInput = toStrategyAIInput(canonical);
  const strategyResponse = await generateStructuredAI({
    systemPrompt: options.strategySystemPrompt,
    userPrompt: options.strategyUserPrompt(strategyInput),
  });

  if (!strategyResponse.success || !strategyResponse.data) {
    return { success: false, strategy: null, execution: null, errors: [strategyResponse.error || "Strategy AI failed"], latencyMs: Date.now() - start };
  }

  const strategyValidation = validateStrategyDecision(strategyResponse.data);
  if (!strategyValidation.valid) {
    return { success: false, strategy: null, execution: null, errors: strategyValidation.errors, latencyMs: Date.now() - start };
  }
  const strategy = strategyResponse.data as unknown as StrategyDecision;

  const executionInput = toExecutionAIInput(canonical, strategy, rules);
  const executionResponse = await generateStructuredAI({
    systemPrompt: options.executionSystemPrompt,
    userPrompt: options.executionUserPrompt(executionInput),
  });

  if (!executionResponse.success || !executionResponse.data) {
    return { success: false, strategy, execution: null, errors: [executionResponse.error || "Execution AI failed"], latencyMs: Date.now() - start };
  }

  const executionValidation = validateExecutionDecision(executionResponse.data);
  if (!executionValidation.valid) {
    return { success: false, strategy, execution: null, errors: executionValidation.errors, latencyMs: Date.now() - start };
  }

  return {
    success: true,
    strategy,
    execution: executionResponse.data as unknown as ExecutionDecision,
    errors,
    latencyMs: Date.now() - start,
  };
}

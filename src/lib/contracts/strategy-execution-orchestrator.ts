/**
 * Two-AI orchestration boundary — Phase C foundation.
 *
 * Strategy AI decides the strategic path first. Execution AI receives only the
 * accepted strategy plus deterministic rules and execution-relevant canonical data.
 * The legacy multi-phase blueprint route remains untouched until this boundary
 * has its own tests and provider adapter.
 */

import type { CanonicalWizardInput } from "./wizard-input";
import {
  toStrategyAIInput,
  validateStrategyDecision,
  type StrategyDecision,
} from "./strategy-ai";
import {
  toExecutionAIInput,
  validateExecutionDecision,
  type ExecutionDecision,
  type RulesDecision,
} from "./execution-ai";

export interface StrategyExecutionProvider {
  generateStrategy(input: ReturnType<typeof toStrategyAIInput>): Promise<unknown>;
  generateExecution(input: ReturnType<typeof toExecutionAIInput>): Promise<unknown>;
}

export interface StrategyExecutionResult {
  success: boolean;
  strategy: StrategyDecision | null;
  execution: ExecutionDecision | null;
  errors: string[];
}

export interface DeterministicRulesResolver {
  resolve(input: CanonicalWizardInput): RulesDecision;
}

export async function runStrategyExecutionPipeline(
  canonical: CanonicalWizardInput,
  rulesResolver: DeterministicRulesResolver,
  provider: StrategyExecutionProvider,
): Promise<StrategyExecutionResult> {
  const errors: string[] = [];

  const strategyInput = toStrategyAIInput(canonical);
  const rawStrategy = await provider.generateStrategy(strategyInput);
  const strategyValidation = validateStrategyDecision(rawStrategy);

  if (!strategyValidation.valid) {
    return {
      success: false,
      strategy: null,
      execution: null,
      errors: strategyValidation.errors,
    };
  }

  const strategy = rawStrategy as StrategyDecision;
  const rules = rulesResolver.resolve(canonical);
  const executionInput = toExecutionAIInput(canonical, strategy, rules);

  const rawExecution = await provider.generateExecution(executionInput);
  const executionValidation = validateExecutionDecision(rawExecution);

  if (!executionValidation.valid) {
    errors.push(...executionValidation.errors);
    return {
      success: false,
      strategy,
      execution: null,
      errors,
    };
  }

  return {
    success: true,
    strategy,
    execution: rawExecution as ExecutionDecision,
    errors,
  };
}

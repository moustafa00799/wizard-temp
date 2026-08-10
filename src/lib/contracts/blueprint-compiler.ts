import { generateBlueprint } from "@/lib/blueprint-engine";
import type { RichBlueprintData } from "@/lib/blueprint-types";
import type { CanonicalWizardInput } from "./wizard-input";
import type { StrategyDecision } from "./strategy-ai";
import type { ExecutionDecision, RulesDecision } from "./execution-ai";

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
 * The existing deterministic rule compiler remains the source of the complete
 * legacy-compatible shape during migration. Accepted AI decisions are carried
 * alongside that deterministic result so later section compilers can replace
 * individual rule-derived sections without changing the route contract.
 */
export function compileBlueprint(input: BlueprintCompilerInput): RichBlueprintData {
  const deterministic = generateBlueprint(input.canonical);

  return {
    ...deterministic,
    wizard_input: input.canonical,
    generation_mode: "hybrid",
    ai_reasoning: {
      strategy: input.strategy.reasoning,
      execution: input.execution.reasoning,
    },
  };
}

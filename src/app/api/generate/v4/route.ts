import { NextRequest, NextResponse } from "next/server";
import { canonicalizeWizardInput } from "@/lib/wizard-mapper";
import { generateBlueprint } from "@/lib/blueprint-engine";
import { runTwoAIPipeline } from "@/lib/contracts/two-ai-pipeline";
import { compileBlueprint } from "@/lib/contracts/blueprint-compiler";
import {
  STRATEGY_AI_SYSTEM_PROMPT,
  buildStrategyAIUserPrompt,
  EXECUTION_AI_SYSTEM_PROMPT,
  buildExecutionAIUserPrompt,
} from "@/lib/contracts/two-ai-prompts";
import type { RulesDecision } from "@/lib/contracts/execution-ai";

function buildRulesDecision(canonical: ReturnType<typeof canonicalizeWizardInput>): RulesDecision {
  const blueprint = generateBlueprint(canonical);
  return {
    objective: canonical.primary_objective,
    campaign_type: blueprint.recommended_funnel.funnel_type,
    budget_strategy: canonical.budget_band,
    audience_strategy: canonical.audience_segments.join(", "),
    exclusions: blueprint.audience_structure.exclusions,
    constraints: canonical.constraints,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const started = Date.now();

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const canonical = canonicalizeWizardInput(body);
    const rules = buildRulesDecision(canonical);

    const result = await runTwoAIPipeline(canonical, rules, {
      strategySystemPrompt: STRATEGY_AI_SYSTEM_PROMPT,
      strategyUserPrompt: buildStrategyAIUserPrompt,
      executionSystemPrompt: EXECUTION_AI_SYSTEM_PROMPT,
      executionUserPrompt: buildExecutionAIUserPrompt,
    });

    if (!result.success || !result.strategy || !result.execution) {
      return NextResponse.json(
        {
          success: false,
          error: "Two-AI pipeline failed",
          details: result.errors,
          totalLatencyMs: Date.now() - started,
        },
        { status: 502 }
      );
    }

    const blueprint = compileBlueprint({
      canonical,
      strategy: result.strategy,
      execution: result.execution,
      rules,
    });

    return NextResponse.json({
      success: true,
      data: blueprint,
      source: "two-ai-v4",
      strategy: result.strategy,
      execution: result.execution,
      totalLatencyMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message, source: "server_error", totalLatencyMs: Date.now() - started },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", version: "4.0.0-two-ai" });
}

import { NextRequest, NextResponse } from 'next/server';
import { CDKSEngine } from '@/lib/orchestrator/cdks-engine';
import { canonicalizeWizardInput } from '@/lib/contracts/wizard-input';
import { CanonicalBlueprintSchema } from '@/lib/contracts/canonical-blueprint';
import { buildBlueprintContractV3 } from '@/lib/contracts/build-blueprint-contract-v3';
import { validateBlueprintContractV3 } from '@/lib/contracts/blueprint-contract-v3';
import { buildAIStrategyProposal } from '@/lib/ai-strategy-builder';
import { buildAIReasoning, reasoningTraceFromContract } from '@/lib/ai-reasoning-builder';
import { buildScopedStrategyContext } from '@/lib/knowledge/strategy-context';
import { sanitizeWizardInputForAI } from '@/lib/ai-sanitizer';
import type { ScopedStrategyContext } from '@/lib/contracts/knowledge-strategy-context';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const inputPayload = body && typeof body === 'object' && 'input' in body ? body.input : body;
    const validatedInput = canonicalizeWizardInput(inputPayload);
    const engine = new CDKSEngine();
    
    // ✅ استدعاء الدالة generate الصحيحة من CDKSEngine
    const blueprint = await engine.generate(validatedInput);
    
    const validatedOutput = CanonicalBlueprintSchema.parse(blueprint);
    const baseContract = buildBlueprintContractV3(validatedInput, validatedOutput, body);
    const knowledgeSelection = body && typeof body === 'object' && body.knowledge_strategy_selection && typeof body.knowledge_strategy_selection === 'object'
      ? body.knowledge_strategy_selection
      : undefined;
    const knowledgeContext: ScopedStrategyContext | undefined = knowledgeSelection
      ? buildScopedStrategyContext(knowledgeSelection)
      : undefined;
    const aiAdvisoryRequest = body && typeof body === 'object' && body.ai_advisory && typeof body.ai_advisory === 'object'
      ? body.ai_advisory as { enabled?: unknown }
      : undefined;
    const clientAiEnabled = aiAdvisoryRequest?.enabled === true;
    const serverLiveAiEnabled = process.env.AI_LIVE_ENABLED === 'true' && process.env.AI_PROVIDER_MODE === 'nonprod';
    const aiInput = sanitizeWizardInputForAI(validatedInput);
    const strategyRequest = body && typeof body === 'object' && body.ai_strategy_builder && typeof body.ai_strategy_builder === 'object'
      ? body.ai_strategy_builder as { enabled?: unknown; model?: unknown; provider?: unknown; fallbackProvider?: unknown; benchmark?: unknown; mockScenario?: unknown }
      : {};
    const strategy = await buildAIStrategyProposal(aiInput, validatedOutput, baseContract, {
      enabled: aiAdvisoryRequest ? clientAiEnabled : strategyRequest.enabled === true,
      model: typeof strategyRequest.model === 'string' ? strategyRequest.model : undefined,
      provider: strategyRequest.provider === 'mock' || strategyRequest.provider === 'groq' || strategyRequest.provider === 'mistral' || strategyRequest.provider === 'gemini' ? strategyRequest.provider : undefined,
      fallbackProvider: strategyRequest.fallbackProvider === 'mistral' || strategyRequest.fallbackProvider === 'gemini' || strategyRequest.fallbackProvider === 'groq' ? strategyRequest.fallbackProvider : undefined,
      benchmark: strategyRequest.benchmark === true,
      liveAllowed: aiAdvisoryRequest ? (clientAiEnabled ? serverLiveAiEnabled : false) : undefined,
      mockScenario: strategyRequest.mockScenario === 'baseline' || strategyRequest.mockScenario === 'override_attempt' || strategyRequest.mockScenario === 'malformed' || strategyRequest.mockScenario === 'failure'
        ? strategyRequest.mockScenario
        : undefined,
      knowledgeContext,
    });
    const reasoningRequest = body && typeof body === 'object' && body.ai_reasoning && typeof body.ai_reasoning === 'object'
      ? body.ai_reasoning as { enabled?: unknown; provider?: unknown; model?: unknown; fallbackProvider?: unknown; mockScenario?: unknown }
      : {};
    const configuredReasoningProvider = process.env.AI_REASONING_PROVIDER;
    const strategyProvider = process.env.AI_STRATEGY_PROVIDER;
    const reasoningProvider = configuredReasoningProvider === 'mistral' || configuredReasoningProvider === 'groq'
      ? configuredReasoningProvider
      : strategyProvider === 'mistral' || strategyProvider === 'groq'
        ? strategyProvider
        : 'groq';
    const reasoning = await buildAIReasoning(aiInput, validatedOutput, baseContract, {
      enabled: aiAdvisoryRequest ? clientAiEnabled : reasoningRequest.enabled === true,
      provider: aiAdvisoryRequest ? (clientAiEnabled ? reasoningProvider : 'mock') : reasoningRequest.provider === 'mock' ? 'mock' : undefined,
      model: typeof reasoningRequest.model === 'string' ? reasoningRequest.model : undefined,
      fallbackProvider: reasoningRequest.fallbackProvider === 'mistral' || reasoningRequest.fallbackProvider === 'groq' ? reasoningRequest.fallbackProvider : undefined,
      liveAllowed: aiAdvisoryRequest ? (clientAiEnabled ? serverLiveAiEnabled : false) : undefined,
      providerRunner: undefined,
      mockScenario: reasoningRequest.mockScenario === 'baseline' || reasoningRequest.mockScenario === 'unsupported_claim' || reasoningRequest.mockScenario === 'override_attempt' || reasoningRequest.mockScenario === 'malformed' || reasoningRequest.mockScenario === 'failure'
        ? reasoningRequest.mockScenario
        : undefined,
    });
    const contract = validateBlueprintContractV3({
      ...baseContract,
      strategy,
      reasoning: reasoningTraceFromContract(reasoning),
    });
    const processingTime = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        status: 'success',
        timestamp: new Date().toISOString(),
        version: 'v5',
        contract_version: contract.contract_version,
        processingTimeMs: processingTime,
        data: contract,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('CDKS Engine Error:', error);
      return NextResponse.json(
        {
          status: 'error',
          error: 'Engine execution failed',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
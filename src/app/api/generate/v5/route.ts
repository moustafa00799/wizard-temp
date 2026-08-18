import { NextRequest, NextResponse } from 'next/server';
import { CDKSEngine } from '@/lib/orchestrator/cdks-engine';
import { canonicalizeWizardInput } from '@/lib/contracts/wizard-input';
import { CanonicalBlueprintSchema } from '@/lib/contracts/canonical-blueprint';
import { buildBlueprintContractV3 } from '@/lib/contracts/build-blueprint-contract-v3';
import { validateBlueprintContractV3 } from '@/lib/contracts/blueprint-contract-v3';
import { buildAIStrategyProposal } from '@/lib/ai-strategy-builder';
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
    const strategyRequest = body && typeof body === 'object' && body.ai_strategy_builder && typeof body.ai_strategy_builder === 'object'
      ? body.ai_strategy_builder as { enabled?: unknown; model?: unknown; provider?: unknown; fallbackProvider?: unknown; benchmark?: unknown; mockScenario?: unknown }
      : {};
    const strategy = await buildAIStrategyProposal(validatedInput, validatedOutput, baseContract, {
      enabled: strategyRequest.enabled === true,
      model: typeof strategyRequest.model === 'string' ? strategyRequest.model : undefined,
      provider: strategyRequest.provider === 'mock' || strategyRequest.provider === 'groq' || strategyRequest.provider === 'mistral' || strategyRequest.provider === 'gemini' ? strategyRequest.provider : undefined,
      fallbackProvider: strategyRequest.fallbackProvider === 'mistral' || strategyRequest.fallbackProvider === 'gemini' || strategyRequest.fallbackProvider === 'groq' ? strategyRequest.fallbackProvider : undefined,
      benchmark: strategyRequest.benchmark === true,
      mockScenario: strategyRequest.mockScenario === 'baseline' || strategyRequest.mockScenario === 'override_attempt' || strategyRequest.mockScenario === 'malformed' || strategyRequest.mockScenario === 'failure'
        ? strategyRequest.mockScenario
        : undefined,
    });
    const contract = validateBlueprintContractV3({ ...baseContract, strategy });
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
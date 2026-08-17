import { NextRequest, NextResponse } from 'next/server';
import { CDKSEngine } from '@/lib/orchestrator/cdks-engine';
import { CanonicalWizardInputSchema } from '@/lib/contracts/wizard-input';
import { CanonicalBlueprintSchema } from '@/lib/contracts/canonical-blueprint';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const validatedInput = CanonicalWizardInputSchema.parse(body);
    const engine = new CDKSEngine();
    const blueprint = await engine.generateBlueprint(validatedInput);
    const validatedOutput = CanonicalBlueprintSchema.parse(blueprint);
    const processingTime = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        status: 'success',
        timestamp: new Date().toISOString(),
        version: 'v5',
        processingTimeMs: processingTime,
        data: validatedOutput,
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
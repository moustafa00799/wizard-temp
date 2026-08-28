import { NextRequest, NextResponse } from 'next/server';
import { CDKSEngine } from '@/lib/orchestrator/cdks-engine';
import { canonicalizeWizardInput } from '@/lib/contracts/wizard-input';
import { CanonicalBlueprintSchema } from '@/lib/contracts/canonical-blueprint';
import { buildBlueprintContractV3 } from '@/lib/contracts/build-blueprint-contract-v3';
import { validateBlueprintContractV3 } from '@/lib/contracts/blueprint-contract-v3';
import { buildAIStrategyProposal } from '@/lib/ai-strategy-builder';
import { buildAIReasoning, reasoningTraceFromContract } from '@/lib/ai-reasoning-builder';
import { buildScopedStrategyContext } from '@/lib/knowledge/strategy-context';
import { getAutomaticallyMatchedStrategyContext } from '@/lib/knowledge/available-strategy-contexts';
import { sanitizeWizardInputForAI } from '@/lib/ai-sanitizer';
import type { ScopedStrategyContext } from '@/lib/contracts/knowledge-strategy-context';
import { ZodError } from 'zod';
import { getRuntimeDatabaseState } from '@/lib/db/runtime-database';
import { sha256Json, type JsonRecord } from '@/lib/db';
import { readJsonBody, RequestSecurityError } from '@/lib/api/request-security';
import { LocalAuthError, requireLocalSession } from '@/lib/auth/local-auth';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await readJsonBody(request, 256 * 1024);
    const bodyRecord = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : undefined;
    const localSession = process.env.CDKS_LOCAL_AUTH_ENABLED === 'true' ? requireLocalSession(request) : null;
    const inputPayload = bodyRecord && 'input' in bodyRecord ? bodyRecord.input : body;
    const validatedInput = canonicalizeWizardInput(inputPayload);
    const engine = new CDKSEngine();
    
    // ✅ استدعاء الدالة generate الصحيحة من CDKSEngine
    const blueprint = await engine.generate(validatedInput);
    
    const validatedOutput = CanonicalBlueprintSchema.parse(blueprint);
    const baseContract = buildBlueprintContractV3(validatedInput, validatedOutput, bodyRecord ?? {});
    const lifecycleRequest = bodyRecord && bodyRecord.campaign_lifecycle && typeof bodyRecord.campaign_lifecycle === 'object'
      ? bodyRecord.campaign_lifecycle as { enabled?: unknown }
      : undefined;
    const lifecycleEnabled = lifecycleRequest?.enabled !== false;
    let campaignLifecycle: Record<string, unknown> | null = null;
    if (lifecycleEnabled) {
      const workspaceId = localSession?.workspaceId ?? process.env.CDKS_DEFAULT_WORKSPACE_ID ?? 'workspace-local-cdks';
      const userId = localSession?.userId ?? process.env.CDKS_DEFAULT_WORKSPACE_USER_ID ?? 'user-local-owner';
      const { repositories } = getRuntimeDatabaseState();
      if (!repositories.workspaces.get(workspaceId)) {
        repositories.workspaces.create({ workspaceId, name: 'CDKS Local Workspace' });
        repositories.memberships.create(workspaceId, userId, 'owner');
      }
      const canonicalSha256 = sha256Json(validatedOutput);
      repositories.blueprints.create({
        blueprintId: validatedOutput.blueprint_id,
        workspaceId,
        version: 1,
        blueprint: validatedOutput as unknown as JsonRecord,
        canonicalSha256,
      });
      const lifecycleId = `campaign-lifecycle-${validatedOutput.blueprint_id}`;
      const lifecycle = repositories.campaignLifecycle.create({
        lifecycleId,
        workspaceId,
        blueprintId: validatedOutput.blueprint_id,
        canonicalSha256,
      }) as Record<string, unknown>;
      campaignLifecycle = {
        lifecycleId: String(lifecycle.lifecycle_id),
        workspaceId: String(lifecycle.workspace_id),
        blueprintId: String(lifecycle.blueprint_id),
        state: String(lifecycle.state),
        canonicalSha256: String(lifecycle.canonical_sha256),
        generationMode: String(lifecycle.generation_mode),
        externalActionsAllowed: Boolean(lifecycle.external_actions_allowed),
        budgetSpendAllowed: Boolean(lifecycle.budget_spend_allowed),
        createdAt: String(lifecycle.created_at),
        updatedAt: String(lifecycle.updated_at),
      };
    }
    // Knowledge Context is derived server-side from the canonical Wizard input.
    // Client-provided context IDs/selections are intentionally ignored.
    const knowledgeSelection = getAutomaticallyMatchedStrategyContext(validatedInput);
    const knowledgeContext: ScopedStrategyContext | undefined = knowledgeSelection
      ? buildScopedStrategyContext(knowledgeSelection)
      : undefined;
    const aiAdvisoryRequest = bodyRecord && bodyRecord.ai_advisory && typeof bodyRecord.ai_advisory === 'object'
      ? bodyRecord.ai_advisory as { enabled?: unknown }
      : undefined;
    const clientAiEnabled = aiAdvisoryRequest?.enabled === true;
    const serverLiveAiEnabled = process.env.AI_LIVE_ENABLED === 'true' && process.env.AI_PROVIDER_MODE === 'nonprod';
    const aiInput = sanitizeWizardInputForAI(validatedInput);
    const strategyRequest = bodyRecord && bodyRecord.ai_strategy_builder && typeof bodyRecord.ai_strategy_builder === 'object'
      ? bodyRecord.ai_strategy_builder as { enabled?: unknown; model?: unknown; provider?: unknown; fallbackProvider?: unknown; benchmark?: unknown; mockScenario?: unknown }
      : {};
    const strategyStartedAt = performance.now();
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
    const strategyLatencyMs = Math.round(performance.now() - strategyStartedAt);
    const reasoningRequest = bodyRecord && bodyRecord.ai_reasoning && typeof bodyRecord.ai_reasoning === 'object'
      ? bodyRecord.ai_reasoning as { enabled?: unknown; provider?: unknown; model?: unknown; fallbackProvider?: unknown; mockScenario?: unknown }
      : {};
    const configuredReasoningProvider = process.env.AI_REASONING_PROVIDER;
    const strategyProvider = process.env.AI_STRATEGY_PROVIDER;
    const reasoningProvider = configuredReasoningProvider === 'mistral' || configuredReasoningProvider === 'groq'
      ? configuredReasoningProvider
      : strategyProvider === 'mistral' || strategyProvider === 'groq'
        ? strategyProvider
        : 'groq';
    const reasoningStartedAt = performance.now();
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
      knowledgeContext,
    });
    const reasoningLatencyMs = Math.round(performance.now() - reasoningStartedAt);
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
        campaign_lifecycle: campaignLifecycle,
        ai_timing: {
          strategyMs: strategyLatencyMs,
          reasoningMs: reasoningLatencyMs,
          totalMs: strategyLatencyMs + reasoningLatencyMs,
          strategyStatus: strategy.status,
          reasoningStatus: reasoning.status,
        },
        knowledge_context: knowledgeContext ? {
          contextId: knowledgeContext.contextId,
          packageId: knowledgeContext.packageId,
          snapshotId: knowledgeContext.snapshotId,
          market: knowledgeContext.market,
          industry: knowledgeContext.industry,
          evidenceLocale: knowledgeContext.evidenceLocale,
          currency: knowledgeContext.currency,
          freshnessStatus: knowledgeContext.freshnessStatus,
          scopedValidationStatus: knowledgeContext.scopedValidationStatus,
          scopedMarketValidated: knowledgeContext.scopedMarketValidated,
          globalMarketValidated: knowledgeContext.globalMarketValidated,
          approvedFactCount: knowledgeContext.approvedFacts.length,
          unavailableBenchmarkCategories: knowledgeContext.unavailableBenchmarkCategories,
        } : null,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof LocalAuthError) {
      return NextResponse.json(
        { status: 'error', error: error.code === 'NOT_CONFIGURED' ? 'Local Authentication is not configured' : 'Authentication required', timestamp: new Date().toISOString() },
        { status: error.code === 'NOT_CONFIGURED' ? 503 : 401 },
      );
    }
    if (error instanceof RequestSecurityError) {
      return NextResponse.json(
        { status: 'error', error: error.code === 'BODY_TOO_LARGE' ? 'Request body too large' : 'Invalid JSON', message: error.message, timestamp: new Date().toISOString() },
        { status: error.code === 'BODY_TOO_LARGE' ? 413 : 400 },
      );
    }
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
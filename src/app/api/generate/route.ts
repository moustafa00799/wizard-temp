/**
 * Campaign Engine Builder — API Route (Multi-Phase v3)
 *
 * Architecture:
 *   Phase 1 (Sequential): Strategy Core — executive_summary + strategy_summary + recommended_funnel
 *   Phase 2 (Parallel):   Tactical Build — campaign_structure + audience_structure + budget_split + creative_angles
 *   Phase 3 (Parallel):   Operations & Risk — tracking_checklist + risk_flags + first_14_days_plan + pre_launch_fixes
 *
 * Fallback: If any phase fails, Rules Engine generates ONLY the missing sections (granular fallback).
 * This guarantees 100% blueprint coverage without losing AI value from successful phases.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint, generateSection, type SectionName } from "@/lib/blueprint-engine";
import { generatePhase, isAIConfigured, getAIModelInfo } from "@/lib/ai-client";
import {
  PHASE1_SYSTEM_PROMPT,
  PHASE2_SYSTEM_PROMPT,
  PHASE3_SYSTEM_PROMPT,
  buildPhaseUserPrompt,
  buildPhase2UserPrompt,
  buildPhase3UserPrompt,
} from "@/lib/ai-prompts";
import { validatePhase1, validatePhase2, validatePhase3, validateBlueprintObject } from "@/lib/ai-validator";
import { normalizePhaseKeys, mergePhases, adaptToRichShape } from "@/lib/ai-adapter";
import { AIWizardPayload } from "@/lib/ai-types";
import { canonicalizeWizardInput, mapToAIWizardPayload } from "@/lib/wizard-mapper";
import type { RichBlueprintData, WizardPayload } from "@/lib/blueprint-types";
import { backfillBlueprint } from "@/lib/blueprint-backfill";

// ============================================================
// PHASE 1: Strategy Core (Sequential)
// ============================================================

async function runPhase1(wizardData: AIWizardPayload) {
  const startTime = Date.now();

  if (!isAIConfigured()) {
    return {
      success: false,
      data: null,
      error: "GROQ_API_KEY not configured",
      phase: 1,
      latencyMs: 0,
    };
  }

  const userPrompt = buildPhaseUserPrompt(wizardData);
  const result = await generatePhase(1, PHASE1_SYSTEM_PROMPT, userPrompt);

  if (!result.success || !result.data) {
    return {
      success: false,
      data: null,
      error: result.error || "Phase 1 failed",
      phase: 1,
      latencyMs: result.latencyMs,
    };
  }

  const normalized = normalizePhaseKeys(result.data);
  const validation = validatePhase1(normalized);

  if (!validation.valid) {
    console.warn("[Phase 1] Validation warnings:", validation.errors.slice(0, 3));
    // We still accept partial results — backfill will fill gaps
  }

  return {
    success: true,
    data: normalized,
    phase: 1,
    latencyMs: result.latencyMs,
    tokensUsed: result.tokensUsed,
  };
}

// ============================================================
// PHASE 2: Tactical Build (Parallel)
// ============================================================

async function runPhase2(wizardData: AIWizardPayload, phase1Data: Record<string, unknown>) {
  const startTime = Date.now();

  if (!isAIConfigured()) {
    return {
      success: false,
      data: null,
      error: "GROQ_API_KEY not configured",
      phase: 2,
      latencyMs: 0,
    };
  }

  const userPrompt = buildPhase2UserPrompt(wizardData, phase1Data);
  const result = await generatePhase(2, PHASE2_SYSTEM_PROMPT, userPrompt);

  if (!result.success || !result.data) {
    return {
      success: false,
      data: null,
      error: result.error || "Phase 2 failed",
      phase: 2,
      latencyMs: result.latencyMs,
    };
  }

  const normalized = normalizePhaseKeys(result.data);
  const validation = validatePhase2(normalized);

  if (!validation.valid) {
    console.warn("[Phase 2] Validation warnings:", validation.errors.slice(0, 3));
  }

  return {
    success: true,
    data: normalized,
    phase: 2,
    latencyMs: result.latencyMs,
    tokensUsed: result.tokensUsed,
  };
}

// ============================================================
// PHASE 3: Operations & Risk (Parallel)
// ============================================================

async function runPhase3(wizardData: AIWizardPayload, phase1Data: Record<string, unknown>) {
  const startTime = Date.now();

  if (!isAIConfigured()) {
    return {
      success: false,
      data: null,
      error: "GROQ_API_KEY not configured",
      phase: 3,
      latencyMs: 0,
    };
  }

  const userPrompt = buildPhase3UserPrompt(wizardData, phase1Data);
  const result = await generatePhase(3, PHASE3_SYSTEM_PROMPT, userPrompt);

  if (!result.success || !result.data) {
    return {
      success: false,
      data: null,
      error: result.error || "Phase 3 failed",
      phase: 3,
      latencyMs: result.latencyMs,
    };
  }

  const normalized = normalizePhaseKeys(result.data);
  const validation = validatePhase3(normalized);

  if (!validation.valid) {
    console.warn("[Phase 3] Validation warnings:", validation.errors.slice(0, 3));
  }

  return {
    success: true,
    data: normalized,
    phase: 3,
    latencyMs: result.latencyMs,
    tokensUsed: result.tokensUsed,
  };
}

// ============================================================
// GRANULAR FALLBACK: Generate missing sections from Rules
// ============================================================

function applyGranularFallback(
  aiPartial: Partial<RichBlueprintData>,
  canonicalWizard: WizardPayload
): Partial<RichBlueprintData> {
  const sections: SectionName[] = [
    "executive_summary",
    "strategy_summary",
    "recommended_funnel",
    "campaign_structure",
    "audience_structure",
    "budget_split",
    "creative_angles",
    "tracking_checklist",
    "risk_flags",
    "first_14_days_plan",
    "pre_launch_fixes",
  ];

  const merged: Partial<RichBlueprintData> = { ...aiPartial };

  for (const section of sections) {
    if (!merged[section]) {
      console.log(`[Fallback] Generating missing section from Rules: ${section}`);
      const fallbackSection = generateSection(section, canonicalWizard);
      Object.assign(merged, fallbackSection);
    }
  }

  return merged;
}

// ============================================================
// MAIN POST HANDLER
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStart = Date.now();

  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body", source: "validation_error" },
        { status: 400 }
      );
    }

    // ── Step 1: Canonicalize Wizard input ──
    const canonicalWizard = canonicalizeWizardInput(body);
    const wizardData = mapToAIWizardPayload(canonicalWizard);

    // ── Step 2: Phase 1 (Sequential — must complete before Phase 2+3) ──
    const phase1Result = await runPhase1(wizardData);
    console.log(`[Phase 1] success=${phase1Result.success} | latency=${phase1Result.latencyMs}ms`);

    let phase1Data: Record<string, unknown> = {};
    if (phase1Result.success && phase1Result.data) {
      phase1Data = phase1Result.data;
    } else {
      console.warn("[Phase 1] Failed:", phase1Result.error);
    }

    // ── Step 3: Phase 2 + Phase 3 (Sequential with Rate Limit) ──
    // Groq Free Tier = 20 RPM → enforce 3.5s delay between requests
    const phase2Result = await runPhase2(wizardData, phase1Data);
    console.log(`[Phase 2] success=${phase2Result.success} | latency=${phase2Result.latencyMs}ms`);
    if (!phase2Result.success) {
      console.warn("[Phase 2] Error:", phase2Result.error);
    }

    const phase3Result = await runPhase3(wizardData, phase1Data);
    console.log(`[Phase 3] success=${phase3Result.success} | latency=${phase3Result.latencyMs}ms`);
    if (!phase3Result.success) {
      console.warn("[Phase 3] Error:", phase3Result.error);
    }

    // ── Step 4: Merge all phases ──
    const mergedFlat = mergePhases(
      phase1Result.success && phase1Result.data ? phase1Result.data : {},
      phase2Result.success && phase2Result.data ? phase2Result.data : {},
      phase3Result.success && phase3Result.data ? phase3Result.data : {}
    );

    console.log("[Merge] Sections from AI:", Object.keys(mergedFlat).join(", "));

    // ── Step 5: Convert flat AI output → RichBlueprintData shape ──
    const aiRichPartial = adaptToRichShape(mergedFlat);

    // ── Step 6: Granular fallback for any missing sections ──
    const withFallback = applyGranularFallback(aiRichPartial, canonicalWizard);

    // ── Step 7: Generate full Rules blueprint for backfill ──
    const rulesBlueprint = generateBlueprint(canonicalWizard);

    // ── Step 8: Merge AI (priority) + Rules (fallback) ──
    const finalBlueprint = backfillBlueprint(withFallback, canonicalWizard);

    // ── Step 9: Final validation (on flat merged data, before Rich adaptation) ──
    const flatValidation = validateBlueprintObject(mergedFlat);
    if (!flatValidation.valid) {
      console.warn("[Flat Validation] Missing from AI:", flatValidation.errors.slice(0, 5));
    }

    // ── Step 10: Check Rich shape completeness ──
    const richSections = [
      "executive_summary", "strategy_summary", "recommended_funnel",
      "campaign_structure", "audience_structure", "budget_split",
      "creative_angles", "tracking_checklist", "risk_flags",
      "first_14_days_plan", "pre_launch_fixes",
    ];
    const missingRichSections = richSections.filter(s => !(s in finalBlueprint));
    if (missingRichSections.length > 0) {
      console.warn("[Rich Validation] Missing sections:", missingRichSections);
    }

    // ── Step 10: Metadata ──
    const totalLatency = Date.now() - requestStart;
    const aiSections = Object.keys(mergedFlat).length;
    const aiGenerated = aiSections > 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          ...finalBlueprint,
          generation_mode: aiGenerated ? "hybrid" : "rules",
          ai_model: "llama-3.3-70b-versatile",
          ai_sections_generated: aiSections,
          ai_reasoning: Object.fromEntries(
            Object.entries(mergedFlat).map(([k, v]) => [
              k,
              (v as Record<string, unknown>)?.reasoning || "",
            ])
          ),
        },
        source: aiGenerated ? "hybrid" : "rules",
        aiGenerated,
        backfilled: true,
        phase1LatencyMs: phase1Result.latencyMs,
        phase2LatencyMs: phase2Result.latencyMs,
        phase3LatencyMs: phase3Result.latencyMs,
        totalLatencyMs: totalLatency,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/generate]", error);
    return NextResponse.json(
      { success: false, error: message, source: "server_error", totalLatencyMs: Date.now() - requestStart },
      { status: 500 }
    );
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function GET(): Promise<NextResponse> {
  const modelInfo = getAIModelInfo();
  return NextResponse.json(
    {
      status: "ok",
      aiConfigured: isAIConfigured(),
      provider: "groq",
      primaryModel: modelInfo.primaryModel,
      fallbackModel: modelInfo.fallbackModel,
      timestamp: new Date().toISOString(),
      version: "3.0.0-multi-phase",
    },
    { status: 200 }
  );
}

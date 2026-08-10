/**
 * Campaign Engine Builder — AI Response Validator (Multi-Phase v3)
 *
 * Validates per-phase output (3-4 sections) instead of the full 11-section blueprint.
 * This is lighter, faster, and catches issues at the source.
 */

import { AIBlueprint, ValidationResult } from "./ai-types";

// ─── Phase 1: Strategy Core ──────────────────────────────────────────────────

export const PHASE1_REQUIRED_SECTIONS = [
  "executive_summary",
  "strategy_summary",
  "recommended_funnel",
] as const;

const PHASE1_REQUIRED_FIELDS: Record<string, string[]> = {
  executive_summary: ["readiness_score", "risk_score", "launch_recommendation", "reasoning"],
  strategy_summary: ["objective", "channels", "funnel_type", "confidence", "timeline", "reasoning"],
  recommended_funnel: ["funnel_type", "stages", "total_stages", "reasoning"],
};

// ─── Phase 2: Tactical Build ─────────────────────────────────────────────────

export const PHASE2_REQUIRED_SECTIONS = [
  "campaign_structure",
  "audience_structure",
  "budget_split",
  "creative_angles",
] as const;

const PHASE2_REQUIRED_FIELDS: Record<string, string[]> = {
  campaign_structure: ["campaign_count", "campaigns", "ad_set_structure", "reasoning"],
  audience_structure: ["primary_audience", "segments", "lookalike", "exclusions", "reasoning"],
  budget_split: ["daily_budget", "monthly_budget", "channel_allocation", "test_budget", "scale_budget", "cac_target", "reasoning"],
  creative_angles: ["primary_angle", "alternative_angles", "formats", "reasoning"],
};

// ─── Phase 3: Operations & Risk ──────────────────────────────────────────────

export const PHASE3_REQUIRED_SECTIONS = [
  "tracking_checklist",
  "risk_flags",
  "first_14_days_plan",
  "pre_launch_fixes",
] as const;

const PHASE3_REQUIRED_FIELDS: Record<string, string[]> = {
  tracking_checklist: ["required_events", "setup_status", "missing_items", "implementation_guide", "reasoning"],
  risk_flags: ["critical", "warnings", "recommendations", "risk_score", "reasoning"],
  first_14_days_plan: ["week_1", "week_2", "daily_budget_schedule", "launch_sequence", "reasoning"],
  pre_launch_fixes: ["must_fix", "should_fix", "nice_to_have", "estimated_fix_time", "reasoning"],
};

// ─── Full Blueprint (for final validation after merge) ───────────────────────

export const REQUIRED_SECTIONS = [
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
] as const;

const REQUIRED_FIELDS: Record<string, string[]> = {
  executive_summary: ["readiness_score", "risk_score", "launch_recommendation", "reasoning"],
  strategy_summary: ["objective", "channels", "funnel_type", "confidence", "timeline", "reasoning"],
  recommended_funnel: ["funnel_type", "stages", "total_stages", "reasoning"],
  campaign_structure: ["campaign_count", "campaigns", "ad_set_structure", "reasoning"],
  audience_structure: ["primary_audience", "segments", "lookalike", "exclusions", "reasoning"],
  budget_split: ["daily_budget", "monthly_budget", "channel_allocation", "test_budget", "scale_budget", "cac_target", "reasoning"],
  creative_angles: ["primary_angle", "alternative_angles", "formats", "reasoning"],
  tracking_checklist: ["required_events", "setup_status", "missing_items", "implementation_guide", "reasoning"],
  risk_flags: ["critical", "warnings", "recommendations", "risk_score", "reasoning"],
  first_14_days_plan: ["week_1", "week_2", "daily_budget_schedule", "launch_sequence", "reasoning"],
  pre_launch_fixes: ["must_fix", "should_fix", "nice_to_have", "estimated_fix_time", "reasoning"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function extractBlueprint(text: string): Record<string, unknown> | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();

  const candidates: string[] = [];
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) candidates.push(trimmed);

  const markdown = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdown?.[1]) candidates.push(markdown[1].trim());

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(trimmed.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (isObject(parsed)) return parsed;
    } catch {
      // Try the next extraction strategy.
    }
  }

  return null;
}

function validateSectionFields(
  section: string,
  value: unknown,
  errors: string[],
  missingFields: string[],
  invalidValues: string[]
): void {
  if (!isObject(value)) {
    errors.push(`${section}: must be an object`);
    invalidValues.push(section);
    return;
  }

  for (const field of REQUIRED_FIELDS[section] || []) {
    if (!(field in value)) {
      errors.push(`Missing required field: ${section}.${field}`);
      missingFields.push(`${section}.${field}`);
    }
  }
}

// ─── Phase Validation ────────────────────────────────────────────────────────

function validatePhaseInternal(
  blueprint: unknown,
  requiredSections: readonly string[],
  requiredFields: Record<string, string[]>
): ValidationResult {
  if (!isObject(blueprint)) {
    return {
      valid: false,
      errors: ["Blueprint must be an object"],
      missing_fields: requiredSections.slice(),
      invalid_values: [],
    };
  }

  const errors: string[] = [];
  const missingFields: string[] = [];
  const invalidValues: string[] = [];

  for (const section of requiredSections) {
    if (!(section in blueprint)) {
      errors.push(`Missing required section: ${section}`);
      missingFields.push(section);
      continue;
    }

    const value = blueprint[section];
    if (!isObject(value)) {
      errors.push(`${section}: must be an object`);
      invalidValues.push(section);
      continue;
    }

    for (const field of requiredFields[section] || []) {
      if (!(field in value)) {
        errors.push(`Missing required field: ${section}.${field}`);
        missingFields.push(`${section}.${field}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missing_fields: missingFields,
    invalid_values: invalidValues,
  };
}

export function validatePhase1(blueprint: unknown): ValidationResult {
  return validatePhaseInternal(blueprint, PHASE1_REQUIRED_SECTIONS, PHASE1_REQUIRED_FIELDS);
}

export function validatePhase2(blueprint: unknown): ValidationResult {
  return validatePhaseInternal(blueprint, PHASE2_REQUIRED_SECTIONS, PHASE2_REQUIRED_FIELDS);
}

export function validatePhase3(blueprint: unknown): ValidationResult {
  return validatePhaseInternal(blueprint, PHASE3_REQUIRED_SECTIONS, PHASE3_REQUIRED_FIELDS);
}

// ─── Full Blueprint Validation ───────────────────────────────────────────────

export function validateBlueprintObject(blueprint: unknown): ValidationResult {
  if (!isObject(blueprint)) {
    return {
      valid: false,
      errors: ["Blueprint must be an object"],
      missing_fields: REQUIRED_SECTIONS.slice(),
      invalid_values: [],
    };
  }

  const errors: string[] = [];
  const missingFields: string[] = [];
  const invalidValues: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!(section in blueprint)) {
      errors.push(`Missing required section: ${section}`);
      missingFields.push(section);
      continue;
    }
    validateSectionFields(section, blueprint[section], errors, missingFields, invalidValues);
  }

  return {
    valid: errors.length === 0,
    errors,
    missing_fields: missingFields,
    invalid_values: invalidValues,
  };
}

export function validateBlueprintJSON(text: string): ValidationResult {
  const blueprint = extractBlueprint(text);
  if (!blueprint) {
    return {
      valid: false,
      errors: ["Failed to parse JSON from AI response"],
      missing_fields: REQUIRED_SECTIONS.slice(),
      invalid_values: [],
    };
  }

  return validateBlueprintObject(blueprint);
}

// ─── Type alignment ──────────────────────────────────────────────────────────

void (null as unknown as AIBlueprint);

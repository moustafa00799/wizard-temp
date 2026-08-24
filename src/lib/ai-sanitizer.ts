import type { CanonicalWizardInput } from "./contracts/wizard-input";

const REDACTION_PATTERNS: RegExp[] = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g,
  /\b(?:sk|pk|api|key|token|secret|bearer)[-_:=\s]*[A-Za-z0-9._-]{12,}\b/gi,
  /\beyJ[A-Za-z0-9._-]{20,}\b/g,
  /https?:\/\/[^\s]+/gi,
];

const MAX_TEXT_LENGTH = 1200;
const MAX_ARRAY_ITEMS = 16;

function sanitizeText(value: string): string {
  let result = value.slice(0, MAX_TEXT_LENGTH);
  for (const pattern of REDACTION_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result.trim();
}

function sanitizeArray(values: string[]): string[] {
  return values.slice(0, MAX_ARRAY_ITEMS).map(sanitizeText).filter(Boolean);
}

/**
 * Creates the only Wizard projection allowed to leave the application for an
 * optional AI request. It preserves useful commercial context while removing
 * common direct identifiers, URLs, credentials, and oversized free text.
 */
export function sanitizeUnknownForAI(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[OMITTED]";
  if (typeof value === "string") return sanitizeText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeUnknownForAI(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 64)
        .map(([key, item]) => [sanitizeText(key), sanitizeUnknownForAI(item, depth + 1)])
    );
  }
  return "[OMITTED]";
}

export function sanitizeWizardInputForAI(input: CanonicalWizardInput): CanonicalWizardInput {
  return {
    build_mode: sanitizeText(input.build_mode),
    business_type: sanitizeText(input.business_type),
    offer_description: sanitizeText(input.offer_description),
    sales_motion: sanitizeText(input.sales_motion),
    customer_problem: sanitizeText(input.customer_problem),
    key_value_drivers: sanitizeArray(input.key_value_drivers),
    usp: sanitizeText(input.usp),
    primary_objective: sanitizeText(input.primary_objective),
    secondary_objectives: sanitizeArray(input.secondary_objectives),
    north_star_kpi: sanitizeText(input.north_star_kpi),
    existing_assets: sanitizeArray(input.existing_assets),
    previous_campaigns_status: sanitizeText(input.previous_campaigns_status),
    past_performance_notes: sanitizeText(input.past_performance_notes),
    ideal_customer: sanitizeText(input.ideal_customer),
    awareness_level: sanitizeText(input.awareness_level),
    audience_segments: sanitizeArray(input.audience_segments),
    geo_scope: sanitizeText(input.geo_scope),
    target_locations: sanitizeArray(input.target_locations),
    offer_type: sanitizeText(input.offer_type),
    core_message: sanitizeText(input.core_message),
    objections: sanitizeArray(input.objections),
    persuasion_angle: sanitizeText(input.persuasion_angle),
    conversion_destination: sanitizeText(input.conversion_destination),
    ad_channels: sanitizeArray(input.ad_channels),
    campaign_direction: sanitizeText(input.campaign_direction),
    budget_band: sanitizeText(input.budget_band),
    budget_flexibility: sanitizeText(input.budget_flexibility),
    average_order_value: input.average_order_value,
    profit_margin: input.profit_margin,
    max_cac: input.max_cac,
    tracking_status: sanitizeText(input.tracking_status),
    tracking_tools: sanitizeArray(input.tracking_tools),
    key_events: sanitizeArray(input.key_events),
    conversion_model: sanitizeText(input.conversion_model),
    creative_assets: sanitizeArray(input.creative_assets),
    content_capacity: sanitizeText(input.content_capacity),
    constraints: sanitizeArray(input.constraints),
    response_speed: sanitizeText(input.response_speed),
    top_priority: sanitizeText(input.top_priority),
    risk_tolerance: sanitizeText(input.risk_tolerance),
    final_confirmed_inputs: input.final_confirmed_inputs,
  };
}

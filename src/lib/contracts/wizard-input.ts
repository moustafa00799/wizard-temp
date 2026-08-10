/**
 * Canonical Wizard Input Contract
 *
 * Single source of truth for the data collected by the Wizard.
 * Rules and AI adapters consume this contract; provider-specific payloads
 * must be projections of it and must never become the source of truth.
 */

export interface CanonicalWizardInput {
  build_mode: string;
  business_type: string;
  offer_description: string;
  sales_motion: string;
  customer_problem: string;
  key_value_drivers: string[];
  usp: string;
  primary_objective: string;
  secondary_objectives: string[];
  north_star_kpi: string;
  existing_assets: string[];
  previous_campaigns_status: string;
  past_performance_notes: string;
  ideal_customer: string;
  awareness_level: string;
  audience_segments: string[];
  geo_scope: string;
  target_locations: string[];
  offer_type: string;
  core_message: string;
  objections: string[];
  persuasion_angle: string;
  conversion_destination: string;
  ad_channels: string[];
  campaign_direction: string;
  budget_band: string;
  budget_flexibility: string;
  average_order_value: number;
  profit_margin: number;
  max_cac: number;
  tracking_status: string;
  tracking_tools: string[];
  key_events: string[];
  conversion_model: string;
  creative_assets: string[];
  content_capacity: string;
  constraints: string[];
  response_speed: string;
  top_priority: string;
  risk_tolerance: string;
  final_confirmed_inputs: boolean;
}

export const CANONICAL_WIZARD_FIELDS = [
  "build_mode", "business_type", "offer_description", "sales_motion",
  "customer_problem", "key_value_drivers", "usp", "primary_objective",
  "secondary_objectives", "north_star_kpi", "existing_assets",
  "previous_campaigns_status", "past_performance_notes", "ideal_customer",
  "awareness_level", "audience_segments", "geo_scope", "target_locations",
  "offer_type", "core_message", "objections", "persuasion_angle",
  "conversion_destination", "ad_channels", "campaign_direction", "budget_band",
  "budget_flexibility", "average_order_value", "profit_margin", "max_cac",
  "tracking_status", "tracking_tools", "key_events", "conversion_model",
  "creative_assets", "content_capacity", "constraints", "response_speed",
  "top_priority", "risk_tolerance", "final_confirmed_inputs",
] as const;

function obj(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? input as Record<string, unknown> : {};
}

function nestedData(input: unknown): Record<string, unknown> {
  const root = obj(input);
  const state = obj(root.state);
  const data = state.data;
  return data && typeof data === "object" ? data as Record<string, unknown> : root;
}

function str(data: Record<string, unknown>, key: string, fallback = ""): string {
  return typeof data[key] === "string" ? data[key] as string : fallback;
}

function num(data: Record<string, unknown>, key: string, fallback = 0): number {
  return typeof data[key] === "number" && Number.isFinite(data[key] as number)
    ? data[key] as number
    : fallback;
}

function bool(data: Record<string, unknown>, key: string, fallback = false): boolean {
  return typeof data[key] === "boolean" ? data[key] as boolean : fallback;
}

function arr(data: Record<string, unknown>, key: string): string[] {
  return Array.isArray(data[key]) ? (data[key] as unknown[]).filter((v): v is string => typeof v === "string") : [];
}

/**
 * Converts either raw Wizard storage ({data:{...}}) or a plain Wizard object
 * into the canonical normalized contract.
 */
export function canonicalizeWizardInput(input: unknown): CanonicalWizardInput {
  const data = nestedData(input);
  return {
    build_mode: str(data, "build_mode"),
    business_type: str(data, "business_type"),
    offer_description: str(data, "offer_description"),
    sales_motion: str(data, "sales_motion"),
    customer_problem: str(data, "customer_problem"),
    key_value_drivers: arr(data, "key_value_drivers"),
    usp: str(data, "usp"),
    primary_objective: str(data, "primary_objective"),
    secondary_objectives: arr(data, "secondary_objectives"),
    north_star_kpi: str(data, "north_star_kpi"),
    existing_assets: arr(data, "existing_assets"),
    previous_campaigns_status: str(data, "previous_campaigns_status"),
    past_performance_notes: str(data, "past_performance_notes"),
    ideal_customer: str(data, "ideal_customer"),
    awareness_level: str(data, "awareness_level"),
    audience_segments: arr(data, "audience_segments"),
    geo_scope: str(data, "geo_scope"),
    target_locations: arr(data, "target_locations"),
    offer_type: str(data, "offer_type"),
    core_message: str(data, "core_message"),
    objections: arr(data, "objections"),
    persuasion_angle: str(data, "persuasion_angle"),
    conversion_destination: str(data, "conversion_destination"),
    ad_channels: arr(data, "ad_channels"),
    campaign_direction: str(data, "campaign_direction"),
    budget_band: str(data, "budget_band"),
    budget_flexibility: str(data, "budget_flexibility"),
    average_order_value: num(data, "average_order_value"),
    profit_margin: num(data, "profit_margin"),
    max_cac: num(data, "max_cac"),
    tracking_status: str(data, "tracking_status"),
    tracking_tools: arr(data, "tracking_tools"),
    key_events: arr(data, "key_events"),
    conversion_model: str(data, "conversion_model"),
    creative_assets: arr(data, "creative_assets"),
    content_capacity: str(data, "content_capacity"),
    constraints: arr(data, "constraints"),
    response_speed: str(data, "response_speed"),
    top_priority: str(data, "top_priority"),
    risk_tolerance: str(data, "risk_tolerance"),
    final_confirmed_inputs: bool(data, "final_confirmed_inputs"),
  };
}

export function extractRawWizardData(storageValue: string | null): Record<string, unknown> | null {
  if (!storageValue) return null;
  try {
    return nestedData(JSON.parse(storageValue));
  } catch {
    return null;
  }
}

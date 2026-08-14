/**
 * Backward-compatible Wizard mapper.
 * The canonical contract lives in ./contracts/wizard-input.
 *
 * CanonicalWizardInput is the single source of truth.
 * This file is the only Wizard -> AIWizardPayload projection.
 */

import { AIWizardPayload } from "./ai-types";
import {
  CanonicalWizardInput,
  canonicalizeWizardInput,
  extractRawWizardData,
} from "./contracts/wizard-input";

export type RawWizardData = CanonicalWizardInput;

export { canonicalizeWizardInput, extractRawWizardData };

function budgetToDaily(band: string): number {
  const map: Record<string, number> = {
    under_50: 30,
    "50_100": 75,
    "100_300": 200,
    "300_500": 400,
    "500_1000": 750,
    "1000_plus": 1500,
  };
  return map[band] ?? 0;
}

export function mapToAIWizardPayload(raw: RawWizardData): AIWizardPayload {
  const dailyBudget = budgetToDaily(raw.budget_band);

  return {
    source_wizard_input: raw,
    business_name: "",
    business_type: raw.business_type,
    industry: "",
    website_url: "",
    offer_description: raw.offer_description,
    offer_type: raw.offer_type,
    price_range: raw.budget_band,
    unique_selling_points: [
      ...raw.key_value_drivers,
      ...(raw.usp ? [raw.usp] : []),
    ],
    primary_goal: raw.primary_objective,
    secondary_goals: raw.secondary_objectives,
    success_metric: raw.north_star_kpi,
    target_audience: raw.ideal_customer,
    audience_age_range: "",
    audience_gender: "",
    audience_locations: raw.target_locations,
    audience_interests: raw.audience_segments,
    audience_pain_points: raw.objections,
    current_channels: raw.existing_assets,
    current_monthly_budget: 0,
    current_results:
      raw.previous_campaigns_status || raw.past_performance_notes,
    preferred_channels: raw.ad_channels,
    daily_budget: dailyBudget,
    monthly_budget: dailyBudget * 30,
    budget_flexibility: raw.budget_flexibility,
    has_creative_assets: raw.creative_assets.length > 0,
    creative_asset_types: raw.creative_assets,
    brand_guidelines: raw.core_message,
    has_tracking_setup:
      raw.tracking_status === "complete" ||
      raw.tracking_status === "configured",
    tracking_platforms: raw.tracking_tools,
    conversion_events: raw.key_events,
    campaign_duration: 0,
    launch_date: "",
    urgency_level: raw.response_speed,
    main_competitors: [],
    competitor_advantage: "",
  };
}

export function getWizardDataFromStorage(): AIWizardPayload | null {
  if (typeof window === "undefined") return null;
  const raw = extractRawWizardData(localStorage.getItem("wizard-draft"));
  if (!raw) return null;
  return mapToAIWizardPayload(canonicalizeWizardInput(raw));
}

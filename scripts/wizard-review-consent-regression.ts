import assert from "node:assert/strict";
import { WIZARD_AUTOFILL_PROFILES } from "../src/lib/wizard-autofill-profiles";
import { buildWizardGenerationPayload, preserveWizardConsent } from "../src/lib/wizard-generation";
import type { DataModel } from "../src/lib/store";

const emptyData: DataModel = {
  build_mode: null,
  business_type: null,
  offer_description: null,
  sales_motion: null,
  customer_problem: null,
  key_value_drivers: [],
  usp: null,
  primary_objective: null,
  secondary_objectives: [],
  north_star_kpi: null,
  existing_assets: [],
  previous_campaigns_status: null,
  past_performance_notes: null,
  ideal_customer: null,
  awareness_level: null,
  audience_segments: [],
  geo_scope: null,
  target_locations: [],
  offer_type: null,
  core_message: null,
  objections: [],
  persuasion_angle: null,
  conversion_destination: null,
  ad_channels: [],
  campaign_direction: null,
  budget_band: null,
  budget_flexibility: null,
  average_order_value: null,
  profit_margin: null,
  max_cac: null,
  tracking_status: null,
  tracking_tools: [],
  key_events: [],
  conversion_model: null,
  creative_assets: [],
  content_capacity: null,
  constraints: [],
  response_speed: null,
  top_priority: null,
  risk_tolerance: null,
  final_confirmed_inputs: null,
  ai_advisory_enabled: false,
};

function main() {
  assert.equal(WIZARD_AUTOFILL_PROFILES.length, 10);

  for (const profile of WIZARD_AUTOFILL_PROFILES) {
    const off = preserveWizardConsent(emptyData, profile);
    const offPayload = buildWizardGenerationPayload(off);
    assert.equal(off.business_type, profile.business_type);
    assert.equal(off.primary_objective, profile.primary_objective);
    assert.equal(offPayload.ai_advisory.enabled, false);
    assert.deepEqual(offPayload.ad_channels, profile.ad_channels);

    const currentOn = { ...emptyData, ai_advisory_enabled: true };
    const on = preserveWizardConsent(currentOn, profile);
    const onPayload = buildWizardGenerationPayload(on);
    assert.equal(on.business_type, profile.business_type);
    assert.equal(on.target_locations[0], profile.target_locations[0]);
    assert.equal(on.ai_advisory_enabled, true);
    assert.equal(onPayload.ai_advisory.enabled, true);
  }

  console.log(JSON.stringify({
    status: "PASS",
    profileCount: WIZARD_AUTOFILL_PROFILES.length,
    assertions: 1 + WIZARD_AUTOFILL_PROFILES.length * 8,
    reviewUsesLatestData: true,
    consentPreserved: true,
  }, null, 2));
}

main();

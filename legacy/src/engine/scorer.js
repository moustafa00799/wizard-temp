/**
 * Scoring Engine
 * Calculates readiness_score and related metrics
 */

const {
  ASSET_SCORES,
  CREATIVE_SCORES,
  CONTENT_CAPACITY_BONUS,
  TRACKING_STATUS_SCORES
} = require("../data/funnelDefinitions");

/**
 * Calculate readiness score (0-100)
 * Based on: assets, tracking, content, conversion path, data completeness
 */
function calculateReadinessScore(input) {
  const {
    existing_assets,
    creative_assets,
    content_capacity,
    tracking_status,
    tracking_tools,
    conversion_destination,
    sales_motion,
    business_type
  } = input;

  // RS-001: Assets Readiness (25 points max)
  let assetsScore = 0;
  if (existing_assets && Array.isArray(existing_assets)) {
    if (existing_assets.includes("nothing_ready")) {
      assetsScore = 0;
    } else {
      existing_assets.forEach(asset => {
        assetsScore += ASSET_SCORES[asset] || 0;
      });
    }
  }
  const assetsReadiness = Math.min(assetsScore, 25);

  // RS-002: Tracking Readiness (25 points max)
  const trackingScore = TRACKING_STATUS_SCORES[tracking_status] || 0;

  // Bonus for tracking tools
  let trackingBonus = 0;
  if (tracking_tools && Array.isArray(tracking_tools)) {
    tracking_tools.forEach(tool => {
      if (tool === "pixel") trackingBonus += 3;
      if (tool === "capi") trackingBonus += 3;
      if (tool === "ga4") trackingBonus += 2;
      if (tool === "gtm") trackingBonus += 2;
    });
  }
  const trackingReadiness = Math.min(trackingScore + trackingBonus, 25);

  // RS-003: Content Readiness (20 points max)
  let contentScore = 0;
  if (creative_assets && Array.isArray(creative_assets)) {
    if (creative_assets.includes("none")) {
      contentScore = 0;
    } else {
      creative_assets.forEach(asset => {
        contentScore += CREATIVE_SCORES[asset] || 0;
      });
    }
  }

  // Content capacity bonus
  const capacityBonus = CONTENT_CAPACITY_BONUS[content_capacity] || 0;
  const contentReadiness = Math.min(contentScore + capacityBonus, 20);

  // RS-004: Conversion Path Readiness (15 points max)
  let pathScore = 0;

  const hasWebsite = existing_assets?.some(a => ["website", "landing_page", "store"].includes(a));
  const hasWhatsApp = existing_assets?.includes("whatsapp_business");
  const hasApp = business_type === "app";

  if (["website", "store"].includes(conversion_destination) && hasWebsite) {
    pathScore = 15;
  } else if (conversion_destination === "whatsapp" && hasWhatsApp) {
    pathScore = 15;
  } else if (conversion_destination === "app" && hasApp) {
    pathScore = 15;
  } else if (["form", "call", "booking"].includes(conversion_destination)) {
    pathScore = 10; // Can work without landing page but better with one
  } else {
    pathScore = 5;
  }

  // Bonus for multi-channel flexibility
  if (sales_motion === "multi_channel") {
    pathScore += 3;
  }

  const conversionPathReadiness = Math.min(pathScore, 15);

  // RS-005: Data Completeness (15 points max)
  const totalFields = 37; // Approximate number of fields in WizardInput
  const filledFields = countFilledFields(input);
  const dataCompleteness = (filledFields / totalFields) * 100;
  const dataCompletenessScore = Math.min(dataCompleteness * 0.15, 15);

  // RS-006: Final Calculation
  const readinessScore = Math.round(
    assetsReadiness +
    trackingReadiness +
    contentReadiness +
    conversionPathReadiness +
    dataCompletenessScore
  );

  const clampedScore = Math.max(0, Math.min(100, readinessScore));

  let readinessLevel;
  if (clampedScore >= 80) readinessLevel = "excellent";
  else if (clampedScore >= 60) readinessLevel = "good";
  else if (clampedScore >= 40) readinessLevel = "fair";
  else if (clampedScore >= 20) readinessLevel = "weak";
  else readinessLevel = "critical";

  return {
    value: clampedScore,
    level: readinessLevel,
    breakdown: {
      assets: assetsReadiness,
      tracking: trackingReadiness,
      content: contentReadiness,
      conversion_path: conversionPathReadiness,
      data_completeness: Math.round(dataCompletenessScore)
    },
    confidence: 80,
    reasoning: `Readiness score ${clampedScore} (${readinessLevel}): assets ${assetsReadiness}, tracking ${trackingReadiness}, content ${contentReadiness}, path ${conversionPathReadiness}, data ${Math.round(dataCompletenessScore)}.`,
    rule_id: "RS-001"
  };
}

/**
 * Count filled fields in input object
 */
function countFilledFields(input) {
  if (!input || typeof input !== "object") return 0;

  let count = 0;
  const fields = [
    "business_type", "business_name", "industry",
    "primary_objective", "build_mode", "campaign_direction",
    "ideal_customer", "awareness_level", "audience_segments",
    "geo_scope", "target_locations",
    "ad_channels", "budget_band", "budget_flexibility",
    "average_order_value", "profit_margin", "max_cac",
    "offer_type", "persuasion_angle", "core_message",
    "usp", "customer_problem", "key_value_drivers", "objections",
    "existing_assets", "creative_assets", "content_capacity",
    "tracking_status", "tracking_tools", "key_events",
    "conversion_model", "conversion_destination", "sales_motion",
    "response_speed", "previous_campaigns_status", "constraints",
    "top_priority", "risk_tolerance", "north_star_kpi"
  ];

  fields.forEach(field => {
    const value = input[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) count++;
      } else if (typeof value === "string" && value.trim() !== "") {
        count++;
      } else if (typeof value === "number") {
        count++;
      } else if (typeof value === "boolean") {
        count++;
      }
    }
  });

  return count;
}

module.exports = {
  calculateReadinessScore
};

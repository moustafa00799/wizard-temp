/**
 * Strategy Rules (SS-001 to SS-005)
 * Determine recommended objective, channels, funnel type, confidence, and timeline
 */

const {
  CHANNEL_SCORES_BASE,
  SALES_MOTION_BONUSES,
  CONVERSION_DESTINATION_BONUSES,
  OBJECTIVE_MAP,
  FUNNEL_DEFINITIONS
} = require("../data/funnelDefinitions");

/**
 * SS-001: Determine Recommended Objective
 * Inputs: build_mode, previous_campaigns_status, primary_objective
 * Output: recommended_objective (string) + confidence + reasoning
 */
function determineObjective(input) {
  let objective;
  let confidence = 75;
  let reasoning;

  const { build_mode, previous_campaigns_status, primary_objective } = input;

  if (build_mode === "new_campaign") {
    if (previous_campaigns_status === "first_time") {
      objective = "awareness";
      confidence = 80;
      reasoning = "First campaign should focus on awareness before conversion.";
    } else if (previous_campaigns_status === "weak") {
      objective = "testing";
      confidence = 75;
      reasoning = "Previous campaigns were weak; testing mode to find what works.";
    } else {
      objective = primary_objective;
      confidence = 85;
      reasoning = `Proceeding with primary objective: ${primary_objective}.`;
    }
  } else if (build_mode === "optimize_existing") {
    if (previous_campaigns_status === "weak") {
      objective = "testing";
      confidence = 75;
      reasoning = "Optimizing weak campaigns requires testing new angles.";
    } else {
      objective = primary_objective;
      confidence = 85;
      reasoning = `Optimizing existing campaigns with objective: ${primary_objective}.`;
    }
  } else if (build_mode === "diagnose_business") {
    objective = "awareness";
    confidence = 80;
    reasoning = "Business diagnosis starts with awareness to understand market fit.";
  } else if (build_mode === "test_plan") {
    objective = "testing";
    confidence = 90;
    reasoning = "Test plan mode explicitly sets objective to testing.";
  } else if (build_mode === "restructure_account") {
    objective = primary_objective;
    confidence = 70;
    reasoning = `Restructuring account while maintaining ${primary_objective} objective.`;
  }

  return {
    value: objective,
    confidence,
    reasoning,
    rule_id: "SS-001"
  };
}

/**
 * SS-002: Channel Scoring Matrix
 * Inputs: business_type, ad_channels, sales_motion, conversion_destination
 * Output: recommended_channels (array) + channel_scores + confidence
 */
function scoreChannels(input) {
  const { business_type, ad_channels, sales_motion, conversion_destination } = input;

  // Start with base scores for business type
  const baseScores = { ...CHANNEL_SCORES_BASE[business_type] } || {};
  const scores = {};

  // Initialize all channels with 0
  const allChannels = ["meta", "google_ads", "tiktok_ads", "snapchat_ads", "youtube", "linkedin", "x"];
  allChannels.forEach(ch => {
    scores[ch] = baseScores[ch] || 0;
  });

  // Apply sales motion bonuses
  if (SALES_MOTION_BONUSES[sales_motion]) {
    const bonuses = SALES_MOTION_BONUSES[sales_motion];
    Object.keys(bonuses).forEach(ch => {
      if (scores[ch] !== undefined) {
        scores[ch] += bonuses[ch];
      }
    });
  }

  // Apply conversion destination bonuses
  if (CONVERSION_DESTINATION_BONUSES[conversion_destination]) {
    const bonuses = CONVERSION_DESTINATION_BONUSES[conversion_destination];
    Object.keys(bonuses).forEach(ch => {
      if (scores[ch] !== undefined) {
        scores[ch] += bonuses[ch];
      }
    });
  }

  // Filter to only selected channels (or all if none selected)
  const channelsToConsider = ad_channels && ad_channels.length > 0
    ? ad_channels.filter(ch => ch !== "multi_channel")
    : allChannels;

  // Sort by score descending
  const sortedChannels = channelsToConsider
    .map(ch => ({ channel: ch, score: scores[ch] || 0 }))
    .sort((a, b) => b.score - a.score);

  // Select top channels (up to 3, minimum score 10)
  const recommended = sortedChannels
    .filter(item => item.score >= 10)
    .slice(0, 3)
    .map(item => item.channel);

  // If no channels qualify, fall back to top 2
  if (recommended.length === 0 && sortedChannels.length > 0) {
    recommended.push(sortedChannels[0].channel);
    if (sortedChannels.length > 1) {
      recommended.push(sortedChannels[1].channel);
    }
  }

  const confidence = Math.min(
    70 + (recommended.length * 5),
    95
  );

  return {
    value: recommended,
    channel_scores: scores,
    confidence,
    reasoning: `Top channels for ${business_type} with ${sales_motion} sales motion: ${recommended.join(", ")}.`,
    rule_id: "SS-002"
  };
}

/**
 * SS-003: Determine Funnel Type
 * Inputs: awareness_level, primary_objective, offer_type, business_type
 * Output: funnel_type (string) + stages + confidence
 */
function determineFunnel(input) {
  const { awareness_level, primary_objective, offer_type, business_type } = input;

  let funnelType;
  let confidence = 75;
  let reasoning;

  // Decision tree based on awareness level and objective
  if (awareness_level === "unaware") {
    funnelType = "education_funnel";
    confidence = 80;
    reasoning = "Unaware audience needs education before conversion.";
  } else if (awareness_level === "problem_aware") {
    funnelType = "solution_funnel";
    confidence = 80;
    reasoning = "Problem-aware audience needs solution presentation.";
  } else if (awareness_level === "solution_aware") {
    if (offer_type === "no_clear_offer") {
      funnelType = "comparison_funnel";
      confidence = 75;
      reasoning = "Solution-aware but no clear offer — need comparison.";
    } else {
      funnelType = "trust_funnel";
      confidence = 80;
      reasoning = "Solution-aware with offer — build trust and convert.";
    }
  } else if (awareness_level === "brand_aware") {
    if (primary_objective === "sales" || primary_objective === "leads") {
      funnelType = "direct_conversion";
      confidence = 85;
      reasoning = "Brand-aware audience ready for direct conversion.";
    } else {
      funnelType = "trust_funnel";
      confidence = 75;
      reasoning = "Brand-aware but objective is not direct conversion.";
    }
  } else if (awareness_level === "purchase_ready") {
    funnelType = "direct_conversion";
    confidence = 90;
    reasoning = "Purchase-ready audience — direct conversion is optimal.";
  }

  // Override for WhatsApp-based businesses
  if (input.sales_motion === "whatsapp" && input.conversion_destination === "whatsapp") {
    funnelType = "direct_whatsapp";
    confidence = 85;
    reasoning = "WhatsApp sales motion requires WhatsApp-optimized funnel.";
  }

  // Override for call-based B2B
  if (business_type === "b2b" && input.sales_motion === "call") {
    funnelType = "lead_gen_call";
    confidence = 85;
    reasoning = "B2B with call sales motion uses lead generation funnel.";
  }

  const funnelDef = FUNNEL_DEFINITIONS[funnelType];

  return {
    value: funnelType,
    stages: funnelDef ? funnelDef.stages.map(s => s.name) : [],
    confidence,
    reasoning,
    rule_id: "SS-003"
  };
}

/**
 * SS-004: Calculate Confidence Score
 * Inputs: readiness_score, tracking_status, existing_assets
 * Output: confidence_score (0-100) + breakdown
 */
function calculateConfidence(input, readinessScore) {
  const { tracking_status, existing_assets, creative_assets, content_capacity } = input;

  let trackingConfidence = 0;
  if (tracking_status === "ready") trackingConfidence = 30;
  else if (tracking_status === "partial") trackingConfidence = 20;
  else if (tracking_status === "unknown") trackingConfidence = 5;
  else if (tracking_status === "missing") trackingConfidence = 0;
  else if (tracking_status === "issues") trackingConfidence = 5;

  const assetsConfidence = Math.min((existing_assets?.length || 0) * 5, 25);
  const contentConfidence = creative_assets?.includes("none") ? 0 : Math.min((creative_assets?.length || 0) * 5, 20);
  const capacityBonus = content_capacity === "easy" ? 10 : content_capacity === "slow" ? 5 : 0;

  const totalConfidence = Math.min(
    trackingConfidence + assetsConfidence + contentConfidence + capacityBonus + (readinessScore * 0.15),
    100
  );

  return {
    value: Math.round(totalConfidence),
    breakdown: {
      tracking: trackingConfidence,
      assets: assetsConfidence,
      content: contentConfidence,
      capacity: capacityBonus,
      readiness: Math.round(readinessScore * 0.15)
    },
    confidence: 85,
    reasoning: `Confidence based on tracking (${trackingConfidence}), assets (${assetsConfidence}), content (${contentConfidence}), capacity (${capacityBonus}).`,
    rule_id: "SS-004"
  };
}

/**
 * SS-005: Estimate Timeline
 * Inputs: readiness_score, build_mode, existing_assets
 * Output: days, label, factors
 */
function estimateTimeline(input, readinessScore) {
  const { build_mode, existing_assets } = input;

  let baseDays;

  if (build_mode === "new_campaign") {
    baseDays = 14;
  } else if (build_mode === "optimize_existing") {
    baseDays = 7;
  } else if (build_mode === "diagnose_business") {
    baseDays = 3;
  } else if (build_mode === "test_plan") {
    baseDays = 5;
  } else if (build_mode === "restructure_account") {
    baseDays = 10;
  }

  // Adjust based on readiness
  if (readinessScore >= 80) baseDays -= 3;
  else if (readinessScore >= 60) baseDays -= 1;
  else if (readinessScore >= 40) baseDays += 2;
  else if (readinessScore >= 20) baseDays += 5;
  else baseDays += 7;

  // Adjust for missing assets
  if (existing_assets?.includes("nothing_ready")) {
    baseDays += 7;
  }

  const factors = [];
  if (readinessScore < 60) factors.push("Low readiness score requires more setup time");
  if (existing_assets?.includes("nothing_ready")) factors.push("No existing assets — need to create everything");
  if (build_mode === "new_campaign") factors.push("New campaign requires full setup");
  if (input.tracking_status === "missing") factors.push("Missing tracking setup");

  let label;
  if (baseDays <= 3) label = "Immediate (1-3 days)";
  else if (baseDays <= 7) label = "Quick (1 week)";
  else if (baseDays <= 14) label = "Standard (2 weeks)";
  else if (baseDays <= 21) label = "Extended (3 weeks)";
  else label = "Complex (1+ month)";

  return {
    days: Math.max(baseDays, 1),
    label,
    factors: factors.length > 0 ? factors : ["Standard timeline based on inputs"],
    confidence: 70,
    reasoning: `Timeline estimated at ${baseDays} days based on build mode and readiness.`,
    rule_id: "SS-005"
  };
}

module.exports = {
  determineObjective,
  scoreChannels,
  determineFunnel,
  calculateConfidence,
  estimateTimeline
};

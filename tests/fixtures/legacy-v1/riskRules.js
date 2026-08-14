/**
 * Risk Rules (RF-001 to RF-004)
 * Determine critical flags, risk score, and pre-launch fixes
 */

const {
  TRACKING_STATUS_SCORES,
  BUDGET_MAP,
  CONSTRAINT_RISK_WEIGHTS,
  RESPONSE_SPEED_RISK
} = require("../../../src/lib/rules/data/funnelDefinitions");

/**
 * RF-001: Critical Flags Detection
 * Inputs: tracking_status, existing_assets, budget_band, sales_motion, max_cac, average_order_value
 * Output: critical flags array
 */
function detectCriticalFlags(input) {
  const critical = [];
  const warnings = [];
  const recommendations = [];

  const {
    tracking_status,
    existing_assets,
    budget_band,
    sales_motion,
    max_cac,
    average_order_value,
    primary_objective,
    ad_channels,
    awareness_level,
    campaign_direction
  } = input;

  // Critical: No tracking
  if (tracking_status === "missing") {
    critical.push({
      id: "CRIT-001",
      message: "No tracking setup detected. Cannot measure campaign performance.",
      impact: "Cannot optimize or measure ROI",
      action: "Install Meta Pixel, Google Analytics 4, and conversion events before launch."
    });
  }

  // Critical: No assets at all
  if (existing_assets?.includes("nothing_ready")) {
    critical.push({
      id: "CRIT-002",
      message: "No digital assets ready (website, landing page, or store).",
      impact: "No destination for ad traffic",
      action: "Create a landing page or website before launching ads."
    });
  }

  // Critical: CAC > AOV
  if (max_cac && average_order_value && max_cac > average_order_value) {
    critical.push({
      id: "CRIT-003",
      message: `Max CAC (${max_cac}) exceeds Average Order Value (${average_order_value}).`,
      impact: "Campaign will be unprofitable",
      action: "Reduce CAC target or increase AOV through upsells/bundles."
    });
  }

  // Critical: Website objective but no website
  if (primary_objective === "sales" && sales_motion === "website_purchase") {
    const hasWebsite = existing_assets?.some(a =>
      ["website", "landing_page", "store"].includes(a)
    );
    if (!hasWebsite) {
      critical.push({
        id: "CRIT-004",
        message: "Sales objective with website purchase but no website/landing page.",
        impact: "No conversion destination",
        action: "Create an e-commerce store or landing page before launch."
      });
    }
  }

  // Critical: Too many channels with tiny budget
  if (budget_band === "under_100" && ad_channels?.length > 2) {
    critical.push({
      id: "CRIT-005",
      message: `Budget under $100 with ${ad_channels.length} channels — insufficient for meaningful data.`,
      impact: "No statistical significance, wasted budget",
      action: "Focus on 1-2 channels maximum with this budget."
    });
  }

  // Critical: Retargeting unaware audience
  if (campaign_direction === "retargeting" && awareness_level === "unaware") {
    critical.push({
      id: "CRIT-006",
      message: "Cannot retarget an unaware audience — no prior engagement exists.",
      impact: "Retargeting will have zero audience",
      action: "Switch to prospecting campaign first to build audience."
    });
  }

  // Warnings
  if (tracking_status === "partial") {
    warnings.push({
      id: "WARN-001",
      message: "Tracking is only partially set up.",
      impact: "Incomplete conversion data",
      action: "Complete tracking setup for all key events."
    });
  }

  if (budget_band === "unknown") {
    warnings.push({
      id: "WARN-002",
      message: "Budget not specified.",
      impact: "Cannot recommend optimal budget allocation",
      action: "Set a daily budget range for better recommendations."
    });
  }

  if (input.content_capacity === "no") {
    warnings.push({
      id: "WARN-003",
      message: "No content creation capacity.",
      impact: "Ad creative fatigue, limited testing",
      action: "Consider hiring a designer or using UGC/creative templates."
    });
  }

  // Recommendations
  if (input.previous_campaigns_status === "first_time") {
    recommendations.push({
      id: "REC-001",
      message: "First-time advertiser — start with a small test budget.",
      action: "Allocate 30-40% of budget for testing different audiences and creatives."
    });
  }

  if (input.offer_type === "no_clear_offer") {
    recommendations.push({
      id: "REC-002",
      message: "No clear offer defined.",
      action: "Create a compelling offer (discount, free trial, guarantee) to improve conversion."
    });
  }

  return {
    critical,
    warnings,
    recommendations,
    confidence: 85,
    reasoning: `${critical.length} critical, ${warnings.length} warnings, ${recommendations.length} recommendations detected.`,
    rule_id: "RF-001"
  };
}

/**
 * RF-004: Risk Score Calculation
 * Inputs: tracking_status, budget_band, creative_assets, content_capacity, response_speed, constraints
 * Output: risk_score (0-100) + level + breakdown
 */
function calculateRiskScore(input) {
  const {
    tracking_status,
    budget_band,
    creative_assets,
    content_capacity,
    response_speed,
    constraints,
    primary_objective,
    sales_motion,
    max_cac,
    average_order_value,
    previous_campaigns_status,
    existing_assets
  } = input;

  // Tracking risk (30 points max)
  let trackingRisk = TRACKING_STATUS_SCORES[tracking_status] || 20;
  if (trackingRisk > 30) trackingRisk = 30;

  // Budget risk (20 points max)
  let budgetRisk = 0;
  if (budget_band === "unknown") budgetRisk = 20;
  else if (budget_band === "under_100" && ["sales", "app_installs"].includes(primary_objective)) budgetRisk = 15;
  else if (budget_band === "under_100") budgetRisk = 10;
  else if (budget_band === "100_300") budgetRisk = 5;

  // Content risk (20 points max)
  let contentRisk = 0;
  if (creative_assets?.includes("none") && content_capacity === "no") contentRisk = 20;
  else if (creative_assets?.includes("none") && ["hard", "slow"].includes(content_capacity)) contentRisk = 15;
  else if (creative_assets?.includes("none") && content_capacity === "easy") contentRisk = 10;
  else if (content_capacity === "no" && (!creative_assets || creative_assets.length < 3)) contentRisk = 10;

  // Response risk (15 points max)
  let responseRisk = RESPONSE_SPEED_RISK[response_speed] || 10;
  if (responseRisk > 15) responseRisk = 15;

  // Constraints risk (15 points max)
  let constraintsRisk = 0;
  if (constraints && Array.isArray(constraints)) {
    constraints.forEach(c => {
      constraintsRisk += CONSTRAINT_RISK_WEIGHTS[c] || 2;
    });
  }
  if (constraintsRisk > 15) constraintsRisk = 15;

  // Calculate base risk
  let riskScore = trackingRisk + budgetRisk + contentRisk + responseRisk + constraintsRisk;

  // Additional risk factors
  if (primary_objective === "sales" && !["website_purchase", "multi_channel"].includes(sales_motion)) {
    riskScore += 5;
  }

  if (max_cac && average_order_value && max_cac > average_order_value) {
    riskScore += 10;
  }

  if (previous_campaigns_status === "weak") {
    riskScore += 5;
  }

  if (existing_assets?.includes("nothing_ready")) {
    riskScore += 10;
  }

  // Clamp to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskLevel;
  if (riskScore >= 80) riskLevel = "critical";
  else if (riskScore >= 60) riskLevel = "high";
  else if (riskScore >= 40) riskLevel = "medium";
  else riskLevel = "low";

  return {
    value: riskScore,
    level: riskLevel,
    breakdown: {
      tracking: trackingRisk,
      budget: budgetRisk,
      content: contentRisk,
      response: responseRisk,
      constraints: constraintsRisk
    },
    confidence: 80,
    reasoning: `Risk score ${riskScore} (${riskLevel}): tracking ${trackingRisk}, budget ${budgetRisk}, content ${contentRisk}, response ${responseRisk}, constraints ${constraintsRisk}.`,
    rule_id: "RF-004"
  };
}

/**
 * RF-003: Pre-Launch Fixes
 * Inputs: risk_flags, existing_assets, tracking_status
 * Output: must_fix, should_fix, nice_to_have, estimated_fix_time
 */
function generatePreLaunchFixes(input, riskFlags) {
  const mustFix = [];
  const shouldFix = [];
  const niceToHave = [];

  const { existing_assets, tracking_status, tracking_tools, creative_assets } = input;

  // Must fix: Tracking
  if (tracking_status === "missing") {
    mustFix.push({
      item: "Install tracking pixel and conversion events",
      priority: "critical",
      estimated_time: "2-4 hours",
      action: "Set up Meta Pixel, GA4, and define conversion events."
    });
  } else if (tracking_status === "partial") {
    mustFix.push({
      item: "Complete tracking setup",
      priority: "high",
      estimated_time: "1-2 hours",
      action: "Add missing conversion events and verify pixel firing."
    });
  }

  // Must fix: Website/landing page
  if (existing_assets?.includes("nothing_ready")) {
    mustFix.push({
      item: "Create landing page or website",
      priority: "critical",
      estimated_time: "1-3 days",
      action: "Build a simple landing page with clear CTA and form."
    });
  }

  // Must fix: CAPI for iOS 14+
  if (input.ad_channels?.includes("meta") && !tracking_tools?.includes("capi")) {
    shouldFix.push({
      item: "Set up Conversions API (CAPI)",
      priority: "high",
      estimated_time: "2-3 hours",
      action: "Install server-side tracking to complement browser pixel."
    });
  }

  // Should fix: Creative assets
  if (!creative_assets || creative_assets.length === 0 || creative_assets.includes("none")) {
    shouldFix.push({
      item: "Prepare ad creatives (images or videos)",
      priority: "high",
      estimated_time: "1-2 days",
      action: "Create at least 3-5 ad variants with different hooks."
    });
  }

  // Should fix: UTM parameters
  if (!tracking_tools?.includes("utm")) {
    shouldFix.push({
      item: "Set up UTM tracking",
      priority: "medium",
      estimated_time: "30 minutes",
      action: "Add UTM parameters to all ad URLs for source tracking."
    });
  }

  // Nice to have: A/B testing framework
  niceToHave.push({
    item: "Set up A/B testing framework",
    priority: "low",
    estimated_time: "2-4 hours",
    action: "Use Meta's A/B testing or Google Optimize for landing pages."
  });

  // Nice to have: CRM integration
  if (!existing_assets?.includes("crm")) {
    niceToHave.push({
      item: "Connect CRM for lead tracking",
      priority: "low",
      estimated_time: "2-3 hours",
      action: "Integrate CRM to track lead quality and lifetime value."
    });
  }

  // Calculate total estimated fix time
  let totalHours = 0;
  mustFix.forEach(f => {
    const match = f.estimated_time.match(/(\d+)(?:-(\d+))?\s*hour/);
    if (match) {
      const max = match[2] ? parseInt(match[2]) : parseInt(match[1]);
      totalHours += max;
    }
    const dayMatch = f.estimated_time.match(/(\d+)(?:-(\d+))?\s*day/);
    if (dayMatch) {
      const max = dayMatch[2] ? parseInt(dayMatch[2]) : parseInt(dayMatch[1]);
      totalHours += max * 8;
    }
  });

  let recommendation;
  if (mustFix.length === 0) {
    recommendation = "Ready to launch — no critical fixes required.";
  } else if (totalHours <= 8) {
    recommendation = `Launch possible after ${mustFix.length} critical fixes (~${totalHours} hours).`;
  } else if (totalHours <= 24) {
    recommendation = `Launch after ${mustFix.length} critical fixes (~${Math.ceil(totalHours / 8)} days).`;
  } else {
    recommendation = `Significant setup needed. Estimated ${Math.ceil(totalHours / 8)} days before launch.`;
  }

  return {
    must_fix: mustFix,
    should_fix: shouldFix,
    nice_to_have: niceToHave,
    estimated_fix_time: totalHours > 8 ? `${Math.ceil(totalHours / 8)} days` : `${totalHours} hours`,
    recommendation,
    confidence: 75,
    reasoning: `${mustFix.length} must-fix, ${shouldFix.length} should-fix, ${niceToHave.length} nice-to-have items identified.`,
    rule_id: "RF-003"
  };
}

module.exports = {
  detectCriticalFlags,
  calculateRiskScore,
  generatePreLaunchFixes
};

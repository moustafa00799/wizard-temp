/**
 * Budget Rules (BS-001 to BS-005)
 * Determine daily budget, channel allocation, test budget, scale budget, and CAC target
 */

const { BUDGET_MAP } = require("../../../src/lib/rules/data/funnelDefinitions");

/**
 * BS-001: Daily Budget Mapping
 * Inputs: budget_band, budget_flexibility, business_type
 * Output: daily_budget {min, recommended, max, flexible}
 */
function mapDailyBudget(input) {
  const { budget_band, budget_flexibility } = input;

  const mapping = BUDGET_MAP[budget_band] || BUDGET_MAP.unknown;

  let recommended = mapping.recommended;
  let min = mapping.min;
  let max = mapping.max;

  // Adjust for business type
  if (input.business_type === "ecommerce" && recommended) {
    recommended = Math.round(recommended * 1.2);
    if (max) max = Math.round(max * 1.2);
  } else if (input.business_type === "local_service" && recommended) {
    recommended = Math.round(recommended * 0.8);
    if (min) min = Math.round(min * 0.8);
  }

  const flexible = budget_flexibility !== "fixed";

  return {
    value: {
      min,
      recommended,
      max,
      flexible
    },
    confidence: budget_band === "unknown" ? 40 : 85,
    reasoning: `Daily budget mapped from ${budget_band} band. ${flexible ? "Flexible" : "Fixed"} budget mode.`,
    rule_id: "BS-001"
  };
}

/**
 * BS-002: Channel Budget Allocation
 * Inputs: recommended_channels, budget_band, primary_objective
 * Output: channel_allocation {channel: percentage}
 */
function allocateChannelBudget(input, recommendedChannels) {
  const { budget_band, primary_objective } = input;

  if (!recommendedChannels || recommendedChannels.length === 0) {
    return {
      value: {},
      confidence: 0,
      reasoning: "No channels recommended for allocation.",
      rule_id: "BS-002"
    };
  }

  const allocation = {};
  const channelCount = recommendedChannels.length;

  if (channelCount === 1) {
    allocation[recommendedChannels[0]] = 100;
  } else if (channelCount === 2) {
    // Primary channel gets 60-70%, secondary gets 30-40%
    if (primary_objective === "sales" || primary_objective === "leads") {
      allocation[recommendedChannels[0]] = 70;
      allocation[recommendedChannels[1]] = 30;
    } else {
      allocation[recommendedChannels[0]] = 60;
      allocation[recommendedChannels[1]] = 40;
    }
  } else {
    // 3 channels: 50%, 30%, 20%
    allocation[recommendedChannels[0]] = 50;
    allocation[recommendedChannels[1]] = 30;
    allocation[recommendedChannels[2]] = 20;
  }

  // Adjust for budget band
  if (budget_band === "under_100" && channelCount > 1) {
    // With tiny budget, focus on 1 channel
    allocation[recommendedChannels[0]] = 100;
    if (recommendedChannels[1]) allocation[recommendedChannels[1]] = 0;
    if (recommendedChannels[2]) allocation[recommendedChannels[2]] = 0;
  }

  return {
    value: allocation,
    confidence: 80,
    reasoning: `Budget allocated across ${channelCount} channels based on objective ${primary_objective}.`,
    rule_id: "BS-002"
  };
}

/**
 * BS-003: Test Budget
 * Inputs: budget_band, build_mode, previous_campaigns_status
 * Output: {percentage, amount}
 */
function calculateTestBudget(input, dailyBudget) {
  const { budget_band, build_mode, previous_campaigns_status } = input;

  let percentage = 0.2; // Default 20%

  if (build_mode === "test_plan") {
    percentage = 0.4;
  } else if (previous_campaigns_status === "first_time") {
    percentage = 0.3;
  } else if (previous_campaigns_status === "weak") {
    percentage = 0.35;
  } else if (build_mode === "optimize_existing" && previous_campaigns_status === "successful") {
    percentage = 0.15;
  }

  // Cap test budget for small budgets
  if (budget_band === "under_100") {
    percentage = 0.5; // Test half with tiny budget
  }

  const amount = dailyBudget?.recommended
    ? Math.round(dailyBudget.recommended * percentage)
    : null;

  return {
    value: {
      percentage,
      amount
    },
    confidence: 75,
    reasoning: `Test budget set to ${Math.round(percentage * 100)}% based on ${build_mode} mode and ${previous_campaigns_status} history.`,
    rule_id: "BS-003"
  };
}

/**
 * BS-004: Scale Budget
 * Inputs: budget_flexibility, budget_band, risk_tolerance
 * Output: {max, increment}
 */
function calculateScaleBudget(input, dailyBudget) {
  const { budget_flexibility, budget_band, risk_tolerance } = input;

  if (budget_flexibility === "fixed") {
    return {
      value: {
        max: dailyBudget?.recommended || null,
        increment: "none"
      },
      confidence: 90,
      reasoning: "Fixed budget — no scaling allowed.",
      rule_id: "BS-004"
    };
  }

  let maxMultiplier = 2;
  let increment = "20% every 3 days";

  if (risk_tolerance === "high_if_return") {
    maxMultiplier = 4;
    increment = "30% every 2 days";
  } else if (risk_tolerance === "result_first") {
    maxMultiplier = 3;
    increment = "25% every 3 days";
  } else if (risk_tolerance === "very_low") {
    maxMultiplier = 1.5;
    increment = "10% every 5 days";
  }

  // Adjust for budget band
  if (budget_band === "under_100") {
    increment = "$10 every 3 days";
  } else if (budget_band === "above_5000") {
    increment = "$500 every 3 days";
  }

  const max = dailyBudget?.recommended
    ? Math.round(dailyBudget.recommended * maxMultiplier)
    : null;

  return {
    value: {
      max,
      increment
    },
    confidence: 70,
    reasoning: `Scale budget up to ${maxMultiplier}x with increment: ${increment}.`,
    rule_id: "BS-004"
  };
}

/**
 * BS-005: CAC Target
 * Inputs: average_order_value, profit_margin, max_cac, business_type
 * Output: {value, source, flags}
 */
function calculateCACTarget(input) {
  const { average_order_value, profit_margin, max_cac, business_type } = input;

  let cacTarget = null;
  let source = "calculated";
  const flags = [];

  if (max_cac) {
    cacTarget = max_cac;
    source = "user_defined";
  } else if (average_order_value && profit_margin) {
    // CAC target = 30% of profit per order
    const profitPerOrder = average_order_value * (profit_margin / 100);
    cacTarget = Math.round(profitPerOrder * 0.3);
    source = "calculated_from_aov_margin";
  } else if (average_order_value) {
    // Fallback: 20% of AOV
    cacTarget = Math.round(average_order_value * 0.2);
    source = "calculated_from_aov";
    flags.push("profit_margin_missing_using_aov_fallback");
  }

  // Business type adjustments
  if (business_type === "b2b" && cacTarget) {
    cacTarget = Math.round(cacTarget * 1.5); // B2B has higher CAC tolerance
  } else if (business_type === "local_service" && cacTarget) {
    cacTarget = Math.round(cacTarget * 0.8); // Local service lower CAC
  }

  if (!cacTarget) {
    flags.push("cac_target_unknown_set_budget_first");
  }

  return {
    value: cacTarget,
    source,
    flags,
    confidence: cacTarget ? 75 : 30,
    reasoning: cacTarget
      ? `CAC target set at ${cacTarget} based on ${source}.`
      : "Cannot calculate CAC target without AOV or max_cac.",
    rule_id: "BS-005"
  };
}

module.exports = {
  mapDailyBudget,
  allocateChannelBudget,
  calculateTestBudget,
  calculateScaleBudget,
  calculateCACTarget
};

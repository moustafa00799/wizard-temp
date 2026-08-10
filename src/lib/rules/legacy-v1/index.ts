/**
 * Legacy Rule Engine v1 — first migration batch.
 *
 * The rule implementations are copied verbatim from campaign-engine-old.
 * This layer exposes them without changing their business logic.
 */
import * as strategy from "./strategyRules.js";
import * as budget from "./budgetRules.js";
import * as risk from "./riskRules.js";

export const LEGACY_V1_RULE_IDS = [
  "SS-001", "SS-002", "SS-003", "SS-004", "SS-005",
  "BS-001", "BS-002", "BS-003", "BS-004", "BS-005",
  "RF-001", "RF-003", "RF-004",
] as const;

export function runLegacyV1Strategy(input: any, readinessScore: number) {
  return {
    ss001: strategy.determineObjective(input),
    ss002: strategy.scoreChannels(input),
    ss003: strategy.determineFunnel(input),
    ss004: strategy.calculateConfidence(input, readinessScore),
    ss005: strategy.estimateTimeline(input, readinessScore),
  };
}

export function runLegacyV1Budget(input: any) {
  const dailyBudget = budget.mapDailyBudget(input);
  return {
    bs001: dailyBudget,
    bs002: budget.allocateChannelBudget(input, dailyBudget.value),
    bs003: budget.calculateTestBudget(input, dailyBudget.value),
    bs004: budget.calculateScaleBudget(input, dailyBudget.value),
    bs005: budget.calculateCACTarget(input),
  };
}

export function runLegacyV1Risk(input: any) {
  const rf001 = risk.detectCriticalFlags(input);
  return {
    rf001,
    rf004: risk.calculateRiskScore(input),
    rf003: risk.generatePreLaunchFixes(input, rf001),
  };
}

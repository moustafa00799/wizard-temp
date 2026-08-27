import assert from "node:assert/strict";
import { buildMeasurementPlan } from "../src/lib/measurement-contract";

const plan = buildMeasurementPlan({
  blueprint_id: "measurement-regression-blueprint",
  tracking_checklist: {
    value: {
      setup_status: "partial",
      required_events: ["page_view", "view_content", "purchase"],
    },
  },
});

assert.equal(plan.contractVersion, "measurement-plan-v1");
assert.equal(plan.blueprintId, "measurement-regression-blueprint");
assert.equal(plan.trackingReadiness, "partial");
assert.deepEqual(plan.eventDefinitions.map((event) => event.eventName), ["page_view", "view_content", "purchase"]);
assert.equal(plan.conversionDefinition.status, "unavailable");
assert.equal(plan.attribution.status, "unavailable");
assert.equal(plan.attribution.window, "unavailable");
assert.equal(plan.governance.performanceObserved, false);
assert.equal(plan.governance.revenueObserved, false);
assert.equal(plan.governance.externalActionsAllowed, false);
assert.equal(plan.governance.budgetSpendAllowed, false);
assert.equal(plan.governance.marketValidated, false);
assert.deepEqual(plan.metrics.map((metric) => metric.metric), ["spend", "impressions", "clicks", "conversions", "realized_revenue", "refunds", "cpa", "roas"]);
assert.ok(plan.metrics.every((metric) => metric.status === "unavailable"));
assert.ok(plan.metrics.filter((metric) => metric.metric === "cpa" || metric.metric === "roas").every((metric) => !metric.value && Boolean(metric.unavailableReason)));
assert.ok(plan.limitations.some((limitation) => limitation.includes("Planned events do not prove")));

console.log(JSON.stringify({
  status: "PASS",
  assertions: 18,
  metricsUnavailable: plan.metrics.length,
  plannedEvents: plan.eventDefinitions.length,
  attribution: plan.attribution.status,
  externalActionsAllowed: plan.governance.externalActionsAllowed,
  budgetSpendAllowed: plan.governance.budgetSpendAllowed,
}));

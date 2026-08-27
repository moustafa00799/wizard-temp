import { z } from "zod";
import type { JsonRecord } from "./db";

const MeasurementStatusSchema = z.enum(["planned", "observed", "unavailable"]);
export type MeasurementStatus = z.infer<typeof MeasurementStatusSchema>;

const MetricSchema = z.object({
  metric: z.enum(["spend", "impressions", "clicks", "conversions", "realized_revenue", "refunds", "cpa", "roas"]),
  status: MeasurementStatusSchema,
  value: z.number().finite().optional(),
  currency: z.string().optional(),
  unavailableReason: z.string().optional(),
  sourceRefs: z.array(z.string()),
});

const EventDefinitionSchema = z.object({
  eventName: z.string().min(1),
  status: z.literal("planned"),
  source: z.literal("wizard_tracking_plan"),
  evidence: z.literal("not_a_runtime_observation"),
});

export const MeasurementPlanSchema = z.object({
  contractVersion: z.literal("measurement-plan-v1"),
  blueprintId: z.string().min(1),
  trackingReadiness: z.enum(["planned", "partial", "unavailable"]),
  conversionDefinition: z.object({
    status: z.literal("unavailable"),
    eventName: z.string().optional(),
    source: z.literal("unavailable"),
    reason: z.string(),
  }),
  eventDefinitions: z.array(EventDefinitionSchema),
  metrics: z.array(MetricSchema),
  attribution: z.object({
    status: z.literal("unavailable"),
    window: z.literal("unavailable"),
    reason: z.string(),
  }),
  governance: z.object({
    performanceObserved: z.literal(false),
    revenueObserved: z.literal(false),
    externalActionsAllowed: z.literal(false),
    budgetSpendAllowed: z.literal(false),
    marketValidated: z.literal(false),
  }),
  limitations: z.array(z.string()),
});

export type MeasurementPlan = z.infer<typeof MeasurementPlanSchema>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 32) : [];
}

export function buildMeasurementPlan(blueprint: JsonRecord): MeasurementPlan {
  const blueprintId = typeof blueprint.blueprint_id === "string" ? blueprint.blueprint_id : "unknown-blueprint";
  const tracking = record(blueprint.tracking_checklist ?? record(blueprint.execution).tracking_checklist);
  const trackingAssessment = record(blueprint.tracking_assessment ?? record(blueprint.execution).tracking_assessment);
  const trackingValue = record(tracking.value ?? tracking);
  const assessmentValue = record(trackingAssessment.value ?? trackingAssessment);
  const eventNames = arrayOfStrings(
    trackingValue.required_events
      ?? trackingValue.requiredEvents
      ?? assessmentValue.required_events
      ?? assessmentValue.requiredEvents,
  );
  const trackingStatus = typeof trackingValue.setup_status === "string"
    ? trackingValue.setup_status
    : typeof assessmentValue.level === "string" ? assessmentValue.level : "unavailable";

  const metrics: MeasurementPlan["metrics"] = [
    { metric: "spend", status: "unavailable", unavailableReason: "No verified provider spend snapshot is attached to this Blueprint.", sourceRefs: [] },
    { metric: "impressions", status: "unavailable", unavailableReason: "No verified provider delivery snapshot is attached to this Blueprint.", sourceRefs: [] },
    { metric: "clicks", status: "unavailable", unavailableReason: "No verified provider click snapshot is attached to this Blueprint.", sourceRefs: [] },
    { metric: "conversions", status: "unavailable", unavailableReason: "No matched conversion definition and runtime observation are available.", sourceRefs: [] },
    { metric: "realized_revenue", status: "unavailable", unavailableReason: "Realized revenue is not supplied by the Blueprint contract.", sourceRefs: [] },
    { metric: "refunds", status: "unavailable", unavailableReason: "Refund data is not supplied by the Blueprint contract.", sourceRefs: [] },
    { metric: "cpa", status: "unavailable", unavailableReason: "CPA requires verified spend and matched conversions; both are unavailable.", sourceRefs: [] },
    { metric: "roas", status: "unavailable", unavailableReason: "ROAS requires verified spend and realized revenue; both are unavailable.", sourceRefs: [] },
  ];

  return MeasurementPlanSchema.parse({
    contractVersion: "measurement-plan-v1",
    blueprintId,
    trackingReadiness: trackingStatus === "partial" || trackingStatus === "fair" ? "partial" : eventNames.length > 0 ? "planned" : "unavailable",
    conversionDefinition: {
      status: "unavailable",
      ...(eventNames[0] ? { eventName: eventNames[0] } : {}),
      source: "unavailable",
      reason: "The Wizard or Blueprint lists planned events only; no verified GA4/Ads/CRM conversion action is attached.",
    },
    eventDefinitions: eventNames.map((eventName) => ({
      eventName,
      status: "planned",
      source: "wizard_tracking_plan",
      evidence: "not_a_runtime_observation",
    })),
    metrics,
    attribution: {
      status: "unavailable",
      window: "unavailable",
      reason: "No approved attribution window and no matched provider/analytics conversion definition are available.",
    },
    governance: {
      performanceObserved: false,
      revenueObserved: false,
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
      marketValidated: false,
    },
    limitations: [
      "This is a measurement plan, not a performance report.",
      "Planned events do not prove that tracking is installed or firing.",
      "Spend, impressions, clicks, conversions, realized revenue, refunds, CPA, and ROAS remain unavailable.",
      "Attribution must not be inferred from campaign names, account currency, or Wizard inputs.",
    ],
  });
}

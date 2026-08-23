import { z } from "zod";
import {
  KnowledgeCurrencySchema,
  KnowledgeLocaleSchema,
  KnowledgeMarketSchema,
  MarketEvidenceSnapshotSchema,
  type KnowledgeCurrency,
  type KnowledgeLocale,
  type KnowledgeMarket,
  type MarketEvidenceSnapshot,
} from "./knowledge/knowledge-contracts";

export const STRATEGY_CONTEXT_CONTRACT_VERSION = "1.0" as const;

export const ScopedStrategyValidationStatusSchema = z.enum([
  "market_validated",
  "market_context_ready",
  "partial",
  "unavailable",
]);
export type ScopedStrategyValidationStatus = z.infer<typeof ScopedStrategyValidationStatusSchema>;

const DimensionStatusSchema = z.enum(["ready", "partial", "missing", "unavailable", "not_available_or_not_required"]);

export const ScopedValidationDecisionSchema = z.object({
  gateVersion: z.literal("market-validation-gate-v1"),
  market: KnowledgeMarketSchema,
  industry: z.string().trim().min(1),
  packageId: z.string().trim().min(1),
  packageStatus: z.enum(["ready", "limited", "missing", "rejected"]),
  contextDecision: z.enum(["market_context_ready", "partial", "unavailable"]),
  marketValidated: z.boolean(),
  dimensions: z.object({
    D1: DimensionStatusSchema,
    D2: DimensionStatusSchema,
    D3: DimensionStatusSchema,
    D4: DimensionStatusSchema,
    D5: DimensionStatusSchema,
    D6: DimensionStatusSchema,
  }),
  blockers: z.array(z.string().trim().min(1)),
  reason: z.string().trim().min(1),
  independentSourceCount: z.number().int().nonnegative(),
}).superRefine((decision, context) => {
  if (decision.marketValidated && decision.contextDecision !== "market_context_ready") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contextDecision"],
      message: "A scoped market-validated decision must also be context-ready.",
    });
  }
  if (decision.marketValidated && decision.packageStatus !== "ready") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["packageStatus"],
      message: "A scoped market-validated decision requires a ready package.",
    });
  }
  if (decision.marketValidated && decision.independentSourceCount < 2) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["independentSourceCount"],
      message: "A scoped market-validated decision requires at least two independent sources.",
    });
  }
});
export type ScopedValidationDecision = z.infer<typeof ScopedValidationDecisionSchema>;

export const StrategyEvidenceFactSchema = z.object({
  factId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  value: z.union([z.string().trim().min(1), z.number().finite(), z.boolean()]),
  unit: z.string().trim().min(1).optional(),
  status: z.enum(["evidence_backed", "limited_external_evidence", "directional"]),
  sourceIds: z.array(z.string().trim().min(1)).min(1),
  observedAt: z.string().datetime({ offset: true }),
});
export type StrategyEvidenceFact = z.infer<typeof StrategyEvidenceFactSchema>;

export const IndustryProfileResolutionSchema = z.object({
  status: z.enum(["matched", "unmatched"]),
  profileStatus: z.enum(["matched", "draft", "unmatched", "deprecated"]),
  requestedIndustry: z.string().trim().min(1),
  profileId: z.string().trim().min(1).optional(),
  resolvedIndustryKey: z.string().trim().min(1).optional(),
  confidence: z.number().min(0).max(1),
  matchedBy: z.enum(["exact_key", "explicit_alias", "none"]),
  reason: z.string().trim().min(1),
});
export type IndustryProfileResolution = z.infer<typeof IndustryProfileResolutionSchema>;

export const ScopedStrategyContextSchema = z.object({
  contractVersion: z.literal(STRATEGY_CONTEXT_CONTRACT_VERSION),
  contextId: z.string().trim().min(1),
  packageId: z.string().trim().min(1),
  snapshotId: z.string().trim().min(1),
  market: KnowledgeMarketSchema,
  industry: z.string().trim().min(1),
  evidenceLocale: KnowledgeLocaleSchema,
  currency: KnowledgeCurrencySchema,
  capturedAt: z.string().datetime({ offset: true }),
  freshnessStatus: z.enum(["fresh", "stale", "expired", "missing"]),
  scopedValidationStatus: ScopedStrategyValidationStatusSchema,
  scopedMarketValidated: z.boolean(),
  globalMarketValidated: z.literal(false),
  validationDecision: ScopedValidationDecisionSchema,
  industryProfile: IndustryProfileResolutionSchema,
  approvedFacts: z.array(StrategyEvidenceFactSchema).max(64),
  evidenceSourceIds: z.array(z.string().trim().min(1)).max(64),
  evidenceIds: z.array(z.string().trim().min(1)).max(64),
  unknowns: z.array(z.string().trim().min(1)).max(32),
  unavailableBenchmarkCategories: z.array(z.enum([
    "cpc",
    "cpa",
    "cvr",
    "roas",
    "saturation",
    "competitor_performance",
    "offer_level_demand",
    "seasonality",
  ])).max(16),
  limitations: z.array(z.string().trim().min(1)).max(32),
  dataPolicy: z.object({
    rawReportsIncluded: z.literal(false),
    accountOwnedPerformanceMayBeUsedAsMarketBenchmark: z.literal(false),
    externalActionsAllowed: z.literal(false),
    budgetSpendAllowed: z.literal(false),
  }),
});
export type ScopedStrategyContext = z.infer<typeof ScopedStrategyContextSchema>;

export const ScopedStrategySelectionSchema = z.object({
  packageId: z.string().trim().min(1),
  market: KnowledgeMarketSchema,
  industry: z.string().trim().min(1),
  snapshot: MarketEvidenceSnapshotSchema,
  validationDecision: ScopedValidationDecisionSchema,
  evidenceIds: z.array(z.string().trim().min(1)).max(64).default([]),
});
export type ScopedStrategySelection = z.infer<typeof ScopedStrategySelectionSchema>;

export const StrategyRecommendationSchema = z.object({
  contractVersion: z.literal(STRATEGY_CONTEXT_CONTRACT_VERSION),
  recommendationId: z.string().trim().min(1),
  blueprintId: z.string().trim().min(1),
  contextId: z.string().trim().min(1),
  outputLocale: KnowledgeLocaleSchema,
  market: KnowledgeMarketSchema,
  industry: z.string().trim().min(1),
  currency: KnowledgeCurrencySchema,
  status: z.literal("advisory_only"),
  strategicPositioning: z.string().trim().min(1).max(2000),
  primaryHypothesis: z.string().trim().min(1).max(2000),
  messageAngles: z.array(z.string().trim().min(1).max(500)).max(8),
  audienceHypotheses: z.array(z.string().trim().min(1).max(500)).max(8),
  channelRoles: z.array(z.string().trim().min(1).max(500)).max(8),
  experimentIdeas: z.array(z.string().trim().min(1).max(500)).max(8),
  requiredValidations: z.array(z.string().trim().min(1).max(500)).max(12),
  evidenceRefs: z.array(z.string().trim().min(1)).max(32),
  limitations: z.array(z.string().trim().min(1).max(500)).max(24),
  governance: z.object({
    generationMode: z.literal("blueprint_only"),
    externalActionsAllowed: z.literal(false),
    budgetSpendAllowed: z.literal(false),
    canMutateCdks: z.literal(false),
    canChangeCanonicalBlueprint: z.literal(false),
    requiresHumanApproval: z.literal(true),
    globalMarketValidated: z.literal(false),
    preservedDecisionPaths: z.array(z.enum(["objective", "funnel", "channels", "readiness", "budget", "launch", "publish"])).min(1),
  }),
});
export type StrategyRecommendation = z.infer<typeof StrategyRecommendationSchema>;

export const StrategyExperimentEnvelopeSchema = z.object({
  envelopeVersion: z.literal("1.0"),
  blueprintId: z.string().trim().min(1),
  canonicalBlueprintUnchanged: z.literal(true),
  context: ScopedStrategyContextSchema,
  recommendation: StrategyRecommendationSchema,
});
export type StrategyExperimentEnvelope = z.infer<typeof StrategyExperimentEnvelopeSchema>;

export function validateScopedStrategyContext(value: unknown): ScopedStrategyContext {
  return ScopedStrategyContextSchema.parse(value);
}

export function validateStrategyRecommendation(value: unknown): StrategyRecommendation {
  return StrategyRecommendationSchema.parse(value);
}

export type { KnowledgeCurrency, KnowledgeLocale, KnowledgeMarket, MarketEvidenceSnapshot };

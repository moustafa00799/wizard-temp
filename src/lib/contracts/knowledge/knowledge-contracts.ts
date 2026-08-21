import { z } from "zod";

export const KNOWLEDGE_CONTRACT_VERSION = "1.0" as const;

export const KnowledgeMarketSchema = z.enum(["EG", "SA", "AE", "GCC"]);
export type KnowledgeMarket = z.infer<typeof KnowledgeMarketSchema>;

export const KnowledgeCurrencySchema = z.enum(["EGP", "SAR", "USD"]);
export type KnowledgeCurrency = z.infer<typeof KnowledgeCurrencySchema>;

export const KnowledgeLocaleSchema = z.enum(["ar", "en"]);
export type KnowledgeLocale = z.infer<typeof KnowledgeLocaleSchema>;

export const BusinessBranchSchema = z.enum(["local_service", "ecommerce", "app", "b2b"]);
export type BusinessBranch = z.infer<typeof BusinessBranchSchema>;

export const FreshnessPolicySchema = z.enum(["daily", "weekly", "monthly", "on_demand"]);
export type FreshnessPolicy = z.infer<typeof FreshnessPolicySchema>;

export const FreshnessStatusSchema = z.enum(["fresh", "stale", "expired", "missing"]);
export type FreshnessStatus = z.infer<typeof FreshnessStatusSchema>;

export const EvidenceStatusSchema = z.enum([
  "evidence_backed",
  "limited_external_evidence",
  "directional",
  "unavailable",
  "rejected",
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const ClaimTypeSchema = z.enum([
  "fact",
  "inference",
  "directional_hypothesis",
  "recommendation",
]);
export type ClaimType = z.infer<typeof ClaimTypeSchema>;

export const ClaimStatusSchema = z.enum([
  "evidence_backed",
  "directional",
  "unavailable",
  "rejected",
]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const SourceTypeSchema = z.enum([
  "official_api",
  "official_document",
  "public_library",
  "client_data",
  "licensed_report",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const LicenseStatusSchema = z.enum(["approved", "restricted", "unknown"]);
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

const IsoDateTimeSchema = z.string().datetime({ offset: true });
const ConfidenceSchema = z.number().min(0).max(1);
const NonEmptyStringSchema = z.string().trim().min(1);
const SourceIdSchema = z.string().trim().min(1);

const ScopedMarketContextSchema = z.object({
  market: KnowledgeMarketSchema,
  industry: NonEmptyStringSchema,
  locale: KnowledgeLocaleSchema.optional(),
  currency: KnowledgeCurrencySchema.optional(),
});

export const SourceRecordSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_CONTRACT_VERSION),
  sourceId: SourceIdSchema,
  publisher: NonEmptyStringSchema,
  sourceUrl: z.string().url(),
  sourceType: SourceTypeSchema,
  jurisdiction: NonEmptyStringSchema.optional(),
  market: KnowledgeMarketSchema.optional(),
  industry: NonEmptyStringSchema.optional(),
  language: KnowledgeLocaleSchema.optional(),
  licenseStatus: LicenseStatusSchema,
  observedAt: IsoDateTimeSchema,
  freshnessPolicy: FreshnessPolicySchema,
  limitations: z.array(NonEmptyStringSchema),
  version: NonEmptyStringSchema,
  enabled: z.boolean(),
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

const EvidenceReferenceSchema = z.object({
  evidenceId: NonEmptyStringSchema,
  sourceId: SourceIdSchema,
  observedAt: IsoDateTimeSchema,
  excerpt: NonEmptyStringSchema.optional(),
  limitations: z.array(NonEmptyStringSchema),
});
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;

export const MarketFactSchema = z.object({
  factId: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  value: z.union([NonEmptyStringSchema, z.number().finite(), z.boolean()]).nullable(),
  unit: NonEmptyStringSchema.optional(),
  status: EvidenceStatusSchema,
  sourceIds: z.array(SourceIdSchema),
  observedAt: IsoDateTimeSchema.optional(),
  unavailableReason: NonEmptyStringSchema.optional(),
  scope: ScopedMarketContextSchema,
}).superRefine((fact, context) => {
  if (fact.status === "unavailable") {
    if (fact.value !== null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Unavailable facts must use null value." });
    }
    if (!fact.unavailableReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["unavailableReason"], message: "Unavailable facts require an explicit reason." });
    }
    return;
  }

  if (fact.value === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Available or directional facts require a value." });
  }
  if (fact.sourceIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Non-unavailable facts require at least one source ID." });
  }
  if (!fact.observedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["observedAt"], message: "Non-unavailable facts require observedAt." });
  }
});
export type MarketFact = z.infer<typeof MarketFactSchema>;

export const CompetitorObservationSchema = z.object({
  observationId: NonEmptyStringSchema,
  subject: NonEmptyStringSchema,
  observationType: z.enum(["creative_pattern", "offer_pattern", "channel_presence", "message_pattern"]),
  observation: NonEmptyStringSchema,
  status: z.enum(["observed", "directional", "unavailable"]),
  sourceIds: z.array(SourceIdSchema),
  observedAt: IsoDateTimeSchema.optional(),
  unavailableReason: NonEmptyStringSchema.optional(),
  scope: ScopedMarketContextSchema,
}).superRefine((observation, context) => {
  if (observation.status === "unavailable") {
    if (!observation.unavailableReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["unavailableReason"], message: "Unavailable observations require an explicit reason." });
    }
    return;
  }
  if (observation.sourceIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Observed competitor patterns require source IDs." });
  }
  if (!observation.observedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["observedAt"], message: "Observed competitor patterns require observedAt." });
  }
});
export type CompetitorObservation = z.infer<typeof CompetitorObservationSchema>;

export const KeywordSignalSchema = z.object({
  signalId: NonEmptyStringSchema,
  theme: NonEmptyStringSchema,
  direction: z.enum(["increasing", "stable", "decreasing", "unknown"]),
  value: z.number().finite().nullable(),
  unit: NonEmptyStringSchema.optional(),
  status: z.enum(["observed", "directional", "unavailable"]),
  sourceIds: z.array(SourceIdSchema),
  observedAt: IsoDateTimeSchema.optional(),
  unavailableReason: NonEmptyStringSchema.optional(),
  scope: ScopedMarketContextSchema,
}).superRefine((signal, context) => {
  if (signal.status === "unavailable") {
    if (signal.value !== null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Unavailable keyword signals must use null value." });
    }
    if (!signal.unavailableReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["unavailableReason"], message: "Unavailable keyword signals require an explicit reason." });
    }
    return;
  }
  if (signal.value === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Observed or directional keyword signals require a value." });
  }
  if (signal.sourceIds.length === 0 || !signal.observedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Observed or directional keyword signals require source IDs and observedAt." });
  }
});
export type KeywordSignal = z.infer<typeof KeywordSignalSchema>;

export const SeasonalitySignalSchema = z.object({
  signalId: NonEmptyStringSchema,
  period: NonEmptyStringSchema,
  direction: z.enum(["higher", "lower", "stable", "unknown"]),
  status: z.enum(["observed", "directional", "unavailable"]),
  sourceIds: z.array(SourceIdSchema),
  observedAt: IsoDateTimeSchema.optional(),
  unavailableReason: NonEmptyStringSchema.optional(),
  scope: ScopedMarketContextSchema,
}).superRefine((signal, context) => {
  if (signal.status === "unavailable") {
    if (!signal.unavailableReason) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["unavailableReason"], message: "Unavailable seasonality signals require an explicit reason." });
    }
    return;
  }
  if (signal.sourceIds.length === 0 || !signal.observedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Observed or directional seasonality signals require source IDs and observedAt." });
  }
});
export type SeasonalitySignal = z.infer<typeof SeasonalitySignalSchema>;

export const ClaimSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_CONTRACT_VERSION),
  claimId: NonEmptyStringSchema,
  text: NonEmptyStringSchema,
  type: ClaimTypeSchema,
  evidenceIds: z.array(NonEmptyStringSchema),
  market: KnowledgeMarketSchema,
  industry: NonEmptyStringSchema,
  confidence: ConfidenceSchema,
  status: ClaimStatusSchema,
  createdAt: IsoDateTimeSchema,
  validUntil: IsoDateTimeSchema.optional(),
  limitations: z.array(NonEmptyStringSchema),
}).superRefine((claim, context) => {
  const externallyGrounded = claim.type === "fact" || claim.type === "inference";
  if (externallyGrounded && claim.status === "evidence_backed" && claim.evidenceIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceIds"], message: "Evidence-backed facts and inferences require evidence IDs." });
  }
  if (claim.status === "unavailable") {
    if (claim.evidenceIds.length > 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceIds"], message: "Unavailable claims cannot cite evidence IDs." });
    }
    if (claim.limitations.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["limitations"], message: "Unavailable claims require a limitation or reason." });
    }
  }
  if (claim.status === "directional" && claim.type === "fact") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["type"], message: "A directional claim cannot be typed as a fact." });
  }
  if (claim.validUntil && new Date(claim.validUntil).getTime() < new Date(claim.createdAt).getTime()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "validUntil cannot precede createdAt." });
  }
});
export type Claim = z.infer<typeof ClaimSchema>;

export const IndustryProfileSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_CONTRACT_VERSION),
  profileId: NonEmptyStringSchema,
  version: NonEmptyStringSchema,
  industryKey: NonEmptyStringSchema,
  displayName: NonEmptyStringSchema,
  branch: BusinessBranchSchema,
  markets: z.array(KnowledgeMarketSchema).min(1),
  locales: z.array(KnowledgeLocaleSchema).min(1),
  purchaseCycle: z.object({
    stages: z.array(NonEmptyStringSchema).min(1),
    typicalDuration: NonEmptyStringSchema,
    sourceIds: z.array(SourceIdSchema),
    status: EvidenceStatusSchema,
  }),
  commonOfferTypes: z.array(NonEmptyStringSchema).min(1),
  audienceSegments: z.array(NonEmptyStringSchema).min(1),
  objections: z.array(NonEmptyStringSchema).min(1),
  kpis: z.array(z.object({
    key: NonEmptyStringSchema,
    definition: NonEmptyStringSchema,
    measurementEvent: NonEmptyStringSchema,
    sourceIds: z.array(SourceIdSchema),
  })).min(1),
  complianceConstraints: z.array(NonEmptyStringSchema),
  likelyChannels: z.array(NonEmptyStringSchema).min(1),
  trackingNeeds: z.array(NonEmptyStringSchema).min(1),
  marketTerms: z.array(NonEmptyStringSchema),
  seasonality: z.array(SeasonalitySignalSchema),
  sourceIds: z.array(SourceIdSchema),
  limitations: z.array(NonEmptyStringSchema),
  status: z.enum(["matched", "draft", "unmatched", "deprecated"]),
}).superRefine((profile, context) => {
  if (profile.status === "matched" && profile.sourceIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Matched industry profiles require source IDs or an explicit profile source registry entry." });
  }
  if (profile.status === "unmatched" && profile.sourceIds.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Unmatched profiles must not claim source-backed industry coverage." });
  }
  if (profile.status === "draft") {
    if (profile.sourceIds.length > 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Draft profiles cannot claim external source coverage." });
    }
    if (profile.limitations.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["limitations"], message: "Draft profiles require explicit limitations." });
    }
  }
});
export type IndustryProfile = z.infer<typeof IndustryProfileSchema>;

export const MarketEvidenceSnapshotSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_CONTRACT_VERSION),
  snapshotId: NonEmptyStringSchema,
  market: KnowledgeMarketSchema,
  industry: NonEmptyStringSchema,
  locale: KnowledgeLocaleSchema,
  currency: KnowledgeCurrencySchema,
  capturedAt: IsoDateTimeSchema,
  freshnessStatus: FreshnessStatusSchema,
  facts: z.array(MarketFactSchema),
  competitorObservations: z.array(CompetitorObservationSchema),
  keywordSignals: z.array(KeywordSignalSchema),
  seasonalitySignals: z.array(SeasonalitySignalSchema),
  unknowns: z.array(NonEmptyStringSchema),
  contradictions: z.array(NonEmptyStringSchema),
  sourceIds: z.array(SourceIdSchema),
  confidence: ConfidenceSchema,
  limitations: z.array(NonEmptyStringSchema),
}).superRefine((snapshot, context) => {
  const evidenceCount = snapshot.facts.filter((fact) => fact.status !== "unavailable").length
    + snapshot.competitorObservations.filter((observation) => observation.status !== "unavailable").length
    + snapshot.keywordSignals.filter((signal) => signal.status !== "unavailable").length
    + snapshot.seasonalitySignals.filter((signal) => signal.status !== "unavailable").length;

  if (snapshot.freshnessStatus === "missing") {
    if (snapshot.sourceIds.length > 0 || evidenceCount > 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["freshnessStatus"], message: "Missing snapshots cannot contain active sources or usable evidence." });
    }
    if (snapshot.unknowns.length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["unknowns"], message: "Missing snapshots require explicit unknowns." });
    }
  }

  if (snapshot.freshnessStatus !== "missing" && evidenceCount > 0 && snapshot.sourceIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceIds"], message: "Snapshots with evidence require source IDs." });
  }

  if (snapshot.contradictions.length > 0 && snapshot.freshnessStatus === "fresh") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["freshnessStatus"], message: "A snapshot with unresolved contradictions cannot be marked fresh." });
  }
});
export type MarketEvidenceSnapshot = z.infer<typeof MarketEvidenceSnapshotSchema>;

export const EvidencePackageSchema = z.object({
  contractVersion: z.literal(KNOWLEDGE_CONTRACT_VERSION),
  packageId: NonEmptyStringSchema,
  generatedAt: IsoDateTimeSchema,
  market: KnowledgeMarketSchema,
  industry: NonEmptyStringSchema,
  locale: KnowledgeLocaleSchema,
  currency: KnowledgeCurrencySchema,
  sourceRecords: z.array(SourceRecordSchema),
  evidenceReferences: z.array(EvidenceReferenceSchema),
  snapshots: z.array(MarketEvidenceSnapshotSchema),
  claims: z.array(ClaimSchema),
  industryProfile: IndustryProfileSchema.optional(),
  status: z.enum(["ready", "limited", "missing", "rejected"]),
  freshnessStatus: FreshnessStatusSchema,
  limitations: z.array(NonEmptyStringSchema),
  retrieval: z.object({
    strategy: z.enum(["deterministic_fixture", "registry_lookup", "manual_review"]),
    queryHash: NonEmptyStringSchema,
    selectedEvidenceIds: z.array(NonEmptyStringSchema),
  }),
}).superRefine((pkg, context) => {
  const sourceIds = new Set(pkg.sourceRecords.map((source) => source.sourceId));
  const evidenceIds = new Set(pkg.evidenceReferences.map((evidence) => evidence.evidenceId));

  for (const source of pkg.sourceRecords) {
    if (!source.enabled && pkg.status === "ready") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceRecords"], message: `Disabled source ${source.sourceId} cannot be used by a ready package.` });
    }
  }

  for (const evidence of pkg.evidenceReferences) {
    if (!sourceIds.has(evidence.sourceId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceReferences"], message: `Evidence ${evidence.evidenceId} references an unregistered source.` });
    }
  }

  for (const claim of pkg.claims) {
    for (const evidenceId of claim.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["claims"], message: `Claim ${claim.claimId} references missing evidence ${evidenceId}.` });
      }
    }
  }

  const snapshotSourceIds = pkg.snapshots.flatMap((snapshot) => snapshot.sourceIds);
  for (const sourceId of snapshotSourceIds) {
    if (!sourceIds.has(sourceId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["snapshots"], message: `Snapshot references unregistered source ${sourceId}.` });
    }
  }

  if (pkg.freshnessStatus === "missing" && pkg.status === "ready") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "A missing evidence package cannot be ready." });
  }
  if (pkg.status === "missing" && pkg.claims.some((claim) => claim.status === "evidence_backed")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["claims"], message: "Missing packages cannot contain evidence-backed claims." });
  }
  if (pkg.retrieval.selectedEvidenceIds.some((evidenceId) => !evidenceIds.has(evidenceId))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["retrieval", "selectedEvidenceIds"], message: "Selected evidence must exist in evidenceReferences." });
  }
});
export type EvidencePackage = z.infer<typeof EvidencePackageSchema>;

export function parseKnowledgeContract<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export function safeParseKnowledgeContract<T>(schema: z.ZodType<T>, value: unknown): z.SafeParseReturnType<unknown, T> {
  return schema.safeParse(value);
}

export const KNOWLEDGE_UNAVAILABLE_REASON = "No verified market source is registered for this metric and scope.";

export function unavailableMarketFact(params: {
  factId: string;
  name: string;
  market: KnowledgeMarket;
  industry: string;
  locale: KnowledgeLocale;
  currency: KnowledgeCurrency;
  reason?: string;
}): MarketFact {
  return MarketFactSchema.parse({
    factId: params.factId,
    name: params.name,
    value: null,
    status: "unavailable",
    sourceIds: [],
    unavailableReason: params.reason ?? KNOWLEDGE_UNAVAILABLE_REASON,
    scope: {
      market: params.market,
      industry: params.industry,
      locale: params.locale,
      currency: params.currency,
    },
  });
}

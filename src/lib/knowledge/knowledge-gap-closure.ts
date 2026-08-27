import { z } from "zod";

const DispositionStatusSchema = z.enum([
  "closed_with_limitations",
  "closed_low_priority",
  "closed_unavailable",
  "closed_quarantine",
  "ready_for_restricted_snapshot",
  "partial_scope_ready",
  "deferred",
]);
const DispositionUseSchema = z.enum([
  "strategy_context_advisory",
  "snapshot_candidate",
  "reference_only",
  "not_for_strategy",
  "deferred",
]);

export const KnowledgeGapDispositionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  domain: z.enum(["public", "provider", "store", "drive", "taxonomy", "ai", "authorization"]),
  status: DispositionStatusSchema,
  use: DispositionUseSchema,
  evidenceBasis: z.string().min(1),
  disposition: z.string().min(1),
  remainingGaps: z.array(z.string().min(1)).max(8),
  forbiddenAssumptions: z.array(z.string().min(1)).max(8),
}).strict();
export type KnowledgeGapDisposition = z.infer<typeof KnowledgeGapDispositionSchema>;

export const KnowledgeGapClosureManifestSchema = z.object({
  contractVersion: z.literal("1.0"),
  manifestId: z.literal("knowledge-gap-closure-2026-08-27"),
  generatedAt: z.string().datetime({ offset: true }),
  policy: z.object({
    newDataCollection: z.literal(false),
    liveAiCalls: z.literal(false),
    marketValidated: z.literal(false),
    canonicalBlueprintMutation: z.literal(false),
    accountOwnedDataAsMarketBenchmark: z.literal(false),
    lowPriorityClosureMeans: z.literal("explicit_disposition_not_evidence_escalation"),
  }).strict(),
  dispositions: z.array(KnowledgeGapDispositionSchema).min(1).max(32),
  aiGuardrails: z.object({
    mode: z.literal("advisory_only"),
    useOnlyScopedEvidence: z.literal(true),
    preserveUnavailableMetrics: z.literal(true),
    closedLowPriorityDispositionIds: z.array(z.string().min(1)).max(16),
    mustNotClaim: z.array(z.string().min(1)).max(16),
    mustRequestHumanReviewFor: z.array(z.string().min(1)).max(16),
  }).strict(),
}).strict();
export type KnowledgeGapClosureManifest = z.infer<typeof KnowledgeGapClosureManifestSchema>;

const DISPOSITIONS: KnowledgeGapDisposition[] = [
  {
    id: "public-source-registry",
    domain: "public",
    status: "closed_with_limitations",
    use: "strategy_context_advisory",
    evidenceBasis: "Public registry and limited packages already exist for the selected EG/SA contexts.",
    disposition: "Use as limited contextual evidence only; keep independent-source and freshness gates explicit.",
    remainingGaps: ["formal exact-scope market validation"],
    forbiddenAssumptions: ["global market validation", "unavailable paid-media benchmarks", "competitor performance from presence alone"],
  },
  {
    id: "private-provider-evidence",
    domain: "provider",
    status: "closed_with_limitations",
    use: "strategy_context_advisory",
    evidenceBasis: "Read-only Google Ads and TikTok collections were sanitized and merged without raw rows.",
    disposition: "Operational account evidence may inform the owned-activity narrative but never a general market benchmark.",
    remainingGaps: ["mixed-account segmentation review", "deferred Google Ads authorization"],
    forbiddenAssumptions: ["account-wide industry from name or currency", "market CPC/CPA/CVR/ROAS"],
  },
  {
    id: "easy-orders-eg",
    domain: "store",
    status: "closed_with_limitations",
    use: "strategy_context_advisory",
    evidenceBasis: "The Egyptian Easy Orders export was normalized with EGP, order, product, category, and review aggregates.",
    disposition: "Use as private limited store evidence; preserve owner-reported rates as directional and taxonomy as review-required.",
    remainingGaps: ["realized collected revenue", "row-level delivery/payment/refund linkage"],
    forbiddenAssumptions: ["Total Cost equals realized revenue", "owner rates assigned to individual orders", "accurate product taxonomy"],
  },
  {
    id: "drive-artifacts",
    domain: "drive",
    status: "closed_with_limitations",
    use: "snapshot_candidate",
    evidenceBasis: "86 sanitized Drive artifacts were stored in a private workspace across analytics, campaigns, catalog, sales, and seller groups.",
    disposition: "Artifacts remain scope-separated; only explicitly confirmed records may become restricted snapshots.",
    remainingGaps: ["property/timezone/site binding for selected analytics", "scope and ownership for ambiguous files"],
    forbiddenAssumptions: ["all Drive files belong to one activity", "catalog overlap proves ownership", "unknown sales file proves revenue"],
  },
  {
    id: "drive-catalogs",
    domain: "taxonomy",
    status: "closed_low_priority",
    use: "not_for_strategy",
    evidenceBasis: "Product and Merchant Center feeds have partial or absent identity overlap with Easy Orders.",
    disposition: "Retain as catalog_identity_unverified and exclude from market, revenue, or Easy Orders claims.",
    remainingGaps: ["verified store ownership and market binding"],
    forbiddenAssumptions: ["ID/title/domain overlap proves same store", "catalog size proves demand"],
  },
  {
    id: "drive-old-sales-and-seller",
    domain: "drive",
    status: "closed_unavailable",
    use: "not_for_strategy",
    evidenceBasis: "Historical MTD SALES and seller-profile candidates lack reliable activity, market, currency, and ownership scope.",
    disposition: "Keep scope_unverified or quarantine; do not create revenue or business-performance facts.",
    remainingGaps: ["source dictionary", "owner and currency verification"],
    forbiddenAssumptions: ["historical rows are current sales", "file name proves business identity"],
  },
  {
    id: "drive-sensitive-unknown",
    domain: "drive",
    status: "closed_quarantine",
    use: "not_for_strategy",
    evidenceBasis: "Credential-like filenames, entity-access files, unknown data-export files, and likely PII files were not opened or persisted.",
    disposition: "Remain permanently excluded from AI, Git, database payloads, and automated retries in this phase.",
    remainingGaps: ["none without a separately approved privacy review"],
    forbiddenAssumptions: ["filename implies safe business data", "unknown export is usable evidence"],
  },
  {
    id: "saudi-shaaddesign-ga4",
    domain: "drive",
    status: "ready_for_restricted_snapshot",
    use: "snapshot_candidate",
    evidenceBasis: "User confirmed ShaadDesign, GA4 Property 6262496156, shd.sa, Saudi market, SAR, and 2023-01-01..2023-12-31.",
    disposition: "Eligible for a private restricted snapshot after binding the reporting timezone or recording it as unavailable.",
    remainingGaps: ["GA4 Reporting Time Zone"],
    forbiddenAssumptions: ["GA4 snapshot proves general market demand", "GTM container is a GA4 property"],
  },
  {
    id: "saudi-search-console",
    domain: "drive",
    status: "partial_scope_ready",
    use: "snapshot_candidate",
    evidenceBasis: "Search Console artifacts were retained as site-scoped organic metrics candidates.",
    disposition: "Use clicks, impressions, CTR, and position only after property binding to shd.sa.",
    remainingGaps: ["Search Console property binding"],
    forbiddenAssumptions: ["site clicks equal market demand", "organic position is paid-media performance"],
  },
  {
    id: "keyword-planner",
    domain: "drive",
    status: "closed_with_limitations",
    use: "reference_only",
    evidenceBasis: "Keyword Stats and Forecasts were sanitized without preserving query values.",
    disposition: "Retain as private directional planning evidence until location, language, method, and period are established.",
    remainingGaps: ["location", "language", "forecast method", "date scope"],
    forbiddenAssumptions: ["generic absolute demand", "market CPC or competition benchmark"],
  },
  {
    id: "mixed-google-ads-428",
    domain: "provider",
    status: "partial_scope_ready",
    use: "strategy_context_advisory",
    evidenceBasis: "Account 428 contains multiple activities and markets according to the owner and existing sanitized collections.",
    disposition: "Use only campaign/segment-level facts after explicit classification; never collapse the account into one industry.",
    remainingGaps: ["review of existing campaign-level classification"],
    forbiddenAssumptions: ["one account equals one industry", "currency equals market"],
  },
  {
    id: "authorization-deferred",
    domain: "authorization",
    status: "deferred",
    use: "deferred",
    evidenceBasis: "Google Ads 939 and other postponed live sources lack the required authorization in this phase.",
    disposition: "Keep deferred; no retry, connector change, or new data collection while collection is paused.",
    remainingGaps: ["fresh direct authorization"],
    forbiddenAssumptions: ["missing authorization means zero activity", "old account evidence fills the deferred scope"],
  },
  {
    id: "ai-advisory-governance",
    domain: "ai",
    status: "closed_with_limitations",
    use: "strategy_context_advisory",
    evidenceBasis: "Optional governed Strategy Builder and Reasoning paths already enforce sanitized input, schema validation, fallback, and advisory-only output.",
    disposition: "AI may summarize, explain, prioritize experiments, and expose uncertainty; CDKS remains the sole decision authority.",
    remainingGaps: ["live provider availability is not required for deterministic closure"],
    forbiddenAssumptions: ["AI output is a launch authorization", "AI may alter budgets, campaigns, or Canonical Blueprint"],
  },
];

export function buildKnowledgeGapClosureManifest(generatedAt = "2026-08-27T00:00:00.000Z"): KnowledgeGapClosureManifest {
  return KnowledgeGapClosureManifestSchema.parse({
    contractVersion: "1.0",
    manifestId: "knowledge-gap-closure-2026-08-27",
    generatedAt,
    policy: {
      newDataCollection: false,
      liveAiCalls: false,
      marketValidated: false,
      canonicalBlueprintMutation: false,
      accountOwnedDataAsMarketBenchmark: false,
      lowPriorityClosureMeans: "explicit_disposition_not_evidence_escalation",
    },
    dispositions: DISPOSITIONS,
    aiGuardrails: {
      mode: "advisory_only",
      useOnlyScopedEvidence: true,
      preserveUnavailableMetrics: true,
      closedLowPriorityDispositionIds: DISPOSITIONS.filter((item) => item.status.startsWith("closed_")).map((item) => item.id),
      mustNotClaim: [
        "global market validation",
        "CPC, CPA, CVR, ROAS, saturation, or competitor performance when unavailable",
        "account-owned data as independent market benchmark",
        "external action, budget spend, launch authorization, or Canonical Blueprint mutation",
      ],
      mustRequestHumanReviewFor: [
        "industry profile unmatched or draft",
        "mixed account classification",
        "property/site/currency/timezone mismatch",
        "catalog ownership or sales-file ambiguity",
      ],
    },
  });
}

export function buildAIKnowledgeGuardrails() {
  return buildKnowledgeGapClosureManifest().aiGuardrails;
}

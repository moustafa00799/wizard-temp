import { createHash } from "node:crypto";
import {
  type KnowledgeCurrency,
  type KnowledgeLocale,
  type KnowledgeMarket,
  type EvidencePackage,
} from "@/lib/contracts/knowledge";
import { SourceRegistry } from "../source-registry";
import { buildProviderEvidencePackage } from "./provider-evidence-adapter";
import {
  classifyProviderContent,
  contentClassificationId,
  type ProviderContentSignal,
  type ProviderContentClassification,
} from "./provider-content-classification";
import {
  PLATFORM_CONTRACT_VERSION,
  parsePlatformCollection,
  type PlatformCollection,
  type PlatformEntityLevel,
} from "./provider-snapshot-contracts";

export const GOOGLE_ADS_READONLY_NORMALIZER_VERSION = "1.0" as const;
export const GOOGLE_ADS_ALLOWED_ACCOUNT_IDS = ["4282900193", "6899137548"] as const;
export const GOOGLE_ADS_BLOCKED_ACCOUNT_ID = "9397976723" as const;
export const GOOGLE_ADS_CAPTURED_AT = "2026-08-26T19:20:00.000Z" as const;

export type GoogleAdsReadOnlyDataClass =
  | "account"
  | "performance"
  | "inventory"
  | "creative"
  | "keyword"
  | "search_term";

export type GoogleAdsReadOnlyFileInput = {
  fileName: string;
  raw: unknown;
  rawSha256: string;
};

export type GoogleAdsAccountMarket = KnowledgeMarket | "mixed";

export type GoogleAdsReadOnlyAccountInput = {
  accountId: string;
  accountName?: string;
  currency: KnowledgeCurrency;
  timezone: string;
  market: GoogleAdsAccountMarket;
  industry: string;
  scopeReviewStatus: "user_confirmed" | "unreviewed";
  files: GoogleAdsReadOnlyFileInput[];
};

export type GoogleAdsReadOnlyBlockedAccountInput = {
  accountId: string;
  status: "unavailable";
  reason: string;
};

export type GoogleAdsDeferredAccount = {
  accountId: string;
  status: "deferred";
  accessStatus: "unavailable";
  reason: string;
  retryGate: "new_authorization_or_direct_user_access";
  mergePolicy: "merge_only_after_scope_and_hash_verification";
  excludedFromPackages: true;
  marketValidated: false;
};

export type GoogleAdsReadOnlyNormalizerInput = {
  generatedAt?: string;
  locale?: KnowledgeLocale;
  accounts: GoogleAdsReadOnlyAccountInput[];
  blockedAccounts?: GoogleAdsReadOnlyBlockedAccountInput[];
};

type RawRecord = Record<string, unknown>;
type FileSpec = {
  fileName: string;
  kind: string;
  entityLevel: PlatformEntityLevel;
  dataClass: GoogleAdsReadOnlyDataClass;
  dateStart?: string;
  dateStop?: string;
  dimensions: string[];
  metrics: string[];
  partial?: boolean;
  limitation?: string;
};

export type GoogleAdsCampaignPartition = {
  accountId: string;
  campaignId: string;
  candidateIndustry: string;
  candidateMarket: KnowledgeMarket;
  reviewStatus: "unreviewed";
  classificationId: string;
  confidence: number;
  signalCount: number;
};

export type GoogleAdsNormalizedCollection = PlatformCollection & {
  dataClass: GoogleAdsReadOnlyDataClass;
  kind: string;
  rawSha256: string;
  sourceFile: string;
  aggregationGroup: string;
};

export type GoogleAdsNormalizedAccount = {
  accountId: string;
  accountName?: string;
  market: GoogleAdsAccountMarket;
  industry: string;
  currency: KnowledgeCurrency;
  timezone: string;
  scopeReviewStatus: "user_confirmed" | "unreviewed";
  marketValidated: false;
  currencyMarketMismatch: boolean;
  campaignPartitions: GoogleAdsCampaignPartition[];
  collections: GoogleAdsNormalizedCollection[];
  contentClassifications: Array<{
    campaignId: string;
    primaryIndustryKey: string;
    reviewStatus: "unreviewed";
    industryCandidates: ProviderContentClassification["industryCandidates"];
    marketCandidates: ProviderContentClassification["marketCandidates"];
  }>;
  limitations: string[];
};

export type GoogleAdsReadOnlyNormalizedOutput = {
  contractVersion: typeof GOOGLE_ADS_READONLY_NORMALIZER_VERSION;
  provider: "google_ads";
  generatedAt: string;
  allowedAccountIds: readonly string[];
  blockedAccountIds: readonly string[];
  ownershipAssertion: "user_confirmed_account_access";
  marketValidated: false;
  aggregationPolicy: {
    campaignAggregateIsSeparateFromBreakdowns: true;
    performanceIsSeparateFromInventory: true;
    performanceIsSeparateFromCreativeAndKeywordContent: true;
    currencyConversion: "google_ads_cost_micros_divided_by_1000000";
  };
  accounts: GoogleAdsNormalizedAccount[];
  blockedAccounts: GoogleAdsReadOnlyBlockedAccountInput[];
  deferredAccounts: GoogleAdsDeferredAccount[];
  packages: EvidencePackage[];
};

const FILE_SPECS: readonly FileSpec[] = [
  {
    fileName: "customer-health.json",
    kind: "customer-health",
    entityLevel: "account",
    dataClass: "account",
    dimensions: ["customer.id", "customer.currency_code", "customer.time_zone"],
    metrics: [],
  },
  {
    fileName: "campaign-inventory.json",
    kind: "campaign-inventory",
    entityLevel: "campaign",
    dataClass: "inventory",
    dimensions: ["campaign.id", "campaign.name", "campaign.status", "campaign.advertising_channel_type"],
    metrics: [],
  },
  {
    fileName: "campaign-performance-2024-01-01-to-2026-08-25.json",
    kind: "campaign-performance",
    entityLevel: "campaign",
    dataClass: "performance",
    dateStart: "2024-01-01",
    dateStop: "2026-08-25",
    dimensions: ["campaign.id", "campaign.name", "campaign.status", "campaign.advertising_channel_type"],
    metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
  },
  {
    fileName: "device-performance-2024-01-01-to-2026-08-25.json",
    kind: "device-performance",
    entityLevel: "report",
    dataClass: "performance",
    dateStart: "2024-01-01",
    dateStop: "2026-08-25",
    dimensions: ["campaign.id", "campaign.name", "segments.device"],
    metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
    limitation: "Device breakdown is a separate report and must not be summed with campaign aggregates.",
  },
  {
    fileName: "ad-group-inventory.json",
    kind: "ad-group-inventory",
    entityLevel: "ad_group",
    dataClass: "inventory",
    dimensions: ["campaign.id", "ad_group.id", "ad_group.name", "ad_group.status"],
    metrics: [],
  },
  {
    fileName: "creative-inventory.json",
    kind: "creative-inventory",
    entityLevel: "ad",
    dataClass: "creative",
    dimensions: ["campaign.id", "ad_group.id", "ad_group_ad.ad.id", "ad_group_ad.status"],
    metrics: [],
    limitation: "Creative text is retained only in the private raw snapshot and is not exported by the classification summary.",
  },
  {
    fileName: "keyword-inventory-page-1.json",
    kind: "keyword-inventory-page-1",
    entityLevel: "report",
    dataClass: "keyword",
    dimensions: ["campaign.id", "ad_group.id", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type"],
    metrics: [],
    partial: true,
    limitation: "Keyword inventory is page 1 only; completeness is not claimed.",
  },
  {
    fileName: "keyword-inventory.json",
    kind: "keyword-inventory",
    entityLevel: "report",
    dataClass: "keyword",
    dimensions: ["campaign.id", "ad_group.id", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type"],
    metrics: [],
  },
  {
    fileName: "keyword-performance-2024-01-01-to-2026-08-25-page-1.json",
    kind: "keyword-performance-page-1",
    entityLevel: "report",
    dataClass: "performance",
    dateStart: "2024-01-01",
    dateStop: "2026-08-25",
    dimensions: ["campaign.id", "ad_group.id", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type"],
    metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
    partial: true,
    limitation: "Keyword performance is page 1 only; completeness is not claimed.",
  },
  {
    fileName: "keyword-performance-2024-01-01-to-2026-08-25.json",
    kind: "keyword-performance",
    entityLevel: "report",
    dataClass: "performance",
    dateStart: "2024-01-01",
    dateStop: "2026-08-25",
    dimensions: ["campaign.id", "campaign.name", "ad_group.id", "ad_group.name", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type"],
    metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
  },
  {
    fileName: "search-term-performance-top-100.json",
    kind: "search-term-performance-top-100",
    entityLevel: "report",
    dataClass: "search_term",
    dateStart: "2024-01-01",
    dateStop: "2026-08-25",
    dimensions: ["campaign.id", "campaign.name", "search_term_view.search_term"],
    metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
    partial: true,
    limitation: "This is a top-100 search-term sample, not a complete search-term census.",
  },
  {
    fileName: "conversion-actions.json",
    kind: "conversion-actions",
    entityLevel: "event",
    dataClass: "account",
    dimensions: ["conversion_action.id", "conversion_action.name", "conversion_action.status", "conversion_action.type"],
    metrics: [],
    limitation: "Conversion action inventory does not prove CRM, order, or revenue linkage.",
  },
] as const;

const BASE_LIMITATIONS = [
  "Account-owned operational evidence; not a general market benchmark.",
  "No account, campaign, budget, bid, audience, catalog, or payment mutation was performed.",
  "Currency is recorded as returned by Google Ads; it is not used as a proxy for market.",
  "Market-Validated remains false because provider data alone does not satisfy the formal market evidence gate.",
];

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsFromRaw(raw: unknown): RawRecord[] {
  if (!isRecord(raw) || !isRecord(raw.result) || !Array.isArray(raw.result.rows)) return [];
  return raw.result.rows.filter(isRecord);
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, value);
}

function textAt(value: unknown, path: string): string | undefined {
  const raw = readPath(value, path);
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function idAt(value: unknown, path: string): string | undefined {
  const raw = readPath(value, path);
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return undefined;
}

function sha256ForRaw(raw: unknown): string {
  return createHash("sha256").update(JSON.stringify(raw)).digest("hex");
}

function contentSignalsForRows(accountId: string, file: GoogleAdsReadOnlyFileInput, kind: string, rows: RawRecord[], observedAt: string): ProviderContentSignal[] {
  const signals: ProviderContentSignal[] = [];
  rows.forEach((row, index) => {
    const campaignId = idAt(row, "campaign.id");
    const campaignName = textAt(row, "campaign.name");
    if (campaignName && campaignId) {
      signals.push({
        contractVersion: PLATFORM_CONTRACT_VERSION,
        signalId: `${accountId}-${kind}-${index}-campaign-name`,
        provider: "google_ads",
        accountId,
        entityLevel: "campaign",
        entityId: campaignId,
        entityName: campaignName,
        signalType: "campaign_name",
        text: campaignName,
        sourceRef: `${file.fileName}#${index}`,
        observedAt,
      });
    }
    const adGroupName = textAt(row, "adGroup.name");
    if (adGroupName && campaignId) {
      signals.push({
        contractVersion: PLATFORM_CONTRACT_VERSION,
        signalId: `${accountId}-${kind}-${index}-ad-group-name`,
        provider: "google_ads",
        accountId,
        entityLevel: "ad_group",
        entityId: campaignId,
        entityName: adGroupName,
        signalType: "ad_group_name",
        text: adGroupName,
        sourceRef: `${file.fileName}#${index}`,
        observedAt,
      });
    }
    const keyword = textAt(row, "adGroupCriterion.keyword.text");
    if (keyword && campaignId) {
      signals.push({
        contractVersion: PLATFORM_CONTRACT_VERSION,
        signalId: `${accountId}-${kind}-${index}-keyword`,
        provider: "google_ads",
        accountId,
        entityLevel: "report",
        entityId: campaignId,
        signalType: "keyword",
        text: keyword,
        sourceRef: `${file.fileName}#${index}`,
        observedAt,
      });
    }
    const searchTerm = textAt(row, "searchTermView.searchTerm");
    if (searchTerm && campaignId) {
      signals.push({
        contractVersion: PLATFORM_CONTRACT_VERSION,
        signalId: `${accountId}-${kind}-${index}-search-term`,
        provider: "google_ads",
        accountId,
        entityLevel: "report",
        entityId: campaignId,
        signalType: "keyword",
        text: searchTerm,
        sourceRef: `${file.fileName}#${index}`,
        observedAt,
      });
    }
  });
  return signals;
}

function classificationSummary(classification: ProviderContentClassification) {
  return {
    primaryIndustryKey: classification.primaryIndustryKey,
    reviewStatus: "unreviewed" as const,
    industryCandidates: classification.industryCandidates,
    marketCandidates: classification.marketCandidates,
  };
}

function classifyCampaigns(account: GoogleAdsReadOnlyAccountInput, files: GoogleAdsReadOnlyFileInput[], generatedAt: string) {
  const signalFiles = files.filter((file) => /campaign-inventory|creative-inventory|keyword-inventory|search-term-performance/.test(file.fileName));
  const byCampaign = new Map<string, ProviderContentSignal[]>();
  for (const file of signalFiles) {
    const kind = file.fileName.replace(/\.json$/, "");
    for (const signal of contentSignalsForRows(account.accountId, file, kind, rowsFromRaw(file.raw), generatedAt)) {
      if (!signal.entityId) continue;
      const bucket = byCampaign.get(signal.entityId) ?? [];
      bucket.push(signal);
      byCampaign.set(signal.entityId, bucket);
    }
  }

  const campaignIds = [...byCampaign.keys()].sort();
  const classifications = campaignIds.map((campaignId) => classifyProviderContent({
    classificationId: contentClassificationId("google_ads", account.accountId, campaignId),
    provider: "google_ads",
    accountId: account.accountId,
    entityLevel: "campaign",
    entityId: campaignId,
    generatedAt,
    signals: byCampaign.get(campaignId) ?? [],
  }));

  const summaries = classifications.map((classification) => ({
    campaignId: classification.entityId ?? "unknown",
    ...classificationSummary(classification),
  }));
  const partitions = classifications.map((classification) => {
    const candidateIndustry = classification.primaryIndustryKey;
    const candidateMarket: KnowledgeMarket = candidateIndustry === "telecom" ? "SA" : "EG";
    const topConfidence = classification.industryCandidates[0]?.confidence ?? 0;
    return {
      accountId: account.accountId,
      campaignId: classification.entityId ?? "unknown",
      candidateIndustry,
      candidateMarket,
      reviewStatus: "unreviewed" as const,
      classificationId: classification.classificationId,
      confidence: topConfidence,
      signalCount: byCampaign.get(classification.entityId ?? "")?.length ?? 0,
    };
  });
  return { summaries, partitions };
}

function collectionFor(account: GoogleAdsReadOnlyAccountInput, file: GoogleAdsReadOnlyFileInput, spec: FileSpec, generatedAt: string): GoogleAdsNormalizedCollection {
  const rows = rowsFromRaw(file.raw);
  const status = rows.length === 0 ? "empty" : spec.partial ? "partial" : "complete";
  const limitations = [
    ...BASE_LIMITATIONS,
    "Segmented reports must not be summed with overlapping unsegmented reports.",
    ...(spec.limitation ? [spec.limitation] : []),
  ];
  const collection = parsePlatformCollection({
    contractVersion: PLATFORM_CONTRACT_VERSION,
    provider: "google_ads",
    accountId: account.accountId,
    ...(account.accountName ? { accountName: account.accountName } : {}),
    entityLevel: spec.entityLevel,
    ...(spec.dateStart ? { dateStart: spec.dateStart } : {}),
    ...(spec.dateStop ? { dateStop: spec.dateStop } : {}),
    dimensions: spec.dimensions,
    metrics: spec.metrics,
    currency: account.currency,
    timezone: account.timezone,
    scopeStatus: "verified",
    status,
    queryHash: `google-ads-${account.accountId}-${spec.kind}-${spec.dateStart ?? "inventory"}-${spec.dateStop ?? "current"}`,
    capturedAt: generatedAt,
    rows,
    limitations,
    metadata: {
      kind: spec.kind,
      dataClass: spec.dataClass,
      aggregationGroup: spec.dataClass === "performance" ? `google-ads-${account.accountId}-${spec.dateStart}-${spec.dateStop}` : `google-ads-${account.accountId}-${spec.dataClass}`,
      rawSha256: file.rawSha256 || sha256ForRaw(file.raw),
      sourceFile: file.fileName,
      pageLimited: Boolean(spec.partial),
      currencySource: "official_customer_health_or_account_config",
    },
  });
  return {
    ...collection,
    dataClass: spec.dataClass,
    kind: spec.kind,
    rawSha256: file.rawSha256 || sha256ForRaw(file.raw),
    sourceFile: file.fileName,
    aggregationGroup: String(collection.metadata.aggregationGroup),
  };
}

function filesBySpec(account: GoogleAdsReadOnlyAccountInput, spec: FileSpec): GoogleAdsReadOnlyFileInput | undefined {
  return account.files.find((file) => file.fileName === spec.fileName);
}

function packagesForAccount(account: GoogleAdsReadOnlyAccountInput, collections: GoogleAdsNormalizedCollection[], generatedAt: string, locale: KnowledgeLocale): EvidencePackage[] {
  const market = account.market;
  if (account.scopeReviewStatus !== "user_confirmed" || market === "mixed") return [];
  const registry = new SourceRegistry();
  return collections
    .filter((collection) => collection.status === "complete" && collection.dataClass === "performance" && collection.kind === "campaign-performance")
    .map((collection) => buildProviderEvidencePackage(registry, {
      collection,
      market,
      industry: account.industry,
      locale,
      currency: account.currency,
      capturedAt: generatedAt,
    }));
}

export function normalizeGoogleAdsReadOnly(input: GoogleAdsReadOnlyNormalizerInput): GoogleAdsReadOnlyNormalizedOutput {
  const generatedAt = input.generatedAt ?? GOOGLE_ADS_CAPTURED_AT;
  const locale = input.locale ?? "ar";
  const accounts: GoogleAdsNormalizedAccount[] = input.accounts.map((account) => {
    if (!GOOGLE_ADS_ALLOWED_ACCOUNT_IDS.includes(account.accountId as typeof GOOGLE_ADS_ALLOWED_ACCOUNT_IDS[number])) {
      throw new Error(`Account ${account.accountId} is not in the explicit Google Ads allowlist.`);
    }
    if (account.accountId === "6899137548" && (account.market !== "EG" || account.currency !== "SAR")) {
      throw new Error("Account 6899137548 must be represented as market EG with currency SAR.");
    }
    const collections = FILE_SPECS.flatMap((spec) => {
      const file = filesBySpec(account, spec);
      return file ? [collectionFor(account, file, spec, generatedAt)] : [];
    });
    const campaignData = classifyCampaigns(account, account.files, generatedAt);
    return {
      accountId: account.accountId,
      ...(account.accountName ? { accountName: account.accountName } : {}),
      market: account.market,
      industry: account.industry,
      currency: account.currency,
      timezone: account.timezone,
      scopeReviewStatus: account.scopeReviewStatus,
      marketValidated: false,
      currencyMarketMismatch: account.accountId === "6899137548",
      campaignPartitions: campaignData.partitions,
      collections,
      contentClassifications: campaignData.summaries,
      limitations: [
        ...BASE_LIMITATIONS,
        ...(account.accountId === "4282900193" ? [
          "Account 4282900193 contains multiple campaign themes; no single account-level industry or market is asserted.",
          "Campaign partitions are deterministic candidates and remain unreviewed; they are not attached to a canonical industry profile.",
        ] : []),
        ...(account.accountId === "6899137548" ? [
          "User-confirmed activity is Egyptian home maintenance; SAR is an account-currency mismatch and not a Saudi-market signal.",
        ] : []),
      ],
    };
  });

  const blockedAccounts = input.blockedAccounts ?? [{
    accountId: GOOGLE_ADS_BLOCKED_ACCOUNT_ID,
    status: "unavailable" as const,
    reason: "USER_PERMISSION_DENIED; no usable rows were collected and no retry was performed without a new authorization basis.",
  }];
  const deferredAccounts: GoogleAdsDeferredAccount[] = blockedAccounts.map((account) => ({
    accountId: account.accountId,
    status: "deferred",
    accessStatus: account.status,
    reason: account.reason,
    retryGate: "new_authorization_or_direct_user_access",
    mergePolicy: "merge_only_after_scope_and_hash_verification",
    excludedFromPackages: true,
    marketValidated: false,
  }));

  const packages = accounts.flatMap((account) => packagesForAccount(
    input.accounts.find((candidate) => candidate.accountId === account.accountId) as GoogleAdsReadOnlyAccountInput,
    account.collections,
    generatedAt,
    locale,
  ));

  return {
    contractVersion: GOOGLE_ADS_READONLY_NORMALIZER_VERSION,
    provider: "google_ads",
    generatedAt,
    allowedAccountIds: GOOGLE_ADS_ALLOWED_ACCOUNT_IDS,
    blockedAccountIds: [GOOGLE_ADS_BLOCKED_ACCOUNT_ID],
    ownershipAssertion: "user_confirmed_account_access",
    marketValidated: false,
    aggregationPolicy: {
      campaignAggregateIsSeparateFromBreakdowns: true,
      performanceIsSeparateFromInventory: true,
      performanceIsSeparateFromCreativeAndKeywordContent: true,
      currencyConversion: "google_ads_cost_micros_divided_by_1000000",
    },
    accounts,
    blockedAccounts,
    deferredAccounts,
    packages,
  };
}

export function rawSha256(raw: unknown): string {
  return sha256ForRaw(raw);
}

export function googleAdsFileSpecs(): readonly FileSpec[] {
  return FILE_SPECS;
}

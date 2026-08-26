import { createHash } from "node:crypto";
import type { EvidencePackage, KnowledgeCurrency, KnowledgeLocale } from "@/lib/contracts/knowledge";
import {
  PLATFORM_CONTRACT_VERSION,
  parsePlatformCollection,
  type PlatformCollection,
  type PlatformEntityLevel,
} from "./provider-snapshot-contracts";

export const TIKTOK_READONLY_NORMALIZER_VERSION = "1.0" as const;
export const TIKTOK_READONLY_AUTHORIZATION_SCOPE = "current_tiktok_for_business_token_only" as const;

export type TikTokReadOnlyDataClass = "account" | "performance" | "inventory" | "creative";

export type TikTokReadOnlyFileInput = {
  fileName: string;
  raw: unknown;
  rawSha256: string;
  dataClass: TikTokReadOnlyDataClass;
  entityLevel: PlatformEntityLevel;
  dimensions: string[];
  metrics: string[];
  dateStart?: string;
  dateStop?: string;
  partial?: boolean;
  limitation?: string;
};

export type TikTokReadOnlyAccountInput = {
  accountId: string;
  accountName: string;
  country?: string;
  currency?: KnowledgeCurrency;
  timezone?: string;
  scopeStatus: "verified" | "unverified";
  files: TikTokReadOnlyFileInput[];
};

export type TikTokNormalizedCollection = PlatformCollection & {
  dataClass: TikTokReadOnlyDataClass;
  rawSha256: string;
  sourceFile: string;
  aggregationGroup: string;
};

export type TikTokCreativeSummary = {
  accountId: string;
  adRows: number;
  campaignIds: number;
  adGroupIds: number;
  rowsWithText: number;
  rowsWithLandingPageUrl: number;
  rowsWithVideoOrImageAsset: number;
  rawCreativeContentRetainedPrivately: true;
  rawCreativeContentExportedToSummary: false;
};

export type TikTokNormalizedAccount = {
  accountId: string;
  accountName: string;
  country?: string;
  currency?: KnowledgeCurrency;
  timezone?: string;
  scopeStatus: "verified" | "unverified";
  marketValidated: false;
  industryScopeStatus: "unmapped";
  marketScopeStatus: "unmapped";
  collections: TikTokNormalizedCollection[];
  creativeSummary: TikTokCreativeSummary;
  limitations: string[];
};

export type TikTokReadOnlyNormalizedOutput = {
  contractVersion: typeof TIKTOK_READONLY_NORMALIZER_VERSION;
  provider: "tiktok_ads";
  authorizationScope: typeof TIKTOK_READONLY_AUTHORIZATION_SCOPE;
  generatedAt: string;
  accountIds: readonly string[];
  marketValidated: false;
  deduplication: {
    priorSnapshotsReused: true;
    newPerformanceWindow: { startDate: string; endDate: string };
    duplicateSuccessfulQueriesAvoided: true;
    failedQueryCorrectionsRecorded: true;
  };
  aggregationPolicy: {
    campaignAggregateIsSeparateFromBreakdowns: true;
    performanceIsSeparateFromInventory: true;
    performanceIsSeparateFromCreativeContent: true;
    segmentedReportsMustNotBeSummedWithOverlappingReports: true;
  };
  accounts: TikTokNormalizedAccount[];
  packages: EvidencePackage[];
  packageBlockers: string[];
};

type RawRecord = Record<string, unknown>;

type FileSpec = Omit<TikTokReadOnlyFileInput, "raw" | "rawSha256"> & { fileName: string };

const BASE_LIMITATIONS = [
  "Account-owned TikTok operational evidence; not a general market benchmark.",
  "No campaign, ad group, ad, budget, bid, audience, catalog, payment, or account mutation was performed.",
  "Platform currency and country metadata are retained as account metadata and are not used to infer market scope.",
  "Industry and market mapping remains unmapped until a reviewed account/campaign scope is supplied.",
  "Market-Validated remains false; TikTok account performance does not satisfy the independent market evidence gate.",
] as const;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowsFromRaw(raw: unknown): RawRecord[] {
  if (!isRecord(raw) || !isRecord(raw.data) || !Array.isArray(raw.data.list)) return [];
  return raw.data.list.filter(isRecord);
}

function codeFromRaw(raw: unknown): number | undefined {
  return isRecord(raw) && typeof raw.code === "number" ? raw.code : undefined;
}

function sha256ForRaw(raw: unknown): string {
  return createHash("sha256").update(JSON.stringify(raw)).digest("hex");
}

function nestedText(row: RawRecord, key: string): string | undefined {
  const direct = row[key];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return undefined;
}

function idSet(rows: RawRecord[], key: string): Set<string> {
  return new Set(rows.map((row) => nestedText(row, key)).filter((value): value is string => Boolean(value)));
}

function creativeSummary(accountId: string, files: TikTokReadOnlyFileInput[]): TikTokCreativeSummary {
  const adFile = files.find((file) => file.dataClass === "creative" && file.entityLevel === "ad");
  const rows = adFile ? rowsFromRaw(adFile.raw) : [];
  return {
    accountId,
    adRows: rows.length,
    campaignIds: idSet(rows, "campaign_id").size,
    adGroupIds: idSet(rows, "adgroup_id").size,
    rowsWithText: rows.filter((row) => Boolean(nestedText(row, "ad_text"))).length,
    rowsWithLandingPageUrl: rows.filter((row) => Boolean(nestedText(row, "landing_page_url"))).length,
    rowsWithVideoOrImageAsset: rows.filter((row) => Boolean(nestedText(row, "video_id") || nestedText(row, "image_ids"))).length,
    rawCreativeContentRetainedPrivately: true,
    rawCreativeContentExportedToSummary: false,
  };
}

function collectionFor(account: TikTokReadOnlyAccountInput, file: TikTokReadOnlyFileInput, generatedAt: string): TikTokNormalizedCollection {
  const rows = rowsFromRaw(file.raw);
  const code = codeFromRaw(file.raw);
  const status = code !== undefined && code !== 0
    ? "failed"
    : rows.length === 0
      ? "empty"
      : file.partial
        ? "partial"
        : "complete";
  const rawSha256 = file.rawSha256 || sha256ForRaw(file.raw);
  const queryHash = createHash("sha256").update(JSON.stringify({
    provider: "tiktok_ads",
    accountId: account.accountId,
    fileName: file.fileName,
    dimensions: file.dimensions,
    metrics: file.metrics,
    dateStart: file.dateStart,
    dateStop: file.dateStop,
  })).digest("hex");
  const limitations = [
    ...BASE_LIMITATIONS,
    "Segmented reports must not be summed with overlapping unsegmented reports.",
    ...(file.limitation ? [file.limitation] : []),
    ...(code !== undefined && code !== 0 ? [`TikTok response code ${code}; no usable rows are exposed.`] : []),
  ];
  const collection = parsePlatformCollection({
    contractVersion: PLATFORM_CONTRACT_VERSION,
    provider: "tiktok_ads",
    accountId: account.accountId,
    accountName: account.accountName,
    entityLevel: file.entityLevel,
    ...(file.dateStart ? { dateStart: file.dateStart } : {}),
    ...(file.dateStop ? { dateStop: file.dateStop } : {}),
    dimensions: file.dimensions,
    metrics: file.metrics,
    ...(account.currency ? { currency: account.currency } : {}),
    ...(account.timezone ? { timezone: account.timezone } : {}),
    scopeStatus: account.scopeStatus,
    status,
    queryHash: `tiktok-${account.accountId}-${queryHash}`,
    capturedAt: generatedAt,
    rows: status === "failed" ? [] : rows,
    limitations,
    metadata: {
      dataClass: file.dataClass,
      rawSha256,
      sourceFile: file.fileName,
      aggregationGroup: file.dataClass === "performance"
        ? `tiktok-${account.accountId}-${file.dateStart}-${file.dateStop}`
        : `tiktok-${account.accountId}-${file.dataClass}`,
      advertiserCountry: account.country ?? "unavailable",
      currencySource: account.currency ? "prior_official_advertiser_info_snapshot" : "unavailable",
      pageLimited: Boolean(file.partial),
      responseCode: code ?? 0,
    },
  });
  return {
    ...collection,
    dataClass: file.dataClass,
    rawSha256,
    sourceFile: file.fileName,
    aggregationGroup: String(collection.metadata.aggregationGroup),
  };
}

function packagesForAccount(_account: TikTokNormalizedAccount, _generatedAt: string, _locale: KnowledgeLocale): EvidencePackage[] {
  // Current TikTok accounts are deliberately unmapped at market/industry level.
  // Keep this extension point explicit but produce no package until a reviewed
  // exact scope is supplied by the user or a trusted project mapping.
  return [];
}

export function normalizeTikTokReadOnly(input: {
  generatedAt: string;
  locale?: KnowledgeLocale;
  newPerformanceWindow: { startDate: string; endDate: string };
  accounts: TikTokReadOnlyAccountInput[];
}): TikTokReadOnlyNormalizedOutput {
  const locale = input.locale ?? "ar";
  const accounts = input.accounts.map((account) => {
    const collections = account.files.map((file) => collectionFor(account, file, input.generatedAt));
    return {
      accountId: account.accountId,
      accountName: account.accountName,
      ...(account.country ? { country: account.country } : {}),
      ...(account.currency ? { currency: account.currency } : {}),
      ...(account.timezone ? { timezone: account.timezone } : {}),
      scopeStatus: account.scopeStatus,
      marketValidated: false as const,
      industryScopeStatus: "unmapped" as const,
      marketScopeStatus: "unmapped" as const,
      collections,
      creativeSummary: creativeSummary(account.accountId, account.files),
      limitations: [...BASE_LIMITATIONS],
    } satisfies TikTokNormalizedAccount;
  });
  return {
    contractVersion: TIKTOK_READONLY_NORMALIZER_VERSION,
    provider: "tiktok_ads",
    authorizationScope: TIKTOK_READONLY_AUTHORIZATION_SCOPE,
    generatedAt: input.generatedAt,
    accountIds: accounts.map((account) => account.accountId),
    marketValidated: false,
    deduplication: {
      priorSnapshotsReused: true,
      newPerformanceWindow: input.newPerformanceWindow,
      duplicateSuccessfulQueriesAvoided: true,
      failedQueryCorrectionsRecorded: true,
    },
    aggregationPolicy: {
      campaignAggregateIsSeparateFromBreakdowns: true,
      performanceIsSeparateFromInventory: true,
      performanceIsSeparateFromCreativeContent: true,
      segmentedReportsMustNotBeSummedWithOverlappingReports: true,
    },
    accounts,
    packages: accounts.flatMap((account) => packagesForAccount(account, input.generatedAt, locale)),
    packageBlockers: [
      "No exact market mapping was supplied for the TikTok advertiser accounts in this collection.",
      "No exact industry mapping was supplied for the TikTok advertiser accounts in this collection.",
      "Account-owned operational evidence is not independent market evidence.",
    ],
  };
}

export function tiktokReadOnlyFileSpecs(): readonly FileSpec[] {
  return [
    {
      fileName: "2026-08-26_21-49-19.884157677_tiktok-for-business_auth_advertiser_get_559bc690.json",
      dataClass: "account",
      entityLevel: "account",
      dimensions: ["advertiser_id", "advertiser_name"],
      metrics: [],
    },
    {
      fileName: "2026-08-26_21-52-16.019214724_tiktok-for-business_adgroup_get_0c0a78a4.json",
      dataClass: "inventory",
      entityLevel: "ad_group",
      dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "adgroup_name", "operation_status", "secondary_status"],
      metrics: [],
    },
    {
      fileName: "2026-08-26_21-52-47.391234280_tiktok-for-business_adgroup_get_83527823.json",
      dataClass: "inventory",
      entityLevel: "ad_group",
      dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "adgroup_name", "operation_status", "secondary_status"],
      metrics: [],
    },
    {
      fileName: "2026-08-26_21-53-44.623585693_tiktok-for-business_report_integrated_get_a98d5c0c.json",
      dataClass: "performance",
      entityLevel: "campaign",
      dateStart: "2026-08-23",
      dateStop: "2026-08-26",
      dimensions: ["campaign_id"],
      metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"],
    },
    {
      fileName: "2026-08-26_21-54-10.408100357_tiktok-for-business_report_integrated_get_4343f88e.json",
      dataClass: "performance",
      entityLevel: "campaign",
      dateStart: "2026-08-23",
      dateStop: "2026-08-26",
      dimensions: ["campaign_id"],
      metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"],
    },
    {
      fileName: "2026-08-26_21-54-32.569802605_tiktok-for-business_report_integrated_get_d31ed52b.json",
      dataClass: "performance",
      entityLevel: "campaign",
      dateStart: "2026-08-23",
      dateStop: "2026-08-26",
      dimensions: ["campaign_id"],
      metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"],
    },
    {
      fileName: "2026-08-26_21-54-53.233139053_tiktok-for-business_report_integrated_get_b4d7342d.json",
      dataClass: "performance",
      entityLevel: "campaign",
      dateStart: "2026-08-23",
      dateStop: "2026-08-26",
      dimensions: ["campaign_id"],
      metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"],
    },
    {
      fileName: "2026-08-26_21-55-31.964219022_tiktok-for-business_ad_get_fcfd863f.json",
      dataClass: "creative",
      entityLevel: "ad",
      dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "ad_id", "ad_name", "operation_status", "secondary_status"],
      metrics: [],
      limitation: "Creative text, landing-page URLs, phone fields, and asset identifiers remain in the private raw snapshot and are not exported in the sanitized summary.",
    },
    {
      fileName: "2026-08-26_21-55-50.070442283_tiktok-for-business_ad_get_5025204a.json",
      dataClass: "creative",
      entityLevel: "ad",
      dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "ad_id", "ad_name", "operation_status", "secondary_status"],
      metrics: [],
      limitation: "Creative content was not present in the returned rows; the empty response is not interpreted as absence of historical creatives.",
    },
  ];
}

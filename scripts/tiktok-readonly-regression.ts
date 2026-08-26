import assert from "node:assert/strict";
import { normalizeTikTokReadOnly, type TikTokReadOnlyFileInput } from "../src/lib/knowledge/providers/tiktok-readonly-normalizer";

const generatedAt = "2026-08-27T00:00:00.000Z";
const performanceWindow = { startDate: "2026-08-23", endDate: "2026-08-26" } as const;

function rawList(list: Record<string, unknown>[]): unknown {
  return { code: 0, message: "OK", data: { list, page_info: { page: 1, page_size: 1000, total_number: list.length, total_page: 1 } } };
}

function file(overrides: Partial<TikTokReadOnlyFileInput> & Pick<TikTokReadOnlyFileInput, "fileName" | "dataClass" | "entityLevel">): TikTokReadOnlyFileInput {
  return {
    fileName: overrides.fileName,
    dataClass: overrides.dataClass,
    entityLevel: overrides.entityLevel,
    dimensions: overrides.dimensions ?? ["campaign_id"],
    metrics: overrides.metrics ?? ["spend", "impressions", "clicks"],
    dateStart: overrides.dateStart ?? performanceWindow.startDate,
    dateStop: overrides.dateStop ?? performanceWindow.endDate,
    rawSha256: overrides.rawSha256 ?? "fixture-sha256",
    raw: overrides.raw ?? rawList([]),
    ...(overrides.partial === undefined ? { partial: true } : { partial: overrides.partial }),
    ...(overrides.limitation ? { limitation: overrides.limitation } : {}),
  };
}

const output = normalizeTikTokReadOnly({
  generatedAt,
  newPerformanceWindow: performanceWindow,
  accounts: [
    {
      accountId: "7215064338044944385",
      accountName: "Plan B0327",
      country: "EG",
      currency: "EGP",
      timezone: "Africa/Cairo",
      scopeStatus: "unverified",
      files: [file({ fileName: "planb-report.json", dataClass: "performance", entityLevel: "campaign", raw: rawList([{ dimensions: { campaign_id: "campaign-1" }, metrics: { spend: "10", impressions: "100", clicks: "5" } }]) })],
    },
    {
      accountId: "7302642673201119233",
      accountName: "Mr Moustafa",
      country: "EG",
      currency: "EGP",
      timezone: "Africa/Cairo",
      scopeStatus: "unverified",
      files: [file({ fileName: "mr-report.json", dataClass: "performance", entityLevel: "campaign", raw: rawList([{ dimensions: { campaign_id: "campaign-2" }, metrics: { spend: "20", impressions: "200", clicks: "10" } }]) })],
    },
    {
      accountId: "7304560039707328514",
      accountName: "Deega",
      country: "EG",
      currency: "EGP",
      timezone: "Africa/Cairo",
      scopeStatus: "unverified",
      files: [file({ fileName: "deega-report.json", dataClass: "performance", entityLevel: "campaign" })],
    },
    {
      accountId: "7556312373204795409",
      accountName: "windoor solutions",
      country: "EG",
      currency: "EGP",
      timezone: "Etc/GMT-2",
      scopeStatus: "unverified",
      files: [
        file({ fileName: "windoor-report.json", dataClass: "performance", entityLevel: "campaign", raw: rawList([{ dimensions: { campaign_id: "campaign-3" }, metrics: { spend: "30", impressions: "300", clicks: "15" } }]) }),
        file({ fileName: "windoor-creative.json", dataClass: "creative", entityLevel: "ad", dimensions: ["campaign_id", "adgroup_id", "ad_id"], metrics: [], raw: rawList([{ advertiser_id: "7556312373204795409", campaign_id: "campaign-3", adgroup_id: "group-3", ad_id: "ad-3", ad_text: "private fixture text", landing_page_url: "https://private.example", video_id: "video-3" }]) }),
      ],
    },
  ],
});

assert.equal(output.provider, "tiktok_ads");
assert.equal(output.authorizationScope, "current_tiktok_for_business_token_only");
assert.deepEqual(output.accountIds, ["7215064338044944385", "7302642673201119233", "7304560039707328514", "7556312373204795409"]);
assert.equal(output.accounts.length, 4);
assert.equal(output.accounts.reduce((sum, account) => sum + account.collections.length, 0), 5);
assert.equal(output.packages.length, 0);
assert.equal(output.marketValidated, false);
assert.equal(output.deduplication.priorSnapshotsReused, true);
assert.equal(output.deduplication.duplicateSuccessfulQueriesAvoided, true);
assert.deepEqual(output.deduplication.newPerformanceWindow, performanceWindow);
assert.ok(output.packageBlockers.length >= 3);
assert.ok(output.accounts.every((account) => account.marketValidated === false));
assert.ok(output.accounts.every((account) => account.marketScopeStatus === "unmapped" && account.industryScopeStatus === "unmapped"));
const windoor = output.accounts.find((account) => account.accountId === "7556312373204795409");
assert.ok(windoor);
assert.equal(windoor.creativeSummary.adRows, 1);
assert.equal(windoor.creativeSummary.rowsWithText, 1);
assert.equal(windoor.creativeSummary.rowsWithLandingPageUrl, 1);
assert.equal(windoor.creativeSummary.rowsWithVideoOrImageAsset, 1);
assert.equal(windoor.creativeSummary.rawCreativeContentExportedToSummary, false);
assert.ok(windoor.collections.every((collection) => collection.status === "partial" || collection.status === "empty"));

console.log(JSON.stringify({
  test: "tiktok-readonly-regression",
  status: "PASS",
  assertions: 18,
  accountCount: output.accounts.length,
  collectionCount: output.accounts.reduce((sum, account) => sum + account.collections.length, 0),
  packageCount: output.packages.length,
  marketValidated: output.marketValidated,
  rawCreativeContentExportedToSummary: false,
  message: "TikTok account discovery, non-overlapping window, fail-closed scope mapping, creative/performance separation, and package blocking passed.",
}, null, 2));

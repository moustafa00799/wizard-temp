import assert from "node:assert/strict";
import {
  normalizeGoogleAdsReadOnly,
  rawSha256,
  type GoogleAdsReadOnlyFileInput,
} from "../src/lib/knowledge/providers/google-ads-readonly-normalizer";

const capturedAt = "2026-08-26T19:20:00.000Z";

function file(fileName: string, rows: Record<string, unknown>[]): GoogleAdsReadOnlyFileInput {
  const raw = { success: true, result: { fieldMask: [], rows } };
  return { fileName, raw, rawSha256: rawSha256(raw) };
}

const output = normalizeGoogleAdsReadOnly({
  generatedAt: capturedAt,
  locale: "ar",
  accounts: [
    {
      accountId: "4282900193",
      currency: "EGP",
      timezone: "Africa/Cairo",
      market: "mixed",
      industry: "mixed_or_multi_industry",
      scopeReviewStatus: "user_confirmed",
      files: [
        file("customer-health.json", [{ customer: { id: "4282900193", currencyCode: "EGP", timeZone: "Africa/Cairo" } }]),
        file("campaign-inventory.json", [
          { campaign: { id: "education-1", name: "Egypt Math Prep" } },
          { campaign: { id: "service-1", name: "صيانة منزلية مصر" } },
          { campaign: { id: "telecom-1", name: "Saudi Mobily Router" } },
        ]),
        file("keyword-inventory-page-1.json", [
          { campaign: { id: "education-1" }, adGroupCriterion: { keyword: { text: "math revision" } } },
        ]),
        file("campaign-performance-2024-01-01-to-2026-08-25.json", [
          { campaign: { id: "education-1", name: "Egypt Math Prep" }, metrics: { impressions: 100, clicks: 5, costMicros: 1500000, conversions: 1, conversionsValue: 10 } },
        ]),
      ],
    },
    {
      accountId: "6899137548",
      currency: "SAR",
      timezone: "Asia/Riyadh",
      market: "EG",
      industry: "local_service_general",
      scopeReviewStatus: "user_confirmed",
      files: [
        file("customer-health.json", [{ customer: { id: "6899137548", currencyCode: "SAR", timeZone: "Asia/Riyadh" } }]),
        file("campaign-inventory.json", [{ campaign: { id: "service-689", name: "صيانة منزلية مصر" } }]),
        file("keyword-inventory.json", [{ campaign: { id: "service-689" }, adGroupCriterion: { keyword: { text: "صيانة منزلية" } } }]),
        file("campaign-performance-2024-01-01-to-2026-08-25.json", [
          { campaign: { id: "service-689", name: "صيانة منزلية مصر" }, metrics: { impressions: 84, clicks: 2, costMicros: 31612213, conversions: 0, conversionsValue: 0 } },
        ]),
      ],
    },
  ],
  blockedAccounts: [{
    accountId: "9397976723",
    status: "unavailable",
    reason: "USER_PERMISSION_DENIED; fixture confirms blocked read-only scope.",
  }],
});

assert.equal(output.provider, "google_ads");
assert.equal(output.marketValidated, false);
assert.deepEqual(output.allowedAccountIds, ["4282900193", "6899137548"]);
assert.deepEqual(output.blockedAccountIds, ["9397976723"]);
assert.deepEqual(output.aggregationPolicy, {
  campaignAggregateIsSeparateFromBreakdowns: true,
  performanceIsSeparateFromInventory: true,
  performanceIsSeparateFromCreativeAndKeywordContent: true,
  currencyConversion: "google_ads_cost_micros_divided_by_1000000",
});

const mixed = output.accounts.find((account) => account.accountId === "4282900193");
assert.ok(mixed);
assert.equal(mixed.market, "mixed");
assert.equal(mixed.industry, "mixed_or_multi_industry");
assert.equal(mixed.campaignPartitions.length, 3);
assert.deepEqual(
  mixed.campaignPartitions.map((partition) => [partition.campaignId, partition.candidateIndustry, partition.candidateMarket]),
  [
    ["education-1", "education", "EG"],
    ["service-1", "local_service", "EG"],
    ["telecom-1", "telecom", "SA"],
  ],
);
assert.equal(mixed.campaignPartitions.every((partition) => partition.reviewStatus === "unreviewed"), true);
assert.equal(output.packages.some((pkg) => pkg.market === "SA"), false);
assert.equal(mixed.collections.find((collection) => collection.kind === "keyword-inventory-page-1")?.status, "partial");

const egyptianService = output.accounts.find((account) => account.accountId === "6899137548");
assert.ok(egyptianService);
assert.equal(egyptianService.market, "EG");
assert.equal(egyptianService.currency, "SAR");
assert.equal(egyptianService.industry, "local_service_general");
assert.equal(egyptianService.currencyMarketMismatch, true);
assert.equal(egyptianService.campaignPartitions.length, 1);
assert.equal(egyptianService.campaignPartitions[0]?.candidateIndustry, "local_service");
assert.equal(egyptianService.campaignPartitions[0]?.candidateMarket, "EG");
const servicePackage = output.packages.find((pkg) => pkg.market === "EG");
assert.ok(servicePackage);
assert.equal(servicePackage.currency, "SAR");
assert.equal(servicePackage.status, "ready");
assert.equal(servicePackage.snapshots[0]?.facts.find((fact) => fact.factId === "google_ads-spend")?.value, 31.612213);
assert.equal(servicePackage.snapshots[0]?.facts.find((fact) => fact.factId === "google_ads-weighted-ctr")?.value, 2.380952);

assert.deepEqual(output.blockedAccounts, [{
  accountId: "9397976723",
  status: "unavailable",
  reason: "USER_PERMISSION_DENIED; fixture confirms blocked read-only scope.",
}]);
assert.equal(JSON.stringify(output).includes("createCampaign"), false);
assert.equal(JSON.stringify(output).includes("updateCampaign"), false);

console.log(JSON.stringify({
  test: "google-ads-readonly-regression",
  status: "PASS",
  assertions: 24,
  accounts: ["4282900193", "6899137548"],
  blockedAccount: "9397976723",
  campaignScope: { mixedAccount428: 3, egyptianService689: 1 },
  marketValidated: false,
  privateFixturesOnly: true,
}, null, 2));

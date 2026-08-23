import assert from "node:assert/strict";
import { EvidencePackageSchema } from "../src/lib/contracts/knowledge";
import { SourceRegistry, buildProviderEvidencePackage } from "../src/lib/knowledge";
import {
  PlatformCollectionSchema,
  type PlatformCollection,
} from "../src/lib/knowledge/providers/provider-snapshot-contracts";

const capturedAt = "2026-08-23T18:30:00.000Z";

function collection(input: Partial<PlatformCollection> & Pick<PlatformCollection, "provider" | "accountId" | "entityLevel" | "queryHash" | "rows">): PlatformCollection {
  return PlatformCollectionSchema.parse({
    contractVersion: "1.0",
    accountName: input.accountName ?? "Fixture account",
    dimensions: input.dimensions ?? [],
    metrics: input.metrics ?? [],
    scopeStatus: input.scopeStatus ?? "verified",
    status: input.status ?? "complete",
    capturedAt,
    limitations: input.limitations ?? ["Fixture is account-owned and not a market benchmark."],
    metadata: input.metadata ?? {},
    ...input,
  });
}

const google = collection({
  provider: "google_ads",
  accountId: "5805554566",
  entityLevel: "campaign",
  queryHash: "google-device-fixture-001",
  dateStart: "2023-07-23",
  dateStop: "2026-08-22",
  currency: "SAR",
  timezone: "Asia/Riyadh",
  dimensions: ["campaign.id", "segments.device"],
  metrics: ["metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.conversions_value"],
  rows: [{
    campaign: { id: "22053212540", name: "Fixture" },
    segments: { device: "MOBILE" },
    metrics: { impressions: "1000", clicks: "50", costMicros: "1500000", conversions: 2, conversionsValue: 10 },
  }],
});
const googleRegistry = new SourceRegistry();
const googlePackage = buildProviderEvidencePackage(googleRegistry, {
  collection: google,
  market: "SA",
  industry: "unclassified",
  locale: "ar",
  currency: "SAR",
  capturedAt,
});
assert.equal(googlePackage.status, "ready");
assert.equal(googlePackage.freshnessStatus, "fresh");
assert.equal(googleRegistry.list()[0]?.sourceId, "google_ads-account-5805554566");
assert.equal(googlePackage.snapshots[0]?.facts.find((fact) => fact.factId === "google_ads-spend")?.value, 1.5);
assert.equal(googlePackage.snapshots[0]?.facts.find((fact) => fact.factId === "google_ads-weighted-ctr")?.value, 5);
assert.ok(googlePackage.snapshots[0]?.facts.some((fact) => fact.name.includes("platform: MOBILE")));
EvidencePackageSchema.parse(googlePackage);

const tiktok = collection({
  provider: "tiktok_ads",
  accountId: "7556312373204795409",
  entityLevel: "campaign",
  queryHash: "tiktok-country-fixture-001",
  dateStart: "2025-08-23",
  dateStop: "2026-08-22",
  dimensions: ["country_code", "campaign_id"],
  metrics: ["spend", "impressions", "clicks", "conversion"],
  rows: [{
    dimensions: { country_code: "EG", campaign_id: "1845038325157106" },
    metrics: { spend: "8820.17", impressions: "697688", clicks: "9507", conversion: "0" },
  }],
});
const tiktokPackage = buildProviderEvidencePackage(new SourceRegistry(), {
  collection: tiktok,
  market: "EG",
  industry: "unclassified",
  locale: "ar",
  currency: "EGP",
  capturedAt,
});
assert.equal(tiktokPackage.status, "ready");
assert.equal(tiktokPackage.snapshots[0]?.facts.find((fact) => fact.factId === "tiktok_ads-spend")?.value, 8820.17);
assert.ok(tiktokPackage.snapshots[0]?.facts.some((fact) => fact.name.includes("country: EG")));

const ga4 = collection({
  provider: "ga4",
  accountId: "471345574",
  accountName: "https://enfrad.mystrikingly.com/",
  entityLevel: "property",
  queryHash: "ga4-traffic-fixture-001",
  dimensions: ["sessionDefaultChannelGroup"],
  metrics: ["sessions", "engagedSessions", "eventCount", "keyEvents", "totalRevenue"],
  rows: [{ sessions: 3, engagedSessions: 0, eventCount: 9, keyEvents: 0, totalRevenue: 0 }],
  metadata: { propertyId: "471345574", currencySource: "official_property" },
});
const ga4Package = buildProviderEvidencePackage(new SourceRegistry(), {
  collection: ga4,
  market: "SA",
  industry: "unclassified",
  locale: "ar",
  currency: "SAR",
  capturedAt,
});
assert.equal(ga4Package.status, "ready");
assert.equal(ga4Package.snapshots[0]?.facts.find((fact) => fact.factId === "ga4-sessions")?.value, 3);
assert.equal(ga4Package.snapshots[0]?.facts.find((fact) => fact.factId === "ga4-events")?.value, 9);

const empty = collection({
  provider: "tiktok_ads",
  accountId: "7304560039707328514",
  entityLevel: "account",
  queryHash: "tiktok-empty-fixture-001",
  status: "empty",
  rows: [],
});
const emptyPackage = buildProviderEvidencePackage(new SourceRegistry(), {
  collection: empty,
  market: "EG",
  industry: "unclassified",
  locale: "ar",
  currency: "EGP",
  capturedAt,
});
assert.equal(emptyPackage.status, "missing");
assert.equal(emptyPackage.freshnessStatus, "missing");
assert.equal(emptyPackage.sourceRecords.length, 0);
assert.equal(emptyPackage.claims.length, 0);
assert.ok(emptyPackage.snapshots[0]?.facts.every((fact) => fact.status === "unavailable"));

const unverified = collection({
  provider: "tiktok_ads",
  accountId: "7556312373204795409",
  entityLevel: "campaign",
  queryHash: "tiktok-unverified-fixture-001",
  scopeStatus: "unverified",
  status: "unverified",
  rows: [],
});
const unverifiedPackage = buildProviderEvidencePackage(new SourceRegistry(), {
  collection: unverified,
  market: "EG",
  industry: "unclassified",
  locale: "ar",
  currency: "EGP",
  capturedAt,
});
assert.equal(unverifiedPackage.status, "missing");
assert.equal(unverifiedPackage.sourceRecords.length, 0);

assert.throws(() => PlatformCollectionSchema.parse({
  ...google,
  status: "unverified",
  rows: [{ campaign: { id: "should-not-be-usable" } }],
}), /cannot expose usable rows/);

console.log(JSON.stringify({
  test: "provider-evidence-regression",
  status: "PASS",
  assertions: 16,
  providers: ["google_ads", "tiktok_ads", "ga4"],
  liveAiCalls: 0,
  marketValidated: false,
  message: "Provider-neutral additive facts, segmented evidence, missing-data handling, currency normalization, and unverified-scope fail-closed behavior passed.",
}, null, 2));

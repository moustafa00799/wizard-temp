import assert from "node:assert/strict";
import {
  buildEvidencePackage,
  SourceRegistry,
  type SourceRecord,
} from "../src/lib/knowledge";
import { EvidencePackageSchema, type MarketEvidenceSnapshot } from "../src/lib/contracts/knowledge";

function expectRejected(label: string, operation: () => unknown): void {
  assert.throws(operation, (error: unknown) => {
    assert.ok(error instanceof Error, `${label}: expected an Error`);
    return true;
  }, label);
}

const source: SourceRecord = {
  contractVersion: "1.0",
  sourceId: "src-official-policy-fixture",
  publisher: "Official Platform Documentation Fixture",
  sourceUrl: "https://developers.google.com/google-ads/api/docs/keyword-planning/overview",
  sourceType: "official_document",
  jurisdiction: "global",
  market: "EG",
  industry: "ecommerce_general",
  language: "en",
  licenseStatus: "approved",
  observedAt: "2026-08-21T00:00:00.000Z",
  freshnessPolicy: "weekly",
  limitations: ["This fixture covers documentation provenance only; it is not a market performance benchmark."],
  version: "fixture-1",
  enabled: true,
};

const registry = new SourceRegistry([source]);
registry.register({ ...source, version: "fixture-2", observedAt: "2026-08-21T12:00:00.000Z" });
assert.equal(registry.list().length, 1);
assert.equal(registry.listVersions(source.sourceId).length, 2);
assert.equal(registry.getVersion(source.sourceId, "fixture-1")?.version, "fixture-1");
assert.equal(registry.get(source.sourceId)?.version, "fixture-2");
assert.equal(registry.lookup({ market: "EG", industry: "ecommerce_general", language: "en" }).length, 1);
assert.equal(registry.lookup({ market: "SA", industry: "ecommerce_general", language: "en" }).length, 0);
const genericSource: SourceRecord = {
  ...source,
  sourceId: "src-generic-official-context",
  jurisdiction: "global",
  market: undefined,
  industry: undefined,
  language: undefined,
  version: "generic-1",
};
const genericRegistry = new SourceRegistry([genericSource]);
assert.equal(genericRegistry.lookup({ market: "EG", industry: "education_general", language: "ar" }).length, 1);
assert.equal(genericRegistry.lookup({ market: "SA", industry: "local_service_general", language: "en" }).length, 1);
assert.equal(registry.freshness(source.sourceId, new Date("2026-08-22T00:00:00.000Z"), "fixture-1").status, "fresh");
assert.equal(registry.freshness(source.sourceId, new Date("2026-08-27T00:00:00.000Z"), "fixture-1").status, "stale");
assert.equal(registry.freshness(source.sourceId, new Date("2026-08-30T00:00:00.000Z"), "fixture-1").status, "expired");
assert.equal(registry.assertUsable(source.sourceId, { market: "EG", industry: "ecommerce_general", language: "en" }).sourceId, source.sourceId);

const freshSnapshot: MarketEvidenceSnapshot = {
  contractVersion: "1.0",
  snapshotId: "snapshot-eg-ecommerce-policy-001",
  market: "EG",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "EGP",
  capturedAt: "2026-08-21T00:00:00.000Z",
  freshnessStatus: "fresh",
  facts: [{
    factId: "fact-policy-scope",
    name: "keyword_planning_documented",
    value: true,
    status: "evidence_backed",
    sourceIds: [source.sourceId],
    observedAt: "2026-08-21T00:00:00.000Z",
    scope: { market: "EG", industry: "ecommerce_general", locale: "ar", currency: "EGP" },
  }],
  competitorObservations: [],
  keywordSignals: [],
  seasonalitySignals: [],
  unknowns: ["Search volume, CPC, conversion rate, and saturation remain unavailable."],
  contradictions: [],
  sourceIds: [source.sourceId],
  confidence: 0.5,
  limitations: ["The source supports documentation scope, not current market performance."],
};

const readyPackage = buildEvidencePackage(registry, {
  packageId: "pkg-eg-ecommerce-policy-001",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "EG",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "EGP",
  snapshots: [freshSnapshot],
  evidenceReferences: [{
    evidenceId: "evidence-policy-001",
    sourceId: source.sourceId,
    observedAt: "2026-08-21T00:00:00.000Z",
    excerpt: "Official documentation fixture reference.",
    limitations: ["No financial or performance metric is provided."],
  }],
  claims: [{
    contractVersion: "1.0",
    claimId: "claim-policy-001",
    text: "The fixture has a registered official documentation source for keyword planning context.",
    type: "fact",
    evidenceIds: ["evidence-policy-001"],
    market: "EG",
    industry: "ecommerce_general",
    confidence: 0.5,
    status: "evidence_backed",
    createdAt: "2026-08-21T00:00:00.000Z",
    limitations: ["This does not establish a market benchmark."],
  }],
  queryHash: "query-eg-ecommerce-policy-001",
});
assert.equal(readyPackage.status, "ready");
assert.equal(readyPackage.freshnessStatus, "fresh");
const limitedCoveragePackage = buildEvidencePackage(registry, {
  packageId: "pkg-eg-ecommerce-coverage-gap-001",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "EG",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "EGP",
  snapshots: [{
    ...freshSnapshot,
    snapshotId: "snapshot-eg-ecommerce-coverage-gap-001",
    limitations: [...freshSnapshot.limitations, "Coverage incomplete: industry-specific evidence is unavailable."],
  }],
  evidenceReferences: readyPackage.evidenceReferences,
  claims: readyPackage.claims,
  queryHash: "query-eg-ecommerce-coverage-gap-001",
});
assert.equal(limitedCoveragePackage.status, "limited");
assert.equal(limitedCoveragePackage.freshnessStatus, "fresh");
assert.equal(genericRegistry.assertUsable("src-generic-official-context", {
  market: "SA",
  industry: "local_service_general",
  language: "en",
}).sourceId, "src-generic-official-context");
assert.equal(readyPackage.sourceRecords[0]?.sourceId, source.sourceId);
assert.deepEqual(readyPackage.retrieval.selectedEvidenceIds, ["evidence-policy-001"]);
EvidencePackageSchema.parse(readyPackage);

const missingPackage = buildEvidencePackage(new SourceRegistry(), {
  packageId: "pkg-sa-local-service-missing-001",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "SA",
  industry: "local_service_general",
  locale: "ar",
  currency: "SAR",
  snapshots: [{
    contractVersion: "1.0",
    snapshotId: "snapshot-sa-local-service-missing-001",
    market: "SA",
    industry: "local_service_general",
    locale: "ar",
    currency: "SAR",
    capturedAt: "2026-08-21T00:00:00.000Z",
    freshnessStatus: "missing",
    facts: [],
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns: ["No verified snapshot has been captured for this scope."],
    contradictions: [],
    sourceIds: [],
    confidence: 0,
    limitations: ["No market claim may be inferred from the missing snapshot."],
  }],
  queryHash: "query-sa-local-service-missing-001",
});
assert.equal(missingPackage.status, "missing");
assert.equal(missingPackage.freshnessStatus, "missing");
assert.equal(missingPackage.sourceRecords.length, 0);
assert.equal(missingPackage.claims.length, 0);

expectRejected("scope mismatch", () => buildEvidencePackage(registry, {
  packageId: "pkg-scope-mismatch",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "SA",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "SAR",
  snapshots: [freshSnapshot],
  queryHash: "query-scope-mismatch",
}));

expectRejected("unregistered source", () => buildEvidencePackage(new SourceRegistry(), {
  packageId: "pkg-unregistered-source",
  generatedAt: "2026-08-21T00:00:00.000Z",
  market: "EG",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "EGP",
  snapshots: [freshSnapshot],
  queryHash: "query-unregistered-source",
}));

const restrictedRegistry = new SourceRegistry([{
  ...source,
  sourceId: "src-restricted-fixture",
  licenseStatus: "unknown",
}]);
expectRejected("non-approved source use", () => restrictedRegistry.assertUsable("src-restricted-fixture", {
  market: "EG",
  industry: "ecommerce_general",
  language: "en",
}));

console.log(JSON.stringify({
  test: "knowledge-evidence-regression",
  status: "PASS",
  assertions: 19,
  liveAiCalls: 0,
  marketValidated: false,
  message: "Source lookup, freshness, scope, versioned evidence assembly, and fail-closed missing data passed.",
}, null, 2));

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ClaimSchema,
  EvidencePackageSchema,
  MarketEvidenceSnapshotSchema,
  MarketFactSchema,
  SourceRecordSchema,
  unavailableMarketFact,
} from "../src/lib/contracts/knowledge/knowledge-contracts";

const fixturePath = path.join(process.cwd(), "tests/fixtures/knowledge/knowledge-contract-fixture.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as { package: unknown };

function expectRejected(label: string, operation: () => unknown): void {
  assert.throws(operation, (error: unknown) => {
    assert.ok(error instanceof Error, `${label}: expected an Error`);
    return true;
  }, label);
}

const parsedPackage = EvidencePackageSchema.parse(fixture.package);
assert.equal(parsedPackage.contractVersion, "1.0");
assert.equal(parsedPackage.status, "limited");
assert.equal(parsedPackage.freshnessStatus, "missing");
assert.equal(parsedPackage.snapshots[0]?.facts[0]?.status, "unavailable");
assert.equal(parsedPackage.snapshots[0]?.facts[0]?.value, null);

const generatedUnavailableFact = unavailableMarketFact({
  factId: "fact-helper-unavailable",
  name: "conversion_rate",
  market: "SA",
  industry: "local_service_general",
  locale: "ar",
  currency: "SAR",
});
assert.equal(generatedUnavailableFact.status, "unavailable");
assert.equal(generatedUnavailableFact.value, null);
assert.deepEqual(generatedUnavailableFact.sourceIds, []);

const validSource = parsedPackage.sourceRecords[0];
assert.ok(validSource);
SourceRecordSchema.parse(validSource);

expectRejected("numeric fact without source and status", () => MarketFactSchema.parse({
  factId: "fact-unsupported-cpc",
  name: "search_cpc",
  value: 25,
  unit: "EGP",
  status: "evidence_backed",
  sourceIds: [],
  scope: { market: "EG", industry: "ecommerce_general", locale: "ar", currency: "EGP" },
}));

expectRejected("evidence-backed fact claim without evidence", () => ClaimSchema.parse({
  contractVersion: "1.0",
  claimId: "claim-unsupported-benchmark",
  text: "The market CPC is 25 EGP.",
  type: "fact",
  evidenceIds: [],
  market: "EG",
  industry: "ecommerce_general",
  confidence: 0.8,
  status: "evidence_backed",
  createdAt: "2026-08-21T00:00:00.000Z",
  limitations: [],
}));

expectRejected("directional fact is not a fact", () => ClaimSchema.parse({
  contractVersion: "1.0",
  claimId: "claim-directional-fact",
  text: "Demand may increase around a seasonal period.",
  type: "fact",
  evidenceIds: [],
  market: "EG",
  industry: "ecommerce_general",
  confidence: 0.3,
  status: "directional",
  createdAt: "2026-08-21T00:00:00.000Z",
  limitations: ["Requires a captured source before being treated as a fact."],
}));

expectRejected("fresh snapshot with contradiction", () => MarketEvidenceSnapshotSchema.parse({
  ...parsedPackage.snapshots[0],
  freshnessStatus: "fresh",
  contradictions: ["Two sources disagree."],
}));

expectRejected("package claim references missing evidence", () => EvidencePackageSchema.parse({
  ...parsedPackage,
  claims: [{
    contractVersion: "1.0",
    claimId: "claim-missing-evidence",
    text: "A cited claim with a missing evidence record.",
    type: "inference",
    evidenceIds: ["evidence-not-registered"],
    market: "EG",
    industry: "ecommerce_general",
    confidence: 0.4,
    status: "evidence_backed",
    createdAt: "2026-08-21T00:00:00.000Z",
    limitations: [],
  }],
}));

const missingSnapshot = MarketEvidenceSnapshotSchema.parse({
  contractVersion: "1.0",
  snapshotId: "snapshot-missing-sa-local-service",
  market: "SA",
  industry: "local_service_general",
  locale: "en",
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
});
assert.equal(missingSnapshot.freshnessStatus, "missing");

console.log(JSON.stringify({
  test: "knowledge-contract-regression",
  status: "PASS",
  assertions: 11,
  liveAiCalls: 0,
  marketValidated: false,
  message: "Knowledge contracts parse valid fixtures and reject unsupported or ungrounded market claims.",
}, null, 2));

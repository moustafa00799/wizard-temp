import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { EvidencePackageSchema, SourceRecordSchema } from "../src/lib/contracts/knowledge/knowledge-contracts";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const manifestPath = path.join(publicRoot, "public-knowledge-batch-2026-08-25.json");
const packagesPath = path.join(publicRoot, "scoped-evidence-packages-2026-08-25.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const packagesArtifact = JSON.parse(fs.readFileSync(packagesPath, "utf8"));

function hash(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const sourceRecords = manifest.sources.map((source: unknown) => SourceRecordSchema.parse(source));
const sourceIds = new Set(sourceRecords.map((source: ReturnType<typeof SourceRecordSchema.parse>) => source.sourceId));
const missingRawArtifacts: string[] = [];
const rawHashChecks = manifest.rawSnapshots.flatMap((snapshot: any) => {
  const filePath = path.join(root, snapshot.path);
  if (!fs.existsSync(filePath)) {
    missingRawArtifacts.push(snapshot.path);
    return [];
  }
  assert.equal(hash(filePath), snapshot.sha256, `Raw hash mismatch ${snapshot.path}`);
  assert.equal(sourceIds.has(snapshot.sourceId), true, `Unregistered source ${snapshot.sourceId}`);
  return [snapshot.path];
});
const derivedHashChecks = manifest.derivedArtifacts.map((artifact: any) => {
  const filePath = path.join(root, artifact.path);
  assert.equal(fs.existsSync(filePath), true, `Missing derived artifact ${artifact.path}`);
  assert.equal(hash(filePath), artifact.sha256, `Derived hash mismatch ${artifact.path}`);
  return artifact.path;
});

assert.equal(manifest.quality.marketValidated, false);
assert.equal(packagesArtifact.marketValidated, false);
assert.equal(manifest.quality.readyEvidencePackages, 0);
for (const pkgValue of packagesArtifact.packages) {
  const pkg = EvidencePackageSchema.parse(pkgValue);
  assert.equal(pkg.status, "limited");
  assert.equal(pkg.sourceRecords.every((source) => sourceIds.has(source.sourceId)), true);
  assert.equal(pkg.snapshots[0]?.limitations.some((limitation) => limitation.startsWith("Coverage incomplete:")), true);
}

const targetMarketIndustryScopes = [
  "EG/ecommerce_general",
  "EG/education_general",
  "EG/local_service_general",
  "SA/ecommerce_general",
  "SA/education_general",
  "SA/local_service_general",
];
const packagedScopes = new Set(packagesArtifact.packageSummary.map((summary: any) => summary.scope.split("/").slice(0, 2).join("/")));
const missingMarketIndustryScopes = targetMarketIndustryScopes.filter((scope) => !packagedScopes.has(scope));
const allUnavailableMetrics = [
  "audience size",
  "absolute search volume",
  "CPC",
  "CPA",
  "CVR",
  "ROAS",
  "reach",
  "frequency",
  "saturation",
  "competitor performance",
  "client funnel performance",
];
for (const metric of allUnavailableMetrics) assert.equal(manifest.quality.unavailableMetrics.includes(metric), true);

const report = {
  reportId: "public-knowledge-quality-20260825-002",
  generatedAt: manifest.generatedAt,
  status: "PASS",
  globalMarketValidated: false,
  sourceRegistry: {
    registeredSources: sourceRecords.length,
    discoveryOnlySources: manifest.quality.discoveryOnlySourceIds.length,
    rawArtifactsHashChecked: rawHashChecks.length,
    rawArtifactsMissingLocally: missingRawArtifacts,
    derivedArtifactsHashChecked: derivedHashChecks.length,
  },
  evidence: {
    worldBankSelectedObservations: manifest.observations.length,
    googleTrendsSnapshots: manifest.directionalSearchInterest.length,
    capmasEducationFacts: manifest.capmasEducationFacts.length,
    limitedPackages: packagesArtifact.packageSummary,
    readyPackages: 0,
  },
  coverage: {
    marketIndustryScopesTargeted: targetMarketIndustryScopes.length,
    marketIndustryScopesWithLimitedPackages: packagedScopes.size,
    marketIndustryScopesMissing: missingMarketIndustryScopes,
    exactArabicPackageScopes: packagesArtifact.packageSummary.filter((summary: any) => summary.scope.includes("/ar/")).length,
    exactEnglishPackageScopes: packagesArtifact.packageSummary.filter((summary: any) => summary.scope.includes("/en/")).length,
  },
  unavailableMetrics: allUnavailableMetrics,
  gaps: [
    "No current Saudi dataset-level metric has been ingested; GASTAT remains discovery/API-access gated.",
    "No current Egypt industry-specific public demand dataset has been ingested beyond contextual indicators and directional Trends observations.",
    "No Google Ads Keyword Planner, GA4, or Search Console first-party/client export is available in this public batch.",
    "TikTok Creative Center public creative observations are not yet collected; TikTok Business account reporting is private first-party and excluded from the public manifest.",
    "Meta remains intentionally deferred to the final platform-collection step.",
  ],
  gates: {
    sourceContracts: "PASS",
    rawHashReproducibility: missingRawArtifacts.length === 0 ? "PASS" : "PARTIAL_LOCAL_RAW_ONLY",
    exactScopePackageContracts: "PASS",
    noInventedMarketingBenchmarks: "PASS",
    marketValidationGate: "BLOCKED_BY_INCOMPLETE_COVERAGE",
  },
};
const outputPath = path.join(publicRoot, "public-knowledge-quality-report-2026-08-25.json");
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));

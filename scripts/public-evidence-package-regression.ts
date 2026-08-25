import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EvidencePackageSchema, SourceRecordSchema } from "../src/lib/contracts/knowledge/knowledge-contracts";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const registry = JSON.parse(fs.readFileSync(path.join(publicRoot, "public-source-registry-2026-08-25.json"), "utf8"));
const artifact = JSON.parse(fs.readFileSync(path.join(publicRoot, "scoped-evidence-packages-2026-08-25.json"), "utf8"));
const registryIds = new Set(registry.sources.map((source: unknown) => SourceRecordSchema.parse(source).sourceId));

assert.equal(artifact.marketValidated, false);
assert.equal(artifact.packages.length, 3);
assert.deepEqual(
  artifact.packageSummary.map((summary: any) => summary.scope),
  ["EG/education_general/ar/EGP", "SA/ecommerce_general/ar/SAR", "EG/local_service_general/ar/EGP"],
);

for (const pkgValue of artifact.packages) {
  const pkg = EvidencePackageSchema.parse(pkgValue);
  assert.equal(pkg.status, "limited");
  assert.equal(pkg.freshnessStatus, "fresh");
  assert.equal(pkg.sourceRecords.every((source) => registryIds.has(source.sourceId)), true);
  assert.equal(pkg.snapshots.length, 1);
  assert.equal(pkg.snapshots[0]?.limitations.some((limitation) => limitation.startsWith("Coverage incomplete:")), true);
  assert.equal(pkg.snapshots[0]?.unknowns.length >= 10, true);
  assert.equal(pkg.snapshots[0]?.facts.some((fact) => fact.status === "unavailable"), true);
  assert.equal(pkg.snapshots[0]?.keywordSignals.some((signal) => signal.status === "directional" || signal.status === "unavailable"), true);
  assert.equal(pkg.snapshots[0]?.seasonalitySignals.every((signal) => signal.status === "unavailable"), true);
  assert.equal(pkg.snapshots[0]?.competitorObservations.every((observation) => observation.status === "unavailable"), true);
  assert.equal(pkg.claims.every((claim) => claim.status === "evidence_backed"), true);
  assert.equal(pkg.retrieval.strategy, "registry_lookup");
}

console.log(JSON.stringify({
  test: "public-evidence-package-regression",
  status: "PASS",
  assertions: 31,
  packages: artifact.packageSummary,
  marketValidated: artifact.marketValidated,
  message: "All scoped public evidence packages parse, remain limited with explicit coverage gaps, and fail closed for unavailable performance metrics.",
}));

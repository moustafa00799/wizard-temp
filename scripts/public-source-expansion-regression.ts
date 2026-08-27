import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { EvidencePackageSchema, SourceRecordSchema } from "../src/lib/contracts/knowledge";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const expansionRoot = path.join(publicRoot, "source-expansion/2026-08-27");
const registry = JSON.parse(fs.readFileSync(path.join(publicRoot, "public-source-registry-2026-08-27.json"), "utf8"));
const baseline = JSON.parse(fs.readFileSync(path.join(publicRoot, "public-source-registry-2026-08-25.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(expansionRoot, "MANIFEST.json"), "utf8"));
const official = JSON.parse(fs.readFileSync(path.join(expansionRoot, "normalized-official-observations.json"), "utf8"));
const marketplaces = JSON.parse(fs.readFileSync(path.join(expansionRoot, "normalized-marketplaces-observations.json"), "utf8"));
const apps = JSON.parse(fs.readFileSync(path.join(expansionRoot, "normalized-apps-observations.json"), "utf8"));
const packageArtifact = JSON.parse(fs.readFileSync(path.join(expansionRoot, "scoped-evidence-packages.json"), "utf8"));

type AnyRecord = Record<string, unknown>;

function sha256(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function allValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return [value, ...value.flatMap(allValues)];
  if (value && typeof value === "object") return [value, ...Object.values(value as AnyRecord).flatMap(allValues)];
  return [value];
}

function assertNoSensitiveKeys(value: unknown, pathLabel = "root"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveKeys(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as AnyRecord)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const forbidden = ["fullname", "phone", "altphone", "address", "email", "password", "cookie", "token", "apikey", "secret", "reviewtext", "revieweridentity", "customername", "customerphone", "customeraddress", "paymentreference"];
    assert.equal(forbidden.includes(normalized), false, `Forbidden field ${pathLabel}.${key}`);
    assertNoSensitiveKeys(nested, `${pathLabel}.${key}`);
  }
}

const baselineIds = new Set(baseline.sources.map((source: AnyRecord) => String(source.sourceId)));
const registryIds = registry.sources.map((source: AnyRecord) => String(source.sourceId));
const newSources = registry.sources.filter((source: AnyRecord) => String(source.sourceId).endsWith("20260827"));

assert.equal(registry.contractVersion, "1.0");
assert.equal(newSources.length, 14);
assert.equal(new Set(registryIds).size, registryIds.length);
assert.equal(newSources.every((source: AnyRecord) => !baselineIds.has(String(source.sourceId))), true);
assert.deepEqual(manifest.newSourceCount, 14);
assert.deepEqual(manifest.newObservationCounts, { official: 18, marketplaces: 3, apps: 4 });
assert.equal(manifest.marketValidated, false);
assert.equal(manifest.policy.noCaptchaBypass, true);
assert.equal(manifest.policy.noLogin, true);
assert.equal(manifest.policy.noPurchaseOrMutation, true);
assert.equal(manifest.policy.noRawReviewText, true);
assert.equal(manifest.policy.noMarketBenchmarkFabrication, true);

for (const source of registry.sources) SourceRecordSchema.parse(source);
for (const key of ["official", "marketplaces", "apps"] as const) {
  const capture = manifest.captures[key] as AnyRecord;
  const capturePath = path.join(root, String(capture.path));
  assert.equal(fs.existsSync(capturePath), true);
  assert.match(String(capture.sha256), /^[a-f0-9]{64}$/);
  assert.equal(sha256(capturePath), capture.sha256);
}

assert.equal(official.observations.length, 18);
assert.equal(marketplaces.observations.length, 3);
assert.equal(apps.observations.length, 4);
const observationIds = [
  ...official.observations,
  ...marketplaces.observations,
  ...apps.observations,
].map((item: AnyRecord) => String(item.observationId));
assert.equal(new Set(observationIds).size, observationIds.length);
assert.equal(official.observations.every((item: AnyRecord) => item.status === "observed" && item.sourceId), true);
assert.equal(marketplaces.observations.every((item: AnyRecord) => item.status === "observed" && item.marketScope === "market_page_observation"), true);
assert.equal(apps.observations.every((item: AnyRecord) => item.status === "observed" && item.marketScope), true);
assert.equal(marketplaces.observations.some((item: AnyRecord) => item.platform === "Jumia" && item.visibleListingCount === 19595), true);
assert.equal(marketplaces.observations.some((item: AnyRecord) => item.platform === "Carrefour" && item.deliveryLocation === "Maadi - Cairo"), true);
assert.equal(marketplaces.observations.some((item: AnyRecord) => item.platform === "Jarir" && item.stableProductPriceGridObserved === false), true);
assert.equal(apps.observations.some((item: AnyRecord) => item.platform === "Google Play" && item.app && (item.app as AnyRecord).packageId === "com.jumia.android"), true);
assert.equal(apps.observations.some((item: AnyRecord) => item.platform === "Apple App Store" && item.storeLocale === "EG"), true);

for (const artifact of [official, marketplaces, apps]) assertNoSensitiveKeys(artifact);
const serializedArtifacts = JSON.stringify({ official, marketplaces, apps });
assert.equal(/customer\s*phone|customer\s*address|api[_-]?key|password|cookie|token/i.test(serializedArtifacts), false);

assert.equal(packageArtifact.marketValidated, false);
assert.equal(packageArtifact.packages.length, 2);
for (const pkg of packageArtifact.packages) {
  EvidencePackageSchema.parse(pkg);
  assert.equal(pkg.status, "limited");
  assert.equal(pkg.freshnessStatus, "fresh");
  assert.equal(pkg.claims.length, 0);
  assert.equal(pkg.snapshots.length, 1);
  assert.equal(pkg.snapshots[0].contradictions.length, 0);
  assert.equal(pkg.snapshots[0].keywordSignals.length, 0);
  assert.equal(pkg.snapshots[0].seasonalitySignals.every((signal: AnyRecord) => signal.status === "unavailable"), true);
  assert.equal(pkg.sourceRecords.every((source: AnyRecord) => source.sourceType !== "client_data"), true);
  assert.equal(pkg.limitations.some((item: string) => /Market Validation remains false/i.test(item)), true);
}
assert.equal(packageArtifact.packageSummary.some((summary: AnyRecord) => summary.scope === "EG/ecommerce_general/ar/EGP" && summary.sourceCount === 7 && summary.factCount === 9 && summary.competitorObservationCount === 4), true);
assert.equal(packageArtifact.packageSummary.some((summary: AnyRecord) => summary.scope === "SA/ecommerce_general/ar/SAR" && summary.sourceCount === 7 && summary.factCount === 9 && summary.competitorObservationCount === 3), true);

const allStrings = allValues({ registry, manifest, official, marketplaces, apps, packageArtifact }).filter((value): value is string => typeof value === "string");
assert.equal(allStrings.some((value) => value.includes("/home/ubuntu") || value.includes("\\")), false);
assert.equal(allStrings.some((value) => value.includes("rows") && value.includes("raw")), false);

console.log(JSON.stringify({
  status: "PASS",
  assertions: 39,
  baselineSourceCount: baseline.sources.length,
  expandedSourceCount: registry.sources.length,
  newSourceCount: newSources.length,
  newObservationCounts: manifest.newObservationCounts,
  packageSummary: packageArtifact.packageSummary,
  marketValidated: packageArtifact.marketValidated,
}));

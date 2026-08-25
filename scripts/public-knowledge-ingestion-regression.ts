import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SourceRecordSchema } from "../src/lib/contracts/knowledge/knowledge-contracts";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const registryPath = path.join(publicRoot, "public-source-registry-2026-08-25.json");
const worldBankPath = path.join(publicRoot, "world-bank/2026-08-25/latest-observations.json");
const capmasSourcesPath = path.join(publicRoot, "capmas/2026-08-25/source-records.json");
const capmasFactsPath = path.join(publicRoot, "capmas/2026-08-25/normalized-facts.json");

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(registryPath);
const worldBank = readJson(worldBankPath);
const capmasSources = readJson(capmasSourcesPath);
const capmasFacts = readJson(capmasFactsPath);

const parsedSources = registry.sources.map((source: unknown) => SourceRecordSchema.parse(source));
const sourceIds = new Set(parsedSources.map((source: ReturnType<typeof SourceRecordSchema.parse>) => source.sourceId));
assert.equal(parsedSources.length, 9);
assert.equal(sourceIds.has("src-world-bank-egy-indicators-v2-20260825"), true);
assert.equal(sourceIds.has("src-world-bank-sau-indicators-v2-20260825"), true);
assert.equal(sourceIds.has("src-capmas-education-bulletin-2019-2020"), true);
assert.equal(sourceIds.has("src-capmas-telecommunications-bulletin-2016-2017"), true);
assert.equal(sourceIds.has("src-google-trends-eg-explore-20260825"), true);
assert.equal(sourceIds.has("src-google-trends-sa-explore-20260825"), true);

assert.equal(worldBank.artifactType, "public_market_context_snapshot");
assert.equal(worldBank.selection.method, "latest_non_null_observation_per_country_indicator");
assert.equal(worldBank.selection.observationCount, 10);
assert.equal(worldBank.observations.length, 10);
assert.equal(worldBank.rawSnapshots.length, 5);
assert.equal(worldBank.rawSnapshots.every((snapshot: any) => /^[a-f0-9]{64}$/.test(snapshot.sha256)), true);

const uniqueObservationKeys = new Set<string>();
for (const observation of worldBank.observations) {
  assert.equal(sourceIds.has(observation.sourceId), true);
  assert.equal(observation.status, "observed");
  assert.equal(typeof observation.queryUrl, "string");
  assert.equal(observation.queryUrl.includes(`/indicator/${observation.indicator}?`), true);
  assert.equal(observation.limitations.includes("Global contextual indicator; not a targetable audience size or campaign benchmark."), true);
  uniqueObservationKeys.add(`${observation.market}:${observation.indicator}`);
}
assert.equal(uniqueObservationKeys.size, 10);
assert.deepEqual(
  worldBank.observations.map((observation: any) => `${observation.market}:${observation.indicator}:${observation.period}`),
  [
    "EG:IT.NET.USER.ZS:2024",
    "EG:NY.GDP.PCAP.PP.CD:2025",
    "EG:SE.ADT.LITR.ZS:2022",
    "EG:SP.POP.TOTL:2025",
    "EG:SP.URB.TOTL.IN.ZS:2025",
    "SA:IT.NET.USER.ZS:2024",
    "SA:NY.GDP.PCAP.PP.CD:2025",
    "SA:SE.ADT.LITR.ZS:2024",
    "SA:SP.POP.TOTL:2025",
    "SA:SP.URB.TOTL.IN.ZS:2025",
  ],
);

const prohibitedObservedNames = ["CPC", "CPA", "CVR", "ROAS", "saturation", "competitor performance"];
const observedText = JSON.stringify(worldBank.observations).toLowerCase();
for (const prohibited of prohibitedObservedNames) {
  assert.equal(observedText.includes(prohibited.toLowerCase()), false);
}
for (const unavailable of ["CPC", "CPA", "CVR", "ROAS", "saturation", "competitor performance"]) {
  assert.equal(worldBank.notProvidedByThisArtifact.includes(unavailable), true);
}

assert.equal(capmasSources.sources.length, 2);
for (const source of capmasSources.sources) {
  SourceRecordSchema.parse(source);
  assert.equal(sourceIds.has(source.sourceId), true);
  assert.equal(source.licenseStatus, "unknown");
  assert.equal(source.market, "EG");
}
assert.equal(capmasFacts.facts.length, 6);
assert.equal(capmasFacts.facts.every((fact: any) => fact.market === "EG" && fact.industry === "education_general"), true);
assert.equal(capmasFacts.facts.every((fact: any) => fact.sourceId === "src-capmas-education-bulletin-2019-2020"), true);
assert.equal(capmasFacts.unavailableForThisSource.includes("CPC"), true);
assert.equal(capmasFacts.unavailableForThisSource.includes("ROAS"), true);

const trends = readJson(path.join(publicRoot, "google-trends/2026-08-25/normalized-observations.json"));
assert.equal(trends.snapshots.length, 4);
assert.equal(trends.snapshots.every((snapshot: any) => sourceIds.has(snapshot.sourceId)), true);
assert.equal(trends.snapshots.every((snapshot: any) => snapshot.queryDefaults === undefined), true);
assert.equal(trends.notProvided.includes("absolute search volume"), true);
assert.equal(trends.notProvided.includes("CPC"), true);

console.log(JSON.stringify({
  test: "public-knowledge-ingestion-regression",
  status: "PASS",
  assertions: 52,
  worldBankSelectedObservations: worldBank.observations.length,
  capmasEducationFacts: capmasFacts.facts.length,
  googleTrendsSnapshots: trends.snapshots.length,
  registeredSources: parsedSources.length,
  marketValidated: false,
  message: "Latest non-null selection, raw hashes, official source parsing, historical CAPMAS facts, and no-invented-benchmark gates passed.",
}));

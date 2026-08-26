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
const additionsPath = path.join(publicRoot, "public-source-record-additions-2026-08-25.json");
const manifestPath = path.join(publicRoot, "public-knowledge-batch-2026-08-25.json");
const contextArtifactPaths = [
  "unesco/2026-08-25/normalized-observations.json",
  "unctad/2026-08-25/normalized-observations.json",
  "undata/2026-08-25/normalized-observations.json",
  "datasaudi/2026-08-25/datasaudi-digital-economy-gdp-sa-20260825.json",
  "datasaudi/2026-08-25/datasaudi-digital-establishment-usage-sa-20260825.json",
  "datasaudi/2026-08-25/datasaudi-higher-education-students-sa-20260825.json",
  "datasaudi/2026-08-25/datasaudi-students-schools-teachers-sa-20260825.json",
  "datasaudi/2026-08-25/datasaudi-education-expenditure-sa-20260825.json",
  "datasaudi/2026-08-25/exports-egypt-normalized-observations.json",
  "datasaudi/2026-08-25/imports-egypt-normalized-observations.json",
  "kapsarc/2026-08-25/normalized-observations.json",
  "kapsarc/2026-08-25/sector-normalized-observations.json",
  "kapsarc/2026-08-25/sector-city-latest-observations.json",
  "kapsarc/2026-08-25/detailed-sector-city-latest-observations.json",
  "kapsarc/2026-08-26/normalized-establishments-observations.json",
  "capmas/2026-08-26/normalized-hiecs-2021-metadata.json",
  "openstreetmap/2026-08-26/normalized-cairo-riyadh-amenities.json",
  "cbe/2026-08-25/normalized-payment-system-observation.json",
  "sama/2026-08-25/normalized-payment-context.json",
  "sama/2026-08-25/normalized-ecommerce-interface-observation.json",
  "sama/2026-08-25/normalized-weekly-pos-page-observation.json",
  "egypt-public/2026-08-25/normalized-national-accounts-discovery.json",
  "egypt-public/2026-08-25/normalized-customs-fx-context.json",
  "marketplaces/2026-08-25/normalized-storefront-observations.json",
  "app-stores/2026-08-25/normalized-app-store-observations.json",
];

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const registry = readJson(registryPath);
const worldBank = readJson(worldBankPath);
const capmasSources = readJson(capmasSourcesPath);
const capmasFacts = readJson(capmasFactsPath);
const additions = readJson(additionsPath);
const manifest = readJson(manifestPath);

const parsedSources = registry.sources.map((source: unknown) => SourceRecordSchema.parse(source));
const sourceIds = new Set(parsedSources.map((source: ReturnType<typeof SourceRecordSchema.parse>) => source.sourceId));
assert.equal(parsedSources.length, 56);
assert.equal(additions.sources.length, 47);
assert.equal(manifest.publicContextArtifacts.length, 25);
assert.equal(sourceIds.has("src-world-bank-egy-indicators-v2-20260825"), true);
assert.equal(sourceIds.has("src-world-bank-sau-indicators-v2-20260825"), true);
assert.equal(sourceIds.has("src-capmas-education-bulletin-2019-2020"), true);
assert.equal(sourceIds.has("src-capmas-telecommunications-bulletin-2016-2017"), true);
assert.equal(sourceIds.has("src-google-trends-eg-explore-20260825"), true);
assert.equal(sourceIds.has("src-google-trends-sa-explore-20260825"), true);
for (const sourceId of [
  "src-unesco-uis-egy-sau-education-20260825",
  "src-unctad-digital-economy-egy-sau-20260825",
  "src-undata-statistical-yearbook-egy-sau-20260825",
  "src-gastat-datasaudi-digital-economy-gdp-sa-20260825",
  "src-kapsarc-gastat-establishments-size-activity-sa-20260826",
  "src-capmas-hiecs-2021-eg-20260826",
  "src-openstreetmap-overpass-cairo-riyadh-20260826",
  "src-kapsarc-sama-pos-ecommerce-sa-20260825",
  "src-kapsarc-sama-pos-sector-sa-20260825",
  "src-cbe-payment-system-eg-20260825",
  "src-sama-national-payment-news1139-sa-20260825",
  "src-sama-ecommerce-interface-news1095-sa-20260825",
  "src-sama-weekly-pos-page-sa-20260825",
  "src-mped-national-accounts-eg-20260825",
  "src-nafeza-customs-fx-eg-20260825",
  "src-noon-eg-galaxy-a17-product-20260825",
  "src-noon-sa-galaxy-s25-product-20260825",
  "src-amazon-sa-anker-product-20260825",
  "src-google-play-noon-en-us-20260825",
  "src-google-play-amazon-en-us-20260825",
  "src-apple-store-noon-us-20260825",
  "src-apple-store-amazon-us-20260825",
]) assert.equal(sourceIds.has(sourceId), true);

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

for (const relativePath of contextArtifactPaths) {
  const artifact = readJson(path.join(publicRoot, relativePath));
  assert.equal(artifact.observations.length > 0, true, `Expected observations in ${relativePath}`);
  assert.equal(typeof artifact.rawInput === "object" || Array.isArray(artifact.rawInputs), true, `Expected raw provenance in ${relativePath}`);
  assert.equal(sourceIds.has(artifact.sourceId), true, `Unregistered artifact source ${artifact.sourceId}`);
  for (const observation of artifact.observations) {
    assert.equal(sourceIds.has(observation.sourceId), true, `Unregistered observation source ${observation.sourceId}`);
    assert.equal(["CPC", "CPA", "CVR", "ROAS", "saturation"].includes(observation.metric), false);
  }
}

const kapsarcEstablishments = readJson(path.join(publicRoot, "kapsarc/2026-08-26/normalized-establishments-observations.json"));
assert.equal(kapsarcEstablishments.observations.length, 2688);
assert.equal(kapsarcEstablishments.licenseStatus, "approved");
assert.equal(kapsarcEstablishments.observations.every((observation: any) => observation.market === "SA" && observation.metric === "number_of_establishments" && observation.status === "observed"), true);
assert.equal(JSON.stringify(kapsarcEstablishments).toLowerCase().includes("market share"), true);
const capmasHiecs = readJson(path.join(publicRoot, "capmas/2026-08-26/normalized-hiecs-2021-metadata.json"));
assert.equal(capmasHiecs.observations.length, 2);
assert.equal(capmasHiecs.licenseStatus, "unknown");
assert.equal(capmasHiecs.observations.every((observation: any) => observation.market === "EG" && observation.sourceId === "src-capmas-hiecs-2021-eg-20260826"), true);
assert.equal(JSON.stringify(capmasHiecs).toLowerCase().includes("licensed microdata"), true);

const osm = readJson(path.join(publicRoot, "openstreetmap/2026-08-26/normalized-cairo-riyadh-amenities.json"));
assert.equal(osm.observations.length, 12);
assert.equal(osm.licenseStatus, "approved");
assert.equal(osm.license.includes("ODbL"), true);
assert.deepEqual(Object.keys(osm.elementCountByCity).sort(), ["Cairo", "Riyadh"]);
assert.equal(osm.observations.every((observation: any) => observation.metric === "osm_mapped_amenity_count" && observation.status === "observed" && ["EG", "SA"].includes(observation.market)), true);
assert.equal(JSON.stringify(osm).toLowerCase().includes("demand"), true);

const trends = readJson(path.join(publicRoot, "google-trends/2026-08-25/normalized-observations.json"));
assert.equal(trends.snapshots.length, 4);
assert.equal(trends.snapshots.every((snapshot: any) => sourceIds.has(snapshot.sourceId)), true);
assert.equal(trends.snapshots.every((snapshot: any) => snapshot.queryDefaults === undefined), true);
assert.equal(trends.notProvided.includes("absolute search volume"), true);
assert.equal(trends.notProvided.includes("CPC"), true);

const cbe = readJson(path.join(publicRoot, "cbe/2026-08-25/normalized-payment-system-observation.json"));
assert.equal(cbe.observations.length, 2);
assert.equal(cbe.observations.every((observation: any) => typeof observation.value === "string" && observation.sourceId === "src-cbe-payment-system-eg-20260825"), true);
const samaPayment = readJson(path.join(publicRoot, "sama/2026-08-25/normalized-payment-context.json"));
assert.deepEqual(
  samaPayment.observations.filter((observation: any) => ["electronic_retail_payment_share", "electronic_transaction_count"].includes(observation.metric)).map((observation: any) => [observation.metric, observation.period, observation.value]),
  [["electronic_retail_payment_share", "2025", 85], ["electronic_retail_payment_share", "2024", 79], ["electronic_transaction_count", "2025", 14.6], ["electronic_transaction_count", "2024", 12.6]],
);

const marketplace = readJson(path.join(publicRoot, "marketplaces/2026-08-25/normalized-storefront-observations.json"));
assert.equal(marketplace.observations.some((observation: any) => observation.observationId === "amazon-sa-anker-usb-cable-offer-20260825" && observation.price.current === 38.9 && observation.price.currency === "SAR" && observation.rating.reviewCount === 106328), true);
assert.equal(marketplace.observations.some((observation: any) => observation.observationId === "amazon-eg-product-captcha-unavailable-20260825" && observation.status === "unavailable" && observation.value === null), true);
assert.equal(JSON.stringify(marketplace).toLowerCase().includes("competitor performance"), true);
assert.equal(JSON.stringify(marketplace).toLowerCase().includes("cpc"), true);
const appStores = readJson(path.join(publicRoot, "app-stores/2026-08-25/normalized-app-store-observations.json"));
assert.equal(appStores.observations.length, 4);
assert.equal(appStores.observations.every((observation: any) => observation.marketScope === "global_or_store_locale" && observation.market === undefined), true);
assert.equal(appStores.observations.some((observation: any) => observation.observationId === "google-play-noon-en-us-metadata-20260825" && observation.rating.headerReviewCountText === "1.16M" && observation.rating.ratingsSectionReviewCountText === "1.14M"), true);
assert.equal(JSON.stringify(appStores).toLowerCase().includes("country-specific"), true);

console.log(JSON.stringify({
  test: "public-knowledge-ingestion-regression",
  status: "PASS",
  assertions: 125,
  worldBankSelectedObservations: worldBank.observations.length,
  contextArtifacts: contextArtifactPaths.length,
  capmasEducationFacts: capmasFacts.facts.length,
  googleTrendsSnapshots: trends.snapshots.length,
  registeredSources: parsedSources.length,
  marketValidated: false,
  message: "Latest non-null selection, raw hashes, official source parsing, extended public artifacts, exact source registration, and no-invented-benchmark gates passed.",
}));

import fs from "node:fs";
import path from "node:path";
import {
  CompetitorObservationSchema,
  EvidencePackageSchema,
  MarketEvidenceSnapshotSchema,
  MarketFactSchema,
  SeasonalitySignalSchema,
  SourceRecordSchema,
  type EvidencePackage,
  type MarketFact,
} from "../src/lib/contracts/knowledge";
import { buildEvidencePackage, SourceRegistry } from "../src/lib/knowledge";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const expansionRoot = path.join(publicRoot, "source-expansion/2026-08-27");
const capturedAt = "2026-08-27T00:00:00.000Z";

type PublicObservation = Record<string, unknown>;
type Artifact = { observations: PublicObservation[] };
type RegistryData = { sources: unknown[] };

function readJson(relativePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as unknown;
}

const registryData = readJson("data/knowledge/public/public-source-registry-2026-08-27.json") as RegistryData;
const officialArtifact = readJson("data/knowledge/public/source-expansion/2026-08-27/normalized-official-observations.json") as Artifact;
const marketplaceArtifact = readJson("data/knowledge/public/source-expansion/2026-08-27/normalized-marketplaces-observations.json") as Artifact;
const appsArtifact = readJson("data/knowledge/public/source-expansion/2026-08-27/normalized-apps-observations.json") as Artifact;
const registry = new SourceRegistry(registryData.sources.map((source: unknown) => SourceRecordSchema.parse(source)));

type Config = {
  market: "EG" | "SA";
  currency: "EGP" | "SAR";
  packageId: string;
};



const configs: Config[] = [
  { market: "EG", currency: "EGP", packageId: "pkg-eg-ecommerce-public-expansion-20260827" },
  { market: "SA", currency: "SAR", packageId: "pkg-sa-ecommerce-public-expansion-20260827" },
];

const limitations = [
  "Coverage incomplete: the expansion contains official context and selected storefront/app observations, not a complete industry-specific evidence matrix.",
  "National digital-economy and ICT indicators are broader than ecommerce and must not be read as ecommerce-only demand or market size.",
  "Public storefront and app-page observations are point-in-time channel signals, not representative price indexes, active-user measures, sales volume, market share, or competitor campaign performance.",
  "Market Validation remains false until the approved source-metric-scope matrix is complete with reproducible, licensed, exact-scope evidence.",
];

function sourceObservedAt(sourceId: string): string {
  return registry.require(sourceId).observedAt;
}

function safeFact(config: Config, obs: PublicObservation): MarketFact {
  const value = obs.value;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new Error(`Observation ${String(obs.observationId)} is not a scalar fact.`);
  }
  const metric = String(obs.metric ?? "public-context-observation");
  return MarketFactSchema.parse({
    factId: `${config.market.toLowerCase()}-${metric}-${String(obs.observationId).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: `${metric} (public context)`,
    value,
    unit: obs.unit,
    status: "limited_external_evidence",
    sourceIds: [String(obs.sourceId)],
    observedAt: String(obs.capturedAt ?? sourceObservedAt(String(obs.sourceId))),
    scope: { market: config.market, industry: "ecommerce_general", locale: "ar", currency: config.currency },
  });
}

function evidenceReference(sourceId: string, excerpt: string) {
  return {
    evidenceId: `evidence-${sourceId}`,
    sourceId,
    observedAt: sourceObservedAt(sourceId),
    excerpt,
    limitations: registry.require(sourceId).limitations,
  };
}

function channelObservation(config: Config, sourceId: string, subject: string, text: string) {
  return CompetitorObservationSchema.parse({
    observationId: `${config.market.toLowerCase()}-${sourceId}-channel-presence`,
    subject,
    observationType: "channel_presence",
    observation: text,
    status: "observed",
    sourceIds: [sourceId],
    observedAt: sourceObservedAt(sourceId),
    scope: { market: config.market, industry: "ecommerce_general", locale: "ar", currency: config.currency },
  });
}

function buildPackage(config: Config): EvidencePackage {
  const relevantOfficial = (officialArtifact.observations as PublicObservation[]).filter((obs) => obs.market === config.market);
  const relevantMarketplaces = (marketplaceArtifact.observations as PublicObservation[]).filter((obs) => obs.market === config.market);
  const relevantApps = (appsArtifact.observations as PublicObservation[]).filter((obs) => obs.market === config.market);

  const facts = relevantOfficial.map((obs) => safeFact(config, obs));
  const competitorObservations = [
    ...relevantMarketplaces.map((obs) => channelObservation(
      config,
      String(obs.sourceId),
      `${String(obs.platform ?? "public marketplace")} storefront`,
      "A public storefront/category page exposed channel taxonomy and selected merchandising, price, rating, promotion, stock, delivery, or service signals at capture time; this is not a representative market or performance measurement.",
    )),
    ...relevantApps.map((obs) => channelObservation(
      config,
      String(obs.sourceId),
      `${String(obs.platform ?? "app store")} app page`,
      "A public app-store page exposed app metadata and store-locale rating/download or ranking signals at capture time; this is not country-specific active-user, sales, or market-share evidence.",
    )),
  ];

  const sourceIds = [...new Set([
    ...facts.flatMap((fact) => fact.sourceIds),
    ...competitorObservations.flatMap((observation) => observation.sourceIds),
  ])];
  const snapshot = MarketEvidenceSnapshotSchema.parse({
    contractVersion: "1.0",
    snapshotId: `snapshot-${config.packageId}`,
    market: config.market,
    industry: "ecommerce_general",
    locale: "ar",
    currency: config.currency,
    capturedAt,
    freshnessStatus: "fresh",
    facts,
    competitorObservations,
    keywordSignals: [],
    seasonalitySignals: [SeasonalitySignalSchema.parse({
      signalId: `${config.market.toLowerCase()}-ecommerce-public-expansion-seasonality-unavailable`,
      period: "exact ecommerce seasonality",
      direction: "unknown",
      status: "unavailable",
      sourceIds: [],
      unavailableReason: "The public expansion does not contain a validated exact-scope ecommerce seasonality series.",
      scope: { market: config.market, industry: "ecommerce_general", locale: "ar", currency: config.currency },
    })],
    unknowns: [
      "Advertising audience size, CPC, CPA, CVR, ROAS, reach, frequency, saturation, and competitor campaign performance are unavailable.",
      "Country-specific active users, installs, retention, revenue, and sales are unavailable from public app pages.",
      "Representative category price averages, demand, sales volume, and market share are unavailable from the storefront captures.",
      "The official context sources do not provide exact client-industry conversion or ecommerce-only market performance.",
    ],
    contradictions: [],
    sourceIds,
    confidence: 0.45,
    limitations,
  });

  const evidenceReferences = sourceIds.map((sourceId) => evidenceReference(
    sourceId,
    sourceId.startsWith("src-") && sourceId.includes("market")
      ? "Public marketplace source record referenced by a point-in-time channel observation."
      : "Public official-context or app-store source record referenced by a limited scoped snapshot.",
  ));

  return buildEvidencePackage(registry, {
    packageId: config.packageId,
    generatedAt: capturedAt,
    market: config.market,
    industry: "ecommerce_general",
    locale: "ar",
    currency: config.currency,
    snapshots: [snapshot],
    evidenceReferences,
    claims: [],
    retrievalStrategy: "registry_lookup",
    queryHash: `public-source-expansion-20260827-${config.market}-ecommerce_general-ar-${config.currency}`,
  });
}

const packages = configs.map(buildPackage);
for (const pkg of packages) EvidencePackageSchema.parse(pkg);

const output = {
  contractVersion: "1.0",
  artifactType: "scoped_public_evidence_packages_expansion",
  generatedAt: capturedAt,
  marketValidated: false,
  packages,
  packageSummary: packages.map((pkg) => ({
    packageId: pkg.packageId,
    scope: `${pkg.market}/${pkg.industry}/${pkg.locale}/${pkg.currency}`,
    status: pkg.status,
    freshnessStatus: pkg.freshnessStatus,
    sourceCount: pkg.sourceRecords.length,
    factCount: pkg.snapshots[0]?.facts.length ?? 0,
    competitorObservationCount: pkg.snapshots[0]?.competitorObservations.length ?? 0,
    unknownCount: pkg.snapshots[0]?.unknowns.length ?? 0,
  })),
};

const outputPath = path.join(expansionRoot, "scoped-evidence-packages.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ status: "PASS", output: path.relative(root, outputPath), marketValidated: output.marketValidated, packageSummary: output.packageSummary }));

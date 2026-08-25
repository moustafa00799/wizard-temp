import fs from "node:fs";
import path from "node:path";
import {
  ClaimSchema,
  MarketEvidenceSnapshotSchema,
  MarketFactSchema,
  SourceRecordSchema,
  unavailableMarketFact,
  type Claim,
  type IndustryProfile,
  type MarketEvidenceSnapshot,
  type MarketFact,
  type KeywordSignal,
  type SeasonalitySignal,
  type CompetitorObservation,
  type EvidenceReference,
} from "../src/lib/contracts/knowledge/knowledge-contracts";
import { buildEvidencePackage } from "../src/lib/knowledge/evidence-package";
import { SourceRegistry } from "../src/lib/knowledge/source-registry";
import { INDUSTRY_PROFILES } from "../src/lib/knowledge/industry-profiles";

const root = process.cwd();
const publicRoot = path.join(root, "data/knowledge/public");
const capturedAt = "2026-08-25T20:30:00.000Z";
const registryData = JSON.parse(fs.readFileSync(path.join(publicRoot, "public-source-registry-2026-08-25.json"), "utf8"));
const worldBank = JSON.parse(fs.readFileSync(path.join(publicRoot, "world-bank/2026-08-25/latest-observations.json"), "utf8"));
const trends = JSON.parse(fs.readFileSync(path.join(publicRoot, "google-trends/2026-08-25/normalized-observations.json"), "utf8"));
const capmas = JSON.parse(fs.readFileSync(path.join(publicRoot, "capmas/2026-08-25/normalized-facts.json"), "utf8"));

type PublicObservation = {
  observationId: string;
  sourceId: string;
  market?: string;
  country?: string;
  metric?: string;
  name?: string;
  sector?: string;
  city?: string;
  indicatorName?: string;
  indicatorCode?: string;
  dataset?: string;
  period?: string;
  year?: number | string | null;
  value: string | number | null;
  unit?: string;
  observedAt?: string;
  capturedAt?: string;
  dimensions?: Record<string, string | number | null | undefined>;
  industryRelevance?: string;
  limitations?: string[];
};
type PublicArtifact = { observations: PublicObservation[] };
function loadArtifact(relativePath: string): PublicArtifact {
  return JSON.parse(fs.readFileSync(path.join(publicRoot, relativePath), "utf8")) as PublicArtifact;
}
const unesco = loadArtifact("unesco/2026-08-25/normalized-observations.json");
const unctad = loadArtifact("unctad/2026-08-25/normalized-observations.json");
const undata = loadArtifact("undata/2026-08-25/normalized-observations.json");
const datasaudiDigital = loadArtifact("datasaudi/2026-08-25/datasaudi-digital-establishment-usage-sa-20260825.json");
const datasaudiEducation = loadArtifact("datasaudi/2026-08-25/datasaudi-higher-education-students-sa-20260825.json");
const kapsarcSector = loadArtifact("kapsarc/2026-08-25/sector-normalized-observations.json");
const kapsarcSectorCity = loadArtifact("kapsarc/2026-08-25/sector-city-latest-observations.json");
const samaPayment = loadArtifact("sama/2026-08-25/normalized-payment-context.json");

const registry = new SourceRegistry(registryData.sources.map((source: unknown) => SourceRecordSchema.parse(source)));
type WorldBankObservation = {
  market: string;
  indicator: string;
  period: string;
  value: number;
  unit?: string;
  sourceId: string;
  observedAt: string;
};
const worldBankByKey = new Map<string, WorldBankObservation>(worldBank.observations.map((observation: WorldBankObservation) => [`${observation.market}:${observation.indicator}`, observation]));
const profileByIndustry = new Map<string, IndustryProfile>(INDUSTRY_PROFILES.map((profile) => [profile.industryKey, profile]));

function observationOrder(observation: PublicObservation): number {
  const year = typeof observation.year === "number" ? observation.year : Number.parseInt(String(observation.year ?? ""), 10);
  if (Number.isFinite(year)) return year;
  const parsed = Date.parse(String(observation.period ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestPerKey(observations: PublicObservation[], keyOf: (observation: PublicObservation) => string, maxCount = 50): PublicObservation[] {
  const latest = new Map<string, PublicObservation>();
  for (const observation of observations) {
    if (observation.value === null || observation.value === undefined) continue;
    const key = keyOf(observation);
    const previous = latest.get(key);
    if (!previous || observationOrder(observation) >= observationOrder(previous)) latest.set(key, observation);
  }
  return [...latest.values()].sort((left, right) => observationOrder(right) - observationOrder(left)).slice(0, maxCount);
}

function publicFact(config: Config, observation: PublicObservation, name: string): MarketFact {
  const sourceObservedAt = registry.get(observation.sourceId)?.observedAt;
  return MarketFactSchema.parse({
    factId: `${config.market.toLowerCase()}-${config.industry}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${observation.observationId}`,
    name,
    value: observation.value,
    unit: observation.unit,
    status: "limited_external_evidence",
    sourceIds: [observation.sourceId],
    observedAt: observation.observedAt ?? observation.capturedAt ?? sourceObservedAt ?? capturedAt,
    scope: { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency },
  });
}

function observationLabel(observation: PublicObservation): string {
  if (observation.sector && observation.metric) return `${observation.sector} — ${observation.metric} (context)`;
  return `${observation.indicatorName ?? observation.metric ?? observation.dataset ?? "public market indicator"} (context)`;
}

function publicContextFacts(config: Config): MarketFact[] {
  const selected: Array<{ observation: PublicObservation; label?: string }> = [];
  const push = (observations: PublicObservation[], predicate: (observation: PublicObservation) => boolean, keyOf: (observation: PublicObservation) => string, maxCount = 8) => {
    for (const observation of latestPerKey(observations.filter(predicate), keyOf, maxCount)) selected.push({ observation });
  };

  if (config.industry === "education_general") {
    push(unesco.observations, (observation) => observation.market === config.market && /enrolment|literacy|completion|schooling/i.test(observation.indicatorName ?? ""), (observation) => `${observation.market}:${observation.indicatorCode ?? observation.metric}`, 8);
    push(undata.observations, (observation) => observation.market === config.market && ["education_enrollment", "teaching_staff", "education_ict_access"].includes(observation.dataset ?? ""), (observation) => `${observation.dataset}:${observation.metric}`, 8);
    if (config.market === "SA") {
      push(datasaudiEducation.observations, (observation) => observation.market === "SA" && observation.metric === "higher_education_students" && observation.dimensions?.studentStatus === "Enrolled Students", (observation) => `${observation.dimensions?.academicStatus}:${observation.dimensions?.sex}`, 8);
      push(kapsarcSector.observations, (observation) => observation.market === "SA" && observation.sector === "Education" && ["sector_sales", "sector_transactions"].includes(observation.metric ?? ""), (observation) => `${observation.sector}:${observation.metric}`, 4);
    }
  }

  if (config.industry === "ecommerce_general") {
    push(unctad.observations, (observation) => observation.market === config.market && /businesses placing orders over the Internet|businesses with a web presence|digitally-deliverable services/i.test(observation.indicatorName ?? ""), (observation) => `${observation.market}:${observation.indicatorCode ?? observation.metric}`, 6);
    push(undata.observations, (observation) => observation.market === config.market && ["internet_usage", "population_and_density", "gdp_and_gdp_per_capita"].includes(observation.dataset ?? ""), (observation) => `${observation.dataset}:${observation.metric}`, 6);
    if (config.market === "SA") {
      push(kapsarcSector.observations, (observation) => observation.market === "SA" && ["Electronic & Electric Devices", "Clothing and Footwear", "Furniture", "Jewelry"].includes(observation.sector ?? "") && ["sector_sales", "sector_transactions"].includes(observation.metric ?? ""), (observation) => `${observation.sector}:${observation.metric}`, 12);
      push(samaPayment.observations, (observation) => observation.market === "SA" && ["electronic_retail_payment_share", "electronic_transaction_count"].includes(observation.metric ?? "") && typeof observation.value === "number", (observation) => observation.metric ?? "sama-payment-context", 4);
    }
  }

  if (config.industry === "local_service_general") {
    push(undata.observations, (observation) => observation.market === config.market && ["internet_usage", "employment_by_activity", "gva_by_activity"].includes(observation.dataset ?? "") && /services|internet/i.test(observation.metric ?? ""), (observation) => `${observation.dataset}:${observation.metric}`, 6);
    if (config.market === "SA") {
      push(kapsarcSector.observations, (observation) => observation.market === "SA" && ["Health", "Restaurants & Café", "Transportation", "Telecommunication", "Public Utilities", "Miscellaneous Goods and Services"].includes(observation.sector ?? "") && ["sector_sales", "sector_transactions"].includes(observation.metric ?? ""), (observation) => `${observation.sector}:${observation.metric}`, 12);
      push(kapsarcSectorCity.observations, (observation) => observation.market === "SA" && observation.city === "Total" && ["Health", "Restaurants & Café", "Transportation", "Telecommunication", "Public Utilities"].includes(observation.sector ?? "") && ["sector_city_transaction_value", "sector_city_transaction_count"].includes(observation.metric ?? ""), (observation) => `${observation.sector}:${observation.metric}`, 10);
    }
  }

  const deduplicated = new Map<string, { observation: PublicObservation; label: string }>();
  for (const item of selected) deduplicated.set(item.observation.observationId, { observation: item.observation, label: item.label ?? observationLabel(item.observation) });
  return [...deduplicated.values()].map(({ observation, label }) => publicFact(config, observation, label));
}

const unknownMetrics = [
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

const packageConfigs = [
  { market: "EG" as const, industry: "education_general", locale: "ar" as const, currency: "EGP" as const, packageId: "pkg-eg-education-public-20260825", trendLocale: "ar" as const },
  { market: "SA" as const, industry: "ecommerce_general", locale: "ar" as const, currency: "SAR" as const, packageId: "pkg-sa-ecommerce-public-20260825", trendLocale: "ar" as const },
  { market: "EG" as const, industry: "local_service_general", locale: "ar" as const, currency: "EGP" as const, packageId: "pkg-eg-local-service-public-20260825", trendLocale: "ar" as const },
];

type Config = (typeof packageConfigs)[number];

function worldBankFact(config: Config, indicator: string, name: string): MarketFact {
  const observation = worldBankByKey.get(`${config.market}:${indicator}`);
  if (!observation) {
    return unavailableMarketFact({
      factId: `${config.market.toLowerCase()}-${config.industry}-${indicator.toLowerCase()}-unavailable`,
      name,
      market: config.market,
      industry: config.industry,
      locale: config.locale,
      currency: config.currency,
      reason: "The selected World Bank snapshot did not contain a non-null observation for this market and indicator.",
    });
  }
  return MarketFactSchema.parse({
    factId: `${config.market.toLowerCase()}-${config.industry}-${indicator.toLowerCase()}-${observation.period}`,
    name,
    value: observation.value,
    unit: observation.unit,
    status: "limited_external_evidence",
    sourceIds: [observation.sourceId],
    observedAt: observation.observedAt,
    scope: { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency },
  });
}

function unavailableFacts(config: Config): MarketFact[] {
  return unknownMetrics.map((name) => unavailableMarketFact({
    factId: `${config.market.toLowerCase()}-${config.industry}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    market: config.market,
    industry: config.industry,
    locale: config.locale,
    currency: config.currency,
    reason: "No verified source is registered for this metric and exact market/industry/locale/currency scope in the public batch.",
  }));
}

function relevantTrendTerms(industry: string): string[] {
  if (industry === "ecommerce_general") return ["online shopping", "تسوق اونلاين"];
  if (industry === "education_general") return ["online courses", "دورات اونلاين"];
  return ["local services", "خدمات محلية"];
}

function keywordSignals(config: Config): { signals: KeywordSignal[]; sourceIds: string[]; evidence: EvidenceReference[] } {
  const signals: KeywordSignal[] = [];
  const sourceIds = new Set<string>();
  const evidence: EvidenceReference[] = [];
  const evidenceAdded = new Set<string>();
  const terms = relevantTrendTerms(config.industry);
  for (const snapshot of trends.snapshots.filter((item: any) => item.market === config.market && item.locale === config.locale)) {
    for (const term of terms) {
      if (!snapshot.terms.includes(term)) continue;
      const isInsufficient = snapshot.insufficientDataTerms?.includes(term) ?? false;
      const value = snapshot.averageRelativeInterest[term];
      const signalId = `${snapshot.snapshotId}-${term.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
      const scope = { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency };
      if (isInsufficient) {
        signals.push({ signalId, theme: term, direction: "unknown", value: null, status: "unavailable", sourceIds: [], unavailableReason: "Google Trends explicitly reported insufficient data for this phrase in the captured public comparison.", scope });
      } else {
        signals.push({ signalId, theme: term, direction: "unknown", value, unit: "relative_index_0_100", status: "directional", sourceIds: [snapshot.sourceId], observedAt: snapshot.capturedAt, scope });
        sourceIds.add(snapshot.sourceId);
      }
      if (!evidenceAdded.has(snapshot.snapshotId)) {
        evidence.push({
          evidenceId: `evidence-${snapshot.snapshotId}`,
          sourceId: snapshot.sourceId,
          observedAt: snapshot.capturedAt,
          excerpt: `Public Google Trends comparison for ${snapshot.terms.join(", ")} in ${snapshot.market}; relative average interest is retained exactly as captured.`,
          limitations: snapshot.limitations,
        });
        evidenceAdded.add(snapshot.snapshotId);
      }
    }
  }
  return { signals, sourceIds: [...sourceIds], evidence };
}

function competitorUnavailable(config: Config): CompetitorObservation {
  return {
    observationId: `${config.market.toLowerCase()}-${config.industry}-competitor-observation-unavailable`,
    subject: "public competitor observation",
    observationType: "channel_presence",
    observation: "No verified creative observation set has been captured for this exact scope in the public batch.",
    status: "unavailable",
    sourceIds: [],
    unavailableReason: "Meta is intentionally deferred and TikTok Creative Center observations have not yet been collected; no competitor performance is inferred.",
    scope: { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency },
  };
}

function seasonalityUnavailable(config: Config): SeasonalitySignal {
  return {
    signalId: `${config.market.toLowerCase()}-${config.industry}-seasonality-unavailable`,
    period: "exact industry seasonality",
    direction: "unknown",
    status: "unavailable",
    sourceIds: [],
    unavailableReason: "The public batch has time series pages but no validated industry-specific seasonal classification for this scope.",
    scope: { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency },
  };
}

function buildPackage(config: Config) {
  const facts: MarketFact[] = [
    worldBankFact(config, "IT.NET.USER.ZS", "internet users percent of population (context)"),
    worldBankFact(config, "SP.POP.TOTL", "population total (context)"),
    worldBankFact(config, "SP.URB.TOTL.IN.ZS", "urban population percent (context)"),
  ];
  if (config.industry === "education_general") facts.push(worldBankFact(config, "SE.ADT.LITR.ZS", "adult literacy percent (context)"));
  if (config.industry === "ecommerce_general") facts.push(worldBankFact(config, "NY.GDP.PCAP.PP.CD", "GDP per capita PPP (context)"));
  facts.push(...publicContextFacts(config));
  if (config.industry === "education_general") {
    for (const fact of capmas.facts) {
      facts.push(MarketFactSchema.parse({
        factId: fact.factId,
        name: fact.name,
        value: fact.value,
        unit: fact.unit,
        status: "limited_external_evidence",
        sourceIds: [fact.sourceId],
        observedAt: capturedAt,
        scope: { market: config.market, industry: config.industry, locale: config.locale, currency: config.currency },
      }));
    }
  }
  facts.push(...unavailableFacts(config));

  const trendsPart = keywordSignals(config);
  const sourceIds = new Set<string>(facts.flatMap((fact) => fact.sourceIds).concat(trendsPart.sourceIds));
  const snapshotId = `snapshot-${config.packageId}`;
  const limitations = [
    "Coverage incomplete: industry-specific evidence is limited to public contextual indicators and selected payment/education signals.",
    "Context indicators, SAMA payment activity, and directional search interest are not audience-size or advertising-performance benchmarks.",
    ...(config.industry === "education_general" ? ["CAPMAS facts are historical education-supply context for academic year 2019/2020 only."] : []),
    "Market Validation remains false until the approved source-metric-scope matrix is complete.",
  ];
  const snapshot: MarketEvidenceSnapshot = MarketEvidenceSnapshotSchema.parse({
    contractVersion: "1.0",
    snapshotId,
    market: config.market,
    industry: config.industry,
    locale: config.locale,
    currency: config.currency,
    capturedAt,
    freshnessStatus: "fresh",
    facts,
    competitorObservations: [competitorUnavailable(config)],
    keywordSignals: trendsPart.signals,
    seasonalitySignals: [seasonalityUnavailable(config)],
    unknowns: unknownMetrics.concat(["validated industry-specific audience and demand coverage", "validated creative/offer pattern coverage", "license-approved sector-level benchmark coverage"]),
    contradictions: [],
    sourceIds: [...sourceIds],
    confidence: config.industry === "education_general" ? 0.62 : 0.52,
    limitations,
  });

  const claims: Claim[] = [];
  if (config.industry === "education_general") {
    const capmasEvidenceId = "evidence-src-capmas-education-bulletin-2019-2020";
    claims.push(ClaimSchema.parse({
      contractVersion: "1.0",
      claimId: `${config.market}-${config.industry}-capmas-training-institutions-2019-2020`,
      text: "CAPMAS reported 487 governmental training institutions for academic year 2019/2020 in the selected education bulletin.",
      type: "fact",
      evidenceIds: [capmasEvidenceId],
      market: config.market,
      industry: config.industry,
      confidence: 0.96,
      status: "evidence_backed",
      createdAt: capturedAt,
      limitations: ["Historical official supply statistic; not current demand, audience size, or advertising performance."],
    }));
  } else {
    const trendEvidenceId = trendsPart.evidence[0]?.evidenceId ?? `evidence-${config.market.toLowerCase()}-trends-missing`;
    claims.push(ClaimSchema.parse({
      contractVersion: "1.0",
      claimId: `${config.market}-${config.industry}-trends-directional-20260825`,
      text: "The captured public Google Trends page provides relative search-interest observations for the selected industry phrase; it does not provide absolute volume or advertising performance.",
      type: "fact",
      evidenceIds: [trendEvidenceId],
      market: config.market,
      industry: config.industry,
      confidence: 0.9,
      status: "evidence_backed",
      createdAt: capturedAt,
      limitations: ["Relative 0-100 index only; exact term coverage is incomplete."],
    }));
  }

  const evidenceReferences: EvidenceReference[] = [
    ...new Set<string>(facts.flatMap((fact) => fact.sourceIds)).values(),
  ].map((sourceId) => ({
    evidenceId: `evidence-${sourceId}`,
    sourceId,
    observedAt: capturedAt,
    excerpt: sourceId.includes("capmas-education")
      ? "CAPMAS education and training bulletin, academic year 2019/2020; selected official table facts are retained with historical limitations."
      : sourceId.includes("world-bank")
        ? "World Bank indicator observation selected deterministically as the latest non-null value for the country and indicator."
        : "Public source record referenced by the scoped snapshot.",
    limitations: registry.get(sourceId)?.limitations ?? ["Source-specific limitations are retained in the registry."],
  }));
  for (const evidence of trendsPart.evidence) {
    if (!evidenceReferences.some((item) => item.evidenceId === evidence.evidenceId)) evidenceReferences.push(evidence);
  }
  for (const claim of claims) {
    for (const evidenceId of claim.evidenceIds) {
      if (!evidenceReferences.some((item) => item.evidenceId === evidenceId)) {
        evidenceReferences.push({ evidenceId, sourceId: config.industry === "education_general" ? "src-capmas-education-bulletin-2019-2020" : trendsPart.evidence[0]?.sourceId ?? "src-google-trends-eg-explore-20260825", observedAt: capturedAt, excerpt: "Evidence reference retained for the scoped claim.", limitations: ["Scope-specific evidence is limited and does not establish market validation."] });
      }
    }
  }

  const industryProfile = profileByIndustry.get(config.industry);
  return buildEvidencePackage(registry, {
    packageId: config.packageId,
    generatedAt: capturedAt,
    market: config.market,
    industry: config.industry,
    locale: config.locale,
    currency: config.currency,
    snapshots: [snapshot],
    evidenceReferences,
    claims,
    industryProfile,
    retrievalStrategy: "registry_lookup",
    queryHash: `public-batch-20260825-${config.market}-${config.industry}-${config.locale}-${config.currency}`,
  });
}

const packages = packageConfigs.map(buildPackage);
const output = {
  contractVersion: "1.0",
  artifactType: "scoped_public_evidence_packages",
  generatedAt: capturedAt,
  marketValidated: false,
  packages,
  packageSummary: packages.map((pkg) => ({ packageId: pkg.packageId, scope: `${pkg.market}/${pkg.industry}/${pkg.locale}/${pkg.currency}`, status: pkg.status, freshnessStatus: pkg.freshnessStatus, sourceCount: pkg.sourceRecords.length, factCount: pkg.snapshots[0]?.facts.length ?? 0, unknownCount: pkg.snapshots[0]?.unknowns.length ?? 0 })),
};
const outputPath = path.join(publicRoot, "scoped-evidence-packages-2026-08-25.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ status: "PASS", output: path.relative(root, outputPath), marketValidated: output.marketValidated, packageSummary: output.packageSummary }));

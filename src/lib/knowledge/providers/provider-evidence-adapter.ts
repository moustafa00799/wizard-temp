import {
  type EvidencePackage,
  type MarketFact,
  type MarketEvidenceSnapshot,
  type KnowledgeCurrency,
  type KnowledgeLocale,
  type KnowledgeMarket,
  type SourceRecord,
  unavailableMarketFact,
} from "@/lib/contracts/knowledge";
import { buildEvidencePackage } from "../evidence-package";
import { SourceRegistry } from "../source-registry";
import {
  type KnowledgeProvider,
  type PlatformCollection,
  type PlatformMetricDescriptor,
} from "./provider-snapshot-contracts";

export type BuildProviderEvidencePackageInput = {
  collection: PlatformCollection;
  market: KnowledgeMarket;
  industry: string;
  locale: KnowledgeLocale;
  currency: KnowledgeCurrency;
  capturedAt: string;
};

type MetricDefinition = PlatformMetricDescriptor & {
  aliases: string[];
};

const PROVIDER_METRICS: Record<KnowledgeProvider, MetricDefinition[]> = {
  google_ads: [
    { name: "impressions", unit: "impressions", aliases: ["metrics.impressions", "impressions"], additive: true },
    { name: "clicks", unit: "clicks", aliases: ["metrics.clicks", "clicks"], additive: true },
    { name: "spend", unit: "currency", aliases: ["metrics.costMicros", "metrics.cost_micros", "costMicros", "cost_micros"], additive: true },
    { name: "conversions", unit: "conversions", aliases: ["metrics.conversions", "conversions"], additive: true },
    { name: "conversion_value", unit: "currency", aliases: ["metrics.conversionsValue", "metrics.conversions_value", "conversionsValue", "conversions_value"], additive: true },
  ],
  tiktok_ads: [
    { name: "impressions", unit: "impressions", aliases: ["metrics.impressions", "impressions"], additive: true },
    { name: "clicks", unit: "clicks", aliases: ["metrics.clicks", "clicks"], additive: true },
    { name: "spend", unit: "currency", aliases: ["metrics.spend", "spend"], additive: true },
    { name: "conversions", unit: "conversions", aliases: ["metrics.conversion", "conversion", "metrics.conversions", "conversions"], additive: true },
  ],
  ga4: [
    { name: "sessions", unit: "sessions", aliases: ["sessions", "metrics.sessions"], additive: true },
    { name: "engaged_sessions", unit: "sessions", aliases: ["engagedSessions", "engaged_sessions", "metrics.engagedSessions", "metrics.engaged_sessions"], additive: true },
    { name: "events", unit: "events", aliases: ["eventCount", "events", "metrics.eventCount", "metrics.events"], additive: true },
    { name: "key_events", unit: "key_events", aliases: ["keyEvents", "key_events", "metrics.keyEvents", "metrics.key_events"], additive: true },
    { name: "total_revenue", unit: "currency", aliases: ["totalRevenue", "total_revenue", "metrics.totalRevenue", "metrics.total_revenue"], additive: true },
  ],
};

const NON_ADDITIVE_OR_UNAVAILABLE: Record<KnowledgeProvider, string[]> = {
  google_ads: ["CTR", "average CPC", "average CPM", "ROAS", "reach", "frequency", "placement performance"],
  tiktok_ads: ["CTR", "CPC", "CPM", "reach across campaigns", "frequency", "ROAS", "placement performance"],
  ga4: ["user-level deduplicated reach", "cross-property attribution", "ad spend", "ROAS", "incremental lift"],
};

const PROVIDER_URLS: Record<KnowledgeProvider, string> = {
  google_ads: "https://ads.google.com/aw/",
  tiktok_ads: "https://ads.tiktok.com/",
  ga4: "https://analytics.google.com/analytics/web/",
};

function readPath(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, row);
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function valueFor(row: Record<string, unknown>, aliases: string[]): number | undefined {
  for (const alias of aliases) {
    const value = numericValue(readPath(row, alias));
    if (value !== undefined) return value;
  }
  return undefined;
}

function dimensionFor(row: Record<string, unknown>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const raw = readPath(row, alias);
    if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  }
  return undefined;
}

function safeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function metricValue(provider: KnowledgeProvider, metric: MetricDefinition, value: number): number {
  if (provider === "google_ads" && metric.name === "spend") return value / 1_000_000;
  return value;
}

function providerMetrics(provider: KnowledgeProvider): MetricDefinition[] {
  return PROVIDER_METRICS[provider];
}

function factsFromRows(
  collection: PlatformCollection,
  scope: Pick<BuildProviderEvidencePackageInput, "market" | "industry" | "locale" | "currency">,
  sourceId: string,
  observedAt: string,
): MarketFact[] {
  const metrics = providerMetrics(collection.provider);
  const facts: MarketFact[] = [];
  for (const metric of metrics) {
    if (!metric.additive) continue;
    const values = collection.rows.map((row) => valueFor(row, metric.aliases)).filter((value): value is number => value !== undefined);
    if (values.length === 0) continue;
    const total = values.reduce((sum, value) => sum + metricValue(collection.provider, metric, value), 0);
    facts.push({
      factId: `${collection.provider}-${metric.name}`,
      name: `${collection.provider} ${metric.name}`,
      value: Number(total.toFixed(6)),
      unit: metric.unit,
      status: "evidence_backed",
      sourceIds: [sourceId],
      observedAt,
      scope,
    });
  }

  const impressions = valuesFor(collection, ["metrics.impressions", "impressions"]);
  const clicks = valuesFor(collection, ["metrics.clicks", "clicks"]);
  if (impressions > 0 && clicks >= 0) {
    facts.push({
      factId: `${collection.provider}-weighted-ctr`,
      name: `${collection.provider} weighted CTR from returned rows`,
      value: Number(((clicks / impressions) * 100).toFixed(6)),
      unit: "percent",
      status: "evidence_backed",
      sourceIds: [sourceId],
      observedAt,
      scope,
    });
  }

  const dimensions: Array<{ name: string; aliases: string[] }> = [
    { name: "country", aliases: ["country", "country_code", "dimensions.country_code", "geographicView.countryCriterionId", "segments.geo_target_country"] },
    { name: "platform", aliases: ["platform", "publisher_platform", "dimensions.platform", "segments.device", "device"] },
    { name: "campaign", aliases: ["campaign_id", "campaign.id", "dimensions.campaign_id", "campaignId"] },
  ];
  for (const dimension of dimensions) {
    const groups = new Map<string, Map<string, number>>();
    for (const row of collection.rows) {
      const value = dimensionFor(row, dimension.aliases);
      if (!value) continue;
      const totals = groups.get(value) ?? new Map<string, number>();
      for (const metric of metrics.filter((candidate) => candidate.additive)) {
        const raw = valueFor(row, metric.aliases);
        if (raw !== undefined) totals.set(metric.name, (totals.get(metric.name) ?? 0) + metricValue(collection.provider, metric, raw));
      }
      groups.set(value, totals);
    }
    for (const [dimensionValue, totals] of groups) {
      for (const metric of metrics.filter((candidate) => candidate.additive)) {
        const total = totals.get(metric.name);
        if (total === undefined) continue;
        facts.push({
          factId: `${collection.provider}-${dimension.name}-${safeToken(dimensionValue)}-${metric.name}`,
          name: `${collection.provider} ${metric.name} by ${dimension.name}: ${dimensionValue}`,
          value: Number(total.toFixed(6)),
          unit: metric.unit,
          status: "evidence_backed",
          sourceIds: [sourceId],
          observedAt,
          scope,
        });
      }
    }
  }
  return facts;
}

function valuesFor(collection: PlatformCollection, aliases: string[]): number {
  return collection.rows.reduce((sum, row) => {
    const value = valueFor(row, aliases);
    return sum + (value === undefined ? 0 : value);
  }, 0);
}

function sourceFor(input: BuildProviderEvidencePackageInput, sourceId: string): SourceRecord {
  const collection = input.collection;
  const publisher = collection.provider === "google_ads"
    ? "Google Ads client account"
    : collection.provider === "tiktok_ads"
      ? "TikTok for Business advertiser account"
      : "Google Analytics 4 client property";
  return {
    contractVersion: "1.0",
    sourceId,
    publisher,
    sourceUrl: PROVIDER_URLS[collection.provider],
    sourceType: collection.provider === "ga4" ? "client_data" : "official_api",
    market: input.market,
    industry: input.industry,
    language: input.locale,
    licenseStatus: "approved",
    observedAt: input.capturedAt,
    freshnessPolicy: "on_demand",
    limitations: [
      "Account-owned operational evidence; not a general market benchmark.",
      `Source scope is limited to ${collection.provider} account/property ${collection.accountId}.`,
      "Raw access credentials are never part of the snapshot.",
      ...collection.limitations,
    ],
    version: `${collection.provider}-read-only-1`,
    enabled: true,
  };
}

export function buildProviderEvidencePackage(
  registry: SourceRegistry,
  input: BuildProviderEvidencePackageInput,
): EvidencePackage {
  const collection = input.collection;
  const usableRows = collection.scopeStatus === "verified"
    && (collection.status === "complete" || collection.status === "partial")
    ? collection.rows
    : [];
  const hasEvidence = usableRows.length > 0;
  const sourceId = `${collection.provider}-account-${collection.accountId}`;
  const facts = hasEvidence ? factsFromRows({ ...collection, rows: usableRows }, input, sourceId, input.capturedAt) : [];
  const unavailableFacts = NON_ADDITIVE_OR_UNAVAILABLE[collection.provider].map((name, index) => unavailableMarketFact({
    factId: `${collection.provider}-unavailable-${index}`,
    name,
    market: input.market,
    industry: input.industry,
    locale: input.locale,
    currency: input.currency,
    reason: collection.status === "unverified"
      ? "Account or property scope is not verified for this project."
      : "The official read-only collection did not provide a safe additive value for this metric scope.",
  }));
  const snapshotStatus = collection.status === "partial" ? "stale" : "fresh";
  const snapshot: MarketEvidenceSnapshot = {
    contractVersion: "1.0",
    snapshotId: `${collection.provider}-snapshot-${collection.queryHash}`,
    market: input.market,
    industry: input.industry,
    locale: input.locale,
    currency: input.currency,
    capturedAt: input.capturedAt,
    freshnessStatus: hasEvidence ? snapshotStatus : "missing",
    facts: [...facts, ...unavailableFacts],
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns: [
      "Industry classification requires explicit human review and is not inferred from account or campaign names.",
      "Account-owned platform data does not establish a general market benchmark.",
      ...collection.limitations,
    ],
    contradictions: [],
    sourceIds: hasEvidence ? [sourceId] : [],
    confidence: hasEvidence ? (collection.status === "partial" ? 0.55 : 0.8) : 0.1,
    limitations: [
      "Segmented reports must not be summed with overlapping unsegmented reports.",
      "Non-additive metrics remain unavailable unless the source provides a valid non-overlapping scope.",
      ...collection.limitations,
    ],
  };

  if (hasEvidence) registry.register(sourceFor(input, sourceId));
  const evidenceReferences = hasEvidence
    ? [{
      evidenceId: `${collection.provider}-evidence-${collection.queryHash}`,
      sourceId,
      observedAt: input.capturedAt,
      limitations: snapshot.limitations,
    }]
    : [];

  return buildEvidencePackage(registry, {
    packageId: `${collection.provider}-package-${collection.queryHash}`,
    generatedAt: input.capturedAt,
    market: input.market,
    industry: input.industry,
    locale: input.locale,
    currency: input.currency,
    snapshots: [snapshot],
    evidenceReferences,
    claims: [],
    retrievalStrategy: "registry_lookup",
    queryHash: collection.queryHash,
  });
}

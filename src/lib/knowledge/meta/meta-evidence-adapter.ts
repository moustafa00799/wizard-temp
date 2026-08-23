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
import type { MetaCollectionResult } from "./meta-snapshot-contracts";

export type BuildMetaEvidencePackageInput = {
  collection: MetaCollectionResult;
  market: KnowledgeMarket;
  industry: string;
  locale: KnowledgeLocale;
  currency: KnowledgeCurrency;
  capturedAt: string;
};

const ADDITIVE_METRICS = [
  { field: "impressions", name: "Meta impressions", unit: "impressions" },
  { field: "clicks", name: "Meta reported clicks", unit: "clicks" },
  { field: "inline_link_clicks", name: "Meta inline link clicks", unit: "inline_link_clicks" },
  { field: "spend", name: "Meta spend", unit: "currency" },
] as const;

const UNAVAILABLE_METRICS = [
  "Reach",
  "Frequency",
  "Result indicator",
  "Conversion value",
  "Attribution setting",
  "Publisher platform coverage",
  "Creative-level copy and media metadata",
] as const;

const DIMENSION_FIELDS = [
  { field: "country", label: "country" },
  { field: "publisher_platform", label: "publisher platform" },
] as const;

function safeDimensionToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function numericValue(row: Record<string, unknown>, field: string): number | undefined {
  const value = row[field];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function actionTotals(rows: Record<string, unknown>[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const actions = Array.isArray(row.actions) ? row.actions : [];
    for (const action of actions) {
      if (!action || typeof action !== "object") continue;
      const record = action as Record<string, unknown>;
      const actionType = typeof record.action_type === "string" ? record.action_type : undefined;
      const value = numericValue(record, "value");
      if (!actionType || value === undefined) continue;
      totals.set(actionType, (totals.get(actionType) ?? 0) + value);
    }
  }
  return totals;
}

function factsFromRows(
  rows: unknown[],
  scope: Pick<BuildMetaEvidencePackageInput, "market" | "industry" | "locale" | "currency">,
  sourceId: string,
  observedAt: string,
): MarketFact[] {
  const records = rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  const facts: MarketFact[] = [];
  for (const metric of ADDITIVE_METRICS) {
    const total = records.reduce((sum, row) => sum + (numericValue(row, metric.field) ?? 0), 0);
    const hasMetric = records.some((row) => numericValue(row, metric.field) !== undefined);
    if (!hasMetric) continue;
    facts.push({
      factId: `meta-${metric.field}`,
      name: metric.name,
      value: Number(total.toFixed(6)),
      unit: metric.unit,
      status: "evidence_backed",
      sourceIds: [sourceId],
      observedAt,
      scope,
    });
  }

  const impressions = records.reduce((sum, row) => sum + (numericValue(row, "impressions") ?? 0), 0);
  const clicks = records.reduce((sum, row) => sum + (numericValue(row, "clicks") ?? 0), 0);
  if (impressions > 0 && records.some((row) => numericValue(row, "impressions") !== undefined)) {
    facts.push({
      factId: "meta-weighted-ctr",
      name: "Meta weighted CTR from returned rows",
      value: Number(((clicks / impressions) * 100).toFixed(6)),
      unit: "percent",
      status: "evidence_backed",
      sourceIds: [sourceId],
      observedAt,
      scope,
    });
  }

  for (const [actionType, total] of actionTotals(records)) {
    facts.push({
      factId: `meta-action-${actionType.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      name: `Meta action: ${actionType}`,
      value: Number(total.toFixed(6)),
      unit: "actions",
      status: "evidence_backed",
      sourceIds: [sourceId],
      observedAt,
      scope,
    });
  }

  for (const dimension of DIMENSION_FIELDS) {
    const groups = new Map<string, Record<string, number>>();
    for (const row of records) {
      const rawValue = row[dimension.field];
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) continue;
      const totals = groups.get(value) ?? {};
      for (const metric of ADDITIVE_METRICS) {
        const metricValue = numericValue(row, metric.field);
        if (metricValue !== undefined) totals[metric.field] = (totals[metric.field] ?? 0) + metricValue;
      }
      groups.set(value, totals);
    }
    for (const [value, totals] of groups) {
      for (const metric of ADDITIVE_METRICS) {
        const total = totals[metric.field];
        if (total === undefined) continue;
        facts.push({
          factId: `meta-${dimension.field}-${safeDimensionToken(value)}-${metric.field}`,
          name: `${metric.name} by ${dimension.label}: ${value}`,
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

function sourceFor(input: BuildMetaEvidencePackageInput, sourceId: string): SourceRecord {
  return {
    contractVersion: "1.0",
    sourceId,
    publisher: "Meta Ads Manager client account",
    sourceUrl: "https://www.facebook.com/adsmanager",
    sourceType: "client_data",
    market: input.market,
    industry: input.industry,
    language: input.locale,
    licenseStatus: "approved",
    observedAt: input.capturedAt,
    freshnessPolicy: "on_demand",
    limitations: [
      "Account-owned delivery data; not a general market benchmark.",
      "Interpretation is limited to the explicit account, market, industry, locale, and query scope.",
      "Raw access credentials are never part of the snapshot.",
    ],
    version: input.collection.queryHash.startsWith("meta-csv-") ? "meta-csv-official-1" : "meta-api-read-only-1",
    enabled: true,
  };
}

export function buildMetaEvidencePackage(
  registry: SourceRegistry,
  input: BuildMetaEvidencePackageInput,
): EvidencePackage {
  const sourceId = `meta-account-${input.collection.accountId}`;
  const usableRows = input.collection.status !== "rate_limited"
    && input.collection.status !== "circuit_open"
    && input.collection.status !== "failed"
    ? input.collection.rows
    : [];
  const hasEvidence = usableRows.length > 0;
  const facts = hasEvidence
    ? factsFromRows(usableRows, input, sourceId, input.capturedAt)
    : [];
  const hasPublisherPlatformDimension = usableRows.some((row) => Boolean(row && typeof row === "object" && typeof (row as Record<string, unknown>).publisher_platform === "string" && ((row as Record<string, unknown>).publisher_platform as string).trim() !== ""));
  const unavailableFacts = UNAVAILABLE_METRICS
    .filter((name) => name !== "Publisher platform coverage" || !hasPublisherPlatformDimension)
    .map((name, index) => unavailableMarketFact({
      factId: `meta-unavailable-${index}`,
      name,
      market: input.market,
      industry: input.industry,
      locale: input.locale,
      currency: input.currency,
      reason: input.collection.status === "rate_limited"
        ? "Meta rate limit prevented collection for this metric scope."
        : input.collection.status === "circuit_open"
          ? "The per-account Meta circuit breaker is open; collection was intentionally paused."
          : "The current read-only collection did not return this field for the requested scope.",
    }));

  const snapshotStatus = input.collection.status === "rate_limited" || input.collection.status === "circuit_open" || input.collection.status === "failed"
    ? "missing"
    : input.collection.status === "partial"
      ? "stale"
      : "fresh";
  const snapshot: MarketEvidenceSnapshot = {
    contractVersion: "1.0",
    snapshotId: `meta-snapshot-${input.collection.queryHash}`,
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
      "Industry classification requires explicit review and is not inferred from campaign names.",
      "Account-owned data does not establish a general market benchmark.",
      ...input.collection.limitations,
    ],
    contradictions: [],
    sourceIds: hasEvidence ? [sourceId] : [],
    confidence: hasEvidence ? (input.collection.status === "partial" ? 0.55 : 0.8) : 0.15,
    limitations: [
      "Meta account data is observational and must not be presented as market-validated evidence.",
      "Reach and frequency are not derived from impressions or clicks.",
      "Non-additive metrics such as CPC, CPM, and ROAS are not aggregated across rows by this adapter.",
      ...input.collection.limitations,
    ],
  };

  if (hasEvidence) registry.register(sourceFor(input, sourceId));
  const evidenceReferences = hasEvidence
    ? [{
      evidenceId: `meta-evidence-${input.collection.queryHash}`,
      sourceId,
      observedAt: input.capturedAt,
      limitations: snapshot.limitations,
    }]
    : [];

  return buildEvidencePackage(registry, {
    packageId: `meta-package-${input.collection.queryHash}`,
    generatedAt: input.capturedAt,
    market: input.market,
    industry: input.industry,
    locale: input.locale,
    currency: input.currency,
    snapshots: [snapshot],
    evidenceReferences,
    claims: [],
    retrievalStrategy: "registry_lookup",
    queryHash: input.collection.queryHash,
  });
}

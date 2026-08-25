import {
  EvidencePackageSchema,
  type Claim,
  type EvidencePackage,
  type EvidenceReference,
  type FreshnessStatus,
  type IndustryProfile,
  type KnowledgeCurrency,
  type KnowledgeLocale,
  type KnowledgeMarket,
  type MarketEvidenceSnapshot,
} from "@/lib/contracts/knowledge";
import { SourceRegistry } from "./source-registry";

export type BuildEvidencePackageInput = {
  packageId: string;
  generatedAt: string;
  market: KnowledgeMarket;
  industry: string;
  locale: KnowledgeLocale;
  currency: KnowledgeCurrency;
  snapshots?: MarketEvidenceSnapshot[];
  evidenceReferences?: EvidenceReference[];
  claims?: Claim[];
  industryProfile?: IndustryProfile;
  retrievalStrategy?: "deterministic_fixture" | "registry_lookup" | "manual_review";
  queryHash: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function assertScope(
  value: Pick<MarketEvidenceSnapshot, "market" | "industry" | "locale" | "currency">,
  expected: Pick<BuildEvidencePackageInput, "market" | "industry" | "locale" | "currency">,
): void {
  if (
    value.market !== expected.market
    || value.industry !== expected.industry
    || value.locale !== expected.locale
    || value.currency !== expected.currency
  ) {
    throw new Error(
      `Evidence scope mismatch: expected ${expected.market}/${expected.industry}/${expected.locale}/${expected.currency}.`,
    );
  }
}

function aggregateFreshness(
  snapshots: MarketEvidenceSnapshot[],
  sourceStatuses: FreshnessStatus[],
): FreshnessStatus {
  if (snapshots.length === 0 || snapshots.every((snapshot) => snapshot.freshnessStatus === "missing")) return "missing";
  if (snapshots.some((snapshot) => snapshot.freshnessStatus === "expired") || sourceStatuses.includes("expired")) return "expired";
  if (snapshots.some((snapshot) => snapshot.freshnessStatus === "missing")) return "missing";
  if (snapshots.some((snapshot) => snapshot.freshnessStatus === "stale") || sourceStatuses.includes("stale")) return "stale";
  return "fresh";
}

function packageStatus(
  snapshots: MarketEvidenceSnapshot[],
  claims: Claim[],
  sourceRecords: ReturnType<SourceRegistry["list"]>,
  freshnessStatus: FreshnessStatus,
): "ready" | "limited" | "missing" | "rejected" {
  if (claims.some((claim) => claim.status === "rejected")) return "rejected";
  if (freshnessStatus === "missing" || snapshots.length === 0) return "missing";
  if (freshnessStatus !== "fresh") return "limited";
  if (snapshots.some((snapshot) => snapshot.contradictions.length > 0)) return "limited";
  if (snapshots.some((snapshot) => snapshot.limitations.some((limitation) => /coverage incomplete|coverage gap|industry-specific evidence is unavailable/i.test(limitation)))) return "limited";
  if (sourceRecords.some((source) => source.licenseStatus !== "approved" || !source.enabled)) return "limited";
  return "ready";
}

export function buildEvidencePackage(
  registry: SourceRegistry,
  input: BuildEvidencePackageInput,
): EvidencePackage {
  const snapshots = input.snapshots ?? [];
  const evidenceReferences = input.evidenceReferences ?? [];
  const claims = input.claims ?? [];

  for (const snapshot of snapshots) assertScope(snapshot, input);
  if (input.industryProfile) {
    if (!input.industryProfile.markets.includes(input.market)) {
      throw new Error(`Industry profile ${input.industryProfile.profileId} does not cover market ${input.market}.`);
    }
    if (!input.industryProfile.locales.includes(input.locale)) {
      throw new Error(`Industry profile ${input.industryProfile.profileId} does not cover locale ${input.locale}.`);
    }
  }

  const evidenceById = new Map(evidenceReferences.map((evidence) => [evidence.evidenceId, evidence]));
  const referencedSourceIds = unique([
    ...snapshots.flatMap((snapshot) => snapshot.sourceIds),
    ...evidenceReferences.map((evidence) => evidence.sourceId),
    ...claims.flatMap((claim) => claim.evidenceIds).flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      return evidence ? [evidence.sourceId] : [];
    }),
  ]);
  const sourceRecords = referencedSourceIds.map((sourceId) => registry.require(sourceId));
  const sourceStatuses = sourceRecords.map((source) => registry.freshness(source.sourceId).status);
  const freshnessStatus = aggregateFreshness(snapshots, sourceStatuses);
  const status = packageStatus(snapshots, claims, sourceRecords, freshnessStatus);
  const limitations = unique([
    ...snapshots.flatMap((snapshot) => snapshot.limitations),
    ...sourceRecords.flatMap((source) => source.limitations),
    ...(freshnessStatus === "missing" ? ["No fresh market evidence is available for this scope."] : []),
    ...(freshnessStatus === "stale" ? ["Some evidence exceeded the preferred freshness window."] : []),
    ...(freshnessStatus === "expired" ? ["Expired evidence is retained for audit only and must not drive market claims."] : []),
  ]);

  return EvidencePackageSchema.parse({
    contractVersion: "1.0",
    packageId: input.packageId,
    generatedAt: input.generatedAt,
    market: input.market,
    industry: input.industry,
    locale: input.locale,
    currency: input.currency,
    sourceRecords,
    evidenceReferences,
    snapshots,
    claims,
    ...(input.industryProfile ? { industryProfile: input.industryProfile } : {}),
    status,
    freshnessStatus,
    limitations,
    retrieval: {
      strategy: input.retrievalStrategy ?? "deterministic_fixture",
      queryHash: input.queryHash,
      selectedEvidenceIds: evidenceReferences.map((evidence) => evidence.evidenceId),
    },
  });
}

export function packageIsSafeForCanonicalContext(pkg: EvidencePackage): boolean {
  return pkg.status !== "rejected" && pkg.status !== "ready" || (
    pkg.freshnessStatus === "fresh"
    && pkg.snapshots.every((snapshot) => snapshot.contradictions.length === 0)
    && pkg.sourceRecords.every((source) => source.enabled && source.licenseStatus === "approved")
  );
}

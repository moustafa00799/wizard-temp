import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  EvidencePackageSchema,
  MarketEvidenceSnapshotSchema,
  unavailableMarketFact,
  type EvidencePackage,
  type MarketEvidenceSnapshot,
  type SourceRecord,
} from "../src/lib/contracts/knowledge";
import { buildEvidencePackage } from "../src/lib/knowledge/evidence-package";
import { SourceRegistry } from "../src/lib/knowledge/source-registry";
import { createRepositories, openDatabase, sha256Json } from "../src/lib/db";

const databasePath = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_DATABASE ?? ".local/private-research/google-drive-merge-2026-08-27-v2/google-drive-merge-2026-08-27.sqlite");
const workspaceId = process.env.CDKS_SHAADDESIGN_WORKSPACE ?? "ws-cdks-private-google-drive";
const generatedAt = process.env.CDKS_SHAADDESIGN_GENERATED_AT ?? "2026-08-27T00:00:00.000Z";
const reportingTimezone = process.env.CDKS_SHAADDESIGN_REPORTING_TIMEZONE?.trim() || null;
const propertyId = process.env.CDKS_SHAADDESIGN_PROPERTY_ID?.trim() || null;
const propertyRefHash = propertyId ? createHash("sha256").update(propertyId, "utf8").digest("hex") : null;

const SOURCE_ID = "shaaddesign-ga4-owner-attestation-20260827";
const SNAPSHOT_ID = "shaaddesign-ga4-restricted-snapshot-2023";
const PACKAGE_ID = "shaaddesign-ga4-restricted-package-2023";
const SOURCE_VERSION = "owner-attested-ga4-scope-2026-08-27";

const source: SourceRecord = {
  contractVersion: "1.0",
  sourceId: SOURCE_ID,
  publisher: "ShaadDesign GA4 owner attestation",
  sourceUrl: "https://analytics.google.com/",
  sourceType: "client_data",
  jurisdiction: "SA",
  market: "SA",
  industry: "interior_design_and_decoration",
  language: "ar",
  licenseStatus: "restricted",
  observedAt: generatedAt,
  freshnessPolicy: "on_demand",
  limitations: [
    "Private owner-attested scope; not independent market evidence.",
    "Property identity, site, currency, and period are user-confirmed; reporting timezone is unavailable unless supplied separately.",
    "This package contains scope and availability facts only; it does not assert exact-period GA4 performance aggregates.",
    "Raw GA4 rows, URLs, event parameters, queries, customer identity, and credentials are omitted.",
  ],
  version: SOURCE_VERSION,
  enabled: true,
};

const facts: MarketEvidenceSnapshot["facts"] = [
  {
    factId: "shaaddesign-ga4-property-owner-confirmed",
    name: "GA4 Property scope owner-confirmed",
    value: true,
    unit: "boolean",
    status: "evidence_backed",
    sourceIds: [SOURCE_ID],
    observedAt: generatedAt,
    scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
  },
  {
    factId: "shaaddesign-ga4-site-owner-confirmed",
    name: "ShaadDesign site scope owner-confirmed",
    value: true,
    unit: "boolean",
    status: "evidence_backed",
    sourceIds: [SOURCE_ID],
    observedAt: generatedAt,
    scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
  },
  {
    factId: "shaaddesign-ga4-property-reference-present",
    name: "GA4 property reference supplied by owner",
    value: Boolean(propertyRefHash),
    unit: "boolean",
    status: "evidence_backed",
    sourceIds: [SOURCE_ID],
    observedAt: generatedAt,
    scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
  },
  {
    factId: "shaaddesign-ga4-reporting-period-owner-confirmed",
    name: "GA4 reporting period owner-confirmed",
    value: "2023-01-01..2023-12-31",
    unit: "date_range",
    status: "evidence_backed",
    sourceIds: [SOURCE_ID],
    observedAt: generatedAt,
    scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
  },
  {
    factId: "shaaddesign-ga4-reporting-timezone-availability",
    name: "GA4 Reporting Time Zone availability",
    value: reportingTimezone !== null,
    unit: "boolean",
    status: reportingTimezone !== null ? "evidence_backed" : "directional",
    sourceIds: [SOURCE_ID],
    observedAt: generatedAt,
    scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
  },
  unavailableMarketFact({
    factId: "shaaddesign-ga4-exact-period-performance",
    name: "Exact 2023 GA4 performance aggregates",
    market: "SA",
    industry: "interior_design_and_decoration",
    locale: "ar",
    currency: "SAR",
    reason: "Existing Drive aggregates contain mixed or overlapping ranges and were not safely assigned to the exact owner-confirmed 2023 period.",
  }),
  unavailableMarketFact({
    factId: "shaaddesign-ga4-reporting-timezone",
    name: "GA4 Reporting Time Zone",
    market: "SA",
    industry: "interior_design_and_decoration",
    locale: "ar",
    currency: "SAR",
    reason: reportingTimezone ? "Supplied at runtime by the owner." : "Not present in the currently retained sanitized export metadata.",
  }),
];

const snapshot: MarketEvidenceSnapshot = MarketEvidenceSnapshotSchema.parse({
  contractVersion: "1.0",
  snapshotId: SNAPSHOT_ID,
  market: "SA",
  industry: "interior_design_and_decoration",
  locale: "ar",
  currency: "SAR",
  capturedAt: generatedAt,
  freshnessStatus: "fresh",
  facts,
  competitorObservations: [],
  keywordSignals: [],
  seasonalitySignals: [],
  unknowns: [
    "This is a private owner-attested scope snapshot, not a general market validation.",
    "Exact 2023 performance aggregates are intentionally unavailable until the existing Drive reports can be proven to cover only that period.",
    "GA4-to-Google Ads conversion definitions are not supplied; CPA and ROAS remain unavailable.",
  ],
  contradictions: [],
  sourceIds: [SOURCE_ID],
  confidence: 0.7,
  limitations: [
    ...source.limitations,
    ...(propertyRefHash ? [`Property reference is retained only as SHA-256 ${propertyRefHash}.`] : ["Property reference hash was not supplied at runtime."]),
    ...(reportingTimezone ? ["Reporting timezone was supplied at runtime and is not used to reinterpret existing aggregates."] : ["Reporting timezone remains unavailable."]),
    "This package is limited and advisory; it cannot authorize launch or establish Market Validation.",
  ],
});

const registry = new SourceRegistry([source]);
const evidencePackage: EvidencePackage = EvidencePackageSchema.parse(buildEvidencePackage(registry, {
  packageId: PACKAGE_ID,
  generatedAt,
  market: "SA",
  industry: "interior_design_and_decoration",
  locale: "ar",
  currency: "SAR",
  snapshots: [snapshot],
  evidenceReferences: [{
    evidenceId: "shaaddesign-ga4-scope-evidence-20260827",
    sourceId: SOURCE_ID,
    observedAt: generatedAt,
    limitations: snapshot.limitations,
  }],
  claims: [],
  retrievalStrategy: "manual_review",
  queryHash: `shaaddesign-ga4-scope-${sha256Json({ propertyRefHash, generatedAt, period: "2023-01-01..2023-12-31" })}`,
}));

const database = openDatabase(databasePath);
const repositories = createRepositories(database);
database.prepare("INSERT OR IGNORE INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, 'active', ?)").run(workspaceId, "CDKS private ShaadDesign GA4", generatedAt);
database.prepare("INSERT OR IGNORE INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").run(workspaceId, "shaaddesign-owner-attestation", generatedAt);
repositories.sources.create(source);
repositories.knowledge.createSnapshot({
  snapshotId: SNAPSHOT_ID,
  workspaceId,
  market: snapshot.market,
  industry: snapshot.industry,
  locale: snapshot.locale,
  currency: snapshot.currency,
  capturedAt: snapshot.capturedAt,
  freshnessStatus: snapshot.freshnessStatus,
  confidence: snapshot.confidence,
  sourceIds: snapshot.sourceIds,
  snapshot: snapshot as unknown as Record<string, unknown>,
  createdAt: generatedAt,
});
const existingPackage = database.prepare("SELECT package_json FROM evidence_packages WHERE workspace_id = ? AND package_id = ?").get(workspaceId, PACKAGE_ID) as { package_json?: string } | undefined;
if (existingPackage) {
  const existingJson = JSON.parse(existingPackage.package_json ?? "{}");
  if (sha256Json(existingJson) !== sha256Json(evidencePackage)) throw new Error("ShaadDesign restricted package already exists with different content.");
} else {
  repositories.knowledge.createEvidencePackage({
    packageId: evidencePackage.packageId,
    workspaceId,
    market: evidencePackage.market,
    industry: evidencePackage.industry,
    status: evidencePackage.status,
    freshnessStatus: evidencePackage.freshnessStatus,
    retrievalStrategy: evidencePackage.retrieval.strategy,
    evidencePackage: evidencePackage as unknown as Record<string, unknown>,
    createdAt: generatedAt,
  });
  repositories.knowledge.attachSnapshot(PACKAGE_ID, SNAPSHOT_ID);
  for (const evidence of evidencePackage.evidenceReferences) {
    repositories.knowledge.createEvidenceLink({
      evidenceId: evidence.evidenceId,
      packageId: PACKAGE_ID,
      sourceId: evidence.sourceId,
      observedAt: evidence.observedAt,
      limitations: evidence.limitations,
      evidence: evidence as unknown as Record<string, unknown>,
    });
  }
}
repositories.governance.createAuditEvent({
  auditEventId: "audit-shaaddesign-restricted-snapshot-20260827",
  workspaceId,
  eventType: "private_restricted_snapshot_created",
  objectType: "knowledge_snapshot",
  objectId: SNAPSHOT_ID,
  actorType: "system",
  payload: {
    packageId: PACKAGE_ID,
    market: "SA",
    industry: "interior_design_and_decoration",
    currency: "SAR",
    period: "2023-01-01..2023-12-31",
    packageStatus: evidencePackage.status,
    marketValidated: false,
    exactPeriodPerformanceAvailable: false,
    reportingTimezoneAvailable: reportingTimezone !== null,
    rawRowsPersisted: false,
    canonicalBlueprintMutation: false,
    externalWrites: false,
  },
});

console.log(JSON.stringify({
  status: "PASS",
  workspaceId,
  snapshotId: SNAPSHOT_ID,
  packageId: PACKAGE_ID,
  packageStatus: evidencePackage.status,
  freshnessStatus: evidencePackage.freshnessStatus,
  factCount: snapshot.facts.length,
  unavailableFacts: snapshot.facts.filter((fact) => fact.status === "unavailable").map((fact) => fact.name),
  reportingTimezone: reportingTimezone ? "provided_at_runtime" : "unavailable",
  exactPeriodPerformance: "unavailable",
  marketValidated: false,
  rawRowsPersisted: false,
  canonicalBlueprintMutation: false,
}, null, 2));

database.close();

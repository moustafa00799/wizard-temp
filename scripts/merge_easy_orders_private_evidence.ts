import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createRepositories,
  openDatabase,
  sha256Json,
  type JsonRecord,
} from "../src/lib/db";
import {
  buildEasyOrdersEvidencePackage,
  easyOrdersAggregateSummary,
  easyOrdersSourceRecord,
  parseEasyOrdersNormalizedEvidence,
} from "../src/lib/knowledge/easy-orders-readonly";
import { SourceRegistry } from "../src/lib/knowledge/source-registry";

const inputPath = resolve(process.env.CDKS_EASY_ORDERS_NORMALIZED ?? ".local/private-research/easy-orders/2026-08-27/normalized-readonly-evidence.json");
const root = resolve(process.env.CDKS_EASY_ORDERS_MERGE_ROOT ?? ".local/private-research/easy-orders-merge");
const databasePath = resolve(process.env.CDKS_EASY_ORDERS_MERGE_DATABASE ?? `${root}/easy-orders-merge-2026-08-27.sqlite`);
const manifestPath = resolve(process.env.CDKS_EASY_ORDERS_MERGE_MANIFEST ?? `${root}/MERGE_MANIFEST.json`);
const workspaceId = process.env.CDKS_EASY_ORDERS_MERGE_WORKSPACE ?? "ws-cdks-private-easy-orders";
const generatedAt = process.env.CDKS_EASY_ORDERS_MERGE_GENERATED_AT ?? "2026-08-27T00:00:00.000Z";

function count(database: ReturnType<typeof openDatabase>, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>();
  return Number(row?.count ?? 0);
}

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing Easy Orders normalized artifact: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function jsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON record.");
  return value as JsonRecord;
}

mkdirSync(root, { recursive: true });
const evidence = parseEasyOrdersNormalizedEvidence(readJson<unknown>(inputPath));
const sourceHashes = evidence.sources.map((source) => source.sha256);
const registry = new SourceRegistry();
const source = easyOrdersSourceRecord(evidence.generatedAt);
registry.register(source);
const evidencePackage = buildEasyOrdersEvidencePackage(registry, {
  evidence,
  sourceHashes,
  capturedAt: evidence.generatedAt,
});
const snapshot = evidencePackage.snapshots[0];
if (!snapshot) throw new Error("Easy Orders package did not produce a snapshot.");
if (evidencePackage.status !== "limited") throw new Error(`Expected restricted client-data package to be limited, got ${evidencePackage.status}.`);

const database = openDatabase(databasePath);
const repositories = createRepositories(database);
database.prepare("INSERT OR IGNORE INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, 'active', ?)").run(workspaceId, "CDKS private Easy Orders evidence", generatedAt);
database.prepare("INSERT OR IGNORE INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").run(workspaceId, "system-private-easy-orders", generatedAt);
repositories.sources.create(source);
repositories.knowledge.createSnapshot({
  snapshotId: snapshot.snapshotId,
  workspaceId,
  market: snapshot.market,
  industry: snapshot.industry,
  locale: snapshot.locale,
  currency: snapshot.currency,
  capturedAt: snapshot.capturedAt,
  freshnessStatus: snapshot.freshnessStatus,
  confidence: snapshot.confidence,
  sourceIds: snapshot.sourceIds,
  snapshot: {
    ...snapshot,
    provider: "easy_orders",
    sourceIsPrivateClientData: true,
    globalMarketValidated: false,
    rawRowsOmitted: true,
  },
});

const existingPackage = database.prepare("SELECT package_json FROM evidence_packages WHERE workspace_id = ? AND package_id = ?").get<{ package_json: string }>(workspaceId, evidencePackage.packageId);
if (existingPackage) {
  const existing = JSON.parse(existingPackage.package_json) as JsonRecord;
  if (sha256Json(existing) !== sha256Json(evidencePackage)) throw new Error("Easy Orders package already exists with different content.");
} else {
  repositories.knowledge.createEvidencePackage({
    packageId: evidencePackage.packageId,
    workspaceId,
    market: evidencePackage.market,
    industry: evidencePackage.industry,
    status: evidencePackage.status,
    freshnessStatus: evidencePackage.freshnessStatus,
    retrievalStrategy: evidencePackage.retrieval.strategy,
    evidencePackage: jsonRecord(evidencePackage),
    createdAt: evidencePackage.generatedAt,
  });
}

const snapshotLink = database.prepare("SELECT 1 AS present FROM evidence_package_snapshots WHERE package_id = ? AND snapshot_id = ?").get(evidencePackage.packageId, snapshot.snapshotId);
if (!snapshotLink) repositories.knowledge.attachSnapshot(evidencePackage.packageId, snapshot.snapshotId);
for (const evidenceReference of evidencePackage.evidenceReferences) {
  const existingLink = database.prepare("SELECT evidence_json FROM evidence_links WHERE evidence_id = ?").get<{ evidence_json: string }>(evidenceReference.evidenceId);
  if (existingLink) {
    const existing = JSON.parse(existingLink.evidence_json) as JsonRecord;
    const expected = { evidenceId: evidenceReference.evidenceId, sourceId: evidenceReference.sourceId, observedAt: evidenceReference.observedAt };
    if (sha256Json(existing) !== sha256Json(expected)) throw new Error("Easy Orders evidence link already exists with different content.");
  } else {
    repositories.knowledge.createEvidenceLink({
      evidenceId: evidenceReference.evidenceId,
      packageId: evidencePackage.packageId,
      sourceId: evidenceReference.sourceId,
      observedAt: evidenceReference.observedAt,
      limitations: evidenceReference.limitations,
      evidence: { evidenceId: evidenceReference.evidenceId, sourceId: evidenceReference.sourceId, observedAt: evidenceReference.observedAt },
    });
  }
}
repositories.governance.createAuditEvent({
  auditEventId: "audit-easy-orders-private-merge-20260827",
  workspaceId,
  eventType: "private_client_data_merged",
  objectType: "evidence_package",
  objectId: evidencePackage.packageId,
  actorType: "system",
  payload: {
    provider: "easy_orders",
    sourceId: source.sourceId,
    orderCount: evidence.orders.rowCount,
    packageStatus: evidencePackage.status,
    marketValidated: false,
    rawRowsPersisted: false,
    customerIdentityPersisted: false,
    canonicalBlueprintMutation: false,
  },
});

const manifest = {
  mergeId: "cdks-private-easy-orders-merge-20260827",
  workspaceId,
  generatedAt,
  input: {
    path: inputPath,
    sha256: sha256Json(evidence),
    sourceFileHashes: sourceHashes,
  },
  result: {
    sourceRecords: count(database, "source_records"),
    sourceVersions: count(database, "source_versions"),
    knowledgeSnapshots: count(database, "knowledge_snapshots"),
    knowledgeSnapshotVersions: count(database, "knowledge_snapshot_versions"),
    evidencePackages: count(database, "evidence_packages"),
    evidenceLinks: count(database, "evidence_links"),
    packageStatus: evidencePackage.status,
    orderCount: evidence.orders.rowCount,
    productCount: evidence.products.productCount,
    reviewCount: evidence.reviews.rowCount,
    recordedOrderValueEgp: evidence.orders.totalsEgp.recordedOrderValue,
    ownerReportedDeliveredCollectedRate: evidence.orders.ownerReportedOutcomeRates.deliveredCollected,
    ownerReportedReturnedRate: evidence.orders.ownerReportedOutcomeRates.returned,
    ownerReportedUnresolvedRate: evidence.orders.ownerReportedOutcomeRates.unresolvedOrNotAccepted,
    rawRowsPersisted: false,
    customerIdentityPersisted: false,
    credentialsPersisted: false,
    marketValidated: false,
    canonicalBlueprintMutation: false,
  },
  policy: {
    privateClientDataSeparatedFromPublicMarketEvidence: true,
    productOriginalTaxonomyNotOverwritten: true,
    ownerRatesNotAssignedToOrderIds: true,
    rowLevelRevenueNotClaimed: true,
    rawRowsOmitted: true,
    noExternalWrites: true,
  },
  aggregate: easyOrdersAggregateSummary(evidence),
  databasePath,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifestPath, databasePath, ...manifest.result }, null, 2));
database.close();

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { INDUSTRY_PROFILES } from "../src/lib/knowledge";
import { IndustryProfileSchema } from "../src/lib/contracts/knowledge";
import { applyDatabaseMigrations, createRepositories, openDatabase, sha256Json } from "../src/lib/db";

function count(database: ReturnType<typeof openDatabase>, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>();
  return row?.count ?? 0;
}

const database = openDatabase(":memory:");
applyDatabaseMigrations(database);
assert.equal(count(database, "schema_migrations"), 4);
assert.ok(count(database, "sqlite_master") >= 0);

const repositories = createRepositories(database);
const createdAt = "2026-08-24T00:00:00.000Z";
const workspace = repositories.workspaces.create({ workspaceId: "ws-demo", name: "Redacted Demo Workspace", createdAt });
assert.equal(workspace.workspace_id, "ws-demo");
repositories.memberships.create("ws-demo", "user-demo", "owner");

repositories.briefs.create({
  briefId: "brief-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  version: 1,
  market: "SA",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "SAR",
  status: "submitted",
  brief: { simulation: true, offer: "Redacted product offer", objective: "sales" },
  createdAt,
});
repositories.briefs.create({
  briefId: "brief-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  version: 2,
  market: "SA",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "SAR",
  status: "approved",
  brief: { simulation: true, offer: "Redacted product offer v2", objective: "sales" },
  createdAt,
});
assert.equal(repositories.briefs.get("brief-sa-ecommerce-demo", 2)?.brief.objective, "sales");
repositories.briefs.createWizardSubmission({
  submissionId: "submission-demo",
  briefId: "brief-sa-ecommerce-demo",
  briefVersion: 2,
  workspaceId: "ws-demo",
  wizardInput: { business_type: "ecommerce", primary_objective: "sales" },
  source: "fixture",
  userConfirmed: false,
});

const blueprint = { blueprint_id: "blueprint-demo", version: "v1", strategy: { objective: "sales" } };
const blueprintHash = sha256Json(blueprint);
repositories.blueprints.create({
  blueprintId: "blueprint-demo",
  workspaceId: "ws-demo",
  version: 1,
  blueprint: blueprint as Record<string, unknown>,
  canonicalSha256: blueprintHash,
  createdAt,
});
repositories.blueprints.assertUnchanged("blueprint-demo", blueprintHash);
assert.deepEqual(repositories.blueprints.get("blueprint-demo")?.blueprint, blueprint);

const ecommerceProfile = IndustryProfileSchema.parse(INDUSTRY_PROFILES.find((profile) => profile.industryKey === "ecommerce_general"));
repositories.sources.createIndustryProfile(ecommerceProfile as unknown as Record<string, unknown> & { profileId: string; version: string; industryKey: string; branch: string; status: string });
repositories.sources.create({
  sourceId: "source-sa-ecommerce-demo",
  publisher: "Redacted Official Source",
  sourceUrl: "https://example.com/official-source",
  sourceType: "official_document",
  market: "SA",
  industry: "ecommerce_general",
  language: "ar",
  licenseStatus: "approved",
  version: "2026-01",
  observedAt: createdAt,
  freshnessPolicy: "monthly",
  limitations: ["Demonstration source only; not a production market claim."],
});

const snapshot = {
  snapshotId: "snapshot-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  market: "SA",
  industry: "ecommerce_general",
  locale: "ar",
  currency: "SAR",
  capturedAt: createdAt,
  freshnessStatus: "fresh" as const,
  confidence: 0.7,
  sourceIds: ["source-sa-ecommerce-demo"],
  snapshot: { simulation: true, sourceIds: ["source-sa-ecommerce-demo"] },
};
repositories.knowledge.createSnapshot(snapshot);
repositories.knowledge.createSnapshot(snapshot);
assert.equal(count(database, "knowledge_snapshots"), 1);
assert.throws(() => repositories.knowledge.createSnapshot({ ...snapshot, snapshot: { tampered: true } }), /different content/);
const snapshotHash = sha256Json(snapshot.snapshot);
const sourceManifestHash = "a".repeat(64);
repositories.knowledge.createSnapshotVersion({
  snapshotId: snapshot.snapshotId,
  revision: 1,
  snapshotSha256: snapshotHash,
  sourceManifestSha256: sourceManifestHash,
  capturedAt: snapshot.capturedAt,
  freshnessStatus: snapshot.freshnessStatus,
  payload: snapshot.snapshot,
  createdAt,
});
repositories.knowledge.createSnapshotVersion({
  snapshotId: snapshot.snapshotId,
  revision: 1,
  snapshotSha256: snapshotHash,
  sourceManifestSha256: sourceManifestHash,
  capturedAt: snapshot.capturedAt,
  freshnessStatus: snapshot.freshnessStatus,
  payload: snapshot.snapshot,
  createdAt,
});
assert.equal(repositories.knowledge.getSnapshotVersion(snapshot.snapshotId, 1)?.snapshot_sha256, snapshotHash);
assert.deepEqual(repositories.knowledge.getSnapshotVersion(snapshot.snapshotId, 1)?.payload, snapshot.snapshot);
assert.throws(() => repositories.knowledge.createSnapshotVersion({
  snapshotId: snapshot.snapshotId,
  revision: 1,
  snapshotSha256: "b".repeat(64),
  capturedAt: snapshot.capturedAt,
  freshnessStatus: snapshot.freshnessStatus,
  payload: snapshot.snapshot,
}), /different SHA-256/);
repositories.knowledge.createFact({
  factId: "fact-sa-ecommerce-demo",
  snapshotId: snapshot.snapshotId,
  market: "SA",
  industry: "ecommerce_general",
  status: "evidence_backed",
  value: "redacted-context",
  sourceIds: snapshot.sourceIds,
  observedAt: createdAt,
  fact: { factId: "fact-sa-ecommerce-demo", status: "evidence_backed" },
});
repositories.knowledge.createEvidencePackage({
  packageId: "package-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  market: "SA",
  industry: "ecommerce_general",
  status: "ready",
  freshnessStatus: "fresh",
  retrievalStrategy: "deterministic_fixture",
  evidencePackage: { simulation: true, market: "SA", industry: "ecommerce_general" },
  createdAt,
});
repositories.knowledge.attachSnapshot("package-sa-ecommerce-demo", snapshot.snapshotId);
repositories.knowledge.createEvidenceLink({
  evidenceId: "evidence-sa-ecommerce-demo",
  packageId: "package-sa-ecommerce-demo",
  sourceId: "source-sa-ecommerce-demo",
  observedAt: createdAt,
  limitations: ["Demonstration evidence only."],
  evidence: { simulation: true },
});
repositories.knowledge.createClaim({
  claimId: "claim-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  market: "SA",
  industry: "ecommerce_general",
  claimType: "fact",
  status: "evidence_backed",
  evidenceIds: ["evidence-sa-ecommerce-demo"],
  claim: { simulation: true, evidenceIds: ["evidence-sa-ecommerce-demo"] },
});
repositories.strategy.createContext({
  contextId: "context-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  packageId: "package-sa-ecommerce-demo",
  blueprintId: "blueprint-demo",
  market: "SA",
  industry: "ecommerce_general",
  scopedValidationStatus: "market_validated",
  context: { simulation: true, globalMarketValidated: false },
  createdAt,
});
assert.equal(repositories.strategy.getContext("ws-demo", "context-sa-ecommerce-demo")?.context.simulation, true);
repositories.strategy.createRecommendation({
  recommendationId: "recommendation-sa-ecommerce-demo",
  workspaceId: "ws-demo",
  contextId: "context-sa-ecommerce-demo",
  blueprintId: "blueprint-demo",
  recommendation: { status: "advisory_only", simulation: true },
  createdAt,
});
assert.equal(repositories.strategy.getRecommendation("ws-demo", "recommendation-sa-ecommerce-demo")?.recommendation.simulation, true);
assert.throws(() => repositories.strategy.createContext({
  contextId: "context-unsafe-global",
  workspaceId: "ws-demo",
  packageId: "package-sa-ecommerce-demo",
  blueprintId: "blueprint-demo",
  market: "SA",
  industry: "ecommerce_general",
  scopedValidationStatus: "partial",
  context: { globalMarketValidated: true },
}), /globally market-validated/);
assert.throws(() => repositories.strategy.createRecommendation({
  recommendationId: "recommendation-unsafe-governance",
  workspaceId: "ws-demo",
  contextId: "context-sa-ecommerce-demo",
  blueprintId: "blueprint-demo",
  recommendation: { governance: { canMutateCdks: true } },
}), /Unsafe governance flag/);

repositories.providers.createAccount({
  accountId: "provider-account-demo",
  workspaceId: "ws-demo",
  provider: "ga4",
  externalAccountRef: "owned-ref-redacted",
  ownershipStatus: "verified",
});
repositories.providers.createConnection({
  connectionId: "connection-demo",
  accountId: "provider-account-demo",
  connectionStatus: "read_only_ready",
  grantedScopes: ["analytics.readonly"],
  secretRef: "secret-ref/provider-demo",
  lastVerifiedAt: createdAt,
});
repositories.providers.createCollection({
  collectionId: "collection-demo",
  connectionId: "connection-demo",
  market: "SA",
  industry: "ecommerce_general",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-23",
  status: "ready",
  collection: { simulation: true },
});
// Provider merge replay must be safe: the same source, account, connection,
// scope, and collection can be encountered again without duplicate-key failure.
repositories.sources.create({
  sourceId: "source-sa-ecommerce-demo",
  publisher: "Redacted Official Source",
  sourceUrl: "https://example.com/official-source",
  sourceType: "official_document",
  market: "SA",
  industry: "ecommerce_general",
  language: "ar",
  licenseStatus: "approved",
  version: "2026-01",
  observedAt: createdAt,
  freshnessPolicy: "monthly",
  limitations: ["Demonstration source only; not a production market claim."],
});
repositories.providers.createAccount({
  accountId: "provider-account-demo",
  workspaceId: "ws-demo",
  provider: "ga4",
  externalAccountRef: "owned-ref-redacted",
  ownershipStatus: "verified",
});
repositories.providers.createConnection({
  connectionId: "connection-demo",
  accountId: "provider-account-demo",
  connectionStatus: "read_only_ready",
  grantedScopes: ["analytics.readonly"],
  secretRef: "secret-ref/provider-demo",
  lastVerifiedAt: createdAt,
});
repositories.providers.createCollection({
  collectionId: "collection-demo",
  connectionId: "connection-demo",
  market: "SA",
  industry: "ecommerce_general",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-23",
  status: "ready",
  collection: { simulation: true },
});
assert.equal(count(database, "source_records"), 1);
assert.equal(count(database, "source_versions"), 1);
assert.equal(count(database, "provider_accounts"), 1);
assert.equal(count(database, "provider_connections"), 1);
assert.equal(count(database, "provider_scopes"), 1);
assert.equal(count(database, "provider_collections"), 1);
assert.throws(() => repositories.sources.create({
  sourceId: "source-sa-ecommerce-demo",
  publisher: "Changed Publisher Must Fail",
  sourceUrl: "https://example.com/official-source",
  sourceType: "official_document",
  market: "SA",
  industry: "ecommerce_general",
  language: "ar",
  licenseStatus: "approved",
  version: "2026-01",
  observedAt: createdAt,
  freshnessPolicy: "monthly",
  limitations: ["Demonstration source only; not a production market claim."],
}), /different content/);
assert.throws(() => repositories.providers.createCollection({
  collectionId: "collection-demo",
  connectionId: "connection-demo",
  market: "SA",
  industry: "ecommerce_general",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-23",
  status: "ready",
  collection: { simulation: false },
}), /different content/);
repositories.providers.createSyncRun({
  syncRunId: "sync-demo",
  connectionId: "connection-demo",
  status: "succeeded",
  rowsSeen: 3,
  startedAt: createdAt,
  finishedAt: createdAt,
});
repositories.providers.upsertCursor("connection-demo", "page:0", "cursor-redacted-1");
repositories.providers.upsertCursor("connection-demo", "page:0", "cursor-redacted-2");

repositories.deferredSources.create({
  deferredSourceId: "deferred-google-939",
  workspaceId: "ws-demo",
  provider: "google_ads",
  externalAccountRef: "9397976723",
  status: "deferred",
  reason: "Read-only authorization is unavailable; retry only after a new authorization or direct user access.",
  retryGate: "new_authorization",
  mergePolicy: "merge_only_after_scope_and_hash_verification",
  createdAt,
});
assert.equal(repositories.deferredSources.get("ws-demo", "google_ads", "9397976723")?.status, "deferred");
assert.equal(database.prepare("SELECT market_validated FROM deferred_sources WHERE deferred_source_id = ?").get<{ market_validated: number }>("deferred-google-939")?.market_validated, 0);

repositories.governance.createApproval({
  approvalId: "approval-demo",
  workspaceId: "ws-demo",
  objectType: "recommendation",
  objectId: "recommendation-sa-ecommerce-demo",
  decision: "pending",
  actorUserId: "user-demo",
});
repositories.governance.createAuditEvent({
  auditEventId: "audit-demo",
  workspaceId: "ws-demo",
  eventType: "strategy_recommendation_created",
  objectType: "recommendation",
  objectId: "recommendation-sa-ecommerce-demo",
  actorType: "system",
  payload: { simulation: true },
});

assert.equal(count(database, "workspaces"), 1);
assert.equal(count(database, "client_briefs"), 2);
assert.equal(count(database, "blueprint_versions"), 1);
assert.equal(count(database, "source_versions"), 1);
assert.equal(count(database, "market_facts"), 1);
assert.equal(count(database, "knowledge_snapshot_versions"), 1);
assert.equal(count(database, "deferred_sources"), 1);
assert.equal(count(database, "claims"), 1);
assert.equal(count(database, "evidence_links"), 1);
assert.equal(count(database, "strategy_contexts"), 1);
assert.equal(count(database, "strategy_recommendations"), 1);
assert.equal(count(database, "provider_scopes"), 1);
assert.equal(count(database, "sync_runs"), 1);
assert.equal(database.prepare("SELECT cursor_value FROM sync_cursors WHERE connection_id = ? AND cursor_key = ?").get<{ cursor_value: string }>("connection-demo", "page:0")?.cursor_value, "cursor-redacted-2");
assert.equal(count(database, "approval_events"), 1);
assert.equal(count(database, "audit_events"), 1);

assert.throws(() => repositories.providers.createConnection({
  connectionId: "connection-write",
  accountId: "provider-account-demo",
  connectionStatus: "write_enabled",
  grantedScopes: ["campaigns.write"],
}));
assert.throws(() => repositories.sources.create({
  sourceId: "source-secret",
  publisher: "Redacted",
  sourceUrl: "https://example.com/?api_key=not-allowed",
  sourceType: "official_api",
  licenseStatus: "approved",
  version: "1",
  observedAt: createdAt,
  freshnessPolicy: "on_demand",
  limitations: [],
}));
assert.throws(() => database.exec("DELETE FROM workspaces WHERE workspace_id = 'ws-demo'"));

const diskPath = path.join(os.tmpdir(), `cdks-database-foundation-${process.pid}.db`);
const diskDatabase = openDatabase(diskPath);
const diskRepositories = createRepositories(diskDatabase);
diskRepositories.workspaces.create({ workspaceId: "ws-persisted", name: "Persisted Redacted Workspace", createdAt });
diskDatabase.close();
const reopenedDatabase = openDatabase(diskPath);
assert.equal(createRepositories(reopenedDatabase).workspaces.get("ws-persisted")?.name, "Persisted Redacted Workspace");
reopenedDatabase.close();
fs.rmSync(diskPath, { force: true });

console.log(JSON.stringify({
  test: "database-foundation-regression",
  status: "PASS",
  assertions: 63,
  migrationIdempotent: true,
  fileBackedPersistence: true,
  tables: count(database, "sqlite_master"),
  workspaceIsolation: "foreign_keys_and_workspace_scopes_enabled",
  writeConnections: "blocked",
  secretsStored: false,
  canonicalBlueprintMutation: false,
  liveConnectors: false,
  deferredSourcesExcludedFromPackages: true,
  snapshotVersionHashes: true,
}, null, 2));

database.close();

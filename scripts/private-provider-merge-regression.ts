import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type Row = Record<string, unknown>;

type MergeManifest = {
  result: {
    providerAccounts: number;
    providerConnections: number;
    providerCollections: number;
    knowledgeSnapshots: number;
    knowledgeSnapshotVersions: number;
    sourceRecords: number;
    deferredSources: number;
    auditEvents: number;
    packagesCreated: number;
    rawRowsPersisted: boolean;
    credentialsPersisted: boolean;
    marketValidated: boolean;
    canonicalBlueprintMutation: boolean;
  };
};

const databasePath = resolve(process.env.CDKS_PRIVATE_MERGE_DATABASE ?? ".local/private-research/knowledge-merge/knowledge-merge-2026-08-27.sqlite");
const manifestPath = resolve(process.env.CDKS_PRIVATE_MERGE_MANIFEST ?? ".local/private-research/knowledge-merge/MERGE_MANIFEST.json");

if (!existsSync(databasePath)) throw new Error(`Missing private merge database: ${databasePath}`);
if (!existsSync(manifestPath)) throw new Error(`Missing private merge manifest: ${manifestPath}`);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as MergeManifest;
const database = new DatabaseSync(databasePath);

function count(table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>();
  return Number(row?.count ?? 0);
}

function assertCount(table: string, expected: number): void {
  assert.equal(count(table), expected, `${table} count mismatch`);
}

const expected = manifest.result;
assertCount("provider_accounts", expected.providerAccounts);
assertCount("provider_connections", expected.providerConnections);
assertCount("provider_collections", expected.providerCollections);
assertCount("knowledge_snapshots", expected.knowledgeSnapshots);
assertCount("knowledge_snapshot_versions", expected.knowledgeSnapshotVersions);
assertCount("source_records", expected.sourceRecords);
assertCount("deferred_sources", expected.deferredSources);
assertCount("audit_events", expected.auditEvents);
assertCount("evidence_packages", 0);
assertCount("canonical_blueprints", 0);

assert.equal(expected.packagesCreated, 0);
assert.equal(expected.rawRowsPersisted, false);
assert.equal(expected.credentialsPersisted, false);
assert.equal(expected.marketValidated, false);
assert.equal(expected.canonicalBlueprintMutation, false);

const connections = database.prepare("SELECT read_only, secret_ref FROM provider_connections").all() as Row[];
assert.ok(connections.length > 0, "expected read-only provider connections");
for (const connection of connections) {
  assert.equal(connection.read_only, 1, "provider connection must remain read-only");
  assert.equal(connection.secret_ref, null, "private merge must not persist credentials or secret references");
}

const forbiddenKey = /(creative|landing|url|phone|keyword|headline|description|access[_-]?token|api[_-]?key|secret|password|cookie)/i;
function assertSafeKeys(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) assertSafeKeys(item, `${path}[${index}]`);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    assert.ok(!forbiddenKey.test(key), `forbidden persisted field: ${path}.${key}`);
    assertSafeKeys(child, `${path}.${key}`);
  }
}

const collections = database.prepare("SELECT collection_json FROM provider_collections").all() as Array<{ collection_json: string }>;
assert.equal(collections.length, expected.providerCollections);
for (const [index, row] of collections.entries()) {
  const collection = JSON.parse(row.collection_json) as Row;
  assert.deepEqual(collection.rows, [], `raw rows must be omitted at collection ${index}`);
  assert.equal(collection.rawRowsOmittedFromMerge, true);
  assertSafeKeys(collection, `provider_collections[${index}]`);
}

const snapshots = database.prepare("SELECT snapshot_json FROM knowledge_snapshots").all() as Array<{ snapshot_json: string }>;
for (const [index, row] of snapshots.entries()) {
  const snapshot = JSON.parse(row.snapshot_json) as Row;
  assert.equal(snapshot.providerEvidenceOnly, true, `snapshot ${index} must remain provider-only`);
  assert.equal(snapshot.globalMarketValidated, false, `snapshot ${index} cannot market-validate`);
  assert.equal(snapshot.rawRowsOmittedFromMerge, true);
  assertSafeKeys(snapshot, `knowledge_snapshots[${index}]`);
}

const deferred939 = database.prepare(
  "SELECT status, retry_gate, excluded_from_packages, market_validated FROM deferred_sources WHERE provider = 'google_ads' AND external_account_ref = '9397976723'",
).get<Row>();
assert.ok(deferred939, "Google Ads 939 must remain deferred");
assert.equal(deferred939.status, "deferred");
assert.equal(deferred939.retry_gate, "new_authorization");
assert.equal(deferred939.excluded_from_packages, 1);
assert.equal(deferred939.market_validated, 0);

const secondAuthAudits = count("audit_events");
assert.ok(secondAuthAudits >= 1, "merge must leave an audit trail");
const secondAuthOverlap = database.prepare(
  "SELECT COUNT(*) AS count FROM audit_events WHERE event_type = 'private_provider_authorization_overlap_recorded'",
).get<{ count: number }>();
assert.equal(Number(secondAuthOverlap?.count ?? 0), 1);

console.log(JSON.stringify({
  test: "private-provider-merge-regression",
  status: "PASS",
  databasePath,
  manifestPath,
  assertions: 20,
  providerAccounts: expected.providerAccounts,
  providerConnections: expected.providerConnections,
  providerCollections: expected.providerCollections,
  knowledgeSnapshots: expected.knowledgeSnapshots,
  deferredSources: expected.deferredSources,
  packagesCreated: expected.packagesCreated,
  rawRowsPersisted: expected.rawRowsPersisted,
  credentialsPersisted: expected.credentialsPersisted,
  marketValidated: expected.marketValidated,
  canonicalBlueprintMutation: expected.canonicalBlueprintMutation,
  secondAuthorizationOverlapRecorded: true,
}, null, 2));

database.close();

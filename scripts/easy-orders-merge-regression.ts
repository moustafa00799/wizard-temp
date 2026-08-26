import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.CDKS_EASY_ORDERS_MERGE_DATABASE ?? ".local/private-research/easy-orders-merge/easy-orders-merge-2026-08-27.sqlite");
const manifestPath = resolve(process.env.CDKS_EASY_ORDERS_MERGE_MANIFEST ?? ".local/private-research/easy-orders-merge/MERGE_MANIFEST.json");
if (!existsSync(databasePath)) throw new Error(`Missing Easy Orders merge database: ${databasePath}`);
if (!existsSync(manifestPath)) throw new Error(`Missing Easy Orders merge manifest: ${manifestPath}`);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  result: {
    sourceRecords: number;
    sourceVersions: number;
    knowledgeSnapshots: number;
    knowledgeSnapshotVersions: number;
    evidencePackages: number;
    evidenceLinks: number;
    packageStatus: string;
    orderCount: number;
    productCount: number;
    reviewCount: number;
    recordedOrderValueEgp: string;
    ownerReportedDeliveredCollectedRate: string;
    ownerReportedReturnedRate: string;
    ownerReportedUnresolvedRate: string;
    rawRowsPersisted: boolean;
    customerIdentityPersisted: boolean;
    credentialsPersisted: boolean;
    marketValidated: boolean;
    canonicalBlueprintMutation: boolean;
  };
};
const database = new DatabaseSync(databasePath);
const count = (table: string) => Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>()?.count ?? 0);
const parse = (value: string) => JSON.parse(value) as Record<string, unknown>;

assert.equal(count("source_records"), manifest.result.sourceRecords);
assert.equal(count("source_versions"), manifest.result.sourceVersions);
assert.equal(count("knowledge_snapshots"), manifest.result.knowledgeSnapshots);
assert.equal(count("knowledge_snapshot_versions"), manifest.result.knowledgeSnapshotVersions);
assert.equal(count("evidence_packages"), manifest.result.evidencePackages);
assert.equal(count("evidence_links"), manifest.result.evidenceLinks);
assert.equal(count("canonical_blueprints"), 0);
assert.equal(manifest.result.packageStatus, "limited");
assert.equal(manifest.result.orderCount, 1088);
assert.equal(manifest.result.productCount, 25);
assert.equal(manifest.result.reviewCount, 75);
assert.equal(manifest.result.recordedOrderValueEgp, "1153388");
assert.equal(manifest.result.ownerReportedDeliveredCollectedRate, "0.65");
assert.equal(manifest.result.ownerReportedReturnedRate, "0.12");
assert.equal(manifest.result.ownerReportedUnresolvedRate, "0.23");
assert.equal(manifest.result.rawRowsPersisted, false);
assert.equal(manifest.result.customerIdentityPersisted, false);
assert.equal(manifest.result.credentialsPersisted, false);
assert.equal(manifest.result.marketValidated, false);
assert.equal(manifest.result.canonicalBlueprintMutation, false);

const source = database.prepare("SELECT source_type, market, industry, language, license_status, current_version FROM source_records").get<Record<string, unknown>>();
assert.deepEqual({ ...source }, {
  source_type: "client_data",
  market: "EG",
  industry: "ecommerce_general",
  language: "ar",
  license_status: "restricted",
  current_version: "easy-orders-export-2026-08-26",
});

const packageRow = database.prepare("SELECT market, industry, status, freshness_status, package_json FROM evidence_packages").get<Record<string, unknown>>();
assert.equal(packageRow?.market, "EG");
assert.equal(packageRow?.industry, "ecommerce_general");
assert.equal(packageRow?.status, "limited");
assert.equal(packageRow?.freshness_status, "fresh");
const packagePayload = parse(String(packageRow?.package_json));
assert.equal(packagePayload.currency, "EGP");
assert.equal(packagePayload.status, "limited");
assert.equal(packagePayload.globalMarketValidated, undefined);

const snapshotRow = database.prepare("SELECT snapshot_json FROM knowledge_snapshots").get<{ snapshot_json: string }>();
assert.ok(snapshotRow);
const snapshot = parse(snapshotRow.snapshot_json);
assert.equal(snapshot.market, "EG");
assert.equal(snapshot.industry, "ecommerce_general");
assert.equal(snapshot.currency, "EGP");
assert.equal(snapshot.provider, "easy_orders");
assert.equal(snapshot.sourceIsPrivateClientData, true);
assert.equal(snapshot.globalMarketValidated, false);
assert.equal(snapshot.rawRowsOmitted, true);

const facts = Array.isArray(snapshot.facts) ? snapshot.facts as Array<Record<string, unknown>> : [];
const factById = new Map(facts.map((fact) => [String(fact.factId), fact]));
assert.equal(factById.get("easy-orders-recorded-order-count")?.value, 1088);
assert.equal(factById.get("easy-orders-recorded-order-value")?.value, 1153388);
assert.equal(factById.get("easy-orders-owner-delivered-collected-rate")?.value, 0.65);
assert.equal(factById.get("easy-orders-owner-returned-rate")?.value, 0.12);
assert.equal(factById.get("easy-orders-owner-unresolved-rate")?.value, 0.23);
assert.equal(factById.get("easy-orders-owner-delivered-collected-rate")?.status, "directional");
assert.equal(factById.get("easy-orders-unavailable-realized-revenue")?.value, null);
assert.equal(factById.get("easy-orders-unavailable-realized-revenue")?.status, "unavailable");
assert.equal(factById.get("easy-orders-unavailable-roas")?.value, null);

const forbiddenKey = /^(full.?name|phone|mobile|email|address|customer.?name|customer.?id|client.?name|client.?id|note|comment|review.?text|payment.?ref|card.?number|access[_-]?token|api[_-]?key|secret|password|cookie|landing.?page|creative.?text|headline|description)$/i;
function walk(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) walk(item, `${path}[${index}]`);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    assert.ok(!forbiddenKey.test(key), `forbidden persisted field ${path}.${key}`);
    assert.notEqual(key.toLowerCase(), "rows", `raw rows field persisted at ${path}`);
    walk(child, `${path}.${key}`);
  }
}
walk(packagePayload, "package");
walk(snapshot, "snapshot");

const tables = {
  workspaces: count("workspaces"),
  memberships: count("workspace_memberships"),
  sourceRecords: count("source_records"),
  snapshots: count("knowledge_snapshots"),
  packages: count("evidence_packages"),
  links: count("evidence_links"),
  audits: count("audit_events"),
};
assert.deepEqual(tables, { workspaces: 1, memberships: 1, sourceRecords: 1, snapshots: 1, packages: 1, links: 1, audits: 1 });

console.log(JSON.stringify({
  test: "easy-orders-merge-regression",
  status: "PASS",
  assertions: 39,
  databasePath,
  manifestPath,
  packageStatus: manifest.result.packageStatus,
  market: "EG",
  currency: "EGP",
  orderCount: manifest.result.orderCount,
  productCount: manifest.result.productCount,
  reviewCount: manifest.result.reviewCount,
  rawRowsPersisted: manifest.result.rawRowsPersisted,
  customerIdentityPersisted: manifest.result.customerIdentityPersisted,
  marketValidated: manifest.result.marketValidated,
  canonicalBlueprintMutation: manifest.result.canonicalBlueprintMutation,
}, null, 2));

database.close();

import assert from "node:assert/strict";
import { openDatabase } from "../src/lib/db";

const databasePath = process.env.CDKS_GOOGLE_DRIVE_MERGE_DATABASE ?? ".local/private-research/google-drive-merge-2026-08-27-v2/google-drive-merge-2026-08-27.sqlite";
const workspaceId = process.env.CDKS_SHAADDESIGN_WORKSPACE ?? "ws-cdks-private-google-drive";
const snapshotId = "shaaddesign-ga4-restricted-snapshot-2023";
const packageId = "shaaddesign-ga4-restricted-package-2023";

const database = openDatabase(databasePath);
const snapshotRow = database.prepare("SELECT * FROM knowledge_snapshots WHERE workspace_id = ? AND snapshot_id = ?").get(workspaceId, snapshotId) as Record<string, unknown> | undefined;
const packageRow = database.prepare("SELECT * FROM evidence_packages WHERE workspace_id = ? AND package_id = ?").get(workspaceId, packageId) as Record<string, unknown> | undefined;
const sourceRow = database.prepare("SELECT * FROM source_records WHERE source_id = ?").get("shaaddesign-ga4-owner-attestation-20260827") as Record<string, unknown> | undefined;
const auditCount = Number((database.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE workspace_id = ? AND audit_event_id = ?").get(workspaceId, "audit-shaaddesign-restricted-snapshot-20260827") as { count?: number }).count ?? 0);
assert.ok(snapshotRow, "ShaadDesign snapshot is missing.");
assert.ok(packageRow, "ShaadDesign restricted package is missing.");
assert.ok(sourceRow, "ShaadDesign restricted source is missing.");
assert.equal(snapshotRow?.market, "SA");
assert.equal(snapshotRow?.industry, "interior_design_and_decoration");
assert.equal(snapshotRow?.locale, "ar");
assert.equal(snapshotRow?.currency, "SAR");
assert.equal(snapshotRow?.freshness_status, "fresh");
assert.equal(packageRow?.status, "limited");
assert.equal(packageRow?.freshness_status, "fresh");
assert.equal(sourceRow?.license_status, "restricted");
assert.equal(auditCount, 1);
const snapshot = JSON.parse(String(snapshotRow?.snapshot_json)) as Record<string, unknown>;
const facts = Array.isArray(snapshot.facts) ? snapshot.facts as Array<Record<string, unknown>> : [];
assert.equal(facts.length, 7);
assert.ok(facts.some((fact) => fact.name === "GA4 Reporting Time Zone" && fact.status === "unavailable"));
assert.ok(facts.some((fact) => fact.name === "Exact 2023 GA4 performance aggregates" && fact.status === "unavailable"));
assert.equal(snapshot.contradictions instanceof Array ? snapshot.contradictions.length : -1, 0);
assert.equal(JSON.stringify(snapshot).includes("2023-01-01..2023-12-31"), true);
assert.equal(JSON.stringify(snapshot).includes("marketValidated"), false);
function assertSafeKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertSafeKeys);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(/^(password|passwd|access[_-]?token|refresh[_-]?token|api[_-]?key|cookie|phone|mobile|email|address|full.?name|customer|client|searchTerm|creativeText|pageUrl)$/i.test(key), false, `Forbidden field ${key} persisted.`);
    assertSafeKeys(child);
  }
}
assertSafeKeys(snapshot);

database.close();
console.log(JSON.stringify({
  test: "shaaddesign-snapshot-regression",
  status: "PASS",
  workspaceId,
  snapshotId,
  packageId,
  packageStatus: packageRow?.status,
  factCount: facts.length,
  timezone: "unavailable",
  exactPeriodPerformance: "unavailable",
  marketValidated: false,
  canonicalBlueprintMutation: false,
}, null, 2));

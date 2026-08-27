import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase } from "../src/lib/db";

const root = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_ROOT ?? ".local/private-research/google-drive-merge-2026-08-27-v2");
const databasePath = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_DATABASE ?? `${root}/google-drive-merge-2026-08-27.sqlite`);
const manifestPath = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_MANIFEST ?? `${root}/MERGE_MANIFEST.json`);
const workspaceId = process.env.CDKS_GOOGLE_DRIVE_MERGE_WORKSPACE ?? "ws-cdks-private-google-drive";

function fail(message: string): never {
  throw new Error(message);
}

function assert(condition: unknown, message: string): void {
  if (!condition) fail(message);
}

function count(database: ReturnType<typeof openDatabase>, table: string, where = "", params: unknown[] = []): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}${where ? ` WHERE ${where}` : ""}`).get(...params) as { count?: number };
  return Number(row?.count ?? 0);
}

function walk(value: unknown, visit: (key: string, value: unknown) => void, key = ""): void {
  visit(key, value);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, String(index)));
  else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, childValue]) => walk(childValue, visit, childKey));
}

assert(existsSync(databasePath), `Missing Google Drive merge database: ${databasePath}`);
assert(existsSync(manifestPath), `Missing Google Drive merge manifest: ${manifestPath}`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  result: { artifactCount: number; packageCount: number; marketValidated: boolean; rawRowsPersisted: boolean; rawValuesPersisted: boolean; canonicalBlueprintMutation: boolean };
};
const database = openDatabase(databasePath);
const artifactCount = count(database, "drive_evidence_artifacts", "workspace_id = ?", [workspaceId]);
const packageCount = count(database, "evidence_packages", "workspace_id = ?", [workspaceId]);
const saConfirmedMarketCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND market = 'SA' AND scope_status = 'activity_and_market_user_confirmed_property_unverified'", [workspaceId]);
const duplicateCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND scope_status = 'excluded_duplicate'", [workspaceId]);
const catalogUnverifiedCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND scope_status = 'catalog_identity_unverified'", [workspaceId]);
const currencyGuessCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND currency IS NOT NULL", [workspaceId]);
const rawRowsFlagViolations = count(database, "drive_evidence_artifacts", "workspace_id = ? AND (raw_rows_omitted <> 1 OR raw_values_omitted <> 1 OR market_validated <> 0)", [workspaceId]);
const auditCount = count(database, "audit_events", "workspace_id = ? AND audit_event_id = 'audit-google-drive-private-merge-20260827'", [workspaceId]);

assert(manifest.result.artifactCount === 86, `Manifest artifact count expected 86, got ${manifest.result.artifactCount}.`);
assert(manifest.result.packageCount === 0, `Manifest package count must be 0, got ${manifest.result.packageCount}.`);
assert(manifest.result.marketValidated === false, "Manifest marketValidated must remain false.");
assert(manifest.result.rawRowsPersisted === false && manifest.result.rawValuesPersisted === false, "Manifest raw persistence flags must remain false.");
assert(manifest.result.canonicalBlueprintMutation === false, "Manifest must state no Canonical Blueprint mutation.");
assert(artifactCount === 86, `Expected 86 persisted Drive artifacts, got ${artifactCount}.`);
assert(packageCount === 0, `Drive workspace must not create evidence packages, got ${packageCount}.`);
assert(saConfirmedMarketCount === 61, `Expected 61 Saudi activity artifacts with unverified property scope, got ${saConfirmedMarketCount}.`);
assert(duplicateCount === 3, `Expected 3 explicitly known duplicates excluded, got ${duplicateCount}.`);
assert(catalogUnverifiedCount === 12, `Expected 12 catalog identity-unverified artifacts, got ${catalogUnverifiedCount}.`);
assert(currencyGuessCount === 0, `Drive merge guessed currency for ${currencyGuessCount} artifacts.`);
assert(rawRowsFlagViolations === 0, `Raw-row/market-validation flag violations: ${rawRowsFlagViolations}.`);
assert(auditCount === 1, `Expected one idempotent merge audit event, got ${auditCount}.`);

const rows = database.prepare("SELECT artifact_id, artifact_json FROM drive_evidence_artifacts WHERE workspace_id = ? ORDER BY artifact_id").all(workspaceId) as Array<{ artifact_id: string; artifact_json: string }>;
for (const row of rows) {
  const artifact = JSON.parse(row.artifact_json) as Record<string, unknown>;
  assert(Array.isArray(artifact.rows) && artifact.rows.length === 0, `Artifact ${row.artifact_id} contains raw rows.`);
  walk(artifact, (key, value) => {
    if (/(driveId|rawPath|password|passwd|access[_-]?token|refresh[_-]?token|api[_-]?key|cookie|secret|phone|mobile|email|address|full.?name|customer|client|searchTerm|creativeText|pageUrl)/i.test(key)) {
      fail(`Forbidden persisted field ${key} found in ${row.artifact_id}.`);
    }
    if (typeof value === "string" && /(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z_-]{20,})/.test(value)) {
      fail(`Credential-like value found in ${row.artifact_id}.`);
    }
  });
}

database.close();
console.log(JSON.stringify({ status: "PASS", artifactCount, packageCount, saConfirmedMarketCount, duplicateCount, catalogUnverifiedCount, currencyGuessCount, rawRowsFlagViolations, auditCount }, null, 2));

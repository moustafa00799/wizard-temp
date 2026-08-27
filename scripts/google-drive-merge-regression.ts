import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { openDatabase, createRepositories } from "../src/lib/db";
import { GoogleDriveArtifactSchema } from "../src/lib/knowledge/google-drive-readonly";

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

function syntheticArtifact(rawSha256: string, label: string, dataClass: "ga4" | "search_console" | "catalog_feed") {
  return GoogleDriveArtifactSchema.parse({
    sourceRef: `drive-file-sha256:${rawSha256.slice(0, 16)}`,
    label,
    dataClass,
    rawSha256,
    rawSizeBytes: 1,
    rawRowsOmitted: true,
    rawValuesOmitted: true,
    rows: [],
    sheets: [],
    metricAvailability: {},
    period: null,
    dimensions: [],
    flags: [],
    scope: dataClass === "catalog_feed"
      ? { market: null, industry: null, locale: null, currency: null, verified: false, verificationNote: "Synthetic catalog identity is intentionally unverified." }
      : { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: null, verified: false, verificationNote: "Synthetic property scope is intentionally unverified." },
    structuralFingerprint: "b".repeat(64),
  });
}

function assertArtifactPrivacy(database: ReturnType<typeof openDatabase>, expectedArtifactCount: number): void {
  const rows = database.prepare("SELECT artifact_id, artifact_json FROM drive_evidence_artifacts WHERE workspace_id = ? ORDER BY artifact_id").all(workspaceId) as Array<{ artifact_id: string; artifact_json: string }>;
  assert(rows.length === expectedArtifactCount, `Expected ${expectedArtifactCount} persisted Drive artifacts, got ${rows.length}.`);
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
}

const hasPrivateMerge = existsSync(databasePath) && existsSync(manifestPath);
const database = openDatabase(hasPrivateMerge ? databasePath : ":memory:");
if (!hasPrivateMerge) {
  const repositories = createRepositories(database);
  database.prepare("INSERT INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, 'active', ?)").run(workspaceId, "Synthetic Drive regression workspace", "2026-08-27T00:00:00.000Z");
  database.prepare("INSERT INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").run(workspaceId, "synthetic-drive-regression", "2026-08-27T00:00:00.000Z");
  const syntheticRecords = [
    ["a".repeat(64), "synthetic_ga4", "ga4", "activity_and_market_user_confirmed_property_unverified"],
    ["c".repeat(64), "synthetic_search_console", "search_console", "activity_and_market_user_confirmed_property_unverified"],
    ["d".repeat(64), "synthetic_catalog", "catalog_feed", "catalog_identity_unverified"],
  ] as const;
  for (const [rawSha256, label, dataClass, scopeStatus] of syntheticRecords) {
    const artifact = syntheticArtifact(rawSha256, label, dataClass);
    repositories.driveEvidence.createArtifact({
      artifactId: `drive-artifact-${rawSha256.slice(0, 24)}`,
      workspaceId,
      sourceRef: artifact.sourceRef,
      sourceSha256: artifact.rawSha256,
      dataClass,
      scopeStatus,
      market: artifact.scope.market ?? undefined,
      industry: artifact.scope.industry ?? undefined,
      locale: artifact.scope.locale ?? undefined,
      currency: undefined,
      confidence: dataClass === "catalog_feed" ? 0.35 : 0.55,
      artifact,
      createdAt: "2026-08-27T00:00:00.000Z",
    });
  }
  repositories.governance.createAuditEvent({
    auditEventId: "audit-google-drive-private-merge-20260827",
    workspaceId,
    eventType: "private_drive_evidence_merged",
    objectType: "drive_evidence_artifacts",
    objectId: "synthetic-drive-regression",
    actorType: "system",
    payload: { artifactCount: 3, packageCount: 0, marketValidated: false, rawRowsPersisted: false, canonicalBlueprintMutation: false },
  });
}

const expectedArtifactCount = hasPrivateMerge ? 86 : 3;
const expectedSaudiCount = hasPrivateMerge ? 61 : 2;
const expectedDuplicateCount = hasPrivateMerge ? 3 : 0;
const expectedCatalogCount = hasPrivateMerge ? 12 : 1;
if (hasPrivateMerge) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    result: { artifactCount: number; packageCount: number; marketValidated: boolean; rawRowsPersisted: boolean; rawValuesPersisted: boolean; canonicalBlueprintMutation: boolean };
  };
  assert(manifest.result.artifactCount === 86, `Manifest artifact count expected 86, got ${manifest.result.artifactCount}.`);
  assert(manifest.result.packageCount === 0, `Manifest package count must be 0, got ${manifest.result.packageCount}.`);
  assert(manifest.result.marketValidated === false, "Manifest marketValidated must remain false.");
  assert(manifest.result.rawRowsPersisted === false && manifest.result.rawValuesPersisted === false, "Manifest raw persistence flags must remain false.");
  assert(manifest.result.canonicalBlueprintMutation === false, "Manifest must state no Canonical Blueprint mutation.");
}
const packageCount = count(database, "evidence_packages", "workspace_id = ?", [workspaceId]);
const packageRows = database.prepare("SELECT package_id, status, market, industry FROM evidence_packages WHERE workspace_id = ? ORDER BY package_id").all(workspaceId) as Array<{ package_id: string; status: string; market: string; industry: string }>;
const saConfirmedMarketCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND market = 'SA' AND scope_status = 'activity_and_market_user_confirmed_property_unverified'", [workspaceId]);
const duplicateCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND scope_status = 'excluded_duplicate'", [workspaceId]);
const catalogUnverifiedCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND scope_status = 'catalog_identity_unverified'", [workspaceId]);
const currencyGuessCount = count(database, "drive_evidence_artifacts", "workspace_id = ? AND currency IS NOT NULL", [workspaceId]);
const rawRowsFlagViolations = count(database, "drive_evidence_artifacts", "workspace_id = ? AND (raw_rows_omitted <> 1 OR raw_values_omitted <> 1 OR market_validated <> 0)", [workspaceId]);
const auditCount = count(database, "audit_events", "workspace_id = ? AND audit_event_id = 'audit-google-drive-private-merge-20260827'", [workspaceId]);
assert(packageCount <= 1, `Drive workspace must not create more than the one approved ShaadDesign package, got ${packageCount}.`);
assert(packageRows.every((row) => row.package_id === "shaaddesign-ga4-restricted-package-2023" && row.status === "limited" && row.market === "SA" && row.industry === "interior_design_and_decoration"), "Unexpected package found in Drive workspace.");
assert(saConfirmedMarketCount === expectedSaudiCount, `Expected ${expectedSaudiCount} Saudi activity artifacts, got ${saConfirmedMarketCount}.`);
assert(duplicateCount === expectedDuplicateCount, `Expected ${expectedDuplicateCount} explicitly known duplicates excluded, got ${duplicateCount}.`);
assert(catalogUnverifiedCount === expectedCatalogCount, `Expected ${expectedCatalogCount} catalog identity-unverified artifacts, got ${catalogUnverifiedCount}.`);
assert(currencyGuessCount === 0, `Drive merge guessed currency for ${currencyGuessCount} artifacts.`);
assert(rawRowsFlagViolations === 0, `Raw-row/market-validation flag violations: ${rawRowsFlagViolations}.`);
assert(auditCount === 1, `Expected one idempotent merge audit event, got ${auditCount}.`);
assertArtifactPrivacy(database, expectedArtifactCount);

database.close();
console.log(JSON.stringify({ status: "PASS", mode: hasPrivateMerge ? "private-artifact-database" : "synthetic-sanitized-fixture", artifactCount: expectedArtifactCount, packageCount, saConfirmedMarketCount, duplicateCount, catalogUnverifiedCount, currencyGuessCount, rawRowsFlagViolations, auditCount }, null, 2));

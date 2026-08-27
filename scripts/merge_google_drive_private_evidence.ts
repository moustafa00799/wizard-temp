import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRepositories, openDatabase, sha256Json, type JsonRecord } from "../src/lib/db";
import { parseGoogleDriveNormalizedEvidence, type GoogleDriveArtifact } from "../src/lib/knowledge/google-drive-readonly";

const inputPath = resolve(process.env.CDKS_GOOGLE_DRIVE_NORMALIZED ?? ".local/private-research/google-drive/2026-08-27/normalized-drive-evidence-2026-08-27.json");
const root = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_ROOT ?? ".local/private-research/google-drive-merge-2026-08-27-v2");
const databasePath = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_DATABASE ?? `${root}/google-drive-merge-2026-08-27.sqlite`);
const manifestPath = resolve(process.env.CDKS_GOOGLE_DRIVE_MERGE_MANIFEST ?? `${root}/MERGE_MANIFEST.json`);
const workspaceId = process.env.CDKS_GOOGLE_DRIVE_MERGE_WORKSPACE ?? "ws-cdks-private-google-drive";
const generatedAt = process.env.CDKS_GOOGLE_DRIVE_MERGE_GENERATED_AT ?? "2026-08-27T00:00:00.000Z";

const DATA_CLASSES = ["ga4", "ga4_ads_linked", "search_console", "keyword_planner", "campaign_report", "catalog_feed", "store_product", "sales_report", "seller_profile"] as const;
type ScopeStatus = "activity_and_market_user_confirmed_property_unverified" | "scope_unverified" | "catalog_identity_unverified" | "excluded_duplicate";
type DriveArtifact = GoogleDriveArtifact;

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing Google Drive normalized artifact: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function count(database: ReturnType<typeof openDatabase>, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>();
  return Number(row?.count ?? 0);
}

function jsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected JSON record.");
  return value as JsonRecord;
}

function assertNormalizedArtifact(record: DriveArtifact): void {
  if (!DATA_CLASSES.includes(record.dataClass)) throw new Error(`Unsupported Drive data class: ${record.dataClass}`);
  if (record.rows.length !== 0 || record.rawRowsOmitted !== true || record.rawValuesOmitted !== true) throw new Error(`Raw rows or values detected in Drive artifact ${record.sourceRef}.`);
  if (!/^[a-f0-9]{64}$/.test(record.rawSha256)) throw new Error(`Invalid raw SHA-256 in Drive artifact ${record.sourceRef}.`);
  if (record.scope.currency !== null) throw new Error(`Drive artifact ${record.sourceRef} must not guess a currency.`);
  if (record.scope.verified !== false) throw new Error(`Drive artifact ${record.sourceRef} cannot be marked verified in this pass.`);
  const serialized = JSON.stringify(record);
  if (/(?:["'](?:password|passwd|access[_-]?token|refresh[_-]?token|api[_-]?key|cookie|secret|phone|mobile|email|address|full.?name|customer|client|query|keyword|creative|url)["']\s*:)|(?:freeText|pageUrl|searchTerm|creativeText)/i.test(serialized)) {
    throw new Error(`Sensitive or raw-like field detected in normalized Drive artifact ${record.sourceRef}.`);
  }
}

function scopeStatus(record: DriveArtifact): ScopeStatus {
  if (record.duplicateOfIndex !== undefined) return "excluded_duplicate";
  if (record.dataClass === "catalog_feed" || record.dataClass === "store_product") return "catalog_identity_unverified";
  if (record.dataClass === "ga4" || record.dataClass === "ga4_ads_linked" || record.dataClass === "search_console") return "activity_and_market_user_confirmed_property_unverified";
  return "scope_unverified";
}

function confidence(record: DriveArtifact): number {
  if (record.duplicateOfIndex !== undefined) return 0;
  if (record.dataClass === "ga4" || record.dataClass === "ga4_ads_linked" || record.dataClass === "search_console") return 0.55;
  if (record.dataClass === "catalog_feed" || record.dataClass === "store_product") return 0.35;
  if (record.dataClass === "keyword_planner") return 0.25;
  return 0.3;
}

function marketOf(record: DriveArtifact): string | undefined {
  return record.scope.market ?? undefined;
}

function industryOf(record: DriveArtifact): string | undefined {
  return record.scope.industry ?? undefined;
}

function localeOf(record: DriveArtifact): string | undefined {
  return record.scope.locale ?? undefined;
}

mkdirSync(root, { recursive: true });
const normalized = parseGoogleDriveNormalizedEvidence(readJson<unknown>(inputPath));
if (normalized.provider !== "google_drive_readonly" || normalized.policy.marketValidated !== false) throw new Error("Drive artifact policy gate failed.");
if (normalized.records.length !== normalized.recordCount) throw new Error("Drive artifact record count mismatch.");
for (const record of normalized.records) assertNormalizedArtifact(record);

const database = openDatabase(databasePath);
const repositories = createRepositories(database);
database.prepare("INSERT OR IGNORE INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, 'active', ?)").run(workspaceId, "CDKS private Google Drive evidence", generatedAt);
database.prepare("INSERT OR IGNORE INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").run(workspaceId, "system-private-google-drive", generatedAt);

let created = 0;
let replayed = 0;
const statusCounts: Record<string, number> = {};
const classCounts: Record<string, number> = {};
for (const record of normalized.records) {
  const status = scopeStatus(record);
  const artifactId = `drive-artifact-${record.rawSha256.slice(0, 24)}`;
  const existedBeforeMerge = database.prepare("SELECT 1 AS present FROM drive_evidence_artifacts WHERE workspace_id = ? AND (artifact_id = ? OR source_sha256 = ?)").get(workspaceId, artifactId, record.rawSha256);
  repositories.driveEvidence.createArtifact({
    artifactId,
    workspaceId,
    sourceRef: record.sourceRef,
    sourceSha256: record.rawSha256,
    dataClass: record.dataClass,
    scopeStatus: status,
    market: marketOf(record),
    industry: industryOf(record),
    locale: localeOf(record),
    currency: undefined,
    periodStart: record.period?.min,
    periodEnd: record.period?.max,
    confidence: confidence(record),
    artifact: jsonRecord(record),
    createdAt: generatedAt,
  });
  if (existedBeforeMerge) replayed += 1;
  else created += 1;
  statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  classCounts[record.dataClass] = (classCounts[record.dataClass] ?? 0) + 1;
}

repositories.governance.createAuditEvent({
  auditEventId: "audit-google-drive-private-merge-20260827",
  workspaceId,
  eventType: "private_drive_evidence_merged",
  objectType: "drive_evidence_artifacts",
  objectId: "google-drive-merge-2026-08-27",
  actorType: "system",
  payload: {
    artifactCount: normalized.records.length,
    packageCount: 0,
    marketValidated: false,
    rawRowsPersisted: false,
    rawValuesPersisted: false,
    credentialsPersisted: false,
    canonicalBlueprintMutation: false,
    externalWrites: false,
  },
});

const result = {
  artifactCount: count(database, "drive_evidence_artifacts"),
  workspaceId,
  packageCount: count(database, "evidence_packages"),
  statusCounts,
  classCounts,
  marketValidated: false,
  rawRowsPersisted: false,
  rawValuesPersisted: false,
  credentialsPersisted: false,
  canonicalBlueprintMutation: false,
  externalWrites: false,
};
const manifest = {
  mergeId: "cdks-private-google-drive-merge-20260827",
  generatedAt,
  input: { path: inputPath, sha256: sha256Json(normalized), recordCount: normalized.records.length },
  result: { ...result, created, replayed },
  policy: {
    privateDriveDataSeparatedFromPublicMarketEvidence: true,
    saActivitySeparatedFromEgyptianEasyOrders: true,
    propertyAndCurrencyVerificationRequiredBeforePackage: true,
    unverifiedCatalogsNeverAttachedToEasyOrders: true,
    duplicateSearchConsoleArtifactsExcluded: true,
    dedupBasisIsExplicit: true,
    rawRowsOmitted: true,
    noAiCalls: true,
    noDriveWrites: true,
    noBlueprintMutation: true,
  },
  databasePath,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifestPath, databasePath, ...manifest.result }, null, 2));
database.close();

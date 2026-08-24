import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { DATABASE_FOUNDATION_MIGRATION_ID, DATABASE_FOUNDATION_MIGRATION_SQL } from "./migrations/0001_database_foundation";
import { PERSONAL_STAGING_MIGRATION_ID, PERSONAL_STAGING_MIGRATION_SQL } from "./migrations/0002_personal_staging";

export type DatabaseLocation = ":memory:" | string;
export type JsonRecord = Record<string, unknown>;

type Row = Record<string, unknown>;

type WorkspaceRecord = {
  workspaceId: string;
  name: string;
  status?: "active" | "archived";
  createdAt?: string;
};

type BriefRecord = {
  briefId: string;
  workspaceId: string;
  version: number;
  market?: string;
  industry?: string;
  locale?: string;
  currency?: string;
  status: "draft" | "submitted" | "approved" | "archived";
  brief: JsonRecord;
  createdAt?: string;
};

type BlueprintRecord = {
  blueprintId: string;
  workspaceId: string;
  version: number;
  blueprint: JsonRecord;
  canonicalSha256?: string;
  createdAt?: string;
};

type SourceRecord = {
  sourceId: string;
  publisher: string;
  sourceUrl: string;
  sourceType: "official_api" | "official_document" | "public_library" | "client_data" | "licensed_report";
  market?: string;
  industry?: string;
  language?: string;
  licenseStatus: "approved" | "restricted" | "unknown";
  version: string;
  observedAt: string;
  freshnessPolicy: "daily" | "weekly" | "monthly" | "on_demand";
  limitations: string[];
  enabled?: boolean;
};

type SnapshotRecord = {
  snapshotId: string;
  workspaceId: string;
  market: string;
  industry: string;
  locale: string;
  currency: string;
  capturedAt: string;
  freshnessStatus: "fresh" | "stale" | "expired" | "missing";
  confidence: number;
  snapshot: JsonRecord;
  sourceIds: string[];
};

type EvidencePackageRecord = {
  packageId: string;
  workspaceId: string;
  market: string;
  industry: string;
  status: "ready" | "limited" | "missing" | "rejected";
  freshnessStatus: "fresh" | "stale" | "expired" | "missing";
  retrievalStrategy: "deterministic_fixture" | "registry_lookup" | "manual_review";
  evidencePackage: JsonRecord;
  createdAt?: string;
};

type StrategyContextRecord = {
  contextId: string;
  workspaceId: string;
  packageId: string;
  blueprintId: string;
  market: string;
  industry: string;
  scopedValidationStatus: "market_validated" | "market_context_ready" | "partial" | "unavailable";
  context: JsonRecord;
  createdAt?: string;
};

type StrategyRecommendationRecord = {
  recommendationId: string;
  workspaceId: string;
  contextId: string;
  blueprintId: string;
  recommendation: JsonRecord;
  createdAt?: string;
};

type ProviderAccountRecord = {
  accountId: string;
  workspaceId: string;
  provider: "meta" | "google_ads" | "tiktok_ads" | "ga4";
  externalAccountRef: string;
  ownershipStatus: "unverified" | "verified" | "revoked";
};

type ProviderConnectionRecord = {
  connectionId: string;
  accountId: string;
  connectionStatus: "unverified" | "verified" | "read_only_ready" | "syncing" | "partial" | "revoked" | "write_pending_approval" | "write_enabled";
  grantedScopes: string[];
  lastVerifiedAt?: string;
  secretRef?: string;
};

type SyncRunRecord = {
  syncRunId: string;
  connectionId: string;
  status: "queued" | "running" | "succeeded" | "partial" | "failed" | "cancelled";
  rowsSeen?: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
};

type ApprovalEventRecord = {
  approvalId: string;
  workspaceId: string;
  objectType: "brief" | "strategy_context" | "recommendation" | "blueprint" | "provider_write_permission";
  objectId: string;
  decision: "pending" | "approved" | "rejected" | "revoked";
  actorUserId?: string;
  note?: string;
};

type AuditEventRecord = {
  auditEventId: string;
  workspaceId: string;
  eventType: string;
  objectType: string;
  objectId: string;
  actorType: "user" | "system" | "connector" | "ai";
  payload: JsonRecord;
};

export type DatabaseRepositories = ReturnType<typeof createRepositories>;

function now(): string {
  return new Date().toISOString();
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function parseJson<T>(value: unknown): T {
  if (typeof value !== "string") throw new Error("Database JSON column did not contain text.");
  return JSON.parse(value) as T;
}

function assertSafeReference(value: string | undefined): void {
  if (!value) return;
  if (/(?:password|access[_-]?token|refresh[_-]?token|api[_-]?key|secret)\s*=/i.test(value)) {
    throw new Error("Secret material cannot be stored as a provider secret reference.");
  }
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(json(value)).digest("hex");
}

export function openDatabase(location: DatabaseLocation = ":memory:"): DatabaseSync {
  const database = new DatabaseSync(location);
  database.exec("PRAGMA foreign_keys = ON;");
  applyDatabaseMigrations(database);
  return database;
}

export function applyDatabaseMigrations(database: DatabaseSync): void {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (migration_id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);");
  const apply = (migrationId: string, sql: string) => {
    const exists = database.prepare("SELECT migration_id FROM schema_migrations WHERE migration_id = ?").get<{ migration_id: string }>(migrationId);
    if (!exists) {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (migration_id, applied_at) VALUES (?, ?)").run(migrationId, now());
    }
  };
  apply(DATABASE_FOUNDATION_MIGRATION_ID, DATABASE_FOUNDATION_MIGRATION_SQL);
  apply(PERSONAL_STAGING_MIGRATION_ID, PERSONAL_STAGING_MIGRATION_SQL);
}

export function createRepositories(database: DatabaseSync) {
  const createWorkspace = database.prepare("INSERT INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, ?, ?)");
  const getWorkspace = database.prepare("SELECT workspace_id, name, status, created_at FROM workspaces WHERE workspace_id = ?");
  const createMembership = database.prepare("INSERT INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?)");
  const createBrief = database.prepare("INSERT INTO client_briefs (brief_id, workspace_id, market, industry, locale, currency, version, status, brief_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getBrief = database.prepare("SELECT * FROM client_briefs WHERE brief_id = ? AND version = ?");
  const createSubmission = database.prepare("INSERT INTO wizard_submissions (submission_id, brief_id, brief_version, workspace_id, input_json, source, user_confirmed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const createBlueprint = database.prepare("INSERT INTO canonical_blueprints (blueprint_id, workspace_id, current_version, canonical_sha256, generation_mode, external_actions_allowed, budget_spend_allowed, blueprint_json, created_at) VALUES (?, ?, ?, ?, 'blueprint_only', 0, 0, ?, ?)");
  const createBlueprintVersion = database.prepare("INSERT INTO blueprint_versions (blueprint_id, version, canonical_sha256, blueprint_json, created_at) VALUES (?, ?, ?, ?, ?)");
  const getBlueprint = database.prepare("SELECT * FROM canonical_blueprints WHERE blueprint_id = ?");
  const createSource = database.prepare("INSERT INTO source_records (source_id, publisher, source_url, source_type, market, industry, language, license_status, current_version, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createSourceVersion = database.prepare("INSERT INTO source_versions (source_id, version, observed_at, freshness_policy, limitations_json, source_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const createProfile = database.prepare("INSERT OR IGNORE INTO industry_profiles (profile_id, version, industry_key, branch, status, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const createSnapshot = database.prepare("INSERT INTO knowledge_snapshots (snapshot_id, workspace_id, market, industry, locale, currency, captured_at, freshness_status, confidence, source_ids_json, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getSnapshot = database.prepare("SELECT * FROM knowledge_snapshots WHERE workspace_id = ? AND snapshot_id = ?");
  const createFact = database.prepare("INSERT INTO market_facts (fact_id, snapshot_id, market, industry, status, value_json, source_ids_json, observed_at, fact_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createClaim = database.prepare("INSERT INTO claims (claim_id, workspace_id, market, industry, claim_type, status, evidence_ids_json, claim_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createPackage = database.prepare("INSERT INTO evidence_packages (package_id, workspace_id, market, industry, status, freshness_status, retrieval_strategy, package_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const attachPackageSnapshot = database.prepare("INSERT INTO evidence_package_snapshots (package_id, snapshot_id) VALUES (?, ?)");
  const createEvidenceLink = database.prepare("INSERT INTO evidence_links (evidence_id, package_id, source_id, observed_at, limitations_json, evidence_json) VALUES (?, ?, ?, ?, ?, ?)");
  const createContext = database.prepare("INSERT INTO strategy_contexts (context_id, workspace_id, package_id, blueprint_id, market, industry, scoped_validation_status, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createRecommendation = database.prepare("INSERT INTO strategy_recommendations (recommendation_id, workspace_id, context_id, blueprint_id, status, recommendation_json, created_at) VALUES (?, ?, ?, ?, 'advisory_only', ?, ?)");
  const createProviderAccount = database.prepare("INSERT INTO provider_accounts (account_id, workspace_id, provider, external_account_ref, ownership_status, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const createProviderConnection = database.prepare("INSERT INTO provider_connections (connection_id, account_id, connection_status, read_only, secret_ref, granted_scopes_json, last_verified_at, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)");
  const createProviderScope = database.prepare("INSERT INTO provider_scopes (connection_id, scope_name, permission_kind) VALUES (?, ?, 'read')");
  const createCollection = database.prepare("INSERT INTO provider_collections (collection_id, connection_id, market, industry, period_start, period_end, collection_status, collection_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createSyncRun = database.prepare("INSERT INTO sync_runs (sync_run_id, connection_id, status, started_at, finished_at, rows_seen, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createCursor = database.prepare("INSERT INTO sync_cursors (connection_id, cursor_key, cursor_value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(connection_id, cursor_key) DO UPDATE SET cursor_value = excluded.cursor_value, updated_at = excluded.updated_at");
  const createApproval = database.prepare("INSERT INTO approval_events (approval_id, workspace_id, object_type, object_id, decision, actor_user_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const createAudit = database.prepare("INSERT INTO audit_events (audit_event_id, workspace_id, event_type, object_type, object_id, actor_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const createStagingRun = database.prepare("INSERT INTO staging_runs (staging_run_id, workspace_id, scenario_id, blueprint_id, context_id, recommendation_id, status, run_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getStagingRun = database.prepare("SELECT * FROM staging_runs WHERE workspace_id = ? AND scenario_id = ?");

  return {
    workspaces: {
      create(input: WorkspaceRecord) {
        const createdAt = input.createdAt ?? now();
        createWorkspace.run(input.workspaceId, input.name, input.status ?? "active", createdAt);
        return getWorkspace.get(input.workspaceId) as Row;
      },
      get(workspaceId: string) {
        return getWorkspace.get(workspaceId) as Row | undefined;
      },
    },
    memberships: {
      create(workspaceId: string, userId: string, role: "owner" | "admin" | "analyst" | "reviewer" | "viewer") {
        createMembership.run(workspaceId, userId, role, now());
      },
    },
    briefs: {
      create(input: BriefRecord) {
        createBrief.run(input.briefId, input.workspaceId, input.market ?? null, input.industry ?? null, input.locale ?? null, input.currency ?? null, input.version, input.status, json(input.brief), input.createdAt ?? now());
        return getBrief.get(input.briefId, input.version) as Row;
      },
      get(briefId: string, version: number) {
        const row = getBrief.get(briefId, version) as Row | undefined;
        return row ? { ...row, brief: parseJson<JsonRecord>(row.brief_json) } : undefined;
      },
      createWizardSubmission(input: { submissionId: string; briefId: string; briefVersion: number; workspaceId: string; wizardInput: JsonRecord; source?: "wizard" | "import" | "fixture"; userConfirmed?: boolean }) {
        createSubmission.run(input.submissionId, input.briefId, input.briefVersion, input.workspaceId, json(input.wizardInput), input.source ?? "wizard", input.userConfirmed ? 1 : 0, now());
      },
    },
    blueprints: {
      create(input: BlueprintRecord) {
        const canonicalSha256 = input.canonicalSha256 ?? sha256Json(input.blueprint);
        createBlueprint.run(input.blueprintId, input.workspaceId, input.version, canonicalSha256, json(input.blueprint), input.createdAt ?? now());
        createBlueprintVersion.run(input.blueprintId, input.version, canonicalSha256, json(input.blueprint), input.createdAt ?? now());
        return getBlueprint.get(input.blueprintId) as Row;
      },
      get(blueprintId: string) {
        const row = getBlueprint.get(blueprintId) as Row | undefined;
        return row ? { ...row, blueprint: parseJson<JsonRecord>(row.blueprint_json) } : undefined;
      },
      assertUnchanged(blueprintId: string, expectedSha256: string) {
        const row = getBlueprint.get(blueprintId) as Row | undefined;
        if (!row || row.canonical_sha256 !== expectedSha256) throw new Error("Canonical Blueprint hash changed unexpectedly.");
      },
    },
    sources: {
      create(input: SourceRecord) {
        assertSafeReference(input.sourceUrl);
        createSource.run(input.sourceId, input.publisher, input.sourceUrl, input.sourceType, input.market ?? null, input.industry ?? null, input.language ?? null, input.licenseStatus, input.version, input.enabled === false ? 0 : 1, now());
        createSourceVersion.run(input.sourceId, input.version, input.observedAt, input.freshnessPolicy, json(input.limitations), json(input), now());
      },
      createIndustryProfile(profile: JsonRecord & { profileId: string; version: string; industryKey: string; branch: string; status: string }) {
        createProfile.run(profile.profileId, profile.version, profile.industryKey, profile.branch, profile.status, json(profile), now());
      },
    },
    knowledge: {
      createSnapshot(input: SnapshotRecord) {
        createSnapshot.run(input.snapshotId, input.workspaceId, input.market, input.industry, input.locale, input.currency, input.capturedAt, input.freshnessStatus, input.confidence, json(input.sourceIds), json(input.snapshot), now());
        const row = getSnapshot.get(input.workspaceId, input.snapshotId) as Row;
        return row;
      },
      getSnapshot(workspaceId: string, snapshotId: string) {
        const row = getSnapshot.get(workspaceId, snapshotId) as Row | undefined;
        return row ? { ...row, sourceIds: parseJson<string[]>(row.source_ids_json), snapshot: parseJson<JsonRecord>(row.snapshot_json) } : undefined;
      },
      createFact(input: { factId: string; snapshotId: string; market: string; industry: string; status: string; value: unknown; sourceIds: string[]; observedAt?: string; fact: JsonRecord }) {
        createFact.run(input.factId, input.snapshotId, input.market, input.industry, input.status, json(input.value), json(input.sourceIds), input.observedAt ?? null, json(input.fact), now());
      },
      createClaim(input: { claimId: string; workspaceId: string; market: string; industry: string; claimType: string; status: string; evidenceIds: string[]; claim: JsonRecord }) {
        createClaim.run(input.claimId, input.workspaceId, input.market, input.industry, input.claimType, input.status, json(input.evidenceIds), json(input.claim), now());
      },
      createEvidencePackage(input: EvidencePackageRecord) {
        createPackage.run(input.packageId, input.workspaceId, input.market, input.industry, input.status, input.freshnessStatus, input.retrievalStrategy, json(input.evidencePackage), input.createdAt ?? now());
      },
      attachSnapshot(packageId: string, snapshotId: string) {
        attachPackageSnapshot.run(packageId, snapshotId);
      },
      createEvidenceLink(input: { evidenceId: string; packageId: string; sourceId: string; observedAt: string; limitations: string[]; evidence: JsonRecord }) {
        createEvidenceLink.run(input.evidenceId, input.packageId, input.sourceId, input.observedAt, json(input.limitations), json(input.evidence));
      },
    },
    strategy: {
      createContext(input: StrategyContextRecord) {
        createContext.run(input.contextId, input.workspaceId, input.packageId, input.blueprintId, input.market, input.industry, input.scopedValidationStatus, json(input.context), input.createdAt ?? now());
      },
      createRecommendation(input: StrategyRecommendationRecord) {
        createRecommendation.run(input.recommendationId, input.workspaceId, input.contextId, input.blueprintId, json(input.recommendation), input.createdAt ?? now());
      },
    },
    providers: {
      createAccount(input: ProviderAccountRecord) {
        createProviderAccount.run(input.accountId, input.workspaceId, input.provider, input.externalAccountRef, input.ownershipStatus, now());
      },
      createConnection(input: ProviderConnectionRecord) {
        assertSafeReference(input.secretRef);
        if (input.connectionStatus === "write_enabled") throw new Error("Write-enabled provider connections are outside Database Foundation v1.");
        createProviderConnection.run(input.connectionId, input.accountId, input.connectionStatus, input.secretRef ?? null, json(input.grantedScopes), input.lastVerifiedAt ?? null, now());
        for (const scope of input.grantedScopes) createProviderScope.run(input.connectionId, scope);
      },
      createCollection(input: { collectionId: string; connectionId: string; market?: string; industry?: string; periodStart?: string; periodEnd?: string; status: string; collection: JsonRecord }) {
        createCollection.run(input.collectionId, input.connectionId, input.market ?? null, input.industry ?? null, input.periodStart ?? null, input.periodEnd ?? null, input.status, json(input.collection), now());
      },
      createSyncRun(input: SyncRunRecord) {
        createSyncRun.run(input.syncRunId, input.connectionId, input.status, input.startedAt ?? null, input.finishedAt ?? null, input.rowsSeen ?? 0, input.errorCode ?? null, input.errorMessage ?? null, now());
      },
      upsertCursor(connectionId: string, cursorKey: string, cursorValue: string) {
        createCursor.run(connectionId, cursorKey, cursorValue, now());
      },
    },
    staging: {
      createRun(input: { stagingRunId: string; workspaceId: string; scenarioId: string; blueprintId: string; contextId: string; recommendationId: string; status: "completed" | "failed"; run: JsonRecord; createdAt?: string }) {
        createStagingRun.run(input.stagingRunId, input.workspaceId, input.scenarioId, input.blueprintId, input.contextId, input.recommendationId, input.status, json(input.run), input.createdAt ?? now());
      },
      getRun(workspaceId: string, scenarioId: string): {
        stagingRunId: string;
        workspaceId: string;
        scenarioId: string;
        blueprintId: string;
        contextId: string;
        recommendationId: string;
        status: "completed" | "failed";
        createdAt: string;
        run: JsonRecord;
      } | undefined {
        const row = getStagingRun.get(workspaceId, scenarioId) as Row | undefined;
        if (!row) return undefined;
        return {
          stagingRunId: String(row.staging_run_id),
          workspaceId: String(row.workspace_id),
          scenarioId: String(row.scenario_id),
          blueprintId: String(row.blueprint_id),
          contextId: String(row.context_id),
          recommendationId: String(row.recommendation_id),
          status: String(row.status) as "completed" | "failed",
          createdAt: String(row.created_at),
          run: parseJson<JsonRecord>(row.run_json),
        };
      },
    },
    governance: {
      createApproval(input: ApprovalEventRecord) {
        createApproval.run(input.approvalId, input.workspaceId, input.objectType, input.objectId, input.decision, input.actorUserId ?? null, input.note ?? null, now());
      },
      createAuditEvent(input: AuditEventRecord) {
        createAudit.run(input.auditEventId, input.workspaceId, input.eventType, input.objectType, input.objectId, input.actorType, json(input.payload), now());
      },
    },
    rawDatabase: database,
  };
}

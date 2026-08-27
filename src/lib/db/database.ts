import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { DATABASE_FOUNDATION_MIGRATION_ID, DATABASE_FOUNDATION_MIGRATION_SQL } from "./migrations/0001_database_foundation";
import { PERSONAL_STAGING_MIGRATION_ID, PERSONAL_STAGING_MIGRATION_SQL } from "./migrations/0002_personal_staging";
import { STAGING_TEST_RUNS_MIGRATION_ID, STAGING_TEST_RUNS_MIGRATION_SQL } from "./migrations/0003_staging_test_runs";
import { KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_ID, KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_SQL } from "./migrations/0004_knowledge_snapshot_persistence";
import { DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_ID, DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_SQL } from "./migrations/0005_drive_evidence_artifacts";
import { CAMPAIGN_LIFECYCLE_MIGRATION_ID, CAMPAIGN_LIFECYCLE_MIGRATION_SQL } from "./migrations/0006_campaign_lifecycle";

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
  createdAt?: string;
};

type SnapshotVersionRecord = {
  snapshotId: string;
  revision: number;
  snapshotSha256: string;
  sourceManifestSha256?: string;
  capturedAt: string;
  freshnessStatus: "fresh" | "stale" | "expired" | "missing";
  payload: JsonRecord;
  createdAt?: string;
};

type DeferredSourceRecord = {
  deferredSourceId: string;
  workspaceId: string;
  provider: "meta" | "google_ads" | "tiktok_ads" | "ga4";
  externalAccountRef: string;
  status: "deferred" | "unavailable" | "ready_for_retry" | "merged";
  reason: string;
  retryGate: "new_authorization" | "direct_user_access" | "manual_review";
  mergePolicy: "merge_only_after_scope_and_hash_verification";
  lastAttemptAt?: string;
  createdAt?: string;
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

type DriveEvidenceArtifactRecord = {
  artifactId: string;
  workspaceId: string;
  sourceRef: string;
  sourceSha256: string;
  dataClass: "ga4" | "ga4_ads_linked" | "search_console" | "keyword_planner" | "campaign_report" | "catalog_feed" | "store_product" | "sales_report" | "seller_profile";
  scopeStatus: "activity_and_market_user_confirmed_property_unverified" | "scope_unverified" | "catalog_identity_unverified" | "excluded_duplicate";
  market?: string;
  industry?: string;
  locale?: string;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  confidence: number;
  artifact: JsonRecord;
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

type CampaignLifecycleState = "draft" | "review" | "approved" | "rejected";
type CampaignLifecycleRecord = {
  lifecycleId: string;
  workspaceId: string;
  blueprintId: string;
  canonicalSha256: string;
  state?: CampaignLifecycleState;
  createdAt?: string;
};
type CampaignLifecycleEventRecord = {
  eventId: string;
  lifecycleId: string;
  workspaceId: string;
  fromState: CampaignLifecycleState | null;
  toState: CampaignLifecycleState;
  actorType: "user" | "system";
  actorUserId?: string;
  note?: string;
  canonicalSha256: string;
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

const SENSITIVE_AUDIT_KEY = /(?:password|access[_-]?token|refresh[_-]?token|api[_-]?key|secret|authorization|cookie)/i;

function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
    key,
    SENSITIVE_AUDIT_KEY.test(key) ? "[redacted]" : redactAuditValue(nested),
  ]));
}

function assertAuditPayloadSafe(payload: JsonRecord): void {
  const redacted = redactAuditValue(payload);
  if (sha256Json(payload) !== sha256Json(redacted)) {
    throw new Error("Audit payload cannot contain secret or credential fields.");
  }
}

function assertSafeGovernance(value: JsonRecord): void {
  if (value.globalMarketValidated === true) {
    throw new Error("Persistence cannot store a globally market-validated context or recommendation.");
  }
  const governance = value.governance;
  if (!governance || typeof governance !== "object") return;
  const governanceRecord = governance as JsonRecord;
  for (const key of ["externalActionsAllowed", "budgetSpendAllowed", "canMutateCdks", "canChangeCanonicalBlueprint"]) {
    if (governanceRecord[key] === true) {
      throw new Error(`Unsafe governance flag cannot be persisted: ${key}.`);
    }
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
      apply(STAGING_TEST_RUNS_MIGRATION_ID, STAGING_TEST_RUNS_MIGRATION_SQL);
    apply(KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_ID, KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_SQL);
    apply(DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_ID, DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_SQL);
    apply(CAMPAIGN_LIFECYCLE_MIGRATION_ID, CAMPAIGN_LIFECYCLE_MIGRATION_SQL);

}

export function createRepositories(database: DatabaseSync) {
  const createWorkspace = database.prepare("INSERT INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, ?, ?)");
  const getWorkspace = database.prepare("SELECT workspace_id, name, status, created_at FROM workspaces WHERE workspace_id = ?");
  const createMembership = database.prepare("INSERT INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?)");
  const getMembership = database.prepare("SELECT workspace_id, user_id, role, created_at FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?");
  const createBrief = database.prepare("INSERT INTO client_briefs (brief_id, workspace_id, market, industry, locale, currency, version, status, brief_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getBrief = database.prepare("SELECT * FROM client_briefs WHERE brief_id = ? AND version = ?");
  const createSubmission = database.prepare("INSERT INTO wizard_submissions (submission_id, brief_id, brief_version, workspace_id, input_json, source, user_confirmed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const createBlueprint = database.prepare("INSERT INTO canonical_blueprints (blueprint_id, workspace_id, current_version, canonical_sha256, generation_mode, external_actions_allowed, budget_spend_allowed, blueprint_json, created_at) VALUES (?, ?, ?, ?, 'blueprint_only', 0, 0, ?, ?)");
  const createBlueprintVersion = database.prepare("INSERT INTO blueprint_versions (blueprint_id, version, canonical_sha256, blueprint_json, created_at) VALUES (?, ?, ?, ?, ?)");
  const getBlueprint = database.prepare("SELECT * FROM canonical_blueprints WHERE blueprint_id = ?");
  const createSource = database.prepare("INSERT OR IGNORE INTO source_records (source_id, publisher, source_url, source_type, market, industry, language, license_status, current_version, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getSource = database.prepare("SELECT * FROM source_records WHERE source_id = ?");
  const createSourceVersion = database.prepare("INSERT OR IGNORE INTO source_versions (source_id, version, observed_at, freshness_policy, limitations_json, source_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const getSourceVersion = database.prepare("SELECT * FROM source_versions WHERE source_id = ? AND version = ?");
  const createProfile = database.prepare("INSERT OR IGNORE INTO industry_profiles (profile_id, version, industry_key, branch, status, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const createSnapshot = database.prepare("INSERT INTO knowledge_snapshots (snapshot_id, workspace_id, market, industry, locale, currency, captured_at, freshness_status, confidence, source_ids_json, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getSnapshot = database.prepare("SELECT * FROM knowledge_snapshots WHERE workspace_id = ? AND snapshot_id = ?");
  const createSnapshotVersion = database.prepare("INSERT OR IGNORE INTO knowledge_snapshot_versions (snapshot_id, revision, snapshot_sha256, source_manifest_sha256, captured_at, freshness_status, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const getSnapshotVersion = database.prepare("SELECT * FROM knowledge_snapshot_versions WHERE snapshot_id = ? AND revision = ?");
  const getSnapshotVersionByHash = database.prepare("SELECT * FROM knowledge_snapshot_versions WHERE snapshot_id = ? AND snapshot_sha256 = ?");
  const persistSnapshotVersion = (input: SnapshotVersionRecord) => {
    const existingRevision = getSnapshotVersion.get(input.snapshotId, input.revision) as Row | undefined;
    if (existingRevision && existingRevision.snapshot_sha256 !== input.snapshotSha256) {
      throw new Error("Snapshot revision already exists with a different SHA-256.");
    }
    const existingHash = getSnapshotVersionByHash.get(input.snapshotId, input.snapshotSha256) as Row | undefined;
    if (!existingRevision && existingHash) return existingHash;
    createSnapshotVersion.run(input.snapshotId, input.revision, input.snapshotSha256, input.sourceManifestSha256 ?? null, input.capturedAt, input.freshnessStatus, json(input.payload), input.createdAt ?? now());
    return getSnapshotVersion.get(input.snapshotId, input.revision) as Row;
  };
  const createFact = database.prepare("INSERT INTO market_facts (fact_id, snapshot_id, market, industry, status, value_json, source_ids_json, observed_at, fact_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createClaim = database.prepare("INSERT INTO claims (claim_id, workspace_id, market, industry, claim_type, status, evidence_ids_json, claim_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createPackage = database.prepare("INSERT INTO evidence_packages (package_id, workspace_id, market, industry, status, freshness_status, retrieval_strategy, package_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const attachPackageSnapshot = database.prepare("INSERT INTO evidence_package_snapshots (package_id, snapshot_id) VALUES (?, ?)");
  const createEvidenceLink = database.prepare("INSERT INTO evidence_links (evidence_id, package_id, source_id, observed_at, limitations_json, evidence_json) VALUES (?, ?, ?, ?, ?, ?)");
  const createContext = database.prepare("INSERT INTO strategy_contexts (context_id, workspace_id, package_id, blueprint_id, market, industry, scoped_validation_status, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getContext = database.prepare("SELECT * FROM strategy_contexts WHERE workspace_id = ? AND context_id = ?");
  const createRecommendation = database.prepare("INSERT INTO strategy_recommendations (recommendation_id, workspace_id, context_id, blueprint_id, status, recommendation_json, created_at) VALUES (?, ?, ?, ?, 'advisory_only', ?, ?)");
  const getRecommendation = database.prepare("SELECT * FROM strategy_recommendations WHERE workspace_id = ? AND recommendation_id = ?");
  const createProviderAccount = database.prepare("INSERT OR IGNORE INTO provider_accounts (account_id, workspace_id, provider, external_account_ref, ownership_status, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const getProviderAccount = database.prepare("SELECT * FROM provider_accounts WHERE account_id = ?");
  const createProviderConnection = database.prepare("INSERT OR IGNORE INTO provider_connections (connection_id, account_id, connection_status, read_only, secret_ref, granted_scopes_json, last_verified_at, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)");
  const getProviderConnection = database.prepare("SELECT * FROM provider_connections WHERE connection_id = ?");
  const createProviderScope = database.prepare("INSERT OR IGNORE INTO provider_scopes (connection_id, scope_name, permission_kind) VALUES (?, ?, 'read')");
  const createCollection = database.prepare("INSERT OR IGNORE INTO provider_collections (collection_id, connection_id, market, industry, period_start, period_end, collection_status, collection_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getCollection = database.prepare("SELECT * FROM provider_collections WHERE collection_id = ?");
  const createDeferredSource = database.prepare("INSERT OR IGNORE INTO deferred_sources (deferred_source_id, workspace_id, provider, external_account_ref, status, reason, retry_gate, merge_policy, excluded_from_packages, market_validated, last_attempt_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)");
  const getDeferredSource = database.prepare("SELECT * FROM deferred_sources WHERE workspace_id = ? AND provider = ? AND external_account_ref = ?");
  const createSyncRun = database.prepare("INSERT INTO sync_runs (sync_run_id, connection_id, status, started_at, finished_at, rows_seen, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const createCursor = database.prepare("INSERT INTO sync_cursors (connection_id, cursor_key, cursor_value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(connection_id, cursor_key) DO UPDATE SET cursor_value = excluded.cursor_value, updated_at = excluded.updated_at");
  const createApproval = database.prepare("INSERT INTO approval_events (approval_id, workspace_id, object_type, object_id, decision, actor_user_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const createAudit = database.prepare("INSERT OR IGNORE INTO audit_events (audit_event_id, workspace_id, event_type, object_type, object_id, actor_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const getAudit = database.prepare("SELECT * FROM audit_events WHERE audit_event_id = ?");
  const listAudit = database.prepare("SELECT * FROM audit_events WHERE workspace_id = ? ORDER BY created_at ASC, audit_event_id ASC");
  const createCampaignLifecycle = database.prepare("INSERT INTO campaign_lifecycles (lifecycle_id, workspace_id, blueprint_id, canonical_sha256, state, generation_mode, external_actions_allowed, budget_spend_allowed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'blueprint_only', 0, 0, ?, ?)");
  const getCampaignLifecycle = database.prepare("SELECT * FROM campaign_lifecycles WHERE workspace_id = ? AND lifecycle_id = ?");
  const getCampaignLifecycleByBlueprint = database.prepare("SELECT * FROM campaign_lifecycles WHERE workspace_id = ? AND blueprint_id = ?");
  const updateCampaignLifecycle = database.prepare("UPDATE campaign_lifecycles SET state = ?, updated_at = ? WHERE workspace_id = ? AND lifecycle_id = ?");
  const createCampaignLifecycleEvent = database.prepare("INSERT INTO campaign_lifecycle_events (event_id, lifecycle_id, workspace_id, from_state, to_state, actor_type, actor_user_id, note, canonical_sha256, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getCampaignLifecycleEvent = database.prepare("SELECT * FROM campaign_lifecycle_events WHERE event_id = ?");
  const listCampaignLifecycleEvents = database.prepare("SELECT * FROM campaign_lifecycle_events WHERE workspace_id = ? AND lifecycle_id = ? ORDER BY created_at ASC, event_id ASC");
  const createStagingRun = database.prepare("INSERT INTO staging_runs (staging_run_id, workspace_id, scenario_id, blueprint_id, context_id, recommendation_id, status, run_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getStagingRun = database.prepare("SELECT * FROM staging_runs WHERE workspace_id = ? AND scenario_id = ?");
  const createStagingTestRun = database.prepare("INSERT INTO staging_test_runs (test_run_id, workspace_id, suite, seed, variants_per_case, total_runs, status, report_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const getLatestStagingTestRun = database.prepare("SELECT * FROM staging_test_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1");
  const getDriveArtifact = database.prepare("SELECT * FROM drive_evidence_artifacts WHERE workspace_id = ? AND artifact_id = ?");
  const getDriveArtifactByHash = database.prepare("SELECT * FROM drive_evidence_artifacts WHERE workspace_id = ? AND source_sha256 = ?");
  const createDriveArtifact = database.prepare("INSERT INTO drive_evidence_artifacts (artifact_id, workspace_id, source_ref, source_sha256, data_class, scope_status, market, industry, locale, currency, period_start, period_end, confidence, raw_rows_omitted, raw_values_omitted, market_validated, artifact_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?)");

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
      get(workspaceId: string, userId: string) {
        return getMembership.get(workspaceId, userId) as Row | undefined;
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
        const existing = getBlueprint.get(input.blueprintId) as Row | undefined;
        if (existing) {
          if (existing.workspace_id !== input.workspaceId || existing.canonical_sha256 !== canonicalSha256) {
            throw new Error("Canonical Blueprint already exists with different content or workspace.");
          }
          return existing;
        }
        const createdAt = input.createdAt ?? now();
        createBlueprint.run(input.blueprintId, input.workspaceId, input.version, canonicalSha256, json(input.blueprint), createdAt);
        createBlueprintVersion.run(input.blueprintId, input.version, canonicalSha256, json(input.blueprint), createdAt);
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
        const existingSource = getSource.get(input.sourceId) as Row | undefined;
        if (existingSource) {
          const expectedSource = {
            publisher: input.publisher,
            sourceUrl: input.sourceUrl,
            sourceType: input.sourceType,
            market: input.market ?? null,
            industry: input.industry ?? null,
            language: input.language ?? null,
            licenseStatus: input.licenseStatus,
            currentVersion: input.version,
            enabled: input.enabled === false ? 0 : 1,
          };
          const actualSource = {
            publisher: existingSource.publisher,
            sourceUrl: existingSource.source_url,
            sourceType: existingSource.source_type,
            market: existingSource.market,
            industry: existingSource.industry,
            language: existingSource.language,
            licenseStatus: existingSource.license_status,
            currentVersion: existingSource.current_version,
            enabled: existingSource.enabled,
          };
          if (sha256Json(actualSource) !== sha256Json(expectedSource)) throw new Error("Source record already exists with different content.");
        } else {
          createSource.run(input.sourceId, input.publisher, input.sourceUrl, input.sourceType, input.market ?? null, input.industry ?? null, input.language ?? null, input.licenseStatus, input.version, input.enabled === false ? 0 : 1, now());
        }
        const existingVersion = getSourceVersion.get(input.sourceId, input.version) as Row | undefined;
        if (existingVersion) {
          const expectedVersion = { observedAt: input.observedAt, freshnessPolicy: input.freshnessPolicy, limitations: input.limitations, source: input };
          const actualVersion = {
            observedAt: existingVersion.observed_at,
            freshnessPolicy: existingVersion.freshness_policy,
            limitations: parseJson<string[]>(existingVersion.limitations_json),
            source: parseJson<SourceRecord>(existingVersion.source_json),
          };
          if (sha256Json(actualVersion) !== sha256Json(expectedVersion)) throw new Error("Source version already exists with different content.");
        } else {
          createSourceVersion.run(input.sourceId, input.version, input.observedAt, input.freshnessPolicy, json(input.limitations), json(input), now());
        }
      },
      createIndustryProfile(profile: JsonRecord & { profileId: string; version: string; industryKey: string; branch: string; status: string }) {
        createProfile.run(profile.profileId, profile.version, profile.industryKey, profile.branch, profile.status, json(profile), now());
      },
    },
    knowledge: {
      createSnapshot(input: SnapshotRecord) {
        const createdAt = input.createdAt ?? now();
        const existing = getSnapshot.get(input.workspaceId, input.snapshotId) as Row | undefined;
        if (existing) {
          const existingSnapshot = parseJson<JsonRecord>(existing.snapshot_json);
          if (sha256Json(existingSnapshot) !== sha256Json(input.snapshot)) {
            throw new Error("Knowledge snapshot already exists with different content.");
          }
          persistSnapshotVersion({
            snapshotId: input.snapshotId,
            revision: 1,
            snapshotSha256: sha256Json(input.snapshot),
            sourceManifestSha256: sha256Json([...input.sourceIds].sort()),
            capturedAt: input.capturedAt,
            freshnessStatus: input.freshnessStatus,
            payload: input.snapshot,
            createdAt,
          });
          return existing;
        }
        createSnapshot.run(input.snapshotId, input.workspaceId, input.market, input.industry, input.locale, input.currency, input.capturedAt, input.freshnessStatus, input.confidence, json(input.sourceIds), json(input.snapshot), createdAt);
        persistSnapshotVersion({
          snapshotId: input.snapshotId,
          revision: 1,
          snapshotSha256: sha256Json(input.snapshot),
          sourceManifestSha256: sha256Json([...input.sourceIds].sort()),
          capturedAt: input.capturedAt,
          freshnessStatus: input.freshnessStatus,
          payload: input.snapshot,
          createdAt,
        });
        const row = getSnapshot.get(input.workspaceId, input.snapshotId) as Row;
        return row;
      },
      createSnapshotVersion(input: SnapshotVersionRecord) {
        return persistSnapshotVersion(input);
      },
      getSnapshotVersion(snapshotId: string, revision: number): (Row & { payload: JsonRecord }) | undefined {
        const row = getSnapshotVersion.get(snapshotId, revision) as Row | undefined;
        return row ? { ...row, payload: parseJson<JsonRecord>(row.payload_json) } : undefined;
      },
      getSnapshot(workspaceId: string, snapshotId: string): (Row & {
        sourceIds: string[];
        snapshot: JsonRecord;
        captured_at: string;
        freshness_status: "fresh" | "stale" | "expired" | "missing";
      }) | undefined {
        const row = getSnapshot.get(workspaceId, snapshotId) as Row | undefined;
        return row ? {
          ...row,
          sourceIds: parseJson<string[]>(row.source_ids_json),
          snapshot: parseJson<JsonRecord>(row.snapshot_json),
          captured_at: String(row.captured_at),
          freshness_status: String(row.freshness_status) as "fresh" | "stale" | "expired" | "missing",
        } : undefined;
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
        assertSafeGovernance(input.context);
        createContext.run(input.contextId, input.workspaceId, input.packageId, input.blueprintId, input.market, input.industry, input.scopedValidationStatus, json(input.context), input.createdAt ?? now());
      },
      getContext(workspaceId: string, contextId: string): (Row & {
        context: JsonRecord;
        package_id: string;
        blueprint_id: string;
        market: string;
        industry: string;
      }) | undefined {
        const row = getContext.get(workspaceId, contextId) as Row | undefined;
        return row ? {
          ...row,
          context: parseJson<JsonRecord>(row.context_json),
          package_id: String(row.package_id),
          blueprint_id: String(row.blueprint_id),
          market: String(row.market),
          industry: String(row.industry),
        } : undefined;
      },
      createRecommendation(input: StrategyRecommendationRecord) {
        assertSafeGovernance(input.recommendation);
        createRecommendation.run(input.recommendationId, input.workspaceId, input.contextId, input.blueprintId, json(input.recommendation), input.createdAt ?? now());
      },
      getRecommendation(workspaceId: string, recommendationId: string): (Row & {
        recommendation: JsonRecord;
        context_id: string;
        blueprint_id: string;
      }) | undefined {
        const row = getRecommendation.get(workspaceId, recommendationId) as Row | undefined;
        return row ? {
          ...row,
          recommendation: parseJson<JsonRecord>(row.recommendation_json),
          context_id: String(row.context_id),
          blueprint_id: String(row.blueprint_id),
        } : undefined;
      },
    },
    deferredSources: {
      create(input: DeferredSourceRecord) {
        assertSafeReference(input.externalAccountRef);
        const existing = getDeferredSource.get(input.workspaceId, input.provider, input.externalAccountRef) as Row | undefined;
        if (existing) return existing;
        createDeferredSource.run(input.deferredSourceId, input.workspaceId, input.provider, input.externalAccountRef, input.status, input.reason, input.retryGate, input.mergePolicy, input.lastAttemptAt ?? null, input.createdAt ?? now());
        return getDeferredSource.get(input.workspaceId, input.provider, input.externalAccountRef) as Row;
      },
      get(workspaceId: string, provider: DeferredSourceRecord["provider"], externalAccountRef: string) {
        return getDeferredSource.get(workspaceId, provider, externalAccountRef) as Row | undefined;
      },
    },
    providers: {
      createAccount(input: ProviderAccountRecord) {
        const existing = getProviderAccount.get(input.accountId) as Row | undefined;
        if (existing) {
          const actual = {
            workspaceId: existing.workspace_id,
            provider: existing.provider,
            externalAccountRef: existing.external_account_ref,
            ownershipStatus: existing.ownership_status,
          };
          const expected = {
            workspaceId: input.workspaceId,
            provider: input.provider,
            externalAccountRef: input.externalAccountRef,
            ownershipStatus: input.ownershipStatus,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Provider account already exists with different content.");
          return;
        }
        createProviderAccount.run(input.accountId, input.workspaceId, input.provider, input.externalAccountRef, input.ownershipStatus, now());
      },
      createConnection(input: ProviderConnectionRecord) {
        assertSafeReference(input.secretRef);
        if (input.connectionStatus === "write_enabled") throw new Error("Write-enabled provider connections are outside Database Foundation v1.");
        const existing = getProviderConnection.get(input.connectionId) as Row | undefined;
        if (existing) {
          const actual = {
            accountId: existing.account_id,
            connectionStatus: existing.connection_status,
            readOnly: existing.read_only,
            secretRef: existing.secret_ref,
            grantedScopes: parseJson<string[]>(existing.granted_scopes_json),
          };
          const expected = {
            accountId: input.accountId,
            connectionStatus: input.connectionStatus,
            readOnly: 1,
            secretRef: input.secretRef ?? null,
            grantedScopes: input.grantedScopes,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Provider connection already exists with different content.");
        } else {
          createProviderConnection.run(input.connectionId, input.accountId, input.connectionStatus, input.secretRef ?? null, json(input.grantedScopes), input.lastVerifiedAt ?? null, now());
        }
        for (const scope of input.grantedScopes) createProviderScope.run(input.connectionId, scope);
      },
      createCollection(input: { collectionId: string; connectionId: string; market?: string; industry?: string; periodStart?: string; periodEnd?: string; status: string; collection: JsonRecord }) {
        const existing = getCollection.get(input.collectionId) as Row | undefined;
        if (existing) {
          const actual = {
            connectionId: existing.connection_id,
            market: existing.market,
            industry: existing.industry,
            periodStart: existing.period_start,
            periodEnd: existing.period_end,
            status: existing.collection_status,
            collection: parseJson<JsonRecord>(existing.collection_json),
          };
          const expected = {
            connectionId: input.connectionId,
            market: input.market ?? null,
            industry: input.industry ?? null,
            periodStart: input.periodStart ?? null,
            periodEnd: input.periodEnd ?? null,
            status: input.status,
            collection: input.collection,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Provider collection already exists with different content.");
          return;
        }
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
    testing: {
      createSuiteRun(input: { testRunId: string; workspaceId: string; suite: "wizard-fixtures-v1"; seed: number; variantsPerCase: number; totalRuns: number; status: "completed" | "failed"; report: JsonRecord; createdAt?: string }) {
        createStagingTestRun.run(input.testRunId, input.workspaceId, input.suite, input.seed, input.variantsPerCase, input.totalRuns, input.status, json(input.report), input.createdAt ?? now());
      },
      getLatestSuiteRun(workspaceId: string) {
        const row = getLatestStagingTestRun.get(workspaceId) as Row | undefined;
        if (!row) return undefined;
        return {
          testRunId: String(row.test_run_id),
          workspaceId: String(row.workspace_id),
          suite: String(row.suite),
          seed: Number(row.seed),
          variantsPerCase: Number(row.variants_per_case),
          totalRuns: Number(row.total_runs),
          status: String(row.status) as "completed" | "failed",
          createdAt: String(row.created_at),
          report: parseJson<JsonRecord>(row.report_json),
        };
      },
    },
    driveEvidence: {
      createArtifact(input: DriveEvidenceArtifactRecord) {
        assertSafeGovernance(input.artifact);
        if (input.artifact.rows !== undefined && Array.isArray(input.artifact.rows) && input.artifact.rows.length > 0) {
          throw new Error("Drive evidence artifacts cannot persist raw rows.");
        }
        const existingById = getDriveArtifact.get(input.workspaceId, input.artifactId) as Row | undefined;
        const existingByHash = getDriveArtifactByHash.get(input.workspaceId, input.sourceSha256) as Row | undefined;
        const existing = existingById ?? existingByHash;
        if (existing) {
          const actual = {
            artifactId: existing.artifact_id,
            workspaceId: existing.workspace_id,
            sourceRef: existing.source_ref,
            sourceSha256: existing.source_sha256,
            dataClass: existing.data_class,
            scopeStatus: existing.scope_status,
            market: existing.market,
            industry: existing.industry,
            locale: existing.locale,
            currency: existing.currency,
            periodStart: existing.period_start,
            periodEnd: existing.period_end,
            confidence: existing.confidence,
            artifact: parseJson<JsonRecord>(existing.artifact_json),
          };
          const expected = {
            artifactId: existingById ? input.artifactId : actual.artifactId,
            workspaceId: input.workspaceId,
            sourceRef: input.sourceRef,
            sourceSha256: input.sourceSha256,
            dataClass: input.dataClass,
            scopeStatus: input.scopeStatus,
            market: input.market ?? null,
            industry: input.industry ?? null,
            locale: input.locale ?? null,
            currency: input.currency ?? null,
            periodStart: input.periodStart ?? null,
            periodEnd: input.periodEnd ?? null,
            confidence: input.confidence,
            artifact: input.artifact,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Drive evidence artifact already exists with different content.");
          return existing;
        }
        createDriveArtifact.run(input.artifactId, input.workspaceId, input.sourceRef, input.sourceSha256, input.dataClass, input.scopeStatus, input.market ?? null, input.industry ?? null, input.locale ?? null, input.currency ?? null, input.periodStart ?? null, input.periodEnd ?? null, input.confidence, json(input.artifact), input.createdAt ?? now());
        return getDriveArtifact.get(input.workspaceId, input.artifactId) as Row;
      },
      getArtifact(workspaceId: string, artifactId: string) {
        const row = getDriveArtifact.get(workspaceId, artifactId) as Row | undefined;
        return row ? { ...row, artifact: parseJson<JsonRecord>(row.artifact_json) } : undefined;
      },
    },
    governance: {
      createApproval(input: ApprovalEventRecord) {
        createApproval.run(input.approvalId, input.workspaceId, input.objectType, input.objectId, input.decision, input.actorUserId ?? null, input.note ?? null, now());
      },
      createAuditEvent(input: AuditEventRecord) {
        assertAuditPayloadSafe(input.payload);
        const existing = getAudit.get(input.auditEventId) as Row | undefined;
        if (existing) {
          const actual = {
            workspaceId: existing.workspace_id,
            eventType: existing.event_type,
            objectType: existing.object_type,
            objectId: existing.object_id,
            actorType: existing.actor_type,
            payload: parseJson<JsonRecord>(existing.payload_json),
          };
          const expected = {
            workspaceId: input.workspaceId,
            eventType: input.eventType,
            objectType: input.objectType,
            objectId: input.objectId,
            actorType: input.actorType,
            payload: input.payload,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Audit event already exists with different content.");
          return;
        }
        createAudit.run(input.auditEventId, input.workspaceId, input.eventType, input.objectType, input.objectId, input.actorType, json(input.payload), now());
      },
      listEvents(workspaceId: string) {
        return (listAudit.all(workspaceId) as Row[]).map((row) => ({
          audit_event_id: String(row.audit_event_id),
          workspace_id: String(row.workspace_id),
          event_type: String(row.event_type),
          object_type: String(row.object_type),
          object_id: String(row.object_id),
          actor_type: String(row.actor_type),
          payload: redactAuditValue(parseJson<JsonRecord>(row.payload_json)) as JsonRecord,
          created_at: String(row.created_at),
        }));
      },
    },
    campaignLifecycle: {
      create(input: CampaignLifecycleRecord) {
        const state = input.state ?? "draft";
        const existing = (getCampaignLifecycleByBlueprint.get(input.workspaceId, input.blueprintId) ?? getCampaignLifecycle.get(input.workspaceId, input.lifecycleId)) as Row | undefined;
        if (existing) {
          if (existing.lifecycle_id !== input.lifecycleId || existing.canonical_sha256 !== input.canonicalSha256) {
            throw new Error("Campaign lifecycle already exists with different identity or Canonical Blueprint hash.");
          }
          return existing;
        }
        const createdAt = input.createdAt ?? now();
        createCampaignLifecycle.run(input.lifecycleId, input.workspaceId, input.blueprintId, input.canonicalSha256, state, createdAt, createdAt);
        const eventId = `${input.lifecycleId}:created:${state}`;
        createCampaignLifecycleEvent.run(eventId, input.lifecycleId, input.workspaceId, null, state, "system", null, "Lifecycle created from an immutable Canonical Blueprint.", input.canonicalSha256, createdAt);
        return getCampaignLifecycle.get(input.workspaceId, input.lifecycleId) as Row;
      },
      get(workspaceId: string, lifecycleId: string) {
        return getCampaignLifecycle.get(workspaceId, lifecycleId) as Row | undefined;
      },
      getByBlueprint(workspaceId: string, blueprintId: string) {
        return getCampaignLifecycleByBlueprint.get(workspaceId, blueprintId) as Row | undefined;
      },
      transition(input: CampaignLifecycleEventRecord) {
        const existingEvent = getCampaignLifecycleEvent.get(input.eventId) as Row | undefined;
        if (existingEvent) {
          const actual = {
            lifecycleId: existingEvent.lifecycle_id,
            workspaceId: existingEvent.workspace_id,
            fromState: existingEvent.from_state,
            toState: existingEvent.to_state,
            actorType: existingEvent.actor_type,
            actorUserId: existingEvent.actor_user_id,
            note: existingEvent.note,
            canonicalSha256: existingEvent.canonical_sha256,
          };
          const expected = {
            lifecycleId: input.lifecycleId,
            workspaceId: input.workspaceId,
            fromState: input.fromState,
            toState: input.toState,
            actorType: input.actorType,
            actorUserId: input.actorUserId ?? null,
            note: input.note ?? null,
            canonicalSha256: input.canonicalSha256,
          };
          if (sha256Json(actual) !== sha256Json(expected)) throw new Error("Lifecycle event already exists with different content.");
          return getCampaignLifecycle.get(input.workspaceId, input.lifecycleId) as Row;
        }
        const lifecycle = getCampaignLifecycle.get(input.workspaceId, input.lifecycleId) as Row | undefined;
        if (!lifecycle) throw new Error("Campaign lifecycle not found.");
        if (lifecycle.canonical_sha256 !== input.canonicalSha256) throw new Error("Canonical Blueprint hash mismatch.");
        if (lifecycle.state !== input.fromState) throw new Error(`Lifecycle transition expected ${input.fromState} but is ${lifecycle.state}.`);
        if (input.actorType === "user" && !input.actorUserId) throw new Error("Human approval transitions require actor_user_id.");
        if (input.toState === "approved" && (input.actorType !== "user" || !input.actorUserId)) throw new Error("Only an identified human actor may approve a campaign lifecycle.");
        const allowed = (input.fromState === "draft" && input.toState === "review")
          || (input.fromState === "review" && (input.toState === "approved" || input.toState === "rejected"))
          || (input.fromState === "rejected" && input.toState === "draft");
        if (!allowed) throw new Error(`Invalid campaign lifecycle transition: ${input.fromState} -> ${input.toState}.`);
        const createdAt = now();
        updateCampaignLifecycle.run(input.toState, createdAt, input.workspaceId, input.lifecycleId);
        createCampaignLifecycleEvent.run(input.eventId, input.lifecycleId, input.workspaceId, input.fromState, input.toState, input.actorType, input.actorUserId ?? null, input.note ?? null, input.canonicalSha256, createdAt);
        return getCampaignLifecycle.get(input.workspaceId, input.lifecycleId) as Row;
      },
      listEvents(workspaceId: string, lifecycleId: string) {
        return listCampaignLifecycleEvents.all(workspaceId, lifecycleId) as Row[];
      },
    },
    rawDatabase: database,
  };
}

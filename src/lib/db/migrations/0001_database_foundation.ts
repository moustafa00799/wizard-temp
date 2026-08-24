export const DATABASE_FOUNDATION_MIGRATION_ID = "0001_database_foundation" as const;

export const DATABASE_FOUNDATION_MIGRATION_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'reviewer', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS client_briefs (
  brief_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  market TEXT,
  industry TEXT,
  locale TEXT,
  currency TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'archived')),
  brief_json TEXT NOT NULL CHECK (json_valid(brief_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (brief_id, version),
  UNIQUE (workspace_id, brief_id, version)
);

CREATE TABLE IF NOT EXISTS wizard_submissions (
  submission_id TEXT PRIMARY KEY,
  brief_id TEXT NOT NULL,
  brief_version INTEGER NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  input_json TEXT NOT NULL CHECK (json_valid(input_json)),
  source TEXT NOT NULL CHECK (source IN ('wizard', 'import', 'fixture')),
  user_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (user_confirmed IN (0, 1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (brief_id, brief_version) REFERENCES client_briefs(brief_id, version) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS canonical_blueprints (
  blueprint_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  current_version INTEGER NOT NULL CHECK (current_version > 0),
  canonical_sha256 TEXT NOT NULL,
  generation_mode TEXT NOT NULL CHECK (generation_mode = 'blueprint_only'),
  external_actions_allowed INTEGER NOT NULL DEFAULT 0 CHECK (external_actions_allowed = 0),
  budget_spend_allowed INTEGER NOT NULL DEFAULT 0 CHECK (budget_spend_allowed = 0),
  blueprint_json TEXT NOT NULL CHECK (json_valid(blueprint_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, blueprint_id)
);

CREATE TABLE IF NOT EXISTS blueprint_versions (
  blueprint_id TEXT NOT NULL REFERENCES canonical_blueprints(blueprint_id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version > 0),
  canonical_sha256 TEXT NOT NULL,
  blueprint_json TEXT NOT NULL CHECK (json_valid(blueprint_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (blueprint_id, version)
);

CREATE TABLE IF NOT EXISTS source_records (
  source_id TEXT PRIMARY KEY,
  publisher TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('official_api', 'official_document', 'public_library', 'client_data', 'licensed_report')),
  market TEXT,
  industry TEXT,
  language TEXT,
  license_status TEXT NOT NULL CHECK (license_status IN ('approved', 'restricted', 'unknown')),
  current_version TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_versions (
  source_id TEXT NOT NULL REFERENCES source_records(source_id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  freshness_policy TEXT NOT NULL CHECK (freshness_policy IN ('daily', 'weekly', 'monthly', 'on_demand')),
  limitations_json TEXT NOT NULL CHECK (json_valid(limitations_json)),
  source_json TEXT NOT NULL CHECK (json_valid(source_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (source_id, version)
);

CREATE TABLE IF NOT EXISTS industry_profiles (
  profile_id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  industry_key TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('matched', 'draft', 'unmatched', 'deprecated')),
  profile_json TEXT NOT NULL CHECK (json_valid(profile_json)),
  created_at TEXT NOT NULL,
  UNIQUE (industry_key, version)
);

CREATE TABLE IF NOT EXISTS knowledge_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  market TEXT NOT NULL,
  industry TEXT NOT NULL,
  locale TEXT NOT NULL,
  currency TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'expired', 'missing')),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source_ids_json TEXT NOT NULL CHECK (json_valid(source_ids_json)),
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, snapshot_id)
);

CREATE TABLE IF NOT EXISTS market_facts (
  fact_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES knowledge_snapshots(snapshot_id) ON DELETE RESTRICT,
  market TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('evidence_backed', 'limited_external_evidence', 'directional', 'unavailable', 'rejected')),
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  source_ids_json TEXT NOT NULL CHECK (json_valid(source_ids_json)),
  observed_at TEXT,
  fact_json TEXT NOT NULL CHECK (json_valid(fact_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  market TEXT NOT NULL,
  industry TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('fact', 'inference', 'directional_hypothesis', 'recommendation')),
  status TEXT NOT NULL CHECK (status IN ('evidence_backed', 'directional', 'unavailable', 'rejected')),
  evidence_ids_json TEXT NOT NULL CHECK (json_valid(evidence_ids_json)),
  claim_json TEXT NOT NULL CHECK (json_valid(claim_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_packages (
  package_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  market TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ready', 'limited', 'missing', 'rejected')),
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'expired', 'missing')),
  retrieval_strategy TEXT NOT NULL CHECK (retrieval_strategy IN ('deterministic_fixture', 'registry_lookup', 'manual_review')),
  package_json TEXT NOT NULL CHECK (json_valid(package_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, package_id)
);

CREATE TABLE IF NOT EXISTS evidence_package_snapshots (
  package_id TEXT NOT NULL REFERENCES evidence_packages(package_id) ON DELETE RESTRICT,
  snapshot_id TEXT NOT NULL REFERENCES knowledge_snapshots(snapshot_id) ON DELETE RESTRICT,
  PRIMARY KEY (package_id, snapshot_id)
);

CREATE TABLE IF NOT EXISTS evidence_links (
  evidence_id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES evidence_packages(package_id) ON DELETE RESTRICT,
  source_id TEXT NOT NULL REFERENCES source_records(source_id) ON DELETE RESTRICT,
  observed_at TEXT NOT NULL,
  limitations_json TEXT NOT NULL CHECK (json_valid(limitations_json)),
  evidence_json TEXT NOT NULL CHECK (json_valid(evidence_json))
);

CREATE TABLE IF NOT EXISTS strategy_contexts (
  context_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  package_id TEXT NOT NULL REFERENCES evidence_packages(package_id) ON DELETE RESTRICT,
  blueprint_id TEXT NOT NULL REFERENCES canonical_blueprints(blueprint_id) ON DELETE RESTRICT,
  market TEXT NOT NULL,
  industry TEXT NOT NULL,
  scoped_validation_status TEXT NOT NULL CHECK (scoped_validation_status IN ('market_validated', 'market_context_ready', 'partial', 'unavailable')),
  context_json TEXT NOT NULL CHECK (json_valid(context_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, context_id)
);

CREATE TABLE IF NOT EXISTS strategy_recommendations (
  recommendation_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  context_id TEXT NOT NULL REFERENCES strategy_contexts(context_id) ON DELETE RESTRICT,
  blueprint_id TEXT NOT NULL REFERENCES canonical_blueprints(blueprint_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status = 'advisory_only'),
  recommendation_json TEXT NOT NULL CHECK (json_valid(recommendation_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_accounts (
  account_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('meta', 'google_ads', 'tiktok_ads', 'ga4')),
  external_account_ref TEXT NOT NULL,
  ownership_status TEXT NOT NULL CHECK (ownership_status IN ('unverified', 'verified', 'revoked')),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, provider, external_account_ref)
);

CREATE TABLE IF NOT EXISTS provider_connections (
  connection_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES provider_accounts(account_id) ON DELETE RESTRICT,
  connection_status TEXT NOT NULL CHECK (connection_status IN ('unverified', 'verified', 'read_only_ready', 'syncing', 'partial', 'revoked', 'write_pending_approval', 'write_enabled')),
  read_only INTEGER NOT NULL DEFAULT 1 CHECK (read_only = 1),
  secret_ref TEXT,
  granted_scopes_json TEXT NOT NULL CHECK (json_valid(granted_scopes_json)),
  last_verified_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_scopes (
  connection_id TEXT NOT NULL REFERENCES provider_connections(connection_id) ON DELETE RESTRICT,
  scope_name TEXT NOT NULL,
  permission_kind TEXT NOT NULL CHECK (permission_kind = 'read'),
  PRIMARY KEY (connection_id, scope_name)
);

CREATE TABLE IF NOT EXISTS provider_collections (
  collection_id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES provider_connections(connection_id) ON DELETE RESTRICT,
  market TEXT,
  industry TEXT,
  period_start TEXT,
  period_end TEXT,
  collection_status TEXT NOT NULL CHECK (collection_status IN ('ready', 'partial', 'empty', 'missing', 'failed', 'unverified')),
  collection_json TEXT NOT NULL CHECK (json_valid(collection_json)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_runs (
  sync_run_id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES provider_connections(connection_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'partial', 'failed', 'cancelled')),
  started_at TEXT,
  finished_at TEXT,
  rows_seen INTEGER NOT NULL DEFAULT 0 CHECK (rows_seen >= 0),
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_cursors (
  connection_id TEXT NOT NULL REFERENCES provider_connections(connection_id) ON DELETE RESTRICT,
  cursor_key TEXT NOT NULL,
  cursor_value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (connection_id, cursor_key)
);

CREATE TABLE IF NOT EXISTS approval_events (
  approval_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  object_type TEXT NOT NULL CHECK (object_type IN ('brief', 'strategy_context', 'recommendation', 'blueprint', 'provider_write_permission')),
  object_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('pending', 'approved', 'rejected', 'revoked')),
  actor_user_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'connector', 'ai')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_briefs_workspace ON client_briefs(workspace_id, brief_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_scope ON knowledge_snapshots(workspace_id, market, industry, captured_at);
CREATE INDEX IF NOT EXISTS idx_facts_snapshot ON market_facts(snapshot_id, status);
CREATE INDEX IF NOT EXISTS idx_packages_scope ON evidence_packages(workspace_id, market, industry, status);
CREATE INDEX IF NOT EXISTS idx_strategy_context_scope ON strategy_contexts(workspace_id, market, industry);
CREATE INDEX IF NOT EXISTS idx_sync_runs_connection ON sync_runs(connection_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_object ON audit_events(workspace_id, object_type, object_id, created_at);
`;

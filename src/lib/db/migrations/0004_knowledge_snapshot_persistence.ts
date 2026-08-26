export const KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_ID = "0004_knowledge_snapshot_persistence" as const;

export const KNOWLEDGE_SNAPSHOT_PERSISTENCE_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_snapshot_versions (
  snapshot_id TEXT NOT NULL REFERENCES knowledge_snapshots(snapshot_id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision > 0),
  snapshot_sha256 TEXT NOT NULL CHECK (length(snapshot_sha256) = 64),
  source_manifest_sha256 TEXT CHECK (source_manifest_sha256 IS NULL OR length(source_manifest_sha256) = 64),
  captured_at TEXT NOT NULL,
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('fresh', 'stale', 'expired', 'missing')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, revision),
  UNIQUE (snapshot_id, snapshot_sha256)
);

CREATE TABLE IF NOT EXISTS deferred_sources (
  deferred_source_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('meta', 'google_ads', 'tiktok_ads', 'ga4')),
  external_account_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('deferred', 'unavailable', 'ready_for_retry', 'merged')),
  reason TEXT NOT NULL,
  retry_gate TEXT NOT NULL CHECK (retry_gate IN ('new_authorization', 'direct_user_access', 'manual_review')),
  merge_policy TEXT NOT NULL CHECK (merge_policy = 'merge_only_after_scope_and_hash_verification'),
  excluded_from_packages INTEGER NOT NULL DEFAULT 1 CHECK (excluded_from_packages = 1),
  market_validated INTEGER NOT NULL DEFAULT 0 CHECK (market_validated = 0),
  last_attempt_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, provider, external_account_ref)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_versions_hash ON knowledge_snapshot_versions(snapshot_sha256);
CREATE INDEX IF NOT EXISTS idx_deferred_sources_workspace ON deferred_sources(workspace_id, provider, status);
`;

export const DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_ID = "0005_drive_evidence_artifacts" as const;

export const DRIVE_EVIDENCE_ARTIFACTS_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS drive_evidence_artifacts (
  artifact_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  source_ref TEXT NOT NULL,
  source_sha256 TEXT NOT NULL CHECK (length(source_sha256) = 64),
  data_class TEXT NOT NULL CHECK (data_class IN ('ga4', 'ga4_ads_linked', 'search_console', 'keyword_planner', 'campaign_report', 'catalog_feed', 'store_product', 'sales_report', 'seller_profile')),
  scope_status TEXT NOT NULL CHECK (scope_status IN ('activity_and_market_user_confirmed_property_unverified', 'scope_unverified', 'catalog_identity_unverified', 'excluded_duplicate')),
  market TEXT CHECK (market IS NULL OR market IN ('EG', 'SA', 'AE', 'GCC')),
  industry TEXT,
  locale TEXT CHECK (locale IS NULL OR locale IN ('ar', 'en')),
  currency TEXT CHECK (currency IS NULL OR currency IN ('EGP', 'SAR', 'USD')),
  period_start TEXT,
  period_end TEXT,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  raw_rows_omitted INTEGER NOT NULL CHECK (raw_rows_omitted = 1),
  raw_values_omitted INTEGER NOT NULL CHECK (raw_values_omitted = 1),
  market_validated INTEGER NOT NULL DEFAULT 0 CHECK (market_validated = 0),
  artifact_json TEXT NOT NULL CHECK (json_valid(artifact_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, source_sha256)
);

CREATE INDEX IF NOT EXISTS idx_drive_evidence_artifacts_workspace ON drive_evidence_artifacts(workspace_id, data_class, created_at);
CREATE INDEX IF NOT EXISTS idx_drive_evidence_artifacts_scope ON drive_evidence_artifacts(market, industry, scope_status);
`;

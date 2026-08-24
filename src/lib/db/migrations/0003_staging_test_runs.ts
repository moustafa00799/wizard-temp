export const STAGING_TEST_RUNS_MIGRATION_ID = "0003_staging_test_runs" as const;

export const STAGING_TEST_RUNS_MIGRATION_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS staging_test_runs (
  test_run_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  suite TEXT NOT NULL CHECK (suite IN ('wizard-fixtures-v1')),
  seed INTEGER NOT NULL,
  variants_per_case INTEGER NOT NULL CHECK (variants_per_case BETWEEN 1 AND 10),
  total_runs INTEGER NOT NULL CHECK (total_runs >= 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  report_json TEXT NOT NULL CHECK (json_valid(report_json)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staging_test_runs_workspace ON staging_test_runs(workspace_id, created_at);
`;

export const PERSONAL_STAGING_MIGRATION_ID = "0002_personal_staging" as const;

export const PERSONAL_STAGING_MIGRATION_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS staging_runs (
  staging_run_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  scenario_id TEXT NOT NULL,
  blueprint_id TEXT NOT NULL REFERENCES canonical_blueprints(blueprint_id) ON DELETE RESTRICT,
  context_id TEXT NOT NULL REFERENCES strategy_contexts(context_id) ON DELETE RESTRICT,
  recommendation_id TEXT NOT NULL REFERENCES strategy_recommendations(recommendation_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  run_json TEXT NOT NULL CHECK (json_valid(run_json)),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_staging_runs_workspace ON staging_runs(workspace_id, created_at);
`;

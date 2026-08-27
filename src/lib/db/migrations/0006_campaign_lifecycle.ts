export const CAMPAIGN_LIFECYCLE_MIGRATION_ID = "0006_campaign_lifecycle";

export const CAMPAIGN_LIFECYCLE_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS campaign_lifecycles (
  lifecycle_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  blueprint_id TEXT NOT NULL REFERENCES canonical_blueprints(blueprint_id) ON DELETE RESTRICT,
  canonical_sha256 TEXT NOT NULL CHECK (length(canonical_sha256) = 64),
  state TEXT NOT NULL CHECK (state IN ('draft', 'review', 'approved', 'rejected')),
  generation_mode TEXT NOT NULL CHECK (generation_mode = 'blueprint_only'),
  external_actions_allowed INTEGER NOT NULL DEFAULT 0 CHECK (external_actions_allowed = 0),
  budget_spend_allowed INTEGER NOT NULL DEFAULT 0 CHECK (budget_spend_allowed = 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (workspace_id, blueprint_id)
);

CREATE TABLE IF NOT EXISTS campaign_lifecycle_events (
  event_id TEXT PRIMARY KEY,
  lifecycle_id TEXT NOT NULL REFERENCES campaign_lifecycles(lifecycle_id) ON DELETE RESTRICT,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE RESTRICT,
  from_state TEXT CHECK (from_state IS NULL OR from_state IN ('draft', 'review', 'approved', 'rejected')),
  to_state TEXT NOT NULL CHECK (to_state IN ('draft', 'review', 'approved', 'rejected')),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system')),
  actor_user_id TEXT,
  note TEXT,
  canonical_sha256 TEXT NOT NULL CHECK (length(canonical_sha256) = 64),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_lifecycles_workspace ON campaign_lifecycles(workspace_id, state, updated_at);
CREATE INDEX IF NOT EXISTS idx_campaign_lifecycle_events_lifecycle ON campaign_lifecycle_events(lifecycle_id, created_at);
`;

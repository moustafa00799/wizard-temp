import { NextResponse } from "next/server";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";

const REQUIRED_TABLES = [
  "schema_migrations",
  "workspaces",
  "workspace_memberships",
  "canonical_blueprints",
  "campaign_lifecycles",
  "campaign_lifecycle_events",
  "audit_events",
];

export async function GET() {
  try {
    const { database } = getRuntimeDatabaseState();
    const tableRows = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>;
    const tables = new Set(tableRows.map((row) => String(row.name)));
    const missingTables = REQUIRED_TABLES.filter((table) => !tables.has(table));
    const foreignKeys = Number((database.prepare("PRAGMA foreign_keys").get() as { foreign_keys?: number }).foreign_keys) === 1;
    const migrationCount = Number((database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number }).count);
    const databaseReady = missingTables.length === 0 && foreignKeys;
    const productionAuthConfigured = process.env.NODE_ENV !== "production"
      || (process.env.CDKS_AUTHORIZED_REVIEWER_IDS ?? "").split(",").some((value) => value.trim().length > 0);

    return NextResponse.json({
      status: databaseReady ? "ok" : "degraded",
      readiness: databaseReady && productionAuthConfigured ? "local_staging_ready" : "blocked",
      timestamp: new Date().toISOString(),
      version: "cdks-health-v1",
      database: {
        connected: true,
        foreignKeys,
        migrationCount,
        missingTables,
      },
      governance: {
        blueprintOnly: true,
        externalActionsAllowed: false,
        budgetSpendAllowed: false,
        marketValidated: false,
        productionAuthConfigured,
      },
      deployment: {
        localStagingOnly: true,
        productionReady: false,
        reason: "Authentication provider, managed persistence, backups, observability, and external connector write gates are not configured.",
      },
    }, { status: databaseReady ? 200 : 503 });
  } catch {
    return NextResponse.json({
      status: "unavailable",
      readiness: "blocked",
      governance: { blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false, marketValidated: false },
      deployment: { localStagingOnly: true, productionReady: false },
    }, { status: 503 });
  }
}

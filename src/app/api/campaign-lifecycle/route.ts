import { NextRequest, NextResponse } from "next/server";
import {
  assertAllowedCampaignTransition,
  assertSafeLifecycleReference,
  CampaignLifecycleActionSchema,
  lifecycleLabel,
} from "@/lib/campaign-lifecycle";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";

function serializeLifecycle(row: Record<string, unknown> | undefined) {
  if (!row) return null;
  return {
    lifecycleId: String(row.lifecycle_id),
    workspaceId: String(row.workspace_id),
    blueprintId: String(row.blueprint_id),
    canonicalSha256: String(row.canonical_sha256),
    state: String(row.state),
    stateLabel: lifecycleLabel(String(row.state) as Parameters<typeof lifecycleLabel>[0]),
    generationMode: String(row.generation_mode),
    externalActionsAllowed: Boolean(row.external_actions_allowed),
    budgetSpendAllowed: Boolean(row.budget_spend_allowed),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Invalid campaign lifecycle request.";
  return NextResponse.json({ status: "error", error: message }, { status });
}

function assertProductionReviewerGate(actorUserId: string | undefined): void {
  if (process.env.NODE_ENV !== "production") return;
  const configuredReviewers = (process.env.CDKS_AUTHORIZED_REVIEWER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configuredReviewers.length === 0) throw new Error("Human approval authentication is not configured for production.");
  if (!actorUserId || !configuredReviewers.includes(actorUserId)) throw new Error("Reviewer is not authorized for production approval.");
}

function assertWorkspaceExists(repositories: ReturnType<typeof getRuntimeDatabaseState>["repositories"], workspaceId: string): void {
  if (!repositories.workspaces.get(workspaceId)) throw new Error("Workspace was not found.");
}

function assertHumanWorkspaceRole(
  repositories: ReturnType<typeof getRuntimeDatabaseState>["repositories"],
  workspaceId: string,
  actorUserId: string | undefined,
): void {
  if (!actorUserId) throw new Error("Human lifecycle transitions require actor_user_id.");
  const membership = repositories.memberships.get(workspaceId, actorUserId);
  const role = membership ? String(membership.role) : "";
  if (!membership || !["owner", "admin", "reviewer"].includes(role)) {
    throw new Error("Reviewer is not authorized for this workspace.");
  }
}

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id");
  const lifecycleId = request.nextUrl.searchParams.get("lifecycle_id");
  const blueprintId = request.nextUrl.searchParams.get("blueprint_id");
  if (!workspaceId || (!lifecycleId && !blueprintId)) return errorResponse(new Error("workspace_id and lifecycle_id or blueprint_id are required."));

  try {
    assertSafeLifecycleReference(workspaceId, "workspace_id");
    const { repositories } = getRuntimeDatabaseState();
    const row = lifecycleId
      ? repositories.campaignLifecycle.get(workspaceId, assertSafeLifecycleReference(lifecycleId, "lifecycle_id"))
      : repositories.campaignLifecycle.getByBlueprint(workspaceId, assertSafeLifecycleReference(blueprintId as string, "blueprint_id"));
    const lifecycle = serializeLifecycle(row as Record<string, unknown> | undefined);
    const events = lifecycle
      ? repositories.campaignLifecycle.listEvents(workspaceId, lifecycle.lifecycleId).map((event) => ({
          eventId: String(event.event_id),
          fromState: event.from_state === null ? null : String(event.from_state),
          toState: String(event.to_state),
          actorType: String(event.actor_type),
          actorUserId: event.actor_user_id ? String(event.actor_user_id) : null,
          note: event.note ? String(event.note) : null,
          canonicalSha256: String(event.canonical_sha256),
          createdAt: String(event.created_at),
        }))
      : [];
    return NextResponse.json({ status: "success", lifecycle, events, policy: { blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = CampaignLifecycleActionSchema.parse(await request.json());
    assertSafeLifecycleReference(action.workspace_id, "workspace_id");
    assertSafeLifecycleReference(action.lifecycle_id, "lifecycle_id");
    if (action.action === "create") assertSafeLifecycleReference(action.blueprint_id, "blueprint_id");
    if (action.action === "transition") {
      assertSafeLifecycleReference(action.event_id, "event_id");
      if (action.actor_user_id) assertSafeLifecycleReference(action.actor_user_id, "actor_user_id");
      assertAllowedCampaignTransition(action.from_state, action.to_state);
      if (action.actor_type === "user") assertProductionReviewerGate(action.actor_user_id);
      if (action.to_state === "approved" && action.actor_type !== "user") throw new Error("Only an identified human actor may approve a campaign lifecycle.");
    }

    const { repositories } = getRuntimeDatabaseState();
    assertWorkspaceExists(repositories, action.workspace_id);
    if (action.action === "transition" && action.actor_type === "user") {
      assertHumanWorkspaceRole(repositories, action.workspace_id, action.actor_user_id);
    }
    if (action.action === "create") {
      const blueprint = repositories.blueprints.get(action.blueprint_id) as Record<string, unknown> | undefined;
      if (!blueprint || String(blueprint.workspace_id) !== action.workspace_id) return errorResponse(new Error("Canonical Blueprint was not found in the requested workspace."), 404);
      repositories.blueprints.assertUnchanged(action.blueprint_id, action.canonical_sha256);
      const lifecycle = repositories.campaignLifecycle.create({
        lifecycleId: action.lifecycle_id,
        workspaceId: action.workspace_id,
        blueprintId: action.blueprint_id,
        canonicalSha256: action.canonical_sha256,
      });
      repositories.governance.createAuditEvent({
        auditEventId: `${action.lifecycle_id}:created:audit`,
        workspaceId: action.workspace_id,
        eventType: "campaign_lifecycle_created",
        objectType: "campaign_lifecycle",
        objectId: action.lifecycle_id,
        actorType: "system",
        payload: { state: "draft", blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false },
      });
      return NextResponse.json({ status: "success", lifecycle: serializeLifecycle(lifecycle as Record<string, unknown>), events: repositories.campaignLifecycle.listEvents(action.workspace_id, action.lifecycle_id) });
    }

    const current = repositories.campaignLifecycle.get(action.workspace_id, action.lifecycle_id);
    if (!current) return errorResponse(new Error("Campaign lifecycle was not found."), 404);
    const blueprintId = String(current.blueprint_id);
    repositories.blueprints.assertUnchanged(blueprintId, action.canonical_sha256);
    const lifecycle = repositories.campaignLifecycle.transition({
      eventId: action.event_id,
      lifecycleId: action.lifecycle_id,
      workspaceId: action.workspace_id,
      fromState: action.from_state,
      toState: action.to_state,
      actorType: action.actor_type,
      actorUserId: action.actor_user_id,
      note: action.note,
      canonicalSha256: action.canonical_sha256,
    });
    repositories.governance.createAuditEvent({
      auditEventId: `${action.event_id}:audit`,
      workspaceId: action.workspace_id,
      eventType: `campaign_lifecycle_${action.to_state}`,
      objectType: "campaign_lifecycle",
      objectId: action.lifecycle_id,
      actorType: action.actor_type,
      payload: { fromState: action.from_state, toState: action.to_state, blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false },
    });
    return NextResponse.json({ status: "success", lifecycle: serializeLifecycle(lifecycle as Record<string, unknown>), events: repositories.campaignLifecycle.listEvents(action.workspace_id, action.lifecycle_id) });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { assertSafeLifecycleReference } from "@/lib/campaign-lifecycle";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Invalid audit request.";
  return NextResponse.json({ status: "error", error: message }, { status });
}

function assertAuditReader(
  repositories: ReturnType<typeof getRuntimeDatabaseState>["repositories"],
  workspaceId: string,
  actorUserId: string | null,
): void {
  if (!actorUserId) {
    if (process.env.NODE_ENV === "production") throw new Error("Authenticated audit reader is required in production.");
    return;
  }
  assertSafeLifecycleReference(actorUserId, "actor_user_id");
  const membership = repositories.memberships.get(workspaceId, actorUserId);
  const role = membership ? String(membership.role) : "";
  if (!membership || !["owner", "admin", "reviewer", "analyst"].includes(role)) {
    throw new Error("Audit reader is not authorized for this workspace.");
  }
}

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace_id");
  const actorUserId = request.nextUrl.searchParams.get("actor_user_id");
  if (!workspaceId) return errorResponse(new Error("workspace_id is required."));

  try {
    assertSafeLifecycleReference(workspaceId, "workspace_id");
    const { repositories } = getRuntimeDatabaseState();
    if (!repositories.workspaces.get(workspaceId)) return errorResponse(new Error("Workspace was not found."), 404);
    assertAuditReader(repositories, workspaceId, actorUserId);
    const events = repositories.governance.listEvents(workspaceId);
    return NextResponse.json({
      status: "success",
      workspace_id: workspaceId,
      events,
      policy: { workspaceScoped: true, secretsRedacted: true, blueprintOnly: true },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

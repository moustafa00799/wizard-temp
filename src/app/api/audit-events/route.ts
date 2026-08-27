import { NextRequest, NextResponse } from "next/server";
import { assertSafeLifecycleReference } from "@/lib/campaign-lifecycle";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";
import { LocalAuthError, requireLocalSession } from "@/lib/auth/local-auth";

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
  if (!workspaceId) return errorResponse(new Error("workspace_id is required."));

  try {
    assertSafeLifecycleReference(workspaceId, "workspace_id");
    const { repositories } = getRuntimeDatabaseState();
    if (!repositories.workspaces.get(workspaceId)) return errorResponse(new Error("Workspace was not found."), 404);
    const session = requireLocalSession(request);
    if (session.workspaceId !== workspaceId) throw new LocalAuthError("FORBIDDEN", "Session is not authorized for this workspace.");
    assertAuditReader(repositories, workspaceId, session.userId);
    const events = repositories.governance.listEvents(workspaceId);
    return NextResponse.json({
      status: "success",
      workspace_id: workspaceId,
      events,
      policy: { workspaceScoped: true, secretsRedacted: true, blueprintOnly: true },
    });
  } catch (error) {
    if (error instanceof LocalAuthError) return errorResponse(error, error.code === "NOT_CONFIGURED" ? 503 : error.code === "FORBIDDEN" ? 403 : 401);
    return errorResponse(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody, RequestSecurityError } from "@/lib/api/request-security";
import {
  createLocalSession,
  LocalAuthError,
  localSessionCookieOptions,
  serializeLocalSession,
} from "@/lib/auth/local-auth";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";

function errorResponse(error: unknown) {
  if (error instanceof RequestSecurityError) {
    return NextResponse.json({ status: "error", error: error.code === "BODY_TOO_LARGE" ? "Request body too large" : "Invalid JSON" }, { status: error.code === "BODY_TOO_LARGE" ? 413 : 400 });
  }
  if (error instanceof LocalAuthError) {
    const status = error.code === "NOT_CONFIGURED" ? 503 : 401;
    return NextResponse.json({ status: "error", error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ status: "error", error: "Authentication failed." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, 16 * 1024);
    const accessCode = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).access_code === "string"
      ? String((body as Record<string, unknown>).access_code)
      : "";
    const session = createLocalSession(accessCode);
    const { repositories } = getRuntimeDatabaseState();
    if (!repositories.workspaces.get(session.workspaceId)) repositories.workspaces.create({ workspaceId: session.workspaceId, name: "CDKS Local Staging Workspace" });
    const existingMembership = repositories.memberships.get(session.workspaceId, session.userId);
    if (!existingMembership) repositories.memberships.create(session.workspaceId, session.userId, session.role);
    const response = NextResponse.json({
      status: "success",
      user: { userId: session.userId, workspaceId: session.workspaceId, role: session.role },
      expiresAt: session.expiresAt,
      policy: { localStagingOnly: true, blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false },
    });
    response.cookies.set(localSessionCookieOptions(serializeLocalSession(session)));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

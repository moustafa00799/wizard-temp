import { NextRequest, NextResponse } from "next/server";
import { LocalAuthError, requireLocalSession } from "@/lib/auth/local-auth";

export async function GET(request: NextRequest) {
  try {
    const session = requireLocalSession(request);
    return NextResponse.json({
      status: "success",
      authenticated: true,
      user: { userId: session.userId, workspaceId: session.workspaceId, role: session.role },
      expiresAt: session.expiresAt,
      policy: { localStagingOnly: true, blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false },
    });
  } catch (error) {
    const status = error instanceof LocalAuthError && error.code === "NOT_CONFIGURED" ? 503 : 401;
    return NextResponse.json({ status: "error", authenticated: false, error: "A valid Local Staging session is required." }, { status });
  }
}

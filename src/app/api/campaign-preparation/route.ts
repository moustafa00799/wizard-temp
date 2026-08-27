import { NextRequest, NextResponse } from "next/server";
import { PreparationRequestSchema, buildCampaignPreparationEnvelope } from "@/lib/campaign-preparation";
import { getRuntimeDatabaseState } from "@/lib/db/runtime-database";
import { readJsonBody, RequestSecurityError } from "@/lib/api/request-security";
import { LocalAuthError, requireLocalSession } from "@/lib/auth/local-auth";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Invalid preparation request.";
  return NextResponse.json({ status: "error", error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const input = PreparationRequestSchema.parse(await readJsonBody(request, 32 * 1024));
    const session = requireLocalSession(request);
    if (session.workspaceId !== input.workspace_id) throw new LocalAuthError("FORBIDDEN", "Session is not authorized for this workspace.");
    const { repositories } = getRuntimeDatabaseState();
    const lifecycle = repositories.campaignLifecycle.get(input.workspace_id, input.lifecycle_id) as Record<string, unknown> | undefined;
    if (!lifecycle) return errorResponse(new Error("Campaign lifecycle was not found."), 404);

    const blueprintId = String(lifecycle.blueprint_id);
    const blueprintRow = repositories.blueprints.get(blueprintId) as Record<string, unknown> | undefined;
    if (!blueprintRow || String(blueprintRow.workspace_id) !== input.workspace_id) return errorResponse(new Error("Canonical Blueprint was not found in the requested workspace."), 404);
    const blueprint = blueprintRow.blueprint as Record<string, unknown>;
    const envelope = buildCampaignPreparationEnvelope({
      lifecycle: {
        lifecycleId: String(lifecycle.lifecycle_id),
        workspaceId: String(lifecycle.workspace_id),
        blueprintId,
        state: String(lifecycle.state) as "draft" | "review" | "approved" | "rejected",
        canonicalSha256: String(lifecycle.canonical_sha256),
      },
      blueprint,
    });
    repositories.governance.createAuditEvent({
      auditEventId: `${input.lifecycle_id}:preparation:${envelope.lifecycle.canonicalSha256}`,
      workspaceId: input.workspace_id,
      eventType: "campaign_preparation_exported",
      objectType: "campaign_lifecycle",
      objectId: input.lifecycle_id,
      actorType: "system",
      payload: { preparationStatus: envelope.preparationStatus, blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false },
    });
    return NextResponse.json({ status: "success", preparation: envelope });
  } catch (error) {
    if (error instanceof RequestSecurityError) return errorResponse(error, error.code === "BODY_TOO_LARGE" ? 413 : 400);
    if (error instanceof LocalAuthError) return errorResponse(error, error.code === "NOT_CONFIGURED" ? 503 : error.code === "FORBIDDEN" || error.code === "INVALID_SESSION" ? 401 : 400);
    return errorResponse(error);
  }
}

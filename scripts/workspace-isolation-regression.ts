import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { sha256Json } from "../src/lib/db";

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-workspace-isolation-"));
  process.env.CDKS_APP_DB_PATH = path.join(tempDir, "app.sqlite");
  process.env.CDKS_LOCAL_AUTH_ACCESS_CODE = "workspace-isolation-local-access-code";
  process.env.CDKS_LOCAL_AUTH_SESSION_SECRET = "workspace-isolation-session-secret-012345678901234567890";

  const { getRuntimeDatabaseState } = await import("../src/lib/db/runtime-database");
  const { POST: localLogin } = await import("../src/app/api/auth/local/login/route");
  const { GET: getLifecycle, POST: updateLifecycle } = await import("../src/app/api/campaign-lifecycle/route");
  const { GET: getAudit } = await import("../src/app/api/audit-events/route");
  const { repositories } = getRuntimeDatabaseState();

  repositories.workspaces.create({ workspaceId: "ws-a", name: "Workspace A" });
  repositories.workspaces.create({ workspaceId: "ws-b", name: "Workspace B" });
  repositories.memberships.create("ws-a", "reviewer-a", "reviewer");
  repositories.memberships.create("ws-b", "reviewer-b", "reviewer");

  const blueprintA = { blueprint_id: "bp-a", market: "eg", industry: "ecommerce", governance: { blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false } };
  const blueprintB = { blueprint_id: "bp-b", market: "sa", industry: "education", governance: { blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false } };
  repositories.blueprints.create({ blueprintId: "bp-a", workspaceId: "ws-a", version: 1, blueprint: blueprintA, canonicalSha256: sha256Json(blueprintA) });
  repositories.blueprints.create({ blueprintId: "bp-b", workspaceId: "ws-b", version: 1, blueprint: blueprintB, canonicalSha256: sha256Json(blueprintB) });

  async function login(userId: string, workspaceId: string) {
    process.env.CDKS_LOCAL_AUTH_USER_ID = userId;
    process.env.CDKS_LOCAL_AUTH_WORKSPACE_ID = workspaceId;
    const response = await localLogin(new NextRequest("http://localhost/api/auth/local/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_code: "workspace-isolation-local-access-code" }),
    }));
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    return cookie;
  }

  const cookieA = await login("reviewer-a", "ws-a");
  const cookieB = await login("reviewer-b", "ws-b");

  async function post(body: Record<string, unknown>, cookie: string) {
    const response = await updateLifecycle(new NextRequest("http://localhost/api/campaign-lifecycle", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    }));
    return { response, payload: await response.json() as Record<string, unknown> };
  }

  const createA = await post({ action: "create", workspace_id: "ws-a", lifecycle_id: "lc-a", blueprint_id: "bp-a", canonical_sha256: sha256Json(blueprintA) }, cookieA);
  assert.equal(createA.response.status, 200);
  const createB = await post({ action: "create", workspace_id: "ws-b", lifecycle_id: "lc-b", blueprint_id: "bp-b", canonical_sha256: sha256Json(blueprintB) }, cookieB);
  assert.equal(createB.response.status, 200);

  const crossWorkspaceCreate = await post({ action: "create", workspace_id: "ws-b", lifecycle_id: "lc-cross", blueprint_id: "bp-a", canonical_sha256: sha256Json(blueprintA) }, cookieB);
  assert.equal(crossWorkspaceCreate.response.status, 404);

  const crossWorkspaceRead = await getLifecycle(new NextRequest("http://localhost/api/campaign-lifecycle?workspace_id=ws-b&lifecycle_id=lc-a", { headers: { cookie: cookieB } }));
  const crossWorkspaceReadPayload = await crossWorkspaceRead.json() as { lifecycle?: unknown; events?: unknown[] };
  assert.equal(crossWorkspaceRead.status, 200);
  assert.equal(crossWorkspaceReadPayload.lifecycle, null);
  assert.deepEqual(crossWorkspaceReadPayload.events, []);

  const review = await post({ action: "transition", workspace_id: "ws-a", lifecycle_id: "lc-a", event_id: "lc-a:review", from_state: "draft", to_state: "review", actor_type: "user", actor_user_id: "reviewer-a", canonical_sha256: sha256Json(blueprintA) }, cookieA);
  assert.equal(review.response.status, 200);

  const unauthorizedApproval = await post({ action: "transition", workspace_id: "ws-a", lifecycle_id: "lc-a", event_id: "lc-a:wrong-reviewer", from_state: "review", to_state: "approved", actor_type: "user", actor_user_id: "reviewer-b", canonical_sha256: sha256Json(blueprintA) }, cookieA);
  assert.equal(unauthorizedApproval.response.status, 403);
  assert.match(String(unauthorizedApproval.payload.error), /authenticated session/);

  const approval = await post({ action: "transition", workspace_id: "ws-a", lifecycle_id: "lc-a", event_id: "lc-a:approval", from_state: "review", to_state: "approved", actor_type: "user", actor_user_id: "reviewer-a", canonical_sha256: sha256Json(blueprintA) }, cookieA);
  assert.equal(approval.response.status, 200);

  repositories.governance.createAuditEvent({
    auditEventId: "ws-a:custom-audit",
    workspaceId: "ws-a",
    eventType: "workspace_scoped_test",
    objectType: "test",
    objectId: "object-a",
    actorType: "user",
    payload: { safe: true, note: "workspace A only" },
  });

  const auditA = await getAudit(new NextRequest("http://localhost/api/audit-events?workspace_id=ws-a", { headers: { cookie: cookieA } }));
  const auditAPayload = await auditA.json() as { status: string; events: Array<{ workspace_id: string; payload: Record<string, unknown> }> };
  assert.equal(auditA.status, 200);
  assert.equal(auditAPayload.status, "success");
  assert.ok(auditAPayload.events.length >= 4);
  assert.ok(auditAPayload.events.every((event) => event.workspace_id === "ws-a"));
  assert.ok(auditAPayload.events.every((event) => !Object.keys(event.payload).some((key) => /secret|token|password|api_key/i.test(key))));

  const auditCrossRead = await getAudit(new NextRequest("http://localhost/api/audit-events?workspace_id=ws-b", { headers: { cookie: cookieA } }));
  assert.equal(auditCrossRead.status, 403);

  console.log(JSON.stringify({ status: "PASS", assertions: 18, crossWorkspaceCreate: "blocked", crossWorkspaceRead: "empty", unauthorizedApproval: "blocked", auditWorkspaceScoped: true, secretsRedacted: true }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

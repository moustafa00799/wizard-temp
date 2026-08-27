import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-security-"));
  process.env.CDKS_APP_DB_PATH = path.join(tempDir, "app.sqlite");
  process.env.AI_LIVE_ENABLED = "false";
  process.env.CDKS_DEFAULT_WORKSPACE_USER_ID = "security-reviewer";
  process.env.CDKS_LOCAL_AUTH_ACCESS_CODE = "security-local-test-access-code";
  process.env.CDKS_LOCAL_AUTH_SESSION_SECRET = "security-local-session-secret-012345678901234567890";
  delete process.env.CDKS_AUTHORIZED_REVIEWER_IDS;

  const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json"), "utf8"));
  const { POST: generateV5 } = await import("../src/app/api/generate/v5/route");
  const { POST: localLogin } = await import("../src/app/api/auth/local/login/route");
  const { POST: updateLifecycle } = await import("../src/app/api/campaign-lifecycle/route");
  const { POST: prepareBlueprint } = await import("../src/app/api/campaign-preparation/route");
  const { GET: health } = await import("../src/app/api/health/route");

  const invalidJson = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  }));
  const invalidJsonPayload = await invalidJson.json() as { error?: string };
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJsonPayload.error, "Invalid JSON");

  const oversized = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": String(256 * 1024 + 1) },
    body: "x".repeat(256 * 1024 + 1),
  }));
  const oversizedPayload = await oversized.json() as { error?: string };
  assert.equal(oversized.status, 413);
  assert.equal(oversizedPayload.error, "Request body too large");

  const generationResponse = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...(fixture.input ?? fixture), ai_advisory: { enabled: false } }),
  }));
  const generation = await generationResponse.json() as { campaign_lifecycle: { lifecycleId: string; workspaceId: string; canonicalSha256: string }; data: { blueprint: Record<string, unknown> } };
  assert.equal(generationResponse.status, 200);

  const loginResponse = await localLogin(new NextRequest("http://localhost/api/auth/local/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ access_code: "security-local-test-access-code" }),
  }));
  assert.equal(loginResponse.status, 200);
  const sessionCookie = loginResponse.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(sessionCookie);

  const lifecycle = generation.campaign_lifecycle;
  async function transition(body: Record<string, unknown>) {
    const response = await updateLifecycle(new NextRequest("http://localhost/api/campaign-lifecycle", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: sessionCookie! },
      body: JSON.stringify(body),
    }));
    return { response, payload: await response.json() as { error?: string; lifecycle?: { state: string } } };
  }

  const unsafeReference = await transition({
    action: "transition",
    workspace_id: "../other-workspace",
    lifecycle_id: lifecycle.lifecycleId,
    event_id: "security:unsafe-reference",
    from_state: "draft",
    to_state: "review",
    actor_type: "system",
    canonical_sha256: lifecycle.canonicalSha256,
  });
  assert.equal(unsafeReference.response.status, 400);
  assert.match(unsafeReference.payload.error ?? "", /unsupported characters/);

  const preparationBeforeApproval = await prepareBlueprint(new NextRequest("http://localhost/api/campaign-preparation", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: sessionCookie! },
    body: JSON.stringify({ workspace_id: lifecycle.workspaceId, lifecycle_id: lifecycle.lifecycleId }),
  }));
  const preparationBeforeApprovalPayload = await preparationBeforeApproval.json() as { error?: string };
  assert.equal(preparationBeforeApproval.status, 400);
  assert.match(preparationBeforeApprovalPayload.error ?? "", /human approval/);

  const review = await transition({
    action: "transition",
    workspace_id: lifecycle.workspaceId,
    lifecycle_id: lifecycle.lifecycleId,
    event_id: "security:review",
    from_state: "draft",
    to_state: "review",
    actor_type: "user",
    actor_user_id: "security-reviewer",
    canonical_sha256: lifecycle.canonicalSha256,
  });
  assert.equal(review.response.status, 200);

  if (process.env.NODE_ENV === "production") {
    const missingProductionAuth = await transition({
      action: "transition",
      workspace_id: lifecycle.workspaceId,
      lifecycle_id: lifecycle.lifecycleId,
      event_id: "security:missing-production-auth",
      from_state: "review",
      to_state: "approved",
      actor_type: "user",
      actor_user_id: "security-reviewer",
      canonical_sha256: lifecycle.canonicalSha256,
    });
    assert.equal(missingProductionAuth.response.status, 400);
    assert.match(missingProductionAuth.payload.error ?? "", /authentication is not configured/);
    process.env.CDKS_AUTHORIZED_REVIEWER_IDS = "security-reviewer";
  }

  const approval = await transition({
    action: "transition",
    workspace_id: lifecycle.workspaceId,
    lifecycle_id: lifecycle.lifecycleId,
    event_id: "security:approval",
    from_state: "review",
    to_state: "approved",
    actor_type: "user",
    actor_user_id: "security-reviewer",
    canonical_sha256: lifecycle.canonicalSha256,
  });
  assert.equal(approval.response.status, 200);

  const replayWithWrongHash = await transition({
    action: "transition",
    workspace_id: lifecycle.workspaceId,
    lifecycle_id: lifecycle.lifecycleId,
    event_id: "security:wrong-hash",
    from_state: "review",
    to_state: "rejected",
    actor_type: "user",
    actor_user_id: "security-reviewer",
    canonical_sha256: "0".repeat(64),
  });
  assert.equal(replayWithWrongHash.response.status, 400);
  assert.match(replayWithWrongHash.payload.error ?? "", /Canonical Blueprint hash/);

  const healthResponse = await health();
  const healthPayload = await healthResponse.json() as { status: string; readiness: string; governance: { marketValidated: boolean; externalActionsAllowed: boolean; budgetSpendAllowed: boolean }; deployment: { productionReady: boolean } };
  assert.equal(healthResponse.status, 200);
  assert.equal(healthPayload.status, "ok");
  assert.equal(healthPayload.governance.marketValidated, false);
  assert.equal(healthPayload.governance.externalActionsAllowed, false);
  assert.equal(healthPayload.governance.budgetSpendAllowed, false);
  assert.equal(healthPayload.deployment.productionReady, false);

  console.log(JSON.stringify({
    status: "PASS",
    assertions: process.env.NODE_ENV === "production" ? 21 : 19,
    invalidJson: "blocked",
    oversizedBody: "blocked",
    unsafeReference: "blocked",
    preparationBeforeApproval: "blocked",
    wrongHashReplay: "blocked",
    productionReviewerGate: process.env.NODE_ENV === "production" ? "verified" : "not-run-local",
    health: healthPayload.readiness,
    marketValidated: false,
    blueprintOnly: true,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

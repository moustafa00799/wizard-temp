import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { sha256Json } from "../src/lib/db";

async function main() {
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-lifecycle-http-"));
process.env.CDKS_APP_DB_PATH = path.join(tempDir, "app.sqlite");
process.env.AI_LIVE_ENABLED = "false";
process.env.CDKS_DEFAULT_WORKSPACE_USER_ID = "http-reviewer";

const { POST: generateV5 } = await import("../src/app/api/generate/v5/route");
const { GET: getLifecycle, POST: updateLifecycle } = await import("../src/app/api/campaign-lifecycle/route");
const { POST: prepareBlueprint } = await import("../src/app/api/campaign-preparation/route");

const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json"), "utf8"));
const generationResponse = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ...(fixture.input ?? fixture), ai_advisory: { enabled: false } }),
}));
const generation = await generationResponse.json() as { status: string; data?: { blueprint?: Record<string, unknown> }; campaign_lifecycle?: { lifecycleId: string; workspaceId: string; blueprintId: string; canonicalSha256: string; state: string; externalActionsAllowed: boolean; budgetSpendAllowed: boolean } | null };
assert.equal(generationResponse.status, 200);
assert.equal(generation.status, "success");
assert.ok(generation.data?.blueprint);
assert.equal(generation.campaign_lifecycle?.state, "draft");
assert.equal(generation.campaign_lifecycle?.externalActionsAllowed, false);
assert.equal(generation.campaign_lifecycle?.budgetSpendAllowed, false);
assert.equal(generation.campaign_lifecycle?.canonicalSha256, sha256Json(generation.data?.blueprint));

const lifecycle = generation.campaign_lifecycle!;
async function transition(body: Record<string, unknown>) {
  const response = await updateLifecycle(new NextRequest("http://localhost/api/campaign-lifecycle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return { response, payload: await response.json() as { status: string; lifecycle?: { state: string; externalActionsAllowed: boolean; budgetSpendAllowed: boolean }; error?: string } };
}

const review = await transition({
  action: "transition",
  workspace_id: lifecycle.workspaceId,
  lifecycle_id: lifecycle.lifecycleId,
  event_id: `${lifecycle.lifecycleId}:http:review`,
  from_state: "draft",
  to_state: "review",
  actor_type: "system",
  canonical_sha256: lifecycle.canonicalSha256,
});
assert.equal(review.response.status, 200);
assert.equal(review.payload.lifecycle?.state, "review");

const systemApproval = await transition({
  action: "transition",
  workspace_id: lifecycle.workspaceId,
  lifecycle_id: lifecycle.lifecycleId,
  event_id: `${lifecycle.lifecycleId}:http:system-approval`,
  from_state: "review",
  to_state: "approved",
  actor_type: "system",
  canonical_sha256: lifecycle.canonicalSha256,
});
assert.equal(systemApproval.response.status, 400);
assert.match(systemApproval.payload.error ?? "", /human actor/);

const approval = await transition({
  action: "transition",
  workspace_id: lifecycle.workspaceId,
  lifecycle_id: lifecycle.lifecycleId,
  event_id: `${lifecycle.lifecycleId}:http:approval`,
  from_state: "review",
  to_state: "approved",
  actor_type: "user",
  actor_user_id: "http-reviewer",
  note: "Approved for review/export preparation only; no external publishing.",
  canonical_sha256: lifecycle.canonicalSha256,
});
assert.equal(approval.response.status, 200);
assert.equal(approval.payload.lifecycle?.state, "approved");
assert.equal(approval.payload.lifecycle?.externalActionsAllowed, false);
assert.equal(approval.payload.lifecycle?.budgetSpendAllowed, false);

const preparationResponse = await prepareBlueprint(new NextRequest("http://localhost/api/campaign-preparation", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ workspace_id: lifecycle.workspaceId, lifecycle_id: lifecycle.lifecycleId }),
}));
const preparationPayload = await preparationResponse.json() as { status: string; preparation?: { formatVersion: string; preparationStatus: string; lifecycle: { state: string; canonicalSha256: string }; measurementPlan: { contractVersion: string; trackingReadiness: string; metrics: Array<{ metric: string; status: string; value?: number; unavailableReason?: string }>; attribution: { status: string; window: string }; governance: { performanceObserved: boolean; revenueObserved: boolean; externalActionsAllowed: boolean; budgetSpendAllowed: boolean; marketValidated: boolean } }; reviewChecklist: { humanApprovalRecorded: boolean; canonicalHashVerified: boolean; blueprintOnly: boolean; externalActionsAllowed: boolean; budgetSpendAllowed: boolean; providerWriteEnabled: boolean; marketValidationClaimed: boolean }; blockedActions: string[] } };
assert.equal(preparationResponse.status, 200);
assert.equal(preparationPayload.status, "success");
assert.equal(preparationPayload.preparation?.formatVersion, "campaign-preparation-v1");
assert.equal(preparationPayload.preparation?.preparationStatus, "approved_for_preparation");
assert.equal(preparationPayload.preparation?.lifecycle.state, "approved");
assert.equal(preparationPayload.preparation?.lifecycle.canonicalSha256, lifecycle.canonicalSha256);
assert.equal(preparationPayload.preparation?.measurementPlan.contractVersion, "measurement-plan-v1");
assert.equal(preparationPayload.preparation?.measurementPlan.attribution.status, "unavailable");
assert.equal(preparationPayload.preparation?.measurementPlan.attribution.window, "unavailable");
assert.equal(preparationPayload.preparation?.measurementPlan.governance.performanceObserved, false);
assert.equal(preparationPayload.preparation?.measurementPlan.governance.revenueObserved, false);
assert.equal(preparationPayload.preparation?.measurementPlan.governance.externalActionsAllowed, false);
assert.equal(preparationPayload.preparation?.measurementPlan.governance.budgetSpendAllowed, false);
assert.equal(preparationPayload.preparation?.measurementPlan.governance.marketValidated, false);
assert.equal(preparationPayload.preparation?.measurementPlan.metrics.length, 8);
assert.ok(preparationPayload.preparation?.measurementPlan.metrics.every((metric) => metric.status === "unavailable" && metric.unavailableReason));
assert.deepEqual(preparationPayload.preparation?.reviewChecklist, { humanApprovalRecorded: true, canonicalHashVerified: true, blueprintOnly: true, externalActionsAllowed: false, budgetSpendAllowed: false, providerWriteEnabled: false, marketValidationClaimed: false });
assert.equal(preparationPayload.preparation?.blockedActions.length, 5);

const getResponse = await getLifecycle(new NextRequest(`http://localhost/api/campaign-lifecycle?workspace_id=${encodeURIComponent(lifecycle.workspaceId)}&lifecycle_id=${encodeURIComponent(lifecycle.lifecycleId)}`));
const getPayload = await getResponse.json() as { status: string; lifecycle?: { state: string }; events?: Array<{ toState: string }> };
assert.equal(getResponse.status, 200);
assert.equal(getPayload.status, "success");
assert.equal(getPayload.lifecycle?.state, "approved");
assert.deepEqual(getPayload.events?.map((event) => event.toState), ["draft", "review", "approved"]);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(JSON.stringify({
  status: "PASS",
  assertions: 22,
  lifecycle: ["draft", "review", "approved"],
  systemApproval: "rejected",
  externalActionsAllowed: false,
  budgetSpendAllowed: false,
}));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

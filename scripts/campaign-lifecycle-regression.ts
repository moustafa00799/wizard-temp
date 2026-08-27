import assert from "node:assert/strict";
import { createRepositories, openDatabase, sha256Json } from "../src/lib/db";

const database = openDatabase(":memory:");
const repositories = createRepositories(database);
const workspaceId = "workspace-lifecycle-regression";
const blueprintId = "blueprint-lifecycle-regression";
const lifecycleId = "campaign-lifecycle-regression";
const blueprint = {
  blueprint_id: blueprintId,
  generation_mode: "blueprint_only",
  governance: {
    external_actions_allowed: false,
    budget_spend_allowed: false,
    can_change_canonical_blueprint: false,
  },
};
const canonicalSha256 = sha256Json(blueprint);

repositories.workspaces.create({ workspaceId, name: "Lifecycle Regression" });
repositories.memberships.create(workspaceId, "user-regression-owner", "owner");
repositories.blueprints.create({
  blueprintId,
  workspaceId,
  version: 1,
  blueprint,
  canonicalSha256,
});

const created = repositories.campaignLifecycle.create({
  lifecycleId,
  workspaceId,
  blueprintId,
  canonicalSha256,
});
assert.equal(created.state, "draft");
assert.equal(created.generation_mode, "blueprint_only");
assert.equal(created.external_actions_allowed, 0);
assert.equal(created.budget_spend_allowed, 0);

const replayedCreate = repositories.campaignLifecycle.create({
  lifecycleId,
  workspaceId,
  blueprintId,
  canonicalSha256,
});
assert.equal(replayedCreate.lifecycle_id, lifecycleId);
assert.equal(repositories.campaignLifecycle.listEvents(workspaceId, lifecycleId).length, 1);

const reviewed = repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:to-review`,
  lifecycleId,
  workspaceId,
  fromState: "draft",
  toState: "review",
  actorType: "system",
  note: "CDKS completed validation; human review required.",
  canonicalSha256,
});
assert.equal(reviewed.state, "review");

const reviewedReplay = repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:to-review`,
  lifecycleId,
  workspaceId,
  fromState: "draft",
  toState: "review",
  actorType: "system",
  note: "CDKS completed validation; human review required.",
  canonicalSha256,
});
assert.equal(reviewedReplay.state, "review");
assert.equal(repositories.campaignLifecycle.listEvents(workspaceId, lifecycleId).length, 2);

assert.throws(() => repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:system-approve`,
  lifecycleId,
  workspaceId,
  fromState: "review",
  toState: "approved",
  actorType: "system",
  canonicalSha256,
}), /identified human actor/);

const approved = repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:human-approve`,
  lifecycleId,
  workspaceId,
  fromState: "review",
  toState: "approved",
  actorType: "user",
  actorUserId: "user-regression-owner",
  note: "Approved for preparation/export review only; no publishing authority.",
  canonicalSha256,
});
assert.equal(approved.state, "approved");
assert.equal(approved.external_actions_allowed, 0);
assert.equal(approved.budget_spend_allowed, 0);

assert.throws(() => repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:invalid-reopen`,
  lifecycleId,
  workspaceId,
  fromState: "approved",
  toState: "review",
  actorType: "user",
  actorUserId: "user-regression-owner",
  canonicalSha256,
}), /Invalid campaign lifecycle transition/);

assert.throws(() => repositories.campaignLifecycle.transition({
  eventId: `${lifecycleId}:wrong-hash`,
  lifecycleId,
  workspaceId,
  fromState: "approved",
  toState: "review",
  actorType: "user",
  actorUserId: "user-regression-owner",
  canonicalSha256: "0".repeat(64),
}), /Canonical Blueprint hash mismatch/);

const lifecycle = repositories.campaignLifecycle.get(workspaceId, lifecycleId);
assert.equal(lifecycle?.state, "approved");
assert.equal(lifecycle?.canonical_sha256, canonicalSha256);
assert.equal(repositories.campaignLifecycle.listEvents(workspaceId, lifecycleId).length, 3);

console.log(JSON.stringify({
  status: "PASS",
  assertions: 22,
  lifecycleState: lifecycle?.state,
  lifecycleEvents: repositories.campaignLifecycle.listEvents(workspaceId, lifecycleId).length,
  blueprintOnly: lifecycle?.generation_mode === "blueprint_only",
  externalActionsAllowed: lifecycle?.external_actions_allowed === 1,
  budgetSpendAllowed: lifecycle?.budget_spend_allowed === 1,
}));

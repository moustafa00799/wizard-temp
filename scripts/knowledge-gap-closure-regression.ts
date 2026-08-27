import assert from "node:assert/strict";
import { buildAIKnowledgeGuardrails, buildKnowledgeGapClosureManifest } from "../src/lib/knowledge";

const manifest = buildKnowledgeGapClosureManifest();
assert.equal(manifest.contractVersion, "1.0");
assert.equal(manifest.manifestId, "knowledge-gap-closure-2026-08-27");
assert.equal(manifest.policy.newDataCollection, false);
assert.equal(manifest.policy.liveAiCalls, false);
assert.equal(manifest.policy.marketValidated, false);
assert.equal(manifest.policy.canonicalBlueprintMutation, false);
assert.equal(manifest.policy.accountOwnedDataAsMarketBenchmark, false);
assert.ok(manifest.dispositions.length >= 10);
assert.ok(manifest.dispositions.some((item) => item.id === "drive-catalogs" && item.status === "closed_low_priority" && item.use === "not_for_strategy"));
assert.ok(manifest.dispositions.some((item) => item.id === "drive-sensitive-unknown" && item.status === "closed_quarantine"));
assert.ok(manifest.dispositions.some((item) => item.id === "drive-old-sales-and-seller" && item.status === "closed_unavailable"));
assert.ok(manifest.dispositions.some((item) => item.id === "saudi-shaaddesign-ga4" && item.status === "ready_for_restricted_snapshot"));
assert.ok(manifest.dispositions.some((item) => item.id === "authorization-deferred" && item.status === "deferred"));
assert.ok(manifest.dispositions.every((item) => item.forbiddenAssumptions.length > 0));
assert.ok(manifest.aiGuardrails.closedLowPriorityDispositionIds.includes("drive-catalogs"));
assert.equal(manifest.aiGuardrails.mode, "advisory_only");
assert.equal(manifest.aiGuardrails.useOnlyScopedEvidence, true);
assert.equal(manifest.aiGuardrails.preserveUnavailableMetrics, true);
assert.ok(manifest.aiGuardrails.mustNotClaim.some((item) => /market validation/i.test(item)));
assert.ok(manifest.aiGuardrails.mustRequestHumanReviewFor.length >= 3);
assert.deepEqual(buildAIKnowledgeGuardrails(), manifest.aiGuardrails);

console.log(JSON.stringify({
  test: "knowledge-gap-closure-regression",
  status: "PASS",
  dispositionCount: manifest.dispositions.length,
  closedLowPriority: manifest.dispositions.filter((item) => item.status === "closed_low_priority").length,
  quarantined: manifest.dispositions.filter((item) => item.status === "closed_quarantine").length,
  deferred: manifest.dispositions.filter((item) => item.status === "deferred").length,
  marketValidated: manifest.policy.marketValidated,
  canonicalBlueprintMutation: manifest.policy.canonicalBlueprintMutation,
  liveAiCalls: manifest.policy.liveAiCalls,
}, null, 2));

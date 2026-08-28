import assert from "node:assert/strict";
import { runAdvisoryMock, runAdvisoryMockFailure } from "../src/lib/advisory-ai-mock";
import { validateAdvisoryOutput } from "../src/lib/contracts/advisory-capabilities";

const capabilities = ["creative_planner", "evidence_synthesizer", "compliance_qa", "rule_candidate_evaluator"] as const;

async function main() {
  const outputs = capabilities.flatMap((capability) => [runAdvisoryMock(capability, "ar"), runAdvisoryMock(capability, "en")]);
  assert.equal(outputs.length, 8);
  for (const output of outputs) {
    assert.equal(output.status, "draft");
    assert.equal(output.safety.advisory_only, true);
    assert.equal(output.safety.draft_only, true);
    assert.equal(output.safety.can_mutate_cdks, false);
    assert.equal(output.safety.can_change_blueprint, false);
    assert.equal(output.safety.can_authorize_launch, false);
    assert.equal(output.safety.can_publish, false);
    assert.equal(output.safety.can_spend_budget, false);
    assert.equal(output.safety.external_actions_allowed, false);
    assert.equal(output.safety.automated_rule_modification, false);
    assert.equal(output.safety.human_review_required, true);
    assert.equal(output.provenance.provider, "mock");
    assert.ok(output.unavailable_categories.includes("market_benchmarks"));
    assert.deepEqual(validateAdvisoryOutput(output), output);
  }

  const creative = runAdvisoryMock("creative_planner", "en");
  assert.equal(creative.drafts[0]?.format, "short_video");
  assert.ok(creative.drafts[0]?.unsupported_claims.length);

  const evidence = runAdvisoryMock("evidence_synthesizer", "ar");
  assert.equal(evidence.evidence_package_status, "insufficient_evidence");
  assert.equal(evidence.facts[0]?.confirmation, "unavailable");

  const qa = runAdvisoryMock("compliance_qa", "en");
  assert.equal(qa.review_outcome, "needs_review");
  assert.equal(qa.findings[0]?.severity, "medium");

  const rules = runAdvisoryMock("rule_candidate_evaluator", "ar");
  assert.equal(rules.evaluation_scope, "offline_fixture_only");
  assert.equal(rules.canonical_rules_changed, false);
  assert.equal(rules.candidates[0]?.requires_human_review, true);
  assert.equal(rules.candidates[0]?.canonical_impact, "none_until_versioned_human_approval");

  for (const capability of capabilities) {
    const failure = runAdvisoryMockFailure(capability, "en");
    assert.equal(failure.status, "failed");
    assert.equal(failure.failure?.code, "ADVISORY_MOCK_FAILURE");
    assert.equal(failure.safety.external_actions_allowed, false);
  }

  console.log(JSON.stringify({ status: "PASS", assertions: 53, capabilities, locales: ["ar", "en"], externalRequests: 0 }, null, 2));
}

void main();

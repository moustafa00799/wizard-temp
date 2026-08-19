const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function callRoute(fixture, aiReasoning) {
  const { POST } = await import('../src/app/api/generate/v5/route.ts');
  const request = new Request('http://localhost/api/generate/v5', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...fixture, ai_reasoning: aiReasoning }),
  });
  const response = await POST(request);
  return { status: response.status, body: await response.json() };
}

async function main() {
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const originalLog = console.log;
  console.log = () => {};

  try {
    const baseline = await callRoute(fixture, { enabled: true, provider: 'mock', mockScenario: 'baseline' });
  assert.equal(baseline.status, 200);
  assert.equal(baseline.body.status, 'success');
  assert.equal(baseline.body.data.reasoning.status, 'completed');
  assert.equal(baseline.body.data.reasoning.authority, 'AI_REASONING');
  assert.equal(baseline.body.data.reasoning.contract.contract_version, '1.0');
  assert.equal(baseline.body.data.reasoning.contract.blueprint_id, baseline.body.data.blueprint_id);
  assert.equal(baseline.body.data.validation.external_actions_allowed, false);
  assert.equal(baseline.body.data.validation.budget_spend_allowed, false);

    const unsupported = await callRoute(fixture, { enabled: true, provider: 'mock', mockScenario: 'unsupported_claim' });
  assert.equal(unsupported.status, 200);
  assert.equal(unsupported.body.data.reasoning.contract.grounding.unsupported_claim_count, 1);
  assert.equal(unsupported.body.data.readiness.value, 'blocked');

    const override = await callRoute(fixture, { enabled: true, provider: 'mock', mockScenario: 'override_attempt' });
  assert.equal(override.status, 200);
  assert.equal(override.body.data.reasoning.status, 'failed');
  assert.equal(override.body.data.reasoning.contract.failure.code, 'REASONING_SAFETY_REJECTED');
  assert.equal(override.body.data.readiness.value, 'blocked');
  assert.equal(override.body.data.validation.external_actions_allowed, false);

    const malformed = await callRoute(fixture, { enabled: true, provider: 'mock', mockScenario: 'malformed' });
  assert.equal(malformed.status, 200);
  assert.equal(malformed.body.data.reasoning.contract.failure.code, 'REASONING_SCHEMA_INVALID');

    const disabled = await callRoute(fixture, { enabled: false });
  assert.equal(disabled.status, 200);
  assert.equal(disabled.body.data.reasoning.status, 'not_requested');
  assert.equal(disabled.body.data.reasoning.contract.blueprint_id, disabled.body.data.blueprint_id);

    originalLog(JSON.stringify({ status: 'PASS', assertions: 24, fixture: 'EX-001', endpoint: '/api/generate/v5' }, null, 2));
  } finally {
    console.log = originalLog;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

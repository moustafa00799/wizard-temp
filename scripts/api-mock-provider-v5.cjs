const fs = require('node:fs');
const path = require('node:path');

const baseUrl = process.env.V5_BASE_URL || 'http://127.0.0.1:3001';
const fixturePath = path.join(__dirname, '..', 'tests', 'fixtures', 'wizard-inputs-v1', 'EX-001_ecommerce-sales.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

async function post(overrides = {}) {
  const response = await fetch(`${baseUrl}/api/generate/v5`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...fixture,
      ai_strategy_builder: {
        enabled: true,
        provider: 'mock',
        ...overrides,
      },
    }),
  });
  const payload = await response.json();
  return { response, payload };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const baseline = await post({ mockScenario: 'baseline' });
  assert(baseline.response.status === 200, `baseline HTTP ${baseline.response.status}`);
  assert(baseline.payload.data.strategy.status === 'completed', 'baseline must complete');
  assert(baseline.payload.data.strategy.model === 'mock-strategy-builder-v1', 'baseline model mismatch');
  assert(baseline.payload.data.validation.external_actions_allowed === false, 'baseline external actions must remain disabled');
  assert(baseline.payload.data.validation.budget_spend_allowed === false, 'baseline spending must remain disabled');

  const override = await post({ mockScenario: 'override_attempt' });
  assert(override.response.status === 200, `override HTTP ${override.response.status}`);
  assert(override.payload.data.strategy.status === 'completed', 'override scenario should still return a usable trace');
  assert(override.payload.data.strategy.rejected_changes.length >= 2, 'override attempts must be rejected');
  assert(override.payload.data.readiness.value === 'blocked', 'readiness blocker must remain blocked');
  assert(override.payload.data.validation.external_actions_allowed === false, 'override cannot enable actions');
  assert(override.payload.data.validation.budget_spend_allowed === false, 'override cannot enable spending');

  const malformed = await post({ mockScenario: 'malformed' });
  assert(malformed.response.status === 200, `malformed HTTP ${malformed.response.status}`);
  assert(malformed.payload.data.strategy.status === 'failed', 'malformed provider output must fail closed');
  assert(malformed.payload.data.decisions.objective.authority === 'DECISION_POLICY', 'objective authority changed');

  const failure = await post({ mockScenario: 'failure' });
  assert(failure.response.status === 200, `failure HTTP ${failure.response.status}`);
  assert(failure.payload.data.strategy.status === 'failed', 'provider failure must fail closed');
  assert(failure.payload.data.validation.external_actions_allowed === false, 'failure must not enable actions');

  console.log('PASS mock provider baseline, override rejection, malformed fail-closed, and provider failure governance');
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});

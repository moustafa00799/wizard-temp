const fs = require('node:fs');
const path = require('node:path');

const baseUrl = process.env.V5_BASE_URL || 'http://127.0.0.1:3001';
const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'wizard-inputs-v1');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function asNumber(value, label) {
  const numeric = Number(value);
  assert(Number.isFinite(numeric), `${label} must be numeric`);
  return numeric;
}

function sum(values) {
  return values.reduce((total, value) => total + asNumber(value, 'sum value'), 0);
}

async function generate(fixture) {
  const response = await fetch(`${baseUrl}/api/generate/v5`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...fixture.input,
      ai_reasoning: { enabled: true, provider: 'mock', mockScenario: 'baseline' },
    }),
  });
  const envelope = await response.json();
  assert(response.ok, `HTTP ${response.status}: ${envelope.message || envelope.error || 'unknown error'}`);
  assert(envelope.status === 'success', 'v5 response must be successful');
  return envelope;
}

function assertBlueprintSemantics(envelope, fixtureName) {
  const blueprint = envelope.data?.blueprint;
  assert(blueprint, `${fixtureName}: blueprint missing`);

  const strategy = blueprint.strategy;
  const execution = blueprint.execution;
  const governance = blueprint.governance;
  assert(strategy?.recommended_objective?.value, `${fixtureName}: objective missing`);
  assert(strategy?.recommended_objective?.rule_id, `${fixtureName}: objective rule_id missing`);
  assert(Array.isArray(strategy?.recommended_channels?.value), `${fixtureName}: recommended channels missing`);
  assert(strategy?.recommended_funnel?.stages?.length > 0, `${fixtureName}: funnel stages missing`);

  const funnelStages = strategy.recommended_funnel.stages;
  const funnelRatio = sum(funnelStages.map(stage => stage.budget_ratio));
  assert(Math.abs(funnelRatio - 1) < 0.000001, `${fixtureName}: funnel budget ratios must sum to 1, got ${funnelRatio}`);
  assert(funnelStages.every(stage => stage.stage_number >= 1 && stage.kpi), `${fixtureName}: funnel stage semantics invalid`);

  const allocation = execution.budget_split?.channel_allocation?.value;
  assert(allocation && typeof allocation === 'object' && !Array.isArray(allocation), `${fixtureName}: channel allocation missing`);
  const allocationValues = Object.values(allocation);
  assert(allocationValues.length > 0, `${fixtureName}: channel allocation empty`);
  const allocationRatio = sum(allocationValues);
  assert(Math.abs(allocationRatio - 1) < 0.000001, `${fixtureName}: channel allocation must sum to 1, got ${allocationRatio}`);
  const selectedChannels = new Set(strategy.recommended_channels.value);
  assert(Object.keys(allocation).every(channel => selectedChannels.has(channel)), `${fixtureName}: allocation contains unselected channel`);

  const tracking = execution.tracking_checklist;
  const requiredEvents = tracking?.required_events || [];
  const setupEvents = (tracking?.setup_status?.items || []).map(item => item.event);
  assert(requiredEvents.length > 0, `${fixtureName}: tracking required events missing`);
  assert(JSON.stringify(requiredEvents) === JSON.stringify(setupEvents), `${fixtureName}: tracking events/checklist mismatch`);
  assert(Array.isArray(tracking.missing_items), `${fixtureName}: tracking missing_items missing`);

  const timeline = execution.launch_plan?.detailed_timeline;
  const milestones = timeline?.milestones || [];
  assert(milestones.length > 0, `${fixtureName}: launch milestones missing`);
  const milestoneDays = sum(milestones.map(milestone => milestone.days));
  assert(milestoneDays === timeline.total_days, `${fixtureName}: launch total_days mismatch`);

  const checklist = execution.launch_plan?.pre_launch_checklist;
  const items = checklist?.items || [];
  const summary = checklist?.summary;
  assert(items.length === summary?.total, `${fixtureName}: pre-launch item count mismatch`);
  assert(summary.passed + summary.failed + summary.warnings + summary.manual === summary.total, `${fixtureName}: pre-launch status counts mismatch`);
  assert(checklist.ready_to_launch === (summary.failed === 0 && summary.manual === 0), `${fixtureName}: pre-launch readiness mismatch`);

  const riskScore = governance?.risk_flags?.risk_score;
  assert(riskScore?.rule_id, `${fixtureName}: risk score provenance missing`);
  assert(Array.isArray(blueprint.provenance_trail), `${fixtureName}: provenance trail missing`);
  assert(blueprint.provenance_trail.length > 0, `${fixtureName}: provenance trail empty`);
  assert(envelope.data.validation?.external_actions_allowed === false, `${fixtureName}: external actions must remain disabled`);
  assert(envelope.data.validation?.budget_spend_allowed === false, `${fixtureName}: budget spending must remain disabled`);
}

async function main() {
  const files = fs.readdirSync(fixturesDir).filter(file => /^EX-\d+_.*\.json$/.test(file)).sort();
  const results = [];
  for (const file of files) {
    const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf8'));
    const fixtureName = fixture._fixture?.scenario_id || file;
    const envelope = await generate(fixture);
    assertBlueprintSemantics(envelope, fixtureName);
    results.push({ fixture: fixtureName, status: 'PASS' });
  }

  console.log(JSON.stringify({
    test: 'reference-parity-semantic-regression',
    totalCases: results.length,
    passedCases: results.length,
    failedCases: 0,
    liveAiCalls: 0,
    results,
  }, null, 2));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/generate/v5/route';

const fixturePath = path.join(process.cwd(), 'tests/fixtures/wizard-inputs-v1/EX-001_ecommerce-sales.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

async function call(payload: unknown) {
  const request = new NextRequest('http://localhost/api/generate/v5', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await POST(request);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'success');
  return body.data;
}

function stripRuntime(value: unknown, key = ''): unknown {
  if (/^(generated_at|timestamp|processingTimeMs|reasoning_id|blueprint_id)$/i.test(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => stripRuntime(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([childKey, childValue]) => [childKey, stripRuntime(childValue, childKey)] as const)
        .filter(([, childValue]) => childValue !== undefined),
    );
  }
  return value;
}

function stable(value: unknown): string {
  return JSON.stringify(stripRuntime(value), (_key, current) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
    }
    return current;
  });
}

function diffPaths(left: any, right: any, prefix = '', result: string[] = []): string[] {
  if (result.length >= 40) return result;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (stable(left) !== stable(right)) result.push(prefix || '<root>');
    return result;
  }
  if (left && typeof left === 'object' && right && typeof right === 'object') {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of [...keys].sort()) diffPaths(left[key], right[key], prefix ? `${prefix}.${key}` : key, result);
    return result;
  }
  if (left !== right) result.push(prefix || '<root>');
  return result;
}

function sectionKeys(blueprint: Record<string, unknown>): string[] {
  const execution = blueprint.execution && typeof blueprint.execution === 'object' ? Object.keys(blueprint.execution) : [];
  const governance = blueprint.governance && typeof blueprint.governance === 'object' ? Object.keys(blueprint.governance) : [];
  return [...new Set([...execution, ...governance])].sort();
}

async function main() {
  const originalLog = console.log;
  console.log = () => {};
  try {
    const baseline = await call(fixture);
    const bothEnabled = await call({
      ...fixture,
      ai_strategy_builder: { enabled: true, provider: 'mock', mockScenario: 'baseline' },
      ai_reasoning: { enabled: true, provider: 'mock', mockScenario: 'baseline' },
    });
    const strategyOverride = await call({
      ...fixture,
      ai_strategy_builder: { enabled: true, provider: 'mock', mockScenario: 'override_attempt' },
      ai_reasoning: { enabled: true, provider: 'mock', mockScenario: 'baseline' },
    });

    const removeCdksVolatile = (value: unknown, key = ''): unknown => {
      if (/^(created_at|launch_ready_date|execution_time_ms)$/i.test(key)) return undefined;
      if (Array.isArray(value)) return value.map((item) => removeCdksVolatile(item));
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value)
            .map(([childKey, childValue]) => [childKey, removeCdksVolatile(childValue, childKey)] as const)
            .filter(([, childValue]) => childValue !== undefined),
        );
      }
      return value;
    };

    const cdksSignature = (data: any) => stable(removeCdksVolatile({
      decisions: data.decisions,
      readiness: data.readiness,
      warnings: data.warnings,
      blueprint: data.blueprint,
      validation: data.validation,
    }));

    const baseSignature = cdksSignature(baseline);
    const aiSignature = cdksSignature(bothEnabled);
    const overrideSignature = cdksSignature(strategyOverride);

    assert.equal(bothEnabled.strategy.status, 'completed');
    assert.equal(bothEnabled.reasoning.status, 'completed');
    assert.equal(bothEnabled.strategy.authority, 'AI_STRATEGY_BUILDER');
    assert.equal(bothEnabled.reasoning.authority, 'AI_REASONING');
    assert.equal(bothEnabled.reasoning.contract.safety.can_mutate_cdks, false);
    assert.equal(bothEnabled.reasoning.contract.safety.can_change_blueprint, false);
    assert.equal(bothEnabled.reasoning.contract.safety.can_authorize_launch, false);
    assert.equal(bothEnabled.validation.external_actions_allowed, false);
    assert.equal(bothEnabled.validation.budget_spend_allowed, false);

    if (aiSignature !== baseSignature) {
      console.error(JSON.stringify({ aiVsBaselineCdksDiffPaths: diffPaths(removeCdksVolatile({ decisions: baseline.decisions, readiness: baseline.readiness, warnings: baseline.warnings, blueprint: baseline.blueprint, validation: baseline.validation }), removeCdksVolatile({ decisions: bothEnabled.decisions, readiness: bothEnabled.readiness, warnings: bothEnabled.warnings, blueprint: bothEnabled.blueprint, validation: bothEnabled.validation })) }, null, 2));
    }
    if (overrideSignature !== baseSignature) {
      console.error(JSON.stringify({ overrideVsBaselineCdksDiffPaths: diffPaths(removeCdksVolatile({ decisions: baseline.decisions, readiness: baseline.readiness, warnings: baseline.warnings, blueprint: baseline.blueprint, validation: baseline.validation }), removeCdksVolatile({ decisions: strategyOverride.decisions, readiness: strategyOverride.readiness, warnings: strategyOverride.warnings, blueprint: strategyOverride.blueprint, validation: strategyOverride.validation })) }, null, 2));
    }
    assert.equal(aiSignature, baseSignature, 'AI layers must not mutate CDKS decisions or canonical blueprint');
    assert.equal(overrideSignature, baseSignature, 'governed Strategy Builder override must not mutate CDKS output');
    assert.ok(bothEnabled.strategy.proposed_changes.length > 0);
    assert.ok(bothEnabled.strategy.accepted_changes.length > 0);
    assert.ok(bothEnabled.strategy.limitations.some((value: string) => /advisory|mutate|external/i.test(value)));
    assert.ok(bothEnabled.reasoning.contract.decision_impacts.length > 0);

    const report = {
      status: 'PASS',
      fixture: 'EX-001_ecommerce-sales.json',
      baseline: {
        strategy: baseline.strategy.status,
        reasoning: baseline.reasoning.status,
        cdksSectionKeys: sectionKeys(baseline.blueprint),
      },
      aiEnabled: {
        strategy: bothEnabled.strategy.status,
        reasoning: bothEnabled.reasoning.status,
        proposedChanges: bothEnabled.strategy.proposed_changes,
        acceptedChanges: bothEnabled.strategy.accepted_changes,
        rejectedChanges: bothEnabled.strategy.rejected_changes,
        reasoningClaims: bothEnabled.reasoning.contract.claims.map((claim: any) => ({ id: claim.claim_id, status: claim.status, statement: claim.statement, evidenceRefs: claim.evidence_refs })),
        reasoningDecisionImpacts: bothEnabled.reasoning.contract.decision_impacts,
        cdksSectionKeys: sectionKeys(bothEnabled.blueprint),
      },
      impact: {
        cdksSignatureUnchanged: true,
        strategyOverrideSignatureUnchanged: true,
        affectedCanonicalSections: [],
        affectedContractFields: ['data.strategy', 'data.reasoning'],
        decisionAuthoritiesPreserved: {
          objective: bothEnabled.decisions.objective.authority,
          funnel: bothEnabled.decisions.funnel.authority,
          channels: bothEnabled.decisions.channels.authority,
          readiness: bothEnabled.readiness.authority,
        },
        safety: {
          generationMode: bothEnabled.generation_mode,
          externalActionsAllowed: bothEnabled.validation.external_actions_allowed,
          budgetSpendAllowed: bothEnabled.validation.budget_spend_allowed,
          reasoningCanMutateCdks: bothEnabled.reasoning.contract.safety.can_mutate_cdks,
          reasoningCanChangeBlueprint: bothEnabled.reasoning.contract.safety.can_change_blueprint,
          reasoningCanAuthorizeLaunch: bothEnabled.reasoning.contract.safety.can_authorize_launch,
        },
      },
    };
    const output = path.join(process.cwd(), 'tests/results/ai-layer-impact-audit.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    originalLog(JSON.stringify({ status: report.status, output, affectedCanonicalSections: report.impact.affectedCanonicalSections, affectedContractFields: report.impact.affectedContractFields }, null, 2));
  } finally {
    console.log = originalLog;
  }
}

void main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});

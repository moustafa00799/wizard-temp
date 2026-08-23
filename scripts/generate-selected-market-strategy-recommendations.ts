import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canonicalizeWizardInput } from "../src/lib/contracts/wizard-input";
import { buildBlueprintContractV3 } from "../src/lib/contracts/build-blueprint-contract-v3";
import { CDKSEngine } from "../src/lib/orchestrator/cdks-engine";
import {
  buildScopedStrategyContext,
  buildStrategyExperimentEnvelope,
} from "../src/lib/knowledge/strategy-context";
import { selectedMarketStrategySelections } from "../tests/fixtures/knowledge/selected-market-strategy-fixtures";

const outputPath = process.argv[2] ?? "/home/ubuntu/selected_market_strategy_recommendations_2026-08-23.json";

function loadFixture(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1", fileName), "utf8"));
}

function sha256(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const engine = new CDKSEngine();
  const fixtureByIndustry: Record<string, string> = {
    ecommerce_general: "EX-001_ecommerce-sales.json",
    education: "EX-005_education-leads.json",
  };
  const outputs = [];

  for (const selection of selectedMarketStrategySelections) {
    const fixture = loadFixture(fixtureByIndustry[selection.industry]);
    const input = canonicalizeWizardInput((fixture as { input: unknown }).input);
    const blueprint = await engine.generate(input);
    const beforeHash = sha256(blueprint);
    const baseContract = buildBlueprintContractV3(input, blueprint, fixture as { _fixture?: { scenario_id?: unknown; assumptions?: unknown[]; output_language?: unknown; currency?: unknown } });
    const context = buildScopedStrategyContext(selection);
    const envelope = buildStrategyExperimentEnvelope(input, blueprint, context);
    const afterHash = sha256(blueprint);
    assert.equal(beforeHash, afterHash, `Canonical Blueprint mutated for ${selection.market}/${selection.industry}`);

    outputs.push({
      scope: `${selection.market}/${selection.industry}`,
      fixture: fixtureByIndustry[selection.industry],
      blueprint_id: blueprint.blueprint_id,
      authority: {
        objective: baseContract.decisions.objective,
        funnel: baseContract.decisions.funnel,
        channels: baseContract.decisions.channels,
        readiness: baseContract.readiness,
      },
      experimental_blueprint: {
        blueprint_id: blueprint.blueprint_id,
        generation_mode: "blueprint_only",
        external_actions_allowed: false,
        budget_spend_allowed: false,
        canonical_blueprint_sha256_before: beforeHash,
        canonical_blueprint_sha256_after: afterHash,
        canonical_blueprint_mutated: false,
        strategy_recommendation: envelope.recommendation,
      },
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    reportType: "selected-market-strategy-recommendations",
    status: "advisory_only",
    globalMarketValidated: false,
    liveAiCalled: false,
    externalActionsAllowed: false,
    budgetSpendAllowed: false,
    note: "Generated from redacted deterministic fixtures; the report is an external experiment artifact and is not a launch or publishing instruction.",
    recommendations: outputs,
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ status: "PASS", outputPath, scopes: outputs.map((item) => item.scope), count: outputs.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

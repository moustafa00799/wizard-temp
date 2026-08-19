const fs = require("node:fs");
const path = require("node:path");

const fixturePath = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "wizard-inputs-v1",
  "EX-001_ecommerce-sales.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const baseUrl = process.env.V5_BASE_URL || "http://127.0.0.1:3001";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const payload = {
    ...fixture.input,
    ai_reasoning: {
      enabled: true,
      provider: "mock",
      mockScenario: "baseline",
    },
  };

  const response = await fetch(`${baseUrl}/api/generate/v5`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const envelope = await response.json();

  assert(response.ok, `v5 returned HTTP ${response.status}`);
  assert(envelope.status === "success", "v5 envelope must be successful");
  assert(envelope.version === "v5", "v5 envelope version is missing");
  assert(envelope.contract_version === "3.0", "Blueprint contract version is missing");
  assert(envelope.data && typeof envelope.data === "object", "v5 data contract is missing");
  assert(envelope.data.wizard_input === undefined, "server contract must not invent wizard_input");

  const reasoning = envelope.data.reasoning?.contract;
  assert(reasoning, "real v5 response must contain reasoning.contract");
  assert(reasoning.contract_version === "1.0", "reasoning contract version is missing");
  assert(reasoning.status === "completed", "reasoning must complete for baseline mock");
  assert(reasoning.grounding?.evidence_coverage_percent === 100, "reasoning must contain complete evidence grounding");
  assert(reasoning.safety?.can_mutate_cdks === false, "reasoning cannot mutate CDKS");
  assert(reasoning.safety?.can_change_blueprint === false, "reasoning cannot change Blueprint");
  assert(reasoning.safety?.can_authorize_launch === false, "reasoning cannot authorize launch");
  assert(reasoning.safety?.can_spend_budget === false, "reasoning cannot spend budget");
  assert(reasoning.safety?.external_actions_allowed === false, "external actions must remain disabled");
  assert(reasoning.safety?.budget_spend_allowed === false, "budget spending must remain disabled");

  console.log(JSON.stringify({
    flow: "wizard -> /api/generate/v5 -> blueprint envelope",
    fixture: fixture._fixture.scenario_id,
    status: envelope.status,
    version: envelope.version,
    contractVersion: envelope.contract_version,
    reasoningStatus: reasoning.status,
    evidenceCoveragePercent: reasoning.grounding.evidence_coverage_percent,
    claimCount: reasoning.claims?.length ?? 0,
    safety: reasoning.safety,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

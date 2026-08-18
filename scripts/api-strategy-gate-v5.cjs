const fs = require("node:fs");
const path = require("node:path");

const base = process.env.CDKS_BASE_URL || "http://127.0.0.1:3001";
const fixturePath = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1", "EX-001_ecommerce-sales.json");

async function post(payload) {
  const response = await fetch(`${base}/api/generate/v5`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { response, json: await response.json() };
}

(async () => {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const disabled = await post({ ...fixture, ai_strategy_builder: { enabled: false } });
  if (disabled.response.status !== 200) throw new Error(`disabled request failed: HTTP ${disabled.response.status}`);
  if (disabled.json.data.strategy.status !== "not_requested") throw new Error("disabled Strategy Builder must remain not_requested");
  if (disabled.json.data.validation.external_actions_allowed !== false || disabled.json.data.validation.budget_spend_allowed !== false) {
    throw new Error("disabled Strategy Builder opened a safety gate");
  }

  const nonBooleanOptIn = await post({ ...fixture, ai_strategy_builder: { enabled: "true" } });
  if (nonBooleanOptIn.response.status !== 200) throw new Error(`non-boolean request failed: HTTP ${nonBooleanOptIn.response.status}`);
  if (nonBooleanOptIn.json.data.strategy.status !== "not_requested") throw new Error("Strategy Builder must require boolean opt-in");
  if (nonBooleanOptIn.json.data.decisions.objective.authority !== "DECISION_POLICY") throw new Error("CDKS objective authority changed");
  if (nonBooleanOptIn.json.data.readiness.authority !== "READINESS_POLICY") throw new Error("readiness authority changed");

  console.log("Strategy Builder governance gate PASSED: opt-in required, CDKS authority preserved, external actions disabled");
})().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});

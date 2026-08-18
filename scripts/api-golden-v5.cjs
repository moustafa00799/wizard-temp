const fs = require("node:fs");
const path = require("node:path");

const base = process.env.CDKS_BASE_URL || "http://127.0.0.1:3001";
const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const files = fs.readdirSync(fixtureDir).filter((name) => /^EX-.*\.json$/.test(name)).sort();

async function post(file) {
  const payload = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
  const response = await fetch(`${base}/api/generate/v5`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  return { payload, response, json };
}

(async () => {
  if (files.length !== 10) throw new Error(`Expected 10 v5 fixtures, found ${files.length}`);
  for (const file of files) {
    const { payload, response, json } = await post(file);
    const data = json.data;
    const expected = payload.expected_v3;
    if (response.status !== 200) throw new Error(`${file}: HTTP ${response.status} ${JSON.stringify(json)}`);
    if (json.status !== "success" || json.version !== "v5" || json.contract_version !== "3.0") throw new Error(`${file}: invalid v5 envelope`);
    if (!data || data.contract_version !== "3.0" || data.generation_mode !== "blueprint_only") throw new Error(`${file}: invalid v3 data envelope`);
    if (data.decisions.objective.value !== expected.decisions.objective.value) throw new Error(`${file}: objective mismatch`);
    if (data.decisions.funnel.value !== expected.decisions.funnel.value) throw new Error(`${file}: funnel mismatch`);
    if (JSON.stringify(data.decisions.channels.value) !== JSON.stringify(expected.decisions.channels.value)) throw new Error(`${file}: channel mismatch`);
    if (data.readiness.value !== expected.readiness.value) throw new Error(`${file}: readiness mismatch; expected ${expected.readiness.value}, got ${data.readiness.value}`);
    if (data.readiness.authority !== "READINESS_POLICY") throw new Error(`${file}: readiness authority mismatch`);
    if (data.strategy.status !== "not_requested" || data.reasoning.status !== "not_requested") throw new Error(`${file}: AI must remain disabled in Phase 1`);
    if (data.validation.canonical_field_count !== 41 || data.validation.schema_valid !== true) throw new Error(`${file}: validation summary mismatch`);
    if (data.validation.external_actions_allowed !== false || data.validation.budget_spend_allowed !== false) throw new Error(`${file}: safety gate opened`);
    if (!Array.isArray(data.provenance) || data.provenance.filter((entry) => entry.path.startsWith("source_wizard_input.")).length !== 41) throw new Error(`${file}: provenance field coverage mismatch`);
    console.log(`PASS ${file} objective=${data.decisions.objective.value} funnel=${data.decisions.funnel.value} readiness=${data.readiness.value} provenance=41`);
  }
  console.log(`v5 golden HTTP regression PASSED: ${files.length}/${files.length}`);
})().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});

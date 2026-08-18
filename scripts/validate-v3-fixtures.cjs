const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const files = fs.readdirSync(root).filter((name) => /^EX-.*\.json$/.test(name)).sort();
const validReadiness = new Set(["ready", "review", "blocked"]);
const validAuthorities = new Set(["DECISION_POLICY", "READINESS_POLICY"]);

if (files.length !== 10) throw new Error(`Expected 10 fixtures, found ${files.length}`);
for (const name of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
  const expected = payload.expected_v3;
  if (!expected) throw new Error(`${name}: missing expected_v3`);
  if (expected.contract_version !== "3.0") throw new Error(`${name}: unsupported contract version`);
  if (expected.generation_mode !== "blueprint_only") throw new Error(`${name}: unsafe generation mode`);
  for (const key of ["objective", "funnel", "channels"]) {
    const item = expected.decisions[key];
    if (!item || !validAuthorities.has(item.authority)) throw new Error(`${name}: invalid authority for ${key}`);
    if (!item.rule_id || !Array.isArray(item.evidence) || !Array.isArray(item.uncertainty)) {
      throw new Error(`${name}: incomplete decision trace for ${key}`);
    }
  }
  if (!validReadiness.has(expected.readiness.value)) throw new Error(`${name}: invalid readiness value`);
  if (expected.readiness.authority !== "READINESS_POLICY") throw new Error(`${name}: readiness authority must be READINESS_POLICY`);
  if (!expected.readiness.rule_id) throw new Error(`${name}: readiness rule missing`);
  if (!expected.validation.schema_valid || expected.validation.canonical_field_count !== 41) {
    throw new Error(`${name}: invalid validation summary`);
  }
  if (expected.validation.external_actions_allowed !== false || expected.validation.budget_spend_allowed !== false) {
    throw new Error(`${name}: Phase 1 safety gates must remain false`);
  }
  if (expected.strategy.status !== "not_requested" || expected.reasoning.status !== "not_requested") {
    throw new Error(`${name}: AI layers must remain disabled in Phase 1`);
  }
  if (!Array.isArray(expected.warnings) || expected.warnings.length === 0) throw new Error(`${name}: expected warnings missing`);
  for (const warning of expected.warnings) {
    if (!warning.code || !warning.message || !warning.action || !Array.isArray(warning.evidence)) {
      throw new Error(`${name}: incomplete warning`);
    }
  }
  if (!Array.isArray(expected.provenance) || expected.provenance.length < 41) {
    throw new Error(`${name}: provenance must cover all canonical fields and decisions`);
  }
  const fieldPaths = new Set(expected.provenance.filter((entry) => entry.path.startsWith("source_wizard_input.")).map((entry) => entry.path));
  if (fieldPaths.size !== 41) throw new Error(`${name}: provenance field coverage is ${fieldPaths.size}/41`);
}
console.log(`v3-fixtures=valid total=${files.length} expected_decisions=objective,funnel,channels readiness=validated provenance=validated safety=blueprint_only`);

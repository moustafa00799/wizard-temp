/*
 * Parity test for migration batch #1.
 * Compares the copied Next.js rule modules against the exact legacy modules
 * using the same input and the same readiness score.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const LEGACY = path.join(ROOT, "legacy");
const CURRENT_RULES = path.join(ROOT, "tests", "fixtures", "legacy-v1");

function loadTsFunction(file, exportName) {
  const source = fs.readFileSync(file, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  const runner = new Function("require", "module", "exports", transpiled);
  runner(require, module, module.exports);
  return module.exports[exportName];
}

const canonicalize = loadTsFunction(
  path.join(ROOT, "src", "lib", "contracts", "wizard-input.ts"),
  "canonicalizeWizardInput"
);

const sample = JSON.parse(
  fs.readFileSync(path.join(LEGACY, "examples", "sampleInput.json"), "utf8")
);
const canonical = canonicalize({
  ...sample,
  offer_description: "Sample offer",
  key_value_drivers: ["quality"],
  secondary_objectives: [],
  north_star_kpi: "roas",
  past_performance_notes: null,
  ideal_customer: "Sample audience",
  audience_segments: ["high_intent"],
  objections: ["price"],
  key_events: ["purchase"],
  top_priority: "increase_demand",
});

const legacyStrategy = require(path.join(LEGACY, "src/rules/strategyRules.js"));
const legacyBudget = require(path.join(LEGACY, "src/rules/budgetRules.js"));
const legacyRisk = require(path.join(LEGACY, "src/rules/riskRules.js"));
const legacyScorer = require(path.join(LEGACY, "src/engine/scorer.js"));

const currentStrategy = require(path.join(CURRENT_RULES, "strategyRules.js"));
const currentBudget = require(path.join(CURRENT_RULES, "budgetRules.js"));
const currentRisk = require(path.join(CURRENT_RULES, "riskRules.js"));

const readiness = legacyScorer.calculateReadinessScore(canonical).value;

function clean(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = clean(value[key]);
    return out;
  }
  if (Array.isArray(value)) return value.map(clean);
  return value;
}

function compare(name, expected, actual) {
  try {
    assert.deepStrictEqual(clean(actual), clean(expected));
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

// Strategy SS-001..SS-005
compare("SS-001", legacyStrategy.determineObjective(canonical), currentStrategy.determineObjective(canonical));
compare("SS-002", legacyStrategy.scoreChannels(canonical), currentStrategy.scoreChannels(canonical));
compare("SS-003", legacyStrategy.determineFunnel(canonical), currentStrategy.determineFunnel(canonical));
compare("SS-004", legacyStrategy.calculateConfidence(canonical, readiness), currentStrategy.calculateConfidence(canonical, readiness));
compare("SS-005", legacyStrategy.estimateTimeline(canonical, readiness), currentStrategy.estimateTimeline(canonical, readiness));

// Budget BS-001..BS-005
const legacyDaily = legacyBudget.mapDailyBudget(canonical);
const currentDaily = currentBudget.mapDailyBudget(canonical);
compare("BS-001", legacyDaily, currentDaily);
compare("BS-002", legacyBudget.allocateChannelBudget(canonical, legacyDaily.value), currentBudget.allocateChannelBudget(canonical, currentDaily.value));
compare("BS-003", legacyBudget.calculateTestBudget(canonical, legacyDaily.value), currentBudget.calculateTestBudget(canonical, currentDaily.value));
compare("BS-004", legacyBudget.calculateScaleBudget(canonical, legacyDaily.value), currentBudget.calculateScaleBudget(canonical, currentDaily.value));
compare("BS-005", legacyBudget.calculateCACTarget(canonical), currentBudget.calculateCACTarget(canonical));

// Risk RF-001, RF-003, RF-004
const legacyFlags = legacyRisk.detectCriticalFlags(canonical);
const currentFlags = currentRisk.detectCriticalFlags(canonical);
compare("RF-001", legacyFlags, currentFlags);
compare("RF-004", legacyRisk.calculateRiskScore(canonical), currentRisk.calculateRiskScore(canonical));
compare("RF-003", legacyRisk.generatePreLaunchFixes(canonical, legacyFlags), currentRisk.generatePreLaunchFixes(canonical, currentFlags));

if (process.exitCode) {
  console.error("\nParity test FAILED.");
  process.exit(process.exitCode);
}

console.log("\nParity test PASSED: migration batch #1 matches the legacy rule implementations.");
console.log(`Readiness score used by SS-004/SS-005: ${readiness}`);

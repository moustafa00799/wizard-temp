/**
 * Data Contract Audit — Governance-aware Phase A audit
 *
 * CanonicalWizardInput is the source of truth.
 * The legacy AIWizardPayload is a provider projection, not the governance contract.
 *
 * Default mode audits Phase A governance integrity and current boundaries.
 * --strict-migration additionally requires Strategy/Execution projections and
 * decision schemas once those migration phases are implemented.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const strictMigration = process.argv.includes("--strict-migration");

function read(file) {
  const full = path.join(ROOT, file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function interfaceFields(source, name) {
  if (!source) return [];
  const block = source.match(
    new RegExp(`(?:interface|type)\\s+${name}\\s*(?:=\\s*)?\\{([\\s\\S]*?)\\n\\}`, "m")
  )?.[1] || "";
  return [...block.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*[?:]/gm)].map((m) => m[1]);
}

function canonicalRegistry(source) {
  const block = source?.match(/CANONICAL_WIZARD_FIELDS\s*=\s*\[([\s\S]*?)\]\s*as const;/)?.[1] || "";
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function parseGovernance(source) {
  if (!source) return { rows: [], dispositions: [], malformed: true };
  const table = source.match(
    /\| Canonical field \| Strategy \| Execution \| Rules \| Blueprint \| Disposition \|\n\|---\|---\|---\|---\|---\|---\|\n([\s\S]*?)(?=\n## |$)/
  )?.[1] || "";
  const rows = [];
  for (const line of table.split("\n")) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (m) rows.push({ field: m[1].trim(), strategy: m[2].trim(), execution: m[3].trim(), rules: m[4].trim(), blueprint: m[5].trim(), disposition: m[6].trim() });
  }
  return { rows, dispositions: [...new Set(rows.map((r) => r.disposition))], malformed: rows.length === 0 };
}

function fileExists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function projectionFields(file, typeNames) {
  const source = read(file);
  if (!source) return { exists: false, fields: [] };
  for (const name of typeNames) {
    const fields = interfaceFields(source, name);
    if (fields.length) return { exists: true, fields };
  }
  return { exists: true, fields: [] };
}

const contract = read("src/lib/contracts/wizard-input.ts");
const governance = read("CONTRACT_GOVERNANCE.md");
const aiTypes = read("src/lib/ai-types.ts");
const mapper = read("src/lib/wizard-mapper.ts");
const route = read("src/app/api/generate/route.ts");
const blueprintTypes = read("src/lib/blueprint-types.ts");
const backfill = read("src/lib/blueprint-backfill.ts");
const validator = read("src/lib/ai-validator.ts");

const canonicalFields = canonicalRegistry(contract);
const canonicalInterface = interfaceFields(contract, "CanonicalWizardInput");
const aiFields = interfaceFields(aiTypes, "AIWizardPayload");
const gov = parseGovernance(governance);

if (!canonicalFields.length) throw new Error("Cannot read CANONICAL_WIZARD_FIELDS");
if (!canonicalInterface.length) throw new Error("Cannot read CanonicalWizardInput");
if (!governance) throw new Error("CONTRACT_GOVERNANCE.md is missing");
if (gov.malformed) throw new Error("Could not parse the Governance ownership matrix");

const canonicalSet = new Set(canonicalFields);
const govFields = gov.rows.map((r) => r.field);
const govSet = new Set(govFields);
const duplicateGovFields = govFields.filter((f, i) => govFields.indexOf(f) !== i);
const undeclaredCanonical = canonicalFields.filter((f) => !govSet.has(f));
const phantomGovernance = govFields.filter((f) => !canonicalSet.has(f));
const invalidDispositions = gov.rows.filter((r) =>
  ![
    "strategy_required",
    "execution_required",
    "strategy_context",
    "execution_context",
    "rules_input",
    "blueprint_preserve",
    "metadata_only",
    "derived",
    "excluded",
  ].includes(r.disposition)
);

const strategyRequired = gov.rows.filter((r) => r.disposition === "strategy_required").map((r) => r.field);
const executionRequired = gov.rows.filter((r) => r.disposition === "execution_required").map((r) => r.field);

const strategyProjection = projectionFields("src/lib/strategy-contracts.ts", ["StrategyAIInput"]);
const executionProjection = projectionFields("src/lib/execution-contracts.ts", ["ExecutionAIInput"]);
const strategyDecision = projectionFields("src/lib/strategy-contracts.ts", ["StrategyDecision"]);
const executionDecision = projectionFields("src/lib/execution-contracts.ts", ["ExecutionDecision"]);

const strategyMissing = strategyProjection.fields.length
  ? strategyRequired.filter((f) => !strategyProjection.fields.includes(f))
  : strategyRequired;
const executionMissing = executionProjection.fields.length
  ? executionRequired.filter((f) => !executionProjection.fields.includes(f))
  : executionRequired;

const mapperCanonicalRefs = canonicalFields.filter((f) => mapper && new RegExp(`\\braw\\.${f}\\b`).test(mapper));
const legacyMapperCoverage = mapperCanonicalRefs.length;
const routeUsesCanonical =
  !!route &&
  /canonicalizeWizardInput\(body\)/.test(route) &&
  /mapToAIWizardPayload\(canonicalWizard\)/.test(route);
const rulesCanonical = !!blueprintTypes && /CanonicalWizardInput\s+as\s+WizardPayload/.test(blueprintTypes);
const blueprintPreservation =
  (!!blueprintTypes && /wizard_input\s*\??\s*:/.test(blueprintTypes)) ||
  (!!backfill && /wizard_input\s*:/.test(backfill));
const validatorPresent = !!validator;

const governanceShapePass =
  gov.rows.length === canonicalFields.length &&
  undeclaredCanonical.length === 0 &&
  phantomGovernance.length === 0 &&
  duplicateGovFields.length === 0 &&
  invalidDispositions.length === 0;

const migrationProjectionStatus = {
  strategy: strategyProjection.exists && strategyProjection.fields.length ? (strategyMissing.length === 0 ? "PASS" : "FAIL") : "PENDING",
  execution: executionProjection.exists && executionProjection.fields.length ? (executionMissing.length === 0 ? "PASS" : "FAIL") : "PENDING",
  strategyDecision: strategyDecision.exists && strategyDecision.fields.length ? "PASS" : "PENDING",
  executionDecision: executionDecision.exists && executionDecision.fields.length ? "PASS" : "PENDING",
};

const checks = [
  ["Canonical contract shape", canonicalFields.length === canonicalInterface.length && canonicalFields.every((f) => canonicalInterface.includes(f))],
  ["Governance coverage", governanceShapePass],
  ["Governance dispositions valid", invalidDispositions.length === 0],
  ["Wizard -> Canonical", canonicalFields.length === canonicalInterface.length],
  ["Canonical -> legacy AI projection", legacyMapperCoverage > 0],
  ["Canonical -> Rules engine", rulesCanonical],
  ["Canonical -> Blueprint preservation", blueprintPreservation],
  ["AI boundary validator exists", validatorPresent],
  ["Route uses canonical pipeline", routeUsesCanonical],
];

const hardFailures = checks.filter(([, pass]) => !pass);
if (strictMigration) {
  if (migrationProjectionStatus.strategy === "FAIL") hardFailures.push(["Strategy projection coverage", false]);
  if (migrationProjectionStatus.execution === "FAIL") hardFailures.push(["Execution projection coverage", false]);
  if (migrationProjectionStatus.strategy === "PENDING") hardFailures.push(["Strategy projection implemented", false]);
  if (migrationProjectionStatus.execution === "PENDING") hardFailures.push(["Execution projection implemented", false]);
  if (migrationProjectionStatus.strategyDecision === "PENDING") hardFailures.push(["StrategyDecision schema implemented", false]);
  if (migrationProjectionStatus.executionDecision === "PENDING") hardFailures.push(["ExecutionDecision schema implemented", false]);
}

console.log("DATA CONTRACT AUDIT — GOVERNANCE AWARE");
console.log("=======================================");
console.log(`Canonical fields: ${canonicalFields.length}`);
console.log(`AI payload fields: ${aiFields.length}`);
console.log(`Governance rows: ${gov.rows.length}`);
console.log(`Mode: ${strictMigration ? "strict migration" : "Phase A"}`);
console.log("");
for (const [name, pass] of checks) console.log(`${name}: ${pass ? "PASS" : "FAIL"}`);
console.log("");
console.log(`StrategyAIInput: ${migrationProjectionStatus.strategy}`);
console.log(`ExecutionAIInput: ${migrationProjectionStatus.execution}`);
console.log(`StrategyDecision: ${migrationProjectionStatus.strategyDecision}`);
console.log(`ExecutionDecision: ${migrationProjectionStatus.executionDecision}`);
console.log("");

function report(title, values) {
  if (!values.length) return;
  console.log(title);
  for (const value of values) console.log(`- ${value}`);
  console.log("");
}

report("Canonical fields missing from Governance:", undeclaredCanonical);
report("Governance fields not in Canonical contract:", phantomGovernance);
report("Duplicate Governance fields:", [...new Set(duplicateGovFields)]);
report("Invalid Governance dispositions:", invalidDispositions.map((r) => `${r.field}: ${r.disposition}`));
if (strategyProjection.fields.length) report("Strategy projection missing required fields:", strategyMissing);
if (executionProjection.fields.length) report("Execution projection missing required fields:", executionMissing);

const md = [
  "# Data Contract Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Mode: **${strictMigration ? "strict migration" : "Phase A"}**`,
  "",
  "## Summary",
  "",
  `- Canonical fields: **${canonicalFields.length}**`,
  `- Legacy AIWizardPayload fields: **${aiFields.length}**`,
  ...checks.map(([name, pass]) => `- ${name}: **${pass ? "PASS" : "FAIL"}**`),
  `- StrategyAIInput: **${migrationProjectionStatus.strategy}**`,
  `- ExecutionAIInput: **${migrationProjectionStatus.execution}**`,
  `- StrategyDecision: **${migrationProjectionStatus.strategyDecision}**`,
  `- ExecutionDecision: **${migrationProjectionStatus.executionDecision}**`,
  "",
  "## Governance Policy",
  "",
  "The legacy AIWizardPayload is not required to contain every canonical field. Canonical fields marked context, metadata, or derived may legitimately be absent from a provider payload.",
  "",
  "## Governance Matrix",
  "",
  "| Canonical field | Strategy | Execution | Rules | Blueprint | Disposition |",
  "|---|---|---|---|---|---|",
  ...gov.rows.map((r) => `| \`${r.field}\` | ${r.strategy} | ${r.execution} | ${r.rules} | ${r.blueprint} | \`${r.disposition}\` |`),
  "",
  "## Migration Notes",
  "",
  "StrategyAIInput, ExecutionAIInput, StrategyDecision, and ExecutionDecision are intentionally reported as PENDING in Phase A until their migration phase creates them. Use --strict-migration only when enforcing migration completeness.",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "DATA_CONTRACT_AUDIT.md"), md);

if (hardFailures.length) {
  console.error(`\nAudit FAILED: ${hardFailures.length} blocking check(s).`);
  process.exit(1);
}

console.log(`\nAudit PASSED: Phase A governance is valid across all ${canonicalFields.length} canonical fields.`);
console.log("Report written to DATA_CONTRACT_AUDIT.md");

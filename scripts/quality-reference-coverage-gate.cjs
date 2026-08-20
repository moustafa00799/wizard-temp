const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(ROOT, 'tests', 'fixtures', 'wizard-inputs-v1');
const REFERENCE_DIR = path.join(ROOT, 'tests', 'fixtures', 'reference-blueprints');
const BASE_URL = process.env.CDKS_BASE_URL || 'http://127.0.0.1:3001';
const STRICT = process.env.COVERAGE_GATE_STRICT === 'true';
const APPROVED_BRANCHES = ['local_service', 'ecommerce', 'app', 'b2b'];
const TARGET_LOCALES = ['ar', 'en'];
const TARGET_CURRENCIES = ['EGP', 'SAR', 'USD'];
const TARGET_READINESS = ['ready', 'review', 'blocked'];
const READINESS_BASELINE = { before: 1, after: 3 };
const REFERENCE_SECTION_BASELINE = { full: 10, missing: 0 };

const REFERENCE_SECTION_MAP = [
  { reference: 'executive_summary', current: 'executive_summary', mode: 'structural' },
  { reference: 'strategy_summary', current: 'strategy', mode: 'structural' },
  { reference: 'recommended_funnel', current: 'strategy.recommended_funnel', mode: 'structural', note: 'Canonical strategy now exposes the staged funnel object explicitly.' },
  { reference: 'campaign_structure', current: 'execution.campaign_structure', mode: 'structural' },
  { reference: 'audience_structure', current: 'execution.audience_structure', mode: 'structural' },
  { reference: 'audience_analysis', current: 'execution.audience_analysis', mode: 'structural', note: 'Canonical v3.1 exposes size, overlap, and frequency analysis.' },
  { reference: 'creative_strategy', current: 'execution.creative_strategy', mode: 'structural', note: 'Canonical v3.1 separates creative format, refresh, and social-proof strategy from execution angles.' },
  { reference: 'tracking_assessment', current: 'execution.tracking_assessment', mode: 'structural', note: 'Canonical v3.1 exposes a detailed diagnostic assessment alongside the setup checklist.' },
  { reference: 'launch_plan', current: 'execution.launch_plan', mode: 'structural' },
  { reference: 'monitoring', reference_path: 'monitoring.post_launch_plan', current: 'governance.monitoring_plan.post_launch_plan', mode: 'structural' },
  { reference: 'budget_management', reference_path: 'budget_management', current: 'governance.monitoring_plan.budget_management', mode: 'structural' },
  { reference: 'testing', reference_path: 'testing.ab_test_plan', current: 'governance.monitoring_plan.testing_plan.ab_test_plan', mode: 'structural' },
  { reference: 'benchmarks', reference_path: 'benchmarks', current: 'governance.monitoring_plan.testing_plan.benchmarks', mode: 'structural' },
  { reference: 'market_context', reference_path: 'market_context', current: 'governance.monitoring_plan.testing_plan.market_context', mode: 'structural' },
  { reference: 'platform_guides', reference_path: 'platform_guides', current: 'governance.monitoring_plan.testing_plan.platform_guides', mode: 'structural' },
  { reference: 'compliance', reference_path: 'compliance', current: 'governance.monitoring_plan.testing_plan.compliance', mode: 'structural' },
  { reference: 'technical_audit', reference_path: 'technical_audit', current: 'governance.monitoring_plan.testing_plan.technical_audit', mode: 'structural' },
  { reference: 'offer_strategy', current: 'execution.offer_strategy', mode: 'structural' },
  { reference: 'budget_split', current: 'execution.budget_split', mode: 'structural' },
  { reference: 'creative_angles', current: 'execution.creative_angles', mode: 'structural' },
  { reference: 'tracking_checklist', current: 'execution.tracking_checklist', mode: 'structural' },
  { reference: 'risk_flags', current: 'governance.risk_flags', mode: 'structural' },
  { reference: 'first_14_days_plan', reference_path: 'launch_plan.detailed_timeline', current: 'execution.launch_plan.detailed_timeline', mode: 'structural', note: 'Reference launch_plan.detailed_timeline is compared with the canonical detailed timeline.' },
  { reference: 'pre_launch_fixes', reference_path: 'launch_plan.pre_launch_checklist', current: 'execution.launch_plan.pre_launch_checklist', mode: 'structural', note: 'Reference launch_plan.pre_launch_checklist is compared with the canonical pre-launch checklist.' },
  { reference: 'flags', current: 'flags', mode: 'structural' },
  { reference: 'debug', current: 'telemetry', mode: 'semantic', note: 'v3 exposes execution time and rule count as telemetry; the reference also has scores_breakdown.' },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readCanonicalFields() {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'contracts', 'wizard-input.ts'), 'utf8');
  const block = source.match(/export const CANONICAL_WIZARD_FIELDS = \[(.*?)\] as const;/s)?.[1] || '';
  const fields = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (fields.length !== 41) throw new Error(`Expected 41 canonical fields, found ${fields.length}`);
  return fields;
}

function getPath(value, dottedPath) {
  return dottedPath.split('.').reduce((current, key) => {
    if (!current || typeof current !== 'object' || !(key in current)) return undefined;
    return current[key];
  }, value);
}

function leafPaths(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return prefix ? [prefix] : [];
  const entries = Object.entries(value);
  if (!entries.length) return prefix ? [prefix] : [];
  return entries.flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function relativeLeafPaths(value) {
  return leafPaths(value).filter(Boolean);
}

function normalizedReferenceLeafPaths(value) {
  return relativeLeafPaths(value).map((item) => item.replace(/(^|\\.)value(?=\\.|$)/g, '').replace(/^\\./, '')).filter(Boolean);
}

function countBy(values) {
  return values.reduce((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function percentage(numerator, denominator) {
  return denominator === 0 ? 0 : Number(((numerator / denominator) * 100).toFixed(2));
}

function validateFixtureContract(file, payload, data, fields) {
  const expected = payload.expected_v3;
  const checks = [];
  checks.push(['HTTP envelope', data?.contract_version === '3.0' && data?.generation_mode === 'blueprint_only']);
  checks.push(['objective parity', data?.decisions?.objective?.value === expected?.decisions?.objective?.value]);
  checks.push(['funnel parity', data?.decisions?.funnel?.value === expected?.decisions?.funnel?.value]);
  checks.push(['channel parity', JSON.stringify(data?.decisions?.channels?.value) === JSON.stringify(expected?.decisions?.channels?.value)]);
  checks.push(['readiness parity', data?.readiness?.value === expected?.readiness?.value]);
  checks.push(['schema validation', data?.validation?.schema_valid === true]);
  checks.push(['canonical field count', data?.validation?.canonical_field_count === fields.length]);
  checks.push(['external actions blocked', data?.validation?.external_actions_allowed === false]);
  checks.push(['budget spend blocked', data?.validation?.budget_spend_allowed === false]);
  checks.push(['AI proposal-only phase', data?.strategy?.status === 'not_requested' && data?.reasoning?.status === 'not_requested']);
  const provenancePaths = new Set((data?.provenance || []).map((entry) => entry.path));
  const missingFields = fields.filter((field) => !provenancePaths.has(`source_wizard_input.${field}`));
  checks.push(['41-field provenance', missingFields.length === 0]);
  return {
    file,
    scenario_id: payload._fixture?.scenario_id,
    passed: checks.every(([, passed]) => passed),
    checks: Object.fromEntries(checks),
    missing_provenance_fields: missingFields,
    blueprint: data?.blueprint,
  };
}

async function postFixture(file) {
  const payload = readJson(path.join(FIXTURE_DIR, file));
  const response = await fetch(`${BASE_URL}/api/generate/v5`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (response.status !== 200) throw new Error(`${file}: HTTP ${response.status} ${JSON.stringify(json)}`);
  return { payload, json };
}

function referenceSectionCoverage(referenceFiles, blueprints) {
  return REFERENCE_SECTION_MAP.map((mapping) => {
    const referenceValues = referenceFiles.map((file) => getPath(readJson(path.join(REFERENCE_DIR, file)), mapping.reference_path || mapping.reference));
    const referenceSuffixes = [...new Set(referenceValues.flatMap(normalizedReferenceLeafPaths))];
    if (mapping.mode === 'missing' || !mapping.current) {
      return {
        reference_section: mapping.reference,
        current_path: null,
        status: 'missing',
        reference_leaf_fields: referenceSuffixes.length,
        covered_leaf_fields: 0,
        coverage_percent: 0,
        note: mapping.note,
      };
    }
    const currentValues = blueprints.map((blueprint) => getPath(blueprint, mapping.current));
    const currentSuffixes = [...new Set(currentValues.flatMap(relativeLeafPaths))];
    const covered = referenceSuffixes.filter((suffix) => currentSuffixes.includes(suffix));
    const structuralPercent = percentage(covered.length, referenceSuffixes.length);
    const status = mapping.mode === 'semantic'
      ? (currentValues.every((value) => value !== undefined) ? 'partial' : 'missing')
      : (structuralPercent === 100 ? 'full' : structuralPercent > 0 ? 'partial' : 'missing');
    return {
      reference_section: mapping.reference,
      current_path: `blueprint.${mapping.current}`,
      status,
      reference_leaf_fields: referenceSuffixes.length,
      covered_leaf_fields: covered.length,
      coverage_percent: structuralPercent,
      note: mapping.note || null,
    };
  });
}

function buildMarkdownReport(report) {
  const lines = [
    '# Quality and Reference Coverage Gate',
    '',
    `Generated: ${report.generated_at}`,
    `Base URL: \`${report.base_url}\``,
    '',
    `## Result: **${report.status}**`,
    '',
    'The gate is deterministic and uses only local fixtures, the local `/api/generate/v5` endpoint, the canonical TypeScript contract, and the two checked-in reference blueprints. It does not call any AI provider.',
    '',
    '## Summary',
    '',
    '| Measure | Result |',
    '|---|---:|',
    `| Fixture API contract checks | ${report.fixture_summary.passed}/${report.fixture_summary.total} PASS |`,
    `| Canonical Wizard fields | ${report.field_coverage.present}/${report.field_coverage.expected} (${report.field_coverage.percent}%) |`,
    `| Approved branch coverage | ${report.branch_coverage.present}/${report.branch_coverage.expected} (${report.branch_coverage.percent}%) |`,
    `| Locale coverage | ${report.locale_coverage.present}/${report.locale_coverage.expected} (${report.locale_coverage.percent}%) |`,
    `| Currency coverage | ${report.currency_coverage.present}/${report.currency_coverage.expected} (${report.currency_coverage.percent}%) |`,
    `| Readiness states before confirmation | ${report.readiness.before_present}/${report.readiness.expected} (${report.readiness.before_percent}%) |`,
    `| Readiness states after confirmation | ${report.readiness.after_present}/${report.readiness.expected} (${report.readiness.after_percent}%) |`,
    `| Reference section structural coverage | ${report.reference_summary.full}/${report.reference_summary.total} full; ${report.reference_summary.partial} partial; ${report.reference_summary.missing} missing |`,
    '',
    '## Fixture Matrix',
    '',
    '| Scenario | Branch | Locale | Currency | Readiness before | Readiness after | API contract |',
    '|---|---|---|---|---|---|---|',
    ...report.fixtures.map((item) => {
      const input = item.payload.input;
      const meta = item.payload._fixture;
      const expected = item.payload.expected_v3?.expected_outcomes || {};
      return `| ${meta.scenario_id} | ${input.business_type} | ${meta.output_language} | ${meta.currency} | ${expected.readiness_before_confirmation} | ${expected.readiness_after_confirmation} | ${item.passed ? 'PASS' : 'FAIL'} |`;
    }),
    '',
    '## Reference Coverage',
    '',
    '| Reference section | Current v3 path | Status | Leaf fields covered | Structural coverage |',
    '|---|---|---|---:|---:|',
    ...report.reference_sections.map((item) => `| ${item.reference_section} | ${item.current_path || '—'} | ${item.status} | ${item.covered_leaf_fields}/${item.reference_leaf_fields} | ${item.coverage_percent}% |`),
    '',
    '## Gaps and Recommendations',
    '',
    ...report.gaps.map((gap) => `- **${gap.category}:** ${gap.message} ${gap.recommendation}`),
    '',
    '## Regression Policy',
    '',
    'The default gate fails on contract regressions: missing canonical fields, failed v5 parity, opened safety gates, missing provenance, or a reduction in approved branches/locales/currencies compared with the required baseline. Existing reference-parity gaps and readiness diversity gaps are reported as quality findings so the repository can remain green while the next contract iteration is planned.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function main() {
  const fields = readCanonicalFields();
  const files = fs.readdirSync(FIXTURE_DIR).filter((name) => /^EX-.*\.json$/.test(name)).sort();
  if (files.length !== 10) throw new Error(`Expected 10 fixtures, found ${files.length}`);
  const results = [];
  for (const file of files) {
    const { payload, json } = await postFixture(file);
    const result = validateFixtureContract(file, payload, json.data, fields);
    results.push({ ...result, payload });
  }

  const inputs = results.map((item) => item.payload.input);
  const metas = results.map((item) => item.payload._fixture);
  const blueprints = results.map((item) => item.blueprint);
  const fieldPresence = fields.filter((field) => inputs.every((input) => Object.prototype.hasOwnProperty.call(input, field)));
  const branches = [...new Set(inputs.map((input) => input.business_type))];
  const locales = [...new Set(metas.map((meta) => meta.output_language))];
  const currencies = [...new Set(metas.map((meta) => meta.currency))];
  const before = [...new Set(results.map((item) => item.payload.expected_v3?.expected_outcomes?.readiness_before_confirmation))];
  const after = [...new Set(results.map((item) => item.payload.expected_v3?.expected_outcomes?.readiness_after_confirmation))];
  const referenceFiles = ['ecommerce.json', 'local_service.json'];
  const referenceSections = referenceSectionCoverage(referenceFiles, blueprints);

  const gaps = [];
  const missingBranches = APPROVED_BRANCHES.filter((branch) => !branches.includes(branch));
  const missingLocales = TARGET_LOCALES.filter((locale) => !locales.includes(locale));
  const missingCurrencies = TARGET_CURRENCIES.filter((currency) => !currencies.includes(currency));
  const missingBefore = TARGET_READINESS.filter((state) => !before.includes(state));
  const missingAfter = TARGET_READINESS.filter((state) => !after.includes(state));
  if (missingBranches.length) gaps.push({ category: 'Branch coverage', message: `Missing approved branches: ${missingBranches.join(', ')}.`, recommendation: 'Add at least one fixture per approved branch before expanding the AI benchmark matrix.' });
  if (missingLocales.length) gaps.push({ category: 'Locale coverage', message: `Missing locales: ${missingLocales.join(', ')}.`, recommendation: 'Add fixture coverage before treating bilingual output as fully regression-tested.' });
  if (missingCurrencies.length) gaps.push({ category: 'Currency coverage', message: `Missing currencies: ${missingCurrencies.join(', ')}.`, recommendation: 'Add a fixture for every supported currency in the primary branch set.' });
  if (missingBefore.length) gaps.push({ category: 'Readiness before confirmation', message: `Missing v3 readiness states: ${missingBefore.join(', ')}.`, recommendation: 'Add confirmed fixtures or controlled readiness variants; all current fixtures are intentionally unconfirmed and therefore blocked.' });
  if (missingAfter.length) gaps.push({ category: 'Readiness after confirmation', message: `Missing v3 readiness states: ${missingAfter.join(', ')}.`, recommendation: 'Add fixtures whose tracking, assets, and content capacity produce ready and blocked outcomes after confirmation.' });
  const missingReference = referenceSections.filter((item) => item.status === 'missing');
  if (missingReference.length) gaps.push({ category: 'Reference parity', message: `${missingReference.length} reference sections are not represented in v3: ${missingReference.map((item) => item.reference_section).join(', ')}.`, recommendation: 'Address these as explicit v4/v3.1 contract extensions rather than hiding them inside untyped blobs.' });
  const partialReference = referenceSections.filter((item) => item.status === 'partial');
  if (partialReference.length) gaps.push({ category: 'Reference parity', message: `${partialReference.length} reference sections are only semantically or structurally partial: ${partialReference.map((item) => item.reference_section).join(', ')}.`, recommendation: 'Add explicit fields or mapping documentation where the current v3 shape intentionally differs.' });

  const fixtureFailures = results.filter((item) => !item.passed);
  const regressionFailures = [
    fixtureFailures.length ? `${fixtureFailures.length} fixture API contract checks failed` : null,
    fieldPresence.length !== fields.length ? `canonical field coverage dropped to ${fieldPresence.length}/${fields.length}` : null,
    missingBranches.length ? `approved branch baseline missing: ${missingBranches.join(', ')}` : null,
    missingLocales.length ? `locale baseline missing: ${missingLocales.join(', ')}` : null,
    missingCurrencies.length ? `currency baseline missing: ${missingCurrencies.join(', ')}` : null,
    TARGET_READINESS.filter((state) => before.includes(state)).length < READINESS_BASELINE.before ? `readiness-before coverage regressed below ${READINESS_BASELINE.before} state(s)` : null,
    TARGET_READINESS.filter((state) => after.includes(state)).length < READINESS_BASELINE.after ? `readiness-after coverage regressed below ${READINESS_BASELINE.after} state(s)` : null,
    referenceSections.filter((item) => item.status === 'full').length < REFERENCE_SECTION_BASELINE.full ? `full reference-section coverage regressed below ${REFERENCE_SECTION_BASELINE.full} section(s)` : null,
    referenceSections.filter((item) => item.status === 'missing').length > REFERENCE_SECTION_BASELINE.missing ? `missing reference-section count regressed above ${REFERENCE_SECTION_BASELINE.missing}` : null,
  ].filter(Boolean);
  const strictFindings = [
    missingBefore.length ? `readiness before-confirmation diversity incomplete: ${missingBefore.join(', ')}` : null,
    missingAfter.length ? `readiness after-confirmation diversity incomplete: ${missingAfter.join(', ')}` : null,
    missingReference.length ? `reference sections missing: ${missingReference.map((item) => item.reference_section).join(', ')}` : null,
  ].filter(Boolean);

  const report = {
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    status: regressionFailures.length ? 'FAIL' : (strictFindings.length ? 'PASS_WITH_GAPS' : 'PASS'),
    fixtures: results,
    fixture_summary: { total: results.length, passed: results.length - fixtureFailures.length, failed: fixtureFailures.length },
    field_coverage: { expected: fields.length, present: fieldPresence.length, percent: percentage(fieldPresence.length, fields.length) },
    branch_coverage: { expected: APPROVED_BRANCHES.length, present: APPROVED_BRANCHES.filter((branch) => branches.includes(branch)).length, percent: percentage(APPROVED_BRANCHES.filter((branch) => branches.includes(branch)).length, APPROVED_BRANCHES.length), observed: countBy(inputs.map((input) => input.business_type)) },
    locale_coverage: { expected: TARGET_LOCALES.length, present: TARGET_LOCALES.filter((locale) => locales.includes(locale)).length, percent: percentage(TARGET_LOCALES.filter((locale) => locales.includes(locale)).length, TARGET_LOCALES.length), observed: countBy(metas.map((meta) => meta.output_language)) },
    currency_coverage: { expected: TARGET_CURRENCIES.length, present: TARGET_CURRENCIES.filter((currency) => currencies.includes(currency)).length, percent: percentage(TARGET_CURRENCIES.filter((currency) => currencies.includes(currency)).length, TARGET_CURRENCIES.length), observed: countBy(metas.map((meta) => meta.currency)) },
    readiness: { expected: TARGET_READINESS.length, before_present: TARGET_READINESS.filter((state) => before.includes(state)).length, before_percent: percentage(TARGET_READINESS.filter((state) => before.includes(state)).length, TARGET_READINESS.length), before_observed: countBy(results.map((item) => item.payload.expected_v3?.expected_outcomes?.readiness_before_confirmation)), after_present: TARGET_READINESS.filter((state) => after.includes(state)).length, after_percent: percentage(TARGET_READINESS.filter((state) => after.includes(state)).length, TARGET_READINESS.length), after_observed: countBy(results.map((item) => item.payload.expected_v3?.expected_outcomes?.readiness_after_confirmation)) },
    reference_summary: { total: referenceSections.length, full: referenceSections.filter((item) => item.status === 'full').length, partial: referenceSections.filter((item) => item.status === 'partial').length, missing: referenceSections.filter((item) => item.status === 'missing').length },
    reference_sections: referenceSections,
    gaps,
    regression_failures: regressionFailures,
    strict_findings: strictFindings,
  };

  fs.writeFileSync(path.join(ROOT, 'QUALITY_REFERENCE_COVERAGE_GATE.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, 'QUALITY_REFERENCE_COVERAGE_GATE.md'), buildMarkdownReport(report));
  console.log(JSON.stringify({
    status: report.status,
    totalFixtures: report.fixture_summary.total,
    passedFixtures: report.fixture_summary.passed,
    failedFixtures: report.fixture_summary.failed,
    fieldCoverage: report.field_coverage,
    branchCoverage: report.branch_coverage,
    localeCoverage: report.locale_coverage,
    currencyCoverage: report.currency_coverage,
    readiness: report.readiness,
    referenceSummary: report.reference_summary,
    reportPath: 'QUALITY_REFERENCE_COVERAGE_GATE.md',
  }, null, 2));
  if (regressionFailures.length || (STRICT && strictFindings.length)) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});

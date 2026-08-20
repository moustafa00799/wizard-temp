const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REFERENCE_DIR = path.join(ROOT, 'tests', 'fixtures', 'reference-blueprints');
const OUTPUT_JSON = path.join(ROOT, 'docs', 'reference-parity-manifest.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'REFERENCE_PARITY_MANIFEST.md');

const definitions = [
  {
    id: 'executive_summary', status: 'full', priority: 'baseline', referencePath: 'executive_summary', canonicalPath: 'executive_summary',
    sourceFields: ['primary_objective', 'budget_band', 'tracking_status'], authority: 'CDKS', rules: ['RF-001', 'RF-004'],
    assertions: ['readiness and risk fields are present', 'launch recommendation respects readiness blockers'], ui: 'ExecutiveSummarySection',
  },
  {
    id: 'strategy_summary', status: 'partial', priority: 'P0', referencePath: 'strategy_summary', canonicalPath: 'strategy',
    sourceFields: ['primary_objective', 'ad_channels', 'campaign_direction', 'business_type', 'tracking_status', 'creative_assets'], authority: 'CDKS', rules: ['RF-001', 'RF-002', 'RF-003', 'RF-004'],
    assertions: ['recommended objective has value/confidence/reasoning/rule_id', 'recommended channels use value array and scores', 'funnel type and timeline agree with objective', 'confidence breakdown is internally consistent'], ui: 'StrategySummarySection',
  },
  {
    id: 'recommended_funnel', status: 'full', priority: 'baseline', referencePath: 'recommended_funnel', canonicalPath: 'strategy.recommended_funnel',
    sourceFields: ['primary_objective', 'campaign_direction', 'budget_band'], authority: 'CDKS', rules: ['RF-003', 'RF-012'],
    assertions: ['stages are ordered', 'budget ratios sum to 1', 'stage KPIs agree with objective'], ui: 'StrategySummarySection',
  },
  {
    id: 'campaign_structure', status: 'full', priority: 'baseline', referencePath: 'campaign_structure', canonicalPath: 'execution.campaign_structure',
    sourceFields: ['business_type', 'primary_objective', 'ad_channels', 'campaign_direction'], authority: 'CDKS', rules: ['RF-005'], assertions: ['campaign count and channel structure are consistent'], ui: 'CampaignStructureSection',
  },
  {
    id: 'audience_structure', status: 'full', priority: 'baseline', referencePath: 'audience_structure', canonicalPath: 'execution.audience_structure',
    sourceFields: ['ideal_customer', 'audience_segments', 'geo_scope', 'target_locations'], authority: 'CDKS', rules: ['RF-006'], assertions: ['segments and exclusions are disjoint where required'], ui: 'AudienceStructureSection',
  },
  {
    id: 'audience_analysis', status: 'partial', priority: 'P1', referencePath: 'audience_analysis', canonicalPath: 'execution.audience_analysis',
    sourceFields: ['geo_scope', 'target_locations', 'audience_segments', 'business_type', 'ad_channels'], authority: 'CDKS', rules: ['RF-006', 'RF-013', 'RF-014'],
    assertions: ['size range has label and applicability', 'overlap risk has recommendation', 'frequency thresholds are branch-aware', 'unknown market size is marked unavailable rather than fabricated'], ui: 'AudienceAnalysisSection',
  },
  {
    id: 'creative_strategy', status: 'full', priority: 'baseline', referencePath: 'creative_strategy', canonicalPath: 'execution.creative_strategy',
    sourceFields: ['creative_assets', 'content_capacity', 'sales_motion', 'awareness_level', 'business_type'], authority: 'CDKS', rules: ['RF-007', 'RF-015', 'RF-028'], assertions: ['asset readiness is not true when assets are absent'], ui: 'CreativeStrategySection',
  },
  {
    id: 'tracking_assessment', status: 'full', priority: 'baseline', referencePath: 'tracking_assessment', canonicalPath: 'execution.tracking_assessment',
    sourceFields: ['tracking_status', 'tracking_tools', 'key_events', 'conversion_model', 'conversion_destination'], authority: 'CDKS', rules: ['RF-008'], assertions: ['score matches tracking status', 'required events match conversion model', 'AI cannot clear a tracking blocker'], ui: 'TrackingAssessmentSection',
  },
  {
    id: 'launch_plan', status: 'partial', priority: 'P0', referencePath: 'launch_plan', canonicalPath: 'execution.launch_plan',
    sourceFields: ['build_mode', 'tracking_status', 'creative_assets', 'content_capacity', 'response_speed', 'constraints'], authority: 'CDKS', rules: ['RF-009', 'RF-010'],
    assertions: ['timeline days are monotonic', 'critical path references existing milestones', 'launch readiness is blocked by required failed checks', 'checklist counters equal item states'], ui: 'LaunchPlanSection',
  },
  {
    id: 'monitoring', status: 'partial', priority: 'P1', referencePath: 'monitoring', canonicalPath: 'governance.monitoring_plan.post_launch_plan',
    sourceFields: ['north_star_kpi', 'primary_objective', 'budget_band', 'max_cac', 'tracking_status'], authority: 'CDKS', rules: ['RF-018', 'RF-019'],
    assertions: ['KPIs are measurable', 'frequency and schedule are explicit', 'threshold alerts map to selected KPIs', 'no automatic external action is enabled'], ui: 'MonitoringSection',
  },
  {
    id: 'budget_management', status: 'partial', priority: 'P1', referencePath: 'budget_management', canonicalPath: 'governance.monitoring_plan.budget_management',
    sourceFields: ['budget_band', 'budget_flexibility', 'max_cac', 'primary_objective', 'ad_channels'], authority: 'CDKS', rules: ['RF-011', 'RF-020'],
    assertions: ['daily and monthly pacing use envelope currency', 'reallocation triggers are advisory', 'burn-rate thresholds are explicit', 'no spend action can be executed'], ui: 'BudgetManagementSection',
  },
  {
    id: 'testing', status: 'partial', priority: 'P1', referencePath: 'testing', canonicalPath: 'governance.monitoring_plan.testing_plan.ab_test_plan',
    sourceFields: ['primary_objective', 'creative_assets', 'content_capacity', 'budget_band', 'risk_tolerance'], authority: 'CDKS', rules: ['RF-021', 'RF-022'],
    assertions: ['each test has variant, duration, minimum spend, KPI and success criterion', 'test budget does not exceed available budget', 'tests are recommendations only'], ui: 'TestingSection',
  },
  {
    id: 'benchmarks', status: 'partial', priority: 'P1', referencePath: 'benchmarks', canonicalPath: 'governance.monitoring_plan.testing_plan.benchmarks',
    sourceFields: ['business_type', 'geo_scope', 'target_locations', 'currency', 'primary_objective'], authority: 'CDKS', rules: ['RF-023'],
    assertions: ['every benchmark has source/freshness or unavailable status', 'market and currency are explicit', 'AI cannot invent market facts'], ui: 'BenchmarksSection',
  },
  {
    id: 'market_context', status: 'partial', priority: 'P2', referencePath: 'market_context', canonicalPath: 'governance.monitoring_plan.testing_plan.market_context',
    sourceFields: ['geo_scope', 'target_locations', 'business_type', 'offer_type', 'competitor_advantage'], authority: 'CDKS', rules: ['RF-024', 'RF-025'],
    assertions: ['market and region are explicit', 'seasonality applicability is explained', 'unknown CPC or saturation is unavailable, not fabricated'], ui: 'MarketContextSection',
  },
  {
    id: 'platform_guides', status: 'full', priority: 'baseline', referencePath: 'platform_guides', canonicalPath: 'governance.monitoring_plan.testing_plan.platform_guides',
    sourceFields: ['ad_channels', 'primary_objective', 'creative_assets', 'tracking_tools'], authority: 'CDKS', rules: ['RF-026'], assertions: ['only selected platforms are included', 'tracking and creative requirements are channel-specific'], ui: 'PlatformGuidesSection',
  },
  {
    id: 'compliance', status: 'partial', priority: 'P2', referencePath: 'compliance', canonicalPath: 'governance.monitoring_plan.testing_plan.compliance',
    sourceFields: ['geo_scope', 'target_locations', 'business_type', 'offer_type', 'conversion_destination'], authority: 'CDKS', rules: ['RF-027'],
    assertions: ['regulations are market/platform scoped', 'mandatory counts match requirements', 'manual consultation is explicit', 'not_applicable is explained'], ui: 'ComplianceSection',
  },
  {
    id: 'technical_audit', status: 'partial', priority: 'P2', referencePath: 'technical_audit', canonicalPath: 'governance.monitoring_plan.testing_plan.technical_audit',
    sourceFields: ['conversion_destination', 'tracking_status', 'tracking_tools', 'creative_assets'], authority: 'CDKS', rules: ['RF-029'],
    assertions: ['accessibility/mobile checks are explicit', 'speed/SSL/authority are sourced or unavailable', 'manual checks are counted'], ui: 'TechnicalAuditSection',
  },
  {
    id: 'offer_strategy', status: 'partial', priority: 'P2', referencePath: 'offer_strategy', canonicalPath: 'execution.offer_strategy',
    sourceFields: ['offer_type', 'offer_description', 'core_message', 'objections', 'risk_tolerance'], authority: 'CDKS', rules: ['RF-016', 'RF-017'],
    assertions: ['duration and urgency agree with offer type', 'copy examples are derived from offer inputs', 'refresh frequency is explicit'], ui: 'OfferStrategySection',
  },
  {
    id: 'budget_split', status: 'partial', priority: 'P0', referencePath: 'budget_split', canonicalPath: 'execution.budget_split',
    sourceFields: ['budget_band', 'budget_flexibility', 'ad_channels', 'average_order_value', 'profit_margin', 'max_cac'], authority: 'CDKS', rules: ['RF-011', 'RF-012'],
    assertions: ['channel allocation sums to 1', 'only selected channels receive allocation', 'test percentage is 0-100', 'CAC uses envelope currency', 'daily budget min <= recommended <= max'], ui: 'BudgetSplitSection',
  },
  {
    id: 'creative_angles', status: 'full', priority: 'baseline', referencePath: 'creative_angles', canonicalPath: 'execution.creative_angles',
    sourceFields: ['core_message', 'usp', 'persuasion_angle', 'conversion_destination'], authority: 'CDKS', rules: ['RF-007'], assertions: ['primary and alternatives include CTA'], ui: 'CreativeAnglesSection',
  },
  {
    id: 'tracking_checklist', status: 'partial', priority: 'P0', referencePath: 'tracking_checklist', canonicalPath: 'execution.tracking_checklist',
    sourceFields: ['tracking_status', 'tracking_tools', 'key_events', 'conversion_model'], authority: 'CDKS', rules: ['RF-008', 'RF-030'],
    assertions: ['required events equal assessment events', 'setup status agrees with tracking status', 'implementation steps include tool and verification'], ui: 'TrackingChecklistSection',
  },
  {
    id: 'risk_flags', status: 'full', priority: 'baseline', referencePath: 'risk_flags', canonicalPath: 'governance.risk_flags',
    sourceFields: ['constraints', 'tracking_status', 'budget_band', 'risk_tolerance'], authority: 'CDKS', rules: ['RF-031'], assertions: ['critical blockers are separate from warnings'], ui: 'RiskFlagsSection',
  },
  {
    id: 'first_14_days_plan', status: 'partial', priority: 'P0', referencePath: 'launch_plan.detailed_timeline', canonicalPath: 'execution.launch_plan.detailed_timeline',
    sourceFields: ['build_mode', 'tracking_status', 'creative_assets', 'content_capacity', 'response_speed'], authority: 'CDKS', rules: ['RF-009'],
    assertions: ['milestones cover the declared total days', 'tasks are non-empty for active phases', 'critical path is a subset of milestone phases'], ui: 'First14DaysPlanSection',
  },
  {
    id: 'pre_launch_fixes', status: 'partial', priority: 'P0', referencePath: 'launch_plan.pre_launch_checklist', canonicalPath: 'execution.launch_plan.pre_launch_checklist',
    sourceFields: ['tracking_status', 'tracking_tools', 'creative_assets', 'conversion_destination', 'constraints'], authority: 'CDKS', rules: ['RF-010', 'RF-032'],
    assertions: ['summary counters equal item statuses', 'required fail items prevent ready_to_launch', 'manual checks remain manual'], ui: 'PreLaunchFixesSection',
  },
  {
    id: 'flags', status: 'full', priority: 'baseline', referencePath: 'flags', canonicalPath: 'flags',
    sourceFields: ['constraints', 'tracking_status'], authority: 'CDKS', rules: ['RF-031'], assertions: ['errors/warnings/infos are arrays'], ui: 'FlagsSection',
  },
  {
    id: 'debug', status: 'full', priority: 'baseline', referencePath: 'debug', canonicalPath: 'telemetry',
    sourceFields: ['final_confirmed_inputs'], authority: 'CDKS', rules: ['RF-033'],
    assertions: ['timing and rules executed are present', 'decision trace excludes secrets and raw prompts', 'validation summary is internally consistent'], ui: 'DebugSection',
  },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function leafPaths(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return prefix ? [prefix] : [];
  const entries = Object.entries(value);
  if (!entries.length) return prefix ? [prefix] : [];
  return entries.flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function normalizeReferencePaths(value) {
  return leafPaths(value).map((item) => item.replace(/(^|\.)value(?=\.|$)/g, '').replace(/^\./, '')).filter(Boolean);
}

function main() {
  const references = ['ecommerce.json', 'local_service.json'].map((file) => ({ file, data: readJson(path.join(REFERENCE_DIR, file)) }));
  const entries = definitions.map((definition) => {
    const referenceLeaves = [...new Set(references.flatMap(({ data }) => normalizeReferencePaths(definition.referencePath.split('.').reduce((value, key) => value?.[key], data))) )];
    return {
      ...definition,
      referenceLeaves,
      referenceLeafCount: referenceLeaves.length,
      semanticStatus: definition.status === 'full' ? 'verified_structural_baseline' : 'pending_leaf_semantic_assertions',
      requiredEvidence: ['source_fields', 'authority', 'rules', 'confidence', 'reasoning', 'rule_id'],
      safetyConstraints: ['generation_mode=blueprint_only', 'external_actions_allowed=false', 'budget_spend_allowed=false'],
    };
  });
  const report = {
    manifest_version: '1.0.0',
    generated_at: new Date().toISOString(),
    purpose: 'Deterministic reference-to-canonical parity manifest for CDKS Blueprint.',
    reference_files: references.map(({ file }) => `tests/fixtures/reference-blueprints/${file}`),
    contract_target: 'CanonicalBlueprint additive parity extension',
    authority_model: 'AI proposes; CDKS decides; human approves.',
    full_definition: ['structural', 'semantic', 'consistency', 'provenance', 'safety', 'ui', 'regression'],
    summary: {
      total_sections: entries.length,
      full: entries.filter((entry) => entry.status === 'full').length,
      partial: entries.filter((entry) => entry.status === 'partial').length,
      missing: entries.filter((entry) => entry.status === 'missing').length,
      priority_batch: entries.filter((entry) => /^P0$/.test(entry.priority)).map((entry) => entry.id),
    },
    sections: entries,
  };
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    '# Reference Parity Manifest',
    '',
    `Generated: ${report.generated_at}`,
    '',
    'هذا manifest يربط كل قسم مرجعي بمساره canonical، وأوراقه المرجعية، ومدخلات Wizard، وقواعد CDKS، واختبارات التكافؤ المطلوبة. لا يعتبر القسم كاملًا إلا بعد نجاح structural وsemantic وconsistency وprovenance وsafety وUI وregression.',
    '',
    `| المقياس | القيمة |`,
    `|---|---:|`,
    `| الأقسام الكلية | ${report.summary.total_sections} |`,
    `| full الحالي | ${report.summary.full} |`,
    `| partial الحالي | ${report.summary.partial} |`,
    `| missing الحالي | ${report.summary.missing} |`,
    '',
    '## Priority Batch P0',
    '',
    `الأقسام ذات الأولوية: ${report.summary.priority_batch.map((id) => ` ${id} `).join('، ')}.`,
    '',
    '## Section Manifest',
    '',
    '| القسم | الحالة | الأولوية | المسار canonical | أوراق المرجع | مدخلات المصدر | الواجهة |',
    '|---|---|---|---|---:|---|---|',
    ...entries.map((entry) => `| ${entry.id} | ${entry.status} | ${entry.priority} | \`${entry.canonicalPath}\` | ${entry.referenceLeafCount} | ${entry.sourceFields.join(', ')} | ${entry.ui} |`),
    '',
    '## P0 Assertions',
    '',
    ...entries.filter((entry) => entry.priority === 'P0').flatMap((entry) => [
      `### ${entry.id}`,
      '',
      `المسار: \`${entry.canonicalPath}\`. القواعد: ${entry.rules.join(', ')}.`,
      '',
      ...entry.assertions.map((assertion) => `- ${assertion}`),
      '',
    ]),
  ];
  fs.writeFileSync(OUTPUT_MD, `${lines.join('\n')}\n`.replaceAll('\u0000', '`'));
  console.log(JSON.stringify({ outputJson: path.relative(ROOT, OUTPUT_JSON), outputMarkdown: path.relative(ROOT, OUTPUT_MD), summary: report.summary }, null, 2));
}

main();

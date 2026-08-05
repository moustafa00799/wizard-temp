/**
 * blueprint-types.ts — v2
 * Full type system for WizardPayload → RichBlueprintData pipeline.
 * Backward-compatible: BlueprintData is aliased to RichBlueprintData.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Wizard Payload (what Step12_Review.tsx sends)
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardPayload {
  build_mode: string;
  business_type: string;
  offer_description: string;
  sales_motion: string;
  customer_problem: string;
  key_value_drivers: string[];
  usp: string;
  primary_objective: string;
  secondary_objectives: string[];
  north_star_kpi: string;
  existing_assets: string[];
  previous_campaigns_status: string;
  past_performance_notes: string;
  ideal_customer: string;
  awareness_level: string;
  audience_segments: string[];
  geo_scope: string;
  target_locations: string[];
  offer_type: string;
  core_message: string;
  objections: string[];
  persuasion_angle: string;
  conversion_destination: string;
  ad_channels: string[];
  campaign_direction: string;
  budget_band: string;
  budget_flexibility: string;
  average_order_value: number;
  profit_margin: number;
  max_cac: number;
  tracking_status: string;
  tracking_tools: string[];
  key_events: string[];
  conversion_model: string;
  creative_assets: string[];
  content_capacity: string;
  constraints: string[];
  response_speed: string;
  top_priority: string;
  risk_tolerance: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Rule Engine helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface RuleResult<T> {
  value: T;
  confidence: number;
  reasoning: string;
  rule_id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Rich Blueprint — sub-shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutiveSummary {
  readiness_level: "strong" | "moderate" | "weak";
  readiness_score: number;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  launch_recommendation: "ready" | "ready_with_fixes" | "not_ready";
  estimated_launch_date: string;
}

export interface StrategySummary {
  recommended_objective: RuleResult<string>;
  recommended_channels: RuleResult<string[]> & { channel_scores: Record<string, number> };
  funnel_type: RuleResult<string> & { stages: string[] };
  confidence_score: RuleResult<number> & { breakdown: Record<string, number> };
  estimated_timeline: RuleResult<number> & { label: string; factors: string[] };
}

export interface FunnelStage {
  stage_number: number;
  name: string;
  objective: string;
  content_template: string;
  kpi: string;
  budget_ratio: number;
}

export interface RecommendedFunnel {
  funnel_type: string;
  stages: FunnelStage[];
  total_stages: number;
}

export interface CampaignNode {
  id: string;
  name: string;
  objective: string;
  platform: string;
  budget_share: number;
  ad_sets: number;
  creatives_per_ad_set: number;
}

export interface AdSetStructure {
  per_campaign: number;
  total: number;
}

export interface RichCampaignStructure {
  campaign_count: number;
  campaigns: CampaignNode[];
  ad_set_structure: AdSetStructure;
}

export interface PrimaryAudience {
  name: string;
  description: string;
  targeting_type: string;
  interests: string[];
  size_estimate: string;
}

export interface AudienceSegment {
  name: string;
  description?: string;
  demographics?: string;
  interests?: string[];
  behaviors?: string[];
  pain_points?: string[];
}

export interface LookalikeConfig {
  recommended: boolean;
  source: string;
  priority: "high" | "medium" | "low";
}

export interface RichAudienceStructure {
  primary_audience: PrimaryAudience;
  segments: AudienceSegment[];
  lookalike: LookalikeConfig;
  exclusions: string[];
}

export interface DailyBudgetValue {
  min: number;
  recommended: number;
  max: number;
  flexible: boolean;
}

export interface TestBudgetValue {
  percentage: number;
  amount: number;
}

export interface ScaleBudgetValue {
  max: number;
  increment: string;
}

export interface RichBudgetSplit {
  daily_budget: RuleResult<DailyBudgetValue>;
  channel_allocation: RuleResult<Record<string, number>>;
  test_budget: RuleResult<TestBudgetValue>;
  scale_budget: RuleResult<ScaleBudgetValue>;
  cac_target: RuleResult<number> & { source: string; flags: string[] };
}

export interface CreativeAngle {
  name: string;
  hook: string;
  body: string;
  cta: string;
}

export interface CreativeFormat {
  type: string;
  priority: number;
  platforms: string[];
}

export interface RichCreativeAngles {
  primary_angle: CreativeAngle;
  alternative_angles: CreativeAngle[];
  formats: CreativeFormat[];
}

export interface TrackingItem {
  event: string;
  status: "ready" | "partial" | "missing";
  required: boolean;
}

export interface TrackingSetupStatus {
  overall: "ready" | "partial" | "missing" | "issues";
  score: number;
  items: TrackingItem[];
}

export interface MissingTrackingItem {
  item: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface ImplementationGuide {
  steps: string[];
  estimated_time: string;
  complexity: "low" | "medium" | "high";
}

export interface RichTrackingChecklist {
  required_events: string[];
  setup_status: TrackingSetupStatus;
  missing_items: MissingTrackingItem[];
  implementation_guide: ImplementationGuide;
}

export interface RiskFlag {
  id?: string;
  message: string;
  impact?: string;
  action: string;
}

export interface RiskScore extends RuleResult<number> {
  level: "low" | "medium" | "high";
  breakdown: Record<string, number>;
}

export interface RichRiskFlags {
  critical: RiskFlag[];
  warnings: RiskFlag[];
  recommendations: RiskFlag[];
  risk_score: RiskScore;
}

export interface DayTask {
  day: string;
  task: string;
  priority: "high" | "medium" | "low";
  owner: string;
  blocker: boolean;
}

export interface BudgetScheduleItem {
  day: number;
  budget: string;
  note: string;
}

export interface LaunchStep {
  step: number;
  action: string;
  depends_on: number[];
  duration: string;
}

export interface RichFirst14DaysPlan {
  week_1: DayTask[];
  week_2: DayTask[];
  daily_budget_schedule: BudgetScheduleItem[];
  launch_sequence: LaunchStep[];
}

export interface FixItem {
  item: string;
  priority: "critical" | "high" | "medium" | "low";
  estimated_time: string;
  action: string;
}

export interface RichPreLaunchFixes {
  must_fix: FixItem[];
  should_fix: FixItem[];
  nice_to_have: FixItem[];
  estimated_fix_time: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  rule_id: string;
}

export interface BlueprintFlags {
  errors: string[];
  warnings: string[];
  infos: string[];
}

export interface ScoresBreakdown {
  readiness: Record<string, number>;
  risk: Record<string, number>;
}

export interface BlueprintDebug {
  execution_time_ms: number;
  rules_executed: number;
  scores_breakdown: ScoresBreakdown;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Root RichBlueprintData
// ─────────────────────────────────────────────────────────────────────────────

export interface RichBlueprintData {
  blueprint_id: string;
  version: string;
  rule_engine_version: string;
  generated_at: string;
  executive_summary: ExecutiveSummary;
  strategy_summary: StrategySummary;
  recommended_funnel: RecommendedFunnel;
  campaign_structure: RichCampaignStructure;
  audience_structure: RichAudienceStructure;
  budget_split: RichBudgetSplit;
  creative_angles: RichCreativeAngles;
  tracking_checklist: RichTrackingChecklist;
  risk_flags: RichRiskFlags;
  first_14_days_plan: RichFirst14DaysPlan;
  pre_launch_fixes: RichPreLaunchFixes;
  flags: BlueprintFlags;
  debug: BlueprintDebug;
  [key: string]: unknown;
}

// Backward-compatible alias
export type BlueprintData = RichBlueprintData;

// ─────────────────────────────────────────────────────────────────────────────
// 5. Legacy sub-types kept for BlueprintExporter / ProReadyJSON compatibility
// ─────────────────────────────────────────────────────────────────────────────

export interface BudgetAllocation {
  channel: string;
  amount: number;
  percent: number;
  objective?: string;
}

export interface BudgetSplit {
  total_budget?: number;
  currency?: string;
  daily_budget?: number;
  duration_days?: number;
  allocation?: BudgetAllocation[];
  [key: string]: unknown;
}

export interface AdSetNode {
  name: string;
  audience: string;
  placements?: string[];
  budget?: number;
  bid_strategy?: string;
}

export interface CampaignStructure {
  campaigns?: CampaignNode[];
  funnel_stages?: string[];
  [key: string]: unknown;
}

export interface AudienceStructure {
  segments?: AudienceSegment[];
  targeting_notes?: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Pro-Ready JSON (Media Buyer export format) — unchanged
// ─────────────────────────────────────────────────────────────────────────────

export interface ProReadyJSON {
  _meta: ExportMeta;
  campaign_info: CampaignInfo;
  objective_hierarchy: ObjectiveHierarchy;
  audience_matrix: AudienceMatrix;
  budget_breakdown: BudgetBreakdown;
  creative_specs: CreativeSpecs;
  tracking_config: TrackingConfig;
  launch_sequence: LaunchSequence;
  optimization_rules: OptimizationRules;
  risk_register: RiskRegister;
  raw_blueprint: Record<string, unknown>;
}

export interface ExportMeta {
  version: string;
  exported_at: string;
  exported_by: string;
  format: "pro-ready-v1";
}

export interface CampaignInfo {
  campaign_name: string;
  business_type: string;
  industry_vertical: string;
  created_at: string;
  strategist: string;
  client_name: string;
  version: string;
  tags: string[];
}

export interface ObjectiveHierarchy {
  primary_objective: string;
  secondary_objectives: string[];
  north_star_kpi: string;
  success_metrics: string[];
  funnel_stage: string;
  conversion_destination: string;
}

export interface AudienceMatrix {
  core_segments: AudienceSegment[];
  exclusions: string[];
  lookalike_plan: string[];
  custom_audiences: string[];
  geo_targeting: string[];
  language: string;
  audience_size_estimate: string;
}

export interface BudgetBreakdown {
  total_budget: number;
  currency: string;
  daily_cap: number;
  duration_days: number;
  campaign_allocation: BudgetAllocation[];
  day_7_projection: number;
  day_14_projection: number;
  cac_target: number;
  roas_target: number;
  break_even_roas: number;
  budget_flexibility: string;
}

export interface CreativeSpecs {
  angles: string[];
  primary_hook: string;
  formats: string[];
  copy_framework: string;
  headline_variants: string[];
  cta_variants: string[];
  visual_guidelines: string[];
  content_capacity: string;
}

export interface TrackingConfig {
  pixel_status: string;
  conversion_events: string[];
  utm_parameters: Record<string, string>;
  attribution_window: string;
  key_metrics: string[];
  reporting_dashboard: string;
  alert_thresholds: Record<string, number>;
}

export interface LaunchTask {
  day: number;
  action: string;
  owner: string;
  priority: "high" | "medium" | "low";
}

export interface LaunchSequence {
  phase: string;
  day_1_3: LaunchTask[];
  day_4_7: LaunchTask[];
  day_8_14: LaunchTask[];
  checkpoints: string[];
  go_no_go_criteria: string[];
}

export interface OptimizationRules {
  kill_conditions: string[];
  scale_conditions: string[];
  a_b_test_plan: string[];
  budget_reallocation_rules: string[];
  creative_refresh_cycle: string;
  audience_expansion_rules: string[];
}

export interface RiskItem {
  risk: string;
  impact: string;
  probability: string;
  mitigation: string;
}

export interface RiskRegister {
  high_risks: RiskItem[];
  medium_risks: RiskItem[];
  low_risks: RiskItem[];
  mitigations: string[];
  pre_launch_requirements: string[];
  contingency_plan: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Section display metadata
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_LABELS: Record<string, string> = {
  executive_summary:  "ملخص تنفيذي",
  strategy_summary:   "ملخص الاستراتيجية",
  recommended_funnel: "الفانل الموصى به",
  campaign_structure: "هيكل الحملة",
  audience_structure: "هيكل الجمهور",
  budget_split:       "توزيع الميزانية",
  creative_angles:    "زوايا الإعلانات",
  tracking_checklist: "قائمة التتبع",
  risk_flags:         "المخاطر والتحذيرات",
  first_14_days_plan: "خطة أول 14 يوم",
  pre_launch_fixes:   "ما يجب إصلاحه قبل الإطلاق",
};

export const SECTION_ICONS: Record<string, string> = {
  executive_summary:  "📊",
  strategy_summary:   "🎯",
  recommended_funnel: "🔄",
  campaign_structure: "🏗️",
  audience_structure: "👥",
  budget_split:       "💰",
  creative_angles:    "🎨",
  tracking_checklist: "📋",
  risk_flags:         "⚠️",
  first_14_days_plan: "📅",
  pre_launch_fixes:   "🔧",
};

export const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  executive_summary:  { bg: "#f0fdf4", border: "#16a34a", text: "#166534", light: "#dcfce7" },
  strategy_summary:   { bg: "#f5f3ff", border: "#7c3aed", text: "#5b21b6", light: "#ede9fe" },
  recommended_funnel: { bg: "#ecfeff", border: "#0891b2", text: "#155e75", light: "#cffafe" },
  campaign_structure: { bg: "#eff6ff", border: "#2563eb", text: "#1e40af", light: "#dbeafe" },
  audience_structure: { bg: "#f0fdf4", border: "#16a34a", text: "#166534", light: "#dcfce7" },
  budget_split:       { bg: "#fffbeb", border: "#d97706", text: "#92400e", light: "#fef3c7" },
  creative_angles:    { bg: "#fdf2f8", border: "#db2777", text: "#9d174d", light: "#fce7f3" },
  tracking_checklist: { bg: "#f0f9ff", border: "#0284c7", text: "#075985", light: "#e0f2fe" },
  risk_flags:         { bg: "#fef2f2", border: "#dc2626", text: "#991b1b", light: "#fee2e2" },
  first_14_days_plan: { bg: "#f5f3ff", border: "#7c3aed", text: "#5b21b6", light: "#ede9fe" },
  pre_launch_fixes:   { bg: "#fff7ed", border: "#ea580c", text: "#9a3412", light: "#ffedd5" },
};

// executive_summary is rendered as a special card in page.tsx, so exclude from loop
export const SECTION_ORDER = [
  "strategy_summary",
  "recommended_funnel",
  "campaign_structure",
  "audience_structure",
  "budget_split",
  "creative_angles",
  "tracking_checklist",
  "risk_flags",
  "first_14_days_plan",
  "pre_launch_fixes",
];

// ─────────────────────────────────────────────────────────────────────────────
// 8. Safe type helpers (used across components)
// ─────────────────────────────────────────────────────────────────────────────

export function safeString(val: unknown, fallback: string): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

export function safeNumber(val: unknown, fallback: number): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

export function safeStringArray(val: unknown, fallback: string[]): string[] {
  if (Array.isArray(val)) return val.map((i) => (typeof i === "string" ? i : String(i)));
  if (typeof val === "string") return val ? [val] : fallback;
  return fallback;
}

export function safeBoolean(val: unknown, fallback: boolean): boolean {
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return fallback;
}

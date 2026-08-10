/**
 * blueprint-backfill.ts
 * Rules Backfill: يأخذ Blueprint من AI ويصححه / يكمله
 * يضمن أن الخرج النهائي يتوافق 100% مع RichBlueprintData
 */

import type {
  WizardPayload,
  RichBlueprintData,
  ExecutiveSummary,
  StrategySummary,
  RecommendedFunnel,
  RichCampaignStructure,
  RichAudienceStructure,
  RichBudgetSplit,
  RichCreativeAngles,
  RichTrackingChecklist,
  RichRiskFlags,
  RichFirst14DaysPlan,
  RichPreLaunchFixes,
  BlueprintFlags,
  CreativeAngle,
  FunnelStage,
  CampaignNode,
} from "./blueprint-types";
import { generateBlueprint as generateRulesBlueprint } from "./blueprint-engine";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeString(val: unknown, fallback: string): string {
  if (typeof val === "string" && val.trim().length > 0) return val;
  return fallback;
}

function safeNumber(val: unknown, fallback: number): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

function safeArray<T>(val: unknown, fallback: T[]): T[] {
  if (Array.isArray(val)) return val;
  return fallback;
}

function safeObject<T>(val: unknown, fallback: T): T {
  if (val !== null && typeof val === "object") return val as T;
  return fallback;
}

// ─── Backfill: Executive Summary ─────────────────────────────────────────────

function backfillExecutiveSummary(
  ai: Partial<RichBlueprintData>["executive_summary"],
  rules: ExecutiveSummary
): ExecutiveSummary {
  if (!ai) return rules;
  return {
    readiness_level: (ai as any)?.readiness_level ?? rules.readiness_level,
    readiness_score: safeNumber((ai as any)?.readiness_score, rules.readiness_score),
    risk_level: (ai as any)?.risk_level ?? rules.risk_level,
    risk_score: safeNumber((ai as any)?.risk_score, rules.risk_score),
    launch_recommendation: (ai as any)?.launch_recommendation ?? rules.launch_recommendation,
    estimated_launch_date: safeString((ai as any)?.estimated_launch_date, rules.estimated_launch_date),
  };
}

// ─── Backfill: Strategy Summary ──────────────────────────────────────────────

function backfillStrategySummary(
  ai: Partial<RichBlueprintData>["strategy_summary"],
  rules: StrategySummary
): StrategySummary {
  if (!ai) return rules;

  const mergeRuleResult = (aiVal: any, ruleVal: any, keys: string[]) => {
    if (!aiVal || typeof aiVal !== "object") return ruleVal;
    const merged: any = { ...ruleVal };
    for (const k of keys) {
      if (aiVal[k] !== undefined && aiVal[k] !== null) merged[k] = aiVal[k];
    }
    return merged;
  };

  return {
    recommended_objective: mergeRuleResult(
      (ai as any)?.recommended_objective,
      rules.recommended_objective,
      ["value", "confidence", "reasoning", "rule_id"]
    ),
    recommended_channels: mergeRuleResult(
      (ai as any)?.recommended_channels,
      rules.recommended_channels,
      ["value", "channel_scores", "confidence", "reasoning", "rule_id"]
    ),
    funnel_type: mergeRuleResult(
      (ai as any)?.funnel_type,
      rules.funnel_type,
      ["value", "stages", "confidence", "reasoning", "rule_id"]
    ),
    confidence_score: mergeRuleResult(
      (ai as any)?.confidence_score,
      rules.confidence_score,
      ["value", "breakdown", "confidence", "reasoning", "rule_id"]
    ),
    estimated_timeline: mergeRuleResult(
      (ai as any)?.estimated_timeline,
      rules.estimated_timeline,
      ["value", "label", "factors", "confidence", "reasoning", "rule_id"]
    ),
  };
}

// ─── Backfill: Funnel ─────────────────────────────────────────────────────────

function backfillFunnel(
  ai: Partial<RichBlueprintData>["recommended_funnel"],
  rules: RecommendedFunnel
): RecommendedFunnel {
  if (!ai) return rules;

  const aiStages = safeArray<FunnelStage>((ai as any)?.stages, []);
  const stages =
    aiStages.length > 0
      ? aiStages.map((s, i) => ({
          stage_number: safeNumber(s?.stage_number, i + 1),
          name: safeString(s?.name, `stage_${i + 1}`),
          objective: safeString(s?.objective, rules.stages[i]?.objective ?? "conversions"),
          content_template: safeString(s?.content_template, rules.stages[i]?.content_template ?? "template"),
          kpi: safeString(s?.kpi, rules.stages[i]?.kpi ?? "cpa"),
          budget_ratio: safeNumber(s?.budget_ratio, rules.stages[i]?.budget_ratio ?? 0.1),
        }))
      : rules.stages;

  return {
    funnel_type: safeString((ai as any)?.funnel_type, rules.funnel_type),
    stages,
    total_stages: stages.length,
  };
}

// ─── Backfill: Campaign Structure ────────────────────────────────────────────

function backfillCampaignStructure(
  ai: Partial<RichBlueprintData>["campaign_structure"],
  rules: RichCampaignStructure
): RichCampaignStructure {
  if (!ai) return rules;

  const aiCampaigns = safeArray<CampaignNode>((ai as any)?.campaigns, []);
  const campaigns =
    aiCampaigns.length > 0
      ? aiCampaigns.map((c, i) => ({
          id: safeString(c?.id, `camp_${i + 1}`),
          name: safeString(c?.name, rules.campaigns[i]?.name ?? `Campaign ${i + 1}`),
          objective: safeString(c?.objective, rules.campaigns[i]?.objective ?? "conversions"),
          platform: safeString(c?.platform, rules.campaigns[i]?.platform ?? "meta"),
          budget_share: safeNumber(c?.budget_share, rules.campaigns[i]?.budget_share ?? 0.33),
          ad_sets: safeNumber(c?.ad_sets, rules.campaigns[i]?.ad_sets ?? 2),
          creatives_per_ad_set: safeNumber(c?.creatives_per_ad_set, rules.campaigns[i]?.creatives_per_ad_set ?? 3),
        }))
      : rules.campaigns;

  return {
    campaign_count: campaigns.length,
    campaigns,
    ad_set_structure: {
      per_campaign: safeNumber((ai as any)?.ad_set_structure?.per_campaign, rules.ad_set_structure.per_campaign),
      total: safeNumber((ai as any)?.ad_set_structure?.total, campaigns.length * 2),
    },
  };
}

// ─── Backfill: Audience ───────────────────────────────────────────────────────

function backfillAudience(
  ai: Partial<RichBlueprintData>["audience_structure"],
  rules: RichAudienceStructure
): RichAudienceStructure {
  if (!ai) return rules;

  const primary = safeObject((ai as any)?.primary_audience, rules.primary_audience);
  return {
    primary_audience: {
      name: safeString(primary?.name, rules.primary_audience.name),
      description: safeString(primary?.description, rules.primary_audience.description),
      targeting_type: safeString(primary?.targeting_type, rules.primary_audience.targeting_type),
      interests: safeArray<string>(primary?.interests, rules.primary_audience.interests),
      size_estimate: safeString(primary?.size_estimate, rules.primary_audience.size_estimate),
    },
    segments: safeArray((ai as any)?.segments, rules.segments),
    lookalike: safeObject((ai as any)?.lookalike, rules.lookalike),
    exclusions: safeArray<string>((ai as any)?.exclusions, rules.exclusions),
  };
}

// ─── Backfill: Budget ─────────────────────────────────────────────────────────

function backfillBudget(
  ai: Partial<RichBlueprintData>["budget_split"],
  rules: RichBudgetSplit
): RichBudgetSplit {
  if (!ai) return rules;

  const mergeBudgetValue = (aiVal: any, ruleVal: any) => {
    if (!aiVal || typeof aiVal !== "object") return ruleVal;
    return { ...ruleVal, ...aiVal };
  };

  return {
    daily_budget: mergeBudgetValue((ai as any)?.daily_budget, rules.daily_budget),
    channel_allocation: mergeBudgetValue((ai as any)?.channel_allocation, rules.channel_allocation),
    test_budget: mergeBudgetValue((ai as any)?.test_budget, rules.test_budget),
    scale_budget: mergeBudgetValue((ai as any)?.scale_budget, rules.scale_budget),
    cac_target: mergeBudgetValue((ai as any)?.cac_target, rules.cac_target),
  };
}

// ─── Backfill: Creative ───────────────────────────────────────────────────────

function backfillCreative(
  ai: Partial<RichBlueprintData>["creative_angles"],
  rules: RichCreativeAngles
): RichCreativeAngles {
  if (!ai) return rules;

  const safeAngle = (a: any, fallback: CreativeAngle): CreativeAngle => ({
    name: safeString(a?.name, fallback.name),
    hook: safeString(a?.hook, fallback.hook),
    body: safeString(a?.body, fallback.body),
    cta: safeString(a?.cta, fallback.cta),
  });

  const primary = safeAngle((ai as any)?.primary_angle, rules.primary_angle);
  const alternatives = safeArray<CreativeAngle>((ai as any)?.alternative_angles, []).map((a, i) =>
    safeAngle(a, rules.alternative_angles[i] ?? rules.primary_angle)
  );

  return {
    primary_angle: primary,
    alternative_angles: alternatives.length > 0 ? alternatives : rules.alternative_angles,
    formats: safeArray((ai as any)?.formats, rules.formats),
  };
}

// ─── Backfill: Tracking ───────────────────────────────────────────────────────

function backfillTracking(
  ai: Partial<RichBlueprintData>["tracking_checklist"],
  rules: RichTrackingChecklist
): RichTrackingChecklist {
  if (!ai) return rules;
  return {
    required_events: safeArray<string>((ai as any)?.required_events, rules.required_events),
    setup_status: safeObject((ai as any)?.setup_status, rules.setup_status),
    missing_items: safeArray((ai as any)?.missing_items, rules.missing_items),
    implementation_guide: safeObject((ai as any)?.implementation_guide, rules.implementation_guide),
  };
}

// ─── Backfill: Risk Flags ─────────────────────────────────────────────────────

function backfillRiskFlags(
  ai: Partial<RichBlueprintData>["risk_flags"],
  rules: RichRiskFlags
): RichRiskFlags {
  if (!ai) return rules;

  const safeRiskArray = (arr: any[]): any[] =>
    Array.isArray(arr)
      ? arr.map((r) => ({
          id: r?.id ?? undefined,
          message: safeString(r?.message, "Unknown risk"),
          impact: r?.impact ?? undefined,
          action: safeString(r?.action, "Review and fix"),
        }))
      : [];

  return {
    critical: safeRiskArray((ai as any)?.critical),
    warnings: safeRiskArray((ai as any)?.warnings ?? (ai as any)?.warnings),
    recommendations: safeRiskArray((ai as any)?.recommendations),
    risk_score: safeObject((ai as any)?.risk_score, rules.risk_score),
  };
}

// ─── Backfill: 14 Days Plan ───────────────────────────────────────────────────

function backfill14Days(
  ai: Partial<RichBlueprintData>["first_14_days_plan"],
  rules: RichFirst14DaysPlan
): RichFirst14DaysPlan {
  if (!ai) return rules;
  return {
    week_1: safeArray((ai as any)?.week_1, rules.week_1),
    week_2: safeArray((ai as any)?.week_2, rules.week_2),
    daily_budget_schedule: safeArray((ai as any)?.daily_budget_schedule, rules.daily_budget_schedule),
    launch_sequence: safeArray((ai as any)?.launch_sequence, rules.launch_sequence),
  };
}

// ─── Backfill: Pre-launch Fixes ────────────────────────────────────────────────

function backfillPreLaunch(
  ai: Partial<RichBlueprintData>["pre_launch_fixes"],
  rules: RichPreLaunchFixes
): RichPreLaunchFixes {
  if (!ai) return rules;

  const safeFixArray = (arr: any[]): any[] =>
    Array.isArray(arr)
      ? arr.map((f) => ({
          item: safeString(f?.item, "Unknown item"),
          priority: ["critical", "high", "medium", "low"].includes(f?.priority) ? f.priority : "medium",
          estimated_time: safeString(f?.estimated_time, "1 hour"),
          action: safeString(f?.action, "Review"),
        }))
      : [];

  const mustFix = safeFixArray((ai as any)?.must_fix);
  const shouldFix = safeFixArray((ai as any)?.should_fix);
  const niceToHave = safeFixArray((ai as any)?.nice_to_have);

  return {
    must_fix: mustFix.length > 0 ? mustFix : rules.must_fix,
    should_fix: shouldFix.length > 0 ? shouldFix : rules.should_fix,
    nice_to_have: niceToHave.length > 0 ? niceToHave : rules.nice_to_have,
    estimated_fix_time: safeString((ai as any)?.estimated_fix_time, rules.estimated_fix_time),
    recommendation: safeString((ai as any)?.recommendation, rules.recommendation),
    confidence: safeNumber((ai as any)?.confidence, rules.confidence),
    reasoning: safeString((ai as any)?.reasoning, rules.reasoning),
    rule_id: safeString((ai as any)?.rule_id, rules.rule_id),
  };
}

// ─── Main Backfill Orchestrator ──────────────────────────────────────────────

export function backfillBlueprint(
  aiBlueprint: Partial<RichBlueprintData>,
  payload: WizardPayload
): RichBlueprintData {
  // 1. توليد Blueprint كامل من Rules كـ Fallback
  const rulesBlueprint = generateRulesBlueprint(payload);

  // 2. دمج كل قسم: AI يأخذ الأولوية، Rules تملأ الثغرات
  const merged: RichBlueprintData = {
    blueprint_id: safeString(aiBlueprint.blueprint_id, rulesBlueprint.blueprint_id),
    version: safeString(aiBlueprint.version, rulesBlueprint.version),
    rule_engine_version: safeString(aiBlueprint.rule_engine_version, rulesBlueprint.rule_engine_version),
    generated_at: safeString(aiBlueprint.generated_at, rulesBlueprint.generated_at),
    wizard_input: payload,

    executive_summary: backfillExecutiveSummary(aiBlueprint.executive_summary, rulesBlueprint.executive_summary),
    strategy_summary: backfillStrategySummary(aiBlueprint.strategy_summary, rulesBlueprint.strategy_summary),
    recommended_funnel: backfillFunnel(aiBlueprint.recommended_funnel, rulesBlueprint.recommended_funnel),
    campaign_structure: backfillCampaignStructure(aiBlueprint.campaign_structure, rulesBlueprint.campaign_structure),
    audience_structure: backfillAudience(aiBlueprint.audience_structure, rulesBlueprint.audience_structure),
    budget_split: backfillBudget(aiBlueprint.budget_split, rulesBlueprint.budget_split),
    creative_angles: backfillCreative(aiBlueprint.creative_angles, rulesBlueprint.creative_angles),
    tracking_checklist: backfillTracking(aiBlueprint.tracking_checklist, rulesBlueprint.tracking_checklist),
    risk_flags: backfillRiskFlags(aiBlueprint.risk_flags, rulesBlueprint.risk_flags),
    first_14_days_plan: backfill14Days(aiBlueprint.first_14_days_plan, rulesBlueprint.first_14_days_plan),
    pre_launch_fixes: backfillPreLaunch(aiBlueprint.pre_launch_fixes, rulesBlueprint.pre_launch_fixes),

    flags: {
      errors: safeArray<string>((aiBlueprint as any)?.flags?.errors, []),
      warnings: safeArray<string>((aiBlueprint as any)?.flags?.warnings, rulesBlueprint.flags.warnings),
      infos: safeArray<string>((aiBlueprint as any)?.flags?.infos, []),
    },

    debug: {
      execution_time_ms: safeNumber((aiBlueprint as any)?.debug?.execution_time_ms, rulesBlueprint.debug.execution_time_ms),
      rules_executed: safeNumber((aiBlueprint as any)?.debug?.rules_executed, rulesBlueprint.debug.rules_executed),
      scores_breakdown: safeObject(
        (aiBlueprint as any)?.debug?.scores_breakdown,
        rulesBlueprint.debug.scores_breakdown
      ),
    },
  };

  return merged;
}
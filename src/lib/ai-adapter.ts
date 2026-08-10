/**
 * Campaign Engine Builder — AI Blueprint Adapter (Multi-Phase v3)
 *
 * Responsibilities:
 * 1. normalizePhaseKeys()   — Fix AI key naming variations per phase.
 * 2. mergePhases()          — Combine 3 phase outputs into one flat AIBlueprint.
 * 3. adaptToRichShape()     — Convert flat AIBlueprint → Partial<RichBlueprintData>.
 *
 * This is the CRITICAL bridge between AI output (flat) and UI expectations (RuleResult).
 * Without this layer, the UI shows "غير محدد" for every field.
 */

import type { AIWizardPayload } from "./ai-types";
import type {
  RichBlueprintData,
  ExecutiveSummary,
  StrategySummary,
  RecommendedFunnel,
  FunnelStage,
  RichCampaignStructure,
  CampaignNode,
  RichAudienceStructure,
  RichBudgetSplit,
  RichCreativeAngles,
  CreativeAngle,
  CreativeFormat,
  RichTrackingChecklist,
  TrackingSetupStatus,
  TrackingItem,
  MissingTrackingItem,
  ImplementationGuide,
  RichRiskFlags,
  RiskFlag,
  RiskScore,
  RichFirst14DaysPlan,
  DayTask,
  BudgetScheduleItem,
  LaunchStep,
  RichPreLaunchFixes,
  FixItem,
} from "./blueprint-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeStr(val: unknown, fallback = ""): string {
  if (typeof val === "string" && val.trim().length > 0) return val;
  return fallback;
}

function safeNum(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

function safeArr<T>(val: unknown, fallback: T[] = []): T[] {
  return Array.isArray(val) ? (val as T[]) : fallback;
}

function safeObj<T>(val: unknown, fallback: T): T {
  return isObject(val) ? (val as T) : fallback;
}

// ─── Section Aliases (top-level keys AI might rename) ────────────────────────

const SECTION_ALIASES: Record<string, string> = {
  summary: "executive_summary",
  overview: "executive_summary",
  exec_summary: "executive_summary",
  executive_summary: "executive_summary",
  campaign_summary: "executive_summary",
  strategy: "strategy_summary",
  campaign_strategy: "strategy_summary",
  marketing_strategy: "strategy_summary",
  strategy_summary: "strategy_summary",
  funnel: "recommended_funnel",
  sales_funnel: "recommended_funnel",
  marketing_funnel: "recommended_funnel",
  recommended_funnel: "recommended_funnel",
  campaigns: "campaign_structure",
  ad_structure: "campaign_structure",
  campaign_setup: "campaign_structure",
  campaign_structure: "campaign_structure",
  audience: "audience_structure",
  target_audience: "audience_structure",
  demographics: "audience_structure",
  audience_structure: "audience_structure",
  budget: "budget_split",
  budget_allocation: "budget_split",
  budget_distribution: "budget_split",
  budget_split: "budget_split",
  creative: "creative_angles",
  creatives: "creative_angles",
  ad_creative: "creative_angles",
  messaging: "creative_angles",
  creative_angles: "creative_angles",
  tracking: "tracking_checklist",
  tracking_setup: "tracking_checklist",
  analytics: "tracking_checklist",
  measurement: "tracking_checklist",
  tracking_checklist: "tracking_checklist",
  risks: "risk_flags",
  risk_analysis: "risk_flags",
  warnings: "risk_flags",
  risk_flags: "risk_flags",
  launch_plan: "first_14_days_plan",
  week_plan: "first_14_days_plan",
  two_week_plan: "first_14_days_plan",
  timeline: "first_14_days_plan",
  first_14_days_plan: "first_14_days_plan",
  fixes: "pre_launch_fixes",
  prelaunch: "pre_launch_fixes",
  todo: "pre_launch_fixes",
  action_items: "pre_launch_fixes",
  pre_launch_fixes: "pre_launch_fixes",
};

// ─── Field Aliases (nested keys AI might rename) ─────────────────────────────

const FIELD_ALIASES: Record<string, Record<string, string>> = {
  executive_summary: {
    readiness: "readiness_score",
    readinessScore: "readiness_score",
    readiness_score: "readiness_score",
    risk: "risk_score",
    riskScore: "risk_score",
    risk_score: "risk_score",
    recommendation: "launch_recommendation",
    launchRecommendation: "launch_recommendation",
    launch_recommendation: "launch_recommendation",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  strategy_summary: {
    goal: "objective",
    primary_objective: "objective",
    primaryGoal: "objective",
    objective: "objective",
    platforms: "channels",
    ad_channels: "channels",
    channels: "channels",
    funnel: "funnel_type",
    funnelType: "funnel_type",
    funnel_type: "funnel_type",
    confidence_score: "confidence",
    confidence: "confidence",
    duration: "timeline",
    campaign_duration: "timeline",
    timeline: "timeline",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  recommended_funnel: {
    funnel: "funnel_type",
    funnelType: "funnel_type",
    funnel_type: "funnel_type",
    steps: "stages",
    phases: "stages",
    stages: "stages",
    stage_count: "total_stages",
    totalStages: "total_stages",
    total_stages: "total_stages",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  campaign_structure: {
    number_of_campaigns: "campaign_count",
    campaignCount: "campaign_count",
    campaign_count: "campaign_count",
    campaign_list: "campaigns",
    campaignItems: "campaigns",
    campaigns: "campaigns",
    adsets: "ad_sets",
    adSets: "ad_sets",
    ad_sets: "ad_sets",
    structure: "ad_set_structure",
    adSetStructure: "ad_set_structure",
    ad_set_structure: "ad_set_structure",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  audience_structure: {
    audience: "primary_audience",
    primaryAudience: "primary_audience",
    primary_audience: "primary_audience",
    audience_segments: "segments",
    segment_list: "segments",
    segments: "segments",
    lookalike_audience: "lookalike",
    lookalike: "lookalike",
    exclusions: "exclusions",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  budget_split: {
    daily: "daily_budget",
    dailyBudget: "daily_budget",
    daily_budget: "daily_budget",
    monthly: "monthly_budget",
    monthlyBudget: "monthly_budget",
    monthly_budget: "monthly_budget",
    allocations: "channel_allocation",
    channelAllocation: "channel_allocation",
    channel_allocation: "channel_allocation",
    test: "test_budget",
    testBudget: "test_budget",
    test_budget: "test_budget",
    scale: "scale_budget",
    scaleBudget: "scale_budget",
    scale_budget: "scale_budget",
    cac: "cac_target",
    target_cac: "cac_target",
    cacTarget: "cac_target",
    cac_target: "cac_target",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  creative_angles: {
    primary: "primary_angle",
    primaryAngle: "primary_angle",
    primary_angle: "primary_angle",
    alternatives: "alternative_angles",
    alternativeAngles: "alternative_angles",
    alternative_angles: "alternative_angles",
    creative_formats: "formats",
    formats: "formats",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  tracking_checklist: {
    events: "required_events",
    requiredEvents: "required_events",
    required_events: "required_events",
    status: "setup_status",
    setupStatus: "setup_status",
    setup_status: "setup_status",
    missing: "missing_items",
    missingItems: "missing_items",
    missing_items: "missing_items",
    implementation: "implementation_guide",
    implementationGuide: "implementation_guide",
    implementation_guide: "implementation_guide",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  risk_flags: {
    criticalRisks: "critical",
    critical: "critical",
    warnings: "warnings",
    recommendations: "recommendations",
    risk: "risk_score",
    riskScore: "risk_score",
    risk_score: "risk_score",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  first_14_days_plan: {
    week1: "week_1",
    week_1: "week_1",
    week2: "week_2",
    week_2: "week_2",
    budget_schedule: "daily_budget_schedule",
    dailyBudgetSchedule: "daily_budget_schedule",
    daily_budget_schedule: "daily_budget_schedule",
    launchSequence: "launch_sequence",
    launch_sequence: "launch_sequence",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
  pre_launch_fixes: {
    mustFix: "must_fix",
    must_fix: "must_fix",
    shouldFix: "should_fix",
    should_fix: "should_fix",
    niceToHave: "nice_to_have",
    nice_to_have: "nice_to_have",
    estimatedTime: "estimated_fix_time",
    estimated_fix_time: "estimated_fix_time",
    rationale: "reasoning",
    explanation: "reasoning",
    reasoning: "reasoning",
  },
};

// ─── normalizePhaseKeys ──────────────────────────────────────────────────────

function normalizeObjectKeys(
  section: string,
  value: Record<string, unknown>
): Record<string, unknown> {
  const aliases = FIELD_ALIASES[section] || {};
  const normalized: Record<string, unknown> = { ...value };

  for (const [key, fieldValue] of Object.entries(value)) {
    const canonicalKey = aliases[key] || key;
    if (canonicalKey !== key && normalized[canonicalKey] === undefined) {
      normalized[canonicalKey] = fieldValue;
    }
  }

  return normalized;
}

function normalizeNestedCollections(
  section: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

  if (section === "recommended_funnel" && Array.isArray(result.stages)) {
    result.stages = (result.stages as Array<Record<string, unknown>>).map((stage) =>
      isObject(stage)
        ? {
            ...stage,
            name: stage.name ?? stage.title,
            goal: stage.goal ?? stage.objective,
            channels: stage.channels ?? stage.platforms,
            content: stage.content ?? stage.assets,
            budget_percentage: stage.budget_percentage ?? stage.budgetPercent,
            duration_days: stage.duration_days ?? stage.duration,
          }
        : stage
    );
  }

  if (section === "campaign_structure" && Array.isArray(result.campaigns)) {
    result.campaigns = (result.campaigns as Array<Record<string, unknown>>).map((campaign) => {
      if (!isObject(campaign)) return campaign;
      const normalizedCampaign: Record<string, unknown> = {
        ...campaign,
        name: campaign.name ?? campaign.title,
        objective: campaign.objective ?? campaign.goal,
        platform: campaign.platform ?? campaign.channel,
        budget: campaign.budget ?? campaign.budget_amount,
      };
      const rawAdSets = campaign.ad_sets ?? campaign.adsets;
      if (Array.isArray(rawAdSets)) {
        normalizedCampaign.ad_sets = rawAdSets.map((adSet: unknown) =>
          isObject(adSet)
            ? {
                ...adSet,
                name: adSet.name ?? adSet.title,
                audience_segment: adSet.audience_segment ?? adSet.audience,
                budget_percentage: adSet.budget_percentage ?? adSet.budgetPercent,
                bid_strategy: adSet.bid_strategy ?? adSet.bidStrategy,
              }
            : adSet
        );
      }
      return normalizedCampaign;
    });
  }

  if (section === "audience_structure" && Array.isArray(result.segments)) {
    result.segments = (result.segments as Array<Record<string, unknown>>).map((segment) =>
      isObject(segment)
        ? {
            ...segment,
            name: segment.name ?? segment.title,
            description: segment.description ?? segment.profile,
            size_estimate: segment.size_estimate ?? segment.size,
            interests: segment.interests ?? segment.targeting,
            demographics: segment.demographics ?? segment.demographic_profile,
          }
        : segment
    );
  }

  if (section === "budget_split" && Array.isArray(result.channel_allocation)) {
    result.channel_allocation = (result.channel_allocation as Array<Record<string, unknown>>).map(
      (allocation) =>
        isObject(allocation)
          ? {
              ...allocation,
              channel: allocation.channel ?? allocation.platform,
              percentage: allocation.percentage ?? allocation.percent,
              daily_amount: allocation.daily_amount ?? allocation.daily,
            }
          : allocation
    );
  }

  if (section === "creative_angles" && Array.isArray(result.formats)) {
    result.formats = (result.formats as Array<Record<string, unknown>>).map((format) =>
      isObject(format)
        ? {
            ...format,
            type: format.type ?? format.format,
            description: format.description ?? format.details,
            recommended_platforms: format.recommended_platforms ?? format.platforms,
          }
        : format
    );
  }

  if (section === "tracking_checklist" && Array.isArray(result.required_events)) {
    result.required_events = (result.required_events as Array<Record<string, unknown>>).map(
      (event) =>
        isObject(event)
          ? {
              ...event,
              event_name: event.event_name ?? event.name ?? event.event,
              platform: event.platform ?? event.channel,
              priority: event.priority ?? event.importance,
              status: event.status ?? event.state,
            }
          : event
    );
  }

  if (section === "first_14_days_plan") {
    for (const weekKey of ["week_1", "week_2"]) {
      const week = result[weekKey];
      if (isObject(week)) {
        result[weekKey] = {
          ...week,
          week_number: week.week_number ?? week.weekNumber,
          focus: week.focus ?? week.objective,
          tasks: week.tasks ?? week.actions,
        };
      }
    }

    if (Array.isArray(result.daily_budget_schedule)) {
      result.daily_budget_schedule = (result.daily_budget_schedule as Array<Record<string, unknown>>).map(
        (item) =>
          isObject(item)
            ? { ...item, day: item.day ?? item.day_number, budget: item.budget ?? item.daily_budget }
            : item
      );
    }

    if (Array.isArray(result.launch_sequence)) {
      result.launch_sequence = (result.launch_sequence as Array<Record<string, unknown>>).map((item) =>
        isObject(item)
          ? {
              ...item,
              day: item.day ?? item.day_number,
              task: item.task ?? item.action,
              owner: item.owner ?? item.responsible,
              platform: item.platform ?? item.channel,
            }
          : item
      );
    }
  }

  if (section === "pre_launch_fixes") {
    for (const key of ["must_fix", "should_fix", "nice_to_have"]) {
      if (Array.isArray(result[key])) {
        result[key] = (result[key] as Array<Record<string, unknown>>).map((item) =>
          isObject(item)
            ? {
                ...item,
                item: item.item ?? item.description ?? item.action,
                priority: item.priority,
                estimated_time: item.estimated_time ?? item.estimatedTime,
                category: item.category ?? item.type,
              }
            : item
        );
      }
    }
  }

  return result;
}

export function normalizePhaseKeys(
  rawPhase: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(rawPhase)) {
    const section = SECTION_ALIASES[rawKey] || rawKey;

    if (result[section] !== undefined && rawKey !== section) continue;

    if (isObject(rawValue)) {
      result[section] = normalizeNestedCollections(section, normalizeObjectKeys(section, rawValue));
    } else {
      result[section] = rawValue;
    }
  }

  return result;
}

// ─── mergePhases ─────────────────────────────────────────────────────────────

export function mergePhases(
  phase1: Record<string, unknown>,
  phase2: Record<string, unknown>,
  phase3: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  // Phase 1 sections
  for (const key of ["executive_summary", "strategy_summary", "recommended_funnel"]) {
    if (key in phase1) merged[key] = phase1[key];
  }

  // Phase 2 sections
  for (const key of ["campaign_structure", "audience_structure", "budget_split", "creative_angles"]) {
    if (key in phase2) merged[key] = phase2[key];
  }

  // Phase 3 sections
  for (const key of ["tracking_checklist", "risk_flags", "first_14_days_plan", "pre_launch_fixes"]) {
    if (key in phase3) merged[key] = phase3[key];
  }

  return merged;
}

// ─── adaptToRichShape (THE CRITICAL LAYER) ───────────────────────────────────

function toRuleResult<T>(
  value: T,
  reasoning: string,
  confidence = 85,
  ruleId = "ai_gen"
): { value: T; confidence: number; reasoning: string; rule_id: string } {
  return {
    value,
    confidence,
    reasoning: safeStr(reasoning, "تم توليد هذا القرار بواسطة الذكاء الاصطناعي."),
    rule_id: ruleId,
  };
}

function adaptExecutiveSummary(data: Record<string, unknown>): ExecutiveSummary {
  const readinessScore = safeNum(data.readiness_score, 0);
  const riskScore = safeNum(data.risk_score, 0);

  return {
    readiness_level:
      readinessScore >= 70 ? "strong" : readinessScore >= 40 ? "moderate" : "weak",
    readiness_score: readinessScore,
    risk_level: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
    risk_score: riskScore,
    launch_recommendation: safeStr(
      data.launch_recommendation,
      readinessScore >= 65 && riskScore < 20 ? "ready" : readinessScore >= 40 ? "ready_with_fixes" : "not_ready"
    ) as "ready" | "ready_with_fixes" | "not_ready",
    estimated_launch_date: safeStr(data.estimated_launch_date, ""),
  };
}

function adaptStrategySummary(data: Record<string, unknown>): StrategySummary {
  const objective = safeStr(data.objective, "awareness");
  const channels = safeArr<string>(data.channels, []);
  const funnelType = safeStr(data.funnel_type, "website_funnel");
  const confidence = safeNum(data.confidence, 75);
  const timeline = safeStr(data.timeline, "30 يوم");
  const reasoning = safeStr(data.reasoning, "");

  return {
    recommended_objective: toRuleResult(objective, reasoning, confidence),
    recommended_channels: {
      ...toRuleResult(channels, reasoning, confidence),
      channel_scores: Object.fromEntries(channels.map((c) => [c, confidence])),
    },
    funnel_type: {
      ...toRuleResult(funnelType, reasoning, confidence),
      stages: [], // populated from recommended_funnel
    },
    confidence_score: {
      ...toRuleResult(confidence, reasoning, confidence),
      breakdown: {},
    },
    estimated_timeline: {
      ...toRuleResult(30, reasoning, confidence),
      label: timeline,
      factors: [],
    },
  };
}

function adaptRecommendedFunnel(data: Record<string, unknown>): RecommendedFunnel {
  const stages = safeArr<Record<string, unknown>>(data.stages, []).map((s, i) => ({
    stage_number: safeNum(s.stage_number, i + 1),
    name: safeStr(s.name, `مرحلة ${i + 1}`),
    objective: safeStr(s.goal, "conversions"),
    content_template: safeStr(s.content, ""),
    kpi: safeStr(s.kpi, "cpa"),
    budget_ratio: safeNum(s.budget_percentage, 0.1),
  }));

  return {
    funnel_type: safeStr(data.funnel_type, "website_funnel"),
    stages,
    total_stages: safeNum(data.total_stages, stages.length),
  };
}

function adaptCampaignStructure(data: Record<string, unknown>): RichCampaignStructure {
  const campaigns = safeArr<Record<string, unknown>>(data.campaigns, []).map((c, i) => ({
    id: safeStr(c.name, `camp_${i + 1}`).toLowerCase().replace(/\s+/g, "_"),
    name: safeStr(c.name, `Campaign ${i + 1}`),
    objective: safeStr(c.objective, "conversions"),
    platform: safeStr(c.platform, "meta"),
    budget_share: 0.33,
    ad_sets: safeNum(c.ad_sets, 2),
    creatives_per_ad_set: 3,
  }));

  return {
    campaign_count: safeNum(data.campaign_count, campaigns.length),
    campaigns,
    ad_set_structure: {
      per_campaign: 2,
      total: campaigns.length * 2,
    },
  };
}

function adaptAudienceStructure(data: Record<string, unknown>): RichAudienceStructure {
  const primary = isObject(data.primary_audience)
    ? (data.primary_audience as Record<string, unknown>)
    : { name: "Primary Audience", description: String(data.primary_audience || "") };

  const segments = safeArr<Record<string, unknown>>(data.segments, []).map((s) => ({
    name: safeStr(s.name, "شريحة"),
    description: safeStr(s.description, ""),
    demographics: safeStr(s.demographics, ""),
    interests: safeArr<string>(s.interests, []),
    behaviors: [],
    pain_points: [],
  }));

  return {
    primary_audience: {
      name: safeStr(primary.name, "Primary Audience"),
      description: safeStr(primary.description, ""),
      targeting_type: "interest_based",
      interests: safeArr<string>(primary.interests, []),
      size_estimate: safeStr(primary.size_estimate, ""),
    },
    segments,
    lookalike: {
      recommended: false,
      source: "pixel_data",
      priority: "medium" as const,
    },
    exclusions: safeArr<string>(data.exclusions, []),
  };
}

function adaptBudgetSplit(data: Record<string, unknown>): RichBudgetSplit {
  const dailyBudget = safeNum(data.daily_budget, 0);
  const monthlyBudget = safeNum(data.monthly_budget, dailyBudget * 30);

  const alloc = safeArr<Record<string, unknown>>(data.channel_allocation, []);
  const allocation: Record<string, number> = {};
  for (const item of alloc) {
    const ch = safeStr(item.channel, "");
    if (ch) allocation[ch] = safeNum(item.percentage, 0);
  }

  return {
    daily_budget: {
      value: {
        min: Math.round(dailyBudget * 0.7),
        recommended: dailyBudget,
        max: Math.round(dailyBudget * 1.3),
        flexible: true,
      },
      confidence: 85,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
    channel_allocation: {
      value: allocation,
      confidence: 80,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
    test_budget: {
      value: {
        percentage: 0.3,
        amount: Math.round(dailyBudget * 7),
      },
      confidence: 75,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
    scale_budget: {
      value: {
        max: Math.round(dailyBudget * 60),
        increment: "20% per day",
      },
      confidence: 90,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
    cac_target: {
      value: safeNum(data.cac_target, Math.round(dailyBudget * 0.15)),
      source: "ai_estimated",
      flags: [],
      confidence: 75,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
  };
}

function adaptCreativeAngles(data: Record<string, unknown>): RichCreativeAngles {
  const primary = isObject(data.primary_angle)
    ? (data.primary_angle as Record<string, unknown>)
    : { name: safeStr(data.primary_angle, "Primary Angle") };

  const primaryAngle: CreativeAngle = {
    name: safeStr(primary.name, "Primary Angle"),
    hook: safeStr(primary.hook, ""),
    body: safeStr(primary.body, ""),
    cta: safeStr(primary.cta, ""),
  };

  const alternatives = safeArr<string>(data.alternative_angles, []).map((a) => ({
    name: typeof a === "string" ? a : safeStr((a as Record<string, unknown>)?.name, "Alternative"),
    hook: "",
    body: "",
    cta: "",
  }));

  const formats = safeArr<Record<string, unknown>>(data.formats, []).map((f) => ({
    type: safeStr(f.type, "image"),
    priority: 1,
    platforms: safeArr<string>(f.recommended_platforms, []),
  }));

  return {
    primary_angle: primaryAngle,
    alternative_angles: alternatives,
    formats,
  };
}

function adaptTrackingChecklist(data: Record<string, unknown>): RichTrackingChecklist {
  const events = safeArr<Record<string, unknown>>(data.required_events, []).map((e) => ({
    event: safeStr(e.event_name, ""),
    status: (safeStr(e.status, "missing") as "ready" | "partial" | "missing") || "missing",
    required: true,
  }));

  const setupStatus: TrackingSetupStatus = {
    overall: (safeStr(data.setup_status, "missing") as "ready" | "partial" | "missing" | "issues") || "missing",
    score: events.length > 0 ? Math.round((events.filter((e) => e.status === "ready").length / events.length) * 100) : 0,
    items: events,
  };

  const missingItems = safeArr<Record<string, unknown>>(data.missing_items, []).map((m) => ({
    item: safeStr(m.item ?? m, ""),
    priority: (safeStr(m.priority, "high") as "high" | "medium" | "low") || "high",
    reason: "Required for campaign optimization",
  }));

  const guide = safeArr<string>(data.implementation_guide, []);

  return {
    required_events: events.map((e) => e.event),
    setup_status: setupStatus,
    missing_items: missingItems,
    implementation_guide: {
      steps: guide,
      estimated_time: "2-4 hours",
      complexity: "medium",
    },
  };
}

function adaptRiskFlags(data: Record<string, unknown>): RichRiskFlags {
  const riskScore = safeNum(data.risk_score, 0);

  const toRiskFlag = (item: unknown): RiskFlag => {
    if (typeof item === "string") return { message: item, action: "Review" };
    const obj = isObject(item) ? item : {};
    return {
      id: safeStr(obj.id, undefined),
      message: safeStr(obj.message ?? obj.description ?? obj.item ?? item, "Unknown risk"),
      impact: safeStr(obj.impact, undefined),
      action: safeStr(obj.action, "Review and fix"),
    };
  };

  return {
    critical: safeArr<unknown>(data.critical, []).map(toRiskFlag),
    warnings: safeArr<unknown>(data.warnings, []).map(toRiskFlag),
    recommendations: safeArr<unknown>(data.recommendations, []).map(toRiskFlag),
    risk_score: {
      value: riskScore,
      level: riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low",
      breakdown: {},
      confidence: 80,
      reasoning: safeStr(data.reasoning, ""),
      rule_id: "ai_gen",
    },
  };
}

function adaptFirst14DaysPlan(data: Record<string, unknown>): RichFirst14DaysPlan {
  const week1 = isObject(data.week_1) ? (data.week_1 as Record<string, unknown>) : {};
  const week2 = isObject(data.week_2) ? (data.week_2 as Record<string, unknown>) : {};

  const toDayTask = (item: unknown, index: number): DayTask => {
    if (typeof item === "string") return { day: `Day ${index + 1}`, task: item, priority: "medium", owner: "media_buyer", blocker: false };
    const obj = isObject(item) ? item : {};
    return {
      day: safeStr(obj.day, `Day ${index + 1}`),
      task: safeStr(obj.task ?? obj.action, "غير محدد"),
      priority: (safeStr(obj.priority, "medium") as "high" | "medium" | "low") || "medium",
      owner: safeStr(obj.owner, "media_buyer"),
      blocker: obj.blocker === true,
    };
  };

  const schedule = safeArr<Record<string, unknown>>(data.daily_budget_schedule, []).map((s) => ({
    day: safeNum(s.day, 0),
    budget: safeStr(s.budget, ""),
    note: safeStr(s.note, ""),
  }));

  const launch = safeArr<Record<string, unknown>>(data.launch_sequence, []).map((s, i) => ({
    step: safeNum(s.step, i + 1),
    action: safeStr(s.task ?? s.action, "غير محدد"),
    depends_on: safeArr<number>(s.depends_on, []),
    duration: safeStr(s.duration, "1 day"),
  }));

  return {
    week_1: safeArr<unknown>(week1.tasks, []).map(toDayTask),
    week_2: safeArr<unknown>(week2.tasks, []).map(toDayTask),
    daily_budget_schedule: schedule,
    launch_sequence: launch,
  };
}

function adaptPreLaunchFixes(data: Record<string, unknown>): RichPreLaunchFixes {
  const toFixItem = (item: unknown, defaultPriority: string): FixItem => {
    if (typeof item === "string") return { item, priority: defaultPriority as FixItem["priority"], estimated_time: "1 hour", action: "Review" };
    const obj = isObject(item) ? item : {};
    return {
      item: safeStr(obj.item ?? obj.description ?? obj.action, "Unknown item"),
      priority: (safeStr(obj.priority, defaultPriority) as FixItem["priority"]) || (defaultPriority as FixItem["priority"]),
      estimated_time: safeStr(obj.estimated_time, "1 hour"),
      action: safeStr(obj.action, "Review"),
    };
  };

  return {
    must_fix: safeArr<unknown>(data.must_fix, []).map((i) => toFixItem(i, "critical")),
    should_fix: safeArr<unknown>(data.should_fix, []).map((i) => toFixItem(i, "high")),
    nice_to_have: safeArr<unknown>(data.nice_to_have, []).map((i) => toFixItem(i, "low")),
    estimated_fix_time: safeStr(data.estimated_fix_time, ""),
    recommendation: safeStr(data.reasoning, ""),
    confidence: 75,
    reasoning: safeStr(data.reasoning, ""),
    rule_id: "ai_gen",
  };
}

/**
 * Convert flat AIBlueprint (from AI) → Partial<RichBlueprintData> (UI-compatible).
 * This is THE function that fixes the "غير محدد" problem.
 */
export function adaptToRichShape(
  flatBlueprint: Record<string, unknown>
): Partial<RichBlueprintData> {
  const result: Partial<RichBlueprintData> = {};

  if (flatBlueprint.executive_summary && isObject(flatBlueprint.executive_summary)) {
    result.executive_summary = adaptExecutiveSummary(flatBlueprint.executive_summary);
  }

  if (flatBlueprint.strategy_summary && isObject(flatBlueprint.strategy_summary)) {
    result.strategy_summary = adaptStrategySummary(flatBlueprint.strategy_summary);
  }

  if (flatBlueprint.recommended_funnel && isObject(flatBlueprint.recommended_funnel)) {
    result.recommended_funnel = adaptRecommendedFunnel(flatBlueprint.recommended_funnel);
  }

  if (flatBlueprint.campaign_structure && isObject(flatBlueprint.campaign_structure)) {
    result.campaign_structure = adaptCampaignStructure(flatBlueprint.campaign_structure);
  }

  if (flatBlueprint.audience_structure && isObject(flatBlueprint.audience_structure)) {
    result.audience_structure = adaptAudienceStructure(flatBlueprint.audience_structure);
  }

  if (flatBlueprint.budget_split && isObject(flatBlueprint.budget_split)) {
    result.budget_split = adaptBudgetSplit(flatBlueprint.budget_split);
  }

  if (flatBlueprint.creative_angles && isObject(flatBlueprint.creative_angles)) {
    result.creative_angles = adaptCreativeAngles(flatBlueprint.creative_angles);
  }

  if (flatBlueprint.tracking_checklist && isObject(flatBlueprint.tracking_checklist)) {
    result.tracking_checklist = adaptTrackingChecklist(flatBlueprint.tracking_checklist);
  }

  if (flatBlueprint.risk_flags && isObject(flatBlueprint.risk_flags)) {
    result.risk_flags = adaptRiskFlags(flatBlueprint.risk_flags);
  }

  if (flatBlueprint.first_14_days_plan && isObject(flatBlueprint.first_14_days_plan)) {
    result.first_14_days_plan = adaptFirst14DaysPlan(flatBlueprint.first_14_days_plan);
  }

  if (flatBlueprint.pre_launch_fixes && isObject(flatBlueprint.pre_launch_fixes)) {
    result.pre_launch_fixes = adaptPreLaunchFixes(flatBlueprint.pre_launch_fixes);
  }

  return result;
}

/**
 * Legacy adapter — kept for backward compatibility.
 * Simply wraps normalizePhaseKeys.
 */
export function normalizeBlueprint(
  rawBlueprint: Record<string, unknown>,
  _wizardData?: AIWizardPayload
): Record<string, unknown> {
  return normalizePhaseKeys(rawBlueprint);
}

/**
 * Legacy adapter — kept for backward compatibility.
 * Adds metadata wrapper.
 */
export function adaptAIToRichBlueprint(
  aiBlueprint: Record<string, unknown>,
  _wizardData?: AIWizardPayload
): Record<string, unknown> {
  return {
    ...aiBlueprint,
    _meta: {
      generatedAt: new Date().toISOString(),
      aiProvider: "groq",
      model: "llama-3.3-70b-versatile",
    },
  };
}

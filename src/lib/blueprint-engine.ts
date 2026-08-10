/**
 * blueprint-engine.ts
 * Rules Engine: WizardPayload → RichBlueprintData
 * All rule functions are pure and independently testable.
 *
 * NEW (v3): Added generateSection() for granular fallback per section.
 * When AI fails on a specific phase, we generate only the missing sections
 * from rules instead of regenerating the entire blueprint.
 */

import type {
  WizardPayload,
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
  RichTrackingChecklist,
  RichRiskFlags,
  RiskFlag,
  RichFirst14DaysPlan,
  DayTask,
  RichPreLaunchFixes,
  FixItem,
  BlueprintFlags,
} from "./blueprint-types";

// ─── Utility ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ─── Rule SS: Readiness & Risk scores ─────────────────────────────────────────

interface ReadinessResult {
  score: number;
  level: "strong" | "moderate" | "weak";
  breakdown: Record<string, number>;
}

export function calcReadiness(data: WizardPayload): ReadinessResult {
  const assetScore = Math.min(
    20,
    data.existing_assets.length * 2 +
      (data.existing_assets.includes("pixel") ? 3 : 0) +
      (data.existing_assets.includes("landing_page") || data.existing_assets.includes("website") ? 3 : 0)
  );

  let trackingScore = 0;
  if (data.tracking_status === "ready") trackingScore = 20;
  else if (data.tracking_status === "partial") trackingScore = 10;
  else if (data.tracking_status === "issues") trackingScore = 5;

  let contentScore = 0;
  if (data.content_capacity === "easy") contentScore = 20;
  else if (data.content_capacity === "slow") contentScore = 12;
  else if (data.content_capacity === "hard") contentScore = 6;
  contentScore += Math.min(6, data.creative_assets.filter((a) => a !== "none").length * 2);
  contentScore = Math.min(20, contentScore);

  let pathScore = 0;
  if (data.conversion_destination === "website" || data.conversion_destination === "store") pathScore = 15;
  else if (data.conversion_destination === "whatsapp" || data.conversion_destination === "messenger") pathScore = 12;
  else if (data.conversion_destination === "form") pathScore = 10;
  else pathScore = 8;
  if (data.existing_assets.includes("crm")) pathScore = Math.min(20, pathScore + 5);

  const keyFields = [
    data.business_type, data.offer_description, data.core_message,
    data.primary_objective, data.awareness_level, data.ideal_customer,
    data.usp, data.customer_problem,
  ];
  const filled = keyFields.filter((f) => f && f.trim().length > 0).length;
  const dataScore = Math.round((filled / keyFields.length) * 20);

  const total = assetScore + trackingScore + contentScore + pathScore + dataScore;
  const level: ReadinessResult["level"] = total >= 65 ? "strong" : total >= 40 ? "moderate" : "weak";

  return {
    score: total,
    level,
    breakdown: {
      assets: assetScore,
      tracking: trackingScore,
      content: contentScore,
      conversion_path: pathScore,
      data_completeness: dataScore,
    },
  };
}

interface RiskResult {
  score: number;
  level: "low" | "medium" | "high";
  breakdown: Record<string, number>;
}

export function calcRisk(data: WizardPayload, readiness: ReadinessResult): RiskResult {
  const trackingRisk =
    data.tracking_status === "missing" ? 20 :
    data.tracking_status === "issues"  ? 15 :
    data.tracking_status === "unknown" ? 12 :
    data.tracking_status === "partial" ?  8 : 0;

  const budgetRisk =
    data.budget_band === "under_100" ? 10 :
    data.budget_band === "100_300"   ?  5 :
    data.budget_band === "unknown"   ?  7 : 3;

  const contentRisk =
    data.content_capacity === "no"   ? 10 :
    data.content_capacity === "hard" ?  7 :
    data.content_capacity === "slow" ?  4 : 0;

  const responseRisk =
    data.response_speed === "slower"  ? 5 :
    data.response_speed === "unknown" ? 4 :
    data.response_speed === "within_day" ? 2 : 0;

  const constraintRisk = Math.min(10, data.constraints.length * 2);

  const total = trackingRisk + budgetRisk + contentRisk + responseRisk + constraintRisk;
  const level: RiskResult["level"] = total >= 35 ? "high" : total >= 20 ? "medium" : "low";

  return {
    score: total,
    level,
    breakdown: {
      tracking: trackingRisk,
      budget: budgetRisk,
      content: contentRisk,
      response: responseRisk,
      constraints: constraintRisk,
    },
  };
}

// ─── Rule SS-001: Objective ───────────────────────────────────────────────────

function determineObjective(data: WizardPayload): StrategySummary["recommended_objective"] {
  let value = data.primary_objective || "awareness";
  let confidence = 85;
  let reasoning = `Primary objective from wizard: ${value}.`;

  if (data.previous_campaigns_status === "none" && data.awareness_level === "unaware") {
    value = "awareness";
    confidence = 80;
    reasoning = "First campaign should focus on awareness before conversion.";
  } else if (data.awareness_level === "purchase_ready" || data.awareness_level === "brand_aware") {
    value = data.primary_objective === "sales" ? "conversions" : data.primary_objective;
    confidence = 90;
    reasoning = "High-awareness audience ready for conversion campaigns.";
  }

  return { value, confidence, reasoning, rule_id: "SS-001" };
}

// ─── Rule SS-002: Channels ────────────────────────────────────────────────────

const CHANNEL_BASE_SCORES: Record<string, Record<string, number>> = {
  local_service:    { meta: 80, google_ads: 60, tiktok_ads: 20, snapchat_ads: 15, youtube: 10, linkedin: 5,  x: 5  },
  ecommerce:        { meta: 85, google_ads: 75, tiktok_ads: 60, snapchat_ads: 30, youtube: 25, linkedin: 5,  x: 10 },
  consumer_product: { meta: 80, google_ads: 65, tiktok_ads: 70, snapchat_ads: 35, youtube: 30, linkedin: 5,  x: 15 },
  app:              { meta: 75, google_ads: 60, tiktok_ads: 65, snapchat_ads: 40, youtube: 20, linkedin: 10, x: 10 },
  b2b:              { meta: 50, google_ads: 70, tiktok_ads: 10, snapchat_ads: 5,  youtube: 30, linkedin: 90, x: 25 },
  education:        { meta: 75, google_ads: 65, tiktok_ads: 55, snapchat_ads: 20, youtube: 50, linkedin: 30, x: 15 },
  agency_service:   { meta: 65, google_ads: 70, tiktok_ads: 20, snapchat_ads: 10, youtube: 20, linkedin: 70, x: 20 },
  other:            { meta: 70, google_ads: 60, tiktok_ads: 30, snapchat_ads: 20, youtube: 20, linkedin: 20, x: 15 },
};

function determineChannels(data: WizardPayload): StrategySummary["recommended_channels"] {
  const base = CHANNEL_BASE_SCORES[data.business_type] ?? CHANNEL_BASE_SCORES["other"];
  const scores = { ...base };

  for (const ch of data.ad_channels) {
    if (scores[ch] !== undefined) scores[ch] = Math.min(100, scores[ch] + 15);
  }

  if (data.sales_motion === "whatsapp") scores["meta"] = Math.min(100, scores["meta"] + 10);

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ch]) => ch);

  return {
    value: sorted,
    channel_scores: scores,
    confidence: 80,
    reasoning: `Top channels for ${data.business_type} with ${data.sales_motion} sales motion: ${sorted.join(", ")}.`,
    rule_id: "SS-002",
  };
}

// ─── Rule SS-003: Funnel type ─────────────────────────────────────────────────

type FunnelType =
  | "direct_whatsapp"
  | "direct_phone"
  | "website_funnel"
  | "app_install"
  | "lead_gen"
  | "awareness_only";

function determineFunnelType(data: WizardPayload): FunnelType {
  if (data.sales_motion === "whatsapp" || data.conversion_destination === "whatsapp") return "direct_whatsapp";
  if (data.sales_motion === "call"     || data.conversion_destination === "call")     return "direct_phone";
  if (data.business_type === "app"     || data.conversion_destination === "app")      return "app_install";
  if (data.primary_objective === "leads" || data.conversion_destination === "form")   return "lead_gen";
  if (data.primary_objective === "awareness")                                         return "awareness_only";
  return "website_funnel";
}

const FUNNEL_STAGE_NAMES: Record<FunnelType, string[]> = {
  direct_whatsapp: ["Ad", "WhatsApp_Click", "Conversation", "Close"],
  direct_phone:    ["Ad", "Call_Click", "Conversation", "Close"],
  website_funnel:  ["Ad", "Landing_Page", "Add_to_Cart", "Purchase"],
  app_install:     ["Ad", "Store_Visit", "Install", "First_Open"],
  lead_gen:        ["Ad", "Lead_Form", "Qualification", "Close"],
  awareness_only:  ["Ad", "Impression", "Engagement", "Brand_Recall"],
};

function buildFunnelStages(funnelType: FunnelType, objective: string): FunnelStage[] {
  const names = FUNNEL_STAGE_NAMES[funnelType];
  const kpis = ["cpm", "cpc", "conversion_rate", "cpa"];
  const ratios = [0.6, 0.2, 0.15, 0.05];

  return names.map((name, i) => ({
    stage_number: i + 1,
    name,
    objective: i === names.length - 1 ? "conversions" : objective,
    content_template: name.toLowerCase().replace(/_/g, "_") + "_template",
    kpi: kpis[i] ?? "cpa",
    budget_ratio: ratios[i] ?? 0.1,
  }));
}

function buildRecommendedFunnel(data: WizardPayload, objective: string): RecommendedFunnel {
  const funnelType = determineFunnelType(data);
  const stages = buildFunnelStages(funnelType, objective);
  return { funnel_type: funnelType, stages, total_stages: stages.length };
}

// ─── Rule SS: Campaign structure ──────────────────────────────────────────────

function buildCampaignStructure(
  data: WizardPayload,
  channels: string[],
  objective: string
): RichCampaignStructure {
  const campaigns: CampaignNode[] = channels.map((ch, i) => ({
    id: `camp_${i + 1}`,
    name: `${data.business_type}_${ch}_${objective}`,
    objective,
    platform: ch,
    budget_share: parseFloat((1 / channels.length).toFixed(2)),
    ad_sets: 2,
    creatives_per_ad_set: 3,
  }));

  return {
    campaign_count: campaigns.length,
    campaigns,
    ad_set_structure: {
      per_campaign: 2,
      total: campaigns.length * 2,
    },
  };
}

// ─── Rule: Audience structure ─────────────────────────────────────────────────

function buildAudienceStructure(data: WizardPayload): RichAudienceStructure {
  const targetingType =
    data.awareness_level === "purchase_ready" || data.awareness_level === "brand_aware"
      ? "retargeting"
      : "interest_based";

  const primaryAudience = {
    name: "Primary Audience",
    description: data.ideal_customer || `Target audience for ${data.business_type}`,
    targeting_type: targetingType,
    interests: [data.business_type, ...data.key_value_drivers.slice(0, 3)],
    size_estimate:
      data.geo_scope === "country" || data.geo_scope === "multiple_countries"
        ? "1M-5M"
        : "100K-500K",
  };

  const segments = data.audience_segments.map((seg) => ({
    name: seg,
    description: `Segment: ${seg}`,
  }));

  const lookalikeRecommended =
    data.previous_campaigns_status === "successful" ||
    (data.existing_assets.includes("pixel") && data.existing_assets.includes("website"));

  return {
    primary_audience: primaryAudience,
    segments,
    lookalike: {
      recommended: lookalikeRecommended,
      source: "pixel_data",
      priority: lookalikeRecommended ? "high" : "medium",
    },
    exclusions: ["existing_customers"],
  };
}

// ─── Rule BS: Budget split ────────────────────────────────────────────────────

const BUDGET_BAND_MAP: Record<string, { min: number; recommended: number; max: number }> = {
  under_100:  { min: 50,   recommended: 80,   max: 100  },
  "100_300":  { min: 100,  recommended: 160,  max: 300  },
  "300_1000": { min: 300,  recommended: 500,  max: 1000 },
  "1000_5000":{ min: 1000, recommended: 2000, max: 5000 },
  above_5000: { min: 5000, recommended: 8000, max: 15000 },
  unknown:    { min: 50,   recommended: 100,  max: 200  },
};

function buildBudgetSplit(data: WizardPayload, channels: string[]): RichBudgetSplit {
  const band = BUDGET_BAND_MAP[data.budget_band] ?? BUDGET_BAND_MAP["unknown"];
  const flexible = data.budget_flexibility !== "fixed";

  const alloc: Record<string, number> = {};
  const perChannel = Math.floor(100 / channels.length);
  channels.forEach((ch, i) => {
    alloc[ch] = i === 0 ? 100 - perChannel * (channels.length - 1) : perChannel;
  });

  const testPct = data.previous_campaigns_status === "none" ? 0.3 : 0.2;
  const testAmount = Math.round(band.recommended * testPct);

  let cacValue = data.max_cac && data.max_cac > 0 ? data.max_cac : 0;
  let cacSource = "user_defined";
  if (cacValue === 0 && data.average_order_value > 0 && data.profit_margin > 0) {
    cacValue = Math.round(data.average_order_value * (data.profit_margin / 100) * 0.4);
    cacSource = "calculated_from_aov_margin";
  } else if (cacValue === 0) {
    cacValue = Math.round(band.recommended * 0.15);
    cacSource = "estimated_from_budget";
  }

  return {
    daily_budget: {
      value: { min: band.min, recommended: band.recommended, max: band.max, flexible },
      confidence: 85,
      reasoning: `Daily budget mapped from ${data.budget_band} band. ${flexible ? "Flexible" : "Fixed"} budget mode.`,
      rule_id: "BS-001",
    },
    channel_allocation: {
      value: alloc,
      confidence: 80,
      reasoning: `Budget allocated across ${channels.length} channels based on objective ${data.primary_objective}.`,
      rule_id: "BS-002",
    },
    test_budget: {
      value: { percentage: testPct, amount: testAmount },
      confidence: 75,
      reasoning: `Test budget set to ${testPct * 100}% based on ${data.build_mode} mode and ${data.previous_campaigns_status} history.`,
      rule_id: "BS-003",
    },
    scale_budget: {
      value: {
        max: flexible ? band.max * 2 : band.recommended,
        increment: flexible ? "20% per day" : "none",
      },
      confidence: 90,
      reasoning: flexible ? "Flexible budget allows scaling." : "Fixed budget — no scaling allowed.",
      rule_id: "BS-004",
    },
    cac_target: {
      value: cacValue,
      source: cacSource,
      flags: cacValue === 0 ? ["no_max_cac_defined"] : [],
      confidence: 75,
      reasoning: `CAC target set at ${cacValue} based on ${cacSource}.`,
      rule_id: "BS-005",
    },
  };
}

// ─── Rule: Creative angles ────────────────────────────────────────────────────

const ANGLE_MAP: Record<string, CreativeAngle> = {
  trust: {
    name: "trust",
    hook: "ثقة 500+ عميل",
    body: "نحن نفهم مخاوفك — لهذا السبب جودتنا تتحدث عنا",
    cta: "سجّل الآن",
  },
  social_proof: {
    name: "social_proof",
    hook: "انضم لآلاف العملاء الراضين",
    body: "شوف تجارب عملائنا الحقيقية وقرر بنفسك",
    cta: "احصل على عرضك",
  },
  scarcity: {
    name: "urgency",
    hook: "عرض محدود لفترة قصيرة",
    body: "لا تفوت الفرصة — العرض ينتهي قريباً",
    cta: "ابدأ مجاناً",
  },
  value: {
    name: "value",
    hook: "احصل على أقصى قيمة لميزانيتك",
    body: "عروضنا مصممة لتوفير أكبر عائد بأقل تكلفة",
    cta: "اكتشف المزيد",
  },
  result: {
    name: "result",
    hook: "نتائج حقيقية في 14 يوم",
    body: "عملاؤنا يرون نتائج قابلة للقياس — وأنت الاستثناء",
    cta: "ابدأ اليوم",
  },
  specialization: {
    name: "specialization",
    hook: "متخصصون في مجالك",
    body: "خبرة متخصصة تعني حلولاً أدق وأسرع لمشكلتك",
    cta: "تحدث مع خبير",
  },
  price: {
    name: "price",
    hook: "أفضل سعر في السوق — مضمون",
    body: "نقدم أعلى جودة بأقل سعر — قارن بنفسك",
    cta: "احصل على عرض",
  },
  guarantee: {
    name: "guarantee",
    hook: "ضمان استرداد كامل أو نتيجة",
    body: "نضمن رضاك التام — وإلا استرددت كل ريالك",
    cta: "ابدأ بأمان",
  },
};

const FALLBACK_ANGLES: CreativeAngle[] = [
  ANGLE_MAP["social_proof"],
  ANGLE_MAP["scarcity"],
];

function buildCreativeAngles(data: WizardPayload): RichCreativeAngles {
  const primary = ANGLE_MAP[data.persuasion_angle] ?? ANGLE_MAP["value"];
  const alternatives = Object.values(ANGLE_MAP)
    .filter((a) => a.name !== primary.name)
    .slice(0, 2);

  const channels = data.ad_channels;
  const formats = [
    { type: "image",    priority: 1, platforms: channels.length ? channels : ["meta"] },
    { type: "carousel", priority: 2, platforms: channels.filter((c) => ["meta"].includes(c)) },
    { type: "video",    priority: 3, platforms: channels.filter((c) => ["meta", "tiktok_ads", "youtube"].includes(c)) },
  ].filter((f) => f.platforms.length > 0);

  return {
    primary_angle: primary,
    alternative_angles: alternatives.length > 0 ? alternatives : FALLBACK_ANGLES,
    formats,
  };
}

// ─── Rule: Tracking checklist ─────────────────────────────────────────────────

const DEFAULT_EVENTS_BY_OBJECTIVE: Record<string, string[]> = {
  sales:      ["page_view", "add_to_cart", "initiate_checkout", "purchase"],
  leads:      ["page_view", "lead", "form_submit"],
  messages:   ["page_view", "whatsapp_click"],
  traffic:    ["page_view", "view_content"],
  awareness:  ["page_view", "view_content"],
  app_installs: ["app_install", "app_event"],
  booking:    ["page_view", "lead", "submit_form"],
  calls:      ["page_view", "call"],
};

function buildTrackingChecklist(data: WizardPayload): RichTrackingChecklist {
  const requiredEvents =
    data.key_events.length > 0
      ? data.key_events
      : DEFAULT_EVENTS_BY_OBJECTIVE[data.primary_objective] ?? ["page_view", "lead"];

  const isReady = data.tracking_status === "ready";
  const isPartial = data.tracking_status === "partial";
  const isMissing = data.tracking_status === "missing" || data.tracking_status === "unknown";

  const overallStatus: RichTrackingChecklist["setup_status"]["overall"] =
    isReady ? "ready" : isPartial ? "partial" : isMissing ? "missing" : "issues";

  const trackingScore = isReady ? 100 : isPartial ? 50 : isMissing ? 0 : 20;

  const items = requiredEvents.map((evt) => ({
    event: evt,
    status: isReady ? "ready" as const : isMissing ? "missing" as const : "partial" as const,
    required: true,
  }));

  const missingItems = isMissing || isPartial
    ? requiredEvents.map((evt) => ({
        item: evt,
        priority: "high" as const,
        reason: "Required for campaign optimization",
      }))
    : [];

  const hasPixel = data.tracking_tools.includes("pixel") || data.tracking_tools.includes("capi");
  const steps = hasPixel
    ? ["Verify pixel firing", "Set up conversion events", "Test with Pixel Helper", "Enable CAPI"]
    : ["Install Meta Pixel base code", "Set up conversion events", "Verify with Pixel Helper", "Test conversion firing"];

  return {
    required_events: requiredEvents,
    setup_status: { overall: overallStatus, score: trackingScore, items },
    missing_items: missingItems,
    implementation_guide: {
      steps,
      estimated_time: isReady ? "0 hours" : isPartial ? "1-2 hours" : "2-4 hours",
      complexity: isReady ? "low" : "medium",
    },
  };
}

// ─── Rule RF: Risk flags ───────────────────────────────────────────────────────

function buildRiskFlags(
  data: WizardPayload,
  risk: RiskResult,
  readiness: ReadinessResult
): RichRiskFlags {
  const critical: RiskFlag[] = [];
  const warnings: RiskFlag[] = [];
  const recommendations: RiskFlag[] = [];

  if (data.tracking_status === "missing" || data.tracking_status === "unknown") {
    critical.push({
      id: "CRIT-001",
      message: "No tracking setup detected. Cannot measure campaign performance.",
      impact: "Cannot optimize or measure ROI",
      action: "Install Meta Pixel, Google Analytics 4, and conversion events before launch.",
    });
  }

  if (data.creative_assets.includes("none") || data.creative_assets.length === 0) {
    critical.push({
      id: "CRIT-002",
      message: "No creative assets available. Cannot launch campaigns without ad content.",
      impact: "Campaign cannot go live",
      action: "Prepare minimum 3 image/video creatives before launch.",
    });
  }

  if (data.budget_band === "under_100") {
    warnings.push({
      id: "WARN-001",
      message: "Budget under 100/day is below recommended minimum for learning phase.",
      impact: "Slower optimization, limited reach",
      action: "Consider increasing to at least 150/day for faster results.",
    });
  }

  if (data.response_speed === "slower" || data.response_speed === "within_day") {
    warnings.push({
      id: "WARN-002",
      message: "Slow response speed may hurt conversion rates for message-based campaigns.",
      impact: "Lost leads and poor customer experience",
      action: "Set up auto-replies or dedicate response resources during campaign hours.",
    });
  }

  if (data.content_capacity === "no" || data.content_capacity === "hard") {
    warnings.push({
      id: "WARN-003",
      message: "Limited content production capacity may prevent creative refresh.",
      impact: "Ad fatigue after 7-10 days",
      action: "Prepare 5-7 creatives upfront, or plan a content production sprint.",
    });
  }

  if (data.previous_campaigns_status === "none") {
    recommendations.push({
      id: "REC-001",
      message: "First-time advertiser — start with a small test budget.",
      action: "Allocate 30-40% of budget for testing different audiences and creatives.",
    });
  }

  if (!data.usp || data.usp.trim().length < 10) {
    recommendations.push({
      id: "REC-002",
      message: "Unclear unique selling proposition. Ads may blend in with competition.",
      action: "Define and highlight one clear differentiator in all ad copy.",
    });
  }

  return {
    critical,
    warnings,
    recommendations,
    risk_score: {
      value: risk.score,
      level: risk.level,
      breakdown: risk.breakdown,
      confidence: 80,
      reasoning: `Risk score ${risk.score} (${risk.level}): ${Object.entries(risk.breakdown)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")}.`,
      rule_id: "RF-004",
    },
  };
}

// ─── Rule: 14-day plan ───────────────────────────────────────────────────────

function build14DaysPlan(data: WizardPayload, readiness: ReadinessResult): RichFirst14DaysPlan {
  const week1: DayTask[] = [
    { day: "Day 1", task: "Finalize campaign structure and audiences", priority: "high", owner: "media_buyer", blocker: false },
    { day: "Day 2", task: "Set up tracking and verify pixel firing", priority: "high", owner: "developer", blocker: readiness.breakdown.tracking < 10 },
    { day: "Day 3", task: "Create ad creatives (3-5 variants)", priority: "high", owner: "designer", blocker: false },
    { day: "Day 4", task: "Write ad copy for all angles", priority: "medium", owner: "copywriter", blocker: false },
    { day: "Day 5", task: "Launch first campaign (test budget)", priority: "high", owner: "media_buyer", blocker: true },
    { day: "Day 6", task: "Monitor initial performance metrics", priority: "medium", owner: "media_buyer", blocker: false },
    { day: "Day 7", task: "First optimization pass (pause losers)", priority: "medium", owner: "media_buyer", blocker: false },
  ];

  const week2: DayTask[] = [
    { day: "Day 8",  task: "Analyze first week data",          priority: "high",   owner: "media_buyer", blocker: false },
    { day: "Day 9",  task: "Scale winning ad sets (+20%)",      priority: "high",   owner: "media_buyer", blocker: false },
    { day: "Day 10", task: "Launch lookalike audiences",        priority: "medium", owner: "media_buyer", blocker: false },
    { day: "Day 11", task: "Test new creative angles",          priority: "medium", owner: "designer",    blocker: false },
    { day: "Day 12", task: "Review CAC vs target",              priority: "high",   owner: "media_buyer", blocker: false },
    { day: "Day 13", task: "Optimize landing page if needed",   priority: "low",    owner: "developer",   blocker: false },
    { day: "Day 14", task: "Full performance review and next steps", priority: "high", owner: "media_buyer", blocker: false },
  ];

  return {
    week_1: week1,
    week_2: week2,
    daily_budget_schedule: [
      { day: 1,  budget: "test_budget", note: "Start with test budget" },
      { day: 3,  budget: "full_budget", note: "Scale to full budget if metrics positive" },
      { day: 7,  budget: "optimize",    note: "Pause losers, scale winners" },
      { day: 10, budget: "scale",       note: "Increase budget on winning campaigns" },
    ],
    launch_sequence: [
      { step: 1, action: "Tracking setup",     depends_on: [],    duration: "1-2 days" },
      { step: 2, action: "Creative preparation", depends_on: [],  duration: "2-3 days" },
      { step: 3, action: "Campaign creation",  depends_on: [1, 2], duration: "1 day" },
      { step: 4, action: "Launch & monitor",   depends_on: [3],   duration: "ongoing" },
    ],
  };
}

// ─── Rule RF-003: Pre-launch fixes ───────────────────────────────────────────

function buildPreLaunchFixes(data: WizardPayload, tracking: RichTrackingChecklist): RichPreLaunchFixes {
  const mustFix: FixItem[] = [];
  const shouldFix: FixItem[] = [];
  const niceToHave: FixItem[] = [];

  if (data.tracking_status === "missing" || data.tracking_status === "unknown") {
    mustFix.push({
      item: "Install tracking pixel and conversion events",
      priority: "critical",
      estimated_time: "2-4 hours",
      action: "Set up Meta Pixel, GA4, and define conversion events.",
    });
  }

  if (!data.tracking_tools.includes("capi")) {
    shouldFix.push({
      item: "Set up Conversions API (CAPI)",
      priority: "high",
      estimated_time: "2-3 hours",
      action: "Install server-side tracking to complement browser pixel.",
    });
  }

  if (!data.tracking_tools.includes("utm")) {
    shouldFix.push({
      item: "Set up UTM tracking",
      priority: "medium",
      estimated_time: "30 minutes",
      action: "Add UTM parameters to all ad URLs for source tracking.",
    });
  }

  if (!data.existing_assets.includes("crm")) {
    niceToHave.push({
      item: "Connect CRM for lead tracking",
      priority: "low",
      estimated_time: "2-3 hours",
      action: "Integrate CRM to track lead quality and lifetime value.",
    });
  }

  niceToHave.push({
    item: "Set up A/B testing framework",
    priority: "low",
    estimated_time: "2-4 hours",
    action: "Use Meta's A/B testing or Google Optimize for landing pages.",
  });

  const totalHours = mustFix.reduce((acc, f) => acc + parseInt(f.estimated_time), 0);

  return {
    must_fix: mustFix,
    should_fix: shouldFix,
    nice_to_have: niceToHave,
    estimated_fix_time: `${totalHours || 0} hours`,
    recommendation: mustFix.length > 0
      ? `Launch possible after ${mustFix.length} critical fix${mustFix.length > 1 ? "es" : ""} (~${totalHours} hours).`
      : "Ready to launch after completing recommended fixes.",
    confidence: 75,
    reasoning: `${mustFix.length} must-fix, ${shouldFix.length} should-fix, ${niceToHave.length} nice-to-have items identified.`,
    rule_id: "RF-003",
  };
}

// ─── Rule: Executive summary ──────────────────────────────────────────────────

function buildExecutiveSummary(
  data: WizardPayload,
  readiness: ReadinessResult,
  risk: RiskResult
): ExecutiveSummary {
  const launchRec =
    readiness.score >= 65 && risk.score < 20
      ? "ready"
      : readiness.score >= 40
      ? "ready_with_fixes"
      : "not_ready";

  const offsetDays =
    launchRec === "ready" ? 1 : launchRec === "ready_with_fixes" ? 3 : 7;

  return {
    readiness_level: readiness.level,
    readiness_score: readiness.score,
    risk_level: risk.level,
    risk_score: risk.score,
    launch_recommendation: launchRec,
    estimated_launch_date: isoDate(offsetDays),
  };
}

// ─── Rule SS-004 / SS-005: Confidence + Timeline ─────────────────────────────

function buildConfidenceScore(
  data: WizardPayload,
  readiness: ReadinessResult
): StrategySummary["confidence_score"] {
  const b = readiness.breakdown;
  const score = Math.round(
    (b.tracking / 20) * 40 +
    (b.assets / 20) * 20 +
    (b.content / 20) * 20 +
    (b.conversion_path / 20) * 20
  );

  return {
    value: score,
    breakdown: {
      tracking: Math.round((b.tracking / 20) * 40),
      assets:   Math.round((b.assets / 20) * 20),
      content:  Math.round((b.content / 20) * 20),
      capacity: Math.round((b.conversion_path / 20) * 20),
      readiness: b.data_completeness,
    },
    confidence: 85,
    reasoning: `Confidence based on tracking (${b.tracking}), assets (${b.assets}), content (${b.content}), capacity (${b.conversion_path}).`,
    rule_id: "SS-004",
  };
}

function buildEstimatedTimeline(
  data: WizardPayload,
  readiness: ReadinessResult
): StrategySummary["estimated_timeline"] {
  let days = 7;
  const factors: string[] = [];

  if (readiness.score < 40) { days += 7; factors.push("Low readiness score requires more setup time"); }
  if (data.build_mode === "new_campaign") { days += 3; factors.push("New campaign requires full setup"); }
  if (data.tracking_status === "missing") { days += 2; factors.push("Missing tracking setup"); }
  if (data.content_capacity === "no" || data.content_capacity === "hard") {
    days += 3; factors.push("Limited content capacity slows creative prep");
  }

  const label = days <= 7 ? "Fast (1 week)" : days <= 14 ? "Standard (2 weeks)" : "Extended (3 weeks)";

  return {
    value: days,
    label,
    factors,
    confidence: 70,
    reasoning: `Timeline estimated at ${days} days based on build mode and readiness.`,
    rule_id: "SS-005",
  };
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function generateBlueprint(data: WizardPayload): RichBlueprintData {
  const start = Date.now();
  const flags: BlueprintFlags = { errors: [], warnings: [], infos: [] };

  const readiness = calcReadiness(data);
  const risk      = calcRisk(data, readiness);

  const objResult      = determineObjective(data);
  const channelResult  = determineChannels(data);
  const objective      = objResult.value;
  const channels       = channelResult.value;
  const funnelType     = determineFunnelType(data);
  const funnelStages   = buildFunnelStages(funnelType, objective);

  const strategySummary: StrategySummary = {
    recommended_objective: objResult,
    recommended_channels: channelResult,
    funnel_type: {
      value: funnelType,
      stages: funnelStages.map((s) => s.name),
      confidence: 85,
      reasoning: `${data.sales_motion} sales motion requires ${funnelType}-optimized funnel.`,
      rule_id: "SS-003",
    },
    confidence_score:    buildConfidenceScore(data, readiness),
    estimated_timeline:  buildEstimatedTimeline(data, readiness),
  };

  const tracking    = buildTrackingChecklist(data);
  const riskFlags   = buildRiskFlags(data, risk, readiness);
  const preLaunch   = buildPreLaunchFixes(data, tracking);
  const budget      = buildBudgetSplit(data, channels);

  for (const c of riskFlags.critical) flags.warnings.push(c.message);

  const elapsed = Date.now() - start;

  return {
    wizard_input: data,
    blueprint_id: `bp_${uid()}_${uid()}`,
    version: "1.0.0",
    rule_engine_version: "1.0.0",
    generated_at: new Date().toISOString(),
    executive_summary: buildExecutiveSummary(data, readiness, risk),
    strategy_summary: strategySummary,
    recommended_funnel: buildRecommendedFunnel(data, objective),
    campaign_structure: buildCampaignStructure(data, channels, objective),
    audience_structure: buildAudienceStructure(data),
    budget_split: budget,
    creative_angles: buildCreativeAngles(data),
    tracking_checklist: tracking,
    risk_flags: riskFlags,
    first_14_days_plan: build14DaysPlan(data, readiness),
    pre_launch_fixes: preLaunch,
    flags,
    debug: {
      execution_time_ms: elapsed,
      rules_executed: 15,
      scores_breakdown: {
        readiness: readiness.breakdown,
        risk: risk.breakdown,
      },
    },
  };
}

// ─── NEW: Granular Section Generator ─────────────────────────────────────────

export type SectionName =
  | "executive_summary"
  | "strategy_summary"
  | "recommended_funnel"
  | "campaign_structure"
  | "audience_structure"
  | "budget_split"
  | "creative_angles"
  | "tracking_checklist"
  | "risk_flags"
  | "first_14_days_plan"
  | "pre_launch_fixes";

/**
 * Generate a single section from Rules Engine.
 * Used as granular fallback when AI fails on a specific phase.
 */
export function generateSection(
  sectionName: SectionName,
  data: WizardPayload
): Partial<RichBlueprintData> {
  const readiness = calcReadiness(data);
  const risk = calcRisk(data, readiness);
  const objResult = determineObjective(data);
  const channelResult = determineChannels(data);
  const objective = objResult.value;
  const channels = channelResult.value;

  switch (sectionName) {
    case "executive_summary":
      return { executive_summary: buildExecutiveSummary(data, readiness, risk) };

    case "strategy_summary": {
      const funnelType = determineFunnelType(data);
      const funnelStages = buildFunnelStages(funnelType, objective);
      return {
        strategy_summary: {
          recommended_objective: objResult,
          recommended_channels: channelResult,
          funnel_type: {
            value: funnelType,
            stages: funnelStages.map((s) => s.name),
            confidence: 85,
            reasoning: `${data.sales_motion} sales motion requires ${funnelType}-optimized funnel.`,
            rule_id: "SS-003",
          },
          confidence_score: buildConfidenceScore(data, readiness),
          estimated_timeline: buildEstimatedTimeline(data, readiness),
        },
      };
    }

    case "recommended_funnel":
      return { recommended_funnel: buildRecommendedFunnel(data, objective) };

    case "campaign_structure":
      return { campaign_structure: buildCampaignStructure(data, channels, objective) };

    case "audience_structure":
      return { audience_structure: buildAudienceStructure(data) };

    case "budget_split":
      return { budget_split: buildBudgetSplit(data, channels) };

    case "creative_angles":
      return { creative_angles: buildCreativeAngles(data) };

    case "tracking_checklist":
      return { tracking_checklist: buildTrackingChecklist(data) };

    case "risk_flags":
      return { risk_flags: buildRiskFlags(data, risk, readiness) };

    case "first_14_days_plan":
      return { first_14_days_plan: build14DaysPlan(data, readiness) };

    case "pre_launch_fixes":
      return { pre_launch_fixes: buildPreLaunchFixes(data, buildTrackingChecklist(data)) };

    default:
      return {};
  }
}

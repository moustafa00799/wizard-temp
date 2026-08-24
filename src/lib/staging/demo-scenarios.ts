import type { CanonicalWizardInput } from "../contracts/wizard-input";
import type { ScopedStrategySelection } from "../contracts/knowledge-strategy-context";
import type { MarketEvidenceSnapshot } from "../contracts/knowledge";

const CAPTURED_AT = "2026-08-23T22:30:00+03:00";
type DemoMarket = "EG" | "SA";
type DemoIndustry = "ecommerce_general" | "education";
type DemoCurrency = "EGP" | "SAR";

export type StagingScenarioId = "sa-ecommerce" | "sa-education" | "eg-education";

export type StagingScenario = {
  id: StagingScenarioId;
  label: string;
  description: string;
  selection: ScopedStrategySelection;
  input: CanonicalWizardInput;
};

function input(overrides: Partial<CanonicalWizardInput>): CanonicalWizardInput {
  return {
    build_mode: "full_strategy",
    business_type: "ecommerce",
    offer_description: "عرض تجريبي منقح لا يمثل نشاطًا حقيقيًا.",
    sales_motion: "self_serve",
    customer_problem: "الحاجة إلى اختيار عرض موثوق وواضح الخطوة التالية.",
    key_value_drivers: ["القيمة", "الثقة", "وضوح الخطوة التالية"],
    usp: "عرض واضح مع تجربة شراء أو تسجيل سهلة.",
    primary_objective: "sales",
    secondary_objectives: ["qualified_leads"],
    north_star_kpi: "primary_conversion",
    existing_assets: ["website", "landing_page", "pixel"],
    previous_campaigns_status: "redacted staging history",
    past_performance_notes: "No production performance is included in this staging scenario.",
    ideal_customer: "جمهور تجريبي يطابق وصف العرض، دون بيانات شخصية.",
    awareness_level: "solution_aware",
    audience_segments: ["high_intent", "category_explorer"],
    geo_scope: "country",
    target_locations: ["Saudi Arabia"],
    offer_type: "discount",
    core_message: "قيمة واضحة وخطوة تالية مفهومة.",
    objections: ["price", "trust", "delivery"],
    persuasion_angle: "value_and_trust",
    conversion_destination: "website",
    ad_channels: ["meta", "google_ads"],
    campaign_direction: "prospecting",
    budget_band: "300_1000",
    budget_flexibility: "scale_if_positive",
    average_order_value: 250,
    profit_margin: 40,
    max_cac: 50,
    tracking_status: "partial",
    tracking_tools: ["pixel", "ga4"],
    key_events: ["page_view", "view_content", "add_to_cart", "purchase"],
    conversion_model: "online",
    creative_assets: ["images", "video"],
    content_capacity: "easy",
    constraints: [],
    response_speed: "within_hour",
    top_priority: "increase_sales",
    risk_tolerance: "medium",
    final_confirmed_inputs: false,
    ...overrides,
  };
}

function fact(
  factId: string,
  name: string,
  value: string | number | boolean,
  sourceIds: string[],
  market: DemoMarket,
  industry: DemoIndustry,
  currency: DemoCurrency,
): MarketEvidenceSnapshot["facts"][number] {
  return {
    factId,
    name,
    value,
    status: "evidence_backed",
    sourceIds,
    observedAt: "2024-12-31T00:00:00+00:00",
    scope: { market, industry, locale: "ar", currency },
  };
}

function unavailableBenchmark(market: DemoMarket, industry: DemoIndustry, currency: DemoCurrency, factId: string): MarketEvidenceSnapshot["facts"][number] {
  return {
    factId,
    name: "paid_media_benchmark",
    value: null,
    status: "unavailable",
    sourceIds: [],
    unavailableReason: "No independent CPC, CPA, CVR, ROAS, or saturation benchmark is included in this redacted staging fixture.",
    scope: { market, industry, locale: "ar", currency },
  };
}

function selection(params: {
  packageId: string;
  market: DemoMarket;
  industry: DemoIndustry;
  currency: DemoCurrency;
  sourceIds: string[];
  facts: MarketEvidenceSnapshot["facts"];
  unknowns: string[];
  dimensions: { D1: "ready"; D2: "ready"; D3: "ready"; D4: "ready"; D5: "ready" | "partial"; D6: "unavailable" };
}): ScopedStrategySelection {
  const snapshot: MarketEvidenceSnapshot = {
    contractVersion: "1.0",
    snapshotId: `staging-${params.packageId}`,
    market: params.market,
    industry: params.industry,
    locale: "ar",
    currency: params.currency,
    capturedAt: CAPTURED_AT,
    freshnessStatus: "fresh",
    facts: params.facts,
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns: params.unknowns,
    contradictions: [],
    sourceIds: params.sourceIds,
    confidence: 0.78,
    limitations: [
      "This is a redacted Personal Staging fixture, not production client data.",
      "Official market context is scoped and does not establish global Market Validation.",
    ],
  };
  return {
    packageId: params.packageId,
    market: params.market,
    industry: params.industry,
    snapshot,
    evidenceIds: params.sourceIds.map((sourceId) => `evidence-${sourceId}`),
    validationDecision: {
      gateVersion: "market-validation-gate-v1",
      market: params.market,
      industry: params.industry,
      packageId: params.packageId,
      packageStatus: "ready",
      contextDecision: "market_context_ready",
      marketValidated: true,
      dimensions: params.dimensions,
      blockers: ["D6_paid_media_benchmark_unavailable"],
      reason: "The staging fixture preserves scoped validation while paid-media benchmarks remain unavailable.",
      independentSourceCount: params.sourceIds.length,
    },
  };
}

const saEcommerceSources = ["staging-sa-ecommerce-market", "staging-sa-ecommerce-behavior", "staging-sa-ecommerce-policy"];
const saEducationSources = ["staging-sa-education-context", "staging-sa-education-policy", "staging-sa-education-participation"];
const egEducationSources = ["staging-eg-education-context", "staging-eg-education-policy", "staging-eg-education-participation"];

export const STAGING_SCENARIOS: readonly StagingScenario[] = [
  {
    id: "sa-ecommerce",
    label: "السعودية — التجارة الإلكترونية",
    description: "تجربة عميل منقحة لعرض تجارة إلكترونية محلي، مع أدلة سوقية scoped وبدون benchmarks مدفوعة.",
    input: input({
      business_type: "ecommerce",
      offer_description: "متجر إلكتروني تجريبي لمنتجات عملية مع توصيل وإرجاع واضحين.",
      customer_problem: "التردد في اختيار منتج موثوق وفهم التوصيل والإرجاع قبل الدفع.",
      primary_objective: "sales",
      ideal_customer: "متسوقون في السعودية يبحثون عن منتجات عملية وقيمة واضحة.",
      core_message: "قيمة واضحة وتجربة شراء موثوقة.",
      target_locations: ["Saudi Arabia"],
      ad_channels: ["meta", "google_ads"],
    }),
    selection: selection({
      packageId: "staging-market-sa-ecommerce-v1",
      market: "SA",
      industry: "ecommerce_general",
      currency: "SAR",
      sourceIds: saEcommerceSources,
      facts: [
        fact("staging-sa-ecommerce-reach", "Saudi internet and online-shopping context", 99, [saEcommerceSources[1]], "SA", "ecommerce_general", "SAR"),
        fact("staging-sa-ecommerce-ecosystem", "Saudi e-commerce ecosystem context", "available", [saEcommerceSources[0]], "SA", "ecommerce_general", "SAR"),
        unavailableBenchmark("SA", "ecommerce_general", "SAR", "staging-sa-ecommerce-paid-media"),
      ],
      unknowns: ["Registration and internet indicators do not equal demand, sales, or campaign performance."],
      dimensions: { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "ready", D6: "unavailable" },
    }),
  },
  {
    id: "sa-education",
    label: "السعودية — التعليم",
    description: "تجربة عميل منقحة لبرنامج تعليمي، مع فصل مؤشرات التعليم العام عن طلب العرض الخاص.",
    input: input({
      business_type: "education",
      offer_description: "برنامج تعليمي رقمي تجريبي يركز على مهارة قابلة للتحقق.",
      sales_motion: "lead_qualification",
      customer_problem: "الحاجة إلى مسار تعلم واضح وإثبات مناسب للمنهج والنتيجة.",
      primary_objective: "leads",
      secondary_objectives: ["course_signup"],
      north_star_kpi: "qualified_lead",
      existing_assets: ["landing_page", "pixel", "crm"],
      ideal_customer: "طلاب أو مهنيون في السعودية يطابقون متطلبات البرنامج.",
      audience_segments: ["students", "early_career_professionals"],
      offer_type: "course",
      core_message: "نتيجة تعلم محددة ومسار واضح.",
      objections: ["time", "trust", "outcome"],
      persuasion_angle: "proof_and_clarity",
      conversion_destination: "form",
      ad_channels: ["meta", "google_ads", "linkedin"],
      conversion_model: "lead",
      key_events: ["page_view", "lead", "submit_form", "course_signup"],
      target_locations: ["Saudi Arabia"],
      tracking_status: "partial",
    }),
    selection: selection({
      packageId: "staging-market-sa-education-v1",
      market: "SA",
      industry: "education",
      currency: "SAR",
      sourceIds: saEducationSources,
      facts: [
        fact("staging-sa-education-participation", "Saudi formal education context", 99.16, [saEducationSources[2]], "SA", "education", "SAR"),
        fact("staging-sa-education-regulation", "Saudi education and e-learning regulatory context", "available", [saEducationSources[1]], "SA", "education", "SAR"),
        unavailableBenchmark("SA", "education", "SAR", "staging-sa-education-paid-media"),
      ],
      unknowns: ["Formal education indicators do not establish demand or conversion for a private or online offer."],
      dimensions: { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "partial", D6: "unavailable" },
    }),
  },
  {
    id: "eg-education",
    label: "مصر — التعليم",
    description: "تجربة عميل منقحة لعرض تعليمي في مصر، مع قيود واضحة على تفسير بيانات التعليم الرسمي.",
    input: input({
      business_type: "education",
      offer_description: "برنامج تعليمي رقمي تجريبي لنتيجة تعلم محددة في مصر.",
      sales_motion: "lead_qualification",
      customer_problem: "الحاجة إلى تقييم عرض تعليمي واضح قبل التسجيل.",
      primary_objective: "leads",
      north_star_kpi: "qualified_lead",
      existing_assets: ["landing_page", "pixel"],
      ideal_customer: "طلاب أو أولياء أمور يطابقون متطلبات العرض، دون بيانات شخصية.",
      audience_segments: ["students", "parents"],
      offer_type: "course",
      core_message: "منهج واضح ونتيجة تعلم قابلة للفهم.",
      objections: ["price", "time", "trust"],
      persuasion_angle: "clarity_and_proof",
      conversion_destination: "form",
      ad_channels: ["meta", "google_ads"],
      conversion_model: "lead",
      key_events: ["page_view", "lead", "submit_form"],
      target_locations: ["Egypt"],
      tracking_status: "partial",
    }),
    selection: selection({
      packageId: "staging-market-eg-education-v1",
      market: "EG",
      industry: "education",
      currency: "EGP",
      sourceIds: egEducationSources,
      facts: [
        fact("staging-eg-education-participation", "Egypt formal education context", 93, [egEducationSources[2]], "EG", "education", "EGP"),
        fact("staging-eg-education-policy", "Egypt official education policy context", "available", [egEducationSources[1]], "EG", "education", "EGP"),
        unavailableBenchmark("EG", "education", "EGP", "staging-eg-education-paid-media"),
      ],
      unknowns: ["Formal education indicators do not measure private tutoring, test preparation, or online-course demand."],
      dimensions: { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "partial", D6: "unavailable" },
    }),
  },
];

export function getStagingScenario(id: string): StagingScenario {
  const scenario = STAGING_SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown staging scenario: ${id}`);
  return scenario;
}

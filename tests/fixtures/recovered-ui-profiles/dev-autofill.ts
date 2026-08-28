/**
 * DEV AUTO-FILL UTILITY
 * ─────────────────────
 * Fills all 37+ wizard fields with realistic dummy data.
 * All enum values are validated against the backend contract.
 * Triggered via: Ctrl+Shift+D
 *
 * BACKEND CONTRACT (for reference):
 *   geo_scope: single_city | multiple_cities | country | multiple_countries | local_radius
 *   ❌ geo_custom is NOT accepted by backend
 */

import type { DataModel } from "@/lib/store";

// ─── Preset profiles ──────────────────────────────────────────────────────────
// Multiple profiles so Ctrl+Shift+D cycles through different business scenarios

const PROFILES: DataModel[] = [
  // ── Profile 1: E-commerce skincare ────────────────────────────────────────
  {
    build_mode: "new_campaign",
    business_type: "ecommerce",
    offer_description:
      "Premium skincare subscription box — monthly delivery of organic, dermatologist-approved products curated for your skin type",
    sales_motion: "website_purchase",
    customer_problem:
      "People struggle to find skincare products that actually work for their skin type without spending hours researching",
    key_value_drivers: ["quality", "results", "trust", "specialization"],
    usp: "الوحيد في المنطقة يقدم صناديق عناية مخصصة بناءً على اختبار علمي للبشرة مع ضمان استرداد كامل خلال 30 يومًا",
    primary_objective: "sales",
    secondary_objectives: ["warm_audience", "brand_awareness", "reduce_cac"],
    north_star_kpi: "roas",
    existing_assets: [
      "website",
      "landing_page",
      "store",
      "instagram",
      "facebook_page",
      "pixel",
      "ga4",
    ],
    previous_campaigns_status: "weak",
    past_performance_notes:
      "Budget: 5000 EGP/month | CPL: 45 EGP | CPA: 180 EGP | ROAS: 1.8 | CTR: 1.2% — Campaigns were running but targeting was too broad",
    ideal_customer:
      "Women 25–40, urban areas (Cairo, Dubai, Riyadh), interested in beauty/wellness, mid-to-high income, follow beauty influencers",
    awareness_level: "solution_aware",
    audience_segments: [
      "high_intent",
      "website_visitors",
      "engagers",
      "lookalike",
    ],
    geo_scope: "country",
    target_locations: ["مصر", "الإمارات"],
    offer_type: "bundle",
    core_message:
      "تألقي بشكل طبيعي مع صندوق العناية العضوية المخصص لبشرتك — جربيه بضمان استرداد كامل",
    objections: ["price", "trust", "fear_of_outcome"],
    persuasion_angle: "result",
    conversion_destination: "store",
    ad_channels: ["meta", "google_ads", "tiktok_ads"],
    campaign_direction: "mixed",
    budget_band: "300_1000",
    budget_flexibility: "scale_if_positive",
    average_order_value: 350,
    profit_margin: 35,
    max_cac: 120,
    tracking_status: "partial",
    tracking_tools: ["pixel", "ga4", "gtm"],
    key_events: [
      "view_content",
      "add_to_cart",
      "initiate_checkout",
      "purchase",
    ],
    conversion_model: "online",
    creative_assets: ["images", "video", "testimonials", "ugc"],
    content_capacity: "easy",
    constraints: ["content", "approvals"],
    response_speed: "within_hour",
    top_priority: "increase_demand",
    risk_tolerance: "high_if_return",
    final_confirmed_inputs: true,
    ai_advisory_enabled: false,
    locale: "ar",
  },

  // ── Profile 2: Local service (plumbing/home services) ─────────────────────
  {
    build_mode: "diagnose_business",
    business_type: "local_service",
    offer_description:
      "سباكة وصيانة منزلية — خدمة طوارئ 24 ساعة في القاهرة الكبرى مع ضمان على العمل 6 أشهر",
    sales_motion: "call",
    customer_problem:
      "عطل مفاجئ في السباكة يسبب ضررًا كبيرًا والعثور على سباك موثوق وسريع أمر صعب",
    key_value_drivers: ["speed", "trust", "warranty", "easy_order"],
    usp: "نصل خلال 60 دقيقة أو الخدمة مجانًا — مرخصون ومؤمن عليهم — ضمان 6 أشهر",
    primary_objective: "calls",
    secondary_objectives: ["lead_capture", "brand_awareness"],
    north_star_kpi: "call_count",
    existing_assets: ["whatsapp_business", "facebook_page"],
    previous_campaigns_status: "first_time",
    past_performance_notes: null,
    ideal_customer:
      "أصحاب المنازل والمستأجرون في القاهرة 25–60 سنة، يحتاجون صيانة عاجلة",
    awareness_level: "purchase_ready",
    audience_segments: ["high_intent", "cold_audience"],
    geo_scope: "single_city",
    target_locations: ["القاهرة", "الجيزة"],
    offer_type: "guarantee",
    core_message: "سباك موثوق في 60 دقيقة — أو الخدمة مجانًا",
    objections: ["trust", "price", "fear_of_outcome"],
    persuasion_angle: "speed",
    conversion_destination: "call",
    ad_channels: ["meta", "google_ads"],
    campaign_direction: "prospecting",
    budget_band: "100_300",
    budget_flexibility: "flexible",
    average_order_value: 800,
    profit_margin: 40,
    max_cac: 200,
    tracking_status: "missing",
    tracking_tools: [],
    key_events: ["call", "whatsapp_click", "lead"],
    conversion_model: "offline",
    creative_assets: ["images", "logo"],
    content_capacity: "slow",
    constraints: ["content", "team", "time"],
    response_speed: "instant",
    top_priority: "tracking_fix",
    risk_tolerance: "medium",
    final_confirmed_inputs: true,
    ai_advisory_enabled: false,
    locale: "ar",
  },

  // ── Profile 3: B2B SaaS ───────────────────────────────────────────────────
  {
    build_mode: "test_plan",
    business_type: "b2b",
    offer_description:
      "B2B HR & payroll SaaS platform for companies 50–500 employees — automates payroll, attendance, and compliance",
    sales_motion: "sales_team",
    customer_problem:
      "HR managers waste 40+ hours/month on manual payroll and face compliance risks with ever-changing labor laws",
    key_value_drivers: [
      "results",
      "specialization",
      "trust",
      "after_sales",
      "speed",
    ],
    usp: "نظام الرواتب الوحيد المتوافق 100% مع قانون العمل المصري مع دعم 24/7 باللغة العربية",
    primary_objective: "leads",
    secondary_objectives: [
      "audience_testing",
      "message_testing",
      "warm_audience",
    ],
    north_star_kpi: "lead_count",
    existing_assets: ["website", "landing_page", "crm", "ga4", "pixel", "gtm"],
    previous_campaigns_status: "unclear",
    past_performance_notes:
      "Ran LinkedIn + Google campaigns — got 200 leads/month but conversion to demo was only 8%. CPL was $35.",
    ideal_customer:
      "HR Directors and CFOs at companies 50–500 employees in Egypt, UAE, Saudi — tech-forward, English-Arabic bilingual",
    awareness_level: "problem_aware",
    audience_segments: ["high_intent", "cold_audience", "lookalike"],
    geo_scope: "multiple_countries",
    target_locations: ["مصر", "السعودية", "الإمارات"],
    offer_type: "free_trial",
    core_message:
      "وفّر 40 ساعة شهريًا على الرواتب والحضور — جرب مجانًا 30 يومًا",
    objections: ["price", "complexity", "trust", "competitor_comparison"],
    persuasion_angle: "result",
    conversion_destination: "form",
    ad_channels: ["linkedin", "google_ads", "meta"],
    campaign_direction: "lead_generation",
    budget_band: "1000_5000",
    budget_flexibility: "flexible",
    average_order_value: 15000,
    profit_margin: 70,
    max_cac: 1500,
    tracking_status: "ready",
    tracking_tools: ["pixel", "ga4", "gtm", "crm", "utm"],
    key_events: ["lead", "submit_form", "complete_registration", "page_view"],
    conversion_model: "online",
    creative_assets: ["images", "video", "testimonials", "catalog"],
    content_capacity: "easy",
    constraints: ["approvals", "legal"],
    response_speed: "within_hour",
    top_priority: "lead_quality",
    risk_tolerance: "result_first",
    final_confirmed_inputs: true,
    ai_advisory_enabled: false,
    locale: "ar",
  },
];

let _profileIndex = 0;

/**
 * Returns the next dummy data profile (cycles through all profiles).
 * Each call to Ctrl+Shift+D picks the next scenario.
 */
export function getDummyData(): DataModel {
  const profile = PROFILES[_profileIndex % PROFILES.length];
  _profileIndex++;
  return profile;
}

/**
 * Profile names for the toast message
 */
export const PROFILE_NAMES = [
  "متجر إلكتروني (Skincare Subscription)",
  "خدمة محلية (Home Services)",
  "B2B SaaS (HR Platform)",
];

export function getCurrentProfileName(): string {
  return PROFILE_NAMES[(_profileIndex - 1) % PROFILE_NAMES.length];
}

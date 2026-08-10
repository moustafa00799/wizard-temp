/**
 * Funnel Stage Definitions
 * Maps funnel types to their stages, objectives, content, KPIs, and budget ratios
 */

const FUNNEL_DEFINITIONS = {
  education_funnel: {
    stages: [
      { name: "Awareness", objective: "reach", content: "problem_awareness", kpi: "cpm", budget_ratio: 0.25 },
      { name: "Education", objective: "traffic", content: "educational_content", kpi: "ctr", budget_ratio: 0.25 },
      { name: "Consideration", objective: "engagement", content: "social_proof", kpi: "engagement_rate", budget_ratio: 0.25 },
      { name: "Conversion", objective: "conversions", content: "offer", kpi: "cpa", budget_ratio: 0.25 }
    ]
  },
  solution_funnel: {
    stages: [
      { name: "Problem_Agitation", objective: "reach", content: "pain_point", kpi: "cpm", budget_ratio: 0.20 },
      { name: "Solution_Presentation", objective: "traffic", content: "solution_demo", kpi: "ctr", budget_ratio: 0.25 },
      { name: "Proof", objective: "engagement", content: "testimonials", kpi: "engagement_rate", budget_ratio: 0.25 },
      { name: "Conversion", objective: "conversions", content: "offer", kpi: "cpa", budget_ratio: 0.30 }
    ]
  },
  comparison_funnel: {
    stages: [
      { name: "Comparison", objective: "traffic", content: "comparison_table", kpi: "ctr", budget_ratio: 0.25 },
      { name: "Differentiation", objective: "engagement", content: "usp_highlight", kpi: "engagement_rate", budget_ratio: 0.25 },
      { name: "Proof", objective: "engagement", content: "case_studies", kpi: "engagement_rate", budget_ratio: 0.20 },
      { name: "Conversion", objective: "conversions", content: "limited_offer", kpi: "cpa", budget_ratio: 0.30 }
    ]
  },
  trust_funnel: {
    stages: [
      { name: "Trust_Building", objective: "engagement", content: "brand_story", kpi: "engagement_rate", budget_ratio: 0.20 },
      { name: "Offer", objective: "traffic", content: "offer_details", kpi: "ctr", budget_ratio: 0.25 },
      { name: "Urgency", objective: "conversions", content: "urgency_scarcity", kpi: "conversion_rate", budget_ratio: 0.25 },
      { name: "Conversion", objective: "conversions", content: "final_cta", kpi: "cpa", budget_ratio: 0.30 }
    ]
  },
  direct_conversion: {
    stages: [
      { name: "Offer", objective: "conversions", content: "direct_offer", kpi: "cpa", budget_ratio: 0.40 },
      { name: "Objection_Handling", objective: "conversions", content: "guarantee_faq", kpi: "conversion_rate", budget_ratio: 0.30 },
      { name: "Conversion", objective: "conversions", content: "final_cta", kpi: "cpa", budget_ratio: 0.30 }
    ]
  },
  direct_whatsapp: {
    stages: [
      { name: "Ad", objective: "messages", content: "whatsapp_cta", kpi: "cpm", budget_ratio: 0.60 },
      { name: "WhatsApp_Click", objective: "messages", content: "auto_reply", kpi: "message_cost", budget_ratio: 0.20 },
      { name: "Conversation", objective: "messages", content: "sales_script", kpi: "response_rate", budget_ratio: 0.15 },
      { name: "Close", objective: "conversions", content: "close_deal", kpi: "cpa", budget_ratio: 0.05 }
    ]
  },
  lead_gen_call: {
    stages: [
      { name: "Ad", objective: "leads", content: "lead_magnet", kpi: "cpl", budget_ratio: 0.40 },
      { name: "Landing_Page", objective: "leads", content: "form_optimization", kpi: "form_completion", budget_ratio: 0.25 },
      { name: "Form", objective: "leads", content: "form_fields", kpi: "form_completion", budget_ratio: 0.15 },
      { name: "Call_Schedule", objective: "conversions", content: "calendar_booking", kpi: "booking_rate", budget_ratio: 0.15 },
      { name: "Close", objective: "conversions", content: "sales_call", kpi: "cpa", budget_ratio: 0.05 }
    ]
  }
};

/**
 * Channel scoring matrix by business type
 */
const CHANNEL_SCORES_BASE = {
  local_service: { meta: 40, google_ads: 35, snapchat_ads: 10, tiktok_ads: 0, youtube: 0, linkedin: 0, x: 0 },
  ecommerce: { meta: 35, google_ads: 40, tiktok_ads: 30, snapchat_ads: 20, youtube: 0, linkedin: 0, x: 0 },
  app: { meta: 35, google_ads: 25, tiktok_ads: 40, snapchat_ads: 30, youtube: 0, linkedin: 0, x: 0 },
  b2b: { meta: 20, google_ads: 35, tiktok_ads: 0, snapchat_ads: 0, youtube: 15, linkedin: 50, x: 0 },
  education: { meta: 40, google_ads: 0, tiktok_ads: 35, snapchat_ads: 0, youtube: 30, linkedin: 0, x: 0 },
  consumer_product: { meta: 40, google_ads: 0, tiktok_ads: 40, snapchat_ads: 25, youtube: 0, linkedin: 0, x: 0 }
};

/**
 * Sales motion channel bonuses
 */
const SALES_MOTION_BONUSES = {
  website_purchase: { meta: 15, google_ads: 15 },
  whatsapp: { meta: 20, tiktok_ads: 10 },
  call: { google_ads: 20, meta: 10 },
  form: { meta: 15, linkedin: 15 },
  multi_channel: { meta: 10, google_ads: 10 }
};

/**
 * Conversion destination channel bonuses
 */
const CONVERSION_DESTINATION_BONUSES = {
  website: { google_ads: 10 },
  store: { meta: 10 },
  app: { meta: 15, tiktok_ads: 15 },
  booking: { google_ads: 15 },
  whatsapp: { meta: 10 },
  form: { meta: 5 },
  call: { google_ads: 5 }
};

/**
 * Budget band mappings
 */
const BUDGET_MAP = {
  under_100: { min: 10, max: 100, recommended: 50 },
  "100_300": { min: 100, max: 300, recommended: 200 },
  "300_1000": { min: 300, max: 1000, recommended: 500 },
  "1000_5000": { min: 1000, max: 5000, recommended: 2000 },
  above_5000: { min: 5000, max: 20000, recommended: 5000 },
  unknown: { min: null, max: null, recommended: null }
};

/**
 * Objective to campaign objective mapping
 */
const OBJECTIVE_MAP = {
  sales: "CONVERSIONS",
  leads: "LEAD_GENERATION",
  messages: "MESSAGES",
  traffic: "TRAFFIC",
  app_installs: "APP_INSTALLS",
  awareness: "AWARENESS",
  retargeting: "CONVERSIONS",
  booking: "CONVERSIONS",
  calls: "LEAD_GENERATION"
};

/**
 * Content templates by persuasion angle
 */
const ANGLE_TEMPLATES = {
  price: {
    hook: "وفر {amount} الآن",
    body: "أفضل سعر مضمون — إذا لقيته أرخص في أي مكان، نرجعلك الفرق",
    cta: "اطلب الآن بسعر خاص"
  },
  trust: {
    hook: "ثقة {count}+ عميل",
    body: "نحن نفهم مخاوفك — لهذا السبب {trust_proof}",
    cta: "انضم لعملائنا المطمئنين"
  },
  speed: {
    hook: "توصيل/تنفيذ خلال {timeframe}",
    body: "لا وقت للانتظار — احصل على {offer} بأسرع وقت",
    cta: "ابدأ الآن"
  },
  result: {
    hook: "نتائج مضمونة أو فلوسك ترجع",
    body: "{usp} — شوف النتائج بنفسك",
    cta: "احجز تجربتك"
  },
  specialization: {
    hook: "متخصصون في {field} منذ {years} سنة",
    body: "ليس مجرد {generic} — نحن {specialized}",
    cta: "تعرف على خبرتنا"
  },
  scarcity: {
    hook: "متبقي {count} فقط",
    body: "العرض ينتهي خلال {timeframe} — لا تفوت الفرصة",
    cta: "احجز مكانك الآن"
  },
  social_proof: {
    hook: "{customer_name} قال: {testimonial}",
    body: "شوف تجارب عملائنا الحقيقية",
    cta: "كن واحد منهم"
  },
  guarantee: {
    hook: "ضمان استرجاع كامل خلال {days} يوم",
    body: "لا مخاطرة — جرب {offer} بدون قلق",
    cta: "ابدأ تجربتك المجانية"
  },
  value: {
    hook: "أكثر قيمة بأقل سعر",
    body: "{offer_description} — كل اللي تحتاجه في مكان واحد",
    cta: "اكتشف القيمة"
  }
};

/**
 * CTA variants by objective
 */
const CTA_VARIANTS = {
  sales: ["اشترِ الآن", "احجز طلبك", "اطلب الآن"],
  leads: ["سجّل الآن", "احصل على عرضك", "ابدأ مجاناً"],
  messages: ["راسلنا على واتساب", "تواصل معنا", "اسألنا"],
  calls: ["اتصل الآن", "احجز مكالمتك", "تحدث مع خبير"],
  booking: ["احجز موعدك", "جدولة استشارة", "احجز الآن"],
  app_installs: ["حمّل التطبيق", "جربه الآن", "احصل على التطبيق"],
  awareness: ["تعرف علينا", "اكتشف المزيد", "تابعنا"],
  traffic: ["تصفح الآن", "اكتشف", "اعرف المزيد"],
  retargeting: ["عود الآن", "استكمل طلبك", "لا تفوت الفرصة"]
};

/**
 * Asset scoring weights for readiness calculation
 */
const ASSET_SCORES = {
  website: 3,
  landing_page: 3,
  store: 3,
  whatsapp_business: 2,
  crm: 2,
  facebook_page: 2,
  instagram: 2,
  tiktok: 2,
  ga4: 2,
  pixel: 2,
  capi: 2,
  catalog: 2
};

/**
 * Creative asset scoring weights
 */
const CREATIVE_SCORES = {
  images: 3,
  video: 4,
  ugc: 4,
  testimonials: 3,
  logo: 2,
  catalog: 3,
  offers: 3
};

/**
 * Content capacity bonuses
 */
const CONTENT_CAPACITY_BONUS = {
  easy: 5,
  slow: 3,
  hard: 1,
  no: 0
};

/**
 * Tracking status scores
 */
const TRACKING_STATUS_SCORES = {
  ready: 25,
  partial: 15,
  unknown: 5,
  missing: 0,
  issues: 5
};

/**
 * Tracking tool scores
 */
const TRACKING_TOOL_SCORES = {
  pixel: 20,
  capi: 20,
  ga4: 15,
  gtm: 10,
  sdk: 15,
  crm: 10,
  utm: 5,
  offline_tracking: 5
};

/**
 * Risk weights for constraints
 */
const CONSTRAINT_RISK_WEIGHTS = {
  time: 3,
  budget: 2,
  team: 3,
  approvals: 2,
  content: 3,
  legal: 4,
  technical: 3,
  platform_policy: 2,
  customer_service: 2,
  response_time: 3
};

/**
 * Response speed risk scores
 */
const RESPONSE_SPEED_RISK = {
  slower: 15,
  unknown: 10,
  within_day: 5,
  within_hour: 2,
  instant: 0
};

module.exports = {
  FUNNEL_DEFINITIONS,
  CHANNEL_SCORES_BASE,
  SALES_MOTION_BONUSES,
  CONVERSION_DESTINATION_BONUSES,
  BUDGET_MAP,
  OBJECTIVE_MAP,
  ANGLE_TEMPLATES,
  CTA_VARIANTS,
  ASSET_SCORES,
  CREATIVE_SCORES,
  CONTENT_CAPACITY_BONUS,
  TRACKING_STATUS_SCORES,
  TRACKING_TOOL_SCORES,
  CONSTRAINT_RISK_WEIGHTS,
  RESPONSE_SPEED_RISK
};

import type { DataModel } from "@/lib/store";

export type WizardAutofillProfile = DataModel & {
  scenario_id: string;
  title: string;
};

/** The ten approved Wizard fixtures used by the deterministic autofill cycle. */
export const WIZARD_AUTOFILL_PROFILES: WizardAutofillProfile[] = [
  {
    "scenario_id": "EX-001",
    "title": "E-commerce — Sales",
    "business_type": "ecommerce",
    "primary_objective": "sales",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "solution_aware",
    "geo_scope": "country",
    "target_locations": [
      "Saudi Arabia"
    ],
    "ad_channels": [
      "meta",
      "google_ads"
    ],
    "budget_band": "300_1000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 250,
    "profit_margin": 40,
    "max_cac": 50,
    "offer_type": "discount",
    "persuasion_angle": "price",
    "core_message": "أفضل منتجات بأقل سعر",
    "usp": "توصيل مجاني خلال 24 ساعة",
    "customer_problem": "المنتجات غالية في السوق",
    "existing_assets": [
      "website",
      "pixel",
      "catalog"
    ],
    "creative_assets": [
      "images",
      "video"
    ],
    "content_capacity": "easy",
    "tracking_status": "partial",
    "tracking_tools": [
      "pixel",
      "ga4"
    ],
    "conversion_destination": "website",
    "sales_motion": "website_purchase",
    "response_speed": "within_hour",
    "previous_campaigns_status": "first_time",
    "risk_tolerance": "medium",
    "constraints": [],
    "audience_segments": [
      "beginner",
      "high_intent"
    ],
    "offer_description": "متجر إلكتروني لمنتجات متنوعة مع توصيل مجاني خلال 24 ساعة",
    "key_value_drivers": [
      "price",
      "speed",
      "value"
    ],
    "secondary_objectives": [
      "reduce_cac",
      "brand_awareness"
    ],
    "north_star_kpi": "roas",
    "past_performance_notes": "",
    "ideal_customer": "متسوقون في السعودية يبحثون عن منتجات عملية بسعر مناسب وتوصيل سريع",
    "objections": [
      "price",
      "trust",
      "delivery"
    ],
    "key_events": [
      "page_view",
      "view_content",
      "add_to_cart",
      "purchase"
    ],
    "conversion_model": "online",
    "top_priority": "increase_sales",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-002",
    "title": "B2B — Leads",
    "business_type": "b2b",
    "primary_objective": "leads",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "problem_aware",
    "geo_scope": "multiple_countries",
    "target_locations": [
      "UAE",
      "Saudi Arabia",
      "Egypt"
    ],
    "ad_channels": [
      "linkedin",
      "google_ads"
    ],
    "budget_band": "1000_5000",
    "budget_flexibility": "fixed",
    "average_order_value": 5000,
    "profit_margin": 30,
    "max_cac": 500,
    "offer_type": "consultation",
    "persuasion_angle": "specialization",
    "core_message": "حلول ذكية لأعمالك",
    "usp": "خبرة 10 سنوات في السوق",
    "customer_problem": "صعوبة إدارة العمليات",
    "existing_assets": [
      "website",
      "landing_page",
      "crm"
    ],
    "creative_assets": [
      "images",
      "testimonials"
    ],
    "content_capacity": "slow",
    "tracking_status": "ready",
    "tracking_tools": [
      "pixel",
      "ga4",
      "crm",
      "gtm"
    ],
    "conversion_destination": "form",
    "sales_motion": "call",
    "response_speed": "within_day",
    "previous_campaigns_status": "successful",
    "risk_tolerance": "very_low",
    "constraints": [
      "legal"
    ],
    "audience_segments": [
      "advanced",
      "lookalike"
    ],
    "offer_description": "حلول B2B لإدارة العمليات وتحسين كفاءة فرق العمل",
    "key_value_drivers": [
      "results",
      "specialization",
      "trust"
    ],
    "secondary_objectives": [
      "lead_quality",
      "brand_awareness"
    ],
    "north_star_kpi": "qualified_lead_rate",
    "past_performance_notes": "المثال يصف أداءً سابقًا ناجحًا دون أرقام تفصيلية.",
    "ideal_customer": "مديرو العمليات وأصحاب القرار في شركات مصر والسعودية والإمارات",
    "objections": [
      "price",
      "complexity",
      "trust"
    ],
    "key_events": [
      "page_view",
      "submit_form",
      "lead",
      "demo_booked"
    ],
    "conversion_model": "hybrid",
    "top_priority": "lead_quality",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-003",
    "title": "Local Service — Calls",
    "business_type": "local_service",
    "primary_objective": "messages",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "unaware",
    "geo_scope": "local_radius",
    "target_locations": [
      "Riyadh"
    ],
    "ad_channels": [
      "meta",
      "google_ads"
    ],
    "budget_band": "100_300",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 150,
    "profit_margin": 50,
    "max_cac": 30,
    "offer_type": "free_trial",
    "persuasion_angle": "trust",
    "core_message": "خدمة موثوقة بأفضل سعر",
    "usp": "ضمان رضا العملاء",
    "customer_problem": "صعوبة إيجاد خدمة موثوقة",
    "existing_assets": [
      "website"
    ],
    "creative_assets": [
      "images"
    ],
    "content_capacity": "no",
    "tracking_status": "missing",
    "tracking_tools": [],
    "conversion_destination": "whatsapp",
    "sales_motion": "call",
    "response_speed": "within_hour",
    "previous_campaigns_status": "first_time",
    "risk_tolerance": "high_if_return",
    "constraints": [],
    "audience_segments": [
      "beginner"
    ],
    "offer_description": "خدمة محلية موثوقة تصل إلى العميل داخل نطاق الرياض",
    "key_value_drivers": [
      "speed",
      "trust",
      "easy_order"
    ],
    "secondary_objectives": [
      "lead_capture",
      "brand_awareness"
    ],
    "north_star_kpi": "qualified_call_count",
    "past_performance_notes": "",
    "ideal_customer": "سكان الرياض الذين يحتاجون خدمة موثوقة وسريعة بالقرب من موقعهم",
    "objections": [
      "trust",
      "price",
      "response_time"
    ],
    "key_events": [
      "whatsapp_click",
      "call",
      "lead"
    ],
    "conversion_model": "offline",
    "top_priority": "tracking_fix",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-004",
    "title": "App — Installs",
    "business_type": "app",
    "primary_objective": "app_installs",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "solution_aware",
    "geo_scope": "country",
    "target_locations": [
      "Egypt"
    ],
    "ad_channels": [
      "meta",
      "tiktok_ads"
    ],
    "budget_band": "1000_5000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 10,
    "profit_margin": 60,
    "max_cac": 5,
    "offer_type": "discount",
    "persuasion_angle": "value",
    "core_message": "تطبيقك المفضل بين يديك",
    "usp": "تجربة سلسة وسريعة",
    "customer_problem": "التطبيقات البطيئة",
    "existing_assets": [
      "store"
    ],
    "creative_assets": [
      "video",
      "ugc"
    ],
    "content_capacity": "easy",
    "tracking_status": "partial",
    "tracking_tools": [
      "sdk",
      "ga4"
    ],
    "conversion_destination": "app",
    "sales_motion": "multi_channel",
    "response_speed": "within_hour",
    "previous_campaigns_status": "weak",
    "risk_tolerance": "medium",
    "constraints": [],
    "audience_segments": [
      "high_intent",
      "lookalike"
    ],
    "offer_description": "تطبيق جوال يقدم تجربة سريعة وسلسة للمستخدمين",
    "key_value_drivers": [
      "value",
      "speed",
      "ease_of_use"
    ],
    "secondary_objectives": [
      "app_activation",
      "reduce_cac"
    ],
    "north_star_kpi": "cost_per_install",
    "past_performance_notes": "الأداء السابق ضعيف بحسب وصف المثال دون أرقام تفصيلية.",
    "ideal_customer": "مستخدمو الهواتف في مصر الباحثون عن تجربة تطبيق أسرع وأسهل",
    "objections": [
      "trust",
      "complexity",
      "privacy"
    ],
    "key_events": [
      "app_install",
      "sign_up",
      "activation"
    ],
    "conversion_model": "online",
    "top_priority": "app_activation",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-005",
    "title": "Education — Leads",
    "business_type": "education",
    "primary_objective": "leads",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "problem_aware",
    "geo_scope": "country",
    "target_locations": [
      "Saudi Arabia"
    ],
    "ad_channels": [
      "meta",
      "google_ads"
    ],
    "budget_band": "300_1000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 200,
    "profit_margin": 50,
    "max_cac": 40,
    "offer_type": "guarantee",
    "persuasion_angle": "social_proof",
    "core_message": "تعلم من الأفضل",
    "usp": "شهادات معتمدة عالمياً",
    "customer_problem": "صعوبة التعلم الذاتي",
    "existing_assets": [
      "website",
      "landing_page"
    ],
    "creative_assets": [
      "images",
      "video",
      "testimonials"
    ],
    "content_capacity": "easy",
    "tracking_status": "ready",
    "tracking_tools": [
      "pixel",
      "ga4",
      "gtm"
    ],
    "conversion_destination": "form",
    "sales_motion": "form",
    "response_speed": "within_day",
    "previous_campaigns_status": "first_time",
    "risk_tolerance": "medium",
    "constraints": [],
    "audience_segments": [
      "beginner",
      "advanced"
    ],
    "offer_description": "برنامج تعليمي رقمي يقدم دورات وشهادات معتمدة",
    "key_value_drivers": [
      "results",
      "trust",
      "quality"
    ],
    "secondary_objectives": [
      "lead_quality",
      "brand_awareness"
    ],
    "north_star_kpi": "qualified_lead_rate",
    "past_performance_notes": "",
    "ideal_customer": "طلاب ومهنيون في السعودية يريدون تطوير مهاراتهم بشهادة معتمدة",
    "objections": [
      "price",
      "time",
      "trust"
    ],
    "key_events": [
      "page_view",
      "submit_form",
      "lead",
      "course_signup"
    ],
    "conversion_model": "online",
    "top_priority": "lead_quality",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-006",
    "title": "Retargeting — E-commerce",
    "business_type": "ecommerce",
    "primary_objective": "sales",
    "build_mode": "optimize_existing",
    "campaign_direction": "retargeting",
    "awareness_level": "brand_aware",
    "geo_scope": "country",
    "target_locations": [
      "UAE"
    ],
    "ad_channels": [
      "meta",
      "google_ads"
    ],
    "budget_band": "300_1000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 180,
    "profit_margin": 35,
    "max_cac": 40,
    "offer_type": "bundle",
    "persuasion_angle": "scarcity",
    "core_message": "رجع للسلة — خصم إضافي 10%",
    "usp": "توصيل سريع ومجاني",
    "customer_problem": "نسي إكمال الطلب",
    "existing_assets": [
      "website",
      "pixel",
      "catalog",
      "facebook_page"
    ],
    "creative_assets": [
      "images",
      "video",
      "ugc"
    ],
    "content_capacity": "easy",
    "tracking_status": "ready",
    "tracking_tools": [
      "pixel",
      "capi",
      "ga4"
    ],
    "conversion_destination": "website",
    "sales_motion": "website_purchase",
    "response_speed": "within_hour",
    "previous_campaigns_status": "successful",
    "risk_tolerance": "medium",
    "constraints": [],
    "audience_segments": [
      "existing_customers",
      "high_intent"
    ],
    "offer_description": "حزمة منتجات لمستخدمين زاروا المتجر أو تركوا منتجات في السلة",
    "key_value_drivers": [
      "price",
      "speed",
      "trust"
    ],
    "secondary_objectives": [
      "recover_abandoned_cart",
      "increase_roas"
    ],
    "north_star_kpi": "roas",
    "past_performance_notes": "المثال يصف حملة سابقة ناجحة.",
    "ideal_customer": "زوار ومتسوقون في الإمارات تفاعلوا مع المتجر ولم يكملوا الشراء",
    "objections": [
      "price",
      "trust",
      "delivery"
    ],
    "key_events": [
      "view_content",
      "add_to_cart",
      "initiate_checkout",
      "purchase"
    ],
    "conversion_model": "online",
    "top_priority": "increase_roas",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-007",
    "title": "Testing Mode",
    "business_type": "consumer_product",
    "primary_objective": "awareness",
    "build_mode": "new_campaign",
    "campaign_direction": "testing",
    "awareness_level": "unaware",
    "geo_scope": "single_city",
    "target_locations": [
      "Dubai"
    ],
    "ad_channels": [
      "meta",
      "tiktok_ads",
      "snapchat_ads"
    ],
    "budget_band": "100_300",
    "budget_flexibility": "fixed",
    "average_order_value": 80,
    "profit_margin": 45,
    "max_cac": 20,
    "offer_type": "no_clear_offer",
    "persuasion_angle": "value",
    "core_message": "جرب المنتج الجديد",
    "usp": "منتج مبتكر وفريد",
    "customer_problem": "لا يوجد حل سهل",
    "existing_assets": [
      "website"
    ],
    "creative_assets": [
      "video"
    ],
    "content_capacity": "hard",
    "tracking_status": "partial",
    "tracking_tools": [
      "pixel"
    ],
    "conversion_destination": "website",
    "sales_motion": "website_purchase",
    "response_speed": "within_day",
    "previous_campaigns_status": "first_time",
    "risk_tolerance": "high_if_return",
    "constraints": [],
    "audience_segments": [
      "beginner"
    ],
    "offer_description": "منتج استهلاكي جديد يتم اختباره لاكتشاف أفضل جمهور ورسالة",
    "key_value_drivers": [
      "novelty",
      "value",
      "quality"
    ],
    "secondary_objectives": [
      "audience_testing",
      "message_testing"
    ],
    "north_star_kpi": "reach",
    "past_performance_notes": "",
    "ideal_customer": "مستهلكون في دبي منفتحون على تجربة منتجات جديدة",
    "objections": [
      "trust",
      "price",
      "need"
    ],
    "key_events": [
      "page_view",
      "view_content"
    ],
    "conversion_model": "online",
    "top_priority": "message_testing",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-008",
    "title": "Multi-Channel Scale",
    "business_type": "ecommerce",
    "primary_objective": "sales",
    "build_mode": "optimize_existing",
    "campaign_direction": "prospecting",
    "awareness_level": "solution_aware",
    "geo_scope": "multiple_countries",
    "target_locations": [
      "Saudi Arabia",
      "UAE",
      "Kuwait",
      "Qatar"
    ],
    "ad_channels": [
      "meta",
      "google_ads",
      "tiktok_ads",
      "snapchat_ads"
    ],
    "budget_band": "above_5000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 350,
    "profit_margin": 50,
    "max_cac": 70,
    "offer_type": "discount",
    "persuasion_angle": "guarantee",
    "core_message": "أفضل جودة بضمان استرداد",
    "usp": "ضمان استرداد 30 يوم",
    "customer_problem": "القلق من الجودة عند الشراء اونلاين",
    "existing_assets": [
      "website",
      "pixel",
      "catalog",
      "facebook_page",
      "instagram"
    ],
    "creative_assets": [
      "images",
      "video",
      "ugc",
      "testimonials"
    ],
    "content_capacity": "easy",
    "tracking_status": "ready",
    "tracking_tools": [
      "pixel",
      "capi",
      "ga4",
      "gtm"
    ],
    "conversion_destination": "website",
    "sales_motion": "website_purchase",
    "response_speed": "within_hour",
    "previous_campaigns_status": "successful",
    "risk_tolerance": "medium",
    "constraints": [],
    "audience_segments": [
      "lookalike",
      "high_intent",
      "existing_customers"
    ],
    "offer_description": "متجر إلكتروني متعدد الأسواق يبيع منتجات عالية الجودة بضمان استرداد",
    "key_value_drivers": [
      "quality",
      "trust",
      "guarantee"
    ],
    "secondary_objectives": [
      "increase_demand",
      "reduce_cac"
    ],
    "north_star_kpi": "roas",
    "past_performance_notes": "المثال يصف أداءً سابقًا ناجحًا.",
    "ideal_customer": "متسوقون في الخليج يهتمون بالجودة والضمان والتوصيل الموثوق",
    "objections": [
      "price",
      "trust",
      "quality"
    ],
    "key_events": [
      "view_content",
      "add_to_cart",
      "initiate_checkout",
      "purchase"
    ],
    "conversion_model": "online",
    "top_priority": "scale",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-009",
    "title": "Awareness Campaign",
    "business_type": "consumer_product",
    "primary_objective": "awareness",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "unaware",
    "geo_scope": "country",
    "target_locations": [
      "Saudi Arabia"
    ],
    "ad_channels": [
      "meta",
      "youtube"
    ],
    "budget_band": "300_1000",
    "budget_flexibility": "fixed",
    "average_order_value": 120,
    "profit_margin": 40,
    "max_cac": 30,
    "offer_type": "no_clear_offer",
    "persuasion_angle": "value",
    "core_message": "اكتشف المنتج اللي يغير حياتك",
    "usp": "تصميم عصري وأداء ممتاز",
    "customer_problem": "المنتجات الحالية غير فعالة",
    "existing_assets": [
      "website"
    ],
    "creative_assets": [
      "video"
    ],
    "content_capacity": "slow",
    "tracking_status": "partial",
    "tracking_tools": [
      "pixel",
      "ga4"
    ],
    "conversion_destination": "website",
    "sales_motion": "website_purchase",
    "response_speed": "within_day",
    "previous_campaigns_status": "first_time",
    "risk_tolerance": "high_if_return",
    "constraints": [],
    "audience_segments": [
      "beginner"
    ],
    "offer_description": "منتج استهلاكي جديد يحتاج إلى بناء الوعي واختبار الرسالة",
    "key_value_drivers": [
      "innovation",
      "value",
      "quality"
    ],
    "secondary_objectives": [
      "brand_awareness",
      "audience_testing"
    ],
    "north_star_kpi": "reach",
    "past_performance_notes": "",
    "ideal_customer": "مستهلكون في السعودية لم يسبق لهم معرفة المنتج ويحتاجون إلى تثقيف أولي",
    "objections": [
      "trust",
      "need",
      "price"
    ],
    "key_events": [
      "page_view",
      "view_content",
      "video_view"
    ],
    "conversion_model": "online",
    "top_priority": "awareness_growth",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  },
  {
    "scenario_id": "EX-010",
    "title": "Lead Gen — High Risk Tolerance",
    "business_type": "b2b",
    "primary_objective": "leads",
    "build_mode": "new_campaign",
    "campaign_direction": "prospecting",
    "awareness_level": "solution_aware",
    "geo_scope": "country",
    "target_locations": [
      "Egypt"
    ],
    "ad_channels": [
      "meta",
      "linkedin"
    ],
    "budget_band": "300_1000",
    "budget_flexibility": "scale_if_positive",
    "average_order_value": 3000,
    "profit_margin": 25,
    "max_cac": 300,
    "offer_type": "free_trial",
    "persuasion_angle": "result",
    "core_message": "حقق نتائج ملموسة في 30 يوم",
    "usp": "نتائج مضمونة أو استرداد كامل",
    "customer_problem": "ضياع الوقت والموارد بدون نتيجة",
    "existing_assets": [
      "website",
      "landing_page"
    ],
    "creative_assets": [
      "images",
      "testimonials"
    ],
    "content_capacity": "easy",
    "tracking_status": "partial",
    "tracking_tools": [
      "pixel",
      "ga4"
    ],
    "conversion_destination": "form",
    "sales_motion": "form",
    "response_speed": "within_hour",
    "previous_campaigns_status": "unclear",
    "risk_tolerance": "high_if_return",
    "constraints": [],
    "audience_segments": [
      "advanced"
    ],
    "offer_description": "خدمة B2B تساعد الشركات على تحقيق نتائج ملموسة خلال فترة تجريبية",
    "key_value_drivers": [
      "results",
      "trust",
      "speed"
    ],
    "secondary_objectives": [
      "lead_quality",
      "audience_testing"
    ],
    "north_star_kpi": "qualified_lead_rate",
    "past_performance_notes": "الأداء السابق غير واضح بحسب وصف المثال.",
    "ideal_customer": "أصحاب القرار في شركات مصر المهتمون بنتائج قابلة للقياس",
    "objections": [
      "price",
      "trust",
      "complexity"
    ],
    "key_events": [
      "page_view",
      "submit_form",
      "lead",
      "demo_booked"
    ],
    "conversion_model": "hybrid",
    "top_priority": "lead_volume",
    "final_confirmed_inputs": false,
    "ai_advisory_enabled": false
  }
];


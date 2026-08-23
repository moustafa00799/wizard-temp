import {
  IndustryProfileSchema,
  type BusinessBranch,
  type IndustryProfile,
} from "@/lib/contracts/knowledge";

const PROFILE_LIMITATION = "Draft heuristic profile for deterministic planning only; it is not industry-validated or market-validated until reviewed against approved, dated sources.";

function profile(input: IndustryProfile): IndustryProfile {
  return IndustryProfileSchema.parse(input);
}

export const INDUSTRY_PROFILES: readonly IndustryProfile[] = [
  profile({
    contractVersion: "1.0",
    profileId: "industry-profile-ecommerce-general-v1",
    version: "1.0",
    industryKey: "ecommerce_general",
    displayName: "General E-commerce",
    branch: "ecommerce",
    markets: ["EG", "SA", "AE", "GCC"],
    locales: ["ar", "en"],
    purchaseCycle: {
      stages: ["discovery", "consideration", "checkout", "repeat_purchase"],
      typicalDuration: "Variable; must be measured from the client's own funnel data.",
      sourceIds: [],
      status: "directional",
    },
    commonOfferTypes: ["product_bundle", "limited_offer", "free_shipping", "first_purchase_offer"],
    audienceSegments: ["high_intent_shoppers", "category_explorers", "repeat_customers", "cart_abandoners"],
    objections: ["price", "delivery", "returns", "trust", "product_fit"],
    kpis: [
      { key: "purchase", definition: "Completed order attributed to the agreed conversion model.", measurementEvent: "purchase", sourceIds: [] },
      { key: "add_to_cart", definition: "Product added to cart before checkout.", measurementEvent: "add_to_cart", sourceIds: [] },
      { key: "checkout_rate", definition: "Checkout progression measured from client-owned event data.", measurementEvent: "begin_checkout", sourceIds: [] },
    ],
    complianceConstraints: ["Confirm product, pricing, promotion, privacy, and consumer-protection requirements for the target jurisdiction before launch."],
    likelyChannels: ["meta", "google_ads", "tiktok_ads"],
    trackingNeeds: ["pixel_or_tag", "server_side_events_when_available", "purchase_value_and_currency", "catalog_or_product_feed", "consent_and_privacy_review"],
    marketTerms: ["shopping", "delivery", "returns", "bundle", "discount"],
    seasonality: [],
    sourceIds: [],
    limitations: [PROFILE_LIMITATION, "No CPC, CVR, saturation, demand, or competitor-performance benchmark is included."],
    status: "draft",
  }),
  profile({
    contractVersion: "1.0",
    profileId: "industry-profile-local-service-general-v1",
    version: "1.0",
    industryKey: "local_service_general",
    displayName: "General Local Service",
    branch: "local_service",
    markets: ["EG", "SA", "AE", "GCC"],
    locales: ["ar", "en"],
    purchaseCycle: {
      stages: ["need_recognition", "local_search", "qualification", "booking", "service_delivery", "referral"],
      typicalDuration: "Usually measured from lead response to booked appointment using client-owned CRM or call records.",
      sourceIds: [],
      status: "directional",
    },
    commonOfferTypes: ["consultation", "inspection", "appointment", "service_package", "introductory_offer"],
    audienceSegments: ["nearby_intent", "urgent_need", "repeat_clients", "referral_audience"],
    objections: ["trust", "response_speed", "price", "availability", "service_quality"],
    kpis: [
      { key: "qualified_lead", definition: "Lead that meets the agreed service and location criteria.", measurementEvent: "lead_qualified", sourceIds: [] },
      { key: "booked_appointment", definition: "Confirmed appointment recorded by the client.", measurementEvent: "appointment_booked", sourceIds: [] },
      { key: "response_time", definition: "Elapsed time from lead receipt to first qualified response.", measurementEvent: "lead_contacted", sourceIds: [] },
    ],
    complianceConstraints: ["Confirm licensing, service claims, privacy, call recording, and jurisdiction-specific advertising restrictions before launch."],
    likelyChannels: ["google_ads", "meta", "tiktok_ads"],
    trackingNeeds: ["call_tracking_or_manual_call_log", "lead_form_event", "messaging_event", "location_and_service_area_validation", "crm_status_sync_when_available"],
    marketTerms: ["nearby", "appointment", "quote", "emergency", "service area"],
    seasonality: [],
    sourceIds: [],
    limitations: [PROFILE_LIMITATION, "Local demand, CPC, response-rate, and saturation values remain unavailable without approved local evidence."],
    status: "draft",
  }),
  profile({
    contractVersion: "1.0",
    profileId: "industry-profile-education-general-v1",
    version: "1.0",
    industryKey: "education_general",
    displayName: "General Education and Training",
    branch: "education",
    markets: ["EG", "SA", "AE", "GCC"],
    locales: ["ar", "en"],
    purchaseCycle: {
      stages: ["need_awareness", "consideration", "enrollment", "attendance", "completion", "referral"],
      typicalDuration: "Must be measured from the client's admission, enrollment, attendance, and completion data; it varies by course and learner segment.",
      sourceIds: [],
      status: "directional",
    },
    commonOfferTypes: ["course", "cohort", "workshop", "exam_prep", "tutoring", "subscription"],
    audienceSegments: ["students", "parents", "professionals", "career_switchers", "skill_upgraders"],
    objections: ["trust", "time", "price", "accreditation", "outcomes", "fit"],
    kpis: [
      { key: "qualified_lead", definition: "Lead meeting the agreed learner, programme, and eligibility criteria.", measurementEvent: "lead_qualified", sourceIds: [] },
      { key: "application", definition: "Completed application or admission request recorded by the provider.", measurementEvent: "application_submitted", sourceIds: [] },
      { key: "enrollment", definition: "Confirmed enrollment or paid registration under the provider's definition.", measurementEvent: "course_signup", sourceIds: [] },
    ],
    complianceConstraints: [
      "Verify accreditation, licensing, instructor and outcome claims before launch in the target jurisdiction.",
      "Do not promise guaranteed grades, employment, admission, income, or learning outcomes unless the claim is legally approved and directly substantiated.",
      "Review age, parent or guardian consent, learner data, privacy, testimonials, and any sensitive-category restrictions before launch.",
    ],
    likelyChannels: ["google_ads", "meta", "youtube", "tiktok_ads", "linkedin"],
    trackingNeeds: ["lead_form_event", "application_event", "course_signup_event", "qualified_lead_definition", "admission_or_crm_stage_mapping", "consent_and_privacy_review"],
    marketTerms: ["course", "program", "certificate", "skills", "enrollment", "training"],
    seasonality: [],
    sourceIds: [],
    limitations: [
      PROFILE_LIMITATION,
      "Formal-education market evidence does not validate demand for a specific private, tutoring, test-preparation, or online offer.",
      "No CPC, CPA, CVR, ROAS, saturation, lead-quality, or completion benchmark is included.",
    ],
    status: "draft",
  }),
  profile({
    contractVersion: "1.0",
    profileId: "industry-profile-mobile-app-general-v1",
    version: "1.0",
    industryKey: "mobile_app_general",
    displayName: "General Mobile App",
    branch: "app",
    markets: ["EG", "SA", "AE", "GCC"],
    locales: ["ar", "en"],
    purchaseCycle: {
      stages: ["awareness", "store_visit", "install", "activation", "retention", "monetization"],
      typicalDuration: "Must be measured by app event cohorts and the product's activation definition.",
      sourceIds: [],
      status: "directional",
    },
    commonOfferTypes: ["free_trial", "freemium", "subscription", "in_app_feature", "activation_offer"],
    audienceSegments: ["problem_aware_users", "category_intenders", "installed_not_activated", "active_users"],
    objections: ["trust", "permissions", "value_before_install", "privacy", "learning_curve"],
    kpis: [
      { key: "install", definition: "App install attributed to the agreed platform and measurement model.", measurementEvent: "install", sourceIds: [] },
      { key: "activation", definition: "User completes the product-defined activation event.", measurementEvent: "activation", sourceIds: [] },
      { key: "retention", definition: "User returns within the product-defined retention window.", measurementEvent: "retention", sourceIds: [] },
    ],
    complianceConstraints: ["Confirm app-store, privacy, consent, children or sensitive-category, and jurisdiction-specific advertising requirements."],
    likelyChannels: ["meta", "google_ads", "tiktok_ads"],
    trackingNeeds: ["mobile_measurement_partner_or_sdk", "install_and_activation_events", "deep_link_validation", "consent_mode", "subscription_or_revenue_event_when_applicable"],
    marketTerms: ["install", "activation", "subscription", "app store", "privacy"],
    seasonality: [],
    sourceIds: [],
    limitations: [PROFILE_LIMITATION, "No install cost, retention, conversion, or competitor-performance benchmark is included."],
    status: "draft",
  }),
  profile({
    contractVersion: "1.0",
    profileId: "industry-profile-b2b-general-v1",
    version: "1.0",
    industryKey: "b2b_general",
    displayName: "General B2B",
    branch: "b2b",
    markets: ["EG", "SA", "AE", "GCC"],
    locales: ["ar", "en"],
    purchaseCycle: {
      stages: ["account_awareness", "problem_validation", "stakeholder_alignment", "sales_qualification", "proposal", "procurement", "renewal"],
      typicalDuration: "Longer and multi-stakeholder by design; use the client's CRM stages as the measurement source.",
      sourceIds: [],
      status: "directional",
    },
    commonOfferTypes: ["demo", "consultation", "audit", "pilot", "enterprise_subscription"],
    audienceSegments: ["decision_makers", "technical_evaluators", "procurement", "department_champions", "existing_accounts"],
    objections: ["implementation", "security", "procurement", "integration", "switching_cost", "proof_of_value"],
    kpis: [
      { key: "marketing_qualified_lead", definition: "Lead meeting the agreed qualification criteria.", measurementEvent: "mql_created", sourceIds: [] },
      { key: "sales_accepted_lead", definition: "Lead accepted by sales under the client's process.", measurementEvent: "sal_created", sourceIds: [] },
      { key: "opportunity", definition: "Qualified opportunity recorded in the CRM.", measurementEvent: "opportunity_created", sourceIds: [] },
    ],
    complianceConstraints: ["Confirm sector-specific claims, security assertions, privacy, procurement, and regulated-industry requirements before launch."],
    likelyChannels: ["linkedin", "google_ads", "meta"],
    trackingNeeds: ["crm_stage_mapping", "lead_source_capture", "offline_conversion_feedback", "consent_and_privacy_review", "sales_response_time"],
    marketTerms: ["demo", "consultation", "enterprise", "integration", "procurement"],
    seasonality: [],
    sourceIds: [],
    limitations: [PROFILE_LIMITATION, "No account-size, pipeline, win-rate, CPC, CAC, or saturation benchmark is included."],
    status: "draft",
  }),
] as const;

export type IndustryProfileMatchStatus = "matched" | "unmatched";

export type IndustryMatchRequest = {
  branch?: BusinessBranch;
  industryKey?: string;
};

export type IndustryMatchResult = {
  status: IndustryProfileMatchStatus;
  profile?: IndustryProfile;
  confidence: number;
  matchedBy: "exact_key" | "explicit_alias" | "none";
  reason: string;
};

const INDUSTRY_ALIASES: Readonly<Record<string, string>> = {
  ecommerce: "ecommerce_general",
  "online_store": "ecommerce_general",
  "online_retail": "ecommerce_general",
  retail: "ecommerce_general",
  local_services: "local_service_general",
  service_business: "local_service_general",
  appointments: "local_service_general",
  education: "education_general",
  online_courses: "education_general",
  training: "education_general",
  mobile_app: "mobile_app_general",
  app: "mobile_app_general",
  saas: "b2b_general",
  enterprise: "b2b_general",
  b2b: "b2b_general",
};

function normalizeKey(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized || undefined;
}

export function resolveIndustryProfile(request: IndustryMatchRequest): IndustryMatchResult {
  const requestedKey = normalizeKey(request.industryKey);
  if (!requestedKey) {
    return {
      status: "unmatched",
      confidence: 0,
      matchedBy: "none",
      reason: "No explicit industry key was supplied; the resolver does not infer an industry from free text.",
    };
  }

  const exact = INDUSTRY_PROFILES.find((candidate) => (
    candidate.industryKey === requestedKey && (!request.branch || candidate.branch === request.branch)
  ));
  if (exact) {
    return {
      status: "matched",
      profile: exact,
      confidence: 1,
      matchedBy: "exact_key",
      reason: `Matched explicit industry key ${requestedKey} to branch ${exact.branch}.`,
    };
  }

  const aliasTarget = INDUSTRY_ALIASES[requestedKey];
  if (aliasTarget) {
    const aliasProfile = INDUSTRY_PROFILES.find((candidate) => (
      candidate.industryKey === aliasTarget && (!request.branch || candidate.branch === request.branch)
    ));
    if (aliasProfile) {
      return {
        status: "matched",
        profile: aliasProfile,
        confidence: 0.85,
        matchedBy: "explicit_alias",
        reason: `Matched explicit industry alias ${requestedKey} to ${aliasTarget}.`,
      };
    }
  }

  return {
    status: "unmatched",
    confidence: 0,
    matchedBy: "none",
    reason: request.branch
      ? `No profile explicitly covers industry ${requestedKey} under branch ${request.branch}.`
      : `No profile explicitly covers industry ${requestedKey}; no fallback inference was used.`,
  };
}

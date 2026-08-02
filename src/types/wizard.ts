// ============================================================
// Campaign Diagnosis Wizard - TypeScript Types
// ============================================================

export type BuildMode = 
  | 'new_campaign' 
  | 'optimize_existing' 
  | 'diagnose_business' 
  | 'restructure_account' 
  | 'test_plan';

export type BusinessType = 
  | 'local_service' 
  | 'ecommerce' 
  | 'consumer_product' 
  | 'app' 
  | 'b2b' 
  | 'education' 
  | 'agency_service' 
  | 'other';

export type SalesMotion = 
  | 'website_purchase' 
  | 'whatsapp' 
  | 'call' 
  | 'form' 
  | 'messages' 
  | 'sales_team' 
  | 'multi_channel';

export type PrimaryObjective = 
  | 'sales' 
  | 'leads' 
  | 'messages' 
  | 'traffic' 
  | 'app_installs' 
  | 'awareness' 
  | 'retargeting' 
  | 'booking' 
  | 'calls';

export type NorthStarKPI = 
  | 'sales_count' 
  | 'cac' 
  | 'message_count' 
  | 'lead_count' 
  | 'call_count' 
  | 'install_count' 
  | 'roas' 
  | 'conversion_rate';

export type PreviousCampaignsStatus = 'successful' | 'weak' | 'unclear' | 'none';

export type AwarenessLevel = 'unaware' | 'problem_aware' | 'solution_aware' | 'brand_aware' | 'purchase_ready';

export type AudienceSegment = 
  | 'beginner' 
  | 'mid' 
  | 'advanced' 
  | 'high_intent' 
  | 'website_visitors' 
  | 'engagers' 
  | 'existing_customers' 
  | 'lookalike' 
  | 'cold_audience';

export type GeoScope = 'single_city' | 'multiple_cities' | 'country' | 'multiple_countries' | 'local_radius' | 'geo_custom';

export type OfferType = 
  | 'discount' 
  | 'bundle' 
  | 'consultation' 
  | 'free_trial' 
  | 'guarantee' 
  | 'free_shipping' 
  | 'special_price' 
  | 'limited_time' 
  | 'no_clear_offer';

export type PersuasionAngle = 
  | 'price' 
  | 'value' 
  | 'trust' 
  | 'speed' 
  | 'result' 
  | 'specialization' 
  | 'scarcity' 
  | 'social_proof' 
  | 'guarantee';

export type ConversionDestination = 
  | 'website' 
  | 'store' 
  | 'whatsapp' 
  | 'messenger' 
  | 'call' 
  | 'form' 
  | 'app' 
  | 'booking';

export type AdChannel = 
  | 'meta' 
  | 'google_ads' 
  | 'tiktok_ads' 
  | 'snapchat_ads' 
  | 'youtube' 
  | 'linkedin' 
  | 'x' 
  | 'multi_channel';

export type CampaignDirection = 
  | 'prospecting' 
  | 'retargeting' 
  | 'mixed' 
  | 'lead_generation' 
  | 'conversion' 
  | 'awareness' 
  | 'testing' 
  | 'unknown';

export type BudgetBand = 'under_100' | '100_300' | '300_1000' | '1000_5000' | 'above_5000' | 'unknown';

export type BudgetFlexibility = 'fixed' | 'slightly_flexible' | 'flexible' | 'scale_if_positive';

export type TrackingStatus = 'ready' | 'partial' | 'unknown' | 'missing' | 'issues';

export type TrackingTool = 
  | 'pixel' 
  | 'capi' 
  | 'ga4' 
  | 'gtm' 
  | 'sdk' 
  | 'crm' 
  | 'offline_tracking' 
  | 'utm' 
  | 'none';

export type KeyEvent = 
  | 'page_view' 
  | 'view_content' 
  | 'add_to_cart' 
  | 'initiate_checkout' 
  | 'purchase' 
  | 'lead' 
  | 'complete_registration' 
  | 'submit_form' 
  | 'call' 
  | 'whatsapp_click' 
  | 'app_install' 
  | 'app_event' 
  | 'offline_sale';

export type ConversionModel = 'online' | 'offline' | 'both' | 'unknown';

export type CreativeAsset = 
  | 'images' 
  | 'video' 
  | 'ugc' 
  | 'testimonials' 
  | 'logo' 
  | 'catalog' 
  | 'offers' 
  | 'none';

export type ContentCapacity = 'easy' | 'slow' | 'hard' | 'no';

export type Constraint = 
  | 'time' 
  | 'budget' 
  | 'team' 
  | 'approvals' 
  | 'content' 
  | 'legal' 
  | 'technical' 
  | 'platform_policy' 
  | 'customer_service' 
  | 'response_time';

export type ResponseSpeed = 'instant' | 'within_hour' | 'within_day' | 'slower' | 'unknown';

export type TopPriority = 
  | 'increase_demand' 
  | 'reduce_cost' 
  | 'lead_quality' 
  | 'conversion_rate' 
  | 'awareness' 
  | 'tracking_fix' 
  | 'account_structure';

export type RiskTolerance = 'very_low' | 'medium' | 'high_if_return' | 'result_first';

// ============================================================
// Wizard State Interface
// ============================================================

export interface WizardState {
  // Step 0 - Build Mode
  build_mode: BuildMode | null;

  // Step 1 - Business Definition
  business_type: BusinessType | null;
  offer_description: string;
  sales_motion: SalesMotion | null;

  // Step 2 - Problem & Value
  customer_problem: string;
  key_value_drivers: string[];
  usp: string;

  // Step 3 - Objective
  primary_objective: PrimaryObjective | null;
  secondary_objectives: string[];
  north_star_kpi: NorthStarKPI | null;

  // Step 4 - Readiness
  existing_assets: string[];
  previous_campaigns_status: PreviousCampaignsStatus | null;
  past_performance_notes: string;

  // Step 5 - Audience
  ideal_customer: string;
  awareness_level: AwarenessLevel | null;
  audience_segments: string[];
  geo_scope: GeoScope | null;
  target_locations: string[];

  // Step 6 - Offer & Messaging
  offer_type: OfferType | null;
  core_message: string;
  objections: string[];
  persuasion_angle: PersuasionAngle | null;

  // Step 7 - Channel & Conversion
  conversion_destination: ConversionDestination | null;
  ad_channels: string[];
  campaign_direction: CampaignDirection | null;

  // Step 8 - Budget
  budget_band: BudgetBand | null;
  budget_flexibility: BudgetFlexibility | null;
  average_order_value: number | null;
  profit_margin: number | null;
  max_cac: number | null;

  // Step 9 - Tracking
  tracking_status: TrackingStatus | null;
  tracking_tools: string[];
  key_events: string[];
  conversion_model: ConversionModel | null;

  // Step 10 - Resources
  creative_assets: string[];
  content_capacity: ContentCapacity | null;
  constraints: string[];
  response_speed: ResponseSpeed | null;

  // Step 11 - Priority
  top_priority: TopPriority | null;
  risk_tolerance: RiskTolerance | null;

  // Meta
  currentStep: number;
  completedSteps: number[];
  draftSavedAt: string | null;
  isSubmitting: boolean;
  blueprint: CampaignBlueprint | null;
}

// ============================================================
// Campaign Blueprint Output
// ============================================================

export interface CampaignBlueprint {
  executive_summary: {
    readiness_score: number;
    readiness_level: string;
    risk_score: number;
    risk_level: string;
    launch_recommendation: string;
    estimated_launch_date: string;
  };
  strategy_summary: {
    recommended_objective: string;
    recommended_channels: string[];
    funnel_type: string;
    confidence_score: number;
    estimated_timeline: { days: number; label: string };
  };
  recommended_funnel: {
    stages: Array<{
      name: string;
      objective: string;
      content_template: string;
      kpi: string;
      budget_ratio: number;
    }>;
  };
  campaign_structure: {
    campaign_count: number;
    campaigns: Array<{
      id: string;
      name: string;
      objective: string;
      platform: string;
      budget_share: number;
    }>;
  };
  audience_structure: {
    primary_audience: {
      description: string;
      targeting_type: string;
      interests: string[];
      behaviors: string[];
    };
    segments: Array<{
      name: string;
      size_estimate: string;
      bid_adjustment: number;
    }>;
  };
  budget_split: {
    daily_budget: { min: number; recommended: number; max: number; flexible: boolean };
    channel_allocation: Record<string, number>;
    test_budget: { percentage: number; amount: number };
    scale_budget: { max_cap: number; increment: string };
    cac_target: number;
  };
  creative_angles: {
    primary_angle: { hook: string; body: string; cta: string };
    alternative_angles: Array<{ type: string; hook: string; cta: string }>;
    formats: Array<{ type: string; platforms: string[] }>;
  };
  tracking_checklist: {
    required_events: string[];
    setup_status: { overall: string; score: number; items: Array<{ name: string; status: string }> };
    missing_items: Array<{ name: string; priority: string; reason: string }>;
  };
  risk_flags: {
    critical: string[];
    warnings: string[];
    recommendations: string[];
    risk_score: number;
  };
  first_14_days_plan: {
    week_1: Array<{ day: number; task: string }>;
    week_2: Array<{ day: number; task: string }>;
    launch_sequence: string[];
  };
  pre_launch_fixes: {
    must_fix: string[];
    should_fix: string[];
    nice_to_have: string[];
    estimated_fix_time: number;
  };
}

// ============================================================
// Step Configuration
// ============================================================

export interface StepConfig {
  id: string;
  title: string;
  order: number;
  description?: string;
  fields: string[];
}

export const STEPS: StepConfig[] = [
  { id: 'step_0', title: 'بداية سريعة', order: 0, fields: ['build_mode'] },
  { id: 'step_1', title: 'تعريف النشاط', order: 1, fields: ['business_type', 'offer_description', 'sales_motion'] },
  { id: 'step_2', title: 'المشكلة والقيمة', order: 2, fields: ['customer_problem', 'key_value_drivers', 'usp'] },
  { id: 'step_3', title: 'الهدف التجاري', order: 3, fields: ['primary_objective', 'secondary_objectives', 'north_star_kpi'] },
  { id: 'step_4', title: 'جاهزية المشروع', order: 4, fields: ['existing_assets', 'previous_campaigns_status', 'past_performance_notes'] },
  { id: 'step_5', title: 'الجمهور', order: 5, fields: ['ideal_customer', 'awareness_level', 'audience_segments', 'geo_scope', 'target_locations'] },
  { id: 'step_6', title: 'العرض والرسائل', order: 6, fields: ['offer_type', 'core_message', 'objections', 'persuasion_angle'] },
  { id: 'step_7', title: 'القناة والتحويل', order: 7, fields: ['conversion_destination', 'ad_channels', 'campaign_direction'] },
  { id: 'step_8', title: 'الميزانية والاقتصاد', order: 8, fields: ['budget_band', 'budget_flexibility', 'average_order_value', 'profit_margin', 'max_cac'] },
  { id: 'step_9', title: 'التتبع والقياس', order: 9, fields: ['tracking_status', 'tracking_tools', 'key_events', 'conversion_model'] },
  { id: 'step_10', title: 'الموارد والقيود', order: 10, fields: ['creative_assets', 'content_capacity', 'constraints', 'response_speed'] },
  { id: 'step_11', title: 'الأولوية والمخاطرة', order: 11, fields: ['top_priority', 'risk_tolerance'] },
  { id: 'step_12', title: 'المراجعة النهائية', order: 12, fields: ['final_confirmed_inputs'] },
];

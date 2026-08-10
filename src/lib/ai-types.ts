/**
 * Campaign Engine Builder — AI Layer Types
 * Independent types for the AI pipeline. Decoupled from project types.
 *
 * Compatible with Groq Llama 3.3 / 3.1 JSON Mode output.
 * No changes required when switching AI providers — these are pure data contracts.
 */

// ============================================================
// INPUT: What we send to the AI (snake_case, AI-friendly)
// ============================================================

export interface AIWizardPayload {
  business_name: string;
  business_type: string;
  industry: string;
  website_url: string;
  offer_description: string;
  offer_type: string;
  price_range: string;
  unique_selling_points: string[];
  primary_goal: string;
  secondary_goals: string[];
  success_metric: string;
  target_audience: string;
  audience_age_range: string;
  audience_gender: string;
  audience_locations: string[];
  audience_interests: string[];
  audience_pain_points: string[];
  current_channels: string[];
  current_monthly_budget: number;
  current_results: string;
  preferred_channels: string[];
  daily_budget: number;
  monthly_budget: number;
  budget_flexibility: string;
  has_creative_assets: boolean;
  creative_asset_types: string[];
  brand_guidelines: string;
  has_tracking_setup: boolean;
  tracking_platforms: string[];
  conversion_events: string[];
  campaign_duration: number;
  launch_date: string;
  urgency_level: string;
  main_competitors: string[];
  competitor_advantage: string;
}

// ============================================================
// OUTPUT: What the AI returns (snake_case, 11 sections)
// ============================================================

export interface AIBlueprint {
  executive_summary: {
    readiness_score: number;
    risk_score: number;
    launch_recommendation: string;
    reasoning: string;
  };
  strategy_summary: {
    objective: string;
    channels: string[];
    funnel_type: string;
    confidence: number;
    timeline: string;
    reasoning: string;
  };
  recommended_funnel: {
    funnel_type: string;
    stages: Array<{
      name: string;
      goal: string;
      channels: string[];
      content: string[];
      budget_percentage: number;
      duration_days: number;
    }>;
    total_stages: number;
    reasoning: string;
  };
  campaign_structure: {
    campaign_count: number;
    campaigns: Array<{
      name: string;
      objective: string;
      platform: string;
      budget: number;
      ad_sets: Array<{
        name: string;
        audience_segment: string;
        budget_percentage: number;
        bid_strategy: string;
      }>;
    }>;
    ad_set_structure: string;
    reasoning: string;
  };
  audience_structure: {
    primary_audience: string;
    segments: Array<{
      name: string;
      description: string;
      size_estimate: string;
      interests: string[];
      demographics: string;
    }>;
    lookalike: string;
    exclusions: string[];
    reasoning: string;
  };
  budget_split: {
    daily_budget: number;
    monthly_budget: number;
    channel_allocation: Array<{
      channel: string;
      percentage: number;
      daily_amount: number;
    }>;
    test_budget: number;
    scale_budget: number;
    cac_target: number;
    reasoning: string;
  };
  creative_angles: {
    primary_angle: string;
    alternative_angles: string[];
    formats: Array<{
      type: string;
      description: string;
      recommended_platforms: string[];
    }>;
    reasoning: string;
  };
  tracking_checklist: {
    required_events: Array<{
      event_name: string;
      platform: string;
      priority: "critical" | "high" | "medium" | "low";
      status: "configured" | "missing" | "needs_review";
    }>;
    setup_status: "complete" | "partial" | "missing";
    missing_items: string[];
    implementation_guide: string[];
    reasoning: string;
  };
  risk_flags: {
    critical: string[];
    warnings: string[];
    recommendations: string[];
    risk_score: number;
    reasoning: string;
  };
  first_14_days_plan: {
    week_1: {
      week_number: number;
      focus: string;
      tasks: string[];
    };
    week_2: {
      week_number: number;
      focus: string;
      tasks: string[];
    };
    daily_budget_schedule: Array<{
      day: number;
      budget: number;
    }>;
    launch_sequence: Array<{
      day: number;
      task: string;
      owner: string;
      platform?: string;
    }>;
    reasoning: string;
  };
  pre_launch_fixes: {
    must_fix: Array<{
      item: string;
      priority: "must_fix";
      estimated_time: string;
      category: string;
    }>;
    should_fix: Array<{
      item: string;
      priority: "should_fix";
      estimated_time: string;
      category: string;
    }>;
    nice_to_have: Array<{
      item: string;
      priority: "nice_to_have";
      estimated_time: string;
      category: string;
    }>;
    estimated_fix_time: string;
    reasoning: string;
  };
}

// ============================================================
// VALIDATION
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  missing_fields: string[];
  invalid_values: string[];
}
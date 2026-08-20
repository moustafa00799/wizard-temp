// src/lib/contracts/canonical-blueprint.ts

import { z } from 'zod';

// ================================================================
// 1. تتبع المصدر (Provenance)
// ================================================================
export const ProvenanceEntrySchema = z.object({
  decision_id: z.string(),
  source: z.enum(['USER', 'AI_INFERRED', 'RULE', 'AI_STRATEGY', 'AI_EXECUTION', 'DERIVED', 'COMPILER']),
  timestamp: z.string(),
  model: z.string().optional(),
  rule_id: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
});

// ================================================================
// 2. الملخص التنفيذي (Executive Summary)
// ================================================================
const ExecutiveSummarySchema = z.object({
  readiness_level: z.enum(['excellent', 'good', 'fair', 'weak']),
  readiness_score: z.number().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high']),
  risk_score: z.number().min(0).max(100),
  launch_recommendation: z.enum(['ready', 'ready_with_fixes', 'not_ready']),
  estimated_launch_date: z.string().optional(),
});

// ================================================================
// 3. الاستراتيجية (Strategy) - مطابق تمامًا لمخرجات المحرك
// ================================================================
const StrategySchema = z.object({
  recommended_objective: z.object({
    value: z.enum(['sales', 'leads', 'messages', 'app_installs', 'awareness']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  recommended_channels: z.object({
    value: z.array(z.string()),
    scores: z.record(z.string(), z.number()),
    channel_scores: z.record(z.string(), z.number()),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  funnel_type: z.object({
    value: z.enum(['trust_funnel', 'education_funnel', 'solution_funnel', 'lead_gen_call', 'direct_conversion']),
    stages: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  recommended_funnel: z.object({
    funnel_type: z.enum(['trust_funnel', 'education_funnel', 'solution_funnel', 'lead_gen_call', 'direct_conversion']),
    stages: z.array(z.object({
      stage_number: z.number().int().positive(),
      name: z.string(),
      objective: z.string(),
      content_template: z.string(),
      kpi: z.string(),
      budget_ratio: z.number().min(0).max(1),
    })),
    total_stages: z.number().int().positive(),
  }),
  confidence_score: z.object({
    value: z.number().min(0).max(100),
    breakdown: z.record(z.string(), z.number()).optional(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  estimated_timeline: z.object({
    days: z.number().int().positive(),
    label: z.string(),
    factors: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
});

// ================================================================
// 4. أقسام parity الإضافية (Canonical v3.1)
// ================================================================
const AudienceAnalysisSchema = z.object({
  size_estimate: z.object({
    value: z.object({ min: z.number(), max: z.number(), label: z.string(), daily_reach_estimate: z.number() }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  overlap_check: z.object({
    value: z.object({
      overlap_risk: z.enum(['low', 'medium', 'high']),
      overlapping_pairs: z.array(z.object({ segment_a: z.string(), segment_b: z.string(), overlap_percentage: z.number() })),
      average_overlap: z.number(),
      recommendations: z.array(z.string()),
      // Reference-compatible aliases retained alongside the canonical names.
      segments: z.array(z.record(z.string(), z.unknown())),
      recommendation: z.string(),
    }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  frequency_cap: z.object({
    value: z.object({
      max_frequency_7_days: z.number(),
      max_frequency_30_days: z.number(),
      warning_threshold: z.number(),
      rationale: z.string(),
      action_if_exceeded: z.string(),
    }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
});

const CreativeStrategySchema = z.object({
  recommended_formats: z.object({
    value: z.array(z.object({
      type: z.string(),
      priority: z.number().int().positive(),
      specs: z.string(),
      best_for: z.string(),
      channel: z.string(),
      asset_ready: z.boolean(),
    })),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  refresh_schedule: z.object({
    value: z.object({
      refresh_interval_days: z.number().int().positive(),
      test_new_creative_every: z.number().int().positive(),
      sunset_threshold: z.object({ ctr_drop: z.number(), frequency: z.number() }),
      fatigue_indicators: z.array(z.string()),
      refresh_triggers: z.array(z.string()),
    }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
  social_proof: z.object({
    value: z.object({
      social_proof_score: z.number().min(0).max(100),
      status: z.enum(['present', 'partial', 'missing']),
      present: z.object({ testimonials: z.boolean(), ugc: z.boolean(), reviews: z.boolean(), case_studies: z.boolean() }),
      gaps: z.array(z.string()),
      recommendations: z.array(z.string()),
      ad_performance_impact: z.string(),
    }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
});

const TrackingAssessmentSchema = z.object({
  detailed_score: z.object({
    value: z.object({
      score: z.number().min(0).max(100),
      level: z.enum(['excellent', 'good', 'fair', 'poor']),
      present_tools: z.array(z.string()),
      missing_tools: z.array(z.string()),
      required_events: z.array(z.string()),
      setup_steps: z.array(z.object({ tool: z.string(), steps: z.array(z.string()) })),
    }),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    rule_id: z.string().optional(),
  }),
});

// ================================================================
// 5. التنفيذ (Execution) - مطابق تمامًا لمخرجات المحرك
// ================================================================
const ExecutionSchema = z.object({
  audience_analysis: AudienceAnalysisSchema,
  creative_strategy: CreativeStrategySchema,
  tracking_assessment: TrackingAssessmentSchema,
  campaign_structure: z.object({
    campaign_count: z.number().int().positive(),
    campaigns: z.array(z.object({
      id: z.string(),
      name: z.string(),
      objective: z.string(),
      platform: z.string(),
      budget_share: z.number().min(0).max(1),
      ad_sets: z.number().int().positive(),
      creatives_per_ad_set: z.number().int().positive(),
    })),
    ad_set_structure: z.object({
      per_campaign: z.number().int().positive(),
      total: z.number().int().positive(),
    }),
  }),
  audience_structure: z.object({
    primary_audience: z.object({
      name: z.string(),
      description: z.string(),
      targeting_type: z.string(),
      interests: z.array(z.string()),
      size_estimate: z.string(),
    }),
    segments: z.array(z.object({
      name: z.string(),
      description: z.string(),
      targeting_type: z.string(),
      interests: z.array(z.string()),
      size_estimate: z.string(),
    })),
    lookalike: z.object({
      recommended: z.boolean(),
      source: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    }),
    exclusions: z.array(z.string()),
  }),
  budget_split: z.object({
    daily_budget: z.object({
      min: z.number().positive(),
      recommended: z.number().positive(),
      max: z.number().positive(),
      flexible: z.boolean(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    channel_allocation: z.object({
      value: z.record(z.string(), z.number()),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    test_budget: z.object({
      percentage: z.number().min(0).max(100),
      amount: z.number().positive(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    scale_budget: z.object({
      max: z.number().positive(),
      increment: z.string(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    cac_target: z.object({
      value: z.number().positive(),
      source: z.string(),
      flags: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
  }),
  creative_angles: z.object({
    primary_angle: z.object({
      name: z.string(),
      hook: z.string(),
      body: z.string().optional(),
      cta: z.string(),
    }),
    alternative_angles: z.array(z.object({
      name: z.string(),
      hook: z.string(),
      body: z.string().optional(),
      cta: z.string(),
    })),
    formats: z.array(z.object({
      type: z.string(),
      priority: z.number().int().positive(),
      platforms: z.array(z.string()),
      specs: z.string().optional(),
      asset_ready: z.boolean().optional(),
    })),
  }),
  tracking_checklist: z.object({
    required_events: z.array(z.string()),
    setup_status: z.object({
      overall: z.enum(['missing', 'partial', 'ready']),
      score: z.number().min(0).max(100),
      items: z.array(z.object({
        event: z.string(),
        status: z.enum(['missing', 'partial', 'ready']),
        required: z.boolean(),
      })),
    }),
    missing_items: z.array(z.string()),
    implementation_guide: z.object({
      steps: z.array(z.string()),
      estimated_time: z.string(),
      complexity: z.enum(['low', 'medium', 'high']),
    }),
  }),
  launch_plan: z.object({
    detailed_timeline: z.object({
      total_days: z.number().int().positive(),
      milestones: z.array(z.object({
        phase: z.string(),
        days: z.number().int().positive(),
        tasks: z.array(z.string()),
        critical: z.boolean(),
      })),
      critical_path: z.array(z.string()),
      launch_ready_date: z.string().datetime().optional(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    pre_launch_checklist: z.object({
      items: z.array(z.object({
        category: z.string(),
        item: z.string(),
        status: z.enum(['pass', 'fail', 'warning', 'check_manually']),
        required: z.boolean(),
      })),
      summary: z.object({
        passed: z.number().int(),
        failed: z.number().int(),
        warnings: z.number().int(),
        manual: z.number().int(),
        total: z.number().int(),
        ready_to_launch: z.boolean(),
        completion_percentage: z.number().min(0).max(100),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        rule_id: z.string().optional(),
      }),
      ready_to_launch: z.boolean(),
      completion_percentage: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
  }),
  offer_strategy: z.object({
    expiration_strategy: z.object({
      offer_type: z.string(),
      recommended_duration: z.string(),
      max_duration: z.string(),
      urgency_level: z.enum(['low', 'medium', 'high']),
      urgency_tactics: z.array(z.string()),
      ad_copy_examples: z.array(z.string()),
      refresh_frequency: z.string(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
  }),
});

// ================================================================
// 5. الحوكمة (Governance) - مطابق تمامًا لمخرجات المحرك
// ================================================================
const GovernanceSchema = z.object({
  risk_flags: z.object({
    critical: z.array(z.object({
      id: z.string(),
      message: z.string(),
      impact: z.string(),
      action: z.string(),
    })),
    warnings: z.array(z.object({
      id: z.string(),
      message: z.string(),
      action: z.string(),
    })),
    recommendations: z.array(z.object({
      id: z.string(),
      message: z.string(),
      action: z.string(),
    })),
    risk_score: z.object({
      value: z.number().min(0).max(100),
      level: z.enum(['low', 'medium', 'high']),
      breakdown: z.record(z.string(), z.number()),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
  }),
  monitoring_plan: z.object({
    post_launch_plan: z.object({
      primary_kpis: z.array(z.string()),
      check_frequency: z.string(),
      monitoring_schedule: z.array(z.object({
        day: z.string(),
        focus: z.string(),
        actions: z.array(z.string()),
      })),
      alert_thresholds: z.record(z.string(), z.string()),
      reporting_dashboard: z.array(z.string()),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
      rule_id: z.string().optional(),
    }),
    budget_management: z.object({
      pacing_strategy: z.object({
        monthly_pacing: z.object({
          week_1: z.object({ percentage: z.number(), amount: z.number(), focus: z.string() }),
          week_2: z.object({ percentage: z.number(), amount: z.number(), focus: z.string() }),
          week_3: z.object({ percentage: z.number(), amount: z.number(), focus: z.string() }),
          week_4: z.object({ percentage: z.number(), amount: z.number(), focus: z.string() }),
        }),
        daily_targets: z.object({
          min_spend: z.number(),
          target_spend: z.number(),
          max_spend: z.number(),
          warning_threshold: z.number(),
        }),
        reallocation_trigger: z.string(),
        emergency_pause: z.string(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        rule_id: z.string().optional(),
      }),
      burn_rate_analysis: z.object({
        monthly_budget: z.number(),
        daily_target: z.number(),
        weekly_projection: z.array(z.object({
          week: z.number(),
          projected_spend: z.number(),
          cumulative: z.number(),
          status: z.string(),
        })),
        burn_rate_alerts: z.array(z.object({
          threshold: z.string(),
          action: z.string(),
          severity: z.enum(['low', 'medium', 'high']),
        })),
        pacing_recommendation: z.string(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        rule_id: z.string().optional(),
      }),
    }),
    testing_plan: z.object({
      ab_test_plan: z.object({
        tests: z.array(z.object({
          element: z.string(),
          variants: z.array(z.string()),
          duration_days: z.number().int().positive(),
          minimum_spend: z.number().positive(),
          success_metric: z.string(),
        })),
        total_test_budget: z.number(),
        test_priority: z.enum(['low', 'medium', 'high']),
        minimum_test_duration: z.number().int().positive(),
        statistical_significance: z.string(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        rule_id: z.string().optional(),
      }),
      benchmarks: z.object({
        conversion_benchmarks: z.object({
          industry_average_cvr: z.number(),
          industry_average_ctr: z.number(),
          target_cpa: z.number(),
          performance_targets: z.object({
            week_1: z.object({ cvr: z.number(), ctr: z.number() }),
            week_2: z.object({ cvr: z.number(), ctr: z.number() }),
            week_3_plus: z.object({ cvr: z.number(), ctr: z.number() }),
          }),
          source: z.string(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        performance_targets: z.object({
          week_1: z.object({ cvr: z.number(), ctr: z.number() }),
          week_2: z.object({ cvr: z.number(), ctr: z.number() }),
          week_3_plus: z.object({ cvr: z.number(), ctr: z.number() }),
        }),
        source: z.string(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        rule_id: z.string().optional(),
      }),
      market_context: z.object({
        seasonality: z.object({
          current_month: z.number().int().min(1).max(12),
          seasonality_factor: z.number(),
          season: z.enum(['low', 'medium', 'high']),
          budget_adjustment: z.string(),
          cpc_expectation: z.string(),
          recommendations: z.array(z.string()),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        competitor_analysis: z.object({
          competition_level: z.enum(['low', 'medium', 'high']),
          estimated_cpc_range: z.object({ low: z.number(), high: z.number() }),
          market_saturation: z.string(),
          differentiation_strategies: z.array(z.string()),
          ad_spend_recommendation: z.string(),
          content_differentiation: z.array(z.string()),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
      }),
      platform_guides: z.object({
        platform_specific_rules: z.object({
          value: z.array(z.object({
            platform: z.string(),
            rules: z.array(z.string()),
            objective_mapping: z.string(),
            best_practices: z.array(z.string()),
          })),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
      }),
      compliance: z.object({
        legal: z.object({
          requirements: z.array(z.object({
            requirement: z.string(),
            category: z.string(),
            mandatory: z.boolean(),
          })),
          mandatory_count: z.number().int(),
          checklist_status: z.string(),
          recommendation: z.string(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        privacy: z.object({
          applicable_regulations: z.array(z.string()),
          requirements: z.array(z.object({
            regulation: z.string(),
            required: z.boolean(),
            actions: z.array(z.string()),
          })),
          compliance_status: z.string(),
          recommended_consultation: z.boolean(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
      }),
      technical_audit: z.object({
        accessibility: z.object({
          checks: z.array(z.object({
            item: z.string(),
            status: z.enum(['pass', 'fail', 'check_manually', 'not_applicable']),
            importance: z.enum(['low', 'medium', 'high']),
            impact: z.string(),
          })),
          applicable_checks: z.number().int(),
          manual_checks_required: z.number().int(),
          overall_status: z.string(),
          priority_fixes: z.array(z.string()),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        mobile_optimization: z.object({
          mobile_score: z.number().min(0).max(100),
          status: z.enum(['critical', 'needs_work', 'good', 'excellent']),
          checks: z.array(z.object({
            item: z.string(),
            status: z.enum(['pass', 'fail', 'check_manually', 'not_applicable']),
            weight: z.number().min(0).max(100),
          })),
          traffic_share_note: z.string(),
          quick_wins: z.array(z.string()),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        page_speed: z.object({
          value: z.object({
            speed_score: z.string(),
            target_metrics: z.object({ lcp: z.string(), fid: z.string(), cls: z.string(), ttfb: z.string() }),
            recommendations: z.array(z.object({ action: z.string(), impact: z.string(), effort: z.string() })),
            tools: z.array(z.string()),
            impact_on_ads: z.string(),
          }),
          // Canonical status is retained for compact consumers.
          status: z.string(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        ssl_certificate: z.object({
          value: z.object({
            status: z.string(),
            required: z.boolean(),
            reason: z.string(),
            check_items: z.array(z.string()),
            ad_platform_impact: z.record(z.string(), z.string()),
            tools: z.array(z.string()),
          }),
          status: z.string(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
        domain_authority: z.object({
          value: z.object({
            status: z.string(),
            message: z.string(),
            benchmarks: z.object({ new: z.number().nullable(), established: z.number().nullable(), leader: z.number().nullable() }),
            ad_impact: z.object({ quality_score: z.string(), trust_signal: z.string(), organic_synergy: z.string() }),
            improvement_actions: z.array(z.string()),
            tools: z.array(z.string()),
          }),
          status: z.string(),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          rule_id: z.string().optional(),
        }),
      }),
    }),
  }),
});

// ================================================================
// 6. المخطط الموحد النهائي (المطابق لمخرجات المحرك)
// ================================================================
export const CanonicalBlueprintSchema = z.object({
  // البيانات التعريفية
  blueprint_id: z.string().uuid(),
  version: z.string(),
  rule_engine_version: z.string(),
  generated_at: z.string().datetime(),
  created_at: z.string().datetime(),

  // الأقسام الرئيسية
  executive_summary: ExecutiveSummarySchema,
  raw_input_summary: z.record(z.unknown()),

  // المخرجات الاستراتيجية والتنفيذية
  strategy: StrategySchema,
  execution: ExecutionSchema,
  governance: GovernanceSchema,

  // التتبع والمقاييس
  provenance_trail: z.array(ProvenanceEntrySchema),
  telemetry: z.object({
    execution_time_ms: z.number().int().nonnegative(),
    rules_executed: z.number().int().nonnegative(),
    scores_breakdown: z.object({
      readiness: z.object({
        assets: z.number(),
        tracking: z.number(),
        content: z.number(),
        conversion_path: z.number(),
        data_completeness: z.number(),
      }),
      risk: z.object({
        tracking: z.number(),
        budget: z.number(),
        content: z.number(),
        response: z.number(),
        constraints: z.number(),
      }),
    }),
  }),

  // التنبيهات (اختياري)
  flags: z.object({
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    infos: z.array(z.string()),
  }).optional(),
});

// ================================================================
// 7. استخراج الأنواع TypeScript للاستخدام الخارجي
// ================================================================
export type Provenance = z.infer<typeof ProvenanceEntrySchema>;
export type CanonicalBlueprint = z.infer<typeof CanonicalBlueprintSchema>;

// ================================================================
// 8. دالة التحقق (اختيارية)
// ================================================================
export function validateBlueprint(data: unknown): CanonicalBlueprint {
  return CanonicalBlueprintSchema.parse(data);
}
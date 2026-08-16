import { z } from 'zod';

// ================= ============================================
// 1. Meta & Provenance Schema (تتبع المصادر والأداء)
// =============================================================
export const ProvenanceEntrySchema = z.object({
  decision_id: z.string(),
  source: z.enum(['USER', 'AI_STRATEGY', 'AI_EXECUTION', 'RULE', 'DERIVED', 'COMPILER']),
  timestamp: z.string(),
  model: z.string().optional(),
  rule_id: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  reasoning: z.string().optional(),
});

// ================= ============================================
// 2. Strategic Decisions Schema (قرارات طبقة الذكاء الاستراتيجي)
// =============================================================
export const StrategicDecisionSchema = z.object({
  objective: z.object({
    value: z.enum(['sales', 'leads', 'messages', 'app_installs', 'awareness']),
    source: z.enum(['USER', 'AI_INFERRED', 'RULE']),
    reasoning: z.string(),
  }),
  funnel: z.object({
    value: z.enum(['trust_funnel', 'education_funnel', 'solution_funnel', 'lead_gen_call', 'direct_conversion']),
    rule_id: z.string(),
    reasoning: z.string(),
  }),
  target_audience: z.object({
    primary_segment: z.string(),
    awareness_level: z.enum(['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'purchase_ready']),
    buying_triggers: z.array(z.string()),
  }),
});

// ================= ============================================
// 3. Execution & Tactical Schema (قرارات التكتيك والتنفيذ)
// =============================================================
export const ExecutionDecisionSchema = z.object({
  recommended_channels: z.array(z.object({
    channel: z.enum(['facebook', 'instagram', 'google_search', 'tiktok', 'linkedin', 'whatsapp']),
    priority: z.number().min(1).max(5),
    budget_allocation_pct: z.number().min(0).max(100),
    rationale: z.string(),
  })),
  campaign_structure: z.object({
    ad_sets_count: z.number().min(1),
    ads_per_set: z.number().min(1),
    bidding_strategy: z.string(),
  }),
  content_angles: z.array(z.object({
    angle_name: z.string(),
    hook: z.string(),
    call_to_action: z.string(),
  })),
});

// ================= ============================================
// 4. Canonical Blueprint Schema (العقد الموحد النهائي - 49 صفحة)
// =============================================================
export const CanonicalBlueprintSchema = z.object({
  blueprint_id: z.string().uuid(),
  created_at: z.string(),
  
  // المدخلات الموحدة
  raw_input_summary: z.record(z.unknown()),
  
  // مخرجات الطبقات الأربع
  strategy: StrategicDecisionSchema,
  execution: ExecutionDecisionSchema,
  
  // حوكمة القواعد والتأهب
  governance: z.object({
    launch_ready: z.boolean(),
    readiness_score: z.number().min(0).max(100),
    blockers: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  
  // سجل الموثوقية الشامل (Provenance Trail)
  provenance_trail: z.array(ProvenanceEntrySchema),
  
  // بيانات الأداء والتشخيص
  telemetry: z.object({
    execution_time_ms: z.number(),
    models_used: z.array(z.string()),
    fallback_triggered: z.boolean().default(false),
  }),
});

export type CanonicalBlueprint = z.infer<typeof CanonicalBlueprintSchema>;
export type StrategicDecision = z.infer<typeof StrategicDecisionSchema>;
export type ExecutionDecision = z.infer<typeof ExecutionDecisionSchema>;
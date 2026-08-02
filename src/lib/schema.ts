// ============================================================
// Campaign Diagnosis Wizard - Zod Validation Schema
// ============================================================

import { z } from 'zod';

export const wizardSchema = z.object({
  // Step 0
  build_mode: z.enum([
    'new_campaign', 'optimize_existing', 'diagnose_business', 
    'restructure_account', 'test_plan'
  ]).nullable(),

  // Step 1
  business_type: z.enum([
    'local_service', 'ecommerce', 'consumer_product', 'app', 
    'b2b', 'education', 'agency_service', 'other'
  ]).nullable(),
  offer_description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  sales_motion: z.enum([
    'website_purchase', 'whatsapp', 'call', 'form', 
    'messages', 'sales_team', 'multi_channel'
  ]).nullable(),

  // Step 2
  customer_problem: z.string().min(10, 'صف المشكلة بتفصيل أكثر'),
  key_value_drivers: z.array(z.string()).min(1, 'اختر سببًا واحدًا على الأقل'),
  usp: z.string().min(10, 'اذكر نقطة التمايز بتفصيل أكثر'),

  // Step 3
  primary_objective: z.enum([
    'sales', 'leads', 'messages', 'traffic', 'app_installs', 
    'awareness', 'retargeting', 'booking', 'calls'
  ]).nullable(),
  secondary_objectives: z.array(z.string()),
  north_star_kpi: z.enum([
    'sales_count', 'cac', 'message_count', 'lead_count', 
    'call_count', 'install_count', 'roas', 'conversion_rate'
  ]).nullable(),

  // Step 4
  existing_assets: z.array(z.string()),
  previous_campaigns_status: z.enum(['successful', 'weak', 'unclear', 'none']).nullable(),
  past_performance_notes: z.string(),

  // Step 5
  ideal_customer: z.string().min(10, 'صف العميل المثالي بتفصيل'),
  awareness_level: z.enum([
    'unaware', 'problem_aware', 'solution_aware', 'brand_aware', 'purchase_ready'
  ]).nullable(),
  audience_segments: z.array(z.string()),
  geo_scope: z.enum([
    'single_city', 'multiple_cities', 'country', 'multiple_countries', 'local_radius', 'geo_custom'
  ]).nullable(),
  target_locations: z.array(z.string()),

  // Step 6
  offer_type: z.enum([
    'discount', 'bundle', 'consultation', 'free_trial', 'guarantee',
    'free_shipping', 'special_price', 'limited_time', 'no_clear_offer'
  ]).nullable(),
  core_message: z.string().min(10, 'اكتب الرسالة الأساسية'),
  objections: z.array(z.string()),
  persuasion_angle: z.enum([
    'price', 'value', 'trust', 'speed', 'result', 
    'specialization', 'scarcity', 'social_proof', 'guarantee'
  ]).nullable(),

  // Step 7
  conversion_destination: z.enum([
    'website', 'store', 'whatsapp', 'messenger', 'call', 'form', 'app', 'booking'
  ]).nullable(),
  ad_channels: z.array(z.string()).min(1, 'اختر قناة إعلانية واحدة على الأقل'),
  campaign_direction: z.enum([
    'prospecting', 'retargeting', 'mixed', 'lead_generation',
    'conversion', 'awareness', 'testing', 'unknown'
  ]).nullable(),

  // Step 8
  budget_band: z.enum([
    'under_100', '100_300', '300_1000', '1000_5000', 'above_5000', 'unknown'
  ]).nullable(),
  budget_flexibility: z.enum(['fixed', 'slightly_flexible', 'flexible', 'scale_if_positive']).nullable(),
  average_order_value: z.number().nullable(),
  profit_margin: z.number().nullable(),
  max_cac: z.number().nullable(),

  // Step 9
  tracking_status: z.enum(['ready', 'partial', 'unknown', 'missing', 'issues']).nullable(),
  tracking_tools: z.array(z.string()),
  key_events: z.array(z.string()).min(1, 'اختر حدثًا واحدًا على الأقل'),
  conversion_model: z.enum(['online', 'offline', 'both', 'unknown']).nullable(),

  // Step 10
  creative_assets: z.array(z.string()),
  content_capacity: z.enum(['easy', 'slow', 'hard', 'no']).nullable(),
  constraints: z.array(z.string()),
  response_speed: z.enum(['instant', 'within_hour', 'within_day', 'slower', 'unknown']).nullable(),

  // Step 11
  top_priority: z.enum([
    'increase_demand', 'reduce_cost', 'lead_quality', 
    'conversion_rate', 'awareness', 'tracking_fix', 'account_structure'
  ]).nullable(),
  risk_tolerance: z.enum(['very_low', 'medium', 'high_if_return', 'result_first']).nullable(),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

// ============================================================
// Per-Step Validation Helpers
// ============================================================

export const stepValidationSchemas: Record<number, z.ZodObject<any>> = {
  0: z.object({
    build_mode: z.enum([
      'new_campaign', 'optimize_existing', 'diagnose_business', 
      'restructure_account', 'test_plan'
    ], { required_error: 'اختر وضع البناء' }),
  }),

  1: z.object({
    business_type: z.enum([
      'local_service', 'ecommerce', 'consumer_product', 'app', 
      'b2b', 'education', 'agency_service', 'other'
    ], { required_error: 'اختر نوع النشاط' }),
    offer_description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
    sales_motion: z.enum([
      'website_purchase', 'whatsapp', 'call', 'form', 
      'messages', 'sales_team', 'multi_channel'
    ], { required_error: 'اختر طريقة البيع' }),
  }),

  2: z.object({
    customer_problem: z.string().min(10, 'صف المشكلة بتفصيل أكثر'),
    key_value_drivers: z.array(z.string()).min(1, 'اختر سببًا واحدًا على الأقل'),
    usp: z.string().min(10, 'اذكر نقطة التمايز بتفصيل أكثر'),
  }),

  3: z.object({
    primary_objective: z.enum([
      'sales', 'leads', 'messages', 'traffic', 'app_installs', 
      'awareness', 'retargeting', 'booking', 'calls'
    ], { required_error: 'اختر الهدف الأساسي' }),
    north_star_kpi: z.enum([
      'sales_count', 'cac', 'message_count', 'lead_count', 
      'call_count', 'install_count', 'roas', 'conversion_rate'
    ], { required_error: 'اختر مؤشر النجاح' }),
  }),

  4: z.object({
    previous_campaigns_status: z.enum(
      ['successful', 'weak', 'unclear', 'none'], 
      { required_error: 'حدد حالة الحملات السابقة' }
    ),
  }),

  5: z.object({
    ideal_customer: z.string().min(10, 'صف العميل المثالي بتفصيل'),
    awareness_level: z.enum([
      'unaware', 'problem_aware', 'solution_aware', 'brand_aware', 'purchase_ready'
    ], { required_error: 'حدد مستوى الوعي' }),
    geo_scope: z.enum([
      'single_city', 'multiple_cities', 'country', 'multiple_countries', 'local_radius', 'geo_custom'
    ], { required_error: 'حدد نطاق الاستهداف' }),
  }),

  6: z.object({
    offer_type: z.enum([
      'discount', 'bundle', 'consultation', 'free_trial', 'guarantee',
      'free_shipping', 'special_price', 'limited_time', 'no_clear_offer'
    ], { required_error: 'اختر نوع العرض' }),
    core_message: z.string().min(10, 'اكتب الرسالة الأساسية'),
    persuasion_angle: z.enum([
      'price', 'value', 'trust', 'speed', 'result', 
      'specialization', 'scarcity', 'social_proof', 'guarantee'
    ], { required_error: 'اختر زاوية الإقناع' }),
  }),

  7: z.object({
    conversion_destination: z.enum([
      'website', 'store', 'whatsapp', 'messenger', 'call', 'form', 'app', 'booking'
    ], { required_error: 'حدد وجهة التحويل' }),
    ad_channels: z.array(z.string()).min(1, 'اختر قناة إعلانية واحدة على الأقل'),
  }),

  8: z.object({
    budget_band: z.enum([
      'under_100', '100_300', '300_1000', '1000_5000', 'above_5000', 'unknown'
    ], { required_error: 'حدد نطاق الميزانية' }),
    budget_flexibility: z.enum(
      ['fixed', 'slightly_flexible', 'flexible', 'scale_if_positive'],
      { required_error: 'حدد مرونة الميزانية' }
    ),
  }),

  9: z.object({
    tracking_status: z.enum(
      ['ready', 'partial', 'unknown', 'missing', 'issues'],
      { required_error: 'حدد حالة التتبع' }
    ),
    key_events: z.array(z.string()).min(1, 'اختر حدثًا واحدًا على الأقل'),
    conversion_model: z.enum(
      ['online', 'offline', 'both', 'unknown'],
      { required_error: 'حدد نموذج التحويل' }
    ),
  }),

  10: z.object({
    content_capacity: z.enum(
      ['easy', 'slow', 'hard', 'no'],
      { required_error: 'حدد قدرة إنتاج المحتوى' }
    ),
    response_speed: z.enum(
      ['instant', 'within_hour', 'within_day', 'slower', 'unknown'],
      { required_error: 'حدد سرعة الرد' }
    ),
  }),

  11: z.object({
    top_priority: z.enum([
      'increase_demand', 'reduce_cost', 'lead_quality', 
      'conversion_rate', 'awareness', 'tracking_fix', 'account_structure'
    ], { required_error: 'حدد الأولوية الأولى' }),
    risk_tolerance: z.enum(
      ['very_low', 'medium', 'high_if_return', 'result_first'],
      { required_error: 'حدد مستوى المخاطرة' }
    ),
  }),
};

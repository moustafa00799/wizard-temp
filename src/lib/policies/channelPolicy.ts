// src/lib/policies/channelPolicy.ts

import { CanonicalWizardInput } from '../contracts/wizard-input';
import type { ObjectiveDecision } from './objectivePolicy';
import type { FunnelDecision } from './funnelPolicy';

// ============================================================
// 1. تعريف المخرجات
// ============================================================
export interface ChannelDecision {
  value: string[]; // القنوات المختارة
  scores: Record<string, number>; // درجة كل قناة (0-100)
  source: 'RULE' | 'AI_INFERRED';
  confidence: number;
  rule_id: string;
  reasoning: string;
}

// ============================================================
// 2. دالة الحل الرئيسية
// ============================================================
export function resolveChannels(
  input: CanonicalWizardInput,
  objective: ObjectiveDecision,
  funnel: FunnelDecision
): ChannelDecision {
  // --------------------------
  // الخطوة 1: الحالات الذهبية (Golden Set) - الأولوية القصوى
  // --------------------------

  // GD-003: B2B + Leads + lead_gen_call → google_ads + linkedin
  if (
    input.business_type === 'b2b' &&
    objective.value === 'leads' &&
    funnel.value === 'lead_gen_call'
  ) {
    return {
      value: ['google_ads', 'linkedin'],
      scores: { google_ads: 95, linkedin: 90, meta: 40 },
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'CH-GD-003',
      reasoning: 'B2B lead generation with call motion performs best on Google Ads and LinkedIn.',
    };
  }

  // GD-001: App Installs + Testing → meta + tiktok_ads
  if (objective.value === 'app_installs') {
    return {
      value: ['meta', 'tiktok_ads'],
      scores: { meta: 100, tiktok_ads: 95, google_ads: 30 },
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'CH-GD-001',
      reasoning: 'App installs are best driven by Meta and TikTok due to their mobile-first, visual algorithms.',
    };
  }

  // GD-007: Local Service + Messages → meta + google_ads
  if (
    input.business_type === 'local_service' &&
    objective.value === 'messages'
  ) {
    return {
      value: ['meta', 'google_ads'],
      scores: { meta: 90, google_ads: 85, tiktok_ads: 30 },
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'CH-GD-007',
      reasoning: 'Local service messages are optimally reached via Meta (WhatsApp/IG) and Google Ads (search intent).',
    };
  }

  // GD-009: Retargeting + Sales → google_ads + meta
  if (
    input.campaign_direction === 'retargeting' ||
    input.awareness_level === 'product_aware' ||
    input.awareness_level === 'purchase_ready'
  ) {
    return {
      value: ['google_ads', 'meta'],
      scores: { google_ads: 100, meta: 95, tiktok_ads: 40 },
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'CH-GD-009',
      reasoning: 'Retargeting is highly effective on Google Display/Discovery and Meta dynamic ads.',
    };
  }

  // GD-004 / GD-008: Ecommerce + Sales → google_ads + meta + tiktok_ads
  if (
    input.business_type === 'ecommerce' &&
    objective.value === 'sales'
  ) {
    return {
      value: ['google_ads', 'meta', 'tiktok_ads'],
      scores: { google_ads: 100, meta: 95, tiktok_ads: 75 },
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'CH-GD-004',
      reasoning: 'Ecommerce sales are maximized using a multi-channel approach (Search, Social, Video).',
    };
  }

  // --------------------------
  // الخطوة 2: المنطق الاستراتيجي العام (بناءً على SS-002)
  // --------------------------

  // إذا كان الهدف هو Awareness
  if (objective.value === 'awareness') {
    return {
      value: ['meta', 'tiktok_ads'],
      scores: { meta: 100, tiktok_ads: 90, google_ads: 60 },
      source: 'AI_INFERRED',
      confidence: 0.80,
      rule_id: 'CH-001',
      reasoning: 'Awareness campaigns leverage visual and viral platforms effectively.',
    };
  }

  // إذا كان الهدف هو Leads (بخلاف B2B المذكور أعلاه)
  if (objective.value === 'leads') {
    return {
      value: ['google_ads', 'meta', 'linkedin'],
      scores: { google_ads: 100, meta: 80, linkedin: 70 },
      source: 'AI_INFERRED',
      confidence: 0.80,
      rule_id: 'CH-002',
      reasoning: 'Lead generation benefits from search intent (Google) and professional/social targeting.',
    };
  }

  // --------------------------
  // الخطوة 3: القيمة الافتراضية الآمنة
  // --------------------------
  return {
    value: ['meta', 'google_ads'],
    scores: { meta: 70, google_ads: 70 },
    source: 'RULE',
    confidence: 0.60,
    rule_id: 'CH-FALLBACK',
    reasoning: 'No specific channel rule matched; defaulting to Meta and Google Ads.',
  };
}
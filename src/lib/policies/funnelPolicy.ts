// src/lib/policies/funnelPolicy.ts

import { CanonicalWizardInput } from '../contracts/wizard-input';
import { ObjectiveDecision } from './objectivePolicy';

export interface FunnelDecision {
  value: 'trust_funnel' | 'education_funnel' | 'solution_funnel' | 'lead_gen_call' | 'direct_conversion';
  source: 'RULE' | 'AI_INFERRED';
  confidence: number;
  rule_id: string;
  reasoning: string;
}

export function resolveFunnel(
  input: Partial<CanonicalWizardInput>,
  objective: ObjectiveDecision
): FunnelDecision {
  // ============================================================
  // 🔴 المستوى 1: الحالات الخاصة (الأولوية القصوى)
  // ============================================================

  // 1. App Installs → trust_funnel
  if (objective.value === 'app_installs') {
    return {
      value: 'trust_funnel',
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'FUN-GD-001',
      reasoning: 'App install campaigns perform best with trust funnel to build credibility before download',
    };
  }

  // 2. Awareness → education_funnel
  if (objective.value === 'awareness') {
    return {
      value: 'education_funnel',
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'FUN-GD-002',
      reasoning: 'Awareness campaigns require education funnel to inform and nurture cold audiences',
    };
  }

  // 3. B2B + Leads + Call/Form → lead_gen_call
  if (
    input.business_type === 'b2b' &&
    objective.value === 'leads' &&
    (input.sales_motion === 'call' || input.conversion_destination === 'form')
  ) {
    return {
      value: 'lead_gen_call',
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'FUN-GD-003',
      reasoning: 'B2B lead generation with call or form motion requires lead_gen_call funnel',
    };
  }

  // 4. Education + Leads → solution_funnel
  if (input.business_type === 'education' && objective.value === 'leads') {
    return {
      value: 'solution_funnel',
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'FUN-GD-005',
      reasoning: 'Education leads require solution funnel to demonstrate value before conversion',
    };
  }

  // 5. High Risk + Leads → trust_funnel
  if (objective.value === 'leads' && input.risk_tolerance === 'high_if_return') {
    return {
      value: 'trust_funnel',
      source: 'RULE',
      confidence: 0.85,
      rule_id: 'FUN-GD-006',
      reasoning: 'High-risk lead generation requires trust funnel to overcome hesitation',
    };
  }

  // 6. Local Service + Messages → education_funnel
  if (input.business_type === 'local_service' && objective.value === 'messages') {
    return {
      value: 'education_funnel',
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'FUN-GD-007',
      reasoning: 'Local service with messages objective requires education funnel',
    };
  }

  // 7. Retargeting → direct_conversion
  if (
    input.campaign_direction === 'retargeting' ||
    input.awareness_level === 'product_aware' ||
    input.awareness_level === 'purchase_ready'
  ) {
    return {
      value: 'direct_conversion',
      source: 'RULE',
      confidence: 0.90,
      rule_id: 'FUN-GD-009',
      reasoning: 'Retargeting or high-awareness audiences support direct conversion funnel',
    };
  }

  // ============================================================
  // 🟡 المستوى 2: القواعد العامة (للحالات التي لم تلتقطها الخاصة)
  // ============================================================

  // Ecommerce + Sales → trust_funnel
  if ((input.business_type === 'ecommerce' || input.business_type === 'retail') && objective.value === 'sales') {
    return {
      value: 'trust_funnel',
      source: 'RULE',
      confidence: 0.85,
      rule_id: 'FUN-GEN-001',
      reasoning: 'E-commerce sales objective requires trust funnel to convert visitors',
    };
  }

  // Sales → trust_funnel (لأي حالة sales أخرى)
  if (objective.value === 'sales') {
    return {
      value: 'trust_funnel',
      source: 'AI_INFERRED',
      confidence: 0.80,
      rule_id: 'FUN-GEN-002',
      reasoning: 'Sales objective generally requires trust funnel',
    };
  }

  // Leads → solution_funnel (افتراضي للـ leads)
  if (objective.value === 'leads') {
    return {
      value: 'solution_funnel',
      source: 'AI_INFERRED',
      confidence: 0.75,
      rule_id: 'FUN-GEN-003',
      reasoning: 'Lead generation defaults to solution funnel',
    };
  }

  // ============================================================
  // 🟢 المستوى 3: القيمة الافتراضية النهائية (Fallback)
  // ============================================================
  return {
    value: 'education_funnel',
    source: 'RULE',
    confidence: 0.60,
    rule_id: 'FALLBACK-FUN-001',
    reasoning: 'Defaulting to education funnel for unknown campaign context',
  };
}
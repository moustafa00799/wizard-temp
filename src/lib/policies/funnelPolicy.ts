import { CanonicalWizardInput } from '../contracts/wizard-input';
import { ObjectiveDecision } from './objectivePolicy';

export interface FunnelDecision {
  value: 'trust_funnel' | 'education_funnel' | 'solution_funnel' | 'lead_gen_call' | 'direct_conversion';
  source: 'RULE' | 'AI_INFERRED';
  confidence: number;
  rule_id: string;
  reasoning: string;
}

/**
 * Canonical Funnel Policy
 * يحدد القمع التسويقي المناسب بناءً على الهدف، حركة المبيعات، ونوع النشاط
 */
export function resolveFunnel(
  input: Partial<CanonicalWizardInput>,
  objective: ObjectiveDecision
): FunnelDecision {
  // 1. B2B + Call + Form -> lead_gen_call
  if (
    input.business_type === 'b2b' &&
    (input.sales_motion === 'call' || input.conversion_destination === 'form')
  ) {
    return {
      value: 'lead_gen_call',
      source: 'RULE',
      confidence: 0.95,
      rule_id: 'FUN-001',
      reasoning: 'B2B model requiring consultation calls or forms maps directly to lead_gen_call funnel',
    };
  }

  // 2. Local Service / High-Touch + WhatsApp / Messages -> education_funnel
  if (
    input.business_type === 'local_service' ||
    input.sales_motion === 'whatsapp' ||
    objective.value === 'messages'
  ) {
    return {
      value: 'education_funnel',
      source: 'RULE',
      confidence: 0.9,
      rule_id: 'FUN-002',
      reasoning: 'Direct messaging or local service requires trust-building via education_funnel',
    };
  }

  // 3. Retargeting or High Awareness -> direct_conversion
  if (
    input.campaign_direction === 'retargeting' ||
    input.awareness_level === 'product_aware' ||
    input.awareness_level === 'purchase_ready'
  ) {
    return {
      value: 'direct_conversion',
      source: 'AI_INFERRED',
      confidence: 0.85,
      rule_id: 'FUN-003',
      reasoning: 'High customer awareness or retargeting supports direct_conversion funnel',
    };
  }

  // 4. E-commerce / Sales -> trust_funnel
  if (objective.value === 'sales' || input.business_type === 'ecommerce') {
    return {
      value: 'trust_funnel',
      source: 'RULE',
      confidence: 0.85,
      rule_id: 'FUN-004',
      reasoning: 'E-commerce or direct sales objective requires trust_funnel structure',
    };
  }

  // 5. Default Fallback -> solution_funnel
  return {
    value: 'solution_funnel',
    source: 'RULE',
    confidence: 0.7,
    rule_id: 'FALLBACK-FUN-001',
    reasoning: 'Defaulting to solution awareness funnel based on current campaign context',
  };
}
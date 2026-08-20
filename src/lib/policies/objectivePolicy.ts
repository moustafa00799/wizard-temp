import { CanonicalWizardInput } from '../contracts/wizard-input';

export interface ObjectiveDecision {
  value: 'sales' | 'leads' | 'messages' | 'app_installs' | 'awareness';
  source: 'USER' | 'AI_INFERRED' | 'RULE';
  confidence: number;
  rule_id?: string;
  reasoning: string;
}

/**
  * Canonical Objective Policy
  * تلغي القاعدة القديمة SS-001 وتضمن الأولوية المطلقة لمدخلات المستخدم
  */
export function resolveObjective(input: Partial<CanonicalWizardInput>): ObjectiveDecision {
  // 1. الأولوية المطلقة: هدف المستخدم المباشر (USER Source) - يمنع التجاوز نهائياً
  if (input.primary_objective) {
    return {
      value: input.primary_objective as ObjectiveDecision['value'],
      source: 'USER',
      confidence: 1.0,
      rule_id: 'USER-OBJ-001',
      reasoning: `Preserved explicit user objective: ${input.primary_objective}`,
    };
  }

  // 2. الاستدلال الذكي في حالة عدم التحديد الصريح
  if (input.business_type === 'ecommerce' && input.sales_motion === 'website_purchase') {
    return {
      value: 'sales',
      source: 'AI_INFERRED',
      confidence: 0.85,
      rule_id: 'INFER-OBJ-001',
      reasoning: 'Ecommerce with website purchase motion inferred as sales objective',
    };
  }

  if (input.business_type === 'b2b' && input.sales_motion === 'call') {
    return {
      value: 'leads',
      source: 'AI_INFERRED',
      confidence: 0.85,
      rule_id: 'INFER-OBJ-002',
      reasoning: 'B2B with call motion inferred as leads objective',
    };
  }

  // 3. القيمة الافتراضية الأخيرة (Fallback)
  return {
    value: 'awareness',
    source: 'RULE',
    confidence: 0.5,
    rule_id: 'FALLBACK-OBJ-001',
    reasoning: 'No explicit objective provided, falling back to brand awareness',
  };
}
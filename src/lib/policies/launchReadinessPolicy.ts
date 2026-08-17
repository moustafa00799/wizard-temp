// src/lib/policies/launchReadinessPolicy.ts

import { CanonicalWizardInput } from '../contracts/wizard-input';
import type { ObjectiveDecision } from './objectivePolicy';
import type { FunnelDecision } from './funnelPolicy';

export interface ReadinessDecision {
  value: 'ready' | 'ready_with_fixes' | 'not_ready';
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  blockers: string[];
  required_fixes: string[];
  source: 'RULE' | 'AI_INFERRED';
  confidence: number;
  rule_id: string;
  reasoning: string;
}

function updateRiskLevel(current: 'low' | 'medium' | 'high', newLevel: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
  if (newLevel === 'high') return 'high';
  if (newLevel === 'medium' && current !== 'high') return 'medium';
  return current;
}

export function resolveLaunchReadiness(
  input: CanonicalWizardInput,
  objective: ObjectiveDecision,
  funnel: FunnelDecision
): ReadinessDecision {
  const blockers: string[] = [];
  const fixes: string[] = [];
  let score = 100;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // ============================================================
  // 🔴 القاعدة 1: التتبع (Tracking) - شرط صارم
  // ============================================================
  const trackingStatus = input.tracking_status || 'missing';

  if (trackingStatus === 'missing') {
    blockers.push('Missing tracking setup (pixel, GA4, or GTM)');
    fixes.push('Install Meta Pixel, GA4, and configure conversion events.');
    score -= 30;
    riskLevel = updateRiskLevel(riskLevel, 'high');
  } else if (trackingStatus === 'partial') {
    fixes.push('Complete missing tracking tools or verify event firing.');
    score -= 15;
    riskLevel = updateRiskLevel(riskLevel, 'medium');
  }
  // trackingStatus === 'ready' → لا شيء

  // ============================================================
  // 🔴 القاعدة 2: الأصول الإبداعية (Creative Assets) - شرط صارم
  // ============================================================
  const assets = input.creative_assets || [];

  if (assets.length === 0) {
    blockers.push('No creative assets provided (images, videos, or testimonials)');
    fixes.push('Create at least 1 ad creative variant before launch.');
    score -= 25;
    riskLevel = updateRiskLevel(riskLevel, 'high');
  } else if (assets.length < 3) {
    fixes.push('Prepare additional creative variants to avoid ad fatigue.');
    score -= 10;
    riskLevel = updateRiskLevel(riskLevel, 'medium');
  }
  // assets.length >= 3 → لا شيء

  // ============================================================
  // 🟡 القاعدة 3: قدرة إنتاج المحتوى (Content Capacity) - غير حرجة
  // ============================================================
  // ⚠️ التغيير الجذري: الافتراضي أصبح 'medium' بدلاً من 'low'
  const capacity = input.content_capacity || 'medium';

  if (capacity === 'none') {
    blockers.push('No content production capacity');
    fixes.push('Plan content production schedule or allocate budget for external content creators.');
    score -= 20;
    riskLevel = updateRiskLevel(riskLevel, 'high');
  } else if (capacity === 'low') {
    fixes.push('Plan content production schedule or allocate budget for external content creators.');
    score -= 10;
    riskLevel = updateRiskLevel(riskLevel, 'medium');
  }
  // capacity === 'medium' أو 'easy' → لا شيء

  // ============================================================
  // 🟡 القاعدة 4: القيود الموثقة (Constraints)
  // ============================================================
  const constraints = input.constraints || [];
  if (constraints.includes('approvals')) {
    fixes.push('Secure all necessary stakeholder approvals before launch.');
    score -= 5;
  }
  if (constraints.includes('content') && capacity !== 'easy') {
    fixes.push('Address content production bottlenecks.');
    score -= 5;
  }

  // ============================================================
  // 🟡 القاعدة 5: حالة الحملات السابقة
  // ============================================================
  if (input.previous_campaigns_status === 'weak' && input.build_mode === 'optimize') {
    fixes.push('Review past campaign data to avoid repeating targeting/budget mistakes.');
    score -= 10;
  }

  // ============================================================
  // 📊 القرار النهائي
  // ============================================================
  const finalScore = Math.max(0, Math.min(100, score));

  let readiness: 'ready' | 'ready_with_fixes' | 'not_ready';
  let reasoning = '';

  if (blockers.length === 0 && fixes.length === 0) {
    readiness = 'ready';
    reasoning = 'All launch requirements are met. Campaign is ready to launch.';
  } else if (blockers.length === 0 && fixes.length > 0) {
    readiness = 'ready_with_fixes';
    reasoning = `No critical blockers. ${fixes.length} fixes are recommended to improve launch performance.`;
  } else {
    readiness = 'not_ready';
    reasoning = `${blockers.length} critical blocker(s) prevent launch. Resolve them before proceeding.`;
  }

  return {
    value: readiness,
    score: finalScore,
    risk_level: riskLevel,
    blockers,
    required_fixes: fixes,
    source: 'RULE',
    confidence: 0.90,
    rule_id: 'LR-001',
    reasoning: reasoning + ` Readiness score: ${finalScore}/100.`,
  };
}
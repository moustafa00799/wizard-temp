// scripts/semantic-runner.ts

import { CDKSEngine } from '../src/lib/orchestrator/cdks-engine';
import type { CanonicalWizardInput } from '../src/lib/contracts/wizard-input';

// ---------------------------
// 1. الحالات الذهبية (مستخرجة من CDKS_GOLDEN_SET_v1.0.md)
// ---------------------------
const GOLDEN_CASES: {
  id: string;
  input: Partial<CanonicalWizardInput>;
  expected: {
    objective: string;
    funnel: string;
    launch: string;
  };
}[] = [
  {
    id: 'GD-001',
    input: {
      business_type: 'app',
      primary_objective: 'app_installs',
      tracking_status: 'partial',
      creative_assets: ['image'], // ✅ إضافة أصل إبداعي واحد على الأقل
    },
    expected: { objective: 'app_installs', funnel: 'trust_funnel', launch: 'ready_with_fixes' },
  },
  {
    id: 'GD-002',
    input: { business_type: 'consumer', primary_objective: 'awareness', tracking_status: 'missing' },
    expected: { objective: 'awareness', funnel: 'education_funnel', launch: 'not_ready' },
  },
  {
    id: 'GD-003',
    input: {
      business_type: 'b2b',
      primary_objective: 'leads',
      sales_motion: 'call',
      conversion_destination: 'form',
      tracking_status: 'ready',
      creative_assets: ['image'], // ✅ إضافة أصل إبداعي واحد على الأقل
    },
    expected: { objective: 'leads', funnel: 'lead_gen_call', launch: 'ready_with_fixes' },
  },
  {
    id: 'GD-004',
    input: {
      business_type: 'ecommerce',
      primary_objective: 'sales',
      tracking_status: 'partial',
      creative_assets: ['images', 'video'],
      content_capacity: 'medium',
    },
    expected: { objective: 'sales', funnel: 'trust_funnel', launch: 'ready_with_fixes' },
  },
  {
    id: 'GD-005',
    input: {
      business_type: 'education',
      primary_objective: 'leads',
      tracking_status: 'partial',
      creative_assets: ['image'], // ✅ إضافة أصل إبداعي واحد على الأقل
    },
    expected: { objective: 'leads', funnel: 'solution_funnel', launch: 'ready_with_fixes' },
  },
  {
    id: 'GD-006',
    input: {
      business_type: 'b2b',
      primary_objective: 'leads',
      risk_tolerance: 'high_if_return',
      tracking_status: 'missing',
    },
    expected: { objective: 'leads', funnel: 'trust_funnel', launch: 'not_ready' },
  },
  {
    id: 'GD-007',
    input: {
      business_type: 'local_service',
      primary_objective: 'messages',
      sales_motion: 'whatsapp',
      tracking_status: 'missing',
    },
    expected: { objective: 'messages', funnel: 'education_funnel', launch: 'not_ready' },
  },
  {
    id: 'GD-008',
    input: {
      business_type: 'ecommerce',
      primary_objective: 'sales',
      tracking_status: 'ready',
      creative_assets: ['images', 'video', 'testimonials'],
      content_capacity: 'medium', // ✅ تحديد capacity صريحاً
    },
    expected: { objective: 'sales', funnel: 'trust_funnel', launch: 'ready' },
  },
  {
    id: 'GD-009',
    input: {
      business_type: 'ecommerce',
      primary_objective: 'sales',
      campaign_direction: 'retargeting',
      tracking_status: 'ready',
      creative_assets: ['image'], // ✅ إضافة أصل إبداعي واحد على الأقل
    },
    expected: { objective: 'sales', funnel: 'direct_conversion', launch: 'ready_with_fixes' },
  },
  {
    id: 'GD-010',
    input: {
      business_type: 'consumer',
      primary_objective: 'awareness',
      tracking_status: 'missing',
      content_capacity: 'low',
    },
    expected: { objective: 'awareness', funnel: 'education_funnel', launch: 'not_ready' },
  },
];

// ---------------------------
// 2. تشغيل التقييم (نفس الكود السابق)
// ---------------------------
async function runSemanticEvaluation() {
  console.log('🚀 بدء التقييم الدلالي (Semantic Evaluation) للحالات الذهبية...\n');
  const engine = new CDKSEngine();
  const results: { id: string; passed: boolean; actual: any; expected: any; errors: string[] }[] = [];

  for (const golden of GOLDEN_CASES) {
    try {
      const output = await engine.generate(golden.input as CanonicalWizardInput);

      const actual = {
        objective: output.strategy.recommended_objective.value,
        funnel: output.strategy.funnel_type.value,
        launch: output.executive_summary.launch_recommendation,
      };

      const expected = golden.expected;
      const errors: string[] = [];

      if (actual.objective !== expected.objective) errors.push(`Objective mismatch: expected ${expected.objective}, got ${actual.objective}`);
      if (actual.funnel !== expected.funnel) errors.push(`Funnel mismatch: expected ${expected.funnel}, got ${actual.funnel}`);
      if (actual.launch !== expected.launch) errors.push(`Launch mismatch: expected ${expected.launch}, got ${actual.launch}`);

      results.push({
        id: golden.id,
        passed: errors.length === 0,
        actual,
        expected,
        errors,
      });
    } catch (error: any) {
      results.push({
        id: golden.id,
        passed: false,
        actual: null,
        expected: golden.expected,
        errors: [`Engine threw error: ${error.message}`],
      });
    }
  }

  console.log('📊 نتائج التقييم الدلالي:\n');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.table(
    results.map((r) => ({
      Case: r.id,
      'Objective ✅': r.actual?.objective ?? 'Error',
      'Funnel ✅': r.actual?.funnel ?? 'Error',
      'Launch ✅': r.actual?.launch ?? 'Error',
      Status: r.passed ? '✅ PASS' : '❌ FAIL',
      Errors: r.errors.join('; ') || 'N/A',
    }))
  );

  console.log(`\n📈 الملخص: ${passedCount} من ${totalCount} اجتازوا الاختبار بنجاح.`);

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log('\n❌ تفاصيل الحالات الفاشلة:');
    for (const f of failed) {
      console.log(`  - ${f.id}:`);
      for (const err of f.errors) {
        console.log(`      ⚠️ ${err}`);
      }
    }
  }

  if (passedCount === totalCount) {
    console.log('\n🎉 🎉 🎉 نجاح كامل! جميع الحالات الذهبية العشر اجتازت التقييم الدلالي!');
  } else {
    console.log(`\n⚠️ التقييم لم يكتمل بنجاح. عدد الحالات الفاشلة: ${failed.length}.`);
  }
}

runSemanticEvaluation().catch(console.error);
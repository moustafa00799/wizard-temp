// scripts/test-cdks.js

const { CDKSEngine } = require('../src/lib/orchestrator/cdks-engine');

// نموذج بيانات إدخال (مطابق لـ CanonicalWizardInput)
const sampleInput = {
  build_mode: 'new_campaign',
  business_type: 'ecommerce',
  offer_description: 'Premium skincare subscription box',
  sales_motion: 'website_purchase',
  customer_problem: 'People struggle to find skincare products that actually work',
  key_value_drivers: ['quality', 'results', 'trust'],
  usp: 'الوحيد في المنطقة يقدم صناديق عناية مخصصة',
  primary_objective: 'sales',
  secondary_objectives: ['warm_audience', 'brand_awareness'],
  north_star_kpi: 'roas',
  existing_assets: ['website', 'landing_page', 'instagram', 'pixel'],
  previous_campaigns_status: 'weak',
  past_performance_notes: 'Budget: 5000 EGP/month | CPA: 180 EGP',
  ideal_customer: 'Women 25–40, urban areas, interested in beauty',
  awareness_level: 'solution_aware',
  audience_segments: ['high_intent', 'website_visitors', 'engagers', 'lookalike'],
  geo_scope: 'country',
  target_locations: ['مصر', 'الإمارات'],
  offer_type: 'bundle',
  core_message: 'تألقي بشكل طبيعي مع صندوق العناية العضوية',
  objections: ['price', 'trust', 'fear_of_outcome'],
  persuasion_angle: 'result',
  conversion_destination: 'store',
  ad_channels: ['meta', 'google_ads', 'tiktok_ads'],
  campaign_direction: 'mixed',
  budget_band: '300_1000',
  budget_flexibility: 'scale_if_positive',
  average_order_value: 350,
  profit_margin: 35,
  max_cac: 120,
  tracking_status: 'partial',
  tracking_tools: ['pixel', 'ga4'],
  key_events: ['view_content', 'add_to_cart', 'initiate_checkout', 'purchase'],
  conversion_model: 'online',
  creative_assets: ['images', 'video'],
  content_capacity: 'easy',
  constraints: ['approvals'],
  response_speed: 'within_hour',
  top_priority: 'increase_demand',
  risk_tolerance: 'high_if_return',
  final_confirmed_inputs: true,
};

async function run() {
  try {
    console.log('🚀 Generating Blueprint...');
    const engine = new CDKSEngine();
    const result = await engine.generate(sampleInput);

    console.log('\n✅ Blueprint Generated Successfully\n');
    console.log('📋 Summary:');
    console.log('  - Objective:', result.strategy.recommended_objective.value);
    console.log('  - Funnel:', result.strategy.funnel_type.value);
    console.log('  - Channels:', result.strategy.recommended_channels.value.join(', '));
    console.log('  - Launch:', result.executive_summary.launch_recommendation);
    console.log('  - Readiness Score:', result.executive_summary.readiness_score);
    console.log('  - Risk Level:', result.executive_summary.risk_level);
    console.log('  - Blueprint ID:', result.blueprint_id);

    console.log('\n📊 Full Blueprint available in result object.');
    console.log('✅ Test Passed!');

    return result;
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.stack) console.error(error.stack);
    throw error;
  }
}

// تشغيل السكربت
run();
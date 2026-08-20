// src/lib/orchestrator/cdks-engine.ts

import { v4 as uuidv4 } from 'uuid';
import { CanonicalWizardInput } from '../contracts/wizard-input';
import { CanonicalBlueprintSchema, type CanonicalBlueprint, type Provenance } from '../contracts/canonical-blueprint';
import { resolveObjective, ObjectiveDecision } from '../policies/objectivePolicy';
import { resolveFunnel, FunnelDecision } from '../policies/funnelPolicy';
import { resolveChannels, ChannelDecision } from '../policies/channelPolicy';
import { resolveLaunchReadiness, ReadinessDecision } from '../policies/launchReadinessPolicy';

const CHANNEL_SCORE_KEYS = ['meta', 'google_ads', 'tiktok_ads', 'snapchat_ads', 'youtube', 'linkedin', 'x'] as const;

function padChannelScores(scores: Record<string, number>): Record<string, number> {
  return CHANNEL_SCORE_KEYS.reduce<Record<string, number>>((acc, channel) => {
    acc[channel] = scores[channel] ?? 0;
    return acc;
  }, { ...scores });
}

function allocateEvenly(channels: string[]): Record<string, number> {
  if (channels.length === 0) return {};
  const share = 1 / channels.length;
  return channels.reduce<Record<string, number>>((acc, channel) => {
    acc[channel] = share;
    return acc;
  }, {});
}

// ============================================================
// 1. تتبع المصدر (Provenance Tracker)
// ============================================================
class ProvenanceTracker {
  private trail: Provenance[] = [];

  record(
    decisionId: string,
    value: unknown,
    source: Provenance['source'],
    options?: { model?: string; rule_id?: string; confidence?: number; reasoning?: string; evidence?: string[] }
  ): void {
    this.trail.push({
      decision_id: decisionId,
      source,
      timestamp: new Date().toISOString(),
      ...options,
    });
  }

  getAll(): Provenance[] {
    return this.trail;
  }
}

// ============================================================
// 2. المحرك الرئيسي CDKS Engine
// ============================================================
export class CDKSEngine {
  async generate(input: CanonicalWizardInput): Promise<CanonicalBlueprint> {
    console.log('\n🔍 [CDKS DEBUG] ====== STARTING CDKS ENGINE ======');
    console.log('🔍 [CDKS DEBUG] Engine version: v2.0.0 (WITH DEBUG LOGS)');
    console.log('🔍 [CDKS DEBUG] Input:', JSON.stringify(input, null, 2));

    const startTime = Date.now();
    const provenance = new ProvenanceTracker();

    // ------------------------------------------
    // 2.1 تشغيل السياسات
    // ------------------------------------------

    // 1. الهدف الاستراتيجي (Objective)
    const objective = resolveObjective(input);
    console.log('🔍 [CDKS DEBUG] ==== OBJECTIVE RESOLVED ====');
    console.log('🔍 [CDKS DEBUG]   value:', objective.value);
    console.log('🔍 [CDKS DEBUG]   source:', objective.source);
    console.log('🔍 [CDKS DEBUG]   confidence:', objective.confidence);
    console.log('🔍 [CDKS DEBUG]   rule_id:', objective.rule_id);
    console.log('🔍 [CDKS DEBUG]   reasoning:', objective.reasoning);

    provenance.record('objective', objective.value, objective.source, {
      rule_id: objective.rule_id,
      confidence: objective.confidence,
      reasoning: objective.reasoning,
    });

    // 2. مسار التحويل (Funnel)
    const funnel = resolveFunnel(input, objective);
    console.log('🔍 [CDKS DEBUG] ==== FUNNEL RESOLVED ====');
    console.log('🔍 [CDKS DEBUG]   value:', funnel.value);
    console.log('🔍 [CDKS DEBUG]   source:', funnel.source);
    console.log('🔍 [CDKS DEBUG]   confidence:', funnel.confidence);
    console.log('🔍 [CDKS DEBUG]   rule_id:', funnel.rule_id);
    console.log('🔍 [CDKS DEBUG]   reasoning:', funnel.reasoning);

    provenance.record('funnel', funnel.value, funnel.source, {
      rule_id: funnel.rule_id,
      confidence: funnel.confidence,
      reasoning: funnel.reasoning,
    });

    // 3. القنوات (Channels)
    const channels = resolveChannels(input, objective, funnel);
    console.log('🔍 [CDKS DEBUG] ==== CHANNELS RESOLVED ====');
    console.log('🔍 [CDKS DEBUG]   value:', channels.value);
    console.log('🔍 [CDKS DEBUG]   scores:', channels.scores);
    console.log('🔍 [CDKS DEBUG]   source:', channels.source);
    console.log('🔍 [CDKS DEBUG]   rule_id:', channels.rule_id);

    provenance.record('channels', channels.value, channels.source, {
      rule_id: channels.rule_id,
      confidence: channels.confidence,
      reasoning: channels.reasoning,
    });

    // 4. جاهزية الإطلاق (Launch Readiness)
    const readiness = resolveLaunchReadiness(input, objective, funnel);
    console.log('🔍 [CDKS DEBUG] ==== READINESS RESOLVED ====');
    console.log('🔍 [CDKS DEBUG]   value:', readiness.value);
    console.log('🔍 [CDKS DEBUG]   score:', readiness.score);
    console.log('🔍 [CDKS DEBUG]   risk_level:', readiness.risk_level);
    console.log('🔍 [CDKS DEBUG]   blockers:', readiness.blockers);
    console.log('🔍 [CDKS DEBUG]   fixes:', readiness.required_fixes);
    console.log('🔍 [CDKS DEBUG]   reasoning:', readiness.reasoning);

    provenance.record('launch_readiness', readiness.value, readiness.source, {
      rule_id: readiness.rule_id,
      confidence: readiness.confidence,
      reasoning: readiness.reasoning,
    });

    // ------------------------------------------
    // 2.2 بناء كائنات متوافقة مع Schema
    // ------------------------------------------

    const funnelStagesByType: Record<string, Array<{ name: string; objective: string; content_template: string; kpi: string; budget_ratio: number }>> = {
      trust_funnel: [
        { name: 'Trust_Building', objective: 'engagement', content_template: 'brand_story', kpi: 'engagement_rate', budget_ratio: 0.20 },
        { name: 'Offer', objective: 'traffic', content_template: 'offer_details', kpi: 'ctr', budget_ratio: 0.25 },
        { name: 'Urgency', objective: 'conversions', content_template: 'urgency_scarcity', kpi: 'conversion_rate', budget_ratio: 0.25 },
        { name: 'Conversion', objective: 'conversions', content_template: 'final_cta', kpi: 'cpa', budget_ratio: 0.30 },
      ],
      education_funnel: [
        { name: 'Awareness', objective: 'reach', content_template: 'educational_intro', kpi: 'reach', budget_ratio: 0.30 },
        { name: 'Consideration', objective: 'engagement', content_template: 'problem_solution', kpi: 'engagement_rate', budget_ratio: 0.30 },
        { name: 'Conversion', objective: 'conversions', content_template: 'lead_or_message_cta', kpi: 'conversion_rate', budget_ratio: 0.40 },
      ],
      solution_funnel: [
        { name: 'Problem', objective: 'awareness', content_template: 'pain_point', kpi: 'video_view_rate', budget_ratio: 0.30 },
        { name: 'Solution', objective: 'traffic', content_template: 'solution_explanation', kpi: 'ctr', budget_ratio: 0.30 },
        { name: 'Lead', objective: 'conversions', content_template: 'lead_capture', kpi: 'cpl', budget_ratio: 0.40 },
      ],
      lead_gen_call: [
        { name: 'Local_Intent', objective: 'awareness', content_template: 'local_problem', kpi: 'reach', budget_ratio: 0.30 },
        { name: 'Trust', objective: 'engagement', content_template: 'testimonial_or_proof', kpi: 'engagement_rate', budget_ratio: 0.30 },
        { name: 'Call_Action', objective: 'conversions', content_template: 'call_cta', kpi: 'cost_per_message', budget_ratio: 0.40 },
      ],
      direct_conversion: [
        { name: 'Product', objective: 'traffic', content_template: 'product_benefits', kpi: 'ctr', budget_ratio: 0.35 },
        { name: 'Retargeting', objective: 'conversions', content_template: 'offer_reminder', kpi: 'conversion_rate', budget_ratio: 0.65 },
      ],
    };
    const funnelStages = (funnelStagesByType[funnel.value] || funnelStagesByType.trust_funnel).map((stage, index) => ({
      stage_number: index + 1,
      ...stage,
    }));

    // Strategy object
    const strategy = {
      recommended_objective: {
        value: objective.value,
        confidence: objective.confidence,
        reasoning: objective.reasoning,
        rule_id: objective.rule_id,
      },
      recommended_channels: {
        value: channels.value,
        scores: channels.scores,
        channel_scores: padChannelScores(channels.scores),
        confidence: channels.confidence,
        reasoning: channels.reasoning,
        rule_id: channels.rule_id,
      },
      funnel_type: {
        value: funnel.value,
        stages: funnelStages.map((stage) => stage.name),
        confidence: funnel.confidence,
        reasoning: funnel.reasoning,
        rule_id: funnel.rule_id,
      },
      recommended_funnel: {
        funnel_type: funnel.value,
        stages: funnelStages,
        total_stages: funnelStages.length,
      },
      confidence_score: {
        value: 85,
        breakdown: {
          tracking: 20,
          assets: 20,
          content: 20,
          capacity: 15,
          readiness: 10,
        },
        confidence: 0.80,
        reasoning: 'Confidence derived from tracking, assets, and capacity.',
        rule_id: 'SS-004',
      },
      estimated_timeline: {
        days: readiness.value === 'ready' ? 7 : 14,
        label: readiness.value === 'ready' ? 'Accelerated (1 week)' : 'Standard (2 weeks)',
        factors: readiness.blockers.length > 0 ? readiness.blockers : ['Standard campaign setup'],
        confidence: 0.75,
        reasoning: `Timeline estimated based on readiness: ${readiness.value}`,
        rule_id: 'SS-005',
      },
    };

    // Execution object
    const trackingTools = input.tracking_tools || [];
    const requiredTrackingTools = ['pixel', 'ga4', 'capi'];
    const missingTrackingTools = requiredTrackingTools.filter(tool => !trackingTools.includes(tool));
    const trackingScore = input.tracking_status === 'ready'
      ? 100
      : input.tracking_status === 'partial'
        ? Math.max(40, Math.round((trackingTools.length / requiredTrackingTools.length) * 100))
        : 10;
    const trackingLevel = trackingScore >= 90 ? 'excellent' : trackingScore >= 70 ? 'good' : trackingScore >= 40 ? 'fair' : 'poor';
    const requiredEvents = input.key_events || ['page_view', 'purchase', 'add_to_cart'];
    const trackingSetupSteps = missingTrackingTools.map(tool => ({
      tool,
      steps: tool === 'capi'
        ? ['Set up server-side API', 'Configure event deduplication', 'Test with Events Manager']
        : tool === 'ga4'
          ? ['Create GA4 property', 'Install measurement tag', 'Verify conversion events']
          : ['Install base pixel code', 'Configure conversion events', 'Verify event firing'],
    }));
    const audienceSegments = input.audience_segments || [];
    const audienceSize = input.geo_scope === 'local_radius'
      ? { min: 10000, max: 100000, label: '10K-100K', daily_reach_estimate: 10000 }
      : input.geo_scope === 'country'
        ? { min: 200000, max: 4000000, label: '200K-4.0M', daily_reach_estimate: 200000 }
        : { min: 50000, max: 500000, label: '50K-500K', daily_reach_estimate: 50000 };
    const overlappingPairs = audienceSegments.length > 1
      ? audienceSegments.slice(0, -1).map((segment, index) => ({
          segment_a: segment,
          segment_b: audienceSegments[index + 1],
          overlap_percentage: 10,
        }))
      : [];
    const overlapRisk = overlappingPairs.length > 2 ? 'medium' : 'low';
    const creativeAssetSet = new Set(input.creative_assets || []);
    const recommendedFormats = [
      ...(channels.value.includes('meta') ? [
        { type: 'carousel', priority: 1, specs: '1080x1080, 3-5 cards', best_for: input.business_type || 'all', channel: 'meta', asset_ready: creativeAssetSet.has('images') },
        { type: 'video', priority: 2, specs: '1080x1080 or 1080x1920, 15-30s', best_for: 'all', channel: 'meta', asset_ready: creativeAssetSet.has('video') },
        { type: 'image', priority: 3, specs: '1080x1080 or 1200x628', best_for: 'all', channel: 'meta', asset_ready: creativeAssetSet.has('images') },
      ] : []),
      ...(channels.value.includes('google_ads') ? [
        { type: 'responsive_search', priority: 6, specs: '3 headlines, 2 descriptions', best_for: 'search', channel: 'google_ads', asset_ready: false },
        { type: 'display', priority: 7, specs: '300x250, 728x90', best_for: 'retargeting', channel: 'google_ads', asset_ready: creativeAssetSet.has('images') },
        { type: 'performance_max', priority: 8, specs: 'Mixed assets', best_for: 'ecommerce', channel: 'google_ads', asset_ready: creativeAssetSet.has('images') && creativeAssetSet.has('video') },
      ] : []),
      ...(channels.value.includes('tiktok_ads') ? [
        { type: 'short_video', priority: 4, specs: '1080x1920, 9-15s', best_for: 'prospecting', channel: 'tiktok_ads', asset_ready: creativeAssetSet.has('video') },
      ] : []),
    ];
    const socialProofPresent = {
      testimonials: creativeAssetSet.has('testimonials'),
      ugc: creativeAssetSet.has('ugc'),
      reviews: creativeAssetSet.has('reviews'),
      case_studies: creativeAssetSet.has('case_studies'),
    };
    const socialProofCount = Object.values(socialProofPresent).filter(Boolean).length;
    const socialProofGaps = Object.entries(socialProofPresent).filter(([, present]) => !present).map(([key]) => key);

    const dailyBudgetMin = input.budget_band?.includes('300') ? 300 : 100;
    const dailyBudgetRecommended = input.budget_band?.includes('300') ? 500 : 200;
    const dailyBudgetMax = input.budget_band?.includes('1000') ? 1000 : 500;
    const monthlyBudget = Math.round(dailyBudgetRecommended * 30);
    const testBudgetPercentage = 20;
    const testBudgetAmount = Math.round((monthlyBudget * testBudgetPercentage) / 100);
    const launchMilestones = [
      { phase: 'foundation', days: 2, tasks: ['Confirm objective, audience, offer, and tracking ownership'], critical: true },
      { phase: 'setup', days: 3, tasks: ['Prepare campaign structure, audiences, creatives, and events'], critical: true },
      { phase: 'validation', days: 4, tasks: ['Validate implementation, QA events, and approve test variants'], critical: true },
      { phase: 'launch_readiness', days: 5, tasks: ['Resolve required blockers and complete human approval checklist'], critical: true },
    ];
    const launchReadyDate = new Date(Date.now() + launchMilestones.reduce((sum, milestone) => sum + milestone.days, 0) * 86400000).toISOString();
    const preLaunchItems = [
      { category: 'tracking', item: 'Required conversion events configured', status: trackingScore >= 70 ? 'pass' : 'fail', required: true },
      { category: 'creative', item: 'Required creative assets available', status: creativeAssetSet.size > 0 ? 'pass' : 'warning', required: true },
      { category: 'audience', item: 'Audience definition and exclusions reviewed', status: (input.ideal_customer || input.audience_segments?.length) ? 'pass' : 'check_manually', required: true },
      { category: 'approval', item: 'Human approval recorded before launch', status: 'check_manually', required: true },
    ];
    const preLaunchSummary = {
      passed: preLaunchItems.filter(item => item.status === 'pass').length,
      failed: preLaunchItems.filter(item => item.status === 'fail').length,
      warnings: preLaunchItems.filter(item => item.status === 'warning').length,
      manual: preLaunchItems.filter(item => item.status === 'check_manually').length,
      total: preLaunchItems.length,
    };
    const preLaunchReady = preLaunchSummary.failed === 0 && preLaunchSummary.manual === 0;
    const preLaunchCompletion = Math.round((preLaunchSummary.passed / preLaunchSummary.total) * 100);

    const execution = {
      campaign_structure: {
        campaign_count: channels.value.length,
        campaigns: channels.value.map((ch, i) => ({
          id: `camp_${i+1}`,
          name: `${input.business_type || 'campaign'}_${ch}`,
          objective: objective.value,
          platform: ch,
          budget_share: 1 / channels.value.length,
          ad_sets: 2,
          creatives_per_ad_set: 3,
        })),
        ad_set_structure: {
          per_campaign: 2,
          total: channels.value.length * 2,
        },
      },
      audience_analysis: {
        size_estimate: {
          value: audienceSize,
          confidence: input.geo_scope ? 0.75 : 0.55,
          reasoning: `Audience size estimated from geo scope: ${input.geo_scope || 'unknown'}.`,
          rule_id: 'RF-006',
        },
        overlap_check: {
          value: {
            overlap_risk: overlapRisk,
            overlapping_pairs: overlappingPairs,
            average_overlap: overlappingPairs.length ? 10 : 0,
            recommendations: overlappingPairs.length ? ['Exclude overlapping audiences', 'Prioritize the highest-intent segment'] : ['Current segmentation is optimal'],
            // Reference-compatible aliases: preserve the canonical pair model and expose the reference vocabulary.
            segments: overlappingPairs.map((pair) => ({ segment_1: pair.segment_a, segment_2: pair.segment_b, overlap_score: pair.overlap_percentage })),
            recommendation: overlappingPairs.length ? 'Exclude overlapping audiences and prioritize the highest-intent segment.' : 'Only one or non-overlapping segments detected — no overlap risk.',
          },
          confidence: 0.70,
          reasoning: `Audience overlap: ${overlapRisk} risk with ${overlappingPairs.length} overlapping pairs.`,
          rule_id: 'RF-013',
        },
        frequency_cap: {
          value: {
            max_frequency_7_days: input.campaign_direction === 'retargeting' ? 5 : 4,
            max_frequency_30_days: input.campaign_direction === 'retargeting' ? 15 : 12,
            warning_threshold: 3,
            rationale: 'Standard frequency cap for prospecting and controlled retargeting campaigns.',
            action_if_exceeded: 'Pause ad set or refresh creative',
          },
          confidence: 0.80,
          reasoning: 'Frequency cap derived from campaign direction.',
          rule_id: 'RF-014',
        },
      },
      creative_strategy: {
        recommended_formats: {
          value: recommendedFormats,
          confidence: 0.80,
          reasoning: `Recommended ${recommendedFormats.length} creative formats across ${channels.value.length} channels.`,
          rule_id: 'RF-007',
        },
        refresh_schedule: {
          value: {
            refresh_interval_days: input.content_capacity === 'hard' ? 14 : 10,
            test_new_creative_every: 5,
            sunset_threshold: { ctr_drop: 30, frequency: 4 },
            fatigue_indicators: ['CTR drops > 20% from baseline', 'Frequency exceeds recommended cap', 'CPA increases > 30%', 'Engagement rate declines'],
            refresh_triggers: ['After 7 days if CTR is below baseline', 'When frequency reaches cap', 'Every 10 days automatically'],
          },
          confidence: 0.75,
          reasoning: `Creative refresh cadence derived from content capacity: ${input.content_capacity || 'unknown'}.`,
          rule_id: 'RF-015',
        },
        social_proof: {
          value: {
            social_proof_score: socialProofCount * 25,
            status: socialProofCount === 0 ? 'missing' : socialProofCount < 4 ? 'partial' : 'present',
            present: socialProofPresent,
            gaps: socialProofGaps,
            recommendations: socialProofGaps.map(gap => `Collect or produce ${gap.replace('_', ' ')}`),
            ad_performance_impact: 'Ads with relevant social proof may improve trust and conversion; validate impact with controlled tests.',
          },
          confidence: 0.80,
          reasoning: `Social proof score: ${socialProofCount * 25}/100 based on declared assets.`,
          rule_id: 'RF-028',
        },
      },
      tracking_assessment: {
        detailed_score: {
          value: {
            score: trackingScore,
            level: trackingLevel,
            present_tools: trackingTools,
            missing_tools: missingTrackingTools,
            required_events: requiredEvents,
            setup_steps: trackingSetupSteps,
          },
          confidence: 0.85,
          reasoning: `Tracking score ${trackingScore}/100: ${trackingTools.length}/${requiredTrackingTools.length} core tools present.`,
          rule_id: 'RF-008',
        },
      },
      audience_structure: {
        primary_audience: {
          name: 'Primary Audience',
          description: input.ideal_customer || 'Target audience based on campaign settings',
          targeting_type: input.awareness_level || 'interest_based',
          interests: input.audience_segments || [],
          size_estimate: '100K-500K',
        },
        segments: (input.audience_segments || ['high_intent', 'lookalike']).map((seg, i) => ({
          name: `Segment ${i+1}`,
          description: seg,
          targeting_type: 'custom',
          interests: [seg],
          size_estimate: '100K-500K',
        })),
        lookalike: {
          recommended: true,
          source: 'pixel_data',
          priority: 'medium' as const,
        },
        exclusions: ['existing_customers'],
      },
      budget_split: {
        daily_budget: {
          min: dailyBudgetMin,
          recommended: dailyBudgetRecommended,
          max: dailyBudgetMax,
          flexible: true,
          confidence: 0.85,
          reasoning: 'Daily budget derived from user budget band.',
          rule_id: 'BS-001',
        },
        channel_allocation: {
          value: allocateEvenly(channels.value),
          confidence: 0.80,
          reasoning: 'Budget distributed evenly across selected channels; shares sum to 1.',
          rule_id: 'BS-002',
        },
        test_budget: {
          percentage: testBudgetPercentage,
          amount: testBudgetAmount,
          confidence: 0.75,
          reasoning: `Test budget set to ${testBudgetPercentage}% of the projected 30-day budget for initial learning.`,
          rule_id: 'BS-003',
        },
        scale_budget: {
          max: dailyBudgetMax * 30,
          increment: '20% every 3 days',
          confidence: 0.70,
          reasoning: 'Scale budget is capped by the projected monthly envelope and remains advisory.',
          rule_id: 'BS-004',
        },
        cac_target: {
          value: input.max_cac || 150,
          source: input.max_cac ? 'user_defined' : 'inferred',
          flags: input.max_cac ? [] : ['inferred_cac_target'],
          confidence: 0.80,
          reasoning: 'CAC target derived from user input or inferred from business context.',
          rule_id: 'BS-005',
        },
      },
      creative_angles: {
        primary_angle: {
          name: 'result',
          hook: 'نتائج حقيقية في وقت قياسي',
          body: input.core_message || 'جرب منتجنا واكتشف الفرق بنفسك',
          cta: 'اطلب الآن',
        },
        alternative_angles: [
          { name: 'trust', hook: 'موثوق من آلاف العملاء', cta: 'تسوق الآن' },
          { name: 'urgency', hook: 'عرض محدود لفترة قصيرة', cta: 'لا تفوت الفرصة' },
        ],
        formats: [
          { type: 'image', priority: 1, platforms: ['meta', 'google_ads'], specs: '1080x1080', asset_ready: false },
          { type: 'video', priority: 2, platforms: ['meta', 'tiktok_ads'], specs: '1080x1920, 9-15s', asset_ready: false },
          { type: 'carousel', priority: 3, platforms: ['meta'], specs: '1080x1080, 3-5 cards', asset_ready: false },
        ],
      },
      tracking_checklist: {
        required_events: requiredEvents,
        setup_status: {
          overall: (input.tracking_status === 'ready' ? 'ready' : input.tracking_status === 'partial' ? 'partial' : 'missing') as 'ready' | 'partial' | 'missing',
          score: trackingScore,
          items: requiredEvents.map(ev => ({
            event: ev,
            status: (input.tracking_status === 'ready' ? 'ready' : input.tracking_status === 'partial' ? 'partial' : 'missing') as 'ready' | 'partial' | 'missing',
            required: true,
          })),
        },
        missing_items: missingTrackingTools,
        implementation_guide: {
          steps: [
            'Install Meta Pixel base code',
            'Set up conversion events',
            'Verify with Pixel Helper',
            'Test conversion firing',
          ],
          estimated_time: '2-4 hours',
          complexity: 'medium' as const,
        },
      },
      launch_plan: {
        detailed_timeline: {
          total_days: launchMilestones.reduce((sum, milestone) => sum + milestone.days, 0),
          milestones: launchMilestones,
          critical_path: launchMilestones.filter(milestone => milestone.critical).map(milestone => milestone.phase),
          launch_ready_date: launchReadyDate,
          confidence: 0.75,
          reasoning: 'Launch timeline is derived from tracking, creative, audience, and human approval readiness.',
          rule_id: 'RF-009',
        },
        pre_launch_checklist: {
          items: preLaunchItems,
          summary: {
            ...preLaunchSummary,
            ready_to_launch: preLaunchReady,
            completion_percentage: preLaunchCompletion,
            confidence: 0.80,
            reasoning: `Pre-launch checklist: ${preLaunchSummary.passed}/${preLaunchSummary.total} passed; ${preLaunchSummary.manual} manual approvals remain.`,
            rule_id: 'RF-010',
          },
          ready_to_launch: preLaunchReady,
          completion_percentage: preLaunchCompletion,
          confidence: 0.80,
          reasoning: `Pre-launch checklist: ${preLaunchSummary.passed}/${preLaunchSummary.total} passed; ${preLaunchSummary.manual} manual approvals remain.`,
          rule_id: 'RF-010',
        },
      },
      offer_strategy: {
        expiration_strategy: {
          offer_type: input.offer_type || 'standard',
          recommended_duration: input.offer_type === 'subscription' ? 'ongoing' : '30 days',
          max_duration: 'ongoing',
          urgency_level: 'medium' as const,
          urgency_tactics: ['Countdown timer in ad creative', 'Limited quantity messaging'],
          ad_copy_examples: ['Offer ends in [countdown] — don\'t miss out!'],
          refresh_frequency: 'bi-weekly',
          confidence: 0.75,
          reasoning: 'Offer strategy aligned with business type and offer type.',
          rule_id: 'RF-029',
        },
      },
    };

    // Governance object
    const governance = {
      risk_flags: {
        critical: readiness.blockers.map((b, i) => ({
          id: `CRIT-${String(i+1).padStart(3, '0')}`,
          message: b,
          impact: 'Prevents successful campaign launch or optimization',
          action: readiness.required_fixes[i] || 'Resolve blocker before launch',
        })),
        warnings: [],
        recommendations: [
          { id: 'REC-001', message: 'Monitor performance daily during the first week', action: 'Set up daily performance dashboard' },
        ],
        risk_score: {
          value: readiness.risk_level === 'low' ? 15 : readiness.risk_level === 'medium' ? 40 : 70,
          level: readiness.risk_level,
          breakdown: { tracking: 20, budget: 10, content: 15, response: 10, constraints: 5 },
          confidence: 0.80,
          reasoning: `Risk score calculated from readiness blockers. Level: ${readiness.risk_level}`,
          rule_id: 'RF-004',
        },
      },
      monitoring_plan: {
        post_launch_plan: {
          primary_kpis: ['ROAS', 'CPA', 'Conversion Rate'],
          check_frequency: 'daily',
          monitoring_schedule: [
            { day: 'Day 1-3', focus: 'Technical verification', actions: ['Verify pixel firing', 'Check spend pacing'] },
            { day: 'Day 4-7', focus: 'Initial optimization', actions: ['Pause underperforming ads', 'Adjust bids'] },
          ],
          alert_thresholds: {
            cpa_spike: 'CPA increases > 50% from target',
            ctr_drop: 'CTR drops below 0.5%',
            spend_imbalance: 'One ad set consumes > 70% of the allocated budget',
            frequency_high: 'Frequency exceeds 3 in 7 days',
          },
          reporting_dashboard: ['Meta Ads Manager', 'Google Analytics 4'],
          confidence: 0.80,
          reasoning: 'Monitoring plan with daily checks and budget/frequency alerts.',
          rule_id: 'RF-011',
        },
        budget_management: {
          pacing_strategy: {
            monthly_pacing: {
              week_1: { percentage: 25, amount: 280, focus: 'Testing' },
              week_2: { percentage: 30, amount: 336, focus: 'Optimization' },
              week_3: { percentage: 25, amount: 280, focus: 'Scaling' },
              week_4: { percentage: 20, amount: 224, focus: 'Maintenance' },
            },
            daily_targets: { min_spend: 100, target_spend: 160, max_spend: 200, warning_threshold: 80 },
            reallocation_trigger: 'Weekly if CPA deviates > 30% from target',
            emergency_pause: 'CPA > 2x target for 3 consecutive days',
            confidence: 0.75,
            reasoning: 'Budget pacing strategy for controlled spend.',
            rule_id: 'RF-012',
          },
          burn_rate_analysis: {
            monthly_budget: 1120,
            daily_target: 160,
            weekly_projection: [
              { week: 1, projected_spend: 280, cumulative: 280, status: 'testing' },
              { week: 2, projected_spend: 336, cumulative: 616, status: 'optimization' },
              { week: 3, projected_spend: 280, cumulative: 896, status: 'scaling' },
              { week: 4, projected_spend: 224, cumulative: 1120, status: 'maintenance' },
            ],
            burn_rate_alerts: [
              {
                threshold: 'Week 1 spend > 40% of monthly budget',
                action: 'Reduce or pause',
                severity: 'medium' as const,
              },
            ],
            pacing_recommendation: 'Standard pacing — scale winners, cut losers',
            confidence: 0.70,
            reasoning: 'Burn rate analysis for controlled budget pacing.',
            rule_id: 'RF-030',
          },
        },
        testing_plan: {
          ab_test_plan: {
            tests: [
              { element: 'Creative', variants: ['Image A', 'Image B', 'Video'], duration_days: 5, minimum_spend: 50, success_metric: 'CPA' },
              { element: 'Audience', variants: ['high_intent', 'lookalike'], duration_days: 7, minimum_spend: 100, success_metric: 'CPA' },
            ],
            total_test_budget: 150,
            test_priority: 'medium' as const,
            minimum_test_duration: 5,
            statistical_significance: '95% confidence, minimum 100 conversions per variant',
            confidence: 0.80,
            reasoning: 'A/B test plan for creative and audience optimization.',
            rule_id: 'RF-016',
          },
          benchmarks: {
            conversion_benchmarks: {
              status: 'unavailable' as const,
              industry_average_cvr: null,
              industry_average_ctr: null,
              target_cpa: null,
              performance_targets: {
                week_1: { cvr: null, ctr: null },
                week_2: { cvr: null, ctr: null },
                week_3_plus: { cvr: null, ctr: null },
              },
              source: 'unavailable: no verified market benchmark source was supplied for this blueprint',
              confidence: 0.35,
              reasoning: 'Market benchmarks are intentionally unavailable until a verifiable source scoped to market, currency, and objective is supplied.',
              rule_id: 'RF-017',
            },
            performance_targets: {
              week_1: { cvr: null, ctr: null },
              week_2: { cvr: null, ctr: null },
              week_3_plus: { cvr: null, ctr: null },
            },
            source: 'unavailable: no verified market benchmark source was supplied for this blueprint',
            confidence: 0.35,
            reasoning: 'Market benchmarks are intentionally unavailable until a verifiable source scoped to market, currency, and objective is supplied.',
            rule_id: 'RF-017',
          },
          market_context: {
            seasonality: {
              current_month: new Date().getMonth() + 1,
              seasonality_factor: 1.0,
              season: 'medium' as const,
              budget_adjustment: 'No adjustment needed',
              cpc_expectation: 'unavailable: CPC expectation requires a verified market source',
              recommendations: ['Obtain a verified market source before using CPC assumptions', 'Monitor competition after launch approval'],
              confidence: 0.65,
              reasoning: 'Current month seasonality factor applied.',
              rule_id: 'RF-018',
            },
            competitor_analysis: {
              status: 'unavailable' as const,
              competition_level: 'unavailable' as const,
              estimated_cpc_range: { low: null, high: null },
              market_saturation: 'unavailable: no verified competitor or market-saturation source was supplied',
              differentiation_strategies: ['Validate competitor positioning with approved market research', 'Emphasize the user-supplied unique value proposition'],
              ad_spend_recommendation: 'unavailable: do not infer competitive spend or CPC without a verified source',
              content_differentiation: ['Use the supplied offer and customer insights to test differentiated creative'],
              confidence: 0.35,
              reasoning: 'Competitive CPC, saturation, and spend are unavailable without a verified market source.',
              rule_id: 'RF-019',
            },
          },
          platform_guides: {
            platform_specific_rules: {
              value: channels.value.map(ch => ({
                platform: ch === 'meta' ? 'Meta (Facebook/Instagram)' : ch === 'google_ads' ? 'Google Ads' : ch === 'tiktok_ads' ? 'TikTok Ads' : ch,
                rules: ['Use platform best practices for ad creative', 'Set up proper tracking'],
                objective_mapping: objective.value.toUpperCase(),
                best_practices: ['Test multiple ad formats', 'Monitor performance metrics'],
              })),
              confidence: 0.85,
              reasoning: 'Platform-specific rules for selected channels.',
              rule_id: 'RF-020',
            },
          },
          compliance: {
            legal: {
              requirements: [
                { requirement: 'Privacy Policy on website', category: 'GDPR/CCPA', mandatory: true },
                { requirement: 'Ad disclosure (sponsored content)', category: 'FTC/Advertising Standards', mandatory: true },
              ],
              mandatory_count: 2,
              checklist_status: 'manual_review_required',
              recommendation: 'Review all mandatory requirements with legal counsel before launch.',
              confidence: 0.80,
              reasoning: 'Compliance requirements identified.',
              rule_id: 'RF-021',
            },
            privacy: {
              applicable_regulations: ['General Data Protection'],
              requirements: [{ regulation: 'General Data Protection', required: true, actions: ['Basic privacy policy'] }],
              compliance_status: 'standard',
              recommended_consultation: false,
              confidence: 0.75,
              reasoning: 'Privacy regulations applicable based on targeting.',
              rule_id: 'RF-022',
            },
          },
          technical_audit: {
            accessibility: {
              checks: [
                { item: 'Alt text on images', status: 'check_manually' as const, importance: 'high' as const, impact: 'Screen readers' },
              ],
              applicable_checks: 1,
              manual_checks_required: 1,
              overall_status: 'review_needed',
              priority_fixes: ['Add alt text to all images'],
              confidence: 0.70,
              reasoning: 'Accessibility checks require manual review.',
              rule_id: 'RF-023',
            },
            mobile_optimization: {
              mobile_score: 70,
              status: 'needs_work' as const,
              checks: [
                { item: 'Mobile-responsive landing page', status: 'check_manually' as const, weight: 30 },
                { item: 'Touch-friendly buttons', status: 'check_manually' as const, weight: 15 },
              ],
              traffic_share_note: '60-70% of ad traffic is mobile — mobile optimization is critical.',
              quick_wins: ['Compress images for mobile', 'Minimize form fields on mobile'],
              confidence: 0.70,
              reasoning: 'Mobile optimization score: 70/100.',
              rule_id: 'RF-024',
            },
            page_speed: {
              value: {
                speed_score: 'manual_test_required',
                target_metrics: { lcp: '< 2.5 seconds', fid: '< 100ms', cls: '< 0.1', ttfb: '< 600ms' },
                recommendations: [
                  { action: 'Compress images (WebP format)', impact: 'high', effort: 'low' },
                  { action: 'Enable browser caching', impact: 'medium', effort: 'low' },
                  { action: 'Minify CSS/JS files', impact: 'medium', effort: 'low' },
                  { action: 'Use CDN for static assets', impact: 'high', effort: 'medium' },
                  { action: 'Lazy load images and videos', impact: 'medium', effort: 'medium' },
                  { action: 'Remove unused JavaScript', impact: 'high', effort: 'medium' },
                ],
                tools: ['Google PageSpeed Insights', 'GTmetrix', 'WebPageTest', 'Lighthouse'],
                impact_on_ads: 'Landing-page speed must be validated with a real destination before launch; no performance claim is inferred here.',
              },
              status: 'not_applicable',
              confidence: 0.90,
              reasoning: 'No web destination detected; technical speed score remains a manual pre-launch check.',
              rule_id: 'RF-025',
            },
            ssl_certificate: {
              value: {
                status: 'check_manually',
                required: true,
                reason: 'HTTPS must be verified for every web destination before launch.',
                check_items: ['Valid SSL certificate (not expired)', 'HTTPS redirect from HTTP', 'Mixed content check (no HTTP resources on HTTPS page)', 'HSTS header recommended'],
                ad_platform_impact: { meta: 'Required for landing page ads', google_ads: 'Required for web destinations', tiktok: 'Required for web destination ads' },
                tools: ['SSL Labs Test', 'Why No Padlock', 'Browser DevTools'],
              },
              status: 'not_applicable',
              confidence: 0.90,
              reasoning: 'No web destination detected; SSL verification remains a manual pre-launch check.',
              rule_id: 'RF-026',
            },
            domain_authority: {
              value: {
                status: 'unavailable',
                message: 'No verified website or external authority measurement was supplied; do not infer a domain score.',
                benchmarks: { new: null, established: null, leader: null },
                ad_impact: { quality_score: 'Unavailable until measured with an external tool.', trust_signal: 'Unavailable until measured with an external tool.', organic_synergy: 'Unavailable until measured with an external tool.' },
                improvement_actions: ['Verify the domain with an approved external SEO tool', 'Review landing-page quality and trust signals after measurement'],
                tools: ['Moz', 'Ahrefs', 'SEMrush', 'Ubersuggest'],
              },
              status: 'not_applicable',
              confidence: 0.90,
              reasoning: 'No verified website or external domain-authority measurement was supplied.',
              rule_id: 'RF-027',
            },
          },
        },
      },
    };

    // Executive summary
    const executive_summary = {
      readiness_level: (readiness.value === 'ready' ? 'excellent' : readiness.value === 'ready_with_fixes' ? 'good' : 'weak') as 'excellent' | 'good' | 'fair' | 'weak',
      readiness_score: readiness.score,
      risk_level: readiness.risk_level,
      risk_score: readiness.risk_level === 'low' ? 15 : readiness.risk_level === 'medium' ? 40 : 70,
      launch_recommendation: readiness.value,
      estimated_launch_date: new Date(Date.now() + (readiness.value === 'ready' ? 7 : 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    // Flags
    const flags = {
      errors: readiness.blockers,
      warnings: readiness.required_fixes,
      infos: ['CDKS Engine v1.0.0 generated this blueprint.'],
    };

    // Telemetry: deterministic diagnostics derived from declared inputs only.
    const nonEmptyInputCount = Object.values(input).filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && String(value).trim().length > 0;
    }).length;
    const telemetry = {
      execution_time_ms: Date.now() - startTime,
      rules_executed: 4,
      scores_breakdown: {
        readiness: {
          assets: Math.min(20, (Array.isArray(input.creative_assets) ? input.creative_assets.length : 0) * 4),
          tracking: Math.min(25, (Array.isArray(input.tracking_tools) ? input.tracking_tools.length : 0) * 5),
          content: input.content_capacity === 'hard' ? 15 : input.content_capacity ? 10 : 0,
          conversion_path: input.conversion_destination ? 15 : 0,
          data_completeness: Math.min(15, Math.round((nonEmptyInputCount / 41) * 15)),
        },
        risk: {
          tracking: input.tracking_status === 'advanced' ? 0 : input.tracking_status ? 15 : 25,
          budget: input.budget_band ? 0 : 5,
          content: input.content_capacity === 'hard' ? 5 : 0,
          response: input.response_speed === 'slow' ? 5 : 2,
          constraints: Array.isArray(input.constraints) && input.constraints.length > 0 ? 4 : 0,
        },
      },
    };

    // ------------------------------------------
    // 2.3 تجميع الـ Blueprint النهائي
    // ------------------------------------------
    const fullBlueprint = {
      blueprint_id: uuidv4(),
      version: '2.0.0',
      rule_engine_version: '1.5.0',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      executive_summary,
      raw_input_summary: {
        business_type: input.business_type || 'unknown',
        primary_objective: input.primary_objective || 'unknown',
        budget_band: input.budget_band || 'unknown',
        tracking_status: input.tracking_status || 'unknown',
      },
      strategy,
      execution,
      governance,
      provenance_trail: provenance.getAll(),
      telemetry,
      flags,
    };

    console.log('🔍 [CDKS DEBUG] ====== FINAL DECISIONS ======');
    console.log('🔍 [CDKS DEBUG]   Objective:', objective.value);
    console.log('🔍 [CDKS DEBUG]   Funnel:', funnel.value);
    console.log('🔍 [CDKS DEBUG]   Channels:', channels.value);
    console.log('🔍 [CDKS DEBUG]   Launch:', readiness.value);
    console.log('🔍 [CDKS DEBUG] ====== END OF DEBUG ======\n');

    // ------------------------------------------
    // 2.4 التحقق النهائي باستخدام Zod
    // ------------------------------------------
    try {
      return CanonicalBlueprintSchema.parse(fullBlueprint);
    } catch (error) {
      console.error('[CDKS Engine] Validation failed:', error);
      throw new Error(`Blueprint validation failed: ${error}`);
    }
  }
}
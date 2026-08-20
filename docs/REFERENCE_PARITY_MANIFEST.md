# Reference Parity Manifest

Generated: 2026-08-20T09:04:00.523Z

هذا manifest يربط كل قسم مرجعي بمساره canonical، وأوراقه المرجعية، ومدخلات Wizard، وقواعد CDKS، واختبارات التكافؤ المطلوبة. لا يعتبر القسم كاملًا إلا بعد نجاح structural وsemantic وconsistency وprovenance وsafety وUI وregression.

| المقياس | القيمة |
|---|---:|
| الأقسام الكلية | 26 |
| full الحالي | 10 |
| partial الحالي | 16 |
| missing الحالي | 0 |

## Priority Batch P0

الأقسام ذات الأولوية: `strategy_summary`، `launch_plan`، `budget_split`، `tracking_checklist`، `first_14_days_plan`، `pre_launch_fixes`.

## Section Manifest

| القسم | الحالة | الأولوية | المسار canonical | أوراق المرجع | مدخلات المصدر | الواجهة |
|---|---|---|---|---:|---|---|
| executive_summary | full | baseline | `executive_summary` | 6 | primary_objective, budget_band, tracking_status | ExecutiveSummarySection |
| strategy_summary | partial | P0 | `strategy` | 35 | primary_objective, ad_channels, campaign_direction, business_type, tracking_status, creative_assets | StrategySummarySection |
| recommended_funnel | full | baseline | `strategy.recommended_funnel` | 3 | primary_objective, campaign_direction, budget_band | StrategySummarySection |
| campaign_structure | full | baseline | `execution.campaign_structure` | 4 | business_type, primary_objective, ad_channels, campaign_direction | CampaignStructureSection |
| audience_structure | full | baseline | `execution.audience_structure` | 10 | ideal_customer, audience_segments, geo_scope, target_locations | AudienceStructureSection |
| audience_analysis | partial | P1 | `execution.audience_analysis` | 24 | geo_scope, target_locations, audience_segments, business_type, ad_channels | AudienceAnalysisSection |
| creative_strategy | full | baseline | `execution.creative_strategy` | 25 | creative_assets, content_capacity, sales_motion, awareness_level, business_type | CreativeStrategySection |
| tracking_assessment | full | baseline | `execution.tracking_assessment` | 9 | tracking_status, tracking_tools, key_events, conversion_model, conversion_destination | TrackingAssessmentSection |
| launch_plan | partial | P0 | `execution.launch_plan` | 18 | build_mode, tracking_status, creative_assets, content_capacity, response_speed, constraints | LaunchPlanSection |
| monitoring | partial | P1 | `governance.monitoring_plan.post_launch_plan` | 11 | north_star_kpi, primary_objective, budget_band, max_cac, tracking_status | MonitoringSection |
| budget_management | partial | P1 | `governance.monitoring_plan.budget_management` | 29 | budget_band, budget_flexibility, max_cac, primary_objective, ad_channels | BudgetManagementSection |
| testing | partial | P1 | `governance.monitoring_plan.testing_plan.ab_test_plan` | 8 | primary_objective, creative_assets, content_capacity, budget_band, risk_tolerance | TestingSection |
| benchmarks | partial | P1 | `governance.monitoring_plan.testing_plan.benchmarks` | 13 | business_type, geo_scope, target_locations, currency, primary_objective | BenchmarksSection |
| market_context | partial | P2 | `governance.monitoring_plan.testing_plan.market_context` | 19 | geo_scope, target_locations, business_type, offer_type, competitor_advantage | MarketContextSection |
| platform_guides | full | baseline | `governance.monitoring_plan.testing_plan.platform_guides` | 4 | ad_channels, primary_objective, creative_assets, tracking_tools | PlatformGuidesSection |
| compliance | partial | P2 | `governance.monitoring_plan.testing_plan.compliance` | 14 | geo_scope, target_locations, business_type, offer_type, conversion_destination | ComplianceSection |
| technical_audit | partial | P2 | `governance.monitoring_plan.testing_plan.technical_audit` | 50 | conversion_destination, tracking_status, tracking_tools, creative_assets | TechnicalAuditSection |
| offer_strategy | partial | P2 | `execution.offer_strategy` | 10 | offer_type, offer_description, core_message, objections, risk_tolerance | OfferStrategySection |
| budget_split | partial | P0 | `execution.budget_split` | 28 | budget_band, budget_flexibility, ad_channels, average_order_value, profit_margin, max_cac | BudgetSplitSection |
| creative_angles | full | baseline | `execution.creative_angles` | 6 | core_message, usp, persuasion_angle, conversion_destination | CreativeAnglesSection |
| tracking_checklist | partial | P0 | `execution.tracking_checklist` | 8 | tracking_status, tracking_tools, key_events, conversion_model | TrackingChecklistSection |
| risk_flags | full | baseline | `governance.risk_flags` | 13 | constraints, tracking_status, budget_band, risk_tolerance | RiskFlagsSection |
| first_14_days_plan | partial | P0 | `execution.launch_plan.detailed_timeline` | 7 | build_mode, tracking_status, creative_assets, content_capacity, response_speed | First14DaysPlanSection |
| pre_launch_fixes | partial | P0 | `execution.launch_plan.pre_launch_checklist` | 11 | tracking_status, tracking_tools, creative_assets, conversion_destination, constraints | PreLaunchFixesSection |
| flags | full | baseline | `flags` | 3 | constraints, tracking_status | FlagsSection |
| debug | partial | P2 | `telemetry` | 12 | final_confirmed_inputs | DebugSection |

## P0 Assertions

### strategy_summary

المسار: `strategy`. القواعد: RF-001, RF-002, RF-003, RF-004.

- recommended objective has value/confidence/reasoning/rule_id
- recommended channels use value array and scores
- funnel type and timeline agree with objective
- confidence breakdown is internally consistent

### launch_plan

المسار: `execution.launch_plan`. القواعد: RF-009, RF-010.

- timeline days are monotonic
- critical path references existing milestones
- launch readiness is blocked by required failed checks
- checklist counters equal item states

### budget_split

المسار: `execution.budget_split`. القواعد: RF-011, RF-012.

- channel allocation sums to 1
- only selected channels receive allocation
- test percentage is 0-100
- CAC uses envelope currency
- daily budget min <= recommended <= max

### tracking_checklist

المسار: `execution.tracking_checklist`. القواعد: RF-008, RF-030.

- required events equal assessment events
- setup status agrees with tracking status
- implementation steps include tool and verification

### first_14_days_plan

المسار: `execution.launch_plan.detailed_timeline`. القواعد: RF-009.

- milestones cover the declared total days
- tasks are non-empty for active phases
- critical path is a subset of milestone phases

### pre_launch_fixes

المسار: `execution.launch_plan.pre_launch_checklist`. القواعد: RF-010, RF-032.

- summary counters equal item statuses
- required fail items prevent ready_to_launch
- manual checks remain manual


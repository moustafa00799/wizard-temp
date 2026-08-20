# Quality and Reference Coverage Gate

Generated: 2026-08-20T15:06:03.022Z
Base URL: `http://127.0.0.1:3001`

## Result: **PASS_WITH_GAPS**

The gate is deterministic and uses only local fixtures, the local `/api/generate/v5` endpoint, the canonical TypeScript contract, and the two checked-in reference blueprints. It does not call any AI provider.

## Summary

| Measure | Result |
|---|---:|
| Fixture API contract checks | 10/10 PASS |
| Canonical Wizard fields | 41/41 (100%) |
| Approved branch coverage | 4/4 (100%) |
| Locale coverage | 2/2 (100%) |
| Currency coverage | 3/3 (100%) |
| Readiness states before confirmation | 1/3 (33.33%) |
| Readiness states after confirmation | 3/3 (100%) |
| Reference section structural coverage | 26/26 full; 0 partial; 0 missing |

## Fixture Matrix

| Scenario | Branch | Locale | Currency | Readiness before | Readiness after | API contract |
|---|---|---|---|---|---|---|
| EX-001 | ecommerce | ar | SAR | blocked | review | PASS |
| EX-002 | b2b | en | USD | blocked | review | PASS |
| EX-003 | local_service | ar | SAR | blocked | blocked | PASS |
| EX-004 | app | en | EGP | blocked | review | PASS |
| EX-005 | education | ar | SAR | blocked | ready | PASS |
| EX-006 | ecommerce | ar | USD | blocked | ready | PASS |
| EX-007 | consumer_product | en | USD | blocked | review | PASS |
| EX-008 | ecommerce | ar | USD | blocked | ready | PASS |
| EX-009 | consumer_product | en | SAR | blocked | review | PASS |
| EX-010 | b2b | ar | EGP | blocked | review | PASS |

## Reference Coverage

| Reference section | Current v3 path | Status | Leaf fields covered | Structural coverage |
|---|---|---|---:|---:|
| executive_summary | blueprint.executive_summary | full | 6/6 | 100% |
| strategy_summary | blueprint.strategy | full | 35/35 | 100% |
| recommended_funnel | blueprint.strategy.recommended_funnel | full | 3/3 | 100% |
| campaign_structure | blueprint.execution.campaign_structure | full | 4/4 | 100% |
| audience_structure | blueprint.execution.audience_structure | full | 10/10 | 100% |
| audience_analysis | blueprint.execution.audience_analysis | full | 24/24 | 100% |
| creative_strategy | blueprint.execution.creative_strategy | full | 25/25 | 100% |
| tracking_assessment | blueprint.execution.tracking_assessment | full | 9/9 | 100% |
| launch_plan | blueprint.execution.launch_plan | full | 18/18 | 100% |
| monitoring | blueprint.governance.monitoring_plan.post_launch_plan | full | 11/11 | 100% |
| budget_management | blueprint.governance.monitoring_plan.budget_management | full | 29/29 | 100% |
| testing | blueprint.governance.monitoring_plan.testing_plan.ab_test_plan | full | 8/8 | 100% |
| benchmarks | blueprint.governance.monitoring_plan.testing_plan.benchmarks | full | 13/13 | 100% |
| market_context | blueprint.governance.monitoring_plan.testing_plan.market_context | full | 19/19 | 100% |
| platform_guides | blueprint.governance.monitoring_plan.testing_plan.platform_guides | full | 4/4 | 100% |
| compliance | blueprint.governance.monitoring_plan.testing_plan.compliance | full | 14/14 | 100% |
| technical_audit | blueprint.governance.monitoring_plan.testing_plan.technical_audit | full | 50/50 | 100% |
| offer_strategy | blueprint.execution.offer_strategy | full | 10/10 | 100% |
| budget_split | blueprint.execution.budget_split | full | 28/28 | 100% |
| creative_angles | blueprint.execution.creative_angles | full | 6/6 | 100% |
| tracking_checklist | blueprint.execution.tracking_checklist | full | 8/8 | 100% |
| risk_flags | blueprint.governance.risk_flags | full | 13/13 | 100% |
| first_14_days_plan | blueprint.execution.launch_plan.detailed_timeline | full | 7/7 | 100% |
| pre_launch_fixes | blueprint.execution.launch_plan.pre_launch_checklist | full | 11/11 | 100% |
| flags | blueprint.flags | full | 3/3 | 100% |
| debug | blueprint.telemetry | full | 12/12 | 100% |

## Gaps and Recommendations

- **Readiness before confirmation:** Missing v3 readiness states: ready, review. Add confirmed fixtures or controlled readiness variants; all current fixtures are intentionally unconfirmed and therefore blocked.

## Regression Policy

The default gate fails on contract regressions: missing canonical fields, failed v5 parity, opened safety gates, missing provenance, or a reduction in approved branches/locales/currencies compared with the required baseline. Existing reference-parity gaps and readiness diversity gaps are reported as quality findings so the repository can remain green while the next contract iteration is planned.


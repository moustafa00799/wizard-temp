# Quality and Reference Coverage Gate

Generated: 2026-08-20T02:41:54.704Z
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
| Reference section structural coverage | 10/26 full; 16 partial; 0 missing |

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
| strategy_summary | blueprint.strategy | partial | 26/35 | 74.29% |
| recommended_funnel | blueprint.strategy.recommended_funnel | full | 3/3 | 100% |
| campaign_structure | blueprint.execution.campaign_structure | full | 4/4 | 100% |
| audience_structure | blueprint.execution.audience_structure | full | 10/10 | 100% |
| audience_analysis | blueprint.execution.audience_analysis | partial | 22/24 | 91.67% |
| creative_strategy | blueprint.execution.creative_strategy | full | 25/25 | 100% |
| tracking_assessment | blueprint.execution.tracking_assessment | full | 9/9 | 100% |
| launch_plan | blueprint.execution.launch_plan | partial | 6/18 | 33.33% |
| monitoring | blueprint.governance.monitoring_plan.post_launch_plan | partial | 3/11 | 27.27% |
| budget_management | blueprint.governance.monitoring_plan.budget_management | partial | 6/29 | 20.69% |
| testing | blueprint.governance.monitoring_plan.testing_plan.ab_test_plan | partial | 3/8 | 37.5% |
| benchmarks | blueprint.governance.monitoring_plan.testing_plan.benchmarks | partial | 3/13 | 23.08% |
| market_context | blueprint.governance.monitoring_plan.testing_plan.market_context | partial | 6/19 | 31.58% |
| platform_guides | blueprint.governance.monitoring_plan.testing_plan.platform_guides | full | 4/4 | 100% |
| compliance | blueprint.governance.monitoring_plan.testing_plan.compliance | partial | 6/14 | 42.86% |
| technical_audit | blueprint.governance.monitoring_plan.testing_plan.technical_audit | partial | 15/50 | 30% |
| offer_strategy | blueprint.execution.offer_strategy | partial | 3/10 | 30% |
| budget_split | blueprint.execution.budget_split | partial | 19/28 | 67.86% |
| creative_angles | blueprint.execution.creative_angles | full | 6/6 | 100% |
| tracking_checklist | blueprint.execution.tracking_checklist | partial | 7/8 | 87.5% |
| risk_flags | blueprint.governance.risk_flags | full | 13/13 | 100% |
| first_14_days_plan | blueprint.execution.launch_plan.detailed_timeline | partial | 3/7 | 42.86% |
| pre_launch_fixes | blueprint.execution.launch_plan.pre_launch_checklist | partial | 3/11 | 27.27% |
| flags | blueprint.flags | full | 3/3 | 100% |
| debug | blueprint.telemetry | partial | 2/12 | 16.67% |

## Gaps and Recommendations

- **Readiness before confirmation:** Missing v3 readiness states: ready, review. Add confirmed fixtures or controlled readiness variants; all current fixtures are intentionally unconfirmed and therefore blocked.
- **Reference parity:** 16 reference sections are only semantically or structurally partial: strategy_summary, audience_analysis, launch_plan, monitoring, budget_management, testing, benchmarks, market_context, compliance, technical_audit, offer_strategy, budget_split, tracking_checklist, first_14_days_plan, pre_launch_fixes, debug. Add explicit fields or mapping documentation where the current v3 shape intentionally differs.

## Regression Policy

The default gate fails on contract regressions: missing canonical fields, failed v5 parity, opened safety gates, missing provenance, or a reduction in approved branches/locales/currencies compared with the required baseline. Existing reference-parity gaps and readiness diversity gaps are reported as quality findings so the repository can remain green while the next contract iteration is planned.


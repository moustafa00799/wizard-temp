# Quality and Reference Coverage Gate

Generated: 2026-08-19T22:48:30.876Z
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
| Reference section structural coverage | 6/26 full; 12 partial; 8 missing |

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
| recommended_funnel | blueprint.strategy.funnel_type | partial | 0/3 | 0% |
| campaign_structure | blueprint.execution.campaign_structure | full | 4/4 | 100% |
| audience_structure | blueprint.execution.audience_structure | full | 10/10 | 100% |
| audience_analysis | — | missing | 0/24 | 0% |
| creative_strategy | — | missing | 0/25 | 0% |
| tracking_assessment | — | missing | 0/9 | 0% |
| launch_plan | blueprint.execution.launch_plan | partial | 3/18 | 16.67% |
| monitoring | blueprint.governance.monitoring_plan.post_launch_plan | missing | 0/11 | 0% |
| budget_management | blueprint.governance.monitoring_plan.budget_management | partial | 6/29 | 20.69% |
| testing | blueprint.governance.monitoring_plan.testing_plan.ab_test_plan | partial | 3/8 | 37.5% |
| benchmarks | blueprint.governance.monitoring_plan.testing_plan.benchmarks | missing | 0/13 | 0% |
| market_context | blueprint.governance.monitoring_plan.testing_plan.market_context | partial | 6/19 | 31.58% |
| platform_guides | blueprint.governance.monitoring_plan.testing_plan.platform_guides | missing | 0/4 | 0% |
| compliance | blueprint.governance.monitoring_plan.testing_plan.compliance | partial | 6/14 | 42.86% |
| technical_audit | blueprint.governance.monitoring_plan.testing_plan.technical_audit | partial | 15/50 | 30% |
| offer_strategy | blueprint.execution.offer_strategy | partial | 3/10 | 30% |
| budget_split | blueprint.execution.budget_split | partial | 19/28 | 67.86% |
| creative_angles | blueprint.execution.creative_angles | full | 6/6 | 100% |
| tracking_checklist | blueprint.execution.tracking_checklist | partial | 7/8 | 87.5% |
| risk_flags | blueprint.governance.risk_flags | full | 13/13 | 100% |
| first_14_days_plan | — | missing | 0/4 | 0% |
| pre_launch_fixes | — | missing | 0/8 | 0% |
| flags | blueprint.flags | full | 3/3 | 100% |
| debug | blueprint.telemetry | partial | 2/12 | 16.67% |

## Gaps and Recommendations

- **Readiness before confirmation:** Missing v3 readiness states: ready, review. Add confirmed fixtures or controlled readiness variants; all current fixtures are intentionally unconfirmed and therefore blocked.
- **Reference parity:** 8 reference sections are not represented in v3: audience_analysis, creative_strategy, tracking_assessment, monitoring, benchmarks, platform_guides, first_14_days_plan, pre_launch_fixes. Address these as explicit v4/v3.1 contract extensions rather than hiding them inside untyped blobs.
- **Reference parity:** 12 reference sections are only semantically or structurally partial: strategy_summary, recommended_funnel, launch_plan, budget_management, testing, market_context, compliance, technical_audit, offer_strategy, budget_split, tracking_checklist, debug. Add explicit fields or mapping documentation where the current v3 shape intentionally differs.

## Regression Policy

The default gate fails on contract regressions: missing canonical fields, failed v5 parity, opened safety gates, missing provenance, or a reduction in approved branches/locales/currencies compared with the required baseline. Existing reference-parity gaps and readiness diversity gaps are reported as quality findings so the repository can remain green while the next contract iteration is planned.


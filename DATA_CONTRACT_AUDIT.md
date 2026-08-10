# Data Contract Audit

Generated for Phase A governance review.

## Summary

- Canonical fields: **41**
- Legacy `AIWizardPayload` fields: **35**
- Canonical contract shape: **PASS**
- Governance coverage: **PASS**
- Governance dispositions: **PASS**
- Canonical → legacy AI projection: **PASS** (legacy projection remains a derived boundary)
- Canonical → Rules engine: **PASS**
- Canonical → Blueprint preservation: **PASS**
- AI boundary validator: **PASS**
- Route uses canonical pipeline: **PASS**
- `StrategyAIInput`: **PENDING — B.1**
- `ExecutionAIInput`: **PENDING — B.2**
- `StrategyDecision`: **PENDING — B.1**
- `ExecutionDecision`: **PENDING — B.2**

## Governance Policy

The legacy `AIWizardPayload` is not required to contain every canonical field. A canonical field may legitimately be absent from that provider payload when its governance disposition is `context`, `metadata_only`, `derived`, or otherwise not owned by the legacy AI boundary.

The authoritative source remains `CanonicalWizardInput`.

## Canonical Governance Matrix

| Canonical field | Strategy | Execution | Rules | Blueprint | Disposition |
|---|---|---|---|---|---|
| build_mode | required | context | input | preserve | strategy_required |
| business_type | required | context | input | preserve | strategy_required |
| offer_description | required | required | input | preserve | strategy_required |
| sales_motion | required | required | input | preserve | strategy_required |
| customer_problem | required | required | input | preserve | strategy_required |
| key_value_drivers | required | required | input | preserve | strategy_required |
| usp | required | required | input | preserve | strategy_required |
| primary_objective | required | required | input | preserve | strategy_required |
| secondary_objectives | required | context | input | preserve | strategy_required |
| north_star_kpi | required | required | input | preserve | strategy_required |
| existing_assets | context | required | input | preserve | execution_context |
| previous_campaigns_status | required | context | input | preserve | strategy_required |
| past_performance_notes | required | context | input | preserve | strategy_required |
| ideal_customer | required | required | input | preserve | strategy_required |
| awareness_level | required | required | input | preserve | strategy_required |
| audience_segments | required | required | input | preserve | strategy_required |
| geo_scope | required | required | input | preserve | strategy_required |
| target_locations | required | required | input | preserve | strategy_required |
| offer_type | required | required | input | preserve | strategy_required |
| core_message | required | required | input | preserve | strategy_required |
| objections | required | required | input | preserve | strategy_required |
| persuasion_angle | required | required | input | preserve | strategy_required |
| conversion_destination | required | required | input | preserve | execution_required |
| ad_channels | required | required | input | preserve | strategy_required |
| campaign_direction | required | required | input | preserve | strategy_required |
| budget_band | required | required | input | preserve | strategy_required |
| budget_flexibility | required | required | input | preserve | strategy_required |
| average_order_value | required | required | input | preserve | strategy_required |
| profit_margin | required | required | input | preserve | strategy_required |
| max_cac | required | required | input | preserve | strategy_required |
| tracking_status | context | required | input | preserve | execution_required |
| tracking_tools | context | required | input | preserve | execution_required |
| key_events | context | required | input | preserve | execution_required |
| conversion_model | required | required | input | preserve | strategy_required |
| creative_assets | context | required | input | preserve | execution_required |
| content_capacity | required | required | input | preserve | strategy_required |
| constraints | required | required | input | preserve | strategy_required |
| response_speed | required | required | input | preserve | execution_required |
| top_priority | required | context | input | preserve | strategy_required |
| risk_tolerance | required | required | input | preserve | strategy_required |
| final_confirmed_inputs | metadata | metadata | — | preserve | metadata_only |

## Phase A Interpretation

The audit no longer treats the 35-field legacy `AIWizardPayload` as if it were the 41-field canonical contract. This removes the previous false failure caused by fields such as `awareness_level`, `conversion_destination`, `average_order_value`, `profit_margin`, `max_cac`, `conversion_model`, `content_capacity`, `constraints`, `top_priority`, and `risk_tolerance` not being copied verbatim into the legacy payload.

Migration completeness is intentionally separate. `--strict-migration` will become the enforcement mode after B.1/B.2 create the Strategy and Execution projections and decision schemas.

## Next Phase

Proceed to **B.1 — `StrategyAIInput` + `StrategyDecision`**. Do not expand `AIWizardPayload`, change prompts, remove the current multi-phase orchestration, or weaken Rules parity as part of Phase A.

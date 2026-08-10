# Contract Governance — Phase A

## Status

Design artifact for the refactoring of the AI generation pipeline.

This document defines the intended ownership/disposition of the 41-field `CanonicalWizardInput`.
It is deliberately separate from the current provider-specific `AIWizardPayload`.

## Architectural rule

`CanonicalWizardInput` is the source of truth.

Provider payloads, AI inputs, Rules inputs, and Blueprint projections are derived contracts.
No derived contract may silently discard a canonical field.

Every canonical field must have an explicit disposition:

- `strategy_required` — required by Strategy AI.
- `execution_required` — required by Execution AI.
- `strategy_context` — available to Strategy AI but not a primary decision input.
- `execution_context` — available to Execution AI but not a primary decision input.
- `rules_input` — consumed by deterministic Rules.
- `blueprint_preserve` — must survive into the final blueprint.
- `metadata_only` — retained for traceability/validation, not AI reasoning.
- `derived` — represented through a deterministic or AI-derived decision rather than copied verbatim.
- `excluded` — intentionally not passed to an AI boundary; must have a documented reason.

## Proposed ownership matrix

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

## Important interpretation

This matrix is a governance contract, not a claim that every Rules Engine rule currently consumes every field.

The actual Rules Engine and Blueprint compiler must be audited against this matrix. If a field is marked `rules: input` but no rule consumes it, that is a separate coverage finding and must not be hidden.

## AI boundaries

### Strategy AI input

The Strategy projection should contain the fields required to answer:

> What should we do, for whom, through which strategic path, and why?

It should not be responsible for generating campaign/ad-set structures.

### Execution AI input

Execution receives:

1. the canonical execution projection,
2. the validated `StrategyDecision`,
3. deterministic `RulesDecision`.

It answers:

> How do we execute the accepted strategy?

### Rules

Rules remain deterministic. They should constrain or validate AI decisions rather than act as a generic AI-output backfill store.

### Blueprint

The Blueprint compiler combines:

`Canonical input + RulesDecision + StrategyDecision + ExecutionDecision`

It should preserve the original canonical input for traceability.

## Audit requirements

The new audit must fail when:

1. a canonical field has no declared disposition;
2. a required Strategy field is absent from the Strategy projection;
3. a required Execution field is absent from the Execution projection;
4. a declared projection references a non-existent canonical field;
5. an AI decision is consumed without schema validation;
6. a Blueprint field is populated only by an undocumented fallback;
7. Rules silently overwrite an AI decision without an explicit precedence rule.

The audit must **not** fail merely because a canonical field is not copied verbatim into an AI payload when the governance contract marks it as `context`, `metadata`, or `derived`.

## Migration order

1. Add this governance contract and audit it.
2. Create `StrategyAIInput` and `StrategyDecision` schemas.
3. Create `ExecutionAIInput` and `ExecutionDecision` schemas.
4. Replace the three-phase AI orchestration with two logical AI calls.
5. Add provider-level structured-output support where the selected model supports it.
6. Validate every AI result at the boundary.
7. Replace `blueprint-backfill` behavior with an explicit deterministic compiler.
8. Preserve the existing Rules parity suite throughout the migration.
9. Run build, TypeScript, contract audit, and parity tests before each migration step.

## Non-goals for Phase A

- Do not expand the old `AIWizardPayload` from 35 to 41 fields.
- Do not modify prompts yet.
- Do not remove the old multi-phase implementation yet.
- Do not weaken the existing Rules parity tests.
- Do not use fallback/backfill to make the audit pass.

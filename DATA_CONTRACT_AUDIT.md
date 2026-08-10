# Data Contract Audit

Generated: 2026-08-08T12:16:48.877Z

## Pipeline

`Wizard Raw Data → CanonicalWizardInput → AI Adapter / Rules Engine → AI Prompt → Blueprint`

- Canonical fields: **41**
- Wizard → Canonical: **PASS**
- Canonical → AI adapter: **PASS**
- AI payload → Prompt: **PASS**
- Canonical → Rules engine: **PASS**
- Canonical → Blueprint: **PASS**
- Route uses canonical pipeline: **PASS**

## Field Matrix

| Wizard field | Canonical | AI projection | Prompt | Blueprint | Status |
|---|---:|---|---:|---:|---|
| `build_mode` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `business_type` | ✓ | `business_type` | ✓ | ✓ | سليم |
| `offer_description` | ✓ | `offer_description` | ✓ | ✓ | سليم |
| `sales_motion` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `customer_problem` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `key_value_drivers` | ✓ | `unique_selling_points` | ✓ | ✓ | سليم |
| `usp` | ✓ | `competitor_advantage` | ✓ | ✓ | سليم |
| `primary_objective` | ✓ | `primary_goal` | ✓ | ✓ | سليم |
| `secondary_objectives` | ✓ | `secondary_goals` | ✓ | ✓ | سليم |
| `north_star_kpi` | ✓ | `success_metric` | ✓ | ✓ | سليم |
| `existing_assets` | ✓ | `current_channels` | ✓ | ✓ | سليم |
| `previous_campaigns_status` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `past_performance_notes` | ✓ | `current_results` | ✓ | ✓ | سليم |
| `ideal_customer` | ✓ | `target_audience` | ✓ | ✓ | سليم |
| `awareness_level` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `audience_segments` | ✓ | `audience_interests` | ✓ | ✓ | سليم |
| `geo_scope` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `target_locations` | ✓ | `audience_locations` | ✓ | ✓ | سليم |
| `offer_type` | ✓ | `offer_type` | ✓ | ✓ | سليم |
| `core_message` | ✓ | `brand_guidelines` | ✓ | ✓ | سليم |
| `objections` | ✓ | `audience_pain_points` | ✓ | ✓ | سليم |
| `persuasion_angle` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `conversion_destination` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `ad_channels` | ✓ | `preferred_channels` | ✓ | ✓ | سليم |
| `campaign_direction` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `budget_band` | ✓ | `price_range` | ✓ | ✓ | سليم |
| `budget_flexibility` | ✓ | `budget_flexibility` | ✓ | ✓ | سليم |
| `average_order_value` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `profit_margin` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `max_cac` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `tracking_status` | ✓ | `has_tracking_setup` | ✓ | ✓ | سليم |
| `tracking_tools` | ✓ | `tracking_platforms` | ✓ | ✓ | سليم |
| `key_events` | ✓ | `conversion_events` | ✓ | ✓ | سليم |
| `conversion_model` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `creative_assets` | ✓ | `creative_asset_types` | ✓ | ✓ | سليم |
| `content_capacity` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `constraints` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `response_speed` | ✓ | `urgency_level` | ✓ | ✓ | سليم |
| `top_priority` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `risk_tolerance` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |
| `final_confirmed_inputs` | ✓ | `source_wizard_input` | ✓ | ✓ | سليم |

## Interpretation

Fields mapped to a provider-friendly name are projections only. The authoritative copy remains under `source_wizard_input`, so fields such as `awareness_level`, `sales_motion`, `conversion_destination`, `persuasion_angle`, `average_order_value`, `profit_margin`, `max_cac`, `conversion_model`, `content_capacity`, `constraints`, `top_priority`, and `risk_tolerance` are no longer silently dropped.

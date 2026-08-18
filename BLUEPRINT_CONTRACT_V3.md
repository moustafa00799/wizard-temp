# BLUEPRINT_CONTRACT_V3

## Purpose

`BLUEPRINT_CONTRACT_V3` is the versioned envelope for the Campaign Builder AI output. It preserves the complete canonical Wizard input, separates deterministic decisions from future AI enrichment, and makes readiness, warnings, assumptions, and provenance auditable.

Phase 1 operates in `blueprint_only` mode. The contract cannot authorize external campaign creation, publishing, editing, pausing, or budget spending.

## Contract sections

| Section | Responsibility | Phase-one status |
|---|---|---|
| `source_wizard_input` | The 41-field canonical user input | Required and validated |
| `decisions` | Objective, funnel, and channels from deterministic policy | Required and authoritative |
| `expected_outcomes` | Golden expected objective/funnel/readiness used by fixtures | Required for regression fixtures |
| `strategy` | Future AI Strategy Builder trace | Present as pending/not requested in Phase 1 |
| `reasoning` | Future AI Reasoning trace | Present as pending/not requested in Phase 1 |
| `readiness` | Launch readiness state and evidence | Required and policy-controlled |
| `warnings` | Actionable errors, warnings, and information | Required; hard blockers cannot be overridden by AI |
| `provenance` | Source of every material decision or assumption | Required |
| `validation` | Contract validity and safety gates | Required; external actions and spend are false |
| `blueprint` | Rich campaign blueprint body | Required; generated in Blueprint-only mode |

## Authority order

The authority order is:

1. User-confirmed Wizard input.
2. Deterministic policy and hard constraints.
3. Rules-engine calculations.
4. AI Strategy Builder suggestions.
5. AI Reasoning explanations and critique.
6. Explicitly labeled defaults or synthetic assumptions.

AI may enrich, propose alternatives, and explain. AI may not override a hard readiness blocker, invent a confirmed fact, or turn a draft Blueprint into an external action.

## Fixture policy

The ten phase-one fixtures use `final_confirmed_inputs: false` because eleven fields were completed as synthetic assumptions. Therefore their canonical readiness result before human confirmation is `blocked` with rule `CDKS-READINESS-UNCONFIRMED`. The fixture expectation also records the post-confirmation readiness result so the same scenario can test the later review/approval transition.

## Provenance requirements

Each material decision must include an authority, evidence paths, uncertainty list, and source reference. Synthetic fields must use `source: assumption`, `authority: DEFAULT_ASSUMPTION`, and `user_confirmed: false`. Deterministic objective, funnel, channel, and readiness decisions must reference their policy rule IDs.

## Future AI fields

When AI Strategy Builder is enabled, it writes only to `strategy` and explicitly marked proposal fields. When AI Reasoning is enabled, it writes to `reasoning` and explanatory trace fields. Both must include provider/model, status, limitations, and accepted/rejected changes. The deterministic contract remains valid if AI is unavailable.

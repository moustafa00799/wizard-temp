# Campaign Builder AI — Product Decisions v1.0

**Status:** Approved for Phase 1

**Primary repository:** `wizard-temp`. The repositories `wizard-ui`, `campaign-engine`, and `campaign-rule-engine-specs` remain reference sources and fixtures.

## Approved scope

| Decision | Approved value |
|---|---|
| Output languages | Arabic and English, selected by the end user |
| Supported currencies | EGP, SAR, USD |
| Initial markets | Egypt and the Gulf generally, with country/city captured in the Wizard input |
| Business branches | `local_product/service`, `ecommerce`, `app`, `b2b` |
| Integration level | Blueprint only for Phase 1; contracts should be designed for future Draft Adapters |
| Data source | Wizard input plus anonymized examples; Wizard-only remains a supported fallback |
| Approval policy | No external action in Phase 1; no campaign publishing and no budget spending |

## AI and deterministic-system boundary

The deterministic Rules Engine and hard constraints remain authoritative for objective eligibility, readiness blockers, budget constraints, channel restrictions, schema validity, and safety policies. AI may propose strategy, enrich messaging, compare alternatives, and explain decisions, but it may not override a hard constraint or silently invent a confirmed business fact.

Every AI-derived field must carry provenance indicating whether it came from Wizard input, deterministic rule output, AI suggestion, fallback/default logic, or a human-approved correction.

## Phase-one acceptance boundary

Phase 1 produces a validated Blueprint in JSON and a readable bilingual presentation/PDF. It does not create, publish, pause, edit, or spend against campaigns on Meta, Google, TikTok, or any other external platform. It does not require live advertising-platform credentials.

## Example-data decision

The recovered repositories contain three complete Wizard autofill profiles in `wizard-ui/src/lib/dev-autofill.ts`, ten generated output blueprints in `campaign-engine/dashboard_data/`, and ten minimal semantic golden cases in `wizard-temp/scripts/semantic-runner.ts`. These sets have different purposes and must not be conflated.

For Phase 1, the three complete profiles are reusable as UI fixtures, the ten dashboard blueprints are output-reference fixtures, and GD-001 through GD-010 remain semantic regression fixtures. Additional full Wizard profiles must be added only after the canonical input contract is finalized and each expected decision is reviewed.

## Deferred scope

Live platform adapters, OAuth, actual campaign publishing, automatic optimization loops, customer personal data, fine-tuning, vector search, and continuous CRM/analytics synchronization are deferred until a later approved phase.

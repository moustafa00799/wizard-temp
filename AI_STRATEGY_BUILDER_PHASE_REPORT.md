# AI Strategy Builder Phase Report

## Scope

This phase adds an opt-in, proposal-only AI Strategy Builder behind the live `/api/generate/v5` endpoint. The deterministic CDKS engine remains the authority for objective, funnel, channels, readiness, warnings, blueprint assembly, and all safety gates.

## Live behavior

The v5 request may include `ai_strategy_builder: { enabled: true, model?: string }`. The default is disabled. When disabled, the v3 strategy trace remains `not_requested`. When enabled, the builder receives the canonical Wizard input, CDKS decisions, readiness, warnings, and the canonical Blueprint as context.

The AI response is restricted to a proposal schema containing a strategic summary, message angles, audience hypotheses, experiment ideas, proposed changes, rejected changes, and limitations. The adapter sanitizes proposals that attempt to override objective, funnel, channels, readiness, budget, launch, campaign publishing, or spending. The returned proposal is recorded only in the v3 strategy trace and does not mutate the canonical Blueprint.

If the provider is unavailable or the AI result fails schema validation, the trace becomes `failed` with limitations and the deterministic CDKS output remains usable. No external advertising action is performed.

## Safety invariants

- `generation_mode` remains `blueprint_only`.
- `external_actions_allowed` remains `false`.
- `budget_spend_allowed` remains `false`.
- Objective authority remains `DECISION_POLICY`.
- Readiness authority remains `READINESS_POLICY`.
- Unconfirmed Phase-one inputs remain `blocked`.
- AI output is advisory and cannot authorize launch.

## Verification

- TypeScript compilation: PASS.
- Production build: PASS.
- v3 fixture contract validation: PASS, 10/10.
- v5 golden HTTP regression: PASS, 10/10.
- Strategy Builder governance gate: PASS; explicit boolean opt-in is required and CDKS authority remains unchanged.
- Legacy rules parity: PASS.

## Next phase

Add a provider-backed integration test using a controlled mock or configured non-production provider, then add AI Reasoning as a separate advisory trace with claim/evidence validation. Do not connect any publish or spend operation until a later approval-gated integration phase.

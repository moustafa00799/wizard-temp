# Mock Controlled Provider Phase Report

## Scope

This phase adds a deterministic local provider for the opt-in AI Strategy Builder. It allows the real v5 request path to exercise proposal parsing, safe sanitization, failure handling, and governance without an API key, network call, advertising account, campaign publication, or budget spend.

## Supported scenarios

The `mockScenario` request option supports `baseline`, `override_attempt`, `malformed`, and `failure`. The baseline returns a valid Arabic or English proposal. The override scenario intentionally proposes changes to objective, budget, and publication so the sanitizer can reject them. The malformed scenario returns an invalid proposal shape and must fail closed. The failure scenario simulates provider unavailability and must preserve the deterministic CDKS output.

## Request example

```json
{
  "input": { "...": "canonical Wizard input" },
  "ai_strategy_builder": {
    "enabled": true,
    "provider": "mock",
    "mockScenario": "override_attempt"
  }
}
```

## Governance invariants

CDKS remains authoritative for objective, funnel, channels, readiness, warnings, budget, and the canonical Blueprint. AI output is recorded as advisory strategy trace data only. Any proposal containing governed override terms is moved to `rejected_changes`. Invalid or failed provider output produces a failed trace while the v3 contract remains valid. External actions and budget spending remain disabled.

## Verification

The following checks passed: Mock Provider governance for all four scenarios, v5 Strategy Builder governance, ten-case v5 golden HTTP regression, phase-one fixture validation, v3 fixture validation, data-contract audit, legacy rules parity, TypeScript compilation, and production build.

## Next phase

Add AI Reasoning as a separate advisory trace. It should receive the canonical input, CDKS decisions, readiness, warnings, and Strategy Builder proposal, and return claim/evidence pairs with confidence and limitations. It must not mutate decisions or authorize external actions.

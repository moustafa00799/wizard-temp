# Non-production AI Provider Setup

## Scope

This integration is limited to `blueprint_only`. The AI Strategy Builder is proposal-only, while CDKS remains authoritative for objective, funnel, channels, readiness, warnings, and safety gates. No adapter can publish a campaign or spend budget.

## Local environment

Create `.env.local` in the repository root. Keep the real values on the local machine only and never commit this file.

```env
AI_STRATEGY_PROVIDER=groq
AI_STRATEGY_FALLBACK_PROVIDER=mistral
AI_BENCHMARK_PROVIDER=gemini
AI_PROVIDER_MODE=nonprod
AI_BENCHMARK_ENABLED=true
AI_DATA_POLICY=anonymized_fixtures_only

GROQ_API_KEY=your_local_groq_key
MISTRAL_API_KEY=your_local_mistral_key
GEMINI_API_KEY=your_local_google_ai_studio_key
```

The implementation accepts model overrides without changing code:

```env
GROQ_STRATEGY_MODEL=openai/gpt-oss-120b
MISTRAL_STRATEGY_MODEL=mistral-small-latest
GEMINI_BENCHMARK_MODEL=gemini-2.5-flash
```

## Provider behavior

Groq is the primary strategy provider. For retryable failures such as timeout, rate limit, network failure, or provider-side 5xx errors, the request may be retried through Mistral. Authentication and schema failures are fail-closed and are not silently retried. Gemini is benchmark-only and requires both an anonymized fixture marker and `benchmark: true` in the opt-in request.

Every successful or failed provider attempt records sanitized provenance including provider, model, endpoint, structured-output mode, schema hash, prompt version, policy version, latency, token usage when returned, and fallback metadata. Raw prompts, completions, and API keys are never written to the benchmark report.

## Local checks

The deterministic checks do not require provider keys:

```bash
npm run build
npm run test:strategy:gate
npm run test:strategy:mock
npm run test:fixtures:phase1
npm run test:fixtures:v3
npm run test:api:v5
```

The live benchmark is opt-in and requires the local development server to be running with `.env.local` loaded:

```bash
npm run dev -- -p 3001
npm run test:ai:providers -- --live
```

To test one provider only:

```bash
npm run test:ai:providers -- --live --provider=groq
```

The script runs the ten anonymized fixtures, checks the v3 envelope, verifies CDKS and readiness authority, verifies both safety gates, requires a completed proposal, and writes only sanitized metadata to `tests/results/ai-provider-benchmark-v1.json`. That output directory is ignored by Git.

## Expected safety invariants

The following values must remain unchanged in every response:

```json
{
  "generation_mode": "blueprint_only",
  "validation": {
    "external_actions_allowed": false,
    "budget_spend_allowed": false
  },
  "decisions": {
    "objective": { "authority": "DECISION_POLICY" },
    "funnel": { "authority": "DECISION_POLICY" },
    "channels": { "authority": "DECISION_POLICY" }
  },
  "readiness": { "authority": "READINESS_POLICY" }
}
```

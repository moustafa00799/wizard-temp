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

The implementation accepts model and timeout overrides without changing code:

```env
GROQ_STRATEGY_MODEL=openai/gpt-oss-120b
MISTRAL_STRATEGY_MODEL=mistral-small-latest
GEMINI_BENCHMARK_MODEL=gemini-3.6-flash
GROQ_AI_TIMEOUT_MS=15000
MISTRAL_AI_TIMEOUT_MS=30000
GEMINI_AI_TIMEOUT_MS=45000
```

## Provider behavior

Groq is the primary strategy provider. For retryable failures such as timeout, rate limit, network failure, or provider-side 5xx errors, the request may be sent through Mistral. Authentication, not-found, quota, and structured-schema failures are fail-closed and are not silently retried. Gemini is benchmark-only and requires both an anonymized fixture marker and `benchmark: true` in the opt-in request.

Groq uses a provider-specific strict wire schema that omits array-size annotations such as `maxItems`, because Groq Structured Outputs supports a JSON Schema subset. The canonical proposal is still validated locally by Zod with the `maxItems` limits after the provider response is parsed. Groq provenance therefore records the hash of the exact Groq wire schema, while Mistral and Gemini retain the canonical schema hash. This is a compatibility hardening measure, not a relaxation of CDKS governance or output validation.

Every successful or failed provider attempt records sanitized provenance including provider, model, endpoint, structured-output mode, schema hash, prompt version, policy version, latency, token usage when returned, request id when supplied, failure category, HTTP status, error code, retryability, retry-after delay, and fallback metadata. Raw prompts, completions, response bodies, and API keys are never written to the benchmark report.

The supported failure categories are:

| Category | Meaning | Default retry/fallback behavior |
|---|---|---|
| `configuration` | Required local key is absent | No retry |
| `auth` | Key or authentication rejected | No retry |
| `not_found` | Endpoint or model was not found | Stop benchmark provider |
| `rate_limited` | HTTP 429 or provider rate limit | Fallback in route; stop benchmark provider |
| `quota` | Daily or account quota unavailable | No automatic retry |
| `schema_rejected` | Structured output or JSON schema rejected | No retry |
| `server` | HTTP 5xx | Fallback in route; benchmark records failure |
| `timeout` | Local or upstream request timeout | Fallback in route; benchmark records failure |
| `network` | Network or fetch failure | Fallback in route; benchmark records failure |
| `unknown` | Unclassified provider failure | Fail-closed |

## Safe benchmark controls

The benchmark is deliberately sequential. Its default intervals are one request every 20 seconds for Groq, 15 seconds for Mistral, and 15 seconds for Gemini. These are conservative diagnostic defaults, not claims about the providers' official limits. A provider run stops after the first `rate_limited` or `not_found` result so that a known limit or configuration error does not consume the remaining daily quota.

The controls can be overridden locally for a controlled test:

```env
AI_BENCHMARK_GROQ_INTERVAL_MS=20000
AI_BENCHMARK_MISTRAL_INTERVAL_MS=15000
AI_BENCHMARK_GEMINI_INTERVAL_MS=15000
AI_BENCHMARK_STOP_ON_RATE_LIMIT=true
AI_BENCHMARK_STOP_ON_NOT_FOUND=true
AI_BENCHMARK_MAX_CASES=0
```

`AI_BENCHMARK_MAX_CASES=0` means all ten fixtures; set it to `1`, `3`, or another small number for smoke tests. For a safe resume after a provider limit, set `AI_BENCHMARK_FIXTURES` to one or more exact fixture filenames, for example `AI_BENCHMARK_FIXTURES=EX-003_local-service-calls.json`; the filter is applied before `AI_BENCHMARK_MAX_CASES`. Do not reduce the intervals unless the provider dashboard confirms sufficient headroom.

## Local checks

The deterministic checks do not require provider keys:

```bash
npm run build
npm run test:strategy:gate
npm run test:strategy:mock
npm run test:fixtures:phase1
npm run test:fixtures:v3
npm run test:api:v5
npm run test:provider:schema
npm run test:ai:providers
```

The schema regression check is deterministic and makes no external requests. It verifies that Groq receives the compatibility wire schema while the canonical limits remain present for Mistral and Gemini. The last benchmark command without `--live` is safe and makes no external requests.

The live benchmark is opt-in and requires the local development server to be running with `.env.local` loaded:

```bash
npm run dev -- -p 3001
```

Use a smoke test first:

```bash
$env:AI_BENCHMARK_MAX_CASES="1"
npm run test:ai:providers -- --live --provider=groq
```

Then test Mistral and Gemini separately:

```bash
$env:AI_BENCHMARK_MAX_CASES="1"
npm run test:ai:providers -- --live --provider=mistral
npm run test:ai:providers -- --live --provider=gemini
```

Only after the smoke tests pass should the full ten-fixture run be attempted:

```bash
$env:AI_BENCHMARK_MAX_CASES="0"
npm run test:ai:providers -- --live --provider=groq
```

The script checks the v3 envelope, verifies CDKS and readiness authority, verifies both safety gates, requires a completed proposal for a pass, and writes only sanitized metadata to `tests/results/ai-provider-benchmark-v1.json`. That output directory is ignored by Git.

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

## Deterministic 429 fallback regression

The local regression command below does not call any external provider and does not require API keys:

```bash
npm run test:provider:fallback
```

It injects a deterministic Groq `429 rate_limited` result followed by a successful Mistral result and asserts that the Strategy Builder records `fallbackFrom: "groq"`, `fallbackReason: "429"`, `strategyProvider: "mistral"`, and a completed advisory trace. It also verifies that `blueprint_only`, `DECISION_POLICY`, and `READINESS_POLICY` remain unchanged. This regression complements the live benchmark evidence from `EX-002` and prevents future changes from bypassing the governed fallback path.

A live `429` is not treated as a successful direct Groq generation. It is recorded as a provider rate-limit event, while a successful Mistral response is recorded explicitly as fallback provenance.

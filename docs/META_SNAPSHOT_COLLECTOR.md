# Meta Snapshot Collector

## Purpose

`MetaSnapshotCollector` is a read-only collection core for the two approved Meta ad accounts:

- `act_1259153761545048` — Nadia Ahmed
- `act_809145896791225` — شروق عبدالله / Deega

Every other connected account is rejected by the request contract. The collector does not create, update, pause, delete, publish, or change budgets, audiences, ads, ad sets, or campaigns.

## Boundary

The collector is an injected-client boundary. It does not contain Meta credentials and does not call a browser, cookies, or arbitrary URLs. A production adapter must implement `MetaApiClient.fetchInsightsPage` using an approved Meta Marketing API OAuth connection and must keep its token in a server-side secret store.

The current repository commit provides the deterministic collection core, in-memory store for tests, and a server-only file store suitable for local development or controlled single-host operation. For autoscaled production, replace the file store with a database/object-storage implementation that satisfies `MetaSnapshotStore`; do not rely on an ephemeral application filesystem for durable evidence.

## Collection lifecycle

1. Validate the account allowlist, date range, object level, fields, and one optional breakdown.
2. Compute a stable query hash excluding the page cursor.
3. Return a complete cached collection when the same query is already complete.
4. Read a persisted checkpoint when a previous collection stopped at a page cursor.
5. Execute requests through a serial queue.
6. Follow `nextPageCursor` and persist a checkpoint after every successful page.
7. Store a redacted raw snapshot with status, response code, allowlisted operational headers, row count, query identity, and capture time.
8. Retry only transient/rate-limit/server responses using exponential backoff plus jitter.
9. Open a per-account circuit after the configured threshold and stop calls until cooldown.
10. Return `partial`, `rate_limited`, `circuit_open`, or `failed` explicitly instead of replacing missing data with zero.
11. Convert usable rows to an Evidence Package with explicit scope and unavailable facts for fields not returned.

## Rate-limit policy

The collector does not immediately retry a Meta throttling response outside its configured retry policy. It keeps the requested query narrow, uses one breakdown per job, and lets the caller schedule later work. It should be paired with an adapter that captures Meta usage/reset headers when the official API exposes them.

The default test policy is conservative but configurable: three retries, exponential backoff from one second up to one minute, a 15-minute circuit cooldown, and a maximum of 100 pages per collection. These are application policy defaults, not guarantees or limits published by Meta.

For large historical Insights reports, use Meta's asynchronous Insights job flow in the adapter, persist the report-run status, and fetch the completed result through the same snapshot and validation boundary. Do not keep report-run identifiers as permanent source identifiers.

## Raw data and secrets

Raw snapshots contain only the response payload and an allowlisted subset of operational headers. Authorization, cookies, and arbitrary headers are discarded before persistence. The application must never place tokens in snapshots, logs, fixtures, prompts, or Git.

A raw snapshot is not automatically a market fact. Account delivery data is client-owned observational evidence. Its scope must include account, date range, currency, timezone, objective/level, and any breakdown. It must not be used as a general CPC, CPA, ROAS, saturation, or industry benchmark without a separately designed representative study.

## Evidence Package semantics

`buildMetaEvidencePackage` emits supported additive facts such as impressions, reported clicks, inline link clicks, spend, action totals, and a weighted CTR computed only from returned rows. It does not aggregate CPC, CPM, ROAS, reach, or frequency across rows. Unsupported or missing fields are explicit `unavailable` facts with reasons.

The caller must provide the market and industry scope explicitly. Names such as a campaign or page are not sufficient to infer an industry. If the industry has not been reviewed, use an explicit value such as `unclassified` and retain the limitation. The package remains account-scoped and is not `Market-Validated`.

## Test command

```bash
npm run test:knowledge:meta-collector
```

The regression suite uses deterministic mock responses only. It covers account allowlisting, pagination and checkpoints, cache idempotency, serial queue behavior, exponential backoff, circuit breaking, non-retryable errors, header redaction, filesystem round trips, and Evidence Package fail-closed semantics.

## References

[1]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting "Marketing API Rate Limiting | Meta for Developers"
[2]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices "Limits and Best Practices | Meta for Developers"

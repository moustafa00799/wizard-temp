# Easy Orders Private Import — 2026-08-27

## Status

The Easy Orders export was successfully normalized and merged into a private SQLite workspace as first-party client-owned operational evidence. The import is scoped to **Egypt (`EG`)**, **Egyptian pound (`EGP`)**, Arabic locale, and a provisional `ecommerce_general` industry label. The industry label is operational only and remains subject to taxonomy review; it is not a market-validation assertion.

The source is registered as `client_data` with `licenseStatus=restricted`. The resulting evidence package is intentionally `limited`, not `ready`, because the data is private account-owned evidence and contains unresolved payment, delivery, refund, and product-taxonomy gaps.

## Inputs and safe aggregate results

| Input | Result |
|---|---:|
| Easy Orders order export | 1,088 unique orders, 0 duplicate IDs |
| Order period | 2023-10-15 through 2024-08-27 |
| Raw status values | 1,087 `pending`, 1 `canceled` |
| Payment method | 1,088 cash-on-delivery rows |
| Recorded order value | EGP 1,153,388; recorded value, not realized revenue |
| Recorded product cost | EGP 1,115,518 |
| Recorded shipping cost | EGP 37,870 |
| Product catalog | 25 unique products, 21 variants, 5 variations |
| Category export | 22 rows; taxonomy requires review |
| Product category signal | 24 products with a category signal, 1 without one |
| Reviews | 75 unique reviews across 19 products |
| UTM coverage | 541 rows with UTM source and campaign, approximately 49.7% |

The owner supplied the following aggregate outcome information on 2026-08-27: 65% delivered and collected, 12% returned, and 23% unresolved or not accepted. These values sum to 100%, but they are stored as **directional owner-reported rates** and are not assigned to individual order IDs because the export has no row-level delivery, collection, or return status.

## Taxonomy policy

The original Easy Orders category signals are preserved as supplied. The import does not overwrite them and does not claim that they are correct. A future classification pass may create a separate `proposedCategory` with confidence, method, evidence product ID, and `reviewStatus=unreviewed`. Ambiguous products must remain `unclassified` or `mixed` rather than being forced into an unsupported category.

## Evidence and strategy boundaries

The import supports first-party operational facts such as recorded order count, recorded order value, product cost, shipping cost, catalog size, review count, order-status distribution, COD share, and UTM coverage. It does not prove general market demand, competitor performance, CPC, CPA, ROAS, market size, or market saturation.

`Realized revenue`, `refund amount`, row-level `payment status`, `ROAS`, and `CPA` are represented as unavailable because the export does not provide verified row-level payment/delivery/refund linkage or verified ad-spend linkage. `Total Cost` is therefore not relabeled as collected revenue.

The import does not create or modify a Canonical Blueprint. It is not sent to live AI in raw form. Customer names, phones, addresses, notes, review text, product text, payment references, credentials, cookies, and raw rows are omitted from the normalized artifact and the SQLite payload. The private SQLite database, normalized artifact, source files, and merge manifest remain under `.local/private-research/` and are excluded from Git.

## Replay and verification

The merge runner is replay-idempotent. Running it twice on the same sanitized artifact leaves one source record, one source version, one snapshot, one snapshot revision, one limited evidence package, and one evidence link. Conflict detection fails closed if the same source or package key later resolves to different content.

The private regression verifies 39 assertions, including source scope, `EG/EGP`, limited package status, owner-rate semantics, unavailable revenue/ROAS facts, absent raw rows and PII keys, no credentials, no market validation, and no Canonical Blueprint mutation.

## Reproduction commands

The raw exports must first be placed in the ignored local directory `.local/private-research/easy-orders/inputs/` using the filenames expected by the collector. Then run:

```bash
npm run knowledge:easy-orders:normalize
npm run knowledge:easy-orders:merge
npm run test:knowledge:easy-orders:private
```

The normalizer uses SHA-256 references for the input files. The merge stores only aggregate, sanitized evidence and provenance; it does not store the source rows.

## Remaining gaps

The next data-quality improvement is a row-level export containing delivery, collection/payment, refund/return, cancellation, and currency fields. The current UTM fields are present for only part of the export and no click IDs were verified. Product taxonomy remains a review queue. Easy Orders is a first-party store source and does not replace the deferred GA4, Search Console, Google Ads `9397976723`, or Meta workstreams.

# Provider Knowledge Import

## Purpose

This document describes the additive provider-neutral path for importing official read-only collections from Google Ads, TikTok for Business, and Google Analytics 4 into the Knowledge Layer. It does not change CDKS authority, the Canonical Blueprint, campaign state, budget state, or external publishing. The layer remains `blueprint_only`, with AI proposing and CDKS deciding.

## Accepted provider collections

| Provider | Collection examples | Evidence dimensions | Current policy |
|---|---|---|---|
| Google Ads | campaign, ad group/ad, device, geographic view, detail placement, keyword view | campaign/ad group/ad IDs, channel type/subtype, bidding strategy, status, device, country criterion ID, placement/network, keyword and match type | Read-only GAQL; segmented reports remain separate from unsegmented totals |
| TikTok for Business | campaign, ad group, ad, country, performance report, time-window report | advertiser/campaign/ad group/ad IDs, ad text, format, destination, pixel, optimization event, status, country, spend, impressions, clicks, conversions | Read-only GET/report; empty results are recorded as empty, never as zero performance |
| Google Analytics 4 | property traffic acquisition | property/account scope, channel group, sessions, engaged sessions, events, key events, revenue | Read-only UI report/export; no ad spend or ROAS is inferred |

## Scope and attribution

A collection is usable only when its account or property scope is explicitly verified for the project. Collections with `scopeStatus=unverified` may be retained in the external raw archive and collection manifest, but the adapter deliberately removes their rows before constructing an Evidence Package. This prevents an accessible account from being mistaken for a project-owned account.

Industry and market are not treated as verified merely from account names, campaign names, landing pages, keywords, or language. However, the additive content-classification layer may use these fields to produce **inferred candidates** at campaign, ad-group, ad, account, or property level. Each candidate preserves the source signal IDs, matched terms, confidence, deterministic method, and `reviewStatus=unreviewed`. A candidate can organize exploration and suggest an Industry Profile, but it does not establish account ownership, project scope, legal registration, market scope, or Market-Validated status. Content-derived market candidates are never accepted as scope verification by the contract. The current provider samples therefore retain `industry=unclassified` in usable Evidence Package scope until a human review or an independent official scope record is supplied. Country criterion IDs are retained as official identifiers when a provider does not return a country name; no country name is guessed.

The deterministic content classifier is intentionally conservative: campaign-level labels may differ within one account, in which case the account is marked `mixed_or_multi_industry` rather than forced into one profile. A candidate requires review before it is attached to an Industry Profile or used as the `industry` field of an Evidence Package. This preserves the distinction between an operational classification hint and a supported knowledge claim.

## Metric policy

The adapter emits only values that are safe to add within the exact returned non-overlapping scope. Google Ads `cost_micros` is normalized to account currency units. TikTok `spend` is retained in advertiser currency. GA4 revenue is retained only when the property report provides it. CTR is computed only as a weighted ratio from the same returned rows and is not treated as a benchmark.

The adapter does not manufacture or aggregate unsafe fields. The following remain `unavailable` unless an explicitly compatible official collection is supplied: reach across overlapping reports, frequency across overlapping reports, CPC/CPM/ROAS benchmarks, incremental lift, cross-property attribution, and general market saturation. Device, placement, country, keyword, ad, and campaign reports must not be summed with each other or with an unsegmented report without an explicit entity-and-scope deduplication rule.

## Current external evidence state

The current private merge uses the normalized Google Ads artifact for customers `4282900193` and `6899137548`, plus the normalized TikTok artifact for four advertisers: `7215064338044944385`, `7302642673201119233`, `7304560039707328514`, and `7556312373204795409`. The Google account `4282900193` remains mixed and unreviewed at account level; `6899137548` is user-confirmed as an Egyptian home-maintenance activity, but its SAR account currency is retained as account metadata and is not used as market evidence. Google customer `9397976723` remains deferred after `USER_PERMISSION_DENIED` and is not retried without a new authorization. TikTok remains unmapped for market and industry in this merge. The second TikTok authorization exposed two overlapping advertisers, zero unique advertisers, and zero new collections; it is retained as a separate access record without copying the overlapping data.

The private SQLite merge persisted **6 provider accounts, 8 read-only connections, 28 sanitized provider collections, 6 provider snapshots, 6 snapshot revisions, 2 restricted source records, and 1 deferred source record**. Collections are stored with `rows=[]`, raw-row counts and hashes/provenance only; creative text, URLs, phone fields, credentials, and raw provider responses are not persisted in the merged database. The merge intentionally created **0 Evidence Packages**, keeps `marketValidated=false`, and does not enter the provider-only snapshots into Strategy Context. The database and manifest are local ignored artifacts under `.local/private-research/knowledge-merge/`; raw archives remain outside Git.

## Verification gates

Before any provider collection is imported as usable evidence, the ingestion process must validate the provider, account/property ID, report type, date window, currency/timezone when present, field mask or dimensions/metrics, request ID or export metadata, row count, and query hash. The raw response is stored outside Git with a checksum. The Evidence Package must preserve source IDs, limitations, unknowns, and freshness state.

A provider package cannot set `marketValidated=true` from account data. Market-Validated requires independent, dated, scope-specific market evidence from an accepted external source. No benchmark is created from the accounts in this project.

## Tests

The deterministic `test:knowledge:providers` regression covers Google Ads currency normalization, TikTok country facts, GA4 metrics, segmented facts, missing collections, and unverified-scope fail-closed behavior. The private merge is replayed with `npm run knowledge:merge:private-provider-evidence`; the replay must preserve the counts and hashes, keep all provider connections read-only, persist no rows or forbidden creative/URL/phone fields, create zero packages, and leave `marketValidated=false`. Database regressions additionally reject conflicting source or provider-collection content instead of silently ignoring it. Existing Knowledge, Meta, Blueprint parity, and build checks remain required after provider changes.

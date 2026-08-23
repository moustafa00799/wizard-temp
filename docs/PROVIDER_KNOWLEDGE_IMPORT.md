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

The external archive contains official account-owned collections captured on 2026-08-23. Google Ads collections include campaign context, monthly reports, device reports, geographic views, ad/creative reports, detail-placement samples, and keyword views for customers `4282900193` and `5805554566`. TikTok collections include campaign/ad metadata and performance reports for the discovered advertisers; `Mr Moustafa`, `Plan B0327`, and `windoor solutions` remain separate candidates until project ownership is confirmed, while the Deega advertiser returned successful empty reports and is not labeled zero-performance. GA4 currently has a verified UI observation for Enfrad property `471345574` and an empty report observation for property `466390867` for the displayed 28-day window.

The external build manifest is `/home/ubuntu/multiplatform_evidence_packages.json`; raw collections remain outside Git. Its fail-closed output is expected until account/property ownership is explicitly confirmed: unverified Google/TikTok collections have no usable rows in their Evidence Packages, while verified GA4 Enfrad data can produce a property-scoped package. This is intentional and is not a data-loss signal.

## Verification gates

Before any provider collection is imported as usable evidence, the ingestion process must validate the provider, account/property ID, report type, date window, currency/timezone when present, field mask or dimensions/metrics, request ID or export metadata, row count, and query hash. The raw response is stored outside Git with a checksum. The Evidence Package must preserve source IDs, limitations, unknowns, and freshness state.

A provider package cannot set `marketValidated=true` from account data. Market-Validated requires independent, dated, scope-specific market evidence from an accepted external source. No benchmark is created from the accounts in this project.

## Tests

The deterministic `test:knowledge:providers` regression covers Google Ads currency normalization, TikTok country facts, GA4 metrics, segmented facts, missing collections, and unverified-scope fail-closed behavior. Existing Knowledge, Meta, Blueprint parity, and build checks remain required after provider changes.

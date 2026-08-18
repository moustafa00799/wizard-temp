# Phase-one fixture inventory

## Purpose

This directory separates source material by role so output parity is not confused with input coverage.

| Directory | Contents | Intended use |
|---|---|---|
| `recovered-ui-profiles/` | The three profiles recovered from `wizard-ui/src/lib/dev-autofill.ts` | Full Wizard autofill and end-to-end UI scenarios |
| `reference-blueprints/` | Ten JSON blueprints from `campaign-engine/dashboard_data/` | Expected-output/reference comparison against the legacy engine |
| `legacy-input/` | The legacy `campaign-engine/examples/sampleInput.json` | Contract and migration comparison |
| `legacy-v1/` | Existing copied rule fixtures | Rule parity regression |
| `wizard-inputs-v1/` | Ten normalized 41-field Wizard inputs with `expected_v3` metadata | Phase-one contract, decision, readiness, warning, and provenance regression |

## Recovered profile count

The former `wizard-ui` repository currently contains three development profiles, not ten. They are the e-commerce skincare, local home service, and B2B HR/payroll SaaS profiles. The autofill utility cycles through them; it does not generate random business data.

## Ten-scenario coverage

The ten scenario names in `reference-blueprints/manifest.json` are `ecommerce`, `b2b`, `local_service`, `app`, `education`, `retargeting`, `testing`, `multichannel`, `awareness`, and `high_risk`. These files are generated blueprints and therefore should be treated as expected-output fixtures, not as authoritative Wizard input records.

The ten semantic cases `GD-001` through `GD-010` remain defined in `scripts/semantic-runner.ts`. The normalized fixtures now also contain `expected_v3` records for objective, funnel, readiness before/after confirmation, warnings, decision authority, provenance, and Phase-one safety gates. The semantic cases remain intentionally minimal decision-regression inputs and should be expanded against the v3 contract in the next test phase.

## Missing material

Seven additional complete Wizard input profiles are not present in the recovered `wizard-ui` history. They should not be fabricated and treated as historical truth. They can be created later as explicitly labeled synthetic/anonymized fixtures after the product owner approves their business assumptions and expected decisions.

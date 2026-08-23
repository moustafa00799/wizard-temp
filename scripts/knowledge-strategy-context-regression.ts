import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { canonicalizeWizardInput } from "../src/lib/contracts/wizard-input";
import { buildBlueprintContractV3 } from "../src/lib/contracts/build-blueprint-contract-v3";
import { CDKSEngine } from "../src/lib/orchestrator/cdks-engine";
import { buildAIStrategyProposal } from "../src/lib/ai-strategy-builder";
import {
  buildScopedStrategyContext,
  buildStrategyRecommendation,
} from "../src/lib/knowledge/strategy-context";
import type { ScopedStrategySelection } from "../src/lib/contracts/knowledge-strategy-context";
import { MarketEvidenceSnapshotSchema } from "../src/lib/contracts/knowledge";
import { selectedMarketStrategySelections } from "../tests/fixtures/knowledge/selected-market-strategy-fixtures";
import { POST as generateV5 } from "../src/app/api/generate/v5/route";

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests/fixtures/wizard-inputs-v1", name), "utf8"));
}

function minimalSnapshot(market: "EG" | "SA", industry: string, currency: "EGP" | "SAR", freshnessStatus: "fresh" | "missing") {
  return MarketEvidenceSnapshotSchema.parse({
    contractVersion: "1.0",
    snapshotId: `snapshot-regression-${market.toLowerCase()}-${industry}-${freshnessStatus}`,
    market,
    industry,
    locale: "ar",
    currency,
    capturedAt: "2026-08-23T22:30:00+03:00",
    freshnessStatus,
    facts: [],
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns: freshnessStatus === "missing" ? ["No independent evidence was supplied for this scope."] : ["D3 remains incomplete for this deterministic gate case."],
    contradictions: [],
    sourceIds: [],
    confidence: 0,
    limitations: ["Regression-only redacted scope fixture."],
  });
}

function decision(selection: ScopedStrategySelection, overrides: Partial<ScopedStrategySelection["validationDecision"]>) {
  return { ...selection.validationDecision, ...overrides };
}

async function main() {
  const engine = new CDKSEngine();
  const ecommerceFixture = readFixture("EX-001_ecommerce-sales.json");
  const educationFixture = readFixture("EX-005_education-leads.json");
  const ecommerceInput = canonicalizeWizardInput((ecommerceFixture as { input: unknown }).input);
  const educationInput = canonicalizeWizardInput((educationFixture as { input: unknown }).input);
  const ecommerceBlueprint = await engine.generate(ecommerceInput);
  const educationBlueprint = await engine.generate(educationInput);
  const ecommerceBefore = JSON.stringify(ecommerceBlueprint);
  const educationBefore = JSON.stringify(educationBlueprint);
  const ecommerceContract = buildBlueprintContractV3(ecommerceInput, ecommerceBlueprint, ecommerceFixture as { _fixture?: { scenario_id?: unknown; assumptions?: unknown[]; output_language?: unknown; currency?: unknown } });

  const contexts = selectedMarketStrategySelections.map((selection) => buildScopedStrategyContext(selection));
  assert.deepEqual(contexts.map((context) => `${context.market}/${context.industry}`), [
    "SA/ecommerce_general",
    "EG/education",
    "SA/education",
  ]);
  for (const context of contexts) {
    assert.equal(context.scopedMarketValidated, true);
    assert.equal(context.globalMarketValidated, false);
    assert.equal(context.dataPolicy.rawReportsIncluded, false);
    assert.equal(context.dataPolicy.accountOwnedPerformanceMayBeUsedAsMarketBenchmark, false);
    assert.ok(context.evidenceSourceIds.length >= 3);
    assert.ok(context.unavailableBenchmarkCategories.includes("cpc"));
    assert.ok(context.unavailableBenchmarkCategories.includes("roas"));
    assert.ok(context.limitations.some((item) => item.includes("global Market Validation")));
  }

  const saEcommerce = contexts[0];
  const saEcommerceRecommendation = buildStrategyRecommendation(ecommerceInput, ecommerceBlueprint, saEcommerce);
  assert.equal(saEcommerceRecommendation.status, "advisory_only");
  assert.equal(saEcommerceRecommendation.governance.generationMode, "blueprint_only");
  assert.equal(saEcommerceRecommendation.governance.externalActionsAllowed, false);
  assert.equal(saEcommerceRecommendation.governance.budgetSpendAllowed, false);
  assert.equal(saEcommerceRecommendation.governance.canMutateCdks, false);
  assert.equal(saEcommerceRecommendation.governance.canChangeCanonicalBlueprint, false);
  assert.equal(saEcommerceRecommendation.governance.requiresHumanApproval, true);
  assert.equal(saEcommerceRecommendation.governance.globalMarketValidated, false);
  assert.ok(saEcommerceRecommendation.evidenceRefs.some((ref) => ref.includes("sa-ecommerce")));
  assert.ok(saEcommerceRecommendation.limitations.some((item) => item.includes("CPC, CPA, CVR, ROAS")));
  assert.equal(/(?:CPC|CPA|CVR|ROAS|saturation)\s*[:=]\s*\d/i.test(JSON.stringify(saEcommerceRecommendation)), false);

  const routeResponse = await generateV5(new NextRequest("http://localhost/api/generate/v5", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...(ecommerceFixture as object),
      knowledge_strategy_selection: selectedMarketStrategySelections[0],
      ai_strategy_builder: { enabled: false },
    }),
  }));
  const routeBody = await routeResponse.json() as { status: string; data?: { strategy: { status: string; limitations: string[] }; decisions: { objective: { value: string } } } };
  assert.equal(routeResponse.status, 200);
  assert.equal(routeBody.status, "success");
  assert.equal(routeBody.data?.strategy.status, "not_requested");
  assert.equal(routeBody.data?.decisions.objective.value, "sales");
  assert.ok(routeBody.data?.strategy.limitations.some((item) => item.includes(saEcommerce.contextId)));

  const educationRecommendations = contexts.slice(1).map((context) => buildStrategyRecommendation(educationInput, educationBlueprint, context));
  for (const [index, recommendation] of educationRecommendations.entries()) {
    assert.equal(recommendation.industry, "education");
    assert.equal(recommendation.status, "advisory_only");
    assert.equal(contexts[index + 1].industryProfile.status, "matched");
    assert.equal(contexts[index + 1].industryProfile.profileStatus, "draft");
    assert.ok(recommendation.limitations.some((item) => item.includes("matched IndustryProfile is draft")));
    assert.ok(recommendation.requiredValidations.some((item) => item.includes("نوع التعليم")));
  }

  const trace = await buildAIStrategyProposal(ecommerceInput, ecommerceBlueprint, ecommerceContract, {
    enabled: false,
    knowledgeContext: saEcommerce,
  });
  assert.equal(trace.status, "not_requested");
  assert.ok(trace.limitations.some((item) => item.includes(saEcommerce.contextId)));
  assert.ok(trace.limitations.some((item) => item.includes("globalMarketValidated remains false")));

  const incompleteEgEcommerce: ScopedStrategySelection = {
    ...selectedMarketStrategySelections[0],
    packageId: "market-selected-eg-ecommerce-regression",
    market: "EG",
    snapshot: minimalSnapshot("EG", "ecommerce_general", "EGP", "fresh"),
    validationDecision: {
      ...selectedMarketStrategySelections[0].validationDecision,
      packageId: "market-selected-eg-ecommerce-regression",
      market: "EG",
      marketValidated: false,
      dimensions: { D1: "ready", D2: "ready", D3: "partial", D4: "ready", D5: "partial", D6: "unavailable" },
      blockers: ["D3_incomplete", "D6_paid_media_benchmark_unavailable"],
      reason: "D3 is incomplete in this regression case.",
    },
  };
  const incompleteContext = buildScopedStrategyContext(incompleteEgEcommerce);
  assert.equal(incompleteContext.scopedValidationStatus, "market_context_ready");
  assert.equal(incompleteContext.scopedMarketValidated, false);
  assert.ok(incompleteContext.limitations.some((item) => item.includes("D3_incomplete")));

  const partialSaLocal: ScopedStrategySelection = {
    packageId: "market-selected-sa-local-service-regression",
    market: "SA",
    industry: "local_service",
    snapshot: minimalSnapshot("SA", "local_service", "SAR", "fresh"),
    evidenceIds: [],
    validationDecision: {
      gateVersion: "market-validation-gate-v1",
      market: "SA",
      industry: "local_service",
      packageId: "market-selected-sa-local-service-regression",
      packageStatus: "limited",
      contextDecision: "partial",
      marketValidated: false,
      dimensions: { D1: "partial", D2: "missing", D3: "ready", D4: "partial", D5: "missing", D6: "unavailable" },
      blockers: ["D1_incomplete", "D2_incomplete", "D4_incomplete"],
      reason: "Direct local-service demand evidence remains incomplete.",
      independentSourceCount: 2,
    },
  };
  const partialContext = buildScopedStrategyContext(partialSaLocal);
  assert.equal(partialContext.scopedValidationStatus, "partial");
  assert.equal(partialContext.scopedMarketValidated, false);

  const unavailableEgLocal: ScopedStrategySelection = {
    packageId: "market-selected-eg-local-service-regression",
    market: "EG",
    industry: "local_service",
    snapshot: minimalSnapshot("EG", "local_service", "EGP", "missing"),
    evidenceIds: [],
    validationDecision: {
      gateVersion: "market-validation-gate-v1",
      market: "EG",
      industry: "local_service",
      packageId: "market-selected-eg-local-service-regression",
      packageStatus: "missing",
      contextDecision: "unavailable",
      marketValidated: false,
      dimensions: { D1: "missing", D2: "missing", D3: "missing", D4: "missing", D5: "missing", D6: "unavailable" },
      blockers: ["independent_source_count", "sources_independent"],
      reason: "No current independent official dataset was acquired for this scope.",
      independentSourceCount: 0,
    },
  };
  const unavailableContext = buildScopedStrategyContext(unavailableEgLocal);
  assert.equal(unavailableContext.scopedValidationStatus, "unavailable");
  assert.equal(unavailableContext.approvedFacts.length, 0);
  assert.equal(unavailableContext.scopedMarketValidated, false);

  assert.throws(() => buildScopedStrategyContext({
    ...selectedMarketStrategySelections[0],
    market: "EG",
  }), /Snapshot scope does not exactly match/);
  assert.equal(JSON.stringify(ecommerceBlueprint), ecommerceBefore);
  assert.equal(JSON.stringify(educationBlueprint), educationBefore);

  console.log(JSON.stringify({
    status: "PASS",
    scopes: ["SA/ecommerce_general", "EG/education", "SA/education"],
    assertions: 48,
    globalMarketValidated: false,
    liveAiCalled: false,
    canonicalBlueprintMutation: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

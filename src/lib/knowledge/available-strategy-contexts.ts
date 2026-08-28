import {
  ScopedStrategySelectionSchema,
  type ScopedStrategySelection,
} from "../contracts/knowledge-strategy-context";
import type { CanonicalWizardInput } from "../contracts/wizard-input";
import { MarketEvidenceSnapshotSchema } from "../contracts/knowledge";

export const AVAILABLE_STRATEGY_CONTEXT_IDS = ["shaaddesign-ga4-2023"] as const;
export type AvailableStrategyContextId = (typeof AVAILABLE_STRATEGY_CONTEXT_IDS)[number];

export type AvailableStrategyContextOption = {
  id: AvailableStrategyContextId;
  label: string;
  description: string;
  market: "SA";
  industry: "interior_design_and_decoration";
  currency: "SAR";
  status: "limited";
};

const SOURCE_ID = "shaaddesign-ga4-owner-attestation-20260827";
const SNAPSHOT_ID = "shaaddesign-ga4-restricted-snapshot-2023";
const PACKAGE_ID = "shaaddesign-ga4-restricted-package-2023";
const CAPTURED_AT = "2026-08-27T00:00:00.000Z";

const shaadDesignSnapshot = MarketEvidenceSnapshotSchema.parse({
  contractVersion: "1.0",
  snapshotId: SNAPSHOT_ID,
  market: "SA",
  industry: "interior_design_and_decoration",
  locale: "ar",
  currency: "SAR",
  capturedAt: CAPTURED_AT,
  freshnessStatus: "fresh",
  facts: [
    {
      factId: "shaaddesign-ga4-property-owner-confirmed",
      name: "GA4 Property scope owner-confirmed",
      value: true,
      unit: "boolean",
      status: "evidence_backed",
      sourceIds: [SOURCE_ID],
      observedAt: CAPTURED_AT,
      scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
    },
    {
      factId: "shaaddesign-ga4-site-owner-confirmed",
      name: "ShaadDesign site scope owner-confirmed",
      value: true,
      unit: "boolean",
      status: "evidence_backed",
      sourceIds: [SOURCE_ID],
      observedAt: CAPTURED_AT,
      scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
    },
    {
      factId: "shaaddesign-ga4-reporting-period-owner-confirmed",
      name: "GA4 reporting period owner-confirmed",
      value: "2023-01-01..2023-12-31",
      unit: "date_range",
      status: "evidence_backed",
      sourceIds: [SOURCE_ID],
      observedAt: CAPTURED_AT,
      scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
    },
    {
      factId: "shaaddesign-ga4-exact-period-performance",
      name: "Exact 2023 GA4 performance aggregates",
      value: null,
      status: "unavailable",
      sourceIds: [],
      unavailableReason: "Existing Drive aggregates contain mixed or overlapping ranges and were not safely assigned to the exact owner-confirmed 2023 period.",
      scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
    },
    {
      factId: "shaaddesign-ga4-reporting-timezone",
      name: "GA4 Reporting Time Zone",
      value: null,
      status: "unavailable",
      sourceIds: [],
      unavailableReason: "Not present in the currently retained sanitized export metadata.",
      scope: { market: "SA", industry: "interior_design_and_decoration", locale: "ar", currency: "SAR" },
    },
  ],
  competitorObservations: [],
  keywordSignals: [],
  seasonalitySignals: [],
  unknowns: [
    "This is private owner-attested evidence, not general market validation.",
    "Exact 2023 performance aggregates remain unavailable because existing exports have mixed or overlapping ranges.",
    "GA4-to-Google Ads conversion definitions are not supplied; CPA and ROAS remain unavailable.",
  ],
  contradictions: [],
  sourceIds: [SOURCE_ID],
  confidence: 0.7,
  limitations: [
    "Property 6262496156, site shd.sa, Saudi market, SAR, and the 2023 period were confirmed by the account administrator.",
    "Reporting Time Zone remains unavailable.",
    "This restricted context cannot establish market demand or paid-media benchmarks.",
    "Raw rows, event parameters, queries, URLs, customer identity, and credentials are omitted.",
  ],
});

const SHAAD_DESIGN_SELECTION: ScopedStrategySelection = ScopedStrategySelectionSchema.parse({
  packageId: PACKAGE_ID,
  market: "SA",
  industry: "interior_design_and_decoration",
  snapshot: shaadDesignSnapshot,
  evidenceIds: ["shaaddesign-ga4-scope-evidence-20260827"],
  validationDecision: {
    gateVersion: "market-validation-gate-v1",
    market: "SA",
    industry: "interior_design_and_decoration",
    packageId: PACKAGE_ID,
    packageStatus: "limited",
    contextDecision: "partial",
    marketValidated: false,
    dimensions: {
      D1: "ready",
      D2: "ready",
      D3: "partial",
      D4: "ready",
      D5: "unavailable",
      D6: "unavailable",
    },
    blockers: ["REPORTING_TIMEZONE_UNAVAILABLE", "EXACT_PERIOD_PERFORMANCE_UNAVAILABLE", "PAID_MEDIA_BENCHMARK_UNAVAILABLE"],
    reason: "Owner-confirmed scope is usable for a restricted advisory context, but exact-period performance and reporting timezone remain unavailable.",
    independentSourceCount: 1,
  },
});

const OPTIONS: readonly AvailableStrategyContextOption[] = [
  {
    id: "shaaddesign-ga4-2023",
    label: "ShaadDesign — السعودية — GA4 2023",
    description: "سياق خاص محدود لنشاط الديكور والتصميم الداخلي، وليس تحققًا عامًا للسوق.",
    market: "SA",
    industry: "interior_design_and_decoration",
    currency: "SAR",
    status: "limited",
  },
];

export function listAvailableStrategyContexts(): readonly AvailableStrategyContextOption[] {
  return OPTIONS;
}

export function getStrategyContextSelection(id: string): ScopedStrategySelection {
  if (id !== "shaaddesign-ga4-2023") throw new Error(`Unknown allowlisted strategy context: ${id}`);
  return SHAAD_DESIGN_SELECTION;
}

export function getStrategyContextOption(id: string): AvailableStrategyContextOption | undefined {
  return OPTIONS.find((option) => option.id === id);
}

function normalizedSearchText(values: unknown[]): string {
  return values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .trim()
    .toLowerCase();
}

/**
 * Selects a context only when the Wizard input proves the exact allowlisted scope.
 * This is intentionally conservative: generic Saudi activity does not match the
 * ShaadDesign context unless interior-design signals are present as well.
 */
export function getAutomaticallyMatchedStrategyContext(input: CanonicalWizardInput): ScopedStrategySelection | undefined {
  const locationText = normalizedSearchText(input.target_locations);
  const businessText = normalizedSearchText([
    input.business_type,
    input.offer_description,
    input.customer_problem,
    input.usp,
    input.core_message,
  ]);
  const saudiMatch = /(saudi|السعودية|سعودية|الرياض|جدة|الدمام)/i.test(locationText);
  const interiorDesignMatch = /(interior|decoration|decor|design|ديكور|تصميم داخلي|تصميم|أثاث|تشطيب)/i.test(businessText);

  return saudiMatch && interiorDesignMatch ? SHAAD_DESIGN_SELECTION : undefined;
}

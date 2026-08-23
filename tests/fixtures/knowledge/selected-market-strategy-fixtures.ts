import type { ScopedStrategySelection } from "../../../src/lib/contracts/knowledge-strategy-context";
import type { MarketEvidenceSnapshot } from "../../../src/lib/contracts/knowledge";

const CAPTURED_AT = "2026-08-23T22:30:00+03:00";

function snapshot(
  market: "EG" | "SA",
  industry: "ecommerce_general" | "education",
  currency: "EGP" | "SAR",
  snapshotId: string,
  facts: MarketEvidenceSnapshot["facts"],
  sourceIds: string[],
  unknowns: string[],
  limitations: string[],
): MarketEvidenceSnapshot {
  return {
    contractVersion: "1.0",
    snapshotId,
    market,
    industry,
    locale: "en",
    currency,
    capturedAt: CAPTURED_AT,
    freshnessStatus: "fresh",
    facts,
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns,
    contradictions: [],
    sourceIds,
    confidence: 0.78,
    limitations,
  };
}

function fact(
  factId: string,
  name: string,
  value: string | number | boolean,
  unit: string | undefined,
  sourceIds: string[],
  observedAt: string,
  market: "EG" | "SA",
  industry: "ecommerce_general" | "education",
  currency: "EGP" | "SAR",
): MarketEvidenceSnapshot["facts"][number] {
  return {
    factId,
    name,
    value,
    ...(unit ? { unit } : {}),
    status: "evidence_backed",
    sourceIds,
    observedAt,
    scope: { market, industry, locale: "en", currency },
  };
}

function unavailableBenchmark(
  market: "EG" | "SA",
  industry: "ecommerce_general" | "education",
  currency: "EGP" | "SAR",
  factId: string,
): MarketEvidenceSnapshot["facts"][number] {
  return {
    factId,
    name: "paid_media_benchmark",
    value: null,
    status: "unavailable",
    sourceIds: [],
    unavailableReason: `No independent source in the current package explicitly measures ${market} ${industry} CPC, CPA, CVR, ROAS, or saturation.`,
    scope: { market, industry, locale: "en", currency },
  };
}

const saEcommerceSnapshot = snapshot(
  "SA",
  "ecommerce_general",
  "SAR",
  "snapshot-market-selected-sa-ecommerce-2026-08-23",
  [
    fact("sa-ecommerce-active-registrations-growth-q4-2024", "Saudi active e-commerce registrations growth by end of Q4 2024", 10, "percent", ["mi-sa-ecommerce-monshaat-q4-2024"], "2024-12-31T00:00:00+00:00", "SA", "ecommerce_general", "SAR"),
    fact("sa-ecommerce-commercial-records-q4-2024", "Saudi e-commerce commercial records issued by end of Q4 2024", 40953, "records", ["mi-sa-ecommerce-monshaat-q4-2024"], "2024-12-31T00:00:00+00:00", "SA", "ecommerce_general", "SAR"),
    fact("sa-ecommerce-internet-penetration-2024", "Saudi internet penetration in 2024", 99, "percent", ["mi-sa-internet-cst-2024"], "2024-12-31T00:00:00+00:00", "SA", "ecommerce_general", "SAR"),
    fact("sa-ecommerce-local-website-shopping-2024", "Online shopping occurring on local websites in Saudi Arabia in 2024", 93.1, "percent", ["mi-sa-internet-cst-2024"], "2024-12-31T00:00:00+00:00", "SA", "ecommerce_general", "SAR"),
    unavailableBenchmark("SA", "ecommerce_general", "SAR", "sa-ecommerce-paid-media-benchmark"),
    fact("sa-ecommerce-official-law-framework", "Saudi official E-Commerce Law framework exists", true, undefined, ["mi-sa-ecommerce-mc-law-2019-07-17"], "2019-07-17T00:00:00+00:00", "SA", "ecommerce_general", "SAR"),
  ],
  ["mi-sa-ecommerce-monshaat-q4-2024", "mi-sa-internet-cst-2024", "mi-sa-ecommerce-mc-law-2019-07-17"],
  ["Registration counts do not equal active demand, sales, or advertising performance.", "No paid-media benchmark or competitor-performance measure is available."],
  ["Official ecosystem and registration context; not a paid-media benchmark.", "Internet and shopping behavior indicators do not equal revenue, conversion, or advertising performance.", "Saudi E-Commerce Law source is regulatory context only."],
);

const egEducationSnapshot = snapshot(
  "EG",
  "education",
  "EGP",
  "snapshot-market-selected-eg-education-2026-08-23",
  [
    fact("eg-education-higher-enrollment-2023-2024", "Egypt higher-education enrollment in academic year 2023/2024", 3800000, "students", ["mi-eg-education-capmas-he-2023-2024"], "2024-09-01T00:00:00+00:00", "EG", "education", "EGP"),
    fact("eg-education-private-university-enrollment-2023-2024", "Egypt private-university enrollment in academic year 2023/2024", 365000, "students", ["mi-eg-education-capmas-he-2023-2024"], "2024-09-01T00:00:00+00:00", "EG", "education", "EGP"),
    fact("eg-education-primary-enrollment-2024", "Egypt primary enrollment for children ages 6–11 (UNICEF 2024 report context)", 93, "percent", ["mi-eg-education-unicef-annual-report-2024"], "2024-12-31T00:00:00+00:00", "EG", "education", "EGP"),
    fact("eg-education-secondary-enrollment-2024", "Egypt secondary enrollment (UNICEF 2024 report context)", 76, "percent", ["mi-eg-education-unicef-annual-report-2024"], "2024-12-31T00:00:00+00:00", "EG", "education", "EGP"),
    unavailableBenchmark("EG", "education", "EGP", "eg-education-paid-media-benchmark"),
    fact("eg-education-ministry-policy-and-platform-context", "Egypt official education policy and platform context is published", true, undefined, ["mi-eg-education-moe-policy-2025-08-31"], "2025-08-31T00:00:00+00:00", "EG", "education", "EGP"),
  ],
  ["mi-eg-education-capmas-he-2023-2024", "mi-eg-education-unicef-annual-report-2024", "mi-eg-education-moe-policy-2025-08-31"],
  ["Formal education indicators do not measure private tutoring, test-preparation, or online-course demand.", "No paid-media benchmark or offer-level demand measure is available."],
  ["Official higher-education and school participation context; not a paid-media benchmark.", "Enrollment counts do not measure lead volume, demand for a specific offer, or advertising performance."],
);

const saEducationSnapshot = snapshot(
  "SA",
  "education",
  "SAR",
  "snapshot-market-selected-sa-education-2026-08-23",
  [
    fact("sa-education-primary-completion-2024", "Saudi primary completion rate for ages 14–16 in 2024", 99.16, "percent", ["mi-sa-education-gastat-2024"], "2024-12-31T00:00:00+00:00", "SA", "education", "SAR"),
    fact("sa-education-school-enjoyment-2024", "Saudi students ages 8–17 reporting enjoyment of school in 2024", 97.93, "percent", ["mi-sa-education-gastat-2024"], "2024-12-31T00:00:00+00:00", "SA", "education", "SAR"),
    fact("sa-education-tertiary-gross-enrollment-2024", "Saudi tertiary gross enrollment ratio in 2024", 78, "percent", ["mi-sa-education-unesco-gem-2026"], "2024-12-31T00:00:00+00:00", "SA", "education", "SAR"),
    fact("sa-education-tertiary-enrollment-2022", "Saudi tertiary enrollment in 2022", 1570000, "students", ["mi-sa-education-unesco-gem-2026"], "2022-12-31T00:00:00+00:00", "SA", "education", "SAR"),
    unavailableBenchmark("SA", "education", "SAR", "sa-education-paid-media-benchmark"),
    fact("sa-education-private-school-regulatory-context", "Saudi official private-education and e-learning regulatory context is published", true, undefined, ["mi-sa-education-moe-private-regulations-2025-02-02"], "2025-02-02T00:00:00+00:00", "SA", "education", "SAR"),
  ],
  ["mi-sa-education-gastat-2024", "mi-sa-education-unesco-gem-2026", "mi-sa-education-moe-private-regulations-2025-02-02"],
  ["Education-system indicators do not establish demand or conversion performance for a specific offer.", "No paid-media benchmark or offer-level demand measure is available."],
  ["Official education-system and regulatory context; not a paid-media benchmark.", "Tertiary and school indicators do not measure private-course demand or advertising performance."],
);

function decision(
  market: "EG" | "SA",
  industry: "ecommerce_general" | "education",
  packageId: string,
  dimensions: { D1: "ready"; D2: "ready"; D3: "ready"; D4: "ready"; D5: "ready" | "partial"; D6: "unavailable" },
  marketValidated: boolean,
  blockers: string[],
  reason: string,
  independentSourceCount: number,
): ScopedStrategySelection["validationDecision"] {
  return {
    gateVersion: "market-validation-gate-v1",
    market,
    industry,
    packageId,
    packageStatus: "ready",
    contextDecision: "market_context_ready",
    marketValidated,
    dimensions,
    blockers,
    reason,
    independentSourceCount,
  };
}

export const selectedMarketStrategySelections: readonly ScopedStrategySelection[] = [
  {
    packageId: "market-selected-sa-ecommerce-2026-08-23",
    market: "SA",
    industry: "ecommerce_general",
    snapshot: saEcommerceSnapshot,
    evidenceIds: [
      "evidence-selected-sa-ecommerce-monshaat-2024",
      "evidence-selected-sa-ecommerce-cst-2024",
      "evidence-selected-sa-ecommerce-mc-law-2019-07-17",
    ],
    validationDecision: decision(
      "SA",
      "ecommerce_general",
      "market-selected-sa-ecommerce-2026-08-23",
      { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "ready", D6: "unavailable" },
      true,
      ["D6_paid_media_benchmark_unavailable"],
      "Official registration, internet-behavior, and e-commerce-law sources cover market, channel, and regulatory context; paid-media benchmark remains unavailable.",
      3,
    ),
  },
  {
    packageId: "market-selected-eg-education-2026-08-23",
    market: "EG",
    industry: "education",
    snapshot: egEducationSnapshot,
    evidenceIds: [
      "evidence-selected-eg-education-capmas-2023-2024",
      "evidence-selected-eg-education-unicef-2024",
      "evidence-selected-eg-education-moe-policy-2025-08-31",
    ],
    validationDecision: decision(
      "EG",
      "education",
      "market-selected-eg-education-2026-08-23",
      { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "partial", D6: "unavailable" },
      true,
      ["D6_paid_media_benchmark_unavailable"],
      "CAPMAS, UNICEF, and Ministry of Education sources provide independent formal-education context; private and online education demand remains unmeasured.",
      3,
    ),
  },
  {
    packageId: "market-selected-sa-education-2026-08-23",
    market: "SA",
    industry: "education",
    snapshot: saEducationSnapshot,
    evidenceIds: [
      "evidence-selected-sa-education-gastat-2024",
      "evidence-selected-sa-education-unesco-2026",
      "evidence-selected-sa-education-moe-private-regulations-2025-02-02",
    ],
    validationDecision: decision(
      "SA",
      "education",
      "market-selected-sa-education-2026-08-23",
      { D1: "ready", D2: "ready", D3: "ready", D4: "ready", D5: "partial", D6: "unavailable" },
      true,
      ["D6_paid_media_benchmark_unavailable"],
      "GASTAT, UNESCO, and Ministry of Education sources provide independent formal/private-education context; private and online education demand remains unmeasured.",
      3,
    ),
  },
];

import {
  EvidencePackageSchema,
  MarketEvidenceSnapshotSchema,
  type EvidencePackage,
  type MarketEvidenceSnapshot,
  type MarketFact,
  type SourceRecord,
  unavailableMarketFact,
} from "@/lib/contracts/knowledge";
import { buildEvidencePackage } from "./evidence-package";
import { SourceRegistry } from "./source-registry";
import { z } from "zod";

const NonNegativeInteger = z.number().int().nonnegative();
const CountMap = z.record(z.string(), NonNegativeInteger);
const RateString = z.string().regex(/^0(?:\.\d+)?$|^1(?:\.0+)?$/);
const DecimalString = z.string().regex(/^\d+(?:\.\d+)?$/);
const DateRange = z.object({ min: z.string(), max: z.string() });

const EasyOrdersNormalizedEvidenceSchema = z.object({
  contractVersion: z.literal("1.0"),
  provider: z.literal("easy_orders"),
  authorizationScope: z.literal("user_provided_export"),
  generatedAt: z.string().datetime({ offset: true }),
  market: z.literal("EG"),
  industry: z.literal("ecommerce_general"),
  locale: z.literal("ar"),
  currency: z.literal("EGP"),
  scopeStatus: z.string().min(1),
  marketValidated: z.literal(false),
  orders: z.object({
    entity: z.literal("orders"),
    rowCount: NonNegativeInteger,
    uniqueOrderIdCount: NonNegativeInteger,
    duplicateOrderIdCount: NonNegativeInteger,
    uniqueLongOrderIdCount: NonNegativeInteger,
    uniqueProductNameCount: NonNegativeInteger,
    uniqueSkuCount: NonNegativeInteger,
    uniqueCityCount: NonNegativeInteger,
    createdAtRange: DateRange.nullable(),
    statusCounts: CountMap,
    paymentMethodCounts: CountMap,
    paymentStatusCounts: CountMap,
    totalsEgp: z.object({
      recordedOrderValue: DecimalString,
      productCost: DecimalString,
      shippingCost: DecimalString,
      couponDiscount: DecimalString,
    }),
    lineItemFieldPresence: z.record(z.string(), NonNegativeInteger),
    attribution: z.object({
      utmSourcePresentCount: NonNegativeInteger,
      utmCampaignPresentCount: NonNegativeInteger,
      funnelIdPresentCount: NonNegativeInteger,
      referralCodePresentCount: NonNegativeInteger,
      clickIdFieldsPresent: z.boolean(),
    }),
    sensitiveColumnsDetected: z.array(z.string()),
    unsupportedOrMissing: z.record(z.string(), z.boolean()),
    ownerReportedOutcomeRates: z.object({
      deliveredCollected: RateString,
      returned: RateString,
      unresolvedOrNotAccepted: RateString,
      basis: z.literal("owner_statement_2026-08-27"),
      rowLevelAssignment: z.literal(false),
    }),
    privacy: z.object({
      rawRowsOmitted: z.literal(true),
      customerIdentityOmitted: z.literal(true),
      freeTextOmitted: z.literal(true),
      paymentReferencesOmitted: z.literal(true),
    }),
  }),
  products: z.object({
    entity: z.literal("products"),
    productCount: NonNegativeInteger,
    uniqueProductIdCount: NonNegativeInteger,
    duplicateProductIdCount: NonNegativeInteger,
    productsWithOriginalCategorySignal: NonNegativeInteger,
    productsWithParsedCategorySignal: NonNegativeInteger,
    productsWithoutCategorySignal: NonNegativeInteger,
    skuPresentCount: NonNegativeInteger,
    variantCount: NonNegativeInteger,
    variationCount: NonNegativeInteger,
  }),
  categories: z.object({
    entity: z.literal("categories"),
    rowCount: NonNegativeInteger,
    topLevelCategoryIdCount: NonNegativeInteger,
    childCategoryIdCount: NonNegativeInteger,
    duplicateTopLevelIdCount: NonNegativeInteger,
    categoryNamesOmitted: z.literal(true),
    taxonomyReviewRequired: z.literal(true),
  }),
  reviews: z.object({
    entity: z.literal("reviews"),
    rowCount: NonNegativeInteger,
    uniqueReviewIdCount: NonNegativeInteger,
    uniqueProductIdCount: NonNegativeInteger,
    ratingCounts: CountMap,
    acceptedCounts: CountMap,
    commentsPresentCount: NonNegativeInteger,
    customerNamesPresentCount: NonNegativeInteger,
    reviewTextOmitted: z.literal(true),
    customerIdentityOmitted: z.literal(true),
  }),
  sources: z.array(z.object({ file: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: NonNegativeInteger })),
  limitations: z.array(z.string().min(1)),
  privacy: z.object({
    rawRowsOmitted: z.literal(true),
    rawProviderPayloadsOmitted: z.literal(true),
    customerNamesPhonesAddressesOmitted: z.literal(true),
    reviewTextAndProductTextOmitted: z.literal(true),
    credentialsOmitted: z.literal(true),
  }),
}).strict();

export type EasyOrdersNormalizedEvidence = z.infer<typeof EasyOrdersNormalizedEvidenceSchema>;

export const EASY_ORDERS_SOURCE_ID = "easy-orders-client-export-20260826";

export type EasyOrdersEvidenceInput = {
  evidence: unknown;
  sourceHashes: string[];
  capturedAt?: string;
};

export function parseEasyOrdersNormalizedEvidence(value: unknown): EasyOrdersNormalizedEvidence {
  return EasyOrdersNormalizedEvidenceSchema.parse(value);
}

function decimalNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Easy Orders numeric value is not finite.");
  return parsed;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? Number((numerator / denominator).toFixed(8)) : 0;
}

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function fact(
  factId: string,
  name: string,
  value: string | number | boolean,
  unit: string,
  status: "evidence_backed" | "directional",
  sourceId: string,
  observedAt: string,
  scope: { market: "EG"; industry: string; locale: "ar"; currency: "EGP" },
): MarketFact {
  return {
    factId,
    name,
    value,
    unit,
    status,
    sourceIds: [sourceId],
    observedAt,
    scope,
  };
}

function factsFromEvidence(
  evidence: EasyOrdersNormalizedEvidence,
  sourceId: string,
  observedAt: string,
): MarketFact[] {
  const scope = { market: "EG" as const, industry: evidence.industry, locale: "ar" as const, currency: "EGP" as const };
  const orders = evidence.orders;
  const facts: MarketFact[] = [
    fact("easy-orders-recorded-order-count", "Recorded order count", orders.rowCount, "orders", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-recorded-order-value", "Recorded order value", decimalNumber(orders.totalsEgp.recordedOrderValue), "EGP", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-product-cost", "Recorded product cost", decimalNumber(orders.totalsEgp.productCost), "EGP", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-shipping-cost", "Recorded shipping cost", decimalNumber(orders.totalsEgp.shippingCost), "EGP", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-pending-status-rate", "Share of rows with pending order status", ratio(orders.statusCounts.pending ?? 0, orders.rowCount), "proportion", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-cod-payment-share", "Share of rows with cash-on-delivery payment method", ratio(orders.paymentMethodCounts.cod ?? 0, orders.rowCount), "proportion", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-utm-source-coverage", "Order rows with UTM source", ratio(orders.attribution.utmSourcePresentCount, orders.rowCount), "proportion", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-utm-campaign-coverage", "Order rows with UTM campaign", ratio(orders.attribution.utmCampaignPresentCount, orders.rowCount), "proportion", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-product-count", "Catalog product count", evidence.products.productCount, "products", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-products-without-category", "Products without a category signal", evidence.products.productsWithoutCategorySignal, "products", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-review-count", "Review count", evidence.reviews.rowCount, "reviews", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-reviewed-product-count", "Products represented in reviews", evidence.reviews.uniqueProductIdCount, "products", "evidence_backed", sourceId, observedAt, scope),
    fact("easy-orders-owner-delivered-collected-rate", "Owner-reported delivered and collected rate", decimalNumber(orders.ownerReportedOutcomeRates.deliveredCollected), "proportion", "directional", sourceId, observedAt, scope),
    fact("easy-orders-owner-returned-rate", "Owner-reported returned rate", decimalNumber(orders.ownerReportedOutcomeRates.returned), "proportion", "directional", sourceId, observedAt, scope),
    fact("easy-orders-owner-unresolved-rate", "Owner-reported unresolved or not accepted rate", decimalNumber(orders.ownerReportedOutcomeRates.unresolvedOrNotAccepted), "proportion", "directional", sourceId, observedAt, scope),
  ];
  const unavailable = [
    ["realized-revenue", "Realized collected revenue", "No row-level delivered/paid/collected field and owner rates are not assigned to order IDs."],
    ["refund-amount", "Refund or return amount", "The export has no refund or return amount field."],
    ["payment-status", "Row-level payment status", "Payment Status column is empty in the export."],
    ["roas", "ROAS", "No verified ad-spend and row-level revenue linkage is present in this store export."],
    ["cpa", "CPA", "No verified ad-spend and row-level conversion linkage is present in this store export."],
  ] as const;
  for (const [suffix, name, reason] of unavailable) {
    facts.push(unavailableMarketFact({
      factId: `easy-orders-unavailable-${suffix}`,
      name,
      market: "EG",
      industry: evidence.industry,
      locale: "ar",
      currency: "EGP",
      reason,
    }));
  }
  return facts;
}

export function easyOrdersSourceRecord(observedAt: string): SourceRecord {
  return {
    contractVersion: "1.0",
    sourceId: EASY_ORDERS_SOURCE_ID,
    publisher: "EasyOrders customer export",
    sourceUrl: "https://public-api-docs.easy-orders.net/docs/intro",
    sourceType: "client_data",
    jurisdiction: "EG",
    market: "EG",
    industry: "ecommerce_general",
    language: "ar",
    licenseStatus: "restricted",
    observedAt,
    freshnessPolicy: "on_demand",
    limitations: [
      "Private customer-owned operational evidence; not a general market benchmark.",
      "Package is intentionally limited because the source is restricted client data.",
      "Product taxonomy is retained as supplied and requires review; original categories are not overwritten.",
      "Owner-reported outcome rates are aggregate statements and are not assigned to individual order IDs.",
      "Raw rows, customer identity, free text, payment references, and credentials are excluded from the normalized artifact.",
    ],
    version: "easy-orders-export-2026-08-26",
    enabled: true,
  };
}

export function buildEasyOrdersEvidencePackage(
  registry: SourceRegistry,
  input: EasyOrdersEvidenceInput,
): EvidencePackage {
  const evidence = parseEasyOrdersNormalizedEvidence(input.evidence);
  const capturedAt = input.capturedAt ?? evidence.generatedAt;
  const source = easyOrdersSourceRecord(capturedAt);
  registry.register(source);
  const sourceHashSummary = input.sourceHashes.length > 0 ? input.sourceHashes.join(",") : "not-provided";
  const snapshot: MarketEvidenceSnapshot = MarketEvidenceSnapshotSchema.parse({
    contractVersion: "1.0",
    snapshotId: `easy-orders-snapshot-${source.version}`,
    market: evidence.market,
    industry: evidence.industry,
    locale: evidence.locale,
    currency: evidence.currency,
    capturedAt,
    freshnessStatus: "fresh",
    facts: factsFromEvidence(evidence, source.sourceId, capturedAt),
    competitorObservations: [],
    keywordSignals: [],
    seasonalitySignals: [],
    unknowns: [
      "This is first-party store evidence and does not establish general market demand or competitor performance.",
      "The 65% delivered-and-collected, 12% returned, and 23% unresolved rates are aggregate owner statements without row-level assignment.",
      "Product categories require review because the owner reported that the historical taxonomy is inaccurate.",
      "UTM source and campaign coverage is partial; no click ID fields are present in the export.",
    ],
    contradictions: [],
    sourceIds: [source.sourceId],
    confidence: 0.65,
    limitations: [
      ...source.limitations,
      `Input source hashes: ${sourceHashSummary}.`,
      "Recorded Total Cost is not treated as realized revenue until delivery, payment, and refund linkage is available.",
      "No Market-Validated status is derived from this package.",
    ],
  });
  return EvidencePackageSchema.parse(buildEvidencePackage(registry, {
    packageId: `easy-orders-package-${source.version}`,
    generatedAt: capturedAt,
    market: evidence.market,
    industry: evidence.industry,
    locale: evidence.locale,
    currency: evidence.currency,
    snapshots: [snapshot],
    evidenceReferences: [{
      evidenceId: `easy-orders-evidence-${source.version}`,
      sourceId: source.sourceId,
      observedAt: capturedAt,
      limitations: snapshot.limitations,
    }],
    claims: [],
    retrievalStrategy: "manual_review",
    queryHash: `easy-orders-${evidence.orders.rowCount}-${evidence.orders.uniqueOrderIdCount}-${source.version}`,
  }));
}

export function easyOrdersAggregateSummary(evidence: unknown): Record<string, unknown> {
  const parsed = parseEasyOrdersNormalizedEvidence(evidence);
  return {
    market: parsed.market,
    industry: parsed.industry,
    currency: parsed.currency,
    orderCount: parsed.orders.rowCount,
    uniqueOrderIdCount: parsed.orders.uniqueOrderIdCount,
    productCount: parsed.products.productCount,
    categoryRowCount: parsed.categories.rowCount,
    reviewCount: parsed.reviews.rowCount,
    statusCounts: parsed.orders.statusCounts,
    paymentMethodCounts: parsed.orders.paymentMethodCounts,
    recordedOrderValueEgp: parsed.orders.totalsEgp.recordedOrderValue,
    deliveredCollectedRateOwnerReported: parsed.orders.ownerReportedOutcomeRates.deliveredCollected,
    returnedRateOwnerReported: parsed.orders.ownerReportedOutcomeRates.returned,
    unresolvedRateOwnerReported: parsed.orders.ownerReportedOutcomeRates.unresolvedOrNotAccepted,
    utmSourceCoverage: ratio(parsed.orders.attribution.utmSourcePresentCount, parsed.orders.rowCount),
    utmCampaignCoverage: ratio(parsed.orders.attribution.utmCampaignPresentCount, parsed.orders.rowCount),
    rawRowsOmitted: true,
    marketValidated: false,
    sourceIsPrivateClientData: true,
    sumOfStatuses: sumCounts(parsed.orders.statusCounts),
  };
}

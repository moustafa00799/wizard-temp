import { z } from "zod";
import { KnowledgeCurrencySchema, type KnowledgeCurrency } from "@/lib/contracts/knowledge";

export const PLATFORM_CONTRACT_VERSION = "1.0" as const;

export const KnowledgeProviderSchema = z.enum(["google_ads", "tiktok_ads", "ga4"]);
export type KnowledgeProvider = z.infer<typeof KnowledgeProviderSchema>;

export const PlatformEntityLevelSchema = z.enum([
  "account",
  "property",
  "campaign",
  "ad_group",
  "ad",
  "report",
  "event",
]);
export type PlatformEntityLevel = z.infer<typeof PlatformEntityLevelSchema>;

export const PlatformCollectionStatusSchema = z.enum([
  "complete",
  "partial",
  "empty",
  "failed",
  "unverified",
]);
export type PlatformCollectionStatus = z.infer<typeof PlatformCollectionStatusSchema>;

export const PlatformScopeStatusSchema = z.enum(["verified", "unverified"]);
export type PlatformScopeStatus = z.infer<typeof PlatformScopeStatusSchema>;

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const IsoDateTimeSchema = z.string().datetime({ offset: true });
const NonEmptyStringSchema = z.string().trim().min(1);

export const PlatformCollectionSchema = z.object({
  contractVersion: z.literal(PLATFORM_CONTRACT_VERSION),
  provider: KnowledgeProviderSchema,
  accountId: NonEmptyStringSchema,
  accountName: NonEmptyStringSchema.optional(),
  entityLevel: PlatformEntityLevelSchema,
  dateStart: DateSchema.optional(),
  dateStop: DateSchema.optional(),
  dimensions: z.array(NonEmptyStringSchema),
  metrics: z.array(NonEmptyStringSchema),
  currency: KnowledgeCurrencySchema.optional(),
  timezone: NonEmptyStringSchema.optional(),
  scopeStatus: PlatformScopeStatusSchema,
  status: PlatformCollectionStatusSchema,
  queryHash: NonEmptyStringSchema,
  capturedAt: IsoDateTimeSchema,
  rows: z.array(z.record(z.string(), z.unknown())),
  limitations: z.array(NonEmptyStringSchema),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).superRefine((collection, context) => {
  if ((collection.status === "empty" || collection.status === "failed" || collection.status === "unverified") && collection.rows.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rows"],
      message: "Empty, failed, or unverified collections cannot expose usable rows.",
    });
  }
  if (collection.scopeStatus === "unverified" && collection.status === "complete") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["status"],
      message: "A complete collection requires verified account scope.",
    });
  }
  if (collection.currency && collection.provider === "ga4" && collection.metadata.currencySource === "inferred") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["metadata", "currencySource"],
      message: "GA4 currency must not be marked as inferred in a usable collection.",
    });
  }
});
export type PlatformCollection = z.infer<typeof PlatformCollectionSchema>;

export type PlatformMetricDescriptor = {
  name: string;
  unit: string;
  aliases: string[];
  additive: boolean;
};

export type PlatformDimensionDescriptor = {
  name: string;
  aliases: string[];
};

export function parsePlatformCollection(value: unknown): PlatformCollection {
  return PlatformCollectionSchema.parse(value);
}

export function platformCurrency(value: PlatformCollection): KnowledgeCurrency | undefined {
  return value.currency;
}

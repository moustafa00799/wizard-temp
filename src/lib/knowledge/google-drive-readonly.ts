import { z } from "zod";
import { KnowledgeCurrencySchema, KnowledgeLocaleSchema, KnowledgeMarketSchema } from "@/lib/contracts/knowledge";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const SourceRefSchema = z.string().regex(/^drive-file-sha256:[a-f0-9]{16}$/);
const MetricStatsSchema = z.object({
  numericCellCount: z.number().int().nonnegative(),
  sum: z.number().finite(),
  min: z.number().finite(),
  max: z.number().finite(),
}).strict();
const SheetSummarySchema = z.object({
  titleHash: z.string().regex(/^[a-f0-9]{16}$/),
  rowCount: z.number().int().nonnegative(),
  columnCount: z.number().int().nonnegative(),
  metricTokens: z.array(z.string()),
  dimensionTokens: z.array(z.string()),
}).strict();

export const GoogleDriveDataClassSchema = z.enum([
  "ga4",
  "ga4_ads_linked",
  "search_console",
  "keyword_planner",
  "campaign_report",
  "catalog_feed",
  "store_product",
  "sales_report",
  "seller_profile",
]);
export type GoogleDriveDataClass = z.infer<typeof GoogleDriveDataClassSchema>;

export const GoogleDriveScopeSchema = z.object({
  market: KnowledgeMarketSchema.nullable(),
  industry: z.string().nullable(),
  locale: KnowledgeLocaleSchema.nullable(),
  currency: KnowledgeCurrencySchema.nullable(),
  verified: z.literal(false),
  verificationNote: z.string().min(1).optional(),
}).strict();

export const GoogleDriveArtifactSchema = z.object({
  sourceRef: SourceRefSchema,
  label: z.string().regex(/^[a-z0-9_]+$/),
  dataClass: GoogleDriveDataClassSchema,
  rawSha256: Sha256Schema,
  rawSizeBytes: z.number().int().nonnegative(),
  rawRowsOmitted: z.literal(true),
  rawValuesOmitted: z.literal(true),
  rows: z.array(z.unknown()).max(0),
  sheets: z.array(SheetSummarySchema),
  metricAvailability: z.record(MetricStatsSchema),
  period: z.object({ min: z.string().date(), max: z.string().date() }).strict().nullable(),
  dimensions: z.array(z.string()),
  flags: z.array(z.string()),
  scope: GoogleDriveScopeSchema,
  structuralFingerprint: Sha256Schema,
  duplicateOfIndex: z.number().int().nonnegative().optional(),
}).strict();
export type GoogleDriveArtifact = z.infer<typeof GoogleDriveArtifactSchema>;

export const GoogleDriveNormalizedEvidenceSchema = z.object({
  contractVersion: z.literal("1.0"),
  generatedAt: z.string().datetime({ offset: true }),
  provider: z.literal("google_drive_readonly"),
  authorizationScope: z.literal("user_provided_drive_export_read_only"),
  recordCount: z.number().int().nonnegative(),
  records: z.array(GoogleDriveArtifactSchema),
  policy: z.object({
    readOnlyDrive: z.literal(true),
    driveWrites: z.literal(false),
    rawRowsOmitted: z.literal(true),
    rawValuesOmitted: z.literal(true),
    freeTextOmitted: z.literal(true),
    urlsOmitted: z.literal(true),
    queriesAndKeywordsOmitted: z.literal(true),
    customerIdentityOmitted: z.literal(true),
    credentialsOmitted: z.literal(true),
    marketValidated: z.literal(false),
    canonicalBlueprintMutation: z.literal(false),
    easyOrdersAttachment: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.recordCount !== value.records.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["recordCount"], message: "recordCount must equal records.length." });
  }
  for (const [index, record] of value.records.entries()) {
    if (record.rawSha256 !== record.sourceRef.slice(-16).padEnd(16, "0") && record.sourceRef.slice(-16) !== record.rawSha256.slice(0, 16)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["records", index, "sourceRef"], message: "sourceRef must be derived from the raw SHA-256 prefix." });
    }
    if (record.scope.currency !== null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["records", index, "scope", "currency"], message: "Drive normalization must not guess currency." });
    }
  }
});

export function parseGoogleDriveNormalizedEvidence(value: unknown) {
  return GoogleDriveNormalizedEvidenceSchema.parse(value);
}

import { z } from "zod";

export const META_SNAPSHOT_SCHEMA_VERSION = "1.0" as const;

export const META_SCOPED_ACCOUNT_IDS = [
  "act_1259153761545048",
  "act_809145896791225",
] as const;

export const MetaScopedAccountIdSchema = z.enum(META_SCOPED_ACCOUNT_IDS);
export type MetaScopedAccountId = z.infer<typeof MetaScopedAccountIdSchema>;

export const MetaEntityLevelSchema = z.enum(["ad_account", "campaign", "adset", "ad"]);
export type MetaEntityLevel = z.infer<typeof MetaEntityLevelSchema>;

export const MetaBreakdownSchema = z.enum([
  "age",
  "gender",
  "country",
  "region",
  "device_platform",
  "publisher_platform",
  "platform_position",
  "impression_device",
  "hourly_stats_aggregated_by_advertiser_time_zone",
  "hourly_stats_aggregated_by_audience_time_zone",
]);
export type MetaBreakdown = z.infer<typeof MetaBreakdownSchema>;

export const MetaSnapshotStatusSchema = z.enum([
  "complete",
  "partial",
  "cached",
  "rate_limited",
  "circuit_open",
  "failed",
]);
export type MetaSnapshotStatus = z.infer<typeof MetaSnapshotStatusSchema>;

export const MetaSnapshotRequestSchema = z.object({
  accountId: MetaScopedAccountIdSchema,
  objectType: MetaEntityLevelSchema,
  level: MetaEntityLevelSchema.optional(),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateStop: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  breakdown: MetaBreakdownSchema.optional(),
  actionBreakdown: z.enum(["action_type", "action_target_id", "action_destination"]).optional(),
  fields: z.array(z.string().trim().min(1)).min(1),
  filters: z.record(z.string(), z.unknown()).default({}),
  pageCursor: z.string().trim().min(1).optional(),
});
export type MetaSnapshotRequest = z.infer<typeof MetaSnapshotRequestSchema>;

export const MetaApiErrorSchema = z.object({
  code: z.number().int().optional(),
  subcode: z.number().int().optional(),
  message: z.string().optional(),
  transient: z.boolean().optional(),
});
export type MetaApiError = z.infer<typeof MetaApiErrorSchema>;

export const MetaApiPageSchema = z.object({
  rows: z.array(z.unknown()),
  nextPageCursor: z.string().trim().min(1).optional(),
  responseStatus: z.number().int().min(100).max(599),
  responseHeaders: z.record(z.string(), z.string()).default({}),
  error: MetaApiErrorSchema.optional(),
});
export type MetaApiPage = z.infer<typeof MetaApiPageSchema>;

export const MetaSnapshotRecordSchema = z.object({
  schemaVersion: z.literal(META_SNAPSHOT_SCHEMA_VERSION),
  snapshotId: z.string().trim().min(1),
  queryHash: z.string().trim().min(1),
  accountId: MetaScopedAccountIdSchema,
  objectType: MetaEntityLevelSchema,
  level: MetaEntityLevelSchema.optional(),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateStop: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  breakdown: MetaBreakdownSchema.optional(),
  actionBreakdown: z.enum(["action_type", "action_target_id", "action_destination"]).optional(),
  pageIndex: z.number().int().min(0),
  pageCursor: z.string().trim().min(1).optional(),
  nextPageCursor: z.string().trim().min(1).optional(),
  capturedAt: z.string().datetime({ offset: true }),
  status: MetaSnapshotStatusSchema,
  rowCount: z.number().int().min(0),
  responseStatus: z.number().int().min(100).max(599),
  responseHeaders: z.record(z.string(), z.string()).default({}),
  rawPayload: z.unknown(),
  retryCount: z.number().int().min(0),
  error: MetaApiErrorSchema.optional(),
  limitations: z.array(z.string().trim().min(1)),
});
export type MetaSnapshotRecord = z.infer<typeof MetaSnapshotRecordSchema>;

export const MetaCheckpointSchema = z.object({
  schemaVersion: z.literal(META_SNAPSHOT_SCHEMA_VERSION),
  queryHash: z.string().trim().min(1),
  accountId: MetaScopedAccountIdSchema,
  nextPageCursor: z.string().trim().min(1),
  nextPageIndex: z.number().int().min(0),
  updatedAt: z.string().datetime({ offset: true }),
});
export type MetaCheckpoint = z.infer<typeof MetaCheckpointSchema>;

export const MetaStoredCollectionSchema = z.object({
  schemaVersion: z.literal(META_SNAPSHOT_SCHEMA_VERSION),
  queryHash: z.string().trim().min(1),
  accountId: MetaScopedAccountIdSchema,
  status: z.enum(["complete", "partial"]),
  capturedAt: z.string().datetime({ offset: true }),
  rows: z.array(z.unknown()),
  snapshotIds: z.array(z.string().trim().min(1)),
  limitations: z.array(z.string().trim().min(1)),
});
export type MetaStoredCollection = z.infer<typeof MetaStoredCollectionSchema>;

export const MetaCircuitStateSchema = z.object({
  accountId: MetaScopedAccountIdSchema,
  consecutiveRateLimits: z.number().int().min(0),
  openUntil: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }),
});
export type MetaCircuitState = z.infer<typeof MetaCircuitStateSchema>;

export type MetaApiClient = {
  fetchInsightsPage: (request: MetaSnapshotRequest) => Promise<MetaApiPage>;
};

export type MetaCollectorClock = {
  now: () => Date;
  sleep: (milliseconds: number) => Promise<void>;
  jitter: () => number;
};

export type MetaCollectorPolicy = {
  maxRetries: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  jitterMaxMs: number;
  circuitThreshold: number;
  circuitCooldownMs: number;
  maxPages: number;
};

export type MetaCollectionResult = {
  queryHash: string;
  accountId: MetaScopedAccountId;
  status: MetaSnapshotStatus;
  rows: unknown[];
  snapshotIds: string[];
  pages: number;
  retries: number;
  nextPageCursor?: string;
  limitations: string[];
};

export function isMetaScopedAccountId(value: string): value is MetaScopedAccountId {
  return MetaScopedAccountIdSchema.safeParse(value).success;
}

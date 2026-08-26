import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRepositories, openDatabase, sha256Json } from "../src/lib/db";
import type { JsonRecord } from "../src/lib/db/database";

type RawRecord = Record<string, unknown>;
type NormalizedCollection = RawRecord & {
  provider: "google_ads" | "tiktok_ads";
  accountId: string;
  status?: string;
  market?: string;
  industry?: string;
  currency?: string;
  dateStart?: string;
  dateStop?: string;
  capturedAt?: string;
  queryHash?: string;
  rawSha256?: string;
  sourceFile?: string;
  metadata?: RawRecord;
  rows?: unknown[];
};

type GoogleNormalized = {
  generatedAt: string;
  marketValidated: false;
  accounts: Array<{
    accountId: string;
    accountName?: string;
    market: string;
    industry: string;
    currency: string;
    timezone: string;
    scopeReviewStatus: "user_confirmed" | "unreviewed";
    marketValidated: false;
    collections: NormalizedCollection[];
  }>;
  blockedAccounts: Array<{ accountId: string; status: "unavailable"; reason: string }>;
};

type TikTokNormalized = {
  generatedAt: string;
  provider: "tiktok_ads";
  marketValidated: false;
  accounts: Array<{
    accountId: string;
    accountName: string;
    country?: string;
    currency?: string;
    timezone?: string;
    scopeStatus: "verified" | "unverified";
    marketValidated: false;
    marketScopeStatus: "unmapped";
    industryScopeStatus: "unmapped";
    collections: NormalizedCollection[];
  }>;
};

type SecondAuthDedup = {
  secondAuthorizationAdvertiserIds: string[];
  priorCurrentAuthorizationAdvertiserIds: string[];
  uniqueAdvertiserIds: string[];
  overlapAdvertiserIds: string[];
  newCollectionsRequested: boolean;
  duplicateSuccessfulQueriesAvoided: boolean;
  decision: string;
};

const root = resolve(process.env.CDKS_PRIVATE_MERGE_ROOT ?? ".local/private-research/knowledge-merge");
const googlePath = resolve(process.env.CDKS_GOOGLE_NORMALIZED ?? ".local/private-research/google-ads/2026-08-26/normalized-readonly-evidence.json");
const tiktokPath = resolve(process.env.CDKS_TIKTOK_NORMALIZED ?? "/home/ubuntu/tiktok_exports/2026-08-26/current-auth/tiktok-readonly-normalized.json");
const secondAuthDedupPath = resolve(process.env.CDKS_TIKTOK_SECOND_AUTH_DEDUP ?? "/home/ubuntu/tiktok_exports/2026-08-26/second-auth/DEDUP_DECISION.json");
const databasePath = resolve(process.env.CDKS_PRIVATE_MERGE_DATABASE ?? `${root}/knowledge-merge-2026-08-27.sqlite`);
const manifestPath = resolve(process.env.CDKS_PRIVATE_MERGE_MANIFEST ?? `${root}/MERGE_MANIFEST.json`);
const workspaceId = process.env.CDKS_PRIVATE_MERGE_WORKSPACE ?? "ws-cdks-private-provider-evidence";
const generatedAt = process.env.CDKS_PRIVATE_MERGE_GENERATED_AT ?? "2026-08-27T00:00:00.000Z";

function readJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing merge input: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberFrom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function count(database: ReturnType<typeof openDatabase>, table: string): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get<{ count: number }>();
  return Number(row?.count ?? 0);
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is string => typeof item === "string");
  return values.length > 0 ? values : undefined;
}

function safeSourceFile(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.split(/[\\\\/]/).pop();
}

function safeMetadata(value: unknown, rawRowCount: number, rowsLength: number): JsonRecord {
  const metadata = isRecord(value) ? value : {};
  const safe: JsonRecord = {
    dataClass: metadata.dataClass,
    kind: metadata.kind,
    aggregationGroup: metadata.aggregationGroup,
    advertiserCountry: metadata.advertiserCountry,
    currencySource: metadata.currencySource,
    pageLimited: metadata.pageLimited,
    responseCode: metadata.responseCode,
    rawSha256: metadata.rawSha256,
    sourceFile: safeSourceFile(metadata.sourceFile),
    rawRowCount: rawRowCount || rowsLength,
    rawRowsOmittedFromSanitizedOutput: true,
  };
  return safe;
}

function safeCollection(collection: NormalizedCollection): JsonRecord {
  const rows = Array.isArray(collection.rows) ? collection.rows : [];
  const rawRowCount = isRecord(collection.metadata) && typeof collection.metadata.rawRowCount === "number"
    ? numberFrom(collection.metadata.rawRowCount)
    : numberFrom((collection as RawRecord).rawRowCount);
  return {
    contractVersion: (collection as RawRecord).contractVersion,
    provider: collection.provider,
    accountId: collection.accountId,
    entityLevel: (collection as RawRecord).entityLevel,
    dateStart: collection.dateStart,
    dateStop: collection.dateStop,
    dimensions: stringArray((collection as RawRecord).dimensions),
    metrics: stringArray((collection as RawRecord).metrics),
    currency: collection.currency,
    timezone: (collection as RawRecord).timezone,
    scopeStatus: (collection as RawRecord).scopeStatus,
    status: collection.status,
    queryHash: collection.queryHash,
    capturedAt: collection.capturedAt,
    rows: [],
    limitations: stringArray((collection as RawRecord).limitations),
    metadata: safeMetadata(collection.metadata, rawRowCount, rows.length),
    dataClass: (collection as RawRecord).dataClass,
    kind: (collection as RawRecord).kind,
    rawSha256: collection.rawSha256,
    sourceFile: safeSourceFile(collection.sourceFile),
    aggregationGroup: (collection as RawRecord).aggregationGroup,
    rawRowsOmittedFromMerge: true,
  };
}

function collectionKey(collection: NormalizedCollection): string {
  return [
    collection.provider,
    collection.accountId,
    String(collection.queryHash ?? "no-query-hash"),
    String(collection.rawSha256 ?? "no-raw-hash"),
  ].join("|");
}

function shortId(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function sourceRecord(provider: "google_ads" | "tiktok_ads") {
  return provider === "google_ads"
    ? {
        sourceId: "source-google-ads-private-operational-20260826",
        publisher: "Google Ads",
        sourceUrl: "https://developers.google.com/google-ads/api/docs",
        sourceType: "official_api" as const,
        licenseStatus: "restricted" as const,
        version: "2026-08-26-readonly",
        observedAt: "2026-08-26T19:20:00.000Z",
        freshnessPolicy: "on_demand" as const,
        limitations: [
          "Private account-owned operational evidence; not a public market benchmark.",
          "Read-only GAQL/reporting collection; no mutation or spend operation was performed.",
          "Market validation remains false and account 428 remains mixed at account level.",
        ],
      }
    : {
        sourceId: "source-tiktok-private-operational-20260827",
        publisher: "TikTok for Business",
        sourceUrl: "https://ads.tiktok.com/resources/help/article/marketing-api?lang=en",
        sourceType: "official_api" as const,
        licenseStatus: "restricted" as const,
        version: "2026-08-27-readonly",
        observedAt: "2026-08-27T00:00:00.000Z",
        freshnessPolicy: "on_demand" as const,
        limitations: [
          "Private account-owned operational evidence; not a public market benchmark.",
          "Only reporting and inventory reads were used; no create, update, delete, audience, catalog, or spend operation was performed.",
          "Market and industry mapping remains unmapped for this merge; Market Validation remains false.",
        ],
      };
}

function collectionStatus(collection: NormalizedCollection): "ready" | "partial" | "empty" | "missing" | "failed" | "unverified" {
  if (collection.status === "failed") return "failed";
  if (collection.status === "empty") return "empty";
  if (collection.status === "partial") return "partial";
  if (collection.status === "complete") return "partial";
  return "unverified";
}

function period(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

mkdirSync(root, { recursive: true });
const google = readJson<GoogleNormalized>(googlePath);
const tiktok = readJson<TikTokNormalized>(tiktokPath);
const secondAuthDedup = readJson<SecondAuthDedup>(secondAuthDedupPath);
const database = openDatabase(databasePath);
const repositories = createRepositories(database);

database.prepare("INSERT OR IGNORE INTO workspaces (workspace_id, name, status, created_at) VALUES (?, ?, 'active', ?)").run(workspaceId, "CDKS private provider evidence merge", generatedAt);
database.prepare("INSERT OR IGNORE INTO workspace_memberships (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").run(workspaceId, "system-private-merge", generatedAt);

const googleSource = sourceRecord("google_ads");
const tiktokSource = sourceRecord("tiktok_ads");
repositories.sources.create(googleSource);
repositories.sources.create(tiktokSource);

const dedupKeys = new Set<string>();
const mergedCollections: Array<{ provider: string; accountId: string; collectionId: string; dedupKey: string; status: string }> = [];
const skippedDuplicates: string[] = [];
const snapshotIds: string[] = [];

function mergeAccount(input: {
  provider: "google_ads" | "tiktok_ads";
  accountId: string;
  accountName?: string;
  market: string;
  industry: string;
  currency: string;
  timezone?: string;
  scopeStatus: "verified" | "unverified";
  collections: NormalizedCollection[];
  sourceId: string;
  connectionStatus: "read_only_ready" | "partial";
  authorizationScope: string;
}): void {
  const accountDbId = `account-${input.provider}-${input.accountId}`;
  const connectionId = `connection-${input.provider}-${input.authorizationScope}-${input.accountId}`;
  repositories.providers.createAccount({
    accountId: accountDbId,
    workspaceId,
    provider: input.provider,
    externalAccountRef: input.accountId,
    ownershipStatus: input.scopeStatus === "verified" ? "verified" : "unverified",
  });
  repositories.providers.createConnection({
    connectionId,
    accountId: accountDbId,
    connectionStatus: input.connectionStatus,
    grantedScopes: input.provider === "google_ads" ? ["reporting.select_only"] : ["advertiser.read", "reporting.read"],
    lastVerifiedAt: generatedAt,
  });

  const snapshotId = `snapshot-${input.provider}-${input.accountId}-20260827`;
  const snapshotCollections = input.collections.map((collection) => {
    const dedupKey = collectionKey(collection);
    if (dedupKeys.has(dedupKey)) {
      skippedDuplicates.push(dedupKey);
      return null;
    }
    dedupKeys.add(dedupKey);
    const sanitized = safeCollection(collection);
    const collectionId = shortId("collection", dedupKey);
    repositories.providers.createCollection({
      collectionId,
      connectionId,
      market: input.market === "unmapped" || input.market === "mixed" ? undefined : input.market,
      industry: input.industry === "unmapped" || input.industry === "mixed_or_multi_industry" ? undefined : input.industry,
      periodStart: period(collection.dateStart),
      periodEnd: period(collection.dateStop),
      status: collectionStatus(collection),
      collection: sanitized,
    });
    mergedCollections.push({ provider: input.provider, accountId: input.accountId, collectionId, dedupKey, status: collectionStatus(collection) });
    return {
      collectionId,
      dataClass: collection.dataClass,
      kind: collection.kind,
      status: collection.status,
      rawSha256: collection.rawSha256,
      queryHash: collection.queryHash,
      rawRowCount: isRecord(collection.metadata) ? numberFrom(collection.metadata.rawRowCount) : numberFrom((collection as RawRecord).rawRowCount),
    };
  }).filter((value): value is NonNullable<typeof value> => value !== null);

  repositories.knowledge.createSnapshot({
    snapshotId,
    workspaceId,
    market: input.market,
    industry: input.industry,
    locale: "ar",
    currency: input.currency,
    capturedAt: generatedAt,
    freshnessStatus: "fresh",
    confidence: 0,
    sourceIds: [input.sourceId],
    snapshot: {
      provider: input.provider,
      externalAccountRef: input.accountId,
      timezone: input.timezone,
      scopeStatus: input.scopeStatus,
      market: input.market,
      industry: input.industry,
      globalMarketValidated: false,
      providerEvidenceOnly: true,
      rawRowsOmittedFromMerge: true,
      collections: snapshotCollections,
    },
  });
  snapshotIds.push(snapshotId);
  repositories.governance.createAuditEvent({
    auditEventId: shortId("audit", `${input.provider}|${input.accountId}|${input.authorizationScope}`),
    workspaceId,
    eventType: "private_provider_evidence_merged",
    objectType: "provider_account",
    objectId: accountDbId,
    actorType: "system",
    payload: {
      provider: input.provider,
      externalAccountRef: input.accountId,
      authorizationScope: input.authorizationScope,
      collectionCount: snapshotCollections.length,
      rawRowsPersisted: false,
      marketValidated: false,
    },
  });
}

for (const account of google.accounts) {
  mergeAccount({
    provider: "google_ads",
    accountId: account.accountId,
    accountName: account.accountName,
    market: account.market,
    industry: account.industry,
    currency: account.currency,
    timezone: account.timezone,
    scopeStatus: account.scopeReviewStatus === "user_confirmed" ? "verified" : "unverified",
    collections: account.collections,
    sourceId: googleSource.sourceId,
    connectionStatus: "read_only_ready",
    authorizationScope: "google-ads-current-readonly",
  });
}

for (const account of tiktok.accounts) {
  mergeAccount({
    provider: "tiktok_ads",
    accountId: account.accountId,
    accountName: account.accountName,
    market: account.marketScopeStatus,
    industry: account.industryScopeStatus,
    currency: account.currency ?? "unavailable",
    timezone: account.timezone,
    scopeStatus: account.scopeStatus,
    collections: account.collections,
    sourceId: tiktokSource.sourceId,
    connectionStatus: "partial",
    authorizationScope: "tiktok-current-readonly",
  });
}

for (const accountId of secondAuthDedup.overlapAdvertiserIds) {
  repositories.providers.createConnection({
    connectionId: `connection-tiktok-second-auth-${accountId}`,
    accountId: `account-tiktok_ads-${accountId}`,
    connectionStatus: "partial",
    grantedScopes: ["advertiser.read", "reporting.read"],
    lastVerifiedAt: generatedAt,
  });
}
repositories.governance.createAuditEvent({
  auditEventId: "audit-tiktok-second-auth-overlap-20260827",
  workspaceId,
  eventType: "private_provider_authorization_overlap_recorded",
  objectType: "provider_authorization",
  objectId: "tiktok-second-authorization",
  actorType: "connector",
  payload: {
    overlapAdvertiserIds: secondAuthDedup.overlapAdvertiserIds,
    uniqueAdvertiserIds: secondAuthDedup.uniqueAdvertiserIds,
    newCollectionsRequested: secondAuthDedup.newCollectionsRequested,
    duplicateSuccessfulQueriesAvoided: secondAuthDedup.duplicateSuccessfulQueriesAvoided,
    rawRowsPersisted: false,
  },
});

for (const blocked of google.blockedAccounts) {
  repositories.deferredSources.create({
    deferredSourceId: `deferred-google-ads-${blocked.accountId}`,
    workspaceId,
    provider: "google_ads",
    externalAccountRef: blocked.accountId,
    status: "deferred",
    reason: blocked.reason,
    retryGate: "new_authorization",
    mergePolicy: "merge_only_after_scope_and_hash_verification",
    lastAttemptAt: google.generatedAt,
    createdAt: generatedAt,
  });
}

const mergeManifest = {
  mergeId: "cdks-private-provider-evidence-merge-20260827",
  workspaceId,
  generatedAt,
  inputs: {
    googleAds: { path: googlePath, sha256: fileSha256(googlePath), accountCount: google.accounts.length, collectionCount: google.accounts.reduce((sum, account) => sum + account.collections.length, 0) },
    tiktok: { path: tiktokPath, sha256: fileSha256(tiktokPath), accountCount: tiktok.accounts.length, collectionCount: tiktok.accounts.reduce((sum, account) => sum + account.collections.length, 0) },
    tiktokSecondAuthorizationDedup: { path: secondAuthDedupPath, sha256: fileSha256(secondAuthDedupPath), overlapAccounts: secondAuthDedup.overlapAdvertiserIds.length, uniqueAccounts: secondAuthDedup.uniqueAdvertiserIds.length },
  },
  result: {
    providerAccounts: count(database, "provider_accounts"),
    providerConnections: count(database, "provider_connections"),
    providerCollections: count(database, "provider_collections"),
    knowledgeSnapshots: count(database, "knowledge_snapshots"),
    knowledgeSnapshotVersions: count(database, "knowledge_snapshot_versions"),
    sourceRecords: count(database, "source_records"),
    deferredSources: count(database, "deferred_sources"),
    auditEvents: count(database, "audit_events"),
    mergedCollections: mergedCollections.length,
    skippedDuplicates: skippedDuplicates.length,
    snapshotIds,
    packagesCreated: 0,
    rawRowsPersisted: false,
    credentialsPersisted: false,
    marketValidated: false,
    canonicalBlueprintMutation: false,
  },
  policy: {
    publicMarketEvidenceSeparated: true,
    accountOwnedEvidenceSeparated: true,
    performanceSeparatedFromInventory: true,
    secondAuthorizationOverlapNotCopied: true,
    deferredSourcesExcludedFromPackages: true,
    noExternalWrites: true,
  },
  databasePath,
};
writeFileSync(manifestPath, `${JSON.stringify(mergeManifest, null, 2)}\n`);
console.log(JSON.stringify({
  manifestPath,
  databasePath,
  ...mergeManifest.result,
}, null, 2));
database.close();

import {
  MetaApiPageSchema,
  MetaSnapshotRequestSchema,
  MetaSnapshotRecordSchema,
  type MetaApiError,
  type MetaApiPage,
  type MetaCircuitState,
  type MetaCollectionResult,
  type MetaCollectorClock,
  type MetaCollectorPolicy,
  type MetaScopedAccountId,
  type MetaSnapshotRequest,
} from "./meta-snapshot-contracts";
import { InMemoryMetaSnapshotStore, type MetaSnapshotStore } from "./meta-snapshot-store";
import type { MetaApiClient } from "./meta-snapshot-contracts";

export const DEFAULT_META_COLLECTOR_POLICY: MetaCollectorPolicy = {
  maxRetries: 3,
  backoffBaseMs: 1_000,
  backoffMaxMs: 60_000,
  jitterMaxMs: 500,
  circuitThreshold: 2,
  circuitCooldownMs: 15 * 60 * 1_000,
  maxPages: 100,
};

const DEFAULT_CLOCK: MetaCollectorClock = {
  now: () => new Date(),
  sleep: async (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  jitter: () => Math.floor(Math.random() * 501),
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`);
  return `{${entries.join(",")}}`;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function queryHashFor(request: MetaSnapshotRequest): string {
  const { pageCursor: _pageCursor, ...withoutCursor } = request;
  return `meta:${hashString(stableStringify(withoutCursor))}`;
}

function redactedHeaders(headers: Record<string, string>): Record<string, string> {
  const allowed = new Set([
    "x-ad-account-usage",
    "x-business-use-case",
    "x-fb-ads-insights-throttle",
    "retry-after",
    "content-type",
  ]);
  return Object.entries(headers).reduce<Record<string, string>>((result, [key, value]) => {
    const normalized = key.trim().toLowerCase();
    if (allowed.has(normalized)) result[normalized] = value;
    return result;
  }, {});
}

function isRetryable(page: MetaApiPage): boolean {
  if (page.error?.transient) return true;
  if (page.responseStatus === 429) return true;
  if (page.responseStatus === 403 && page.error?.code === 4) return true;
  return [500, 502, 503, 504].includes(page.responseStatus);
}

function nextDelayMs(retryIndex: number, policy: MetaCollectorPolicy, clock: MetaCollectorClock): number {
  const exponential = policy.backoffBaseMs * (2 ** retryIndex);
  return Math.min(policy.backoffMaxMs, exponential + Math.min(policy.jitterMaxMs, clock.jitter()));
}

function limitationsFor(status: "complete" | "partial" | "rate_limited" | "circuit_open" | "failed"): string[] {
  const limitations = [
    "Read-only collection; this collector does not create, update, pause, or publish Meta objects.",
    "Sensitive response headers are not persisted; only an allowlisted operational subset is retained.",
  ];
  if (status === "partial") limitations.push("Collection has an outstanding page cursor and must be resumed from the persisted checkpoint.");
  if (status === "rate_limited") limitations.push("Meta throttling was observed; no immediate retry beyond the collector policy was performed.");
  if (status === "circuit_open") limitations.push("The per-account circuit breaker is open until the cooldown expires.");
  if (status === "failed") limitations.push("The request failed with a non-retryable response and requires review before another attempt.");
  return limitations;
}

function errorForPage(page: MetaApiPage): MetaApiError | undefined {
  return page.error ? {
    code: page.error.code,
    subcode: page.error.subcode,
    message: page.error.message,
    transient: page.error.transient,
  } : undefined;
}

export class MetaSnapshotCollector {
  private readonly policy: MetaCollectorPolicy;
  private readonly clock: MetaCollectorClock;
  private readonly circuits = new Map<MetaScopedAccountId, MetaCircuitState>();

  constructor(
    private readonly client: MetaApiClient,
    private readonly store: MetaSnapshotStore = new InMemoryMetaSnapshotStore(),
    policy: Partial<MetaCollectorPolicy> = {},
    clock: MetaCollectorClock = DEFAULT_CLOCK,
  ) {
    this.policy = { ...DEFAULT_META_COLLECTOR_POLICY, ...policy };
    this.clock = clock;
  }

  async collect(input: MetaSnapshotRequest): Promise<MetaCollectionResult> {
    const request = MetaSnapshotRequestSchema.parse(input);
    const queryHash = queryHashFor(request);
    const cached = this.store.getCollection(queryHash);
    if (cached?.status === "complete") {
      return {
        queryHash,
        accountId: request.accountId,
        status: "cached",
        rows: cached.rows,
        snapshotIds: cached.snapshotIds,
        pages: cached.snapshotIds.length,
        retries: 0,
        limitations: [...cached.limitations, "Returned from the idempotent collection cache."],
      };
    }

    const circuit = this.getCircuit(request.accountId);
    if (circuit.openUntil && new Date(circuit.openUntil).getTime() > this.clock.now().getTime()) {
      return this.finishWithoutRequest(request, queryHash, "circuit_open", [], circuit.openUntil);
    }

    const checkpoint = this.store.getCheckpoint(queryHash);
    let cursor = request.pageCursor ?? checkpoint?.nextPageCursor;
    let pageIndex = checkpoint?.nextPageIndex ?? 0;
    let rows: unknown[] = cached?.rows ?? [];
    const snapshotIds = this.store.listSnapshots(queryHash).map((snapshot) => snapshot.snapshotId);
    let totalRetries = 0;

    for (let pageCount = 0; pageCount < this.policy.maxPages; pageCount += 1) {
      const pageRequest = { ...request, ...(cursor ? { pageCursor: cursor } : {}) };
      let response: MetaApiPage;
      let retryCount = 0;

      while (true) {
        response = MetaApiPageSchema.parse(await this.client.fetchInsightsPage(pageRequest));
        if (!isRetryable(response)) break;
        if (retryCount >= this.policy.maxRetries) {
          totalRetries += retryCount;
          return this.recordTerminalPage({
            request,
            queryHash,
            pageIndex,
            pageCursor: cursor,
            page: response,
            status: "rate_limited",
            rows,
            snapshotIds,
            totalRetries,
          });
        }
        const delay = nextDelayMs(retryCount, this.policy, this.clock);
        await this.clock.sleep(delay);
        retryCount += 1;
      }

      totalRetries += retryCount;
      if (response!.responseStatus < 200 || response!.responseStatus >= 300) {
        return this.recordTerminalPage({
          request,
          queryHash,
          pageIndex,
          pageCursor: cursor,
          page: response!,
          status: "failed",
          rows,
          snapshotIds,
          totalRetries,
        });
      }

      this.resetCircuit(request.accountId);
      rows = [...rows, ...response!.rows];
      const pageStatus = response!.nextPageCursor ? "partial" : "complete";
      const snapshot = this.persistPage({
        request,
        queryHash,
        pageIndex,
        pageCursor: cursor,
        page: response!,
        status: pageStatus,
        retryCount,
      });
      snapshotIds.push(snapshot.snapshotId);

      if (!response!.nextPageCursor) {
        this.store.clearCheckpoint(queryHash);
        this.store.putCollection({
          schemaVersion: "1.0",
          queryHash,
          accountId: request.accountId,
          status: "complete",
          capturedAt: this.clock.now().toISOString(),
          rows,
          snapshotIds,
          limitations: limitationsFor("complete"),
        });
        return {
          queryHash,
          accountId: request.accountId,
          status: "complete",
          rows,
          snapshotIds,
          pages: snapshotIds.length,
          retries: totalRetries,
          limitations: limitationsFor("complete"),
        };
      }

      cursor = response!.nextPageCursor;
      pageIndex += 1;
      this.store.putCheckpoint({
        schemaVersion: "1.0",
        queryHash,
        accountId: request.accountId,
        nextPageCursor: cursor,
        nextPageIndex: pageIndex,
        updatedAt: this.clock.now().toISOString(),
      });
    }

    this.store.putCollection({
      schemaVersion: "1.0",
      queryHash,
      accountId: request.accountId,
      status: "partial",
      capturedAt: this.clock.now().toISOString(),
      rows,
      snapshotIds,
      limitations: limitationsFor("partial"),
    });
    return {
      queryHash,
      accountId: request.accountId,
      status: "partial",
      rows,
      snapshotIds,
      pages: snapshotIds.length,
      retries: totalRetries,
      nextPageCursor: cursor,
      limitations: limitationsFor("partial"),
    };
  }

  private getCircuit(accountId: MetaScopedAccountId): MetaCircuitState {
    const current = this.circuits.get(accountId) ?? {
      accountId,
      consecutiveRateLimits: 0,
      updatedAt: this.clock.now().toISOString(),
    };
    this.circuits.set(accountId, current);
    return current;
  }

  private resetCircuit(accountId: MetaScopedAccountId): void {
    this.circuits.set(accountId, {
      accountId,
      consecutiveRateLimits: 0,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  private openCircuit(accountId: MetaScopedAccountId): string {
    const previous = this.getCircuit(accountId);
    const consecutiveRateLimits = previous.consecutiveRateLimits + 1;
    const openUntil = consecutiveRateLimits >= this.policy.circuitThreshold
      ? new Date(this.clock.now().getTime() + this.policy.circuitCooldownMs).toISOString()
      : undefined;
    this.circuits.set(accountId, {
      accountId,
      consecutiveRateLimits,
      ...(openUntil ? { openUntil } : {}),
      updatedAt: this.clock.now().toISOString(),
    });
    return openUntil ?? "";
  }

  private persistPage(params: {
    request: MetaSnapshotRequest;
    queryHash: string;
    pageIndex: number;
    pageCursor?: string;
    page: MetaApiPage;
    status: "complete" | "partial";
    retryCount: number;
  }) {
    const capturedAt = this.clock.now().toISOString();
    const rawPayload = {
      rows: params.page.rows,
      nextPageCursor: params.page.nextPageCursor,
      responseStatus: params.page.responseStatus,
      responseHeaders: redactedHeaders(params.page.responseHeaders),
      ...(params.page.error ? { error: errorForPage(params.page) } : {}),
    };
    const snapshot = MetaSnapshotRecordSchema.parse({
      schemaVersion: "1.0",
      snapshotId: `${params.queryHash}:${params.pageIndex}:${hashString(stableStringify(rawPayload))}`,
      queryHash: params.queryHash,
      accountId: params.request.accountId,
      objectType: params.request.objectType,
      ...(params.request.level ? { level: params.request.level } : {}),
      dateStart: params.request.dateStart,
      dateStop: params.request.dateStop,
      ...(params.request.breakdown ? { breakdown: params.request.breakdown } : {}),
      ...(params.request.actionBreakdown ? { actionBreakdown: params.request.actionBreakdown } : {}),
      pageIndex: params.pageIndex,
      ...(params.pageCursor ? { pageCursor: params.pageCursor } : {}),
      ...(params.page.nextPageCursor ? { nextPageCursor: params.page.nextPageCursor } : {}),
      capturedAt,
      status: params.status,
      rowCount: params.page.rows.length,
      responseStatus: params.page.responseStatus,
      responseHeaders: redactedHeaders(params.page.responseHeaders),
      rawPayload,
      retryCount: params.retryCount,
      limitations: limitationsFor(params.status),
    });
    this.store.appendSnapshot(snapshot);
    return snapshot;
  }

  private recordTerminalPage(params: {
    request: MetaSnapshotRequest;
    queryHash: string;
    pageIndex: number;
    pageCursor?: string;
    page: MetaApiPage;
    status: "rate_limited" | "failed";
    rows: unknown[];
    snapshotIds: string[];
    totalRetries: number;
  }): MetaCollectionResult {
    const openUntil = params.status === "rate_limited" ? this.openCircuit(params.request.accountId) : "";
    const snapshot = this.persistTerminalPage(params, openUntil);
    const snapshotIds = [...params.snapshotIds, snapshot.snapshotId];
    const nextPageCursor = params.page.nextPageCursor ?? params.pageCursor;
    if (params.rows.length > 0) {
      this.store.putCollection({
        schemaVersion: "1.0",
        queryHash: params.queryHash,
        accountId: params.request.accountId,
        status: "partial",
        capturedAt: this.clock.now().toISOString(),
        rows: params.rows,
        snapshotIds,
        limitations: [...limitationsFor(params.status), "Previously collected rows are partial and must not be treated as a complete account extract."],
      });
    }
    if (nextPageCursor) {
      this.store.putCheckpoint({
        schemaVersion: "1.0",
        queryHash: params.queryHash,
        accountId: params.request.accountId,
        nextPageCursor,
        nextPageIndex: params.pageIndex,
        updatedAt: this.clock.now().toISOString(),
      });
    }
    return {
      queryHash: params.queryHash,
      accountId: params.request.accountId,
      status: params.status,
      rows: params.rows,
      snapshotIds,
      pages: snapshotIds.length,
      retries: params.totalRetries,
      ...(nextPageCursor ? { nextPageCursor } : {}),
      limitations: [
        ...limitationsFor(params.status),
        ...(openUntil ? [`Circuit is open until ${openUntil}.`] : []),
      ],
    };
  }

  private persistTerminalPage(params: {
    request: MetaSnapshotRequest;
    queryHash: string;
    pageIndex: number;
    pageCursor?: string;
    page: MetaApiPage;
    status: "rate_limited" | "failed";
  }, openUntil: string) {
    const capturedAt = this.clock.now().toISOString();
    const rawPayload = {
      rows: params.page.rows,
      nextPageCursor: params.page.nextPageCursor,
      responseStatus: params.page.responseStatus,
      responseHeaders: redactedHeaders(params.page.responseHeaders),
      ...(params.page.error ? { error: errorForPage(params.page) } : {}),
    };
    const snapshot = MetaSnapshotRecordSchema.parse({
      schemaVersion: "1.0",
      snapshotId: `${params.queryHash}:${params.pageIndex}:${params.status}:${hashString(stableStringify(rawPayload))}`,
      queryHash: params.queryHash,
      accountId: params.request.accountId,
      objectType: params.request.objectType,
      ...(params.request.level ? { level: params.request.level } : {}),
      dateStart: params.request.dateStart,
      dateStop: params.request.dateStop,
      ...(params.request.breakdown ? { breakdown: params.request.breakdown } : {}),
      ...(params.request.actionBreakdown ? { actionBreakdown: params.request.actionBreakdown } : {}),
      pageIndex: params.pageIndex,
      ...(params.pageCursor ? { pageCursor: params.pageCursor } : {}),
      ...(params.page.nextPageCursor ? { nextPageCursor: params.page.nextPageCursor } : {}),
      capturedAt,
      status: params.status,
      rowCount: params.page.rows.length,
      responseStatus: params.page.responseStatus,
      responseHeaders: redactedHeaders(params.page.responseHeaders),
      rawPayload,
      retryCount: this.policy.maxRetries,
      limitations: [
        ...limitationsFor(params.status),
        ...(openUntil ? [`Circuit is open until ${openUntil}.`] : []),
      ],
      ...(params.page.error ? { error: errorForPage(params.page) } : {}),
    });
    this.store.appendSnapshot(snapshot);
    return snapshot;
  }

  private finishWithoutRequest(
    request: MetaSnapshotRequest,
    queryHash: string,
    status: "circuit_open",
    rows: unknown[],
    openUntil?: string,
  ): MetaCollectionResult {
    const limitations = [...limitationsFor(status), ...(openUntil ? [`Circuit is open until ${openUntil}.`] : [])];
    return {
      queryHash,
      accountId: request.accountId,
      status,
      rows,
      snapshotIds: [],
      pages: 0,
      retries: 0,
      limitations,
    };
  }
}

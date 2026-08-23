import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  InMemoryMetaSnapshotStore,
  MetaSnapshotCollector,
  MetaSnapshotQueue,
  MetaSnapshotRequestSchema,
  buildMetaEvidencePackage,
  type MetaApiClient,
  type MetaApiPage,
  type MetaCollectorClock,
  type MetaSnapshotRequest,
} from "@/lib/knowledge";
import { SourceRegistry } from "@/lib/knowledge/source-registry";
import { FileMetaSnapshotStore } from "@/lib/knowledge/meta/meta-snapshot-store.server";

const capturedAt = "2026-08-23T06:00:00+03:00";

function request(overrides: Partial<MetaSnapshotRequest> = {}): MetaSnapshotRequest {
  return MetaSnapshotRequestSchema.parse({
    accountId: "act_809145896791225",
    objectType: "ad_account",
    level: "campaign",
    dateStart: "2026-07-24",
    dateStop: "2026-08-22",
    fields: ["impressions", "clicks", "spend"],
    filters: {},
    ...overrides,
  });
}

function page(rows: unknown[], nextPageCursor?: string, responseHeaders: Record<string, string> = {}): MetaApiPage {
  return {
    rows,
    ...(nextPageCursor ? { nextPageCursor } : {}),
    responseStatus: 200,
    responseHeaders,
  };
}

function clockWithSleeps(): { clock: MetaCollectorClock; sleeps: number[] } {
  const sleeps: number[] = [];
  return {
    sleeps,
    clock: {
      now: () => new Date(capturedAt),
      sleep: async (milliseconds) => { sleeps.push(milliseconds); },
      jitter: () => 0,
    },
  };
}

async function testScopeAndPagination(): Promise<void> {
  const calls: MetaSnapshotRequest[] = [];
  const responses = [
    page([{ campaign_id: "c1", impressions: "10", clicks: "2", spend: "3.5" }], "cursor-2", {
      "Authorization": "Bearer should-not-be-stored",
      "X-FB-Ads-Insights-Throttle": "{\"acc_id_util_pct\":10}",
    }),
    page([{ campaign_id: "c2", impressions: "20", clicks: "5", spend: "4.5" }], undefined, {
      "x-ad-account-usage": "{\"acc_id_util_pct\":12}",
    }),
  ];
  const client: MetaApiClient = {
    fetchInsightsPage: async (input) => {
      calls.push(input);
      const response = responses.shift();
      assert.ok(response);
      return response;
    },
  };
  const store = new InMemoryMetaSnapshotStore();
  const collector = new MetaSnapshotCollector(client, store, { maxPages: 10 }, clockWithSleeps().clock);
  const result = await collector.collect(request());

  assert.equal(result.status, "complete");
  assert.equal(result.rows.length, 2);
  assert.equal(result.pages, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].pageCursor, "cursor-2");
  assert.equal(store.getCheckpoint(result.queryHash), undefined);
  const snapshots = store.listSnapshots(result.queryHash);
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].responseHeaders["authorization"], undefined);
  assert.equal(snapshots[0].responseHeaders["x-fb-ads-insights-throttle"], "{\"acc_id_util_pct\":10}");

  assert.throws(
    () => request({ accountId: "act_500582941742076" as never }),
    /Invalid enum value/,
  );
}

async function testQueueSerializesRequests(): Promise<void> {
  let inFlight = 0;
  let maxInFlight = 0;
  const client: MetaApiClient = {
    fetchInsightsPage: async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return page([{ impressions: "1", clicks: "1", spend: "0.1" }]);
    },
  };
  const collector = new MetaSnapshotCollector(client, new InMemoryMetaSnapshotStore(), {}, clockWithSleeps().clock);
  const queue = new MetaSnapshotQueue(collector);
  const results = await Promise.all([
    queue.enqueue(request({ accountId: "act_809145896791225", dateStop: "2026-08-20" })),
    queue.enqueue(request({ accountId: "act_1259153761545048", dateStop: "2026-08-21" })),
  ]);
  assert.equal(results.every((result) => result.status === "complete"), true);
  assert.equal(maxInFlight, 1);
  assert.equal(queue.pending(), 0);
}

async function testCache(): Promise<void> {
  let calls = 0;
  const client: MetaApiClient = {
    fetchInsightsPage: async () => {
      calls += 1;
      return page([{ impressions: "1", clicks: "1", spend: "0.1" }]);
    },
  };
  const collector = new MetaSnapshotCollector(client, new InMemoryMetaSnapshotStore(), {}, clockWithSleeps().clock);
  const first = await collector.collect(request());
  const second = await collector.collect(request());
  assert.equal(first.status, "complete");
  assert.equal(second.status, "cached");
  assert.equal(calls, 1);
}

async function testBackoffAndCircuitBreaker(): Promise<void> {
  const { clock, sleeps } = clockWithSleeps();
  let calls = 0;
  const rateLimited: MetaApiPage = {
    rows: [],
    responseStatus: 403,
    responseHeaders: { "x-fb-ads-insights-throttle": "limit" },
    error: { code: 4, subcode: 1504022, message: "Too many API requests", transient: true },
  };
  const client: MetaApiClient = {
    fetchInsightsPage: async () => {
      calls += 1;
      return rateLimited;
    },
  };
  const store = new InMemoryMetaSnapshotStore();
  const collector = new MetaSnapshotCollector(client, store, {
    maxRetries: 2,
    backoffBaseMs: 100,
    backoffMaxMs: 1_000,
    jitterMaxMs: 0,
    circuitThreshold: 1,
    circuitCooldownMs: 900_000,
  }, clock);

  const first = await collector.collect(request({ breakdown: "publisher_platform" }));
  assert.equal(first.status, "rate_limited");
  assert.equal(calls, 3);
  assert.deepEqual(sleeps, [100, 200]);
  assert.match(first.limitations.join(" "), /Meta throttling/);
  const second = await collector.collect(request({ breakdown: "publisher_platform" }));
  assert.equal(second.status, "circuit_open");
  assert.equal(calls, 3);
}

async function testNonRetryableFailure(): Promise<void> {
  let calls = 0;
  const client: MetaApiClient = {
    fetchInsightsPage: async () => {
      calls += 1;
      return {
        rows: [],
        responseStatus: 401,
        responseHeaders: {},
        error: { code: 190, message: "Invalid OAuth access token", transient: false },
      };
    },
  };
  const collector = new MetaSnapshotCollector(client, new InMemoryMetaSnapshotStore(), {}, clockWithSleeps().clock);
  const result = await collector.collect(request());
  assert.equal(result.status, "failed");
  assert.equal(result.retries, 0);
  assert.equal(calls, 1);
}

async function testFileStoreRoundTrip(): Promise<void> {
  const rootDirectory = mkdtempSync(join(tmpdir(), "meta-snapshot-store-"));
  try {
    const store = new FileMetaSnapshotStore({ rootDirectory });
    const client: MetaApiClient = {
      fetchInsightsPage: async () => page([{ impressions: "4", clicks: "1", spend: "2" }], undefined, {
        Authorization: "Bearer must-not-be-persisted",
        "x-ad-account-usage": "safe-usage-header",
      }),
    };
    const collector = new MetaSnapshotCollector(client, store, {}, clockWithSleeps().clock);
    const result = await collector.collect(request({ accountId: "act_1259153761545048", breakdown: "country" }));
    assert.equal(result.status, "complete");
    assert.equal(store.getCollection(result.queryHash)?.status, "complete");
    assert.equal(store.listSnapshots(result.queryHash).length, 1);
    assert.equal(store.getCheckpoint(result.queryHash), undefined);
    assert.equal(store.listSnapshots(result.queryHash)[0].responseHeaders.authorization, undefined);
    assert.equal(store.listSnapshots(result.queryHash)[0].responseHeaders["x-ad-account-usage"], "safe-usage-header");
  } finally {
    rmSync(rootDirectory, { recursive: true, force: true });
  }
}

async function testEvidenceAdapter(): Promise<void> {
  const { clock } = clockWithSleeps();
  const client: MetaApiClient = {
    fetchInsightsPage: async () => page([{ impressions: "100", clicks: "10", spend: "25", actions: [{ action_type: "link_click", value: "4" }] }]),
  };
  const collector = new MetaSnapshotCollector(client, new InMemoryMetaSnapshotStore(), {}, clock);
  const collection = await collector.collect(request({ accountId: "act_1259153761545048", breakdown: "country" }));
  const pkg = buildMetaEvidencePackage(new SourceRegistry(), {
    collection,
    market: "EG",
    industry: "unclassified",
    locale: "ar",
    currency: "EGP",
    capturedAt,
  });
  assert.equal(pkg.status, "ready");
  assert.equal(pkg.freshnessStatus, "fresh");
  assert.ok(pkg.sourceRecords.every((source) => source.sourceType === "client_data"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Meta spend"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Meta action: link_click"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Reach" && fact.status === "unavailable"));
  assert.match(pkg.snapshots[0].limitations.join(" "), /not be presented as market-validated/);
}

async function main(): Promise<void> {
  await testScopeAndPagination();
  await testQueueSerializesRequests();
  await testCache();
  await testBackoffAndCircuitBreaker();
  await testNonRetryableFailure();
  await testFileStoreRoundTrip();
  await testEvidenceAdapter();
  console.log("Meta Snapshot Collector regression: 7/7 scenarios PASS");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

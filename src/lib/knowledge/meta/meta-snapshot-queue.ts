import type { MetaCollectionResult, MetaScopedAccountId, MetaSnapshotRequest } from "./meta-snapshot-contracts";
import { MetaSnapshotCollector } from "./meta-snapshot-collector";

export class MetaSnapshotQueue {
  private globalTail: Promise<void> = Promise.resolve();
  private readonly accountTails = new Map<MetaScopedAccountId, Promise<void>>();

  constructor(private readonly collector: MetaSnapshotCollector) {}

  enqueue(request: MetaSnapshotRequest): Promise<MetaCollectionResult> {
    const accountTail = this.accountTails.get(request.accountId) ?? Promise.resolve();
    const scheduled = Promise.all([accountTail, this.globalTail])
      .then(() => this.collector.collect(request));
    const tail = scheduled.then(() => undefined, () => undefined);
    this.accountTails.set(request.accountId, tail);
    this.globalTail = tail;

    void tail.then(() => {
      if (this.accountTails.get(request.accountId) === tail) this.accountTails.delete(request.accountId);
    });
    return scheduled;
  }

  pending(accountId?: MetaScopedAccountId): number {
    if (accountId) return this.accountTails.has(accountId) ? 1 : 0;
    return this.accountTails.size;
  }
}

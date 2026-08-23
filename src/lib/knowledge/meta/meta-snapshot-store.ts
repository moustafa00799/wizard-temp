import {
  MetaCheckpointSchema,
  MetaSnapshotRecordSchema,
  MetaStoredCollectionSchema,
  type MetaCheckpoint,
  type MetaSnapshotRecord,
  type MetaStoredCollection,
} from "./meta-snapshot-contracts";

export interface MetaSnapshotStore {
  getCollection(queryHash: string): MetaStoredCollection | undefined;
  putCollection(collection: MetaStoredCollection): void;
  appendSnapshot(snapshot: MetaSnapshotRecord): void;
  listSnapshots(queryHash: string): MetaSnapshotRecord[];
  getCheckpoint(queryHash: string): MetaCheckpoint | undefined;
  putCheckpoint(checkpoint: MetaCheckpoint): void;
  clearCheckpoint(queryHash: string): void;
}

export class InMemoryMetaSnapshotStore implements MetaSnapshotStore {
  private readonly collections = new Map<string, MetaStoredCollection>();
  private readonly snapshots = new Map<string, MetaSnapshotRecord[]>();
  private readonly checkpoints = new Map<string, MetaCheckpoint>();

  getCollection(queryHash: string): MetaStoredCollection | undefined {
    const collection = this.collections.get(queryHash);
    return collection ? MetaStoredCollectionSchema.parse(collection) : undefined;
  }

  putCollection(collection: MetaStoredCollection): void {
    const parsed = MetaStoredCollectionSchema.parse(collection);
    this.collections.set(parsed.queryHash, parsed);
  }

  appendSnapshot(snapshot: MetaSnapshotRecord): void {
    const parsed = MetaSnapshotRecordSchema.parse(snapshot);
    const current = this.snapshots.get(parsed.queryHash) ?? [];
    if (!current.some((item) => item.snapshotId === parsed.snapshotId)) current.push(parsed);
    this.snapshots.set(parsed.queryHash, current);
  }

  listSnapshots(queryHash: string): MetaSnapshotRecord[] {
    return (this.snapshots.get(queryHash) ?? []).map((snapshot) => MetaSnapshotRecordSchema.parse(snapshot));
  }

  getCheckpoint(queryHash: string): MetaCheckpoint | undefined {
    const checkpoint = this.checkpoints.get(queryHash);
    return checkpoint ? MetaCheckpointSchema.parse(checkpoint) : undefined;
  }

  putCheckpoint(checkpoint: MetaCheckpoint): void {
    const parsed = MetaCheckpointSchema.parse(checkpoint);
    this.checkpoints.set(parsed.queryHash, parsed);
  }

  clearCheckpoint(queryHash: string): void {
    this.checkpoints.delete(queryHash);
  }
}

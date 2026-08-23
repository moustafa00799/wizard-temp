import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  MetaCheckpointSchema,
  MetaSnapshotRecordSchema,
  MetaStoredCollectionSchema,
  type MetaCheckpoint,
  type MetaSnapshotRecord,
  type MetaStoredCollection,
} from "./meta-snapshot-contracts";
import type { MetaSnapshotStore } from "./meta-snapshot-store";

export type FileMetaSnapshotStoreOptions = {
  rootDirectory: string;
};

export class FileMetaSnapshotStore implements MetaSnapshotStore {
  constructor(private readonly options: FileMetaSnapshotStoreOptions) {}

  getCollection(queryHash: string): MetaStoredCollection | undefined {
    return this.readAndParse(`collections/${queryHash}.json`, MetaStoredCollectionSchema.parse);
  }

  putCollection(collection: MetaStoredCollection): void {
    this.writeJson(`collections/${collection.queryHash}.json`, MetaStoredCollectionSchema.parse(collection));
  }

  appendSnapshot(snapshot: MetaSnapshotRecord): void {
    const parsed = MetaSnapshotRecordSchema.parse(snapshot);
    const snapshots = this.listSnapshots(parsed.queryHash);
    if (snapshots.some((item) => item.snapshotId === parsed.snapshotId)) return;
    const updated = [...snapshots, parsed];
    this.writeJson(`snapshots/${parsed.queryHash}.manifest.json`, updated);
    this.writeJson(
      `snapshots/${parsed.snapshotId.replace(/[^a-zA-Z0-9._:-]/g, "_")}.json`,
      parsed,
    );
  }

  listSnapshots(queryHash: string): MetaSnapshotRecord[] {
    const manifest = this.readAndParse(
      `snapshots/${queryHash}.manifest.json`,
      (value) => MetaSnapshotRecordSchema.array().parse(value),
    );
    return manifest ?? [];
  }

  getCheckpoint(queryHash: string): MetaCheckpoint | undefined {
    return this.readAndParse(`checkpoints/${queryHash}.json`, MetaCheckpointSchema.parse);
  }

  putCheckpoint(checkpoint: MetaCheckpoint): void {
    const parsed = MetaCheckpointSchema.parse(checkpoint);
    this.writeJson(`checkpoints/${parsed.queryHash}.json`, parsed);
  }

  clearCheckpoint(queryHash: string): void {
    const path = join(this.options.rootDirectory, `checkpoints/${queryHash}.json`);
    if (existsSync(path)) unlinkSync(path);
  }

  private writeJson(relativePath: string, value: unknown): void {
    const target = join(this.options.rootDirectory, relativePath);
    const temporary = `${target}.tmp`;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: "utf-8", mode: 0o600 });
    renameSync(temporary, target);
  }

  private readAndParse<T>(relativePath: string, parse: (value: unknown) => T): T | undefined {
    const target = join(this.options.rootDirectory, relativePath);
    if (!existsSync(target)) return undefined;
    try {
      return parse(JSON.parse(readFileSync(target, "utf-8")));
    } catch {
      return undefined;
    }
  }
}

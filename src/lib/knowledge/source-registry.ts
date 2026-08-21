import {
  KnowledgeCurrencySchema,
  KnowledgeLocaleSchema,
  KnowledgeMarketSchema,
  SourceRecordSchema,
  type FreshnessPolicy,
  type KnowledgeCurrency,
  type KnowledgeLocale,
  type KnowledgeMarket,
  type SourceRecord,
} from "@/lib/contracts/knowledge";

export type SourceRegistryScope = {
  market?: KnowledgeMarket;
  industry?: string;
  language?: KnowledgeLocale;
  currency?: KnowledgeCurrency;
};

export type SourceFreshness = {
  status: "fresh" | "stale" | "expired" | "missing";
  observedAt?: string;
  expiresAt?: string;
  reason: string;
};

export type SourceRegistryLookup = {
  sourceId: string;
  source: SourceRecord;
  freshness: SourceFreshness;
};

const POLICY_DURATIONS_MS: Record<Exclude<FreshnessPolicy, "on_demand">, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 31 * 24 * 60 * 60 * 1000,
};

function normalizeIndustry(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function hasScopeValue(sourceValue: string | undefined, requestedValue: string | undefined): boolean {
  if (!requestedValue) return true;
  return sourceValue === requestedValue;
}

function freshnessFor(source: SourceRecord, now: Date): SourceFreshness {
  const observedAt = new Date(source.observedAt);
  if (Number.isNaN(observedAt.getTime())) {
    return {
      status: "expired",
      observedAt: source.observedAt,
      reason: "Source observedAt is not a valid timestamp.",
    };
  }

  if (source.freshnessPolicy === "on_demand") {
    return {
      status: "fresh",
      observedAt: source.observedAt,
      reason: "Source is configured for on-demand freshness and requires an explicit retrieval decision.",
    };
  }

  const duration = POLICY_DURATIONS_MS[source.freshnessPolicy];
  const expiresAtDate = new Date(observedAt.getTime() + duration);
  const expiresAt = expiresAtDate.toISOString();
  const ageMs = now.getTime() - observedAt.getTime();

  if (ageMs < 0) {
    return {
      status: "fresh",
      observedAt: source.observedAt,
      expiresAt,
      reason: "Source observation is in the future relative to the supplied clock; no staleness is inferred.",
    };
  }
  if (ageMs <= duration * 0.8) {
    return { status: "fresh", observedAt: source.observedAt, expiresAt, reason: "Source is within its freshness policy." };
  }
  if (ageMs <= duration) {
    return { status: "stale", observedAt: source.observedAt, expiresAt, reason: "Source is close to the end of its freshness policy." };
  }
  return { status: "expired", observedAt: source.observedAt, expiresAt, reason: "Source exceeded its freshness policy." };
}

export class SourceRegistry {
  private readonly records = new Map<string, Map<string, SourceRecord>>();

  constructor(records: SourceRecord[] = []) {
    for (const record of records) this.register(record);
  }

  register(recordInput: SourceRecord): SourceRecord {
    const record = SourceRecordSchema.parse(recordInput);
    const versions = this.records.get(record.sourceId) ?? new Map<string, SourceRecord>();
    const existing = versions.get(record.version);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(record)) {
        throw new Error(`Source ${record.sourceId} already exists with version ${record.version} and different content.`);
      }
      return existing;
    }
    versions.set(record.version, record);
    this.records.set(record.sourceId, versions);
    return record;
  }

  get(sourceId: string, version?: string): SourceRecord | undefined {
    const versions = this.records.get(sourceId);
    if (!versions) return undefined;
    if (version) return versions.get(version);
    return [...versions.values()].sort((left, right) => {
      const observedDelta = new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime();
      return observedDelta || right.version.localeCompare(left.version);
    })[0];
  }

  getVersion(sourceId: string, version: string): SourceRecord | undefined {
    return this.get(sourceId, version);
  }

  require(sourceId: string, version?: string): SourceRecord {
    const source = this.get(sourceId, version);
    if (!source) {
      throw new Error(version ? `Source ${sourceId} version ${version} is not registered.` : `Source ${sourceId} is not registered.`);
    }
    return source;
  }

  list(): SourceRecord[] {
    return [...this.records.keys()]
      .map((sourceId) => this.get(sourceId))
      .filter((source): source is SourceRecord => Boolean(source))
      .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  }

  listVersions(sourceId: string): SourceRecord[] {
    return [...(this.records.get(sourceId)?.values() ?? [])]
      .sort((left, right) => new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime());
  }

  lookup(scope: SourceRegistryScope = {}, now = new Date()): SourceRegistryLookup[] {
    const industry = normalizeIndustry(scope.industry);
    return this.list()
      .filter((source) => source.enabled)
      .filter((source) => hasScopeValue(source.market, scope.market))
      .filter((source) => hasScopeValue(normalizeIndustry(source.industry), industry))
      .filter((source) => hasScopeValue(source.language, scope.language))
      .map((source) => ({ sourceId: source.sourceId, source, freshness: freshnessFor(source, now) }));
  }

  freshness(sourceId: string, now = new Date(), version?: string): SourceFreshness {
    const source = this.get(sourceId, version);
    if (!source || !source.enabled) {
      return { status: "missing", reason: `Source ${sourceId} is not enabled in the registry.` };
    }
    return freshnessFor(source, now);
  }

  assertUsable(sourceId: string, scope: SourceRegistryScope = {}, now = new Date(), version?: string): SourceRegistryLookup {
    const source = this.get(sourceId, version);
    if (!source || !source.enabled) throw new Error(`Source ${sourceId} is unavailable or disabled.`);
    const matches = this.lookup(scope, now).find((candidate) => candidate.sourceId === sourceId && candidate.source.version === source.version);
    if (!matches) throw new Error(`Source ${sourceId} does not cover the requested market, industry, or language scope.`);
    if (matches.source.licenseStatus !== "approved") {
      throw new Error(`Source ${sourceId} cannot be used as approved evidence while licenseStatus=${matches.source.licenseStatus}.`);
    }
    if (matches.freshness.status === "expired") {
      throw new Error(`Source ${sourceId} is expired and cannot be used without refresh.`);
    }
    return matches;
  }
}

export function parseSourceRegistry(records: unknown[]): SourceRegistry {
  const registry = new SourceRegistry();
  for (const record of records) registry.register(SourceRecordSchema.parse(record));
  return registry;
}

export function isKnowledgeMarket(value: unknown): value is KnowledgeMarket {
  return KnowledgeMarketSchema.safeParse(value).success;
}

export function isKnowledgeLocale(value: unknown): value is KnowledgeLocale {
  return KnowledgeLocaleSchema.safeParse(value).success;
}

export function isKnowledgeCurrency(value: unknown): value is KnowledgeCurrency {
  return KnowledgeCurrencySchema.safeParse(value).success;
}

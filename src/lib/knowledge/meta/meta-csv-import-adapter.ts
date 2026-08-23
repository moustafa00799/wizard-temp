import type {
  KnowledgeCurrency,
  KnowledgeLocale,
} from "@/lib/contracts/knowledge";
import {
  isMetaScopedAccountId,
  type MetaCollectionResult,
  type MetaEntityLevel,
  type MetaScopedAccountId,
} from "./meta-snapshot-contracts";

export type MetaCsvEntityLevel = Extract<MetaEntityLevel, "campaign" | "adset" | "ad">;

export type MetaCsvImportInput = {
  accountId: MetaScopedAccountId;
  entityLevel: MetaCsvEntityLevel;
  dateStart: string;
  dateStop: string;
  capturedAt: string;
  csvText: string;
  fileName?: string;
  currency: KnowledgeCurrency;
  locale: KnowledgeLocale;
};

export type MetaCsvNormalizedRow = {
  account_id: MetaScopedAccountId;
  entity_level: MetaCsvEntityLevel;
  reporting_start?: string;
  reporting_end?: string;
  name?: string;
  delivery?: string;
  attribution_setting?: string;
  country?: string;
  publisher_platform?: string;
  results?: number;
  result_indicator?: string;
  reach?: number;
  frequency?: number;
  cost_per_results?: number;
  spend?: number;
  impressions?: number;
  cpm?: number;
  inline_link_clicks?: number;
  clicks?: number;
  ctr_link?: number;
  all_clicks?: number;
  ctr_all?: number;
  cpc_all?: number;
  landing_page_views?: number;
  cost_per_landing_page_view?: number;
  raw: Record<string, string>;
};

export type MetaCsvImportMetadata = {
  sourceId: string;
  sourceName: "Meta Ads Manager official CSV export";
  sourceUrl: "https://www.facebook.com/adsmanager";
  accountId: MetaScopedAccountId;
  entityLevel: MetaCsvEntityLevel;
  dateStart: string;
  dateStop: string;
  capturedAt: string;
  currency: KnowledgeCurrency;
  locale: KnowledgeLocale;
  fileName?: string;
  headers: string[];
  normalizedHeaders: string[];
  rowCount: number;
  availableFields: string[];
  missingFields: string[];
};

export type MetaCsvImportResult = {
  collection: MetaCollectionResult;
  metadata: MetaCsvImportMetadata;
};

const ENTITY_NAME_HEADERS: Record<MetaCsvEntityLevel, string> = {
  campaign: "campaign name",
  adset: "ad set name",
  ad: "ad name",
};

const FIELD_LABELS: Record<string, string> = {
  campaign_id: "campaign ID",
  adset_id: "ad set ID",
  ad_id: "ad ID",
  objective: "objective",
  actions: "actions",
  conversion_value: "conversion value",
  roas: "ROAS",
  country: "country breakdown",
  publisher_platform: "publisher platform breakdown",
  placement: "placement breakdown",
  creative: "creative copy and media metadata",
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseCsvRows(csvText: string): string[][] {
  const text = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function numericValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.trim();
  if (cleaned === "" || cleaned === "-" || /^n\/?a$/i.test(cleaned)) return undefined;
  const parsed = Number(cleaned.replace(/[,\s%]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function token(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function headerIndex(headers: string[], matcher: string | RegExp): number | undefined {
  const index = headers.findIndex((header) => typeof matcher === "string" ? header === matcher : matcher.test(header));
  return index >= 0 ? index : undefined;
}

function stringAt(row: string[], headers: string[], matcher: string | RegExp): string | undefined {
  const index = headerIndex(headers, matcher);
  const value = index === undefined ? undefined : row[index]?.trim();
  return value ? value : undefined;
}

function numberAt(row: string[], headers: string[], matcher: string | RegExp): number | undefined {
  return numericValue(stringAt(row, headers, matcher));
}

function rawRecord(row: string[], originalHeaders: string[]): Record<string, string> {
  return Object.fromEntries(originalHeaders.map((header, index) => [header, row[index] ?? ""]));
}

function supportedFields(headers: string[]): string[] {
  const fields: Array<[string, string | RegExp]> = [
    ["reporting_start", "reporting starts"],
    ["reporting_end", "reporting ends"],
    ["name", /^(campaign|ad set|ad) name$/],
    ["delivery", /^(campaign|ad set|ad) delivery$/],
    ["attribution_setting", "attribution setting"],
    ["country", /^country$/],
    ["publisher_platform", /^(publisher platform|publisher_platform|platform)$/],
    ["results", "results"],
    ["result_indicator", "result indicator"],
    ["reach", "reach"],
    ["frequency", "frequency"],
    ["cost_per_results", "cost per results"],
    ["spend", /^amount spent \([^)]+\)$/],
    ["impressions", "impressions"],
    ["cpm", /^cpm \(cost per 1,000 impressions\)/],
    ["inline_link_clicks", "link clicks"],
    ["clicks", "clicks (all)"],
    ["ctr_link", "ctr (link click-through rate)"],
    ["all_clicks", "clicks (all)"],
    ["ctr_all", "ctr (all)"],
    ["cpc_all", "cpc (all) (egp)"],
    ["landing_page_views", "landing page views"],
    ["cost_per_landing_page_view", "cost per landing page view (egp)"],
  ];
  return fields.filter(([, matcher]) => headerIndex(headers, matcher) !== undefined).map(([name]) => name);
}

function missingFields(headers: string[]): string[] {
  const checks: Array<[string, string | RegExp]> = [
    ["campaign_id", /^(campaign|campaign id)$/],
    ["adset_id", /^(ad set id|adset id)$/],
    ["ad_id", /^(ad id)$/],
    ["objective", "objective"],
    ["actions", /^actions?$/],
    ["conversion_value", /conversion value/],
    ["roas", /\broas\b/],
    ["country", /country/],
    ["publisher_platform", /^(publisher platform|publisher_platform|platform)$/],
    ["placement", /placement|platform position/],
    ["creative", /creative|primary text|headline|description/],
  ];
  return checks
    .filter(([, matcher]) => headerIndex(headers, matcher) === undefined)
    .map(([key]) => FIELD_LABELS[key]);
}

function normalizedRow(
  row: string[],
  originalHeaders: string[],
  headers: string[],
  accountId: MetaScopedAccountId,
  entityLevel: MetaCsvEntityLevel,
): MetaCsvNormalizedRow {
  const allClicks = numberAt(row, headers, "clicks (all)");
  return {
    account_id: accountId,
    entity_level: entityLevel,
    reporting_start: stringAt(row, headers, "reporting starts"),
    reporting_end: stringAt(row, headers, "reporting ends"),
    name: stringAt(row, headers, ENTITY_NAME_HEADERS[entityLevel]),
    delivery: stringAt(row, headers, /^(campaign|ad set|ad) delivery$/),
    attribution_setting: stringAt(row, headers, "attribution setting"),
    country: stringAt(row, headers, /^country$/),
    publisher_platform: stringAt(row, headers, /^(publisher platform|publisher_platform|platform)$/),
    results: numberAt(row, headers, "results"),
    result_indicator: stringAt(row, headers, "result indicator"),
    reach: numberAt(row, headers, "reach"),
    frequency: numberAt(row, headers, "frequency"),
    cost_per_results: numberAt(row, headers, "cost per results"),
    spend: numberAt(row, headers, /^amount spent \([^)]+\)$/),
    impressions: numberAt(row, headers, "impressions"),
    cpm: numberAt(row, headers, /^cpm \(cost per 1,000 impressions\)/),
    inline_link_clicks: numberAt(row, headers, "link clicks"),
    clicks: allClicks,
    ctr_link: numberAt(row, headers, "ctr (link click-through rate)"),
    all_clicks: allClicks,
    ctr_all: numberAt(row, headers, "ctr (all)"),
    cpc_all: numberAt(row, headers, /^cpc \(all\) \([^)]+\)$/),
    landing_page_views: numberAt(row, headers, "landing page views"),
    cost_per_landing_page_view: numberAt(row, headers, /^cost per landing page view \([^)]+\)$/),
    raw: rawRecord(row, originalHeaders),
  };
}

export function importMetaAdsManagerCsv(input: MetaCsvImportInput): MetaCsvImportResult {
  if (!isMetaScopedAccountId(input.accountId)) {
    throw new Error(`Meta CSV import rejected account outside allowlist: ${input.accountId}`);
  }
  const rows = parseCsvRows(input.csvText);
  const originalHeaders = rows[0]?.map((header) => header.trim()) ?? [];
  const headers = originalHeaders.map(normalizeHeader);
  if (headers.length === 0) throw new Error("Meta CSV import requires a header row.");
  const nameHeader = ENTITY_NAME_HEADERS[input.entityLevel];
  if (headerIndex(headers, nameHeader) === undefined) {
    throw new Error(`Meta CSV export is missing the expected ${nameHeader} column.`);
  }

  const normalizedRows = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => normalizedRow(row, originalHeaders, headers, input.accountId, input.entityLevel));
  const queryHash = `meta-csv-${input.accountId}-${input.entityLevel}-${input.dateStart}-${input.dateStop}-${token(headers.join("|"))}`;
  const snapshotId = `meta-csv-snapshot-${token(queryHash)}`;
  const missing = missingFields(headers);
  const limitations = [
    "Official Meta Ads Manager CSV export; account-owned operational evidence, not a market benchmark.",
    "The export reflects the selected current view and may exclude unpublished entities.",
    "Reach, frequency, cost metrics, and result fields are retained per row; the Evidence adapter does not aggregate non-additive metrics across rows.",
    "The Actions column is not assumed available unless it appears as an explicit CSV field.",
    ...missing.map((field) => `Unavailable in this CSV export: ${field}.`),
  ];
  const availableFields = supportedFields(headers);
  const sourceId = `meta-csv-${input.accountId}-${input.entityLevel}-${input.dateStart}-${input.dateStop}`;
  return {
    collection: {
      queryHash,
      accountId: input.accountId,
      status: "complete",
      rows: normalizedRows,
      snapshotIds: [snapshotId],
      pages: 1,
      retries: 0,
      limitations,
    },
    metadata: {
      sourceId,
      sourceName: "Meta Ads Manager official CSV export",
      sourceUrl: "https://www.facebook.com/adsmanager",
      accountId: input.accountId,
      entityLevel: input.entityLevel,
      dateStart: input.dateStart,
      dateStop: input.dateStop,
      capturedAt: input.capturedAt,
      currency: input.currency,
      locale: input.locale,
      ...(input.fileName ? { fileName: input.fileName } : {}),
      headers: originalHeaders,
      normalizedHeaders: headers,
      rowCount: normalizedRows.length,
      availableFields,
      missingFields: missing,
    },
  };
}

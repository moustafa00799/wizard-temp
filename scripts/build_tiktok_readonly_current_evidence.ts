import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { normalizeTikTokReadOnly, type TikTokReadOnlyFileInput } from "@/lib/knowledge/providers/tiktok-readonly-normalizer";

const privateRoot = resolve(process.env.TIKTOK_PRIVATE_ROOT ?? "/home/ubuntu/tiktok_exports/2026-08-26/current-auth");
const outputPath = resolve(process.env.TIKTOK_OUTPUT ?? join(privateRoot, "tiktok-readonly-normalized.json"));
const generatedAt = process.env.TIKTOK_GENERATED_AT ?? "2026-08-27T00:00:00.000Z";
const performanceWindow = { startDate: "2026-08-23", endDate: "2026-08-26" } as const;

const accountDefinitions = [
  { accountId: "7215064338044944385", accountName: "Plan B0327", country: "EG", currency: "EGP" as const, timezone: "Africa/Cairo", files: [
    { fileName: "2026-08-26_21-53-44.623585693_tiktok-for-business_report_integrated_get_a98d5c0c.json", dataClass: "performance" as const, entityLevel: "campaign" as const, dimensions: ["campaign_id"], metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"], dateStart: performanceWindow.startDate, dateStop: performanceWindow.endDate },
  ] },
  { accountId: "7302642673201119233", accountName: "Mr Moustafa", country: "EG", currency: "EGP" as const, timezone: "Africa/Cairo", files: [
    { fileName: "2026-08-26_21-54-10.408100357_tiktok-for-business_report_integrated_get_4343f88e.json", dataClass: "performance" as const, entityLevel: "campaign" as const, dimensions: ["campaign_id"], metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"], dateStart: performanceWindow.startDate, dateStop: performanceWindow.endDate },
  ] },
  { accountId: "7304560039707328514", accountName: "Deega", country: "EG", currency: "EGP" as const, timezone: "Africa/Cairo", files: [
    { fileName: "2026-08-26_21-54-53.233139053_tiktok-for-business_report_integrated_get_b4d7342d.json", dataClass: "performance" as const, entityLevel: "campaign" as const, dimensions: ["campaign_id"], metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"], dateStart: performanceWindow.startDate, dateStop: performanceWindow.endDate },
    { fileName: "2026-08-26_21-52-47.391234280_tiktok-for-business_adgroup_get_83527823.json", dataClass: "inventory" as const, entityLevel: "ad_group" as const, dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "adgroup_name", "operation_status", "secondary_status"], metrics: [], limitation: "The bounded read-only result returned no rows; this is not evidence that the advertiser has never had ad groups." },
    { fileName: "2026-08-26_21-55-50.070442283_tiktok-for-business_ad_get_5025204a.json", dataClass: "creative" as const, entityLevel: "ad" as const, dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "ad_id", "ad_name", "operation_status", "secondary_status"], metrics: [], limitation: "The bounded read-only result returned no rows; this is not evidence that the advertiser has never had creatives." },
  ] },
  { accountId: "7556312373204795409", accountName: "windoor solutions", country: "EG", currency: "EGP" as const, timezone: "Etc/GMT-2", files: [
    { fileName: "2026-08-26_21-54-32.569802605_tiktok-for-business_report_integrated_get_d31ed52b.json", dataClass: "performance" as const, entityLevel: "campaign" as const, dimensions: ["campaign_id"], metrics: ["spend", "impressions", "clicks", "reach", "frequency", "cpc", "cpm", "ctr"], dateStart: performanceWindow.startDate, dateStop: performanceWindow.endDate },
    { fileName: "2026-08-26_21-52-16.019214724_tiktok-for-business_adgroup_get_0c0a78a4.json", dataClass: "inventory" as const, entityLevel: "ad_group" as const, dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "adgroup_name", "operation_status", "secondary_status"], metrics: [], limitation: "This is a current bounded inventory snapshot; it is not a historical census." },
    { fileName: "2026-08-26_21-55-31.964219022_tiktok-for-business_ad_get_fcfd863f.json", dataClass: "creative" as const, entityLevel: "ad" as const, dimensions: ["advertiser_id", "campaign_id", "adgroup_id", "ad_id", "ad_name", "operation_status", "secondary_status"], metrics: [], limitation: "Creative text, landing-page URLs, phone fields, and asset identifiers remain only in the private raw snapshot." },
  ] },
] as const;

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

type ManifestFile = { file: string; sha256: string };
type PrivateManifest = { files?: Record<string, ManifestFile> };

function loadManifest(): PrivateManifest {
  const path = join(privateRoot, "MANIFEST.json");
  if (!existsSync(path)) throw new Error(`Missing TikTok private manifest: ${path}`);
  const manifest = JSON.parse(readFileSync(path, "utf8")) as PrivateManifest;
  if (!manifest.files || typeof manifest.files !== "object") throw new Error("TikTok private manifest has no files section.");
  return manifest;
}

const privateManifest = loadManifest();

function readJson(fileName: string): { raw: unknown; rawSha256: string } {
  const path = join(privateRoot, fileName);
  if (!existsSync(path)) throw new Error(`Missing private TikTok snapshot: ${path}`);
  const bytes = readFileSync(path);
  const rawSha256 = sha256(bytes);
  const manifestEntry = Object.values(privateManifest.files ?? {}).find((entry) => entry.file === fileName);
  if (!manifestEntry) throw new Error(`Snapshot ${fileName} is not listed in the TikTok private manifest.`);
  if (manifestEntry.sha256 !== rawSha256) throw new Error(`Hash mismatch for private TikTok snapshot ${fileName}.`);
  return { raw: JSON.parse(bytes.toString("utf8")), rawSha256 };
}

const accounts = accountDefinitions.map((account) => ({
  ...account,
  // Advertiser access is present, but project ownership/industry/market mapping
  // remains unverified. Marking files partial prevents package promotion.
  scopeStatus: "unverified" as const,
  files: account.files.map((file): TikTokReadOnlyFileInput => {
    const loaded = readJson(file.fileName);
    return {
      ...file,
      dimensions: [...file.dimensions],
      metrics: [...file.metrics],
      raw: loaded.raw,
      rawSha256: loaded.rawSha256,
      partial: true,
      limitation: `${"limitation" in file && file.limitation ? `${file.limitation} ` : ""}Project account/industry/market mapping remains unverified; no Evidence Package is promoted.`,
    };
  }),
}));

const output = normalizeTikTokReadOnly({ generatedAt, newPerformanceWindow: performanceWindow, accounts });
const sanitized = {
  ...output,
  accounts: output.accounts.map((account) => ({
    ...account,
    collections: account.collections.map((collection) => ({
      ...collection,
      rows: [],
      metadata: { ...collection.metadata, rawRowsOmittedFromSanitizedOutput: true },
    })),
  })),
  rawRowsOmittedFromSanitizedOutput: true,
  privateRawRoot: privateRoot,
};
writeFileSync(outputPath, `${JSON.stringify(sanitized, null, 2)}\n`);
console.log(JSON.stringify({
  outputPath,
  provider: output.provider,
  authorizationScope: output.authorizationScope,
  accountCount: output.accounts.length,
  accountIds: output.accountIds,
  collectionCount: output.accounts.reduce((sum, account) => sum + account.collections.length, 0),
  packageCount: output.packages.length,
  marketValidated: output.marketValidated,
  rawRowsOmittedFromSanitizedOutput: true,
  privateRawRoot: privateRoot,
}, null, 2));

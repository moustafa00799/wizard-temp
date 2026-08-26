import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GOOGLE_ADS_ALLOWED_ACCOUNT_IDS,
  GOOGLE_ADS_BLOCKED_ACCOUNT_ID,
  normalizeGoogleAdsReadOnly,
  type GoogleAdsReadOnlyFileInput,
  type GoogleAdsReadOnlyNormalizerInput,
} from "../src/lib/knowledge/providers/google-ads-readonly-normalizer";

const DEFAULT_ROOT = path.resolve(process.cwd(), ".local/private-research/google-ads/2026-08-26");
const DEFAULT_OUTPUT = path.resolve(DEFAULT_ROOT, "normalized-readonly-evidence.json");

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function loadHashManifest(root: string): Promise<Map<string, string>> {
  const manifest = await readFile(path.join(root, "SHA256SUMS"), "utf8");
  const hashes = new Map<string, string>();
  for (const line of manifest.split(/\r?\n/)) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (!match) continue;
    hashes.set(path.resolve(match[2]), match[1]);
  }
  return hashes;
}

async function loadAccountFiles(root: string, accountId: string, hashes: Map<string, string>): Promise<GoogleAdsReadOnlyFileInput[]> {
  const accountRoot = path.join(root, accountId);
  const files = (await readdir(accountRoot)).filter((fileName) => fileName.endsWith(".json")).sort();
  const loaded: GoogleAdsReadOnlyFileInput[] = [];
  for (const fileName of files) {
    const absolutePath = path.resolve(accountRoot, fileName);
    const buffer = await readFile(absolutePath);
    const actualHash = sha256(buffer);
    const expectedHash = hashes.get(absolutePath);
    if (expectedHash && expectedHash !== actualHash) {
      throw new Error(`Hash mismatch for private snapshot ${absolutePath}.`);
    }
    loaded.push({
      fileName,
      raw: JSON.parse(buffer.toString("utf8")) as unknown,
      rawSha256: expectedHash ?? actualHash,
    });
  }
  return loaded;
}

async function main(): Promise<void> {
  const root = path.resolve(process.env.CDKS_GOOGLE_ADS_PRIVATE_ROOT ?? DEFAULT_ROOT);
  const output = path.resolve(process.env.CDKS_GOOGLE_ADS_PRIVATE_OUTPUT ?? DEFAULT_OUTPUT);
  const hashes = await loadHashManifest(root);
  const account428Files = await loadAccountFiles(root, "4282900193", hashes);
  const account689Files = await loadAccountFiles(root, "6899137548", hashes);

  const input: GoogleAdsReadOnlyNormalizerInput = {
    generatedAt: "2026-08-26T19:20:00.000Z",
    locale: "ar",
    accounts: [
      {
        accountId: "4282900193",
        currency: "EGP",
        timezone: "Africa/Cairo",
        market: "mixed",
        industry: "mixed_or_multi_industry",
        scopeReviewStatus: "user_confirmed",
        files: account428Files,
      },
      {
        accountId: "6899137548",
        currency: "SAR",
        timezone: "Asia/Riyadh",
        market: "EG",
        industry: "local_service_general",
        scopeReviewStatus: "user_confirmed",
        files: account689Files,
      },
    ],
    blockedAccounts: [{
      accountId: GOOGLE_ADS_BLOCKED_ACCOUNT_ID,
      status: "unavailable",
      reason: "USER_PERMISSION_DENIED; no usable rows collected; no retry without a new authorization basis.",
    }],
  };

  const normalized = normalizeGoogleAdsReadOnly(input);
  if (normalized.allowedAccountIds.join(",") !== GOOGLE_ADS_ALLOWED_ACCOUNT_IDS.join(",")) {
    throw new Error("The explicit Google Ads allowlist changed unexpectedly.");
  }
  await writeFile(output, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  const summary = normalized.accounts.map((account) => ({
    accountId: account.accountId,
    market: account.market,
    industry: account.industry,
    currency: account.currency,
    collections: account.collections.length,
    campaignPartitions: account.campaignPartitions.length,
    packageCount: normalized.packages.filter((pkg) => pkg.sourceRecords.some((source) => source.sourceId.endsWith(account.accountId))).length,
    currencyMarketMismatch: account.currencyMarketMismatch,
  }));
  console.log(JSON.stringify({
    output,
    root,
    provider: normalized.provider,
    marketValidated: normalized.marketValidated,
    blockedAccounts: normalized.blockedAccounts,
    summary,
    privacy: {
      rawRowsWrittenToGit: false,
      outputIsPrivateByDefault: true,
      rawCredentialsIncluded: false,
    },
  }, null, 2));
}

void main();

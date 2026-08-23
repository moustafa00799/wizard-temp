import assert from "node:assert/strict";
import {
  buildMetaEvidencePackage,
  importMetaAdsManagerCsv,
} from "@/lib/knowledge";
import { SourceRegistry } from "@/lib/knowledge/source-registry";

const capturedAt = "2026-08-23T06:30:00+03:00";

const campaignCsv = `Reporting starts,Reporting ends,Campaign name,Campaign delivery,Attribution setting,Results,Result indicator,Reach,Frequency,Cost per results,Amount spent (EGP),Impressions,"CPM (cost per 1,000 impressions) (EGP)",Link clicks,CPC (cost per link click) (EGP),CTR (link click-through rate),Clicks (all),CTR (all),CPC (all) (EGP),Landing page views,Cost per landing page view (EGP)\n2023-07-23,2026-08-22,"Campaign, with comma",inactive,"7-day click or 1-day view",11,"Website Purchase",1988,1.25,14.95,164.4,2497,65.83,65,2.52,2.60,87,3.48,1.89,42,3.91\n2023-07-23,2026-08-22,Second campaign,off,"All conversions",,,0,0,,25.6,400,64,10,2.56,2.5,20,5,1.28,,\n`;

function testImportsOfficialCsvShape(): void {
  const result = importMetaAdsManagerCsv({
    accountId: "act_1259153761545048",
    entityLevel: "campaign",
    dateStart: "2023-07-23",
    dateStop: "2026-08-22",
    capturedAt,
    csvText: campaignCsv,
    fileName: "Nadia-Ahmed-Campaigns-Jul-23-2023-Aug-23-2026.csv",
    currency: "EGP",
    locale: "ar",
  });

  assert.equal(result.collection.status, "complete");
  assert.equal(result.collection.accountId, "act_1259153761545048");
  assert.equal(result.collection.rows.length, 2);
  assert.equal(result.collection.pages, 1);
  const first = result.collection.rows[0] as Record<string, unknown>;
  assert.equal(first.name, "Campaign, with comma");
  assert.equal(first.spend, 164.4);
  assert.equal(first.impressions, 2497);
  assert.equal(first.clicks, 87);
  assert.equal(first.landing_page_views, 42);
  assert.equal((first.raw as Record<string, string>)["Campaign name"], "Campaign, with comma");
  assert.equal(result.metadata.rowCount, 2);
  assert.ok(result.metadata.availableFields.includes("spend"));
  assert.ok(result.metadata.missingFields.includes("objective"));
  assert.ok(result.metadata.missingFields.includes("campaign ID"));
  assert.match(result.collection.limitations.join(" "), /not a market benchmark/);

  const pkg = buildMetaEvidencePackage(new SourceRegistry(), {
    collection: result.collection,
    market: "EG",
    industry: "unclassified",
    locale: "ar",
    currency: "EGP",
    capturedAt,
  });
  assert.equal(pkg.status, "ready");
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Meta spend"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Meta inline link clicks"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Meta reported clicks"));
  assert.ok(pkg.snapshots[0].facts.some((fact) => fact.name === "Reach" && fact.status === "unavailable"));
}

function testImportsBreakdownColumns(): void {
  const countryCsv = `Reporting starts,Reporting ends,Campaign name,Country,Amount spent (EGP),Impressions\n2023-07-23,2026-08-22,Country campaign,EG,12.5,1000\n`;
  const country = importMetaAdsManagerCsv({
    accountId: "act_1259153761545048",
    entityLevel: "campaign",
    dateStart: "2023-07-23",
    dateStop: "2026-08-22",
    capturedAt,
    csvText: countryCsv,
    currency: "EGP",
    locale: "ar",
  });
  const countryRow = country.collection.rows[0] as Record<string, unknown>;
  assert.equal(countryRow.country, "EG");
  assert.equal((countryRow.raw as Record<string, string>).Country, "EG");
  assert.ok(country.metadata.availableFields.includes("country"));
  assert.ok(!country.metadata.missingFields.includes("country breakdown"));

  const platformCsv = `Reporting starts,Reporting ends,Campaign name,Platform,Amount spent (EGP),Impressions\n2023-07-23,2026-08-22,Platform campaign,Facebook,8.5,500\n`;
  const platform = importMetaAdsManagerCsv({
    accountId: "act_1259153761545048",
    entityLevel: "campaign",
    dateStart: "2023-07-23",
    dateStop: "2026-08-22",
    capturedAt,
    csvText: platformCsv,
    currency: "EGP",
    locale: "ar",
  });
  const platformRow = platform.collection.rows[0] as Record<string, unknown>;
  assert.equal(platformRow.publisher_platform, "Facebook");
  assert.equal((platformRow.raw as Record<string, string>).Platform, "Facebook");
  assert.ok(platform.metadata.availableFields.includes("publisher_platform"));
  assert.ok(!platform.metadata.missingFields.includes("publisher platform breakdown"));
  const platformPackage = buildMetaEvidencePackage(new SourceRegistry(), {
    collection: platform.collection,
    market: "EG",
    industry: "unclassified",
    locale: "ar",
    currency: "EGP",
    capturedAt,
  });
  assert.ok(platformPackage.snapshots[0].facts.some((fact) => fact.name === "Meta spend by publisher platform: Facebook" && fact.value === 8.5));
  assert.ok(!platformPackage.snapshots[0].facts.some((fact) => fact.name === "Publisher platform coverage" && fact.status === "unavailable"));
}

function testRejectsOutOfScopeAccount(): void {
  assert.throws(
    () => importMetaAdsManagerCsv({
      accountId: "act_500582941742076" as never,
      entityLevel: "campaign",
      dateStart: "2023-07-23",
      dateStop: "2026-08-22",
      capturedAt,
      csvText: campaignCsv,
      currency: "EGP",
      locale: "ar",
    }),
    /outside allowlist/,
  );
}

function testRejectsWrongEntityExport(): void {
  assert.throws(
    () => importMetaAdsManagerCsv({
      accountId: "act_1259153761545048",
      entityLevel: "adset",
      dateStart: "2023-07-23",
      dateStop: "2026-08-22",
      capturedAt,
      csvText: campaignCsv,
      currency: "EGP",
      locale: "ar",
    }),
    /missing the expected ad set name column/,
  );
}

function main(): void {
  testImportsOfficialCsvShape();
  testImportsBreakdownColumns();
  testRejectsOutOfScopeAccount();
  testRejectsWrongEntityExport();
  console.log("Meta CSV import regression: 4/4 scenarios PASS");
}

main();

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-personal-staging-"));
  const databasePath = path.join(tempDir, "staging.sqlite");
  process.env.CDKS_STAGING_DB_PATH = databasePath;

  const staging = await import("../src/lib/staging");
  const { openDatabase } = await import("../src/lib/db");
  const { GET, POST } = await import("../src/app/api/staging/route");

  const overview = await staging.getPersonalStagingOverview();
assert.equal(overview.workspace.mode, "personal_staging");
assert.equal(overview.scenarios.length, 3);
assert.ok(overview.scenarios.every((scenario) => scenario.status === "completed"));
assert.equal(overview.counts.workspaces, 1);
assert.equal(overview.counts.briefs, 3);
assert.equal(overview.counts.blueprints, 3);
assert.equal(overview.counts.snapshots, 3);
assert.equal(overview.counts.evidencePackages, 3);
assert.equal(overview.counts.contexts, 3);
assert.equal(overview.counts.recommendations, 3);
assert.equal(overview.counts.approvalsPending, 3);
assert.equal(overview.governance.personalOnly, true);
assert.equal(overview.governance.externalActionsAllowed, false);
assert.equal(overview.governance.budgetSpendAllowed, false);
assert.equal(overview.governance.globalMarketValidated, false);
assert.equal(overview.tests.canonicalBlueprintMutation, false);
assert.equal(overview.tests.secretMaterialStored, false);
assert.equal(overview.tests.migrationCount, 6);
assert.equal(overview.randomizedSuite, null);

const suite = await staging.runRandomizedWizardFixtureSuite({ seed: 20260824, variantsPerCase: 3 });
assert.equal(suite.status, "PASS");
assert.equal(suite.corpusCount, 10);
assert.equal(suite.variantsPerCase, 3);
assert.equal(suite.totalRuns, 30);
assert.equal(suite.summary.pass, 30);
assert.equal(suite.summary.fail, 0);
assert.equal(suite.summary.canonicalBlueprintMutation, false);
assert.equal(suite.summary.externalActions, false);
assert.equal(suite.summary.budgetSpend, false);
assert.equal(suite.results.length, 30);
assert.ok(suite.results.every((result) => result.checks.noSecretMaterial === "pass"));
const repeatedSuite = await staging.runRandomizedWizardFixtureSuite({ seed: 20260824, variantsPerCase: 3 });
assert.deepEqual(repeatedSuite.results, suite.results);

const secondOverview = await staging.getPersonalStagingOverview();
assert.deepEqual(secondOverview.counts, overview.counts);
assert.deepEqual(secondOverview.scenarios, overview.scenarios);

for (const scenario of overview.scenarios) {
  const result = await staging.runPersonalStagingScenario(scenario.id);
  assert.equal(result.status, "completed");
  assert.equal(result.governance.generationMode, "blueprint_only");
  assert.equal(result.governance.externalActionsAllowed, false);
  assert.equal(result.governance.budgetSpendAllowed, false);
  assert.equal(result.governance.requiresHumanApproval, true);
  assert.equal(result.governance.canonicalBlueprintUnchanged, true);
  assert.equal((result.recommendation as { status: string }).status, "advisory_only");
  assert.equal((result.recommendation as { governance: { globalMarketValidated: boolean } }).governance.globalMarketValidated, false);
  assert.ok((result.recommendation as { evidenceRefs: string[] }).evidenceRefs.length > 0);
}

const apiOverview = await GET();
assert.equal(apiOverview.status, 200);
const apiOverviewJson = await apiOverview.json() as typeof overview;
assert.equal(apiOverviewJson.counts.recommendations, 3);

const apiRun = await POST(new Request("http://localhost/api/staging", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ scenarioId: "sa-ecommerce" }),
}));
assert.equal(apiRun.status, 200);
const apiRunJson = await apiRun.json() as { scenario: { id: string }; governance: { externalActionsAllowed: boolean } };
assert.equal(apiRunJson.scenario.id, "sa-ecommerce");
assert.equal(apiRunJson.governance.externalActionsAllowed, false);

const suiteApiRun = await POST(new Request("http://localhost/api/staging", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "run-suite", seed: 20260824, variantsPerCase: 3 }),
}));
assert.equal(suiteApiRun.status, 200);
const suiteApiJson = await suiteApiRun.json() as { status: string; totalRuns: number; summary: { pass: number; externalActions: boolean } };
assert.equal(suiteApiJson.status, "PASS");
assert.equal(suiteApiJson.totalRuns, 30);
assert.equal(suiteApiJson.summary.pass, 30);
assert.equal(suiteApiJson.summary.externalActions, false);

const afterSuiteOverview = await staging.getPersonalStagingOverview();
assert.equal(afterSuiteOverview.counts.stagingTestRuns, 1);
assert.equal(afterSuiteOverview.randomizedSuite?.totalRuns, 30);
assert.equal(afterSuiteOverview.randomizedSuite?.status, "completed");

const invalidApiRun = await POST(new Request("http://localhost/api/staging", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ scenarioId: "unknown-scenario" }),
}));
assert.equal(invalidApiRun.status, 400);

const reopened = openDatabase(databasePath);
const migrationCount = reopened.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get<{ count: number }>();
const runCount = reopened.prepare("SELECT COUNT(*) AS count FROM staging_runs WHERE workspace_id = ?").get<{ count: number }>(staging.STAGING_WORKSPACE_ID);
assert.equal(migrationCount?.count, 6);
assert.equal(runCount?.count, 3);
assert.equal(reopened.prepare("SELECT COUNT(*) AS count FROM provider_connections WHERE connection_status = 'write_enabled'").get<{ count: number }>()?.count, 0);
reopened.close();
staging.closePersonalStaging();
fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(JSON.stringify({
    test: "personal-staging-regression",
  status: "PASS",
    assertions: 58,
    scenarios: 3,
  api: "GET/POST/invalid-input passed",
  seedIdempotent: true,
  fileBackedPersistence: true,
    migrationCount: 6,
  writeConnections: "blocked",
  globalMarketValidated: false,
  canonicalBlueprintMutation: false,
    tempDataRemoved: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

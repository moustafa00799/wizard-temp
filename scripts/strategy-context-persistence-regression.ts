import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertPersistedBlueprintUnchanged,
  loadPersistedStrategyContext,
  loadPersistedStrategyRecommendation,
} from "../src/lib/knowledge/persisted-strategy-context";

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdks-strategy-context-persistence-"));
  const databasePath = path.join(tempDir, "staging.sqlite");
  process.env.CDKS_STAGING_DB_PATH = databasePath;

  const staging = await import("../src/lib/staging");
  const { createRepositories, openDatabase, sha256Json } = await import("../src/lib/db");
  await staging.seedPersonalStaging();
  const overview = await staging.getPersonalStagingOverview();
  const scenario = overview.scenarios.find((candidate) => candidate.id === "sa-ecommerce");
  assert.ok(scenario);
  assert.ok(scenario.blueprintId);
  const persistedScenario = await staging.runPersonalStagingScenario(scenario.id);
  const contextId = persistedScenario.contextId;
  const recommendationId = persistedScenario.recommendationId;

  const database = openDatabase(databasePath);
  const repositories = createRepositories(database);
  const context = loadPersistedStrategyContext(repositories, {
    workspaceId: staging.STAGING_WORKSPACE_ID,
    contextId,
    expectedBlueprintId: scenario.blueprintId,
  });
  const recommendation = loadPersistedStrategyRecommendation(repositories, {
    workspaceId: staging.STAGING_WORKSPACE_ID,
    recommendationId,
    expectedBlueprintId: scenario.blueprintId,
  });
  const blueprint = repositories.blueprints.get(scenario.blueprintId)?.blueprint;
  assert.ok(blueprint);
  const blueprintHashBefore = sha256Json(blueprint);
  assert.equal(context.globalMarketValidated, false);
  assert.equal(recommendation.status, "advisory_only");
  assert.equal(recommendation.governance.canChangeCanonicalBlueprint, false);
  assert.equal(recommendation.governance.canMutateCdks, false);
  assert.equal(context.snapshotId.length > 0, true);
  assertPersistedBlueprintUnchanged(repositories, scenario.blueprintId, blueprint);
  assert.equal(sha256Json(repositories.blueprints.get(scenario.blueprintId)?.blueprint), blueprintHashBefore);

  assert.throws(() => loadPersistedStrategyContext(repositories, {
    workspaceId: "workspace-not-found",
    contextId,
  }), /not found/);
  assert.throws(() => loadPersistedStrategyContext(repositories, {
    workspaceId: staging.STAGING_WORKSPACE_ID,
    contextId,
    expectedBlueprintId: "blueprint-other",
  }), /different Blueprint/);
  assert.throws(() => loadPersistedStrategyRecommendation(repositories, {
    workspaceId: staging.STAGING_WORKSPACE_ID,
    recommendationId,
    expectedBlueprintId: "blueprint-other",
  }), /different Blueprint/);

  database.prepare("UPDATE strategy_contexts SET context_json = ? WHERE context_id = ?").run(
    JSON.stringify({ ...context, globalMarketValidated: true }),
    contextId,
  );
  assert.throws(() => loadPersistedStrategyContext(repositories, {
    workspaceId: staging.STAGING_WORKSPACE_ID,
    contextId,
  }), /expected false|global Market Validation/);

  database.close();
  staging.closePersonalStaging();
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(JSON.stringify({
    test: "strategy-context-persistence-regression",
    status: "PASS",
    assertions: 15,
    snapshotToContext: true,
    recommendationAdvisoryOnly: true,
    canonicalBlueprintMutation: false,
    globalMarketValidated: false,
    workspaceIsolation: true,
    tempDataRemoved: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

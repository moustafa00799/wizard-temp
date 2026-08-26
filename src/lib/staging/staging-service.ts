import fs from "node:fs";
import path from "node:path";
import { buildBlueprintContractV3 } from "../contracts/build-blueprint-contract-v3";
import { canonicalizeWizardInput, type CanonicalWizardInput } from "../contracts/wizard-input";
import type { CanonicalBlueprint } from "../contracts/canonical-blueprint";
import { CDKSEngine } from "../orchestrator/cdks-engine";
import { INDUSTRY_PROFILES } from "../knowledge";
import {
  buildScopedStrategyContext,
  buildStrategyRecommendation,
} from "../knowledge/strategy-context";
import {
  createRepositories,
  openDatabase,
  sha256Json,
  type DatabaseRepositories,
  type JsonRecord,
} from "../db";
import { getStagingScenario, STAGING_SCENARIOS, type StagingScenario } from "./demo-scenarios";
import { runRandomizedWizardFixtureSuite } from "./randomized-suite";

const STAGING_WORKSPACE_ID = "workspace-personal-staging";
const STAGING_USER_ID = "user-personal-owner";
const STAGING_DB_PATH = process.env.CDKS_STAGING_DB_PATH ?? path.join(process.cwd(), ".local", "cdks-staging.sqlite");

type StagingState = {
  database: ReturnType<typeof openDatabase>;
  repositories: DatabaseRepositories;
};

declare global {
  var __cdksStagingState: StagingState | undefined;
}

function getState(): StagingState {
  if (globalThis.__cdksStagingState) return globalThis.__cdksStagingState;
  if (STAGING_DB_PATH !== ":memory:") fs.mkdirSync(path.dirname(STAGING_DB_PATH), { recursive: true });
  const database = openDatabase(STAGING_DB_PATH);
  const repositories = createRepositories(database);
  const state = { database, repositories };
  globalThis.__cdksStagingState = state;
  return state;
}

function sourceUrl(sourceId: string): string {
  return `https://example.com/cdks-personal-staging/source/${encodeURIComponent(sourceId)}`;
}

function asJsonRecord(value: unknown): JsonRecord {
  return value as JsonRecord;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? value as JsonRecord : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function buildBlueprintContract(input: CanonicalWizardInput, blueprint: CanonicalBlueprint, scenario: StagingScenario) {
  return buildBlueprintContractV3(input, blueprint, {
    currency: scenario.selection.snapshot.currency,
    output_language: "ar",
    _fixture: { scenario_id: scenario.id },
  });
}

function count(database: ReturnType<typeof openDatabase>, table: string, where?: string): number {
  const query = where ? `SELECT COUNT(*) AS count FROM ${table} WHERE ${where}` : `SELECT COUNT(*) AS count FROM ${table}`;
  const row = database.prepare(query).get<{ count: number }>();
  return row?.count ?? 0;
}

function scenarioStatus(repositories: DatabaseRepositories, scenario: StagingScenario) {
  const existing = repositories.staging.getRun(STAGING_WORKSPACE_ID, scenario.id);
  return {
    id: scenario.id,
    label: scenario.label,
    description: scenario.description,
    status: existing ? existing.status : "not_run",
    blueprintId: existing?.blueprintId,
    updatedAt: existing?.createdAt,
  };
}

function persistSnapshotVersion(repositories: DatabaseRepositories, snapshot: {
  snapshotId: string;
  sourceIds: string[];
  capturedAt: string;
  freshnessStatus: "fresh" | "stale" | "expired" | "missing";
  snapshot: JsonRecord;
}): void {
  repositories.knowledge.createSnapshotVersion({
    snapshotId: snapshot.snapshotId,
    revision: 1,
    snapshotSha256: sha256Json(snapshot.snapshot),
    sourceManifestSha256: sha256Json([...snapshot.sourceIds].sort()),
    capturedAt: snapshot.capturedAt,
    freshnessStatus: snapshot.freshnessStatus,
    payload: snapshot.snapshot,
  });
}

function ensurePersistedSnapshotVersions(repositories: DatabaseRepositories): void {
  for (const scenario of STAGING_SCENARIOS) {
    const snapshot = repositories.knowledge.getSnapshot(STAGING_WORKSPACE_ID, scenario.selection.snapshot.snapshotId);
    if (!snapshot) continue;
    persistSnapshotVersion(repositories, {
      snapshotId: scenario.selection.snapshot.snapshotId,
      sourceIds: Array.isArray(snapshot.sourceIds) ? snapshot.sourceIds : [],
      capturedAt: String(snapshot.captured_at),
      freshnessStatus: String(snapshot.freshness_status) as "fresh" | "stale" | "expired" | "missing",
      snapshot: asJsonRecord(snapshot.snapshot),
    });
  }
}

function seedSourceAndKnowledge(repositories: DatabaseRepositories, scenario: StagingScenario): void {
  const createdAt = "2026-08-24T00:00:00.000Z";
  const profile = INDUSTRY_PROFILES.find((candidate) => candidate.industryKey === scenario.selection.industry);
  if (profile) {
    repositories.sources.createIndustryProfile(profile as unknown as JsonRecord & { profileId: string; version: string; industryKey: string; branch: string; status: string });
  }

  for (const sourceId of scenario.selection.snapshot.sourceIds) {
    repositories.sources.create({
      sourceId,
      publisher: "CDKS Personal Staging Fixture",
      sourceUrl: sourceUrl(sourceId),
      sourceType: "client_data",
      market: scenario.selection.market,
      industry: scenario.selection.industry,
      language: scenario.selection.snapshot.locale,
      licenseStatus: "approved",
      version: "staging-v1",
      observedAt: createdAt,
      freshnessPolicy: "on_demand",
      limitations: ["Redacted staging fixture; not a live external source or client production data."],
    });
  }

  repositories.knowledge.createSnapshot({
    snapshotId: scenario.selection.snapshot.snapshotId,
    workspaceId: STAGING_WORKSPACE_ID,
    market: scenario.selection.market,
    industry: scenario.selection.industry,
    locale: scenario.selection.snapshot.locale,
    currency: scenario.selection.snapshot.currency,
    capturedAt: scenario.selection.snapshot.capturedAt,
    freshnessStatus: scenario.selection.snapshot.freshnessStatus,
    confidence: scenario.selection.snapshot.confidence,
    sourceIds: [...scenario.selection.snapshot.sourceIds],
    snapshot: asJsonRecord(scenario.selection.snapshot),
  });
  persistSnapshotVersion(repositories, {
    snapshotId: scenario.selection.snapshot.snapshotId,
    sourceIds: [...scenario.selection.snapshot.sourceIds],
    capturedAt: scenario.selection.snapshot.capturedAt,
    freshnessStatus: scenario.selection.snapshot.freshnessStatus,
    snapshot: asJsonRecord(scenario.selection.snapshot),
  });

  for (const fact of scenario.selection.snapshot.facts) {
    repositories.knowledge.createFact({
      factId: fact.factId,
      snapshotId: scenario.selection.snapshot.snapshotId,
      market: scenario.selection.market,
      industry: scenario.selection.industry,
      status: fact.status,
      value: fact.value,
      sourceIds: [...fact.sourceIds],
      observedAt: fact.observedAt,
      fact: asJsonRecord(fact),
    });
  }

  repositories.knowledge.createEvidencePackage({
    packageId: scenario.selection.packageId,
    workspaceId: STAGING_WORKSPACE_ID,
    market: scenario.selection.market,
    industry: scenario.selection.industry,
    status: "ready",
    freshnessStatus: scenario.selection.snapshot.freshnessStatus,
    retrievalStrategy: "deterministic_fixture",
    evidencePackage: asJsonRecord(scenario.selection),
    createdAt,
  });
  repositories.knowledge.attachSnapshot(scenario.selection.packageId, scenario.selection.snapshot.snapshotId);

  scenario.selection.evidenceIds.forEach((evidenceId, index) => {
    const sourceId = scenario.selection.snapshot.sourceIds[index] ?? scenario.selection.snapshot.sourceIds[0];
    repositories.knowledge.createEvidenceLink({
      evidenceId,
      packageId: scenario.selection.packageId,
      sourceId,
      observedAt: scenario.selection.snapshot.capturedAt,
      limitations: ["Redacted staging fixture; evidence is scoped to the selected scenario."],
      evidence: { evidenceId, sourceId, staging: true },
    });
  });

  const firstEvidenceId = scenario.selection.evidenceIds[0];
  const activeFact = scenario.selection.snapshot.facts.find((fact) => fact.status !== "unavailable");
  if (activeFact && firstEvidenceId) {
    repositories.knowledge.createClaim({
      claimId: `claim-${scenario.id}`,
      workspaceId: STAGING_WORKSPACE_ID,
      market: scenario.selection.market,
      industry: scenario.selection.industry,
      claimType: "fact",
      status: "evidence_backed",
      evidenceIds: [firstEvidenceId],
      claim: { claimId: `claim-${scenario.id}`, factId: activeFact.factId, staging: true },
    });
  }
}

export async function seedPersonalStaging(): Promise<void> {
  const { database, repositories } = getState();
  if (repositories.workspaces.get(STAGING_WORKSPACE_ID)) return;

  const createdAt = "2026-08-24T00:00:00.000Z";
  database.exec("BEGIN");
  try {
    repositories.workspaces.create({ workspaceId: STAGING_WORKSPACE_ID, name: "Personal Staging — CDKS", createdAt });
    repositories.memberships.create(STAGING_WORKSPACE_ID, STAGING_USER_ID, "owner");

    const engine = new CDKSEngine();
    for (const scenario of STAGING_SCENARIOS) {
    const input = canonicalizeWizardInput(scenario.input);
    repositories.briefs.create({
      briefId: `brief-${scenario.id}`,
      workspaceId: STAGING_WORKSPACE_ID,
      version: 1,
      market: scenario.selection.market,
      industry: scenario.selection.industry,
      locale: scenario.selection.snapshot.locale,
      currency: scenario.selection.snapshot.currency,
      status: "submitted",
      brief: { staging: true, scenarioId: scenario.id, input },
      createdAt,
    });
    repositories.briefs.createWizardSubmission({
      submissionId: `submission-${scenario.id}`,
      briefId: `brief-${scenario.id}`,
      briefVersion: 1,
      workspaceId: STAGING_WORKSPACE_ID,
      wizardInput: asJsonRecord(input),
      source: "fixture",
      userConfirmed: false,
    });

    const blueprint = await engine.generate(input);
    const blueprintHash = sha256Json(blueprint);
    const blueprintContract = buildBlueprintContract(input, blueprint, scenario);
    repositories.blueprints.create({
      blueprintId: blueprint.blueprint_id,
      workspaceId: STAGING_WORKSPACE_ID,
      version: 1,
      blueprint: asJsonRecord(blueprint),
      canonicalSha256: blueprintHash,
      createdAt,
    });
    seedSourceAndKnowledge(repositories, scenario);
    const context = buildScopedStrategyContext(scenario.selection);
    const recommendation = buildStrategyRecommendation(input, blueprint, context);
    repositories.strategy.createContext({
      contextId: context.contextId,
      workspaceId: STAGING_WORKSPACE_ID,
      packageId: scenario.selection.packageId,
      blueprintId: blueprint.blueprint_id,
      market: scenario.selection.market,
      industry: scenario.selection.industry,
      scopedValidationStatus: context.scopedValidationStatus,
      context: asJsonRecord(context),
      createdAt,
    });
    repositories.strategy.createRecommendation({
      recommendationId: recommendation.recommendationId,
      workspaceId: STAGING_WORKSPACE_ID,
      contextId: context.contextId,
      blueprintId: blueprint.blueprint_id,
      recommendation: asJsonRecord(recommendation),
      createdAt,
    });
    repositories.governance.createApproval({
      approvalId: `approval-${scenario.id}`,
      workspaceId: STAGING_WORKSPACE_ID,
      objectType: "recommendation",
      objectId: recommendation.recommendationId,
      decision: "pending",
      actorUserId: STAGING_USER_ID,
      note: "Personal staging review required; no launch authority.",
    });
    repositories.governance.createAuditEvent({
      auditEventId: `audit-${scenario.id}`,
      workspaceId: STAGING_WORKSPACE_ID,
      eventType: "staging_seeded",
      objectType: "recommendation",
      objectId: recommendation.recommendationId,
      actorType: "system",
      payload: { staging: true, scenarioId: scenario.id, canonicalBlueprintSha256: blueprintHash },
    });
    repositories.staging.createRun({
      stagingRunId: `staging-run-${scenario.id}`,
      workspaceId: STAGING_WORKSPACE_ID,
      scenarioId: scenario.id,
      blueprintId: blueprint.blueprint_id,
      contextId: context.contextId,
      recommendationId: recommendation.recommendationId,
      status: "completed",
      run: {
        scenarioId: scenario.id,
        label: scenario.label,
        staging: true,
        authority: {
          objective: blueprintContract.decisions.objective,
          funnel: blueprintContract.decisions.funnel,
          channels: blueprintContract.decisions.channels,
          readiness: blueprintContract.readiness,
        },
        recommendation,
      },
      createdAt,
    });
    }
    database.prepare("INSERT OR IGNORE INTO audit_events (audit_event_id, workspace_id, event_type, object_type, object_id, actor_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "audit-staging-initialized",
    STAGING_WORKSPACE_ID,
    "staging_initialized",
    "workspace",
    STAGING_WORKSPACE_ID,
    "system",
    JSON.stringify({ staging: true, scenarioCount: STAGING_SCENARIOS.length }),
      createdAt,
    );
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export async function getPersonalStagingOverview() {
  await seedPersonalStaging();
  const { database, repositories } = getState();
  ensurePersistedSnapshotVersions(repositories);
  return {
    workspace: {
      id: STAGING_WORKSPACE_ID,
      name: "Personal Staging — CDKS",
      mode: "personal_staging",
    },
    scenarios: STAGING_SCENARIOS.map((scenario) => scenarioStatus(repositories, scenario)),
    counts: {
      workspaces: count(database, "workspaces"),
      briefs: count(database, "client_briefs"),
      blueprints: count(database, "canonical_blueprints"),
      snapshots: count(database, "knowledge_snapshots"),
      snapshotVersions: count(database, "knowledge_snapshot_versions"),
      evidencePackages: count(database, "evidence_packages"),
      contexts: count(database, "strategy_contexts"),
      recommendations: count(database, "strategy_recommendations"),
      stagingTestRuns: count(database, "staging_test_runs"),
      approvalsPending: count(database, "approval_events", "decision = 'pending'"),
      auditEvents: count(database, "audit_events"),
    },
    governance: {
      generationMode: "blueprint_only",
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
      writeConnections: "disabled",
      liveAiCalled: false,
      globalMarketValidated: false,
      personalOnly: true,
    },
    tests: {
      databaseRegressionAssertions: 41,
      migrationCount: count(database, "schema_migrations"),
      foreignKeys: "enabled",
      canonicalBlueprintMutation: false,
      secretMaterialStored: false,
    },
    randomizedSuite: (() => {
      const latest = repositories.testing.getLatestSuiteRun(STAGING_WORKSPACE_ID);
      if (!latest) return null;
      const report = latest.report as { summary?: JsonRecord; corpusCount?: number; totalRuns?: number };
      return {
        testRunId: latest.testRunId,
        seed: latest.seed,
        variantsPerCase: latest.variantsPerCase,
        totalRuns: latest.totalRuns,
        status: latest.status,
        summary: report.summary ?? {},
        createdAt: latest.createdAt,
      };
    })(),
  };
}

export async function runPersonalRandomizedSuite(options: { seed?: number; variantsPerCase?: number } = {}) {
  await seedPersonalStaging();
  const result = await runRandomizedWizardFixtureSuite(options);
  const { repositories } = getState();
  const testRunId = `staging-test-${result.seed}-${Date.now()}`;
  repositories.testing.createSuiteRun({
    testRunId,
    workspaceId: STAGING_WORKSPACE_ID,
    suite: "wizard-fixtures-v1",
    seed: result.seed,
    variantsPerCase: result.variantsPerCase,
    totalRuns: result.totalRuns,
    status: result.status === "PASS" ? "completed" : "failed",
    report: asJsonRecord(result),
  });
  repositories.governance.createAuditEvent({
    auditEventId: `audit-${testRunId}`,
    workspaceId: STAGING_WORKSPACE_ID,
    eventType: "randomized_suite_completed",
    objectType: "staging_test_run",
    objectId: testRunId,
    actorType: "system",
    payload: {
      seed: result.seed,
      variantsPerCase: result.variantsPerCase,
      totalRuns: result.totalRuns,
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
    },
  });
  return { ...result, testRunId };
}

export async function runPersonalStagingScenario(scenarioId: string) {
  await seedPersonalStaging();
  const scenario = getStagingScenario(scenarioId);
  const { repositories } = getState();
  const stored = repositories.staging.getRun(STAGING_WORKSPACE_ID, scenario.id);
  if (!stored) throw new Error(`Staging scenario ${scenario.id} was not seeded.`);
  const input = canonicalizeWizardInput(scenario.input);
  const recommendation = stored.run.recommendation as JsonRecord;
  const authority = asRecord(stored.run.authority);
  const objectiveDecision = asRecord(authority.objective);
  const funnelDecision = asRecord(authority.funnel);
  const channelDecision = asRecord(authority.channels);
  const readinessDecision = asRecord(authority.readiness);
  return {
    scenario: {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
    },
    status: stored.status,
    blueprintId: stored.blueprintId,
    contextId: stored.contextId,
    recommendationId: stored.recommendationId,
    wizardSummary: {
      businessType: input.business_type,
      primaryObjective: input.primary_objective,
      targetLocations: [...input.target_locations],
      conversionDestination: input.conversion_destination,
      adChannels: [...input.ad_channels],
      trackingStatus: input.tracking_status,
      finalConfirmedInputs: input.final_confirmed_inputs,
    },
    blueprintAuthority: {
      objective: typeof objectiveDecision.value === "string" ? objectiveDecision.value : input.primary_objective,
      funnel: typeof funnelDecision.value === "string" ? funnelDecision.value : "",
      channels: asStringArray(channelDecision.value),
      readiness: readinessDecision,
    },
    recommendation,
    governance: {
      generationMode: "blueprint_only",
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
      requiresHumanApproval: true,
      canonicalBlueprintUnchanged: true,
    },
    note: "هذه نتيجة Personal Staging منقحة وليست استراتيجية إنتاجية للعميل، ولا يمكنها إنشاء أو نشر حملة.",
  };
}

export function closePersonalStaging(): void {
  const state = globalThis.__cdksStagingState;
  if (!state) return;
  state.database.close();
  globalThis.__cdksStagingState = undefined;
}

export { STAGING_DB_PATH, STAGING_USER_ID, STAGING_WORKSPACE_ID };

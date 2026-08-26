import {
  ScopedStrategyContextSchema,
  StrategyRecommendationSchema,
  type ScopedStrategyContext,
  type StrategyRecommendation,
} from "../contracts/knowledge-strategy-context";
import { sha256Json, type DatabaseRepositories } from "../db";

export class PersistedStrategyContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistedStrategyContextError";
  }
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function loadPersistedStrategyContext(
  repositories: DatabaseRepositories,
  input: { workspaceId: string; contextId: string; expectedBlueprintId?: string },
): ScopedStrategyContext {
  const row = repositories.strategy.getContext(input.workspaceId, input.contextId);
  if (!row) throw new PersistedStrategyContextError("Persisted Strategy Context was not found in the requested workspace.");
  const context = ScopedStrategyContextSchema.parse(row.context);
  if (context.contextId !== input.contextId) {
    throw new PersistedStrategyContextError("Persisted Strategy Context ID does not match its database key.");
  }
  if (asText(row.package_id) !== context.packageId || asText(row.market) !== context.market || asText(row.industry) !== context.industry) {
    throw new PersistedStrategyContextError("Persisted Strategy Context scope does not match its database row.");
  }
  if (input.expectedBlueprintId && asText(row.blueprint_id) !== input.expectedBlueprintId) {
    throw new PersistedStrategyContextError("Persisted Strategy Context is attached to a different Blueprint.");
  }
  if (context.globalMarketValidated !== false) {
    throw new PersistedStrategyContextError("Persisted Strategy Context cannot enable global Market Validation.");
  }
  return context;
}

export function loadPersistedStrategyRecommendation(
  repositories: DatabaseRepositories,
  input: { workspaceId: string; recommendationId: string; expectedBlueprintId?: string },
): StrategyRecommendation {
  const row = repositories.strategy.getRecommendation(input.workspaceId, input.recommendationId);
  if (!row) throw new PersistedStrategyContextError("Persisted Strategy Recommendation was not found in the requested workspace.");
  const recommendation = StrategyRecommendationSchema.parse(row.recommendation);
  if (recommendation.recommendationId !== input.recommendationId) {
    throw new PersistedStrategyContextError("Persisted Strategy Recommendation ID does not match its database key.");
  }
  if (asText(row.context_id) !== recommendation.contextId || asText(row.blueprint_id) !== recommendation.blueprintId) {
    throw new PersistedStrategyContextError("Persisted Strategy Recommendation binding does not match its database row.");
  }
  if (input.expectedBlueprintId && recommendation.blueprintId !== input.expectedBlueprintId) {
    throw new PersistedStrategyContextError("Persisted Strategy Recommendation is attached to a different Blueprint.");
  }
  if (recommendation.governance.globalMarketValidated !== false || recommendation.governance.canMutateCdks !== false || recommendation.governance.canChangeCanonicalBlueprint !== false) {
    throw new PersistedStrategyContextError("Persisted Strategy Recommendation is not advisory-only safe.");
  }
  return recommendation;
}

export function assertPersistedBlueprintUnchanged(
  repositories: DatabaseRepositories,
  blueprintId: string,
  expectedBlueprint: unknown,
): void {
  repositories.blueprints.assertUnchanged(blueprintId, sha256Json(expectedBlueprint));
}

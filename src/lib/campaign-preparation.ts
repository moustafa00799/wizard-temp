import { z } from "zod";
import { sha256Json } from "./db";
import type { JsonRecord } from "./db";
import type { CampaignLifecycleState } from "./campaign-lifecycle";
import { MeasurementPlanSchema, buildMeasurementPlan } from "./measurement-contract";

export const PreparationRequestSchema = z.object({
  workspace_id: z.string().min(1).max(120),
  lifecycle_id: z.string().min(1).max(220),
});

export type PreparationRequest = z.infer<typeof PreparationRequestSchema>;

export const CampaignPreparationEnvelopeSchema = z.object({
  formatVersion: z.literal("campaign-preparation-v1"),
  preparationStatus: z.literal("approved_for_preparation"),
  preparedAt: z.string().datetime(),
  lifecycle: z.object({
    lifecycleId: z.string(),
    workspaceId: z.string(),
    blueprintId: z.string(),
    state: z.literal("approved"),
    canonicalSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }),
  blueprint: z.record(z.unknown()),
  measurementPlan: MeasurementPlanSchema,
  reviewChecklist: z.object({
    humanApprovalRecorded: z.literal(true),
    canonicalHashVerified: z.literal(true),
    blueprintOnly: z.literal(true),
    externalActionsAllowed: z.literal(false),
    budgetSpendAllowed: z.literal(false),
    providerWriteEnabled: z.literal(false),
    marketValidationClaimed: z.literal(false),
  }),
  blockedActions: z.array(z.string()),
});

export type CampaignPreparationEnvelope = z.infer<typeof CampaignPreparationEnvelopeSchema>;

function assertBlueprintGovernance(blueprint: JsonRecord): void {
  const governanceCandidates = [blueprint.governance, blueprint.metadata];
  for (const candidate of governanceCandidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const governance = candidate as JsonRecord;
    for (const key of ["externalActionsAllowed", "external_actions_allowed", "budgetSpendAllowed", "budget_spend_allowed", "canChangeCanonicalBlueprint", "can_change_canonical_blueprint"]) {
      if (governance[key] === true) throw new Error(`Unsafe Blueprint governance flag: ${key}.`);
    }
  }
}

export function buildCampaignPreparationEnvelope(params: {
  lifecycle: { lifecycleId: string; workspaceId: string; blueprintId: string; state: CampaignLifecycleState; canonicalSha256: string };
  blueprint: JsonRecord;
  now?: string;
}): CampaignPreparationEnvelope {
  if (params.lifecycle.state !== "approved") throw new Error("Campaign must have human approval before preparation export.");
  const actualHash = sha256Json(params.blueprint);
  if (actualHash !== params.lifecycle.canonicalSha256) throw new Error("Canonical Blueprint hash mismatch during preparation export.");
  assertBlueprintGovernance(params.blueprint);
  return CampaignPreparationEnvelopeSchema.parse({
    formatVersion: "campaign-preparation-v1",
    preparationStatus: "approved_for_preparation",
    preparedAt: params.now ?? new Date().toISOString(),
    lifecycle: {
      lifecycleId: params.lifecycle.lifecycleId,
      workspaceId: params.lifecycle.workspaceId,
      blueprintId: params.lifecycle.blueprintId,
      state: "approved",
      canonicalSha256: params.lifecycle.canonicalSha256,
    },
    blueprint: params.blueprint,
    measurementPlan: buildMeasurementPlan(params.blueprint),
    reviewChecklist: {
      humanApprovalRecorded: true,
      canonicalHashVerified: true,
      blueprintOnly: true,
      externalActionsAllowed: false,
      budgetSpendAllowed: false,
      providerWriteEnabled: false,
      marketValidationClaimed: false,
    },
    blockedActions: [
      "إنشاء حملة على منصة خارجية",
      "تفعيل صلاحية كتابة لمزود إعلاني",
      "إنفاق أو تحويل ميزانية",
      "تغيير Canonical Blueprint",
      "الإعلان عن Market Validation من هذه الحزمة",
    ],
  });
}

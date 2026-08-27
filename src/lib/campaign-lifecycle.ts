import { z } from "zod";

export const CampaignLifecycleStateSchema = z.enum(["draft", "review", "approved", "rejected"]);
export type CampaignLifecycleState = z.infer<typeof CampaignLifecycleStateSchema>;

export const CampaignLifecycleActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    workspace_id: z.string().min(1).max(120),
    lifecycle_id: z.string().min(1).max(160),
    blueprint_id: z.string().min(1).max(160),
    canonical_sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }),
  z.object({
    action: z.literal("transition"),
    workspace_id: z.string().min(1).max(120),
    lifecycle_id: z.string().min(1).max(160),
    event_id: z.string().min(1).max(220),
    from_state: CampaignLifecycleStateSchema,
    to_state: CampaignLifecycleStateSchema,
    actor_type: z.enum(["user", "system"]),
    actor_user_id: z.string().min(1).max(160).optional(),
    note: z.string().max(1000).optional(),
    canonical_sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  }),
]);

export type CampaignLifecycleAction = z.infer<typeof CampaignLifecycleActionSchema>;

export function assertSafeLifecycleReference(value: string, label: string): string {
  if (!/^[A-Za-z0-9._:-]{1,220}$/.test(value)) {
    throw new Error(`${label} contains unsupported characters.`);
  }
  return value;
}

export function assertAllowedCampaignTransition(fromState: CampaignLifecycleState, toState: CampaignLifecycleState): void {
  const allowed = (fromState === "draft" && toState === "review")
    || (fromState === "review" && (toState === "approved" || toState === "rejected"))
    || (fromState === "rejected" && toState === "draft");
  if (!allowed) throw new Error(`Invalid campaign lifecycle transition: ${fromState} -> ${toState}.`);
}

export function lifecycleLabel(state: CampaignLifecycleState): string {
  return {
    draft: "Draft — مسودة",
    review: "Review — مراجعة مطلوبة",
    approved: "Human Approved — اعتماد بشري",
    rejected: "Rejected — مرفوضة وتحتاج تعديلًا",
  }[state];
}

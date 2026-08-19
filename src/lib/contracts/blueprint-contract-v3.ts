import { z } from "zod";
import { CanonicalBlueprintSchema } from "./canonical-blueprint";
import type { CanonicalWizardInput } from "./wizard-input";
import { AiProvenanceSchema } from "./ai-provenance";
import type { AiProvenance } from "./ai-provenance";
import { AIReasoningContractSchema } from "./ai-reasoning";
import type { AIReasoningContract } from "./ai-reasoning";

export type BlueprintContractVersion = "3.0";
export type BlueprintGenerationMode = "blueprint_only";
export type DecisionAuthority =
  | "WIZARD_INPUT"
  | "DECISION_POLICY"
  | "READINESS_POLICY"
  | "RULE_ENGINE"
  | "AI_STRATEGY_BUILDER"
  | "AI_REASONING"
  | "DEFAULT_ASSUMPTION"
  | "HUMAN_APPROVAL";
export type ReadinessState = "ready" | "review" | "blocked";
export type WarningSeverity = "error" | "warning" | "info";
export type ProvenanceKind = "input" | "rule" | "ai" | "assumption" | "human";

export interface BlueprintDecision<T> {
  value: T;
  authority: DecisionAuthority;
  rule_id?: string;
  model?: string;
  confidence?: number;
  evidence: string[];
  uncertainty: string[];
  reasoning?: string;
}

export interface BlueprintWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
  action: string;
  evidence: string[];
  authority: DecisionAuthority;
}

export interface BlueprintProvenanceEntry {
  path: string;
  source: ProvenanceKind;
  authority: DecisionAuthority;
  source_ref: string;
  assumptions: string[];
  user_confirmed: boolean;
}

export interface BlueprintReasoningTrace {
  status: "not_requested" | "pending" | "completed" | "failed";
  authority: "AI_REASONING";
  model?: string;
  summary?: string;
  supported_claims: string[];
  unsupported_claims: string[];
  limitations: string[];
  contract?: AIReasoningContract;
}

export interface BlueprintStrategyTrace {
  status: "not_requested" | "pending" | "completed" | "failed";
  authority: "AI_STRATEGY_BUILDER";
  model?: string;
  proposed_changes: string[];
  accepted_changes: string[];
  rejected_changes: string[];
  limitations: string[];
  provenance?: AiProvenance;
}

export interface BlueprintValidationSummary {
  schema_valid: boolean;
  canonical_field_count: number;
  canonical_field_errors: string[];
  external_actions_allowed: false;
  budget_spend_allowed: false;
}

export interface BlueprintContractV3 {
  contract_version: BlueprintContractVersion;
  blueprint_id: string;
  generated_at: string;
  locale: "ar" | "en";
  currency: "EGP" | "SAR" | "USD";
  generation_mode: BlueprintGenerationMode;
  source_wizard_input: CanonicalWizardInput;
  decisions: {
    objective: BlueprintDecision<string>;
    funnel: BlueprintDecision<string>;
    channels: BlueprintDecision<string[]>;
  };
  expected_outcomes?: {
    objective: string;
    funnel: string;
    readiness_before_confirmation: ReadinessState;
    readiness_after_confirmation: ReadinessState;
  };
  strategy: BlueprintStrategyTrace;
  reasoning: BlueprintReasoningTrace;
  readiness: BlueprintDecision<ReadinessState>;
  warnings: BlueprintWarning[];
  provenance: BlueprintProvenanceEntry[];
  validation: BlueprintValidationSummary;
  blueprint: Record<string, unknown>;
}


const DecisionSchema = z.object({
  value: z.unknown(),
  authority: z.enum([
    "WIZARD_INPUT",
    "DECISION_POLICY",
    "READINESS_POLICY",
    "RULE_ENGINE",
    "AI_STRATEGY_BUILDER",
    "AI_REASONING",
    "DEFAULT_ASSUMPTION",
    "HUMAN_APPROVAL",
  ]),
  rule_id: z.string().optional(),
  model: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.array(z.string()),
  uncertainty: z.array(z.string()),
  reasoning: z.string().optional(),
});

const WarningSchema = z.object({
  code: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  action: z.string(),
  evidence: z.array(z.string()),
  authority: z.enum([
    "WIZARD_INPUT",
    "DECISION_POLICY",
    "READINESS_POLICY",
    "RULE_ENGINE",
    "AI_STRATEGY_BUILDER",
    "AI_REASONING",
    "DEFAULT_ASSUMPTION",
    "HUMAN_APPROVAL",
  ]),
});

const ProvenanceSchema = z.object({
  path: z.string(),
  source: z.enum(["input", "rule", "ai", "assumption", "human"]),
  authority: z.enum([
    "WIZARD_INPUT",
    "DECISION_POLICY",
    "READINESS_POLICY",
    "RULE_ENGINE",
    "AI_STRATEGY_BUILDER",
    "AI_REASONING",
    "DEFAULT_ASSUMPTION",
    "HUMAN_APPROVAL",
  ]),
  source_ref: z.string(),
  assumptions: z.array(z.string()),
  user_confirmed: z.boolean(),
});

const StrategyTraceSchema = z.object({
  status: z.enum(["not_requested", "pending", "completed", "failed"]),
  authority: z.literal("AI_STRATEGY_BUILDER"),
  model: z.string().optional(),
  proposed_changes: z.array(z.string()),
  accepted_changes: z.array(z.string()),
  rejected_changes: z.array(z.string()),
  limitations: z.array(z.string()),
  provenance: AiProvenanceSchema.optional(),
});

const ReasoningTraceSchema = z.object({
  status: z.enum(["not_requested", "pending", "completed", "failed"]),
  authority: z.literal("AI_REASONING"),
  model: z.string().optional(),
  summary: z.string().optional(),
  supported_claims: z.array(z.string()),
  unsupported_claims: z.array(z.string()),
  limitations: z.array(z.string()),
  contract: AIReasoningContractSchema.optional(),
});

export const BlueprintContractV3Schema = z.object({
  contract_version: z.literal("3.0"),
  blueprint_id: z.string().uuid(),
  generated_at: z.string().datetime(),
  locale: z.enum(["ar", "en"]),
  currency: z.enum(["EGP", "SAR", "USD"]),
  generation_mode: z.literal("blueprint_only"),
  source_wizard_input: z.unknown(),
  decisions: z.object({
    objective: DecisionSchema,
    funnel: DecisionSchema,
    channels: DecisionSchema,
  }),
  expected_outcomes: z.object({
    objective: z.string(),
    funnel: z.string(),
    readiness_before_confirmation: z.enum(["ready", "review", "blocked"]),
    readiness_after_confirmation: z.enum(["ready", "review", "blocked"]),
  }).optional(),
  strategy: StrategyTraceSchema,
  reasoning: ReasoningTraceSchema,
  readiness: DecisionSchema.extend({
    value: z.enum(["ready", "review", "blocked"]),
    authority: z.literal("READINESS_POLICY"),
  }),
  warnings: z.array(WarningSchema),
  provenance: z.array(ProvenanceSchema),
  validation: z.object({
    schema_valid: z.boolean(),
    canonical_field_count: z.number().int().nonnegative(),
    canonical_field_errors: z.array(z.string()),
    external_actions_allowed: z.literal(false),
    budget_spend_allowed: z.literal(false),
  }),
  blueprint: CanonicalBlueprintSchema,
});

export type ValidatedBlueprintContractV3 = z.infer<typeof BlueprintContractV3Schema>;

export function validateBlueprintContractV3(data: unknown): ValidatedBlueprintContractV3 {
  return BlueprintContractV3Schema.parse(data);
}

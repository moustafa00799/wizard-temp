import type { CanonicalWizardInput } from "./wizard-input";

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
}

export interface BlueprintStrategyTrace {
  status: "not_requested" | "pending" | "completed" | "failed";
  authority: "AI_STRATEGY_BUILDER";
  model?: string;
  proposed_changes: string[];
  accepted_changes: string[];
  rejected_changes: string[];
  limitations: string[];
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

import { z } from "zod";
import type { AiProvenance } from "./ai-provenance";
import { AiProvenanceSchema } from "./ai-provenance";

export type AIReasoningContractVersion = "1.0";
export type AIReasoningStatus = "not_requested" | "pending" | "completed" | "failed";
export type AIReasoningPurpose = "explain" | "critique" | "gap_analysis" | "synthesize";
export type AIReasoningClaimType =
  | "evidence_based"
  | "qualified_inference"
  | "assumption"
  | "recommendation"
  | "unsupported";
export type AIReasoningClaimStatus = "supported" | "qualified" | "unsupported" | "rejected";
export type AIReasoningEvidenceKind =
  | "wizard_input"
  | "cdks_decision"
  | "rule_output"
  | "blueprint_field"
  | "warning"
  | "provenance"
  | "ai_strategy"
  | "assumption";
export type AIReasoningImpact = "supports" | "clarifies" | "challenges" | "no_change";
export type AIReasoningSafetyStatus = "safe" | "rejected";

export interface AIReasoningDecisionExplanation {
  decision_ref: string;
  what_decided: string;
  why_this_fits: string;
  expected_effect: string;
  tradeoffs: string[];
  risks: string[];
  what_would_change_it: string[];
  next_validation_step: string;
  evidence_refs: string[];
  uncertainty_refs: string[];
}

export interface AIReasoningEvidence {
  id: string;
  kind: AIReasoningEvidenceKind;
  path: string;
  source_ref: string;
  authority: "WIZARD_INPUT" | "DECISION_POLICY" | "READINESS_POLICY" | "RULE_ENGINE" | "AI_STRATEGY_BUILDER" | "DEFAULT_ASSUMPTION" | "HUMAN_APPROVAL";
  user_confirmed: boolean;
  relevance: "primary" | "supporting" | "context";
  excerpt?: string;
  limitations: string[];
}

export interface AIReasoningClaim {
  id: string;
  statement: string;
  claim_type: AIReasoningClaimType;
  status: AIReasoningClaimStatus;
  confidence: number;
  evidence_refs: string[];
  decision_refs: string[];
  uncertainty_refs: string[];
  limitations: string[];
}

export interface AIReasoningUncertainty {
  id: string;
  statement: string;
  category: "missing_input" | "unconfirmed_input" | "assumption" | "model_limit" | "conflicting_evidence" | "reference_gap";
  severity: "low" | "medium" | "high";
  affects: string[];
  resolution: string;
}

export interface AIReasoningDecisionImpact {
  decision_ref: string;
  impact: AIReasoningImpact;
  rationale: string;
  preserved_authority: "DECISION_POLICY" | "READINESS_POLICY" | "RULE_ENGINE" | "HUMAN_APPROVAL";
  changed: false;
}

export interface AIReasoningSafety {
  status: AIReasoningSafetyStatus;
  can_mutate_cdks: false;
  can_change_blueprint: false;
  can_authorize_launch: false;
  can_spend_budget: false;
  external_actions_allowed: false;
  budget_spend_allowed: false;
  readiness_override_attempted: false;
  blocked_actions: string[];
}

export interface AIReasoningContract {
  contract_version: AIReasoningContractVersion;
  source_contract_version: "3.0";
  reasoning_id: string;
  blueprint_id: string;
  generated_at: string;
  locale: "ar" | "en";
  purpose: AIReasoningPurpose;
  status: AIReasoningStatus;
  authority: "AI_REASONING";
  model?: string;
  summary?: string;
  claims: AIReasoningClaim[];
  evidence: AIReasoningEvidence[];
  uncertainties: AIReasoningUncertainty[];
  decision_impacts: AIReasoningDecisionImpact[];
  decision_explanations?: AIReasoningDecisionExplanation[];
  limitations: string[];
  grounding: {
    evidence_coverage_percent: number;
    supported_claim_count: number;
    qualified_claim_count: number;
    unsupported_claim_count: number;
    evidence_only_mode: boolean;
  };
  safety: AIReasoningSafety;
  provenance?: AiProvenance;
  failure?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

const AuthoritySchema = z.enum([
  "WIZARD_INPUT",
  "DECISION_POLICY",
  "READINESS_POLICY",
  "RULE_ENGINE",
  "AI_STRATEGY_BUILDER",
  "DEFAULT_ASSUMPTION",
  "HUMAN_APPROVAL",
]);

const EvidenceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "wizard_input",
    "cdks_decision",
    "rule_output",
    "blueprint_field",
    "warning",
    "provenance",
    "ai_strategy",
    "assumption",
  ]),
  path: z.string().min(1),
  source_ref: z.string().min(1),
  authority: AuthoritySchema,
  user_confirmed: z.boolean(),
  relevance: z.enum(["primary", "supporting", "context"]),
  excerpt: z.string().max(1000).optional(),
  limitations: z.array(z.string().max(500)).max(12),
});

const ClaimSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1).max(2000),
  claim_type: z.enum(["evidence_based", "qualified_inference", "assumption", "recommendation", "unsupported"]),
  status: z.enum(["supported", "qualified", "unsupported", "rejected"]),
  confidence: z.number().min(0).max(1),
  evidence_refs: z.array(z.string().min(1)).max(16),
  decision_refs: z.array(z.string().min(1)).max(16),
  uncertainty_refs: z.array(z.string().min(1)).max(16),
  limitations: z.array(z.string().max(500)).max(12),
});

const UncertaintySchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1).max(1000),
  category: z.enum(["missing_input", "unconfirmed_input", "assumption", "model_limit", "conflicting_evidence", "reference_gap"]),
  severity: z.enum(["low", "medium", "high"]),
  affects: z.array(z.string().min(1)).max(16),
  resolution: z.string().min(1).max(1000),
});

const DecisionImpactSchema = z.object({
  decision_ref: z.string().min(1),
  impact: z.enum(["supports", "clarifies", "challenges", "no_change"]),
  rationale: z.string().min(1).max(1500),
  preserved_authority: z.enum(["DECISION_POLICY", "READINESS_POLICY", "RULE_ENGINE", "HUMAN_APPROVAL"]),
  changed: z.literal(false),
});

const DecisionExplanationSchema = z.object({
  decision_ref: z.string().min(1).max(200),
  what_decided: z.string().min(1).max(1200),
  why_this_fits: z.string().min(1).max(2000),
  expected_effect: z.string().min(1).max(1500),
  tradeoffs: z.array(z.string().min(1).max(500)).max(8),
  risks: z.array(z.string().min(1).max(500)).max(8),
  what_would_change_it: z.array(z.string().min(1).max(500)).max(8),
  next_validation_step: z.string().min(1).max(1500),
  evidence_refs: z.array(z.string().min(1)).max(16),
  uncertainty_refs: z.array(z.string().min(1)).max(16),
});

const SafetySchema = z.object({
  status: z.enum(["safe", "rejected"]),
  can_mutate_cdks: z.literal(false),
  can_change_blueprint: z.literal(false),
  can_authorize_launch: z.literal(false),
  can_spend_budget: z.literal(false),
  external_actions_allowed: z.literal(false),
  budget_spend_allowed: z.literal(false),
  readiness_override_attempted: z.literal(false),
  blocked_actions: z.array(z.string().min(1)).max(16),
});

export const AIReasoningContractSchema = z.object({
  contract_version: z.literal("1.0"),
  source_contract_version: z.literal("3.0"),
  reasoning_id: z.string().uuid(),
  blueprint_id: z.string().uuid(),
  generated_at: z.string().datetime(),
  locale: z.enum(["ar", "en"]),
  purpose: z.enum(["explain", "critique", "gap_analysis", "synthesize"]),
  status: z.enum(["not_requested", "pending", "completed", "failed"]),
  authority: z.literal("AI_REASONING"),
  model: z.string().min(1).optional(),
  summary: z.string().max(3000).optional(),
  claims: z.array(ClaimSchema).max(32),
  evidence: z.array(EvidenceSchema).max(64),
  uncertainties: z.array(UncertaintySchema).max(32),
  decision_impacts: z.array(DecisionImpactSchema).max(32),
  decision_explanations: z.array(DecisionExplanationSchema).max(32).optional(),
  limitations: z.array(z.string().max(500)).max(24),
  grounding: z.object({
    evidence_coverage_percent: z.number().min(0).max(100),
    supported_claim_count: z.number().int().nonnegative(),
    qualified_claim_count: z.number().int().nonnegative(),
    unsupported_claim_count: z.number().int().nonnegative(),
    evidence_only_mode: z.boolean(),
  }),
  safety: SafetySchema,
  provenance: AiProvenanceSchema.optional(),
  failure: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
  }).optional(),
});

export type ValidatedAIReasoningContract = z.infer<typeof AIReasoningContractSchema>;

export class AIReasoningContractValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`AI Reasoning Contract semantic validation failed: ${issues.join("; ")}`);
    this.name = "AIReasoningContractValidationError";
  }
}

export function validateAIReasoningContract(data: unknown): ValidatedAIReasoningContract {
  const parsed = AIReasoningContractSchema.parse(data);
  const evidenceIds = new Set(parsed.evidence.map((item) => item.id));
  const uncertaintyIds = new Set(parsed.uncertainties.map((item) => item.id));
  const issues: string[] = [];

  for (const claim of parsed.claims) {
    const missingEvidence = claim.evidence_refs.filter((ref) => !evidenceIds.has(ref));
    const missingUncertainty = claim.uncertainty_refs.filter((ref) => !uncertaintyIds.has(ref));
    if (missingEvidence.length) issues.push(`${claim.id}: unknown evidence refs ${missingEvidence.join(", ")}`);
    if (missingUncertainty.length) issues.push(`${claim.id}: unknown uncertainty refs ${missingUncertainty.join(", ")}`);
    if (claim.claim_type === "evidence_based" && claim.evidence_refs.length === 0) {
      issues.push(`${claim.id}: evidence_based claims require evidence_refs`);
    }
    if (claim.claim_type === "unsupported" && !["unsupported", "rejected"].includes(claim.status)) {
      issues.push(`${claim.id}: unsupported claim must have unsupported or rejected status`);
    }
  }

  for (const impact of parsed.decision_impacts) {
    if (impact.preserved_authority === "HUMAN_APPROVAL" && impact.impact === "challenges") {
      issues.push(`${impact.decision_ref}: reasoning cannot challenge human approval authority`);
    }
  }

  for (const explanation of parsed.decision_explanations ?? []) {
    const missingEvidence = explanation.evidence_refs.filter((ref) => !evidenceIds.has(ref));
    const missingUncertainty = explanation.uncertainty_refs.filter((ref) => !uncertaintyIds.has(ref));
    if (missingEvidence.length) issues.push(`${explanation.decision_ref}: explanation has unknown evidence refs ${missingEvidence.join(", ")}`);
    if (missingUncertainty.length) issues.push(`${explanation.decision_ref}: explanation has unknown uncertainty refs ${missingUncertainty.join(", ")}`);
    if (explanation.evidence_refs.length === 0 && explanation.uncertainty_refs.length === 0) {
      issues.push(`${explanation.decision_ref}: explanation requires evidence_refs or uncertainty_refs`);
    }
  }

  const count = parsed.claims.reduce((result, claim) => {
    if (claim.status === "supported") result.supported += 1;
    if (claim.status === "qualified") result.qualified += 1;
    if (claim.status === "unsupported" || claim.status === "rejected") result.unsupported += 1;
    return result;
  }, { supported: 0, qualified: 0, unsupported: 0 });

  if (parsed.grounding.supported_claim_count !== count.supported) issues.push("grounding.supported_claim_count does not match claims");
  if (parsed.grounding.qualified_claim_count !== count.qualified) issues.push("grounding.qualified_claim_count does not match claims");
  if (parsed.grounding.unsupported_claim_count !== count.unsupported) issues.push("grounding.unsupported_claim_count does not match claims");
  if (parsed.status === "completed" && !parsed.summary) issues.push("completed reasoning requires summary");
  if (parsed.status === "failed" && !parsed.failure) issues.push("failed reasoning requires failure");
  if (parsed.status !== "failed" && parsed.failure) issues.push("failure is only allowed for failed reasoning");

  if (issues.length) throw new AIReasoningContractValidationError(issues);
  return parsed;
}

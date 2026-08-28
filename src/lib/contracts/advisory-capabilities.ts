import { z } from "zod";
import { AiProvenanceSchema, type AiProvenance } from "./ai-provenance";

export type AdvisoryCapability = "creative_planner" | "evidence_synthesizer" | "compliance_qa" | "rule_candidate_evaluator";
export type AdvisoryStatus = "draft" | "failed";
export type AdvisoryLocale = "ar" | "en";

export interface AdvisorySafety {
  advisory_only: true;
  draft_only: true;
  can_mutate_cdks: false;
  can_change_blueprint: false;
  can_authorize_launch: false;
  can_publish: false;
  can_spend_budget: false;
  external_actions_allowed: false;
  automated_rule_modification: false;
  human_review_required: true;
}

export interface AdvisoryScope {
  markets: string[];
  industries: string[];
  source_refs: string[];
  data_policy: "sanitized_wizard_only" | "evidence_package_only" | "offline_fixture_only";
}

export interface AdvisoryEnvelopeBase {
  contract_version: "1.0";
  capability: AdvisoryCapability;
  status: AdvisoryStatus;
  locale: AdvisoryLocale;
  generated_at: string;
  scope: AdvisoryScope;
  provenance: AiProvenance;
  safety: AdvisorySafety;
  unavailable_categories: string[];
  warnings: string[];
  failure?: { code: string; message: string; retryable: boolean };
}

export interface CreativeDraft {
  draft_id: string;
  format: "static" | "short_video" | "carousel" | "script";
  hook: string;
  primary_copy: string;
  script_or_frames: string[];
  visual_direction: string;
  call_to_action: string;
  evidence_refs: string[];
  unsupported_claims: string[];
}

export interface CreativePlannerOutput extends AdvisoryEnvelopeBase {
  capability: "creative_planner";
  drafts: CreativeDraft[];
}

export interface EvidenceFact {
  fact_id: string;
  statement: string;
  source_ref: string;
  observed_at: string;
  scope: string;
  confirmation: "verified" | "directional" | "unavailable";
  limitations: string[];
}

export interface EvidenceSynthesizerOutput extends AdvisoryEnvelopeBase {
  capability: "evidence_synthesizer";
  facts: EvidenceFact[];
  evidence_package_status: "evidence_only" | "insufficient_evidence";
}

export interface ComplianceFinding {
  finding_id: string;
  severity: "low" | "medium" | "high";
  category: "claim" | "privacy" | "creative" | "tracking" | "platform_policy";
  statement: string;
  remediation: string;
  evidence_refs: string[];
}

export interface ComplianceQAOutput extends AdvisoryEnvelopeBase {
  capability: "compliance_qa";
  findings: ComplianceFinding[];
  review_outcome: "pass_with_notes" | "needs_review" | "blocked_pending_human_review";
}

export interface RuleCandidate {
  candidate_id: string;
  rule_name: string;
  condition: string;
  advisory_recommendation: string;
  rationale: string;
  evidence_refs: string[];
  evaluation_status: "offline_fixture_only";
  requires_human_review: true;
  canonical_impact: "none_until_versioned_human_approval";
}

export interface RuleCandidateEvaluatorOutput extends AdvisoryEnvelopeBase {
  capability: "rule_candidate_evaluator";
  candidates: RuleCandidate[];
  evaluation_scope: "offline_fixture_only";
  canonical_rules_changed: false;
}

const SafetySchema = z.object({
  advisory_only: z.literal(true),
  draft_only: z.literal(true),
  can_mutate_cdks: z.literal(false),
  can_change_blueprint: z.literal(false),
  can_authorize_launch: z.literal(false),
  can_publish: z.literal(false),
  can_spend_budget: z.literal(false),
  external_actions_allowed: z.literal(false),
  automated_rule_modification: z.literal(false),
  human_review_required: z.literal(true),
});

const ScopeSchema = z.object({
  markets: z.array(z.string().min(1).max(120)).max(16),
  industries: z.array(z.string().min(1).max(120)).max(16),
  source_refs: z.array(z.string().min(1).max(200)).max(32),
  data_policy: z.enum(["sanitized_wizard_only", "evidence_package_only", "offline_fixture_only"]),
});

const BaseSchema = z.object({
  contract_version: z.literal("1.0"),
  capability: z.enum(["creative_planner", "evidence_synthesizer", "compliance_qa", "rule_candidate_evaluator"]),
  status: z.enum(["draft", "failed"]),
  locale: z.enum(["ar", "en"]),
  generated_at: z.string().datetime(),
  scope: ScopeSchema,
  provenance: AiProvenanceSchema,
  safety: SafetySchema,
  unavailable_categories: z.array(z.string().min(1).max(200)).max(32),
  warnings: z.array(z.string().min(1).max(500)).max(32),
  failure: z.object({ code: z.string().min(1), message: z.string().min(1), retryable: z.boolean() }).optional(),
});

const CreativeDraftSchema = z.object({
  draft_id: z.string().min(1),
  format: z.enum(["static", "short_video", "carousel", "script"]),
  hook: z.string().min(1).max(600),
  primary_copy: z.string().min(1).max(2000),
  script_or_frames: z.array(z.string().min(1).max(1000)).max(20),
  visual_direction: z.string().min(1).max(1200),
  call_to_action: z.string().min(1).max(300),
  evidence_refs: z.array(z.string().min(1)).max(16),
  unsupported_claims: z.array(z.string().min(1).max(500)).max(16),
});

const EvidenceFactSchema = z.object({
  fact_id: z.string().min(1),
  statement: z.string().min(1).max(2000),
  source_ref: z.string().min(1),
  observed_at: z.string().min(1).max(100),
  scope: z.string().min(1).max(300),
  confirmation: z.enum(["verified", "directional", "unavailable"]),
  limitations: z.array(z.string().min(1).max(500)).max(12),
});

const ComplianceFindingSchema = z.object({
  finding_id: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  category: z.enum(["claim", "privacy", "creative", "tracking", "platform_policy"]),
  statement: z.string().min(1).max(1200),
  remediation: z.string().min(1).max(1200),
  evidence_refs: z.array(z.string().min(1)).max(16),
});

const RuleCandidateSchema = z.object({
  candidate_id: z.string().min(1),
  rule_name: z.string().min(1).max(200),
  condition: z.string().min(1).max(1500),
  advisory_recommendation: z.string().min(1).max(1500),
  rationale: z.string().min(1).max(1500),
  evidence_refs: z.array(z.string().min(1)).max(16),
  evaluation_status: z.literal("offline_fixture_only"),
  requires_human_review: z.literal(true),
  canonical_impact: z.literal("none_until_versioned_human_approval"),
});

export const CreativePlannerOutputSchema = BaseSchema.extend({ capability: z.literal("creative_planner"), drafts: z.array(CreativeDraftSchema).max(24) });
export const EvidenceSynthesizerOutputSchema = BaseSchema.extend({ capability: z.literal("evidence_synthesizer"), facts: z.array(EvidenceFactSchema).max(64), evidence_package_status: z.enum(["evidence_only", "insufficient_evidence"]) });
export const ComplianceQAOutputSchema = BaseSchema.extend({ capability: z.literal("compliance_qa"), findings: z.array(ComplianceFindingSchema).max(64), review_outcome: z.enum(["pass_with_notes", "needs_review", "blocked_pending_human_review"]) });
export const RuleCandidateEvaluatorOutputSchema = BaseSchema.extend({ capability: z.literal("rule_candidate_evaluator"), candidates: z.array(RuleCandidateSchema).max(32), evaluation_scope: z.literal("offline_fixture_only"), canonical_rules_changed: z.literal(false) });

export const AdvisoryOutputSchema = z.discriminatedUnion("capability", [CreativePlannerOutputSchema, EvidenceSynthesizerOutputSchema, ComplianceQAOutputSchema, RuleCandidateEvaluatorOutputSchema]);
export type ValidatedAdvisoryOutput = z.infer<typeof AdvisoryOutputSchema>;

export function validateAdvisoryOutput(data: unknown): ValidatedAdvisoryOutput {
  const parsed = AdvisoryOutputSchema.parse(data);
  if (parsed.status === "failed" && !parsed.failure) throw new Error("Failed advisory output requires failure details.");
  if (parsed.status === "draft" && parsed.failure) throw new Error("Draft advisory output cannot contain failure details.");
  if (parsed.scope.data_policy === "offline_fixture_only" && parsed.provenance.provider !== "mock") throw new Error("Offline fixture advisory output must use mock provenance.");
  return parsed;
}

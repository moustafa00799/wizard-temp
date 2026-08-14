import type { CanonicalWizardInput } from "./contracts/wizard-input";

export interface CDKSReadinessDecision {
  value: "ready" | "review" | "blocked";
  authority: "READINESS_POLICY";
  rule_id: string;
  evidence: string[];
  uncertainty: string[];
}

export function resolveCDKSReadiness(input: CanonicalWizardInput): CDKSReadinessDecision {
  const evidence: string[] = [];
  const uncertainty: string[] = [];

  if (!input.final_confirmed_inputs) {
    return { value: "blocked", authority: "READINESS_POLICY", rule_id: "CDKS-READINESS-UNCONFIRMED", evidence: ["final_confirmed_inputs"], uncertainty: ["inputs_not_finally_confirmed"] };
  }

  if (input.tracking_status === "missing" || input.tracking_status === "issues") {
    return { value: "blocked", authority: "READINESS_POLICY", rule_id: "CDKS-READINESS-TRACKING-BLOCKER", evidence: ["tracking_status"], uncertainty: ["tracking_not_ready"] };
  }

  evidence.push("final_confirmed_inputs", "tracking_status");
  if (!input.conversion_destination) {
    return { value: "review", authority: "READINESS_POLICY", rule_id: "CDKS-READINESS-CONVERSION-REVIEW", evidence, uncertainty: ["conversion_destination_missing"] };
  }

  return { value: "ready", authority: "READINESS_POLICY", rule_id: "CDKS-READINESS-CANONICAL", evidence, uncertainty };
}

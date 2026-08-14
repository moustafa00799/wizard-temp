import type { CanonicalWizardInput } from "./contracts/wizard-input";

export interface CDKSDecision<T> {
  value: T;
  authority: "DECISION_POLICY";
  rule_id: string;
  evidence: string[];
  uncertainty: string[];
}

export interface CDKSDecisionEnvelope {
  policy_version: "v1.0";
  objective: CDKSDecision<string>;
  funnel: CDKSDecision<string>;
  channels: CDKSDecision<string[]>;
}

function objective(input: CanonicalWizardInput): CDKSDecision<string> {
  return { value: input.primary_objective || "awareness", authority: "DECISION_POLICY", rule_id: "CDKS-OBJ-CANONICAL", evidence: ["primary_objective"], uncertainty: [] };
}

function funnel(input: CanonicalWizardInput): CDKSDecision<string> {
  if (input.business_type === "b2b" && input.conversion_destination === "call") return { value: "lead_gen_call", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-B2B-CALL", evidence: ["business_type", "conversion_destination"], uncertainty: [] };
  if (input.sales_motion === "retargeting" && input.conversion_destination === "website_purchase") return { value: "direct_conversion", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-RETARGET-DIRECT", evidence: ["sales_motion", "conversion_destination"], uncertainty: [] };
  if (input.sales_motion === "whatsapp" && input.conversion_destination === "whatsapp") return { value: "direct_whatsapp", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-WHATSAPP", evidence: ["sales_motion", "conversion_destination"], uncertainty: [] };
  if (input.awareness_level === "unaware") return { value: "education_funnel", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-UNAWARE-EDUCATION", evidence: ["awareness_level"], uncertainty: [] };
  if (input.awareness_level === "problem_aware") return { value: "solution_funnel", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-PROBLEM-AWARE-SOLUTION", evidence: ["awareness_level"], uncertainty: [] };
  if (input.awareness_level === "solution_aware" && input.offer_type !== "no_clear_offer") return { value: "trust_funnel", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-SOLUTION-AWARE-TRUST", evidence: ["awareness_level", "offer_type"], uncertainty: [] };
  if (input.awareness_level === "brand_aware" && ["sales", "leads"].includes(input.primary_objective)) return { value: "direct_conversion", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-BRAND-DIRECT", evidence: ["awareness_level", "primary_objective"], uncertainty: [] };
  if (input.awareness_level === "purchase_ready") return { value: "direct_conversion", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-PURCHASE-READY", evidence: ["awareness_level"], uncertainty: [] };
  return { value: "unresolved", authority: "DECISION_POLICY", rule_id: "CDKS-FUN-NO-RULE", evidence: [], uncertainty: ["no_canonical_funnel_rule"] };
}

function channels(input: CanonicalWizardInput): CDKSDecision<string[]> {
  const allowed = ["meta", "google_ads", "tiktok_ads", "snapchat_ads", "youtube", "linkedin", "x"];
  const selected = input.ad_channels.filter((channel) => allowed.includes(channel));
  return { value: selected, authority: "DECISION_POLICY", rule_id: "CDKS-CHANNEL-CANONICAL", evidence: ["ad_channels"], uncertainty: selected.length ? [] : ["no_canonical_channel_selection"] };
}

export function resolveCDKSDecisions(input: CanonicalWizardInput): CDKSDecisionEnvelope {
  return { policy_version: "v1.0", objective: objective(input), funnel: funnel(input), channels: channels(input) };
}

import { CANONICAL_WIZARD_FIELDS, type CanonicalWizardInput } from "./wizard-input";
import type { CanonicalBlueprint } from "./canonical-blueprint";
import {
  validateBlueprintContractV3,
  type BlueprintContractV3,
  type BlueprintDecision,
  type BlueprintProvenanceEntry,
  type BlueprintWarning,
} from "./blueprint-contract-v3";

type RequestMetadata = {
  locale?: unknown;
  output_language?: unknown;
  currency?: unknown;
  meta?: { locale?: unknown; output_language?: unknown; currency?: unknown };
  metadata?: { locale?: unknown; output_language?: unknown; currency?: unknown };
  _fixture?: { scenario_id?: unknown; assumptions?: unknown[]; output_language?: unknown; currency?: unknown };
};

function metadataValue(body: RequestMetadata, key: "locale" | "currency"): unknown {
  if (key === "locale") {
    return body.locale ?? body.output_language ?? body.meta?.locale ?? body.meta?.output_language ?? body.metadata?.locale ?? body.metadata?.output_language ?? body._fixture?.output_language;
  }
  return body.currency ?? body.meta?.currency ?? body.metadata?.currency ?? body._fixture?.currency;
}

function resolveLocale(body: RequestMetadata): "ar" | "en" {
  return metadataValue(body, "locale") === "en" ? "en" : "ar";
}

function resolveCurrency(body: RequestMetadata): "EGP" | "SAR" | "USD" {
  const value = metadataValue(body, "currency");
  return value === "SAR" || value === "USD" ? value : "EGP";
}

function mapReadiness(value: CanonicalBlueprint["executive_summary"]["launch_recommendation"]): "ready" | "review" | "blocked" {
  if (value === "ready") return "ready";
  if (value === "ready_with_fixes") return "review";
  return "blocked";
}

function decision<T>(
  value: T,
  ruleId: string | undefined,
  confidence: number | undefined,
  reasoning: string | undefined,
  evidence: string[],
  uncertainty: string[] = [],
): BlueprintDecision<T> {
  return {
    value,
    authority: "DECISION_POLICY",
    ...(ruleId ? { rule_id: ruleId } : {}),
    ...(typeof confidence === "number" ? { confidence } : {}),
    evidence,
    uncertainty,
    ...(reasoning ? { reasoning } : {}),
  };
}

function buildWarnings(input: CanonicalWizardInput, blueprint: CanonicalBlueprint): BlueprintWarning[] {
  const warnings: BlueprintWarning[] = [];
  const add = (
    code: string,
    severity: BlueprintWarning["severity"],
    message: string,
    action: string,
    evidence: string[],
    authority: BlueprintWarning["authority"],
  ) => warnings.push({ code, severity, message, action, evidence, authority });

  if (!input.final_confirmed_inputs) {
    add(
      "DATA-ASSUMPTIONS-UNCONFIRMED",
      "warning",
      "Some Wizard inputs are not finally confirmed and may include assumptions.",
      "Review and confirm the Wizard inputs before any launch decision.",
      ["final_confirmed_inputs"],
      "HUMAN_APPROVAL",
    );
  }

  if (input.tracking_status === "missing") {
    add(
      "TRACKING-BLOCKER",
      "error",
      "Tracking setup is missing and blocks launch readiness.",
      "Install and verify the required tracking tools and conversion events.",
      ["tracking_status", "tracking_tools", "key_events"],
      "READINESS_POLICY",
    );
  } else if (input.tracking_status === "partial") {
    add(
      "TRACKING-PARTIAL",
      "warning",
      "Tracking setup is partial and requires verification before launch.",
      "Complete the missing tools or verify event firing.",
      ["tracking_status", "tracking_tools", "key_events"],
      "READINESS_POLICY",
    );
  }

  if (input.creative_assets.length === 0) {
    add(
      "CREATIVE-ASSETS-BLOCKER",
      "error",
      "No creative assets were provided.",
      "Prepare at least one creative variant and validate the required formats.",
      ["creative_assets"],
      "READINESS_POLICY",
    );
  } else if (input.creative_assets.length < 3) {
    add(
      "CREATIVE-ASSETS-LIMITED",
      "warning",
      "Fewer than three creative variants were provided.",
      "Prepare additional variants to reduce creative fatigue during testing.",
      ["creative_assets"],
      "READINESS_POLICY",
    );
  }

  if (input.content_capacity === "none") {
    add(
      "CONTENT-CAPACITY-BLOCKER",
      "error",
      "No content production capacity was provided.",
      "Allocate internal or external content production capacity before launch.",
      ["content_capacity"],
      "READINESS_POLICY",
    );
  } else if (input.content_capacity === "low") {
    add(
      "CONTENT-CAPACITY-LIMITED",
      "warning",
      "Content production capacity is limited.",
      "Plan a production schedule or allocate external production resources.",
      ["content_capacity"],
      "READINESS_POLICY",
    );
  }

  if (input.constraints.includes("approvals")) {
    add(
      "STAKEHOLDER-APPROVAL-REQUIRED",
      "warning",
      "Stakeholder approvals are listed as a campaign constraint.",
      "Secure the required approvals before treating the Blueprint as launch-ready.",
      ["constraints"],
      "READINESS_POLICY",
    );
  }

  if (input.ad_channels.length === 0) {
    add(
      "CHANNELS-UNRESOLVED",
      "error",
      "No advertising channel was selected.",
      "Select at least one channel in the Wizard before generating a deployable Blueprint.",
      ["ad_channels"],
      "DECISION_POLICY",
    );
  }

  if (!["local_service", "ecommerce", "app", "b2b"].includes(input.business_type)) {
    add(
      "BUSINESS-BRANCH-EXTENDED",
      "info",
      "This business branch is outside the Phase-one primary branch set.",
      "Review the generated strategy as an extended regression scenario.",
      ["business_type"],
      "DEFAULT_ASSUMPTION",
    );
  }

  for (const error of blueprint.flags?.errors ?? []) {
    if (!warnings.some((warning) => warning.message === error)) {
      add("CDKS-BLOCKER", "error", error, "Resolve the CDKS blocker before launch.", ["blueprint.flags.errors"], "READINESS_POLICY");
    }
  }
  return warnings;
}

function buildProvenance(input: CanonicalWizardInput, blueprint: CanonicalBlueprint, requestBody: RequestMetadata): BlueprintProvenanceEntry[] {
  const confirmed = input.final_confirmed_inputs;
  const fixtureAssumptions = new Set((requestBody._fixture?.assumptions ?? []).filter((value): value is string => typeof value === "string"));
  const scenarioId = typeof requestBody._fixture?.scenario_id === "string" ? requestBody._fixture.scenario_id : undefined;
  const entries: BlueprintProvenanceEntry[] = CANONICAL_WIZARD_FIELDS.map((field) => {
    const isAssumption = !confirmed && (fixtureAssumptions.size === 0 || fixtureAssumptions.has(field));
    return {
      path: `source_wizard_input.${field}`,
      source: isAssumption ? "assumption" : "input",
      authority: isAssumption ? "DEFAULT_ASSUMPTION" : "WIZARD_INPUT",
      source_ref: scenarioId ? `fixture:${scenarioId}:${isAssumption ? "synthetic-assumption" : "input"}` : "wizard_input",
      assumptions: isAssumption ? (fixtureAssumptions.size ? [field] : ["Wizard inputs are not finally confirmed."]) : [],
      user_confirmed: confirmed && !isAssumption,
    };
  });

  const decisions = [
    ["decisions.objective", "DECISION_POLICY", blueprint.strategy.recommended_objective.rule_id],
    ["decisions.funnel", "DECISION_POLICY", blueprint.strategy.funnel_type.rule_id],
    ["decisions.channels", "DECISION_POLICY", blueprint.strategy.recommended_channels.rule_id],
    ["readiness", "READINESS_POLICY", "LR-001"],
  ] as const;
  for (const [path, authority, sourceRef] of decisions) {
    entries.push({
      path,
      source: "rule",
      authority,
      source_ref: sourceRef ?? "cdks-policy",
      assumptions: [],
      user_confirmed: confirmed,
    });
  }
  return entries;
}

export function buildBlueprintContractV3(
  input: CanonicalWizardInput,
  blueprint: CanonicalBlueprint,
  requestBody: RequestMetadata = {},
): BlueprintContractV3 {
  const generatedAt = new Date().toISOString();
  const engineReadinessValue = mapReadiness(blueprint.executive_summary.launch_recommendation);
  const readinessValue = input.final_confirmed_inputs ? engineReadinessValue : "blocked";
  const readinessUncertainty = input.final_confirmed_inputs ? [] : ["inputs_not_finally_confirmed"];
  const warnings = buildWarnings(input, blueprint);
  const contract: BlueprintContractV3 = {
    contract_version: "3.0",
    blueprint_id: blueprint.blueprint_id,
    generated_at: generatedAt,
    locale: resolveLocale(requestBody),
    currency: resolveCurrency(requestBody),
    generation_mode: "blueprint_only",
    source_wizard_input: input,
    decisions: {
      objective: decision(
        blueprint.strategy.recommended_objective.value,
        blueprint.strategy.recommended_objective.rule_id ?? "CDKS-OBJ-USER-CONFIRMED",
        blueprint.strategy.recommended_objective.confidence,
        blueprint.strategy.recommended_objective.reasoning,
        ["primary_objective"],
      ),
      funnel: decision(
        blueprint.strategy.funnel_type.value,
        blueprint.strategy.funnel_type.rule_id,
        blueprint.strategy.funnel_type.confidence,
        blueprint.strategy.funnel_type.reasoning,
        ["awareness_level", "offer_type"],
      ),
      channels: decision(
        blueprint.strategy.recommended_channels.value,
        blueprint.strategy.recommended_channels.rule_id,
        blueprint.strategy.recommended_channels.confidence,
        blueprint.strategy.recommended_channels.reasoning,
        ["ad_channels"],
      ),
    },
    strategy: {
      status: "not_requested",
      authority: "AI_STRATEGY_BUILDER",
      proposed_changes: [],
      accepted_changes: [],
      rejected_changes: [],
      limitations: ["AI Strategy Builder is disabled in Phase 1; deterministic CDKS output is authoritative."],
    },
    reasoning: {
      status: "not_requested",
      authority: "AI_REASONING",
      supported_claims: [],
      unsupported_claims: [],
      limitations: ["AI Reasoning is disabled in Phase 1; policy reasoning is preserved in decision traces."],
    },
    readiness: {
      value: readinessValue,
      authority: "READINESS_POLICY",
      rule_id: "LR-001",
      confidence: 0.9,
      evidence: ["tracking_status", "creative_assets", "content_capacity", "constraints", "final_confirmed_inputs"],
      uncertainty: readinessUncertainty,
      reasoning: input.final_confirmed_inputs
        ? blueprint.governance.risk_flags.risk_score.reasoning
        : "Human confirmation is required before launch readiness can be considered.",
    },
    warnings,
    provenance: buildProvenance(input, blueprint, requestBody),
    validation: {
      schema_valid: true,
      canonical_field_count: CANONICAL_WIZARD_FIELDS.length,
      canonical_field_errors: [],
      external_actions_allowed: false,
      budget_spend_allowed: false,
    },
    blueprint,
  };
  return validateBlueprintContractV3(contract) as BlueprintContractV3;
}

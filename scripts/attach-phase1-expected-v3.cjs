const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const approved = new Set(["local_service", "ecommerce", "app", "b2b"]);

function decision(value, rule_id, evidence, uncertainty = []) {
  return { value, authority: "DECISION_POLICY", rule_id, evidence, uncertainty };
}

function resolveObjective(input) {
  return decision(input.primary_objective || "awareness", input.primary_objective ? "CDKS-OBJ-USER-CONFIRMED" : "FALLBACK-OBJ-001", ["primary_objective"]);
}

function resolveFunnel(input, objective) {
  if (objective.value === "app_installs") return decision("trust_funnel", "FUN-GD-001", ["primary_objective"]);
  if (objective.value === "awareness") return decision("education_funnel", "FUN-GD-002", ["primary_objective"]);
  if (input.business_type === "b2b" && objective.value === "leads" && (input.sales_motion === "call" || input.conversion_destination === "form")) return decision("lead_gen_call", "FUN-GD-003", ["business_type", "primary_objective", "sales_motion", "conversion_destination"]);
  if (input.business_type === "education" && objective.value === "leads") return decision("solution_funnel", "FUN-GD-005", ["business_type", "primary_objective"]);
  if (objective.value === "leads" && input.risk_tolerance === "high_if_return") return decision("trust_funnel", "FUN-GD-006", ["primary_objective", "risk_tolerance"]);
  if (input.business_type === "local_service" && objective.value === "messages") return decision("education_funnel", "FUN-GD-007", ["business_type", "primary_objective"]);
  if (input.campaign_direction === "retargeting" || input.awareness_level === "product_aware" || input.awareness_level === "purchase_ready") return decision("direct_conversion", "FUN-GD-009", ["campaign_direction", "awareness_level"]);
  if ((input.business_type === "ecommerce" || input.business_type === "retail") && objective.value === "sales") return decision("trust_funnel", "FUN-GEN-001", ["business_type", "primary_objective"]);
  if (objective.value === "sales") return decision("trust_funnel", "FUN-GEN-002", ["primary_objective"]);
  if (objective.value === "leads") return decision("solution_funnel", "FUN-GEN-003", ["primary_objective"]);
  return decision("education_funnel", "FALLBACK-FUN-001", []);
}

function resolveChannels(input, objective, funnel) {
  if (input.business_type === "b2b" && objective.value === "leads" && funnel.value === "lead_gen_call") return decision(["google_ads", "linkedin"], "CH-GD-003", ["business_type", "primary_objective", "conversion_destination"]);
  if (objective.value === "app_installs") return decision(["meta", "tiktok_ads"], "CH-GD-001", ["primary_objective"]);
  if (input.business_type === "local_service" && objective.value === "messages") return decision(["meta", "google_ads"], "CH-GD-007", ["business_type", "primary_objective"]);
  if (input.campaign_direction === "retargeting" || input.awareness_level === "product_aware" || input.awareness_level === "purchase_ready") return decision(["google_ads", "meta"], "CH-GD-009", ["campaign_direction", "awareness_level"]);
  if (input.business_type === "ecommerce" && objective.value === "sales") return decision(["google_ads", "meta", "tiktok_ads"], "CH-GD-004", ["business_type", "primary_objective"]);
  if (objective.value === "awareness") return decision(["meta", "tiktok_ads"], "CH-001", ["primary_objective"]);
  if (objective.value === "leads") return decision(["google_ads", "meta", "linkedin"], "CH-002", ["primary_objective"]);
  return decision(["meta", "google_ads"], "CH-FALLBACK", ["primary_objective"]);
}

function readiness(input) {
  const blockers = [];
  const fixes = [];
  if (input.tracking_status === "missing") blockers.push("Missing tracking setup (pixel, GA4, or GTM)");
  else if (input.tracking_status === "partial") fixes.push("Complete missing tracking tools or verify event firing.");
  if ((input.creative_assets || []).length === 0) blockers.push("No creative assets provided (images, videos, or testimonials)");
  else if (input.creative_assets.length < 3) fixes.push("Prepare additional creative variants to avoid ad fatigue.");
  const capacity = input.content_capacity || "medium";
  if (capacity === "none") blockers.push("No content production capacity");
  else if (capacity === "low") fixes.push("Plan content production schedule or allocate budget for external content creators.");
  if ((input.constraints || []).includes("approvals")) fixes.push("Secure all necessary stakeholder approvals before launch.");
  if ((input.constraints || []).includes("content") && capacity !== "easy") fixes.push("Address content production bottlenecks.");
  if (input.previous_campaigns_status === "weak" && input.build_mode === "optimize") fixes.push("Review past campaign data to avoid repeating targeting/budget mistakes.");
  if (!input.final_confirmed_inputs) return { value: "blocked", authority: "READINESS_POLICY", rule_id: "CDKS-READINESS-UNCONFIRMED", evidence: ["final_confirmed_inputs"], uncertainty: ["inputs_not_finally_confirmed"] };
  if (blockers.length) return { value: "blocked", authority: "READINESS_POLICY", rule_id: "LR-001", evidence: ["tracking_status", "creative_assets", "content_capacity"], uncertainty: [] };
  if (fixes.length) return { value: "review", authority: "READINESS_POLICY", rule_id: "LR-001", evidence: ["tracking_status", "creative_assets", "content_capacity", "constraints"], uncertainty: [] };
  return { value: "ready", authority: "READINESS_POLICY", rule_id: "LR-001", evidence: ["tracking_status", "creative_assets", "content_capacity"], uncertainty: [] };
}

function warnings(input, meta, funnel, before) {
  const result = [];
  const add = (code, severity, message, action, evidence, authority) => result.push({ code, severity, message, action, evidence, authority });
  if (meta.assumptions.length) add("DATA-ASSUMPTIONS-UNCONFIRMED", "warning", "Some Wizard inputs are not finally confirmed and may include assumptions.", "Review and confirm the Wizard inputs before any launch decision.", ["final_confirmed_inputs"], "HUMAN_APPROVAL");
  if (input.tracking_status === "missing") add("TRACKING-BLOCKER", "error", "Tracking setup is missing and blocks launch readiness.", "Install and verify the required tracking tools and conversion events.", ["tracking_status", "tracking_tools", "key_events"], "READINESS_POLICY");
  else if (input.tracking_status === "partial") add("TRACKING-PARTIAL", "warning", "Tracking setup is partial and requires verification before launch.", "Complete the missing tools or verify event firing.", ["tracking_status", "tracking_tools", "key_events"], "READINESS_POLICY");
  if ((input.creative_assets || []).length === 0) add("CREATIVE-ASSETS-BLOCKER", "error", "No creative assets were provided.", "Prepare at least one creative variant and validate the required formats.", ["creative_assets"], "READINESS_POLICY");
  else if (input.creative_assets.length < 3) add("CREATIVE-ASSETS-LIMITED", "warning", "Fewer than three creative variants were provided.", "Prepare additional variants to reduce creative fatigue during testing.", ["creative_assets"], "READINESS_POLICY");
  if (input.content_capacity === "none") add("CONTENT-CAPACITY-BLOCKER", "error", "No content production capacity was provided.", "Allocate internal or external content production capacity before launch.", ["content_capacity"], "READINESS_POLICY");
  else if (input.content_capacity === "low") add("CONTENT-CAPACITY-LIMITED", "warning", "Content production capacity is limited.", "Plan a production schedule or allocate external production resources.", ["content_capacity"], "READINESS_POLICY");
  if ((input.constraints || []).includes("approvals")) add("STAKEHOLDER-APPROVAL-REQUIRED", "warning", "Stakeholder approvals are listed as a campaign constraint.", "Secure the required approvals before treating the Blueprint as launch-ready.", ["constraints"], "READINESS_POLICY");
  if (!approved.has(input.business_type)) add("BUSINESS-BRANCH-EXTENDED", "info", "This business branch is outside the Phase-one primary branch set.", "Review the generated strategy as an extended regression scenario.", ["business_type"], "DEFAULT_ASSUMPTION");
  if (before.value === "blocked" && !result.some((warning) => warning.severity === "error") && input.final_confirmed_inputs) add("CDKS-BLOCKER", "error", "The current fixture is blocked by a deterministic readiness policy.", "Resolve the cited readiness evidence before launch.", before.evidence, "READINESS_POLICY");
  return result;
}

function provenance(input, meta, objective, funnel, channels, ready) {
  const entries = [];
  const confirmed = input.final_confirmed_inputs === true;
  for (const field of Object.keys(input)) {
    const assumption = meta.assumptions.includes(field);
    entries.push({ path: `source_wizard_input.${field}`, source: assumption ? "assumption" : "input", authority: assumption ? "DEFAULT_ASSUMPTION" : "WIZARD_INPUT", source_ref: assumption ? `fixture:${meta.scenario_id}:synthetic-assumption` : `fixture:${meta.scenario_id}:input`, assumptions: assumption ? [field] : [], user_confirmed: confirmed && !assumption });
  }
  for (const [name, item] of Object.entries({ objective, funnel, channels, readiness: ready })) {
    entries.push({ path: name === "readiness" ? "readiness" : `decisions.${name}`, source: "rule", authority: name === "readiness" ? "READINESS_POLICY" : "DECISION_POLICY", source_ref: item.rule_id, assumptions: [], user_confirmed: false });
  }
  return entries;
}

for (const name of fs.readdirSync(root).filter((file) => /^EX-.*\.json$/.test(file)).sort()) {
  const file = path.join(root, name);
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const input = payload.input;
  const meta = payload._fixture;
  const objective = resolveObjective(input);
  const funnel = resolveFunnel(input, objective);
  const channels = resolveChannels(input, objective, funnel);
  const readinessBefore = readiness(input);
  const readinessAfter = readiness({ ...input, final_confirmed_inputs: true });
  payload.expected_v3 = {
    contract_version: "3.0",
    generation_mode: "blueprint_only",
    locale: meta.output_language,
    currency: meta.currency,
    decisions: { objective, funnel, channels },
    expected_outcomes: { objective: objective.value, funnel: funnel.value, readiness_before_confirmation: readinessBefore.value, readiness_after_confirmation: readinessAfter.value },
    readiness: readinessBefore,
    warnings: warnings(input, meta, funnel, readinessBefore),
    strategy: { status: "not_requested", authority: "AI_STRATEGY_BUILDER", proposed_changes: [], accepted_changes: [], rejected_changes: [], limitations: ["AI Strategy Builder is not enabled in Phase 1."] },
    reasoning: { status: "not_requested", authority: "AI_REASONING", supported_claims: [], unsupported_claims: [], limitations: ["AI Reasoning is not enabled in Phase 1."] },
    provenance: provenance(input, meta, objective, funnel, channels, readinessBefore),
    validation: { schema_valid: true, canonical_field_count: Object.keys(input).length, canonical_field_errors: [], external_actions_allowed: false, budget_spend_allowed: false },
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(`Attached policy-aligned v3 expected outcomes to 10 fixtures under ${root}`);

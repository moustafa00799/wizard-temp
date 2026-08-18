const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const approved = new Set(["local_service", "ecommerce", "app", "b2b"]);
const allowedChannels = new Set(["meta", "google_ads", "tiktok_ads", "snapchat_ads", "youtube", "linkedin", "x"]);

function decision(value, rule_id, evidence, uncertainty = []) {
  return {
    value,
    authority: "DECISION_POLICY",
    rule_id,
    evidence,
    uncertainty,
  };
}

function resolveFunnel(input) {
  if (input.business_type === "b2b" && input.conversion_destination === "call") {
    return decision("lead_gen_call", "CDKS-FUN-B2B-CALL", ["business_type", "conversion_destination"]);
  }
  if (input.sales_motion === "retargeting" && input.conversion_destination === "website_purchase") {
    return decision("direct_conversion", "CDKS-FUN-RETARGET-DIRECT", ["sales_motion", "conversion_destination"]);
  }
  if (input.sales_motion === "whatsapp" && input.conversion_destination === "whatsapp") {
    return decision("direct_whatsapp", "CDKS-FUN-WHATSAPP", ["sales_motion", "conversion_destination"]);
  }
  if (input.awareness_level === "unaware") {
    return decision("education_funnel", "CDKS-FUN-UNAWARE-EDUCATION", ["awareness_level"]);
  }
  if (input.awareness_level === "problem_aware") {
    return decision("solution_funnel", "CDKS-FUN-PROBLEM-AWARE-SOLUTION", ["awareness_level"]);
  }
  if (input.awareness_level === "solution_aware" && input.offer_type !== "no_clear_offer") {
    return decision("trust_funnel", "CDKS-FUN-SOLUTION-AWARE-TRUST", ["awareness_level", "offer_type"]);
  }
  if (input.awareness_level === "brand_aware" && ["sales", "leads"].includes(input.primary_objective)) {
    return decision("direct_conversion", "CDKS-FUN-BRAND-DIRECT", ["awareness_level", "primary_objective"]);
  }
  if (input.awareness_level === "purchase_ready") {
    return decision("direct_conversion", "CDKS-FUN-PURCHASE-READY", ["awareness_level"]);
  }
  return decision("unresolved", "CDKS-FUN-NO-RULE", [], ["no_canonical_funnel_rule"]);
}

function readiness(input) {
  const build = (value, rule_id, evidence, uncertainty = []) => ({
    value,
    authority: "READINESS_POLICY",
    rule_id,
    evidence,
    uncertainty,
  });
  if (!input.final_confirmed_inputs) {
    return build("blocked", "CDKS-READINESS-UNCONFIRMED", ["final_confirmed_inputs"], ["inputs_not_finally_confirmed"]);
  }
  if (["missing", "issues"].includes(input.tracking_status)) {
    return build("blocked", "CDKS-READINESS-TRACKING-BLOCKER", ["tracking_status"], ["tracking_not_ready"]);
  }
  if (!input.conversion_destination) {
    return build("review", "CDKS-READINESS-CONVERSION-REVIEW", ["final_confirmed_inputs", "tracking_status"], ["conversion_destination_missing"]);
  }
  return build("ready", "CDKS-READINESS-CANONICAL", ["final_confirmed_inputs", "tracking_status"]);
}

function warnings(input, meta, funnel, finalReadiness) {
  const result = [];
  const add = (code, severity, message, action, evidence, authority) => result.push({ code, severity, message, action, evidence, authority });
  if (meta.assumptions.length) {
    add("DATA-ASSUMPTIONS-UNCONFIRMED", "error", "Some canonical fields are synthetic assumptions and require owner confirmation.", "Review the assumptions and set final_confirmed_inputs to true only after approval.", meta.assumptions, "READINESS_POLICY");
  }
  if (["missing", "issues"].includes(input.tracking_status)) {
    add("TRACKING-BLOCKER", "error", "Tracking is missing or has issues, so launch readiness remains blocked.", "Configure and validate the required conversion events before launch.", ["tracking_status", "key_events"], "READINESS_POLICY");
  } else if (input.tracking_status === "partial") {
    add("TRACKING-PARTIAL", "warning", "Tracking is partial and requires validation before scaling.", "Complete and test the conversion event map and reporting checks.", ["tracking_status", "tracking_tools", "key_events"], "READINESS_POLICY");
  }
  if (funnel.value === "unresolved") {
    add("FUNNEL-UNRESOLVED", "warning", "No canonical funnel policy matched the current input combination.", "Require a strategy review before accepting the funnel recommendation.", funnel.evidence, "DECISION_POLICY");
  }
  if (!approved.has(input.business_type)) {
    add("BRANCH-EXTENDED", "info", "This business branch is retained as an extended regression fixture and is outside the approved phase-one branch set.", "Keep it in regression tests but do not use it as a primary production branch until explicitly approved.", ["business_type"], "WIZARD_INPUT");
  }
  if (!input.ad_channels.filter((channel) => allowedChannels.has(channel)).length) {
    add("CHANNELS-EMPTY", "error", "No canonical advertising channel was selected.", "Select at least one supported channel before generating a launch-ready blueprint.", ["ad_channels"], "DECISION_POLICY");
  }
  if (finalReadiness.value === "blocked" && !result.some((warning) => warning.severity === "error")) {
    add("READINESS-BLOCKED", "error", "The current fixture is blocked by a deterministic readiness policy.", "Resolve the cited readiness evidence before launch.", finalReadiness.evidence, "READINESS_POLICY");
  }
  return result;
}

function provenance(input, meta, objective, funnel, channels, ready) {
  const entries = [];
  const confirmed = input.final_confirmed_inputs === true;
  for (const field of Object.keys(input)) {
    const assumption = meta.assumptions.includes(field);
    entries.push({
      path: `source_wizard_input.${field}`,
      source: assumption ? "assumption" : "input",
      authority: assumption ? "DEFAULT_ASSUMPTION" : "WIZARD_INPUT",
      source_ref: assumption ? `fixture:${meta.scenario_id}:synthetic-assumption` : `fixture:${meta.scenario_id}:input`,
      assumptions: assumption ? [field] : [],
      user_confirmed: confirmed && !assumption,
    });
  }
  for (const [name, item] of Object.entries({ objective, funnel, channels, readiness: ready })) {
    entries.push({
      path: `decisions.${name}`,
      source: "rule",
      authority: name === "readiness" ? "READINESS_POLICY" : "DECISION_POLICY",
      source_ref: item.rule_id,
      assumptions: [],
      user_confirmed: false,
    });
  }
  return entries;
}

for (const name of fs.readdirSync(root).filter((file) => /^EX-.*\.json$/.test(file)).sort()) {
  const file = path.join(root, name);
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const input = payload.input;
  const meta = payload._fixture;
  const objective = decision(input.primary_objective || "awareness", "CDKS-OBJ-CANONICAL", ["primary_objective"]);
  const channelsValue = input.ad_channels.filter((channel) => allowedChannels.has(channel));
  const channels = decision(channelsValue, "CDKS-CHANNEL-CANONICAL", ["ad_channels"], channelsValue.length ? [] : ["no_canonical_channel_selection"]);
  const funnel = resolveFunnel(input);
  const readinessBefore = readiness(input);
  const confirmedInput = { ...input, final_confirmed_inputs: true };
  const readinessAfter = readiness(confirmedInput);
  const expectedWarnings = warnings(input, meta, funnel, readinessBefore);
  payload.expected_v3 = {
    contract_version: "3.0",
    generation_mode: "blueprint_only",
    locale: meta.output_language,
    currency: meta.currency,
    decisions: { objective, funnel, channels },
    expected_outcomes: {
      objective: objective.value,
      funnel: funnel.value,
      readiness_before_confirmation: readinessBefore.value,
      readiness_after_confirmation: readinessAfter.value,
    },
    readiness: readinessBefore,
    warnings: expectedWarnings,
    strategy: {
      status: "not_requested",
      authority: "AI_STRATEGY_BUILDER",
      proposed_changes: [],
      accepted_changes: [],
      rejected_changes: [],
      limitations: ["AI Strategy Builder is not enabled in Phase 1."],
    },
    reasoning: {
      status: "not_requested",
      authority: "AI_REASONING",
      supported_claims: [],
      unsupported_claims: [],
      limitations: ["AI Reasoning is not enabled in Phase 1."],
    },
    provenance: provenance(input, meta, objective, funnel, channels, readinessBefore),
    validation: {
      schema_valid: true,
      canonical_field_count: Object.keys(input).length,
      canonical_field_errors: [],
      external_actions_allowed: false,
      budget_spend_allowed: false,
    },
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}
console.log(`Attached v3 expected outcomes to 10 fixtures under ${root}`);

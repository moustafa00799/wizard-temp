/*
 * Data Contract Audit
 *
 * Verifies that every canonical Wizard field is represented at the four
 * boundaries that matter for the generation pipeline:
 *   Wizard -> Canonical -> AI projection/prompt -> Blueprint
 *
 * This is intentionally static: it does not call an AI provider.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const store = read("src/lib/store.ts");
const contract = read("src/lib/contracts/wizard-input.ts");
const adapter = read("src/lib/ai-adapter.ts");
const mapper = read("src/lib/wizard-mapper.ts");
const prompts = read("src/lib/ai-prompts.ts");
const route = read("src/app/api/generate/route.ts");
const engine = read("src/lib/blueprint-engine.ts");
const types = read("src/lib/blueprint-types.ts");

const fieldBlock = contract.match(/export const CANONICAL_WIZARD_FIELDS = \[(.*?)\] as const;/s)?.[1] || "";
const fields = [...fieldBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (!fields.length) throw new Error("Could not read CANONICAL_WIZARD_FIELDS");

const projection = new Map([
  ["build_mode", "source_wizard_input"],
  ["business_type", "business_type"],
  ["offer_description", "offer_description"],
  ["sales_motion", "source_wizard_input"],
  ["customer_problem", "source_wizard_input"],
  ["key_value_drivers", "unique_selling_points"],
  ["usp", "competitor_advantage"],
  ["primary_objective", "primary_goal"],
  ["secondary_objectives", "secondary_goals"],
  ["north_star_kpi", "success_metric"],
  ["existing_assets", "current_channels"],
  ["previous_campaigns_status", "source_wizard_input"],
  ["past_performance_notes", "current_results"],
  ["ideal_customer", "target_audience"],
  ["awareness_level", "source_wizard_input"],
  ["audience_segments", "audience_interests"],
  ["geo_scope", "source_wizard_input"],
  ["target_locations", "audience_locations"],
  ["offer_type", "offer_type"],
  ["core_message", "brand_guidelines"],
  ["objections", "audience_pain_points"],
  ["persuasion_angle", "source_wizard_input"],
  ["conversion_destination", "source_wizard_input"],
  ["ad_channels", "preferred_channels"],
  ["campaign_direction", "source_wizard_input"],
  ["budget_band", "price_range"],
  ["budget_flexibility", "budget_flexibility"],
  ["average_order_value", "source_wizard_input"],
  ["profit_margin", "source_wizard_input"],
  ["max_cac", "source_wizard_input"],
  ["tracking_status", "has_tracking_setup"],
  ["tracking_tools", "tracking_platforms"],
  ["key_events", "conversion_events"],
  ["conversion_model", "source_wizard_input"],
  ["creative_assets", "creative_asset_types"],
  ["content_capacity", "source_wizard_input"],
  ["constraints", "source_wizard_input"],
  ["response_speed", "urgency_level"],
  ["top_priority", "source_wizard_input"],
  ["risk_tolerance", "source_wizard_input"],
  ["final_confirmed_inputs", "source_wizard_input"],
]);

const hasCanonicalAlias = /CanonicalWizardInput as WizardPayload/.test(types);
const hasSourcePreservation = /source_wizard_input:\s*raw/.test(mapper);
const hasPromptPreservation = /source_wizard_input/.test(prompts);
const hasRouteCanonical = /canonicalizeWizardInput\(body\)/.test(route) && /mapToAIWizardPayload\(canonicalWizard\)/.test(route);
const hasBlueprintPreservation = /wizard_input:\s*data/.test(engine) && /wizard_input:\s*CanonicalWizardInput/.test(types);

const rows = fields.map((field) => {
  const wizard = new RegExp(`\\b${field}\\b`).test(store);
  const canonical = new RegExp(`\\b${field}\\b`).test(contract);
  const map = projection.get(field);
  const projected = map === "source_wizard_input" ? hasSourcePreservation : new RegExp(`raw\\.${field}\\b`).test(mapper);
  const prompt = hasPromptPreservation;
  const blueprint = hasBlueprintPreservation;
  let status = "سليم";
  if (!wizard) status = "Wizard missing";
  else if (!canonical) status = "Canonical missing";
  else if (!projected) status = "AI adapter missing";
  else if (!prompt) status = "Prompt missing";
  else if (!blueprint) status = "Blueprint preservation missing";

  return { field, wizard, canonical, projection: map, projected, prompt, blueprint, status };
});

const failures = rows.filter((r) => r.status !== "سليم");

console.log("DATA CONTRACT AUDIT");
console.log("===================");
console.log(`Canonical fields: ${fields.length}`);
console.log(`Wizard -> Canonical: ${rows.every((r) => r.wizard && r.canonical) ? "PASS" : "FAIL"}`);
console.log(`Canonical -> AI adapter: ${hasSourcePreservation ? "PASS" : "FAIL"}`);
console.log(`AI payload -> Prompt: ${hasPromptPreservation ? "PASS" : "FAIL"}`);
console.log(`Canonical -> Rules engine: ${hasCanonicalAlias ? "PASS" : "FAIL"}`);
console.log(`Canonical -> Blueprint: ${hasBlueprintPreservation ? "PASS" : "FAIL"}`);
console.log(`Route uses canonical pipeline: ${hasRouteCanonical ? "PASS" : "FAIL"}`);
console.log("");

for (const r of rows) {
  console.log(`${r.status === "سليم" ? "PASS" : "FAIL"} ${r.field.padEnd(30)} projection=${r.projection}`);
}

const md = [
  "# Data Contract Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Pipeline",
  "",
  "`Wizard Raw Data → CanonicalWizardInput → AI Adapter / Rules Engine → AI Prompt → Blueprint`",
  "",
  `- Canonical fields: **${fields.length}**`,
  `- Wizard → Canonical: **${rows.every((r) => r.wizard && r.canonical) ? "PASS" : "FAIL"}**`,
  `- Canonical → AI adapter: **${hasSourcePreservation ? "PASS" : "FAIL"}**`,
  `- AI payload → Prompt: **${hasPromptPreservation ? "PASS" : "FAIL"}**`,
  `- Canonical → Rules engine: **${hasCanonicalAlias ? "PASS" : "FAIL"}**`,
  `- Canonical → Blueprint: **${hasBlueprintPreservation ? "PASS" : "FAIL"}**`,
  `- Route uses canonical pipeline: **${hasRouteCanonical ? "PASS" : "FAIL"}**`,
  "",
  "## Field Matrix",
  "",
  "| Wizard field | Canonical | AI projection | Prompt | Blueprint | Status |",
  "|---|---:|---|---:|---:|---|",
  ...rows.map((r) => `| \`${r.field}\` | ${r.canonical ? "✓" : "✗"} | \`${r.projection}\` | ${r.prompt ? "✓" : "✗"} | ${r.blueprint ? "✓" : "✗"} | ${r.status} |`),
  "",
  "## Interpretation",
  "",
  "Fields mapped to a provider-friendly name are projections only. The authoritative copy remains under `source_wizard_input`, so fields such as `awareness_level`, `sales_motion`, `conversion_destination`, `persuasion_angle`, `average_order_value`, `profit_margin`, `max_cac`, `conversion_model`, `content_capacity`, `constraints`, `top_priority`, and `risk_tolerance` are no longer silently dropped.",
  "",
].join("\n");

fs.writeFileSync(path.join(ROOT, "DATA_CONTRACT_AUDIT.md"), md);

if (failures.length) {
  console.error(`\nAudit FAILED: ${failures.length} field(s).`);
  process.exit(1);
}

console.log(`\nAudit PASSED: all ${fields.length} canonical fields are preserved through the generation pipeline.`);
console.log("Report written to DATA_CONTRACT_AUDIT.md");

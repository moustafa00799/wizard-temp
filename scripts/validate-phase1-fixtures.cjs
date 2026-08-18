const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "tests", "fixtures", "wizard-inputs-v1");
const required = new Set([
  "build_mode", "business_type", "offer_description", "sales_motion", "customer_problem",
  "key_value_drivers", "usp", "primary_objective", "secondary_objectives", "north_star_kpi",
  "existing_assets", "previous_campaigns_status", "past_performance_notes", "ideal_customer",
  "awareness_level", "audience_segments", "geo_scope", "target_locations", "offer_type",
  "core_message", "objections", "persuasion_angle", "conversion_destination", "ad_channels",
  "campaign_direction", "budget_band", "budget_flexibility", "average_order_value",
  "profit_margin", "max_cac", "tracking_status", "tracking_tools", "key_events",
  "conversion_model", "creative_assets", "content_capacity", "constraints", "response_speed",
  "top_priority", "risk_tolerance", "final_confirmed_inputs",
]);
const approved = new Set(["local_service", "ecommerce", "app", "b2b"]);
const files = fs.readdirSync(root).filter((name) => /^EX-.*\.json$/.test(name)).sort();
if (files.length !== 10) throw new Error(`Expected 10 fixtures, found ${files.length}`);
let primary = 0;
let extended = 0;
for (const name of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
  if (!payload._fixture || !payload.input) throw new Error(`${name}: expected _fixture and input`);
  const missing = [...required].filter((key) => !(key in payload.input));
  if (missing.length) throw new Error(`${name}: missing ${missing.join(", ")}`);
  if (payload.input.final_confirmed_inputs !== false) {
    throw new Error(`${name}: synthetic assumptions must not be marked user-confirmed`);
  }
  if (!String(payload._fixture.assumption_policy).startsWith("Synthetic test assumptions")) {
    throw new Error(`${name}: missing synthetic-assumption policy`);
  }
  if (!["EGP", "SAR", "USD"].includes(payload._fixture.currency)) {
    throw new Error(`${name}: unsupported currency`);
  }
  if (!["ar", "en"].includes(payload._fixture.output_language)) {
    throw new Error(`${name}: unsupported output language`);
  }
  if (approved.has(payload.input.business_type)) {
    if (payload._fixture.scope !== "primary") throw new Error(`${name}: approved branch must be primary`);
    primary += 1;
  } else {
    if (payload._fixture.scope !== "extended") throw new Error(`${name}: non-approved branch must be extended`);
    extended += 1;
  }
}
console.log(`phase1-fixtures=valid total=${files.length} primary=${primary} extended=${extended} fields=${required.size}`);

import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint } from "@/lib/blueprint-engine";
import type { WizardPayload } from "@/lib/blueprint-types";

// Required fields the engine needs to produce a useful blueprint
const REQUIRED_FIELDS: (keyof WizardPayload)[] = [
  "business_type",
  "offer_description",
  "primary_objective",
  "awareness_level",
  "core_message",
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // ── 1. Validate required fields ──────────────────────────────────────────
    const errors: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      const val = body[field];
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        errors.push(`حقل "${field}" مطلوب`);
      }
    }
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // ── 2. Normalise all 40+ fields with safe fallbacks ───────────────────────
    const payload: WizardPayload = {
      // Identity
      build_mode:                body.build_mode               ?? "new_campaign",
      business_type:             (body.business_type as string).trim(),
      offer_description:         (body.offer_description as string).trim(),
      sales_motion:              body.sales_motion              ?? "multi_channel",

      // Value proposition
      customer_problem:          body.customer_problem?.trim() ?? "",
      key_value_drivers:         Array.isArray(body.key_value_drivers)   ? body.key_value_drivers   : [],
      usp:                       body.usp?.trim()               ?? "",

      // Objectives
      primary_objective:         (body.primary_objective as string).trim(),
      secondary_objectives:      Array.isArray(body.secondary_objectives) ? body.secondary_objectives : [],
      north_star_kpi:            body.north_star_kpi            ?? "sales_count",

      // Assets & history
      existing_assets:           Array.isArray(body.existing_assets)     ? body.existing_assets     : [],
      previous_campaigns_status: body.previous_campaigns_status ?? "none",
      past_performance_notes:    body.past_performance_notes?.trim()  ?? "",

      // Audience
      ideal_customer:            body.ideal_customer?.trim()    ?? "",
      awareness_level:           (body.awareness_level as string).trim(),
      audience_segments:         Array.isArray(body.audience_segments)   ? body.audience_segments   : [],
      geo_scope:                 body.geo_scope                 ?? "country",
      target_locations:          Array.isArray(body.target_locations)    ? body.target_locations    : [],

      // Offer & messaging
      offer_type:                body.offer_type                ?? "no_clear_offer",
      core_message:              (body.core_message as string).trim(),
      objections:                Array.isArray(body.objections)          ? body.objections          : [],
      persuasion_angle:          body.persuasion_angle          ?? "value",

      // Channels
      conversion_destination:    body.conversion_destination    ?? "website",
      ad_channels:               Array.isArray(body.ad_channels)         ? body.ad_channels         : [],
      campaign_direction:        body.campaign_direction        ?? "unknown",

      // Budget
      budget_band:               body.budget_band               ?? "unknown",
      budget_flexibility:        body.budget_flexibility        ?? "flexible",
      average_order_value:       typeof body.average_order_value === "number" ? body.average_order_value : 0,
      profit_margin:             typeof body.profit_margin      === "number" ? body.profit_margin      : 0,
      max_cac:                   typeof body.max_cac            === "number" ? body.max_cac            : 0,

      // Tracking
      tracking_status:           body.tracking_status           ?? "unknown",
      tracking_tools:            Array.isArray(body.tracking_tools)      ? body.tracking_tools      : [],
      key_events:                Array.isArray(body.key_events)          ? body.key_events          : [],
      conversion_model:          body.conversion_model          ?? "unknown",

      // Resources
      creative_assets:           Array.isArray(body.creative_assets)     ? body.creative_assets     : [],
      content_capacity:          body.content_capacity          ?? "slow",
      constraints:               Array.isArray(body.constraints)         ? body.constraints         : [],
      response_speed:            body.response_speed            ?? "unknown",

      // Priority
      top_priority:              body.top_priority              ?? "increase_demand",
      risk_tolerance:            body.risk_tolerance            ?? "medium",
    };

    // ── 3. Run the rules engine ───────────────────────────────────────────────
    const blueprint = generateBlueprint(payload);

    console.log(
      `[Generate API] Blueprint generated in ${Date.now() - startTime}ms — ` +
      `rules: ${blueprint.debug.rules_executed}, readiness: ${blueprint.executive_summary.readiness_score}`
    );

    return NextResponse.json({ success: true, blueprint });

  } catch (error) {
    console.error("[Generate API] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate blueprint",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

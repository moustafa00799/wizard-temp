/**
 * Strict JSON Schemas for the v4 Two-AI contracts.
 *
 * These schemas are provider-neutral. The Groq adapter consumes them through
 * OpenAI-compatible response_format=json_schema with strict=true.
 */

export const STRATEGY_DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "strategy_version",
    "recommended_objective",
    "strategic_thesis",
    "target_customer",
    "funnel_strategy",
    "channel_strategy",
    "offer_and_message",
    "measurement_strategy",
    "strategic_assumptions",
    "risks",
    "confidence",
    "reasoning",
  ],
  properties: {
    strategy_version: { type: "string", enum: ["strategy-v1"] },
    recommended_objective: { type: "string" },
    strategic_thesis: { type: "string" },
    target_customer: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "segments", "awareness_level", "geographic_scope"],
      properties: {
        primary: { type: "string" },
        segments: { type: "array", items: { type: "string" } },
        awareness_level: { type: "string" },
        geographic_scope: { type: "string" },
      },
    },
    funnel_strategy: {
      type: "object",
      additionalProperties: false,
      required: ["model", "stages", "conversion_path"],
      properties: {
        model: { type: "string" },
        stages: { type: "array", items: { type: "string" } },
        conversion_path: { type: "string" },
      },
    },
    channel_strategy: {
      type: "object",
      additionalProperties: false,
      required: ["primary_channels", "supporting_channels", "rationale"],
      properties: {
        primary_channels: { type: "array", items: { type: "string" } },
        supporting_channels: { type: "array", items: { type: "string" } },
        rationale: { type: "string" },
      },
    },
    offer_and_message: {
      type: "object",
      additionalProperties: false,
      required: ["core_message", "persuasion_angle", "offer_role"],
      properties: {
        core_message: { type: "string" },
        persuasion_angle: { type: "string" },
        offer_role: { type: "string" },
      },
    },
    measurement_strategy: {
      type: "object",
      additionalProperties: false,
      required: ["north_star_kpi", "supporting_metrics", "success_definition"],
      properties: {
        north_star_kpi: { type: "string" },
        supporting_metrics: { type: "array", items: { type: "string" } },
        success_definition: { type: "string" },
      },
    },
    strategic_assumptions: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning: { type: "string" },
  },
} as const;

export const EXECUTION_DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "execution_version",
    "campaign_structure",
    "audience_structure",
    "budget_plan",
    "creative_execution",
    "tracking_execution",
    "launch_sequence",
    "execution_assumptions",
    "risks",
    "confidence",
    "reasoning",
  ],
  properties: {
    execution_version: { type: "string", enum: ["execution-v1"] },
    campaign_structure: {
      type: "object",
      additionalProperties: false,
      required: ["campaigns", "rationale"],
      properties: {
        campaigns: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "objective", "channel", "role"],
            properties: {
              name: { type: "string" },
              objective: { type: "string" },
              channel: { type: "string" },
              role: { type: "string" },
            },
          },
        },
        rationale: { type: "string" },
      },
    },
    audience_structure: {
      type: "object",
      additionalProperties: false,
      required: ["primary_segments", "exclusions", "retargeting", "rationale"],
      properties: {
        primary_segments: { type: "array", items: { type: "string" } },
        exclusions: { type: "array", items: { type: "string" } },
        retargeting: { type: "array", items: { type: "string" } },
        rationale: { type: "string" },
      },
    },
    budget_plan: {
      type: "object",
      additionalProperties: false,
      required: ["daily_budget", "allocation", "scaling_rule"],
      properties: {
        daily_budget: { type: "number", minimum: 0 },
        allocation: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["destination", "percentage"],
            properties: {
              destination: { type: "string" },
              percentage: { type: "number", minimum: 0, maximum: 100 },
            },
          },
        },
        scaling_rule: { type: "string" },
      },
    },
    creative_execution: {
      type: "object",
      additionalProperties: false,
      required: ["formats", "angles", "asset_requirements"],
      properties: {
        formats: { type: "array", items: { type: "string" } },
        angles: { type: "array", items: { type: "string" } },
        asset_requirements: { type: "array", items: { type: "string" } },
      },
    },
    tracking_execution: {
      type: "object",
      additionalProperties: false,
      required: ["required_events", "validation_steps"],
      properties: {
        required_events: { type: "array", items: { type: "string" } },
        validation_steps: { type: "array", items: { type: "string" } },
      },
    },
    launch_sequence: { type: "array", items: { type: "string" } },
    execution_assumptions: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning: { type: "string" },
  },
} as const;

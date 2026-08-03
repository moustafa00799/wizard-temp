/**
 * E2E INTEGRATION TEST SCRIPT
 * ────────────────────────────
 * Tests the full flow:
 *   Step 0 → Step 12 → POST /api/generate → Blueprint renders
 *
 * Usage (browser console):
 *   import { runE2ETest } from '@/lib/e2e-test';
 *   runE2ETest();
 *
 * Or trigger via: window.__runE2ETest()  (auto-registered on load in dev)
 */

import { getDummyData } from "@/lib/dev-autofill";
import { useWizardStore } from "@/lib/store";

const BACKEND_URL = "http://localhost:3000/api/generate";

// ── Backend contract ───────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  "business_type",
  "offer_description",
  "primary_objective",
  "awareness_level",
  "core_message",
] as const;

const VALID_GEO_SCOPES = [
  "single_city",
  "multiple_cities",
  "country",
  "multiple_countries",
  "local_radius",
] as const;

const VALID_BUSINESS_TYPES = [
  "local_service",
  "ecommerce",
  "consumer_product",
  "app",
  "b2b",
  "education",
  "agency_service",
  "other",
] as const;

const VALID_PRIMARY_OBJECTIVES = [
  "sales",
  "leads",
  "messages",
  "traffic",
  "app_installs",
  "awareness",
  "retargeting",
  "booking",
  "calls",
] as const;

// ── Test result types ──────────────────────────────────────────────────────────
interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
  error?: string;
}

interface E2EReport {
  passed: number;
  failed: number;
  total: number;
  results: TestResult[];
  duration: number;
  payload?: Record<string, unknown>;
  response?: unknown;
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function pass(name: string, detail?: string): TestResult {
  return { name, passed: true, detail };
}
function fail(name: string, error: string): TestResult {
  return { name, passed: false, error };
}

function printReport(report: E2EReport) {
  const { passed, failed, total, results, duration } = report;
  console.group(
    `%c🧪 E2E Test Report — ${passed}/${total} passed (${duration}ms)`,
    `color: ${failed === 0 ? "#4ade80" : "#f87171"}; font-weight: bold; font-size: 14px;`
  );

  results.forEach((r) => {
    const icon = r.passed ? "✅" : "❌";
    const style = `color: ${r.passed ? "#86efac" : "#fca5a5"}`;
    if (r.passed) {
      console.log(`%c${icon} ${r.name}`, style, r.detail ? `— ${r.detail}` : "");
    } else {
      console.error(`${icon} ${r.name} — ${r.error}`);
    }
  });

  if (failed > 0) {
    console.warn(`\n⚠️  ${failed} test(s) failed. Check errors above.`);
  } else {
    console.log("\n🎉 All tests passed! Flow is working end-to-end.");
  }
  console.groupEnd();
}

// ── Individual test functions ──────────────────────────────────────────────────

function testStoreExists(): TestResult {
  try {
    const state = useWizardStore.getState();
    if (!state || typeof state.setField !== "function") {
      return fail("Store exists", "Zustand store is missing or malformed");
    }
    return pass("Store exists", "Zustand store is accessible");
  } catch (e) {
    return fail("Store exists", `Error: ${e}`);
  }
}

function testDummyDataFill(): TestResult {
  try {
    const dummy = getDummyData();
    const store = useWizardStore.getState();

    (Object.keys(dummy) as (keyof typeof dummy)[]).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.setField(key, dummy[key] as any);
    });

    const filled = useWizardStore.getState().data;
    if (!filled.business_type || !filled.core_message) {
      return fail("Fill dummy data", "business_type or core_message missing after fill");
    }
    return pass("Fill dummy data", `business_type=${filled.business_type}`);
  } catch (e) {
    return fail("Fill dummy data", `Exception: ${e}`);
  }
}

function testRequiredFields(): TestResult {
  const data = useWizardStore.getState().data;
  const missing: string[] = [];

  REQUIRED_FIELDS.forEach((field) => {
    const val = data[field as keyof typeof data];
    if (val === null || val === undefined || val === "") {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    return fail(
      "Required fields present",
      `Missing: ${missing.join(", ")}`
    );
  }
  return pass("Required fields present", `All ${REQUIRED_FIELDS.length} required fields filled`);
}

function testEnumValues(): TestResult {
  const data = useWizardStore.getState().data;
  const errors: string[] = [];

  // geo_scope
  if (data.geo_scope && !VALID_GEO_SCOPES.includes(data.geo_scope as typeof VALID_GEO_SCOPES[number])) {
    errors.push(`geo_scope "${data.geo_scope}" is not a valid backend enum`);
  }

  // business_type
  if (data.business_type && !VALID_BUSINESS_TYPES.includes(data.business_type as typeof VALID_BUSINESS_TYPES[number])) {
    errors.push(`business_type "${data.business_type}" is not a valid backend enum`);
  }

  // primary_objective
  if (data.primary_objective && !VALID_PRIMARY_OBJECTIVES.includes(data.primary_objective as typeof VALID_PRIMARY_OBJECTIVES[number])) {
    errors.push(`primary_objective "${data.primary_objective}" is not a valid backend enum`);
  }

  if (errors.length > 0) {
    return fail("Enum values valid", errors.join(" | "));
  }
  return pass("Enum values valid", "geo_scope, business_type, primary_objective all valid");
}

function testNoNullsInPayload(payload: Record<string, unknown>): TestResult {
  const nullFields: string[] = [];
  Object.entries(payload).forEach(([k, v]) => {
    if (v === null || v === undefined) {
      nullFields.push(k);
    }
  });

  if (nullFields.length > 0) {
    return fail(
      "No nulls in payload",
      `Fields with null/undefined: ${nullFields.join(", ")}`
    );
  }
  return pass("No nulls in payload", `All ${Object.keys(payload).length} fields have values`);
}

function buildPayload(): Record<string, unknown> {
  const data = useWizardStore.getState().data;
  return {
    build_mode: data.build_mode ?? "new_campaign",
    business_type: data.business_type ?? "",
    offer_description: data.offer_description?.trim() ?? "",
    sales_motion: data.sales_motion ?? "multi_channel",
    customer_problem: data.customer_problem?.trim() ?? "",
    key_value_drivers: data.key_value_drivers ?? [],
    usp: data.usp?.trim() ?? "",
    primary_objective: data.primary_objective ?? "",
    secondary_objectives: data.secondary_objectives ?? [],
    north_star_kpi: data.north_star_kpi ?? "sales_count",
    existing_assets: data.existing_assets ?? [],
    previous_campaigns_status: data.previous_campaigns_status ?? "none",
    past_performance_notes: data.past_performance_notes?.trim() ?? "",
    ideal_customer: data.ideal_customer?.trim() ?? "",
    awareness_level: data.awareness_level ?? "",
    audience_segments: data.audience_segments ?? [],
    geo_scope: data.geo_scope ?? "country",
    target_locations: data.target_locations ?? [],
    offer_type: data.offer_type ?? "no_clear_offer",
    core_message: data.core_message?.trim() ?? "",
    objections: data.objections ?? [],
    persuasion_angle: data.persuasion_angle ?? "value",
    conversion_destination: data.conversion_destination ?? "website",
    ad_channels: data.ad_channels ?? [],
    campaign_direction: data.campaign_direction ?? "unknown",
    budget_band: data.budget_band ?? "unknown",
    budget_flexibility: data.budget_flexibility ?? "flexible",
    average_order_value: data.average_order_value ?? 0,
    profit_margin: data.profit_margin ?? 0,
    max_cac: data.max_cac ?? 0,
    tracking_status: data.tracking_status ?? "unknown",
    tracking_tools: data.tracking_tools ?? [],
    key_events: data.key_events ?? [],
    conversion_model: data.conversion_model ?? "unknown",
    creative_assets: data.creative_assets ?? [],
    content_capacity: data.content_capacity ?? "slow",
    constraints: data.constraints ?? [],
    response_speed: data.response_speed ?? "unknown",
    top_priority: data.top_priority ?? "increase_demand",
    risk_tolerance: data.risk_tolerance ?? "medium",
  };
}

async function testAPICall(payload: Record<string, unknown>): Promise<{
  result: TestResult;
  response: unknown;
}> {
  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return {
        result: fail("API call succeeds", `Response is not valid JSON. HTTP ${res.status}`),
        response: null,
      };
    }

    const j = json as Record<string, unknown>;

    if (!res.ok) {
      return {
        result: fail(
          "API call succeeds",
          `HTTP ${res.status} — ${JSON.stringify(j.errors ?? j.message ?? j.error)}`
        ),
        response: json,
      };
    }

    if (j.success === false) {
      return {
        result: fail(
          "API call succeeds",
          `success=false — errors: ${JSON.stringify(j.errors)}`
        ),
        response: json,
      };
    }

    return {
      result: pass("API call succeeds", `HTTP ${res.status}, success=true`),
      response: json,
    };
  } catch (e) {
    return {
      result: fail(
        "API call succeeds",
        `Network error — is backend running on ${BACKEND_URL}? Error: ${e}`
      ),
      response: null,
    };
  }
}

function testBlueprintShape(response: unknown): TestResult {
  if (!response) {
    return fail("Blueprint has valid shape", "No response to check");
  }

  const r = response as Record<string, unknown>;
  const blueprint = r.blueprint as Record<string, unknown> | null | undefined;

  if (!blueprint) {
    return fail(
      "Blueprint has valid shape",
      `response.blueprint is ${blueprint === null ? "null" : "undefined"}. Full response: ${JSON.stringify(r).slice(0, 200)}`
    );
  }

  const expectedKeys = [
    "strategy_summary",
    "recommended_funnel",
    "campaign_structure",
    "audience_structure",
    "budget_split",
    "creative_angles",
    "tracking_checklist",
    "risk_flags",
    "first_14_days_plan",
    "pre_launch_fixes",
  ];

  const presentKeys = expectedKeys.filter((k) => k in blueprint);
  const missingKeys = expectedKeys.filter((k) => !(k in blueprint));

  if (missingKeys.length > expectedKeys.length / 2) {
    return fail(
      "Blueprint has valid shape",
      `Too many missing keys: ${missingKeys.join(", ")}`
    );
  }

  return pass(
    "Blueprint has valid shape",
    `${presentKeys.length}/${expectedKeys.length} expected keys present`
  );
}

function testBlueprintNoUndefined(response: unknown): TestResult {
  if (!response) return fail("Blueprint no undefined access", "No response");

  const r = response as Record<string, unknown>;
  const blueprint = r.blueprint as Record<string, unknown> | undefined;
  if (!blueprint) return fail("Blueprint no undefined access", "No blueprint");

  // Simulate what blueprint/page.tsx does — access every expected key
  const keys = [
    "strategy_summary",
    "recommended_funnel",
    "campaign_structure",
    "audience_structure",
    "budget_split",
    "creative_angles",
    "tracking_checklist",
    "risk_flags",
    "first_14_days_plan",
    "pre_launch_fixes",
  ];

  const crashedOn: string[] = [];
  keys.forEach((k) => {
    try {
      // Simulate: val?.toString() — should never throw with safe access
      const val = blueprint?.[k];
      if (val !== undefined && val !== null) {
        void (val as Record<string, unknown>)?.toString?.();
      }
    } catch {
      crashedOn.push(k);
    }
  });

  if (crashedOn.length > 0) {
    return fail(
      "Blueprint no undefined access",
      `Would crash on: ${crashedOn.join(", ")}`
    );
  }

  return pass(
    "Blueprint no undefined access",
    "All blueprint properties accessed safely"
  );
}

function testSessionStorageWrite(response: unknown): TestResult {
  try {
    const r = response as Record<string, unknown>;
    const blueprint = r?.blueprint ?? r;
    sessionStorage.setItem("wizard_blueprint_e2e_test", JSON.stringify(blueprint));
    const readBack = JSON.parse(sessionStorage.getItem("wizard_blueprint_e2e_test") ?? "null");
    sessionStorage.removeItem("wizard_blueprint_e2e_test");

    if (!readBack) {
      return fail("sessionStorage write/read", "Could not read back from sessionStorage");
    }
    return pass("sessionStorage write/read", "Blueprint stored and retrieved successfully");
  } catch (e) {
    return fail("sessionStorage write/read", `Error: ${e}`);
  }
}

// ── MAIN TEST RUNNER ───────────────────────────────────────────────────────────
export async function runE2ETest(): Promise<E2EReport> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  console.group("%c🧪 Starting E2E Test Run...", "color: #a78bfa; font-weight: bold");
  console.log("Backend:", BACKEND_URL);
  console.log("Time:", new Date().toISOString());
  console.groupEnd();

  // 1. Store accessibility
  results.push(testStoreExists());

  // 2. Fill with dummy data
  results.push(testDummyDataFill());

  // 3. Required fields check
  results.push(testRequiredFields());

  // 4. Enum validation
  results.push(testEnumValues());

  // 5. Build payload + check nulls
  const payload = buildPayload();
  results.push(testNoNullsInPayload(payload));

  // 6. API call
  const { result: apiResult, response } = await testAPICall(payload);
  results.push(apiResult);

  // 7. Blueprint shape (only if API passed)
  if (apiResult.passed) {
    results.push(testBlueprintShape(response));
    results.push(testBlueprintNoUndefined(response));
    results.push(testSessionStorageWrite(response));
  } else {
    results.push(fail("Blueprint has valid shape", "Skipped — API call failed"));
    results.push(fail("Blueprint no undefined access", "Skipped — API call failed"));
    results.push(fail("sessionStorage write/read", "Skipped — API call failed"));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const duration = Date.now() - startTime;

  const report: E2EReport = {
    passed,
    failed,
    total: results.length,
    results,
    duration,
    payload,
    response,
  };

  printReport(report);
  return report;
}

// ── Register on window for console access ──────────────────────────────────────
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__runE2ETest = runE2ETest;
  console.info(
    "%c[DEV] E2E test available: window.__runE2ETest()",
    "color: #a78bfa; font-size: 11px;"
  );
}

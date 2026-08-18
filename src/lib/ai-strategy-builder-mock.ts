import type { BlueprintStrategyTrace } from "./contracts/blueprint-contract-v3";

export type MockStrategyScenario = "baseline" | "override_attempt" | "malformed" | "failure";

export type MockStrategyProviderResult = {
  success: boolean;
  data: unknown;
  error: string | null;
  model: string;
  latencyMs: number;
};

const MOCK_MODEL = "mock-strategy-builder-v1";

export function runMockStrategyBuilder(
  scenario: MockStrategyScenario = "baseline",
  locale: "ar" | "en" = "ar",
): MockStrategyProviderResult {
  const startedAt = Date.now();

  if (scenario === "failure") {
    return {
      success: false,
      data: null,
      error: "Controlled mock provider failure for fallback testing.",
      model: MOCK_MODEL,
      latencyMs: Date.now() - startedAt,
    };
  }

  if (scenario === "malformed") {
    return {
      success: true,
      data: { strategic_summary: "Incomplete controlled response" },
      error: null,
      model: MOCK_MODEL,
      latencyMs: Date.now() - startedAt,
    };
  }

  const isEnglish = locale === "en";
  const baseline = isEnglish
    ? {
        strategic_summary: "Start with trust-led testing before scaling spend.",
        message_angles: ["Proof of value", "Reduced decision risk", "Clear next step"],
        audience_hypotheses: ["High-intent visitors", "Recent engaged users"],
        experiment_ideas: ["Test proof-led messaging against offer-led messaging"],
        proposed_changes: ["Add two message variants to the first testing cycle"],
        rejected_changes: [],
        limitations: ["This is a controlled mock response, not a production model result."],
      }
    : {
        strategic_summary: "ابدأ باختبارات تركز على الثقة قبل التوسع في الإنفاق.",
        message_angles: ["إثبات القيمة", "تقليل مخاطر القرار", "خطوة تالية واضحة"],
        audience_hypotheses: ["زوار مرتفعو النية", "مستخدمون تفاعلوا حديثًا"],
        experiment_ideas: ["اختبار الرسائل المبنية على الإثبات مقابل الرسائل المبنية على العرض"],
        proposed_changes: ["إضافة نسختين من الرسائل إلى دورة الاختبار الأولى"],
        rejected_changes: [],
        limitations: ["هذه استجابة Mock محكومة وليست نتيجة نموذج إنتاجي."],
      };

  if (scenario === "override_attempt") {
    baseline.proposed_changes.push(
      isEnglish ? "Change the objective to sales" : "غيّر الهدف إلى المبيعات",
      isEnglish ? "Increase the budget and publish the campaign" : "ارفع الميزانية وانشر الحملة",
    );
  }

  return {
    success: true,
    data: baseline,
    error: null,
    model: MOCK_MODEL,
    latencyMs: Date.now() - startedAt,
  };
}

export function mockFailureTrace(
  error: string,
  model = MOCK_MODEL,
): BlueprintStrategyTrace {
  return {
    status: "failed",
    authority: "AI_STRATEGY_BUILDER",
    model,
    proposed_changes: [],
    accepted_changes: [],
    rejected_changes: [],
    limitations: [error, "The deterministic CDKS output remains authoritative."],
  };
}

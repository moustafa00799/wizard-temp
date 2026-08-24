/**
 * Campaign Engine Builder — Step 12: Review & Generate
 * Updated to use CDKS v5 API
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GenerationStatus =
  | "idle"
  | "generating_ai"
  | "validating"
  | "backfilling"
  | "adapting"
  | "success"
  | "error";

interface Step12ReviewProps {
  wizardData?: any;
  onBack?: () => void;
  onGoToStep?: (step: number) => void;
}

// ✅ تحديث نوع النتيجة ليتوافق مع استجابة v5
interface GenerationResult {
  status: "success" | "error";
  data?: any; // CanonicalBlueprint
  version?: string;
  processingTimeMs?: number;
  timestamp?: string;
  error?: string;
  message?: string;
  details?: any;
}

function extractWizardData(value: any): any | null {
  if (!value || typeof value !== "object") return null;

  const candidates = [
    value?.state?.data,
    value?.data,
    value?.wizardData,
    value?.formData,
    value,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      Object.keys(candidate).length > 0
    ) {
      return candidate;
    }
  }

  return null;
}

function getValue(data: any, ...keys: string[]): any {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "غير محدد";
}

function displayValue(value: any, fallback = "غير محدد"): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item, "")).filter(Boolean).join("، ") || fallback;
  }
  if (typeof value === "object") {
    if ("value" in value) return displayValue(value.value, fallback);
    if (value.name) return String(value.name);
    if (value.label) return String(value.label);
    if (value.description) return String(value.description);
  }
  return fallback;
}

export default function Step12_Review({ wizardData: passedWizardData, onBack }: Step12ReviewProps) {
  const router = useRouter();
  const [wizardData, setWizardData] = useState<any | null>(
    extractWizardData(passedWizardData)
  );
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultMeta, setResultMeta] = useState<{
    source: string;
    aiGenerated: boolean;
    backfilled: boolean;
    totalLatencyMs: number;
  } | null>(null);

  useEffect(() => {
    const direct = extractWizardData(passedWizardData);
    if (direct) {
      setWizardData(direct);
      return;
    }

    const keys = ["wizard-draft", "wizardData", "wizard-data", "wizard_state"];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const parsed = JSON.parse(stored);
        const extracted = extractWizardData(parsed);
        if (extracted) {
          setWizardData(extracted);
          console.log(`[Step12] Loaded wizard data from localStorage: ${key}`);
          return;
        }
      } catch (error) {
        console.warn(`[Step12] Failed to parse ${key}`, error);
      }
    }

    console.warn("[Step12] No wizard data found");
  }, [passedWizardData]);

  const progressSteps: { key: GenerationStatus; label: string; description: string }[] = [
    { key: "generating_ai", label: "جاري بناء التوصية بالذكاء الاصطناعي الاستشاري", description: "طبقة AI تفسر المدخلات وتقترح، بينما تظل قرارات CDKS هي السلطة الأساسية..." },
    { key: "validating", label: "التحقق من صحة البيانات", description: "يتم التأكد من اكتمال مخرجات Blueprint والعقود..." },
    { key: "backfilling", label: "تعبئة البيانات الناقصة", description: "Rules Engine يُكمل أي قسم غير مكتمل..." },
    { key: "adapting", label: "تحويل البيانات للعرض", description: "جاري تجهيز Blueprint للعرض النهائي..." },
  ];

  const generateBlueprint = useCallback(async () => {
    if (!wizardData) {
      setErrorMessage("لا توجد بيانات Wizard متاحة. يرجى العودة وإكمال الخطوات السابقة.");
      setStatus("error");
      return;
    }

    setStatus("generating_ai");
    setErrorMessage("");
    setResultMeta(null);

    try {
      // ✅ تغيير المسار إلى الإصدار الجديد v5
      sessionStorage.removeItem("blueprint_data");

      const response = await fetch("/api/generate/v5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...wizardData,
          ai_reasoning: {
            enabled: true,
            provider: "mock",
            mockScenario: "baseline",
          },
        }),
      });

      // محاكاة خطوات التقدم
      await new Promise((r) => setTimeout(r, 400));
      setStatus("validating");
      await new Promise((r) => setTimeout(r, 400));
      setStatus("backfilling");
      await new Promise((r) => setTimeout(r, 400));
      setStatus("adapting");
      await new Promise((r) => setTimeout(r, 300));

      const result: GenerationResult = await response.json();

      // ✅ معالجة الاستجابة الجديدة
      if (!response.ok || result.status === "error") {
        throw new Error(result.error || result.message || "فشل في إنشاء الـ Blueprint");
      }

      // الاحتفاظ بالـ envelope v5 الكامل بدل تخزين contract مبتور.
      // يتم تفعيل reasoning صراحةً عبر controlled mock provider في هذه المرحلة،
      // دون أي اتصال بمزود AI حي أو منح reasoning سلطة تنفيذية.
      const blueprintData = result.data;
      const processingTime = result.processingTimeMs || 0;

      if (blueprintData && typeof blueprintData === "object") {
        const v5Envelope = {
          ...result,
          data: {
            ...blueprintData,
            wizard_input: wizardData,
          },
          wizard_input: wizardData,
        };
        sessionStorage.setItem("blueprint_data", JSON.stringify(v5Envelope));
        sessionStorage.setItem("wizard_input", JSON.stringify(wizardData));
      }

      setResultMeta({
        source: "CDKS v5 (Rules + Strategy Contract + AI Reasoning Contract)",
        aiGenerated: Boolean(
          blueprintData?.reasoning?.contract || blueprintData?.reasoning
        ),
        backfilled: true,
        totalLatencyMs: processingTime,
      });

      setStatus("success");
      setTimeout(() => router.push("/blueprint"), 1000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      setErrorMessage(msg);
      setStatus("error");
    }
  }, [wizardData, router]);

  // ... باقي الكود (العرض) يبقى كما هو دون تغيير
  // (من السطر 135 إلى نهاية الملف)

  if (!wizardData) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4" dir="rtl">
        <h2 className="text-xl font-bold text-gray-900">جاري تحميل بيانات الـ Wizard...</h2>
        <p className="text-sm text-gray-500">إذا استمر التحميل، ارجع للخطوة السابقة ثم عد إلى المراجعة.</p>
        {onBack && (
          <button onClick={onBack} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium">
            العودة للخطوة السابقة
          </button>
        )}
      </div>
    );
  }

  // Normalize older drafts that may still be nested under state.data.
  const raw =
    wizardData?.state?.data && typeof wizardData.state.data === "object"
      ? wizardData.state.data
      : wizardData;

  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = raw?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "غير محدد";
  };

  const businessType = get("business_type");
  const objective = get("primary_objective", "primary_goal", "objective");
  const budget = get("budget_band", "daily_budget", "budget");
  const channels = get("ad_channels", "preferred_channels", "channels");
  const offer = get("offer_description", "offer");
  const tracking = get("tracking_status", "has_tracking_setup");
  const salesMotion = get("sales_motion", "conversion_destination");
  const destination = get("conversion_destination");
  const locations = get("target_locations", "audience_locations");

  const additionalFields: Array<[string, unknown]> = [
    ["الصناعة", get("industry")],
    ["نوع العرض", get("offer_type")],
    ["العميل المثالي", get("ideal_customer")],
    ["مستوى الوعي", get("awareness_level")],
    ["الشرائح المستهدفة", get("audience_segments")],
    ["الاعتراضات", get("objections")],
    ["زاوية الإقناع", get("persuasion_angle")],
    ["اتجاه الحملة", get("campaign_direction")],
    ["مرونة الميزانية", get("budget_flexibility")],
    ["متوسط قيمة الطلب", get("average_order_value")],
    ["هامش الربح", get("profit_margin")],
    ["أقصى CAC", get("max_cac")],
    ["أدوات التتبع", get("tracking_tools")],
    ["الأحداث الرئيسية", get("key_events")],
    ["نموذج التحويل", get("conversion_model")],
    ["الأصول الإبداعية", get("creative_assets")],
    ["قدرة إنتاج المحتوى", get("content_capacity")],
    ["القيود", get("constraints")],
    ["سرعة الاستجابة", get("response_speed")],
    ["الأولوية القصوى", get("top_priority")],
    ["درجة تحمل المخاطر", get("risk_tolerance")],
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">مراجعة نهائية وإنشاء الـ Blueprint</h2>
        <p className="text-gray-600">سنقوم بتحليل بياناتك وإنشاء Blueprint منظم يضم طبقات استراتيجية وتشغيلية وتفسيرية قابلة للمراجعة</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-800">ملخص البيانات المدخلة</h3>
          <span className="text-xs text-gray-500">بيانات الـ Wizard الفعلية</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">نوع النشاط</span><span className="font-medium text-gray-900">{displayValue(businessType)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">الهدف</span><span className="font-medium text-gray-900">{displayValue(objective)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">نطاق الميزانية</span><span className="font-medium text-gray-900">{displayValue(budget)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">القنوات</span><span className="font-medium text-gray-900">{displayValue(channels)}</span></div>
          <div className="bg-white rounded-lg p-3 border sm:col-span-2"><span className="text-gray-500 block text-xs">العرض</span><span className="font-medium text-gray-900 text-sm leading-relaxed">{displayValue(offer)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">التتبع</span><span className="font-medium text-gray-900">{displayValue(tracking)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">طريقة البيع</span><span className="font-medium text-gray-900">{displayValue(salesMotion)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">وجهة التحويل</span><span className="font-medium text-gray-900">{displayValue(destination)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">المواقع المستهدفة</span><span className="font-medium text-gray-900">{displayValue(locations)}</span></div>
        </div>

        <details className="bg-white rounded-lg border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">عرض باقي بيانات الـ Wizard</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t text-sm">
            {additionalFields.map(([label, value]) => (
              <div key={label} className="rounded-lg p-3 bg-gray-50 border">
                <span className="text-gray-500 block text-xs mb-1">{label}</span>
                <span className="font-medium text-gray-900 break-words">{displayValue(value)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {status !== "idle" && status !== "error" && status !== "success" && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 space-y-4">
          <div className="flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          <div className="space-y-3">
            {progressSteps.map((step, index) => {
              const current = progressSteps.findIndex((s) => s.key === status);
              const isActive = step.key === status;
              const isDone = current > index;
              return (
                <div key={step.key} className={`flex items-center gap-3 ${isActive ? "opacity-100" : isDone ? "opacity-60" : "opacity-30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? "bg-green-500 text-white" : isActive ? "bg-blue-600 text-white animate-pulse" : "bg-gray-300 text-gray-600"}`}>{isDone ? "✓" : index + 1}</div>
                  <div><p className="font-medium text-sm">{step.label}</p>{isActive && <p className="text-xs text-gray-500">{step.description}</p>}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200 text-center space-y-3">
          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto">✓</div>
          <h3 className="text-lg font-bold text-green-800">تم إنشاء الـ Blueprint بنجاح!</h3>
          {resultMeta && <div className="text-sm text-green-700 space-y-1"><p>المصدر: <span className="font-semibold">{resultMeta.aiGenerated ? "CDKS v5 (AI + Rules + Compiler)" : "Rules Engine"}</span></p>{resultMeta.backfilled && <p>تمت تعبئة البيانات الناقصة تلقائياً</p>}<p className="text-xs text-green-600">الوقت: {(resultMeta.totalLatencyMs / 1000).toFixed(1)} ثانية</p></div>}
          <p className="text-sm text-gray-500">جاري التوجيه إلى صفحة العرض...</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200 text-center space-y-4">
          <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto">✕</div>
          <h3 className="text-lg font-bold text-red-800">حدث خطأ أثناء الإنشاء</h3>
          <p className="text-sm text-red-700">{errorMessage}</p>
          <div className="flex gap-3 justify-center"><button onClick={generateBlueprint} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">إعادة المحاولة</button>{onBack && <button onClick={onBack} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium">العودة للتعديل</button>}</div>
        </div>
      )}

      {status === "idle" && (
        <div className="flex gap-3">
          {onBack && <button onClick={onBack} className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">السابق</button>}
          <button onClick={generateBlueprint} className="flex-[2] px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200">إنشاء الـ Blueprint</button>
        </div>
      )}
    </div>
  );
}
/**
 * Campaign Engine Builder — Step 12: Review & Generate
 * Updated to use CDKS v5 API
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildWizardGenerationPayload } from "@/lib/wizard-generation";
import { formatLocaleNumber, getOptionLabel, localizeText, localeDirection, type AppLocale } from "@/lib/i18n";

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

// ملخص السياق الذي يعيده الخادم للعرض read-only بعد المطابقة التلقائية
interface KnowledgeContextSummary {
  contextId: string;
  packageId: string;
  snapshotId: string;
  market: string;
  industry: string;
  evidenceLocale: string;
  currency: string;
  freshnessStatus: string;
  scopedValidationStatus: string;
  scopedMarketValidated: boolean;
  globalMarketValidated: false;
  approvedFactCount: number;
  unavailableBenchmarkCategories: string[];
}

interface GenerationResult {
  status: "success" | "error";
  data?: any; // CanonicalBlueprint
  knowledge_context?: KnowledgeContextSummary | null;
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

function displayValue(value: any, fallback = "غير محدد", locale: AppLocale = "ar"): string {
  const resolvedFallback = fallback === "غير محدد" && locale === "en" ? "Not specified" : fallback;
  if (value === undefined || value === null || value === "") return resolvedFallback;
  if (typeof value === "string") return getOptionLabel(locale, value, value);
  if (typeof value === "number") return formatLocaleNumber(value, locale);
  if (typeof value === "boolean") return value ? (locale === "ar" ? "نعم" : "Yes") : (locale === "ar" ? "لا" : "No");
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item, "", locale)).filter(Boolean).join(locale === "ar" ? "، " : ", ") || resolvedFallback;
  }
  if (typeof value === "object") {
    if ("value" in value) return displayValue(value.value, resolvedFallback, locale);
    if (value.name) return getOptionLabel(locale, String(value.name), String(value.name));
    if (value.label) return getOptionLabel(locale, String(value.label), String(value.label));
    if (value.description) return String(value.description);
  }
  return resolvedFallback;
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
    knowledgeContext: KnowledgeContextSummary | null;
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
          return;
        }
      } catch {
        // Ignore malformed legacy drafts and continue to the next storage key.
      }
    }

  }, [passedWizardData]);

  const locale: AppLocale = wizardData?.locale === "en" ? "en" : "ar";
  const progressSteps: { key: GenerationStatus; label: string; description: string }[] = [
    {
      key: "generating_ai",
      label: localizeText(locale, wizardData?.ai_advisory_enabled ? "جاري تشغيل AI الاستشاري اختياريًا" : "جاري بناء Blueprint بواسطة CDKS", wizardData?.ai_advisory_enabled ? "Running optional advisory AI" : "Building the Blueprint with CDKS"),
      description: wizardData?.ai_advisory_enabled
        ? localizeText(locale, "سيحلل AI النسخة المنقحة ويقترح، بينما تظل قرارات CDKS هي السلطة الأساسية...", "AI will analyze the sanitized copy and suggest, while CDKS remains authoritative...")
        : localizeText(locale, "يطبق CDKS قواعد القرار والجاهزية على مدخلاتك دون إرسالها إلى مزود AI خارجي...", "CDKS applies decision and readiness rules without sending your input to an external AI provider..."),
    },
    { key: "validating", label: localizeText(locale, "التحقق من صحة البيانات", "Validating data"), description: localizeText(locale, "يتم التأكد من اكتمال مخرجات Blueprint والعقود...", "Checking Blueprint outputs and contracts..." ) },
    { key: "backfilling", label: localizeText(locale, "تعبئة البيانات الناقصة", "Completing missing data"), description: localizeText(locale, "Rules Engine يُكمل أي قسم غير مكتمل...", "The Rules Engine completes any incomplete section..." ) },
    { key: "adapting", label: localizeText(locale, "تحويل البيانات للعرض", "Preparing the client view"), description: localizeText(locale, "جاري تجهيز Blueprint للعرض النهائي...", "Preparing the Blueprint for the final view..." ) },
  ];

  const generateBlueprint = useCallback(async () => {
    if (!wizardData) {
      setErrorMessage(localizeText(locale, "لا توجد بيانات Wizard متاحة. يرجى العودة وإكمال الخطوات السابقة.", "No Wizard data is available. Go back and complete the previous steps."));
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
          ...buildWizardGenerationPayload(wizardData),
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
        throw new Error(result.error || result.message || localizeText(locale, "فشل في إنشاء الـ Blueprint", "Blueprint generation failed"));
      }

      // الاحتفاظ بالـ envelope v5 الكامل بدل تخزين contract مبتور.
      // AI الاستشاري يظل اختياريًا؛ الخادم يقرر إن كان سيستخدم مزودًا حيًا
      // في وضع Non-Production، مع بقاء CDKS وBlueprint-only حاكمين دائمًا.
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
        knowledgeContext: result.knowledge_context ?? null,
      });

      setStatus("success");
      setTimeout(() => router.push("/blueprint"), 1000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : localizeText(locale, "حدث خطأ غير متوقع", "An unexpected error occurred");
      setErrorMessage(msg);
      setStatus("error");
    }
  }, [locale, wizardData, router]);

  // ... باقي الكود (العرض) يبقى كما هو دون تغيير
  // (من السطر 135 إلى نهاية الملف)

  if (!wizardData) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4" dir={localeDirection(locale)} lang={locale}>
        <h2 className="text-xl font-bold text-gray-900">{localizeText(locale, "جاري تحميل بيانات الـ Wizard...", "Loading Wizard data...")}</h2>
        <p className="text-sm text-gray-500">{localizeText(locale, "إذا استمر التحميل، ارجع للخطوة السابقة ثم عد إلى المراجعة.", "If loading continues, go back to the previous step and return to review.")}</p>
        {onBack && (
          <button onClick={onBack} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium">
            {localizeText(locale, "العودة للخطوة السابقة", "Back to the previous step")}
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
    [localizeText(locale, "الصناعة", "Industry"), get("industry")],
    [localizeText(locale, "نوع العرض", "Offer type"), get("offer_type")],
    [localizeText(locale, "العميل المثالي", "Ideal customer"), get("ideal_customer")],
    [localizeText(locale, "مستوى الوعي", "Awareness level"), get("awareness_level")],
    [localizeText(locale, "الشرائح المستهدفة", "Audience segments"), get("audience_segments")],
    [localizeText(locale, "الاعتراضات", "Objections"), get("objections")],
    [localizeText(locale, "زاوية الإقناع", "Persuasion angle"), get("persuasion_angle")],
    [localizeText(locale, "اتجاه الحملة", "Campaign direction"), get("campaign_direction")],
    [localizeText(locale, "مرونة الميزانية", "Budget flexibility"), get("budget_flexibility")],
    [localizeText(locale, "متوسط قيمة الطلب", "Average order value"), get("average_order_value")],
    [localizeText(locale, "هامش الربح", "Profit margin"), get("profit_margin")],
    [localizeText(locale, "أقصى CAC", "Maximum CAC"), get("max_cac")],
    [localizeText(locale, "أدوات التتبع", "Tracking tools"), get("tracking_tools")],
    [localizeText(locale, "الأحداث الرئيسية", "Key events"), get("key_events")],
    [localizeText(locale, "نموذج التحويل", "Conversion model"), get("conversion_model")],
    [localizeText(locale, "الأصول الإبداعية", "Creative assets"), get("creative_assets")],
    [localizeText(locale, "قدرة إنتاج المحتوى", "Content production capacity"), get("content_capacity")],
    [localizeText(locale, "القيود", "Constraints"), get("constraints")],
    [localizeText(locale, "سرعة الاستجابة", "Response speed"), get("response_speed")],
    [localizeText(locale, "الأولوية القصوى", "Top priority"), get("top_priority")],
    [localizeText(locale, "درجة تحمل المخاطر", "Risk tolerance"), get("risk_tolerance")],
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" dir={localeDirection(locale)} lang={locale}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{localizeText(locale, "مراجعة نهائية وإنشاء الـ Blueprint", "Final review and Blueprint creation")}</h2>
        <p className="text-gray-600">{localizeText(locale, "سنقوم بتحليل بياناتك وإنشاء Blueprint منظم يضم طبقات استراتيجية وتشغيلية وتفسيرية قابلة للمراجعة", "We will analyze your data and create a structured Blueprint with strategic, operational, and explanatory layers for review.")}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-800">{localizeText(locale, "ملخص البيانات المدخلة", "Input summary")}</h3>
          <span className="text-xs text-gray-500">{localizeText(locale, "بيانات الـ Wizard الفعلية", "Actual Wizard data")}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "نوع النشاط", "Business type")}</span><span className="font-medium text-gray-900">{displayValue(businessType, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "الهدف", "Objective")}</span><span className="font-medium text-gray-900">{displayValue(objective, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "نطاق الميزانية", "Budget range")}</span><span className="font-medium text-gray-900">{displayValue(budget, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "القنوات", "Channels")}</span><span className="font-medium text-gray-900">{displayValue(channels, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border sm:col-span-2"><span className="text-gray-500 block text-xs">{localizeText(locale, "العرض", "Offer")}</span><span className="font-medium text-gray-900 text-sm leading-relaxed">{displayValue(offer, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "التتبع", "Tracking")}</span><span className="font-medium text-gray-900">{displayValue(tracking, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "طريقة البيع", "Sales motion")}</span><span className="font-medium text-gray-900">{displayValue(salesMotion, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "وجهة التحويل", "Conversion destination")}</span><span className="font-medium text-gray-900">{displayValue(destination, "غير محدد", locale)}</span></div>
          <div className="bg-white rounded-lg p-3 border"><span className="text-gray-500 block text-xs">{localizeText(locale, "المواقع المستهدفة", "Target locations")}</span><span className="font-medium text-gray-900">{displayValue(locations, "غير محدد", locale)}</span></div>
        </div>

        <details className="bg-white rounded-lg border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">{localizeText(locale, "عرض باقي بيانات الـ Wizard", "Show the remaining Wizard data")}</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t text-sm">
            {additionalFields.map(([label, value]) => (
              <div key={label} className="rounded-lg p-3 bg-gray-50 border">
                <span className="text-gray-500 block text-xs mb-1">{label}</span>
                <span className="font-medium text-gray-900 break-words">{displayValue(value, "غير محدد", locale)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-3">
        <div>
          <h3 className="font-semibold text-indigo-950">{localizeText(locale, "السياق المعرفي — يحدده النظام تلقائيًا", "Knowledge Context — matched automatically")}</h3>
          <p className="mt-1 text-sm leading-6 text-indigo-800">{localizeText(locale, "لا يحتاج العميل إلى اختيار مصدر معرفي. يطابق الخادم تلقائيًا سياقًا مسموحًا فقط عندما يتطابق السوق والنشاط مع نطاق الأدلة المنقحة؛ وإلا تستمر النتيجة اعتمادًا على Wizard وCDKS فقط.", "You do not need to choose a knowledge source. The server automatically matches an allowlisted context only when the market and business match sanitized evidence; otherwise the result relies on Wizard and CDKS.")}</p>
        </div>
        <p className="rounded-lg bg-white/70 p-3 text-xs leading-5 text-indigo-900">{localizeText(locale, "سيظهر السياق الذي استخدمه النظام، إن وُجد، في صفحة Blueprint كمرجع للقراءة فقط. لا يغيّر هذا السياق قرارات CDKS ولا يفعّل Market Validation ولا ينشئ صلاحية إطلاق.", "If a context is used, it will appear on the Blueprint page as read-only provenance. It does not change CDKS decisions, enable Market Validation, or authorize a launch.")}</p>
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
          <h3 className="text-lg font-bold text-green-800">{localizeText(locale, "تم إنشاء الـ Blueprint بنجاح!", "Blueprint created successfully")}</h3>
          {resultMeta && <div className="text-sm text-green-700 space-y-1"><p>{localizeText(locale, "المصدر: ", "Source: ")}<span className="font-semibold">{resultMeta.aiGenerated ? "CDKS v5 (AI + Rules + Compiler)" : "Rules Engine"}</span></p>{resultMeta.backfilled && <p>{localizeText(locale, "تمت تعبئة البيانات الناقصة تلقائيًا", "Missing data was completed automatically")}</p>}<p className="text-xs text-green-600">{localizeText(locale, "الوقت: ", "Time: ")}{formatLocaleNumber(resultMeta.totalLatencyMs / 1000, locale, { maximumFractionDigits: 1 })} {localizeText(locale, "ثانية", "seconds")}</p></div>}
          <p className="text-sm text-gray-500">{localizeText(locale, "جاري التوجيه إلى صفحة العرض...", "Redirecting to the client view...")}</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200 text-center space-y-4">
          <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto">✕</div>
          <h3 className="text-lg font-bold text-red-800">{localizeText(locale, "حدث خطأ أثناء الإنشاء", "An error occurred during creation")}</h3>
          <p className="text-sm text-red-700">{errorMessage}</p>
          <div className="flex gap-3 justify-center"><button onClick={generateBlueprint} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">{localizeText(locale, "إعادة المحاولة", "Retry")}</button>{onBack && <button onClick={onBack} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium">{localizeText(locale, "العودة للتعديل", "Back to edit")}</button>}</div>
        </div>
      )}

      {status === "idle" && (
        <div className="flex gap-3">
          {onBack && <button onClick={onBack} className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">{localizeText(locale, "السابق", "Back")}</button>}
          <button onClick={generateBlueprint} className="flex-[2] px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200">{localizeText(locale, "إنشاء الـ Blueprint", "Create Blueprint")}</button>
        </div>
      )}
    </div>
  );
}
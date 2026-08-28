"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, StepNav } from "@/components/WizardComponents";
import { LOCALE_OPTIONS, localizeText } from "@/lib/i18n";

const options = [
  { ar: "حملة جديدة من الصفر", en: "A new campaign from scratch", value: "new_campaign" },
  { ar: "تحسين حملة موجودة", en: "Optimize an existing campaign", value: "optimize_existing" },
  { ar: "تشخيص نشاط قبل الإطلاق", en: "Diagnose the business before launch", value: "diagnose_business" },
  { ar: "إعادة هيكلة الحساب الإعلاني", en: "Restructure the ad account", value: "restructure_account" },
  { ar: "بناء خطة اختبار أولية", en: "Build an initial testing plan", value: "test_plan" },
];

export default function Step0_Start({ onNext }: { onNext: () => void }) {
  const { data, setField } = useWizardStore();
  const localizedOptions = options.map((option) => ({ label: data.locale === "en" ? option.en : option.ar, value: option.value }));

  return (
    <div>
      <section className="mb-8 rounded-2xl border border-violet-500/30 bg-gray-900/50 p-5" aria-label={localizeText(data.locale, "اختيار لغة الواجهة والنتائج", "Interface and output language")}>
        <div className="flex items-start justify-between gap-4">
          <div className={data.locale === "ar" ? "text-right" : "text-left"}>
            <p className="text-white text-base font-semibold">{localizeText(data.locale, "لغة الواجهة والنتائج", "Interface and output language")}</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">{localizeText(data.locale, "اختر اللغة التي سيستخدمها النظام لعرض الـWizard والـBlueprint والتفسير الاستشاري. لا تتغير القرارات أو البيانات الحاكمة بتغيير اللغة.", "Choose the language used to display the Wizard, Blueprint, and advisory explanation. Changing language does not change governed decisions or data.")}</p>
          </div>
          <span className="text-xl" aria-hidden="true">文</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label={localizeText(data.locale, "اختيار اللغة", "Language selection")}>
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={data.locale === option.value}
              onClick={() => setField("locale", option.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 ${data.locale === option.value ? "border-violet-400 bg-violet-600 text-white" : "border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-500"}`}
            >
              {option.nativeLabel}
            </button>
          ))}
        </div>
      </section>

      <QuestionCard label={data.locale === "ar" ? "ما الذي تريد أن يبنيه النظام لك؟" : "What would you like the system to build for you?"}>
        <SingleSelect
          options={localizedOptions}
          value={data.build_mode}
          onChange={(value) => setField("build_mode", value)}
        />
      </QuestionCard>

      <section className="rounded-2xl border border-violet-500/30 bg-gray-900/50 p-5" aria-label={localizeText(data.locale, "اختيار AI الاستشاري", "Advisory AI selection")}>
        <div className="flex items-start justify-between gap-4">
          <div className={data.locale === "ar" ? "text-right" : "text-left"}>
            <p className="text-white text-base font-semibold">{data.locale === "ar" ? "هل تريد استخدام AI الاستشاري؟" : "Would you like to use advisory AI?"}</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {data.locale === "ar" ? "اختياري تمامًا. عند تشغيله، سيحلل نسخة منقحة من إجاباتك ليقترح زوايا ورسائل ويفسر بعض قرارات Blueprint. قرارات CDKS تظل هي الأساس، ولا يستطيع AI نشر حملة أو إنفاق ميزانية." : "Completely optional. When enabled, it analyzes a sanitized copy of your answers to suggest angles and messages and explain selected Blueprint decisions. CDKS remains authoritative, and AI cannot publish a campaign or spend budget."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={data.ai_advisory_enabled}
            onClick={() => setField("ai_advisory_enabled", !data.ai_advisory_enabled)}
            className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              data.ai_advisory_enabled
                ? "border-violet-400 bg-violet-600"
                : "border-gray-600 bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                data.ai_advisory_enabled ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
        </div>

        <div className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${
          data.ai_advisory_enabled
            ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
            : "border-gray-700 bg-gray-800/40 text-gray-400"
        }`}>
          {data.ai_advisory_enabled
            ? (data.locale === "ar" ? "تم اختيار AI الاستشاري. سيتم إرسال البيانات المنقحة فقط، ويتحقق الخادم من جاهزية المزود قبل تنفيذ أي طلب." : "Advisory AI is enabled. Only sanitized data is sent, and the server verifies provider readiness before making a request.")
            : (data.locale === "ar" ? "AI الاستشاري متوقف. سيُنشئ النظام Blueprint باستخدام Wizard وCDKS وRules Engine فقط." : "Advisory AI is off. The system will create the Blueprint using Wizard, CDKS, and the Rules Engine only.")}
        </div>
      </section>

      <StepNav canGoBack={false} onNext={onNext} />
    </div>
  );
}

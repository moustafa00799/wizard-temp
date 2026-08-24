"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, StepNav } from "@/components/WizardComponents";

const options = [
  { label: "حملة جديدة من الصفر", value: "new_campaign" },
  { label: "تحسين حملة موجودة", value: "optimize_existing" },
  { label: "تشخيص نشاط قبل الإطلاق", value: "diagnose_business" },
  { label: "إعادة هيكلة الحساب الإعلاني", value: "restructure_account" },
  { label: "بناء خطة اختبار أولية", value: "test_plan" },
];

export default function Step0_Start({ onNext }: { onNext: () => void }) {
  const { data, setField } = useWizardStore();

  return (
    <div>
      <QuestionCard label="ما الذي تريد أن يبنيه النظام لك؟">
        <SingleSelect
          options={options}
          value={data.build_mode}
          onChange={(value) => setField("build_mode", value)}
        />
      </QuestionCard>

      <section className="rounded-2xl border border-violet-500/30 bg-gray-900/50 p-5" aria-label="اختيار AI الاستشاري">
        <div className="flex items-start justify-between gap-4">
          <div className="text-right">
            <p className="text-white text-base font-semibold">هل تريد استخدام AI الاستشاري؟</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              اختياري تمامًا. عند تشغيله، سيحلل نسخة منقحة من إجاباتك ليقترح زوايا ورسائل ويفسر بعض قرارات Blueprint.
              قرارات CDKS تظل هي الأساس، ولا يستطيع AI نشر حملة أو إنفاق ميزانية.
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
            ? "تم اختيار AI الاستشاري. سيتم إرسال البيانات المنقحة فقط، ويتحقق الخادم من جاهزية المزود قبل تنفيذ أي طلب."
            : "AI الاستشاري متوقف. سيُنشئ النظام Blueprint باستخدام Wizard وCDKS وRules Engine فقط."}
        </div>
      </section>

      <StepNav canGoBack={false} onNext={onNext} />
    </div>
  );
}

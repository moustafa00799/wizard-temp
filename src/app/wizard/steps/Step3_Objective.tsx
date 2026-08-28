"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, MultiSelectChips, StepNav } from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const primaryObjectives = [
  { label: "مبيعات", value: "sales" },
  { label: "Leads", value: "leads" },
  { label: "رسائل", value: "messages" },
  { label: "زيارات", value: "traffic" },
  { label: "تثبيت تطبيق", value: "app_installs" },
  { label: "وعي", value: "awareness" },
  { label: "إعادة استهداف", value: "retargeting" },
  { label: "حجز موعد / استشارة", value: "booking" },
  { label: "مكالمات", value: "calls" },
];

const secondaryObjectives = [
  { label: "جمع بيانات عملاء", value: "lead_capture" },
  { label: "رفع الوعي", value: "brand_awareness" },
  { label: "اختبار جمهور", value: "audience_testing" },
  { label: "اختبار رسائل", value: "message_testing" },
  { label: "بناء جمهور دافئ", value: "warm_audience" },
  { label: "زيادة الطلب الموسمي", value: "seasonal_demand" },
  { label: "تقليل تكلفة الاكتساب", value: "reduce_cac" },
];

const kpiOptions = [
  { label: "عدد المبيعات", value: "sales_count" },
  { label: "تكلفة الاكتساب", value: "cac" },
  { label: "عدد الرسائل", value: "message_count" },
  { label: "عدد العملاء المحتملين", value: "lead_count" },
  { label: "عدد المكالمات", value: "call_count" },
  { label: "عدد التثبيتات", value: "install_count" },
  { label: "العائد على الإنفاق الإعلاني", value: "roas" },
  { label: "معدل التحويل", value: "conversion_rate" },
];

export default function Step3_Objective({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();
  const locale = data.locale === "en" ? "en" : "ar";
  return (
    <div>
      <QuestionCard label={localizeText(locale, "ما الهدف الأساسي للحملة؟", "What is the primary campaign objective?")}>
        <SingleSelect
          options={primaryObjectives}
          value={data.primary_objective}
          onChange={(v) => setField("primary_objective", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما الأهداف الثانوية المهمة أيضًا؟", "Which secondary objectives also matter?")}>
        <MultiSelectChips
          options={secondaryObjectives}
          value={data.secondary_objectives}
          onChange={(v) => setField("secondary_objectives", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما أهم مؤشر نجاح بالنسبة لك؟", "What is the most important success metric for you?")}>
        <SingleSelect
          options={kpiOptions}
          value={data.north_star_kpi}
          onChange={(v) => setField("north_star_kpi", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, StepNav } from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const priorityOptions = [
  { label: "زيادة الطلب", value: "increase_demand" },
  { label: "تقليل التكلفة", value: "reduce_cost" },
  { label: "تحسين جودة العملاء", value: "lead_quality" },
  { label: "رفع معدل التحويل", value: "conversion_rate" },
  { label: "بناء الوعي", value: "awareness" },
  { label: "إصلاح التتبع", value: "tracking_fix" },
  { label: "تنظيم الحساب الإعلاني", value: "account_structure" },
];

const riskOptions = [
  { label: "منخفض جدًا", value: "very_low" },
  { label: "متوسط", value: "medium" },
  { label: "مرتفع إذا كان العائد جيد", value: "high_if_return" },
  { label: "لا يهم طالما النتائج قوية", value: "result_first" },
];

export default function Step11_Priority({
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
      <QuestionCard label={localizeText(locale, "لو لم نحل كل شيء، فما الأولوية الأولى؟", "If we cannot solve everything, what is the first priority?")}>
        <SingleSelect
          options={priorityOptions}
          value={data.top_priority}
          onChange={(v) => setField("top_priority", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما مستوى المخاطرة الذي تقبله في الاختبار؟", "What level of testing risk do you accept?")}>
        <SingleSelect
          options={riskOptions}
          value={data.risk_tolerance}
          onChange={(v) => setField("risk_tolerance", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} nextLabel={localizeText(locale, "مراجعة البيانات", "Review data")} />
    </div>
  );
}

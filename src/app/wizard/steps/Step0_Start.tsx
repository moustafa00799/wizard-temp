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
          onChange={(v) => setField("build_mode", v)}
        />
      </QuestionCard>
      <StepNav canGoBack={false} onNext={onNext} />
    </div>
  );
}

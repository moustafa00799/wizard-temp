"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  NumberInput,
  StepNav,
} from "@/components/WizardComponents";

const budgetBands = [
  { label: "أقل من 100 يوميًا", value: "under_100" },
  { label: "100–300 يوميًا", value: "100_300" },
  { label: "300–1000 يوميًا", value: "300_1000" },
  { label: "1000–5000 يوميًا", value: "1000_5000" },
  { label: "أكثر من ذلك", value: "above_5000" },
  { label: "غير محدد بعد", value: "unknown" },
];

const flexibilityOptions = [
  { label: "ثابتة جدًا", value: "fixed" },
  { label: "مرنة قليلًا", value: "slightly_flexible" },
  { label: "مرنة", value: "flexible" },
  { label: "أستطيع التوسع إذا ظهرت نتائج", value: "scale_if_positive" },
];

export default function Step8_Budget({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();

  return (
    <div>
      <QuestionCard label="ما نطاق الميزانية المتاح؟">
        <SingleSelect
          options={budgetBands}
          value={data.budget_band}
          onChange={(v) => setField("budget_band", v)}
        />
      </QuestionCard>

      <QuestionCard label="هل الميزانية ثابتة أم مرنة؟">
        <SingleSelect
          options={flexibilityOptions}
          value={data.budget_flexibility}
          onChange={(v) => setField("budget_flexibility", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما متوسط قيمة الصفقة أو الطلب؟">
        <NumberInput
          placeholder="اكتب الرقم أو النطاق التقريبي"
          value={data.average_order_value}
          onChange={(v) => setField("average_order_value", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما هامش الربح التقريبي؟">
        <NumberInput
          placeholder="نسبة أو رقم تقريبي"
          value={data.profit_margin}
          onChange={(v) => setField("profit_margin", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما أقصى تكلفة اكتساب تقبلها؟">
        <NumberInput
          placeholder="CPA / CPL / Cost per purchase"
          value={data.max_cac}
          onChange={(v) => setField("max_cac", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

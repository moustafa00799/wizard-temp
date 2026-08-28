"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  NumberInput,
  StepNav,
} from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

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
  const locale = data.locale === "en" ? "en" : "ar";

  return (
    <div>
      <QuestionCard label={localizeText(locale, "ما نطاق الميزانية المتاح؟", "What budget range is available?")}>
        <SingleSelect
          options={budgetBands}
          value={data.budget_band}
          onChange={(v) => setField("budget_band", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "هل الميزانية ثابتة أم مرنة؟", "Is the budget fixed or flexible?")}>
        <SingleSelect
          options={flexibilityOptions}
          value={data.budget_flexibility}
          onChange={(v) => setField("budget_flexibility", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما متوسط قيمة الصفقة أو الطلب؟", "What is the average order or deal value?")}>
        <NumberInput
          placeholder={localizeText(locale, "اكتب الرقم أو النطاق التقريبي", "Enter an approximate number or range")}
          value={data.average_order_value}
          onChange={(v) => setField("average_order_value", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما هامش الربح التقريبي؟", "What is the approximate profit margin?")}>
        <NumberInput
          placeholder={localizeText(locale, "نسبة أو رقم تقريبي", "Enter an approximate percentage or amount")}
          value={data.profit_margin}
          onChange={(v) => setField("profit_margin", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما أقصى تكلفة اكتساب تقبلها؟", "What is the maximum acquisition cost you accept?")}>
        <NumberInput
          placeholder={localizeText(locale, "CPA / CPL / Cost per purchase", "CPA / CPL / cost per purchase")}
          value={data.max_cac}
          onChange={(v) => setField("max_cac", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

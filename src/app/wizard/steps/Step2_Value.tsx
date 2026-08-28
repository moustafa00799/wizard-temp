"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, TextArea, MultiSelectChips, StepNav } from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const valueDrivers = [
  { label: "السعر", value: "price" },
  { label: "الجودة", value: "quality" },
  { label: "السرعة", value: "speed" },
  { label: "الثقة", value: "trust" },
  { label: "الضمان", value: "warranty" },
  { label: "النتائج", value: "results" },
  { label: "التخصص", value: "specialization" },
  { label: "سهولة الطلب", value: "easy_order" },
  { label: "خدمة ما بعد البيع", value: "after_sales" },
  { label: "سمعة العلامة", value: "brand_reputation" },
];

export default function Step2_Value({
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
      <QuestionCard label={localizeText(locale, "ما المشكلة التي يحلها هذا النشاط؟", "What problem does this business solve?")}>
        <TextArea
          placeholder={localizeText(locale, "صف الألم الحقيقي الذي يشعر به العميل", "Describe the real pain the customer feels")}
          value={data.customer_problem ?? ""}
          onChange={(v) => setField("customer_problem", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما الأسباب الأقوى التي تجعل العميل يختارك؟", "What are the strongest reasons a customer should choose you?")}>
        <MultiSelectChips
          options={valueDrivers}
          value={data.key_value_drivers}
          onChange={(v) => setField("key_value_drivers", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "اذكر الفرق الحقيقي بينك وبين المنافسين.", "What is the real difference between you and competitors?")}>
        <TextArea
          placeholder={localizeText(locale, "ميزة، دليل، تجربة، عرض، أو سرعة تنفيذ", "A feature, proof point, experience, offer, or delivery advantage")}
          value={data.usp ?? ""}
          onChange={(v) => setField("usp", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

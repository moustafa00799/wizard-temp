"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, TextArea, MultiSelectChips, StepNav } from "@/components/WizardComponents";

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
  return (
    <div>
      <QuestionCard label="ما المشكلة التي يحلها هذا النشاط؟">
        <TextArea
          placeholder="صف الألم الحقيقي الذي يشعر به العميل"
          value={data.customer_problem ?? ""}
          onChange={(v) => setField("customer_problem", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الأسباب الأقوى التي تجعل العميل يختارك؟">
        <MultiSelectChips
          options={valueDrivers}
          value={data.key_value_drivers}
          onChange={(v) => setField("key_value_drivers", v)}
        />
      </QuestionCard>

      <QuestionCard label="اذكر الفرق الحقيقي بينك وبين المنافسين.">
        <TextArea
          placeholder="ميزة، دليل، تجربة، عرض، أو سرعة تنفيذ"
          value={data.usp ?? ""}
          onChange={(v) => setField("usp", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

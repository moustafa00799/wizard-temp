"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, TextArea, StepNav } from "@/components/WizardComponents";

const businessTypes = [
  { label: "خدمة محلية", value: "local_service" },
  { label: "متجر إلكتروني", value: "ecommerce" },
  { label: "منتج استهلاكي", value: "consumer_product" },
  { label: "تطبيق", value: "app" },
  { label: "B2B", value: "b2b" },
  { label: "تعليم / كورس", value: "education" },
  { label: "وكالة / خدمة احترافية", value: "agency_service" },
  { label: "نشاط آخر", value: "other" },
];

const salesMotions = [
  { label: "شراء مباشر من الموقع", value: "website_purchase" },
  { label: "عبر واتساب", value: "whatsapp" },
  { label: "عبر مكالمة", value: "call" },
  { label: "عبر فورم", value: "form" },
  { label: "عبر الرسائل", value: "messages" },
  { label: "من خلال مندوب / فريق مبيعات", value: "sales_team" },
  { label: "أكثر من قناة", value: "multi_channel" },
];

export default function Step1_Business({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();
  return (
    <div>
      <QuestionCard label="ما نوع النشاط؟">
        <SingleSelect
          options={businessTypes}
          value={data.business_type}
          onChange={(v) => setField("business_type", v)}
        />
      </QuestionCard>

      <QuestionCard label="صف المنتج أو الخدمة باختصار.">
        <TextArea
          placeholder="اكتب ماذا تقدم، لمن، وبأي شكل يتم البيع"
          value={data.offer_description ?? ""}
          onChange={(v) => setField("offer_description", v)}
        />
      </QuestionCard>

      <QuestionCard label="كيف تتم عملية البيع غالبًا؟">
        <SingleSelect
          options={salesMotions}
          value={data.sales_motion}
          onChange={(v) => setField("sales_motion", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

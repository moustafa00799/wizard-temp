"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  TextArea,
  StepNav,
} from "@/components/WizardComponents";

const offerTypes = [
  { label: "خصم", value: "discount" },
  { label: "باقة", value: "bundle" },
  { label: "استشارة", value: "consultation" },
  { label: "تجربة مجانية", value: "free_trial" },
  { label: "ضمان", value: "guarantee" },
  { label: "شحن مجاني", value: "free_shipping" },
  { label: "سعر خاص", value: "special_price" },
  { label: "مدة محدودة", value: "limited_time" },
  { label: "لا يوجد عرض واضح", value: "no_clear_offer" },
];

const objectionOptions = [
  { label: "السعر", value: "price" },
  { label: "عدم الثقة", value: "trust" },
  { label: "لم أقتنع بالقيمة", value: "value_unclear" },
  { label: "تجربة سابقة سيئة", value: "bad_past_experience" },
  { label: "الخوف من النتيجة", value: "fear_of_outcome" },
  { label: "الوقت", value: "time" },
  { label: "صعوبة التنفيذ", value: "complexity" },
  { label: "المقارنة مع المنافسين", value: "competitor_comparison" },
  { label: "لا توجد اعتراضات واضحة", value: "none" },
];

const persuasionAngles = [
  { label: "السعر", value: "price" },
  { label: "القيمة", value: "value" },
  { label: "الثقة", value: "trust" },
  { label: "السرعة", value: "speed" },
  { label: "النتيجة", value: "result" },
  { label: "التخصص", value: "specialization" },
  { label: "الندرة", value: "scarcity" },
  { label: "الشهادات / testimonials", value: "social_proof" },
  { label: "الضمان", value: "guarantee" },
];

export default function Step6_Offer({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();

  return (
    <div>
      <QuestionCard label="ما نوع العرض الذي تقدمه؟">
        <SingleSelect
          options={offerTypes}
          value={data.offer_type}
          onChange={(v) => setField("offer_type", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الجملة الأساسية التي تريد أن يفهمها العميل فورًا؟">
        <TextArea
          placeholder="اكتب الرسالة كما ستظهر في الإعلان أو الهيدر"
          value={data.core_message ?? ""}
          onChange={(v) => setField("core_message", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما أكثر الاعتراضات التي تمنع العميل من الشراء؟">
        <MultiSelectChips
          options={objectionOptions}
          value={data.objections}
          onChange={(v) => setField("objections", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الزاوية الإقناعية الأقوى؟">
        <SingleSelect
          options={persuasionAngles}
          value={data.persuasion_angle}
          onChange={(v) => setField("persuasion_angle", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

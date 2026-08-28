"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  TextArea,
  TextListInput,
  StepNav,
} from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const awarenessOptions = [
  { label: "لا يعرف المشكلة أصلًا", value: "unaware" },
  { label: "يعرف المشكلة لكنه لا يعرف الحل", value: "problem_aware" },
  { label: "يعرف الحل لكنه لا يعرفنا", value: "solution_aware" },
  { label: "يعرفنا لكنه لم يشترِ بعد", value: "brand_aware" },
  { label: "جاهز للشراء الآن", value: "purchase_ready" },
];

const segmentOptions = [
  { label: "مبتدئ", value: "beginner" },
  { label: "متوسط", value: "mid" },
  { label: "متقدم", value: "advanced" },
  { label: "High Intent", value: "high_intent" },
  { label: "زوار الموقع", value: "website_visitors" },
  { label: "متفاعلون", value: "engagers" },
  { label: "عملاء سابقون", value: "existing_customers" },
  { label: "جمهور مشابه", value: "lookalike" },
  { label: "جمهور بارد", value: "cold_audience" },
];

// FIX A: "geo_custom" is intentionally excluded — backend rejects it
const geoScopes = [
  { label: "مدينة واحدة", value: "single_city" },
  { label: "عدة مدن", value: "multiple_cities" },
  { label: "دولة كاملة", value: "country" },
  { label: "عدة دول", value: "multiple_countries" },
  { label: "محلي حول فرع", value: "local_radius" },
];

export default function Step5_Audience({
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
      <QuestionCard label={localizeText(locale, "من هو العميل المثالي الذي تريد استهدافه؟", "Who is the ideal customer you want to target?")}>
        <TextArea
          placeholder={localizeText(locale, "العمر، النوع، الاهتمامات، الوظيفة، الموقع، السلوك", "Age, gender, interests, role, location, and behavior")}
          value={data.ideal_customer ?? ""}
          onChange={(v) => setField("ideal_customer", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "هل يعرف هذا الجمهور الحل بالفعل؟", "Does this audience already know the solution?")}>
        <SingleSelect
          options={awarenessOptions}
          value={data.awareness_level}
          onChange={(v) => setField("awareness_level", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "هل توجد شرائح مختلفة داخل الجمهور؟", "Are there different segments within the audience?")}>
        <MultiSelectChips
          options={segmentOptions}
          value={data.audience_segments}
          onChange={(v) => setField("audience_segments", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "أين تريد الاستهداف؟", "Where do you want to target?")}>
        <SingleSelect
          options={geoScopes}
          value={data.geo_scope}
          onChange={(v) => setField("geo_scope", v)}
        />
      </QuestionCard>

      {data.geo_scope && (
        <QuestionCard label={localizeText(locale, "اكتب المواقع المستهدفة", "List the target locations")}>
          <TextListInput
            placeholder={localizeText(locale, "مثال: القاهرة، الجيزة، الرياض", "Example: Cairo, Giza, Riyadh")}
            value={data.target_locations}
            onChange={(v) => setField("target_locations", v)}
          />
        </QuestionCard>
      )}

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

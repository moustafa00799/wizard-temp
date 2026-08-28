"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  StepNav,
} from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const creativeAssets = [
  { label: "صور", value: "images" },
  { label: "فيديو", value: "video" },
  { label: "UGC", value: "ugc" },
  { label: "شهادات عملاء", value: "testimonials" },
  { label: "لوجو", value: "logo" },
  { label: "كتالوج", value: "catalog" },
  { label: "عروض جاهزة", value: "offers" },
  { label: "لا يوجد محتوى جاهز", value: "none" },
];

const contentCapacity = [
  { label: "نعم بسهولة", value: "easy" },
  { label: "نعم لكن ببطء", value: "slow" },
  { label: "بصعوبة", value: "hard" },
  { label: "لا", value: "no" },
];

const constraintOptions = [
  { label: "وقت", value: "time" },
  { label: "ميزانية", value: "budget" },
  { label: "فريق", value: "team" },
  { label: "موافقات", value: "approvals" },
  { label: "محتوى", value: "content" },
  { label: "قانوني", value: "legal" },
  { label: "تقني", value: "technical" },
  { label: "سياسة منصة", value: "platform_policy" },
  { label: "خدمة العملاء", value: "customer_service" },
  { label: "الرد السريع", value: "response_time" },
];

const responseSpeeds = [
  { label: "فوري", value: "instant" },
  { label: "خلال ساعة", value: "within_hour" },
  { label: "خلال يوم", value: "within_day" },
  { label: "أبطأ من ذلك", value: "slower" },
  { label: "غير معروف", value: "unknown" },
];

export default function Step10_Resources({
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
      <QuestionCard label={localizeText(locale, "ما الأصول المتاحة للإعلانات؟", "Which creative assets are available for the ads?")}>
        <MultiSelectChips
          options={creativeAssets}
          value={data.creative_assets}
          onChange={(v) => setField("creative_assets", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "هل يمكن إنتاج محتوى جديد للحملة؟", "Can new content be produced for the campaign?")}>
        <SingleSelect
          options={contentCapacity}
          value={data.content_capacity}
          onChange={(v) => setField("content_capacity", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما القيود الموجودة؟", "What constraints are present?")}>
        <MultiSelectChips
          options={constraintOptions}
          value={data.constraints}
          onChange={(v) => setField("constraints", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "كم سرعة الرد المتاحة على الاستفسارات؟", "How quickly can inquiries be answered?")}>
        <SingleSelect
          options={responseSpeeds}
          value={data.response_speed}
          onChange={(v) => setField("response_speed", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

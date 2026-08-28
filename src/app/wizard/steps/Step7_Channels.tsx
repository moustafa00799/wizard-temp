"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  StepNav,
} from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

const conversionDests = [
  { label: "موقع", value: "website" },
  { label: "متجر", value: "store" },
  { label: "واتساب", value: "whatsapp" },
  { label: "ماسنجر", value: "messenger" },
  { label: "مكالمة", value: "call" },
  { label: "فورم", value: "form" },
  { label: "تطبيق", value: "app" },
  { label: "حجز موعد", value: "booking" },
];

const channelOptions = [
  { label: "Meta", value: "meta" },
  { label: "Google Ads", value: "google_ads" },
  { label: "TikTok Ads", value: "tiktok_ads" },
  { label: "Snapchat Ads", value: "snapchat_ads" },
  { label: "YouTube", value: "youtube" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "X", value: "x" },
];

const campaignDirections = [
  { label: "Prospecting", value: "prospecting" },
  { label: "Retargeting", value: "retargeting" },
  { label: "Mixed", value: "mixed" },
  { label: "Lead Generation", value: "lead_generation" },
  { label: "Conversion", value: "conversion" },
  { label: "Awareness", value: "awareness" },
  { label: "Testing", value: "testing" },
  { label: "لا أعرف", value: "unknown" },
];

export default function Step7_Channels({
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
      <QuestionCard label={localizeText(locale, "أين تريد أن تتم النتيجة النهائية؟", "Where should the final conversion happen?")}>
        <SingleSelect
          options={conversionDests}
          value={data.conversion_destination}
          onChange={(v) => setField("conversion_destination", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما القنوات التي تريد استخدامها؟", "Which channels do you want to use?")}>
        <MultiSelectChips
          options={channelOptions}
          value={data.ad_channels}
          onChange={(v) => setField("ad_channels", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "ما الأقرب لهدفك؟", "Which campaign direction is closest to your objective?")}>
        <SingleSelect
          options={campaignDirections}
          value={data.campaign_direction}
          onChange={(v) => setField("campaign_direction", v)}
        />
      </QuestionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

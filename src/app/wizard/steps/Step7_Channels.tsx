"use client";
import { useWizardStore } from "@/lib/store";
import {
  QuestionCard,
  SingleSelect,
  MultiSelectChips,
  StepNav,
} from "@/components/WizardComponents";

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

  return (
    <div>
      <QuestionCard label="أين تريد أن تتم النتيجة النهائية؟">
        <SingleSelect
          options={conversionDests}
          value={data.conversion_destination}
          onChange={(v) => setField("conversion_destination", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما القنوات التي تريد استخدامها؟">
        <MultiSelectChips
          options={channelOptions}
          value={data.ad_channels}
          onChange={(v) => setField("ad_channels", v)}
        />
      </QuestionCard>

      <QuestionCard label="ما الأقرب لهدفك؟">
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

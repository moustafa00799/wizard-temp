"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, MultiSelectChips, TextArea, StepNav } from "@/components/WizardComponents";

const assetOptions = [
  { label: "موقع", value: "website" },
  { label: "Landing Page", value: "landing_page" },
  { label: "متجر إلكتروني", value: "store" },
  { label: "واتساب بزنس", value: "whatsapp_business" },
  { label: "CRM", value: "crm" },
  { label: "صفحة فيسبوك", value: "facebook_page" },
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "Google Analytics", value: "ga4" },
  { label: "Pixel", value: "pixel" },
  { label: "CAPI", value: "capi" },
  { label: "كتالوج منتجات", value: "catalog" },
  { label: "لا يوجد شيء جاهز", value: "nothing_ready" },
];

const campaignStatusOptions = [
  { label: "نعم، ونجحت", value: "successful" },
  { label: "نعم، لكنها ضعيفة", value: "weak" },
  { label: "نعم، لكن بدون نتائج واضحة", value: "unclear" },
  { label: "لا، أول مرة", value: "none" },
];

const HAS_HISTORY = ["successful", "weak", "unclear"];

export default function Step4_Readiness({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, setField } = useWizardStore();
  const showPastNotes = data.previous_campaigns_status
    ? HAS_HISTORY.includes(data.previous_campaigns_status)
    : false;

  return (
    <div>
      <QuestionCard label="ما الأصول أو القنوات الموجودة الآن؟">
        <MultiSelectChips
          options={assetOptions}
          value={data.existing_assets}
          onChange={(v) => setField("existing_assets", v)}
        />
      </QuestionCard>

      <QuestionCard label="هل سبق تشغيل حملات من قبل؟">
        <SingleSelect
          options={campaignStatusOptions}
          value={data.previous_campaigns_status}
          onChange={(v) => {
            setField("previous_campaigns_status", v);
            // Clear notes if switching to "none"
            if (v === "none") setField("past_performance_notes", null);
          }}
        />
      </QuestionCard>

      {showPastNotes && (
        <QuestionCard label="اذكر أي أرقام أو ملاحظات من الحملات السابقة.">
          <TextArea
            placeholder="ميزانية، CPL، CPA، ROAS، CTR، أو أي ملاحظات مهمة"
            value={data.past_performance_notes ?? ""}
            onChange={(v) => setField("past_performance_notes", v || null)}
            rows={3}
          />
        </QuestionCard>
      )}

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

"use client";
import { useWizardStore } from "@/lib/store";
import { QuestionCard, SingleSelect, MultiSelectChips, TextArea, StepNav } from "@/components/WizardComponents";
import { localizeText } from "@/lib/i18n";

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
  { label: "لا، أول مرة", value: "first_time" },
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
  const locale = data.locale === "en" ? "en" : "ar";
  const showPastNotes = data.previous_campaigns_status
    ? HAS_HISTORY.includes(data.previous_campaigns_status)
    : false;

  return (
    <div>
      <QuestionCard label={localizeText(locale, "ما الأصول أو القنوات الموجودة الآن؟", "Which assets or channels are currently available?")}>
        <MultiSelectChips
          options={assetOptions}
          value={data.existing_assets}
          onChange={(v) => setField("existing_assets", v)}
        />
      </QuestionCard>

      <QuestionCard label={localizeText(locale, "هل سبق تشغيل حملات من قبل؟", "Have you run campaigns before?")}>
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
        <QuestionCard label={localizeText(locale, "اذكر أي أرقام أو ملاحظات من الحملات السابقة.", "Add any numbers or notes from previous campaigns.")}>
          <TextArea
            placeholder={localizeText(locale, "ميزانية، CPL، CPA، ROAS، CTR، أو أي ملاحظات مهمة", "Budget, CPL, CPA, ROAS, CTR, or any important notes")}
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
